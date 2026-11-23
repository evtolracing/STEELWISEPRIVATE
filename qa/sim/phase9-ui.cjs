#!/usr/bin/env node
// Phase 9: the screens driven like a person would, in a real browser, against the QA server and a
// database whose name contains "qa". A scenario is not passed because a page opens: each one does
// something or reads something and checks it against the server, the database or the browser.
//   node qa/sim/phase9-ui.cjs --app http://localhost:5199 --api http://localhost:3001 [--only 3,7] [--cat NAV] [--match "text in the name"]
// Categories: NAV navigation, layout and role access · FORM forms, dialogs, validation and actions ·
// SALES customers, sales, quoting and order intake · STOCK purchasing, inventory and warehouse ·
// MAKE manufacturing, scheduling and quality · SHIP shipping, billing and financial ·
// FIT responsive design and accessibility · FAIL error handling, concurrency and recovery.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const APP = arg('app', 'http://localhost:5199');
const API = arg('api', 'http://localhost:3001');
const OUT = arg('out', 'qa/results/phase9-ui.json');
const ONLY = (arg('only', '') || '').split(',').filter(Boolean);
const CAT = arg('cat', '');
const MATCH = arg('match', ''); // run only scenarios whose name holds this text
const PASSWORD = 'qa-password-1';

(async () => {
  process.argv.push('--base', API);
  const lib = await import('./phase4-lib.mjs');
  const { prisma } = lib;
  const w = await lib.world(); const B = lib.blocks(w);
  const bcrypt = (await import(path.resolve('src/backend/node_modules/bcryptjs/index.js')).catch(() => import(path.resolve('src/backend/node_modules/bcrypt/bcrypt.js')))).default;
  const run = Date.now().toString(36);
  const house = w.users.admin.organizationId;

  // ── people ─────────────────────────────────────────────────────────────────────
  const signIn = async (email) => { const r = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: PASSWORD }) }).then((x) => x.json()); if (!r.token) throw new Error(`login failed for ${email}`); return { ...r, email }; };
  const hash = await bcrypt.hash(PASSWORD, 10);
  const person = async (role, loc, label) => {
    const email = `qa-p9-${label}-${run}@qa.test`;
    await prisma.user.create({ data: { email, passwordHash: hash, firstName: 'QA', lastName: `P9 ${label}`, role, organizationId: house, homeLocationId: loc ? loc.id : null } });
    return signIn(email);
  };
  const boss = await signIn('qa-admin@qa.test');
  const clerk = await signIn('qa-csr@qa.test');
  const dock = await signIn('qa-shipping@qa.test');
  const shopper = await signIn('qa-cust-a@qa.test');
  const P = {
    rep: await person('SALES_REP', w.L1, 'rep'), operator: await person('OPERATOR_SAW', w.L1, 'operator'), planner: await person('PRODUCTION_MANAGER', w.L1, 'planner'),
    receiver: await person('RECEIVING_CLERK', w.L1, 'receiver'), shipper: await person('SHIPPING_COORDINATOR', w.L1, 'shipper'), stock: await person('INVENTORY_MANAGER', w.L1, 'stock'),
    inspector: await person('QC_INSPECTOR', w.L1, 'inspector'), auditor: await person('AUDITOR', w.L1, 'auditor'), credit: await person('CREDIT_MANAGER', w.L1, 'credit'),
    upkeep: await person('MAINTENANCE_MANAGER', w.L1, 'upkeep'), analyst: await person('DATA_ANALYST', w.L1, 'analyst'), cfo: await person('CFO', w.L1, 'cfo'),
    manager: await person('BRANCH_MANAGER', w.L1, 'manager'), manager2: await person('BRANCH_MANAGER', w.L2, 'manager2'), clerk2: await person('CSR', w.L2, 'clerk2'), scheduler: await person('SCHEDULER', w.L1, 'scheduler'), buyer: await person('BUYER', w.L1, 'buyer'),
  };
  const api = async (who, method, url, body) => { const r = await fetch(API + url, { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${who.token}` }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, body: await r.json().catch(() => null) }; };
  const rowsOf = (d) => (Array.isArray(d) ? d : d?.data || d?.items || d?.rows || d?.results || []);

  // ── browser ────────────────────────────────────────────────────────────────────
  const browser = await chromium.launch();
  const SIZES = { desktop: { width: 1366, height: 900 }, wide: { width: 1920, height: 1080 }, laptop: { width: 1280, height: 720 }, tablet: { width: 768, height: 1024 }, phone: { width: 390, height: 844 }, small: { width: 320, height: 640 } };
  const contexts = [];
  const ctx = async (who, size = 'desktop', extra = {}) => {
    const context = await browser.newContext({ viewport: SIZES[size] || size, ...extra });
    if (who) await context.addInitScript(([t, u]) => { if (!sessionStorage.getItem('p9-signed-out')) { localStorage.setItem('token', t); if (u) localStorage.setItem('user', JSON.stringify(u)); } }, [who.token, who.user]);
    contexts.push(context);
    return context;
  };
  const open = async (context, url, { wait = 'main h1' } = {}) => {
    const page = await context.newPage(); page.setDefaultTimeout(12000); page.errors = []; page.writes = [];
    page.on('pageerror', (e) => page.errors.push(e.message));
    page.answers = [];
    page.on('response', (r) => { const q = r.request(); const u = r.url(); if (!/\/api\//.test(u) || /\/src\//.test(u)) return; if (q.method() !== 'GET' && q.method() !== 'OPTIONS') page.writes.push({ method: q.method(), url: u.replace(/^.*\/api/, ''), status: r.status(), ...(r.headers()['idempotency-replayed'] === 'true' && { replayed: true }) }); else if (q.method() === 'GET' && r.status() === 200) r.json().then((json) => page.answers.push({ url: u.replace(/^.*\/api/, ''), json })).catch(() => {}); });
    await page.goto(APP + url, { waitUntil: 'domcontentloaded' });
    if (wait) await page.locator(wait).first().waitFor({ timeout: 20000 }).catch(() => {});
    return page;
  };
  const text = (page, sel = 'body') => page.locator(sel).first().innerText({ timeout: 5000 }).catch(() => '');
  const has = (page, pattern, timeout = 10000) => page.getByText(pattern).first().waitFor({ timeout }).then(() => true).catch(() => false);
  const gone = (loc, timeout = 6000) => loc.first().waitFor({ state: 'hidden', timeout }).then(() => true).catch(() => false);
  const shown = (loc, timeout = 10000) => loc.first().waitFor({ timeout }).then(() => true).catch(() => false);
  const pathOf = (page) => new URL(page.url()).pathname;
  const settle = (page, ms = 600) => page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {}).then(() => page.waitForTimeout(ms));
  const until = async (fn, ms = 8000) => { const end = Date.now() + ms; for (;;) { const v = await fn(); if (v || Date.now() > end) return v; await new Promise((r) => setTimeout(r, 150)); } };
  /** The answer the screen itself received from a list route, so what is shown can be compared with it. */
  const openWithAnswer = async (context, url, pattern, opts) => {
    const page = await context.newPage(); page.setDefaultTimeout(12000); page.errors = []; page.writes = [];
    page.on('pageerror', (e) => page.errors.push(e.message));
    const got = page.waitForResponse((r) => r.request().method() === 'GET' && pattern.test(r.url().replace(/^.*\/api/, '')) && r.status() === 200, { timeout: 20000 }).then((r) => r.json()).catch(() => null);
    await page.goto(APP + url, { waitUntil: 'domcontentloaded' });
    const answer = await got; await page.locator((opts && opts.wait) || 'main h1').first().waitFor({ timeout: 15000 }).catch(() => {}); await settle(page, 300);
    return { page, answer, rows: rowsOf(answer) };
  };

  // ── scenarios ──────────────────────────────────────────────────────────────────
  const results = []; let n = 0;
  const sc = async (cat, name, fn) => {
    n += 1; const id = n;
    if (ONLY.length && !ONLY.includes(String(id))) return;
    if (CAT && CAT !== cat) return;
    if (MATCH && !name.includes(MATCH)) return;
    const checks = []; const started = Date.now();
    const t = { check: (what, ok, detail = '') => { checks.push({ what, ok: Boolean(ok), detail: ok ? '' : String(detail).replace(/\s+/g, ' ').slice(0, 260) }); return Boolean(ok); }, na: (why) => { t.notApplicable = why; } };
    const before = contexts.length; let crashed = '';
    try { await fn(t); } catch (e) { crashed = String(e && e.message || e).split('\n')[0].slice(0, 260); }
    for (const c of contexts.splice(before)) await c.close().catch(() => {});
    const failed = checks.filter((c) => !c.ok);
    const status = t.notApplicable ? 'NOT APPLICABLE' : crashed || failed.length || !checks.length ? 'FAIL' : 'PASS';
    results.push({ id, cat, name, status, checks, crashed, why: t.notApplicable || '', ms: Date.now() - started });
    console.log(`${status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '–'} ${String(id).padStart(3)} ${cat.padEnd(5)} ${name}${status === 'FAIL' ? `  — ${crashed || (failed[0] ? `${failed[0].what}: ${failed[0].detail}` : 'no checks ran')}` : ''}`);
  };
  const scenarios = { sc, P, boss, clerk, dock, shopper, api, rowsOf, ctx, open, openWithAnswer, text, has, gone, shown, pathOf, settle, until, prisma, w, B, lib, APP, API, PASSWORD, SIZES, run, signIn, browser };

  for (const part of ['nav', 'form', 'sales', 'stock', 'make', 'ship', 'fit', 'fail']) {
    const file = path.join(__dirname, 'phase9', `${part}.cjs`);
    if (fs.existsSync(file)) await require(file)(scenarios);
  }

  await browser.close();
  const byCat = {}; for (const r of results) { byCat[r.cat] = byCat[r.cat] || { pass: 0, fail: 0, na: 0 }; byCat[r.cat][r.status === 'PASS' ? 'pass' : r.status === 'FAIL' ? 'fail' : 'na'] += 1; }
  const tally = { scenarios: results.length, passed: results.filter((r) => r.status === 'PASS').length, failed: results.filter((r) => r.status === 'FAIL').length, notApplicable: results.filter((r) => r.status === 'NOT APPLICABLE').length, checks: results.reduce((s, r) => s + r.checks.length, 0) };
  if (!ONLY.length && !CAT && !MATCH) fs.writeFileSync(OUT, JSON.stringify({ at: new Date().toISOString(), app: APP, api: API, tally, byCat, results }, null, 1));
  console.log(`\nPhase 9 UI scenarios: ${tally.passed} of ${tally.scenarios} passed, ${tally.failed} failed, ${tally.notApplicable} not applicable, ${tally.checks} checks`);
  console.log(JSON.stringify(byCat));
  await prisma.$disconnect();
  process.exit(tally.failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
