export declare class GoogleSearchConsoleService {
    private oauth2Client;
    private searchconsole;
    constructor(oauth2Client: any);
    getSites(): Promise<any>;
    getSearchAnalytics(siteUrl: string, startDate: string, endDate: string, dimensions?: string[]): Promise<any>;
    getTopQueries(siteUrl: string, startDate: string, endDate: string): Promise<any>;
    getTopPages(siteUrl: string, startDate: string, endDate: string): Promise<any>;
    getCountryData(siteUrl: string, startDate: string, endDate: string): Promise<any>;
    getSitemaps(siteUrl: string): Promise<any>;
}
export declare function createSearchConsoleService(accessToken: string, refreshToken?: string): GoogleSearchConsoleService;
