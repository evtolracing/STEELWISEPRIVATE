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

const router = express.Router()

// ── Helper: Generate inspection number ──────────────────────────────────────
async function nextInspectionNumber() {
  const count = await prisma.jobInspection.count()
  return `INS-${String(count + 1).padStart(5, '0')}`
}

// ── GET /queue ── Jobs waiting for QC inspection ────────────────────────────
router.get('/queue', async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      where: { status: 'WAITING_QC' },
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
      orderBy: [{ priority: 'asc' }, { updatedAt: 'asc' }],
    })

    res.json({ success: true, data: jobs })
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

    const passRate = passedToday + failedToday > 0
      ? Math.round((passedToday / (passedToday + failedToday)) * 100)
      : 100

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

    // Verify job exists and is in WAITING_QC status
    const job = await prisma.job.findUnique({ where: { id: jobId } })
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' })
    }
    if (job.status !== 'WAITING_QC') {
      return res.status(400).json({
        success: false,
        error: `Job is in ${job.status} status, must be WAITING_QC to create inspection`,
      })
    }

    const inspectionNumber = await nextInspectionNumber()

    const inspection = await prisma.jobInspection.create({
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

    console.log(`[QC] Created inspection ${inspectionNumber} for job ${job.jobNumber}`)
    res.status(201).json({ success: true, data: inspection })
  } catch (err) {
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

    const updateData = {}
    if (inspectorId !== undefined) updateData.inspectorId = inspectorId
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

// ── POST /inspections/:id/pass ── Pass QC → Job moves to PACKAGING ──────────
router.post('/inspections/:id/pass', async (req, res) => {
  try {
    const { notes, dimensionalChecks, checklist } = req.body

    const inspection = await prisma.jobInspection.findUnique({
      where: { id: req.params.id },
      include: { job: true },
    })
    if (!inspection) {
      return res.status(404).json({ success: false, error: 'Inspection not found' })
    }
    if (inspection.status === 'PASSED' || inspection.status === 'FAILED') {
      return res.status(400).json({ success: false, error: 'Inspection already completed' })
    }

    // Update inspection
    const updated = await prisma.jobInspection.update({
      where: { id: req.params.id },
      data: {
        status: 'PASSED',
        overallResult: 'PASS',
        disposition: 'USE_AS_IS',
        completedAt: new Date(),
        ...(notes && { notes }),
        ...(dimensionalChecks && { dimensionalChecks }),
        ...(checklist && { checklist }),
      },
      include: {
        job: { select: { id: true, jobNumber: true } },
        inspector: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    // Advance job to PACKAGING
    await prisma.job.update({
      where: { id: inspection.jobId },
      data: { status: 'PACKAGING' },
    })

    console.log(`[QC] Inspection ${inspection.inspectionNumber} PASSED — job ${inspection.job.jobNumber} → PACKAGING`)
    res.json({ success: true, data: updated })
  } catch (err) {
    console.error('[QC] Error passing inspection:', err)
    res.status(500).json({ success: false, error: 'Failed to pass inspection' })
  }
})

// ── POST /inspections/:id/fail ── Fail QC → Job goes ON_HOLD ────────────────
router.post('/inspections/:id/fail', async (req, res) => {
  try {
    const { notes, defects, disposition = 'PENDING', reworkInstructions } = req.body

    const inspection = await prisma.jobInspection.findUnique({
      where: { id: req.params.id },
      include: { job: true },
    })
    if (!inspection) {
      return res.status(404).json({ success: false, error: 'Inspection not found' })
    }
    if (inspection.status === 'PASSED' || inspection.status === 'FAILED') {
      return res.status(400).json({ success: false, error: 'Inspection already completed' })
    }

    // Update inspection
    const updated = await prisma.jobInspection.update({
      where: { id: req.params.id },
      data: {
        status: 'FAILED',
        overallResult: 'FAIL',
        disposition,
        completedAt: new Date(),
        ...(notes && { notes }),
        ...(defects && { defects }),
        ...(reworkInstructions && { reworkInstructions }),
      },
      include: {
        job: { select: { id: true, jobNumber: true } },
        inspector: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    // Put job on hold
    await prisma.job.update({
      where: { id: inspection.jobId },
      data: { status: 'ON_HOLD' },
    })

    console.log(`[QC] Inspection ${inspection.inspectionNumber} FAILED — job ${inspection.job.jobNumber} → ON_HOLD`)
    res.json({ success: true, data: updated })
  } catch (err) {
    console.error('[QC] Error failing inspection:', err)
    res.status(500).json({ success: false, error: 'Failed to fail inspection' })
  }
})

// ── POST /inspections/:id/rework ── Rework → Job back to SCHEDULED ──────────
router.post('/inspections/:id/rework', async (req, res) => {
  try {
    const { reworkInstructions, notes } = req.body

    const inspection = await prisma.jobInspection.findUnique({
      where: { id: req.params.id },
      include: { job: true },
    })
    if (!inspection) {
      return res.status(404).json({ success: false, error: 'Inspection not found' })
    }
    if (inspection.status === 'PASSED') {
      return res.status(400).json({ success: false, error: 'Cannot rework a passed inspection' })
    }

    // Update inspection
    const updated = await prisma.jobInspection.update({
      where: { id: req.params.id },
      data: {
        status: 'FAILED',
        overallResult: 'FAIL',
        disposition: 'REWORK',
        completedAt: new Date(),
        reworkInstructions: reworkInstructions || 'Rework required per QC inspector',
        ...(notes && { notes }),
      },
      include: {
        job: { select: { id: true, jobNumber: true } },
        inspector: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    // Send job back to SCHEDULED for re-planning
    await prisma.job.update({
      where: { id: inspection.jobId },
      data: {
        status: 'SCHEDULED',
        notes: `REWORK: ${reworkInstructions || 'Rework required per QC inspector'}${inspection.job.notes ? '\n\n' + inspection.job.notes : ''}`,
      },
    })

    console.log(`[QC] Inspection ${inspection.inspectionNumber} REWORK — job ${inspection.job.jobNumber} → SCHEDULED`)
    res.json({ success: true, data: updated })
  } catch (err) {
    console.error('[QC] Error reworking inspection:', err)
    res.status(500).json({ success: false, error: 'Failed to send for rework' })
  }
})

// ── POST /inspections/:id/conditional ── Conditional pass ───────────────────
router.post('/inspections/:id/conditional', async (req, res) => {
  try {
    const { notes, conditions, disposition = 'USE_AS_IS' } = req.body

    const inspection = await prisma.jobInspection.findUnique({
      where: { id: req.params.id },
      include: { job: true },
    })
    if (!inspection) {
      return res.status(404).json({ success: false, error: 'Inspection not found' })
    }
    if (inspection.status === 'PASSED' || inspection.status === 'FAILED') {
      return res.status(400).json({ success: false, error: 'Inspection already completed' })
    }

    const updated = await prisma.jobInspection.update({
      where: { id: req.params.id },
      data: {
        status: 'PASSED',
        overallResult: 'CONDITIONAL',
        disposition,
        completedAt: new Date(),
        notes: `CONDITIONAL PASS: ${conditions || ''}\n${notes || ''}`.trim(),
      },
      include: {
        job: { select: { id: true, jobNumber: true } },
        inspector: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    // Advance job to PACKAGING (conditional pass still moves forward)
    await prisma.job.update({
      where: { id: inspection.jobId },
      data: { status: 'PACKAGING' },
    })

    console.log(`[QC] Inspection ${inspection.inspectionNumber} CONDITIONAL — job ${inspection.job.jobNumber} → PACKAGING`)
    res.json({ success: true, data: updated })
  } catch (err) {
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
