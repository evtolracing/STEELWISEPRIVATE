#!/usr/bin/env node
// Sales screens driven like a person would, in a real browser, against the QA server.
// Covers the screens that used to run on made-up data (Phase 2 findings S-005, S-012).
//   node qa/sim/ui-sales.cjs --app http://localhost:5199 --api http://localhost:3001
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const APP = arg('app', 'http://localhost:5199');
const API = arg('api', 'http://localhost:3001');
const OUT = arg('out', 'qa/results/ui-sales.json');

(async () => {
  const login = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'qa-csr@qa.test', password: 'qa-password-1' }) }).then((r) => r.json());
  if (!login.token) throw new Error(`login failed: ${JSON.stringify(login)}`);
  const api = (url) => fetch(API + url, { headers: { authorization: `Bearer ${login.token}` } }).then((r) => r.json());
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 414, height: 896 } });
  await context.addInitScript(([t, u]) => { localStorage.setItem('token', t); if (u) localStorage.setItem('user', JSON.stringify(u)); }, [login.token, login.user]);
  const checks = [];
  const check = (name, ok, detail = '') => { checks.push({ name, ok: Boolean(ok), detail: ok ? '' : String(detail).slice(0, 300) }); console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : ` — ${String(detail).slice(0, 300)}`}`); };
  const open = async (url) => { const page = await context.newPage(); page.errors = []; page.on('pageerror', (e) => page.errors.push(e.message)); await page.goto(APP + url, { waitUntil: 'domcontentloaded' }); await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {}); return page; };
  const body = (page) => page.locator('body').innerText();

  // Mobile Rep: enter and submit an order for a real customer with real products.
  {
    const page = await open('/mobile-rep/intake');
    await page.getByLabel('Search Customer').fill('QA Customer 6');
    const hit = page.getByText('QA Customer 6', { exact: true }).first();
    await hit.waitFor({ timeout: 8000 }).catch(() => {});
    check('mobile rep: customer search finds a real customer', await hit.isVisible().catch(() => false), await body(page));
    await hit.click().catch(() => {});
    await page.getByRole('button', { name: 'Line Items' }).click({ timeout: 8000 }).catch(() => {});
    await page.getByLabel('Search Products').fill('plate');
    const chip = page.locator('.MuiChip-root', { hasText: '$' }).first();
    await chip.waitFor({ timeout: 8000 }).catch(() => {});
    const chipText = await chip.innerText().catch(() => '');
    check('mobile rep: product search lists real products with prices', /\$\d/.test(chipText), await body(page));
    const catalog = await api('/api/products/search?search=plate&division=METALS&limit=20');
    check('mobile rep: the products shown are catalog products', (catalog.data || []).some((p) => chipText.includes(p.name)), `${chipText} not in ${JSON.stringify((catalog.data || []).map((p) => p.name))}`);
    await chip.click().catch(() => {});
    await page.getByRole('button', { name: 'Review' }).click({ timeout: 8000 }).catch(() => {});
    const before = (await api('/api/orders/intake/summary')).data;
    await page.getByRole('button', { name: /submit order/i }).click({ timeout: 8000 }).catch(() => {});
    await page.getByText('Order Submitted!').waitFor({ timeout: 10000 }).catch(() => {});
    const text = await body(page);
    const number = (text.match(/SO-\d+/) || [])[0];
    check('mobile rep: the order is submitted and shows its real order number', /Order Submitted!/.test(text) && number, text);
    const after = (await api('/api/orders/intake/summary')).data;
    check('mobile rep: the order is saved under the person who entered it', after.ordersToday === before.ordersToday + 1, `my orders today ${before.ordersToday} → ${after.ordersToday}`);
    const saved = (await api('/api/orders/intake?status=SUBMITTED&limit=50')).data.find((o) => o.orderNumber === number);
    check('mobile rep: the saved order has the customer, a priced line and totals', saved && saved.customerName === 'QA Customer 6' && saved.lines.length === 1 && saved.lines[0].extPrice > 0 && saved.totalAmount >= saved.subtotal && saved.subtotal > 0, JSON.stringify(saved).slice(0, 300));
    check('mobile rep intake: no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.close();
  }
  // Mobile Rep: inventory lookup shows live stock.
  {
    const page = await open('/mobile-rep/inventory');
    await page.getByPlaceholder('Search material, grade, code...').fill('A36');
    await page.waitForTimeout(1500);
    const text = await body(page);
    const live = await api('/api/inventory/search?search=A36&limit=50');
    check('mobile rep: inventory lookup shows live stock', (live.data || []).length > 0 && (live.data || []).some((r) => text.includes(r.sku)) && !/H-2026-0142/.test(text), text.slice(0, 300));
    check('mobile rep inventory: no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.close();
  }
  // Mobile Rep: the orders list is the real list.
  {
    const page = await open('/mobile-rep/place-order');
    await page.waitForTimeout(800);
    const text = await body(page);
    check('mobile rep: order list shows real orders, not samples', /SO-\d+/.test(text) && !/ORD-2026-1001|Great Lakes Fabrication/.test(text), text.slice(0, 300));
    check('mobile rep orders: no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.close();
  }
  // Mobile Rep home and the Sales Dashboard show counted figures.
  {
    const page = await open('/mobile-rep');
    await page.waitForTimeout(800);
    const text = await body(page);
    const mine = (await api('/api/orders/intake/summary')).data;
    check('mobile rep home: shows the signed-in person\'s own order count', text.includes('My Orders Today') && new RegExp(`\\b${mine.ordersToday}\\b`).test(text) && !/284,500/.test(text), text.slice(0, 300));
    await page.close();
    const dash = await open('/sales/dashboard');
    await dash.getByText('Latest quotes').waitFor({ timeout: 8000 }).catch(() => {});
    const dtext = await body(dash);
    const data = await api('/api/sales-dashboard?range=week');
    check('sales dashboard: shows counted figures and says what is not available', dtext.includes('Latest quotes') && dtext.includes('Not available') && !/AutoMax Mfg|QUO-2026-002156/.test(dtext) && (data.recentQuotes.length === 0 || dtext.includes(data.recentQuotes[0].quoteNumber)), dtext.slice(0, 300));
    check('sales dashboard: no script errors', dash.errors.length === 0, dash.errors.join(' | '));
    await dash.close();

    // Pricing: the real price book, not sample rows (finding S-017).
    const pricing = await open('/pricing');
    await pricing.getByText('Price levels').waitFor({ timeout: 8000 }).catch(() => {});
    const book = await api('/api/pricing/price-list?limit=5');
    await pricing.getByText(book.data[0].sku, { exact: true }).first().waitFor({ timeout: 8000 }).catch(() => {});
    const ptext = await body(pricing);
    check('pricing: lists real products and price levels, not samples', ptext.includes('Price levels') && ptext.includes(book.data[0].sku) && ptext.includes('Retail') && !/Acme Steel Co|Q-2024-001|Small Order Fee/.test(ptext), ptext.slice(0, 200));
    check('pricing: a clerk is not offered a way to change a list price', await pricing.getByRole('button', { name: /Change the list price/ }).count() === 0, 'a Change button is shown');
    // The same screen as a manager.
    const boss = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'qa-admin@qa.test', password: 'qa-password-1' }) }).then((r) => r.json());
    const bossContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await bossContext.addInitScript(([t, u]) => { localStorage.setItem('token', t); if (u) localStorage.setItem('user', JSON.stringify(u)); }, [boss.token, boss.user]);
    const bossPage = await bossContext.newPage();
    await bossPage.goto(APP + '/pricing', { waitUntil: 'domcontentloaded' });
    const change = bossPage.getByRole('button', { name: `Change the list price of ${book.data[0].sku}` });
    await change.waitFor({ timeout: 10000 }).catch(() => {});
    await change.click({ timeout: 5000 }).catch(() => {});
    const dialogShown = await bossPage.getByText('Change list price').waitFor({ timeout: 5000 }).then(() => true).catch(() => false);
    check('pricing: a manager can open the change-price box', dialogShown, 'box did not open');
    await bossContext.close();
    check('pricing: no script errors', pricing.errors.length === 0, pricing.errors.join(' | '));
    await pricing.close();
  }
  // Credit hold (rule 32): an over-limit order is saved on hold with a warning, and a manager releases it.
  {
    const boss = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'qa-admin@qa.test', password: 'qa-password-1' }) }).then((r) => r.json());
    const bossApi = (url, method = 'GET', data) => fetch(API + url, { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${boss.token}` }, body: data ? JSON.stringify(data) : undefined }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
    const found = (await bossApi('/api/customers?search=QA%20Customer%209&limit=50')).body;
    const customer = (Array.isArray(found) ? found : found?.data || found?.customers || []).find((c) => c.code === 'QA-C09');
    const prefsBefore = customer ? (await bossApi(`/api/customers/${customer.id}/preferences`)).body : null;
    const prefs = prefsBefore?.data || prefsBefore;
    const setLimit = (creditLimit) => bossApi(`/api/customers/${customer.id}/preferences`, 'PUT', { ...prefs, creditLimit });
    try {
      const set = customer ? await setLimit(0.01) : { status: 0 };
      check('credit hold: a manager can set a credit limit on the customer', set.status === 200, `status ${set.status} ${JSON.stringify(set.body).slice(0, 200)}`);
      const page = await open('/mobile-rep/intake');
      await page.getByLabel('Search Customer').fill('QA Customer 9');
      const hit = page.getByText('QA Customer 9', { exact: true }).first();
      await hit.waitFor({ timeout: 8000 }).catch(() => {});
      await hit.click().catch(() => {});
      await page.getByRole('button', { name: 'Line Items' }).click({ timeout: 8000 }).catch(() => {});
      await page.getByLabel('Search Products').fill('plate');
      const chip = page.locator('.MuiChip-root', { hasText: '$' }).first();
      await chip.waitFor({ timeout: 8000 }).catch(() => {});
      await chip.click().catch(() => {});
      await page.getByRole('button', { name: 'Review' }).click({ timeout: 8000 }).catch(() => {});
      await page.getByRole('button', { name: /submit order/i }).click({ timeout: 8000 }).catch(() => {});
      await page.getByText('Order saved on credit hold').waitFor({ timeout: 10000 }).catch(() => {});
      const text = await body(page);
      check('credit hold: the rep is told the order is on credit hold and why', /Order saved on credit hold/.test(text) && /credit limit of \$0\.01/.test(text) && /A manager can release it/.test(text), text);
      const number = (text.match(/Order\s+(\S+)\s+has been saved/) || [])[1];
      await page.close();

      // The clerk sees the list but no Release button.
      const clerkList = await open('/orders/credit-holds');
      await clerkList.getByText(number || 'no order', { exact: true }).waitFor({ timeout: 10000 }).catch(() => {});
      check('credit hold: the held order is on the Credit holds list', Boolean(number) && (await body(clerkList)).includes(number), await body(clerkList));
      check('credit hold: a clerk is not offered Release', await clerkList.getByRole('button', { name: 'Release' }).count() === 0, 'a Release button is shown');
      await clerkList.close();

      // The manager releases it from the list.
      const bossContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      await bossContext.addInitScript(([t, u]) => { localStorage.setItem('token', t); if (u) localStorage.setItem('user', JSON.stringify(u)); }, [boss.token, boss.user]);
      const list = await bossContext.newPage();
      await list.goto(APP + '/orders/credit-holds', { waitUntil: 'domcontentloaded' });
      const row = list.locator('tr', { hasText: number || 'no order' });
      await row.waitFor({ timeout: 10000 }).catch(() => {});
      await row.getByRole('button', { name: 'Release' }).click({ timeout: 5000 }).catch(() => {});
      await list.getByLabel('Note (optional)').fill('QA browser check').catch(() => {});
      await list.getByRole('button', { name: 'Release hold' }).click({ timeout: 5000 }).catch(() => {});
      await list.getByText(`${number} was released and is going ahead.`).waitFor({ timeout: 10000 }).catch(() => {});
      const after = await list.locator('body').innerText();
      check('credit hold: a manager releases it and it leaves the list', after.includes(`${number} was released`) && (await list.locator('tr', { hasText: number || 'no order' }).count()) === 0, after);
      const held = (await bossApi('/api/orders/credit-holds')).body?.data || [];
      check('credit hold: the server agrees the order is no longer held', Boolean(number) && !held.some((r) => r.orderNumber === number), 'still held');
      await bossContext.close();
    } finally {
      if (customer && prefs) await setLimit(prefs.creditLimit ?? null);
    }
  }
  await browser.close();
  const failed = checks.filter((c) => !c.ok);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ app: APP, at: new Date().toISOString(), checks: checks.length, failed: failed.length, results: checks }, null, 1));
  console.log(`\n${checks.length} checks, ${failed.length} failed → ${OUT}`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
