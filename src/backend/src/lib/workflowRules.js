/**
 * Status rules for orders, jobs and shipments, in one place so the API and the
 * tests agree. Pure functions: no database access.
 */

// Sales order. PARTIAL and COMPLETE are set by shipping, never by hand.
const ORDER_MOVES = {
  DRAFT: ['PENDING', 'CONFIRMED', 'HOLD', 'CANCELLED'],
  PENDING: ['CONFIRMED', 'HOLD', 'CANCELLED', 'DRAFT'],
  CONFIRMED: ['HOLD', 'CANCELLED'],
  HOLD: ['PENDING', 'CONFIRMED', 'CANCELLED'],
  PARTIAL: [], // some of it has shipped: finish shipping it
  COMPLETE: [],
  CANCELLED: [],
};
export const ORDER_STATUSES = Object.keys(ORDER_MOVES);
export const SHIPPABLE_ORDER_STATUSES = ['CONFIRMED', 'PARTIAL'];

/** null when the move is allowed, otherwise the reason. */
export function orderMoveError(from, to) {
  if (!ORDER_STATUSES.includes(to)) return `Unknown order status "${to}"`;
  if (from === to) return null;
  if (to === 'PARTIAL' || to === 'COMPLETE') return `Orders become ${to} when their shipments go out, not by hand`;
  if (from === 'CANCELLED') return 'A cancelled order cannot be reopened';
  if (from === 'COMPLETE') return 'A completed order cannot be changed';
  if (from === 'PARTIAL') return 'Part of this order has shipped, so it can no longer be cancelled or put on hold here';
  return ORDER_MOVES[from]?.includes(to) ? null : `An order cannot go from ${from} to ${to}`;
}

// Shop-floor job. The boards let people drag jobs between columns, so most
// moves are allowed; what is blocked is finishing work that never started,
// un-starting work that is ready or gone, and changing finished jobs.
export const JOB_STATUSES = ['ORDERED', 'SCHEDULED', 'IN_PROCESS', 'WAITING_QC', 'PACKAGING', 'READY_TO_SHIP', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'ON_HOLD'];
const NOT_STARTED = ['ORDERED', 'SCHEDULED'];
const DONE = ['SHIPPED', 'COMPLETED'];

export function jobMoveError(from, to) {
  if (!JOB_STATUSES.includes(to)) return `Invalid status. Must be one of: ${JOB_STATUSES.join(', ')}`;
  if (from === to) return null;
  if (from === 'CANCELLED') return 'A cancelled job cannot be changed';
  if (from === 'COMPLETED') return 'A completed job cannot be changed';
  if (from === 'SHIPPED') return to === 'COMPLETED' ? null : 'A shipped job can only be completed';
  if (NOT_STARTED.includes(from) && DONE.includes(to)) return `A job that has not started cannot be marked ${to}`;
  if (['READY_TO_SHIP'].includes(from) && NOT_STARTED.includes(to)) return `A job that is ready to ship cannot go back to ${to}`;
  return null;
}

const SHIPMENT_MOVES = {
  PENDING: ['LOADING', 'IN_TRANSIT', 'CANCELLED'],
  LOADING: ['IN_TRANSIT', 'PENDING', 'CANCELLED'],
  IN_TRANSIT: ['DELIVERED', 'EXCEPTION'],
  EXCEPTION: ['IN_TRANSIT', 'DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};
export function shipmentMoveError(from, to) {
  if (!(to in SHIPMENT_MOVES)) return `Unknown shipment status "${to}"`;
  if (from === to) return `Shipment is already ${to}`;
  return SHIPMENT_MOVES[from]?.includes(to) ? null : `A shipment cannot go from ${from} to ${to}`;
}

/** A positive, finite number, or null. */
export function positiveQty(v) {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : null;
}

/** Line status from ordered and shipped quantities. */
export function lineStatusFor(ordered, shipped) {
  if (shipped <= 0) return 'OPEN';
  return shipped + 1e-9 >= ordered ? 'COMPLETE' : 'PARTIAL';
}

/** Order status after a shipment goes out, from its lines' statuses. */
export function orderStatusFromLines(lineStatuses) {
  const live = lineStatuses.filter((s) => s !== 'CANCELLED');
  if (live.length && live.every((s) => s === 'COMPLETE')) return 'COMPLETE';
  return live.some((s) => s === 'COMPLETE' || s === 'PARTIAL') ? 'PARTIAL' : null;
}
