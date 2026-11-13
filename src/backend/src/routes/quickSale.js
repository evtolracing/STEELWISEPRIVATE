/**
 * Counter quick sale: shelf items priced each, paid at the counter.
 *
 *   GET  /api/pos/quick-sale/items?search=      shelf items that can be rung up
 *   GET  /api/pos/quick-sale/lookup?barcode=    one item by SKU
 *   POST /api/pos/quick-sale/price              { items, customerId?, locationId? } → priced sale with tax
 *   POST /api/pos/quick-sale/process-payment    { sale: { id, items, customerId?, locationId? }, payment: { method, amountTendered?, reference? } }
 *   GET  /api/pos/quick-sale/daily-stats        today's counter sales
 *   GET  /api/pos/quick-sale/:saleId/receipt    receipt for a finished sale (sale id, order id or order number)
 *   POST /api/pos/quick-sale/:saleId/void       { reason } — credits and refunds the sale
 *
 * Rules:
 *  - A finished sale is a sales order to the walk-in account (or a named
 *    customer), already complete, with a paid invoice. It shows up in orders,
 *    invoices and reports like any other sale.
 *  - Prices and tax are worked out here. Prices sent by the screen are ignored.
 *  - Only items priced EACH can be rung up. Cut-to-size metal and plastic go
 *    through a counter order, which reserves and ships stock.
 *  - Tax is the rate for the state of the branch making the sale. Tax-exempt
 *    customers pay none.
 *  - Cash must cover the total; change is worked out. Card and check need the
 *    approval code or check number from the terminal or the check: no card
 *    processor is connected, so nothing is charged from here.
 *  - A sale id can be paid once. Sending it again returns the first result.
 *  - Receipts are shown and printed. Email and text receipts are not set up.
 */
import { customerLevel, levelPrice } from '../lib/customerPricing.js';
import { Router } from 'express';
import prisma from '../lib/db.js';
import { ci } from '../lib/dbText.js';
import { createNumbered, padded } from '../lib/numbering.js';
import { money } from '../lib/billingRules.js';
import { BillingError, creditInvoice, refundWithin, recordMoney } from '../services/billing.js';

const router = Router();
const METHODS = ['CASH', 'CARD', 'CHECK'];
const WALK_IN_CODE = 'WALK-IN';
const num = (d) => Number(d || 0);

class Refuse extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const refuse = (status, message) => { throw new Refuse(status, message); };
const handle = (label, fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error instanceof Refuse || error instanceof BillingError) return res.status(error.status).json({ error: error.message });
    if (error?.code === 'P2003' || error?.name === 'PrismaClientValidationError') return res.status(400).json({ error: 'The sale has a field that is not valid' });
    console.error(`Quick sale: ${label} failed:`, error);
    res.status(500).json({ error: `Failed to ${label}` });
  }
};

const SHELF = { isActive: true, priceUnit: 'EACH', basePriceCwt: { gt: 0 } };
const toItem = (p) => ({ id: p.id, productId: p.id, sku: p.sku, barcode: p.sku, name: p.name, description: p.name, unitPrice: money(p.basePriceCwt), unit: 'EA', taxable: true });

export async function walkInAccount() {
  const found = await prisma.organization.findUnique({ where: { code: WALK_IN_CODE } });
  if (found) return found;
  try {
    return await prisma.organization.create({ data: { code: WALK_IN_CODE, name: 'Walk-in / Cash Sale', type: 'FABRICATOR', paymentTerms: 'COD' } });
  } catch (error) {
    if (error?.code === 'P2002') return prisma.organization.findUnique({ where: { code: WALK_IN_CODE } });
    throw error;
  }
}

async function branchFor(req, locationId) {
  const id = locationId || req.user?.homeLocationId || (await prisma.user.findUnique({ where: { id: req.user.id }, select: { homeLocationId: true } }))?.homeLocationId;
  if (!id) return null;
  return prisma.location.findUnique({ where: { id: String(id) }, select: { id: true, code: true, name: true, state: true } });
}

/** Prices a sale from the product list. Anything the screen sent besides product and quantity is ignored. */
async function priceSale(req, raw = {}) {
  if (!Array.isArray(raw.items) || !raw.items.length) refuse(400, 'Add at least one item');
  if (raw.items.length > 200) refuse(400, 'A quick sale can have at most 200 lines');
  const wanted = new Map();
  for (const [i, it] of raw.items.entries()) {
    const productId = it?.productId || it?.id;
    const qty = Number(it?.quantity);
    if (!productId) refuse(400, `Item ${i + 1}: productId is required`);
    if (!Number.isInteger(qty) || qty <= 0 || qty > 100000) refuse(400, `Item ${i + 1}: quantity must be a whole number more than zero`);
    wanted.set(String(productId), (wanted.get(String(productId)) || 0) + qty);
  }
  const products = await prisma.product.findMany({ where: { id: { in: [...wanted.keys()] } } });
  // An account customer buys at the account's price level; a walk-in pays list.
  const level = await customerLevel(raw.customerId);
  const items = [...wanted.entries()].map(([productId, quantity], i) => {
    const p = products.find((x) => x.id === productId);
    if (!p || !p.isActive) refuse(400, `Item ${i + 1}: that product is not for sale`);
    if (p.priceUnit !== 'EACH' || !(num(p.basePriceCwt) > 0)) refuse(409, `${p.name} is priced by weight. Ring it up as a counter order instead.`);
    const unitPrice = money(levelPrice(p, level).unitPrice);
    return { lineNumber: i + 1, productId: p.id, sku: p.sku, description: p.name, quantity, unitPrice, extended: money(unitPrice * quantity), taxable: true };
  });

  let customer = null;
  if (raw.customerId) {
    customer = await prisma.organization.findUnique({ where: { id: String(raw.customerId) } });
    if (!customer || !customer.isActive) refuse(400, 'Customer not found');
  }
  const branch = await branchFor(req, raw.locationId);
  const subtotal = money(items.reduce((s, it) => s + it.extended, 0));
  let taxRate = 0;
  let rateFound = true;
  if (!customer?.taxExempt) {
    const row = branch?.state ? await prisma.salesTaxRate.findUnique({ where: { state: branch.state.toUpperCase() } }) : null;
    taxRate = row ? num(row.rate) : 0;
    rateFound = Boolean(row);
  }
  const tax = money(subtotal * taxRate);
  return {
    id: raw.id ? String(raw.id).slice(0, 60) : null,
    items, subtotal, taxRate, tax, total: money(subtotal + tax), priceLevel: level.code,
    taxExempt: Boolean(customer?.taxExempt), rateFound,
    ...(rateFound || customer?.taxExempt ? {} : { taxNote: branch ? `No sales tax rate is set up for ${branch.state || 'this branch'}, so no tax was charged.` : 'Your login has no home branch, so no tax was charged.' }),
    customer: customer && { id: customer.id, name: customer.name, code: customer.code },
    branch,
  };
}

// ── Stock (owner's decision 6: a counter sale reduces stock, and a void puts it back) ──
// Shelf stock is a stock item linked to the product and counted in pieces (unit EA) at the selling
// branch. A product with no such stock item at the branch is not stock-tracked there, and the sale
// goes through with a note; a tracked product cannot be sold beyond what is on the shelf.
const PIECES = ['EA', 'EACH'];
const SOLD = 'COUNTER_SALE';
const RETURNED = 'COUNTER_VOID';

async function takeShelfStock(tx, { sale, orderId, userId }) {
  const untracked = [];
  if (!sale.branch) return sale.items.map((it) => it.sku);
  for (const it of sale.items) {
    const shelf = await tx.inventory.findMany({
      where: { locationId: sale.branch.id, unit: { in: PIECES }, coil: { productId: it.productId } },
      orderBy: { createdAt: 'asc' }, select: { id: true, coilId: true, qtyAvailable: true },
    });
    if (!shelf.length) { untracked.push(it.sku); continue; }
    let left = it.quantity;
    for (const row of shelf) {
      if (left <= 0) break;
      const take = Math.min(left, Math.floor(num(row.qtyAvailable)));
      if (take <= 0) continue;
      // Conditional: two sales at once cannot both take the last piece.
      const moved = await tx.inventory.updateMany({
        where: { id: row.id, qtyAvailable: { gte: take }, qtyOnHand: { gte: take } },
        data: { qtyOnHand: { decrement: take }, qtyAvailable: { decrement: take }, lastMovement: new Date() },
      });
      if (!moved.count) continue;
      await tx.materialMovement.create({ data: { coilId: row.coilId, movementType: 'SHIP', fromLocationId: sale.branch.id, qtyMoved: take, unit: 'EA', orderId, reasonCode: SOLD, createdById: userId } });
      const now = await tx.inventory.findUnique({ where: { id: row.id }, select: { qtyOnHand: true } });
      if (num(now.qtyOnHand) <= 1e-9) await tx.coil.updateMany({ where: { id: row.coilId, status: 'AVAILABLE' }, data: { status: 'SHIPPED' } });
      left -= take;
    }
    if (left > 0) refuse(409, `Only ${it.quantity - left} of ${it.description} on the shelf at ${sale.branch.code}. Change the quantity, or correct the stock record first.`);
  }
  return untracked;
}

async function returnShelfStock(tx, { orderId, userId }) {
  const sold = await tx.materialMovement.findMany({ where: { orderId, movementType: 'SHIP', reasonCode: SOLD } });
  for (const m of sold) {
    await tx.inventory.update({ where: { coilId: m.coilId }, data: { qtyOnHand: { increment: m.qtyMoved }, qtyAvailable: { increment: m.qtyMoved }, lastMovement: new Date() } });
    await tx.coil.updateMany({ where: { id: m.coilId, status: 'SHIPPED' }, data: { status: 'AVAILABLE' } });
    await tx.materialMovement.create({ data: { coilId: m.coilId, movementType: 'RECEIVE', toLocationId: m.fromLocationId, qtyMoved: m.qtyMoved, unit: m.unit, orderId, reasonCode: RETURNED, createdById: userId } });
  }
  return sold.length;
}

function receiptFrom(order, invoice) {
  const payment = invoice?.payments?.find((p) => num(p.amount) > 0);
  const tender = (order.notes || '').match(/tendered ([\d.]+), change ([\d.]+)/);
  const voided = /VOIDED/.test(order.notes || '');
  return {
    type: 'QUICK_SALE_RECEIPT',
    saleId: (order.poReference || '').replace(/^QS:/, ''),
    orderId: order.id, orderNumber: order.orderNumber, invoiceNumber: invoice?.invoiceNumber || null,
    completedAt: order.createdAt, cashier: order.createdBy ? `${order.createdBy.firstName || ''} ${order.createdBy.lastName || ''}`.trim() : null,
    customer: order.buyer?.name || null, voided,
    items: order.lines.map((l) => ({ sku: l.product?.sku || null, description: l.description, quantity: num(l.qtyOrdered), unitPrice: num(l.unitPrice), extended: num(l.extendedPrice) })),
    subtotal: num(order.subtotal), tax: num(order.taxAmount), total: num(order.totalAmount),
    payment: payment && {
      method: payment.paymentMethod, reference: payment.referenceNumber,
      amountTendered: tender ? Number(tender[1]) : num(payment.amount), change: tender ? Number(tender[2]) : 0,
    },
  };
}

const SALE_INCLUDE = {
  lines: { orderBy: { lineNumber: 'asc' }, include: { product: { select: { sku: true } } } },
  buyer: { select: { id: true, name: true } },
  createdBy: { select: { firstName: true, lastName: true } },
  invoices: { where: { kind: 'INVOICE' }, include: { payments: true } },
};

async function findSale(key) {
  const k = String(key);
  return prisma.order.findFirst({
    where: { poReference: { startsWith: 'QS:' }, OR: [{ poReference: `QS:${k}` }, { id: k }, { orderNumber: k }] },
    include: SALE_INCLUDE,
  });
}

router.get('/items', handle('list items', async (req, res) => {
  const q = String(req.query.search || '').trim();
  const items = await prisma.product.findMany({
    where: { ...SHELF, ...(q && { OR: [{ sku: { contains: q, ...ci } }, { name: { contains: q, ...ci } }] }) },
    orderBy: { name: 'asc' }, take: 50,
  });
  res.json({ data: items.map(toItem) });
}));

const lookup = handle('look up item', async (req, res) => {
  const code = String(req.query.barcode || req.query.sku || req.body?.scanInput || req.body?.barcode || '').trim();
  if (!code) refuse(400, 'barcode is required');
  const product = (await prisma.product.findFirst({ where: { sku: { equals: code, ...ci } } }))
    || (await prisma.product.findFirst({ where: { ...SHELF, sku: { contains: code, ...ci } } }));
  if (!product || !product.isActive) refuse(404, `No item found for "${code}"`);
  if (product.priceUnit !== 'EACH' || !(num(product.basePriceCwt) > 0)) refuse(409, `${product.name} is priced by weight. Ring it up as a counter order instead.`);
  res.json(toItem(product));
});
router.get('/lookup', lookup);
router.post('/lookup', lookup);

router.post('/price', handle('price sale', async (req, res) => {
  res.json(await priceSale(req, req.body?.sale || req.body || {}));
}));

router.post('/process-payment', handle('take payment', async (req, res) => {
  const { sale: raw, payment = {} } = req.body || {};
  if (!raw) refuse(400, 'sale and payment are required');
  const saleId = raw.id ? String(raw.id).slice(0, 60) : null;
  if (!saleId) refuse(400, 'sale.id is required');
  const already = await findSale(saleId);
  if (already) {
    return res.json({ success: true, duplicate: true, receipt: receiptFrom(already, already.invoices[0]), orderId: already.id, orderNumber: already.orderNumber });
  }

  const sale = await priceSale(req, raw);
  const method = String(payment.method || '').toUpperCase();
  if (!METHODS.includes(method)) refuse(400, `payment.method must be one of: ${METHODS.join(', ')}`);
  const reference = payment.reference ? String(payment.reference).trim().slice(0, 60) : '';
  let tendered = sale.total;
  if (method === 'CASH') {
    tendered = Number(payment.amountTendered);
    if (!Number.isFinite(tendered) || tendered + 0.005 < sale.total) refuse(400, `Cash tendered must cover the total of ${sale.total.toFixed(2)}`);
  } else if (!reference) {
    refuse(400, method === 'CARD' ? 'Enter the approval code from the card terminal' : 'Enter the check number');
  }
  const change = method === 'CASH' ? money(tendered - sale.total) : 0;
  const buyer = sale.customer || await walkInAccount();
  const now = new Date();

  let untracked = [];
  let order;
  try {
  order = await createNumbered({
      count: () => prisma.order.count(),
      format: padded('SO'),
      create: (orderNumber) => prisma.$transaction(async (tx) => {
        const created = await tx.order.create({
          data: {
            orderNumber, orderType: 'SO', status: 'COMPLETE', buyerId: buyer.id, poReference: `QS:${saleId}`,
            ...(sale.branch && { locationId: sale.branch.id }),
            subtotal: sale.subtotal, taxAmount: sale.tax, freightAmount: 0, totalAmount: sale.total, paymentTerms: 'COD',
            notes: `Counter quick sale${sale.branch ? ` at ${sale.branch.code}` : ''} · ${method}${method === 'CASH' ? ` tendered ${tendered.toFixed(2)}, change ${change.toFixed(2)}` : ''}`,
            createdById: req.user.id,
            lines: {
              create: sale.items.map((it) => ({
                lineNumber: it.lineNumber, productId: it.productId, description: it.description,
                qtyOrdered: it.quantity, qtyShipped: it.quantity, unit: 'EA', unitPrice: it.unitPrice, priceUnit: 'EACH',
                extendedPrice: it.extended, lineStatus: 'COMPLETE',
              })),
            },
          },
          include: { lines: true },
        });
        const invoiceNumber = `INV-QS-${orderNumber.replace(/^SO-/, '')}`;
        const invoice = await tx.invoice.create({
          data: {
            invoiceNumber, orderId: created.id, kind: 'INVOICE', status: 'PAID', invoiceDate: now, dueDate: now,
            subtotal: sale.subtotal, taxAmount: sale.tax, freightAmount: 0, totalAmount: sale.total, paidAmount: sale.total,
            notes: 'Counter quick sale',
            lines: { create: created.lines.map((l) => ({ orderLineId: l.id, lineNumber: l.lineNumber, description: l.description, quantity: l.qtyOrdered, unit: 'EA', unitPrice: l.unitPrice, priceUnit: 'EACH', extendedPrice: l.extendedPrice })) },
            payments: { create: [{ amount: sale.total, paymentMethod: method, referenceNumber: reference || null, paymentDate: now }] },
          },
        });
        // The cashier is on record for the invoice and for the money taken, like every other invoice.
        await recordMoney(tx, { invoice, eventType: 'INVOICE_ISSUED', userId: req.user.id, details: { amount: sale.total, note: 'Counter quick sale' } });
        await recordMoney(tx, { invoice, eventType: 'PAYMENT_RECORDED', userId: req.user.id, details: { amount: sale.total, method, reference: reference || null } });
        untracked = await takeShelfStock(tx, { sale, orderId: created.id, userId: req.user.id });
        return created;
    }),
  });
  } catch (error) {
    // The same sale sent twice at once: the other copy may have taken the last pieces. It is still one sale.
    const first = error instanceof Refuse && error.status === 409 ? await findSale(saleId) : null;
    if (!first) throw error;
    return res.json({ success: true, duplicate: true, receipt: receiptFrom(first, first.invoices[0]), orderId: first.id, orderNumber: first.orderNumber });
  }
  // Two submissions of the same sale id at once: keep the first, drop this one.
  const all = await prisma.order.findMany({ where: { poReference: `QS:${saleId}` }, orderBy: { createdAt: 'asc' }, select: { id: true } });
  if (all.length > 1 && all[0].id !== order.id) {
    const dropped = (await prisma.invoice.findMany({ where: { orderId: order.id }, select: { id: true } })).map((i) => i.id);
    await prisma.$transaction(async (tx) => { await returnShelfStock(tx, { orderId: order.id, userId: req.user.id }); await tx.materialMovement.deleteMany({ where: { orderId: order.id } }); });
    await prisma.$transaction([
      prisma.auditLog.deleteMany({ where: { resourceType: 'Invoice', resourceId: { in: dropped }, category: 'FINANCIAL' } }),
      prisma.payment.deleteMany({ where: { invoice: { orderId: order.id } } }),
      prisma.invoice.deleteMany({ where: { orderId: order.id } }),
      prisma.order.delete({ where: { id: order.id } }),
    ]);
  }
  const saved = await findSale(saleId);
  res.status(201).json({ success: true, change, receipt: receiptFrom(saved, saved.invoices[0]), orderId: saved.id, orderNumber: saved.orderNumber, ...(sale.taxNote && { taxNote: sale.taxNote }), ...(untracked.length && { stockNote: `No shelf stock is on file at this branch for ${untracked.join(', ')}, so no stock was reduced for ${untracked.length === 1 ? 'it' : 'them'}.` }) });
}));

router.get('/daily-stats', handle('get daily stats', async (req, res) => {
  const day = req.query.date ? new Date(String(req.query.date)) : new Date();
  if (Number.isNaN(day.getTime())) refuse(400, 'date is not a valid date');
  const from = new Date(day); from.setHours(0, 0, 0, 0);
  const to = new Date(from); to.setDate(to.getDate() + 1);
  const orders = await prisma.order.findMany({
    where: { poReference: { startsWith: 'QS:' }, createdAt: { gte: from, lt: to } },
    include: { invoices: { where: { kind: 'INVOICE' }, include: { payments: true } } },
  });
  const live = orders.filter((o) => !/VOIDED/.test(o.notes || ''));
  const byMethod = {};
  for (const o of live) {
    const m = o.invoices[0]?.payments.find((p) => num(p.amount) > 0)?.paymentMethod || 'OTHER';
    byMethod[m] = money((byMethod[m] || 0) + num(o.totalAmount));
  }
  const total = money(live.reduce((s, o) => s + num(o.totalAmount), 0));
  res.json({ date: from.toISOString().slice(0, 10), saleCount: live.length, voidedCount: orders.length - live.length, totalSales: total, totalTax: money(live.reduce((s, o) => s + num(o.taxAmount), 0)), averageSale: live.length ? money(total / live.length) : 0, byMethod });
}));

router.get('/:saleId/receipt', handle('get receipt', async (req, res) => {
  const sale = await findSale(req.params.saleId);
  if (!sale) refuse(404, 'Sale not found');
  res.json(receiptFrom(sale, sale.invoices[0]));
}));

router.post('/:saleId/void', handle('void sale', async (req, res) => {
  const reason = String(req.body?.reason || '').trim();
  if (!reason) refuse(400, 'A reason is required to void a sale');
  const sale = await findSale(req.params.saleId);
  if (!sale) refuse(404, 'Sale not found');
  if (/VOIDED/.test(sale.notes || '')) refuse(409, 'This sale is already voided');
  const invoice = sale.invoices[0];
  const paid = invoice.payments.find((p) => num(p.amount) > 0);
  // The claim, the stock going back on the shelf, the credit memo and the refund are one
  // transaction: a void happens completely or not at all (C-010). The claim is conditional,
  // so two people cannot both void the same sale.
  const creditLines = (await prisma.invoiceLine.findMany({ where: { invoiceId: invoice.id } })).map((l) => ({ invoiceLineId: l.id, quantity: num(l.quantity) }));
  let owed = 0;
  const credit = await creditInvoice(invoice.id, { reason: `Void ${sale.orderNumber}: ${reason}`, lines: creditLines }, req.user?.id, {
    before: async (tx) => {
      const got = await tx.order.updateMany({ where: { id: sale.id, notes: sale.notes }, data: { notes: `${sale.notes} · VOIDED: ${reason}` } });
      if (!got.count) refuse(409, 'This sale was just changed by someone else. Reload and try again.');
      await returnShelfStock(tx, { orderId: sale.id, userId: req.user?.id });
    },
    after: async (tx, memo) => {
      owed = money(-num(memo.totalAmount) + num(memo.paidAmount));
      if (owed > 0) await refundWithin(tx, memo.id, { amount: owed, paymentMethod: paid?.paymentMethod || 'CASH', notes: `Refund for voided sale ${sale.orderNumber}` }, req.user?.id);
      return memo;
    },
  });
  const saved = await findSale(sale.id);
  res.json({ success: true, refunded: owed, creditMemo: credit.invoiceNumber, receipt: receiptFrom(saved, saved.invoices[0]) });
}));

// Receipts are shown and printed from the screen. Nothing is emailed or texted.
const notSetUp = (what) => (req, res) => res.status(501).json({ error: `${what} receipts are not set up. Print the receipt instead.` });
router.post('/email-receipt', notSetUp('Email'));
router.post('/sms-receipt', notSetUp('Text'));

export default router;
