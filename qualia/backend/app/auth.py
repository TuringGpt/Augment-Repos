from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field


router = APIRouter(prefix="/auth", tags=["auth"])


def _is_valid_email(value: str) -> bool:
    local, sep, domain = value.partition("@")
    return bool(sep and local and "." in domain and not domain.startswith(".") and not domain.endswith("."))


class RegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)


async def register_reviewer(payload: RegisterRequest) -> dict[str, str]:
    if not _is_valid_email(payload.email):
        raise HTTPException(status_code=422, detail="Invalid email format")
    return {"email": payload.email, "role": "user"}


@router.post("/signup", status_code=200)
async def register(payload: RegisterRequest) -> dict[str, str]:
    return await register_reviewer(payload)
