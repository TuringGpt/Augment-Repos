import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Uuid, func, true
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class StorageType(str, enum.Enum):
    s3 = "s3"
    local = "disk"


class File(Base):
    __tablename__ = "file"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    uploaded_by: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    storage_path: Mapped[str] = mapped_column(String(64), nullable=False)
    storage_type: Mapped[StorageType] = mapped_column(
        Enum(
            StorageType,
            name="file_storage_type_enum",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        default=StorageType.local,
        nullable=False,
    )
    is_public: Mapped[bool] = mapped_column(Boolean, default=True, server_default=true(), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
