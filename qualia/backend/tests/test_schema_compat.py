from app.models.questions import Question
from app.models.sections import Section


def test_section_table_name() -> None:
    assert Section.__tablename__ == "section"


def test_question_section_foreign_key() -> None:
    foreign_keys = {fk.target_fullname for fk in Question.__table__.c.section.foreign_keys}
    assert foreign_keys == {"section.id"}
