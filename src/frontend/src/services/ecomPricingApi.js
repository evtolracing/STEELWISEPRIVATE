/**
 * E-Commerce Pricing API
 * Price configuration for customer portal: contract, retail, remnant, review-required.
 * Backed by /api/ecom/pricing.
 */
const API_BASE = import.meta.env.VITE_API_URL || '/api'

async function postJson(url, body, message) {
  const res = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(message)
  return res.json()
}

/**
 * priceConfig – price a configured cart item.
 * @param {Object} payload { productId, priceLevel, quantity, dimensions, processing } (or { config: { qty, dimensions, processingSteps } })
 * @returns { unitPrice, extended, priceSource, materialCost, processingCost, estimatedWeight, warnings[], data }
 */
export async function priceConfig(payload) {
  return postJson(`${API_BASE}/ecom/pricing/config`, payload, 'Pricing failed')
}

export async function estimateTax({ subtotal, shipToState = 'MI', customerId }) {
  return postJson(`${API_BASE}/ecom/pricing/tax`, { subtotal, shipToState, customerId }, 'Tax estimate failed')
}
