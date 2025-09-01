# Backend Architecture

## System Overview

### Core Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with security middleware
- **Database**: Supabase (PostgreSQL) with RLS
- **Authentication**: Supabase JWT validation
- **APIs**: Google Analytics 4, Google Search Console

### Application Structure
```
apps/server/src/
├── env.ts              # Environment variable loading
├── index.ts            # Application entry point
├── routes/
│   ├── auth/
│   │   └── tokens.ts   # OAuth token management
│   ├── analytics/
│   │   └── google.ts   # GA4 & GSC proxy endpoints
│   └── brands.ts       # Brand management (scaffold)
└── services/
    └── supabase.ts     # Database client configuration
```

## Services Architecture

### Authentication Service
**File**: `routes/auth/tokens.ts`
- **Token Storage**: Secure OAuth token persistence in `user_tokens` table
- **JWT Validation**: Supabase session verification middleware
- **Token Retrieval**: On-demand Google token access for API calls
- **Security**: RLS-enforced per-user token isolation

### Analytics Proxy Service
**File**: `routes/analytics/google.ts`
- **GA4 Integration**: Property listing, reports, realtime data, top pages
- **GSC Integration**: Site listing, search analytics, top queries/pages
- **Token Management**: Dynamic Google client creation with user tokens
- **Error Handling**: Comprehensive API error transformation and logging

### Database Service
**File**: `services/supabase.ts`
- **Client Configuration**: Shared Supabase client with service role key
- **Type Safety**: Generated TypeScript types from database schema
- **Connection Pooling**: Automatic connection management
- **Migration Support**: SQL schema evolution tracking

## Middleware Stack

### Security Middleware (Applied Globally)
- **Helmet**: HTTP security headers (XSS, CSRF, CSP)
- **CORS**: Restricted to `CLIENT_URL` origin
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Sanitization**: Request body parsing limits

### Authentication Middleware (Auth Routes)
- **JWT Validation**: `validateSupabaseAuth` for protected endpoints
- **User Context**: Attach authenticated user to request object
- **Error Handling**: Consistent 401/403 response format

### Logging Middleware (Development)
- **Request Logging**: Method, URL, response time
- **Error Logging**: Stack traces and error context
- **Debug Output**: OAuth token capture and API response logging

## Data Flow Architecture

### Authentication Flow
1. **Frontend** → Supabase OAuth → Google consent
2. **AuthCallback** → Extract `session.provider_token`
3. **POST /auth/google-tokens** → Store encrypted tokens
4. **Database** → `user_tokens` table with RLS policies

### Analytics Data Flow
1. **Frontend** → GET `/auth/google-tokens`
2. **Backend** → Retrieve user tokens from database
3. **Frontend** → Analytics request with Google token
4. **Backend** → Create Google API client, fetch data
5. **Response** → Normalized JSON response

### Error Flow
1. **API Error** → Catch and transform to standard format
2. **Logging** → Record error details and context  
3. **Response** → Return `{ success: false, error: message }`
4. **Frontend** → Display user-friendly error message

## Performance Considerations

### Current Optimizations
- **Connection Pooling**: Supabase client reuse
- **Request Validation**: Early rejection of invalid requests
- **Response Compression**: Gzip middleware for large JSON responses
- **Caching Headers**: Appropriate cache-control for static data

### Planned Optimizations (See roadmap)
- **Redis Caching**: Expensive API response caching
- **Background Jobs**: Async data processing with BullMQ
- **Connection Pooling**: Database connection optimization
- **CDN Integration**: Asset delivery acceleration

## Security Architecture

### Token Security
- **Encryption at Rest**: Database-level encryption for `user_tokens`
- **JWT Validation**: All protected routes verify Supabase tokens
- **Token Scope**: Limited to GA4 + GSC read-only permissions
- **Refresh Handling**: Automatic token refresh on expiration

### API Security
- **Rate Limiting**: Per-IP request throttling
- **Input Validation**: Schema validation on all endpoints
- **CORS Configuration**: Strict origin enforcement
- **Error Sanitization**: No internal details in public responses

### Database Security
- **RLS Policies**: Row-level security on all tables
- **Service Role**: Limited database access scope
- **Connection Security**: TLS-encrypted database connections
- **Migration Safety**: Reversible schema changes only

## Monitoring & Observability

### Health Checks
- **Endpoint**: `GET /health` returns system status
- **Database**: Connection health verification
- **External APIs**: Google API availability check
- **Metrics**: Response time and error rate tracking

### Error Tracking
- **Structured Logging**: JSON-formatted error logs
- **Error Aggregation**: Planned Sentry integration
- **Alert Thresholds**: API failure rate monitoring
- **Debug Information**: Request correlation IDs

### Performance Monitoring
- **Response Times**: API endpoint performance tracking
- **Database Queries**: Query execution time analysis
- **Memory Usage**: Node.js heap monitoring
- **Third-party APIs**: Google API quota and latency tracking

## Scalability Design

### Horizontal Scaling
- **Stateless Architecture**: No server-side session storage
- **Database Separation**: Shared database with connection pooling
- **Load Balancer Ready**: No server-specific dependencies
- **Container Deployment**: Docker-ready for cloud deployment

### Vertical Scaling
- **Memory Optimization**: Efficient object lifecycle management
- **CPU Optimization**: Async/await for I/O-bound operations
- **Cache Strategy**: Planned multi-layer caching implementation
- **Database Optimization**: Query performance and indexing