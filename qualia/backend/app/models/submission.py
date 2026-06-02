import enum
import uuid

from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Uuid, func, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SubmissionStatus(str, enum.Enum):
    started = "started"
    submitted = "submitted"
    draft = "draft"


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    form_cycle_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("form_cycles.id"), index=True, nullable=False
    )
    reviewer_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), index=True, nullable=False
    )
    status: Mapped[SubmissionStatus] = mapped_column(
        Enum(SubmissionStatus, name="submission_status_enum"),
        default=SubmissionStatus.draft,
        server_default=text("'draft'"),
        nullable=False,
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_saved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
