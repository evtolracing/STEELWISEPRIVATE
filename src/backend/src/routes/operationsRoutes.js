/**
 * Job Operations Routes
 * Handles start, pause, complete actions and time logging
 * All data persisted to Supabase via Prisma (DispatchOperation, DispatchTimeLog)
 */

import express from 'express'
import prisma from '../lib/db.js'

const router = express.Router()

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

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

/**
 * Calculate total time spent on an operation from its time logs
 */
function calculateTimeFromLogs(logs) {
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

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /v1/operations
 * List all operations with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const { jobId, status, workCenterId } = req.query
    
    const where = {}
    if (jobId) where.dispatchJobId = jobId
    if (status) where.status = status
    if (workCenterId) where.assignedWorkCenterId = workCenterId
    
    const ops = await prisma.dispatchOperation.findMany({
      where,
      include: {
        dispatchJob: true,
        timeLogs: { orderBy: { startAt: 'asc' } },
      },
      orderBy: { sequence: 'asc' },
    })
    
    const enriched = ops.map((op) => ({
      id: op.id,
      dispatchJobId: op.dispatchJobId,
      jobId: op.dispatchJobId,
      sequence: op.sequence,
      name: op.name,
      requiredWorkCenterType: op.requiredWorkCenterType,
      requiredDivision: op.requiredDivision,
      requiredSkillLevel: op.requiredSkillLevel,
      specialization: op.specialization,
      thickness: Number(op.thickness || 0),
      materialCode: op.materialCode,
      status: op.status,
      assignedWorkCenterId: op.assignedWorkCenterId,
      assignedOperatorId: op.assignedOperatorId,
      scheduledStart: op.scheduledStart,
      scheduledEnd: op.scheduledEnd,
      actualStart: op.actualStart,
      actualEnd: op.actualEnd,
      job: op.dispatchJob ? {
        id: op.dispatchJob.id,
        jobNumber: op.dispatchJob.jobNumber,
        materialCode: op.dispatchJob.materialCode,
        commodity: op.dispatchJob.commodity,
        form: op.dispatchJob.form,
        grade: op.dispatchJob.grade,
        dueDate: op.dispatchJob.dueDate,
        priority: op.dispatchJob.priority,
        customerName: op.dispatchJob.customerName,
      } : null,
      timeSpent: calculateTimeFromLogs(op.timeLogs),
    }))
    
    res.json({ success: true, data: enriched })
  } catch (error) {
    console.error('Error fetching operations:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch operations' })
  }
})

/**
 * GET /v1/operations/:id
 * Get single operation with full details
 */
router.get('/:id', async (req, res) => {
  try {
    const operation = await prisma.dispatchOperation.findUnique({
      where: { id: req.params.id },
      include: {
        dispatchJob: true,
        timeLogs: { orderBy: { startAt: 'asc' } },
      },
    })
    
    if (!operation) {
      return res.status(404).json({ success: false, error: 'Operation not found' })
    }
    
    // Look up operator and work center names
    let operatorData = null
    if (operation.assignedOperatorId) {
      const op = await prisma.operator.findUnique({ where: { id: operation.assignedOperatorId } })
      if (op) operatorData = { id: op.id, name: `${op.firstName} ${op.lastName}` }
    }
    
    let workCenterData = null
    if (operation.assignedWorkCenterId) {
      const wc = await prisma.workCenter.findUnique({ where: { id: operation.assignedWorkCenterId } })
      if (wc) workCenterData = { id: wc.id, name: wc.name, type: wc.type }
    }
    
    res.json({
      success: true,
      data: {
        ...operation,
        thickness: Number(operation.thickness || 0),
        job: operation.dispatchJob,
        operator: operatorData,
        workCenter: workCenterData,
        timeSpent: calculateTimeFromLogs(operation.timeLogs),
        timeLogs: operation.timeLogs,
      },
    })
  } catch (error) {
    console.error('Error fetching operation:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch operation' })
  }
})

/**
 * POST /v1/operations/:id/start
 * Start working on an operation
 */
router.post('/:id/start', async (req, res) => {
  try {
    const { operatorId, workCenterId } = req.body
    
    const operation = await prisma.dispatchOperation.findUnique({
      where: { id: req.params.id },
      include: { dispatchJob: true },
    })
    
    if (!operation) {
      return res.status(404).json({ success: false, error: 'Operation not found' })
    }
    
    if (!operatorId) {
      return res.status(400).json({ success: false, error: 'operatorId is required' })
    }
    
    // Validate operator exists
    const operator = await prisma.operator.findUnique({ where: { id: operatorId } })
    if (!operator) {
      return res.status(400).json({ success: false, error: 'Invalid operator' })
    }
    
    // Use provided work center or assigned one
    const wcId = workCenterId || operation.assignedWorkCenterId
    if (!wcId) {
      return res.status(400).json({ success: false, error: 'Work center not assigned' })
    }
    
    // Close any existing active (RUNNING) time log
    await prisma.dispatchTimeLog.updateMany({
      where: { dispatchOperationId: operation.id, status: 'RUNNING' },
      data: { status: 'PAUSED', endAt: new Date() },
    })
    
    // Update operation status
    const updated = await prisma.dispatchOperation.update({
      where: { id: operation.id },
      data: {
        status: 'IN_PROCESS',
        assignedOperatorId: operatorId,
        assignedWorkCenterId: wcId,
        actualStart: operation.actualStart || new Date(),
      },
    })
    
    // Create new time log
    const newLog = await prisma.dispatchTimeLog.create({
      data: {
        dispatchOperationId: operation.id,
        jobId: operation.dispatchJobId,
        operatorId: operatorId,
        workCenterId: wcId,
        status: 'RUNNING',
        startAt: new Date(),
      },
    })
    
    // Also update the parent Job status to IN_PROCESS if it's still SCHEDULED
    if (operation.dispatchJob?.jobId) {
      await prisma.job.updateMany({
        where: { id: operation.dispatchJob.jobId, status: 'SCHEDULED' },
        data: { status: 'IN_PROCESS' },
      })
    }
    
    console.log(`[OPERATIONS] Started operation ${operation.id} by operator ${operatorId}`)
    
    const timeLogs = await prisma.dispatchTimeLog.findMany({
      where: { dispatchOperationId: operation.id },
      orderBy: { startAt: 'asc' },
    })
    
    res.json({
      success: true,
      data: {
        operation: {
          ...updated,
          thickness: Number(updated.thickness || 0),
          job: operation.dispatchJob,
          operator: { id: operator.id, name: `${operator.firstName} ${operator.lastName}` },
          timeSpent: calculateTimeFromLogs(timeLogs),
        },
        timeLog: newLog,
        message: `Started ${operation.name}`,
      },
    })
  } catch (error) {
    console.error('Error starting operation:', error)
    res.status(500).json({ success: false, error: 'Failed to start operation' })
  }
})

/**
 * POST /v1/operations/:id/pause
 * Pause work on an operation
 */
router.post('/:id/pause', async (req, res) => {
  try {
    const { downtimeReason } = req.body
    
    const operation = await prisma.dispatchOperation.findUnique({
      where: { id: req.params.id },
      include: { dispatchJob: true },
    })
    
    if (!operation) {
      return res.status(404).json({ success: false, error: 'Operation not found' })
    }
    
    // Find and close active time log
    const activeLog = await prisma.dispatchTimeLog.findFirst({
      where: { dispatchOperationId: operation.id, status: 'RUNNING' },
    })
    
    if (activeLog) {
      await prisma.dispatchTimeLog.update({
        where: { id: activeLog.id },
        data: { status: 'PAUSED', endAt: new Date(), downtimeReason: downtimeReason || null },
      })
    }
    
    console.log(`[OPERATIONS] Paused operation ${operation.id}${downtimeReason ? ` - Reason: ${downtimeReason}` : ''}`)
    
    const timeLogs = await prisma.dispatchTimeLog.findMany({
      where: { dispatchOperationId: operation.id },
      orderBy: { startAt: 'asc' },
    })
    
    res.json({
      success: true,
      data: {
        operation: {
          ...operation,
          thickness: Number(operation.thickness || 0),
          job: operation.dispatchJob,
          timeSpent: calculateTimeFromLogs(timeLogs),
        },
        timeLog: activeLog,
        message: `Paused ${operation.name}`,
      },
    })
  } catch (error) {
    console.error('Error pausing operation:', error)
    res.status(500).json({ success: false, error: 'Failed to pause operation' })
  }
})

/**
 * POST /v1/operations/:id/complete
 * Complete an operation
 */
router.post('/:id/complete', async (req, res) => {
  try {
    const operation = await prisma.dispatchOperation.findUnique({
      where: { id: req.params.id },
      include: { dispatchJob: true },
    })
    
    if (!operation) {
      return res.status(404).json({ success: false, error: 'Operation not found' })
    }
    
    // Close any active time log
    await prisma.dispatchTimeLog.updateMany({
      where: { dispatchOperationId: operation.id, status: 'RUNNING' },
      data: { status: 'COMPLETE', endAt: new Date() },
    })
    
    // Update operation status
    const updated = await prisma.dispatchOperation.update({
      where: { id: operation.id },
      data: { status: 'COMPLETE', actualEnd: new Date() },
    })
    
    // Check if ALL operations for this dispatch job are complete → move job to QC
    if (operation.dispatchJob?.jobId) {
      const remaining = await prisma.dispatchOperation.count({
        where: {
          dispatchJobId: operation.dispatchJobId,
          status: { not: 'COMPLETE' },
          id: { not: operation.id },
        },
      })
      if (remaining === 0) {
        // All operations done → job goes to QC inspection queue (not directly to COMPLETE)
        await prisma.job.update({
          where: { id: operation.dispatchJob.jobId },
          data: { status: 'WAITING_QC' },
        })
        console.log(`[OPERATIONS] All ops complete for job ${operation.dispatchJob.jobId} — moved to WAITING_QC`)
      }
    }
    
    const allLogs = await prisma.dispatchTimeLog.findMany({
      where: { dispatchOperationId: operation.id },
      orderBy: { startAt: 'asc' },
    })
    
    // Look up operator and work center
    let operatorData = null
    if (updated.assignedOperatorId) {
      const op = await prisma.operator.findUnique({ where: { id: updated.assignedOperatorId } })
      if (op) operatorData = { id: op.id, name: `${op.firstName} ${op.lastName}` }
    }
    let workCenterData = null
    if (updated.assignedWorkCenterId) {
      const wc = await prisma.workCenter.findUnique({ where: { id: updated.assignedWorkCenterId } })
      if (wc) workCenterData = { id: wc.id, name: wc.name, type: wc.type }
    }
    
    console.log(`[OPERATIONS] Completed operation ${operation.id}`)
    
    res.json({
      success: true,
      data: {
        operation: {
          ...updated,
          thickness: Number(updated.thickness || 0),
          job: operation.dispatchJob,
          operator: operatorData,
          workCenter: workCenterData,
          timeSpent: calculateTimeFromLogs(allLogs),
        },
        timeLogs: allLogs,
        message: `Completed ${operation.name}`,
      },
    })
  } catch (error) {
    console.error('Error completing operation:', error)
    res.status(500).json({ success: false, error: 'Failed to complete operation' })
  }
})

/**
 * GET /v1/operations/:id/time-logs
 * Get all time logs for an operation
 */
router.get('/:id/time-logs', async (req, res) => {
  try {
    const operation = await prisma.dispatchOperation.findUnique({
      where: { id: req.params.id },
    })
    
    if (!operation) {
      return res.status(404).json({ success: false, error: 'Operation not found' })
    }
    
    const logs = await prisma.dispatchTimeLog.findMany({
      where: { dispatchOperationId: operation.id },
      orderBy: { startAt: 'asc' },
    })
    
    // Enrich logs with operator/work center names
    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        let operatorData = null
        if (log.operatorId) {
          const op = await prisma.operator.findUnique({ where: { id: log.operatorId } })
          if (op) operatorData = { id: op.id, name: `${op.firstName} ${op.lastName}` }
        }
        let wcData = null
        if (log.workCenterId) {
          const wc = await prisma.workCenter.findUnique({ where: { id: log.workCenterId } })
          if (wc) wcData = { id: wc.id, name: wc.name }
        }
        return {
          ...log,
          operator: operatorData,
          workCenter: wcData,
          duration: log.endAt
            ? formatDuration(new Date(log.endAt) - new Date(log.startAt))
            : 'Running...',
        }
      })
    )
    
    res.json({
      success: true,
      data: {
        operation: { ...operation, thickness: Number(operation.thickness || 0) },
        timeSpent: calculateTimeFromLogs(logs),
        logs: enrichedLogs,
      },
    })
  } catch (error) {
    console.error('Error fetching time logs:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch time logs' })
  }
})

/**
 * POST /v1/operations/:id/reassign
 * Reassign operation to different work center or operator
 */
router.post('/:id/reassign', async (req, res) => {
  try {
    const { workCenterId, operatorId } = req.body
    
    const operation = await prisma.dispatchOperation.findUnique({
      where: { id: req.params.id },
      include: { dispatchJob: true },
    })
    
    if (!operation) {
      return res.status(404).json({ success: false, error: 'Operation not found' })
    }
    
    if (operation.status === 'COMPLETE') {
      return res.status(400).json({ success: false, error: 'Cannot reassign completed operation' })
    }
    
    // If currently running, pause first
    await prisma.dispatchTimeLog.updateMany({
      where: { dispatchOperationId: operation.id, status: 'RUNNING' },
      data: { status: 'PAUSED', endAt: new Date() },
    })
    
    const updateData = {}
    
    if (workCenterId) {
      const wc = await prisma.workCenter.findUnique({ where: { id: workCenterId } })
      if (!wc) {
        return res.status(400).json({ success: false, error: 'Invalid work center' })
      }
      updateData.assignedWorkCenterId = workCenterId
    }
    
    if (operatorId) {
      const op = await prisma.operator.findUnique({ where: { id: operatorId } })
      if (!op) {
        return res.status(400).json({ success: false, error: 'Invalid operator' })
      }
      updateData.assignedOperatorId = operatorId
    }
    
    const updated = await prisma.dispatchOperation.update({
      where: { id: operation.id },
      data: updateData,
      include: { dispatchJob: true },
    })
    
    // Look up operator and work center
    let operatorData = null
    if (updated.assignedOperatorId) {
      const op = await prisma.operator.findUnique({ where: { id: updated.assignedOperatorId } })
      if (op) operatorData = { id: op.id, name: `${op.firstName} ${op.lastName}` }
    }
    let workCenterData = null
    if (updated.assignedWorkCenterId) {
      const wc = await prisma.workCenter.findUnique({ where: { id: updated.assignedWorkCenterId } })
      if (wc) workCenterData = { id: wc.id, name: wc.name, type: wc.type }
    }
    
    console.log(`[OPERATIONS] Reassigned operation ${operation.id}`)
    
    res.json({
      success: true,
      data: {
        operation: {
          ...updated,
          thickness: Number(updated.thickness || 0),
          job: updated.dispatchJob,
          operator: operatorData,
          workCenter: workCenterData,
        },
        message: 'Operation reassigned',
      },
    })
  } catch (error) {
    console.error('Error reassigning operation:', error)
    res.status(500).json({ success: false, error: 'Failed to reassign operation' })
  }
})

export default router
