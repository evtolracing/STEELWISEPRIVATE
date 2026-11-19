#!/usr/bin/env node
// Phase 12: the corrections a person can see, driven in a real browser against the QA server and database.
//   AA-006  the manual says which chapters are design samples, and has the chapters real screens lacked
//   AA-002  the executive cockpit's question box gives no invented answer
//   M-009   when time records cannot be loaded the screen says so and shows no hours
//   node qa/sim/phase12-ui.cjs --app http://localhost:5199 --api http://localhost:3001
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const APP = arg('app', 'http://localhost:5199');
const API = arg('api', 'http://localhost:3001');
const OUT = arg('out', 'qa/results/phase12-ui.json');
const PASSWORD = 'qa-password-1';

(async () => {
  process.argv.push('--base', API);
  const lib = await import('./phase4-lib.mjs');
  const { prisma } = lib;
  const w = await lib.world();
  const manual = (await import(path.resolve('src/frontend/src/help/manualContent.js'))).default;
  const bcrypt = (await import(path.resolve('src/backend/node_modules/bcryptjs/index.js')).catch(() => import(path.resolve('src/backend/node_modules/bcrypt/bcrypt.js')))).default;
  const run = Date.now().toString(36);
  const hash = await bcrypt.hash(PASSWORD, 10);
  const person = async (role, label) => {
    const email = `qa-p12ui-${label}-${run}@qa.test`;
    await prisma.user.create({ data: { email, passwordHash: hash, firstName: 'QA', lastName: `Phase12 ${label}`, role, organizationId: w.users.admin.organizationId, homeLocationId: w.L1.id } });
    const r = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: PASSWORD }) }).then((x) => x.json());
    if (!r.token) throw new Error(`sign-in failed for ${label}`);
    return r;
  };
  const admin = await person('ADMIN', 'admin'); const coo = await person('COO', 'coo'); const manager = await person('PRODUCTION_MANAGER', 'pm');

  const browser = await chromium.launch();
  const contexts = [];
  const open = async (who, url, route) => {
    const context = await browser.newContext({ viewport: { width: 1366, height: 900 } }); contexts.push(context);
    await context.addInitScript(([t, u]) => { localStorage.setItem('token', t); if (u) localStorage.setItem('user', JSON.stringify(u)); }, [who.token, who.user]);
    const page = await context.newPage(); page.setDefaultTimeout(12000); page.errors = [];
    page.on('pageerror', (e) => page.errors.push(e.message));
    if (route) await route(page);
    await page.goto(APP + url, { waitUntil: 'domcontentloaded' });
    await page.locator('main h1, h1, main h4, main h5').first().waitFor({ timeout: 20000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    return page;
  };
  const results = []; let n = 0;
  const sc = async (name, fn) => {
    n += 1; const checks = []; let crashed = ''; const before = contexts.length; const started = Date.now();
    const t = { check: (what, ok, detail = '') => { checks.push({ what, ok: Boolean(ok), detail: ok ? '' : String(detail).replace(/\s+/g, ' ').slice(0, 260) }); return Boolean(ok); } };
    try { await fn(t); } catch (e) { crashed = `${String((e && e.message) || e).split('\n')[0].slice(0, 220)} ${(String(e && e.stack).match(/phase12-ui\.cjs:\d+/) || [''])[0]}`; }
    for (const c of contexts.splice(before)) await c.close().catch(() => {});
    const failed = checks.filter((c) => !c.ok);
    const st = crashed || failed.length || !checks.length ? 'FAIL' : 'PASS';
    results.push({ id: n, name, status: st, checks, crashed, ms: Date.now() - started });
    console.log(`${st === 'PASS' ? '✓' : '✗'} ${String(n).padStart(2)} ${name}${st === 'FAIL' ? `  — ${crashed || `${failed[0].what}: ${failed[0].detail}`}` : ''}`);
  };
  const title = (id) => manual.find((m) => m.moduleId === id).title;
  // Opens one chapter of the manual by its title and returns the chapter's panel.
  const chapter = async (page, id) => {
    const acc = page.locator('main .MuiAccordion-root').filter({ has: page.locator('.MuiAccordionSummary-root').filter({ has: page.getByText(title(id), { exact: true }) }) }).first();
    const head = acc.locator('.MuiAccordionSummary-root').first();
    await head.scrollIntoViewIfNeeded(); await head.click(); await page.waitForTimeout(400);
    return acc;
  };

  await sc('The manual says a sample chapter is a sample before anything else', async (t) => {
    const page = await open(admin, '/help/manual');
    const panel = await chapter(page, 'safety-ehs');
    const notice = panel.getByTestId('manual-sample-notice');
    t.check('the chapter on safety opens with a notice', await notice.waitFor({ timeout: 8000 }).then(() => true).catch(() => false));
    t.check('the notice says the screens are design samples and nothing is saved', /design samples/.test(await notice.innerText().catch(() => '')) && /nothing you enter is saved/.test(await notice.innerText().catch(() => '')), await notice.innerText().catch(() => ''));
    t.check('no page error', page.errors.length === 0, page.errors.join(' | '));
  });

  await sc('A chapter with some sample screens names them, and a chapter of real screens has no notice', async (t) => {
    const page = await open(admin, '/help/manual');
    const exec = await chapter(page, 'executive');
    const text = await exec.getByTestId('manual-sample-notice').innerText().catch(() => '');
    t.check('the executive chapter names its sample screens', /\/executive\/cockpit/.test(text) && /\/executive\/forecast/.test(text), text);
    const ship = await chapter(page, 'finance-ledger');
    t.check('the finance chapter has no sample notice', (await ship.getByTestId('manual-sample-notice').count()) === 0);
  });

  await sc('The manual has the chapters the real screens lacked, and they open', async (t) => {
    const page = await open(admin, '/help/manual');
    for (const id of ['finance-ledger', 'purchasing', 'transfers', 'work-orders', 'invoices-returns', 'when-something-goes-wrong']) {
      t.check(`"${title(id)}" is listed`, await page.getByText(title(id), { exact: true }).first().waitFor({ timeout: 8000 }).then(() => true).catch(() => false));
    }
    const panel = await chapter(page, 'purchasing');
    t.check('the purchasing chapter says an over-receipt is received on hold', await panel.getByText(/received on hold/).first().waitFor({ state: 'attached', timeout: 8000 }).then(() => true).catch(() => false));
    t.check('no page error', page.errors.length === 0, page.errors.join(' | '));
  });

  await sc('The executive cockpit question box gives no invented answer', async (t) => {
    const page = await open(coo, '/executive/cockpit');
    await page.getByRole('button', { name: /Ask AI Assistant/ }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').first().fill('Why is Detroit over capacity?');
    await dialog.getByRole('button', { name: 'Ask', exact: true }).click();
    await page.waitForTimeout(2600);   // the old dialog answered after two seconds
    const text = await dialog.innerText();
    t.check('it says the box is not built', /not built/.test(text), text);
    t.check('it gives no percentage, no money and no "confidence"', !/\d+\s?%|\$\s?\d|Confidence|Root cause|Detroit is at/i.test(text.replace('Why is Detroit over capacity?', '')), text);
    t.check('it points to the assistant in the top bar', /assistant in the top bar/.test(text), text);
  });

  await sc('When time records cannot be loaded the screen says so and shows no hours', async (t) => {
    const page = await open(manager, '/time-tracking', (p) => p.route(/\/api\/(v1\/)?(dispatch|time|operations|work-centers|locations)[^?]*/, (r) => (r.request().method() === 'GET' ? r.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'QA: forced failure' }) }) : r.continue())));
    t.check('it says the time records could not be loaded', await page.getByText(/Time records could not be loaded, so nothing is shown/).first().waitFor({ timeout: 12000 }).then(() => true).catch(() => false), (await page.locator('main').innerText().catch(() => '')).slice(0, 200));
    const body = await page.locator('main').innerText().catch(() => '');
    t.check('no "demo data" and no hours are shown', !/demo data/i.test(body) && !/\b\d+(\.\d+)?\s?h(rs|ours)?\b/i.test(body.replace(/more than \d+ hours/g, '')), body.slice(0, 300));
  });

  await browser.close();
  const passed = results.filter((r) => r.status === 'PASS').length;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ ranAt: new Date().toISOString(), app: APP, api: API, passed, total: results.length, checks: results.reduce((s, r) => s + r.checks.length, 0), results }, null, 2));
  console.log(`${passed === results.length ? '✓' : '✗'} Phase 12 UI: ${passed} of ${results.length} pass, ${results.reduce((s, r) => s + r.checks.length, 0)} checks`);
  await prisma.$disconnect();
  process.exit(passed === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
