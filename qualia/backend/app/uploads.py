import uuid
from asyncio import to_thread
from pathlib import Path

import anyio
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.form_cycles import _get_authorized_submission_user, _validate_submission_window
from app.models.file import File, StorageType
from app.models.form_cycle import FormCycle
from app.models.submission import Submission, SubmissionStatus


router = APIRouter(prefix="/uploads", tags=["uploads"])


def _upload_root() -> Path:
    return get_settings().local_upload_root


def _normalized_mime_type(mime_type: str | None) -> str | None:
    if mime_type is None:
        return None
    normalized = mime_type.split(";", 1)[0].strip().lower()
    return normalized or None


def _validated_destination(storage_path: str) -> Path:
    root = _upload_root().resolve()
    destination = (root / storage_path).resolve()
    try:
        destination.relative_to(root)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid storage path") from exc
    return destination


def _form_cycle_id_from_storage_path(storage_path: str) -> uuid.UUID:
    parts = Path(storage_path).parts
    if len(parts) < 5 or parts[0] != "pending":
        raise HTTPException(status_code=400, detail="File upload is not attached to an active submission")
    try:
        return uuid.UUID(parts[1])
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="File upload is not attached to an active submission") from exc


async def _cleanup_partial_upload(destination: Path) -> None:
    try:
        await to_thread(destination.unlink, missing_ok=True)
    except OSError:
        return


@router.post("/{file_id}", status_code=201)
async def upload_attachment(
    file_id: uuid.UUID,
    request: Request,
    authorization: str = Header(""),
    content_type: str = Header(""),
    content_length: int | None = Header(None),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    submission_user = await _get_authorized_submission_user(token.strip(), db)

    record = (await db.execute(select(File).where(File.id == file_id))).scalar_one_or_none()
    if record is None:
        raise HTTPException(status_code=404, detail="File not found")
    if record.uploaded_by != submission_user.id:
        raise HTTPException(status_code=403, detail="Upload does not belong to this user")
    cycle = (
        await db.execute(select(FormCycle).where(FormCycle.id == _form_cycle_id_from_storage_path(record.storage_path)))
    ).scalar_one_or_none()
    if cycle is None:
        raise HTTPException(status_code=404, detail="Form cycle not found")
    _validate_submission_window(cycle)
    submission = (
        await db.execute(
            select(Submission).where(
                Submission.form_cycle_id == cycle.id,
                Submission.reviewer_id == submission_user.id,
            )
        )
    ).scalar_one_or_none()
    if submission is None:
        raise HTTPException(status_code=403, detail="User is not assigned to this form cycle")
    if submission.status == SubmissionStatus.submitted:
        raise HTTPException(status_code=400, detail="Submission has already been submitted")
    if record.storage_type != StorageType.local:
        raise HTTPException(status_code=409, detail="Configured storage backend does not support direct uploads")
    if content_length is not None and content_length != record.file_size:
        raise HTTPException(status_code=400, detail="Uploaded file size does not match initialized metadata")

    if (
        normalized_record_mime_type := _normalized_mime_type(record.mime_type)
    ) and _normalized_mime_type(content_type) != normalized_record_mime_type:
        raise HTTPException(status_code=400, detail="Uploaded file type does not match initialized metadata")

    destination = _validated_destination(record.storage_path)
    await to_thread(destination.parent.mkdir, parents=True, exist_ok=True)
    received_size = 0
    try:
        async with await anyio.open_file(destination, "xb") as output_file:
            try:
                async for chunk in request.stream():
                    if not chunk:
                        continue
                    received_size += len(chunk)
                    if received_size > record.file_size:
                        raise HTTPException(status_code=400, detail="Uploaded file size does not match initialized metadata")
                    await output_file.write(chunk)
            except Exception:
                raise
    except FileExistsError as exc:
        raise HTTPException(status_code=409, detail="File has already been uploaded") from exc
    except Exception:
        await _cleanup_partial_upload(destination)
        raise

    if received_size != record.file_size:
        await _cleanup_partial_upload(destination)
        raise HTTPException(status_code=400, detail="Uploaded file size does not match initialized metadata")

    return {
        "file_id": str(record.id),
        "file_name": record.file_name,
        "file_size": record.file_size,
        "mime_type": record.mime_type,
        "storage_path": record.storage_path,
    }
