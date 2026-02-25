import { supabase } from './src/config/supabaseClient.js';

console.log('🔍 Checking database schema...\n');

if (!supabase) {
  console.error('❌ Supabase client not configured');
  process.exit(1);
}

try {
  // Query the information_schema to get all tables
  const { data, error } = await supabase.rpc('get_tables_info');

  if (error) {
    // Fallback: Try to query some expected tables
    console.log('📋 Checking for common tables...\n');

    const tables = [
      'users', 'profiles', 'jobs', 'orders', 'inventory', 'quotes',
      'contacts', 'products', 'materials', 'work_centers', 'locations'
    ];

    const results = {};
    for (const table of tables) {
      const { count, error: tableError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (!tableError) {
        results[table] = count || 0;
      }
    }

    console.log('✅ Tables found:');
    Object.entries(results).forEach(([table, count]) => {
      console.log(`   • ${table}: ${count} records`);
    });

    if (Object.keys(results).length === 0) {
      console.log('\n⚠️  No standard tables found. Database may need migrations.');
    }
  } else {
    console.log('Tables:', data);
  }

} catch (err) {
  console.error('❌ Error:', err.message);
}
