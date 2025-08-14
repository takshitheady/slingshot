# Architecture

Slingshot is a Turborepo monorepo managed with pnpm. It consists of a React frontend (Vite) and an Express backend. Supabase provides authentication and Postgres. Google APIs (GA4, GSC) supply analytics data.

## High-level data flow

- Web (Vite/React) → Server (Express) → Google APIs (GA4, GSC)
- Web → Server → Supabase (auth validation, token storage, brands)
- AI assistant (future) → MCP server → data tools

## Applications

- `apps/web`
  - Vite + React + TypeScript
  - React Router v6
  - Pages: `Landing`, `Auth` (login/signup), `VerifyEmail`, `Setup`, `Dashboard`, `Chat`, `AuthCallback`
  - Uses Supabase Auth; fetches Google data via backend analytics endpoints; renders charts with `recharts`
- `apps/server`
  - Express + TypeScript
  - Security middleware: `helmet`, `cors`, `express-rate-limit`
  - Routes:
    - `auth/google-tokens` (store/get/delete Google tokens for authenticated user)
    - `api/analytics/google/*` (GA4 + GSC proxy endpoints)
    - `api/brands/*` (brands and integrations scaffolding)
    - `health` (health check)
  - Services: GA4 via `googleapis.analyticsdata`/`analyticsadmin`, GSC via `googleapis.searchconsole`
  - Loads env from repo root `.env`

## Packages

- `packages/database`
  - `Database` types mirroring SQL migrations
- `packages/shared`
  - Shared types/schemas (future)
- `packages/mcp-server` (planned)
  - Model Context Protocol server for AI tools

## Data model (Supabase)

Core tables (see full details in [Database](./database.md)):
- `brands`
- `google_integrations`
- `analytics_snapshots`
- `chat_sessions`
- `chat_messages`
- `dashboard_configs`
- `user_tokens` (stores per-user OAuth tokens; RLS enforced)

All tables have RLS enabled; `user_tokens` includes specific per-user policies.

## AuthN/AuthZ & token model

- Supabase manages user authentication on the web: `@supabase/supabase-js` stores a session with a Supabase JWT.
- Google OAuth is initiated through Supabase OAuth (`signInWithOAuth('google')`) with GA4 + GSC scopes.
- After OAuth, the web `AuthCallback` page uses the Supabase session’s `provider_token`/`provider_refresh_token` and POSTs them to the server `POST /auth/google-tokens` with the Supabase JWT in `Authorization`.
- Server validates the Supabase JWT (`supabase.auth.getUser(token)`) and upserts tokens into `public.user_tokens`.
- When the web calls analytics APIs, it first GETs `/auth/google-tokens` to retrieve Google tokens, then forwards `Authorization: Bearer <google_access_token>` to analytics routes.

## Routing & protection (web)

- Public: `/`, `/login`, `/signup`, `/auth/callback`
- Protected (auth only): `/verify-email`
- Protected (auth + email confirmed): `/setup`, `/chat`
- Protected (auth + email confirmed + Google connected): `/dashboard`

Guards are enforced by `ProtectedRoute` using `useAuth()` values: `user`, `isEmailConfirmed`, and `hasGoogleAccess`.

## Data flow: establishing connections

1) User signs up/signs in (Supabase JWT stored by SDK)
2) User clicks “Connect with Google” → Supabase OAuth (GA4 + GSC scopes, offline access)
3) `AuthCallback` stores provider tokens via `POST /auth/google-tokens`
4) When loading analytics, the web GETs `/auth/google-tokens`, then calls `/api/analytics/google/*` with Google tokens in headers
5) Server creates Google API clients and fetches data

## Key dependencies

- Frontend: `react`, `react-router-dom`, `recharts`, `@supabase/supabase-js`, `tailwindcss`
- Backend: `express`, `googleapis`, `@supabase/supabase-js`, `helmet`, `cors`, `express-rate-limit`, `dotenv`
- Monorepo: `turbo`, `typescript`, `pnpm`

## Planned

- Persisting brand-scoped Google credentials to `google_integrations`
- Background sync jobs and snapshotting to `analytics_snapshots`
- MCP server and AI chat tools