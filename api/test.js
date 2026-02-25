/**
 * Minimal test endpoint - no Express, no Prisma
 * If this works, the Vercel function runtime is fine.
 */
export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      DATABASE_URL: process.env.DATABASE_URL ? 'set (' + process.env.DATABASE_URL.length + ' chars)' : 'NOT SET',
      DIRECT_URL: process.env.DIRECT_URL ? 'set' : 'NOT SET',
      SUPABASE_URL: process.env.SUPABASE_URL ? 'set' : 'NOT SET',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'set' : 'NOT SET',
    }
  });
}
