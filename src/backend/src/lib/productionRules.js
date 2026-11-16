/**
 * Rules for shop-floor work: when a job may leave production, when an operation may be
 * started, paused or finished, who and what may work it, and what an inspection needs to pass.
 * Pure functions: no database access. lib/jobGates.js reads the facts and applies them.
 */

/** Statuses that mean the material has been released by production and quality. */
export const RELEASED_JOB_STATUSES = ['PACKAGING', 'READY_TO_SHIP', 'SHIPPED', 'COMPLETED'];
/** Statuses that mean the planned steps are over. */
export const PAST_PRODUCTION = ['WAITING_QC', ...RELEASED_JOB_STATUSES];
export const CLOSED_JOB_STATUSES = ['SHIPPED', 'COMPLETED', 'CANCELLED'];
export const OPEN_INSPECTION = ['PENDING', 'IN_PROGRESS'];
export const OPERATION_STATUSES = ['PENDING', 'SCHEDULED', 'IN_PROCESS', 'COMPLETE'];

const time = (v) => (v ? new Date(v).getTime() : 0);

/**
 * May this job be released (packaging, ready to ship, shipped, completed)?
 * inspections: [{ inspectionNumber, status, completedAt, createdAt }] for the job.
 * enteredQcAt: when the job last arrived in WAITING_QC, if it is there now.
 * inspectionRequired: the job must have a passed inspection before it leaves production (false only when its routing says so).
 * null when allowed, otherwise the reason.
 */
export function qualityReleaseError({ from, to, inspections = [], enteredQcAt = null, inspectionRequired = false }) {
  if (!RELEASED_JOB_STATUSES.includes(to)) return null;
  const open = inspections.find((i) => OPEN_INSPECTION.includes(i.status));
  if (open) return `Inspection ${open.inspectionNumber} is open for this job. Record its result in Quality before the job moves on.`;
  const decided = inspections.filter((i) => i.status === 'PASSED' || i.status === 'FAILED').sort((a, b) => time(b.completedAt || b.createdAt) - time(a.completedAt || a.createdAt));
  const latest = decided[0];
  if (latest?.status === 'FAILED') return `Inspection ${latest.inspectionNumber} failed. This job needs a passed inspection before it can move on: send it to inspection again once the work is corrected.`;
  if (from === 'WAITING_QC') {
    if (!latest) return 'This job is waiting for inspection. Record the inspection result in Quality; a pass moves it to packaging.';
    if (enteredQcAt && time(latest.completedAt || latest.createdAt) < time(enteredQcAt)) return `This job came back to inspection after inspection ${latest.inspectionNumber} passed. It needs a new inspection.`;
  }
  // Every job is inspected before it is released, unless its routing says it needs none (owner's decision of
  // 2026-11-15, L-021). Work that was already released when the rule arrived (packaging onwards) carries on.
  if (inspectionRequired && !RELEASED_JOB_STATUSES.includes(from) && from !== 'WAITING_QC' && !latest) {
    return 'This job has not been inspected. Send it to inspection; a passed inspection moves it to packaging.';
  }
  return null;
}

/** Does this job owe an inspection before it can be released? (Its last decided inspection failed, or one is open.) */
export function owesInspection(inspections = []) {
  return Boolean(qualityReleaseError({ from: 'IN_PROCESS', to: 'READY_TO_SHIP', inspections }));
}

/**
 * A job with planned steps cannot leave production while one is unfinished.
 * operations: [{ sequence, name, status }]. null when allowed.
 */
export function openStepsError({ from, to, operations = [] }) {
  if (!PAST_PRODUCTION.includes(to) || PAST_PRODUCTION.includes(from)) return null;
  const open = operations.filter((o) => o.status !== 'COMPLETE').sort((a, b) => a.sequence - b.sequence);
  if (!open.length) return null;
  const first = open[0];
  return `This job has ${open.length} planned step${open.length === 1 ? '' : 's'} not finished (step ${first.sequence}: ${first.name}). Finish the steps on the shop floor, or re-plan the job, before it moves on.`;
}

/** Is this certification past its date? */
export function skillExpired(skill, now = new Date()) {
  return Boolean(skill?.expiresAt && time(skill.expiresAt) <= time(now));
}

/** Can this work center do this operation at this branch? null when it can, otherwise why not. */
export function workCenterEligibility(workCenter, operation, branchId) {
  if (!workCenter) return 'That work center is not on file';
  if (workCenter.isActive === false) return `${workCenter.name || 'That work center'} is not active`;
  if (branchId && workCenter.locationId && workCenter.locationId !== branchId) return `${workCenter.name || 'That work center'} is at another branch. This job is worked at its own branch.`;
  if (operation?.requiredWorkCenterType && workCenter.type !== operation.requiredWorkCenterType) {
    return `${workCenter.name || 'That work center'} is ${workCenter.type ? `a ${workCenter.type}` : 'of no stated type'}; this step needs a ${operation.requiredWorkCenterType}`;
  }
  return null;
}

/**
 * Can this operator work this operation at this branch?
 * An expired certification always refuses. A missing one refuses only where the kind of work center is
 * marked as needing a certification (kind.certificationRequired; owner's decision of 2026-11-15, L-022).
 */
export function operatorEligibility(operator, operation, branchId, now = new Date(), kind = null) {
  if (!operator) return 'That operator is not on file';
  const name = [operator.firstName, operator.lastName].filter(Boolean).join(' ') || 'That operator';
  if (operator.isActive === false || (operator.status && operator.status !== 'ACTIVE')) return `${name} is not active${operator.status && operator.status !== 'ACTIVE' ? ` (${String(operator.status).toLowerCase().replace(/_/g, ' ')})` : ''}`;
  if (branchId && operator.homeLocationId && operator.homeLocationId !== branchId) return `${name} works at another branch. This job is worked at its own branch.`;
  const skill = (operator.skills || []).find((s) => s.workCenterTypeId === operation?.requiredWorkCenterType && s.isActive !== false);
  if (skill && skillExpired(skill, now)) return `${name}'s ${operation.requiredWorkCenterType} certification expired on ${new Date(skill.expiresAt).toISOString().slice(0, 10)}`;
  if (!skill && kind?.certificationRequired) return `${name} has no ${kind.label || operation.requiredWorkCenterType} certification on file, and this kind of work needs one. Add the certification to the operator's record first.`;
  return null;
}

/**
 * May this operator be clocked on to another step while one is already running? (L-022)
 * running: [{ stepName, jobNumber, kindId }] the operator's running entries on OTHER steps.
 * kinds: Map or object of kindId → { label, allowsConcurrentSteps }. null when allowed.
 */
export function concurrentStepError(operatorName, running = [], startingKindId, kinds = {}) {
  if (!running.length) return null;
  const get = (id) => (kinds instanceof Map ? kinds.get(id) : kinds[id]) || null;
  const blocking = [startingKindId, ...running.map((r) => r.kindId)].find((id) => !get(id)?.allowsConcurrentSteps);
  if (blocking === undefined) return null;
  const first = running[0];
  return `${operatorName || 'This operator'} is already clocked on to ${first.stepName || 'a step'}${first.jobNumber ? ` of job ${first.jobNumber}` : ''}. Pause or finish it first: ${get(blocking)?.label || blocking || 'this kind of work'} is not marked for running two steps at once.`;
}

/**
 * May this operation be started (or resumed)?
 * siblings: every operation of the same job. jobStatus: the job's status, when it has one.
 */
export function operationStartError({ operation, siblings = [], jobStatus = null, inOrder = true }) {
  if (operation.status === 'COMPLETE') return `${operation.name} is already finished. A finished step cannot be started again.`;
  if (jobStatus && CLOSED_JOB_STATUSES.includes(jobStatus)) return `This job is ${jobStatus.toLowerCase()}; its operations cannot be started`;
  if (jobStatus === 'ON_HOLD') return 'This job is on hold. Release the hold before work continues.';
  if (jobStatus && PAST_PRODUCTION.includes(jobStatus)) return `This job has left production (${jobStatus.toLowerCase().replace(/_/g, ' ')}); its operations cannot be started`;
  if (inOrder) {
    const earlier = siblings.filter((o) => o.sequence < operation.sequence && o.status !== 'COMPLETE').sort((a, b) => a.sequence - b.sequence)[0];
    if (earlier) return `Step ${earlier.sequence} (${earlier.name}) is not finished. Steps are worked in their planned order.`;
  }
  return null;
}

export function operationCompleteError(operation) {
  if (operation.status === 'COMPLETE') return null; // a repeat changes nothing
  if (operation.status !== 'IN_PROCESS') return `${operation.name} has not been started, so it cannot be finished. Start it first so its time is recorded.`;
  return null;
}

export function operationPauseError(operation, hasRunningLog) {
  if (operation.status !== 'IN_PROCESS' || !hasRunningLog) return `${operation.name} is not running, so there is nothing to pause`;
  return null;
}

/**
 * What stops an inspection from being passed outright: a required checklist item that failed
 * or was not answered as passed, or a measurement recorded as out of tolerance. Returns the list of reasons.
 */
export function inspectionPassBlockers(checklist, dimensionalChecks) {
  const reasons = [];
  for (const c of Array.isArray(checklist) ? checklist : []) {
    const result = typeof c?.result === 'string' ? c.result.toUpperCase() : c?.result;
    if (c?.required && (result === 'FAIL' || result === 'FAILED' || result === false)) reasons.push(`"${c.item || 'A required check'}" failed`);
  }
  for (const d of Array.isArray(dimensionalChecks) ? dimensionalChecks : []) {
    if (d?.pass === false) reasons.push(`${d.dimension || 'A measurement'} is out of tolerance`);
  }
  return reasons;
}
