import { Router, Request, Response } from 'express'
import { google } from 'googleapis'

const router: Router = Router()

// Scopes for Google Analytics and Search Console
const SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly'
]

// Start OAuth flow
router.get('/google', (_req: Request, res: Response) => {
  // Check if required environment variables are set
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
    console.error('Missing required Google OAuth environment variables')
    return res.status(500).json({ error: 'OAuth configuration error' })
  }

  // Create OAuth2 client with environment variables
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent select_account', // Force consent and account chooser for clarity
    include_granted_scopes: true,
    response_type: 'code'
  })

  res.redirect(authUrl)
})

// Handle OAuth callback
router.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.query
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Authorization code is required' })
    }

    // Check if required environment variables are set
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
      console.error('Missing required Google OAuth environment variables')
      return res.status(500).json({ error: 'OAuth configuration error' })
    }

    // Create OAuth2 client with environment variables
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    // Exchange authorization code for tokens
    let tokens
    try {
      // Set the authorization code to get tokens
      oauth2Client.getToken(code, (err, tokenResult) => {
        if (err) {
          console.error('Token exchange error:', err)
          return res.status(400).json({ error: 'Failed to exchange code for tokens' })
        }
        
        tokens = tokenResult
        
        if (!tokens?.access_token) {
          return res.status(400).json({ error: 'Failed to get access token' })
        }

        // Set credentials for future API calls
        oauth2Client.setCredentials(tokens)

        // In a real app, you'd save these tokens to your database associated with the user
        // For now, we'll send them back to the frontend
        
        // Redirect to frontend with success
        res.redirect(`${process.env.CLIENT_URL}/setup?auth=success&access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token || ''}`)
      })
      
      return // Early return to prevent double response
      
    } catch (error) {
      console.error('Token exchange error:', error)
      return res.status(400).json({ error: 'Failed to exchange code for tokens' })
    }
    
  } catch (error) {
    console.error('OAuth callback error:', error)
    res.redirect(`${process.env.CLIENT_URL}/setup?auth=error`)
  }
})

// Get user's Google Analytics properties
router.get('/google/analytics/accounts', async (_req: Request, res: Response) => {
  try {
    // This endpoint is deprecated - use /api/analytics/google endpoints instead
    return res.status(410).json({ error: 'This endpoint is deprecated. Use /api/analytics/google endpoints instead.' })
    
  } catch (error) {
    console.error('Analytics accounts error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Analytics accounts'
    })
  }
})

// Get user's Search Console sites
router.get('/google/searchconsole/sites', async (_req: Request, res: Response) => {
  try {
    // This endpoint is deprecated - use /api/analytics/google endpoints instead
    return res.status(410).json({ error: 'This endpoint is deprecated. Use /api/analytics/google endpoints instead.' })
    
  } catch (error) {
    console.error('Search Console sites error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Search Console sites'
    })
  }
})

export default router