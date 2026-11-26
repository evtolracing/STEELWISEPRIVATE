#!/usr/bin/env node
// The Production Workflow board's cards can be arranged and moved (owner, 2026-11-25). The order of a column is
// kept on the server for everyone; a place counts only while the job is still in that column; an order that names a
// job no longer in the column is refused whole; and only the people who may change a plan may arrange. The moves a
// drag asks for (put on a machine, take off, on hold and back) go through the routes that already hold the rules.
// Asked on the QA server, checked in the QA database.
//   node qa/sim/board-arrange.mjs [--base http://localhost:3011]
import { QA_USERS, prismaClient, assertSafeDatabase } from './lib.mjs';

assertSafeDatabase(); const prisma = prismaClient();
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('base', 'http://localhost:3011');
let pass = 0; const failed = [];
const check = (name, ok, detail = '') => { if (ok) pass += 1; else failed.push(`${name}${detail === '' ? '' : `: ${detail}`}`); };
const signIn = async (email) => (await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'qa-password-1' }) }).then((r) => r.json()).catch(() => ({}))).token;
const token = await signIn(QA_USERS.admin);
if (!token) throw new Error('QA sign-in failed');
const call = async (method, url, body, as = token) => { const r = await fetch(BASE + url, { method, headers: { authorization: `Bearer ${as}`, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, body: await r.json().catch(() => ({})) }; };

const T = Date.now().toString(36).toUpperCase(); const KIND = `QABA-SAW-${T}`;
const a = await prisma.location.findFirst({ where: { code: 'QA-L01' } });
if (!a) throw new Error('The QA branch QA-L01 is not on file');
const admin = await prisma.user.findFirst({ where: { email: QA_USERS.admin }, select: { id: true } });
const made = { jobs: [], wcs: [] };
const board = async () => (await call('GET', `/api/jobs/overview?locationId=${a.id}`)).body;
const mine = (b, stage) => (b.jobs || []).filter((j) => made.jobs.includes(j.id) && j.stage === stage).map((j) => j.jobNumber.split('-').pop());
try {
  await prisma.workCenterType.create({ data: { id: KIND, label: `QA ${KIND}`, divisions: [], isActive: true } });
  const saw = await prisma.workCenter.create({ data: { code: `QABA-${T}`, name: 'QA board saw', type: KIND, locationId: a.id, isActive: true } }); made.wcs.push(saw.id);
  const jobs = {};
  for (const n of ['A', 'B', 'C', 'D']) { jobs[n] = await prisma.job.create({ data: { jobNumber: `QABA-${T}-${n}`, status: 'ORDERED', priority: 3, createdById: admin.id } }); made.jobs.push(jobs[n].id); }
  // A, B and C are planned with no machine picked: they wait for a machine. D stays not planned.
  for (const n of ['A', 'B', 'C']) {
    const p = await call('POST', `/api/jobs/${jobs[n].id}/plan`, { operations: [{ workCenterType: KIND, name: 'Cut' }], locationId: a.id, thickness: 0.25 });
    if (p.status > 201) throw new Error(`Planning ${n} failed: ${p.status} ${JSON.stringify(p.body).slice(0, 200)}`);
  }
  let b = await board();
  check('the board says the cards can be arranged, and that this person may', b.canArrange === true && b.mayArrange === true, `${b.canArrange} ${b.mayArrange}`);
  const start = b.jobs.find((j) => j.id === jobs.A.id)?.stage;
  check('the three planned jobs are in one column', ['NO_MACHINE', 'QUEUED'].includes(start) && mine(b, start).length === 3, `${start} ${mine(b, start)}`);
  check('a job never arranged has no place', b.jobs.find((j) => j.id === jobs.A.id)?.boardPosition === null);

  // 1. A column put in a new order keeps it.
  const col = b.jobs.filter((j) => j.stage === start).map((j) => j.id);
  const others = col.filter((id) => !made.jobs.includes(id));
  const put = await call('PUT', '/api/jobs/board-order', { stage: start, jobIds: [jobs.C.id, jobs.A.id, jobs.B.id, ...others] });
  check('the new order is saved', put.status === 200 && put.body.positions?.length === col.length, `${put.status} ${JSON.stringify(put.body).slice(0, 160)}`);
  b = await board();
  check('the board shows the column in that order', mine(b, start).join('') === 'CAB', mine(b, start).join(''));
  check('and the places are in the database, one per job', (await prisma.jobBoardPosition.count({ where: { jobId: { in: made.jobs } } })) === 3);
  check('with who arranged it', (await prisma.jobBoardPosition.findUnique({ where: { jobId: jobs.C.id } }))?.updatedById === admin.id);

  // 2. Arranged again: only the order changes, the same places are handed out.
  const before = (await prisma.jobBoardPosition.findMany({ where: { jobId: { in: made.jobs } } })).map((p) => p.position).sort((x, y) => x - y);
  await call('PUT', '/api/jobs/board-order', { stage: start, jobIds: [jobs.B.id, jobs.C.id, jobs.A.id, ...others] });
  b = await board();
  const after = (await prisma.jobBoardPosition.findMany({ where: { jobId: { in: made.jobs } } })).map((p) => p.position).sort((x, y) => x - y);
  check('arranging again changes the order', mine(b, start).join('') === 'BCA', mine(b, start).join(''));
  check('and reuses the same places', before.join() === after.join(), `${before} / ${after}`);

  // 3. What cannot be arranged is refused whole.
  const wrong = await call('PUT', '/api/jobs/board-order', { stage: start, jobIds: [jobs.D.id, jobs.A.id] });
  check('a job that is not in the column is refused, and says to refresh', wrong.status === 409 && /left this column/.test(wrong.body.error || ''), `${wrong.status} ${wrong.body.error}`);
  check('and nothing was arranged', (await prisma.jobBoardPosition.count({ where: { jobId: jobs.D.id } })) === 0 && mine(await board(), start).join('') === 'BCA');
  check('a column that is not one is refused', (await call('PUT', '/api/jobs/board-order', { stage: 'NOWHERE', jobIds: [jobs.A.id] })).status === 400);
  check('a job named twice is refused', (await call('PUT', '/api/jobs/board-order', { stage: start, jobIds: [jobs.A.id, jobs.A.id] })).status === 400);
  check('an empty order is refused', (await call('PUT', '/api/jobs/board-order', { stage: start, jobIds: [] })).status === 400);
  check('a job not on file is refused', (await call('PUT', '/api/jobs/board-order', { stage: start, jobIds: ['00000000-0000-0000-0000-000000000000'] })).status === 409);
  const operator = await signIn(QA_USERS.operator);
  if (operator) {
    const no = await call('PUT', '/api/jobs/board-order', { stage: start, jobIds: [jobs.A.id, jobs.B.id, jobs.C.id] }, operator);
    check('an operator may not arrange the board', no.status === 403, `${no.status} ${no.body.error}`);
    check('and the board tells an operator so', (await call('GET', `/api/jobs/overview?locationId=${a.id}`, null, operator)).body.mayArrange === false);
  } else check('an operator can sign in for the check', false);
  check('not signed in is refused', (await fetch(`${BASE}/api/jobs/board-order`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: '{}' })).status === 401);

  // 4. A drag to another column: put on a machine (through Change plan), and the place does not follow the job.
  const plan = (await call('GET', `/api/jobs/${jobs.A.id}/plan/change`)).body;
  const toStep = (workCenterId) => ({ reason: 'Put on a machine from the production board', steps: plan.steps.map((s) => ({ id: s.id, name: s.name, workCenterType: s.requiredWorkCenterType, workCenterId })) });
  const other = start === 'NO_MACHINE' ? 'QUEUED' : 'NO_MACHINE';
  const moved = await call('PUT', `/api/jobs/${jobs.A.id}/plan/change`, toStep(start === 'NO_MACHINE' ? saw.id : null));
  check('its next step is put on a machine', moved.status === 200, `${moved.status} ${moved.body.error}`);
  b = await board();
  const rowA = b.jobs.find((j) => j.id === jobs.A.id);
  check('the job is in the other column', rowA?.stage === other, rowA?.stage);
  check('and arrives there unarranged', rowA?.boardPosition === null, String(rowA?.boardPosition));
  check('the column it left keeps its order', mine(b, start).join('') === 'BC', mine(b, start).join(''));

  // 5. On hold and back, as a drag asks.
  const hold = await call('POST', `/api/jobs/${jobs.B.id}/status`, { status: 'ON_HOLD', note: 'Waiting for the customer' });
  check('a job is put on hold', hold.status === 200, `${hold.status} ${hold.body.error}`);
  check('and shows in On hold', (await board()).jobs.find((j) => j.id === jobs.B.id)?.stage === 'ON_HOLD');
  const back = await call('POST', `/api/jobs/${jobs.B.id}/status`, { status: 'SCHEDULED' });
  b = await board();
  check('put back, it returns to the column its steps give it, in the place it had', back.status === 200 && mine(b, start).join('') === 'BC', `${back.status} ${mine(b, start).join('')}`);

  // 6. A place goes with its job.
  await prisma.job.delete({ where: { id: jobs.D.id } }).catch(() => {});
  await call('PUT', '/api/jobs/board-order', { stage: start, jobIds: [jobs.C.id, jobs.B.id] });
  await prisma.dispatchJob.deleteMany({ where: { jobId: jobs.C.id } });
  await prisma.job.delete({ where: { id: jobs.C.id } });
  check('a place is removed with its job', (await prisma.jobBoardPosition.count({ where: { jobId: jobs.C.id } })) === 0);
} finally {
  await prisma.auditLog.deleteMany({ where: { resourceId: { in: made.jobs } } }).catch(() => {});
  await prisma.jobBoardPosition.deleteMany({ where: { jobId: { in: made.jobs } } }).catch(() => {});
  await prisma.dispatchJob.deleteMany({ where: { jobId: { in: made.jobs } } }).catch(() => {});
  for (const id of made.jobs) await prisma.job.delete({ where: { id } }).catch(() => {});
  await prisma.workCenter.deleteMany({ where: { id: { in: made.wcs } } }).catch(() => {});
  await prisma.workCenterType.deleteMany({ where: { id: KIND } }).catch(() => {});
  await prisma.$disconnect();
}
for (const f of failed) console.log(`  ✗ ${f}`);
console.log(`board arrange: ${pass} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
