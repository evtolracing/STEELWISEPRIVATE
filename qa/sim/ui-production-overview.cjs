#!/usr/bin/env node
// Production screens count the same jobs the same way, in a real browser on the QA server and QA database.
// Written after the owner's audit request of 2026-11-21: the shop floor counted steps (and every step ever
// finished) as "operations"; the planning page found no machine for jobs; the workflow boards offered made-up
// branches (Phoenix, Denver), machines and divisions (Division A); and filtering jobs by branch matched only jobs
// with an old machine field set, so a branch's new jobs were missing.
//   node qa/sim/ui-production-overview.cjs --app http://localhost:5199 --api http://localhost:3001
const { chromium } = require('playwright');

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const APP = arg('app', 'http://localhost:5199');
const API = arg('api', 'http://localhost:3001');
let passed = 0;
const failed = [];
const check = (name, ok, detail = '') => { if (ok) passed += 1; else failed.push(`${name} ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`.slice(0, 420)); };
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

(async () => {
  const who = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'qa-admin@qa.test', password: 'qa-password-1' }) }).then((r) => r.json());
  if (!who.token) throw new Error('QA sign-in failed. Is the QA server running with the fixtures loaded?');
  const api = async (url, method = 'GET', body) => { const r = await fetch(API + url, { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${who.token}` }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, body: await r.json().catch(() => null) }; };
  const stamp = Date.now().toString(36).toUpperCase();
  const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()).toISOString(); };
  const overview = async (q = '') => (await api(`/api/jobs/overview?since=${encodeURIComponent(today())}${q}`)).body;

  // ── An order at a branch with a machine; its job not yet planned ──
  const branches = (await api('/api/orders/intake/branches')).body?.data || [];
  const types = ((await api('/api/v1/dispatch/work-center-types')).body?.data || []).filter((t) => t.isActive !== false);
  const machines = ((await api('/api/v1/dispatch/work-centers')).body?.data || []).filter((m) => m.isOnline !== false);
  const branch = branches.find((b) => machines.some((m) => m.locationId === b.id && types.some((t) => t.id === m.workCenterType)));
  if (!branch) throw new Error('No order branch with a machine of a known type in the QA data.');
  const type = types.find((t) => machines.some((m) => m.locationId === branch.id && m.workCenterType === t.id));
  const customers = (await api('/api/customers?search=QA%20Customer&limit=5')).body;
  const customer = (customers?.data || customers || [])[0];
  const due = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const made = await api('/api/orders/intake', 'POST', { source: 'PHONE', division: 'METALS', location: branch.code, priority: 'STANDARD', customerId: customer.id, customerName: customer.name, poNumber: `PROD-${stamp}`, requestedDate: due, lines: [{ description: `QA production ${stamp}`, qty: 2, uom: 'EA', unitPrice: 20, extPrice: 40 }] });
  const orderId = made.body?.data?.id;
  await api(`/api/orders/intake/${orderId}/submit`, 'POST', { createWorkOrders: true });
  const job = ((await api(`/api/jobs?orderId=${orderId}`)).body || [])[0];
  if (!job) throw new Error('No job for the order.');
  const order = (await api(`/api/orders/${orderId}`)).body;
  const at = order.locationId || branch.id;

  const byBranch = (await api(`/api/jobs?locationId=${at}`)).body || [];
  check('a new job is listed at the branch that sold its order before it is planned', byBranch.some((j) => j.id === job.id), `${byBranch.length} jobs at the branch`);
  let ov = await overview(`&locationId=${at}`);
  let row = ov?.jobs?.find((j) => j.id === job.id);
  check('the overview puts the new job at that branch, not planned, with its order and customer', row?.stage === 'NOT_PLANNED' && row?.locationId === at && Boolean(row?.locationName) && row?.orderNumber === made.body?.data?.orderNumber && row?.customerName === customer.name, JSON.stringify(row));
  check('the overview refuses a start of day it cannot read', (await api('/api/jobs/overview?since=yesterday-ish')).status === 400);

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  await context.addInitScript(([t, u]) => { localStorage.setItem('token', t); localStorage.setItem('user', JSON.stringify(u)); localStorage.removeItem('sw.branchId'); }, [who.token, who.user]);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const main = async () => page.locator('main').innerText().catch(() => '');
  const figure = async (testid, label) => {
    const text = await page.locator(`[data-testid="${testid}"]`).innerText().catch(() => '');
    const m = new RegExp(`${label}\\s*\\n\\s*(\\d+)`).exec(text);
    return m ? Number(m[1]) : null;
  };
  const pickBranch = async (testid, name) => {
    await page.locator(`[data-testid="${testid}"]`).click();
    await page.getByRole('option', { name, exact: true }).click();
  };

  // ── The shop floor at the branch ──
  const openFloor = async () => {
    await page.goto(`${APP}/shopfloor`);
    await page.locator('[data-testid="shopfloor-summary"]').waitFor({ timeout: 15000 }).catch(() => {});
    const shownBranch = await page.locator('#shopfloor-location-label + div').innerText().catch(() => '');
    if (!shownBranch.includes(branch.name)) {
      await page.getByLabel('Location').click();
      await page.getByRole('option', { name: branch.name, exact: true }).click();
      await page.waitForTimeout(1500);
    }
  };
  // The page loads its location after its branches; before them it must not say "No work centers".
  await page.goto(`${APP}/shopfloor`);
  const early = await page.locator('main').innerText().catch(() => '');
  check('while it loads, the shop floor does not claim there are no work centers', !/No work centers at this location/.test(early) || (await page.locator('[data-testid="shopfloor-summary"]').count()) > 0, early.slice(0, 200));
  await openFloor();
  let text = await main();
  ov = await overview(`&locationId=${branch.id}`);
  check('the shop floor counts jobs, not steps, and no longer shows "Total Operations"', /In production/.test(text) && /Not planned/.test(text) && !/Total Operations/.test(text), text.slice(0, 300));
  check('its Not planned and In production figures are the server\'s for the branch', (await figure('shopfloor-summary', 'Not planned')) === ov.counts.NOT_PLANNED && (await figure('shopfloor-summary', 'In production')) === ov.counts.inProduction, `${await figure('shopfloor-summary', 'Not planned')} vs ${ov.counts.NOT_PLANNED}`);

  // ── Planned and placed: Queued ──
  await api(`/api/jobs/${job.id}/plan`, 'POST', { operations: [{ workCenterType: type.id, name: `${type.label || type.id} step` }], division: 'METALS', dueDate: due, locationId: branch.id });
  await api('/api/v1/dispatch/run', 'POST', { locationId: branch.id });
  const step = ((await api(`/api/jobs/${job.id}/plan`)).body?.operations || [])[0];
  const machine = machines.find((m) => m.id === step?.assignedWorkCenterId);
  check('set-up: the job is planned and placed on a machine', Boolean(machine), JSON.stringify(step || null).slice(0, 200));
  await page.getByRole('button', { name: 'Refresh' }).click();
  await page.waitForTimeout(1500);
  ov = await overview(`&locationId=${branch.id}`);
  row = ov.jobs.find((j) => j.id === job.id);
  check('once placed the job is Queued on its machine at the plan\'s branch', row?.stage === 'QUEUED' && row?.workCenterId === machine?.id && row?.locationId === branch.id, JSON.stringify(row));
  check('the shop floor Queued figure is the server\'s', (await figure('shopfloor-summary', 'Queued')) === ov.counts.QUEUED, `${await figure('shopfloor-summary', 'Queued')} vs ${ov.counts.QUEUED}`);
  const card = page.locator('.MuiCard-root', { hasText: machine?.name || '???' }).first();
  const cardText = await card.innerText().catch(() => '');
  const wcOv = ov.workCenters.find((w) => w.id === machine?.id);
  check('the machine card shows Queued, Running and Done today from the server', /Queued/.test(cardText) && /Running/.test(cardText) && /Done today/.test(cardText) && new RegExp(`${wcOv?.queued}\\s*\\n\\s*Queued`).test(cardText), `${cardText.replace(/\n/g, ' | ')} vs ${JSON.stringify(wcOv)}`);

  // ── Run and finish the step: Running, then a step done today ──
  const operatorId = ((await api(`/api/jobs/${job.id}/plan`)).body?.operations || [])[0]?.assignedOperatorId
    || ((await api('/api/v1/dispatch/operators')).body?.data || []).find((o) => o.homeLocationId === branch.id)?.id;
  const started = await api(`/api/v1/operations/${step.id}/start`, 'POST', { operatorId, workCenterId: machine.id });
  ov = await overview(`&locationId=${branch.id}`);
  check('a started step makes the job Running', started.status === 200 && ov.jobs.find((j) => j.id === job.id)?.stage === 'RUNNING', `${started.status} ${JSON.stringify(started.body).slice(0, 160)}`);
  const doneBefore = ov.workCenters.find((w) => w.id === machine.id)?.doneToday || 0;
  await api(`/api/v1/operations/${step.id}/complete`, 'POST', {});
  ov = await overview(`&locationId=${branch.id}`);
  check('a finished step counts as done today on its machine, and the job leaves the floor', (ov.workCenters.find((w) => w.id === machine.id)?.doneToday || 0) === doneBefore + 1 && ['WAITING_QC', 'PACKAGING'].includes(ov.jobs.find((j) => j.id === job.id)?.stage), JSON.stringify(ov.workCenters.find((w) => w.id === machine.id)));
  await page.getByRole('button', { name: 'Refresh' }).click();
  await page.waitForTimeout(1500);
  check('the shop floor Steps done today figure is the server\'s', (await figure('shopfloor-summary', 'Steps done today')) === ov.stepsDoneToday, `${await figure('shopfloor-summary', 'Steps done today')} vs ${ov.stepsDoneToday}`);

  // ── Division filter on the shop floor: only real divisions, and it narrows the machines ──
  const divisions = ((await api('/api/v1/dispatch/divisions')).body?.data || []).filter((d) => d.isActive !== false);
  await page.locator('[data-testid="shopfloor-division"]').click();
  const divOptions = await page.getByRole('option').allInnerTexts();
  check('the shop floor division list is the divisions on file', divOptions.length === divisions.length + 1 && divisions.every((d) => divOptions.includes(d.label || d.id)), divOptions.join(', '));
  const other = divisions.find((d) => !machines.filter((m) => m.locationId === branch.id).some((m) => m.division === d.id)) || divisions[0];
  await page.getByRole('option', { name: other.label || other.id, exact: true }).click();
  await page.waitForTimeout(1500);
  const filteredOv = await overview(`&locationId=${branch.id}&division=${other.id}`);
  const cards = await page.locator('.MuiCard-root', { hasText: /Done today/ }).count();
  check('a division with no machines here shows none, and the counts are that division\'s', cards === filteredOv.workCenters.length && (await figure('shopfloor-summary', 'In production')) === filteredOv.counts.inProduction, `${cards} cards vs ${filteredOv.workCenters.length}; ${await figure('shopfloor-summary', 'In production')} vs ${filteredOv.counts.inProduction}`);

  // ── Planning page ──
  await page.goto(`${APP}/planning`);
  await page.locator('[data-testid="planning-counts"]').waitFor({ timeout: 15000 }).catch(() => {});
  await pickBranch('production-branch', branch.name);
  await page.waitForTimeout(1500);
  ov = await overview(`&locationId=${branch.id}`);
  check('the planning page counts by stage for the branch picked, from the server', (await figure('planning-counts', 'Not planned')) === ov.counts.NOT_PLANNED && (await figure('planning-counts', 'Queued')) === ov.counts.QUEUED && (await figure('planning-counts', 'Waiting QC')) === ov.counts.WAITING_QC, `${await page.locator('[data-testid="planning-counts"]').innerText().catch(() => '')} vs ${JSON.stringify(ov.counts)}`);
  const planningMachines = await page.locator('[data-testid="planning-machine"]').allInnerTexts();
  check('the planning page lists that branch\'s machines with Running, Queued and Done today', planningMachines.length === ov.workCenters.length && planningMachines.every((t) => t.includes(branch.name) && /Done today/.test(t)), `${planningMachines.length} vs ${ov.workCenters.length}`);

  // ── Workflow board: real lists, the job in its stage with its branch ──
  await page.goto(`${APP}/planning/workflow`);
  await page.locator('[data-testid="production-branch"]').waitFor({ timeout: 15000 }).catch(() => {});
  await page.locator('[data-testid="production-branch"]').click();
  const branchOptions = await page.getByRole('option').allInnerTexts();
  await page.keyboard.press('Escape');
  check('the workflow board offers the branches on file, not Phoenix, Denver or Riverside', branchOptions.includes(branch.name) && !branchOptions.some((o) => /Phoenix|Denver|Riverside|Location 1/.test(o)), branchOptions.join(', '));
  await page.locator('[data-testid="production-division"]').click();
  const wfDivisions = await page.getByRole('option').allInnerTexts();
  await page.keyboard.press('Escape');
  check('and the divisions on file, not "Division A"', !wfDivisions.some((o) => /Division A|Division B/.test(o)) && divisions.every((d) => wfDivisions.includes(d.label || d.id)), wfDivisions.join(', '));
  await pickBranch('production-branch', branch.name);
  await page.waitForTimeout(1500);
  const stage = ov.jobs.find((j) => j.id === job.id)?.stage;
  const column = page.locator(`[data-testid="stage-${stage}"]`);
  const colText = await column.innerText().catch(() => '');
  check('the job is in its stage column with its order, customer and branch, and no record id', colText.includes(job.jobNumber) && colText.includes(branch.name) && colText.includes(customer.name) && !UUID.test(colText), colText.slice(0, 300));
  const colCount = Number(await column.locator('[data-testid="stage-count"]').innerText().catch(() => '-1'));
  check('each column\'s count is the server\'s', colCount === ov.counts[stage], `${colCount} vs ${ov.counts[stage]}`);

  // ── Old screens go to the real ones ──
  await page.goto(`${APP}/production`);
  await page.waitForURL(/\/planning\/workflow/, { timeout: 8000 }).catch(() => {});
  check('/production opens the workflow board (the old one had made-up filters)', page.url().includes('/planning/workflow'), page.url());
  await page.goto(`${APP}/production/shop-floor`);
  await page.waitForURL(/\/shopfloor$/, { timeout: 8000 }).catch(() => {});
  check('/production/shop-floor opens the shop floor', /\/shopfloor$/.test(page.url()), page.url());
  check('no script error on the way', errors.length === 0, errors.join(' | ').slice(0, 300));

  await browser.close();
  console.log(`production screens: ${passed} passed, ${failed.length} failed`);
  for (const f of failed) console.log(`  FAILED: ${f}`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
