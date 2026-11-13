/**
 * Quote and RFQ rules, kept free of the database so they can be unit tested.
 *
 *  - A quote line's total is worked out here from quantity and price; a total
 *    sent by the screen is ignored.
 *  - CWT and TON prices need the quantity in pounds.
 *  - Quote: DRAFT → SENT → ACCEPTED or REJECTED. A draft can be accepted
 *    directly (the customer said yes on the phone). Past its valid-until date
 *    a quote counts as EXPIRED and cannot be accepted.
 */
export const PRICE_UNITS = ['CWT', 'LB', 'TON', 'EACH', 'LF'];
const DIVISOR = { CWT: 100, TON: 2000, LB: 1, EACH: 1, LF: 1 };
const round2 = (n) => Math.round(n * 100) / 100;

/** { extended } or { error } */
export function quoteLineTotal(quantity, unit, unitPrice, priceUnit = 'CWT') {
  const qty = Number(quantity);
  const price = Number(unitPrice);
  if (!Number.isFinite(qty) || qty <= 0) return { error: 'quantity must be more than zero' };
  if (!Number.isFinite(price) || price < 0) return { error: 'unitPrice must be zero or more' };
  if (!PRICE_UNITS.includes(priceUnit)) return { error: `priceUnit must be one of: ${PRICE_UNITS.join(', ')}` };
  if (['CWT', 'TON'].includes(priceUnit) && String(unit || 'LB').toUpperCase() !== 'LB') {
    return { error: `a ${priceUnit} price needs the quantity in LB` };
  }
  return { extended: round2((qty * price) / DIVISOR[priceUnit]) };
}

export const QUOTE_MOVES = {
  DRAFT: ['SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
  PENDING_APPROVAL: ['SENT', 'REJECTED', 'EXPIRED'],
  SENT: ['ACCEPTED', 'REJECTED', 'EXPIRED', 'COUNTERED'],
  COUNTERED: ['SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
  ACCEPTED: [], REJECTED: [], EXPIRED: [],
};

export const isExpired = (quote, now = new Date()) => Boolean(quote.validUntil) && new Date(quote.validUntil) < now && !['ACCEPTED', 'REJECTED'].includes(quote.status);

/** null when allowed, otherwise why the quote cannot move to `to`. */
export function quoteMoveError(quote, to, now = new Date()) {
  const from = quote.status;
  if (!QUOTE_MOVES[from]) return `Unknown quote status ${from}`;
  if (from === to) return `This quote is already ${to}`;
  if (to === 'ACCEPTED' && isExpired(quote, now)) return 'This quote has expired. Create a new quote with current prices.';
  if (!QUOTE_MOVES[from].includes(to)) return `A ${from} quote cannot be changed to ${to}`;
  return null;
}

export const RFQ_OPEN = ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'QUOTED'];
