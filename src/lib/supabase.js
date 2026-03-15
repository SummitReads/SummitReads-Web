import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// This creates the connection using your public "Anon" keys
export const supabase = createClient(supabaseUrl, supabaseAnonKey)