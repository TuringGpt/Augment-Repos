from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token, verify_password
from app.models.user import User


router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login", status_code=200)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalars().first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active or not user.is_email_verified:
        raise HTTPException(status_code=403, detail="User account is not active")
    return {
        "access_token": create_access_token(user.email),
        "refresh_token": create_access_token(user.email, expires_in=86400, token_type="refresh"),
    }
