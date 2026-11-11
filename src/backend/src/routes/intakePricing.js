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

const router = Router();
const money = (n) => Math.round(n * 100) / 100;

async function priceLevels() {
  const rows = await prisma.priceLevel.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } });
  return Object.fromEntries(rows.map((r) => [r.code, { multiplier: Number(r.multiplier), label: r.label }]));
}

router.post('/calculate', async (req, res) => {
  try {
    const { productId, priceLevel = 'RETAIL', weight = 0, qty = 0, isRemnant, remnantDiscount, processes = [] } = req.body || {};
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

router.post('/tax-estimate', async (req, res) => {
  try {
    const { subtotal = 0, customerId, shipToState } = req.body || {};
    const amount = Number(subtotal) || 0;
    if (customerId) {
      const customer = await prisma.organization.findUnique({ where: { id: customerId }, select: { taxExempt: true } });
      if (customer?.taxExempt) return res.json({ taxRate: 0, taxAmount: 0, exempt: true });
    }
    const state = String(shipToState || '').trim().toUpperCase();
    const row = state ? await prisma.salesTaxRate.findUnique({ where: { state } }) : null;
    const rate = row ? Number(row.rate) : 0;
    res.json({ taxRate: rate, taxAmount: money(amount * rate), exempt: false, ...(row ? {} : { rateFound: false }) });
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
      const tier = await prisma.customerPricingTier.findUnique({ where: { customerId: String(customerId) } });
      if (tier?.isActive && contracts[tier.tierCode]) priceLevel = tier.tierCode;
    }
    const active = priceLevel !== 'RETAIL' && contracts[priceLevel]
      ? [{ code: priceLevel, name: contracts[priceLevel].label, multiplier: contracts[priceLevel].multiplier }]
      : [];
    res.json({ priceLevel, contracts, data: { contracts: active } });
  } catch (error) {
    console.error('Contract pricing failed:', error);
    res.status(500).json({ error: 'Failed to fetch contract pricing' });
  }
});

export default router;
