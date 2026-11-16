// Shared by the business groups: a list on screen is compared with the answer the screen received.
module.exports = (s) => {
  const { openWithAnswer, text, settle } = s;
  const money = (v) => `$${Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  /** Opens a list and checks that the first records the server sent are on screen, in the server's order. */
  async function listShows(t, context, route, pattern, keyOf, { n = 6, scope = 'main', min = 1, more = [] } = {}) {
    const { page, rows, answer } = await openWithAnswer(context, route, pattern);
    t.check('the server sent records', rows.length >= min, `rows ${rows.length}`);
    await settle(page, 300);
    const body = await text(page, scope); const keys = rows.slice(0, n).map(keyOf).filter(Boolean); let at = -1; let inOrder = true; const missing = [];
    for (const k of keys) { const i = body.indexOf(String(k), at + 1); if (i < 0) { if (body.indexOf(String(k)) < 0) missing.push(k); else inOrder = false; } else at = i; }
    t.check(`the first ${keys.length} records the server sent are on screen`, keys.length > 0 && missing.length === 0, `missing ${missing.join(', ')}`);
    t.check('in the order the server sent them', inOrder, keys.join(', '));
    for (const [what, valueOf] of more) { const v = valueOf(rows[0]); t.check(`the first record's ${what} is shown as sent (${v})`, body.includes(String(v)), body.slice(0, 200)); }
    t.check('no page error', page.errors.length === 0, page.errors[0]);
    return { page, rows, answer, body };
  }
  /** Every list of records the screen received that carries `key`: the largest one. */
  const sent = (page, key, urlPattern) => { let best = []; const walk = (v, d) => { if (!v || d > 3) return; if (Array.isArray(v)) { if (v.length > best.length && v[0] && typeof v[0] === 'object' && v[0][key] != null) best = v; return; } if (typeof v === 'object') for (const x of Object.values(v)) walk(x, d + 1); }; for (const a of page.answers) if (!urlPattern || urlPattern.test(a.url)) walk(a.json, 0); return best; };
  /** Checks that records the screen received, found by a field they carry, are what is on screen. */
  async function screenShows(t, page, key, { n = 5, urlPattern, scope = 'main', min = 1 } = {}) {
    await s.settle(page, 500); const rows = sent(page, key, urlPattern); const body = await text(page, scope);
    t.check(`the server sent records with a ${key}`, rows.length >= min, `${rows.length} from ${page.answers.map((a) => a.url).slice(0, 8).join(' ')}`);
    const keys = rows.map((r) => String(r[key])); const on = keys.filter((k) => body.includes(k));
    t.check(`records sent are on screen (${Math.min(n, keys.length)} looked for)`, on.length >= Math.min(n, keys.length), `${on.length} of ${keys.length}: ${keys.slice(0, 6).join(', ')}`);
    t.check('no page error', page.errors.length === 0, page.errors[0]);
    return { rows, body };
  }
  return { listShows, money, sent, screenShows };
};
