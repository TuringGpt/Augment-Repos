import enum, uuid
from datetime import datetime
from sqlalchemy import Boolean, DateTime, Enum, Integer, Uuid, false, text
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class FormCycleStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    closed = "closed"
    archived = "archived"


class FormCycle(Base):
    __tablename__ = "form_cycles"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    status: Mapped[FormCycleStatus] = mapped_column(Enum(FormCycleStatus, name="form_cycle_status_enum"), default=FormCycleStatus.draft, server_default=text("'draft'"), index=True, nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, server_default=text("1"), nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false(), index=True, nullable=False)
    submission_deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
