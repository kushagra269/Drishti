# DRISHTI

**Networked Engine for Traffic Recognition & Analytics**

DRISHTI is a city-wide AI-powered ANPR (Automatic Number Plate Recognition) command platform for smart-city operations rooms, traffic police, municipal control centres, and law-enforcement teams. It unifies live camera intelligence, vehicle trajectory reconstruction, corridor analytics, priority alerting, and watchlist enforcement into a single operator workspace.

Operators see the city as a living system: camera nodes, traffic heat, plate reads, blacklisted vehicles, and route-level congestion � all in one place, ready for decision making.

---

## What DRISHTI Does

DRISHTI connects a distributed camera grid to an ANPR recognition pipeline and an analytics layer. Each roadside or junction camera streams video into the recognition engine. Detected plates are timestamped, geolocated to the camera node, scored for confidence, and streamed into the command UI in near real time.

From there, operators can:

- Monitor city KPIs and live map activity from the **Dashboard**
- Watch multi-camera feeds with continuous plate OCR on **Live Cameras**
- Reconstruct a vehicle�s path across the grid on **Vehicle Trajectory**
- Analyse corridor congestion, hourly patterns, and top routes on **Traffic Analytics**
- Triage urgent events on **Priority Alerts**
- Maintain and hit-match vehicles on the **Blacklist**
- Tune appearance and operator preferences in **Settings**

---

## Product Modules

### 1. Command Dashboard
The home screen for the operations room.

- **KPI strip** � vehicles scanned, active cameras, alert volume, network health
- **Live city map** � Google road / satellite basemap with camera markers and traffic heat
- **Map layers** � toggle Cameras, Heatmaps, and Satellite view from controls under place search
- **Place search** � jump the map to corridors and landmarks
- **Live detection stream** � rolling ANPR reads as plates are recognised
- **Priority alert toasts** � right-side notifications (up to three), each with an auto-dismiss progress bar
- **Traffic flow chart & snapshot** � short-horizon demand and corridor status

### 2. Live Cameras
Multi-feed monitoring for the camera grid.

- Grid and focus views of active camera streams
- Inline **ANPR OCR panel** showing plate text, confidence, and timestamps as reads arrive
- Compact detection rows designed for dense operator scanning
- Loading overlays while a feed attaches to the recognition pipeline

### 3. Vehicle Trajectory
Plate-centric investigation across time and space.

- Search by full or partial plate
- Reconstruct the sequence of camera sightings
- Plot the path on the city map with ordered checkpoints
- Review timestamps, camera IDs, and corridor context for each hop

### 4. Traffic Analytics
Corridor intelligence for planners and duty officers.

- Filter by **route**, **date**, and **hour-range chips**
- Congestion and volume charts (Recharts)
- **Traffic heatmap grid** � hour � day intensity with hover vehicle counts shown below the grid (no layout jump)
- Top routes ranked by load
- Route map visualisation aligned with the live camera network

### 5. Priority Alerts
Operational triage for high-signal events.

- Severity-aware alert list
- Links into map / camera context
- Syncs with the dashboard toast stack so urgent hits surface without leaving the current page

### 6. Blacklist (Watchlist)
Enforcement list management.

- Add / edit / remove watched plates
- Reason and priority metadata
- Live hit matching against the ANPR stream
- Clear, centred operator layout for fast review

### 7. Settings
Operator and presentation controls.

- **Light / Dark theme** with persistence across sessions
- Theme applied globally via CSS design tokens (`data-theme`)
- Account / system preference surface for the command UI

---

## How the System Works (Architecture)

```text
???????????????????     ????????????????????????     ???????????????????????
?  Camera Grid    ???????  ANPR / OCR Engine   ???????  Event Ingest API   ?
?  (RTSP / WebRTC)?     ?  Plate + Confidence  ?     ?  Timestamp + Geo    ?
???????????????????     ????????????????????????     ???????????????????????
                                                               ?
         ?????????????????????????????????????????????????????????????????????????????
         ?                     ?                               ?                     ?
???????????????????  ???????????????????  ????????????????????????????  ???????????????????
?  Live Stream UI ?  ?  Alert Engine   ?  ?  Analytics Aggregator    ?  ?  Trajectory DB  ?
?  Dashboard Map  ?  ?  Toast + Alerts ?  ?  Routes / Hours / Heat   ?  ?  Plate paths    ?
???????????????????  ???????????????????  ????????????????????????????  ???????????????????
         ?                     ?                               ?                     ?
         ????????????????????????????????????? Zustand Store ?????????????????????????
                                              React Command UI
```

### Data flow (operator view)

1. **Capture** � Cameras publish continuous video to the edge/recognition layer.
2. **Recognise** � The ANPR engine extracts plate strings, vehicle class hints, and confidence scores.
3. **Enrich** � Events are tagged with camera ID, lat/lng, corridor, and wall-clock time.
4. **Distribute** � The frontend store receives live detections, alert injections, and analytics aggregates.
5. **Act** � Operators acknowledge alerts, open trajectories, filter analytics, or update the blacklist.

### Frontend application layer

| Layer | Role |
|--------|------|
| **Pages** | Route-level screens (Dashboard, Cameras, Trajectory, Analytics, Alerts, Blacklist, Settings) |
| **Layout** | Sidebar navigation + TopBar (time context, spacing, theme-aware chrome) |
| **Components** | Map, charts, toasts, OCR panel, analytics filters, heatmap grid |
| **Context** | Camera grid coordinates and node metadata (`CameraContext`) |
| **Store** | Zustand global state � alerts, toasts (max 3), time window, inject helpers |
| **Services** | Dashboard metrics, alerts, blacklist, analytics aggregates, trajectory search |
| **Types** | Shared TypeScript contracts for detections, alerts, toasts, blacklist entries |

### Mapping stack

- **Leaflet + React-Leaflet** for interactive map chrome
- **leaflet.heat** for density heat layers
- **Google tile endpoints** for roadmap (`lyrs=m`) and hybrid satellite (`lyrs=y`)
- Layer switches remount the tile layer so Satellite on/off is immediate and reliable

### Analytics stack

- **Recharts** for corridor volume / congestion series
- Filter bar with route, date, and hour-range chip controls
- Heatmap grid with fixed-height hover readout for stable layouts

---

## Tech Stack

| Area | Technology |
|------|------------|
| UI framework | React 19 |
| Language | TypeScript |
| Build tool | Vite 8 |
| Routing | React Router DOM 7 |
| Styling | Tailwind CSS 3, PostCSS, Autoprefixer, CSS design tokens |
| State | Zustand 5 |
| Maps | Leaflet 1.9, React-Leaflet 5, leaflet.heat |
| Charts | Recharts 3 |
| Motion | Framer Motion |
| Icons | Lucide React |
| Package manager | npm |

---

## Getting Started

### Layout

```text
NETRA2/
  frontend/     React + Vite command UI
  backend/      Always-on ANPR pipeline (FastAPI + YOLO + OCR)
  scripts/      Orchestration helpers (dev-all)
```

Live Cameras pulls annotated JPEG frames from the backend (`/api/stream/{camera_id}.jpg`) via the Vite proxy. Other DRISHTI pages are unchanged.

### Prerequisites

- Node.js 18+ (recommended: current LTS)
- npm 9+
- Python 3.11+ with ANPR deps (`backend/requirements.txt`), or a working Conda env that already has them

### Install

```bash
npm install --prefix frontend
```

### Development

Run UI + ANPR together (backend keep-alive + frontend):

```bash
npm run dev:all
```

Or separately:

```bash
npm run dev:backend   # ANPR on http://127.0.0.1:8080 (auto-restarts)
npm run dev:frontend  # UI on http://127.0.0.1:5173
```

Open `http://127.0.0.1:5173/cameras`, pick any location/camera � the feed is the live ANPR overlay stream.

### Production build

```bash
npm run build
npm run preview
```

`npm run build` runs TypeScript (`tsc`) then Vite�s production bundle into `frontend/dist/`.

---

## Application Routes

| Path | Screen | Purpose |
|------|--------|---------|
| `/` | Dashboard | KPIs, live map, detections, alert toasts |
| `/cameras` | Live Cameras | Multi-feed ANPR monitoring |
| `/trajectory` | Vehicle Trajectory | Plate path reconstruction |
| `/analytics` | Traffic Analytics | Filters, charts, traffic heatmap |
| `/alerts` | Priority Alerts | Alert triage |
| `/blacklist` | Blacklist | Watchlist management |
| `/settings` | Settings | Theme and preferences |

---

## Repository Layout

```text
src/
??? App.tsx                         # Router + camera provider shell
??? main.tsx                        # Boot + theme bootstrap
??? index.css                       # Global tokens, light/dark themes
??? components/
?   ??? analytics/                  # Filter bar, section shell, traffic heatmap grid
?   ??? common/                     # Alert toast stack, feed loading overlay
?   ??? dashboard/                  # Map, metrics, detections, charts, toolbar
?   ??? live/                       # Live OCR / ANPR scanner panel
??? context/
?   ??? CameraContext.tsx           # Camera node positions & metadata
??? data/
?   ??? analyticsRoutes.ts          # Corridor / route catalogue
?   ??? trajectoryDatabase.ts       # Trajectory sighting index
??? layout/
?   ??? AppLayout.tsx               # App chrome
?   ??? Sidebar.tsx                 # Primary navigation
?   ??? TopBar.tsx                  # Top bar & global controls
??? pages/
?   ??? DashboardPage.tsx
?   ??? LiveCamerasPage.tsx
?   ??? VehicleTrajectoryPage.tsx
?   ??? RouteAnalyticsPage.tsx
?   ??? AlertsPage.tsx
?   ??? BlacklistPage.tsx
?   ??? SettingsPage.tsx
??? services/
?   ??? alertService.ts
?   ??? blacklistService.ts
?   ??? dashboardService.ts
?   ??? analyticsMockService.ts     # Analytics aggregation service
?   ??? trajectorySearchService.ts
??? store/
?   ??? netraStore.ts               # Alerts, toasts, time window
??? types/
?   ??? blacklist.ts
?   ??? dashboard.ts
?   ??? toast.ts
??? utils/
    ??? theme.ts                    # Light / dark theme helpers
```

---

## Operator Workflows

### Rapid alert response
1. Toast appears on the right with plate, severity, and progress bar.
2. Open **Priority Alerts** for full context.
3. Jump to map / cameras as needed; update **Blacklist** if the plate should stay watched.

### Investigate a plate
1. Go to **Vehicle Trajectory**.
2. Enter the plate (full or partial).
3. Review ordered camera hops and the drawn path on the map.

### Assess corridor load
1. Open **Traffic Analytics**.
2. Pick route, date, and hour range chips.
3. Read charts and the heatmap grid; note top routes under load.

### Night operations
1. Open **Settings**.
2. Switch to **Dark** theme for low-glare command-room use.
3. Preference persists for the next session.

### Map awareness
1. On the Dashboard map, search a place.
2. Toggle **Cameras**, **Heatmaps**, and **Satellite** under the search field.
3. Keep the right toast stack visible for incoming priority hits.

---

## Design System Notes

- Sidebar brand block and navigation stay consistent across modules.
- Light and dark themes share the same component structure; colours resolve through CSS variables.
- Alert toasts are capped at three visible items to protect focus.
- Analytics and live OCR surfaces avoid cluttered chrome so operators can scan quickly.
- Map controls sit under place search on the left; operational popups stay on the right.

---

## Browser Support

Modern Chromium-based browsers (Chrome, Edge) are the primary target for command-centre deployments. Firefox and Safari are supported for general dashboard use; WebRTC / advanced feed features perform best on Chromium.

---

## License

Private project � all rights reserved unless otherwise stated by the repository owner.

---

## Team

Built for smart-city traffic intelligence demos and command-centre prototyping under the DRISHTI programme.
