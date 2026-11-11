/**
 * customerAccountApi.js — Enterprise Customer Account API.
 *
 * Multi-branch visibility for large accounts:
 *   - All open orders across branches
 *   - ETA & partial shipment tracking
 *   - Document downloads at scale
 *   - Branch management
 *   - Export (CSV, PDF)
 *   - Permissions enforcement stubs
 *
 * Backed by /api/enterprise.
 */
const API_BASE = import.meta.env.VITE_API_URL || '/api'

// ── Permission levels ──────────────────────────────────────────────────────
export const ACCOUNT_ROLES = {
  OWNER:   'OWNER',    // Full access, user management
  ADMIN:   'ADMIN',    // All orders, all branches, exports
  BUYER:   'BUYER',    // Place orders, view own branch
  VIEWER:  'VIEWER',   // Read-only across branches
}

export const ACCOUNT_PERMISSIONS = {
  VIEW_ALL_ORDERS:    'VIEW_ALL_ORDERS',
  VIEW_ALL_BRANCHES:  'VIEW_ALL_BRANCHES',
  EXPORT_DATA:        'EXPORT_DATA',
  DOWNLOAD_DOCUMENTS: 'DOWNLOAD_DOCUMENTS',
  MANAGE_USERS:       'MANAGE_USERS',
  PLACE_ORDERS:       'PLACE_ORDERS',
}

const ROLE_PERMISSIONS = {
  OWNER: Object.values(ACCOUNT_PERMISSIONS),
  ADMIN: ['VIEW_ALL_ORDERS', 'VIEW_ALL_BRANCHES', 'EXPORT_DATA', 'DOWNLOAD_DOCUMENTS', 'PLACE_ORDERS'],
  BUYER: ['VIEW_ALL_ORDERS', 'DOWNLOAD_DOCUMENTS', 'PLACE_ORDERS'],
  VIEWER: ['VIEW_ALL_ORDERS', 'VIEW_ALL_BRANCHES', 'DOWNLOAD_DOCUMENTS'],
}

/**
 * Check if a role has a given permission.
 */
export function hasPermission(role, permission) {
  return (ROLE_PERMISSIONS[role] || []).includes(permission)
}

// ── Current account ────────────────────────────────────────────────────
// Until customer logins exist, the portal shows the account chosen in the
// store session (organization id or code).
const SESSION_KEY = 'steelwise_customer_session'
const DEFAULT_ACCOUNT = 'ACME'

export function currentAccountId() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    const id = raw ? JSON.parse(raw).customerId : null
    return id && id !== 'cust-001' ? id : DEFAULT_ACCOUNT
  } catch { return DEFAULT_ACCOUNT }
}

function query(params = {}) {
  const qs = new URLSearchParams()
  Object.entries({ accountId: currentAccountId(), ...params }).forEach(([k, v]) => { if (v != null && v !== '') qs.set(k, String(v)) })
  return qs
}

async function getJson(url, message) {
  const res = await fetch(url)
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || message)
  return res.json()
}

/**
 * Account profile: company, branches (divisions), price level, credit, stats.
 */
export async function getAccountProfile(accountId) {
  return getJson(`${API_BASE}/enterprise/accounts/${encodeURIComponent(accountId || currentAccountId())}`, 'Failed to load account')
}

/**
 * List all orders across branches. Supports filters.
 */
export async function listAccountOrders(params = {}) {
  return getJson(`${API_BASE}/enterprise/orders?${query(params)}`, 'Failed to list account orders')
}

/**
 * Get a single order with full detail + line-level ship status.
 */
export async function getAccountOrderDetail(orderId) {
  return getJson(`${API_BASE}/enterprise/orders/${encodeURIComponent(orderId)}?${query()}`, 'Failed to load order')
}

/**
 * List all shipments across branches.
 */
export async function listAccountShipments(params = {}) {
  return getJson(`${API_BASE}/enterprise/shipments?${query(params)}`, 'Failed to list shipments')
}

/**
 * List all documents across branches with filtering.
 */
export async function listAccountDocuments(params = {}) {
  return getJson(`${API_BASE}/enterprise/documents?${query(params)}`, 'Failed to list documents')
}

function fileNameFrom(res, fallback) {
  const m = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') || '')
  return m ? m[1] : fallback
}

/**
 * Download a single document by ID. Returns { data: Blob, filename }.
 */
export async function downloadDocument(docId) {
  const res = await fetch(`${API_BASE}/enterprise/documents/${encodeURIComponent(docId)}/download`)
  if (!res.ok) throw new Error('Download failed')
  return { data: await res.blob(), filename: fileNameFrom(res, `${docId}.txt`) }
}

/**
 * Bulk download documents as ZIP. Returns { data: Blob, filename }.
 */
export async function bulkDownloadDocuments(docIds) {
  const res = await fetch(`${API_BASE}/enterprise/documents/bulk-download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentIds: docIds }),
  })
  if (!res.ok) throw new Error('Bulk download failed')
  return { data: await res.blob(), filename: fileNameFrom(res, 'documents.zip') }
}

/**
 * Export orders to CSV.
 */
export async function exportOrdersCSV(params = {}) {
  const res = await fetch(`${API_BASE}/enterprise/orders/export?${query(params)}`)
  if (!res.ok) throw new Error('Export failed')
  return { data: await res.text(), filename: fileNameFrom(res, `orders-export-${new Date().toISOString().split('T')[0]}.csv`) }
}

/**
 * Get account-level KPIs.
 */
export async function getAccountKPIs(accountId) {
  return getJson(`${API_BASE}/enterprise/accounts/${encodeURIComponent(accountId || currentAccountId())}/kpis`, 'Failed to load KPIs')
}

// ── Document type labels ───────────────────────────────────────────────────
export const DOC_TYPE_LABELS = {
  MTR: 'Mill Test Report',
  PACKING_LIST: 'Packing List',
  BOL: 'Bill of Lading',
  INVOICE: 'Invoice',
  COC: 'Certificate of Conformance',
  PO: 'Purchase Order',
  QUOTE: 'Quote',
}

export const DOC_TYPE_COLORS = {
  MTR: 'info',
  PACKING_LIST: 'default',
  BOL: 'secondary',
  INVOICE: 'warning',
  COC: 'success',
  PO: 'primary',
  QUOTE: 'default',
}
