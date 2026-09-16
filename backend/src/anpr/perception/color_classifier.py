from __future__ import annotations

import cv2
import numpy as np

COLOR_MAP = [
    ("black", (0, 0, 0)),
    ("white", (255, 255, 255)),
    ("silver", (192, 192, 192)),
    ("gray", (128, 128, 128)),
    ("red", (200, 30, 30)),
    ("blue", (30, 60, 180)),
    ("navy", (10, 25, 90)),
    ("green", (30, 140, 50)),
    ("yellow", (230, 200, 40)),
    ("orange", (230, 120, 20)),
    ("brown", (110, 70, 40)),
    ("maroon", (120, 20, 30)),
]


def _nearest_name(bgr: np.ndarray) -> str:
    b, g, r = [float(x) for x in bgr]
    best, best_d = "unknown", 1e9
    for name, (rr, gg, bb) in COLOR_MAP:
        d = (r - rr) ** 2 + (g - gg) ** 2 + (b - bb) ** 2
        if d < best_d:
            best, best_d = name, d
    return best


def classify_vehicle_color(crop: np.ndarray) -> dict:
    if crop is None or crop.size == 0:
        return {"color": "unknown", "rgb": [0, 0, 0], "confidence": 0.0}
    h, w = crop.shape[:2]
    body = crop[int(h * 0.15) : int(h * 0.75), int(w * 0.1) : int(w * 0.9)]
    if body.size == 0:
        body = crop
    small = cv2.resize(body, (48, 48), interpolation=cv2.INTER_AREA)
    hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)
    mask = (hsv[:, :, 2] > 30) & (hsv[:, :, 2] < 245)
    pixels = small.reshape(-1, 3).astype(np.float32)
    flat = mask.reshape(-1)
    filtered = pixels[flat] if flat.any() else pixels
    dominant = filtered.mean(axis=0)
    name = _nearest_name(dominant)
    rgb = [int(dominant[2]), int(dominant[1]), int(dominant[0])]
    return {"color": name, "rgb": rgb, "confidence": 0.75}
