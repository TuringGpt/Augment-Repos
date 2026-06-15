from app.models.question import Question
from app.models.section import Section


def test_section_table_name() -> None:
    assert Section.__table__.name == "sections"


def test_question_section_foreign_key() -> None:
    foreign_keys = list(Question.__table__.c.section_id.foreign_keys)
    assert len(foreign_keys) == 1

    foreign_key = foreign_keys[0]
    assert foreign_key.column.table.name == "sections"
    assert foreign_key.column.name == "id"
