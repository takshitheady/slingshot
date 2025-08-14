import { createClient } from '@supabase/supabase-js';
let supabaseClient;
export function createSupabaseClient(url, anonKey) {
    if (!supabaseClient) {
        supabaseClient = createClient(url, anonKey);
    }
    return supabaseClient;
}
export function getSupabaseClient() {
    if (!supabaseClient) {
        throw new Error('Supabase client not initialized. Call createSupabaseClient first.');
    }
    return supabaseClient;
}
