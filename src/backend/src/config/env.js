import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file (go up two levels: config -> src -> backend)
const result = dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

if (result.error) {
  console.error('❌ Failed to load .env file:', result.error.message);
} else {
  console.log('✅ Environment variables loaded from .env');
}

export default process.env;
