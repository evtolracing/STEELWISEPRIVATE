/**
 * Starting the books (Phase 9.5, policy decision 16).
 *
 *  - No history is rebuilt. The books start on the day the ledger is activated.
 *  - `dryRun` reads the records as they stand and shows what the opening balances would be. It writes
 *    nothing to the books. It can be run as often as wanted.
 *  - `activate` needs every account and mapping approved, the accountant's name, and a dry run that
 *    was looked at. In one transaction it takes the opening balances from the records at that moment
 *    and posts them against Opening Balance Equity. Business saves wait for that transaction, so no
 *    event falls between the opening balances and the first posted entry.
 *  - Stock with no cost on file is listed and left out. It is never valued at zero. When its cost is
 *    entered later, the value comes onto the books against Opening Balance Equity.
 *  - Nothing is opened for accounts the records cannot support: sales tax owed, goods received and
 *    not invoiced by the supplier, cash. Those are the accountant's to enter.
 */
import { Prisma } from '@prisma/client';
import prisma from '../lib/db.js';
import { cents, valueOf, usableCost, dayIn, isoDay, isTimeZone, RULE_VERSION, ZERO, SANDBOX_APPROVER } from '../lib/ledgerRules.js';
import { LedgerError, ACTIVATION_KEY, activation, activationBlockers, accountsByKey, writeEntries, record, audit, loadProposedChart, approve } from './ledger.js';

const refuse = (status, message, code) => { throw new LedgerError(status, message, code); };
const CHUNK = 400;
const money = (d) => cents(d).toFixed(2);

/** What the records hold right now, in the shape of opening balances. Reads only. */
export async function openingSnapshot(db = prisma) {
  const receivables = await db.$queryRaw`
    SELECT o."buyerId" AS "customerId", b."name" AS "customerName", o."locationId" AS "locationId",
           COUNT(*)::int AS "documents",
           COALESCE(SUM(i."totalAmount" - i."paidAmount") FILTER (WHERE i."kind" <> 'CREDIT'), 0)::text AS "owed",
           COALESCE(SUM(i."paidAmount" - i."totalAmount") FILTER (WHERE i."kind" = 'CREDIT'), 0)::text AS "owedBack"
      FROM "Invoice" i JOIN "Order" o ON o."id" = i."orderId" LEFT JOIN "Organization" b ON b."id" = o."buyerId"
     WHERE i."status" <> 'CANCELLED' AND i."totalAmount" <> i."paidAmount"
     GROUP BY o."buyerId", b."name", o."locationId"
     ORDER BY b."name" NULLS LAST, o."locationId" NULLS LAST`;
  const stock = await db.$queryRaw`
    SELECT c."id" AS "coilId", c."coilNumber" AS "number", c."productId" AS "productId", p."division"::text AS "division",
           v."locationId" AS "locationId", l."code" AS "branch", v."qtyOnHand"::text AS "qty", v."unit" AS "unit",
           c."unitCost"::text AS "unitCost", v."status"::text AS "status",
           EXISTS (SELECT 1 FROM "WorkOrderOutput" w WHERE w."outputCoilId" = c."id") AS "finished"
      FROM "Inventory" v JOIN "Coil" c ON c."id" = v."coilId" LEFT JOIN "Product" p ON p."id" = c."productId" LEFT JOIN "Location" l ON l."id" = v."locationId"
     WHERE v."qtyOnHand" > 0
     ORDER BY l."code" NULLS LAST, c."coilNumber"`;
  const inTransit = await db.$queryRaw`
    SELECT tl."id" AS "lineId", tl."coilId" AS "coilId", t."transferNumber" AS "transferNumber", t."fromLocationId" AS "fromLocationId", t."toLocationId" AS "toLocationId"
      FROM "StockTransferLine" tl JOIN "StockTransfer" t ON t."id" = tl."transferId" WHERE t."status" = 'SHIPPED'`;
  const notBilled = await db.$queryRaw`
    SELECT s."id" AS "shipmentId", s."shipmentNumber" AS "shipmentNumber", s."orderId" AS "orderId", s."shippedAt" AS "shippedAt"
      FROM "Shipment" s
     WHERE s."status"::text IN ('IN_TRANSIT', 'DELIVERED') AND NOT EXISTS (SELECT 1 FROM "Invoice" i WHERE i."shipmentId" = s."id" AND i."status" <> 'CANCELLED')
       AND EXISTS (SELECT 1 FROM "Order" o JOIN "OrderLine" ol ON ol."orderId" = o."id" LEFT JOIN (SELECT il."orderLineId", SUM(il."quantity") q FROM "InvoiceLine" il JOIN "Invoice" i2 ON i2."id" = il."invoiceId" WHERE i2."status" <> 'CANCELLED' AND i2."kind" = 'INVOICE' GROUP BY 1) b ON b."orderLineId" = ol."id" WHERE o."id" = s."orderId" AND COALESCE(ol."qtyShipped", 0) > COALESCE(b.q, 0))
     ORDER BY s."shippedAt" NULLS LAST LIMIT 500`;

  const items = []; const uncosted = [];
  let stockValue = ZERO;
  for (const r of stock) {
    const cost = usableCost(r.unitCost);
    if (cost == null) { uncosted.push({ coilId: r.coilId, number: r.number, branch: r.branch, qty: r.qty, unit: r.unit }); continue; }
    const value = valueOf(r.qty, cost);
    if (value.isZero()) continue;
    items.push({ coilId: r.coilId, number: r.number, productId: r.productId, division: r.division, locationId: r.locationId, branch: r.branch, qty: r.qty, unit: r.unit, unitCost: r.unitCost, finished: r.finished, inTransit: r.status === 'IN_TRANSIT', value });
    stockValue = stockValue.plus(value);
  }
  const customers = receivables.map((r) => ({ ...r, owed: cents(r.owed), owedBack: cents(r.owedBack) })).filter((r) => !r.owed.isZero() || !r.owedBack.isZero());
  const owed = customers.reduce((s, r) => s.plus(r.owed), ZERO);
  const owedBack = customers.reduce((s, r) => s.plus(r.owedBack), ZERO);
  const byBranch = new Map();
  for (const it of items) { const b = byBranch.get(it.branch || '') || { branch: it.branch || null, items: 0, value: ZERO }; b.items += 1; b.value = b.value.plus(it.value); byBranch.set(it.branch || '', b); }
  return {
    customers, items, uncosted, inTransit, notBilled,
    totals: {
      receivables: money(owed), creditOwedBack: money(owedBack), netReceivables: money(owed.minus(owedBack)),
      stockItems: items.length, stockValue: money(stockValue), stockInTransit: money(items.filter((i) => i.inTransit).reduce((s, i) => s.plus(i.value), ZERO)),
      uncostedItems: uncosted.length, shippedNotBilled: notBilled.length,
    },
    byBranch: [...byBranch.values()].map((b) => ({ ...b, value: money(b.value) })),
  };
}

const forPeople = (snap, limit = 200) => ({
  totals: snap.totals, byBranch: snap.byBranch,
  receivables: snap.customers.slice(0, limit).map((c) => ({ customerId: c.customerId, customerName: c.customerName, locationId: c.locationId, documents: c.documents, owed: money(c.owed), creditOwedBack: money(c.owedBack) })),
  uncosted: snap.uncosted.slice(0, limit), shippedNotBilled: snap.notBilled.slice(0, limit),
  notOpened: [
    'Sales tax owed to the states: the records hold what was charged, not what has been remitted.',
    'Goods received and not yet invoiced by the supplier: supplier invoices are not in this product.',
    'Cash and bank balances.',
    'Any shipment listed under "shipped, not billed": its cost left stock before the books began; its invoice will post revenue after.',
  ],
  shown: { receivables: Math.min(snap.customers.length, limit), of: snap.customers.length, uncosted: Math.min(snap.uncosted.length, limit), ofUncosted: snap.uncosted.length },
});

/** Shows what the opening balances would be. Posts nothing. The run is logged so activation can name it. */
export async function dryRun(userId) {
  const blockers = await activationBlockers();
  const snap = await openingSnapshot();
  const act = await activation();
  const log = await audit(prisma, { eventType: 'LEDGER_CUTOVER_DRY_RUN', userId, resourceType: 'Ledger', resourceId: 'cutover', details: { totals: snap.totals, blockers: blockers.length }, action: 'READ' });
  return { dryRunId: log.id, ranAt: log.timestamp, alreadyActive: act.active, blockers, ...forPeople(snap) };
}

/** One branch's lines as entries of at most CHUNK lines, each balanced against Opening Balance Equity. Writes nothing. */
function openingEntries({ lines, locationId, legalEntityId, memo, accounts }) {
  const out = [];
  for (let i = 0; i < lines.length; i += CHUNK) {
    const part = lines.slice(i, i + CHUNK);
    const net = part.reduce((s, l) => (l.side === 'D' ? s.plus(l.amount) : s.minus(l.amount)), ZERO);
    const all = net.isZero() ? part : [...part, { accountId: accounts.get('OPENING_EQUITY').id, side: net.isPositive() ? 'C' : 'D', amount: net.abs(), locationId }];
    if (all.length < 2) continue;
    out.push({ kind: 'OPENING', lines: all, memo, locationId, legalEntityId });
  }
  return out;
}

/**
 * Turns posting on, today, and posts the opening balances from the records as they are at this moment.
 *   policiesApprovedBy / policiesApprovedOn  the accountant who approved the accounting policies, and when
 *   dryRunId                                 a dry run made in the last 7 days (it was looked at before this)
 *   timeZone                                 the zone the books' days are counted in
 *   throughWip                               show work orders passing through Work in Progress
 */
export async function activate({ policiesApprovedBy, policiesApprovedOn, dryRunId, timeZone, throughWip = false }, userId, { sandbox = false } = {}) {
  const who = String(policiesApprovedBy || '').trim();
  // Only the sandbox start may use the sandbox name: real books cannot be opened under it by the ordinary path, and sandbox books are always marked.
  if (!sandbox && /^\s*sandbox/i.test(who)) refuse(400, 'That name is kept for demonstration books. Give the name of the accountant who approved the accounting policies');
  if (who.length < 3) refuse(400, 'Give the name of the accountant who approved the accounting policies');
  const on = policiesApprovedOn ? new Date(policiesApprovedOn) : null;
  if (!on || Number.isNaN(on.getTime()) || on.getTime() > Date.now() + 86_400_000) refuse(400, 'Give the date the accounting policies were approved');
  if (!isTimeZone(timeZone)) refuse(400, 'Give the time zone the books are kept in, for example America/Detroit');
  const dry = dryRunId ? await prisma.auditLog.findUnique({ where: { id: String(dryRunId) } }).catch(() => null) : null;
  if (!dry || dry.eventType !== 'LEDGER_CUTOVER_DRY_RUN') refuse(400, 'Run the cutover dry run first, and name it here');
  if (Date.now() - new Date(dry.timestamp).getTime() > 7 * 86_400_000) refuse(409, 'That dry run is more than 7 days old. Run it again and look at the result.');

  return prisma.$transaction(async (tx) => {
    // Business saves wait here until the books are open, so each one is either in the opening
    // balances or posted as an entry, never both and never neither.
    // The wait for those tables is short and named: a save left open elsewhere must not hold the start
    // until the server's own time limit cuts it off with no reason given.
    await tx.$executeRawUnsafe("SET LOCAL lock_timeout = '8s'");
    await tx.$executeRawUnsafe('LOCK TABLE "Invoice", "Payment", "Inventory", "MaterialMovement", "StockTransfer", "StockTransferLine" IN SHARE ROW EXCLUSIVE MODE')
      .catch((e) => { if (/55P03|lock timeout|lock_not_available/i.test(`${e?.code} ${e?.meta?.code} ${e?.message}`)) refuse(409, 'Another save is holding the invoices or the stock just now, so the books were not started and nothing was changed. Wait a minute and try again.', 'BUSY'); throw e; });
    await tx.$executeRawUnsafe("SET LOCAL lock_timeout = '0'");
    const blockers = await activationBlockers(tx);
    if (blockers.length) refuse(409, `The ledger cannot be activated yet. ${blockers.join(' ')}`, 'NOT_APPROVED');
    const now = await activation(tx);
    if (now.active) refuse(409, 'The ledger is already active');
    if (now.effectiveDate) refuse(409, `The books were started on ${now.effectiveDate} and later stopped. Starting them again is not a new cutover: use "resume posting".`, 'ALREADY_STARTED');
    const today = dayIn(new Date(), timeZone);
    const value = {
      active: true, effectiveDate: isoDay(today), timeZone, policiesApprovedBy: who, policiesApprovedOn: isoDay(on), throughWip: throughWip === true,
      activatedById: userId || null, activatedAt: new Date().toISOString(), ruleVersion: RULE_VERSION, dryRunId: dry.id,
      ...(sandbox && { sandbox: true }),
    };
    await tx.appSetting.upsert({ where: { key: ACTIVATION_KEY }, create: { key: ACTIVATION_KEY, value }, update: { value } });

    const snap = await openingSnapshot(tx);
    const accounts = await accountsByKey(tx, ['RECEIVABLES', 'INVENTORY_RAW', 'INVENTORY_FINISHED', 'OPENING_EQUITY']).catch((e) => refuse(409, e.message, 'NOT_APPROVED'));
    const branches = [...new Set([...snap.items.map((i) => i.locationId), ...snap.customers.map((c) => c.locationId)])];
    // Built in memory and written in a fixed number of statements: one statement per entry made the
    // start run past the hosted server's time limit once there were thousands of pieces (finding AB-001).
    const owners = new Map((await tx.location.findMany({ where: { id: { in: branches.filter(Boolean) } }, select: { id: true, ownerId: true } })).map((l) => [l.id, l.ownerId || null]));
    const opening = [];
    for (const locationId of branches) {
      const legalEntityId = locationId ? owners.get(locationId) ?? null : null;
      const stockLines = snap.items.filter((i) => i.locationId === locationId).map((i) => ({ accountId: accounts.get(i.finished ? 'INVENTORY_FINISHED' : 'INVENTORY_RAW').id, side: 'D', amount: i.value, locationId, coilId: i.coilId, productId: i.productId, division: i.division }));
      opening.push(...openingEntries({ lines: stockLines, locationId, legalEntityId, memo: 'Opening balance: stock on hand at cost', accounts }));
      const owedLines = [];
      for (const c of snap.customers.filter((x) => x.locationId === locationId)) {
        if (!c.owed.isZero()) owedLines.push({ accountId: accounts.get('RECEIVABLES').id, side: c.owed.isPositive() ? 'D' : 'C', amount: c.owed.abs(), locationId, customerId: c.customerId });
        if (!c.owedBack.isZero()) owedLines.push({ accountId: accounts.get('RECEIVABLES').id, side: c.owedBack.isPositive() ? 'C' : 'D', amount: c.owedBack.abs(), locationId, customerId: c.customerId, memo: 'Credit owed back to the customer' });
      }
      opening.push(...openingEntries({ lines: owedLines, locationId, legalEntityId, memo: 'Opening balance: open invoices and credit owed back', accounts }));
    }
    const entries = await writeEntries(tx, opening, { date: today, userId });
    // Stock on a truck between branches: opened at the sending branch above, then moved to In Transit
    // by the same rule as any transfer, so receiving or cancelling it later works like any other.
    let transit = 0;
    for (const line of snap.inTransit) { const e = await record(tx, 'TRANSFER_SHIPPED', 'StockTransferLine', line.lineId, { userId, act: value, retry: true, postingDate: today }); if (e?.status === 'POSTED') transit += 1; }

    const result = { ...value, opening: { entries, ...snap.totals, inTransitMoved: transit, dryRunTotals: dry.details?.totals || null } };
    await audit(tx, { eventType: 'LEDGER_ACTIVATED', userId, resourceType: 'Ledger', resourceId: 'activation', details: result });
    return result;
  }, { isolationLevel: 'Serializable', timeout: 600_000, maxWait: 30_000 });
}

export const SANDBOX_PHRASE = 'START SANDBOX BOOKS';
/**
 * Starts demonstration books (owner's instruction of 2026-11-18). One step does what the real path needs an
 * accountant for: it loads the full proposed chart, records every account and mapping as approved under the
 * sandbox name, runs the dry run and opens the books today from the records as they are.
 *   - The books are marked `sandbox` for good: the status, the statements and every finance screen say so.
 *   - It is refused on books that were ever started, real or sandbox: a started ledger is never restarted.
 *   - It cannot be undone (posted entries are never deleted), so the caller sends the phrase.
 */
export async function startSandbox({ confirm, timeZone = 'America/Detroit', throughWip = false } = {}, userId) {
  if (confirm !== SANDBOX_PHRASE) refuse(400, `This starts demonstration books and cannot be undone. Send confirm: "${SANDBOX_PHRASE}".`);
  if (!isTimeZone(timeZone)) refuse(400, 'Give the time zone the books are kept in, for example America/Detroit');
  const now = await activation();
  if (now.effectiveDate) refuse(409, now.sandbox ? 'The sandbox books are already started.' : `The books were started on ${now.effectiveDate}. Books that were started are never turned into sandbox books.`, 'ALREADY_STARTED');
  const loaded = await loadProposedChart(prisma, userId);
  const approved = await approve({ accounts: 'ALL', mappings: 'ALL', approvedBy: SANDBOX_APPROVER }, userId).catch((e) => { if (e instanceof LedgerError && e.status === 409) return { accountsApproved: 0, mappingsApproved: 0 }; throw e; });
  const dry = await dryRun(userId);
  if (dry.blockers.length) refuse(409, `The sandbox books cannot be started yet. ${dry.blockers.join(' ')}`, 'NOT_APPROVED');
  const started = await activate({ policiesApprovedBy: SANDBOX_APPROVER, policiesApprovedOn: new Date().toISOString(), dryRunId: dry.dryRunId, timeZone, throughWip }, userId, { sandbox: true });
  await audit(prisma, { eventType: 'LEDGER_SANDBOX_STARTED', userId, resourceType: 'Ledger', resourceId: 'activation', details: { chart: loaded, approved, effectiveDate: started.effectiveDate } });
  return { ...started, chart: loaded, approved, notice: 'SANDBOX: demonstration books. Not approved by an accountant. Not for tax, lending or any real decision.' };
}

/** Starts posting again after it was stopped. The cutover date does not move; what happened in between is found by the reconciliation ("not recorded") and posted from there. */
export async function resume(reason, userId) {
  const why = String(reason || '').trim();
  if (why.length < 5) refuse(400, 'Say why posting is started again (at least 5 characters)');
  return prisma.$transaction(async (tx) => {
    const row = await tx.appSetting.findUnique({ where: { key: ACTIVATION_KEY } });
    const v = row?.value || {};
    if (!v.effectiveDate) refuse(409, 'The books have never been started. Activate the ledger instead.');
    if (v.active === true) refuse(409, 'The ledger is already active');
    const blockers = await activationBlockers(tx);
    if (blockers.length) refuse(409, `Posting cannot be started again yet. ${blockers.join(' ')}`, 'NOT_APPROVED');
    const value = { ...v, active: true, resumedAt: new Date().toISOString(), resumedById: userId || null, resumedReason: why };
    await tx.appSetting.update({ where: { key: ACTIVATION_KEY }, data: { value } });
    await audit(tx, { eventType: 'LEDGER_RESUMED', userId, resourceType: 'Ledger', resourceId: 'activation', details: { reason: why } });
    return value;
  });
}

export { Prisma };
