import { Router } from 'express'
import prisma from '../lib/db.js'

const router = Router()

// ============================================================================
// OPERATORS CRUD
// ============================================================================

/**
 * GET /api/staff/operators
 * List operators with optional filters
 */
router.get('/operators', async (req, res) => {
  try {
    const { status, locationId, workCenterTypeId, search, includeInactive } = req.query

    const where = {}

    // Status filter
    if (status) {
      where.status = status
    }

    // Active filter (default: active only)
    if (includeInactive !== 'true') {
      where.isActive = true
    }

    // Location filter
    if (locationId) {
      where.homeLocationId = locationId
    }

    // Work center type filter (operators who have that skill)
    if (workCenterTypeId) {
      where.skills = {
        some: {
          workCenterTypeId,
          isActive: true,
        },
      }
    }

    // Name search
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const operators = await prisma.operator.findMany({
      where,
      include: {
        skills: {
          where: { isActive: true },
          orderBy: { workCenterTypeId: 'asc' },
        },
        homeLocation: {
          select: { id: true, code: true, name: true },
        },
        homeWorkCenter: {
          select: { id: true, code: true, name: true, type: true },
        },
        user: {
          select: { id: true, email: true, role: true },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    })

    res.json({ success: true, data: operators, total: operators.length })
  } catch (error) {
    console.error('Error fetching operators:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch operators' })
  }
})

/**
 * GET /api/staff/operators/:id
 * Get single operator with full details
 */
router.get('/operators/:id', async (req, res) => {
  try {
    const operator = await prisma.operator.findUnique({
      where: { id: req.params.id },
      include: {
        skills: {
          orderBy: { workCenterTypeId: 'asc' },
        },
        shifts: {
          where: { shiftDate: { gte: new Date() } },
          orderBy: { shiftDate: 'asc' },
          take: 20,
        },
        homeLocation: {
          select: { id: true, code: true, name: true },
        },
        homeWorkCenter: {
          select: { id: true, code: true, name: true, type: true },
        },
        user: {
          select: { id: true, email: true, role: true, firstName: true, lastName: true },
        },
      },
    })

    if (!operator) {
      return res.status(404).json({ success: false, error: 'Operator not found' })
    }

    res.json({ success: true, data: operator })
  } catch (error) {
    console.error('Error fetching operator:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch operator' })
  }
})

/**
 * POST /api/staff/operators
 * Create a new operator
 */
router.post('/operators', async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone,
      homeLocationId, homeWorkCenterId, hireDate,
      maxThicknessInches, hourlyRate, overtimeMultiplier,
      notes, emergencyContactName, emergencyContactPhone,
      userId, skills,
    } = req.body

    if (!firstName || !lastName) {
      return res.status(400).json({ success: false, error: 'firstName and lastName are required' })
    }

    // Generate employee code (OP-XXXX)
    const lastOp = await prisma.operator.findFirst({
      orderBy: { employeeCode: 'desc' },
      where: { employeeCode: { startsWith: 'OP-' } },
      select: { employeeCode: true },
    })
    let nextNum = 1
    if (lastOp) {
      const match = lastOp.employeeCode.match(/OP-(\d+)/)
      if (match) nextNum = parseInt(match[1], 10) + 1
    }
    const employeeCode = `OP-${String(nextNum).padStart(4, '0')}`

    // Check for duplicate userId link
    if (userId) {
      const existingLink = await prisma.operator.findUnique({ where: { userId } })
      if (existingLink) {
        return res.status(409).json({
          success: false,
          error: 'This user account is already linked to another operator',
        })
      }
    }

    // Validate location exists
    if (homeLocationId) {
      const loc = await prisma.location.findUnique({ where: { id: homeLocationId } })
      if (!loc) {
        return res.status(400).json({ success: false, error: 'Invalid homeLocationId' })
      }
    }

    // Validate work center exists
    if (homeWorkCenterId) {
      const wc = await prisma.workCenter.findUnique({ where: { id: homeWorkCenterId } })
      if (!wc) {
        return res.status(400).json({ success: false, error: 'Invalid homeWorkCenterId' })
      }
    }

    const operator = await prisma.operator.create({
      data: {
        employeeCode,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        homeLocationId: homeLocationId || null,
        homeWorkCenterId: homeWorkCenterId || null,
        hireDate: hireDate ? new Date(hireDate) : null,
        maxThicknessInches: maxThicknessInches || null,
        hourlyRate: hourlyRate || null,
        overtimeMultiplier: overtimeMultiplier || 1.5,
        notes: notes || null,
        emergencyContactName: emergencyContactName || null,
        emergencyContactPhone: emergencyContactPhone || null,
        userId: userId || null,
        // Create skills inline if provided
        skills: skills?.length
          ? {
              create: skills.map((s) => ({
                workCenterTypeId: s.workCenterTypeId,
                skillLevel: s.skillLevel || 'STANDARD',
                certifiedDate: s.certifiedDate ? new Date(s.certifiedDate) : new Date(),
                expiresAt: s.expiresAt ? new Date(s.expiresAt) : null,
                certificationRef: s.certificationRef || null,
              })),
            }
          : undefined,
      },
      include: {
        skills: true,
        homeLocation: { select: { id: true, code: true, name: true } },
        homeWorkCenter: { select: { id: true, code: true, name: true, type: true } },
      },
    })

    res.status(201).json({ success: true, data: operator })
  } catch (error) {
    console.error('Error creating operator:', error)
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'Duplicate employee code or user link' })
    }
    res.status(500).json({ success: false, error: 'Failed to create operator' })
  }
})

/**
 * PATCH /api/staff/operators/:id
 * Update an operator
 */
router.patch('/operators/:id', async (req, res) => {
  try {
    const existing = await prisma.operator.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Operator not found' })
    }

    const {
      firstName, lastName, email, phone,
      homeLocationId, homeWorkCenterId, hireDate, status,
      maxThicknessInches, hourlyRate, overtimeMultiplier,
      notes, emergencyContactName, emergencyContactPhone,
      userId, isActive,
    } = req.body

    const data = {}
    if (firstName !== undefined) data.firstName = firstName.trim()
    if (lastName !== undefined) data.lastName = lastName.trim()
    if (email !== undefined) data.email = email?.trim() || null
    if (phone !== undefined) data.phone = phone?.trim() || null
    if (homeLocationId !== undefined) data.homeLocationId = homeLocationId || null
    if (homeWorkCenterId !== undefined) data.homeWorkCenterId = homeWorkCenterId || null
    if (hireDate !== undefined) data.hireDate = hireDate ? new Date(hireDate) : null
    if (status !== undefined) data.status = status
    if (maxThicknessInches !== undefined) data.maxThicknessInches = maxThicknessInches
    if (hourlyRate !== undefined) data.hourlyRate = hourlyRate
    if (overtimeMultiplier !== undefined) data.overtimeMultiplier = overtimeMultiplier
    if (notes !== undefined) data.notes = notes
    if (emergencyContactName !== undefined) data.emergencyContactName = emergencyContactName
    if (emergencyContactPhone !== undefined) data.emergencyContactPhone = emergencyContactPhone
    if (userId !== undefined) data.userId = userId || null
    if (isActive !== undefined) data.isActive = isActive

    const updated = await prisma.operator.update({
      where: { id: req.params.id },
      data,
      include: {
        skills: { where: { isActive: true } },
        homeLocation: { select: { id: true, code: true, name: true } },
        homeWorkCenter: { select: { id: true, code: true, name: true, type: true } },
      },
    })

    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error updating operator:', error)
    res.status(500).json({ success: false, error: 'Failed to update operator' })
  }
})

/**
 * DELETE /api/staff/operators/:id
 * Soft-delete (deactivate) an operator
 */
router.delete('/operators/:id', async (req, res) => {
  try {
    const existing = await prisma.operator.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Operator not found' })
    }

    const deactivated = await prisma.operator.update({
      where: { id: req.params.id },
      data: { isActive: false, status: 'TERMINATED' },
    })

    res.json({ success: true, data: deactivated })
  } catch (error) {
    console.error('Error deactivating operator:', error)
    res.status(500).json({ success: false, error: 'Failed to deactivate operator' })
  }
})

// ============================================================================
// OPERATOR SKILLS CRUD
// ============================================================================

/**
 * GET /api/staff/operators/:id/skills
 * Get all skills for an operator
 */
router.get('/operators/:id/skills', async (req, res) => {
  try {
    const skills = await prisma.operatorSkill.findMany({
      where: { operatorId: req.params.id },
      orderBy: { workCenterTypeId: 'asc' },
    })
    res.json({ success: true, data: skills })
  } catch (error) {
    console.error('Error fetching operator skills:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch skills' })
  }
})

/**
 * POST /api/staff/operators/:id/skills
 * Add a skill/certification to an operator
 */
router.post('/operators/:id/skills', async (req, res) => {
  try {
    const { workCenterTypeId, skillLevel, certifiedDate, expiresAt, certificationRef } = req.body

    if (!workCenterTypeId) {
      return res.status(400).json({ success: false, error: 'workCenterTypeId is required' })
    }

    // Validate operator exists
    const op = await prisma.operator.findUnique({ where: { id: req.params.id } })
    if (!op) {
      return res.status(404).json({ success: false, error: 'Operator not found' })
    }

    // Validate work center type exists
    const wct = await prisma.workCenterType.findUnique({ where: { id: workCenterTypeId } })
    if (!wct || !wct.isActive) {
      return res.status(400).json({ success: false, error: 'Invalid or inactive work center type' })
    }

    // Upsert: if skill exists, reactivate & update; else create
    const skill = await prisma.operatorSkill.upsert({
      where: {
        operatorId_workCenterTypeId: {
          operatorId: req.params.id,
          workCenterTypeId,
        },
      },
      update: {
        skillLevel: skillLevel || 'STANDARD',
        certifiedDate: certifiedDate ? new Date(certifiedDate) : new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        certificationRef: certificationRef || null,
        isActive: true,
      },
      create: {
        operatorId: req.params.id,
        workCenterTypeId,
        skillLevel: skillLevel || 'STANDARD',
        certifiedDate: certifiedDate ? new Date(certifiedDate) : new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        certificationRef: certificationRef || null,
      },
    })

    res.status(201).json({ success: true, data: skill })
  } catch (error) {
    console.error('Error adding operator skill:', error)
    res.status(500).json({ success: false, error: 'Failed to add skill' })
  }
})

/**
 * PATCH /api/staff/operators/:operatorId/skills/:skillId
 * Update a skill
 */
router.patch('/operators/:operatorId/skills/:skillId', async (req, res) => {
  try {
    const { skillLevel, certifiedDate, expiresAt, certificationRef, isActive } = req.body

    const existing = await prisma.operatorSkill.findFirst({
      where: { id: req.params.skillId, operatorId: req.params.operatorId },
    })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Skill not found' })
    }

    const data = {}
    if (skillLevel !== undefined) data.skillLevel = skillLevel
    if (certifiedDate !== undefined) data.certifiedDate = new Date(certifiedDate)
    if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null
    if (certificationRef !== undefined) data.certificationRef = certificationRef
    if (isActive !== undefined) data.isActive = isActive

    const updated = await prisma.operatorSkill.update({
      where: { id: req.params.skillId },
      data,
    })

    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error updating skill:', error)
    res.status(500).json({ success: false, error: 'Failed to update skill' })
  }
})

/**
 * DELETE /api/staff/operators/:operatorId/skills/:skillId
 * Remove (deactivate) a skill
 */
router.delete('/operators/:operatorId/skills/:skillId', async (req, res) => {
  try {
    const existing = await prisma.operatorSkill.findFirst({
      where: { id: req.params.skillId, operatorId: req.params.operatorId },
    })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Skill not found' })
    }

    await prisma.operatorSkill.update({
      where: { id: req.params.skillId },
      data: { isActive: false },
    })

    res.json({ success: true, message: 'Skill removed' })
  } catch (error) {
    console.error('Error removing skill:', error)
    res.status(500).json({ success: false, error: 'Failed to remove skill' })
  }
})

// ============================================================================
// SHIFTS CRUD
// ============================================================================

/**
 * GET /api/staff/shifts
 * List shifts with optional filters
 */
router.get('/shifts', async (req, res) => {
  try {
    const { operatorId, locationId, date, dateFrom, dateTo, status, shiftType } = req.query

    const where = {}
    if (operatorId) where.operatorId = operatorId
    if (locationId) where.locationId = locationId
    if (status) where.status = status
    if (shiftType) where.shiftType = shiftType

    if (date) {
      const d = new Date(date)
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
      where.shiftDate = { gte: start, lt: end }
    } else if (dateFrom || dateTo) {
      where.shiftDate = {}
      if (dateFrom) where.shiftDate.gte = new Date(dateFrom)
      if (dateTo) where.shiftDate.lte = new Date(dateTo)
    }

    const shifts = await prisma.shift.findMany({
      where,
      include: {
        operator: {
          select: { id: true, employeeCode: true, firstName: true, lastName: true },
        },
      },
      orderBy: [{ shiftDate: 'asc' }, { startTime: 'asc' }],
    })

    res.json({ success: true, data: shifts, total: shifts.length })
  } catch (error) {
    console.error('Error fetching shifts:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch shifts' })
  }
})

/**
 * POST /api/staff/shifts
 * Create a shift
 */
router.post('/shifts', async (req, res) => {
  try {
    const {
      operatorId, locationId, workCenterId,
      shiftDate, startTime, endTime,
      shiftType, breakMinutes, notes,
    } = req.body

    if (!operatorId || !shiftDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'operatorId, shiftDate, startTime, and endTime are required',
      })
    }

    // Validate operator
    const op = await prisma.operator.findUnique({ where: { id: operatorId } })
    if (!op) {
      return res.status(400).json({ success: false, error: 'Invalid operatorId' })
    }

    const shift = await prisma.shift.create({
      data: {
        operatorId,
        locationId: locationId || null,
        workCenterId: workCenterId || null,
        shiftDate: new Date(shiftDate),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        shiftType: shiftType || 'DAY',
        breakMinutes: breakMinutes ?? 30,
        notes: notes || null,
      },
      include: {
        operator: {
          select: { id: true, employeeCode: true, firstName: true, lastName: true },
        },
      },
    })

    res.status(201).json({ success: true, data: shift })
  } catch (error) {
    console.error('Error creating shift:', error)
    res.status(500).json({ success: false, error: 'Failed to create shift' })
  }
})

/**
 * PATCH /api/staff/shifts/:id
 * Update a shift
 */
router.patch('/shifts/:id', async (req, res) => {
  try {
    const existing = await prisma.shift.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Shift not found' })
    }

    const {
      operatorId, locationId, workCenterId,
      shiftDate, startTime, endTime,
      shiftType, breakMinutes, status, notes,
    } = req.body

    const data = {}
    if (operatorId !== undefined) data.operatorId = operatorId
    if (locationId !== undefined) data.locationId = locationId || null
    if (workCenterId !== undefined) data.workCenterId = workCenterId || null
    if (shiftDate !== undefined) data.shiftDate = new Date(shiftDate)
    if (startTime !== undefined) data.startTime = new Date(startTime)
    if (endTime !== undefined) data.endTime = new Date(endTime)
    if (shiftType !== undefined) data.shiftType = shiftType
    if (breakMinutes !== undefined) data.breakMinutes = breakMinutes
    if (status !== undefined) data.status = status
    if (notes !== undefined) data.notes = notes

    const updated = await prisma.shift.update({
      where: { id: req.params.id },
      data,
      include: {
        operator: {
          select: { id: true, employeeCode: true, firstName: true, lastName: true },
        },
      },
    })

    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error updating shift:', error)
    res.status(500).json({ success: false, error: 'Failed to update shift' })
  }
})

/**
 * DELETE /api/staff/shifts/:id
 * Cancel a shift
 */
router.delete('/shifts/:id', async (req, res) => {
  try {
    const existing = await prisma.shift.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Shift not found' })
    }

    const cancelled = await prisma.shift.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    })

    res.json({ success: true, data: cancelled })
  } catch (error) {
    console.error('Error cancelling shift:', error)
    res.status(500).json({ success: false, error: 'Failed to cancel shift' })
  }
})

// ============================================================================
// UTILITY ENDPOINTS
// ============================================================================

/**
 * GET /api/staff/stats
 * Dashboard stats for staff
 */
router.get('/stats', async (req, res) => {
  try {
    const [totalOperators, activeOperators, onLeave, totalSkills, todayShifts] =
      await Promise.all([
        prisma.operator.count(),
        prisma.operator.count({ where: { isActive: true, status: 'ACTIVE' } }),
        prisma.operator.count({ where: { status: 'ON_LEAVE' } }),
        prisma.operatorSkill.count({ where: { isActive: true } }),
        prisma.shift.count({
          where: {
            shiftDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(24, 0, 0, 0)),
            },
            status: { in: ['SCHEDULED', 'ACTIVE'] },
          },
        }),
      ])

    res.json({
      success: true,
      data: { totalOperators, activeOperators, onLeave, totalSkills, todayShifts },
    })
  } catch (error) {
    console.error('Error fetching staff stats:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch stats' })
  }
})

/**
 * GET /api/staff/available
 * Get operators available for a given work center type and date
 */
router.get('/available', async (req, res) => {
  try {
    const { workCenterTypeId, date, locationId } = req.query

    if (!workCenterTypeId) {
      return res.status(400).json({ success: false, error: 'workCenterTypeId is required' })
    }

    const where = {
      isActive: true,
      status: 'ACTIVE',
      skills: {
        some: {
          workCenterTypeId,
          isActive: true,
        },
      },
    }

    if (locationId) {
      where.homeLocationId = locationId
    }

    const operators = await prisma.operator.findMany({
      where,
      include: {
        skills: {
          where: { workCenterTypeId, isActive: true },
        },
        homeLocation: { select: { id: true, code: true, name: true } },
        homeWorkCenter: { select: { id: true, code: true, name: true } },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    })

    // If date is provided, annotate with shift info
    if (date) {
      const d = new Date(date)
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

      const shifts = await prisma.shift.findMany({
        where: {
          operatorId: { in: operators.map((o) => o.id) },
          shiftDate: { gte: dayStart, lt: dayEnd },
          status: { in: ['SCHEDULED', 'ACTIVE'] },
        },
      })

      const shiftMap = {}
      for (const s of shifts) {
        if (!shiftMap[s.operatorId]) shiftMap[s.operatorId] = []
        shiftMap[s.operatorId].push(s)
      }

      const enriched = operators.map((op) => ({
        ...op,
        scheduledShifts: shiftMap[op.id] || [],
        isScheduled: !!shiftMap[op.id]?.length,
      }))

      return res.json({ success: true, data: enriched })
    }

    res.json({ success: true, data: operators })
  } catch (error) {
    console.error('Error fetching available operators:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch available operators' })
  }
})

export default router
