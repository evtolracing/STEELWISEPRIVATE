import { Router } from 'express';
import prisma from '../lib/db.js';
import { searchProducts, productCategories } from '../services/intakeCatalogService.js';
import { readFields, rangeError } from '../lib/fieldRules.js';
import { MONEY_MANAGERS, COST_VIEWERS } from '../lib/roleAccess.js';

const router = Router();

// What a person may set on a product. Managers, the inventory manager and buyers keep the catalog;
// the list price is a manager's decision (rule 30) and every change to it is recorded.
const FIELDS = {
  sku: { type: 'string', required: true, maxLength: 60 },
  name: { type: 'string', required: true, maxLength: 200 },
  description: { type: 'string', maxLength: 2000 },
  category: { type: 'string', maxLength: 80 },
  productType: { type: 'enum', required: true, values: ['FLAT', 'LONG', 'TUBE', 'STRUCTURAL', 'OTHER'] },
  form: { type: 'enum', required: true, values: ['COIL', 'SHEET', 'PLATE', 'BAR', 'TUBE', 'BEAM', 'REBAR', 'WIRE', 'ROD', 'SUPPLY'] },
  gradeId: { type: 'id' },
  specStandard: { type: 'string', maxLength: 80 },
  thicknessMin: { type: 'number', min: 0, max: 1000 },
  thicknessMax: { type: 'number', min: 0, max: 1000 },
  widthMin: { type: 'number', min: 0, max: 10000 },
  widthMax: { type: 'number', min: 0, max: 10000 },
  basePriceCwt: { type: 'number', min: 0.0001, max: 1000000 },
  priceUnit: { type: 'enum', required: true, values: ['CWT', 'LB', 'TON', 'EACH', 'LF'] },
  division: { type: 'enum', required: true, values: ['METALS', 'PLASTICS', 'SUPPLIES', 'OUTLET'] },
  isRemnant: { type: 'boolean' },
  isActive: { type: 'boolean' },
};
const CREATE_FIELDS = { ...FIELDS, priceUnit: { ...FIELDS.priceUnit, required: false }, division: { ...FIELDS.division, required: false } };
const RANGES = [['thicknessMin', 'thicknessMax'], ['widthMin', 'widthMax']];
const amount = (v) => (v === null || v === undefined ? null : Number(v));
const priceAudit = (tx, user, product, from, fromUnit) => tx.auditLog.create({
  data: {
    category: 'FINANCIAL', eventType: 'LIST_PRICE_CHANGED', severity: 'WARNING', action: 'UPDATE', userId: user.id,
    resourceType: 'Product', resourceId: product.id,
    details: { sku: product.sku, product: product.name, priceUnit: product.priceUnit, fromUnit, from, to: amount(product.basePriceCwt), by: user.email, via: 'product record' },
  },
});

router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { grade: true },
      orderBy: { sku: 'asc' }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/search?search=&division=&category=&limit=
// Order-intake shape: { data: [...], meta: { total } }
router.get('/search', async (req, res) => {
  try {
    const { search, division, category, limit } = req.query;
    res.json(await searchProducts({ search, division, category, limit }));
  } catch (error) {
    console.error('Product search failed:', error);
    res.status(500).json({ error: 'Product search failed' });
  }
});

// GET /api/products/categories?division=
router.get('/categories', async (req, res) => {
  try {
    res.json(await productCategories(req.query.division));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { grade: true }
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.post('/', async (req, res) => {
  try {
    if (!COST_VIEWERS.has(req.user?.role)) return res.status(403).json({ error: 'Adding a product needs a manager, the inventory manager or a buyer.' });
    const { data, error } = readFields(req.body, CREATE_FIELDS, { creating: true });
    if (error) return res.status(400).json({ error });
    const range = rangeError(data, RANGES);
    if (range) return res.status(400).json({ error: range });
    if (data.basePriceCwt != null && !MONEY_MANAGERS.has(req.user.role)) return res.status(403).json({ error: 'Setting a list price needs a manager. Add the product without a price and ask a manager to price it.' });
    if (data.gradeId && !(await prisma.grade.findUnique({ where: { id: data.gradeId }, select: { id: true } }))) return res.status(400).json({ error: 'That grade does not exist' });
    if (await prisma.product.findUnique({ where: { sku: data.sku }, select: { id: true } })) return res.status(409).json({ error: `Product ${data.sku} already exists` });
    const product = await prisma.$transaction(async (tx) => {
      const made = await tx.product.create({ data });
      if (made.basePriceCwt != null) await priceAudit(tx, req.user, made, null, null);
      return made;
    });
    res.status(201).json(product);
  } catch (error) {
    if (error?.code === 'P2002') return res.status(409).json({ error: 'A product with that SKU already exists' });
    console.error('Products: create failed:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    if (!COST_VIEWERS.has(req.user?.role)) return res.status(403).json({ error: 'Changing a product needs a manager, the inventory manager or a buyer.' });
    const before = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!before) return res.status(404).json({ error: 'Product not found' });
    const { data, error } = readFields(req.body, FIELDS);
    if (error) return res.status(400).json({ error });
    if (!Object.keys(data).length) return res.status(400).json({ error: 'Nothing to change' });
    const range = rangeError({ ...before, ...data }, RANGES);
    if (range) return res.status(400).json({ error: range });
    const priceChanged = ('basePriceCwt' in data && amount(data.basePriceCwt) !== amount(before.basePriceCwt)) || ('priceUnit' in data && data.priceUnit !== before.priceUnit);
    if (priceChanged && !MONEY_MANAGERS.has(req.user.role)) return res.status(403).json({ error: 'Changing a list price needs a manager.' });
    if (data.gradeId && !(await prisma.grade.findUnique({ where: { id: data.gradeId }, select: { id: true } }))) return res.status(400).json({ error: 'That grade does not exist' });
    if (data.sku && data.sku !== before.sku && (await prisma.product.findUnique({ where: { sku: data.sku }, select: { id: true } }))) return res.status(409).json({ error: `Product ${data.sku} already exists` });
    const product = await prisma.$transaction(async (tx) => {
      const saved = await tx.product.update({ where: { id: before.id }, data });
      if (priceChanged) await priceAudit(tx, req.user, saved, amount(before.basePriceCwt), before.priceUnit);
      return saved;
    });
    res.json(product);
  } catch (error) {
    if (error?.code === 'P2002') return res.status(409).json({ error: 'A product with that SKU already exists' });
    console.error('Products: update failed:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

export default router;
