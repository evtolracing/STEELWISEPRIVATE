/**
 * specInheritance.js — Spec Inheritance Chain
 *
 * Resolves the effective specs for an order line or job by walking:
 *   CustomerPreference → QuoteLine → OrderLine → Job
 *
 * Each level can override individual fields. Null/undefined = "inherit from parent".
 */
import { Router } from 'express'
import prisma from '../lib/db.js'

const router = Router()

// ─── SPEC FIELD LIST ─────────────────────────────────────────────────────────

const SPEC_FIELDS = [
  'tolerancePreset',
  'thkTolerancePlus', 'thkToleranceMinus',
  'lenTolerancePlus', 'lenToleranceMinus',
  'widTolerancePlus', 'widToleranceMinus',
  'surfaceFinish',
  'certRequirements',
  'specNotes',
]

const DIMENSION_FIELDS = ['thicknessIn', 'widthIn', 'lengthIn']

// ─── MERGE HELPER ────────────────────────────────────────────────────────────

/**
 * Merge specs from multiple layers. Later layers override earlier ones.
 * Returns { merged, sources } where sources shows where each field came from.
 */
function mergeSpecs(...layers) {
  const merged = {}
  const sources = {}

  for (const { data, source } of layers) {
    if (!data) continue
    for (const field of [...SPEC_FIELDS, ...DIMENSION_FIELDS]) {
      const val = data[field]
      if (val !== null && val !== undefined && val !== '') {
        // For arrays (certRequirements), only override if non-empty
        if (Array.isArray(val) && val.length === 0) continue
        merged[field] = val
        sources[field] = source
      }
    }
    // Also pull gradeOverride → grade
    if (data.gradeOverride) {
      merged.gradeOverride = data.gradeOverride
      sources.gradeOverride = source
    }
  }

  return { merged, sources }
}

// ─── GET /specs/resolve/order-line/:id ───────────────────────────────────────
// Returns the effective specs for an order line, merging customer prefs + quote line + order line

router.get('/resolve/order-line/:id', async (req, res) => {
  try {
    const orderLine = await prisma.orderLine.findUnique({
      where: { id: req.params.id },
      include: {
        order: {
          include: {
            buyer: {
              include: { preferences: true }
            }
          }
        }
      }
    })

    if (!orderLine) {
      return res.status(404).json({ error: 'Order line not found' })
    }

    const customerPrefs = orderLine.order?.buyer?.preferences || null

    const { merged, sources } = mergeSpecs(
      { data: customerPrefs, source: 'customer' },
      { data: orderLine, source: 'order-line' }
    )

    res.json({ data: merged, sources, orderLineId: req.params.id })
  } catch (error) {
    console.error('Error resolving order line specs:', error)
    res.status(500).json({ error: 'Failed to resolve specs' })
  }
})

// ─── GET /specs/resolve/job/:id ──────────────────────────────────────────────
// Returns effective specs for a job, merging customer → order line → job

router.get('/resolve/job/:id', async (req, res) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: {
        order: {
          include: {
            buyer: {
              include: { preferences: true }
            },
            lines: true
          }
        }
      }
    })

    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }

    const customerPrefs = job.order?.buyer?.preferences || null
    const orderLine = job.orderLineId
      ? job.order?.lines?.find(l => l.id === job.orderLineId) || null
      : null

    const { merged, sources } = mergeSpecs(
      { data: customerPrefs, source: 'customer' },
      { data: orderLine, source: 'order-line' },
      { data: job, source: 'job' }
    )

    res.json({ data: merged, sources, jobId: req.params.id })
  } catch (error) {
    console.error('Error resolving job specs:', error)
    res.status(500).json({ error: 'Failed to resolve specs' })
  }
})

// ─── GET /specs/customer/:customerId ─────────────────────────────────────────
// Returns customer-level spec defaults (convenience endpoint for UIs)

router.get('/customer/:customerId', async (req, res) => {
  try {
    const prefs = await prisma.customerPreference.findUnique({
      where: { customerId: req.params.customerId }
    })

    if (!prefs) {
      return res.json({ data: null, hasSpecs: false })
    }

    const specData = {}
    for (const field of SPEC_FIELDS) {
      specData[field] = prefs[field] ?? null
    }
    specData.approvedGrades = prefs.approvedGrades || []

    res.json({ data: specData, hasSpecs: true })
  } catch (error) {
    console.error('Error fetching customer specs:', error)
    res.status(500).json({ error: 'Failed to fetch customer specs' })
  }
})

export default router
