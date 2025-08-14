# Security

## Implemented
- HTTP security headers via `helmet`
- CORS restricted to `CLIENT_URL`
- Rate limiting via `express-rate-limit` (100 req / 15 min per IP)

## To improve before production
- OAuth tokens: do not store in `localStorage`; persist encrypted in Supabase and use short-lived server sessions
- RLS policies: add granular policies for all tables (`brands`, `google_integrations`, etc.)
- Secrets management: use platform secret stores (Vercel/Net, Railway, Fly.io) instead of `.env` where possible
- CSP headers: configure a strict CSP appropriate for the frontend
- Input validation: apply zod validation on API request payloads
- Error handling: avoid leaking internal error messages
- Dependency updates and audit: regularly update and audit dependencies

## Compliance considerations
- GDPR: allow data export/deletion for brands; document data retention
- Least privilege: separate service keys and restrict DB roles

## Threat model notes
- Protect Google refresh tokens at rest (encryption-at-rest + application-level encryption)
- Rate limit sensitive endpoints (OAuth callback, analytics fetch)
- Consider bot protection or additional auth for API if exposed publicly