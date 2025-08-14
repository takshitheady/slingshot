import { google } from 'googleapis';
export class GoogleAnalyticsService {
    constructor(oauth2Client) {
        this.oauth2Client = oauth2Client;
        this.analyticsData = google.analyticsdata({ version: 'v1beta', auth: this.oauth2Client });
        this.analyticsAdmin = google.analyticsadmin({ version: 'v1beta', auth: this.oauth2Client });
    }
    async getAccounts() {
        try {
            const response = await this.analyticsAdmin.accounts.list();
            return response.data.accounts || [];
        }
        catch (error) {
            console.error('Error fetching GA4 accounts:', error);
            throw new Error('Failed to fetch Google Analytics accounts');
        }
    }
    async getProperties(accountId) {
        try {
            const filter = accountId ? `parent:accounts/${accountId}` : undefined;
            const response = await this.analyticsAdmin.properties.list({ filter });
            return response.data.properties || [];
        }
        catch (error) {
            console.error('Error fetching GA4 properties:', error);
            throw new Error('Failed to fetch Google Analytics properties');
        }
    }
    async getRealtimeReport(propertyId) {
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
            });
            return response.data;
        }
        catch (error) {
            console.error('Error fetching GA4 realtime report:', error);
            throw new Error('Failed to fetch realtime data');
        }
    }
    async getReport(propertyId, startDate, endDate) {
        try {
            const response = await this.analyticsData.properties.runReport({
                property: `properties/${propertyId}`,
                requestBody: {
                    dateRanges: [{ startDate, endDate }],
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
            });
            return response.data;
        }
        catch (error) {
            console.error('Error fetching GA4 report:', error);
            throw new Error('Failed to fetch analytics report');
        }
    }
    async getTopPages(propertyId, startDate, endDate) {
        try {
            const response = await this.analyticsData.properties.runReport({
                property: `properties/${propertyId}`,
                requestBody: {
                    dateRanges: [{ startDate, endDate }],
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
            });
            return response.data;
        }
        catch (error) {
            console.error('Error fetching top pages:', error);
            throw new Error('Failed to fetch top pages');
        }
    }
}
export function createAnalyticsService(accessToken, refreshToken) {
    const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
    oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken
    });
    return new GoogleAnalyticsService(oauth2Client);
}
