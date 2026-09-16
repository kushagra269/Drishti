from __future__ import annotations

import logging
import threading
import time
import uuid

import cv2

from anpr.core.time import utc_now
from anpr.ingestion.frame_store import get_frame_store
from anpr.ingestion.video_source import VideoSource
from anpr.kafka.bus import EventBus
from anpr.kafka.schemas import envelope
from anpr.viz.overlay import draw_overlay

logger = logging.getLogger(__name__)


class CameraWorker(threading.Thread):
    def __init__(self, camera: dict, bus: EventBus, stop_event: threading.Event, target_fps: float = 12, state=None) -> None:
        super().__init__(daemon=True, name=f"ingest-{camera['id']}")
        self.camera = camera
        self.bus = bus
        self.stop_event = stop_event
        self.target_fps = target_fps
        self.state = state
        self.source = VideoSource(camera)
        self.latest_jpeg: bytes | None = None
        self.frame_index = 0
        self.frames = get_frame_store()

    def run(self) -> None:
        self.source.open()
        interval = 1.0 / max(self.target_fps, 1)
        logger.info("Ingest started for %s source=%s", self.camera["id"], self.camera.get("source"))
        while not self.stop_event.is_set():
            started = time.time()
            try:
                ok, frame = self.source.read()
                if not ok or frame is None:
                    time.sleep(0.02)
                    continue
                self.frame_index += 1
                frame_id = f"{self.camera['id']}-{self.frame_index}"
                stored = self.frames.put(self.camera["id"], frame_id, frame)
                tracks = []
                if self.state is not None:
                    tracks = self.state.get_camera_overlay(self.camera["id"]).get("tracks") or []
                vis = draw_overlay(frame, tracks, self.camera["name"])
                ok_jpg, buf = cv2.imencode(".jpg", vis, [int(cv2.IMWRITE_JPEG_QUALITY), 70])
                if ok_jpg:
                    jpeg = buf.tobytes()
                    self.latest_jpeg = jpeg
                    if self.state is not None:
                        self.state.set_live_jpeg(self.camera["id"], jpeg)
                self.bus.publish(
                    "frames",
                    envelope(
                        "frame.raw",
                        self.camera["id"],
                        {
                            "camera_name": self.camera["name"],
                            "location": self.camera.get("location", {}),
                            "access_zone": self.camera.get("access_zone"),
                            "frame_index": self.frame_index,
                            "fps": self.source.fps(),
                            "calibration": self.camera.get("calibration", {}),
                            "width": int(frame.shape[1]),
                            "height": int(frame.shape[0]),
                            "frame_id": frame_id,
                            "frame_path": stored,
                            "live_path": stored,
                            "synthetic": self.source.capture is None,
                            "captured_at": utc_now(),
                        },
                        trace_id=str(uuid.uuid4()),
                        frame_id=frame_id,
                    ),
                    key=self.camera["id"],
                    principal="ingestion-service",
                )
            except Exception:
                logger.exception("Ingest failed for %s", self.camera["id"])
                time.sleep(0.05)
            time.sleep(max(0.0, interval - (time.time() - started)))
        self.source.close()
