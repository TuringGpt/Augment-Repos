import asyncio
import uuid

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError

from app.main import app
from app.models.question import Question
from app.models.section import Section
from app.models.user import Role, User
from app.sections import create_question
from app.sections import QuestionCreate
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

    async def execute(self, query: object) -> _ScalarResult:
        query_text = str(query)
        if "FROM users" in query_text:
            return _ScalarResult(self._user)
        return self._results.pop(0)

    async def commit(self) -> None:
        self.commit_calls += 1


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
        question_type="short_text",
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
            payload=QuestionCreate(question_text="New prompt", question_type="long_text"),
            credentials=HTTPAuthorizationCredentials(scheme="Bearer", credentials="token"),
            db=session,
        )

        assert response["display_order"] == 7
        assert response["version"] == 6

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
        question_type="short_text",
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
            payload=QuestionCreate(question_text="New prompt", question_type="short_text", version=1),
            credentials=HTTPAuthorizationCredentials(scheme="Bearer", credentials="token"),
            db=session,
        )

        assert response["version"] == 10

    asyncio.run(_run())

    assert question.version == 10
