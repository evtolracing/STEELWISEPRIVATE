/**
 * Sales Dashboard: quoting pipeline and results, counted from the RFQs, quotes
 * and orders in the database. A figure that cannot be measured yet (margin,
 * because product costs are not recorded) is returned as null, never estimated.
 *
 *   GET /api/sales-dashboard?range=today|week|month|quarter
 */
import { Router } from 'express';
import prisma from '../lib/db.js';

const router = Router();
const num = (v) => Number(v || 0);
const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : null);

function rangeStart(range, now = new Date()) {
  const d = new Date(now); d.setHours(0, 0, 0, 0);
  if (range === 'today') return d;
  if (range === 'month') return new Date(d.getFullYear(), d.getMonth(), 1);
  if (range === 'quarter') return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday of this week
  return d;
}

router.get('/', async (req, res) => {
  try {
    const range = ['today', 'week', 'month', 'quarter'].includes(req.query.range) ? req.query.range : 'week';
    const from = rangeStart(range);
    const now = new Date();
    const soon = new Date(now.getTime() + 3 * 86400000);
    const dayAgo = new Date(now.getTime() - 86400000);
    const open = { in: ['DRAFT', 'PENDING_APPROVAL', 'SENT', 'COUNTERED'] };

    const [
      newRfqs, drafting, awaiting, openValue, decided, rfqsInRange, firstQuotes,
      recent, expiring, pendingApproval, unanswered, rfqsWon,
    ] = await Promise.all([
      prisma.rFQ.count({ where: { createdAt: { gte: from } } }),
      prisma.quote.count({ where: { status: { in: ['DRAFT', 'PENDING_APPROVAL'] } } }),
      prisma.quote.count({ where: { status: { in: ['SENT', 'COUNTERED'] } } }),
      prisma.quote.aggregate({ where: { status: open }, _sum: { totalAmount: true } }),
      // Quotes decided in the period, with who wrote them.
      prisma.quote.findMany({
        where: { status: { in: ['ACCEPTED', 'REJECTED', 'EXPIRED'] }, updatedAt: { gte: from } },
        select: { status: true, totalAmount: true, createdById: true },
        take: 5000,
      }),
      prisma.rFQ.findMany({ where: { createdAt: { gte: from } }, select: { id: true, createdAt: true }, take: 5000 }),
      prisma.quote.groupBy({ by: ['rfqId'], where: { rfq: { createdAt: { gte: from } } }, _min: { createdAt: true } }),
      prisma.quote.findMany({
        orderBy: { createdAt: 'desc' }, take: 8,
        select: { id: true, quoteNumber: true, status: true, totalAmount: true, createdAt: true, validUntil: true, rfq: { select: { customer: { select: { name: true } } } } },
      }),
      prisma.quote.count({ where: { status: { in: ['SENT', 'COUNTERED'] }, validUntil: { gte: now, lte: soon } } }),
      prisma.quote.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.rFQ.count({ where: { status: { in: ['SUBMITTED', 'IN_REVIEW'] }, createdAt: { lt: dayAgo }, quotes: { none: {} } } }),
      // RFQs received in the period that already have an accepted quote.
      prisma.rFQ.count({ where: { createdAt: { gte: from }, quotes: { some: { status: 'ACCEPTED' } } } }),
    ]);

    const won = decided.filter((q) => q.status === 'ACCEPTED');
    const lost = decided.filter((q) => q.status !== 'ACCEPTED');
    const wonValue = won.reduce((sum, q) => sum + num(q.totalAmount), 0);

    // Hours from an RFQ arriving to its first quote.
    const firstQuoteAt = new Map(firstQuotes.map((g) => [g.rfqId, g._min.createdAt]));
    const waits = rfqsInRange.filter((r) => firstQuoteAt.get(r.id)).map((r) => (firstQuoteAt.get(r.id) - r.createdAt) / 3600000);
    const avgResponseHours = waits.length ? Math.round((waits.reduce((a, b) => a + b, 0) / waits.length) * 10) / 10 : null;

    // Results by the person who wrote the quote.
    const byRep = new Map();
    for (const q of decided) {
      const key = q.createdById || 'unknown';
      const rep = byRep.get(key) || { userId: q.createdById, quotesWon: 0, decided: 0, revenue: 0 };
      rep.decided += 1;
      if (q.status === 'ACCEPTED') { rep.quotesWon += 1; rep.revenue += num(q.totalAmount); }
      byRep.set(key, rep);
    }
    const users = await prisma.user.findMany({ where: { id: { in: [...byRep.values()].map((r) => r.userId).filter(Boolean) } }, select: { id: true, firstName: true, lastName: true, email: true } });
    const nameOf = (id) => { const u = users.find((x) => x.id === id); return u ? [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email : 'Not recorded'; };
    const leaderboard = [...byRep.values()]
      .map((r) => ({ name: nameOf(r.userId), quotesWon: r.quotesWon, revenue: Math.round(r.revenue * 100) / 100, winRate: pct(r.quotesWon, r.decided) }))
      .sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    const alerts = [
      expiring && { type: 'EXPIRING', count: expiring, message: `${expiring} sent quote${expiring === 1 ? '' : 's'} expire within 3 days` },
      pendingApproval && { type: 'APPROVAL', count: pendingApproval, message: `${pendingApproval} quote${pendingApproval === 1 ? '' : 's'} awaiting approval` },
      unanswered && { type: 'OVERDUE', count: unanswered, message: `${unanswered} RFQ${unanswered === 1 ? '' : 's'} waiting more than a day for a quote` },
    ].filter(Boolean);

    res.json({
      range, from: from.toISOString(),
      pipeline: {
        newRfqs, drafting, awaitingCustomer: awaiting,
        won: won.length, lost: lost.length,
        openValue: Math.round(num(openValue._sum.totalAmount) * 100) / 100,
        avgWonValue: won.length ? Math.round((wonValue / won.length) * 100) / 100 : null,
      },
      performance: {
        winRate: pct(won.length, decided.length),
        avgResponseHours,
        conversionRate: pct(rfqsWon, rfqsInRange.length),
        // Not measurable yet: product costs are not recorded.
        avgMargin: null,
      },
      leaderboard,
      recentQuotes: recent.map((q) => ({ id: q.id, quoteNumber: q.quoteNumber, customer: q.rfq?.customer?.name || '', value: num(q.totalAmount), status: q.status, date: q.createdAt.toISOString().slice(0, 10) })),
      alerts,
    });
  } catch (error) {
    console.error('Sales dashboard failed:', error);
    res.status(500).json({ error: 'Failed to load the sales dashboard' });
  }
});

export default router;
