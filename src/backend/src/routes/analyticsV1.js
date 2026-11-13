/**
 * Analytics API v1 Routes
 * Dashboard analytics for operations, shipping, margins, RFQ funnel, etc.
 */

import { Router } from 'express';
import prisma from '../lib/db.js';

const router = Router();

// ============================================
// OPERATIONS FORECAST
// ============================================

/**
 * GET /analytics/ops-forecast
 * Get operations forecast for planning
 */
router.get('/ops-forecast', async (req, res) => {
  try {
    const { locationId, division, horizonDays = 7 } = req.query;

    // Get today's jobs
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + parseInt(horizonDays));

    // Filter by work center location if specified
    const whereBase = {};
    if (locationId) {
      whereBase.workCenter = { locationId };
    }

    // Get jobs for today
    const todayJobs = await prisma.job.findMany({
      where: {
        ...whereBase,
        scheduledStart: { gte: today, lt: tomorrow },
      },
    });

    // Get jobs for tomorrow
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
    const tomorrowJobs = await prisma.job.findMany({
      where: {
        ...whereBase,
        scheduledStart: { gte: tomorrow, lt: tomorrowEnd },
      },
    });

    // Calculate metrics
    const todayLoad = todayJobs.reduce((sum, j) => sum + (j.estimatedMinutes || 60), 0);
    const tomorrowLoad = tomorrowJobs.reduce((sum, j) => sum + (j.estimatedMinutes || 60), 0);
    const capacity = 480; // 8 hours in minutes

    const hotJobs = todayJobs.filter(j => j.priority === 'HOT' || j.priority === 'RUSH').length;
    const atRiskJobs = todayJobs.filter(j => {
      if (!j.dueDate) return false;
      const due = new Date(j.dueDate);
      return due < new Date(Date.now() + 24 * 60 * 60 * 1000);
    }).length;

    // Build week ahead forecast
    const weekAhead = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < parseInt(horizonDays); i++) {
      const dayStart = new Date(today);
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayJobs = await prisma.job.findMany({
        where: {
          ...whereBase,
          scheduledStart: { gte: dayStart, lt: dayEnd },
        },
      });

      const load = dayJobs.reduce((sum, j) => sum + (j.estimatedMinutes || 60), 0);
      weekAhead.push({
        day: days[dayStart.getDay()],
        date: dayStart.toISOString().split('T')[0],
        load,
        capacity,
      });
    }

    // Detect trend
    const avgLoad = weekAhead.reduce((sum, d) => sum + d.load, 0) / weekAhead.length;
    const trend = avgLoad > capacity * 0.85 ? 'HIGH' : avgLoad < capacity * 0.5 ? 'LOW' : 'STABLE';

    // Generate alerts
    const alerts = [];
    weekAhead.forEach(day => {
      if (day.load > capacity * 0.9) {
        alerts.push({
          type: 'CAPACITY',
          message: `${day.day} load at ${Math.round((day.load / capacity) * 100)}% - consider overtime`,
          severity: 'WARNING',
        });
      }
    });

    res.json({
      today: {
        date: today.toISOString().split('T')[0],
        load: todayLoad,
        capacity,
        utilizationPercent: Math.round((todayLoad / capacity) * 100),
        jobsPlanned: todayJobs.length,
        hotJobs,
        atRiskJobs,
      },
      tomorrow: {
        date: tomorrow.toISOString().split('T')[0],
        load: tomorrowLoad,
        capacity,
        utilizationPercent: Math.round((tomorrowLoad / capacity) * 100),
        jobsPlanned: tomorrowJobs.length,
        hotJobs: tomorrowJobs.filter(j => j.priority === 'HOT' || j.priority === 'RUSH').length,
        atRiskJobs: 0,
      },
      weekAhead,
      trend,
      alerts,
    });
  } catch (error) {
    console.error('Error fetching ops forecast:', error);
    res.status(500).json({ error: 'Failed to fetch operations forecast' });
  }
});

// ============================================
// RFQ FUNNEL
// ============================================

/**
 * GET /analytics/rfq-funnel
 * Get RFQ to Quote to Order conversion funnel
 */
router.get('/rfq-funnel', async (req, res) => {
  try {
    const { locationId, division, dateRange = '30d' } = req.query;

    // Calculate date range
    const days = parseInt(dateRange) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // RFQ doesn't have locationId, so ignore it for now
    const rfqWhere = { createdAt: { gte: startDate } };
    const quoteWhere = { createdAt: { gte: startDate } };

    // Counted in the database; nothing is loaded into memory.
    const orderWhere = { createdAt: { gte: startDate }, orderType: 'SO' };
    const [rfqCount, quotedCount, orderedCount, quoteAgg, pipelineAgg, byCustomer] = await Promise.all([
      prisma.rFQ.count({ where: rfqWhere }),
      prisma.quote.count({ where: quoteWhere }),
      prisma.order.count({ where: orderWhere }),
      prisma.quote.aggregate({ where: quoteWhere, _avg: { totalAmount: true } }),
      prisma.quote.aggregate({ where: { ...quoteWhere, status: { in: ['DRAFT', 'PENDING_APPROVAL', 'SENT', 'COUNTERED'] } }, _sum: { totalAmount: true } }),
      prisma.rFQ.groupBy({ by: ['customerId'], where: rfqWhere, _count: { _all: true }, orderBy: { _count: { customerId: 'desc' } }, take: 5 }),
    ]);

    const rfqToQuoteRate = rfqCount > 0 ? Math.round((quotedCount / rfqCount) * 100) : 0;
    const quoteToOrderRate = quotedCount > 0 ? Math.round((orderedCount / quotedCount) * 100) : 0;
    const avgQuoteValue = Math.round(Number(quoteAgg._avg.totalAmount || 0));
    const totalPipelineValue = Number(pipelineAgg._sum.totalAmount || 0);

    const ids = byCustomer.map((c) => c.customerId);
    const [names, won] = await Promise.all([
      prisma.organization.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }),
      prisma.rFQ.groupBy({ by: ['customerId'], where: { ...rfqWhere, status: 'ACCEPTED', customerId: { in: ids } }, _count: { _all: true } }),
    ]);
    const topCustomers = byCustomer.map((c) => ({
      name: names.find((n) => n.id === c.customerId)?.name || 'Unknown',
      rfqs: c._count._all,
      converted: won.find((w) => w.customerId === c.customerId)?._count._all || 0,
    }));

    res.json({
      rfqCount,
      quotedCount,
      orderedCount,
      rfqToQuoteRate,
      quoteToOrderRate,
      avgQuoteValue,
      totalPipelineValue,
      avgResponseTime: null, // not measured: RFQs do not record when the first quote went out
      topCustomers,
    });
  } catch (error) {
    console.error('Error fetching RFQ funnel:', error);
    res.status(500).json({ error: 'Failed to fetch RFQ funnel' });
  }
});

// ============================================
// MARGIN INSIGHTS
// ============================================

/**
 * GET /analytics/margin
 * Get margin insights
 */
router.get('/margin', async (req, res) => {
  try {
    const { locationId, division, dateRange = '30d' } = req.query;

    // Calculate date range
    const days = parseInt(dateRange) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Revenue is summed in the database. Cost is not recorded on order
    // lines, so margin cannot be worked out and is reported as null instead
    // of an invented figure.
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const sales = { orderType: 'SO', status: { not: 'CANCELLED' } };
    const [orderCount, todayAgg] = await Promise.all([
      prisma.order.count({ where: { ...sales, createdAt: { gte: startDate } } }),
      prisma.order.aggregate({ where: { ...sales, createdAt: { gte: todayStart } }, _sum: { subtotal: true } }),
    ]);

    res.json({
      avgMargin: null,
      marginTrend: null,
      marginChange: null,
      discountedOrdersPercent: 0,
      avgDiscount: 0,
      topMarginCustomer: null,
      lowMarginAlert: 0,
      revenueToday: Math.round(Number(todayAgg._sum.subtotal || 0)),
      marginToday: null,
      byDivision: [],
      orderCount,
      marginAvailable: false,
      note: 'Margin is not available: order lines do not record cost.',
    });
  } catch (error) {
    console.error('Error fetching margin insights:', error);
    res.status(500).json({ error: 'Failed to fetch margin insights' });
  }
});

// ============================================
// WORK CENTER UTILIZATION
// ============================================

/**
 * GET /analytics/work-centers/utilization
 * Get work center utilization metrics
 */
router.get('/work-centers/utilization', async (req, res) => {
  try {
    const { locationId, division } = req.query;

    const where = { isActive: true };
    if (locationId) where.locationId = locationId;

    const workCenters = await prisma.workCenter.findMany({
      where,
      include: {
        jobs: {
          where: {
            status: { in: ['IN_PROCESS', 'SCHEDULED'] },
          },
        },
      },
    });

    // Calculate utilization for each work center
    const utilization = workCenters.map(wc => {
      const activeJobs = wc.jobs?.filter(j => j.status === 'IN_PROCESS').length || 0;
      const scheduledJobs = wc.jobs?.filter(j => j.status === 'SCHEDULED').length || 0;
      const totalMinutes = wc.jobs?.reduce((sum, j) => sum + (j.estimatedMinutes || 60), 0) || 0;
      const capacity = 480; // 8 hours
      const utilizationPercent = Math.min(Math.round((totalMinutes / capacity) * 100), 100);

      let status = 'NORMAL';
      if (utilizationPercent >= 90) status = 'CRITICAL';
      else if (utilizationPercent >= 75) status = 'WARNING';

      return {
        id: wc.id,
        workCenterId: wc.id,
        code: wc.code,
        name: wc.name,
        utilizationPercent,
        activeJobs,
        scheduledJobs,
        status,
      };
    });

    res.json(utilization);
  } catch (error) {
    console.error('Error fetching work center utilization:', error);
    res.status(500).json({ error: 'Failed to fetch work center utilization' });
  }
});

// ============================================
// INVENTORY RISK
// ============================================

/**
 * GET /analytics/inventory/risk
 * Get inventory risk analysis (low stock, critical items)
 */
router.get('/inventory/risk', async (req, res) => {
  try {
    const { locationId, division } = req.query;

    // Since we're using in-memory inventory, return mock data structure
    // In production, this would query actual inventory tables
    const loc = locationId || 'FWA';

    const summary = { critical: 2, low: 3, ok: 15 };
    const items = [
      { id: 'INV-002', materialCode: 'HR-A36-0250', description: 'Hot Rolled A36 0.25"', locationId: loc, status: 'LOW', availableQty: 180, reorderPoint: 300 },
      { id: 'INV-003', materialCode: 'SS-304-0125', description: 'Stainless 304 0.125"', locationId: loc, status: 'CRITICAL', availableQty: 45, reorderPoint: 200 },
      { id: 'INV-005', materialCode: 'BRASS-360-0500', description: 'Brass 360 0.5"', locationId: loc, status: 'LOW', availableQty: 95, reorderPoint: 150 },
    ];

    res.json({ summary, items });
  } catch (error) {
    console.error('Error fetching inventory risk:', error);
    res.status(500).json({ error: 'Failed to fetch inventory risk' });
  }
});

export default router;
