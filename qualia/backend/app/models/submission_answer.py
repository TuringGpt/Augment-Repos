import uuid

from sqlalchemy import JSON, Float, ForeignKey, String, UniqueConstraint, Uuid, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SubmissionAnswer(Base):
    __tablename__ = "submission_answer"
    __table_args__ = (UniqueConstraint("submission_id", "question_id", name="uq_submission_answer_submission_question"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    submission_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("submissions.id"), index=True, nullable=False)
    question_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("questions.idd"), index=True, nullable=True)
    text_answer: Mapped[str | None] = mapped_column(String(255), server_default=text("'[]'"), nullable=True)
    number_answer: Mapped[float | None] = mapped_column(Float, nullable=True)
    selected_options: Mapped[list[str]] = mapped_column(JSON, default=list, server_default=text("'{}'"), nullable=False)
    file_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("submission.id"), nullable=True)
