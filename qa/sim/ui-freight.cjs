#!/usr/bin/env node
// The Freight screens on real shipments (2026-11-22), in a real browser on the QA server and QA database: the
// Tracking Board, the Exception Inbox and the Shipment Planner. Before this they showed made-up shipments under
// a sample banner. Every number on the screen is compared with the server's own list.
//   node qa/sim/ui-freight.cjs --app http://localhost:5199 --api http://localhost:3001
const { chromium } = require('playwright');
const path = require('path');

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const APP = arg('app', 'http://localhost:5199');
const API = arg('api', 'http://localhost:3001');
let passed = 0;
const failed = [];
const check = (name, ok, detail = '') => { if (ok) passed += 1; else failed.push(`${name} ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`.slice(0, 420)); };
const DAY = 86400000;

(async () => {
  if (!/(localhost|127\.0\.0\.1).*qa/.test(process.env.DATABASE_URL || '')) throw new Error('Refusing: DATABASE_URL is not a local QA database');
  const { PrismaClient } = require(path.resolve(__dirname, '../../src/backend/node_modules/@prisma/client'));
  const prisma = new PrismaClient();
  const owner = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'qa-admin@qa.test', password: 'qa-password-1' }) }).then((r) => r.json());
  if (!owner.token) throw new Error('QA sign-in failed. Is the QA server running with the fixtures loaded?');
  const get = async (url) => (await fetch(API + url, { headers: { authorization: `Bearer ${owner.token}` } })).json();

  // Four shipments made for this run, so each kind of exception is on the newest page of the list: one late on
  // the dock, one marked as an exception, one lost, one delivered with no proof. And an order ready to ship.
  const stamp = Date.now().toString(36).toUpperCase();
  const base = await prisma.shipment.findFirst({ where: { status: 'IN_TRANSIT' }, select: { orderId: true, fromLocationId: true } });
  const mk = (n, data) => prisma.shipment.create({ data: { shipmentNumber: `QF-${stamp}-${n}`, orderId: base.orderId, fromLocationId: base.fromLocationId, ...data } });
  const made = [
    await mk(1, { status: 'PENDING', scheduledDate: new Date(Date.now() - 3 * DAY), carrierName: 'QA Carrier' }),
    await mk(2, { status: 'EXCEPTION' }),
    await mk(3, { status: 'LOST' }),
    await mk(4, { status: 'DELIVERED', deliveredAt: new Date(Date.now() - DAY), podCaptured: false }),
    await mk(5, { status: 'DELIVERED', deliveredAt: new Date(Date.now() - 20 * DAY), podCaptured: true, podSignature: 'Pat Receiver' }),
    await mk(7, { status: 'DELIVERED', deliveredAt: new Date(Date.now() - 2 * DAY), podCaptured: false, noPodReason: 'Left at the gate, nobody on site' }),
  ];
  const customer = await prisma.organization.findFirst({ where: { code: 'QA-C05' } });
  const branch = await prisma.location.findFirst({ where: { code: 'QA-L01' } });
  const ready = await prisma.order.create({ data: { orderNumber: `QF-SO-${stamp}`, orderType: 'SO', status: 'CONFIRMED', buyerId: customer.id, createdById: owner.user.id, locationId: branch.id, promisedDate: new Date(Date.now() - 2 * DAY), shipToCity: 'Lansing', shipToState: 'MI' } });
  const jobs = [
    await prisma.job.create({ data: { jobNumber: `QF-J1-${stamp}`, status: 'READY_TO_SHIP', orderId: ready.id } }),
    await prisma.job.create({ data: { jobNumber: `QF-J2-${stamp}`, status: 'IN_PROCESS', orderId: ready.id } }),
  ];

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  await context.addInitScript(([t, u]) => { localStorage.setItem('token', t); localStorage.setItem('user', JSON.stringify(u)); localStorage.removeItem('sw.branchId'); }, [owner.token, owner.user]);
  const page = await context.newPage();

  try {
    const list = await get('/api/shipments?limit=200');
    const weekAgo = Date.now() - 7 * DAY;
    const want = {
      PENDING: list.filter((s) => s.status === 'PENDING').length,
      LOADING: list.filter((s) => s.status === 'LOADING').length,
      IN_TRANSIT: list.filter((s) => s.status === 'IN_TRANSIT').length,
      DELIVERED: list.filter((s) => s.status === 'DELIVERED' && s.deliveredAt && new Date(s.deliveredAt).getTime() >= weekAgo).length,
    };

    // ── Tracking Board ──
    await page.goto(`${APP}/freight/tracking`);
    await page.getByTestId('freight-count-PENDING').waitFor({ timeout: 20000 });
    await page.getByTestId('freight-card').first().waitFor({ timeout: 20000 });
    check('the sample banner is gone from the Tracking Board', (await page.getByText('Sample screen').count()) === 0);
    const got = {};
    for (const k of Object.keys(want)) got[k] = Number(await page.getByTestId(`freight-count-${k}`).innerText());
    check('each column counts the shipments the server lists in that status', JSON.stringify(got) === JSON.stringify(want), { got, want });
    check('no made-up shipment is shown', (await page.getByText(/SHP-2026-00[0-9]{2}|FastFreight|Toledo Facility/).count()) === 0);
    const lateCard = page.getByTestId('freight-card').filter({ hasText: made[0].shipmentNumber });
    check('a shipment past its scheduled day is marked late', (await lateCard.getByText('Late').count()) === 1);
    check('a delivery older than a week is not on the board, a recent one is', (await page.getByText(made[4].shipmentNumber).count()) === 0 && (await page.getByText(made[3].shipmentNumber).count()) === 1);
    check('the board says how many shipments need attention', /shipments? needs? attention/.test(await page.getByTestId('freight-board-attention').innerText()));
    await page.getByPlaceholder('Shipment, order, customer, carrier').fill(made[0].shipmentNumber);
    await page.waitForFunction((n) => document.querySelectorAll('[data-testid="freight-card"]').length === n, 1, { timeout: 10000 });
    check('search narrows the board to the shipment asked for', (await page.getByTestId('freight-card').count()) === 1);
    await page.getByTestId('freight-card').first().getByRole('button').click();
    await page.waitForURL(new RegExp(`/shipping/${made[0].id}`), { timeout: 15000 });
    check('a card opens the real shipment', true);

    // ── Exception Inbox ──
    await page.goto(`${APP}/freight/exceptions`);
    await page.getByTestId('freight-exception-row').first().waitFor({ timeout: 20000 });
    check('the sample banner is gone from the Exception Inbox', (await page.getByText('Sample screen').count()) === 0);
    const kindOf = async (n) => page.getByTestId('freight-exception-row').filter({ hasText: n }).first().getAttribute('data-kind').catch(() => null);
    const kinds = [await kindOf(made[0].shipmentNumber), await kindOf(made[1].shipmentNumber), await kindOf(made[2].shipmentNumber), await kindOf(made[3].shipmentNumber)];
    check('each kind of exception is listed with its reason', JSON.stringify(kinds) === JSON.stringify(['LATE', 'EXCEPTION', 'LOST', 'NO_POD']), kinds);
    check('a delivery with proof is not an exception', (await page.getByTestId('freight-exception-row').filter({ hasText: made[4].shipmentNumber }).count()) === 0);
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
    const wantRows = list.filter((s) => s.status === 'LOST' || s.status === 'EXCEPTION'
      || (['PENDING', 'LOADING'].includes(s.status) && s.scheduledDate && new Date(s.scheduledDate) < startOfToday)
      || (s.status === 'DELIVERED' && !s.podCaptured && !s.noPodReason)).length;
    check('the inbox lists exactly the shipments the rule picks from the server\'s list', (await page.getByTestId('freight-exception-row').count()) === wantRows, `${await page.getByTestId('freight-exception-row').count()} vs ${wantRows}`);
    const rows = await page.getByTestId('freight-exception-row').evaluateAll((els) => els.map((e) => e.getAttribute('data-kind')));
    const rank = ['LOST', 'EXCEPTION', 'LATE', 'NO_POD'];
    check('the worst come first', rows.every((k, i) => i === 0 || rank.indexOf(rows[i - 1]) <= rank.indexOf(k)));

    // ── Shipment Planner ──
    const readyList = await get('/api/shipments/ready-orders');
    await page.goto(`${APP}/freight/planner`);
    await page.getByTestId('freight-planner-row').first().waitFor({ timeout: 20000 });
    check('the sample banner is gone from the Shipment Planner', (await page.getByText('Sample screen').count()) === 0);
    check('the planner lists the orders the server says are ready', (await page.getByTestId('freight-planner-row').count()) === readyList.length && readyList.some((o) => o.id === ready.id), `${await page.getByTestId('freight-planner-row').count()} vs ${readyList.length}`);
    const row = page.getByTestId('freight-planner-row').filter({ hasText: ready.orderNumber });
    const text = await row.innerText();
    check('an order shows its customer, town, branch, lateness and work', text.includes(customer.name) && text.includes('Lansing, MI') && text.includes('QA-L01') && text.includes('2 days late') && text.includes('1 ready, 1 still in work'), text);
    await page.getByLabel('Selling branch').click();
    const offered = await page.getByRole('option').allInnerTexts();
    const real = [...new Set(readyList.filter((o) => o.location).map((o) => o.location.name))];
    check('the branch filter offers only branches these orders were sold at', real.every((n) => offered.includes(n)) && !['Detroit', 'Chicago', 'Cleveland'].some((n) => offered.includes(n) && !real.includes(n)), offered);
    await page.keyboard.press('Escape');
    await row.getByRole('button', { name: 'Plan shipment' }).click();
    await page.waitForURL(/\/shipping\?order=/, { timeout: 15000 });
    await page.getByRole('dialog').getByText(ready.orderNumber).first().waitFor({ timeout: 15000 });
    check('Plan shipment opens the new shipment form on that order', (await page.getByRole('dialog').getByLabel('Order number').inputValue()) === ready.orderNumber);
    // The branch wall: a person held to one branch sees that branch's ready orders and shipments, no others.
    const as = async (email) => { const t = (await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'qa-password-1' }) }).then((r) => r.json())).token; return async (url) => (await fetch(API + url, { headers: { authorization: `Bearer ${t}` } })).json(); };
    const a = await as('qa-branch-a@qa.test');
    const b = await as('qa-branch-b@qa.test');
    const aReady = await a('/api/shipments/ready-orders');
    const bReady = await b('/api/shipments/ready-orders');
    check('the selling branch sees its order ready to ship', Array.isArray(aReady) && aReady.some((o) => o.id === ready.id), aReady);
    check('a person at another branch does not see it', Array.isArray(bReady) && !bReady.some((o) => o.id === ready.id) && bReady.every((o) => o.location?.code === 'QA-L02'), bReady);
    const bShip = await b('/api/shipments?limit=200');
    const outside = await prisma.shipment.count({ where: { id: { in: bShip.map((x) => x.id) }, NOT: { OR: [{ fromLocation: { code: 'QA-L02' } }, { order: { location: { code: 'QA-L02' } } }] } } });
    check('and the shipments behind the board are held to their branch too', Array.isArray(bShip) && outside === 0, outside);
    // ── Proof of delivery ──
    const pod = async (id) => { await page.goto(`${APP}/freight/pod/${id}`); await page.getByTestId('pod-proof').waitFor({ timeout: 20000 }); return page.getByTestId('pod-proof'); };
    let proof = await pod(made[4].id);
    check('the sample banner is gone from the proof of delivery screen', (await page.getByText('Sample screen').count()) === 0);
    check('a signed delivery shows the name on file', (await proof.getAttribute('data-state')) === 'PROOF' && (await page.getByTestId('pod-signed-by').innerText()) === 'Pat Receiver' && (await page.getByTestId('pod-shipment').innerText()) === made[4].shipmentNumber);
    proof = await pod(made[5].id);
    check('a delivery with no proof shows the reason given', (await proof.getAttribute('data-state')) === 'REASON' && (await page.getByTestId('pod-reason').innerText()) === 'Left at the gate, nobody on site');
    proof = await pod(made[3].id);
    check('a delivery with nothing on file says so and invents no name', (await proof.getAttribute('data-state')) === 'MISSING' && (await page.getByTestId('pod-signed-by').count()) === 0);
    proof = await pod(made[0].id);
    check('a shipment still on the dock has no proof of delivery', (await proof.getAttribute('data-state')) === 'NOT_DELIVERED');
    await page.goto(`${APP}/freight/pod/no-such-shipment`);
    await page.getByTestId('pod-error').waitFor({ timeout: 20000 });
    check('a shipment that does not exist shows an error and no delivery', (await page.getByTestId('pod-proof').count()) === 0);
    const other = await prisma.shipment.findFirst({ where: { fromLocation: { code: 'QA-L01' }, order: { location: { code: 'QA-L01' } } }, select: { id: true } });
    const peek = other && await b(`/api/shipments/${other.id}`);
    check('a person at another branch cannot read the shipment behind it', Boolean(other) && !peek?.shipmentNumber, peek);
    await page.goto(`${APP}/freight/exceptions`);
    await page.getByTestId('freight-exception-row').filter({ hasText: made[3].shipmentNumber }).getByRole('button', { name: 'Proof of delivery' }).click();
    await page.waitForURL(new RegExp(`/freight/pod/${made[3].id}`), { timeout: 15000 });
    check('the Exception Inbox opens the proof of delivery for a delivery with none', true);
    // An order with an open shipment leaves the planner.
    const dock = await prisma.shipment.create({ data: { shipmentNumber: `QF-${stamp}-6`, orderId: ready.id, fromLocationId: branch.id, status: 'PENDING' } });
    made.push(dock);
    check('an order with a shipment on the dock leaves the list', !(await get('/api/shipments/ready-orders')).some((o) => o.id === ready.id));
  } catch (e) {
    failed.push(`the walk stopped: ${String(e.message).slice(0, 300)}`);
  } finally {
    await prisma.shipment.deleteMany({ where: { id: { in: made.map((m) => m.id) } } });
    await prisma.job.deleteMany({ where: { id: { in: jobs.map((j) => j.id) } } });
    await prisma.order.delete({ where: { id: ready.id } }).catch(() => {});
    await prisma.$disconnect();
    await browser.close();
  }
  console.log(`freight screens: ${passed} passed, ${failed.length} failed`);
  for (const f of failed) console.log(`  FAILED: ${f}`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
