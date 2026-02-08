"""
NotebookLM Authentication Handler

Handles browser-based Google OAuth authentication for NotebookLM.
Uses the notebooklm-py library which launches a browser for Google login.

Credentials are stored per-user in a secure location.
"""

import json
import asyncio
import subprocess
import os
from pathlib import Path
from typing import Dict, Optional
from datetime import datetime


def _is_headless_mode() -> bool:
    """
    Check if browser should run in headless mode.

    Returns True for production environments (Railway, Render, etc.)
    Returns False for local development to show visible browser.
    """
    from app.config import get_settings
    settings = get_settings()
    return settings.browser_headless.lower() in ("true", "1", "yes")


class NotebookLMAuth:
    """Handle NotebookLM authentication via browser-based Google OAuth."""

    def __init__(self, credentials_dir: str = ".notebooklm_credentials"):
        """
        Initialize authentication handler.

        Args:
            credentials_dir: Directory to store user credentials
        """
        self.credentials_dir = Path(credentials_dir)
        self.credentials_dir.mkdir(exist_ok=True)

        # In-memory cache of authentication status
        self._auth_cache: Dict[str, Dict] = {}

    def _get_user_creds_path(self, user_id: str) -> Path:
        """Get the path to a user's credentials file."""
        return self.credentials_dir / f"{user_id}.json"

    async def authenticate_user(self, user_id: str) -> Dict[str, any]:
        """
        Authenticate user with NotebookLM via browser-based Google OAuth.

        This will:
        1. Launch a Chromium browser window for Google login
        2. User completes OAuth in the browser
        3. Store credentials securely for this user

        Args:
            user_id: Unique user identifier

        Returns:
            Dict with status, message, and credentials_stored flag
        """
        try:
            # Import Playwright for browser automation
            try:
                from playwright.async_api import async_playwright
            except ImportError:
                return {
                    "status": "error",
                    "message": "Playwright not installed. Run: pip install playwright && playwright install chromium",
                    "credentials_stored": False,
                }

            # Create storage path for this user's credentials
            storage_path = self._get_user_creds_path(user_id)
            storage_path.parent.mkdir(parents=True, exist_ok=True)

            # Create a temporary browser profile directory for this user
            browser_profile_dir = self.credentials_dir / f"{user_id}_browser_profile"
            browser_profile_dir.mkdir(parents=True, exist_ok=True)

            # Launch browser with persistent context (appears more like a real browser to Google)
            headless = _is_headless_mode()

            async with async_playwright() as p:
                # Use launch_persistent_context instead of launch + new_context
                # This makes the browser appear as a normal user browser, not automation
                context = await p.chromium.launch_persistent_context(
                    user_data_dir=str(browser_profile_dir),
                    headless=headless,
                    args=[
                        "--disable-blink-features=AutomationControlled",  # Hide automation
                        "--password-store=basic",  # Avoid keychain issues
                        "--no-sandbox",  # Required for Docker/Railway
                        "--disable-setuid-sandbox",  # Required for Docker/Railway
                        "--disable-dev-shm-usage",  # Overcome limited resource problems
                        "--disable-gpu",  # Not needed in headless
                    ],
                    ignore_default_args=["--enable-automation"],  # Remove automation flag
                )

                # Get the first page (persistent context starts with one)
                page = context.pages[0] if context.pages else await context.new_page()

                # Navigate to NotebookLM
                await page.goto("https://notebooklm.google.com/")

                # Wait for user to complete login
                # Check if they reach the NotebookLM homepage (which means logged in)
                try:
                    # Wait for either the notebook list or the "Get started" button
                    await page.wait_for_selector('[data-testid="notebook-card"], [aria-label="Get started"]', timeout=300000)
                except Exception:
                    # If timeout or error, still try to save in case user manually navigated
                    pass

                # Save the storage state (cookies, local storage, etc.)
                await context.storage_state(path=str(storage_path))
                storage_path.chmod(0o600)  # Restrict to owner only

                await context.close()

            # Load credentials from storage file to save to database
            with open(storage_path, "r") as f:
                credentials = json.load(f)

            # Save credentials to database
            from app.services import db
            db.save_notebooklm_credentials(user_id, credentials)

            # Save authentication metadata
            auth_metadata = {
                "user_id": user_id,
                "authenticated": True,
                "authenticated_at": datetime.utcnow().isoformat(),
                "credentials_path": str(storage_path),
            }

            # Store in cache
            self._auth_cache[user_id] = auth_metadata

            # Clean up local storage file after saving to database
            try:
                storage_path.unlink()
            except Exception:
                pass

            return {
                "status": "success",
                "message": "Successfully authenticated with NotebookLM via Google",
                "credentials_stored": True,
            }

        except Exception as e:
            return {
                "status": "error",
                "message": f"Authentication failed: {str(e)}",
                "credentials_stored": False,
            }

    def get_user_credentials(self, user_id: str) -> Optional[Dict]:
        """
        Get stored credentials metadata for a user.

        Args:
            user_id: Unique user identifier

        Returns:
            Dict with authentication metadata or None
        """
        # Check cache first
        if user_id in self._auth_cache:
            return self._auth_cache[user_id]

        # Load from database
        from app.services import db
        credentials = db.get_notebooklm_credentials(user_id)

        if credentials:
            metadata = {
                "user_id": user_id,
                "authenticated": True,
                "credentials": credentials,
            }
            self._auth_cache[user_id] = metadata
            return metadata

        return None

    def is_authenticated(self, user_id: str) -> bool:
        """
        Check if user has valid NotebookLM credentials.

        Args:
            user_id: Unique user identifier

        Returns:
            True if authenticated, False otherwise
        """
        from app.services import db
        credentials = db.get_notebooklm_credentials(user_id)
        return credentials is not None

    async def get_client(self, user_id: str) -> Optional[any]:
        """
        Get an authenticated NotebookLM client for a user.

        Args:
            user_id: Unique user identifier

        Returns:
            NotebookLMClient instance or None if not authenticated
        """
        if not self.is_authenticated(user_id):
            return None

        try:
            from notebooklm import NotebookLMClient
            from app.services import db

            # Get credentials from database
            credentials = db.get_notebooklm_credentials(user_id)
            if not credentials:
                return None

            # Create temporary storage file for notebooklm-py
            user_storage_path = self._get_user_creds_path(user_id)
            user_storage_path.parent.mkdir(parents=True, exist_ok=True)

            with open(user_storage_path, "w") as f:
                json.dump(credentials, f, indent=2)

            user_storage_path.chmod(0o600)

            # Load client from stored credentials
            client = await NotebookLMClient.from_storage(path=str(user_storage_path))
            return client

        except Exception:
            return None

    async def revoke_authentication(self, user_id: str) -> Dict[str, any]:
        """
        Revoke user's NotebookLM authentication.

        Args:
            user_id: Unique user identifier

        Returns:
            Dict with status and message
        """
        try:
            from app.services import db

            # Delete credentials from database
            db.delete_notebooklm_credentials(user_id)

            # Remove temporary credentials file if it exists
            creds_path = self._get_user_creds_path(user_id)
            if creds_path.exists():
                creds_path.unlink()

            # Clear cache
            if user_id in self._auth_cache:
                del self._auth_cache[user_id]

            return {
                "status": "success",
                "message": "Authentication revoked",
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Failed to revoke authentication: {str(e)}",
            }


# Global instance
notebooklm_auth = NotebookLMAuth()
