import { Router } from 'express';
import prisma from '../lib/db.js';
import { readFields, rangeError } from '../lib/fieldRules.js';
import { COST_VIEWERS } from '../lib/roleAccess.js';

const router = Router();

// A grade is the specification stock is certified against. Managers, the inventory manager,
// buyers and the quality manager keep the list.
const EDITORS = new Set([...COST_VIEWERS, 'QC_MANAGER']);
const strength = { type: 'number', min: 0, max: 1000000 };
const FIELDS = {
  code: { type: 'string', required: true, maxLength: 40 },
  name: { type: 'string', required: true, maxLength: 200 },
  family: { type: 'enum', required: true, values: ['CARBON', 'ALLOY', 'STAINLESS', 'TOOL', 'HSLA', 'ALUMINUM', 'NONFERROUS', 'PLASTIC', 'OTHER'] },
  specStandard: { type: 'string', maxLength: 80 },
  chemistryMin: { type: 'json' },
  chemistryMax: { type: 'json' },
  tensileMin: strength, tensileMax: strength, yieldMin: strength, yieldMax: strength,
  elongationMin: { type: 'number', min: 0, max: 100 },
  hardnessMin: strength, hardnessMax: strength,
  isActive: { type: 'boolean' },
};
const RANGES = [['tensileMin', 'tensileMax'], ['yieldMin', 'yieldMax'], ['hardnessMin', 'hardnessMax']];

// Get all grades
router.get('/', async (req, res) => {
  try {
    const { family, isActive } = req.query;
    const grades = await prisma.grade.findMany({
      where: {
        ...(family && { family }),
        ...(isActive !== undefined && { isActive: isActive === 'true' })
      },
      orderBy: { code: 'asc' }
    });
    res.json(grades);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch grades' });
  }
});

// Get grade by ID
router.get('/:id', async (req, res) => {
  try {
    const grade = await prisma.grade.findUnique({
      where: { id: req.params.id }
    });
    if (!grade) return res.status(404).json({ error: 'Grade not found' });
    res.json(grade);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch grade' });
  }
});

// Create grade
router.post('/', async (req, res) => {
  try {
    if (!EDITORS.has(req.user?.role)) return res.status(403).json({ error: 'Adding a grade needs a manager, the inventory manager, a buyer or the quality manager.' });
    const { data, error } = readFields(req.body, FIELDS, { creating: true });
    if (error) return res.status(400).json({ error });
    const range = rangeError(data, RANGES);
    if (range) return res.status(400).json({ error: range });
    if (await prisma.grade.findUnique({ where: { code: data.code }, select: { id: true } })) return res.status(409).json({ error: `Grade ${data.code} already exists` });
    res.status(201).json(await prisma.grade.create({ data }));
  } catch (error) {
    if (error?.code === 'P2002') return res.status(409).json({ error: 'A grade with that code already exists' });
    console.error('Grades: create failed:', error);
    res.status(500).json({ error: 'Failed to create grade' });
  }
});

// Update grade
router.put('/:id', async (req, res) => {
  try {
    if (!EDITORS.has(req.user?.role)) return res.status(403).json({ error: 'Changing a grade needs a manager, the inventory manager, a buyer or the quality manager.' });
    const before = await prisma.grade.findUnique({ where: { id: req.params.id } });
    if (!before) return res.status(404).json({ error: 'Grade not found' });
    const { data, error } = readFields(req.body, FIELDS);
    if (error) return res.status(400).json({ error });
    if (!Object.keys(data).length) return res.status(400).json({ error: 'Nothing to change' });
    const range = rangeError({ ...before, ...data }, RANGES);
    if (range) return res.status(400).json({ error: range });
    if (data.code && data.code !== before.code && (await prisma.grade.findUnique({ where: { code: data.code }, select: { id: true } }))) return res.status(409).json({ error: `Grade ${data.code} already exists` });
    res.json(await prisma.grade.update({ where: { id: before.id }, data }));
  } catch (error) {
    if (error?.code === 'P2002') return res.status(409).json({ error: 'A grade with that code already exists' });
    console.error('Grades: update failed:', error);
    res.status(500).json({ error: 'Failed to update grade' });
  }
});

export default router;
