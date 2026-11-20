/**
 * Cost stays with the roles that manage it (Phase 8, finding N-020; owner decision 9).
 *
 * Many answers carry a whole stock item, stock record or stock movement inside something else: an order
 * with its reserved stock, a job with its material, a recent-movement list. Each route would have to
 * remember to take the cost out, and several did not. This guard does it in one place: for a reader who
 * is not a cost viewer, the cost fields are removed from every stock item, stock record and stock
 * movement in the answer, wherever it sits. Nothing else is touched (a purchase order line's price, a
 * product's list price and an invoice stay as their own routes decide).
 */
import { can } from './roleStore.js';

const COST_KEYS = ['unitCost', 'landedCost', 'avgCost'];
const plain = (v) => v && typeof v === 'object' && (Array.isArray(v) || Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);
const carriesCost = (o) => 'coilNumber' in o || 'movementType' in o || 'qtyOnHand' in o;

/** Pure: a copy of the answer with cost removed from stock items, stock records and movements. */
export function withoutStockCost(value, depth = 0) {
  if (!plain(value) || depth > 12) return value;
  if (Array.isArray(value)) return value.map((v) => withoutStockCost(v, depth + 1));
  const out = {};
  const strip = carriesCost(value);
  for (const [k, v] of Object.entries(value)) {
    if (strip && COST_KEYS.includes(k)) continue;
    out[k] = withoutStockCost(v, depth + 1);
  }
  return out;
}

/** Express guard: every answer leaves without stock cost unless the reader is a signed-in cost viewer. */
export function stockCostGuard(req, res, next) {
  const send = res.json.bind(res);
  res.json = (body) => send(req.user && can(req, 'inventory:viewCost') ? body : withoutStockCost(body));
  next();
}
