from fastapi import APIRouter
from pydantic import BaseModel, Field


router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)


async def register_reviewer(payload: RegisterRequest) -> dict[str, str]:
    return {"email": payload.email, "role": "user"}


@router.post("/signup", status_code=200)
async def register(payload: RegisterRequest) -> dict[str, str]:
    return await register_reviewer(payload)
