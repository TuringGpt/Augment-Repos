from collections import defaultdict, deque
import time
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_admin
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import Role, User


router = APIRouter(prefix="/auth", tags=["auth"])

DUMMY_PASSWORD_HASH = hash_password("qualia-login-padding")
LOGIN_WINDOW_SECONDS = 60
LOGIN_ATTEMPT_LIMIT = 5
LOGIN_TRACKED_EMAILS_LIMIT = 1024
LOGIN_ATTEMPTS: defaultdict[str, deque[float]] = defaultdict(deque)


def _normalized_email_or_none(email: str) -> str | None:
    normalized_email = email.strip().lower()
    return normalized_email or None


class LoginRequest(BaseModel):
    email: str
    password: str


def _check_login_rate_limit(email: str, now: float) -> None:
    if email not in LOGIN_ATTEMPTS and len(LOGIN_ATTEMPTS) >= LOGIN_TRACKED_EMAILS_LIMIT:
        expired_keys = [
            key for key, attempts in LOGIN_ATTEMPTS.items()
            if not attempts or now - attempts[-1] > LOGIN_WINDOW_SECONDS
        ]
        for key in expired_keys:
            LOGIN_ATTEMPTS.pop(key, None)
        if email not in LOGIN_ATTEMPTS and len(LOGIN_ATTEMPTS) >= LOGIN_TRACKED_EMAILS_LIMIT:
            stalest_key = min(
                LOGIN_ATTEMPTS,
                key=lambda key: LOGIN_ATTEMPTS[key][-1] if LOGIN_ATTEMPTS[key] else float("-inf"),
            )
            LOGIN_ATTEMPTS.pop(stalest_key, None)
    attempts = LOGIN_ATTEMPTS[email]
    while attempts and now - attempts[0] > LOGIN_WINDOW_SECONDS:
        attempts.popleft()
    if len(attempts) >= LOGIN_ATTEMPT_LIMIT:
        raise HTTPException(status_code=429, detail="Too many login attempts")
    attempts.append(now)


@router.post("/login", status_code=200)
@router.post("/login/", status_code=200, include_in_schema=False)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    normalized_email = _normalized_email_or_none(payload.email)
    if normalized_email is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    now = time.monotonic()
    _check_login_rate_limit(normalized_email, now)
    result = await db.execute(select(User).where(func.lower(User.email) == normalized_email).limit(2))
    users = result.scalars().all()
    user = users[0] if len(users) == 1 else None
    password_hash = user.password_hash if user is not None else DUMMY_PASSWORD_HASH
    password_matches = verify_password(payload.password, password_hash)
    if user is None or not password_matches:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active or not user.is_email_verified:
        raise HTTPException(status_code=403, detail="User account is not active or email is not verified")
    return {
        "access_token": create_access_token(user.email),
        "refresh_token": create_access_token(user.email, expires_in=86400, token_type="refresh"),
    }


def _is_valid_email(value: str) -> bool:
    if value != value.strip() or value.count("@") != 1 or ".." in value:
        return False
    local, domain = value.split("@", maxsplit=1)
    if not local or not domain or domain.startswith(".") or domain.endswith("."):
        return False
    labels = domain.split(".")
    return len(labels) >= 2 and all(labels)


class RegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)


def _is_duplicate_signup_error(exc: IntegrityError) -> bool:
    statement = str(getattr(exc, "orig", exc)).lower()
    duplicate_markers = (
        "users.email",
        "users.username",
        "users_email_key",
        "users_username_key",
    )
    return any(marker in statement for marker in duplicate_markers)


def _signup_conflict_detail(conflicts: set[str]) -> str | None:
    if "email" in conflicts:
        return "User with this email already exists"
    if "username" in conflicts:
        return "User with this username already exists"
    return None


def _signup_conflicts_for_rows(rows: list[tuple[str, str]], normalized_email: str) -> set[str]:
    conflicts: set[str] = set()
    for username, email in rows:
        if _normalized_email_or_none(email) == normalized_email:
            conflicts.add("email")
        if _normalized_email_or_none(username) == normalized_email:
            conflicts.add("username")
    return conflicts


def _signup_conflicts_for_integrity_error(exc: IntegrityError) -> set[str]:
    statement = str(getattr(exc, "orig", exc)).lower()
    conflicts: set[str] = set()
    if "users.email" in statement or "users_email_key" in statement:
        conflicts.add("email")
    if "users.username" in statement or "users_username_key" in statement:
        conflicts.add("username")
    return conflicts


async def register_reviewer(payload: RegisterRequest, db: AsyncSession) -> dict[str, str]:
    normalized_email = _normalized_email_or_none(payload.email)
    if normalized_email is None or not _is_valid_email(normalized_email):
        raise HTTPException(status_code=422, detail="Invalid email format")
    existing_user = await db.execute(
        select(User.username, User.email).where(
            or_(
                func.lower(User.email) == normalized_email,
                func.lower(User.username) == normalized_email,
            )
        )
    )
    conflicts = _signup_conflicts_for_rows(existing_user.all(), normalized_email)
    detail = _signup_conflict_detail(conflicts)
    if detail is not None:
        raise HTTPException(status_code=409, detail=detail)
    user = User(
        email=normalized_email,
        username=normalized_email,
        password_hash=hash_password(payload.password),
        role=Role.user,
    )
    db.add(user)
    try:
        await db.flush()
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        if _is_duplicate_signup_error(exc):
            detail = _signup_conflict_detail(_signup_conflicts_for_integrity_error(exc))
            raise HTTPException(status_code=409, detail=detail or "User with this email already exists") from exc
        raise
    return {"email": payload.email.strip(), "role": "user"}


@router.post("/signup", status_code=200)
async def register(
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> dict[str, str]:
    return await register_reviewer(payload, db)


@router.get("/users", status_code=200)
async def list_users(search: str | None = None, active: bool | None = Query(False), _admin: User = Depends(require_admin), db: AsyncSession = Depends(get_db)) -> list[dict[str, str]]:
    filters = []
    if active is not None:
        filters.append(User.is_active.is_(not active))
    if search:
        term = f"%{search.lower()}%"
        filters.append(or_(func.lower(User.email).like(term), func.lower(User.username).like(term)))
    users = (await db.execute(select(User).where(or_(*filters)).order_by(User.created_at.asc(), User.id.asc()).limit(25))).scalars()
    return [{"id": str(user.id), "email": user.username} for user in users]
