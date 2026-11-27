#!/usr/bin/env node
// Starting the sandbox books from the Finance screen in a real browser, on a QA ledger that was never started.
// It resets the QA ledger first, so run it before qa/sim/ledger-sandbox.mjs or accept that the books restart.
//   node qa/sim/ledger-sandbox-start-ui.cjs --app http://localhost:5199 --api http://localhost:3001
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const APP = arg('app', 'http://localhost:5199');
const API = arg('api', 'http://localhost:3001');
const OUT = arg('out', 'qa/results/ledger-sandbox-start-ui.json');
const PASSWORD = 'qa-password-1';

(async () => {
  process.argv.push('--base', API);
  const lib = await import('./phase4-lib.mjs');
  const { prisma } = lib;
  const w = await lib.world();
  const url = process.env.DATABASE_URL || '';
  if (!/(localhost|127\.0\.0\.1).*qa/.test(url)) throw new Error('Refusing: not a local QA database');
  await prisma.$transaction([
    prisma.$executeRawUnsafe('SET LOCAL session_replication_role = replica'),
    prisma.$executeRawUnsafe('TRUNCATE "LedgerExportItem", "LedgerExportBatch", "LedgerExternalAccount", "LedgerReconciliation", "LedgerEvent", "JournalLine", "JournalEntry", "LedgerPeriod", "LedgerMapping", "LedgerAccount" CASCADE'),
    prisma.$executeRawUnsafe('DELETE FROM "AppSetting" WHERE "key" = \'ledger.activation\''),
    prisma.$executeRawUnsafe('ALTER SEQUENCE "JournalEntry_number_seq" RESTART WITH 1'),
  ]);
  const bcrypt = (await import(path.resolve('src/backend/node_modules/bcryptjs/index.js')).catch(() => import(path.resolve('src/backend/node_modules/bcrypt/bcrypt.js')))).default;
  const run = Date.now().toString(36);
  const email = `qa-sbxstart-${run}@qa.test`;
  await prisma.user.create({ data: { email, passwordHash: await bcrypt.hash(PASSWORD, 10), firstName: 'QA', lastName: 'Sandbox starter', role: 'SUPER_ADMIN', organizationId: w.users.admin.organizationId, homeLocationId: w.L1.id } });
  const who = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: PASSWORD }) }).then((x) => x.json());
  if (!who.token) throw new Error('sign-in failed');
  const api = async (u) => { const r = await fetch(API + u, { headers: { authorization: `Bearer ${who.token}` } }); return { status: r.status, body: await r.json().catch(() => null) }; };

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  await context.addInitScript(([t, u]) => { localStorage.setItem('token', t); if (u) localStorage.setItem('user', JSON.stringify(u)); }, [who.token, who.user]);
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  const errors = []; const answers = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && /Minified React error|Objects are not valid/.test(m.text())) errors.push(m.text()); });
  page.on('response', async (r) => { if (/\/api\/ledger\/sandbox\/start/.test(r.url())) answers.push({ status: r.status(), body: await r.text().catch(() => '') }); });

  const checks = []; const check = (what, ok, detail = '') => { checks.push({ what, ok: Boolean(ok), detail: ok ? '' : String(detail).replace(/\s+/g, ' ').slice(0, 400) }); console.log(`${ok ? '✓' : '✗'} ${what}${ok ? '' : `  — ${String(detail).slice(0, 300)}`}`); };
  let crashed = '';
  try {
    await page.goto(`${APP}/finance`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('tab', { name: 'Start and stop', exact: true }).click();
    const panel = page.getByTestId('sandbox-start');
    await panel.waitFor();
    check('the sandbox start panel shows before the books are started', await panel.isVisible());
    // 1. The hosting platform cuts the request off and answers with an object, as it did on the live
    //    site (finding AB-001). The screen must say so in a sentence and stay up.
    const cutOff = async (route) => route.fulfill({ status: 504, contentType: 'application/json', body: JSON.stringify({ error: { code: '504', message: 'An error occurred with your deployment' } }) });
    await page.route('**/api/ledger/sandbox/start', cutOff);
    await panel.getByRole('button', { name: 'Start sandbox books', exact: true }).click();
    await page.getByRole('dialog').getByLabel(/Type START SANDBOX BOOKS/).fill('START SANDBOX BOOKS');
    await page.getByRole('dialog').getByRole('button', { name: 'Start sandbox books', exact: true }).click();
    const told = await page.getByText(/took too long and cut this off/).first().waitFor({ timeout: 10000 }).then(() => true).catch(() => false);
    check('a request the platform cut off is reported in a sentence', told, errors.join(' | '));
    check('the page did not break on the cut-off answer', errors.length === 0 && await page.locator('h1').first().innerText().then((t) => t === 'Finance').catch(() => false), errors.join(' | '));
    check('the books are still not started after the cut-off', (await api('/api/ledger/status')).body.effectiveDate === null);
    await page.unroute('**/api/ledger/sandbox/start', cutOff);
    answers.length = 0;

    // 2. The real start. The phrase is typed in lower case: the screen sends it in capitals.
    await panel.getByRole('button', { name: 'Start sandbox books', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/Type START SANDBOX BOOKS/).fill('start sandbox books');
    check('the time zone is filled in already', (await dialog.getByLabel(/Time zone/).inputValue()).length >= 3, await dialog.getByLabel(/Time zone/).inputValue());
    await dialog.getByRole('button', { name: 'Start sandbox books', exact: true }).click();
    await page.waitForResponse((r) => /\/api\/ledger\/sandbox\/start/.test(r.url()), { timeout: 120000 });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1500);
    check('the server started the books', answers[0] && answers[0].status === 200, answers[0] ? `${answers[0].status} ${answers[0].body}` : 'no answer');
    check('the page did not break', errors.length === 0, errors.join(' | '));
    check('the Finance heading is still on the page', await page.locator('h1').first().innerText().then((t) => t === 'Finance').catch(() => false));
    check('the sandbox banner shows', await page.getByTestId('ledger-sandbox-banner').isVisible().catch(() => false));
    const s = (await api('/api/ledger/status')).body;
    check('the status says the books run as sandbox books', s && s.active === true && s.sandbox === true, JSON.stringify(s).slice(0, 300));
    const bs = (await api('/api/ledger/reports/balance-sheet')).body;
    check('the balance sheet balances after the start', bs && bs.balanced === true, bs && bs.difference);
    for (const name of ['Overview', 'Trial balance', 'Reports', 'Journal', 'Not posted', 'Months', 'Accounts', 'Start and stop', 'Export']) {
      await page.getByRole('tab', { name, exact: true }).click(); await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {}); await page.waitForTimeout(400);
      check(`the "${name}" tab opens without breaking the page`, errors.length === 0 && await page.getByTestId('ledger-sandbox-banner').isVisible().catch(() => false), errors.join(' | '));
    }
  } catch (e) { crashed = String((e && e.message) || e).split('\n')[0]; console.log('crashed:', crashed, '| errors:', errors.join(' | ').slice(0, 600), '| answers:', JSON.stringify(answers).slice(0, 600)); }
  await browser.close();
  const failed = checks.filter((c) => !c.ok).length;
  const ok = !crashed && !failed && checks.length > 0;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ ranAt: new Date().toISOString(), app: APP, api: API, passed: ok ? 1 : 0, total: 1, checks: checks.length, results: [{ id: 1, name: 'Starting the sandbox books from the screen', status: ok ? 'PASS' : 'FAIL', checks, crashed }] }, null, 2));
  console.log(`${ok ? '✓' : '✗'} Finance ledger sandbox start UI: ${checks.length - failed} of ${checks.length} checks pass`);
  await prisma.$disconnect();
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
