import { google } from 'googleapis'

export class GoogleSearchConsoleService {
  private searchconsole: any
  
  constructor(private oauth2Client: any) {
    this.searchconsole = google.searchconsole({ version: 'v1', auth: this.oauth2Client })
  }

  async getSites() {
    try {
      const response = await this.searchconsole.sites.list()
      return response.data.siteEntry || []
    } catch (error) {
      console.error('Error fetching GSC sites:', (error as any)?.response?.data || error)
      throw new Error('Failed to fetch Search Console sites')
    }
  }

  async getSearchAnalytics(siteUrl: string, startDate: string, endDate: string, dimensions: string[] = ['query']) {
    try {
      // GSC API expects verified siteUrl format (e.g., 'sc-domain:example.com' or 'https://example.com/')
      // Some accounts require page filter; we pass minimal body only
      const response = await this.searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions,
          rowLimit: 100,
          startRow: 0
        }
      })
      
      return response.data
    } catch (error) {
      console.error('Error fetching GSC search analytics:', (error as any)?.response?.data || error, {
        siteUrl,
        startDate,
        endDate,
      })
      throw new Error('Failed to fetch search analytics data')
    }
  }

  async getSearchAnalyticsByDate(siteUrl: string, startDate: string, endDate: string) {
    try {
      const response = await this.searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['date'],
          rowLimit: 1000,
          startRow: 0
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching GSC timeseries (date) analytics:', (error as any)?.response?.data || error, {
        siteUrl,
        startDate,
        endDate,
      })
      throw new Error('Failed to fetch search analytics timeseries data')
    }
  }

  async getTopQueries(siteUrl: string, startDate: string, endDate: string) {
    try {
      const response = await this.searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['query'],
          rowLimit: 50,
          startRow: 0
        }
      })
      
      return response.data
    } catch (error) {
      console.error('Error fetching top queries:', (error as any)?.response?.data || error)
      throw new Error('Failed to fetch top search queries')
    }
  }

  async getTopPages(siteUrl: string, startDate: string, endDate: string) {
    try {
      const response = await this.searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['page'],
          rowLimit: 50,
          startRow: 0
        }
      })
      
      return response.data
    } catch (error) {
      console.error('Error fetching GSC top pages:', (error as any)?.response?.data || error)
      throw new Error('Failed to fetch top pages from Search Console')
    }
  }

  async getCountryData(siteUrl: string, startDate: string, endDate: string) {
    try {
      const response = await this.searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['country'],
          rowLimit: 20,
          startRow: 0
        }
      })
      
      return response.data
    } catch (error) {
      console.error('Error fetching GSC country data:', (error as any)?.response?.data || error)
      throw new Error('Failed to fetch country data from Search Console')
    }
  }

  async getSitemaps(siteUrl: string) {
    try {
      const response = await this.searchconsole.sitemaps.list({ siteUrl })
      return response.data.sitemap || []
    } catch (error) {
      console.error('Error fetching sitemaps:', (error as any)?.response?.data || error)
      throw new Error('Failed to fetch sitemaps')
    }
  }
}

export function createSearchConsoleService(accessToken: string, refreshToken?: string) {
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

  return new GoogleSearchConsoleService(oauth2Client)
}