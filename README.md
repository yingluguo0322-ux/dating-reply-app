# Dating Reply App (Real API Mode)

This app now includes:
- React + Vite frontend
- Local Express API server (keeps your API key on server side)
- Real AI generation via `POST /api/generate`
- Vercel serverless API routes in `api/*` for production deploy

## 1) Setup

Copy `.env.example` to `.env` and fill in your key:

```bash
cp .env.example .env
```

Required env:
- `ANTHROPIC_API_KEY` **or** `OPENAI_API_KEY`

Optional env:
- `ANTHROPIC_MODEL` (default: `claude-3-5-sonnet-latest`)
- `OPENAI_MODEL` (default: `gpt-4o-mini`)
- `API_PORT` (default: `8787`)
- `SYSTEM_PROMPT_BASE` (base system prompt on server)

## 2) Run

```bash
npm install
npm run dev
```

`npm run dev` starts both:
- Vite client
- Express API server

## 2.1) Deploy to Vercel

- Connect this GitHub repo in Vercel
- Framework: Vite (auto-detected)
- Build command: `npm run build`
- Output directory: `dist`
- Add env vars in Vercel project settings:
  - `ANTHROPIC_API_KEY` (recommended) or `OPENAI_API_KEY`
  - `ANTHROPIC_MODEL` / `OPENAI_MODEL` (optional)
  - `SYSTEM_PROMPT_BASE` (optional)

## 3) How generation works

Frontend sends:
- `theirMessage`
- `myIdea`
- selected context (`stageLevel`, `interestLevel`)

Backend now auto-selects provider:
- If `ANTHROPIC_API_KEY` exists -> uses Anthropic (Claude)
- Else if `OPENAI_API_KEY` exists -> uses OpenAI
- Else -> returns config error

It returns:

```json
{
  "replies": {
    "playful": "...",
    "flirty": "...",
    "witty": "...",
    "charming": "...",
    "sincere": "..."
  }
}
```

If API fails, frontend falls back to local mock replies so UI still works.
