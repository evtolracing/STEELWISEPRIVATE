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
 * Mock-first: everything runs locally.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const USE_MOCK = true

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

// ─── MOCK DATA ───────────────────────────────────────────────────────────────

const now = new Date()
const daysAgo = (d) => new Date(now.getTime() - d * 86400000).toISOString().split('T')[0]

const MOCK_REMNANTS = [
  {
    id: 'rem-001', sku: 'REM-A36-PL-001',
    name: 'A36 Plate Drop — 0.50" × 24" × 36"',
    grade: 'A36', spec: 'ASTM A36', form: 'PLATE', family: 'Carbon Steel',
    type: REMNANT_TYPE.DROP, condition: 'A',
    thickness: 0.50, width: 24, length: 36, uom: 'IN',
    estimatedWeight: 102.5, pricePerLb: 0.28,
    location: 'JACKSON', locationName: 'Jackson',
    heatNumber: 'HT-2026-4401', parentJobId: 'JOB-2026-0188',
    cutDate: daysAgo(5), receivedDate: daysAgo(5),
    qtyAvailable: 1, reserved: false,
    imageUrl: null, notes: 'Clean cut, prime edges. From Acme Manufacturing job.',
    division: 'OUTLET',
  },
  {
    id: 'rem-002', sku: 'REM-A36-PL-002',
    name: 'A36 Plate Offcut — 0.75" × 18" × 48"',
    grade: 'A36', spec: 'ASTM A36', form: 'PLATE', family: 'Carbon Steel',
    type: REMNANT_TYPE.OFFCUT, condition: 'A',
    thickness: 0.75, width: 18, length: 48, uom: 'IN',
    estimatedWeight: 137.0, pricePerLb: 0.26,
    location: 'JACKSON', locationName: 'Jackson',
    heatNumber: 'HT-2026-4380', parentJobId: 'JOB-2026-0175',
    cutDate: daysAgo(12), receivedDate: daysAgo(12),
    qtyAvailable: 1, reserved: false,
    imageUrl: null, notes: 'Nesting offcut. Good weldable edges.',
    division: 'OUTLET',
  },
  {
    id: 'rem-003', sku: 'REM-304-SH-001',
    name: '304 SS Sheet — 0.060" × 30" × 42"',
    grade: '304', spec: 'ASTM A240', form: 'SHEET', family: 'Stainless Steel',
    type: REMNANT_TYPE.DROP, condition: 'B',
    thickness: 0.06, width: 30, length: 42, uom: 'IN',
    estimatedWeight: 21.4, pricePerLb: 1.20,
    location: 'DETROIT', locationName: 'Detroit',
    heatNumber: 'HT-2025-8899', parentJobId: 'JOB-2026-0140',
    cutDate: daysAgo(35), receivedDate: daysAgo(35),
    qtyAvailable: 1, reserved: false,
    imageUrl: null, notes: 'Minor surface scuffs. Protective film intact on one side.',
    division: 'OUTLET',
  },
  {
    id: 'rem-004', sku: 'REM-A572-PL-001',
    name: 'A572-50 Plate — 1.0" × 36" × 60"',
    grade: 'A572-50', spec: 'ASTM A572', form: 'PLATE', family: 'HSLA Steel',
    type: REMNANT_TYPE.OVERRUN, condition: 'A',
    thickness: 1.0, width: 36, length: 60, uom: 'IN',
    estimatedWeight: 612.2, pricePerLb: 0.32,
    location: 'JACKSON', locationName: 'Jackson',
    heatNumber: 'HT-2025-7700', parentJobId: 'JOB-2026-0099',
    cutDate: daysAgo(62), receivedDate: daysAgo(62),
    qtyAvailable: 1, reserved: false,
    imageUrl: null, notes: 'Overrun from bridge project. Full MTR available.',
    division: 'OUTLET',
  },
  {
    id: 'rem-005', sku: 'REM-6061-PL-001',
    name: '6061-T6 Aluminum Plate — 0.50" × 12" × 24"',
    grade: '6061-T6', spec: 'ASTM B209', form: 'PLATE', family: 'Aluminum',
    type: REMNANT_TYPE.DROP, condition: 'A',
    thickness: 0.50, width: 12, length: 24, uom: 'IN',
    estimatedWeight: 11.3, pricePerLb: 1.60,
    location: 'GRAND_RAPIDS', locationName: 'Grand Rapids',
    heatNumber: 'HT-2026-AL-220', parentJobId: 'JOB-2026-0201',
    cutDate: daysAgo(3), receivedDate: daysAgo(3),
    qtyAvailable: 1, reserved: false,
    imageUrl: null, notes: 'Fresh cut. From aerospace bracket run.',
    division: 'OUTLET',
  },
  {
    id: 'rem-006', sku: 'REM-A36-PL-003',
    name: 'A36 Plate Drop — 0.375" × 14" × 20"',
    grade: 'A36', spec: 'ASTM A36', form: 'PLATE', family: 'Carbon Steel',
    type: REMNANT_TYPE.DROP, condition: 'B',
    thickness: 0.375, width: 14, length: 20, uom: 'IN',
    estimatedWeight: 26.7, pricePerLb: 0.22,
    location: 'JACKSON', locationName: 'Jackson',
    heatNumber: 'HT-2025-6100', parentJobId: 'JOB-2025-0880',
    cutDate: daysAgo(95), receivedDate: daysAgo(95),
    qtyAvailable: 1, reserved: false,
    imageUrl: null, notes: 'Old stock — minor surface rust, priced to clear.',
    division: 'OUTLET',
  },
  {
    id: 'rem-007', sku: 'REM-316-PL-001',
    name: '316L SS Plate — 0.375" × 20" × 30"',
    grade: '316L', spec: 'ASTM A240', form: 'PLATE', family: 'Stainless Steel',
    type: REMNANT_TYPE.OFFCUT, condition: 'A',
    thickness: 0.375, width: 20, length: 30, uom: 'IN',
    estimatedWeight: 60.1, pricePerLb: 1.95,
    location: 'DETROIT', locationName: 'Detroit',
    heatNumber: 'HT-2026-3300', parentJobId: 'JOB-2026-0165',
    cutDate: daysAgo(18), receivedDate: daysAgo(18),
    qtyAvailable: 1, reserved: false,
    imageUrl: null, notes: 'Premium 316L offcut. Chemical cert available.',
    division: 'OUTLET',
  },
  {
    id: 'rem-008', sku: 'REM-1018-BR-001',
    name: '1018 CRS Bar — 1.5" dia × 18"',
    grade: '1018', spec: 'ASTM A108', form: 'BAR', family: 'Carbon Steel',
    type: REMNANT_TYPE.DROP, condition: 'A',
    thickness: 1.5, width: 0, length: 18, uom: 'IN',
    estimatedWeight: 8.0, pricePerLb: 0.45,
    location: 'JACKSON', locationName: 'Jackson',
    heatNumber: 'HT-2026-2010', parentJobId: 'JOB-2026-0190',
    cutDate: daysAgo(7), receivedDate: daysAgo(7),
    qtyAvailable: 3, reserved: false,
    imageUrl: null, notes: '3 identical drops from shaft turning job.',
    division: 'OUTLET',
  },
  {
    id: 'rem-009', sku: 'REM-HDPE-SH-001',
    name: 'HDPE Sheet Natural — 0.50" × 24" × 36"',
    grade: 'HDPE', spec: 'ASTM D4976', form: 'SHEET', family: 'Polyethylene',
    type: REMNANT_TYPE.DROP, condition: 'A',
    thickness: 0.50, width: 24, length: 36, uom: 'IN',
    estimatedWeight: 6.8, pricePerLb: 2.10,
    location: 'KALAMAZOO', locationName: 'Kalamazoo',
    heatNumber: null, parentJobId: 'JOB-2026-0155',
    cutDate: daysAgo(45), receivedDate: daysAgo(45),
    qtyAvailable: 2, reserved: false,
    imageUrl: null, notes: 'Plastics remnant. Clean edges.',
    division: 'OUTLET',
  },
  {
    id: 'rem-010', sku: 'REM-A36-PL-004',
    name: 'A36 Plate Skeleton — 0.25" × 48" × 96" (holes)',
    grade: 'A36', spec: 'ASTM A36', form: 'PLATE', family: 'Carbon Steel',
    type: REMNANT_TYPE.SKELETON, condition: 'C',
    thickness: 0.25, width: 48, length: 96, uom: 'IN',
    estimatedWeight: 180.0, pricePerLb: 0.12,
    location: 'JACKSON', locationName: 'Jackson',
    heatNumber: 'HT-2025-5500', parentJobId: 'JOB-2025-0801',
    cutDate: daysAgo(120), receivedDate: daysAgo(120),
    qtyAvailable: 1, reserved: false,
    imageUrl: null, notes: 'Laser skeleton — multiple holes. Scrap candidate if unsold by month end.',
    division: 'OUTLET',
  },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function delay(ms = 200) { return new Promise(r => setTimeout(r, ms)) }

// ─── API FUNCTIONS ───────────────────────────────────────────────────────────

/**
 * Search remnant inventory with filters.
 */
export async function searchRemnants(params = {}) {
  if (USE_MOCK) {
    await delay()
    const { query, grade, form, family, location, condition, agingBucket, type,
            minThickness, maxThickness, minWidth, maxWidth, minLength, maxLength,
            limit = 50, offset = 0, sortBy = 'cutDate', sortDir = 'desc' } = params

    let results = [...MOCK_REMNANTS]

    // Text search
    if (query) {
      const q = query.toLowerCase()
      results = results.filter(r =>
        r.name.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q) ||
        r.grade.toLowerCase().includes(q) || (r.notes || '').toLowerCase().includes(q) ||
        (r.heatNumber || '').toLowerCase().includes(q)
      )
    }

    // Facet filters
    if (grade) results = results.filter(r => r.grade === grade)
    if (form) results = results.filter(r => r.form === form)
    if (family) results = results.filter(r => r.family === family)
    if (location) results = results.filter(r => r.location === location)
    if (condition) results = results.filter(r => r.condition === condition)
    if (type) results = results.filter(r => r.type === type)

    // Dimension filters
    if (minThickness) results = results.filter(r => r.thickness >= +minThickness)
    if (maxThickness) results = results.filter(r => r.thickness <= +maxThickness)
    if (minWidth) results = results.filter(r => r.width >= +minWidth)
    if (maxWidth) results = results.filter(r => r.width <= +maxWidth)
    if (minLength) results = results.filter(r => r.length >= +minLength)
    if (maxLength) results = results.filter(r => r.length <= +maxLength)

    // Aging bucket filter
    if (agingBucket) {
      results = results.filter(r => {
        const bucket = getAgingBucket(r.cutDate)
        return bucket.label === AGING_BUCKET[agingBucket]?.label
      })
    }

    // Sort
    results.sort((a, b) => {
      if (sortBy === 'cutDate') {
        const da = new Date(a.cutDate || 0), db = new Date(b.cutDate || 0)
        return sortDir === 'asc' ? da - db : db - da
      }
      if (sortBy === 'price') return sortDir === 'asc' ? a.pricePerLb - b.pricePerLb : b.pricePerLb - a.pricePerLb
      if (sortBy === 'weight') return sortDir === 'asc' ? a.estimatedWeight - b.estimatedWeight : b.estimatedWeight - a.estimatedWeight
      return 0
    })

    // Facet counts for filters
    const allRemnants = MOCK_REMNANTS
    const facets = {
      grades: [...new Set(allRemnants.map(r => r.grade))],
      forms: [...new Set(allRemnants.map(r => r.form))],
      families: [...new Set(allRemnants.map(r => r.family))],
      locations: [...new Set(allRemnants.map(r => r.location))],
      conditions: Object.keys(REMNANT_CONDITION),
      types: Object.keys(REMNANT_TYPE),
      agingBuckets: Object.keys(AGING_BUCKET),
    }

    const total = results.length
    return {
      data: results.slice(offset, offset + limit),
      meta: { total, limit, offset },
      facets,
    }
  }

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
  if (USE_MOCK) {
    await delay()
    const r = MOCK_REMNANTS.find(x => x.id === id)
    if (!r) throw new Error('Remnant not found')
    return { data: { ...r, agingBucket: getAgingBucket(r.cutDate), ageDays: getAgeDays(r.cutDate) } }
  }
  const res = await fetch(`${API_BASE}/remnants/${id}`)
  if (!res.ok) throw new Error('Failed to fetch remnant')
  return res.json()
}

/**
 * Get remnant summary statistics (dashboard cards).
 */
export async function getRemnantStats() {
  if (USE_MOCK) {
    await delay()
    const all = MOCK_REMNANTS
    const totalPieces = all.reduce((s, r) => s + r.qtyAvailable, 0)
    const totalWeight = all.reduce((s, r) => s + r.estimatedWeight * r.qtyAvailable, 0)
    const totalValue = all.reduce((s, r) => s + r.estimatedWeight * r.pricePerLb * r.qtyAvailable, 0)

    const byAging = { FRESH: 0, MID: 0, OLD: 0, STALE: 0 }
    all.forEach(r => {
      const b = getAgingBucket(r.cutDate)
      if (b === AGING_BUCKET.FRESH) byAging.FRESH += r.qtyAvailable
      else if (b === AGING_BUCKET.MID) byAging.MID += r.qtyAvailable
      else if (b === AGING_BUCKET.OLD) byAging.OLD += r.qtyAvailable
      else byAging.STALE += r.qtyAvailable
    })

    const byCondition = { A: 0, B: 0, C: 0 }
    all.forEach(r => { byCondition[r.condition] = (byCondition[r.condition] || 0) + r.qtyAvailable })

    const byLocation = {}
    all.forEach(r => { byLocation[r.location] = (byLocation[r.location] || 0) + r.qtyAvailable })

    return {
      data: {
        totalPieces,
        totalWeight: +totalWeight.toFixed(1),
        totalValue: +totalValue.toFixed(2),
        uniqueItems: all.length,
        byAging,
        byCondition,
        byLocation,
      },
    }
  }
  const res = await fetch(`${API_BASE}/remnants/stats`)
  if (!res.ok) throw new Error('Failed to fetch remnant stats')
  return res.json()
}

/**
 * Get "push remnants first" suggestions for a given material/grade/dimensions.
 * Used in CSR intake to suggest matching remnants before cutting new stock.
 */
export async function getRemnantSuggestions({ grade, form, thickness, width, length, location }) {
  if (USE_MOCK) {
    await delay(150)
    // Find remnants that could satisfy the request (equal or larger dimensions)
    let matches = MOCK_REMNANTS.filter(r => {
      if (r.qtyAvailable < 1 || r.reserved) return false
      if (grade && r.grade !== grade) return false
      if (form && r.form !== form) return false
      // Dimension check: remnant must be ≥ requested dims (with 0.5" tolerance)
      if (thickness && r.thickness < thickness - 0.01) return false
      if (width && r.width < width - 0.5) return false
      if (length && r.length < length - 0.5) return false
      return true
    })

    // Prefer same location, then nearby
    if (location) {
      matches.sort((a, b) => {
        const aLocal = a.location === location ? 0 : 1
        const bLocal = b.location === location ? 0 : 1
        if (aLocal !== bLocal) return aLocal - bLocal
        // Then by aging (oldest first — push old stock)
        return getAgeDays(a.cutDate) > getAgeDays(b.cutDate) ? -1 : 1
      })
    }

    return {
      data: matches.slice(0, 5).map(r => ({
        ...r,
        agingBucket: getAgingBucket(r.cutDate),
        ageDays: getAgeDays(r.cutDate),
        savingsVsNewCut: +(r.estimatedWeight * (0.42 - r.pricePerLb)).toFixed(2),
      })),
      meta: { totalMatches: matches.length },
    }
  }

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
  if (USE_MOCK) {
    await delay(200)
    const r = MOCK_REMNANTS.find(x => x.id === remnantId)
    if (!r) throw new Error('Remnant not found')
    r.reserved = true
    r.reservedFor = orderId
    return { data: { ...r } }
  }
  const res = await fetch(`${API_BASE}/remnants/${remnantId}/reserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  })
  if (!res.ok) throw new Error('Failed to reserve remnant')
  return res.json()
}

/**
 * Release a reserved remnant.
 */
export async function releaseRemnant(remnantId) {
  if (USE_MOCK) {
    await delay(100)
    const r = MOCK_REMNANTS.find(x => x.id === remnantId)
    if (r) { r.reserved = false; r.reservedFor = null }
    return { success: true }
  }
  const res = await fetch(`${API_BASE}/remnants/${remnantId}/release`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to release remnant')
  return res.json()
}
