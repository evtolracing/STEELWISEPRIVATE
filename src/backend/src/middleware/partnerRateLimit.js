/**
 * Partner Rate Limiter Middleware
 * Fixed-window rate limiting with per-partner tier configuration, counted in the database so the
 * limit is one limit however many copies of the server run (src/lib/rateWindow.js).
 * Adds standard rate limit headers to all responses.
 */

import prisma from '../lib/db.js';
import { hit } from '../lib/rateWindow.js';

// ─── Rate Limit Configuration by Tier ──────────────────────────────────────────
const TIER_LIMITS = {
  STANDARD:  { perMin: 60,   perHour: 1000,  burst: 10  },
  STRATEGIC: { perMin: 300,  perHour: 10000, burst: 50  },
  INTERNAL:  { perMin: 1000, perHour: 50000, burst: 100 },
};

// ─── Rate Limiter Middleware ───────────────────────────────────────────────────
// The counts are kept in the database so every server copy adds to the same number (Z-007). With
// counts in each copy's memory a partner got its limit once per running copy.
export function partnerRateLimit() {
  return async (req, res, next) => {
    if (!req.partner) {
      return next(); // Skip if no partner context (shouldn't happen after partnerAuth)
    }

    const partnerId = req.partner.id;
    const now = Date.now();

    // Determine limits: partner-specific overrides take priority
    const tierKey = req.partner.tier || 'STANDARD';
    const defaults = TIER_LIMITS[tierKey] || TIER_LIMITS.STANDARD;

    const limits = {
      perMin: req.partner.rateLimitPerMin || defaults.perMin,
      perHour: req.partner.rateLimitPerHour || defaults.perHour,
      burst: req.partner.burstLimit || defaults.burst,
    };

    // One statement counts the second, the minute and the hour. `hit` never throws: without the
    // shared table it counts in this copy's memory.
    const [burst, minute, hour] = await hit([
      { key: `partner:${partnerId}:burst`, windowMs: 1000 },
      { key: `partner:${partnerId}:minute`, windowMs: 60_000 },
      { key: `partner:${partnerId}:hour`, windowMs: 3_600_000 },
    ], now);

    if (burst.count > limits.burst) return rateLimitResponse(res, limits.perMin, 0, Math.max(1, Math.ceil((burst.resetAt - now) / 1000)));
    if (minute.count > limits.perMin) return rateLimitResponse(res, limits.perMin, 0, Math.max(1, Math.ceil((minute.resetAt - now) / 1000)));
    if (hour.count > limits.perHour) return rateLimitResponse(res, limits.perHour, 0, Math.max(1, Math.ceil((hour.resetAt - now) / 1000)));

    res.set({
      'X-RateLimit-Limit': String(limits.perMin),
      'X-RateLimit-Remaining': String(Math.max(0, limits.perMin - minute.count)),
      'X-RateLimit-Reset': String(Math.ceil(minute.resetAt / 1000)),
    });

    next();
  };
}

function rateLimitResponse(res, limit, remaining, retryAfter) {
  res.set({
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': '0',
    'Retry-After': String(retryAfter),
  });

  return res.status(429).json({
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please retry after the specified time.',
      retryAfter,
    }
  });
}

// ─── Load Partner Tier (call after partnerAuth) ────────────────────────────────
export function loadPartnerTier() {
  return async (req, res, next) => {
    if (!req.partner) return next();

    try {
      const partner = await prisma.partner.findUnique({
        where: { id: req.partner.id },
        select: {
          tier: true,
          rateLimitPerMin: true,
          rateLimitPerHour: true,
          burstLimit: true,
        },
      });

      if (partner) {
        req.partner.tier = partner.tier;
        req.partner.rateLimitPerMin = partner.rateLimitPerMin;
        req.partner.rateLimitPerHour = partner.rateLimitPerHour;
        req.partner.burstLimit = partner.burstLimit;
      }
    } catch (error) {
      console.error('Failed to load partner tier:', error.message);
    }

    next();
  };
}

export default { partnerRateLimit, loadPartnerTier };
