/**
 * overrideApi.js — CSR Override service with full audit trail.
 *
 * Override Types:
 *   CUTOFF_VIOLATION  — Order placed after cutoff, CSR overrides to force next-day
 *   CAPACITY_WARNING  — System flags capacity risk, CSR overrides to accept
 *   PRICING_OVERRIDE  — CSR overrides contract/list pricing for the order
 *
 * Each override captures:
 *   - type, reasonCode, notes (free-text)
 *   - user, timestamp, orderId
 *   - originalValue / overrideValue (context-specific)
 *   - status: ACTIVE | REVOKED | EXPIRED
 *
 * Permission model:
 *   CSR         — can create overrides (CUTOFF, CAPACITY, PRICING within limit)
 *   SR_CSR      — can create overrides with higher pricing threshold
 *   MANAGER     — can view audit log, revoke overrides
 *   ADMIN       — full access
 *
 * Mock-first: everything runs locally when window.__USE_MOCK_RULES__ ≠ false.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const USE_MOCK = window.__USE_MOCK_RULES__ !== false

// ─── ENUMS ───────────────────────────────────────────────────────────────────

export const OVERRIDE_TYPE = {
  CUTOFF_VIOLATION: 'CUTOFF_VIOLATION',
  CAPACITY_WARNING: 'CAPACITY_WARNING',
  PRICING_OVERRIDE: 'PRICING_OVERRIDE',
}

export const OVERRIDE_STATUS = {
  ACTIVE:  'ACTIVE',
  REVOKED: 'REVOKED',
  EXPIRED: 'EXPIRED',
}

/** Reason codes per override type */
export const REASON_CODES = {
  [OVERRIDE_TYPE.CUTOFF_VIOLATION]: [
    { code: 'CUSTOMER_EMERGENCY',     label: 'Customer emergency / shutdown risk' },
    { code: 'PRODUCTION_READY',       label: 'Material already staged & ready' },
    { code: 'CARRIER_DELAY',          label: 'Carrier agreed to late pickup' },
    { code: 'PARTIAL_LOAD_AVAILABLE', label: 'Partial load / can add to existing shipment' },
    { code: 'MANAGER_APPROVAL',       label: 'Manager verbal approval obtained' },
    { code: 'OTHER_CUTOFF',           label: 'Other (see notes)' },
  ],
  [OVERRIDE_TYPE.CAPACITY_WARNING]: [
    { code: 'OUTSOURCE_AVAILABLE',    label: 'Outsource processing confirmed' },
    { code: 'OVERTIME_APPROVED',      label: 'Overtime / weekend shift approved' },
    { code: 'PRIORITY_BUMP',          label: 'Bumped lower-priority jobs' },
    { code: 'CUSTOMER_FLEXIBLE_DATE', label: 'Customer flexible on delivery date' },
    { code: 'SPLIT_SHIPMENT',         label: 'Will ship partial / split' },
    { code: 'OTHER_CAPACITY',         label: 'Other (see notes)' },
  ],
  [OVERRIDE_TYPE.PRICING_OVERRIDE]: [
    { code: 'COMPETITIVE_MATCH',      label: 'Competitive price match' },
    { code: 'VOLUME_COMMITMENT',      label: 'Volume commitment from customer' },
    { code: 'RELATIONSHIP_DISCOUNT',  label: 'Relationship / loyalty discount' },
    { code: 'REMNANT_CLEARANCE',      label: 'Remnant clearance pricing' },
    { code: 'MANAGER_APPROVED_PRICE', label: 'Manager-approved special pricing' },
    { code: 'ERROR_CORRECTION',       label: 'Correcting a pricing error' },
    { code: 'OTHER_PRICING',          label: 'Other (see notes)' },
  ],
}

/** Human-readable labels for override types */
export const OVERRIDE_TYPE_LABELS = {
  [OVERRIDE_TYPE.CUTOFF_VIOLATION]: 'Cutoff Violation Override',
  [OVERRIDE_TYPE.CAPACITY_WARNING]: 'Capacity Warning Override',
  [OVERRIDE_TYPE.PRICING_OVERRIDE]: 'Pricing Override',
}

/** Role-based permission checks */
export const PERMISSIONS = {
  CSR:     { canCreate: true, canViewAudit: false, canRevoke: false, pricingLimitPct: 10 },
  SR_CSR:  { canCreate: true, canViewAudit: false, canRevoke: false, pricingLimitPct: 20 },
  MANAGER: { canCreate: true, canViewAudit: true,  canRevoke: true,  pricingLimitPct: 50 },
  ADMIN:   { canCreate: true, canViewAudit: true,  canRevoke: true,  pricingLimitPct: 100 },
}

/**
 * Check if a user role can perform an override action.
 */
export function checkPermission(role, action) {
  const perms = PERMISSIONS[role] || PERMISSIONS.CSR
  if (action === 'create') return perms.canCreate
  if (action === 'viewAudit') return perms.canViewAudit
  if (action === 'revoke') return perms.canRevoke
  return false
}

/**
 * Check if a pricing override is within the role's allowed threshold.
 */
export function isPricingWithinLimit(role, discountPct) {
  const perms = PERMISSIONS[role] || PERMISSIONS.CSR
  return Math.abs(discountPct) <= perms.pricingLimitPct
}

// ─── MOCK DATA ───────────────────────────────────────────────────────────────

let _nextId = 100

const MOCK_OVERRIDES = [
  {
    id: 'OVR-001',
    type: OVERRIDE_TYPE.CUTOFF_VIOLATION,
    status: OVERRIDE_STATUS.ACTIVE,
    orderId: 'ORD-2026-0200',
    orderNumber: 'SO-2026-0200',
    reasonCode: 'CUSTOMER_EMERGENCY',
    reasonLabel: 'Customer emergency / shutdown risk',
    notes: 'Customer Acme Manufacturing has a production line down. Need material by 7am tomorrow or they lose $50K/hr.',
    originalValue: 'Cutoff 3:30 PM ET — order placed at 4:15 PM',
    overrideValue: 'Forced next-day ship — carrier arranged for late pickup at 6 PM',
    user: 'jdoe',
    userName: 'Jane Doe',
    userRole: 'SR_CSR',
    timestamp: '2026-02-06T16:20:00Z',
    location: 'JACKSON',
    division: 'METALS',
    customerName: 'Acme Manufacturing',
  },
  {
    id: 'OVR-002',
    type: OVERRIDE_TYPE.PRICING_OVERRIDE,
    status: OVERRIDE_STATUS.ACTIVE,
    orderId: 'ORD-2026-0201',
    orderNumber: 'SO-2026-0201',
    reasonCode: 'COMPETITIVE_MATCH',
    reasonLabel: 'Competitive price match',
    notes: 'Customer showed a quote from competitor at $0.38/lb for A36 plate. Matching to retain the business — 20-ton order.',
    originalValue: 'Contract A price: $0.42/lb',
    overrideValue: 'Adjusted to $0.38/lb (−9.5%)',
    user: 'mwilliams',
    userName: 'Mike Williams',
    userRole: 'CSR',
    timestamp: '2026-02-06T10:45:00Z',
    location: 'DETROIT',
    division: 'METALS',
    customerName: 'Metro Manufacturing',
  },
  {
    id: 'OVR-003',
    type: OVERRIDE_TYPE.CAPACITY_WARNING,
    status: OVERRIDE_STATUS.REVOKED,
    orderId: 'ORD-2026-0202',
    orderNumber: 'SO-2026-0202',
    reasonCode: 'OVERTIME_APPROVED',
    reasonLabel: 'Overtime / weekend shift approved',
    notes: 'Saturday shift approved by ops manager Tom. 3 saw operators confirmed.',
    originalValue: 'Capacity risk: 4 processing steps, estimated 2-day backlog',
    overrideValue: 'Accepted — Saturday overtime crew will handle',
    user: 'sjohnson',
    userName: 'Sarah Johnson',
    userRole: 'MANAGER',
    timestamp: '2026-02-05T14:00:00Z',
    revokedBy: 'admin',
    revokedAt: '2026-02-06T09:00:00Z',
    revokeReason: 'Saturday shift cancelled due to weather',
    location: 'JACKSON',
    division: 'METALS',
    customerName: 'Industrial Corp',
  },
  {
    id: 'OVR-004',
    type: OVERRIDE_TYPE.CUTOFF_VIOLATION,
    status: OVERRIDE_STATUS.ACTIVE,
    orderId: 'ORD-2026-0200',
    orderNumber: 'SO-2026-0200',
    reasonCode: 'PARTIAL_LOAD_AVAILABLE',
    reasonLabel: 'Partial load / can add to existing shipment',
    notes: 'Truck heading to same destination at 5 PM. Added 12 pcs A36 plate to existing load.',
    originalValue: 'Cutoff 3:30 PM ET — line added at 4:45 PM',
    overrideValue: 'Added to existing shipment BOL-2026-SP-001',
    user: 'jdoe',
    userName: 'Jane Doe',
    userRole: 'SR_CSR',
    timestamp: '2026-02-06T16:50:00Z',
    location: 'JACKSON',
    division: 'METALS',
    customerName: 'Acme Manufacturing',
  },
]

let _overrides = [...MOCK_OVERRIDES]

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function delay(ms = 250) {
  return new Promise(r => setTimeout(r, ms))
}

// ─── VALIDATION ──────────────────────────────────────────────────────────────

/**
 * Validate an override before creation.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateOverride(override) {
  const errors = []
  if (!override.type || !OVERRIDE_TYPE[override.type]) {
    errors.push('Invalid override type.')
  }
  if (!override.reasonCode) {
    errors.push('A reason code is required.')
  }
  if (!override.notes || override.notes.trim().length < 10) {
    errors.push('Notes must be at least 10 characters — provide meaningful context.')
  }
  if (!override.orderId) {
    errors.push('Override must be associated with an order.')
  }

  // Check reason code is valid for the type
  if (override.type && override.reasonCode) {
    const validCodes = (REASON_CODES[override.type] || []).map(r => r.code)
    if (!validCodes.includes(override.reasonCode)) {
      errors.push(`Reason code "${override.reasonCode}" is not valid for type ${override.type}.`)
    }
  }

  return { valid: errors.length === 0, errors }
}

// ─── API FUNCTIONS ───────────────────────────────────────────────────────────

/**
 * Create a new override.
 * @param {object} payload - { type, reasonCode, notes, orderId, orderNumber, originalValue, overrideValue, location, division, customerName }
 * @returns {{ data: Override }}
 */
export async function createOverride(payload) {
  if (USE_MOCK) {
    await delay(300)
    const { valid, errors } = validateOverride(payload)
    if (!valid) throw new Error(errors.join(' | '))

    const reasonDef = (REASON_CODES[payload.type] || []).find(r => r.code === payload.reasonCode)

    const newOverride = {
      id: `OVR-${String(++_nextId).padStart(3, '0')}`,
      type: payload.type,
      status: OVERRIDE_STATUS.ACTIVE,
      orderId: payload.orderId,
      orderNumber: payload.orderNumber || payload.orderId,
      reasonCode: payload.reasonCode,
      reasonLabel: reasonDef?.label || payload.reasonCode,
      notes: payload.notes,
      originalValue: payload.originalValue || null,
      overrideValue: payload.overrideValue || null,
      user: 'current-user',
      userName: 'Current User',
      userRole: payload.userRole || 'CSR',
      timestamp: new Date().toISOString(),
      location: payload.location || null,
      division: payload.division || null,
      customerName: payload.customerName || null,
    }

    _overrides = [newOverride, ..._overrides]
    return { data: newOverride }
  }

  const res = await fetch(`${API_BASE}/overrides`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to create override')
  return res.json()
}

/**
 * Get all overrides for a specific order.
 */
export async function getOverridesForOrder(orderId) {
  if (USE_MOCK) {
    await delay()
    const result = _overrides.filter(o => o.orderId === orderId)
    return { data: result }
  }
  const res = await fetch(`${API_BASE}/overrides?orderId=${encodeURIComponent(orderId)}`)
  if (!res.ok) throw new Error('Failed to fetch overrides')
  return res.json()
}

/**
 * Get all overrides (audit log — filtered by type, status, date range, user).
 */
export async function getOverrideAuditLog(filters = {}) {
  if (USE_MOCK) {
    await delay()
    let result = [..._overrides]
    if (filters.type) result = result.filter(o => o.type === filters.type)
    if (filters.status) result = result.filter(o => o.status === filters.status)
    if (filters.user) result = result.filter(o => o.user === filters.user || o.userName?.toLowerCase().includes(filters.user.toLowerCase()))
    if (filters.location) result = result.filter(o => o.location === filters.location)
    if (filters.dateFrom) result = result.filter(o => o.timestamp >= filters.dateFrom)
    if (filters.dateTo) result = result.filter(o => o.timestamp <= filters.dateTo)
    if (filters.orderId) result = result.filter(o => o.orderId === filters.orderId)

    // sort newest first
    result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    return {
      data: result,
      meta: {
        total: result.length,
        byType: {
          [OVERRIDE_TYPE.CUTOFF_VIOLATION]: result.filter(o => o.type === OVERRIDE_TYPE.CUTOFF_VIOLATION).length,
          [OVERRIDE_TYPE.CAPACITY_WARNING]: result.filter(o => o.type === OVERRIDE_TYPE.CAPACITY_WARNING).length,
          [OVERRIDE_TYPE.PRICING_OVERRIDE]: result.filter(o => o.type === OVERRIDE_TYPE.PRICING_OVERRIDE).length,
        },
        byStatus: {
          [OVERRIDE_STATUS.ACTIVE]: result.filter(o => o.status === OVERRIDE_STATUS.ACTIVE).length,
          [OVERRIDE_STATUS.REVOKED]: result.filter(o => o.status === OVERRIDE_STATUS.REVOKED).length,
          [OVERRIDE_STATUS.EXPIRED]: result.filter(o => o.status === OVERRIDE_STATUS.EXPIRED).length,
        },
      },
    }
  }
  const qs = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => { if (v) qs.set(k, v) })
  const res = await fetch(`${API_BASE}/overrides/audit?${qs}`)
  if (!res.ok) throw new Error('Failed to fetch audit log')
  return res.json()
}

/**
 * Revoke an override (manager action).
 */
export async function revokeOverride(overrideId, reason) {
  if (USE_MOCK) {
    await delay(300)
    const idx = _overrides.findIndex(o => o.id === overrideId)
    if (idx === -1) throw new Error('Override not found')
    _overrides[idx] = {
      ..._overrides[idx],
      status: OVERRIDE_STATUS.REVOKED,
      revokedBy: 'current-manager',
      revokedAt: new Date().toISOString(),
      revokeReason: reason || 'Revoked by manager',
    }
    return { data: _overrides[idx] }
  }
  const res = await fetch(`${API_BASE}/overrides/${overrideId}/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  })
  if (!res.ok) throw new Error('Failed to revoke override')
  return res.json()
}

/**
 * Count active overrides for an order (for indicator badges).
 */
export async function getActiveOverrideCount(orderId) {
  if (USE_MOCK) {
    const count = _overrides.filter(o => o.orderId === orderId && o.status === OVERRIDE_STATUS.ACTIVE).length
    return { count }
  }
  const res = await fetch(`${API_BASE}/overrides/count?orderId=${encodeURIComponent(orderId)}&status=ACTIVE`)
  if (!res.ok) throw new Error('Failed to fetch override count')
  return res.json()
}

/**
 * Get override statistics for dashboard / analytics.
 */
export async function getOverrideStats() {
  if (USE_MOCK) {
    await delay()
    const active = _overrides.filter(o => o.status === OVERRIDE_STATUS.ACTIVE)
    const today = new Date().toISOString().split('T')[0]
    const todayOverrides = _overrides.filter(o => o.timestamp.startsWith(today))

    return {
      data: {
        totalActive: active.length,
        totalAllTime: _overrides.length,
        todayCount: todayOverrides.length,
        byType: {
          [OVERRIDE_TYPE.CUTOFF_VIOLATION]: _overrides.filter(o => o.type === OVERRIDE_TYPE.CUTOFF_VIOLATION).length,
          [OVERRIDE_TYPE.CAPACITY_WARNING]: _overrides.filter(o => o.type === OVERRIDE_TYPE.CAPACITY_WARNING).length,
          [OVERRIDE_TYPE.PRICING_OVERRIDE]: _overrides.filter(o => o.type === OVERRIDE_TYPE.PRICING_OVERRIDE).length,
        },
        topUsers: [
          { user: 'jdoe', userName: 'Jane Doe', count: 2 },
          { user: 'mwilliams', userName: 'Mike Williams', count: 1 },
          { user: 'sjohnson', userName: 'Sarah Johnson', count: 1 },
        ],
      },
    }
  }
  const res = await fetch(`${API_BASE}/overrides/stats`)
  if (!res.ok) throw new Error('Failed to fetch override stats')
  return res.json()
}
