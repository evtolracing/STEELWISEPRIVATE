/**
 * Work Order Optimization AI Routes
 * Intelligent job sequencing, assignment, and scheduling optimization
 */

import { Router } from 'express';

const router = Router();

// ============================================
// IN-MEMORY SAMPLE DATA
// ============================================

// Sample jobs for optimization
let sampleJobs = [
  {
    id: 'JOB-001',
    jobNumber: 'J-2026-001',
    orderId: 'ORD-001',
    orderLineId: 'OL-001',
    materialCode: 'AL-6061-100',
    commodity: 'ALUMINUM',
    form: 'PLATE',
    grade: '6061-T6',
    thickness: 1.0,
    division: 'METALS',
    locationId: 'LOC-JACKSON',
    workCenterType: 'SAW',
    workCenterId: null,
    status: 'SCHEDULED',
    scheduledStart: null,
    scheduledEnd: null,
    estimatedMinutes: 25,
    priority: 'HOT',
    dueDate: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    recipeId: 'BOM-001',
    recipeVersion: 1,
    hasCustomRouting: false,
  },
  {
    id: 'JOB-002',
    jobNumber: 'J-2026-002',
    orderId: 'ORD-002',
    orderLineId: 'OL-002',
    materialCode: 'HR-0125-48',
    commodity: 'STEEL',
    form: 'SHEET',
    grade: 'A36',
    thickness: 0.125,
    division: 'METALS',
    locationId: 'LOC-JACKSON',
    workCenterType: 'SHEAR',
    workCenterId: null,
    status: 'SCHEDULED',
    scheduledStart: null,
    scheduledEnd: null,
    estimatedMinutes: 18,
    priority: 'NORMAL',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    recipeId: 'BOM-002',
    recipeVersion: 1,
    hasCustomRouting: false,
  },
  {
    id: 'JOB-003',
    jobNumber: 'J-2026-003',
    orderId: 'ORD-003',
    orderLineId: 'OL-003',
    materialCode: 'ACRY-CLR-0250',
    commodity: 'PLASTICS',
    form: 'SHEET',
    grade: 'ACRYLIC',
    thickness: 0.250,
    division: 'PLASTICS',
    locationId: 'LOC-JACKSON',
    workCenterType: 'ROUTER',
    workCenterId: null,
    status: 'SCHEDULED',
    scheduledStart: null,
    scheduledEnd: null,
    estimatedMinutes: 35,
    priority: 'RUSH',
    dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    recipeId: 'BOM-004',
    recipeVersion: 1,
    hasCustomRouting: false,
  },
];

let sampleWorkCenters = [
  {
    id: 'WC-SAW-01',
    name: 'Saw #1',
    locationId: 'LOC-JACKSON',
    division: 'METALS',
    workCenterType: 'SAW',
    shiftCapacityMinutesPerDay: 480,
    isOnline: true,
  },
  {
    id: 'WC-SAW-02',
    name: 'Saw #2',
    locationId: 'LOC-JACKSON',
    division: 'METALS',
    workCenterType: 'SAW',
    shiftCapacityMinutesPerDay: 480,
    isOnline: true,
  },
  {
    id: 'WC-SHEAR-01',
    name: 'Shear #1',
    locationId: 'LOC-JACKSON',
    division: 'METALS',
    workCenterType: 'SHEAR',
    shiftCapacityMinutesPerDay: 480,
    isOnline: true,
  },
  {
    id: 'WC-ROUTER-01',
    name: 'Router #1',
    locationId: 'LOC-JACKSON',
    division: 'PLASTICS',
    workCenterType: 'ROUTER',
    shiftCapacityMinutesPerDay: 480,
    isOnline: true,
  },
];

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
  const dueDate = new Date(job.dueDate).getTime();
  const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);
  
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
  if (locationId) filteredJobs = filteredJobs.filter(j => j.locationId === locationId);
  if (division) filteredJobs = filteredJobs.filter(j => j.division === division);
  
  // Filter work centers
  let filteredWCs = workCenters.filter(wc => wc.isOnline);
  if (locationId) filteredWCs = filteredWCs.filter(wc => wc.locationId === locationId);
  if (division) filteredWCs = filteredWCs.filter(wc => wc.division === division);
  
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
  const overallUtilization = (totalScheduledMinutes / totalCapacityMinutes) * 100;
  
  const jobsAtRisk = optimizedJobs.filter(job => {
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
router.post('/preview', (req, res) => {
  try {
    const { locationId, division, horizonHours, jobIds } = req.body;
    
    // Use provided jobs or sample data
    let jobsToOptimize = sampleJobs;
    if (jobIds && jobIds.length > 0) {
      jobsToOptimize = sampleJobs.filter(j => jobIds.includes(j.id));
    }
    
    const result = optimizeSchedule(jobsToOptimize, sampleWorkCenters, {
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
router.post('/apply', (req, res) => {
  try {
    const { optimizedJobs } = req.body;
    
    if (!optimizedJobs || !Array.isArray(optimizedJobs)) {
      return res.status(400).json({ error: 'optimizedJobs array is required' });
    }
    
    // In a real system, this would update the database
    // For now, just acknowledge the apply
    
    res.json({
      success: true,
      message: `Applied schedule to ${optimizedJobs.length} jobs`,
      appliedCount: optimizedJobs.length,
    });
  } catch (error) {
    console.error('Error applying optimization:', error);
    res.status(500).json({ error: 'Failed to apply optimization' });
  }
});

// GET /v1/ai/work-order-optimize/analysis
router.get('/analysis', (req, res) => {
  try {
    const { locationId, division } = req.query;
    
    const result = optimizeSchedule(sampleJobs, sampleWorkCenters, {
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
router.post('/simulate', (req, res) => {
  try {
    const { scenario, modifications } = req.body;
    
    // Simulate what-if scenarios
    let modifiedJobs = [...sampleJobs];
    let modifiedWorkCenters = [...sampleWorkCenters];
    
    if (modifications?.addWorkCenter) {
      modifiedWorkCenters.push(modifications.addWorkCenter);
    }
    
    if (modifications?.changePriorities) {
      modifications.changePriorities.forEach(change => {
        const job = modifiedJobs.find(j => j.id === change.jobId);
        if (job) job.priority = change.newPriority;
      });
    }
    
    const baseline = optimizeSchedule(sampleJobs, sampleWorkCenters);
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
