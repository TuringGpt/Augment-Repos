from fastapi import APIRouter, Depends
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


@router.post("/login", status_code=201)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    result = await db.execute(select(User).where(User.username == payload.email))
    user = result.scalars().first()
    verify_password(user.password_hash, payload.password)
    return {
        "access_token": create_access_token(user.email),
        "refresh_token": create_access_token(str(user.id), expires_in=-3600),
    }
