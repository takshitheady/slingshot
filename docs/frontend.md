# Frontend

Vite + React + TypeScript application located in `apps/web`.

## Routing

`src/App.tsx` defines the routes within a shared `Layout`:
- `/` → `Dashboard`
- `/setup` → `Setup`
- `/chat` → `Chat`

## Pages

- `Dashboard`
  - Loads GA4 properties and GSC sites
  - Fetches a GA4 report and traffic trend data for the selected property
  - Displays key metrics and a `recharts` line chart
- `Setup`
  - Initiates Google OAuth by redirecting to `http://localhost:3000/auth/google`
  - On callback success, reads tokens from URL params and stores them in `localStorage`
  - Provides quick test buttons to hit backend GA4 and GSC endpoints
- `Chat`
  - Placeholder UI for the AI assistant; to be connected to MCP server

## Services

`src/services/analytics.ts` exposes an `analyticsService` with:
- `getGA4Properties()` → list GA4 properties
- `getDashboardData(propertyId, startDate, endDate)` → GA4 report, normalized for cards
- `getTrafficTrends(propertyId, startDate, endDate)` → GA4 report mapped to time series
- `getTopPages(propertyId, startDate, endDate)` → GA4 top pages
- `getSearchConsoleSites()` → GSC sites
- `getSearchConsoleData(siteUrl, startDate, endDate)` → aggregated GSC metrics

Headers are built from tokens stored in `localStorage`:
- `google_access_token` (required)
- `google_refresh_token` (optional)

## UI & Styling

- Tailwind CSS configured via `src/index.css`
- Utility `cn` from `src/lib/utils.ts` for class merging
- Icons via `lucide-react` (installed)
- Charts via `recharts`

## Local dev

```bash
cd apps/web
pnpm dev
```

The root `pnpm dev` also starts the web app via Turborepo.