import { useState, useEffect } from 'react'
import { analyticsService, type AnalyticsData, type TrafficData, type SearchConsoleData } from '../services/analytics'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export function Dashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [trafficData, setTrafficData] = useState<TrafficData[]>([])
  const [searchConsole, setSearchConsole] = useState<SearchConsoleData | null>(null)
  const [gscSeries, setGscSeries] = useState<Array<{ date: string; clicks: number; impressions: number }>>([])
  const [properties, setProperties] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null)
  const [selectedSite, setSelectedSite] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({
    startDate: '30daysAgo',
    endDate: 'today'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get available GA4 properties and Search Console sites
      const [ga4Properties, gscSites] = await Promise.all([
        analyticsService.getGA4Properties(),
        analyticsService.getSearchConsoleSites()
      ])
      
      setProperties(ga4Properties)
      setSites(gscSites)

      if (ga4Properties.length > 0) {
        // Use the first property by default
        const firstProperty = ga4Properties[0]
        const propertyId = extractPropertyId(firstProperty)
        
        if (propertyId) {
          setSelectedProperty(propertyId)
          
          // Fetch dashboard data for this property
          console.log('Available properties:', ga4Properties)
          console.log('Selected property ID:', propertyId)
          console.log('Date range:', dateRange)
          
          const [dashboardData, trends] = await Promise.all([
            analyticsService.getDashboardData(propertyId, dateRange.startDate, dateRange.endDate),
            analyticsService.getTrafficTrends(propertyId, dateRange.startDate, dateRange.endDate)
          ])
          
          console.log('Dashboard data:', dashboardData)
          console.log('Traffic trends:', trends)
          
          setAnalytics(dashboardData)
          setTrafficData(trends)
        }
      }

      if (gscSites.length > 0) {
        // Use the first site by default
        const firstSite = gscSites[0]
        const siteUrl = firstSite.siteUrl
        
        if (siteUrl) {
          setSelectedSite(siteUrl)
          
          try {
            // Fetch Search Console data for this site
            const [searchConsoleData, series] = await Promise.all([
              analyticsService.getSearchConsoleData(siteUrl, dateRange.startDate, dateRange.endDate),
              analyticsService.getSearchConsoleTimeseries(siteUrl, dateRange.startDate, dateRange.endDate)
            ])
            setSearchConsole(searchConsoleData)
            setGscSeries(series)
          } catch (gscError) {
            console.warn('Search Console data unavailable:', gscError)
            // Continue without GSC data - don't fail the entire dashboard
          }
        }
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const extractPropertyId = (property: any): string | null => {
    // Extract property ID from the GA4 property object
    // Format is usually "properties/{propertyId}"
    if (property.name) {
      const match = property.name.match(/properties\/(\d+)/)
      return match ? match[1] : null
    }
    return null
  }

  const handleDateRangeChange = async (newRange: { startDate: string; endDate: string }) => {
    setDateRange(newRange)
    
    // Refresh data with new date range
    if (selectedProperty || selectedSite) {
      setLoading(true)
      try {
        if (selectedProperty) {
          const [dashboardData, trends] = await Promise.all([
            analyticsService.getDashboardData(selectedProperty, newRange.startDate, newRange.endDate),
            analyticsService.getTrafficTrends(selectedProperty, newRange.startDate, newRange.endDate)
          ])
          setAnalytics(dashboardData)
          setTrafficData(trends)
        }
        
        if (selectedSite) {
          try {
            const [searchConsoleData, series] = await Promise.all([
              analyticsService.getSearchConsoleData(selectedSite, newRange.startDate, newRange.endDate),
              analyticsService.getSearchConsoleTimeseries(selectedSite, newRange.startDate, newRange.endDate)
            ])
            setSearchConsole(searchConsoleData)
            setGscSeries(series)
          } catch (gscError) {
            console.warn('Search Console data unavailable during refresh:', gscError)
            // Keep existing GSC data or clear it
            setSearchConsole(null)
            setGscSeries([])
          }
        }
      } catch (err) {
        console.error('Error refreshing data:', err)
        setError(err instanceof Error ? err.message : 'Failed to refresh data')
      } finally {
        setLoading(false)
      }
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Loading your analytics data...
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-8 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Your analytics overview and insights
          </p>
        </div>
        
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Unable to Load Analytics Data</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-y-2 text-sm text-red-600">
            <p>• Make sure you've connected to Google Analytics in the Setup page</p>
            <p>• Verify you have access to at least one Google Analytics 4 property</p>
            <p>• Check that your Google Analytics account has data</p>
          </div>
          <button 
            onClick={loadDashboardData}
            className="mt-4 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Your analytics overview and insights
            {selectedProperty && ` • Property ID: ${selectedProperty}`}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">GA4 Property:</label>
            <select
              value={selectedProperty ?? ''}
              onChange={async (e) => {
                const propertyId = e.target.value || null
                setSelectedProperty(propertyId)
                if (propertyId) {
                  setLoading(true)
                  try {
                    const [dashboardData, trends] = await Promise.all([
                      analyticsService.getDashboardData(propertyId, dateRange.startDate, dateRange.endDate),
                      analyticsService.getTrafficTrends(propertyId, dateRange.startDate, dateRange.endDate)
                    ])
                    setAnalytics(dashboardData)
                    setTrafficData(trends)
                  } finally {
                    setLoading(false)
                  }
                }
              }}
              className="rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              {properties.map((p: any) => {
                const pid = extractPropertyId(p)
                return (
                  <option key={p.name} value={pid ?? ''}>{p.displayName ?? p.name}</option>
                )
              })}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Date Range:</label>
            <select
              value={`${dateRange.startDate}|${dateRange.endDate}`}
              onChange={(e) => {
                const [startDate, endDate] = e.target.value.split('|')
                handleDateRangeChange({ startDate, endDate })
              }}
              className="rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="7daysAgo|today">Last 7 days</option>
              <option value="30daysAgo|today">Last 30 days</option>
              <option value="90daysAgo|today">Last 90 days</option>
              <option value="365daysAgo|today">Last year</option>
              <option value="730daysAgo|today">Last 2 years</option>
              <option value="2020-01-01|today">Since 2020</option>
            </select>
          </div>
          
          <button
            onClick={() => loadDashboardData()}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Refresh
          </button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Page Views</h3>
          <p className="text-2xl font-bold">
            {analytics ? analyticsService.formatNumber(analytics.pageViews) : '0'}
          </p>
          <p className="text-xs text-muted-foreground">
            {analytics ? analyticsService.formatPercentageChange(analytics.pageViewsChange) : '+0% from last month'}
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Users</h3>
          <p className="text-2xl font-bold">
            {analytics ? analyticsService.formatNumber(analytics.users) : '0'}
          </p>
          <p className="text-xs text-muted-foreground">
            {analytics ? analyticsService.formatPercentageChange(analytics.usersChange) : '+0% from last month'}
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Bounce Rate</h3>
          <p className="text-2xl font-bold">
            {analytics ? `${analytics.bounceRate}%` : '0%'}
          </p>
          <p className="text-xs text-muted-foreground">
            {analytics ? analyticsService.formatPercentageChange(analytics.bounceRateChange) : '+0% from last month'}
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Session Duration</h3>
          <p className="text-2xl font-bold">
            {analytics ? analyticsService.formatDuration(analytics.averageSessionDuration) : '0m 0s'}
          </p>
          <p className="text-xs text-muted-foreground">
            Last 30 days
          </p>
        </div>
      </div>

      {gscSeries.length > 0 && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Search Console Traffic</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {gscSeries.length} days of data • Clicks & Impressions
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gscSeries} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
                <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '12px' }} />
                <Legend />
                <Line type="monotone" dataKey="clicks" stroke="hsl(221.2 83.2% 53.3%)" strokeWidth={2} name="Clicks" dot={{ r: 2 }} />
                <Line type="monotone" dataKey="impressions" stroke="hsl(47.9 95.8% 53.1%)" strokeWidth={2} name="Impressions" dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {searchConsole && (
        <>
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Search Console Metrics</h3>
            {selectedSite && (
              <p className="text-sm text-muted-foreground mb-4">
                Site: {selectedSite}
              </p>
            )}
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-card p-6">
              <h4 className="font-semibold">Clicks</h4>
              <p className="text-2xl font-bold">
                {analyticsService.formatNumber(searchConsole.clicks)}
              </p>
              <p className="text-xs text-muted-foreground">
                {analyticsService.formatPercentageChange(searchConsole.clicksChange)}
              </p>
            </div>
            
            <div className="rounded-lg border bg-card p-6">
              <h4 className="font-semibold">Impressions</h4>
              <p className="text-2xl font-bold">
                {analyticsService.formatNumber(searchConsole.impressions)}
              </p>
              <p className="text-xs text-muted-foreground">
                {analyticsService.formatPercentageChange(searchConsole.impressionsChange)}
              </p>
            </div>
            
            <div className="rounded-lg border bg-card p-6">
              <h4 className="font-semibold">Click-through Rate</h4>
              <p className="text-2xl font-bold">
                {searchConsole.ctr.toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground">
                {analyticsService.formatPercentageChange(searchConsole.ctrChange)}
              </p>
            </div>
            
            <div className="rounded-lg border bg-card p-6">
              <h4 className="font-semibold">Average Position</h4>
              <p className="text-2xl font-bold">
                {searchConsole.position.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </div>
          </div>
        </>
      )}

      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Traffic Overview</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {trafficData.length > 0 ? `${trafficData.length} days of data • Last 30 days` : 'No traffic data available for the selected period'}
        </p>
        {trafficData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trafficData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="pageViews" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Page Views"
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="hsl(142.1 76.2% 36.3%)" 
                  strokeWidth={2}
                  name="Users"
                  dot={{ fill: 'hsl(142.1 76.2% 36.3%)', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="hsl(47.9 95.8% 53.1%)" 
                  strokeWidth={2}
                  name="Sessions"
                  dot={{ fill: 'hsl(47.9 95.8% 53.1%)', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">No traffic data to display</p>
              <p className="text-sm text-muted-foreground">
                This GA4 property may be new or have no recent traffic
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}