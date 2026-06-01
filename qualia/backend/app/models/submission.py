import uuid

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    form_cycle_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("form_cycles.id"), index=True, nullable=False
    )
    reviewer_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), index=True, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
