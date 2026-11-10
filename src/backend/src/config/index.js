/**
 * Central runtime configuration.
 *
 * Reads settings from environment variables once, validates the ones the
 * server cannot run safely without, and exposes them to the rest of the app.
 * In production a missing or weak required setting stops the server at
 * startup instead of failing later in a confusing way.
 */
import crypto from 'crypto';
import './env.js';

const isProduction = process.env.NODE_ENV === 'production';
const MIN_SECRET_LENGTH = 32;

const problems = [];

function resolveSecret(name, { fallbackName } = {}) {
  const value = process.env[name] || (fallbackName ? process.env[fallbackName] : undefined);

  if (value && value.length >= MIN_SECRET_LENGTH) return value;

  const issue = value
    ? `${name} must be at least ${MIN_SECRET_LENGTH} characters`
    : `${name} is not set`;

  if (isProduction) {
    problems.push(issue);
    return undefined;
  }

  // Development only: use a random per-process secret so nothing ever falls
  // back to a guessable value. Tokens stop working when the server restarts.
  console.warn(`⚠️  ${issue}; using a random development secret for this process`);
  return crypto.randomBytes(48).toString('hex');
}

function parseList(value) {
  return (value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

const jwtSecret = resolveSecret('JWT_SECRET');
// Partner API tokens use their own key so a partner token can never be
// accepted as a staff token. Derived from JWT_SECRET when not set.
const partnerJwtSecret = process.env.PARTNER_JWT_SECRET
  ? resolveSecret('PARTNER_JWT_SECRET')
  : jwtSecret && crypto.createHmac('sha256', jwtSecret).update('steelwise-partner-api').digest('hex');

if (isProduction && !process.env.DATABASE_URL) {
  problems.push('DATABASE_URL is not set');
}

if (problems.length > 0) {
  throw new Error(`Invalid server configuration: ${problems.join('; ')}`);
}

const config = Object.freeze({
  isProduction,
  jwtSecret,
  partnerJwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  // Browser origins allowed to call the API cross-origin. Empty means
  // same-origin only in production, and any origin in development.
  corsOrigins: parseList(process.env.CORS_ORIGIN),
  jsonBodyLimit: process.env.JSON_BODY_LIMIT || '5mb',
  rateLimit: Object.freeze({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
    max: Number(process.env.RATE_LIMIT_MAX) || 1000,
    loginWindowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60_000,
    loginMax: Number(process.env.LOGIN_RATE_LIMIT_MAX) || 20,
  }),
});

export default config;
