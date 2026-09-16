from __future__ import annotations

import json
import threading
from pathlib import Path
from typing import Any

from anpr.core.config import ROOT
from anpr.core.time import utc_now


class JsonStore:
    def __init__(self, settings) -> None:
        storage = settings.app.get("storage", {})
        self.records_path = ROOT / storage.get("records_file", "data/json/anpr_records.jsonl")
        self.events_path = ROOT / storage.get("events_file", "data/json/pipeline_events.jsonl")
        self.snapshot_path = ROOT / storage.get("json_dir", "data/json") / "latest_snapshot.json"
        self.records_path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()
        self.latest: list[dict[str, Any]] = []
        self._load_tail()

    def _load_tail(self, n: int = 200) -> None:
        if not self.records_path.exists():
            return
        lines = self.records_path.read_text(encoding="utf-8").splitlines()[-n:]
        for line in lines:
            try:
                self.latest.append(json.loads(line))
            except json.JSONDecodeError:
                continue

    def append_event(self, event: dict[str, Any]) -> None:
        event = {**event, "stored_at": utc_now()}
        with self._lock:
            with self.events_path.open("a", encoding="utf-8") as handle:
                handle.write(json.dumps(event, ensure_ascii=False) + "\n")

    def upsert_record(self, record: dict[str, Any]) -> dict[str, Any]:
        record = {**record, "stored_at": utc_now()}
        with self._lock:
            with self.records_path.open("a", encoding="utf-8") as handle:
                handle.write(json.dumps(record, ensure_ascii=False) + "\n")
            self.latest.append(record)
            self.latest = self.latest[-300:]
            snapshot = {
                "updated_at": utc_now(),
                "count": len(self.latest),
                "records": self.latest[-50:],
            }
            self.snapshot_path.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False), encoding="utf-8")
        return record

    def list_records(self, limit: int = 50) -> list[dict[str, Any]]:
        return list(reversed(self.latest[-limit:]))
