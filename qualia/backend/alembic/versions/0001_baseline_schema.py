"""Baseline schema migration."""

from alembic import op

from app import models  # noqa: F401
from app.core.database import Base


revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind, tables=Base.metadata.tables.values())


def downgrade() -> None:
    Base.metadata.drop_all(bind=op.get_bind(), tables=Base.metadata.tables.values())
