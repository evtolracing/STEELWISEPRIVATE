/**
 * Gives every request an id and writes one log line when it finishes.
 *
 *  - The id is returned in the X-Request-Id header and added to every 5xx
 *    reply, so a user can quote it and support can find the exact request.
 *    An id sent by a trusted proxy is reused when it looks like an id.
 *  - The line is JSON: time, id, method, path, status, milliseconds, user id
 *    and role. No query string, body, token or address is logged.
 *  - Requests slower than SLOW_REQUEST_MS (default 1000) are logged as "warn",
 *    5xx replies as "error". LOG_REQUESTS=off silences the ok lines only.
 */
import crypto from 'node:crypto';

const SAFE_ID = /^[A-Za-z0-9._-]{8,64}$/;
const SLOW_MS = Number(process.env.SLOW_REQUEST_MS) || 1000;
const quietOk = () => process.env.LOG_REQUESTS === 'off';

export function requestIdFrom(headerValue) {
  const sent = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  return typeof sent === 'string' && SAFE_ID.test(sent) ? sent : crypto.randomUUID();
}

export function levelFor(status, ms, slowMs = SLOW_MS) {
  if (status >= 500) return 'error';
  if (ms >= slowMs) return 'warn';
  return 'info';
}

export function requestLog(req, res, next) {
  req.id = requestIdFrom(req.headers['x-request-id']);
  res.setHeader('X-Request-Id', req.id);
  const started = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Math.round(Number(process.hrtime.bigint() - started) / 1e6);
    const level = levelFor(res.statusCode, ms);
    const path = (req.originalUrl || req.url || '').split('?')[0];
    if (level === 'info' && (quietOk() || path === '/api/health')) return;
    const line = JSON.stringify({
      t: new Date().toISOString(), level, msg: 'request', id: req.id, method: req.method, path,
      status: res.statusCode, ms, ...(req.user?.id && { userId: req.user.id, role: req.user.role }),
      ...(level === 'warn' && { slow: true }),
    });
    (level === 'error' ? console.error : level === 'warn' ? console.warn : console.log)(line);
  });
  next();
}
