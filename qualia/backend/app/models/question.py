import enum
import uuid

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, JSON, Text, Uuid, false, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db_base import Base


class QuestionType(str, enum.Enum):
    short_text = "short_text"
    long_text = "long_text"
    number = "number"
    single_choice = "single_choice"
    multiple_choice = "multiple_choice"
    dropdown = "dropdown"
    rating = "rating"
    yes_no_na = "yes_no_na"
    file_upload = "file_upload"


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    section_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("sections.id", ondelete="CASCADE"), index=True, nullable=False
    )
    form_cycle_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("form_cycles.id", ondelete="CASCADE"), index=True, nullable=False
    )
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    question_type: Mapped[QuestionType] = mapped_column(
        Enum(QuestionType, name="question_type_enum"),
        default=QuestionType.number,
        server_default=text("'number'"),
        nullable=False,
    )
    is_required: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=false(), nullable=False
    )
    config: Mapped[dict] = mapped_column(
        JSON, default=dict, server_default=text("'{}'"), nullable=False
    )
    conditional_logic: Mapped[dict] = mapped_column(
        JSON, default=dict, server_default=text("'{}'"), nullable=False
    )
    display_order: Mapped[int] = mapped_column(
        Integer, default=0, server_default=text("0"), nullable=False
    )
    version: Mapped[int] = mapped_column(Integer, default=1, server_default=text("1"), nullable=False)
