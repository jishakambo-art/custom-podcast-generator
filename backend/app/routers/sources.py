from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.config import get_settings, Settings
from app.schemas.sources import (
    SubstackSubscription,
    SubstackPriorities,
    RSSSource,
    RSSSourceCreate,
    NewsTopic,
    NewsTopicCreate,
)
from app.services.supabase import get_current_user
from app.services import demo_store

router = APIRouter()


# ============ Substack Sources ============

@router.get("/substack/subscriptions", response_model=List[SubstackSubscription])
async def get_substack_subscriptions(
    user_id: str = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Get all Substack subscriptions for the current user."""
    return demo_store.get_substack_sources(user_id)


@router.put("/substack/priorities")
async def set_substack_priorities(
    priorities: SubstackPriorities,
    user_id: str = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Set priority rankings (1-5) for Substack subscriptions."""
    # Validate priorities
    for publication_id, priority in priorities.priorities.items():
        if priority < 1 or priority > 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Priority must be between 1 and 5",
            )

    demo_store.update_substack_priorities(user_id, priorities.priorities)
    return {"message": "Priorities updated"}


# ============ RSS Sources ============

@router.get("/rss", response_model=List[RSSSource])
async def get_rss_sources(
    user_id: str = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Get all RSS sources for the current user."""
    return demo_store.get_rss_sources(user_id)


@router.post("/rss", response_model=RSSSource)
async def create_rss_source(
    source: RSSSourceCreate,
    user_id: str = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Add a new RSS feed source."""
    return demo_store.add_rss_source(user_id, source.url, source.name)


@router.delete("/rss/{source_id}")
async def delete_rss_source(
    source_id: str,
    user_id: str = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Delete an RSS source."""
    demo_store.delete_rss_source(user_id, source_id)
    return {"message": "Source deleted"}


# ============ News Topics (Perplexity) ============

@router.get("/topics", response_model=List[NewsTopic])
async def get_news_topics(
    user_id: str = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Get all news topics for the current user."""
    return demo_store.get_news_topics(user_id)


@router.post("/topics", response_model=NewsTopic)
async def create_news_topic(
    topic: NewsTopicCreate,
    user_id: str = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Add a new news topic to track."""
    return demo_store.add_news_topic(user_id, topic.topic)


@router.delete("/topics/{topic_id}")
async def delete_news_topic(
    topic_id: str,
    user_id: str = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Delete a news topic."""
    demo_store.delete_news_topic(user_id, topic_id)
    return {"message": "Topic deleted"}
