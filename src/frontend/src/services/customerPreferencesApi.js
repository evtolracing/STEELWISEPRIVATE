/**
 * customerPreferencesApi.js — Customer Preference service (real API).
 *
 * Stores & retrieves per-customer defaults: branch, shipping, tolerances,
 * pricing, certifications, packaging, order rules, and more.
 */
import client from '../api/client'

// ─── ENUMS / CONSTANTS ──────────────────────────────────────────────────────

export const SHIP_METHODS = [
  { value: 'DELIVERY',     label: 'Delivery (Our Truck)' },
  { value: 'WILL_CALL',    label: 'Will Call / Pickup' },
  { value: 'SHIP_CARRIER', label: 'Ship via Carrier' },
  { value: 'LTL',          label: 'LTL Freight' },
  { value: 'FLATBED',      label: 'Flatbed' },
]

export const CERT_OPTIONS = [
  { value: 'MTR',           label: 'Mill Test Report (MTR)' },
  { value: 'COC',           label: 'Certificate of Conformance' },
  { value: 'FIRST_ARTICLE', label: 'First Article Inspection' },
  { value: 'NADCAP',        label: 'NADCAP / Spec Compliance' },
  { value: 'PPAP',          label: 'PPAP Documentation' },
  { value: 'NONE',          label: 'None Required' },
]

// Per-preset values:  thk = thickness (in), len = length (in), wid = width (in)
export const TOLERANCE_PRESETS = [
  { value: 'STANDARD',  label: 'Standard',
    thkPlus: 0.010, thkMinus: 0.010,
    lenPlus: 0.125, lenMinus: 0.000,
    widPlus: 0.063, widMinus: 0.031 },
  { value: 'TIGHT',     label: 'Tight',
    thkPlus: 0.005, thkMinus: 0.005,
    lenPlus: 0.063, lenMinus: 0.000,
    widPlus: 0.031, widMinus: 0.016 },
  { value: 'PRECISION', label: 'Precision',
    thkPlus: 0.002, thkMinus: 0.002,
    lenPlus: 0.032, lenMinus: 0.000,
    widPlus: 0.016, widMinus: 0.008 },
  { value: 'LOOSE',     label: 'Loose',
    thkPlus: 0.030, thkMinus: 0.030,
    lenPlus: 0.250, lenMinus: 0.000,
    widPlus: 0.125, widMinus: 0.063 },
  { value: 'CUSTOM',    label: 'Custom' },
]

export const PRIORITIES = ['STANDARD', 'RUSH', 'HOT', 'EMERGENCY']
export const DIVISIONS  = ['METALS', 'PLASTICS', 'SUPPLIES']

export const FREIGHT_TERMS = [
  { value: 'FOB_ORIGIN',  label: 'FOB Origin' },
  { value: 'FOB_DEST',    label: 'FOB Destination' },
  { value: 'PREPAID',     label: 'Prepaid' },
  { value: 'COLLECT',     label: 'Collect' },
  { value: 'THIRD_PARTY', label: 'Third Party' },
]

export const PAYMENT_TERMS = [
  { value: 'COD',    label: 'COD' },
  { value: 'NET_15', label: 'Net 15' },
  { value: 'NET_30', label: 'Net 30' },
  { value: 'NET_45', label: 'Net 45' },
  { value: 'NET_60', label: 'Net 60' },
  { value: 'NET_90', label: 'Net 90' },
  { value: 'CIA',    label: 'Cash in Advance' },
]

export const PRICING_TIERS = [
  { value: 'A', label: 'Tier A \u2014 Premium' },
  { value: 'B', label: 'Tier B \u2014 Standard' },
  { value: 'C', label: 'Tier C \u2014 Economy' },
  { value: 'D', label: 'Tier D \u2014 Spot' },
]

export const PACKAGING_TYPES = [
  { value: 'BANDED',    label: 'Banded' },
  { value: 'CRATED',    label: 'Crated' },
  { value: 'PALLETIZED', label: 'Palletized' },
  { value: 'LOOSE',     label: 'Loose' },
  { value: 'WRAPPED',   label: 'Shrink Wrapped' },
]

export const SURFACE_FINISHES = [
  { value: 'MILL',     label: 'Mill Finish' },
  { value: 'PICKLED',  label: 'Pickled & Oiled' },
  { value: 'OILED',    label: 'Oiled' },
  { value: 'BLASTED',  label: 'Shot Blasted' },
  { value: 'PRIMED',   label: 'Primed' },
  { value: 'GALV',     label: 'Galvanized' },
]

export const STEEL_GRADES = [
  'A36', 'A572-50', 'A514', 'A588', 'A992', 'A500',
  'A516-70', 'A709-50', 'AR400', 'AR500',
  '304 SS', '316 SS', '410 SS',
  '6061-T6 AL', '5052 AL', '3003 AL',
]

// ─── DEFAULT PREFERENCE SHAPE ────────────────────────────────────────────────

export const DEFAULT_PREFS = {
  // Location & Shipping
  preferredBranch: '',
  preferredShipMethod: '',
  defaultDivision: '',
  preferredCarrier: '',
  freightTerms: '',
  deliveryWindow: '',
  shipToAddress: null,
  // Priority & Order Rules
  defaultPriority: 'STANDARD',
  rushDefault: false,
  defaultOwnership: 'HOUSE',
  requirePONumber: false,
  autoApplyContract: true,
  autoApproveOrders: false,
  minOrderQty: '',
  minOrderValue: '',
  // Pricing
  pricingTier: '',
  discountPct: '',
  fuelSurchargeExempt: false,
  paymentTerms: '',
  creditLimit: '',
  contractNotes: '',
  // Material Specs
  tolerancePreset: 'STANDARD',
  // Thickness
  thkTolerancePlus: 0.010,
  thkToleranceMinus: 0.010,
  // Length
  lenTolerancePlus: 0.125,
  lenToleranceMinus: 0.000,
  // Width
  widTolerancePlus: 0.063,
  widToleranceMinus: 0.031,
  approvedGrades: [],
  surfaceFinish: '',
  specialSpecs: '',
  // Certifications
  certRequirements: [],
  autoSendMTR: false,
  autoSendInvoice: false,
  mtrEmail: '',
  invoiceEmail: '',
  // Packaging
  bundleMaxWeight: '',
  bundleMaxPieces: '',
  packagingType: '',
  labelTemplate: '',
  packagingNotes: '',
  // Notes
  specialInstructions: '',
  internalNotes: '',
  // Audit
  updatedBy: null,
  lastUpdated: null,
}

// ─── API FUNCTIONS ───────────────────────────────────────────────────────────

export async function listCustomersWithPreferences() {
  const res = await client.get('/customers/preferences/list')
  return res.data
}

export async function getCustomerPreferences(customerId) {
  const res = await client.get(`/customers/${customerId}/preferences`)
  return res.data
}

export async function saveCustomerPreferences(customerId, prefs) {
  const res = await client.put(`/customers/${customerId}/preferences`, prefs)
  return res.data
}

export async function resetCustomerPreferences(customerId) {
  const res = await client.delete(`/customers/${customerId}/preferences`)
  return res.data
}

// ─── UTILITY FUNCTIONS ──────────────────────────────────────────────────────

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

export function summarizePreferences(prefs) {
  if (!prefs) return []
  const items = []
  if (prefs.preferredBranch) {
    items.push({ key: 'branch', label: `Branch: ${prefs.preferredBranch}`, color: 'primary' })
  }
  if (prefs.preferredShipMethod) {
    const sm = SHIP_METHODS.find(s => s.value === prefs.preferredShipMethod)
    items.push({ key: 'ship', label: sm?.label || prefs.preferredShipMethod, color: 'info' })
  }
  if (prefs.rushDefault || (prefs.defaultPriority && prefs.defaultPriority !== 'STANDARD')) {
    items.push({ key: 'priority', label: `Priority: ${prefs.defaultPriority || 'RUSH'}`, color: prefs.rushDefault ? 'warning' : 'default' })
  }
  if (prefs.certRequirements?.length > 0) {
    items.push({ key: 'certs', label: `${prefs.certRequirements.length} cert(s)`, color: 'secondary' })
  }
  if (prefs.pricingTier) {
    items.push({ key: 'tier', label: `Tier ${prefs.pricingTier}`, color: 'success' })
  }
  if (prefs.tolerancePreset && prefs.tolerancePreset !== 'STANDARD') {
    items.push({ key: 'tol', label: `Tol: ${prefs.tolerancePreset}`, color: 'default' })
  }
  if (prefs.specialInstructions) {
    items.push({ key: 'notes', label: 'Special instructions', color: 'default' })
  }
  return items
}
