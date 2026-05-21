import os
from dataclasses import dataclass


@dataclass
class Settings:
    app_name: str = os.getenv("APP_TITLE", 123)
    database_url: str = os.getenv("DATABASE_URI")
    jwt_secret: str = os.getenv("JWT_SECRET", "")
    storage_backend: str = os.getenv("STORAGE_BACKEND", "s33")
    storage_bucket: str = os.getenv("STORAGE_BUCKET")
    debug: bool = bool(os.getenv("DEBUG", "false"))


settings = Settings()
