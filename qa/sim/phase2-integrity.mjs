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
const testStart = new Date();

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

// ── Counter sale and stock (B-025, owner's decision 6) ──
const csrHome = csrUser.homeLocationId;
const [disc, gloves] = await Promise.all(['CUT-DISC-9', 'WG-25'].map((sku) => prisma.product.findFirst({ where: { sku } })));
const like = await prisma.coil.findFirst({ where: { locationId: csrHome } });
const shelfCoil = await prisma.coil.create({ data: { coilNumber: `QA-SHELF-${run}`, form: like.form, heatId: like.heatId, gradeId: like.gradeId, ownerId: like.ownerId, productId: disc.id, locationId: csrHome, netWeightLb: 250, grossWeightLb: 250, createdById: boss.id } });
await prisma.inventory.create({ data: { coilId: shelfCoil.id, locationId: csrHome, qtyOnHand: 10, qtyAvailable: 10, unit: 'EA' } });
// Any other shelf stock of this product at the branch (from an earlier run) is emptied so the counts below are exact.
await prisma.inventory.updateMany({ where: { locationId: csrHome, unit: 'EA', coilId: { not: shelfCoil.id }, coil: { productId: disc.id } }, data: { qtyOnHand: 0, qtyAvailable: 0 } });
const shelf = async () => { const i = await prisma.inventory.findUnique({ where: { coilId: shelfCoil.id } }); return [Number(i.qtyOnHand), Number(i.qtyAvailable)].join('/'); };
const sell = (id, productId, quantity) => A.post('/api/pos/quick-sale/process-payment', { sale: { id, items: [{ productId, quantity }] }, payment: { method: 'CASH', amountTendered: 100000 } }, 'csr');
const sold = (orderId, reason = 'COUNTER_SALE') => prisma.materialMovement.findMany({ where: { orderId, reasonCode: reason } });

const s1 = await sell(`P2-${run}-1`, disc.id, 3);
const s1Moves = s1.body?.orderId ? await sold(s1.body.orderId) : [];
check('a counter sale takes the pieces off the shelf and records the movement', s1.status === 201 && (await shelf()) === '7/7' && s1Moves.length === 1 && Number(s1Moves[0].qtyMoved) === 3 && s1Moves[0].movementType === 'SHIP' && !s1.body.stockNote, `${s1.status} ${await shelf()} ${JSON.stringify(s1.body).slice(0, 140)}`);
check('the sale belongs to the selling branch', (await prisma.order.findUnique({ where: { id: s1.body.orderId } }))?.locationId === csrHome);
const s1Again = await sell(`P2-${run}-1`, disc.id, 3);
check('sending the same sale again takes nothing more', s1Again.status === 200 && s1Again.body.duplicate === true && (await shelf()) === '7/7', `${s1Again.status} ${await shelf()}`);
const ordersBefore = await prisma.order.count();
const tooMany = await sell(`P2-${run}-2`, disc.id, 8);
check('selling more than is on the shelf is refused, with no sale and no stock change', tooMany.status === 409 && (await shelf()) === '7/7' && (await prisma.order.count()) === ordersBefore, `${tooMany.status} ${await shelf()}`);
const three = await Promise.all([3, 4, 5].map((n) => sell(`P2-${run}-${n}`, disc.id, 3)));
check('three sales of three at once from a shelf of seven: two succeed, one is refused, one piece is left', three.filter((r) => r.status === 201).length === 2 && three.filter((r) => r.status === 409).length === 1 && (await shelf()) === '1/1', `${three.map((r) => r.status)} ${await shelf()}`);
const twin = await Promise.all([1, 2, 3].map(() => sell(`P2-${run}-TWIN`, disc.id, 1)));
check('one sale sent three times at once for the last piece is one sale, and every copy is answered as that sale', twin.every((r) => [200, 201].includes(r.status)) && new Set(twin.map((r) => r.body.orderNumber)).size === 1 && (await prisma.order.count({ where: { poReference: `QS:P2-${run}-TWIN` } })) === 1 && (await shelf()) === '0/0', `${twin.map((r) => r.status)} ${await shelf()}`);
check('an empty shelf marks the stock item as gone', (await prisma.coil.findUnique({ where: { id: shelfCoil.id } })).status === 'SHIPPED');
const v1 = await A.post(`/api/pos/quick-sale/P2-${run}-1/void`, { reason: 'QA void' }, 'admin');
check('voiding a sale puts its pieces back on the shelf and records it', v1.status === 200 && (await shelf()) === '3/3' && (await sold(s1.body.orderId, 'COUNTER_VOID')).length === 1 && (await prisma.coil.findUnique({ where: { id: shelfCoil.id } })).status === 'AVAILABLE', `${v1.status} ${await shelf()}`);
const v1Again = await Promise.all([1, 2].map(() => A.post(`/api/pos/quick-sale/P2-${run}-1/void`, { reason: 'QA void again' }, 'admin')));
check('voiding it again puts nothing more back', v1Again.every((r) => r.status === 409) && (await shelf()) === '3/3', `${v1Again.map((r) => r.status)} ${await shelf()}`);
const twin2 = await Promise.all([1, 2, 3].map(() => sell(`P2-${run}-TWIN2`, disc.id, 1)));
check('one sale sent three times at once with stock to spare is still one sale and takes one piece', twin2.every((r) => [200, 201].includes(r.status)) && (await prisma.order.count({ where: { poReference: `QS:P2-${run}-TWIN2` } })) === 1 && (await shelf()) === '2/2', `${twin2.map((r) => r.status)} ${await shelf()}`);
const csrVoid = await A.post(`/api/pos/quick-sale/P2-${run}-TWIN2/void`, { reason: 'QA' }, 'csr');
check('a sales login cannot void a counter sale', csrVoid.status === 403 && (await shelf()) === '2/2', `${csrVoid.status}`);
await prisma.inventory.updateMany({ where: { locationId: csrHome, unit: 'EA', coil: { productId: gloves.id } }, data: { unit: 'EA-OLD' } });
const loose = await sell(`P2-${run}-G`, gloves.id, 1);
check('a product with no shelf stock on file still sells, and the answer says no stock was reduced', loose.status === 201 && /no stock was reduced/.test(loose.body.stockNote || ''), `${loose.status} ${JSON.stringify(loose.body).slice(0, 200)}`);
const facts = await prisma.$queryRaw`SELECT count(*)::int AS n FROM "Inventory" WHERE abs("qtyOnHand" - ("qtyAvailable" + "qtyAllocated" + "qtyOnHold")) > 0.0001 OR "qtyOnHand" < 0`;
check('stock still adds up everywhere', facts[0].n === 0, `${facts[0].n}`);

// ── Work order: completed and cancelled at the same moment ──
let woBroken = 0;
for (let i = 0; i < 4; i++) {
  const src = await prisma.coil.findFirst({ where: { location: { code: { startsWith: 'QA-L' } }, status: 'AVAILABLE', qcStatus: 'PASSED', inventory: { is: { unit: 'LB', qtyAvailable: { gt: 100 } } } }, skip: i });
  const wo = await A.post('/api/work-orders', { woType: 'SLIT', sourceCoilId: src.id, priority: 3, notes: `QA phase 2 ${run}` });
  await A.put(`/api/work-orders/${wo.body.id}/release`, {}); await A.put(`/api/work-orders/${wo.body.id}/start`, {});
  const [done, stop] = await Promise.all([A.put(`/api/work-orders/${wo.body.id}/complete`, { outputWeightLb: 10, scrapWeightLb: 0 }), A.put(`/api/work-orders/${wo.body.id}/cancel`, { reason: 'QA' })]);
  const row = await prisma.workOrder.findUnique({ where: { id: wo.body.id } });
  const hist = await prisma.auditLog.count({ where: { resourceType: 'WorkOrder', resourceId: wo.body.id, eventType: 'WORK_ORDER_STATUS_CHANGED', details: { path: ['to'], string_contains: 'C' } } });
  const wins = [done, stop].filter((r) => r.status === 200).length;
  if (wins !== 1 || ![done, stop].every((r) => [200, 409].includes(r.status)) || row.status !== (done.status === 200 ? 'COMPLETE' : 'CANCELLED') || hist !== 1) woBroken++;
}
check('a work order completed and cancelled at the same moment: exactly one wins and the record matches the answer (4 rounds)', woBroken === 0, `${woBroken} rounds`);

// ── Two transfers of the same stock item at once ──
const mover = await prisma.coil.findFirst({ where: { location: { code: { startsWith: 'QA-L' } }, status: 'AVAILABLE', inventory: { is: { unit: 'LB', qtyAllocated: 0, qtyOnHold: 0, qtyOnHand: { gt: 0 } } }, workOrderInputs: { none: {} } } });
const [toA, toB] = [L1, loc['QA-L02'], L4].filter((b) => b !== mover.locationId);
const twoMoves = await Promise.all([A.post('/api/inventory/transfer', { coilId: mover.id, toLocationId: toA }), A.post('/api/inventory/transfer', { coilId: mover.id, toLocationId: toB })]);
const trail = await prisma.materialMovement.findMany({ where: { coilId: mover.id, movementType: 'TRANSFER', createdAt: { gte: testStart } }, orderBy: { createdAt: 'asc' } });
const moverNow = await prisma.coil.findUnique({ where: { id: mover.id }, include: { inventory: true } });
check('two transfers of one stock item at once: each accepted transfer is recorded, in order, and the item is where the last one put it',
  twoMoves.every((r) => [200, 201, 409].includes(r.status)) && trail.length === twoMoves.filter((r) => r.status < 300).length && trail.length >= 1
  && trail.every((m, k) => m.fromLocationId === (k === 0 ? mover.locationId : trail[k - 1].toLocationId)) && moverNow.locationId === trail[trail.length - 1].toLocationId && moverNow.inventory.locationId === moverNow.locationId,
  `${twoMoves.map((r) => r.status)} ${trail.length} movements`);

// ── Two holds on the same stock item at once ──
const held = await prisma.coil.findFirst({ where: { location: { code: { startsWith: 'QA-L' } }, status: 'AVAILABLE', id: { not: mover.id }, inventory: { is: { unit: 'LB', qtyAllocated: 0, qtyOnHold: 0, qtyOnHand: { gt: 0 } } } }, include: { inventory: true } });
const holds = await Promise.all([1, 2, 3].map((n) => A.post(`/api/coils/${held.id}/hold`, { holdType: 'OTHER', holdReason: `QA phase 2 hold ${n}` })));
const heldNow = await prisma.inventory.findUnique({ where: { coilId: held.id } });
check('three holds on one stock item at once: the quantity is held once and the balance adds up',
  holds.filter((r) => r.status < 300).length >= 1 && Number(heldNow.qtyOnHold) === Number(held.inventory.qtyOnHand) && Number(heldNow.qtyAvailable) === 0 && Number(heldNow.qtyOnHand) === Number(held.inventory.qtyOnHand),
  `${holds.map((r) => r.status)} hold ${heldNow.qtyOnHold} of ${heldNow.qtyOnHand}`);
await A.post(`/api/coils/${held.id}/release`, { releaseNote: 'QA' });

// ── Steps sent out of order ──
const early = await A.post('/api/jobs', { workCenterId: wc.id, instructions: `QA phase 2 order ${run}`, status: 'SCHEDULED' });
const skipDone = await A.post(`/api/jobs/${early.body.id}/status`, { status: 'COMPLETED' });
check('a job that has not started cannot be marked completed', skipDone.status === 409 && (await jobOf(early.body.id)).status === 'SCHEDULED', `${skipDone.status}`);
const pendingShipment = await prisma.shipment.findFirst({ where: { status: 'PENDING' } });
if (pendingShipment) {
  const earlyDeliver = await A.put(`/api/shipments/${pendingShipment.id}/deliver`, { receivedBy: 'QA' });
  check('a shipment that has not left cannot be marked delivered', earlyDeliver.status === 409 && (await prisma.shipment.findUnique({ where: { id: pendingShipment.id } })).status === 'PENDING', `${earlyDeliver.status}`);
}
const openInvoice = await prisma.invoice.findFirst({ where: { kind: 'INVOICE', status: 'PAID' } });
if (openInvoice) {
  const overpay = await A.post(`/api/invoices/${openInvoice.id}/payments`, { amount: 1, paymentMethod: 'CHECK', referenceNumber: 'QA' });
  check('a payment sent after the invoice is paid in full is refused', overpay.status >= 400 && overpay.status < 500 && Number((await prisma.invoice.findUnique({ where: { id: openInvoice.id } })).paidAmount) === Number(openInvoice.paidAmount), `${overpay.status}`);
}

// ── Equipment and maintenance field lists (B-007) ──
if (!(await prisma.asset.count())) await A.post('/api/assets/seed-from-work-centers', {});
const asset = await prisma.asset.findFirst();
if (asset) {
  const forged = await A.patch(`/api/assets/${asset.id}`, { id: '22222222-2222-2222-2222-222222222222', assetNumber: 'FORGED', createdAt: '2000-01-01T00:00:00Z' });
  const assetSame = await prisma.asset.findUnique({ where: { id: asset.id } });
  check('equipment: changing only fields the browser may not set is refused and nothing changes', forged.status === 400 && assetSame && assetSame.assetNumber === asset.assetNumber && assetSame.createdAt.getTime() === asset.createdAt.getTime(), `${forged.status}`);
  const named = await A.patch(`/api/assets/${asset.id}`, { manufacturer: 'QA Phase 2', assetNumber: 'FORGED' });
  const assetNow = await prisma.asset.findUnique({ where: { id: asset.id } });
  check('equipment: a listed field is saved and an unlisted one sent with it is ignored', named.status === 200 && assetNow.manufacturer === 'QA Phase 2' && assetNow.assetNumber === asset.assetNumber, `${named.status}`);
  const mo = await A.post('/api/maintenance-orders', { assetId: asset.id, type: 'CORRECTIVE', priority: 'NORMAL', title: `QA phase 2 ${run}` });
  check('a maintenance order can be raised', mo.status === 201, `${mo.status} ${JSON.stringify(mo.body).slice(0, 160)}`);
  if (mo.status === 201) {
    const moId = mo.body.id || mo.body.data?.id;
    const before2 = await prisma.maintenanceOrder.findUnique({ where: { id: moId } });
    const moForged = await A.patch(`/api/maintenance-orders/${moId}`, { woNumber: 'FORGED', orderNumber: 'FORGED', createdAt: '2000-01-01T00:00:00Z', assetId: '22222222-2222-2222-2222-222222222222' });
    const after2 = await prisma.maintenanceOrder.findUnique({ where: { id: moId } });
    check('maintenance order: changing only fields the browser may not set is refused and nothing changes', moForged.status === 400 && JSON.stringify(after2) === JSON.stringify(before2), `${moForged.status}`);
    const moEdit = await A.patch(`/api/maintenance-orders/${moId}`, { title: 'QA phase 2 changed', assetId: '22222222-2222-2222-2222-222222222222' });
    const after3 = await prisma.maintenanceOrder.findUnique({ where: { id: moId } });
    check('maintenance order: a listed field is saved and the equipment it belongs to cannot be swapped', moEdit.status === 200 && after3.title === 'QA phase 2 changed' && after3.assetId === asset.id, `${moEdit.status}`);
    const opDelete = await A.call('DELETE', `/api/maintenance-orders/${moId}`, undefined, 'operator');
    check('an operator cannot delete a maintenance order', opDelete.status === 403 && (await prisma.maintenanceOrder.count({ where: { id: moId } })) === 1, `${opDelete.status}`);
  }
}

// ── Department rules through the API (B-004) ──
const wcAny = await prisma.workCenter.findFirst({ where: { locationId: L1 } });
const denied = [
  ['operator', 'PATCH', `/api/work-centers/${wcAny.id}`, { name: 'changed by an operator' }, 'an operator cannot change a work center'],
  ['operator', 'PATCH', `/api/v1/work-centers/${wcAny.id}`, { name: 'changed by an operator' }, 'nor at its second address'],
  ['operator', 'POST', '/api/staff/operators', { firstName: 'QA', lastName: 'Forged' }, 'an operator cannot add an operator record'],
  ['operator', 'DELETE', `/api/v1/dispatch/work-center-types/${TYPE}`, undefined, 'an operator cannot delete a work center type'],
  ['operator', 'POST', '/api/v1/contacts', { name: 'QA forged contact' }, 'an operator cannot add an order hub contact'],
  ['csr', 'POST', '/api/v1/inventory/adjust', { itemId: 'x', quantity: 1 }, 'a sales login cannot adjust the second stock list'],
  ['csr', 'POST', `/api/v1/operations/${j1.ops[0].id}/start`, { operatorId: operators[0].id }, 'a sales login cannot start a shop-floor operation'],
  ['csr', 'POST', '/api/processing-recipes', { name: 'QA forged recipe' }, 'a sales login cannot add a processing recipe'],
  ['csr', 'DELETE', '/api/documents/00000000-0000-0000-0000-000000000000', undefined, 'a sales login cannot delete a document'],
];
for (const [who, method, url, body, name] of denied) {
  const r = await A.call(method, url, body, who);
  check(name, r.status === 403, `${r.status}`);
}
check('and the work center and its type are unchanged', (await prisma.workCenter.findUnique({ where: { id: wcAny.id } })).name === wcAny.name && (await prisma.workCenterType.count({ where: { id: TYPE } })) === 1 && (await prisma.operator.count({ where: { lastName: 'Forged' } })) === 0);
const stop = await A.post('/api/safety/stop-work', {}, 'operator');
check('an operator is not refused for their role when raising a stop-work', stop.status !== 403, `${stop.status}`);

fs.writeFileSync(OUT, JSON.stringify({ at: new Date().toISOString(), base: BASE, checks, problems: findings }, null, 2));
console.log(`${findings.length ? '✗' : '✓'} Phase 2 integrity: ${checks} checks, ${findings.length} problems`);
for (const f of findings) console.log(`  ✗ ${f}`);
await prisma.$disconnect();
process.exit(findings.length ? 1 : 0);
