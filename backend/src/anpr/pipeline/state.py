from __future__ import annotations

import threading
from typing import Any


class RuntimeState:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.cameras: dict[str, dict[str, Any]] = {}
        self.tracks: dict[str, dict[int, dict[str, Any]]] = {}
        self.records: list[dict[str, Any]] = []
        self.speed_memory: dict[str, float] = {}
        self.live_jpegs: dict[str, bytes] = {}
        self.stats = {
            "frames": 0,
            "vehicles": 0,
            "plates": 0,
            "records": 0,
            "bus_mode": "local",
        }

    def set_camera_overlay(self, camera_id: str, payload: dict[str, Any]) -> None:
        with self._lock:
            self.cameras[camera_id] = payload

    def get_camera_overlay(self, camera_id: str) -> dict[str, Any]:
        with self._lock:
            return dict(self.cameras.get(camera_id, {}))

    def set_live_jpeg(self, camera_id: str, data: bytes) -> None:
        with self._lock:
            self.live_jpegs[camera_id] = data

    def get_live_jpeg(self, camera_id: str) -> bytes | None:
        with self._lock:
            return self.live_jpegs.get(camera_id)

    def remember_speed(self, key: str, value: float) -> float:
        with self._lock:
            self.speed_memory[key] = value
            return value

    def previous_speed(self, key: str) -> float | None:
        with self._lock:
            return self.speed_memory.get(key)

    def push_record(self, record: dict[str, Any]) -> None:
        with self._lock:
            self.records.append(record)
            self.records = self.records[-200:]
            self.stats["records"] += 1

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            return {
                "stats": dict(self.stats),
                "cameras": {k: v for k, v in self.cameras.items()},
                "records": list(reversed(self.records[-80:])),
            }
