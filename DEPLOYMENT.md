# Deployment Guide

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `dailybrief`
3. Description: "Personalized daily podcast from your favorite sources"
4. Make it **Public** or **Private** (your choice)
5. **Do NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

## Step 2: Push to GitHub

```bash
# Add the remote repository (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/dailybrief.git

# Push the code
git branch -M main
git push -u origin main
```

## Step 3: Deploy Frontend to Vercel

### Option A: Via Vercel CLI (Fastest)

```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# - NEXT_PUBLIC_API_URL = your backend URL (from Railway)
```

### Option B: Via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Select the `frontend` directory as root
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = (your Railway backend URL)
5. Deploy

## Step 4: Deploy Backend to Railway

### Via Railway Dashboard

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select your repository
4. Select `backend` directory
5. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `PERPLEXITY_API_KEY`
   - `SECRET_KEY`
   - `FRONTEND_URL` = (your Vercel URL)

### Configure Railway for Python

Create `railway.json` in the backend directory:

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT --loop asyncio",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

Create `Procfile` in backend:

```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT --loop asyncio
```

### Install System Dependencies on Railway

Create `nixpacks.toml` in backend:

```toml
[phases.setup]
nixPkgs = ["python312", "playwright", "chromium"]

[phases.install]
cmds = ["pip install -r requirements.txt", "playwright install chromium"]
```

## Step 5: Setup Scheduled Generation

### Option A: Railway Cron

Add to your Railway service:

```json
{
  "cron": {
    "schedule": "0 14 * * *",
    "command": "python -c 'import asyncio; from app.services.podcast_generator import run_scheduled_generation; from app.config import get_settings; asyncio.run(run_scheduled_generation(get_settings()))'"
  }
}
```

### Option B: GitHub Actions

Create `.github/workflows/daily-generation.yml`:

```yaml
name: Daily Podcast Generation

on:
  schedule:
    - cron: '0 14 * * *'  # 7am PT = 2pm UTC (or 3pm during DST)
  workflow_dispatch:  # Allow manual triggers

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger generation
        run: |
          curl -X POST https://your-backend.railway.app/generate \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## Step 6: Post-Deployment

1. **Test the deployment**:
   - Visit your Vercel URL
   - Authenticate with NotebookLM
   - Add sources (RSS, topics)
   - Click "Generate Now"
   - Wait 5-15 minutes
   - Check NotebookLM for podcast

2. **Update CORS settings** if needed in `backend/app/main.py`:
   ```python
   origins = [
       "https://your-app.vercel.app",
       "http://localhost:3000",
   ]
   ```

3. **Monitor logs**:
   - Railway: Check application logs
   - Vercel: Check function logs

## Environment Variables Quick Reference

### Backend (.env)
```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
PERPLEXITY_API_KEY=
SECRET_KEY=
FRONTEND_URL=https://your-app.vercel.app
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

## Troubleshooting

### NotebookLM Authentication Fails
- Railway may not support browser automation
- Solution: Pre-authenticate users locally, store credentials in Supabase
- Or: Use a dedicated VM (DigitalOcean/Fly.io) for auth service

### SSL Certificate Errors
- Remove `verify=False` from Perplexity API calls
- Railway uses proper OpenSSL, not LibreSSL

### CORS Errors
- Add your Vercel domain to CORS origins in backend
- Check that NEXT_PUBLIC_API_URL is set correctly

### Generation Times Out
- Increase Railway timeout settings
- NotebookLM audio can take 10+ minutes

## Cost Estimate (Monthly)

- **Vercel**: Free (Hobby tier)
- **Railway**: $5-20 (depends on usage)
- **Supabase**: Free (500MB database, 50k monthly active users)
- **Perplexity**: Pay-as-you-go (search API)

Total: ~$5-20/month for personal use
