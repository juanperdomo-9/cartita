"""Engine y sesión de SQLAlchemy.

La app se conecta al pooler de Supabase en modo transacción, que no admite prepared
statements: por eso psycopg va con `prepare_threshold=None`.
"""

from collections.abc import Iterator
from functools import lru_cache

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings

CONNECT_ARGS = {"prepare_threshold": None}


def crear_engine(url: str) -> Engine:
    return create_engine(
        url,
        connect_args=CONNECT_ARGS,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=5,
    )


@lru_cache
def get_engine() -> Engine:
    return crear_engine(get_settings().database_url)


@lru_cache
def get_sessionmaker() -> sessionmaker[Session]:
    return sessionmaker(bind=get_engine(), autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    """Dependencia de FastAPI: una sesión por request."""
    with get_sessionmaker()() as sesion:
        yield sesion
