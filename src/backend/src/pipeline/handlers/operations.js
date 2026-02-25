/**
 * OPERATIONS DOMAIN HANDLER
 * ==========================
 * Handles: Order Planning, Inventory, Allocation, Job Creation, BOM Matching, Dispatch
 */

import { v4 as uuidv4 } from 'uuid';
import prisma from '../../lib/db.js';
import { PIPELINE_STAGES, PRIORITY } from '../orchestrator.js';
import { planOrder, findOrderById, findJobById, listJobs } from '../../routes/orderHubStore.js';

// ============================================================================
// INVENTORY LOOKUP DATA (In-memory for now)
// ============================================================================

const LOCATIONS = [
  { id: 'LOC-001', name: 'Dallas Main', division: 'METALS', capacity: 1000 },
  { id: 'LOC-002', name: 'Houston Branch', division: 'METALS', capacity: 750 },
  { id: 'LOC-003', name: 'Dallas Plastics', division: 'PLASTICS', capacity: 500 },
];

const WORK_CENTERS = [
  { id: 'WC-SAW-001', type: 'SAW', name: 'Band Saw 1', locationId: 'LOC-001', status: 'AVAILABLE', capacityPerDay: 50 },
  { id: 'WC-SAW-002', type: 'SAW', name: 'Band Saw 2', locationId: 'LOC-001', status: 'AVAILABLE', capacityPerDay: 50 },
  { id: 'WC-SHEAR-001', type: 'SHEAR', name: 'Shear 1', locationId: 'LOC-001', status: 'AVAILABLE', capacityPerDay: 100 },
  { id: 'WC-ROUTER-001', type: 'ROUTER', name: 'CNC Router 1', locationId: 'LOC-003', status: 'AVAILABLE', capacityPerDay: 30 },
  { id: 'WC-FINISH-001', type: 'FINISHING', name: 'Finishing Station', locationId: 'LOC-001', status: 'AVAILABLE', capacityPerDay: 80 },
  { id: 'WC-PACK-001', type: 'PACKOUT', name: 'Pack Station 1', locationId: 'LOC-001', status: 'AVAILABLE', capacityPerDay: 100 },
];

const OPERATORS = [
  { id: 'OP-001', name: 'John Smith', shift: 'DAY', workCenterTypes: ['SAW', 'SHEAR'], status: 'AVAILABLE' },
  { id: 'OP-002', name: 'Mike Johnson', shift: 'DAY', workCenterTypes: ['SAW'], status: 'AVAILABLE' },
  { id: 'OP-003', name: 'Sarah Davis', shift: 'DAY', workCenterTypes: ['ROUTER', 'FINISHING'], status: 'AVAILABLE' },
  { id: 'OP-004', name: 'Tom Wilson', shift: 'DAY', workCenterTypes: ['PACKOUT'], status: 'AVAILABLE' },
  { id: 'OP-005', name: 'Lisa Brown', shift: 'SWING', workCenterTypes: ['SAW', 'SHEAR', 'PACKOUT'], status: 'AVAILABLE' },
];

// Simulated inventory
const INVENTORY = [
  { id: 'INV-001', materialCode: 'AL-6061-100', commodity: 'ALUMINUM', form: 'PLATE', grade: '6061-T6', thickness: 1.0, width: 48, length: 96, qtyOnHand: 50, locationId: 'LOC-001' },
  { id: 'INV-002', materialCode: 'HR-0125-48', commodity: 'STEEL', form: 'SHEET', grade: 'A36', thickness: 0.125, width: 48, length: 120, qtyOnHand: 200, locationId: 'LOC-001' },
  { id: 'INV-003', materialCode: 'SS-304-0048', commodity: 'STAINLESS', form: 'SHEET', grade: '304', thickness: 0.048, width: 48, length: 96, qtyOnHand: 75, locationId: 'LOC-001' },
  { id: 'INV-004', materialCode: 'ACRY-CLR-0250', commodity: 'PLASTICS', form: 'SHEET', grade: 'ACRYLIC', thickness: 0.25, width: 48, length: 96, qtyOnHand: 100, locationId: 'LOC-003' },
];

// ============================================================================
// ORDER PLANNING HANDLER
// ============================================================================

export async function handleOrderPlanning(ctx, payload) {
  if (!ctx.order) {
    ctx.addError('No order for planning');
    return;
  }
  
  const { priorityOverride, requestedShipDate } = payload;
  
  // Set priority
  if (priorityOverride) {
    ctx.priority = priorityOverride;
  }
  
  // Calculate lead times
  const totalOperations = ctx.order.lines.reduce((sum, line) => {
    return sum + estimateOperationsForLine(line);
  }, 0);
  
  const estimatedDays = Math.ceil(totalOperations / 10) + 2; // Base 2 days + operations
  const promiseDate = new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000);
  
  ctx.order.promiseDate = promiseDate.toISOString();
  ctx.order.requestedShipDate = requestedShipDate || promiseDate.toISOString();
  ctx.order.status = 'PLANNING';
  ctx.metrics.estimatedLeadTime = estimatedDays;
  
  // Determine division allocation
  const divisions = new Set();
  ctx.order.lines.forEach(line => {
    const division = determineDivision(line);
    line.division = division;
    divisions.add(division);
  });
  
  ctx.addAiRecommendation({
    type: 'ORDER_PLANNED',
    message: `Order planning complete - ${divisions.size} division(s) involved`,
    confidence: 0.95,
    details: {
      divisions: Array.from(divisions),
      estimatedLeadTime: `${estimatedDays} days`,
      promiseDate: ctx.order.promiseDate,
      totalLines: ctx.order.lines.length,
    },
  });
}

// ============================================================================
// INVENTORY CHECK HANDLER
// ============================================================================

export async function handleInventoryCheck(ctx, payload) {
  if (!ctx.order) {
    ctx.addError('No order for inventory check');
    return;
  }
  
  const stockResults = [];
  const shortages = [];
  const substitutions = [];
  
  for (const line of ctx.order.lines) {
    const stockItem = findMatchingStock(line);
    
    if (stockItem && stockItem.qtyOnHand >= line.quantity) {
      stockResults.push({
        lineId: line.id,
        status: 'IN_STOCK',
        stockItem,
        quantityAvailable: stockItem.qtyOnHand,
        location: stockItem.locationId,
      });
    } else if (stockItem && stockItem.qtyOnHand < line.quantity) {
      // Partial stock
      shortages.push({
        lineId: line.id,
        required: line.quantity,
        available: stockItem.qtyOnHand,
        shortage: line.quantity - stockItem.qtyOnHand,
      });
      
      // Check for substitutions
      const subs = findSubstitutions(line);
      if (subs.length > 0) {
        substitutions.push({
          lineId: line.id,
          originalMaterial: line.materialCode,
          alternatives: subs,
        });
      }
    } else {
      // No stock at all
      shortages.push({
        lineId: line.id,
        required: line.quantity,
        available: 0,
        shortage: line.quantity,
      });
      
      // Find substitutions
      const subs = findSubstitutions(line);
      if (subs.length > 0) {
        substitutions.push({
          lineId: line.id,
          originalMaterial: line.materialCode,
          alternatives: subs,
        });
      }
    }
  }
  
  ctx.inventoryAllocations = stockResults;
  ctx.substitutions = substitutions;
  
  if (shortages.length > 0) {
    ctx.stockWarnings = shortages;
    ctx.addWarning(`Stock shortage on ${shortages.length} line(s)`);
    
    // Provide AI recommendations for shortages
    shortages.forEach(s => {
      ctx.addAiRecommendation({
        type: 'STOCK_SHORTAGE',
        message: `Line ${s.lineId}: Need ${s.required}, have ${s.available}`,
        confidence: 1.0,
        details: {
          alternatives: [
            'Check alternate locations',
            'Contact suppliers for rush order',
            'Consider substitution',
            'Split shipment',
          ],
        },
      });
    });
    
    if (substitutions.length === 0) {
      ctx.requireHumanApproval('Stock shortage with no substitutions available');
    }
  }
  
  ctx.addAiRecommendation({
    type: 'INVENTORY_CHECK_COMPLETE',
    message: `Inventory checked: ${stockResults.length} in stock, ${shortages.length} shortages`,
    confidence: 0.9,
  });
}

// ============================================================================
// ALLOCATION HANDLER
// ============================================================================

export async function handleOrderAllocation(ctx, payload) {
  if (!ctx.order) {
    ctx.addError('No order for allocation');
    return;
  }
  
  const { acceptSubstitutions, splitShipment } = payload;
  
  // Apply substitutions if accepted
  if (acceptSubstitutions && ctx.substitutions.length > 0) {
    ctx.substitutions.forEach(sub => {
      const line = ctx.order.lines.find(l => l.id === sub.lineId);
      if (line && sub.alternatives.length > 0) {
        const bestAlt = sub.alternatives[0];
        line.materialCode = bestAlt.materialCode;
        line.notes = `Substituted from ${sub.originalMaterial}`;
      }
    });
  }
  
  // Determine optimal location for each line
  ctx.order.lines.forEach(line => {
    const allocation = ctx.inventoryAllocations.find(a => a.lineId === line.id);
    if (allocation) {
      line.locationId = allocation.location;
    } else {
      line.locationId = ctx.order.locationId || 'LOC-001';
    }
  });
  
  ctx.order.status = 'ALLOCATED';
  
  ctx.addAiRecommendation({
    type: 'ALLOCATION_COMPLETE',
    message: 'Order allocated to locations',
    confidence: 0.95,
    details: {
      substitutionsApplied: acceptSubstitutions && ctx.substitutions.length > 0,
      splitShipment: splitShipment || false,
    },
  });
}

// ============================================================================
// ORDER CONFIRMATION HANDLER
// ============================================================================

export async function handleOrderConfirmation(ctx, payload) {
  if (!ctx.order) {
    ctx.addError('No order for confirmation');
    return;
  }
  
  ctx.order.status = 'CONFIRMED';
  
  ctx.addAiRecommendation({
    type: 'ORDER_CONFIRMED',
    message: 'Order confirmed and ready for job creation',
    confidence: 1.0,
  });
}

// ============================================================================
// JOB CREATION HANDLER
// ============================================================================

export async function handleJobCreation(ctx, payload) {
  if (!ctx.order) {
    ctx.addError('No order for job creation');
    return;
  }
  
  const result = planOrder(ctx.orderId);
  
  ctx.jobs = result.jobs;
  ctx.jobIds = result.jobs.map(j => j.id);
  ctx.order = result.order;
  
  ctx.addAiRecommendation({
    type: 'JOBS_CREATED',
    message: `Created ${result.jobs.length} job(s)`,
    confidence: 1.0,
    details: {
      jobIds: ctx.jobIds,
      divisions: [...new Set(result.jobs.map(j => j.division))],
    },
  });
}

// ============================================================================
// BOM MATCHING HANDLER
// ============================================================================

export async function handleBomMatching(ctx, payload) {
  if (ctx.jobs.length === 0) {
    ctx.addError('No jobs for BOM matching');
    return;
  }
  
  for (const job of ctx.jobs) {
    // Find matching BOM recipe
    const recipe = await findMatchingRecipe(job);
    
    if (recipe) {
      job.recipeId = recipe.id;
      job.recipeName = recipe.name;
      job.operations = recipe.operations.map(op => ({
        id: uuidv4(),
        jobId: job.id,
        sequence: op.sequence,
        name: op.name,
        workCenterType: op.workCenterType,
        estimatedMachineMinutes: op.estimatedMachineMinutes,
        estimatedLaborMinutes: op.estimatedLaborMinutes,
        setupMinutes: op.setupMinutes,
        status: 'PENDING',
      }));
      
      ctx.bomRecipes.push({
        jobId: job.id,
        recipeId: recipe.id,
        recipeName: recipe.name,
        operationCount: recipe.operations.length,
      });
    } else {
      // No matching recipe - flag for manual routing
      job.operations = [{
        id: uuidv4(),
        jobId: job.id,
        sequence: 1,
        name: 'CUSTOM PROCESSING',
        workCenterType: 'MANUAL',
        estimatedMachineMinutes: 30,
        estimatedLaborMinutes: 30,
        setupMinutes: 10,
        status: 'PENDING',
      }];
      
      ctx.addWarning(`No BOM recipe found for job ${job.id} - manual routing required`);
    }
  }
  
  ctx.addAiRecommendation({
    type: 'BOM_MATCHING_COMPLETE',
    message: `BOM matched for ${ctx.bomRecipes.length}/${ctx.jobs.length} jobs`,
    confidence: ctx.bomRecipes.length / ctx.jobs.length,
    details: {
      matchedRecipes: ctx.bomRecipes.map(r => r.recipeName),
    },
  });
}

// ============================================================================
// JOB SCHEDULING HANDLER
// ============================================================================

export async function handleJobScheduling(ctx, payload) {
  if (ctx.jobs.length === 0) {
    ctx.addError('No jobs for scheduling');
    return;
  }
  
  const { schedulingStrategy } = payload;
  const strategy = schedulingStrategy || 'FIFO';
  
  // Sort jobs by priority
  const sortedJobs = [...ctx.jobs].sort((a, b) => {
    if (ctx.priority.level !== PRIORITY.STANDARD.level) {
      return ctx.priority.level - PRIORITY.STANDARD.level;
    }
    return 0;
  });
  
  let scheduledDate = new Date();
  
  for (const job of sortedJobs) {
    // Calculate total time for all operations
    const totalMinutes = job.operations?.reduce((sum, op) => {
      return sum + op.estimatedMachineMinutes + op.setupMinutes;
    }, 0) || 60;
    
    // Find available work centers
    const assignments = [];
    for (const op of job.operations || []) {
      const workCenter = findAvailableWorkCenter(op.workCenterType, job.locationId);
      if (workCenter) {
        assignments.push({
          operationId: op.id,
          workCenterId: workCenter.id,
          workCenterName: workCenter.name,
        });
      }
    }
    
    job.scheduledDate = scheduledDate.toISOString();
    job.estimatedCompletionMinutes = totalMinutes;
    job.workCenterAssignments = assignments;
    job.status = 'SCHEDULED';
    
    ctx.workCenterAssignments.push(...assignments);
    
    // Offset next job by estimated time
    scheduledDate = new Date(scheduledDate.getTime() + totalMinutes * 60 * 1000);
  }
  
  ctx.addAiRecommendation({
    type: 'JOBS_SCHEDULED',
    message: `Scheduled ${sortedJobs.length} jobs using ${strategy} strategy`,
    confidence: 0.9,
    details: {
      strategy,
      totalWorkCenterAssignments: ctx.workCenterAssignments.length,
      estimatedCompletion: scheduledDate.toISOString(),
    },
  });
}

// ============================================================================
// JOB DISPATCH HANDLER
// ============================================================================

export async function handleJobDispatch(ctx, payload) {
  if (ctx.jobs.length === 0) {
    ctx.addError('No jobs for dispatch');
    return;
  }
  
  for (const job of ctx.jobs) {
    // Assign operators to operations
    for (const op of job.operations || []) {
      const operator = findAvailableOperator(op.workCenterType);
      if (operator) {
        op.operatorId = operator.id;
        op.operatorName = operator.name;
        op.status = 'DISPATCHED';
        
        ctx.operatorAssignments.push({
          operationId: op.id,
          operatorId: operator.id,
          operatorName: operator.name,
          workCenterType: op.workCenterType,
        });
      }
    }
    
    job.status = 'DISPATCHED';
    job.dispatchedAt = new Date().toISOString();
  }
  
  ctx.addAiRecommendation({
    type: 'JOBS_DISPATCHED',
    message: `Dispatched ${ctx.jobs.length} jobs to operators`,
    confidence: 0.95,
    details: {
      operatorAssignments: ctx.operatorAssignments.length,
      operators: [...new Set(ctx.operatorAssignments.map(a => a.operatorName))],
    },
  });
}

// ============================================================================
// JOB IN PROGRESS HANDLER
// ============================================================================

export async function handleJobInProgress(ctx, payload) {
  const { jobId, operationId, action, rfidScan, operatorId } = payload;
  
  const job = ctx.jobs.find(j => j.id === jobId) || ctx.jobs[0];
  if (!job) {
    ctx.addError('Job not found');
    return;
  }
  
  // Track RFID scan if provided
  if (rfidScan) {
    job.rfidScans = job.rfidScans || [];
    job.rfidScans.push({
      rfidTag: rfidScan,
      timestamp: new Date().toISOString(),
      action,
    });
  }
  
  // Update operation status
  const operation = job.operations?.find(op => op.id === operationId) || job.operations?.[0];
  if (operation) {
    if (action === 'START') {
      operation.status = 'IN_PROGRESS';
      operation.startedAt = new Date().toISOString();
    } else if (action === 'PAUSE') {
      operation.status = 'PAUSED';
      operation.pausedAt = new Date().toISOString();
    } else if (action === 'RESUME') {
      operation.status = 'IN_PROGRESS';
      operation.resumedAt = new Date().toISOString();
    } else if (action === 'COMPLETE') {
      operation.status = 'COMPLETED';
      operation.completedAt = new Date().toISOString();
    }
  }
  
  job.status = 'IN_PROGRESS';
  
  ctx.addAiRecommendation({
    type: 'JOB_PROGRESS_UPDATE',
    message: `Job ${job.id} operation ${action}`,
    confidence: 1.0,
    details: {
      operation: operation?.name,
      rfidTracked: !!rfidScan,
    },
  });
}

// ============================================================================
// QC CHECK HANDLER
// ============================================================================

export async function handleQcCheck(ctx, payload) {
  const { jobId, disposition, notes, measurements } = payload;
  
  const job = ctx.jobs.find(j => j.id === jobId) || ctx.jobs[0];
  if (!job) {
    ctx.addError('Job not found for QC');
    return;
  }
  
  job.qcCheck = {
    timestamp: new Date().toISOString(),
    disposition: disposition || 'PASS',
    notes,
    measurements: measurements || [],
  };
  
  if (disposition === 'FAIL' || disposition === 'REWORK') {
    job.status = 'QC_FAILED';
    ctx.addWarning(`Job ${job.id} failed QC - requires rework`);
    ctx.requireHumanApproval('QC failure requires disposition decision');
  } else {
    job.status = 'QC_PASSED';
  }
  
  ctx.addAiRecommendation({
    type: 'QC_CHECK_COMPLETE',
    message: `QC ${disposition} for job ${job.id}`,
    confidence: 1.0,
    details: {
      measurements: measurements?.length || 0,
    },
  });
}

// ============================================================================
// JOB COMPLETION HANDLER
// ============================================================================

export async function handleJobCompletion(ctx, payload) {
  for (const job of ctx.jobs) {
    if (job.status !== 'QC_PASSED' && job.qcCheck?.disposition !== 'PASS') {
      continue;
    }
    
    job.status = 'COMPLETED';
    job.completedAt = new Date().toISOString();
    
    // Calculate actual time
    const firstOp = job.operations?.[0];
    const lastOp = job.operations?.[job.operations.length - 1];
    if (firstOp?.startedAt && lastOp?.completedAt) {
      const actualMinutes = (new Date(lastOp.completedAt) - new Date(firstOp.startedAt)) / 60000;
      job.actualMinutes = Math.round(actualMinutes);
    }
  }
  
  const completedCount = ctx.jobs.filter(j => j.status === 'COMPLETED').length;
  
  ctx.addAiRecommendation({
    type: 'JOBS_COMPLETED',
    message: `${completedCount}/${ctx.jobs.length} jobs completed`,
    confidence: 1.0,
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function determineDivision(line) {
  const commodity = line.commodity?.toUpperCase();
  if (['ACRYLIC', 'HDPE', 'UHMW', 'POLYCARBONATE', 'ABS', 'NYLON'].includes(commodity)) {
    return 'PLASTICS';
  }
  if (commodity === 'PLASTICS') return 'PLASTICS';
  return 'METALS';
}

function estimateOperationsForLine(line) {
  // Estimate based on commodity and form
  const baseOps = {
    SHEET: 2,  // Cut + Pack
    PLATE: 3,  // Cut + Deburr + Pack
    BAR: 2,    // Cut + Pack
    TUBE: 2,   // Cut + Pack
  };
  return baseOps[line.form?.toUpperCase()] || 2;
}

function findMatchingStock(line) {
  return INVENTORY.find(inv => {
    if (line.materialCode && inv.materialCode === line.materialCode) return true;
    if (line.commodity && inv.commodity === line.commodity &&
        line.form && inv.form === line.form) return true;
    return false;
  });
}

function findSubstitutions(line) {
  const commodity = line.commodity?.toUpperCase();
  const thickness = parseFloat(line.thickness);
  
  return INVENTORY.filter(inv => {
    if (inv.commodity !== commodity) return false;
    if (inv.form !== line.form) return false;
    // Allow slightly different thickness
    const thicknessDiff = Math.abs(inv.thickness - thickness);
    if (thicknessDiff <= 0.125) return true;
    return false;
  }).map(inv => ({
    materialCode: inv.materialCode,
    thickness: inv.thickness,
    quantityAvailable: inv.qtyOnHand,
    note: `${inv.thickness}" THK available`,
  }));
}

async function findMatchingRecipe(job) {
  try {
    const recipes = await prisma.bomRecipe.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { materialCode: job.materialCode },
          { commodity: job.division === 'PLASTICS' ? 'PLASTICS' : undefined },
        ],
      },
      include: {
        operations: {
          orderBy: { sequence: 'asc' },
        },
      },
    });
    
    return recipes[0] || null;
  } catch (error) {
    console.error('BOM lookup error:', error);
    return null;
  }
}

function findAvailableWorkCenter(workCenterType, locationId) {
  return WORK_CENTERS.find(wc => 
    wc.type === workCenterType && 
    wc.status === 'AVAILABLE' &&
    (!locationId || wc.locationId === locationId)
  );
}

function findAvailableOperator(workCenterType) {
  return OPERATORS.find(op => 
    op.workCenterTypes.includes(workCenterType) &&
    op.status === 'AVAILABLE'
  );
}

export default {
  handleOrderPlanning,
  handleInventoryCheck,
  handleOrderAllocation,
  handleOrderConfirmation,
  handleJobCreation,
  handleBomMatching,
  handleJobScheduling,
  handleJobDispatch,
  handleJobInProgress,
  handleQcCheck,
  handleJobCompletion,
};
