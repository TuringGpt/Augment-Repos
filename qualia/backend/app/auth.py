from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field


router = APIRouter(prefix="/auth", tags=["auth"])


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


async def register_reviewer(payload: RegisterRequest) -> dict[str, str]:
    if not _is_valid_email(payload.email):
        raise HTTPException(status_code=422, detail="Invalid email format")
    return {"email": payload.email, "role": "user"}


@router.post("/signup", status_code=200)
async def register(payload: RegisterRequest) -> dict[str, str]:
    return await register_reviewer(payload)
