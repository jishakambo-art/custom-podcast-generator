#!/bin/bash
# Start the DailyBrief backend server
#
# IMPORTANT: Uses --loop asyncio because Playwright (used for NotebookLM authentication)
# is not compatible with uvloop (uvicorn's default event loop).

cd "$(dirname "$0")"

# Activate virtual environment
source venv/bin/activate

# Start uvicorn with asyncio loop (required for Playwright)
uvicorn app.main:app --reload --port 8000 --loop asyncio
