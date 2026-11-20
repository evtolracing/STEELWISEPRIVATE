#!/usr/bin/env node
// Phase 8 screens in a real browser, against the QA server:
// the shipment screen shows the stock to pick with its heat, opens the packing list as it will print,
// will not record a delivery without a name or a reason, and records a problem with what happened;
// the order screen shows what stands between the order and closed, and cost only to the roles that
// manage cost; the list of orders not closed finds an order; invoices are aged; a return received
// without its credit is flagged and settled; the packing screen opens a package and walks it to a tag.
//   node qa/sim/ui-phase8.cjs --app http://localhost:5199 --api http://localhost:3001
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const APP = arg('app', 'http://localhost:5199');
const API = arg('api', 'http://localhost:3001');
const OUT = arg('out', 'qa/results/ui-phase8.json');

(async () => {
  // The scenario library builds the orders, stock and shipments, against the same QA server.
  process.argv.push('--base', API);
  const lib = await import('./phase4-lib.mjs');
  const { A, prisma } = lib;
  const w = await lib.world(); const B = lib.blocks(w);
  const signIn = (email) => fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'qa-password-1' }) }).then((r) => r.json());
  const [clerk, dock, boss] = await Promise.all([signIn('qa-csr@qa.test'), signIn('qa-shipping@qa.test'), signIn('qa-admin@qa.test')]);
  if (!clerk.token || !dock.token || !boss.token) throw new Error('login failed');
  const must = (r, what) => { if (r.status < 200 || r.status > 299) throw new Error(`${what}: ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`); return r.body; };

  const browser = await chromium.launch();
  const contextFor = async (who, viewport = { width: 1366, height: 900 }) => {
    const context = await browser.newContext({ viewport });
    await context.addInitScript(([t, u]) => { localStorage.setItem('token', t); if (u) localStorage.setItem('user', JSON.stringify(u)); }, [who.token, who.user]);
    return context;
  };
  const desk = await contextFor(dock); const office = await contextFor(boss); const sales = await contextFor(clerk);
  const checks = [];
  const check = (name, ok, detail = '') => { checks.push({ name, ok: Boolean(ok), detail: ok ? '' : String(detail).slice(0, 300) }); console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `  — ${String(detail).slice(0, 260)}`}`); };
  const open = async (context, url) => { const page = await context.newPage(); page.errors = []; page.on('pageerror', (e) => page.errors.push(e.message)); await page.goto(APP + url, { waitUntil: 'domcontentloaded' }); return page; };
  const body = (page) => page.locator('body').innerText();
  const has = (page, pattern, timeout = 10000) => page.getByText(pattern).first().waitFor({ timeout }).then(() => true).catch(() => false);
  const shipmentOf = (id) => prisma.shipment.findUnique({ where: { id } });

  // ── Shipment on the dock: stock to pick, the paper as it prints, dispatch ─────────────────────
  const a = await B.readyToShip(400);
  const coil = await prisma.coil.findUnique({ where: { id: a.coilId }, include: { heat: true } });
  {
    const page = await open(desk, `/shipping/${a.shipment.id}`);
    await has(page, 'Stock to pick');
    let text = await body(page);
    check('shipment on the dock: the stock to pick is listed with its tag and heat', text.includes('Stock to pick') && text.includes(coil.coilNumber) && text.includes(coil.heat.heatNumber), text.slice(0, 400));
    check('shipment on the dock: what is not on file is named, not filled in', /will print with blanks/.test(text) && /No bill of lading number has been entered/.test(text), text.slice(0, 400));
    await page.getByRole('button', { name: 'Packing list' }).click();
    const frame = page.frameLocator('iframe[title="Packing list"]');
    const paper = await frame.locator('body').innerText({ timeout: 10000 }).catch((e) => `no paper: ${e.message}`);
    check('packing list: opens as it will print, with the shipment, the order and the stock item', paper.includes(a.shipment.shipmentNumber) && paper.includes(a.order.orderNumber) && paper.includes(coil.coilNumber), paper.slice(0, 300));
    check('packing list: nothing reads "undefined", "null" or "NaN"', !/undefined|null|NaN/.test(paper), (paper.match(/.{0,30}(undefined|null|NaN).{0,30}/) || [''])[0]);
    check('packing list: there is a Print button', await page.getByRole('dialog').getByRole('button', { name: 'Print' }).isVisible().catch(() => false));
    await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click();
    await page.getByRole('button', { name: 'Dispatch', exact: true }).click();
    await page.getByRole('button', { name: 'Dispatch now' }).click();
    await has(page, 'Stock that left');
    text = await body(page);
    check('dispatch: the screen then shows the stock that left and the invoice', text.includes('Stock that left') && text.includes(coil.coilNumber) && /INV-/.test(text) && (await shipmentOf(a.shipment.id)).status === 'IN_TRANSIT', text.slice(0, 300));

    // Delivery: a name, or a reason for none.
    await page.getByRole('button', { name: 'Mark delivered' }).click();
    const dialog = page.getByRole('dialog');
    const save = dialog.getByRole('button', { name: 'Mark delivered' });
    check('delivery: it cannot be saved with no name and no reason', await save.isDisabled());
    await dialog.getByLabel('Nobody signed for it').check();
    check('delivery: ticking "Nobody signed for it" asks why, and still cannot be saved empty', await dialog.getByLabel('Why there is no name').isVisible() && await save.isDisabled());
    await dialog.getByLabel('Why there is no name').fill('Left at the gate as the customer asked');
    await save.click();
    // The helper text under the field reads much the same, so wait for the window to close first.
    await dialog.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await has(page, 'Left at the gate as the customer asked');
    const after = await shipmentOf(a.shipment.id);
    check('delivery: the reason is saved and shown, and no name was made up', after.status === 'DELIVERED' && after.noPodReason === 'Left at the gate as the customer asked' && !after.podSignature && (await body(page)).includes('Left at the gate as the customer asked'), `${after.status} ${after.noPodReason} ${after.podSignature}`);
    await page.getByRole('button', { name: 'Packing list' }).click();
    const signed = await page.frameLocator('iframe[title="Packing list"]').locator('body').innerText({ timeout: 10000 }).catch((e) => `no paper: ${e.message}`);
    check('packing list: where nobody signed, it prints the reason and no name', signed.includes('No signature: Left at the gate as the customer asked'), signed.slice(-300));
    check('shipment screen: no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.close();
  }
  // ── A problem on the road, then delivered with a name ─────────────────────────────────────────
  const b = await B.readyToShip(300); must(await B.dispatch(b.shipment), 'dispatch');
  {
    const page = await open(desk, `/shipping/${b.shipment.id}`);
    await page.getByRole('button', { name: 'Report a problem' }).click();
    const dialog = page.getByRole('dialog');
    const record = dialog.getByRole('button', { name: 'Record the problem' });
    check('problem: it cannot be recorded without saying what happened', await record.isDisabled());
    await dialog.getByLabel('What happened').fill('Refused at the door: wrong length');
    await record.click();
    await page.getByRole('button', { name: 'Back on the road' }).waitFor({ timeout: 10000 }).catch(() => {});
    let text = await body(page);
    check('problem: what happened is in the history, and the shipment can go back on the road', text.includes('Refused at the door: wrong length') && (await shipmentOf(b.shipment.id)).status === 'EXCEPTION', text.slice(-400));
    const invoicesBefore = (await B.invoicesOf(b.order.id)).length;
    await page.getByRole('button', { name: 'Back on the road' }).click();
    await page.getByRole('button', { name: 'Report a problem' }).waitFor({ timeout: 10000 }).catch(() => {});
    check('problem: going back on the road raises no second invoice', (await shipmentOf(b.shipment.id)).status === 'IN_TRANSIT' && (await B.invoicesOf(b.order.id)).length === invoicesBefore && invoicesBefore === 1, `${invoicesBefore}`);
    await page.getByRole('button', { name: 'Mark delivered' }).click();
    await page.getByRole('dialog').getByLabel('Received by').fill('Dana Receiver');
    await page.getByRole('dialog').getByRole('button', { name: 'Mark delivered' }).click();
    await has(page, 'Dana Receiver');
    const after = await shipmentOf(b.shipment.id);
    check('delivery: the name of the person who received it is saved and shown', after.status === 'DELIVERED' && after.podSignature === 'Dana Receiver' && after.podCaptured === true, `${after.status} ${after.podSignature}`);
    await page.getByRole('button', { name: 'Packing list' }).click();
    const paper = await page.frameLocator('iframe[title="Packing list"]').locator('body').innerText({ timeout: 10000 }).catch((e) => `no paper: ${e.message}`);
    check('packing list: after delivery it carries who received it', paper.includes('Dana Receiver') && paper.includes(b.shipment.shipmentNumber), paper.slice(-300));
    await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click();
    await page.getByRole('button', { name: 'Bill of lading' }).click();
    const bol = await page.frameLocator('iframe[title="Bill of lading"]').locator('body').innerText({ timeout: 10000 }).catch((e) => `no paper: ${e.message}`);
    check('bill of lading: drawn from the shipment, with "(not entered)" where no number was typed', bol.includes('BILL OF LADING') && bol.includes(b.order.orderNumber) && /not entered/.test(bol) && !/undefined|null|NaN/.test(bol), bol.slice(0, 300));
    check('shipment screen (problem and delivery): no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.close();
  }
  // ── Order screen: closeout, and cost for the roles that manage it ─────────────────────────────
  {
    await prisma.coil.update({ where: { id: b.coilId }, data: { unitCost: 0.4 } });
    const c = await B.readyToShip(200); await prisma.coil.update({ where: { id: c.coilId }, data: { unitCost: 0.4 } }); must(await B.dispatch(c.shipment), 'dispatch');
    const page = await open(office, `/orders/${c.order.id}`);
    const panel = page.getByTestId('order-closeout');
    await panel.waitFor({ timeout: 15000 }).catch(() => {});
    let text = await panel.innerText().catch(() => '');
    check('order: the closeout panel says what is still open (on the road, and money owed)', /things? open/.test(text) && /on the road|not yet delivered/i.test(text) && /still owed/.test(text), text);
    check('order: a manager sees cost and margin, from what left', /Cost and margin/.test(text) && /Margin/.test(text) && /80\.00/.test(text), text);
    check('order screen: no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.close();
    const page2 = await open(sales, `/orders/${c.order.id}`);
    await page2.getByTestId('order-closeout').waitFor({ timeout: 15000 }).catch(() => {});
    text = await page2.getByTestId('order-closeout').innerText().catch(() => '');
    check('order: sales sees the closeout and no cost or margin', /things? open/.test(text) && !/Cost and margin|Margin/.test(text), text);
    await page2.close();

    // Orders not closed.
    const list = await open(office, '/orders/closeout');
    await has(list, 'Orders not closed');
    await list.getByLabel('Order number').fill(c.order.orderNumber);
    const row = list.getByRole('row').filter({ hasText: c.order.orderNumber });
    await row.first().waitFor({ timeout: 10000 }).catch(() => {});
    text = await row.first().innerText().catch(() => '');
    check('orders not closed: the order is found by number, with what it is waiting for', text.includes(c.order.orderNumber) && /road|paid|owed|payment/i.test(text), text || (await body(list)).slice(0, 300));
    await list.getByText('Shipment problem', { exact: true }).click();
    await list.waitForTimeout(800);
    check('orders not closed: a filter that does not apply to the order leaves it out', !(await body(list)).includes(c.order.orderNumber));
    check('orders not closed: no script errors', list.errors.length === 0, list.errors.join(' | '));
    await list.close();
  }
  // ── Invoices: owed by age ─────────────────────────────────────────────────────────────────────
  {
    const page = await open(office, '/orders/invoices');
    const chip = page.getByText('Owed by age', { exact: true }).first();
    const found = await chip.waitFor({ timeout: 10000 }).then(() => true).catch(() => false);
    if (found) await chip.click();
    const table = page.getByRole('table', { name: 'Owed by age' });
    await table.waitFor({ timeout: 10000 }).catch(() => {});
    const text = await table.innerText().catch(() => '');
    const report = (await A.get('/api/invoices/aging', 'admin')).body;
    check('invoices: "Owed by age" shows the five columns', found && /Not yet due/.test(text) && /1 to 30 days/.test(text) && /Over 90/.test(text), text.slice(0, 300) || (await body(page)).slice(0, 300));
    const total = Number(report?.totals?.total ?? report?.total ?? NaN);
    check('invoices: the total on the screen is the total the records give', Number.isFinite(total) && text.replace(/,/g, '').includes(total.toFixed(2)), `${total} | ${text.slice(-200)}`);
    check('invoices screen: no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.close();
  }
  // ── Returns: received without its credit, then settled by a manager ───────────────────────────
  {
    const r = await B.readyToShip(300); const d = must(await B.dispatch(r.shipment), 'dispatch');
    must(await A.post(`/api/invoices/${d.invoice.id}/credit`, { amount: 195, reason: 'Goodwill credit for the whole invoice' }, 'admin'), 'credit');
    const line = r.order.lines[0];
    const ret = must(await A.post('/api/returns', { orderId: r.order.id, reason: 'UI phase 8: wrong size', lines: [{ orderLineId: line.id, quantity: 100, disposition: 'RESTOCK' }] }, 'admin'), 'return');
    must(await A.post(`/api/returns/${ret.id}/receive`, {}, 'admin'), 'receive');
    const page = await open(office, '/orders/returns');
    const row = page.getByRole('row').filter({ hasText: ret.returnNumber || ret.orderNumber });
    await row.first().waitFor({ timeout: 15000 }).catch(() => {});
    let text = await row.first().innerText().catch(() => '');
    check('returns: a return received without its credit is flagged', /Credit not issued/.test(text), text || (await body(page)).slice(0, 300));
    await row.first().getByRole('button', { name: 'Settled another way' }).click();
    const dialog = page.getByRole('dialog');
    const fields = dialog.getByRole('textbox');
    await fields.first().fill('Credit memo CM-HAND-1 given by hand');
    await dialog.getByRole('button').filter({ hasNotText: 'Cancel' }).last().click();
    await page.waitForTimeout(1500);
    text = await row.first().innerText().catch(() => '');
    const settled = await prisma.auditLog.count({ where: { eventType: { contains: 'CREDIT' }, resourceId: ret.id } });
    check('returns: a manager settles it with the reason, and the flag goes', !/Credit not issued/.test(text) && settled >= 2, `${text} | records ${settled}`);
    check('returns screen: no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.close();
  }
  // ── Packing: open a package, add material, quality, tag ───────────────────────────────────────
  {
    const k = await B.readyToShip(300);
    const page = await open(desk, '/material-tracking/packages');
    await has(page, 'Packing');
    await page.getByRole('button', { name: 'Open a package' }).click();
    let dialog = page.getByRole('dialog');
    await dialog.getByLabel('Order number').fill('NO-SUCH-ORDER-8');
    await dialog.getByRole('button', { name: 'Find order' }).click();
    check('packing: an order number that does not exist says so', await has(page, 'No open order has that number.'));
    await dialog.getByLabel('Order number').fill(k.order.orderNumber);
    await dialog.getByRole('button', { name: 'Find order' }).click();
    await dialog.getByRole('button', { name: 'Open package' }).waitFor({ timeout: 8000 }).catch(() => {});
    await dialog.getByRole('button', { name: 'Open package' }).click();
    const row = page.getByRole('row').filter({ hasText: k.order.orderNumber });
    await row.first().waitFor({ timeout: 10000 }).catch(() => {});
    let text = await row.first().innerText().catch(() => '');
    const pkg = await prisma.package.findFirst({ where: { orderId: k.order.id } });
    check('packing: the package is opened for the order line and listed as empty', pkg && text.includes(pkg.packageId) && /Empty/.test(text), text || (await body(page)).slice(0, 300));
    check('packing: an empty package cannot be sent to quality', (await row.first().getByRole('button', { name: 'Send to quality' }).count()) === 0);
    await row.first().getByRole('button', { name: 'Add material' }).click();
    dialog = page.getByRole('dialog');
    await dialog.getByLabel('Stock item').waitFor({ timeout: 8000 }).catch(() => {});
    const offered = await dialog.innerText();
    await dialog.getByLabel('Pieces').fill('2');
    await dialog.getByLabel('Weight, lb').fill('200');
    await dialog.getByRole('button').filter({ hasNotText: 'Cancel' }).last().click();
    await page.getByRole('row').filter({ hasText: k.order.orderNumber }).getByRole('button', { name: 'Send to quality' }).waitFor({ timeout: 10000 }).catch(() => {});
    text = await row.first().innerText().catch(() => '');
    const coilK = await prisma.coil.findUnique({ where: { id: k.coilId }, include: { heat: true } });
    check('packing: material is added from the stock reserved for the line, with its heat', /2 pieces/.test(text) && text.includes(coilK.heat.heatNumber), `${text} | offered: ${offered.slice(0, 200)}`);
    await row.first().getByRole('button', { name: 'Send to quality' }).click();
    check('packing: sent to quality, it waits for quality', await has(page, 'Waiting for quality'));
    text = await row.first().innerText().catch(() => '');
    check('packing: no tag can be made before quality releases it', !/Make tag/.test(text), text);
    // Quality is a different person: the release is done as the QA administrator.
    must(await A.post(`/api/drop-tags/packages/${pkg.id}/qc-release`, {}, 'admin'), 'release');
    await page.reload(); await row.first().waitFor({ timeout: 10000 }).catch(() => {});
    await row.first().getByRole('button', { name: 'Make tag' }).click();
    await page.waitForTimeout(1500);
    const tag = await prisma.dropTag.findFirst({ where: { packageId: pkg.id } });
    text = await row.first().innerText().catch(() => '');
    check('packing: once released, the tag is made and is ready to print', tag && tag.status === 'READY_TO_PRINT' && text.includes(tag.dropTagId), `${tag?.status} ${text}`);
    check('packing screen: no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.close();
  }
  // ── Owner decision 10: a load that never arrives, who reads invoices, checkout on account ─────
  {
    const c = await B.readyToShip(150);
    must(await B.dispatch(c.shipment), 'dispatch'); must(await A.patch(`/api/shipments/${c.shipment.id}/status`, { status: 'EXCEPTION', reason: 'Trailer stolen' }, 'shipping'), 'problem');
    let page = await open(desk, `/shipping/${c.shipment.id}`);
    await has(page, 'Lost for good');
    let text = await body(page);
    check('shipping desk: the shipment shows its invoice by number, with no amount', /INV-\d+/.test(text) && !/INV-\d+\s*\$/.test(text), (text.match(/.{0,20}INV-.{0,40}/) || [''])[0]);
    await page.getByRole('button', { name: 'Lost for good' }).click();
    let dialog = page.getByRole('dialog');
    await dialog.getByLabel('What happened').fill('Trailer stolen from the yard');
    await dialog.getByRole('button', { name: 'End as lost and credit' }).click();
    check('lost load: the shipping desk is told it needs a manager, and nothing changes', await has(page, /needs? a manager/) && (await shipmentOf(c.shipment.id)).status === 'EXCEPTION');
    await page.close();
    page = await open(desk, '/orders/invoices');
    check('shipping desk: the invoices screen is closed to them and lists none', await has(page, /sales, accounting and managers|doesn't include this page/) && !/INV-\d+/.test(await body(page)));
    await page.close();

    page = await open(office, `/shipping/${c.shipment.id}`);
    await has(page, 'Lost for good');
    await page.getByRole('button', { name: 'Lost for good' }).click();
    dialog = page.getByRole('dialog');
    const end = dialog.getByRole('button', { name: 'End as lost and credit' });
    check('lost load: it cannot be saved without what happened, and says it cannot be undone', await end.isDisabled() && /cannot be undone/.test(await dialog.innerText()));
    await dialog.getByLabel('What happened').fill('Trailer stolen from the yard, police report 5512');
    await end.click();
    const told = await has(page, /Recorded as lost\. Credit CM-/);
    await dialog.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(800);
    text = await body(page);
    const credits = await prisma.invoice.findMany({ where: { orderId: c.order.id, kind: 'CREDIT' } });
    check('lost load: a manager ends it, is told the credit number, and the screen shows Lost with the credit', told && (await shipmentOf(c.shipment.id)).status === 'LOST' && credits.length === 1 && /Lost/.test(text) && text.includes(credits[0].invoiceNumber), text.slice(0, 300));
    check('lost load: no further step is offered on a lost shipment', !/Lost for good|Mark delivered|Back on the road/.test(text));
    check('lost load: what happened is in the history', /Trailer stolen from the yard, police report 5512/.test(text));
    check('lost load screen: no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.close();

    // Web checkout: no payment method to choose.
    const shop = await contextFor(boss);
    await shop.addInitScript(() => { localStorage.setItem('steelwise_cart', JSON.stringify([{ productId: 'qa-ui-item', name: 'QA checkout item', quantity: 1, unit: 'EA', unitPrice: 12.5, priceSource: 'RETAIL' }])); });
    page = await open(shop, '/shop/checkout');
    const shown = await has(page, /On account\. No card is taken here/);
    text = await body(page);
    check('web checkout: it says the order is on account and that nothing is charged now', shown, text.slice(0, 300));
    check('web checkout: there is no payment method to choose and no card field', !/Payment Method|Credit Card|Cash on Delivery|Prepay|Card number/i.test(text), (text.match(/.{0,30}(Payment Method|Credit Card|Cash on Delivery|Prepay|Card number).{0,30}/i) || [''])[0]);
    check('web checkout screen: no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.close(); await shop.close();
  }
  // ── Phone width ───────────────────────────────────────────────────────────────────────────────
  {
    const phone = await contextFor(boss, { width: 390, height: 844 });
    for (const [url, name] of [[`/shipping/${b.shipment.id}`, 'shipment'], ['/orders/closeout', 'orders not closed'], ['/material-tracking/packages', 'packing']]) {
      const page = await open(phone, url);
      await page.waitForTimeout(1200);
      const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(`phone: the ${name} screen fits a 390-pixel screen without sideways scrolling`, wide <= 2, `${wide} pixels too wide`);
      check(`phone: ${name}: no script errors`, page.errors.length === 0, page.errors.join(' | '));
      await page.close();
    }
    await phone.close();
  }
  await browser.close(); await prisma.$disconnect();
  const failed = checks.filter((c) => !c.ok);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ app: APP, at: new Date().toISOString(), checks: checks.length, failed: failed.length, results: checks }, null, 1));
  console.log(`\n${checks.length} checks, ${failed.length} failed → ${OUT}`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
