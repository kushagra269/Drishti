from __future__ import annotations

import math


def _iou(a: list[float], b: list[float]) -> float:
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    ix1, iy1 = max(ax1, bx1), max(ay1, by1)
    ix2, iy2 = min(ax2, bx2), min(ay2, by2)
    inter = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)
    area_a = max(0.0, ax2 - ax1) * max(0.0, ay2 - ay1)
    area_b = max(0.0, bx2 - bx1) * max(0.0, by2 - by1)
    union = area_a + area_b - inter + 1e-6
    return inter / union


class ByteLikeTracker:
    """Lightweight IOU tracker used with YOLO detections (ByteTrack-style association)."""

    def __init__(self, max_age: int = 30, min_iou: float = 0.3) -> None:
        self.max_age = max_age
        self.min_iou = min_iou
        self.next_id = 1
        self.tracks: dict[int, dict] = {}

    def update(self, detections: list[dict], frame_index: int) -> list[dict]:
        assigned: set[int] = set()
        outputs: list[dict] = []
        used_det: set[int] = set()

        pairs = []
        for track_id, track in self.tracks.items():
            for i, det in enumerate(detections):
                pairs.append((_iou(track["bbox"], det["bbox"]), track_id, i))
        pairs.sort(reverse=True)

        for iou, track_id, det_i in pairs:
            if iou < self.min_iou or track_id in assigned or det_i in used_det:
                continue
            det = detections[det_i]
            track = self.tracks[track_id]
            cx = (det["bbox"][0] + det["bbox"][2]) / 2
            cy = (det["bbox"][1] + det["bbox"][3]) / 2
            prev = track.get("centroid", (cx, cy))
            dx, dy = cx - prev[0], cy - prev[1]
            track.update(
                {
                    "bbox": det["bbox"],
                    "confidence": det["confidence"],
                    "vehicle_type": det["vehicle_type"],
                    "centroid": (cx, cy),
                    "last_seen": frame_index,
                    "hits": track.get("hits", 0) + 1,
                    "velocity_px": (dx, dy),
                }
            )
            assigned.add(track_id)
            used_det.add(det_i)
            outputs.append({"track_id": track_id, **det, "centroid": [cx, cy], "velocity_px": [dx, dy], "hits": track["hits"]})

        for i, det in enumerate(detections):
            if i in used_det:
                continue
            track_id = self.next_id
            self.next_id += 1
            cx = (det["bbox"][0] + det["bbox"][2]) / 2
            cy = (det["bbox"][1] + det["bbox"][3]) / 2
            self.tracks[track_id] = {
                "bbox": det["bbox"],
                "centroid": (cx, cy),
                "last_seen": frame_index,
                "hits": 1,
                "velocity_px": (0.0, 0.0),
                "vehicle_type": det["vehicle_type"],
            }
            outputs.append({"track_id": track_id, **det, "centroid": [cx, cy], "velocity_px": [0.0, 0.0], "hits": 1})

        stale = [tid for tid, tr in self.tracks.items() if frame_index - tr["last_seen"] > self.max_age]
        for tid in stale:
            self.tracks.pop(tid, None)
        return outputs


def estimate_speed_kmh(velocity_px: list[float], fps: float, meters_per_pixel: float, smoothing: float, previous: float | None) -> float:
    dx, dy = velocity_px
    pixels = math.hypot(dx, dy)
    meters = pixels * meters_per_pixel
    kmh = (meters * fps) * 3.6
    if previous is None:
        return round(kmh, 1)
    return round(previous * (1 - smoothing) + kmh * smoothing, 1)
