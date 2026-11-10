/**
 * Vercel Serverless Function Entry Point
 * Uses dynamic import so a startup failure is logged instead of crashing the function.
 */

let app = null;
let startupError = null;

const appPromise = import('../src/backend/src/app.js')
  .then(mod => { app = mod.default; })
  .catch(err => { startupError = err; console.error('App startup error:', err); });

export default async function handler(req, res) {
  // Wait for the app to load on first request
  await appPromise;

  // If the app failed to load, log the details and return a generic error
  if (startupError) {
    return res.status(500).json({ error: 'Service unavailable' });
  }

  if (!app) {
    return res.status(500).json({ error: 'App not loaded' });
  }

  // Delegate to Express app
  return app(req, res);
}
