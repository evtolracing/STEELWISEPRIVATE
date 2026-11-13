#!/usr/bin/env node
// What the screens do when the server is slow, silent, gone, or answers after the screen moved on.
// Driven in a real browser against the QA server. The ten cases of Phase 4 section 7:
//   slow answer, time limit, lost connection, expired session, refused input, double submission,
//   filter changed while a request is in flight, leaving the screen mid-step, one part of a step
//   failing, and a step that was saved while its answer was lost.
//   node qa/sim/ui-integration.cjs --app http://localhost:5199 --api http://localhost:3001
// The database is used only to make billing fail for one test order; it must be a QA database.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const APP = arg('app', 'http://localhost:5199');
const API = arg('api', 'http://localhost:3001');
const OUT = arg('out', 'qa/results/ui-integration.json');
const DB = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/steelwise_qa';
if (!/qa/i.test(new URL(DB).pathname)) { console.error('Refusing: the database name must contain "qa".'); process.exit(2); }
const sql = (text) => execFileSync('psql', [DB, '-v', 'ON_ERROR_STOP=1', '-q', '-c', text], { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const signIn = (email) => fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'qa-password-1' }) }).then((r) => r.json());
  const boss = await signIn('qa-admin@qa.test');
  if (!boss.token) throw new Error('login failed');
  const api = async (method, url, body) => {
    const r = await fetch(API + url, { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${boss.token}` }, body: body ? JSON.stringify(body) : undefined });
    return { status: r.status, body: await r.json().catch(() => null) };
  };
  const browser = await chromium.launch();
  const contextFor = async (token, user) => {
    const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    await context.addInitScript(([t, u]) => { localStorage.setItem('token', t); if (u) localStorage.setItem('user', JSON.stringify(u)); }, [token, user]);
    return context;
  };
  const checks = [];
  const check = (name, ok, detail = '') => { checks.push({ name, ok: Boolean(ok), detail: ok ? '' : String(detail).slice(0, 300) }); console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `  — ${String(detail).slice(0, 300)}`}`); };
  const open = async (context, url) => { const page = await context.newPage(); page.errors = []; page.on('pageerror', (e) => page.errors.push(e.message)); await page.goto(APP + url, { waitUntil: 'domcontentloaded' }); return page; };
  const body = (page) => page.locator('body').innerText({ timeout: 3000 }).catch(() => '');
  const has = (page, pattern, timeout = 8000) => page.getByText(pattern).first().waitFor({ timeout }).then(() => true).catch(() => false);

  const tag = `UI-INT-${Date.now().toString(36).toUpperCase()}`;
  const customers = (await api('GET', '/api/customers?limit=50')).body;
  const customer = (Array.isArray(customers) ? customers : customers?.data || []).find((c) => /^QA-C/.test(c.code || ''));
  const branch = (await api('GET', '/api/inventory/locations')).body[0];
  if (!customer || !branch) throw new Error('no test customer or branch');
  let n = 0;
  // A confirmed order for 4 pieces; `reserve` holds the stock so it can be dispatched.
  const order = async ({ reserve = true } = {}) => {
    n += 1;
    const name = `${tag}-${n} flat bar`;
    const o = (await api('POST', '/api/orders', { orderType: 'SO', buyerId: customer.id, status: 'DRAFT', subtotal: 100, taxAmount: 0, freightAmount: 0, totalAmount: 100, poReference: `${tag}-${n}`, lines: [{ lineNumber: 1, description: name, qtyOrdered: 4, unit: 'EA', unitPrice: 25, priceUnit: 'EACH', extendedPrice: 100 }] })).body;
    if (!o?.id) throw new Error(`could not create an order: ${JSON.stringify(o).slice(0, 200)}`);
    await api('PUT', `/api/orders/${o.id}`, { status: 'CONFIRMED' });
    if (reserve) {
      const rows = (await api('GET', '/api/inventory?limit=100')).body;
      const stock = (Array.isArray(rows) ? rows : rows?.data || []).find((r) => Number(r.qtyAvailable) >= 10 && r.coil?.status === 'AVAILABLE' && !['FAILED', 'HOLD'].includes(r.coil?.qcStatus));
      const held = await api('POST', `/api/orders/${o.id}/allocate`, { lineId: o.lines[0].id, coilId: stock?.coilId, qty: 4 });
      if (held.status !== 201) throw new Error(`could not reserve: ${held.status} ${JSON.stringify(held.body).slice(0, 200)}`);
    }
    return { ...o, lineName: name };
  };
  const shipment = async (o) => {
    const s = await api('POST', '/api/shipments', { orderId: o.id, fromLocationId: branch.id, items: [{ orderLineId: o.lines[0].id, qtyShipped: 4 }] });
    if (s.status !== 201) throw new Error(`could not create a shipment: ${s.status} ${JSON.stringify(s.body).slice(0, 200)}`);
    return s.body;
  };
  const shipmentsOf = async (o) => { const r = (await api('GET', `/api/shipments?orderId=${o.id}&limit=50`)).body; return (Array.isArray(r) ? r : r?.data || []).filter((s) => s.orderId === o.id); };
  const one = async (id) => (await api('GET', `/api/shipments/${id}`)).body;
  const fillNew = async (page, o, qty = '4') => {
    await page.getByRole('button', { name: 'New shipment' }).click();
    await page.getByLabel('Order number').fill(o.orderNumber);
    await page.getByRole('button', { name: 'Find order' }).click();
    await has(page, o.lineName);
    await page.getByLabel('Quantity to ship for line 1').fill(qty);
    await page.getByLabel('Ships from').click();
    await page.getByRole('option').first().click();
  };

  const staff = await contextFor(boss.token, boss.user);

  // 2. Time limit. Started first and left running: the screen gives up after 60 seconds.
  const slowPage = await open(staff, '/shipping');
  const timeLimit = (async () => {
    await has(slowPage, 'New shipment');
    await slowPage.route('**/api/shipments?*', async (route) => { await wait(75_000); await route.abort().catch(() => {}); });
    const started = Date.now();
    await slowPage.getByRole('button', { name: 'Refresh' }).click();
    const said = await has(slowPage, /took too long to answer/, 70_000);
    const took = Math.round((Date.now() - started) / 1000);
    const text = await body(slowPage);
    check('time limit: a request with no answer is given up after about a minute, and the screen says so', said && took >= 55 && took <= 68, `said ${said} after ${took}s`);
    check('time limit: the screen is usable afterwards (not left loading)', (await slowPage.getByRole('progressbar').count()) === 0 && /New shipment/.test(text), text.slice(0, 200));
    await slowPage.close();
  })();

  // 1. Slow answer.
  {
    const made = await shipment(await order());
    const page = await open(staff, '/shipping');
    await has(page, made.shipmentNumber);
    await page.route('**/api/shipments?*', async (route) => { await wait(3000); await route.continue(); });
    await page.getByRole('button', { name: 'Refresh' }).click();
    await wait(800);
    const working = (await page.getByRole('progressbar').count()) > 0;
    const early = await body(page);
    const arrived = await page.getByRole('progressbar').first().waitFor({ state: 'detached', timeout: 8000 }).then(() => true).catch(() => false);
    const text = await body(page);
    check('slow answer: the screen shows it is working and shows no error while it waits', working && !/could not be loaded|took too long|connection was lost/.test(early), early.slice(0, 200));
    check('slow answer: the list arrives complete when the server answers', arrived && text.includes(made.shipmentNumber), text.slice(0, 300));
    check('slow answer: no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.close();
  }

  // 3. Lost connection.
  {
    const made = await shipment(await order());
    const page = await open(staff, '/shipping');
    await has(page, made.shipmentNumber);
    await page.route('**/api/shipments?*', (route) => route.abort('internetdisconnected'));
    await page.getByRole('button', { name: 'Refresh' }).click();
    const said = await has(page, /connection was lost/);
    let text = await body(page);
    check('lost connection: the screen says the connection was lost, in words, and shows no stale rows', said && !/Network Error|ERR_|undefined/.test(text) && !text.includes(made.shipmentNumber), text.slice(0, 300));
    check('lost connection: the user stays signed in', (await page.evaluate(() => localStorage.getItem('token'))) === boss.token && !/\/login/.test(page.url()), page.url());
    await page.unroute('**/api/shipments?*');
    await page.getByRole('button', { name: 'Refresh' }).click();
    const back = await has(page, made.shipmentNumber);
    text = await body(page);
    check('lost connection: when it returns, Refresh brings the list back and the message goes', back && !/connection was lost/.test(text), text.slice(0, 300));
    await page.close();
  }

  // 4. Session no longer valid.
  {
    // The token is put in place once, as a sign-in would, so the test can see it being removed.
    const expired = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    await expired.addInitScript(([u]) => { if (!sessionStorage.getItem('qa-seeded')) { sessionStorage.setItem('qa-seeded', '1'); localStorage.setItem('token', 'not.a.valid.token'); localStorage.setItem('user', JSON.stringify(u)); } }, [boss.user]);
    const seen = [];
    const page = await expired.newPage();
    page.on('response', (r) => { if (r.url().includes('/api/')) seen.push(r.status()); });
    await page.goto(`${APP}/shipping`, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/login/, { timeout: 10000 }).catch(() => {});
    const token = await page.evaluate(() => localStorage.getItem('token')).catch(() => 'unreadable');
    const text = await body(page);
    check('expired session: the server answers 401 and the user is taken to sign in', seen.includes(401) && /\/login/.test(page.url()), `statuses ${[...new Set(seen)].join(',')}, url ${page.url()}`);
    check('expired session: the dead token is removed and no shipment data is shown', token !== 'not.a.valid.token' && !/New shipment/.test(text), `token ${token}; ${text.slice(0, 200)}`);
    await expired.close();
  }

  // 5. Refused input.
  {
    const o = await order({ reserve: false });
    const page = await open(staff, '/shipping');
    await fillNew(page, o, '99');
    const create = page.getByRole('button', { name: 'Create shipment' });
    const blocked = await create.isDisabled().catch(() => false);
    if (!blocked) await create.click();
    await wait(1500);
    const dialog = await page.getByRole('dialog').innerText().catch(() => '');
    check('refused input: shipping more than was ordered is refused with a reason, and the form stays open', (blocked || (await page.getByRole('dialog').getByRole('alert').count()) > 0 || /more than|left to ship|at most/i.test(dialog)) && /New shipment/.test(dialog), dialog.slice(0, 300));
    check('refused input: nothing was saved', (await shipmentsOf(o)).length === 0, `${(await shipmentsOf(o)).length} shipments`);
    // The same check by the server alone, so the rule does not depend on the screen.
    const direct = await api('POST', '/api/shipments', { orderId: o.id, fromLocationId: branch.id, items: [{ orderLineId: o.lines[0].id, qtyShipped: 99 }] });
    check('refused input: the server refuses it too, with 4xx and a sentence', direct.status >= 400 && direct.status < 500 && typeof direct.body?.error === 'string' && direct.body.error.length > 10, `${direct.status} ${JSON.stringify(direct.body).slice(0, 200)}`);
    await page.close();
  }

  // 6. Double submission.
  {
    const o = await order({ reserve: false });
    const page = await open(staff, '/shipping');
    const sent = [];
    page.on('request', (r) => { if (r.method() === 'POST' && /\/api\/shipments$/.test(new URL(r.url()).pathname)) sent.push(r.headers()['idempotency-key'] || null); });
    await fillNew(page, o);
    await page.getByRole('button', { name: 'Create shipment' }).dblclick();
    await page.waitForURL(/\/shipping\/[0-9a-f-]{36}/, { timeout: 10000 }).catch(() => {});
    const made = await shipmentsOf(o);
    check('double click: one shipment is created, not two', made.length === 1, `${made.length} shipments, ${sent.length} requests`);
    check('double click: every create request carried a request key', sent.length >= 1 && sent.every(Boolean) && new Set(sent).size === 1, JSON.stringify(sent));
    await page.close();
  }

  // 7. The filter changes while a request is in flight (the screen-side form of switching
  //    branch mid-request: the server decides the branch from the signed-in user, so what can
  //    go stale on a screen is an answer for a filter that is no longer the one shown).
  {
    const made = await shipment(await order());
    const page = await open(staff, '/shipping');
    await has(page, made.shipmentNumber);
    const late = `${tag}-NOTHING`;
    let lateAnswered = false;
    await page.route('**/api/shipments?*', async (route) => {
      if (route.request().url().includes(encodeURIComponent(late))) { await wait(3000); lateAnswered = true; }
      await route.continue().catch(() => {});
    });
    const search = page.getByLabel('Search shipments');
    await search.fill(late);
    await wait(700);
    await search.fill(made.shipmentNumber);
    await has(page, made.shipmentNumber);
    for (let i = 0; i < 20 && !lateAnswered; i += 1) await wait(250);
    await wait(800);
    const text = await page.getByRole('table', { name: 'Shipments' }).innerText();
    check('filter changed mid-request: the late answer for the old filter does not replace the list', lateAnswered && text.includes(made.shipmentNumber) && (await search.inputValue()) === made.shipmentNumber, `late ${lateAnswered}; ${text.slice(0, 200)}`);
    check('filter changed mid-request: the screen is not left loading', (await page.getByRole('progressbar').count()) === 0, 'still loading');
    await page.close();
  }

  // 8. Leaving the screen in the middle of a step.
  {
    const o = await order();
    const made = await shipment(o);
    const page = await open(staff, `/shipping/${made.id}`);
    await has(page, made.shipmentNumber);
    await page.route(`**/api/shipments/${made.id}/dispatch`, async (route) => { const answer = await route.fetch().catch(() => null); await wait(1500); if (answer) await route.fulfill({ response: answer }).catch(() => {}); });
    await page.getByRole('button', { name: 'Dispatch', exact: true }).click();
    await page.getByRole('button', { name: 'Dispatch now' }).click();
    await wait(300);
    await page.goto(`${APP}/shipping`, { waitUntil: 'domcontentloaded' });
    let now = null;
    for (let i = 0; i < 40; i += 1) { now = await one(made.id); if (now?.status === 'IN_TRANSIT') break; await wait(250); }
    check('left mid-step: the dispatch still finished on the server, once, with one invoice', now?.status === 'IN_TRANSIT' && (now?.invoices || []).length === 1, `${now?.status}, ${(now?.invoices || []).length} invoices`);
    await page.getByRole('button', { name: 'Refresh' }).click();
    await has(page, made.shipmentNumber);
    const row = await page.getByRole('row').filter({ hasText: made.shipmentNumber }).first().innerText().catch(() => '');
    check('left mid-step: the list shows what the server has', /On the road/.test(row), row);
    check('left mid-step: no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.close();
  }

  // 9. One part of a step fails: the truck leaves and the invoice cannot be raised.
  {
    const o = await order();
    const made = await shipment(o);
    const fn = `qa_ui_bill_fail_${Date.now()}`;
    sql(`CREATE OR REPLACE FUNCTION ${fn}() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'QA injected billing failure'; END; $$ LANGUAGE plpgsql; CREATE TRIGGER ${fn}_t BEFORE INSERT ON "Invoice" FOR EACH ROW WHEN (NEW."orderId" = '${o.id}') EXECUTE FUNCTION ${fn}();`);
    try {
      const page = await open(staff, `/shipping/${made.id}`);
      await has(page, made.shipmentNumber);
      await page.getByRole('button', { name: 'Dispatch', exact: true }).click();
      await page.getByRole('button', { name: 'Dispatch now' }).click();
      const said = await has(page, /invoice could not be raised/);
      await has(page, /Not yet loaded to/);
      const text = await body(page);
      const now = await one(made.id);
      check('part of a step failed: the screen says the truck left and the invoice was not raised', said && /On the road/.test(text) && !/QA injected|Invoice INV-.* raised/.test(text), text.slice(-400));
      check('part of a step failed: the server agrees (dispatched, no invoice)', now?.status === 'IN_TRANSIT' && (now?.invoices || []).length === 0, `${now?.status}, ${(now?.invoices || []).length} invoices`);
      await page.close();
    } finally {
      sql(`DROP TRIGGER IF EXISTS ${fn}_t ON "Invoice"; DROP FUNCTION IF EXISTS ${fn}();`);
    }
    const office = await open(staff, '/admin/integrations');
    const listed = await has(office, o.orderNumber, 10000);
    const text = await body(office);
    check('part of a step failed: the Integrations screen lists the order as shipped but not invoiced, under "Needs action"', listed && /Needs action/.test(text) && /Shipped but not invoiced/.test(text), text.slice(0, 400));
    check('integrations screen: it names what is connected and shows no key or secret', /What this system is connected to/.test(text) && !/qa-not-a-real|qa-tasks-secret|sk-[A-Za-z0-9]{8}/.test(text), text.slice(0, 200));
    await office.getByRole('button', { name: 'Run now' }).click();
    check('integrations screen: "Run now" runs the delivery and upkeep task and says what it did', await has(office, /Done\. Partner events delivered/), (await body(office)).slice(0, 300));
    check('integrations screen: no script errors', office.errors.length === 0, office.errors.join(' | '));
    await office.close();
    const plain = await signIn('qa-shipping@qa.test');
    const refused = await fetch(`${API}/api/admin/integrations`, { headers: { authorization: `Bearer ${plain.token}` } });
    check('integrations screen: a shipping clerk is refused the report by the server', refused.status === 403, `status ${refused.status}`);
  }

  // 10. Saved on the server, answer lost on the way back.
  {
    // (a) A step: delivery. The screen must end up showing what the server has.
    const o = await order();
    const made = await shipment(o);
    await api('PUT', `/api/shipments/${made.id}/dispatch`, {});
    const page = await open(staff, `/shipping/${made.id}`);
    await has(page, made.shipmentNumber);
    let lost = 0;
    await page.route(`**/api/shipments/${made.id}/deliver`, async (route) => { await route.fetch().catch(() => null); lost += 1; await route.abort('connectionreset'); });
    await page.getByRole('button', { name: 'Mark delivered' }).click();
    await page.getByLabel('Signed for by').fill('R. Receiver');
    await page.getByRole('dialog').getByRole('button', { name: 'Mark delivered' }).click();
    const said = await has(page, /connection was lost|may have been saved/);
    const now = await one(made.id);
    check('answer lost after saving (delivery): the screen says the answer was lost and that it may have been saved', said && lost === 1 && now?.status === 'DELIVERED', `said ${said}, lost ${lost}, server ${now?.status}`);
    // Sending it again from the same form is safe: the server recognises the request.
    await page.unroute(`**/api/shipments/${made.id}/deliver`);
    const again = page.getByRole('dialog').getByRole('button', { name: 'Mark delivered' });
    if (await again.count()) await again.click();
    await has(page, /On the road to/);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await has(page, made.shipmentNumber);
    const text = await body(page);
    const after = await one(made.id);
    const delivered = (text.match(/On the road to\s+Delivered/g) || []).length;
    check('answer lost after saving (delivery): sending it again does not deliver twice, and the screen shows the delivery once', after?.status === 'DELIVERED' && after?.podSignature === 'R. Receiver' && delivered === 1, `server ${after?.status}, history rows ${delivered}`);
    await page.close();
  }
  {
    // (b) A document: a new shipment. Pressing Create again must not make a second one.
    const o = await order({ reserve: false });
    const page = await open(staff, '/shipping');
    const keys = [];
    let lost = 0;
    await page.route('**/api/shipments', async (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      keys.push(route.request().headers()['idempotency-key'] || null);
      if (lost === 0) { lost += 1; await route.fetch().catch(() => null); return route.abort('connectionreset'); }
      return route.continue();
    });
    await fillNew(page, o);
    await page.getByRole('button', { name: 'Create shipment' }).click();
    const said = await has(page, /connection was lost|may have been saved/);
    const first = await shipmentsOf(o);
    check('answer lost after saving (new shipment): the shipment was saved and the screen says it may have been', said && first.length === 1, `said ${said}, ${first.length} saved`);
    await page.getByRole('button', { name: 'Create shipment' }).click();
    await page.waitForURL(/\/shipping\/[0-9a-f-]{36}/, { timeout: 10000 }).catch(() => {});
    const second = await shipmentsOf(o);
    const opened = page.url().match(/\/shipping\/([0-9a-f-]{36})/)?.[1] || null;
    check('answer lost after saving (new shipment): pressing Create again sends the same request key', keys.length === 2 && Boolean(keys[0]) && keys[0] === keys[1], JSON.stringify(keys));
    check('answer lost after saving (new shipment): there is still one shipment, and the screen opens it', second.length === 1 && opened === first[0]?.id, `${second.length} shipments, opened ${opened}, first ${first[0]?.id}`);
    check('answer lost after saving: no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.close();
  }

  await timeLimit;
  await browser.close();
  const failed = checks.filter((c) => !c.ok);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ app: APP, at: new Date().toISOString(), checks: checks.length, failed: failed.length, results: checks }, null, 1));
  console.log(`${checks.length} checks, ${failed.length} failed`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
