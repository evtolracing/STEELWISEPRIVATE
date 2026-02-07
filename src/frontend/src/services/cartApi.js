/**
 * Cart Validation API (optional server-side validation before checkout)
 */
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const USE_MOCK = true

/**
 * validateCart — server-side validation of the entire cart before checkout.
 * Checks inventory, pricing, and configuration rules.
 */
export async function validateCart(payload) {
  if (USE_MOCK) {
    const { items = [] } = payload
    const errors = []
    const warnings = []

    items.forEach((item, idx) => {
      if (!item.productId) errors.push({ line: idx, msg: 'Missing product' })
      if ((item.config?.qty || 0) < 1) errors.push({ line: idx, msg: 'Quantity must be at least 1' })
      if (item.pricingPreview?.priceSource === 'REVIEW_REQUIRED') {
        warnings.push({ line: idx, msg: `${item.sku || 'Item'}: price requires review` })
      }
    })

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      itemCount: items.length,
    }
  }
  const res = await fetch(`${API_BASE}/ecom/cart/validate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Cart validation failed')
  return res.json()
}
