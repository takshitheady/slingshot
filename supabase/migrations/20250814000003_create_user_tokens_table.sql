-- Create user_tokens table for storing OAuth provider tokens
CREATE TABLE IF NOT EXISTS public.user_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Ensure one token per user per provider
    UNIQUE(user_id, provider)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON public.user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tokens_provider ON public.user_tokens(provider);
CREATE INDEX IF NOT EXISTS idx_user_tokens_expires_at ON public.user_tokens(expires_at);

-- Enable RLS
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only access their own tokens
CREATE POLICY "Users can view their own tokens" ON public.user_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens" ON public.user_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens" ON public.user_tokens
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens" ON public.user_tokens
    FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_tokens_updated_at 
    BEFORE UPDATE ON public.user_tokens 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();