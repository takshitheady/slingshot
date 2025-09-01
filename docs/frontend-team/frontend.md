# Frontend

Vite + React + TypeScript application located in `apps/web`.

## Routing

`src/App.tsx` defines the routes within a shared `Layout`:
- `/` → `Landing`
- `/login` and `/signup` → `Auth`
- `/auth/callback` → `AuthCallback` (handles Supabase OAuth return and token storage)
- `/verify-email` → `VerifyEmail` (auth required, no email confirmation enforced yet)
- `/setup` → `Setup` (auth + email confirmed)
- `/chat` → `Chat` (auth + email confirmed)
- `/dashboard` → `Dashboard` (auth + email confirmed + Google connected)

Guards are applied via `ProtectedRoute`:
- Redirects unauthenticated users to `/login`
- Redirects unverified users to `/verify-email` when required
- Redirects users without Google connection to `/setup` for Google-required routes

## Auth

- `AuthProvider` wraps the app, exposes: `user`, `session`, `loading`, `isEmailConfirmed`, `hasGoogleAccess`, `googleTokens`, and auth actions (`signInWithPassword`, `signUpWithPassword`, `signInWithGoogle`, `signOut`, `resendVerificationEmail`).
- `signInWithGoogle` uses Supabase OAuth with GA4 + GSC scopes and `access_type=offline` to request refresh tokens. Redirect targets `/auth/callback?redirect_to=/setup` by default.
- `AuthCallback` reads Supabase session provider tokens and POSTs them to the server (`/auth/google-tokens`) with the Supabase JWT. On success, navigates to `redirect_to` or `/setup`.

## Services

`src/services/analytics.ts` exposes an `analyticsService` with:
- `getGA4Properties()` → list GA4 properties
- `getDashboardData(propertyId, startDate, endDate)` → GA4 report, normalized for cards
- `getTrafficTrends(propertyId, startDate, endDate)` → GA4 report mapped to time series
- `getTopPages(propertyId, startDate, endDate)` → GA4 top pages
- `getSearchConsoleSites()` → GSC sites
- `getSearchConsoleData(siteUrl, startDate, endDate)` → aggregated GSC metrics
- `getSearchConsoleTimeseries(siteUrl, startDate, endDate)` → daily clicks/impressions

Auth headers are derived dynamically:
- Fetch Supabase session; use its JWT to GET `/auth/google-tokens`
- Use returned Google `access_token` (and optional `refresh_token`) as headers for analytics requests

## UI & Styling

- Tailwind CSS configured via `src/index.css`
- Icons via `lucide-react`
- Charts via `recharts`

## Local dev

```bash
cd apps/web
pnpm dev
```

The root `pnpm dev` also starts the web app via Turborepo.