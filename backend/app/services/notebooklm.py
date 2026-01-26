"""
NotebookLM integration service using notebooklm-py library.

This service handles:
- Creating notebooks
- Adding content as sources
- Generating audio overviews (podcasts)

Reference: https://github.com/teng-lin/notebooklm-py
"""

from typing import List, Dict, Any, Optional
import asyncio


async def create_notebook_with_content(
    title: str,
    content_items: List[Dict[str, Any]],
    user_id: str,
) -> Dict[str, Any]:
    """
    Create a NotebookLM notebook and add content sources.

    Args:
        title: Notebook title (e.g., "DailyBrief - 2024-01-15")
        content_items: List of content to add as sources
        user_id: User ID to get authenticated client

    Returns:
        Dict with notebook_id and status
    """
    try:
        from app.services.notebooklm_auth import notebooklm_auth

        # Get authenticated client for this user
        client = await notebooklm_auth.get_client(user_id)

        if client is None:
            return {
                "notebook_id": None,
                "status": "error",
                "error": "User not authenticated with NotebookLM",
            }

        # Open client connection (required for API calls)
        async with client:
            # Create notebook
            notebook = await client.notebooks.create(title)
            notebook_id = notebook.id

            # Add each content item as a source and collect source IDs
            source_ids = []
            for item in content_items:
                if item["type"] == "text":
                    source = await client.sources.add_text(
                        notebook_id=notebook_id,
                        title=item.get("title", "Source"),
                        content=item["content"],
                    )
                    source_ids.append(source.id)
                elif item["type"] == "url":
                    source = await client.sources.add_url(
                        notebook_id=notebook_id,
                        url=item["url"],
                    )
                    source_ids.append(source.id)

            # Wait for all sources to be ready before generating audio
            if source_ids:
                await client.sources.wait_for_sources(
                    notebook_id=notebook_id,
                    source_ids=source_ids,
                    timeout=120
                )

        return {
            "notebook_id": notebook_id,
            "status": "created",
            "sources_added": len(content_items),
        }

    except ImportError:
        # notebooklm-py not installed
        return {
            "notebook_id": None,
            "status": "error",
            "error": "notebooklm-py not installed. Run: pip install notebooklm-py",
        }
    except Exception as e:
        return {
            "notebook_id": None,
            "status": "error",
            "error": str(e),
        }


async def generate_audio_overview(
    notebook_id: str,
    user_id: str,
    instructions: Optional[str] = None,
    format: str = "deep-dive",
) -> Dict[str, Any]:
    """
    Generate audio overview (podcast) for a notebook.

    Args:
        notebook_id: The NotebookLM notebook ID
        user_id: User ID to get authenticated client
        instructions: Optional custom instructions for the podcast
        format: Podcast format (deep-dive, brief, critique, debate)

    Returns:
        Dict with generation status
    """
    try:
        from app.services.notebooklm_auth import notebooklm_auth

        # Get authenticated client for this user
        client = await notebooklm_auth.get_client(user_id)

        if client is None:
            return {
                "status": "error",
                "error": "User not authenticated with NotebookLM",
            }

        # Open client connection (required for API calls)
        async with client:
            # Map format string to AudioFormat enum
            from notebooklm.rpc import AudioFormat
            format_map = {
                "deep-dive": AudioFormat.DEEP_DIVE,
                "brief": AudioFormat.BRIEF,
                "critique": AudioFormat.CRITIQUE,
                "debate": AudioFormat.DEBATE,
            }
            audio_format = format_map.get(format, AudioFormat.DEEP_DIVE)

            # Generate audio overview
            default_instructions = (
                "Create an engaging podcast discussion covering all the main topics "
                "from today's sources. Make it conversational and informative, "
                "suitable for a busy professional listening during their commute."
            )

            generation_status = await client.artifacts.generate_audio(
                notebook_id=notebook_id,
                instructions=instructions or default_instructions,
                audio_format=audio_format,
            )

            # Wait for completion (with timeout)
            final_status = await client.artifacts.wait_for_completion(
                notebook_id=notebook_id,
                task_id=generation_status.task_id,
                timeout=600,  # 10 min timeout
            )

            if final_status.is_failed:
                return {
                    "status": "error",
                    "error": final_status.error or "Audio generation failed",
                }

            return {
                "status": "complete",
                "audio_url": final_status.url,
                "task_id": final_status.task_id,
            }

    except ImportError:
        return {
            "status": "error",
            "error": "notebooklm-py not installed. Run: pip install notebooklm-py",
        }
    except asyncio.TimeoutError:
        return {
            "status": "timeout",
            "error": "Audio generation timed out",
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
        }


def format_content_for_notebook(
    substack_posts: List[Dict],
    rss_entries: Dict[str, List[Dict]],
    news_summaries: Dict[str, str],
) -> List[Dict[str, Any]]:
    """
    Format aggregated content for adding to NotebookLM.

    Combines all sources into a list of content items ready to be
    added to a notebook.
    """
    content_items = []

    # Add Substack posts (priority sources)
    for post in substack_posts:
        content_items.append({
            "type": "text",
            "title": f"Newsletter: {post['title']}",
            "content": f"# {post['title']}\n\n{post.get('subtitle', '')}\n\n{post['body']}",
        })

    # Add RSS entries
    for feed_url, entries in rss_entries.items():
        for entry in entries:
            content_items.append({
                "type": "text",
                "title": entry["title"],
                "content": f"# {entry['title']}\n\n{entry.get('summary', '')}\n\n{entry.get('content', '')}",
            })

    # Add news summaries from Perplexity
    for topic, summary in news_summaries.items():
        content_items.append({
            "type": "text",
            "title": f"News: {topic}",
            "content": f"# Latest News: {topic}\n\n{summary}",
        })

    return content_items
