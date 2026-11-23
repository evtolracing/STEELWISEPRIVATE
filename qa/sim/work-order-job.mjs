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

  // 5. A refused work order leaves no job behind.
  const jobsBefore = await prisma.job.count();
  const bad = await call('POST', '/api/work-orders', { woType: 'SLIT', sourceCoilId: '00000000-0000-0000-0000-000000000000' });
  check('a refused work order makes no job', bad.status === 400 && (await prisma.job.count()) === jobsBefore, bad.status);
} finally {
  await prisma.auditLog.deleteMany({ where: { resourceId: { in: [...made.wos, ...made.jobs] } } }).catch(() => {});
  await prisma.workOrder.deleteMany({ where: { id: { in: made.wos } } }).catch((e) => console.log('cleanup work orders', e.message.slice(-120)));
  await prisma.job.deleteMany({ where: { id: { in: made.jobs } } }).catch((e) => console.log('cleanup jobs', e.message.slice(-120)));
  await prisma.order.deleteMany({ where: { id: { in: made.orders } } }).catch((e) => console.log('cleanup orders', e.message.slice(-120)));
  await prisma.$disconnect();
}
for (const f of failed) console.log(`✗ ${f}`);
console.log(`work order job: ${pass} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
