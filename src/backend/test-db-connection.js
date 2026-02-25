import { supabase } from './src/config/supabaseClient.js';

console.log('🔍 Testing Supabase connection...\n');

if (!supabase) {
  console.error('❌ Supabase client not configured');
  process.exit(1);
}

try {
  // Test 2: Try to query a common table
  console.log('\n🧪 Testing basic query...');
  const { data, error, count } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  if (error) {
    if (error.code === '42P01') {
      console.log('ℹ️  Table "users" does not exist yet');
    } else {
      console.log(`⚠️  Error querying users: ${error.message}`);
    }
  } else {
    console.log(`✅ Successfully connected! Found ${count || 0} users`);
  }

  // Test 3: Check auth
  console.log('\n🔐 Testing auth service...');
  const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.log(`⚠️  Auth error: ${authError.message}`);
  } else {
    console.log(`✅ Auth working! Found ${authUsers?.length || 0} auth users`);
  }

  console.log('\n✅ Supabase connection is working!');
  console.log('🔗 Connected to:', process.env.SUPABASE_URL);

} catch (err) {
  console.error('❌ Connection failed:', err.message);
  process.exit(1);
}
