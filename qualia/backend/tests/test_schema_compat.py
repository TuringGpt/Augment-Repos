import asyncio
import uuid

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError

import app.core.deps as deps
from app.core import config
from app.core.deps import _get_token_subject_email
from app.core.deps import get_active_user
from app.core.database import _sqlite_users_table_has_legacy_role_schema
from app.form_cycles import _validate_assigned_user
from app.main import app
from app.models.question import Question, QuestionType
from app.models.section import Section
from app.models.user import Role, RoleType, User
from app.sections import create_question
from app.sections import delete_question
from app.sections import QuestionCreate
from app.sections import QuestionUpdate
from app.sections import update_question


def test_section_table_name() -> None:
    assert Section.__table__.name == "sections"


def test_question_section_foreign_key() -> None:
    foreign_keys = list(Question.__table__.c.section_id.foreign_keys)
    assert len(foreign_keys) == 1

    foreign_key = foreign_keys[0]
    assert foreign_key.column.table.name == "sections"
    assert foreign_key.column.name == "id"


def test_question_create_rejects_blank_question_text() -> None:
    with pytest.raises(ValidationError):
        QuestionCreate(question_text="   ", question_type="short_text")


def test_question_create_normalizes_null_conditional_logic() -> None:
    payload = QuestionCreate(
        question_text="Prompt",
        question_type="short_text",
        conditional_logic=None,
    )

    assert payload.question_text == "Prompt"
    assert payload.conditional_logic == {}


def test_question_create_defaults_is_required_to_false() -> None:
    payload = QuestionCreate(
        question_text="Prompt",
        question_type="short_text",
    )

    assert payload.is_required is False


def test_question_create_rejects_falsy_non_dict_conditional_logic() -> None:
    with pytest.raises(ValidationError):
        QuestionCreate(
            question_text="Prompt",
            question_type="short_text",
            conditional_logic=[],
        )


def test_question_create_path_uses_form_cycle_id() -> None:
    openapi_schema = app.openapi()

    post_operation = openapi_schema["paths"]["/api/v1/forms/{form_cycle_id}/sections/{section_id}/questions"]["post"]
    parameter_names = {parameter["name"] for parameter in post_operation["parameters"]}

    assert "form_cycle_id" in parameter_names
    assert "form_id" not in parameter_names


def test_question_item_paths_use_form_cycle_id() -> None:
    openapi_schema = app.openapi()

    question_item_path = "/api/v1/forms/{form_cycle_id}/sections/{section_id}/questions/{question_id}"
    put_operation = openapi_schema["paths"][question_item_path]["put"]
    delete_operation = openapi_schema["paths"][question_item_path]["delete"]

    put_parameter_names = {parameter["name"] for parameter in put_operation["parameters"]}
    delete_parameter_names = {parameter["name"] for parameter in delete_operation["parameters"]}

    assert put_parameter_names == delete_parameter_names
    assert "form_cycle_id" in put_parameter_names
    assert "form_id" not in put_parameter_names


def test_required_env_prefers_canonical_name_over_alias(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("QUALIA_CANONICAL", "canonical")
    monkeypatch.setenv("QUALIA_ALIAS", "alias")

    assert config._required_env("QUALIA_CANONICAL", "QUALIA_ALIAS") == "canonical"


def test_required_env_error_lists_aliases(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("QUALIA_CANONICAL", raising=False)
    monkeypatch.delenv("QUALIA_ALIAS", raising=False)

    with pytest.raises(RuntimeError, match="Accepted names: QUALIA_CANONICAL, QUALIA_ALIAS"):
        config._required_env("QUALIA_CANONICAL", "QUALIA_ALIAS")


def test_get_jwt_secret_accepts_documented_alias(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("JWT_SECRET", raising=False)
    monkeypatch.setenv("JWT_SECRET_KEY", "documented-secret")
    monkeypatch.delenv("JWT_SECRETKEY", raising=False)

    assert config.get_jwt_secret() == "documented-secret"


def test_get_jwt_secret_accepts_legacy_alias(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("JWT_SECRET", raising=False)
    monkeypatch.delenv("JWT_SECRET_KEY", raising=False)
    monkeypatch.setenv("JWT_SECRETKEY", "legacy-secret")

    assert config.get_jwt_secret() == "legacy-secret"


def test_role_type_maps_legacy_review_roles_to_user() -> None:
    role_type = RoleType()

    assert role_type.process_result_value("reviewer", None) is Role.user
    assert role_type.process_result_value("viewer", None) is Role.user
    assert role_type.process_bind_param("reviewer", None) == "viewer"
    assert role_type.process_bind_param("viewer", None) == "viewer"


def test_sqlite_users_table_schema_detection_flags_legacy_role_values() -> None:
    assert _sqlite_users_table_has_legacy_role_schema(
        """
        CREATE TABLE users (
            id TEXT PRIMARY KEY,
            role VARCHAR(32) NOT NULL DEFAULT 'viewer' CHECK (role IN ('reviewer', 'viewer', 'admin'))
        )
        """
    )


def test_sqlite_users_table_schema_detection_flags_double_quoted_legacy_role_values() -> None:
    assert _sqlite_users_table_has_legacy_role_schema(
        """
        CREATE TABLE users (
            id TEXT PRIMARY KEY,
            role VARCHAR(32) NOT NULL DEFAULT "viewer" CHECK (role IN ("reviewer", "viewer", "admin"))
        )
        """
    )


def test_sqlite_users_table_schema_detection_accepts_canonical_role_values() -> None:
    assert not _sqlite_users_table_has_legacy_role_schema(
        """
        CREATE TABLE users (
            id TEXT PRIMARY KEY,
            role VARCHAR(32) NOT NULL DEFAULT 'user'
        )
        """
    )


def test_validate_assigned_user_rejects_admin_role() -> None:
    admin = User(
        email="admin@example.com",
        username="admin",
        password_hash="secret",
        role=Role.admin,
        is_active=True,
        is_email_verified=True,
    )

    with pytest.raises(HTTPException, match="Assigned account must have user role") as exc_info:
        _validate_assigned_user(admin)

    assert exc_info.value.status_code == 400


def test_validate_assigned_user_reports_missing_user() -> None:
    with pytest.raises(HTTPException, match="Assigned user not found") as exc_info:
        _validate_assigned_user(None)

    assert exc_info.value.status_code == 404


class _SubmitFormCycleSession:
    def __init__(self, results: list[object]) -> None:
        self._results = results

    async def execute(self, _query: object) -> "_ScalarResult":
        return _ScalarResult(self._results.pop() if self._results else None)


@pytest.mark.parametrize(("policy", "role", "result", "status"), [("require_cycle_owner_or_admin", "admin", None, None), ("require_cycle_owner_or_admin", "owner", "self", None), ("require_assignee", "assignee", "assigned", None), ("require_cycle_owner_or_admin", "assignee", "assigned", 403), ("require_assignee", "user", None, 403)])
def test_authorization_policy_matrix(policy: str, role: str, result: str | None, status: int | None) -> None:
    form_cycle_id = uuid.uuid4(); user = User(id=uuid.uuid4(), email="reviewer@example.com", username=role, password_hash="secret", role=Role.admin if role == "admin" else Role.user, is_active=True, is_email_verified=True); session = _SubmitFormCycleSession([user.id if result == "self" else uuid.uuid4() if result else None]); fn = getattr(deps, policy)
    async def _run() -> None:
        if status is None: assert await fn(form_cycle_id, user, session) is user
        else:
            with pytest.raises(HTTPException) as exc_info: await fn(form_cycle_id, user, session)
            assert exc_info.value.status_code == status
    asyncio.run(_run())


def test_settings_storage_bucket_error_lists_alias(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("JWT_SECRET", "secret")
    monkeypatch.setenv("STORAGE_BACKEND", "s3")
    monkeypatch.delenv("STORAGE_BUCKET", raising=False)
    monkeypatch.delenv("AWS_STORAGE_BUCKET", raising=False)

    with pytest.raises(RuntimeError, match="Accepted names: STORAGE_BUCKET, AWS_STORAGE_BUCKET"):
        config.Settings()


def test_role_type_persists_user_role_as_legacy_viewer_value() -> None:
    role_type = RoleType()

    assert role_type.process_bind_param(Role.user, None) == "viewer"
    assert role_type.process_bind_param("user", None) == "viewer"
    assert role_type.process_bind_param("viewer", None) == "viewer"


def test_role_type_reads_legacy_viewer_value_as_user_role() -> None:
    role_type = RoleType()

    assert role_type.process_result_value("viewer", None) is Role.user
    assert Role.viewer is Role.user


def test_user_role_default_matches_runtime_user_role() -> None:
    assert User.__table__.c.role.default.arg is Role.user


class _ScalarResult:
    def __init__(self, value: object) -> None:
        self._value = value

    def scalar_one(self) -> object:
        return self._value

    def scalar_one_or_none(self) -> object:
        return self._value


class _FailingQuestionSession:
    def __init__(self, user: User, section: Section) -> None:
        self._results = [_ScalarResult(user), _ScalarResult(section), _ScalarResult(0)]
        self.rollback_calls = 0

    async def execute(self, _query: object) -> _ScalarResult:
        return self._results.pop(0)

    def add(self, _obj: object) -> None:
        return None

    async def flush(self) -> None:
        raise IntegrityError("insert into questions", {}, Exception("constraint failed"))

    async def commit(self) -> None:
        raise AssertionError("commit should not run after a failed flush")

    async def rollback(self) -> None:
        self.rollback_calls += 1


class _UpdateQuestionSession:
    def __init__(self, user: User, question: Question) -> None:
        self._results = [_ScalarResult(question)]
        self._user = user
        self.commit_calls = 0
        self.rollback_calls = 0
        self.raise_integrity_error = False

    async def execute(self, query: object) -> _ScalarResult:
        query_text = str(query)
        if "FROM users" in query_text:
            return _ScalarResult(self._user)
        return self._results.pop(0)

    async def commit(self) -> None:
        if self.raise_integrity_error:
            raise IntegrityError("update questions", {}, Exception("constraint failed"))
        self.commit_calls += 1

    async def rollback(self) -> None:
        self.rollback_calls += 1


class _DeleteQuestionSession:
    def __init__(self, user: User, question: Question) -> None:
        self._question = question
        self._user = user
        self.deleted: object | None = None
        self.commit_calls = 0
        self.rollback_calls = 0
        self.raise_integrity_error = False

    async def execute(self, query: object) -> _ScalarResult:
        query_text = str(query)
        if "FROM users" in query_text:
            return _ScalarResult(self._user)
        return _ScalarResult(self._question)

    async def delete(self, obj: object) -> None:
        self.deleted = obj

    async def commit(self) -> None:
        if self.raise_integrity_error:
            raise IntegrityError("delete questions", {}, Exception("constraint failed"))
        self.commit_calls += 1

    async def rollback(self) -> None:
        self.rollback_calls += 1


def test_create_question_rolls_back_integrity_errors(monkeypatch: pytest.MonkeyPatch) -> None:
    form_cycle_id = uuid.uuid4()
    section_id = uuid.uuid4()
    user = User(
        email="admin@example.com",
        username="admin",
        password_hash="secret",
        role=Role.admin,
        is_active=True,
        is_email_verified=True,
    )
    section = Section(form_cycle_id=form_cycle_id, title="Section", display_order=1)
    section.id = section_id
    session = _FailingQuestionSession(user, section)
    monkeypatch.setattr("app.sections.verify_token", lambda *_args, **_kwargs: {"sub": user.email})

    async def _run() -> None:
        with pytest.raises(HTTPException) as exc_info:
            await create_question(
                form_cycle_id=form_cycle_id,
                section_id=section_id,
                payload=QuestionCreate(question_text="Prompt", question_type="short_text"),
                credentials=HTTPAuthorizationCredentials(scheme="Bearer", credentials="token"),
                db=session,
            )

        assert exc_info.value.status_code == 409
        assert exc_info.value.detail == "Question could not be created due to a data conflict"

    asyncio.run(_run())

    assert session.rollback_calls == 1


def test_update_question_preserves_display_order_when_omitted(monkeypatch: pytest.MonkeyPatch) -> None:
    form_cycle_id = uuid.uuid4()
    section_id = uuid.uuid4()
    question_id = uuid.uuid4()
    user = User(
        email="admin@example.com",
        username="admin",
        password_hash="secret",
        role=Role.admin,
        is_active=True,
        is_email_verified=True,
    )
    question = Question(
        id=question_id,
        section_id=section_id,
        form_cycle_id=form_cycle_id,
        question_text="Old prompt",
        question_type=QuestionType.short_text,
        display_order=7,
        version=5,
    )
    session = _UpdateQuestionSession(user, question)
    monkeypatch.setattr("app.sections.verify_token", lambda *_args, **_kwargs: {"sub": user.email})

    async def _run() -> None:
        response = await update_question(
            form_cycle_id=form_cycle_id,
            section_id=section_id,
            question_id=question_id,
            payload=QuestionUpdate(question_text="New prompt", question_type=QuestionType.long_text),
            credentials=HTTPAuthorizationCredentials(scheme="Bearer", credentials="token"),
            db=session,
        )

        assert response["display_order"] == 7
        assert response["version"] == 6
        assert response["config"] == {}
        assert response["conditional_logic"] == {}

    asyncio.run(_run())

    assert question.display_order == 7
    assert question.version == 6
    assert session.commit_calls == 1


def test_update_question_ignores_stale_payload_version(monkeypatch: pytest.MonkeyPatch) -> None:
    form_cycle_id = uuid.uuid4()
    section_id = uuid.uuid4()
    question_id = uuid.uuid4()
    user = User(
        email="admin@example.com",
        username="admin",
        password_hash="secret",
        role=Role.admin,
        is_active=True,
        is_email_verified=True,
    )
    question = Question(
        id=question_id,
        section_id=section_id,
        form_cycle_id=form_cycle_id,
        question_text="Old prompt",
        question_type=QuestionType.short_text,
        display_order=3,
        version=9,
    )
    session = _UpdateQuestionSession(user, question)
    monkeypatch.setattr("app.sections.verify_token", lambda *_args, **_kwargs: {"sub": user.email})

    async def _run() -> None:
        response = await update_question(
            form_cycle_id=form_cycle_id,
            section_id=section_id,
            question_id=question_id,
            payload=QuestionUpdate(question_text="New prompt", question_type=QuestionType.short_text),
            credentials=HTTPAuthorizationCredentials(scheme="Bearer", credentials="token"),
            db=session,
        )

        assert response["version"] == 10

    asyncio.run(_run())

    assert question.version == 10


def test_update_question_preserves_existing_fields_when_omitted(monkeypatch: pytest.MonkeyPatch) -> None:
    form_cycle_id = uuid.uuid4()
    section_id = uuid.uuid4()
    question_id = uuid.uuid4()
    user = User(
        email="admin@example.com",
        username="admin",
        password_hash="secret",
        role=Role.admin,
        is_active=True,
        is_email_verified=True,
    )
    question = Question(
        id=question_id,
        section_id=section_id,
        form_cycle_id=form_cycle_id,
        question_text="Old prompt",
        question_type=QuestionType.short_text,
        is_required=True,
        config={"choices": ["yes"]},
        conditional_logic={"when": "ready"},
        display_order=4,
        version=2,
    )
    session = _UpdateQuestionSession(user, question)
    monkeypatch.setattr("app.sections.verify_token", lambda *_args, **_kwargs: {"sub": user.email})

    async def _run() -> None:
        response = await update_question(
            form_cycle_id=form_cycle_id,
            section_id=section_id,
            question_id=question_id,
            payload=QuestionUpdate(question_text="Updated prompt"),
            credentials=HTTPAuthorizationCredentials(scheme="Bearer", credentials="token"),
            db=session,
        )

        assert response["question_type"] == "short_text"
        assert response["is_required"] is True
        assert response["config"] == {"choices": ["yes"]}
        assert response["conditional_logic"] == {"when": "ready"}

    asyncio.run(_run())

    assert question.question_type.value == "short_text"
    assert question.is_required is True
    assert question.config == {"choices": ["yes"]}
    assert question.conditional_logic == {"when": "ready"}


def test_update_question_normalizes_missing_conditional_logic_to_object(monkeypatch: pytest.MonkeyPatch) -> None:
    form_cycle_id = uuid.uuid4()
    section_id = uuid.uuid4()
    question_id = uuid.uuid4()
    user = User(
        email="admin@example.com",
        username="admin",
        password_hash="secret",
        role=Role.admin,
        is_active=True,
        is_email_verified=True,
    )
    question = Question(
        id=question_id,
        section_id=section_id,
        form_cycle_id=form_cycle_id,
        question_text="Old prompt",
        question_type=QuestionType.short_text,
        is_required=True,
        config={"choices": ["yes"]},
        conditional_logic=None,
        display_order=4,
        version=2,
    )
    session = _UpdateQuestionSession(user, question)
    monkeypatch.setattr("app.sections.verify_token", lambda *_args, **_kwargs: {"sub": user.email})

    async def _run() -> None:
        response = await update_question(
            form_cycle_id=form_cycle_id,
            section_id=section_id,
            question_id=question_id,
            payload=QuestionUpdate(question_text="Updated prompt"),
            credentials=HTTPAuthorizationCredentials(scheme="Bearer", credentials="token"),
            db=session,
        )

        assert response["conditional_logic"] == {}

    asyncio.run(_run())

    assert question.conditional_logic == {}


def test_update_question_rolls_back_integrity_errors(monkeypatch: pytest.MonkeyPatch) -> None:
    form_cycle_id = uuid.uuid4()
    section_id = uuid.uuid4()
    question_id = uuid.uuid4()
    user = User(
        email="admin@example.com",
        username="admin",
        password_hash="secret",
        role=Role.admin,
        is_active=True,
        is_email_verified=True,
    )
    question = Question(
        id=question_id,
        section_id=section_id,
        form_cycle_id=form_cycle_id,
        question_text="Old prompt",
        question_type=QuestionType.short_text,
        display_order=5,
        version=1,
    )
    session = _UpdateQuestionSession(user, question)
    session.raise_integrity_error = True
    monkeypatch.setattr("app.sections.verify_token", lambda *_args, **_kwargs: {"sub": user.email})

    async def _run() -> None:
        with pytest.raises(HTTPException) as exc_info:
            await update_question(
                form_cycle_id=form_cycle_id,
                section_id=section_id,
                question_id=question_id,
                payload=QuestionUpdate(display_order=1),
                credentials=HTTPAuthorizationCredentials(scheme="Bearer", credentials="token"),
                db=session,
            )

        assert exc_info.value.status_code == 409
        assert exc_info.value.detail == "Question could not be updated due to a data conflict"

    asyncio.run(_run())

    assert session.rollback_calls == 1


@pytest.mark.parametrize("field_name", ["question_text", "question_type", "is_required", "config", "display_order"])
def test_question_update_rejects_explicit_null_for_non_nullable_fields(field_name: str) -> None:
    with pytest.raises(ValidationError):
        QuestionUpdate(**{field_name: None})


def test_delete_question_rolls_back_integrity_errors(monkeypatch: pytest.MonkeyPatch) -> None:
    form_cycle_id = uuid.uuid4()
    section_id = uuid.uuid4()
    question_id = uuid.uuid4()
    user = User(
        email="admin@example.com",
        username="admin",
        password_hash="secret",
        role=Role.admin,
        is_active=True,
        is_email_verified=True,
    )
    question = Question(
        id=question_id,
        section_id=section_id,
        form_cycle_id=form_cycle_id,
        question_text="Old prompt",
        question_type=QuestionType.short_text,
        display_order=5,
        version=1,
    )
    session = _DeleteQuestionSession(user, question)
    session.raise_integrity_error = True
    monkeypatch.setattr("app.sections.verify_token", lambda *_args, **_kwargs: {"sub": user.email})

    async def _run() -> None:
        with pytest.raises(HTTPException) as exc_info:
            await delete_question(
                form_cycle_id=form_cycle_id,
                section_id=section_id,
                question_id=question_id,
                credentials=HTTPAuthorizationCredentials(scheme="Bearer", credentials="token"),
                db=session,
            )

        assert exc_info.value.status_code == 409
        assert exc_info.value.detail == "Question could not be deleted due to a data conflict"

    asyncio.run(_run())

    assert session.deleted is question
    assert session.rollback_calls == 1


class _AuthScalarList:
    def __init__(self, users: list[User]) -> None:
        self._users = users

    def all(self) -> list[User]:
        return list(self._users)

    def scalar_one_or_none(self) -> User | None:
        return self._users[0] if self._users else None


class _AuthResultList:
    def __init__(self, users: list[User]) -> None:
        self._users = users

    def scalars(self) -> _AuthScalarList:
        return _AuthScalarList(self._users)


class _AuthLookupSession:
    def __init__(self, users: list[User]) -> None:
        self._users = users

    async def execute(self, _query: object) -> _AuthResultList:
        return _AuthResultList(self._users)


def test_get_token_subject_email_accepts_max_length_subject(monkeypatch: pytest.MonkeyPatch) -> None:
    subject = f"{'A' * 243}@example.com"
    monkeypatch.setattr("app.core.deps.verify_token", lambda *_args, **_kwargs: {"sub": subject})

    assert len(subject) == 255
    assert _get_token_subject_email("token") == subject.lower()


def test_get_token_subject_email_rejects_blank_subject(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("app.core.deps.verify_token", lambda *_args, **_kwargs: {"sub": "   "})

    with pytest.raises(HTTPException, match="Invalid token subject") as exc_info:
        _get_token_subject_email("token")

    assert exc_info.value.status_code == 401


def test_get_active_user_rejects_duplicate_case_variant_emails(monkeypatch: pytest.MonkeyPatch) -> None:
    primary = User(
        email="User@Example.com",
        username="primary",
        password_hash="secret",
        role=Role.user,
        is_active=True,
        is_email_verified=True,
    )
    duplicate = User(
        email="user@example.com",
        username="duplicate",
        password_hash="secret",
        role=Role.user,
        is_active=True,
        is_email_verified=True,
    )
    session = _AuthLookupSession([primary, duplicate])
    monkeypatch.setattr("app.core.deps.verify_token", lambda *_args, **_kwargs: {"sub": " USER@EXAMPLE.COM "})

    async def _run() -> None:
        with pytest.raises(HTTPException, match="Invalid credentials") as exc_info:
            await get_active_user(token="token", db=session)

        assert exc_info.value.status_code == 401

    asyncio.run(_run())
