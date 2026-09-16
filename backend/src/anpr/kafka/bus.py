from __future__ import annotations

import json
import logging
import queue
import threading
import time
from collections import defaultdict
from typing import Any, Callable

from anpr.core.config import dumps
from anpr.kafka.acl import AccessControl, AccessDenied

logger = logging.getLogger(__name__)


class LocalBroker:
    def __init__(self) -> None:
        self._topics: dict[str, queue.Queue] = defaultdict(lambda: queue.Queue(maxsize=200))
        self._latest: dict[str, dict[str, str]] = defaultdict(dict)
        self._lock = threading.Lock()

    def _is_frame_topic(self, topic: str) -> bool:
        return topic.endswith(".frames.raw") or topic.endswith("frames.raw")

    def publish(self, topic: str, value: str, key: str | None = None) -> None:
        if self._is_frame_topic(topic) and key:
            with self._lock:
                self._latest[topic][key] = value
            return
        q = self._topics[topic]
        if q.full():
            try:
                q.get_nowait()
            except queue.Empty:
                pass
        q.put((key, value))

    def poll(self, topic: str, timeout: float = 0.2) -> tuple[str | None, str] | None:
        if self._is_frame_topic(topic):
            deadline = time.time() + timeout
            while time.time() < deadline:
                with self._lock:
                    bucket = self._latest.get(topic)
                    if bucket:
                        key, value = bucket.popitem()
                        return key, value
                time.sleep(0.02)
            return None
        try:
            return self._topics[topic].get(timeout=timeout)
        except queue.Empty:
            return None


class EventBus:
    def __init__(self, settings) -> None:
        self.settings = settings
        kafka_block = settings.kafka.get("kafka", {})
        self.bootstrap = kafka_block.get("bootstrap_servers", "localhost:9092")
        self.topics = settings.kafka.get("topics", {})
        self.acl = AccessControl(settings.kafka)
        self.principal = settings.kafka_acl_principal
        self.fallback = kafka_block.get("local_fallback", True)
        self.local = LocalBroker()
        self._producer = None
        self.mode = "local"
        self._connect()

    def _connect(self) -> None:
        result: dict[str, Any] = {}

        def attempt() -> None:
            try:
                from kafka import KafkaProducer

                producer = KafkaProducer(
                    bootstrap_servers=self.bootstrap,
                    client_id=self.settings.kafka_client_id,
                    value_serializer=lambda v: v.encode("utf-8") if isinstance(v, str) else v,
                    key_serializer=lambda v: v.encode("utf-8") if isinstance(v, str) else v,
                    acks="0",
                    retries=0,
                    linger_ms=5,
                    request_timeout_ms=2000,
                    api_version_auto_timeout_ms=2000,
                )
                producer.partitions_for(self.topics.get("frames", "anpr.frames.raw"))
                result["producer"] = producer
            except Exception as exc:
                result["error"] = exc

        worker = threading.Thread(target=attempt, daemon=True, name="kafka-connect")
        worker.start()
        worker.join(3)
        if "producer" in result:
            self._producer = result["producer"]
            self.mode = "kafka"
            logger.info("Kafka producer connected at %s", self.bootstrap)
            return
        self._producer = None
        self.mode = "local"
        if not self.fallback:
            raise result.get("error") or TimeoutError("Kafka connect timed out")
        logger.warning("Kafka unavailable (%s); using in-process broker", result.get("error") or "timeout")

    def topic(self, name: str) -> str:
        return self.topics[name]

    def publish(self, topic_key: str, message: dict[str, Any], *, key: str, principal: str | None = None) -> None:
        principal = principal or self.principal
        topic = self.topic(topic_key) if topic_key in self.topics else topic_key
        self.acl.assert_allowed(principal, topic, "produce")
        payload = dumps(message)
        self.local.publish(topic, payload, key=key)
        if self._producer is not None:
            try:
                self._producer.send(topic, value=payload, key=key)
            except Exception as exc:
                logger.debug("Kafka publish skipped: %s", exc)
                self.mode = "local"

    def consume_forever(
        self,
        topic_key: str,
        handler: Callable[[dict[str, Any]], None],
        *,
        group_id: str,
        principal: str | None = None,
        stop_event: threading.Event | None = None,
    ) -> None:
        principal = principal or self.principal
        topic = self.topic(topic_key) if topic_key in self.topics else topic_key
        self.acl.assert_allowed(principal, topic, "consume")
        stop_event = stop_event or threading.Event()
        logger.info("Consuming %s as %s group=%s", topic, principal, group_id)
        while not stop_event.is_set():
            item = self.local.poll(topic, timeout=0.15)
            if not item:
                continue
            raw = item[1]
            try:
                handler(json.loads(raw))
            except AccessDenied:
                raise
            except Exception:
                logger.exception("Failed handling message on %s", topic)
