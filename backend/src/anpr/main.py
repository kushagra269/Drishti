from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from anpr.core.config import Settings, setup_logging  # noqa: E402
from anpr.core.paths import ensure_runtime_dirs  # noqa: E402


def main() -> None:
    import os

    os.environ.setdefault("OMP_NUM_THREADS", "1")
    os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")
    import uvicorn

    settings = Settings.load()
    setup_logging(settings)
    ensure_runtime_dirs(settings)
    host = settings.app.get("app", {}).get("api", {}).get("host", settings.host)
    port = int(settings.app.get("app", {}).get("api", {}).get("port", settings.port))
    uvicorn.run("anpr.api.app:app", host=host, port=port, reload=False)


if __name__ == "__main__":
    main()
