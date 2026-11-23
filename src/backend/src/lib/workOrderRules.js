/**
 * Coil work orders: which moves are allowed. Pure, so it is unit tested.
 */
export const WO_TYPES = ['SLIT', 'CTL', 'BLANK', 'LEVELCUT', 'MULTIBLANKING', 'SHEAR'];
export const WO_STATUSES = ['DRAFT', 'READY', 'IN_PROGRESS', 'QC_HOLD', 'COMPLETE', 'CANCELLED'];

const MOVES = {
  DRAFT: ['READY', 'IN_PROGRESS', 'CANCELLED'],
  READY: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETE', 'QC_HOLD', 'CANCELLED'],
  // A held work order is released back to the line by quality before it can be completed (Phase 7).
  QC_HOLD: ['IN_PROGRESS', 'CANCELLED'],
  COMPLETE: [],
  CANCELLED: [],
};

const words = (s) => String(s).toLowerCase().replace(/_/g, ' ');

/** null when the move is allowed, otherwise why not. */
export function workOrderMoveError(from, to) {
  if (!WO_STATUSES.includes(to)) return `Unknown work order status "${to}"`;
  if (from === to) return `This work order is already ${words(to)}`;
  if (from === 'COMPLETE') return 'A completed work order cannot be changed';
  if (from === 'CANCELLED') return 'A cancelled work order cannot be changed';
  if (!MOVES[from]?.includes(to)) return `A work order that is ${words(from)} cannot be made ${words(to)}`;
  return null;
}

/** Who may release a work order from quality hold: quality staff, the production manager, and administrators. */
export const HOLD_RELEASERS = new Set(['QC_MANAGER', 'QC_INSPECTOR', 'PRODUCTION_MANAGER', 'SUPER_ADMIN', 'TENANT_OWNER', 'ADMIN', 'COO', 'OPS_MANAGER']);

/**
 * Does the source item fit the order line it is being cut for? null when it does.
 * A different grade is refused unless the request says it is a substitution and why.
 */
export function gradeFitError({ sourceGrade, lineGrade, substitutionReason }) {
  if (!sourceGrade || !lineGrade || sourceGrade.id === lineGrade.id) return null;
  if (typeof substitutionReason === 'string' && substitutionReason.trim().length >= 5) return null;
  return `The source item is ${sourceGrade.code}; the order line asks for ${lineGrade.code}. Choose stock of the ordered grade, or record this as a substitution with the reason.`;
}

const WORK_WORDS = { SLIT: 'Slit', CTL: 'Cut to length', BLANK: 'Blank', LEVELCUT: 'Level and cut', MULTIBLANKING: 'Multi-blank', SHEAR: 'Shear' };
/** Jobs a new work order may still be cut for. */
export const OPEN_JOB_STATUSES = ['ORDERED', 'SCHEDULED', 'IN_PROCESS', 'ON_HOLD'];

/** What the shop reads on the job a work order makes: "Stock work - Slit C-00012 (4,000 lb), WO-00007". */
export function workOrderJobText({ woType, coilNumber, inputWeightLb, woNumber, forOrder = false }) {
  const weight = Number(inputWeightLb) > 0 ? ` (${Math.round(Number(inputWeightLb)).toLocaleString('en-US')} lb)` : '';
  const what = `${WORK_WORDS[woType] || 'Process'} ${coilNumber || 'stock item'}${weight}`;
  return `${forOrder ? '' : 'Stock work - '}${what}${woNumber ? `, ${woNumber}` : ''}`.slice(0, 2000);
}

/**
 * The job a new work order makes when it was not opened from one (owner's decision, 2026-11-23): it starts
 * as ORDERED, so it is on the Order Board to be planned and reaches the Shop Floor like any other job.
 * No operation type is set: the planner picks the machine, and a type would hold the job to one kind.
 */
export function jobForWorkOrder({ woType, priority, scheduledDate, inputWeightLb, coilNumber, line = null, userId }) {
  const when = scheduledDate ? new Date(scheduledDate) : null;
  return {
    status: 'ORDERED',
    priority: Number.isInteger(priority) ? priority : 3,
    scheduledStart: when,
    scheduledEnd: when,
    inputWeightLb: inputWeightLb ?? null,
    instructions: workOrderJobText({ woType, coilNumber, inputWeightLb, forOrder: Boolean(line) }),
    ...(line ? { orderId: line.orderId, orderLineId: line.id } : {}),
    createdById: userId,
  };
}

/**
 * Should cancelling a work order cancel its job too? Only the job that work order made, only while nobody
 * has started it, and only when no other live work order is cutting for it.
 */
export function cancelsItsJob({ workOrderId, job, otherLiveWorkOrders = 0 }) {
  if (!job || job.workOrderId !== workOrderId) return false;
  if (!['ORDERED', 'SCHEDULED'].includes(job.status)) return false;
  return otherLiveWorkOrders === 0;
}
