/**
 * Checkout API — submit online orders or request quotes.
 * Creates ONLINE-sourced orders that appear in /orders/online-inbox for CSR triage.
 */
const API_BASE = import.meta.env.VITE_API_URL || '/api'
const USE_MOCK = true

let _seq = 5000

function nextOrderNumber() {
  _seq += 1
  return `WEB-${new Date().getFullYear()}-${String(_seq).padStart(4, '0')}`
}

/**
 * submitOrder — fast checkout, creates ONLINE order with status NEEDS_REVIEW or SUBMITTED.
 */
export async function submitOrder(payload) {
  if (USE_MOCK) {
    const hasReviewRequired = (payload.lines || []).some(l => l.pricingPreview?.priceSource === 'REVIEW_REQUIRED')
    const order = {
      id: 'webord-' + Date.now(),
      orderNumber: nextOrderNumber(),
      source: 'ONLINE',
      status: hasReviewRequired ? 'NEEDS_REVIEW' : 'SUBMITTED',
      customerId: payload.customerId,
      customerName: payload.customerName || 'Online Customer',
      customerEmail: payload.customerEmail || '',
      locationId: payload.locationId,
      shipTo: payload.shipTo,
      priority: payload.priority || 'STANDARD',
      requestedShipDate: payload.requestedShipDate,
      notes: payload.notes,
      ownership: payload.ownership || 'HOUSE',
      lines: (payload.lines || []).map((l, i) => ({
        lineNumber: i + 1,
        productId: l.productId,
        sku: l.sku,
        description: l.description,
        division: l.division,
        config: l.config,
        qty: l.config?.qty || 1,
        unitPrice: l.pricingPreview?.unitPrice || 0,
        extPrice: l.pricingPreview?.extended || 0,
        priceSource: l.pricingPreview?.priceSource,
        processingSteps: l.config?.processingSteps || [],
      })),
      subtotal: (payload.lines || []).reduce((s, l) => s + (l.pricingPreview?.extended || 0), 0),
      tax: payload.tax || 0,
      total: payload.total || 0,
      paymentMethod: payload.paymentMethod || 'ACCOUNT_TERMS',
      createdAt: new Date().toISOString(),
    }
    // Simulates appearing in online-inbox
    return { data: order, success: true }
  }
  const res = await fetch(`${API_BASE}/ecom/checkout/submit`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, source: 'ONLINE' }),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Checkout failed') }
  return res.json()
}

/**
 * requestQuote — creates ONLINE order with status NEEDS_REVIEW and quoteRequested flag.
 */
export async function requestQuote(payload) {
  if (USE_MOCK) {
    const order = {
      id: 'webquote-' + Date.now(),
      orderNumber: nextOrderNumber(),
      source: 'ONLINE',
      status: 'NEEDS_REVIEW',
      quoteRequested: true,
      customerId: payload.customerId,
      customerName: payload.customerName || 'Online Customer',
      customerEmail: payload.customerEmail || '',
      locationId: payload.locationId,
      shipTo: payload.shipTo,
      notes: payload.notes,
      lines: (payload.lines || []).map((l, i) => ({
        lineNumber: i + 1,
        productId: l.productId,
        sku: l.sku,
        description: l.description,
        division: l.division,
        config: l.config,
        qty: l.config?.qty || 1,
        unitPrice: l.pricingPreview?.unitPrice || 0,
        extPrice: l.pricingPreview?.extended || 0,
        priceSource: l.pricingPreview?.priceSource,
      })),
      createdAt: new Date().toISOString(),
    }
    return { data: order, success: true }
  }
  const res = await fetch(`${API_BASE}/ecom/checkout/quote`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, source: 'ONLINE' }),
  })
  if (!res.ok) throw new Error('Quote request failed')
  return res.json()
}
