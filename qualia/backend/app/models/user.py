import enum
import uuid

from sqlalchemy import Boolean, Enum, String, Uuid, false, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Role(str, enum.Enum):
    reviewer = "reviewer"
    admin = "admin"
    viewer = "viewer"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[Role] = mapped_column(
        Enum(Role), default=Role.viewer, server_default=text("'viewer'"), nullable=False
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=false(), nullable=False
    )
