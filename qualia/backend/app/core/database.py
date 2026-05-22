from collections.abc import AsyncGenerator
import os

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base


Base = declarative_base()
engine = create_async_engine(
    os.getenv("DATABASE_URL", "sqlite+aiosqlite:///qualia.db"),
    echo=os.getenv("SQL_ECHO", "false").lower() in {"1", "true", "yes", "on"},
)
SessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session
