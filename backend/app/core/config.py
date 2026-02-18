from typing import List, Union, Optional
from pydantic import AnyHttpUrl, PostgresDsn, RedisDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Kitsu Enterprise API"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    API_ENV: str = "development"
    LOG_LEVEL: str = "INFO"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(f"Could not assemble CORS origins from value: {v}")

    # Database & Cache
    DATABASE_URL: PostgresDsn
    REDIS_URL: RedisDsn
    
    # Media Storage
    MEDIA_ROOT: str = "/app/media"
    STATIC_HOST: str = "http://localhost:8000/media"

    # Security
    SECRET_KEY: str = "changeme_in_production_env"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Provider Settings
    SHIKIMORI_URL: str = "https://shikimori.one"
    KODIK_URL: str = "https://kodikapi.com"
    KODIK_API_KEY: Optional[str] = None
    
    # Email / SMTP
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: str = "noreply@kitsu.io"
    FRONTEND_URL: str = "http://localhost:3000"

    # Sentry Monitoring
    SENTRY_DSN: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()