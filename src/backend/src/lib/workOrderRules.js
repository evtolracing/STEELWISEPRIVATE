/**
 * Coil work orders: which moves are allowed. Pure, so it is unit tested.
 */
export const WO_TYPES = ['SLIT', 'CTL', 'BLANK', 'LEVELCUT', 'MULTIBLANKING', 'SHEAR'];
export const WO_STATUSES = ['DRAFT', 'READY', 'IN_PROGRESS', 'QC_HOLD', 'COMPLETE', 'CANCELLED'];

const MOVES = {
  DRAFT: ['READY', 'IN_PROGRESS', 'CANCELLED'],
  READY: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETE', 'QC_HOLD', 'CANCELLED'],
  QC_HOLD: ['IN_PROGRESS', 'COMPLETE', 'CANCELLED'],
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
