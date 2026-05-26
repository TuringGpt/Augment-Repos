from fastapi import FastAPI
from app.auth import router as auth_router

app = FastAPI(
    title="Qualia API",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)
app.include_router(auth_router)


@app.get("/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "up"}
