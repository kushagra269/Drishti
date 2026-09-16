from __future__ import annotations

import logging
from pathlib import Path

import cv2
import numpy as np

from anpr.perception.vehicle_detector import resolve_device

logger = logging.getLogger(__name__)


class PlateDetector:
    def __init__(self, models_cfg: dict) -> None:
        self.cfg = models_cfg["plate"]
        self.device = resolve_device(self.cfg.get("device", "auto"))
        self.model = None
        self._load()

    def _load(self) -> None:
        from ultralytics import YOLO

        weights = self.cfg.get("weights", "data/models/yolo11m_plate.pt")
        hub = self.cfg.get("fallback_hub")
        path = Path(weights)
        try:
            if path.exists():
                self.model = YOLO(str(path))
            else:
                if hub:
                    logger.info("Local plate weights missing; loading hub model %s", hub)
                    self.model = YOLO(hub)
                else:
                    logger.info("Local plate weights missing and no hub configured; using heuristic detector")
                    self.model = None
                    return
            self.model.to(self.device)
            logger.info("YOLO plate detector ready (%s)", self.cfg.get("architecture", "yolo11m"))
        except Exception as exc:
            logger.warning("Plate YOLO load failed (%s); heuristic detector will be used", exc)
            self.model = None

    def detect(self, vehicle_crop: np.ndarray) -> list[dict]:
        if vehicle_crop is None or vehicle_crop.size == 0:
            return []
        if self.model is not None:
            results = self.model.predict(
                vehicle_crop,
                imgsz=self.cfg.get("imgsz", 640),
                conf=self.cfg.get("conf", 0.35),
                iou=self.cfg.get("iou", 0.45),
                verbose=False,
                device=self.device,
            )
            detections = []
            if results and results[0].boxes is not None:
                for box in results[0].boxes:
                    detections.append(
                        {
                            "bbox": [float(v) for v in box.xyxy[0].tolist()],
                            "confidence": float(box.conf[0]),
                        }
                    )
            if detections:
                detections.sort(key=lambda d: d["confidence"], reverse=True)
                return detections
        return self._heuristic(vehicle_crop)

    def _heuristic(self, crop: np.ndarray) -> list[dict]:
        h, w = crop.shape[:2]
        region = crop[int(h * 0.45) :, :]
        gray = cv2.cvtColor(region, cv2.COLOR_BGR2GRAY)
        blur = cv2.bilateralFilter(gray, 7, 50, 50)
        edges = cv2.Canny(blur, 60, 160)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        candidates = []
        for cnt in contours:
            x, y, bw, bh = cv2.boundingRect(cnt)
            if bw < 40 or bh < 12:
                continue
            aspect = bw / max(bh, 1)
            if 1.8 <= aspect <= 6.5:
                candidates.append(
                    {
                        "bbox": [float(x), float(y + h * 0.45), float(x + bw), float(y + bh + h * 0.45)],
                        "confidence": 0.4,
                    }
                )
        candidates.sort(key=lambda d: (d["bbox"][2] - d["bbox"][0]) * (d["bbox"][3] - d["bbox"][1]), reverse=True)
        return candidates[:1]
