/**
 * What stops an order on the intake screen from being submitted, in words for the person entering it.
 * Pure: the screen shows the first problem and the server checks again (routes/intakeOrders.js).
 */
export function orderProblems({ customer, lines }) {
  const problems = []
  if (!customer?.id) problems.push('Pick a customer.')
  if (!Array.isArray(lines) || lines.length === 0) problems.push('Add at least one line.')
  for (const [i, line] of (lines || []).entries()) {
    const n = i + 1
    if (!String(line?.description || '').trim()) problems.push(`Line ${n}: choose a material or type a description.`)
    if (!(Number(line?.qty) > 0)) problems.push(`Line ${n}: the quantity must be more than zero.`)
  }
  return problems
}

/** Lines with a description and a quantity but no price. Allowed, but the person is asked first. */
export function unpricedLines(lines) {
  return (lines || []).map((line, i) => ({ line, n: i + 1 }))
    .filter(({ line }) => String(line?.description || '').trim() && !(Number(line?.unitPrice) > 0) && !(Number(line?.extPrice) > 0))
    .map(({ n }) => n)
}

/**
 * What the Orders list offers for an order, by its status. A submitted order has no work orders yet
 * (making them is what confirms it), so that is the step offered; a confirmed one is on the Order Board.
 */
export function nextStepFor(status) {
  if (status === 'DRAFT') return 'OPEN'
  if (status === 'SUBMITTED' || status === 'PENDING') return 'CREATE_WORK_ORDERS'
  if (['CONFIRMED', 'IN_PRODUCTION', 'READY', 'PARTIAL'].includes(status)) return 'SEE_ON_BOARD'
  return 'OPEN'
}
