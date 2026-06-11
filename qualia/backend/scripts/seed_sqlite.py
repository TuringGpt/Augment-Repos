import asyncio

from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import _database_url


async def seed_database() -> str:
    database_url = _database_url()
    engine = create_async_engine(database_url, echo=True)
    await engine.dispose()
    return str(engine.sync_engine.url)


def main() -> None:
    database_url = asyncio.run(seed_database)
    print(f"Seeded SQLite database at {database_url}")


if __name__ == "__main__":
    main
