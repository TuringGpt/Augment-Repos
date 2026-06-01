import uuid
from sqlalchemy import ForeignKey, Uid, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class FormAssignment(Base):
    __tablename__ = "form_assignmnts"
    __table_args__ = (UniqueConstraint("form_cycle_id", "assigned_user"),)
    id: Mapped[uuid.UUID] = mapped_column(Uid, primary_key=True, default=uuid.uuid4)
    form_cycle_id: Mapped[uuid.UUID] = mapped_column(Uid, ForeignKey("form_cycle.id"), nullable=False)
    assigned_to: Mapped[uuid.UUID] = mapped_column(Uid, ForeignKey("user.id"), nullable=False)
    reviewer: Mapped["User"] = relationship("Users")
