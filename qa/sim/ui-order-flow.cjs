#!/usr/bin/env node
// New order to dispatch, in a real browser on the QA server and QA database: the order desk saves and submits an
// order, it lands under New Orders on the Order Board, it is planned there, and Run Dispatch places it.
//   node qa/sim/ui-order-flow.cjs --app http://localhost:5199 --api http://localhost:3001 [--shots folder]
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

(async () => {
  const who = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'qa-admin@qa.test', password: 'qa-password-1' }) }).then((r) => r.json());
  if (!who.token) throw new Error('QA sign-in failed. Is the QA server running with the fixtures loaded?');
  const api = async (url, method = 'GET', body) => { const r = await fetch(API + url, { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${who.token}` }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, body: await r.json().catch(() => null) }; };
  const stamp = Date.now().toString(36).toUpperCase();

  // A kind of work the order's branch can really do: a work center type with a machine there.
  const branches = (await api('/api/orders/intake/branches')).body?.data || [];
  const types = ((await api('/api/v1/dispatch/work-center-types')).body?.data || []).filter((t) => t.isActive !== false);
  const machines = (await api('/api/v1/dispatch/work-centers')).body?.data || [];

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: Number(arg('scale', '1')) });
  await context.addInitScript(([t, u]) => { localStorage.setItem('token', t); localStorage.setItem('user', JSON.stringify(u)); }, [who.token, who.user]);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const shot = async (name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: `${SHOTS}/${name}.png` }); } };
  const said = async (pattern, ms = 8000) => { const el = page.locator('.MuiSnackbar-root').filter({ hasText: pattern }).first(); await el.waitFor({ timeout: ms }).catch(() => {}); return (await page.locator('.MuiSnackbar-root').allInnerTexts()).join(' | '); };

  // ── 1. The order desk ──
  await page.goto(`${APP}/orders/intake`);
  await page.getByRole('button', { name: 'Save Draft' }).first().waitFor();
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: 'Save Draft' }).first().click();
  let text = await said(/not saved/);
  check('saving an empty draft says why it was not saved', /not saved/.test(text) && /customer or at least one line/.test(text), text);

  await page.getByRole('button', { name: 'Look Up' }).click();
  await page.locator('[role=dialog] input').first().fill('QA Customer');
  await page.locator('[role=dialog]').getByText(/QA Customer \d+/).first().click();
  await page.getByRole('button', { name: 'Change' }).waitFor();
  await page.getByRole('button', { name: 'Material', exact: true }).click();
  await page.getByLabel('Quantity for line 1').waitFor();
  await page.getByRole('button', { name: 'Submit Order' }).first().click();
  text = await said(/Line 1/);
  await shot('0-empty-line-refused');
  check('a line with no material cannot be submitted, and the screen says which line', /Line 1: choose a material or type a description/.test(text), text);
  check('nothing was sent for it', !/\/orders\/[0-9a-f-]{36}/.test(page.url()));

  await page.getByLabel('Enter description or pick material').first().fill(`QA flow plate ${stamp}`);
  await page.getByLabel('Quantity for line 1').fill('4');
  await page.getByLabel('Unit price for line 1').fill('25');
  await page.getByRole('button', { name: 'Save Draft' }).first().click();
  text = await said(/Draft saved/);
  const number = (text.match(/SO-\d+/) || [])[0];
  check('the draft is saved and shows its order number', Boolean(number), text);
  await shot('1-draft-saved');

  // A second line after the draft was saved: it used to be left out of the submitted order.
  await page.getByRole('button', { name: 'Material', exact: true }).click();
  await page.getByLabel('Quantity for line 2').waitFor();
  await page.getByLabel('Enter description or pick material').nth(1).fill(`QA flow bar ${stamp}`);
  await page.getByLabel('Quantity for line 2').fill('2');
  await page.getByLabel('Unit price for line 2').fill('10');
  await page.getByRole('button', { name: 'Submit Order' }).first().click();
  text = await said(/submitted/i, 12000);
  check('submitting says the order is on the Order Board', /submitted/i.test(text) && /2 work orders are in New Orders/.test(text), text);
  await shot('2-submitted');
  await page.waitForURL(/\/orders\/[0-9a-f-]{36}/, { timeout: 10000 }).catch(() => {});
  const orderId = (page.url().match(/orders\/([0-9a-f-]{36})/) || [])[1];
  const saved = (await api(`/api/orders/intake/${orderId}`)).body?.data;
  check('the submitted order holds both lines, the one added after the draft too', saved?.lines?.length === 2 && saved.lines[1].description === `QA flow bar ${stamp}` && Number(saved.lines[0].qty) === 4, saved?.lines?.map((l) => l.description));
  const jobs = (await api(`/api/jobs?orderId=${orderId}`)).body || [];
  check('each line has a work order, new and not planned', jobs.length === 2 && jobs.every((j) => j.status === 'ORDERED' && j.orderNumber === number), jobs.map((j) => `${j.jobNumber} ${j.status}`));

  // ── 2. The order page points at the board ──
  await page.locator('[data-testid="order-work-orders"]').waitFor({ timeout: 8000 }).catch(() => {});
  const panel = await page.locator('[data-testid="order-work-orders"]').innerText().catch(() => '');
  check('the order page lists its work orders', jobs.every((j) => panel.includes(j.jobNumber)) && /New, not planned/.test(panel), panel);
  check('Create Work Orders is not offered again once every line has one', (await page.getByRole('button', { name: 'Create Work Orders' }).count()) === 0);
  await shot('3-order-page');
  await page.click('[data-testid="see-on-board"]');
  await page.waitForURL(/order-board/, { timeout: 10000 }).catch(() => {});
  await page.getByPlaceholder(/Search jobs/).waitFor({ timeout: 10000 }).catch(() => {});

  // ── 3. The Order Board ──
  await page.getByText(jobs[0].jobNumber).first().waitFor({ timeout: 12000 }).catch(() => {});
  const column = page.locator('div', { hasText: /^New Orders/ }).first();
  const board = await page.locator('body').innerText();
  check('the board opens narrowed to the order, with its jobs under New Orders', jobs.every((j) => board.includes(j.jobNumber)) && /New Orders\s*2 jobs/.test(board.replace(/\n+/g, ' ')), board.slice(board.indexOf('New Orders'), board.indexOf('New Orders') + 80));
  check('a card shows the order number', board.includes(number));
  await shot('4-board');
  void column;

  // ── 4. Plan the job ──
  const job = jobs[0];
  await page.getByText(job.jobNumber).first().click();
  await page.locator('[role=dialog]').getByText(`Plan Job: ${job.jobNumber}`).waitFor();
  await page.waitForTimeout(1500);
  const orderBranch = branches.find((b) => b.code === saved.location || b.id === saved.locationId) || null;
  const planned = (await api(`/api/jobs?orderId=${orderId}`)).body.find((j) => j.id === job.id);
  const dialogText = await page.locator('[role=dialog]').innerText();
  const branchName = (await api('/api/v1/dispatch/locations')).body?.data?.find((l) => l.id === planned.orderLocationId)?.name || '';
  check('the plan starts at the branch the order was taken for', Boolean(branchName) && dialogText.includes(branchName), `${branchName} | ${dialogText.slice(0, 200)}`);
  check('the branch is shown by name, without its record id', !/\([0-9a-f]{8}-[0-9a-f]{4}/.test(dialogText));
  // Templates: only ones every step of which this company has a work center type for.
  const offered = await page.locator('[role=dialog] .MuiChip-root', { hasText: '→' }).allInnerTexts();
  for (const label of offered.slice(0, 1)) {
    await page.locator('[role=dialog] .MuiChip-root', { hasText: label }).first().click();
    const empty = await page.locator('[role=dialog]').getByLabel(/Work Center Type/).evaluateAll((els) => els.filter((e) => !(e.textContent || '').trim() || e.textContent.trim() === '​').length);
    check(`the template "${label}" fills every step with a real work center type`, empty === 0, `${empty} empty`);
  }
  if (!offered.length) check('with no template that fits, the box says so', await page.locator('[data-testid="no-templates"]').isVisible());
  void orderBranch;

  // One step of a kind this branch has a machine for, typed through the API the dialog uses, then saved from the dialog.
  const here = machines.filter((m) => m.locationId === planned.orderLocationId && m.isOnline !== false);
  const type = types.find((t) => here.some((m) => m.workCenterType === t.id));
  check('the order\'s branch has a machine of a known type to plan on', Boolean(type), `${here.length} machines at the branch`);
  // Start from a clean route in the dialog.
  while (await page.locator('[role=dialog]').getByRole('button', { name: /delete|remove/i }).count()) await page.locator('[role=dialog]').getByRole('button', { name: /delete|remove/i }).first().click();
  await page.locator('[role=dialog]').getByRole('button', { name: 'Add Step' }).click();
  await page.locator('[role=dialog]').getByLabel(/Work Center Type/).first().click();
  await page.getByRole('option', { name: type.label, exact: true }).first().click();
  await shot('5-plan-job');
  await page.locator('[role=dialog]').getByRole('button', { name: 'Plan Job' }).click();
  text = await said(/planned/i);
  await shot('5b-planned');
  check('the job is planned and moves to Planned Jobs', /planned and moved to Scheduled/i.test(text), text || (await page.locator('[role=dialog]').innerText().catch(() => '')).slice(0, 200));
  const after = (await api(`/api/jobs/${job.id}`)).body;
  check('the job is scheduled in the database', after?.status === 'SCHEDULED', after?.status);
  const plan = (await api(`/api/jobs/${job.id}/plan`)).body;
  check('its route is at the order\'s branch', plan?.dispatchJob?.locationId === planned.orderLocationId, plan?.dispatchJob?.locationId);

  // ── 5. Run Dispatch ──
  await page.goto(`${APP}/shopfloor`);
  await page.getByRole('button', { name: /Run Dispatch/ }).waitFor();
  await page.waitForTimeout(2500);
  // The shop floor opens at the person's home branch; choose the order's branch.
  const picker = page.getByLabel('Location').first();
  if (!((await picker.innerText().catch(() => '')).includes(branchName))) { await picker.click(); await page.getByRole('option', { name: new RegExp(branchName.replace(/[()]/g, '\\$&')) }).first().click(); await page.waitForTimeout(1500); }
  await page.getByRole('button', { name: /Run Dispatch/ }).click();
  text = await said(/Assigned|Nothing was waiting/, 20000);
  await shot('6-dispatch');
  const steps = (await api(`/api/jobs/${job.id}/plan`)).body?.operations || [];
  check('Run Dispatch places the planned step on a machine', steps.length === 1 && Boolean(steps[0].assignedWorkCenterId) && steps[0].status === 'SCHEDULED', steps.map((o) => `${o.status} ${o.assignedWorkCenterId}`));
  check('and says what it did', /Assigned \d+ step/.test(text), text);
  check('it also says the other new job still needs a route', /no route yet/.test(text) && /Plan Job/.test(text), text);
  await page.getByRole('button', { name: /Run Dispatch/ }).click();
  await page.waitForTimeout(3000);
  text = (await page.locator('.MuiSnackbar-root').allInnerTexts()).join(' | ');
  check('a second run with nothing new says nothing was waiting, not "Assigned 0"', /Nothing was waiting|could not be placed/.test(text), text);

  // ── 6. An order submitted the old way (no work orders) can be finished from the Orders list ──
  const old = await api('/api/orders/intake', 'POST', { source: 'PHONE', division: saved.division || 'METALS', location: saved.location, priority: 'STANDARD', customerId: saved.customerId, customerName: saved.customerName, poNumber: `OLD-${stamp}`, lines: [{ description: `QA old way ${stamp}`, qty: 1, uom: 'EA', unitPrice: 5, extPrice: 5 }] });
  const oldId = old.body?.data?.id;
  const oldNumber = old.body?.data?.orderNumber;
  const sub = await api(`/api/orders/intake/${oldId}/submit`, 'POST', {});
  const oldBefore = (await api(`/api/jobs?orderId=${oldId}`)).body || [];
  check('an order submitted without work orders has none', sub.status === 200 && oldBefore.length === 0, `submit ${sub.status}, ${oldBefore.length} jobs, create ${old.status}`);
  await page.goto(`${APP}/orders`);
  await page.getByText(oldNumber, { exact: true }).first().click();
  await page.locator('[data-testid="needs-work-orders"]').waitFor({ timeout: 8000 }).catch(() => {});
  check('the Orders list says the order is not on the board yet', await page.locator('[data-testid="needs-work-orders"]').isVisible());
  check('the Orders list can open the order', await page.getByRole('button', { name: 'Open Order' }).isVisible());
  await shot('7-orders-list');
  await page.getByRole('button', { name: 'Create Work Orders' }).click();
  await page.locator('[data-testid="orders-notice"]').waitFor({ timeout: 10000 }).catch(() => {});
  text = await page.locator('[data-testid="orders-notice"]').innerText().catch(() => '');
  const oldJobs = (await api(`/api/jobs?orderId=${oldId}`)).body || [];
  check('Create Work Orders on the Orders list makes the job and says where it is', oldJobs.length === 1 && oldJobs[0].status === 'ORDERED' && /1 work order is now under New Orders/.test(text), `${oldJobs.length} jobs | ${text}`);
  check('the order then offers the board, not the button again', await page.getByRole('button', { name: 'See on Order Board' }).first().isVisible() && !(await page.getByRole('button', { name: 'Create Work Orders' }).count()));
  await shot('8-orders-list-done');
  // ── 7. In a narrow window the details are out of sight, so a click on an order opens its page ──
  await page.setViewportSize({ width: 800, height: 720 });
  await page.goto(`${APP}/orders`);
  await page.getByText(oldNumber, { exact: true }).first().click();
  await page.waitForURL(new RegExp(`/orders/${oldId}`), { timeout: 8000 }).catch(() => {});
  check('in a narrow window, clicking an order in the list opens the order', page.url().includes(`/orders/${oldId}`), page.url());
  await page.locator('[data-testid="order-work-orders"]').waitFor({ timeout: 8000 }).catch(() => {});
  check('and the order shows its work order', (await page.locator('[data-testid="order-work-orders"]').innerText().catch(() => '')).includes(oldJobs[0]?.jobNumber || 'none'));
  await page.setViewportSize({ width: 1280, height: 860 });
  await page.goto(`${APP}/orders`);
  await page.getByText(oldNumber, { exact: true }).first().dblclick();
  await page.waitForURL(new RegExp(`/orders/${oldId}`), { timeout: 8000 }).catch(() => {});
  check('in a wide window, a double click opens the order', page.url().includes(`/orders/${oldId}`), page.url());
  check('no script error on the way', errors.length === 0, errors.join(' | ').slice(0, 300));

  await browser.close();
  console.log(`order flow screens: ${passed} passed, ${failed.length} failed`);
  for (const f of failed) console.log(`  FAILED: ${f}`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
