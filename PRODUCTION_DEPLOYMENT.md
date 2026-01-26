# Production Deployment with Server-Side Browser Automation

This guide covers deploying DailyBrief to Railway with **server-side browser automation** for NotebookLM authentication.

## Overview

Your users will authenticate with NotebookLM directly through your web app. The backend server launches a browser (via Playwright + Xvfb virtual display), users complete Google OAuth, and credentials are stored securely per-user.

## Architecture

```
User clicks "Connect NotebookLM" in your web app
    ↓
POST /auth/notebooklm/authenticate
    ↓
Railway server launches Chromium in headless mode with Xvfb
    ↓
User sees Google OAuth page (or completes it via URL)
    ↓
Credentials stored in .notebooklm_credentials/{user_id}.json
    ↓
Daily podcasts generated automatically using stored credentials
```

## Prerequisites

1. Railway account (https://railway.app)
2. Supabase account for database
3. Perplexity API key
4. Your code pushed to GitHub

## Step 1: Railway Environment Variables

In your Railway project settings, add these environment variables:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Perplexity
PERPLEXITY_API_KEY=your-perplexity-api-key

# App
SECRET_KEY=your-random-secret-key-here
FRONTEND_URL=https://your-app.vercel.app

# NotebookLM Browser (IMPORTANT!)
BROWSER_HEADLESS=true
```

**Critical:** Set `BROWSER_HEADLESS=true` on Railway. This enables headless browser mode with Xvfb.

## Step 2: Deploy Backend to Railway

### Via Railway Dashboard

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select your repository
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: (already in railway.json)
   - **Start Command**: (already in railway.json)
5. Add all environment variables from Step 1
6. Click "Deploy"

Railway will:
- Install Python dependencies
- Install Xvfb (virtual display server)
- Install Playwright + Chromium
- Start Xvfb on display :99
- Launch your FastAPI server

### Build Process

The `railway.json` is configured to:

```json
{
  "build": {
    "buildCommand": "apt-get update && apt-get install -y xvfb && pip install -r requirements.txt && playwright install-deps && playwright install chromium"
  },
  "deploy": {
    "startCommand": "Xvfb :99 -screen 0 1024x768x24 -ac +extension GLX +render -noreset & export DISPLAY=:99 && uvicorn app.main:app --host 0.0.0.0 --port $PORT --loop asyncio --workers 1"
  }
}
```

This:
1. Installs Xvfb for virtual display
2. Installs Playwright browser dependencies
3. Installs Chromium browser
4. Starts Xvfb on virtual display :99
5. Runs FastAPI with asyncio event loop (required for Playwright)

## Step 3: Deploy Frontend to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js
4. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   ```
5. Deploy

## Step 4: Update CORS

After deploying, update your backend's CORS settings:

Edit `backend/app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-app.vercel.app",  # Add your Vercel URL
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Redeploy backend to Railway.

## Step 5: Test Authentication Flow

1. Visit your Vercel URL
2. Sign up / log in
3. Go to Sources > NotebookLM
4. Click "Connect with Google"
5. Backend launches headless browser with Xvfb
6. Complete Google OAuth
7. Success! Credentials stored

## How It Works

### Local Development (Visible Browser)

```bash
# backend/.env
BROWSER_HEADLESS=false
```

When you run locally, Playwright opens a **visible** Chromium window. You see the Google OAuth flow and can debug issues.

### Production (Headless with Xvfb)

```bash
# Railway environment variable
BROWSER_HEADLESS=true
```

When deployed to Railway:
1. Xvfb creates a virtual display (`:99`)
2. Playwright launches Chromium on that display
3. Browser runs "headlessly" (no physical screen needed)
4. Users still complete OAuth (via browser automation)

## Credential Storage

Credentials are stored **per-user** in `.notebooklm_credentials/` directory:

```
.notebooklm_credentials/
  ├── user-123.json          # User 123's NotebookLM session
  ├── user-123_meta.json     # Metadata (auth timestamp, etc.)
  ├── user-456.json          # User 456's NotebookLM session
  └── user-456_meta.json
```

**Important:** This directory is gitignored and stored on Railway's filesystem.

### Persistence Warning

Railway's filesystem is **ephemeral** by default. If the container restarts, credentials may be lost.

**Solutions:**

1. **Railway Volumes** (Recommended): Mount a persistent volume
   - Go to Railway project settings
   - Add a volume mounted at `/app/.notebooklm_credentials`
   - Credentials persist across deploys

2. **Database Storage**: Store credentials in Supabase (encrypted)
   - Requires additional code to encrypt/decrypt credentials
   - More complex but more robust

For now, use **Railway Volumes** for simplicity.

## Monitoring & Debugging

### Check Logs

Railway Dashboard > Your Service > Logs

Look for:
- `Starting Xvfb` - Virtual display started
- `Launching Chromium` - Browser launched
- `Authentication successful` - User authenticated

### Common Issues

#### "Browser not found"

**Cause:** Playwright/Chromium not installed

**Fix:** Ensure `railway.json` has:
```json
"buildCommand": "... && playwright install-deps && playwright install chromium"
```

#### "Cannot open display :99"

**Cause:** Xvfb not running

**Fix:** Ensure `railway.json` has:
```json
"startCommand": "Xvfb :99 ... & export DISPLAY=:99 && ..."
```

#### "Authentication timeout"

**Cause:** Google OAuth took too long or failed

**Fix:**
- Check Railway logs for errors
- Ensure user completed OAuth within 5 minutes
- May need to adjust timeout in `notebooklm_auth.py`

#### "Headless mode not working"

**Cause:** `BROWSER_HEADLESS` not set to `true`

**Fix:** Add environment variable in Railway:
```
BROWSER_HEADLESS=true
```

## Security Considerations

### 1. Credential Encryption

Currently credentials are stored as plain JSON. For production with paying users, encrypt them:

```python
from cryptography.fernet import Fernet

def encrypt_credentials(data: dict) -> bytes:
    key = os.getenv("CREDENTIAL_ENCRYPTION_KEY")
    f = Fernet(key)
    return f.encrypt(json.dumps(data).encode())
```

### 2. Rate Limiting

Add rate limiting to authentication endpoint to prevent abuse:

```python
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)

@app.post("/auth/notebooklm/authenticate")
@limiter.limit("3/hour")  # Max 3 auth attempts per hour
async def authenticate_notebooklm(...):
    ...
```

### 3. Credential Expiration

Implement automatic re-authentication when credentials expire:

```python
async def get_client(user_id: str):
    client = await notebooklm_auth.get_client(user_id)

    if client is None:
        # Credentials expired, trigger re-auth
        return None

    return client
```

## Scaling Considerations

### Resource Usage

Each authentication:
- Launches Chromium (50-100MB RAM)
- Takes 30-60 seconds
- Uses CPU during OAuth flow

**For personal use + 10 friends:** Railway's basic plan is fine.

**For 100+ users:** Consider:
- Dedicated authentication service
- Queue system for authentication requests
- Higher Railway plan with more resources

### Browser Pool

For high traffic, implement browser pooling:

```python
from playwright.async_api import async_playwright

class BrowserPool:
    def __init__(self, size=5):
        self.browsers = []
        self.size = size

    async def get_browser(self):
        # Reuse existing browser instead of launching new one
        ...
```

## Cost Estimate

**Railway Backend**
- Basic: $5/month (hobby projects)
- Pro: $20/month (includes persistent volumes)

**Vercel Frontend**
- Free (Hobby tier)

**Supabase**
- Free (up to 500MB database)

**Perplexity API**
- Pay-as-you-go (~$0.001 per search)

**Total: $5-20/month** for personal use + small group

## Next Steps

After deploying:

1. ✅ Test authentication flow end-to-end
2. ✅ Add RSS feeds and news topics
3. ✅ Trigger manual generation ("Generate Now")
4. ✅ Verify podcast appears in NotebookLM
5. ✅ Set up scheduled generation (7am daily)
6. ✅ Invite friends to test

## Scheduled Generation Setup

Once basic flow works, add daily cron job:

### Option 1: Railway Cron (Recommended)

Add to `railway.json`:

```json
{
  "cron": {
    "schedule": "0 14 * * *",
    "command": "python -m app.scripts.run_daily_generation"
  }
}
```

### Option 2: GitHub Actions

Create `.github/workflows/daily-podcast.yml`:

```yaml
name: Daily Podcast Generation

on:
  schedule:
    - cron: '0 14 * * *'  # 7am PT

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger generation
        run: |
          curl -X POST ${{ secrets.BACKEND_URL }}/generate/scheduled
```

## Troubleshooting Checklist

- [ ] `BROWSER_HEADLESS=true` in Railway env vars
- [ ] Xvfb installed (check `railway.json` build command)
- [ ] Playwright + Chromium installed (check build logs)
- [ ] `DISPLAY=:99` exported in start command
- [ ] Railway volume mounted for credential persistence
- [ ] CORS allows your Vercel domain
- [ ] Frontend has correct `NEXT_PUBLIC_API_URL`

## Support

If you encounter issues:

1. Check Railway logs
2. Test locally with `BROWSER_HEADLESS=false`
3. Verify Playwright works: `playwright install --help`
4. Check Xvfb is running: `ps aux | grep Xvfb`

---

**You're all set!** Your server-side browser automation is ready for production. Users can authenticate seamlessly, and your backend handles all the browser complexity behind the scenes.
