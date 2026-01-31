"""Application configuration module."""

from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/postcodejp"
    
    # Application
    app_name: str = "PostcodeJP API"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Sync schedule (default: 3:00 AM daily)
    sync_schedule_hour: int = 3
    sync_schedule_minute: int = 0
    
    # Japan Post Data URLs
    jp_post_utf_all_url: str = "https://www.post.japanpost.jp/zipcode/dl/utf/zip/utf_ken_all.zip"
    jp_post_jigyosyo_url: str = "https://www.post.japanpost.jp/zipcode/dl/jigyosyo/zip/jigyosyo.zip"
    jp_post_utf_add_url_template: str = "https://www.post.japanpost.jp/zipcode/dl/utf/zip/utf_add_{yymm}.zip"
    jp_post_utf_del_url_template: str = "https://www.post.japanpost.jp/zipcode/dl/utf/zip/utf_del_{yymm}.zip"
    
    # Data directory for temporary files
    data_dir: str = "/tmp/postcodejp"
    
    # CORS allowed origins (comma-separated)
    cors_origins: str = ""
    
    # Admin API authentication
    admin_api_key: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
