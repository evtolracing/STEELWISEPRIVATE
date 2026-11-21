#!/usr/bin/env node
// Time tracking, in a real browser on the QA server and QA database: a step is started, paused with a
// reason, started again and finished, and the Time Tracking screen must show that time.
// Written 2026-11-21: on the live site the screen had always been empty, because it looked for the clock
// records in a list that never carried them; and the running clock on the shop floor always read 0s.
//   node qa/sim/ui-time-tracking.cjs --app http://localhost:5199 --api http://localhost:3001 [--shots folder]
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
const secondsOf = (text) => { const m = /(?:(\d+)h )?(?:(\d+)m )?(\d+)s/.exec(text || ''); return m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + +m[3] : -1; };

(async () => {
  const who = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'qa-admin@qa.test', password: 'qa-password-1' }) }).then((r) => r.json());
  if (!who.token) throw new Error('QA sign-in failed. Is the QA server running with the fixtures loaded?');
  const api = async (url, method = 'GET', body) => { const r = await fetch(API + url, { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${who.token}` }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, body: await r.json().catch(() => null) }; };
  const stamp = Date.now().toString(36).toUpperCase();

  // ── Set up through the API: an order at a branch with a machine, its job planned and placed ──
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
  const made = await api('/api/orders/intake', 'POST', { source: 'PHONE', division: 'METALS', location: branch.code, priority: 'STANDARD', customerId: customer.id, customerName: customer.name, poNumber: `TIME-${stamp}`, requestedDate: due, lines: [{ description: `QA time bar ${stamp}`, qty: 2, uom: 'EA', unitPrice: 20, extPrice: 40 }] });
  const orderId = made.body?.data?.id;
  const orderNumber = made.body?.data?.orderNumber;
  await api(`/api/orders/intake/${orderId}/submit`, 'POST', { createWorkOrders: true });
  const job = ((await api(`/api/jobs?orderId=${orderId}`)).body || [])[0];
  if (!job) throw new Error('No job for the order.');
  await api(`/api/jobs/${job.id}/plan`, 'POST', { operations: [{ workCenterType: type.id, name: `${type.label || type.id} step` }], division: 'METALS', dueDate: due, locationId: branch.id });
  await api('/api/v1/dispatch/run', 'POST', { locationId: branch.id });
  const step = ((await api(`/api/jobs/${job.id}/plan`)).body?.operations || [])[0];
  check('set-up: the job is planned and placed on a machine', Boolean(step?.assignedWorkCenterId), JSON.stringify(step || null).slice(0, 200));
  if (!step?.assignedWorkCenterId) throw new Error(`The job was not placed: ${failed.join(' | ')}`);
  const machine = machines.find((m) => m.id === step.assignedWorkCenterId);

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 860 }, acceptDownloads: true, deviceScaleFactor: Number(arg('scale', '1')) });
  await context.addInitScript(([t, u]) => { localStorage.setItem('token', t); localStorage.setItem('user', JSON.stringify(u)); }, [who.token, who.user]);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const shot = async (name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: `${SHOTS}/${name}.png` }); } };
  const main = async () => page.locator('main').innerText().catch(() => page.locator('body').innerText());

  // ── 1. The running clock on the shop floor counts, and keeps its time when the screen is opened again ──
  const openQueue = async () => {
    await page.goto(`${APP}/shopfloor/${machine.id}?locationId=${branch.id}`);
    await page.locator('[data-testid="queue-job-title"]').first().waitFor({ timeout: 15000 }).catch(() => {});
    await page.locator('tr', { hasText: job.jobNumber }).first().click().catch(() => {});
    await page.locator('[data-testid="queue-job-title"]', { hasText: job.jobNumber }).waitFor({ timeout: 8000 }).catch(() => {});
  };
  await openQueue();
  await page.getByRole('button', { name: 'START' }).click();
  const clock = page.locator('[data-testid="running-clock"]');
  await clock.waitFor({ timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(3200);
  const first = secondsOf(await clock.innerText().catch(() => ''));
  check('the running clock counts up after START', first >= 2 && first < 60, `${first}s`);
  await openQueue();
  await clock.waitFor({ timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1200);
  const again = secondsOf(await clock.innerText().catch(() => ''));
  await shot('1-running-clock');
  check('opened again, the clock carries on from the start, not from zero', again >= first + 1 && again < 120, `first ${first}s then ${again}s`);

  // ── 2. While the clock runs, Time Tracking lists it as running, counting ──
  const operatorId = ((await api(`/api/jobs/${job.id}/plan`)).body?.operations || [])[0]?.assignedOperatorId;
  const operator = ((await api('/api/v1/dispatch/operators')).body?.data || []).find((o) => o.id === operatorId);
  await page.goto(`${APP}/time-tracking`);
  const row = () => page.locator('[data-testid="time-entry"]', { hasText: job.jobNumber });
  await row().first().waitFor({ timeout: 15000 }).catch(() => {});
  let text = await row().first().innerText().catch(() => '');
  const before = secondsOf(text);
  await page.waitForTimeout(2200);
  const after = secondsOf(await row().first().innerText().catch(() => ''));
  check('time tracking lists the running clock with the job, order, machine and operator by name', text.includes(job.jobNumber) && text.includes(orderNumber) && text.includes(machine.name) && Boolean(operator) && text.includes(operator.name) && /Running/.test(text), text);
  check('and its time counts up on screen', before >= 1 && after > before, `${before}s then ${after}s`);

  // ── 3. Paused with a reason, started again, finished: three entries ──
  const paused = await api(`/api/v1/operations/${step.id}/pause`, 'POST', { downtimeReason: `Blade change ${stamp}` });
  await new Promise((r) => setTimeout(r, 1100));
  const restarted = await api(`/api/v1/operations/${step.id}/start`, 'POST', { operatorId, workCenterId: machine.id });
  await new Promise((r) => setTimeout(r, 2100));
  const done = await api(`/api/v1/operations/${step.id}/complete`, 'POST', {});
  check('set-up: the step is paused, started again and finished', paused.status === 200 && restarted.status === 200 && done.status === 200, `pause ${paused.status} start ${restarted.status} complete ${done.status} ${JSON.stringify(restarted.body).slice(0, 160)}`);
  await page.getByRole('button', { name: 'Refresh' }).click();
  await page.waitForFunction((n) => document.querySelectorAll('[data-testid="time-entry"]').length > 0 && [...document.querySelectorAll('[data-testid="time-entry"]')].filter((r) => r.innerText.includes(n)).length === 2, job.jobNumber, { timeout: 10000 }).catch(() => {});
  const mine = await row().allInnerTexts();
  await shot('2-time-tracking');
  check('the job has two entries: one paused with its reason, one complete', mine.length === 2 && mine.some((t) => /Paused/.test(t) && t.includes(`Blade change ${stamp}`)) && mine.some((t) => /Complete/.test(t)), mine.join(' || '));
  check('every entry shows a time of at least a second, never "Active" or a dash', mine.every((t) => secondsOf(t) >= 1 && !/Active|—/.test(t)), mine.join(' || '));
  const table = await page.locator('[data-testid="time-entries"]').innerText().catch(() => '');
  check('no record id is shown in the list', !UUID.test(table), (table.match(UUID) || [''])[0]);
  const cards = await page.locator('[data-testid="time-summary"]').innerText().catch(() => '');
  check('the Total Time card is more than zero', secondsOf((cards.match(/Total Time\s+([^\n]+)/) || [])[1]) >= 2, cards.slice(0, 200));

  // ── 4. Filters, the two summaries and the file ──
  await page.locator('main').getByLabel('Status', { exact: true }).click();
  await page.getByRole('option', { name: 'Paused' }).click();
  await page.waitForTimeout(400);
  const pausedOnly = await page.locator('[data-testid="time-entry"]').allInnerTexts();
  check('the Status filter leaves only paused entries', pausedOnly.length >= 1 && pausedOnly.every((t) => /Paused/.test(t)) && pausedOnly.some((t) => t.includes(job.jobNumber)), pausedOnly.slice(0, 3).join(' || '));
  await page.locator('main').getByLabel('Status', { exact: true }).click();
  await page.getByRole('option', { name: 'All Statuses' }).click();
  await page.locator('main').getByLabel('Operator', { exact: true }).click();
  await page.getByRole('option', { name: operator?.name || 'no operator' }).click().catch(() => {});
  await page.waitForTimeout(400);
  const byPerson = await page.locator('[data-testid="time-entry"]').allInnerTexts();
  check('the Operator filter leaves only that operator', byPerson.length >= 2 && byPerson.every((t) => t.includes(operator?.name)), byPerson.slice(0, 3).join(' || '));
  await page.getByRole('tab', { name: 'By Operator' }).click();
  text = await main();
  check('By Operator shows the operator by name with a total', Boolean(operator) && new RegExp(`${operator.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]{0,40}\\d+s`).test(text) && !UUID.test(text), text.slice(-400));
  await page.getByRole('tab', { name: 'By Work Center' }).click();
  text = await main();
  check('By Work Center shows the machine by name with a total', text.includes(machine.name) && !UUID.test(text), text.slice(-400));
  const [download] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }).catch(() => null), page.getByRole('button', { name: 'Export CSV' }).click()]);
  const file = download ? fs.readFileSync(await download.path(), 'utf8') : '';
  check('Export CSV gives a file with the job, the operator by name and hours as a number', file.startsWith('"Job","Order"') && file.includes(job.jobNumber) && file.includes(operator?.name) && /"\d+\.\d\d","\d/.test(file) && !UUID.test(file), file.slice(0, 300));

  // ── 5. Dates: a range that ends yesterday has none of today's entries, and the server refuses nonsense ──
  await page.getByRole('tab', { name: 'Time Log Details' }).click();
  const y = new Date(Date.now() - 86400000);
  const yesterday = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
  await page.locator('main').getByLabel('To', { exact: true }).fill(yesterday);
  await page.waitForTimeout(1500);
  check('with To set to yesterday, today\'s entries are gone', (await row().count()) === 0, `${await row().count()} rows`);
  const bad = await api('/api/v1/operations/time-entries?from=not-a-date');
  const all = await api('/api/v1/operations/time-entries?limit=1');
  check('the server refuses a date it cannot read, and says when a list is cut short', bad.status === 400 && all.status === 200 && all.body?.data?.length === 1 && all.body?.limited === (all.body?.total > 1), `bad ${bad.status} all ${all.status} ${JSON.stringify(all.body).slice(0, 120)}`);
  check('no script error on the way', errors.length === 0, errors.join(' | ').slice(0, 300));

  await browser.close();
  console.log(`time tracking screens: ${passed} passed, ${failed.length} failed`);
  for (const f of failed) console.log(`  FAILED: ${f}`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
