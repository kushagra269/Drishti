from __future__ import annotations

import logging
from pathlib import Path

import cv2
import numpy as np

from anpr.core.config import ROOT

logger = logging.getLogger(__name__)


class VideoSource:
    def __init__(self, camera: dict) -> None:
        self.camera = camera
        self.capture: cv2.VideoCapture | None = None
        self._synthetic_tick = 0
        self.max_width = int(camera.get("max_frame_width") or 960)

    def open(self) -> None:
        source = self.camera.get("source", "0")
        source_type = self.camera.get("source_type", "file")
        if source_type == "webcam" or str(source).isdigit():
            self.capture = cv2.VideoCapture(int(source))
        else:
            path = ROOT / source if not Path(str(source)).is_absolute() else Path(source)
            if path.exists():
                logger.info("Opening video %s for %s", path, self.camera["id"])
                self.capture = cv2.VideoCapture(str(path))
                self.capture.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            else:
                logger.warning("Video file missing at %s; synthetic frames for %s", path, self.camera["id"])
                self.capture = None
        if self.capture is not None and not self.capture.isOpened():
            logger.warning("Could not open source %s for %s", source, self.camera["id"])
            self.capture = None

    def read(self) -> tuple[bool, np.ndarray | None]:
        if self.capture is not None:
            ok, frame = self.capture.read()
            if ok:
                return True, self._downscale(frame)
            if self.camera.get("source_type") == "file":
                self.capture.set(cv2.CAP_PROP_POS_FRAMES, 0)
                ok, frame = self.capture.read()
                if ok:
                    return True, self._downscale(frame)
        return True, self._synthetic_frame()

    def fps(self) -> float:
        if self.capture is not None:
            value = self.capture.get(cv2.CAP_PROP_FPS) or 0
            if value > 1:
                return float(value)
        return 15.0

    def _downscale(self, frame: np.ndarray) -> np.ndarray:
        h, w = frame.shape[:2]
        if w <= self.max_width:
            return frame
        scale = self.max_width / float(w)
        return cv2.resize(frame, (self.max_width, int(h * scale)), interpolation=cv2.INTER_AREA)

    def _synthetic_frame(self) -> np.ndarray:
        self._synthetic_tick += 1
        frame = np.zeros((720, 1280, 3), dtype=np.uint8)
        frame[:] = (28, 32, 38)
        cv2.putText(frame, f"{self.camera['name']} | SYNTHETIC FEED", (40, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (180, 220, 255), 2)
        x = 80 + (self._synthetic_tick * 8) % 900
        cv2.rectangle(frame, (x, 280), (x + 260, 430), (40, 90, 210), -1)
        return frame

    def close(self) -> None:
        if self.capture is not None:
            self.capture.release()
