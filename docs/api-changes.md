# API Changes & Data Format Updates

## Analytics Service Return Format Change

### Before
```typescript
getGA4Properties() // Returns: { success: boolean, data: any[] }
getSearchConsoleSites() // Returns: { success: boolean, data: any[] }
```

### After  
```typescript
getGA4Properties() // Returns: any[]
getSearchConsoleSites() // Returns: any[]
```

### Impact
- **Dashboard:** Now works correctly (was crashing with "properties.map is not a function")
- **Setup Page:** Updated to handle direct arrays instead of `.data` property

## New Backend Endpoints

### Token Management API
- `POST /auth/google-tokens` - Store OAuth tokens
- `GET /auth/google-tokens` - Retrieve user's tokens
- `DELETE /auth/google-tokens` - Remove tokens

### Authentication Flow
- Added `/auth/callback` route for OAuth processing
- Removed custom Google OAuth routes (deprecated)

## Database Schema Changes

### New Table: user_tokens
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

### RLS Policies Added
- Users can only access their own tokens
- Full CRUD permissions for token owner
- No cross-user token access

## Frontend Changes

### AuthProvider Updates
- Removed metadata token parsing
- Added database token fetching
- Real-time `hasGoogleAccess` detection

### Component Changes
- **AuthCallback:** New component for OAuth token capture
- **ProtectedRoute:** Uses `hasGoogleAccess` instead of localStorage  
- **Setup:** Fixed array handling for properties/sites display
- **App:** Added `/auth/callback` route

## Environment Variables
No new variables required. Existing Google OAuth credentials work with new system.

## Migration Notes
- Run user_tokens migration before deployment
- Clear localStorage on client (old tokens no longer used)
- OAuth flow automatically migrates users to new token system