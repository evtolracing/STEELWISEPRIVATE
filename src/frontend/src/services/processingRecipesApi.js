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
 * Mock-first pattern.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const USE_MOCK = true

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

// ─── MOCK RECIPES ────────────────────────────────────────────────────────────

const MOCK_RECIPES = [
  {
    id: 'recipe-001',
    code: 'SAW-STD',
    name: 'Standard Saw Cut',
    description: 'Bandsaw cut to length — single straight cut',
    operationType: OPERATION_TYPE.CUT,
    division: 'METALS',
    workCenter: 'SAW',
    setupMinutes: 8,
    runMinutesPerUnit: 5,
    minRunMinutes: 3,
    applicableMaterials: ['A36', 'A572-50', 'A588', 'AR400', 'AR500'],
    applicableForms: ['BAR', 'PLATE', 'BEAM', 'TUBE'],
    thicknessMin: 0,
    thicknessMax: 12,
    toleranceClass: TOLERANCE_CLASS.STANDARD,
    pricePerUnit: 12.00,
    priceUnit: 'CUT',
    status: RECIPE_STATUS.ACTIVE,
    version: 1,
    createdBy: 'admin',
    updatedAt: '2025-11-10T14:30:00Z',
    notes: 'Default saw cut recipe. Covers most bar/plate work.',
  },
  {
    id: 'recipe-002',
    code: 'SHEAR-STD',
    name: 'Standard Shear Cut',
    description: 'Hydraulic shear — rectangular blanks up to 1" thick',
    operationType: OPERATION_TYPE.CUT,
    division: 'METALS',
    workCenter: 'SHEAR',
    setupMinutes: 5,
    runMinutesPerUnit: 3,
    minRunMinutes: 2,
    applicableMaterials: ['A36', 'A572-50', 'A588'],
    applicableForms: ['PLATE', 'SHEET'],
    thicknessMin: 0,
    thicknessMax: 1.0,
    toleranceClass: TOLERANCE_CLASS.STANDARD,
    pricePerUnit: 8.50,
    priceUnit: 'CUT',
    status: RECIPE_STATUS.ACTIVE,
    version: 1,
    createdBy: 'admin',
    updatedAt: '2025-11-10T14:30:00Z',
    notes: 'Max 1" thickness for shear. Thicker goes to saw or plasma.',
  },
  {
    id: 'recipe-003',
    code: 'PLASMA-STD',
    name: 'Plasma Profile Cut',
    description: 'CNC plasma — contour/shape cutting on plate',
    operationType: OPERATION_TYPE.CUT,
    division: 'METALS',
    workCenter: 'PLASMA',
    setupMinutes: 15,
    runMinutesPerUnit: 8,
    minRunMinutes: 5,
    applicableMaterials: ['A36', 'A572-50', 'A514', 'AR400', 'AR500', 'T-1'],
    applicableForms: ['PLATE'],
    thicknessMin: 0.125,
    thicknessMax: 6.0,
    toleranceClass: TOLERANCE_CLASS.STANDARD,
    pricePerUnit: 0.45,
    priceUnit: 'IN',
    status: RECIPE_STATUS.ACTIVE,
    version: 2,
    createdBy: 'admin',
    updatedAt: '2025-12-02T09:15:00Z',
    notes: 'Per-inch pricing. Pierce count adds ~30s each.',
  },
  {
    id: 'recipe-004',
    code: 'BRAKE-STD',
    name: 'Press Brake Bend',
    description: 'Standard V-die bending on press brake',
    operationType: OPERATION_TYPE.FORM,
    division: 'METALS',
    workCenter: 'BRAKE',
    setupMinutes: 12,
    runMinutesPerUnit: 6,
    minRunMinutes: 4,
    applicableMaterials: ['A36', 'A572-50', 'A588', '304-SS', '316-SS'],
    applicableForms: ['PLATE', 'SHEET'],
    thicknessMin: 0.0625,
    thicknessMax: 2.0,
    toleranceClass: TOLERANCE_CLASS.STANDARD,
    pricePerUnit: 18.00,
    priceUnit: 'BEND',
    status: RECIPE_STATUS.ACTIVE,
    version: 1,
    createdBy: 'admin',
    updatedAt: '2025-11-15T10:00:00Z',
    notes: 'Thicker material requires tonnage check before accepting.',
  },
  {
    id: 'recipe-005',
    code: 'ROLL-STD',
    name: 'Plate Rolling',
    description: 'Three-roll bending for cylinders and cones',
    operationType: OPERATION_TYPE.FORM,
    division: 'METALS',
    workCenter: 'ROLL',
    setupMinutes: 20,
    runMinutesPerUnit: 15,
    minRunMinutes: 10,
    applicableMaterials: ['A36', 'A572-50', 'A514'],
    applicableForms: ['PLATE'],
    thicknessMin: 0.125,
    thicknessMax: 3.0,
    toleranceClass: TOLERANCE_CLASS.CLOSE,
    pricePerUnit: 35.00,
    priceUnit: 'EA',
    status: RECIPE_STATUS.ACTIVE,
    version: 1,
    createdBy: 'admin',
    updatedAt: '2025-11-20T08:00:00Z',
    notes: 'Diameter and material determine passes required.',
  },
  {
    id: 'recipe-006',
    code: 'DRILL-STD',
    name: 'Drill Holes',
    description: 'Radial or mag drill — bolt holes, mounting patterns',
    operationType: OPERATION_TYPE.MACHINE,
    division: 'METALS',
    workCenter: 'DRILL',
    setupMinutes: 10,
    runMinutesPerUnit: 4,
    minRunMinutes: 2,
    applicableMaterials: ['A36', 'A572-50', 'A588', 'AR400', '304-SS', '316-SS'],
    applicableForms: ['PLATE', 'BAR', 'BEAM', 'ANGLE'],
    thicknessMin: 0,
    thicknessMax: 6.0,
    toleranceClass: TOLERANCE_CLASS.STANDARD,
    pricePerUnit: 4.50,
    priceUnit: 'HOLE',
    status: RECIPE_STATUS.ACTIVE,
    version: 1,
    createdBy: 'admin',
    updatedAt: '2025-11-10T14:30:00Z',
    notes: 'Add 2 min per hole for AR/stainless grades.',
  },
  {
    id: 'recipe-007',
    code: 'GRIND-STD',
    name: 'Surface Grind',
    description: 'Flat grind to specified surface finish',
    operationType: OPERATION_TYPE.FINISH,
    division: 'METALS',
    workCenter: 'GRINDER',
    setupMinutes: 15,
    runMinutesPerUnit: 20,
    minRunMinutes: 10,
    applicableMaterials: ['A36', 'A572-50', 'A514', 'T-1', '304-SS', '316-SS'],
    applicableForms: ['PLATE', 'BAR'],
    thicknessMin: 0.25,
    thicknessMax: 8.0,
    toleranceClass: TOLERANCE_CLASS.CLOSE,
    pricePerUnit: 55.00,
    priceUnit: 'SQFT',
    status: RECIPE_STATUS.ACTIVE,
    version: 1,
    createdBy: 'admin',
    updatedAt: '2025-11-10T14:30:00Z',
    notes: 'Price is per sq ft of ground area.',
  },
  {
    id: 'recipe-008',
    code: 'DEBURR-STD',
    name: 'Deburr / Edge Finish',
    description: 'Remove burrs and sharp edges after cutting or machining',
    operationType: OPERATION_TYPE.FINISH,
    division: 'METALS',
    workCenter: 'DEBURR',
    setupMinutes: 3,
    runMinutesPerUnit: 5,
    minRunMinutes: 3,
    applicableMaterials: ['A36', 'A572-50', 'A588', 'AR400', 'AR500', '304-SS', '316-SS'],
    applicableForms: ['PLATE', 'BAR', 'SHEET', 'BEAM', 'ANGLE'],
    thicknessMin: 0,
    thicknessMax: 99,
    toleranceClass: TOLERANCE_CLASS.STANDARD,
    pricePerUnit: 6.00,
    priceUnit: 'EA',
    status: RECIPE_STATUS.ACTIVE,
    version: 1,
    createdBy: 'admin',
    updatedAt: '2025-11-10T14:30:00Z',
    notes: '',
  },
  {
    id: 'recipe-009',
    code: 'PLAS-SAW-STD',
    name: 'Plastic Saw Cut',
    description: 'Precision saw cut for plastic sheet, rod, tube',
    operationType: OPERATION_TYPE.CUT,
    division: 'PLASTICS',
    workCenter: 'PLAS-SAW',
    setupMinutes: 5,
    runMinutesPerUnit: 4,
    minRunMinutes: 2,
    applicableMaterials: ['HDPE', 'UHMW', 'ACETAL', 'NYLON-6', 'POLYCARBONATE'],
    applicableForms: ['SHEET', 'ROD', 'TUBE', 'BAR'],
    thicknessMin: 0,
    thicknessMax: 12,
    toleranceClass: TOLERANCE_CLASS.STANDARD,
    pricePerUnit: 8.00,
    priceUnit: 'CUT',
    status: RECIPE_STATUS.ACTIVE,
    version: 1,
    createdBy: 'admin',
    updatedAt: '2025-11-10T14:30:00Z',
    notes: 'Slower blade speed for plastics to avoid melting.',
  },
  {
    id: 'recipe-010',
    code: 'PLAS-CNC-STD',
    name: 'Plastic CNC Route',
    description: 'CNC router for contour cutting and pocketing on plastic',
    operationType: OPERATION_TYPE.MACHINE,
    division: 'PLASTICS',
    workCenter: 'CNC-ROUTER',
    setupMinutes: 12,
    runMinutesPerUnit: 10,
    minRunMinutes: 5,
    applicableMaterials: ['HDPE', 'UHMW', 'ACETAL', 'NYLON-6', 'POLYCARBONATE'],
    applicableForms: ['SHEET', 'PLATE'],
    thicknessMin: 0.125,
    thicknessMax: 4.0,
    toleranceClass: TOLERANCE_CLASS.STANDARD,
    pricePerUnit: 1.20,
    priceUnit: 'MIN',
    status: RECIPE_STATUS.ACTIVE,
    version: 1,
    createdBy: 'admin',
    updatedAt: '2025-11-10T14:30:00Z',
    notes: 'Time-based pricing. Program setup not included.',
  },
  {
    id: 'recipe-011',
    code: 'STRESS-REL',
    name: 'Stress Relief',
    description: 'Furnace stress-relief heat treatment',
    operationType: OPERATION_TYPE.HEAT_TREAT,
    division: 'METALS',
    workCenter: 'FURNACE',
    setupMinutes: 30,
    runMinutesPerUnit: 0,
    minRunMinutes: 120,
    applicableMaterials: ['A36', 'A572-50', 'A514', 'T-1'],
    applicableForms: ['PLATE', 'FABRICATION'],
    thicknessMin: 0,
    thicknessMax: 99,
    toleranceClass: TOLERANCE_CLASS.STANDARD,
    pricePerUnit: 185.00,
    priceUnit: 'EA',
    status: RECIPE_STATUS.ACTIVE,
    version: 1,
    createdBy: 'admin',
    updatedAt: '2026-01-05T11:00:00Z',
    notes: 'Batch operation. 120 min minimum soak time regardless of unit count.',
  },
  {
    id: 'recipe-012',
    code: 'VIS-INSPECT',
    name: 'Visual Inspection + MTR Verify',
    description: 'Dimensional check, visual inspection, MTR match',
    operationType: OPERATION_TYPE.INSPECT,
    division: 'METALS',
    workCenter: 'QA-BENCH',
    setupMinutes: 2,
    runMinutesPerUnit: 5,
    minRunMinutes: 5,
    applicableMaterials: [],
    applicableForms: [],
    thicknessMin: 0,
    thicknessMax: 99,
    toleranceClass: TOLERANCE_CLASS.STANDARD,
    pricePerUnit: 0,
    priceUnit: 'EA',
    status: RECIPE_STATUS.ACTIVE,
    version: 1,
    createdBy: 'admin',
    updatedAt: '2026-01-05T11:00:00Z',
    notes: 'No charge — included in processing. Required for certified orders.',
  },
]

// ─── RECIPE ROUTING TEMPLATES ────────────────────────────────────────────────

const MOCK_ROUTING_TEMPLATES = [
  {
    id: 'rt-001',
    name: 'Plate – Cut to Size',
    division: 'METALS',
    steps: [
      { seq: 1, recipeId: 'recipe-002' },
      { seq: 2, recipeId: 'recipe-008' },
    ],
  },
  {
    id: 'rt-002',
    name: 'Plate – Cut + Bend',
    division: 'METALS',
    steps: [
      { seq: 1, recipeId: 'recipe-002' },
      { seq: 2, recipeId: 'recipe-004' },
      { seq: 3, recipeId: 'recipe-008' },
    ],
  },
  {
    id: 'rt-003',
    name: 'Plate – Plasma Profile + Drill',
    division: 'METALS',
    steps: [
      { seq: 1, recipeId: 'recipe-003' },
      { seq: 2, recipeId: 'recipe-006' },
      { seq: 3, recipeId: 'recipe-008' },
      { seq: 4, recipeId: 'recipe-012' },
    ],
  },
  {
    id: 'rt-004',
    name: 'Plate – Full Treatment',
    division: 'METALS',
    steps: [
      { seq: 1, recipeId: 'recipe-003' },
      { seq: 2, recipeId: 'recipe-006' },
      { seq: 3, recipeId: 'recipe-007' },
      { seq: 4, recipeId: 'recipe-011' },
      { seq: 5, recipeId: 'recipe-012' },
    ],
  },
  {
    id: 'rt-005',
    name: 'Plastic – Cut to Length',
    division: 'PLASTICS',
    steps: [
      { seq: 1, recipeId: 'recipe-009' },
    ],
  },
  {
    id: 'rt-006',
    name: 'Plastic – CNC Profile',
    division: 'PLASTICS',
    steps: [
      { seq: 1, recipeId: 'recipe-010' },
    ],
  },
]

let mockRecipes = [...MOCK_RECIPES]
let nextId = 13

// ─── CRUD ────────────────────────────────────────────────────────────────────

/** List all recipes with optional filters */
export async function listRecipes({ division, operationType, status, search } = {}) {
  if (USE_MOCK) {
    await _delay(200)
    let list = [...mockRecipes]
    if (division) list = list.filter(r => r.division === division)
    if (operationType) list = list.filter(r => r.operationType === operationType)
    if (status) list = list.filter(r => r.status === status)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      )
    }
    return { data: list, total: list.length }
  }
  const params = new URLSearchParams()
  if (division) params.set('division', division)
  if (operationType) params.set('operationType', operationType)
  if (status) params.set('status', status)
  if (search) params.set('search', search)
  const res = await fetch(`${API_BASE}/processing-recipes?${params}`)
  if (!res.ok) throw new Error('Failed to list recipes')
  return res.json()
}

/** Get a single recipe by ID */
export async function getRecipe(id) {
  if (USE_MOCK) {
    await _delay(100)
    const recipe = mockRecipes.find(r => r.id === id)
    if (!recipe) throw new Error('Recipe not found')
    return { data: { ...recipe } }
  }
  const res = await fetch(`${API_BASE}/processing-recipes/${id}`)
  if (!res.ok) throw new Error('Failed to get recipe')
  return res.json()
}

/** Create a new recipe */
export async function createRecipe(payload) {
  if (USE_MOCK) {
    await _delay(300)
    const recipe = {
      ...payload,
      id: `recipe-${String(nextId++).padStart(3, '0')}`,
      version: 1,
      status: RECIPE_STATUS.DRAFT,
      createdBy: 'current-user',
      updatedAt: new Date().toISOString(),
    }
    mockRecipes.push(recipe)
    return { data: recipe }
  }
  const res = await fetch(`${API_BASE}/processing-recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to create recipe')
  return res.json()
}

/** Update an existing recipe */
export async function updateRecipe(id, payload) {
  if (USE_MOCK) {
    await _delay(300)
    const idx = mockRecipes.findIndex(r => r.id === id)
    if (idx === -1) throw new Error('Recipe not found')
    mockRecipes[idx] = {
      ...mockRecipes[idx],
      ...payload,
      version: mockRecipes[idx].version + 1,
      updatedAt: new Date().toISOString(),
    }
    return { data: { ...mockRecipes[idx] } }
  }
  const res = await fetch(`${API_BASE}/processing-recipes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to update recipe')
  return res.json()
}

/** Delete a recipe (soft — sets status to DEPRECATED) */
export async function deleteRecipe(id) {
  if (USE_MOCK) {
    await _delay(200)
    const idx = mockRecipes.findIndex(r => r.id === id)
    if (idx === -1) throw new Error('Recipe not found')
    mockRecipes[idx].status = RECIPE_STATUS.DEPRECATED
    mockRecipes[idx].updatedAt = new Date().toISOString()
    return { data: { success: true } }
  }
  const res = await fetch(`${API_BASE}/processing-recipes/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete recipe')
  return res.json()
}

/** Activate a draft recipe */
export async function activateRecipe(id) {
  if (USE_MOCK) {
    await _delay(200)
    const idx = mockRecipes.findIndex(r => r.id === id)
    if (idx === -1) throw new Error('Recipe not found')
    mockRecipes[idx].status = RECIPE_STATUS.ACTIVE
    mockRecipes[idx].updatedAt = new Date().toISOString()
    return { data: { ...mockRecipes[idx] } }
  }
  const res = await fetch(`${API_BASE}/processing-recipes/${id}/activate`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to activate recipe')
  return res.json()
}

/** List routing templates */
export async function listRoutingTemplates({ division } = {}) {
  if (USE_MOCK) {
    await _delay(150)
    let list = [...MOCK_ROUTING_TEMPLATES]
    if (division) list = list.filter(t => t.division === division)
    // Resolve recipe references
    const resolved = list.map(t => ({
      ...t,
      steps: t.steps.map(s => ({
        ...s,
        recipe: mockRecipes.find(r => r.id === s.recipeId) || null,
      })),
    }))
    return { data: resolved }
  }
  const params = division ? `?division=${division}` : ''
  const res = await fetch(`${API_BASE}/processing-recipes/routing-templates${params}`)
  if (!res.ok) throw new Error('Failed to list routing templates')
  return res.json()
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
  const active = mockRecipes.filter(r =>
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

function _delay(ms) {
  return new Promise(r => setTimeout(r, ms))
}
