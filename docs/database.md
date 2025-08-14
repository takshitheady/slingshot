# Database

Supabase (PostgreSQL) is used for persistence, authentication (auth schema), and storage (future). Types for `public` schema live in `packages/database/src/types.ts`.

## Schema (from migration)

Tables:
- `brands`
  - `id` UUID PK, `name`, `domain` (unique), `created_at`, `updated_at`, `created_by` (FK auth.users)
- `google_integrations`
  - `id` UUID PK, `brand_id` FK, `integration_type` (`GA4` | `GSC`), `property_id`, `credentials` JSONB, `refresh_token`, `status`, `last_sync`, `created_at`
- `analytics_snapshots`
  - `id` UUID PK, `brand_id` FK, `source` (`GA4` | `GSC`), `metric_type`, `data` JSONB, `date_from`, `date_to`, `created_at`
- `chat_sessions`
  - `id` UUID PK, `brand_id` FK, `user_id` FK auth.users, `title`, `created_at`
- `chat_messages`
  - `id` UUID PK, `session_id` FK chat_sessions, `role` (`user` | `assistant`), `content`, `metadata`, `created_at`
- `dashboard_configs`
  - `id` UUID PK, `brand_id` FK, `name`, `config` JSONB, `is_default`, `created_at`

All above tables have RLS enabled. Policies are not yet defined in this repo and should be added before production use.

## Types and client

- Generated types: `packages/database/src/types.ts` (mirrors the migration)
- Client helpers: `packages/database/src/client.ts`
  - `createSupabaseClient(url, anonKey)` returns a shared typed client
  - `getSupabaseClient()` returns the created client or throws if uninitialized

## Migrations

The initial migration is in `supabase/migrations/20250807000001_create_initial_schema.sql`.
Apply via Supabase SQL editor or CLI.

## Planned usage

- Store encrypted Google credentials in `google_integrations`
- Periodic syncs write summarized JSON into `analytics_snapshots`
- Chat sessions and messages power the AI assistant history
- Dashboard configurations persist user layouts