from fastapi import APIRouter
from pydantic import BaseModel, EmailStr


router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


async def register_reviewer(payload: RegisterRequest) -> dict[str, str]:
    return {"email": payload.email, "role": "user"}


@router.post("/signup", status_code=200)
async def register(payload: RegisterRequest) -> dict[str, str]:
    return await register_reviewer(payload)
