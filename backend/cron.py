#!/usr/bin/env python3
"""
Cron job script that can be run directly or deployed to Render.
Calls the /cron/daily-generation endpoint.
"""
import os
import sys
import httpx
import asyncio

BACKEND_URL = os.getenv("BACKEND_URL", "https://hackathon-production-f662.up.railway.app")


async def trigger_daily_generation():
    """Call the daily generation endpoint."""
    url = f"{BACKEND_URL}/cron/daily-generation"

    try:
        print(f"[CRON] Calling {url}")
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                headers={"Content-Type": "application/json"}
            )

        print(f"[CRON] Status: {response.status_code}")
        print(f"[CRON] Response: {response.text}")

        if response.status_code != 200:
            print(f"[CRON] Error: Request failed with status {response.status_code}")
            sys.exit(1)

        print("[CRON] Success!")
        sys.exit(0)

    except Exception as e:
        print(f"[CRON] Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(trigger_daily_generation())
