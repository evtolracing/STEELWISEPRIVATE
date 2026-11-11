/**
 * Cart Validation API — server-side validation before checkout. Backed by /api/ecom/cart.
 */
const API_BASE = import.meta.env.VITE_API_URL || '/api'

/**
 * validateCart — checks each product still exists, is listed online and meets its minimum quantity.
 * @returns { valid, errors[], warnings[], itemCount, data }
 */
export async function validateCart(payload) {
  const res = await fetch(`${API_BASE}/ecom/cart/validate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Cart validation failed')
  return res.json()
}
