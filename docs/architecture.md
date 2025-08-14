# Architecture

Slingshot is a Turborepo monorepo managed with pnpm. It consists of a React frontend (Vite) and an Express backend. Supabase provides Postgres, authentication, and storage. Google APIs supply analytics data.

## High-level diagram

- Web (Vite/React) → Server (Express) → Google APIs (GA4, GSC)
- Web (future) → Server → Supabase (store snapshots, brands, configs)
- AI assistant (future) → MCP server → data tools

## Applications

- `apps/web`
  - Vite + React + TypeScript
  - React Router v6
  - Pages: `Dashboard`, `Setup`, `Chat`
  - Calls backend analytics endpoints; renders charts with `recharts`
- `apps/server`
  - Express + TypeScript
  - Security middleware: `helmet`, `cors`, `express-rate-limit`
  - Routes: `auth/google`, `api/analytics/google`
  - Services: GA4 via `googleapis.analyticsdata`/`analyticsadmin`, GSC via `googleapis.searchconsole`
  - Loads env from repo root `.env`

## Packages

- `packages/database`
  - Typed Supabase client factory and `Database` types reflecting the SQL migration
- `packages/shared`
  - Zod schemas for brand, integrations, analytics snapshots, chat, dashboard, API responses
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

All tables have RLS enabled (policies to be defined).

## Google OAuth & tokens

- OAuth flow starts at `GET /auth/google`, redirects to Google
- Callback at `GET /auth/google/callback` redirects to `CLIENT_URL/setup` with tokens as query params (for now)
- Frontend stores access/refresh tokens in `localStorage` temporarily (development only)

## Key dependencies

- Frontend: `react`, `react-router-dom`, `recharts`, `@supabase/supabase-js`, `tailwindcss`
- Backend: `express`, `googleapis`, `@supabase/supabase-js`, `helmet`, `cors`, `express-rate-limit`, `dotenv`
- Monorepo: `turbo`, `typescript`, `pnpm`

## Not yet implemented (planned)

- Persisting Google credentials to Supabase (encrypted)
- Background sync via BullMQ/Redis
- Real-time updates via Supabase Realtime
- MCP server and AI chat tools
- Robust auth guarding and protected routes