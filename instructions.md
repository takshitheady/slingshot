# Meta Prompt for Claude Code - Slingshot Project

## Project Context
You are building "Slingshot", a comprehensive web analytics platform that integrates Google Analytics and Google Search Console data, provides intelligent dashboards, and offers an AI-powered assistant for data insights and recommendations.

## Core Requirements

### Tech Stack (Non-negotiable)
- **Frontend**: React with TypeScript
- **Backend**: Node.js with Express
- **Database & Auth**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (for CSV exports, screenshots)
- **AI Integration**: Model Context Protocol (MCP) for LLM connections
- **Package Manager**: pnpm
- **Monorepo**: Turborepo

### Project Structure
Create a monorepo with the following structure:
```
slingshot/
├── apps/
│   ├── web/ (Vite + React + TypeScript)
│   └── server/ (Node.js + Express + TypeScript)
├── packages/
│   ├── database/ (Supabase client & schemas)
│   ├── shared/ (Shared types & utilities)
│   └── mcp-server/ (Model Context Protocol server)
├── supabase/
│   ├── migrations/
│   └── functions/
└── docker-compose.yml (for local development)
```

## Implementation Instructions

### Phase 1: Foundation Setup
1. Initialize monorepo with Turborepo
2. Set up Supabase project with the following schema:

```sql
-- Brands table
CREATE TABLE brands (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Google integrations
CREATE TABLE google_integrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  integration_type TEXT CHECK (integration_type IN ('GA4', 'GSC')),
  property_id TEXT,
  credentials JSONB, -- encrypted
  refresh_token TEXT, -- encrypted
  status TEXT DEFAULT 'pending',
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics data storage
CREATE TABLE analytics_snapshots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  source TEXT CHECK (source IN ('GA4', 'GSC')),
  metric_type TEXT NOT NULL,
  data JSONB NOT NULL,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat sessions
CREATE TABLE chat_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dashboard configurations
CREATE TABLE dashboard_configs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  config JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_configs ENABLE ROW LEVEL SECURITY;
```

3. Create the web app with Vite:
   - Set up routing with React Router v6
   - Implement Supabase Auth with protected routes
   - Create base layout with navigation

4. Create the Express server:
   - Set up middleware (cors, helmet, rate limiting)
   - Create API routes structure
   - Implement Supabase service role client

### Phase 2: Google Integration
1. Implement OAuth 2.0 flow for Google services
2. Create service for GA4 Data API integration
3. Create service for Google Search Console API
4. Build background job system using BullMQ for data synchronization
5. Store encrypted credentials in Supabase

### Phase 3: Dashboard Implementation
1. Use Recharts for visualizations
2. Implement dashboard grid system with react-grid-layout
3. Create widget components for different metric types
4. Add date range picker and filters
5. Implement CSV export using Supabase Storage

### Phase 4: MCP Integration for AI Assistant
1. Set up MCP server in packages/mcp-server
2. Create tools for:
   - Querying analytics data
   - Generating insights
   - Creating recommendations
3. Implement chat interface with streaming responses
4. Connect to Claude API through MCP

### Phase 5: Features & Polish
1. Add real-time updates using Supabase Realtime
2. Implement caching strategy with Redis
3. Add error boundary and logging (Sentry)
4. Create onboarding flow
5. Add multi-brand support

## Environment Variables Structure
```env
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# MCP/AI
MCP_SERVER_PORT=3001
ANTHROPIC_API_KEY=

# Server
SERVER_PORT=3000
SESSION_SECRET=

# Redis
REDIS_URL=
```

## Key Implementation Details

### Authentication Flow
1. Use Supabase Auth with email/password and Google OAuth
2. Implement RLS policies for multi-tenancy
3. Use JWT tokens for API authentication

### Data Synchronization
- Implement daily sync jobs for GA4 and GSC data
- Store raw data in JSONB format for flexibility
- Create materialized views for common queries

### MCP Server Configuration
```typescript
// mcp-server/src/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'slingshot-mcp',
  version: '1.0.0',
});

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'query_analytics',
      description: 'Query Google Analytics data',
      inputSchema: {
        type: 'object',
        properties: {
          brandId: { type: 'string' },
          metrics: { type: 'array', items: { type: 'string' } },
          dateRange: { type: 'object' }
        }
      }
    },
    {
      name: 'get_seo_insights',
      description: 'Get SEO insights from Search Console',
      inputSchema: {
        type: 'object',
        properties: {
          brandId: { type: 'string' },
          queryType: { type: 'string' }
        }
      }
    }
  ]
}));
```

### Frontend Components Structure
```
components/
├── auth/
│   ├── LoginForm.tsx
│   └── ProtectedRoute.tsx
├── brand/
│   ├── BrandIntakeForm.tsx
│   └── BrandSelector.tsx
├── dashboard/
│   ├── DashboardGrid.tsx
│   ├── widgets/
│   │   ├── MetricCard.tsx
│   │   ├── LineChart.tsx
│   │   ├── BarChart.tsx
│   │   └── DataTable.tsx
│   └── filters/
│       ├── DateRangePicker.tsx
│       └── MetricSelector.tsx
├── chat/
│   ├── ChatInterface.tsx
│   ├── MessageList.tsx
│   └── MessageInput.tsx
└── common/
    ├── Layout.tsx
    ├── Navigation.tsx
    └── LoadingSpinner.tsx
```

## Testing Strategy
1. Unit tests with Vitest
2. Integration tests for API endpoints
3. E2E tests with Playwright
4. Component tests with React Testing Library

## Deployment
1. Use Vercel for frontend
2. Use Railway or Fly.io for backend
3. Supabase cloud for database
4. Redis Cloud for caching

## Performance Requirements
- Dashboard load time < 2s
- API response time < 500ms for cached data
- Real-time chat responses with streaming
- Support for 1000+ concurrent users

## Security Requirements
- Encrypt all sensitive data (credentials, tokens)
- Implement rate limiting on all API endpoints
- Use CSP headers
- Regular security audits
- GDPR compliance for data handling

## Start Building
Begin with Phase 1, creating the monorepo structure and setting up the basic authentication flow. Each component should be built incrementally with proper error handling and logging from the start.