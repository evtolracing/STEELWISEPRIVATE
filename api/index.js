/**
 * Vercel Serverless Function Entry Point
 * Wraps the Express app for Vercel's serverless runtime.
 * All /api/* requests are routed here via vercel.json rewrites.
 */

// On Vercel, env vars are injected automatically — no .env file needed
import app from '../src/backend/src/app.js';

export default app;
