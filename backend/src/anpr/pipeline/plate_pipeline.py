from __future__ import annotations

import logging

from anpr.core.time import utc_now
from anpr.kafka.bus import EventBus
from anpr.kafka.schemas import envelope
from anpr.ocr.paddleocr_reader import PaddleOCRReader
from anpr.ocr.plate_detector import PlateDetector
from anpr.perception.cropper import crop_bbox, load_crop, save_crop
from anpr.pipeline.state import RuntimeState

logger = logging.getLogger(__name__)


class PlatePipeline:
    """Number plate stage: vehicle crop in → YOLO plate → PaddleOCR."""

    def __init__(self, settings, bus: EventBus, state: RuntimeState, store) -> None:
        self.settings = settings
        self.bus = bus
        self.state = state
        self.store = store
        self.plate_detector = PlateDetector(settings.models)
        self.reader = PaddleOCRReader(settings.models)
        self.min_conf = float(settings.app.get("processing", {}).get("min_plate_confidence", 0.35))

    def handle_vehicle(self, message: dict) -> None:
        payload = message["payload"]
        if not payload.get("should_ocr"):
            return
        crop_path = payload.get("vehicle_crop_path")
        if not crop_path:
            return
        vehicle_crop = load_crop(crop_path)
        if vehicle_crop is None:
            logger.warning("Vehicle crop missing: %s", crop_path)
            return
        plates = self.plate_detector.detect(vehicle_crop)
        if not plates:
            return
        best = plates[0]
        if best["confidence"] < self.min_conf and best["confidence"] < 0.4:
            return
        plate_img = crop_bbox(vehicle_crop, best["bbox"], pad=0.08)
        if plate_img is None:
            return
        ocr = self.reader.read(plate_img)
        plate_path = save_crop(
            plate_img,
            "data/crops/plates",
            f"{message['camera_id']}_{payload['track_id']}_{payload.get('frame_index')}_plate.jpg",
        )
        event = envelope(
            "plate.ocr",
            message["camera_id"],
            {
                "track_id": payload["track_id"],
                "vehicle_crop_path": crop_path,
                "plate_crop_path": plate_path,
                "plate_bbox": best["bbox"],
                "plate_confidence": best["confidence"],
                "plate_text": ocr["text"],
                "plate_raw_text": ocr["raw_text"],
                "ocr_confidence": ocr["confidence"],
                "ocr_engine": "paddleocr",
                "read_at": utc_now(),
            },
            trace_id=message["trace_id"],
            frame_id=message.get("frame_id"),
        )
        self.bus.publish("plates", event, key=message["camera_id"], principal="ocr-service")
        self.store.append_event(event)
        self.state.stats["plates"] += 1
