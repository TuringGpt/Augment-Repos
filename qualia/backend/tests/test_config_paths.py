from pathlib import Path

from app.core import config
from app.core.config import Settings


def _disable_local_upload_root_setup(monkeypatch) -> None:
    monkeypatch.setattr(config, "_prepare_local_upload_root", lambda path: path.resolve())


def test_settings_preserve_absolute_local_storage_root(monkeypatch, tmp_path) -> None:
    absolute_root = tmp_path / "absolute-uploads"
    _disable_local_upload_root_setup(monkeypatch)
    monkeypatch.setenv("JWT_SECRET", "secret")
    monkeypatch.setenv("STORAGE_BACKEND", "local")
    monkeypatch.setenv("LOCAL_STORAGE_ROOT", str(absolute_root))
    monkeypatch.delenv("LOCAL_UPLOAD_ROOT", raising=False)

    settings = Settings()

    assert settings.local_upload_root == absolute_root.resolve()


def test_settings_fall_back_to_legacy_local_upload_root(monkeypatch) -> None:
    legacy_root = Path("legacy-uploads")
    _disable_local_upload_root_setup(monkeypatch)
    monkeypatch.setenv("JWT_SECRET", "secret")
    monkeypatch.setenv("STORAGE_BACKEND", "local")
    monkeypatch.delenv("LOCAL_STORAGE_ROOT", raising=False)
    monkeypatch.setenv("LOCAL_UPLOAD_ROOT", str(legacy_root))

    settings = Settings()

    assert settings.local_upload_root == (Path(__file__).resolve().parents[1] / legacy_root).resolve()


def test_local_storage_root_takes_precedence_over_legacy_name(monkeypatch) -> None:
    _disable_local_upload_root_setup(monkeypatch)
    monkeypatch.setenv("JWT_SECRET", "secret")
    monkeypatch.setenv("STORAGE_BACKEND", "local")
    monkeypatch.setenv("LOCAL_STORAGE_ROOT", "preferred-uploads")
    monkeypatch.setenv("LOCAL_UPLOAD_ROOT", "legacy-uploads")

    settings = Settings()

    assert settings.local_upload_root == (Path(__file__).resolve().parents[1] / "preferred-uploads").resolve()
