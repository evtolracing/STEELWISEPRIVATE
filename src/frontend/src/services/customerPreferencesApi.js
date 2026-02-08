/**
 * customerPreferencesApi.js — Customer Preference Memory service.
 *
 * Stores & retrieves per-customer defaults:
 *   - Preferred branch / location
 *   - Default ship method
 *   - Typical tolerances (plus / minus)
 *   - Rush vs standard priority
 *   - Cert requirements (MTR, CoC, etc.)
 *   - Default division
 *   - Preferred ownership (house vs customer material)
 *   - Notes / special instructions
 *
 * Mock-first pattern. Persists to localStorage for demo continuity.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const USE_MOCK = true
const STORAGE_KEY = 'steelwise_customer_preferences'

// ─── ENUMS ───────────────────────────────────────────────────────────────────

export const SHIP_METHODS = [
  { value: 'DELIVERY',     label: 'Delivery (Our Truck)' },
  { value: 'WILL_CALL',    label: 'Will Call / Pickup' },
  { value: 'SHIP_CARRIER', label: 'Ship via Carrier' },
  { value: 'LTL',          label: 'LTL Freight' },
  { value: 'FLATBED',      label: 'Flatbed' },
]

export const CERT_OPTIONS = [
  { value: 'MTR',     label: 'Mill Test Report (MTR)' },
  { value: 'COC',     label: 'Certificate of Conformance' },
  { value: 'FIRST_ARTICLE', label: 'First Article Inspection' },
  { value: 'NADCAP',  label: 'NADCAP / Spec Compliance' },
  { value: 'PPAP',    label: 'PPAP Documentation' },
  { value: 'NONE',    label: 'None Required' },
]

export const TOLERANCE_PRESETS = [
  { value: 'STANDARD',   label: 'Standard (±0.010")',  plus: 0.010, minus: 0.010 },
  { value: 'TIGHT',      label: 'Tight (±0.005")',     plus: 0.005, minus: 0.005 },
  { value: 'PRECISION',  label: 'Precision (±0.002")', plus: 0.002, minus: 0.002 },
  { value: 'LOOSE',      label: 'Loose (±0.030")',     plus: 0.030, minus: 0.030 },
  { value: 'CUSTOM',     label: 'Custom' },
]

export const BRANCHES = [
  { id: 'JACKSON',       label: 'Jackson',       locationId: 'loc-1' },
  { id: 'DETROIT',       label: 'Detroit',        locationId: 'loc-2' },
  { id: 'KALAMAZOO',     label: 'Kalamazoo',      locationId: 'loc-3' },
  { id: 'GRAND_RAPIDS',  label: 'Grand Rapids',   locationId: 'loc-4' },
]

export const PRIORITIES = ['STANDARD', 'RUSH', 'HOT', 'EMERGENCY']
export const DIVISIONS  = ['METALS', 'PLASTICS', 'SUPPLIES', 'OUTLET']

// ─── DEFAULT PREFERENCE SHAPE ────────────────────────────────────────────────

export const DEFAULT_PREFS = {
  preferredBranch: '',        // e.g. 'JACKSON'
  preferredShipMethod: '',    // e.g. 'DELIVERY'
  defaultDivision: '',        // e.g. 'METALS'
  defaultPriority: 'STANDARD',
  defaultOwnership: 'HOUSE',  // HOUSE | CUSTOMER_MATERIAL
  tolerancePreset: 'STANDARD',
  tolerancePlus: 0.010,
  toleranceMinus: 0.010,
  certRequirements: [],       // e.g. ['MTR', 'COC']
  preferredShipTo: null,      // { label, address, city, state, zip }
  specialInstructions: '',
  rushDefault: false,
  packagingNotes: '',
  requirePONumber: false,
  autoApplyContract: true,
  lastUpdated: null,
  updatedBy: null,
}

// ─── MOCK PREFERENCE STORE ───────────────────────────────────────────────────

function _loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function _saveStore(store) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)) } catch { /* ignore */ }
}

/** Seed a few customers with realistic preferences */
function _ensureSeeded() {
  const store = _loadStore()
  if (store.__seeded) return store

  const seeds = {
    'cust-001': {
      ...DEFAULT_PREFS,
      preferredBranch: 'JACKSON',
      preferredShipMethod: 'DELIVERY',
      defaultDivision: 'METALS',
      defaultPriority: 'STANDARD',
      tolerancePreset: 'TIGHT',
      tolerancePlus: 0.005,
      toleranceMinus: 0.005,
      certRequirements: ['MTR', 'COC'],
      preferredShipTo: { label: 'Main Plant', address: '4500 Industrial Pkwy', city: 'Jackson', state: 'MI', zip: '49201' },
      specialInstructions: 'Strap bundles on 4" dunnage. Deliver to Dock B.',
      rushDefault: false,
      requirePONumber: true,
      autoApplyContract: true,
      lastUpdated: '2026-01-15T10:30:00Z',
      updatedBy: 'Sarah Wilson',
    },
    'cust-002': {
      ...DEFAULT_PREFS,
      preferredBranch: 'DETROIT',
      preferredShipMethod: 'WILL_CALL',
      defaultDivision: 'METALS',
      defaultPriority: 'RUSH',
      tolerancePreset: 'PRECISION',
      tolerancePlus: 0.002,
      toleranceMinus: 0.002,
      certRequirements: ['MTR', 'FIRST_ARTICLE', 'PPAP'],
      specialInstructions: 'All material must be individually tagged. Call 30 min before delivery.',
      rushDefault: true,
      requirePONumber: true,
      autoApplyContract: true,
      lastUpdated: '2026-01-20T14:00:00Z',
      updatedBy: 'Mike Thompson',
    },
    'cust-003': {
      ...DEFAULT_PREFS,
      preferredBranch: 'KALAMAZOO',
      preferredShipMethod: 'SHIP_CARRIER',
      defaultDivision: 'PLASTICS',
      defaultPriority: 'STANDARD',
      tolerancePreset: 'STANDARD',
      certRequirements: ['COC'],
      rushDefault: false,
      requirePONumber: false,
      autoApplyContract: true,
      lastUpdated: '2026-02-01T09:15:00Z',
      updatedBy: 'Lisa Chen',
    },
    'cust-004': {
      ...DEFAULT_PREFS,
      preferredBranch: 'GRAND_RAPIDS',
      preferredShipMethod: 'FLATBED',
      defaultDivision: 'METALS',
      defaultPriority: 'HOT',
      tolerancePreset: 'LOOSE',
      tolerancePlus: 0.030,
      toleranceMinus: 0.030,
      certRequirements: ['MTR'],
      specialInstructions: 'Must deliver before 7 AM. Contact foreman on site.',
      rushDefault: true,
      packagingNotes: 'Bundle max 5,000 lbs per lift',
      requirePONumber: true,
      autoApplyContract: false,
      lastUpdated: '2026-02-03T16:45:00Z',
      updatedBy: 'Tom Bradley',
    },
  }

  const seeded = { ...store, ...seeds, __seeded: true }
  _saveStore(seeded)
  return seeded
}

// ─── MOCK CUSTOMER DIRECTORY (matches intakeCustomersApi) ────────────────────

const MOCK_CUSTOMERS = [
  { id: 'cust-001', code: 'ACME-001', name: 'Acme Fabrication',    type: 'MANUFACTURER', city: 'Jackson',       state: 'MI' },
  { id: 'cust-002', code: 'PRE-002',  name: 'Precision Parts Inc', type: 'MANUFACTURER', city: 'Detroit',       state: 'MI' },
  { id: 'cust-003', code: 'GLK-003',  name: 'Great Lakes Plastics',type: 'DISTRIBUTOR',  city: 'Kalamazoo',     state: 'MI' },
  { id: 'cust-004', code: 'MWS-004',  name: 'Midwest Structures', type: 'CONTRACTOR',   city: 'Grand Rapids',  state: 'MI' },
  { id: 'cust-005', code: 'TEC-005',  name: 'TechForm Solutions', type: 'MANUFACTURER', city: 'Ann Arbor',     state: 'MI' },
  { id: 'cust-006', code: 'BLD-006',  name: 'BuildRight Steel',   type: 'CONTRACTOR',   city: 'Lansing',       state: 'MI' },
]

function _delay(ms) { return new Promise(r => setTimeout(r, ms)) }

// ─── API FUNCTIONS ───────────────────────────────────────────────────────────

/**
 * Get preferences for a specific customer. Returns DEFAULT_PREFS if none saved.
 */
export async function getCustomerPreferences(customerId) {
  if (USE_MOCK) {
    await _delay(150)
    const store = _ensureSeeded()
    const prefs = store[customerId] || { ...DEFAULT_PREFS }
    return { data: prefs, hasPreferences: !!store[customerId] }
  }
  const res = await fetch(`${API_BASE}/customers/${customerId}/preferences`)
  if (!res.ok) throw new Error('Failed to get customer preferences')
  return res.json()
}

/**
 * Save / update preferences for a customer.
 */
export async function saveCustomerPreferences(customerId, prefs) {
  if (USE_MOCK) {
    await _delay(200)
    const store = _ensureSeeded()
    const updated = {
      ...DEFAULT_PREFS,
      ...store[customerId],
      ...prefs,
      lastUpdated: new Date().toISOString(),
      updatedBy: prefs.updatedBy || 'Current User',
    }
    store[customerId] = updated
    _saveStore(store)
    return { data: updated, success: true }
  }
  const res = await fetch(`${API_BASE}/customers/${customerId}/preferences`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs),
  })
  if (!res.ok) throw new Error('Failed to save customer preferences')
  return res.json()
}

/**
 * List all customers that have saved preferences.
 */
export async function listCustomersWithPreferences() {
  if (USE_MOCK) {
    await _delay(200)
    const store = _ensureSeeded()
    const results = MOCK_CUSTOMERS.map(c => {
      const prefs = store[c.id]
      return {
        ...c,
        hasPreferences: !!prefs,
        preferredBranch: prefs?.preferredBranch || null,
        defaultPriority: prefs?.defaultPriority || null,
        certCount: prefs?.certRequirements?.length || 0,
        rushDefault: prefs?.rushDefault || false,
        lastUpdated: prefs?.lastUpdated || null,
      }
    })
    return { data: results }
  }
  const res = await fetch(`${API_BASE}/customers/preferences`)
  if (!res.ok) throw new Error('Failed to list preferences')
  return res.json()
}

/**
 * Delete preferences for a customer (reset to defaults).
 */
export async function resetCustomerPreferences(customerId) {
  if (USE_MOCK) {
    await _delay(150)
    const store = _ensureSeeded()
    delete store[customerId]
    _saveStore(store)
    return { success: true }
  }
  const res = await fetch(`${API_BASE}/customers/${customerId}/preferences`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to reset preferences')
  return res.json()
}

/**
 * Build smart defaults object to apply to an intake form.
 * Returns only non-empty fields that should override form defaults.
 */
export function buildSmartDefaults(prefs) {
  if (!prefs) return {}
  const defaults = {}

  if (prefs.preferredBranch)      defaults.location = prefs.preferredBranch
  if (prefs.defaultDivision)      defaults.division = prefs.defaultDivision
  if (prefs.defaultPriority && prefs.defaultPriority !== 'STANDARD')
    defaults.priority = prefs.defaultPriority
  if (prefs.rushDefault)          defaults.priority = prefs.defaultPriority || 'RUSH'
  if (prefs.defaultOwnership)     defaults.ownership = prefs.defaultOwnership
  if (prefs.preferredShipMethod)  defaults.shipMethod = prefs.preferredShipMethod
  if (prefs.specialInstructions)  defaults.notes = prefs.specialInstructions

  return defaults
}

/**
 * Build a human-readable summary of active preferences for display badges.
 */
export function summarizePreferences(prefs) {
  if (!prefs) return []
  const items = []
  if (prefs.preferredBranch) {
    const b = BRANCHES.find(br => br.id === prefs.preferredBranch)
    items.push({ key: 'branch', label: `Branch: ${b?.label || prefs.preferredBranch}`, color: 'primary' })
  }
  if (prefs.preferredShipMethod) {
    const sm = SHIP_METHODS.find(s => s.value === prefs.preferredShipMethod)
    items.push({ key: 'ship', label: sm?.label || prefs.preferredShipMethod, color: 'info' })
  }
  if (prefs.rushDefault || (prefs.defaultPriority && prefs.defaultPriority !== 'STANDARD')) {
    items.push({ key: 'priority', label: `Priority: ${prefs.defaultPriority || 'RUSH'}`, color: prefs.rushDefault ? 'warning' : 'default' })
  }
  if (prefs.certRequirements?.length > 0) {
    items.push({ key: 'certs', label: `${prefs.certRequirements.length} cert(s) required`, color: 'secondary' })
  }
  if (prefs.tolerancePreset && prefs.tolerancePreset !== 'STANDARD') {
    const tp = TOLERANCE_PRESETS.find(t => t.value === prefs.tolerancePreset)
    items.push({ key: 'tol', label: `Tol: ${tp?.label || prefs.tolerancePreset}`, color: 'default' })
  }
  if (prefs.specialInstructions) {
    items.push({ key: 'notes', label: 'Has special instructions', color: 'default' })
  }
  return items
}
