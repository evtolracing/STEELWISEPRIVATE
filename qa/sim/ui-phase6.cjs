#!/usr/bin/env node
// Phase 6 screens in a real browser, against the QA server, as the QA-L01 inventory manager:
// a transfer from another branch shows under "Coming in" and is received from the screen (G-007);
// a stock item can be sent to another branch and then shows as in transit; purchase orders list and
// open with their lines, and the supply position shows this branch only (K-002, K-010); and the
// Receiving screen lists open purchase order lines and fills the receipt from one (I-007).
//   node qa/sim/ui-phase6.cjs --app http://localhost:5199 --api http://localhost:3001
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const APP = arg('app', 'http://localhost:5199');
const API = arg('api', 'http://localhost:3001');
const OUT = arg('out', 'qa/results/ui-phase6.json');
const run = Date.now().toString(36).toUpperCase();
const PASSWORD = 'qa-password-1';

(async () => {
  const signIn = async (email) => {
    const b = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: PASSWORD }) }).then((r) => r.json());
    if (!b.token) throw new Error(`login ${email} failed`);
    return b;
  };
  const [wh, boss] = await Promise.all([signIn('qa-branch-wh@qa.test'), signIn('qa-admin@qa.test')]);
  const call = (who, method, url, body) => fetch(API + url, { method, headers: { authorization: `Bearer ${who.token}`, 'content-type': 'application/json' }, body: body && JSON.stringify(body) }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
  const locations = (await call(boss, 'GET', '/api/inventory/locations')).body || [];
  const L1 = locations.find((l) => l.code === 'QA-L01'); const L2 = locations.find((l) => l.code === 'QA-L02');
  const heats = (await call(boss, 'GET', '/api/heats?limit=50')).body || [];
  const heat = heats.find((h) => h.grade?.code) || heats[0];
  const receive = async (who, loc, extra = {}) => {
    const r = await call(who, 'POST', '/api/inventory/receipts', { coilNumber: `UI6-${run}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`, form: 'PLATE', heatNumber: heat.heatNumber, gradeCode: heat.grade.code, thicknessIn: 0.5, widthIn: 48, lengthIn: 96, weightLb: 1500, locationId: loc.id, ...extra });
    if (r.status !== 201) throw new Error(`receipt ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
    return r.body.item;
  };

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1360, height: 900 } });
  await context.addInitScript(([t, u]) => { localStorage.setItem('token', t); if (u) localStorage.setItem('user', JSON.stringify(u)); }, [wh.token, wh.user]);
  const checks = [];
  const check = (name, ok, detail = '') => { checks.push({ name, ok: Boolean(ok), detail: ok ? '' : String(detail).slice(0, 300) }); console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : ` — ${String(detail).slice(0, 300)}`}`); };
  const open = async (url) => { const page = await context.newPage(); page.errors = []; page.on('pageerror', (e) => page.errors.push(e.message)); await page.goto(APP + url, { waitUntil: 'domcontentloaded' }); await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {}); return page; };
  const body = (page) => page.locator('body').innerText();

  // Transfers: something sent from L2 to L1 is under "Coming in" and is received from the screen.
  {
    const item = await receive(boss, L2);
    const sent = await call(boss, 'POST', '/api/inventory/transfers', { toLocationId: L1.id, coilIds: [item.id], carrier: 'UI truck' });
    const page = await open('/transfers');
    await page.getByText(sent.body.transferNumber).first().waitFor({ timeout: 10000 }).catch(() => {});
    check('transfers: what is on its way to my branch is under Coming in', sent.status === 201 && (await body(page)).includes(sent.body.transferNumber), `${sent.status} ${(await body(page)).slice(0, 300)}`);
    await page.getByText(sent.body.transferNumber).first().click();
    await page.getByRole('button', { name: 'Receive', exact: true }).click();
    await page.getByText(`Receive transfer ${sent.body.transferNumber}`).waitFor({ timeout: 8000 }).catch(() => {});
    check('transfers: the receive window lists the item with what was sent', (await body(page)).includes(item.coilNumber) && /1,500/.test(await body(page)), (await body(page)).slice(0, 400));
    await page.getByRole('dialog').getByRole('button', { name: 'Receive', exact: true }).click();
    await page.getByText(`Transfer ${sent.body.transferNumber} received`).first().waitFor({ timeout: 10000 }).catch(() => {});
    const after = (await call(boss, 'GET', `/api/inventory/transfers/${sent.body.id}`)).body;
    const unit = (await call(boss, 'GET', `/api/coils/${item.id}`)).body;
    check('transfers: receiving on the screen books it in at my branch', after?.status === 'RECEIVED' && unit?.locationId === L1.id, `${after?.status} ${unit?.locationId}`);
    check('transfers: no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.close();
  }
  // A stock item is sent from its page and then shows as in transit, with Move switched off.
  {
    const item = await receive(boss, L1);
    const page = await open(`/units/${item.id}`);
    await page.getByRole('button', { name: 'Move' }).click();
    await page.getByText('Send to another branch').first().waitFor({ timeout: 8000 }).catch(() => {});
    const dialog = page.getByRole('dialog');
    await dialog.locator('[role="combobox"]').first().click();
    await page.getByRole('option').filter({ hasText: L2.code }).first().click();
    await dialog.getByRole('button', { name: 'Send item' }).click();
    await page.getByText('This item is on its way to another branch').first().waitFor({ timeout: 10000 }).catch(() => {});
    const inv = (await call(boss, 'GET', `/api/coils/${item.id}`)).body?.inventory;
    check('stock item: sending it from its page puts it in transit', inv?.status === 'IN_TRANSIT' && Number(inv?.qtyInTransit) === 1500, JSON.stringify(inv));
    check('stock item: the page says it is in transit and Move is switched off', /on its way to another branch/.test(await body(page)) && (await page.getByRole('button', { name: 'Move' }).isDisabled()), (await body(page)).slice(0, 300));
    check('stock item: no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.close();
  }
  // Purchase orders and the supply position.
  {
    const supplier = ((await call(wh, 'GET', '/api/purchase-orders/suppliers')).body || [])[0];
    const grade = heat.gradeId || heat.grade?.id;
    const po = await call(wh, 'POST', '/api/purchase-orders', { sellerId: supplier.id, status: 'DRAFT', subtotal: 2000, taxAmount: 0, freightAmount: 0, totalAmount: 2000, lines: [{ gradeId: grade, description: `UI6 ${run}`, thicknessIn: 0.5, widthIn: 48, lengthIn: 96, qtyOrdered: 4000, unit: 'LB', unitPrice: 0.5, priceUnit: 'LB', extendedPrice: 2000 }] });
    await call(wh, 'PUT', `/api/purchase-orders/${po.body.id}`, { status: 'CONFIRMED' });
    const page = await open('/purchase-orders');
    await page.getByText(po.body.orderNumber).first().waitFor({ timeout: 10000 }).catch(() => {});
    check('purchase orders: the new order is listed with its supplier', po.status === 201 && (await body(page)).includes(po.body.orderNumber) && (await body(page)).includes(supplier.name), `${po.status} ${(await body(page)).slice(0, 300)}`);
    await page.getByText(po.body.orderNumber).first().click();
    await page.getByText(`Purchase order ${po.body.orderNumber}`).waitFor({ timeout: 8000 }).catch(() => {});
    check('purchase orders: it opens with its line and nothing received', /4,000 LB/.test(await body(page)) && (await body(page)).includes(`UI6 ${run}`), (await body(page)).slice(0, 400));
    await page.keyboard.press('Escape');
    await page.getByRole('tab', { name: 'Supply position' }).click();
    await page.getByRole('table', { name: 'Supply position' }).waitFor({ timeout: 8000 }).catch(() => {});
    const rows = await page.getByRole('table', { name: 'Supply position' }).locator('tbody tr').allInnerTexts();
    check('supply position: rows for my branch only, and it says nothing is suggested', rows.length > 0 && rows.every((r) => r.startsWith('QA-L01')) && /nothing is suggested/i.test(await body(page)), rows.slice(0, 3).join(' | '));
    check('purchase orders: no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.close();

    // Receiving: the open line is listed and fills the receive form.
    const recv = await open('/receiving');
    await recv.getByText(po.body.orderNumber).first().waitFor({ timeout: 10000 }).catch(() => {});
    const lineRow = recv.getByRole('table', { name: 'Open purchase order lines' }).locator('tr', { hasText: po.body.orderNumber }).first();
    check('receiving: the open purchase order line is listed', await lineRow.isVisible().catch(() => false), (await body(recv)).slice(0, 300));
    await lineRow.getByRole('button').first().click().catch(() => {});
    await recv.getByText('Filled from the purchase order line').first().waitFor({ timeout: 8000 }).catch(() => {});
    check('receiving: choosing it fills the receipt from the line', /Filled from the purchase order line/.test(await body(recv)), (await body(recv)).slice(0, 300));
    check('receiving: no script errors', recv.errors.length === 0, recv.errors.join(' | '));
    await recv.close();
  }
  await browser.close();
  const failed = checks.filter((c) => !c.ok);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ app: APP, at: new Date().toISOString(), checks: checks.length, failed: failed.length, results: checks }, null, 1));
  console.log(`\n${checks.length} checks, ${failed.length} failed → ${OUT}`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
