export declare class GoogleAnalyticsService {
    private oauth2Client;
    private analyticsData;
    private analyticsAdmin;
    constructor(oauth2Client: any);
    getAccounts(): Promise<any>;
    getProperties(accountId?: string): Promise<any>;
    getRealtimeReport(propertyId: string): Promise<any>;
    getReport(propertyId: string, startDate: string, endDate: string): Promise<any>;
    getTopPages(propertyId: string, startDate: string, endDate: string): Promise<any>;
}
export declare function createAnalyticsService(accessToken: string, refreshToken?: string): GoogleAnalyticsService;
