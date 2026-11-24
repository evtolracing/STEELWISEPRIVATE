#!/usr/bin/env node
// The details needed to do a job correctly (owner, 2026-11-24). The Plan Job box starts with the material that
// is already on file (the order line, or the stock a work order cuts); each step may say pieces, cut length,
// width, tolerance and instructions; and the job list, the job page, the work order and the Shop Floor queue
// all carry those details. Asked on the QA server, checked in the QA database.
//   node qa/sim/plan-details.mjs [--base http://localhost:3011]
import { QA_USERS, prismaClient, assertSafeDatabase } from './lib.mjs';

assertSafeDatabase(); const prisma = prismaClient();
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('base', 'http://localhost:3011');
let pass = 0; const failed = [];
const check = (name, ok, detail = '') => { if (ok) pass += 1; else failed.push(`${name}${detail === '' ? '' : `: ${detail}`}`); };
const token = (await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: QA_USERS.admin, password: 'qa-password-1' }) }).then((r) => r.json()).catch(() => ({}))).token;
if (!token) throw new Error('QA sign-in failed');
const call = async (method, url, body) => { const r = await fetch(BASE + url, { method, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, body: await r.json().catch(() => ({})) }; };

const T = Date.now().toString(36).toUpperCase(); const SAW = `QAPD-SAW-${T}`; const PACK = `QAPD-PACK-${T}`;
const a = await prisma.location.findFirst({ where: { code: 'QA-L01' } });
if (!a) throw new Error('The QA branch QA-L01 is not on file');
const admin = await prisma.user.findFirst({ where: { email: QA_USERS.admin }, select: { id: true } });
const made = { jobs: [], orders: [], wos: [], wcs: [] };
try {
  for (const id of [SAW, PACK]) await prisma.workCenterType.create({ data: { id, label: `QA ${id}`, divisions: [], isActive: true } });
  const saw = await prisma.workCenter.create({ data: { code: `QAPD-${T}`, name: 'QA details saw', type: SAW, locationId: a.id, isActive: true } }); made.wcs.push(saw.id);
  const order = await prisma.order.create({ data: { orderNumber: `QAPD-${T}`, orderType: 'SO', createdById: admin.id, locationId: a.id,
    lines: { create: [{ lineNumber: 1, description: 'Plate cut to size', qtyOrdered: 12, unit: 'EA', thicknessIn: 0.5, widthIn: 48, lengthIn: 96, gradeOverride: 'A36' }] } }, include: { lines: true } });
  made.orders.push(order.id);
  const job = await prisma.job.create({ data: { jobNumber: `QAPD-${T}-1`, status: 'ORDERED', orderId: order.id, orderLineId: order.lines[0].id, createdById: admin.id } }); made.jobs.push(job.id);

  // 1. The material fills itself in from the order line.
  const d = await call('GET', `/api/jobs/${job.id}/plan/defaults`);
  check('the plan starts with the order line\'s thickness, width, length, grade and pieces', d.status === 200 && d.body.thicknessIn === 0.5 && d.body.widthIn === 48 && d.body.lengthIn === 96 && d.body.grade === 'A36' && d.body.qty === 12, `${d.status} ${JSON.stringify(d.body).slice(0, 220)}`);
  check('and says where each came from', d.body.from?.thicknessIn === 'order line 1' && d.body.from?.qty === 'order line 1', JSON.stringify(d.body.from));
  check('a job not on file is 404', (await call('GET', '/api/jobs/00000000-0000-0000-0000-000000000000/plan/defaults')).status === 404);

  // 2. A wrong detail is refused and nothing is planned.
  const steps = (details1) => [{ workCenterType: SAW, name: 'Cut to length', details: details1 }, { workCenterType: PACK, name: 'Pack' }];
  const bad = await call('POST', `/api/jobs/${job.id}/plan`, { operations: steps({ qty: 0 }), locationId: a.id });
  check('zero pieces is refused, naming the step', bad.status === 400 && /Step 1: Pieces must be a whole number/.test(bad.body.error || ''), `${bad.status} ${bad.body.error}`);
  check('and the job is not planned', (await prisma.job.findUnique({ where: { id: job.id } })).status === 'ORDERED' && (await prisma.dispatchJob.count({ where: { jobId: job.id } })) === 0);

  // 3. Planning with details and no thickness typed: the step keeps its details, the plan takes the line's material.
  const ok = await call('POST', `/api/jobs/${job.id}/plan`, { operations: steps({ qty: 12, lengthIn: 24.5, tolerance: '+/- 1/16', notes: 'Deburr both ends' }), locationId: a.id, widthIn: 48, lengthIn: 96 });
  check('the plan is saved', ok.status === 200 || ok.status === 201, `${ok.status} ${JSON.stringify(ok.body).slice(0, 200)}`);
  const plan = await prisma.dispatchJob.findUnique({ where: { jobId: job.id }, include: { operations: { orderBy: { sequence: 'asc' } } } });
  check('the step keeps pieces, cut length, tolerance and instructions', (({ qty, lengthIn, tolerance, notes, ...rest }) => qty === 12 && lengthIn === 24.5 && tolerance === '+/- 1/16' && notes === 'Deburr both ends' && Object.keys(rest).length === 0)(plan?.operations[0]?.details || {}), JSON.stringify(plan?.operations[0]?.details));
  check('a step with nothing said has no details', plan?.operations[1]?.details === null);
  check('the plan takes thickness and grade from the order line when none is typed', Number(plan?.thickness) === 0.5 && plan?.grade === 'A36', `${plan?.thickness} ${plan?.grade}`);
  const after = await prisma.job.findUnique({ where: { id: job.id } });
  check('the size typed on the plan is saved on the job', Number(after.widthIn) === 48 && Number(after.lengthIn) === 96, `${after.widthIn} ${after.lengthIn}`);

  // 4. Every screen's data carries the detail line.
  const LINE = '12 pcs · 24.5" long · tol +/- 1/16 · Deburr both ends';
  const read = await call('GET', `/api/jobs/${job.id}/plan`);
  check('the Plan Job box reads the details back for editing', read.body.operations?.[0]?.details?.qty === 12 && read.body.operations?.[0]?.detail === LINE && read.body.dispatchJob?.widthIn === 48, JSON.stringify(read.body.operations?.[0]).slice(0, 200));
  const change = await call('GET', `/api/jobs/${job.id}/plan/change`);
  check('the job page plan has the detail line', change.body.steps?.[0]?.detail === LINE && change.body.steps?.[1]?.detail === null, JSON.stringify(change.body.steps?.map((s) => s.detail)));
  const list = await call('GET', `/api/jobs?orderId=${order.id}`);
  const rows = Array.isArray(list.body) ? list.body : (list.body.jobs || list.body.data || []);
  check('the job cards carry the detail line', rows.find((j) => j.id === job.id)?.planSteps?.[0]?.detail === LINE, JSON.stringify(rows.find((j) => j.id === job.id)?.planSteps));
  await prisma.dispatchOperation.update({ where: { id: plan.operations[0].id }, data: { status: 'SCHEDULED', assignedWorkCenterId: saw.id } });
  const queue = await call('GET', `/api/v1/dispatch/queue?workCenterId=${saw.id}&locationId=${a.id}`);
  const op = (queue.body.data?.operations || []).find((o) => o.id === plan.operations[0].id);
  check('the Shop Floor queue says what to do at the step', op?.detail === LINE && op?.details?.qty === 12 && op?.planSteps?.[0]?.detail === LINE, `${queue.status} ${JSON.stringify(op || null).slice(0, 200)}`);

  // 5. Changing the plan keeps the details of a step that stays.
  const kept = await call('PUT', `/api/jobs/${job.id}/plan/change`, { reason: 'No packing needed', steps: [{ id: plan.operations[0].id }] });
  const still = await prisma.dispatchOperation.findUnique({ where: { id: plan.operations[0].id } });
  check('a step kept through a plan change keeps its details', kept.status === 200 && still?.details?.qty === 12, `${kept.status} ${JSON.stringify(kept.body).slice(0, 160)}`);

  // 6. A work order's job starts from the stock it cuts.
  const coil = await prisma.coil.findFirst({ where: { locationId: a.id, status: 'AVAILABLE', qcStatus: { notIn: ['FAILED', 'HOLD'] }, thicknessIn: { gt: 0 }, inventory: { qtyOnHand: { gt: 0 }, qtyInTransit: 0 } }, select: { id: true, coilNumber: true, thicknessIn: true, widthIn: true, grade: { select: { code: true } } } });
  if (!coil) throw new Error('No free stock item with a thickness at QA-L01');
  const wo = await call('POST', '/api/work-orders', { woType: 'CTL', sourceCoilId: coil.id });
  if (wo.body.id) made.wos.push(wo.body.id); if (wo.body.job?.id) made.jobs.push(wo.body.job.id);
  const wd = await call('GET', `/api/jobs/${wo.body.job?.id}/plan/defaults`);
  check('a work order\'s job starts with the thickness and grade of the stock it cuts', wd.status === 200 && wd.body.thicknessIn === Number(coil.thicknessIn) && wd.body.grade === (coil.grade?.code || null) && wd.body.from?.thicknessIn === `stock item ${coil.coilNumber}`, `${wd.status} ${JSON.stringify(wd.body).slice(0, 220)}`);
  const wp = await call('POST', `/api/jobs/${wo.body.job?.id}/plan`, { operations: [{ workCenterType: SAW, name: 'Cut to length', details: { qty: 4, lengthIn: 36 } }], locationId: a.id });
  const wplan = await prisma.dispatchJob.findUnique({ where: { jobId: wo.body.job?.id || '' } });
  check('and its plan takes that thickness without anyone typing it', (wp.status === 200 || wp.status === 201) && Number(wplan?.thickness) === Number(coil.thicknessIn), `${wp.status} ${wplan?.thickness}`);
  const wpage = await call('GET', `/api/work-orders/${wo.body.id}`);
  check('the work order page shows what to do at each step', wpage.body.job?.planSteps?.[0]?.detail === '4 pcs · 36" long', JSON.stringify(wpage.body.job?.planSteps));
} finally {
  await prisma.auditLog.deleteMany({ where: { resourceId: { in: [...made.jobs, ...made.wos] } } }).catch(() => {});
  await prisma.workOrder.deleteMany({ where: { id: { in: made.wos } } }).catch((e) => console.log('cleanup work orders', e.message.slice(-120)));
  await prisma.job.deleteMany({ where: { id: { in: made.jobs } } }).catch((e) => console.log('cleanup jobs', e.message.slice(-120)));
  await prisma.order.deleteMany({ where: { id: { in: made.orders } } }).catch((e) => console.log('cleanup orders', e.message.slice(-120)));
  await prisma.workCenter.deleteMany({ where: { id: { in: made.wcs } } }).catch((e) => console.log('cleanup machines', e.message.slice(-120)));
  await prisma.workCenterType.deleteMany({ where: { id: { in: [SAW, PACK] } } }).catch(() => {});
  await prisma.$disconnect();
}
for (const f of failed) console.log(`✗ ${f}`);
console.log(`plan details: ${pass} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
