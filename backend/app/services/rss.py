import feedparser
from typing import List, Dict, Any
from datetime import datetime, timedelta
import httpx


async def fetch_rss_feed(url: str) -> List[Dict[str, Any]]:
    """
    Fetch and parse an RSS feed.

    Returns list of entries from the last 24 hours.
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=15.0)
        content = response.text

    feed = feedparser.parse(content)

    entries = []
    cutoff = datetime.utcnow() - timedelta(hours=24)

    for entry in feed.entries:
        # Parse published date
        published = None
        if hasattr(entry, "published_parsed") and entry.published_parsed:
            published = datetime(*entry.published_parsed[:6])
        elif hasattr(entry, "updated_parsed") and entry.updated_parsed:
            published = datetime(*entry.updated_parsed[:6])

        # Filter to last 24 hours if we have a date
        if published and published < cutoff:
            continue

        entries.append({
            "title": entry.get("title", ""),
            "link": entry.get("link", ""),
            "summary": entry.get("summary", ""),
            "content": entry.get("content", [{}])[0].get("value", "") if entry.get("content") else "",
            "published": published.isoformat() if published else None,
            "author": entry.get("author", ""),
        })

    return entries


async def fetch_multiple_feeds(urls: List[str]) -> Dict[str, List[Dict[str, Any]]]:
    """
    Fetch multiple RSS feeds.

    Returns dict mapping URL -> list of entries.
    """
    results = {}

    for url in urls:
        try:
            entries = await fetch_rss_feed(url)
            results[url] = entries
        except Exception as e:
            results[url] = []

    return results
