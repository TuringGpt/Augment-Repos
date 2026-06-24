from __future__ import annotations

import asyncio
from logging.config import fileConfig
import threading

from alembic import context
from sqlalchemy import engine_from_config, pool
from sqlalchemy.ext.asyncio import async_engine_from_config

from app import models  # noqa: F401
from app.core.config import _database_url
from app.core.database import Base


config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


target_metadata = Base.metadata


def _database_url_value() -> str:
    return _database_url()


def _uses_async_driver(database_url: str) -> bool:
    return "+aiosqlite" in database_url or "+asyncpg" in database_url


def run_migrations_offline() -> None:
    context.configure(
        url=_database_url_value(),
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    configuration = config.get_section(config.config_ini_section, {})
    database_url = _database_url_value()
    configuration["sqlalchemy.url"] = database_url
    if _uses_async_driver(database_url):
        _run_async_migrations_blocking(configuration)
        return

    connectable = engine_from_config(configuration, prefix="sqlalchemy.", poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)

        with context.begin_transaction():
            context.run_migrations()


async def run_async_migrations(configuration: dict[str, str]) -> None:
    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(_run_sync_migrations)

    await connectable.dispose()


def _run_async_migrations_blocking(configuration: dict[str, str]) -> None:
    try:
        asyncio.get_running_loop()
    except RuntimeError:
        asyncio.run(run_async_migrations(configuration))
        return

    error: BaseException | None = None

    def _runner() -> None:
        nonlocal error
        try:
            asyncio.run(run_async_migrations(configuration))
        except BaseException as exc:
            error = exc

    thread = threading.Thread(target=_runner)
    thread.start()
    thread.join()
    if error is not None:
        raise error


def _run_sync_migrations(connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)

    with context.begin_transaction():
        context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
