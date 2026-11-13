/**
 * Credit limit rule, with no database access so it can be unit tested.
 *
 * Rule 32 (owner's decision, 2026-11-13): an order that would put a customer
 * over their credit limit is saved on hold with a warning, and a manager
 * releases it. Each release is recorded.
 *
 *   exposure = what the account owes on invoices
 *            + committed orders not yet invoiced
 *            + the order being committed
 */
const money = (n) => Math.round((Number(n) || 0) * 100) / 100;

/** Order statuses that commit the customer to pay: the hold is decided when an order enters one of these. */
export const COMMITTED_STATUSES = ['PENDING', 'CONFIRMED'];
/** Orders counted as open exposure until they are invoiced. */
export const OPEN_EXPOSURE_STATUSES = ['PENDING', 'CONFIRMED', 'PARTIAL'];

/**
 * { limit, owed, openOrders, thisOrder, exposure, over, overBy }.
 * A limit that is not set (null or undefined) means no limit: never over.
 * A limit of zero is a real limit: any order on account is over it.
 */
export function creditPosition({ limit, owed = 0, openOrders = 0, thisOrder = 0 }) {
  const hasLimit = limit !== null && limit !== undefined && limit !== '' && Number.isFinite(Number(limit));
  const exposure = money(money(owed) + money(openOrders) + money(thisOrder));
  const cap = hasLimit ? money(limit) : null;
  const overBy = hasLimit ? money(exposure - cap) : 0;
  return { limit: cap, owed: money(owed), openOrders: money(openOrders), thisOrder: money(thisOrder), exposure, over: hasLimit && overBy > 0.004, overBy: overBy > 0 ? overBy : 0 };
}

/** What an order still adds to exposure: its total less what has already been invoiced for it, never below zero. */
export function uninvoiced(orderTotal, invoicedTotal) {
  return Math.max(money(money(orderTotal) - money(invoicedTotal)), 0);
}

/** The sentence shown to the person entering the order. */
export function creditHoldMessage(p) {
  const usd = (n) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `This order is on credit hold. It would bring the account to ${usd(p.exposure)} against a credit limit of ${usd(p.limit)} (${usd(p.overBy)} over). A manager can release it.`;
}
