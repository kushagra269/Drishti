from __future__ import annotations

import logging
import threading

from anpr.core.config import Settings
from anpr.ingestion.camera_worker import CameraWorker
from anpr.kafka.bus import EventBus
from anpr.pipeline.assembler import RecordAssembler
from anpr.pipeline.plate_pipeline import PlatePipeline
from anpr.pipeline.state import RuntimeState
from anpr.pipeline.vehicle_pipeline import VehiclePipeline
from anpr.storage.json_store import JsonStore

logger = logging.getLogger(__name__)


class Platform:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.bus = EventBus(settings)
        self.state = RuntimeState()
        self.state.stats["bus_mode"] = self.bus.mode
        self.store = JsonStore(settings)
        self.stop_event = threading.Event()
        self.threads: list[threading.Thread] = []
        self.vehicle_pipeline = VehiclePipeline(settings, self.bus, self.state, self.store)
        self.plate_pipeline = PlatePipeline(settings, self.bus, self.state, self.store)
        self.assembler = RecordAssembler(self.bus, self.state, self.store)

    def start(self) -> None:
        target_fps = float(self.settings.app.get("processing", {}).get("target_fps", 10))
        for camera in self.settings.cameras:
            if not camera.get("enabled", True):
                continue
            cam = dict(camera)
            cam["max_frame_width"] = int(self.settings.app.get("processing", {}).get("max_frame_width", 960))
            worker = CameraWorker(cam, self.bus, self.stop_event, target_fps=target_fps, state=self.state)
            worker.start()
            self.threads.append(worker)
            logger.info("Camera enabled: %s (%s)", camera["id"], camera.get("source"))

        workers = [
            ("perception-vehicles", "frames", self.vehicle_pipeline.handle_frame, "perception-service"),
            ("ocr-plates", "vehicles", self.plate_pipeline.handle_vehicle, "ocr-service"),
            ("assemble-vehicles", "vehicles", self.assembler.handle_vehicle, "assembler-service"),
            ("assemble-plates", "plates", self.assembler.handle_plate, "assembler-service"),
        ]
        for group, topic, handler, principal in workers:
            thread = threading.Thread(
                target=self.bus.consume_forever,
                kwargs={
                    "topic_key": topic,
                    "handler": handler,
                    "group_id": group,
                    "principal": principal,
                    "stop_event": self.stop_event,
                },
                daemon=True,
                name=group,
            )
            thread.start()
            self.threads.append(thread)
        logger.info("ANPR platform started with bus=%s", self.bus.mode)

    def stop(self) -> None:
        self.stop_event.set()
