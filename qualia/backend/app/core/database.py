from collections.abc import AsyncGenerator
import logging
import os

from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import _database_url
from app.core.db_base import Base


logger = logging.getLogger(__name__)
engine = create_async_engine(
    _database_url(),
    echo=os.getenv("SQL_ECHO", "false").lower() in {"1", "true", "yes", "on"},
)
SessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session


async def _sqlite_section_table_names(conn: AsyncConnection) -> set[str]:
    result = await conn.execute(
        text("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('section', 'sections')")
    )
    return {name for (name,) in result}


async def ensure_section_table_name() -> None:
    if not engine.url.drivername.startswith("sqlite"):
        return
    async with engine.begin() as conn:
        table_names = await _sqlite_section_table_names(conn)
        if "sections" in table_names and "section" in table_names:
            logger.error("Found both 'section' and 'sections' tables in SQLite; refusing automatic rename.")
            raise RuntimeError("Ambiguous SQLite schema: both 'section' and 'sections' tables exist.")
        if "section" not in table_names:
            return
        try:
            await conn.execute(text("ALTER TABLE section RENAME TO sections"))
        except OperationalError:
            table_names = await _sqlite_section_table_names(conn)
            if "sections" in table_names and "section" not in table_names:
                return
            raise
