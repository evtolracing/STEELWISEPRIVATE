/**
 * The one place a job's status changes.
 *
 * Every route that moves a job goes through changeJobStatus, so the same rules hold whichever
 * screen is used: the move table, the quality gate (no release with a failed or missing inspection),
 * the planned-steps gate, and one writer at a time (the job row is locked for the decision).
 */
import prisma from './db.js';
import { JOB_STATUSES, jobMoveError } from './workflowRules.js';
import { recordJobMove, JOB_MOVED } from './jobHistory.js';
import { qualityReleaseError, openStepsError, RELEASED_JOB_STATUSES, PAST_PRODUCTION } from './productionRules.js';

export class JobMoveRefused extends Error {
  constructor(message, status = 409) { super(message); this.status = status; this.refused = true; }
}

/** Timestamps that go with a status change. */
export function stampsFor(job, status) {
  if (status === 'IN_PROCESS' && !job.actualStart) return { actualStart: new Date() };
  if (['COMPLETED', 'READY_TO_SHIP', 'SHIPPED'].includes(status) && !job.actualEnd) return { actualEnd: new Date() };
  return {};
}

export async function lockJob(tx, id) {
  await tx.$queryRaw`SELECT id FROM "Job" WHERE id = ${id} FOR UPDATE`;
}

/** The inspections of a job, as the quality rule needs them. */
export function inspectionsOf(db, jobId) {
  return db.jobInspection.findMany({ where: { jobId }, select: { inspectionNumber: true, status: true, completedAt: true, createdAt: true } });
}

/**
 * Must this job be inspected before it is released? Yes, unless it runs on a routing marked as needing none
 * (owner's decision of 2026-11-15, finding L-021).
 */
export async function inspectionRequiredFor(db, job) {
  if (!job.recipeId) return true;
  const routing = await db.bomRecipe.findUnique({ where: { id: job.recipeId }, select: { inspectionRequired: true } });
  return routing ? routing.inspectionRequired !== false : true;
}

/** Where a job goes when its production is finished: inspection, or straight on when it needs none and owes none. */
export async function afterProduction(db, job, straightOn) {
  const inspections = await inspectionsOf(db, job.id);
  if (qualityReleaseError({ from: 'IN_PROCESS', to: straightOn, inspections, inspectionRequired: await inspectionRequiredFor(db, job) })) return 'WAITING_QC';
  return straightOn;
}

/** Why this job may not move to `to` on quality or planned-step grounds; null when it may. */
export async function gateError(db, job, to) {
  if (!PAST_PRODUCTION.includes(to)) return null;
  if (!PAST_PRODUCTION.includes(job.status)) {
    const plan = await db.dispatchJob.findUnique({ where: { jobId: job.id }, select: { operations: { select: { sequence: true, name: true, status: true } } } });
    const steps = openStepsError({ from: job.status, to, operations: plan?.operations || [] });
    if (steps) return steps;
  }
  if (!RELEASED_JOB_STATUSES.includes(to)) return null;
  const inspections = await inspectionsOf(db, job.id);
  let enteredQcAt = null;
  if (job.status === 'WAITING_QC' && inspections.length) {
    const rows = await db.auditLog.findMany({ where: { resourceType: 'Job', resourceId: job.id, eventType: JOB_MOVED }, orderBy: { timestamp: 'desc' }, take: 20, select: { timestamp: true, details: true } });
    enteredQcAt = rows.find((r) => r.details?.to === 'WAITING_QC')?.timestamp || null;
  }
  return qualityReleaseError({ from: job.status, to, inspections, enteredQcAt, inspectionRequired: await inspectionRequiredFor(db, job) });
}

/**
 * Move a job inside a transaction. Locks the job, checks every rule against what is in the
 * database now, saves the move with its history line. Throws JobMoveRefused when a rule says no.
 *   from:   statuses the caller accepts as the starting point (optional)
 *   data:   other columns to save with the move
 *   decide: (job) => target status, when the target depends on the locked job (optional)
 */
export async function changeJobStatusTx(tx, id, to, { from, fromError, data = {}, note, via, userId, decide, skipGates = false } = {}) {
  await lockJob(tx, id);
  const job = await tx.job.findUnique({ where: { id } });
  if (!job) throw new JobMoveRefused('Job not found', 404);
  if (from && !from.includes(job.status)) throw new JobMoveRefused(fromError ? fromError(job) : `A job that is ${job.status.toLowerCase().replace(/_/g, ' ')} cannot be moved this way`, 400);
  const target = decide ? await decide(job, tx) : to;
  if (target !== job.status) {
    const why = jobMoveError(job.status, target);
    if (why) throw new JobMoveRefused(why, JOB_STATUSES.includes(target) ? 409 : 400);
    const gate = skipGates ? null : await gateError(tx, job, target);
    if (gate) throw new JobMoveRefused(gate, 409);
  }
  const changes = typeof data === 'function' ? data(job) : data;
  await tx.job.update({ where: { id }, data: { ...changes, ...(target !== job.status ? { status: target, ...stampsFor(job, target) } : {}) } });
  // Cancelling a job stops its clocks: nobody stays clocked on to work that is no longer wanted.
  // The time already recorded is kept, and the entry says why it ended.
  if (target === 'CANCELLED' && target !== job.status) {
    await tx.dispatchTimeLog.updateMany({
      where: { status: 'RUNNING', dispatchOperation: { dispatchJob: { jobId: id } } },
      data: { status: 'PAUSED', endAt: new Date(), downtimeReason: 'Job cancelled' },
    });
  }
  await recordJobMove(tx, { job, from: job.status, to: target, note, via, userId });
  return { before: job, from: job.status, to: target };
}

/** Move a job in its own transaction. Returns { before, from, to }. */
export function changeJobStatus(id, to, options = {}) {
  return prisma.$transaction((tx) => changeJobStatusTx(tx, id, to, options));
}

/** Send a refusal as its HTTP answer. Returns true when it did. */
export function sendRefusal(res, error, shape = (message) => ({ error: message })) {
  if (!error?.refused) return false;
  res.status(error.status).json(shape(error.message));
  return true;
}
