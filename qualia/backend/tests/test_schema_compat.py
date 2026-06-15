from app.models.question import Question
from app.models.section import Section


def test_section_table_name() -> None:
    assert Section.__tablename__ == "sections"


def test_question_section_foreign_key() -> None:
    foreign_keys = {fk.target_fullname for fk in Question.__table__.c.section_id.foreign_keys}
    assert foreign_keys == {"sections.id"}
