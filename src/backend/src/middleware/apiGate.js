/**
 * One gate in front of every /api route: staff must be signed in.
 *
 * Open without a staff token:
 *   - POST /api/auth/login, POST /api/auth/register (register checks itself:
 *     it is open only while the database has no users)
 *   - GET  /api/health
 *   - partner API routes, which check their own partner tokens
 *
 * Under /api/admin and /api/v1/admin, anything that changes data also needs an
 * admin role (reads stay open to any signed-in user). Role limits for customer
 * logins and executive pages are in lib/roleAccess.js.
 */
import { authenticate, requireRole } from './auth.js';
import { apiRoleDenial } from '../lib/roleAccess.js';

const PUBLIC = new Set(['POST /api/auth/login', 'POST /api/auth/register', 'GET /api/health', 'HEAD /api/health']);
const PARTNER_PREFIXES = ['/api/v1/partner/auth', '/api/v1/partner/customer', '/api/v1/partner/supplier', '/api/v1/partner/carrier', '/api/v1/partner/webhooks'];
const ADMIN_PREFIXES = ['/api/admin', '/api/v1/admin'];
const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const normalize = (url) => {
  const path = (url || '').split('?')[0].replace(/\/+$/, '');
  return path || '/';
};
const under = (path, prefix) => path === prefix || path.startsWith(`${prefix}/`);

export function isPublicApi(method, url) {
  const path = normalize(url);
  if (PUBLIC.has(`${method} ${path}`)) return true;
  return PARTNER_PREFIXES.some((p) => under(path, p));
}

const adminOnly = requireRole();

export function apiGate(req, res, next) {
  if (req.method === 'OPTIONS' || isPublicApi(req.method, req.originalUrl)) return next();
  authenticate(req, res, (err) => {
    if (err) return next(err);
    const path = normalize(req.originalUrl);
    const denial = apiRoleDenial(req.user?.role, path);
    if (denial) return res.status(403).json({ error: denial });
    if (!READ_METHODS.has(req.method) && ADMIN_PREFIXES.some((p) => under(path, p))) return adminOnly(req, res, next);
    next();
  });
}
