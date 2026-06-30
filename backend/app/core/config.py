from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parents[3]
BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(BACKEND_DIR / ".env", ROOT_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "ABI API"
    app_version: str = "0.1.0"
    debug: bool = False

    database_url: str = "postgresql+asyncpg://abi:abi@127.0.0.1:5433/abi"
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    max_upload_size_mb: int = 50

    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    ai_rate_limit_per_hour: int = 20
    ai_sql_result_limit: int = 100

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def database_url_sync(self) -> str:
        """URL síncrona para Alembic (psycopg)."""
        return self.database_url.replace("+asyncpg", "+psycopg")


settings = Settings()
