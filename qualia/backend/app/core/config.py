import os
from dataclasses import dataclass


def _required_env(name: str) -> str:
    value = os.getenv(name)
    if value is None:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def _get_debug_flag() -> bool:
    return os.getenv("DEBUG", "false").lower() in {"1", "true", "yes", "on"}


@dataclass
class Settings:
    app_name: str = os.getenv("APP_NAME", "Qualia API")
    database_url: str = _required_env("DATABASE_URL")
    jwt_secret: str = _required_env("JWT_SECRET")
    storage_backend: str = os.getenv("STORAGE_BACKEND", "s3")
    storage_bucket: str = _required_env("STORAGE_BUCKET")
    debug: bool = _get_debug_flag()


settings = Settings()
