/**
 * timeEstimationHelper.js — Utility for calculating processing time estimates.
 *
 * Bridges the gap between:
 *   - intakeProcessingApi operations (order intake / CSR / POS)
 *   - processingRecipesApi recipes (standards library)
 *   - promiseApi capacity risk scoring
 *
 * Provides a unified interface for any part of the app to ask:
 *   "Given these processing steps on this material, how long will it take?"
 */

import {
  OPERATION_TYPE,
  findMatchingRecipe,
  estimateRecipeTime,
  estimateRoutingTime,
  estimateForPromise,
  formatMinutes,
  getThicknessFactor,
  getMaterialFactor,
  TOLERANCE_MULTIPLIER,
  TOLERANCE_CLASS,
  THICKNESS_BANDS,
  MATERIAL_MODIFIERS,
} from './processingRecipesApi'

// ─── OPERATION-TYPE MAPPING ──────────────────────────────────────────────────
// Map intakeProcessingApi type codes to recipe OPERATION_TYPE

const INTAKE_TYPE_MAP = {
  CUT:     OPERATION_TYPE.CUT,
  FORM:    OPERATION_TYPE.FORM,
  MACHINE: OPERATION_TYPE.MACHINE,
  FINISH:  OPERATION_TYPE.FINISH,
}

/**
 * Estimate total processing time for an array of intake processing steps
 * (the shape that comes from ProcessingMenuBuilder / intakeProcessingApi).
 *
 * @param {Array} intakeSteps - Steps from order line: [{ code, type, params, estimatedMinutes }]
 * @param {Object} context - { materialGrade, thickness, toleranceClass, division, qty }
 * @returns {{ steps: Array, totalMinutes: number, totalHours: number, formattedTotal: string, capacityRisk: string, usingRecipeStandards: boolean }}
 */
export function estimateFromIntakeSteps(intakeSteps = [], context = {}) {
  const {
    materialGrade = null,
    thickness = null,
    toleranceClass = TOLERANCE_CLASS.STANDARD,
    division = 'METALS',
    qty = 1,
  } = context

  const stepEstimates = intakeSteps.map((step, i) => {
    const opType = INTAKE_TYPE_MAP[step.type] || OPERATION_TYPE.CUT

    // Try to find a matching recipe from the standards library
    const recipe = findMatchingRecipe({
      operationType: opType,
      division,
      materialGrade,
      form: context.form,
      thickness,
    })

    if (recipe) {
      // Use recipe-based time standards
      const unitCount = extractUnitCount(step, qty)
      const est = estimateRecipeTime({
        recipe,
        unitCount,
        materialGrade,
        thickness,
        toleranceClass,
      })
      return {
        seq: i + 1,
        code: step.code,
        name: step.name || recipe.name,
        recipeName: recipe.name,
        recipeCode: recipe.code,
        usingRecipe: true,
        ...est,
      }
    }

    // Fallback: use the estimatedMinutes from the intake step itself
    const fallbackMinutes = (step.estimatedMinutes || 15) * qty
    return {
      seq: i + 1,
      code: step.code,
      name: step.name || step.code,
      recipeName: null,
      recipeCode: null,
      usingRecipe: false,
      setupMinutes: 0,
      runMinutes: fallbackMinutes,
      totalMinutes: fallbackMinutes,
      factors: { material: 1, thickness: 1, tolerance: 1 },
    }
  })

  const totalMinutes = stepEstimates.reduce((sum, s) => sum + s.totalMinutes, 0)
  const totalHours = +(totalMinutes / 60).toFixed(1)
  const usingRecipeStandards = stepEstimates.some(s => s.usingRecipe)

  let capacityRisk = 'LOW'
  if (totalHours > 8) capacityRisk = 'HIGH'
  else if (totalHours > 4) capacityRisk = 'MEDIUM'

  return {
    steps: stepEstimates,
    totalMinutes,
    totalHours,
    formattedTotal: formatMinutes(totalMinutes),
    capacityRisk,
    usingRecipeStandards,
  }
}

/**
 * Build a promise-compatible items summary from order lines.
 * Enhanced version that uses recipe time standards instead of step count.
 *
 * @param {Array} orderLines - [{ qty, weight, processes: [...], productGrade, thickness }]
 * @param {string} division
 * @returns {{ totalQty: number, totalWeight: number, processingStepsCount: number, estimatedProcessingMinutes: number, estimatedProcessingHours: number, capacityRisk: string }}
 */
export function buildItemsSummary(orderLines = [], division = 'METALS') {
  let totalQty = 0
  let totalWeight = 0
  let processingStepsCount = 0
  let totalEstMinutes = 0

  orderLines.forEach(line => {
    totalQty += line.qty || 0
    totalWeight += line.weight || line.totalWeight || 0
    const steps = line.processes || line.processingSteps || []
    processingStepsCount += steps.length

    if (steps.length > 0) {
      const est = estimateFromIntakeSteps(steps, {
        materialGrade: line.productGrade || line.grade || line.materialGrade,
        thickness: line.thickness,
        division,
        qty: line.qty || 1,
        form: line.form,
      })
      totalEstMinutes += est.totalMinutes
    }
  })

  const totalHours = +(totalEstMinutes / 60).toFixed(1)
  let capacityRisk = 'LOW'
  if (totalHours > 8) capacityRisk = 'HIGH'
  else if (totalHours > 4) capacityRisk = 'MEDIUM'

  return {
    totalQty,
    totalWeight,
    processingStepsCount,
    estimatedProcessingMinutes: totalEstMinutes,
    estimatedProcessingHours: totalHours,
    capacityRisk,
  }
}

/**
 * Quick estimate for a single operation type (for ecommerce preview).
 *
 * @param {string} operationType - CUT, FORM, MACHINE, FINISH
 * @param {Object} context - { materialGrade, thickness, division, unitCount, toleranceClass }
 * @returns {{ totalMinutes: number, formattedTime: string, recipeName: string, breakdown: Object } | null}
 */
export function quickEstimate(operationType, context = {}) {
  const {
    materialGrade = null,
    thickness = null,
    division = 'METALS',
    unitCount = 1,
    toleranceClass = TOLERANCE_CLASS.STANDARD,
    form = null,
  } = context

  const recipe = findMatchingRecipe({ operationType, division, materialGrade, form, thickness })
  if (!recipe) return null

  const est = estimateRecipeTime({ recipe, unitCount, materialGrade, thickness, toleranceClass })
  return {
    totalMinutes: est.totalMinutes,
    formattedTime: formatMinutes(est.totalMinutes),
    recipeName: recipe.name,
    recipeCode: recipe.code,
    breakdown: est,
  }
}

// ─── INTERNAL HELPERS ────────────────────────────────────────────────────────

/**
 * Extract unit count from an intake processing step's params.
 * Maps param keys to meaningful unit counts.
 */
function extractUnitCount(step, orderQty = 1) {
  const p = step.params || {}
  // Check common param keys
  if (p.qty) return +p.qty
  if (p.holeQty) return +p.holeQty
  if (p.bends) return +p.bends
  if (p.cutInches) return Math.ceil(+p.cutInches / 12) // normalize to ~units
  if (p.sqft) return +p.sqft
  if (p.minutes) return +p.minutes
  // Default: one operation per order qty
  return orderQty
}

// ─── RE-EXPORTS for convenience ──────────────────────────────────────────────

export {
  OPERATION_TYPE,
  TOLERANCE_CLASS,
  TOLERANCE_MULTIPLIER,
  THICKNESS_BANDS,
  MATERIAL_MODIFIERS,
  formatMinutes,
  getThicknessFactor,
  getMaterialFactor,
  findMatchingRecipe,
  estimateRecipeTime,
  estimateRoutingTime,
  estimateForPromise,
}
