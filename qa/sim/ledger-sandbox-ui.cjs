#!/usr/bin/env node
// The finance ledger sandbox seen in a real browser against the QA server and the QA database.
// Run after qa/sim/ledger-sandbox.mjs, which leaves the QA books running as sandbox books.
//   node qa/sim/ledger-sandbox-ui.cjs --app http://localhost:5199 --api http://localhost:3001
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const APP = arg('app', 'http://localhost:5199');
const API = arg('api', 'http://localhost:3001');
const OUT = arg('out', 'qa/results/ledger-sandbox-ui.json');
const PASSWORD = 'qa-password-1';
const SHOTS = arg('shots', ''); // a folder for screenshots, when one is wanted

(async () => {
  process.argv.push('--base', API);
  const lib = await import('./phase4-lib.mjs');
  const { prisma } = lib;
  const w = await lib.world();
  const bcrypt = (await import(path.resolve('src/backend/node_modules/bcryptjs/index.js')).catch(() => import(path.resolve('src/backend/node_modules/bcrypt/bcrypt.js')))).default;
  const run = Date.now().toString(36);
  const hash = await bcrypt.hash(PASSWORD, 10);
  const person = async (role, label) => {
    const email = `qa-sbxui-${label}-${run}@qa.test`;
    await prisma.user.create({ data: { email, passwordHash: hash, firstName: 'QA', lastName: `Sandbox ${label}`, role, organizationId: w.users.admin.organizationId, homeLocationId: w.L1.id } });
    const r = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: PASSWORD }) }).then((x) => x.json());
    if (!r.token) throw new Error(`sign-in failed for ${label}`);
    return r;
  };
  const P = { cfo: await person('CFO', 'cfo'), admin: await person('ADMIN', 'admin') };
  const api = async (who, url) => { const r = await fetch(API + url, { headers: { authorization: `Bearer ${who.token}` } }); return { status: r.status, body: await r.json().catch(() => null) }; };

  const status = await api(P.cfo, '/api/ledger/status');
  if (!status.body || !status.body.active || !status.body.sandbox) { console.error('The QA books are not running as sandbox books. Run qa/sim/ledger-sandbox.mjs first.'); process.exit(2); }

  const browser = await chromium.launch();
  const open = async (who, viewport = { width: 1366, height: 900 }) => {
    const context = await browser.newContext({ viewport });
    await context.addInitScript(([t, u]) => { localStorage.setItem('token', t); if (u) localStorage.setItem('user', JSON.stringify(u)); }, [who.token, who.user]);
    const page = await context.newPage(); page.setDefaultTimeout(12000); page.errors = []; page.failed = [];
    page.on('pageerror', (e) => page.errors.push(e.message));
    page.on('response', (r) => { if (/\/api\/ledger/.test(r.url()) && r.status() >= 500) page.failed.push(`${r.status()} ${r.url()}`); });
    await page.goto(`${APP}/finance`, { waitUntil: 'domcontentloaded' });
    await page.locator('main h1, h1').first().waitFor({ timeout: 20000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    return page;
  };
  const tab = async (page, name) => { await page.getByRole('tab', { name, exact: true }).click(); await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {}); await page.waitForTimeout(300); };
  const pick = async (page, label) => { await page.getByRole('combobox', { name: 'Report' }).click(); await page.getByRole('option', { name: label, exact: true }).click(); await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {}); await page.waitForTimeout(400); };
  const flat = (s) => String(s).replace(/[^0-9.-]/g, '');

  const results = []; let n = 0;
  const sc = async (name, fn) => {
    n += 1; const checks = []; let crashed = '';
    const t = { check: (what, ok, detail = '') => { checks.push({ what, ok: Boolean(ok), detail: ok ? '' : String(detail).replace(/\s+/g, ' ').slice(0, 260) }); return Boolean(ok); } };
    try { await fn(t); } catch (e) { crashed = String((e && e.message) || e).split('\n')[0].slice(0, 220); }
    const failed = checks.filter((c) => !c.ok);
    const st = crashed || failed.length || !checks.length ? 'FAIL' : 'PASS';
    results.push({ id: n, name, status: st, checks, crashed });
    console.log(`${st === 'PASS' ? '✓' : '✗'} ${String(n).padStart(2)} ${name}${st === 'FAIL' ? `  — ${crashed || `${failed[0].what}: ${failed[0].detail}`}` : ''}`);
  };

  await sc('The Finance screen says on every tab that these are sandbox books', async (t) => {
    const f = await open(P.cfo);
    const banner = f.getByTestId('ledger-sandbox-banner');
    t.check('the banner shows on the overview', await banner.isVisible().catch(() => false));
    t.check('it says sandbox and that no accountant approved the books', /sandbox/i.test(await banner.innerText()) && /accountant/i.test(await banner.innerText()), await banner.innerText().catch(() => ''));
    await tab(f, 'Reports');
    t.check('the banner still shows on the Reports tab', await banner.isVisible().catch(() => false));
    t.check('no page error and no server error', !f.errors.length && !f.failed.length, [...f.errors, ...f.failed].join(' | '));
    if (SHOTS) await f.screenshot({ path: path.join(SHOTS, 'ledger-sandbox-banner.png') });
  });

  await sc('The income statement on screen matches the server and carries the sandbox notice', async (t) => {
    const d = (await api(P.cfo, '/api/ledger/reports/income-statement')).body;
    const f = await open(P.cfo); await tab(f, 'Reports'); await pick(f, 'Income statement');
    const st = f.getByTestId('financial-statement');
    t.check('the statement shows', await st.isVisible().catch(() => false));
    t.check('the sandbox notice shows above it', await f.getByTestId('statement-sandbox-notice').isVisible().catch(() => false));
    const text = await st.innerText();
    for (const h of ['Total revenue', 'Gross profit', 'Operating income', 'Net income']) t.check(`it has the line "${h}"`, new RegExp(h, 'i').test(text), text.slice(0, 200));
    t.check('net income on screen is the server figure', flat(text).includes(flat(Number(d.summary.netIncome).toFixed(2))), `${d.summary.netIncome}`);
    t.check('the server says the sections add up to the accounts', d.agreesWithAccounts === true);
    t.check('no page error and no server error', !f.errors.length && !f.failed.length, [...f.errors, ...f.failed].join(' | '));
    if (SHOTS) await f.screenshot({ path: path.join(SHOTS, 'ledger-sandbox-income-statement.png'), fullPage: true });
  });

  await sc('The balance sheet on screen balances and matches the server', async (t) => {
    const d = (await api(P.cfo, '/api/ledger/reports/balance-sheet')).body;
    const f = await open(P.cfo); await tab(f, 'Reports'); await pick(f, 'Balance sheet');
    const st = f.getByTestId('financial-statement');
    t.check('the statement shows', await st.isVisible().catch(() => false));
    const text = await st.innerText();
    for (const h of ['Total assets', 'Total liabilities', 'Total equity']) t.check(`it has the line "${h}"`, new RegExp(h, 'i').test(text), text.slice(0, 200));
    t.check('the server says it balances', d.balanced === true && Number(d.difference) === 0, d.difference);
    t.check('total assets on screen is the server figure', flat(text).includes(flat(Number(d.totals.assets).toFixed(2))), `${d.totals.assets}`);
    t.check('the screen says assets equal liabilities and equity', /equal liabilities and equity/i.test(await f.locator('main').innerText()));
    t.check('no page error and no server error', !f.errors.length && !f.failed.length, [...f.errors, ...f.failed].join(' | '));
    if (SHOTS) await f.screenshot({ path: path.join(SHOTS, 'ledger-sandbox-balance-sheet.png'), fullPage: true });
  });

  await sc('An administrator who may not start books is not offered the sandbox start', async (t) => {
    const s = (await api(P.admin, '/api/ledger/status')).body;
    t.check('the server says an administrator may not start or stop the books', s.can && s.can.activate === false, JSON.stringify(s.can));
    const f = await open(P.admin); await tab(f, 'Start and stop');
    t.check('the banner shows for the administrator too', await f.getByTestId('ledger-sandbox-banner').isVisible().catch(() => false));
    t.check('there is no sandbox start panel', (await f.getByTestId('sandbox-start').count()) === 0);
    t.check('there is no button to start sandbox books', (await f.getByRole('button', { name: 'Start sandbox books', exact: true }).count()) === 0);
  });

  await sc('On a phone the statement has no sideways scroll of the page', async (t) => {
    const f = await open(P.cfo, { width: 390, height: 844 }); await tab(f, 'Reports'); await pick(f, 'Balance sheet');
    const wide = await f.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    t.check('the page is no wider than the screen', wide <= 2, wide);
    t.check('the statement shows', await f.getByTestId('financial-statement').isVisible().catch(() => false));
  });

  await browser.close();
  const passed = results.filter((r) => r.status === 'PASS').length; const checks = results.reduce((s, r) => s + r.checks.length, 0);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ ranAt: new Date().toISOString(), app: APP, api: API, passed, total: results.length, checks, results }, null, 2));
  console.log(`${passed === results.length ? '✓' : '✗'} Finance ledger sandbox UI: ${passed} of ${results.length} pass, ${checks} checks`);
  await prisma.$disconnect();
  process.exit(passed === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
