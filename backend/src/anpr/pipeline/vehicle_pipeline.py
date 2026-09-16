from __future__ import annotations

import logging

import cv2

from anpr.core.time import utc_now
from anpr.ingestion.frame_store import get_frame_store
from anpr.kafka.bus import EventBus
from anpr.kafka.schemas import envelope
from anpr.perception.color_classifier import classify_vehicle_color
from anpr.perception.cropper import crop_bbox, save_crop
from anpr.perception.tracker import ByteLikeTracker, estimate_speed_kmh
from anpr.perception.vehicle_detector import VehicleDetector
from anpr.pipeline.state import RuntimeState
from anpr.viz.overlay import draw_overlay

logger = logging.getLogger(__name__)


class VehiclePipeline:
    def __init__(self, settings, bus: EventBus, state: RuntimeState, store) -> None:
        self.settings = settings
        self.bus = bus
        self.state = state
        self.store = store
        self.detector = VehicleDetector(settings.models)
        self.trackers: dict[str, ByteLikeTracker] = {}
        self.min_crop = tuple(settings.app.get("processing", {}).get("min_crop_size", [64, 64]))
        self.ocr_every = int(settings.app.get("processing", {}).get("ocr_every_n_frames", 12))
        self.save_crops = bool(settings.app.get("processing", {}).get("save_crops", True))

    def handle_frame(self, message: dict) -> None:
        payload = message["payload"]
        camera_id = message["camera_id"]
        frame_id = message.get("frame_id") or payload.get("frame_id")
        frame_path = payload.get("frame_path") or payload.get("live_path")
        frame = get_frame_store().get(frame_id, frame_path)
        if frame is None:
            return
        self.state.stats["frames"] += 1
        detections = self.detector.detect(frame)
        if payload.get("synthetic") and not detections:
            detections = self._synthetic_detections(payload)
        tracker = self.trackers.setdefault(camera_id, ByteLikeTracker())
        tracks = tracker.update(detections, payload.get("frame_index", 0))
        fps = float(payload.get("fps") or 15)
        calib = payload.get("calibration") or {}
        mpp = float(calib.get("meters_per_pixel", 0.04))
        smoothing = float(calib.get("speed_smoothing", 0.35))
        overlay_tracks = []
        for track in tracks:
            bbox = track["bbox"]
            crop = crop_bbox(frame, bbox)
            if crop is None:
                continue
            ch, cw = crop.shape[:2]
            if cw < self.min_crop[0] or ch < self.min_crop[1]:
                continue
            color = classify_vehicle_color(crop)
            speed_key = f"{camera_id}:{track['track_id']}"
            speed = estimate_speed_kmh(
                track["velocity_px"],
                fps,
                mpp,
                smoothing,
                self.state.previous_speed(speed_key),
            )
            self.state.remember_speed(speed_key, speed)
            should_ocr = track["hits"] % self.ocr_every == 1
            crop_path = None
            if self.save_crops and should_ocr:
                crop_name = f"{camera_id}_{track['track_id']}_{payload.get('frame_index')}.jpg"
                crop_path = save_crop(crop, "data/crops/vehicles", crop_name)
            geo = self._project(
                payload.get("location") or {},
                track["centroid"],
                payload.get("width", 1280),
                payload.get("height", 720),
            )
            vehicle_event = envelope(
                "vehicle.tracked",
                camera_id,
                {
                    "camera_name": payload.get("camera_name"),
                    "access_zone": payload.get("access_zone"),
                    "location": payload.get("location"),
                    "track_id": track["track_id"],
                    "vehicle_type": track["vehicle_type"],
                    "confidence": track["confidence"],
                    "bbox": bbox,
                    "centroid": track["centroid"],
                    "speed_kmh": speed,
                    "color": color,
                    "vehicle_crop_path": crop_path,
                    "geo": geo,
                    "hits": track["hits"],
                    "should_ocr": should_ocr,
                    "frame_index": payload.get("frame_index"),
                    "captured_at": utc_now(),
                },
                trace_id=message["trace_id"],
                frame_id=frame_id,
            )
            self.bus.publish("vehicles", vehicle_event, key=camera_id, principal="perception-service")
            if should_ocr:
                self.store.append_event(vehicle_event)
            self.state.stats["vehicles"] += 1
            overlay_tracks.append(vehicle_event["payload"])
        vis = draw_overlay(frame, overlay_tracks, payload.get("camera_name") or camera_id)
        ok_jpg, buf = cv2.imencode(".jpg", vis, [int(cv2.IMWRITE_JPEG_QUALITY), 70])
        if ok_jpg:
            self.state.set_live_jpeg(camera_id, buf.tobytes())
        self.state.set_camera_overlay(camera_id, {"tracks": overlay_tracks, "updated_at": utc_now()})

    def _synthetic_detections(self, payload: dict) -> list[dict]:
        idx = int(payload.get("frame_index") or 0)
        x = 80 + (idx * 8) % 900
        return [{"bbox": [float(x), 280.0, float(x + 260), 430.0], "confidence": 0.99, "class_id": 2, "vehicle_type": "car"}]

    def _project(self, location: dict, centroid: list[float], width: int, height: int) -> dict:
        lat = float(location.get("lat", 0))
        lng = float(location.get("lng", 0))
        dx = (centroid[0] / max(width, 1) - 0.5) * 0.0008
        dy = (0.5 - centroid[1] / max(height, 1)) * 0.0008
        return {"lat": round(lat + dy, 6), "lng": round(lng + dx, 6)}
