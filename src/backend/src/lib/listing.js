/**
 * One way to window a list that answers with a bare array (finding E-021, B-012, G-014).
 *
 * Older list routes answer `[...]` and always return their fixed maximum. Changing them to
 * `{ data, meta }` would break every screen that reads them, so the array stays and the window
 * is added around it:
 *   - `?limit=` and `?offset=` are honoured, up to the route's maximum;
 *   - the total, the limit used and the offset are returned in the headers `X-Total-Count`,
 *     `X-Limit` and `X-Offset`, so a caller can page without a second kind of body.
 * A call with neither parameter behaves exactly as before (and skips the count).
 */
export function listWindow(query = {}, { max = 100, fallback = max } = {}) {
  const asked = query.limit !== undefined && query.limit !== '';
  const skipped = query.offset !== undefined && query.offset !== '';
  const take = asked ? Math.min(max, Math.max(1, Number.parseInt(query.limit, 10) || fallback)) : fallback;
  const skip = skipped ? Math.max(0, Number.parseInt(query.offset, 10) || 0) : 0;
  return { take, skip, windowed: asked || skipped };
}

export function sendWindow(res, rows, { take, skip, total }) {
  res.set('X-Limit', String(take));
  res.set('X-Offset', String(skip));
  if (total !== undefined && total !== null) res.set('X-Total-Count', String(total));
  res.set('Access-Control-Expose-Headers', 'X-Total-Count, X-Limit, X-Offset');
  return res.json(rows);
}
