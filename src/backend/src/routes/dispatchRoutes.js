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
import {
  divisions,
  compareSkillLevel,
} from '../data/dispatchData.js'

const router = express.Router()

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
    workCenterType: wc.type || 'SAW',
    division: cap.division || 'METALS',
    capabilities: wc.capabilities || [],
    maxThicknessInches: cap.maxThicknessInches ?? 12,
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

/**
 * Get count of operations assigned to a work center with active status
 */
async function getWorkCenterLoad(workCenterId) {
  return prisma.dispatchOperation.count({
    where: {
      assignedWorkCenterId: workCenterId,
      status: { in: ['SCHEDULED', 'IN_PROCESS'] },
    },
  })
}

/**
 * Check if work center can handle the operation
 * Accepts the mapped (dispatch-shaped) work center
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
 * Now uses a pre-loaded map passed in, or queries Prisma
 */
async function getJobForOperation(operationJobId) {
  return prisma.dispatchJob.findUnique({ where: { id: operationJobId } })
}

/**
 * Priority order for sorting
 */
const PRIORITY_ORDER = { VIP: 0, RUSH: 1, HOT: 2, NORMAL: 3 }

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
    res.json({ success: true, data: types })
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
    res.json({ success: true, data: wct })
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
      },
    })

    res.status(201).json({ success: true, data: newType })
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

    const updated = await prisma.workCenterType.update({
      where: { id: req.params.id },
      data,
    })

    res.json({ success: true, data: updated })
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
router.get('/divisions', (req, res) => {
  res.json({ success: true, data: divisions })
})

/**
 * POST /v1/dispatch/divisions
 */
router.post('/divisions', (req, res) => {
  const { id, label, color } = req.body
  if (!id || !label) {
    return res.status(400).json({ success: false, error: 'id and label are required' })
  }
  const normalizedId = id.toUpperCase().replace(/[^A-Z0-9_]/g, '_')
  if (divisions.find((d) => d.id === normalizedId)) {
    return res.status(409).json({ success: false, error: `Division '${normalizedId}' already exists` })
  }
  const newDiv = { id: normalizedId, label: label.trim(), color: color || '#666', isActive: true }
  divisions.push(newDiv)
  res.status(201).json({ success: true, data: newDiv })
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

    // Auto-generate code from type + count
    const existingCount = await prisma.workCenter.count({ where: { type: workCenterType } })
    const code = customId || `${workCenterType}-${String(existingCount + 1).padStart(2, '0')}`

    // Check duplicate code
    const existing = await prisma.workCenter.findUnique({ where: { code } })
    if (existing) {
      return res.status(409).json({ success: false, error: `Work center code '${code}' already exists` })
    }

    const wc = await prisma.workCenter.create({
      data: {
        code,
        name: name.trim(),
        locationId,
        type: workCenterType,
        capabilities: capabilities || [],
        capacity: {
          division: division || typeExists.divisions[0] || 'METALS',
          maxThicknessInches: maxThicknessInches ?? 12,
        },
        isActive: true,
      },
      include: { location: { select: { id: true, code: true, name: true } } },
    })

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
    if (maxThicknessInches !== undefined) newCap.maxThicknessInches = maxThicknessInches
    if (division !== undefined || maxThicknessInches !== undefined) {
      updateData.capacity = newCap
    }

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
    const locs = await prisma.location.findMany({
      where: { isActive: true },
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

/**
 * POST /v1/dispatch/locations
 * Create a new location in Supabase
 */
router.post('/locations', async (req, res) => {
  try {
    const { id, code, name, address, type } = req.body
    if (!name) {
      return res.status(400).json({ success: false, error: 'name is required' })
    }

    const locCode = code || id || name.toUpperCase().replace(/[^A-Z0-9]/g, '-').substring(0, 20)

    // Check duplicate code
    const existing = await prisma.location.findUnique({ where: { code: locCode } })
    if (existing) {
      return res.status(409).json({ success: false, error: `Location code '${locCode}' already exists` })
    }

    // Get org for ownerId
    const org = await prisma.organization.findFirst()
    if (!org) {
      return res.status(500).json({ success: false, error: 'No organization found. Seed the database first.' })
    }

    const loc = await prisma.location.create({
      data: {
        code: locCode,
        name: name.trim(),
        type: type || 'WAREHOUSE',
        ownerId: org.id,
        addressLine1: address || null,
        isActive: true,
      },
    })

    res.status(201).json({ success: true, data: mapPrismaLocation(loc) })
  } catch (error) {
    console.error('Error creating location:', error)
    res.status(500).json({ success: false, error: 'Failed to create location' })
  }
})

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

    // Load Prisma operators with their skills
    const prismaOperators = await prisma.operator.findMany({
      where: { isActive: true, status: 'ACTIVE' },
      include: {
        skills: { where: { isActive: true }, select: { workCenterTypeId: true, skillLevel: true } },
        homeWorkCenter: { select: { id: true, type: true } },
      },
    })

    // Map to dispatch-compatible shape
    const allOperators = prismaOperators.map((op) => ({
      id: op.id,
      name: `${op.firstName} ${op.lastName}`,
      employeeCode: op.employeeCode,
      homeWorkCenterId: op.homeWorkCenterId || null,
      qualifiedWorkCenterTypes: op.skills.map((s) => s.workCenterTypeId),
      qualifiedDivisions: ['METALS', 'PLASTICS'],
      skillLevel: op.skills.length > 0
        ? op.skills.reduce((best, s) => {
            const order = { NOVICE: 0, STANDARD: 1, EXPERT: 2 }
            return (order[s.skillLevel] || 0) > (order[best] || 0) ? s.skillLevel : best
          }, 'NOVICE')
        : 'STANDARD',
      maxThicknessInches: op.maxThicknessInches ? Number(op.maxThicknessInches) : 999,
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

    // If nothing matched, return all operators so the dropdown is never empty
    if (filtered.length === 0) {
      filtered = allOperators
    }

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
    // Get work centers from Supabase at this location
    const prismaWCs = await prisma.workCenter.findMany({
      where: { locationId, isActive: true },
    })
    const locationWorkCenters = prismaWCs.map(mapPrismaWC)

    // Load operators from database
    const prismaOps = await prisma.operator.findMany({
      where: { isActive: true, status: 'ACTIVE' },
      include: {
        skills: { where: { isActive: true }, select: { workCenterTypeId: true, skillLevel: true } },
      },
    })
    const dbOperators = prismaOps.map((op) => ({
      id: op.id,
      name: `${op.firstName} ${op.lastName}`,
      homeWorkCenterId: op.homeWorkCenterId || null,
      qualifiedWorkCenterTypes: op.skills.map((s) => s.workCenterTypeId),
      qualifiedDivisions: ['METALS', 'PLASTICS'],
      skillLevel: op.skills.length > 0
        ? op.skills.reduce((best, s) => {
            const order = { NOVICE: 0, STANDARD: 1, EXPERT: 2 }
            return (order[s.skillLevel] || 0) > (order[best] || 0) ? s.skillLevel : best
          }, 'NOVICE')
        : 'STANDARD',
      maxThicknessInches: op.maxThicknessInches ? Number(op.maxThicknessInches) : 999,
    }))
  
  // Get dispatch jobs at this location from Prisma
  const locationDispatchJobs = await prisma.dispatchJob.findMany({
    where: { locationId },
    include: { operations: true },
  })
  
  // Build a lookup map: dispatchJobId -> dispatchJob
  const jobMap = new Map()
  locationDispatchJobs.forEach((dj) => jobMap.set(dj.id, dj))
  
  // Collect all pending operations from those jobs
  const pendingOperations = []
  for (const dj of locationDispatchJobs) {
    for (const op of dj.operations) {
      if (op.status === 'PENDING' && !op.assignedWorkCenterId) {
        pendingOperations.push({
          ...op,
          thickness: Number(op.thickness || 0),
          jobId: dj.id,  // dispatchJob id for lookups
        })
      }
    }
  }
  
  // Sort by job priority and due date, then by sequence
  // Use the pre-loaded jobMap for synchronous lookups
  pendingOperations.sort((a, b) => {
    const jobA = jobMap.get(a.jobId)
    const jobB = jobMap.get(b.jobId)
    
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
    const parentJob = jobMap.get(operation.jobId)
    const priorOps = (parentJob?.operations || []).filter(
      (op) => op.sequence < operation.sequence
    )
    
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
    // getWorkCenterLoad is now async, so resolve all loads first
    const loads = await Promise.all(
      candidateWCs.map(async (wc) => ({ wc, load: await getWorkCenterLoad(wc.id) }))
    )
    loads.sort((a, b) => a.load - b.load)
    const chosenWC = loads[0].wc
    
    // Find candidate operators from database
    const candidateOps = dbOperators.filter((op) => operatorCanHandle(op, operation))
    
    let chosenOperator = null
    if (candidateOps.length > 0) {
      // Prefer operator whose home is this work center
      const homeOp = candidateOps.find((op) => op.homeWorkCenterId === chosenWC.id)
      chosenOperator = homeOp || candidateOps[0]
    }
    
    // Persist assignment to Prisma
    const updated = await prisma.dispatchOperation.update({
      where: { id: operation.id },
      data: {
        assignedWorkCenterId: chosenWC.id,
        assignedOperatorId: chosenOperator?.id || null,
        status: 'SCHEDULED',
        scheduledStart: new Date(),
      },
    })
    
    assigned.push({
      ...updated,
      thickness: Number(updated.thickness || 0),
    })
  }
  
  res.json({
    success: true,
    data: {
      locationId,
      assignedCount: assigned.length,
      details: assigned,
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
    const opWhere = {
      assignedWorkCenterId: workCenterId,
      status: { in: ['SCHEDULED', 'IN_PROCESS'] },
    }
    
    // If locationId provided, filter by dispatch jobs at that location
    if (locationId) {
      opWhere.dispatchJob = { locationId }
    }
    
    const rawOps = await prisma.dispatchOperation.findMany({
      where: opWhere,
      include: { dispatchJob: true },
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
        jobId: job?.id || null,
        job: job
          ? {
              id: job.id,
              orderId: job.orderId,
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
    
    res.json({
      success: true,
      data: {
        locationId: locationId || null,
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
    
    // Build where clause: filter operations by location via their parent dispatchJob
    const opWhere = {}
    if (locationId) {
      opWhere.dispatchJob = { locationId }
    }
    
    // Aggregate counts by status using Prisma groupBy
    const statusGroups = await prisma.dispatchOperation.groupBy({
      by: ['status'],
      where: opWhere,
      _count: true,
    })
    
    const unassignedCount = await prisma.dispatchOperation.count({
      where: { ...opWhere, assignedWorkCenterId: null },
    })
    
    const statusMap = {}
    statusGroups.forEach((g) => { statusMap[g.status] = g._count })
    
    const stats = {
      total: Object.values(statusMap).reduce((s, c) => s + c, 0),
      pending: statusMap['PENDING'] || 0,
      scheduled: statusMap['SCHEDULED'] || 0,
      inProcess: statusMap['IN_PROCESS'] || 0,
      complete: statusMap['COMPLETE'] || 0,
      unassigned: unassignedCount,
    }
    
    // Per work center stats from Prisma
    const wcWhere = {}
    if (locationId) wcWhere.locationId = locationId
    const prismaWCs = await prisma.workCenter.findMany({ where: wcWhere, select: { id: true, name: true, type: true } })
    
    const wcIds = prismaWCs.map((wc) => wc.id)
    const wcStatusGroups = await prisma.dispatchOperation.groupBy({
      by: ['assignedWorkCenterId', 'status'],
      where: {
        assignedWorkCenterId: { in: wcIds },
        ...(locationId ? { dispatchJob: { locationId } } : {}),
      },
      _count: true,
    })
    
    const wcStats = {}
    prismaWCs.forEach((wc) => {
      wcStats[wc.id] = { name: wc.name, type: wc.type, scheduled: 0, inProcess: 0, complete: 0 }
    })
    wcStatusGroups.forEach((g) => {
      const entry = wcStats[g.assignedWorkCenterId]
      if (!entry) return
      if (g.status === 'SCHEDULED') entry.scheduled = g._count
      else if (g.status === 'IN_PROCESS') entry.inProcess = g._count
      else if (g.status === 'COMPLETE') entry.complete = g._count
    })
    
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
