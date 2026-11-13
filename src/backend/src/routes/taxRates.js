/**
 * Sales tax rate per state. Quick sale, web checkout and counter pricing
 * all read this table; a state with no row is charged no tax.
 *
 *   GET    /api/tax-rates           every rate, plus the branch states that have none
 *   PUT    /api/tax-rates/:state    set a state's rate (percent, 0 to 20). Managers only.
 *   DELETE /api/tax-rates/:state    remove a state's rate. Managers only.
 */
import { Router } from 'express';
import prisma from '../lib/db.js';

const router = Router();
const stateOf = (value) => { const s = String(value || '').trim().toUpperCase(); return /^[A-Z]{2}$/.test(s) ? s : null; };

router.get('/', async (req, res) => {
  try {
    const [rates, branches] = await Promise.all([
      prisma.salesTaxRate.findMany({ orderBy: { state: 'asc' } }),
      prisma.location.findMany({ where: { state: { not: null } }, select: { state: true } }),
    ]);
    const have = new Set(rates.map((r) => r.state));
    const branchStates = [...new Set(branches.map((b) => String(b.state).trim().toUpperCase()).filter((s) => /^[A-Z]{2}$/.test(s)))].sort();
    res.json({
      data: rates.map((r) => ({ state: r.state, percent: Math.round(Number(r.rate) * 1e6) / 1e4, updatedAt: r.updatedAt })),
      branchStatesWithoutRate: branchStates.filter((s) => !have.has(s)),
    });
  } catch (error) {
    console.error('Tax rates: list failed:', error);
    res.status(500).json({ error: 'Failed to fetch tax rates' });
  }
});

router.put('/:state', async (req, res) => {
  try {
    const state = stateOf(req.params.state);
    if (!state) return res.status(400).json({ error: 'State must be a two-letter code, for example OH' });
    const percent = Number(req.body?.percent);
    if (req.body?.percent === '' || req.body?.percent == null || !Number.isFinite(percent) || percent < 0 || percent > 20) {
      return res.status(400).json({ error: 'Rate must be a percent between 0 and 20, for example 5.75' });
    }
    const rate = Math.round(percent * 1e4) / 1e6;
    const saved = await prisma.salesTaxRate.upsert({ where: { state }, create: { state, rate }, update: { rate } });
    res.json({ state: saved.state, percent: Math.round(Number(saved.rate) * 1e6) / 1e4, updatedAt: saved.updatedAt });
  } catch (error) {
    console.error('Tax rates: save failed:', error);
    res.status(500).json({ error: 'Failed to save the tax rate' });
  }
});

router.delete('/:state', async (req, res) => {
  try {
    const state = stateOf(req.params.state);
    if (!state) return res.status(400).json({ error: 'State must be a two-letter code, for example OH' });
    const gone = await prisma.salesTaxRate.deleteMany({ where: { state } });
    if (!gone.count) return res.status(404).json({ error: 'No rate is set for that state' });
    res.json({ message: `Removed the rate for ${state}. Sales there are now charged no tax.` });
  } catch (error) {
    console.error('Tax rates: delete failed:', error);
    res.status(500).json({ error: 'Failed to remove the tax rate' });
  }
});

export default router;
