/**
 * Locations a person manages (owner's request, 2026-11-22): what a location record may hold, and when
 * one may be switched off or deleted. Pure functions, so the rules can be checked without a database.
 *
 *   add, deactivate, reactivate, delete   the super admin and the tenant owner (locations:add, locations:remove)
 *   change the details                    those two and the admin (locations:edit)
 *
 * A location that was ever used is never deleted: its orders, stock and shipments point at it. It is
 * switched off, which takes it out of every "which branch" list and keeps its history. A location is
 * switched off only when nothing is still open there.
 */
export const LOCATION_TYPES = ['WAREHOUSE', 'YARD', 'RACK', 'BIN', 'FLOOR'];
const text = (v) => (v === undefined || v === null ? '' : String(v).trim());
const optional = (v, max) => { const s = text(v); return s ? s.slice(0, max) : null; };
const list = (v) => [...new Set((Array.isArray(v) ? v : text(v).split(',')).map((x) => text(x)).filter(Boolean))].slice(0, 60);

/** The code as it is kept: capitals, digits and dashes. "ct 1" -> "CT-1". */
export const locationCode = (v) => text(v).toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 20);

const validZone = (zone) => { try { new Intl.DateTimeFormat('en-US', { timeZone: zone }); return true; } catch { return false; } };

/**
 * The fields to save from what a person sent, or { error }. `creating`: code and name are required;
 * otherwise only the fields that were sent are returned, so an edit never blanks what it did not show.
 */
export function locationInput(body = {}, { creating = false } = {}) {
  const has = (k) => Object.prototype.hasOwnProperty.call(body, k);
  const out = {};
  if (creating || has('code')) {
    const code = locationCode(body.code);
    if (!code) return { error: 'A location needs a code, for example CT' };
    out.code = code;
  }
  if (creating || has('name')) {
    const name = text(body.name);
    if (!name) return { error: 'A location needs a name' };
    if (name.length > 120) return { error: 'The name is too long (120 letters at most)' };
    out.name = name;
  }
  if (creating || has('type')) {
    const type = text(body.type).toUpperCase() || 'WAREHOUSE';
    if (!LOCATION_TYPES.includes(type)) return { error: `The type must be one of ${LOCATION_TYPES.join(', ')}` };
    out.type = type;
  }
  if (creating || has('isBranch')) out.isBranch = creating && !has('isBranch') ? true : Boolean(body.isBranch);
  for (const [k, max] of [['addressLine1', 200], ['addressLine2', 200], ['city', 100], ['country', 60], ['phone', 40], ['fax', 40], ['hours', 300], ['notes', 2000]]) {
    if (has(k)) out[k] = optional(body[k], max);
  }
  if (has('state')) {
    const state = text(body.state).toUpperCase();
    if (state && !/^[A-Z]{2}$/.test(state)) return { error: 'The state must be a two-letter code, for example MI' };
    out.state = state || null;
  }
  if (has('postalCode')) {
    const zip = text(body.postalCode);
    if (zip && !/^[A-Za-z0-9 -]{3,12}$/.test(zip)) return { error: 'The postal code is not valid' };
    out.postalCode = zip || null;
  }
  if (has('email')) {
    const email = text(body.email).toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'The email address is not valid' };
    out.email = email || null;
  }
  if (has('timezone')) {
    const zone = text(body.timezone) || 'America/Detroit';
    if (!validZone(zone)) return { error: 'The time zone is not one the system knows, for example America/Detroit' };
    out.timezone = zone;
  }
  for (const [k, lo, hi, what] of [['lat', -90, 90, 'latitude'], ['lng', -180, 180, 'longitude'], ['maxWeightLb', 0, 1e9, 'weight limit'], ['squareFeet', 0, 1e8, 'floor area']]) {
    if (!has(k)) continue;
    if (text(body[k]) === '') { out[k] = null; continue; }
    const n = Number(body[k]);
    if (!Number.isFinite(n) || n < lo || n > hi) return { error: `The ${what} is not a valid number` };
    out[k] = k === 'squareFeet' ? Math.round(n) : n;
  }
  for (const k of ['isOutdoor', 'hasCrane', 'sellsFrom', 'shipsFrom']) if (has(k)) out[k] = Boolean(body[k]);
  for (const k of ['divisions', 'processes']) if (has(k)) out[k] = list(body[k]);
  for (const k of ['managerId', 'parentId']) if (has(k)) out[k] = text(body[k]) || null;
  if (out.isBranch && out.parentId) return { error: 'A branch cannot sit inside another location. Clear "inside of" or mark it a storage area.' };
  return { data: out };
}

/** What keeps a location from being switched off, as sentences. `open` are counts of what is still open there. */
export function deactivationBlocks(open = {}) {
  const n = (k) => Number(open[k]) || 0;
  const s = (count, one, many) => `${count} ${count === 1 ? one : many}`;
  const out = [];
  if (n('openOrders')) out.push(`${s(n('openOrders'), 'open order', 'open orders')}: ship, complete or cancel them, or move them to another branch`);
  if (n('openJobs')) out.push(`${s(n('openJobs'), 'open job', 'open jobs')} planned here: finish or cancel them`);
  if (n('stock')) out.push(`${s(n('stock'), 'stock record', 'stock records')} with material on hand: transfer or adjust it out`);
  if (n('openShipments')) out.push(`${s(n('openShipments'), 'shipment', 'shipments')} not yet delivered: deliver or cancel them`);
  if (n('openTransfers')) out.push(`${s(n('openTransfers'), 'stock transfer', 'stock transfers')} on the way: receive or cancel them`);
  if (n('activeMachines')) out.push(`${s(n('activeMachines'), 'active work center', 'active work centers')}: switch them off or move them`);
  if (n('activeUsers')) out.push(`${s(n('activeUsers'), 'active person has', 'active people have')} this as their home branch: give them another home branch (or pick one below)`);
  if (n('activeChildren')) out.push(`${s(n('activeChildren'), 'active storage area', 'active storage areas')} inside it: switch them off first`);
  return out;
}

/** Whether anything at all ever pointed at the location. `used` are counts by kind of record. */
export const everUsed = (used = {}) => Object.values(used).some((v) => Number(v) > 0);

/** Which fields changed, for the audit log: { field: [before, after] }. Decimals and arrays compare by value. */
export function changedFields(before = {}, data = {}) {
  const norm = (v) => (v === undefined || v === null ? null : Array.isArray(v) ? JSON.stringify(v) : typeof v === 'object' ? String(v) : v);
  const out = {};
  for (const [k, v] of Object.entries(data)) {
    const a = norm(before[k]); const b = norm(v);
    if (a !== b && !(typeof a === 'string' && typeof b === 'number' && Number(a) === b)) out[k] = [before[k] ?? null, v ?? null];
  }
  return out;
}
