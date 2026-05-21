from fastapi import FastAPI

app = FastAPI(title="Qualia API", docs_url="/docs", redocs_url="/redoc")


@app.get("/health")
async def healthcheck() -> dict[str, bool]:
    return {"status": True}
