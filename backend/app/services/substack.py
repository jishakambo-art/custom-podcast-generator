import httpx
from typing import List, Dict, Any

from app.config import Settings


async def get_user_subscriptions(access_token: str) -> List[Dict[str, Any]]:
    """
    Fetch user's Substack subscriptions using OAuth token.

    Note: This is a placeholder - actual Substack API endpoints
    may differ. Adjust based on Substack API documentation.
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://substack.com/api/v1/user/subscriptions",
            headers={
                "Authorization": f"Bearer {access_token}",
            },
            timeout=15.0,
        )

        if response.status_code != 200:
            raise Exception(f"Substack API error: {response.status_code}")

        data = response.json()

        return [
            {
                "publication_id": sub["publication"]["id"],
                "publication_name": sub["publication"]["name"],
                "subdomain": sub["publication"]["subdomain"],
            }
            for sub in data.get("subscriptions", [])
        ]


async def fetch_publication_posts(
    subdomain: str,
    access_token: str,
    limit: int = 5,
) -> List[Dict[str, Any]]:
    """
    Fetch recent posts from a Substack publication.

    Uses the user's access token to fetch posts from subscribed publications.
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://{subdomain}.substack.com/api/v1/posts",
            headers={
                "Authorization": f"Bearer {access_token}",
            },
            params={"limit": limit},
            timeout=15.0,
        )

        if response.status_code != 200:
            # Fallback to public RSS feed
            return await fetch_publication_posts_via_rss(subdomain)

        data = response.json()

        return [
            {
                "title": post["title"],
                "subtitle": post.get("subtitle", ""),
                "body": post.get("body_html", ""),
                "url": post["canonical_url"],
                "published_at": post["post_date"],
            }
            for post in data.get("posts", [])
        ]


async def fetch_publication_posts_via_rss(subdomain: str) -> List[Dict[str, Any]]:
    """
    Fallback: Fetch posts via public RSS feed.
    """
    import feedparser

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://{subdomain}.substack.com/feed",
            timeout=15.0,
        )
        content = response.text

    feed = feedparser.parse(content)

    return [
        {
            "title": entry.get("title", ""),
            "subtitle": "",
            "body": entry.get("content", [{}])[0].get("value", "") if entry.get("content") else entry.get("summary", ""),
            "url": entry.get("link", ""),
            "published_at": entry.get("published", ""),
        }
        for entry in feed.entries[:5]
    ]
