import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.file import File


router = APIRouter(prefix="/uploads", tags=["uploads"])
UPLOAD_ROOT = Path(__file__).resolve().parents[1] / ".uploads"


@router.post("/{file_id}", status_code=201)
async def upload_attachment(
    file_id: uuid.UUID,
    request: Request,
    content_type: str = Header(""),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    record = (await db.execute(select(File).where(File.id == file_id))).scalar_one_or_none()
    if record is None:
        raise HTTPException(status_code=404, detail="File not found")

    payload = await request.body()
    if len(payload) != record.file_size:
        raise HTTPException(status_code=400, detail="Uploaded file size does not match initialized metadata")

    if record.mime_type and content_type != record.mime_type:
        raise HTTPException(status_code=400, detail="Uploaded file type does not match initialized metadata")

    destination = UPLOAD_ROOT / record.storage_path
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(payload)
    return {
        "file_id": str(record.id),
        "file_name": record.file_name,
        "file_size": record.file_size,
        "mime_type": record.mime_type,
        "storage_path": record.storage_path,
    }
