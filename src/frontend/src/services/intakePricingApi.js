/**
 * Pricing API — Order Intake Module
 * Price levels, line price calculation, tax estimate. Backed by /api/pricing.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export async function calculateLinePrice({ productId, priceLevel = 'RETAIL', weight, qty, isRemnant, remnantDiscount, processes = [] }) {
  const res = await fetch(`${API_BASE}/pricing/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, priceLevel, weight, qty, isRemnant, remnantDiscount, processes }),
  })
  if (!res.ok) throw new Error('Pricing calculation failed')
  return res.json()
}

// The server decides which state's rate applies (customer, ship-to or branch), the same way the order is saved.
export async function estimateTax({ subtotal = 0, customerId, shipToState, location, source } = {}) {
  const res = await fetch(`${API_BASE}/pricing/tax-estimate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subtotal, customerId, shipToState, location, source }),
  })
  if (!res.ok) throw new Error('Tax estimate failed')
  return res.json()
}

export async function getContractPricing(customerId) {
  const res = await fetch(`${API_BASE}/pricing/contracts?customerId=${encodeURIComponent(customerId || '')}`)
  if (!res.ok) throw new Error('Failed to fetch contract pricing')
  return res.json()
}
