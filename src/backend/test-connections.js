import pg from 'pg';
import './src/config/env.js';

const { Client } = pg;

// Try different connection formats
const connections = [
  {
    name: 'Session pooler (port 5432)',
    config: {
      host: 'aws-0-us-east-1.pooler.supabase.com',
      port: 5432,
      database: 'postgres',
      user: 'postgres.giyheniqqqwpmetefdxj',
      password: 'BpU6ElWEC5hSsxKF',
      ssl: { rejectUnauthorized: false }
    }
  },
  {
    name: 'Transaction pooler (port 6543)',
    config: {
      host: 'aws-0-us-east-1.pooler.supabase.com',
      port: 6543,
      database: 'postgres',
      user: 'postgres.giyheniqqqwpmetefdxj',
      password: 'BpU6ElWEC5hSsxKF',
      ssl: { rejectUnauthorized: false }
    }
  },
  {
    name: 'Direct connection (port 5432)',
    config: {
      host: 'db.giyheniqqqwpmetefdxj.supabase.co',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: 'BpU6ElWEC5hSsxKF',
      ssl: { rejectUnauthorized: false }
    }
  }
];

for (const conn of connections) {
  console.log(`\n🔧 Trying: ${conn.name}...`);
  const client = new Client(conn.config);
  try {
    await client.connect();
    console.log(`✅ Connected via ${conn.name}!`);
    const result = await client.query('SELECT current_user, current_database()');
    console.log(`   User: ${result.rows[0].current_user}, DB: ${result.rows[0].current_database}`);
    await client.end();
    break;
  } catch (err) {
    console.log(`❌ Failed: ${err.message}`);
    try { await client.end(); } catch {}
  }
}
