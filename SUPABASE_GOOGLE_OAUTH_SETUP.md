# Supabase Google OAuth Configuration

## 🚨 URGENT: Fix redirect_uri_mismatch Error

**The current error shows**: `Error 400: redirect_uri_mismatch`

**Root Cause Analysis**: The issue was with how we were handling scopes in the OAuth flow.

**✅ FIXED**: 
1. ✅ Google Cloud Console redirect URI is already correct
2. ✅ **Added scopes programmatically in the code** (Supabase Dashboard doesn't have an Additional Scopes UI field)

## 🚨 CRITICAL: Complete These Steps Before Testing

You need to configure Google OAuth in your Supabase Dashboard to fix the logout issue.

## Step 1: Configure Google OAuth in Supabase Dashboard

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: `slingshot`

2. **Enable Google Provider**
   - Go to: **Authentication** → **Providers**
   - Find **Google** in the list
   - Toggle **Enable sign in with Google** to ON

3. **Configure Google OAuth Settings**
   ```
   Client ID: 483948685982-ak9v9bi9pdg46om8k6lj05lfis2arutc.apps.googleusercontent.com
   Client Secret: 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
   ```

4. **Scopes Configuration** ✅ **FIXED IN CODE**
   **UPDATE**: Supabase Dashboard doesn't have an "Additional Scopes" field in the UI. Instead, we've added the required scopes programmatically in the code:
   ```
   https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly
   ```
   
   **NOTE**: The scopes are now properly configured in `AuthProvider.tsx` and will be included in the OAuth request automatically.

5. **Set Redirect URL**
   The redirect URL should be set to your Supabase callback URL:
   ```
   https://czcyfuhjutgykuxxotsm.supabase.co/auth/v1/callback
   ```
   (This is automatically handled by Supabase - no manual configuration needed here)

## Step 2: Update Google Cloud Console (REQUIRED)

1. **Go to Google Cloud Console**
   - Navigate to: https://console.cloud.google.com/
   - Select your project

2. **Update Authorized Redirect URIs**
   - Go to: **APIs & Services** → **Credentials** 
   - Click on your OAuth 2.0 client ID: `483948685982-ak9v9bi9pdg46om8k6lj05lfis2arutc.apps.googleusercontent.com`
   - In **Authorized redirect URIs**, you MUST add this exact URL:
   ```
   https://czcyfuhjutgykuxxotsm.supabase.co/auth/v1/callback
   ```
   - **IMPORTANT**: Remove any old localhost redirect URIs that are no longer needed
   - Click **SAVE**

## Step 3: Environment Variables

Your current `.env` already has the Google OAuth variables, but make sure these are correct:

```env
# Keep these for the backend analytics API calls
GOOGLE_CLIENT_ID=483948685982-ak9v9bi9pdg46om8k6lj05lfis2arutc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

## Step 4: Test the Configuration

After completing the above steps:

1. **Start the application**
   ```bash
   pnpm dev
   ```

2. **Go to `/setup`** and click "Connect with Google"
3. **Should redirect to Supabase Google OAuth** instead of custom OAuth
4. **After consent, should return without logging you out**

## ⚠️ IMPORTANT NOTES

- **DO NOT** skip the Supabase dashboard configuration - the code changes won't work without it
- The **Additional Scopes** are critical for Analytics and Search Console access
- Make sure to **save** all changes in both Supabase Dashboard and Google Cloud Console
- The redirect URL must match exactly between all systems

## 🔧 What the Code Changes Will Do

Once configured, the updated code will:
- ✅ Use Supabase's Google OAuth instead of custom OAuth
- ✅ Keep users logged in throughout the Google consent flow  
- ✅ Store Google tokens in Supabase user metadata
- ✅ Access tokens through Supabase instead of localStorage
- ✅ Eliminate the logout issue completely

Complete these configuration steps, then the code updates will work properly!