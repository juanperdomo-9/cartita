"""Configuración de la app, leída de variables de entorno (o de backend/.env en desarrollo)."""

from functools import lru_cache

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Postgres de Supabase por el pooler en modo transacción (puerto 6543)
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:54322/postgres"

    # Supabase Storage (solo desde el backend)
    supabase_url: str = ""
    supabase_service_role_key: SecretStr = SecretStr("")
    storage_bucket: str = "cartas"

    # Secreto que se mezcla al guardar el hash de los tokens
    token_pepper: SecretStr = SecretStr("")

    app_base_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:5173"

    # Etapa 2: cobro con Mercado Pago
    pagos_activos: bool = False
    mp_access_token: SecretStr = SecretStr("")
    mp_webhook_secret: SecretStr = SecretStr("")

    @field_validator("database_url")
    @classmethod
    def usar_psycopg(cls, valor: str) -> str:
        """Supabase entrega `postgresql://...`; SQLAlchemy necesita el driver explícito."""
        for prefijo in ("postgres://", "postgresql://"):
            if valor.startswith(prefijo):
                return "postgresql+psycopg://" + valor.removeprefix(prefijo)
        return valor

    @field_validator("frontend_url", "app_base_url")
    @classmethod
    def sin_barra_final(cls, valor: str) -> str:
        return valor.rstrip("/")


@lru_cache
def get_settings() -> Settings:
    return Settings()
