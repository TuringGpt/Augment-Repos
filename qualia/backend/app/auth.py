from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User


router = APIRouter(prefix="/auth", tags=["auth"])

DUMMY_PASSWORD_HASH = hash_password("qualia-login-padding")


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login", status_code=200)
@router.post("/login/", status_code=200, include_in_schema=False)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    normalized_email = payload.email.strip().lower()
    result = await db.execute(select(User).where(func.lower(User.email) == normalized_email))
    user = result.scalars().first()
    password_hash = user.password_hash if user is not None else DUMMY_PASSWORD_HASH
    if user is None or not verify_password(payload.password, password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active or not user.is_email_verified:
        raise HTTPException(status_code=403, detail="User account is not active or email is not verified")
    return {
        "access_token": create_access_token(user.email),
        "refresh_token": create_access_token(user.email, expires_in=86400, token_type="refresh"),
    }
