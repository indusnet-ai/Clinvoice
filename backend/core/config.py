from pydantic_settings import BaseSettings
from typing import Optional
import secrets

class Settings(BaseSettings):
    # App
    APP_NAME: str = "ClinVoice AI"
    VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Cost
    USD_TO_INR_RATE: float = 88.15

    # Security
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ALGORITHM: str = "HS256"

    # Database
    DATABASE_URL: str

    # Google OAuth (kept optional — only needed if you wire up the OAuth router)
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = ""

    # OpenAI — single key powers Whisper + chat completions
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4.1"
    OPENAI_WHISPER_MODEL: str = "whisper-1"

    # Back-compat aliases (legacy code reads these names)
    CLAUDE_MODEL_NAME: str = "gpt-4.1"
    GEMINI_MODEL_NAME: str = "gpt-4.1"

    # Redis (only needed for ARQ async worker; default is fine when worker isn't running)
    REDIS_URL: str = "redis://localhost:6379"

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:8000"]

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()
