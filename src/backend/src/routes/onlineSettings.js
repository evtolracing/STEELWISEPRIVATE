/**
 * Online store settings: checkout rules, order cutoff times per branch, and
 * the processes customers may pick per division.
 *
 *   GET/PUT /api/admin/online-settings/rules
 *   GET/PUT /api/admin/online-settings/cutoffs
 *   GET     /api/admin/online-settings/processes?division=METALS   (no division: all)
 *   PUT     /api/admin/online-settings/processes?division=METALS   body: ["SAW-CUT", ...]
 */
import { Router } from 'express';
import { getSetting, putSetting } from '../lib/settings.js';

const router = Router();

const RULE_FIELDS = {
  autoApproveThreshold: 'number',
  requireQuoteAbove: 'number',
  maxLinesPerOrder: 'number',
  allowGuestCheckout: 'boolean',
  defaultPriority: 'string',
  defaultOwnership: 'string',
  enableBackorder: 'boolean',
};
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

router.get('/rules', async (req, res, next) => {
  try { res.json({ data: await getSetting('online.checkoutRules') }); } catch (e) { next(e); }
});

router.put('/rules', async (req, res, next) => {
  try {
    const body = req.body || {};
    const current = await getSetting('online.checkoutRules');
    const next_ = { ...current };
    for (const [k, type] of Object.entries(RULE_FIELDS)) {
      if (body[k] === undefined) continue;
      const v = type === 'number' ? Number(body[k]) : body[k];
      if (type === 'number' && (!Number.isFinite(v) || v < 0)) return res.status(400).json({ error: `${k} must be a number ≥ 0` });
      if (type === 'boolean' && typeof v !== 'boolean') return res.status(400).json({ error: `${k} must be true or false` });
      if (type === 'string' && (typeof v !== 'string' || !v.trim())) return res.status(400).json({ error: `${k} is required` });
      next_[k] = v;
    }
    if (next_.requireQuoteAbove < next_.autoApproveThreshold) {
      return res.status(400).json({ error: 'The quote threshold must be at least the auto-approve threshold' });
    }
    res.json({ data: await putSetting('online.checkoutRules', next_), success: true });
  } catch (e) { next(e); }
});

router.get('/cutoffs', async (req, res, next) => {
  try { res.json({ data: await getSetting('online.cutoffs') }); } catch (e) { next(e); }
});

router.put('/cutoffs', async (req, res, next) => {
  try {
    const list = Array.isArray(req.body) ? req.body : req.body?.cutoffs;
    if (!Array.isArray(list)) return res.status(400).json({ error: 'Send a list of cutoffs' });
    for (const c of list) {
      if (!c?.locationId) return res.status(400).json({ error: 'Each cutoff needs a locationId' });
      if (!TIME.test(String(c.cutoffTime || ''))) return res.status(400).json({ error: `Cutoff time for ${c.locationName || c.locationId} must be HH:MM` });
    }
    res.json({ data: await putSetting('online.cutoffs', list), success: true });
  } catch (e) { next(e); }
});

router.get('/processes', async (req, res, next) => {
  try {
    const all = await getSetting('online.allowedProcesses');
    const division = req.query.division;
    res.json({ data: division ? all[division] || [] : all });
  } catch (e) { next(e); }
});

router.put('/processes', async (req, res, next) => {
  try {
    const division = req.query.division || req.body?.division;
    const codes = Array.isArray(req.body) ? req.body : req.body?.codes;
    if (!division) return res.status(400).json({ error: 'division is required' });
    if (!Array.isArray(codes) || codes.some((c) => typeof c !== 'string')) return res.status(400).json({ error: 'Send a list of process codes' });
    const all = { ...(await getSetting('online.allowedProcesses')), [division]: codes };
    await putSetting('online.allowedProcesses', all);
    res.json({ data: codes, success: true });
  } catch (e) { next(e); }
});

export default router;
