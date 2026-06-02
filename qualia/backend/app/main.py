from fastapi import FastAPI

import app.models  # noqa: F401
from app.auth import router as auth_router
from app.form_cycles import router as form_cycle_router
from app.sections import router as section_router

app = FastAPI(
    title="Qualia API",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)
app.include_router(auth_router, prefix="/api/v1")
app.include_router(form_cycle_router, prefix="/api/v1")
app.include_router(section_router, prefix="/api/v1")


@app.get("/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "up"}
