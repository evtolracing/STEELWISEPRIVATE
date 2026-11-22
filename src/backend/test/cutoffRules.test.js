import test from 'node:test';
import assert from 'node:assert/strict';
import { ruleFor, cutoffRuleInput, CUTOFF_DIVISIONS } from '../src/lib/cutoffRules.js';

const charlotte = { id: 'ct', code: 'CT', name: 'Charlotte', timezone: 'America/Detroit' };

test('a branch with nothing saved gets a blank rule that promises nothing', () => {
  const r = ruleFor(charlotte, undefined);
  assert.equal(r.isSet, false);
  assert.deepEqual(Object.keys(r.divisionRules), CUTOFF_DIVISIONS);
  assert.ok(Object.values(r.divisionRules).every((d) => d.nextDayEnabled === false && d.pickupSameDayEnabled === false));
  assert.deepEqual([r.locationId, r.locationCode, r.locationName, r.timezone], ['ct', 'CT', 'Charlotte', 'America/Detroit']);
});

test('a saved rule is read back, with the branch\'s own name and time zone', () => {
  const saved = { divisionRules: { METALS: { cutoffLocal: '14:15', nextDayEnabled: true, shipDays: [1, 2], pickupSameDayEnabled: true } }, blackoutWindows: [{ start: '2027-07-03', end: '2027-07-04', reason: 'Holiday' }], notes: 'n' };
  const r = ruleFor({ ...charlotte, timezone: 'America/Chicago' }, saved);
  assert.equal(r.isSet, true);
  assert.equal(r.timezone, 'America/Chicago');
  assert.deepEqual(r.divisionRules.METALS, saved.divisionRules.METALS);
  assert.equal(r.divisionRules.PLASTICS.nextDayEnabled, false, 'a division not saved stays off');
  assert.equal(r.blackoutWindows.length, 1);
});

test('what is sent is checked before it is saved', () => {
  const metals = { cutoffLocal: '15:30', nextDayEnabled: true, shipDays: [5, 1, 1], pickupSameDayEnabled: 1 };
  const ok = cutoffRuleInput({ divisionRules: { METALS: metals, UNKNOWN: metals }, notes: '  hi ', locationName: 'ignored' });
  assert.deepEqual(ok.data, { divisionRules: { METALS: { cutoffLocal: '15:30', nextDayEnabled: true, shipDays: [1, 5], pickupSameDayEnabled: true } }, blackoutWindows: [], notes: 'hi' });
  assert.match(cutoffRuleInput({}).error, /each division/);
  assert.match(cutoffRuleInput({ divisionRules: { METALS: { ...metals, cutoffLocal: '3pm' } } }).error, /cut-off time for METALS/);
  assert.match(cutoffRuleInput({ divisionRules: { METALS: { ...metals, shipDays: [9] } } }).error, /days of the week/);
  assert.match(cutoffRuleInput({ divisionRules: { METALS: { ...metals, shipDays: [] } } }).error, /at least one ship day/);
  assert.match(cutoffRuleInput({ divisionRules: { METALS: metals }, blackoutWindows: [{ start: '2027-07-04', end: '2027-07-03' }] }).error, /end before/);
  assert.match(cutoffRuleInput({ divisionRules: { METALS: metals }, blackoutWindows: [{ start: 'x', end: '2027-07-03' }] }).error, /first and a last day/);
});
