"""videos en la pila de fotos

Revision ID: d3b5f7a9c1e2
Revises: c2a4e6b8d0f1
Create Date: 2026-10-17 13:00:00

"""

from collections.abc import Sequence

from alembic import op

revision: str = "d3b5f7a9c1e2"
down_revision: str | Sequence[str] | None = "c2a4e6b8d0f1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_constraint("ck_archivos_tipo", "archivos", type_="check")
    op.create_check_constraint("ck_archivos_tipo", "archivos", "tipo IN ('foto', 'audio', 'video')")


def downgrade() -> None:
    op.drop_constraint("ck_archivos_tipo", "archivos", type_="check")
    op.create_check_constraint("ck_archivos_tipo", "archivos", "tipo IN ('foto', 'audio')")
