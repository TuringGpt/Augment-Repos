import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.models.question import Question
from app.models.section import Section
from app.sections import QuestionCreate


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
    with TestClient(app) as client:
        openapi_schema = client.get("/openapi.json").json()

    post_operation = openapi_schema["paths"]["/api/v1/forms/{form_cycle_id}/sections/{section_id}/questions"]["post"]
    parameter_names = {parameter["name"] for parameter in post_operation["parameters"]}

    assert "form_cycle_id" in parameter_names
    assert "form_id" not in parameter_names
