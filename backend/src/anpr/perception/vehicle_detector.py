from __future__ import annotations

import logging

import numpy as np
import torch

logger = logging.getLogger(__name__)

VEHICLE_CLASS_IDS = {2, 3, 5, 7}
CLASS_NAMES = {2: "car", 3: "motorcycle", 5: "bus", 7: "truck"}


def resolve_device(preferred: str = "auto") -> str:
    if preferred != "auto":
        return preferred
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


class VehicleDetector:
    def __init__(self, models_cfg: dict) -> None:
        self.cfg = models_cfg["vehicle"]
        self.device = resolve_device(self.cfg.get("device", "auto"))
        self.model = None
        self._load()

    def _load(self) -> None:
        try:
            from ultralytics import YOLO

            weights = self.cfg.get("weights", "yolo11m.pt")
            logger.info("Loading YOLO11m vehicle model: %s", weights)
            self.model = YOLO(weights)
            self.model.to(self.device)
        except Exception as exc:
            logger.warning("Vehicle YOLO unavailable (%s); using empty detections", exc)
            self.model = None

    def detect(self, frame: np.ndarray) -> list[dict]:
        if self.model is None:
            return []
        results = self.model.predict(
            frame,
            imgsz=self.cfg.get("imgsz", 640),
            conf=self.cfg.get("conf", 0.45),
            iou=self.cfg.get("iou", 0.5),
            classes=sorted(VEHICLE_CLASS_IDS),
            verbose=False,
            device=self.device,
            max_det=30,
        )
        detections = []
        if not results:
            return detections
        boxes = results[0].boxes
        if boxes is None:
            return detections
        for box in boxes:
            cls_id = int(box.cls[0])
            xyxy = [float(v) for v in box.xyxy[0].tolist()]
            detections.append(
                {
                    "bbox": xyxy,
                    "confidence": float(box.conf[0]),
                    "class_id": cls_id,
                    "vehicle_type": CLASS_NAMES.get(cls_id, "vehicle"),
                }
            )
        return detections
