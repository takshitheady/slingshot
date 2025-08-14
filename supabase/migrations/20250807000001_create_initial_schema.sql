-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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