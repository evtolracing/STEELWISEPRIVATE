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
 * Every override is saved on the server in the audit log (/api/overrides).
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api'

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
  // Notes are optional — no minimum length required
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

async function send(url, options, fallback) {
  const res = await fetch(`${API_BASE}${url}`, options)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || fallback)
  }
  return res.json()
}
const post = (body) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

/**
 * Create a new override.
 * @param {object} payload - { type, reasonCode, notes, orderId, orderNumber, originalValue, overrideValue, location, division, customerName }
 * @returns {{ data: Override }}
 */
export async function createOverride(payload) {
  const { valid, errors } = validateOverride(payload)
  if (!valid) throw new Error(errors.join(' | '))
  const reasonDef = (REASON_CODES[payload.type] || []).find(r => r.code === payload.reasonCode)
  return send('/overrides', post({ ...payload, reasonLabel: reasonDef?.label || payload.reasonCode }), 'Failed to record the override')
}

/** Get all overrides for a specific order. */
export async function getOverridesForOrder(orderId) {
  if (!orderId) return { data: [] }
  return send(`/overrides?orderId=${encodeURIComponent(orderId)}`, undefined, 'Failed to fetch overrides')
}

/** Get all overrides (audit log — filtered by type, status, date range, user). Managers only. */
export async function getOverrideAuditLog(filters = {}) {
  const qs = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => { if (v) qs.set(k, v) })
  return send(`/overrides/audit?${qs}`, undefined, 'Failed to fetch audit log')
}

/** Revoke an override. Managers only. The original entry stays in the log. */
export async function revokeOverride(overrideId, reason) {
  return send(`/overrides/${overrideId}/revoke`, post({ reason }), 'Failed to revoke override')
}

export async function getActiveOverrideCount(orderId) {
  if (!orderId) return { count: 0 }
  return send(`/overrides/count?orderId=${encodeURIComponent(orderId)}&status=ACTIVE`, undefined, 'Failed to fetch override count')
}

export async function getOverrideStats() {
  return send('/overrides/stats', undefined, 'Failed to fetch override stats')
}
