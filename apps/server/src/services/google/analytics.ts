import { google } from 'googleapis'

export class GoogleAnalyticsService {
  private analyticsData: any
  private analyticsAdmin: any
  
  constructor(private oauth2Client: any) {
    this.analyticsData = google.analyticsdata({ version: 'v1beta', auth: this.oauth2Client })
    this.analyticsAdmin = google.analyticsadmin({ version: 'v1beta', auth: this.oauth2Client })
  }

  async getAccounts() {
    try {
      const response = await this.analyticsAdmin.accounts.list()
      return response.data.accounts || []
    } catch (error) {
      console.error('Error fetching GA4 accounts:', (error as any)?.response?.data || error)
      throw error
    }
  }

  async getProperties(accountId?: string) {
    try {
      if (accountId) {
        const filter = `parent:accounts/${accountId}`
        const response = await this.analyticsAdmin.properties.list({ filter })
        return response.data.properties || []
      }

      // When no specific account is provided, use Account Summaries to list all accessible properties
      const summaries = await this.analyticsAdmin.accountSummaries.list({ pageSize: 2000 })
      const items = summaries.data.accountSummaries || []
      const properties = items.flatMap((summary: any) => {
        const propSummaries = summary.propertySummaries || []
        return propSummaries.map((p: any) => ({
          name: p.property, // e.g., "properties/123456"
          displayName: p.displayName,
          parent: summary.name,
        }))
      })
      return properties
    } catch (error) {
      console.error('Error fetching GA4 properties:', (error as any)?.response?.data || error)
      throw error
    }
  }

  async getRealtimeReport(propertyId: string) {
    try {
      const response = await this.analyticsData.properties.runRealtimeReport({
        property: `properties/${propertyId}`,
        requestBody: {
          metrics: [
            { name: 'activeUsers' },
            { name: 'screenPageViews' },
          ],
          dimensions: [
            { name: 'country' }
          ]
        }
      })
      
      return response.data
    } catch (error) {
      console.error('Error fetching GA4 realtime report:', (error as any)?.response?.data || error)
      throw error
    }
  }

  async getReport(propertyId: string, startDate: string, endDate: string) {
    try {
      const response = await this.analyticsData.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          keepEmptyRows: true,
          metrics: [
            { name: 'sessions' },
            { name: 'activeUsers' },
            { name: 'screenPageViews' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
            { name: 'conversions' }
          ],
          dimensions: [
            { name: 'date' },
            { name: 'pagePath' },
            { name: 'country' }
          ]
        }
      })
      
      return response.data
    } catch (error) {
      console.error('Error fetching GA4 report:', (error as any)?.response?.data || error)
      throw error
    }
  }

  async getTopPages(propertyId: string, startDate: string, endDate: string) {
    try {
      const response = await this.analyticsData.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          keepEmptyRows: true,
          metrics: [
            { name: 'screenPageViews' },
            { name: 'sessions' },
            { name: 'bounceRate' }
          ],
          dimensions: [
            { name: 'pagePath' },
            { name: 'pageTitle' }
          ],
          orderBys: [
            { metric: { metricName: 'screenPageViews' }, desc: true }
          ],
          limit: 20
        }
      })
      
      return response.data
    } catch (error) {
      console.error('Error fetching top pages:', (error as any)?.response?.data || error)
      throw error
    }
  }
}

export function createAnalyticsService(accessToken: string, refreshToken?: string) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
    throw new Error('OAuth configuration error: Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/GOOGLE_REDIRECT_URI')
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  })

  return new GoogleAnalyticsService(oauth2Client)
}