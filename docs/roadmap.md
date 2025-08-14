# Roadmap

## Phase 1: Foundation
- [x] Monorepo skeleton (apps, packages)
- [x] Basic Express server with security middleware
- [x] Vite React app with routing and layout
- [x] Supabase schema migration and typed client package
- [x] Auth-protected routes and Supabase auth wiring

## Phase 2: Google Integration
- [x] OAuth flow (dev) and Google tokens roundtrip
- [x] GA4 Data API: properties, reports, realtime, top pages
- [x] GSC API: sites, search analytics, top queries
- [ ] Persist encrypted credentials to Supabase
- [ ] Background sync jobs (BullMQ + Redis)

## Phase 3: Dashboard
- [x] Initial dashboard cards and trends chart
- [ ] Widget components and grid layout
- [ ] Date range picker and comparisons
- [ ] CSV export to Supabase Storage

## Phase 4: AI Assistant (MCP)
- [ ] MCP server under `packages/mcp-server`
- [ ] Tools for querying analytics and SEO insights
- [ ] Streaming chat interface

## Phase 5: Polish & Deploy
- [ ] Supabase Realtime updates
- [ ] Caching with Redis
- [ ] Error boundaries and Sentry
- [ ] Onboarding flow and multi-brand support
- [ ] Production deployment (web + server)