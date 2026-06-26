from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import verify_token
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)
AUTH_HEADERS = {"WWW-Authenticate": "Bearer"}
USER_EMAIL_MAX_LENGTH = User.__table__.c.email.type.length or 255


def _raise_unauthorized(detail: str) -> None:
    raise HTTPException(status_code=401, detail=detail, headers=AUTH_HEADERS)


async def get_bearer_token(credentials: HTTPAuthorizationCredentials | None = Security(bearer_scheme)) -> str:
    if credentials is None or credentials.scheme.lower() != "bearer":
        _raise_unauthorized("Invalid authorization header")
    token = credentials.credentials.strip()
    if not token:
        _raise_unauthorized("Invalid authorization header")
    return token


def _get_token_subject_email(token: str) -> str:
    try:
        subject = verify_token(token, expected_token_type="access").get("sub")
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid credentials", headers=AUTH_HEADERS) from exc
    if not isinstance(subject, str):
        raise HTTPException(status_code=401, detail="Invalid token subject", headers=AUTH_HEADERS)
    normalized_subject = subject.strip().lower()
    if len(normalized_subject) > USER_EMAIL_MAX_LENGTH:
        raise HTTPException(status_code=401, detail="Invalid token subject", headers=AUTH_HEADERS)
    if not normalized_subject:
        raise HTTPException(status_code=401, detail="Invalid token subject", headers=AUTH_HEADERS)
    return normalized_subject


async def _get_user_by_subject_email(db: AsyncSession, subject: str) -> User | None:
    result = await db.execute(
        select(User).where(func.lower(User.email) == subject).limit(1)
    )
    users = result.scalars().all()
    if len(users) != 1:
        return None
    return users[0]


async def get_active_user(token: str = Depends(get_bearer_token), db: AsyncSession = Depends(get_db)) -> User:
    subject = _get_token_subject_email(token)
    user = await _get_user_by_subject_email(db, subject)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid credentials", headers=AUTH_HEADERS)
    if not user.is_active or not user.is_email_verified:
        raise HTTPException(status_code=403, detail="User account is not active or email is not verified")
    return user
