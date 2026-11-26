#!/usr/bin/env node
// A new work order always has a job (owner, 2026-11-23). Made from the Work Orders page with no job, it makes
// its own job, which starts on the Order Board (ORDERED) to be planned. For an order line it joins the line's
// open job, or makes the line's job. Opened from a job it stays that job's. Cancelling the work order cancels
// the job it made while nobody has started it. Asked on the QA server, checked in the QA database.
//   node qa/sim/work-order-job.mjs [--base http://localhost:3011]
import { QA_USERS, prismaClient, assertSafeDatabase } from './lib.mjs';

assertSafeDatabase(); const prisma = prismaClient();
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('base', 'http://localhost:3011');
let pass = 0; const failed = [];
const check = (name, ok, detail = '') => { if (ok) pass += 1; else failed.push(`${name}${detail === '' ? '' : `: ${detail}`}`); };
const token = (await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: QA_USERS.admin, password: 'qa-password-1' }) }).then((r) => r.json()).catch(() => ({}))).token;
if (!token) throw new Error('QA sign-in failed');
const call = async (method, url, body, branchId) => { const r = await fetch(BASE + url, { method, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...(branchId && { 'x-branch-id': branchId }) }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, body: await r.json().catch(() => ({})) }; };

const T = Date.now().toString(36).toUpperCase();
const a = await prisma.location.findFirst({ where: { code: 'QA-L01' } }); const b = await prisma.location.findFirst({ where: { code: 'QA-L02' } });
if (!a || !b) throw new Error('The QA branches QA-L01 and QA-L02 are not on file');
const coil = await prisma.coil.findFirst({ where: { locationId: a.id, status: 'AVAILABLE', qcStatus: { notIn: ['FAILED', 'HOLD'] }, inventory: { qtyOnHand: { gt: 0 }, qtyInTransit: 0 } }, select: { id: true, coilNumber: true } });
if (!coil) throw new Error('No free stock item at QA-L01 to cut');
const admin = await prisma.user.findFirst({ where: { email: QA_USERS.admin }, select: { id: true } });
const made = { wos: [], jobs: [], orders: [] };
const newWo = async (extra = {}) => { const r = await call('POST', '/api/work-orders', { woType: 'SLIT', sourceCoilId: coil.id, priority: 4, ...extra }); if (r.body?.id) made.wos.push(r.body.id); if (r.body?.jobMade && r.body?.job?.id) made.jobs.push(r.body.job.id); return r; };
let wasJobless = [];
try {
  // 1. A work order from the Work Orders page makes its own job.
  const first = await newWo({ scheduledDate: '2027-01-15T00:00:00.000Z' });
  check('the work order is saved', first.status === 201, `${first.status} ${JSON.stringify(first.body).slice(0, 160)}`);
  check('it comes back with its job', Boolean(first.body.job?.id) && first.body.jobMade === true, JSON.stringify(first.body.job || null));
  const job = first.body.job?.id ? await prisma.job.findUnique({ where: { id: first.body.job.id } }) : null;
  check('the job starts as ORDERED, so it is on the Order Board to be planned', job?.status === 'ORDERED', job?.status);
  check('the job has a stock-work number (JS-)', /^JS-\d+$/.test(job?.jobNumber || ''), job?.jobNumber);
  check('the job carries the priority and the date', job?.priority === 4 && job?.scheduledEnd?.toISOString() === '2027-01-15T00:00:00.000Z', `${job?.priority} ${job?.scheduledEnd?.toISOString()}`);
  check('the job says what is cut and names the work order', (job?.instructions || '').includes(coil.coilNumber) && (job?.instructions || '').includes(first.body.woNumber), job?.instructions);
  check('the job and the work order point at each other', job?.workOrderId === first.body.id && first.body.jobId === job?.id);
  check('no operation type is set, so the planner may pick any machine', job?.operationType === null, job?.operationType);

  const board = await call('GET', '/api/jobs?status=ORDERED&limit=500', null, a.id);
  const rows = Array.isArray(board.body) ? board.body : (board.body.jobs || board.body.data || []);
  check('the job is in the Order Board list at the branch that holds the stock', rows.some((j) => j.id === job?.id), `${board.status} ${rows.length} rows`);
  const elsewhere = await call('GET', `/api/jobs/${job?.id}`, null, b.id);
  check('another branch does not see it', elsewhere.status === 404, elsewhere.status);
  const page = await call('GET', `/api/work-orders/${first.body.id}`);
  check('the work order page gets its job', page.body.job?.id === job?.id && page.body.job?.jobNumber === job?.jobNumber);
  const list = await call('GET', `/api/work-orders?search=${first.body.woNumber}`);
  check('the work order list names the job', Array.isArray(list.body) && list.body[0]?.job?.jobNumber === job?.jobNumber, JSON.stringify(list.body?.[0]?.job || null));
  const material = await call('GET', `/api/jobs/${job?.id}/material`);
  check('the job shows the work order as its material', material.status !== 200 || JSON.stringify(material.body).includes(first.body.woNumber), material.status);

  // 2. Opened from a job, it stays that job's and makes no other.
  const before = await prisma.job.count();
  const second = await newWo({ jobId: job?.id });
  check('a work order opened from a job is that job\'s', second.status === 201 && second.body.jobId === job?.id && second.body.jobMade === false, `${second.status} ${second.body.jobId}`);
  check('and no new job is made', (await prisma.job.count()) === before);

  // 3. Cancelling: the job stays while another work order is cutting for it, and goes with the last one.
  const cancelSecond = await call('PUT', `/api/work-orders/${second.body.id}/cancel`);
  check('cancelling a work order the job did not come from leaves the job', cancelSecond.status === 200 && (await prisma.job.findUnique({ where: { id: job?.id || '' } }))?.status === 'ORDERED');
  const third = await newWo({ jobId: job?.id });
  const cancelFirstEarly = await call('PUT', `/api/work-orders/${first.body.id}/cancel`);
  check('cancelling the first work order leaves the job while another is still cutting for it', cancelFirstEarly.status === 200 && (await prisma.job.findUnique({ where: { id: job?.id || '' } }))?.status === 'ORDERED');
  await call('PUT', `/api/work-orders/${third.body.id}/cancel`);

  const own = await newWo();
  const ownJob = own.body.job?.id;
  const cancelOwn = await call('PUT', `/api/work-orders/${own.body.id}/cancel`);
  const after = ownJob ? await prisma.job.findUnique({ where: { id: ownJob } }) : null;
  check('cancelling a work order cancels the job it made', cancelOwn.status === 200 && after?.status === 'CANCELLED', `${cancelOwn.status} ${after?.status}`);
  const history = ownJob ? await call('GET', `/api/jobs/${ownJob}/history`) : { body: {} };
  check('the job history says why', JSON.stringify(history.body).includes(`Work order ${own.body.woNumber} was cancelled`), JSON.stringify(history.body).slice(0, 200));

  const started = await newWo();
  if (started.body.job?.id) await prisma.job.update({ where: { id: started.body.job.id }, data: { status: 'IN_PROCESS' } });
  await call('PUT', `/api/work-orders/${started.body.id}/cancel`);
  check('a job that has started is not cancelled with its work order', (await prisma.job.findUnique({ where: { id: started.body.job?.id || '' } }))?.status === 'IN_PROCESS');

  // 4. For an order line: it makes the line's job, and a second work order joins it.
  const order = await prisma.order.create({ data: { orderNumber: `QAWJ-${T}`, orderType: 'SO', createdById: admin.id, locationId: a.id, lines: { create: [{ lineNumber: 1, qtyOrdered: 100 }] } }, include: { lines: true } });
  made.orders.push(order.id);
  const forLine = await newWo({ lineId: order.lines[0].id });
  const lineJob = forLine.body.job?.id ? await prisma.job.findUnique({ where: { id: forLine.body.job.id } }) : null;
  check('a work order for an order line makes the line\'s job', forLine.status === 201 && lineJob?.orderLineId === order.lines[0].id && lineJob?.orderId === order.id && lineJob?.status === 'ORDERED', `${forLine.status} ${JSON.stringify(forLine.body).slice(0, 160)}`);
  check('numbered after the order and the line', lineJob?.jobNumber === `JOB-QAWJ-${T}-1`, lineJob?.jobNumber);
  const again = await newWo({ lineId: order.lines[0].id });
  check('a second work order for the line joins the same job', again.status === 201 && again.body.jobId === lineJob?.id && again.body.jobMade === false, `${again.status} ${again.body.jobId}`);

  // 6. The job shows on the boards with a branch picked (owner, 2026-11-25: work orders were on no board).
  const shown = await newWo();
  const shownJob = shown.body.job?.id;
  const rowsOf = (r) => (Array.isArray(r.body) ? r.body : r.body.jobs || []);
  const boardAll = rowsOf(await call('GET', '/api/jobs')).find((j) => j.id === shownJob);
  check('the Order Board list has the stock job, naming its work order and stock item', boardAll?.workOrders?.[0]?.woNumber === shown.body.woNumber && boardAll.workOrders[0].stockNumber === coil.coilNumber && boardAll.workOrders[0].work === 'Slit', JSON.stringify(boardAll?.workOrders));
  check('the job list for its branch has it', rowsOf(await call('GET', `/api/jobs?locationId=${a.id}`)).some((j) => j.id === shownJob));
  const other = await prisma.location.findFirst({ where: { code: 'QA-L02' } });
  check('the job list for another branch does not', !rowsOf(await call('GET', `/api/jobs?locationId=${other.id}`)).some((j) => j.id === shownJob));
  const ov = (await call('GET', `/api/jobs/overview?locationId=${a.id}`)).body;
  const ovRow = (ov.jobs || []).find((j) => j.id === shownJob);
  check('the Workflow board for its branch has it, in Not planned, at the stock\'s branch', ovRow?.stage === 'NOT_PLANNED' && ovRow.locationId === a.id && ovRow.workOrders?.[0]?.woNumber === shown.body.woNumber, JSON.stringify(ovRow).slice(0, 200));
  check('the Workflow board for another branch does not', !((await call('GET', `/api/jobs/overview?locationId=${other.id}`)).body.jobs || []).some((j) => j.id === shownJob));
  const cancelled = await newWo({ jobId: shownJob });
  await call('PUT', `/api/work-orders/${cancelled.body.id}/cancel`);
  check('a cancelled work order is not named on the card', rowsOf(await call('GET', '/api/jobs')).find((j) => j.id === shownJob)?.workOrders?.length === 1);

  // 7. A work order from before work orders had jobs is counted, and given a job with one press.
  const old = await prisma.workOrder.create({ data: { woNumber: `QAWJ-OLD-${T}`, woType: 'CTL', status: 'READY', sourceCoilId: coil.id, priority: 4, inputWeightLb: 500 } }); made.wos.push(old.id);
  const done = await prisma.workOrder.create({ data: { woNumber: `QAWJ-DONE-${T}`, woType: 'CTL', status: 'COMPLETE', sourceCoilId: coil.id } }); made.wos.push(done.id);
  // The QA data's own work orders with no job are put back as they were afterwards.
  wasJobless = (await prisma.workOrder.findMany({ where: { jobId: null, id: { notIn: made.wos } }, select: { id: true } })).map((w) => w.id);
  const noJob = await call('GET', '/api/work-orders/without-job');
  check('the open work order with no job is counted; the finished one is not', noJob.status === 200 && noJob.body.count >= 1 && (await prisma.workOrder.count({ where: { jobId: null, status: { in: ['DRAFT', 'READY', 'IN_PROGRESS', 'QC_HOLD'] } } })) === noJob.body.count, JSON.stringify(noJob.body));
  const fill = await call('POST', '/api/work-orders/make-missing-jobs');
  const oldNow = await prisma.workOrder.findUnique({ where: { id: old.id }, include: { job: true } });
  if (fill.body.workOrders) for (const w of fill.body.workOrders) { const j = await prisma.job.findUnique({ where: { jobNumber: w.jobNumber }, select: { id: true } }); if (j && w.jobMade) made.jobs.push(j.id); }
  check('it is given a job to be planned, named after it', fill.status === 200 && oldNow?.job?.status === 'ORDERED' && oldNow.job.workOrderId === old.id && (oldNow.job.instructions || '').includes(`Cut to length ${coil.coilNumber} (500 lb), QAWJ-OLD-${T}`), `${fill.status} ${oldNow?.job?.instructions}`);
  check('with its priority', oldNow?.job?.priority === 4, String(oldNow?.job?.priority));
  check('none is left, and the finished work order still has no job', fill.body.left === 0 && (await prisma.workOrder.findUnique({ where: { id: done.id } })).jobId === null, JSON.stringify(fill.body).slice(0, 120));
  check('its job is on the board for its branch', ((await call('GET', `/api/jobs/overview?locationId=${a.id}`)).body.jobs || []).some((j) => j.id === oldNow?.jobId));
  const twice = await call('POST', '/api/work-orders/make-missing-jobs');
  check('pressing again makes nothing', twice.status === 200 && twice.body.made === 0);
  check('the work order page route is not taken for these', (await call('GET', '/api/work-orders/without-job')).body.count === 0);

  // 5. A refused work order leaves no job behind.
  const jobsBefore = await prisma.job.count();
  const bad = await call('POST', '/api/work-orders', { woType: 'SLIT', sourceCoilId: '00000000-0000-0000-0000-000000000000' });
  check('a refused work order makes no job', bad.status === 400 && (await prisma.job.count()) === jobsBefore, bad.status);
} finally {
  await prisma.workOrder.updateMany({ where: { id: { in: wasJobless } }, data: { jobId: null } }).catch(() => {});
  await prisma.auditLog.deleteMany({ where: { resourceId: { in: [...made.wos, ...made.jobs, ...wasJobless] }, eventType: { in: ['WORK_ORDER_JOB_MADE', 'WORK_ORDER_CREATED', 'WORK_ORDER_STATUS_CHANGED'] } } }).catch(() => {});
  await prisma.auditLog.deleteMany({ where: { resourceId: { in: [...made.wos, ...made.jobs] } } }).catch(() => {});
  await prisma.workOrder.deleteMany({ where: { id: { in: made.wos } } }).catch((e) => console.log('cleanup work orders', e.message.slice(-120)));
  await prisma.job.deleteMany({ where: { id: { in: made.jobs } } }).catch((e) => console.log('cleanup jobs', e.message.slice(-120)));
  await prisma.order.deleteMany({ where: { id: { in: made.orders } } }).catch((e) => console.log('cleanup orders', e.message.slice(-120)));
  await prisma.$disconnect();
}
for (const f of failed) console.log(`✗ ${f}`);
console.log(`work order job: ${pass} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
