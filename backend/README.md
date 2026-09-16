# ANPR Platform

Industrial-grade automatic number plate recognition for **multiple camera feeds**.

Video is ingested per camera, published onto Kafka, then processed in stages:

1. **YOLO11m** vehicle detection  
2. Tracking, vehicle type, speed, and color  
3. Cropped **vehicle-only** image  
4. **YOLO11m** number-plate detection on that crop (heuristic if plate weights missing)  
5. **PaddleOCR** character recognition  
6. Combined record written to **JSON** (database adapter later)

A dummy operations console shows live identification and a site map.

## Layout

```text
configs/                cameras, Kafka topics/ACL, models
src/anpr/
  ingestion/            video / RTSP / webcam workers
  kafka/                producer, in-process fallback, ACL
  perception/           YOLO11m vehicles, tracking, color, speed, crops
  ocr/                  YOLO11m plates + PaddleOCR
  pipeline/             staged workers + record assembler
  storage/              JSONL + snapshot (swap for SQL later)
  api/                  FastAPI + live JPEG + records
frontend/               live feeds, map, results table
data/json/              anpr_records.jsonl, latest_snapshot.json
data/crops/vehicles/    extracted vehicle images
data/crops/plates/      extracted plate images
```

## Kafka topics

| Topic | Purpose |
| --- | --- |
| `anpr.frames.raw` | camera frames (path + metadata) |
| `anpr.vehicles.tracked` | type, track id, speed, color, vehicle crop |
| `anpr.plates.ocr` | plate crop + TrOCR text |
| `anpr.records.final` | combined output |
| `anpr.deadletter` | reserved |

Access is enforced in `configs/kafka.yaml` (`acl`). Each pipeline stage uses a principal (`ingestion-service`, `perception-service`, `ocr-service`, `assembler-service`, `api-gateway`). Add cameras by appending `configs/cameras.yaml`; each camera is a Kafka key for partition affinity.

If Kafka is down, the platform keeps running on an in-process broker and dual-writes once Kafka is available.

## Run (Windows)

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Optional Kafka:

```powershell
docker compose up -d kafka
```

Pre-download models (first run also downloads automatically):

```powershell
python scripts/download_models.py
```

Start:

```powershell
$env:PYTHONPATH = "$pwd\src"
python -m anpr
```

Or:

```powershell
.\scripts\run_platform.ps1
.\scripts\run_platform.ps1 -WithKafka
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080).

## Cameras

Edit `configs/cameras.yaml`:

- `source_type: webcam` and `source: "0"`
- `source_type: file` and `source: data/videos/traffic.mp4`
- `source_type: rtsp` and an RTSP URL

Disable a camera with `enabled: false`. Place a traffic clip at `data/videos/traffic.mp4` for the parking camera. If a file or webcam is missing, that camera uses a synthetic moving vehicle so the console still works.

`calibration.meters_per_pixel` converts pixel motion to km/h. Tune it per camera.

## Models

| Stage | Model |
| --- | --- |
| Vehicles | Ultralytics **YOLO11m** (`yolo11m.pt`, COCO car/motorcycle/bus/truck) |
| Plates | Local `data/models/yolo11m_plate.pt` (heuristic fallback if missing) |
| OCR | **PaddleOCR** |

OCR never sees the full scene: only the cropped vehicle image is passed into plate YOLO, then the plate crop into OCR.

## JSON output

- `data/json/anpr_records.jsonl` — append-only combined records  
- `data/json/pipeline_events.jsonl` — stage events  
- `data/json/latest_snapshot.json` — last 50 records for the UI / `/api/records.json`

Record shape:

```json
{
  "camera_id": "cam-gate-a",
  "track_id": 4,
  "identification": { "plate_text": "MH12AB1234" },
  "classification": { "vehicle_type": "car", "color": "white", "speed_kmh": 32.1 },
  "tracking": { "bbox": [..], "geo": { "lat": 28.61, "lng": 77.20 } },
  "assets": { "vehicle_crop": "...", "plate_crop": "..." }
}
```

Replace `JsonStore` with a database implementation later without changing pipeline stages.

## API

- `GET /api/health`
- `GET /api/cameras`
- `GET /api/snapshot`
- `GET /api/records`
- `GET /api/stream/{camera_id}.jpg`
- `GET /api/records.json`
- `WS /ws/live`

## Hardware

GPU is used automatically when CUDA is available. CPU works; keep `processing.target_fps` modest (default 10).
