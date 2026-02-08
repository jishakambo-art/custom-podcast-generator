# DailyBrief Deployment Checklist

## ✅ What's Been Fixed

### Frontend (Vercel)
- [x] Fixed Suspense boundary issue in Substack page
- [x] Removed hardcoded localhost URLs
- [x] Updated next.config.js to use environment variables
- [x] Build completes successfully
- [x] Committed and pushed to GitHub

### Backend (Railway)
- [x] Created nixpacks.toml for Nix package management
- [x] Removed incompatible apt-get commands
- [x] Added Xvfb and Playwright dependencies
- [x] Simplified railway.json
- [x] Added .railwayignore for optimized builds
- [x] Committed and pushed to GitHub

## 🚀 Deployment Steps

### Step 1: Deploy Frontend to Vercel

1. Go to **https://vercel.com/new**
2. Import repository: `jishakambo-art/hackathon`
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework**: Next.js (auto-detected)
4. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_SUPABASE_URL=https://ykkjvvntrhujzdzthxfb.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_0rdUjYIQwTPtnWkMxOTZ4g_iXMWC_id
   ```
   (Note: Set API_URL to localhost for now, update after Railway deploy)
5. Click **Deploy**
6. Wait ~2 minutes
7. ✅ Copy your Vercel URL: `https://hackathon-xxx.vercel.app`

### Step 2: Deploy Backend to Railway

1. Go to **https://railway.app/new**
2. Click "Deploy from GitHub repo"
3. Select: `jishakambo-art/hackathon`
4. Configure:
   - Click service → Settings
   - **Root Directory**: `backend`
5. Add environment variables (click "Variables" tab):

   **Required:**
   ```bash
   SUPABASE_URL=https://ykkjvvntrhujzdzthxfb.supabase.co
   SUPABASE_ANON_KEY=sb_publishable_0rdUjYIQwTPtnWkMxOTZ4g_iXMWC_id
   SUPABASE_SERVICE_KEY=<get-from-supabase-dashboard>
   PERPLEXITY_API_KEY=<your-perplexity-api-key>
   SECRET_KEY=<generate-random-32-chars>
   FRONTEND_URL=https://hackathon-xxx.vercel.app
   BROWSER_HEADLESS=true
   ```

   **Optional (for Substack OAuth):**
   ```bash
   SUBSTACK_CLIENT_ID=demo-client-id
   SUBSTACK_CLIENT_SECRET=demo-client-secret
   SUBSTACK_REDIRECT_URI=http://localhost:8000/auth/substack/callback
   ```

6. Generate SECRET_KEY:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

7. Click **Deploy**
8. Wait ~5 minutes (first build is slower)
9. ✅ Copy your Railway URL: `https://xxx.up.railway.app`

### Step 3: Add Railway Persistent Volume

1. In Railway, go to your service
2. Click **Volumes** tab
3. Click "New Volume"
4. **Mount Path**: `/app/.notebooklm_credentials`
5. **Size**: 1GB
6. Click "Add Volume"
7. Service will restart automatically

### Step 4: Update Frontend with Railway URL

1. Go to Vercel dashboard
2. Your project → Settings → Environment Variables
3. Edit `NEXT_PUBLIC_API_URL`:
   ```
   NEXT_PUBLIC_API_URL=https://xxx.up.railway.app
   ```
4. Redeploy (automatic if GitHub connected)

### Step 5: Update Backend CORS

1. Edit `backend/app/main.py`:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=[
           "https://hackathon-xxx.vercel.app",  # Your Vercel URL
           "http://localhost:3000"
       ],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

2. Commit and push:
   ```bash
   git add backend/app/main.py
   git commit -m "Update CORS with production Vercel URL"
   git push origin main
   ```

3. Railway will auto-redeploy

## 🧪 Testing

### Test Backend Health

```bash
curl https://your-backend.up.railway.app/health
# Expected: {"status":"healthy"}
```

### Test Frontend

Visit your Vercel URL and test:
- [ ] Dashboard loads
- [ ] Add RSS feed works
- [ ] Add news topic works
- [ ] NotebookLM page loads
- [ ] Can click "Connect with Google"

### Test Full Flow

1. Visit Vercel app
2. Add RSS feed: `https://news.ycombinator.com/rss`
3. Add news topic: `OpenAI`
4. Go to NotebookLM page
5. Click "Connect with Google"
6. Complete authentication
7. Go back to dashboard
8. Click "Generate Now"
9. Wait 5-15 minutes
10. Check NotebookLM app for your podcast

## 📊 Where to Find Credentials

### Supabase Service Key
1. Go to https://supabase.com
2. Your project → Settings → API
3. Copy "service_role" key (NOT anon key)

### Perplexity API Key
1. Go to https://www.perplexity.ai/settings/api
2. Create new API key
3. Copy key

## 🐛 Common Issues

### Railway Build Fails
- Check build logs in Railway dashboard
- Ensure nixpacks.toml exists in backend/
- Verify all dependencies in requirements.txt

### Health Check Timeout
- Increase timeout in railway.json (already set to 300s)
- Check Railway logs for Playwright installation errors

### CORS Errors
- Verify FRONTEND_URL env var in Railway matches Vercel URL exactly
- Ensure backend/app/main.py includes your Vercel domain

### Frontend Can't Connect to Backend
- Check NEXT_PUBLIC_API_URL in Vercel (no trailing slash)
- Verify Railway service is running
- Test backend health endpoint directly

### NotebookLM Auth Fails
- Ensure BROWSER_HEADLESS=true in Railway
- Check Railway logs for Xvfb errors
- Verify persistent volume is mounted

## 📝 Documentation

- **Frontend Deploy**: [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md)
- **Backend Deploy**: [RAILWAY_DEPLOY.md](RAILWAY_DEPLOY.md)
- **Production Guide**: [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)

## 💰 Cost Estimate

- **Vercel**: Free (Hobby tier)
- **Railway**: ~$10-15/month (Hobby plan + usage)
- **Supabase**: Free (up to 500MB database)
- **Perplexity**: Pay-as-you-go (~$0.001 per search)

**Total**: ~$10-15/month

## 🎯 Next Steps After Deployment

1. Set up scheduled generation (7am daily cron)
2. Test with multiple users
3. Monitor Railway logs for first few days
4. Set up billing alerts
5. Add custom domain (optional)
6. Implement user authentication (currently demo mode)

## 🆘 Need Help?

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- NotebookLM-py: https://github.com/teng-lin/notebooklm-py

---

**Ready to deploy?** Start with Step 1 and work through the checklist!
