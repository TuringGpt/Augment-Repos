import uuid

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint, Uuid, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Section(Base):
    __tablename__ = "section"
    __table_args__ = (UniqueConstraint("display_order", name="uq_section_display_order"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    form_cycle_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("form_cycle.id"), index=True, nullable=True
    )
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, server_default=text("1"))
    form_cycle: Mapped["FormCycle"] = relationship("FormCycle", back_populates="section")
