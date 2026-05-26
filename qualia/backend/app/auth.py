from fastapi import APIRouter
from app.core.security import hash_password
from pydantic import BaseModel, EmailStr, Field


router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


async def register_reviewer(payload: RegisterRequest) -> dict[str, str]:
    password_hash = hash_password(payload.password)
    if not password_hash:
        raise ValueError("password hash generation failed")
    return {"email": payload.email, "role": "user"}


@router.post("/signup", status_code=200)
async def register(payload: RegisterRequest) -> dict[str, str]:
    return await register_reviewer(payload)
