import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabaseClient'

export function AuthCallback() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading } = useAuth()
  const [debugInfo, setDebugInfo] = useState('')
  const [tokensCaptured, setTokensCaptured] = useState(false)

  useEffect(() => {
    const captureGoogleTokens = async () => {
      try {
        console.log('AuthCallback: Attempting to capture Google tokens from session')
        
        // Get the current session which might contain provider tokens
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('AuthCallback: Error getting session:', sessionError)
          return false
        }

        console.log('AuthCallback: Session:', session)
        console.log('AuthCallback: Provider token:', session?.provider_token?.substring(0, 20) + '...')
        console.log('AuthCallback: Provider refresh token:', !!session?.provider_refresh_token)

        if (!session?.provider_token) {
          console.log('AuthCallback: No provider tokens found in session')
          return false
        }

        // Store tokens using our API
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const response = await fetch(`${API_URL}/auth/google-tokens`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            access_token: session.provider_token,
            refresh_token: session.provider_refresh_token,
            expires_at: null // We'll handle expiration later
          })
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Failed to store tokens' }))
          console.error('AuthCallback: Failed to store tokens:', error)
          return false
        }

        const result = await response.json()
        console.log('AuthCallback: Tokens stored successfully:', result)
        return true

      } catch (error) {
        console.error('AuthCallback: Error capturing tokens:', error)
        return false
      }
    }

    const handleAuthCallback = async () => {
      console.log('AuthCallback: Starting OAuth callback processing')
      console.log('AuthCallback: User:', user)
      console.log('AuthCallback: Loading:', loading)
      
      setDebugInfo(`User: ${!!user}, Loading: ${loading}, TokensCaptured: ${tokensCaptured}`)
      
      if (user && !tokensCaptured) {
        console.log('AuthCallback: User authenticated, attempting to capture Google tokens...')
        
        const tokensStored = await captureGoogleTokens()
        setTokensCaptured(tokensStored)
        
        if (tokensStored) {
          console.log('AuthCallback: Google tokens captured successfully')
        } else {
          console.log('AuthCallback: Failed to capture Google tokens')
        }
        
        // Wait a bit for token storage to complete
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      if (user && (tokensCaptured || loading === false)) {
        // Check if there's a redirect destination from the OAuth state
        const urlParams = new URLSearchParams(location.search)
        const redirectTo = urlParams.get('redirect_to') || '/setup'
        
        console.log('AuthCallback: Redirecting to:', redirectTo)
        
        // Navigate to the intended destination
        navigate(redirectTo, { replace: true })
      } else if (!loading && !user) {
        console.log('AuthCallback: Authentication failed, redirecting to login')
        // If authentication failed, go back to login
        navigate('/login', { replace: true })
      }
    }

    if (!loading) {
      handleAuthCallback()
    }
  }, [user, loading, tokensCaptured, navigate, location.search])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <h2 className="text-xl font-semibold">Completing authentication...</h2>
        <p className="text-gray-600">
          {tokensCaptured ? 'Setting up your Google connection...' : 'Please wait while we set up your account.'}
        </p>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-2 bg-gray-100 rounded text-sm">
            Debug: {debugInfo}
          </div>
        )}
      </div>
    </div>
  )
}