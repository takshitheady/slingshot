import { Router, Request, Response } from 'express'
import { supabase } from '../../services/supabase.js'
import type { User } from '@supabase/supabase-js'

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User
    }
  }
}

const router: Router = Router()

// Middleware to extract and validate Supabase JWT token
const validateSupabaseAuth = async (req: Request, res: Response, next: Function) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    // Attach user to request object
    req.user = user
    next()
  } catch (error) {
    console.error('Auth validation error:', error)
    res.status(500).json({ error: 'Authentication validation failed' })
  }
}

// Store Google tokens for authenticated user
router.post('/google-tokens', validateSupabaseAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user
    const { access_token, refresh_token, expires_at } = req.body
    
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    if (!access_token) {
      return res.status(400).json({ error: 'Access token is required' })
    }

    console.log('Storing Google tokens for user:', user.id)

    // Store tokens in user_tokens table
    const { error } = await supabase
      .from('user_tokens')
      .upsert({
        user_id: user.id,
        provider: 'google',
        access_token,
        refresh_token,
        expires_at: expires_at ? new Date(expires_at).toISOString() : null
      }, {
        onConflict: 'user_id,provider'
      })

    if (error) {
      console.error('Error storing tokens:', error)
      return res.status(500).json({ error: 'Failed to store tokens' })
    }

    res.json({
      success: true,
      message: 'Tokens stored successfully'
    })

  } catch (error) {
    console.error('Store tokens error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to store Google tokens'
    })
  }
})

// Get Google tokens for the authenticated user
router.get('/google-tokens', validateSupabaseAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user
    
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    // Get tokens from user_tokens table
    const { data: tokenData, error } = await supabase
      .from('user_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching tokens:', error)
      return res.status(500).json({ error: 'Failed to fetch tokens' })
    }

    if (!tokenData) {
      return res.status(404).json({ error: 'No Google tokens found for user' })
    }

    // Check if token is expired
    const isExpired = tokenData.expires_at && new Date(tokenData.expires_at) < new Date()

    res.json({
      success: true,
      data: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_at,
        is_expired: isExpired,
        user_id: user.id,
        email: user.email
      }
    })

  } catch (error) {
    console.error('Get tokens error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve Google tokens'
    })
  }
})

// Delete Google tokens for the authenticated user
router.delete('/google-tokens', validateSupabaseAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user
    
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    // Delete tokens from user_tokens table
    const { error } = await supabase
      .from('user_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', 'google')

    if (error) {
      console.error('Error deleting tokens:', error)
      return res.status(500).json({ error: 'Failed to delete tokens' })
    }

    res.json({
      success: true,
      message: 'Google tokens deleted successfully'
    })

  } catch (error) {
    console.error('Delete tokens error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete Google tokens'
    })
  }
})

export default router