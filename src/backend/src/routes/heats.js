import { Router } from 'express';
import prisma from '../lib/db.js';
import { readFields } from '../lib/fieldRules.js';
import { COST_VIEWERS } from '../lib/roleAccess.js';

const router = Router();

const STATUSES = ['ACTIVE', 'CONSUMED', 'ARCHIVED'];
// What a person may set on a heat. Who created it comes from the sign-in, never the request.
const FIELDS = {
  heatNumber: { type: 'string', required: true, maxLength: 60 },
  millId: { type: 'id', required: true },
  gradeId: { type: 'id', required: true },
  castDate: { type: 'date', required: true },
  meltType: { type: 'enum', values: ['BOF', 'EAF', 'AOD'] },
  castType: { type: 'enum', values: ['CONTINUOUS', 'INGOT'] },
  chemistry: { type: 'json' },
  mechanicalProps: { type: 'json' },
  totalWeightLb: { type: 'number', min: 0, max: 100000000 },
  status: { type: 'enum', values: STATUSES },
};
const partyName = { select: { id: true, code: true, name: true } };
const gradeName = { select: { id: true, code: true, name: true, family: true } };

/** Looks up the mill and grade a heat names. Returns a message when one does not exist. */
async function referenceError(data) {
  if (data.millId && !(await prisma.organization.findUnique({ where: { id: data.millId }, select: { id: true } }))) return 'That mill does not exist';
  if (data.gradeId && !(await prisma.grade.findUnique({ where: { id: data.gradeId }, select: { id: true } }))) return 'That grade does not exist';
  return null;
}

// GET /api/heats?search=&status=&gradeId=&millId=&limit=&offset=
router.get('/', async (req, res) => {
  try {
    const { gradeId, millId, status } = req.query;
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 80) : '';
    if (status && !STATUSES.includes(status)) return res.status(400).json({ error: `status must be one of ${STATUSES.join(', ')}` });
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 500);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const where = {
      ...(typeof gradeId === 'string' && gradeId && { gradeId }),
      ...(typeof millId === 'string' && millId && { millId }),
      ...(status && { status }),
      ...(search && { OR: [
        { heatNumber: { contains: search, mode: 'insensitive' } },
        { grade: { code: { contains: search, mode: 'insensitive' } } },
        { mill: { name: { contains: search, mode: 'insensitive' } } },
      ] }),
    };
    const [heats, total] = await Promise.all([
      prisma.heat.findMany({
        where, include: { grade: gradeName, mill: partyName, _count: { select: { coils: true, testResults: true } } },
        orderBy: [{ castDate: 'desc' }, { heatNumber: 'asc' }], take: limit, skip: offset,
      }),
      prisma.heat.count({ where }),
    ]);
    res.set('X-Total-Count', String(total));
    res.json(heats.map(({ _count, ...h }) => ({ ...h, unitCount: _count.coils, testCount: _count.testResults, hasMtr: Boolean(h.mtrDocumentId) })));
  } catch (error) {
    console.error('Heats: list failed:', error);
    res.status(500).json({ error: 'Failed to fetch heats' });
  }
});

// GET /api/heats/mills: the mills a heat can be recorded against.
router.get('/mills', async (_req, res) => {
  try {
    res.json(await prisma.organization.findMany({ where: { type: 'MILL' }, select: { id: true, code: true, name: true }, orderBy: { name: 'asc' }, take: 500 }));
  } catch (error) {
    console.error('Heats: mills failed:', error);
    res.status(500).json({ error: 'Failed to fetch mills' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const heat = await prisma.heat.findUnique({
      where: { id: req.params.id },
      include: {
        grade: true, mill: partyName, testResults: { orderBy: { testDate: 'desc' } },
        coils: {
          select: { id: true, coilNumber: true, form: true, status: true, qcStatus: true, netWeightLb: true, thicknessIn: true, widthIn: true, lengthIn: true, parentCoilId: true, createdAt: true, location: { select: { id: true, code: true, name: true } } },
          orderBy: { coilNumber: 'asc' },
        },
      },
    });
    if (!heat) return res.status(404).json({ error: 'Heat not found' });
    res.json(heat);
  } catch (error) {
    console.error('Heats: read failed:', error);
    res.status(500).json({ error: 'Failed to fetch heat' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { data, error } = readFields(req.body, FIELDS, { creating: true });
    if (error) return res.status(400).json({ error });
    const missing = await referenceError(data);
    if (missing) return res.status(400).json({ error: missing });
    if (await prisma.heat.findUnique({ where: { heatNumber: data.heatNumber }, select: { id: true } })) return res.status(409).json({ error: `Heat ${data.heatNumber} already exists` });
    const heat = await prisma.heat.create({ data: { ...data, createdById: req.user.id }, include: { grade: gradeName, mill: partyName } });
    res.status(201).json(heat);
  } catch (error) {
    if (error?.code === 'P2002') return res.status(409).json({ error: 'A heat with that number already exists' });
    console.error('Heats: create failed:', error);
    res.status(500).json({ error: 'Failed to create heat' });
  }
});

// The heat number is the traceability key printed on mill certificates: it is not changed once stock hangs off it.
router.put('/:id', async (req, res) => {
  try {
    const before = await prisma.heat.findUnique({ where: { id: req.params.id }, include: { _count: { select: { coils: true } } } });
    if (!before) return res.status(404).json({ error: 'Heat not found' });
    const { data, error } = readFields(req.body, FIELDS);
    if (error) return res.status(400).json({ error });
    if (!Object.keys(data).length) return res.status(400).json({ error: 'Nothing to change' });
    if (data.heatNumber && data.heatNumber !== before.heatNumber) {
      if (before._count.coils) return res.status(409).json({ error: 'This heat has stock on it, so its number cannot be changed.' });
      if (await prisma.heat.findUnique({ where: { heatNumber: data.heatNumber }, select: { id: true } })) return res.status(409).json({ error: `Heat ${data.heatNumber} already exists` });
    }
    const missing = await referenceError(data);
    if (missing) return res.status(400).json({ error: missing });
    const heat = await prisma.heat.update({ where: { id: before.id }, data, include: { grade: gradeName, mill: partyName } });
    res.json(heat);
  } catch (error) {
    if (error?.code === 'P2002') return res.status(409).json({ error: 'A heat with that number already exists' });
    console.error('Heats: update failed:', error);
    res.status(500).json({ error: 'Failed to update heat' });
  }
});

router.get('/:heatNumber/trace', async (req, res) => {
  try {
    const heat = await prisma.heat.findUnique({
      where: { heatNumber: req.params.heatNumber },
      include: {
        grade: true,
        mill: partyName,
        coils: {
          include: {
            childCoils: { select: { id: true, coilNumber: true, status: true, form: true, netWeightLb: true } },
            location: { select: { id: true, code: true, name: true } },
          },
        },
        testResults: true,
      },
    });
    if (!heat) return res.status(404).json({ error: 'Heat not found' });
    // What stock cost us goes only to the roles that buy or manage money.
    if (!COST_VIEWERS.has(req.user?.role)) heat.coils = heat.coils.map(({ unitCost, landedCost, ...coil }) => coil);
    res.json(heat);
  } catch (error) {
    console.error('Heats: trace failed:', error);
    res.status(500).json({ error: 'Failed to trace heat' });
  }
});

export default router;
