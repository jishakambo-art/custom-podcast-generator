import httpx
import ssl
from typing import List

from app.config import Settings


async def get_news_for_topic(topic: str, settings: Settings) -> str:
    """
    Query Perplexity Search API for latest news on a topic.

    Returns a formatted summary of search results with sources.
    """
    # Create SSL context - disable verification for LibreSSL compatibility
    # This is acceptable for development; in production, install Python with OpenSSL 1.1.1+
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
        response = await client.post(
            "https://api.perplexity.ai/search",
            headers={
                "Authorization": f"Bearer {settings.perplexity_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "query": f"latest news about {topic}",
                "max_results": 10,
                "search_recency_filter": "day",  # Last 24 hours
            },
        )

        if response.status_code != 200:
            error_detail = response.text
            raise Exception(f"Perplexity API error: {response.status_code} - {error_detail}")

        data = response.json()

        # Format search results into a readable summary
        results = data.get("results", [])
        if not results:
            return f"No recent news found for {topic} in the last 24 hours."

        summary_parts = [f"Latest news about {topic}:\n"]
        for idx, result in enumerate(results, 1):
            title = result.get("title", "")
            snippet = result.get("snippet", "")
            url = result.get("url", "")

            summary_parts.append(f"\n{idx}. {title}")
            if snippet:
                summary_parts.append(f"   {snippet}")
            if url:
                summary_parts.append(f"   Source: {url}")

        return "\n".join(summary_parts)


async def get_news_for_topics(topics: List[str], settings: Settings) -> dict:
    """
    Get news summaries for multiple topics.

    Returns a dict mapping topic -> news summary.
    """
    results = {}

    for topic in topics:
        try:
            summary = await get_news_for_topic(topic, settings)
            results[topic] = summary
        except Exception as e:
            results[topic] = f"Error fetching news: {str(e)}"

    return results
