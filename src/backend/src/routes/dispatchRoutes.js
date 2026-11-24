/**
 * Dispatch Engine Routes
 * Handles automatic assignment of job operations to work centers and operators
 * 
 * All data is persisted to Supabase via Prisma:
 * Work Centers, Locations, Operators, DispatchJobs, DispatchOperations
 * Work Center Types & Divisions: In-memory registries — configuration
 */

import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import prisma from '../lib/db.js'
import { divisions as DEFAULT_DIVISIONS } from '../data/dispatchData.js'
import { changeError, lockedOut } from '../lib/workCenterGuard.js'
import { planAssignments, SCHEDULABLE_JOB_STATUSES, PRIORITY_ORDER, SKILL_ORDER } from '../lib/dispatchPlan.js'

import { currentScope, acrossBranches } from '../lib/branchScope.js'
import { branchWorkCenterCode, typedWorkCenterCode } from '../lib/workCenterCode.js'
import { Prisma } from '@prisma/client'
import { readKindRules } from '../lib/workCenterKindRules.js'
import { can } from '../lib/roleStore.js'
import { clockOf } from '../lib/timeEntries.js'
import { planLights } from '../lib/productionView.js'
import { stepDetailText } from '../lib/planDetails.js';
const router = express.Router()

/** The labor rate of a kind of work center is cost: it goes only to the roles that manage cost. */
const kindForViewer = (req, kind) => {
  if (!kind || can(req, 'inventory:viewCost')) return kind
  const { hourlyRate: _hourlyRate, ...rest } = kind
  return rest
}

// ============================================================================
// PRISMA ↔ DISPATCH FIELD MAPPING
// ============================================================================

/**
 * Convert a Prisma WorkCenter record to the dispatch-engine shape
 * the frontend expects (workCenterType, division, isOnline, maxThicknessInches)
 */
function mapPrismaWC(wc) {
  const cap = wc.capacity || {}
  return {
    id: wc.id,
    code: wc.code,
    name: wc.name,
    locationId: wc.locationId,
    // Shown as stored. A work center with no type, division or thickness limit on file is shown without one
    // (it used to be shown as a metals saw good to 12 inches).
    workCenterType: wc.type || null,
    division: cap.division || null,
    capabilities: wc.capabilities || [],
    maxThicknessInches: cap.maxThicknessInches ?? null,
    isOnline: wc.isActive !== false,
    isActive: wc.isActive !== false,
    createdAt: wc.createdAt,
    updatedAt: wc.updatedAt,
    location: wc.location || null,
  }
}

/**
 * Convert a Prisma Location record to the simple shape the frontend expects
 */
function mapPrismaLocation(loc) {
  return {
    id: loc.id,
    code: loc.code,
    name: loc.name,
    address: [loc.addressLine1, loc.city, loc.state, loc.postalCode]
      .filter(Boolean)
      .join(', '),
    type: loc.type,
    isActive: loc.isActive,
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// ============================================================================
// ROUTES
// ============================================================================

// ──────────────────────────────────────────────────────────────────────────────
// WORK CENTER TYPES — Dynamic Registry CRUD
// ──────────────────────────────────────────────────────────────────────────────

/**
 * GET /v1/dispatch/work-center-types
 * List all work center types (persistent in Supabase)
 */
router.get('/work-center-types', async (req, res) => {
  try {
    const { activeOnly } = req.query
    const where = activeOnly === 'true' ? { isActive: true } : {}
    const types = await prisma.workCenterType.findMany({
      where,
      orderBy: { label: 'asc' },
    })
    res.json({ success: true, data: types.map((t) => kindForViewer(req, t)) })
  } catch (error) {
    console.error('Error fetching work center types:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch work center types' })
  }
})

/**
 * GET /v1/dispatch/work-center-types/:id
 * Get a single work center type
 */
router.get('/work-center-types/:id', async (req, res) => {
  try {
    const wct = await prisma.workCenterType.findUnique({ where: { id: req.params.id } })
    if (!wct) {
      return res.status(404).json({ success: false, error: 'Work center type not found' })
    }
    res.json({ success: true, data: kindForViewer(req, wct) })
  } catch (error) {
    console.error('Error fetching work center type:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch work center type' })
  }
})

/**
 * POST /v1/dispatch/work-center-types
 * Create a new work center type
 */
router.post('/work-center-types', async (req, res) => {
  try {
    const { id, label, icon, color, description, divisions: divs } = req.body

    if (!id || !label) {
      return res.status(400).json({ success: false, error: 'id and label are required' })
    }

    const normalizedId = id.toUpperCase().replace(/[^A-Z0-9_]/g, '_')
    const rules = readKindRules(req.body, { mayCost: can(req, 'inventory:viewCost') })
    if (rules.error) return res.status(rules.status).json({ success: false, error: rules.error })

    // Check for existing
    const existing = await prisma.workCenterType.findUnique({ where: { id: normalizedId } })
    if (existing) {
      return res.status(409).json({ success: false, error: `Work center type '${normalizedId}' already exists` })
    }

    const newType = await prisma.workCenterType.create({
      data: {
        id: normalizedId,
        label: label.trim(),
        icon: icon || 'Settings',
        color: color || '#666666',
        description: description || '',
        divisions: divs || [],
        isActive: true,
        ...rules.data,
        ...(rules.data.inspectionChecklist === null && { inspectionChecklist: Prisma.DbNull }),
      },
    })

    res.status(201).json({ success: true, data: kindForViewer(req, newType) })
  } catch (error) {
    console.error('Error creating work center type:', error)
    res.status(500).json({ success: false, error: 'Failed to create work center type' })
  }
})

/**
 * PATCH /v1/dispatch/work-center-types/:id
 * Update a work center type
 */
router.patch('/work-center-types/:id', async (req, res) => {
  try {
    const existing = await prisma.workCenterType.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Work center type not found' })
    }

    const { label, icon, color, description, divisions: divs, isActive } = req.body
    const data = {}
    if (label !== undefined) data.label = label.trim()
    if (icon !== undefined) data.icon = icon
    if (color !== undefined) data.color = color
    if (description !== undefined) data.description = description
    if (divs !== undefined) data.divisions = divs
    if (isActive !== undefined) data.isActive = isActive
    // Rules and rate for this kind of work: certification, two steps at once, labor rate, inspection checklist.
    const rules = readKindRules(req.body, { mayCost: can(req, 'inventory:viewCost') })
    if (rules.error) return res.status(rules.status).json({ success: false, error: rules.error })
    Object.assign(data, rules.data)
    if (data.inspectionChecklist === null) data.inspectionChecklist = Prisma.DbNull

    const updated = await prisma.workCenterType.update({
      where: { id: req.params.id },
      data,
    })

    res.json({ success: true, data: kindForViewer(req, updated) })
  } catch (error) {
    console.error('Error updating work center type:', error)
    res.status(500).json({ success: false, error: 'Failed to update work center type' })
  }
})

/**
 * DELETE /v1/dispatch/work-center-types/:id
 * Deactivate a work center type (soft-delete to preserve history)
 */
router.delete('/work-center-types/:id', async (req, res) => {
  try {
    const existing = await prisma.workCenterType.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Work center type not found' })
    }

    // Check if any active work centers use this type
    const usedBy = await prisma.workCenter.findMany({
      where: { type: req.params.id, isActive: true },
      select: { id: true, name: true },
    })
    if (usedBy.length > 0) {
      return res.status(409).json({
        success: false,
        error: `Cannot delete type '${req.params.id}' — ${usedBy.length} active work center(s) use it`,
        workCenters: usedBy.map((wc) => ({ id: wc.id, name: wc.name })),
      })
    }

    const deactivated = await prisma.workCenterType.update({
      where: { id: req.params.id },
      data: { isActive: false },
    })

    res.json({ success: true, data: deactivated })
  } catch (error) {
    console.error('Error deleting work center type:', error)
    res.status(500).json({ success: false, error: 'Failed to delete work center type' })
  }
})

// ──────────────────────────────────────────────────────────────────────────────
// DIVISIONS — Dynamic Registry CRUD
// ──────────────────────────────────────────────────────────────────────────────

/**
 * GET /v1/dispatch/divisions
 */
// The two built-in divisions are created on first use.
async function listDivisions() {
  if ((await prisma.dispatchDivision.count()) === 0) {
    await prisma.dispatchDivision.createMany({ data: DEFAULT_DIVISIONS, skipDuplicates: true })
  }
  const rows = await prisma.dispatchDivision.findMany({ orderBy: { createdAt: 'asc' } })
  return rows.map(({ id, label, color, isActive }) => ({ id, label, color, isActive }))
}

router.get('/divisions', async (req, res) => {
  try {
    res.json({ success: true, data: await listDivisions() })
  } catch (error) {
    console.error('Error fetching divisions:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch divisions' })
  }
})

/**
 * POST /v1/dispatch/divisions
 */
router.post('/divisions', async (req, res) => {
  try {
    const { id, label, color } = req.body || {}
    if (!id || !label) {
      return res.status(400).json({ success: false, error: 'id and label are required' })
    }
    const normalizedId = id.toUpperCase().replace(/[^A-Z0-9_]/g, '_')
    const existing = (await listDivisions()).find((d) => d.id === normalizedId)
    if (existing) {
      return res.status(409).json({ success: false, error: `Division '${normalizedId}' already exists` })
    }
    const newDiv = { id: normalizedId, label: label.trim(), color: color || '#666', isActive: true }
    await prisma.dispatchDivision.create({ data: newDiv })
    res.status(201).json({ success: true, data: newDiv })
  } catch (error) {
    console.error('Error creating division:', error)
    res.status(500).json({ success: false, error: 'Failed to create division' })
  }
})

// ──────────────────────────────────────────────────────────────────────────────
// WORK CENTERS — Prisma-backed CRUD (persistent in Supabase)
// ──────────────────────────────────────────────────────────────────────────────

/**
 * POST /v1/dispatch/work-centers
 * Create a new work center (persisted to Supabase via Prisma)
 */
router.post('/work-centers', async (req, res) => {
  try {
    const {
      id: customId,
      name,
      locationId,
      division,
      workCenterType,
      capabilities,
      maxThicknessInches,
    } = req.body

    if (!name || !locationId || !workCenterType) {
      return res.status(400).json({
        success: false,
        error: 'name, locationId, and workCenterType are required',
      })
    }

    const limit = maxThicknessInches == null || maxThicknessInches === '' ? null : Number(maxThicknessInches)
    if (limit != null && !(Number.isFinite(limit) && limit > 0)) return res.status(400).json({ success: false, error: 'Maximum thickness must be more than zero, or left empty' })
    if (capabilities !== undefined && !(Array.isArray(capabilities) && capabilities.every((c) => typeof c === 'string'))) return res.status(400).json({ success: false, error: 'capabilities must be a list of names' })

    // Validate type exists in registry
    const typeExists = await prisma.workCenterType.findUnique({ where: { id: workCenterType } })
    if (!typeExists) {
      const allTypes = await prisma.workCenterType.findMany({ where: { isActive: true }, select: { id: true } })
      return res.status(400).json({
        success: false,
        error: `Unknown workCenterType '${workCenterType}'. Create the type first.`,
        availableTypes: allTypes.map((t) => t.id),
      })
    }

    // Validate location exists in Prisma
    const locExists = await prisma.location.findUnique({ where: { id: locationId } })
    if (!locExists) {
      return res.status(400).json({
        success: false,
        error: `Unknown locationId '${locationId}'.`,
      })
    }

    // The code carries the branch in front ("CT-ROUTER-01") and each branch numbers its own machines, so every branch
    // can have a Router 1, and as many of one kind as it needs. Codes are still one list for the company, so the
    // look-up is made at every branch, whichever branch the person is working in, and among work centers that are
    // offline too (lib/workCenterCode.js).
    const typed = customId ? typedWorkCenterCode(locExists.code, customId) : null
    if (typed && await acrossBranches(() => prisma.workCenter.findFirst({ where: { code: { equals: typed, mode: 'insensitive' } }, select: { id: true } }))) {
      return res.status(409).json({ success: false, error: `This location already has a work center with the ID '${customId}'. Give this one another ID, or leave the ID empty.` })
    }
    let wc = null
    for (let attempt = 0; !wc; attempt += 1) {
      const inUse = typed ? [] : await acrossBranches(() => prisma.workCenter.findMany({ where: { code: { startsWith: `${locExists.code}-${workCenterType}-`, mode: 'insensitive' } }, select: { code: true } }))
      const code = typed || branchWorkCenterCode(locExists.code, workCenterType, inUse.map((w) => w.code))
      try {
        wc = await prisma.workCenter.create({
          data: {
            code,
            name: name.trim(),
            locationId,
            type: workCenterType,
            capabilities: capabilities || [],
            // Only what was entered is stored. No division or thickness limit is assumed (it used to default to METALS and 12 in).
            capacity: {
              ...(division || typeExists.divisions?.[0] ? { division: division || typeExists.divisions[0] } : {}),
              ...(limit != null ? { maxThicknessInches: limit } : {}),
            },
            isActive: true,
          },
          include: { location: { select: { id: true, code: true, name: true } } },
        })
      } catch (error) {
        // Someone else took the number in the same moment: take the next one. A typed code is not changed.
        if (error?.code !== 'P2002') throw error
        if (typed) return res.status(409).json({ success: false, error: `This location already has a work center with the ID '${customId}'. Give this one another ID, or leave the ID empty.` })
        if (attempt >= 4) return res.status(409).json({ success: false, error: 'Another work center was being added at the same moment. Save again.' })
      }
    }

    res.status(201).json({ success: true, data: mapPrismaWC(wc) })
  } catch (error) {
    console.error('Error creating work center:', error)
    res.status(500).json({ success: false, error: 'Failed to create work center' })
  }
})

/**
 * PATCH /v1/dispatch/work-centers/:id
 * Update an existing work center
 */
router.patch('/work-centers/:id', async (req, res) => {
  try {
    const existing = await prisma.workCenter.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Work center not found' })
    }

    const {
      name,
      locationId,
      division,
      workCenterType,
      capabilities,
      maxThicknessInches,
      isOnline,
    } = req.body

    const updateData = {}
    if (name !== undefined) updateData.name = name.trim()
    if (locationId !== undefined) updateData.locationId = locationId
    if (capabilities !== undefined) updateData.capabilities = capabilities
    if (isOnline !== undefined) updateData.isActive = isOnline
    if (workCenterType !== undefined) {
      const typeExists = await prisma.workCenterType.findUnique({ where: { id: workCenterType } })
      if (!typeExists) {
        return res.status(400).json({ success: false, error: `Unknown workCenterType '${workCenterType}'.` })
      }
      updateData.type = workCenterType
    }

    // Merge capacity JSON (division + maxThicknessInches live inside capacity)
    const currentCap = existing.capacity || {}
    const newCap = { ...currentCap }
    if (division !== undefined) newCap.division = division
    if (maxThicknessInches !== undefined) {
      const limit = maxThicknessInches == null || maxThicknessInches === '' ? null : Number(maxThicknessInches)
      if (limit != null && !(Number.isFinite(limit) && limit > 0)) return res.status(400).json({ success: false, error: 'Maximum thickness must be more than zero, or left empty' })
      if (limit == null) delete newCap.maxThicknessInches; else newCap.maxThicknessInches = limit
    }
    if (capabilities !== undefined && !(Array.isArray(capabilities) && capabilities.every((c) => typeof c === 'string'))) return res.status(400).json({ success: false, error: 'capabilities must be a list of names' })
    // A work center with steps queued or running cannot change branch or type, or go offline with a step running.
    const held = await changeError(existing, { locationId, type: workCenterType, isActive: isOnline })
    if (held) return res.status(409).json({ success: false, error: held })

    const wc = await prisma.workCenter.update({
      where: { id: req.params.id },
      data: updateData,
      include: { location: { select: { id: true, code: true, name: true } } },
    })

    res.json({ success: true, data: mapPrismaWC(wc) })
  } catch (error) {
    console.error('Error updating work center:', error)
    res.status(500).json({ success: false, error: 'Failed to update work center' })
  }
})

/**
 * DELETE /v1/dispatch/work-centers/:id
 * Deactivate a work center (soft-delete)
 */
router.delete('/work-centers/:id', async (req, res) => {
  try {
    const existing = await prisma.workCenter.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Work center not found' })
    }

    // Check for active dispatch operations
    const activeOpsCount = await prisma.dispatchOperation.count({
      where: {
        assignedWorkCenterId: req.params.id,
        status: { in: ['SCHEDULED', 'IN_PROCESS'] },
        // Steps of cancelled or finished jobs are not work waiting, so they do not keep a work center online.
        dispatchJob: { job: { status: { in: SCHEDULABLE_JOB_STATUSES } } },
      },
    })
    if (activeOpsCount > 0) {
      return res.status(409).json({
        success: false,
        error: `Cannot delete — ${activeOpsCount} active operation(s) assigned`,
      })
    }

    const wc = await prisma.workCenter.update({
      where: { id: req.params.id },
      data: { isActive: false },
      include: { location: { select: { id: true, code: true, name: true } } },
    })

    res.json({ success: true, data: mapPrismaWC(wc) })
  } catch (error) {
    console.error('Error deleting work center:', error)
    res.status(500).json({ success: false, error: 'Failed to delete work center' })
  }
})

// ──────────────────────────────────────────────────────────────────────────────
// LOCATIONS — Prisma-backed (persistent in Supabase)
// ──────────────────────────────────────────────────────────────────────────────

/**
 * GET /v1/dispatch/locations
 * List available locations from Supabase
 */
router.get('/locations', async (req, res) => {
  try {
    // Branches only: a storage area inside a branch is not a place work is dispatched from.
    const locs = await prisma.location.findMany({
      where: { isActive: true, isBranch: true },
      orderBy: { name: 'asc' },
    })
    res.json({
      success: true,
      data: locs.map(mapPrismaLocation),
    })
  } catch (error) {
    console.error('Error fetching locations:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch locations' })
  }
})

// Adding a location moved to Admin > Locations (POST /api/admin/locations), for the super admin and the tenant
// owner only (owner, 2026-11-22). A production role could add one here with a name alone.

/**
 * GET /v1/dispatch/work-centers
 * List work centers from Supabase, optionally filtered by location
 */
router.get('/work-centers', async (req, res) => {
  try {
    const { locationId, includeInactive } = req.query
    
    const where = {}
    if (includeInactive !== 'true') where.isActive = true
    if (locationId) where.locationId = locationId
    
    const workCenters = await prisma.workCenter.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { location: { select: { id: true, code: true, name: true } } },
    })
    
    res.json({
      success: true,
      data: workCenters.map(mapPrismaWC),
    })
  } catch (error) {
    console.error('Error fetching work centers:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch work centers' })
  }
})

/**
 * GET /v1/dispatch/operators
 * List operators from Prisma (Supabase) only.
 * Optionally filtered by work center ID or type.
 */
router.get('/operators', async (req, res) => {
  try {
    const { workCenterId, workCenterType } = req.query

    // Operators with their current certifications: an expired certification does not qualify anyone.
    const now = new Date()
    const prismaOperators = await prisma.operator.findMany({
      where: { isActive: true, status: 'ACTIVE', ...(req.query.locationId ? { homeLocationId: String(req.query.locationId) } : {}) },
      include: {
        skills: { where: { isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }, select: { workCenterTypeId: true, skillLevel: true } },
        homeWorkCenter: { select: { id: true, type: true } },
      },
    })

    // Map to dispatch-compatible shape
    const allOperators = prismaOperators.map((op) => ({
      id: op.id,
      name: `${op.firstName} ${op.lastName}`,
      employeeCode: op.employeeCode,
      homeLocationId: op.homeLocationId || null,
      homeWorkCenterId: op.homeWorkCenterId || null,
      qualifiedWorkCenterTypes: op.skills.map((s) => s.workCenterTypeId),
      // The highest level held, or none: a level is not assumed for someone with no certification on file.
      skillLevel: op.skills.reduce((best, s) => ((SKILL_ORDER[s.skillLevel] || 0) > (SKILL_ORDER[best] || 0) ? s.skillLevel : best), null),
      maxThicknessInches: op.maxThicknessInches ? Number(op.maxThicknessInches) : null,
    }))

    // Apply filters
    let filtered = allOperators

    // Resolve the work center type for filtering
    let resolvedType = workCenterType || null
    if (!resolvedType && workCenterId) {
      const wc = await prisma.workCenter.findUnique({
        where: { id: workCenterId },
        select: { type: true },
      })
      resolvedType = wc?.type || null
    }

    if (resolvedType) {
      filtered = allOperators.filter((op) =>
        op.qualifiedWorkCenterTypes.includes(resolvedType)
      )
    }

    // If nothing matched, every operator is listed so the screen can still be used, each marked as not certified
    // for this type so nobody is mistaken for a certified operator.
    const certified = (op) => !resolvedType || op.qualifiedWorkCenterTypes.includes(resolvedType)
    if (filtered.length === 0) {
      filtered = allOperators
    }
    filtered = filtered.map((op) => ({ ...op, certified: certified(op) }))

    res.json({
      success: true,
      data: filtered,
    })
  } catch (error) {
    console.error('Error fetching operators:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch operators',
      data: [],
    })
  }
})

/**
 * POST /v1/dispatch/run
 * Run the dispatch engine to assign pending operations to work centers
 * Work centers are fetched from Prisma (Supabase)
 */
router.post('/run', async (req, res) => {
  const { locationId } = req.body
  
  if (!locationId) {
    return res.status(400).json({
      success: false,
      error: 'locationId is required',
    })
  }
  
  try {
    const branch = await prisma.location.findUnique({ where: { id: String(locationId) }, select: { id: true } }).catch(() => null)
    if (!branch) return res.status(400).json({ success: false, error: 'That branch is not on file' })
    // A planner schedules their own branch. Leadership roles may schedule any.
    const mine = currentScope()?.branches
    if (mine && !mine.includes(branch.id)) return res.status(403).json({ success: false, error: 'You can schedule only your own branch' })

    // One run at a time per branch (two planners pressing the button together would otherwise both place the same step).
    const result = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'dispatch-run:' + branch.id}))`
      const [workCenters, operators, dispatchJobs, loadRows] = await Promise.all([
        tx.workCenter.findMany({ where: { locationId: branch.id }, select: { id: true, code: true, name: true, type: true, capabilities: true, capacity: true, isActive: true } }),
        tx.operator.findMany({
          where: { homeLocationId: branch.id },
          select: { id: true, isActive: true, status: true, homeLocationId: true, homeWorkCenterId: true, maxThicknessInches: true, skills: { select: { workCenterTypeId: true, skillLevel: true, expiresAt: true, isActive: true } } },
        }),
        tx.dispatchJob.findMany({ where: { locationId: branch.id, job: { status: { in: SCHEDULABLE_JOB_STATUSES } } }, include: { operations: true, job: { select: { status: true } } } }),
        // What is already queued at each work center, counting only steps of jobs that are still open.
        tx.dispatchOperation.groupBy({
          by: ['assignedWorkCenterId'],
          where: { status: { in: ['SCHEDULED', 'IN_PROCESS'] }, assignedWorkCenterId: { not: null }, dispatchJob: { locationId: branch.id, job: { status: { in: SCHEDULABLE_JOB_STATUSES } } } },
          _count: true,
        }),
      ])
      // A machine locked out for maintenance, or on a safety or quality hold, is given no work.
      const locked = await lockedOut(tx, workCenters.map((wc) => wc.id))
      const usable = workCenters.filter((wc) => !locked[wc.id])
      const plan = planAssignments({
        jobs: dispatchJobs.map((dj) => ({ id: dj.id, jobNumber: dj.jobNumber, priority: dj.priority, dueDate: dj.dueDate, jobStatus: dj.job?.status, operations: dj.operations.map((o) => ({ ...o, thickness: Number(o.thickness || 0) })) })),
        workCenters: usable, operators, branchId: branch.id,
        loads: Object.fromEntries(loadRows.map((r) => [r.assignedWorkCenterId, r._count])),
      })
      // Only a step that is still waiting is placed. A start time is written only when nothing is ahead of it:
      // the engine does not know how long steps take, so it does not state a time for a queued step.
      // Steps going to the same work center and operator are written together, so a branch with
      // thousands of waiting steps is a handful of writes, not one per step.
      const now = new Date()
      const groups = new Map()
      for (const a of plan.assignments) {
        const key = `${a.workCenterId}|${a.operatorId || ''}|${a.queuedBehind === 0 ? 1 : 0}`
        if (!groups.has(key)) groups.set(key, { workCenterId: a.workCenterId, operatorId: a.operatorId, first: a.queuedBehind === 0, ids: [] })
        groups.get(key).ids.push(a.operationId)
      }
      for (const g of groups.values()) {
        for (let i = 0; i < g.ids.length; i += 5000) {
          await tx.dispatchOperation.updateMany({
            where: { id: { in: g.ids.slice(i, i + 5000) }, status: 'PENDING', assignedWorkCenterId: null },
            data: { assignedWorkCenterId: g.workCenterId, assignedOperatorId: g.operatorId, status: 'SCHEDULED', scheduledStart: g.first ? now : null },
          })
        }
      }
      // What was actually placed is read back: a step another screen took in the meantime is not reported as placed.
      const behind = new Map(plan.assignments.map((a) => [a.operationId, a]))
      const assigned = []
      const ids = plan.assignments.map((a) => a.operationId)
      for (let i = 0; i < ids.length; i += 5000) {
        const rows = await tx.dispatchOperation.findMany({ where: { id: { in: ids.slice(i, i + 5000) }, status: 'SCHEDULED' } })
        for (const row of rows) {
          const a = behind.get(row.id)
          if (row.assignedWorkCenterId !== a.workCenterId) continue
          assigned.push({ ...row, thickness: Number(row.thickness || 0), queuedBehind: a.queuedBehind })
        }
      }
      for (const reason of Object.values(locked)) plan.notChecked.push(`${reason}, so it was given no work`)
      // New jobs for this branch's orders that have no route yet: dispatch cannot place what was never planned.
      const notPlanned = await tx.job.count({ where: { status: 'ORDERED', order: { locationId: branch.id } } })
      return { assigned, plan, notPlanned }
    }, { timeout: 60000, maxWait: 20000 })

  res.json({
    success: true,
    data: {
      locationId,
      assignedCount: result.assigned.length,
      details: result.assigned,
      unassignedCount: result.plan.unassigned.length,
      unassigned: result.plan.unassigned,
      notChecked: result.plan.notChecked,
      notPlannedCount: result.notPlanned,
    },
  })
  } catch (error) {
    console.error('Error running dispatch:', error)
    res.status(500).json({ success: false, error: 'Failed to run dispatch engine' })
  }
})

/**
 * GET /v1/dispatch/queue
 * Get the job operation queue for a specific work center
 */
router.get('/queue', async (req, res) => {
  const { locationId, workCenterId } = req.query
  
  if (!workCenterId) {
    return res.status(400).json({
      success: false,
      error: 'workCenterId is required',
    })
  }
  
  try {
    // Build where clause for Prisma query
    // Steps of a cancelled, held or finished job are not work to do, so they are not in the queue.
    const opWhere = {
      assignedWorkCenterId: workCenterId,
      status: { in: ['SCHEDULED', 'IN_PROCESS'] },
      dispatchJob: { job: { status: { in: SCHEDULABLE_JOB_STATUSES } }, ...(locationId ? { locationId } : {}) },
    }
    
    const rawOps = await prisma.dispatchOperation.findMany({
      where: opWhere,
      // The job's whole plan comes with each step, for the lights on the shop floor card.
      include: { dispatchJob: { include: { order: { select: { orderNumber: true } }, operations: { select: { id: true, sequence: true, status: true, name: true, details: true, assignedWorkCenterId: true, assignedWorkCenter: { select: { name: true } } } } } }, timeLogs: { select: { startAt: true, endAt: true } } },
      orderBy: { sequence: 'asc' },
    })
    
    // Sort: IN_PROCESS first, then by priority, then by due date
    const queue = rawOps
      .map((op) => ({
        ...op,
        thickness: Number(op.thickness || 0),
      }))
      .sort((a, b) => {
        if (a.status === 'IN_PROCESS' && b.status !== 'IN_PROCESS') return -1
        if (b.status === 'IN_PROCESS' && a.status !== 'IN_PROCESS') return 1
        
        const prioA = PRIORITY_ORDER[a.dispatchJob?.priority] ?? 99
        const prioB = PRIORITY_ORDER[b.dispatchJob?.priority] ?? 99
        if (prioA !== prioB) return prioA - prioB
        
        const dueA = new Date(a.dispatchJob?.dueDate || '2099-12-31')
        const dueB = new Date(b.dispatchJob?.dueDate || '2099-12-31')
        return dueA - dueB
      })
    
    // Enrich with job data
    const enrichedQueue = queue.map((op) => {
      const job = op.dispatchJob
      return {
        id: op.id,
        dispatchJobId: op.dispatchJobId,
        sequence: op.sequence,
        name: op.name,
        requiredWorkCenterType: op.requiredWorkCenterType,
        requiredDivision: op.requiredDivision,
        requiredSkillLevel: op.requiredSkillLevel,
        specialization: op.specialization,
        thickness: op.thickness,
        materialCode: op.materialCode,
        status: op.status,
        assignedWorkCenterId: op.assignedWorkCenterId,
        assignedOperatorId: op.assignedOperatorId,
        scheduledStart: op.scheduledStart,
        scheduledEnd: op.scheduledEnd,
        actualStart: op.actualStart,
        actualEnd: op.actualEnd,
        // The clock: time already closed, and when the open entry started (the screen counts on from there).
        timeSpent: clockOf(op.timeLogs),
        jobId: job?.id || null,
        // What to do at this step, as recorded on the plan: pieces, cut length, width, tolerance, instructions.
        details: op.details || null,
        detail: stepDetailText(op.details) || null,
        // The production job this step belongs to (the plan's own id is above), for the job screen and Change plan.
        productionJobId: job?.jobId || null,
        // Every step of the job's plan in order, and which of them this step is, for the lights on the card.
        planSteps: planLights(job?.operations || []).map((s) => ({ ...s, here: s.sequence === op.sequence })),
        job: job
          ? {
              id: job.id,
              orderId: job.orderId,
              orderNumber: job.order?.orderNumber || null,
              materialCode: job.materialCode,
              commodity: job.commodity,
              form: job.form,
              grade: job.grade,
              thickness: Number(job.thickness || 0),
              dueDate: job.dueDate,
              priority: job.priority,
              customerName: job.customerName,
              jobNumber: job.jobNumber,
            }
          : null,
      }
    })
    
    // Look up work center name from Prisma
    let wcName = workCenterId
    try {
      const wc = await prisma.workCenter.findUnique({ where: { id: workCenterId }, select: { name: true } })
      if (wc) wcName = wc.name
    } catch (e) { /* use id as fallback */ }
    
    // The branch by name, for the heading (the address carries its id).
    const branch = locationId ? await prisma.location.findUnique({ where: { id: String(locationId) }, select: { name: true } }).catch(() => null) : null

    res.json({
      success: true,
      data: {
        locationId: locationId || null,
        locationName: branch?.name || null,
        workCenterId,
        workCenterName: wcName,
        operationCount: enrichedQueue.length,
        operations: enrichedQueue,
      },
    })
  } catch (error) {
    console.error('Error fetching queue:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch queue' })
  }
})

/**
 * GET /v1/dispatch/stats
 * Get dispatch statistics for a location
 */
router.get('/stats', async (req, res) => {
  try {
    const { locationId } = req.query

    // Finished steps are counted whatever became of the job. Work still to do (waiting, queued, running)
    // is counted only for jobs that are still open: steps of a cancelled, held or finished job are not
    // work to do, and the queue does not list them either.
    const branch = locationId ? { locationId } : {}
    const all = { ...(locationId ? { dispatchJob: branch } : {}) }
    const open = { dispatchJob: { ...branch, job: { status: { in: SCHEDULABLE_JOB_STATUSES } } } }
    const TO_DO = ['PENDING', 'SCHEDULED', 'IN_PROCESS']

    const [openGroups, complete, unassignedCount] = await Promise.all([
      prisma.dispatchOperation.groupBy({ by: ['status'], where: { ...open, status: { in: TO_DO } }, _count: true }),
      prisma.dispatchOperation.count({ where: { ...all, status: 'COMPLETE' } }),
      prisma.dispatchOperation.count({ where: { ...open, status: { in: TO_DO }, assignedWorkCenterId: null } }),
    ])
    const statusMap = { COMPLETE: complete }
    openGroups.forEach((g) => { statusMap[g.status] = g._count })

    const stats = {
      total: Object.values(statusMap).reduce((s, c) => s + c, 0),
      pending: statusMap['PENDING'] || 0,
      scheduled: statusMap['SCHEDULED'] || 0,
      inProcess: statusMap['IN_PROCESS'] || 0,
      complete: statusMap['COMPLETE'] || 0,
      unassigned: unassignedCount,
    }

    // Per work center, by the same rule
    const wcWhere = {}
    if (locationId) wcWhere.locationId = locationId
    const prismaWCs = await prisma.workCenter.findMany({ where: wcWhere, select: { id: true, name: true, type: true } })
    const wcIds = prismaWCs.map((wc) => wc.id)
    const [wcOpen, wcDone] = await Promise.all([
      prisma.dispatchOperation.groupBy({ by: ['assignedWorkCenterId', 'status'], where: { ...open, assignedWorkCenterId: { in: wcIds }, status: { in: ['SCHEDULED', 'IN_PROCESS'] } }, _count: true }),
      prisma.dispatchOperation.groupBy({ by: ['assignedWorkCenterId'], where: { ...all, assignedWorkCenterId: { in: wcIds }, status: 'COMPLETE' }, _count: true }),
    ])

    const wcStats = {}
    prismaWCs.forEach((wc) => {
      wcStats[wc.id] = { name: wc.name, type: wc.type, scheduled: 0, inProcess: 0, complete: 0 }
    })
    wcOpen.forEach((g) => {
      const entry = wcStats[g.assignedWorkCenterId]
      if (!entry) return
      if (g.status === 'SCHEDULED') entry.scheduled = g._count
      else if (g.status === 'IN_PROCESS') entry.inProcess = g._count
    })
    wcDone.forEach((g) => { if (wcStats[g.assignedWorkCenterId]) wcStats[g.assignedWorkCenterId].complete = g._count })

    res.json({
      success: true,
      data: {
        locationId: locationId || 'ALL',
        summary: stats,
        byWorkCenter: wcStats,
      },
    })
  } catch (error) {
    console.error('Error fetching dispatch stats:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch stats' })
  }
})

export default router
