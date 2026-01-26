# Connecting Railway Backend to Vercel Frontend

## Step 1: Get Your Railway Backend URL

1. Go to your Railway dashboard: https://railway.app/dashboard
2. Click on your DailyBrief backend project
3. Find your deployment URL (looks like: `https://your-app.up.railway.app`)
4. **Copy this URL** - you'll need it for Vercel

Example: `https://dailybrief-production.up.railway.app`

## Step 2: Deploy Frontend to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Click "Import Project"
3. Connect your GitHub account if not connected
4. Select your repository: `jishakambo-art/hackathon`
5. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend` (click "Edit" next to Root Directory)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

6. Add Environment Variables (IMPORTANT):
   ```
   NEXT_PUBLIC_API_URL=https://your-app.up.railway.app
   NEXT_PUBLIC_SUPABASE_URL=https://ykkjvvntrhujzdzthxfb.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_0rdUjYIQwTPtnWkMxOTZ4g_iXMWC_id
   ```

   **Replace `https://your-app.up.railway.app` with your actual Railway URL from Step 1**

7. Click "Deploy"

8. Wait for deployment (2-3 minutes)

9. Vercel will give you a URL like: `https://your-app.vercel.app`

### Option B: Via Vercel CLI

```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# When prompted:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? dailybrief (or your choice)
# - Directory? ./
# - Override settings? No

# After deployment, add environment variables:
vercel env add NEXT_PUBLIC_API_URL
# Paste your Railway URL when prompted

vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste: https://ykkjvvntrhujzdzthxfb.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste: sb_publishable_0rdUjYIQwTPtnWkMxOTZ4g_iXMWC_id

# Redeploy with env vars
vercel --prod
```

## Step 3: Update Railway Backend CORS

Now that you have your Vercel URL, update Railway to allow requests from it.

1. Go to Railway dashboard
2. Click on your backend service
3. Go to "Variables" tab
4. Add/Update this environment variable:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```

   **Replace with your actual Vercel URL from Step 2**

5. Save changes - Railway will automatically redeploy

## Step 4: Test the Connection

1. Visit your Vercel URL: `https://your-app.vercel.app`

2. Open browser console (F12) and check for errors

3. Try to:
   - Sign up / Log in
   - Navigate around the app
   - Check that API calls are working

### Expected Behavior

✅ No CORS errors in console
✅ API calls go to `https://your-app.up.railway.app`
✅ Login/signup works
✅ Pages load correctly

### Common Issues

#### CORS Error: "Access-Control-Allow-Origin"

**Problem**: Frontend can't talk to backend

**Solution**:
- Verify `FRONTEND_URL` on Railway matches your Vercel URL exactly (no trailing slash)
- Verify Railway redeployed after adding the variable
- Clear browser cache and try again

#### API calls go to localhost:8000

**Problem**: Frontend still using local backend URL

**Solution**:
- Check Vercel environment variables (Dashboard > Project > Settings > Environment Variables)
- Make sure `NEXT_PUBLIC_API_URL` is set to your Railway URL
- Redeploy frontend: `vercel --prod` or via Vercel dashboard

#### 404 or 500 errors

**Problem**: Backend not working

**Solution**:
- Check Railway logs (Dashboard > Your Service > Deployments > View Logs)
- Verify all environment variables are set on Railway
- Test backend directly: `curl https://your-app.up.railway.app/health`

## Step 5: Verify Everything Works

### Test Checklist

- [ ] Visit Vercel URL, app loads
- [ ] Open browser console, no CORS errors
- [ ] Sign up with a new account
- [ ] Log in with existing account
- [ ] Navigate to sources page
- [ ] Backend API responds (check Network tab)
- [ ] Railway logs show incoming requests

### Quick Test Commands

```bash
# Test Railway backend health
curl https://your-app.up.railway.app/health

# Should return: {"status":"healthy"}

# Test Railway backend root
curl https://your-app.up.railway.app/

# Should return: {"message":"DailyBrief API","status":"running"}
```

## Environment Variables Summary

### Railway (Backend)

```bash
SUPABASE_URL=https://ykkjvvntrhujzdzthxfb.supabase.co
SUPABASE_ANON_KEY=sb_publishable_0rdUjYIQwTPtnWkMxOTZ4g_iXMWC_id
SUPABASE_SERVICE_KEY=<your-service-key>
PERPLEXITY_API_KEY=<your-perplexity-key>
SECRET_KEY=<your-secret-key>
FRONTEND_URL=https://your-app.vercel.app
BROWSER_HEADLESS=true
```

### Vercel (Frontend)

```bash
NEXT_PUBLIC_API_URL=https://your-app.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://ykkjvvntrhujzdzthxfb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_0rdUjYIQwTPtnWkMxOTZ4g_iXMWC_id
```

## Updating After Changes

### Update Backend (Railway)

Railway auto-deploys when you push to GitHub:

```bash
git add .
git commit -m "Your changes"
git push
```

Railway will detect the push and redeploy automatically.

### Update Frontend (Vercel)

Vercel auto-deploys when you push to GitHub:

```bash
git add .
git commit -m "Your changes"
git push
```

Vercel will detect the push and redeploy automatically.

## Custom Domain (Optional)

### Add Custom Domain to Vercel

1. Go to Vercel Dashboard > Your Project > Settings > Domains
2. Add your domain (e.g., `dailybrief.com`)
3. Follow DNS configuration instructions
4. Update `FRONTEND_URL` on Railway to your custom domain

### Add Custom Domain to Railway

1. Go to Railway Dashboard > Your Service > Settings
2. Click "Generate Domain" or add custom domain
3. Update `NEXT_PUBLIC_API_URL` on Vercel to match

## Next Steps

After connecting Railway and Vercel:

1. ✅ Test full authentication flow
2. ✅ Add RSS feeds and news topics
3. ✅ Connect NotebookLM (authenticate)
4. ✅ Generate your first podcast
5. ✅ Set up daily cron job
6. ✅ Invite friends to use the app

## Troubleshooting

### Check Railway Logs

```bash
# In Railway dashboard:
Your Service > Deployments > Latest > View Logs

# Look for:
# - Application startup
# - Incoming requests
# - Errors or exceptions
```

### Check Vercel Logs

```bash
# In Vercel dashboard:
Your Project > Deployments > Latest > Runtime Logs

# Or via CLI:
vercel logs
```

### Check Browser Network Tab

1. Open app in browser
2. Press F12 (Developer Tools)
3. Go to Network tab
4. Try an action (login, etc.)
5. Look for failed requests (red)
6. Click on failed request to see details

## You're Connected! 🎉

Your Railway backend and Vercel frontend are now talking to each other. Your app is live on the internet!

**Backend**: `https://your-app.up.railway.app`
**Frontend**: `https://your-app.vercel.app`

Share the frontend URL with your friends to start testing!
