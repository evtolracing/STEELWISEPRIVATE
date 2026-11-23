/**
 * Changing a job's plan while it is in production (owner, 2026-11-22: "when a job is in production it often changes
 * in the plan ... we need the ability to change the plan right there in case we need to change machines").
 *
 * The rules, kept pure so they are checked without a database:
 *  - A finished step is history. It is never changed, moved or removed, and it stays in front.
 *  - A step with no work recorded may be given another machine or another kind of work, renamed, moved, or removed.
 *  - A step with work recorded (running, paused, or with time on it) may be given another machine of the same kind.
 *    It cannot be removed or become another kind of work: its recorded time stays with the machine it was done on.
 *  - New steps may be added anywhere after the finished ones.
 *  - Every change carries a reason, and is written to the job's history with the name of who made it.
 */
export const PLAN_CHANGED = 'JOB_PLAN_CHANGED';
/** Who may change a plan in production: the people who run production and plan it, and the shop floor leads
 *  (owner's decision, 2026-11-22). Operators ask a lead. */
export const PLAN_CHANGE_ROLES = ['SUPER_ADMIN', 'TENANT_OWNER', 'ADMIN', 'EXECUTIVE', 'COO', 'OPS_MANAGER', 'DIVISION_DIRECTOR', 'BRANCH_MANAGER', 'PRODUCTION_MANAGER', 'SCHEDULER', 'WORKCENTER_LEAD'];
export const mayChangePlan = (role) => PLAN_CHANGE_ROLES.includes(String(role || ''));
/** A job whose plan may still change: not yet through production. */
export const PLAN_OPEN_JOB_STATUSES = ['ORDERED', 'SCHEDULED', 'IN_PROCESS', 'ON_HOLD'];

const text = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : '');
export const isFinished = (step) => step.status === 'COMPLETE';
export const hasWork = (step) => isFinished(step) || step.status === 'IN_PROCESS' || step.status === 'PAUSED' || Number(step.timeLogCount) > 0;

/**
 * steps:  the plan as it is: { id, sequence, name, status, requiredWorkCenterType, assignedWorkCenterId, timeLogCount }
 * wanted: the steps still to do, in the order wanted: { id? , name?, workCenterType, workCenterId? }
 * machines: the work centers that may be chosen: { id, name, type, isActive }
 * Returns { error } or { firstSequence, keep, create, remove, lines } where lines say each change in words.
 */
export function planChange({ steps = [], wanted, reason, machines = [], kinds = [] } = {}) {
  const why = text(reason, 500);
  if (!why) return { error: 'Say why the plan is changing. The reason is kept in the job\'s history.' };
  if (!Array.isArray(wanted)) return { error: 'Send the steps still to do, in order' };
  const ordered = [...steps].sort((a, b) => a.sequence - b.sequence);
  const done = ordered.filter(isFinished);
  const open = ordered.filter((s) => !isFinished(s));
  const byId = new Map(ordered.map((s) => [s.id, s]));
  const machine = new Map(machines.map((m) => [m.id, m]));
  const kindName = (id) => kinds.find((k) => k.id === id)?.label || id;
  const machineName = (id) => (id ? machine.get(id)?.name || 'a machine no longer on file' : 'no machine yet');
  const lines = []; const keep = []; const create = []; const seen = new Set();

  for (const [i, w] of wanted.entries()) {
    const at = `Step ${done.length + i + 1}`;
    if (!w || typeof w !== 'object') return { error: `${at} could not be read` };
    const before = w.id ? byId.get(w.id) : null;
    if (w.id && !before) return { error: `${at} is not a step of this job's plan` };
    if (before && isFinished(before)) return { error: `"${before.name}" is finished and cannot be changed` };
    if (before && seen.has(before.id)) return { error: `"${before.name}" is listed twice` };
    const kind = text(w.workCenterType, 60) || before?.requiredWorkCenterType || '';
    if (!kind) return { error: `${at} needs a kind of work` };
    if (kinds.length && !kinds.some((k) => k.id === kind && k.isActive !== false)) return { error: `${at}: "${kind}" is not a kind of work on file` };
    const wcId = w.workCenterId === undefined ? (before && before.requiredWorkCenterType === kind ? before.assignedWorkCenterId || null : null) : w.workCenterId || null;
    if (wcId) {
      const m = machine.get(wcId);
      if (!m) return { error: `${at}: that machine is not at this job's location` };
      if (m.isActive === false && wcId !== before?.assignedWorkCenterId) return { error: `${at}: ${m.name} is offline` };
      if (m.type !== kind) return { error: `${at}: ${m.name} does not do ${kindName(kind)}` };
    }
    const name = text(w.name, 120) || before?.name || kindName(kind);
    if (before) {
      seen.add(before.id);
      if (hasWork(before) && kind !== before.requiredWorkCenterType) return { error: `"${before.name}" has work recorded, so it stays ${kindName(before.requiredWorkCenterType)}. Add a new step for the other work.` };
      const changed = [];
      if (kind !== before.requiredWorkCenterType) changed.push(`now ${kindName(kind)}, was ${kindName(before.requiredWorkCenterType)}`);
      if ((wcId || null) !== (before.assignedWorkCenterId || null)) changed.push(`moved to ${machineName(wcId)} from ${machineName(before.assignedWorkCenterId)}`);
      if (name !== before.name) changed.push(`renamed from "${before.name}"`);
      if (changed.length) lines.push(`${name}: ${changed.join('; ')}`);
      keep.push({ id: before.id, name, kind, workCenterId: wcId, movedWhileWorked: hasWork(before) && (wcId || null) !== (before.assignedWorkCenterId || null), fromWorkCenterId: before.assignedWorkCenterId || null, order: i });
    } else {
      lines.push(`Added ${name}${wcId ? ` on ${machineName(wcId)}` : ''}`);
      create.push({ name, kind, workCenterId: wcId, order: i });
    }
  }
  const remove = [];
  for (const s of open) {
    if (seen.has(s.id)) continue;
    if (hasWork(s)) return { error: `"${s.name}" has work recorded and cannot be removed. Finish it, or move it to another machine.` };
    remove.push(s.id); lines.push(`Removed ${s.name}`);
  }
  const was = open.filter((s) => seen.has(s.id)).map((s) => s.id).join();
  const now = keep.map((k) => k.id).join();
  if (was !== now) lines.push('Order of the steps changed');
  if (!done.length && !keep.length && !create.length) return { error: 'A plan needs at least one step' };
  if (!lines.length) return { error: 'Nothing was changed' };
  return { reason: why, firstSequence: (done.at(-1)?.sequence || 0) + 1, keep, create, remove, lines };
}
