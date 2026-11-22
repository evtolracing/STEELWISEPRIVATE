/**
 * Which branch suits an order best (2026-11-22). Before this the comparison ran in the browser over four made-up
 * locations with made-up stock. Now it scores the real branches the store sells from, from what is on file:
 *   stock      the stock items of the division available at the branch       0 to 30
 *   cut-off    the time left before the branch's cut-off today               0 to 30  (0 when no rule is set)
 *   processing the machines and processes at the branch against what is asked 0 to 25
 *   distance   from the branch to the ship-to, when both have a position     0 to 15
 * Pure: the route reads the records and hands them in.
 */
const WEIGHTS = { INVENTORY: 30, CUTOFF: 30, PROCESSING: 25, DISTANCE: 15 };
// Twenty available stock items of the division earns the full stock score.
const FULL_STOCK_ITEMS = 20;

/** The wall clock at a branch: { dateStr: 'YYYY-MM-DD', dayOfWeek: 0-6, minutes: since midnight }. */
export function localClock(now, timeZone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short',
  }).formatToParts(now).map((p) => [p.type, p.value]));
  return {
    dateStr: `${parts.year}-${parts.month}-${parts.day}`,
    dayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday),
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

function scoreStock(stock) {
  const items = stock?.items || 0;
  if (!items) return { score: 0, available: false, totalQty: 0, totalWeight: 0 };
  return { score: Math.round(Math.min(1, items / FULL_STOCK_ITEMS) * WEIGHTS.INVENTORY), available: true, totalQty: items, totalWeight: Math.round(stock.weightLb || 0) };
}

function scoreCutoff(rule, division, now) {
  const div = rule?.isSet ? rule.divisionRules?.[division] : null;
  if (!div || !div.nextDayEnabled) return { score: 0, cutoffLocal: null, minutesLeft: null, cutoffMet: false, isSet: Boolean(rule?.isSet) };
  const clock = localClock(now, rule.timezone);
  const [h, m] = div.cutoffLocal.split(':').map(Number);
  const minutesLeft = h * 60 + m - clock.minutes;
  const closed = (rule.blackoutWindows || []).some((w) => clock.dateStr >= w.start && clock.dateStr <= w.end);
  const out = { cutoffLocal: div.cutoffLocal, minutesLeft, isSet: true };
  if (closed || !(div.shipDays || []).includes(clock.dayOfWeek)) return { ...out, score: 0, cutoffMet: false };
  if (minutesLeft <= 0) return { ...out, score: 2, cutoffMet: false };
  return { ...out, score: Math.round(Math.min(1, minutesLeft / 240) * WEIGHTS.CUTOFF), cutoffMet: true };
}

const key = (s) => String(s || '').toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean)[0] || '';
/** "SAW-CUT" is done at a branch with a SAW; "Plasma Cutting" on file covers PLASMA. */
export function canDo(capabilities, op) {
  const want = key(op);
  if (!want) return true;
  return (capabilities || []).some((c) => { const have = key(c); return have && (have === want || have.includes(want) || want.includes(have)); });
}

function scoreProcessing(capabilities, required) {
  const asked = (required || []).filter(Boolean);
  if (!asked.length) return { score: WEIGHTS.PROCESSING, capable: true, missingOps: [] };
  const missingOps = asked.filter((op) => !canDo(capabilities, op));
  return { score: Math.round((1 - missingOps.length / asked.length) * WEIGHTS.PROCESSING), capable: missingOps.length === 0, missingOps };
}

const num = (v) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
export function milesBetween(a, b) {
  const [lat1, lng1, lat2, lng2] = [num(a?.lat), num(a?.lng), num(b?.lat), num(b?.lng)];
  if ([lat1, lng1, lat2, lng2].some((v) => v === null)) return null;
  const rad = Math.PI / 180;
  const h = Math.sin((lat2 - lat1) * rad / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin((lng2 - lng1) * rad / 2) ** 2;
  return Math.round(3959 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}

function scoreDistance(branch, shipTo) {
  const miles = milesBetween(branch, shipTo);
  if (miles === null) return { score: Math.round(WEIGHTS.DISTANCE * 0.5), miles: null, estimateLabel: 'Unknown' };
  const share = miles <= 30 ? 1 : miles <= 100 ? 0.7 : miles <= 250 ? 0.4 : 0.1;
  return { score: Math.round(share * WEIGHTS.DISTANCE), miles, estimateLabel: miles < 50 ? 'Local' : miles < 150 ? 'Regional' : 'Long haul' };
}

function reasons(inv, cutoff, proc, dist) {
  const out = [];
  out.push(inv.available
    ? { code: 'INV_OK', label: `${inv.totalQty} stock ${inv.totalQty === 1 ? 'item' : 'items'} available`, impact: 'positive' }
    : { code: 'INV_NONE', label: 'No stock of this division at this branch', impact: 'negative' });
  if (!cutoff.isSet) out.push({ code: 'CUTOFF_NOT_SET', label: 'Cut-off times are not set for this branch', impact: 'neutral' });
  else if (cutoff.cutoffLocal === null) out.push({ code: 'CUTOFF_OFF', label: 'Next-day shipping is off for this division', impact: 'neutral' });
  else if (cutoff.cutoffMet && cutoff.minutesLeft > 60) out.push({ code: 'CUTOFF_OK', label: `${Math.floor(cutoff.minutesLeft / 60)}h ${cutoff.minutesLeft % 60}m until cutoff`, impact: 'positive' });
  else if (cutoff.cutoffMet) out.push({ code: 'CUTOFF_SOON', label: `Only ${cutoff.minutesLeft}m until cutoff`, impact: 'neutral' });
  else out.push({ code: 'CUTOFF_PASSED', label: 'Cutoff has passed for today', impact: 'negative' });
  out.push(proc.capable
    ? { code: 'PROC_OK', label: 'All processing available', impact: 'positive' }
    : { code: 'PROC_MISSING', label: `Missing: ${proc.missingOps.join(', ')}`, impact: 'negative' });
  if (dist.miles !== null) out.push({ code: 'DIST', label: `~${dist.miles} mi (${dist.estimateLabel})`, impact: dist.miles < 100 ? 'positive' : 'neutral' });
  return out;
}

/**
 * branches: [{ id, code, name, lat, lng, capabilities: string[], stock: { items, weightLb }, rule }]
 * Returns the branches best first, each with its score and the reasons for it.
 */
export function compareBranches({ branches, division = 'METALS', requiredProcessing = [], shipTo = null, excludeLocationId = null, now = new Date() }) {
  const suggestions = (branches || []).filter((b) => b.id !== excludeLocationId).map((b) => {
    const inv = scoreStock(b.stock);
    const cutoff = scoreCutoff(b.rule, division, now);
    const proc = scoreProcessing(b.capabilities, requiredProcessing);
    const dist = scoreDistance(b, shipTo);
    return {
      locationId: b.id, locationName: b.name, locationCode: b.code, csrKey: b.code,
      score: inv.score + cutoff.score + proc.score + dist.score,
      reasons: reasons(inv, cutoff, proc, dist),
      inventory: { available: inv.available, totalQty: inv.totalQty, totalWeight: inv.totalWeight },
      cutoff: { cutoffLocal: cutoff.cutoffLocal, minutesLeft: cutoff.minutesLeft, cutoffMet: cutoff.cutoffMet, isSet: cutoff.isSet },
      processing: { capable: proc.capable, missingOps: proc.missingOps },
      distance: { miles: dist.miles, estimateLabel: dist.estimateLabel },
    };
  });
  // Best first; equal scores in name order, so the answer does not change between two askings.
  suggestions.sort((a, b) => b.score - a.score || a.locationName.localeCompare(b.locationName));
  suggestions.forEach((s, i) => { s.rank = i + 1; s.recommended = i === 0; });
  return { suggestions };
}
