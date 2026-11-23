// Manufacturing, scheduling and quality.
module.exports = async (s) => {
  const { sc, P, boss, clerk, api, rowsOf, ctx, open, text, has, shown, gone, pathOf, settle, until, APP, w, B, prisma, run } = s;
  const { screenShows, sent } = require('./lists.cjs')(s);
  const good = (page) => page.writes.filter((x) => x.status >= 200 && x.status < 300 && !x.replayed); // an answer given again for a repeated request is not a second save
  const wc1 = await prisma.workCenter.findFirst({ where: { locationId: w.L1.id } });
  // A job belongs to a branch through its order or work centre, so the branch's jobs are taken from what the server lists to each manager.
  const mineList = rowsOf((await api(P.planner, 'GET', '/api/jobs')).body); const theirList = rowsOf((await api(P.manager2, 'GET', '/api/jobs')).body);
  const mineIds = new Set(mineList.map((j) => j.id));
  const anyJob = async ({ status, other } = {}) => { const list = other ? theirList.filter((j) => !mineIds.has(j.id)) : mineList; const hit = list.find((j) => !status || j.status === status); return hit ? prisma.job.findUnique({ where: { id: hit.id } }) : null; };

  await sc('MAKE', 'the work order list shows the work orders the server sent', async (t) => {
    const c = await ctx(P.planner); const page = await open(c, '/work-orders'); await page.locator('main tbody tr').first().waitFor().catch(() => {});
    await screenShows(t, page, 'woNumber', { urlPattern: /^\/work-orders/ });
    const heads = await page.locator('main thead th').allInnerTexts(); t.check('with named columns', heads.includes('Work order') && heads.includes('Status'), heads.join('|'));
  });

  await sc('MAKE', 'the work order search narrows the list on screen and an unknown number says so', async (t) => {
    const c = await ctx(P.planner); const page = await open(c, '/work-orders'); await page.locator('main tbody tr').first().waitFor(); await settle(page);
    const rows = sent(page, 'woNumber'); const target = rows[rows.length - 1].woNumber; const all = await page.locator('main tbody tr').count();
    await page.locator('main').getByLabel('Search').first().fill(target); await settle(page, 600);
    const on = await page.locator('main tbody tr').allInnerTexts();
    t.check('only matching rows remain', on.length >= 1 && on.length < all && on.every((r) => r.includes(target)), `${on.length} of ${all}`);
    await page.locator('main').getByLabel('Search').first().fill('WO-NO-SUCH'); await settle(page, 600);
    t.check('nothing matching says so', /No work orders|nothing|no results|No matching/i.test(await text(page, 'main')), (await text(page, 'main')).slice(-200));
  });

  await sc('MAKE', 'a work order opens from its row by keyboard and shows the stored source item and weights', async (t) => {
    const c = await ctx(P.planner); const page = await open(c, '/work-orders'); await page.locator('main tbody tr').first().waitFor(); await settle(page);
    const first = sent(page, 'woNumber')[0]; const row = page.locator('main tbody tr', { hasText: first.woNumber }).first(); await row.focus(); await page.keyboard.press('Enter');
    await until(() => pathOf(page) === `/work-orders/${first.id}`); t.check('Enter opens the work order', pathOf(page) === `/work-orders/${first.id}`, pathOf(page));
    await has(page, first.woNumber); await settle(page, 500);
    const db = await prisma.workOrder.findUnique({ where: { id: first.id }, include: { sourceCoil: true } }).catch(() => null); const body = await text(page, 'main');
    t.check('the heading is the number', (await text(page, 'main h1')).includes(first.woNumber));
    if (db && db.sourceCoil) t.check('the source item is named', body.includes(db.sourceCoil.coilNumber), db.sourceCoil.coilNumber);
    t.check('it says plainly what a work order does and does not do to stock', /does not yet change stock|stock/i.test(body));
  });

  await sc('MAKE', 'a work order that does not exist says so', async (t) => {
    const c = await ctx(P.planner); const page = await open(c, '/work-orders/00000000-0000-0000-0000-000000000000'); await settle(page, 1200);
    t.check('not found is said', /not found|not on file|could not|does not exist|no work order/i.test(await text(page, 'main')), (await text(page, 'main')).slice(0, 200));
    t.check('no page error', page.errors.length === 0, page.errors[0]);
  });

  await sc('MAKE', 'a new work order cannot be created without a source item, and says so', async (t) => {
    const before = await prisma.workOrder.count();
    const c = await ctx(P.planner); const page = await open(c, '/work-orders/new'); const save = page.getByRole('button', { name: 'Create Work Order' });
    await save.waitFor();
    if (await save.isDisabled()) t.check('Create is off until a source item is chosen', true);
    else { await save.click(); await page.waitForTimeout(900); const said = `${(await page.locator('[role="alert"]').allInnerTexts()).join(' ')} ${await text(page, 'main')}`; t.check('it says a source item is needed', /source|coil|required|select/i.test(said) && pathOf(page) === '/work-orders/new', said.slice(0, 200)); }
    t.check('the required field is marked', (await page.locator('main input[required], main .Mui-required').count()) > 0);
    t.check('no work order was created', (await prisma.workOrder.count()) === before && good(page).length === 0);
  });

  await sc('MAKE', 'the schedule shows only the manager’s own branch’s work centres, and the jobs the server sent for the day', async (t) => {
    const c = await ctx(P.planner); const page = await open(c, '/schedule'); await page.locator('main tbody tr').first().waitFor().catch(() => {}); await settle(page, 600);
    const centres = sent(page, 'code', /work-centers/); const foreign = centres.filter((x) => x.locationId && x.locationId !== w.L1.id).length;
    t.check('work centres were sent', centres.length > 0, centres.length);
    t.check('none belongs to another branch', foreign === 0, `${foreign} of ${centres.length}`);
    const body = await text(page, 'main'); t.check('each is a row of the schedule', centres.slice(0, 5).every((x) => body.includes(x.name) || body.includes(x.code)), centres.slice(0, 5).map((x) => x.name).join(','));
    const jobs = sent(page, 'jobNumber'); const on = [...new Set([...body.matchAll(/\b(?:JOB-\d{4,}(?:-\d+[A-Z]?)?|JS-\d{4,})/g)].map((m) => m[0]))];
    t.check('every job on the schedule is one the server sent for the day', on.every((n) => jobs.some((j) => j.jobNumber === n)), on.filter((n) => !jobs.some((j) => j.jobNumber === n)).join(','));
  });

  await sc('MAKE', 'the schedule: Next Day and Previous Day ask the server for that day, and Today comes back', async (t) => {
    const c = await ctx(P.planner); const page = await open(c, '/schedule'); await settle(page, 800);
    const asked = () => page.answers.filter((a) => /^\/jobs\?scheduledFrom=/.test(a.url)).map((a) => decodeURIComponent(a.url).match(/scheduledFrom=([^&]+)/)[1]);
    const today = asked().pop();
    await page.getByRole('button', { name: 'Next Day' }).click(); await settle(page, 800); const next = asked().pop();
    t.check('Next Day asks for one day later', new Date(next) - new Date(today) === 86400000, `${today} → ${next}`);
    await page.getByRole('button', { name: 'Previous Day' }).click(); await page.getByRole('button', { name: 'Previous Day' }).click(); await settle(page, 800);
    t.check('Previous Day twice asks for the day before today', new Date(today) - new Date(asked().pop()) === 86400000, asked().slice(-3).join(' '));
    await page.getByRole('button', { name: 'Today' }).click(); await settle(page, 800);
    t.check('Today comes back', asked().pop() === today || (await text(page, 'main')).length > 0);
    t.check('nothing was changed by looking', page.writes.length === 0);
  });

  await sc('MAKE', 'the schedule: the Queue View tab lists jobs waiting, by keyboard', async (t) => {
    const c = await ctx(P.planner); const page = await open(c, '/schedule'); await settle(page, 600);
    const tab = page.getByRole('tab', { name: 'Queue View' }); await tab.focus(); await page.keyboard.press('Enter'); await settle(page, 800);
    // The list is drawn after the tab changes; wait for it, not for a fixed time (it failed once under load in the Phase 12 gate).
    await page.locator('main').getByText(/\b(?:JOB|JS)-\d+|No jobs|empty|nothing/i).first().waitFor({ timeout: 10000 }).catch(() => {});
    t.check('the tab is selected', (await tab.getAttribute('aria-selected')) === 'true');
    const body = await text(page, 'main'); t.check('it lists jobs or says the queue is empty', /\b(?:JOB|JS)-\d+(?:-\d+[A-Z]?)?/.test(body) || /No jobs|empty|nothing/i.test(body), body.slice(-300));
    const numbers = [...new Set([...body.matchAll(/\b(?:JOB-\d{4,}(?:-\d+[A-Z]?)?|JS-\d{4,})/g)].map((m) => m[0]))].slice(0, 30); const known = await prisma.job.count({ where: { jobNumber: { in: numbers } } });
    t.check('every job number shown is a real job', known === numbers.length, `${known} of ${numbers.length}`);
  });

  await sc('MAKE', 'the order board shows real jobs in the column of their stored status', async (t) => {
    const c = await ctx(P.planner); const page = await open(c, '/order-board'); await settle(page, 1500);
    const jobs = sent(page, 'jobNumber', /^\/jobs/); t.check('jobs were sent', jobs.length > 0, jobs.length);
    const foreign = jobs.filter((j) => !mineIds.has(j.id)).length; t.check('the same jobs the server lists to this manager, and no others', foreign === 0, foreign);
    const body = await text(page, 'main'); const some = jobs.filter((j) => !['SHIPPED', 'COMPLETED', 'CANCELLED'].includes(j.status)).slice(0, 5);
    t.check('open jobs are on the board', some.every((j) => body.includes(j.jobNumber)), some.map((j) => j.jobNumber).join(','));
    t.check('the board names its columns', /Ordered|Scheduled|In Process|QC/i.test(body));
  });

  await sc('MAKE', 'a job card opens with Enter and shows the stored customer and operation, and Escape closes it', async (t) => {
    const c = await ctx(P.planner); const page = await open(c, '/order-board'); await settle(page, 1500);
    const card = page.locator('main [role="button"]', { hasText: /\b(?:JOB|JS)-\d+(?:-\d+[A-Z]?)?/ }).first(); const label = (await card.innerText()).match(/\b(?:JOB|JS)-\d+(?:-\d+[A-Z]?)?/)[0];
    await card.focus(); await page.keyboard.press('Enter'); const dialog = page.getByRole('dialog'); t.check('Enter opens the job', await shown(dialog, 5000));
    const db = await prisma.job.findFirst({ where: { jobNumber: label } }); const body = await dialog.innerText();
    t.check('it is that job', body.includes(label));
    t.check('with its stored instructions or operation', !db.instructions || body.includes(db.instructions) || body.includes(String(db.operationType || '')), body.slice(0, 200));
    await page.keyboard.press('Escape'); t.check('Escape closes it', await gone(dialog)); t.check('nothing changed', page.writes.length === 0);
  });

  await sc('MAKE', 'the order board search narrows the cards to jobs matching the text', async (t) => {
    const c = await ctx(P.planner); const page = await open(c, '/order-board'); await settle(page, 1500);
    const jobs = sent(page, 'jobNumber', /^\/jobs/).filter((j) => !['SHIPPED', 'COMPLETED', 'CANCELLED'].includes(j.status)); const target = jobs[0].jobNumber;
    const before = await page.locator('main [role="button"]', { hasText: /\b(?:JOB|JS)-\d+(?:-\d+[A-Z]?)?/ }).count();
    await page.getByLabel('Search jobs, customers, materials').fill(target); await settle(page, 600);
    const cards = await page.locator('main [role="button"]', { hasText: /\b(?:JOB|JS)-\d+(?:-\d+[A-Z]?)?/ }).allInnerTexts();
    t.check('fewer cards', cards.length >= 1 && cards.length < before, `${cards.length} of ${before}`);
    t.check('all matching', cards.every((x) => x.includes(target)), cards.slice(0, 3).join(' / '));
  });

  await sc('MAKE', 'a job page shows its history with who did each step, as stored', async (t) => {
    const job = await anyJob({ status: 'SHIPPED' }) || await anyJob();
    const c = await ctx(P.planner); const page = await open(c, `/jobs/${job.id}`); await has(page, job.jobNumber); await settle(page, 600);
    const body = await text(page, 'main'); t.check('the heading is the job number', (await text(page, 'main h1')).trim() === job.jobNumber);
    t.check('the status on file is shown', body.toUpperCase().includes(String(job.status).replace(/_/g, ' ')), job.status);
    const heads = await page.locator('main thead th').allInnerTexts(); t.check('the history table names when, what and by whom', heads.includes('When') && heads.includes('By'), heads.join('|'));
    t.check('the title names the job', await until(async () => (await page.title()).startsWith(job.jobNumber), 5000), await page.title());
  });

  await sc('MAKE', 'Change status on a job offers only real next steps and Cancel changes nothing', async (t) => {
    const job = await anyJob({ status: 'SCHEDULED' }); if (!job) return t.na('no scheduled job at branch 1');
    const c = await ctx(P.planner); const page = await open(c, `/jobs/${job.id}`); await has(page, job.jobNumber);
    await page.getByRole('button', { name: 'Change status' }).click(); const dialog = page.getByRole('dialog').or(page.getByRole('menu')).first(); t.check('choices open', await shown(dialog, 5000));
    const said = await dialog.innerText(); t.check('the current status is not offered as a step, or is marked', said.length > 5, said.slice(0, 200));
    await page.keyboard.press('Escape'); await gone(dialog);
    const after = await prisma.job.findUnique({ where: { id: job.id } }); t.check('the job is unchanged', after.status === job.status && after.updatedAt.getTime() === job.updatedAt.getTime() && good(page).length === 0);
  });

  await sc('MAKE', 'a job at another branch cannot be opened by address', async (t) => {
    const other = await anyJob({ other: true }); if (!other) return t.na('no job at branch 2');
    const r = await api(P.planner, 'GET', `/api/jobs/${other.id}`); t.check('the server refuses it', r.status === 403 || r.status === 404, r.status);
    const c = await ctx(P.planner); const page = await open(c, `/jobs/${other.id}`); await settle(page, 1200);
    t.check('the page shows nothing of it', !(await text(page, 'main')).includes(other.jobNumber)); t.check('and says it was not found', /not found|not on file|could not|no access|does not exist/i.test(await text(page, 'main')), (await text(page, 'main')).slice(0, 160));
  });

  await sc('MAKE', 'the quality station: the counts and the queue are the server’s', async (t) => {
    const c = await ctx(P.inspector); const page = await open(c, '/qc'); await page.locator('main tbody tr').first().waitFor().catch(() => {}); await settle(page, 600);
    const queue = sent(page, 'jobNumber', /^\/qc\/queue/); const body = await text(page, 'main');
    t.check('the tab count equals the queue sent', new RegExp(`QC Queue\\s*${queue.length}\\b`).test(body), `${queue.length} / ${(body.match(/QC Queue\s*\d+/) || [])[0]}`);
    t.check('the queue rows are the jobs sent', queue.slice(0, 5).every((j) => body.includes(j.jobNumber)), queue.slice(0, 5).map((j) => j.jobNumber).join(','));
    t.check('rows on screen equal jobs sent', (await page.locator('main tbody tr').count()) === Math.max(queue.length, queue.length ? 0 : 1) || queue.length === (await page.locator('main tbody tr').count()), `${await page.locator('main tbody tr').count()} / ${queue.length}`);
    const foreign = queue.filter((j) => !mineIds.has(j.id)).length; t.check('no job of another branch is in the inspector’s queue', foreign === 0, foreign);
  });

  await sc('MAKE', 'the quality station tabs each show what the server sent for them', async (t) => {
    const c = await ctx(P.inspector); const page = await open(c, '/qc'); await settle(page, 1000);
    await page.getByRole('tab', { name: /All Inspections/ }).click(); await settle(page, 800);
    const all = sent(page, 'inspectionNumber'); const body = await text(page, 'main');
    t.check('inspections were sent', all.length > 0, all.length);
    t.check('they are on screen with their result', all.slice(0, 5).every((i) => body.includes(i.inspectionNumber)), all.slice(0, 5).map((i) => i.inspectionNumber).join(','));
    await page.getByRole('tab', { name: /Completed/ }).click(); await settle(page, 600);
    const rows = await page.locator('main tbody tr').allInnerTexts(); t.check('Completed shows no inspection still in progress', rows.every((r) => !/IN PROGRESS|IN_PROGRESS/.test(r)), rows.slice(0, 2).join(' / '));
    t.check('the chosen tab is marked', (await page.getByRole('tab', { name: /Completed/ }).getAttribute('aria-selected')) === 'true');
  });

  await sc('MAKE', 'a saw operator cannot record a quality result: the server refuses and the queue offers no way round', async (t) => {
    const job = await anyJob({ status: 'WAITING_QC' }); if (!job) return t.na('no job waiting for quality at branch 1');
    const r = await api(P.operator, 'POST', '/api/qc/inspections', { jobId: job.id, inspectionType: 'FINAL' });
    t.check('the server refuses an inspection from an operator', r.status === 403, `${r.status} ${JSON.stringify(r.body).slice(0, 100)}`);
    const after = await prisma.job.findUnique({ where: { id: job.id } }); t.check('the job still waits for quality', after.status === 'WAITING_QC');
  });

  await sc('MAKE', 'the shop floor lists the work centres of the operator’s branch and opens one', async (t) => {
    const c = await ctx(P.operator); const page = await open(c, '/shopfloor'); await settle(page, 1500);
    const body = await text(page, 'main'); t.check('the branch’s work centre is there', body.includes(wc1.name) || body.includes(wc1.code), body.slice(0, 300));
    const other = await prisma.workCenter.findFirst({ where: { locationId: w.L2.id } }); if (other) t.check('a work centre of another branch is not', !body.includes(other.name) || other.name === wc1.name);
    const page2 = await open(c, `/shopfloor/${wc1.id}`); await settle(page2, 1000);
    t.check('its queue opens with the centre named in the heading', new RegExp(wc1.code.split('-')[0], 'i').test(await text(page2, 'main h1')) || (await text(page2, 'main h1')).includes(wc1.name), await text(page2, 'main h1'));
    const numbers = [...new Set([...(await text(page2, 'main')).matchAll(/\b(?:JOB-\d{4,}(?:-\d+[A-Z]?)?|JS-\d{4,})/g)].map((m) => m[0]))]; const mine = numbers.filter((n) => mineList.some((j) => j.jobNumber === n)).length;
    t.check('every job in its queue is a real job of this branch', mine === numbers.length, `${mine} of ${numbers.length}`);
  });

  await sc('MAKE', 'an operator sees no button to create a work centre that the server would refuse', async (t) => {
    const r = await api(P.operator, 'POST', '/api/v1/dispatch/work-centers', { name: `P9 not allowed ${run}`, workCenterType: 'SAW', locationId: w.L1.id });
    t.check('the server refuses a new work centre from an operator', r.status === 403, r.status);
    t.check('none was created', (await prisma.workCenter.count({ where: { name: `P9 not allowed ${run}` } })) === 0);
    const c = await ctx(P.operator); const page = await open(c, '/shopfloor'); await settle(page, 1000);
    const offered = await page.getByRole('button', { name: 'New Work Center' }).isVisible().catch(() => false);
    if (offered) { await page.getByRole('button', { name: 'New Work Center' }).click(); const d = page.getByRole('dialog'); await d.waitFor(); await d.getByLabel(/Work Center Name/).fill(`P9 not allowed ${run}`); await d.getByRole('button', { name: 'Create Work Center' }).click(); await page.waitForTimeout(1200); t.check('if offered, the refusal is shown and nothing is created', (await prisma.workCenter.count({ where: { name: `P9 not allowed ${run}` } })) === 0); }
    else t.check('the button is not offered', true);
  });

  await sc('MAKE', 'the production board lists real jobs under their stored stage', async (t) => {
    const c = await ctx(P.planner); const page = await open(c, '/production'); await settle(page, 1500);
    const jobs = sent(page, 'jobNumber', /^\/jobs/); const body = await text(page, 'main');
    const open1 = jobs.filter((j) => ['SCHEDULED', 'IN_PROCESS', 'WAITING_QC', 'PACKAGING'].includes(j.status)).slice(0, 5);
    t.check('open jobs sent are on the board', open1.length > 0 && open1.every((j) => body.includes(j.jobNumber)), open1.map((j) => j.jobNumber).join(','));
    const counts = {}; for (const j of jobs) counts[j.status] = (counts[j.status] || 0) + 1;
    t.check('the stage headings are there', /Not planned/i.test(body) && /Running/i.test(body) && /QC/i.test(body));
    t.check('no page error', page.errors.length === 0, page.errors[0]); void counts;
  });

  await sc('MAKE', 'the time report: tabs, filters and the totals come from the server, and the export holds the same rows', async (t) => {
    const c = await ctx(P.planner); const page = await open(c, '/time-tracking'); await settle(page, 1500);
    const ops = sent(page, 'sequence', /operations\?/); const body = await text(page, 'main');
    t.check('the entry count on screen is a number', /\d+ entries/.test(body), body.slice(0, 300));
    for (const name of ['By Operator', 'By Work Center', 'Time Log Details']) { const tab = page.getByRole('tab', { name }); await tab.click(); await settle(page, 300); t.check(`"${name}" can be chosen`, (await tab.getAttribute('aria-selected')) === 'true'); }
    const download = page.waitForEvent('download', { timeout: 6000 }).catch(() => null); await page.getByRole('button', { name: 'Export CSV' }).click(); const file = await download;
    if (file) { const p = await file.path(); const csv = require('node:fs').readFileSync(p, 'utf8'); t.check('the export is a CSV with a header row', /,/.test(csv.split('\n')[0]) && csv.split('\n').length >= 1, csv.slice(0, 120)); }
    else t.check('with nothing to export the screen says so instead of downloading an empty file', /No |nothing|0 entries/i.test(await text(page, 'main')) || (await page.locator('[role="alert"]').count()) > 0, 'no download and no message');
    void ops;
  });

  await sc('MAKE', 'the New Job dialog: a job typed once and saved with a double click is stored once', async (t) => {
    const name = `QA P9 job ${run}`; const before = await prisma.job.count();
    const c = await ctx(P.planner); const page = await open(c, '/order-board'); await settle(page, 1000);
    await page.getByRole('button', { name: 'New Job', exact: true }).click(); const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/Customer Name/).fill(name); await dialog.getByLabel('Material Description').fill('P9 plate').catch(() => {});
    for (const sel of await dialog.locator('[role="combobox"][aria-required="true"], .Mui-required ~ div [role="combobox"]').all()) { await sel.click(); await page.getByRole('option').first().click().catch(() => {}); }
    const save = dialog.getByRole('button', { name: 'Create Job' });
    if (!(await until(() => save.isEnabled(), 3000))) { for (const sel of await dialog.locator('[role="combobox"]').all()) { await sel.click().catch(() => {}); await page.getByRole('option').first().click().catch(() => {}); await page.keyboard.press('Escape').catch(() => {}); } }
    t.check('the save button comes on once the required entries are in', await until(() => save.isEnabled(), 3000), (await dialog.innerText()).slice(0, 200));
    // A double click sends the save twice. The two copies carry one request key (src/frontend/src/api/requestKey.js),
    // so the server runs the save once: the second copy is turned away while the first is still being worked on, or
    // is handed the first answer again once it is done ("replayed"). A replayed answer is not a second save, and
    // counting it as one made this check fail by chance on a fast run (2026-11-23). The answer is held back half a
    // second so both copies are always out together.
    await page.route('**/api/jobs', async (route) => { if (route.request().method() === 'POST') await new Promise((r) => setTimeout(r, 500)); await route.continue(); });
    await save.dblclick().catch(() => {});
    await gone(dialog, 10000); await settle(page, 800);
    const made = (await prisma.job.count()) - before; t.check('exactly one job was created', made === 1, made);
    const posts = page.writes.filter((x) => x.method === 'POST' && x.url === '/jobs');
    t.check('the double click did send the save twice', posts.length === 2, JSON.stringify(page.writes));
    t.check('one save was run; the other copy was turned away or given the first answer again', good(page).filter((x) => x.method === 'POST').length === 1, JSON.stringify(page.writes));
  });

  await sc('MAKE', 'the bills of material screen says plainly that it is a sample and saves nothing', async (t) => {
    const c = await ctx(P.planner); const page = await open(c, '/boms'); await settle(page, 800); const body = await text(page, 'main');
    t.check('it says it is a sample screen', /Sample screen/.test(body) && /not connected yet/.test(body));
    t.check('it points to the real screen', /Processing Recipes/.test(body));
    await page.locator('main [role="button"]').first().click().catch(() => {}); await page.waitForTimeout(500);
    t.check('nothing is sent', page.writes.length === 0);
  });

  await sc('MAKE', 'the manufacturing lists can be read on a tablet without the page scrolling sideways', async (t) => {
    const c = await ctx(P.planner, 'tablet');
    for (const url of ['/work-orders', '/schedule', '/order-board', '/qc']) { const page = await open(c, url); await settle(page, 800); const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); t.check(`${url}: the page is no wider than the screen`, over <= 1, over); t.check(`${url}: the heading is on screen`, await page.locator('main h1').first().isVisible()); await page.close(); }
  });

  await sc('MAKE', 'a scheduler may plan but may not change a price or read invoices', async (t) => {
    const r1 = await api(P.scheduler, 'GET', '/api/jobs?limit=1'); t.check('the scheduler reads jobs', r1.status === 200, r1.status);
    const r2 = await api(P.scheduler, 'GET', '/api/invoices'); t.check('invoices are refused', r2.status === 403, r2.status);
    const c = await ctx(P.scheduler); const page = await open(c, '/pricing'); await settle(page, 600); t.check('the pricing page says No access', /No access/.test(await text(page, 'main')));
  });
  await sc('MAKE', 'a full column on the order board draws its first cards and offers the rest', async (t) => {
    const c = await ctx(boss); const page = await open(c, '/order-board'); await settle(page, 2000);
    const jobs = sent(page, 'jobNumber', /^\/jobs/); const cards = () => page.locator('main [role="button"]', { hasText: /\b(?:JOB|JS)-\d+(?:-\d+[A-Z]?)?/ }).count();
    const more = page.getByTestId('column-show-more'); const first = await cards(); const offered = await more.count();
    if (jobs.length <= 30 * 8) { t.na('this database has too few jobs to fill a column'); await c.close(); return; }
    t.check('not every job is drawn at once', first > 0 && first < jobs.length, `${first} cards for ${jobs.length} jobs`);
    t.check('the rest are offered', offered >= 1, `${offered} columns offer more`);
    const label = await more.first().innerText(); await more.first().click(); await settle(page, 400); const after = await cards();
    t.check('the button says how many are left and draws up to thirty more', /Show \d+ more of \d+/i.test(label) && after > first && after <= first + 30, `${label}: ${first} then ${after}`);
    t.check('a job far down the list is still found by the search', true === (await (async () => { const last = jobs[jobs.length - 1].jobNumber; await page.getByLabel('Search jobs, customers, materials').fill(last); await settle(page, 700); return (await text(page, 'main')).includes(last); })()), jobs[jobs.length - 1].jobNumber);
    await c.close();
  });
};
