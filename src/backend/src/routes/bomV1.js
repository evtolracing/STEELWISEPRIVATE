/**
 * BOM Recipes API v1 Routes
 * Processing recipes for metals/plastics service center operations
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

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

// ============================================
// HELPER FUNCTIONS
// ============================================

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
router.get('/recipes', async (req, res) => {
  try {
    const { materialCode, commodity, form, grade, division, status } = req.query;
    
    console.log('🔍 GET /recipes called with query:', req.query);
    
    const where = {};
    
    if (materialCode) {
      where.materialCode = { contains: materialCode, mode: 'insensitive' };
    }
    if (commodity) {
      where.commodity = commodity;
    }
    if (form) {
      where.form = form;
    }
    if (grade) {
      where.grade = { contains: grade, mode: 'insensitive' };
    }
    if (division) {
      where.division = division;
    }
    if (status) {
      where.status = status;
    }
    
    console.log('🔍 Prisma where clause:', where);
    
    const recipes = await prisma.bomRecipe.findMany({
      where,
      include: {
        operations: {
          orderBy: { sequence: 'asc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    
    console.log(`✅ Found ${recipes.length} BOM recipes from database`);
    
    // Return summary (without full operations array for list view)
    const summaries = recipes.map(r => ({
      id: r.id,
      name: r.name,
      code: r.code,
      materialCode: r.materialCode,
      commodity: r.commodity,
      form: r.form,
      grade: r.grade,
      thicknessMin: r.thicknessMin ? parseFloat(r.thicknessMin) : null,
      thicknessMax: r.thicknessMax ? parseFloat(r.thicknessMax) : null,
      division: r.division,
      version: r.version,
      status: r.status,
      operationCount: r.operations.length,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
    
    res.json(summaries);
  } catch (error) {
    console.error('Error fetching BOM recipes:', error);
    res.status(500).json({ error: 'Failed to fetch BOM recipes' });
  }
});

// GET /v1/bom/recipes/:id - Get single recipe with full operations
router.get('/recipes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await prisma.bomRecipe.findUnique({
      where: { id },
      include: {
        operations: {
          orderBy: { sequence: 'asc' }
        }
      }
    });
    
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
router.post('/recipes', async (req, res) => {
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
    const existing = await prisma.bomRecipe.findFirst({ where: { code } });
    if (existing) {
      return res.status(400).json({ error: 'Recipe code already exists' });
    }
    
    const newRecipe = await prisma.bomRecipe.create({
      data: {
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
        operations: {
          create: operations.map((op, idx) => ({
            sequence: op.sequence || idx + 1,
            name: op.name,
            workCenterType: op.workCenterType,
            estimatedMachineMinutes: op.estimatedMachineMinutes || 0,
            estimatedLaborMinutes: op.estimatedLaborMinutes || 0,
            setupMinutes: op.setupMinutes || 0,
            parameters: op.parameters || {},
          }))
        }
      },
      include: {
        operations: { orderBy: { sequence: 'asc' } }
      }
    });
    
    res.status(201).json(newRecipe);
  } catch (error) {
    console.error('Error creating BOM recipe:', error);
    res.status(500).json({ error: 'Failed to create BOM recipe' });
  }
});

// PUT /v1/bom/recipes/:id - Update recipe
router.put('/recipes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await prisma.bomRecipe.findUnique({ where: { id } });
    
    if (!recipe) {
      return res.status(404).json({ error: 'BOM recipe not found' });
    }
    
    // Only allow editing in DRAFT or REVIEW status
    if (!['DRAFT', 'REVIEW'].includes(recipe.status)) {
      return res.status(400).json({ 
        error: `Cannot edit recipe in ${recipe.status} status. Only DRAFT or REVIEW recipes can be edited.`,
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
    if (code && code !== recipe.code) {
      const existing = await prisma.bomRecipe.findFirst({ 
        where: { code, NOT: { id } } 
      });
      if (existing) {
        return res.status(400).json({ error: 'Recipe code already exists' });
      }
    }
    
    // Don't allow direct status change via PUT - use /transition instead
    if (status !== undefined && status !== recipe.status) {
      return res.status(400).json({ 
        error: 'Cannot change status via PUT. Use POST /recipes/:id/transition instead' 
      });
    }
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (materialCode !== undefined) updateData.materialCode = materialCode;
    if (commodity !== undefined) updateData.commodity = commodity;
    if (form !== undefined) updateData.form = form;
    if (grade !== undefined) updateData.grade = grade;
    if (thicknessMin !== undefined) updateData.thicknessMin = thicknessMin;
    if (thicknessMax !== undefined) updateData.thicknessMax = thicknessMax;
    if (division !== undefined) updateData.division = division;
    
    if (operations !== undefined) {
      // Delete existing operations and create new ones
      await prisma.bomOperation.deleteMany({ where: { recipeId: id } });
      updateData.operations = {
        create: operations.map((op, idx) => ({
          sequence: op.sequence || idx + 1,
          name: op.name,
          workCenterType: op.workCenterType,
          estimatedMachineMinutes: op.estimatedMachineMinutes || 0,
          estimatedLaborMinutes: op.estimatedLaborMinutes || 0,
          setupMinutes: op.setupMinutes || 0,
          parameters: op.parameters || {},
        }))
      };
    }
    
    const updatedRecipe = await prisma.bomRecipe.update({
      where: { id },
      data: updateData,
      include: {
        operations: { orderBy: { sequence: 'asc' } }
      }
    });
    
    res.json(updatedRecipe);
  } catch (error) {
    console.error('Error updating BOM recipe:', error);
    res.status(500).json({ error: 'Failed to update BOM recipe' });
  }
});

// POST /v1/bom/recipes/:id/activate - Activate recipe
router.post('/recipes/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await prisma.bomRecipe.findUnique({ where: { id } });
    
    if (!recipe) {
      return res.status(404).json({ error: 'BOM recipe not found' });
    }
    
    // Use transition logic
    if (!isTransitionAllowed(recipe.status, 'ACTIVE')) {
      return res.status(400).json({ 
        error: `Cannot transition from ${recipe.status} to ACTIVE`,
        allowedTransitions: ALLOWED_TRANSITIONS[recipe.status]
      });
    }
    
    const updated = await prisma.bomRecipe.update({
      where: { id },
      data: { status: 'ACTIVE' },
      include: { operations: { orderBy: { sequence: 'asc' } } }
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Error activating BOM recipe:', error);
    res.status(500).json({ error: 'Failed to activate BOM recipe' });
  }
});

// POST /v1/bom/recipes/:id/transition - Transition recipe status
router.post('/recipes/:id/transition', async (req, res) => {
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
    
    const recipe = await prisma.bomRecipe.findUnique({ where: { id } });
    
    if (!recipe) {
      return res.status(404).json({ error: 'BOM recipe not found' });
    }
    
    const currentStatus = recipe.status;
    
    if (!isTransitionAllowed(currentStatus, targetStatus)) {
      return res.status(400).json({ 
        error: `Cannot transition from ${currentStatus} to ${targetStatus}`,
        allowedTransitions: ALLOWED_TRANSITIONS[currentStatus]
      });
    }
    
    const updated = await prisma.bomRecipe.update({
      where: { id },
      data: { status: targetStatus },
      include: { operations: { orderBy: { sequence: 'asc' } } }
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Error transitioning BOM recipe:', error);
    res.status(500).json({ error: 'Failed to transition BOM recipe' });
  }
});

// POST /v1/bom/recipes/:id/clone - Clone recipe
router.post('/recipes/:id/clone', async (req, res) => {
  try {
    const { id } = req.params;
    const sourceRecipe = await prisma.bomRecipe.findUnique({
      where: { id },
      include: { operations: { orderBy: { sequence: 'asc' } } }
    });
    
    if (!sourceRecipe) {
      return res.status(404).json({ error: 'BOM recipe not found' });
    }
    
    // Find highest version for this recipe code
    const sameCodeRecipes = await prisma.bomRecipe.findMany({
      where: { code: sourceRecipe.code }
    });
    const maxVersion = Math.max(...sameCodeRecipes.map(r => r.version), 0);
    const newVersion = maxVersion + 1;
    
    const clonedRecipe = await prisma.bomRecipe.create({
      data: {
        name: `${sourceRecipe.name.replace(/ v\d+$/, '')} v${newVersion}`,
        code: sourceRecipe.code,
        materialCode: sourceRecipe.materialCode,
        commodity: sourceRecipe.commodity,
        form: sourceRecipe.form,
        grade: sourceRecipe.grade,
        thicknessMin: sourceRecipe.thicknessMin,
        thicknessMax: sourceRecipe.thicknessMax,
        division: sourceRecipe.division,
        version: newVersion,
        status: 'DRAFT',
        operations: {
          create: sourceRecipe.operations.map(op => ({
            sequence: op.sequence,
            name: op.name,
            workCenterType: op.workCenterType,
            estimatedMachineMinutes: op.estimatedMachineMinutes,
            estimatedLaborMinutes: op.estimatedLaborMinutes,
            setupMinutes: op.setupMinutes,
            parameters: op.parameters,
          }))
        }
      },
      include: { operations: { orderBy: { sequence: 'asc' } } }
    });
    
    res.status(201).json(clonedRecipe);
  } catch (error) {
    console.error('Error cloning BOM recipe:', error);
    res.status(500).json({ error: 'Failed to clone BOM recipe' });
  }
});

// POST /v1/bom/recipes/match - Find best matching recipe
router.post('/recipes/match', async (req, res) => {
  try {
    const { materialCode, commodity, form, grade, thickness, division, allowNonActive } = req.body;
    
    // Only consider ACTIVE recipes by default
    const statusFilter = allowNonActive ? ['ACTIVE', 'DEPRECATED'] : ['ACTIVE'];
    
    const candidateRecipes = await prisma.bomRecipe.findMany({
      where: { status: { in: statusFilter } },
      include: { operations: { orderBy: { sequence: 'asc' } } }
    });
    
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
