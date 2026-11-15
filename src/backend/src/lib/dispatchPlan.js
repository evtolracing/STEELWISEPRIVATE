/**
 * Which pending step goes to which work center and operator.
 * Pure: the route reads the facts, this decides, the route saves. Nothing is assumed:
 * a work center with no stated type cannot be matched, and a limit that is not stated
 * (maximum thickness, division) is not checked and is reported as not checked.
 */
import { skillExpired } from './productionRules.js';

export const SKILL_ORDER = { NOVICE: 1, STANDARD: 2, ADVANCED: 3, EXPERT: 4 };
export const PRIORITY_ORDER = { VIP: 0, RUSH: 1, HOT: 2, NORMAL: 3 };
/** Jobs whose steps may still be scheduled and worked. */
export const SCHEDULABLE_JOB_STATUSES = ['ORDERED', 'SCHEDULED', 'IN_PROCESS'];

const num = (v) => (v == null || v === '' ? null : Number(v));
export const skillMeets = (required, actual) => (SKILL_ORDER[actual] || 0) >= (SKILL_ORDER[required] || SKILL_ORDER.STANDARD);

/** Why this work center cannot take this step; null when it can. */
export function workCenterMismatch(wc, op) {
  if (wc.isActive === false) return 'offline';
  if (!wc.type) return 'no type stated';
  if (wc.type !== op.requiredWorkCenterType) return 'another type';
  const cap = wc.capacity && typeof wc.capacity === 'object' ? wc.capacity : {};
  const list = Array.isArray(wc.capabilities) ? wc.capabilities : [];
  if (cap.division && op.requiredDivision && cap.division !== op.requiredDivision && !list.includes(op.requiredDivision)) return 'another division';
  const max = num(cap.maxThicknessInches);
  const thick = num(op.thickness);
  if (max != null && thick != null && thick > 0 && max < thick) return `too thin a limit (${max} in against ${thick} in)`;
  if (op.specialization && !list.includes(op.specialization)) return `no ${op.specialization} capability`;
  return null;
}

/** Why this operator cannot take this step at this branch; null when they can. */
export function operatorMismatch(person, op, branchId, now = new Date()) {
  if (person.isActive === false || (person.status && person.status !== 'ACTIVE')) return 'not active';
  if (person.homeLocationId !== branchId) return 'another branch';
  const skill = (person.skills || []).find((s) => s.workCenterTypeId === op.requiredWorkCenterType && s.isActive !== false);
  if (!skill) return 'not certified for this type';
  if (skillExpired(skill, now)) return 'certification expired';
  if (!skillMeets(op.requiredSkillLevel, skill.skillLevel)) return 'skill level too low';
  const max = num(person.maxThicknessInches);
  const thick = num(op.thickness);
  if (max != null && thick != null && thick > 0 && max < thick) return 'thickness limit';
  return null;
}

/**
 * jobs: [{ id, priority, dueDate, jobStatus, operations: [{ id, sequence, name, status, assignedWorkCenterId, ... }] }]
 * workCenters, operators: this branch's rows. loads: { [workCenterId]: open steps already queued there }.
 * Returns { assignments: [{ operationId, workCenterId, operatorId, queuedBehind }], unassigned: [{ operationId, jobNumber, name, reason }], notChecked: [text] }.
 */
export function planAssignments({ jobs, workCenters, operators, loads = {}, branchId, now = new Date() }) {
  const load = { ...loads };
  const operatorLoad = {};
  const assignments = [];
  const unassigned = [];
  const pending = [];
  for (const job of jobs) {
    if (!SCHEDULABLE_JOB_STATUSES.includes(job.jobStatus)) continue; // a cancelled, held or finished job is not scheduled
    for (const op of job.operations) if (op.status === 'PENDING' && !op.assignedWorkCenterId) pending.push({ op, job });
  }
  const due = (j) => (j.dueDate ? new Date(j.dueDate).getTime() : Number.MAX_SAFE_INTEGER);
  pending.sort((a, b) => (PRIORITY_ORDER[a.job.priority] ?? 99) - (PRIORITY_ORDER[b.job.priority] ?? 99)
    || due(a.job) - due(b.job)
    || (a.job.id === b.job.id ? a.op.sequence - b.op.sequence : a.job.id < b.job.id ? -1 : 1));

  const placed = new Set();
  for (const { op, job } of pending) {
    const say = (reason) => unassigned.push({ operationId: op.id, jobNumber: job.jobNumber || null, sequence: op.sequence, name: op.name, reason });
    const earlierOpen = job.operations.find((o) => o.sequence < op.sequence && !(o.status === 'COMPLETE' || o.status === 'SCHEDULED' || o.status === 'IN_PROCESS' || placed.has(o.id)));
    if (earlierOpen) { say(`Step ${earlierOpen.sequence} of this job has no work center yet`); continue; }
    const fits = workCenters.filter((wc) => !workCenterMismatch(wc, op));
    if (!fits.length) {
      const ofType = workCenters.filter((wc) => wc.type === op.requiredWorkCenterType);
      say(ofType.length ? `No ${op.requiredWorkCenterType} at this branch can take it: ${[...new Set(ofType.map((wc) => workCenterMismatch(wc, op)))].join(', ')}` : `This branch has no ${op.requiredWorkCenterType} work center`);
      continue;
    }
    fits.sort((a, b) => (load[a.id] || 0) - (load[b.id] || 0) || String(a.code || a.id).localeCompare(String(b.code || b.id)));
    const wc = fits[0];
    const people = operators.filter((p) => !operatorMismatch(p, op, branchId, now));
    people.sort((a, b) => Number(b.homeWorkCenterId === wc.id) - Number(a.homeWorkCenterId === wc.id) || (operatorLoad[a.id] || 0) - (operatorLoad[b.id] || 0) || String(a.id).localeCompare(String(b.id)));
    const person = people[0] || null;
    assignments.push({ operationId: op.id, workCenterId: wc.id, operatorId: person?.id || null, queuedBehind: load[wc.id] || 0 });
    placed.add(op.id);
    load[wc.id] = (load[wc.id] || 0) + 1;
    if (person) operatorLoad[person.id] = (operatorLoad[person.id] || 0) + 1;
  }

  const notChecked = [];
  const noLimit = workCenters.filter((wc) => wc.type && num(wc.capacity?.maxThicknessInches) == null).length;
  if (noLimit) notChecked.push(`${noLimit} work center${noLimit === 1 ? ' has' : 's have'} no maximum thickness on file, so thickness was not checked for ${noLimit === 1 ? 'it' : 'them'}`);
  const noType = workCenters.filter((wc) => !wc.type).length;
  if (noType) notChecked.push(`${noType} work center${noType === 1 ? ' has' : 's have'} no type on file and cannot be given work`);
  const noPerson = assignments.filter((a) => !a.operatorId).length;
  if (noPerson) notChecked.push(`${noPerson} step${noPerson === 1 ? ' was' : 's were'} given a work center but no operator: nobody at this branch holds a current certification for the type`);
  return { assignments, unassigned, notChecked };
}
