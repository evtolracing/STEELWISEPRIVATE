import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set. Supabase features are disabled.');
}

// Create and export Supabase client (null when not configured)
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
}) : null;

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!supabase;
};

// Export for use in other services
export default supabase;
