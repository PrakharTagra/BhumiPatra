import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field, ConfigDict


class Settings(BaseSettings):
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Security & Node backend communication
    INTERNAL_API_KEY: str = "bhumipatra_internal_secret_key_2026"
    MAX_FILE_SIZE_MB: int = 50
    NODE_BACKEND_URL: str = "http://localhost:5000"

    # OCR configuration
    OCR_ENGINE: str = "PaddleOCR"
    OCR_LANGUAGES: str = "hi,en"
    OCR_USE_GPU: bool = False

    # Confidence Thresholds
    HIGH_CONFIDENCE_THRESHOLD: float = 0.80
    REVIEW_THRESHOLD: float = 0.60

    # Optional LLM Fallback (Strictly optional, default 'none' for deterministic zero-hallucination)
    LLM_PROVIDER: str = "none"
    LLM_API_KEY: str = ""
    LLM_MODEL: str = ""

    # Temporary directory for file ingestion
    TEMP_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "temp")

    @property
    def language_list(self) -> List[str]:
        return [lang.strip() for lang in self.OCR_LANGUAGES.split(",") if lang.strip()]

    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
os.makedirs(settings.TEMP_DIR, exist_ok=True)

