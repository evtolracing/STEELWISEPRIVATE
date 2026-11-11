/**
 * Processing operations and routing templates for order intake.
 *
 *   GET /api/processing/operations?division=&type=
 *   GET /api/processing/operations/:id
 *   GET /api/processing/templates?division=
 */
import { Router } from 'express';
import prisma from '../lib/db.js';

const router = Router();

const toOp = (r) => ({
  id: r.id,
  code: r.code,
  name: r.name,
  division: r.division,
  type: r.type,
  estimatedMinutes: r.estimatedMinutes,
  pricePerOp: Number(r.pricePerOp),
  priceUnit: r.priceUnit,
  machines: Array.isArray(r.machines) ? r.machines : [],
  params: Array.isArray(r.params) ? r.params : [],
});

router.get('/operations', async (req, res) => {
  try {
    const { division, type } = req.query;
    const rows = await prisma.processingOperation.findMany({
      where: { isActive: true, ...(division ? { division } : {}), ...(type ? { type } : {}) },
      orderBy: [{ division: 'asc' }, { name: 'asc' }],
    });
    res.json({ data: rows.map(toOp) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list processes' });
  }
});

router.get('/operations/:id', async (req, res) => {
  try {
    const row = await prisma.processingOperation.findUnique({ where: { id: req.params.id } });
    if (!row) return res.status(404).json({ error: 'Process not found' });
    res.json(toOp(row));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch process' });
  }
});

router.get('/templates', async (req, res) => {
  try {
    const { division } = req.query;
    const [templates, ops] = await Promise.all([
      prisma.processingTemplate.findMany({ where: { isActive: true, ...(division ? { division } : {}) }, orderBy: { name: 'asc' } }),
      prisma.processingOperation.findMany({ where: { isActive: true } }),
    ]);
    const byId = new Map(ops.map((o) => [o.id, toOp(o)]));
    res.json({
      data: templates.map((t) => ({
        id: t.id,
        name: t.name,
        division: t.division,
        steps: (Array.isArray(t.steps) ? t.steps : [])
          .slice()
          .sort((a, b) => (a.seq || 0) - (b.seq || 0))
          .map((s) => ({ ...s, process: byId.get(s.processId) || null })),
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list templates' });
  }
});

export default router;
