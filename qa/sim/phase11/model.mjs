// Phase 11: the synthetic enterprise. Eighty branches of six kinds, their people, customers, suppliers,
// machines and stock. Every figure here is an ASSUMPTION made for the simulation, written down so it can be
// read and challenged; none is a real volume of the business. The branches themselves (QA-L01 to QA-L80) are
// the QA fixtures; this file gives each a tier and builds what the tier needs on the local QA database.
import * as ctx from '../phase10/ctx.mjs';
import { bcrypt } from '../lib.mjs';

const { prisma, A, http1, QA_PASSWORD, house, tag } = ctx;

/**
 * The six kinds of branch. `staff` is logins by role; `machines` and `operators` are work centers and
 * certified operators made for the simulation; `lots` is stock items received before the day starts;
 * `customers` is accounts of its own; `weight` is its share of the day's customer jobs; `does` is what it does.
 */
export const TIERS = {
  LARGE: { label: 'Large processing branch', hours: 'two shifts, 16 hours', weight: 3.0, machines: 3, operators: 4, lots: 7, lotLb: 40000, customers: 6,
    staff: { SALES_REP: 2, CSR: 2, ESTIMATOR: 1, BUYER: 1, RECEIVING_CLERK: 1, INVENTORY_MANAGER: 1, SCHEDULER: 1, OPERATOR_SAW: 3, QC_INSPECTOR: 1, SHIPPING_COORDINATOR: 2, BRANCH_MANAGER: 1 },
    does: ['stock', 'processed', 'partial', 'return', 'web', 'transfer', 'workOrder'] },
  MEDIUM: { label: 'Medium service center', hours: 'one long shift, 10 hours', weight: 1.6, machines: 2, operators: 2, lots: 5, lotLb: 30000, customers: 4,
    staff: { SALES_REP: 1, CSR: 1, ESTIMATOR: 1, BUYER: 1, RECEIVING_CLERK: 1, INVENTORY_MANAGER: 1, SCHEDULER: 1, OPERATOR_SAW: 2, QC_INSPECTOR: 1, SHIPPING_COORDINATOR: 1, BRANCH_MANAGER: 1 },
    does: ['stock', 'processed', 'partial', 'return', 'web', 'transfer', 'workOrder'] },
  SMALL: { label: 'Small distribution branch', hours: 'one shift, 8 hours', weight: 1.0, machines: 0, operators: 0, lots: 3, lotLb: 20000, customers: 3,
    staff: { SALES_REP: 1, CSR: 1, BUYER: 1, RECEIVING_CLERK: 1, INVENTORY_MANAGER: 1, SHIPPING_COORDINATOR: 1, BRANCH_MANAGER: 1 },
    does: ['stock', 'partial', 'return', 'web', 'counter', 'transfer'] },
  WAREHOUSE: { label: 'Warehouse-heavy branch', hours: 'two shifts, 16 hours', weight: 0.7, machines: 0, operators: 0, lots: 6, lotLb: 60000, customers: 1,
    staff: { CSR: 1, BUYER: 1, RECEIVING_CLERK: 2, INVENTORY_MANAGER: 1, SHIPPING_COORDINATOR: 2, BRANCH_MANAGER: 1 },
    does: ['stock', 'transfer'] },
  SALES: { label: 'Sales-focused branch', hours: 'one shift, 9 hours', weight: 1.0, machines: 0, operators: 0, lots: 2, lotLb: 15000, customers: 6,
    staff: { SALES_REP: 2, CSR: 1, ESTIMATOR: 1, BUYER: 1, RECEIVING_CLERK: 1, INVENTORY_MANAGER: 1, SHIPPING_COORDINATOR: 1, BRANCH_MANAGER: 1 },
    does: ['stock', 'partial', 'return', 'web', 'counter'] },
  OUTLET: { label: 'Outlet store', hours: 'one shift, 8 hours, six days', weight: 0.6, machines: 0, operators: 0, lots: 0, lotLb: 0, customers: 2,
    staff: { CSR: 2, BRANCH_MANAGER: 1 },
    does: ['counter', 'web'] },
};
/** Which tier branch number n (1 to 80) is. Fixed, so every run sees the same enterprise: 8, 20, 24, 12, 10, 6. */
export function tierOf(n) {
  const b = n % 10;
  if (b === 0) return 'LARGE';
  if (b === 1 || b === 2 || (b === 3 && n <= 40)) return 'MEDIUM';
  if (b === 3 || b === 4 || b === 5 || (b === 6 && n <= 40)) return 'SMALL';
  if (b === 6 || b === 7) return 'WAREHOUSE';
  if (b === 8 || (b === 9 && n <= 20)) return 'SALES';
  return 'OUTLET';
}
/** Company-wide people, not tied to one branch. */
export const HEAD_OFFICE = { CFO: 2, EXECUTIVE: 2, COO: 1, CREDIT_MANAGER: 2, AUDITOR: 1, DATA_ANALYST: 1, SALES_DIRECTOR: 1 };
const GRADES_BY_KIND = { METALS: ['A36', '1018', '304SS'], PLASTICS: ['HDPE', 'UHMW'], MIXED: ['A36', 'HDPE', '6061-T6'], OUTLET: ['A36'] };
const FORM_OF = { A36: 'PLATE', 1018: 'BAR', '304SS': 'SHEET', '6061-T6': 'PLATE', HDPE: 'SHEET', UHMW: 'ROD' };
const COST_OF = { A36: 0.38, 1018: 0.52, '304SS': 1.45, '6061-T6': 1.9, HDPE: 0.95, UHMW: 1.2 };
const PRICE_OF = { A36: 0.62, 1018: 0.85, '304SS': 2.3, '6061-T6': 3.05, HDPE: 1.6, UHMW: 2.0 };
export { COST_OF, PRICE_OF };
const SUPPLIERS = 12;
const WC_TYPE = 'P11SAW';

/** A signed-in person: the same shape the scenario helpers use, plus who they are. */
function person(user, token) {
  const call = (m, url, body, headers) => http1(m, url, { body, headers, token });
  return { user, token, role: user.role, call, get: (u) => call('GET', u), post: (u, b, h) => call('POST', u, b ?? {}, h), put: (u, b) => call('PUT', u, b ?? {}), patch: (u, b) => call('PATCH', u, b ?? {}) };
}

/**
 * Builds (or finds, on a second run) the enterprise. Records are written to the QA database the way the
 * fixtures are; stock is NOT made here: the branches receive it through the product once the day starts.
 */
export async function build({ log = () => {} } = {}) {
  const hash = await bcrypt().hash(QA_PASSWORD, 10);
  const locs = await prisma.location.findMany({ where: { code: { startsWith: 'QA-L' }, isActive: true }, orderBy: { code: 'asc' } });
  const heats = Object.fromEntries((await prisma.heat.findMany({ where: { heatNumber: { startsWith: 'QA-H-' } }, include: { grade: true } })).map((h) => [h.grade.code, h]));
  const levels = (await prisma.priceLevel.findMany({ orderBy: { code: 'asc' } })).map((l) => l.code);
  const each = await prisma.product.findFirst({ where: { isActive: true, priceUnit: 'EACH', basePriceCwt: { gt: 0 } }, orderBy: { sku: 'asc' } });
  const shelfProduct = await prisma.product.findFirst({ where: { sku: 'CUT-DISC-9' } }) || each;

  const suppliers = [];
  for (let i = 1; i <= SUPPLIERS; i++) {
    const code = `P11-MILL-${String(i).padStart(2, '0')}`;
    suppliers.push(await prisma.organization.upsert({ where: { code }, update: {}, create: { code, name: `P11 Synthetic Mill ${i}`, type: i % 4 === 0 ? 'DISTRIBUTOR' : 'MILL', state: ['OH', 'IN', 'PA', 'IL'][i % 4] } }).catch(() => prisma.organization.upsert({ where: { code }, update: {}, create: { code, name: `P11 Synthetic Mill ${i}`, type: 'MILL' } })));
  }
  const mkUser = (email, role, loc, extra = {}) => prisma.user.upsert({ where: { email }, update: { isActive: true }, create: { email, passwordHash: hash, firstName: 'P11', lastName: `${role} ${loc ? loc.code : 'HQ'}`, role, organizationId: house, homeLocationId: loc?.id || null, ...extra } });

  // One kind of work center for the simulation, which lets two steps run at once, so that two jobs
  // at one machine do not block each other by design (the one-at-a-time rule is tested in Phase 7).
  const typeMade = await A.post('/api/v1/dispatch/work-center-types', { id: WC_TYPE, label: 'P11 saw', divisions: ['METALS', 'PLASTICS'], allowsConcurrentSteps: true });
  if (![201, 409].includes(typeMade.status)) throw new Error(`work center type ${typeMade.status} ${JSON.stringify(typeMade.body).slice(0, 200)}`);

  const branches = [];
  for (const loc of locs) {
    const n = Number(loc.code.slice(4));
    const tier = tierOf(n); const T = TIERS[tier];
    const kind = (loc.name.match(/\((\w+)\)/) || [])[1] || 'METALS';
    const grades = (GRADES_BY_KIND[kind] || GRADES_BY_KIND.METALS).filter((g) => heats[g]);
    const b = { n, code: loc.code, id: loc.id, loc, tier, kind, state: loc.state, grades, does: T.does, staff: {}, customers: [], buyers: [], machines: [], operators: [], lots: [], shelf: null };
    for (const [role, count] of Object.entries(T.staff)) {
      b.staff[role] = [];
      for (let i = 1; i <= count; i++) b.staff[role].push({ email: `p11-${loc.code.toLowerCase()}-${role.toLowerCase().replace(/_/g, '-')}-${i}@qa.test`, role, user: await mkUser(`p11-${loc.code.toLowerCase()}-${role.toLowerCase().replace(/_/g, '-')}-${i}@qa.test`, role, loc) });
    }
    for (let i = 1; i <= T.customers; i++) {
      const code = `P11-C-${loc.code.slice(3)}-${i}`;
      const org = await prisma.organization.upsert({ where: { code }, update: {}, create: { code, name: `P11 Synthetic Customer ${loc.code.slice(3)}-${i}`, type: i % 2 ? 'OEM' : 'FABRICATOR', state: loc.state, city: loc.city } });
      // A pricing agreement for every fifth account: a price level of its own, with no margin floor.
      if ((n + i) % 5 === 0 && levels.length > 1) { const data = { tierCode: levels[(n + i) % levels.length], marginFloor: 0, marginTarget: 0, isActive: true, effectiveFrom: new Date(Date.now() - 864e5), effectiveUntil: null }; await prisma.customerPricingTier.upsert({ where: { customerId: org.id }, update: data, create: { customerId: org.id, ...data } }); }
      b.customers.push(org);
      if (i === 1 && T.does.includes('web')) b.buyers.push({ email: `p11-buyer-${loc.code.toLowerCase()}@qa.test`, role: 'CUSTOMER_BUYER', customer: org, user: await mkUser(`p11-buyer-${loc.code.toLowerCase()}@qa.test`, 'CUSTOMER_BUYER', null, { customerId: org.id }) });
    }
    for (let i = 1; i <= T.machines; i++) {
      const id = `P11WC-${loc.code.slice(3)}-${i}`;
      const found = await prisma.workCenter.findFirst({ where: { OR: [{ id }, { code: id }] } }).catch(() => null);
      if (found) { b.machines.push(found); continue; }
      const r = await A.post('/api/v1/dispatch/work-centers', { id, name: `P11 saw ${i} at ${loc.code}`, locationId: loc.id, workCenterType: WC_TYPE });
      if (r.status !== 201) throw new Error(`work center ${id}: ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
      b.machines.push(r.body.data);
    }
    for (let i = 1; i <= T.operators; i++) {
      const lastName = `P11OP-${loc.code.slice(3)}-${i}`;
      const found = await prisma.operator?.findFirst({ where: { lastName } }).catch(() => null);
      if (found) { b.operators.push(found); continue; }
      const r = await A.post('/api/staff/operators', { firstName: 'P11', lastName, homeLocationId: loc.id, skills: [{ workCenterTypeId: WC_TYPE, skillLevel: 'STANDARD', certifiedDate: new Date(Date.now() - 800 * 864e5).toISOString() }] });
      if (r.status !== 201) throw new Error(`operator ${lastName}: ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
      b.operators.push(r.body.data);
    }
    branches.push(b);
    if (n % 20 === 0) log(`  built ${n} branches`);
  }
  const hq = {};
  for (const [role, count] of Object.entries(HEAD_OFFICE)) { hq[role] = []; for (let i = 1; i <= count; i++) hq[role].push({ email: `p11-hq-${role.toLowerCase().replace(/_/g, '-')}-${i}@qa.test`, role, user: await mkUser(`p11-hq-${role.toLowerCase().replace(/_/g, '-')}-${i}@qa.test`, role, null) }); }

  const everyone = [...branches.flatMap((b) => [...Object.values(b.staff).flat(), ...b.buyers]), ...Object.values(hq).flat()];
  const summary = {
    branches: branches.length,
    byTier: Object.fromEntries(Object.keys(TIERS).map((t) => [t, branches.filter((b) => b.tier === t).length])),
    byKind: branches.reduce((o, b) => { o[b.kind] = (o[b.kind] || 0) + 1; return o; }, {}),
    states: new Set(branches.map((b) => b.state)).size,
    employees: everyone.filter((p) => p.role !== 'CUSTOMER_BUYER').length,
    employeesByRole: everyone.reduce((o, p) => { o[p.role] = (o[p.role] || 0) + 1; return o; }, {}),
    customers: branches.reduce((s, b) => s + b.customers.length, 0),
    customerLogins: branches.reduce((s, b) => s + b.buyers.length, 0),
    suppliers: suppliers.length,
    machines: branches.reduce((s, b) => s + b.machines.length, 0),
    operators: branches.reduce((s, b) => s + b.operators.length, 0),
    plannedLots: branches.reduce((s, b) => s + TIERS[b.tier].lots, 0),
    productsInCatalog: await prisma.product.count({ where: { isActive: true } }),
    grades: Object.keys(heats),
  };
  return { branches, hq, suppliers, heats, everyone, each, shelfProduct, summary, WC_TYPE, FORM_OF };
}

/** Signs one person in through the real sign-in and keeps the token. Returns the time it took. */
export async function signIn(p) {
  const t = performance.now();
  const r = await http1('POST', '/api/auth/login', { body: { email: p.email, password: QA_PASSWORD } });
  const ms = performance.now() - t;
  if (!r.body?.token) return { ok: false, ms, status: r.status };
  Object.assign(p, person(p.user, r.body.token));
  return { ok: true, ms, status: r.status };
}
export { tag };
