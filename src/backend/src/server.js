/**
 * Local development server entry point
 * Imports the Express app from app.js and starts listening
 * For Vercel serverless deployment, see /api/index.js instead
 */
import dotenv from 'dotenv';
dotenv.config();

import app, { prisma } from './app.js';
import { seedSupabaseData } from './seeds/supabaseSeed.js';

export { prisma };

// Seed Supabase database (async) - only if DATABASE_URL is not localhost
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')) {
  seedSupabaseData()
    .then(() => console.log('✅ Supabase seed complete'))
    .catch(err => console.error('❌ Supabase seed error:', err));
} else {
  console.log('ℹ️  Skipping Supabase seed (using in-memory data or local DB)');
}

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`🚀 SteelWise API running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is in use, exiting so --watch can retry`);
    process.exit(1);
  }
});

// Graceful shutdown
const shutdown = () => {
  console.log('Shutdown signal received, closing server gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 3000);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
