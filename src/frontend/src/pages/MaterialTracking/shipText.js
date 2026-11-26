/**
 * Words for the screens that list jobs ready to ship (Packaging Queue, Staging, shop-floor shipping): why a move
 * was refused, and where a job stands with its shipment. No screen parts here, so the automated checks can run them.
 */

/** The server's own sentence for a refused move, else a plain fallback. Never a bare "failed". */
export function moveProblem(err, fallback = 'The job could not be moved.') {
  const said = err?.response?.data?.error
  if (typeof said === 'string' && said.trim()) return said.trim()
  if (!err?.response) return `${fallback} The server could not be reached. Check the connection and try again.`
  return `${fallback} Try again, and if it keeps happening tell your administrator.`
}

const SHIPMENT_WORDS = { PENDING: 'on the dock', LOADING: 'loading' }

/**
 * Where a job that is ready to ship stands, and the one next step. plan is its row from /shipments/job-plans:
 * { orderNumber, shipment: { id, shipmentNumber, status } | null }, or undefined for a job with no customer order.
 * Returns { kind: 'byHand' | 'plan' | 'dispatch', words, button, to }.
 */
export function shipmentStep(plan) {
  if (!plan) return { kind: 'byHand', words: '', button: 'Mark Shipped', to: null }
  if (plan.shipment) {
    return {
      kind: 'dispatch', button: 'Open shipment', to: `/shipping/${plan.shipment.id}`,
      words: `On shipment ${plan.shipment.shipmentNumber}, ${SHIPMENT_WORDS[plan.shipment.status] || 'not left yet'}. It is marked shipped when the shipment is dispatched.`,
    }
  }
  return {
    kind: 'plan', button: 'Plan shipment', to: plan.orderNumber ? `/shipping?order=${encodeURIComponent(plan.orderNumber)}` : '/freight/planner',
    words: 'No shipment planned yet.',
  }
}

/** The plans keyed by job, from the list the server sends. */
export function plansByJob(rows) {
  return new Map((Array.isArray(rows) ? rows : []).map((r) => [r.jobId, r]))
}
