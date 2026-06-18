import uuid
from collections.abc import Mapping

from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field, validator
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


async def _require_admin(credentials: HTTPAuthorizationCredentials | None, db: AsyncSession) -> None:
    if credentials is None or credentials.scheme.lower() != "bearer" or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    try:
        subject = verify_token(credentials.credentials.strip(), expected_token_type="access").get("sub")
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


def _is_section_display_order_conflict(exc: IntegrityError) -> bool:
    statement = str(getattr(exc, "orig", exc))
    return SECTION_DISPLAY_ORDER_CONSTRAINT in statement or "sections.form_cycle_id, sections.display_order" in statement


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
    question_type: QuestionType
    is_required: bool = False
    config: dict = Field(default_factory=dict)
    conditional_logic: dict | None = None
    display_order: int | None = None
    version: int = 1

    @validator("question_text")
    def validate_question_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("question_text must not be blank")
        return normalized

    @validator("conditional_logic", pre=True, always=True)
    def normalize_conditional_logic(cls, value: dict | None) -> dict:
        if value is None:
            return {}
        if not isinstance(value, Mapping):
            raise ValueError("conditional_logic must be an object")
        return dict(value)


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
@router.post(
    "/{form_cycle_id}/sections/{section_id}/questions/",
    status_code=201,
    include_in_schema=False,
)
async def create_question(
    form_cycle_id: uuid.UUID,
    section_id: uuid.UUID,
    payload: QuestionCreate,
    credentials: HTTPAuthorizationCredentials | None = Security(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
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
    if user.role != Role.admin or not user.is_active or not user.is_email_verified:
        raise HTTPException(status_code=403, detail="Admin access required")
    section = (await db.execute(select(Section).where(Section.id == section_id))).scalar_one_or_none()
    if section is None or section.form_cycle_id != form_cycle_id:
        raise HTTPException(status_code=404, detail="Section not found")
    display_order = payload.display_order
    if display_order is None:
        current_max_order = (
            await db.execute(select(func.max(Question.display_order)).where(Question.section_id == section.id))
        ).scalar_one()
        display_order = (current_max_order or 0) + 1
    question = Question(
        section_id=section.id,
        form_cycle_id=form_cycle_id,
        question_text=payload.question_text,
        question_type=payload.question_type,
        is_required=payload.is_required,
        config=payload.config,
        conditional_logic=payload.conditional_logic,
        display_order=display_order,
        version=payload.version,
    )
    db.add(question)
    try:
        await db.flush()
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Question could not be created due to a data conflict") from exc
    return {
        "id": str(question.id),
        "form_cycle_id": str(question.form_cycle_id),
        "section_id": str(question.section_id),
        "question_text": question.question_text,
        "question_type": question.question_type.value,
        "is_required": question.is_required,
        "config": question.config,
        "conditional_logic": question.conditional_logic,
        "display_order": question.display_order,
        "version": question.version,
    }
@router.put("/{form_cycle_id}/sections/{section_id}/questions/{question_id}", status_code=200)
async def update_question(form_cycle_id: uuid.UUID, section_id: uuid.UUID, question_id: uuid.UUID, payload: QuestionCreate, credentials: HTTPAuthorizationCredentials | None = Security(bearer_scheme), db: AsyncSession = Depends(get_db)) -> dict[str, object]:
    await _require_admin(credentials, db)
    question = (
        await db.execute(
            select(Question).where(
                Question.id == question_id,
                Question.section_id == section_id,
                Question.form_cycle_id == form_cycle_id,
            )
        )
    ).scalar_one_or_none()
    if question is None: raise HTTPException(status_code=404, detail="Question not found")
    question.question_text, question.question_type, question.is_required, question.config = payload.question_text, payload.question_type, payload.is_required, payload.config
    question.conditional_logic, question.display_order, question.version = payload.conditional_logic, payload.display_order, payload.version + 1
    await db.commit()
    return {"id": str(question.id), "section_id": str(question.section_id), "form_cycle_id": str(question.form_cycle_id), "question_text": question.question_text, "question_type": question.question_type.value, "is_required": question.is_required, "display_order": question.display_order, "version": question.version}
@router.delete("/{form_cycle_id}/sections/{section_id}/questions/{question_id}", status_code=204)
async def delete_question(form_cycle_id: uuid.UUID, section_id: uuid.UUID, question_id: uuid.UUID, credentials: HTTPAuthorizationCredentials | None = Security(bearer_scheme), db: AsyncSession = Depends(get_db)) -> None:
    await _require_admin(credentials, db)
    question = (
        await db.execute(
            select(Question).where(
                Question.id == question_id,
                Question.section_id == section_id,
                Question.form_cycle_id == form_cycle_id,
            )
        )
    ).scalar_one_or_none()
    if question is None: raise HTTPException(status_code=404, detail="Question not found")
    await db.delete(question)
    await db.commit()
