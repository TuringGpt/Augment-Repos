import enum
import uuid

from sqlalchemy import JSON, Enum, Integer, String, Uuid, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class QuestionType(str, enum.Enum):
    short_text = "short_text"
    number = "number"
    choice = "choice"


class Question(Base):
    __tablename__ = "question"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    section_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, index=True, nullable=True)
    prompt: Mapped[str] = mapped_column(String(50), nullable=False)
    question_type: Mapped[QuestionType] = mapped_column(
        Enum(QuestionType, name="question_type_enum"),
        default=QuestionType.number,
        server_default=text("'number'"),
        nullable=False,
    )
    config: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    conditional_logic: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, server_default=text("0"), nullable=False)
