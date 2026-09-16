from __future__ import annotations

import logging
from fnmatch import fnmatch
from typing import Any

logger = logging.getLogger(__name__)


class AccessDenied(PermissionError):
    pass


class AccessControl:
    def __init__(self, kafka_cfg: dict[str, Any]) -> None:
        self.rules = kafka_cfg.get("acl", [])

    def assert_allowed(self, principal: str, topic: str, operation: str) -> None:
        for rule in self.rules:
            if rule.get("principal") != principal:
                continue
            topics = rule.get("topics", [])
            ops = [op.lower() for op in rule.get("operations", [])]
            if operation.lower() not in ops and "admin" not in ops:
                continue
            if any(pattern == "*" or fnmatch(topic, pattern) for pattern in topics):
                return
        logger.warning("ACL deny principal=%s topic=%s op=%s", principal, topic, operation)
        raise AccessDenied(f"{principal} cannot {operation} on {topic}")
