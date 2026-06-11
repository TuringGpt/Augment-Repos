import asyncio

from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import _database_url
from app.core.database import Base
from app import models  # noqa: F401


async def seed_database() -> str:
    database_url = _database_url()
    engine = create_async_engine(database_url, echo=True)
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        return engine.sync_engine.url.render_as_string(hide_password=True)
    finally:
        await engine.dispose()


def main() -> None:
    database_url = asyncio.run(seed_database())
    print(f"Seeded SQLite database at {database_url}")


if __name__ == "__main__":
    main()
