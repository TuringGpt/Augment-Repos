import uuid

from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.core.security import verify_token
from app.models.form_cycle import FormCycle
from app.models.question import Question, QuestionType
from app.models.section import Section
from app.models.user import Role, User


router = APIRouter(prefix="/forms", tags=["sections"])
AUTO_ORDER_RETRY_LIMIT = 3
SECTION_DISPLAY_ORDER_CONSTRAINT = "uq_section_form_display_order"
bearer_scheme = HTTPBearer(auto_error=False)


def _is_section_display_order_conflict(exc: IntegrityError) -> bool:
    statement = str(getattr(exc, "orig", exc))
    return SECTION_DISPLAY_ORDER_CONSTRAINT in statement or "section.form_cycle_id, section.display_order" in statement


class SectionCreate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    display_order: int | None = Field(default=None, ge=1)


class SectionResponse(BaseModel):
    id: str
    form_cycle_id: str
    title: str | None
    display_order: int


class QuestionCreate(BaseModel):
    question_text: str = Field(min_length=1)
    question_type: QuestionType = QuestionType.number
    description: str | None = None
    is_required: bool = False
    display_order: int = Field(default=0, ge=0)


@router.post("/{form_cycle_id}/sections", status_code=201, response_model=SectionResponse)
@router.post(
    "/{form_cycle_id}/sections/",
    status_code=201,
    response_model=SectionResponse,
    include_in_schema=False,
)
async def create_section(
    form_cycle_id: uuid.UUID,
    payload: SectionCreate,
    credentials: HTTPAuthorizationCredentials | None = Security(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> SectionResponse:
    if credentials is None or credentials.scheme.lower() != "bearer" or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = credentials.credentials.strip()
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
        raise HTTPException(status_code=403, detail="Admin account is not active or email is not verified")
    form_cycle = (await db.execute(select(FormCycle).where(FormCycle.id == form_cycle_id))).scalar_one_or_none()
    if form_cycle is None:
        raise HTTPException(status_code=404, detail="Form cycle not found")
    display_order = payload.display_order
    retries_remaining = AUTO_ORDER_RETRY_LIMIT if display_order is None else 1
    while retries_remaining > 0:
        next_display_order = display_order
        if next_display_order is None:
            current_max_order = (
                await db.execute(
                    select(func.max(Section.display_order)).where(Section.form_cycle_id == form_cycle.id)
                )
            ).scalar_one()
            next_display_order = (current_max_order or 0) + 1
        section = Section(form_cycle_id=form_cycle.id, title=payload.title, display_order=next_display_order)
        db.add(section)
        try:
            await db.flush()
            await db.commit()
            break
        except IntegrityError as exc:
            await db.rollback()
            db.expunge(section)
            retries_remaining -= 1
            if _is_section_display_order_conflict(exc) and display_order is None and retries_remaining > 0:
                continue
            if _is_section_display_order_conflict(exc):
                raise HTTPException(status_code=409, detail="Section display order already exists for this form cycle") from exc
            raise
    return SectionResponse(
        id=str(section.id),
        form_cycle_id=str(form_cycle.id),
        title=section.title,
        display_order=section.display_order,
    )


@router.post("/{form_cycle_id}/sections/{section_id}/questions", status_code=201)
async def create_question(
    form_cycle_id: uuid.UUID,
    section_id: uuid.UUID,
    payload: QuestionCreate,
    credentials: HTTPAuthorizationCredentials | None = Security(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    if credentials is None or credentials.scheme.lower() != "bearer" or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = credentials.credentials.strip()
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
        raise HTTPException(status_code=403, detail="Admin account is not active or email is not verified")
    section = (
        await db.execute(
            select(Section).where(Section.id == section_id, Section.form_cycle_id == form_cycle_id)
        )
    ).scalar_one_or_none()
    if section is None:
        raise HTTPException(status_code=404, detail="Section not found")
    question = Question(
        section_id=section.id,
        form_cycle_id=section.form_cycle_id,
        question_text=payload.question_text,
        description=payload.description,
        question_type=payload.question_type,
        is_required=payload.is_required,
        display_order=payload.display_order,
    )
    db.add(question)
    await db.flush()
    await db.commit()
    return {"id": str(question.id)}
