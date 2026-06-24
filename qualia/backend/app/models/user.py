import enum
import uuid

from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Uuid, false, func, text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import TypeDecorator

from app.core.database import Base


class Role(str, enum.Enum):
    user = "user"
    admin = "admin"


class RoleType(TypeDecorator[Role]):
    impl = String(32)
    cache_ok = True

    @staticmethod
    def _normalized_role(value: str) -> str:
        normalized = value.strip().lower()
        if normalized in {"reviewer", "viewer"}:
            return Role.user.value
        return normalized

    def process_bind_param(self, value: Role | str | None, _dialect) -> str | None:
        if value is None:
            return None
        if isinstance(value, Role):
            return value.value
        if isinstance(value, str):
            return Role(self._normalized_role(value)).value
        raise TypeError(f"Unsupported role value: {value!r}")

    def process_result_value(self, value: str | None, _dialect) -> Role | None:
        if value is None:
            return None
        return Role(self._normalized_role(value))


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    username: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[Role] = mapped_column(
        RoleType(),
        default=Role.user,
        server_default=text("'user'"),
        index=True,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=false(), index=True, nullable=False
    )
    is_email_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=false(), nullable=False
    )
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
