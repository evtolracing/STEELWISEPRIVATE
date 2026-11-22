/**
 * Online store settings: checkout rules, order cutoff times per branch, and
 * the processes customers may pick per division.
 *
 *   GET/PUT /api/admin/online-settings/rules
 *   GET     /api/admin/online-settings/cutoff-rules                one rule per branch the store sells from
 *   PUT     /api/admin/online-settings/cutoff-rules/:locationId
 *   GET     /api/admin/online-settings/processes?division=METALS   (no division: all)
 *   PUT     /api/admin/online-settings/processes?division=METALS   body: ["SAW-CUT", ...]
 */
import { Router } from 'express';
import prisma from '../lib/db.js';
import { getSetting, putSetting } from '../lib/settings.js';
import { CUTOFF_SETTING, cutoffRuleInput, ruleFor } from '../lib/cutoffRules.js';

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

// The branches the store sells from, each with its cut-off rule (blank and marked isSet: false until saved).
export async function branchCutoffRules(onlyId) {
  const [branches, saved] = await Promise.all([
    prisma.location.findMany({
      where: { isActive: true, isBranch: true, sellsFrom: true, ...(onlyId ? { id: String(onlyId) } : {}) },
      select: { id: true, code: true, name: true, timezone: true },
      orderBy: { name: 'asc' },
    }),
    getSetting(CUTOFF_SETTING),
  ]);
  return branches.map((b) => ruleFor(b, saved?.[b.id]));
}

router.get('/cutoff-rules', async (req, res, next) => {
  try { res.json({ data: await branchCutoffRules() }); } catch (e) { next(e); }
});

router.put('/cutoff-rules/:locationId', async (req, res, next) => {
  try {
    const [current] = await branchCutoffRules(req.params.locationId);
    if (!current) return res.status(404).json({ error: 'That branch is not on file, or the store does not sell from it' });
    const checked = cutoffRuleInput(req.body || {});
    if (checked.error) return res.status(400).json({ error: checked.error });
    const saved = { ...((await getSetting(CUTOFF_SETTING)) || {}), [current.locationId]: checked.data };
    await prisma.$transaction(async (tx) => {
      await tx.appSetting.upsert({ where: { key: CUTOFF_SETTING }, update: { value: saved }, create: { key: CUTOFF_SETTING, value: saved } });
      await tx.auditLog.create({ data: {
        tenantId: req.user.organizationId, category: 'DATA', eventType: 'UPDATE', userId: req.user.id,
        resourceType: 'Location', resourceId: current.locationId, action: 'cutoffRules.update', details: checked.data,
      } });
    });
    res.json({ data: (await branchCutoffRules(current.locationId))[0], success: true });
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
