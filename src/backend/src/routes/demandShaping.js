/**
 * Demand shaping: soft suggestions (later ship date, quieter branch, standard
 * speed, off-peak window, consolidating with an open order) that spread load
 * without refusing an order, plus the analytics on what people accepted.
 *
 *   POST /api/demand-shaping/suggestions   body: order context → { data: Suggestion[] }
 *   POST /api/demand-shaping/accept        { suggestionId, orderId? }
 *   POST /api/demand-shaping/dismiss       { suggestionId, reason? }
 *   GET  /api/demand-shaping/analytics?period=LAST_30|LAST_90|LAST_YEAR
 *   GET/PUT /api/demand-shaping/config     branch load and discount tables
 *
 * Every suggestion shown is logged, so acceptance rates come from real use.
 */
import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import prisma from '../lib/db.js';
import { getSetting, putSetting } from '../lib/settings.js';

const router = Router();
const DAY = 86400000;
const TYPES = ['ALT_DATE', 'ALT_BRANCH', 'NON_RUSH', 'OFF_PEAK', 'CONSOLIDATE'];
const LOAD_SHIFTING = new Set(['ALT_DATE', 'ALT_BRANCH', 'OFF_PEAK']);

const addDays = (d, n) => new Date(new Date(d).getTime() + n * DAY);
const isoDay = (d) => d.toISOString().slice(0, 10);
const label = (d) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
const money = (n) => `$${Math.round(n).toLocaleString('en-US')}`;

function estimateSubtotal(lines) {
  if (!Array.isArray(lines) || lines.length === 0) return 2500;
  return lines.reduce((sum, l) => {
    const total = Number(l.lineTotal ?? l.extended ?? (Number(l.unitPrice) * Number(l.quantity ?? l.qty ?? 1)));
    return sum + (Number.isFinite(total) && total > 0 ? total : 500);
  }, 0);
}

/** Open sales order for the same customer shipping within a week, if any. */
async function findConsolidation(customerId) {
  if (!customerId) return null;
  const org = await prisma.organization.findFirst({ where: { OR: [{ id: customerId }, { code: customerId }] }, select: { id: true } });
  if (!org) return null;
  const now = new Date();
  return prisma.order.findFirst({
    where: {
      orderType: 'SO', buyerId: org.id, status: { in: ['PENDING', 'CONFIRMED', 'PARTIAL'] },
      promisedDate: { gte: now, lte: addDays(now, 7) },
    },
    orderBy: { promisedDate: 'asc' },
    select: { id: true, orderNumber: true, promisedDate: true },
  });
}

export function buildSuggestions(ctx, cfg, consolidation, now = new Date()) {
  const out = [];
  const subtotal = estimateSubtotal(ctx.lines);
  const id = () => `ds-${randomUUID()}`;
  const branches = cfg.branches || {};
  const branchKey = branches[ctx.branchKey] ? ctx.branchKey : Object.keys(branches)[0];
  const current = branches[branchKey];
  const isHighLoad = current ? current.load >= (cfg.highLoadThreshold ?? 0.8) : false;
  const shifts = cfg.dateShiftDiscounts || [];

  if ((ctx.requestedDate || isHighLoad) && shifts.length) {
    const base = ctx.requestedDate && !Number.isNaN(Date.parse(ctx.requestedDate)) ? new Date(ctx.requestedDate) : addDays(now, 2);
    const picks = isHighLoad ? [[shifts[1] || shifts[0], 1], [shifts[2], 3]] : [[shifts[0], 2]];
    picks.forEach(([s, priority], i) => {
      if (!s) return;
      const alt = addDays(base, s.daysLater);
      const savings = Math.round(subtotal * s.pct / 100);
      out.push({
        id: id(), type: 'ALT_DATE', priority,
        headline: i === 0 ? `Save ${s.pct}% — ship ${label(alt)} instead` : `Save ${s.pct}% — ship ${label(alt)}`,
        description: i === 0
          ? `Moving your ship date ${s.label} reduces peak load and saves you ${money(savings)}.`
          : `${s.label} later for ${money(savings)} off. Perfect if timing is flexible.`,
        savingsAmount: savings, savingsPct: s.pct, altDate: isoDay(alt), altDateLabel: label(alt),
        actionLabel: 'Use This Date', actionPayload: { field: 'requestedDate', value: isoDay(alt) },
      });
    });
  }

  if (isHighLoad) {
    const best = Object.entries(branches).filter(([k]) => k !== branchKey).sort((a, b) => a[1].load - b[1].load)[0];
    if (best && best[1].load < current.load - 0.1) {
      const [key, b] = best;
      const daysSaved = Math.max(0, current.queueDays - b.queueDays);
      out.push({
        id: id(), type: 'ALT_BRANCH', priority: 2,
        headline: `Ship from ${b.name} — ${daysSaved.toFixed(1)} days faster`,
        description: `${b.name} is at ${Math.round(b.load * 100)}% capacity (${Math.round((current.load - b.load) * 100)}% less than ${current.name}). Queue time: ~${b.queueDays} days.`,
        savingsAmount: 0, altBranchKey: key, altBranchId: b.id, altBranchName: b.name, altBranchLoad: b.load, daysSaved,
        actionLabel: `Switch to ${b.name}`, actionPayload: { field: 'location', value: key },
      });
    }
  }

  const rush = (cfg.nonRushSavings || {})[ctx.priority];
  if (rush) {
    const savings = Math.round(subtotal * rush.pctOff / 100);
    out.push({
      id: id(), type: 'NON_RUSH', priority: 1,
      headline: `Save ${rush.pctOff}% — switch to ${rush.downTo}`,
      description: `${rush.label}: Save ${money(savings)} by choosing ${rush.downTo.toLowerCase()} processing. Current queue times allow it.`,
      savingsAmount: savings, savingsPct: rush.pctOff, originalPriority: ctx.priority, suggestedPriority: rush.downTo,
      actionLabel: `Downgrade to ${rush.downTo}`, actionPayload: { field: 'priority', value: rush.downTo },
    });
  }

  const win = (cfg.offPeakWindows || [])[0];
  if (isHighLoad && win) {
    const savings = Math.round(subtotal * win.pctOff / 100);
    const d = addDays(now, win.daysOut);
    out.push({
      id: id(), type: 'OFF_PEAK', priority: 4,
      headline: `${win.pctOff}% off — schedule for ${win.label}`,
      description: `Off-peak scheduling saves ${money(savings)}. ${current.name} has open capacity ${win.label.toLowerCase()}.`,
      savingsAmount: savings, savingsPct: win.pctOff, windowLabel: win.label, altDate: isoDay(d),
      actionLabel: 'Schedule Off-Peak', actionPayload: { field: 'requestedDate', value: isoDay(d) },
    });
  }

  if (consolidation) {
    const pct = cfg.consolidatePct ?? 2;
    out.push({
      id: id(), type: 'CONSOLIDATE', priority: 5,
      headline: `Combine with open order ${consolidation.orderNumber}`,
      description: `This customer has ${consolidation.orderNumber} shipping ${label(new Date(consolidation.promisedDate))}. Consolidating saves a delivery run.`,
      savingsAmount: Math.round(subtotal * pct / 100), savingsPct: pct, relatedOrderId: consolidation.orderNumber,
      actionLabel: 'View & Consolidate', actionPayload: { field: 'consolidate', value: consolidation.orderNumber },
    });
  }

  return out.sort((a, b) => a.priority - b.priority);
}

router.post('/suggestions', async (req, res, next) => {
  try {
    const ctx = req.body || {};
    const cfg = await getSetting('demandShaping.config');
    const consolidation = ctx.source === 'CSR' ? await findConsolidation(ctx.customerId) : null;
    const data = buildSuggestions(ctx, cfg, consolidation);
    if (data.length) {
      await prisma.demandSuggestionEvent.createMany({
        data: data.map((s) => ({
          suggestionId: s.id, action: 'SHOWN', type: s.type, savingsAmount: s.savingsAmount || 0,
          source: ctx.source || null, branchKey: ctx.branchKey || null,
        })),
      });
    }
    res.json({ data });
  } catch (e) { next(e); }
});

async function record(req, res, next, action) {
  try {
    const { suggestionId, orderId, reason } = req.body || {};
    if (!suggestionId) return res.status(400).json({ error: 'suggestionId is required' });
    const shown = await prisma.demandSuggestionEvent.findFirst({ where: { suggestionId, action: 'SHOWN' } });
    if (!shown) return res.status(404).json({ error: 'Unknown suggestion' });
    const done = await prisma.demandSuggestionEvent.findFirst({ where: { suggestionId, action: { in: ['ACCEPTED', 'DISMISSED'] } } });
    if (done) return res.status(409).json({ error: `Suggestion already ${done.action.toLowerCase()}` });
    await prisma.demandSuggestionEvent.create({
      data: {
        suggestionId, action, type: shown.type, savingsAmount: shown.savingsAmount, source: shown.source,
        branchKey: shown.branchKey, orderId: orderId || null, reason: reason || null,
      },
    });
    res.json({ success: true, suggestionId, orderId: orderId || null });
  } catch (e) { next(e); }
}

router.post('/accept', (req, res, next) => record(req, res, next, 'ACCEPTED'));
router.post('/dismiss', (req, res, next) => record(req, res, next, 'DISMISSED'));

const PERIOD_DAYS = { LAST_7: 7, LAST_30: 30, LAST_90: 90, LAST_YEAR: 365 };
const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);

router.get('/analytics', async (req, res, next) => {
  try {
    const period = PERIOD_DAYS[req.query.period] ? req.query.period : 'LAST_30';
    const now = Date.now();
    const since = new Date(now - PERIOD_DAYS[period] * DAY);
    const trendSince = new Date(now - 12 * 7 * DAY);
    const events = await prisma.demandSuggestionEvent.findMany({
      where: { createdAt: { gte: since < trendSince ? since : trendSince } },
      select: { action: true, type: true, savingsAmount: true, createdAt: true },
    });
    const inPeriod = events.filter((e) => e.createdAt >= since);
    const shown = inPeriod.filter((e) => e.action === 'SHOWN');
    const accepted = inPeriod.filter((e) => e.action === 'ACCEPTED');
    const sum = (list) => Math.round(list.reduce((s, e) => s + Number(e.savingsAmount), 0));

    const byType = TYPES.map((type) => {
      const s = shown.filter((e) => e.type === type);
      const a = accepted.filter((e) => e.type === type);
      return { type, shown: s.length, accepted: a.length, pct: pct(a.length, s.length), savings: sum(a) };
    }).sort((x, y) => y.shown - x.shown);

    const weeklyTrend = [];
    for (let w = 11; w >= 0; w--) {
      const start = new Date(now - (w + 1) * 7 * DAY);
      const end = new Date(now - w * 7 * DAY);
      const week = events.filter((e) => e.createdAt >= start && e.createdAt < end);
      const acc = week.filter((e) => e.action === 'ACCEPTED');
      weeklyTrend.push({
        week: `${start.getUTCMonth() + 1}/${start.getUTCDate()}`,
        shown: week.filter((e) => e.action === 'SHOWN').length,
        accepted: acc.length,
        savings: sum(acc),
      });
    }

    res.json({
      data: {
        period,
        totalSuggestions: shown.length,
        accepted: accepted.length,
        acceptancePct: pct(accepted.length, shown.length),
        totalSavingsOffered: sum(shown),
        totalSavingsAccepted: sum(accepted),
        // Share of suggestions shown that moved work off a peak (later date, other branch, off-peak window).
        peakReductionPct: pct(accepted.filter((e) => LOAD_SHIFTING.has(e.type)).length, shown.length),
        byType,
        weeklyTrend,
      },
    });
  } catch (e) { next(e); }
});

router.get('/config', async (req, res, next) => {
  try { res.json({ data: await getSetting('demandShaping.config') }); } catch (e) { next(e); }
});

router.put('/config', async (req, res, next) => {
  try {
    const body = req.body || {};
    const current = await getSetting('demandShaping.config');
    const merged = { ...current, ...body };
    for (const [k, b] of Object.entries(merged.branches || {})) {
      if (!(b?.load >= 0 && b.load <= 1.5) || !(b?.queueDays >= 0) || !b?.name) {
        return res.status(400).json({ error: `Branch ${k} needs a name, a load between 0 and 1.5, and queueDays ≥ 0` });
      }
    }
    res.json({ data: await putSetting('demandShaping.config', merged), success: true });
  } catch (e) { next(e); }
});

export default router;
