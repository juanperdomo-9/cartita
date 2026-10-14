from app.config import Settings
from app.db import CONNECT_ARGS, crear_engine


def test_database_url_de_supabase_usa_psycopg():
    s = Settings(database_url="postgresql://u:p@aws-0-sa-east-1.pooler.supabase.com:6543/postgres")
    assert s.database_url.startswith("postgresql+psycopg://")


def test_urls_sin_barra_final():
    s = Settings(frontend_url="https://cartita.onrender.com/")
    assert s.frontend_url == "https://cartita.onrender.com"


def test_engine_sin_prepared_statements():
    engine = crear_engine("postgresql+psycopg://u:p@localhost:5432/x")
    # No conecta: solo verificamos el driver y que el pooler no reciba prepared statements.
    assert engine.dialect.driver == "psycopg"
    assert CONNECT_ARGS["prepare_threshold"] is None
    engine.dispose()


def test_supabase_url_sin_rest_v1():
    s = Settings(supabase_url="https://abc.supabase.co/rest/v1/")
    assert s.supabase_url == "https://abc.supabase.co"
