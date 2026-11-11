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
router.post('/pricing/config', wrap('price item', (req) => store.priceConfig(req.body || {})));
router.post('/pricing/tax', wrap('estimate tax', (req) => store.taxEstimate(req.body || {})));
router.post('/cart/validate', wrap('validate cart', (req) => store.validateCart(req.body || {})));
router.post('/checkout/submit', wrap('submit order', (req) => store.checkout(req.body || {})));
router.post('/checkout/quote', wrap('request quote', (req) => store.checkout(req.body || {}, { quote: true })));

export const adminCatalogRouter = Router();
adminCatalogRouter.get('/', wrap('list catalog', (req) => store.listCatalogItems(req.query)));
adminCatalogRouter.patch('/:productId/visibility', wrap('update visibility', (req) => store.updateListing(req.params.productId, { visible: req.body?.visible })));
adminCatalogRouter.patch('/:productId/metadata', wrap('update listing', (req) => store.updateListing(req.params.productId, req.body || {})));

export default router;
