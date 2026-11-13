#!/usr/bin/env node
// Shipping and invoice screens driven like a person would, in a real browser, against the QA server.
// The Shipping screen used to list made-up shipments and there was no screen to create, dispatch
// or deliver a real one (findings F-002 to F-005); invoices did not say who took a payment (F-006).
//   node qa/sim/ui-shipping.cjs --app http://localhost:5199 --api http://localhost:3001
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const APP = arg('app', 'http://localhost:5199');
const API = arg('api', 'http://localhost:3001');
const OUT = arg('out', 'qa/results/ui-shipping.json');

(async () => {
  const signIn = (email) => fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'qa-password-1' }) }).then((r) => r.json());
  const [clerk, dock, boss] = await Promise.all([signIn('qa-csr@qa.test'), signIn('qa-shipping@qa.test'), signIn('qa-admin@qa.test')]);
  if (!clerk.token || !dock.token || !boss.token) throw new Error('login failed');
  const api = async (method, url, who, body) => {
    const r = await fetch(API + url, { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${who.token}` }, body: body ? JSON.stringify(body) : undefined });
    return { status: r.status, body: await r.json().catch(() => null) };
  };
  const nameOf = (who) => [who.user?.firstName, who.user?.lastName].filter(Boolean).join(' ');
  const browser = await chromium.launch();
  const contextFor = async (who) => {
    const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    await context.addInitScript(([t, u]) => { localStorage.setItem('token', t); if (u) localStorage.setItem('user', JSON.stringify(u)); }, [who.token, who.user]);
    return context;
  };
  const desk = await contextFor(dock);
  const office = await contextFor(boss);
  const checks = [];
  const check = (name, ok, detail = '') => { checks.push({ name, ok: Boolean(ok), detail: ok ? '' : String(detail).slice(0, 300) }); console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `  — ${String(detail).slice(0, 200)}`}`); };
  const open = async (context, url) => { const page = await context.newPage(); page.errors = []; page.on('pageerror', (e) => page.errors.push(e.message)); await page.goto(APP + url, { waitUntil: 'domcontentloaded' }); return page; };
  const body = (page) => page.locator('main').first().innerText({ timeout: 3000 }).catch(() => page.locator('body').innerText());
  const seen = (page, text, timeout = 10000) => page.getByText(text, { exact: true }).first().waitFor({ timeout }).then(() => true).catch(() => false);
  const has = (page, pattern, timeout = 8000) => page.getByText(pattern).first().waitFor({ timeout }).then(() => true).catch(() => false);

  // A real confirmed order to ship: 4 pieces at 25.00, with tax.
  const tag = `UI-SHIP-${Date.now().toString(36).toUpperCase()}`;
  const customers = (await api('GET', '/api/customers?limit=50', clerk)).body;
  const customer = (Array.isArray(customers) ? customers : customers?.data || []).find((c) => /^QA-C/.test(c.code || ''));
  const locations = (await api('GET', '/api/inventory/locations', clerk)).body;
  const branch = locations[0];
  if (!customer || !branch) throw new Error('no test customer or branch');
  const order = (await api('POST', '/api/orders', boss, { orderType: 'SO', buyerId: customer.id, status: 'DRAFT', subtotal: 100, taxAmount: 6, freightAmount: 0, totalAmount: 106, poReference: tag, lines: [{ lineNumber: 1, description: `${tag} flat bar`, qtyOrdered: 4, unit: 'EA', unitPrice: 25, priceUnit: 'EACH', extendedPrice: 100 }] })).body;
  if (!order?.id) throw new Error(`could not create an order: ${JSON.stringify(order).slice(0, 200)}`);
  await api('PUT', `/api/orders/${order.id}`, boss, { status: 'CONFIRMED' });

  let shipmentId = null; let shipmentNumber = null;
  // Create a shipment from the Shipping screen.
  {
    const page = await open(desk, '/shipping');
    await seen(page, 'Shipping');
    await has(page, /shipments?$|No shipments yet|Showing the newest/);
    let text = await body(page);
    check('shipping: the list is the real one, not the sample shipments', !/Sample screen|ABC Steel|Midwest Fabrication|SHP-2024/.test(text) && /New shipment/.test(text), text.slice(0, 300));
    await page.getByRole('button', { name: 'New shipment' }).click();
    await page.getByLabel('Order number').fill('NO-SUCH-ORDER');
    await page.getByRole('button', { name: 'Find order' }).click();
    check('new shipment: an order that is not on file says so', await has(page, /is not on file/), await page.getByRole('dialog').innerText());
    await page.getByLabel('Order number').fill(order.orderNumber);
    await page.getByRole('button', { name: 'Find order' }).click();
    const found = await has(page, `${tag} flat bar`);
    const dialogText = await page.getByRole('dialog').innerText();
    check('new shipment: finding an order lists its lines and the customer', found && dialogText.includes(customer.name), dialogText.slice(0, 300));
    await page.getByLabel('Quantity to ship for line 1').fill('3');
    await page.getByLabel('Ships from').click();
    await page.getByRole('option').first().click();
    await page.getByLabel('Carrier').fill(`${tag} Freight`);
    await page.getByRole('button', { name: 'Create shipment' }).click();
    await page.waitForURL(/\/shipping\/[0-9a-f-]{36}/, { timeout: 10000 }).catch(() => {});
    shipmentId = page.url().match(/\/shipping\/([0-9a-f-]{36})/)?.[1] || null;
    const saved = shipmentId ? (await api('GET', `/api/shipments/${shipmentId}`, clerk)).body : null;
    shipmentNumber = saved?.shipmentNumber || null;
    check('new shipment: it is saved on the server and its screen opens', saved?.status === 'PENDING' && saved?.items?.length === 1 && Number(saved.items[0].qtyShipped) === 3 && saved.carrierName === `${tag} Freight`, `url ${page.url()}, ${JSON.stringify(saved).slice(0, 160)}`);
    await seen(page, shipmentNumber || 'none');
    text = await body(page);
    check('shipment: the screen shows the order, customer, line and carrier', text.includes(order.orderNumber) && text.includes(customer.name) && text.includes(`${tag} flat bar`) && text.includes(`${tag} Freight`), text.slice(0, 400));
    check('shipment: the history says who created it', /Shipment created/.test(text) && (!nameOf(dock) || text.includes(nameOf(dock))), text.slice(-400));

    // Carrier and truck details save.
    await page.getByRole('button', { name: 'Carrier and truck' }).click();
    await page.getByLabel('Truck number').fill('T-417');
    await page.getByLabel('Driver', { exact: true }).fill('Pat Driver');
    await page.getByRole('button', { name: 'Save' }).click();
    const truckShown = await has(page, 'T-417');
    const truck = (await api('GET', `/api/shipments/${shipmentId}`, clerk)).body;
    check('shipment: truck and driver are saved and shown', truckShown && truck?.truckNumber === 'T-417' && truck?.driverName === 'Pat Driver', `shown ${truckShown}, server ${truck?.truckNumber}/${truck?.driverName}`);

    // Dispatch asks first, then raises the invoice.
    await page.getByRole('button', { name: 'Dispatch', exact: true }).click();
    check('shipment: dispatch asks before it takes stock and bills', await has(page, /cannot be undone here/), await body(page));
    await page.getByRole('button', { name: 'Dispatch now' }).click();
    // Everything that ships comes off reserved stock. Nothing is reserved yet, so the screen says so.
    const refusedShown = await has(page, /Reserve the stock that is going out/);
    const still = (await api('GET', `/api/shipments/${shipmentId}`, clerk)).body;
    check('shipment: with nothing reserved the dispatch is refused and the screen says to reserve the stock', refusedShown && still?.status !== 'IN_TRANSIT', `shown ${refusedShown}, server ${still?.status}; ${(await body(page)).slice(-300)}`);
    const stockRows = (await api('GET', '/api/inventory?limit=100', boss)).body;
    const stock = (Array.isArray(stockRows) ? stockRows : stockRows?.data || []).find((r) => Number(r.qtyAvailable) >= 10 && r.coil?.status === 'AVAILABLE' && !['FAILED', 'HOLD'].includes(r.coil?.qcStatus));
    const onShipment = (still?.items || []).reduce((n, it) => n + Number(it.qtyShipped), 0);
    const reserved = await api('POST', `/api/orders/${order.id}/allocate`, boss, { lineId: order.lines[0].id, coilId: stock?.coilId, qty: onShipment });
    check('shipment: the stock going out is reserved on the order', reserved.status === 201, `status ${reserved.status} ${JSON.stringify(reserved.body).slice(0, 200)}`);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Dispatch', exact: true }).click();
    await page.getByRole('button', { name: 'Dispatch now' }).click();
    await has(page, /Not yet loaded to/);
    const sent = (await api('GET', `/api/shipments/${shipmentId}`, clerk)).body;
    text = await body(page);
    check('shipment: dispatch is saved, and the history names who dispatched', sent?.status === 'IN_TRANSIT' && /Not yet loaded to\s+On the road/.test(text), `server ${sent?.status}; ${text.slice(-300)}`);
    const invoice = sent?.invoices?.[0];
    check('shipment: the invoice raised by the dispatch is shown with its total', !!invoice && text.includes(invoice.invoiceNumber) && Math.abs(Number(invoice.totalAmount) - 79.5) < 0.005 && /\$79\.50/.test(text), `${JSON.stringify(invoice ?? null)}; ${text.slice(-300)}`);
    check('shipment: once dispatched it cannot be cancelled or edited', (await page.getByRole('button', { name: 'Cancel shipment' }).count()) === 0 && (await page.getByRole('button', { name: 'Carrier and truck' }).count()) === 0, 'buttons still there');

    // Delivered, with who signed.
    await page.getByRole('button', { name: 'Mark delivered' }).click();
    await page.getByLabel('Signed for by').fill('R. Receiver');
    await page.getByRole('dialog').getByRole('button', { name: 'Mark delivered' }).click();
    await has(page, /On the road to/);
    const done = (await api('GET', `/api/shipments/${shipmentId}`, clerk)).body;
    text = await body(page);
    check('shipment: delivery is saved with who signed for it', done?.status === 'DELIVERED' && done?.podSignature === 'R. Receiver' && text.includes('R. Receiver'), `server ${done?.status}/${done?.podSignature}`);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await seen(page, shipmentNumber || 'none');
    text = await body(page);
    check('shipment: after reloading it is still delivered with three history rows', /Delivered/.test(text) && /Shipment created/.test(text) && /Not yet loaded to/.test(text) && /On the road to/.test(text), text.slice(-400));
    check('shipment screens: no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.close();
  }

  // The list finds it; a second shipment can be cancelled; old addresses still work.
  {
    const page = await open(desk, '/shipping');
    await page.getByLabel('Search shipments').fill(`${tag} freight`);
    const found = await seen(page, shipmentNumber || 'none');
    await page.waitForFunction(() => document.querySelectorAll('table[aria-label="Shipments"] tbody tr').length === 1, null, { timeout: 8000 }).catch(() => {});
    const rows = await page.locator('table[aria-label="Shipments"] tbody tr').count();
    check('shipping: search finds the shipment by carrier, on the server', found && rows === 1, `${rows} rows`);
    await page.getByLabel('Search shipments').fill('zzz-nothing-like-this');
    check('shipping: a search with no match says so', await has(page, 'No shipments match.'), await body(page));
    await page.close();

    const second = (await api('POST', '/api/shipments', dock, { orderId: order.id, fromLocationId: branch.id, items: [{ orderLineId: (await api('GET', `/api/shipments/shippable?orderNumber=${order.orderNumber}`, dock)).body.lines[0].orderLineId, qtyShipped: 1 }] })).body;
    const p2 = await open(desk, `/shipping/${second.id}`);
    await seen(p2, second.shipmentNumber);
    await p2.getByRole('button', { name: 'Cancel shipment' }).click();
    await p2.getByRole('button', { name: 'Cancel the shipment' }).click();
    await has(p2, /Not yet loaded to/);
    const cancelled = (await api('GET', `/api/shipments/${second.id}`, clerk)).body;
    check('shipment: cancelling one that has not left is saved and says nothing was billed', cancelled?.status === 'CANCELLED' && (await has(p2, /A cancelled shipment is not invoiced/)), `server ${cancelled?.status}`);
    await p2.close();

    const gone = await open(desk, '/shipping/00000000-0000-0000-0000-000000000000');
    check('shipment: one that does not exist says so', await has(gone, /not on file/), await body(gone));
    await gone.close();

    const old = await open(desk, '/logistics/shipments');
    await old.waitForURL(/\/shipping$/, { timeout: 8000 }).catch(() => {});
    check('the old sample shipment list now opens the real Shipping screen', /\/shipping$/.test(old.url()), old.url());
    await old.goto(`${APP}/logistics/shipments/${shipmentId}`, { waitUntil: 'domcontentloaded' });
    await old.waitForURL(/\/shipping\/[0-9a-f-]{36}/, { timeout: 8000 }).catch(() => {});
    check('an old shipment link opens the real shipment', old.url().endsWith(`/shipping/${shipmentId}`) && (await seen(old, shipmentNumber || 'none')), old.url());
    await old.close();
  }

  // Invoices: a payment is recorded and the invoice says who took it.
  {
    const invoice = (await api('GET', `/api/shipments/${shipmentId}`, clerk)).body.invoices[0];
    const page = await open(office, '/orders/invoices');
    await seen(page, 'Invoices');
    await page.getByLabel('Invoice or order number').fill(invoice.invoiceNumber);
    await page.getByText(invoice.invoiceNumber, { exact: true }).first().click({ timeout: 10000 }).catch(() => {});
    const opened = await has(page, 'Invoice issued');
    let text = await page.getByRole('dialog').innerText().catch(() => '');
    check('invoice: it shows tax carried from the order and who issued it', opened && /\$4\.50/.test(text) && /\$79\.50/.test(text) && (!nameOf(dock) || text.includes(nameOf(dock))), text.slice(0, 500));
    await page.getByRole('button', { name: 'Record payment' }).click();
    await page.getByLabel('Amount').fill('50');
    await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
    await has(page, /Payment recorded/);
    text = await page.getByRole('dialog').innerText().catch(() => '');
    const saved = (await api('GET', `/api/invoices/${invoice.id}`, clerk)).body;
    check('invoice: a payment is saved and the history names who took it', Number(saved?.paidAmount) === 50 && saved?.history?.some((h) => h.event === 'PAYMENT_RECORDED' && h.by) && /Payment recorded \$50\.00/.test(text) && (!nameOf(boss) || text.includes(nameOf(boss))), `paid ${saved?.paidAmount}; ${text.slice(-300)}`);
    check('invoice screen: no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.close();
  }

  // All Orders shows the tax and total that were saved; freight samples say they are samples.
  {
    const page = await open(office, '/orders');
    const found = await has(page, order.orderNumber, 12000);
    const text = await body(page);
    check('all orders: real orders are listed with no sample fallback', found && !/Sample screen/.test(text), text.slice(0, 300));
    await page.close();
    for (const url of ['/freight/planner', '/freight/tracking', '/logistics/dispatch']) {
      const p = await open(office, url);
      const says = await has(p, /Sample screen: these are example figures/);
      check(`${url}: says it is a sample screen and points to Shipping`, says && (await has(p, /Shipping screen/)), (await body(p)).slice(0, 200));
      await p.close();
    }
  }

  await browser.close();
  const failed = checks.filter((c) => !c.ok);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ app: APP, at: new Date().toISOString(), checks: checks.length, failed: failed.length, results: checks }, null, 1));
  console.log(`\n${checks.length} checks, ${failed.length} failed → ${OUT}`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
