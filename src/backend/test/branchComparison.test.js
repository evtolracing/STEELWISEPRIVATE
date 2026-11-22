import test from 'node:test';
import assert from 'node:assert/strict';
import { compareBranches, canDo, milesBetween, localClock } from '../src/lib/branchComparison.js';

const rule = (extra = {}) => ({ isSet: true, timezone: 'America/Detroit', blackoutWindows: [],
  divisionRules: { METALS: { cutoffLocal: '15:00', nextDayEnabled: true, shipDays: [1, 2, 3, 4, 5], pickupSameDayEnabled: false } }, ...extra });
// Monday 2026-11-23, 10:00 in Michigan (15:00 UTC): five hours before a 15:00 cut-off.
const monday10 = new Date('2026-11-23T15:00:00Z');
const charlotte = { id: 'ct', code: 'CT', name: 'Charlotte', lat: 42.5636, lng: -84.8358, capabilities: ['SAW', 'Plasma Cutting'], stock: { items: 20, weightLb: 5000.4 }, rule: rule() };
const jackson = { id: 'jx', code: 'JX', name: 'Jackson Steel', lat: 42.2459, lng: -84.4013, capabilities: ['SHEAR'], stock: { items: 0, weightLb: 0 }, rule: { isSet: false, timezone: 'America/Detroit', divisionRules: {} } };

test('the wall clock at a branch follows its time zone', () => {
  assert.deepEqual(localClock(monday10, 'America/Detroit'), { dateStr: '2026-11-23', dayOfWeek: 1, minutes: 600 });
  assert.deepEqual(localClock(new Date('2026-11-23T03:30:00Z'), 'America/Detroit'), { dateStr: '2026-11-22', dayOfWeek: 0, minutes: 22 * 60 + 30 });
});

test('a process is matched to the machines and processes on file', () => {
  assert.ok(canDo(['SAW'], 'SAW-CUT'));
  assert.ok(canDo(['Plasma Cutting'], 'PLASMA'));
  assert.ok(canDo(['P11SAW'], 'SAW'));
  assert.ok(!canDo(['SHEAR'], 'DRILL'));
  assert.ok(!canDo([], 'SAW'));
});

test('distance needs both positions', () => {
  assert.equal(milesBetween({ lat: 42.5636, lng: -84.8358 }, { lat: null, lng: -84 }), null);
  const miles = milesBetween(charlotte, jackson);
  assert.ok(miles > 25 && miles < 40, String(miles));
});

test('branches are ranked on stock, cut-off, processing and distance, with the reasons', () => {
  const { suggestions } = compareBranches({ branches: [jackson, charlotte], division: 'METALS', requiredProcessing: ['SAW-CUT', 'DRILL'], shipTo: { lat: 42.5636, lng: -84.8358 }, now: monday10 });
  assert.deepEqual(suggestions.map((s) => [s.locationCode, s.rank, s.recommended]), [['CT', 1, true], ['JX', 2, false]]);
  const [ct, jx] = suggestions;
  // Charlotte: full stock 30, cut-off five hours away 30, one of two processes 13, at the door 15.
  assert.equal(ct.score, 30 + 30 + 13 + 15);
  assert.deepEqual(ct.inventory, { available: true, totalQty: 20, totalWeight: 5000 });
  assert.deepEqual(ct.cutoff, { cutoffLocal: '15:00', minutesLeft: 300, cutoffMet: true, isSet: true });
  assert.deepEqual(ct.processing, { capable: false, missingOps: ['DRILL'] });
  assert.deepEqual(ct.reasons.map((r) => r.code), ['INV_OK', 'CUTOFF_OK', 'PROC_MISSING', 'DIST']);
  // Jackson: no stock, no rule set, neither process.
  assert.equal(jx.inventory.available, false);
  assert.equal(jx.cutoff.isSet, false);
  assert.deepEqual(jx.reasons.map((r) => r.code).slice(0, 3), ['INV_NONE', 'CUTOFF_NOT_SET', 'PROC_MISSING']);
  assert.equal(jx.csrKey, 'JX');
});

test('a cut-off that has passed, a day that is not a ship day and a closed period score low', () => {
  const at = (now, r = rule()) => compareBranches({ branches: [{ ...charlotte, rule: r }], now }).suggestions[0].cutoff;
  assert.deepEqual(at(new Date('2026-11-23T21:00:00Z')), { cutoffLocal: '15:00', minutesLeft: -60, cutoffMet: false, isSet: true });
  assert.equal(at(new Date('2026-11-22T15:00:00Z')).cutoffMet, false, 'Sunday is not a ship day');
  assert.equal(at(monday10, rule({ blackoutWindows: [{ start: '2026-11-23', end: '2026-11-24' }] })).cutoffMet, false);
  assert.equal(at(monday10, rule({ divisionRules: { METALS: { cutoffLocal: '15:00', nextDayEnabled: false, shipDays: [1] } } })).cutoffLocal, null, 'next-day off');
});

test('no branches gives no suggestions, and a branch can be left out', () => {
  assert.deepEqual(compareBranches({ branches: [] }).suggestions, []);
  assert.deepEqual(compareBranches({ branches: [charlotte, jackson], excludeLocationId: 'ct', now: monday10 }).suggestions.map((s) => s.locationCode), ['JX']);
});
