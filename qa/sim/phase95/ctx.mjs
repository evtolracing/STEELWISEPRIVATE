// Shared set-up for the Phase 9.5 ledger scenarios: people, readers of the books, and the business
// building blocks (a costed receipt, a shipped and invoiced order, a transfer, a work order, a counter sale).
// Everything goes through the real server; the database is read only to check what was saved.
import crypto from 'node:crypto';
import {
  arg, prisma, A, run, num, tag, scenario as record, http1, world, blocks, QA_PASSWORD, ok2, startStub, stopStub, hitsOf, clearHits, setMode,
} from '../phase4-lib.mjs';
import { bcrypt } from '../lib.mjs';

export { arg, prisma, A, run, num, tag, http1, ok2, crypto, startStub, stopStub, hitsOf, clearHits, setMode };
export const GROUP = arg('group', '');
/** --match "text": of the chosen group, run only the scenarios whose name holds this text (the set-up always runs). */
export const MATCH = arg('match', '');
export const startedAt = new Date(Date.now() - 2000);
export const G = {
  sales: 'Sales, invoices and revenue',
  money: 'Payments, credits and refunds',
  stock: 'Inventory valuation and adjustments',
  shop: 'Manufacturing, work in progress and costing',
  moves: 'Freight, transfers and location accounting',
  books: 'Periods, cutover and reporting',
  guard: 'Concurrency, authorization and failure recovery',
};
export const GROUPS = Object.values(G);
/** Records a scenario under its group. --group N runs one group (the set-up always runs). */
export async function scenario(group, name, fn, opts) {
  if (GROUP && GROUPS[Number(GROUP) - 1] !== group && !opts?.always) return null;
  if (MATCH && !opts?.always && !MATCH.split('|').some((m) => name.includes(m))) return null;
  return record(group, name, fn, opts);
}

export const w = await world();
export const B = blocks(w);
export const { L1, L2, heat, users } = w;
export const house = users.admin.organizationId;
export const near = (a, b, eps = 0.005) => Math.abs(Number(a) - Number(b)) <= eps;
export const err = (r) => String(r?.body?.error || r?.body?.message || '');
export const all = (n, fn) => Promise.all(Array.from({ length: n }, (_, i) => fn(i)));
export const today = () => new Date().toISOString().slice(0, 10);

// ── people ───────────────────────────────────────────────────────────────────────────────────
export async function login(role, loc, label) {
  const email = `${tag(`qa-p95-${label}`).toLowerCase()}@qa.test`;
  await prisma.user.create({ data: { email, passwordHash: await bcrypt().hash(QA_PASSWORD, 10), firstName: 'QA', lastName: label, role, organizationId: house, homeLocationId: loc?.id || null } });
  const r = await http1('POST', '/api/auth/login', { body: { email, password: QA_PASSWORD } });
  if (!r.body?.token) throw new Error(`login ${label}: ${r.status}`);
  const user = await prisma.user.findUnique({ where: { email } });
  const call = (m, url, body, headers) => http1(m, url, { body, headers, token: r.body.token });
  return { user, token: r.body.token, call, get: (u) => call('GET', u), post: (u, b) => call('POST', u, b ?? {}), put: (u, b) => call('PUT', u, b ?? {}), patch: (u, b) => call('PATCH', u, b ?? {}), del: (u) => call('DELETE', u) };
}
export const cfo = await login('CFO', L1, 'cfo');
export const cfo2 = await login('CFO', L1, 'cfo-two');
export const owner = await login('TENANT_OWNER', L1, 'owner');
export const auditor = await login('AUDITOR', L1, 'auditor');
export const exec = await login('EXECUTIVE', L1, 'executive');
export const admin2 = await login('ADMIN', L1, 'administrator');
export const bm1 = await login('BRANCH_MANAGER', L1, 'manager-l1');
export const bm2 = await login('BRANCH_MANAGER', L2, 'manager-l2');
export const credit = await login('CREDIT_MANAGER', L1, 'credit');
export const sales = await login('SALES_REP', L1, 'sales');
export const invMgr = await login('INVENTORY_MANAGER', L1, 'inventory');
export const operator = await login('OPERATOR_SAW', L1, 'operator');
export const analyst = await login('DATA_ANALYST', L1, 'analyst');

// ── the books ────────────────────────────────────────────────────────────────────────────────
const ENTRY = { lines: { orderBy: { lineNumber: 'asc' }, include: { account: { select: { code: true, type: true } } } }, period: true };
export const eventOf = (eventKind, sourceType, sourceId) => prisma.ledgerEvent.findUnique({ where: { eventKind_sourceType_sourceId: { eventKind, sourceType, sourceId: String(sourceId) } } });
export const entryOf = (id) => (id ? prisma.journalEntry.findUnique({ where: { id }, include: ENTRY }) : null);
export const entriesOf = (sourceType, sourceId, eventKind) => prisma.journalEntry.findMany({ where: { sourceType, sourceId: String(sourceId), ...(eventKind && { eventKind }) }, include: ENTRY, orderBy: { entryNumber: 'asc' } });
/** The posted entry of one event, with the event. */
export async function posted(eventKind, sourceType, sourceId) {
  const event = await eventOf(eventKind, sourceType, sourceId);
  return { event, entry: event?.journalEntryId ? await entryOf(event.journalEntryId) : null };
}
/** Net debit (debits less credits) per account code of one entry. */
export function nets(entry) {
  const out = {};
  for (const l of entry?.lines || []) out[l.account.code] = +(((out[l.account.code] || 0) + Number(l.debit) - Number(l.credit)).toFixed(2));
  return out;
}
/**
 * Checks an entry against the expected net debit per account: { '1100': 106, '4000': -100, '2100': -6 }.
 * Also checks that it is posted, balanced, and touches no other account.
 */
export function expectEntry(ok, label, entry, want) {
  if (!ok(`${label}: an entry was posted`, entry && entry.status === 'POSTED', entry ? entry.status : 'no entry')) return false;
  const got = nets(entry);
  const d = entry.lines.reduce((s, l) => s + Number(l.debit), 0); const c = entry.lines.reduce((s, l) => s + Number(l.credit), 0);
  let good = ok(`${label}: debits equal credits`, near(d, c) && d > 0 && near(d, entry.totalDebit), `${d} vs ${c}, header ${entry.totalDebit}`);
  for (const [code, amount] of Object.entries(want)) good = ok(`${label}: account ${code} moves by ${amount}`, near(got[code] || 0, amount), `got ${got[code] ?? 'nothing'}; entry ${JSON.stringify(got)}`) && good;
  const extra = Object.keys(got).filter((k) => !(k in want) && !near(got[k], 0));
  good = ok(`${label}: no other account is touched`, !extra.length, `also ${extra.map((k) => `${k} ${got[k]}`).join(', ')}`) && good;
  return good;
}
/** Balance of one account, from the trial balance the Finance screen reads. */
export async function balances(who = cfo) {
  const r = await who.get('/api/ledger/reports/trial-balance');
  if (r.status !== 200) throw new Error(`trial balance ${r.status} ${err(r)}`);
  const by = Object.fromEntries(r.body.accounts.map((a) => [a.code, Number(a.debit) - Number(a.credit)]));
  return { by, balanced: r.body.balanced, totals: r.body.totals, of: (code) => +(by[code] || 0).toFixed(2) };
}
/** What changed in the accounts while `fn` ran: { code: net debit change }. Only safe when nothing else posts at the same time. */
export async function movement(fn) {
  const before = await balances(); const out = await fn(); const after = await balances();
  const delta = {};
  for (const code of new Set([...Object.keys(before.by), ...Object.keys(after.by)])) { const d = +((after.by[code] || 0) - (before.by[code] || 0)).toFixed(2); if (!near(d, 0)) delta[code] = d; }
  return { out, delta, balanced: after.balanced };
}
export const openEvents = () => prisma.ledgerEvent.count({ where: { status: { in: ['FAILED', 'RECONCILIATION_REQUIRED', 'PENDING'] } } });
export const activationRow = async () => (await prisma.appSetting.findUnique({ where: { key: 'ledger.activation' } }))?.value || null;
export const auditsOf = (eventType, resourceId) => prisma.auditLog.findMany({ where: { eventType, ...(resourceId && { resourceId: String(resourceId) }) }, orderBy: { timestamp: 'asc' } });

/** Empties the ledger on the QA database so the scenarios start from "never activated". QA only: the database guards are switched off for this one statement. */
export async function resetLedger() {
  const url = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/steelwise_qa';
  if (!/(localhost|127\.0\.0\.1).*qa/.test(url)) throw new Error('Refusing: not a local QA database');
  await prisma.$transaction([
    prisma.$executeRawUnsafe('SET LOCAL session_replication_role = replica'),
    prisma.$executeRawUnsafe('TRUNCATE "LedgerExportItem", "LedgerExportBatch", "LedgerExternalAccount", "LedgerReconciliation", "LedgerEvent", "JournalLine", "JournalEntry", "LedgerPeriod", "LedgerMapping", "LedgerAccount" CASCADE'),
    prisma.$executeRawUnsafe('DELETE FROM "AppSetting" WHERE "key" = \'ledger.activation\''),
    prisma.$executeRawUnsafe('ALTER SEQUENCE "JournalEntry_number_seq" RESTART WITH 1'),
  ]);
}

// ── business building blocks ─────────────────────────────────────────────────────────────────
const poLine = (qty, unitPrice, over = {}) => ({ gradeId: heat.gradeId, description: `QA P9.5 plate ${run}`, thicknessIn: 0.5, widthIn: 48, lengthIn: 96, qtyOrdered: qty, unit: 'LB', unitPrice, priceUnit: 'LB', extendedPrice: +(qty * unitPrice).toFixed(2), ...over });
export async function purchaseOrder(qty, unitPrice, { supplier = w.supplierOrg, locationId = L1.id } = {}) {
  const line = poLine(qty, unitPrice);
  const r = await A.post('/api/purchase-orders', { sellerId: supplier.id, status: 'DRAFT', subtotal: line.extendedPrice, taxAmount: 0, freightAmount: 0, totalAmount: line.extendedPrice, locationId, lines: [line] });
  if (r.status !== 201) throw new Error(`purchase order ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
  const p = await A.put(`/api/purchase-orders/${r.body.id}`, { status: 'CONFIRMED' });
  if (!ok2(p)) throw new Error(`place ${p.status} ${JSON.stringify(p.body).slice(0, 200)}`);
  return prisma.order.findUnique({ where: { id: r.body.id }, include: { lines: true } });
}
/** Stock received against a purchase order, so it has a cost. Returns { coilId, po, movement }. */
export async function costed(weightLb = 5000, unitCost = 0.4, { locationId = L1.id, over = {} } = {}) {
  const po = await purchaseOrder(weightLb, unitCost, { locationId });
  const r = await A.post('/api/inventory/receipts', B.receiptBody({ weightLb, locationId, poLineId: po.lines[0].id, ...over }));
  if (r.status !== 201) throw new Error(`receipt ${r.status} ${JSON.stringify(r.body).slice(0, 300)}`);
  const coilId = r.body.item.id;
  const movement = await prisma.materialMovement.findFirst({ where: { coilId, movementType: 'RECEIVE' } });
  return { coilId, po, movement };
}
/** Stock received with no purchase order: it has no cost. */
export async function uncosted(weightLb = 5000, over = {}) { return B.received({ weightLb, ...over }); }
export const coilOf = (id) => prisma.coil.findUnique({ where: { id }, include: { inventory: true } });
export const setCost = (coilId, unitCost, who = 'admin') => A.put(`/api/coils/${coilId}`, { unitCost }, who);

/** A confirmed order for costed stock, reserved and with a shipment ready to dispatch. */
export async function readyToShip(qty = 1000, { cost = 0.4, price = 0.65, taxRate = 0, freight = 0, customer, state, extraStock = 500, coilId: given } = {}) {
  const coilId = given || (await costed(qty + extraStock, cost)).coilId;
  const o = await B.order([B.line(qty, price)], { customer, taxRate, freight, extra: state ? { shipToState: state } : {} });
  const rz = await B.reserve(o, o.lines[0], coilId, qty);
  if (!ok2(rz)) throw new Error(`reserve ${rz.status} ${JSON.stringify(rz.body).slice(0, 200)}`);
  const s = await B.shipment(o, [[o.lines[0], qty]]);
  if (s.status !== 201) throw new Error(`shipment ${s.status} ${JSON.stringify(s.body).slice(0, 200)}`);
  return { coilId, order: o, shipment: s.body };
}
export const invOf = (id) => prisma.invoice.findUnique({ where: { id }, include: { lines: true, payments: { orderBy: { createdAt: 'asc' } } } });
/** Shipped and invoiced. Returns the order, the shipment, the ship movement and the invoice record. */
export async function shipped(qty = 1000, opts = {}) {
  const r = await readyToShip(qty, opts);
  const d = await B.dispatch(r.shipment);
  if (d.status !== 200) throw new Error(`dispatch ${d.status} ${err(d)}`);
  const invoice = d.body.invoice ? await invOf(d.body.invoice.id) : null;
  const move = await prisma.materialMovement.findFirst({ where: { shipmentId: r.shipment.id, movementType: 'SHIP' } });
  return { ...r, invoice, move, dispatch: d.body };
}
export const pay = (invoiceId, amount, extra = {}, who = 'csr') => A.post(`/api/invoices/${invoiceId}/payments`, { amount, paymentMethod: 'CHECK', referenceNumber: tag('CHK'), ...extra }, who);
export const creditMemo = (invoiceId, body, who = 'admin') => A.post(`/api/invoices/${invoiceId}/credit`, body, who);
export const refund = (creditId, amount, who = 'admin') => A.post(`/api/invoices/${creditId}/refund`, { amount, paymentMethod: 'CHECK', referenceNumber: tag('RF') }, who);
export const lastPayment = (invoiceId, where = {}) => prisma.payment.findFirst({ where: { invoiceId, ...where }, orderBy: { createdAt: 'desc' } });

export const transfer = (coilIds, to = L2, who = 'admin') => A.post('/api/inventory/transfers', { toLocationId: to.id, coilIds, carrier: 'Own truck' }, who);
export const receiveTransfer = (t, body = {}, who = 'admin') => A.post(`/api/inventory/transfers/${t.id || t}/receive`, body, who);
export const cancelTransfer = (t, who = 'admin', reason = 'Truck broke down') => A.post(`/api/inventory/transfers/${t.id || t}/cancel`, { reason }, who);
export const settleTransfer = (t, coilId, decision, who = 'admin') => A.post(`/api/inventory/transfers/${t.id || t}/settle`, { coilId, decision, notes: 'Checked with the driver and the scale ticket' }, who);
export const transferLines = (id) => prisma.stockTransferLine.findMany({ where: { transferId: id }, orderBy: { createdAt: 'asc' } });
export const adjust = (coilId, body, who = 'admin') => A.post('/api/inventory/adjust', { coilId, notes: 'QA phase 9.5 count', ...body }, who);
export const lastMove = (coilId, where = {}) => prisma.materialMovement.findFirst({ where: { coilId, ...where }, orderBy: { createdAt: 'desc' } });

/** A coil work order, released and started. */
export async function startedWorkOrder(coilId, over = {}) {
  const wo = await A.post('/api/work-orders', { woType: 'SLIT', sourceCoilId: coilId, priority: 3, notes: `QA phase 9.5 ${run}`, ...over });
  if (wo.status !== 201) throw new Error(`work order ${wo.status} ${JSON.stringify(wo.body).slice(0, 200)}`);
  for (const s of ['release', 'start']) { const r = await A.put(`/api/work-orders/${wo.body.id}/${s}`, {}); if (!ok2(r)) throw new Error(`work order ${s} ${r.status} ${err(r)}`); }
  return wo.body;
}
export const completeWorkOrder = (id, body, who = 'admin') => A.put(`/api/work-orders/${id}/complete`, body, who);

/** Shelf stock counted in pieces for the counter, with a cost per piece. */
export async function shelfStock({ sku = 'CUT-DISC-9', pieces = 20, unitCost = 2.5, locationId } = {}) {
  const csr = await prisma.user.findUnique({ where: { email: 'qa-csr@qa.test' } });
  const at = locationId || csr.homeLocationId;
  const product = await prisma.product.findFirst({ where: { sku } });
  const like = await prisma.coil.findFirst({ where: { locationId: at } });
  // Earlier shelf stock of this product at the branch is put on hold (none available to sell) so the sale below
  // takes from this item. The quantity on hand is left as it is: emptying it here would be a stock change with
  // no movement behind it, and the reconciliation would rightly report it.
  await prisma.$executeRaw`UPDATE "Inventory" v SET "qtyOnHold" = v."qtyOnHold" + v."qtyAvailable", "qtyAvailable" = 0 FROM "Coil" c WHERE c."id" = v."coilId" AND c."productId" = ${product.id} AND v."locationId" = ${at} AND v."unit" = 'EA' AND v."qtyAvailable" > 0`;
  const coil = await prisma.coil.create({ data: { coilNumber: tag('SHELF'), form: like.form, heatId: like.heatId, gradeId: like.gradeId, ownerId: like.ownerId, productId: product.id, locationId: at, netWeightLb: 10, grossWeightLb: 10, createdById: users.admin.id, unitCost } });
  await prisma.inventory.create({ data: { coilId: coil.id, locationId: at, qtyOnHand: pieces, qtyAvailable: pieces, unit: 'EA', unitCost } });
  return { coilId: coil.id, product, locationId: at };
}
export const counterSale = (id, productId, quantity, payment = { method: 'CASH', amountTendered: 100000 }, who = 'csr') => A.post('/api/pos/quick-sale/process-payment', { sale: { id, items: [{ productId, quantity }] }, payment }, who);

/** A draft journal entry as the Finance screen sends it. */
export const draft = (lines, { memo = 'QA phase 9.5 manual entry', entryDate = today(), who = cfo, extra = {} } = {}) => who.post('/api/ledger/entries', { entryDate, memo, lines, ...extra });
export const D = (accountCode, debit, over = {}) => ({ accountCode, debit, ...over });
export const C = (accountCode, credit, over = {}) => ({ accountCode, credit, ...over });

/**
 * Shelf stock for the counter that is also in the books. There is no screen that receives stock by
 * the piece, so the item and its receipt are written to the QA database directly; the ledger then
 * finds the receipt as "not recorded", and the CFO posts it naming the account for the other side.
 * That is the documented recovery path, used here as the set-up.
 */
export async function shelfStockBooked(opts = {}) {
  const s = await shelfStock(opts);
  const inv = await prisma.inventory.findUnique({ where: { coilId: s.coilId } });
  const m = await prisma.materialMovement.create({ data: { coilId: s.coilId, movementType: 'RECEIVE', toLocationId: s.locationId, qtyMoved: inv.qtyOnHand, unit: 'EA', reasonCode: 'RECEIPT', createdById: users.admin.id } });
  const found = await cfo.post('/api/ledger/events/record-missing', {});
  if (found.status !== 200) throw new Error(`record missing ${found.status} ${err(found)}`);
  const event = await eventOf('STOCK_RECEIVED', 'MaterialMovement', m.id);
  if (!event) throw new Error('the shelf receipt was not found as missing');
  const r = await cfo.post(`/api/ledger/events/${event.id}/retry`, { offsetAccountCode: '2000' });
  if (r.body?.status !== 'POSTED') throw new Error(`shelf receipt not posted: ${r.status} ${r.body?.status} ${r.body?.reason || err(r)}`);
  return { ...s, receipt: m };
}
