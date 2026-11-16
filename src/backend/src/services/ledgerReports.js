/**
 * Ledger reports, the reconciliation and the export batches (Phase 9.5).
 *
 *  - Every report reads posted entries only. Drafts are in no report.
 *  - A branch-scoped reader passes `branches`; every figure is then limited to lines of those branches.
 *  - The reconciliation compares the books with the business records. It never corrects anything.
 *    A difference stays a difference until a person deals with it.
 *  - An export batch is a file of posted entries for the accountant. Nothing is sent anywhere. An
 *    entry goes into one batch per provider, once.
 */
import crypto from 'node:crypto';
import { Prisma } from '@prisma/client';
import prisma from '../lib/db.js';
import { cents, ZERO, isoDay } from '../lib/ledgerRules.js';
import { LedgerError, activation, audit, record, movementKind } from './ledger.js';

const refuse = (status, message, code) => { throw new LedgerError(status, message, code); };
const S = Prisma.sql;
const money = (d) => cents(d || 0).toFixed(2);
const POSTED = S`e."status" = 'POSTED'`;
const day = (v, name) => { if (v == null || v === '') return null; const d = new Date(v); if (Number.isNaN(d.getTime())) refuse(400, `${name} is not a valid date`); return isoDay(d); };
const inBranches = (branches, col = S`l."locationId"`) => (branches == null ? S`TRUE` : branches.length ? S`${col} IN (${Prisma.join(branches)})` : S`FALSE`);
const between = (from, to) => S`${from ? S`e."entryDate" >= ${from}::date` : S`TRUE`} AND ${to ? S`e."entryDate" <= ${to}::date` : S`TRUE`}`;
const LINES = S`"JournalLine" l JOIN "JournalEntry" e ON e."id" = l."entryId" JOIN "LedgerAccount" a ON a."id" = l."accountId"`;
const codeOf = (key) => S`(SELECT m."accountCode" FROM "LedgerMapping" m WHERE m."key" = ${key})`;
const codesOf = (keys) => S`(SELECT m."accountCode" FROM "LedgerMapping" m WHERE m."key" IN (${Prisma.join(keys)}))`;
const STOCK_KEYS = ['INVENTORY_RAW', 'INVENTORY_FINISHED', 'INVENTORY_IN_TRANSIT'];
const ROUNDING_PER_ITEM = 0.05;

// ── Reports ──────────────────────────────────────────────────────────────────────────────────

/** Every account with its debits, credits and balance. The two totals are equal or the report says so. */
export async function trialBalance({ asOf, from, to, branches = null } = {}) {
  const [f, t] = [day(from, 'from'), day(to ?? asOf, 'to')];
  const rows = await prisma.$queryRaw(S`
    SELECT a."code", a."name", a."type", a."normalSide", COALESCE(SUM(l."debit"), 0)::text AS "debit", COALESCE(SUM(l."credit"), 0)::text AS "credit"
      FROM "LedgerAccount" a LEFT JOIN ("JournalLine" l JOIN "JournalEntry" e ON e."id" = l."entryId" AND ${POSTED} AND ${between(f, t)}) ON l."accountId" = a."id" AND ${inBranches(branches)}
     GROUP BY a."id" ORDER BY a."code"`);
  let debit = ZERO; let credit = ZERO;
  const accounts = rows.map((r) => {
    const d = cents(r.debit); const c = cents(r.credit); debit = debit.plus(d); credit = credit.plus(c);
    const net = d.minus(c);
    return { code: r.code, name: r.name, type: r.type, debit: money(d), credit: money(c), balance: money(r.normalSide === 'DEBIT' ? net : net.neg()), balanceSide: r.normalSide };
  });
  return { from: f, to: t, accounts, totals: { debit: money(debit), credit: money(credit) }, balanced: debit.equals(credit), scope: branches == null ? 'all branches' : 'your branches', note: branches == null ? null : 'Limited to lines of your branches. A branch view need not balance: the other side of an entry can sit at another branch.' };
}

/** The lines of one account, oldest first, with the balance brought forward. */
export async function accountActivity({ code, from, to, branches = null, limit = 200, offset = 0 } = {}) {
  const account = await prisma.ledgerAccount.findUnique({ where: { code: String(code || '') } });
  if (!account) refuse(404, 'Account not found');
  const [f, t] = [day(from, 'from'), day(to, 'to')];
  const take = Math.min(Math.max(parseInt(limit, 10) || 200, 1), 1000); const skip = Math.max(parseInt(offset, 10) || 0, 0);
  const sign = account.normalSide === 'DEBIT' ? S`(l."debit" - l."credit")` : S`(l."credit" - l."debit")`;
  const [before] = f ? await prisma.$queryRaw(S`SELECT COALESCE(SUM(${sign}), 0)::text AS v FROM ${LINES} WHERE a."id" = ${account.id} AND ${POSTED} AND e."entryDate" < ${f}::date AND ${inBranches(branches)}`) : [{ v: '0' }];
  const [count] = await prisma.$queryRaw(S`SELECT COUNT(*)::int AS n, COALESCE(SUM(l."debit"), 0)::text AS d, COALESCE(SUM(l."credit"), 0)::text AS c FROM ${LINES} WHERE a."id" = ${account.id} AND ${POSTED} AND ${between(f, t)} AND ${inBranches(branches)}`);
  const lines = await prisma.$queryRaw(S`
    SELECT e."id" AS "entryId", e."entryNumber", e."entryDate", e."kind", e."eventKind", COALESCE(l."memo", e."memo") AS "memo", l."debit"::text AS "debit", l."credit"::text AS "credit",
           l."locationId", loc."code" AS "branch", l."customerId", l."productId", l."coilId", l."jurisdiction"
      FROM ${LINES} LEFT JOIN "Location" loc ON loc."id" = l."locationId"
     WHERE a."id" = ${account.id} AND ${POSTED} AND ${between(f, t)} AND ${inBranches(branches)}
     ORDER BY e."entryDate", e."entryNumber", l."lineNumber" LIMIT ${take} OFFSET ${skip}`);
  const net = account.normalSide === 'DEBIT' ? cents(count.d).minus(count.c) : cents(count.c).minus(count.d);
  return { account: { code: account.code, name: account.name, type: account.type, normalSide: account.normalSide }, from: f, to: t, broughtForward: money(before.v), debit: money(count.d), credit: money(count.c), closing: money(cents(before.v).plus(net)), lines: lines.map((l) => ({ ...l, entryDate: isoDay(l.entryDate), debit: money(l.debit), credit: money(l.credit) })), meta: { lines: count.n, shown: lines.length, offset: skip } };
}

const ENTRY_INCLUDE = { lines: { orderBy: { lineNumber: 'asc' }, include: { account: { select: { code: true, name: true } } } }, period: { select: { year: true, month: true, status: true } }, reverses: { select: { id: true, entryNumber: true } }, reversedBy: { select: { id: true, entryNumber: true } } };
const entryOut = (e) => ({
  id: e.id, entryNumber: e.entryNumber, entryDate: isoDay(e.entryDate), status: e.status, kind: e.kind, eventKind: e.eventKind, sourceType: e.sourceType, sourceId: e.sourceId, ruleVersion: e.ruleVersion,
  currency: e.currency, locationId: e.locationId, legalEntityId: e.legalEntityId, memo: e.memo, total: e.totalDebit == null ? null : money(e.totalDebit), createdById: e.createdById, createdByService: e.createdByService, createdAt: e.createdAt, postedAt: e.postedAt, postedById: e.postedById,
  period: e.period ? `${e.period.year}-${String(e.period.month).padStart(2, '0')}` : null, periodStatus: e.period?.status || null,
  reverses: e.reverses || null, reversedBy: e.reversedBy || null,
  ...(e.lines && { lines: e.lines.map((l) => ({ lineNumber: l.lineNumber, account: l.account.code, accountName: l.account.name, debit: money(l.debit), credit: money(l.credit), locationId: l.locationId, division: l.division, customerId: l.customerId, supplierId: l.supplierId, productId: l.productId, coilId: l.coilId, jurisdiction: l.jurisdiction, memo: l.memo })) }),
});

export async function getEntry(id, { branches = null } = {}) {
  const e = await prisma.journalEntry.findUnique({ where: { id: String(id) }, include: ENTRY_INCLUDE }).catch(() => null);
  if (!e) refuse(404, 'Journal entry not found');
  if (branches != null && !e.lines.some((l) => l.locationId && branches.includes(l.locationId))) refuse(404, 'Journal entry not found');
  const out = entryOut(e);
  if (branches != null) out.lines = out.lines.filter((l) => l.locationId && branches.includes(l.locationId));
  return out;
}

export async function listEntries({ from, to, status, kind, eventKind, sourceId, q, branches = null, limit = 50, offset = 0 } = {}) {
  const [f, t] = [day(from, 'from'), day(to, 'to')];
  const take = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200); const skip = Math.max(parseInt(offset, 10) || 0, 0);
  const where = {
    ...(status && { status: String(status).toUpperCase() }), ...(kind && { kind: String(kind).toUpperCase() }), ...(eventKind && { eventKind: String(eventKind).toUpperCase() }), ...(sourceId && { sourceId: String(sourceId) }),
    ...((f || t) && { entryDate: { ...(f && { gte: new Date(f) }), ...(t && { lte: new Date(t) }) } }),
    ...(q && { OR: [{ entryNumber: { contains: String(q), mode: 'insensitive' } }, { memo: { contains: String(q), mode: 'insensitive' } }] }),
    ...(branches != null && { lines: { some: { locationId: { in: branches } } } }),
  };
  const [total, rows] = await Promise.all([prisma.journalEntry.count({ where }), prisma.journalEntry.findMany({ where, orderBy: [{ entryDate: 'desc' }, { entryNumber: 'desc' }], take, skip, include: { period: { select: { year: true, month: true, status: true } }, reversedBy: { select: { id: true, entryNumber: true } }, reverses: { select: { id: true, entryNumber: true } } } })]);
  return { entries: rows.map(entryOut), meta: { total, shown: rows.length, offset: skip } };
}

const GROUPS = {
  branch: { col: S`l."locationId"`, join: S`LEFT JOIN "Location" g ON g."id" = l."locationId"`, name: S`g."code" || ' ' || g."name"` },
  division: { col: S`l."division"`, join: Prisma.empty, name: S`l."division"` },
  customer: { col: S`l."customerId"`, join: S`LEFT JOIN "Organization" g ON g."id" = l."customerId"`, name: S`g."name"` },
  product: { col: S`l."productId"`, join: S`LEFT JOIN "Product" g ON g."id" = l."productId"`, name: S`g."sku" || ' ' || g."name"` },
};

/** Sales by branch, division, customer or product: revenue less returns and allowances, from the books. */
export async function revenue({ by = 'branch', from, to, branches = null } = {}) {
  const g = (Object.hasOwn(GROUPS, String(by)) && GROUPS[by]) || refuse(400, 'by must be branch, division, customer or product');
  const [f, t] = [day(from, 'from'), day(to, 'to')];
  const rows = await prisma.$queryRaw(S`
    SELECT ${g.col} AS "key", MAX(${g.name}) AS "name",
           COALESCE(SUM(l."credit" - l."debit") FILTER (WHERE a."type" = 'REVENUE'), 0)::text AS "sales",
           COALESCE(SUM(l."debit" - l."credit") FILTER (WHERE a."type" = 'CONTRA_REVENUE'), 0)::text AS "returns"
      FROM ${LINES} ${g.join}
     WHERE ${POSTED} AND a."type" IN ('REVENUE', 'CONTRA_REVENUE') AND ${between(f, t)} AND ${inBranches(branches)}
     GROUP BY ${g.col} ORDER BY SUM(l."credit" - l."debit") DESC`);
  const out = rows.map((r) => ({ key: r.key, name: r.name || (r.key ? String(r.key) : `(no ${by} on the line)`), sales: money(r.sales), returns: money(r.returns), net: money(cents(r.sales).minus(r.returns)) }));
  const total = out.reduce((s, r) => s.plus(r.net), ZERO);
  return { by, from: f, to: t, rows: out, total: money(total), note: by === 'product' || by === 'division' ? 'Freight billed has no product or division and is shown on its own line.' : null };
}

/** Sales less the cost of the material sold. Deliberately not called a profit and loss statement. */
export async function grossMargin({ by = 'branch', from, to, branches = null } = {}) {
  if (!['branch', 'division'].includes(by)) refuse(400, 'by must be branch or division');
  const g = GROUPS[by];
  const [f, t] = [day(from, 'from'), day(to, 'to')];
  const rows = await prisma.$queryRaw(S`
    SELECT ${g.col} AS "key", MAX(${g.name}) AS "name",
           COALESCE(SUM(CASE WHEN a."type" = 'REVENUE' THEN l."credit" - l."debit" WHEN a."type" = 'CONTRA_REVENUE' THEN l."credit" - l."debit" ELSE 0 END), 0)::text AS "netSales",
           COALESCE(SUM(l."debit" - l."credit") FILTER (WHERE a."code" = ${codeOf('COGS_MATERIAL')}), 0)::text AS "materialCost",
           COALESCE(SUM(l."debit" - l."credit") FILTER (WHERE a."code" = ${codeOf('SCRAP_WRITEOFF')}), 0)::text AS "scrap",
           COALESCE(SUM(l."debit" - l."credit") FILTER (WHERE a."code" IN ${codesOf(['COUNT_VARIANCE', 'COST_ADJUSTMENT', 'ROUNDING'])}), 0)::text AS "stockAdjustments"
      FROM ${LINES} ${g.join}
     WHERE ${POSTED} AND a."type" IN ('REVENUE', 'CONTRA_REVENUE', 'EXPENSE') AND ${between(f, t)} AND ${inBranches(branches)}
     GROUP BY ${g.col} ORDER BY 3 DESC`);
  const out = rows.map((r) => { const gm = cents(r.netSales).minus(r.materialCost); return { key: r.key, name: r.name || (r.key ? String(r.key) : `(no ${by} on the line)`), netSales: money(r.netSales), materialCost: money(r.materialCost), grossMarginOnMaterial: money(gm), percent: cents(r.netSales).isZero() ? null : Number(gm.div(r.netSales).mul(100).toFixed(1)), scrap: money(r.scrap), stockAdjustments: money(r.stockAdjustments) }; });
  return { by, from: f, to: t, rows: out, title: 'Gross margin on material', note: 'This is not a profit and loss statement. Labor, machine time, freight cost, overhead and everything kept outside this ledger are not in it. Scrap and stock adjustments are shown beside the margin and are not taken off it.' };
}

/** What the customers owe: the books beside the invoices, customer by customer. */
export async function receivables({ branches = null } = {}) {
  const ledger = await prisma.$queryRaw(S`SELECT l."customerId" AS "customerId", COALESCE(SUM(l."debit" - l."credit"), 0)::text AS v FROM ${LINES} WHERE ${POSTED} AND a."code" = ${codeOf('RECEIVABLES')} AND ${inBranches(branches)} GROUP BY l."customerId"`);
  const records = await prisma.$queryRaw(S`
    SELECT o."buyerId" AS "customerId", MAX(b."name") AS "name", COALESCE(SUM(i."totalAmount" - i."paidAmount"), 0)::text AS v,
           COALESCE(SUM(i."totalAmount" - i."paidAmount") FILTER (WHERE i."kind" <> 'CREDIT'), 0)::text AS "owed",
           COALESCE(SUM(i."paidAmount" - i."totalAmount") FILTER (WHERE i."kind" = 'CREDIT'), 0)::text AS "owedBack"
      FROM "Invoice" i JOIN "Order" o ON o."id" = i."orderId" LEFT JOIN "Organization" b ON b."id" = o."buyerId"
     WHERE i."status" <> 'CANCELLED' AND ${inBranches(branches, S`o."locationId"`)} GROUP BY o."buyerId"`);
  const byCustomer = new Map();
  for (const r of records) byCustomer.set(r.customerId || '', { customerId: r.customerId, name: r.name, records: cents(r.v), owed: cents(r.owed), owedBack: cents(r.owedBack), ledger: ZERO });
  for (const l of ledger) { const c = byCustomer.get(l.customerId || '') || { customerId: l.customerId, name: null, records: ZERO, owed: ZERO, owedBack: ZERO, ledger: ZERO }; c.ledger = cents(l.v); byCustomer.set(l.customerId || '', c); }
  const names = await prisma.organization.findMany({ where: { id: { in: [...byCustomer.values()].filter((c) => !c.name && c.customerId).map((c) => c.customerId) } }, select: { id: true, name: true } });
  const rows = [...byCustomer.values()].map((c) => ({ customerId: c.customerId, name: c.name || names.find((n) => n.id === c.customerId)?.name || '(no customer on the line)', owed: money(c.owed), creditOwedBack: money(c.owedBack), records: money(c.records), ledger: money(c.ledger), difference: money(c.ledger.minus(c.records)) })).filter((c) => c.records !== '0.00' || c.ledger !== '0.00');
  const sum = (k) => rows.reduce((s, r) => s.plus(r[k]), ZERO);
  rows.sort((a, b) => Math.abs(Number(b.difference)) - Math.abs(Number(a.difference)) || Number(b.records) - Number(a.records));
  return { asOf: new Date().toISOString(), totals: { owed: money(sum('owed')), creditOwedBack: money(sum('creditOwedBack')), records: money(sum('records')), ledger: money(sum('ledger')), difference: money(sum('ledger').minus(sum('records'))) }, differences: rows.filter((r) => r.difference !== '0.00').length, customers: rows.slice(0, 500), meta: { customers: rows.length }, note: 'Credit owed back to a customer is a credit balance inside receivables. It is shown in its own column and never netted against another customer.' };
}

/** Sales tax charged, less tax credited, by ship-to state. */
export async function salesTax({ from, to, branches = null } = {}) {
  const [f, t] = [day(from, 'from'), day(to, 'to')];
  const rows = await prisma.$queryRaw(S`
    SELECT l."jurisdiction" AS "state", COALESCE(SUM(l."credit"), 0)::text AS "charged", COALESCE(SUM(l."debit"), 0)::text AS "credited"
      FROM ${LINES} WHERE ${POSTED} AND a."code" = ${codeOf('SALES_TAX_PAYABLE')} AND ${between(f, t)} AND ${inBranches(branches)}
     GROUP BY l."jurisdiction" ORDER BY l."jurisdiction" NULLS LAST`);
  const out = rows.map((r) => ({ state: r.state || '(no state on record)', charged: money(r.charged), creditedOrPaid: money(r.credited), net: money(cents(r.charged).minus(r.credited)) }));
  return { from: f, to: t, rows: out, total: money(out.reduce((s, r) => s.plus(r.net), ZERO)), note: 'By state only: counties and cities are not on record. Remittances to a tax authority are not recorded by this product; an accountant\'s entry for one shows in the second column.' };
}

/** Per item: what the books hold beside quantity times cost on file. */
async function itemDifferences(limit = 200) {
  return prisma.$queryRaw(S`
    WITH booked AS (
      SELECT l."coilId" AS id, SUM(l."debit" - l."credit") AS v FROM ${LINES}
       WHERE ${POSTED} AND l."coilId" IS NOT NULL AND a."code" IN ${codesOf(STOCK_KEYS)} GROUP BY l."coilId"),
    rec AS (
      SELECT c."id" AS id, ROUND(v."qtyOnHand" * c."unitCost", 2) AS v FROM "Inventory" v JOIN "Coil" c ON c."id" = v."coilId" WHERE c."unitCost" > 0 AND v."qtyOnHand" > 0)
    SELECT COALESCE(b.id, r.id) AS "coilId", c."coilNumber" AS "number", loc."code" AS "branch", COALESCE(b.v, 0)::text AS "ledger", COALESCE(r.v, 0)::text AS "records",
           (COALESCE(b.v, 0) - COALESCE(r.v, 0))::text AS "difference", c."unitCost" IS NULL AS "uncosted"
      FROM booked b FULL JOIN rec r ON r.id = b.id JOIN "Coil" c ON c."id" = COALESCE(b.id, r.id) LEFT JOIN "Inventory" i ON i."coilId" = c."id" LEFT JOIN "Location" loc ON loc."id" = i."locationId"
     WHERE COALESCE(b.v, 0) <> COALESCE(r.v, 0)
     ORDER BY ABS(COALESCE(b.v, 0) - COALESCE(r.v, 0)) DESC LIMIT ${limit}`);
}

/** Stock value: the books beside the stock records, branch by branch, and the items that disagree. */
export async function inventoryValuation({ branches = null } = {}) {
  const ledger = await prisma.$queryRaw(S`
    SELECT l."locationId" AS "locationId", m."key" AS "key", COALESCE(SUM(l."debit" - l."credit"), 0)::text AS v
      FROM ${LINES} JOIN "LedgerMapping" m ON m."accountCode" = a."code" AND m."key" IN (${Prisma.join(STOCK_KEYS)})
     WHERE ${POSTED} AND ${inBranches(branches)} GROUP BY l."locationId", m."key"`);
  const records = await prisma.$queryRaw(S`
    SELECT v."locationId" AS "locationId", COUNT(*)::int AS "items",
           COALESCE(SUM(ROUND(v."qtyOnHand" * c."unitCost", 2)) FILTER (WHERE c."unitCost" > 0), 0)::text AS "value",
           COUNT(*) FILTER (WHERE c."unitCost" IS NULL)::int AS "uncosted"
      FROM "Inventory" v JOIN "Coil" c ON c."id" = v."coilId" WHERE v."qtyOnHand" > 0 AND ${inBranches(branches, S`v."locationId"`)} GROUP BY v."locationId"`);
  const locs = await prisma.location.findMany({ select: { id: true, code: true, name: true } });
  const by = new Map();
  const row = (id) => by.get(id || '') || by.set(id || '', { locationId: id, raw: ZERO, finished: ZERO, inTransit: ZERO, records: ZERO, items: 0, uncosted: 0 }).get(id || '');
  for (const l of ledger) { const r = row(l.locationId); if (l.key === 'INVENTORY_RAW') r.raw = cents(l.v); else if (l.key === 'INVENTORY_FINISHED') r.finished = cents(l.v); else r.inTransit = cents(l.v); }
  for (const x of records) { const r = row(x.locationId); r.records = cents(x.value); r.items = x.items; r.uncosted = x.uncosted; }
  const rows = [...by.values()].map((r) => { const led = r.raw.plus(r.finished).plus(r.inTransit); const loc = locs.find((l) => l.id === r.locationId); return { locationId: r.locationId, branch: loc ? `${loc.code} ${loc.name}` : '(no branch)', rawMaterial: money(r.raw), finishedGoods: money(r.finished), inTransit: money(r.inTransit), ledger: money(led), records: money(r.records), difference: money(led.minus(r.records)), items: r.items, uncostedItems: r.uncosted }; }).sort((a, b) => a.branch.localeCompare(b.branch));
  const sum = (k) => rows.reduce((s, r) => s.plus(r[k]), ZERO);
  const items = branches == null ? await itemDifferences(100) : [];
  return {
    asOf: new Date().toISOString(), method: 'Specific identification: each item at its own cost on file (proposed policy 6, not approved).', rows,
    totals: { rawMaterial: money(sum('rawMaterial')), finishedGoods: money(sum('finishedGoods')), inTransit: money(sum('inTransit')), ledger: money(sum('ledger')), records: money(sum('records')), difference: money(sum('ledger').minus(sum('records'))), uncostedItems: rows.reduce((s, r) => s + r.uncostedItems, 0) },
    itemsThatDisagree: items.map((i) => ({ ...i, ledger: money(i.ledger), records: money(i.records), difference: money(i.difference), withinRounding: Math.abs(Number(i.difference)) <= ROUNDING_PER_ITEM })),
    note: 'Items with no cost on file are counted and left out of both sides: they are not valued at zero. Stock in transit is held at the sending branch in the stock records until it is received.',
  };
}

/** Scrap and write-offs, from the books. */
export async function scrap({ from, to, branches = null } = {}) {
  const [f, t] = [day(from, 'from'), day(to, 'to')];
  const rows = await prisma.$queryRaw(S`
    SELECT l."locationId" AS "locationId", MAX(loc."code") AS "branch", e."eventKind" AS "cause", COUNT(*)::int AS "lines", COALESCE(SUM(l."debit" - l."credit"), 0)::text AS "amount"
      FROM ${LINES} LEFT JOIN "Location" loc ON loc."id" = l."locationId"
     WHERE ${POSTED} AND a."code" = ${codeOf('SCRAP_WRITEOFF')} AND ${between(f, t)} AND ${inBranches(branches)}
     GROUP BY l."locationId", e."eventKind" ORDER BY 2 NULLS LAST, 3`);
  const out = rows.map((r) => ({ ...r, amount: money(r.amount) }));
  return { from: f, to: t, rows: out, total: money(out.reduce((s, r) => s.plus(r.amount), ZERO)), note: 'At the cost on file of the item scrapped (proposed policy 9, not approved). No recovery value is recorded.' };
}

/** One month: every account's opening balance, movement and closing balance, and the period's state. */
export async function monthlyStatement({ year, month, branches = null } = {}) {
  const y = parseInt(year, 10); const m = parseInt(month, 10);
  if (!(y >= 2000 && y <= 2200) || !(m >= 1 && m <= 12)) refuse(400, 'Give a year and a month');
  const first = isoDay(new Date(Date.UTC(y, m - 1, 1))); const last = isoDay(new Date(Date.UTC(y, m, 0)));
  const rows = await prisma.$queryRaw(S`
    SELECT a."code", a."name", a."type", a."normalSide",
           COALESCE(SUM(l."debit" - l."credit") FILTER (WHERE e."entryDate" < ${first}::date), 0)::text AS "before",
           COALESCE(SUM(l."debit") FILTER (WHERE e."entryDate" >= ${first}::date), 0)::text AS "debit",
           COALESCE(SUM(l."credit") FILTER (WHERE e."entryDate" >= ${first}::date), 0)::text AS "credit"
      FROM "LedgerAccount" a LEFT JOIN ("JournalLine" l JOIN "JournalEntry" e ON e."id" = l."entryId" AND ${POSTED} AND e."entryDate" <= ${last}::date) ON l."accountId" = a."id" AND ${inBranches(branches)}
     GROUP BY a."id" ORDER BY a."code"`);
  const period = await prisma.ledgerPeriod.findUnique({ where: { year_month: { year: y, month: m } } });
  const balanceSheet = new Set(['ASSET', 'LIABILITY', 'EQUITY']);
  const accounts = rows.map((r) => {
    const s = r.normalSide === 'DEBIT' ? 1 : -1; const move = cents(r.debit).minus(r.credit);
    // Income and expense accounts start each statement at zero here; no year-end closing entry is made by this product.
    const opening = balanceSheet.has(r.type) ? cents(r.before).mul(s) : ZERO;
    return { code: r.code, name: r.name, type: r.type, opening: money(opening), debit: money(r.debit), credit: money(r.credit), closing: money(opening.plus(move.mul(s))) };
  });
  const total = (types, k = 'closing') => accounts.filter((a) => types.includes(a.type)).reduce((s, a) => s.plus(a[k]), ZERO);
  const sales = total(['REVENUE']).minus(total(['CONTRA_REVENUE'])); const expenses = total(['EXPENSE']);
  return {
    year: y, month: m, from: first, to: last, period: period ? period.status : 'NO ENTRIES', accounts,
    summary: { netSales: money(sales), expensesInThisLedger: money(expenses), salesLessExpensesInThisLedger: money(sales.minus(expenses)), assets: money(total(['ASSET'])), liabilities: money(total(['LIABILITY'])), equityAccounts: money(total(['EQUITY'])) },
    note: 'A statement of this ledger for the month. It is not a profit and loss statement or a balance sheet: payroll, rent, supplier invoices, bank activity and everything else kept in the accounting system are not here.',
  };
}

/** Events that did not post, with why. */
export async function exceptions({ status, limit = 100, offset = 0 } = {}) {
  const open = ['FAILED', 'RECONCILIATION_REQUIRED', 'PENDING'];
  const want = status ? [String(status).toUpperCase()] : open;
  const take = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500); const skip = Math.max(parseInt(offset, 10) || 0, 0);
  const [counts, rows] = await Promise.all([
    prisma.ledgerEvent.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.ledgerEvent.findMany({ where: { status: { in: want } }, orderBy: { occurredAt: 'asc' }, take, skip }),
  ]);
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
  return { counts: byStatus, open: open.reduce((s, k) => s + (byStatus[k] || 0), 0), events: rows, meta: { shown: rows.length, offset: skip } };
}

// ── What was never recorded ──────────────────────────────────────────────────────────────────

const MOVEMENT_KIND_SQL = S`CASE
  WHEN UPPER(COALESCE(m."reasonCode", '')) = 'WORK_ORDER' THEN NULL
  WHEN m."movementType"::text = 'SHIP' THEN 'STOCK_SHIPPED'
  WHEN m."movementType"::text = 'RECEIVE' AND UPPER(COALESCE(m."reasonCode", '')) IN ('CUSTOMER_RETURN', 'COUNTER_VOID') THEN 'RETURN_RESTOCKED'
  WHEN m."movementType"::text = 'RECEIVE' AND UPPER(COALESCE(m."reasonCode", '')) = 'CUT_PIECE' THEN 'PIECE_CUT'
  WHEN m."movementType"::text = 'RECEIVE' THEN 'STOCK_RECEIVED'
  WHEN m."movementType"::text = 'CONSUME' AND UPPER(COALESCE(m."reasonCode", '')) = 'CUT_PIECE' THEN NULL
  WHEN m."movementType"::text = 'CONSUME' THEN 'STOCK_CONSUMED'
  WHEN m."movementType"::text = 'SCRAP' THEN 'STOCK_SCRAPPED'
  WHEN m."movementType"::text IN ('ADJUST', 'COUNT') THEN 'STOCK_ADJUSTED'
  WHEN m."movementType"::text = 'TRANSFER' AND UPPER(COALESCE(m."reasonCode", '')) = 'TRANSFER_RECEIVED' THEN 'TRANSFER_RECEIVED'
  WHEN m."movementType"::text = 'TRANSFER' THEN 'STOCK_MOVED'
  ELSE 'STOCK_OTHER' END`;

/**
 * Business records made since the books began that have no ledger event at all (a save from before
 * a posting hook existed, a record written straight to the database, or a save while posting was stopped).
 */
export async function unrecorded({ limit = 500 } = {}) {
  const act = await activation();
  if (!act.effectiveDate || !act.activatedAt) return { since: null, total: 0, rows: [] };
  const since = new Date(act.activatedAt);
  const none = (kind, type, id) => S`NOT EXISTS (SELECT 1 FROM "LedgerEvent" x WHERE x."eventKind" = ${kind} AND x."sourceType" = ${type} AND x."sourceId" = ${id})`;
  const rows = await prisma.$queryRaw(S`
    SELECT * FROM (
      SELECT CASE WHEN i."kind" = 'CREDIT' THEN 'CREDIT_ISSUED' ELSE 'INVOICE_ISSUED' END AS "eventKind", 'Invoice' AS "sourceType", i."id" AS "sourceId", i."invoiceNumber" AS "reference", i."createdAt" AS "at"
        FROM "Invoice" i WHERE i."createdAt" >= ${since} AND i."status" <> 'CANCELLED' AND ${none(S`CASE WHEN i."kind" = 'CREDIT' THEN 'CREDIT_ISSUED' ELSE 'INVOICE_ISSUED' END`, 'Invoice', S`i."id"`)}
      UNION ALL
      SELECT CASE WHEN p."amount" < 0 THEN 'REFUND_RECORDED' ELSE 'PAYMENT_RECORDED' END, 'Payment', p."id", i."invoiceNumber", p."createdAt"
        FROM "Payment" p JOIN "Invoice" i ON i."id" = p."invoiceId" WHERE p."createdAt" >= ${since} AND p."paymentMethod" <> 'CREDIT' AND ${none(S`CASE WHEN p."amount" < 0 THEN 'REFUND_RECORDED' ELSE 'PAYMENT_RECORDED' END`, 'Payment', S`p."id"`)}
      UNION ALL
      SELECT k.kind, 'MaterialMovement', m."id", c."coilNumber", m."createdAt"
        FROM "MaterialMovement" m JOIN "Coil" c ON c."id" = m."coilId" CROSS JOIN LATERAL (SELECT ${MOVEMENT_KIND_SQL} AS kind) k
       WHERE m."createdAt" >= ${since} AND k.kind IS NOT NULL AND ${none(S`k.kind`, 'MaterialMovement', S`m."id"`)}
      UNION ALL
      SELECT 'TRANSFER_SHIPPED', 'StockTransferLine', tl."id", t."transferNumber", tl."createdAt"
        FROM "StockTransferLine" tl JOIN "StockTransfer" t ON t."id" = tl."transferId" WHERE tl."createdAt" >= ${since} AND t."status" <> 'CANCELLED' AND ${none('TRANSFER_SHIPPED', 'StockTransferLine', S`tl."id"`)}
      UNION ALL
      SELECT 'WORK_ORDER_COMPLETED', 'WorkOrder', w."id", w."woNumber", MAX(m."createdAt")
        FROM "WorkOrder" w JOIN "MaterialMovement" m ON m."workOrderId" = w."id" AND UPPER(COALESCE(m."reasonCode", '')) = 'WORK_ORDER'
       WHERE m."createdAt" >= ${since} AND ${none('WORK_ORDER_COMPLETED', 'WorkOrder', S`w."id"`)} GROUP BY w."id"
    ) u ORDER BY u."at" ASC LIMIT ${Math.min(Math.max(parseInt(limit, 10) || 500, 1), 5000)}`);
  return { since: act.activatedAt, total: rows.length, rows };
}

/**
 * Records what `unrecorded` finds, one event per transaction, oldest first. This is the recovery
 * path: an event that never reached the ledger is posted from its own record, by the same rule.
 */
export async function recordMissing({ limit = 500 } = {}, userId = null) {
  const act = await activation();
  if (!act.active) refuse(409, 'The ledger is not active');
  const found = await unrecorded({ limit });
  const out = { found: found.total, posted: 0, notPosted: 0, failed: 0, held: 0 };
  for (const r of found.rows) {
    const e = await prisma.$transaction((tx) => record(tx, r.eventKind, r.sourceType, r.sourceId, { retry: true, userId }), { timeout: 20_000 }).catch((error) => ({ status: 'FAILED', error }));
    if (e?.status === 'POSTED') out.posted += 1; else if (e?.status === 'NOT_POSTED') out.notPosted += 1; else if (e?.status === 'RECONCILIATION_REQUIRED') out.held += 1; else out.failed += 1;
  }
  if (found.total) await audit(prisma, { eventType: 'LEDGER_MISSING_RECORDED', userId, resourceType: 'Ledger', resourceId: 'recovery', details: out });
  return out;
}

// ── Reconciliation ───────────────────────────────────────────────────────────────────────────

const check = (key, title, { ledger = null, records = null, status, detail = [], note = null }) => {
  const difference = ledger != null && records != null ? money(cents(ledger).minus(records)) : null;
  return { key, title, status, ledger: ledger == null ? null : money(ledger), records: records == null ? null : money(records), difference, note, detail };
};

/**
 * Compares the books with the business records and stores the result. It changes nothing in either.
 * A check is MATCH, ROUNDING (cents left by valuing an item part by part, shown), DIFFERENCE,
 * EXCEPTIONS (events not posted) or INFO.
 */
export async function reconcile(userId = null) {
  const started = Date.now();
  const act = await activation();
  if (!act.effectiveDate) refuse(409, 'The books have not been started, so there is nothing to reconcile');
  const since = new Date(act.activatedAt);
  const checks = [];

  // 1. The books balance, and so does every entry.
  const [tot] = await prisma.$queryRaw(S`SELECT COALESCE(SUM(l."debit"), 0)::text AS d, COALESCE(SUM(l."credit"), 0)::text AS c, COUNT(DISTINCT e."id")::int AS n FROM "JournalLine" l JOIN "JournalEntry" e ON e."id" = l."entryId" WHERE ${POSTED}`);
  const bad = await prisma.$queryRaw(S`SELECT e."entryNumber", SUM(l."debit")::text AS d, SUM(l."credit")::text AS c FROM "JournalLine" l JOIN "JournalEntry" e ON e."id" = l."entryId" WHERE ${POSTED} GROUP BY e."id" HAVING SUM(l."debit") <> SUM(l."credit") OR SUM(l."debit") <> e."totalDebit" LIMIT 20`);
  checks.push(check('BOOKS_BALANCE', 'Debits equal credits, in total and in every entry', { ledger: tot.d, records: tot.c, status: cents(tot.d).equals(tot.c) && !bad.length ? 'MATCH' : 'DIFFERENCE', detail: bad, note: `${tot.n} posted entries` }));

  // 2. Receivables.
  const ar = await receivables();
  checks.push(check('RECEIVABLES', 'Accounts receivable: the books beside the open invoices and credits', { ledger: ar.totals.ledger, records: ar.totals.records, status: ar.differences ? 'DIFFERENCE' : 'MATCH', detail: ar.customers.filter((c) => c.difference !== '0.00').slice(0, 25) }));

  // 3. Stock, item by item.
  const items = await itemDifferences(5000);
  const real = items.filter((i) => Math.abs(Number(i.difference)) > ROUNDING_PER_ITEM);
  const [stockLedger] = await prisma.$queryRaw(S`SELECT COALESCE(SUM(l."debit" - l."credit"), 0)::text AS v FROM ${LINES} WHERE ${POSTED} AND a."code" IN ${codesOf(STOCK_KEYS)}`);
  const [stockRecords] = await prisma.$queryRaw(S`SELECT COUNT(*) FILTER (WHERE c."unitCost" IS NULL)::int AS "uncosted" FROM "Inventory" v JOIN "Coil" c ON c."id" = v."coilId" WHERE v."qtyOnHand" > 0`);
  const [stockCosted] = await prisma.$queryRaw(S`SELECT COALESCE(SUM(ROUND(v."qtyOnHand" * c."unitCost", 2)), 0)::text AS v FROM "Inventory" v JOIN "Coil" c ON c."id" = v."coilId" WHERE v."qtyOnHand" > 0 AND c."unitCost" > 0`);
  const roundingSum = items.filter((i) => Math.abs(Number(i.difference)) <= ROUNDING_PER_ITEM).reduce((s, i) => s.plus(i.difference), ZERO);
  checks.push(check('INVENTORY', 'Stock value: the books beside quantity on hand at cost, item by item', {
    ledger: stockLedger.v, records: stockCosted.v, status: real.length ? 'DIFFERENCE' : items.length ? 'ROUNDING' : 'MATCH',
    detail: real.slice(0, 25).map((i) => ({ ...i, ledger: money(i.ledger), records: money(i.records), difference: money(i.difference) })),
    note: `${real.length} item${real.length === 1 ? '' : 's'} disagree by more than ${ROUNDING_PER_ITEM.toFixed(2)}. ${items.length - real.length} item${items.length - real.length === 1 ? '' : 's'} differ by cents from valuing a part at a time (${money(roundingSum)} in all); each is cleared to Rounding when the item is used up. ${stockRecords.uncosted} item${stockRecords.uncosted === 1 ? ' has' : 's have'} no cost on file and ${stockRecords.uncosted === 1 ? 'is' : 'are'} in neither figure.`,
  }));

  // 4. Stock in transit.
  const [transitLedger] = await prisma.$queryRaw(S`SELECT COALESCE(SUM(l."debit" - l."credit"), 0)::text AS v FROM ${LINES} WHERE ${POSTED} AND a."code" = ${codeOf('INVENTORY_IN_TRANSIT')}`);
  const [transitRecords] = await prisma.$queryRaw(S`SELECT COALESCE(SUM(ROUND(tl."qtyShipped" * c."unitCost", 2)), 0)::text AS v FROM "StockTransferLine" tl JOIN "StockTransfer" t ON t."id" = tl."transferId" JOIN "Coil" c ON c."id" = tl."coilId" JOIN "Location" f ON f."id" = t."fromLocationId" JOIN "Location" g ON g."id" = t."toLocationId" WHERE t."status" = 'SHIPPED' AND c."unitCost" > 0 AND f."ownerId" = g."ownerId"`);
  checks.push(check('IN_TRANSIT', 'Stock in transit between branches', { ledger: transitLedger.v, records: transitRecords.v, status: cents(transitLedger.v).equals(cents(transitRecords.v)) ? 'MATCH' : 'DIFFERENCE', note: 'Transfers between branches of the same owner, at cost. A transfer between different owners is held as an exception and is in neither figure.' }));

  // 5-7. What was billed, taxed and collected since the books began, beside the books' own entries from business events.
  const inBooks = (type, id) => S`(${id} IN (SELECT x."sourceId" FROM "LedgerEvent" x WHERE x."sourceType" = ${type}))`;
  const [billed] = await prisma.$queryRaw(S`SELECT COALESCE(SUM(i."subtotal" + i."freightAmount"), 0)::text AS "revenue", COALESCE(SUM(i."taxAmount"), 0)::text AS "tax" FROM "Invoice" i WHERE i."status" <> 'CANCELLED' AND (i."createdAt" >= ${since} OR ${inBooks('Invoice', S`i."id"`)})`);
  const [paid] = await prisma.$queryRaw(S`SELECT COALESCE(SUM(p."amount"), 0)::text AS v FROM "Payment" p WHERE p."paymentMethod" <> 'CREDIT' AND (p."createdAt" >= ${since} OR ${inBooks('Payment', S`p."id"`)})`);
  const fromEvents = S`e."kind" IN ('SYSTEM', 'REVERSAL') AND e."eventKind" IS NOT NULL`;
  const [led] = await prisma.$queryRaw(S`
    SELECT COALESCE(SUM(l."credit" - l."debit") FILTER (WHERE a."type" IN ('REVENUE', 'CONTRA_REVENUE')), 0)::text AS "revenue",
           COALESCE(SUM(l."credit" - l."debit") FILTER (WHERE a."code" = ${codeOf('SALES_TAX_PAYABLE')}), 0)::text AS "tax",
           COALESCE(SUM(l."debit" - l."credit") FILTER (WHERE a."code" = ${codeOf('CASH_CLEARING')}), 0)::text AS "cash"
      FROM ${LINES} WHERE ${POSTED} AND ${fromEvents}`);
  const same = (a, b) => (cents(a).equals(cents(b)) ? 'MATCH' : 'DIFFERENCE');
  checks.push(check('REVENUE', 'Sales and freight billed, less credits, since the books began', { ledger: led.revenue, records: billed.revenue, status: same(led.revenue, billed.revenue) }));
  checks.push(check('SALES_TAX', 'Sales tax charged, less tax credited, since the books began', { ledger: led.tax, records: billed.tax, status: same(led.tax, billed.tax) }));
  checks.push(check('PAYMENTS', 'Payments received, less refunds, since the books began', { ledger: led.cash, records: paid.v, status: same(led.cash, paid.v), note: 'Payments recorded in this product. Whether the money reached the bank is not known here.' }));

  // 8. Events that did not post.
  const ex = await exceptions({ limit: 25 });
  checks.push(check('EVENTS', 'Business events that did not post', { status: ex.open ? 'EXCEPTIONS' : 'MATCH', detail: ex.events.map((e) => ({ id: e.id, eventKind: e.eventKind, sourceType: e.sourceType, sourceId: e.sourceId, status: e.status, reason: e.reason, occurredAt: e.occurredAt })), note: `${ex.open} open: ${Object.entries(ex.counts).map(([k, v]) => `${k} ${v}`).join(', ') || 'none recorded'}` }));

  // 9. Records with no event at all.
  const miss = await unrecorded({ limit: 200 });
  checks.push(check('COMPLETENESS', 'Business records since the books began with no ledger event', { status: miss.total ? 'EXCEPTIONS' : 'MATCH', detail: miss.rows.slice(0, 25), note: `${miss.total}${miss.total >= 200 ? ' or more' : ''} found. "Record what is missing" posts each from its own record.` }));

  // 10. Shipped, not billed (for the accountant's accrual; policy 1).
  const [notBilled] = await prisma.$queryRaw(S`SELECT COUNT(*)::int AS n FROM "Shipment" s WHERE s."status"::text IN ('IN_TRANSIT', 'DELIVERED') AND s."shippedAt" >= ${since} AND NOT EXISTS (SELECT 1 FROM "Invoice" i WHERE i."shipmentId" = s."id" AND i."status" <> 'CANCELLED')`);
  checks.push(check('SHIPPED_NOT_BILLED', 'Shipments that left and have no invoice of their own', { status: 'INFO', note: `${notBilled.n} since the books began. Their cost is in cost of goods; their revenue posts when they are invoiced.` }));

  const failing = checks.filter((c) => c.status === 'DIFFERENCE' || c.status === 'EXCEPTIONS');
  const row = await prisma.ledgerReconciliation.create({ data: { ranById: userId, asOf: new Date(), passed: failing.length === 0, exceptions: failing.length, checks } });
  return { id: row.id, ranAt: row.ranAt, passed: row.passed, failing: failing.map((c) => c.key), tookMs: Date.now() - started, checks, note: 'Nothing was corrected. A difference stays until its cause is dealt with.' };
}

export const lastReconciliations = (limit = 10) => prisma.ledgerReconciliation.findMany({ orderBy: { ranAt: 'desc' }, take: Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50), select: { id: true, ranAt: true, ranById: true, passed: true, exceptions: true } });
export const getReconciliation = async (id) => (await prisma.ledgerReconciliation.findUnique({ where: { id: String(id) } }).catch(() => null)) || refuse(404, 'Reconciliation not found');

// ── Export to an accounting system ───────────────────────────────────────────────────────────

export const PROVIDERS = ['GENERIC', 'QUICKBOOKS', 'XERO'];
const provider = (p) => { const v = String(p || '').toUpperCase(); if (!PROVIDERS.includes(v)) refuse(400, `provider must be one of: ${PROVIDERS.join(', ')}`); return v; };
const csv = (v) => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) || /^[=+\-@\t]/.test(s) ? `"${(/^[=+\-@\t]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"` : s; };

export async function externalAccounts(p) {
  const prov = provider(p);
  const [accounts, maps] = await Promise.all([prisma.ledgerAccount.findMany({ orderBy: { code: 'asc' } }), prisma.ledgerExternalAccount.findMany({ where: { provider: prov } })]);
  return { provider: prov, accounts: accounts.map((a) => ({ code: a.code, name: a.name, type: a.type, externalAccount: maps.find((m) => m.accountCode === a.code && m.scope === '*')?.externalAccount || null })) };
}

export async function setExternalAccount({ provider: p, accountCode, externalAccount }, userId) {
  const prov = provider(p); const ext = String(externalAccount || '').trim();
  const account = await prisma.ledgerAccount.findUnique({ where: { code: String(accountCode || '') } });
  if (!account) refuse(404, 'Account not found');
  if (ext.length > 120) refuse(400, 'The external account is too long');
  const key = { provider_accountCode_scope: { provider: prov, accountCode: account.code, scope: '*' } };
  if (!ext) { await prisma.ledgerExternalAccount.deleteMany({ where: { provider: prov, accountCode: account.code, scope: '*' } }); } else await prisma.ledgerExternalAccount.upsert({ where: key, create: { provider: prov, accountCode: account.code, scope: '*', externalAccount: ext }, update: { externalAccount: ext } });
  await audit(prisma, { eventType: 'LEDGER_EXTERNAL_ACCOUNT_SET', userId, resourceType: 'LedgerAccount', resourceId: account.id, details: { provider: prov, accountCode: account.code, externalAccount: ext || null } });
  return externalAccounts(prov);
}

/**
 * Builds a batch of posted entries not yet exported for this provider. Every account used must have
 * an external account: none is guessed. The batch is a file; nothing is sent to any accounting system.
 */
export async function createExport({ provider: p, from, to }, userId) {
  const prov = provider(p); const [f, t] = [day(from, 'from'), day(to, 'to')];
  if (!f || !t || f > t) refuse(400, 'Give the first and last day to export');
  return prisma.$transaction(async (tx) => {
    const entries = await tx.journalEntry.findMany({
      where: { status: 'POSTED', entryDate: { gte: new Date(f), lte: new Date(t) }, NOT: { id: { in: (await tx.ledgerExportItem.findMany({ where: { provider: prov }, select: { entryId: true } })).map((x) => x.entryId) } } },
      orderBy: [{ entryDate: 'asc' }, { entryNumber: 'asc' }], include: { lines: { orderBy: { lineNumber: 'asc' }, include: { account: { select: { code: true, name: true } } } }, period: { select: { status: true } } },
    });
    if (!entries.length) refuse(409, 'There are no posted entries in those dates that have not been exported already', 'NOTHING_TO_EXPORT');
    const maps = await tx.ledgerExternalAccount.findMany({ where: { provider: prov, scope: '*' } });
    const used = [...new Set(entries.flatMap((e) => e.lines.map((l) => l.account.code)))].sort();
    const missing = used.filter((c) => !maps.some((m) => m.accountCode === c && m.externalAccount));
    if (missing.length) refuse(409, `No ${prov} account is mapped for: ${missing.join(', ')}. Nothing was exported, and no account was substituted.`, 'MAPPING_MISSING');
    const locs = await tx.location.findMany({ select: { id: true, code: true } });
    const branch = (id) => locs.find((l) => l.id === id)?.code || '';
    const number = `EXP-${prov.slice(0, 2)}-${String((await tx.ledgerExportBatch.count()) + 1).padStart(5, '0')}`;
    const head = ['batch', 'entry_number', 'entry_date', 'entry_kind', 'reverses_entry', 'line', 'external_account', 'ledger_account', 'ledger_account_name', 'debit', 'credit', 'currency', 'branch', 'customer_id', 'product_id', 'tax_state', 'source', 'memo'];
    const numbers = new Map(entries.map((e) => [e.id, e.entryNumber]));
    const priorNumbers = new Map((await tx.journalEntry.findMany({ where: { id: { in: entries.map((e) => e.reversesEntryId).filter(Boolean) } }, select: { id: true, entryNumber: true } })).map((e) => [e.id, e.entryNumber]));
    const rows = entries.flatMap((e) => e.lines.map((l) => [number, e.entryNumber, isoDay(e.entryDate), e.kind, e.reversesEntryId ? (numbers.get(e.reversesEntryId) || priorNumbers.get(e.reversesEntryId) || '') : '', l.lineNumber, maps.find((m) => m.accountCode === l.account.code).externalAccount, l.account.code, l.account.name, money(l.debit), money(l.credit), e.currency, branch(l.locationId), l.customerId || '', l.productId || '', l.jurisdiction || '', e.eventKind ? `${e.eventKind}:${e.sourceId}` : '', l.memo || e.memo || '']));
    const total = entries.reduce((s, e) => s.plus(e.totalDebit), ZERO);
    const content = [`# STEELWISE journal export, format 1, for ${prov}. Batch ${number}, ${f} to ${t}, ${entries.length} entries, total debits ${money(total)}.`, '# This file has not been validated for import into any accounting product. Have the accountant confirm the layout before it is loaded anywhere.', head.join(','), ...rows.map((r) => r.map(csv).join(','))].join('\n');
    const checksum = crypto.createHash('sha256').update(content).digest('hex');
    const batch = await tx.ledgerExportBatch.create({ data: { batchNumber: number, provider: prov, fromDate: new Date(f), toDate: new Date(t), status: 'GENERATED', entryCount: entries.length, totalDebit: total, checksum, content, createdById: userId, items: { create: entries.map((e) => ({ provider: prov, entryId: e.id })) } } });
    await audit(tx, { eventType: 'LEDGER_EXPORT_CREATED', userId, resourceType: 'LedgerExportBatch', resourceId: batch.id, details: { batchNumber: number, provider: prov, from: f, to: t, entries: entries.length, totalDebit: money(total), checksum, includesOpenPeriod: entries.some((e) => e.period.status === 'OPEN') }, action: 'CREATE' });
    return batchOut(batch, { includesOpenPeriod: entries.some((e) => e.period.status === 'OPEN') });
  }, { timeout: 120_000 }).catch((error) => {
    if (error?.code === 'P2002') refuse(409, 'Another export took some of these entries at the same moment. Run the export again.', 'EXPORT_OVERLAP');
    throw error;
  });
}

const batchOut = (b, extra = {}) => ({ id: b.id, batchNumber: b.batchNumber, provider: b.provider, from: isoDay(b.fromDate), to: isoDay(b.toDate), status: b.status, entryCount: b.entryCount, totalDebit: money(b.totalDebit), checksum: b.checksum, error: b.error, externalReference: b.externalReference, createdAt: b.createdAt, createdById: b.createdById, acknowledgedAt: b.acknowledgedAt, ...extra });
export const listExports = async () => (await prisma.ledgerExportBatch.findMany({ orderBy: { createdAt: 'desc' }, take: 100, select: { id: true, batchNumber: true, provider: true, fromDate: true, toDate: true, status: true, entryCount: true, totalDebit: true, checksum: true, error: true, externalReference: true, createdAt: true, createdById: true, acknowledgedAt: true } })).map((b) => batchOut(b));
export async function exportFile(id, userId) {
  const b = await prisma.ledgerExportBatch.findUnique({ where: { id: String(id) } }).catch(() => null);
  if (!b) refuse(404, 'Export batch not found');
  await audit(prisma, { eventType: 'LEDGER_EXPORT_DOWNLOADED', userId, resourceType: 'LedgerExportBatch', resourceId: b.id, details: { batchNumber: b.batchNumber }, action: 'READ' });
  return { ...batchOut(b), content: b.content };
}

/**
 * The accountant says what became of a batch: ACKNOWLEDGED (loaded; give the reference from the
 * accounting system), FAILED (it did not load; its entries stay in the batch for a second try) or
 * VOID (the batch is withdrawn and its entries can go into a new one).
 */
export async function settleExport(id, { status, externalReference, error }, userId) {
  const want = String(status || '').toUpperCase();
  if (!['ACKNOWLEDGED', 'FAILED', 'VOID'].includes(want)) refuse(400, 'status must be ACKNOWLEDGED, FAILED or VOID');
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw`SELECT "id" FROM "LedgerExportBatch" WHERE "id" = ${String(id)} FOR UPDATE`;
    if (!rows.length) refuse(404, 'Export batch not found');
    const b = await tx.ledgerExportBatch.findUnique({ where: { id: String(id) } });
    if (b.status === 'ACKNOWLEDGED') refuse(409, 'This batch was already loaded into the accounting system. It cannot be changed; correct the books by a reversal, which goes in a later batch.', 'ALREADY_FINAL');
    if (b.status === 'VOID') refuse(409, 'This batch was withdrawn', 'ALREADY_FINAL');
    const ref = String(externalReference || '').trim(); const why = String(error || '').trim();
    if (want === 'ACKNOWLEDGED' && ref.length < 2) refuse(400, 'Give the reference the accounting system gave this batch');
    if (want !== 'ACKNOWLEDGED' && why.length < 5) refuse(400, 'Say what happened (at least 5 characters)');
    if (want === 'VOID') await tx.ledgerExportItem.deleteMany({ where: { batchId: b.id } });
    const out = await tx.ledgerExportBatch.update({ where: { id: b.id }, data: { status: want, ...(want === 'ACKNOWLEDGED' ? { externalReference: ref, acknowledgedAt: new Date(), acknowledgedById: userId, error: null } : { error: why.slice(0, 1000) }) } });
    await audit(tx, { eventType: `LEDGER_EXPORT_${want}`, userId, resourceType: 'LedgerExportBatch', resourceId: b.id, details: { batchNumber: b.batchNumber, externalReference: ref || null, error: why || null } });
    return batchOut(out);
  });
}

export { movementKind };
