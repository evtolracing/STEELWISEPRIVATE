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
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const USE_MOCK = true

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

// Minimum floor: never price below scrap value
const SCRAP_FLOOR_PER_LB = {
  'Carbon Steel':    0.08,
  'HSLA Steel':      0.09,
  'Stainless Steel': 0.45,
  'Aluminum':        0.50,
  'Brass & Copper':  1.20,
  'Polyethylene':    0.30,
  'Ultra-High MW':   0.40,
  default:           0.05,
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function delay(ms = 150) { return new Promise(r => setTimeout(r, ms)) }

function getAgingTier(ageDays) {
  if (ageDays < 30) return AGING_DISCOUNT.FRESH
  if (ageDays < 60) return AGING_DISCOUNT.MID
  if (ageDays < 90) return AGING_DISCOUNT.OLD
  return AGING_DISCOUNT.STALE
}

// ─── LIST PRICE LOOKUP (by grade) ────────────────────────────────────────────

const LIST_PRICES = {
  'A36':      0.42,
  'A572-50':  0.48,
  '1018':     0.68,
  '304':      1.85,
  '316L':     2.95,
  '6061-T6':  2.45,
  'C360':     3.80,
  'HDPE':     3.20,
  'UHMW':     5.10,
}

function getListPrice(grade) {
  return LIST_PRICES[grade] || 1.00
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
  if (USE_MOCK) {
    await delay()
    const { grade, condition = 'A', ageDays = 0, weight = 0, family, qty = 1 } = params

    const listPrice = getListPrice(grade)
    const agingTier = getAgingTier(ageDays)
    const condAdj = CONDITION_ADJUSTMENT[condition] || CONDITION_ADJUSTMENT.A

    const totalDiscount = Math.min(agingTier.discount + condAdj.extra, 0.85) // cap at 85% off
    const rawPrice = +(listPrice * (1 - totalDiscount)).toFixed(4)
    const scrapFloor = SCRAP_FLOOR_PER_LB[family] || SCRAP_FLOOR_PER_LB.default
    const remnantPrice = Math.max(rawPrice, scrapFloor)

    const lineTotal = +(remnantPrice * weight * qty).toFixed(2)
    const listTotal = +(listPrice * weight * qty).toFixed(2)

    return {
      listPricePerLb: listPrice,
      remnantPricePerLb: +remnantPrice.toFixed(4),
      agingDiscount: agingTier.discount,
      agingTierLabel: agingTier.label,
      conditionDiscount: condAdj.extra,
      conditionLabel: condAdj.label,
      totalDiscount,
      totalDiscountPct: +(totalDiscount * 100).toFixed(1),
      lineTotal,
      listTotal,
      savingsVsList: +(listTotal - lineTotal).toFixed(2),
      savingsPct: listTotal > 0 ? +((1 - lineTotal / listTotal) * 100).toFixed(1) : 0,
      scrapFloor,
      atFloor: remnantPrice <= scrapFloor,
      pricingTier: agingTier.label,
    }
  }

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
  if (USE_MOCK) {
    await delay(200)
    const results = []
    let totalSavings = 0
    let totalList = 0
    let totalRemnant = 0

    for (const item of items) {
      const p = await calculateRemnantPrice(item)
      results.push({ remnantId: item.remnantId, ...p })
      totalSavings += p.savingsVsList
      totalList += p.listTotal
      totalRemnant += p.lineTotal
    }

    return {
      data: results,
      summary: {
        totalList: +totalList.toFixed(2),
        totalRemnant: +totalRemnant.toFixed(2),
        totalSavings: +totalSavings.toFixed(2),
        avgDiscount: totalList > 0 ? +((1 - totalRemnant / totalList) * 100).toFixed(1) : 0,
      },
    }
  }

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
  if (USE_MOCK) {
    const scrap = SCRAP_FLOOR_PER_LB[family] || SCRAP_FLOOR_PER_LB.default
    const list = getListPrice(grade)
    // CSR floor = max(scrap + 10%, list * 15%)
    const floor = Math.max(scrap * 1.10, list * 0.15)
    return {
      floor: +floor.toFixed(4),
      scrapValue: scrap,
      listPrice: list,
      maxDiscountPct: +((1 - floor / list) * 100).toFixed(1),
    }
  }
  const res = await fetch(`${API_BASE}/remnants/pricing/floor?grade=${grade}&family=${encodeURIComponent(family)}`)
  if (!res.ok) throw new Error('Failed to fetch CSR price floor')
  return res.json()
}
