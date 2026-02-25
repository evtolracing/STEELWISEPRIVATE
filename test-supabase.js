import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('Testing Supabase connection...');
console.log('URL:', process.env.SUPABASE_URL);

// Try to fetch tables from the public schema
const { data, error } = await supabase
  .from('_prisma_migrations')
  .select('*')
  .limit(1);

if (error) {
  console.error('❌ Connection error:', error.message);
  console.log('\nTrying to list tables...');

  // Try a different approach - query for any table
  const { data: tables, error: tablesError } = await supabase.rpc('get_tables');

  if (tablesError) {
    console.error('❌ Could not list tables:', tablesError.message);
  } else {
    console.log('✅ Tables:', tables);
  }
} else {
  console.log('✅ Successfully connected to Supabase!');
  console.log('Data:', data);
}

process.exit(0);
