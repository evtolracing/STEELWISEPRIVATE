/**
 * Words for the Packaging Queue: why a move was refused, and what shipping a job did. No screen parts here, so the
 * automated checks can run them.
 */

/** The server's own sentence for a refused move, else a plain fallback. Never a bare "failed". */
export function moveProblem(err, fallback = 'The job could not be moved.') {
  const said = err?.response?.data?.error
  if (typeof said === 'string' && said.trim()) return said.trim()
  if (!err?.response) return `${fallback} The server could not be reached. Check the connection and try again.`
  return `${fallback} Try again, and if it keeps happening tell your administrator.`
}

/** What shipping a job did, for the message afterwards. */
export function shippedText(job, answer) {
  const number = answer?.shipment?.shipmentNumber
  const invoice = answer?.shipment?.invoice?.invoiceNumber
  const name = job?.jobNumber ? `Job ${job.jobNumber}` : 'The job'
  if (!number) return `${name} is marked shipped.`
  return `${name} shipped on shipment ${number}.${invoice ? ` Invoice ${invoice} was raised.` : ''}`
}

/** Why the Ship button cannot be pressed yet, or '' when it can. */
export function shipFormProblem({ carrier, trackingNumber } = {}) {
  if (!String(carrier || '').trim()) return 'Enter the carrier.'
  if (!String(trackingNumber || '').trim()) return 'Enter the tracking or BOL number.'
  return ''
}
