# Slingshot Documentation

A comprehensive web analytics platform integrating Google Analytics 4 (GA4) and Google Search Console (GSC), with dashboards and an AI assistant.

- Project overview: See [Architecture](./architecture.md)
- Backend API: See [Backend API](./backend-api.md)
- Frontend app: See [Frontend](./frontend.md)
- Database schema: See [Database](./database.md)
- Local setup: See [Setup Guide](./setup.md)
- Environment variables: See [Environment](./env.md)
- Deployment: See [Deployment](./deployment.md)
- Security & compliance: See [Security](./security.md)
- MCP (AI assistant) plan: See [MCP](./mcp.md)
- Roadmap: See [Roadmap](./roadmap.md)

## Quickstart

1) Install dependencies

```bash
pnpm install
```

2) Create a `.env` at the repo root (values in [Environment](./env.md)).

3) Start all apps (via Turborepo)

```bash
pnpm dev
```

- Server: http://localhost:3000
- Web: http://localhost:5173

4) Connect Google in the web app at `/setup`.

## Repository layout

```text
apps/
  web/       # Vite + React + TypeScript
  server/    # Express + TypeScript
packages/
  database/  # Supabase client + generated types
  shared/    # Shared zod schemas and types
  mcp-server/ (planned)
supabase/
  migrations/  # SQL schema
  functions/   # Edge functions (future)
```

For detailed implementation guidance, see `instructions.md` and `plan.md` in the repo root.