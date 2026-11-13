/**
 * Price rules with no database access, so they can be unit tested.
 * See customerPricing.js for how they are used.
 */
export const TIER_TO_LEVEL = { A: 'CONTRACT_B', B: 'CONTRACT_A', C: 'VOLUME', D: 'RETAIL' };
export const RETAIL = { code: 'RETAIL', multiplier: 1, label: 'Retail / List Price' };

/** The price level code a pricing tier gives today. Inactive, not yet started or expired tiers give RETAIL. */
export function levelForTier(tier, now = new Date()) {
  if (!tier || tier.isActive === false) return 'RETAIL';
  if (tier.effectiveFrom && new Date(tier.effectiveFrom) > now) return 'RETAIL';
  if (tier.effectiveUntil && new Date(tier.effectiveUntil) < now) return 'RETAIL';
  return TIER_TO_LEVEL[tier.tierCode] || 'RETAIL';
}

/**
 * What one unit costs at a level, in the product's own price unit (CWT, EACH, ...).
 * Returns null when the product has no list price.
 */
export function levelPrice(product, level = RETAIL) {
  const list = Number(product?.basePriceCwt);
  if (!product || product.basePriceCwt == null || !(list > 0)) return null;
  return { listPrice: list, unitPrice: Number((list * (level.multiplier ?? 1)).toFixed(4)), priceUnit: product.priceUnit || 'CWT' };
}

/** Line total for a quantity at a unit price. CWT and TON prices take the quantity in pounds. */
export function extendPrice(unitPrice, priceUnit, quantity) {
  const qty = Number(quantity) || 0;
  const divisor = priceUnit === 'CWT' ? 100 : priceUnit === 'TON' ? 2000 : 1;
  return Math.round(((qty / divisor) * unitPrice) * 100) / 100;
}

/**
 * Which state's rate applies: always the selling branch's state (the owner's
 * decision, rule 27). Only when the branch is not known does it fall back to
 * the ship-to state and then the customer's state, so an order is never left
 * untaxed just because no branch was sent. Pure, so it can be unit tested.
 */
export function taxStateFor({ shipToState, customerState, branchState } = {}) {
  const clean = (v) => (v ? String(v).trim().toUpperCase().slice(0, 2) : '') || null;
  return clean(branchState) || clean(shipToState) || clean(customerState);
}
