# DailyBrief Setup - Desktop App

One-time setup utility for connecting NotebookLM to DailyBrief.

## Purpose

This desktop app allows users to authenticate with NotebookLM and upload their credentials to the DailyBrief server, enabling automated daily podcast generation.

## How It Works

1. User signs in with Google (via web app)
2. User copies their access token into the desktop app
3. App launches a browser for NotebookLM authentication
4. App saves credentials locally
5. App uploads credentials to Railway server
6. User can close the app - setup is complete!

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Run in development
npm start
```

### Building

```bash
# Package the app
npm run package

# Create distributable (.dmg for Mac)
npm run make
```

## Architecture

- **main.js**: Electron main process, handles IPC and Playwright automation
- **preload.js**: Bridge between main and renderer processes
- **src/renderer/**: Frontend UI (HTML, CSS, JS)
  - **index.html**: UI structure
  - **styles.css**: Styling
  - **app.js**: Authentication logic and UI interactions

## User Flow

```
┌─────────────────────────────────────────────┐
│ 1. Click "Sign in with Google"             │
│    → Opens web app in browser              │
│    → User signs in                         │
│    → User copies token                     │
│    → User pastes token in desktop app      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 2. Click "Connect NotebookLM"              │
│    → Chromium browser opens                │
│    → User signs in to NotebookLM           │
│    → Credentials saved locally             │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 3. Credentials uploaded to Railway         │
│    → Success! Setup complete               │
│    → User can close app                    │
└─────────────────────────────────────────────┘
```

## API Endpoints Used

- `GET ${API_URL}/auth/me` - Verify user token
- `POST ${API_URL}/auth/notebooklm/upload-credentials` - Upload credentials

## Configuration

Edit these constants in `src/renderer/app.js`:

```javascript
const SUPABASE_URL = 'https://ykkjvvntrhujzdzthxfb.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
const API_URL = 'https://hackathon-production-f662.up.railway.app';
const WEB_APP_URL = 'https://custompodcast.vercel.app';
```

## Distribution

The built app will be in `out/make/` directory:
- **Mac**: `DailyBrief Setup.dmg` and `.zip`
- Size: ~100MB (includes Chromium)

Users download once, run once, then can delete the app.
