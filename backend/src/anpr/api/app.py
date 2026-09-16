from __future__ import annotations

import json
from pathlib import Path

import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles

from anpr.core.config import ROOT, Settings
from anpr.pipeline.runner import Platform

settings = Settings.load()
platform: Platform | None = None
app = FastAPI(title="ANPR Platform", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND = ROOT / "frontend"
CROPS = ROOT / "data" / "crops"
JSON_DIR = ROOT / "data" / "json"


def _platform() -> Platform:
    if platform is None:
        raise RuntimeError("platform not started")
    return platform


@app.on_event("startup")
def _startup() -> None:
    global platform
    import os

    os.environ.setdefault("OMP_NUM_THREADS", "1")
    os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")
    from anpr.core.paths import ensure_runtime_dirs

    ensure_runtime_dirs(settings)
    platform = Platform(settings)
    platform.start()


@app.on_event("shutdown")
def _shutdown() -> None:
    if platform is not None:
        platform.stop()


@app.get("/api/health")
def health():
    p = _platform()
    return {
        "status": "ok",
        "bus": p.bus.mode,
        "stats": p.state.stats,
    }


@app.get("/api/cameras")
def cameras():
    return [
        {
            "id": cam["id"],
            "name": cam["name"],
            "enabled": cam.get("enabled", True),
            "source_type": cam.get("source_type"),
            "location": cam.get("location"),
            "access_zone": cam.get("access_zone"),
        }
        for cam in settings.cameras
    ]


@app.get("/api/snapshot")
def snapshot():
    p = _platform()
    data = p.state.snapshot()
    data["stored"] = p.store.list_records(80)
    return data


@app.get("/api/records")
def records(limit: int = 50):
    return _platform().store.list_records(limit)


@app.get("/api/records.json")
def records_file():
    path = _platform().store.snapshot_path
    if path.exists():
        return FileResponse(path, media_type="application/json")
    return JSONResponse({"records": []})


@app.get("/api/stream/{camera_id}.jpg")
def live_jpeg(camera_id: str):
    data = _platform().state.get_live_jpeg(camera_id)
    if data:
        return Response(content=data, media_type="image/jpeg", headers={"Cache-Control": "no-store"})
    path = JSON_DIR / f"live_{camera_id}.jpg"
    if not path.exists():
        return JSONResponse({"error": "no frame yet"}, status_code=404)
    return FileResponse(path, media_type="image/jpeg", headers={"Cache-Control": "no-store"})


@app.get("/api/crop")
def crop(path: str):
    target = Path(path)
    allowed = ROOT / "data" / "crops"
    try:
        target.resolve().relative_to(allowed.resolve())
    except ValueError:
        return JSONResponse({"error": "forbidden"}, status_code=403)
    if not target.exists():
        return JSONResponse({"error": "missing"}, status_code=404)
    return FileResponse(target)


@app.post("/api/read-plate")
async def read_plate(file: UploadFile = File(...)):
    """OCR an uploaded number-plate image; returns only the plate number."""
    data = await file.read()
    if not data:
        return JSONResponse({"error": "empty file"}, status_code=400)
    arr = np.frombuffer(data, dtype=np.uint8)
    image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if image is None:
        return JSONResponse({"error": "invalid image"}, status_code=400)
    ocr = _platform().plate_pipeline.reader.read(image)
    return {"plate_text": ocr.get("text") or ""}


@app.websocket("/ws/live")
async def ws_live(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            await ws.receive_text()
            await ws.send_text(json.dumps(_platform().state.snapshot(), default=str))
    except WebSocketDisconnect:
        return


@app.get("/", response_class=HTMLResponse)
def index():
    return (FRONTEND / "index.html").read_text(encoding="utf-8")


if FRONTEND.exists():
    app.mount("/static", StaticFiles(directory=FRONTEND), name="static")
if CROPS.exists():
    app.mount("/crops", StaticFiles(directory=CROPS), name="crops")
