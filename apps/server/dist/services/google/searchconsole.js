import { google } from 'googleapis';
export class GoogleSearchConsoleService {
    constructor(oauth2Client) {
        this.oauth2Client = oauth2Client;
        this.searchconsole = google.searchconsole({ version: 'v1', auth: this.oauth2Client });
    }
    async getSites() {
        try {
            const response = await this.searchconsole.sites.list();
            return response.data.siteEntry || [];
        }
        catch (error) {
            console.error('Error fetching GSC sites:', error);
            throw new Error('Failed to fetch Search Console sites');
        }
    }
    async getSearchAnalytics(siteUrl, startDate, endDate, dimensions = ['query']) {
        try {
            const response = await this.searchconsole.searchanalytics.query({
                siteUrl,
                requestBody: {
                    startDate,
                    endDate,
                    dimensions,
                    rowLimit: 100,
                    startRow: 0
                }
            });
            return response.data;
        }
        catch (error) {
            console.error('Error fetching GSC search analytics:', error);
            throw new Error('Failed to fetch search analytics data');
        }
    }
    async getTopQueries(siteUrl, startDate, endDate) {
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
            });
            return response.data;
        }
        catch (error) {
            console.error('Error fetching top queries:', error);
            throw new Error('Failed to fetch top search queries');
        }
    }
    async getTopPages(siteUrl, startDate, endDate) {
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
            });
            return response.data;
        }
        catch (error) {
            console.error('Error fetching GSC top pages:', error);
            throw new Error('Failed to fetch top pages from Search Console');
        }
    }
    async getCountryData(siteUrl, startDate, endDate) {
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
            });
            return response.data;
        }
        catch (error) {
            console.error('Error fetching GSC country data:', error);
            throw new Error('Failed to fetch country data from Search Console');
        }
    }
    async getSitemaps(siteUrl) {
        try {
            const response = await this.searchconsole.sitemaps.list({ siteUrl });
            return response.data.sitemap || [];
        }
        catch (error) {
            console.error('Error fetching sitemaps:', error);
            throw new Error('Failed to fetch sitemaps');
        }
    }
}
export function createSearchConsoleService(accessToken, refreshToken) {
    const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
    oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken
    });
    return new GoogleSearchConsoleService(oauth2Client);
}
