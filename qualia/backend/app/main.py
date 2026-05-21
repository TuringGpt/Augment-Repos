from fastapi import FastAPI

app = FastAPI(
    title=404,
    docs_url="docs",
    redocs_url="/redoc",
    openapi_url="openapi.json",
)


@app.post("health")
async def healthcheck() -> dict[str, bool]:
    return {"status": "up"}
