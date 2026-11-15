/**
 * Job Operations Routes
 * Handles start, pause, complete actions and time logging
 * All data persisted to Supabase via Prisma (DispatchOperation, DispatchTimeLog)
 */

import express from 'express'
import prisma from '../lib/db.js'
import { changeJobStatusTx } from '../lib/jobGates.js'
import { getSetting } from '../lib/settings.js'
import { lockedOut } from '../lib/workCenterGuard.js'
import { operationStartError, operationCompleteError, operationPauseError, workCenterEligibility, operatorEligibility } from '../lib/productionRules.js'

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
const LIST_DEFAULT = 500
const LIST_MAX = 2000
router.get('/', async (req, res) => {
  try {
    const { jobId, status, workCenterId, locationId } = req.query
    
    const where = {}
    if (jobId) where.dispatchJobId = jobId
    if (status) where.status = status
    if (workCenterId) where.assignedWorkCenterId = workCenterId
    if (locationId) where.dispatchJob = { locationId: String(locationId) }
    
    // The list is capped: a branch with thousands of steps is not sent whole. The total is sent with it.
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || LIST_DEFAULT, 1), LIST_MAX)
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0)
    const [ops, total] = await Promise.all([
      prisma.dispatchOperation.findMany({
        where,
        include: {
          dispatchJob: true,
          timeLogs: { orderBy: { startAt: 'asc' } },
        },
        orderBy: [{ sequence: 'asc' }, { id: 'asc' }],
        take: limit,
        skip: offset,
      }),
      prisma.dispatchOperation.count({ where }),
    ])
    res.setHeader('X-Total-Count', String(total))
    if (ops.length < total) res.setHeader('X-Result-Limited', 'true')
    
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
    
    res.json({ success: true, data: enriched, total, limited: enriched.length < total })
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

// Whether steps must be worked in their planned order is the owner's rule (setting production.rules, stepsInOrder).
// The owner chose planned order on 2026-11-15; that is the default when the setting is not on file.
const stepsInOrder = async () => Boolean((await getSetting('production.rules'))?.stepsInOrder)
const refuse = (status, message) => { const e = new Error(message); e.status = status; e.refused = true; throw e }
const refused = (res, error) => (error?.refused ? (res.status(error.status).json({ success: false, error: error.message }), true) : false)

/** Lock the plan and its job, then read the operation as it is now, with what the rules need. */
async function lockedOperation(tx, operation) {
  await tx.$queryRaw`SELECT id FROM "DispatchJob" WHERE id = ${operation.dispatchJobId} FOR UPDATE`
  if (operation.dispatchJob?.jobId) await tx.$queryRaw`SELECT id FROM "Job" WHERE id = ${operation.dispatchJob.jobId} FOR UPDATE`
  const [now, siblings, job] = await Promise.all([
    tx.dispatchOperation.findUnique({ where: { id: operation.id } }),
    tx.dispatchOperation.findMany({ where: { dispatchJobId: operation.dispatchJobId }, select: { id: true, sequence: true, name: true, status: true } }),
    operation.dispatchJob?.jobId ? tx.job.findUnique({ where: { id: operation.dispatchJob.jobId }, select: { status: true } }) : null,
  ])
  return { now, siblings, jobStatus: job?.status || null }
}

/** The work center and operator named for a step must be able to do it at the job's branch. */
async function checkWho(tx, operation, { workCenterId, operatorId }) {
  const branchId = operation.dispatchJob?.locationId || null
  if (workCenterId) {
    const wc = await tx.workCenter.findUnique({ where: { id: workCenterId }, select: { id: true, name: true, type: true, isActive: true, locationId: true } })
    const why = workCenterEligibility(wc, operation, branchId)
    if (why) refuse(wc ? 409 : 400, why)
    // A machine locked out for maintenance, or on a safety or quality hold, is not run.
    const locked = (await lockedOut(tx, [workCenterId]))[workCenterId]
    if (locked) refuse(409, `${locked}. Work cannot be started there.`)
  }
  if (operatorId) {
    const person = await tx.operator.findUnique({ where: { id: operatorId }, select: { id: true, firstName: true, lastName: true, isActive: true, status: true, homeLocationId: true, skills: { select: { workCenterTypeId: true, expiresAt: true, isActive: true } } } })
    const why = operatorEligibility(person, operation, branchId)
    if (why) refuse(person ? 409 : 400, person ? why : 'Invalid operator')
  }
}

// An operation cannot be worked once its job is finished or cancelled (finding C-005).
const CLOSED_JOB = ['SHIPPED', 'COMPLETED', 'CANCELLED']
async function closedJobOf(db, dispatchJob) {
  if (!dispatchJob?.jobId) return null
  const job = await db.job.findUnique({ where: { id: dispatchJob.jobId }, select: { status: true } })
  return job && CLOSED_JOB.includes(job.status) ? job.status : null
}

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
    const closed = await closedJobOf(prisma, operation.dispatchJob)
    if (closed) return res.status(409).json({ success: false, error: `This job is ${closed.toLowerCase()}; its operations cannot be started` })
    
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
    
    // One step: the time log, the operation and the job move together or not at all (B-010).
    // Decided on the locked plan: a finished step is not started again, steps run in order, and the
    // work center and operator must be able to do this step at the job's branch.
    const { updated, newLog } = await prisma.$transaction(async (tx) => {
    const { now, siblings, jobStatus } = await lockedOperation(tx, operation)
    const why = operationStartError({ operation: now, siblings, jobStatus, inOrder: await stepsInOrder() })
    if (why) refuse(409, why)
    await checkWho(tx, operation, { workCenterId: wcId, operatorId })
    // Close any existing active (RUNNING) time log
    await tx.dispatchTimeLog.updateMany({
      where: { dispatchOperationId: operation.id, status: 'RUNNING' },
      data: { status: 'PAUSED', endAt: new Date() },
    })
    
    // Update operation status
    const updated = await tx.dispatchOperation.update({
      where: { id: operation.id },
      data: {
        status: 'IN_PROCESS',
        assignedOperatorId: operatorId,
        assignedWorkCenterId: wcId,
        actualStart: now.actualStart || new Date(),
      },
    })
    
    // Create new time log
    const newLog = await tx.dispatchTimeLog.create({
      data: {
        dispatchOperationId: operation.id,
        jobId: operation.dispatchJobId,
        operatorId: operatorId,
        workCenterId: wcId,
        status: 'RUNNING',
        startAt: new Date(),
      },
    })
    
    // Also update the parent Job status to IN_PROCESS if it has not started
    if (operation.dispatchJob?.jobId && ['SCHEDULED', 'ORDERED'].includes(jobStatus)) {
      await changeJobStatusTx(tx, operation.dispatchJob.jobId, 'IN_PROCESS', { note: 'First operation started', via: 'operation', userId: req.user?.id })
    }
    return { updated, newLog }
    })
    
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
    if (refused(res, error)) return
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
    
    // Find and close the running time log, with the plan locked. Nothing running means nothing to pause.
    const activeLog = await prisma.$transaction(async (tx) => {
      const { now } = await lockedOperation(tx, operation)
      const running = await tx.dispatchTimeLog.findFirst({ where: { dispatchOperationId: operation.id, status: 'RUNNING' } })
      const why = operationPauseError(now, Boolean(running))
      if (why) refuse(409, why)
      return tx.dispatchTimeLog.update({
        where: { id: running.id },
        data: { status: 'PAUSED', endAt: new Date(), downtimeReason: typeof downtimeReason === 'string' && downtimeReason.trim() ? downtimeReason.trim().slice(0, 200) : null },
      })
    })
    
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
    if (refused(res, error)) return
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
    
    // One step (B-010). The dispatch job row is locked first, so two operators finishing the last two
    // operations at the same moment cannot both conclude that the other one is still open.
    const updated = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "DispatchJob" WHERE id = ${operation.dispatchJobId} FOR UPDATE`
    // The job row is locked too, so a cancellation and a completion cannot pass each other.
    if (operation.dispatchJob?.jobId) await tx.$queryRaw`SELECT id FROM "Job" WHERE id = ${operation.dispatchJob.jobId} FOR UPDATE`
    const closed = await closedJobOf(tx, operation.dispatchJob)
    if (closed) { const e = new Error(`This job is ${closed.toLowerCase()}; its operations cannot be completed`); e.status = 409; throw e }
    // A repeated request for an operation that is already complete changes nothing.
    const now = await tx.dispatchOperation.findUnique({ where: { id: operation.id } })
    if (now.status === 'COMPLETE') return now
    // A step that was never started has no time against it: it is started first.
    const notStarted = operationCompleteError(now)
    if (notStarted) refuse(409, notStarted)
    // Close any active time log
    await tx.dispatchTimeLog.updateMany({
      where: { dispatchOperationId: operation.id, status: 'RUNNING' },
      data: { status: 'COMPLETE', endAt: new Date() },
    })
    
    // Update operation status
    const updated = await tx.dispatchOperation.update({
      where: { id: operation.id },
      data: { status: 'COMPLETE', actualEnd: new Date() },
    })
    
    // Check if ALL operations for this dispatch job are complete → move job to QC
    if (operation.dispatchJob?.jobId) {
      const remaining = await tx.dispatchOperation.count({
        where: {
          dispatchJobId: operation.dispatchJobId,
          status: { not: 'COMPLETE' },
        },
      })
      const job = await tx.job.findUnique({ where: { id: operation.dispatchJob.jobId }, select: { status: true } })
      // A job on hold stays on hold: finishing its last step records the work but does not release it.
      if (remaining === 0 && ['ORDERED', 'SCHEDULED', 'IN_PROCESS'].includes(job?.status)) {
        // All operations done → job goes to QC inspection queue (not directly to COMPLETE)
        await changeJobStatusTx(tx, operation.dispatchJob.jobId, 'WAITING_QC', { note: 'All operations finished', via: 'operation', userId: req.user?.id })
        console.log(`[OPERATIONS] All ops complete for job ${operation.dispatchJob.jobId} — moved to WAITING_QC`)
      }
    }
    return updated
    })
    
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
    if (error.status === 409) return res.status(409).json({ success: false, error: error.message })
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
    
    const updateData = {}
    if (workCenterId) updateData.assignedWorkCenterId = workCenterId
    if (operatorId) updateData.assignedOperatorId = operatorId
    if (!Object.keys(updateData).length) return res.status(400).json({ success: false, error: 'Name the work center or operator to move this step to' })

    // Decided on the locked plan. The new work center and operator must be able to do this step at the
    // job's branch. Pausing the running time log and moving the operation are one step (B-010).
    const updated = await prisma.$transaction(async (tx) => {
      const { now, jobStatus } = await lockedOperation(tx, operation)
      if (now.status === 'COMPLETE') refuse(400, 'Cannot reassign completed operation')
      if (jobStatus && ['SHIPPED', 'COMPLETED', 'CANCELLED'].includes(jobStatus)) refuse(409, `This job is ${jobStatus.toLowerCase()}; its operations cannot be reassigned`)
      await checkWho(tx, operation, { workCenterId, operatorId })
      await tx.dispatchTimeLog.updateMany({
        where: { dispatchOperationId: operation.id, status: 'RUNNING' },
        data: { status: 'PAUSED', endAt: new Date() },
      })
      return tx.dispatchOperation.update({ where: { id: operation.id }, data: updateData, include: { dispatchJob: true } })
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
    if (refused(res, error)) return
    console.error('Error reassigning operation:', error)
    res.status(500).json({ success: false, error: 'Failed to reassign operation' })
  }
})

export default router
