import enum
import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, Enum, ForeignKey, String, Text, Uuid, false, func, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db_base import Base


class StorageType(str, enum.Enum):
    s3 = "s3"
    local = "local"


class File(Base):
    __tablename__ = "files"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), index=True, nullable=False
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    storage_path: Mapped[str] = mapped_column(Text, nullable=False)
    storage_type: Mapped[StorageType] = mapped_column(
        Enum(
            StorageType,
            name="file_storage_type_enum",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        default=StorageType.local,
        server_default=text("'local'"),
        nullable=False,
    )
    is_public: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=false(), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True, nullable=False
    )
