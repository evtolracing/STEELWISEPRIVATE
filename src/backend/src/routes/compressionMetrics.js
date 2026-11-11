/**
 * Quote-to-ship compression metrics, computed from real sales orders:
 *
 *   QUOTE_TO_ORDER      quote sent (or created)  → order placed
 *   ONLINE_TO_CSR       web order received       → CSR accepted it
 *   ORDER_TO_SCHEDULED  order placed             → first job created
 *   SCHEDULED_TO_SHIP   first job created        → first shipment shipped
 *
 * Branch is the first shipment's location (or the CSR's home branch), CSR is
 * the order's creator, division is the first line's product division.
 *
 *   GET /api/metrics/compression?timeRange=&branchId=&division=&csrId=&source=
 *   GET /api/metrics/compression/{trend|branches|csrs|sla-risk|export|filters}
 */
import { Router } from 'express';
import prisma from '../lib/db.js';
import { getSetting } from '../lib/settings.js';

const router = Router();
const HOUR = 3600000;
const DAY = 24 * HOUR;
const STAGES = ['QUOTE_TO_ORDER', 'ONLINE_TO_CSR', 'ORDER_TO_SCHEDULED', 'SCHEDULED_TO_SHIP'];
const STAGE_LABELS = {
  QUOTE_TO_ORDER: 'Quote → Order',
  ONLINE_TO_CSR: 'Online → CSR Accept',
  ORDER_TO_SCHEDULED: 'Order → Scheduled',
  SCHEDULED_TO_SHIP: 'Scheduled → Shipped',
};
const DIVISIONS = ['METALS', 'PLASTICS', 'SUPPLIES', 'OUTLET'];

const round1 = (n) => Math.round(n * 10) / 10;
const hoursBetween = (a, b) => {
  if (!a || !b) return null;
  const h = (new Date(b) - new Date(a)) / HOUR;
  return h >= 0 ? round1(h) : null;
};
const earliest = (dates) => dates.filter(Boolean).map((d) => new Date(d)).sort((a, b) => a - b)[0] || null;

function rangeStart(timeRange, now = new Date()) {
  switch (timeRange) {
    case 'TODAY': return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    case 'THIS_WEEK': return new Date(now - 7 * DAY);
    case 'THIS_MONTH': return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    case 'LAST_30': return new Date(now - 30 * DAY);
    case 'LAST_90': return new Date(now - 90 * DAY);
    case 'LAST_YEAR': return new Date(now - 365 * DAY);
    default: return new Date(now - 90 * DAY);
  }
}

/** Loads sales orders in range and turns each into a timeline row. */
async function loadRows(q = {}) {
  const since = rangeStart(q.timeRange);
  const orders = await prisma.order.findMany({
    where: { orderType: 'SO', status: { not: 'CANCELLED' }, orderDate: { gte: since } },
    orderBy: { orderDate: 'desc' },
    take: 2000,
    select: {
      id: true, orderNumber: true, orderDate: true, totalAmount: true, subtotal: true,
      fromQuote: { select: { quoteNumber: true, sentAt: true, createdAt: true } },
      jobs: { select: { createdAt: true } },
      shipments: { select: { shippedAt: true, fromLocation: { select: { id: true, name: true } } } },
      createdBy: { select: { id: true, firstName: true, lastName: true, homeLocationId: true } },
      lines: { take: 1, orderBy: { lineNumber: 'asc' }, select: { product: { select: { division: true } } } },
    },
  });
  const web = await prisma.onlineOrder.findMany({
    where: { internalOrderId: { in: orders.map((o) => o.id) } },
    select: { internalOrderId: true, receivedAt: true, decidedAt: true },
  });
  const webBy = new Map(web.map((w) => [w.internalOrderId, w]));
  const homeIds = [...new Set(orders.map((o) => o.createdBy?.homeLocationId).filter(Boolean))];
  const homes = homeIds.length ? await prisma.location.findMany({ where: { id: { in: homeIds } }, select: { id: true, name: true } }) : [];
  const homeBy = new Map(homes.map((l) => [l.id, l]));

  const rows = orders.map((o) => {
    const w = webBy.get(o.id);
    const quoteAt = o.fromQuote ? o.fromQuote.sentAt || o.fromQuote.createdAt : null;
    const scheduledAt = earliest(o.jobs.map((j) => j.createdAt));
    const shippedAt = earliest(o.shipments.map((s) => s.shippedAt));
    const shipLoc = o.shipments.find((s) => s.fromLocation)?.fromLocation;
    const branch = shipLoc || homeBy.get(o.createdBy?.homeLocationId) || null;
    const startAt = quoteAt || w?.receivedAt || o.orderDate;
    const stages = {
      QUOTE_TO_ORDER: hoursBetween(quoteAt, o.orderDate),
      ONLINE_TO_CSR: w ? hoursBetween(w.receivedAt, w.decidedAt) : null,
      ORDER_TO_SCHEDULED: hoursBetween(o.orderDate, scheduledAt),
      SCHEDULED_TO_SHIP: hoursBetween(scheduledAt, shippedAt),
    };
    return {
      id: o.orderNumber,
      orderId: o.id,
      quoteId: o.fromQuote?.quoteNumber || null,
      branchId: branch?.id || null,
      branchName: branch?.name || 'Unassigned',
      csrId: o.createdBy?.id || null,
      csrName: o.createdBy ? `${o.createdBy.firstName} ${o.createdBy.lastName}`.trim() : 'Unknown',
      division: o.lines[0]?.product?.division || 'METALS',
      source: w ? 'ONLINE' : o.fromQuote ? 'QUOTE' : 'DIRECT',
      quoteDate: quoteAt ? new Date(quoteAt).toISOString() : null,
      orderDate: o.orderDate.toISOString(),
      csrAcceptDate: w?.decidedAt ? w.decidedAt.toISOString() : null,
      scheduledDate: scheduledAt ? scheduledAt.toISOString() : null,
      shippedDate: shippedAt ? shippedAt.toISOString() : null,
      stages,
      endToEndHours: shippedAt ? hoursBetween(startAt, shippedAt) : null,
      revenue: Number(o.totalAmount ?? o.subtotal ?? 0),
    };
  });

  return rows.filter((r) => (!q.branchId || r.branchId === q.branchId)
    && (!q.division || r.division === q.division)
    && (!q.csrId || r.csrId === q.csrId)
    && (!q.source || r.source === q.source));
}

function stats(values) {
  if (!values.length) return { avg: 0, median: 0, p90: 0, min: 0, max: 0, count: 0 };
  const s = [...values].sort((a, b) => a - b);
  return {
    avg: round1(s.reduce((t, v) => t + v, 0) / s.length),
    median: round1(s[Math.floor(s.length / 2)]),
    p90: round1(s[Math.min(s.length - 1, Math.floor(s.length * 0.9))]),
    min: round1(s[0]),
    max: round1(s[s.length - 1]),
    count: s.length,
  };
}
const slaStatus = (v, sla) => (v <= sla.warning ? 'GREEN' : v <= sla.target ? 'YELLOW' : 'RED');
const avg = (vals) => (vals.length ? round1(vals.reduce((s, v) => s + v, 0) / vals.length) : null);
const stageVals = (rows, stage) => rows.map((r) => r.stages[stage]).filter((v) => v != null);
const e2eVals = (rows) => rows.map((r) => r.endToEndHours).filter((v) => v != null);

function block(values, sla) {
  const s = stats(values);
  const breaches = values.filter((v) => v > sla.target).length;
  return { ...s, sla, slaStatus: slaStatus(s.avg, sla), breachCount: breaches, breachPct: values.length ? round1((breaches / values.length) * 100) : 0 };
}

function groupRow(rows, sla) {
  const row = { orderCount: rows.length };
  for (const stage of STAGES) {
    const v = stageVals(rows, stage);
    row[stage] = avg(v);
    row[`${stage}_sla`] = v.length ? slaStatus(row[stage], sla[stage]) : null;
  }
  const e = e2eVals(rows);
  row.endToEnd = avg(e);
  row.endToEnd_sla = e.length ? slaStatus(row.endToEnd, sla.END_TO_END) : null;
  return row;
}

const wrap = (fn) => async (req, res, next) => {
  try { res.json(await fn(req.query, await getSetting('metrics.slaTargets'))); } catch (e) { next(e); }
};

router.get('/', wrap(async (q, sla) => {
  const rows = await loadRows(q);
  const stages = Object.fromEntries(STAGES.map((s) => [s, block(stageVals(rows, s), sla[s])]));
  return {
    data: {
      stages,
      endToEnd: block(e2eVals(rows), sla.END_TO_END),
      totalOrders: rows.length,
      completedOrders: rows.filter((r) => r.shippedDate).length,
      inProgressOrders: rows.filter((r) => !r.shippedDate).length,
    },
  };
}));

router.get('/trend', wrap(async (q) => {
  const rows = await loadRows({ ...q, timeRange: q.timeRange === 'LAST_YEAR' ? 'LAST_YEAR' : 'LAST_90' });
  const now = Date.now();
  const weeks = [];
  for (let w = 11; w >= 0; w--) {
    const start = new Date(now - (w + 1) * 7 * DAY);
    const end = new Date(now - w * 7 * DAY);
    const wk = rows.filter((r) => new Date(r.orderDate) >= start && new Date(r.orderDate) < end);
    const point = { week: `${start.getUTCMonth() + 1}/${start.getUTCDate()}`, orderCount: wk.length };
    for (const s of STAGES) point[s] = avg(stageVals(wk, s));
    point.endToEnd = avg(e2eVals(wk));
    weeks.push(point);
  }
  return { data: weeks };
}));

router.get('/branches', wrap(async (q, sla) => {
  const rows = await loadRows(q);
  const groups = new Map();
  for (const r of rows) {
    const key = r.branchId || 'unassigned';
    if (!groups.has(key)) groups.set(key, { id: r.branchId || 'unassigned', name: r.branchName, rows: [] });
    groups.get(key).rows.push(r);
  }
  return { data: [...groups.values()].map((g) => ({ id: g.id, name: g.name, ...groupRow(g.rows, sla) })).sort((a, b) => b.orderCount - a.orderCount) };
}));

router.get('/csrs', wrap(async (q, sla) => {
  const rows = await loadRows(q);
  const groups = new Map();
  for (const r of rows) {
    const key = r.csrId || 'unknown';
    if (!groups.has(key)) groups.set(key, { id: key, name: r.csrName, rows: [] });
    groups.get(key).rows.push(r);
  }
  const data = [...groups.values()].map((g) => ({
    id: g.id,
    name: g.name,
    initials: g.name.split(/\s+/).map((p) => p[0] || '').join('').slice(0, 2).toUpperCase(),
    branch: g.rows[0]?.branchId || null,
    revenue: Math.round(g.rows.reduce((s, r) => s + r.revenue, 0) * 100) / 100,
    ...groupRow(g.rows, sla),
  }));
  data.sort((a, b) => (a.endToEnd ?? 9999) - (b.endToEnd ?? 9999));
  return { data };
}));

router.get('/sla-risk', wrap(async (q, sla) => {
  const rows = await loadRows(q);
  const risk = [];
  for (const r of rows) {
    for (const stage of STAGES) {
      const v = r.stages[stage];
      if (v == null || v <= sla[stage].warning) continue;
      risk.push({
        orderId: r.id, quoteId: r.quoteId, stage, stageLabel: STAGE_LABELS[stage], hours: v, slaTarget: sla[stage].target,
        slaStatus: v > sla[stage].target ? 'BREACH' : 'WARNING', branchName: r.branchName, csrName: r.csrName,
        division: r.division, orderDate: r.orderDate,
      });
    }
  }
  risk.sort((a, b) => (a.slaStatus === b.slaStatus ? b.hours - a.hours : a.slaStatus === 'BREACH' ? -1 : 1));
  return { data: risk.slice(0, 50), total: risk.length };
}));

router.get('/export', wrap(async (q) => {
  const rows = await loadRows(q);
  return {
    data: rows.map((o) => ({
      'Order ID': o.id,
      'Quote ID': o.quoteId,
      Branch: o.branchName,
      CSR: o.csrName,
      Division: o.division,
      Source: o.source,
      'Quote Date': o.quoteDate,
      'Order Date': o.orderDate,
      'Quote→Order (hrs)': o.stages.QUOTE_TO_ORDER,
      'Online→CSR (hrs)': o.stages.ONLINE_TO_CSR,
      'Order→Scheduled (hrs)': o.stages.ORDER_TO_SCHEDULED,
      'Scheduled→Shipped (hrs)': o.stages.SCHEDULED_TO_SHIP,
      'End-to-End (hrs)': o.endToEndHours,
      Revenue: o.revenue,
    })),
  };
}));

/** Branches, CSRs and divisions that appear in the last year of orders, for the filter menus. */
router.get('/filters', wrap(async (q, sla) => {
  const rows = await loadRows({ timeRange: 'LAST_YEAR' });
  const branches = new Map();
  const csrs = new Map();
  for (const r of rows) {
    if (r.branchId) branches.set(r.branchId, { id: r.branchId, name: r.branchName });
    if (r.csrId) csrs.set(r.csrId, { id: r.csrId, name: r.csrName, branch: r.branchId });
  }
  const byName = (a, b) => a.name.localeCompare(b.name);
  return { data: { branches: [...branches.values()].sort(byName), csrs: [...csrs.values()].sort(byName), divisions: DIVISIONS, slaTargets: sla } };
}));

export default router;
