/**
 * Work Order Optimization AI Routes
 * Intelligent job sequencing, assignment, and scheduling optimization
 */

import { Router } from 'express';
import prisma from '../lib/db.js';
import { lockedOut } from '../lib/workCenterGuard.js';
import { planSchedule, minutesPerDay, jobBranch, estimateOf, applyError } from '../lib/capacityPlan.js';

const router = Router();

// ============================================
// DATA (Job and WorkCenter tables)
// ============================================

const PRIORITY_INT_TO_STRING = { 1: 'LOW', 2: 'LOW', 3: 'NORMAL', 4: 'RUSH', 5: 'HOT' };
const MAX_JOBS = 1000;

const upper = (v) => (v ? String(v).toUpperCase() : null);

function toWorkCenter(wc) {
  const capacity = wc.capacity && typeof wc.capacity === 'object' ? wc.capacity : {};
  return {
    id: wc.id,
    name: wc.name,
    locationId: wc.locationId,
    division: capacity.division || null,
    workCenterType: upper(wc.type),
    // Working minutes per day as recorded (minutes, or hours per day). null when none is on file: nothing is assumed.
    minutesPerDay: minutesPerDay(capacity),
    shiftCapacityMinutesPerDay: minutesPerDay(capacity),
    isOnline: wc.isActive,
  };
}

function toJob(job, recipeMinutes) {
  const estimate = estimateOf(job, recipeMinutes);
  const due = job.order?.promisedDate || job.order?.requiredDate || null;
  const wcCapacity = job.workCenter?.capacity && typeof job.workCenter.capacity === 'object' ? job.workCenter.capacity : {};
  return {
    id: job.id,
    jobNumber: job.jobNumber,
    orderId: job.orderId,
    orderLineId: job.orderLineId,
    grade: job.gradeOverride,
    thickness: job.thicknessIn != null ? Number(job.thicknessIn) : null,
    division: wcCapacity.division || null,
    locationId: jobBranch(job),
    workCenterType: upper(job.operationType) || upper(job.workCenter?.type),
    workCenterId: job.workCenterId,
    status: job.status,
    scheduledStart: job.scheduledStart ? job.scheduledStart.toISOString() : null,
    scheduledEnd: job.scheduledEnd ? job.scheduledEnd.toISOString() : null,
    estimatedMinutes: estimate.minutes,
    estimateSource: estimate.source,
    priority: PRIORITY_INT_TO_STRING[job.priority] || 'NORMAL',
    dueDate: due ? due.toISOString() : null,
    recipeId: job.recipeId,
    recipeVersion: job.recipeVersion,
    hasCustomRouting: job.hasCustomRouting,
  };
}

/** Jobs waiting to start and the work centers, in planner shape. With a branch, only that branch's are read. */
async function loadPlanningData(jobIds, locationId) {
  const where = { status: { in: ['SCHEDULED', 'ORDERED'] } };
  if (Array.isArray(jobIds) && jobIds.length > 0) where.id = { in: jobIds.filter((v) => typeof v === 'string').slice(0, MAX_JOBS) };
  if (locationId) where.OR = [{ workCenter: { locationId } }, { workCenterId: null, order: { locationId } }, { orderId: null, workCenterId: null, createdBy: { homeLocationId: locationId } }];
  const [jobs, workCenters] = await Promise.all([
    prisma.job.findMany({
      where,
      take: MAX_JOBS,
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      include: {
        order: { select: { promisedDate: true, requiredDate: true, locationId: true } },
        workCenter: { select: { type: true, locationId: true, capacity: true } },
        createdBy: { select: { homeLocationId: true } },
      },
    }),
    prisma.workCenter.findMany({ where: locationId ? { locationId } : {}, orderBy: { name: 'asc' } }),
  ]);
  // A job with a routing takes its time from the routing: set-up plus machine minutes of every step.
  const recipeIds = [...new Set(jobs.map((j) => j.recipeId).filter(Boolean))];
  const steps = recipeIds.length ? await prisma.bomOperation.groupBy({ by: ['recipeId'], where: { recipeId: { in: recipeIds } }, _sum: { setupMinutes: true, estimatedMachineMinutes: true } }) : [];
  const minutes = Object.fromEntries(steps.map((r) => [r.recipeId, (r._sum.setupMinutes || 0) + (r._sum.estimatedMachineMinutes || 0)]));
  // A machine locked out for maintenance, or on a safety or quality hold, is planned as offline.
  const locked = await lockedOut(prisma, workCenters.map((wc) => wc.id));
  return { jobs: jobs.map((j) => toJob(j, minutes[j.recipeId] || null)), workCenters: workCenters.map((wc) => ({ ...toWorkCenter(wc), ...(locked[wc.id] ? { isOnline: false, offlineReason: locked[wc.id] } : {}) })), truncated: jobs.length === MAX_JOBS };
}

const optimizeSchedule = planSchedule;

// ============================================
// ROUTES
// ============================================

// POST /v1/ai/work-order-optimize/preview
router.post('/preview', async (req, res) => {
  try {
    const { locationId, division, horizonHours, jobIds } = req.body || {};
    const { jobs, workCenters } = await loadPlanningData(jobIds, locationId);

    const result = optimizeSchedule(jobs, workCenters, {
      locationId,
      division,
      horizonHours: horizonHours || 72,
    });
    
    res.json({
      success: true,
      preview: result,
      message: `Generated optimized schedule for ${result.optimizedJobs.length} jobs`,
    });
  } catch (error) {
    console.error('Error generating optimization preview:', error);
    res.status(500).json({ error: 'Failed to generate optimization preview' });
  }
});

// POST /v1/ai/work-order-optimize/apply
// Writes the previewed work center and start/end times onto each job.
router.post('/apply', async (req, res) => {
  try {
    const { optimizedJobs } = req.body || {};
    
    if (!optimizedJobs || !Array.isArray(optimizedJobs)) {
      return res.status(400).json({ error: 'optimizedJobs array is required' });
    }

    if (optimizedJobs.length > MAX_JOBS) return res.status(400).json({ error: `At most ${MAX_JOBS} jobs can be scheduled at once` });
    const ids = optimizedJobs.map(j => j?.id).filter((v) => typeof v === 'string');
    const wcIds = [...new Set(optimizedJobs.map(j => j?.workCenterId).filter((v) => typeof v === 'string'))];
    // What the browser sends is a proposal. Each line is checked against the job and work center as they are now:
    // the job must still be waiting to start, and the work center must be online, of the right kind and at the job's branch.
    const [existingJobs, existingWcs] = await Promise.all([
      prisma.job.findMany({ where: { id: { in: ids } }, select: { id: true, status: true, operationType: true, orderId: true, workCenterId: true, order: { select: { locationId: true } }, workCenter: { select: { locationId: true } }, createdBy: { select: { homeLocationId: true } } } }),
      prisma.workCenter.findMany({ where: { id: { in: wcIds } }, select: { id: true, isActive: true, type: true, locationId: true } }),
    ]);
    const jobById = new Map(existingJobs.map(j => [j.id, j]));
    const wcById = new Map(existingWcs.map(w => [w.id, w]));
    const date = (v) => (v ? new Date(v) : undefined);

    const accepted = [];
    const skipped = [];
    const seen = new Set();
    for (const j of optimizedJobs) {
      const job = j?.id ? jobById.get(j.id) : null;
      if (job && seen.has(job.id)) { skipped.push({ id: job.id, reason: 'Listed twice' }); continue; }
      // A job already on a work center stays at that branch; one that is not takes its order's branch.
      const branchId = job ? (job.order?.locationId || job.workCenter?.locationId || (!job.orderId && !job.workCenterId ? job.createdBy?.homeLocationId : null) || null) : null;
      const why = applyError(job ? { ...job, branchId } : null, j?.workCenterId ? wcById.get(j.workCenterId) : null, j || {});
      if (why) { skipped.push({ id: j?.id ?? null, reason: why }); continue; }
      seen.add(job.id);
      accepted.push(j);
    }
    // Saved only if the job is still waiting to start at that moment.
    let applied = 0;
    if (accepted.length) {
      const results = await prisma.$transaction(accepted.map((j) => prisma.job.updateMany({
        where: { id: j.id, status: { in: ['ORDERED', 'SCHEDULED'] } },
        data: { ...(j.workCenterId ? { workCenterId: j.workCenterId } : {}), scheduledStart: date(j.scheduledStart), scheduledEnd: date(j.scheduledEnd) },
      })));
      results.forEach((r, i) => { if (r.count) applied += 1; else skipped.push({ id: accepted[i].id, reason: 'Job was started or changed a moment ago' }); });
    }
    const updates = { length: applied };

    res.json({
      success: true,
      message: `Applied schedule to ${updates.length} jobs`,
      appliedCount: updates.length,
      skipped,
    });
  } catch (error) {
    console.error('Error applying optimization:', error);
    res.status(500).json({ error: 'Failed to apply optimization' });
  }
});

// GET /v1/ai/work-order-optimize/analysis
router.get('/analysis', async (req, res) => {
  try {
    const { locationId, division } = req.query;
    const { jobs, workCenters } = await loadPlanningData(null, locationId);
    
    const result = optimizeSchedule(jobs, workCenters, {
      locationId,
      division,
    });
    
    res.json({
      metrics: result.metrics,
      bottlenecks: result.bottlenecks,
      recommendations: result.recommendations,
      notes: result.notes,
      workCenterUtilization: result.workCenterSchedules.map(s => ({
        workCenterId: s.workCenter.id,
        workCenterName: s.workCenter.name,
        workCenterType: s.workCenter.workCenterType,
        utilizationPercent: s.utilizationPercent == null ? null : Math.round(s.utilizationPercent),
        untimedJobs: s.untimedJobs,
        jobCount: s.jobs.length,
        totalMinutes: s.totalMinutes,
      })),
    });
  } catch (error) {
    console.error('Error generating analysis:', error);
    res.status(500).json({ error: 'Failed to generate analysis' });
  }
});

// POST /v1/ai/work-order-optimize/simulate
router.post('/simulate', async (req, res) => {
  try {
    const { scenario, modifications } = req.body || {};
    const { jobs, workCenters } = await loadPlanningData();
    
    // Simulate what-if scenarios on copies; nothing is saved
    const modifiedJobs = jobs.map(j => ({ ...j }));
    const modifiedWorkCenters = [...workCenters];
    
    if (modifications?.addWorkCenter && typeof modifications.addWorkCenter === 'object') {
      const add = modifications.addWorkCenter;
      modifiedWorkCenters.push({
        id: `what-if-${modifiedWorkCenters.length}`, name: String(add.name || 'Added work center').slice(0, 80), locationId: add.locationId || null,
        division: add.division || null, workCenterType: upper(add.workCenterType), minutesPerDay: minutesPerDay(add), isOnline: true,
      });
    }
    
    if (modifications?.changePriorities) {
      modifications.changePriorities.forEach(change => {
        const job = modifiedJobs.find(j => j.id === change.jobId);
        if (job) job.priority = change.newPriority;
      });
    }
    
    const baseline = optimizeSchedule(jobs, workCenters);
    const simulated = optimizeSchedule(modifiedJobs, modifiedWorkCenters);
    
    res.json({
      scenario: scenario || 'What-If Analysis',
      baseline: {
        metrics: baseline.metrics,
        bottleneckCount: baseline.bottlenecks.length,
      },
      simulated: {
        metrics: simulated.metrics,
        bottleneckCount: simulated.bottlenecks.length,
      },
      improvements: {
        utilizationChange: simulated.metrics.overallUtilization - baseline.metrics.overallUtilization,
        bottlenecksReduced: baseline.bottlenecks.length - simulated.bottlenecks.length,
        moreJobsAssigned: simulated.metrics.assignedJobs - baseline.metrics.assignedJobs,
      },
    });
  } catch (error) {
    console.error('Error simulating scenario:', error);
    res.status(500).json({ error: 'Failed to simulate scenario' });
  }
});

export default router;
