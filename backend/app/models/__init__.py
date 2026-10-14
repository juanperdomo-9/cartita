"""Modelos de SQLAlchemy. Las tablas se suman en la Fase 1 (siempre con migración de Alembic)."""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
