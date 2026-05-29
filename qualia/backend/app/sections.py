import uuid

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import verify_token
from app.models.form_cycle import FormCycle
from app.models.section import Section
from app.models.user import Role, User


router = APIRouter(prefix="/forms", tags=["sections"])


class SectionCreate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    display_order: int = Field(default=1, ge=1)


@router.post("/{form_cycle_id}/sections", status_code=201)
@router.post("/{form_cycle_id}/sections/", status_code=201, include_in_schema=False)
async def create_section(
    form_cycle_id: uuid.UUID,
    payload: SectionCreate,
    authorization: str = Header(""),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str | int | None]:
    scheme, _, token = authorization.partition(" ")
    token = token.strip()
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
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
    section = Section(form_cycle_id=form_cycle.id, title=payload.title, display_order=payload.display_order)
    db.add(section)
    await db.flush()
    await db.commit()
    return {"id": str(section.id), "form_cycle_id": str(form_cycle.id), "title": section.title, "display_order": section.display_order}
