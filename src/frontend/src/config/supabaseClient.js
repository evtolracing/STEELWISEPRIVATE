import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://giyheniqqqwpmetefdxj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate configuration
if (!supabaseAnonKey) {
  console.warn('⚠️ VITE_SUPABASE_ANON_KEY not found in environment. Supabase features may not work.');
}

// Create and export Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!supabaseAnonKey;
};

// Export for use in other services
export default supabase;
