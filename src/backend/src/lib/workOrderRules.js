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
