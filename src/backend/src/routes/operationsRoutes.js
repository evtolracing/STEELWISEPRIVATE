/**
 * Job Operations Routes
 * Handles start, pause, complete actions and time logging
 */

import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import {
  jobOperations,
  jobOperationTimeLogs,
  operators,
  workCenters,
  jobs,
} from '../data/dispatchData.js'

const router = express.Router()

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Find operation by ID
 */
function findOperation(id) {
  return jobOperations.find((op) => op.id === id)
}

/**
 * Find operator by ID
 */
function findOperator(id) {
  return operators.find((op) => op.id === id)
}

/**
 * Find work center by ID
 */
function findWorkCenter(id) {
  return workCenters.find((wc) => wc.id === id)
}

/**
 * Find job by ID
 */
function findJob(id) {
  return jobs.find((j) => j.id === id)
}

/**
 * Get active (RUNNING) time log for an operation
 */
function getActiveTimeLog(jobOperationId) {
  return jobOperationTimeLogs.find(
    (log) => log.jobOperationId === jobOperationId && log.status === 'RUNNING'
  )
}

/**
 * Close a time log
 */
function closeTimeLog(log, reason) {
  log.status = reason || 'PAUSED'
  log.endAt = new Date().toISOString()
}

/**
 * Create a new time log
 */
function createTimeLog(operationId, jobId, operatorId, workCenterId) {
  const log = {
    id: uuidv4(),
    jobOperationId: operationId,
    jobId: jobId,
    operatorId: operatorId,
    workCenterId: workCenterId,
    status: 'RUNNING',
    startAt: new Date().toISOString(),
    endAt: null,
    downtimeReason: null,
  }
  jobOperationTimeLogs.push(log)
  return log
}

/**
 * Calculate total time spent on an operation
 */
function calculateOperationTime(operationId) {
  const logs = jobOperationTimeLogs.filter(
    (log) => log.jobOperationId === operationId
  )
  
  let totalMs = 0
  for (const log of logs) {
    const start = new Date(log.startAt).getTime()
    const end = log.endAt ? new Date(log.endAt).getTime() : Date.now()
    totalMs += end - start
  }
  
  return {
    totalSeconds: Math.round(totalMs / 1000),
    totalMinutes: Math.round(totalMs / 60000),
    formattedTime: formatDuration(totalMs),
  }
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /v1/operations
 * List all operations with optional filters
 */
router.get('/', (req, res) => {
  const { jobId, status, workCenterId } = req.query
  
  let filtered = [...jobOperations]
  
  if (jobId) {
    filtered = filtered.filter((op) => op.jobId === jobId)
  }
  if (status) {
    filtered = filtered.filter((op) => op.status === status)
  }
  if (workCenterId) {
    filtered = filtered.filter((op) => op.assignedWorkCenterId === workCenterId)
  }
  
  // Enrich with job data
  const enriched = filtered.map((op) => ({
    ...op,
    job: findJob(op.jobId),
    timeSpent: calculateOperationTime(op.id),
  }))
  
  res.json({
    success: true,
    data: enriched,
  })
})

/**
 * GET /v1/operations/:id
 * Get single operation with full details
 */
router.get('/:id', (req, res) => {
  const operation = findOperation(req.params.id)
  
  if (!operation) {
    return res.status(404).json({
      success: false,
      error: 'Operation not found',
    })
  }
  
  const logs = jobOperationTimeLogs.filter(
    (log) => log.jobOperationId === operation.id
  )
  
  res.json({
    success: true,
    data: {
      ...operation,
      job: findJob(operation.jobId),
      operator: operation.assignedOperatorId
        ? findOperator(operation.assignedOperatorId)
        : null,
      workCenter: operation.assignedWorkCenterId
        ? findWorkCenter(operation.assignedWorkCenterId)
        : null,
      timeSpent: calculateOperationTime(operation.id),
      timeLogs: logs,
    },
  })
})

/**
 * POST /v1/operations/:id/start
 * Start working on an operation
 */
router.post('/:id/start', (req, res) => {
  const { operatorId, workCenterId } = req.body
  const operation = findOperation(req.params.id)
  
  if (!operation) {
    return res.status(404).json({
      success: false,
      error: 'Operation not found',
    })
  }
  
  if (!operatorId) {
    return res.status(400).json({
      success: false,
      error: 'operatorId is required',
    })
  }
  
  // Validate operator exists
  const operator = findOperator(operatorId)
  if (!operator) {
    return res.status(400).json({
      success: false,
      error: 'Invalid operator',
    })
  }
  
  // Use provided work center or assigned one
  const wcId = workCenterId || operation.assignedWorkCenterId
  if (!wcId) {
    return res.status(400).json({
      success: false,
      error: 'Work center not assigned',
    })
  }
  
  // Close any existing active time log
  const activeLog = getActiveTimeLog(operation.id)
  if (activeLog) {
    closeTimeLog(activeLog, 'PAUSED')
  }
  
  // Update operation status
  operation.status = 'IN_PROCESS'
  operation.assignedOperatorId = operatorId
  operation.assignedWorkCenterId = wcId
  
  // Create new time log
  const newLog = createTimeLog(operation.id, operation.jobId, operatorId, wcId)
  
  console.log(`[OPERATIONS] Started operation ${operation.id} by operator ${operatorId}`)
  
  res.json({
    success: true,
    data: {
      operation: {
        ...operation,
        job: findJob(operation.jobId),
        operator,
        workCenter: findWorkCenter(wcId),
        timeSpent: calculateOperationTime(operation.id),
      },
      timeLog: newLog,
      message: `Started ${operation.name}`,
    },
  })
})

/**
 * POST /v1/operations/:id/pause
 * Pause work on an operation
 */
router.post('/:id/pause', (req, res) => {
  const { operatorId, workCenterId, downtimeReason } = req.body
  const operation = findOperation(req.params.id)
  
  if (!operation) {
    return res.status(404).json({
      success: false,
      error: 'Operation not found',
    })
  }
  
  // Find and close active time log
  const activeLog = getActiveTimeLog(operation.id)
  if (activeLog) {
    activeLog.status = 'PAUSED'
    activeLog.endAt = new Date().toISOString()
    activeLog.downtimeReason = downtimeReason || null
  }
  
  // Operation remains IN_PROCESS but timer is stopped
  // Optionally could set a paused state
  
  console.log(`[OPERATIONS] Paused operation ${operation.id}${downtimeReason ? ` - Reason: ${downtimeReason}` : ''}`)
  
  res.json({
    success: true,
    data: {
      operation: {
        ...operation,
        job: findJob(operation.jobId),
        timeSpent: calculateOperationTime(operation.id),
      },
      timeLog: activeLog,
      message: `Paused ${operation.name}`,
    },
  })
})

/**
 * POST /v1/operations/:id/complete
 * Complete an operation
 */
router.post('/:id/complete', (req, res) => {
  const { operatorId, workCenterId } = req.body
  const operation = findOperation(req.params.id)
  
  if (!operation) {
    return res.status(404).json({
      success: false,
      error: 'Operation not found',
    })
  }
  
  // Close any active time log
  const activeLog = getActiveTimeLog(operation.id)
  if (activeLog) {
    activeLog.status = 'COMPLETE'
    activeLog.endAt = new Date().toISOString()
  }
  
  // Update operation status
  operation.status = 'COMPLETE'
  
  // Get all time logs for summary
  const allLogs = jobOperationTimeLogs.filter(
    (log) => log.jobOperationId === operation.id
  )
  
  console.log(`[OPERATIONS] Completed operation ${operation.id}`)
  
  res.json({
    success: true,
    data: {
      operation: {
        ...operation,
        job: findJob(operation.jobId),
        operator: operation.assignedOperatorId
          ? findOperator(operation.assignedOperatorId)
          : null,
        workCenter: operation.assignedWorkCenterId
          ? findWorkCenter(operation.assignedWorkCenterId)
          : null,
        timeSpent: calculateOperationTime(operation.id),
      },
      timeLogs: allLogs,
      message: `Completed ${operation.name}`,
    },
  })
})

/**
 * GET /v1/operations/:id/time-logs
 * Get all time logs for an operation
 */
router.get('/:id/time-logs', (req, res) => {
  const operation = findOperation(req.params.id)
  
  if (!operation) {
    return res.status(404).json({
      success: false,
      error: 'Operation not found',
    })
  }
  
  const logs = jobOperationTimeLogs
    .filter((log) => log.jobOperationId === operation.id)
    .map((log) => ({
      ...log,
      operator: findOperator(log.operatorId),
      workCenter: findWorkCenter(log.workCenterId),
      duration: log.endAt
        ? formatDuration(new Date(log.endAt) - new Date(log.startAt))
        : 'Running...',
    }))
  
  res.json({
    success: true,
    data: {
      operation,
      timeSpent: calculateOperationTime(operation.id),
      logs,
    },
  })
})

/**
 * POST /v1/operations/:id/reassign
 * Reassign operation to different work center or operator
 */
router.post('/:id/reassign', (req, res) => {
  const { workCenterId, operatorId } = req.body
  const operation = findOperation(req.params.id)
  
  if (!operation) {
    return res.status(404).json({
      success: false,
      error: 'Operation not found',
    })
  }
  
  if (operation.status === 'COMPLETE') {
    return res.status(400).json({
      success: false,
      error: 'Cannot reassign completed operation',
    })
  }
  
  // If currently running, pause first
  const activeLog = getActiveTimeLog(operation.id)
  if (activeLog) {
    closeTimeLog(activeLog, 'PAUSED')
  }
  
  if (workCenterId) {
    const wc = findWorkCenter(workCenterId)
    if (!wc) {
      return res.status(400).json({
        success: false,
        error: 'Invalid work center',
      })
    }
    operation.assignedWorkCenterId = workCenterId
  }
  
  if (operatorId) {
    const op = findOperator(operatorId)
    if (!op) {
      return res.status(400).json({
        success: false,
        error: 'Invalid operator',
      })
    }
    operation.assignedOperatorId = operatorId
  }
  
  console.log(`[OPERATIONS] Reassigned operation ${operation.id}`)
  
  res.json({
    success: true,
    data: {
      operation: {
        ...operation,
        job: findJob(operation.jobId),
        operator: operation.assignedOperatorId
          ? findOperator(operation.assignedOperatorId)
          : null,
        workCenter: operation.assignedWorkCenterId
          ? findWorkCenter(operation.assignedWorkCenterId)
          : null,
      },
      message: 'Operation reassigned',
    },
  })
})

export default router
