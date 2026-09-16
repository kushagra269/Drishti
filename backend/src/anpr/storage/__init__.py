from __future__ import annotations

"""Storage ports. JSON is the current backend; swap `JsonStore` for a SQL adapter later."""

from anpr.storage.json_store import JsonStore

__all__ = ["JsonStore"]
