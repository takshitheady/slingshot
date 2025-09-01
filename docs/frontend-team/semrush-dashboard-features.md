# SEMrush Dashboard Features & UI Components

## Overview

This document outlines the frontend implementation of SEMrush integration features for the Slingshot analytics platform. It details the dashboard components, data visualization strategies, user interface design, and React component architecture for competitive intelligence and SEO analytics features.

**Tech Stack**: React 18 + TypeScript, Vite, Tailwind CSS, Recharts, React Router v6, Supabase SDK
**Integration**: SEMrush APIs v3 & v4, existing GA4/GSC analytics data

## Dashboard Architecture & Navigation

### Enhanced Navigation Structure
**Integration with existing Slingshot navigation**:

```typescript
// apps/web/src/components/common/Navigation.tsx - Enhanced
const navigationItems = [
  // Existing items
  { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
  { name: 'Analytics', href: '/analytics', icon: TrendingUpIcon },
  
  // New SEMrush features
  { 
    name: 'Competitive Intelligence', 
    href: '/competitive', 
    icon: EyeIcon,
    badge: 'New',
    subItems: [
      { name: 'Competitor Analysis', href: '/competitive/analysis' },
      { name: 'Keyword Gaps', href: '/competitive/keyword-gaps' },
      { name: 'Market Share', href: '/competitive/market-share' }
    ]
  },
  { 
    name: 'Keyword Research', 
    href: '/keywords', 
    icon: MagnifyingGlassIcon,
    subItems: [
      { name: 'Opportunities', href: '/keywords/opportunities' },
      { name: 'Rank Tracking', href: '/keywords/tracking' },
      { name: 'SERP Features', href: '/keywords/serp-features' }
    ]
  },
  { 
    name: 'Traffic Intelligence', 
    href: '/traffic-intel', 
    icon: GlobeAltIcon,
    subItems: [
      { name: 'Competitive Traffic', href: '/traffic-intel/competitive' },
      { name: 'Audience Overlap', href: '/traffic-intel/audience' },
      { name: 'Traffic Sources', href: '/traffic-intel/sources' }
    ]
  }
];
```

### SEMrush Integration Status Component

```typescript
// apps/web/src/components/semrush/SEMrushIntegrationStatus.tsx
interface SEMrushIntegrationStatusProps {
  brandId: string;
}

export function SEMrushIntegrationStatus({ brandId }: SEMrushIntegrationStatusProps) {
  const [integration, setIntegration] = useState<SEMrushIntegration | null>(null);
  const [apiUnitsRemaining, setApiUnitsRemaining] = useState<number>(0);

  return (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">SEMrush Integration</h3>
          <p className="text-sm text-gray-500">
            {integration?.status === 'active' ? 'Connected' : 'Not Connected'}
          </p>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-semibold text-gray-900">
            {apiUnitsRemaining.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">API Units Remaining</div>
        </div>
      </div>
      
      {integration?.status === 'active' && (
        <div className="mt-4">
          <div className="flex items-center space-x-4 text-sm">
            <span className="flex items-center text-green-600">
              <CheckCircleIcon className="w-4 h-4 mr-1" />
              v3 Analytics API
            </span>
            <span className="flex items-center text-green-600">
              <CheckCircleIcon className="w-4 h-4 mr-1" />
              v4 Projects API
            </span>
            <span className="text-gray-500">
              Last sync: {formatDistanceToNow(new Date(integration.last_sync))} ago
            </span>
          </div>
        </div>
      )}
      
      {integration?.status !== 'active' && (
        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Connect SEMrush
        </button>
      )}
    </div>
  );
}
```

## Competitive Intelligence Dashboard

### Main Competitor Analysis Component
**Source**: [Analytics API Tutorial](https://developer.semrush.com/api/basics/api-tutorials/analytics-api/)

```typescript
// apps/web/src/components/competitive/CompetitorAnalysisDashboard.tsx
interface CompetitorData {
  domain: string;
  commonKeywords: number;
  organicKeywords: number;
  organicTraffic: number;
  organicCost: number;
  competitorRelevance: number;
  visibilityTrend: number[];
}

export function CompetitorAnalysisDashboard({ brandId, domain }: { brandId: string; domain: string }) {
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);

  const { data: competitorData } = useSWR(
    `/api/semrush/competitor-analysis/${brandId}/${domain}`,
    fetcher,
    { refreshInterval: 300000 } // 5 minutes
  );

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Competitors"
          value={competitors.length}
          icon={<UsersIcon className="w-6 h-6" />}
          trend="+12% vs last month"
          trendDirection="up"
        />
        
        <MetricCard
          title="Common Keywords"
          value={competitors.reduce((sum, c) => sum + c.commonKeywords, 0)}
          icon={<MagnifyingGlassIcon className="w-6 h-6" />}
          trend="+156 new this week"
          trendDirection="up"
        />
        
        <MetricCard
          title="Market Position"
          value="#3"
          icon={<TrophyIcon className="w-6 h-6" />}
          trend="Improved from #4"
          trendDirection="up"
        />
        
        <MetricCard
          title="Visibility Score"
          value="78.2"
          icon={<EyeIcon className="w-6 h-6" />}
          trend="+5.1 vs competitors avg"
          trendDirection="up"
        />
      </div>

      {/* Competitor Comparison Table */}
      <CompetitorComparisonTable
        competitors={competitors}
        onSelectCompetitor={setSelectedCompetitor}
        selectedCompetitor={selectedCompetitor}
      />

      {/* Detailed Analysis */}
      {selectedCompetitor && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <KeywordGapAnalysis
            domain={domain}
            competitor={selectedCompetitor}
          />
          
          <TrafficComparisonChart
            domain={domain}
            competitor={selectedCompetitor}
          />
        </div>
      )}
    </div>
  );
}
```

### Competitor Comparison Table

```typescript
// apps/web/src/components/competitive/CompetitorComparisonTable.tsx
interface CompetitorComparisonTableProps {
  competitors: CompetitorData[];
  onSelectCompetitor: (domain: string) => void;
  selectedCompetitor: string | null;
}

export function CompetitorComparisonTable({ 
  competitors, 
  onSelectCompetitor, 
  selectedCompetitor 
}: CompetitorComparisonTableProps) {
  const [sortField, setSortField] = useState<keyof CompetitorData>('organicTraffic');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedCompetitors = useMemo(() => {
    return [...competitors].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (sortDirection === 'desc') {
        return bVal > aVal ? 1 : -1;
      }
      return aVal > bVal ? 1 : -1;
    });
  }, [competitors, sortField, sortDirection]);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Top Competitors</h3>
        <p className="text-sm text-gray-500">
          Click on a competitor to view detailed analysis
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader 
                field="domain" 
                currentSort={sortField} 
                direction={sortDirection}
                onSort={setSortField}
                onDirectionChange={setSortDirection}
              >
                Domain
              </SortableHeader>
              
              <SortableHeader 
                field="organicKeywords" 
                currentSort={sortField} 
                direction={sortDirection}
                onSort={setSortField}
                onDirectionChange={setSortDirection}
              >
                Organic Keywords
              </SortableHeader>
              
              <SortableHeader 
                field="organicTraffic" 
                currentSort={sortField} 
                direction={sortDirection}
                onSort={setSortField}
                onDirectionChange={setSortDirection}
              >
                Est. Traffic
              </SortableHeader>
              
              <SortableHeader 
                field="commonKeywords" 
                currentSort={sortField} 
                direction={sortDirection}
                onSort={setSortField}
                onDirectionChange={setSortDirection}
              >
                Common Keywords
              </SortableHeader>
              
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Visibility Trend
              </th>
              
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedCompetitors.map((competitor) => (
              <tr 
                key={competitor.domain}
                className={`hover:bg-gray-50 cursor-pointer ${
                  selectedCompetitor === competitor.domain ? 'bg-blue-50' : ''
                }`}
                onClick={() => onSelectCompetitor(competitor.domain)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                      <GlobeAltIcon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {competitor.domain}
                      </div>
                      <div className="text-xs text-gray-500">
                        Relevance: {(competitor.competitorRelevance * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {competitor.organicKeywords.toLocaleString()}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatTrafficValue(competitor.organicTraffic)}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-900 mr-2">
                      {competitor.commonKeywords.toLocaleString()}
                    </span>
                    <div className="w-16 h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-blue-500 rounded-full"
                        style={{ 
                          width: `${Math.min(100, (competitor.commonKeywords / 1000) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <MiniVisibilityChart data={competitor.visibilityTrend} />
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900">
                    Analyze
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

## Keyword Research & Opportunity Interface

### Keyword Opportunities Dashboard

```typescript
// apps/web/src/components/keywords/KeywordOpportunitiesDashboard.tsx
interface KeywordOpportunity {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  currentPosition?: number;
  competitorPositions: { domain: string; position: number }[];
  opportunityScore: number;
  potentialTraffic: number;
  trend: 'up' | 'down' | 'stable';
}

export function KeywordOpportunitiesDashboard({ brandId, domain }: { brandId: string; domain: string }) {
  const [opportunities, setOpportunities] = useState<KeywordOpportunity[]>([]);
  const [filters, setFilters] = useState({
    minSearchVolume: 1000,
    maxDifficulty: 70,
    showOnlyHighOpportunity: false,
    competitorDomains: [] as string[]
  });

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(opp => {
      if (opp.searchVolume < filters.minSearchVolume) return false;
      if (opp.difficulty > filters.maxDifficulty) return false;
      if (filters.showOnlyHighOpportunity && opp.opportunityScore < 80) return false;
      return true;
    });
  }, [opportunities, filters]);

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <KeywordOpportunityFilters
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Opportunity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="High-Value Opportunities"
          value={opportunities.filter(o => o.opportunityScore >= 80).length}
          icon={<StarIcon className="w-6 h-6" />}
          trend="32 new this week"
          trendDirection="up"
        />
        
        <MetricCard
          title="Potential Monthly Traffic"
          value={formatTrafficValue(
            opportunities.reduce((sum, o) => sum + o.potentialTraffic, 0)
          )}
          icon={<TrendingUpIcon className="w-6 h-6" />}
          trend="+15% vs last month"
          trendDirection="up"
        />
        
        <MetricCard
          title="Avg. Keyword Difficulty"
          value={
            Math.round(
              opportunities.reduce((sum, o) => sum + o.difficulty, 0) / opportunities.length
            )
          }
          icon={<ShieldCheckIcon className="w-6 h-6" />}
          trend="Moderate competition"
          trendDirection="neutral"
        />
        
        <MetricCard
          title="Est. Monthly Ad Spend"
          value={formatCurrency(
            opportunities.reduce((sum, o) => sum + (o.cpc * o.potentialTraffic), 0)
          )}
          icon={<CurrencyDollarIcon className="w-6 h-6" />}
          trend="If using PPC"
          trendDirection="neutral"
        />
      </div>

      {/* Opportunity List */}
      <KeywordOpportunityTable
        opportunities={filteredOpportunities}
        onExportOpportunities={() => handleExportOpportunities(filteredOpportunities)}
      />

      {/* Opportunity Details Modal */}
      <KeywordOpportunityModal
        opportunity={selectedOpportunity}
        isOpen={!!selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
      />
    </div>
  );
}
```

### Keyword Gap Analysis Component

```typescript
// apps/web/src/components/competitive/KeywordGapAnalysis.tsx
interface KeywordGap {
  keyword: string;
  myPosition?: number;
  competitorPosition: number;
  searchVolume: number;
  difficulty: number;
  gap: 'missing' | 'lower_position' | 'opportunity';
}

export function KeywordGapAnalysis({ domain, competitor }: { domain: string; competitor: string }) {
  const [keywordGaps, setKeywordGaps] = useState<KeywordGap[]>([]);
  const [analysisType, setAnalysisType] = useState<'missing' | 'lower_position' | 'all'>('missing');

  const { data: gapData, isLoading } = useSWR(
    `/api/semrush/keyword-gaps/${domain}/${competitor}`,
    fetcher
  );

  const filteredGaps = useMemo(() => {
    if (analysisType === 'all') return keywordGaps;
    return keywordGaps.filter(gap => gap.gap === analysisType);
  }, [keywordGaps, analysisType]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Keyword Gap Analysis</h3>
          <p className="text-sm text-gray-500">
            {domain} vs {competitor}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setAnalysisType('missing')}
            className={`px-3 py-1 rounded text-sm ${
              analysisType === 'missing' 
                ? 'bg-red-100 text-red-800' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Missing ({keywordGaps.filter(g => g.gap === 'missing').length})
          </button>
          
          <button
            onClick={() => setAnalysisType('lower_position')}
            className={`px-3 py-1 rounded text-sm ${
              analysisType === 'lower_position' 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Lower Position ({keywordGaps.filter(g => g.gap === 'lower_position').length})
          </button>
          
          <button
            onClick={() => setAnalysisType('all')}
            className={`px-3 py-1 rounded text-sm ${
              analysisType === 'all' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            All ({keywordGaps.length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGaps.slice(0, 20).map((gap) => (
            <div key={gap.keyword} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-gray-900">{gap.keyword}</span>
                  
                  <GapTypeIndicator gap={gap.gap} />
                  
                  <span className="text-sm text-gray-500">
                    Vol: {gap.searchVolume.toLocaleString()}
                  </span>
                  
                  <DifficultyBadge difficulty={gap.difficulty} />
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm">
                <div className="text-center">
                  <div className="text-gray-500">Your Position</div>
                  <div className={gap.myPosition ? 'text-gray-900' : 'text-red-500'}>
                    {gap.myPosition ? `#${gap.myPosition}` : 'Not Ranking'}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-gray-500">Competitor</div>
                  <div className="text-green-600">#{gap.competitorPosition}</div>
                </div>
                
                <button className="text-blue-600 hover:text-blue-800">
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Traffic Intelligence & Market Share

### Traffic Comparison Dashboard
**Source**: [Trends API Tutorial](https://developer.semrush.com/api/basics/api-tutorials/trends-api/)

```typescript
// apps/web/src/components/traffic/TrafficIntelligenceDashboard.tsx
interface TrafficComparison {
  domain: string;
  trafficData: {
    visits: number;
    uniqueVisitors: number;
    bounceRate: number;
    avgVisitDuration: number;
    pagesPerVisit: number;
  };
  trafficSources: {
    direct: number;
    referral: number;
    search: number;
    social: number;
    mail: number;
    display: number;
  };
  audienceOverlap: {
    domain: string;
    overlapPercentage: number;
  }[];
}

export function TrafficIntelligenceDashboard({ brandId, domain }: { brandId: string; domain: string }) {
  const [trafficComparisons, setTrafficComparisons] = useState<TrafficComparison[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'visits' | 'uniqueVisitors' | 'bounceRate'>('visits');
  const [dateRange, setDateRange] = useState('12m');

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Traffic Intelligence</h2>
        
        <div className="flex items-center space-x-4">
          <select 
            value={selectedMetric} 
            onChange={(e) => setSelectedMetric(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="visits">Total Visits</option>
            <option value="uniqueVisitors">Unique Visitors</option>
            <option value="bounceRate">Bounce Rate</option>
          </select>
          
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            options={['1m', '3m', '6m', '12m']}
          />
        </div>
      </div>

      {/* Market Share Overview */}
      <MarketShareChart
        data={trafficComparisons}
        metric={selectedMetric}
        domain={domain}
      />

      {/* Traffic Sources Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrafficSourcesChart
          data={trafficComparisons.find(tc => tc.domain === domain)?.trafficSources}
          title={`${domain} Traffic Sources`}
        />
        
        <CompetitorTrafficSources
          competitors={trafficComparisons.filter(tc => tc.domain !== domain).slice(0, 3)}
        />
      </div>

      {/* Audience Overlap Analysis */}
      <AudienceOverlapMatrix
        domain={domain}
        competitors={trafficComparisons.filter(tc => tc.domain !== domain)}
      />
    </div>
  );
}
```

### Market Share Visualization

```typescript
// apps/web/src/components/traffic/MarketShareChart.tsx
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MarketShareChartProps {
  data: TrafficComparison[];
  metric: 'visits' | 'uniqueVisitors' | 'bounceRate';
  domain: string;
}

export function MarketShareChart({ data, metric, domain }: MarketShareChartProps) {
  const chartData = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.trafficData[metric], 0);
    
    return data.map(item => ({
      domain: item.domain,
      value: item.trafficData[metric],
      percentage: (item.trafficData[metric] / total) * 100,
      isYourDomain: item.domain === domain
    })).sort((a, b) => b.value - a.value);
  }, [data, metric, domain]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          Market Share by {metric.replace(/([A-Z])/g, ' $1').toLowerCase()}
        </h3>
        
        <div className="text-sm text-gray-500">
          Total Market Size: {formatTrafficValue(
            chartData.reduce((sum, item) => sum + item.value, 0)
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ domain, percentage }) => `${domain}: ${percentage.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isYourDomain ? '#10B981' : COLORS[index % COLORS.length]}
                    stroke={entry.isYourDomain ? '#065F46' : 'none'}
                    strokeWidth={entry.isYourDomain ? 2 : 0}
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => [formatTrafficValue(value), 'Traffic']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="domain" 
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis tickFormatter={formatTrafficValue} />
              <Tooltip 
                formatter={(value: any) => [formatTrafficValue(value), 'Traffic']}
              />
              <Bar dataKey="value" fill="#3B82F6">
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`bar-cell-${index}`}
                    fill={entry.isYourDomain ? '#10B981' : '#3B82F6'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Market Position Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              #{chartData.findIndex(item => item.isYourDomain) + 1}
            </div>
            <div className="text-sm text-gray-500">Market Position</div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-green-600">
              {chartData.find(item => item.isYourDomain)?.percentage.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Market Share</div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {formatTrafficValue(chartData.find(item => item.isYourDomain)?.value || 0)}
            </div>
            <div className="text-sm text-gray-500">Monthly {metric}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Local SEO Features (Map Rank Tracker Integration)
**Source**: [Map Rank Tracker API v4](https://developer.semrush.com/api/v4/map-rank-tracker-2/v002/)

### Local Ranking Heatmap Component

```typescript
// apps/web/src/components/local/LocalRankingHeatmap.tsx
interface LocalRankingData {
  keyword: string;
  businessName: string;
  gridPoints: {
    latitude: number;
    longitude: number;
    position: number;
    isVisible: boolean;
  }[];
  averagePosition: number;
  shareOfVoice: number;
}

export function LocalRankingHeatmap({ campaignId, keyword }: { campaignId: string; keyword: string }) {
  const [heatmapData, setHeatmapData] = useState<LocalRankingData | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.7749, -122.4194]); // Default to SF

  const { data: rankingData, isLoading } = useSWR(
    `/api/semrush/map-rank-tracker/${campaignId}/heatmap/${keyword}`,
    fetcher
  );

  const getPositionColor = (position: number) => {
    if (position <= 3) return '#10B981'; // Green for top 3
    if (position <= 10) return '#F59E0B'; // Yellow for first page
    if (position <= 20) return '#EF4444'; // Red for second page
    return '#6B7280'; // Gray for lower positions
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Local Rankings: "{keyword}"
            </h3>
            <p className="text-sm text-gray-500">
              {heatmapData?.businessName} • {heatmapData?.gridPoints.length} locations tracked
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {heatmapData?.averagePosition.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">Avg Position</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {heatmapData?.shareOfVoice.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">Share of Voice</div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative h-96">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <MapContainer
            center={mapCenter}
            zoom={11}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {heatmapData?.gridPoints.map((point, index) => (
              <CircleMarker
                key={index}
                center={[point.latitude, point.longitude]}
                radius={8}
                fillColor={getPositionColor(point.position)}
                color="#fff"
                weight={2}
                opacity={1}
                fillOpacity={0.8}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-medium">Position: #{point.position}</div>
                    <div>Lat: {point.latitude.toFixed(4)}</div>
                    <div>Lng: {point.longitude.toFixed(4)}</div>
                    <div>Visible: {point.isVisible ? 'Yes' : 'No'}</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        )}
      </div>

      {/* Legend */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-900">Position Legend:</div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-green-500" />
              <span className="text-sm text-gray-600">Positions 1-3</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500" />
              <span className="text-sm text-gray-600">Positions 4-10</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-red-500" />
              <span className="text-sm text-gray-600">Positions 11-20</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-gray-500" />
              <span className="text-sm text-gray-600">Position 20+</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Data Export & Reporting Features

### Advanced Export Component

```typescript
// apps/web/src/components/export/SEMrushDataExport.tsx
interface ExportOptions {
  dataType: 'competitors' | 'keywords' | 'traffic' | 'local_rankings';
  format: 'csv' | 'xlsx' | 'pdf';
  dateRange: { start: Date; end: Date };
  includeCharts: boolean;
  includeBranding: boolean;
}

export function SEMrushDataExport({ brandId, domain }: { brandId: string; domain: string }) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    dataType: 'competitors',
    format: 'csv',
    dateRange: { start: subMonths(new Date(), 1), end: new Date() },
    includeCharts: false,
    includeBranding: true
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const response = await fetch('/api/export/semrush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          domain,
          ...exportOptions
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `semrush-export-${domain}-${format(new Date(), 'yyyy-MM-dd')}.${exportOptions.format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
      // Show error toast
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Export SEMrush Data</h3>
          <p className="text-sm text-gray-500">
            Generate detailed reports and export data for further analysis
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Data Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data Type
          </label>
          <select
            value={exportOptions.dataType}
            onChange={(e) => setExportOptions(prev => ({ 
              ...prev, 
              dataType: e.target.value as ExportOptions['dataType'] 
            }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="competitors">Competitor Analysis</option>
            <option value="keywords">Keyword Research</option>
            <option value="traffic">Traffic Intelligence</option>
            <option value="local_rankings">Local Rankings</option>
          </select>
        </div>

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Format
          </label>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: 'csv', label: 'CSV', description: 'Raw data, perfect for Excel' },
              { value: 'xlsx', label: 'Excel', description: 'Formatted spreadsheet' },
              { value: 'pdf', label: 'PDF', description: 'Professional report' }
            ].map(format => (
              <label key={format.value} className="relative">
                <input
                  type="radio"
                  name="format"
                  value={format.value}
                  checked={exportOptions.format === format.value}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    format: e.target.value as ExportOptions['format']
                  }))}
                  className="sr-only"
                />
                <div className={`border-2 rounded-lg p-4 cursor-pointer ${
                  exportOptions.format === format.value 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div className="font-medium">{format.label}</div>
                  <div className="text-sm text-gray-500">{format.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Range
          </label>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="date"
              value={format(exportOptions.dateRange.start, 'yyyy-MM-dd')}
              onChange={(e) => setExportOptions(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, start: new Date(e.target.value) }
              }))}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
            <input
              type="date"
              value={format(exportOptions.dateRange.end, 'yyyy-MM-dd')}
              onChange={(e) => setExportOptions(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, end: new Date(e.target.value) }
              }))}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>

        {/* Additional Options */}
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={exportOptions.includeCharts}
              onChange={(e) => setExportOptions(prev => ({ 
                ...prev, 
                includeCharts: e.target.checked 
              }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Include charts and visualizations (PDF only)
            </span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={exportOptions.includeBranding}
              onChange={(e) => setExportOptions(prev => ({ 
                ...prev, 
                includeBranding: e.target.checked 
              }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Include company branding
            </span>
          </label>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Exporting...
            </>
          ) : (
            <>
              <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
              Export Data
            </>
          )}
        </button>
      </div>
    </div>
  );
}
```

## Integration with AI Assistant (MCP Server)

### SEMrush Data Context for Chatbot

```typescript
// apps/web/src/components/chat/SEMrushChatIntegration.tsx
interface SEMrushChatContext {
  currentDomain: string;
  availableData: {
    competitors: string[];
    keywords: number;
    lastSyncDate: Date;
  };
  quickQueries: {
    label: string;
    query: string;
    icon: JSX.Element;
  }[];
}

export function SEMrushChatIntegration({ brandId, domain }: { brandId: string; domain: string }) {
  const [context, setContext] = useState<SEMrushChatContext | null>(null);
  const { sendMessage } = useChatContext();

  const quickQueries = [
    {
      label: "Top Competitor Analysis",
      query: `Analyze my top 3 competitors for ${domain} and identify key opportunities`,
      icon: <UsersIcon className="w-4 h-4" />
    },
    {
      label: "Keyword Gaps",
      query: `What keywords are my competitors ranking for that I'm missing?`,
      icon: <MagnifyingGlassIcon className="w-4 h-4" />
    },
    {
      label: "Traffic Opportunities", 
      query: `Show me the biggest traffic growth opportunities based on SEMrush data`,
      icon: <TrendingUpIcon className="w-4 h-4" />
    },
    {
      label: "Local SEO Insights",
      query: `How is my local search performance compared to competitors?`,
      icon: <MapPinIcon className="w-4 h-4" />
    }
  ];

  return (
    <div className="space-y-4">
      {/* SEMrush Data Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <ChartBarIcon className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-blue-900">SEMrush Data Available</span>
        </div>
        <div className="mt-2 text-sm text-blue-700">
          {context?.availableData.keywords.toLocaleString()} keywords • {' '}
          {context?.availableData.competitors.length} competitors tracked • {' '}
          Last updated {formatDistanceToNow(context?.lastSyncDate || new Date())} ago
        </div>
      </div>

      {/* Quick Query Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {quickQueries.map((query) => (
          <button
            key={query.label}
            onClick={() => sendMessage(query.query)}
            className="flex items-center space-x-2 p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            {query.icon}
            <span className="text-sm font-medium text-gray-700">{query.label}</span>
          </button>
        ))}
      </div>

      {/* Data Context Information */}
      <div className="text-xs text-gray-500">
        💡 Ask me anything about your competitive landscape, keyword opportunities, or traffic insights. 
        I have access to your latest SEMrush data for detailed analysis.
      </div>
    </div>
  );
}
```

## Performance Optimization & Caching

### Data Loading Strategy

```typescript
// apps/web/src/hooks/useSEMrushData.ts
interface SEMrushDataOptions {
  cacheTime?: number;
  staleTime?: number;
  refetchInterval?: number;
}

export function useSEMrushData<T>(
  endpoint: string,
  options: SEMrushDataOptions = {}
) {
  const {
    cacheTime = 300000, // 5 minutes
    staleTime = 60000,   // 1 minute
    refetchInterval = 900000 // 15 minutes
  } = options;

  return useSWR<T>(
    endpoint,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch SEMrush data');
      }
      return response.json();
    },
    {
      refreshInterval: refetchInterval,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: staleTime,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      onError: (error) => {
        console.error('SEMrush data fetch error:', error);
        // Send to monitoring service
      }
    }
  );
}

// Usage examples
export function useCompetitorAnalysis(brandId: string, domain: string) {
  return useSEMrushData<CompetitorAnalysis>(
    `/api/semrush/competitor-analysis/${brandId}/${domain}`,
    { refetchInterval: 3600000 } // 1 hour
  );
}

export function useKeywordOpportunities(brandId: string, domain: string) {
  return useSEMrushData<KeywordOpportunity[]>(
    `/api/semrush/keyword-opportunities/${brandId}/${domain}`,
    { refetchInterval: 1800000 } // 30 minutes
  );
}
```

## Responsive Design & Mobile Optimization

### Mobile-First Component Adaptations

```typescript
// apps/web/src/components/competitive/MobileCompetitorCard.tsx
export function MobileCompetitorCard({ competitor }: { competitor: CompetitorData }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <GlobeAltIcon className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900 text-sm">
              {competitor.domain}
            </div>
            <div className="text-xs text-gray-500">
              {competitor.organicKeywords.toLocaleString()} keywords
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-400 hover:text-gray-600"
        >
          <ChevronDownIcon 
            className={`w-5 h-5 transform transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Est. Traffic</div>
              <div className="font-medium">{formatTrafficValue(competitor.organicTraffic)}</div>
            </div>
            
            <div>
              <div className="text-gray-500">Common Keywords</div>
              <div className="font-medium">{competitor.commonKeywords.toLocaleString()}</div>
            </div>
            
            <div className="col-span-2">
              <div className="text-gray-500 mb-2">Visibility Trend</div>
              <MiniTrendChart data={competitor.visibilityTrend} />
            </div>
          </div>
          
          <div className="mt-4 flex space-x-3">
            <button className="flex-1 bg-blue-600 text-white py-2 rounded text-sm">
              View Details
            </button>
            <button className="flex-1 border border-gray-300 text-gray-700 py-2 rounded text-sm">
              Compare
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

## Implementation Timeline

### Development Phases

#### Phase 1: Core Components (Weeks 1-2)
- [ ] **SEMrush Integration Status Component**
  - Connection status display
  - API units monitoring
  - Integration health checks

- [ ] **Basic Competitor Analysis Dashboard**
  - Competitor comparison table
  - Basic filtering and sorting
  - Domain ranking visualization

#### Phase 2: Advanced Analytics (Weeks 3-4)  
- [ ] **Keyword Research Interface**
  - Opportunity identification
  - Keyword gap analysis
  - Search volume and difficulty metrics

- [ ] **Traffic Intelligence Dashboard**
  - Market share visualization
  - Traffic sources comparison
  - Audience overlap analysis

#### Phase 3: Specialized Features (Weeks 5-6)
- [ ] **Local SEO Components**
  - Map-based ranking heatmaps
  - Local competitor tracking
  - Geographic performance analysis

- [ ] **Data Export & Reporting**
  - Multi-format export options
  - Scheduled report generation
  - Custom report builder

#### Phase 4: Integration & Polish (Weeks 7-8)
- [ ] **AI Assistant Integration**
  - SEMrush data context for chatbot
  - Quick query suggestions
  - Intelligent insights generation

- [ ] **Mobile Optimization**
  - Responsive component adaptations
  - Touch-friendly interactions
  - Progressive disclosure patterns

## Success Metrics & KPIs

### User Experience Metrics
- **Feature Adoption Rate**: % of users who access SEMrush features within 30 days
- **Session Duration**: Time spent in competitive intelligence sections
- **Data Export Usage**: Frequency of report generation and downloads
- **Mobile Usage**: % of SEMrush feature usage on mobile devices

### Technical Performance
- **Component Load Time**: < 2 seconds for initial dashboard load
- **Chart Rendering**: < 500ms for data visualization updates
- **Cache Hit Rate**: > 85% for frequently accessed data
- **API Response Integration**: < 200ms for cached SEMrush data

### Business Impact
- **Competitive Insights Usage**: % of users who take action on competitor analysis
- **Keyword Opportunity Conversion**: Keywords added to tracking from opportunities
- **Market Share Awareness**: User engagement with market position data
- **Export-to-Action Ratio**: Reports downloaded that lead to strategy changes

---

This comprehensive dashboard features guide provides the foundation for building a competitive SEMrush-powered analytics interface that differentiates Slingshot in the market while maintaining excellent user experience and performance.

**References**:
- [SEMrush Analytics API Tutorial](https://developer.semrush.com/api/basics/api-tutorials/analytics-api/)
- [SEMrush Trends API Tutorial](https://developer.semrush.com/api/basics/api-tutorials/trends-api/)  
- [SEMrush Map Rank Tracker API](https://developer.semrush.com/api/v4/map-rank-tracker-2/v002/)
- [SEMrush Projects API Tutorial](https://developer.semrush.com/api/basics/api-tutorials/projects-api/)