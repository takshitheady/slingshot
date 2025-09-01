# Troubleshooting Guide

## Common Issues & Fixes

### 1. OAuth redirect_uri_mismatch Error
**Problem:** Google OAuth returns error about redirect URI mismatch

**Solution:** 
Add this exact URL to Google Cloud Console authorized redirect URIs:
```
https://czcyfuhjutgykuxxotsm.supabase.co/auth/v1/callback
```

### 2. User Gets Logged Out After OAuth
**Problem:** User completes Google consent but gets redirected to login page

**Solution:** 
- Ensure `user_tokens` table exists in database
- Check AuthCallback component captures provider tokens
- Verify backend `/auth/google-tokens` endpoint works

**Debug Steps:**
1. Check console logs for "AuthCallback: Tokens stored successfully"
2. Verify database has row in `user_tokens` table for user
3. Check `hasGoogleAccess` becomes true in AuthProvider

### 3. Dashboard Crashes with "properties.map is not a function"
**Problem:** Dashboard shows JavaScript error about map function

**Solution:** 
Analytics service methods must return arrays, not response objects
```typescript
// Wrong:
return data  // { success: boolean, data: any[] }

// Correct:
return data.data || []  // any[]
```

### 4. Setup Page Shows "No properties found" 
**Problem:** OAuth works but Setup page doesn't display Google properties/sites

**Solution:**
Setup page must handle direct arrays from analytics service
```typescript
// Wrong:
setProperties(ga4Properties.data || [])

// Correct:
setProperties(Array.isArray(ga4Properties) ? ga4Properties : [])
```

### 5. Google API 401/403 Errors
**Problem:** Analytics service fails to fetch data from Google APIs

**Check:**
1. Tokens exist in database: `SELECT * FROM user_tokens WHERE provider = 'google'`
2. Tokens not expired: Check `expires_at` column
3. Required scopes configured: Analytics readonly + Search Console readonly
4. Google Cloud Console APIs enabled: GA4 API, Search Console API

### 6. Environment Variable Issues
**Problem:** Server can't find Supabase environment variables

**Solution:**
Create `apps/server/src/env.ts`:
```typescript
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') })
```
Import this file first in `index.ts`

## Debug Commands

### Check OAuth Tokens
```sql
SELECT user_id, provider, created_at, expires_at 
FROM user_tokens 
WHERE provider = 'google';
```

### Check User Identities  
```sql
SELECT user_id, provider, identity_data, last_sign_in_at 
FROM auth.identities 
WHERE provider = 'google';
```

### Test Token API
```bash
# Get tokens (replace with actual JWT)
curl -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
     http://localhost:3000/auth/google-tokens
```