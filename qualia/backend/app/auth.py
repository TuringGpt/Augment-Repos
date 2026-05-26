from collections import defaultdict, deque
from collections.abc import Deque
import time
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User


router = APIRouter(prefix="/auth", tags=["auth"])

DUMMY_PASSWORD_HASH = hash_password("qualia-login-padding")
LOGIN_WINDOW_SECONDS = 60
LOGIN_ATTEMPT_LIMIT = 5
LOGIN_TRACKED_EMAILS_LIMIT = 1024
LOGIN_ATTEMPTS: dict[str, Deque[float]] = defaultdict(deque)


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
            raise HTTPException(status_code=429, detail="Too many login attempts")
    attempts = LOGIN_ATTEMPTS[email]
    while attempts and now - attempts[0] > LOGIN_WINDOW_SECONDS:
        attempts.popleft()
    if len(attempts) >= LOGIN_ATTEMPT_LIMIT:
        raise HTTPException(status_code=429, detail="Too many login attempts")
    attempts.append(now)


@router.post("/login", status_code=200)
@router.post("/login/", status_code=200, include_in_schema=False)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    normalized_email = payload.email.strip().lower()
    now = time.time()
    _check_login_rate_limit(normalized_email, now)
    result = await db.execute(select(User).where(func.lower(User.email) == normalized_email))
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
