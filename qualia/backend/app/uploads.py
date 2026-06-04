import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.form_cycles import _get_authorized_reviewer
from app.models.file import File, StorageType


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
    reviewer = await _get_authorized_reviewer(token.strip(), db)

    record = (await db.execute(select(File).where(File.id == file_id))).scalar_one_or_none()
    if record is None:
        raise HTTPException(status_code=404, detail="File not found")
    if record.uploaded_by != reviewer.id:
        raise HTTPException(status_code=403, detail="Upload does not belong to reviewer")
    if record.storage_type != StorageType.local:
        raise HTTPException(status_code=409, detail="Configured storage backend does not support direct uploads")
    if content_length is not None and content_length != record.file_size:
        raise HTTPException(status_code=400, detail="Uploaded file size does not match initialized metadata")

    if (
        normalized_record_mime_type := _normalized_mime_type(record.mime_type)
    ) and _normalized_mime_type(content_type) != normalized_record_mime_type:
        raise HTTPException(status_code=400, detail="Uploaded file type does not match initialized metadata")

    destination = _validated_destination(record.storage_path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    try:
        with destination.open("xb") as output_file:
            received_size = 0
            try:
                async for chunk in request.stream():
                    if not chunk:
                        continue
                    received_size += len(chunk)
                    if received_size > record.file_size:
                        raise HTTPException(status_code=400, detail="Uploaded file size does not match initialized metadata")
                    output_file.write(chunk)
            except Exception:
                destination.unlink(missing_ok=True)
                raise
    except FileExistsError as exc:
        raise HTTPException(status_code=409, detail="File has already been uploaded") from exc

    if received_size != record.file_size:
        destination.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="Uploaded file size does not match initialized metadata")

    return {
        "file_id": str(record.id),
        "file_name": record.file_name,
        "file_size": record.file_size,
        "mime_type": record.mime_type,
        "storage_path": record.storage_path,
    }
