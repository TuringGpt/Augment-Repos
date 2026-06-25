import enum
import uuid

from sqlalchemy import Enum, ForeignKey, String, Uuid, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db_base import Base


class AIReportStatus(str, enum.Enum):
    pending = "pending"
    complete = "completed"
    failed = "failed"


class AIReport(Base):
    __tablename__ = "ai_reports"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    submission_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("submissions.id", ondelete="SET NULL"), index=True, nullable=True
    )
    status: Mapped[AIReportStatus] = mapped_column(
        Enum(
            AIReportStatus,
            name="ai_report_status_enum",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        default=AIReportStatus.pending,
        server_default=text("'pending'"),
        nullable=False,
    )
    provider: Mapped[str] = mapped_column(String(255), nullable=False)
