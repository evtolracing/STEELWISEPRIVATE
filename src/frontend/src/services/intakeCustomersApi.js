/**
 * Customers API Service — Order Intake Module
 * Search, lookup, and create walk-in customers for order entry.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api'

// ── Mock customer data for local dev ──
const MOCK_CUSTOMERS = [
  { id: 'cust-001', code: 'ACME-001', name: 'Acme Manufacturing', type: 'OEM', accountType: 'ACCOUNT', status: 'ACTIVE', phone: '(555) 100-2000', email: 'orders@acmemfg.com', city: 'Jackson', state: 'MI', paymentTerms: 'NET30', creditLimit: 50000, creditUsed: 12500, taxExempt: false, shipTos: [{ id: 'st-1', label: 'Main Dock', address: '100 Industrial Blvd', city: 'Jackson', state: 'MI', zip: '49201' }], priceLevel: 'CONTRACT_A' },
  { id: 'cust-002', code: 'METRO-01', name: 'Metro Fabricators', type: 'FABRICATOR', accountType: 'ACCOUNT', status: 'ACTIVE', phone: '(555) 200-3000', email: 'purchasing@metrofab.com', city: 'Detroit', state: 'MI', paymentTerms: 'NET30', creditLimit: 75000, creditUsed: 31000, taxExempt: true, shipTos: [{ id: 'st-2', label: 'Plant A', address: '500 Mfg Drive', city: 'Detroit', state: 'MI', zip: '48201' }, { id: 'st-3', label: 'Plant B', address: '600 Commerce St', city: 'Dearborn', state: 'MI', zip: '48124' }], priceLevel: 'CONTRACT_B' },
  { id: 'cust-003', code: 'STEEL-S', name: 'Steel Solutions Inc', type: 'DISTRIBUTOR', accountType: 'ACCOUNT', status: 'ACTIVE', phone: '(555) 300-4000', email: 'orders@steelsol.com', city: 'Toledo', state: 'OH', paymentTerms: 'NET45', creditLimit: 120000, creditUsed: 45000, taxExempt: false, shipTos: [{ id: 'st-4', label: 'Warehouse', address: '900 Logistics Pkwy', city: 'Toledo', state: 'OH', zip: '43604' }], priceLevel: 'VOLUME' },
  { id: 'cust-004', code: 'PREC-01', name: 'Precision Parts Co', type: 'OEM', accountType: 'ACCOUNT', status: 'CREDIT_HOLD', phone: '(555) 400-5000', email: 'ap@precisionparts.com', city: 'Ann Arbor', state: 'MI', paymentTerms: 'COD', creditLimit: 10000, creditUsed: 10000, taxExempt: false, shipTos: [{ id: 'st-5', label: 'Shop', address: '200 Tech Ct', city: 'Ann Arbor', state: 'MI', zip: '48103' }], priceLevel: 'RETAIL' },
  { id: 'cust-005', code: 'IND-CO', name: 'Industrial Corp', type: 'OEM', accountType: 'ACCOUNT', status: 'ACTIVE', phone: '(555) 500-6000', email: 'buy@indcorp.com', city: 'Lansing', state: 'MI', paymentTerms: 'NET30', creditLimit: 60000, creditUsed: 8000, taxExempt: false, shipTos: [{ id: 'st-6', label: 'Loading Dock', address: '750 State Ave', city: 'Lansing', state: 'MI', zip: '48933' }], priceLevel: 'CONTRACT_A' },
]

const USE_MOCK = false

export async function searchCustomers(query, { limit = 20, type } = {}) {
  if (USE_MOCK) {
    const q = (query || '').toLowerCase()
    const filtered = MOCK_CUSTOMERS.filter(c =>
      c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || (c.phone && c.phone.includes(q))
    )
    return { data: type ? filtered.filter(c => c.type === type) : filtered, meta: { total: filtered.length } }
  }
  const params = new URLSearchParams({ search: query, limit: String(limit) })
  if (type) params.set('type', type)
  const res = await fetch(`${API_BASE}/customers?${params}`)
  if (!res.ok) throw new Error('Customer search failed')
  const json = await res.json()
  // Map Organization records to the shape the CustomerLookupDialog expects
  const orgs = json.data || json.customers || (Array.isArray(json) ? json : [])
  const mapped = orgs.map(o => ({
    ...o,
    status: o.isActive ? 'ACTIVE' : 'INACTIVE',
    accountType: o.type === 'WALK_IN' ? 'WALKIN' : 'ACCOUNT',
    paymentTerms: o.paymentTerms || 'NET30',
    creditLimit: o.creditLimit || 0,
    creditUsed: o.creditUsed || 0,
    taxExempt: o.taxExempt || false,
    shipTos: o.shipTos || [],
    priceLevel: o.priceLevel || 'RETAIL',
  }))
  return { data: mapped, meta: json.meta || { total: mapped.length } }
}

export async function getCustomerById(id) {
  if (USE_MOCK) {
    const c = MOCK_CUSTOMERS.find(c => c.id === id)
    if (!c) throw new Error('Customer not found')
    return c
  }
  const res = await fetch(`${API_BASE}/customers/${id}`)
  if (!res.ok) throw new Error('Failed to fetch customer')
  return res.json()
}

export async function createWalkInCustomer({ name, phone, email, company }) {
  if (USE_MOCK) {
    return {
      id: 'walkin-' + Date.now(),
      code: 'WALK-' + Date.now().toString(36).toUpperCase(),
      name: name || company || 'Walk-in',
      type: 'WALK_IN',
      accountType: 'WALKIN',
      status: 'ACTIVE',
      phone: phone || '',
      email: email || '',
      paymentTerms: 'COD',
      taxExempt: false,
      shipTos: [],
      priceLevel: 'RETAIL',
    }
  }
  const res = await fetch(`${API_BASE}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: name || company || 'Walk-in Customer',
      code: 'WALK-' + Date.now().toString(36).toUpperCase(),
      phone: phone || null,
      email: email || null,
      city: null,
      state: null,
      type: 'OEM',
    }),
  })
  if (!res.ok) throw new Error('Failed to create walk-in customer')
  const created = await res.json()
  return {
    ...created,
    status: 'ACTIVE',
    accountType: 'WALKIN',
    paymentTerms: 'COD',
    taxExempt: false,
    shipTos: [],
    priceLevel: 'RETAIL',
  }
}
