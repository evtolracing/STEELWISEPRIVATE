import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '.env');

console.log('Testing .env loading...');
console.log('Current directory:', __dirname);
console.log('Looking for .env at:', envPath);
console.log('File exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  console.log('\n.env file contents (first 5 lines):');
  const content = fs.readFileSync(envPath, 'utf8');
  console.log(content.split('\n').slice(0, 5).join('\n'));
}

console.log('\nBefore dotenv.config():');
console.log('DATABASE_URL:', process.env.DATABASE_URL || 'NOT SET');

const result = dotenv.config({ path: envPath });
console.log('\ndotenv.config() result:', result.error || 'SUCCESS');

console.log('\nAfter dotenv.config():');
console.log('DATABASE_URL:', process.env.DATABASE_URL || 'STILL NOT SET');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL || 'NOT SET');
