from __future__ import annotations

import cv2
import numpy as np

from anpr.core.config import ROOT


def draw_overlay(frame: np.ndarray, tracks: list[dict], camera_name: str) -> np.ndarray:
    vis = frame.copy()
    cv2.rectangle(vis, (0, 0), (vis.shape[1], 42), (12, 16, 22), -1)
    cv2.putText(vis, camera_name, (16, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (220, 230, 240), 2)
    for track in tracks:
        x1, y1, x2, y2 = [int(v) for v in track["bbox"]]
        color = track.get("color") or {}
        rgb = color.get("rgb") or [0, 180, 255]
        bgr = (int(rgb[2]), int(rgb[1]), int(rgb[0]))
        cv2.rectangle(vis, (x1, y1), (x2, y2), bgr, 2)
        label = f"ID {track['track_id']} {track.get('vehicle_type','')} {track.get('speed_kmh',0)}km/h {color.get('color','')}"
        plate = track.get("plate_text")
        if plate:
            label += f" | {plate}"
        cv2.rectangle(vis, (x1, max(0, y1 - 22)), (x1 + min(len(label) * 8, x2 - x1 + 80), y1), bgr, -1)
        cv2.putText(vis, label[:70], (x1 + 4, max(16, y1 - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (15, 15, 15), 1)
    return vis


def write_live(camera_id: str, frame: np.ndarray) -> str:
    path = ROOT / "data" / "json" / f"live_{camera_id}.jpg"
    path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(path), frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
    return str(path)
