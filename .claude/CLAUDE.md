# DailyBrief - Product Spec

## Problem

Busy professionals in the business world want to stay informed but lack time to read newsletters and news. They have "audio time" during commutes, errands, and life admin but no easy way to convert their reading list into listenable content.

## Target Audience

Busy professionals who:
- Work in business & professional environments
- Prefer audio content (podcasts) while driving, running errands, or doing life admin
- Subscribe to multiple newsletters and need to track company/industry news
- Want a repeatable, low-friction way to stay informed

## Solution

A personalized daily podcast generated from user-configured sources, delivered every morning at 7am PT via NotebookLM. Users configure their sources once, and the system automatically aggregates content and generates a 30-45 minute podcast daily.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     User's Browser                        │
│  ┌─────────────────────────────────────────────────────┐ │
│  │           DailyBrief Web App (Config UI)            │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────┐
│                    Backend Server                         │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌───────────────────┐  │
│  │ RSS Parser │  │  Substack  │  │   Perplexity API  │  │
│  │            │  │   OAuth    │  │  (company news)   │  │
│  └─────┬──────┘  └─────┬──────┘  └────────┬──────────┘  │
│        └───────────────┼───────────────────┘            │
│                        ▼                                 │
│              ┌─────────────────┐                        │
│              │ Content Aggregator                       │
│              │ (combine & prioritize)                   │
│              └────────┬────────┘                        │
│                       ▼                                 │
│              ┌─────────────────┐                        │
│              │  notebooklm-py  │                        │
│              │  - Create notebook                       │
│              │  - Add sources                           │
│              │  - Generate audio                        │
│              └─────────────────┘                        │
└──────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────┐
│                Google NotebookLM                          │
│         (user accesses podcast in NotebookLM app)        │
└──────────────────────────────────────────────────────────┘
```

---

## User Flow

1. **Sign up** - Create account on DailyBrief
2. **Connect accounts:**
   - **NotebookLM** - Browser-based Google auth (credentials stored securely)
   - **Substack** - OAuth to access subscriptions
3. **Configure sources:**
   - **Substack**: View all subscriptions, select and rank top 5 priority newsletters
   - **RSS**: Add additional feed URLs manually
   - **News Topics**: Add company/topic names (powered by Perplexity)
4. **Set preferences** - Podcast style, length, language
5. **Daily at 7am PT (automated):**
   - Fetch latest posts from top 5 Substack subscriptions (last 24h)
   - Fetch from RSS feeds (last 24h)
   - Query Perplexity for each news topic
   - Create NotebookLM notebook with prioritized content
   - Trigger audio overview generation
6. **User listens** - Opens NotebookLM app, podcast is ready

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js (App Router) + Tailwind CSS |
| Backend | Python FastAPI |
| Database | Supabase (Postgres + Auth) |
| Scheduler | Supabase pg_cron or Railway cron |
| Substack | OAuth 2.0 + Substack API |
| News | Perplexity API |
| RSS | feedparser (Python) |
| Podcast Gen | notebooklm-py |

---

## Project Structure

```
/frontend          # Next.js app
  /app
    /page.tsx      # Landing/dashboard
    /sources       # Source configuration pages
    /generations   # Generation history
  /components
  /lib

/backend           # Python FastAPI
  /app
    /main.py
    /routers
      /auth.py
      /sources.py
      /generation.py
    /services
      /substack.py
      /perplexity.py
      /rss.py
      /notebooklm.py
    /models
    /schemas
  /requirements.txt
```

---

## Core Features

1. **Substack OAuth** - Connect account, fetch subscriptions, prioritize top 5
2. **RSS Feeds** - Add/manage RSS feed URLs
3. **News Topics** - Company/topic names queried via Perplexity API
4. **NotebookLM Integration** - Create notebooks, add content, generate audio
5. **Scheduled Generation** - 7am PT daily cron job
6. **Manual Generation** - "Generate Now" button for testing

---

## Substack Integration

### OAuth Flow
1. User clicks "Connect Substack"
2. Redirect to Substack OAuth consent screen
3. User authorizes access to subscriptions
4. Callback stores `access_token` and `refresh_token`
5. Fetch user's subscriptions list
6. Display in UI for selection/prioritization

### Top 5 Priority Feature
- User sees all their Substack subscriptions
- Drag-and-drop or numbered selection to set priority 1-5
- Only top 5 prioritized sources are included in daily podcast
- Other subscriptions can be enabled but won't be prioritized

---

## Scheduled Generation (7am PT)

### Cron Job Flow

```
┌─────────────────────────────────────────────────────────┐
│  CRON: 0 7 * * * (America/Los_Angeles)                  │
├─────────────────────────────────────────────────────────┤
│  1. Query all users with enabled sources                │
│  2. For each user (parallel):                           │
│     a. Fetch top 5 Substack posts (last 24h)           │
│     b. Fetch RSS feeds (last 24h)                      │
│     c. Query Perplexity for each news topic            │
│     d. Aggregate & format content                       │
│     e. Create NotebookLM notebook                       │
│     f. Add content as sources                          │
│     g. Trigger audio generation                         │
│     h. Log result                                       │
└─────────────────────────────────────────────────────────┘
```

### Implementation Options
1. **Supabase Edge Function + pg_cron** - triggers HTTP endpoint
2. **Railway cron job** - runs Python script directly
3. **GitHub Actions scheduled workflow** - free, simple

---

## Data Model

### User
```
- id
- email
- notebooklm_credentials (encrypted)
- substack_oauth_token (encrypted)
- preferences
  - podcast_style: "deep-dive" | "brief" | "debate"
  - length: "short" | "medium" | "long"
  - language: string
- timezone (default: "America/Los_Angeles")
```

### SubstackSource
```
- id
- user_id
- publication_id
- publication_name
- priority: 1-5 (null if not in top 5)
- enabled: boolean
```

### RSSSource
```
- id
- user_id
- url
- name
- enabled: boolean
```

### NewsTopic
```
- id
- user_id
- topic: string (company name, industry, etc.)
- enabled: boolean
```

### GenerationLog
```
- id
- user_id
- scheduled_at
- started_at
- completed_at
- status: "scheduled" | "fetching" | "generating" | "complete" | "failed"
- notebook_id (from NotebookLM)
- sources_used: JSON (what content was included)
- error_message?
```

---

## API Endpoints

```
# Auth
POST   /auth/signup
POST   /auth/login
GET    /auth/substack              # initiate Substack OAuth
GET    /auth/substack/callback     # OAuth callback
POST   /auth/notebooklm/connect    # store NotebookLM creds

# Substack Sources
GET    /substack/subscriptions     # list all user's subscriptions
PUT    /substack/priorities        # set top 5 { publication_id: priority }

# RSS Sources
GET    /rss                        # list RSS sources
POST   /rss                        # add RSS feed
DELETE /rss/:id                    # remove RSS feed

# News Topics (Perplexity)
GET    /topics                     # list news topics
POST   /topics                     # add topic
DELETE /topics/:id                 # remove topic

# Generation
POST   /generate                   # trigger manual generation
GET    /generations                # list generation history
GET    /generations/:id            # get status of specific generation
```

---

## Content Prioritization Logic

When aggregating content for the podcast:

```
1. Substack (Priority 1-5)     → Always included first, in priority order
2. RSS Feeds                   → Included next, sorted by recency
3. Perplexity News Topics      → Included last, one summary per topic

Total content capped to fit ~30-45 min podcast
(NotebookLM handles the summarization/script generation)
```

---

## MVP Scope

### In Scope (Build This)
- [x] User auth (Supabase)
- [x] Substack OAuth + subscription list
- [x] Top 5 Substack prioritization UI
- [x] RSS feed management
- [x] News topics (Perplexity)
- [x] Manual "Generate Now" button
- [x] NotebookLM integration (create notebook, add sources, generate audio)
- [x] 7am PT scheduled cron job
- [x] Generation history/status page

### Deferred (Post-Hackathon)
- [ ] Podcast customization UI (style, length, language)
- [ ] Email/push notifications when podcast is ready
- [ ] Multiple timezone support
- [ ] Analytics (which sources get used most)
- [ ] Podcast archive/history playback

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| notebooklm-py is unofficial, may break | Accept for hackathon; monitor for errors; have fallback plan |
| NotebookLM auth is browser-based | Store credentials server-side per user; may need user to re-auth periodically |
| Rate limits on NotebookLM | One podcast/user/day should be fine |
| Perplexity API costs | User has credits; monitor usage |
| Substack OAuth access | Verify API availability; fallback to RSS if needed |

---

## notebooklm-py Reference

Library: https://github.com/teng-lin/notebooklm-py

### Key Capabilities
- **Authentication**: Browser-based via `notebooklm login`, credentials stored locally
- **Notebook Management**: Create, list, rename, delete notebooks
- **Source Management**: Add URLs, YouTube links, files (PDF, text, Markdown, Word, audio, video, images), Google Drive items, pasted text
- **Audio Generation**: `client.artifacts.generate_audio()` with options for format (deep-dive, brief, critique, debate), length, language (50+ supported)
- **Polling**: `wait_for_completion()` to check generation status
- **Download**: `download_audio()` to save MP3/MP4 files

### Limitations
- Unofficial/undocumented Google APIs - may break without notice
- Rate limiting possible with heavy usage
- Requires Python 3.10+
- Browser setup required for first-time auth (`playwright install chromium`)

---

## Environment Variables

```bash
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# Substack OAuth
SUBSTACK_CLIENT_ID=
SUBSTACK_CLIENT_SECRET=
SUBSTACK_REDIRECT_URI=

# Perplexity
PERPLEXITY_API_KEY=

# NotebookLM (stored per-user in database, not as env var)
```

---

## Development Commands

```bash
# Frontend
cd frontend && npm run dev

# Backend
cd backend && uvicorn app.main:app --reload

# Database migrations
supabase db push
```

---

## Key Dependencies

### Backend (Python)
- fastapi
- uvicorn
- supabase-py
- notebooklm-py
- feedparser
- httpx (for API calls)
- python-jose (JWT handling)
- cryptography (credential encryption)

### Frontend (Node.js)
- next
- react
- tailwindcss
- @supabase/supabase-js
- @tanstack/react-query (data fetching)
- react-beautiful-dnd (drag-and-drop for prioritization)
