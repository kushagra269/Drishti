from __future__ import annotations

from collections import OrderedDict
from pathlib import Path

import cv2
import numpy as np

from anpr.core.config import ROOT

_CROPS: OrderedDict[str, np.ndarray] = OrderedDict()
_MAX = 64


def crop_bbox(frame: np.ndarray, bbox: list[float], pad: float = 0.04) -> np.ndarray | None:
    h, w = frame.shape[:2]
    x1, y1, x2, y2 = bbox
    bw, bh = x2 - x1, y2 - y1
    x1 = max(0, int(x1 - bw * pad))
    y1 = max(0, int(y1 - bh * pad))
    x2 = min(w, int(x2 + bw * pad))
    y2 = min(h, int(y2 + bh * pad))
    if x2 - x1 < 16 or y2 - y1 < 16:
        return None
    return frame[y1:y2, x1:x2].copy()


def save_crop(crop: np.ndarray, rel_dir: str, name: str, quality: int = 85) -> str | None:
    if crop is None or crop.size == 0:
        return None
    folder = ROOT / rel_dir
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / name
    key = str(path)
    _CROPS[key] = crop
    _CROPS.move_to_end(key)
    while len(_CROPS) > _MAX:
        _CROPS.popitem(last=False)
    try:
        ok, buf = cv2.imencode(".jpg", crop, [int(cv2.IMWRITE_JPEG_QUALITY), quality])
        if ok:
            tmp = path.with_suffix(".jpg.tmp")
            tmp.write_bytes(buf.tobytes())
            tmp.replace(path)
    except OSError:
        pass
    return key


def load_crop(path: str | None) -> np.ndarray | None:
    if not path:
        return None
    if path in _CROPS:
        return _CROPS[path]
    try:
        data = np.fromfile(path, dtype=np.uint8)
        if data.size:
            return cv2.imdecode(data, cv2.IMREAD_COLOR)
    except OSError:
        return None
    return None
