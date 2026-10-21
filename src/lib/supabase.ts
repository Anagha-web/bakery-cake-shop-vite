import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file.',
  )
}

// The client appends /auth/v1, /rest/v1, etc. itself, so use only the project origin
// (a URL like https://<ref>.supabase.co/rest/v1/ breaks auth with "Invalid path specified").
export const supabase = createClient<Database>(new URL(supabaseUrl).origin, supabasePublishableKey)
