// Shared set-up for the Phase 11 scenarios: the 80-branch synthetic enterprise (model.mjs), its people
// signed in on demand, the workload engine's building blocks, and the scenario record the phase asks for.
// Everything goes through the real server (several copies behind one address when run against the cluster);
// the database is read to check what was saved. Local QA database only.
import * as ctx from '../phase10/ctx.mjs';
import { scenario as record } from '../phase4-lib.mjs';
import { rng } from '../lib.mjs';
import { build, signIn, TIERS, COST_OF, PRICE_OF } from './model.mjs';
import { makeEngine } from './engine.mjs';

export * from '../phase10/ctx.mjs';
export { TIERS, COST_OF, PRICE_OF };
const { prisma, arg, sleep } = ctx;

export const G11 = {
  conc: 'Sales, inventory and purchasing concurrency',
  shop: 'Manufacturing, scheduling and quality',
  ship: 'Shipping, logistics and invoicing',
  ledger: 'Ledger posting and reconciliation',
  sec: 'Tenant, branch, RBAC and AI security',
  integ: 'Integrations, events and background jobs',
  fail: 'Failure injection and recovery',
  report: 'Reporting, frontend and deployment',
};
export const MIN11 = { conc: 45, shop: 40, ship: 35, ledger: 60, sec: 35, integ: 35, fail: 35, report: 15 };
export const GROUPS11 = Object.values(G11);
const PICK = arg('group', ''); const MATCH = arg('match', '');
export const wants = (group) => !PICK || PICK.split(',').some((n) => GROUPS11[Number(n) - 1] === group);

/**
 * One scenario with the record Phase 11 asks for. `m` holds what is known before it runs:
 *   init initial conditions    expect expected result     biz business state     db database state
 *   fin financial state        sec security result        rec recovery result    audit audit evidence
 * The actual result and the regression result are filled in from the checks when it has run.
 */
export async function S(group, name, m, fn) {
  if (!wants(group)) return null;
  if (MATCH && !MATCH.split('|').some((x) => name.includes(x))) return null;
  if (process.env.P11_TRACE) console.error(`… ${new Date().toISOString().slice(11, 19)} ${name}`);
  const sc = await record(group, name, fn);
  const failed = sc.asserts.filter((a) => !a.ok);
  sc.record = {
    initialConditions: m.init || 'The 80-branch synthetic enterprise on the local QA database, the QA ledger active with test data only, the earlier work of the run in place',
    expected: m.expect || 'as the checks state',
    actual: sc.pass ? `as expected (${sc.asserts.length} checks)` : `NOT as expected: ${failed.map((a) => `${a.what}${a.detail ? ` (${a.detail.slice(0, 120)})` : ''}`).join('; ').slice(0, 600)}`,
    businessState: m.biz || 'as the checks state', databaseState: m.db || 'no change outside the scenario', financialState: m.fin || 'no financial effect',
    securityResult: m.sec || 'not a security scenario', recoveryResult: m.rec || 'no failure was injected', auditEvidence: m.audit || 'the records named in the checks',
    regressionResult: sc.pass ? `pass; kept in qa/sim/phase11-scenarios.mjs, ${group}` : 'FAIL',
  };
  return sc;
}

// ── the enterprise ───────────────────────────────────────────────────────────────────────────
export const ledgerState = await ctx.ensureLedger();
export const E = await build();
export const rnd = rng(Number(arg('seed', '1111')));
export const X = makeEngine(E, { rnd });
const tiers = {}; for (const b of E.branches) (tiers[b.tier] ||= []).push(b);
/** The i-th branch of a tier (it wraps), with its people signed in. */
export async function branch(tier, i = 0) { const b = tiers[tier][i % tiers[tier].length]; await staffIn(b); return b; }
export const SELLING = ['LARGE', 'MEDIUM', 'SMALL', 'WAREHOUSE', 'SALES'];
export const ALL_TIERS = Object.keys(TIERS);
const signed = new Set();
export async function staffIn(b) {
  if (signed.has(b.code)) return b;
  for (const p of [...Object.values(b.staff).flat(), ...b.buyers]) { if (!p.call) { const r = await signIn(p); if (!r.ok) throw new Error(`sign-in ${p.email}: ${r.status}`); } }
  signed.add(b.code); return b;
}
for (const p of Object.values(E.hq).flat()) { const r = await signIn(p); if (!r.ok) throw new Error(`sign-in ${p.email}: ${r.status}`); }
export const hq = (role, i = 0) => E.hq[role][i % E.hq[role].length];
export const P = X.P;
let jobSeq = 0;
/** A job record for the engine's steps (the scenarios read its ids and steps). */
export const job = (type, b) => ({ id: `S-${type}-${++jobSeq}`, n: jobSeq, type, branch: b?.code || 'HQ', tier: b?.tier, steps: [], ids: {} });
export const all = (n, fn) => Promise.all(Array.from({ length: n }, (_, i) => fn(i)));
export const statuses = (rs) => rs.map((r) => r.status).sort().join(',');
export const count = (rs, ...codes) => rs.filter((r) => codes.includes(r.status)).length;
export const inv = (coilId) => prisma.inventory.findUnique({ where: { coilId } });
export const n = (v) => Number(v || 0);
/** A fresh lot at the branch, bought and received through the server. */
export async function lot(b, lb = 5000, grade) { return X.receiveLot(job('LOT', b), b, grade || b.grades[0], lb); }
/** A confirmed order of the branch for `qty` pounds of the lot's grade. */
export async function order(b, l, qty, { customer } = {}) { const j = job('ORDER', b); const o = await X.placeOrder(j, b, customer || b.customers[0], l.grade, qty, PRICE_OF[l.grade] ?? 0.65); return { ...o, job: j }; }
/** An order reserved and put on a shipment that waits on the dock. */
export async function onDock(b, qty = 500, { lotLb, customer } = {}) {
  const l = await lot(b, lotLb || qty + 1000); const o = await order(b, l, qty, { customer });
  const rz = await P.stock(b).post(`/api/orders/${o.id}/allocate`, { lineId: o.lines[0].id, coilId: l.coilId, qty });
  if (rz.status !== 201) throw new Error(`reserve ${rz.status} ${ctx.err(rz)}`);
  const who = P.shipper(b) || P.stock(b);
  const s = await who.post('/api/shipments', { orderId: o.id, fromLocationId: b.id, carrierName: 'Own Truck', items: [{ orderLineId: o.lines[0].id, qtyShipped: qty, weightLb: qty }] });
  if (s.status !== 201) throw new Error(`shipment ${s.status} ${ctx.err(s)}`);
  return { lot: l, order: o, shipment: s.body, shipper: who, qty };
}
/** Shipped and billed. */
export async function sold(b, qty = 500, opts = {}) {
  const d = await onDock(b, qty, opts);
  const r = await d.shipper.put(`/api/shipments/${d.shipment.id}/dispatch`, {});
  if (r.status !== 200 || !r.body.invoice) throw new Error(`dispatch ${r.status} ${ctx.err(r)}`);
  const invoice = await prisma.invoice.findUnique({ where: { id: r.body.invoice.id } });
  return { ...d, invoice, total: Number(invoice.totalAmount) };
}
export const netOf = async (sourceType, sourceId, eventKind) => { const { entry, event } = await ctx.posted(eventKind, sourceType, sourceId); return { entry, event, nets: ctx.nets(entry) }; };
export const moveOf = (where) => prisma.materialMovement.findFirst({ where, orderBy: { createdAt: 'desc' } });
export const cluster = {
  state: () => fetch(`${ctx.BASE}/__cluster/state`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
  post: (path, body) => fetch(`${ctx.BASE}/__cluster/${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}) }).then((r) => r.json()).catch(() => null),
  async waitUp(want) { for (let i = 0; i < 120; i++) { const s = await this.state(); if (s && s.workers.filter((w) => w.up).length >= want) return true; await sleep(250); } return false; },
};
export const copies = (await cluster.state())?.workers.filter((w) => w.up).length || 1;
