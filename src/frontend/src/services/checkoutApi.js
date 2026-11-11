/**
 * Checkout API — submit online orders or request quotes.
 * Creates ONLINE-sourced orders that appear in /orders/online-inbox for CSR triage.
 * Backed by /api/ecom/checkout.
 */
const API_BASE = import.meta.env.VITE_API_URL || '/api'

async function post(path, payload, message) {
  const res = await fetch(`${API_BASE}/ecom/checkout/${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, source: 'ONLINE' }),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || message) }
  return res.json()
}

/** submitOrder — places the order in the online inbox; status SUBMITTED, or NEEDS_REVIEW when a line needs a price review. */
export async function submitOrder(payload) {
  return post('submit', payload, 'Checkout failed')
}

/** requestQuote — places a quote request in the online inbox (status NEEDS_REVIEW). */
export async function requestQuote(payload) {
  return post('quote', payload, 'Quote request failed')
}
