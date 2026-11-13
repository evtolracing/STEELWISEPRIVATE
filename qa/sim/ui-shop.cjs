#!/usr/bin/env node
// Shop screens driven like a person would, in a real browser, against the QA server.
// Covers the job, schedule, time tracking and work order screens, which used to show
// made-up jobs or save nothing (findings M-001 to M-010).
//   node qa/sim/ui-shop.cjs --app http://localhost:5199 --api http://localhost:3001
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const APP = arg('app', 'http://localhost:5199');
const API = arg('api', 'http://localhost:3001');
const OUT = arg('out', 'qa/results/ui-shop.json');

(async () => {
  const signIn = (email) => fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'qa-password-1' }) }).then((r) => r.json());
  const [clerk, operator, boss] = await Promise.all([signIn('qa-csr@qa.test'), signIn('qa-operator@qa.test'), signIn('qa-admin@qa.test')]);
  if (!clerk.token || !operator.token || !boss.token) throw new Error('login failed');
  const api = async (method, url, who, body) => {
    const r = await fetch(API + url, { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${who.token}` }, body: body ? JSON.stringify(body) : undefined });
    return { status: r.status, body: await r.json().catch(() => null) };
  };
  const operatorName = [operator.user?.firstName, operator.user?.lastName].filter(Boolean).join(' ');
  const browser = await chromium.launch();
  const contextFor = async (who) => {
    const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    await context.addInitScript(([t, u]) => { localStorage.setItem('token', t); if (u) localStorage.setItem('user', JSON.stringify(u)); }, [who.token, who.user]);
    return context;
  };
  const floor = await contextFor(operator);
  const office = await contextFor(boss);
  const checks = [];
  const check = (name, ok, detail = '') => { checks.push({ name, ok: Boolean(ok), detail: ok ? '' : String(detail).slice(0, 300) }); console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `  — ${String(detail).slice(0, 200)}`}`); };
  const open = async (context, url) => { const page = await context.newPage(); page.errors = []; page.on('pageerror', (e) => page.errors.push(e.message)); await page.goto(APP + url, { waitUntil: 'domcontentloaded' }); return page; };
  const body = (page) => page.locator('main').first().innerText({ timeout: 3000 }).catch(() => page.locator('body').innerText());
  const seen = (page, text, timeout = 10000) => page.getByText(text, { exact: true }).first().waitFor({ timeout }).then(() => true).catch(() => false);
  const has = (page, pattern, timeout = 8000) => page.getByText(pattern).first().waitFor({ timeout }).then(() => true).catch(() => false);

  // A real job to work with: scheduled today at a work center, then started by the operator.
  const centers = (await api('GET', '/api/work-centers?isActive=true', clerk)).body;
  const wc = centers[0];
  const start = new Date(); start.setHours(9, 0, 0, 0);
  const made = await api('POST', '/api/jobs', clerk, { workCenterId: wc.id, operationType: 'SLITTING', instructions: 'Browser check: slit to 12 inch', scheduledStart: start.toISOString(), scheduledEnd: new Date(start.getTime() + 2 * 3600000).toISOString(), status: 'SCHEDULED' });
  const job = made.body;
  if (!job?.id) throw new Error(`could not create a job: ${made.status}`);
  await api('POST', `/api/jobs/${job.id}/status`, operator, { status: 'IN_PROCESS', note: 'Coil loaded' });

  // The job screen: the real job, its real history, and a status change that saves.
  {
    const page = await open(floor, `/jobs/${job.id}`);
    const shown = await seen(page, job.jobNumber);
    let text = await body(page);
    check('job: the screen shows the real job, not a sample', shown && text.includes('Browser check: slit to 12 inch') && text.includes(wc.name) && !/ABC Steel Corporation/.test(text), text);
    check('job: the history names who started it and why', text.includes('Coil loaded') && (!operatorName || text.includes(operatorName)), text);
    await page.getByRole('button', { name: 'Change status' }).click();
    await page.getByLabel('New status').click();
    await page.getByRole('option', { name: 'On Hold' }).click();
    await page.getByLabel('Reason (optional)').fill('Blade change');
    await page.getByRole('dialog').getByRole('button', { name: 'Change status' }).click();
    await has(page, /In Process to/);
    text = await body(page);
    const saved = (await api('GET', `/api/jobs/${job.id}`, clerk)).body;
    check('job: a status change is saved on the server', saved?.status === 'ON_HOLD', `server says ${saved?.status}`);
    check('job: the change appears in the history with the reason', text.includes('Blade change') && /In Process to\s+On Hold/i.test(text), text);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await seen(page, job.jobNumber);
    check('job: the change is still there after reloading', (await has(page, 'Blade change')) && /On Hold/.test(await body(page)), await body(page));

    // A move the rules do not allow is refused and the reason is shown.
    await api('POST', `/api/jobs/${job.id}/status`, operator, { status: 'READY_TO_SHIP' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await seen(page, job.jobNumber);
    await page.getByRole('button', { name: 'Change status' }).click();
    await page.getByLabel('New status').click();
    await page.getByRole('option', { name: 'Scheduled' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Change status' }).click();
    const refused = await has(page, /cannot go back/);
    check('job: a move that is not allowed is refused with the reason', refused && (await api('GET', `/api/jobs/${job.id}`, clerk)).body?.status === 'READY_TO_SHIP', await body(page));
    check('job: no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.close();

    const gone = await open(floor, '/jobs/00000000-0000-0000-0000-000000000000');
    check('job: a job that does not exist says so instead of showing a sample', (await has(gone, /not on file/)) && !/ABC Steel Corporation/.test(await body(gone)), await body(gone));
    await gone.close();
  }

  // The schedule: real work centers and the jobs really scheduled today.
  {
    const page = await open(floor, '/schedule');
    const onGrid = await has(page, job.jobNumber, 15000);
    const text = await body(page);
    check('schedule: shows the real work centers and makes no claim it cannot back', text.includes(wc.name) && !/AI-optimized/.test(text), text);
    check('schedule: shows the job really scheduled today', onGrid, text);
    await page.getByText(job.jobNumber).first().click().catch(() => {});
    await page.waitForURL(/\/jobs\/[^/]+$/, { timeout: 8000 }).catch(() => {});
    check('schedule: a job on the schedule opens its own screen', page.url().endsWith(`/jobs/${job.id}`), page.url());
    check('schedule: no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.close();
  }

  // The order board: a job that is past planning opens its own screen.
  {
    const page = await open(floor, '/order-board');
    const onBoard = await has(page, job.jobNumber, 15000);
    await page.getByText(job.jobNumber).first().click().catch(() => {});
    await page.waitForURL(/\/jobs\/[^/]+$/, { timeout: 8000 }).catch(() => {});
    check('order board: clicking a job opens its screen', onBoard && page.url().endsWith(`/jobs/${job.id}`), `${page.url()} on board: ${onBoard}`);
    await page.close();
  }

  // Time tracking never fills in made-up hours.
  {
    const page = await open(floor, '/time-tracking');
    await page.waitForTimeout(2500);
    const text = await body(page);
    check('time tracking: opens without sample data', /Time Tracking/i.test(text) && !/demo data/i.test(text), text);
    check('time tracking: no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.close();
  }

  // Work orders: list, create through the form, start, complete with weights.
  {
    const list = await open(floor, '/work-orders');
    check('work orders: the list opens', (await seen(list, 'Work Orders')) && !/WO-2024-001/.test(await body(list)), await body(list));
    await list.getByRole('button', { name: 'New work order' }).click();
    await list.waitForURL(/\/work-orders\/new$/, { timeout: 8000 }).catch(() => {});
    check('work orders: the form carries no made-up scheduling tip', !/AI Tip|would optimize machine utilization/.test(await body(list)), 'tip is shown');
    await list.getByLabel(/Source Coil/).click();
    await list.getByRole('option').first().click().catch(() => {});
    await list.getByRole('button', { name: /Create Work Order/i }).click().catch(() => {});
    await list.waitForURL(/\/work-orders\/[0-9a-f-]{36}$/, { timeout: 12000 }).catch(() => {});
    const id = (list.url().match(/\/work-orders\/([0-9a-f-]{36})$/) || [])[1];
    check('work orders: the form creates a real work order and opens it', Boolean(id), `${list.url()} ${(await body(list)).slice(0, 200)}`);
    if (id) {
      const wo = (await api('GET', `/api/work-orders/${id}`, clerk)).body;
      await seen(list, wo.woNumber);
      let text = await body(list);
      check('work orders: the screen shows the real work order, not a sample', text.includes(wo.woNumber) && text.includes(wo.sourceCoil.coilNumber) && /Draft/.test(text) && !/Mike Johnson|Acme Steel Co/.test(text), text);
      await list.getByRole('button', { name: 'Start', exact: true }).click();
      await has(list, 'In progress');
      check('work orders: Start is saved on the server', (await api('GET', `/api/work-orders/${id}`, clerk)).body?.status === 'IN_PROGRESS', 'not started');
      await list.getByRole('button', { name: 'Complete', exact: true }).click();
      const input = Number(wo.inputWeightLb);
      await list.getByLabel('Good weight out (lb)').fill(String(input * 3));
      await list.getByRole('button', { name: 'Complete work order' }).click();
      check('work orders: more weight out than went in is refused with the reason', await has(list, /is more than the/), await body(list));
      await list.getByLabel('Good weight out (lb)').fill(String(Math.round(input * 0.95)));
      await list.getByLabel('Scrap (lb)').fill(String(Math.round(input * 0.03)));
      await list.getByRole('button', { name: 'Complete work order' }).click();
      await has(list, /Work order completed|Complete$/);
      await list.waitForTimeout(800);
      const done = (await api('GET', `/api/work-orders/${id}`, clerk)).body;
      text = await body(list);
      check('work orders: Complete is saved with a yield worked out by the server', done?.status === 'COMPLETE' && Number(done.yieldPct) > 90 && Number(done.yieldPct) < 100 && text.includes(`${Number(done.yieldPct)}%`), `server ${done?.status} ${done?.yieldPct}`);
      check('work orders: the history names who did each step', /Draft to\s+In progress/.test(text) && /In progress to\s+Complete/.test(text) && (!operatorName || text.includes(operatorName)), text);
      check('work orders: a finished work order offers no more actions', (await list.getByRole('button', { name: 'Start', exact: true }).count()) === 0 && (await list.getByRole('button', { name: 'Cancel work order' }).count()) === 0, 'buttons still shown');
    }
    check('work orders: no script errors', list.errors.length === 0, list.errors.join(' | '));
    await list.close();
    const gone = await open(floor, '/work-orders/00000000-0000-0000-0000-000000000000');
    check('work orders: one that does not exist says so instead of showing a sample', (await has(gone, /not on file/)) && !/WO-2024-001/.test(await body(gone)), await body(gone));
    await gone.close();
  }

  // The old sample kiosk is gone, and screens that are still samples say so.
  {
    const old = await open(floor, '/shop-floor');
    await old.waitForURL(/\/shopfloor/, { timeout: 8000 }).catch(() => {});
    check('the old sample operator screen now opens the real shop floor', /\/shopfloor/.test(old.url()), old.url());
    await old.close();
    for (const url of ['/production-quality/dashboard', '/production-quality/ncr', '/boms']) {
      const page = await open(office, url);
      check(`${url}: says it is a sample screen`, await has(page, /Sample screen: these are example figures/), (await body(page)).slice(0, 200));
      await page.close();
    }
  }

  await browser.close();
  const failed = checks.filter((c) => !c.ok);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ app: APP, at: new Date().toISOString(), checks: checks.length, failed: failed.length, results: checks }, null, 1));
  console.log(`\n${checks.length} checks, ${failed.length} failed → ${OUT}`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
