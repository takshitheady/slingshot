import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types.js'

let supabaseClient: SupabaseClient<Database>

export function createSupabaseClient(url: string, anonKey: string): SupabaseClient<Database> {
  if (!supabaseClient) {
    supabaseClient = createClient<Database>(url, anonKey)
  }
  return supabaseClient
}

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseClient) {
    throw new Error('Supabase client not initialized. Call createSupabaseClient first.')
  }
  return supabaseClient
}