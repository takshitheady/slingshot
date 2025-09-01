# SEMrush API Implementation Guide

## Overview

This technical implementation guide provides detailed instructions for integrating SEMrush APIs v3 and v4 into the Slingshot platform. It covers authentication flows, service architecture, data models, error handling, and integration patterns with the existing Node.js/Express/Supabase stack.

**Repository**: Slingshot monorepo (pnpm + Turborepo)
**Backend**: Node.js + Express + TypeScript  
**Database**: Supabase (PostgreSQL)
**Package Manager**: pnpm

## Authentication Implementation

### SEMrush API v3 Authentication (API Key)
**Source**: [SEMrush API Getting Started](https://developer.semrush.com/api/basics/get-started/)

#### API Key Management Service

```typescript
// apps/server/src/services/semrush/auth/api-key.auth.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export class SEMrushAPIKeyAuth {
  private readonly algorithm = 'aes-256-gcm';
  private readonly secretKey = process.env.SEMRUSH_ENCRYPTION_KEY!;

  async storeAPIKey(brandId: string, apiKey: string): Promise<void> {
    const iv = randomBytes(12);
    const cipher = createCipheriv(this.algorithm, Buffer.from(this.secretKey, 'hex'), iv);
    
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    const { error } = await this.supabase
      .from('semrush_integrations')
      .upsert({
        brand_id: brandId,
        api_version: 'v3',
        api_key: {
          encrypted: encrypted,
          iv: iv.toString('hex'),
          authTag: authTag.toString('hex')
        },
        status: 'active'
      });

    if (error) throw new Error(`Failed to store API key: ${error.message}`);
  }

  async getAPIKey(brandId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('semrush_integrations')
      .select('api_key')
      .eq('brand_id', brandId)
      .eq('api_version', 'v3')
      .single();

    if (error || !data) return null;

    const { encrypted, iv, authTag } = data.api_key;
    const decipher = createDecipheriv(
      this.algorithm, 
      Buffer.from(this.secretKey, 'hex'), 
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### SEMrush API v4 Authentication (OAuth 2.0)
**Source**: [SEMrush API v4 Documentation](https://developer.semrush.com/api/v4/basic-docs/)

#### Device Authorization Grant Flow

```typescript
// apps/server/src/services/semrush/auth/oauth.auth.ts
import axios from 'axios';

interface DeviceAuthResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
}

export class SEMrushOAuthService {
  private readonly baseURL = 'https://oauth.semrush.com';
  private readonly clientId = process.env.SEMRUSH_CLIENT_ID!;
  private readonly clientSecret = process.env.SEMRUSH_CLIENT_SECRET!;

  async initiateDeviceFlow(): Promise<DeviceAuthResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/oauth2/device`, {
        client_id: this.clientId,
        scope: 'projects.read projects.write listings.read listings.write'
      });

      return response.data;
    } catch (error) {
      throw new Error(`Device authorization failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async exchangeForTokens(deviceCode: string): Promise<TokenResponse> {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    
    while (attempts < maxAttempts) {
      try {
        const response = await axios.post(`${this.baseURL}/oauth2/token`, {
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
          device_code: deviceCode,
          client_id: this.clientId,
          client_secret: this.clientSecret
        });

        return response.data;
      } catch (error) {
        const errorCode = error.response?.data?.error;
        
        if (errorCode === 'authorization_pending') {
          // User hasn't completed authorization yet
          await new Promise(resolve => setTimeout(resolve, 5000));
          attempts++;
          continue;
        } else if (errorCode === 'slow_down') {
          // Polling too frequently
          await new Promise(resolve => setTimeout(resolve, 10000));
          attempts++;
          continue;
        } else {
          throw new Error(`Token exchange failed: ${error.response?.data?.message || error.message}`);
        }
      }
    }
    
    throw new Error('Device authorization timeout - user did not complete authentication');
  }

  async refreshTokens(refreshToken: string): Promise<TokenResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/oauth2/token`, {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret
      });

      return response.data;
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async storeTokens(brandId: string, tokens: TokenResponse): Promise<void> {
    const encryptedTokens = await this.encryptTokens(JSON.stringify(tokens));
    
    const { error } = await this.supabase
      .from('semrush_integrations')
      .upsert({
        brand_id: brandId,
        api_version: 'v4',
        oauth_tokens: encryptedTokens,
        status: 'active'
      });

    if (error) throw new Error(`Failed to store OAuth tokens: ${error.message}`);
  }
}
```

## Service Layer Implementation

### SEMrush Analytics API (v3) Service
**Source**: [Analytics API Tutorial](https://developer.semrush.com/api/basics/api-tutorials/analytics-api/)

```typescript
// apps/server/src/services/semrush/v3/analytics.service.ts
import axios from 'axios';
import csv from 'csv-parser';
import { Readable } from 'stream';

interface DomainRankingParams {
  domain: string;
  database?: string;
  displayLimit?: number;
  exportColumns?: string[];
}

interface KeywordAnalysisParams {
  keyword: string;
  database?: string;
  displayLimit?: number;
}

export class SEMrushAnalyticsV3Service {
  private readonly baseURL = 'https://api.semrush.com';
  private apiKeyAuth = new SEMrushAPIKeyAuth();
  private rateLimiter = new SEMrushRateLimiter();

  async getDomainRankings(brandId: string, params: DomainRankingParams) {
    const apiKey = await this.apiKeyAuth.getAPIKey(brandId);
    if (!apiKey) throw new Error('SEMrush API key not configured');

    await this.rateLimiter.checkLimit();

    const requestParams = new URLSearchParams({
      key: apiKey,
      type: 'domain_ranks',
      domain: params.domain,
      database: params.database || 'us',
      display_limit: (params.displayLimit || 10).toString()
    });

    if (params.exportColumns) {
      requestParams.set('export_columns', params.exportColumns.join(','));
    }

    try {
      const response = await axios.get(`${this.baseURL}/?${requestParams.toString()}`);
      const data = await this.parseCSVResponse(response.data);
      
      // Cache the response
      await this.cacheAPIResponse(brandId, 'domain_ranks', params, data, 1);
      
      return data;
    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  async getDomainKeywords(brandId: string, params: DomainRankingParams) {
    const apiKey = await this.apiKeyAuth.getAPIKey(brandId);
    if (!apiKey) throw new Error('SEMrush API key not configured');

    await this.rateLimiter.checkLimit();

    const requestParams = new URLSearchParams({
      key: apiKey,
      type: 'domain_organic',
      domain: params.domain,
      database: params.database || 'us',
      display_limit: (params.displayLimit || 100).toString(),
      export_columns: params.exportColumns?.join(',') || 'Ph,Po,Nq,Cp,Ur,Tr,Tc,Co,Nr,Td'
    });

    try {
      const response = await axios.get(`${this.baseURL}/?${requestParams.toString()}`);
      const data = await this.parseCSVResponse(response.data);
      
      await this.cacheAPIResponse(brandId, 'domain_organic', params, data, 1);
      
      return data;
    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  async getCompetitorAnalysis(brandId: string, domain: string) {
    // Get organic competitors
    const organicCompetitors = await this.getOrganicCompetitors(brandId, domain);
    
    // Get paid competitors  
    const paidCompetitors = await this.getPaidCompetitors(brandId, domain);
    
    // Analyze keyword gaps
    const keywordGaps = await this.analyzeKeywordGaps(brandId, domain, organicCompetitors.slice(0, 5));
    
    return {
      organicCompetitors,
      paidCompetitors,
      keywordGaps,
      competitiveIntelligence: this.generateCompetitiveInsights(organicCompetitors, paidCompetitors)
    };
  }

  private async parseCSVResponse(csvData: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const stream = Readable.from([csvData]);
      
      stream
        .pipe(csv({ headers: false, skipLinesWithError: true }))
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  private handleAPIError(error: any): Error {
    if (error.response?.status === 429) {
      return new Error('Rate limit exceeded - please try again later');
    } else if (error.response?.status === 403) {
      return new Error('Insufficient API units - please check your subscription');
    } else if (error.response?.status === 401) {
      return new Error('Invalid API key - please reconfigure authentication');
    }
    return new Error(`SEMrush API error: ${error.message}`);
  }
}
```

### SEMrush Trends API Service
**Source**: [Trends API Tutorial](https://developer.semrush.com/api/basics/api-tutorials/trends-api/)

```typescript
// apps/server/src/services/semrush/v3/trends.service.ts
export class SEMrushTrendsService {
  private readonly baseURL = 'https://api.semrush.com';
  
  async getTrafficOverview(brandId: string, domain: string, dateRange?: string) {
    const apiKey = await this.apiKeyAuth.getAPIKey(brandId);
    if (!apiKey) throw new Error('SEMrush API key not configured');

    const requestParams = new URLSearchParams({
      key: apiKey,
      type: 'traffic_summary',
      domain: domain,
      display_date: dateRange || '202301-202312' // Last 12 months
    });

    try {
      const response = await axios.get(`${this.baseURL}/?${requestParams.toString()}`);
      const trafficData = await this.parseCSVResponse(response.data);
      
      // Transform to match GA4 data structure for unified analytics
      const transformedData = this.transformTrafficData(trafficData);
      
      await this.cacheAPIResponse(brandId, 'traffic_summary', { domain, dateRange }, transformedData, 1);
      
      return transformedData;
    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  async getTrafficSources(brandId: string, domain: string) {
    const apiKey = await this.apiKeyAuth.getAPIKey(brandId);
    if (!apiKey) throw new Error('SEMrush API key not configured');

    const requestParams = new URLSearchParams({
      key: apiKey,
      type: 'traffic_sources',
      domain: domain
    });

    try {
      const response = await axios.get(`${this.baseURL}/?${requestParams.toString()}`);
      return await this.parseCSVResponse(response.data);
    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  private transformTrafficData(rawData: any[]): any {
    // Transform SEMrush traffic data to match GA4 structure
    return {
      sessions: rawData.find(row => row.type === 'visits')?.value || 0,
      users: rawData.find(row => row.type === 'unique_visitors')?.value || 0,
      bounceRate: rawData.find(row => row.type === 'bounce_rate')?.value || 0,
      avgSessionDuration: rawData.find(row => row.type === 'time_on_site')?.value || 0,
      pagesPerSession: rawData.find(row => row.type === 'pages_per_visit')?.value || 0,
      source: 'semrush',
      timestamp: new Date().toISOString()
    };
  }
}
```

### SEMrush Projects API v4 Service
**Source**: [SEMrush Projects API v4](https://developer.semrush.com/api/v4/projects/v0084/)

```typescript
// apps/server/src/services/semrush/v4/projects.service.ts
export class SEMrushProjectsV4Service {
  private readonly baseURL = 'https://api4.semrush.com';
  private oauthService = new SEMrushOAuthService();

  async getProjects(brandId: string): Promise<any[]> {
    const accessToken = await this.getValidAccessToken(brandId);
    
    try {
      const response = await axios.get(`${this.baseURL}/projects`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.data; // v4 has unified response structure
    } catch (error) {
      throw this.handleV4APIError(error);
    }
  }

  async createProject(brandId: string, projectName: string, url: string) {
    const accessToken = await this.getValidAccessToken(brandId);
    
    try {
      const response = await axios.post(`${this.baseURL}/projects`, {
        project_name: projectName,
        url: url
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.data;
    } catch (error) {
      throw this.handleV4APIError(error);
    }
  }

  private async getValidAccessToken(brandId: string): Promise<string> {
    const { data, error } = await this.supabase
      .from('semrush_integrations')
      .select('oauth_tokens')
      .eq('brand_id', brandId)
      .eq('api_version', 'v4')
      .single();

    if (error || !data) throw new Error('OAuth tokens not found');

    const tokens = JSON.parse(await this.decryptTokens(data.oauth_tokens));
    
    // Check if token needs refresh (expires in 7 days)
    const tokenAge = Date.now() - new Date(tokens.created_at).getTime();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    
    if (tokenAge > sevenDaysInMs) {
      const newTokens = await this.oauthService.refreshTokens(tokens.refresh_token);
      await this.oauthService.storeTokens(brandId, newTokens);
      return newTokens.access_token;
    }
    
    return tokens.access_token;
  }

  private handleV4APIError(error: any): Error {
    const errorResponse = error.response?.data?.error;
    if (errorResponse) {
      return new Error(`SEMrush v4 API error: ${errorResponse.message} (Code: ${errorResponse.code})`);
    }
    return new Error(`SEMrush v4 API error: ${error.message}`);
  }
}
```

## Rate Limiting & Queue Management

### Rate Limiter Implementation
**Source**: [SEMrush API Introduction - Rate Limits](https://developer.semrush.com/api/basics/introduction)

```typescript
// apps/server/src/services/semrush/utils/rate-limiter.ts
import { RateLimiterRedis } from 'rate-limiter-flexible';

export class SEMrushRateLimiter {
  private rateLimiter: RateLimiterRedis;
  
  constructor() {
    // SEMrush limits: 10 requests per second per IP
    this.rateLimiter = new RateLimiterRedis({
      storeClient: this.redisClient,
      keyPrefix: 'semrush_rate_limit',
      points: 10, // Number of requests
      duration: 1, // Per 1 second
      execEvenly: true // Spread requests evenly across duration
    });
  }

  async checkLimit(ip?: string): Promise<void> {
    try {
      await this.rateLimiter.consume(ip || 'global');
    } catch (rejRes) {
      const msBeforeNext = rejRes.msBeforeNext || 1000;
      throw new Error(`Rate limit exceeded. Try again in ${Math.round(msBeforeNext / 1000)} seconds.`);
    }
  }

  async getRemainingPoints(ip?: string): Promise<number> {
    const res = await this.rateLimiter.get(ip || 'global');
    return res ? res.remainingPoints : 10;
  }
}
```

### Background Job Queue Implementation

```typescript
// apps/server/src/jobs/semrush-sync.job.ts
import { Job, Queue, Worker } from 'bullmq';

interface SEMrushSyncJobData {
  brandId: string;
  syncType: 'daily' | 'weekly' | 'on_demand';
  domains: string[];
  apiVersion: 'v3' | 'v4' | 'both';
}

export class SEMrushSyncJob {
  private analyticsService = new SEMrushAnalyticsV3Service();
  private trendsService = new SEMrushTrendsService();
  private projectsService = new SEMrushProjectsV4Service();

  async process(job: Job<SEMrushSyncJobData>) {
    const { brandId, syncType, domains, apiVersion } = job.data;
    
    try {
      await job.updateProgress(10);
      
      // Sync domain analytics data
      if (apiVersion === 'v3' || apiVersion === 'both') {
        for (const domain of domains) {
          await this.syncDomainAnalytics(brandId, domain);
          await job.updateProgress(30);
          
          await this.syncCompetitorAnalysis(brandId, domain);
          await job.updateProgress(50);
          
          if (syncType === 'weekly') {
            await this.syncTrafficData(brandId, domain);
            await job.updateProgress(70);
          }
        }
      }
      
      // Sync project data (v4)
      if (apiVersion === 'v4' || apiVersion === 'both') {
        await this.syncProjectData(brandId);
        await job.updateProgress(90);
      }
      
      await job.updateProgress(100);
      
      return { success: true, syncedDomains: domains.length };
    } catch (error) {
      throw new Error(`SEMrush sync failed: ${error.message}`);
    }
  }

  private async syncDomainAnalytics(brandId: string, domain: string) {
    // Get domain rankings
    const rankings = await this.analyticsService.getDomainRankings(brandId, { 
      domain,
      displayLimit: 100 
    });
    
    // Get organic keywords
    const keywords = await this.analyticsService.getDomainKeywords(brandId, { 
      domain,
      displayLimit: 500 
    });
    
    // Store in database
    await this.storeAnalyticsData(brandId, domain, {
      rankings,
      keywords,
      syncType: 'domain_analytics',
      timestamp: new Date()
    });
  }

  private async storeAnalyticsData(brandId: string, domain: string, data: any) {
    const { error } = await this.supabase
      .from('semrush_data_cache')
      .upsert({
        brand_id: brandId,
        data_type: data.syncType,
        query_params: { domain },
        data: data,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        api_units_cost: this.calculateAPIUnits(data)
      });

    if (error) {
      throw new Error(`Failed to store analytics data: ${error.message}`);
    }
  }
}

// Queue setup
export const semrushSyncQueue = new Queue('semrush-sync', {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
});

// Worker setup  
export const semrushSyncWorker = new Worker('semrush-sync', 
  async (job: Job<SEMrushSyncJobData>) => {
    const syncJob = new SEMrushSyncJob();
    return await syncJob.process(job);
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    },
    concurrency: 2 // Limit concurrent jobs to respect rate limits
  }
);
```

## Data Models & TypeScript Interfaces

```typescript
// packages/shared/src/types/semrush.types.ts

// v3 API Response Types
export interface SEMrushDomainRanking {
  domain: string;
  rank: number;
  organic_keywords: number;
  organic_traffic: number;
  organic_cost: number;
  adwords_keywords: number;
  adwords_traffic: number;
  adwords_cost: number;
}

export interface SEMrushKeywordData {
  keyword: string;
  position: number;
  previous_position?: number;
  search_volume: number;
  cpc: number;
  url: string;
  traffic_percent: number;
  costs_percent: number;
  competition: number;
  number_of_results: number;
  trends: number[];
}

export interface SEMrushCompetitorAnalysis {
  competitor_domain: string;
  common_keywords: number;
  se_keywords: number;
  se_traffic: number;
  competitor_relevance: number;
  organic_keywords: number;
  organic_traffic: number;
  organic_cost: number;
}

// v4 API Response Types  
export interface SEMrushV4Response<T> {
  meta: {
    status: 'success' | 'error';
    message?: string;
  };
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface SEMrushProject {
  project_id: string;
  project_name: string;
  url: string;
  domain: string;
  domain_unicode: string;
  tools?: string[];
  owner_id?: string;
  permissions?: ('OWNER' | 'READ' | 'WRITE')[];
}

// Unified Data Models for Frontend
export interface CompetitorIntelligence {
  domain: string;
  competitors: {
    domain: string;
    commonKeywords: number;
    organicKeywords: number;
    organicTraffic: number;
    competitorRelevance: number;
  }[];
  keywordGaps: {
    keyword: string;
    competitorPosition: number;
    searchVolume: number;
    difficulty: number;
    opportunity: 'high' | 'medium' | 'low';
  }[];
  marketShare: {
    domain: string;
    trafficShare: number;
    visibilityIndex: number;
  }[];
}

export interface KeywordOpportunity {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  currentPosition?: number;
  competitorPositions: {
    domain: string;
    position: number;
  }[];
  opportunityScore: number;
  potentialTraffic: number;
}
```

## Error Handling & Monitoring

```typescript
// apps/server/src/services/semrush/utils/error-handler.ts
export class SEMrushErrorHandler {
  static handleAPIError(error: any, context: string): never {
    // Log error for monitoring
    console.error(`SEMrush API Error [${context}]:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: error.config
    });

    // Send to Sentry or monitoring service
    if (process.env.SENTRY_DSN) {
      // Sentry.captureException(error, { tags: { service: 'semrush', context } });
    }

    const status = error.response?.status;
    
    switch (status) {
      case 401:
        throw new Error('SEMrush authentication failed - please reconfigure API credentials');
      case 403:
        throw new Error('Insufficient SEMrush API units - please check your subscription');
      case 429:
        throw new Error('SEMrush rate limit exceeded - please try again later');
      case 500:
      case 502:
      case 503:
        throw new Error('SEMrush service temporarily unavailable - please try again');
      default:
        throw new Error(`SEMrush API error: ${error.message || 'Unknown error'}`);
    }
  }

  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    backoffMs: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on authentication or quota errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw error;
        }
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Exponential backoff
        const delay = backoffMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }
}
```

## Integration with Existing Services

### Enhanced Analytics Service Integration

```typescript
// apps/server/src/services/analytics/enhanced-analytics.service.ts
export class EnhancedAnalyticsService {
  private ga4Service = new GoogleAnalyticsService();
  private gscService = new GoogleSearchConsoleService();
  private semrushAnalytics = new SEMrushAnalyticsV3Service();
  private semrushTrends = new SEMrushTrendsService();

  async getUnifiedAnalytics(brandId: string, domain: string, dateRange: DateRange) {
    const [ga4Data, gscData, semrushData] = await Promise.all([
      this.ga4Service.getAnalyticsData(brandId, dateRange),
      this.gscService.getSearchPerformance(brandId, dateRange),
      this.getSEMrushData(brandId, domain, dateRange)
    ]);

    return this.mergeAnalyticsData(ga4Data, gscData, semrushData);
  }

  private async getSEMrushData(brandId: string, domain: string, dateRange: DateRange) {
    // Check cache first
    const cachedData = await this.getCachedSEMrushData(brandId, domain, dateRange);
    if (cachedData) return cachedData;

    // Fetch fresh data
    const [rankings, keywords, traffic] = await Promise.all([
      this.semrushAnalytics.getDomainRankings(brandId, { domain }),
      this.semrushAnalytics.getDomainKeywords(brandId, { domain, displayLimit: 500 }),
      this.semrushTrends.getTrafficOverview(brandId, domain, this.formatDateRange(dateRange))
    ]);

    const semrushData = {
      rankings,
      keywords,
      traffic,
      competitorAnalysis: await this.semrushAnalytics.getCompetitorAnalysis(brandId, domain)
    };

    // Cache for future requests
    await this.cacheSEMrushData(brandId, domain, dateRange, semrushData);
    
    return semrushData;
  }

  private mergeAnalyticsData(ga4Data: any, gscData: any, semrushData: any) {
    return {
      overview: {
        sessions: ga4Data.sessions,
        users: ga4Data.users,
        bounceRate: ga4Data.bounceRate,
        // Competitive benchmarking
        competitorTrafficShare: semrushData.competitorAnalysis.marketShare,
        visibilityIndex: semrushData.rankings.organic_keywords / 1000 // Normalized
      },
      seo: {
        // GSC actual performance
        clicks: gscData.clicks,
        impressions: gscData.impressions,
        ctr: gscData.ctr,
        position: gscData.position,
        
        // SEMrush competitive intelligence
        organicKeywords: semrushData.rankings.organic_keywords,
        organicTraffic: semrushData.rankings.organic_traffic,
        keywordOpportunities: this.identifyKeywordOpportunities(gscData.queries, semrushData.keywords),
        competitorGaps: semrushData.competitorAnalysis.keywordGaps
      },
      competitive: {
        mainCompetitors: semrushData.competitorAnalysis.competitors.slice(0, 5),
        marketPosition: this.calculateMarketPosition(semrushData),
        competitiveAdvantages: this.identifyCompetitiveAdvantages(gscData, semrushData)
      }
    };
  }

  private identifyKeywordOpportunities(gscQueries: any[], semrushKeywords: any[]): KeywordOpportunity[] {
    const opportunities: KeywordOpportunity[] = [];
    
    // Find high-volume keywords where competitors rank better
    for (const semrushKeyword of semrushKeywords) {
      const gscMatch = gscQueries.find(q => 
        q.query.toLowerCase().includes(semrushKeyword.keyword.toLowerCase())
      );
      
      if (semrushKeyword.position > 10 && semrushKeyword.search_volume > 1000) {
        opportunities.push({
          keyword: semrushKeyword.keyword,
          searchVolume: semrushKeyword.search_volume,
          difficulty: this.calculateKeywordDifficulty(semrushKeyword),
          cpc: semrushKeyword.cpc,
          currentPosition: gscMatch?.position || null,
          competitorPositions: [], // Would be populated from competitor analysis
          opportunityScore: this.calculateOpportunityScore(semrushKeyword, gscMatch),
          potentialTraffic: this.estimatePotentialTraffic(semrushKeyword)
        });
      }
    }
    
    return opportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);
  }
}
```

## Environment Configuration

```bash
# .env additions for SEMrush integration

# SEMrush API v3 (stored per brand in database)
SEMRUSH_ENCRYPTION_KEY=your-32-character-encryption-key-here

# SEMrush API v4 OAuth (if using OAuth flow)
SEMRUSH_CLIENT_ID=your-oauth-client-id
SEMRUSH_CLIENT_SECRET=your-oauth-client-secret

# SEMrush API Configuration  
SEMRUSH_DEFAULT_DATABASE=us
SEMRUSH_CACHE_TTL_HOURS=24
SEMRUSH_MAX_API_UNITS_PER_DAY=1000

# Rate Limiting
SEMRUSH_REQUESTS_PER_SECOND=8
SEMRUSH_MAX_CONCURRENT_REQUESTS=5

# Background Jobs
SEMRUSH_SYNC_CRON="0 2 * * *" # Daily at 2 AM
SEMRUSH_WEEKLY_SYNC_CRON="0 3 * * 1" # Mondays at 3 AM
```

## Testing Strategy

```typescript
// apps/server/src/services/semrush/__tests__/analytics.service.test.ts
import { SEMrushAnalyticsV3Service } from '../v3/analytics.service';

describe('SEMrushAnalyticsV3Service', () => {
  let service: SEMrushAnalyticsV3Service;
  let mockBrandId: string;

  beforeEach(() => {
    service = new SEMrushAnalyticsV3Service();
    mockBrandId = 'test-brand-id';
    
    // Mock API key retrieval
    jest.spyOn(service['apiKeyAuth'], 'getAPIKey')
      .mockResolvedValue('mock-api-key');
  });

  describe('getDomainRankings', () => {
    it('should fetch and parse domain ranking data', async () => {
      const mockCSVResponse = `domain,rank,organic_keywords,organic_traffic
example.com,1000,5000,50000`;
      
      jest.spyOn(axios, 'get').mockResolvedValue({ data: mockCSVResponse });
      
      const result = await service.getDomainRankings(mockBrandId, {
        domain: 'example.com'
      });
      
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        domain: 'example.com',
        rank: '1000',
        organic_keywords: '5000',
        organic_traffic: '50000'
      });
    });

    it('should handle rate limit errors gracefully', async () => {
      jest.spyOn(axios, 'get').mockRejectedValue({
        response: { status: 429, data: 'Rate limit exceeded' }
      });
      
      await expect(
        service.getDomainRankings(mockBrandId, { domain: 'example.com' })
      ).rejects.toThrow('Rate limit exceeded - please try again later');
    });

    it('should cache successful responses', async () => {
      const mockResponse = { data: 'mock,csv,data' };
      jest.spyOn(axios, 'get').mockResolvedValue(mockResponse);
      
      const cachespy = jest.spyOn(service, 'cacheAPIResponse');
      
      await service.getDomainRankings(mockBrandId, { domain: 'example.com' });
      
      expect(cachespy).toHaveBeenCalledWith(
        mockBrandId,
        'domain_ranks',
        expect.any(Object),
        expect.any(Array),
        1
      );
    });
  });
});
```

## Deployment Considerations

### Package.json Dependencies

```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "csv-parser": "^3.0.0",
    "bullmq": "^4.15.0",
    "rate-limiter-flexible": "^3.0.0",
    "ioredis": "^5.3.0"
  },
  "devDependencies": {
    "@types/csv-parser": "^1.1.0"
  }
}
```

### Database Migration

```sql
-- Migration: Add SEMrush integration tables
-- File: supabase/migrations/20250901000000_add_semrush_tables.sql

CREATE TABLE IF NOT EXISTS semrush_integrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  api_version VARCHAR(2) CHECK (api_version IN ('v3', 'v4')) NOT NULL,
  api_key JSONB, -- encrypted for v3
  oauth_tokens JSONB, -- encrypted for v4
  subscription_type VARCHAR(50),
  api_units_remaining INTEGER DEFAULT 0,
  last_sync TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, api_version)
);

CREATE TABLE IF NOT EXISTS semrush_data_cache (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  data_type VARCHAR(50) NOT NULL,
  query_params JSONB,
  data JSONB NOT NULL,
  api_units_cost INTEGER DEFAULT 1,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  INDEX idx_semrush_cache_brand_type (brand_id, data_type),
  INDEX idx_semrush_cache_expires (expires_at)
);

CREATE TABLE IF NOT EXISTS competitor_analysis (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  competitor_domain TEXT NOT NULL,
  analysis_type VARCHAR(50),
  competitive_data JSONB,
  opportunity_score DECIMAL(5,2),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  INDEX idx_competitor_brand_domain (brand_id, competitor_domain)
);

-- RLS Policies
ALTER TABLE semrush_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE semrush_data_cache ENABLE ROW LEVEL SECURITY;  
ALTER TABLE competitor_analysis ENABLE ROW LEVEL SECURITY;

-- Policies (users can only access their brand's data)
CREATE POLICY "Users can access their brand's SEMrush integrations" ON semrush_integrations
  FOR ALL USING (
    brand_id IN (
      SELECT id FROM brands WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can access their brand's SEMrush cache" ON semrush_data_cache
  FOR ALL USING (
    brand_id IN (
      SELECT id FROM brands WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can access their brand's competitor analysis" ON competitor_analysis
  FOR ALL USING (
    brand_id IN (
      SELECT id FROM brands WHERE created_by = auth.uid()
    )
  );
```

This implementation guide provides a comprehensive foundation for integrating SEMrush APIs into the Slingshot platform, with proper authentication, rate limiting, error handling, and data management strategies.

---

**References**:
- [SEMrush API Introduction](https://developer.semrush.com/api/basics/introduction)
- [SEMrush API Getting Started](https://developer.semrush.com/api/basics/get-started/)  
- [SEMrush API v4 Documentation](https://developer.semrush.com/api/v4/basic-docs/)
- [Analytics API Tutorial](https://developer.semrush.com/api/basics/api-tutorials/analytics-api/)
- [Trends API Tutorial](https://developer.semrush.com/api/basics/api-tutorials/trends-api/)
- [Projects API Tutorial](https://developer.semrush.com/api/basics/api-tutorials/projects-api/)