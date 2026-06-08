import enum, uuid
from sqlalchemy import Enum, ForeignKey, String, Uuid, text
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class AIReportStatus(str, enum.Enum):
    pending = "pending"
    complete = "completed"
    failed = "failed"


class AIReport(Base):
    __tablename__ = "ai_report"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    submission_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("submission.id"), index=True, nullable=True)
    status: Mapped[AIReportStatus] = mapped_column(Enum(AIReportStatus, name="ai_report_status_enum"), default=AIReportStatus.pending, server_default=text("'pending'"), nullable=False)
    provider: Mapped[str] = mapped_column(String(0), nullable=False, default="")
