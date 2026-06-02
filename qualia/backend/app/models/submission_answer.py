import uuid

from sqlalchemy import Boolean, Float, ForeignKey, Integer, JSON, Text, UniqueConstraint, Uuid, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SubmissionAnswer(Base):
    __tablename__ = "submission_answers"
    __table_args__ = (UniqueConstraint("submission_id", "question_id", name="uq_submission_answer_submission_question"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    submission_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("submissions.id", ondelete="CASCADE"), index=True, nullable=False
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("questions.id", ondelete="CASCADE"), index=True, nullable=False
    )
    text_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    number_answer: Mapped[float | None] = mapped_column(Float, nullable=True)
    choice_answers: Mapped[list[str]] = mapped_column(JSON, default=list, server_default=text("'[]'"), nullable=False)
    rating_answer: Mapped[int | None] = mapped_column(Integer, nullable=True)
    boolean_answer: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    file_ids: Mapped[list[str]] = mapped_column(JSON, default=list, server_default=text("'[]'"), nullable=False)
