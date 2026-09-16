from __future__ import annotations

import logging
import re

import cv2
import numpy as np

logger = logging.getLogger(__name__)

PLATE_CLEAN = re.compile(r"[^A-Z0-9]")


class PaddleOCRReader:
    def __init__(self, models_cfg: dict) -> None:
        self.cfg = models_cfg["ocr"]
        self.ocr = None
        self._load()

    def _load(self) -> None:
        try:
            from paddleocr import PaddleOCR

            lang = self.cfg.get("lang", "en")
            use_angle = bool(self.cfg.get("use_angle_cls", True))
            logger.info("Loading PaddleOCR (lang=%s)", lang)
            try:
                self.ocr = PaddleOCR(use_angle_cls=use_angle, lang=lang, show_log=False)
            except TypeError:
                try:
                    self.ocr = PaddleOCR(use_textline_orientation=use_angle, lang=lang)
                except TypeError:
                    self.ocr = PaddleOCR(lang=lang)
        except Exception as exc:
            logger.warning("PaddleOCR unavailable (%s)", exc)
            self.ocr = None

    def read(self, plate_crop: np.ndarray) -> dict:
        if plate_crop is None or plate_crop.size == 0:
            return {"text": "", "raw_text": "", "confidence": 0.0}
        if self.ocr is None:
            return {"text": "", "raw_text": "", "confidence": 0.0}

        image = self._enhance(plate_crop)
        lines = self._run_ocr(image)
        if not lines:
            return {"text": "", "raw_text": "", "confidence": 0.0}

        raw_parts = [t for t, _ in lines]
        confs = [c for _, c in lines]
        raw = " ".join(raw_parts).strip()
        cleaned = PLATE_CLEAN.sub("", raw.upper())
        confidence = float(sum(confs) / len(confs)) if confs else 0.0
        return {
            "text": cleaned,
            "raw_text": raw,
            "confidence": confidence,
        }

    def _run_ocr(self, image: np.ndarray) -> list[tuple[str, float]]:
        result = None
        try:
            result = self.ocr.ocr(image, cls=True)
        except TypeError:
            try:
                result = self.ocr.ocr(image)
            except Exception:
                result = None
        if result is None:
            try:
                result = self.ocr.predict(image)
            except Exception as exc:
                logger.warning("PaddleOCR inference failed: %s", exc)
                return []

        return self._parse_result(result)

    def _parse_result(self, result) -> list[tuple[str, float]]:
        lines: list[tuple[str, float]] = []
        if not result:
            return lines

        # Classic PaddleOCR: [ [ [box], (text, conf) ], ... ] or None page
        page = result[0] if isinstance(result, list) and result else result
        if page is None:
            return lines

        if isinstance(page, dict):
            texts = page.get("rec_texts") or page.get("texts") or []
            scores = page.get("rec_scores") or page.get("scores") or []
            for i, text in enumerate(texts):
                conf = float(scores[i]) if i < len(scores) else 0.0
                if text:
                    lines.append((str(text), conf))
            return lines

        if isinstance(result, list) and result and isinstance(result[0], dict):
            for item in result:
                lines.extend(self._parse_result([item]))
            return lines

        for item in page if isinstance(page, list) else []:
            if not item:
                continue
            if isinstance(item, (list, tuple)) and len(item) >= 2:
                meta = item[1]
                if isinstance(meta, (list, tuple)) and len(meta) >= 2:
                    lines.append((str(meta[0]), float(meta[1])))
                elif isinstance(meta, str):
                    lines.append((meta, 0.0))
        return lines

    def _enhance(self, crop: np.ndarray) -> np.ndarray:
        h, w = crop.shape[:2]
        if h < 32 or w < 80:
            crop = cv2.resize(crop, (max(w * 3, 160), max(h * 3, 48)), interpolation=cv2.INTER_CUBIC)
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        gray = cv2.normalize(gray, None, 0, 255, cv2.NORM_MINMAX)
        return cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
