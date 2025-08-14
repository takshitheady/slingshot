const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/analytics/google`

interface AnalyticsData {
  pageViews: number
  users: number
  sessions: number
  bounceRate: number
  averageSessionDuration: number
  pageViewsChange: number
  usersChange: number
  sessionsChange: number
  bounceRateChange: number
}

interface TrafficData {
  date: string
  pageViews: number
  users: number
  sessions: number
}

interface SearchConsoleData {
  clicks: number
  impressions: number
  ctr: number
  position: number
  clicksChange: number
  impressionsChange: number
  ctrChange: number
  positionChange: number
}

class AnalyticsService {
  private async request<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init)
    const contentType = response.headers.get('content-type') || ''
    const isJson = contentType.includes('application/json')
    if (!response.ok) {
      let message = `${response.status} ${response.statusText}`
      if (isJson) {
        try {
          const body = await response.json()
          if (body?.error) message = body.error
          if (body?.details) message = `${message}: ${typeof body.details === 'string' ? body.details : JSON.stringify(body.details)}`
        } catch (_) {
          // ignore JSON parse errors
        }
      }
      throw new Error(message)
    }
    return isJson ? (await response.json()) as T : (undefined as unknown as T)
  }

  private async getAuthHeaders() {
    // Get Supabase session token
    const { data: { session } } = await import('@/lib/supabaseClient').then(({ supabase }) => supabase.auth.getSession())
    
    if (!session?.access_token) {
      throw new Error('No Supabase session found. Please log in first.')
    }

    // Fetch Google tokens from backend using Supabase token
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const response = await fetch(`${API_URL}/auth/google-tokens`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch Google tokens' }))
      throw new Error(error.error || 'Failed to authenticate with Google')
    }

    const { data } = await response.json()
    
    if (!data?.access_token) {
      throw new Error('No Google access token found. Please connect to Google Analytics first.')
    }

    return {
      'Authorization': `Bearer ${data.access_token}`,
      'Content-Type': 'application/json',
      ...(data.refresh_token && { 'x-refresh-token': data.refresh_token })
    }
  }

  async getGA4Properties() {
    try {
      const headers = await this.getAuthHeaders()
      const data = await this.request<{ success: boolean; data: any[] }>(`${API_BASE_URL}/ga4/properties`, {
        headers
      })
      return Array.isArray(data.data) ? data.data : []
    } catch (error) {
      console.error('Failed to fetch GA4 properties:', error)
      return []
    }
  }

  async getDashboardData(propertyId: string, startDate = '30daysAgo', endDate = 'today'): Promise<AnalyticsData> {
    const headers = await this.getAuthHeaders()
    const data = await this.request<{ success: boolean; data: any }>(`${API_BASE_URL}/ga4/report/${propertyId}?startDate=${startDate}&endDate=${endDate}`, {
      headers
    })
    return this.formatDashboardData(data.data)
  }

  async getTrafficTrends(propertyId: string, startDate = '30daysAgo', endDate = 'today'): Promise<TrafficData[]> {
    const headers = await this.getAuthHeaders()
    const data = await this.request<{ success: boolean; data: any }>(`${API_BASE_URL}/ga4/report/${propertyId}?startDate=${startDate}&endDate=${endDate}`, {
      headers
    })
    return this.formatTrafficTrends(data.data)
  }

  async getTopPages(propertyId: string, startDate = '30daysAgo', endDate = 'today') {
    try {
      const headers = await this.getAuthHeaders()
      const data = await this.request<{ success: boolean; data: any }>(`${API_BASE_URL}/ga4/top-pages/${propertyId}?startDate=${startDate}&endDate=${endDate}`, {
        headers
      })
      return Array.isArray(data.data) ? data.data : []
    } catch (error) {
      console.error('Failed to fetch top pages:', error)
      return []
    }
  }

  async getSearchConsoleSites() {
    try {
      const headers = await this.getAuthHeaders()
      const data = await this.request<{ success: boolean; data: any[] }>(`${API_BASE_URL}/gsc/sites`, {
        headers
      })
      return Array.isArray(data.data) ? data.data : []
    } catch (error) {
      console.error('Failed to fetch Search Console sites:', error)
      return []
    }
  }

  async getSearchConsoleData(siteUrl: string, startDate = '30daysAgo', endDate = 'today'): Promise<SearchConsoleData> {
    const headers = await this.getAuthHeaders()
    const data = await this.request<{ success: boolean; data: any }>(`${API_BASE_URL}/gsc/search-analytics?siteUrl=${encodeURIComponent(siteUrl)}&startDate=${startDate}&endDate=${endDate}`, {
      headers
    })
    return this.formatSearchConsoleData(data.data)
  }

  async getSearchConsoleTimeseries(siteUrl: string, startDate = '30daysAgo', endDate = 'today') {
    const headers = await this.getAuthHeaders()
    const data = await this.request<{ success: boolean; data: any }>(`${API_BASE_URL}/gsc/timeseries?siteUrl=${encodeURIComponent(siteUrl)}&startDate=${startDate}&endDate=${endDate}`, {
      headers
    })
    const rows = data.data?.rows || []
    return rows.map((row: any) => ({
      date: row.keys?.[0] || row?.keys?.[0] || row?.dimensions?.[0] || 'Unknown',
      clicks: row.clicks || row.metrics?.[0]?.values?.[0] || 0,
      impressions: row.impressions || row.metrics?.[0]?.values?.[1] || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    }))
  }

  private formatDashboardData(rawData: any): AnalyticsData {
    console.log('Raw GA4 dashboard data:', JSON.stringify(rawData, null, 2))
    
    // Default values if no data
    if (!rawData || !rawData.rows || rawData.rows.length === 0) {
      console.log('No rows in GA4 data')
      return {
        pageViews: 0,
        users: 0,
        sessions: 0,
        bounceRate: 0,
        averageSessionDuration: 0,
        pageViewsChange: 0,
        usersChange: 0,
        sessionsChange: 0,
        bounceRateChange: 0
      }
    }

    // Extract metrics from Google Analytics response
    // The exact structure depends on the GA4 API response format
    let pageViews = 0
    let users = 0
    let sessions = 0
    let bounceRate = 0
    let averageSessionDuration = 0

    if (rawData.totals && rawData.totals.length > 0) {
      const totals = rawData.totals[0]
      // Server metrics order:
      // 0: sessions, 1: activeUsers, 2: screenPageViews, 3: bounceRate, 4: averageSessionDuration, 5: conversions
      sessions = parseInt(totals.values?.[0] || '0')
      users = parseInt(totals.values?.[1] || '0')
      pageViews = parseInt(totals.values?.[2] || '0')
      bounceRate = parseFloat(totals.values?.[3] || '0')
      averageSessionDuration = parseFloat(totals.values?.[4] || '0')
    }

    // For now, set change percentages to 0 (we'll implement comparison later)
    return {
      pageViews,
      users,
      sessions,
      bounceRate: Math.round(bounceRate * 100), // Convert to percentage
      averageSessionDuration: Math.round(averageSessionDuration),
      pageViewsChange: 0,
      usersChange: 0,
      sessionsChange: 0,
      bounceRateChange: 0
    }
  }

  private formatTrafficTrends(rawData: any): TrafficData[] {
    console.log('Raw GA4 traffic trends data:', JSON.stringify(rawData, null, 2))
    
    if (!rawData || !rawData.rows) {
      console.log('No rows in traffic trends data')
      return []
    }

    return rawData.rows.map((row: any) => {
      const date = row.dimensions?.[0] || 'Unknown'
      // Server metrics order per row aligns with totals:
      // 0: sessions, 1: activeUsers, 2: screenPageViews
      const sessions = parseInt(row.metrics?.[0]?.values?.[0] || '0')
      const users = parseInt(row.metrics?.[0]?.values?.[1] || '0')
      const pageViews = parseInt(row.metrics?.[0]?.values?.[2] || '0')

      return {
        date,
        pageViews,
        users,
        sessions
      }
    })
  }

  private formatSearchConsoleData(rawData: any): SearchConsoleData {
    // Default values if no data
    if (!rawData || !rawData.rows || rawData.rows.length === 0) {
      return {
        clicks: 0,
        impressions: 0,
        ctr: 0,
        position: 0,
        clicksChange: 0,
        impressionsChange: 0,
        ctrChange: 0,
        positionChange: 0
      }
    }

    // Extract metrics from Search Console response
    let clicks = 0
    let impressions = 0
    let ctr = 0
    let position = 0

    if (rawData.rows && rawData.rows.length > 0) {
      // Aggregate data from all rows
      rawData.rows.forEach((row: any) => {
        clicks += row.clicks || 0
        impressions += row.impressions || 0
        ctr += row.ctr || 0
        position += row.position || 0
      })
      
      // Calculate averages for CTR and position
      const rowCount = rawData.rows.length
      ctr = rowCount > 0 ? ctr / rowCount : 0
      position = rowCount > 0 ? position / rowCount : 0
    }

    return {
      clicks,
      impressions,
      ctr: Math.round(ctr * 10000) / 100, // Convert to percentage with 2 decimal places
      position: Math.round(position * 10) / 10, // Round to 1 decimal place
      clicksChange: 0, // For now, set to 0 (implement comparison later)
      impressionsChange: 0,
      ctrChange: 0,
      positionChange: 0
    }
  }

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toLocaleString()
  }

  formatPercentageChange(change: number): string {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}% from last month`
  }
}

export const analyticsService = new AnalyticsService()
export type { AnalyticsData, TrafficData, SearchConsoleData }