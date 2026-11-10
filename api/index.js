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

  // If the app failed to load, return a safe reason. Configuration errors
  // name the missing settings (never their values); anything else returns
  // only its error code. Full details are in the Vercel function logs.
  if (startupError) {
    const message = String(startupError.message || '');
    const reason = message.startsWith('Invalid server configuration')
      ? message
      : `Startup failed${startupError.code ? ` (${startupError.code})` : ''}; see the function logs`;
    return res.status(500).json({ error: 'Service unavailable', reason });
  }

  if (!app) {
    return res.status(500).json({ error: 'App not loaded' });
  }

  // Delegate to Express app
  return app(req, res);
}
