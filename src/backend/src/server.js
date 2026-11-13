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
// Demo data is only ever loaded when asked for: SEED_ON_START=true. It used to
// run on every start against any non-local database.
if (process.env.SEED_ON_START === 'true' && process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')) {
  seedSupabaseData()
    .then(() => console.log('✅ Supabase seed complete'))
    .catch(err => console.error('❌ Supabase seed error:', err));
} else {
  console.log('ℹ️  Demo seed not requested (set SEED_ON_START=true to load it)');
}

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`🚀 SteelWise API running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});

// An uncaught exception leaves the process in an unknown state. Log it, stop
// taking requests, and exit so the process manager starts a clean one.
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is in use, exiting so --watch can retry`);
    process.exit(1);
  }
  shutdown(1);
});

// Graceful shutdown: finish requests in flight, close the database pool, then exit.
let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('Shutdown signal received, closing server gracefully');
  const hardStop = setTimeout(() => process.exit(code || 1), 10000);
  hardStop.unref();
  server.close(async () => {
    try { await prisma?.$disconnect(); } catch (e) { console.error('Error closing the database pool:', e.message); }
    console.log('Server closed');
    process.exit(code);
  });
}
process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));
