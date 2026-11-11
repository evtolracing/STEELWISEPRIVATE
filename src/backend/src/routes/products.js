import { Router } from 'express';
import prisma from '../lib/db.js';
import { searchProducts, productCategories } from '../services/intakeCatalogService.js';

const router = Router();

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
    const product = await prisma.product.create({ data: req.body });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

export default router;
