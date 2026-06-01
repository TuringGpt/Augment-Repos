import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Uuid, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class FormAssignment(Base):
    __tablename__ = "form_assignments"
    __table_args__ = (
        UniqueConstraint(
            "form_cycle_id",
            "assigned_to",
            name="uq_form_assignment_form_cycle_assigned_to",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    form_cycle_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("form_cycles.id"), index=True, nullable=False
    )
    assigned_to: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), index=True, nullable=False
    )
    assigned_by: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), index=True, nullable=False
    )
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    reviewer: Mapped["User"] = relationship("User", foreign_keys=[assigned_to])
    assigned_by_user: Mapped["User"] = relationship("User", foreign_keys=[assigned_by])
