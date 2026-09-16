from __future__ import annotations

from pathlib import Path

from anpr.core.config import ROOT


def ensure_runtime_dirs(settings) -> None:
    storage = settings.app.get("storage", {})
    paths = [
        storage.get("json_dir", "data/json"),
        storage.get("vehicle_crop_dir", "data/crops/vehicles"),
        storage.get("plate_crop_dir", "data/crops/plates"),
        "data/videos",
        "data/models",
        "logs",
    ]
    for path in paths:
        Path(ROOT / path).mkdir(parents=True, exist_ok=True)
        keep = Path(ROOT / path) / ".gitkeep"
        if not keep.exists():
            keep.write_text("", encoding="utf-8")
