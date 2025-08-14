# Setup Guide

## Prerequisites
- Node.js >= 18
- pnpm >= 9
- Supabase project (cloud or local)
- Google Cloud project with OAuth 2.0 and APIs enabled

## 1) Clone & install

```bash
git clone <your-repo>
cd slingshot
pnpm install
```

## 2) Environment variables

Create a `.env` file at the repo root. See all keys and descriptions in [Environment](./env.md).

Minimum for local dev:
```
SERVER_PORT=3000
CLIENT_URL=http://localhost:5173

VITE_SUPABASE_URL=... # from Supabase project settings
SUPABASE_SERVICE_ROLE_KEY=... # service role key (keep secret)
VITE_SUPABASE_ANON_KEY=... # anon key for web
VITE_API_URL=http://localhost:3000

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

## 3) Supabase schema

Apply `supabase/migrations/20250807000001_create_initial_schema.sql` using the Supabase SQL editor or CLI.

## 4) Start apps

At repo root:
```bash
pnpm dev
```
This runs both server and web via Turborepo.

- Server: http://localhost:3000
- Web: http://localhost:5173

## 5) Connect Google

In the web app, go to `/setup` and click Connect. Complete Google consent using Supabase OAuth. On success, the web calls `POST /auth/google-tokens` to store tokens in `public.user_tokens` (not localStorage).

## Troubleshooting
- CORS errors: ensure `CLIENT_URL` matches your web origin
- 500 errors from OAuth: check Google OAuth credentials and redirect URI
- GA4 empty data: ensure the selected property has traffic and that your Google account has access