/**
 * remnantInventoryApi.js — Dedicated remnant inventory service.
 *
 * Remnants are first-class inventory items with:
 *   - Aging tracking (30 / 60 / 90+ day buckets)
 *   - Origin traceability (heat, parent job, cut date)
 *   - Condition grading (A/B/C)
 *   - Actual measured dimensions
 *   - Location-specific availability
 *   - Outlet-only visibility rules
 *
 * Backed by /api/remnants.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api'

// ─── ENUMS ───────────────────────────────────────────────────────────────────

export const REMNANT_TYPE = {
  DROP:     'DROP',       // leftover from a cut
  OFFCUT:   'OFFCUT',     // usable piece from nesting
  OVERRUN:  'OVERRUN',    // surplus from production
  RETURN:   'RETURN',     // customer return / good condition
  SKELETON: 'SKELETON',   // skeleton from laser / plasma
}

export const REMNANT_CONDITION = {
  A: { code: 'A', label: 'Prime — clean edges, no defects',      color: '#2e7d32' },
  B: { code: 'B', label: 'Good — minor surface marks / edge burr', color: '#f9a825' },
  C: { code: 'C', label: 'Fair — oxidation, scratches, usable',  color: '#e65100' },
}

export const AGING_BUCKET = {
  FRESH:    { label: '< 30 days',    days: 30,   color: '#2e7d32', badge: 'New' },
  MID:      { label: '30–60 days',   days: 60,   color: '#f9a825', badge: '30+' },
  OLD:      { label: '60–90 days',   days: 90,   color: '#e65100', badge: '60+' },
  STALE:    { label: '90+ days',     days: 9999, color: '#b71c1c', badge: '90+' },
}

export function getAgingBucket(cutDateStr) {
  if (!cutDateStr) return AGING_BUCKET.STALE
  const age = Math.floor((Date.now() - new Date(cutDateStr).getTime()) / 86400000)
  if (age < 30) return AGING_BUCKET.FRESH
  if (age < 60) return AGING_BUCKET.MID
  if (age < 90) return AGING_BUCKET.OLD
  return AGING_BUCKET.STALE
}

export function getAgeDays(cutDateStr) {
  if (!cutDateStr) return 999
  return Math.floor((Date.now() - new Date(cutDateStr).getTime()) / 86400000)
}

// ─── API FUNCTIONS ───────────────────────────────────────────────────────────

/**
 * Search remnant inventory with filters.
 */
export async function searchRemnants(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') qs.set(k, v) })
  const res = await fetch(`${API_BASE}/remnants?${qs}`)
  if (!res.ok) throw new Error('Failed to search remnants')
  return res.json()
}

/**
 * Get a single remnant by ID.
 */
export async function getRemnantById(id) {
  const res = await fetch(`${API_BASE}/remnants/${id}`)
  if (!res.ok) throw new Error('Failed to fetch remnant')
  return res.json()
}

/**
 * Get remnant summary statistics (dashboard cards).
 */
export async function getRemnantStats() {
  const res = await fetch(`${API_BASE}/remnants/stats`)
  if (!res.ok) throw new Error('Failed to fetch remnant stats')
  return res.json()
}

/**
 * Get "push remnants first" suggestions for a given material/grade/dimensions.
 * Used in CSR intake to suggest matching remnants before cutting new stock.
 */
export async function getRemnantSuggestions({ grade, form, thickness, width, length, location }) {
  const qs = new URLSearchParams()
  if (grade) qs.set('grade', grade)
  if (form) qs.set('form', form)
  if (thickness) qs.set('thickness', thickness)
  if (width) qs.set('width', width)
  if (length) qs.set('length', length)
  if (location) qs.set('location', location)
  const res = await fetch(`${API_BASE}/remnants/suggestions?${qs}`)
  if (!res.ok) throw new Error('Failed to fetch remnant suggestions')
  return res.json()
}

/**
 * Reserve a remnant for an order (soft hold).
 */
export async function reserveRemnant(remnantId, orderId) {
  const res = await fetch(`${API_BASE}/remnants/${remnantId}/reserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to reserve remnant')
  return res.json()
}

/**
 * Release a reserved remnant.
 */
export async function releaseRemnant(remnantId) {
  const res = await fetch(`${API_BASE}/remnants/${remnantId}/release`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to release remnant')
  return res.json()
}
