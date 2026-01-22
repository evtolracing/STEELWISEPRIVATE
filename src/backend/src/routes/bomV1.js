/**
 * BOM Recipes API v1 Routes
 * Processing recipes for metals/plastics service center operations
 * In-memory data for development
 */

import { Router } from 'express';

const router = Router();

// ============================================
// IN-MEMORY DATABASE
// ============================================

// Valid status values and allowed transitions
const RECIPE_STATUS = {
  DRAFT: 'DRAFT',
  REVIEW: 'REVIEW',
  ACTIVE: 'ACTIVE',
  DEPRECATED: 'DEPRECATED',
  ARCHIVED: 'ARCHIVED',
};

const ALLOWED_TRANSITIONS = {
  DRAFT: ['REVIEW', 'ARCHIVED'],
  REVIEW: ['ACTIVE', 'DRAFT', 'ARCHIVED'],
  ACTIVE: ['DEPRECATED'],
  DEPRECATED: ['ARCHIVED'],
  ARCHIVED: [],
};

function isTransitionAllowed(fromStatus, toStatus) {
  return ALLOWED_TRANSITIONS[fromStatus]?.includes(toStatus) || false;
}

let bomRecipes = [
  {
    id: 'BOM-001',
    name: '6061 Aluminum Plate Standard Processing',
    code: 'REC-AL6061-PLATE-STD',
    materialCode: 'AL-6061-100',
    commodity: 'ALUMINUM',
    form: 'PLATE',
    grade: '6061-T6',
    thicknessMin: 0.5,
    thicknessMax: 2.0,
    division: 'METALS',
    version: 1,
    status: 'ACTIVE',
    operations: [
      {
        id: 'OP-001-1',
        sequence: 1,
        name: 'SAW CUT',
        workCenterType: 'SAW',
        estimatedMachineMinutes: 15,
        estimatedLaborMinutes: 10,
        setupMinutes: 5,
        parameters: [
          { key: 'tolerance', label: 'Length Tolerance', value: '±0.030"' },
          { key: 'blade_type', label: 'Blade Type', value: 'CARBIDE_ALUMINUM' },
        ],
      },
      {
        id: 'OP-001-2',
        sequence: 2,
        name: 'DEBURR',
        workCenterType: 'FINISHING',
        estimatedMachineMinutes: 8,
        estimatedLaborMinutes: 12,
        setupMinutes: 2,
        parameters: [
          { key: 'edge_finish', label: 'Edge Finish', value: 'DEBURR_ALL_EDGES' },
          { key: 'tool', label: 'Tool', value: 'DEBURRING_WHEEL' },
        ],
      },
      {
        id: 'OP-001-3',
        sequence: 3,
        name: 'PACK',
        workCenterType: 'PACKOUT',
        estimatedMachineMinutes: 0,
        estimatedLaborMinutes: 5,
        setupMinutes: 1,
        parameters: [
          { key: 'protection', label: 'Protection', value: 'KRAFT_PAPER_WRAP' },
          { key: 'label', label: 'Label Required', value: 'YES' },
        ],
      },
    ],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'BOM-001-V2',
    name: '6061 Aluminum Plate Standard Processing v2',
    code: 'REC-AL6061-PLATE-STD',
    materialCode: 'AL-6061-100',
    commodity: 'ALUMINUM',
    form: 'PLATE',
    grade: '6061-T6',
    thicknessMin: 0.5,
    thicknessMax: 2.0,
    division: 'METALS',
    version: 2,
    status: 'DEPRECATED',
    operations: [
      {
        id: 'OP-001V2-1',
        sequence: 1,
        name: 'SAW CUT',
        workCenterType: 'SAW',
        estimatedMachineMinutes: 15,
        estimatedLaborMinutes: 10,
        setupMinutes: 5,
        parameters: [
          { key: 'tolerance', label: 'Length Tolerance', value: '±0.030"' },
          { key: 'blade_type', label: 'Blade Type', value: 'CARBIDE_ALUMINUM' },
        ],
      },
      {
        id: 'OP-001V2-2',
        sequence: 2,
        name: 'PACK',
        workCenterType: 'PACKOUT',
        estimatedMachineMinutes: 0,
        estimatedLaborMinutes: 5,
        setupMinutes: 1,
        parameters: [
          { key: 'protection', label: 'Protection', value: 'KRAFT_PAPER_WRAP' },
        ],
      },
    ],
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'BOM-002',
    name: 'A36 Steel Sheet Basic Processing',
    code: 'REC-A36-SHEET-BASIC',
    materialCode: 'HR-0125-48',
    commodity: 'STEEL',
    form: 'SHEET',
    grade: 'A36',
    thicknessMin: 0.0625,
    thicknessMax: 0.250,
    division: 'METALS',
    version: 1,
    status: 'REVIEW',
    operations: [
      {
        id: 'OP-002-1',
        sequence: 1,
        name: 'SHEAR CUT',
        workCenterType: 'SHEAR',
        estimatedMachineMinutes: 5,
        estimatedLaborMinutes: 8,
        setupMinutes: 3,
        parameters: [
          { key: 'tolerance', label: 'Cut Tolerance', value: '±0.0625"' },
          { key: 'edge_quality', label: 'Edge Quality', value: 'STANDARD' },
        ],
      },
      {
        id: 'OP-002-2',
        sequence: 2,
        name: 'PACK',
        workCenterType: 'PACKOUT',
        estimatedMachineMinutes: 0,
        estimatedLaborMinutes: 4,
        setupMinutes: 1,
        parameters: [
          { key: 'protection', label: 'Protection', value: 'VCI_PAPER' },
          { key: 'banding', label: 'Banding', value: 'STEEL_STRAPPING' },
        ],
      },
    ],
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'BOM-003',
    name: 'Stainless 304 Sheet Premium Processing',
    code: 'REC-SS304-SHEET-PREMIUM',
    materialCode: 'SS-304-0048-48',
    commodity: 'STAINLESS',
    form: 'SHEET',
    grade: '304',
    thicknessMin: 0.035,
    thicknessMax: 0.125,
    division: 'METALS',
    version: 2,
    status: 'ACTIVE',
    operations: [
      {
        id: 'OP-003-1',
        sequence: 1,
        name: 'SHEAR CUT',
        workCenterType: 'SHEAR',
        estimatedMachineMinutes: 8,
        estimatedLaborMinutes: 10,
        setupMinutes: 5,
        parameters: [
          { key: 'tolerance', label: 'Cut Tolerance', value: '±0.030"' },
          { key: 'blade', label: 'Blade Type', value: 'STAINLESS_DEDICATED' },
        ],
      },
      {
        id: 'OP-003-2',
        sequence: 2,
        name: 'DEBURR',
        workCenterType: 'FINISHING',
        estimatedMachineMinutes: 10,
        estimatedLaborMinutes: 15,
        setupMinutes: 2,
        parameters: [
          { key: 'edge_finish', label: 'Edge Finish', value: 'SMOOTH_ALL_EDGES' },
          { key: 'passivation', label: 'Passivation', value: 'LIGHT_PASSIVATE' },
        ],
      },
      {
        id: 'OP-003-3',
        sequence: 3,
        name: 'PROTECTIVE FILM',
        workCenterType: 'FINISHING',
        estimatedMachineMinutes: 0,
        estimatedLaborMinutes: 8,
        setupMinutes: 1,
        parameters: [
          { key: 'film_type', label: 'Film Type', value: 'BLUE_PROTECTIVE_FILM' },
          { key: 'coverage', label: 'Coverage', value: 'FULL_BOTH_SIDES' },
        ],
      },
      {
        id: 'OP-003-4',
        sequence: 4,
        name: 'PACK',
        workCenterType: 'PACKOUT',
        estimatedMachineMinutes: 0,
        estimatedLaborMinutes: 5,
        setupMinutes: 1,
        parameters: [
          { key: 'protection', label: 'Protection', value: 'INTERLEAVED_PAPER' },
          { key: 'crating', label: 'Crating', value: 'WOOD_CRATE_IF_OVER_100LBS' },
        ],
      },
    ],
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'BOM-004',
    name: 'Acrylic Sheet Standard Processing',
    code: 'REC-ACRYLIC-SHEET-STD',
    materialCode: 'ACRY-CLR-0250',
    commodity: 'PLASTICS',
    form: 'SHEET',
    grade: 'ACRYLIC',
    thicknessMin: 0.125,
    thicknessMax: 0.500,
    division: 'PLASTICS',
    version: 1,
    status: 'ACTIVE',
    operations: [
      {
        id: 'OP-004-1',
        sequence: 1,
        name: 'ROUTER CUT',
        workCenterType: 'ROUTER',
        estimatedMachineMinutes: 20,
        estimatedLaborMinutes: 15,
        setupMinutes: 10,
        parameters: [
          { key: 'bit_type', label: 'Bit Type', value: 'SPIRAL_UPCUT' },
          { key: 'feed_rate', label: 'Feed Rate', value: '150_IPM' },
          { key: 'tolerance', label: 'Tolerance', value: '±0.010"' },
        ],
      },
      {
        id: 'OP-004-2',
        sequence: 2,
        name: 'EDGE POLISH',
        workCenterType: 'FINISHING',
        estimatedMachineMinutes: 12,
        estimatedLaborMinutes: 18,
        setupMinutes: 3,
        parameters: [
          { key: 'finish', label: 'Finish Type', value: 'FLAME_POLISH' },
          { key: 'edges', label: 'Edges', value: 'ALL_FOUR_SIDES' },
        ],
      },
      {
        id: 'OP-004-3',
        sequence: 3,
        name: 'PACK',
        workCenterType: 'PACKOUT',
        estimatedMachineMinutes: 0,
        estimatedLaborMinutes: 6,
        setupMinutes: 1,
        parameters: [
          { key: 'protection', label: 'Protection', value: 'MASKING_FILM_BOTH_SIDES' },
          { key: 'packaging', label: 'Packaging', value: 'CARDBOARD_CORNER_PROTECTORS' },
        ],
      },
    ],
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'BOM-005',
    name: 'HDPE Sheet Router Processing',
    code: 'REC-HDPE-SHEET-ROUTER',
    materialCode: 'POLY-HDPE-0500',
    commodity: 'PLASTICS',
    form: 'SHEET',
    grade: 'HDPE',
    thicknessMin: 0.250,
    thicknessMax: 1.000,
    division: 'PLASTICS',
    version: 1,
    status: 'DRAFT',
    operations: [
      {
        id: 'OP-005-1',
        sequence: 1,
        name: 'ROUTER CUT',
        workCenterType: 'ROUTER',
        estimatedMachineMinutes: 18,
        estimatedLaborMinutes: 12,
        setupMinutes: 8,
        parameters: [
          { key: 'bit_type', label: 'Bit Type', value: 'STRAIGHT_FLUTE' },
          { key: 'feed_rate', label: 'Feed Rate', value: '200_IPM' },
        ],
      },
      {
        id: 'OP-005-2',
        sequence: 2,
        name: 'DEBURR',
        workCenterType: 'FINISHING',
        estimatedMachineMinutes: 5,
        estimatedLaborMinutes: 10,
        setupMinutes: 2,
        parameters: [
          { key: 'method', label: 'Method', value: 'HAND_SCRAPER' },
        ],
      },
      {
        id: 'OP-005-3',
        sequence: 3,
        name: 'PACK',
        workCenterType: 'PACKOUT',
        estimatedMachineMinutes: 0,
        estimatedLaborMinutes: 4,
        setupMinutes: 1,
        parameters: [
          { key: 'protection', label: 'Protection', value: 'STRETCH_WRAP' },
        ],
      },
    ],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateId(prefix) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

function generateOperationId(bomId, sequence) {
  return `OP-${bomId}-${sequence}`;
}

// Match scoring for recipe selection
function scoreMatch(recipe, criteria) {
  let score = 0;
  
  // Exact material code match is highest priority
  if (criteria.materialCode && recipe.materialCode === criteria.materialCode) {
    score += 100;
  }
  
  // Commodity match
  if (criteria.commodity && recipe.commodity === criteria.commodity) {
    score += 20;
  }
  
  // Form match
  if (criteria.form && recipe.form === criteria.form) {
    score += 15;
  }
  
  // Grade match
  if (criteria.grade && recipe.grade && recipe.grade.toLowerCase() === criteria.grade.toLowerCase()) {
    score += 10;
  }
  
  // Division match
  if (criteria.division && recipe.division === criteria.division) {
    score += 5;
  }
  
  // Thickness range match
  if (criteria.thickness !== undefined && recipe.thicknessMin !== null && recipe.thicknessMax !== null) {
    if (criteria.thickness >= recipe.thicknessMin && criteria.thickness <= recipe.thicknessMax) {
      score += 8;
    }
  }
  
  return score;
}

// ============================================
// BOM RECIPES ENDPOINTS
// ============================================

// GET /v1/bom/recipes - List recipes with filters
router.get('/recipes', (req, res) => {
  try {
    const { materialCode, commodity, form, grade, division, status } = req.query;
    
    let filtered = [...bomRecipes];
    
    if (materialCode) {
      filtered = filtered.filter(r => r.materialCode && r.materialCode.toLowerCase().includes(materialCode.toLowerCase()));
    }
    if (commodity) {
      filtered = filtered.filter(r => r.commodity === commodity);
    }
    if (form) {
      filtered = filtered.filter(r => r.form === form);
    }
    if (grade) {
      filtered = filtered.filter(r => r.grade && r.grade.toLowerCase().includes(grade.toLowerCase()));
    }
    if (division) {
      filtered = filtered.filter(r => r.division === division);
    }
    if (status) {
      filtered = filtered.filter(r => r.status === status);
    }
    
    // Return summary (without full operations array for list view)
    const summaries = filtered.map(r => ({
      id: r.id,
      name: r.name,
      code: r.code,
      materialCode: r.materialCode,
      commodity: r.commodity,
      form: r.form,
      grade: r.grade,
      thicknessMin: r.thicknessMin,
      thicknessMax: r.thicknessMax,
      division: r.division,
      version: r.version,
      status: r.status,
      operationCount: r.operations.length,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
    
    res.json(summaries);
  } catch (error) {
    console.error('Error fetching BOM recipes:', error);
    res.status(500).json({ error: 'Failed to fetch BOM recipes' });
  }
});

// GET /v1/bom/recipes/:id - Get single recipe with full operations
router.get('/recipes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const recipe = bomRecipes.find(r => r.id === id);
    
    if (!recipe) {
      return res.status(404).json({ error: 'BOM recipe not found' });
    }
    
    res.json(recipe);
  } catch (error) {
    console.error('Error fetching BOM recipe:', error);
    res.status(500).json({ error: 'Failed to fetch BOM recipe' });
  }
});

// POST /v1/bom/recipes - Create new recipe
router.post('/recipes', (req, res) => {
  try {
    const {
      name,
      code,
      materialCode,
      commodity,
      form,
      grade,
      thicknessMin,
      thicknessMax,
      division,
      operations = [],
    } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({ error: 'name and code are required' });
    }
    
    // Check if code already exists
    if (bomRecipes.find(r => r.code === code)) {
      return res.status(400).json({ error: 'Recipe code already exists' });
    }
    
    const newRecipe = {
      id: generateId('BOM'),
      name,
      code,
      materialCode: materialCode || null,
      commodity: commodity || null,
      form: form || null,
      grade: grade || null,
      thicknessMin: thicknessMin !== undefined ? thicknessMin : null,
      thicknessMax: thicknessMax !== undefined ? thicknessMax : null,
      division: division || null,
      version: 1,
      status: 'DRAFT',
      operations: operations.map((op, idx) => ({
        id: generateId('OP'),
        sequence: op.sequence || idx + 1,
        name: op.name,
        workCenterType: op.workCenterType,
        estimatedMachineMinutes: op.estimatedMachineMinutes || 0,
        estimatedLaborMinutes: op.estimatedLaborMinutes || 0,
        setupMinutes: op.setupMinutes || 0,
        parameters: op.parameters || [],
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    bomRecipes.push(newRecipe);
    
    res.status(201).json(newRecipe);
  } catch (error) {
    console.error('Error creating BOM recipe:', error);
    res.status(500).json({ error: 'Failed to create BOM recipe' });
  }
});

// PUT /v1/bom/recipes/:id - Update recipe
router.put('/recipes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const index = bomRecipes.findIndex(r => r.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'BOM recipe not found' });
    }
    
    // Only allow editing in DRAFT or REVIEW status
    if (!['DRAFT', 'REVIEW'].includes(bomRecipes[index].status)) {
      return res.status(400).json({ 
        error: `Cannot edit recipe in ${bomRecipes[index].status} status. Only DRAFT or REVIEW recipes can be edited.`,
        suggestion: 'Clone this recipe to create a new editable version'
      });
    }
    
    const {
      name,
      code,
      materialCode,
      commodity,
      form,
      grade,
      thicknessMin,
      thicknessMax,
      division,
      status,
      operations,
    } = req.body;
    
    // Check if code change conflicts with existing
    if (code && code !== bomRecipes[index].code) {
      if (bomRecipes.find(r => r.code === code && r.id !== id)) {
        return res.status(400).json({ error: 'Recipe code already exists' });
      }
    }
    
    // Update fields
    if (name !== undefined) bomRecipes[index].name = name;
    if (code !== undefined) bomRecipes[index].code = code;
    if (materialCode !== undefined) bomRecipes[index].materialCode = materialCode;
    if (commodity !== undefined) bomRecipes[index].commodity = commodity;
    if (form !== undefined) bomRecipes[index].form = form;
    if (grade !== undefined) bomRecipes[index].grade = grade;
    if (thicknessMin !== undefined) bomRecipes[index].thicknessMin = thicknessMin;
    if (thicknessMax !== undefined) bomRecipes[index].thicknessMax = thicknessMax;
    if (division !== undefined) bomRecipes[index].division = division;
    
    // Don't allow direct status change via PUT - use /transition instead
    if (status !== undefined && status !== bomRecipes[index].status) {
      return res.status(400).json({ 
        error: 'Cannot change status via PUT. Use POST /recipes/:id/transition instead' 
      });
    }
    
    if (operations !== undefined) {
      bomRecipes[index].operations = operations.map((op, idx) => ({
        id: op.id || generateId('OP'),
        sequence: op.sequence || idx + 1,
        name: op.name,
        workCenterType: op.workCenterType,
        estimatedMachineMinutes: op.estimatedMachineMinutes || 0,
        estimatedLaborMinutes: op.estimatedLaborMinutes || 0,
        setupMinutes: op.setupMinutes || 0,
        parameters: op.parameters || [],
      }));
    }
    
    bomRecipes[index].updatedAt = new Date().toISOString();
    
    res.json(bomRecipes[index]);
  } catch (error) {
    console.error('Error updating BOM recipe:', error);
    res.status(500).json({ error: 'Failed to update BOM recipe' });
  }
});

// POST /v1/bom/recipes/:id/activate - Activate recipe
router.post('/recipes/:id/activate', (req, res) => {
  try {
    const { id } = req.params;
    const index = bomRecipes.findIndex(r => r.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'BOM recipe not found' });
    }
    
    // Use transition logic
    if (!isTransitionAllowed(bomRecipes[index].status, 'ACTIVE')) {
      return res.status(400).json({ 
        error: `Cannot transition from ${bomRecipes[index].status} to ACTIVE`,
        allowedTransitions: ALLOWED_TRANSITIONS[bomRecipes[index].status]
      });
    }
    
    bomRecipes[index].status = 'ACTIVE';
    bomRecipes[index].updatedAt = new Date().toISOString();
    
    res.json(bomRecipes[index]);
  } catch (error) {
    console.error('Error activating BOM recipe:', error);
    res.status(500).json({ error: 'Failed to activate BOM recipe' });
  }
});

// POST /v1/bom/recipes/:id/transition - Transition recipe status
router.post('/recipes/:id/transition', (req, res) => {
  try {
    const { id } = req.params;
    const { targetStatus } = req.body;
    
    if (!targetStatus) {
      return res.status(400).json({ error: 'targetStatus is required' });
    }
    
    if (!Object.values(RECIPE_STATUS).includes(targetStatus)) {
      return res.status(400).json({ 
        error: 'Invalid targetStatus',
        validStatuses: Object.values(RECIPE_STATUS)
      });
    }
    
    const index = bomRecipes.findIndex(r => r.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'BOM recipe not found' });
    }
    
    const currentStatus = bomRecipes[index].status;
    
    if (!isTransitionAllowed(currentStatus, targetStatus)) {
      return res.status(400).json({ 
        error: `Cannot transition from ${currentStatus} to ${targetStatus}`,
        allowedTransitions: ALLOWED_TRANSITIONS[currentStatus]
      });
    }
    
    bomRecipes[index].status = targetStatus;
    bomRecipes[index].updatedAt = new Date().toISOString();
    
    res.json(bomRecipes[index]);
  } catch (error) {
    console.error('Error transitioning BOM recipe:', error);
    res.status(500).json({ error: 'Failed to transition BOM recipe' });
  }
});

// POST /v1/bom/recipes/:id/clone - Clone recipe
router.post('/recipes/:id/clone', (req, res) => {
  try {
    const { id } = req.params;
    const sourceRecipe = bomRecipes.find(r => r.id === id);
    
    if (!sourceRecipe) {
      return res.status(404).json({ error: 'BOM recipe not found' });
    }
    
    // Find highest version for this recipe code
    const sameCodeRecipes = bomRecipes.filter(r => r.code === sourceRecipe.code);
    const maxVersion = Math.max(...sameCodeRecipes.map(r => r.version), 0);
    const newVersion = maxVersion + 1;
    
    const clonedRecipe = {
      ...sourceRecipe,
      id: generateId('BOM'),
      name: `${sourceRecipe.name.replace(/ v\d+$/, '')} v${newVersion}`,
      version: newVersion,
      status: 'DRAFT',
      operations: sourceRecipe.operations.map(op => ({
        ...op,
        id: generateId('OP'),
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    bomRecipes.push(clonedRecipe);
    
    res.status(201).json(clonedRecipe);
  } catch (error) {
    console.error('Error cloning BOM recipe:', error);
    res.status(500).json({ error: 'Failed to clone BOM recipe' });
  }
});

// POST /v1/bom/recipes/match - Find best matching recipe
router.post('/recipes/match', (req, res) => {
  try {
    const { materialCode, commodity, form, grade, thickness, division, allowNonActive } = req.body;
    
    // Only consider ACTIVE recipes by default
    let candidateRecipes = bomRecipes.filter(r => r.status === 'ACTIVE');
    
    // Allow override for testing/legacy jobs
    if (allowNonActive) {
      candidateRecipes = bomRecipes.filter(r => ['ACTIVE', 'DEPRECATED'].includes(r.status));
    }
    
    if (candidateRecipes.length === 0) {
      return res.status(404).json({ error: 'No matching active recipes found' });
    }
    
    // Score each recipe
    const scored = candidateRecipes.map(recipe => ({
      recipe,
      score: scoreMatch(recipe, { materialCode, commodity, form, grade, thickness, division }),
    }));
    
    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);
    
    // Return best match if score > 0
    if (scored[0].score > 0) {
      res.json({ 
        match: scored[0].recipe, 
        score: scored[0].score,
        matchReason: `Matched with score ${scored[0].score} (exact materialCode: ${scored[0].recipe.materialCode === materialCode ? 'yes' : 'no'})`
      });
    } else {
      res.status(404).json({ 
        error: 'No matching recipe found', 
        criteria: { materialCode, commodity, form, grade, thickness, division } 
      });
    }
  } catch (error) {
    console.error('Error matching BOM recipe:', error);
    res.status(500).json({ error: 'Failed to match BOM recipe' });
  }
});

// ============================================
// AI SUGGESTION ENDPOINT
// ============================================

// POST /v1/ai/bom-suggest - Suggest recipe from description
router.post('/ai-suggest', (req, res) => {
  try {
    const { description, commodity, form, materialCode } = req.body;
    
    if (!description) {
      return res.status(400).json({ error: 'description is required' });
    }
    
    const descLower = description.toLowerCase();
    const suggestedOperations = [];
    let sequence = 1;
    
    // Determine if we need cutting operations
    const needsCut = descLower.includes('cut') || descLower.includes('saw') || descLower.includes('shear') || descLower.includes('router');
    
    // For PLASTICS or if "router" mentioned
    if ((commodity === 'PLASTICS' || descLower.includes('router') || descLower.includes('cnc')) && needsCut) {
      suggestedOperations.push({
        id: generateId('OP'),
        sequence: sequence++,
        name: 'ROUTER CUT',
        workCenterType: 'ROUTER',
        estimatedMachineMinutes: 15,
        estimatedLaborMinutes: 10,
        setupMinutes: 8,
        parameters: [
          { key: 'bit_type', label: 'Bit Type', value: 'SPIRAL_UPCUT' },
          { key: 'tolerance', label: 'Tolerance', value: '±0.010"' },
        ],
      });
    }
    // For METALS
    else if (needsCut) {
      // Determine saw vs shear based on form/keywords
      if (form === 'PLATE' || form === 'BAR' || descLower.includes('saw') || descLower.includes('plate')) {
        suggestedOperations.push({
          id: generateId('OP'),
          sequence: sequence++,
          name: 'SAW CUT',
          workCenterType: 'SAW',
          estimatedMachineMinutes: 12,
          estimatedLaborMinutes: 8,
          setupMinutes: 5,
          parameters: [
            { key: 'tolerance', label: 'Length Tolerance', value: '±0.030"' },
          ],
        });
      } else if (form === 'SHEET' || descLower.includes('shear') || descLower.includes('sheet')) {
        suggestedOperations.push({
          id: generateId('OP'),
          sequence: sequence++,
          name: 'SHEAR CUT',
          workCenterType: 'SHEAR',
          estimatedMachineMinutes: 6,
          estimatedLaborMinutes: 8,
          setupMinutes: 3,
          parameters: [
            { key: 'tolerance', label: 'Cut Tolerance', value: '±0.0625"' },
          ],
        });
      }
    }
    
    // Waterjet if mentioned
    if (descLower.includes('waterjet') || descLower.includes('water jet')) {
      suggestedOperations.push({
        id: generateId('OP'),
        sequence: sequence++,
        name: 'WATERJET CUT',
        workCenterType: 'WATERJET',
        estimatedMachineMinutes: 30,
        estimatedLaborMinutes: 15,
        setupMinutes: 10,
        parameters: [
          { key: 'tolerance', label: 'Tolerance', value: '±0.005"' },
          { key: 'abrasive', label: 'Abrasive', value: 'GARNET_80_MESH' },
        ],
      });
    }
    
    // Deburr/finishing
    if (descLower.includes('debur') || descLower.includes('deburr') || descLower.includes('finish') || descLower.includes('polish') || descLower.includes('edge')) {
      const isPlastics = commodity === 'PLASTICS';
      suggestedOperations.push({
        id: generateId('OP'),
        sequence: sequence++,
        name: isPlastics ? 'EDGE POLISH' : 'DEBURR',
        workCenterType: 'FINISHING',
        estimatedMachineMinutes: isPlastics ? 10 : 8,
        estimatedLaborMinutes: isPlastics ? 15 : 12,
        setupMinutes: 2,
        parameters: [
          { key: 'edge_finish', label: 'Edge Finish', value: isPlastics ? 'FLAME_POLISH' : 'DEBURR_ALL_EDGES' },
        ],
      });
    }
    
    // Protective film for stainless or premium
    if (descLower.includes('stainless') || descLower.includes('film') || descLower.includes('protect')) {
      suggestedOperations.push({
        id: generateId('OP'),
        sequence: sequence++,
        name: 'PROTECTIVE FILM',
        workCenterType: 'FINISHING',
        estimatedMachineMinutes: 0,
        estimatedLaborMinutes: 6,
        setupMinutes: 1,
        parameters: [
          { key: 'film_type', label: 'Film Type', value: 'BLUE_PROTECTIVE_FILM' },
        ],
      });
    }
    
    // Pack (almost always included)
    if (descLower.includes('pack') || descLower.includes('ship') || descLower.includes('wrap') || suggestedOperations.length > 0) {
      suggestedOperations.push({
        id: generateId('OP'),
        sequence: sequence++,
        name: 'PACK',
        workCenterType: 'PACKOUT',
        estimatedMachineMinutes: 0,
        estimatedLaborMinutes: 5,
        setupMinutes: 1,
        parameters: [
          { key: 'protection', label: 'Protection', value: commodity === 'PLASTICS' ? 'MASKING_FILM' : 'KRAFT_PAPER_WRAP' },
        ],
      });
    }
    
    // Generate suggested name
    let suggestedName = '';
    if (materialCode) {
      suggestedName = `${materialCode} Processing`;
    } else if (commodity && form) {
      suggestedName = `${commodity} ${form} Processing`;
    } else {
      suggestedName = 'Custom Processing Recipe';
    }
    
    if (suggestedOperations.length > 0) {
      const opNames = suggestedOperations.slice(0, 3).map(op => op.name).join(' + ');
      suggestedName += ` (${opNames})`;
    }
    
    res.json({
      suggestedName,
      suggestedOperations,
      analysisNotes: `Generated ${suggestedOperations.length} operation(s) based on description: "${description}"`,
    });
  } catch (error) {
    console.error('AI suggestion error:', error);
    res.status(500).json({ error: 'Failed to generate AI suggestion' });
  }
});

export default router;
