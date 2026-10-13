# Mello Code — Base44 Dev Notes

## What this is
A Node.js/Express app that serves a static HTML dashboard (`public/index.html`) and an AI chat API. The dashboard lets users pick a mode (fast/balanced/quality) and send prompts to an AI provider.

## File layout fix (done during setup)
The repo had files in the wrong places:
- `README.md` contained the HTML dashboard → moved to `public/index.html`
- `public/index.html` contained the full server code → moved to `server.js`
- `server.js` had a simpler server → replaced with the full version that supports all 3 modes and matches `.env.example`

The frontend's `API_URL` was hardcoded to `http://localhost:3001` → changed to `window.location.origin` so it works behind any proxy.

## Running
```bash
docker compose -f docker-compose.base44.yml up -d
```
The app listens on port 3000 (set via `PORT=3000` in compose). Health check: `GET /health`.

## AI credentials (optional for boot)
The app boots and shows the dashboard without any AI keys. Chat calls will return an error like "OpenAI key missing" until keys are provided. Set these via the Base44 secrets dashboard:
- `AI_BALANCED_KEY` — key for the default "balanced" mode (OpenAI by default)
- `AI_QUALITY_KEY` — key for "quality" mode
- `AI_FAST_KEY` — only needed if fast mode uses a remote provider instead of local Ollama

Alternatively, run a local Ollama instance and set `AI_FAST_PROVIDER=ollama` for free fast-mode chat.

## Key endpoints
- `GET /` — dashboard (static HTML)
- `GET /health` — health check
- `GET /api/models` — list configured AI modes
- `POST /api/chat` — main chat endpoint (accepts `prompt`, `mode`)
- `POST /api/generate-code` — code generation
- `POST /api/roblox/bridge` — Roblox Studio bridge
