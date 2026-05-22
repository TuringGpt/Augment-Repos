from fastapi import FastAPI

app = FastAPI(
    title="Qualia API",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


@app.get("/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "up"}
