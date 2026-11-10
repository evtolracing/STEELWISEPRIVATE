import { createClient } from '@supabase/supabase-js';
import './env.js';  // Load environment variables

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set; Supabase client disabled');
}

// Create Supabase client with service role key (bypasses RLS)
export const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

/**
 * Fetch a secret from Supabase Edge Function environment
 * Note: In production, secrets are only accessible from Edge Functions
 * For local development, you can use environment variables
 */
export async function getSupabaseSecret(secretName) {
  // First, try to get from local environment
  if (process.env[secretName]) {
    return process.env[secretName];
  }

  // If running locally or in development, return null and warn
  if (!supabase) {
    console.warn(`⚠️  Unable to fetch ${secretName} from Supabase - no client configured`);
    return null;
  }

  // For production: Call your own edge function to get the secret
  // This is a placeholder - you'd need to create an edge function that returns secrets
  console.warn(`⚠️  Secret ${secretName} not in local env. For production, use Edge Functions with Supabase secrets.`);
  return null;
}
