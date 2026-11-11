/**
 * Work Order Optimization AI Routes
 * Intelligent job sequencing, assignment, and scheduling optimization
 */

import { Router } from 'express';
import prisma from '../lib/db.js';

const router = Router();

// ============================================
// DATA (Job and WorkCenter tables)
// ============================================

const PRIORITY_INT_TO_STRING = { 1: 'LOW', 2: 'LOW', 3: 'NORMAL', 4: 'RUSH', 5: 'HOT' };
const DEFAULT_SHIFT_MINUTES = 480;
const DEFAULT_JOB_MINUTES = 60;
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
    shiftCapacityMinutesPerDay: Number(capacity.shiftCapacityMinutesPerDay) || DEFAULT_SHIFT_MINUTES,
    isOnline: wc.isActive,
  };
}

function toJob(job) {
  const start = job.scheduledStart ? job.scheduledStart.getTime() : null;
  const end = job.scheduledEnd ? job.scheduledEnd.getTime() : null;
  const minutes = start && end && end > start ? Math.round((end - start) / 60000) : DEFAULT_JOB_MINUTES;
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
    locationId: job.workCenter?.locationId || null,
    workCenterType: upper(job.operationType) || upper(job.workCenter?.type),
    workCenterId: job.workCenterId,
    status: job.status,
    scheduledStart: job.scheduledStart ? job.scheduledStart.toISOString() : null,
    scheduledEnd: job.scheduledEnd ? job.scheduledEnd.toISOString() : null,
    estimatedMinutes: minutes,
    priority: PRIORITY_INT_TO_STRING[job.priority] || 'NORMAL',
    dueDate: due ? due.toISOString() : null,
    recipeId: job.recipeId,
    recipeVersion: job.recipeVersion,
    hasCustomRouting: job.hasCustomRouting,
  };
}

/** Open jobs (scheduled or ordered) and all work centers, in optimizer shape. */
async function loadPlanningData(jobIds) {
  const where = { status: { in: ['SCHEDULED', 'ORDERED'] } };
  if (Array.isArray(jobIds) && jobIds.length > 0) where.id = { in: jobIds };
  const [jobs, workCenters] = await Promise.all([
    prisma.job.findMany({
      where,
      take: MAX_JOBS,
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      include: {
        order: { select: { promisedDate: true, requiredDate: true } },
        workCenter: { select: { type: true, locationId: true, capacity: true } },
      },
    }),
    prisma.workCenter.findMany({ orderBy: { name: 'asc' } }),
  ]);
  const wcs = workCenters.map(toWorkCenter);

  // A job not yet on a work center takes the division and location that every
  // work center of its type shares, so division/location filters still apply.
  const byType = {};
  for (const wc of wcs) (byType[wc.workCenterType] ||= []).push(wc);
  const shared = (list, key) => {
    const values = new Set((list || []).map(w => w[key]));
    return values.size === 1 ? [...values][0] : null;
  };
  const planned = jobs.map(toJob).map(j => ({
    ...j,
    division: j.division ?? shared(byType[j.workCenterType], 'division'),
    locationId: j.locationId ?? shared(byType[j.workCenterType], 'locationId'),
  }));
  return { jobs: planned, workCenters: wcs };
}

// ============================================
// OPTIMIZATION LOGIC (SIMULATED AI)
// ============================================

function calculatePriorityScore(job) {
  const priorityWeights = {
    'HOT': 100,
    'RUSH': 75,
    'VIP': 85,
    'URGENT': 90,
    'NORMAL': 50,
    'LOW': 25,
  };
  
  const now = Date.now();
  const hoursUntilDue = job.dueDate
    ? (new Date(job.dueDate).getTime() - now) / (1000 * 60 * 60)
    : Infinity; // no due date: lowest urgency
  
  // Urgency score (higher = more urgent)
  const urgencyScore = hoursUntilDue < 8 ? 100 : 
                       hoursUntilDue < 24 ? 75 :
                       hoursUntilDue < 48 ? 50 : 25;
  
  const priorityWeight = priorityWeights[job.priority] || 50;
  
  return (priorityWeight * 0.6) + (urgencyScore * 0.4);
}

function optimizeSchedule(jobs, workCenters, options = {}) {
  const { locationId, division, horizonHours = 72 } = options;
  
  // Filter jobs
  let filteredJobs = jobs.filter(j => j.status === 'SCHEDULED' || j.status === 'ORDERED');
  if (locationId) filteredJobs = filteredJobs.filter(j => !j.locationId || j.locationId === locationId);
  if (division) filteredJobs = filteredJobs.filter(j => !j.division || j.division === division);
  
  // Filter work centers
  let filteredWCs = workCenters.filter(wc => wc.isOnline);
  if (locationId) filteredWCs = filteredWCs.filter(wc => wc.locationId === locationId);
  if (division) filteredWCs = filteredWCs.filter(wc => !wc.division || wc.division === division);
  
  // Calculate priority scores
  const scoredJobs = filteredJobs.map(job => ({
    ...job,
    priorityScore: calculatePriorityScore(job),
  }));
  
  // Sort by priority score (descending)
  scoredJobs.sort((a, b) => b.priorityScore - a.priorityScore);
  
  // Assign to work centers using greedy algorithm
  const workCenterSchedules = {};
  filteredWCs.forEach(wc => {
    workCenterSchedules[wc.id] = {
      workCenter: wc,
      jobs: [],
      totalMinutes: 0,
      utilizationPercent: 0,
      nextAvailableTime: new Date(),
    };
  });
  
  const optimizedJobs = [];
  const unassignedJobs = [];
  
  scoredJobs.forEach(job => {
    // Find matching work centers by type
    const matchingWCs = filteredWCs.filter(wc => wc.workCenterType === job.workCenterType);
    
    if (matchingWCs.length === 0) {
      unassignedJobs.push({ ...job, reason: 'No matching work center available' });
      return;
    }
    
    // Find work center with earliest availability
    let bestWC = null;
    let earliestTime = null;
    
    matchingWCs.forEach(wc => {
      const schedule = workCenterSchedules[wc.id];
      if (!earliestTime || schedule.nextAvailableTime < earliestTime) {
        earliestTime = schedule.nextAvailableTime;
        bestWC = wc;
      }
    });
    
    if (bestWC) {
      const schedule = workCenterSchedules[bestWC.id];
      const startTime = new Date(schedule.nextAvailableTime);
      const endTime = new Date(startTime.getTime() + job.estimatedMinutes * 60 * 1000);
      
      const optimizedJob = {
        ...job,
        workCenterId: bestWC.id,
        workCenterName: bestWC.name,
        scheduledStart: startTime.toISOString(),
        scheduledEnd: endTime.toISOString(),
        status: 'SCHEDULED',
      };
      
      schedule.jobs.push(optimizedJob);
      schedule.totalMinutes += job.estimatedMinutes;
      schedule.nextAvailableTime = endTime;
      schedule.utilizationPercent = (schedule.totalMinutes / bestWC.shiftCapacityMinutesPerDay) * 100;
      
      optimizedJobs.push(optimizedJob);
    }
  });
  
  // Identify bottlenecks
  const bottlenecks = Object.values(workCenterSchedules)
    .filter(s => s.utilizationPercent > 90)
    .map(s => ({
      workCenterId: s.workCenter.id,
      workCenterName: s.workCenter.name,
      workCenterType: s.workCenter.workCenterType,
      utilizationPercent: s.utilizationPercent,
      jobCount: s.jobs.length,
      severity: s.utilizationPercent > 100 ? 'CRITICAL' : 'WARNING',
    }));
  
  // Calculate metrics
  const totalCapacityMinutes = filteredWCs.reduce((sum, wc) => sum + wc.shiftCapacityMinutesPerDay, 0);
  const totalScheduledMinutes = optimizedJobs.reduce((sum, job) => sum + job.estimatedMinutes, 0);
  const overallUtilization = totalCapacityMinutes > 0 ? (totalScheduledMinutes / totalCapacityMinutes) * 100 : 0;
  
  const jobsAtRisk = optimizedJobs.filter(job => {
    if (!job.dueDate) return false;
    const dueDate = new Date(job.dueDate);
    const scheduledEnd = new Date(job.scheduledEnd);
    return scheduledEnd > dueDate;
  });
  
  return {
    optimizedJobs,
    unassignedJobs,
    workCenterSchedules: Object.values(workCenterSchedules),
    bottlenecks,
    metrics: {
      totalJobs: filteredJobs.length,
      assignedJobs: optimizedJobs.length,
      unassignedJobs: unassignedJobs.length,
      overallUtilization: Math.round(overallUtilization),
      jobsAtRisk: jobsAtRisk.length,
      bottleneckCount: bottlenecks.length,
    },
    recommendations: generateRecommendations(bottlenecks, jobsAtRisk, unassignedJobs),
  };
}

function generateRecommendations(bottlenecks, jobsAtRisk, unassignedJobs) {
  const recommendations = [];
  
  if (bottlenecks.length > 0) {
    bottlenecks.forEach(bn => {
      recommendations.push({
        type: 'BOTTLENECK',
        severity: bn.severity,
        title: `${bn.workCenterName} is overloaded`,
        description: `Utilization at ${Math.round(bn.utilizationPercent)}%. Consider reassigning jobs or adding capacity.`,
        action: 'REDISTRIBUTE',
        targetWorkCenterId: bn.workCenterId,
      });
    });
  }
  
  if (jobsAtRisk.length > 0) {
    recommendations.push({
      type: 'SLA_RISK',
      severity: 'CRITICAL',
      title: `${jobsAtRisk.length} jobs may miss due dates`,
      description: 'Scheduled completion exceeds promised delivery times. Consider expediting or renegotiating.',
      action: 'EXPEDITE',
      affectedJobs: jobsAtRisk.map(j => j.id),
    });
  }
  
  if (unassignedJobs.length > 0) {
    recommendations.push({
      type: 'CAPACITY',
      severity: 'WARNING',
      title: `${unassignedJobs.length} jobs cannot be assigned`,
      description: 'No available work centers match job requirements. Check equipment status or add capacity.',
      action: 'ADD_CAPACITY',
    });
  }
  
  return recommendations;
}

// ============================================
// ROUTES
// ============================================

// POST /v1/ai/work-order-optimize/preview
router.post('/preview', async (req, res) => {
  try {
    const { locationId, division, horizonHours, jobIds } = req.body || {};
    const { jobs, workCenters } = await loadPlanningData(jobIds);

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

    const ids = optimizedJobs.map(j => j?.id).filter(Boolean);
    const wcIds = [...new Set(optimizedJobs.map(j => j?.workCenterId).filter(Boolean))];
    const [existingJobs, existingWcs] = await Promise.all([
      prisma.job.findMany({ where: { id: { in: ids } }, select: { id: true } }),
      prisma.workCenter.findMany({ where: { id: { in: wcIds } }, select: { id: true } }),
    ]);
    const jobSet = new Set(existingJobs.map(j => j.id));
    const wcSet = new Set(existingWcs.map(w => w.id));
    const validDate = (v) => (v && !Number.isNaN(new Date(v).getTime()) ? new Date(v) : undefined);

    const updates = [];
    const skipped = [];
    for (const j of optimizedJobs) {
      if (!j?.id || !jobSet.has(j.id)) { skipped.push({ id: j?.id ?? null, reason: 'Job not found' }); continue; }
      if (j.workCenterId && !wcSet.has(j.workCenterId)) { skipped.push({ id: j.id, reason: 'Work center not found' }); continue; }
      updates.push(prisma.job.update({
        where: { id: j.id },
        data: {
          workCenterId: j.workCenterId || null,
          scheduledStart: validDate(j.scheduledStart),
          scheduledEnd: validDate(j.scheduledEnd),
        },
      }));
    }
    if (updates.length) await prisma.$transaction(updates);
    
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
    const { jobs, workCenters } = await loadPlanningData();
    
    const result = optimizeSchedule(jobs, workCenters, {
      locationId,
      division,
    });
    
    res.json({
      metrics: result.metrics,
      bottlenecks: result.bottlenecks,
      recommendations: result.recommendations,
      workCenterUtilization: result.workCenterSchedules.map(s => ({
        workCenterId: s.workCenter.id,
        workCenterName: s.workCenter.name,
        workCenterType: s.workCenter.workCenterType,
        utilizationPercent: Math.round(s.utilizationPercent),
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
    
    if (modifications?.addWorkCenter) {
      modifiedWorkCenters.push(modifications.addWorkCenter);
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
