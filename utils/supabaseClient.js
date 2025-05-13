import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// console.log('[supabaseClient] URL:', supabaseUrl)
// console.log('[supabaseClient] AnonKey:', supabaseAnonKey)

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase
