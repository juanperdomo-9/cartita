"""Tests contra un Postgres local descartable (docker-compose.yml), nunca el proyecto real.

Usa la base `cartita_test` (la crea si no existe) y corre las migraciones de Alembic.
Los archivos van a una carpeta temporal con el almacenamiento local.
"""

import os
from collections.abc import Iterator

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

BASE_TEST = os.environ.get(
    "TEST_DATABASE_URL", "postgresql+psycopg://postgres:postgres@127.0.0.1:54322/cartita_test"
)
os.environ["DATABASE_URL"] = BASE_TEST
os.environ["SUPABASE_URL"] = ""
os.environ["ENTORNO"] = "desarrollo"
os.environ["TOKEN_PEPPER"] = "pepper-de-test"


def _crear_base() -> None:
    url = make_url(BASE_TEST)
    admin = create_engine(url.set(database="postgres"), isolation_level="AUTOCOMMIT")
    with admin.connect() as c:
        c.execute(text(f'DROP DATABASE IF EXISTS "{url.database}" WITH (FORCE)'))
        c.execute(text(f'CREATE DATABASE "{url.database}"'))
    admin.dispose()


@pytest.fixture(scope="session", autouse=True)
def base_de_test(tmp_path_factory) -> Iterator[None]:
    os.environ["ALMACEN_LOCAL"] = str(tmp_path_factory.mktemp("almacen"))
    from app.config import get_settings

    get_settings.cache_clear()
    _crear_base()

    from alembic.config import Config

    from alembic import command

    command.upgrade(Config("alembic.ini"), "head")
    yield


@pytest.fixture(autouse=True)
def limpiar(base_de_test) -> Iterator[None]:
    from app.db import get_engine
    from app.services import limites

    limites.reiniciar()
    yield
    with get_engine().begin() as c:
        c.execute(text("TRUNCATE cartas CASCADE"))


@pytest.fixture
def cliente():
    from fastapi.testclient import TestClient

    from app.main import crear_app

    return TestClient(crear_app())
