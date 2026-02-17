from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime

from app.config import get_settings, Settings
from app.services.supabase import get_current_user
from app.services import db

router = APIRouter()

# Admin email - only this user can access admin endpoints
ADMIN_EMAIL = "iamjishak@gmail.com"


def require_admin(user_id: str = Depends(get_current_user), settings: Settings = Depends(get_settings)) -> str:
    """Verify that the current user is an admin."""
    # Get user email from Supabase
    from app.services.supabase import get_supabase_client
    client = get_supabase_client(settings)

    response = client.auth.admin.get_user_by_id(user_id)
    user_email = response.user.email if response.user else None

    if user_email != ADMIN_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return user_id


@router.post("/fix-stuck-generations")
async def fix_stuck_generations(
    admin_user_id: str = Depends(require_admin),
    settings: Settings = Depends(get_settings),
):
    """
    Fix generations stuck in 'generating' or 'fetching' status.
    Marks them as complete if they have a notebook_id.
    Admin only endpoint.
    """
    from app.services.supabase import get_supabase_client
    client = get_supabase_client(settings)

    # Find all generations stuck in generating/fetching with a notebook_id
    stuck_generations = (
        client.table("generation_logs")
        .select("*")
        .in_("status", ["generating", "fetching"])
        .not_.is_("notebook_id", "null")
        .execute()
    )

    fixed_count = 0
    for gen in stuck_generations.data:
        # Update to complete
        client.table("generation_logs").update({
            "status": "complete"
        }).eq("id", gen["id"]).execute()
        fixed_count += 1

    return {
        "fixed": fixed_count,
        "generation_ids": [g["id"] for g in stuck_generations.data]
    }


@router.get("/usage")
async def get_usage_data(
    admin_user_id: str = Depends(require_admin),
    settings: Settings = Depends(get_settings),
):
    """
    Get usage dashboard data showing all users' generations and settings.
    Admin only endpoint.
    """
    from app.services.supabase import get_supabase_client
    client = get_supabase_client(settings)

    # Get all generation logs with user info
    generations_response = (
        client.table("generation_logs")
        .select("*")
        .order("scheduled_at", desc=True)
        .limit(100)
        .execute()
    )

    # Get all users' preferences
    prefs_response = (
        client.table("user_preferences")
        .select("*")
        .execute()
    )

    # Get all users' emails from auth
    users_response = client.auth.admin.list_users()
    users_map = {user.id: user.email for user in users_response}

    # Create a map of user preferences
    prefs_map = {p["user_id"]: p for p in prefs_response.data}

    # Get sources for each user
    rss_response = client.table("rss_sources").select("*").execute()
    topics_response = client.table("news_topics").select("*").execute()

    # Map sources by user
    rss_by_user = {}
    for source in rss_response.data:
        user_id = source["user_id"]
        if user_id not in rss_by_user:
            rss_by_user[user_id] = []
        rss_by_user[user_id].append(source["name"])

    topics_by_user = {}
    for topic in topics_response.data:
        user_id = topic["user_id"]
        if user_id not in topics_by_user:
            topics_by_user[user_id] = []
        topics_by_user[user_id].append(topic["topic"])

    # Combine data
    usage_data = []
    for gen in generations_response.data:
        user_id = gen["user_id"]
        prefs = prefs_map.get(user_id, {})

        usage_data.append({
            "generation_id": gen["id"],
            "user_id": user_id,
            "user_email": users_map.get(user_id, "Unknown"),
            "scheduled_at": gen["scheduled_at"],
            "status": gen["status"],
            "notebook_id": gen.get("notebook_id"),
            "sources_used": gen.get("sources_used"),
            "error_message": gen.get("error_message"),
            "daily_generation_enabled": prefs.get("daily_generation_enabled", False),
            "generation_time": str(prefs.get("generation_time", "06:00")),
            "rss_sources": rss_by_user.get(user_id, []),
            "news_topics": topics_by_user.get(user_id, []),
        })

    return {
        "total_generations": len(usage_data),
        "total_users": len(set(g["user_id"] for g in usage_data)),
        "generations": usage_data,
    }
