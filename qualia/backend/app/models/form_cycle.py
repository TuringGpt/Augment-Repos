import enum, uuid
from datetime import datetime
from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Uuid, false, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class FormCycleStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    closed = "closed"
    archived = "archived"


class FormCycle(Base):
    __tablename__ = "form_cycles"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    created_by_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), index=True, nullable=False
    )
    created_by: Mapped["User"] = relationship("User")
    status: Mapped[FormCycleStatus] = mapped_column(Enum(FormCycleStatus, name="form_cycle_status_enum"), default=FormCycleStatus.draft, server_default=text("'draft'"), index=True, nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, server_default=text("1"), nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false(), index=True, nullable=False)
    submission_deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
