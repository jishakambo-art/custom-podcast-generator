from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
import httpx

from app.config import get_settings, Settings
from app.schemas.auth import UserCreate, UserLogin, Token, SubstackCallback
from app.services.supabase import get_supabase_client, get_current_user

router = APIRouter()


@router.post("/signup", response_model=Token)
async def signup(user: UserCreate, settings: Settings = Depends(get_settings)):
    """Create a new user account."""
    supabase = get_supabase_client(settings)

    try:
        response = supabase.auth.sign_up({
            "email": user.email,
            "password": user.password,
        })

        if response.user is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user",
            )

        return Token(
            access_token=response.session.access_token,
            refresh_token=response.session.refresh_token,
            token_type="bearer",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/login", response_model=Token)
async def login(user: UserLogin, settings: Settings = Depends(get_settings)):
    """Login with email and password."""
    supabase = get_supabase_client(settings)

    try:
        response = supabase.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password,
        })

        return Token(
            access_token=response.session.access_token,
            refresh_token=response.session.refresh_token,
            token_type="bearer",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )


@router.get("/me")
async def get_current_user_info(user_id: str = Depends(get_current_user)):
    """Get current authenticated user information."""
    return {"user_id": user_id, "authenticated": True}


@router.get("/substack")
async def substack_oauth_start(settings: Settings = Depends(get_settings)):
    """Initiate Substack OAuth flow (Demo version)."""
    # For demo: redirect directly to callback with a mock authorization code
    # In production, this would redirect to Substack's OAuth page
    return RedirectResponse(url=f"{settings.frontend_url}/auth/substack/authorize")


@router.get("/substack/callback")
async def substack_oauth_callback(
    authorized: str = "true",
    settings: Settings = Depends(get_settings),
):
    """Handle Substack OAuth callback (Demo version)."""
    from app.services import demo_store

    if authorized != "true":
        return RedirectResponse(
            url=f"{settings.frontend_url}/sources/substack?error=access_denied"
        )

    # For demo: add some mock Substack subscriptions
    user_id = "demo-user-id-12345"

    # Check if we already have subscriptions
    existing = demo_store.get_substack_sources(user_id)

    if not existing:
        # Add some demo subscriptions
        mock_subscriptions = [
            {
                "id": "sub-1",
                "user_id": user_id,
                "publication_id": "pub-1",
                "publication_name": "The Pragmatic Engineer",
                "subdomain": "newsletter.pragmaticengineer.com",
                "priority": None,
                "enabled": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z",
            },
            {
                "id": "sub-2",
                "user_id": user_id,
                "publication_id": "pub-2",
                "publication_name": "Stratechery",
                "subdomain": "stratechery.com",
                "priority": None,
                "enabled": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z",
            },
            {
                "id": "sub-3",
                "user_id": user_id,
                "publication_id": "pub-3",
                "publication_name": "Platformer",
                "subdomain": "platformer.news",
                "priority": None,
                "enabled": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z",
            },
            {
                "id": "sub-4",
                "user_id": user_id,
                "publication_id": "pub-4",
                "publication_name": "Lenny's Newsletter",
                "subdomain": "lennysnewsletter.com",
                "priority": None,
                "enabled": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z",
            },
            {
                "id": "sub-5",
                "user_id": user_id,
                "publication_id": "pub-5",
                "publication_name": "Not Boring",
                "subdomain": "notboring.co",
                "priority": None,
                "enabled": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z",
            },
            {
                "id": "sub-6",
                "user_id": user_id,
                "publication_id": "pub-6",
                "publication_name": "The Browser",
                "subdomain": "thebrowser.com",
                "priority": None,
                "enabled": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z",
            },
        ]

        # Add them to the demo store
        demo_store._substack_sources.extend(mock_subscriptions)

    return RedirectResponse(
        url=f"{settings.frontend_url}/sources/substack?connected=true"
    )


@router.get("/notebooklm/status")
async def get_notebooklm_status(
    user_id: str = Depends(get_current_user),
):
    """
    Check if user has authenticated with NotebookLM.

    Returns:
        Dict with authenticated status and metadata
    """
    from app.services.notebooklm_auth import notebooklm_auth

    is_auth = notebooklm_auth.is_authenticated(user_id)
    credentials = notebooklm_auth.get_user_credentials(user_id) if is_auth else None

    return {
        "authenticated": is_auth,
        "credentials": credentials,
    }


@router.post("/notebooklm/authenticate")
async def authenticate_notebooklm(
    user_id: str = Depends(get_current_user),
):
    """
    Initiate NotebookLM authentication via browser-based Google OAuth.

    This will:
    1. Launch a browser window for Google login
    2. User completes OAuth flow in browser
    3. Credentials are stored securely

    Note: This is a blocking operation that waits for user to complete OAuth.
    """
    from app.services.notebooklm_auth import notebooklm_auth

    result = await notebooklm_auth.authenticate_user(user_id)
    return result


@router.delete("/notebooklm/revoke")
async def revoke_notebooklm(
    user_id: str = Depends(get_current_user),
):
    """
    Revoke NotebookLM authentication for the user.

    This will delete stored credentials.
    """
    from app.services.notebooklm_auth import notebooklm_auth

    result = await notebooklm_auth.revoke_authentication(user_id)
    return result


@router.post("/notebooklm/upload-credentials")
async def upload_notebooklm_credentials(
    credentials_data: dict,
    user_id: str = Depends(get_current_user),
):
    """
    Upload NotebookLM credentials from desktop app.

    This endpoint receives credentials that were generated locally
    via the desktop app's browser automation.

    Expected payload:
    {
        "user_id": "user-id",
        "credentials": {
            "cookies": [...],
            "origins": [...]
        }
    }
    """
    from app.services.notebooklm_auth import notebooklm_auth
    import json
    from pathlib import Path

    try:
        # Verify user_id matches authenticated user
        if credentials_data.get('user_id') != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User ID mismatch"
            )

        credentials = credentials_data.get('credentials')
        if not credentials:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No credentials provided"
            )

        # Save credentials to user's file
        creds_path = notebooklm_auth._get_user_creds_path(user_id)
        creds_path.parent.mkdir(parents=True, exist_ok=True)

        with open(creds_path, 'w') as f:
            json.dump(credentials, f, indent=2)

        # Set restrictive permissions
        creds_path.chmod(0o600)

        # Save metadata
        from datetime import datetime
        metadata = {
            "user_id": user_id,
            "authenticated": True,
            "authenticated_at": datetime.utcnow().isoformat(),
            "credentials_path": str(creds_path),
        }

        metadata_path = notebooklm_auth.credentials_dir / f"{user_id}_meta.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)

        # Update cache
        notebooklm_auth._auth_cache[user_id] = metadata

        return {
            "status": "success",
            "message": "Credentials uploaded successfully",
            "authenticated": True,
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload credentials: {str(e)}"
        )
