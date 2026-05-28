from datetime import datetime

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import verify_token
from app.models.form_cycle import FormCycle
from app.models.user import Role, User


router = APIRouter(prefix="/forms", tags=["form-cycles"])


class FormCycleCreate(BaseModel):
    title: str
    description: str | None = None
    submission_deadline: datetime


@router.post("/", status_code=201)
@router.post("", status_code=201, include_in_schema=False)
async def create_form_cycle(
    payload: FormCycleCreate,
    authorization: str = Header(""),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    scheme, _, token = authorization.partition(" ")
    token = token.strip()
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    if payload.submission_deadline.tzinfo is None:
        raise HTTPException(status_code=422, detail="submission_deadline must include timezone")
    try:
        subject = verify_token(token, expected_token_type="access").get("sub")
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    if not isinstance(subject, str) or not subject:
        raise HTTPException(status_code=401, detail="Invalid token")
    email = subject
    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    if user.role != Role.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    if not user.is_active or not user.is_email_verified:
        raise HTTPException(
            status_code=403,
            detail="Admin account is not active or email is not verified",
        )
    cycle = FormCycle(
        title=payload.title,
        description=payload.description,
        submission_deadline=payload.submission_deadline,
        created_by_id=user.id,
    )
    db.add(cycle)
    await db.flush()
    await db.commit()
    return {"id": str(cycle.id), "status": cycle.status}
