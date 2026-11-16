#!/usr/bin/env node
// Phase 5 screens in a real browser, against the QA server: the home page shows real figures
// (J-007), the old Order Hub address leads to the request inbox (S-021), order entry and Retail
// POS offer the person's own branches and tax at them (S-008, J-006), and the request and quote
// screens show the customer's requirements and the tax (J-001).
//   node qa/sim/ui-phase5.cjs --app http://localhost:5199 --api http://localhost:3001
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const APP = arg('app', 'http://localhost:5199');
const API = arg('api', 'http://localhost:3001');
const OUT = arg('out', 'qa/results/ui-phase5.json');
const run = Date.now().toString(36).toUpperCase();

(async () => {
  // A one-branch sales login (QA-L01, Ohio), so "own branches" is one branch.
  const login = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'qa-branch-a@qa.test', password: 'qa-password-1' }) }).then((r) => r.json());
  if (!login.token) throw new Error(`login failed: ${JSON.stringify(login)}`);
  const call = (method, url, body) => fetch(API + url, { method, headers: { authorization: `Bearer ${login.token}`, 'content-type': 'application/json' }, body: body && JSON.stringify(body) }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(([t, u]) => { localStorage.setItem('token', t); if (u) localStorage.setItem('user', JSON.stringify(u)); }, [login.token, login.user]);
  const checks = [];
  const check = (name, ok, detail = '') => { checks.push({ name, ok: Boolean(ok), detail: ok ? '' : String(detail).slice(0, 300) }); console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : ` — ${String(detail).slice(0, 300)}`}`); };
  const open = async (url) => { const page = await context.newPage(); page.errors = []; page.on('pageerror', (e) => page.errors.push(e.message)); await page.goto(APP + url, { waitUntil: 'domcontentloaded' }); await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {}); return page; };
  const body = (page) => page.locator('body').innerText();

  // Home page: the figures are the server's, and none of the old made-up rows are shown.
  {
    const page = await open('/');
    await page.getByText('Open Orders').first().waitFor({ timeout: 10000 }).catch(() => {});
    const stats = (await call('GET', '/api/dashboard')).body || {};
    const byStatus = stats.orders?.byStatus || {};
    const openCount = ['PENDING', 'CONFIRMED', 'PARTIAL', 'HOLD'].reduce((n, k) => n + (Number(byStatus[k]) || 0), 0);
    const card = await page.locator('*:has(> :text-is("Open Orders"))').first().innerText().catch(() => '');
    check('home: Open Orders is the server\'s count', card.replace(/,/g, '').includes(String(openCount)), `card "${card}" vs ${openCount}`);
    const text = await body(page);
    check('home: none of the old made-up orders or alerts', !/Acme Steel Co|SO-2024-001|Metal Supply Inc|Carrier reported 2hr delay|Grade A36 below minimum threshold/.test(text), text.slice(0, 300));
    check('home: no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.close();
  }
  // The retired Order Hub address takes the person to the request inbox.
  {
    const page = await open('/orderhub/quotes');
    await page.waitForURL(/\/sales\/rfq-inbox/, { timeout: 8000 }).catch(() => {});
    check('old Order Hub address: goes to the request inbox', /\/sales\/rfq-inbox/.test(page.url()), page.url());
    await page.close();
  }
  // Order entry: the branch list is the server's list for this login, and the home branch is chosen.
  {
    const page = await open('/orders/intake');
    const server = (await call('GET', '/api/orders/intake/branches')).body?.data || [];
    // The MUI select is found by its visible label (the field has no label link of its own).
    const select = page.locator('.MuiFormControl-root', { has: page.locator('label', { hasText: /^Location$/ }) }).locator('[role="combobox"]').first();
    await select.waitFor({ timeout: 10000 }).catch(() => {});
    const shown = await select.innerText().catch(() => '');
    check('order entry: the home branch is chosen to start', server.length === 1 && shown.includes(server[0].name), `"${shown}" vs ${JSON.stringify(server)}`);
    await select.click().catch(() => {});
    const options = await page.getByRole('option').allInnerTexts().catch(() => []);
    check('order entry: only this login\'s branches are offered', options.length === server.length && server.every((b) => options.some((o) => o.includes(b.name))), `${JSON.stringify(options)} vs ${server.map((b) => b.name)}`);
    check('order entry: no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.keyboard.press('Escape').catch(() => {});
    await page.close();
  }
  // Retail POS: the tax estimate is asked for the person's home branch, never the old fixed Jackson.
  {
    const page = await context.newPage(); page.errors = []; page.on('pageerror', (e) => page.errors.push(e.message));
    const asked = [];
    page.on('request', (r) => { if (r.url().includes('/tax-estimate') && r.method() === 'POST') asked.push(JSON.parse(r.postData() || '{}')); });
    await page.goto(`${APP}/pos/retail`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    const t0 = Date.now(); while (!asked.length && Date.now() - t0 < 8000) await page.waitForTimeout(200);
    check('Retail POS: tax is estimated at the home branch (QA-L01)', asked.length && asked.every((b) => b.location === 'QA-L01'), JSON.stringify(asked));
    check('Retail POS: no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.close();
  }
  // Request inbox: a new request offers the requirement fields; a quoted request shows them and the tax.
  {
    const customers = (await call('GET', '/api/customers?limit=5&search=QA Customer')).body;
    const customer = (customers?.data || customers || [])[0];
    const rfq = (await call('POST', '/api/rfqs', { customerId: customer.id, lines: [{ description: `QA UI P5 ${run}`, requestedQty: 2000, unit: 'LB', grade: 'A36', thicknessIn: 0.25, widthIn: 60, lengthIn: 120, certRequirements: ['MTR'], processing: 'Shear to size' }] })).body;
    const quote = (await call('POST', `/api/rfqs/${rfq.id}/quotes`, { lines: [{ rfqLineId: rfq.lines[0].id, unitPrice: 70, priceUnit: 'CWT' }] })).body;
    const page = await open('/sales/rfq-inbox');
    await page.getByRole('button', { name: 'New RFQ' }).click({ timeout: 10000 }).catch(() => {});
    check('new request: a needed-by date can be given', await page.getByLabel('Needed by (optional)').isVisible({ timeout: 5000 }).catch(() => false), await body(page));
    await page.getByRole('button', { name: 'Details' }).first().click({ timeout: 5000 }).catch(() => {});
    const fields = ['Grade', 'Thickness (in)', 'Width (in)', 'Length (in)', 'Finish', 'Certificates', 'Processing', 'Other requirements'];
    const seen = [];
    for (const f of fields) if (await page.getByLabel(f, { exact: true }).first().isVisible().catch(() => false)) seen.push(f);
    check('new request: each line has the requirement fields', seen.length === fields.length, `seen ${seen.join(', ')}`);
    await page.keyboard.press('Escape').catch(() => {});
    await page.close();
    const list = await open('/sales/rfq-inbox');
    // The list can redraw once while it loads; click again if the request did not open.
    for (let i = 0; i < 3; i++) {
      await list.locator('tr', { hasText: `QA UI P5 ${run}` }).first().click({ timeout: 10000 }).catch(() => {});
      if (await list.getByText('What they need').first().isVisible({ timeout: 4000 }).catch(() => false)) break;
      await list.waitForTimeout(1000);
    }
    await list.getByText(quote.quoteNumber).first().waitFor({ timeout: 10000 }).catch(() => {});
    const text = await body(list);
    check('request: its line shows the requirements', /0\.25/.test(text) && /60/.test(text) && /MTR/.test(text) && /Shear to size/.test(text), text.slice(-600));
    const usd = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    check('quote: shows subtotal + tax = total', text.includes('+ tax') && text.includes(usd(quote.taxAmount)) && text.includes(usd(quote.totalAmount)), `${quote.subtotal} ${quote.taxAmount} ${quote.totalAmount}: ${text.slice(0, 400)}`);
    check('request inbox: no script errors', list.errors.length === 0, list.errors.join(' | '));
    await list.close();
  }
  await browser.close();
  const failed = checks.filter((c) => !c.ok);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ app: APP, at: new Date().toISOString(), checks: checks.length, failed: failed.length, results: checks }, null, 1));
  console.log(`\n${checks.length} checks, ${failed.length} failed → ${OUT}`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
