/**
 * E-Commerce Pricing API
 * Price configuration for customer portal: contract, retail, remnant, review-required.
 */
const API_BASE = import.meta.env.VITE_API_URL || '/api'
const USE_MOCK = true

const CONTRACTS = {
  CONTRACT_A: { multiplier: 0.92, label: 'Contract A – 8% off' },
  CONTRACT_B: { multiplier: 0.85, label: 'Contract B – 15% off' },
  VOLUME: { multiplier: 0.88, label: 'Volume – 12% off' },
  RETAIL: { multiplier: 1.0, label: 'Retail / List' },
}

const BASE_PRICES = {
  'prod-001': 0.42, 'prod-002': 0.68, 'prod-003': 1.85, 'prod-004': 2.45,
  'prod-005': 3.20, 'prod-006': 5.10, 'prod-007': 24.99, 'prod-008': 6.49,
  'prod-009': 0.28, 'prod-010': 0.48, 'prod-011': 2.95, 'prod-012': 3.80,
}

/**
 * priceConfig – main pricing endpoint for a configured cart item.
 * @param {Object} payload { productId, priceLevel, config: { dimensions, qty, tolerance, processingSteps }, isRemnant, remnantDiscount }
 * @returns { unitPrice, extended, priceSource, materialCost, processingCost, warnings[] }
 */
export async function priceConfig(payload) {
  if (USE_MOCK) {
    const { productId, priceLevel = 'RETAIL', config = {}, isRemnant, remnantDiscount } = payload
    const base = BASE_PRICES[productId] || 1.00
    const contract = CONTRACTS[priceLevel] || CONTRACTS.RETAIL
    let unitPrice = +(base * contract.multiplier).toFixed(4)
    let priceSource = priceLevel === 'RETAIL' ? 'RETAIL' : 'CONTRACT'

    if (isRemnant) {
      unitPrice = +(base * (1 - (remnantDiscount || 0.25))).toFixed(4)
      priceSource = 'REMNANT'
    }

    const qty = config.qty || 1
    const dims = config.dimensions || {}
    // rough weight estimate for plate/sheet: thickness * width * length * density / 144
    let estimatedWeight = 0
    if (dims.thickness && dims.width && dims.length) {
      const t = parseFloat(dims.thickness) || 0
      const w = parseFloat(dims.width) || 0
      const l = parseFloat(dims.length) || 0
      estimatedWeight = +((t * w * l * 0.2836) * qty).toFixed(1) // steel density approx
    }

    const materialCost = estimatedWeight > 0 ? +(estimatedWeight * unitPrice).toFixed(2) : +(qty * unitPrice).toFixed(2)

    // processing cost
    const processingSteps = config.processingSteps || []
    const processingCost = processingSteps.reduce((s, step) => s + (step.estimatedCost || step.pricePerOp || 0), 0)

    const extended = +(materialCost + processingCost).toFixed(2)

    // warnings
    const warnings = []
    if (estimatedWeight > 10000) warnings.push('Large order – may require freight quote')
    if (!BASE_PRICES[productId]) { priceSource = 'REVIEW_REQUIRED'; warnings.push('Price not on file – will require review') }

    return { unitPrice, extended, priceSource, materialCost, processingCost, estimatedWeight, warnings }
  }
  const res = await fetch(`${API_BASE}/ecom/pricing/config`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Pricing failed')
  return res.json()
}

export async function estimateTax({ subtotal, shipToState = 'MI' }) {
  if (USE_MOCK) {
    const rates = { MI: 0.06, OH: 0.0575, IN: 0.07, IL: 0.0625 }
    const rate = rates[shipToState] || 0.06
    return { taxRate: rate, taxAmount: +(subtotal * rate).toFixed(2) }
  }
  const res = await fetch(`${API_BASE}/ecom/pricing/tax`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subtotal, shipToState }),
  })
  if (!res.ok) throw new Error('Tax estimate failed')
  return res.json()
}
