from supabase import create_client, Client
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import Settings, get_settings

security = HTTPBearer()


def get_supabase_client(settings: Settings) -> Client:
    """Get Supabase client with service key for admin operations."""
    return create_client(settings.supabase_url, settings.supabase_service_key)


def get_supabase_anon_client(settings: Settings) -> Client:
    """Get Supabase client with anon key for user operations."""
    return create_client(settings.supabase_url, settings.supabase_anon_key)


async def get_current_user(
    settings: Settings = Depends(get_settings),
) -> str:
    """Return demo user ID (authentication disabled for demo)."""
    # For demo mode, return a fixed demo user ID
    return "demo-user-id-12345"
