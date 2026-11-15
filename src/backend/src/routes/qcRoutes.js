/**
 * QC Inspection Routes
 * Handles job-level quality control inspections:
 * - QC Queue (jobs awaiting inspection)
 * - Inspection CRUD (create, read, update)
 * - Pass / Fail / Rework disposition actions
 * - Inspector assignment
 * - Dashboard stats
 */

import express from 'express'
import prisma from '../lib/db.js'
import { changeJobStatusTx, lockJob, sendRefusal, JobMoveRefused } from '../lib/jobGates.js'
import { inspectionPassBlockers, OPEN_INSPECTION } from '../lib/productionRules.js'
import { createNumbered, padded } from '../lib/numbering.js';

const router = express.Router()

// ── GET /queue ── Jobs waiting for QC inspection ────────────────────────────
const QUEUE_DEFAULT = 200
const QUEUE_MAX = 500
router.get('/queue', async (req, res) => {
  try {
    // The queue is the oldest and most urgent jobs first. It is capped so that a branch with a long
    // backlog does not download every waiting job; the total is sent with it.
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || QUEUE_DEFAULT, 1), QUEUE_MAX)
    const total = await prisma.job.count({ where: { status: 'WAITING_QC' } })
    const jobs = await prisma.job.findMany({
      where: { status: 'WAITING_QC' },
      take: limit,
      include: {
        order: { select: { orderNumber: true, buyerId: true } },
        workCenter: { select: { id: true, name: true, code: true } },
        dispatchJob: {
          include: {
            operations: {
              orderBy: { sequence: 'asc' },
              select: {
                id: true,
                name: true,
                status: true,
                assignedWorkCenterId: true,
                actualStart: true,
                actualEnd: true,
              },
            },
          },
        },
        inspections: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      // Priority runs from 1 (low) to 5 (hot): the hottest first, then the longest waiting. (It used to list the lowest priority first.)
      orderBy: [{ priority: 'desc' }, { updatedAt: 'asc' }, { id: 'asc' }],
    })
    res.setHeader('X-Total-Count', String(total))
    res.json({ success: true, data: jobs, total, limited: jobs.length < total })
  } catch (err) {
    console.error('[QC] Error fetching queue:', err)
    res.status(500).json({ success: false, error: 'Failed to fetch QC queue' })
  }
})

// ── GET /stats ── Dashboard statistics ──────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [
      queueCount,
      inProgressCount,
      passedToday,
      failedToday,
      totalInspections,
      recentInspections,
    ] = await Promise.all([
      // Jobs waiting for QC
      prisma.job.count({ where: { status: 'WAITING_QC' } }),
      // Inspections in progress
      prisma.jobInspection.count({ where: { status: 'IN_PROGRESS' } }),
      // Passed today
      prisma.jobInspection.count({
        where: {
          overallResult: 'PASS',
          completedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      // Failed today
      prisma.jobInspection.count({
        where: {
          overallResult: 'FAIL',
          completedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      // Total inspections
      prisma.jobInspection.count(),
      // Recent inspections (last 10)
      prisma.jobInspection.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          job: { select: { id: true, jobNumber: true, status: true, operationType: true } },
          inspector: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
    ])

    // With nothing decided today there is no pass rate to show (it used to read 100%).
    const passRate = passedToday + failedToday > 0
      ? Math.round((passedToday / (passedToday + failedToday)) * 100)
      : null

    res.json({
      success: true,
      data: {
        queueCount,
        inProgressCount,
        passedToday,
        failedToday,
        passRate,
        totalInspections,
        recentInspections,
      },
    })
  } catch (err) {
    console.error('[QC] Error fetching stats:', err)
    res.status(500).json({ success: false, error: 'Failed to fetch QC stats' })
  }
})

// ── GET /inspections ── List inspections with filters ───────────────────────
router.get('/inspections', async (req, res) => {
  try {
    const { status, jobId, inspectorId, inspectionType, limit = 50, offset = 0 } = req.query

    const where = {}
    if (status) where.status = status
    if (jobId) where.jobId = jobId
    if (inspectorId) where.inspectorId = inspectorId
    if (inspectionType) where.inspectionType = inspectionType

    const [inspections, total] = await Promise.all([
      prisma.jobInspection.findMany({
        where,
        include: {
          job: {
            select: {
              id: true,
              jobNumber: true,
              status: true,
              operationType: true,
              priority: true,
              notes: true,
              order: { select: { orderNumber: true } },
              workCenter: { select: { name: true, code: true } },
            },
          },
          inspector: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.jobInspection.count({ where }),
    ])

    res.json({ success: true, data: inspections, total })
  } catch (err) {
    console.error('[QC] Error fetching inspections:', err)
    res.status(500).json({ success: false, error: 'Failed to fetch inspections' })
  }
})

// ── GET /inspections/:id ── Single inspection detail ────────────────────────
router.get('/inspections/:id', async (req, res) => {
  try {
    const inspection = await prisma.jobInspection.findUnique({
      where: { id: req.params.id },
      include: {
        job: {
          include: {
            order: { select: { orderNumber: true, buyerId: true } },
            workCenter: { select: { name: true, code: true } },
            dispatchJob: {
              include: {
                operations: {
                  orderBy: { sequence: 'asc' },
                  include: {
                    timeLogs: { orderBy: { startAt: 'asc' } },
                  },
                },
              },
            },
          },
        },
        inspector: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
      },
    })

    if (!inspection) {
      return res.status(404).json({ success: false, error: 'Inspection not found' })
    }

    res.json({ success: true, data: inspection })
  } catch (err) {
    console.error('[QC] Error fetching inspection:', err)
    res.status(500).json({ success: false, error: 'Failed to fetch inspection' })
  }
})

// ── POST /inspections ── Create a new inspection for a WAITING_QC job ───────
router.post('/inspections', async (req, res) => {
  try {
    const { jobId, inspectorId, inspectionType = 'FINAL', checklist, notes } = req.body

    if (!jobId) {
      return res.status(400).json({ success: false, error: 'jobId is required' })
    }

    if (inspectorId) {
      const inspector = await prisma.operator.findUnique({ where: { id: inspectorId }, select: { isActive: true, status: true } }).catch(() => null)
      if (!inspector) return res.status(400).json({ success: false, error: 'That inspector is not on file' })
      if (!inspector.isActive || inspector.status !== 'ACTIVE') return res.status(400).json({ success: false, error: 'That inspector is not active' })
    }
    const seen = await prisma.job.findUnique({ where: { id: jobId }, select: { id: true } })
    if (!seen) return res.status(404).json({ success: false, error: 'Job not found' })

    // With the job locked: it must still be waiting for inspection, and it may have one open inspection at a time.
    let job = null
    const inspection = await createNumbered({ count: () => prisma.jobInspection.count(), format: padded('INS'), create: (inspectionNumber) => prisma.$transaction(async (tx) => {
      await lockJob(tx, jobId)
      job = await tx.job.findUnique({ where: { id: jobId } })
      if (job.status !== 'WAITING_QC') throw new JobMoveRefused(`Job is in ${job.status} status, must be WAITING_QC to create inspection`, 400)
      const open = await tx.jobInspection.findFirst({ where: { jobId, status: { in: OPEN_INSPECTION } }, select: { inspectionNumber: true } })
      if (open) throw new JobMoveRefused(`Inspection ${open.inspectionNumber} is already open for this job. Finish it before starting another.`, 409)
      return tx.jobInspection.create({
        data: {
          inspectionNumber,
          jobId,
          inspectorId: inspectorId || null,
          inspectionType,
          status: inspectorId ? 'IN_PROGRESS' : 'PENDING',
          startedAt: inspectorId ? new Date() : null,
          checklist: checklist || getDefaultChecklist(job.operationType),
          notes,
        },
        include: {
          job: { select: { jobNumber: true, status: true } },
          inspector: { select: { id: true, firstName: true, lastName: true } },
        },
      })
    }) })

    console.log(`[QC] Created inspection ${inspection.inspectionNumber} for job ${job.jobNumber}`)
    res.status(201).json({ success: true, data: inspection })
  } catch (err) {
    if (sendRefusal(res, err, (error) => ({ success: false, error }))) return
    console.error('[QC] Error creating inspection:', err)
    res.status(500).json({ success: false, error: 'Failed to create inspection' })
  }
})

// ── PATCH /inspections/:id ── Update inspection (checklist, notes, etc.) ────
router.patch('/inspections/:id', async (req, res) => {
  try {
    const { inspectorId, checklist, dimensionalChecks, visualNotes, defects, notes, status } = req.body

    const existing = await prisma.jobInspection.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Inspection not found' })
    }
    if (existing.status === 'PASSED' || existing.status === 'FAILED') {
      return res.status(400).json({ success: false, error: 'Cannot update a completed inspection' })
    }

    // The same checks as when an inspection is opened: the inspector must be on file and active,
    // and the checklist and measurements must be lists.
    if (inspectorId) {
      const inspector = await prisma.operator.findUnique({ where: { id: String(inspectorId) }, select: { isActive: true, status: true } }).catch(() => null)
      if (!inspector) return res.status(400).json({ success: false, error: 'That inspector is not on file' })
      if (!inspector.isActive || inspector.status !== 'ACTIVE') return res.status(400).json({ success: false, error: 'That inspector is not active' })
    }
    for (const [name, value] of [['checklist', checklist], ['dimensionalChecks', dimensionalChecks], ['defects', defects]]) {
      if (value !== undefined && value !== null && !Array.isArray(value)) return res.status(400).json({ success: false, error: `${name} must be a list` })
    }
    const updateData = {}
    if (inspectorId !== undefined) updateData.inspectorId = inspectorId || null
    if (checklist !== undefined) updateData.checklist = checklist
    if (dimensionalChecks !== undefined) updateData.dimensionalChecks = dimensionalChecks
    if (visualNotes !== undefined) updateData.visualNotes = visualNotes
    if (defects !== undefined) updateData.defects = defects
    if (notes !== undefined) updateData.notes = notes
    if (status === 'IN_PROGRESS' && existing.status === 'PENDING') {
      updateData.status = 'IN_PROGRESS'
      updateData.startedAt = new Date()
    }

    const updated = await prisma.jobInspection.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        job: { select: { jobNumber: true, status: true } },
        inspector: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    res.json({ success: true, data: updated })
  } catch (err) {
    console.error('[QC] Error updating inspection:', err)
    res.status(500).json({ success: false, error: 'Failed to update inspection' })
  }
})

// ── Decisions ───────────────────────────────────────────────────────────────
// A result and the job's move are one step, decided with the job locked: two people answering the same
// inspection cannot both win, and the job cannot be moved by another screen in between. Who decided is
// written to the audit log (the inspection's "inspector" is the shop-floor person named on it, not the signed-in user).
const DISPOSITIONS = ['USE_AS_IS', 'REWORK', 'SCRAP', 'RETURN', 'SELL_SECONDARY', 'PENDING']
const CONDITIONAL_DISPOSITIONS = ['USE_AS_IS', 'SELL_SECONDARY']
const INSPECTION_INCLUDE = {
  job: { select: { id: true, jobNumber: true } },
  inspector: { select: { id: true, firstName: true, lastName: true } },
}
const refuse = (status, message) => { throw new JobMoveRefused(message, status) }
const sendQc = (res, err) => sendRefusal(res, err, (error) => ({ success: false, error }))

/**
 * decision: { name, open (inspection statuses accepted), jobFrom, to, data(inspection) -> columns, note(inspection), check(inspection) }
 */
async function decide(req, res, decision) {
  const found = await prisma.jobInspection.findUnique({ where: { id: req.params.id }, select: { id: true, jobId: true } })
  if (!found) return res.status(404).json({ success: false, error: 'Inspection not found' })
  const updated = await prisma.$transaction(async (tx) => {
    await lockJob(tx, found.jobId)
    const inspection = await tx.jobInspection.findUnique({ where: { id: found.id }, include: { job: true } })
    if (!decision.open.includes(inspection.status)) refuse(400, decision.closedError || 'Inspection already completed')
    if (!decision.jobFrom.includes(inspection.job.status)) {
      refuse(409, `Job ${inspection.job.jobNumber} is ${inspection.job.status.toLowerCase().replace(/_/g, ' ')}, so this inspection can no longer decide it`)
    }
    const data = decision.data(inspection)
    const saved = await tx.jobInspection.update({ where: { id: inspection.id }, data, include: INSPECTION_INCLUDE })
    await changeJobStatusTx(tx, inspection.jobId, decision.to, {
      data: decision.jobData ? decision.jobData(inspection) : {},
      note: decision.note(inspection), via: 'inspection', userId: req.user?.id,
    })
    await tx.auditLog.create({ data: {
      category: 'WORKFLOW', eventType: 'INSPECTION_DECIDED', severity: decision.to === 'PACKAGING' ? 'INFO' : 'WARNING', action: 'UPDATE',
      userId: req.user?.id || null, resourceType: 'JobInspection', resourceId: inspection.id,
      details: { inspectionNumber: inspection.inspectionNumber, jobId: inspection.jobId, jobNumber: inspection.job.jobNumber, decision: decision.name, result: data.overallResult, disposition: data.disposition, jobMovedTo: decision.to },
    } })
    return saved
  })
  console.log(`[QC] Inspection ${updated.inspectionNumber} ${decision.name} — job ${updated.job.jobNumber} → ${decision.to}`)
  res.json({ success: true, data: updated })
}

// ── POST /inspections/:id/pass ── Pass QC → Job moves to PACKAGING ──────────
router.post('/inspections/:id/pass', async (req, res) => {
  try {
    const { notes, dimensionalChecks, checklist } = req.body || {}
    await decide(req, res, {
      name: 'PASSED', open: OPEN_INSPECTION, jobFrom: ['WAITING_QC'], to: 'PACKAGING',
      data: (inspection) => {
        // An outright pass needs every required check answered as passed and no measurement out of tolerance.
        const list = checklist ?? inspection.checklist
        const blockers = inspectionPassBlockers(list, dimensionalChecks ?? inspection.dimensionalChecks)
        const unanswered = (Array.isArray(list) ? list : []).filter((c) => c?.required && String(c.result || '').toUpperCase() !== 'PASS' && String(c.result || '').toUpperCase() !== 'FAIL')
        if (blockers.length) refuse(409, `This inspection cannot be passed: ${blockers.slice(0, 3).join('; ')}. Fail it, send it for rework, or pass it with conditions.`)
        if (unanswered.length) refuse(409, `This inspection cannot be passed yet: ${unanswered.length} required check${unanswered.length === 1 ? ' has' : 's have'} no result ("${unanswered[0].item || 'required check'}").`)
        return {
          status: 'PASSED', overallResult: 'PASS', disposition: 'USE_AS_IS', completedAt: new Date(),
          ...(notes && { notes }), ...(dimensionalChecks && { dimensionalChecks }), ...(checklist && { checklist }),
        }
      },
      note: (i) => `Inspection ${i.inspectionNumber} passed`,
    })
  } catch (err) {
    if (sendQc(res, err)) return
    console.error('[QC] Error passing inspection:', err)
    res.status(500).json({ success: false, error: 'Failed to pass inspection' })
  }
})

// ── POST /inspections/:id/fail ── Fail QC → Job goes ON_HOLD ────────────────
router.post('/inspections/:id/fail', async (req, res) => {
  try {
    const { notes, defects, disposition = 'PENDING', reworkInstructions } = req.body || {}
    if (!DISPOSITIONS.includes(disposition)) return res.status(400).json({ success: false, error: `disposition must be one of: ${DISPOSITIONS.join(', ')}` })
    await decide(req, res, {
      name: 'FAILED', open: OPEN_INSPECTION, jobFrom: ['WAITING_QC'], to: 'ON_HOLD',
      data: () => ({
        status: 'FAILED', overallResult: 'FAIL', disposition, completedAt: new Date(),
        ...(notes && { notes }), ...(defects && { defects }), ...(reworkInstructions && { reworkInstructions }),
      }),
      note: (i) => `Inspection ${i.inspectionNumber} failed`,
    })
  } catch (err) {
    if (sendQc(res, err)) return
    console.error('[QC] Error failing inspection:', err)
    res.status(500).json({ success: false, error: 'Failed to fail inspection' })
  }
})

// ── POST /inspections/:id/rework ── Rework → Job back to SCHEDULED ──────────
// The job goes back to the floor. It owes a new inspection: it cannot be packed or shipped until one passes.
router.post('/inspections/:id/rework', async (req, res) => {
  try {
    const { reworkInstructions, notes } = req.body || {}
    const instructions = reworkInstructions || 'Rework required per QC inspector'
    await decide(req, res, {
      name: 'REWORK', open: [...OPEN_INSPECTION, 'FAILED'], closedError: 'Cannot rework a passed inspection', jobFrom: ['WAITING_QC', 'ON_HOLD'], to: 'SCHEDULED',
      data: (inspection) => ({
        status: 'FAILED', overallResult: 'FAIL', disposition: 'REWORK', completedAt: inspection.completedAt || new Date(),
        reworkInstructions: instructions, ...(notes && { notes }),
      }),
      jobData: (inspection) => ({ notes: `REWORK: ${instructions}${inspection.job.notes ? '\n\n' + inspection.job.notes : ''}` }),
      note: (i) => `Inspection ${i.inspectionNumber}: rework`,
    })
  } catch (err) {
    if (sendQc(res, err)) return
    console.error('[QC] Error reworking inspection:', err)
    res.status(500).json({ success: false, error: 'Failed to send for rework' })
  }
})

// ── POST /inspections/:id/conditional ── Conditional pass ───────────────────
router.post('/inspections/:id/conditional', async (req, res) => {
  try {
    const { notes, conditions, disposition = 'USE_AS_IS' } = req.body || {}
    if (!DISPOSITIONS.includes(disposition)) return res.status(400).json({ success: false, error: `disposition must be one of: ${DISPOSITIONS.join(', ')}` })
    if (typeof conditions !== 'string' || !conditions.trim()) return res.status(400).json({ success: false, error: 'State the conditions this material is accepted under' })
    // A conditional pass sends the job on to packaging, so it cannot carry a disposition that says the material is not going on.
    if (!CONDITIONAL_DISPOSITIONS.includes(disposition)) return res.status(400).json({ success: false, error: `A conditional pass sends the job to packaging, so its disposition must be one of: ${CONDITIONAL_DISPOSITIONS.join(', ')}. To rework, scrap or return the material, fail the inspection.` })
    await decide(req, res, {
      name: 'CONDITIONAL', open: OPEN_INSPECTION, jobFrom: ['WAITING_QC'], to: 'PACKAGING',
      // The inspector's earlier notes are kept under the conditions (they used to be overwritten).
      data: (inspection) => ({
        status: 'PASSED', overallResult: 'CONDITIONAL', disposition, completedAt: new Date(),
        notes: [`CONDITIONAL PASS: ${conditions.trim()}`, notes, inspection.notes].filter((t) => typeof t === 'string' && t.trim()).join('\n'),
      }),
      note: (i) => `Inspection ${i.inspectionNumber} passed with conditions`,
    })
  } catch (err) {
    if (sendQc(res, err)) return
    console.error('[QC] Error conditional pass:', err)
    res.status(500).json({ success: false, error: 'Failed to set conditional pass' })
  }
})

// ── GET /inspectors ── List available inspectors (operators) ────────────────
router.get('/inspectors', async (req, res) => {
  try {
    const operators = await prisma.operator.findMany({
      where: { isActive: true, status: 'ACTIVE' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true,
        homeWorkCenter: { select: { name: true } },
      },
      orderBy: { lastName: 'asc' },
    })

    res.json({ success: true, data: operators })
  } catch (err) {
    console.error('[QC] Error fetching inspectors:', err)
    res.status(500).json({ success: false, error: 'Failed to fetch inspectors' })
  }
})

// ── Default Checklist by Operation Type ─────────────────────────────────────
function getDefaultChecklist(operationType) {
  const baseItems = [
    { item: 'Visual inspection — no visible defects', required: true, result: null, notes: '' },
    { item: 'Dimensions within tolerance', required: true, result: null, notes: '' },
    { item: 'Surface finish acceptable', required: true, result: null, notes: '' },
    { item: 'Material identification verified', required: true, result: null, notes: '' },
    { item: 'Paperwork complete and accurate', required: true, result: null, notes: '' },
  ]

  const typeSpecific = {
    SLITTING: [
      { item: 'Width within spec (±0.005")', required: true, result: null, notes: '' },
      { item: 'Burr height acceptable', required: true, result: null, notes: '' },
      { item: 'Edge condition — no camber', required: true, result: null, notes: '' },
      { item: 'Coil ID/OD within spec', required: false, result: null, notes: '' },
    ],
    SHEARING: [
      { item: 'Length within spec (±1/16")', required: true, result: null, notes: '' },
      { item: 'Squareness verified', required: true, result: null, notes: '' },
      { item: 'No edge cracking', required: true, result: null, notes: '' },
    ],
    LEVELING: [
      { item: 'Flatness within spec (I-unit)', required: true, result: null, notes: '' },
      { item: 'No surface marks from leveler', required: true, result: null, notes: '' },
    ],
    CUTTING: [
      { item: 'Cut length within tolerance', required: true, result: null, notes: '' },
      { item: 'Cut edge quality acceptable', required: true, result: null, notes: '' },
      { item: 'No heat discoloration', required: true, result: null, notes: '' },
    ],
    BLANKING: [
      { item: 'Blank dimensions within spec', required: true, result: null, notes: '' },
      { item: 'Burr within allowable limits', required: true, result: null, notes: '' },
      { item: 'Piece count verified', required: true, result: null, notes: '' },
    ],
  }

  return [...baseItems, ...(typeSpecific[operationType] || [])]
}

export default router
