import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabaseClient'
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

export function VerifyEmail() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    // Handle email confirmation from URL params
    const token = searchParams.get('token')
    const type = searchParams.get('type')
    
    if (token && type === 'signup') {
      handleEmailConfirmation(token)
    }
  }, [searchParams])

  useEffect(() => {
    // Countdown timer for resend cooldown
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleEmailConfirmation = async (token: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      })
      
      if (error) throw error
      
      setMessage('Email verified successfully! Redirecting...')
      
      // Redirect to setup after successful verification
      setTimeout(() => {
        navigate('/setup', { replace: true })
      }, 2000)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify email')
    } finally {
      setLoading(false)
    }
  }

  const handleResendEmail = async () => {
    if (!user?.email || resendCooldown > 0) return
    
    setLoading(true)
    setError(null)
    setMessage(null)
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      })
      
      if (error) throw error
      
      setMessage('Verification email sent! Please check your inbox.')
      setResendCooldown(60) // 60 second cooldown
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend email')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  if (!user) {
    navigate('/login')
    return null
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="text-center space-y-6">
        <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Verify your email</h1>
          <p className="text-gray-600">
            We've sent a verification email to{' '}
            <span className="font-medium text-gray-900">{user.email}</span>
          </p>
        </div>

        {message && (
          <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>Click the verification link in your email to continue.</p>
            <p className="mt-2">
              Can't find the email? Check your spam folder or request a new one.
            </p>
          </div>

          <button
            onClick={handleResendEmail}
            disabled={loading || resendCooldown > 0}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : resendCooldown > 0 ? (
              <>Resend in {resendCooldown}s</>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Resend verification email
              </>
            )}
          </button>

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
            >
              Sign out and use a different email
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}