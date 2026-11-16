/**
 * What may be recorded on a work center, and when one may be moved or taken offline.
 * Used by both addresses that change a work center (/api/work-centers and /api/v1/dispatch/work-centers).
 */
import prisma from './db.js';
import { SCHEDULABLE_JOB_STATUSES } from './dispatchPlan.js';

/** Capacity figures must be real: hours in a day, minutes in a day, a thickness above zero. Pure. */
export function capacityError(capacity) {
  if (capacity == null) return null;
  if (typeof capacity !== 'object' || Array.isArray(capacity)) return 'capacity must be a set of named figures';
  const check = (key, max, label) => {
    const v = capacity[key];
    if (v == null || v === '') return null;
    return Number.isFinite(Number(v)) && Number(v) > 0 && Number(v) <= max ? null : `${label} must be more than zero and at most ${max}`;
  };
  return check('hoursPerDay', 24, 'Hours per day') || check('shiftCapacityMinutesPerDay', 1440, 'Minutes per day') || check('maxThicknessInches', 1000, 'Maximum thickness');
}

/** A type named on a work center must be on file. */
export async function typeError(type) {
  if (type == null || type === '') return null;
  const found = await prisma.workCenterType.findUnique({ where: { id: String(type) }, select: { id: true } });
  return found ? null : `"${type}" is not a work center type on file. Create the type first.`;
}

/**
 * A work center with steps queued or running cannot change branch or type; one with a step running cannot go offline.
 * existing: the row now. changes: { locationId?, type?, isActive? }. null when the change may be saved.
 */
export async function changeError(existing, changes) {
  const moving = (changes.locationId !== undefined && changes.locationId !== existing.locationId) || (changes.type !== undefined && (changes.type || null) !== (existing.type || null));
  const stopping = changes.isActive === false && existing.isActive !== false;
  if (!moving && !stopping) return null;
  const open = await prisma.dispatchOperation.count({
    where: { assignedWorkCenterId: existing.id, status: moving ? { in: ['SCHEDULED', 'IN_PROCESS'] } : 'IN_PROCESS', dispatchJob: { job: { status: { in: SCHEDULABLE_JOB_STATUSES } } } },
  });
  if (!open) return null;
  return moving
    ? `${existing.name} has ${open} step${open === 1 ? '' : 's'} queued or running. Finish or reassign them before changing its branch or type.`
    : `${existing.name} has a step running. Pause or finish it before taking the work center offline.`;
}

/**
 * Work centers that must not run: a machine on them is locked out for maintenance in progress
 * (lock-out required, or a breakdown repair), or is recorded as down or out of service.
 * Returns { [workCenterId]: reason }. db may be a transaction.
 */
export async function lockedOut(db, workCenterIds) {
  const ids = [...new Set((workCenterIds || []).filter(Boolean))];
  if (!ids.length) return {};
  const assets = await db.asset.findMany({
    where: { workCenterId: { in: ids } },
    select: { workCenterId: true, name: true, status: true, maintenanceOrders: { where: { status: 'IN_PROGRESS', OR: [{ lotoRequired: true }, { type: 'BREAKDOWN' }] }, select: { woNumber: true, type: true }, take: 1 } },
  });
  const out = {};
  for (const a of assets) {
    const mo = a.maintenanceOrders[0];
    if (mo) out[a.workCenterId] = `${a.name} is locked out for maintenance (${mo.woNumber})`;
    else if (DOWN_STATUSES.includes(a.status) && !out[a.workCenterId]) out[a.workCenterId] = `${a.name} is recorded as ${String(a.status).toLowerCase().replace(/_/g, ' ')}`;
  }
  return out;
}
const DOWN_STATUSES = ['OUT_OF_SERVICE', 'SAFETY_HOLD', 'QUALITY_HOLD'];
