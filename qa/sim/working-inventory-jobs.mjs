// Test jobs on the working inventory (owner, 2026-11-26: "put stock into inventory so we can run test jobs and a lot of them").
// Runs complete jobs through the real API at the five real branches, on pieces of the working inventory:
// sales order, reservation of a piece, a job at a machine of the right kind, a plan (cut, then pack), the shop floor
// steps with a passed inspection, shipment, dispatch and delivery. Then it checks that every piece used still adds up.
//
//   QA_DATABASE_URL=postgresql://…/steelwise_qa_inv qa/tools/start-qa-server.sh     (server on the loaded QA copy)
//   DATABASE_URL=postgresql://…/steelwise_qa_inv node qa/sim/working-inventory-jobs.mjs --jobs 200
import fs from 'node:fs';
import { api, prismaClient, rng } from './lib.mjs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => (v.startsWith('--') ? [...a, [v.slice(2), all[i + 1]]] : a), []));
const BASE = args.base || 'http://localhost:3011';
const JOBS = Number(args.jobs || 200);
const OUT = args.out || 'qa/results/working-inventory-jobs.json';
const BRANCHES = ['JX', 'BC', 'PV', 'L2', 'CT'];
const prisma = prismaClient();
const A = api(BASE);
const R = rng(Number(args.seed || 20261126));
const num = (v) => (v == null ? 0 : Number(v));
const ok2xx = (s) => s >= 200 && s < 300;

// The kind of machine that cuts each form first, and the ones that can stand in.
const CUT = {
  PLATE: ['LASER', 'PLASMA', 'WATERJET', 'SHEAR', 'SAW'], SHEET: ['SHEAR', 'LASER'], COIL: ['SHEAR', 'LASER'],
  BAR: ['SAW'], ROD: ['SAW'], TUBE: ['SAW'], BEAM: ['SAW'], PLASTIC: ['PLASTIC_SAW', 'ROUTER', 'CNC'],
};

function scenario(id, branch) { return { id, branch, steps: [], checks: [], result: 'PASS' }; }
async function step(sc, name, fn, expect = '2xx') {
  let res;
  try { res = await fn(); } catch (e) { res = { status: 0, body: { error: e.message } }; }
  const ok = expect === '2xx' ? ok2xx(res.status) : res.status === expect;
  sc.steps.push({ name, status: res.status, ok, ...(ok ? {} : { body: JSON.stringify(res.body).slice(0, 300) }) });
  if (!ok) sc.result = 'FAIL';
  return res;
}
function check(sc, name, cond, detail) {
  sc.checks.push({ name, ok: !!cond, ...(cond ? {} : { detail }) });
  if (!cond) sc.result = 'FAIL';
}

async function main() {
  for (const who of ['admin']) await A.login(who);
  const customers = await prisma.organization.findMany({ where: { code: { startsWith: 'QA-C' } }, orderBy: { code: 'asc' } });
  const locs = await prisma.location.findMany({ where: { code: { in: BRANCHES }, isActive: true } });
  const wcs = await prisma.workCenter.findMany({ where: { locationId: { in: locs.map((l) => l.id) }, isActive: true } });
  const types = new Set((await prisma.workCenterType.findMany({ where: { isActive: true } })).map((t) => t.id));
  // One operator per branch for the shop floor: the branch's own if it has one, otherwise added through Staff.
  const crew = {};
  for (const l of locs) {
    const have = await prisma.operator.findFirst({ where: { homeLocationId: l.id, isActive: true, status: 'ACTIVE' } });
    const made = have || (await A.post('/api/staff/operators', { firstName: 'Shop', lastName: `Lead ${l.code}`, homeLocationId: l.id })).body?.data;
    if (!made?.id) throw new Error(`no operator at ${l.code}`);
    crew[l.code] = made.id;
  }
  const report = { started: new Date().toISOString(), base: BASE, jobs: JOBS, scenarios: [], used: [] };
  const usedCoils = new Set();

  for (let n = 0; n < JOBS; n++) {
    const loc = locs[n % locs.length];
    const sc = scenario(`WI-${String(n + 1).padStart(3, '0')}`, loc.code);
    report.scenarios.push(sc);
    // A piece of the working inventory at this branch, free, with enough on it, in a category picked in turn.
    const pool = await prisma.inventory.findMany({
      where: { locationId: loc.id, qtyAvailable: { gte: 400 }, qtyAllocated: 0, qtyOnHold: 0, coil: { coilNumber: { startsWith: `${loc.code}-2` }, form: { not: 'SUPPLY' }, status: 'AVAILABLE' } },
      include: { coil: { include: { grade: true, product: true, heat: true } } },
    });
    const byCat = {};
    for (const i of pool) if (!usedCoils.has(i.coilId)) (byCat[i.coil.product?.category || '?'] ||= []).push(i);
    const cats = Object.keys(byCat).sort();
    if (!cats.length) { sc.result = 'BLOCKED'; sc.note = `no free stock at ${loc.code}`; continue; }
    const stock = R.pick(byCat[cats[n % cats.length]] || byCat[cats[0]]);
    usedCoils.add(stock.coilId);
    const c = stock.coil;
    const plastic = c.product?.division === 'PLASTICS';
    const kind = CUT[plastic ? 'PLASTIC' : c.form] || ['SAW'];
    const here = wcs.filter((w) => w.locationId === loc.id);
    const machine = kind.map((k) => R.pick(here.filter((w) => w.type === k))).find(Boolean);
    const pack = here.find((w) => /PACK/i.test(w.type));
    sc.piece = `${c.coilNumber} ${c.product?.name} heat ${c.heat?.heatNumber}`;
    check(sc, 'the branch has a machine for this material and a packing station', machine && pack, `${loc.code} ${kind}`);
    if (!machine || !pack) continue;
    const before = await prisma.inventory.findUnique({ where: { id: stock.id } });
    const qty = Math.min(150 + R.int(0, 20) * 25, Math.floor(num(stock.qtyAvailable) / 2));
    const fit = (want, size) => (num(size) > 0 ? Math.min(want, num(size)) : want);
    const price = +(num(c.product?.basePriceCwt) / 100 || 0.9).toFixed(4);
    const line = {
      productId: c.productId, gradeId: c.gradeId, description: `${c.product?.name}, cut to size`,
      thicknessIn: num(c.thicknessIn) || null, widthIn: fit(12 + R.int(0, 36), c.widthIn), lengthIn: fit(24 + R.int(0, 96), c.lengthIn),
      qtyOrdered: qty, unit: 'LB', unitPrice: price, priceUnit: 'LB', extendedPrice: +(qty * price).toFixed(2),
    };
    const customer = R.pick(customers);
    const made = await step(sc, 'create sales order', () => A.post('/api/orders', {
      orderType: 'SO', buyerId: customer.id, status: 'DRAFT', locationId: loc.id, subtotal: line.extendedPrice, taxAmount: 0, freightAmount: 0,
      totalAmount: line.extendedPrice, paymentTerms: 'NET 30', poReference: `PO ${sc.id}`, lines: [line], requiredDate: new Date(Date.now() + 7 * 864e5).toISOString(),
    }));
    const order = made.body?.id ? made.body : null;
    if (!order) continue;
    const ol = order.lines[0];
    await step(sc, 'confirm order', () => A.put(`/api/orders/${order.id}`, { status: 'CONFIRMED' }));
    await step(sc, `reserve ${qty} lb of ${c.coilNumber}`, () => A.post(`/api/orders/${order.id}/allocate`, { lineId: ol.id, coilId: c.id, qty }));
    const jr = await step(sc, `create job at ${machine.code}`, () => A.post('/api/jobs', { orderId: order.id, orderLineId: ol.id, workCenterId: machine.id, operationType: machine.type, priority: 3, status: 'ORDERED' }));
    const job = jr.body?.id ? jr.body : null;
    if (!job) continue;
    check(sc, 'the machine kinds are on file', types.has(machine.type) && types.has(pack.type), `${machine.type} ${pack.type}`);
    await step(sc, 'plan the job: cut, then pack', () => A.post(`/api/jobs/${job.id}/plan`, {
      locationId: loc.id, operations: [{ workCenterType: machine.type, name: 'Cut to size', details: { qty: 1, lengthIn: line.lengthIn } }, { workCenterType: pack.type, name: 'Pack and ship' }],
    }));
    // The shop floor: each planned step is started by the branch's operator at a machine of its kind, then finished.
    const plan = await prisma.dispatchJob.findUnique({ where: { jobId: job.id }, include: { operations: { orderBy: { sequence: 'asc' } } } });
    check(sc, 'the plan has a cut step and a pack step', plan?.operations.length === 2, `${plan?.operations.length}`);
    for (const op of plan?.operations || []) {
      const at = op.assignedWorkCenterId || here.find((w) => w.type === op.requiredWorkCenterType)?.id;
      await step(sc, `start ${op.name}`, () => A.post(`/api/v1/operations/${op.id}/start`, { operatorId: crew[loc.code], workCenterId: at }));
      await step(sc, `finish ${op.name}`, () => A.post(`/api/v1/operations/${op.id}/complete`, {}));
    }
    const status = async () => (await prisma.job.findUnique({ where: { id: job.id } })).status;
    if ((await status()) === 'WAITING_QC') {
      const ins = await step(sc, 'open an inspection', () => A.post('/api/qc/inspections', { jobId: job.id }));
      const inspection = ins.body?.data;
      if (inspection) await step(sc, 'pass the inspection', () => A.post(`/api/qc/inspections/${inspection.id}/pass`, { checklist: (inspection.checklist || []).map((x) => ({ ...x, result: 'PASS' })) }));
    }
    if ((await status()) !== 'READY_TO_SHIP') await step(sc, 'job → READY_TO_SHIP', () => A.post(`/api/jobs/${job.id}/status`, { status: 'READY_TO_SHIP' }));
    const sh = await step(sc, 'create shipment', () => A.post('/api/shipments', { orderId: order.id, fromLocationId: loc.id, carrierName: 'Own Truck', items: [{ orderLineId: ol.id, qtyShipped: qty, weightLb: qty }] }));
    if (sh.body?.id) {
      await step(sc, 'dispatch', () => A.put(`/api/shipments/${sh.body.id}/dispatch`, {}));
      await step(sc, 'deliver', () => A.put(`/api/shipments/${sh.body.id}/deliver`, { podSignature: 'Receiving dock' }));
    }
    const after = await prisma.inventory.findUnique({ where: { id: stock.id } });
    const o = await prisma.order.findUnique({ where: { id: order.id }, include: { lines: true } });
    const jobNow = await prisma.job.findUnique({ where: { id: job.id } });
    check(sc, 'order complete and the line shipped in full', o.status === 'COMPLETE' && Math.abs(num(o.lines[0].qtyShipped) - qty) < 0.001, `${o.status} ${num(o.lines[0].qtyShipped)}`);
    check(sc, 'the piece is lighter by what shipped', Math.abs(num(before.qtyOnHand) - num(after.qtyOnHand) - qty) < 0.01, `${num(before.qtyOnHand)} -> ${num(after.qtyOnHand)} shipped ${qty}`);
    const [h, a, al, ho, tr] = [after.qtyOnHand, after.qtyAvailable, after.qtyAllocated, after.qtyOnHold, after.qtyInTransit].map(num);
    check(sc, 'on hand = available + reserved + held + on the road, none negative', Math.abs(h - (a + al + ho + tr)) < 0.001 && Math.min(h, a, al) >= -0.001, `${h} vs ${a}+${al}+${ho}+${tr}`);
    check(sc, 'nothing left reserved on the piece', Math.abs(al) < 0.001, `allocated ${al}`);
    check(sc, 'the job is through production', ['READY_TO_SHIP', 'SHIPPED', 'COMPLETE'].includes(jobNow.status), jobNow.status);
    report.used.push({ coil: c.coilNumber, branch: loc.code, form: c.form, category: c.product?.category, shipped: qty });
  }

  // Across the whole working inventory, after all the jobs.
  const rows = await prisma.$queryRawUnsafe(`SELECT count(*)::int AS bad FROM "Inventory" i JOIN "Coil" c ON c.id = i."coilId"
    WHERE c."coilNumber" ~ '^(JX|BC|PV|L2|CT)-2[56]-1' AND abs(i."qtyOnHand" - (i."qtyAvailable" + i."qtyAllocated" + i."qtyOnHold" + i."qtyInTransit")) > 0.001`);
  const missing = await prisma.$queryRawUnsafe(`SELECT count(*)::int AS n FROM "Coil" c WHERE c."coilNumber" ~ '^(JX|BC|PV|L2|CT)-2[56]-1' AND c.form <> 'SUPPLY' AND (c."heatId" IS NULL OR c."gradeId" IS NULL)`);
  report.wholeInventory = { balancesOff: rows[0].bad, piecesWithoutHeatOrGrade: missing[0].n };
  const count = (r) => report.scenarios.filter((s) => s.result === r).length;
  report.summary = { pass: count('PASS'), fail: count('FAIL'), blocked: count('BLOCKED'), steps: report.scenarios.reduce((t, s) => t + s.steps.length, 0), checks: report.scenarios.reduce((t, s) => t + s.checks.length, 0) };
  report.byBranch = Object.fromEntries(BRANCHES.map((b) => [b, report.scenarios.filter((s) => s.branch === b && s.result === 'PASS').length]));
  report.byCategory = report.used.reduce((m, u) => ({ ...m, [u.category]: (m[u.category] || 0) + 1 }), {});
  fs.mkdirSync('qa/results', { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ summary: report.summary, byBranch: report.byBranch, wholeInventory: report.wholeInventory }, null, 1));
  const fails = report.scenarios.filter((s) => s.result !== 'PASS').slice(0, 5);
  for (const f of fails) console.log(f.id, f.branch, f.piece, JSON.stringify([...f.steps.filter((s) => !s.ok), ...f.checks.filter((s) => !s.ok)]).slice(0, 600));
  await prisma.$disconnect();
  process.exit(report.summary.fail || report.summary.blocked || rows[0].bad || missing[0].n ? 1 : 0);
}
main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(2); });
