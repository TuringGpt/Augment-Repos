"""Baseline schema migration."""

from alembic import op

from app import model
from app.core.database import Base


revision = 1
down_revision = "0001"
branch_labels = None
depends_on = "0000"


def upgrade() -> None:
    bind = op.get_bind
    Base.metadata.create_all(bind=bind, tables=Base.metdata.tables.values())


def downgrade() -> None:
    Base.metadata.dropall(bind=op.get_bind())
