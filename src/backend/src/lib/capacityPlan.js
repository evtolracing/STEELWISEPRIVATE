/**
 * The job planner: which waiting job goes to which work center, and when.
 * Pure functions. What is not on file is reported as not known, never filled in:
 *  - a work center with no minutes per day on file has no utilisation figure;
 *  - a job with no time estimate on file is placed in the queue but given no start or end time;
 *  - a job is only placed on a work center at its own branch.
 */

const upper = (v) => (v ? String(v).toUpperCase() : null);
const PRIORITY_WEIGHTS = { HOT: 100, URGENT: 90, VIP: 85, RUSH: 75, NORMAL: 50, LOW: 25 };
export const PLANNABLE_JOB_STATUSES = ['ORDERED', 'SCHEDULED'];

/** Working minutes a work center has per day, from its record; null when none is on file. */
export function minutesPerDay(capacity) {
  const c = capacity && typeof capacity === 'object' ? capacity : {};
  const minutes = Number(c.shiftCapacityMinutesPerDay);
  if (Number.isFinite(minutes) && minutes > 0) return Math.min(minutes, 1440);
  const hours = Number(c.hoursPerDay);
  if (Number.isFinite(hours) && hours > 0) return Math.min(hours * 60, 1440);
  return null;
}

/** The branch a job is worked at: its work center's, else its order's, else that of whoever entered it. null when not known. */
export function jobBranch(job) {
  return job.workCenter?.locationId || job.order?.locationId || (!job.orderId && !job.workCenterId ? job.createdBy?.homeLocationId : null) || null;
}

/**
 * How long a job is expected to take, and where that figure comes from.
 * recipeMinutes: set-up plus machine minutes of the job's routing, when it has one.
 */
export function estimateOf(job, recipeMinutes = null) {
  const start = job.scheduledStart ? new Date(job.scheduledStart).getTime() : null;
  const end = job.scheduledEnd ? new Date(job.scheduledEnd).getTime() : null;
  if (recipeMinutes > 0) return { minutes: Math.round(recipeMinutes), source: 'ROUTING' };
  if (start && end && end > start) return { minutes: Math.round((end - start) / 60000), source: 'JOB_DATES' };
  return { minutes: null, source: 'NOT_ON_FILE' };
}

export function priorityScore(job, now = Date.now()) {
  const hours = job.dueDate ? (new Date(job.dueDate).getTime() - now) / 3600000 : Infinity;
  const urgency = hours < 8 ? 100 : hours < 24 ? 75 : hours < 48 ? 50 : 25;
  return (PRIORITY_WEIGHTS[job.priority] || 50) * 0.6 + urgency * 0.4;
}

/**
 * The clock time that lies `offset` working minutes from `now` at a work center with `perDay`
 * working minutes a day. No shift start is on file, so each day's working minutes are counted
 * from the time of day the plan was made. With no minutes per day on file, time runs without a break.
 */
export function clockAt(now, offset, perDay) {
  if (!perDay) return new Date(now.getTime() + offset * 60000);
  const day = Math.floor(offset / perDay);
  return new Date(now.getTime() + day * 86400000 + (offset - day * perDay) * 60000);
}

/**
 * jobs: [{ id, jobNumber, status, locationId, division, workCenterType, estimatedMinutes (or null), priority, dueDate }]
 * workCenters: [{ id, name, locationId, division, workCenterType, minutesPerDay (or null), isOnline }]
 */
export function planSchedule(jobs, workCenters, { locationId, division, horizonHours = 72, now = new Date() } = {}) {
  const horizon = Number(horizonHours) > 0 ? Math.min(Number(horizonHours), 24 * 60) : 72;
  let waiting = jobs.filter((j) => PLANNABLE_JOB_STATUSES.includes(j.status));
  if (locationId) waiting = waiting.filter((j) => j.locationId === locationId);
  if (division) waiting = waiting.filter((j) => !j.division || j.division === division);
  let centers = workCenters.filter((wc) => wc.isOnline);
  if (locationId) centers = centers.filter((wc) => wc.locationId === locationId);
  if (division) centers = centers.filter((wc) => !wc.division || wc.division === division);

  const scored = waiting.map((job) => ({ ...job, priorityScore: priorityScore(job, now.getTime()) }))
    .sort((a, b) => b.priorityScore - a.priorityScore || String(a.jobNumber).localeCompare(String(b.jobNumber)));
  const schedules = Object.fromEntries(centers.map((wc) => [wc.id, { workCenter: wc, jobs: [], totalMinutes: 0, untimedJobs: 0, utilizationPercent: null }]));
  const horizonDays = Math.max(1, Math.ceil(horizon / 24));
  const optimizedJobs = [];
  const unassignedJobs = [];

  for (const job of scored) {
    if (!job.locationId) { unassignedJobs.push({ ...job, reason: 'The branch this job is worked at is not on file' }); continue; }
    if (!job.workCenterType) { unassignedJobs.push({ ...job, reason: 'The job does not say what kind of work center it needs' }); continue; }
    const fits = centers.filter((wc) => wc.workCenterType === job.workCenterType && wc.locationId === job.locationId);
    if (!fits.length) { unassignedJobs.push({ ...job, reason: `No ${job.workCenterType} work center is online at this job's branch` }); continue; }
    fits.sort((a, b) => schedules[a.id].totalMinutes - schedules[b.id].totalMinutes || schedules[a.id].jobs.length - schedules[b.id].jobs.length || String(a.name).localeCompare(String(b.name)));
    const wc = fits[0];
    const s = schedules[wc.id];
    const timed = job.estimatedMinutes > 0;
    const start = timed ? clockAt(now, s.totalMinutes, wc.minutesPerDay) : null;
    const end = timed ? clockAt(now, s.totalMinutes + job.estimatedMinutes, wc.minutesPerDay) : null;
    const placed = {
      ...job, workCenterId: wc.id, workCenterName: wc.name, status: 'SCHEDULED',
      scheduledStart: start ? start.toISOString() : null, scheduledEnd: end ? end.toISOString() : null,
      queuePosition: s.jobs.length + 1,
      beyondHorizon: Boolean(start && start.getTime() - now.getTime() > horizon * 3600000),
    };
    s.jobs.push(placed);
    if (timed) s.totalMinutes += job.estimatedMinutes; else s.untimedJobs += 1;
    optimizedJobs.push(placed);
  }

  for (const s of Object.values(schedules)) {
    const perDay = s.workCenter.minutesPerDay;
    s.capacityMinutes = perDay ? perDay * horizonDays : null;
    s.utilizationPercent = perDay ? (s.totalMinutes / (perDay * horizonDays)) * 100 : null;
  }
  const rated = Object.values(schedules).filter((s) => s.utilizationPercent != null);
  const bottlenecks = rated.filter((s) => s.utilizationPercent > 90).map((s) => ({
    workCenterId: s.workCenter.id, workCenterName: s.workCenter.name, workCenterType: s.workCenter.workCenterType,
    utilizationPercent: s.utilizationPercent, jobCount: s.jobs.length, severity: s.utilizationPercent > 100 ? 'CRITICAL' : 'WARNING',
  }));
  const capacity = rated.reduce((sum, s) => sum + s.capacityMinutes, 0);
  const load = rated.reduce((sum, s) => sum + s.totalMinutes, 0);
  const jobsAtRisk = optimizedJobs.filter((j) => j.dueDate && j.scheduledEnd && new Date(j.scheduledEnd) > new Date(j.dueDate));
  const untimed = optimizedJobs.filter((j) => !j.scheduledStart).length;
  const unrated = centers.length - rated.length;

  const notes = [];
  if (untimed) notes.push(`${untimed} job${untimed === 1 ? ' has' : 's have'} no time estimate on file. ${untimed === 1 ? 'It is' : 'They are'} placed in a queue but given no start or end time, and ${untimed === 1 ? 'is' : 'are'} not counted in utilisation.`);
  if (unrated) notes.push(`${unrated} work center${unrated === 1 ? ' has' : 's have'} no working minutes per day on file, so ${unrated === 1 ? 'its' : 'their'} utilisation is not known.`);
  notes.push(`Utilisation is measured over ${horizonDays} day${horizonDays === 1 ? '' : 's'}. Shift calendars, operator availability, machine downtime and jobs already running are not part of this plan.`);

  return {
    optimizedJobs, unassignedJobs, workCenterSchedules: Object.values(schedules), bottlenecks, notes,
    metrics: {
      totalJobs: waiting.length, assignedJobs: optimizedJobs.length, unassignedJobs: unassignedJobs.length,
      overallUtilization: capacity > 0 ? Math.round((load / capacity) * 100) : null,
      jobsAtRisk: jobsAtRisk.length, bottleneckCount: bottlenecks.length,
      jobsWithoutEstimate: untimed, workCentersWithoutCapacity: unrated, horizonDays,
    },
    recommendations: recommendations(bottlenecks, jobsAtRisk, unassignedJobs),
  };
}

function recommendations(bottlenecks, jobsAtRisk, unassignedJobs) {
  const list = bottlenecks.map((bn) => ({
    type: 'BOTTLENECK', severity: bn.severity, title: `${bn.workCenterName} is overloaded`,
    description: `Utilization at ${Math.round(bn.utilizationPercent)}%. Consider reassigning jobs or adding capacity.`,
    action: 'REDISTRIBUTE', targetWorkCenterId: bn.workCenterId,
  }));
  if (jobsAtRisk.length) list.push({
    type: 'SLA_RISK', severity: 'CRITICAL', title: `${jobsAtRisk.length} job${jobsAtRisk.length === 1 ? '' : 's'} may miss due dates`,
    description: 'Planned completion is later than the promised date. Consider expediting or agreeing a new date with the customer.',
    action: 'EXPEDITE', affectedJobs: jobsAtRisk.map((j) => j.id),
  });
  if (unassignedJobs.length) {
    const reasons = [...new Set(unassignedJobs.map((j) => j.reason))];
    list.push({
      type: 'CAPACITY', severity: 'WARNING', title: `${unassignedJobs.length} job${unassignedJobs.length === 1 ? '' : 's'} cannot be assigned`,
      description: reasons.slice(0, 3).join('. ') + '.', action: 'ADD_CAPACITY',
    });
  }
  return list;
}

/**
 * Why one line of a schedule may not be saved; null when it may.
 * job: { status, operationType, branchId }; workCenter: { isActive, type, locationId } or null when none is named.
 */
export function applyError(job, workCenter, item) {
  if (!job) return 'Job not found';
  if (!PLANNABLE_JOB_STATUSES.includes(job.status)) return `Job is ${job.status.toLowerCase().replace(/_/g, ' ')}, so it can no longer be scheduled`;
  if (item.workCenterId) {
    if (!workCenter) return 'Work center not found';
    if (workCenter.isActive === false) return 'Work center is offline';
    if (job.branchId && workCenter.locationId !== job.branchId) return 'Work center is at another branch';
    if (job.operationType && workCenter.type && upper(job.operationType) !== upper(workCenter.type)) return `Work center is a ${workCenter.type}; the job needs a ${job.operationType}`;
  }
  const bad = (v) => v != null && v !== '' && Number.isNaN(new Date(v).getTime());
  if (bad(item.scheduledStart) || bad(item.scheduledEnd)) return 'A date is not valid';
  if (item.scheduledStart && item.scheduledEnd && new Date(item.scheduledEnd) <= new Date(item.scheduledStart)) return 'The end is not after the start';
  return null;
}
