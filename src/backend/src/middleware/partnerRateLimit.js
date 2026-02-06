/**
 * Partner Rate Limiter Middleware
 * In-memory sliding window rate limiting with per-partner tier configuration.
 * Adds standard rate limit headers to all responses.
 */

// ─── Rate Limit Configuration by Tier ──────────────────────────────────────────
const TIER_LIMITS = {
  STANDARD:  { perMin: 60,   perHour: 1000,  burst: 10  },
  STRATEGIC: { perMin: 300,  perHour: 10000, burst: 50  },
  INTERNAL:  { perMin: 1000, perHour: 50000, burst: 100 },
};

// In-memory stores (keyed by partnerId)
const minuteWindows = new Map();  // partnerId -> { count, resetAt }
const hourWindows = new Map();    // partnerId -> { count, resetAt }
const burstWindows = new Map();   // partnerId -> { count, resetAt }

// Cleanup interval (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of minuteWindows) {
    if (val.resetAt < now) minuteWindows.delete(key);
  }
  for (const [key, val] of hourWindows) {
    if (val.resetAt < now) hourWindows.delete(key);
  }
  for (const [key, val] of burstWindows) {
    if (val.resetAt < now) burstWindows.delete(key);
  }
}, 5 * 60 * 1000);

// ─── Rate Limiter Middleware ───────────────────────────────────────────────────
export function partnerRateLimit() {
  return (req, res, next) => {
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

    // ── Burst check (per second) ─────────────────────────────────────────────
    const burstWindow = burstWindows.get(partnerId);
    if (burstWindow && burstWindow.resetAt > now) {
      burstWindow.count++;
      if (burstWindow.count > limits.burst) {
        return rateLimitResponse(res, limits.perMin, 0, Math.ceil((burstWindow.resetAt - now) / 1000));
      }
    } else {
      burstWindows.set(partnerId, { count: 1, resetAt: now + 1000 });
    }

    // ── Minute check ─────────────────────────────────────────────────────────
    const minWindow = minuteWindows.get(partnerId);
    if (minWindow && minWindow.resetAt > now) {
      minWindow.count++;
      if (minWindow.count > limits.perMin) {
        const retryAfter = Math.ceil((minWindow.resetAt - now) / 1000);
        return rateLimitResponse(res, limits.perMin, 0, retryAfter);
      }
    } else {
      minuteWindows.set(partnerId, { count: 1, resetAt: now + 60000 });
    }

    // ── Hour check ───────────────────────────────────────────────────────────
    const hourWindow = hourWindows.get(partnerId);
    if (hourWindow && hourWindow.resetAt > now) {
      hourWindow.count++;
      if (hourWindow.count > limits.perHour) {
        const retryAfter = Math.ceil((hourWindow.resetAt - now) / 1000);
        return rateLimitResponse(res, limits.perHour, 0, retryAfter);
      }
    } else {
      hourWindows.set(partnerId, { count: 1, resetAt: now + 3600000 });
    }

    // ── Set response headers ─────────────────────────────────────────────────
    const currentMin = minuteWindows.get(partnerId);
    const remaining = Math.max(0, limits.perMin - (currentMin?.count || 0));
    const resetAt = currentMin?.resetAt || now + 60000;

    res.set({
      'X-RateLimit-Limit': String(limits.perMin),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
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
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

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
