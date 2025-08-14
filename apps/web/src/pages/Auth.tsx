import { FormEvent, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/components/AuthProvider'
import { AlertCircle, CheckCircle, Mail } from 'lucide-react'

export function Auth() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signInWithPassword, signUpWithPassword, signInWithGoogle } = useAuth()
  const isSignup = location.pathname === '/signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (isSignup) {
        await signUpWithPassword({ email, password })
        // Show success message for signup (email verification needed)
        setShowSuccess(true)
      } else {
        await signInWithPassword({ email, password })
        const redirectTo = (location.state as any)?.from?.pathname || '/setup'
        navigate(redirectTo, { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-3xl font-bold tracking-tight mb-2">{isSignup ? 'Create your account' : 'Welcome back'}</h2>
      <p className="text-muted-foreground mb-6">{isSignup ? 'Start with email or Google' : 'Sign in to continue'}</p>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {showSuccess && isSignup && (
        <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700 mb-4">
          <CheckCircle className="h-4 w-4" />
          <div>
            <div className="font-medium">Check your email!</div>
            <div className="text-xs mt-1">
              We've sent a verification link to <span className="font-medium">{email}</span>
            </div>
          </div>
        </div>
      )}

      {showSuccess && isSignup ? (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Click the verification link in your email to activate your account.
            </p>
            <button
              onClick={() => navigate('/verify-email')}
              className="text-sm text-primary hover:underline"
            >
              Having trouble? Go to email verification page
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
            placeholder="name@example.com"
            autoComplete="email"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">We'll never share your email.</p>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            {!isSignup && (
              <button type="button" className="text-xs text-primary hover:underline">Forgot password?</button>
            )}
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
            placeholder={isSignup ? 'Create a secure password' : 'Enter your password'}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            required
          />
          {isSignup && <p className="text-xs text-muted-foreground mt-1">Use at least 8 characters.</p>}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
        </button>
      </form>
      )}

      {!showSuccess && (
        <>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with</span></div>
          </div>

          <button
            onClick={() => signInWithGoogle()}
            className="w-full rounded-md border px-4 py-2 hover:bg-accent flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 256 262">
              <path fill="#4285f4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"/>
              <path fill="#34a853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"/>
              <path fill="#fbbc05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"/>
              <path fill="#eb4335" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"/>
            </svg>
            Continue with Google
          </button>
        </>
      )}
    </div>
  )
}


