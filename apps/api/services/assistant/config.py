# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

from anyio import Path
import configparser
from typing import Any, Dict, Optional, Tuple
import os


# BASE_DIR = Path(__file__).resolve().parent
# ASSISTANT_CONFIG_PATH = (BASE_DIR / "../../config/assistant.ini").resolve()
# GRAPHDB_CONFIG_PATH = (BASE_DIR / "../../config/graphdb.ini").resolve()
# DEFAULT_SKILL_DIR = (BASE_DIR / "../skills").resolve()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ASSISTANT_CONFIG_PATH = os.path.abspath(os.path.join(BASE_DIR, "../../../config/assistant.ini"))
GRAPHDB_CONFIG_PATH = os.path.abspath(os.path.join(BASE_DIR, "../../../config/graphdb.ini"))
DEFAULT_SKILL_DIR = os.path.abspath(os.path.join(BASE_DIR, "../../../skills"))

def _get_assistant_config() -> Dict[str, Any]:
    """Read assistant runtime config from INI files with sane defaults."""
    config = configparser.ConfigParser()
    config.read([str(ASSISTANT_CONFIG_PATH), str(GRAPHDB_CONFIG_PATH)])

    return {
        "token": config.get("assistant", "github_token", fallback=""),
        "models_url": config.get("assistant", "github_models_url", fallback=""),
        "model": config.get("assistant", "github_model", fallback="gpt-4o-mini"),
        "max_tokens": config.get("assistant", "max_tokens", fallback="1024"),
        "temperature": config.get("assistant", "temperature", fallback="0.2"),
        "skill_dir": config.get("assistant", "skill_dir", fallback=str(DEFAULT_SKILL_DIR)),
        "sparql_endpoint": config.get("graphdb", "endpoint", fallback=""),
        "sparql_timeout": config.get("graphdb", "timeout", fallback="15"),
    }


def get_runtime_settings() -> Dict[str, Any]:
    """Load assistant settings at runtime so config changes are picked up."""
    cfg = _get_assistant_config()
    return {
        "token": os.getenv("GITHUB_TOKEN", cfg["token"]),
        "models_url": os.getenv("GITHUB_MODELS_URL", cfg["models_url"]),
        "model": os.getenv("ASSISTANT_MODEL", cfg["model"]),
        "max_tokens": int(os.getenv("ASSISTANT_MAX_TOKENS", str(cfg["max_tokens"]))),
        "temperature": float(os.getenv("ASSISTANT_TEMPERATURE", str(cfg["temperature"]))),
        "skill_dir": os.getenv("ASSISTANT_SKILL_DIR", cfg["skill_dir"]),
        "sparql_endpoint": os.getenv("SPARQL_ENDPOINT", cfg["sparql_endpoint"]),
        "sparql_timeout": float(os.getenv("SPARQL_TIMEOUT", str(cfg["sparql_timeout"]))),
    }