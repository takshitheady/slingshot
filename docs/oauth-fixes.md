# OAuth Authentication Fixes

## Problem Fixed: User Logout After Google OAuth

### Root Cause
- Supabase doesn't store OAuth provider tokens in user metadata
- Custom OAuth flow conflicted with Supabase session management
- ProtectedRoute checked localStorage instead of actual token availability

### Solution Implemented

#### 1. Token Persistence System
**Created:** `user_tokens` database table
```sql
CREATE TABLE user_tokens (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  UNIQUE(user_id, provider)
);
```

#### 2. Backend Token API
**File:** `apps/server/src/routes/auth/tokens.ts`
- `POST /auth/google-tokens` - Store tokens
- `GET /auth/google-tokens` - Retrieve tokens  
- `DELETE /auth/google-tokens` - Remove tokens

#### 3. Token Capture During OAuth
**File:** `apps/web/src/pages/AuthCallback.tsx`
- Captures `session.provider_token` immediately after OAuth
- Stores tokens via backend API before redirect
- Added `/auth/callback` route for proper OAuth handling

#### 4. Updated Authentication Flow
**Files:** 
- `AuthProvider.tsx` - Fetches tokens from database instead of metadata
- `ProtectedRoute.tsx` - Uses `hasGoogleAccess` instead of localStorage
- `Setup.tsx` - Fixed data format handling

### What Works Now
- OAuth flow maintains user session throughout
- Google tokens persist across sessions
- Dashboard loads without crashes
- Setup page displays actual properties/sites

### Technical Details
- OAuth tokens captured from `session.provider_token` during callback
- Tokens stored encrypted in database with RLS policies
- AuthProvider polls database for token availability
- Analytics service uses stored tokens for API calls

### Files Changed
- `supabase/migrations/20250814000003_create_user_tokens_table.sql`
- `apps/server/src/routes/auth/tokens.ts` (created)
- `apps/web/src/pages/AuthCallback.tsx` (created)
- `apps/web/src/components/AuthProvider.tsx` (major refactor)
- `apps/web/src/components/ProtectedRoute.tsx` (fixed Google access check)
- `apps/web/src/services/analytics.ts` (return format fixes)
- `apps/web/src/pages/Setup.tsx` (data handling fixes)
- `apps/web/src/App.tsx` (added callback route)

### Migration Required
Run the user_tokens table migration in Supabase dashboard before testing.