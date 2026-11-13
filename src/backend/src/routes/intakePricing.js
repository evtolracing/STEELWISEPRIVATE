/**
 * Order-intake pricing: line price calculation, tax estimate, customer price
 * level. Reads Product, PriceLevel, SalesTaxRate, Organization and
 * CustomerPricingTier.
 *
 *   POST /api/pricing/calculate
 *   POST /api/pricing/tax-estimate
 *   GET  /api/pricing/contracts?customerId=
 */
import { Router } from 'express';
import prisma from '../lib/db.js';
import { unitPrice } from '../services/intakeCatalogService.js';
import { customerPriceLevel } from '../lib/customerPricing.js';
import { TIER_TO_LEVEL, levelForTier, levelPrice } from '../lib/priceRules.js';
import { ci } from '../lib/dbText.js';
import { MONEY_MANAGERS } from '../lib/roleAccess.js';
import { orderTax, branchStateFor } from '../lib/orderTax.js';

const router = Router();
const money = (n) => Math.round(n * 100) / 100;

async function priceLevels() {
  const rows = await prisma.priceLevel.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } });
  return Object.fromEntries(rows.map((r) => [r.code, { multiplier: Number(r.multiplier), label: r.label }]));
}

router.post('/calculate', async (req, res) => {
  try {
    const { productId, customerId, weight = 0, qty = 0, isRemnant, remnantDiscount, processes = [] } = req.body || {};
    // With a customer, the customer's own level is used whatever level the screen sent.
    const priceLevel = customerId ? await customerPriceLevel(customerId) : (req.body?.priceLevel || 'RETAIL');
    if (!productId) return res.status(400).json({ error: 'productId is required' });
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const { basePrice, priceUnit } = unitPrice(product);
    if (basePrice == null) return res.status(422).json({ error: 'Product has no list price' });

    const levels = await priceLevels();
    const level = levels[priceLevel] || levels.RETAIL || { multiplier: 1, label: 'Retail / List Price' };
    const remnant = Boolean(isRemnant ?? product.isRemnant);
    const discount = Number(remnantDiscount) || 0;
    const price = remnant && discount > 0 ? basePrice * (1 - discount) : basePrice * level.multiplier;

    // Priced per pound: weight × price. Priced per each / foot: qty × price.
    const quantity = priceUnit === 'LB' ? Number(weight) || 0 : Number(qty) || 0;
    const materialTotal = quantity * price;
    const processingTotal = (Array.isArray(processes) ? processes : [])
      .reduce((s, p) => s + (Number(p?.estimatedCost) || 0), 0);

    res.json({
      unitPrice: Number(price.toFixed(4)),
      priceUnit,
      priceSource: remnant && discount > 0 ? 'REMNANT' : level.label,
      materialTotal: money(materialTotal),
      processingTotal: money(processingTotal),
      lineTotal: money(materialTotal + processingTotal),
    });
  } catch (error) {
    console.error('Pricing calculation failed:', error);
    res.status(500).json({ error: 'Pricing calculation failed' });
  }
});

// The same tax rule the order is saved with (lib/orderTax.js), so the screen
// shows what the invoice will bill.
router.post('/tax-estimate', async (req, res) => {
  try {
    const { subtotal = 0, customerId, shipToState, location, source } = req.body || {};
    const tax = await orderTax({
      subtotal,
      customerId,
      shipToState,
      branchState: await branchStateFor(req.user, location),
    });
    res.json({ taxRate: tax.taxRate, taxAmount: tax.taxAmount, exempt: tax.exempt, taxState: tax.taxState, ...(tax.rateFound ? {} : { rateFound: false }) });
  } catch (error) {
    console.error('Tax estimate failed:', error);
    res.status(500).json({ error: 'Tax estimate failed' });
  }
});

router.get('/contracts', async (req, res) => {
  try {
    const { customerId } = req.query;
    const contracts = await priceLevels();
    let priceLevel = 'RETAIL';
    if (customerId) {
      const level = await customerPriceLevel(String(customerId));
      if (contracts[level]) priceLevel = level;
    }
    const active = priceLevel !== 'RETAIL' && contracts[priceLevel]
      ? [{ code: priceLevel, name: contracts[priceLevel].label, multiplier: contracts[priceLevel].multiplier }]
      : [];
    res.json({ priceLevel, multiplier: contracts[priceLevel]?.multiplier ?? 1, contracts, data: { contracts: active } });
  } catch (error) {
    console.error('Contract pricing failed:', error);
    res.status(500).json({ error: 'Failed to fetch contract pricing' });
  }
});

// GET /api/pricing/overview: the price book as it stands. Price levels, which
// tier gives which level, the accounts that have a tier, and how many products
// have a list price.
router.get('/overview', async (req, res) => {
  try {
    const [levels, tiers, priced, unpriced] = await Promise.all([
      prisma.priceLevel.findMany({ orderBy: { multiplier: 'desc' } }),
      prisma.customerPricingTier.findMany({ include: { customer: { select: { id: true, code: true, name: true, isActive: true } } }, orderBy: { tierCode: 'asc' }, take: 1000 }),
      prisma.product.count({ where: { isActive: true, basePriceCwt: { gt: 0 } } }),
      prisma.product.count({ where: { isActive: true, OR: [{ basePriceCwt: null }, { basePriceCwt: { lte: 0 } }] } }),
    ]);
    res.json({
      levels: levels.map((l) => ({ code: l.code, label: l.label, multiplier: Number(l.multiplier), isActive: l.isActive })),
      tierToLevel: TIER_TO_LEVEL,
      accounts: tiers.map((t) => ({
        customerId: t.customerId, code: t.customer?.code, name: t.customer?.name, tier: t.tierCode,
        levelInForce: levelForTier(t), inForce: levelForTier(t) === (TIER_TO_LEVEL[t.tierCode] || 'RETAIL') && t.isActive,
        effectiveFrom: t.effectiveFrom, effectiveUntil: t.effectiveUntil,
        creditLimit: t.creditLimit == null ? null : Number(t.creditLimit),
      })),
      products: { withListPrice: priced, withoutListPrice: unpriced },
    });
  } catch (error) {
    console.error('Price book overview failed:', error);
    res.status(500).json({ error: 'The price book could not be loaded' });
  }
});

// GET /api/pricing/price-list?search=&limit=&offset=: list price of each product
// and what each price level pays for it.
router.get('/price-list', async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const search = String(req.query.search || '').trim().slice(0, 80);
    const where = { isActive: true, ...(search && { OR: [{ sku: { contains: search, ...ci } }, { name: { contains: search, ...ci } }] }) };
    const [rows, total, levels] = await Promise.all([
      prisma.product.findMany({ where, orderBy: [{ sku: 'asc' }], take: limit, skip: offset, select: { id: true, sku: true, name: true, basePriceCwt: true, priceUnit: true } }),
      prisma.product.count({ where }),
      prisma.priceLevel.findMany({ where: { isActive: true }, orderBy: { multiplier: 'desc' } }),
    ]);
    res.json({
      data: rows.map((p) => ({
        id: p.id, sku: p.sku, name: p.name, priceUnit: p.priceUnit || 'CWT',
        listPrice: levelPrice(p)?.listPrice ?? null,
        prices: Object.fromEntries(levels.map((l) => [l.code, levelPrice(p, { multiplier: Number(l.multiplier) })?.unitPrice ?? null])),
      })),
      meta: { total, limit, offset },
    });
  } catch (error) {
    console.error('Price list failed:', error);
    res.status(500).json({ error: 'The price list could not be loaded' });
  }
});

// PUT /api/pricing/list-price/:productId { listPrice }: change a product's list
// price. It moves what every customer pays, so a manager makes the change and
// it is written to the audit log with the old and new price.
router.put('/list-price/:productId', async (req, res) => {
  try {
    if (!MONEY_MANAGERS.has(req.user?.role)) return res.status(403).json({ error: 'Changing a list price needs a manager.' });
    const listPrice = Number(req.body?.listPrice);
    if (!Number.isFinite(listPrice) || listPrice <= 0 || listPrice > 1000000) return res.status(400).json({ error: 'List price must be more than zero' });
    const before = await prisma.product.findUnique({ where: { id: String(req.params.productId) }, select: { id: true, sku: true, name: true, basePriceCwt: true, priceUnit: true } });
    if (!before) return res.status(404).json({ error: 'Product not found' });
    const rounded = Math.round(listPrice * 10000) / 10000;
    const saved = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({ where: { id: before.id }, data: { basePriceCwt: rounded }, select: { id: true, sku: true, name: true, basePriceCwt: true, priceUnit: true } });
      await tx.auditLog.create({
        data: {
          category: 'FINANCIAL', eventType: 'LIST_PRICE_CHANGED', severity: 'WARNING', action: 'UPDATE', userId: req.user.id,
          resourceType: 'Product', resourceId: before.id,
          details: { sku: before.sku, product: before.name, priceUnit: before.priceUnit || 'CWT', from: before.basePriceCwt == null ? null : Number(before.basePriceCwt), to: rounded, by: req.user.email },
        },
      });
      return product;
    });
    res.json({ data: { id: saved.id, sku: saved.sku, name: saved.name, priceUnit: saved.priceUnit || 'CWT', listPrice: Number(saved.basePriceCwt) } });
  } catch (error) {
    console.error('List price change failed:', error);
    res.status(500).json({ error: 'The list price could not be saved' });
  }
});

export default router;
