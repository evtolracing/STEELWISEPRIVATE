/**
 * Request keys for requests that create a business document (an order, a shipment, an
 * invoice, a payment, a receipt, a transfer).
 *
 * The server runs a request with a given `Idempotency-Key` once. A second copy with the
 * same key gets the first answer back instead of creating a second document. So the same
 * key has to be sent when the same request is sent again: a double click, or a retry after
 * the connection dropped. This module gives one key per (address, body) and keeps it while
 * the first attempt is unanswered, and for a few seconds after it succeeds.
 */
const CREATES = [
  /\/api\/orders$/,
  /\/api\/orders\/intake$/,
  /\/api\/orders\/intake\/[^/]+\/(submit|create-work-orders)$/,
  /\/api\/orders\/intake\/convert-quote$/,
  /\/api\/ecom\/checkout\/[^/]+$/,
  /\/api\/shipments$/,
  /\/api\/shipments\/[^/]+\/(dispatch|deliver)$/,
  /\/api\/invoices$/,
  /\/api\/invoices\/[^/]+\/(payments|credit|refund)$/,
  /\/api\/returns$/,
  /\/api\/returns\/[^/]+\/receive$/,
  /\/api\/coils$/,
  /\/api\/coils\/[^/]+\/transfer$/,
  /\/api\/inventory\/(receive|receipts|transfer|bulk-upload|adjust)$/,
  /\/api\/orders\/[^/]+\/allocate$/,
  /\/api\/rfqs\/[^/]+\/quotes$/,
  /\/api\/quotes\/[^/]+\/accept$/,
  /\/api\/work-orders$/,
  /\/api\/jobs$/,
  /\/api\/quotes$/,
  /\/api\/rfqs$/,
]
const KEEP_AFTER_SUCCESS_MS = 10_000
const pending = new Map() // signature -> { key, doneAt }

const newKey = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `k-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`)

export function needsRequestKey(method, url) {
  if (String(method || 'GET').toUpperCase() !== 'POST') return false
  let path = String(url || '')
  try { path = new URL(path, 'http://x').pathname } catch { /* keep as given */ }
  if (!path.startsWith('/api')) path = `/api${path.startsWith('/') ? '' : '/'}${path}`
  return CREATES.some((re) => re.test(path))
}

/** The key to send, and a function to call with the outcome. */
export function requestKeyFor(method, url, body) {
  const signature = `${method} ${url} ${typeof body === 'string' ? body : JSON.stringify(body ?? null)}`
  const now = Date.now()
  for (const [sig, entry] of pending) if (entry.doneAt && now - entry.doneAt > KEEP_AFTER_SUCCESS_MS) pending.delete(sig)
  let entry = pending.get(signature)
  if (!entry) { entry = { key: newKey(), doneAt: null }; pending.set(signature, entry) }
  return {
    key: entry.key,
    // answered: the server gave a definite answer. ok: that answer was a success.
    settle(answered, ok) {
      if (!answered) return // no answer: keep the key so a retry is recognised
      if (ok) entry.doneAt = Date.now()
      else pending.delete(signature) // refused: the user will correct and send again as a new request
    },
  }
}
