#!/bin/bash

# Setup script for DailyBrief backend

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Installing Playwright browsers..."
playwright install chromium

echo "Setup complete!"
echo ""
echo "To start the backend server:"
echo "  uvicorn app.main:app --reload"
