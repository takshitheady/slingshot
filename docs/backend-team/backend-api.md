# Backend API

Base URL (local): `http://localhost:3000`

Most analytics endpoints require a Google OAuth access token. In this app, clients obtain Google tokens through the Supabase OAuth flow and store/retrieve them via `/auth/google-tokens`. The backend does not mint Supabase tokens; it validates them against Supabase.

Default headers for analytics routes:
- `Authorization: Bearer <GOOGLE_ACCESS_TOKEN>`
- `x-refresh-token: <GOOGLE_REFRESH_TOKEN>` (optional)

## Health

- `GET /health`
  - Returns `{ status: 'OK', timestamp: <ISO> }`

## Auth token storage (server-managed)

- `POST /auth/google-tokens`
  - Auth: Supabase user JWT in `Authorization: Bearer <SUPABASE_JWT>`
  - Body: `{ access_token: string, refresh_token?: string, expires_at?: string | null }`
  - Stores tokens in `public.user_tokens` for the authenticated user
- `GET /auth/google-tokens`
  - Auth: Supabase user JWT
  - Returns `{ access_token, refresh_token, expires_at, is_expired, user_id, email }` for current user
- `DELETE /auth/google-tokens`
  - Auth: Supabase user JWT
  - Deletes current user’s Google tokens

## Google Analytics (GA4)

- `GET /api/analytics/google/ga4/properties`
  - Lists GA4 properties accessible to the user
  - Response `data` comes from Analytics Admin API
  - Example:
    ```bash
    curl -H "Authorization: Bearer $GOOGLE_TOKEN" \
      http://localhost:3000/api/analytics/google/ga4/properties | jq
    ```

- `GET /api/analytics/google/ga4/realtime/:propertyId`
  - Returns realtime metrics (activeUsers, screenPageViews) grouped by country
  - Example:
    ```bash
    curl -H "Authorization: Bearer $GOOGLE_TOKEN" \
      http://localhost:3000/api/analytics/google/ga4/realtime/123456789
    ```

- `GET /api/analytics/google/ga4/report/:propertyId?startDate=30daysAgo&endDate=today`
  - Returns a GA4 report with metrics: sessions, activeUsers, screenPageViews, bounceRate, averageSessionDuration, conversions; dimensions: date, pagePath, country
  - `startDate`/`endDate` accept GA4 relative dates (`7daysAgo`, `today`) or absolute dates (`YYYY-MM-DD`)
  - Example:
    ```bash
    curl -H "Authorization: Bearer $GOOGLE_TOKEN" \
      "http://localhost:3000/api/analytics/google/ga4/report/123456789?startDate=30daysAgo&endDate=today"
    ```

- `GET /api/analytics/google/ga4/top-pages/:propertyId?startDate=30daysAgo&endDate=today`
  - Top pages ordered by `screenPageViews`
  - Example:
    ```bash
    curl -H "Authorization: Bearer $GOOGLE_TOKEN" \
      "http://localhost:3000/api/analytics/google/ga4/top-pages/123456789?startDate=30daysAgo&endDate=today"
    ```

## Google Search Console (GSC)

Note: GSC APIs require absolute date strings (`YYYY-MM-DD`). Relative dates are resolved server-side when possible.

- `GET /api/analytics/google/gsc/sites`
  - Lists verified GSC sites for the user
  - Example:
    ```bash
    curl -H "Authorization: Bearer $GOOGLE_TOKEN" \
      http://localhost:3000/api/analytics/google/gsc/sites | jq
    ```

- `GET /api/analytics/google/gsc/search-analytics?siteUrl=...&startDate=2023-01-01&endDate=2023-12-31`
  - Aggregated search analytics (clicks, impressions, ctr, position).
  - Example:
    ```bash
    curl -H "Authorization: Bearer $GOOGLE_TOKEN" \
      "http://localhost:3000/api/analytics/google/gsc/search-analytics?siteUrl=https%3A%2F%2Fexample.com%2F&startDate=2024-01-01&endDate=2024-01-31"
    ```

- `GET /api/analytics/google/gsc/top-queries?siteUrl=...&startDate=2023-01-01&endDate=2023-12-31`
  - Top queries for a site
  - Example:
    ```bash
    curl -H "Authorization: Bearer $GOOGLE_TOKEN" \
      "http://localhost:3000/api/analytics/google/gsc/top-queries?siteUrl=https%3A%2F%2Fexample.com%2F&startDate=2024-01-01&endDate=2024-01-31"
    ```

- `GET /api/analytics/google/gsc/top-pages?siteUrl=...&startDate=...&endDate=...`
  - Top landing pages for a site

- `GET /api/analytics/google/gsc/timeseries?siteUrl=...&startDate=...&endDate=...`
  - Time series of clicks and impressions by date

## Response shape and errors

- Analytics routes return an envelope: `{ success: boolean, data?: any, error?: string }`
- Common errors: missing Google access token, invalid property ID, Google API errors, 401 when token invalid, 500 for unhandled errors.

## Brands (scaffold)

Note: Current endpoints do not enforce auth; intended for development scaffolding.

- `POST /api/brands`
  - Body: `{ name: string, domain: string, created_by?: string }`
  - Creates a brand row

- `GET /api/brands/:brandId/integrations`
  - Lists `google_integrations` for a brand

- `POST /api/brands/:brandId/integrations/google`
  - Body: `{ integration_type: 'GA4' | 'GSC', property_id?: string, refresh_token?: string, credentials?: object }`
  - Inserts a Google integration for a brand