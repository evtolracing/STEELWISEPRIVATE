import { Router } from 'express';
import prisma from '../lib/db.js';

const router = Router();

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
    const grade = await prisma.grade.create({ data: req.body });
    res.status(201).json(grade);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create grade' });
  }
});

// Update grade
router.put('/:id', async (req, res) => {
  try {
    const grade = await prisma.grade.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(grade);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update grade' });
  }
});

export default router;
