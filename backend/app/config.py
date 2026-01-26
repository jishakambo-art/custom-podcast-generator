from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_key: str

    # Substack OAuth
    substack_client_id: str
    substack_client_secret: str
    substack_redirect_uri: str

    # Perplexity
    perplexity_api_key: str

    # App
    secret_key: str
    frontend_url: str = "http://localhost:3000"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
