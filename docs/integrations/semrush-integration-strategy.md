# SEMrush Integration Strategy & Architecture

## Executive Summary

This document outlines the strategic approach for integrating SEMrush APIs into the Slingshot analytics platform, transforming it into a comprehensive competitor intelligence and SEO analytics solution. The integration leverages both SEMrush API v3 and v4 to create a unified competitive analytics dashboard alongside existing Google Analytics 4 and Google Search Console data.

**Strategic Goal**: Build a SEMrush-type dashboard with advanced competitive intelligence, keyword research, and traffic analytics capabilities that differentiate Slingshot in the market.

## API Version Strategy: Hybrid v3/v4 Approach

### SEMrush API v3 (Primary Analytics Engine)
**Source**: [SEMrush API Introduction](https://developer.semrush.com/api/basics/introduction)

**Key Advantages**:
- **Comprehensive Data Coverage**: Access to 140+ countries with historical data from 2012 (SEO) and 2017 (Traffic)
- **Stable Architecture**: No breaking changes, only additive updates
- **Rich Analytics Suite**: Three major product groups covering all competitive intelligence needs

**Primary Use Cases**:
- **Analytics API**: Domain rankings, keyword analysis, competitor research, backlink intelligence
- **Trends API**: Traffic analytics to complement GA4 data  
- **Projects API**: Campaign and project management integration

**Rate Limits**: 10 requests/second per IP, 10 simultaneous requests per user
**Authentication**: API key-based (simpler implementation)

### SEMrush API v4 (Future-Ready Components)
**Source**: [SEMrush API v4 Documentation](https://developer.semrush.com/api/v4/basic-docs/)

**Key Advantages**:
- **OAuth 2.0 Authentication**: Enhanced security and user authorization flows
- **Unified Response Format**: Consistent JSON structure across all endpoints
- **Advanced Local SEO**: Map Rank Tracker and Listing Management capabilities

**Strategic Use Cases**:
- **Projects API v4**: Enhanced project management with OAuth 2.0 security
- **Local SEO Features**: Map Rank Tracker for multi-location businesses
- **Listing Management**: Local business optimization tools

**Authentication Flow**: Device Authorization Grant (recommended) or OAuth 2.0

## Subscription & Cost Analysis

### Required SEMrush Subscriptions
**Source**: [How to Get SEMrush API](https://developer.semrush.com/api/basics/how-to-get-api/)

#### Core Requirements
1. **SEO Business Subscription**: $449/month
   - Required for Standard API and Analytics API access
   - Includes API unit packages
   - Access to comprehensive domain and keyword data

2. **API Unit Packages**: Variable cost
   - 1 unit per basic request
   - Historical data costs more units
   - Recommended: Start with 10,000 unit package

3. **Trends API**: Separate subscription
   - Trends Basic or Premium plans
   - Default 10,000 requests/month included
   - Essential for traffic analytics integration

#### Cost Optimization Strategy
- **Intelligent Caching**: Store frequently accessed data for up to 1 month (SEMrush limit)
- **Selective Data Fetching**: Use `display_limit` and targeted `export_columns`
- **Background Processing**: Batch API calls during off-peak hours
- **User Tier Management**: Limit API-heavy features to premium Slingshot users

## Technical Architecture Integration

### Existing Slingshot Infrastructure
**Current Stack**: React + TypeScript, Node.js + Express, Supabase (PostgreSQL), pnpm monorepo with Turborepo

#### Service Layer Architecture
```typescript
// New SEMrush service integration
apps/
├── server/
│   ├── src/
│   │   ├── services/
│   │   │   ├── google/          # Existing GA4/GSC
│   │   │   └── semrush/         # New SEMrush integration
│   │   │       ├── v3/
│   │   │       │   ├── analytics.service.ts
│   │   │       │   ├── trends.service.ts
│   │   │       │   └── projects.service.ts
│   │   │       ├── v4/
│   │   │       │   ├── projects.service.ts
│   │   │       │   ├── listing.service.ts
│   │   │       │   └── map-rank.service.ts
│   │   │       └── auth/
│   │   │           ├── api-key.auth.ts      # v3 auth
│   │   │           └── oauth.auth.ts        # v4 auth
```

#### Database Schema Extensions
**Integration with existing Supabase schema**:

```sql
-- SEMrush Integration Tables
CREATE TABLE semrush_integrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  api_version VARCHAR(2) CHECK (api_version IN ('v3', 'v4')),
  api_key TEXT, -- encrypted, for v3
  oauth_tokens JSONB, -- for v4, includes access/refresh tokens
  subscription_type VARCHAR(50), -- business, trends_basic, etc
  api_units_remaining INTEGER,
  last_sync TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEMrush Data Cache (JSONB for flexibility)
CREATE TABLE semrush_data_cache (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  data_type VARCHAR(50), -- domain_ranks, keywords, traffic, etc
  query_params JSONB, -- for cache invalidation
  data JSONB NOT NULL,
  api_units_cost INTEGER,
  expires_at TIMESTAMPTZ, -- 1 month cache limit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitor Intelligence
CREATE TABLE competitor_analysis (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  competitor_domain TEXT NOT NULL,
  analysis_type VARCHAR(50), -- keywords, traffic, backlinks
  competitive_data JSONB,
  opportunity_score DECIMAL(5,2),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE semrush_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE semrush_data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_analysis ENABLE ROW LEVEL SECURITY;
```

### Background Processing Strategy

#### BullMQ Job Queue Integration
**Extending existing job infrastructure**:

```typescript
// jobs/semrush-sync.job.ts
export class SEMrushSyncJob {
  private analytics = new SEMrushAnalyticsV3Service();
  private trends = new SEMrushTrendsService();
  
  async processDailySync(brandId: string) {
    // 1. Fetch domain rankings and keyword positions
    await this.syncDomainAnalytics(brandId);
    
    // 2. Update competitor intelligence
    await this.syncCompetitorAnalysis(brandId);
    
    // 3. Fetch traffic analytics (complement GA4 data)
    await this.syncTrafficData(brandId);
    
    // 4. Update local rankings (if applicable)
    await this.syncLocalRankings(brandId);
  }
}
```

**Job Scheduling Strategy**:
- **Daily Sync**: Core domain and keyword data (off-peak hours)
- **Weekly Deep Analysis**: Comprehensive competitor research
- **Real-time Requests**: User-initiated queries with caching
- **Rate Limit Management**: Distribute requests across time windows

### Security & Credential Management

#### Encryption Strategy
**Source**: [SEMrush API Security Best Practices](https://developer.semrush.com/api/basics/get-started/)

```typescript
// services/semrush/auth/credential.manager.ts
export class SEMrushCredentialManager {
  // v3 API Key storage (encrypted at rest)
  async storeAPIKey(brandId: string, apiKey: string) {
    const encrypted = await this.encrypt(apiKey);
    return this.supabase
      .from('semrush_integrations')
      .upsert({ brand_id: brandId, api_key: encrypted, api_version: 'v3' });
  }
  
  // v4 OAuth token management
  async storeOAuthTokens(brandId: string, tokens: OAuthTokens) {
    const encrypted = await this.encrypt(JSON.stringify(tokens));
    return this.supabase
      .from('semrush_integrations')
      .upsert({ 
        brand_id: brandId, 
        oauth_tokens: encrypted,
        api_version: 'v4'
      });
  }
}
```

#### OAuth 2.0 Implementation (v4)
**Device Authorization Grant Flow**:

```typescript
// auth/oauth.auth.ts
export class SEMrushOAuthService {
  async initiateDeviceFlow() {
    // Step 1: Request device authorization
    const deviceAuth = await this.requestDeviceAuthorization();
    
    // Step 2: User authenticates (frontend handles)
    // Step 3: Exchange for access tokens
    return this.exchangeForTokens(deviceAuth.device_code);
  }
  
  async refreshAccessToken(refreshToken: string) {
    // Tokens valid for 7 days, refresh tokens 30 days
    return this.tokenRefreshFlow(refreshToken);
  }
}
```

## Data Integration Strategy

### Complementary Analytics Approach
**Integration with existing GA4/GSC data**:

1. **Traffic Analytics Fusion**:
   - **GA4**: User behavior, conversion tracking, e-commerce data
   - **GSC**: Search performance, click-through rates, search queries
   - **SEMrush Trends**: Competitive traffic analysis, market share insights

2. **Keyword Intelligence Layer**:
   - **GSC**: Actual search queries and performance
   - **SEMrush Analytics**: Keyword opportunities, competitor analysis, search volume

3. **Competitive Advantage**:
   - **Unique Value**: Competitor keyword gaps, market opportunity identification
   - **Enhanced SEO**: Backlink analysis, domain authority insights
   - **Market Intelligence**: Traffic trends across competitor landscape

### Real-time Data Synchronization
**Supabase Realtime integration**:

```typescript
// Real-time updates for competitive intelligence
export class SEMrushRealtimeService {
  setupRealtimeSubscriptions(brandId: string) {
    return this.supabase
      .channel('semrush-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'competitor_analysis',
        filter: `brand_id=eq.${brandId}`
      }, payload => {
        // Push competitive intelligence updates to frontend
        this.broadcastCompetitorUpdates(payload);
      })
      .subscribe();
  }
}
```

## Competitive Differentiation Strategy

### Core Value Propositions

#### 1. Unified Analytics Dashboard
- **Single Interface**: GA4 + GSC + SEMrush data in one platform
- **Cross-Platform Insights**: Correlate organic search performance with competitive landscape
- **Holistic SEO Strategy**: Combine actual performance with market opportunities

#### 2. Advanced Competitor Intelligence
- **Keyword Gap Analysis**: Identify opportunities competitors are ranking for
- **Traffic Benchmarking**: Compare traffic patterns against industry leaders  
- **Backlink Opportunity Mining**: Find high-value link prospects from competitor analysis

#### 3. AI-Powered Recommendations
- **Integration with MCP Server**: SEMrush data feeds AI assistant for strategic recommendations
- **Predictive Analytics**: Identify trending keywords before competitors
- **Automated Opportunity Alerts**: Proactive notifications for market changes

### Feature Development Roadmap

#### Phase 1: Foundation (Q3 2025)
- SEMrush API integration and authentication flows
- Basic competitor analysis dashboard
- Keyword research and opportunity identification tools

#### Phase 2: Advanced Analytics (Q4 2025)  
- Traffic analytics integration with GA4 comparison
- Local SEO features (Map Rank Tracker integration)
- Advanced backlink analysis and opportunity mining

#### Phase 3: AI Enhancement (Q1 2026)
- MCP server integration for AI-powered insights
- Predictive keyword trending analysis
- Automated competitive intelligence reports

## Implementation Timeline & Milestones

### Development Phases

#### Phase 1: Infrastructure Setup (Weeks 1-2)
- [ ] SEMrush API credentials and subscription setup
- [ ] Database schema extensions and migrations
- [ ] Authentication service implementation (v3 + v4)
- [ ] Basic service layer architecture

#### Phase 2: Core Integration (Weeks 3-4)
- [ ] Analytics API integration (domain rankings, keywords)
- [ ] Trends API integration (traffic analytics)
- [ ] Background job implementation for data sync
- [ ] Caching strategy implementation

#### Phase 3: Dashboard Development (Weeks 5-6)
- [ ] Competitor analysis UI components
- [ ] Keyword research interface
- [ ] Data visualization for SEMrush-specific metrics
- [ ] Integration with existing Recharts components

#### Phase 4: Advanced Features (Weeks 7-8)
- [ ] Local SEO features (Map Rank Tracker)
- [ ] Advanced filtering and export capabilities
- [ ] Real-time competitive intelligence alerts
- [ ] MCP server integration for AI insights

### Success Metrics

#### Technical KPIs
- **API Response Time**: < 500ms for cached data
- **Data Freshness**: Daily sync completion rate > 95%
- **Rate Limit Compliance**: Zero API quota violations
- **Cache Hit Rate**: > 80% for frequent queries

#### Business KPIs  
- **User Engagement**: Competitive analysis feature usage
- **Data Quality**: Accuracy of competitive insights
- **Cost Efficiency**: API unit consumption optimization
- **Feature Adoption**: SEMrush dashboard usage metrics

## Risk Management & Mitigation

### Technical Risks

#### 1. API Rate Limits & Quota Management
**Risk**: Exceeding SEMrush API limits affecting user experience
**Mitigation**: 
- Intelligent request batching and queueing
- Progressive rate limit recovery mechanisms
- User notification system for quota-heavy operations

#### 2. Data Integration Complexity  
**Risk**: Conflicts between GA4/GSC and SEMrush data formats
**Mitigation**:
- Standardized data transformation layers
- Comprehensive error handling and data validation
- Fallback mechanisms for incomplete data

#### 3. Cost Escalation
**Risk**: Unexpected API unit consumption increases
**Mitigation**:
- Real-time cost monitoring and alerts
- Tiered access controls based on user subscriptions
- Predictive usage analytics and budget management

### Business Risks

#### 1. SEMrush API Changes
**Risk**: Breaking changes or deprecation of critical endpoints
**Mitigation**:
- Multi-version API support architecture
- Regular API documentation monitoring
- Fallback data sources for critical features

#### 2. Competitive Response
**Risk**: SEMrush or competitors limiting API access or features
**Mitigation**:
- Diversified data source strategy
- Proprietary data collection and analysis
- Strong user experience differentiation

## Conclusion

The SEMrush integration strategy positions Slingshot as a comprehensive competitive intelligence platform, combining the strengths of both API versions to deliver unique market insights. The hybrid v3/v4 approach ensures access to the most comprehensive data while preparing for future API evolution.

**Key Success Factors**:
1. **Strategic API Usage**: Leverage both v3 and v4 strengths
2. **Intelligent Caching**: Optimize cost and performance
3. **Unified Data Experience**: Seamless integration with existing analytics
4. **Competitive Differentiation**: Unique insights not available elsewhere

**Next Steps**:
1. Review and approve SEMrush subscription strategy
2. Begin technical implementation following architecture guidelines  
3. Develop UI/UX specifications for competitive intelligence features
4. Establish monitoring and cost management processes

---

**References**:
- [SEMrush API Introduction](https://developer.semrush.com/api/basics/introduction)  
- [How to Get SEMrush API](https://developer.semrush.com/api/basics/how-to-get-api/)
- [SEMrush API Getting Started](https://developer.semrush.com/api/basics/get-started/)
- [SEMrush API v4 Documentation](https://developer.semrush.com/api/v4/basic-docs/)
- [Analytics API Tutorial](https://developer.semrush.com/api/basics/api-tutorials/analytics-api/)  
- [Trends API Tutorial](https://developer.semrush.com/api/basics/api-tutorials/trends-api/)