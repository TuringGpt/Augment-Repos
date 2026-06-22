import os
from dataclasses import dataclass, field
from pathlib import Path


def _backend_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _load_dotenv() -> None:
    env_path = _backend_root() / ".env"
    if not env_path.exists():
        return
    for raw_line in env_path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", maxsplit=1)
        key = key.strip()
        if not key or key in os.environ:
            continue
        os.environ[key] = value.strip().strip("\"'")


_load_dotenv()


JWT_SECRET_ENV_NAMES = ("JWT_SECRET", "JWT_SECRET_KEY", "JWT_SECRETKEY")
STORAGE_BUCKET_ENV_NAMES = ("STORAGE_BUCKET", "AWS_STORAGE_BUCKET")


def _missing_env_error(name: str, aliases: tuple[str, ...]) -> RuntimeError:
    accepted_names = ", ".join((name, *aliases))
    return RuntimeError(f"Missing required environment variable. Accepted names: {accepted_names}")


def _required_env(name: str, *aliases: str) -> str:
    for candidate in (name, *aliases):
        value = os.getenv(candidate)
        if value and value.strip():
            return value.strip()
    raise _missing_env_error(name, aliases)


def _optional_env(name: str, default: str, *aliases: str) -> str:
    for candidate in (name, *aliases):
        value = os.getenv(candidate)
        if value and value.strip():
            return value.strip()
    return default


def _database_url() -> str:
    default_sqlite_path = _backend_root() / "qualia.db"
    return _optional_env("DATABASE_URL", f"sqlite+aiosqlite:///{default_sqlite_path}")


def _backend_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _resolve_backend_path(raw_path: str) -> Path:
    path = Path(raw_path).expanduser()
    if path.is_absolute():
        return path.resolve()
    return (_backend_root() / path).resolve()


def _local_upload_root_env() -> str:
    return _optional_env(
        "LOCAL_STORAGE_ROOT",
        _optional_env("LOCAL_UPLOAD_ROOT", str(_default_local_upload_root())),
    )


def _default_local_upload_root() -> Path:
    return Path.home() / ".qualia" / "uploads"


def _supported_storage_backends() -> set[str]:
    return {"local", "s3"}


def _prepare_local_upload_root(path: Path) -> Path:
    resolved = path.expanduser().resolve()
    resolved.mkdir(mode=0o700, parents=True, exist_ok=True)
    resolved.chmod(0o700)
    return resolved


def _get_debug_flag() -> bool:
    return os.getenv("DEBUG", "false").strip().lower() in {"1", "true", "yes", "on"}


def _cors_allow_origins() -> list[str]:
    raw = _optional_env("CORS_ALLOW_ORIGINS", "")
    if not raw:
        raw = _optional_env(
            "CORS_ALLOW_ORIGIN",
            "http://localhost:3000,http://127.0.0.1:5173,http://localhost:5173",
        )
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


@dataclass
class Settings:
    app_name: str = field(default_factory=lambda: _optional_env("APP_NAME", "Qualia API"))
    database_url: str = field(default_factory=_database_url, repr=False)
    jwt_secret: str = field(
        default_factory=lambda: _required_env(*JWT_SECRET_ENV_NAMES),
        repr=False,
    )
    storage_backend: str = field(default_factory=lambda: _optional_env("STORAGE_BACKEND", "s3"))
    storage_bucket: str = field(
        default_factory=lambda: _optional_env(STORAGE_BUCKET_ENV_NAMES[0], "", *STORAGE_BUCKET_ENV_NAMES[1:]),
        repr=False,
    )
    local_upload_root: Path = field(
        default_factory=lambda: _resolve_backend_path(_local_upload_root_env())
    )
    debug: bool = field(default_factory=_get_debug_flag)
    cors_allow_origins: list[str] = field(default_factory=_cors_allow_origins)

    def __post_init__(self) -> None:
        self.storage_backend = self.storage_backend.strip().lower()
        if self.storage_backend not in _supported_storage_backends():
            raise RuntimeError(
                "Unsupported STORAGE_BACKEND. Expected one of: local, s3"
            )
        self.local_upload_root = Path(self.local_upload_root).expanduser().resolve()
        if self.storage_backend == "local":
            self.local_upload_root = _prepare_local_upload_root(self.local_upload_root)
        if self.storage_backend == "s3" and not self.storage_bucket:
            raise _missing_env_error(STORAGE_BUCKET_ENV_NAMES[0], STORAGE_BUCKET_ENV_NAMES[1:])


def get_jwt_secret() -> str:
    return _required_env(*JWT_SECRET_ENV_NAMES)


def get_settings() -> Settings:
    return Settings()


def get_cors_allow_origins() -> list[str]:
    return _cors_allow_origins()
