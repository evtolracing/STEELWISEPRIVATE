// Group 8: reports, dashboards, the screens and deployment facts at the data volume of the 80-branch run.
// The API parts read through the multi-copy front door; the screens are opened in a real browser
// (--app, a Vite server whose /api goes to a QA server on the same database).
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
export default async function run(c) {
  const { S, G11, E, branch, P, hq, onDock, all, statuses, prisma, err, arg, http1, sleep, reconcile, today, root, near } = c;
  const G = G11.report;
  const READ = { p95: 800 }; const SCREEN_MS = 3000; // proposed limits (qa/sim/phase11/thresholds.mjs; the screen limit is proposed here), pending the owner's approval
  const cfo = hq('CFO', 0); const exec = hq('EXECUTIVE', 0); const auditor = hq('AUDITOR', 0);
  const bL = await branch('LARGE', 7);
  const pct = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.ceil(p * s.length) - 1)] : 0; };
  const timed = async (fn) => { const t = performance.now(); const r = await fn(); return { r, ms: performance.now() - t }; };
  const volume = async () => ({ orders: await prisma.order.count(), invoices: await prisma.invoice.count(), items: await prisma.coil.count(), entries: await prisma.journalEntry.count(), movements: await prisma.materialMovement.count() });
  const vol = await volume(); const at = `(${vol.orders} orders, ${vol.invoices} invoices, ${vol.items} stock items, ${vol.entries} journal entries)`;

  const DASH = [['the executive cockpit', '/api/executive/cockpit', exec], ['the home dashboard', '/api/dashboard', exec], ['the dashboard figures', '/api/dashboard/kpis', exec], ['the operations cockpit', '/api/ops-cockpit', P.manager(bL)], ['the sales dashboard', '/api/sales-dashboard', P.manager(bL)]];
  await S(G, 'The five dashboards answer within the proposed limit at this volume', { init: `The database after the enterprise run ${at}`, expect: `each dashboard read twelve times, four at a time: all 200, 95th percentile under ${READ.p95} ms`, biz: 'the first screen of the day opens in under a second' }, async (ok) => {
    for (const [name, url, who] of DASH) {
      const ms = []; const rs = [];
      for (let i = 0; i < 3; i++) for (const x of await all(4, () => timed(() => who.get(url)))) { ms.push(x.ms); rs.push(x.r); }
      ok(`${name}: answered every time`, rs.every((r) => r.status === 200), `${statuses(rs)} ${err(rs.find((r) => r.status !== 200) || {})}`);
      ok(`${name}: 95th percentile under ${READ.p95} ms`, pct(ms, 0.95) < READ.p95, `median ${Math.round(pct(ms, 0.5))} ms, p95 ${Math.round(pct(ms, 0.95))} ms`);
    }
  });

  await S(G, 'The dashboards keep answering while twenty sales are shipped and billed', { expect: 'forty dashboard reads beside twenty dispatches: every read 200, every sale billed', biz: 'managers are not locked out by the dock\'s work' }, async (ok) => {
    const docks = []; for (let i = 0; i < 20; i++) docks.push(await onDock(bL, 100 + i, { lotLb: 1300 }));
    const [reads, sales] = await Promise.all([all(40, (i) => timed(() => DASH[i % DASH.length][2].get(DASH[i % DASH.length][1]))), Promise.all(docks.map((d) => d.shipper.put(`/api/shipments/${d.shipment.id}/dispatch`, {})))]);
    ok('every sale was billed', sales.every((r) => r.status === 200 && r.body.invoice?.id), statuses(sales));
    ok('every read answered', reads.every((x) => x.r.status === 200), statuses(reads.map((x) => x.r)).slice(0, 60));
    ok('the slowest read stayed under 2.5 seconds', Math.max(...reads.map((x) => x.ms)) < 2500, `p95 ${Math.round(pct(reads.map((x) => x.ms), 0.95))} ms, slowest ${Math.round(Math.max(...reads.map((x) => x.ms)))} ms`);
  });

  await S(G, 'Revenue adds up to the same total whether it is read by branch or by customer', { expect: 'the two groupings of the revenue report have the same total, and it equals the revenue the reconciliation reads from the books', fin: 'one revenue figure' }, async (ok) => {
    const [byBranch, byCustomer, r] = [await cfo.get('/api/ledger/reports/revenue?by=branch'), await cfo.get('/api/ledger/reports/revenue?by=customer'), await reconcile(cfo)];
    ok('both answered', byBranch.status === 200 && byCustomer.status === 200, `${byBranch.status} ${byCustomer.status}`);
    ok('the totals are equal', near(byBranch.body.total, byCustomer.body.total), `${byBranch.body.total} vs ${byCustomer.body.total}`);
    ok('the rows add up to the total', near(byBranch.body.rows.reduce((a, x) => a + Number(x.net), 0), byBranch.body.total, 0.011));
    ok('the reconciliation finds the revenue in the books equal to the invoices', r.of('REVENUE')?.status === 'MATCH', `${r.of('REVENUE')?.status} ${r.of('REVENUE')?.difference}`);
  });

  await S(G, 'The stock value report equals the stock value the reconciliation reads from the books', { expect: 'the report\'s branches add up to the reconciliation\'s figure for the records', fin: 'one stock value' }, async (ok) => {
    const rep = await cfo.get('/api/ledger/reports/inventory'); const r = await reconcile(cfo);
    ok('answered', rep.status === 200, rep.status);
    const sum = rep.body.rows.reduce((a, x) => a + Number(x.total ?? (Number(x.rawMaterial || 0) + Number(x.finished || 0) + Number(x.wip || 0))), 0);
    ok('the branches add up to the reconciliation\'s record figure', near(sum, r.of('INVENTORY').records, 0.011) || near(Number(rep.body.totals?.total ?? rep.body.total ?? NaN), r.of('INVENTORY').records, 0.011), `${sum} / ${JSON.stringify(rep.body.totals || rep.body.total || Object.keys(rep.body))} vs ${r.of('INVENTORY').records}`);
    ok('and the books agree with the records', r.of('INVENTORY').status === 'MATCH', r.of('INVENTORY').difference);
  });

  await S(G, 'Twelve people read the receivables report at once and get the same figures', { expect: 'twelve identical totals, within the proposed limit', fin: 'a report does not depend on which server copy answers' }, async (ok) => {
    const xs = await all(12, (i) => timed(() => (i % 2 ? cfo : auditor).get('/api/ledger/reports/receivables')));
    ok('all answered', xs.every((x) => x.r.status === 200), statuses(xs.map((x) => x.r)));
    ok('the same totals in each', new Set(xs.map((x) => JSON.stringify(x.r.body.totals))).size === 1);
    ok('answered by more than one server copy when several run', c.copies < 2 || new Set(xs.map((x) => x.r.headers.get('x-qa-instance'))).size > 1);
    ok(`95th percentile under ${READ.p95} ms`, pct(xs.map((x) => x.ms), 0.95) < READ.p95, `p95 ${Math.round(pct(xs.map((x) => x.ms), 0.95))} ms`);
  });

  await S(G, 'Lists are served a page at a time however much is asked for', { init: `Thousands of rows in each list ${at}`, expect: 'a page of fifty answers within the limit; asking for a hundred thousand rows does not return them all', biz: 'a list cannot be used to pull the whole table', sec: 'no bulk read through a list' }, async (ok) => {
    const who = hq('COO', 0) || exec;
    for (const [what, url] of [['orders', '/api/orders'], ['invoices', '/api/invoices'], ['shipments', '/api/shipments'], ['stock items', '/api/inventory'], ['journal entries', '/api/ledger/entries']]) {
      const asker = what === 'journal entries' ? cfo : who;
      const ms = []; let last;
      for (let i = 0; i < 8; i++) { const x = await timed(() => asker.get(`${url}?limit=50&offset=${i * 50}`)); ms.push(x.ms); last = x.r; }
      ok(`${what}: a page answers`, last.status === 200, `${last.status} ${err(last)}`);
      ok(`${what}: 95th percentile under ${READ.p95} ms`, pct(ms, 0.95) < READ.p95, `p95 ${Math.round(pct(ms, 0.95))} ms`);
      const big = await asker.get(`${url}?limit=100000`);
      const rows = Array.isArray(big.body) ? big.body.length : (big.body?.data || big.body?.entries || big.body?.orders || big.body?.items || big.body?.invoices || big.body?.shipments || []).length;
      ok(`${what}: a request for 100,000 rows is refused or capped`, big.status === 400 || rows <= 1000, `${big.status}, ${rows} rows, ${Math.round(big.raw.length / 1024)} KB`);
    }
  });

  await S(G, 'The reconciliation of the whole books runs within the proposed limit at this volume', { init: `${vol.entries} journal entries, ${vol.items} stock items`, expect: 'five runs, each under 5 seconds, each agreeing', fin: 'the daily check stays practical as the books grow' }, async (ok) => {
    const ms = []; let last;
    for (let i = 0; i < 5; i++) { const x = await timed(() => reconcile(cfo)); ms.push(x.ms); last = x.r; }
    ok('the last run passed', last.passed === true, JSON.stringify(last.failing));
    ok('every run under 5 seconds', Math.max(...ms) < 5000, `${ms.map((x) => Math.round(x)).join(', ')} ms`);
  });

  await S(G, 'The month\'s export and statement are produced within the proposed limit at this volume', { expect: 'the monthly statement, the trial balance, the exceptions list and an export listing each answer in under 5 seconds', fin: 'month-end reporting stays practical' }, async (ok) => {
    const now = new Date();
    for (const [what, url] of [['the monthly statement', `/api/ledger/reports/monthly?year=${now.getUTCFullYear()}&month=${now.getUTCMonth() + 1}`], ['the trial balance', '/api/ledger/reports/trial-balance'], ['the gross margin report', '/api/ledger/reports/gross-margin'], ['the sales tax report', '/api/ledger/reports/sales-tax'], ['the exceptions list', '/api/ledger/reports/exceptions'], ['the export batches', '/api/ledger/exports']]) {
      const x = await timed(() => cfo.get(url));
      ok(`${what} answers`, x.r.status === 200, `${x.r.status} ${err(x.r)}`);
      ok(`${what} under 5 seconds`, x.ms < 5000, `${Math.round(x.ms)} ms`);
    }
  });

  // ── the screens, in a real browser ─────────────────────────────────────────────────────────
  const APP = arg('app', 'http://localhost:5199');
  let chromium = null; try { chromium = createRequire(import.meta.url)('playwright').chromium; } catch { chromium = null; }
  const appUp = await fetch(APP).then((r) => r.ok).catch(() => false);
  const browser = chromium && appUp ? await chromium.launch() : null;
  const SCREENS = [
    ['the order list', '/orders', () => P.manager(bL), /order/i],
    ['the invoice list', '/orders/invoices', () => P.manager(bL), /invoice/i],
    ['the inventory screen', '/inventory', () => P.stock(bL), /inventor|stock/i],
    ['the shipping screen', '/shipping', () => P.shipper(bL), /ship/i],
    ['the finance screen', '/finance', () => cfo, /financ|ledger|books/i],
    ['the executive cockpit', '/executive/cockpit', () => exec, /./],
    ['the order board', '/order-board', () => P.manager(bL), /./],
  ];
  for (const [name, url, who, heading] of SCREENS) {
    await S(G, `In the browser, ${name} opens at this volume without errors and without drawing every row`, { init: `A real browser against the application ${at}`, expect: `ready within ${SCREEN_MS} ms (proposed); no script error; no failed request; fewer than 600 table rows drawn`, biz: 'the screen stays usable as the data grows' }, async (ok) => {
      if (!ok('the application and a browser are available for the screen checks', Boolean(browser), `${APP} ${appUp ? 'answers' : 'does not answer'}; playwright ${chromium ? 'found' : 'missing'}`)) return;
      const p = who(); const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
      try {
        await context.addInitScript(([t, u]) => { localStorage.setItem('token', t); localStorage.setItem('user', JSON.stringify(u)); }, [p.token, p.user]);
        const page = await context.newPage(); const errors = []; const failed = []; let bytes = 0;
        page.on('pageerror', (e) => errors.push(e.message));
        page.on('response', async (r) => { if (/\/api\//.test(r.url())) { if (r.status() >= 500) failed.push(`${r.status()} ${new URL(r.url()).pathname}`); bytes += Number(r.headers()['content-length'] || 0); } });
        // Once to fill the browser's cache of scripts, then the measured visit.
        await page.goto(APP + url, { waitUntil: 'domcontentloaded' }); await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
        const t0 = Date.now();
        await page.goto(APP + url, { waitUntil: 'domcontentloaded' });
        await page.locator('main h1, h1, h2, h4, h5').first().waitFor({ timeout: 15000 }).catch(() => {});
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
        const ms = Date.now() - t0;
        const text = await page.locator('body').innerText().catch(() => '');
        const rows = await page.locator('tbody tr, [role="row"]').count();
        const nodes = await page.evaluate(() => document.querySelectorAll('*').length);
        ok('it shows its screen, not the sign-in page or an error', !/\/login/.test(page.url()) && heading.test(text) && !/Something went wrong|Unexpected Application Error/i.test(text), `${page.url()} ${text.slice(0, 80)}`);
        ok(`ready within ${SCREEN_MS} ms`, ms < SCREEN_MS, `${ms} ms`);
        ok('no script error', errors.length === 0, errors.slice(0, 2).join(' | '));
        ok('no request failed on the server', failed.length === 0, failed.slice(0, 3).join(', '));
        ok('it does not draw every row', rows < 600 && nodes < 25000, `${rows} rows, ${nodes} elements`);
      } finally { await context.close().catch(() => {}); }
    });
  }
  if (browser) await browser.close().catch(() => {});

  // ── deployment facts ───────────────────────────────────────────────────────────────────────
  await S(G, 'Every server copy runs the same build and says which', { expect: 'the health check of each copy names the same commit', rec: 'a mixed deployment is visible from outside' }, async (ok) => {
    const st = await c.cluster.state();
    if (!ok('the multi-copy front door is running', Boolean(st), 'qa/tools/qa-cluster.mjs')) return;
    const hs = await Promise.all(st.workers.map((w) => http1('GET', `http://127.0.0.1:${w.port}/api/health`)));
    ok('every copy answers its health check', hs.every((h) => h.status === 200), statuses(hs));
    const builds = new Set(hs.map((h) => String(h.body.commit ?? h.body.version ?? h.body.build ?? '')));
    ok('they name one build', builds.size === 1, [...builds].join(' | ') || JSON.stringify(Object.keys(hs[0].body)));
  });

  await S(G, 'Database update 18 is recorded, repeatable and matches the schema', { expect: 'the QA database records the update; the SQL Editor file exists for it; the table has the columns the code uses', db: 'RateWindow (key, windowStart, count)', rec: 'the owner applies the same file on the live database' }, async (ok) => {
    const row = await prisma.$queryRawUnsafe('SELECT migration_name, finished_at FROM _prisma_migrations WHERE migration_name = $1', '20261118150000_shared_rate_limits');
    ok('recorded as applied', row.length === 1 && !!row[0].finished_at, JSON.stringify(row));
    const file = path.join(root, 'src/backend/prisma/upgrades/sql-editor/20261118150000_shared_rate_limits.sql');
    ok('the SQL Editor file exists and skips itself when already applied', fs.existsSync(file) && /already applied/.test(fs.readFileSync(file, 'utf8')));
    const cols = (await prisma.$queryRawUnsafe('SELECT column_name FROM information_schema.columns WHERE table_name = \'RateWindow\' ORDER BY 1')).map((x) => x.column_name).join(',');
    ok('the table has its three columns', cols === 'count,key,windowStart', cols);
    const again = await prisma.$queryRawUnsafe('SELECT count(*)::int AS n FROM _prisma_migrations WHERE migration_name LIKE \'%shared_rate_limits\'');
    ok('recorded once', again[0].n === 1);
  });

  await S(G, 'The build does not touch the database and the frontend holds no TypeScript', { expect: 'the host build runs no migration; there is no .ts or .tsx source in the frontend', rec: 'a deployment cannot change the live database; the owner applies updates himself' }, async (ok) => {
    const vercel = fs.existsSync(path.join(root, 'vercel.json')) ? fs.readFileSync(path.join(root, 'vercel.json'), 'utf8') : '';
    const build = fs.existsSync(path.join(root, 'scripts/build.cjs')) ? fs.readFileSync(path.join(root, 'scripts/build.cjs'), 'utf8') : '';
    ok('no migration in the host build', !/migrate (deploy|dev)|db push/.test(vercel + build));
    const ts = execFileSync('bash', ['-c', `find ${path.join(root, 'src/frontend/src')} -name '*.ts' -o -name '*.tsx' | grep -v '\\.d\\.ts$' | wc -l`], { encoding: 'utf8' }).trim();
    ok('no TypeScript source in the frontend', ts === '0', ts);
  });
}
