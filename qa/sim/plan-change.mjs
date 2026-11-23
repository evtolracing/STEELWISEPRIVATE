#!/usr/bin/env node
// Changing a job's plan while it is in production (owner, 2026-11-22). A finished step is locked; a step with work
// recorded may move to another machine of the same kind and keeps its time; a step not started may be moved,
// replaced or removed; steps may be added; every change carries a reason and a name in the job's history; and only
// the people who run production may do it. Asked on the QA server, checked in the QA database.
//   node qa/sim/plan-change.mjs [--base http://localhost:3011]
import { QA_USERS, prismaClient, assertSafeDatabase } from './lib.mjs';

assertSafeDatabase(); const prisma = prismaClient();
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('base', 'http://localhost:3011');
let pass = 0; const failed = [];
const check = (name, ok, detail = '') => { if (ok) pass += 1; else failed.push(`${name}${detail === '' ? '' : `: ${detail}`}`); };
const token = {};
for (const who of ['admin', 'operator']) {
  token[who] = (await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: QA_USERS[who], password: 'qa-password-1' }) }).then((r) => r.json())).token;
  if (!token[who]) throw new Error(`QA sign-in failed for ${who}`);
}
const call = async (who, method, url, body) => { const r = await fetch(BASE + url, { method, headers: { authorization: `Bearer ${token[who]}`, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, body: await r.json().catch(() => null) }; };

const T = Date.now().toString(36).toUpperCase(); const SAW = `QAPC-SAW-${T}`; const DEB = `QAPC-DEB-${T}`;
const a = await prisma.location.findFirst({ where: { code: 'QA-L01' } }); const b = await prisma.location.findFirst({ where: { code: 'QA-L02' } });
if (!a || !b) throw new Error('The QA branches QA-L01 and QA-L02 are not on file');
const made = { jobs: [], wcs: [] };
try {
  for (const id of [SAW, DEB]) await prisma.workCenterType.create({ data: { id, label: `QA ${id}`, divisions: [], isActive: true } });
  const wc = async (name, type, loc, isActive = true) => { const w = await prisma.workCenter.create({ data: { code: `QAPC-${T}-${made.wcs.length}`, name, type, locationId: loc.id, isActive } }); made.wcs.push(w.id); return w; };
  const saw1 = await wc('QA plan saw 1', SAW, a); const saw2 = await wc('QA plan saw 2', SAW, a); const sawOff = await wc('QA plan saw offline', SAW, a, false);
  const deb1 = await wc('QA plan deburr 1', DEB, a); const sawElsewhere = await wc('QA plan saw at another branch', SAW, b);
  const admin = await prisma.user.findFirst({ where: { email: QA_USERS.admin }, select: { id: true } });
  const mkJob = async (status = 'IN_PROCESS') => {
    const job = await prisma.job.create({ data: { jobNumber: `QAPC-${T}-${made.jobs.length}`, status, operationType: 'SAW', createdById: admin.id } }); made.jobs.push(job.id);
    const plan = await prisma.dispatchJob.create({ data: { jobId: job.id, jobNumber: job.jobNumber, locationId: a.id, operations: { create: [
      { sequence: 1, name: 'First cut', requiredWorkCenterType: SAW, status: 'COMPLETE', assignedWorkCenterId: saw1.id },
      { sequence: 2, name: 'Second cut', requiredWorkCenterType: SAW, status: 'IN_PROCESS', assignedWorkCenterId: saw1.id },
      { sequence: 3, name: 'Deburr', requiredWorkCenterType: DEB, status: 'PENDING' },
    ] } }, include: { operations: { orderBy: { sequence: 'asc' } } } });
    const [done, running, waiting] = plan.operations;
    await prisma.dispatchTimeLog.create({ data: { dispatchOperationId: done.id, jobId: job.id, workCenterId: saw1.id, status: 'COMPLETE', startAt: new Date(Date.now() - 7200e3), endAt: new Date(Date.now() - 3600e3) } });
    const open = await prisma.dispatchTimeLog.create({ data: { dispatchOperationId: running.id, jobId: job.id, workCenterId: saw1.id, status: 'RUNNING', startAt: new Date(Date.now() - 600e3) } });
    return { job, done, running, waiting, open };
  };
  const J = await mkJob();
  const url = `/api/jobs/${J.job.id}/plan/change`;

  const read = await call('admin', 'GET', url);
  check('the plan is read with its machines and kinds', read.status === 200 && read.body.exists && read.body.steps.length === 3 && read.body.mayChange === true, `${read.status} ${JSON.stringify(read.body).slice(0, 200)}`);
  check('only this location\'s machines are offered', read.body.machines?.some((m) => m.id === saw2.id) && !read.body.machines?.some((m) => m.id === sawElsewhere.id));
  check('a finished step is marked finished and a running one as worked', read.body.steps?.[0]?.finished === true && read.body.steps?.[1]?.worked === true && read.body.steps?.[2]?.worked === false);
  const opRead = await call('operator', 'GET', url);
  check('an operator sees the plan but is told who may change it', opRead.status === 200 && opRead.body.mayChange === false && /work center lead/i.test(opRead.body.whyNot || ''), `${opRead.status} ${opRead.body?.whyNot}`);
  const keepAll = [{ id: J.running.id }, { id: J.waiting.id }];

  const opPut = await call('operator', 'PUT', url, { reason: 'x', steps: [{ id: J.running.id, workCenterId: saw2.id }, { id: J.waiting.id }] });
  check('an operator cannot change the plan', opPut.status === 403, opPut.status);
  const refuse = async (name, steps, pattern, reason = 'Saw 1 is down') => { const r = await call('admin', 'PUT', url, { reason, steps }); check(name, r.status >= 400 && r.status < 500 && pattern.test(r.body?.error || ''), `${r.status} ${r.body?.error}`); };
  await refuse('no reason is refused', [{ id: J.running.id, workCenterId: saw2.id }, { id: J.waiting.id }], /Say why/, '  ');
  await refuse('nothing changed is refused', keepAll, /Nothing was changed/);
  await refuse('a finished step cannot be changed', [{ id: J.done.id, workCenterId: saw2.id }, ...keepAll], /finished and cannot be changed/);
  await refuse('a running step cannot be removed', [{ id: J.waiting.id }], /has work recorded and cannot be removed/);
  await refuse('a running step cannot become another kind of work', [{ id: J.running.id, workCenterType: DEB }, { id: J.waiting.id }], /has work recorded, so it stays/);
  await refuse('a machine of another kind is refused', [{ id: J.running.id, workCenterId: deb1.id }, { id: J.waiting.id }], /does not do/);
  await refuse('an offline machine is refused', [{ id: J.running.id, workCenterId: sawOff.id }, { id: J.waiting.id }], /offline/);
  await refuse('a machine at another branch is refused', [{ id: J.running.id, workCenterId: sawElsewhere.id }, { id: J.waiting.id }], /not at this job's location/);
  await refuse('a step of another job is refused', [{ id: '00000000-0000-0000-0000-000000000000' }, ...keepAll], /not a step of this job's plan/);
  const untouched = await prisma.dispatchOperation.findMany({ where: { dispatchJobId: J.running.dispatchJobId }, orderBy: { sequence: 'asc' } });
  check('nothing was changed by the refused requests', untouched.length === 3 && untouched[1].assignedWorkCenterId === saw1.id && (await prisma.auditLog.count({ where: { resourceId: J.job.id, eventType: 'JOB_PLAN_CHANGED' } })) === 0);

  // The owner's case: the machine has to change while the step is running.
  const moved = await call('admin', 'PUT', url, { reason: 'Saw 1 blade broke', steps: [{ id: J.running.id, workCenterId: saw2.id }, { id: J.waiting.id }] });
  check('a running step is moved to another machine', moved.status === 200 && /moved to QA plan saw 2 from QA plan saw 1/.test((moved.body?.changes || []).join()), `${moved.status} ${JSON.stringify(moved.body).slice(0, 200)}`);
  const step = await prisma.dispatchOperation.findUnique({ where: { id: J.running.id }, include: { timeLogs: { orderBy: { startAt: 'asc' } } } });
  check('the step is on the new machine and still running', step.assignedWorkCenterId === saw2.id && step.status === 'IN_PROCESS');
  check('the time already recorded stays with the first machine, closed', step.timeLogs.length === 2 && step.timeLogs[0].id === J.open.id && step.timeLogs[0].workCenterId === saw1.id && step.timeLogs[0].endAt !== null, JSON.stringify(step.timeLogs.map((l) => [l.workCenterId === saw1.id ? 'saw1' : 'saw2', !!l.endAt])));
  check('the clock carries on at the new machine from the same moment', step.timeLogs[1]?.workCenterId === saw2.id && step.timeLogs[1]?.endAt === null && step.timeLogs[1]?.status === 'RUNNING' && +step.timeLogs[1].startAt === +step.timeLogs[0].endAt);
  const doneStill = await prisma.dispatchOperation.findUnique({ where: { id: J.done.id }, include: { _count: { select: { timeLogs: true } } } });
  check('the finished step and its time are untouched', doneStill.status === 'COMPLETE' && doneStill.sequence === 1 && doneStill.assignedWorkCenterId === saw1.id && doneStill._count.timeLogs === 1);
  const hist = await call('admin', 'GET', `/api/jobs/${J.job.id}/history`);
  const line = (Array.isArray(hist.body) ? hist.body : hist.body?.history || []).find((h) => h.type === 'PLAN');
  check('the job\'s history says what changed, why and who', !!line && /moved to QA plan saw 2/.test(line.note) && /Saw 1 blade broke/.test(line.note) && !!line.by, JSON.stringify(line || hist.body).slice(0, 200));

  // Steps not started: one replaced, one added in front of it, order changed.
  const reshaped = await call('admin', 'PUT', url, { reason: 'Customer asked for a second deburr pass', steps: [{ id: J.running.id }, { workCenterType: DEB, name: 'Deburr pass 2', workCenterId: deb1.id }, { id: J.waiting.id, name: 'Final deburr', workCenterId: deb1.id }] });
  check('a step is added and another renamed and given a machine', reshaped.status === 200, `${reshaped.status} ${reshaped.body?.error}`);
  const after = await prisma.dispatchOperation.findMany({ where: { dispatchJobId: J.running.dispatchJobId }, orderBy: { sequence: 'asc' } });
  check('the steps are numbered 1 to 4 in the order asked for', after.map((s) => `${s.sequence}:${s.name}`).join() === '1:First cut,2:Second cut,3:Deburr pass 2,4:Final deburr', after.map((s) => `${s.sequence}:${s.name}`).join());
  // The schedule follows: a step put on a machine is in that machine's queue, and one left without a machine waits.
  const q = await call('admin', 'GET', `/api/v1/dispatch/queue?workCenterId=${deb1.id}`);
  const names = (q.body?.data?.operations || []).map((o) => o.name);
  check('the steps put on a machine are in that machine\'s queue', q.status === 200 && names.includes('Deburr pass 2') && names.includes('Final deburr'), `${q.status} ${JSON.stringify(q.body).slice(0, 160)}`);
  const q2 = await call('admin', 'GET', `/api/v1/dispatch/queue?workCenterId=${saw2.id}`);
  const q1 = await call('admin', 'GET', `/api/v1/dispatch/queue?workCenterId=${saw1.id}`);
  const list = (r) => (r.body?.data?.operations || []).map((o) => o.id);
  check('the moved step is in the new machine\'s queue and gone from the old one', list(q2).includes(J.running.id) && !list(q1).includes(J.running.id));
  const off = await call('admin', 'PUT', url, { reason: 'Deburr 1 needed elsewhere', steps: [{ id: J.running.id }, ...after.slice(2).map((s) => (s.name === 'Final deburr' ? { id: s.id, workCenterId: null } : { id: s.id }))] });
  const offStep = await prisma.dispatchOperation.findUnique({ where: { id: J.waiting.id } });
  check('a step taken off its machine waits to be dispatched again', off.status === 200 && offStep.status === 'PENDING' && offStep.assignedWorkCenterId === null, `${off.status} ${off.body?.error} ${offStep.status}`);
  const removed = await call('admin', 'PUT', url, { reason: 'Second pass not needed after all', steps: [{ id: J.running.id }, { id: J.waiting.id }] });
  const left = await prisma.dispatchOperation.findMany({ where: { dispatchJobId: J.running.dispatchJobId }, orderBy: { sequence: 'asc' } });
  check('a step not started is removed and the rest renumbered', removed.status === 200 && left.map((s) => `${s.sequence}:${s.name}`).join() === '1:First cut,2:Second cut,3:Final deburr', `${removed.status} ${left.map((s) => `${s.sequence}:${s.name}`).join()}`);
  check('four changes are in the history', (await prisma.auditLog.count({ where: { resourceId: J.job.id, eventType: 'JOB_PLAN_CHANGED' } })) === 4);

  // Two people at once: both are applied one after the other, neither is lost, and the numbering stays whole.
  const both = await Promise.all([
    call('admin', 'PUT', url, { reason: 'Back to saw 1', steps: [{ id: J.running.id, workCenterId: saw1.id }, { id: J.waiting.id }] }),
    call('admin', 'PUT', url, { reason: 'Add inspection prep', steps: [{ id: J.running.id }, { id: J.waiting.id }, { workCenterType: DEB, name: 'Prep' }] }),
  ]);
  const end = await prisma.dispatchOperation.findMany({ where: { dispatchJobId: J.running.dispatchJobId }, orderBy: { sequence: 'asc' } });
  check('two changes at the same moment leave whole numbering and no server error', both.every((r) => r.status === 200 || r.status === 400 || r.status === 409) && end.map((s) => s.sequence).join() === end.map((_, i) => i + 1).join(), `${both.map((r) => r.status)} ${end.map((s) => s.sequence)}`);

  // The owner's decision: a shop floor lead may change a plan too. The QA operator is made a lead for one request.
  const op = await prisma.user.findFirst({ where: { email: QA_USERS.operator }, select: { id: true, role: true } });
  try {
    await prisma.user.update({ where: { id: op.id }, data: { role: 'WORKCENTER_LEAD' } });
    token.operator = (await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: QA_USERS.operator, password: 'qa-password-1' }) }).then((r) => r.json())).token;
    const now = await prisma.dispatchOperation.findMany({ where: { dispatchJobId: J.running.dispatchJobId, status: { not: 'COMPLETE' } }, orderBy: { sequence: 'asc' } });
    const other = now[0].assignedWorkCenterId === saw1.id ? saw2 : saw1;
    const lead = await call('operator', 'PUT', url, { reason: 'Lead moved it', steps: now.map((s, i) => (i === 0 ? { id: s.id, workCenterId: other.id } : { id: s.id })) });
    check('a work center lead can change the plan', lead.status === 200, `${lead.status} ${lead.body?.error}`);
  } finally { await prisma.user.update({ where: { id: op.id }, data: { role: op.role } }); }

  const closed = await mkJob('COMPLETED');
  const late = await call('admin', 'PUT', `/api/jobs/${closed.job.id}/plan/change`, { reason: 'too late', steps: [{ id: closed.running.id, workCenterId: saw2.id }, { id: closed.waiting.id }] });
  check('a job through production keeps its plan', late.status === 409 && /through production/.test(late.body?.error || ''), `${late.status} ${late.body?.error}`);
  const none = await call('admin', 'PUT', '/api/jobs/00000000-0000-0000-0000-000000000000/plan/change', { reason: 'x', steps: [] });
  check('a job not on file is 404', none.status === 404, none.status);
} finally {
  await prisma.auditLog.deleteMany({ where: { resourceId: { in: made.jobs }, eventType: 'JOB_PLAN_CHANGED' } }).catch(() => {});
  await prisma.job.deleteMany({ where: { id: { in: made.jobs } } }).catch((e) => console.log('cleanup jobs', e.message.slice(-120)));
  await prisma.workCenter.deleteMany({ where: { id: { in: made.wcs } } }).catch((e) => console.log('cleanup machines', e.message.slice(-120)));
  await prisma.workCenterType.deleteMany({ where: { id: { in: [SAW, DEB] } } }).catch(() => {});
  await prisma.$disconnect();
}
for (const f of failed) console.log(`✗ ${f}`);
console.log(`plan change: ${pass} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
