import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

interface ProtectedRouteProps {
  requireGoogle?: boolean
  requireEmailConfirmation?: boolean
}

export function ProtectedRoute({ 
  requireGoogle = false, 
  requireEmailConfirmation = true 
}: ProtectedRouteProps) {
  const { user, loading, hasGoogleAccess } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-[50vh] grid place-items-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // Check email confirmation if required
  if (requireEmailConfirmation && !user.email_confirmed_at) {
    return <Navigate to="/verify-email" replace state={{ from: location }} />
  }

  if (requireGoogle) {
    if (!hasGoogleAccess) {
      return <Navigate to="/setup" replace state={{ from: location }} />
    }
  }

  return <Outlet />
}


