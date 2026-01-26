# NotebookLM Authentication Setup

This guide explains how to set up and use the browser-based NotebookLM authentication in DailyBrief.

## Prerequisites

1. **Python 3.10+**: NotebookLM-py requires Python 3.10 or higher
2. **Google Account**: You'll need a Google account to authenticate with NotebookLM
3. **Playwright Browser**: Required for browser-based OAuth

## Installation

### 1. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Install Playwright Browser

The notebooklm-py library uses Playwright to launch a browser for Google OAuth:

```bash
playwright install chromium
```

Or run the setup script:

```bash
cd backend
chmod +x setup.sh
./setup.sh
```

## How It Works

### Architecture

```
User clicks "Connect with Google"
    ↓
POST /auth/notebooklm/authenticate
    ↓
Backend launches Chromium browser
    ↓
User signs in with Google account
    ↓
Google OAuth grants NotebookLM access
    ↓
Credentials stored in .notebooklm_credentials/{user_id}.json
    ↓
User can now generate podcasts
```

### Authentication Flow

1. **User Initiates**: User clicks "Connect with Google" on the NotebookLM page
2. **Browser Launch**: Backend launches a Chromium browser window
3. **Google Login**: User signs in with their Google account
4. **OAuth Consent**: User grants permissions for NotebookLM access
5. **Credential Storage**: Session credentials are stored securely per-user
6. **Client Access**: Podcast generation uses these credentials to access NotebookLM API

## Usage

### Frontend

Navigate to the NotebookLM connection page:

```
http://localhost:3000/sources/notebooklm
```

Click "Connect with Google" to start the authentication flow.

### Backend Endpoints

#### Check Authentication Status
```bash
GET /auth/notebooklm/status
```

Returns:
```json
{
  "authenticated": true,
  "credentials": {
    "user_id": "demo-user-id-12345",
    "authenticated_at": "2024-01-24T10:30:00Z"
  }
}
```

#### Authenticate User
```bash
POST /auth/notebooklm/authenticate
```

Launches browser and returns authentication result:
```json
{
  "status": "success",
  "message": "Successfully authenticated with NotebookLM via Google",
  "credentials_stored": true
}
```

#### Revoke Authentication
```bash
DELETE /auth/notebooklm/revoke
```

Removes stored credentials:
```json
{
  "status": "success",
  "message": "Authentication revoked"
}
```

## Security

### Credential Storage

- Credentials are stored in `.notebooklm_credentials/` directory
- Each user has a separate credentials file: `{user_id}.json`
- Metadata is stored separately: `{user_id}_meta.json`
- **Important**: Add `.notebooklm_credentials/` to `.gitignore`

### Per-User Isolation

Each user's credentials are completely isolated:
- User A cannot access User B's NotebookLM account
- Credentials are loaded per-request based on user ID
- Sessions are managed independently

## Troubleshooting

### "notebooklm-py not installed"

Install the library:
```bash
pip install notebooklm-py
```

### "Browser not found"

Install Playwright browsers:
```bash
playwright install chromium
```

### "Authentication failed"

1. Check that you're using a valid Google account
2. Ensure NotebookLM is accessible in your region
3. Try clearing the credentials directory and re-authenticating

### "User not authenticated with NotebookLM"

Make sure to authenticate before generating podcasts:
1. Go to NotebookLM connection page
2. Click "Connect with Google"
3. Complete the OAuth flow
4. Then try generating a podcast

## Development

### Testing Authentication

You can test the authentication flow locally:

```bash
# Start backend (IMPORTANT: use --loop asyncio for Playwright compatibility)
cd backend
./start.sh

# Or manually:
uvicorn app.main:app --reload --loop asyncio

# Start frontend
cd frontend
npm run dev

# Visit http://localhost:3000/sources/notebooklm
```

**Important**: The backend must use `--loop asyncio` instead of uvloop (uvicorn's default) because Playwright is not compatible with uvloop.

### Debugging

Enable debug logging to see authentication details:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Production Considerations

For production deployment:

1. **Credential Storage**: Use encrypted storage (e.g., AWS Secrets Manager, HashiCorp Vault)
2. **Session Management**: Implement token refresh logic
3. **Rate Limiting**: Add rate limits to prevent abuse
4. **Monitoring**: Track authentication success/failure rates
5. **Error Handling**: Gracefully handle expired sessions

## API Reference

### NotebookLMAuth Class

```python
from app.services.notebooklm_auth import notebooklm_auth

# Authenticate user
result = await notebooklm_auth.authenticate_user(user_id)

# Check if authenticated
is_auth = notebooklm_auth.is_authenticated(user_id)

# Get authenticated client
client = await notebooklm_auth.get_client(user_id)

# Revoke authentication
result = await notebooklm_auth.revoke_authentication(user_id)
```

### Usage in Podcast Generation

```python
from app.services.notebooklm import create_notebook_with_content, generate_audio_overview

# Create notebook (requires authentication)
notebook_result = await create_notebook_with_content(
    title="DailyBrief - 2024-01-24",
    content_items=[...],
    user_id="demo-user-id-12345"
)

# Generate audio (requires authentication)
audio_result = await generate_audio_overview(
    notebook_id=notebook_result["notebook_id"],
    user_id="demo-user-id-12345",
    format="deep-dive"
)
```

## Resources

- [notebooklm-py GitHub](https://github.com/teng-lin/notebooklm-py)
- [Playwright Documentation](https://playwright.dev/python/)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
