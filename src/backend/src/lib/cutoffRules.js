/**
 * Order cut-off rules for each real branch (2026-11-22). They decide whether the web store and the promise
 * check may offer next-day shipping. Before this the rules were four made-up locations kept in the browser.
 *
 * One rule per branch, saved together in the settings document 'online.cutoffRules', keyed by location id:
 *   { timezone, divisionRules: { METALS: { cutoffLocal, nextDayEnabled, shipDays, pickupSameDayEnabled }, ... },
 *     blackoutWindows: [{ start, end, reason }], notes }
 * A branch with nothing saved gets a blank rule marked isSet: false, with next-day shipping off: the times are
 * the owner's to set, and nothing is promised on an invented time.
 */
export const CUTOFF_SETTING = 'online.cutoffRules';
export const CUTOFF_DIVISIONS = ['METALS', 'PLASTICS', 'SUPPLIES', 'OUTLET'];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

const blankDivision = () => ({ cutoffLocal: '15:00', nextDayEnabled: false, shipDays: [1, 2, 3, 4, 5], pickupSameDayEnabled: false });

/** The rule the screens read for one branch: what was saved, on top of the branch's own name and time zone. */
export function ruleFor(location, saved) {
  const divisionRules = {};
  for (const d of CUTOFF_DIVISIONS) divisionRules[d] = { ...blankDivision(), ...(saved?.divisionRules?.[d] || {}) };
  return {
    locationId: location.id,
    locationCode: location.code,
    locationName: location.name,
    timezone: location.timezone || 'America/Detroit',
    isSet: Boolean(saved),
    divisionRules,
    blackoutWindows: saved?.blackoutWindows || [],
    notes: saved?.notes || '',
  };
}

/** Checks what was sent for one branch. Returns { data } to save, or { error } as a sentence. */
export function cutoffRuleInput(body) {
  const sent = body?.divisionRules;
  if (!sent || typeof sent !== 'object') return { error: 'Send the rules for each division' };
  const divisionRules = {};
  for (const d of CUTOFF_DIVISIONS) {
    const r = sent[d];
    if (!r) continue;
    if (!TIME.test(String(r.cutoffLocal || ''))) return { error: `The cut-off time for ${d} must be a time such as 15:30` };
    const shipDays = [...new Set((Array.isArray(r.shipDays) ? r.shipDays : []).map(Number))].sort();
    if (shipDays.some((n) => !Number.isInteger(n) || n < 0 || n > 6)) return { error: `The ship days for ${d} are not days of the week` };
    if (r.nextDayEnabled && !shipDays.length) return { error: `Pick at least one ship day for ${d}, or switch next-day shipping off` };
    divisionRules[d] = { cutoffLocal: r.cutoffLocal, nextDayEnabled: Boolean(r.nextDayEnabled), shipDays, pickupSameDayEnabled: Boolean(r.pickupSameDayEnabled) };
  }
  if (!Object.keys(divisionRules).length) return { error: 'Send the rules for each division' };
  const blackoutWindows = [];
  for (const w of Array.isArray(body.blackoutWindows) ? body.blackoutWindows : []) {
    if (!DAY.test(String(w?.start || '')) || !DAY.test(String(w?.end || ''))) return { error: 'A closed period needs a first and a last day' };
    if (w.end < w.start) return { error: 'A closed period cannot end before it starts' };
    blackoutWindows.push({ start: w.start, end: w.end, reason: String(w.reason || '').trim().slice(0, 200) });
  }
  return { data: { divisionRules, blackoutWindows, notes: String(body.notes || '').trim().slice(0, 1000) } };
}
