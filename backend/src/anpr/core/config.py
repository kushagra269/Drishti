from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

import yaml
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[3]
CONFIG_DIR = ROOT / "configs"


def load_yaml(name: str) -> dict[str, Any]:
    path = CONFIG_DIR / name
    with path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle) or {}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="ANPR_", extra="ignore")

    env: str = "development"
    host: str = "0.0.0.0"
    port: int = 8080
    kafka_bootstrap_servers: str = "localhost:9092"
    kafka_client_id: str = "anpr-platform"
    kafka_acl_principal: str = "anpr-core"

    app: dict[str, Any] = {}
    cameras: list[dict[str, Any]] = []
    kafka: dict[str, Any] = {}
    models: dict[str, Any] = {}

    @classmethod
    def load(cls) -> "Settings":
        app_cfg = load_yaml("app.yaml")
        cameras_cfg = load_yaml("cameras.yaml")
        kafka_cfg = load_yaml("kafka.yaml")
        models_cfg = load_yaml("models.yaml")
        instance = cls()
        instance.app = app_cfg
        instance.cameras = cameras_cfg.get("cameras", [])
        instance.kafka = kafka_cfg
        instance.models = models_cfg.get("models", {})
        if instance.kafka_bootstrap_servers:
            instance.kafka.setdefault("kafka", {})["bootstrap_servers"] = instance.kafka_bootstrap_servers
        return instance


def setup_logging(settings: Settings) -> None:
    level_name = settings.app.get("app", {}).get("logging", {}).get("level", "INFO")
    logging.basicConfig(
        level=getattr(logging, str(level_name).upper(), logging.INFO),
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )


def dumps(payload: dict[str, Any]) -> str:
    return json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
