/**
 * The one place that decides what a customer pays for a catalog item.
 * Every sales channel (web store, order intake, counter sale, quick sale)
 * calls this, so the same customer is quoted the same price everywhere.
 *
 * A customer's pricing tier (A to D) is set on the top-level account and
 * covers all of its divisions. The tier maps to a price level; the price
 * level's multiplier is applied to the product's list price.
 */
import prisma from './db.js';
import { RETAIL, TIER_TO_LEVEL, levelForTier, levelPrice, extendPrice } from './priceRules.js';

export { TIER_TO_LEVEL, levelForTier, levelPrice, extendPrice };

/** The pricing tier row of the top-level account that owns this customer (by id or code). */
export async function accountTier(idOrCode) {
  if (!idOrCode) return null;
  const key = String(idOrCode);
  let org = await prisma.organization.findFirst({ where: { OR: [{ id: key }, { code: key }] }, select: { id: true, parentId: true } });
  for (let i = 0; i < 5 && org?.parentId; i++) {
    const parent = await prisma.organization.findUnique({ where: { id: org.parentId }, select: { id: true, parentId: true } });
    if (!parent) break;
    org = parent;
  }
  return org ? prisma.customerPricingTier.findUnique({ where: { customerId: org.id } }) : null;
}

/** Price level code for a customer. RETAIL when there is no customer or no tier in force. */
export async function customerPriceLevel(idOrCode) {
  try { return levelForTier(await accountTier(idOrCode)); } catch { return 'RETAIL'; }
}

/** A price level row by code: { code, multiplier, label }. Unknown or inactive codes give RETAIL. */
export async function priceLevelByCode(code) {
  if (!code || code === 'RETAIL') return RETAIL;
  const row = await prisma.priceLevel.findUnique({ where: { code: String(code) } }).catch(() => null);
  return row && row.isActive ? { code: row.code, multiplier: Number(row.multiplier), label: row.label } : RETAIL;
}

/** The price level a customer buys at: { code, multiplier, label }. */
export async function customerLevel(idOrCode) {
  return priceLevelByCode(await customerPriceLevel(idOrCode));
}
