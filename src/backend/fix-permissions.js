import pg from 'pg';
import './src/config/env.js';

const { Client } = pg;

// Use the pooler connection string
const connectionString = 'postgresql://postgres.giyheniqqqwpmetefdxj:BpU6ElWEC5hSsxKF@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

console.log('🔧 Connecting to Supabase PostgreSQL...');

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

try {
  await client.connect();
  console.log('✅ Connected to database!\n');

  // 1. List all tables
  console.log('📋 Tables in public schema:');
  const tablesResult = await client.query(`
    SELECT table_name, table_type
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
  tablesResult.rows.forEach(row => {
    console.log(`   • ${row.table_name} (${row.table_type})`);
  });

  // 2. Grant permissions for PostgREST roles
  console.log('\n🔐 Granting schema permissions...');
  await client.query(`GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role`);
  console.log('   ✅ Schema USAGE granted');

  await client.query(`GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role`);
  console.log('   ✅ Table permissions granted');

  await client.query(`GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role`);
  console.log('   ✅ Sequence permissions granted');

  // Set default privileges for future tables
  await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role`);
  await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role`);
  console.log('   ✅ Default privileges set for future tables');

  // 3. Notify PostgREST to reload schema cache
  await client.query(`NOTIFY pgrst, 'reload schema'`);
  console.log('   ✅ PostgREST schema cache reloaded');

  // 4. Check Job table data
  console.log('\n📊 Checking data in tables:');
  for (const tableName of tablesResult.rows.map(r => r.table_name).filter(t => !t.startsWith('_'))) {
    try {
      const countResult = await client.query(`SELECT COUNT(*) FROM "public"."${tableName}"`);
      const count = countResult.rows[0].count;
      if (count > 0) {
        console.log(`   • ${tableName}: ${count} records`);
      }
    } catch (err) {
      // skip tables that can't be counted
    }
  }

  console.log('\n✅ Database permissions fixed!');

} catch (err) {
  console.error('❌ Error:', err.message);
} finally {
  await client.end();
}
