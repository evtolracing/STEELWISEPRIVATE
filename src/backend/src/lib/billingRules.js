/**
 * Billing rules, kept free of the database so they can be unit tested.
 *
 *  - An invoice bills what a shipment took off the dock, at the order line's price.
 *  - Freight is billed once, on the order's first invoice.
 *  - Tax is shared across invoices in proportion to what each one bills; the
 *    invoice that finishes the order takes the remainder, so the invoices add
 *    up to the order's tax to the cent.
 *  - Terms: "NET 30" style terms give the due date. COD, cash, prepaid and
 *    "due on receipt" are due the same day. No terms means NET 30.
 */
export const PAYMENT_METHODS = ['CASH', 'CHECK', 'CARD', 'ACH', 'WIRE', 'CREDIT'];
export const DEFAULT_TERM_DAYS = 30;

export const money = (n) => Math.round((Number(n) || 0) * 100) / 100;

export function termDays(terms) {
  const t = String(terms || '').toUpperCase().replace(/[\s_-]+/g, '');
  if (!t) return DEFAULT_TERM_DAYS;
  if (/^(COD|CASH|PREPAID|PREPAY|CIA|DUEONRECEIPT|CREDITCARD|CARD)$/.test(t)) return 0;
  const m = t.match(/NET(\d{1,3})/) || t.match(/^(\d{1,3})(DAYS?)?$/);
  return m ? Number(m[1]) : DEFAULT_TERM_DAYS;
}

export function dueDateFor(terms, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + termDays(terms));
  return d;
}

/** Price for `qty` of an order line, from the line's own extended price. */
export function lineAmount(line, qty) {
  const ordered = Number(line.qtyOrdered) || 0;
  const extended = Number(line.extendedPrice) || 0;
  if (ordered <= 0) return 0;
  return money((extended * qty) / ordered);
}

/**
 * Tax and freight for an invoice.
 *   order:    { subtotal, taxAmount, freightAmount }
 *   billed:   { subtotal, tax, freight, count } already on this order's invoices
 *   subtotal: what this invoice bills
 *   final:    true when this invoice finishes the order
 */
export function chargesFor(order, billed, subtotal, final) {
  const orderSubtotal = Number(order.subtotal) || 0;
  const orderTax = Number(order.taxAmount) || 0;
  const orderFreight = Number(order.freightAmount) || 0;
  const freight = money(Math.max(orderFreight - (Number(billed.freight) || 0), 0));
  const taxLeft = money(Math.max(orderTax - (Number(billed.tax) || 0), 0));
  let tax = orderSubtotal > 0 ? money((orderTax * subtotal) / orderSubtotal) : 0;
  if (final || tax > taxLeft) tax = taxLeft;
  return { tax, freight };
}

/** DRAFT and CANCELLED are set by hand; the rest follow the money. */
export function invoiceStatusFor(total, paid) {
  const t = Math.abs(money(total));
  const p = Math.abs(money(paid));
  if (t === 0 || p + 0.005 >= t) return 'PAID';
  return p > 0 ? 'PARTIAL' : 'SENT';
}

export const balanceOf = (invoice) => money(Number(invoice.totalAmount) - Number(invoice.paidAmount));

/** null when fine, otherwise why a payment of `amount` cannot be taken on the invoice. */
export function paymentError(invoice, amount, method) {
  if (invoice.kind === 'CREDIT') return 'This is a credit memo. Record a refund on it instead of a payment.';
  if (invoice.status === 'CANCELLED') return 'This invoice is cancelled.';
  if (invoice.status === 'DRAFT') return 'This invoice is still a draft.';
  if (!Number.isFinite(amount) || amount <= 0) return 'amount must be more than zero';
  if (money(amount) !== amount) return 'amount cannot have fractions of a cent';
  if (!PAYMENT_METHODS.includes(method)) return `paymentMethod must be one of: ${PAYMENT_METHODS.join(', ')}`;
  const balance = balanceOf(invoice);
  if (amount > balance + 0.005) return `Only ${balance.toFixed(2)} is still owed on this invoice`;
  return null;
}
