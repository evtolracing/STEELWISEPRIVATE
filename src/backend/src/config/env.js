import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load src/backend/.env when it exists (local development). Hosted
// environments such as Vercel provide variables directly, with no file.
const envPath = path.join(__dirname, '..', '..', '.env');

if (fs.existsSync(envPath)) {
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.error('❌ Failed to load .env file:', result.error.message);
  }
}

export default process.env;
