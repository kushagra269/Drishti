from __future__ import annotations

from typing import Any

SCHEMA_VERSION = "1.0.0"


def envelope(
    event_type: str,
    camera_id: str,
    payload: dict[str, Any],
    *,
    trace_id: str,
    frame_id: str | None = None,
) -> dict[str, Any]:
    from anpr.core.time import utc_now

    return {
        "schema_version": SCHEMA_VERSION,
        "event_type": event_type,
        "camera_id": camera_id,
        "frame_id": frame_id,
        "trace_id": trace_id,
        "produced_at": utc_now(),
        "payload": payload,
    }
