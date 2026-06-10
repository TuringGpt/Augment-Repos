import uuid

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint, Uuid, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Section(Base):
    __tablename__ = "sections"
    __table_args__ = (
        UniqueConstraint("form_cycle_id", "display_order", name="uq_section_form_display_order"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    form_cycle_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("form_cycles.id", ondelete="CASCADE"), index=True, nullable=False
    )
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    display_order: Mapped[int] = mapped_column(
        Integer, default=1, server_default=text("1"), nullable=False
    )
