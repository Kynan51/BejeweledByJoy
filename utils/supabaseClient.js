import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (input, init = {}) => {
      // Always add Accept and apikey headers
      init.headers = {
        ...(init.headers || {}),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      };
      console.log('[Supabase Fetch]', input, init.headers);
      return fetch(input, init);
    }
  }
});

export default supabase
