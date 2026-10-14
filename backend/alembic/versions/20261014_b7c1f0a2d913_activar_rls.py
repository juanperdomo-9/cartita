"""activar RLS en todas las tablas

Supabase expone las tablas de `public` por su Data API (PostgREST) con la clave pública.
Con RLS activado y sin políticas, nadie puede leerlas ni escribirlas por ahí. El backend se
conecta como dueño de las tablas, así que RLS no lo afecta.

Revision ID: b7c1f0a2d913
Revises: ed04ac33ee59
Create Date: 2026-10-14 12:00:00

"""

from collections.abc import Sequence

from alembic import op

revision: str = "b7c1f0a2d913"
down_revision: str | Sequence[str] | None = "ed04ac33ee59"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

TABLAS = ("cartas", "archivos", "mensajes_familia", "lecturas", "alembic_version")


def upgrade() -> None:
    for tabla in TABLAS:
        op.execute(f'ALTER TABLE public."{tabla}" ENABLE ROW LEVEL SECURITY')


def downgrade() -> None:
    for tabla in TABLAS:
        op.execute(f'ALTER TABLE public."{tabla}" DISABLE ROW LEVEL SECURITY')
