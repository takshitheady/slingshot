# Deployment

## Frontend (Vercel)
1. Import the repo
2. Framework: Vite/React
3. Set env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and any public URLs)
4. Build command: `pnpm --filter @slingshot/web build`
5. Output: `apps/web/dist`

## Backend (Railway or Fly.io)
- Build: `pnpm --filter @slingshot/server build`
- Start: `pnpm --filter @slingshot/server start`
- Env vars: `SERVER_PORT`, `CLIENT_URL`, `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `REDIS_URL`

## Supabase (Cloud)
- Create project and database
- Apply migrations from `supabase/migrations`
- Configure RLS policies before exposing to production

## Domain & CORS
- Set `CLIENT_URL` to your deployed web origin
- Update backend Google OAuth redirect URI if you use the direct backend flow: `https://api.yourdomain.com/auth/google/callback` (the app primarily uses Supabase OAuth return URL)

## Monitoring & Logging (recommended)
- Sentry for frontend and backend
- Structured logs from the server
- Alerts for Google API quotas and errors