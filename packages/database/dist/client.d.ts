import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types.js';
export declare function createSupabaseClient(url: string, anonKey: string): SupabaseClient<Database>;
export declare function getSupabaseClient(): SupabaseClient<Database>;
