"""la carta admite hasta 2000 caracteres

Revision ID: c2a4e6b8d0f1
Revises: 9f0cbcc80933
Create Date: 2026-10-17 12:00:00

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "c2a4e6b8d0f1"
down_revision: str | Sequence[str] | None = "9f0cbcc80933"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column("cartas", "carta", type_=sa.String(length=2000), existing_nullable=False)


def downgrade() -> None:
    op.alter_column("cartas", "carta", type_=sa.String(length=700), existing_nullable=False)
