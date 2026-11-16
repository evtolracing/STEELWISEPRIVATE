/**
 * Shared pieces of the partner API (customers, suppliers and carriers calling in with their
 * own credentials).
 *
 * Contract for every partner route:
 *   - a list answers `{ data: [...], pagination: { page, limit, total, totalPages } }`;
 *   - a failure answers `{ error: { code, message } }` with a 4xx or 5xx status;
 *   - a partner only ever sees or changes records of its own organisation. A record of
 *     another organisation answers 404, the same as a record that does not exist;
 *   - a changing request may carry `Idempotency-Key`. The same key from the same partner is
 *     run once; the repeat gets the first answer back.
 */
import { partnerAuth, requirePartnerType } from '../../middleware/partnerAuth.js';
import { partnerRateLimit, loadPartnerTier } from '../../middleware/partnerRateLimit.js';
import { requestKeys } from '../../middleware/requestKeys.js';

/** The checks every partner router runs, in order. */
export const partnerStack = (...types) => [
  partnerAuth(),
  ...(types.length ? [requirePartnerType(...types)] : []),
  loadPartnerTier(),
  partnerRateLimit(),
  requestKeys,
];

export class PartnerRefusal extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}
export const refuse = (status, code, message) => { throw new PartnerRefusal(status, code, message); };

const CODES = { 400: 'VALIDATION_ERROR', 404: 'NOT_FOUND', 409: 'CONFLICT', 422: 'UNPROCESSABLE', 501: 'NOT_AVAILABLE' };

/** Runs a handler and turns any refusal, from here or from the shared business rules, into the partner error shape. */
export const wrap = (label, fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error instanceof PartnerRefusal) return res.status(error.status).json({ error: { code: error.code, message: error.message } });
    // The staff rules refuse with { status, message }.
    if (Number.isInteger(error?.status) && error.status >= 400 && error.status < 500) {
      return res.status(error.status).json({ error: { code: CODES[error.status] || 'REFUSED', message: error.message } });
    }
    if (error?.code === 'P2003' || error?.name === 'PrismaClientValidationError') {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'The request has a value that is not valid' } });
    }
    console.error(JSON.stringify({ level: 'error', msg: 'partner_api_failed', label, id: req.id, partnerId: req.partner?.id || null }), error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: `Failed to ${label}` } });
  }
};

/** Page and limit as whole numbers within bounds. */
export function paging(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 25));
  return { page, limit, skip: (page - 1) * limit, take: limit };
}
export const pageOf = (data, total, { page, limit }) => ({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });

export const num = (d) => (d === null || d === undefined ? null : Number(d));

/** One of the allowed values, or a 400. */
export function oneOf(value, allowed, name) {
  if (value === undefined || value === null || value === '') return undefined;
  const v = String(value).toUpperCase();
  if (!allowed.includes(v)) refuse(400, 'VALIDATION_ERROR', `${name} must be one of: ${allowed.join(', ')}`);
  return v;
}

export function text(value, name, max = 500) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' && typeof value !== 'number') refuse(400, 'VALIDATION_ERROR', `${name} must be text`);
  const t = String(value).trim();
  if (t.length > max) refuse(400, 'VALIDATION_ERROR', `${name} is too long (${max} characters at most)`);
  return t || null;
}

/** For a part of the partner API whose module is not built yet: an honest answer instead of a failure. */
export const notAvailable = (what) => (req, res) => res.status(501).json({ error: { code: 'NOT_AVAILABLE', message: `${what} is not available through the partner API yet` } });

/** Who did it, for audit lines written on behalf of a partner (there is no staff user). */
export const partnerNote = (req, textNote) => `Partner API (${req.partner.type.toLowerCase()} ${req.partner.id.slice(0, 8)}): ${textNote}`;
