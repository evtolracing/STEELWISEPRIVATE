#!/usr/bin/env node
// Phase 7 screens in a real browser, against the QA server, as the QA administrator:
// the Quality screen lists a job waiting for inspection; the inspection screen will not let an
// unanswered checklist be passed, refuses a conditional pass with no conditions and then accepts one
// with them; the shop-floor screen runs scheduling and says what it could not place and why; the
// new work center window assumes no thickness limit; the planner screen says what it does not count;
// and the shop-floor and Quality screens fit a phone without sideways scrolling.
//   node qa/sim/ui-phase7.cjs --app http://localhost:5199 --api http://localhost:3001
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const APP = arg('app', 'http://localhost:5199');
const API = arg('api', 'http://localhost:3001');
const OUT = arg('out', 'qa/results/ui-phase7.json');
const run = Date.now().toString(36).toUpperCase();
const PASSWORD = 'qa-password-1';

(async () => {
  const boss = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'qa-admin@qa.test', password: PASSWORD }) }).then((r) => r.json());
  if (!boss.token) throw new Error('login failed');
  const call = (method, url, body) => fetch(API + url, { method, headers: { authorization: `Bearer ${boss.token}`, 'content-type': 'application/json' }, body: body && JSON.stringify(body) }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
  const must = (r, what, code = 200) => { if (r.status !== code && r.status !== 201) throw new Error(`${what}: ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`); return r.body; };
  const locations = (await call('GET', '/api/inventory/locations')).body || [];
  const L1 = locations.find((l) => l.code === 'QA-L01');

  // A small shop of its own: a kind of work center, one work center, one certified operator.
  const kind = `U7${run}`.slice(0, 14); const lonely = `U8${run}`.slice(0, 14);
  for (const [id, label] of [[kind, 'UI P7 saw'], [lonely, 'UI P7 kind with no machine']]) must(await call('POST', '/api/v1/dispatch/work-center-types', { id, label, divisions: ['METALS'] }), 'type');
  const wc = must(await call('POST', '/api/v1/dispatch/work-centers', { id: `UI7-${run}`, name: `UI P7 saw ${run}`, locationId: L1.id, workCenterType: kind }), 'work center').data;
  const person = must(await call('POST', '/api/staff/operators', { firstName: 'UI', lastName: `P7-${run}`, homeLocationId: L1.id, skills: [{ workCenterTypeId: kind, skillLevel: 'STANDARD' }] }), 'operator').data;
  const job = async (type = kind) => {
    const j = must(await call('POST', '/api/jobs', { workCenterId: wc.id, operationType: kind, instructions: `UI phase 7 ${run}`, status: 'ORDERED', priority: 5 }), 'job');   // hot, so it is at the top of a long queue
    const p = must(await call('POST', `/api/jobs/${j.id}/plan`, { operations: [{ workCenterType: type, name: 'Cut' }] }), 'plan');
    return { ...j, ops: p.operations };
  };
  const atInspection = async () => {
    const j = await job();
    must(await call('POST', `/api/v1/operations/${j.ops[0].id}/start`, { operatorId: person.id, workCenterId: wc.id }), 'start');
    must(await call('POST', `/api/v1/operations/${j.ops[0].id}/complete`, {}), 'complete');
    return j;
  };
  const statusOf = async (id) => (await call('GET', `/api/jobs/${id}`)).body?.status;

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1360, height: 900 } });
  const seed = ([t, u]) => { localStorage.setItem('token', t); if (u) localStorage.setItem('user', JSON.stringify(u)); };
  await context.addInitScript(seed, [boss.token, boss.user]);
  const checks = [];
  const check = (name, ok, detail = '') => { checks.push({ name, ok: Boolean(ok), detail: ok ? '' : String(detail).slice(0, 300) }); console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : ` — ${String(detail).slice(0, 300)}`}`); };
  const open = async (url, ctx = context) => { const page = await ctx.newPage(); page.errors = []; page.on('pageerror', (e) => page.errors.push(e.message)); await page.goto(APP + url, { waitUntil: 'domcontentloaded' }); await page.waitForLoadState('networkidle').catch(() => {}); return page; };
  const body = (page) => page.locator('body').innerText();

  // Quality: the waiting job is listed, and the pass rate is a figure or a dash, never a made-up 100%.
  const waiting = await atInspection();
  {
    const page = await open('/qc');
    await page.getByText(waiting.jobNumber).first().waitFor({ timeout: 10000 }).catch(() => {});
    const text = await body(page);
    check('quality: the job waiting for inspection is in the queue', text.includes(waiting.jobNumber), text.slice(0, 300));
    const stats = (await call('GET', '/api/qc/stats')).body.data;
    check('quality: the pass rate shown is the figure from the records, or a dash when nothing was decided today', stats.passRate == null ? /—\s*\n?\s*Pass Rate/.test(text) : text.includes(`${stats.passRate}%`), `${stats.passRate} ${text.slice(0, 200)}`);
    check('quality: no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.close();
  }
  // Inspection: an unanswered checklist cannot be passed; a conditional pass needs its conditions.
  {
    const ins = must(await call('POST', '/api/qc/inspections', { jobId: waiting.id }), 'inspection').data;
    const page = await open(`/qc/inspect/${ins.id}`);
    await page.getByRole('button', { name: 'Pass QC' }).waitFor({ timeout: 10000 }).catch(() => {});
    check('inspection: Pass is switched off while required checks are unanswered', await page.getByRole('button', { name: 'Pass QC' }).isDisabled().catch(() => false), (await body(page)).slice(0, 200));
    await page.getByRole('button', { name: 'Conditional Pass' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Confirm' }).click();
    await page.getByText(/State the conditions/).first().waitFor({ timeout: 8000 }).catch(() => {});
    check('inspection: a conditional pass with no conditions is refused and the screen says why', /State the conditions/.test(await body(page)) && (await statusOf(waiting.id)) === 'WAITING_QC', `${await statusOf(waiting.id)} ${(await body(page)).slice(0, 200)}`);
    if (!(await page.getByRole('dialog').isVisible().catch(() => false))) await page.getByRole('button', { name: 'Conditional Pass' }).click();
    await page.getByRole('dialog').getByLabel('Conditions').fill('Customer accepts light surface rust');
    await page.getByRole('dialog').getByRole('button', { name: 'Confirm' }).click();
    await page.getByText(/CONDITIONAL PASS/).first().waitFor({ timeout: 10000 }).catch(() => {});
    const saved = (await call('GET', `/api/qc/inspections/${ins.id}`)).body?.data;
    check('inspection: with the conditions written it is accepted and the job goes to packaging', (await statusOf(waiting.id)) === 'PACKAGING' && saved?.overallResult === 'CONDITIONAL' && /Customer accepts light surface rust/.test(saved?.notes || ''), `${await statusOf(waiting.id)} ${saved?.overallResult}`);
    check('inspection: no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.close();
  }
  // Shop floor: scheduling says what it placed, what it could not place and why.
  {
    const placed = await job(); const stuck = await job(lonely);
    const page = await open('/shopfloor');
    await page.getByRole('button', { name: 'Run Dispatch' }).waitFor({ timeout: 10000 }).catch(() => {});
    const chosen = page.locator('.MuiFormControl-root', { hasText: 'Location' }).getByRole('combobox').first();
    if (!((await chosen.innerText().catch(() => '')).includes(L1.name))) { await chosen.click(); await page.getByRole('option', { name: L1.name, exact: false }).first().click(); await page.waitForLoadState('networkidle').catch(() => {}); }
    await page.getByRole('button', { name: 'Run Dispatch' }).click();
    await page.getByText(/Assigned \d+ step/).first().waitFor({ timeout: 15000 }).catch(() => {});
    const text = await body(page);
    const plan = async (j) => (await call('GET', `/api/jobs/${j.id}/plan`)).body?.operations?.[0];
    check('shop floor: scheduling reports how many steps it placed', /Assigned \d+ steps?\./.test(text), text.slice(0, 300));
    check('shop floor: and says what could not be placed, with the reason', /could not be placed: .*has no/.test(text), (text.match(/Assigned[^\n]*/) || [''])[0]);
    check('shop floor: the step that fits is on the work center; the one that does not is still waiting', (await plan(placed))?.assignedWorkCenterId === wc.id && (await plan(stuck))?.status === 'PENDING', `${JSON.stringify(await plan(placed)).slice(0, 120)}`);
    // The new work center window assumes no thickness limit.
    await page.getByRole('button', { name: 'New Work Center', exact: true }).first().click();
    const limit = page.getByRole('dialog').getByLabel('Max Thickness');
    await limit.waitFor({ timeout: 8000 }).catch(() => {});
    check('shop floor: a new work center starts with no thickness limit (it used to start at 12 in)', (await limit.inputValue().catch(() => 'missing')) === '' && /Leave empty if there is no stated limit/.test(await body(page)), await limit.inputValue().catch(() => 'missing'));
    check('shop floor: no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.close();
  }
  // Planner: it says what it does not count, and shows no invented figure.
  {
    const page = await open('/optimization');
    await page.getByText(/Shift calendars/).first().waitFor({ timeout: 15000 }).catch(() => {});
    const text = await body(page);
    check('planner: the screen says shift calendars, operator availability, downtime and running jobs are not counted', /Shift calendars, operator availability, machine downtime and jobs already running are not part of this plan/.test(text), text.slice(0, 300));
    const an = (await call('GET', '/api/v1/ai/work-order-optimize/analysis')).body;
    check('planner: overall utilisation is the figure from the records, or "Not known"', an.metrics.overallUtilization == null ? /Not known/.test(text) : text.includes(`${an.metrics.overallUtilization}%`), `${an.metrics.overallUtilization}`);
    check('planner: nothing reads NaN or undefined', !/\bNaN\b|undefined/.test(text), (text.match(/.{30}(NaN|undefined).{30}/) || [''])[0]);
    check('planner: no script errors', page.errors.length === 0, page.errors.join(' | '));
    await page.close();
  }
  // Phone width: the shop-floor and Quality screens do not scroll sideways, and the main action can be reached by name.
  {
    const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await phone.addInitScript(seed, [boss.token, boss.user]);
    for (const [url, name, action] of [['/shopfloor', 'shop floor', 'Run Dispatch'], ['/qc', 'quality', null]]) {
      const page = await open(url, phone);
      await page.waitForTimeout(800);
      const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(`phone: the ${name} screen fits a 390-pixel screen without sideways scrolling`, wide <= 2, `${wide} pixels too wide`);
      if (action) check(`phone: "${action}" is a named button that can be reached`, await page.getByRole('button', { name: action }).isVisible().catch(() => false));
      check(`phone: ${name}: no script errors`, page.errors.length === 0, page.errors.join(' | '));
      await page.close();
    }
    await phone.close();
  }
  await browser.close();
  const failed = checks.filter((c) => !c.ok);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ app: APP, at: new Date().toISOString(), checks: checks.length, failed: failed.length, results: checks }, null, 1));
  console.log(`\n${checks.length} checks, ${failed.length} failed → ${OUT}`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
