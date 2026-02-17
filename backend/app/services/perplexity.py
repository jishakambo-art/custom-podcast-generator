import httpx
import ssl
from typing import List

from app.config import Settings


async def get_news_for_topic(topic: str, settings: Settings) -> str:
    """
    Query Perplexity using a two-step process:
    1. Search API: Gather raw search results
    2. Research API: Synthesize results into comprehensive content

    Returns a synthesized summary suitable for podcast generation.
    """
    # Create SSL context - disable verification for LibreSSL compatibility
    # This is acceptable for development; in production, install Python with OpenSSL 1.1.1+
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    async with httpx.AsyncClient(verify=False, timeout=60.0) as client:
        # Step 1: Use Search API to get raw search results
        print(f"   Gathering search results for: {topic}")
        search_response = await client.post(
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

        if search_response.status_code != 200:
            error_detail = search_response.text
            raise Exception(f"Perplexity Search API error: {search_response.status_code} - {error_detail}")

        search_data = search_response.json()
        results = search_data.get("results", [])

        if not results:
            return f"No recent news found for {topic} in the last 24 hours."

        # Format search results for synthesis
        search_context = "\n\n".join([
            f"**{result.get('title', '')}** ({result.get('url', '')})\n{result.get('snippet', '')}"
            for result in results
        ])

        # Step 2: Use Agentic Research API to synthesize search results
        print(f"   Synthesizing research for: {topic}")
        research_response = await client.post(
            "https://api.perplexity.ai/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.perplexity_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "sonar",  # Perplexity's native model for research
                "messages": [
                    {
                        "role": "system",
                        "content": "Synthesize the provided search results into comprehensive research. Include key facts, trends, and recent developments. Provide detailed information suitable for a podcast. Reference the sources provided."
                    },
                    {
                        "role": "user",
                        "content": f"Research these topics comprehensively: {topic}\n\nHere are search results to synthesize:\n\n{search_context}"
                    }
                ],
            },
        )

        if research_response.status_code != 200:
            error_detail = research_response.text
            raise Exception(f"Perplexity Research API error: {research_response.status_code} - {error_detail}")

        research_data = research_response.json()

        # Extract synthesized text from response
        if "choices" in research_data and len(research_data["choices"]) > 0:
            research_text = research_data["choices"][0]["message"]["content"]
            return f"# Research: {topic}\n\n{research_text}"
        else:
            # Fallback to formatted search results if synthesis fails
            return f"# Latest news about {topic}\n\n{search_context}"


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
