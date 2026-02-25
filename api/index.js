/**
 * Vercel Serverless Function Entry Point
 * Uses dynamic import to capture and report startup errors.
 */

let app = null;
let startupError = null;

const appPromise = import('../src/backend/src/app.js')
  .then(mod => { app = mod.default; })
  .catch(err => { startupError = err; console.error('App startup error:', err); });

export default async function handler(req, res) {
  // Wait for the app to load on first request
  await appPromise;

  // If the app failed to load, return the error details
  if (startupError) {
    return res.status(500).json({
      error: 'Function startup failed',
      message: startupError.message,
      code: startupError.code,
      stack: startupError.stack?.split('\n').slice(0, 10)
    });
  }

  if (!app) {
    return res.status(500).json({ error: 'App not loaded' });
  }

  // Delegate to Express app
  return app(req, res);
}
