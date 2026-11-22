/**
 * Online store API.
 *
 *   GET  /api/ecom/catalog                  search (query, division, family, form, grade, inStockOnly, locationId)
 *   GET  /api/ecom/catalog/divisions
 *   GET  /api/ecom/catalog/families?division=
 *   GET  /api/ecom/catalog/availability?productId=&locationId=
 *   GET  /api/ecom/catalog/:id
 *   POST /api/ecom/pricing/config           price one configured line
 *   POST /api/ecom/pricing/tax
 *   POST /api/ecom/cart/validate
 *   POST /api/ecom/checkout/submit          → online order inbox
 *   POST /api/ecom/checkout/quote           → online order inbox, flagged as a quote request
 *
 * Store catalog admin (visibility and listing details), mounted at /api/admin/catalog:
 *   GET   /                                  ?division=&visibleOnly=
 *   PATCH /:productId/visibility             { visible }
 *   PATCH /:productId/metadata               { featured, sortOrder, tags, leadTimeDays, minOrderQty, ... }
 */
import { Router } from 'express';
import * as store from '../services/ecomService.js';
import prisma from '../lib/db.js';
import { acrossBranches } from '../lib/branchScope.js';
import { compareBranches } from '../lib/branchComparison.js';
import { branchCutoffRules } from './onlineSettings.js';
import { isCustomerLogin, requireLinkedCustomer } from '../lib/customerScope.js';
import { customerPriceLevel } from '../lib/customerPricing.js';

// A customer login always orders for its own account, under its own name.
const checkoutPayload = (req) => {
  const body = req.body || {};
  if (!isCustomerLogin(req.user)) return body;
  const name = [req.user.firstName, req.user.lastName].filter(Boolean).join(' ');
  return {
    ...body,
    customerId: req.user.customerId,
    customerName: req.user.customer?.name || name || body.customerName,
    customerEmail: req.user.email,
  };
};

const wrap = (label, fn) => async (req, res) => {
  try {
    const out = await fn(req);
    if (out?.status) return res.status(out.status).json({ error: out.error, ...(out.errors ? { errors: out.errors } : {}) });
    res.json(out);
  } catch (error) {
    console.error(`Store: ${label} failed:`, error);
    res.status(500).json({ error: `Failed to ${label}` });
  }
};

const router = Router();
// The branches the store sells from, and each one's cut-off rule: read by the store, the promise check and the
// cut-off clock. Location is not a branch-owned record, so every signed-in person gets the same list.
router.get('/branches', wrap('load branches', async () => ({
  data: await prisma.location.findMany({
    where: { isActive: true, isBranch: true, sellsFrom: true },
    select: { id: true, code: true, name: true, city: true, state: true, timezone: true },
    orderBy: { name: 'asc' },
  }),
})));
// Which branch suits an order best. Stock is counted at every branch, also for a person held to their own:
// the answer is a count per branch, never a stock record, and choosing where to fill an order needs all of them.
router.post('/branch-comparison', wrap('compare branches', async (req) => {
  const { division = 'METALS', requiredProcessing, shipTo, excludeLocationId } = req.body || {};
  const [branches, rules] = await Promise.all([
    prisma.location.findMany({
      where: { isActive: true, isBranch: true, sellsFrom: true },
      select: { id: true, code: true, name: true, lat: true, lng: true, processes: true, workCenters: { where: { isActive: true }, select: { type: true } } },
    }),
    branchCutoffRules(),
  ]);
  const stock = await acrossBranches(() => prisma.inventory.groupBy({
    by: ['locationId', 'unit'],
    where: { status: 'ACTIVE', qtyAvailable: { gt: 0 }, locationId: { in: branches.map((b) => b.id) }, coil: { status: 'AVAILABLE', product: { division: String(division) } } },
    _count: { _all: true }, _sum: { qtyAvailable: true },
  }));
  const stockAt = (id) => stock.filter((r) => r.locationId === id).reduce((t, r) => ({
    items: t.items + r._count._all,
    weightLb: t.weightLb + (r.unit === 'LB' ? Number(r._sum.qtyAvailable || 0) : 0),
  }), { items: 0, weightLb: 0 });
  return compareBranches({
    branches: branches.map((b) => ({
      id: b.id, code: b.code, name: b.name, lat: b.lat, lng: b.lng,
      capabilities: [...b.processes, ...b.workCenters.map((w) => w.type).filter(Boolean)],
      stock: stockAt(b.id), rule: rules.find((r) => r.locationId === b.id),
    })),
    division: String(division),
    requiredProcessing: Array.isArray(requiredProcessing) ? requiredProcessing.map(String) : [],
    shipTo: shipTo && typeof shipTo === 'object' ? shipTo : null,
    excludeLocationId: excludeLocationId ? String(excludeLocationId) : null,
  });
}));
router.get('/cutoff-rules', wrap('load cut-off rules', async () => ({ data: await branchCutoffRules() })));
router.get('/cutoff-rules/:locationId', wrap('load cut-off rules', async (req) => ({ data: (await branchCutoffRules(req.params.locationId))[0] || null })));
router.get('/catalog', wrap('search catalog', (req) => store.searchCatalog(req.query)));
router.get('/catalog/divisions', wrap('load divisions', async () => {
  const { facets } = await store.searchCatalog({ limit: 1 });
  return { data: facets.divisions };
}));
router.get('/catalog/families', wrap('load families', async (req) => ({ data: await store.familiesFor(req.query.division) })));
router.get('/catalog/availability', wrap('check availability', (req) => {
  if (!req.query.productId) return { status: 400, error: 'productId is required' };
  return store.availability(String(req.query.productId), req.query.locationId);
}));
router.get('/catalog/:id', wrap('load product', async (req) => {
  const p = await store.getStoreProduct(req.params.id);
  return p ? { ...p, data: p } : { status: 404, error: 'Product not found' };
}));
// A customer login is priced at its own account's level, whatever level the
// browser sends. Staff may price for a customer by sending customerId.
router.post('/pricing/config', wrap('price item', async (req) => {
  const body = req.body || {};
  const customerId = isCustomerLogin(req.user) ? req.user.customerId : body.customerId;
  if (!isCustomerLogin(req.user) && !customerId) return store.priceConfig(body);
  return store.priceConfig({ ...body, priceLevel: await customerPriceLevel(customerId) });
}));
router.post('/pricing/tax', wrap('estimate tax', (req) => store.taxEstimate(req.body || {})));
router.post('/cart/validate', wrap('validate cart', (req) => store.validateCart(req.body || {})));
router.post('/checkout/submit', requireLinkedCustomer, wrap('submit order', (req) => store.checkout(checkoutPayload(req))));
router.post('/checkout/quote', requireLinkedCustomer, wrap('request quote', (req) => store.checkout(checkoutPayload(req), { quote: true })));

export const adminCatalogRouter = Router();
adminCatalogRouter.get('/', wrap('list catalog', (req) => store.listCatalogItems(req.query)));
adminCatalogRouter.patch('/:productId/visibility', wrap('update visibility', (req) => store.updateListing(req.params.productId, { visible: req.body?.visible })));
adminCatalogRouter.patch('/:productId/metadata', wrap('update listing', (req) => store.updateListing(req.params.productId, req.body || {})));

export default router;
