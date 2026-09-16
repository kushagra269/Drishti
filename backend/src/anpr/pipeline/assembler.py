from __future__ import annotations

from anpr.core.time import utc_now
from anpr.kafka.bus import EventBus
from anpr.kafka.schemas import envelope
from anpr.pipeline.state import RuntimeState


class RecordAssembler:
    def __init__(self, bus: EventBus, state: RuntimeState, store) -> None:
        self.bus = bus
        self.state = state
        self.store = store
        self.vehicles: dict[str, dict] = {}

    def handle_vehicle(self, message: dict) -> None:
        payload = message["payload"]
        key = f"{message['camera_id']}:{payload['track_id']}"
        current = self.vehicles.get(key, {})
        current.update(payload)
        current["camera_id"] = message["camera_id"]
        current["trace_id"] = message["trace_id"]
        current["frame_id"] = message.get("frame_id")
        self.vehicles[key] = current
        if payload.get("hits", 0) % 5 == 0:
            self._emit(key, current)

    def handle_plate(self, message: dict) -> None:
        payload = message["payload"]
        key = f"{message['camera_id']}:{payload['track_id']}"
        current = self.vehicles.get(key, {"camera_id": message["camera_id"], "track_id": payload["track_id"]})
        current.update(
            {
                "plate_text": payload.get("plate_text"),
                "plate_raw_text": payload.get("plate_raw_text"),
                "plate_crop_path": payload.get("plate_crop_path"),
                "plate_confidence": payload.get("plate_confidence"),
                "ocr_confidence": payload.get("ocr_confidence"),
                "vehicle_crop_path": payload.get("vehicle_crop_path", current.get("vehicle_crop_path")),
            }
        )
        self.vehicles[key] = current
        self._emit(key, current)

    def _emit(self, key: str, current: dict) -> None:
        record = {
            "record_id": key + ":" + str(current.get("frame_index", 0)),
            "camera_id": current.get("camera_id"),
            "camera_name": current.get("camera_name"),
            "access_zone": current.get("access_zone"),
            "track_id": current.get("track_id"),
            "identification": {
                "track_id": current.get("track_id"),
                "plate_text": current.get("plate_text") or "",
                "plate_raw_text": current.get("plate_raw_text") or "",
            },
            "classification": {
                "vehicle_type": current.get("vehicle_type"),
                "color": (current.get("color") or {}).get("color"),
                "color_rgb": (current.get("color") or {}).get("rgb"),
                "speed_kmh": current.get("speed_kmh"),
                "confidence": current.get("confidence"),
            },
            "tracking": {
                "bbox": current.get("bbox"),
                "centroid": current.get("centroid"),
                "hits": current.get("hits"),
                "geo": current.get("geo"),
            },
            "assets": {
                "vehicle_crop": current.get("vehicle_crop_path"),
                "plate_crop": current.get("plate_crop_path"),
            },
            "location": current.get("location"),
            "produced_at": utc_now(),
        }
        stored = self.store.upsert_record(record)
        event = envelope(
            "anpr.record",
            record["camera_id"] or "unknown",
            stored,
            trace_id=current.get("trace_id") or key,
            frame_id=current.get("frame_id"),
        )
        self.bus.publish("records", event, key=record["camera_id"] or "unknown", principal="assembler-service")
        self.state.push_record(stored)
