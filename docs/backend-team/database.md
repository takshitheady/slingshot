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
 - `user_tokens`
  - `id` UUID PK, `user_id` FK auth.users, `provider`, `access_token`, `refresh_token`, `expires_at`, `created_at`, `updated_at` (RLS enabled)

All above tables have RLS enabled. `user_tokens` has per-user RLS policies and an `updated_at` trigger.

## Types and client

- Generated types: `packages/database/src/types.ts` (mirrors the migration)
- Client helpers: `packages/database/src/client.ts`
  - `createSupabaseClient(url, anonKey)` returns a shared typed client
  - `getSupabaseClient()` returns the created client or throws if uninitialized

## Migrations

The initial migration is in `supabase/migrations/20250807000001_create_initial_schema.sql`.
Apply via Supabase SQL editor or CLI.

User token storage is added in `supabase/migrations/20250814000003_create_user_tokens_table.sql`.

### Live migration state (from Supabase)

- Currently detected migration: `20250807000001_create_initial_schema`
- Action: Ensure `20250814000003_create_user_tokens_table.sql` is applied (required for Google token storage and RLS).

### Live tables (from Supabase)

- `brands`, `google_integrations`, `analytics_snapshots`, `chat_sessions`, `chat_messages`, `dashboard_configs`, `user_tokens`

If any are missing, re-apply migrations from `supabase/migrations/`.

## Planned usage

- Store encrypted Google credentials in `google_integrations`
- Periodic syncs write summarized JSON into `analytics_snapshots`
- Chat sessions and messages power the AI assistant history
- Dashboard configurations persist user layouts

## Performance recommendations (from Supabase advisors)

Add covering indexes for foreign keys to improve joins/scans at scale:

```sql
-- Example indexes (apply as needed)
CREATE INDEX IF NOT EXISTS idx_google_integrations_brand_id ON public.google_integrations(brand_id);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_brand_id ON public.analytics_snapshots(brand_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_brand_id ON public.chat_sessions(brand_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_configs_brand_id ON public.dashboard_configs(brand_id);
```

Note: Newly created indexes may appear as “unused” until production traffic exercises them.