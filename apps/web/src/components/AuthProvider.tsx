import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithPassword: (opts: { email: string; password: string }) => Promise<void>
  signUpWithPassword: (opts: { email: string; password: string }) => Promise<void>
  signInWithGoogle: (options?: { redirectTo?: string }) => Promise<void>
  signOut: () => Promise<void>
  resendVerificationEmail: () => Promise<void>
  isEmailConfirmed: boolean
  hasGoogleAccess: boolean
  googleTokens: { access_token?: string; refresh_token?: string } | null
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      if (!isMounted) return
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })()

    const { data: authSub } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('AuthProvider: Auth state changed:', event, newSession?.user?.email)
      setSession(newSession)
      setUser(newSession?.user ?? null)
    })

    return () => {
      isMounted = false
      authSub.subscription.unsubscribe()
    }
  }, [])

  // Check for Google tokens in our database
  const [googleTokens, setGoogleTokens] = useState<{ access_token?: string; refresh_token?: string } | null>(null)
  
  useEffect(() => {
    const fetchGoogleTokens = async () => {
      if (!user || !session?.access_token) {
        setGoogleTokens(null)
        return
      }

      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const response = await fetch(`${API_URL}/auth/google-tokens`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const result = await response.json()
          console.log('AuthProvider: Google tokens fetched from database:', !!result.data?.access_token)
          setGoogleTokens({
            access_token: result.data?.access_token,
            refresh_token: result.data?.refresh_token
          })
        } else {
          console.log('AuthProvider: No Google tokens found in database')
          setGoogleTokens(null)
        }
      } catch (error) {
        console.error('AuthProvider: Error fetching Google tokens:', error)
        setGoogleTokens(null)
      }
    }

    fetchGoogleTokens()
  }, [user, session?.access_token])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      isEmailConfirmed: Boolean(user?.email_confirmed_at),
      hasGoogleAccess: Boolean(googleTokens?.access_token),
      googleTokens,
      signInWithPassword: async ({ email, password }) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      },
      signUpWithPassword: async ({ email, password }) => {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      },
      signInWithGoogle: async (options = {}) => {
        // Include Analytics and Search Console scopes in the OAuth request
        const redirectTo = options.redirectTo || `${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent('/setup')}`
        
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { 
            redirectTo,
            scopes: 'https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly',
            queryParams: {
              access_type: 'offline',
              prompt: 'consent'
            }
          },
        })
        if (error) throw error
        if (data?.url) window.location.href = data.url
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      },
      resendVerificationEmail: async () => {
        if (!user?.email) throw new Error('No user email found')
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: user.email,
        })
        if (error) throw error
      },
    }),
    [user, session, loading, googleTokens]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}


