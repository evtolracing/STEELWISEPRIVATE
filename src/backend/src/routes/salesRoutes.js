/**
 * Sales & Pricing Intelligence API Routes
 * 
 * Comprehensive endpoints for RFQ-to-Cash optimization including:
 * - Pricing recommendations
 * - Quote management with margin protection
 * - RFQ intake and normalization
 * - Customer portal endpoints
 */

import { Router } from 'express';
import prisma from '../lib/db.js';
import pricingService from '../services/pricingIntelligenceService.js';

const router = Router();

// =============================================
// PRICING INTELLIGENCE ENDPOINTS
// =============================================

/**
 * POST /sales/pricing/recommend
 * Generate pricing recommendation for a line item
 */
router.post('/pricing/recommend', async (req, res) => {
  try {
    const {
      customerId,
      productCode,
      grade,
      form,
      materialType,
      dimensions,
      quantity,
      unit,
      operations,
      destinationZip,
      originLocationId,
      requestedDeliveryDate,
    } = req.body;

    if (!quantity) {
      return res.status(400).json({ error: 'Quantity is required' });
    }

    const recommendation = await pricingService.generatePricingRecommendation({
      customerId,
      productCode,
      grade,
      form,
      materialType,
      dimensions,
      quantity: parseFloat(quantity),
      unit: unit || 'LB',
      operations,
      destinationZip,
      originLocationId,
      requestedDeliveryDate,
    });

    res.json(recommendation);
  } catch (error) {
    console.error('Error generating pricing recommendation:', error);
    res.status(500).json({ error: 'Failed to generate pricing recommendation' });
  }
});

/**
 * GET /sales/pricing/customer/:customerId/tier
 * Get customer pricing tier and margin settings
 */
router.get('/pricing/customer/:customerId/tier', async (req, res) => {
  try {
    const { customerId } = req.params;
    const tier = await pricingService.getCustomerPricingTier(customerId);
    res.json(tier);
  } catch (error) {
    console.error('Error fetching customer tier:', error);
    res.status(500).json({ error: 'Failed to fetch customer pricing tier' });
  }
});

/**
 * POST /sales/pricing/override
 * Request a pricing override (requires approval)
 */
router.post('/pricing/override', async (req, res) => {
  try {
    const {
      quoteId,
      quoteLineId,
      originalPrice,
      overridePrice,
      originalMargin,
      overrideMargin,
      reason,
      justification,
      requestedById,
      customerTier,
    } = req.body;

    // Check if approval is required
    const approvalCheck = pricingService.checkOverrideApproval(
      overridePrice,
      originalPrice,
      originalPrice * 0.85, // Assume min price is 85% of original
      customerTier || 'C'
    );

    // Record the override request
    const override = await pricingService.recordPricingOverride({
      quoteId,
      quoteLineId,
      originalPrice,
      overridePrice,
      originalMargin,
      overrideMargin,
      reason,
      justification,
      requestedById,
    });

    res.json({
      override,
      approvalRequired: approvalCheck.requiresApproval,
      approvalLevel: approvalCheck.approvalLevel,
      approvalReason: approvalCheck.reason,
    });
  } catch (error) {
    console.error('Error creating pricing override:', error);
    res.status(500).json({ error: 'Failed to create pricing override' });
  }
});

/**
 * GET /sales/pricing/substitutions
 * Get product substitution suggestions
 */
router.get('/pricing/substitutions', async (req, res) => {
  try {
    const { productCode, grade, form, quantity } = req.query;
    
    const substitutions = await pricingService.suggestSubstitutions({
      productCode,
      grade,
      form,
      quantity: quantity ? parseFloat(quantity) : 1000,
    });

    res.json({ substitutions });
  } catch (error) {
    console.error('Error fetching substitutions:', error);
    res.status(500).json({ error: 'Failed to fetch substitutions' });
  }
});

// RFQs and quotes live in routes/rfqs.js and routes/quotes.js (/api/rfqs, /api/quotes).

// =============================================
// SALES DASHBOARD ENDPOINTS
// =============================================

/**
 * GET /sales/dashboard/stats
 * Get sales dashboard statistics
 */
router.get('/dashboard/stats', async (req, res) => {
  try {
    const { period = 'week' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'quarter':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 7));
    }

    // Get statistics
    const [
      newRfqs,
      quotesCreated,
      quotesSent,
      quotesAccepted,
      quotesLost,
      pipelineValue,
    ] = await Promise.all([
      prisma.rFQ.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.quote.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.quote.count({
        where: { 
          status: 'SENT',
          sentAt: { gte: startDate },
        },
      }),
      prisma.quote.count({
        where: { 
          status: 'ACCEPTED',
          acceptedAt: { gte: startDate },
        },
      }),
      prisma.quote.count({
        where: { 
          status: 'REJECTED',
          updatedAt: { gte: startDate },
        },
      }),
      prisma.quote.aggregate({
        _sum: { totalAmount: true },
        where: { 
          status: { in: ['DRAFT', 'SENT', 'COUNTERED'] },
        },
      }),
    ]);

    const winRate = quotesSent > 0 ? (quotesAccepted / quotesSent) * 100 : 0;

    res.json({
      period,
      pipeline: {
        newRfqs,
        inProgress: quotesCreated - quotesAccepted - quotesLost,
        awaitingResponse: quotesSent,
        wonThisWeek: quotesAccepted,
        lostThisWeek: quotesLost,
        totalValue: pipelineValue._sum.totalAmount || 0,
      },
      performance: {
        winRate: Math.round(winRate * 10) / 10,
        quotesCreated,
        quotesSent,
        quotesAccepted,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

/**
 * GET /sales/dashboard/leaderboard
 * Quotes won per person, from the quotes in the database.
 */
router.get('/dashboard/leaderboard', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const take = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const days = { today: 1, week: 7, month: 30, quarter: 90 }[period] || 30;
    const since = new Date(Date.now() - days * 864e5);
    const quotes = await prisma.quote.findMany({
      where: { createdAt: { gte: since }, createdById: { not: null } },
      select: { createdById: true, status: true, totalAmount: true },
    });
    const byRep = new Map();
    for (const q of quotes) {
      const r = byRep.get(q.createdById) || { quotes: 0, quotesWon: 0, revenue: 0 };
      r.quotes += 1;
      if (q.status === 'ACCEPTED') { r.quotesWon += 1; r.revenue += Number(q.totalAmount || 0); }
      byRep.set(q.createdById, r);
    }
    const users = await prisma.user.findMany({ where: { id: { in: [...byRep.keys()] } }, select: { id: true, firstName: true, lastName: true, email: true } });
    const leaderboard = users.map((u) => {
      const r = byRep.get(u.id);
      return {
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
        quotes: r.quotes, quotesWon: r.quotesWon, revenue: Math.round(r.revenue * 100) / 100,
        winRate: r.quotes ? Math.round((r.quotesWon / r.quotes) * 1000) / 10 : 0,
      };
    }).sort((a, b) => b.revenue - a.revenue || b.quotesWon - a.quotesWon).slice(0, take);
    res.json({ leaderboard, period });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;
