from __future__ import annotations

import logging
import os
import threading
from collections import OrderedDict

import cv2
import numpy as np

logger = logging.getLogger(__name__)


class FrameStore:
    """Keep recent BGR frames in RAM. Video pipelines must not depend on disk JPEGs."""

    def __init__(self, keep: int = 24) -> None:
        self.keep = keep
        self._lock = threading.Lock()
        self._frames: OrderedDict[str, np.ndarray] = OrderedDict()

    def put(self, camera_id: str, frame_id: str, frame: np.ndarray, quality: int = 80) -> str:
        del quality
        key = frame_id
        with self._lock:
            self._frames[key] = frame
            self._frames.move_to_end(key)
            while len(self._frames) > self.keep:
                self._frames.popitem(last=False)
        return key

    def get(self, frame_id: str | None, path: str | None = None) -> np.ndarray | None:
        if frame_id:
            with self._lock:
                hit = self._frames.get(frame_id)
            if hit is not None:
                return hit
        if path:
            with self._lock:
                hit = self._frames.get(path)
            if hit is not None:
                return hit
            if os.path.isfile(path):
                try:
                    data = np.fromfile(path, dtype=np.uint8)
                    if data.size:
                        return cv2.imdecode(data, cv2.IMREAD_COLOR)
                except OSError:
                    return None
        return None


_STORE: FrameStore | None = None
_LOCK = threading.Lock()


def get_frame_store() -> FrameStore:
    global _STORE
    with _LOCK:
        if _STORE is None:
            _STORE = FrameStore()
        return _STORE
