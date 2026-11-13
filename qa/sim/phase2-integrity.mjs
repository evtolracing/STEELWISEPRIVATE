// Phase 2 integrity checks: multi-step saves that must be all-or-nothing (B-010), simultaneous
// requests on the shop floor (C-005), who may create or change a login (C-001), empty saves
// (B-008) and field lists on changing routes (B-007).
// Runs against a QA server and checks every answer against the database.
//   node qa/sim/phase2-integrity.mjs [--base http://localhost:3011]
import fs from 'node:fs';
import { prismaClient, api } from './lib.mjs';

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('base', 'http://localhost:3011');
const OUT = arg('out', 'qa/results/phase2-integrity.json');
const prisma = prismaClient();
const A = api(BASE);
const findings = []; let checks = 0;
const check = (name, ok, detail) => { checks++; if (!ok) findings.push(`${name}${detail ? ` — ${detail}` : ''}`); };
const run = Date.now().toString(36).toUpperCase();

for (const who of ['admin', 'csr', 'operator', 'branchA', 'regional']) await A.login(who);
const loc = Object.fromEntries((await prisma.location.findMany({ where: { code: { in: ['QA-L01', 'QA-L02', 'QA-L04'] } } })).map((l) => [l.code, l.id]));
const L1 = loc['QA-L01'], L4 = loc['QA-L04'];
const wc = await prisma.workCenter.findFirst({ where: { locationId: L1 } });

// Test fixtures the product has no seed for: one work center type and two operators.
const TYPE = 'QA-P2-SAW';
await prisma.workCenterType.upsert({ where: { id: TYPE }, update: { isActive: true }, create: { id: TYPE, label: 'QA saw' } });
const operators = [];
for (const n of [1, 2]) {
  const code = `QA-P2-OP${n}`;
  operators.push(await prisma.operator.findFirst({ where: { employeeCode: code } })
    || await prisma.operator.create({ data: { employeeCode: code, firstName: 'QA', lastName: `Operator ${n}`, homeLocationId: L1 } }));
}
const moves = async (jobId) => (await prisma.auditLog.findMany({ where: { resourceType: 'Job', resourceId: jobId, eventType: 'JOB_STATUS_CHANGED' }, orderBy: { timestamp: 'asc' } })).map((r) => r.details);
const jobOf = (id) => prisma.job.findUnique({ where: { id } });
const opsOf = (jobId) => prisma.dispatchOperation.findMany({ where: { dispatchJob: { jobId } }, orderBy: { sequence: 'asc' } });
const logsOf = (opId) => prisma.dispatchTimeLog.findMany({ where: { dispatchOperationId: opId }, orderBy: { startAt: 'asc' } });

/** A job at branch QA-L01 with a two-step plan. Returns { id, ops }. */
async function plannedJob(status = 'ORDERED') {
  const made = await A.post('/api/jobs', { workCenterId: wc.id, instructions: `QA phase 2 ${run}`, status });
  if (made.status !== 201) throw new Error(`job create ${made.status} ${JSON.stringify(made.body)}`);
  const plan = await A.post(`/api/jobs/${made.body.id}/plan`, { operations: [{ workCenterType: TYPE, name: 'Saw' }, { workCenterType: TYPE, name: 'Deburr' }] });
  return { id: made.body.id, plan, ops: await opsOf(made.body.id) };
}
const start = (op, i = 0, who = 'operator') => A.post(`/api/v1/operations/${op.id}/start`, { operatorId: operators[i].id, workCenterId: wc.id }, who);
const complete = (op, who = 'operator') => A.post(`/api/v1/operations/${op.id}/complete`, {}, who);

// ── Planning a job ──
const j1 = await plannedJob();
const dj = await prisma.dispatchJob.findUnique({ where: { jobId: j1.id } });
check('planning a job answers with its two operations', j1.plan.status === 200 && j1.ops.length === 2 && j1.ops.every((o) => o.status === 'PENDING'), `${j1.plan.status} ${JSON.stringify(j1.plan.body).slice(0, 160)}`);
check('the plan belongs to the branch of the job\'s work center, not to a made-up code', dj?.locationId === L1, `${dj?.locationId}`);
check('planning moves the job to SCHEDULED and the history says so', (await jobOf(j1.id)).status === 'SCHEDULED' && (await moves(j1.id)).some((m) => m.from === 'ORDERED' && m.to === 'SCHEDULED'));
const noSteps = await A.post(`/api/jobs/${j1.id}/plan`, { operations: [{ workCenterType: 'NO-SUCH-TYPE' }] });
check('a plan with an unknown work center type is refused and the old plan is kept', noSteps.status === 400 && (await opsOf(j1.id)).length === 2, `${noSteps.status}`);

// ── Starting, reassigning, pausing ──
const [op1, op2] = j1.ops;
const noOperator = await A.post(`/api/v1/operations/${op1.id}/start`, {}, 'operator');
check('starting an operation without an operator is refused and nothing changes', noOperator.status === 400 && (await logsOf(op1.id)).length === 0 && (await jobOf(j1.id)).status === 'SCHEDULED', `${noOperator.status}`);
const started = await start(op1);
const afterStart = (await opsOf(j1.id))[0];
check('starting the first operation starts the clock, the operation and the job together',
  started.status === 200 && afterStart.status === 'IN_PROCESS' && (await logsOf(op1.id)).filter((l) => l.status === 'RUNNING').length === 1 && (await jobOf(j1.id)).status === 'IN_PROCESS'
  && (await moves(j1.id)).some((m) => m.from === 'SCHEDULED' && m.to === 'IN_PROCESS'), `${started.status}`);
const badGive = await A.post(`/api/v1/operations/${op1.id}/reassign`, { operatorId: '00000000-0000-0000-0000-000000000000' }, 'admin');
check('giving an operation to an operator who does not exist is refused and the clock keeps running',
  badGive.status === 400 && (await logsOf(op1.id)).filter((l) => l.status === 'RUNNING').length === 1 && (await opsOf(j1.id))[0].assignedOperatorId === operators[0].id, `${badGive.status}`);
const give = await A.post(`/api/v1/operations/${op1.id}/reassign`, { operatorId: operators[1].id }, 'admin');
check('giving an operation to another operator pauses the clock and records the new operator',
  give.status === 200 && (await logsOf(op1.id)).every((l) => l.status === 'PAUSED' && l.endAt) && (await opsOf(j1.id))[0].assignedOperatorId === operators[1].id, `${give.status}`);
const restarted = await start(op1, 1);
const paused = await A.post(`/api/v1/operations/${op1.id}/pause`, { downtimeReason: 'QA' }, 'operator');
check('an operation can be started again and paused', restarted.status === 200 && paused.status === 200 && (await logsOf(op1.id)).filter((l) => l.status === 'RUNNING').length === 0, `${restarted.status} ${paused.status}`);

// ── Completing ──
const done1 = await complete(op1);
check('completing one of two operations leaves the job in process', done1.status === 200 && (await jobOf(j1.id)).status === 'IN_PROCESS', `${done1.status}`);
const done2 = await complete(op2);
const toQc = async (id) => (await moves(id)).filter((m) => m.to === 'WAITING_QC').length;
check('completing the last operation sends the job to inspection, once', done2.status === 200 && (await jobOf(j1.id)).status === 'WAITING_QC' && (await toQc(j1.id)) === 1, `${done2.status}`);
const endBefore = (await opsOf(j1.id))[1].actualEnd;
const again = await complete(op2);
check('a repeated completion changes nothing', again.status === 200 && (await toQc(j1.id)) === 1 && String((await opsOf(j1.id))[1].actualEnd) === String(endBefore) && (await jobOf(j1.id)).status === 'WAITING_QC', `${again.status}`);

// Two operators finish the last two operations at the same moment (the lost-update case).
let stuck = 0, twice = 0;
const ROUNDS = 8;
for (let i = 0; i < ROUNDS; i++) {
  const j = await plannedJob('SCHEDULED');
  await start(j.ops[0], 0); await start(j.ops[1], 1);
  const both = await Promise.all([complete(j.ops[0]), complete(j.ops[1], 'admin')]);
  if (both.some((r) => r.status !== 200) || (await jobOf(j.id)).status !== 'WAITING_QC') stuck++;
  if ((await toQc(j.id)) !== 1) twice++;
}
check(`two operators finishing the last two operations together: the job reaches inspection every time (${ROUNDS} rounds)`, stuck === 0, `${stuck} jobs left in process`);
check('and the history has exactly one move to inspection each time', twice === 0, `${twice} jobs`);

// ── A cancelled job ──
const jc = await plannedJob('SCHEDULED');
await start(jc.ops[0]);
const cancel = await A.post(`/api/jobs/${jc.id}/status`, { status: 'CANCELLED', note: 'QA' });
const lateDone = await complete(jc.ops[0]);
const lateDone2 = await complete(jc.ops[1]);
const lateStart = await start(jc.ops[1]);
check('an operation of a cancelled job cannot be completed or started, and the job stays cancelled',
  cancel.status === 200 && lateDone.status === 409 && lateDone2.status === 409 && lateStart.status === 409 && (await jobOf(jc.id)).status === 'CANCELLED' && (await toQc(jc.id)) === 0,
  `${cancel.status} ${lateDone.status} ${lateDone2.status} ${lateStart.status}`);

// Cancelling while the last operation is being completed: whichever lands first, the records agree.
let disagree = 0;
for (let i = 0; i < ROUNDS; i++) {
  const j = await plannedJob('SCHEDULED');
  await start(j.ops[0]); await complete(j.ops[0]); await start(j.ops[1], 1);
  const [c, d] = await Promise.all([A.post(`/api/jobs/${j.id}/status`, { status: 'CANCELLED' }), complete(j.ops[1])]);
  const job = await jobOf(j.id); const hist = await moves(j.id);
  const chain = hist.every((m, k) => k === 0 || m.from === hist[k - 1].to) && hist[hist.length - 1]?.to === job.status;
  const answersFit = [200, 409].includes(c.status) && [200, 409].includes(d.status) && (c.status === 200 ? job.status === 'CANCELLED' : job.status === 'WAITING_QC');
  if (!chain || !answersFit) disagree++;
}
check(`cancelling a job while its last operation completes: the job, its history and the answers agree (${ROUNDS} rounds)`, disagree === 0, `${disagree} rounds`);

// Two people move the same job at the same moment.
let broken = 0;
for (let i = 0; i < ROUNDS; i++) {
  const made = await A.post('/api/jobs', { workCenterId: wc.id, instructions: `QA phase 2 move ${run}`, status: 'SCHEDULED' });
  const id = made.body.id;
  const pair = await Promise.all([A.post(`/api/jobs/${id}/status`, { status: 'IN_PROCESS' }), A.patch(`/api/jobs/${id}/status`, { status: 'ON_HOLD' })]);
  const hist = await moves(id); const job = await jobOf(id);
  const ok200 = pair.filter((r) => r.status === 200).length;
  if (hist.length !== ok200 || !hist.every((m, k) => (k === 0 ? m.from === 'SCHEDULED' : m.from === hist[k - 1].to)) || hist[hist.length - 1]?.to !== job.status || pair.some((r) => ![200, 409].includes(r.status))) broken++;
}
check(`two people moving the same job together: every accepted move is in the history, in order (${ROUNDS} rounds)`, broken === 0, `${broken} rounds`);

// ── Who may create or change a login (C-001) ──
const me = await prisma.user.findUnique({ where: { email: 'qa-regional@qa.test' } });
const boss = await prisma.user.findUnique({ where: { email: 'qa-admin@qa.test' } });
const person = (extra) => ({ email: `qa-p2-${run}-${Math.random().toString(36).slice(2, 8)}@qa.test`.toLowerCase(), password: 'qa-password-1', firstName: 'QA', lastName: 'Phase2', role: 'CSR', homeLocationId: L1, ...extra });
const tryCreate = async (extra, who = 'regional') => { const body = person(extra); const r = await A.post('/api/users', body, who); return { r, row: await prisma.user.findUnique({ where: { email: body.email } }) }; };
for (const role of ['SUPER_ADMIN', 'ADMIN', 'EXECUTIVE', 'BRANCH_MANAGER']) {
  const t = await tryCreate({ role });
  check(`a branch manager cannot create a ${role} login`, t.r.status === 403 && !t.row, `${t.r.status}`);
}
const far = await tryCreate({ homeLocationId: L4 });
check('a branch manager cannot create a login at a branch they are not in', far.r.status === 403 && !far.row, `${far.r.status}`);
const farExtra = await tryCreate({ locationIds: [L4] });
check('a branch manager cannot add a branch they are not in to a new login', farExtra.r.status === 403 && !farExtra.row, `${farExtra.r.status}`);
const own = await tryCreate({});
check('a branch manager can create a sales login at their own branch', own.r.status === 201 && own.row?.role === 'CSR' && own.row?.homeLocationId === L1, `${own.r.status} ${JSON.stringify(own.r.body).slice(0, 120)}`);
const selfUp = await A.put(`/api/users/${me.id}`, { role: 'SUPER_ADMIN' }, 'regional');
check('a branch manager cannot change their own role', selfUp.status === 403 && (await prisma.user.findUnique({ where: { id: me.id } })).role === 'BRANCH_MANAGER', `${selfUp.status}`);
const selfBranch = await A.put(`/api/users/${me.id}`, { locationIds: [L1, L4] }, 'regional');
check('a branch manager cannot add a branch to themselves', selfBranch.status === 403 && (await prisma.userLocation.count({ where: { userId: me.id, locationId: L4 } })) === 0, `${selfBranch.status}`);
const bossEdit = await A.put(`/api/users/${boss.id}`, { firstName: 'Changed' }, 'regional');
check('a branch manager cannot change a super admin', bossEdit.status === 403 && (await prisma.user.findUnique({ where: { id: boss.id } })).firstName !== 'Changed', `${bossEdit.status}`);
if (own.row) {
  const promote = await A.put(`/api/users/${own.row.id}`, { role: 'ADMIN' }, 'regional');
  check('a branch manager cannot promote their staff to admin', promote.status === 403 && (await prisma.user.findUnique({ where: { id: own.row.id } })).role === 'CSR', `${promote.status}`);
  const rename = await A.put(`/api/users/${own.row.id}`, { title: 'Inside sales' }, 'regional');
  check('a branch manager can change the details of their own staff', rename.status === 200 && (await prisma.user.findUnique({ where: { id: own.row.id } })).title === 'Inside sales', `${rename.status}`);
}
const csrTry = await tryCreate({}, 'csr');
check('a sales login cannot create a login', csrTry.r.status === 403 && !csrTry.row, `${csrTry.r.status}`);

// ── Empty saves (B-008) ──
const counts = async () => ({ jobs: await prisma.job.count(), orders: await prisma.order.count() });
const before = await counts();
const empties = [['/api/jobs', {}], ['/api/v1/contacts', {}], ['/api/v1/contacts', { name: '  ' }], ['/api/v1/orders', {}], ['/api/orders/intake', {}]];
for (const [url, body] of empties) {
  const r = await A.post(url, body, 'admin');
  check(`${url}: a save with nothing in it is refused`, r.status === 400, `${r.status} ${JSON.stringify(body)}`);
}
const afterEmpty = await counts();
check('and no record was created by them', afterEmpty.jobs === before.jobs && afterEmpty.orders === before.orders, JSON.stringify(afterEmpty));

// ── Field lists (B-007) ──
const code = `QA-P2-${run}`;
const wcNew = await A.post('/api/work-centers', { code, name: 'QA phase 2 saw', locationId: L1, type: 'SAW', id: '11111111-1111-1111-1111-111111111111', createdAt: '2000-01-01T00:00:00Z' }, 'admin');
const wcRow = await prisma.workCenter.findUnique({ where: { code } });
check('a work center can be created, and fields the browser may not set are ignored', wcNew.status === 201 && wcRow && wcRow.id !== '11111111-1111-1111-1111-111111111111' && wcRow.createdAt.getUTCFullYear() > 2000, `${wcNew.status} ${JSON.stringify(wcNew.body).slice(0, 120)}`);
const wcDup = await A.post('/api/work-centers', { code, name: 'again', locationId: L1 }, 'admin');
check('a second work center with the same code is refused', wcDup.status === 409, `${wcDup.status}`);
const wcNoBranch = await A.post('/api/work-centers', { code: `${code}-X`, name: 'x', locationId: '00000000-0000-0000-0000-000000000000' }, 'admin');
check('a work center at a branch that does not exist is refused', wcNoBranch.status === 400, `${wcNoBranch.status}`);
if (wcRow) {
  const wcEdit = await A.patch(`/api/work-centers/${wcRow.id}`, { createdAt: '2000-01-01T00:00:00Z', code: 'x'.repeat(200) }, 'admin');
  const wcSame = await prisma.workCenter.findUnique({ where: { id: wcRow.id } });
  check('changing a work center with a bad value is refused and nothing changes', wcEdit.status === 400 && wcSame.code === code && wcSame.createdAt.getTime() === wcRow.createdAt.getTime(), `${wcEdit.status}`);
  const wcOnly = await A.patch(`/api/work-centers/${wcRow.id}`, { createdAt: '2000-01-01T00:00:00Z' }, 'admin');
  check('changing only a field the browser may not set is refused', wcOnly.status === 400 && (await prisma.workCenter.findUnique({ where: { id: wcRow.id } })).createdAt.getTime() === wcRow.createdAt.getTime(), `${wcOnly.status}`);
  const wcName = await A.patch(`/api/work-centers/${wcRow.id}`, { name: 'QA phase 2 saw B' }, 'admin');
  check('changing a work center\'s name works', wcName.status === 200 && (await prisma.workCenter.findUnique({ where: { id: wcRow.id } })).name === 'QA phase 2 saw B', `${wcName.status}`);
}
const session = await A.post('/api/pos/sessions', { userId: boss.id, entryPoint: 'COUNTER' }, 'csr');
const csrUser = await prisma.user.findUnique({ where: { email: 'qa-csr@qa.test' } });
check('a counter session belongs to the person signed in, whatever user id the browser sends', session.status === 201 && JSON.stringify(session.body).includes(csrUser.id) && !JSON.stringify(session.body).includes(boss.id), `${session.status} ${JSON.stringify(session.body).slice(0, 160)}`);

fs.writeFileSync(OUT, JSON.stringify({ at: new Date().toISOString(), base: BASE, checks, problems: findings }, null, 2));
console.log(`${findings.length ? '✗' : '✓'} Phase 2 integrity: ${checks} checks, ${findings.length} problems`);
for (const f of findings) console.log(`  ✗ ${f}`);
await prisma.$disconnect();
process.exit(findings.length ? 1 : 0);
