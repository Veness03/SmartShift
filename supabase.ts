import { createClient } from '@supabase/supabase-js';

// @ts-ignore
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock-project.supabase.co';
// @ts-ignore
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-anon-key';

// Clean up just in case the user added quotes or spaces in the secrets menu
if (supabaseUrl) {
  supabaseUrl = supabaseUrl.replace(/["']/g, '').trim();
  if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
    supabaseUrl = 'https://' + supabaseUrl;
  }
}
if (supabaseAnonKey) {
  supabaseAnonKey = supabaseAnonKey.replace(/["']/g, '').trim();
}

// Initialize the Supabase client
// For the preview environment without keys, this won't successfully make real requests,
// but it satisfies the architecture requirement. Real keys can be added to .env
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.sessionStorage
  }
});

export const supabaseSecondary = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

