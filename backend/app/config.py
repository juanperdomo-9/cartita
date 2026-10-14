"""Configuración de la app, leída de variables de entorno (o de backend/.env en desarrollo)."""

import os
from functools import lru_cache
from pathlib import Path

from pydantic import SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

PEPPER_DESARROLLO = "desarrollo-no-usar-en-produccion"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # "desarrollo" o "produccion". En producción se exigen los secretos.
    entorno: str = "desarrollo"

    # Postgres de Supabase por el pooler en modo transacción (puerto 6543).
    # En desarrollo: el Postgres de docker-compose.yml (o la Supabase CLI), en el puerto 54322.
    database_url: str = "postgresql+psycopg://postgres:postgres@127.0.0.1:54322/cartita"

    # Supabase Storage (solo desde el backend). Si SUPABASE_URL está vacía, los archivos se
    # guardan en disco (solo para desarrollo), con links firmados igual que en Storage.
    supabase_url: str = ""
    supabase_service_role_key: SecretStr = SecretStr("")
    storage_bucket: str = "cartas"
    almacen_local: Path = Path(".almacen")

    # Secreto que se mezcla al guardar el hash de los tokens
    token_pepper: SecretStr = SecretStr("")

    # En Render las dos son la misma URL (un solo servicio): si no se cargan, se usa
    # RENDER_EXTERNAL_URL, que Render define solo.
    app_base_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:5173"

    # Carpeta con el frontend compilado (frontend/dist). Si existe, el backend sirve la web.
    frontend_dist: Path | None = None

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

    @field_validator("frontend_url", "app_base_url", "supabase_url")
    @classmethod
    def sin_barra_final(cls, valor: str) -> str:
        return valor.rstrip("/")

    @model_validator(mode="after")
    def url_de_render(self) -> "Settings":
        externa = os.environ.get("RENDER_EXTERNAL_URL", "").rstrip("/")
        if externa:
            if "app_base_url" not in self.model_fields_set:
                self.app_base_url = externa
            if "frontend_url" not in self.model_fields_set:
                self.frontend_url = externa
        return self

    @property
    def es_produccion(self) -> bool:
        return self.entorno == "produccion"

    @property
    def usa_supabase(self) -> bool:
        return bool(self.supabase_url)

    @property
    def pepper(self) -> str:
        valor = self.token_pepper.get_secret_value()
        if valor:
            return valor
        if self.es_produccion:
            raise RuntimeError("Falta TOKEN_PEPPER")
        return PEPPER_DESARROLLO


@lru_cache
def get_settings() -> Settings:
    return Settings()
