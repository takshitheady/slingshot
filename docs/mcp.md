# MCP (Model Context Protocol)

Planned AI assistant integration following `instructions.md` Phase 4. No MCP code is active yet; `/api/chat` returns a placeholder response.

## Goals
- Provide tools to query analytics data (GA4/GSC) and generate insights
- Enable streaming responses in the Chat UI

## Server structure (planned)
- `packages/mcp-server/`
  - `src/index.ts` sets up MCP server
  - Tools:
    - `query_analytics` (accepts `brandId`, `metrics[]`, `dateRange`)
    - `get_seo_insights` (accepts `brandId`, `queryType`)

Example sketch from `instructions.md`:
```ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
const server = new Server({ name: 'slingshot-mcp', version: '1.0.0' })
// register tools ...
```

## Frontend integration
- Wire `pages/Chat.tsx` to call backend streaming endpoints once available
- Maintain `chat_sessions`/`chat_messages` in Supabase for history (schema exists)

## Next steps
- Scaffold `packages/mcp-server` with MCP SDK
- Implement tool handlers that read from Supabase and/or call Google APIs via server
- Create `/api/chat` endpoints to interact with MCP server