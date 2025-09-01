# User Flows

## Authentication Flow

### New User Registration
1. Land on `/` (Landing page)
2. Click "Sign Up" → Navigate to `/signup`
3. Fill email/password → Submit form
4. Account created → Email verification sent
5. Check email → Click verification link
6. Return to app → Navigate to `/verify-email`
7. Email confirmed → Navigate to `/setup`

### Existing User Login  
1. Land on `/` or `/login`
2. Enter credentials → Submit form
3. Authentication successful
4. If email not verified → Navigate to `/verify-email`
5. If verified but no Google connection → Navigate to `/setup`
6. If fully setup → Navigate to `/dashboard`

### Email Verification Flow
1. User on `/verify-email` page
2. Display verification status
3. If not verified → Show resend button with cooldown
4. After verification → Redirect to intended destination

## Google OAuth Connection Flow

### Initial OAuth Setup
1. User on `/setup` page
2. Click "Connect with Google"
3. Redirect to Google OAuth consent screen
4. User grants permissions for GA4 + GSC
5. Google redirects to `/auth/callback?redirect_to=/setup`
6. AuthCallback component:
   - Captures provider tokens from session
   - Stores tokens via backend API
   - Shows loading state with debug info
   - Redirects to `/setup`
7. Setup page displays connected properties/sites
8. Click "Go to Dashboard" → Navigate to `/dashboard`

### OAuth Error Handling
- Invalid redirect URI → Show error with support link
- Permission denied → Return to setup with retry option
- Token storage failure → Display error and retry flow

## Dashboard Navigation Flow

### Dashboard Entry
1. User navigates to `/dashboard`
2. ProtectedRoute checks:
   - User authenticated ✓
   - Email verified ✓  
   - Google tokens available ✓
3. Dashboard loads analytics data
4. Display property/site selection dropdowns
5. Show metrics cards and trend charts

### Dashboard Interactions
- Select different GA4 property → Refresh analytics data
- Select different GSC site → Refresh search console data
- Change date range → Update all charts and metrics
- Navigate between Dashboard/Setup/Chat via header

## Route Protection Logic

### Public Routes
- `/` - Landing page
- `/login` - Authentication form  
- `/signup` - Registration form
- `/auth/callback` - OAuth token processing

### Protected Routes (Authentication Required)
- `/verify-email` - Email confirmation (no email verification enforced)

### Protected Routes (Auth + Email Verified)
- `/setup` - Google connection setup
- `/chat` - AI assistant (planned)

### Protected Routes (Auth + Email + Google Connected)
- `/dashboard` - Analytics visualization

### Route Guard Behavior
- No auth → Redirect to `/login`
- Auth but unverified → Redirect to `/verify-email`
- Auth + verified but no Google → Redirect to `/setup`
- Full access → Allow route access

## Future User Flows

### SEMrush Integration Flow
1. From Dashboard → Click "Add SEMrush"
2. Enter SEMrush API key
3. Validate API key → Show available projects
4. Select projects to import
5. Dashboard updates with SEMrush widgets

### Chatbot Interaction Flow
1. Navigate to `/chat`
2. Start new conversation or select existing
3. Type query about analytics data
4. AI processes query → Returns insights
5. Export conversation → Download or save

### Multi-Brand Setup Flow (Planned)
1. After initial setup → Option to add brands
2. Create brand → Enter name/domain
3. Connect separate Google accounts per brand
4. Switch between brands in header dropdown
5. Each brand has isolated dashboard view