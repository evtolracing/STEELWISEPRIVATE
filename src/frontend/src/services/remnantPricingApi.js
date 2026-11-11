/**
 * remnantPricingApi.js — Aging-based remnant pricing engine.
 *
 * Pricing tiers:
 *   < 30 days  → 25% off list (fresh, desirable)
 *   30–60 days → 35% off list (motivate movement)
 *   60–90 days → 50% off list (clearance)
 *   90+ days   → 65% off list (deep clearance / scrap candidate)
 *
 * Condition adjustments:
 *   A (Prime)  → no additional discount
 *   B (Good)   → additional 5% off
 *   C (Fair)   → additional 15% off
 *
 * Supports volume bundles and negotiation floor for CSRs.
 * Calculated by the backend at /api/remnants/pricing.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api'

// ─── PRICING TIERS ───────────────────────────────────────────────────────────

export const AGING_DISCOUNT = {
  FRESH: { maxDays: 30,  discount: 0.25, label: 'Fresh (−25%)' },
  MID:   { maxDays: 60,  discount: 0.35, label: 'Mid-Age (−35%)' },
  OLD:   { maxDays: 90,  discount: 0.50, label: 'Clearance (−50%)' },
  STALE: { maxDays: 9999, discount: 0.65, label: 'Deep Clearance (−65%)' },
}

export const CONDITION_ADJUSTMENT = {
  A: { extra: 0.00, label: 'Prime — no extra discount' },
  B: { extra: 0.05, label: 'Good — additional 5% off' },
  C: { extra: 0.15, label: 'Fair — additional 15% off' },
}

// ─── API FUNCTIONS ───────────────────────────────────────────────────────────

/**
 * Calculate remnant price based on aging + condition.
 *
 * @param {object} params
 * @param {string} params.grade       — material grade (e.g. 'A36')
 * @param {string} params.condition   — 'A' | 'B' | 'C'
 * @param {number} params.ageDays     — days since cut
 * @param {number} params.weight      — estimated weight in lbs
 * @param {string} params.family      — material family for scrap floor
 * @param {number} [params.qty=1]     — quantity
 * @returns {{ listPricePerLb, remnantPricePerLb, agingDiscount, conditionDiscount, totalDiscount, lineTotal, scrapFloor, savingsVsList, pricingTier }}
 */
export async function calculateRemnantPrice(params) {
  const res = await fetch(`${API_BASE}/remnants/pricing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error('Remnant pricing failed')
  return res.json()
}

/**
 * Get a pricing summary for a list of remnants (batch pricing).
 * Used in cart / checkout for multiple remnant items.
 */
export async function batchRemnantPrice(items) {
  const res = await fetch(`${API_BASE}/remnants/pricing/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  })
  if (!res.ok) throw new Error('Batch remnant pricing failed')
  return res.json()
}

/**
 * Get the CSR negotiation floor — the lowest price a CSR can approve.
 * Below this requires manager override.
 */
export async function getCsrPriceFloor(grade, family) {
  const res = await fetch(`${API_BASE}/remnants/pricing/floor?grade=${encodeURIComponent(grade || '')}&family=${encodeURIComponent(family || '')}`)
  if (!res.ok) throw new Error('Failed to fetch CSR price floor')
  return res.json()
}
