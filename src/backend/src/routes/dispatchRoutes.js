/**
 * Dispatch Engine Routes
 * Handles automatic assignment of job operations to work centers and operators
 */

import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import {
  workCenters,
  operators,
  jobs,
  jobOperations,
  locations,
  compareSkillLevel,
} from '../data/dispatchData.js'

const router = express.Router()

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get count of operations assigned to a work center with active status
 */
function getWorkCenterLoad(workCenterId) {
  return jobOperations.filter(
    (op) =>
      op.assignedWorkCenterId === workCenterId &&
      (op.status === 'SCHEDULED' || op.status === 'IN_PROCESS')
  ).length
}

/**
 * Check if work center can handle the operation
 */
function workCenterCanHandle(wc, operation) {
  // Type must match
  if (wc.workCenterType !== operation.requiredWorkCenterType) return false
  
  // Division must match (or wc capabilities include it)
  if (wc.division !== operation.requiredDivision) {
    if (!wc.capabilities.includes(operation.requiredDivision)) return false
  }
  
  // Thickness check
  if (wc.maxThicknessInches < operation.thickness) return false
  
  // Must be online
  if (!wc.isOnline) return false
  
  // Specialization check (if required)
  if (operation.specialization) {
    if (!wc.capabilities.includes(operation.specialization)) return false
  }
  
  return true
}

/**
 * Check if operator can handle the operation
 */
function operatorCanHandle(op, operation) {
  // Must be qualified for work center type
  if (!op.qualifiedWorkCenterTypes.includes(operation.requiredWorkCenterType)) return false
  
  // Must be qualified for division
  if (!op.qualifiedDivisions.includes(operation.requiredDivision)) return false
  
  // Skill level check
  if (!compareSkillLevel(operation.requiredSkillLevel, op.skillLevel)) return false
  
  // Thickness check
  if (op.maxThicknessInches < operation.thickness) return false
  
  return true
}

/**
 * Get job for an operation (for priority sorting)
 */
function getJobForOperation(operationJobId) {
  return jobs.find((j) => j.id === operationJobId)
}

/**
 * Priority order for sorting
 */
const PRIORITY_ORDER = { VIP: 0, RUSH: 1, HOT: 2, NORMAL: 3 }

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /v1/dispatch/locations
 * List available locations
 */
router.get('/locations', (req, res) => {
  res.json({
    success: true,
    data: locations,
  })
})

/**
 * GET /v1/dispatch/work-centers
 * List work centers, optionally filtered by location
 */
router.get('/work-centers', (req, res) => {
  const { locationId } = req.query
  
  let filtered = workCenters
  if (locationId) {
    filtered = workCenters.filter((wc) => wc.locationId === locationId)
  }
  
  res.json({
    success: true,
    data: filtered,
  })
})

/**
 * GET /v1/dispatch/operators
 * List operators, optionally filtered by location/work center
 */
router.get('/operators', (req, res) => {
  const { workCenterId } = req.query
  
  let filtered = operators
  if (workCenterId) {
    filtered = operators.filter((op) => op.homeWorkCenterId === workCenterId)
  }
  
  res.json({
    success: true,
    data: filtered,
  })
})

/**
 * POST /v1/dispatch/run
 * Run the dispatch engine to assign pending operations to work centers
 */
router.post('/run', (req, res) => {
  const { locationId } = req.body
  
  if (!locationId) {
    return res.status(400).json({
      success: false,
      error: 'locationId is required',
    })
  }
  
  // Get work centers at this location
  const locationWorkCenters = workCenters.filter(
    (wc) => wc.locationId === locationId && wc.isOnline
  )
  
  // Get jobs at this location
  const locationJobs = jobs.filter((j) => j.locationId === locationId)
  const locationJobIds = locationJobs.map((j) => j.id)
  
  // Get pending operations for jobs at this location
  const pendingOperations = jobOperations.filter(
    (op) =>
      locationJobIds.includes(op.jobId) &&
      op.status === 'PENDING' &&
      !op.assignedWorkCenterId
  )
  
  // Sort by job priority and due date, then by sequence
  pendingOperations.sort((a, b) => {
    const jobA = getJobForOperation(a.jobId)
    const jobB = getJobForOperation(b.jobId)
    
    // Priority first
    const prioA = PRIORITY_ORDER[jobA?.priority] ?? 99
    const prioB = PRIORITY_ORDER[jobB?.priority] ?? 99
    if (prioA !== prioB) return prioA - prioB
    
    // Then due date
    const dueA = new Date(jobA?.dueDate || '2099-12-31')
    const dueB = new Date(jobB?.dueDate || '2099-12-31')
    if (dueA.getTime() !== dueB.getTime()) return dueA - dueB
    
    // Then sequence within same job
    if (a.jobId === b.jobId) return a.sequence - b.sequence
    
    return 0
  })
  
  const assigned = []
  
  for (const operation of pendingOperations) {
    // Check if previous operations in the job are complete (dependency check)
    const priorOps = jobOperations.filter(
      (op) => op.jobId === operation.jobId && op.sequence < operation.sequence
    )
    const allPriorComplete = priorOps.every((op) => op.status === 'COMPLETE')
    
    // Only schedule first operation or if prior ones are done/scheduled
    const allPriorScheduledOrComplete = priorOps.every(
      (op) => op.status === 'COMPLETE' || op.status === 'SCHEDULED' || op.status === 'IN_PROCESS'
    )
    
    if (!allPriorScheduledOrComplete) continue
    
    // Find candidate work centers
    const candidateWCs = locationWorkCenters.filter((wc) =>
      workCenterCanHandle(wc, operation)
    )
    
    if (candidateWCs.length === 0) continue
    
    // Pick work center with lowest load (simple load balancing)
    candidateWCs.sort((a, b) => getWorkCenterLoad(a.id) - getWorkCenterLoad(b.id))
    const chosenWC = candidateWCs[0]
    
    // Find candidate operators
    const candidateOps = operators.filter((op) => operatorCanHandle(op, operation))
    
    let chosenOperator = null
    if (candidateOps.length > 0) {
      // Prefer operator whose home is this work center
      const homeOp = candidateOps.find((op) => op.homeWorkCenterId === chosenWC.id)
      chosenOperator = homeOp || candidateOps[0]
    }
    
    // Assign
    operation.assignedWorkCenterId = chosenWC.id
    operation.assignedOperatorId = chosenOperator?.id || null
    operation.status = 'SCHEDULED'
    operation.scheduledStart = new Date().toISOString()
    
    assigned.push(operation)
  }
  
  res.json({
    success: true,
    data: {
      locationId,
      assignedCount: assigned.length,
      details: assigned,
    },
  })
})

/**
 * GET /v1/dispatch/queue
 * Get the job operation queue for a specific work center
 */
router.get('/queue', (req, res) => {
  const { locationId, workCenterId } = req.query
  
  if (!workCenterId) {
    return res.status(400).json({
      success: false,
      error: 'workCenterId is required',
    })
  }
  
  // Get operations assigned to this work center
  let queue = jobOperations.filter(
    (op) =>
      op.assignedWorkCenterId === workCenterId &&
      (op.status === 'SCHEDULED' || op.status === 'IN_PROCESS')
  )
  
  // If locationId provided, filter by jobs at that location
  if (locationId) {
    const locationJobs = jobs.filter((j) => j.locationId === locationId)
    const locationJobIds = locationJobs.map((j) => j.id)
    queue = queue.filter((op) => locationJobIds.includes(op.jobId))
  }
  
  // Sort: IN_PROCESS first, then by priority, then by due date
  queue.sort((a, b) => {
    // IN_PROCESS always first
    if (a.status === 'IN_PROCESS' && b.status !== 'IN_PROCESS') return -1
    if (b.status === 'IN_PROCESS' && a.status !== 'IN_PROCESS') return 1
    
    const jobA = getJobForOperation(a.jobId)
    const jobB = getJobForOperation(b.jobId)
    
    const prioA = PRIORITY_ORDER[jobA?.priority] ?? 99
    const prioB = PRIORITY_ORDER[jobB?.priority] ?? 99
    if (prioA !== prioB) return prioA - prioB
    
    const dueA = new Date(jobA?.dueDate || '2099-12-31')
    const dueB = new Date(jobB?.dueDate || '2099-12-31')
    return dueA - dueB
  })
  
  // Enrich with job data
  const enrichedQueue = queue.map((op) => {
    const job = getJobForOperation(op.jobId)
    return {
      ...op,
      job: job
        ? {
            id: job.id,
            orderId: job.orderId,
            materialCode: job.materialCode,
            commodity: job.commodity,
            form: job.form,
            grade: job.grade,
            thickness: job.thickness,
            dueDate: job.dueDate,
            priority: job.priority,
          }
        : null,
    }
  })
  
  const wc = workCenters.find((w) => w.id === workCenterId)
  
  res.json({
    success: true,
    data: {
      locationId: locationId || null,
      workCenterId,
      workCenterName: wc?.name || workCenterId,
      operationCount: enrichedQueue.length,
      operations: enrichedQueue,
    },
  })
})

/**
 * GET /v1/dispatch/stats
 * Get dispatch statistics for a location
 */
router.get('/stats', (req, res) => {
  const { locationId } = req.query
  
  const locationJobs = locationId
    ? jobs.filter((j) => j.locationId === locationId)
    : jobs
  const locationJobIds = locationJobs.map((j) => j.id)
  
  const ops = jobOperations.filter((op) => locationJobIds.includes(op.jobId))
  
  const stats = {
    total: ops.length,
    pending: ops.filter((op) => op.status === 'PENDING').length,
    scheduled: ops.filter((op) => op.status === 'SCHEDULED').length,
    inProcess: ops.filter((op) => op.status === 'IN_PROCESS').length,
    complete: ops.filter((op) => op.status === 'COMPLETE').length,
    unassigned: ops.filter((op) => !op.assignedWorkCenterId).length,
  }
  
  // Per work center stats
  const wcStats = {}
  workCenters
    .filter((wc) => !locationId || wc.locationId === locationId)
    .forEach((wc) => {
      const wcOps = ops.filter((op) => op.assignedWorkCenterId === wc.id)
      wcStats[wc.id] = {
        name: wc.name,
        type: wc.workCenterType,
        scheduled: wcOps.filter((op) => op.status === 'SCHEDULED').length,
        inProcess: wcOps.filter((op) => op.status === 'IN_PROCESS').length,
        complete: wcOps.filter((op) => op.status === 'COMPLETE').length,
      }
    })
  
  res.json({
    success: true,
    data: {
      locationId: locationId || 'ALL',
      summary: stats,
      byWorkCenter: wcStats,
    },
  })
})

export default router
