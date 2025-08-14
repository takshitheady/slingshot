import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/components/AuthProvider'
import { analyticsService } from '../services/analytics'

export function Setup() {
  const { hasGoogleAccess, signInWithGoogle, googleTokens } = useAuth()
  const [properties, setProperties] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If user has Google access, test connections
    if (hasGoogleAccess && googleTokens) {
      testGoogleConnections()
    }
  }, [hasGoogleAccess, googleTokens])

  const handleGoogleAuth = async () => {
    try {
      setError(null)
      // Simplified Google OAuth - scopes are configured in Supabase Dashboard
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect with Google')
    }
  }

  const testGoogleConnections = async () => {
    setLoading(true)
    try {
      // Test GA4 connection
      const ga4Properties = await analyticsService.getGA4Properties()
      setProperties(Array.isArray(ga4Properties) ? ga4Properties : [])

      // Test GSC connection
      const gscSites = await analyticsService.getSearchConsoleSites()
      setSites(Array.isArray(gscSites) ? gscSites : [])
    } catch (error) {
      console.error('Failed to test Google connections:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold">Connect Your Google Accounts</h1>
        <p className="text-gray-600">
          Connect Google Analytics and Search Console to start analyzing your data.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        {!hasGoogleAccess ? (
          <div className="space-y-4">
            <button
              onClick={handleGoogleAuth}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Connect with Google
            </button>
            <p className="text-sm text-gray-500">
              You'll be redirected to Google to authorize access to Analytics and Search Console.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Google Account Connected!</span>
            </div>

            {loading ? (
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Testing connections...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Google Analytics Properties</h3>
                  {properties.length > 0 ? (
                    <ul className="space-y-1">
                      {properties.slice(0, 3).map((prop, index) => (
                        <li key={index} className="text-sm text-gray-600">
                          {prop.displayName || prop.name}
                        </li>
                      ))}
                      {properties.length > 3 && (
                        <li className="text-sm text-gray-500">
                          ...and {properties.length - 3} more
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No properties found</p>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Search Console Sites</h3>
                  {sites.length > 0 ? (
                    <ul className="space-y-1">
                      {sites.slice(0, 3).map((site, index) => (
                        <li key={index} className="text-sm text-gray-600">
                          {site.siteUrl}
                        </li>
                      ))}
                      {sites.length > 3 && (
                        <li className="text-sm text-gray-500">
                          ...and {sites.length - 3} more
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No sites found</p>
                  )}
                </div>

                <div className="pt-4">
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}