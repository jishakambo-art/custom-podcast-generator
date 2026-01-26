# DailyBrief

Your personalized daily podcast generated from your favorite sources.

## What is DailyBrief?

DailyBrief transforms your information sources into a personalized daily podcast using NotebookLM. Configure your RSS feeds, Substack newsletters, and news topics once, and receive a professionally narrated audio briefing every morning.

## Features

- 📰 **Substack Integration**: Prioritize your top 5 newsletter subscriptions
- 📡 **RSS Feeds**: Add any RSS feed from your favorite blogs and sites
- 🔍 **News Topics**: Track companies, industries, or topics via Perplexity Search API
- 🎙️ **NotebookLM Audio**: AI-generated podcast conversations
- ⏰ **Daily Scheduling**: Automatic generation at 7am PT
- 🎯 **Manual Generation**: Generate on-demand anytime

## Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18**
- **Tailwind CSS**
- **TanStack Query** (React Query)
- **Supabase Client**

### Backend
- **Python 3.12**
- **FastAPI**
- **NotebookLM-py** (Unofficial API)
- **Perplexity Search API**
- **Supabase** (PostgreSQL)
- **feedparser** (RSS)

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   Next.js   │────▶│   FastAPI   │────▶│  Supabase    │
│  Frontend   │     │   Backend   │     │  (Database)  │
└─────────────┘     └─────────────┘     └──────────────┘
                           │
                           ├────▶ Perplexity Search API
                           ├────▶ RSS Feeds (feedparser)
                           └────▶ NotebookLM (Google)
```

## Setup

### Prerequisites

- Python 3.12+
- Node.js 18+
- Perplexity API key
- Supabase account
- Google account (for NotebookLM)

### Backend Setup

```bash
cd backend

# Create virtual environment
python3.12 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install Playwright for NotebookLM auth
playwright install chromium

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# - Add Supabase credentials
# - Add Perplexity API key

# Run database migrations
# (TODO: Add migration commands)

# Start server (IMPORTANT: use --loop asyncio for Playwright)
./start.sh
# Or manually: uvicorn app.main:app --reload --loop asyncio
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with backend URL
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start dev server
npm run dev
```

### First-Time Setup

1. **Authenticate with NotebookLM**:
   - Navigate to http://localhost:3000
   - Click "NotebookLM" → "Connect with Google"
   - Complete Google OAuth in the browser window
   - Credentials are stored securely per-user

2. **Configure Sources**:
   - Add RSS feeds
   - Add news topics to track
   - (Optional) Connect Substack if implementing OAuth

3. **Test Generation**:
   - Click "Generate Now"
   - Wait 5-15 minutes for audio generation
   - Check NotebookLM for your podcast

## Environment Variables

### Backend (`backend/.env`)

```bash
# Supabase
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Perplexity
PERPLEXITY_API_KEY=your-api-key

# Substack OAuth (optional)
SUBSTACK_CLIENT_ID=your-client-id
SUBSTACK_CLIENT_SECRET=your-client-secret
SUBSTACK_REDIRECT_URI=http://localhost:8000/auth/substack/callback

# App
SECRET_KEY=generate-random-secret-key
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Database Schema

See [backend/supabase_schema.sql](backend/supabase_schema.sql) for complete schema.

Tables:
- `users` - User accounts
- `substack_sources` - Newsletter subscriptions
- `rss_sources` - RSS feed URLs
- `news_topics` - Topics to track
- `generation_logs` - Podcast generation history

## API Endpoints

### Authentication
- `POST /auth/signup` - Create account
- `POST /auth/login` - Login
- `POST /auth/notebooklm/authenticate` - Connect NotebookLM
- `GET /auth/notebooklm/status` - Check auth status

### Sources
- `GET /substack/subscriptions` - List Substack subscriptions
- `PUT /substack/priorities` - Set top 5 priorities
- `GET /rss` - List RSS sources
- `POST /rss` - Add RSS feed
- `DELETE /rss/:id` - Remove RSS feed
- `GET /topics` - List news topics
- `POST /topics` - Add topic
- `DELETE /topics/:id` - Remove topic

### Generation
- `POST /generate` - Trigger manual generation
- `GET /generations` - List generation history
- `GET /generations/:id` - Get generation status

## Deployment

See deployment documentation for:
- Vercel (Frontend)
- Railway (Backend)
- Supabase (Database)
- Cron setup for daily generation

## Known Issues & Limitations

1. **NotebookLM Auth**: Uses browser automation (Playwright) which requires a persistent VM for deployment
2. **Substack OAuth**: Demo mode only - OAuth credentials need registration
3. **SSL/LibreSSL**: Development uses disabled SSL verification for compatibility
4. **Rate Limits**: Perplexity and NotebookLM have API rate limits

## Contributing

This was built for a hackathon. Contributions welcome!

## License

MIT

## Credits

- [notebooklm-py](https://github.com/teng-lin/notebooklm-py) - Unofficial NotebookLM API
- [Perplexity API](https://docs.perplexity.ai/) - Search API
- Built during a hackathon

---

**Note**: This application is in active development. NotebookLM is an unofficial API and may break without notice.
