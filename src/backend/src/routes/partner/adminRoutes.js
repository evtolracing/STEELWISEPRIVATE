/**
 * Partner Admin Routes
 * Internal-facing endpoints for managing partners, API keys, webhooks, and usage.
 * These are used by the Partner Management UI in the admin panel.
 * 
 * Mount: /api/v1/admin/partners
 */

import { Router } from 'express';
import prisma from '../../lib/db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { PARTNER_SCOPES } from '../../middleware/partnerAuth.js';

const router = Router();

// ─── Partners CRUD ─────────────────────────────────────────────────────────────

// GET / — List all partners
router.get('/', async (req, res) => {
  try {
    const { type, status, tier, page = 1, limit = 25 } = req.query;

    const where = {};
    if (type) where.partnerType = type;
    if (status) where.status = status;
    if (tier) where.tier = tier;

    const [partners, total] = await Promise.all([
      prisma.partner.findMany({
        where,
        include: {
          organization: { select: { id: true, name: true, code: true } },
          _count: { select: { apiKeys: true, webhooks: true, apiLogs: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit),
      }),
      prisma.partner.count({ where }),
    ]);

    res.json({
      data: partners.map(p => ({
        id: p.id,
        organization: p.organization,
        partnerType: p.partnerType,
        status: p.status,
        tier: p.tier,
        contactName: p.contactName,
        contactEmail: p.contactEmail,
        sandboxEnabled: p.sandboxEnabled,
        productionEnabled: p.productionEnabled,
        lastActiveAt: p.lastActiveAt,
        onboardedAt: p.onboardedAt,
        apiKeyCount: p._count.apiKeys,
        webhookCount: p._count.webhooks,
        apiCallCount: p._count.apiLogs,
        createdAt: p.createdAt,
      })),
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Admin partners list error:', error);
    res.status(500).json({ error: 'Failed to list partners' });
  }
});

// POST / — Create a new partner
router.post('/', async (req, res) => {
  try {
    const {
      organizationId, partnerType, tier, contactName, contactEmail, contactPhone,
      ipAllowList, sandboxEnabled, productionEnabled, notes,
    } = req.body;

    if (!organizationId || !partnerType) {
      return res.status(400).json({ error: 'organizationId and partnerType are required' });
    }

    if (!['CUSTOMER', 'SUPPLIER', 'CARRIER', 'STRATEGIC'].includes(partnerType)) {
      return res.status(400).json({ error: 'Invalid partnerType' });
    }

    // Verify organization exists
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const partner = await prisma.partner.create({
      data: {
        organizationId,
        partnerType,
        status: 'ACTIVE',
        tier: tier || 'STANDARD',
        contactName: contactName || null,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        ipAllowList: ipAllowList || [],
        sandboxEnabled: sandboxEnabled !== false,
        productionEnabled: productionEnabled || false,
        notes: notes || null,
        onboardedAt: new Date(),
      },
      include: { organization: { select: { id: true, name: true, code: true } } },
    });

    res.status(201).json(partner);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Partner already exists for this organization and type' });
    }
    console.error('Admin partner create error:', error);
    res.status(500).json({ error: 'Failed to create partner' });
  }
});

// GET /:id — Get partner detail
router.get('/:id', async (req, res) => {
  try {
    const partner = await prisma.partner.findUnique({
      where: { id: req.params.id },
      include: {
        organization: { select: { id: true, name: true, code: true, email: true, phone: true } },
        apiKeys: {
          select: {
            id: true, keyName: true, scopes: true, status: true, environment: true,
            lastUsedAt: true, expiresAt: true, createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        webhooks: {
          select: {
            id: true, url: true, events: true, status: true,
            consecutiveFailures: true, lastDeliveredAt: true, lastFailedAt: true, createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { apiLogs: true } },
      },
    });

    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    res.json({
      ...partner,
      apiCallCount: partner._count.apiLogs,
      availableScopes: PARTNER_SCOPES[partner.partnerType] || [],
    });
  } catch (error) {
    console.error('Admin partner detail error:', error);
    res.status(500).json({ error: 'Failed to get partner' });
  }
});

// PUT /:id — Update partner
router.put('/:id', async (req, res) => {
  try {
    const {
      status, tier, contactName, contactEmail, contactPhone,
      ipAllowList, sandboxEnabled, productionEnabled, rateLimitPerMin,
      rateLimitPerHour, burstLimit, notes,
    } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (tier) updateData.tier = tier;
    if (contactName !== undefined) updateData.contactName = contactName;
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
    if (ipAllowList !== undefined) updateData.ipAllowList = ipAllowList;
    if (sandboxEnabled !== undefined) updateData.sandboxEnabled = sandboxEnabled;
    if (productionEnabled !== undefined) updateData.productionEnabled = productionEnabled;
    if (rateLimitPerMin !== undefined) updateData.rateLimitPerMin = rateLimitPerMin;
    if (rateLimitPerHour !== undefined) updateData.rateLimitPerHour = rateLimitPerHour;
    if (burstLimit !== undefined) updateData.burstLimit = burstLimit;
    if (notes !== undefined) updateData.notes = notes;

    const partner = await prisma.partner.update({
      where: { id: req.params.id },
      data: updateData,
      include: { organization: { select: { id: true, name: true, code: true } } },
    });

    res.json(partner);
  } catch (error) {
    console.error('Admin partner update error:', error);
    res.status(500).json({ error: 'Failed to update partner' });
  }
});

// ─── API Keys ──────────────────────────────────────────────────────────────────

// POST /:id/keys — Generate a new API key for a partner
router.post('/:id/keys', async (req, res) => {
  try {
    const { keyName, scopes, environment, expiresAt } = req.body;

    if (!keyName) {
      return res.status(400).json({ error: 'keyName is required' });
    }

    const partner = await prisma.partner.findUnique({ where: { id: req.params.id } });
    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    // Validate scopes against allowed scopes for partner type
    const allowedScopes = PARTNER_SCOPES[partner.partnerType] || [];
    const requestedScopes = scopes || allowedScopes;
    const invalidScopes = requestedScopes.filter(s => !allowedScopes.includes(s));
    if (invalidScopes.length > 0) {
      return res.status(400).json({
        error: `Invalid scopes for ${partner.partnerType}: ${invalidScopes.join(', ')}`,
        allowedScopes,
      });
    }

    // Validate environment
    const env = environment || 'sandbox';
    if (env === 'production' && !partner.productionEnabled) {
      return res.status(400).json({ error: 'Production access is not enabled for this partner' });
    }

    // Generate client secret
    const rawSecret = `sk_${env === 'production' ? 'live' : 'test'}_${crypto.randomBytes(32).toString('hex')}`;
    const hashedSecret = await bcrypt.hash(rawSecret, 10);

    const apiKey = await prisma.partnerApiKey.create({
      data: {
        partnerId: partner.id,
        keyName,
        clientSecret: hashedSecret,
        scopes: requestedScopes,
        environment: env,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    res.status(201).json({
      id: apiKey.id,          // This is the client_id
      keyName: apiKey.keyName,
      clientId: apiKey.id,    // Alias for clarity
      clientSecret: rawSecret, // Only shown once!
      scopes: apiKey.scopes,
      environment: apiKey.environment,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
      warning: 'Save the clientSecret now — it will NOT be shown again.',
    });
  } catch (error) {
    console.error('Admin key create error:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// DELETE /:id/keys/:keyId — Revoke an API key
router.delete('/:id/keys/:keyId', async (req, res) => {
  try {
    const { reason } = req.body || {};

    const apiKey = await prisma.partnerApiKey.findFirst({
      where: { id: req.params.keyId, partnerId: req.params.id },
    });

    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    await prisma.partnerApiKey.update({
      where: { id: apiKey.id },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        revokedBy: req.headers['x-user-id'] || 'admin',
        revokeReason: reason || 'Revoked by admin',
      },
    });

    res.json({ message: 'API key revoked', id: apiKey.id });
  } catch (error) {
    console.error('Admin key revoke error:', error);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

// ─── Usage & Logs ──────────────────────────────────────────────────────────────

// GET /:id/usage — Usage metrics for a partner
router.get('/:id/usage', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const partner = await prisma.partner.findUnique({ where: { id: req.params.id } });
    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    // Aggregate API call data
    const logs = await prisma.partnerApiLog.findMany({
      where: { partnerId: req.params.id, createdAt: { gte: since } },
      select: { method: true, endpoint: true, statusCode: true, responseTimeMs: true, createdAt: true },
    });

    const totalCalls = logs.length;
    const successCalls = logs.filter(l => l.statusCode >= 200 && l.statusCode < 300).length;
    const clientErrors = logs.filter(l => l.statusCode >= 400 && l.statusCode < 500).length;
    const serverErrors = logs.filter(l => l.statusCode >= 500).length;
    const avgResponseTime = totalCalls > 0
      ? Math.round(logs.reduce((sum, l) => sum + (l.responseTimeMs || 0), 0) / totalCalls)
      : 0;

    // Group by endpoint
    const endpointCounts = {};
    for (const log of logs) {
      const key = `${log.method} ${log.endpoint.split('?')[0]}`;
      endpointCounts[key] = (endpointCounts[key] || 0) + 1;
    }

    // Group by day
    const dailyCounts = {};
    for (const log of logs) {
      const day = log.createdAt.toISOString().split('T')[0];
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    }

    res.json({
      partnerId: req.params.id,
      period: { days: parseInt(days), since: since.toISOString() },
      summary: {
        totalCalls,
        successCalls,
        clientErrors,
        serverErrors,
        errorRate: totalCalls > 0 ? Math.round((clientErrors + serverErrors) / totalCalls * 100) : 0,
        avgResponseTimeMs: avgResponseTime,
      },
      topEndpoints: Object.entries(endpointCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([endpoint, count]) => ({ endpoint, count })),
      dailyVolume: Object.entries(dailyCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count })),
    });
  } catch (error) {
    console.error('Admin usage error:', error);
    res.status(500).json({ error: 'Failed to get usage metrics' });
  }
});

// GET /:id/logs — API call logs for a partner
router.get('/:id/logs', async (req, res) => {
  try {
    const { status, endpoint, page = 1, limit = 50 } = req.query;

    const where = { partnerId: req.params.id };
    if (status === 'error') where.statusCode = { gte: 400 };
    if (status === 'success') where.statusCode = { lt: 400 };
    if (endpoint) where.endpoint = { contains: endpoint };

    const [logs, total] = await Promise.all([
      prisma.partnerApiLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit),
      }),
      prisma.partnerApiLog.count({ where }),
    ]);

    res.json({
      data: logs.map(l => ({
        id: l.id,
        method: l.method,
        endpoint: l.endpoint,
        statusCode: l.statusCode,
        responseTimeMs: l.responseTimeMs,
        ipAddress: l.ipAddress,
        errorCode: l.errorCode,
        errorMessage: l.errorMessage,
        resourceType: l.resourceType,
        resourceId: l.resourceId,
        createdAt: l.createdAt,
      })),
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Admin logs error:', error);
    res.status(500).json({ error: 'Failed to get logs' });
  }
});

// ─── Dashboard Summary ─────────────────────────────────────────────────────────

// GET /dashboard/summary — Overview metrics for all partners
router.get('/dashboard/summary', async (req, res) => {
  try {
    const [
      totalPartners,
      activePartners,
      partnersByType,
      recentLogs,
    ] = await Promise.all([
      prisma.partner.count(),
      prisma.partner.count({ where: { status: 'ACTIVE' } }),
      prisma.partner.groupBy({ by: ['partnerType'], _count: true }),
      prisma.partnerApiLog.count({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
    ]);

    res.json({
      totalPartners,
      activePartners,
      partnersByType: partnersByType.reduce((acc, p) => {
        acc[p.partnerType] = p._count;
        return acc;
      }, {}),
      apiCallsLast24h: recentLogs,
    });
  } catch (error) {
    console.error('Admin dashboard summary error:', error);
    res.status(500).json({ error: 'Failed to get dashboard summary' });
  }
});

export default router;
