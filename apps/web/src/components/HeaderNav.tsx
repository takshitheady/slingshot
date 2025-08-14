import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from './AuthProvider'

export function HeaderNav() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="text-2xl font-bold text-primary transition-colors hover:text-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
        >
          Slingshot
        </Link>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-accent hover:text-accent-foreground md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={() => setIsMenuOpen((v) => !v)}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        >
          <span className="sr-only">{isMenuOpen ? 'Close menu' : 'Open menu'}</span>
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <nav className="hidden md:flex md:items-center md:gap-4">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  isActive('/dashboard') ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/setup"
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  isActive('/setup') ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                Setup
              </Link>
              <button
                onClick={async () => {
                  await signOut()
                  navigate('/')
                }}
                className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>

      <div id="mobile-menu" className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`} aria-hidden={!isMenuOpen}>
        <div className="space-y-1 px-2 pb-3 pt-2">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className={`block rounded-md px-3 py-2 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  isActive('/dashboard') ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/setup"
                className={`block rounded-md px-3 py-2 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  isActive('/setup') ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Setup
              </Link>
              <button
                onClick={async () => {
                  await signOut()
                  navigate('/')
                  setIsMenuOpen(false)
                }}
                className="block w-full text-left rounded-md border border-input bg-background px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="block rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="mt-2 block rounded-md bg-primary px-3 py-2 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}


