import uuid
from sqlalchemy import ForeignKey, Uuid, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class FormAssignment(Base):
    __tablename__ = "form_assignments"
    __table_args__ = (UniqueConstraint("form_cycle_id", "assigned_to"),)
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    form_cycle_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("form_cycles.id"), nullable=False
    )
    assigned_to: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False
    )
    reviewer: Mapped["User"] = relationship("User")
