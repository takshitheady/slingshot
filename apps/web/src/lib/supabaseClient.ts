import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail early in development to surface missing config
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase env not set. Define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
  )
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
)


