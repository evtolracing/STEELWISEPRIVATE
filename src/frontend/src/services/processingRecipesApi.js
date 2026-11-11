/**
 * processingRecipesApi.js — Processing Recipes & Time Standards Library.
 *
 * Replaces tribal knowledge with editable processing time standards.
 *
 * Recipe Structure:
 *   - Operation type (CUT, FORM, MACHINE, FINISH, HEAT_TREAT, INSPECT)
 *   - Base time (setup + per-unit run time)
 *   - Modifiers (material grade, tolerance class, thickness range)
 *   - Work center assignment
 *
 * Used by:
 *   - Scheduling (total estimated hours per job)
 *   - Promise evaluation (capacity risk scoring)
 *   - Order intake (time preview for CSRs)
 *   - E-commerce (processing time preview for customers)
 *
 * Permission model:
 *   CSR      — read only (view estimates)
 *   MANAGER  — full CRUD on recipes
 *   ADMIN    — full CRUD + publish/deprecate
 *
 * Backed by /api/processing-recipes.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api'

// ─── ENUMS ───────────────────────────────────────────────────────────────────

export const OPERATION_TYPE = {
  CUT:        'CUT',
  FORM:       'FORM',
  MACHINE:    'MACHINE',
  FINISH:     'FINISH',
  HEAT_TREAT: 'HEAT_TREAT',
  INSPECT:    'INSPECT',
}

export const OPERATION_TYPE_LABELS = {
  [OPERATION_TYPE.CUT]:        'Cutting',
  [OPERATION_TYPE.FORM]:       'Forming',
  [OPERATION_TYPE.MACHINE]:    'Machining',
  [OPERATION_TYPE.FINISH]:     'Finishing',
  [OPERATION_TYPE.HEAT_TREAT]: 'Heat Treatment',
  [OPERATION_TYPE.INSPECT]:    'Inspection',
}

export const RECIPE_STATUS = {
  DRAFT:      'DRAFT',
  ACTIVE:     'ACTIVE',
  DEPRECATED: 'DEPRECATED',
}

export const TOLERANCE_CLASS = {
  STANDARD: 'STANDARD',
  CLOSE:    'CLOSE',
  TIGHT:    'TIGHT',
}

export const TOLERANCE_MULTIPLIER = {
  [TOLERANCE_CLASS.STANDARD]: 1.0,
  [TOLERANCE_CLASS.CLOSE]:    1.25,
  [TOLERANCE_CLASS.TIGHT]:    1.6,
}

/** Material grade difficulty factors (1.0 = baseline mild steel) */
export const MATERIAL_MODIFIERS = {
  'A36':          1.0,
  'A572-50':      1.05,
  'A514':         1.3,
  'A588':         1.15,
  'AR400':        1.45,
  'AR500':        1.55,
  'T-1':          1.35,
  '304-SS':       1.6,
  '316-SS':       1.7,
  'HDPE':         0.7,
  'UHMW':         0.75,
  'ACETAL':       0.8,
  'NYLON-6':      0.8,
  'POLYCARBONATE': 0.85,
  DEFAULT:        1.0,
}

/** Thickness band modifiers — thicker = slower */
export const THICKNESS_BANDS = [
  { min: 0,    max: 0.25,  label: 'Thin (< ¼")',        factor: 0.8 },
  { min: 0.25, max: 0.5,   label: 'Light (¼–½")',       factor: 0.9 },
  { min: 0.5,  max: 1.0,   label: 'Medium (½–1")',      factor: 1.0 },
  { min: 1.0,  max: 2.0,   label: 'Heavy (1–2")',       factor: 1.2 },
  { min: 2.0,  max: 4.0,   label: 'Extra Heavy (2–4")', factor: 1.5 },
  { min: 4.0,  max: 99,    label: 'Plate (4"+)',        factor: 2.0 },
]

// ─── RECIPE CACHE ────────────────────────────────────────────────────────────
// The time estimators below are synchronous, so they read active recipes from
// a cache that loads from the backend when this module is first used and is
// refreshed by every recipe list or change. Until it loads, estimates fall
// back to defaults.

let recipeCache = []
let cachePromise = null

async function fetchJson(url, options, message) {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || message)
  return res.json()
}

/** Reload the active-recipe cache used by the estimators. */
export function refreshRecipeCache() {
  cachePromise = fetchJson(`${API_BASE}/processing-recipes?status=ACTIVE`, undefined, 'Failed to load recipes')
    .then(res => { recipeCache = res.data || []; return recipeCache })
    .catch(() => recipeCache)
  return cachePromise
}

/** Resolves once the recipe cache has loaded (for callers that can wait). */
export function recipesReady() {
  return cachePromise || refreshRecipeCache()
}

if (typeof window !== 'undefined') refreshRecipeCache()

const json = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

// ─── CRUD ────────────────────────────────────────────────────────────────────

/** List all recipes with optional filters */
export async function listRecipes({ division, operationType, status, search } = {}) {
  const params = new URLSearchParams()
  if (division) params.set('division', division)
  if (operationType) params.set('operationType', operationType)
  if (status) params.set('status', status)
  if (search) params.set('search', search)
  return fetchJson(`${API_BASE}/processing-recipes?${params}`, undefined, 'Failed to list recipes')
}

/** Get a single recipe by ID */
export async function getRecipe(id) {
  return fetchJson(`${API_BASE}/processing-recipes/${encodeURIComponent(id)}`, undefined, 'Failed to get recipe')
}

/** Create a new recipe (starts as DRAFT) */
export async function createRecipe(payload) {
  const res = await fetchJson(`${API_BASE}/processing-recipes`, json('POST', payload), 'Failed to create recipe')
  refreshRecipeCache()
  return res
}

/** Update an existing recipe (bumps its version) */
export async function updateRecipe(id, payload) {
  const res = await fetchJson(`${API_BASE}/processing-recipes/${encodeURIComponent(id)}`, json('PUT', payload), 'Failed to update recipe')
  refreshRecipeCache()
  return res
}

/** Delete a recipe (soft — sets status to DEPRECATED) */
export async function deleteRecipe(id) {
  const res = await fetchJson(`${API_BASE}/processing-recipes/${encodeURIComponent(id)}`, { method: 'DELETE' }, 'Failed to delete recipe')
  refreshRecipeCache()
  return res
}

/** Activate a draft recipe */
export async function activateRecipe(id) {
  const res = await fetchJson(`${API_BASE}/processing-recipes/${encodeURIComponent(id)}/activate`, { method: 'POST' }, 'Failed to activate recipe')
  refreshRecipeCache()
  return res
}

/** List routing templates (each step carries its recipe) */
export async function listRoutingTemplates({ division } = {}) {
  const params = division ? `?division=${encodeURIComponent(division)}` : ''
  return fetchJson(`${API_BASE}/processing-recipes/routing-templates${params}`, undefined, 'Failed to list routing templates')
}

// ─── TIME ESTIMATION ENGINE ──────────────────────────────────────────────────

/**
 * Get the thickness band factor for a given thickness.
 */
export function getThicknessFactor(thickness) {
  if (!thickness || thickness <= 0) return 1.0
  const band = THICKNESS_BANDS.find(b => thickness >= b.min && thickness < b.max)
  return band ? band.factor : 1.0
}

/**
 * Get the material difficulty factor for a given grade.
 */
export function getMaterialFactor(grade) {
  if (!grade) return 1.0
  return MATERIAL_MODIFIERS[grade] || MATERIAL_MODIFIERS.DEFAULT
}

/**
 * Estimate processing time for a single recipe + parameters.
 *
 * @param {Object} params
 * @param {Object} params.recipe - The recipe object
 * @param {number} params.unitCount - Number of operations (cuts, bends, holes, etc.)
 * @param {string} [params.materialGrade] - Material grade for difficulty modifier
 * @param {number} [params.thickness] - Material thickness in inches
 * @param {string} [params.toleranceClass] - STANDARD | CLOSE | TIGHT
 * @returns {{ setupMinutes: number, runMinutes: number, totalMinutes: number, factors: Object }}
 */
export function estimateRecipeTime({ recipe, unitCount = 1, materialGrade, thickness, toleranceClass }) {
  if (!recipe) return { setupMinutes: 0, runMinutes: 0, totalMinutes: 0, factors: {} }

  const matFactor = getMaterialFactor(materialGrade)
  const thickFactor = getThicknessFactor(thickness)
  const tolFactor = TOLERANCE_MULTIPLIER[toleranceClass] || TOLERANCE_MULTIPLIER[recipe.toleranceClass] || 1.0

  const setupMinutes = Math.round(recipe.setupMinutes * matFactor)
  const rawRun = recipe.runMinutesPerUnit * unitCount * matFactor * thickFactor * tolFactor
  const runMinutes = Math.max(Math.round(rawRun), recipe.minRunMinutes || 0)
  const totalMinutes = setupMinutes + runMinutes

  return {
    setupMinutes,
    runMinutes,
    totalMinutes,
    factors: {
      material: matFactor,
      thickness: thickFactor,
      tolerance: tolFactor,
      materialGrade: materialGrade || 'DEFAULT',
      thicknessIn: thickness || 0,
      toleranceClass: toleranceClass || recipe.toleranceClass || TOLERANCE_CLASS.STANDARD,
    },
  }
}

/**
 * Estimate total time for a sequence of processing steps (routing).
 *
 * @param {Array} steps - Array of { recipe, unitCount, materialGrade, thickness, toleranceClass }
 * @returns {{ steps: Array, totalSetupMinutes: number, totalRunMinutes: number, totalMinutes: number, formattedTotal: string }}
 */
export function estimateRoutingTime(steps = []) {
  let totalSetup = 0
  let totalRun = 0
  const detailed = steps.map((step, i) => {
    const est = estimateRecipeTime(step)
    totalSetup += est.setupMinutes
    totalRun += est.runMinutes
    return {
      seq: i + 1,
      recipeName: step.recipe?.name || 'Unknown',
      recipeCode: step.recipe?.code || '??',
      ...est,
    }
  })

  const totalMinutes = totalSetup + totalRun

  return {
    steps: detailed,
    totalSetupMinutes: totalSetup,
    totalRunMinutes: totalRun,
    totalMinutes,
    formattedTotal: formatMinutes(totalMinutes),
  }
}

/**
 * Find the best matching recipe for a given operation request.
 *
 * @param {Object} params
 * @param {string} params.operationType - CUT, FORM, etc.
 * @param {string} params.division - METALS, PLASTICS
 * @param {string} [params.materialGrade] - Grade for compatibility check
 * @param {string} [params.form] - BAR, PLATE, SHEET, etc.
 * @param {number} [params.thickness] - Thickness in inches
 * @returns {Object|null} Best matching active recipe, or null
 */
export function findMatchingRecipe({ operationType, division, materialGrade, form, thickness }) {
  const active = recipeCache.filter(r =>
    r.status === RECIPE_STATUS.ACTIVE &&
    r.operationType === operationType &&
    r.division === division
  )

  if (active.length === 0) return null

  // Score each recipe by how well it matches the request
  const scored = active.map(recipe => {
    let score = 0
    // Material match
    if (recipe.applicableMaterials.length === 0 || recipe.applicableMaterials.includes(materialGrade)) score += 3
    // Form match
    if (recipe.applicableForms.length === 0 || recipe.applicableForms.includes(form)) score += 2
    // Thickness in range
    if (thickness != null && thickness >= recipe.thicknessMin && thickness <= recipe.thicknessMax) score += 2
    else if (thickness == null) score += 1
    return { recipe, score }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored[0].recipe
}

/**
 * Quick estimate for promise evaluation — total minutes for a list of processing steps.
 * Used by promiseApi capacity risk scoring.
 *
 * @param {Array} processingSteps - Array of { operationType, unitCount, materialGrade, thickness, division }
 * @returns {{ totalMinutes: number, totalHours: number, stepEstimates: Array, capacityRisk: string }}
 */
export function estimateForPromise(processingSteps = [], division = 'METALS') {
  const stepEstimates = processingSteps.map(step => {
    const recipe = findMatchingRecipe({
      operationType: step.operationType || step.type || OPERATION_TYPE.CUT,
      division: step.division || division,
      materialGrade: step.materialGrade,
      form: step.form,
      thickness: step.thickness,
    })
    if (!recipe) {
      return { recipeName: 'Unknown', totalMinutes: 15, estimated: false }
    }
    const est = estimateRecipeTime({
      recipe,
      unitCount: step.unitCount || 1,
      materialGrade: step.materialGrade,
      thickness: step.thickness,
      toleranceClass: step.toleranceClass,
    })
    return { recipeName: recipe.name, recipeCode: recipe.code, ...est, estimated: true }
  })

  const totalMinutes = stepEstimates.reduce((sum, s) => sum + (s.totalMinutes || 0), 0)
  const totalHours = +(totalMinutes / 60).toFixed(1)

  let capacityRisk = 'LOW'
  if (totalHours > 8) capacityRisk = 'HIGH'
  else if (totalHours > 4) capacityRisk = 'MEDIUM'

  return { totalMinutes, totalHours, stepEstimates, capacityRisk }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Format minutes to human-readable string */
export function formatMinutes(minutes) {
  if (!minutes || minutes <= 0) return '0 min'
  if (minutes < 60) return `${Math.round(minutes)} min`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

