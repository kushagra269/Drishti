"""Download YOLO11m vehicle weights and warm PaddleOCR models."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))


def main() -> None:
    from ultralytics import YOLO

    print("Downloading YOLO11m vehicle weights...")
    YOLO("yolo11m.pt")
    print("Warming PaddleOCR...")
    try:
        from paddleocr import PaddleOCR

        try:
            PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
        except TypeError:
            PaddleOCR(lang="en")
    except Exception as exc:
        print("PaddleOCR warm-up skipped:", exc)
    print("Done.")


if __name__ == "__main__":
    main()
