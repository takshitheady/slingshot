# Backend API

Base URL (local): `http://localhost:3000`

All analytics endpoints require an OAuth access token from Google. Provide it via the `Authorization` header, and optionally a refresh token via `x-refresh-token`.

Headers:
- `Authorization: Bearer <GOOGLE_ACCESS_TOKEN>`
- `x-refresh-token: <GOOGLE_REFRESH_TOKEN>` (optional)

## Health

- `GET /health`
  - Returns `{ status: 'OK', timestamp: <ISO> }`

## OAuth

- `GET /auth/google`
  - Redirects to Google OAuth consent screen
- `GET /auth/google/callback?code=...`
  - Exchanges code for tokens and redirects to `${CLIENT_URL}/setup?auth=success&access_token=...&refresh_token=...`

## Google Analytics (GA4)

- `GET /api/analytics/google/ga4/properties`
  - Lists GA4 properties accessible to the user
  - Response `data` is the array from Analytics Admin API
  - Example:
    ```bash
    curl -H "Authorization: Bearer $TOKEN" \
      http://localhost:3000/api/analytics/google/ga4/properties | jq
    ```

- `GET /api/analytics/google/ga4/realtime/:propertyId`
  - Returns realtime metrics (activeUsers, screenPageViews) grouped by country
  - Example:
    ```bash
    curl -H "Authorization: Bearer $TOKEN" \
      http://localhost:3000/api/analytics/google/ga4/realtime/123456789
    ```

- `GET /api/analytics/google/ga4/report/:propertyId?startDate=30daysAgo&endDate=today`
  - Returns a GA4 report with metrics: sessions, activeUsers, screenPageViews, bounceRate, averageSessionDuration, conversions; dimensions: date, pagePath, country
  - `startDate`/`endDate` accept GA4 relative dates (e.g., `7daysAgo`, `today`) or absolute dates (`YYYY-MM-DD`)
  - Example:
    ```bash
    curl -H "Authorization: Bearer $TOKEN" \
      "http://localhost:3000/api/analytics/google/ga4/report/123456789?startDate=30daysAgo&endDate=today"
    ```

- `GET /api/analytics/google/ga4/top-pages/:propertyId?startDate=30daysAgo&endDate=today`
  - Top pages ordered by `screenPageViews`
  - Example:
    ```bash
    curl -H "Authorization: Bearer $TOKEN" \
      "http://localhost:3000/api/analytics/google/ga4/top-pages/123456789?startDate=30daysAgo&endDate=today"
    ```

## Google Search Console (GSC)

Note: GSC APIs require absolute date strings (`YYYY-MM-DD`).

- `GET /api/analytics/google/gsc/sites`
  - Lists verified GSC sites for the user
  - Example:
    ```bash
    curl -H "Authorization: Bearer $TOKEN" \
      http://localhost:3000/api/analytics/google/gsc/sites | jq
    ```

- `GET /api/analytics/google/gsc/search-analytics?siteUrl=...&startDate=2023-01-01&endDate=2023-12-31`
  - Aggregated search analytics (clicks, impressions, ctr, position). Dimensions default to `query` in the service.
  - Example:
    ```bash
    curl -H "Authorization: Bearer $TOKEN" \
      "http://localhost:3000/api/analytics/google/gsc/search-analytics?siteUrl=https%3A%2F%2Fexample.com%2F&startDate=2024-01-01&endDate=2024-01-31"
    ```

- `GET /api/analytics/google/gsc/top-queries?siteUrl=...&startDate=2023-01-01&endDate=2023-12-31`
  - Top queries for a site
  - Example:
    ```bash
    curl -H "Authorization: Bearer $TOKEN" \
      "http://localhost:3000/api/analytics/google/gsc/top-queries?siteUrl=https%3A%2F%2Fexample.com%2F&startDate=2024-01-01&endDate=2024-01-31"
    ```

## Response shape and errors

- Analytics routes return an envelope: `{ success: boolean, data?: any, error?: string }`
- Other routes (e.g., `/health`, 404 handler, generic error handler) may return different shapes as implemented in the server.
- Common errors: missing access token, invalid property ID, Google API errors, 500 for unhandled errors.