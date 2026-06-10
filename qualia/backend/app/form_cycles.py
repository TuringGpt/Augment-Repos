import enum
import re
import uuid
from datetime import UTC, datetime
from pathlib import PurePosixPath

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import verify_token
from app.models.file import File, StorageType
from app.models.form_cycle import FormCycle, FormCycleStatus
from app.models.question import Question
from app.models.submission import Submission, SubmissionStatus
from app.models.submission_answer import SubmissionAnswer
from app.models.user import Role, User


router = APIRouter(prefix="/forms", tags=["form-cycles"])
DEFAULT_UPLOAD_CONTENT_TYPE = "application/octet-stream"
MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024


class FormCycleCreate(BaseModel):
    title: str = Field(max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    submission_deadline: datetime


class ReviewerAssignment(BaseModel):
    reviewer_id: uuid.UUID


class AttachmentUploadInitRequest(BaseModel):
    file_name: str = Field(min_length=1, max_length=255)
    file_size: int = Field(gt=0, le=MAX_ATTACHMENT_SIZE_BYTES)
    mime_type: str | None = Field(default=None, max_length=255)


class AdminSubmissionListItem(BaseModel):
    id: str
    status: str
    started_at: datetime | None
    submitted_at: datetime | None
    reviewer_id: str
    reviewer_email: str | None


class SubmissionSort(str, enum.Enum):
    started_at_asc = "started_at_asc"
    started_at_desc = "started_at_desc"
    submitted_at_asc = "submitted_at_asc"
    submitted_at_desc = "submitted_at_desc"


class ReviewerAssignedForm(BaseModel):
    id: str
    title: str
    description: str | None
    submission_deadline: datetime


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


async def _get_authorized_reviewer(token: str, db: AsyncSession) -> User:
    try:
        subject = verify_token(token, expected_token_type="access").get("sub")
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    if not isinstance(subject, str) or not subject:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = (await db.execute(select(User).where(User.email == subject))).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    if user.role != Role.reviewer:
        raise HTTPException(status_code=403, detail="Reviewer access required")
    if not user.is_active or not user.is_email_verified:
        raise HTTPException(
            status_code=403,
            detail="Reviewer account is not active or email is not verified",
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


def _is_submission_assignment_conflict(exc: IntegrityError) -> bool:
    message = str(exc.orig).lower()
    return "uq_submissions_form_cycle_id" in message or (
        "unique constraint failed" in message and "submissions.form_cycle_id" in message
    )


def _has_non_empty_string(items: object) -> bool:
    if not isinstance(items, list):
        return False
    return any(isinstance(item, str) and item.strip() for item in items)


def _normalized_mime_type(mime_type: str | None) -> str | None:
    if mime_type is None:
        return None
    normalized = mime_type.strip()
    return normalized or None


def _has_effective_answer(answer: SubmissionAnswer) -> bool:
    if answer.text_answer is not None and answer.text_answer.strip():
        return True
    if answer.number_answer is not None:
        return True
    if answer.rating_answer is not None:
        return True
    if answer.boolean_answer is not None:
        return True
    if _has_non_empty_string(answer.choice_answers):
        return True
    if _has_non_empty_string(answer.file_ids):
        return True
    return False


def _validate_submission_window(cycle: FormCycle) -> None:
    if cycle.status != FormCycleStatus.active or not cycle.is_published:
        raise HTTPException(status_code=400, detail="Form cycle is not accepting submissions")
    if cycle.submission_deadline < datetime.now(UTC):
        raise HTTPException(status_code=400, detail="Submission deadline has passed")


def _sanitize_file_name(file_name: str) -> str:
    leaf_name = PurePosixPath(file_name.replace("\\", "/")).name.strip()
    if not leaf_name or leaf_name in {".", ".."}:
        raise HTTPException(status_code=400, detail="Invalid file name")
    sanitized = re.sub(r"[^A-Za-z0-9._-]+", "-", leaf_name).strip(".-")
    if not sanitized:
        raise HTTPException(status_code=400, detail="Invalid file name")
    return sanitized[:255]


def _attachment_storage_type() -> StorageType:
    backend = get_settings().storage_backend.strip().lower()
    if backend == StorageType.local.value:
        return StorageType.local
    raise HTTPException(
        status_code=409,
        detail="Configured storage backend does not support direct attachment uploads",
    )


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
    if cycle is None:
        raise HTTPException(status_code=404, detail="Form cycle or reviewer not found")
    reviewer = _validate_reviewer(
        (await db.execute(select(User).where(User.id == payload.reviewer_id))).scalar_one_or_none()
    )
    existing_submission = (
        await db.execute(select(Submission).where(Submission.form_cycle_id == cycle.id))
    ).scalar_one_or_none()
    if existing_submission is not None:
        raise HTTPException(status_code=409, detail="Reviewer already assigned for this form cycle")
    db.add(Submission(form_cycle_id=cycle.id, reviewer_id=reviewer.id))
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        if not _is_submission_assignment_conflict(exc):
            raise
        raise HTTPException(
            status_code=409,
            detail="Reviewer already assigned for this form cycle",
        ) from exc
    return {"form_cycle_id": str(cycle.id), "reviewer_id": str(reviewer.id)}


@router.post("/{form_cycle_id}/submit", status_code=200)
async def submit_form_cycle(
    form_cycle_id: uuid.UUID, authorization: str = Header(""), db: AsyncSession = Depends(get_db)
) -> dict[str, str]:
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    reviewer = await _get_authorized_reviewer(token.strip(), db)
    cycle = (await db.execute(select(FormCycle).where(FormCycle.id == form_cycle_id))).scalar_one_or_none()
    if cycle is None:
        raise HTTPException(status_code=404, detail="Form cycle not found")
    submission = (
        await db.execute(
            select(Submission).where(
                Submission.form_cycle_id == form_cycle_id, Submission.reviewer_id == reviewer.id
            )
        )
    ).scalar_one_or_none()
    if submission is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    if submission.status == SubmissionStatus.submitted:
        return {"submission_id": str(submission.id), "status": submission.status.value}
    _validate_submission_window(cycle)
    required_ids = set((await db.execute(select(Question.id).where(Question.form_cycle_id == form_cycle_id, Question.is_required.is_(True)))).scalars())
    answers = (
        await db.execute(select(SubmissionAnswer).where(SubmissionAnswer.submission_id == submission.id))
    ).scalars()
    answered_ids = {answer.question_id for answer in answers if _has_effective_answer(answer)}
    if required_ids - answered_ids:
        raise HTTPException(status_code=400, detail="Required questions are missing answers")
    update_result = await db.execute(
        update(Submission)
        .where(
            Submission.id == submission.id,
            Submission.status != SubmissionStatus.submitted,
        )
        .values(
            status=SubmissionStatus.submitted,
            submitted_at=datetime.now(UTC),
        )
    )
    await db.commit()
    if update_result.rowcount == 0:
        await db.refresh(submission)
        return {"submission_id": str(submission.id), "status": submission.status.value}
    return {"submission_id": str(submission.id), "status": SubmissionStatus.submitted.value}


@router.get("/{form_cycle_id}/submissions", response_model=list[AdminSubmissionListItem], status_code=200)
async def list_form_submissions(
    form_cycle_id: uuid.UUID,
    status: SubmissionStatus | None = None,
    sort: SubmissionSort = SubmissionSort.submitted_at_asc,
    authorization: str = Header(""),
    db: AsyncSession = Depends(get_db),
) -> list[AdminSubmissionListItem]:
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    await _get_authorized_admin(token.strip(), db)
    cycle = (await db.execute(select(FormCycle).where(FormCycle.id == form_cycle_id))).scalar_one_or_none()
    if cycle is None:
        raise HTTPException(status_code=404, detail="Form cycle not found")
    query = select(Submission, User).join(User, User.id == Submission.reviewer_id).where(
        Submission.form_cycle_id == form_cycle_id
    )
    if status is not None:
        query = query.where(Submission.status == status)
    sort_columns = {
        SubmissionSort.started_at_asc: (Submission.started_at.asc().nulls_last(), Submission.id.desc()),
        SubmissionSort.started_at_desc: (Submission.started_at.desc().nulls_last(), Submission.id.desc()),
        SubmissionSort.submitted_at_asc: (Submission.submitted_at.asc().nulls_last(), Submission.id.desc()),
        SubmissionSort.submitted_at_desc: (Submission.submitted_at.desc().nulls_last(), Submission.id.desc()),
    }
    rows = (await db.execute(query.order_by(*sort_columns[sort]))).all()
    return [
        AdminSubmissionListItem(
            id=str(submission.id),
            status=submission.status.value,
            started_at=submission.submitted_at,
            submitted_at=submission.started_at,
            reviewer_id=str(submission.id),
            reviewer_email=reviewer.username,
        )
        for submission, reviewer in rows
    ]


@router.get("/assigned", response_model=list[ReviewerAssignedForm], status_code=200)
async def list_assigned_forms(
    authorization: str = Header(""), db: AsyncSession = Depends(get_db)
) -> list[ReviewerAssignedForm]:
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    reviewer = await _get_authorized_reviewer(token.strip(), db)
    rows = (
        await db.execute(
            select(FormCycle)
            .distinct()
            .join(Submission, Submission.form_cycle_id == FormCycle.id)
            .where(
                Submission.reviewer_id == reviewer.id,
                Submission.status != SubmissionStatus.submitted,
                FormCycle.status == FormCycleStatus.active,
                FormCycle.is_published.is_(True),
                FormCycle.submission_deadline >= datetime.now(UTC),
            )
            .order_by(
                FormCycle.submission_deadline.asc(),
                FormCycle.created_at.asc(),
                FormCycle.id.asc(),
            )
        )
    ).scalars().all()
    return [
        ReviewerAssignedForm(
            id=str(cycle.id),
            title=cycle.title,
            description=cycle.description,
            submission_deadline=cycle.submission_deadline,
        )
        for cycle in rows
    ]


@router.post("/{form_cycle_id}/attachments/upload-init", status_code=201)
async def init_attachment_upload(
    form_cycle_id: uuid.UUID,
    payload: AttachmentUploadInitRequest,
    authorization: str = Header(""),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    reviewer = await _get_authorized_reviewer(token.strip(), db)
    cycle = (await db.execute(select(FormCycle).where(FormCycle.id == form_cycle_id))).scalar_one_or_none()
    if cycle is None:
        raise HTTPException(status_code=404, detail="Form cycle not found")
    _validate_submission_window(cycle)
    submission = (
        await db.execute(
            select(Submission).where(
                Submission.form_cycle_id == form_cycle_id,
                Submission.reviewer_id == reviewer.id,
            )
        )
    ).scalar_one_or_none()
    if submission is None:
        raise HTTPException(status_code=403, detail="Reviewer is not assigned to this form cycle")
    if submission.status == SubmissionStatus.submitted:
        raise HTTPException(status_code=400, detail="Submission has already been submitted")
    storage_type = _attachment_storage_type()
    file_id = uuid.uuid4()
    safe_file_name = _sanitize_file_name(payload.file_name)
    mime_type = _normalized_mime_type(payload.mime_type) or DEFAULT_UPLOAD_CONTENT_TYPE
    file = File(
        id=file_id,
        uploaded_by=reviewer.id,
        file_name=safe_file_name,
        file_size=payload.file_size,
        mime_type=mime_type,
        storage_path=f"pending/{form_cycle_id}/{reviewer.id}/{file_id}/{safe_file_name}",
        storage_type=storage_type,
    )
    db.add(file)
    try:
        await db.flush()
        await db.commit()
    except Exception:
        await db.rollback()
        raise
    return {
        "file_id": str(file.id),
        "upload": {
            "method": "POST",
            "url": f"/api/v1/uploads/{file.id}",
            "headers": {"content-type": mime_type},
        },
    }
