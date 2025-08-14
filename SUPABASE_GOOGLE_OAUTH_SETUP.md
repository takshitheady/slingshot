# Supabase Google OAuth Configuration

This project uses Supabase OAuth for Google sign-in with GA4 and GSC scopes, and stores provider tokens in `public.user_tokens` via the backend.

## Configure Supabase (Dashboard)

1. Authentication → Providers → Google → Enable
2. Set the Google Client ID and Secret
3. Redirect URL (handled by Supabase):
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`
4. No “Additional Scopes” field is required; scopes are sent by the client code.

## Configure Google Cloud Console

1. APIs & Services → Credentials → your OAuth 2.0 Client
2. Authorized redirect URIs must include:
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`
3. Enable APIs: Google Analytics Data API, Google Analytics Admin API, Google Search Console API

## Required scopes (sent from client)

```
https://www.googleapis.com/auth/analytics.readonly
https://www.googleapis.com/auth/webmasters.readonly
```

The web app sends these scopes via `signInWithOAuth({ provider: 'google', options: { scopes, queryParams: { access_type: 'offline', prompt: 'consent' } } })` to obtain a refresh token.

## Environment variables

See `docs/env.md`. Minimum for local dev:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_API_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

## How token storage works

- After OAuth, Supabase session contains `provider_token` and possibly `provider_refresh_token`.
- The `AuthCallback` page calls `POST /auth/google-tokens` with the Supabase JWT and stores tokens in `public.user_tokens` (RLS enforced).
- Analytics API calls fetch tokens via `GET /auth/google-tokens` and forward Google tokens to `/api/analytics/google/*` routes.

## Troubleshooting

- 400 redirect_uri_mismatch: ensure the Supabase callback URL is present in Google Cloud Console.
- No GA4/GSC data: verify enabled APIs and account access; check scopes include both GA4 and GSC.
- 401 from analytics routes: Google token expired or missing; reconnect Google from `/setup`.