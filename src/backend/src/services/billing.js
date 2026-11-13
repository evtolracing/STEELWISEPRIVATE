/**
 * Invoices, payments and credit memos.
 *
 * Rules (see lib/billingRules.js for the arithmetic):
 *  - A shipment is invoiced when it leaves the dock. `invoiceOrder` bills
 *    anything shipped that is not on an invoice yet (catch-up).
 *  - A line can never be invoiced for more than has shipped.
 *  - A payment cannot be more than what is owed.
 *  - A credit memo cannot credit more than the invoice billed. It pays down
 *    what is still owed on the invoice; whatever is left over is money owed
 *    back to the customer until a refund is recorded on the credit memo.
 *  - An invoice with payments or credits cannot be cancelled.
 *  - Nothing here sends anything to a customer.
 */
import prisma from '../lib/db.js';
import { createNumbered, padded, retryOverlap } from '../lib/numbering.js';
import {
  money, lineAmount, chargesFor, dueDateFor, invoiceStatusFor, balanceOf, paymentError, PAYMENT_METHODS,
} from '../lib/billingRules.js';

export class BillingError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const refuse = (status, message) => { throw new BillingError(status, message); };
const num = (d) => Number(d || 0);
const SERIALIZABLE = { isolationLevel: 'Serializable' };

const INCLUDE = {
  lines: { orderBy: { lineNumber: 'asc' } },
  payments: { orderBy: { paymentDate: 'asc' } },
  order: { select: { id: true, orderNumber: true, buyerId: true, poReference: true, paymentTerms: true, buyer: { select: { id: true, name: true, code: true } } } },
};

/** Shape sent to the screens: numbers as numbers, plus balance and overdue. */
export function toApi(inv) {
  if (!inv) return inv;
  const balance = balanceOf(inv);
  const overdue = inv.kind !== 'CREDIT' && ['SENT', 'PARTIAL'].includes(inv.status) && inv.dueDate && new Date(inv.dueDate) < new Date() && balance > 0;
  return {
    ...inv,
    subtotal: num(inv.subtotal), taxAmount: num(inv.taxAmount), freightAmount: num(inv.freightAmount),
    totalAmount: num(inv.totalAmount), paidAmount: num(inv.paidAmount),
    balance,
    isOverdue: Boolean(overdue),
    displayStatus: overdue ? 'OVERDUE' : inv.status,
    lines: inv.lines?.map((l) => ({ ...l, quantity: num(l.quantity), unitPrice: l.unitPrice == null ? null : num(l.unitPrice), extendedPrice: num(l.extendedPrice) })),
    payments: inv.payments?.map((p) => ({ ...p, amount: num(p.amount) })),
  };
}

export const getInvoice = async (id) => toApi(await prisma.invoice.findUnique({ where: { id }, include: INCLUDE }));

/** Quantity of each order line already on a live invoice. */
async function invoicedByLine(tx, orderId) {
  const rows = await tx.invoiceLine.findMany({
    where: { orderLineId: { not: null }, invoice: { orderId, kind: 'INVOICE', status: { not: 'CANCELLED' } } },
    select: { orderLineId: true, quantity: true },
  });
  const map = new Map();
  for (const r of rows) map.set(r.orderLineId, (map.get(r.orderLineId) || 0) + num(r.quantity));
  return map;
}

async function buildInvoice(tx, order, wanted, { shipmentId, notes, invoiceNumber }) {
  const invoiced = await invoicedByLine(tx, order.id);
  const lines = [];
  for (const line of order.lines) {
    const open = num(line.qtyShipped) - (invoiced.get(line.id) || 0);
    const qty = Math.min(wanted ? (wanted.get(line.id) || 0) : open, open);
    if (qty <= 1e-9) continue;
    lines.push({
      orderLineId: line.id, lineNumber: lines.length + 1, description: line.description,
      quantity: qty, unit: line.unit, unitPrice: line.unitPrice, priceUnit: line.priceUnit,
      extendedPrice: lineAmount(line, qty),
    });
    invoiced.set(line.id, (invoiced.get(line.id) || 0) + qty);
  }
  if (!lines.length) return null;

  const earlier = await tx.invoice.findMany({
    where: { orderId: order.id, kind: 'INVOICE', status: { not: 'CANCELLED' } },
    select: { subtotal: true, taxAmount: true, freightAmount: true },
  });
  const billed = earlier.reduce((b, i) => ({ tax: b.tax + num(i.taxAmount), freight: b.freight + num(i.freightAmount) }), { tax: 0, freight: 0 });
  const final = order.lines.every((l) => l.lineStatus === 'CANCELLED' || (invoiced.get(l.id) || 0) + 1e-9 >= num(l.qtyOrdered));
  const subtotal = money(lines.reduce((s, l) => s + l.extendedPrice, 0));
  const { tax, freight } = chargesFor(order, billed, subtotal, final);
  const now = new Date();
  const total = money(subtotal + tax + freight);
  return tx.invoice.create({
    data: {
      invoiceNumber, orderId: order.id, shipmentId: shipmentId || null, kind: 'INVOICE', status: invoiceStatusFor(total, 0),
      invoiceDate: now, dueDate: dueDateFor(order.paymentTerms, now),
      subtotal, taxAmount: tax, freightAmount: freight, totalAmount: total,
      notes: notes || null, lines: { create: lines },
    },
    include: INCLUDE,
  });
}

const numbered = (prefix, create) => createNumbered({
  count: () => prisma.invoice.count({ where: { invoiceNumber: { startsWith: `${prefix}-` } } }),
  format: padded(prefix, 6),
  create: (invoiceNumber) => retryOverlap(() => prisma.$transaction((tx) => create(tx, invoiceNumber), SERIALIZABLE)),
});

/** Bills one dispatched shipment. Returns the existing invoice if it was already billed. */
export async function invoiceShipment(shipmentId) {
  const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId }, include: { items: true } });
  if (!shipment) refuse(404, 'Shipment not found');
  if (!['IN_TRANSIT', 'DELIVERED', 'EXCEPTION'].includes(shipment.status)) refuse(409, 'A shipment is invoiced once it has left the dock');
  const wanted = new Map();
  for (const it of shipment.items) wanted.set(it.orderLineId, (wanted.get(it.orderLineId) || 0) + num(it.qtyShipped));

  const invoice = await numbered('INV', async (tx, invoiceNumber) => {
    const existing = await tx.invoice.findFirst({ where: { shipmentId, kind: 'INVOICE', status: { not: 'CANCELLED' } }, include: INCLUDE });
    if (existing) return existing;
    const order = await tx.order.findUnique({ where: { id: shipment.orderId }, include: { lines: { orderBy: { lineNumber: 'asc' } } } });
    return buildInvoice(tx, order, wanted, { shipmentId, invoiceNumber });
  });
  return toApi(invoice);
}

/** Bills everything shipped on the order that is not on an invoice yet. */
export async function invoiceOrder(orderId, { notes } = {}) {
  const found = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true, orderType: true, status: true } });
  if (!found) refuse(404, 'Order not found');
  if (found.orderType !== 'SO') refuse(409, 'Only sales orders are invoiced');
  const invoice = await numbered('INV', async (tx, invoiceNumber) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { lines: { orderBy: { lineNumber: 'asc' } } } });
    return buildInvoice(tx, order, null, { notes, invoiceNumber });
  });
  if (!invoice) refuse(409, 'Nothing has shipped on this order that is not already invoiced');
  return toApi(invoice);
}

async function applyPayment(tx, invoice, amount, data) {
  await tx.payment.create({ data: { ...data, invoiceId: invoice.id, amount } });
  const paid = money(num(invoice.paidAmount) + amount);
  return tx.invoice.update({
    where: { id: invoice.id },
    data: { paidAmount: paid, status: invoiceStatusFor(invoice.totalAmount, paid) },
    include: INCLUDE,
  });
}

export async function recordPayment(invoiceId, body = {}) {
  const amount = Number(body.amount);
  const method = String(body.paymentMethod || body.method || '').toUpperCase();
  let paymentDate;
  if (body.paymentDate != null) {
    paymentDate = new Date(body.paymentDate);
    if (Number.isNaN(paymentDate.getTime())) refuse(400, 'paymentDate is not a valid date');
  }
  if (method === 'CREDIT') refuse(400, 'Credits are applied by issuing a credit memo, not by recording a payment');
  const updated = await retryOverlap(() => prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) refuse(404, 'Invoice not found');
    const why = paymentError(invoice, amount, method);
    if (why) refuse(/must be|cannot have/.test(why) ? 400 : 409, why);
    return applyPayment(tx, invoice, amount, {
      paymentMethod: method, referenceNumber: body.referenceNumber ? String(body.referenceNumber) : null,
      notes: body.notes ? String(body.notes) : null, ...(paymentDate && { paymentDate }),
    });
  }, SERIALIZABLE));
  return toApi(updated);
}

/**
 * Issues a credit memo against an invoice.
 *   lines:  [{ invoiceLineId, quantity }]  credit by quantity at the invoiced price, with its share of tax
 *   amount: a plain money credit (no tax)  — use one or the other
 */
export async function creditInvoice(invoiceId, body = {}) {
  const reason = String(body.reason || '').trim();
  if (!reason) refuse(400, 'A reason is required for a credit');
  const run = async (tx, invoiceNumber) => {
    const invoice = await tx.invoice.findUnique({ where: { id: invoiceId }, include: { lines: true } });
    if (!invoice) refuse(404, 'Invoice not found');
    if (invoice.kind !== 'INVOICE') refuse(409, 'A credit memo cannot itself be credited');
    if (invoice.status === 'CANCELLED' || invoice.status === 'DRAFT') refuse(409, `This invoice is ${invoice.status}`);
    const earlier = await tx.invoice.findMany({ where: { creditOfInvoiceId: invoice.id, status: { not: 'CANCELLED' } }, include: { lines: true } });
    const creditedTotal = money(earlier.reduce((s, c) => s - num(c.totalAmount), 0));
    const creditedQty = new Map();
    for (const c of earlier) for (const l of c.lines) if (l.orderLineId) creditedQty.set(l.orderLineId, (creditedQty.get(l.orderLineId) || 0) - num(l.quantity));

    let lines = [];
    let subtotal;
    let tax = 0;
    if (Array.isArray(body.lines) && body.lines.length) {
      for (const [i, raw] of body.lines.entries()) {
        const line = invoice.lines.find((l) => l.id === raw?.invoiceLineId || (raw?.orderLineId && l.orderLineId === raw.orderLineId));
        if (!line) refuse(400, `Credit line ${i + 1}: that line is not on this invoice`);
        const qty = Number(raw.quantity);
        if (!Number.isFinite(qty) || qty <= 0) refuse(400, `Credit line ${i + 1}: quantity must be more than zero`);
        const left = num(line.quantity) - (creditedQty.get(line.orderLineId) || 0);
        if (qty > left + 1e-9) refuse(409, `Credit line ${i + 1}: only ${Math.max(left, 0)} of this line is left to credit`);
        creditedQty.set(line.orderLineId, (creditedQty.get(line.orderLineId) || 0) + qty);
        lines.push({
          orderLineId: line.orderLineId, lineNumber: i + 1, description: line.description, quantity: -qty, unit: line.unit,
          unitPrice: line.unitPrice, priceUnit: line.priceUnit, extendedPrice: -money((num(line.extendedPrice) * qty) / num(line.quantity)),
        });
      }
      subtotal = money(lines.reduce((s, l) => s - l.extendedPrice, 0));
      tax = num(invoice.subtotal) > 0 ? money((num(invoice.taxAmount) * subtotal) / num(invoice.subtotal)) : 0;
    } else {
      subtotal = Number(body.amount);
      if (!Number.isFinite(subtotal) || subtotal <= 0) refuse(400, 'Give the lines being credited, or an amount more than zero');
      if (money(subtotal) !== subtotal) refuse(400, 'amount cannot have fractions of a cent');
      lines = [{ lineNumber: 1, description: reason, quantity: -1, unit: 'EA', extendedPrice: -subtotal }];
    }
    let total = money(subtotal + tax);
    const room = money(num(invoice.totalAmount) - creditedTotal);
    if (total > room + 0.005) {
      if (total - room <= 0.02) { tax = money(tax - (total - room)); total = room; } // rounding on the last credit
      else refuse(409, `Only ${room.toFixed(2)} of this invoice is left to credit`);
    }

    const applied = Math.min(total, Math.max(balanceOf(invoice), 0));
    const credit = await tx.invoice.create({
      data: {
        invoiceNumber, orderId: invoice.orderId, kind: 'CREDIT', creditOfInvoiceId: invoice.id,
        invoiceDate: new Date(), subtotal: -subtotal, taxAmount: -tax, freightAmount: 0, totalAmount: -total,
        paidAmount: -applied, status: invoiceStatusFor(total, applied) === 'PAID' ? 'PAID' : 'SENT',
        notes: reason, lines: { create: lines },
        ...(applied > 0 && { payments: { create: [{ amount: -applied, paymentMethod: 'CREDIT', referenceNumber: invoice.invoiceNumber, notes: 'Applied to the invoice' }] } }),
      },
      include: INCLUDE,
    });
    if (applied > 0) {
      await applyPayment(tx, invoice, applied, { paymentMethod: 'CREDIT', referenceNumber: invoiceNumber, notes: reason });
    }
    return credit;
  };
  return toApi(await numbered('CM', run));
}

/** Money handed back to the customer for the part of a credit memo that was not used against the invoice. */
export async function recordRefund(creditId, body = {}) {
  const amount = Number(body.amount);
  const method = String(body.paymentMethod || body.method || '').toUpperCase();
  if (!Number.isFinite(amount) || amount <= 0) refuse(400, 'amount must be more than zero');
  if (money(amount) !== amount) refuse(400, 'amount cannot have fractions of a cent');
  if (!PAYMENT_METHODS.includes(method) || method === 'CREDIT') refuse(400, `paymentMethod must be one of: ${PAYMENT_METHODS.filter((m) => m !== 'CREDIT').join(', ')}`);
  const updated = await retryOverlap(() => prisma.$transaction(async (tx) => {
    const credit = await tx.invoice.findUnique({ where: { id: creditId } });
    if (!credit) refuse(404, 'Credit memo not found');
    if (credit.kind !== 'CREDIT') refuse(409, 'Refunds are recorded on a credit memo');
    if (credit.status === 'CANCELLED') refuse(409, 'This credit memo is cancelled');
    const owed = money(num(credit.paidAmount) - num(credit.totalAmount)); // both negative
    if (amount > owed + 0.005) refuse(409, `Only ${owed.toFixed(2)} is still owed back on this credit memo`);
    return applyPayment(tx, credit, -amount, {
      paymentMethod: method, referenceNumber: body.referenceNumber ? String(body.referenceNumber) : null, notes: body.notes ? String(body.notes) : 'Refund',
    });
  }, SERIALIZABLE));
  return toApi(updated);
}

export async function cancelInvoice(invoiceId, body = {}) {
  const updated = await retryOverlap(() => prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({ where: { id: invoiceId }, include: { payments: true } });
    if (!invoice) refuse(404, 'Invoice not found');
    if (invoice.status === 'CANCELLED') refuse(409, 'This invoice is already cancelled');
    if (invoice.kind === 'CREDIT') refuse(409, 'A credit memo cannot be cancelled once issued');
    if (invoice.payments.length) refuse(409, 'This invoice has payments or credits on it. Issue a credit memo instead of cancelling.');
    const note = body.reason ? `Cancelled: ${String(body.reason)}` : 'Cancelled';
    return tx.invoice.update({
      where: { id: invoiceId },
      data: { status: 'CANCELLED', notes: [invoice.notes, note].filter(Boolean).join(' · ') },
      include: INCLUDE,
    });
  }, SERIALIZABLE));
  return toApi(updated);
}

export async function listInvoices(query = {}, customerId) {
  const take = Math.min(Math.max(parseInt(query.limit, 10) || 50, 1), 200);
  const skip = Math.max(parseInt(query.offset, 10) || 0, 0);
  const where = {};
  if (query.orderId) where.orderId = String(query.orderId);
  if (query.kind) where.kind = String(query.kind).toUpperCase();
  const status = query.status ? String(query.status).toUpperCase() : null;
  if (status === 'OVERDUE') Object.assign(where, { kind: 'INVOICE', status: { in: ['SENT', 'PARTIAL'] }, dueDate: { lt: new Date() } });
  else if (status === 'OPEN') where.status = { in: ['SENT', 'PARTIAL'] };
  else if (status) {
    if (!['DRAFT', 'SENT', 'PARTIAL', 'PAID', 'CANCELLED'].includes(status)) refuse(400, 'status must be one of: OPEN, SENT, PARTIAL, PAID, OVERDUE, CANCELLED');
    where.status = status;
  }
  const buyerId = customerId || (query.customerId ? String(query.customerId) : null);
  if (buyerId) where.order = { buyerId };
  if (query.search) {
    const q = String(query.search);
    where.OR = [{ invoiceNumber: { contains: q, mode: 'insensitive' } }, { order: { orderNumber: { contains: q, mode: 'insensitive' } } }];
  }
  const [rows, total, open] = await Promise.all([
    prisma.invoice.findMany({ where, take, skip, orderBy: { createdAt: 'desc' }, include: INCLUDE }),
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({ where: { ...where, status: { in: ['SENT', 'PARTIAL'] } }, select: { totalAmount: true, paidAmount: true, kind: true, dueDate: true } }),
  ]);
  const now = new Date();
  const summary = open.reduce((s, i) => {
    const bal = balanceOf(i);
    if (i.kind === 'CREDIT') s.creditsOwed = money(s.creditsOwed - bal);
    else {
      s.openBalance = money(s.openBalance + bal);
      if (i.dueDate && new Date(i.dueDate) < now) s.overdueBalance = money(s.overdueBalance + bal);
    }
    return s;
  }, { openBalance: 0, overdueBalance: 0, creditsOwed: 0 });
  return { data: rows.map(toApi), meta: { total, limit: take, offset: skip }, summary };
}
