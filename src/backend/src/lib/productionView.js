/**
 * Where a job is and how far it has got, for the production screens (shop floor, planning, workflow board).
 * Pure functions, so the counts can be checked without a database.
 *
 * Written after the owner's audit request of 2026-11-21: the screens counted different things under the same
 * words. The shop floor counted steps and every step ever finished; the planning page looked for a job's machine
 * on the job itself, which the plan never fills; the workflow board's branch, machine and division lists were
 * made up; and filtering jobs by branch matched only jobs with that old machine field set.
 *
 * One rule now, for every screen:
 *   branch   the branch of the job's plan (where its steps run); before it is planned, its machine's branch;
 *            before that, the branch that sold the order; and for stock work with no order, the branch that holds
 *            the stock its work order cuts (owner, 2026-11-25: work orders were on no board once a branch was picked)
 *   division the plan's division; before that, its machine's; before that, the order's
 *   machine  the machine of its current step (the first step not finished)
 *   stage    from the job's status and its steps, below
 */
import { stepDetailText } from './planDetails.js';
import { WORK_WORDS } from './workOrderRules.js';
const PRODUCTION = ['ORDERED', 'SCHEDULED', 'IN_PROCESS'];
export const CLOSED = ['SHIPPED', 'COMPLETED', 'CANCELLED'];

export const STAGES = [
  { key: 'NOT_PLANNED', label: 'Not planned', hint: 'No route yet. Click a card to plan it.' },
  { key: 'NO_MACHINE', label: 'Waiting for a machine', hint: 'Planned, but its next step is on no machine. Run Dispatch.' },
  { key: 'QUEUED', label: 'Queued', hint: 'Its next step is waiting at a machine.' },
  { key: 'RUNNING', label: 'Running', hint: 'A step is being worked now.' },
  { key: 'STEPS_DONE', label: 'Steps done', hint: 'Every step is finished but the job has not moved on.' },
  { key: 'WAITING_QC', label: 'Waiting QC' },
  { key: 'PACKAGING', label: 'Packaging' },
  { key: 'READY_TO_SHIP', label: 'Ready to ship' },
  { key: 'ON_HOLD', label: 'On hold' },
];
export const FLOOR_STAGES = ['NOT_PLANNED', 'NO_MACHINE', 'QUEUED', 'RUNNING', 'STEPS_DONE'];

const bySequence = (a, b) => (a.sequence ?? 0) - (b.sequence ?? 0);

/** The step being worked or next to work: a running one first, else the first not finished. */
export function currentStep(steps = []) {
  const open = steps.filter((s) => s.status !== 'COMPLETE').sort(bySequence);
  return open.find((s) => s.status === 'IN_PROCESS') || open[0] || null;
}

/**
 * The plan's steps in order, as the lights on a job's card show them: the step's name, its status and its machine.
 * `steps` are { sequence, status, name, details?, assignedWorkCenterId?, assignedWorkCenter? }.
 * `detail` is what to do at the step in one line (pieces, cut length, width, tolerance, instructions), or null.
 */
export function planLights(steps = []) {
  return [...steps].sort(bySequence).map((s) => ({ sequence: s.sequence, detail: stepDetailText(s.details) || null, name: s.name || null, status: s.status, machine: s.assignedWorkCenter?.name || null, machineId: s.assignedWorkCenterId || s.assignedWorkCenter?.id || null }));
}

/**
 * The work orders cutting for a job, as a card names them: number, status, what is cut and from which stock item.
 * Cancelled ones are left out. `list` are { id, woNumber, woType, status, sourceCoil: { coilNumber } }.
 */
export function workOrderLines(list = []) {
  return (Array.isArray(list) ? list : [])
    .filter((w) => w && w.status !== 'CANCELLED')
    .map((w) => ({ id: w.id, woNumber: w.woNumber, status: w.status, work: WORK_WORDS[w.woType] || (w.woType ? String(w.woType).toLowerCase().replace(/_/g, ' ') : null), stockNumber: w.sourceCoil?.coilNumber || null }));
}

/** The stage of a job, or null for one that is shipped, completed or cancelled. */
export function jobStage(job, steps = []) {
  const status = job?.status;
  if (!status || CLOSED.includes(status)) return null;
  if (!PRODUCTION.includes(status)) return status; // WAITING_QC, PACKAGING, READY_TO_SHIP, ON_HOLD
  if (!steps.length) return 'NOT_PLANNED';
  const now = currentStep(steps);
  if (!now) return 'STEPS_DONE';
  if (now.status === 'IN_PROCESS') return 'RUNNING';
  return now.assignedWorkCenterId ? 'QUEUED' : 'NO_MACHINE';
}

/** The division written on an order taken at intake (kept with its notes). */
export function orderDivision(notes) {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes);
    return parsed?.__intakeMeta__?.division || null;
  } catch {
    return null;
  }
}

const wcDivision = (wc) => (wc?.capabilities && typeof wc.capabilities === 'object' && !Array.isArray(wc.capabilities) ? wc.capabilities.division || null : null);

/**
 * One job as the production screens show it. `job` carries order (with buyer, location), workCenter (with
 * location, capabilities) and dispatchJob (with location and operations, each operation with assignedWorkCenter).
 */
export function productionRow(job) {
  const plan = job.dispatchJob || null;
  const steps = plan?.operations || [];
  const now = currentStep(steps);
  const machine = now?.assignedWorkCenter || (steps.length ? null : job.workCenter) || null;
  const workOrders = workOrderLines(job.coilWorkOrders);
  const stock = (job.coilWorkOrders || []).map((w) => w.sourceCoil).find((c) => c?.locationId) || null;
  const location = plan?.location || machine?.location || job.workCenter?.location || job.order?.location || stock?.location || null;
  const locationId = plan?.locationId || machine?.locationId || job.workCenter?.locationId || job.order?.locationId || stock?.locationId || null;
  return {
    id: job.id,
    jobNumber: job.jobNumber,
    status: job.status,
    stage: jobStage(job, steps),
    priority: job.priority,
    dueDate: job.scheduledEnd || job.scheduledStart || null,
    operationType: job.operationType || null,
    orderId: job.orderId || null,
    orderNumber: job.order?.orderNumber || null,
    customerName: job.order?.buyer?.name || plan?.customerName || null,
    locationId,
    locationName: location?.name || null,
    division: plan?.division || wcDivision(machine) || wcDivision(job.workCenter) || orderDivision(job.order?.notes) || null,
    workCenterId: machine?.id || null,
    workCenterName: machine?.name || null,
    stepName: now?.name || null,
    stepSequence: now?.sequence ?? null,
    stepCount: steps.length,
    stepsDone: steps.filter((s) => s.status === 'COMPLETE').length,
    planSteps: planLights(steps),
    workOrders,
  };
}

/**
 * The machine a job is booked on for the Schedule: the machine of its current step; when every step is
 * finished, the machine of its last step; before it is planned, the old machine field on the job.
 * `steps` are { sequence, status, assignedWorkCenterId }.
 */
export function bookedMachineId(job, steps = []) {
  if (!steps.length) return job?.workCenterId || null;
  const now = currentStep(steps);
  if (now) return now.assignedWorkCenterId || null;
  const last = [...steps].sort(bySequence).pop();
  return last?.assignedWorkCenterId || null;
}

export function filterRows(rows, { locationId, division, workCenterId } = {}) {
  return rows.filter((r) => (!locationId || r.locationId === locationId)
    && (!division || r.division === division)
    && (!workCenterId || r.workCenterId === workCenterId));
}

/** Counts by stage, every stage present (0 when none). */
export function stageCounts(rows) {
  const counts = Object.fromEntries(STAGES.map((s) => [s.key, 0]));
  for (const r of rows) if (r.stage && counts[r.stage] !== undefined) counts[r.stage] += 1;
  counts.inProduction = FLOOR_STAGES.reduce((sum, k) => sum + counts[k], 0);
  counts.open = rows.filter((r) => r.stage).length;
  return counts;
}

/**
 * Per machine: steps queued and running on it now (open jobs only), and steps finished on it since `since`.
 * `steps` are { assignedWorkCenterId, status, actualEnd, jobStatus }.
 */
export function machineCounts(workCenters, steps, since) {
  const from = since ? new Date(since).getTime() : null;
  const out = {};
  for (const wc of workCenters) out[wc.id] = { queued: 0, running: 0, doneToday: 0 };
  for (const s of steps) {
    const m = out[s.assignedWorkCenterId];
    if (!m) continue;
    // The machine queue lists only steps of jobs still in production (a held or finished job's steps are not work to do).
    const open = PRODUCTION.includes(s.jobStatus);
    if (s.status === 'SCHEDULED' && open) m.queued += 1;
    else if (s.status === 'IN_PROCESS' && open) m.running += 1;
    else if (s.status === 'COMPLETE' && from !== null && s.actualEnd && new Date(s.actualEnd).getTime() >= from) m.doneToday += 1;
  }
  return out;
}
