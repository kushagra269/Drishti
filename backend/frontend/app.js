const feedsEl = document.getElementById("feeds");
const rowsEl = document.getElementById("rows");
const busPill = document.getElementById("bus-pill");
const statPill = document.getElementById("stat-pill");
const clockPill = document.getElementById("clock-pill");
const plateForm = document.getElementById("plate-form");
const plateFile = document.getElementById("plate-file");
const plateResult = document.getElementById("plate-result");

const map = L.map("map").setView([28.614, 77.2095], 16);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap",
}).addTo(map);

const cameraMarkers = {};
const vehicleMarkers = {};

function cropUrl(path) {
  if (!path) return "";
  const norm = path.replaceAll("\\", "/");
  const idx = norm.toLowerCase().lastIndexOf("/data/crops/");
  if (idx >= 0) return "/crops/" + norm.slice(idx + "/data/crops/".length);
  return "/api/crop?path=" + encodeURIComponent(path);
}

async function boot() {
  const cameras = await fetch("/api/cameras").then((r) => r.json());
  cameras.filter((c) => c.enabled).forEach((cam) => {
    const card = document.createElement("article");
    card.className = "feed";
    card.innerHTML = `
      <img id="img-${cam.id}" alt="${cam.name}" />
      <div class="meta">
        <strong>${cam.name}</strong>
        <div>${cam.id} · ${cam.access_zone} · ${cam.source_type}</div>
        <div id="trk-${cam.id}">awaiting tracks…</div>
      </div>`;
    feedsEl.appendChild(card);
    if (cam.location) {
      cameraMarkers[cam.id] = L.marker([cam.location.lat, cam.location.lng])
        .addTo(map)
        .bindPopup(`<b>${cam.name}</b><br>${cam.access_zone}`);
    }
  });
  tick();
  setInterval(tick, 900);
  setInterval(refreshFrames, 350);
}

function refreshFrames() {
  document.querySelectorAll("article.feed img").forEach((img) => {
    const id = img.id.replace("img-", "");
    img.src = `/api/stream/${id}.jpg?t=${Date.now()}`;
  });
}

async function tick() {
  clockPill.textContent = new Date().toLocaleTimeString();
  let health;
  let snap;
  try {
    health = await fetch("/api/health").then((r) => r.json());
    snap = await fetch("/api/snapshot").then((r) => r.json());
  } catch {
    return;
  }
  busPill.textContent = `bus: ${health.bus}`;
  statPill.textContent = `${health.stats.records || 0} records · ${health.stats.vehicles || 0} vehicles`;

  Object.entries(snap.cameras || {}).forEach(([cameraId, payload]) => {
    const line = document.getElementById(`trk-${cameraId}`);
    if (!line) return;
    const tracks = payload.tracks || [];
    line.textContent = tracks.length
      ? tracks.map((t) => `#${t.track_id} ${t.vehicle_type} ${t.speed_kmh}km/h ${(t.color && t.color.color) || ""}`).join(" · ")
      : "no vehicles in frame";
    tracks.forEach((t) => {
      if (!t.geo) return;
      const key = `${cameraId}-${t.track_id}`;
      const html = `${t.vehicle_type} #${t.track_id}<br>${t.speed_kmh} km/h`;
      if (!vehicleMarkers[key]) {
        vehicleMarkers[key] = L.circleMarker([t.geo.lat, t.geo.lng], {
          radius: 8,
          color: "#3ee0b3",
          fillColor: "#3ee0b3",
          fillOpacity: 0.85,
        }).addTo(map).bindPopup(html);
      } else {
        vehicleMarkers[key].setLatLng([t.geo.lat, t.geo.lng]).setPopupContent(html);
      }
    });
  });

  const records = snap.stored || snap.records || [];
  rowsEl.innerHTML = records
    .slice(0, 40)
    .map((r) => {
      const crop = cropUrl(r.assets && r.assets.vehicle_crop);
      return `<tr>
        <td>${(r.produced_at || r.stored_at || "").slice(11, 19)}</td>
        <td>${r.camera_name || r.camera_id || ""}</td>
        <td>${r.track_id ?? ""}</td>
        <td class="plate">${(r.identification && r.identification.plate_text) || "—"}</td>
        <td>${(r.classification && r.classification.vehicle_type) || ""}</td>
        <td>${(r.classification && r.classification.color) || ""}</td>
        <td>${(r.classification && r.classification.speed_kmh) ?? ""}</td>
        <td>${crop ? `<img class="crop" src="${crop}" alt="crop" />` : ""}</td>
      </tr>`;
    })
    .join("");
}

plateForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = plateFile.files && plateFile.files[0];
  if (!file) {
    plateResult.textContent = "—";
    return;
  }
  plateResult.textContent = "Reading…";
  const body = new FormData();
  body.append("file", file);
  try {
    const res = await fetch("/api/read-plate", { method: "POST", body });
    const data = await res.json();
    if (!res.ok) {
      plateResult.textContent = data.error || "Failed";
      return;
    }
    plateResult.textContent = data.plate_text || "—";
  } catch {
    plateResult.textContent = "Failed";
  }
});

boot();
