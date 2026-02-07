import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://giyheniqqqwpmetefdxj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseServiceKey) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY not found in environment');
}

// Create Supabase client with service role key (has access to secrets)
export const supabase = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
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
