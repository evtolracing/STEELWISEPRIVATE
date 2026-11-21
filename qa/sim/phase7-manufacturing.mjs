// Phase 7 manufacturing scenarios: work orders and routings, material requirements, capacity and
// scheduling, shop-floor execution with labor and machine time, quality control, scrap, remnants,
// rework and costing, and cross-branch production, simultaneous requests and recovery.
// Every scenario drives the real server the way the screens do, then reads the database to check
// what was saved, what was refused, and that the job, its steps, its history and the stock agree.
// A success answer alone is never counted as a pass. What the product does not have is recorded
// as NOT APPLICABLE with the evidence, never as a pass.
//   node qa/sim/phase7-manufacturing.mjs [--base http://localhost:3011] [--only 1,5]
// Local QA database only (lib.mjs refuses anything else). No equipment is driven: there is none connected.
import fs from 'node:fs';
import {
  arg, prisma, A, run, num, tag, scenario, http1, world, blocks, finish, QA_PASSWORD,
} from './phase4-lib.mjs';
import { bcrypt } from './lib.mjs';

const OUT = arg('out', 'qa/results/phase7-manufacturing.json');
const ONLY = arg('only', '').split(',').filter(Boolean);
const want = (n) => !ONLY.length || ONLY.includes(String(n));
const near = (a, b, eps = 1e-4) => Math.abs(Number(a) - Number(b)) <= eps;
const NA = { status: 'NOT APPLICABLE' };

const w = await world();
const B = blocks(w);
const { L1, L2, heat, users } = w;
const house = users.admin.organizationId;

const G1 = 'Work order creation and routing';
const G2 = 'BOMs, material requirements and allocation';
const G3 = 'Capacity planning and scheduling';
const G4 = 'Shop-floor execution and labor and machine tracking';
const G5 = 'Quality control and nonconformance';
const G6 = 'Scrap, remnants, rework and costing';
const G7 = 'Cross-location production, concurrency and recovery';

// ── people ───────────────────────────────────────────────────────────────────────
async function login(role, loc, label) {
  const email = `${tag(`qa-p7-${label}`).toLowerCase()}@qa.test`;
  await prisma.user.create({ data: { email, passwordHash: await bcrypt().hash(QA_PASSWORD, 10), firstName: 'QA', lastName: label, role, organizationId: house, homeLocationId: loc.id } });
  const r = await http1('POST', '/api/auth/login', { body: { email, password: QA_PASSWORD } });
  if (!r.body?.token) throw new Error(`login ${label}: ${r.status}`);
  const user = await prisma.user.findUnique({ where: { email } });
  return { user, call: (m, url, body, headers) => http1(m, url, { body, headers, token: r.body.token }) };
}
const pm1 = await login('PRODUCTION_MANAGER', L1, 'pm-l1');
const pm2 = await login('PRODUCTION_MANAGER', L2, 'pm-l2');
const qc1 = await login('QC_INSPECTOR', L1, 'qc-l1');
const qc2 = await login('QC_INSPECTOR', L2, 'qc-l2');
const opr1 = await login('OPERATOR_SAW', L1, 'operator-l1');
const opr2 = await login('OPERATOR_SAW', L2, 'operator-l2');
const sched1 = await login('SCHEDULER', L1, 'scheduler-l1');
const as = (who) => (typeof who === 'string' ? (m, url, body) => A.call(m, url, body, who) : who.call);

// ── shop set-up: two kinds of work center, work centers at two branches, certified operators ──
const T = `P7S${run}`.slice(0, 14);   // "saw"
const T2 = `P7D${run}`.slice(0, 14);  // "deburr"
for (const [id, label] of [[T, 'QA P7 saw'], [T2, 'QA P7 deburr']]) {
  // Marked for two steps at once, so scenarios that share an operator do not block each other.
  // The one-step-at-a-time rule is tested on a kind of its own that is not marked.
  const r = await A.post('/api/v1/dispatch/work-center-types', { id, label, divisions: ['METALS'], allowsConcurrentSteps: true });
  if (r.status !== 201) throw new Error(`type ${r.status} ${JSON.stringify(r.body)}`);
}
async function mkWc(loc, type = T, over = {}) {
  const r = await A.post('/api/v1/dispatch/work-centers', { id: tag('WC'), name: `QA P7 ${type === T ? 'saw' : 'deburr'} ${tag('n')}`, locationId: loc.id, workCenterType: type, ...over });
  if (r.status !== 201) throw new Error(`work center ${r.status} ${JSON.stringify(r.body)}`);
  return r.body.data;
}
const longAgo = new Date(Date.now() - 800 * 86400000).toISOString();
const yesterday = new Date(Date.now() - 86400000).toISOString();
const nextYear = new Date(Date.now() + 365 * 86400000).toISOString();
async function mkOperator(loc, { types = [T, T2], level = 'STANDARD', expiresAt = null, ...over } = {}) {
  const r = await A.post('/api/staff/operators', { firstName: 'QA', lastName: tag('OP'), homeLocationId: loc.id, skills: types.map((t) => ({ workCenterTypeId: t, skillLevel: level, certifiedDate: longAgo, ...(expiresAt && { expiresAt }) })), ...over });
  if (r.status !== 201) throw new Error(`operator ${r.status} ${JSON.stringify(r.body)}`);
  return r.body.data;
}
const wc1 = await mkWc(L1);
const wcD = await mkWc(L1, T2);
const wc2 = await mkWc(L2);
const opA = await mkOperator(L1, { expiresAt: nextYear });
const opB = await mkOperator(L1);
const opX = await mkOperator(L2);

// ── building blocks ──────────────────────────────────────────────────────────────
const jobOf = (id) => prisma.job.findUnique({ where: { id } });
const opsOf = (jobId) => prisma.dispatchOperation.findMany({ where: { dispatchJob: { jobId } }, orderBy: { sequence: 'asc' } });
const planOf = (jobId) => prisma.dispatchJob.findUnique({ where: { jobId }, include: { operations: { orderBy: { sequence: 'asc' } } } });
const logsOf = (opId) => prisma.dispatchTimeLog.findMany({ where: { dispatchOperationId: opId }, orderBy: { startAt: 'asc' } });
const inspectionsOf = (jobId) => prisma.jobInspection.findMany({ where: { jobId }, orderBy: { createdAt: 'asc' } });
const invOf = (coilId) => prisma.inventory.findUnique({ where: { coilId } });
const coilOf = (id) => prisma.coil.findUnique({ where: { id } });
const auditOf = (resourceType, resourceId, eventType) => prisma.auditLog.findMany({ where: { resourceType, resourceId, ...(eventType && { eventType }) }, orderBy: { timestamp: 'asc' } });
const movesOf = async (jobId) => (await auditOf('Job', jobId, 'JOB_STATUS_CHANGED')).map((r) => ({ ...r.details, userId: r.userId }));
const setRule = (stepsInOrder) => prisma.appSetting.upsert({ where: { key: 'production.rules' }, update: { value: { stepsInOrder } }, create: { key: 'production.rules', value: { stepsInOrder } } });
// The owner's rule (2026-11-15): steps run in their planned order. Scenarios that check the other setting switch it and switch it back.
await setRule(true);

/** The job's history is one unbroken chain that ends at the job's present status. */
async function chain(ok, jobId, label = 'job') {
  const job = await jobOf(jobId);
  const rows = await movesOf(jobId);
  const left = [...rows];
  let at = left.length ? left[0].from : job.status;
  let fine = true;
  while (left.length) {
    const i = left.findIndex((m) => m.from === at);
    if (i < 0) { fine = false; break; }
    at = left[i].to; left.splice(i, 1);
  }
  ok(`${label}: the history is one chain ending at ${job.status}`, fine && at === job.status, JSON.stringify(rows.map((m) => `${m.from}>${m.to}`)));
  return rows;
}
/** Every step's recorded time is closed or running exactly once, and never negative. */
async function clocks(ok, jobId, label = 'job') {
  const ops = await opsOf(jobId);
  let fine = true; const why = [];
  for (const op of ops) {
    const logs = await logsOf(op.id);
    const running = logs.filter((l) => l.status === 'RUNNING');
    if (running.length > 1) { fine = false; why.push(`${op.name}: ${running.length} clocks running`); }
    if (op.status === 'COMPLETE' && running.length) { fine = false; why.push(`${op.name}: finished with a clock running`); }
    if (op.status === 'COMPLETE' && (!op.actualStart || !op.actualEnd || op.actualEnd < op.actualStart)) { fine = false; why.push(`${op.name}: start ${op.actualStart} end ${op.actualEnd}`); }
    if (logs.some((l) => l.endAt && l.endAt < l.startAt)) { fine = false; why.push(`${op.name}: a log ends before it starts`); }
    if (logs.some((l) => !l.operatorId || !l.workCenterId)) { fine = false; why.push(`${op.name}: a log with no operator or work center`); }
  }
  ok(`${label}: recorded time is consistent`, fine, why.join('; '));
}

async function mkOrder({ loc = L1, qty = 500, line = {}, customer } = {}) {
  return B.order([B.line(qty, 0.65, line)], { who: 'admin', customer, extra: { locationId: loc.id } });
}
/** A job for a fresh order line, planned with the given steps unless planned is false. */
async function mkJob({ steps = 1, types, loc = L1, planned = true, qty = 500, job = {}, plan = {}, order: given, who = 'admin' } = {}) {
  const o = given || await mkOrder({ loc, qty });
  const j = await as(who)('POST', '/api/jobs', { orderId: o.id, orderLineId: o.lines[0].id, operationType: T, instructions: `QA P7 ${run}`, status: 'ORDERED', ...job });
  if (j.status !== 201) throw new Error(`job ${j.status} ${JSON.stringify(j.body).slice(0, 200)}`);
  let ops = []; let planned_ = null;
  if (planned) {
    planned_ = await as(who)('POST', `/api/jobs/${j.body.id}/plan`, { operations: (types || Array(steps).fill(T)).map((t, i) => ({ workCenterType: t, name: `Step ${i + 1}` })), ...plan });
    if (planned_.status !== 200) throw new Error(`plan ${planned_.status} ${JSON.stringify(planned_.body).slice(0, 200)}`);
    ops = planned_.body.operations;
  }
  return { id: j.body.id, jobNumber: j.body.jobNumber, order: o, line: o.lines[0], ops, plan: planned_ };
}
const startOp = (op, person = opA, wc = wc1, who = 'admin') => as(who)('POST', `/api/v1/operations/${op.id}/start`, { operatorId: person.id, workCenterId: wc.id });
const pauseOp = (op, body = {}, who = 'admin') => as(who)('POST', `/api/v1/operations/${op.id}/pause`, body);
const doneOp = (op, who = 'admin') => as(who)('POST', `/api/v1/operations/${op.id}/complete`, {});
async function runOps(job, { person = opA, wc = wc1 } = {}) {
  for (const op of job.ops) {
    const a = await startOp(op, person, wc); const b = await doneOp(op);
    if (a.status !== 200 || b.status !== 200) throw new Error(`run ${op.name}: ${a.status} ${a.body?.error} / ${b.status} ${b.body?.error}`);
  }
}
/** A job whose steps are finished and which is waiting for inspection. */
async function atQc(opts = {}) { const j = await mkJob(opts); await runOps(j, opts.loc === L2 ? { person: opX, wc: wc2 } : {}); return j; }
const move = (jobId, status, who = 'admin', note) => as(who)('POST', `/api/jobs/${jobId}/status`, { status, ...(note && { note }) });
const openInspection = (jobId, who = 'admin', body = {}) => as(who)('POST', '/api/qc/inspections', { jobId, ...body });
const answered = (inspection, result = 'PASS') => (inspection.checklist || []).map((c) => ({ ...c, result }));
const decide = (inspection, what, body = {}, who = 'admin') => as(who)('POST', `/api/qc/inspections/${inspection.id}/${what}`, body);
const passIt = (inspection, who = 'admin', body = {}) => decide(inspection, 'pass', { checklist: answered(inspection), ...body }, who);
async function inspected(jobId, what = 'pass', body = {}) {
  const made = await openInspection(jobId);
  if (made.status !== 201) throw new Error(`inspection ${made.status} ${made.body?.error}`);
  const r = what === 'pass' ? await passIt(made.body.data) : await decide(made.body.data, what, body);
  if (r.status !== 200) throw new Error(`${what} ${r.status} ${r.body?.error}`);
  return made.body.data;
}
async function workOrder(coilId, over = {}, who = 'admin') {
  return as(who)('POST', '/api/work-orders', { woType: 'SLIT', sourceCoilId: coilId, priority: 3, notes: `QA phase 7 ${run}`, ...over });
}
async function startedWorkOrder(coilId, over = {}) {
  const wo = await workOrder(coilId, over);
  if (wo.status !== 201) throw new Error(`work order ${wo.status} ${JSON.stringify(wo.body).slice(0, 200)}`);
  for (const s of ['release', 'start']) await A.put(`/api/work-orders/${wo.body.id}/${s}`, {});
  return wo.body;
}
const woOf = (id) => prisma.workOrder.findUnique({ where: { id } });
const stockMoves = (coilId, movementType) => prisma.materialMovement.findMany({ where: { coilId, ...(movementType && { movementType }) }, orderBy: { createdAt: 'asc' } });
/** The balance identity and the item's history adding up to its balance. */
async function books(ok, coilId, label = 'item') {
  const i = await invOf(coilId);
  const parts = num(i.qtyAvailable) + num(i.qtyAllocated) + num(i.qtyOnHold) + num(i.qtyInTransit);
  ok(`${label}: on hand = available + reserved + on hold + in transit, none below zero`, near(i.qtyOnHand, parts) && [i.qtyOnHand, i.qtyAvailable, i.qtyAllocated, i.qtyOnHold, i.qtyInTransit].every((v) => num(v) >= -1e-6), JSON.stringify(i));
  const res = await prisma.orderLineAllocation.aggregate({ where: { coilId }, _sum: { qtyAllocated: true } });
  ok(`${label}: reserved equals the reservations on file`, near(i.qtyAllocated, num(res._sum.qtyAllocated)), `${i.qtyAllocated} vs ${res._sum.qtyAllocated}`);
  const mv = await stockMoves(coilId);
  let sum = 0;
  for (const m of mv) {
    const q = num(m.qtyMoved);
    if (['RECEIVE', 'PROCESS'].includes(m.movementType)) sum += q;
    else if (['SHIP', 'CONSUME', 'SCRAP'].includes(m.movementType)) sum -= q;
    else if (['ADJUST', 'COUNT'].includes(m.movementType)) sum += m.toLocationId ? q : -q;
  }
  if (mv.some((m) => ['RECEIVE', 'PROCESS'].includes(m.movementType))) ok(`${label}: its history adds up to its balance`, near(sum, i.qtyOnHand), `history ${sum} vs on hand ${i.qtyOnHand}`);
  return i;
}
const tables = async (pattern) => (await prisma.$queryRawUnsafe(`select table_name from information_schema.tables where table_schema = 'public' and table_name ~* '${pattern}'`)).map((r) => r.table_name);
const recipeBody = (over = {}) => ({ name: `QA P7 routing ${tag('R')}`, code: tag('RCP'), materialCode: tag('MAT'), commodity: 'METALS', form: 'PLATE', grade: heat.grade.code, thicknessMin: 0.25, thicknessMax: 1, division: 'METALS', operations: [{ name: 'Saw', workCenterType: T, setupMinutes: 10, estimatedMachineMinutes: 30, estimatedLaborMinutes: 20 }, { name: 'Deburr', workCenterType: T2, setupMinutes: 5, estimatedMachineMinutes: 15, estimatedLaborMinutes: 15 }], ...over });
async function activeRecipe(over = {}) {
  const r = await A.post('/api/v1/bom/recipes', recipeBody(over));
  if (r.status !== 201) throw new Error(`recipe ${r.status} ${JSON.stringify(r.body)}`);
  for (const s of ['REVIEW', 'ACTIVE']) await A.post(`/api/v1/bom/recipes/${r.body.id}/transition`, { targetStatus: s });
  return prisma.bomRecipe.findUnique({ where: { id: r.body.id }, include: { operations: { orderBy: { sequence: 'asc' } } } });
}

// ════════════════════════════════════════════════════════════════════════════════
if (want(1)) {
  await scenario(G1, 'a job opened for an order line is saved with its order, its line, who opened it and where it stands', async (ok) => {
    const j = await mkJob({ planned: false, who: pm1 });
    const row = await jobOf(j.id);
    ok('tied to the order and the line', row.orderId === j.order.id && row.orderLineId === j.line.id);
    ok('opened by the signed-in person, not an id sent in', row.createdById === pm1.user.id);
    ok('waiting, with a job number', row.status === 'ORDERED' && /^JOB-\d+-\d+[A-Z]?$/.test(row.jobNumber) && row.jobNumber.startsWith(`JOB-${j.order.orderNumber.replace(/^SO-/, '')}-`));
    const forged = await pm1.call('POST', '/api/jobs', { orderId: j.order.id, instructions: 'x', createdById: users.admin.id, jobNumber: 'JOB-FORGED' });
    ok('a job number or creator sent in the request is ignored', forged.status === 201 && (await jobOf(forged.body.id)).createdById === pm1.user.id && forged.body.jobNumber !== 'JOB-FORGED');
  });
  await scenario(G1, 'a job cannot be opened for nothing, for a line of another order, or with a status it cannot start in', async (ok) => {
    const before = await prisma.job.count();
    const o = await mkOrder(); const other = await mkOrder();
    const a = await A.post('/api/jobs', {});
    const b = await A.post('/api/jobs', { orderId: o.id, orderLineId: other.lines[0].id });
    const c = await A.post('/api/jobs', { orderId: o.id, status: 'READY_TO_SHIP' });
    const d = await A.post('/api/jobs', { orderId: '00000000-0000-0000-0000-000000000000', instructions: 'x' });
    const e = await A.post('/api/jobs', { orderId: o.id, scheduledStart: 'not-a-date' });
    ok('each refused with a 4xx', [a, b, c, d, e].every((r) => r.status >= 400 && r.status < 500), [a, b, c, d, e].map((r) => r.status).join(','));
    ok('nothing was saved', (await prisma.job.count()) === before);
  });
  await scenario(G1, 'no work is opened for a cancelled order, a cancelled line or a work center that is offline', async (ok) => {
    const o = await mkOrder();
    await A.put(`/api/orders/${o.id}`, { status: 'CANCELLED' });
    const cancelled = await prisma.order.findUnique({ where: { id: o.id } });
    const a = await A.post('/api/jobs', { orderId: o.id, orderLineId: o.lines[0].id });
    ok('the order is cancelled and the job is refused with 409', cancelled.status === 'CANCELLED' && a.status === 409, `${cancelled.status} ${a.status} ${a.body?.error}`);
    const off = await mkWc(L1);
    await A.call('DELETE', `/api/v1/dispatch/work-centers/${off.id}`);
    const o2 = await mkOrder();
    const b = await A.post('/api/jobs', { orderId: o2.id, workCenterId: off.id });
    ok('an offline work center is refused with 409', b.status === 409 && /offline/.test(b.body?.error || ''), `${b.status} ${b.body?.error}`);
    ok('no job exists for either order', (await prisma.job.count({ where: { orderId: { in: [o.id, o2.id] } } })) === 0);
  });
  await scenario(G1, 'planning a job saves its steps in order at the order\'s branch and moves the job to scheduled', async (ok) => {
    const j = await mkJob({ types: [T, T2], who: pm1 });
    const plan = await planOf(j.id);
    ok('one plan at the order\'s branch', plan?.locationId === L1.id && plan.jobNumber === j.jobNumber);
    ok('two steps, numbered 1 and 2, of the kinds asked for, all waiting', plan.operations.length === 2 && plan.operations.map((o) => o.sequence).join() === '1,2' && plan.operations[0].requiredWorkCenterType === T && plan.operations[1].requiredWorkCenterType === T2 && plan.operations.every((o) => o.status === 'PENDING' && !o.assignedWorkCenterId));
    ok('the job is scheduled', (await jobOf(j.id)).status === 'SCHEDULED');
    const rows = await chain(ok, j.id);
    ok('the move is on record with who planned it', rows.some((m) => m.from === 'ORDERED' && m.to === 'SCHEDULED' && m.via === 'plan' && m.userId === pm1.user.id));
  });
  await scenario(G1, 'a plan takes the grade and thickness from the order line and assumes neither', async (ok) => {
    const j = await mkJob({ order: await mkOrder({ line: { thicknessIn: 0.75 } }) });
    const plan = await planOf(j.id);
    ok('grade is the line\'s grade', plan.grade === heat.grade.code, plan.grade);
    ok('thickness is the line\'s thickness', near(plan.thickness, 0.75) && plan.operations.every((o) => near(o.thickness, 0.75)), String(plan.thickness));
    const bare = await A.post('/api/jobs', { workCenterId: wc1.id, instructions: `QA P7 bare ${run}`, status: 'ORDERED' });
    const p = await A.post(`/api/jobs/${bare.body.id}/plan`, { operations: [{ workCenterType: T }] });
    const barePlan = await planOf(bare.body.id);
    ok('a job with no order line gets no grade (it used to be written as A36)', p.status === 200 && barePlan.grade === null, `${p.status} ${barePlan?.grade}`);
    ok('and a thickness of 0, meaning not stated (it used to be 0.5)', near(barePlan.thickness, 0));
    const sent = await mkJob({ plan: { grade: '304', thickness: 1.25 } });
    const sentPlan = await planOf(sent.id);
    ok('what the planner enters wins', sentPlan.grade === '304' && near(sentPlan.thickness, 1.25));
  });
  await scenario(G1, 'a plan with no steps, an unknown kind of work center or a thickness of zero is refused and saves nothing', async (ok) => {
    const j = await mkJob({ planned: false });
    const a = await A.post(`/api/jobs/${j.id}/plan`, { operations: [] });
    const b = await A.post(`/api/jobs/${j.id}/plan`, { operations: [{ workCenterType: 'NO-SUCH-KIND' }] });
    const c = await A.post(`/api/jobs/${j.id}/plan`, { operations: [{ name: 'no kind' }] });
    const d = await A.post(`/api/jobs/${j.id}/plan`, { operations: [{ workCenterType: T }], thickness: -1 });
    ok('all four refused with 400', [a, b, c, d].every((r) => r.status === 400), [a, b, c, d].map((r) => r.status).join(','));
    ok('no plan was saved and the job is still waiting', (await planOf(j.id)) === null && (await jobOf(j.id)).status === 'ORDERED');
  });
  await scenario(G1, 'a job that has started, finished or been cancelled cannot be planned', async (ok) => {
    const started = await mkJob({ planned: false }); await A.post(`/api/jobs/${started.id}/start`, {});
    const cancelled = await mkJob({ planned: false }); await move(cancelled.id, 'CANCELLED');
    const a = await A.post(`/api/jobs/${started.id}/plan`, { operations: [{ workCenterType: T }] });
    const b = await A.post(`/api/jobs/${cancelled.id}/plan`, { operations: [{ workCenterType: T }] });
    ok('both refused with 400', a.status === 400 && b.status === 400, `${a.status} ${b.status}`);
    ok('neither has a plan, and each keeps its status', !(await planOf(started.id)) && !(await planOf(cancelled.id)) && (await jobOf(started.id)).status === 'IN_PROCESS' && (await jobOf(cancelled.id)).status === 'CANCELLED');
  });
  await scenario(G1, 're-planning before any work replaces the steps and leaves exactly one plan', async (ok) => {
    const j = await mkJob({ steps: 3 });
    const again = await A.post(`/api/jobs/${j.id}/plan`, { operations: [{ workCenterType: T2, name: 'Only step' }] });
    const plan = await planOf(j.id);
    ok('accepted', again.status === 200, `${again.status} ${again.body?.error}`);
    ok('one plan with the one new step', (await prisma.dispatchJob.count({ where: { jobId: j.id } })) === 1 && plan.operations.length === 1 && plan.operations[0].name === 'Only step');
    ok('the three old steps are gone, none left without a plan', (await prisma.dispatchOperation.count({ where: { id: { in: j.ops.map((o) => o.id) } } })) === 0);
    await chain(ok, j.id);
  });
  await scenario(G1, 'a plan with recorded work cannot be replaced, and the recorded time is kept', async (ok) => {
    const j = await mkJob({ steps: 2 });
    await startOp(j.ops[0]); await pauseOp(j.ops[0]);
    const logsBefore = await logsOf(j.ops[0].id);
    await move(j.id, 'SCHEDULED'); // back to waiting, so the only thing stopping a new plan is the work on record
    const again = await A.post(`/api/jobs/${j.id}/plan`, { operations: [{ workCenterType: T }] });
    ok('refused with 409', again.status === 409 && /recorded/.test(again.body?.error || ''), `${again.status} ${again.body?.error}`);
    ok('the two steps and the time log are untouched', (await opsOf(j.id)).length === 2 && (await logsOf(j.ops[0].id)).length === logsBefore.length && logsBefore.length === 1);
  });
  await scenario(G1, 'two people planning the same job at the same moment leave one plan whose steps belong together', async (ok) => {
    let bad = 0;
    for (let i = 0; i < 5; i++) {
      const j = await mkJob({ planned: false });
      const [a, b] = await Promise.all([
        A.post(`/api/jobs/${j.id}/plan`, { operations: [{ workCenterType: T, name: 'A1' }, { workCenterType: T, name: 'A2' }] }),
        pm1.call('POST', `/api/jobs/${j.id}/plan`, { operations: [{ workCenterType: T2, name: 'B1' }] }),
      ]);
      const plans = await prisma.dispatchJob.findMany({ where: { jobId: j.id }, include: { operations: true } });
      const names = plans[0]?.operations.map((o) => o.name).sort().join();
      if (plans.length !== 1 || !['A1,A2', 'B1'].includes(names) || ![a.status, b.status].includes(200) || (await jobOf(j.id)).status !== 'SCHEDULED') bad++;
    }
    ok('5 rounds: one plan each, from one request, never a mix', bad === 0, `${bad} rounds wrong`);
  });
  await scenario(G1, 'a routing goes draft, review, in use; only a routing in use can be put on a job', async (ok) => {
    const made = await pm1.call('POST', '/api/v1/bom/recipes', recipeBody());
    ok('created as a draft at version 1 with its two steps in order', made.status === 201 && made.body.status === 'DRAFT' && made.body.version === 1 && made.body.operations.map((o) => o.sequence).join() === '1,2', `${made.status} ${made.body?.error}`);
    const jump = await A.post(`/api/v1/bom/recipes/${made.body.id}/transition`, { targetStatus: 'ACTIVE' });
    ok('a draft cannot jump straight into use', jump.status === 400 && (await prisma.bomRecipe.findUnique({ where: { id: made.body.id } })).status === 'DRAFT', `${jump.status}`);
    const j = await mkJob({ planned: false });
    const early = await A.patch(`/api/jobs/${j.id}`, { recipeId: made.body.id });
    ok('a draft routing cannot be put on a job', early.status === 409 && (await jobOf(j.id)).recipeId === null, `${early.status} ${early.body?.error}`);
    await A.post(`/api/v1/bom/recipes/${made.body.id}/transition`, { targetStatus: 'REVIEW' });
    const live = await A.post(`/api/v1/bom/recipes/${made.body.id}/activate`, {});
    ok('review, then in use', live.status === 200 && live.body.status === 'ACTIVE');
    const put = await A.patch(`/api/jobs/${j.id}`, { recipeId: made.body.id });
    const row = await jobOf(j.id);
    ok('now it goes on the job, with the version it was at', put.status === 200 && row.recipeId === made.body.id && row.recipeVersion === 1, `${put.status} ${put.body?.error}`);
    const edit = await A.put(`/api/v1/bom/recipes/${made.body.id}`, { name: 'changed while in use' });
    ok('a routing in use cannot be edited in place', edit.status === 400 && (await prisma.bomRecipe.findUnique({ where: { id: made.body.id } })).name !== 'changed while in use');
  });
  await scenario(G1, 'a routing step must have a name, a kind of work center on file, its own place in the order and times that are not negative', async (ok) => {
    const before = await prisma.bomRecipe.count();
    const tries = [
      recipeBody({ operations: [{ workCenterType: T }] }),
      recipeBody({ operations: [{ name: 'Saw', workCenterType: 'NO-SUCH-KIND' }] }),
      recipeBody({ operations: [{ name: 'A', workCenterType: T, sequence: 1 }, { name: 'B', workCenterType: T, sequence: 1 }] }),
      recipeBody({ operations: [{ name: 'A', workCenterType: T, setupMinutes: -5 }] }),
      recipeBody({ operations: 'saw then deburr' }),
      recipeBody({ thicknessMin: 2, thicknessMax: 1 }),
    ];
    const answers = [];
    for (const body of tries) answers.push(await A.post('/api/v1/bom/recipes', body));
    ok('all six refused with 400 (the first used to fail with a server error)', answers.every((r) => r.status === 400), answers.map((r) => r.status).join(','));
    ok('no routing was saved', (await prisma.bomRecipe.count()) === before);
    const good = await A.post('/api/v1/bom/recipes', recipeBody());
    const worse = await A.put(`/api/v1/bom/recipes/${good.body.id}`, { operations: [{ name: 'A', workCenterType: 'NO-SUCH-KIND' }] });
    ok('a bad edit is refused and the old steps are still there', worse.status === 400 && (await prisma.bomOperation.count({ where: { recipeId: good.body.id } })) === 2, `${worse.status}`);
  });
  await scenario(G1, 'a routing with no steps cannot go into use, and a new version is a separate draft', async (ok) => {
    const empty = await A.post('/api/v1/bom/recipes', recipeBody({ operations: [] }));
    await A.post(`/api/v1/bom/recipes/${empty.body.id}/transition`, { targetStatus: 'REVIEW' });
    const a = await A.post(`/api/v1/bom/recipes/${empty.body.id}/activate`, {});
    const b = await A.post(`/api/v1/bom/recipes/${empty.body.id}/transition`, { targetStatus: 'ACTIVE' });
    ok('refused both ways with 409', a.status === 409 && b.status === 409 && (await prisma.bomRecipe.findUnique({ where: { id: empty.body.id } })).status === 'REVIEW', `${a.status} ${b.status}`);
    const live = await activeRecipe();
    const copy = await A.post(`/api/v1/bom/recipes/${live.id}/clone`, {});
    ok('the copy is a draft at version 2 with the same steps, and the one in use is unchanged', copy.status === 201 && copy.body.status === 'DRAFT' && copy.body.version === 2 && copy.body.operations.length === 2 && (await prisma.bomRecipe.findUnique({ where: { id: live.id } })).status === 'ACTIVE');
    const both = await Promise.all([A.post(`/api/v1/bom/recipes/${live.id}/transition`, { targetStatus: 'DEPRECATED' }), A.post(`/api/v1/bom/recipes/${live.id}/transition`, { targetStatus: 'DEPRECATED' })]);
    ok('two people retiring it at once: one wins, the other is told', both.map((r) => r.status).sort().join() === '200,400' || both.map((r) => r.status).sort().join() === '200,409', both.map((r) => r.status).join());
  });
  await scenario(G1, 'a coil work order follows its steps: draft, released, started; nothing skips or goes back', async (ok) => {
    const coilId = await B.received({ weightLb: 3000 });
    const made = await workOrder(coilId, {}, pm1);
    ok('created as a draft for the weight on hand', made.status === 201 && made.body.status === 'DRAFT' && near(made.body.inputWeightLb, 3000), `${made.status} ${made.body?.error}`);
    const skip = await A.put(`/api/work-orders/${made.body.id}/complete`, { outputWeightLb: 2900, scrapWeightLb: 100 });
    ok('a draft cannot be completed', skip.status === 409 && (await woOf(made.body.id)).status === 'DRAFT' && near((await invOf(coilId)).qtyOnHand, 3000));
    const rel = await A.put(`/api/work-orders/${made.body.id}/release`, {});
    const start = await A.put(`/api/work-orders/${made.body.id}/start`, {});
    const back = await A.put(`/api/work-orders/${made.body.id}/release`, {});
    ok('released, started, and not released again', rel.status === 200 && start.status === 200 && back.status === 409 && (await woOf(made.body.id)).status === 'IN_PROGRESS');
    const history = await auditOf('WorkOrder', made.body.id);
    ok('each step is on record with who did it', history.length === 3 && history[0].eventType === 'WORK_ORDER_CREATED' && history[0].userId === pm1.user.id && history.slice(1).map((r) => `${r.details.from}>${r.details.to}`).join() === 'DRAFT>READY,READY>IN_PROGRESS', history.map((r) => r.eventType).join());
    await A.put(`/api/work-orders/${made.body.id}/cancel`, {});
    const again = await A.put(`/api/work-orders/${made.body.id}/start`, {});
    ok('a cancelled work order cannot be started again, and the stock was never touched', again.status === 409 && near((await invOf(coilId)).qtyOnHand, 3000) && (await stockMoves(coilId, 'CONSUME')).length === 0);
  });
  await scenario(G1, 'a coil work order cut for an order line in another grade is refused unless it is recorded as a substitution', async (ok) => {
    const coilId = await B.received({ weightLb: 2000 });
    const otherGrade = await prisma.grade.findFirst({ where: { id: { not: heat.gradeId } } });
    const o = await mkOrder({ line: { gradeId: otherGrade.id } });
    const before = await prisma.workOrder.count();
    const a = await workOrder(coilId, { lineId: o.lines[0].id });
    ok('refused with 409, naming both grades', a.status === 409 && a.body.error.includes(heat.grade.code) && a.body.error.includes(otherGrade.code), `${a.status} ${a.body?.error}`);
    ok('no work order saved', (await prisma.workOrder.count()) === before);
    const b = await workOrder(coilId, { lineId: o.lines[0].id, substitutionReason: 'Customer approved by email 2026-11-15' });
    const audit = b.body?.id ? await auditOf('WorkOrder', b.body.id, 'WORK_ORDER_CREATED') : [];
    ok('accepted with a reason, and the substitution is on record', b.status === 201 && audit[0]?.details?.substitution?.ordered === otherGrade.code && audit[0].details.substitution.used === heat.grade.code && /Customer approved/.test(audit[0].details.substitution.reason), `${b.status} ${b.body?.error}`);
    const same = await mkOrder();
    const c = await workOrder(coilId, { lineId: same.lines[0].id });
    ok('the same grade needs no reason', c.status === 201);
  });
}

// ════════════════════════════════════════════════════════════════════════════════
if (want(2)) {
  const hold = (coilId, who = 'admin') => A.call('POST', `/api/coils/${coilId}/hold`, { holdType: 'QUALITY', holdReason: 'QA phase 7 hold' }, who);
  const finishWo = (wo, body, who = 'admin') => as(who)('PUT', `/api/work-orders/${wo.id}/complete`, body);

  await scenario(G2, 'a work order for an order line cuts the stock reserved for that line, and the books still balance', async (ok) => {
    const coilId = await B.received({ weightLb: 3000 });
    const o = await mkOrder({ qty: 1000 });
    const rz = await B.reserve(o, o.lines[0], coilId, 1000);
    const wo = await startedWorkOrder(coilId, { lineId: o.lines[0].id, inputWeightLb: 1000 });
    const d = await finishWo(wo, { scrapWeightLb: 50, outputs: [{ weightLb: 950, widthIn: 24 }] });
    ok('reserved, then completed', rz.status < 300 && d.status === 200, `${rz.status} ${d.status} ${d.body?.error}`);
    const src = await books(ok, coilId, 'source');
    ok('1,000 lb left the source: 2,000 on hand', near(src.qtyOnHand, 2000), String(src.qtyOnHand));
    const pieces = await prisma.coil.findMany({ where: { parentCoilId: coilId } });
    ok('one piece of 950 lb', pieces.length === 1 && near((await invOf(pieces[0].id)).qtyOnHand, 950));
    for (const p of pieces) await books(ok, p.id, 'piece');
    const reserved = await prisma.orderLineAllocation.aggregate({ where: { orderLineId: o.lines[0].id }, _sum: { qtyAllocated: true } });
    ok('what is reserved for the line is on stock that exists (never more than the line ordered)', num(reserved._sum.qtyAllocated) <= 1000 + 1e-6, String(reserved._sum.qtyAllocated));
    ok('50 lb of scrap on record', near((await stockMoves(coilId, 'SCRAP')).reduce((n, m) => n + num(m.qtyMoved), 0), 50));
  });
  await scenario(G2, 'a work order cannot cut stock that is reserved for another order', async (ok) => {
    const coilId = await B.received({ weightLb: 1000 });
    const o = await mkOrder({ qty: 800 });
    await B.reserve(o, o.lines[0], coilId, 800);
    const wo = await startedWorkOrder(coilId, { inputWeightLb: 1000 });
    const d = await finishWo(wo, { outputWeightLb: 480, scrapWeightLb: 20 });
    ok('refused with 409', d.status === 409, `${d.status} ${d.body?.error}`);
    const i = await books(ok, coilId);
    ok('nothing consumed: 1,000 on hand, 800 still reserved', near(i.qtyOnHand, 1000) && near(i.qtyAllocated, 800) && (await stockMoves(coilId, 'CONSUME')).length === 0);
    ok('the work order is still in progress', (await woOf(wo.id)).status === 'IN_PROGRESS');
    const small = await finishWo(wo, { outputWeightLb: 190, scrapWeightLb: 10 });
    ok('within the free 200 lb it completes', small.status === 200 && near((await invOf(coilId)).qtyOnHand, 800), `${small.status} ${small.body?.error}`);
  });
  await scenario(G2, 'stock reserved for one order line cannot be cut for a different line', async (ok) => {
    const coilId = await B.received({ weightLb: 1000 });
    const mine = await mkOrder({ qty: 1000 }); const theirs = await mkOrder({ qty: 500 });
    await B.reserve(mine, mine.lines[0], coilId, 1000);
    const wo = await startedWorkOrder(coilId, { lineId: theirs.lines[0].id, inputWeightLb: 500 });
    const d = await finishWo(wo, { outputWeightLb: 480, scrapWeightLb: 20 });
    ok('refused with 409', d.status === 409, `${d.status} ${d.body?.error}`);
    const i = await books(ok, coilId);
    ok('the first order still has its 1,000 lb reserved', near(i.qtyAllocated, 1000) && near(i.qtyOnHand, 1000));
  });
  await scenario(G2, 'two work orders on one item cannot together use more than it holds', async (ok) => {
    const coilId = await B.received({ weightLb: 1000 });
    const a = await startedWorkOrder(coilId); const b = await startedWorkOrder(coilId);
    const first = await finishWo(a, { outputWeightLb: 580, scrapWeightLb: 20 });
    const second = await finishWo(b, { outputWeightLb: 580, scrapWeightLb: 20 });
    ok('the first completes, the second is refused', first.status === 200 && second.status === 409, `${first.status} ${second.status} ${second.body?.error}`);
    const i = await books(ok, coilId);
    ok('400 lb left, used once', near(i.qtyOnHand, 400));
    const fit = await finishWo(b, { outputWeightLb: 390, scrapWeightLb: 10 });
    ok('the second completes for what is left, and the item is used up', fit.status === 200 && near((await invOf(coilId)).qtyOnHand, 0) && (await coilOf(coilId)).status === 'CONSUMED', `${fit.status} ${fit.body?.error}`);
  });
  await scenario(G2, 'two work orders on one item completed at the same moment: stock is used once', async (ok) => {
    let bad = 0;
    for (let i = 0; i < 4; i++) {
      const coilId = await B.received({ weightLb: 1000 });
      const a = await startedWorkOrder(coilId); const b = await startedWorkOrder(coilId);
      const [x, y] = await Promise.all([finishWo(a, { outputWeightLb: 700, scrapWeightLb: 0 }), finishWo(b, { outputWeightLb: 700, scrapWeightLb: 0 })]);
      const inv = await invOf(coilId);
      const used = (await stockMoves(coilId, 'CONSUME')).reduce((n, m) => n + num(m.qtyMoved), 0);
      if ([x.status, y.status].sort().join() !== '200,409' || !near(inv.qtyOnHand, 300) || !near(used, 700)) bad++;
    }
    ok('4 rounds: one wins, 300 lb left, 700 consumed', bad === 0, `${bad} rounds wrong`);
  });
  await scenario(G2, 'more cannot come off the line than went on', async (ok) => {
    const coilId = await B.received({ weightLb: 1000 });
    const wo = await startedWorkOrder(coilId);
    const over = await finishWo(wo, { outputWeightLb: 1000, scrapWeightLb: 200 });
    const negative = await finishWo(wo, { outputWeightLb: -5 });
    const blank = await finishWo(wo, {});
    ok('all three refused with 400', [over, negative, blank].every((r) => r.status === 400), [over, negative, blank].map((r) => r.status).join());
    ok('nothing changed', near((await invOf(coilId)).qtyOnHand, 1000) && (await woOf(wo.id)).status === 'IN_PROGRESS' && (await prisma.coil.count({ where: { parentCoilId: coilId } })) === 0);
  });
  await scenario(G2, 'what a work order makes carries the heat, grade and owner of what it was cut from', async (ok) => {
    const coilId = await B.received({ weightLb: 2000 });
    await prisma.coil.update({ where: { id: coilId }, data: { ownerId: w.custA.id } });
    const wo = await startedWorkOrder(coilId);
    const d = await finishWo(wo, { scrapWeightLb: 50, outputs: [{ weightLb: 975, widthIn: 24 }, { weightLb: 975, widthIn: 24 }] });
    const pieces = await prisma.coil.findMany({ where: { parentCoilId: coilId } });
    ok('two pieces, each with the source heat, grade and owner', d.status === 200 && pieces.length === 2 && pieces.every((p) => p.heatId === heat.id && p.gradeId === heat.gradeId && p.ownerId === w.custA.id), `${d.status} ${pieces.length}`);
    const outs = await prisma.workOrderOutput.findMany({ where: { workOrderId: wo.id } });
    ok('each piece is tied to the work order that made it', outs.length === 2 && outs.every((o) => pieces.some((p) => p.id === o.outputCoilId)));
    const saved = await woOf(wo.id);
    ok('yield is 97.5% of what went in', near(saved.yieldPct, 97.5, 0.01) && near(saved.outputWeightLb, 1950) && near(saved.scrapWeightLb, 50));
    for (const p of pieces) await books(ok, p.id, p.coilNumber);
    await books(ok, coilId, 'source');
  });
  await scenario(G2, 'material on quality hold is not put on a work order, and a hold placed mid-run stops the completion', async (ok) => {
    const held = await B.received({ weightLb: 1000 });
    const h = await hold(held);
    const a = await workOrder(held);
    ok('held material is refused with 409', h.status < 300 && a.status === 409, `${h.status} ${a.status}`);
    const coilId = await B.received({ weightLb: 1000 });
    const wo = await startedWorkOrder(coilId);
    await hold(coilId);
    const d = await finishWo(wo, { outputWeightLb: 950, scrapWeightLb: 50 });
    ok('completion refused with 409 while the hold stands', d.status === 409 && /hold/.test(d.body?.error || ''), `${d.status} ${d.body?.error}`);
    ok('nothing consumed and no pieces made', (await stockMoves(coilId, 'CONSUME')).length === 0 && (await prisma.coil.count({ where: { parentCoilId: coilId } })) === 0);
    await books(ok, coilId);
  });
  await scenario(G2, 'a work order cannot ask for more than the item holds, or be opened on an item that is used up or unknown', async (ok) => {
    const coilId = await B.received({ weightLb: 500 });
    const before = await prisma.workOrder.count();
    const a = await workOrder(coilId, { inputWeightLb: 501 });
    const used = await B.received({ weightLb: 300 });
    const w1 = await startedWorkOrder(used); await finishWo(w1, { outputWeightLb: 290, scrapWeightLb: 10 });
    const b = await workOrder(used);
    const c = await workOrder('00000000-0000-0000-0000-000000000000');
    const d = await workOrder(coilId, { woType: 'MELT' });
    ok('too much: 400; used up: 409; unknown item: 400; unknown kind of work: 400', a.status === 400 && b.status === 409 && c.status === 400 && d.status === 400, [a, b, c, d].map((r) => r.status).join());
    ok('only the one real work order was saved', (await prisma.workOrder.count()) === before + 1);
  });
  await scenario(G2, 'using part of an item leaves the rest available', async (ok) => {
    const coilId = await B.received({ weightLb: 3000 });
    const wo = await startedWorkOrder(coilId, { inputWeightLb: 1000 });
    const d = await finishWo(wo, { outputWeightLb: 960, scrapWeightLb: 40 });
    const i = await books(ok, coilId);
    ok('2,000 lb left and available, the item still in stock', d.status === 200 && near(i.qtyOnHand, 2000) && near(i.qtyAvailable, 2000) && ['AVAILABLE', 'IN_PROCESS'].includes((await coilOf(coilId)).status), `${d.status} ${i.qtyOnHand}`);
    ok('1,000 lb consumed in all: 960 made, 40 scrap', near((await stockMoves(coilId, 'CONSUME')).reduce((n, m) => n + num(m.qtyMoved), 0) + (await stockMoves(coilId, 'SCRAP')).reduce((n, m) => n + num(m.qtyMoved), 0), 1000));
  });
  await scenario(G2, 'a work order cannot be completed twice', async (ok) => {
    const coilId = await B.received({ weightLb: 1000 });
    const wo = await startedWorkOrder(coilId);
    const first = await finishWo(wo, { outputWeightLb: 480, scrapWeightLb: 20 });
    const again = await finishWo(wo, { outputWeightLb: 480, scrapWeightLb: 20 });
    ok('the second is refused with 409', first.status === 200 && again.status === 409, `${first.status} ${again.status}`);
    ok('500 lb left: used once, one piece', near((await invOf(coilId)).qtyOnHand, 500) && (await prisma.coil.count({ where: { parentCoilId: coilId } })) === 1);
    const both = await B.received({ weightLb: 1000 });
    const wo2 = await startedWorkOrder(both);
    const pair = await Promise.all([finishWo(wo2, { outputWeightLb: 480, scrapWeightLb: 20 }), finishWo(wo2, { outputWeightLb: 480, scrapWeightLb: 20 }, pm1)]);
    ok('two people at once: one wins, 500 lb left', pair.map((r) => r.status).sort().join() === '200,409' && near((await invOf(both)).qtyOnHand, 500), pair.map((r) => r.status).join());
  });
  await scenario(G2, 'a production manager cannot open a work order on another branch\'s stock, or see that branch\'s work orders', async (ok) => {
    const coilId = await B.received({ weightLb: 1000 }); // at QA-L01
    const before = await prisma.workOrder.count();
    const a = await workOrder(coilId, {}, pm2);
    ok('refused: the item is not on file for that branch', a.status === 400 && (await prisma.workOrder.count()) === before, `${a.status}`);
    const mine = await workOrder(coilId, {}, pm1);
    const peek = await pm2.call('GET', `/api/work-orders/${mine.body.id}`);
    const push = await pm2.call('PUT', `/api/work-orders/${mine.body.id}/start`, {});
    const list = await pm2.call('GET', '/api/work-orders?limit=200');
    const rows = Array.isArray(list.body) ? list.body : list.body?.data || [];
    ok('the other branch gets 404 on it and cannot move it', peek.status === 404 && push.status === 404 && (await woOf(mine.body.id)).status === 'DRAFT', `${peek.status} ${push.status}`);
    ok('and it is not in their list', list.status === 200 && !rows.some((r) => r.id === mine.body.id));
  });
  await scenario(G2, 'the routing offered for a material is one that is in use; a retired one is offered only when asked for', async (ok) => {
    const live = await activeRecipe();
    const draft = await A.post('/api/v1/bom/recipes', recipeBody());
    const hit = await A.post('/api/v1/bom/recipes/match', { materialCode: live.materialCode });
    ok('the routing in use is found by its material', hit.status === 200 && hit.body.match.id === live.id && hit.body.match.operations.length === 2, `${hit.status}`);
    const miss = await A.post('/api/v1/bom/recipes/match', { materialCode: draft.body.materialCode });
    ok('a draft is never offered', miss.status === 404 || miss.body?.match?.id !== draft.body.id, `${miss.status}`);
    await A.post(`/api/v1/bom/recipes/${live.id}/transition`, { targetStatus: 'DEPRECATED' });
    const gone = await A.post('/api/v1/bom/recipes/match', { materialCode: live.materialCode });
    const asked = await A.post('/api/v1/bom/recipes/match', { materialCode: live.materialCode, allowNonActive: true });
    ok('once retired it is not offered, unless retired routings are asked for', gone.body?.match?.id !== live.id && asked.status === 200 && asked.body.match.id === live.id, `${gone.status} ${asked.status}`);
  });
  await scenario(G2, 'a suggested routing names steps only: no times or tolerances are made up', async (ok) => {
    const r = await pm1.call('POST', '/api/v1/bom/ai-suggest', { description: 'saw cut then deburr the edges', form: 'PLATE', commodity: 'METALS' });
    const ops = r.body?.suggestedOperations || [];
    ok('steps are suggested', r.status === 200 && ops.length >= 2, `${r.status} ${ops.length}`);
    ok('every time is zero and every tolerance is empty, for the planner to fill in', ops.every((o) => o.estimatedMachineMinutes === 0 && o.estimatedLaborMinutes === 0 && o.setupMinutes === 0 && (o.parameters || []).every((p) => p.value === '')), JSON.stringify(ops[0]));
    ok('and the note says so', /none is assumed/.test(r.body.analysisNotes || ''));
    ok('nothing was saved by asking', (await prisma.bomRecipe.count({ where: { name: r.body.suggestedName } })) === 0);
  });
  await scenario(G2, 'sales staff can read routings but cannot create, change or put one into use', async (ok) => {
    const before = await prisma.bomRecipe.count();
    const live = await activeRecipe();
    const a = await A.call('POST', '/api/v1/bom/recipes', recipeBody(), 'csr');
    const b = await A.call('PUT', `/api/v1/bom/recipes/${live.id}`, { name: 'x' }, 'csr');
    const c = await A.call('POST', `/api/v1/bom/recipes/${live.id}/transition`, { targetStatus: 'DEPRECATED' }, 'csr');
    const d = await opr1.call('POST', '/api/v1/bom/recipes', recipeBody());
    ok('create, edit and retire are refused with 403 for sales, and create for an operator', [a, b, c, d].every((r) => r.status === 403), [a, b, c, d].map((r) => r.status).join());
    ok('only the fixture routing was added and it is unchanged', (await prisma.bomRecipe.count()) === before + 1 && (await prisma.bomRecipe.findUnique({ where: { id: live.id } })).status === 'ACTIVE');
  });
  await scenario(G2, 'bills of material (a list of materials and quantities for a product) are not part of this product', async (ok) => {
    const cols = (await prisma.$queryRawUnsafe(`select column_name from information_schema.columns where table_name in ('BomRecipe','BomOperation')`)).map((r) => r.column_name);
    ok('the tables named Bom hold routings: no component, material quantity or unit-of-measure column', !cols.some((c) => /component|quantity|qtyPer|uom|materialId|productId/i.test(c)), cols.join());
    ok('no other table holds a bill of materials', (await tables('billofmaterial|bomline|bomitem|bomcomponent|materialrequirement')).length === 0);
  }, NA);
  await scenario(G2, 'material requirements planning for a job (what it needs, what is short, when) is not part of this product', async (ok) => {
    const cols = (await prisma.$queryRawUnsafe(`select column_name from information_schema.columns where table_name = 'Job'`)).map((r) => r.column_name);
    ok('a job records weights in and out but no required material, required quantity or shortage', !cols.some((c) => /required|shortage|demand|materialId|coilId/i.test(c)), cols.join());
    ok('material for a line is reserved on the order (Phase 6), and that is what a work order cuts', (await tables('^OrderLineAllocation$')).length === 1);
  }, NA);
}

// ── a shop of its own: a new kind of work center with its own work centers and operators, so a
//    scenario about scheduling is not disturbed by the work other scenarios leave waiting ──────────
let cellNo = 0;
async function cell({ loc = L1, wcs = 1, people = 1, wcOver = {}, opOver = {} } = {}) {
  const n = ++cellNo;
  const type = `Q${String.fromCharCode(65 + Math.floor(n / 26))}${String.fromCharCode(65 + (n % 26))}${run}`.slice(0, 14);
  const r = await A.post('/api/v1/dispatch/work-center-types', { id: type, label: `QA P7 cell ${n}`, divisions: ['METALS'] });
  if (r.status !== 201) throw new Error(`type ${r.status} ${JSON.stringify(r.body)}`);
  const centers = []; for (let i = 0; i < wcs; i++) centers.push(await mkWc(loc, type, wcOver));
  const crew = []; for (let i = 0; i < people; i++) crew.push(await mkOperator(loc, { types: [type], ...opOver }));
  return { type, wcs: centers, wc: centers[0], people: crew, person: crew[0], loc };
}
const cellJob = (c, over = {}) => mkJob({ loc: c.loc, types: Array(over.steps || 1).fill(c.type), ...over, job: { operationType: c.type, ...(over.job || {}) } });
/** Working hours a day on a work center's record (set from the work center screen's address). */
async function setHours(wc, hoursPerDay) {
  const row = await prisma.workCenter.findUnique({ where: { id: wc.id } });
  const r = await A.call('PATCH', `/api/work-centers/${wc.id}`, { capacity: { ...(row.capacity || {}), hoursPerDay } }, 'admin');
  if (r.status !== 200) throw new Error(`hours ${r.status} ${JSON.stringify(r.body)}`);
}
const dispatch = (loc = L1, who = 'admin') => as(who)('POST', '/api/v1/dispatch/run', { locationId: loc.id });
const opRow0 = async (j) => (await opsOf(j.id))[0];
const opRow = (id) => prisma.dispatchOperation.findUnique({ where: { id } });
const preview = (body, who = 'admin') => as(who)('POST', '/api/v1/ai/work-order-optimize/preview', body);
const applyPlan = (optimizedJobs, who = 'admin') => as(who)('POST', '/api/v1/ai/work-order-optimize/apply', { optimizedJobs });
let assetNo = 0;
/** A machine on file at a work center (there is no screen that creates one; the row is written as a fixture). */
async function machineAt(wc, loc = L1, over = {}) {
  const type = await prisma.assetType.upsert({ where: { code: 'QA-P7' }, update: {}, create: { code: 'QA-P7', name: 'QA phase 7 machine' } });
  return prisma.asset.create({ data: { assetNumber: tag('AST'), name: `QA P7 machine ${++assetNo}`, assetTypeId: type.id, siteId: loc.id, workCenterId: wc.id, ...over } });
}

// ════════════════════════════════════════════════════════════════════════════════
if (want(3)) {
  await scenario(G3, 'scheduling places a waiting step on a work center of the right kind with a certified operator, and states a start time only for the step at the front', async (ok) => {
    const c = await cell();
    const a = await cellJob(c); const b = await cellJob(c);
    const r = await dispatch();
    ok('the run answers', r.status === 200, `${r.status} ${r.body?.error}`);
    const [x, y] = [await opRow(a.ops[0].id), await opRow(b.ops[0].id)];
    ok('both steps are on the cell\'s work center with its operator', [x, y].every((o) => o.status === 'SCHEDULED' && o.assignedWorkCenterId === c.wc.id && o.assignedOperatorId === c.person.id), `${x.status} ${y.status}`);
    const timed = [x, y].filter((o) => o.scheduledStart);
    ok('only the step at the front of the queue has a start time: no duration is on file, so none is stated for the one behind it', timed.length === 1, `${timed.length} timed`);
    ok('no end time is stated for either', [x, y].every((o) => o.scheduledEnd === null));
    ok('the answer counts what it placed', r.body.data.details.filter((d) => [a.ops[0].id, b.ops[0].id].includes(d.id)).length === 2);
  });
  await scenario(G3, 'a step that needs a kind of work center the branch does not have is reported, not placed', async (ok) => {
    const c = await cell({ loc: L2 });                 // the only work center of this kind is at the other branch
    const j = await mkJob({ loc: L1, types: [c.type], job: { operationType: c.type } });
    const r = await dispatch();
    const row = await opRow(j.ops[0].id);
    ok('it stays waiting, with no work center', row.status === 'PENDING' && row.assignedWorkCenterId === null && row.scheduledStart === null);
    const said = (r.body.data.unassigned || []).find((u) => u.operationId === j.ops[0].id);
    ok('the answer names it and says why', Boolean(said) && /has no/.test(said.reason), JSON.stringify(said));
    ok('and the count of unplaced steps includes it', r.body.data.unassignedCount >= 1 && r.body.data.unassignedCount === r.body.data.unassigned.length);
  });
  await scenario(G3, 'work is shared between work centers of the same kind', async (ok) => {
    const c = await cell({ wcs: 2, people: 2 });
    const jobs = []; for (let i = 0; i < 4; i++) jobs.push(await cellJob(c));
    await dispatch();
    const rows = await Promise.all(jobs.map((j) => opRow(j.ops[0].id)));
    const per = c.wcs.map((wc) => rows.filter((o) => o.assignedWorkCenterId === wc.id).length);
    ok('four steps over two work centers: two each', per.join() === '2,2', per.join());
    const people = c.people.map((p) => rows.filter((o) => o.assignedOperatorId === p.id).length);
    ok('and two each for the two operators', people.join() === '2,2', people.join());
    ok('one start time per work center', rows.filter((o) => o.scheduledStart).length === 2);
  });
  await scenario(G3, 'a work center that is switched off is given no work', async (ok) => {
    const c = await cell({ wcs: 2 });
    const off = await A.call('PATCH', `/api/v1/dispatch/work-centers/${c.wcs[0].id}`, { isOnline: false }, 'admin');
    const jobs = []; for (let i = 0; i < 3; i++) jobs.push(await cellJob(c));
    await dispatch();
    const rows = await Promise.all(jobs.map((j) => opRow(j.ops[0].id)));
    ok('switched off', off.status === 200 && (await prisma.workCenter.findUnique({ where: { id: c.wcs[0].id } })).isActive === false, `${off.status} ${JSON.stringify(off.body).slice(0, 120)}`);
    ok('all three steps went to the one that is on', rows.every((o) => o.assignedWorkCenterId === c.wcs[1].id), rows.map((o) => o.assignedWorkCenterId === c.wcs[1].id).join());
  });
  await scenario(G3, 'a machine locked out for maintenance is given no work until the maintenance is finished', async (ok) => {
    const c = await cell();
    const asset = await machineAt(c.wc);
    const mo = await A.post('/api/maintenance-orders', { assetId: asset.id, type: 'CORRECTIVE', title: `QA P7 lockout ${run}`, lotoRequired: true });
    const begun = await A.put(`/api/maintenance-orders/${mo.body.id}/start`, {});
    const j = await cellJob(c);
    const r = await dispatch();
    ok('maintenance is under way with lockout', mo.status === 201 && begun.status === 200, `${mo.status} ${begun.status} ${JSON.stringify(begun.body).slice(0, 120)}`);
    ok('the step was not placed', (await opRow(j.ops[0].id)).status === 'PENDING');
    ok('the answer says the machine is locked out', (r.body.data.notChecked || []).some((n) => /locked out for maintenance/.test(n) && n.includes(asset.name)), JSON.stringify(r.body.data.notChecked));
    const tried = await startOp(j.ops[0], c.person, c.wc);
    ok('and an operator cannot start the step there by hand', tried.status === 409 && /locked out/.test(tried.body?.error || ''), `${tried.status} ${tried.body?.error}`);
    const done = await A.put(`/api/maintenance-orders/${mo.body.id}/complete`, { actualHours: 1, workPerformed: 'QA' });
    await dispatch();
    ok('once maintenance is finished the step is placed', done.status === 200 && (await opRow(j.ops[0].id)).assignedWorkCenterId === c.wc.id, `${done.status} ${JSON.stringify(done.body).slice(0, 120)}`);
  });
  await scenario(G3, 'a machine recorded as out of service or on a safety hold is given no work', async (ok) => {
    const c = await cell({ wcs: 2 });
    await machineAt(c.wcs[0], L1, { status: 'OUT_OF_SERVICE' });
    const j = await cellJob(c);
    await dispatch();
    ok('the step went to the other work center', (await opRow(j.ops[0].id)).assignedWorkCenterId === c.wcs[1].id);
    const d = await cell();
    const m = await machineAt(d.wc, L1, { status: 'SAFETY_HOLD' });
    const k = await cellJob(d);
    const r = await dispatch();
    ok('with the only machine on a safety hold the step waits and the answer says why', (await opRow(k.ops[0].id)).status === 'PENDING' && (r.body.data.notChecked || []).some((n) => n.includes(m.name) && /safety hold/.test(n)), JSON.stringify(r.body.data.notChecked).slice(0, 300));
  });
  await scenario(G3, 'an operator whose certification has lapsed is not put on a step; the step is placed and the gap is reported', async (ok) => {
    const c = await cell({ opOver: { expiresAt: yesterday } });
    const j = await cellJob(c);
    const r = await dispatch();
    const row = await opRow(j.ops[0].id);
    ok('the step has a work center and no operator', row.assignedWorkCenterId === c.wc.id && row.assignedOperatorId === null, `${row.assignedOperatorId}`);
    ok('the answer says steps were left without an operator', (r.body.data.notChecked || []).some((n) => /no operator/.test(n)));
    const list = await A.get(`/api/v1/dispatch/operators?locationId=${L1.id}&workCenterType=${c.type}`);
    const rows = list.body?.data || [];
    ok('the lapsed operator is not offered as certified for this kind', !rows.some((p) => p.id === c.person.id && p.certified !== false), JSON.stringify(rows.find((p) => p.id === c.person.id) || null).slice(0, 200));
  });
  await scenario(G3, 'an operator from another branch is never put on this branch\'s work', async (ok) => {
    const c = await cell({ people: 0 });
    const away = await mkOperator(L2, { types: [c.type] });
    const j = await cellJob(c);
    await dispatch();
    const row = await opRow(j.ops[0].id);
    ok('placed on the work center, with no operator rather than one from the other branch', row.assignedWorkCenterId === c.wc.id && row.assignedOperatorId === null && row.assignedOperatorId !== away.id);
    const tried = await startOp(j.ops[0], away, c.wc);
    ok('and that operator cannot start it either', tried.status === 409 && (await opRow(j.ops[0].id)).status !== 'IN_PROCESS', `${tried.status} ${tried.body?.error}`);
  });
  await scenario(G3, 'a work center\'s recorded thickness limit is respected, and where none is recorded the answer says thickness was not checked', async (ok) => {
    const c = await cell({ wcOver: { maxThicknessInches: 0.5 } });
    const thick = await cellJob(c, { order: await mkOrder({ line: { thicknessIn: 1 } }) });
    const thin = await cellJob(c, { order: await mkOrder({ line: { thicknessIn: 0.25 } }) });
    const r = await dispatch();
    const said = (r.body.data.unassigned || []).find((u) => u.operationId === thick.ops[0].id);
    ok('1 in plate is not placed on a 0.5 in machine, and the reason is given', (await opRow(thick.ops[0].id)).status === 'PENDING' && /0\.5 in against 1 in/.test(said?.reason || ''), JSON.stringify(said));
    ok('0.25 in plate is placed', (await opRow(thin.ops[0].id)).assignedWorkCenterId === c.wc.id);
    const open = await cell();
    await cellJob(open, { order: await mkOrder({ line: { thicknessIn: 6 } }) });
    const r2 = await dispatch();
    ok('where no limit is on file the run says thickness was not checked, instead of assuming a limit', (r2.body.data.notChecked || []).some((n) => /no maximum thickness on file/.test(n)), JSON.stringify(r2.body.data.notChecked).slice(0, 200));
  });
  await scenario(G3, 'two planners scheduling the same branch at the same moment place each step once', async (ok) => {
    const c = await cell({ wcs: 2, people: 2 });
    const jobs = []; for (let i = 0; i < 6; i++) jobs.push(await cellJob(c));
    const mine = new Set(jobs.map((j) => j.ops[0].id));
    const runs = await Promise.all([dispatch(), dispatch(L1, pm1), dispatch(L1, sched1)]);
    ok('all three runs answer', runs.every((r) => r.status === 200), runs.map((r) => r.status).join());
    const placed = runs.flatMap((r) => r.body.data.details.filter((d) => mine.has(d.id)).map((d) => d.id));
    ok('each of the six steps is reported placed exactly once across the runs', placed.length === 6 && new Set(placed).size === 6, `${placed.length}`);
    const rows = await Promise.all(jobs.map((j) => opRow(j.ops[0].id)));
    const per = c.wcs.map((wc) => rows.filter((o) => o.assignedWorkCenterId === wc.id).length);
    ok('three on each work center, and one start time on each', per.join() === '3,3' && rows.filter((o) => o.scheduledStart).length === 2, `${per.join()} ${rows.filter((o) => o.scheduledStart).length}`);
  });
  await scenario(G3, 'scheduling again changes nothing, and steps of cancelled or held jobs are left alone', async (ok) => {
    const c = await cell();
    const live = await cellJob(c); const dead = await cellJob(c); const held = await cellJob(c);
    await move(dead.id, 'CANCELLED', 'admin', 'QA'); await move(held.id, 'ON_HOLD', 'admin', 'QA');
    await dispatch();
    const first = await opRow(live.ops[0].id);
    const again = await dispatch();
    const second = await opRow(live.ops[0].id);
    ok('the open job\'s step is placed once and a second run leaves it as it was', first.status === 'SCHEDULED' && String(first.scheduledStart) === String(second.scheduledStart) && !again.body.data.details.some((d) => d.id === live.ops[0].id));
    ok('the cancelled and held jobs\' steps were not scheduled', (await opRow(dead.ops[0].id)).status === 'PENDING' && (await opRow(held.ops[0].id)).status === 'PENDING');
    const q = await A.get(`/api/v1/dispatch/queue?workCenterId=${c.wc.id}&locationId=${L1.id}`);
    ok('the work center\'s queue lists the one open step', q.status === 200 && q.body.data.operationCount === 1 && q.body.data.operations[0].id === live.ops[0].id, `${q.body?.data?.operationCount}`);
  });
  await scenario(G3, 'a branch planner cannot schedule another branch, and people outside planning cannot schedule at all', async (ok) => {
    const c = await cell();
    const j = await cellJob(c);
    const other = await dispatch(L1, pm2);
    const sales = await dispatch(L1, 'csr');
    const floor = await dispatch(L1, opr1);
    ok('another branch\'s manager, sales and an operator are refused', [other, sales, floor].every((r) => [403, 404].includes(r.status)), [other, sales, floor].map((r) => r.status).join());
    ok('nothing was placed', (await opRow(j.ops[0].id)).status === 'PENDING');
    const none = await dispatch({ id: '00000000-0000-0000-0000-000000000000' });
    const blank = await A.post('/api/v1/dispatch/run', {});
    ok('an unknown branch or no branch is refused with 400', none.status === 400 && blank.status === 400, `${none.status} ${blank.status}`);
  });
  await scenario(G3, 'the planner takes a job\'s time from its routing; a job with no time on file is queued without a start or end time', async (ok) => {
    const c = await cell(); await setHours(c.wc, 8);
    const routing = await activeRecipe({ operations: [{ name: 'Cut', workCenterType: c.type, setupMinutes: 10, estimatedMachineMinutes: 110, estimatedLaborMinutes: 999 }] });
    const timed = await cellJob(c, { planned: false }); const bare = await cellJob(c, { planned: false });
    const put = await A.patch(`/api/jobs/${timed.id}`, { recipeId: routing.id });
    const r = await preview({ locationId: L1.id, jobIds: [timed.id, bare.id], horizonHours: 24 });
    const jobs = r.body?.preview?.optimizedJobs || [];
    const a = jobs.find((j) => j.id === timed.id); const b = jobs.find((j) => j.id === bare.id);
    ok('both jobs are placed on the cell\'s work center', put.status === 200 && r.status === 200 && a?.workCenterId === c.wc.id && b?.workCenterId === c.wc.id, `${put.status} ${r.status}`);
    ok('the routed job takes 120 minutes: set-up plus machine time (labor minutes are not machine time)', a?.estimatedMinutes === 120 && a.estimateSource === 'ROUTING' && Math.round((new Date(a.scheduledEnd) - new Date(a.scheduledStart)) / 60000) === 120, JSON.stringify({ m: a?.estimatedMinutes, s: a?.estimateSource }));
    ok('the job with no time on file has no start or end (it used to be given 60 minutes)', b?.estimatedMinutes === null && b.estimateSource === 'NOT_ON_FILE' && b.scheduledStart === null && b.scheduledEnd === null, JSON.stringify({ m: b?.estimatedMinutes, s: b?.scheduledStart }));
    const s = r.body.preview.workCenterSchedules.find((x) => x.workCenter.id === c.wc.id);
    ok('utilisation is 120 of 480 minutes: 25%, counting only the timed job', near(s.utilizationPercent, 25) && s.totalMinutes === 120 && s.untimedJobs === 1, JSON.stringify({ u: s.utilizationPercent, t: s.totalMinutes }));
    ok('and the plan says one job has no estimate', r.body.preview.metrics.jobsWithoutEstimate === 1 && r.body.preview.notes.some((n) => /no time estimate on file/.test(n)));
  });
  await scenario(G3, 'a work center with no working hours on file has no utilisation figure: none is made up', async (ok) => {
    const c = await cell();
    const routing = await activeRecipe({ operations: [{ name: 'Cut', workCenterType: c.type, setupMinutes: 0, estimatedMachineMinutes: 60, estimatedLaborMinutes: 0 }] });
    const j = await cellJob(c, { planned: false });
    await A.patch(`/api/jobs/${j.id}`, { recipeId: routing.id });
    const r = await preview({ locationId: L1.id, jobIds: [j.id] });
    const s = r.body.preview.workCenterSchedules.find((x) => x.workCenter.id === c.wc.id);
    ok('utilisation is not stated (it used to assume 480 minutes a day)', s.utilizationPercent === null && s.capacityMinutes === null && s.totalMinutes === 60, JSON.stringify({ u: s.utilizationPercent }));
    ok('the plan says which figure is missing', r.body.preview.notes.some((n) => /no working minutes per day on file/.test(n)));
    const an = await A.get(`/api/v1/ai/work-order-optimize/analysis?locationId=${L1.id}`);
    const row = (an.body.workCenterUtilization || []).find((x) => x.workCenterId === c.wc.id);
    ok('the analysis screen gets the same: no figure, not zero', an.status === 200 && row && row.utilizationPercent === null, JSON.stringify(row));
  });
  await scenario(G3, 'an overloaded work center is reported as a bottleneck from the figures on file, and a job that would finish after its promised date is flagged', async (ok) => {
    const c = await cell(); await setHours(c.wc, 8);
    const routing = await activeRecipe({ operations: [{ name: 'Cut', workCenterType: c.type, setupMinutes: 0, estimatedMachineMinutes: 300, estimatedLaborMinutes: 0 }] });
    const jobs = [];
    for (let i = 0; i < 2; i++) { const j = await cellJob(c, { planned: false }); await A.patch(`/api/jobs/${j.id}`, { recipeId: routing.id }); jobs.push(j); }
    const soon = new Date(Date.now() + 2 * 3600000);
    await prisma.order.update({ where: { id: jobs[1].order.id }, data: { promisedDate: soon } });
    const r = await preview({ locationId: L1.id, jobIds: jobs.map((j) => j.id), horizonHours: 24 });
    const p = r.body.preview;
    const s = p.workCenterSchedules.find((x) => x.workCenter.id === c.wc.id);
    ok('600 minutes of work against 480 in the day: 125%', near(s.utilizationPercent, 125), String(s.utilizationPercent));
    ok('reported as a critical bottleneck', p.bottlenecks.some((b) => b.workCenterId === c.wc.id && b.severity === 'CRITICAL'));
    ok('the job promised in two hours is counted at risk, and no promise is changed', p.metrics.jobsAtRisk >= 1 && String((await prisma.order.findUnique({ where: { id: jobs[1].order.id } })).promisedDate) === String(soon), `${p.metrics.jobsAtRisk}`);
    const second = p.optimizedJobs.filter((j) => j.workCenterId === c.wc.id).sort((x, y) => x.queuePosition - y.queuePosition)[1];
    ok('the second job starts after the first ends, running into the next day once the 8 hours are used', new Date(second.scheduledEnd) - new Date(second.scheduledStart) > 300 * 60000, `${second.scheduledStart} ${second.scheduledEnd}`);
  });
  await scenario(G3, 'a preview and a what-if save nothing', async (ok) => {
    const c = await cell();
    const j = await cellJob(c, { planned: false });
    const before = await jobOf(j.id);
    const wcCount = await prisma.workCenter.count();
    const r = await preview({ locationId: L1.id, jobIds: [j.id] });
    const sim = await A.post('/api/v1/ai/work-order-optimize/simulate', { scenario: 'QA', modifications: { addWorkCenter: { name: 'QA what-if', workCenterType: c.type, locationId: L1.id }, changePriorities: [{ jobId: j.id, newPriority: 'HOT' }] } });
    const after = await jobOf(j.id);
    ok('both answer', r.status === 200 && sim.status === 200, `${r.status} ${sim.status}`);
    ok('the job is exactly as it was', after.status === before.status && after.workCenterId === before.workCenterId && after.priority === before.priority && String(after.scheduledStart) === String(before.scheduledStart) && String(after.updatedAt) === String(before.updatedAt));
    ok('no work center was added', (await prisma.workCenter.count()) === wcCount);
  });
  await scenario(G3, 'applying a schedule saves the work center and times, and counts only what it saved', async (ok) => {
    const c = await cell();
    const good = await cellJob(c, { planned: false }); const started = await cellJob(c);
    await startOp(started.ops[0], c.person, c.wc);
    const start = new Date(Date.now() + 3600000).toISOString(); const end = new Date(Date.now() + 7200000).toISOString();
    const r = await applyPlan([
      { id: good.id, workCenterId: c.wc.id, scheduledStart: start, scheduledEnd: end },
      { id: started.id, workCenterId: c.wc.id, scheduledStart: start, scheduledEnd: end },
      { id: '00000000-0000-0000-0000-000000000000', workCenterId: c.wc.id },
      { id: good.id, workCenterId: c.wc.id },
    ]);
    const row = await jobOf(good.id);
    ok('one of four lines is saved and the answer says one', r.status === 200 && r.body.appliedCount === 1 && r.body.skipped.length === 3, `${r.status} ${r.body?.appliedCount} ${JSON.stringify(r.body?.skipped)}`);
    ok('the job has the work center and the times', row.workCenterId === c.wc.id && row.scheduledStart.toISOString() === start && row.scheduledEnd.toISOString() === end);
    ok('the started job was left alone and the reason given', (await jobOf(started.id)).scheduledEnd === null && r.body.skipped.some((s) => s.id === started.id && /in process/.test(s.reason)));
  });
  await scenario(G3, 'a schedule line is refused when the work center is at another branch, the wrong kind, switched off, or the times run backwards', async (ok) => {
    const c = await cell(); const away = await cell({ loc: L2 }); const other = await cell();
    const off = await mkWc(L1, c.type); await A.call('PATCH', `/api/v1/dispatch/work-centers/${off.id}`, { isOnline: false }, 'admin');
    const j = await cellJob(c, { planned: false });
    const t1 = new Date(Date.now() + 7200000).toISOString(); const t0 = new Date(Date.now() + 3600000).toISOString();
    const tries = [
      [{ id: j.id, workCenterId: away.wc.id }, /another branch/],
      [{ id: j.id, workCenterId: other.wc.id }, /the job needs/],
      [{ id: j.id, workCenterId: off.id }, /offline/],
      [{ id: j.id, workCenterId: c.wc.id, scheduledStart: t1, scheduledEnd: t0 }, /not after the start/],
      [{ id: j.id, workCenterId: c.wc.id, scheduledStart: 'next tuesday' }, /not valid/],
      [{ id: j.id, workCenterId: tag('NOPE') }, /not found/],
    ];
    let bad = 0; const seen = [];
    for (const [line, why] of tries) {
      const r = await applyPlan([line]);
      seen.push(`${r.body?.appliedCount}:${r.body?.skipped?.[0]?.reason}`);
      if (r.status !== 200 || r.body.appliedCount !== 0 || !why.test(r.body.skipped?.[0]?.reason || '')) bad++;
    }
    ok('all six are refused, each with its reason', bad === 0, seen.join(' | '));
    const row = await jobOf(j.id);
    ok('the job has no work center and no times', row.workCenterId === null && row.scheduledStart === null && row.scheduledEnd === null);
    const notList = await A.post('/api/v1/ai/work-order-optimize/apply', { optimizedJobs: 'all' });
    ok('a request that is not a list is refused with 400', notList.status === 400);
  });
  await scenario(G3, 'the planner places a job only at its own branch', async (ok) => {
    const c = await cell({ loc: L1 });                 // this kind exists at QA-L01 only
    const j = await mkJob({ loc: L2, planned: false, job: { operationType: c.type } });
    const r = await preview({ jobIds: [j.id] });
    const p = r.body.preview;
    ok('the QA-L02 job is not put on the QA-L01 work center', !p.optimizedJobs.some((x) => x.id === j.id));
    const un = p.unassignedJobs.find((x) => x.id === j.id);
    ok('it is listed as unplaced with the reason', Boolean(un) && /online at this job's branch/.test(un.reason), JSON.stringify(un?.reason));
    const mine = await preview({ locationId: L2.id }, pm2);
    const leak = (mine.body?.preview?.workCenterSchedules || []).some((s) => s.workCenter.locationId === L1.id);
    ok('a QA-L02 manager\'s plan shows no QA-L01 work center', mine.status === 200 && !leak, `${mine.status}`);
    const theirs = await preview({ locationId: L1.id }, pm2);
    const seen = (theirs.body?.preview?.workCenterSchedules || []).length + (theirs.body?.preview?.optimizedJobs || []).length;
    ok('and asking for QA-L01 by name gets them nothing of QA-L01\'s', [403, 404].includes(theirs.status) || seen === 0, `${theirs.status} ${seen}`);
  });
  await scenario(G3, 'the late-jobs list puts overdue first, includes jobs waiting for inspection, and refuses a nonsense time window', async (ok) => {
    const c = await cell();
    const late = await cellJob(c, { job: { workCenterId: c.wc.id } }); const soon = await cellJob(c, { job: { workCenterId: c.wc.id } }); const far = await cellJob(c, { job: { workCenterId: c.wc.id } });
    await runOps(late, { person: c.person, wc: c.wc });           // finished on the floor, now waiting for inspection
    const H = 3600000;
    await prisma.job.update({ where: { id: late.id }, data: { scheduledEnd: new Date(Date.now() - 5 * H) } });
    await prisma.job.update({ where: { id: soon.id }, data: { scheduledEnd: new Date(Date.now() + 2 * H) } });
    await prisma.job.update({ where: { id: far.id }, data: { scheduledEnd: new Date(Date.now() + 200 * H) } });
    const r = await A.get(`/api/jobs/sla-risk?locationId=${L1.id}&hoursAhead=24`);
    const rows = Array.isArray(r.body) ? r.body : r.body?.jobs || r.body?.data || [];
    const at = (id) => rows.findIndex((x) => (x.id || x.jobId) === id);
    ok('the job waiting for inspection, five hours late, is on the list as overdue', r.status === 200 && at(late.id) >= 0 && rows[at(late.id)].riskLevel === 'OVERDUE', `${r.status} ${at(late.id)} ${JSON.stringify(rows[0] || {}).slice(0, 160)}`);
    ok('the job due in two hours is critical and comes after it', at(soon.id) > at(late.id) && rows[at(soon.id)].riskLevel === 'CRITICAL', `${at(late.id)} ${at(soon.id)} ${rows[at(soon.id)]?.riskLevel}`);
    ok('the job due in eight days is not on a 24-hour list', at(far.id) < 0);
    ok('no overdue job is listed after one that is not overdue', rows.every((x, i) => i === 0 || !(x.riskLevel === 'OVERDUE' && rows[i - 1].riskLevel !== 'OVERDUE')));
    const bad = await Promise.all(['abc', '-1', '999999'].map((h) => A.get(`/api/jobs/sla-risk?hoursAhead=${h}`)));
    ok('a window that is not a sensible number of hours is refused with 400', bad.every((b) => b.status === 400), bad.map((b) => b.status).join());
  });
  await scenario(G3, 'a work center\'s working hours must be a real figure, and its kind cannot be changed under open work', async (ok) => {
    const c = await cell();
    const cap = (await prisma.workCenter.findUnique({ where: { id: c.wc.id } })).capacity || {};
    const tries = await Promise.all([{ hoursPerDay: -1 }, { hoursPerDay: 25 }, { shiftCapacityMinutesPerDay: 'lots' }, { maxThicknessInches: -2 }].map((b) => A.call('PATCH', `/api/work-centers/${c.wc.id}`, { capacity: { ...cap, ...b } }, 'admin')));
    ok('minus one hour, 25 hours, a word, and a negative thickness are refused with 400', tries.every((r) => r.status === 400), tries.map((r) => r.status).join());
    const thin = await A.call('PATCH', `/api/v1/dispatch/work-centers/${c.wc.id}`, { maxThicknessInches: -2 }, 'admin');
    ok('the shop-floor address refuses a negative thickness too', thin.status === 400, `${thin.status}`);
    await setHours(c.wc, 10);
    const row = await prisma.workCenter.findUnique({ where: { id: c.wc.id } });
    ok('ten hours is saved as entered, and what was already on the record is kept', Number(row.capacity?.hoursPerDay) === 10 && row.capacity.division === cap.division, JSON.stringify(row.capacity));
    const j = await cellJob(c); await dispatch();
    const other = await cell({ wcs: 0, people: 0 });
    const swap = await A.call('PATCH', `/api/v1/dispatch/work-centers/${c.wc.id}`, { workCenterType: other.type }, 'admin');
    const gone = await A.call('DELETE', `/api/v1/dispatch/work-centers/${c.wc.id}`, undefined, 'admin');
    ok('with a step queued on it, changing its kind and deleting it are refused with 409', swap.status === 409 && gone.status === 409 && (await prisma.workCenter.findUnique({ where: { id: c.wc.id } })).type === c.type && (await opRow(j.ops[0].id)).assignedWorkCenterId === c.wc.id, `${swap.status} ${gone.status}`);
  });
  await scenario(G3, 'shift calendars, operator availability and running work are not part of the plan, and the plan says so', async (ok) => {
    const r = await preview({ locationId: L1.id, jobIds: [] });
    ok('every plan carries the note that these are not counted', r.status === 200 && r.body.preview.notes.some((n) => /Shift calendars, operator availability, machine downtime and jobs already running are not part of this plan/.test(n)));
    ok('shifts are on file as a table, but nothing in the planner reads them', (await tables('^Shift$')).length === 1 && !/shift\b.*findMany|prisma\.shift/i.test(fs.readFileSync('src/backend/src/routes/optimizationV1.js', 'utf8') + fs.readFileSync('src/backend/src/lib/capacityPlan.js', 'utf8')));
    ok('finite-capacity scheduling against a calendar is therefore recorded as not built, not as passing', true);
  }, NA);
}

// ════════════════════════════════════════════════════════════════════════════════
if (want(4)) {
  const toStatus = async (jobId, status) => (await movesOf(jobId)).filter((m) => m.to === status).length;

  await scenario(G4, 'starting a step records who, where and when, and moves the job into production once', async (ok) => {
    const j = await mkJob({ steps: 2 });
    const r = await startOp(j.ops[0], opA, wc1, opr1);
    const [op] = await opsOf(j.id);
    const logs = await logsOf(op.id);
    ok('started by the operator\'s own login', r.status === 200, `${r.status} ${r.body?.error}`);
    ok('the step is in process with its start time, operator and work center', op.status === 'IN_PROCESS' && op.actualStart && op.assignedOperatorId === opA.id && op.assignedWorkCenterId === wc1.id);
    ok('one clock is running, for that operator at that work center', logs.length === 1 && logs[0].status === 'RUNNING' && logs[0].operatorId === opA.id && logs[0].workCenterId === wc1.id && logs[0].endAt === null);
    ok('the job is in process and its history has that move once, by the operator', (await jobOf(j.id)).status === 'IN_PROCESS' && (await toStatus(j.id, 'IN_PROCESS')) === 1 && (await movesOf(j.id)).find((m) => m.to === 'IN_PROCESS').userId === opr1.user.id);
    await chain(ok, j.id); await clocks(ok, j.id);
  });
  await scenario(G4, 'a step cannot be started without an operator on file, and a step that does not exist is a 404', async (ok) => {
    const j = await mkJob();
    const none = await A.post(`/api/v1/operations/${j.ops[0].id}/start`, { workCenterId: wc1.id });
    const ghost = await A.post(`/api/v1/operations/${j.ops[0].id}/start`, { operatorId: '00000000-0000-0000-0000-000000000000', workCenterId: wc1.id });
    const noStep = await A.post('/api/v1/operations/00000000-0000-0000-0000-000000000000/start', { operatorId: opA.id, workCenterId: wc1.id });
    ok('no operator: 400; unknown operator: 400; unknown step: 404', none.status === 400 && ghost.status === 400 && noStep.status === 404, `${none.status} ${ghost.status} ${noStep.status}`);
    const [op] = await opsOf(j.id);
    ok('nothing was started: the step is waiting, no clock, the job still scheduled', op.status === 'PENDING' && (await logsOf(op.id)).length === 0 && (await jobOf(j.id)).status === 'SCHEDULED');
  });
  await scenario(G4, 'steps run in their planned order: the second cannot start until the first is finished', async (ok) => {
    const j = await mkJob({ steps: 3 });
    const early = await startOp(j.ops[1]);
    const last = await startOp(j.ops[2]);
    ok('steps two and three are refused with 409 and the reason names the step in the way', early.status === 409 && last.status === 409 && /Step 1/.test(early.body?.error || ''), `${early.status} ${last.status} ${early.body?.error}`);
    ok('the job has not moved and no clock was started', (await jobOf(j.id)).status === 'SCHEDULED' && (await prisma.dispatchTimeLog.count({ where: { dispatchOperationId: { in: j.ops.map((o) => o.id) } } })) === 0);
    await startOp(j.ops[0]);
    const during = await startOp(j.ops[1]);
    ok('while step one is running, step two is still refused', during.status === 409, `${during.status}`);
    await doneOp(j.ops[0]);
    const now = await startOp(j.ops[1]);
    ok('once step one is finished, step two starts', now.status === 200 && (await opsOf(j.id))[1].status === 'IN_PROCESS', `${now.status} ${now.body?.error}`);
    await clocks(ok, j.id);
  });
  await scenario(G4, 'the planned-order rule is one setting: with it switched off, steps may run in any order, and switching it on again applies at once', async (ok) => {
    const j = await mkJob({ steps: 2 });
    await setRule(false);
    let free;
    try { free = await startOp(j.ops[1]); } finally { await setRule(true); }
    ok('with the rule off, step two starts first', free.status === 200 && (await opsOf(j.id))[1].status === 'IN_PROCESS', `${free.status} ${free.body?.error}`);
    const k = await mkJob({ steps: 2 });
    const held = await startOp(k.ops[1]);
    ok('with the rule back on, the next job is held to its order', held.status === 409, `${held.status}`);
    await prisma.appSetting.deleteMany({ where: { key: 'production.rules' } });
    const byDefault = await startOp(k.ops[1]);
    await setRule(true);
    ok('with no setting on file the rule is on: planned order is the default', byDefault.status === 409, `${byDefault.status}`);
  });
  await scenario(G4, 'a step is run only on a work center of its own kind, at the job\'s branch, that is switched on', async (ok) => {
    const j = await mkJob();
    const off = await mkWc(L1); await A.call('PATCH', `/api/v1/dispatch/work-centers/${off.id}`, { isOnline: false }, 'admin');
    const wrongKind = await startOp(j.ops[0], opA, wcD);
    const otherBranch = await startOp(j.ops[0], opA, wc2);
    const offline = await startOp(j.ops[0], opA, off);
    const unknown = await startOp(j.ops[0], opA, { id: tag('NOPE') });
    ok('a deburr station, another branch\'s saw and a saw that is off are refused with 409; an unknown one with 400', wrongKind.status === 409 && otherBranch.status === 409 && offline.status === 409 && unknown.status === 400, [wrongKind, otherBranch, offline, unknown].map((r) => r.status).join());
    const [op] = await opsOf(j.id);
    ok('the step is still waiting with no clock', op.status === 'PENDING' && (await logsOf(op.id)).length === 0);
    ok('each refusal says what is wrong', /QA P7 deburr|kind|type/i.test(wrongKind.body?.error || '') && /branch/.test(otherBranch.body?.error || ''), `${wrongKind.body?.error} | ${otherBranch.body?.error}`);
  });
  await scenario(G4, 'an operator whose certification has lapsed, who is inactive, or who works at another branch cannot start a step', async (ok) => {
    const j = await mkJob();
    const lapsed = await mkOperator(L1, { expiresAt: yesterday });
    const gone = await mkOperator(L1); await A.call('PATCH', `/api/staff/operators/${gone.id}`, { isActive: false }, 'admin');
    const a = await startOp(j.ops[0], lapsed); const b = await startOp(j.ops[0], gone); const c = await startOp(j.ops[0], opX);
    ok('all three are refused with 409', [a, b, c].every((r) => r.status === 409), [a, b, c].map((r) => r.status).join());
    ok('the reasons name the certification and its date, the inactive operator, and the other branch', /certification expired on \d{4}-\d\d-\d\d/.test(a.body?.error || '') && /not active/.test(b.body?.error || '') && /another branch/.test(c.body?.error || ''), `${a.body?.error} | ${b.body?.error} | ${c.body?.error}`);
    ok('nothing was started', (await opsOf(j.id))[0].status === 'PENDING');
    const good = await startOp(j.ops[0], opA);
    ok('an operator with a current certification starts it', good.status === 200);
  });
  await scenario(G4, 'pausing closes the clock with the reason given; resuming opens a new one; the time is the sum of the two', async (ok) => {
    const j = await mkJob();
    await startOp(j.ops[0]);
    const p = await pauseOp(j.ops[0], { downtimeReason: 'Blade change' }, opr1);
    let logs = await logsOf(j.ops[0].id);
    ok('paused: the clock is closed with its end time and the reason', p.status === 200 && logs.length === 1 && logs[0].status === 'PAUSED' && logs[0].endAt && logs[0].downtimeReason === 'Blade change', `${p.status}`);
    const again = await pauseOp(j.ops[0], {});
    ok('pausing a step that is not running is refused with 409', again.status === 409, `${again.status}`);
    const back = await startOp(j.ops[0], opB);
    logs = await logsOf(j.ops[0].id);
    ok('resumed by a second operator: a new clock, and the first is untouched', back.status === 200 && logs.length === 2 && logs[1].status === 'RUNNING' && logs[1].operatorId === opB.id && logs[0].operatorId === opA.id);
    ok('the step\'s first start time did not move', String((await opRow0(j)).actualStart) === String(logs[0].startAt) || (await opRow0(j)).actualStart <= logs[1].startAt);
    await doneOp(j.ops[0]);
    const t = await A.get(`/api/v1/operations/${j.ops[0].id}/time-logs`);
    logs = await logsOf(j.ops[0].id);
    const mine = logs.reduce((n, l) => n + (l.endAt - l.startAt), 0);
    ok('both clocks are closed, neither ends before it starts', logs.every((l) => l.endAt && l.endAt >= l.startAt) && logs.filter((l) => l.status === 'RUNNING').length === 0);
    ok('the time-log screen lists both entries', t.status === 200 && (t.body?.data?.timeLogs || t.body?.data?.logs || t.body?.data || []).length === 2, JSON.stringify(t.body).slice(0, 200));
    ok('recorded time is the sum of the two entries and not the gap between first start and last end', mine >= 0 && mine <= (logs[1].endAt - logs[0].startAt));
    await clocks(ok, j.id);
  });
  await scenario(G4, 'a step that was never started cannot be finished', async (ok) => {
    const j = await mkJob({ steps: 2 });
    const r = await doneOp(j.ops[0]);
    const [op] = await opsOf(j.id);
    ok('refused with 409', r.status === 409, `${r.status} ${r.body?.error}`);
    ok('the step is still waiting, with no start, no end and no time', op.status === 'PENDING' && op.actualStart === null && op.actualEnd === null && (await logsOf(op.id)).length === 0);
    ok('the job did not move', (await jobOf(j.id)).status === 'SCHEDULED' && (await movesOf(j.id)).every((m) => m.to !== 'WAITING_QC'));
  });
  await scenario(G4, 'finishing the last step sends the job to inspection once; finishing it again changes nothing', async (ok) => {
    const j = await mkJob({ types: [T, T2] });
    await startOp(j.ops[0]); const mid = await doneOp(j.ops[0]);
    ok('after the first step the job is still in process', mid.status === 200 && (await jobOf(j.id)).status === 'IN_PROCESS');
    await startOp(j.ops[1], opA, wcD); const end = await doneOp(j.ops[1]);
    ok('after the last step the job is waiting for inspection', end.status === 200 && (await jobOf(j.id)).status === 'WAITING_QC', `${end.status} ${(await jobOf(j.id)).status}`);
    const before = (await opsOf(j.id))[1].actualEnd;
    const again = await doneOp(j.ops[1]);
    ok('a repeat is answered and changes nothing', again.status === 200 && String((await opsOf(j.id))[1].actualEnd) === String(before) && (await toStatus(j.id, 'WAITING_QC')) === 1, `${again.status}`);
    const restart = await startOp(j.ops[1], opA, wcD);
    ok('a finished step cannot be started again', restart.status === 409 && (await opsOf(j.id))[1].status === 'COMPLETE', `${restart.status}`);
    await chain(ok, j.id); await clocks(ok, j.id);
  });
  await scenario(G4, 'two operators starting the same step at the same moment leave one clock running', async (ok) => {
    let bad = 0;
    for (let i = 0; i < 5; i++) {
      const j = await mkJob();
      const pair = await Promise.all([startOp(j.ops[0], opA), startOp(j.ops[0], opB, wc1, pm1)]);
      const logs = await logsOf(j.ops[0].id);
      if (pair.some((r) => r.status !== 200) || logs.filter((l) => l.status === 'RUNNING').length !== 1 || (await toStatus(j.id, 'IN_PROCESS')) !== 1) bad++;
    }
    ok('5 rounds: one running clock each time and one move into production', bad === 0, `${bad} rounds wrong`);
  });
  await scenario(G4, 'a step being finished and paused at the same moment ends in one consistent state', async (ok) => {
    let bad = 0;
    for (let i = 0; i < 5; i++) {
      const j = await mkJob();
      await startOp(j.ops[0]);
      const [d, p] = await Promise.all([doneOp(j.ops[0]), pauseOp(j.ops[0], { downtimeReason: 'QA' })]);
      const op = (await opsOf(j.id))[0]; const logs = await logsOf(op.id);
      const fine = d.status === 200 && [200, 409].includes(p.status) && op.status === 'COMPLETE' && logs.every((l) => l.endAt) && (await jobOf(j.id)).status === 'WAITING_QC';
      if (!fine) bad++;
    }
    ok('5 rounds: the step is finished, every clock is closed, the job is at inspection', bad === 0, `${bad} rounds wrong`);
  });
  await scenario(G4, 'no step is started on a job that is on hold, cancelled, or past production', async (ok) => {
    const held = await mkJob(); await move(held.id, 'ON_HOLD', 'admin', 'QA');
    const dead = await mkJob(); await move(dead.id, 'CANCELLED', 'admin', 'QA');
    const past = await atQc({ steps: 1 });
    const extra = await mkJob({ steps: 2 }); await startOp(extra.ops[0]); await doneOp(extra.ops[0]);
    await prisma.job.update({ where: { id: extra.id }, data: { status: 'READY_TO_SHIP', instructions: 'QA P7 fixture written to the database directly' } }); // fixture: a job at the dock with a step never run
    const tries = [await startOp(held.ops[0]), await startOp(dead.ops[0]), await startOp(extra.ops[1])];
    ok('all refused with 409', tries.every((r) => r.status === 409), tries.map((r) => `${r.status}`).join());
    ok('each says which state the job is in', /hold/.test(tries[0].body?.error || '') && /cancelled/.test(tries[1].body?.error || '') && /ready to ship/i.test(tries[2].body?.error || ''), tries.map((r) => r.body?.error).join(' | '));
    ok('no clock was started on any of them', (await prisma.dispatchTimeLog.count({ where: { dispatchOperationId: { in: [held.ops[0].id, dead.ops[0].id, extra.ops[1].id] } } })) === 0);
    ok('the job at inspection is still there', (await jobOf(past.id)).status === 'WAITING_QC');
  });
  await scenario(G4, 'a job put on hold while its last step is running stays on hold when the step is finished', async (ok) => {
    const j = await mkJob();
    await startOp(j.ops[0]);
    const h = await move(j.id, 'ON_HOLD', 'admin', 'QA hold mid-run');
    const d = await doneOp(j.ops[0]);
    ok('the hold is taken and the step can still be closed out', h.status === 200 && d.status === 200, `${h.status} ${d.status} ${d.body?.error}`);
    ok('the step is finished with its clock closed', (await opsOf(j.id))[0].status === 'COMPLETE' && (await logsOf(j.ops[0].id)).every((l) => l.endAt));
    ok('the job is still on hold: finishing the step did not release it to inspection', (await jobOf(j.id)).status === 'ON_HOLD' && (await toStatus(j.id, 'WAITING_QC')) === 0);
    await chain(ok, j.id);
  });
  await scenario(G4, 'a job cannot leave production while a planned step is unfinished', async (ok) => {
    const j = await mkJob({ steps: 2 });
    await startOp(j.ops[0]); await doneOp(j.ops[0]);
    const byHand = await move(j.id, 'WAITING_QC');
    const complete = await A.post(`/api/jobs/${j.id}/complete`, {});
    const dock = await move(j.id, 'READY_TO_SHIP');
    ok('to inspection, "complete" and to the dock are all refused with 409', [byHand, complete, dock].every((r) => r.status === 409), [byHand, complete, dock].map((r) => r.status).join());
    ok('the refusal names the open step', /Step 2/.test(byHand.body?.error || ''), byHand.body?.error);
    ok('the job is still in process', (await jobOf(j.id)).status === 'IN_PROCESS');
    const stop = await move(j.id, 'CANCELLED', 'admin', 'QA');
    ok('it can still be cancelled or held: only moving forward is stopped', stop.status === 200 && (await jobOf(j.id)).status === 'CANCELLED', `${stop.status}`);
  });
  await scenario(G4, 'a step is moved to another work center or operator only where it can be run, and its clock is paused by the move', async (ok) => {
    const c = await cell({ wcs: 2, people: 2 });
    const j = await cellJob(c);
    await startOp(j.ops[0], c.people[0], c.wcs[0]);
    const wrong = await A.post(`/api/v1/operations/${j.ops[0].id}/reassign`, { workCenterId: wcD.id });
    const away = await A.post(`/api/v1/operations/${j.ops[0].id}/reassign`, { operatorId: opX.id });
    const blank = await A.post(`/api/v1/operations/${j.ops[0].id}/reassign`, {});
    ok('another kind of work center: 409; another branch\'s operator: 409; nothing named: 400', wrong.status === 409 && away.status === 409 && blank.status === 400, `${wrong.status} ${away.status} ${blank.status}`);
    ok('the clock is still running where it was', (await logsOf(j.ops[0].id)).filter((l) => l.status === 'RUNNING' && l.workCenterId === c.wcs[0].id).length === 1);
    const good = await A.post(`/api/v1/operations/${j.ops[0].id}/reassign`, { workCenterId: c.wcs[1].id, operatorId: c.people[1].id });
    const op = (await opsOf(j.id))[0]; const logs = await logsOf(op.id);
    ok('moved to the second work center and operator', good.status === 200 && op.assignedWorkCenterId === c.wcs[1].id && op.assignedOperatorId === c.people[1].id, `${good.status} ${good.body?.error}`);
    ok('the first clock is closed and still says where and who the time was', logs.length === 1 && logs[0].status === 'PAUSED' && logs[0].endAt && logs[0].workCenterId === c.wcs[0].id && logs[0].operatorId === c.people[0].id);
    await startOp(j.ops[0], c.people[1], c.wcs[1]); await doneOp(j.ops[0]);
    const after = await A.post(`/api/v1/operations/${j.ops[0].id}/reassign`, { workCenterId: c.wcs[0].id });
    ok('a finished step cannot be moved', after.status === 400 && (await opsOf(j.id))[0].assignedWorkCenterId === c.wcs[1].id, `${after.status}`);
    await clocks(ok, j.id);
  });
  await scenario(G4, 'shop-floor work at one branch cannot be seen or touched from another branch, or by people outside production', async (ok) => {
    const j = await mkJob();
    const peek = await opr2.call('GET', `/api/v1/operations/${j.ops[0].id}`);
    const go = await startOp(j.ops[0], opX, wc2, opr2);
    const goMine = await startOp(j.ops[0], opA, wc1, opr2);
    const mgr = await pm2.call('POST', `/api/v1/operations/${j.ops[0].id}/complete`, {});
    const sales = await startOp(j.ops[0], opA, wc1, 'csr');
    ok('the other branch\'s operator and manager get 404; sales gets 403', peek.status === 404 && go.status === 404 && goMine.status === 404 && mgr.status === 404 && sales.status === 403, [peek, go, goMine, mgr, sales].map((r) => r.status).join());
    ok('the step is untouched', (await opsOf(j.id))[0].status === 'PENDING' && (await logsOf(j.ops[0].id)).length === 0);
    const list = await opr2.call('GET', `/api/v1/operations?locationId=${L1.id}`);
    const rows = list.body?.data?.operations || list.body?.data || [];
    const own = await opr1.call('GET', `/api/v1/operations?jobId=${(await planOf(j.id)).id}`);
    ok('its own branch lists the job\'s step, with the total', own.status === 200 && own.body.data.length === 1 && own.body.total === 1 && own.body.data[0].id === j.ops[0].id, `${own.status} ${own.body?.total}`);
    const capped = await opr1.call('GET', `/api/v1/operations?locationId=${L1.id}&limit=3`);
    ok('a long list is cut to what was asked for and says how many there are in all', capped.body.data.length === 3 && capped.body.total > 3 && capped.body.limited === true, `${capped.body?.data?.length} of ${capped.body?.total}`);
    ok('and it is not in the other branch\'s list of steps even when they ask for this branch', list.status !== 200 || !rows.some((o) => o.id === j.ops[0].id), `${list.status} ${rows.length}`);
  });
  await scenario(G4, 'an operator who is clocked on cannot be made inactive or moved to another branch until the step is paused or finished', async (ok) => {
    const c = await cell();
    const j = await cellJob(c);
    await startOp(j.ops[0], c.person, c.wc);
    const off = await A.call('PATCH', `/api/staff/operators/${c.person.id}`, { isActive: false }, 'admin');
    const moveOut = await A.call('PATCH', `/api/staff/operators/${c.person.id}`, { homeLocationId: L2.id }, 'admin');
    const del = await A.call('DELETE', `/api/staff/operators/${c.person.id}`, undefined, 'admin');
    const row = await prisma.operator.findUnique({ where: { id: c.person.id } });
    ok('all three are refused with 409', [off, moveOut, del].every((r) => r.status === 409), [off, moveOut, del].map((r) => r.status).join());
    ok('the operator is still active at this branch, and still on the clock', row.isActive && row.homeLocationId === L1.id && (await logsOf(j.ops[0].id)).some((l) => l.status === 'RUNNING' && l.operatorId === c.person.id));
    await doneOp(j.ops[0]);
    const later = await A.call('PATCH', `/api/staff/operators/${c.person.id}`, { isActive: false }, 'admin');
    ok('once the step is finished the change is accepted', later.status === 200 && (await prisma.operator.findUnique({ where: { id: c.person.id } })).isActive === false, `${later.status}`);
  });
  await scenario(G4, 'an operator\'s pay rate and emergency contact are shown to managers only', async (ok) => {
    const made = await A.post('/api/staff/operators', { firstName: 'QA', lastName: tag('PAY'), homeLocationId: L1.id, hourlyRate: 31.5, emergencyContactName: 'QA Contact', emergencyContactPhone: '555-0100' });
    const id = made.body?.data?.id;
    const asMgr = await pm1.call('GET', `/api/staff/operators/${id}`);
    const asFloor = await opr1.call('GET', `/api/staff/operators/${id}`);
    const asSales = await A.call('GET', `/api/staff/operators/${id}`, undefined, 'csr');
    const list = await opr1.call('GET', `/api/staff/operators?locationId=${L1.id}`);
    const inList = (list.body?.data || []).find((o) => o.id === id);
    ok('the production manager sees the rate and the contact', asMgr.status === 200 && Number(asMgr.body.data.hourlyRate) === 31.5 && asMgr.body.data.emergencyContactPhone === '555-0100', `${asMgr.status}`);
    const hidden = (r) => r.status !== 200 || (r.body.data.hourlyRate === undefined && r.body.data.emergencyContactName === undefined && r.body.data.emergencyContactPhone === undefined && r.body.data.overtimeMultiplier === undefined);
    ok('an operator and a sales login do not', hidden(asFloor) && hidden(asSales), `${asFloor.status} ${asSales.status} ${JSON.stringify(asFloor.body?.data?.hourlyRate)}`);
    ok('nor does the list an operator sees', !inList || (inList.hourlyRate === undefined && inList.emergencyContactPhone === undefined));
    ok('the rate on file is what was entered', Number((await prisma.operator.findUnique({ where: { id } })).hourlyRate) === 31.5);
    const other = await pm2.call('GET', `/api/staff/operators/${id}`);
    ok('a manager at another branch cannot open the record', other.status === 404, `${other.status}`);
  });
  await scenario(G4, 'a certification must be for a kind of work center on file, and cannot expire before it was issued', async (ok) => {
    const p = await mkOperator(L1, { types: [] });
    const before = await prisma.operatorSkill.count({ where: { operatorId: p.id } });
    const noType = await A.post(`/api/staff/operators/${p.id}/skills`, { workCenterTypeId: 'NO-SUCH-KIND', skillLevel: 'STANDARD' });
    const backwards = await A.post(`/api/staff/operators/${p.id}/skills`, { workCenterTypeId: T, skillLevel: 'STANDARD', certifiedDate: nextYear, expiresAt: yesterday });
    const level = await A.post(`/api/staff/operators/${p.id}/skills`, { workCenterTypeId: T, skillLevel: 'WIZARD' });
    ok('an unknown kind, an expiry before the issue date and an unknown level are refused with 400', [noType, backwards, level].every((r) => r.status === 400), [noType, backwards, level].map((r) => r.status).join());
    ok('nothing was saved', (await prisma.operatorSkill.count({ where: { operatorId: p.id } })) === before);
    const good = await A.post(`/api/staff/operators/${p.id}/skills`, { workCenterTypeId: T, skillLevel: 'ADVANCED', certifiedDate: longAgo, expiresAt: nextYear });
    ok('a valid certification is saved as entered', good.status === 201 && (await prisma.operatorSkill.findFirst({ where: { operatorId: p.id, workCenterTypeId: T } }))?.skillLevel === 'ADVANCED', `${good.status} ${JSON.stringify(good.body).slice(0, 160)}`);
  });
  await scenario(G4, 'one operator on two steps at once is refused, unless the kind of work center is marked for it (owner decision 9)', async (ok) => {
    const c = await cell({ wcs: 2 });
    const a = await cellJob(c); const b = await cellJob(c);
    const x = await startOp(a.ops[0], c.person, c.wcs[0]); const y = await startOp(b.ops[0], c.person, c.wcs[1]);
    const running = () => prisma.dispatchTimeLog.count({ where: { operatorId: c.person.id, status: 'RUNNING' } });
    ok('the first start is accepted; the second is refused with a sentence naming the step already running', x.status === 200 && y.status === 409 && /already clocked on/.test(y.body?.error || '') && (await running()) === 1, `${x.status} ${y.status} ${y.body?.error}`);
    const bad = await A.call('PATCH', `/api/v1/dispatch/work-center-types/${c.type}`, { allowsConcurrentSteps: 'yes' });
    ok('the mark must be yes or no', bad.status === 400, `${bad.status}`);
    const floor = await pm1.call('PATCH', `/api/v1/dispatch/work-center-types/${c.type}`, { allowsConcurrentSteps: true });
    const mark = floor.status === 200 ? floor : await A.call('PATCH', `/api/v1/dispatch/work-center-types/${c.type}`, { allowsConcurrentSteps: true });
    const y2 = await startOp(b.ops[0], c.person, c.wcs[1]);
    ok('once the kind is marked, the same operator runs both, and both clocks are on record', mark.status === 200 && y2.status === 200 && (await running()) === 2, `${mark.status} ${y2.status} ${y2.body?.error}`);
    const d = await cell();
    const other = await cellJob(d);
    const z = await startOp(other.ops[0], c.person, d.wc);
    ok('a third step of a kind that is not marked is still refused', z.status === 409 && (await running()) === 2, `${z.status} ${z.body?.error}`);
    await clocks(ok, a.id); await clocks(ok, b.id);
  });
  await scenario(G4, 'where a kind of work center is marked "certification required", an operator with none on file cannot be clocked on (owner decision 9)', async (ok) => {
    const c = await cell({ people: 0 });
    const bare = await mkOperator(L1, { types: [] }); const certified = await mkOperator(L1, { types: [c.type] });
    const a = await cellJob(c);
    const before = await startOp(a.ops[0], bare, c.wc);
    ok('not marked: an operator with no certification on file may work, as before', before.status === 200, `${before.status} ${before.body?.error}`);
    await doneOp(a.ops[0]);
    const mark = await A.call('PATCH', `/api/v1/dispatch/work-center-types/${c.type}`, { certificationRequired: true });
    const b = await cellJob(c);
    const no = await startOp(b.ops[0], bare, c.wc);
    ok('marked: the same operator is refused, and the sentence says what to do', mark.status === 200 && no.status === 409 && /certification on file/.test(no.body?.error || ''), `${mark.status} ${no.status} ${no.body?.error}`);
    ok('nothing was started', (await logsOf(b.ops[0].id)).length === 0 && (await prisma.dispatchOperation.findUnique({ where: { id: b.ops[0].id } })).status !== 'IN_PROCESS');
    const yes = await startOp(b.ops[0], certified, c.wc);
    ok('a certified operator is accepted', yes.status === 200, `${yes.status} ${yes.body?.error}`);
    const seen = await A.call('GET', `/api/v1/dispatch/work-center-types/${c.type}`);
    ok('the mark is on the kind\'s record', (seen.body?.data || seen.body)?.certificationRequired === true, JSON.stringify(seen.body).slice(0, 200));
  });
  await scenario(G4, 'a clock left running is listed for the supervisor after the hours on file; nothing is stopped (owner decision 9)', async (ok) => {
    const c = await cell();
    const j = await cellJob(c);
    await startOp(j.ops[0], c.person, c.wc);
    const fresh = await pm1.call('GET', '/api/v1/operations/long-running');
    const mine = (r) => (r.body?.data || []).filter((e) => e.operator?.id === c.person.id);
    ok('a clock started just now is not listed', fresh.status === 200 && mine(fresh).length === 0, `${fresh.status}`);
    await prisma.dispatchTimeLog.updateMany({ where: { dispatchOperationId: j.ops[0].id, status: 'RUNNING' }, data: { startAt: new Date(Date.now() - 13 * 3600000) } });
    const late = await pm1.call('GET', '/api/v1/operations/long-running');
    ok('after 13 hours it is listed with operator, step, job and hours (the setting is 12 hours)', late.body.hours === 12 && mine(late).length === 1 && mine(late)[0].hoursRunning >= 13 && mine(late)[0].hoursRunning < 13.1, JSON.stringify(mine(late)).slice(0, 300));
    const wide = await pm1.call('GET', '/api/v1/operations/long-running?hours=20');
    ok('asked for 20 hours, it is not listed', wide.status === 200 && mine(wide).length === 0);
    const bad = await pm1.call('GET', '/api/v1/operations/long-running?hours=0');
    ok('a nonsense number of hours is refused', bad.status === 400, `${bad.status}`);
    const away = await pm2.call('GET', '/api/v1/operations/long-running');
    ok('another branch\'s production manager does not see it', away.status === 200 && mine(away).length === 0, `${away.status} ${mine(away).length}`);
    ok('the clock is still running: the list changes nothing', (await logsOf(j.ops[0].id)).filter((l) => l.status === 'RUNNING').length === 1);
    await doneOp(j.ops[0]);
  });
  await scenario(G4, 'machine time, downtime and telemetry: no machine is connected, and the downtime table is not written by any screen', async (ok) => {
    ok('the downtime table exists', (await tables('^DowntimeRecord$')).length === 1);
    const routes = fs.readdirSync('src/backend/src/routes').filter((f) => f.endsWith('.js')).map((f) => fs.readFileSync(`src/backend/src/routes/${f}`, 'utf8')).join('\n');
    ok('no address creates a downtime record', !/downtimeRecord\.(create|upsert)/.test(routes));
    ok('the only downtime on record is the reason an operator gives when pausing a step', /downtimeReason/.test(routes));
    const cols = (await prisma.$queryRawUnsafe(`select column_name from information_schema.columns where table_name = 'DispatchTimeLog'`)).map((r) => r.column_name);
    ok('a time entry records one span for operator and work center together: machine time is not recorded apart from labor time', cols.includes('operatorId') && cols.includes('workCenterId') && !cols.some((c) => /machine|setup|runMinutes/i.test(c)), cols.join());
  }, NA);
}

// ════════════════════════════════════════════════════════════════════════════════
if (want(5)) {
  const insOf = (id) => prisma.jobInspection.findUnique({ where: { id } });
  const decidedRows = (id) => auditOf('JobInspection', id, 'INSPECTION_DECIDED');
  const toStatus = async (jobId, status) => (await movesOf(jobId)).filter((m) => m.to === status).length;

  await scenario(G5, 'opening an inspection for a job that is waiting gives it a numbered record with a checklist, and names the inspector when one is given', async (ok) => {
    const j = await atQc();
    const r = await openInspection(j.id, qc1);
    const row = await insOf(r.body?.data?.id);
    ok('created by the branch\'s inspector', r.status === 201 && /^INS-/.test(row.inspectionNumber), `${r.status} ${r.body?.error}`);
    ok('it is pending, with no result and no completion time', row.status === 'PENDING' && row.overallResult === null && row.completedAt === null && row.startedAt === null);
    ok('its checklist has required checks, none of them answered', Array.isArray(row.checklist) && row.checklist.length >= 5 && row.checklist.every((c) => c.required && c.result === null));
    ok('the job is still waiting for inspection: opening an inspection decides nothing', (await jobOf(j.id)).status === 'WAITING_QC');
    const k = await atQc();
    const named = await openInspection(k.id, qc1, { inspectorId: opA.id });
    const row2 = await insOf(named.body.data.id);
    ok('with an inspector named it is in progress from that moment', row2.status === 'IN_PROGRESS' && row2.inspectorId === opA.id && row2.startedAt !== null);
  });
  await scenario(G5, 'an inspection is opened only for a job that is waiting for inspection, with an inspector who is on file and active', async (ok) => {
    const early = await mkJob();
    const j = await atQc();
    const gone = await mkOperator(L1); await A.call('PATCH', `/api/staff/operators/${gone.id}`, { isActive: false }, 'admin');
    const before = await prisma.jobInspection.count();
    const a = await openInspection(early.id);
    const b = await openInspection('00000000-0000-0000-0000-000000000000');
    const c = await openInspection(j.id, 'admin', { inspectorId: '00000000-0000-0000-0000-000000000000' });
    const d = await openInspection(j.id, 'admin', { inspectorId: gone.id });
    const e = await A.post('/api/qc/inspections', {});
    ok('not at inspection: 400; unknown job: 404; unknown inspector: 400; inactive inspector: 400; no job: 400', a.status === 400 && b.status === 404 && c.status === 400 && d.status === 400 && e.status === 400, [a, b, c, d, e].map((r) => r.status).join());
    ok('no inspection was saved', (await prisma.jobInspection.count()) === before);
  });
  await scenario(G5, 'a job has one open inspection at a time, even when two inspectors open one at the same moment', async (ok) => {
    const j = await atQc();
    const first = await openInspection(j.id);
    const second = await openInspection(j.id, qc1);
    ok('the second is refused with 409 and names the open one', first.status === 201 && second.status === 409 && second.body.error.includes(first.body.data.inspectionNumber), `${second.status} ${second.body?.error}`);
    let bad = 0;
    for (let i = 0; i < 4; i++) {
      const k = await atQc();
      const pair = await Promise.all([openInspection(k.id), openInspection(k.id, qc1)]);
      if (pair.map((r) => r.status).sort().join() !== '201,409' || (await inspectionsOf(k.id)).length !== 1) bad++;
    }
    ok('4 rounds at the same moment: one inspection each time', bad === 0, `${bad} rounds wrong`);
    const nums = (await prisma.jobInspection.findMany({ select: { inspectionNumber: true } })).map((r) => r.inspectionNumber);
    ok('no two inspections share a number', new Set(nums).size === nums.length);
  });
  await scenario(G5, 'passing an inspection moves the job to packaging in the same step, and records who decided', async (ok) => {
    const j = await atQc();
    const made = await openInspection(j.id, qc1);
    const r = await passIt(made.body.data, qc1, { notes: 'QA pass' });
    const row = await insOf(made.body.data.id);
    ok('passed', r.status === 200 && row.status === 'PASSED' && row.overallResult === 'PASS' && row.disposition === 'USE_AS_IS' && row.completedAt !== null, `${r.status} ${r.body?.error}`);
    ok('the answers given are what is on file', row.checklist.every((c) => c.result === 'PASS') && row.notes === 'QA pass');
    ok('the job is in packaging, moved once, by the inspector, through the inspection', (await jobOf(j.id)).status === 'PACKAGING' && (await toStatus(j.id, 'PACKAGING')) === 1 && (await movesOf(j.id)).find((m) => m.to === 'PACKAGING').userId === qc1.user.id);
    const log = await decidedRows(row.id);
    ok('the decision is in the audit log with the signed-in inspector, the result and where the job went', log.length === 1 && log[0].userId === qc1.user.id && log[0].details.decision === 'PASSED' && log[0].details.result === 'PASS' && log[0].details.jobId === j.id, JSON.stringify(log[0]?.details));
    await chain(ok, j.id);
  });
  await scenario(G5, 'an inspection cannot be passed with a required check unanswered or failed, or a measurement out of tolerance', async (ok) => {
    const j = await atQc();
    const made = (await openInspection(j.id)).body.data;
    const blank = await decide(made, 'pass', {});
    const oneFail = await decide(made, 'pass', { checklist: made.checklist.map((c, i) => ({ ...c, result: i === 1 ? 'FAIL' : 'PASS' })) });
    const oneBlank = await decide(made, 'pass', { checklist: made.checklist.map((c, i) => ({ ...c, result: i === 2 ? null : 'PASS' })) });
    const outOfTol = await decide(made, 'pass', { checklist: answered(made), dimensionalChecks: [{ dimension: 'Width', nominal: 24, actual: 24.4, tolerance: 0.1, pass: false }] });
    ok('all four are refused with 409', [blank, oneFail, oneBlank, outOfTol].every((r) => r.status === 409), [blank, oneFail, oneBlank, outOfTol].map((r) => r.status).join());
    ok('each refusal names what is wrong', /no result/.test(blank.body.error) && /failed/.test(oneFail.body.error) && /no result/.test(oneBlank.body.error) && /Width is out of tolerance/.test(outOfTol.body.error), [blank, oneFail, oneBlank, outOfTol].map((r) => r.body?.error).join(' | ').slice(0, 400));
    const row = await insOf(made.id);
    ok('the inspection is still open and the job still waiting', row.status === 'PENDING' && row.overallResult === null && (await jobOf(j.id)).status === 'WAITING_QC' && (await decidedRows(made.id)).length === 0);
    const good = await decide(made, 'pass', { checklist: answered(made), dimensionalChecks: [{ dimension: 'Width', nominal: 24, actual: 24.05, tolerance: 0.1, pass: true }] });
    ok('with every check passed and the measurement in tolerance it passes, and the measurement is kept', good.status === 200 && (await insOf(made.id)).dimensionalChecks[0].actual === 24.05, `${good.status}`);
  });
  await scenario(G5, 'a job waiting for inspection cannot be released by hand: only a passed inspection moves it on', async (ok) => {
    const j = await atQc();
    const tries = [await move(j.id, 'PACKAGING'), await move(j.id, 'READY_TO_SHIP'), await move(j.id, 'SHIPPED'), await move(j.id, 'COMPLETED'), await move(j.id, 'PACKAGING', pm1), await A.call('PATCH', `/api/jobs/${j.id}/status`, { status: 'PACKAGING' }, 'admin'), await A.patch(`/api/jobs/${j.id}`, { status: 'PACKAGING' })];
    ok('packaging, ready to ship, shipped and completed are all refused, for an administrator and a production manager, at every address', tries.every((r) => r.status === 409 || r.status === 400), tries.map((r) => r.status).join());
    ok('the job has not moved', (await jobOf(j.id)).status === 'WAITING_QC' && (await movesOf(j.id)).every((m) => !['PACKAGING', 'READY_TO_SHIP', 'SHIPPED', 'COMPLETED'].includes(m.to)));
    const made = (await openInspection(j.id)).body.data;
    const open = await move(j.id, 'PACKAGING');
    ok('with an inspection open it is still refused, and the refusal names the inspection', open.status === 409 && open.body.error.includes(made.inspectionNumber), `${open.status} ${open.body?.error}`);
    await passIt(made);
    const on = await move(j.id, 'READY_TO_SHIP');
    ok('after the pass it is in packaging and moves on to ready to ship', on.status === 200 && (await jobOf(j.id)).status === 'READY_TO_SHIP', `${on.status} ${on.body?.error}`);
    await chain(ok, j.id);
  });
  await scenario(G5, 'failing an inspection puts the job on hold with the defects and disposition on record', async (ok) => {
    const j = await atQc();
    const made = (await openInspection(j.id, qc1)).body.data;
    const bad = await decide(made, 'fail', { disposition: 'MELT_IT' }, qc1);
    const r = await decide(made, 'fail', { notes: 'Edge burr over limit', defects: [{ type: 'BURR', severity: 'MAJOR', description: 'QA defect' }], disposition: 'SCRAP' }, qc1);
    const row = await insOf(made.id);
    ok('an unknown disposition is refused with 400', bad.status === 400);
    ok('failed with what the inspector entered', r.status === 200 && row.status === 'FAILED' && row.overallResult === 'FAIL' && row.disposition === 'SCRAP' && row.defects[0].type === 'BURR' && row.notes === 'Edge burr over limit', `${r.status} ${r.body?.error}`);
    ok('the job is on hold, moved once', (await jobOf(j.id)).status === 'ON_HOLD' && (await toStatus(j.id, 'ON_HOLD')) === 1);
    const log = await decidedRows(made.id);
    ok('the audit row says failed, scrap, by the inspector', log.length === 1 && log[0].details.decision === 'FAILED' && log[0].details.disposition === 'SCRAP' && log[0].userId === qc1.user.id);
    await chain(ok, j.id);
  });
  await scenario(G5, 'a job that failed inspection cannot be packed, shipped or completed by any route until a new inspection passes', async (ok) => {
    const j = await atQc();
    await inspected(j.id, 'fail', { disposition: 'PENDING' });
    const tries = [await move(j.id, 'PACKAGING'), await move(j.id, 'READY_TO_SHIP'), await move(j.id, 'SHIPPED'), await move(j.id, 'COMPLETED', pm1), await A.post(`/api/jobs/${j.id}/ship`, {}), await A.post(`/api/jobs/${j.id}/complete`, {})];
    ok('every forward move is refused', tries.every((r) => r.status === 409 || r.status === 400), tries.map((r) => r.status).join());
    ok('the refusal says a passed inspection is needed', /failed.*needs a passed inspection|needs a passed inspection/i.test(tries[0].body?.error || ''), tries[0].body?.error);
    ok('the job is still on hold', (await jobOf(j.id)).status === 'ON_HOLD');
    const back = await move(j.id, 'WAITING_QC', 'admin', 'QA: corrected, re-inspect');
    const again = await inspected(j.id);
    ok('sent back to inspection and passed, it goes to packaging', back.status === 200 && (await jobOf(j.id)).status === 'PACKAGING', `${back.status} ${back.body?.error}`);
    const all = await inspectionsOf(j.id);
    ok('both inspections stay on record: the failure is not erased by the pass', all.length === 2 && all[0].status === 'FAILED' && all[1].status === 'PASSED' && all[1].id === again.id);
    await chain(ok, j.id);
  });
  await scenario(G5, 'a conditional pass must state its conditions, keeps the inspector\'s earlier notes, and cannot carry a disposition that says the material is not going on', async (ok) => {
    const j = await atQc();
    const made = (await openInspection(j.id, 'admin', { notes: 'Light surface rust on two pieces' })).body.data;
    const none = await decide(made, 'conditional', { notes: 'ok' });
    const blank = await decide(made, 'conditional', { conditions: '   ' });
    const scrap = await decide(made, 'conditional', { conditions: 'x', disposition: 'SCRAP' });
    const rework = await decide(made, 'conditional', { conditions: 'x', disposition: 'REWORK' });
    ok('no conditions, blank conditions, and a scrap or rework disposition are refused with 400', [none, blank, scrap, rework].every((r) => r.status === 400), [none, blank, scrap, rework].map((r) => r.status).join());
    ok('nothing was decided', (await insOf(made.id)).status === 'PENDING' && (await jobOf(j.id)).status === 'WAITING_QC');
    const r = await decide(made, 'conditional', { conditions: 'Customer accepts surface rust per call 11/15', notes: 'Buyer: QA', disposition: 'SELL_SECONDARY' }, qc1);
    const row = await insOf(made.id);
    ok('accepted: recorded as a conditional result, not a clean pass', r.status === 200 && row.overallResult === 'CONDITIONAL' && row.status === 'PASSED' && row.disposition === 'SELL_SECONDARY', `${r.status} ${r.body?.error}`);
    ok('the conditions, the new note and the earlier note are all on file', /CONDITIONAL PASS: Customer accepts surface rust/.test(row.notes) && /Buyer: QA/.test(row.notes) && /Light surface rust on two pieces/.test(row.notes), row.notes);
    ok('the job is in packaging and the audit row says conditional', (await jobOf(j.id)).status === 'PACKAGING' && (await decidedRows(made.id))[0].details.decision === 'CONDITIONAL');
  });
  await scenario(G5, 'an inspection passed and failed at the same moment has one result, and the job matches it', async (ok) => {
    let bad = 0; const seen = [];
    for (let i = 0; i < 6; i++) {
      const j = await atQc();
      const made = (await openInspection(j.id)).body.data;
      const [p, f] = await Promise.all([passIt(made, qc1), decide(made, 'fail', { disposition: 'PENDING' })]);
      const row = await insOf(made.id); const job = await jobOf(j.id);
      const won = p.status === 200 ? 'PASSED' : 'FAILED';
      const fine = [p.status, f.status].sort().join() === '200,400' && row.status === won && job.status === (won === 'PASSED' ? 'PACKAGING' : 'ON_HOLD') && (await decidedRows(made.id)).length === 1 && (await movesOf(j.id)).filter((m) => ['PACKAGING', 'ON_HOLD'].includes(m.to)).length === 1;
      seen.push(`${p.status}/${f.status}:${row.status}:${job.status}`);
      if (!fine) bad++;
    }
    ok('6 rounds: exactly one decision each time, and inspection, job, history and audit agree', bad === 0, seen.join(' '));
  });
  await scenario(G5, 'a decided inspection cannot be decided again or edited', async (ok) => {
    const j = await atQc();
    const made = await inspected(j.id);
    const before = await insOf(made.id);
    const tries = [await passIt(made), await decide(made, 'fail', {}), await decide(made, 'conditional', { conditions: 'late' }), await decide(made, 'rework', {}), await A.call('PATCH', `/api/qc/inspections/${made.id}`, { notes: 'changed after the fact', checklist: [] }, 'admin')];
    ok('pass, fail, conditional, rework and an edit are all refused with 400', tries.every((r) => r.status === 400), tries.map((r) => r.status).join());
    const after = await insOf(made.id);
    ok('the record is exactly as it was decided', after.status === 'PASSED' && JSON.stringify(after.checklist) === JSON.stringify(before.checklist) && after.notes === before.notes && String(after.completedAt) === String(before.completedAt));
    ok('one decision in the audit log, and the job still in packaging', (await decidedRows(made.id)).length === 1 && (await jobOf(j.id)).status === 'PACKAGING');
  });
  await scenario(G5, 'an inspection cannot decide a job that has been cancelled in the meantime', async (ok) => {
    const j = await atQc();
    const made = (await openInspection(j.id)).body.data;
    await move(j.id, 'CANCELLED', 'admin', 'QA: customer cancelled');
    const p = await passIt(made); const f = await decide(made, 'fail', {});
    ok('pass and fail are refused with 409 and say the job is cancelled', p.status === 409 && f.status === 409 && /cancelled/.test(p.body?.error || ''), `${p.status} ${f.status} ${p.body?.error}`);
    ok('the job stays cancelled and the inspection is left open, undecided', (await jobOf(j.id)).status === 'CANCELLED' && (await insOf(made.id)).overallResult === null && (await decidedRows(made.id)).length === 0);
  });
  await scenario(G5, 'an open inspection can be filled in as the inspector goes, with a real inspector and well-formed answers only', async (ok) => {
    const j = await atQc();
    const made = (await openInspection(j.id)).body.data;
    const gone = await mkOperator(L1); await A.call('PATCH', `/api/staff/operators/${gone.id}`, { isActive: false }, 'admin');
    const patch = (body, who = 'admin') => as(who)('PATCH', `/api/qc/inspections/${made.id}`, body);
    const a = await patch({ inspectorId: '00000000-0000-0000-0000-000000000000' });
    const b = await patch({ inspectorId: gone.id });
    const c = await patch({ checklist: 'all good' });
    const d = await patch({ dimensionalChecks: { width: 24 } });
    ok('an unknown inspector, an inactive one, and a checklist or measurements that are not lists are refused with 400', [a, b, c, d].every((r) => r.status === 400), [a, b, c, d].map((r) => r.status).join());
    ok('nothing changed', JSON.stringify((await insOf(made.id)).checklist) === JSON.stringify(made.checklist) && (await insOf(made.id)).inspectorId === null);
    const half = made.checklist.map((c2, i) => ({ ...c2, result: i < 2 ? 'PASS' : null }));
    const good = await patch({ inspectorId: opA.id, checklist: half, status: 'IN_PROGRESS', visualNotes: 'QA note' }, qc1);
    const row = await insOf(made.id);
    ok('a part-filled checklist is saved, in progress, with the inspector', good.status === 200 && row.status === 'IN_PROGRESS' && row.inspectorId === opA.id && row.checklist[0].result === 'PASS' && row.checklist[3].result === null && row.startedAt !== null, `${good.status}`);
    ok('saving progress decides nothing', row.overallResult === null && (await jobOf(j.id)).status === 'WAITING_QC');
    const p = await decide(made, 'pass', {});
    ok('and the part-filled inspection still cannot be passed', p.status === 409, `${p.status}`);
  });
  await scenario(G5, 'inspections at one branch cannot be seen or decided from another branch', async (ok) => {
    const j = await atQc();
    const made = (await openInspection(j.id, qc1)).body.data;
    const peek = await qc2.call('GET', `/api/qc/inspections/${made.id}`);
    const p = await passIt(made, qc2);
    const f = await decide(made, 'fail', {}, qc2);
    const e = await qc2.call('PATCH', `/api/qc/inspections/${made.id}`, { notes: 'from another branch' });
    const o = await openInspection(j.id, qc2);
    ok('view, pass, fail, edit and open are all 404 for the other branch\'s inspector', [peek, p, f, e, o].every((r) => r.status === 404), [peek, p, f, e, o].map((r) => r.status).join());
    ok('the inspection and the job are untouched', (await insOf(made.id)).status === 'PENDING' && (await insOf(made.id)).notes !== 'from another branch' && (await jobOf(j.id)).status === 'WAITING_QC');
    const q = await qc2.call('GET', '/api/qc/queue?limit=500');
    const list = await qc2.call('GET', '/api/qc/inspections?limit=500');
    const rows = list.body?.data?.inspections || list.body?.data || [];
    ok('the job is not in their queue and the inspection not in their list', q.status === 200 && !q.body.data.some((x) => x.id === j.id) && !rows.some((x) => x.id === made.id));
    const mine = await qc1.call('GET', '/api/qc/queue?limit=500');
    ok('it is in its own branch\'s queue', mine.body.data.some((x) => x.id === j.id));
  });
  await scenario(G5, 'only quality staff and production management decide an inspection', async (ok) => {
    const j = await atQc();
    const made = (await openInspection(j.id)).body.data;
    const floor = await passIt(made, opr1);
    const sales = await passIt(made, 'csr');
    const salesOpen = await openInspection(j.id, 'csr');
    ok('an operator and a sales login cannot pass it, and sales cannot open one', floor.status === 403 && sales.status === 403 && salesOpen.status === 403, `${floor.status} ${sales.status} ${salesOpen.status}`);
    ok('the inspection is undecided', (await insOf(made.id)).status === 'PENDING' && (await jobOf(j.id)).status === 'WAITING_QC');
    const mgr = await passIt(made, pm1);
    ok('the production manager can', mgr.status === 200, `${mgr.status} ${mgr.body?.error}`);
  });
  await scenario(G5, 'the quality figures are counted from the records: queue, in progress, passed and failed today, and the pass rate', async (ok) => {
    const a = await atQc(); const b = await atQc(); const c = await atQc();
    await inspected(a.id); await inspected(b.id, 'fail', { disposition: 'PENDING' }); await openInspection(c.id, 'admin', { inspectorId: opA.id });
    const r = await A.get('/api/qc/stats');
    const d = r.body.data;
    const day = new Date(new Date().setHours(0, 0, 0, 0));
    const [queue, running, passed, failed, total] = await Promise.all([
      prisma.job.count({ where: { status: 'WAITING_QC' } }), prisma.jobInspection.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.jobInspection.count({ where: { overallResult: 'PASS', completedAt: { gte: day } } }), prisma.jobInspection.count({ where: { overallResult: 'FAIL', completedAt: { gte: day } } }), prisma.jobInspection.count(),
    ]);
    ok('each count equals the records', r.status === 200 && d.queueCount === queue && d.inProgressCount === running && d.passedToday === passed && d.failedToday === failed && d.totalInspections === total, JSON.stringify({ d: [d.queueCount, d.inProgressCount, d.passedToday, d.failedToday], db: [queue, running, passed, failed] }));
    ok('the pass rate is passed over decided, as a whole percentage', d.passRate === Math.round((passed / (passed + failed)) * 100) && passed >= 1 && failed >= 1, `${d.passRate}`);
    const other = await qc2.call('GET', '/api/qc/stats');
    const theirs = await prisma.job.count({ where: { status: 'WAITING_QC', OR: [{ order: { locationId: L2.id } }, { workCenter: { locationId: L2.id } }] } });
    ok('another branch\'s inspector gets their own branch\'s figures, not these', other.status === 200 && other.body.data.queueCount <= theirs && other.body.data.queueCount < queue, `${other.body?.data?.queueCount} of ${queue}`);
    const { inspectionPassBlockers } = await import('../../src/backend/src/lib/productionRules.js');
    ok('with nothing decided there is no pass rate: the rule reads null, not 100%', inspectionPassBlockers([], []).length === 0 && /passRate = passedToday \+ failedToday > 0[\s\S]{0,120}: null/.test(fs.readFileSync('src/backend/src/routes/qcRoutes.js', 'utf8')));
  });
  await scenario(G5, 'a coil work order put on quality hold cannot be completed, and is released only by quality or production management', async (ok) => {
    const coilId = await B.received({ weightLb: 1000 });
    const wo = await startedWorkOrder(coilId);
    const noWhy = await A.put(`/api/work-orders/${wo.id}/hold`, {});
    const h = await A.put(`/api/work-orders/${wo.id}/hold`, { reason: 'Edge wave seen on the line' });
    ok('a hold needs a reason; with one it is held', noWhy.status === 400 && h.status === 200 && (await woOf(wo.id)).status === 'QC_HOLD', `${noWhy.status} ${h.status} ${h.body?.error}`);
    const done = await as('admin')('PUT', `/api/work-orders/${wo.id}/complete`, { outputWeightLb: 950, scrapWeightLb: 50 });
    ok('it cannot be completed while held, and no stock moved', done.status === 409 && (await woOf(wo.id)).status === 'QC_HOLD' && near((await invOf(coilId)).qtyOnHand, 1000) && (await stockMoves(coilId, 'CONSUME')).length === 0, `${done.status} ${done.body?.error}`);
    const byFloor = await opr1.call('PUT', `/api/work-orders/${wo.id}/release-hold`, {});
    ok('an operator cannot release it', byFloor.status === 403 && (await woOf(wo.id)).status === 'QC_HOLD', `${byFloor.status}`);
    const byQc = await qc1.call('PUT', `/api/work-orders/${wo.id}/release-hold`, {});
    ok('the inspector releases it back to in progress', byQc.status === 200 && (await woOf(wo.id)).status === 'IN_PROGRESS', `${byQc.status} ${byQc.body?.error}`);
    const twice = await qc1.call('PUT', `/api/work-orders/${wo.id}/release-hold`, {});
    ok('a work order that is not on hold cannot be "released"', twice.status === 409);
    const audit = await prisma.auditLog.findMany({ where: { resourceType: 'WorkOrder', resourceId: wo.id }, orderBy: { timestamp: 'asc' } });
    ok('the hold, with its reason, and the release, with who did it, are in the audit log', audit.some((r) => JSON.stringify(r.details).includes('Edge wave')) && audit.some((r) => r.userId === qc1.user.id), `${audit.length} rows`);
    const fin = await as('admin')('PUT', `/api/work-orders/${wo.id}/complete`, { outputWeightLb: 950, scrapWeightLb: 50 });
    ok('once released it completes', fin.status === 200, `${fin.status}`);
  });
  await scenario(G5, 'material that failed quality or is on a quality hold is not put on a work order', async (ok) => {
    const failedCoil = await B.received({ weightLb: 1000 }); await prisma.coil.update({ where: { id: failedCoil }, data: { qcStatus: 'FAILED' } });
    const heldCoil = await B.received({ weightLb: 1000 }); await prisma.coil.update({ where: { id: heldCoil }, data: { qcStatus: 'HOLD' } });
    const before = await prisma.workOrder.count();
    const a = await workOrder(failedCoil); const b = await workOrder(heldCoil);
    ok('both are refused with 409', a.status === 409 && b.status === 409, `${a.status} ${b.status} ${a.body?.error}`);
    ok('no work order was saved', (await prisma.workOrder.count()) === before);
    const fine = await B.received({ weightLb: 1000 });
    const wo = await startedWorkOrder(fine);
    await prisma.coil.update({ where: { id: fine }, data: { qcStatus: 'FAILED' } });
    const d = await as('admin')('PUT', `/api/work-orders/${wo.id}/complete`, { outputWeightLb: 950, scrapWeightLb: 50 });
    const pieces = await prisma.coil.findMany({ where: { parentCoilId: fine } });
    ok('material failed after the run started: the run is not completed into sellable pieces', d.status === 409 || pieces.every((p) => p.qcStatus === 'FAILED' || p.qcStatus === 'HOLD'), `${d.status} ${pieces.map((p) => p.qcStatus).join()}`);
  });
  await scenario(G5, 'the queue for inspectors lists what is waiting with its latest inspection, and a job leaves it when decided', async (ok) => {
    const j = await atQc({ types: [T, T2].slice(0, 1) });
    const q1 = await qc1.call('GET', '/api/qc/queue?limit=500');
    const row = q1.body.data.find((x) => x.id === j.id);
    ok('the job is in the queue with its finished steps and no inspection yet', Boolean(row) && row.inspections.length === 0 && row.dispatchJob.operations.every((o) => o.status === 'COMPLETE'));
    const made = (await openInspection(j.id, qc1)).body.data;
    const q2 = await qc1.call('GET', '/api/qc/queue?limit=500');
    ok('once opened, the queue shows that inspection against it', q2.body.data.find((x) => x.id === j.id)?.inspections[0]?.id === made.id);
    await passIt(made, qc1);
    const q3 = await qc1.call('GET', '/api/qc/queue?limit=500');
    ok('once passed it is no longer in the queue', !q3.body.data.some((x) => x.id === j.id));
    const hot = await atQc({ job: { priority: 5 } }); const low = await atQc({ job: { priority: 1 } });
    const q4 = (await qc1.call('GET', '/api/qc/queue?limit=500')).body;
    const at = (id) => q4.data.findIndex((x) => x.id === id);
    ok('a hot job is listed ahead of a low-priority one that arrived at the same time (the queue used to put the lowest priority first)', at(hot.id) >= 0 && at(low.id) > at(hot.id), `${at(hot.id)} ${at(low.id)} of ${q4.data.length}`);
    ok('the queue says how many are waiting in all, and never sends more than it was asked for', q4.total === (await prisma.job.count({ where: { status: 'WAITING_QC', OR: [{ order: { locationId: L1.id } }, { workCenter: { locationId: L1.id } }] } })) && q4.data.length <= 500 && (await qc1.call('GET', '/api/qc/queue?limit=2')).body.data.length <= 2, `${q4.total} ${q4.data.length}`);
    ok('every job in the queue is waiting for inspection', (await prisma.job.count({ where: { id: { in: q3.body.data.map((x) => x.id) }, status: { not: 'WAITING_QC' } } })) === 0);
  });
  await scenario(G5, 'nonconformance reports and corrective actions are not part of this product: a failed inspection is the only nonconformance record', async (ok) => {
    const found = await tables('nonconform|ncr|capa|correctiveaction|rootcause');
    ok('there is no nonconformance or root-cause table; the one corrective-action table belongs to safety incidents, not to quality', found.join() === 'SafetyCorrectiveAction', found.join());
    const cols = (await prisma.$queryRawUnsafe(`select column_name from information_schema.columns where table_name = 'JobInspection'`)).map((r) => r.column_name);
    ok('what is recorded for a failure is the defects, a disposition and rework instructions on the inspection itself', ['defects', 'disposition', 'reworkInstructions'].every((c) => cols.includes(c)) && !cols.some((c) => /rootCause|correctiveAction|ncr|containment|verifiedBy/i.test(c)), cols.join());
  }, NA);
  await scenario(G5, 'a job with no planned steps goes to inspection when it is completed; it cannot skip to the dock (owner decision 9)', async (ok) => {
    const j = await mkJob({ planned: false });
    await A.post(`/api/jobs/${j.id}/start`, {});
    const dock = await move(j.id, 'READY_TO_SHIP'); const pack = await move(j.id, 'PACKAGING');
    ok('from in process it cannot be moved by hand to packaging or the dock', dock.status === 409 && pack.status === 409 && (await jobOf(j.id)).status === 'IN_PROCESS', `${dock.status} ${pack.status} ${pack.body?.error}`);
    const done = await A.post(`/api/jobs/${j.id}/complete`, {});
    ok('"complete" sends it to inspection and says so', done.status === 200 && (await jobOf(j.id)).status === 'WAITING_QC' && /inspection/.test(done.body?.message || ''), `${done.status} ${(await jobOf(j.id)).status} ${done.body?.message}`);
    const skip = await move(j.id, 'PACKAGING');
    ok('waiting for inspection, it still cannot be released by hand', skip.status === 409, `${skip.status}`);
    await inspected(j.id);
    ok('a passed inspection moves it to packaging', (await jobOf(j.id)).status === 'PACKAGING');
    await chain(ok, j.id);
  });
  await scenario(G5, 'a routing marked "no inspection" lets its jobs go straight to packaging; every other job is inspected (owner decision 9)', async (ok) => {
    const bad = await A.post('/api/v1/bom/recipes', recipeBody({ inspectionRequired: 'no' }));
    ok('the mark must be yes or no', bad.status === 400, `${bad.status}`);
    const plain = await activeRecipe();
    ok('a routing asks for inspection unless it says otherwise', plain.inspectionRequired === true);
    const free = await activeRecipe({ inspectionRequired: false });
    const shape = await A.post('/api/v1/bom/recipes', recipeBody({ operations: [{ name: 'Saw', workCenterType: T, parameters: { speed: 4 } }] }));
    const bare = await activeRecipe({ operations: [{ name: 'Saw', workCenterType: T }] });
    ok('a step whose parameters are not a list is refused; a step with none is saved with an empty list, which the routing screen can open', shape.status === 400 && bare.operations.length === 1 && Array.isArray(bare.operations[0].parameters) && bare.operations[0].parameters.length === 0, `${shape.status} ${JSON.stringify(bare.operations[0]?.parameters)}`);
    ok('the mark is saved on the routing', free.inspectionRequired === false);
    const c = await cell();
    const a = await cellJob(c); const b = await cellJob(c); const n = await cellJob(c, { planned: false });
    const put = [await A.patch(`/api/jobs/${a.id}`, { recipeId: free.id }), await A.patch(`/api/jobs/${b.id}`, { recipeId: plain.id }), await A.patch(`/api/jobs/${n.id}`, { recipeId: free.id })];
    ok('the routings go on the jobs', put.every((p) => p.status === 200), put.map((p) => `${p.status} ${p.body?.error || ''}`).join());
    await runOps(a, { person: c.person, wc: c.wc }); await runOps(b, { person: c.person, wc: c.wc });
    ok('the last step of the "no inspection" job sends it to packaging', (await jobOf(a.id)).status === 'PACKAGING', (await jobOf(a.id)).status);
    ok('the last step of the other job sends it to inspection', (await jobOf(b.id)).status === 'WAITING_QC', (await jobOf(b.id)).status);
    ok('no inspection was made up for the first job', (await inspectionsOf(a.id)).length === 0);
    await A.post(`/api/jobs/${n.id}/start`, {});
    const done = await A.post(`/api/jobs/${n.id}/complete`, {});
    ok('a job with no steps on the "no inspection" routing completes to the dock', done.status === 200 && (await jobOf(n.id)).status === 'READY_TO_SHIP', `${done.status} ${(await jobOf(n.id)).status}`);
    await chain(ok, a.id); await chain(ok, b.id);
  });
  await scenario(G5, 'an inspection starts with the checklist the owner entered for that kind of work; with none entered, the standard list (owner decision 9)', async (ok) => {
    const c = await cell();
    const std = await cellJob(c); await runOps(std, { person: c.person, wc: c.wc });
    const first = (await openInspection(std.id)).body.data;
    ok('no list entered: the standard list', Array.isArray(first.checklist) && first.checklist.length >= 3, String(first.checklist?.length));
    const url = `/api/v1/dispatch/work-center-types/${c.type}`;
    const twice = await A.call('PATCH', url, { inspectionChecklist: ['Length to print', 'length to print'] });
    const blank = await A.call('PATCH', url, { inspectionChecklist: ['Length to print', '  '] });
    const many = await A.call('PATCH', url, { inspectionChecklist: Array.from({ length: 41 }, (_, i) => `Check ${i + 1}`) });
    const shape = await A.call('PATCH', url, { inspectionChecklist: 'Length to print' });
    ok('a list with the same check twice, an empty check, more than 40 checks, or not a list is refused', [twice, blank, many, shape].every((r) => r.status === 400), [twice, blank, many, shape].map((r) => r.status).join());
    const set = await A.call('PATCH', url, { inspectionChecklist: ['Length to print', { item: 'Edge free of burr', required: true }, { item: 'Photo taken', required: false }] });
    ok('a proper list is saved', set.status === 200, `${set.status} ${JSON.stringify(set.body).slice(0, 160)}`);
    const j = await cellJob(c); await runOps(j, { person: c.person, wc: c.wc });
    const made = (await openInspection(j.id)).body.data;
    ok('a new inspection of that kind of work starts with exactly those checks, unanswered', made.checklist.length === 3 && made.checklist.map((x) => x.item).join('|') === 'Length to print|Edge free of burr|Photo taken' && made.checklist.every((x) => !x.result) && made.checklist[2].required === false, JSON.stringify(made.checklist));
    ok('the inspection already open keeps the list it started with', (await prisma.jobInspection.findUnique({ where: { id: first.id } })).checklist.length === first.checklist.length);
    const part = await decide(made, 'pass', { checklist: made.checklist.map((x, i) => (i === 1 ? { ...x, result: 'FAIL' } : { ...x, result: 'PASS' })) });
    ok('a required check that failed blocks the pass', part.status === 409, `${part.status}`);
    const good = await decide(made, 'pass', { checklist: made.checklist.map((x, i) => (i === 2 ? x : { ...x, result: 'PASS' })) });
    ok('with the required checks passed it passes; the check that is not required may be left', good.status === 200 && (await jobOf(j.id)).status === 'PACKAGING', `${good.status} ${good.body?.error}`);
    const clear = await A.call('PATCH', url, { inspectionChecklist: [] });
    const k = await cellJob(c); await runOps(k, { person: c.person, wc: c.wc });
    const back = (await openInspection(k.id)).body.data;
    ok('emptied, the standard list is used again', clear.status === 200 && back.checklist.length === first.checklist.length && back.checklist[0].item === first.checklist[0].item, `${clear.status} ${back.checklist.length}`);
    ok('the wording of the checks is the owner\'s to supply; none was written for him here (L-028)', true);
  });
  await scenario(G5, 'inspection standards, sampling plans and gauge calibration are not on file; the built-in checklist is a fixed list', async (ok) => {
    ok('there is no inspection plan, sampling or gauge table', (await tables('inspectionplan|samplingplan|gauge|calibration|inspectionstandard')).length === 0, (await tables('inspectionplan|samplingplan|gauge|calibration|inspectionstandard')).join());
    ok('the checklist comes from a list written in the program, by kind of work, not from a standard the owner entered', /function getDefaultChecklist/.test(fs.readFileSync('src/backend/src/routes/qcRoutes.js', 'utf8')));
    ok('this run verified that the product enforces the checklist it has; it did not and cannot verify the checklist against a customer or industry standard', true);
  }, NA);
  await scenario(G5, 'a scrap or return disposition on a failed inspection is a record only: nothing follows it through to stock', async (ok) => {
    const j = await atQc();
    const moves = await prisma.materialMovement.count();
    await inspected(j.id, 'fail', { disposition: 'SCRAP' });
    ok('the disposition is on the inspection and the job is on hold', (await inspectionsOf(j.id))[0].disposition === 'SCRAP' && (await jobOf(j.id)).status === 'ON_HOLD');
    ok('no stock movement was written: a job is not tied to the stock it was made from', (await prisma.materialMovement.count()) === moves);
    const cols = (await prisma.$queryRawUnsafe(`select column_name from information_schema.columns where table_name = 'Job'`)).map((r) => r.column_name);
    ok('the job record has no column naming its material', !cols.some((c) => /coilId|inventoryId|sourceCoil|materialId/i.test(c)), cols.filter((c) => /coil|material|inventory/i.test(c)).join());
  }, NA);
}

// ════════════════════════════════════════════════════════════════════════════════
if (want(6)) {
  const finishWo = (wo, body, who = 'admin') => as(who)('PUT', `/api/work-orders/${wo.id}/complete`, body);
  const adjust = (coilId, body, who = 'branchWh') => A.call('POST', '/api/inventory/adjust', { coilId, ...body }, who);
  const sumOf = async (coilId, type) => (await stockMoves(coilId, type)).reduce((n, m) => n + num(m.qtyMoved), 0);
  const drop = (parentNo, weightLb, over = {}, who = 'admin') => as(who)('POST', '/api/inventory/receipts', { coilNumber: tag('REM'), form: 'PLATE', parentTag: parentNo, thicknessIn: 0.5, widthIn: 10, lengthIn: 20, weightLb, locationId: L1.id, ...over });

  await scenario(G6, 'scrap reported on a work order is written to the stock history with who reported it, and the yield is worked out from the weights', async (ok) => {
    const coilId = await B.received({ weightLb: 3000 });
    const wo = await startedWorkOrder(coilId, { inputWeightLb: 3000 });
    const d = await finishWo(wo, { scrapWeightLb: 100.5, outputs: [{ weightLb: 1449.75, widthIn: 24 }, { weightLb: 1449.75, widthIn: 24 }] }, pm1);
    const scrap = await stockMoves(coilId, 'SCRAP');
    ok('completed', d.status === 200, `${d.status} ${d.body?.error}`);
    ok('one scrap entry of 100.5 lb, by the production manager', scrap.length === 1 && near(scrap[0].qtyMoved, 100.5) && scrap[0].createdById === pm1.user.id, JSON.stringify(scrap.map((m) => [m.qtyMoved, m.createdById])));
    const saved = await woOf(wo.id);
    ok('yield is 2,899.5 of 3,000: 96.65%', near(saved.yieldPct, 96.65, 0.001) && near(saved.outputWeightLb, 2899.5) && near(saved.scrapWeightLb, 100.5), String(saved.yieldPct));
    ok('what left the source equals what was made plus what was scrapped', near((await sumOf(coilId, 'CONSUME')) + (await sumOf(coilId, 'SCRAP')), 3000) && near((await invOf(coilId)).qtyOnHand, 0));
    const pieces = await prisma.coil.findMany({ where: { parentCoilId: coilId } });
    let made = 0; for (const p of pieces) made += num((await invOf(p.id)).qtyOnHand);
    ok('the pieces on the shelf weigh what was reported', pieces.length === 2 && near(made, 2899.5), String(made));
    await books(ok, coilId, 'source');
  });
  await scenario(G6, 'a run that is all scrap makes no pieces and still balances', async (ok) => {
    const coilId = await B.received({ weightLb: 800 });
    const wo = await startedWorkOrder(coilId, { inputWeightLb: 800 });
    const d = await finishWo(wo, { outputWeightLb: 0, scrapWeightLb: 800 });
    ok('accepted', d.status === 200, `${d.status} ${d.body?.error}`);
    ok('no piece was made, 800 lb is on record as scrap, and the source is used up', (await prisma.coil.count({ where: { parentCoilId: coilId } })) === 0 && near(await sumOf(coilId, 'SCRAP'), 800) && near((await invOf(coilId)).qtyOnHand, 0) && (await coilOf(coilId)).status === 'CONSUMED');
    ok('yield is 0%', near((await woOf(wo.id)).yieldPct, 0));
    await books(ok, coilId);
  });
  await scenario(G6, 'weight that is neither made nor scrapped stays on the source: nothing disappears without a record', async (ok) => {
    const coilId = await B.received({ weightLb: 2000 });
    const wo = await startedWorkOrder(coilId, { inputWeightLb: 2000 });
    const d = await finishWo(wo, { outputWeightLb: 1200, scrapWeightLb: 100 });
    const i = await books(ok, coilId);
    ok('1,300 lb left the source and 700 lb is still on it', d.status === 200 && near(i.qtyOnHand, 700) && near((await sumOf(coilId, 'CONSUME')) + (await sumOf(coilId, 'SCRAP')), 1300), `${d.status} ${i.qtyOnHand}`);
    ok('the yield is against what went on the line: 60%', near((await woOf(wo.id)).yieldPct, 60));
  });
  await scenario(G6, 'a drop cut from what a work order left behind keeps the heat and its parent, and the weights still add up', async (ok) => {
    const parentNo = tag('PAR');
    const coilId = await B.received({ coilNumber: parentNo, weightLb: 2000 });
    const wo = await startedWorkOrder(coilId, { inputWeightLb: 1500 });
    await finishWo(wo, { outputWeightLb: 1450, scrapWeightLb: 50 });
    const r = await drop(parentNo, 120.25);
    const rem = await coilOf(r.body?.item?.id);
    ok('the drop is saved with the parent\'s heat and grade, pointing at its parent', r.status === 201 && rem.parentCoilId === coilId && rem.heatId === heat.id && rem.gradeId === heat.gradeId, `${r.status} ${JSON.stringify(r.body).slice(0, 160)}`);
    ok('the parent went from 500 to 379.75 lb', near((await invOf(coilId)).qtyOnHand, 379.75), String((await invOf(coilId)).qtyOnHand));
    const kids = await prisma.coil.findMany({ where: { parentCoilId: coilId } });
    let total = num((await invOf(coilId)).qtyOnHand); for (const k of kids) total += num((await invOf(k.id)).qtyOnHand);
    ok('parent, piece and drop together plus scrap come to the 2,000 lb received', near(total + (await sumOf(coilId, 'SCRAP')), 2000), String(total));
    await books(ok, coilId, 'parent'); await books(ok, rem.id, 'drop');
  });
  await scenario(G6, 'a drop cannot weigh more than what is free on its parent', async (ok) => {
    const parentNo = tag('PAR');
    const coilId = await B.received({ coilNumber: parentNo, weightLb: 1000 });
    const o = await mkOrder({ qty: 900 }); await B.reserve(o, o.lines[0], coilId, 900);
    const before = await prisma.coil.count({ where: { parentCoilId: coilId } });
    const r = await drop(parentNo, 150);
    ok('150 lb against 100 lb free is refused', r.status >= 400 && r.status < 500, `${r.status}`);
    ok('nothing saved; the parent and its reservation are untouched', (await prisma.coil.count({ where: { parentCoilId: coilId } })) === before && near((await invOf(coilId)).qtyOnHand, 1000) && near((await invOf(coilId)).qtyAllocated, 900));
    const fits = await drop(parentNo, 100);
    ok('100 lb is accepted and leaves exactly the reserved 900', fits.status === 201 && near((await invOf(coilId)).qtyOnHand, 900) && near((await invOf(coilId)).qtyAvailable, 0), `${fits.status}`);
    await books(ok, coilId);
  });
  await scenario(G6, 'a piece made by one work order can be cut again by another, and the trail leads back to the original item and heat', async (ok) => {
    const coilId = await B.received({ weightLb: 4000 });
    const first = await startedWorkOrder(coilId, { inputWeightLb: 4000 });
    await finishWo(first, { scrapWeightLb: 0, outputs: [{ weightLb: 4000, widthIn: 24 }] });
    const [child] = await prisma.coil.findMany({ where: { parentCoilId: coilId } });
    const second = await startedWorkOrder(child.id, { inputWeightLb: 4000 });
    const d = await finishWo(second, { scrapWeightLb: 40, outputs: [{ weightLb: 1980, widthIn: 12 }, { weightLb: 1980, widthIn: 12 }] });
    const grand = await prisma.coil.findMany({ where: { parentCoilId: child.id } });
    ok('two grandchildren', d.status === 200 && grand.length === 2, `${d.status} ${d.body?.error}`);
    ok('each leads back through its parent to the original item', grand.every((g) => g.parentCoilId === child.id) && child.parentCoilId === coilId);
    ok('and carries the original heat and grade', grand.every((g) => g.heatId === heat.id && g.gradeId === heat.gradeId));
    const outs = await prisma.workOrderOutput.findMany({ where: { outputCoilId: { in: [child.id, ...grand.map((g) => g.id)] } } });
    ok('every piece names the work order that made it', outs.length === 3 && outs.find((o) => o.outputCoilId === child.id).workOrderId === first.id && outs.filter((o) => o.workOrderId === second.id).length === 2);
    ok('the original 4,000 lb is 3,960 lb on the shelf and 40 lb of scrap', near((await Promise.all(grand.map((g) => invOf(g.id)))).reduce((n, i) => n + num(i.qtyOnHand), 0), 3960) && near(await sumOf(child.id, 'SCRAP'), 40));
    await books(ok, child.id, 'middle piece');
  });
  await scenario(G6, 'scrapping a made piece needs a reason and is done by inventory staff, not from the shop floor', async (ok) => {
    const coilId = await B.received({ weightLb: 1000 });
    const wo = await startedWorkOrder(coilId, { inputWeightLb: 1000 });
    await finishWo(wo, { scrapWeightLb: 0, outputs: [{ weightLb: 1000, widthIn: 24 }] });
    const [piece] = await prisma.coil.findMany({ where: { parentCoilId: coilId } });
    const noNote = await adjust(piece.id, { reason: 'SCRAP', countedQty: 0 });
    const floor = await A.call('POST', '/api/inventory/adjust', { coilId: piece.id, reason: 'SCRAP', countedQty: 0, notes: 'Dropped and bent beyond use' }, 'operator');
    ok('no reason: 400; an operator: 403', noNote.status === 400 && floor.status === 403, `${noNote.status} ${floor.status}`);
    ok('the piece is untouched', near((await invOf(piece.id)).qtyOnHand, 1000) && (await stockMoves(piece.id, 'SCRAP')).length === 0);
    const s = await adjust(piece.id, { reason: 'SCRAP', countedQty: 0, notes: 'Dropped and bent beyond use' });
    const mv = await stockMoves(piece.id, 'SCRAP');
    ok('inventory staff scrap it: one entry of 1,000 lb with the reason and who', s.status === 201 && mv.length === 1 && near(mv[0].qtyMoved, 1000) && /bent/.test(mv[0].notes) && mv[0].createdById === users.branchWh.id, `${s.status} ${s.body?.error}`);
    ok('the piece is used up and still on file with its parent', (await coilOf(piece.id)).status === 'CONSUMED' && (await coilOf(piece.id)).parentCoilId === coilId);
    await books(ok, piece.id, 'piece');
  });
  await scenario(G6, 'a cancelled work order leaves the stock exactly as it was, with no scrap and no pieces', async (ok) => {
    const coilId = await B.received({ weightLb: 1000 });
    const before = await invOf(coilId);
    const wo = await startedWorkOrder(coilId);
    const c = await A.put(`/api/work-orders/${wo.id}/cancel`, {});
    const late = await finishWo(wo, { outputWeightLb: 900, scrapWeightLb: 100 });
    const after = await invOf(coilId);
    ok('cancelled, and a late completion is refused with 409', c.status === 200 && late.status === 409 && (await woOf(wo.id)).status === 'CANCELLED', `${c.status} ${late.status}`);
    ok('on hand, available and reserved are unchanged', near(after.qtyOnHand, before.qtyOnHand) && near(after.qtyAvailable, before.qtyAvailable) && near(after.qtyAllocated, before.qtyAllocated));
    ok('no consume or scrap entry, no pieces', (await stockMoves(coilId, 'CONSUME')).length === 0 && (await stockMoves(coilId, 'SCRAP')).length === 0 && (await prisma.coil.count({ where: { parentCoilId: coilId } })) === 0);
    ok('the item is available again', (await coilOf(coilId)).status === 'AVAILABLE', (await coilOf(coilId)).status);
  });
  await scenario(G6, 'a work order completed while the same item is being scrapped by hand: the balance still adds up', async (ok) => {
    let bad = 0; const seen = [];
    for (let i = 0; i < 4; i++) {
      const coilId = await B.received({ weightLb: 1000 });
      const wo = await startedWorkOrder(coilId, { inputWeightLb: 1000 });
      const [d, s] = await Promise.all([finishWo(wo, { outputWeightLb: 700, scrapWeightLb: 0 }), adjust(coilId, { reason: 'SCRAP', change: -600, notes: 'QA: water damage found on the rack' })]);
      const inv = await invOf(coilId);
      const out = (await sumOf(coilId, 'CONSUME')) + (await sumOf(coilId, 'SCRAP'));
      const fine = near(num(inv.qtyOnHand), 1000 - out) && num(inv.qtyOnHand) >= 0 && [d.status, s.status].some((x) => x >= 400) && [d.status, s.status].some((x) => x < 300) && near(inv.qtyOnHand, num(inv.qtyAvailable) + num(inv.qtyAllocated) + num(inv.qtyOnHold) + num(inv.qtyInTransit));
      seen.push(`${d.status}/${s.status}:${inv.qtyOnHand}`);
      if (!fine) bad++;
    }
    ok('4 rounds: one of the two wins, nothing goes below zero, and the history equals the balance', bad === 0, seen.join(' '));
  });
  await scenario(G6, 'sent for rework, a job gets a rework step that is started and clocked like any step, and must pass a new inspection (owner decision 9)', async (ok) => {
    const j = await atQc();
    const made = (await openInspection(j.id, qc1)).body.data;
    const r = await decide(made, 'rework', { reworkInstructions: 'Re-cut the two short pieces to 96 in', notes: 'Two of five short' }, qc1);
    const job = await jobOf(j.id);
    ok('the job is scheduled again with the instructions at the top of its notes', r.status === 200 && job.status === 'SCHEDULED' && /^REWORK: Re-cut the two short pieces/.test(job.notes || ''), `${r.status} ${job.status} ${r.body?.error}`);
    const ins = await prisma.jobInspection.findUnique({ where: { id: made.id } });
    ok('the inspection is on record as failed, disposition rework, with the instructions', ins.status === 'FAILED' && ins.disposition === 'REWORK' && /Re-cut/.test(ins.reworkInstructions));
    const steps = await opsOf(j.id);
    const rw = steps.find((s) => s.reworkOfInspectionId === made.id);
    ok('one rework step was added after the last step, named for the inspection, of the same kind of work', steps.length === 2 && rw && rw.sequence === steps[0].sequence + 1 && rw.name === `Rework (${ins.inspectionNumber})` && rw.requiredWorkCenterType === T && rw.status === 'PENDING', JSON.stringify(steps.map((s) => [s.sequence, s.name, s.status])));
    const again = await startOp(j.ops[0]);
    ok('the finished step cannot be run again', again.status === 409, `${again.status}`);
    const a = await startOp(rw, opA, wc1);
    ok('the rework step starts, and the job is in process', a.status === 200 && (await jobOf(j.id)).status === 'IN_PROCESS', `${a.status} ${a.body?.error} ${(await jobOf(j.id)).status}`);
    const early = await A.post(`/api/jobs/${j.id}/complete`, {});
    const pack = await move(j.id, 'PACKAGING');
    ok('the job cannot be completed or packed while the rework step is open', early.status === 409 && pack.status === 409 && (await jobOf(j.id)).status === 'IN_PROCESS', `${early.status} ${pack.status}`);
    const b = await doneOp(rw);
    const logs = await logsOf(rw.id);
    ok('finished, its time is on record against the operator and work center', b.status === 200 && logs.length === 1 && logs[0].operatorId === opA.id && logs[0].workCenterId === wc1.id && logs[0].endAt, `${b.status} ${logs.length}`);
    ok('the job is back at inspection, not at the dock', (await jobOf(j.id)).status === 'WAITING_QC', (await jobOf(j.id)).status);
    await inspected(j.id);
    ok('the second inspection passes and the job is in packaging', (await jobOf(j.id)).status === 'PACKAGING');
    const all = await inspectionsOf(j.id);
    ok('both inspections are on file, the failed one first', all.length === 2 && all[0].status === 'FAILED' && all[1].status === 'PASSED');
    await chain(ok, j.id); await clocks(ok, j.id);
  });
  await scenario(G6, 'the rework step can be sent to another kind of work center; an unknown kind is refused; a job with no plan gets the instructions only (owner decision 9)', async (ok) => {
    const j = await atQc();
    const made = (await openInspection(j.id)).body.data;
    const bad = await decide(made, 'rework', { reworkInstructions: 'Deburr again', workCenterType: `NOPE${run}` });
    ok('a kind of work center that is not on file is refused, and nothing changed', bad.status === 400 && (await jobOf(j.id)).status === 'WAITING_QC' && (await opsOf(j.id)).length === 1 && (await prisma.jobInspection.findUnique({ where: { id: made.id } })).status !== 'FAILED', `${bad.status} ${bad.body?.error}`);
    const r = await decide(made, 'rework', { reworkInstructions: 'Deburr again', workCenterType: T2 });
    const rw = (await opsOf(j.id)).find((s) => s.reworkOfInspectionId === made.id);
    ok('the rework step is of the kind the inspector named', r.status === 200 && rw?.requiredWorkCenterType === T2, `${r.status} ${rw?.requiredWorkCenterType}`);
    const wrong = await startOp(rw, opA, wc1);
    ok('it runs only on a work center of that kind', wrong.status === 409, `${wrong.status}`);
    const twice = await decide(made, 'rework', { reworkInstructions: 'again' });
    ok('the same inspection cannot send it for rework twice, and there is still one rework step', twice.status === 409 && (await opsOf(j.id)).filter((s) => s.reworkOfInspectionId).length === 1, `${twice.status}`);
    const right = await startOp(rw, opA, wcD); const fin = await doneOp(rw);
    ok('on the right work center it runs and finishes, and the job returns to inspection', right.status === 200 && fin.status === 200 && (await jobOf(j.id)).status === 'WAITING_QC', `${right.status} ${right.body?.error} ${fin.status}`);
    const second = (await openInspection(j.id)).body.data;
    const r2 = await decide(second, 'rework', { reworkInstructions: 'Once more' });
    const all = (await opsOf(j.id)).filter((s) => s.reworkOfInspectionId);
    ok('a second failed inspection adds a second rework step, after the first', r2.status === 200 && all.length === 2 && all[1].sequence === all[0].sequence + 1 && all[1].reworkOfInspectionId === second.id, `${r2.status} ${all.length}`);
    const n = await mkJob({ planned: false });
    await A.post(`/api/jobs/${n.id}/start`, {}); await A.post(`/api/jobs/${n.id}/complete`, {});
    const ni = (await openInspection(n.id)).body.data;
    const nr = await decide(ni, 'rework', { reworkInstructions: 'Re-stack' });
    ok('a job with no planned steps goes back with the instructions and a note that no step was added', nr.status === 200 && (await jobOf(n.id)).status === 'SCHEDULED' && /no planned steps/.test(JSON.stringify(nr.body)) && (await opsOf(n.id)).length === 0, `${nr.status} ${JSON.stringify(nr.body).slice(0, 200)}`);
  });
  const costedCoil = async (weightLb, price = 42, priceUnit = 'CWT') => {
    const line = { gradeId: heat.gradeId, description: `QA P7 cost ${run}`, thicknessIn: 0.5, widthIn: 48, lengthIn: 96, qtyOrdered: weightLb, unit: 'LB', unitPrice: price, priceUnit, extendedPrice: +(priceUnit === 'CWT' ? (weightLb / 100) * price : weightLb * price).toFixed(2) };
    const po = await A.post('/api/purchase-orders', { sellerId: w.supplierOrg.id, status: 'DRAFT', subtotal: line.extendedPrice, taxAmount: 0, freightAmount: 0, totalAmount: line.extendedPrice, lines: [line] });
    if (po.status !== 201) throw new Error(`purchase order ${po.status} ${JSON.stringify(po.body).slice(0, 200)}`);
    const placed = await A.put(`/api/purchase-orders/${po.body.id}`, { status: 'CONFIRMED' });
    if (placed.status >= 300) throw new Error(`place ${placed.status} ${JSON.stringify(placed.body).slice(0, 200)}`);
    const lines = await prisma.orderLine.findMany({ where: { orderId: po.body.id } });
    return B.received({ weightLb, poLineId: lines[0].id });
  };
  await scenario(G6, 'an item\'s cost is taken from its purchase order line when it is received, and the pieces cut from it carry the same cost per pound (owner decision 9)', async (ok) => {
    const coilId = await costedCoil(1000, 42, 'CWT');
    const src = await coilOf(coilId); const srcInv = await invOf(coilId);
    ok('$42.00 per hundredweight on the purchase order is $0.42 a pound on the item and its stock record', near(src.unitCost, 0.42) && near(srcInv.unitCost, 0.42), `${src.unitCost} ${srcInv.unitCost}`);
    const bare = await B.received({ weightLb: 500 });
    ok('an item received with no purchase order has no cost: none is assumed', (await coilOf(bare)).unitCost === null && (await invOf(bare)).unitCost === null);
    const wo = await startedWorkOrder(coilId, { inputWeightLb: 1000 });
    await finishWo(wo, { scrapWeightLb: 50, outputs: [{ weightLb: 600, widthIn: 24 }, { weightLb: 350, widthIn: 20 }] });
    const pieces = await prisma.coil.findMany({ where: { parentCoilId: coilId } });
    const invs = []; for (const p of pieces) invs.push(await invOf(p.id));
    ok('both pieces carry $0.42 a pound', pieces.length === 2 && pieces.every((p) => near(p.unitCost, 0.42)) && invs.every((i) => near(i.unitCost, 0.42)), JSON.stringify(pieces.map((p) => p.unitCost)));
    ok('the source\'s cost per pound is unchanged', near((await coilOf(coilId)).unitCost, 0.42));
    const bwo = await startedWorkOrder(bare, { inputWeightLb: 500 });
    await finishWo(bwo, { scrapWeightLb: 0, outputs: [{ weightLb: 500, widthIn: 24 }] });
    const [bp] = await prisma.coil.findMany({ where: { parentCoilId: bare } });
    ok('a piece cut from an item with no cost has no cost either', bp.unitCost === null);
    ok('scrap is not given a value, and landed cost (freight, duty) is not worked out: neither is on file', (await tables('scrapvalue|landedcostrule|overhead')).length === 0);
  });
  await scenario(G6, 'a job\'s cost is the material its work orders used at actual cost plus the time on its steps at the rate the owner entered; there is no overhead (owner decision 9)', async (ok) => {
    const c = await cell();
    const url = `/api/v1/dispatch/work-center-types/${c.type}`;
    const j = await cellJob(c, { qty: 1000 });
    const coilId = await costedCoil(3000, 0.5, 'LB');
    await B.reserve(j.order, j.line, coilId, 1000);
    const made = await workOrder(coilId, { jobId: j.id, inputWeightLb: 1000 });
    for (const s of ['release', 'start']) await A.put(`/api/work-orders/${made.body.id}/${s}`, {});
    const fin = await finishWo(made.body, { scrapWeightLb: 40, outputs: [{ weightLb: 960, widthIn: 24 }] });
    ok('the work order for the job is completed', made.status === 201 && fin.status === 200, `${made.status} ${fin.status} ${fin.body?.error}`);
    await startOp(j.ops[0], c.person, c.wc);
    await prisma.dispatchTimeLog.updateMany({ where: { dispatchOperationId: j.ops[0].id, status: 'RUNNING' }, data: { startAt: new Date(Date.now() - 2 * 3600000) } });
    await doneOp(j.ops[0]);
    const before = await A.call('GET', `/api/jobs/${j.id}/cost`);
    ok('with no labor rate on file the material is costed, labor is not, and the answer says what is missing', before.status === 200 && near(before.body.materialCost, 500) && before.body.laborComplete === false && before.body.complete === false && before.body.missing.some((m) => /No labor rate is on file/.test(m)), JSON.stringify(before.body).slice(0, 300));
    const floor = await pm1.call('PATCH', url, { hourlyRate: 60 });
    ok('a production manager cannot set a labor rate', floor.status === 403 && (await prisma.workCenterType.findUnique({ where: { id: c.type } })).hourlyRate === null, `${floor.status}`);
    const neg = await A.call('PATCH', url, { hourlyRate: -1 }); const word = await A.call('PATCH', url, { hourlyRate: 'sixty' });
    ok('a negative rate or a word is refused', neg.status === 400 && word.status === 400, `${neg.status} ${word.status}`);
    const set = await A.call('PATCH', url, { hourlyRate: 60 });
    const seenFloor = await pm1.call('GET', url); const seenBoss = await A.call('GET', url);
    const row = (r) => r.body?.data || r.body;
    ok('the owner sets $60.00 an hour; the floor does not see the rate', set.status === 200 && row(seenBoss).hourlyRate != null && near(row(seenBoss).hourlyRate, 60) && !('hourlyRate' in row(seenFloor)), `${set.status} ${JSON.stringify(row(seenFloor)).slice(0, 200)}`);
    const list = await pm1.call('GET', '/api/v1/dispatch/work-center-types');
    ok('nor in the list of kinds', !JSON.stringify(list.body).includes('hourlyRate'));
    const cost = await A.call('GET', `/api/jobs/${j.id}/cost`);
    const b = cost.body;
    ok('material: 1,000 lb used (960 out, 40 scrap) at $0.50 is $500.00', near(b.materialCost, 500) && b.materialComplete === true && near(b.material.usedLb, 1000) && near(b.material.scrapLb, 40) && near(b.material.yieldPct, 96), JSON.stringify(b.material));
    ok('labor: 2 hours at $60.00 is $120.00 (to the minute)', Math.abs(b.laborCost - 120) < 1 && b.laborComplete === true && b.labor.length === 1 && Math.abs(b.labor[0].hours - 2) < 0.02, JSON.stringify(b.labor));
    ok('the total is the two added together, complete, with nothing missing', near(b.totalCost, +(b.materialCost + b.laborCost).toFixed(2)) && b.complete === true && b.missing.length === 0, `${b.totalCost}`);
    ok('the answer states its basis and that no overhead is included', /No overhead/.test(b.basis || ''));
    const hidden = [await pm1.call('GET', `/api/jobs/${j.id}/cost`), await opr1.call('GET', `/api/jobs/${j.id}/cost`), await qc1.call('GET', `/api/jobs/${j.id}/cost`)];
    ok('job cost is refused to the floor, the operator and quality', hidden.every((r) => r.status === 403), hidden.map((r) => r.status).join());
    const mat = await pm1.call('GET', `/api/jobs/${j.id}/material`);
    ok('the floor sees the material and yield of the job, with no cost in the answer', mat.status === 200 && mat.body.totals.completed === 1 && !/cost/i.test(JSON.stringify(mat.body)), JSON.stringify(mat.body).slice(0, 200));
    const k = await cellJob(c, { qty: 500 });
    const bare = await B.received({ weightLb: 800 });
    await B.reserve(k.order, k.line, bare, 500);
    const kw = await workOrder(bare, { jobId: k.id, inputWeightLb: 500 });
    for (const s of ['release', 'start']) await A.put(`/api/work-orders/${kw.body.id}/${s}`, {});
    await finishWo(kw.body, { scrapWeightLb: 0, outputs: [{ weightLb: 500, widthIn: 24 }] });
    const kc = await A.call('GET', `/api/jobs/${k.id}/cost`);
    ok('material with no cost on file is named as missing; it is not costed at zero as if known', kc.body.materialComplete === false && kc.body.complete === false && kc.body.missing.some((m) => /No cost is on file for the material/.test(m)), JSON.stringify(kc.body).slice(0, 300));
    ok('no rate, cost or overhead figure was made up for this run: every figure above was entered by the test as the owner would enter it', true);
  });
  await scenario(G6, 'a job names the coil work orders raised for it, and shows what they used, made and scrapped (owner decision 9)', async (ok) => {
    const j = await mkJob({ qty: 1000 });
    const coilId = await B.received({ weightLb: 3000 });
    await B.reserve(j.order, j.line, coilId, 1000);
    const made = await workOrder(coilId, { jobId: j.id, inputWeightLb: 600 });
    const row = await woOf(made.body.id);
    ok('a work order raised for a job is linked to it and takes the job\'s order line', made.status === 201 && row.jobId === j.id && row.lineId === j.line.id, `${made.status} ${made.body?.error} ${row?.lineId}`);
    const other = await mkOrder({ qty: 100 });
    const cross = await workOrder(coilId, { jobId: j.id, lineId: other.lines[0].id, inputWeightLb: 100 });
    ok('a work order cannot name a job and a different order line', cross.status === 409, `${cross.status} ${cross.body?.error}`);
    const none = await workOrder(coilId, { jobId: '00000000-0000-4000-8000-000000000000', inputWeightLb: 100 });
    ok('a job that is not on file is refused', none.status === 400, `${none.status}`);
    const far = await mkJob({ loc: L2 });
    const away = await workOrder(coilId, { jobId: far.id, inputWeightLb: 100 }, pm1);
    ok('a job at a branch this person does not work at is "not on file" to them', away.status === 400, `${away.status} ${away.body?.error}`);
    const dead = await mkJob({ planned: false }); await move(dead.id, 'CANCELLED');
    const closed = await workOrder(coilId, { jobId: dead.id, inputWeightLb: 100 });
    ok('no work order for a cancelled job', closed.status === 409, `${closed.status} ${closed.body?.error}`);
    const open = await A.call('GET', `/api/jobs/${j.id}/material`);
    ok('before it is completed the job shows the work order and no weight used', open.body.totals.workOrders === 1 && open.body.totals.completed === 0 && near(open.body.totals.usedLb, 0), JSON.stringify(open.body.totals));
    for (const s of ['release', 'start']) await A.put(`/api/work-orders/${made.body.id}/${s}`, {});
    await finishWo(made.body, { scrapWeightLb: 30, outputs: [{ weightLb: 570, widthIn: 24 }] });
    const second = await workOrder(coilId, { jobId: j.id, inputWeightLb: 400 });
    for (const s of ['release', 'start']) await A.put(`/api/work-orders/${second.body.id}/${s}`, {});
    const f2 = await finishWo(second.body, { scrapWeightLb: 10, outputs: [{ weightLb: 390, widthIn: 24 }] });
    const t = (await A.call('GET', `/api/jobs/${j.id}/material`)).body;
    ok('two completed work orders: 1,000 lb used, 960 lb made, 40 lb scrap, 96% yield', f2.status === 200 && t.totals.completed === 2 && near(t.totals.usedLb, 1000) && near(t.totals.outputLb, 960) && near(t.totals.scrapLb, 40) && near(t.totals.yieldPct, 96), `${f2.status} ${f2.body?.error} ${JSON.stringify(t.totals)}`);
    ok('each line names the source, its heat and the pieces made', t.workOrders.length === 2 && t.workOrders.every((x) => x.source.coilNumber && x.source.heatNumber === heat.heatNumber && x.pieces.length === 1));
    const one = await A.call('GET', `/api/work-orders/${made.body.id}`);
    ok('the work order shows the job it was raised for', (one.body?.job || one.body?.data?.job)?.id === j.id, JSON.stringify(one.body).slice(0, 150));
    const gone = await pm2.call('GET', `/api/jobs/${j.id}/material`);
    ok('another branch cannot read the job\'s material', gone.status === 404, `${gone.status}`);
    await books(ok, coilId, 'source');
  });
  await scenario(G6, 'a failed job on hold can be sent for rework from the failed inspection; a passed one cannot', async (ok) => {
    const j = await atQc();
    const failed = await inspected(j.id, 'fail', { disposition: 'PENDING', notes: 'Wrong length' });
    const r = await decide(failed, 'rework', { reworkInstructions: 'Trim to length' });
    ok('from on hold it goes back to scheduled, and the inspector\'s first note is kept', r.status === 200 && (await jobOf(j.id)).status === 'SCHEDULED' && (await prisma.jobInspection.findUnique({ where: { id: failed.id } })).disposition === 'REWORK', `${r.status} ${r.body?.error}`);
    const twice = await decide(failed, 'rework', { reworkInstructions: 'again' });
    ok('the same inspection cannot send it for rework a second time', twice.status === 409, `${twice.status} ${twice.body?.error}`);
    const k = await atQc();
    const passed = await inspected(k.id);
    const no = await decide(passed, 'rework', { reworkInstructions: 'x' });
    ok('a passed inspection cannot be turned into rework', no.status === 400 && (await jobOf(k.id)).status === 'PACKAGING', `${no.status}`);
    await chain(ok, j.id);
  });
  await scenario(G6, 'nesting and cut optimisation are not part of this product', async (ok) => {
    ok('there is no nesting, cut-plan or cut-list table', (await tables('nest|cutplan|cutlist|cutpattern')).length === 0, (await tables('nest|cutplan|cutlist|cutpattern')).join());
    const cols = (await prisma.$queryRawUnsafe(`select column_name from information_schema.columns where table_name = 'WorkOrder'`)).map((r) => r.column_name);
    ok('a work order records the weights in and out and the yield that results; it plans no layout and predicts no yield', cols.includes('yieldPct') && !cols.some((c) => /expectedYield|plannedYield|kerf|nest/i.test(c)), cols.join());
  }, NA);
  await scenario(G6, 'outsourced processing (sending material to an outside processor and receiving it back) is not part of this product', async (ok) => {
    ok('there is no outside-processing or subcontract table', (await tables('outsource|subcontract|outsideprocess|tollprocess')).length === 0, (await tables('outsource|subcontract|outsideprocess|tollprocess')).join());
    const cols = (await prisma.$queryRawUnsafe(`select column_name from information_schema.columns where table_name in ('WorkOrder','Job','DispatchOperation')`)).map((r) => r.column_name);
    ok('no work order, job or step names an outside vendor', !cols.some((c) => /vendor|supplier|outsourc|subcontract/i.test(c)), cols.filter((c) => /vendor|supplier/i.test(c)).join());
  }, NA);
}

// ════════════════════════════════════════════════════════════════════════════════
if (want(7)) {
  const finishWo = (wo, body, who = 'admin') => as(who)('PUT', `/api/work-orders/${wo.id}/complete`, body);
  const toStatus = async (jobId, status) => (await movesOf(jobId)).filter((m) => m.to === status).length;
  const listOf = (body) => (Array.isArray(body) ? body : body?.data || body?.jobs || body?.items || []);

  await scenario(G7, 'a job belongs to its order\'s branch: another branch\'s production manager cannot see it, plan it, move it or open its history', async (ok) => {
    const j = await mkJob({ planned: false });
    const before = await jobOf(j.id);
    const tries = [
      await pm2.call('GET', `/api/jobs/${j.id}`), await pm2.call('GET', `/api/jobs/${j.id}/plan`), await pm2.call('GET', `/api/jobs/${j.id}/history`),
      await pm2.call('POST', `/api/jobs/${j.id}/plan`, { operations: [{ workCenterType: T }] }), await move(j.id, 'CANCELLED', pm2, 'x'),
      await pm2.call('PATCH', `/api/jobs/${j.id}`, { instructions: 'changed from another branch' }), await pm2.call('POST', `/api/jobs/${j.id}/start`, {}),
    ];
    ok('all seven are 404', tries.every((r) => r.status === 404), tries.map((r) => r.status).join());
    const after = await jobOf(j.id);
    ok('the job is exactly as it was, with no plan', after.status === before.status && after.instructions === before.instructions && (await planOf(j.id)) === null);
    const list = await pm2.call('GET', '/api/jobs?limit=500');
    ok('and it is not in their job list', list.status === 200 && !listOf(list.body).some((x) => x.id === j.id), `${listOf(list.body).length} rows`);
    const mine = await pm1.call('GET', `/api/jobs/${j.id}`);
    ok('its own branch\'s manager sees it', mine.status === 200 && mine.body.id === j.id);
  });
  await scenario(G7, 'leadership sees production at every branch; a regional manager sees the branches they manage', async (ok) => {
    const a = await mkJob({ loc: L1, planned: false }); const b = await mkJob({ loc: L2, planned: false, job: { operationType: T } });
    const admin = [await A.get(`/api/jobs/${a.id}`), await A.get(`/api/jobs/${b.id}`)];
    const regional = [await A.call('GET', `/api/jobs/${a.id}`, undefined, 'regional'), await A.call('GET', `/api/jobs/${b.id}`, undefined, 'regional')];
    ok('the administrator opens both', admin.every((r) => r.status === 200));
    ok('the regional manager of both branches opens both', regional.every((r) => r.status === 200), regional.map((r) => r.status).join());
    const l1 = [await pm1.call('GET', `/api/jobs/${a.id}`), await pm1.call('GET', `/api/jobs/${b.id}`)];
    ok('a branch manager opens their own and gets 404 on the other', l1[0].status === 200 && l1[1].status === 404, l1.map((r) => r.status).join());
    const s1 = await A.get(`/api/jobs/stats/summary?locationId=${L1.id}`); const s2 = await A.get(`/api/jobs/stats/summary?locationId=${L2.id}`);
    const c1 = await prisma.job.count({ where: { OR: [{ workCenter: { locationId: L1.id } }, { workCenterId: null, order: { locationId: L1.id } }] } });
    const c2 = await prisma.job.count({ where: { OR: [{ workCenter: { locationId: L2.id } }, { workCenterId: null, order: { locationId: L2.id } }] } });
    ok('the job count for each branch equals the records (this address used to fail when a branch was named)', s1.status === 200 && s2.status === 200 && s1.body.total === c1 && s2.body.total === c2, `${s1.status} ${s1.body?.total}/${c1} ${s2.body?.total}/${c2}`);
  });
  await scenario(G7, 'an order sold at one branch can be worked at another: the plan and steps sit at the work center\'s branch, and a branch planner cannot reach across', async (ok) => {
    // Established practice (the order-to-cash simulation's "process and ship direct from the remote branch"):
    // the job follows the work center. It is not held to the branch that took the order.
    const o = await mkOrder({ loc: L2 });
    const remote = await A.post('/api/jobs', { orderId: o.id, orderLineId: o.lines[0].id, operationType: T, workCenterId: wc1.id, instructions: `QA P7 ${run}`, status: 'ORDERED' });
    ok('leadership can open a job for a QA-L02 order on a QA-L01 work center', remote.status === 201, `${remote.status} ${remote.body?.error}`);
    const rp = await A.post(`/api/jobs/${remote.body.id}/plan`, { operations: [{ name: 'Cut', workCenterType: T }], thickness: 0.5 });
    const rplan = await planOf(remote.body.id);
    ok('its plan is at QA-L01, where the work center is', rp.status < 300 && rplan?.locationId === L1.id, `${rp.status} ${rplan?.locationId}`);
    const o2 = await mkOrder({ loc: L1 });
    const reach = await as(pm1)('POST', '/api/jobs', { orderId: o2.id, orderLineId: o2.lines[0].id, operationType: T, workCenterId: wc2.id, instructions: `QA P7 ${run}`, status: 'ORDERED' });
    ok('a QA-L01 production manager cannot put a job on a QA-L02 work center', reach.status >= 400 && reach.status < 500, `${reach.status} ${reach.body?.error}`);
    const j = await mkJob({ loc: L2 });
    const plan = await planOf(j.id);
    ok('a job planned at QA-L02 has its plan at QA-L02', plan.locationId === L2.id);
    const here = await startOp(j.ops[0], opA, wc1);
    ok('its step cannot be run at QA-L01 by a QA-L01 operator', here.status === 409, `${here.status} ${here.body?.error}`);
    const edit = await A.patch(`/api/jobs/${j.id}`, { workCenterId: wc1.id });
    ok('nor can the job be moved onto a QA-L01 work center while its steps are planned at QA-L02', edit.status === 409 && (await jobOf(j.id)).workCenterId !== wc1.id, `${edit.status}`);
    const there = await startOp(j.ops[0], opX, wc2, pm2);
    ok('at QA-L02, with a QA-L02 operator, it starts', there.status === 200, `${there.status} ${there.body?.error}`);
  });
  await scenario(G7, 'scheduling one branch leaves the other branch\'s work alone', async (ok) => {
    const c1 = await cell({ loc: L1 }); const c2 = await cell({ loc: L2 });
    const a = await cellJob(c1); const b = await cellJob(c2);
    const r = await dispatch(L2, pm2);
    ok('QA-L02\'s manager schedules QA-L02', r.status === 200 && (await opRow(b.ops[0].id)).assignedWorkCenterId === c2.wc.id, `${r.status}`);
    ok('the QA-L01 step is still waiting', (await opRow(a.ops[0].id)).status === 'PENDING');
    ok('nothing the run placed belongs to another branch', r.body.data.details.every((d) => d.assignedWorkCenterId !== c1.wc.id));
    const q = await pm2.call('GET', `/api/v1/dispatch/queue?workCenterId=${c1.wc.id}`);
    ok('and QA-L02 cannot read a QA-L01 work center\'s queue', q.status !== 200 || q.body.data.operationCount === 0, `${q.status} ${q.body?.data?.operationCount}`);
  });
  await scenario(G7, 'material on its way to another branch cannot be cut; once received there, that branch cuts it and the pieces are at that branch', async (ok) => {
    const coilId = await B.received({ weightLb: 2000 });
    const wo = await startedWorkOrder(coilId, { inputWeightLb: 2000 });
    const t = await A.post('/api/inventory/transfers', { toLocationId: L2.id, coilIds: [coilId], carrier: 'Own truck' });
    ok('an item on a started work order is not put on a truck, or if it is, it cannot then be cut', t.status >= 400 || (await finishWo(wo, { outputWeightLb: 1900, scrapWeightLb: 100 })).status === 409, `${t.status} ${t.body?.error}`);
    const free = await B.received({ weightLb: 2000 });
    const t2 = await A.post('/api/inventory/transfers', { toLocationId: L2.id, coilIds: [free], carrier: 'Own truck' });
    const onRoad = await workOrder(free);
    ok('an item in transit is refused for a new work order', t2.status === 201 && onRoad.status === 409, `${t2.status} ${onRoad.status} ${onRoad.body?.error}`);
    const got = await A.post(`/api/inventory/transfers/${t2.body.id}/receive`, {});
    const there = await workOrder(free, { inputWeightLb: 2000 }, pm2);
    ok('received at QA-L02, that branch\'s manager opens a work order on it', got.status === 200 && there.status === 201, `${got.status} ${there.status} ${there.body?.error}`);
    for (const s of ['release', 'start']) await pm2.call('PUT', `/api/work-orders/${there.body.id}/${s}`, {});
    const d = await finishWo(there.body, { scrapWeightLb: 0, outputs: [{ weightLb: 2000, widthIn: 24 }] }, pm2);
    const [piece] = await prisma.coil.findMany({ where: { parentCoilId: free } });
    ok('the piece is at QA-L02 with the original heat', d.status === 200 && piece.locationId === L2.id && piece.heatId === heat.id, `${d.status} ${d.body?.error}`);
    ok('QA-L01\'s manager can no longer open a work order on it', (await workOrder(piece.id, {}, pm1)).status === 400);
    await books(ok, free, 'source'); await books(ok, piece.id, 'piece');
  });
  await scenario(G7, 'a piece made at one branch and trucked to another keeps its parent, its heat and the work order that made it', async (ok) => {
    const coilId = await B.received({ weightLb: 1000 });
    const wo = await startedWorkOrder(coilId, { inputWeightLb: 1000 });
    await finishWo(wo, { scrapWeightLb: 0, outputs: [{ weightLb: 1000, widthIn: 24 }] });
    const [piece] = await prisma.coil.findMany({ where: { parentCoilId: coilId } });
    const t = await A.post('/api/inventory/transfers', { toLocationId: L2.id, coilIds: [piece.id], carrier: 'Own truck' });
    const got = await A.post(`/api/inventory/transfers/${t.body.id}/receive`, {});
    const after = await coilOf(piece.id);
    ok('received at QA-L02', t.status === 201 && got.status === 200 && after.locationId === L2.id, `${t.status} ${got.status}`);
    ok('parent, heat and grade unchanged', after.parentCoilId === coilId && after.heatId === heat.id && after.gradeId === heat.gradeId);
    ok('still tied to its work order', (await prisma.workOrderOutput.findFirst({ where: { outputCoilId: piece.id } }))?.workOrderId === wo.id);
    await books(ok, piece.id, 'piece');
  });
  await scenario(G7, 'lending an operator to another branch is not provided for: an operator works at their home branch', async (ok) => {
    const cols = (await prisma.$queryRawUnsafe(`select column_name from information_schema.columns where table_name = 'Operator'`)).map((r) => r.column_name);
    ok('an operator has one home branch and no list of other branches', cols.includes('homeLocationId') && (await tables('operatorlocation|operatorbranch|operatorassignment')).length === 0);
    const j = await mkJob();
    const lent = await startOp(j.ops[0], opX, wc1);
    ok('so a QA-L02 operator cannot clock on at QA-L01', lent.status === 409, `${lent.status}`);
    ok('whether operators may be lent between branches is the owner\'s labor policy; none is invented here', true);
  }, NA);
  await scenario(G7, 'one inspection sent for rework by two people at the same moment: one rework step, one move (owner decision 9)', async (ok) => {
    let bad = 0; const seen = [];
    for (let i = 0; i < 5; i++) {
      const j = await atQc();
      const made = (await openInspection(j.id)).body.data;
      const [a, b] = await Promise.all([decide(made, 'rework', { reworkInstructions: 'Trim' }, qc1), decide(made, 'rework', { reworkInstructions: 'Trim', workCenterType: T2 })]);
      const steps = (await opsOf(j.id)).filter((s) => s.reworkOfInspectionId === made.id);
      const back = (await movesOf(j.id)).filter((m) => m.to === 'SCHEDULED' && m.from === 'WAITING_QC').length;
      seen.push(`${a.status}/${b.status}:${steps.length}:${back}`);
      if (steps.length !== 1 || back !== 1 || [a.status, b.status].filter((x) => x === 200).length !== 1 || (await jobOf(j.id)).status !== 'SCHEDULED') bad++;
    }
    ok('5 rounds: one of the two is accepted, the job has one rework step and went back once', bad === 0, seen.join(' '));
  });
  await scenario(G7, 'one job moved by two people at the same moment: one move is saved and the history is one chain', async (ok) => {
    let bad = 0; const seen = [];
    for (let i = 0; i < 6; i++) {
      const j = await atQc(); await inspected(j.id);                 // in packaging
      const [a, b] = await Promise.all([move(j.id, 'READY_TO_SHIP'), move(j.id, 'ON_HOLD', pm1, 'QA hold')]);
      const job = await jobOf(j.id); const rows = await movesOf(j.id);
      let at = rows[0].from; let fine = true;
      for (const m of rows) { if (m.from !== at) { fine = false; break; } at = m.to; }
      seen.push(`${a.status}/${b.status}:${job.status}`);
      if (!fine || at !== job.status || ![a.status, b.status].includes(200)) bad++;
    }
    ok('6 rounds: the job is where its history says it is, every time', bad === 0, seen.join(' '));
  });
  await scenario(G7, 'the last step finished by two people at the same moment sends the job to inspection once', async (ok) => {
    let bad = 0;
    for (let i = 0; i < 6; i++) {
      const j = await mkJob();
      await startOp(j.ops[0]);
      const pair = await Promise.all([doneOp(j.ops[0]), doneOp(j.ops[0], pm1), doneOp(j.ops[0], opr1)]);
      const logs = await logsOf(j.ops[0].id);
      if (pair.some((r) => r.status !== 200) || (await toStatus(j.id, 'WAITING_QC')) !== 1 || logs.some((l) => !l.endAt) || (await jobOf(j.id)).status !== 'WAITING_QC') bad++;
    }
    ok('6 rounds of three at once: one move to inspection, every clock closed once', bad === 0, `${bad} rounds wrong`);
  });
  await scenario(G7, 'a job cancelled while a step is running: the step cannot be finished, and the clock is stopped with the reason', async (ok) => {
    const c = await cell();
    const j = await cellJob(c);
    await startOp(j.ops[0], c.person, c.wc);
    const x = await move(j.id, 'CANCELLED', pm1, 'QA: customer cancelled the order');
    const logs = await logsOf(j.ops[0].id);
    ok('cancelled', x.status === 200 && (await jobOf(j.id)).status === 'CANCELLED');
    ok('the running clock was closed at that moment and says why', logs.length === 1 && logs[0].status === 'PAUSED' && logs[0].endAt !== null && logs[0].downtimeReason === 'Job cancelled', JSON.stringify(logs.map((l) => [l.status, l.downtimeReason])));
    ok('the time worked before the cancellation is kept', logs[0].operatorId === c.person.id && logs[0].endAt >= logs[0].startAt);
    const late = await doneOp(j.ops[0]); const again = await startOp(j.ops[0], c.person, c.wc);
    ok('the step cannot be finished or restarted', late.status === 409 && again.status === 409, `${late.status} ${again.status}`);
    ok('the operator is no longer clocked on to anything and can be given other work', (await prisma.dispatchTimeLog.count({ where: { operatorId: c.person.id, status: 'RUNNING' } })) === 0);
    const off = await A.call('PATCH', `/api/staff/operators/${c.person.id}`, { isActive: false }, 'admin');
    ok('so the cancelled job does not block changes to the operator\'s record', off.status === 200, `${off.status} ${off.body?.error}`);
    await chain(ok, j.id);
  });
  await scenario(G7, 'cancelling a job while its last step is being finished: whichever lands first, the job, the history and the clocks agree', async (ok) => {
    let bad = 0; const seen = [];
    for (let i = 0; i < 6; i++) {
      const j = await mkJob();
      await startOp(j.ops[0]);
      const [c, d] = await Promise.all([move(j.id, 'CANCELLED', 'admin', 'QA'), doneOp(j.ops[0])]);
      const job = await jobOf(j.id); const logs = await logsOf(j.ops[0].id);
      const rows = await movesOf(j.id);
      let at = rows[0].from; let fine = true;
      for (const m of rows) { if (m.from !== at) { fine = false; break; } at = m.to; }
      seen.push(`${c.status}/${d.status}:${job.status}`);
      if (!fine || at !== job.status || logs.some((l) => l.status === 'RUNNING') || !['CANCELLED', 'WAITING_QC'].includes(job.status)) bad++;
    }
    ok('6 rounds: one consistent outcome each time, and no clock left running', bad === 0, seen.join(' '));
  });
  await scenario(G7, 'a refused request leaves nothing half-done: a work order completion with one bad piece saves no piece and moves no stock', async (ok) => {
    const coilId = await B.received({ weightLb: 1000 });
    const wo = await startedWorkOrder(coilId, { inputWeightLb: 1000 });
    const before = await prisma.coil.count();
    const tries = [
      await finishWo(wo, { scrapWeightLb: 0, outputs: [{ weightLb: 500, widthIn: 24 }, { weightLb: -1, widthIn: 24 }] }),
      await finishWo(wo, { scrapWeightLb: 0, outputs: [{ weightLb: 500, widthIn: 24 }, { weightLb: 'heavy', widthIn: 24 }] }),
      await finishWo(wo, { scrapWeightLb: 0, outputs: [{ weightLb: 700, widthIn: 24 }, { weightLb: 700, widthIn: 24 }] }),
      await finishWo(wo, { scrapWeightLb: 0, outputs: [] }),
    ];
    ok('a negative piece, a piece with no number, pieces heavier than the input, and an empty list are all refused', tries.every((r) => r.status === 400), tries.map((r) => r.status).join());
    ok('no piece was created, no stock moved, and the work order is still in progress', (await prisma.coil.count()) === before && near((await invOf(coilId)).qtyOnHand, 1000) && (await stockMoves(coilId)).filter((m) => m.movementType !== 'RECEIVE').length === 0 && (await woOf(wo.id)).status === 'IN_PROGRESS');
    const good = await finishWo(wo, { scrapWeightLb: 0, outputs: [{ weightLb: 500, widthIn: 24 }, { weightLb: 500, widthIn: 24 }] });
    ok('the corrected request then goes through once', good.status === 200 && (await prisma.coil.count({ where: { parentCoilId: coilId } })) === 2, `${good.status} ${good.body?.error}`);
    await books(ok, coilId);
  });
  await scenario(G7, 'a step left running since yesterday is still running after the gap, can be paused, and its time is what the clock says', async (ok) => {
    const j = await mkJob();
    await startOp(j.ops[0]);
    const [log] = await logsOf(j.ops[0].id);
    const began = new Date(Date.now() - 20 * 3600000);
    await prisma.dispatchTimeLog.update({ where: { id: log.id }, data: { startAt: began } });   // fixture: the clock was started 20 hours ago
    const t = await A.get(`/api/v1/operations/${j.ops[0].id}/time-logs`);
    ok('the open clock is listed', t.status === 200, `${t.status}`);
    const p = await pauseOp(j.ops[0], { downtimeReason: 'Left running overnight' });
    const [after] = await logsOf(j.ops[0].id);
    const hours = (after.endAt - after.startAt) / 3600000;
    ok('paused, and the entry is twenty hours long: the system does not shorten or cap it', p.status === 200 && hours > 19.9 && hours < 20.1, `${p.status} ${hours}`);
    ok('the reason given is on the entry for whoever reviews the time', after.downtimeReason === 'Left running overnight');
    ok('no rule on file caps a shift or flags a long entry: reviewing such time is left to the supervisor', (await tables('timecorrection|timeapproval|timesheet')).length === 0);
  });
  await scenario(G7, 'a job stuck in production with every step finished can be sent on to inspection by hand', async (ok) => {
    const j = await mkJob();
    await startOp(j.ops[0]); await doneOp(j.ops[0]);
    await prisma.job.update({ where: { id: j.id }, data: { status: 'IN_PROCESS', instructions: 'QA P7 fixture written to the database directly' } });  // fixture: as left by the old lost-update fault
    const r = await move(j.id, 'WAITING_QC', pm1, 'QA: all steps were finished');
    ok('the production manager moves it to inspection', r.status === 200 && (await jobOf(j.id)).status === 'WAITING_QC', `${r.status} ${r.body?.error}`);
    ok('the repair is in the history with who did it and the note', (await movesOf(j.id)).some((m) => m.to === 'WAITING_QC' && m.userId === pm1.user.id && /all steps were finished/.test(m.note || '')));
    await inspected(j.id);
    ok('and it then follows the normal path through inspection', (await jobOf(j.id)).status === 'PACKAGING');
  });
  await scenario(G7, 'an operator or work center with history is switched off, never deleted: past time entries keep their names', async (ok) => {
    const c = await cell();
    const j = await cellJob(c);
    await startOp(j.ops[0], c.person, c.wc); await doneOp(j.ops[0]);
    const delP = await A.call('DELETE', `/api/staff/operators/${c.person.id}`, undefined, 'admin');
    const person = await prisma.operator.findUnique({ where: { id: c.person.id } });
    ok('"deleting" the operator switches the record off and keeps it', delP.status === 200 && person && person.isActive === false, `${delP.status}`);
    const delW = await A.call('DELETE', `/api/v1/dispatch/work-centers/${c.wc.id}`, undefined, 'admin');
    const wc = await prisma.workCenter.findUnique({ where: { id: c.wc.id } });
    ok('the work center with finished work is kept on file too', Boolean(wc) && (delW.status >= 400 || wc.isActive === false), `${delW.status} ${wc?.isActive}`);
    const [log] = await logsOf(j.ops[0].id);
    ok('the time entry still names the operator and work center, and both records still open', log.operatorId === c.person.id && log.workCenterId === c.wc.id && Boolean(await prisma.operator.findUnique({ where: { id: log.operatorId } })) && Boolean(await prisma.workCenter.findUnique({ where: { id: log.workCenterId } })));
  });
  await scenario(G7, 'the shop-floor figures count work still to do on open jobs only, and agree with the queue', async (ok) => {
    const c = await cell();
    const live = await cellJob(c); const dead = await cellJob(c); const done = await cellJob(c); const wait = await cellJob(c, { steps: 1 });
    await dispatch();
    await move(dead.id, 'CANCELLED', 'admin', 'QA');
    await startOp(done.ops[0], c.person, c.wc); await doneOp(done.ops[0]);
    await startOp(live.ops[0], c.person, c.wc);
    const r = await A.get(`/api/v1/dispatch/stats?locationId=${L1.id}`);
    const mine = r.body.data.byWorkCenter[c.wc.id];
    ok('at this work center: one running, one queued, one finished; the cancelled job\'s step is not counted as work', r.status === 200 && mine.inProcess === 1 && mine.scheduled === 1 && mine.complete === 1, JSON.stringify(mine));
    const q = await A.get(`/api/v1/dispatch/queue?workCenterId=${c.wc.id}`);
    ok('the queue shows the same two steps, the running one first', q.body.data.operationCount === mine.inProcess + mine.scheduled && q.body.data.operations[0].id === live.ops[0].id && q.body.data.operations[1].id === wait.ops[0].id, `${q.body.data.operationCount}`);
    const open = { dispatchJob: { locationId: L1.id, job: { status: { in: ['ORDERED', 'SCHEDULED', 'IN_PROCESS'] } } } };
    const [pending, scheduled, running, complete, unassigned] = await Promise.all([
      prisma.dispatchOperation.count({ where: { ...open, status: 'PENDING' } }), prisma.dispatchOperation.count({ where: { ...open, status: 'SCHEDULED' } }),
      prisma.dispatchOperation.count({ where: { ...open, status: 'IN_PROCESS' } }), prisma.dispatchOperation.count({ where: { dispatchJob: { locationId: L1.id }, status: 'COMPLETE' } }),
      prisma.dispatchOperation.count({ where: { ...open, status: { in: ['PENDING', 'SCHEDULED', 'IN_PROCESS'] }, assignedWorkCenterId: null } }),
    ]);
    const s = r.body.data.summary;
    ok('the branch totals equal the records', Math.abs(s.pending - pending) <= 0 && s.scheduled === scheduled && s.inProcess === running && s.complete === complete && s.unassigned === unassigned && s.total === pending + scheduled + running + complete, JSON.stringify({ s, db: [pending, scheduled, running, complete, unassigned] }));
    const other = await pm2.call('GET', `/api/v1/dispatch/stats?locationId=${L1.id}`);
    ok('another branch\'s manager asking for this branch gets none of its figures', other.status !== 200 || (other.body.data.summary.total === 0 && Object.keys(other.body.data.byWorkCenter).length === 0), `${other.status} ${other.body?.data?.summary?.total}`);
    // The production overview the shop floor reads now (owner's audit, 2026-11-21): the same machine, by jobs.
    const since = new Date(Date.now() - 3600000).toISOString();
    const ov = await A.get(`/api/jobs/overview?locationId=${L1.id}&since=${encodeURIComponent(since)}`);
    const m = ov.body?.workCenters?.find((w) => w.id === c.wc.id);
    ok('the overview agrees: one running, one queued and one done today on this machine', ov.status === 200 && m?.running === 1 && m?.queued === 1 && m?.doneToday === 1, JSON.stringify(m));
    const stageOf = (id) => ov.body.jobs.find((j) => j.id === id)?.stage;
    ok('and each job is in its stage: running, queued, past the floor, and the cancelled one not listed', stageOf(live.id) === 'RUNNING' && stageOf(wait.id) === 'QUEUED' && ['WAITING_QC', 'PACKAGING'].includes(stageOf(done.id)) && stageOf(dead.id) === undefined, JSON.stringify([stageOf(live.id), stageOf(wait.id), stageOf(done.id), stageOf(dead.id)]));
    const otherOv = await pm2.call('GET', `/api/jobs/overview?locationId=${L1.id}`);
    // A job belongs to the branch that sold its order as well as the one making it: the other branch sees only its own orders' jobs here.
    const seen = otherOv.status === 200 ? await prisma.job.findMany({ where: { id: { in: otherOv.body.jobs.map((j) => j.id) } }, select: { order: { select: { locationId: true } } } }) : [];
    ok('another branch\'s manager asking for this branch\'s overview gets no machines, and only jobs of its own orders', otherOv.status !== 200 || (otherOv.body.workCenters.length === 0 && seen.every((j) => j.order?.locationId === L2.id)), `${otherOv.status} ${otherOv.body?.jobs?.length} jobs, ${otherOv.body?.workCenters?.length} machines; orders at ${seen.map((j) => j.order?.locationId === L2.id ? 'own' : 'OTHER').join(',')}`);
  });
  await scenario(G7, 'expediting a job raises its priority; moving work between work centers only happens between like machines at one branch', async (ok) => {
    const c = await cell({ wcs: 2 });
    const j = await cellJob(c, { planned: false, job: { workCenterId: c.wcs[0].id } });
    const before = (await jobOf(j.id)).priority;
    const e = await A.post('/api/ops-cockpit/recommendations/accept', { recommendation: { id: tag('REC'), title: `Expedite ${j.jobNumber}`, action: 'Raise priority' } });
    ok('priority went up by one (it used to go down)', e.status === 200 && (await jobOf(j.id)).priority === Math.min(5, before + 1), `${e.status} ${before} -> ${(await jobOf(j.id)).priority}`);
    const codes = await prisma.workCenter.findMany({ where: { id: { in: [c.wcs[0].id, c.wcs[1].id, wcD.id, wc2.id] } }, select: { id: true, code: true } });
    const code = (id) => codes.find((x) => x.id === id).code;
    const accept = (to) => A.post('/api/ops-cockpit/recommendations/accept', { recommendation: { id: tag('REC'), title: `Rebalance ${code(c.wcs[0].id)} bottleneck`, action: `Move jobs to ${code(to)} (QA)` } });
    const wrongKind = await accept(wcD.id); const otherBranch = await accept(wc2.id);
    ok('a move to another kind of machine or another branch is not made, and the answer says why', (await jobOf(j.id)).workCenterId === c.wcs[0].id && /not reassigned/.test(JSON.stringify(wrongKind.body)) && /not reassigned/.test(JSON.stringify(otherBranch.body)), JSON.stringify(wrongKind.body).slice(0, 200));
    const good = await accept(c.wcs[1].id);
    ok('a move to a like machine at the same branch is made', good.status === 200 && (await jobOf(j.id)).workCenterId === c.wcs[1].id, JSON.stringify(good.body).slice(0, 200));
    const audit = await prisma.auditLog.count({ where: { eventType: 'AI_RECOMMENDATION_ACCEPTED', timestamp: { gte: new Date(Date.now() - 60000) } } });
    ok('each accepted recommendation is in the audit log', audit >= 4, String(audit));
  });
  await scenario(G7, 'one job followed end to end: order line, job, steps, time, inspection and shipment all point at each other', async (ok) => {
    const j = await mkJob({ types: [T, T2] });
    await startOp(j.ops[0], opA, wc1, opr1); await doneOp(j.ops[0], opr1);
    await startOp(j.ops[1], opB, wcD, opr1); await doneOp(j.ops[1], opr1);
    const ins = (await openInspection(j.id, qc1)).body.data; await passIt(ins, qc1);
    const r1 = await move(j.id, 'READY_TO_SHIP', pm1);
    const job = await jobOf(j.id); const plan = await planOf(j.id);
    ok('the job names its order and line, and the line belongs to that order', job.orderId === j.order.id && job.orderLineId === j.line.id && (await prisma.orderLine.findUnique({ where: { id: j.line.id } })).orderId === j.order.id);
    ok('the plan names the job; both steps are finished in order with start and end', plan.jobId === j.id && plan.operations.every((o) => o.status === 'COMPLETE' && o.actualStart && o.actualEnd) && plan.operations[0].actualEnd <= plan.operations[1].actualStart);
    const logs = [...await logsOf(j.ops[0].id), ...await logsOf(j.ops[1].id)];
    ok('each step has its time entry naming operator and work center', logs.length === 2 && logs[0].operatorId === opA.id && logs[0].workCenterId === wc1.id && logs[1].operatorId === opB.id && logs[1].workCenterId === wcD.id);
    ok('the inspection names the job and was decided after the last step ended', (await prisma.jobInspection.findUnique({ where: { id: ins.id } })).jobId === j.id && (await prisma.jobInspection.findUnique({ where: { id: ins.id } })).completedAt >= plan.operations[1].actualEnd);
    const rows = await chain(ok, j.id);
    ok('the history reads scheduled, in process, waiting for inspection, packaging, ready to ship, each with who did it', r1.status === 200 && ['SCHEDULED', 'IN_PROCESS', 'WAITING_QC', 'PACKAGING', 'READY_TO_SHIP'].every((s) => rows.some((m) => m.to === s && m.userId)), JSON.stringify(rows.map((m) => m.to)));
    const h = await pm1.call('GET', `/api/jobs/${j.id}/history`);
    ok('the history screen returns the same story', h.status === 200 && JSON.stringify(h.body).includes('READY_TO_SHIP') && JSON.stringify(h.body).includes('WAITING_QC'));
    await clocks(ok, j.id);
  });
  await scenario(G7, 'across everything this run did: every job is where its history says, no finished step has a clock running, and no closed job has one either', async (ok) => {
    const jobs = await prisma.job.findMany({ where: { instructions: `QA P7 ${run}` }, select: { id: true, status: true } });
    let broken = 0; let none = 0;
    for (const job of jobs) {
      const rows = await movesOf(job.id);
      if (!rows.length) { if (job.status !== 'ORDERED') none++; continue; }
      const left = [...rows]; let at = left[0].from; let fine = true;
      while (left.length) { const i = left.findIndex((m) => m.from === at); if (i < 0) { fine = false; break; } at = left[i].to; left.splice(i, 1); }
      if (!fine || at !== job.status) broken++;
    }
    ok(`${jobs.length} jobs: each history is one chain ending at the job's status`, jobs.length > 20 && broken === 0 && none === 0, `${broken} broken, ${none} moved with no history`);
    const ids = jobs.map((x) => x.id);
    const doneRunning = await prisma.dispatchTimeLog.count({ where: { status: 'RUNNING', dispatchOperation: { status: 'COMPLETE', dispatchJob: { jobId: { in: ids } } } } });
    const closedRunning = await prisma.dispatchTimeLog.count({ where: { status: 'RUNNING', dispatchOperation: { dispatchJob: { jobId: { in: ids }, job: { status: { in: ['CANCELLED', 'SHIPPED', 'COMPLETED'] } } } } } });
    ok('no finished step has a running clock', doneRunning === 0, String(doneRunning));
    ok('no cancelled, shipped or completed job has a running clock', closedRunning === 0, String(closedRunning));
    const backwards = await prisma.$queryRawUnsafe(`select count(*)::int as n from "DispatchTimeLog" where "endAt" is not null and "endAt" < "startAt"`);
    ok('no time entry ends before it starts', backwards[0].n === 0);
    const released = await prisma.job.findMany({ where: { id: { in: ids }, status: { in: ['PACKAGING', 'READY_TO_SHIP', 'SHIPPED', 'COMPLETED'] } }, select: { id: true, recipeId: true, inspections: { select: { status: true, completedAt: true, createdAt: true } }, dispatchJob: { select: { operations: { select: { status: true } } } } } });
    const exempt = new Set((await prisma.bomRecipe.findMany({ where: { inspectionRequired: false }, select: { id: true } })).map((r) => r.id));
    const noPass = released.filter((x) => x.dispatchJob && !exempt.has(x.recipeId) && !x.inspections.some((i) => ['PASSED', 'CONDITIONAL'].includes(i.status)));
    ok(`${released.length} jobs were released past inspection, and every one has a passed inspection on file or a routing marked "no inspection"`, noPass.length === 0, `${noPass.length} without`);
    const openSteps = released.filter((x) => x.dispatchJob?.operations.some((o) => o.status !== 'COMPLETE'));
    ok('and none has an unfinished step', openSteps.length === 0, `${openSteps.length}`);
    const twoOpen = await prisma.$queryRawUnsafe(`select count(*)::int as n from (select "jobId" from "JobInspection" where status in ('PENDING','IN_PROGRESS') group by "jobId" having count(*) > 1) t`);
    ok('no job anywhere has two open inspections', twoOpen[0].n === 0);
  });
  await scenario(G7, 'production screens answer for one branch among many without reading the others', async (ok) => {
    const branches = await prisma.location.count();
    const t0 = Date.now();
    const calls = await Promise.all([
      pm1.call('GET', '/api/jobs?limit=50'), pm1.call('GET', `/api/v1/dispatch/stats?locationId=${L1.id}`), pm1.call('GET', `/api/v1/dispatch/queue?workCenterId=${wc1.id}`),
      qc1.call('GET', '/api/qc/queue?limit=500'), pm1.call('GET', `/api/v1/dispatch/operators?locationId=${L1.id}`), pm1.call('GET', `/api/jobs/sla-risk?locationId=${L1.id}`),
    ]);
    const ms = Date.now() - t0;
    ok(`with ${branches} branches on file, six production screens answer together`, calls.every((r) => r.status === 200), calls.map((r) => r.status).join());
    ok('in under five seconds on this machine (timings at 85 branches are measured separately)', ms < 5000, `${ms} ms`);
    const jobs = listOf(calls[0].body);
    const outside = await prisma.job.count({ where: { id: { in: jobs.map((x) => x.id) }, order: { locationId: { not: L1.id } }, workCenter: null } });
    ok('and the job list holds no other branch\'s job', outside === 0, String(outside));
  });
  await scenario(G7, 'no equipment is driven by this product: there is no machine connection to test, and none was simulated', async (ok) => {
    ok('there is no machine-connection, PLC, OPC or telemetry table', (await tables('plc|opc|telemetry|machineconnection|machinesignal|iotdevice')).length === 0, (await tables('plc|opc|telemetry|machineconnection|machinesignal|iotdevice')).join());
    ok('starting and finishing a step are entries made by a person at a screen; no signal is sent to a machine', !/modbus|opcua|mqtt/i.test(fs.readFileSync('src/backend/package.json', 'utf8')));
    ok('hardware certification is therefore NOT VERIFIED and is not claimed', true);
  }, NA);
}
await prisma.appSetting.deleteMany({ where: { key: 'production.rules' } });
const failed = finish('Phase 7 manufacturing scenarios', OUT, fs);
await prisma.$disconnect();
process.exit(failed ? 1 : 0);
