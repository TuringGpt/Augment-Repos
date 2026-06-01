import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import verify_token
from app.models.form_cycle import FormCycle
from app.models.submission import Submission
from app.models.user import Role, User


router = APIRouter(prefix="/forms", tags=["form-cycles"])


class FormCycleCreate(BaseModel):
    title: str = Field(max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    submission_deadline: datetime


class ReviewerAssignment(BaseModel):
    reviewer_id: uuid.UUID


async def _get_authorized_admin(token: str, db: AsyncSession) -> User:
    try:
        subject = verify_token(token, expected_token_type="access").get("sub")
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    if not isinstance(subject, str) or not subject:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = (await db.execute(select(User).where(User.email == subject))).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    if user.role != Role.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    if not user.is_active or not user.is_email_verified:
        raise HTTPException(
            status_code=403,
            detail="Admin account is not active or email is not verified",
        )
    return user


def _validate_reviewer(reviewer: User | None) -> User:
    if reviewer is None:
        raise HTTPException(status_code=404, detail="Form cycle or reviewer not found")
    if reviewer.role != Role.reviewer:
        raise HTTPException(status_code=400, detail="Reviewer must have reviewer role")
    if not reviewer.is_active or not reviewer.is_email_verified:
        raise HTTPException(
            status_code=400,
            detail="Reviewer account is not active or email is not verified",
        )
    return reviewer


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
    user = await _get_authorized_admin(token, db)
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


@router.post("/{form_cycle_id}/assign-reviewer", status_code=201)
async def assign_reviewer(
    form_cycle_id: uuid.UUID,
    payload: ReviewerAssignment,
    authorization: str = Header(""),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    scheme, _, token = authorization.partition(" ")
    token = token.strip()
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    await _get_authorized_admin(token, db)
    cycle = (await db.execute(select(FormCycle).where(FormCycle.id == form_cycle_id))).scalar_one_or_none()
    reviewer = _validate_reviewer(
        (await db.execute(select(User).where(User.id == payload.reviewer_id))).scalar_one_or_none()
    )
    if cycle is None:
        raise HTTPException(status_code=404, detail="Form cycle or reviewer not found")
    existing_submission = (
        await db.execute(select(Submission).where(Submission.form_cycle_id == cycle.id))
    ).scalar_one_or_none()
    if existing_submission is not None:
        raise HTTPException(status_code=409, detail="Reviewer already assigned for this form cycle")
    db.add(Submission(form_cycle_id=cycle.id, reviewer_id=reviewer.id))
    await db.commit()
    return {"form_cycle_id": str(cycle.id), "reviewer_id": str(reviewer.id)}
