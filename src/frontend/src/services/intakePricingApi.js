/**
 * Pricing API — Order Intake Module
 * Contract pricing, remnant pricing, tax estimate, price calculations.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api'
const USE_MOCK = true

const MOCK_CONTRACTS = {
  CONTRACT_A: { multiplier: 0.92, label: 'Contract A – 8% off list' },
  CONTRACT_B: { multiplier: 0.85, label: 'Contract B – 15% off list' },
  VOLUME: { multiplier: 0.88, label: 'Volume Discount – 12% off' },
  RETAIL: { multiplier: 1.0, label: 'Retail / List Price' },
}

export async function calculateLinePrice({ productId, priceLevel = 'RETAIL', weight, qty, isRemnant, remnantDiscount, processes = [] }) {
  if (USE_MOCK) {
    // Simulate dynamic pricing
    const MOCK_BASE = { 'prod-001': 0.42, 'prod-002': 0.68, 'prod-003': 1.85, 'prod-004': 2.45, 'prod-005': 3.20, 'prod-006': 5.10, 'prod-007': 24.99, 'prod-008': 6.49, 'prod-009': 0.28, 'prod-010': 0.48 }
    const basePrice = MOCK_BASE[productId] || 1.00
    const contract = MOCK_CONTRACTS[priceLevel] || MOCK_CONTRACTS.RETAIL
    let unitPrice = basePrice * contract.multiplier
    if (isRemnant && remnantDiscount) unitPrice = basePrice * (1 - remnantDiscount)
    const materialTotal = (weight || 0) * unitPrice + (qty || 0) * unitPrice
    const processingTotal = processes.reduce((s, p) => s + (p.estimatedCost || 0), 0)
    return {
      unitPrice: +unitPrice.toFixed(4),
      priceSource: isRemnant ? 'REMNANT' : contract.label,
      materialTotal: +materialTotal.toFixed(2),
      processingTotal: +processingTotal.toFixed(2),
      lineTotal: +(materialTotal + processingTotal).toFixed(2),
    }
  }
  const res = await fetch(`${API_BASE}/pricing/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, priceLevel, weight, qty, isRemnant, remnantDiscount, processes }),
  })
  if (!res.ok) throw new Error('Pricing calculation failed')
  return res.json()
}

export async function estimateTax({ subtotal, customerId, shipToState = 'MI' }) {
  if (USE_MOCK) {
    const rates = { MI: 0.06, OH: 0.0575, IN: 0.07, IL: 0.0625 }
    const rate = rates[shipToState] || 0.06
    return { taxRate: rate, taxAmount: +(subtotal * rate).toFixed(2), exempt: false }
  }
  const res = await fetch(`${API_BASE}/pricing/tax-estimate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subtotal, customerId, shipToState }),
  })
  if (!res.ok) throw new Error('Tax estimate failed')
  return res.json()
}

export async function getContractPricing(customerId) {
  if (USE_MOCK) {
    // Lookup price level from customer mock
    return { priceLevel: 'CONTRACT_A', contracts: MOCK_CONTRACTS }
  }
  const res = await fetch(`${API_BASE}/pricing/contracts?customerId=${customerId}`)
  if (!res.ok) throw new Error('Failed to fetch contract pricing')
  return res.json()
}
