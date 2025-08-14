-- Add comprehensive RLS policies for all public tables
-- This migration fixes the critical issue where users can't access any data
-- even after authentication due to missing RLS policies

-- 1. BRANDS table policies
-- Allow users to see brands they created
CREATE POLICY "Users can view their own brands" ON brands
  FOR SELECT USING (auth.uid() = created_by);

-- Allow users to create new brands  
CREATE POLICY "Users can create brands" ON brands
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Allow users to update their own brands
CREATE POLICY "Users can update their own brands" ON brands
  FOR UPDATE USING (auth.uid() = created_by);

-- Allow users to delete their own brands
CREATE POLICY "Users can delete their own brands" ON brands
  FOR DELETE USING (auth.uid() = created_by);

-- 2. GOOGLE_INTEGRATIONS table policies  
-- Allow users to access integrations for brands they own
CREATE POLICY "Users can view integrations for their brands" ON google_integrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM brands 
      WHERE brands.id = google_integrations.brand_id 
      AND brands.created_by = auth.uid()
    )
  );

-- Allow users to create integrations for their brands
CREATE POLICY "Users can create integrations for their brands" ON google_integrations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM brands 
      WHERE brands.id = google_integrations.brand_id 
      AND brands.created_by = auth.uid()
    )
  );

-- Allow users to update integrations for their brands
CREATE POLICY "Users can update integrations for their brands" ON google_integrations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM brands 
      WHERE brands.id = google_integrations.brand_id 
      AND brands.created_by = auth.uid()
    )
  );

-- Allow users to delete integrations for their brands  
CREATE POLICY "Users can delete integrations for their brands" ON google_integrations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM brands 
      WHERE brands.id = google_integrations.brand_id 
      AND brands.created_by = auth.uid()
    )
  );

-- 3. ANALYTICS_SNAPSHOTS table policies
-- Allow users to view analytics for brands they own
CREATE POLICY "Users can view analytics for their brands" ON analytics_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM brands 
      WHERE brands.id = analytics_snapshots.brand_id 
      AND brands.created_by = auth.uid()
    )
  );

-- Allow users to create analytics for their brands
CREATE POLICY "Users can create analytics for their brands" ON analytics_snapshots
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM brands 
      WHERE brands.id = analytics_snapshots.brand_id 
      AND brands.created_by = auth.uid()
    )
  );

-- Allow users to update analytics for their brands
CREATE POLICY "Users can update analytics for their brands" ON analytics_snapshots
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM brands 
      WHERE brands.id = analytics_snapshots.brand_id 
      AND brands.created_by = auth.uid()
    )
  );

-- Allow users to delete analytics for their brands
CREATE POLICY "Users can delete analytics for their brands" ON analytics_snapshots
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM brands 
      WHERE brands.id = analytics_snapshots.brand_id 
      AND brands.created_by = auth.uid()
    )
  );

-- 4. CHAT_SESSIONS table policies
-- Allow users to view their own chat sessions
CREATE POLICY "Users can view their own chat sessions" ON chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to create their own chat sessions
CREATE POLICY "Users can create their own chat sessions" ON chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own chat sessions
CREATE POLICY "Users can update their own chat sessions" ON chat_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own chat sessions
CREATE POLICY "Users can delete their own chat sessions" ON chat_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- 5. CHAT_MESSAGES table policies
-- Allow users to view messages in their own chat sessions
CREATE POLICY "Users can view messages in their chat sessions" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- Allow users to create messages in their own chat sessions
CREATE POLICY "Users can create messages in their chat sessions" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- Allow users to update messages in their own chat sessions
CREATE POLICY "Users can update messages in their chat sessions" ON chat_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- Allow users to delete messages in their own chat sessions
CREATE POLICY "Users can delete messages in their chat sessions" ON chat_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- 6. DASHBOARD_CONFIGS table policies
-- Allow users to view dashboard configs for brands they own
CREATE POLICY "Users can view dashboard configs for their brands" ON dashboard_configs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM brands 
      WHERE brands.id = dashboard_configs.brand_id 
      AND brands.created_by = auth.uid()
    )
  );

-- Allow users to create dashboard configs for their brands
CREATE POLICY "Users can create dashboard configs for their brands" ON dashboard_configs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM brands 
      WHERE brands.id = dashboard_configs.brand_id 
      AND brands.created_by = auth.uid()
    )
  );

-- Allow users to update dashboard configs for their brands
CREATE POLICY "Users can update dashboard configs for their brands" ON dashboard_configs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM brands 
      WHERE brands.id = dashboard_configs.brand_id 
      AND brands.created_by = auth.uid()
    )
  );

-- Allow users to delete dashboard configs for their brands
CREATE POLICY "Users can delete dashboard configs for their brands" ON dashboard_configs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM brands 
      WHERE brands.id = dashboard_configs.brand_id 
      AND brands.created_by = auth.uid()
    )
  );