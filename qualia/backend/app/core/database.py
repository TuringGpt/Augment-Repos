from collections.abc import AsyncGenerator
import logging
import os
import re

from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.core.config import _database_url


Base = declarative_base()
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


async def _sqlite_table_sql(conn: AsyncConnection, table_name: str) -> str | None:
    result = await conn.execute(
        text("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = :table_name"),
        {"table_name": table_name},
    )
    return result.scalar_one_or_none()


async def _sqlite_table_column_names(conn: AsyncConnection, table_name: str) -> set[str]:
    result = await conn.execute(text(f"PRAGMA table_info({table_name})"))
    return {row[1] for row in result}


def _sqlite_users_table_has_legacy_role_schema(create_sql: str | None) -> bool:
    if not create_sql:
        return False
    normalized = create_sql.lower()
    if "role" not in normalized:
        return False
    return bool(re.search(r"\b(reviewer|viewer)\b", normalized))


async def _sqlite_users_table_has_legacy_role_rows(conn: AsyncConnection) -> bool:
    result = await conn.execute(text("SELECT 1 FROM users WHERE role IN ('reviewer', 'viewer') LIMIT 1"))
    return result.scalar_one_or_none() is not None


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


async def ensure_user_role_storage_compatibility() -> None:
    if not engine.url.drivername.startswith("sqlite"):
        return
    async with engine.begin() as conn:
        users_table_sql = await _sqlite_table_sql(conn, "users")
        if users_table_sql is None:
            return
        user_column_names = await _sqlite_table_column_names(conn, "users")
        if "role" not in user_column_names:
            raise RuntimeError(
                "SQLite users table is missing the required role column. Recreate the local database with "
                "`PYTHONPATH=. python scripts/seed_sqlite.py` before starting the app."
            )
        if _sqlite_users_table_has_legacy_role_schema(users_table_sql):
            raise RuntimeError(
                "Legacy SQLite users.role schema detected. Recreate the local database with "
                "`PYTHONPATH=. python scripts/seed_sqlite.py` before starting the app."
            )
        if not await _sqlite_users_table_has_legacy_role_rows(conn):
            return
        await conn.execute(text("UPDATE users SET role = 'user' WHERE role IN ('reviewer', 'viewer')"))
