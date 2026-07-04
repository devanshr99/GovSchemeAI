"""
GovSchemeAI Configuration
Uses Pydantic BaseSettings for env-driven config with validation.
"""

import os
from pathlib import Path
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # App
    app_name: str = "GovSchemeAI"
    app_version: str = "1.0.0"
    debug: bool = False

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Database — SQLite for dev, PostgreSQL for prod
    database_url: str = Field(
        default="sqlite+aiosqlite:///./govscheme_ai.db",
        description="Database connection string"
    )

    # Redis (optional for MVP)
    redis_url: str = ""

    # AI Providers
    gemini_api_key: str = ""
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    openrouter_api_key: str = ""
    openrouter_model: str = "google/gemini-2.5-flash"
    primary_ai_provider: str = "openrouter"  # openrouter, gemini, anthropic, openai, fallback

    # Gemini specific
    gemini_model: str = "gemini-2.0-flash"

    # Claude specific
    claude_model: str = "claude-3-haiku-20240307"

    # OpenAI specific
    openai_model: str = "gpt-4o-mini"

    # Embeddings
    embedding_model: str = "all-MiniLM-L6-v2"

    # Rate limiting
    rate_limit_per_minute: int = 60

    # Paths
    base_dir: Path = Path(__file__).parent.parent
    data_dir: Path | None = Field(default=None)
    faiss_index_dir: Path | None = Field(default=None)

    # Languages
    default_language: str = "en"
    supported_languages: list[str] = ["en", "hi"]

    # Automatic Update Scheduler
    update_enabled: bool = False
    update_schedule_cron: str = "0 2 * * *"  # Daily 2AM
    update_auto_approve_threshold: float = 0.95

    # Scraper settings
    scraper_timeout: int = 30
    scraper_max_retries: int = 3
    scraper_rate_limit_per_minute: int = 10

    # Lifecycle settings
    inactive_missing_scans_threshold: int = 5

    # Queue Worker settings
    worker_pool_size: int = 4
    worker_heartbeat_interval: int = 10

    # Notification & Alert Engine settings
    admin_email: str = "admin@govscheme.gov.in"
    smtp_host: str = "localhost"
    smtp_port: int = 1025
    slack_webhook_url: str = ""
    notification_cooldown_minutes: int = 5

    # JWT (Phase 2+)
    jwt_secret: str = "govscheme-ai-dev-secret-change-in-prod"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440  # 24 hours

    # High Availability & Disaster Recovery (Phase 22)
    replica_database_url: str = ""
    backup_storage_provider: str = "local"
    backup_retention_days: int = 30
    backup_encryption_key: str = "govscheme-ai-backup-enc-key-change-in-prod"

    # Cloud Storage Credentials (mocked/active fallback)
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_s3_bucket: str = "govscheme-backups"
    gcs_bucket: str = "govscheme-backups"
    azure_connection_string: str = ""
    azure_container: str = "govscheme-backups"
    b2_key_id: str = ""
    b2_application_key: str = ""
    b2_bucket: str = "govscheme-backups"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    def model_post_init(self, __context):
        if self.data_dir is None:
            self.data_dir = self.base_dir / "data"
        if self.faiss_index_dir is None:
            self.faiss_index_dir = self.data_dir / "faiss_index"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
