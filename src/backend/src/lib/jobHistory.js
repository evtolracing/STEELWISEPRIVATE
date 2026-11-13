/**
 * Who moved a job, when, and why.
 *
 * Every change of a job's status is written to the audit log, so the job
 * screen can show a real history instead of one guessed from timestamps.
 */
import prisma from './db.js';

export const JOB_MOVED = 'JOB_STATUS_CHANGED';
export const JOB_ASSIGNED = 'JOB_ASSIGNED';

const text = (v, max = 500) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

/** The audit row for one status change. Pure, so it can be tested without a database. */
export function moveRecord({ job, from, to, note, via, userId }) {
  return {
    category: 'WORKFLOW', eventType: JOB_MOVED, severity: 'INFO', action: 'UPDATE',
    userId: userId || null, resourceType: 'Job', resourceId: job.id,
    details: { jobNumber: job.jobNumber || null, from: from || null, to, note: text(note), via: text(via, 60) },
  };
}

/** Record a status change. Does nothing when the status did not change. db may be a transaction. */
export async function recordJobMove(db, { job, from, to, note, via, userId }) {
  if (!job?.id || !to || from === to) return null;
  return (db || prisma).auditLog.create({ data: moveRecord({ job, from, to, note, via, userId }) });
}

/** Record who a job was given to (or taken from). */
export async function recordJobAssignment(db, { job, fromUserId, toUserId, userId }) {
  if (!job?.id || (fromUserId || null) === (toUserId || null)) return null;
  return (db || prisma).auditLog.create({
    data: {
      category: 'WORKFLOW', eventType: JOB_ASSIGNED, severity: 'INFO', action: 'UPDATE',
      userId: userId || null, targetUserId: toUserId || null, resourceType: 'Job', resourceId: job.id,
      details: { jobNumber: job.jobNumber || null, from: fromUserId || null, to: toUserId || null },
    },
  });
}

const person = (u) => (u ? [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || null : null);

/**
 * Build the history shown on the job screen.
 * rows: audit rows for the job, oldest first, each with an optional `user`.
 * A job from before moves were recorded has no rows; its timestamps are used
 * and marked `recorded: false` so the screen can say who is not known.
 */
export function buildHistory(job, rows, people = {}) {
  const history = [{ timestamp: job.createdAt, type: 'CREATED', status: null, note: 'Job created', by: person(job.createdBy), recorded: true }];
  for (const r of rows) {
    const d = r.details || {};
    if (r.eventType === JOB_MOVED) {
      history.push({ timestamp: r.timestamp, type: 'STATUS', from: d.from || null, status: d.to || null, note: d.note || null, via: d.via || null, by: person(r.user), recorded: true });
    } else if (r.eventType === JOB_ASSIGNED) {
      history.push({ timestamp: r.timestamp, type: 'ASSIGNED', status: null, note: d.to ? `Assigned to ${people[d.to] || 'a user no longer on file'}` : 'Assignment removed', by: person(r.user), recorded: true });
    }
  }
  if (!rows.some((r) => r.eventType === JOB_MOVED)) {
    const stamp = (timestamp, status, note) => timestamp && history.push({ timestamp, type: 'STATUS', from: null, status, note, via: null, by: null, recorded: false });
    stamp(job.actualStart, 'IN_PROCESS', 'Work started');
    stamp(job.actualEnd, 'READY_TO_SHIP', 'Work finished');
    stamp(job.shippedAt, 'SHIPPED', job.trackingNumber ? `Shipped via ${job.shippingCarrier || 'carrier'} - ${job.trackingNumber}` : 'Shipped');
  }
  return history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

/** History for one job, read from the audit log. */
export async function jobHistory(job) {
  const rows = await prisma.auditLog.findMany({
    where: { resourceType: 'Job', resourceId: job.id, eventType: { in: [JOB_MOVED, JOB_ASSIGNED] } },
    orderBy: { timestamp: 'asc' },
    take: 500,
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });
  const ids = [...new Set(rows.map((r) => r.details?.to).filter(isId))];
  const users = ids.length ? await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, firstName: true, lastName: true, email: true } }) : [];
  return buildHistory(job, rows, Object.fromEntries(users.map((u) => [u.id, person(u)])));
}

function isId(v) {
  return typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
}

/**
 * Change a job and record the move if its status changed. Used where a job is
 * moved as a side effect (an inspection result, the last operation finishing).
 */
export async function moveJob(db, jobId, data, { note, via, userId } = {}) {
  const client = db || prisma;
  const before = await client.job.findUnique({ where: { id: jobId }, select: { id: true, jobNumber: true, status: true } });
  const job = await client.job.update({ where: { id: jobId }, data });
  if (before && data.status) await recordJobMove(client, { job: before, from: before.status, to: data.status, note, via, userId });
  return job;
}

/** Move every job that matches, recording each one. Returns how many moved. */
export async function moveJobsWhere(db, where, to, { note, via, userId } = {}) {
  const client = db || prisma;
  const jobs = await client.job.findMany({ where, select: { id: true, jobNumber: true, status: true } });
  if (!jobs.length) return 0;
  await client.job.updateMany({ where: { id: { in: jobs.map((j) => j.id) } }, data: { status: to } });
  for (const job of jobs) await recordJobMove(client, { job, from: job.status, to, note, via, userId });
  return jobs.length;
}
