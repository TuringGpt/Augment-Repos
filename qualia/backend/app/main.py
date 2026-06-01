from fastapi import FastAPI

from app.auth import router as auth_router
from app.core.database import Base, engine
from app.form_cycles import router as form_cycle_router
import app.models  # noqa: F401

app = FastAPI(
    title="Qualia API",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)
app.include_router(auth_router, prefix="/api/v1")
app.include_router(form_cycle_router, prefix="/api/v1")


@app.on_event("startup")
async def create_tables() -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)


@app.get("/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "up"}
