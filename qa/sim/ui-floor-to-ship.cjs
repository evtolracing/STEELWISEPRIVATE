#!/usr/bin/env node
// Shop floor to shipping, in a real browser on the QA server and QA database: a planned job is run at its
// work center, inspected, packed, has its stock reserved on the order page and is dispatched.
// Written after the live walkthrough of 2026-11-20, which found: an inspection started with no inspector could
// not be reached, the work center queue showed record ids and hid its buttons in a narrow window, and no
// screen could reserve stock, so no shipment could be dispatched.
//   node qa/sim/ui-floor-to-ship.cjs --app http://localhost:5199 --api http://localhost:3001 [--shots folder]
// Needs the frontend dev server and a QA backend on port 3001 (qa/README.md).
const fs = require('node:fs');
const { chromium } = require('playwright');

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const APP = arg('app', 'http://localhost:5199');
const API = arg('api', 'http://localhost:3001');
const SHOTS = arg('shots', '');
let passed = 0;
const failed = [];
const check = (name, ok, detail = '') => { if (ok) passed += 1; else failed.push(`${name} ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`.slice(0, 420)); };
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

(async () => {
  const who = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'qa-admin@qa.test', password: 'qa-password-1' }) }).then((r) => r.json());
  if (!who.token) throw new Error('QA sign-in failed. Is the QA server running with the fixtures loaded?');
  const api = async (url, method = 'GET', body) => { const r = await fetch(API + url, { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${who.token}` }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, body: await r.json().catch(() => null) }; };
  const stamp = Date.now().toString(36).toUpperCase();

  // ── Set up through the API: an order of 4 pieces at a branch with a machine, its job planned and placed ──
  const branches = (await api('/api/orders/intake/branches')).body?.data || [];
  const types = ((await api('/api/v1/dispatch/work-center-types')).body?.data || []).filter((t) => t.isActive !== false);
  const machines = ((await api('/api/v1/dispatch/work-centers')).body?.data || []).filter((m) => m.isOnline !== false);
  const branch = branches.find((b) => machines.some((m) => m.locationId === b.id && types.some((t) => t.id === m.workCenterType)));
  if (!branch) throw new Error('No order branch with a machine of a known type in the QA data.');
  const type = types.find((t) => machines.some((m) => m.locationId === branch.id && m.workCenterType === t.id));
  const customers = (await api('/api/customers?search=QA%20Customer&limit=5')).body;
  const customer = (customers?.data || customers || [])[0];
  if (!customer) throw new Error('No test customer in the QA data.');
  const due = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const made = await api('/api/orders/intake', 'POST', { source: 'PHONE', division: 'METALS', location: branch.code, priority: 'STANDARD', customerId: customer.id, customerName: customer.name, poNumber: `FLOOR-${stamp}`, requestedDate: due, lines: [{ description: `QA floor bar ${stamp}`, qty: 4, uom: 'EA', unitPrice: 20, extPrice: 80 }] });
  const orderId = made.body?.data?.id;
  const orderNumber = made.body?.data?.orderNumber;
  const sub = await api(`/api/orders/intake/${orderId}/submit`, 'POST', { createWorkOrders: true });
  const job = ((await api(`/api/jobs?orderId=${orderId}`)).body || [])[0];
  check('set-up: the order is submitted with its work order', sub.status === 200 && Boolean(job), `create ${made.status} submit ${sub.status} ${JSON.stringify(sub.body).slice(0, 200)}`);
  if (!job) throw new Error(`No job for the order: ${failed.join(' | ')}`);
  const planned = await api(`/api/jobs/${job.id}/plan`, 'POST', { operations: [{ workCenterType: type.id, name: `${type.label || type.id} step` }], division: 'METALS', dueDate: due, locationId: branch.id });
  const ran = await api('/api/v1/dispatch/run', 'POST', { locationId: branch.id });
  const step = ((await api(`/api/jobs/${job.id}/plan`)).body?.operations || [])[0];
  check('set-up: the job is planned and placed on a machine', planned.status < 300 && ran.status === 200 && Boolean(step?.assignedWorkCenterId), `plan ${planned.status} run ${ran.status} ${JSON.stringify(step || planned.body).slice(0, 200)}`);
  if (!step?.assignedWorkCenterId) throw new Error(`The job was not placed: ${failed.join(' | ')}`);
  const machine = machines.find((m) => m.id === step.assignedWorkCenterId);

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 800, height: 720 }, deviceScaleFactor: Number(arg('scale', '1')) });
  await context.addInitScript(([t, u]) => { localStorage.setItem('token', t); localStorage.setItem('user', JSON.stringify(u)); }, [who.token, who.user]);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const shot = async (name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: `${SHOTS}/${name}.png` }); } };
  const body = async () => page.locator('main').innerText().catch(() => page.locator('body').innerText());
  const jobNow = async () => (await api(`/api/jobs/${job.id}`)).body?.status;

  // ── 1. The work center queue, in a narrow window like the app browser pane ──
  await page.goto(`${APP}/shopfloor/${machine.id}?locationId=${branch.id}`);
  await page.locator('[data-testid="queue-job-title"]').first().waitFor({ timeout: 15000 }).catch(() => {});
  await page.locator('tr', { hasText: job.jobNumber }).first().click().catch(() => {});
  await page.locator('[data-testid="queue-job-title"]', { hasText: job.jobNumber }).waitFor({ timeout: 8000 }).catch(() => {});
  let text = await page.locator('[data-testid="queue-detail"]').innerText().catch(() => '');
  const heading = await page.locator('h1').first().locator('..').innerText().catch(() => '');
  await shot('1-queue-narrow');
  check('the queue names the job by its number', (await page.locator('[data-testid="queue-job-title"]').innerText().catch(() => '')) === job.jobNumber, text.slice(0, 300));
  check('the queue shows the order number and the branch by name, and no record id', text.includes(orderNumber) && heading.includes(branch.name) && !UUID.test(text + heading), `${heading} | ${(text.match(UUID) || [text.slice(0, 300)])[0]}`);
  const start = page.getByRole('button', { name: 'START' });
  const startBox = await start.boundingBox().catch(() => null);
  const listBox = await page.getByText('Job Queue').boundingBox().catch(() => null);
  check('in a narrow window the START button is above the job list, not under it', Boolean(startBox && listBox) && startBox.y < listBox.y, `start ${startBox?.y} list ${listBox?.y}`);
  const dueShown = new Date(`${due}T12:00:00`).toLocaleDateString('en-US');
  check('the due date is the day that was asked for', text.includes(dueShown), `${dueShown} | ${text.match(/\d+\/\d+\/\d{4}/g)}`);
  await start.click();
  await page.getByRole('button', { name: 'COMPLETE' }).waitFor({ timeout: 10000 }).catch(() => {});
  await page.getByRole('button', { name: 'COMPLETE' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Complete' }).click();
  for (let i = 0; i < 20 && (await jobNow()) !== 'WAITING_QC'; i += 1) await page.waitForTimeout(500);
  check('START then COMPLETE sends the job to QC', (await jobNow()) === 'WAITING_QC', await jobNow());

  // ── 2. QC: an inspection started with no inspector opens at once and can be found again ──
  await page.setViewportSize({ width: 1280, height: 860 });
  await page.goto(`${APP}/qc`);
  const row = page.locator('tr', { hasText: job.jobNumber }).first();
  await row.waitFor({ timeout: 15000 }).catch(() => {});
  await row.getByRole('button', { name: 'Inspect' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Start Inspection' }).click();
  await page.waitForURL(/\/qc\/inspect\/[0-9a-f-]{36}/, { timeout: 10000 }).catch(() => {});
  const inspectionId = (page.url().match(/inspect\/([0-9a-f-]{36})/) || [])[1];
  check('starting an inspection opens its checklist', Boolean(inspectionId), page.url());
  await page.getByText('Job Information').waitFor({ timeout: 10000 }).catch(() => {});
  text = await body();
  await shot('2-inspection');
  check('the inspection shows the job notes in words, not as JSON', /Job Notes:/.test(text) && text.includes(`Order: ${orderNumber}`) && !/\{"customerName"/.test(text), text.slice(text.indexOf('Job Notes'), text.indexOf('Job Notes') + 200));
  // Leave without deciding, then find it again from the station.
  await page.goto(`${APP}/qc`);
  await page.locator('tr', { hasText: job.jobNumber }).first().waitFor({ timeout: 15000 }).catch(() => {});
  const stats = (await api('/api/qc/stats')).body?.data;
  check('the In Progress count includes an inspection with no inspector yet', Number(stats?.inProgressCount) >= 1, stats?.inProgressCount);
  check('the queue row offers Open Inspection', await page.locator('tr', { hasText: job.jobNumber }).first().locator('[data-testid="open-inspection"]').isVisible().catch(() => false));
  await page.getByRole('tab', { name: 'In Progress' }).click();
  const open = page.locator('tr', { hasText: job.jobNumber }).first();
  check('the In Progress tab lists it with a button to go on', await open.locator('[data-testid="continue-inspection"]').isVisible().catch(() => false), (await body()).slice(0, 300));
  await shot('3-qc-in-progress');
  await open.locator('[data-testid="continue-inspection"]').click().catch(() => {});
  await page.waitForURL(new RegExp(`/qc/inspect/${inspectionId}`), { timeout: 10000 }).catch(() => {});
  check('and the button opens that inspection', page.url().includes(`/qc/inspect/${inspectionId}`), page.url());
  // The decision itself is covered by the QC suites; here it is taken through the API to move on.
  const full = (await api(`/api/qc/inspections/${inspectionId}`)).body?.data;
  const checklist = (full?.checklist || []).map((c) => ({ ...c, result: 'PASS', checked: true, passed: true, status: 'PASS' }));
  const pass = await api(`/api/qc/inspections/${inspectionId}/pass`, 'POST', { checklist, notes: 'QA floor to ship' });
  check('set-up: the inspection passes and the job goes to packaging', pass.status === 200 && (await jobNow()) === 'PACKAGING', `pass ${pass.status} ${JSON.stringify(pass.body).slice(0, 200)} job ${await jobNow()}`);

  // ── 3. Packaging ──
  await page.goto(`${APP}/material-tracking/packaging`);
  const card = page.locator('.MuiCard-root', { hasText: job.jobNumber }).first();
  await card.waitFor({ timeout: 15000 }).catch(() => {});
  check('the packaging card shows the due date that was asked for', (await card.innerText().catch(() => '')).includes(`Due: ${dueShown}`), await card.innerText().catch(() => 'no card'));
  await card.getByRole('button', { name: /Mark Ready/ }).click().catch(() => {});
  for (let i = 0; i < 20 && (await jobNow()) !== 'READY_TO_SHIP'; i += 1) await page.waitForTimeout(500);
  check('Mark Ready moves the job to Ready to Ship', (await jobNow()) === 'READY_TO_SHIP', await jobNow());

  // ── 4. Shipping: nothing reserved, so the shipment points at the order page ──
  const order = (await api(`/api/orders/${orderId}`)).body;
  const products = (await api('/api/products?limit=5')).body;
  const sku = (Array.isArray(products) ? products : products?.data || [])[0]?.sku;
  const lot = await api('/api/inventory/receipts', 'POST', { coilNumber: `FLOOR-${stamp}`, form: 'SUPPLY', pieces: 20, productSku: sku, locationId: order.locationId || branch.id });
  check('set-up: a lot of 20 pieces is received at the order\'s branch', lot.status < 300 && Boolean(lot.body?.item?.id), `${lot.status} ${JSON.stringify(lot.body).slice(0, 200)}`);
  const shipment = await api('/api/shipments', 'POST', { orderId, fromLocationId: order.locationId || branch.id, carrierName: 'QA Truck', items: [{ orderLineId: order.lines[0].id, qtyShipped: 4 }] });
  const shipmentId = shipment.body?.id || shipment.body?.data?.id;
  check('set-up: a shipment is made for the order', Boolean(shipmentId), `${shipment.status} ${JSON.stringify(shipment.body).slice(0, 200)}`);
  await page.goto(`${APP}/shipping/${shipmentId}`);
  await page.locator('[data-testid="reserve-on-order"]').waitFor({ timeout: 15000 }).catch(() => {});
  check('a shipment with nothing reserved links to the order to reserve it', await page.locator('[data-testid="reserve-on-order"]').isVisible().catch(() => false), (await body()).slice(0, 300));
  await page.locator('[data-testid="reserve-on-order"]').click().catch(() => {});
  await page.waitForURL(new RegExp(`/orders/${orderId}`), { timeout: 10000 }).catch(() => {});

  // ── 5. Reserve Stock on the order page ──
  await page.locator('[data-testid="order-stock"]').waitFor({ timeout: 15000 }).catch(() => {});
  text = await page.locator('[data-testid="order-stock"]').innerText().catch(() => '');
  check('the order page says the line still needs stock', /1 of 1 line still needs stock reserved/.test(text) && /Reserve Stock \(4 EA to go\)/.test(text), text);
  await page.locator('[data-testid="reserve-line-1"]').click().catch(() => {});
  const choice = page.locator('[data-testid="stock-choice"]', { hasText: `FLOOR-${stamp}` }).first();
  await choice.waitFor({ timeout: 15000 }).catch(() => {});
  const choices = await page.locator('[data-testid="stock-choice"]').allInnerTexts();
  check('the stock offered is counted in the line\'s unit, with the new lot among it', choices.length > 0 && choices.every((c) => /\bEA\b/.test(c)) && choices.some((c) => c.includes(`FLOOR-${stamp}`)), choices.slice(0, 4));
  await shot('4-reserve-dialog');
  await choice.click().catch(() => {});
  check('the quantity offered is what the line still needs', (await page.locator('[data-testid="reserve-qty"]').inputValue().catch(() => '')) === '4');
  // More than the line needs is refused by the server, and the box says why.
  await page.locator('[data-testid="reserve-qty"]').fill('9');
  await page.locator('[data-testid="reserve-confirm"]').click();
  await page.locator('[data-testid="reserve-problem"]').waitFor({ timeout: 8000 }).catch(() => {});
  check('reserving more than the line needs is refused with the reason', /Only 4 is still unreserved/.test(await page.locator('[data-testid="reserve-problem"]').innerText().catch(() => '')), await page.getByRole('dialog').innerText().catch(() => ''));
  await page.locator('[data-testid="reserve-qty"]').fill('4');
  await page.locator('[data-testid="reserve-confirm"]').click();
  await page.locator('[data-testid="order-stock-summary"]', { hasText: /can ship/ }).waitFor({ timeout: 10000 }).catch(() => {});
  text = await page.locator('[data-testid="order-stock"]').innerText().catch(() => '');
  await shot('5-reserved');
  const after = (await api(`/api/orders/${orderId}`)).body;
  const held = (after?.lines?.[0]?.allocations || []).reduce((n, a) => n + Number(a.qtyAllocated), 0);
  check('the reservation is saved and the order page shows it', held === 4 && /Stock is reserved for every line/.test(text) && text.includes(`FLOOR-${stamp}`) && !/Reserve Stock \(/.test(text), `${held} | ${text}`);

  // ── 6. The shipment can now be dispatched ──
  await page.goto(`${APP}/shipping/${shipmentId}`);
  await page.getByRole('button', { name: 'Dispatch', exact: true }).waitFor({ timeout: 15000 }).catch(() => {});
  await page.getByRole('button', { name: 'Dispatch', exact: true }).click();
  await page.getByRole('button', { name: 'Dispatch now' }).click();
  let sent = null;
  for (let i = 0; i < 20; i += 1) { sent = (await api(`/api/shipments/${shipmentId}`)).body; if (sent?.status === 'IN_TRANSIT') break; await page.waitForTimeout(500); }
  await shot('6-dispatched');
  check('with the stock reserved, the shipment is dispatched and its invoice raised', sent?.status === 'IN_TRANSIT' && (sent?.invoices || []).length === 1, `${sent?.status} ${JSON.stringify(sent?.invoices || null).slice(0, 200)} | ${(await body()).slice(0, 300)}`);
  check('no script error on the way', errors.length === 0, errors.join(' | ').slice(0, 300));

  await browser.close();
  console.log(`floor to ship screens: ${passed} passed, ${failed.length} failed`);
  for (const f of failed) console.log(`  FAILED: ${f}`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
