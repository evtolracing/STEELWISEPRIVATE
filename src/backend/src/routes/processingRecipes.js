/**
 * Processing recipes: time and price standards per operation, plus routing templates.
 *
 *   GET    /api/processing-recipes?division=&operationType=&status=&search=
 *   GET    /api/processing-recipes/routing-templates?division=
 *   GET    /api/processing-recipes/:id
 *   POST   /api/processing-recipes             create (starts as DRAFT, version 1)
 *   PUT    /api/processing-recipes/:id         update (bumps version)
 *   DELETE /api/processing-recipes/:id         soft delete (DEPRECATED)
 *   POST   /api/processing-recipes/:id/activate
 */
import { Router } from 'express';
import prisma from '../lib/db.js';
import { ci } from '../lib/dbText.js';

const router = Router();

const OPERATION_TYPES = ['CUT', 'FORM', 'MACHINE', 'FINISH', 'HEAT_TREAT', 'INSPECT'];
const TOLERANCES = ['STANDARD', 'CLOSE', 'TIGHT'];

function toApi(r) {
  return {
    ...r,
    pricePerUnit: Number(r.pricePerUnit),
    applicableMaterials: Array.isArray(r.applicableMaterials) ? r.applicableMaterials : [],
    applicableForms: Array.isArray(r.applicableForms) ? r.applicableForms : [],
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

const list = (v) => (Array.isArray(v) ? v.map(String).filter(Boolean) : typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : undefined);
const numOr = (v) => (v === undefined || v === null || v === '' ? undefined : Number(v));

/** Pick and clean the editable fields; returns { data } or { error }. */
function readFields(body = {}, { creating } = {}) {
  const data = {};
  for (const k of ['code', 'name', 'description', 'operationType', 'division', 'workCenter', 'toleranceClass', 'priceUnit', 'notes']) {
    if (body[k] !== undefined) data[k] = body[k] === null ? null : String(body[k]).trim();
  }
  for (const k of ['setupMinutes', 'runMinutesPerUnit', 'minRunMinutes', 'thicknessMin', 'thicknessMax', 'pricePerUnit']) {
    const n = numOr(body[k]);
    if (n !== undefined) {
      if (!Number.isFinite(n) || n < 0) return { error: `${k} must be a number of 0 or more` };
      data[k] = n;
    }
  }
  for (const k of ['applicableMaterials', 'applicableForms']) {
    const l = list(body[k]);
    if (l !== undefined) data[k] = l;
  }
  if (creating) {
    if (!data.code) return { error: 'code is required' };
    if (!data.name) return { error: 'name is required' };
    if (!data.operationType) return { error: 'operationType is required' };
  }
  if (data.code !== undefined) data.code = data.code.toUpperCase();
  if (data.operationType && !OPERATION_TYPES.includes(data.operationType)) return { error: `operationType must be one of ${OPERATION_TYPES.join(', ')}` };
  if (data.toleranceClass && !TOLERANCES.includes(data.toleranceClass)) return { error: `toleranceClass must be one of ${TOLERANCES.join(', ')}` };
  if (data.thicknessMin !== undefined && data.thicknessMax !== undefined && data.thicknessMin > data.thicknessMax) {
    return { error: 'thicknessMin cannot be above thicknessMax' };
  }
  return { data };
}

const handle = (label, fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'A recipe with that code already exists' });
    if (error.code === 'P2025') return res.status(404).json({ error: 'Recipe not found' });
    console.error(`Recipes: ${label} failed:`, error);
    res.status(500).json({ error: `Failed to ${label}` });
  }
};

router.get('/', handle('list recipes', async (req, res) => {
  const { division, operationType, status, search } = req.query;
  const where = {};
  if (division) where.division = String(division);
  if (operationType) where.operationType = String(operationType);
  if (status) where.status = String(status);
  if (search) {
    const q = String(search);
    where.OR = [{ name: { contains: q, ...ci } }, { code: { contains: q, ...ci } }, { description: { contains: q, ...ci } }];
  }
  const rows = await prisma.processingRecipe.findMany({ where, orderBy: { code: 'asc' } });
  res.json({ data: rows.map(toApi), total: rows.length });
}));

router.get('/routing-templates', handle('list routing templates', async (req, res) => {
  const where = req.query.division ? { division: String(req.query.division) } : {};
  const templates = await prisma.recipeRoutingTemplate.findMany({ where, orderBy: { id: 'asc' } });
  const ids = [...new Set(templates.flatMap((t) => (Array.isArray(t.steps) ? t.steps : []).map((s) => s.recipeId)))];
  const recipes = await prisma.processingRecipe.findMany({ where: { id: { in: ids } } });
  const byId = new Map(recipes.map((r) => [r.id, toApi(r)]));
  res.json({
    data: templates.map((t) => ({
      id: t.id, name: t.name, division: t.division,
      steps: (Array.isArray(t.steps) ? t.steps : []).map((s) => ({ ...s, recipe: byId.get(s.recipeId) || null })),
    })),
  });
}));

router.get('/:id', handle('load recipe', async (req, res) => {
  const r = await prisma.processingRecipe.findUnique({ where: { id: req.params.id } });
  if (!r) return res.status(404).json({ error: 'Recipe not found' });
  res.json({ data: toApi(r) });
}));

router.post('/', handle('create recipe', async (req, res) => {
  const { data, error } = readFields(req.body, { creating: true });
  if (error) return res.status(400).json({ error });
  const r = await prisma.processingRecipe.create({
    data: { ...data, status: 'DRAFT', version: 1, createdBy: req.body?.createdBy ? String(req.body.createdBy) : null },
  });
  res.status(201).json({ data: toApi(r) });
}));

router.put('/:id', handle('update recipe', async (req, res) => {
  const { data, error } = readFields(req.body);
  if (error) return res.status(400).json({ error });
  const current = await prisma.processingRecipe.findUnique({ where: { id: req.params.id } });
  if (!current) return res.status(404).json({ error: 'Recipe not found' });
  const min = data.thicknessMin ?? current.thicknessMin;
  const max = data.thicknessMax ?? current.thicknessMax;
  if (min > max) return res.status(400).json({ error: 'thicknessMin cannot be above thicknessMax' });
  const r = await prisma.processingRecipe.update({ where: { id: current.id }, data: { ...data, version: { increment: 1 } } });
  res.json({ data: toApi(r) });
}));

router.delete('/:id', handle('delete recipe', async (req, res) => {
  await prisma.processingRecipe.update({ where: { id: req.params.id }, data: { status: 'DEPRECATED' } });
  res.json({ data: { success: true } });
}));

router.post('/:id/activate', handle('activate recipe', async (req, res) => {
  const r = await prisma.processingRecipe.update({ where: { id: req.params.id }, data: { status: 'ACTIVE' } });
  res.json({ data: toApi(r) });
}));

export default router;
