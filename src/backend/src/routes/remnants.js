/**
 * Remnant inventory and pricing.
 *
 *   GET  /api/remnants                 search (filters, sort, paging, facets)
 *   GET  /api/remnants/stats           dashboard totals
 *   GET  /api/remnants/suggestions     "use a remnant first" matches for a cut
 *   POST /api/remnants/pricing         aging + condition price for one piece
 *   POST /api/remnants/pricing/batch   { items: [...] }
 *   GET  /api/remnants/pricing/floor?grade=&family=
 *   GET  /api/remnants/:id
 *   POST /api/remnants/:id/reserve     { orderId }
 *   POST /api/remnants/:id/release
 */
import { Router } from 'express';
import {
  searchRemnants, remnantStats, suggestRemnants, getRemnant, reserveRemnant, releaseRemnant,
  priceRemnant, batchPrice, csrPriceFloor,
} from '../services/remnantService.js';

const router = Router();

const wrap = (label, fn) => async (req, res) => {
  try {
    const out = await fn(req, res);
    if (out === undefined) return;
    if (out?.status) return res.status(out.status).json({ error: out.error });
    res.json(out);
  } catch (error) {
    console.error(`Remnants: ${label} failed:`, error);
    res.status(500).json({ error: `Failed to ${label}` });
  }
};

router.get('/', wrap('search remnants', (req) => searchRemnants(req.query)));
router.get('/stats', wrap('load remnant stats', async () => ({ data: await remnantStats() })));
router.get('/suggestions', wrap('suggest remnants', (req) => suggestRemnants(req.query)));
router.post('/pricing', wrap('price remnant', (req) => priceRemnant(req.body || {})));
router.post('/pricing/batch', wrap('price remnants', (req) => batchPrice(Array.isArray(req.body?.items) ? req.body.items : [])));
router.get('/pricing/floor', wrap('load price floor', (req) => csrPriceFloor(req.query.grade, req.query.family)));
router.get('/:id', wrap('load remnant', async (req) => {
  const r = await getRemnant(req.params.id);
  return r ? { data: r } : { status: 404, error: 'Remnant not found' };
}));
router.post('/:id/reserve', wrap('reserve remnant', (req) => reserveRemnant(req.params.id, req.body?.orderId)));
router.post('/:id/release', wrap('release remnant', (req) => releaseRemnant(req.params.id)));

export default router;
