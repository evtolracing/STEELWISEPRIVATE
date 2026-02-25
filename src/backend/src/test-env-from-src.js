import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

// This test mimics server.js which is in src/backend/src/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '.env');

console.log('Testing from src/backend/src/ perspective...');
console.log('Script location:', __filename);
console.log('Script __dirname:', __dirname);
console.log('Looking for .env at:', envPath);
console.log('File exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  console.log('\n✅ .env file found!');
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');
  console.log('First few lines:');
  lines.slice(0, 3).forEach(line => console.log('  ', line));
  console.log(`  ... (${lines.length} total lines)`);
} else {
  console.log('\n❌ .env file NOT found!');
  console.log('Checking what files exist in parent directory:');
  const parentDir = path.join(__dirname, '..');
  const files = fs.readdirSync(parentDir);
  console.log('Files in', parentDir, ':');
  files.filter(f => f.startsWith('.env')).forEach(f => console.log('  ', f));
}

console.log('\nBefore dotenv.config():');
console.log('DATABASE_URL:', process.env.DATABASE_URL || 'NOT SET');

const result = dotenv.config({ path: envPath });

console.log('\ndotenv.config() result:');
if (result.error) {
  console.log('❌ ERROR:', result.error.message);
} else {
  console.log('✅ SUCCESS');
}

console.log('\nAfter dotenv.config():');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET (length: ' + process.env.DATABASE_URL.length + ')' : 'NOT SET');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL || 'NOT SET');
