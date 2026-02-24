/**
 * Partner Authentication Middleware
 * OAuth2 Client Credentials flow for external partner API access.
 * Validates Bearer tokens, enforces scopes, logs all access.
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../lib/db.js';

const JWT_SECRET = process.env.PARTNER_JWT_SECRET || process.env.JWT_SECRET || 'partner-api-secret';
const TOKEN_EXPIRY = '1h';

// ─── Scope Definitions by Partner Type ─────────────────────────────────────────
export const PARTNER_SCOPES = {
  CUSTOMER: [
    'rfq:read', 'rfq:write',
    'quotes:read', 'quotes:respond',
    'orders:read',
    'documents:read',
    'shipments:read',
    'invoices:read',
  ],
  SUPPLIER: [
    'po:read', 'po:acknowledge',
    'asn:read', 'asn:write',
    'documents:read', 'documents:write',
    'scar:read', 'scar:respond',
    'scorecard:read',
  ],
  CARRIER: [
    'shipments:read', 'shipments:respond', 'shipments:status',
    'pod:write',
    'exceptions:write',
    'performance:read',
  ],
  STRATEGIC: [
    'rfq:read', 'rfq:write',
    'quotes:read', 'quotes:respond',
    'orders:read',
    'documents:read', 'documents:write',
    'shipments:read', 'shipments:status',
    'invoices:read',
  ],
};

// ─── Token Generation ──────────────────────────────────────────────────────────
export async function generatePartnerToken(clientId, clientSecret) {
  // clientId = PartnerApiKey.id
  const apiKey = await prisma.partnerApiKey.findUnique({
    where: { id: clientId },
    include: { partner: true },
  });

  if (!apiKey) {
    throw new Error('Invalid client credentials');
  }

  if (apiKey.status !== 'ACTIVE') {
    throw new Error(`API key is ${apiKey.status.toLowerCase()}`);
  }

  if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
    await prisma.partnerApiKey.update({
      where: { id: apiKey.id },
      data: { status: 'EXPIRED' },
    });
    throw new Error('API key has expired');
  }

  if (apiKey.partner.status !== 'ACTIVE') {
    throw new Error(`Partner account is ${apiKey.partner.status.toLowerCase()}`);
  }

  // Verify secret
  const valid = await bcrypt.compare(clientSecret, apiKey.clientSecret);
  if (!valid) {
    throw new Error('Invalid client credentials');
  }

  // Update last used
  await prisma.partnerApiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  await prisma.partner.update({
    where: { id: apiKey.partnerId },
    data: { lastActiveAt: new Date() },
  });

  // Generate JWT
  const token = jwt.sign(
    {
      sub: apiKey.id,
      partner_id: apiKey.partnerId,
      partner_type: apiKey.partner.partnerType,
      org_id: apiKey.partner.organizationId,
      scopes: apiKey.scopes,
      environment: apiKey.environment,
      iss: 'steelwise-partner-api',
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );

  return {
    access_token: token,
    token_type: 'Bearer',
    expires_in: 3600,
    scope: apiKey.scopes.join(' '),
  };
}

// ─── Auth Middleware ────────────────────────────────────────────────────────────
export function partnerAuth(requiredScopes = []) {
  return async (req, res, next) => {
    const startTime = Date.now();

    try {
      // Extract Bearer token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return sendAuthError(req, res, 401, 'MISSING_TOKEN', 'Bearer token required');
      }

      const token = authHeader.replace('Bearer ', '');

      // Verify JWT
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        if (err.name === 'TokenExpiredError') {
          return sendAuthError(req, res, 401, 'TOKEN_EXPIRED', 'Token has expired');
        }
        return sendAuthError(req, res, 401, 'INVALID_TOKEN', 'Invalid token');
      }

      // Verify issuer
      if (decoded.iss !== 'steelwise-partner-api') {
        return sendAuthError(req, res, 401, 'INVALID_TOKEN', 'Invalid token issuer');
      }

      // Check partner still active
      const partner = await prisma.partner.findUnique({
        where: { id: decoded.partner_id },
      });

      if (!partner || partner.status !== 'ACTIVE') {
        return sendAuthError(req, res, 403, 'PARTNER_INACTIVE', 'Partner account is not active');
      }

      // IP allowlist check
      if (partner.ipAllowList.length > 0) {
        const clientIp = req.ip || req.connection?.remoteAddress;
        if (!partner.ipAllowList.includes(clientIp)) {
          return sendAuthError(req, res, 403, 'IP_BLOCKED', 'Request from unauthorized IP address');
        }
      }

      // Check scopes
      if (requiredScopes.length > 0) {
        const hasScope = requiredScopes.some(scope => decoded.scopes.includes(scope));
        if (!hasScope) {
          return sendAuthError(req, res, 403, 'INSUFFICIENT_SCOPE',
            `Required scope: ${requiredScopes.join(' or ')}`);
        }
      }

      // Attach partner context to request
      req.partner = {
        id: decoded.partner_id,
        type: decoded.partner_type,
        orgId: decoded.org_id,
        scopes: decoded.scopes,
        apiKeyId: decoded.sub,
        environment: decoded.environment,
      };

      // Log successful access (async, don't block response)
      logApiAccess(req, res, startTime).catch(err =>
        console.error('Failed to log API access:', err.message)
      );

      next();
    } catch (error) {
      console.error('Partner auth error:', error);
      return sendAuthError(req, res, 500, 'AUTH_ERROR', 'Authentication failed');
    }
  };
}

// ─── Scope Check Middleware (for route-level granularity) ───────────────────────
export function requireScope(...scopes) {
  return (req, res, next) => {
    if (!req.partner) {
      return res.status(401).json({ error: { code: 'NOT_AUTHENTICATED', message: 'Authentication required' } });
    }

    const hasScope = scopes.some(scope => req.partner.scopes.includes(scope));
    if (!hasScope) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_SCOPE',
          message: `This action requires one of: ${scopes.join(', ')}`,
        }
      });
    }

    next();
  };
}

// ─── Partner Type Guard ────────────────────────────────────────────────────────
export function requirePartnerType(...types) {
  return (req, res, next) => {
    if (!req.partner) {
      return res.status(401).json({ error: { code: 'NOT_AUTHENTICATED', message: 'Authentication required' } });
    }

    if (!types.includes(req.partner.type)) {
      return res.status(403).json({
        error: {
          code: 'WRONG_PARTNER_TYPE',
          message: `This endpoint is only available to: ${types.join(', ')}`,
        }
      });
    }

    next();
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function sendAuthError(req, res, status, code, message) {
  // Log failed auth attempts asynchronously
  logApiAccess(req, res, Date.now(), { errorCode: code, errorMessage: message, statusCode: status })
    .catch(err => console.error('Failed to log auth error:', err.message));

  return res.status(status).json({ error: { code, message } });
}

async function logApiAccess(req, res, startTime, override = {}) {
  try {
    const partnerId = req.partner?.id || override.partnerId;
    if (!partnerId) return; // Can't log without partner context

    // Use event listener to capture actual status code
    const statusCode = override.statusCode || res.statusCode;

    await prisma.partnerApiLog.create({
      data: {
        partnerId,
        method: req.method,
        endpoint: req.originalUrl || req.url,
        statusCode,
        apiKeyId: req.partner?.apiKeyId || null,
        ipAddress: req.ip || req.connection?.remoteAddress || null,
        userAgent: req.headers['user-agent'] || null,
        responseTimeMs: Date.now() - startTime,
        errorCode: override.errorCode || null,
        errorMessage: override.errorMessage || null,
        resourceType: req.partnerResourceType || null,
        resourceId: req.partnerResourceId || null,
      },
    });
  } catch (error) {
    console.error('API log write failed:', error.message);
  }
}

export default { generatePartnerToken, partnerAuth, requireScope, requirePartnerType, PARTNER_SCOPES };
