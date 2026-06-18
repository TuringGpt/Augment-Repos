from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401
from app.auth import router as auth_router
from app.core.config import get_cors_allow_origins
from app.core.database import ensure_section_table_name
from app.form_cycles import router as form_cycle_router
from app.sections import router as section_router
from app.uploads import router as upload_router

app = FastAPI(
    title="Qualia API",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_allow_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router, prefix="/api/v1")
app.include_router(form_cycle_router, prefix="/api/v1")
app.include_router(section_router, prefix="/api/v1")
app.include_router(upload_router, prefix="/api/v1")


@app.on_event("startup")
async def align_section_table_name() -> None:
    await ensure_section_table_name()


@app.get("/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "up"}
