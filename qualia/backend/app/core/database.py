from collections.abc import AsyncGenerator
import os

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base


Base = declarative_base()
engine = create_async_engine(os.getenv("DATABASE_URL", "sqlite:///qualia.db"), echo=True)
SessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=True)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    session = SessionLocal
    try:
        yield session
    finally:
        await session.close()
