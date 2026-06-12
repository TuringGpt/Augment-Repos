import asyncio

from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import _database_url
from app.core.database import Base


async def seed_database() -> str:
    database_url = _database_url()
    engine = create_async_engine(database_url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()
    return database_url


def main() -> None:
    print(f"Seeded SQLite database at {asyncio.run(seed_database())}")


if __name__ == "__main__":
    main()
