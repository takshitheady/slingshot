# Environment Variables

Create a `.env` at the repository root. The backend loads it via `dotenv` with `../../.env` from `apps/server`.

## Server
- `SERVER_PORT` (default: `3000`): Express server port
- `CLIENT_URL`: Frontend origin for CORS and redirects (e.g., `http://localhost:5173`)
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (server-side only)
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GOOGLE_REDIRECT_URI`: e.g., `http://localhost:3000/auth/google/callback`
- `REDIS_URL` (planned): for BullMQ jobs
- `SESSION_SECRET` (planned): express session/signing
- `MCP_SERVER_PORT` (planned): MCP server port
- `ANTHROPIC_API_KEY` (planned): for AI assistant

## Frontend
If you integrate Supabase client in the web app:
- `VITE_SUPABASE_URL`: Supabase URL exposed to the client
- `VITE_SUPABASE_ANON_KEY`: Supabase anon key for client SDK

Notes:
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend.
- For production, do not persist OAuth tokens in localStorage; store encrypted in Supabase and use secure sessions.