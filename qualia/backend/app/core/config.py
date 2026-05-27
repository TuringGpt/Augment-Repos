import os
from dataclasses import dataclass, field


def _required_env(name: str) -> str:
    value = os.getenv(name)
    if value is None:
        raise RuntimeError(f"Missing required environment variable: {name}")
    value = value.strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def _optional_env(name: str, default: str) -> str:
    value = os.getenv(name)
    if value is None:
        return default
    value = value.strip()
    return value or default


def _get_debug_flag() -> bool:
    return os.getenv("DEBUG", "false").strip().lower() in {"1", "true", "yes", "on"}


@dataclass
class Settings:
    app_name: str = field(default_factory=lambda: _optional_env("APP_NAME", "Qualia API"))
    database_url: str = field(default_factory=lambda: _required_env("DATABASE_URL"), repr=False)
    jwt_secret: str = field(default_factory=lambda: _required_env("JWT_SECRET"), repr=False)
    storage_backend: str = field(default_factory=lambda: _optional_env("STORAGE_BACKEND", "s3"))
    storage_bucket: str = field(default_factory=lambda: _required_env("STORAGE_BUCKET"), repr=False)
    debug: bool = field(default_factory=_get_debug_flag)


def get_jwt_secret() -> str:
    return _required_env("JWT_SECRET")


def get_settings() -> Settings:
    return Settings()
