import uuid
from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app.core.database import get_db
from app.main import app
from app.models.form_cycle import FormCycle, FormCycleStatus
from app.models.user import Role, User


def _serialized_datetime(value: datetime) -> str:
    return value.isoformat().replace("+00:00", "Z")


class _QueryResult:
    def __init__(self, value: object) -> None:
        self._value = value

    def scalar_one_or_none(self) -> object:
        return self._value

    def scalars(self) -> "_QueryResult":
        return self

    def all(self) -> list[object]:
        if isinstance(self._value, list):
            return list(self._value)
        return []


class _ListAllFormsSession:
    def __init__(self, admin: User, forms: list[FormCycle]) -> None:
        self._admin = admin
        self._forms = forms

    async def execute(self, statement: object) -> _QueryResult:
        query_text = str(statement)
        if "FROM users" in query_text:
            return _QueryResult(self._admin)
        if "FROM form_cycles" in query_text:
            return _QueryResult(self._forms)
        raise AssertionError(f"Unexpected query: {query_text}")


def _override_get_db(session: _ListAllFormsSession):
    async def _get_db_override():
        yield session

    return _get_db_override


def test_list_all_form_cycles_returns_all_cycles_for_admin(monkeypatch: pytest.MonkeyPatch) -> None:
    admin = User(
        id=uuid.uuid4(),
        email="admin@example.com",
        username="admin",
        password_hash="secret",
        role=Role.admin,
        is_active=True,
        is_email_verified=True,
    )
    base_time = datetime.now(UTC)
    forms = [
        FormCycle(
            id=uuid.uuid4(),
            title="Draft cycle",
            description="Hidden draft",
            created_by_id=admin.id,
            status=FormCycleStatus.draft,
            is_published=False,
            submission_deadline=base_time + timedelta(days=3),
            created_at=base_time,
        ),
        FormCycle(
            id=uuid.uuid4(),
            title="Published cycle",
            description="Visible form",
            created_by_id=uuid.uuid4(),
            status=FormCycleStatus.active,
            is_published=True,
            submission_deadline=base_time + timedelta(days=7),
            created_at=base_time + timedelta(minutes=5),
        ),
    ]
    monkeypatch.setattr("app.form_cycles.verify_token", lambda *_args, **_kwargs: {"sub": admin.email})
    app.dependency_overrides[get_db] = _override_get_db(_ListAllFormsSession(admin, forms))

    try:
        with TestClient(app) as client:
            response = client.get("/api/v1/forms/all", headers={"Authorization": "Bearer token"})
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == [
        {
            "id": str(forms[0].id),
            "title": "Draft cycle",
            "description": "Hidden draft",
            "status": "draft",
            "is_published": False,
            "submission_deadline": _serialized_datetime(forms[0].submission_deadline),
            "created_at": _serialized_datetime(forms[0].created_at),
        },
        {
            "id": str(forms[1].id),
            "title": "Published cycle",
            "description": "Visible form",
            "status": "active",
            "is_published": True,
            "submission_deadline": _serialized_datetime(forms[1].submission_deadline),
            "created_at": _serialized_datetime(forms[1].created_at),
        },
    ]


def test_list_all_form_cycles_rejects_non_admin(monkeypatch: pytest.MonkeyPatch) -> None:
    reviewer = User(
        id=uuid.uuid4(),
        email="reviewer@example.com",
        username="reviewer",
        password_hash="secret",
        role=Role.user,
        is_active=True,
        is_email_verified=True,
    )
    monkeypatch.setattr("app.form_cycles.verify_token", lambda *_args, **_kwargs: {"sub": reviewer.email})
    app.dependency_overrides[get_db] = _override_get_db(_ListAllFormsSession(reviewer, []))

    try:
        with TestClient(app) as client:
            response = client.get("/api/v1/forms/all", headers={"Authorization": "Bearer token"})
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 403
    assert response.json() == {"detail": "Admin access required"}
