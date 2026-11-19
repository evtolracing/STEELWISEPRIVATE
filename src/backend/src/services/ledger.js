/**
 * The financial ledger (Phase 9.5): the posting engine.
 *
 *  - Nothing posts until the ledger is activated. Activation needs the chart, the mappings and the
 *    policies approved and a cutover date (see `activate`).
 *  - A business event is recorded once, in the same database transaction as the event itself:
 *    `record(tx, eventKind, sourceType, sourceId)`. A second call for the same event does nothing.
 *  - The event's row (LedgerEvent) says what became of it: POSTED with its entry, NOT_POSTED when
 *    there is correctly nothing to post, FAILED or RECONCILIATION_REQUIRED with the reason. A failure
 *    of the ledger never undoes the business event and never marks it posted; it is retried later.
 *  - A posted entry is never changed. A correction is a reversal, which is a new entry.
 *  - No account is ever substituted. A purpose with no mapped account fails the event.
 */
import { raiseAlertLater } from '../lib/alerts.js';
import { randomUUID } from 'node:crypto';
import prisma from '../lib/db.js';
import { acrossBranches } from '../lib/branchScope.js';
import {
  ACCOUNT_TYPES, RULE_VERSION, PROPOSED_ACCOUNTS, PROPOSED_MAPPING, LedgerRuleError, normalSideOf, proposedSideOf, cents, totals, periodOf, dayOf, dayIn, isoDay, reversedLines, ZERO,
  invoiceIssued, creditIssued, paymentReceived, refundPaid, stockReceived, stockShipped, returnRestocked, stockScrapped, stockAdjusted,
  pieceCut, workOrderCompleted, transferShipped, transferReceived, costChanged, manualLines,
} from '../lib/ledgerRules.js';

export class LedgerError extends Error {
  constructor(status, message, code = null) { super(message); this.status = status; this.code = code; }
}
const refuse = (status, message, code) => { throw new LedgerError(status, message, code); };

export const ACTIVATION_KEY = 'ledger.activation';
const NOT_ACTIVE = { active: false, effectiveDate: null, throughWip: false, timeZone: 'UTC' };

/** Whether the ledger posts, and from what date. */
export async function activation(db = prisma) {
  const row = await db.appSetting.findUnique({ where: { key: ACTIVATION_KEY } });
  const v = row?.value || {};
  return { ...NOT_ACTIVE, ...v, active: v.active === true && Boolean(v.effectiveDate) };
}

export const audit = (db, { eventType, userId, resourceType, resourceId, details, action = 'UPDATE' }) => db.auditLog.create({
  data: { category: 'FINANCIAL', eventType, severity: 'INFO', action, userId: userId || null, resourceType, resourceId: String(resourceId), details },
});

/** Writes the proposed chart and mappings where they are missing. Changes nothing that is already there. */
export async function loadProposedChart(db = prisma, userId = null) {
  let accounts = 0; let mappings = 0;
  for (const a of PROPOSED_ACCOUNTS) {
    const found = await db.ledgerAccount.findUnique({ where: { code: a.code }, select: { id: true } });
    if (found) continue;
    await db.ledgerAccount.create({ data: { code: a.code, name: a.name, type: a.type, normalSide: proposedSideOf(a), isControl: a.control, description: a.description } });
    accounts += 1;
  }
  for (const [key, [accountCode, description]] of Object.entries(PROPOSED_MAPPING)) {
    const found = await db.ledgerMapping.findUnique({ where: { key }, select: { key: true } });
    if (found) continue;
    await db.ledgerMapping.create({ data: { key, accountCode, description } });
    mappings += 1;
  }
  if (accounts || mappings) await audit(db, { eventType: 'LEDGER_CHART_LOADED', userId, resourceType: 'Ledger', resourceId: 'chart', details: { accounts, mappings }, action: 'CREATE' });
  return { accounts, mappings };
}

/** What stands between the ledger and activation. Empty when it may be activated. */
export async function activationBlockers(db = prisma) {
  const [accounts, mappings] = await Promise.all([db.ledgerAccount.findMany({ where: { isActive: true } }), db.ledgerMapping.findMany()]);
  const blockers = [];
  if (!accounts.length) blockers.push('The chart of accounts has not been loaded.');
  const unapproved = accounts.filter((a) => !a.approvedAt);
  if (unapproved.length) blockers.push(`${unapproved.length} account${unapproved.length === 1 ? ' is' : 's are'} not approved: ${unapproved.slice(0, 8).map((a) => a.code).join(', ')}${unapproved.length > 8 ? ', ...' : ''}.`);
  const codes = new Set(accounts.map((a) => a.code));
  for (const key of Object.keys(PROPOSED_MAPPING)) {
    const m = mappings.find((x) => x.key === key);
    if (!m || !m.accountCode) blockers.push(`No account is mapped for ${key}.`);
    else if (!codes.has(m.accountCode)) blockers.push(`${key} is mapped to account ${m.accountCode}, which is not an active account.`);
    else if (!m.approvedAt) blockers.push(`The mapping for ${key} is not approved.`);
  }
  return blockers;
}

/** Changes a presentation setting of the posting rules. Today there is one: whether a work order's material is shown passing through Work in Progress. */
export async function saveSettings({ throughWip }, userId) {
  if (typeof throughWip !== 'boolean') refuse(400, 'throughWip must be true or false');
  return prisma.$transaction(async (tx) => {
    const row = await tx.appSetting.findUnique({ where: { key: ACTIVATION_KEY } });
    if (!row?.value?.effectiveDate) refuse(409, 'The books have not been started');
    const value = { ...row.value, throughWip };
    await tx.appSetting.update({ where: { key: ACTIVATION_KEY }, data: { value } });
    await audit(tx, { eventType: 'LEDGER_SETTING_CHANGED', userId, resourceType: 'Ledger', resourceId: 'activation', details: { throughWip: { from: row.value.throughWip === true, to: throughWip } } });
    return { throughWip };
  });
}

/** Stops new postings. What is posted stays. For an administrator, with a reason. */
export async function deactivate(reason, userId) {
  const why = String(reason || '').trim();
  if (why.length < 5) refuse(400, 'Say why posting is stopped (at least 5 characters)');
  return prisma.$transaction(async (tx) => {
    const now = await activation(tx);
    if (!now.active) refuse(409, 'The ledger is not active');
    const value = { ...now, active: false, deactivatedAt: new Date().toISOString(), deactivatedById: userId || null, deactivatedReason: why };
    await tx.appSetting.update({ where: { key: ACTIVATION_KEY }, data: { value } });
    await audit(tx, { eventType: 'LEDGER_DEACTIVATED', userId, resourceType: 'Ledger', resourceId: 'activation', details: { reason: why } });
    return value;
  });
}

// ── Accounts, periods, numbers ───────────────────────────────────────────────────────────────

export async function accountsByKey(tx, keys) {
  const maps = await tx.ledgerMapping.findMany({ where: { key: { in: keys } } });
  const codes = maps.map((m) => m.accountCode).filter(Boolean);
  const accounts = codes.length ? await tx.ledgerAccount.findMany({ where: { code: { in: codes } } }) : [];
  const out = new Map();
  for (const key of keys) {
    const m = maps.find((x) => x.key === key);
    if (!m || !m.accountCode) throw new LedgerRuleError(`No account is mapped for ${key}. Nothing was posted to another account in its place.`);
    const a = accounts.find((x) => x.code === m.accountCode);
    if (!a) throw new LedgerRuleError(`${key} is mapped to account ${m.accountCode}, which does not exist.`);
    if (!a.isActive) throw new LedgerRuleError(`${key} is mapped to account ${a.code}, which is not active.`);
    if (!m.approvedAt) throw new LedgerRuleError(`The mapping of ${key} to account ${a.code} is not approved. Nothing was posted.`);
    if (!a.approvedAt) throw new LedgerRuleError(`Account ${a.code} is not approved. Nothing was posted.`);
    out.set(key, a);
  }
  return out;
}

/** An account a person named for one posting. It must be in the chart, in use and approved. */
async function namedAccount(tx, code) {
  const a = await tx.ledgerAccount.findUnique({ where: { code: String(code) } });
  if (!a) throw new LedgerRuleError(`Account ${code} is not in the chart.`);
  if (!a.isActive || !a.approvedAt) throw new LedgerRuleError(`Account ${code} is not ${a.isActive ? 'approved' : 'active'}.`);
  return a;
}

/** The period a date falls in. It is created open if this is the first entry of its month. */
export async function periodFor(tx, date) {
  const p = periodOf(date);
  const found = await tx.ledgerPeriod.findUnique({ where: { year_month: { year: p.year, month: p.month } } });
  if (found) return found;
  // Two first entries of a month at once: the second finds the first's row.
  await tx.$executeRaw`INSERT INTO "LedgerPeriod" ("id", "year", "month", "startsOn", "endsOn", "status") VALUES (${randomUUID()}, ${p.year}, ${p.month}, ${p.startsOn}::date, ${p.endsOn}::date, 'OPEN') ON CONFLICT ("year", "month") DO NOTHING`;
  return tx.ledgerPeriod.findUnique({ where: { year_month: { year: p.year, month: p.month } } });
}

async function nextEntryNumber(tx) {
  const rows = await tx.$queryRaw`SELECT nextval('"JournalEntry_number_seq"')::bigint AS n`;
  return `JE-${String(rows[0].n).padStart(8, '0')}`;
}

/**
 * Writes one entry as a draft with its lines, then posts it. The database checks, at the moment of
 * posting, that it balances and that its period is open (migration 20261117090000).
 * lines: [{ accountId, side, amount, ...dimensions }]
 */
export async function writeEntry(tx, { kind, eventKind = null, sourceType = null, sourceId = null, date, lines, memo, locationId = null, legalEntityId = null, userId = null, service = null, reversesEntryId = null, post = true }) {
  const t = totals(lines);
  if (!t.ok) { raiseAlertLater('LEDGER_UNBALANCED_ATTEMPT', { kind, eventKind, sourceType, sourceId, why: t.why }, { key: `${kind}:${sourceId || 'manual'}` }); throw new LedgerRuleError(`The entry does not balance: ${t.why}`); }
  const period = await periodFor(tx, date);
  if (post && period.status !== 'OPEN') throw new LedgerRuleError(`The period ${period.year}-${String(period.month).padStart(2, '0')} is closed. The entry was not moved to another period.`, { hold: true });
  const entry = await tx.journalEntry.create({
    data: {
      entryNumber: await nextEntryNumber(tx), entryDate: dayOf(date), periodId: period.id, status: 'DRAFT', kind, eventKind, sourceType, sourceId,
      ruleVersion: kind === 'MANUAL' ? null : RULE_VERSION, locationId, legalEntityId, memo: memo ? String(memo).slice(0, 500) : null, reversesEntryId,
      createdById: userId, createdByService: userId ? null : service || 'ledger',
      lines: { create: lines.map((l, i) => ({
        lineNumber: i + 1, accountId: l.accountId, debit: l.side === 'D' ? l.amount : 0, credit: l.side === 'C' ? l.amount : 0,
        locationId: l.locationId ?? locationId, division: l.division || null, customerId: l.customerId || null, supplierId: l.supplierId || null,
        productId: l.productId || null, coilId: l.coilId || null, jurisdiction: l.jurisdiction || null, memo: l.memo || null,
      })) },
    },
  });
  if (!post) return entry;
  return tx.journalEntry.update({ where: { id: entry.id }, data: { status: 'POSTED', postedById: userId, postedAt: new Date() } });
}

// ── Facts of each kind of event ──────────────────────────────────────────────────────────────

export const ownerOf = async (tx, locationId) => (locationId ? (await tx.location.findUnique({ where: { id: locationId }, select: { ownerId: true } }))?.ownerId || null : null);

async function invoiceFacts(tx, invoiceId) {
  const inv = await tx.invoice.findUnique({
    where: { id: invoiceId },
    include: { lines: { orderBy: { lineNumber: 'asc' }, include: { orderLine: { select: { productId: true, product: { select: { division: true } } } } } }, order: { select: { buyerId: true, locationId: true, shipToState: true, orderNumber: true, location: { select: { state: true } } } }, creditOf: { select: { invoiceNumber: true } } },
  });
  if (!inv) throw new LedgerRuleError('The invoice is no longer on file');
  return inv;
}
/** The tax jurisdiction on record: the ship-to state, or the selling branch's state for a sale over the counter. */
const stateOf = (inv) => (inv.order?.shipToState || inv.order?.location?.state || null)?.toUpperCase() || null;
const invoiceLinesOf = (inv, sign) => inv.lines.map((l) => ({ amount: cents(l.extendedPrice).mul(sign), productId: l.orderLine?.productId || null, division: l.orderLine?.product?.division || null }));

/** Stock facts shared by every movement rule. */
async function itemFacts(tx, coilId) {
  const coil = await tx.coil.findUnique({ where: { id: coilId }, select: { id: true, coilNumber: true, unitCost: true, productId: true, createdAt: true, product: { select: { division: true } }, inventory: { select: { qtyOnHand: true, locationId: true } } } });
  if (!coil) throw new LedgerRuleError('The stock item is no longer on file');
  const made = await tx.workOrderOutput.findFirst({ where: { outputCoilId: coilId }, select: { id: true } });
  return { coilId: coil.id, number: coil.coilNumber, productId: coil.productId, division: coil.product?.division || null, isWorkOrderOutput: Boolean(made), unitCost: coil.unitCost, onHand: coil.inventory?.qtyOnHand ?? null, locationId: coil.inventory?.locationId || null, createdAt: coil.createdAt };
}

/** What the books hold for one stock item across the inventory accounts. */
export async function bookedForItem(tx, coilId) {
  const rows = await tx.$queryRaw`
    SELECT COALESCE(SUM(l."debit" - l."credit"), 0)::text AS v
      FROM "JournalLine" l JOIN "JournalEntry" e ON e."id" = l."entryId" JOIN "LedgerAccount" a ON a."id" = l."accountId"
     WHERE l."coilId" = ${coilId} AND e."status" = 'POSTED'
       AND a."code" IN (SELECT m."accountCode" FROM "LedgerMapping" m WHERE m."key" IN ('INVENTORY_RAW', 'INVENTORY_FINISHED'))`;
  return cents(rows[0].v);
}
const hasLedgerLines = async (tx, coilId) => Boolean(await tx.journalLine.findFirst({ where: { coilId }, select: { id: true } }));

/** Pure: which rule a stock movement falls under. null: covered by another event of the same save. */
export function movementKind(m) {
  const reason = String(m.reasonCode || '').toUpperCase();
  if (reason === 'WORK_ORDER') return null; // the work order's own entry covers its movements
  switch (m.movementType) {
    case 'SHIP': return 'STOCK_SHIPPED';
    case 'RECEIVE':
      if (reason === 'CUSTOMER_RETURN' || reason === 'COUNTER_VOID') return 'RETURN_RESTOCKED';
      if (reason === 'CUT_PIECE') return 'PIECE_CUT';
      return 'STOCK_RECEIVED';
    case 'CONSUME': return reason === 'CUT_PIECE' ? null : 'STOCK_CONSUMED'; // the piece's own receipt carries the value across
    case 'SCRAP': return 'STOCK_SCRAPPED';
    case 'ADJUST': case 'COUNT': return 'STOCK_ADJUSTED';
    case 'TRANSFER': return reason === 'TRANSFER_RECEIVED' ? 'TRANSFER_RECEIVED' : 'STOCK_MOVED';
    default: return 'STOCK_OTHER';
  }
}

/**
 * Builds the entry of one event from the records. Returns { build, date, locationId } where build is
 * the rule's answer. `fresh`: the event is being recorded in the same save as the business event, so
 * the item's balance now is its balance right after the movement.
 */
async function factsFor(tx, eventKind, sourceType, sourceId, { fresh, act, offsetCode = null }) {
  if (eventKind === 'INVOICE_ISSUED') {
    const inv = await invoiceFacts(tx, sourceId);
    if (inv.kind !== 'INVOICE') throw new LedgerRuleError('That record is not an invoice');
    return {
      date: inv.invoiceDate, locationId: inv.order?.locationId || null,
      build: invoiceIssued({ invoice: { number: inv.invoiceNumber, subtotal: inv.subtotal, tax: inv.taxAmount, freight: inv.freightAmount, total: inv.totalAmount, lines: invoiceLinesOf(inv, 1) }, customerId: inv.order?.buyerId || null, locationId: inv.order?.locationId || null, state: stateOf(inv) }),
    };
  }
  if (eventKind === 'CREDIT_ISSUED') {
    const inv = await invoiceFacts(tx, sourceId);
    if (inv.kind !== 'CREDIT') throw new LedgerRuleError('That record is not a credit memo');
    return {
      date: inv.invoiceDate, locationId: inv.order?.locationId || null,
      build: creditIssued({ credit: { number: inv.invoiceNumber, ofInvoice: inv.creditOf?.invoiceNumber || null, subtotal: cents(inv.subtotal).neg(), tax: cents(inv.taxAmount).neg(), freight: cents(inv.freightAmount).neg(), total: cents(inv.totalAmount).neg(), lines: invoiceLinesOf(inv, -1) }, customerId: inv.order?.buyerId || null, locationId: inv.order?.locationId || null, state: stateOf(inv) }),
    };
  }
  if (eventKind === 'PAYMENT_RECORDED' || eventKind === 'REFUND_RECORDED') {
    const p = await tx.payment.findUnique({ where: { id: sourceId }, include: { invoice: { select: { invoiceNumber: true, kind: true, order: { select: { buyerId: true, locationId: true } } } } } });
    if (!p) throw new LedgerRuleError('The payment is no longer on file');
    const at = { customerId: p.invoice.order?.buyerId || null, locationId: p.invoice.order?.locationId || null };
    const build = eventKind === 'PAYMENT_RECORDED'
      ? paymentReceived({ amount: p.amount, method: p.paymentMethod, invoiceNumber: p.invoice.invoiceNumber, ...at })
      : refundPaid({ amount: cents(p.amount).neg(), method: p.paymentMethod, creditNumber: p.invoice.invoiceNumber, ...at });
    return { date: p.paymentDate, locationId: at.locationId, build };
  }
  if (sourceType === 'MaterialMovement') {
    const m = await tx.materialMovement.findUnique({ where: { id: sourceId }, include: { order: { select: { orderNumber: true, orderType: true, buyerId: true, sellerId: true } }, shipment: { select: { shipmentNumber: true } } } });
    if (!m) throw new LedgerRuleError('The stock movement is no longer on file');
    const item = await itemFacts(tx, m.coilId);
    const unitCost = m.unitCost ?? item.unitCost;
    const locationId = m.fromLocationId || m.toLocationId || item.locationId;
    const onHandAfter = fresh ? item.onHand : null;
    const booked = fresh ? await bookedForItem(tx, m.coilId) : null;
    const reference = m.shipment?.shipmentNumber || m.order?.orderNumber || null;
    let build;
    if (eventKind === 'STOCK_SHIPPED') build = stockShipped({ item, qty: m.qtyMoved, unitCost, locationId: m.fromLocationId || locationId, customerId: m.order?.buyerId || null, reference, onHandAfter, booked });
    else if (eventKind === 'RETURN_RESTOCKED') build = returnRestocked({ item, qty: m.qtyMoved, unitCost, locationId: m.toLocationId || locationId, customerId: m.order?.buyerId || null, reference });
    else if (eventKind === 'STOCK_RECEIVED') build = stockReceived({ item, qty: m.qtyMoved, unitCost, locationId: m.toLocationId || locationId, supplierId: m.order?.sellerId || null, purchaseOrder: m.orderLineId && m.order?.orderType === 'PO' ? m.order.orderNumber : null, offsetCode });
    else if (eventKind === 'STOCK_SCRAPPED') build = stockScrapped({ item, qty: m.qtyMoved, unitCost, locationId, reference: m.reasonCode, onHandAfter, booked });
    else if (eventKind === 'STOCK_ADJUSTED') build = stockAdjusted({ item, qty: m.qtyMoved, unitCost, up: Boolean(m.toLocationId) && !m.fromLocationId, reason: m.reasonCode, locationId, onHandAfter, booked });
    else if (eventKind === 'PIECE_CUT') {
      const child = await tx.coil.findUnique({ where: { id: m.coilId }, select: { parentCoilId: true } });
      if (!child?.parentCoilId) throw new LedgerRuleError(`Item ${item.number} is recorded as a cut piece and names no item it was cut from`);
      const parent = await itemFacts(tx, child.parentCoilId);
      build = pieceCut({ parent, child: item, qty: m.qtyMoved, unitCost: parent.unitCost, locationId: m.toLocationId || locationId });
    } else if (eventKind === 'TRANSFER_RECEIVED') {
      const [from, to] = await Promise.all([ownerOf(tx, m.fromLocationId), ownerOf(tx, m.toLocationId)]);
      build = transferReceived({ item, qty: m.qtyMoved, unitCost, fromLocationId: m.fromLocationId, toLocationId: m.toLocationId, sameOwner: Boolean(from) && from === to, number: String(m.notes || '').replace(/^Transfer /, '') });
    } else throw new LedgerRuleError(`A stock movement of type ${m.movementType}${m.reasonCode ? ` (${m.reasonCode})` : ''} has no approved rule.`, { hold: true });
    return { date: m.createdAt, locationId, build };
  }
  if (eventKind === 'TRANSFER_SHIPPED') {
    const line = await tx.stockTransferLine.findUnique({ where: { id: sourceId }, include: { transfer: true } });
    if (!line) throw new LedgerRuleError('The transfer line is no longer on file');
    const item = await itemFacts(tx, line.coilId);
    const [from, to] = await Promise.all([ownerOf(tx, line.transfer.fromLocationId), ownerOf(tx, line.transfer.toLocationId)]);
    return { date: line.transfer.shippedAt || line.createdAt, locationId: line.transfer.fromLocationId, build: transferShipped({ item, qty: line.qtyShipped, unitCost: item.unitCost, fromLocationId: line.transfer.fromLocationId, sameOwner: Boolean(from) && from === to, number: line.transfer.transferNumber }) };
  }
  if (eventKind === 'WORK_ORDER_COMPLETED') {
    const wo = await tx.workOrder.findUnique({ where: { id: sourceId }, select: { id: true, woNumber: true, sourceCoilId: true } });
    if (!wo) throw new LedgerRuleError('The work order is no longer on file');
    // The quantities are the stock movements the work order wrote, so the books and the stock history cannot disagree.
    const moves = await tx.materialMovement.findMany({ where: { workOrderId: wo.id, reasonCode: 'WORK_ORDER' }, orderBy: { createdAt: 'asc' } });
    if (!moves.length) throw new LedgerRuleError(`Work order ${wo.woNumber} moved no stock`);
    const source = await itemFacts(tx, wo.sourceCoilId);
    const pieces = [];
    let scrapQty = ZERO;
    for (const m of moves) {
      if (m.movementType === 'PROCESS') pieces.push({ ...(await itemFacts(tx, m.coilId)), qty: m.qtyMoved });
      else if (m.movementType === 'SCRAP') scrapQty = scrapQty.add(m.qtyMoved);
    }
    const locationId = moves[0].fromLocationId || moves[0].toLocationId || source.locationId;
    return {
      date: moves[moves.length - 1].createdAt, locationId,
      build: workOrderCompleted({ number: wo.woNumber, source, pieces, scrapQty, unitCost: source.unitCost, locationId, throughWip: act.throughWip === true, onHandAfter: fresh ? source.onHand : null, booked: fresh ? await bookedForItem(tx, wo.sourceCoilId) : null }),
    };
  }
  if (eventKind === 'COST_CHANGED') {
    const change = await tx.auditLog.findUnique({ where: { id: sourceId } });
    if (!change || change.eventType !== 'STOCK_COST_CHANGED') throw new LedgerRuleError('The record of the cost change is no longer on file');
    const item = await itemFacts(tx, change.resourceId);
    const d = change.details || {};
    const neverValued = d.from == null && !(await hasLedgerLines(tx, item.coilId)) && new Date(item.createdAt) < new Date(act.activatedAt || `${act.effectiveDate}T00:00:00Z`); // it was on hand, with no cost, when the opening balances were taken
    return { date: change.timestamp, locationId: item.locationId, build: costChanged({ item, qtyOnHand: d.qtyOnHand ?? 0, oldCost: d.from, newCost: d.to, locationId: item.locationId, neverValued }) };
  }
  throw new LedgerRuleError(`${eventKind} has no posting rule.`, { hold: true });
}

// ── Recording an event ───────────────────────────────────────────────────────────────────────

const FINAL = new Set(['POSTED', 'REVERSED', 'NOT_POSTED']);
const short = (s) => String(s || '').slice(0, 900);

async function setEvent(tx, key, data) {
  const where = { eventKind_sourceType_sourceId: key };
  return tx.ledgerEvent.upsert({ where, create: { ...key, ...data, attempts: 1 }, update: { ...data, attempts: { increment: 1 } } });
}

/**
 * Records one business event in the books, inside the transaction `tx` that saves the event.
 * Returns the event row, or null when the ledger is not active or the event is before the cutover.
 *   opts.userId      who did it
 *   opts.retry       true when this is a later attempt, not the event's own save
 *   opts.postingDate post on this date (an accountant's choice for an event whose own period is closed)
 */
export function record(tx, eventKind, sourceType, sourceId, opts = {}) {
  // The books are the whole company's: the facts of an event are read whatever branch the person works at.
  return acrossBranches(() => recordWithin(tx, eventKind, sourceType, sourceId, opts));
}
async function recordWithin(tx, eventKind, sourceType, sourceId, opts) {
  const act = opts.act || await activation(tx);
  if (!act.active) return null;
  const key = { eventKind, sourceType, sourceId: String(sourceId) };
  const existing = await tx.ledgerEvent.findUnique({ where: { eventKind_sourceType_sourceId: key } });
  if (existing && FINAL.has(existing.status)) return existing; // recorded once: a second call changes nothing
  const cutover = new Date(`${act.effectiveDate}T00:00:00Z`);

  // The ledger's own work is tried inside a savepoint: if it fails for any reason the business
  // event is untouched and the event is left FAILED with the reason, to be posted again later.
  const sp = `ledger_${randomUUID().replace(/-/g, '')}`;
  await tx.$executeRawUnsafe(`SAVEPOINT ${sp}`);
  try {
    const facts = await factsFor(tx, eventKind, sourceType, key.sourceId, { fresh: !opts.retry, act, offsetCode: opts.offsetAccountCode || null });
    const occurredAt = new Date(facts.date);
    if (dayIn(occurredAt, act.timeZone) < cutover && !opts.postingDate) {
      // The event's own date is before the books began (a payment typed with last month's date). It is posted on the day it was recorded.
      facts.late = true;
    }
    if (facts.build.nothing) {
      await tx.$executeRawUnsafe(`RELEASE SAVEPOINT ${sp}`);
      return setEvent(tx, key, { status: 'NOT_POSTED', reason: short(facts.build.nothing), locationId: facts.locationId, occurredAt, journalEntryId: null });
    }
    const date = opts.postingDate ? dayOf(new Date(opts.postingDate)) : dayIn(facts.late ? new Date() : occurredAt, act.timeZone);
    if (date < cutover) throw new LedgerRuleError(`The date ${isoDay(date)} is before the books began on ${act.effectiveDate}.`, { hold: true });
    const accounts = await accountsByKey(tx, [...new Set(facts.build.lines.filter((l) => l.key).map((l) => l.key))]);
    const lines = [];
    for (const l of facts.build.lines) lines.push({ ...l, accountId: l.key ? accounts.get(l.key).id : (await namedAccount(tx, l.code)).id });
    const entry = await writeEntry(tx, {
      kind: 'SYSTEM', eventKind, sourceType, sourceId: key.sourceId, date, lines, locationId: facts.locationId, legalEntityId: await ownerOf(tx, facts.locationId),
      memo: facts.late ? `${facts.build.memo} (dated ${isoDay(dayIn(occurredAt, act.timeZone))}, before the books began)` : facts.build.memo, userId: opts.userId || null, service: opts.retry ? 'ledger-retry' : null,
    });
    await tx.$executeRawUnsafe(`RELEASE SAVEPOINT ${sp}`);
    return setEvent(tx, key, { status: 'POSTED', reason: null, locationId: facts.locationId, occurredAt, journalEntryId: entry.id });
  } catch (error) {
    // A conflict between two saves at once is not the ledger's to settle: the whole save is run again by its caller.
    if (error?.code === 'P2034' || /could not serialize|deadlock detected/i.test(String(error?.message))) throw error;
    await tx.$executeRawUnsafe(`ROLLBACK TO SAVEPOINT ${sp}`);
    const rule = error instanceof LedgerRuleError;
    const reason = rule ? error.message : /LEDGER_PERIOD_CLOSED/.test(String(error?.message)) ? 'The period is closed. The entry was not moved to another period.' : `The entry could not be written: ${String(error?.message || error).split('\n').pop().slice(0, 300)}`;
    const held = (rule && error.hold) || /LEDGER_PERIOD_CLOSED/.test(String(error?.message));
    if (!rule && !held) console.error(`Ledger: ${eventKind} ${sourceType} ${key.sourceId} failed:`, error);
    if (!held) raiseAlertLater('LEDGER_POSTING_FAILED', { eventKind, sourceType, sourceId: key.sourceId, reason: short(reason) }, { key: `${eventKind}:${key.sourceId}` });
    return setEvent(tx, key, { status: held ? 'RECONCILIATION_REQUIRED' : 'FAILED', reason: short(reason), locationId: existing?.locationId ?? null, occurredAt: existing?.occurredAt ?? new Date(), journalEntryId: null });
  }
}

/** Records a stock movement under the rule its type and reason call for. */
export async function recordMovement(tx, movement, opts = {}) {
  const kind = movementKind(movement);
  if (!kind) return null;
  return record(tx, kind, 'MaterialMovement', movement.id, opts);
}

// ── Reversal ─────────────────────────────────────────────────────────────────────────────────

/** Writes the mirror image of a posted entry. An entry can be reversed once. */
async function reverseEntry(tx, entryId, { reason, userId, date = null, service = null }) {
  date = date ? dayOf(new Date(date)) : dayIn(new Date(), (await activation(tx)).timeZone);
  const entry = await tx.journalEntry.findUnique({ where: { id: entryId }, include: { lines: { orderBy: { lineNumber: 'asc' } }, reversedBy: { select: { entryNumber: true } } } });
  if (!entry) refuse(404, 'Journal entry not found');
  if (entry.status !== 'POSTED') refuse(409, 'Only a posted entry can be reversed. A draft is edited or deleted.');
  if (entry.kind === 'REVERSAL') refuse(409, 'A reversal cannot itself be reversed. Post a new entry.');
  if (entry.reversedBy) refuse(409, `This entry was already reversed by ${entry.reversedBy.entryNumber}`, 'ALREADY_REVERSED');
  const lines = reversedLines(entry.lines.map((l) => ({ accountId: l.accountId, side: Number(l.debit) > 0 ? 'D' : 'C', amount: cents(Number(l.debit) > 0 ? l.debit : l.credit), locationId: l.locationId, division: l.division, customerId: l.customerId, supplierId: l.supplierId, productId: l.productId, coilId: l.coilId, jurisdiction: l.jurisdiction, memo: l.memo })));
  return writeEntry(tx, { kind: 'REVERSAL', eventKind: entry.eventKind, sourceType: entry.sourceType, sourceId: entry.sourceId, date, lines, memo: `Reversal of ${entry.entryNumber}: ${reason}`, locationId: entry.locationId, legalEntityId: entry.legalEntityId, userId, service, reversesEntryId: entry.id });
}

/**
 * Takes a recorded event back out of the books because the business event itself was undone
 * (an invoice cancelled, a transfer called back). In the same transaction as that change.
 */
export function reverseEvent(tx, eventKind, sourceType, sourceId, opts = {}) {
  return acrossBranches(() => reverseWithin(tx, eventKind, sourceType, sourceId, opts));
}
async function reverseWithin(tx, eventKind, sourceType, sourceId, { reason, userId } = {}) {
  const act = await activation(tx);
  if (!act.active) return null;
  const key = { eventKind, sourceType, sourceId: String(sourceId) };
  const event = await tx.ledgerEvent.findUnique({ where: { eventKind_sourceType_sourceId: key } });
  if (!event) {
    // It was recorded before the books began, so the opening balances still include it. Nothing is
    // posted in its place: the accountant is told, and decides the entry.
    const undone = { eventKind: `${eventKind}_UNDONE`, sourceType, sourceId: String(sourceId) };
    const seen = await tx.ledgerEvent.findUnique({ where: { eventKind_sourceType_sourceId: undone } });
    if (seen) return seen;
    return tx.ledgerEvent.create({ data: { ...undone, status: 'RECONCILIATION_REQUIRED', occurredAt: new Date(), attempts: 1, reason: short(`${reason || 'Undone'}. It was recorded before the books began on ${act.effectiveDate}, so the opening balances include it. No entry was made: an accountant's adjustment is needed.`) } });
  }
  if (event.status === 'REVERSED') return event;
  if (event.status !== 'POSTED') {
    // It never reached the books, so there is nothing to take out; it must not be posted later either.
    return tx.ledgerEvent.update({ where: { id: event.id }, data: { status: 'NOT_POSTED', reason: short(`Undone before it was posted: ${reason}. Earlier state: ${event.status}${event.reason ? ` (${event.reason})` : ''}`) } });
  }
  const sp = `ledger_${randomUUID().replace(/-/g, '')}`;
  await tx.$executeRawUnsafe(`SAVEPOINT ${sp}`);
  try {
    await reverseEntry(tx, event.journalEntryId, { reason, userId });
    await tx.$executeRawUnsafe(`RELEASE SAVEPOINT ${sp}`);
    return tx.ledgerEvent.update({ where: { id: event.id }, data: { status: 'REVERSED', reason: short(reason) } });
  } catch (error) {
    if (error?.code === 'P2034' || /could not serialize|deadlock detected/i.test(String(error?.message))) throw error;
    await tx.$executeRawUnsafe(`ROLLBACK TO SAVEPOINT ${sp}`);
    // The entry stays in the books and the event says a reversal is owed.
    return tx.ledgerEvent.update({ where: { id: event.id }, data: { status: 'RECONCILIATION_REQUIRED', reason: short(`The business event was undone (${reason}) and its entry could not be reversed: ${error instanceof LedgerError || error instanceof LedgerRuleError ? error.message : String(error?.message || error).split('\n').pop()}`) } });
  }
}

// ── Later attempts ───────────────────────────────────────────────────────────────────────────

/** Posts an event that failed or is held, again. For the accountant or an administrator. */
export async function retryEvent(eventId, { userId, postingDate = null, offsetAccountCode = null } = {}) {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw`SELECT "id" FROM "LedgerEvent" WHERE "id" = ${eventId} FOR UPDATE`;
    if (!rows.length) refuse(404, 'Ledger event not found');
    const event = await tx.ledgerEvent.findUnique({ where: { id: eventId } });
    if (FINAL.has(event.status)) refuse(409, `This event is ${event.status.toLowerCase().replace('_', ' ')} and is not posted again`, 'ALREADY_FINAL');
    if (/was undone/.test(event.reason || '') && event.status === 'RECONCILIATION_REQUIRED' && event.journalEntryId) {
      await reverseEntry(tx, event.journalEntryId, { reason: 'Reversal owed from an undone business event', userId, date: postingDate });
      return tx.ledgerEvent.update({ where: { id: event.id }, data: { status: 'REVERSED', attempts: { increment: 1 } } });
    }
    const act = await activation(tx);
    if (!act.active) refuse(409, 'The ledger is not active');
    const out = await record(tx, event.eventKind, event.sourceType, event.sourceId, { userId, retry: true, postingDate, act, offsetAccountCode });
    await audit(tx, { eventType: 'LEDGER_EVENT_RETRIED', userId, resourceType: 'LedgerEvent', resourceId: event.id, details: { eventKind: event.eventKind, sourceType: event.sourceType, sourceId: event.sourceId, before: event.status, after: out.status, postingDate, offsetAccountCode } });
    return out;
  }, { timeout: 20_000 });
}

/** Every event of one stock item that did not post, oldest first: tried again after its cost is entered. */
export async function retryItemEvents(coilId, userId) {
  const movements = await prisma.materialMovement.findMany({ where: { coilId }, select: { id: true } });
  const lines = await prisma.stockTransferLine.findMany({ where: { coilId }, select: { id: true } });
  const wos = await prisma.workOrder.findMany({ where: { OR: [{ sourceCoilId: coilId }, { outputs: { some: { outputCoilId: coilId } } }] }, select: { id: true } });
  const ids = [...movements, ...lines, ...wos].map((x) => x.id);
  if (!ids.length) return [];
  const events = await prisma.ledgerEvent.findMany({ where: { sourceId: { in: ids }, status: { in: ['FAILED', 'RECONCILIATION_REQUIRED', 'PENDING'] } }, orderBy: { occurredAt: 'asc' } });
  const out = [];
  for (const e of events) { try { out.push(await retryEvent(e.id, { userId })); } catch (error) { out.push({ id: e.id, status: e.status, reason: error.message }); } }
  return out;
}

// ── Manual entries ───────────────────────────────────────────────────────────────────────────

async function manualAccounts(tx, lines) {
  const accounts = await tx.ledgerAccount.findMany({ where: { code: { in: [...new Set(lines.map((l) => l.accountCode))] } } });
  return lines.map((l, i) => {
    const a = accounts.find((x) => x.code === l.accountCode);
    if (!a) refuse(400, `Line ${i + 1}: account ${l.accountCode} is not in the chart`);
    if (!a.isActive) refuse(400, `Line ${i + 1}: account ${a.code} is not active`);
    if (!a.approvedAt) refuse(409, `Line ${i + 1}: account ${a.code} is not approved`, 'NOT_APPROVED');
    return { ...l, accountId: a.id, isControl: a.isControl, code: a.code };
  });
}

/** Saves a manual entry as a draft. Nothing is in the books until someone else posts it. */
export async function draftEntry({ entryDate, memo, lines: raw, locationId = null, allowControl = false }, userId) {
  const why = String(memo || '').trim();
  if (why.length < 5) refuse(400, 'Say what the entry is for (at least 5 characters)');
  const date = new Date(entryDate);
  if (!entryDate || Number.isNaN(date.getTime())) refuse(400, 'An entry date is required');
  let lines;
  try { lines = manualLines(raw); } catch (e) { refuse(400, e.message); }
  return prisma.$transaction(async (tx) => {
    const act = await activation(tx);
    if (!act.active) refuse(409, 'The ledger is not active');
    if (dayOf(date) < new Date(`${act.effectiveDate}T00:00:00Z`)) refuse(409, `The books began on ${act.effectiveDate}. An entry cannot be dated before that.`);
    const withAccounts = await manualAccounts(tx, lines);
    const control = withAccounts.filter((l) => l.isControl);
    const period = await periodFor(tx, date);
    if (period.status !== 'OPEN') refuse(409, `The period ${period.year}-${String(period.month).padStart(2, '0')} is closed. Date the entry in an open period, or have the period reopened.`, 'PERIOD_CLOSED');
    if (control.length && !allowControl) refuse(409, `Account ${control[0].code} takes entries from business events only. An adjustment to it needs the "adjust a control account" approval.`, 'CONTROL_ACCOUNT');
    const entry = await writeEntry(tx, { kind: 'MANUAL', date, lines: withAccounts, memo: why, locationId, legalEntityId: await ownerOf(tx, locationId), userId, post: false });
    await audit(tx, { eventType: 'LEDGER_ENTRY_DRAFTED', userId, resourceType: 'JournalEntry', resourceId: entry.id, details: { entryNumber: entry.entryNumber, memo: why, lines: withAccounts.length, adjustsControlAccount: control.length > 0 }, action: 'CREATE' });
    return entry;
  });
}

/** Posts a draft. The person who posts is not the person who wrote it (separation of duties). */
export async function postDraft(entryId, userId) {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw`SELECT "id" FROM "JournalEntry" WHERE "id" = ${entryId} FOR UPDATE`;
    if (!rows.length) refuse(404, 'Journal entry not found');
    const entry = await tx.journalEntry.findUnique({ where: { id: entryId }, include: { period: true } });
    if (entry.status !== 'DRAFT') refuse(409, 'This entry is already posted', 'ALREADY_FINAL');
    if (entry.createdById && entry.createdById === userId) refuse(403, 'An entry is posted by someone other than the person who wrote it.', 'SAME_PERSON');
    if (entry.period.status !== 'OPEN') refuse(409, `The period ${entry.period.year}-${String(entry.period.month).padStart(2, '0')} is closed`, 'PERIOD_CLOSED');
    let posted;
    try { posted = await tx.journalEntry.update({ where: { id: entryId }, data: { status: 'POSTED', postedById: userId, postedAt: new Date() } }); } catch (error) {
      const m = String(error?.message || '');
      if (/LEDGER_PERIOD_CLOSED/.test(m)) refuse(409, 'The period is closed', 'PERIOD_CLOSED');
      if (/LEDGER_UNBALANCED|LEDGER_TOO_FEW_LINES/.test(m)) { raiseAlertLater('LEDGER_UNBALANCED_ATTEMPT', { entryId, by: userId, refusedBy: 'database' }, { key: entryId }); refuse(409, 'The entry does not balance', 'UNBALANCED'); }
      throw error;
    }
    await audit(tx, { eventType: 'LEDGER_ENTRY_POSTED', userId, resourceType: 'JournalEntry', resourceId: entryId, details: { entryNumber: entry.entryNumber, total: String(posted.totalDebit) } });
    return posted;
  });
}

/** Removes a draft. A posted entry cannot be removed: the database refuses it. */
export async function deleteDraft(entryId, userId) {
  return prisma.$transaction(async (tx) => {
    const entry = await tx.journalEntry.findUnique({ where: { id: entryId } });
    if (!entry) refuse(404, 'Journal entry not found');
    if (entry.status !== 'DRAFT') refuse(409, 'A posted entry is never deleted. Reverse it instead.', 'IMMUTABLE');
    await tx.journalEntry.delete({ where: { id: entryId } });
    await audit(tx, { eventType: 'LEDGER_DRAFT_DELETED', userId, resourceType: 'JournalEntry', resourceId: entryId, details: { entryNumber: entry.entryNumber }, action: 'DELETE' });
  });
}

/** Reverses a posted entry by hand, with a reason. System entries are reversed by undoing their business event, not here. */
export async function reverseByHand(entryId, { reason, entryDate = null }, userId) {
  const why = String(reason || '').trim();
  if (why.length < 5) refuse(400, 'Say why the entry is reversed (at least 5 characters)');
  return prisma.$transaction(async (tx) => {
    const entry = await tx.journalEntry.findUnique({ where: { id: entryId }, select: { kind: true, entryNumber: true } });
    if (!entry) refuse(404, 'Journal entry not found');
    if (entry.kind === 'SYSTEM') refuse(409, 'This entry came from a business event. Undo the event (credit the invoice, cancel the transfer) and its entry is reversed with it.', 'SYSTEM_ENTRY');
    let made;
    try { made = await reverseEntry(tx, entryId, { reason: why, userId, date: entryDate }); } catch (error) {
      if (error instanceof LedgerRuleError) refuse(409, error.message, 'PERIOD_CLOSED');
      if (error?.code === 'P2002') refuse(409, 'This entry was already reversed', 'ALREADY_REVERSED');
      throw error;
    }
    await audit(tx, { eventType: 'LEDGER_ENTRY_REVERSED', userId, resourceType: 'JournalEntry', resourceId: entryId, details: { entryNumber: entry.entryNumber, reversal: made.entryNumber, reason: why } });
    return made;
  });
}

// ── Periods ──────────────────────────────────────────────────────────────────────────────────

export async function closePeriod(year, month, userId) {
  return prisma.$transaction(async (tx) => {
    const period = await periodFor(tx, new Date(Date.UTC(year, month - 1, 1)));
    // Waits for any entry being posted into the period (the posting trigger holds a share lock on this row).
    await tx.$queryRaw`SELECT "id" FROM "LedgerPeriod" WHERE "id" = ${period.id} FOR UPDATE`;
    const now = await tx.ledgerPeriod.findUnique({ where: { id: period.id } });
    if (now.status === 'CLOSED') refuse(409, 'This period is already closed', 'ALREADY_FINAL');
    if (new Date(now.endsOn) >= dayIn(new Date(), (await activation(tx)).timeZone)) refuse(409, 'A period can be closed once its last day has passed');
    const drafts = await tx.journalEntry.count({ where: { periodId: period.id, status: 'DRAFT' } });
    if (drafts) refuse(409, `${drafts} draft entr${drafts === 1 ? 'y is' : 'ies are'} still open in this period. Post or delete ${drafts === 1 ? 'it' : 'them'} first.`, 'DRAFTS_OPEN');
    const closed = await tx.ledgerPeriod.update({ where: { id: period.id }, data: { status: 'CLOSED', closedAt: new Date(), closedById: userId } });
    await audit(tx, { eventType: 'LEDGER_PERIOD_CLOSED', userId, resourceType: 'LedgerPeriod', resourceId: period.id, details: { year, month } });
    return closed;
  });
}

export async function reopenPeriod(year, month, reason, userId) {
  const why = String(reason || '').trim();
  if (why.length < 10) refuse(400, 'Say why the period is reopened (at least 10 characters)');
  return prisma.$transaction(async (tx) => {
    const period = await tx.ledgerPeriod.findUnique({ where: { year_month: { year, month } } });
    if (!period) refuse(404, 'Period not found');
    if (period.status !== 'CLOSED') refuse(409, 'This period is not closed', 'ALREADY_FINAL');
    if (period.closedById && period.closedById === userId) {
      const others = await tx.user.count({ where: { isActive: true, id: { not: userId }, role: { in: PERIOD_ROLES } } });
      if (others) refuse(403, 'A period is reopened by someone other than the person who closed it.', 'SAME_PERSON');
    }
    const open = await tx.ledgerPeriod.update({ where: { id: period.id }, data: { status: 'OPEN', reopenedAt: new Date(), reopenedById: userId, reopenReason: why } });
    await audit(tx, { eventType: 'LEDGER_PERIOD_REOPENED', userId, resourceType: 'LedgerPeriod', resourceId: period.id, details: { year, month, reason: why } });
    return open;
  });
}

/**
 * Closes an exception a person has dealt with outside the posting rules (an accountant's own entry,
 * or a decision that nothing is owed). The event is never posted afterwards. A note is required.
 */
export async function resolveEvent(eventId, { note, entryNumber = null }, userId) {
  const why = String(note || '').trim();
  if (why.length < 10) refuse(400, 'Say how this was settled (at least 10 characters)');
  return prisma.$transaction(async (tx) => {
    const event = await tx.ledgerEvent.findUnique({ where: { id: eventId } });
    if (!event) refuse(404, 'Ledger event not found');
    if (FINAL.has(event.status)) refuse(409, 'This event is already settled', 'ALREADY_FINAL');
    let entry = null;
    if (entryNumber) {
      entry = await tx.journalEntry.findUnique({ where: { entryNumber: String(entryNumber) }, select: { id: true, status: true, entryNumber: true } });
      if (!entry || entry.status !== 'POSTED') refuse(400, `Entry ${entryNumber} is not a posted entry`);
    }
    const out = await tx.ledgerEvent.update({ where: { id: eventId }, data: { status: 'NOT_POSTED', reason: short(`Settled by a person${entry ? ` with ${entry.entryNumber}` : ''}: ${why}. Earlier: ${event.status}${event.reason ? ` (${event.reason})` : ''}`) } });
    await audit(tx, { eventType: 'LEDGER_EVENT_RESOLVED', userId, resourceType: 'LedgerEvent', resourceId: eventId, details: { eventKind: event.eventKind, sourceType: event.sourceType, sourceId: event.sourceId, before: event.status, note: why, entryNumber: entry?.entryNumber || null } });
    return out;
  });
}

// ── The chart and the mappings ───────────────────────────────────────────────────────────────

export async function chart() {
  const [accounts, mappings, used] = await Promise.all([
    prisma.ledgerAccount.findMany({ orderBy: { code: 'asc' } }), prisma.ledgerMapping.findMany({ orderBy: { key: 'asc' } }),
    prisma.journalLine.groupBy({ by: ['accountId'], _count: { _all: true } }),
  ]);
  return {
    accounts: accounts.map((a) => ({ ...a, lines: used.find((u) => u.accountId === a.id)?._count._all || 0, proposed: PROPOSED_ACCOUNTS.some((p) => p.code === a.code) })),
    mappings: Object.keys(PROPOSED_MAPPING).map((key) => { const m = mappings.find((x) => x.key === key); return { key, accountCode: m?.accountCode || null, description: m?.description || PROPOSED_MAPPING[key][1], approvedAt: m?.approvedAt || null, approvedBy: m?.approvedBy || null, proposedAccount: PROPOSED_MAPPING[key][0] }; }),
    blockers: await activationBlockers(), activation: await activation(),
  };
}

/** Adds an account, or changes its name, description or whether it is in use. A change removes its approval. */
export async function saveAccount({ code, name, type, description, isActive, isControl }, userId) {
  const c = String(code || '').trim();
  if (!/^[0-9]{3,8}$/.test(c)) refuse(400, 'An account code is 3 to 8 digits');
  return prisma.$transaction(async (tx) => {
    const found = await tx.ledgerAccount.findUnique({ where: { code: c } });
    const title = name === undefined ? found?.name : String(name || '').trim();
    if (!title || title.length < 3 || title.length > 120) refuse(400, 'An account name of 3 to 120 characters is required');
    const kind = type === undefined ? found?.type : String(type || '').toUpperCase();
    if (!ACCOUNT_TYPES.includes(kind)) refuse(400, `type must be one of: ${ACCOUNT_TYPES.join(', ')}`);
    if (found && kind !== found.type && await tx.journalLine.count({ where: { accountId: found.id } })) refuse(409, 'This account has entries. Its type cannot change; open a new account instead.');
    if (found && isActive === false && await tx.ledgerMapping.count({ where: { accountCode: c } })) refuse(409, 'A posting rule is mapped to this account. Map the rule to another account first.');
    // A contra account (accumulated depreciation, an allowance) keeps its side while its type stays the same.
    const data = { name: title, type: kind, normalSide: found && found.type === kind ? found.normalSide : normalSideOf(kind), description: description === undefined ? found?.description ?? null : String(description || '').slice(0, 500) || null, isActive: isActive === undefined ? found?.isActive ?? true : isActive === true, isControl: isControl === undefined ? found?.isControl ?? false : isControl === true };
    const unchanged = found && ['name', 'type', 'description', 'isActive', 'isControl'].every((k) => found[k] === data[k]);
    if (unchanged) return found;
    const saved = found ? await tx.ledgerAccount.update({ where: { code: c }, data: { ...data, approvedAt: null, approvedBy: null } }) : await tx.ledgerAccount.create({ data: { code: c, ...data } });
    await audit(tx, { eventType: found ? 'LEDGER_ACCOUNT_CHANGED' : 'LEDGER_ACCOUNT_ADDED', userId, resourceType: 'LedgerAccount', resourceId: saved.id, details: { code: c, before: found ? { name: found.name, type: found.type, isActive: found.isActive, isControl: found.isControl } : null, after: data }, action: found ? 'UPDATE' : 'CREATE' });
    return saved;
  });
}

/** Points a posting purpose at an account. The change removes the mapping's approval, so nothing posts through it until it is approved again. */
export async function saveMapping({ key, accountCode }, userId) {
  const k = String(key || '').toUpperCase();
  if (!PROPOSED_MAPPING[k]) refuse(400, 'Unknown posting purpose');
  const code = accountCode == null || accountCode === '' ? null : String(accountCode);
  return prisma.$transaction(async (tx) => {
    if (code) { const a = await tx.ledgerAccount.findUnique({ where: { code } }); if (!a) refuse(400, `Account ${code} is not in the chart`); if (!a.isActive) refuse(400, `Account ${code} is not active`); }
    const before = await tx.ledgerMapping.findUnique({ where: { key: k } });
    if (before && before.accountCode === code) return before;
    const saved = await tx.ledgerMapping.upsert({ where: { key: k }, create: { key: k, accountCode: code, description: PROPOSED_MAPPING[k][1] }, update: { accountCode: code, approvedAt: null, approvedBy: null } });
    await audit(tx, { eventType: 'LEDGER_MAPPING_CHANGED', userId, resourceType: 'LedgerMapping', resourceId: k, details: { key: k, from: before?.accountCode || null, to: code } });
    return saved;
  });
}

/**
 * Records that the accountant approved accounts and mappings. `approvedBy` is the accountant's name
 * as the person recording it types it; who recorded it is in the audit log.
 *   accounts: ['1000', ...] or 'ALL'    mappings: ['RECEIVABLES', ...] or 'ALL'
 */
export async function approve({ accounts = [], mappings = [], approvedBy } = {}, userId) {
  const who = typeof approvedBy === 'string' ? approvedBy.trim() : '';
  if (who.length < 3) refuse(400, 'Give the name of the accountant who approved these');
  const list = (v, name) => { if (v === 'ALL') return v; if (!Array.isArray(v) || v.some((x) => typeof x !== 'string' && typeof x !== 'number')) refuse(400, `${name} must be a list of codes, or ALL`); return v.map(String); };
  accounts = list(accounts, 'accounts'); mappings = list(mappings, 'mappings');
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const a = await tx.ledgerAccount.updateMany({ where: { approvedAt: null, isActive: true, ...(accounts === 'ALL' ? {} : { code: { in: (accounts || []).map(String) } }) }, data: { approvedAt: now, approvedBy: who } });
    const m = await tx.ledgerMapping.updateMany({ where: { approvedAt: null, accountCode: { not: null }, ...(mappings === 'ALL' ? {} : { key: { in: (mappings || []).map((x) => String(x).toUpperCase()) } }) }, data: { approvedAt: now, approvedBy: who } });
    if (!a.count && !m.count) refuse(409, 'Nothing in that list was waiting for approval');
    await audit(tx, { eventType: 'LEDGER_APPROVAL_RECORDED', userId, resourceType: 'Ledger', resourceId: 'chart', details: { approvedBy: who, accounts: accounts === 'ALL' ? 'ALL' : accounts, mappings: mappings === 'ALL' ? 'ALL' : mappings, accountsApproved: a.count, mappingsApproved: m.count } });
    return { accountsApproved: a.count, mappingsApproved: m.count };
  });
}

/** Who may close and reopen periods, post and reverse manual entries, and change the chart. */
export const PERIOD_ROLES = ['SUPER_ADMIN', 'TENANT_OWNER', 'ADMIN', 'CFO'];
export { ZERO };
