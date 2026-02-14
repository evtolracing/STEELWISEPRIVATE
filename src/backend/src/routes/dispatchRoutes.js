/**
 * Dispatch Engine Routes
 * Handles automatic assignment of job operations to work centers and operators
 * 
 * Work Centers & Locations: Read from Supabase (Prisma) — persistent
 * Work Center Types & Divisions: In-memory registries — configuration
 * Jobs, Operations, Operators: In-memory dispatch engine — runtime scheduling
 */

import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import prisma from '../lib/db.js'
import {
  workCenterTypes,
  divisions,
  operators,
  jobs,
  jobOperations,
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
function getWorkCenterLoad(workCenterId) {
  return jobOperations.filter(
    (op) =>
      op.assignedWorkCenterId === workCenterId &&
      (op.status === 'SCHEDULED' || op.status === 'IN_PROCESS')
  ).length
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

// ──────────────────────────────────────────────────────────────────────────────
// WORK CENTER TYPES — Dynamic Registry CRUD
// ──────────────────────────────────────────────────────────────────────────────

/**
 * GET /v1/dispatch/work-center-types
 * List all work center types (dynamic registry)
 */
router.get('/work-center-types', (req, res) => {
  const { activeOnly } = req.query
  let filtered = workCenterTypes
  if (activeOnly === 'true') {
    filtered = workCenterTypes.filter((t) => t.isActive)
  }
  res.json({ success: true, data: filtered })
})

/**
 * GET /v1/dispatch/work-center-types/:id
 * Get a single work center type
 */
router.get('/work-center-types/:id', (req, res) => {
  const wct = workCenterTypes.find((t) => t.id === req.params.id)
  if (!wct) {
    return res.status(404).json({ success: false, error: 'Work center type not found' })
  }
  res.json({ success: true, data: wct })
})

/**
 * POST /v1/dispatch/work-center-types
 * Create a new work center type
 */
router.post('/work-center-types', (req, res) => {
  const { id, label, icon, color, description, divisions: divs } = req.body

  if (!id || !label) {
    return res.status(400).json({ success: false, error: 'id and label are required' })
  }

  // Validate unique ID
  const normalizedId = id.toUpperCase().replace(/[^A-Z0-9_]/g, '_')
  if (workCenterTypes.find((t) => t.id === normalizedId)) {
    return res.status(409).json({ success: false, error: `Work center type '${normalizedId}' already exists` })
  }

  const newType = {
    id: normalizedId,
    label: label.trim(),
    icon: icon || 'Settings',
    color: color || '#666666',
    description: description || '',
    divisions: divs || [],
    isActive: true,
  }

  workCenterTypes.push(newType)
  res.status(201).json({ success: true, data: newType })
})

/**
 * PATCH /v1/dispatch/work-center-types/:id
 * Update a work center type
 */
router.patch('/work-center-types/:id', (req, res) => {
  const idx = workCenterTypes.findIndex((t) => t.id === req.params.id)
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Work center type not found' })
  }

  const { label, icon, color, description, divisions: divs, isActive } = req.body
  const existing = workCenterTypes[idx]

  if (label !== undefined) existing.label = label.trim()
  if (icon !== undefined) existing.icon = icon
  if (color !== undefined) existing.color = color
  if (description !== undefined) existing.description = description
  if (divs !== undefined) existing.divisions = divs
  if (isActive !== undefined) existing.isActive = isActive

  res.json({ success: true, data: existing })
})

/**
 * DELETE /v1/dispatch/work-center-types/:id
 * Deactivate a work center type (soft-delete to preserve history)
 */
router.delete('/work-center-types/:id', (req, res) => {
  const idx = workCenterTypes.findIndex((t) => t.id === req.params.id)
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Work center type not found' })
  }

  // Check if any active work centers in Prisma DB use this type
  // (async handler wrapped in promise)
  prisma.workCenter.findMany({
    where: { type: req.params.id, isActive: true },
    select: { id: true, name: true },
  }).then((usedBy) => {
    if (usedBy.length > 0) {
      return res.status(409).json({
        success: false,
        error: `Cannot delete type '${req.params.id}' — ${usedBy.length} active work center(s) use it`,
        workCenters: usedBy.map((wc) => ({ id: wc.id, name: wc.name })),
      })
    }

    workCenterTypes[idx].isActive = false
    res.json({ success: true, data: workCenterTypes[idx] })
  }).catch((err) => {
    console.error('Error checking work centers for type deletion:', err)
    // Fallback: allow deletion
    workCenterTypes[idx].isActive = false
    res.json({ success: true, data: workCenterTypes[idx] })
  })
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
    const typeExists = workCenterTypes.find((t) => t.id === workCenterType)
    if (!typeExists) {
      return res.status(400).json({
        success: false,
        error: `Unknown workCenterType '${workCenterType}'. Create the type first.`,
        availableTypes: workCenterTypes.filter((t) => t.isActive).map((t) => t.id),
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
      const typeExists = workCenterTypes.find((t) => t.id === workCenterType)
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
    const activeOps = jobOperations.filter(
      (op) =>
        op.assignedWorkCenterId === req.params.id &&
        (op.status === 'SCHEDULED' || op.status === 'IN_PROCESS')
    )
    if (activeOps.length > 0) {
      return res.status(409).json({
        success: false,
        error: `Cannot delete — ${activeOps.length} active operation(s) assigned`,
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
})

/**
 * GET /v1/dispatch/stats
 * Get dispatch statistics for a location
 */
router.get('/stats', async (req, res) => {
  try {
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
    
    // Per work center stats from Prisma
    const wcWhere = {}
    if (locationId) wcWhere.locationId = locationId
    const prismaWCs = await prisma.workCenter.findMany({ where: wcWhere, select: { id: true, name: true, type: true } })
    
    const wcStats = {}
    prismaWCs.forEach((wc) => {
      const wcOps = ops.filter((op) => op.assignedWorkCenterId === wc.id)
      wcStats[wc.id] = {
        name: wc.name,
        type: wc.type,
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
  } catch (error) {
    console.error('Error fetching dispatch stats:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch stats' })
  }
})

export default router
