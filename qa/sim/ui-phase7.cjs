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
  // Owner decision 9: the job screen shows the material cut for the job and what the job cost; the time
  // tracking screen lists a clock left running; the kinds-of-work-center address keeps the owner's rules.
  {
    const { PrismaClient } = require(path.resolve('src/backend/node_modules/@prisma/client'));
    const prisma = new PrismaClient();
    const heat = await prisma.heat.findFirst({ include: { grade: true }, orderBy: { createdAt: 'asc' } });
    const j = await job();
    const item = must(await call('POST', '/api/inventory/receipts', { coilNumber: `UI7-${run}`, form: 'PLATE', heatNumber: heat.heatNumber, gradeCode: heat.grade.code, thicknessIn: 0.5, widthIn: 48, lengthIn: 96, weightLb: 1000, locationId: L1.id }), 'receipt', 201).item;
    await prisma.coil.update({ where: { id: item.id }, data: { unitCost: 0.5 } });
    const wo = must(await call('POST', '/api/work-orders', { woType: 'SLIT', sourceCoilId: item.id, jobId: j.id, inputWeightLb: 1000, priority: 3 }), 'work order', 201);
    for (const s of ['release', 'start']) must(await call('PUT', `/api/work-orders/${wo.id}/${s}`, {}), s);
    must(await call('PUT', `/api/work-orders/${wo.id}/complete`, { scrapWeightLb: 40, outputs: [{ weightLb: 960, widthIn: 24 }] }), 'finish');
    must(await call('PATCH', `/api/v1/dispatch/work-center-types/${kind}`, { hourlyRate: 60 }), 'rate');
    must(await call('POST', `/api/v1/operations/${j.ops[0].id}/start`, { operatorId: person.id, workCenterId: wc.id }), 'start');
    await prisma.dispatchTimeLog.updateMany({ where: { dispatchOperationId: j.ops[0].id, status: 'RUNNING' }, data: { startAt: new Date(Date.now() - 13 * 3600000) } });
    {
      const page = await open('/time-tracking');
      await page.getByText(/been running for more than/).first().waitFor({ timeout: 10000 }).catch(() => {});
      const text = await body(page);
      check('time tracking: a clock running for 13 hours is listed for the supervisor, with the operator and the job', /been running for more than 12 hours/.test(text) && text.includes(j.jobNumber) && text.includes(`P7-${run}`), (text.match(/.{0,80}running for more.{0,200}/) || [text.slice(0, 200)])[0]);
      check('time tracking: no script errors', page.errors.length === 0, page.errors.join(' | '));
      await page.close();
    }
    must(await call('POST', `/api/v1/operations/${j.ops[0].id}/complete`, {}), 'complete');
    {
      const page = await open(`/jobs/${j.id}`);
      await page.getByText(wo.woNumber).first().waitFor({ timeout: 10000 }).catch(() => {});
      const text = await body(page);
      check('job: the work order cut for the job is listed with its weights and yield', text.includes(wo.woNumber) && /Material used/.test(text) && /1,000/.test(text) && /96/.test(text), text.slice(0, 400));
      check('job: cost shows material $500.00, labor at the rate on file, a total, and says no overhead is included', /\$500\.00/.test(text) && /\$7[78]\d\.\d\d|\$780\.00/.test(text) && /No overhead is included/.test(text), (text.match(/Cost[\s\S]{0,400}/) || [''])[0]);
      check('job: nothing reads NaN or undefined', !/\bNaN\b|undefined/.test(text), (text.match(/.{30}(NaN|undefined).{30}/) || [''])[0]);
      check('job: "Cut material for this job" is offered while the job is open', await page.getByRole('link', { name: 'Cut material for this job' }).isVisible().catch(() => false));
      check('job: no script errors', page.errors.length === 0, page.errors.join(' | '));
      await page.close();
    }
    {
      const page = await open(`/work-orders/new?jobId=${j.id}`);
      await page.getByText(j.jobNumber).first().waitFor({ timeout: 10000 }).catch(() => {});
      check('new work order: opened from a job, the screen says which job it is for', (await body(page)).includes(j.jobNumber), (await body(page)).slice(0, 300));
      check('new work order: no script errors', page.errors.length === 0, page.errors.join(' | '));
      await page.close();
    }
    {
      const page = await open(`/work-orders/${wo.id}`);
      await page.getByText('For job').first().waitFor({ timeout: 10000 }).catch(() => {});
      const text = await body(page);
      check('work order: the screen names the job it was raised for', /For job/.test(text) && text.includes(j.jobNumber), text.slice(0, 300));
      check('work order: no script errors', page.errors.length === 0, page.errors.join(' | '));
      await page.close();
    }
    // Routing: the "must pass inspection" box is ticked by default, and unticking it is saved with a warning shown.
    {
      const routing = must(await call('POST', '/api/v1/bom/recipes', { name: `UI P7 routing ${run}`, code: `UI7R${run}`, materialCode: `UI7M${run}`, commodity: 'METALS', form: 'PLATE', grade: heat.grade.code, thicknessMin: 0.25, thicknessMax: 1, division: 'METALS', operations: [{ name: 'Saw', workCenterType: kind, setupMinutes: 10, estimatedMachineMinutes: 30, estimatedLaborMinutes: 20 }] }), 'routing', 201);
      const page = await open(`/bom/${routing.id}`);
      const box = page.getByLabel('Jobs on this routing must pass inspection');
      await box.waitFor({ timeout: 10000 }).catch(() => {});
      check('routing: "Jobs on this routing must pass inspection" is ticked on a new routing', await box.isChecked().catch(() => false));
      await box.uncheck().catch(() => {});
      check('routing: unticked, the screen warns that jobs will go straight to packaging', /go straight to packaging/.test(await body(page)), (await body(page)).slice(0, 300));
      await page.getByRole('button', { name: 'Save' }).first().click().catch(() => {});
      await page.waitForTimeout(1500);
      const saved = await prisma.bomRecipe.findUnique({ where: { id: routing.id } });
      check('routing: the choice is saved', saved.inspectionRequired === false, `inspectionRequired ${saved.inspectionRequired}`);
      check('routing: no script errors', page.errors.length === 0, page.errors.join(' | '));
      await page.close();
    }
    // Kinds of work center: the owner's rules are on the form; the labor rate is there for a cost role and saved changes stick.
    {
      const page = await open('/shopfloor');
      await page.getByRole('button', { name: 'Manage Types' }).first().click().catch(() => {});
      const dialog = page.getByRole('dialog');
      const row = dialog.locator('li').filter({ hasText: kind }).first();
      await row.waitFor({ timeout: 10000 }).catch(() => {});
      await row.getByRole('button', { name: 'Edit' }).click().catch(() => {});
      const two = dialog.getByLabel('One operator may run two steps at once');
      await two.waitFor({ timeout: 8000 }).catch(() => {});
      const rate = dialog.getByLabel('Labor rate per hour ($)');
      check('kinds of work center: the form shows the two rules, the labor rate on file and the checklist box', (await two.isVisible().catch(() => false)) && (await dialog.getByLabel('An operator needs a current certification to run it').isVisible().catch(() => false)) && Number(await rate.inputValue().catch(() => 'x')) === 60 && (await dialog.getByLabel('Inspection checklist').isVisible().catch(() => false)), await rate.inputValue().catch(() => 'no rate field'));
      await two.check().catch(() => {});
      await dialog.getByLabel('Inspection checklist').fill('Length to print\nEdge free of burr').catch(() => {});
      await dialog.getByRole('button', { name: 'Update' }).click().catch(() => {});
      await page.waitForTimeout(1500);
      const row2 = await prisma.workCenterType.findUnique({ where: { id: kind } });
      check('kinds of work center: ticking "two steps at once" and typing two checks is saved, and the rate is kept', row2.allowsConcurrentSteps === true && Array.isArray(row2.inspectionChecklist) && row2.inspectionChecklist.length === 2 && row2.inspectionChecklist[0].item === 'Length to print' && Number(row2.hourlyRate) === 60 && row2.certificationRequired === false, JSON.stringify({ two: row2.allowsConcurrentSteps, list: row2.inspectionChecklist, rate: row2.hourlyRate }));
      check('kinds of work center: no script errors', page.errors.length === 0, page.errors.join(' | '));
      await page.close();
    }
    await prisma.$disconnect();
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
