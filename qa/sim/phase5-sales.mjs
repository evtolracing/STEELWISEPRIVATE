// Phase 5 sales scenarios: customers and requests, product configuration and pricing, quoting and
// conversion, sales orders and the hand-off to the shop, the counter, the web shop and the customer
// portal, and the exceptions around them. Every scenario drives the real server the way the screens
// do, then reads the database to check what was saved, what was refused, what reached the next
// module and that nothing was doubled. A success answer alone is never counted as a pass.
//   node qa/sim/phase5-sales.mjs [--base http://localhost:3011] [--only 1,3]
// Local QA database only (lib.mjs refuses anything else). Nothing is emailed, texted or charged.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import {
  arg, BASE, prisma, A, run, num, ok2, tag, scenario, http1, raw, sendAndHangUp, world, blocks, finish, QA_PASSWORD, sleep,
} from './phase4-lib.mjs';
import { bcrypt } from './lib.mjs';

const OUT = arg('out', 'qa/results/phase5-sales.json');
const ONLY = arg('only', '').split(',').filter(Boolean);
const want = (n) => !ONLY.length || ONLY.includes(String(n));
const T0 = new Date(Date.now() - 2000);
const near = (a, b, eps = 0.011) => Math.abs(Number(a) - Number(b)) <= eps;
const money = (n) => Math.round(Number(n) * 100) / 100;

const w = await world();
const B = blocks(w);
const { L1, L2, heat, users } = w;
const rates = Object.fromEntries((await prisma.salesTaxRate.findMany()).map((r) => [r.state, Number(r.rate)]));
const levels = Object.fromEntries((await prisma.priceLevel.findMany()).map((l) => [l.code, Number(l.multiplier)]));
const cwt = await prisma.product.findFirst({ where: { isActive: true, priceUnit: 'CWT', basePriceCwt: { gt: 0 } }, orderBy: { sku: 'asc' } });
const each = await prisma.product.findFirst({ where: { isActive: true, priceUnit: 'EACH', basePriceCwt: { gt: 0 } }, orderBy: { sku: 'asc' } });
const listEach = Number(each.basePriceCwt);
const listCwt = Number(cwt.basePriceCwt);

// ── building blocks ──────────────────────────────────────────────────────────────
/** A customer of its own for one scenario, so no scenario changes an account another one reads. */
async function customer(over = {}) {
  return prisma.organization.create({ data: { code: tag('QA-P5C'), name: `QA P5 customer ${run}`, type: 'OEM', state: 'OH', ...over } });
}
async function setTier(org, tierCode, over = {}) {
  const data = { tierCode, marginFloor: 0, marginTarget: 0, isActive: true, effectiveFrom: new Date(Date.now() - 864e5), effectiveUntil: null, ...over };
  return prisma.customerPricingTier.upsert({ where: { customerId: org.id }, update: data, create: { customerId: org.id, ...data } });
}
/** A login of the customer's own, like the ones the web shop uses. */
async function customerLogin(org) {
  const email = `${tag('qa-p5-buyer').toLowerCase()}@qa.test`;
  await prisma.user.create({ data: { email, passwordHash: await bcrypt().hash(QA_PASSWORD, 10), firstName: 'QA', lastName: 'Buyer', role: 'CUSTOMER_BUYER', organizationId: users.custA.organizationId, customerId: org.id } });
  const r = await http1('POST', '/api/auth/login', { body: { email, password: QA_PASSWORD } });
  if (!r.body?.token) throw new Error(`login ${email}: ${r.status}`);
  return { email, token: r.body.token, call: (m, url, body, headers) => http1(m, url, { body, headers, token: r.body.token }) };
}
const specs = { gradeId: heat.gradeId, grade: heat.grade.code, thicknessIn: 0.5, widthIn: 48, lengthIn: 96, finish: 'Pickled and oiled', thkTolerancePlus: 0.01, thkToleranceMinus: 0, certRequirements: ['MTR', 'COC'], processing: 'Shear to size', specNotes: 'Flatness 1/8 in' };
async function rfq(cust, lines, who = 'csr', extra = {}) {
  const r = await A.post('/api/rfqs', { customerId: cust.id, requestedDate: new Date(Date.now() + 14 * 864e5).toISOString(), lines, ...extra }, who);
  if (r.status !== 201) throw new Error(`rfq ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
  return r.body;
}
async function quote(rfqRow, priced, who = 'csr', extra = {}) {
  const r = await A.post(`/api/rfqs/${rfqRow.id}/quotes`, { lines: priced, ...extra }, who);
  if (r.status !== 201) throw new Error(`quote ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
  return r.body;
}
const plateLine = (qty = 4000, over = {}) => ({ description: `QA P5 plate ${run}`, requestedQty: qty, unit: 'LB', ...specs, ...over });
/** RFQ, priced quote, ready to accept. */
async function quoted(cust, { who = 'csr', price = 65, qty = 4000, send = true } = {}) {
  const r = await rfq(cust, [plateLine(qty)], who);
  const q = await quote(r, [{ rfqLineId: r.lines[0].id, unitPrice: price, priceUnit: 'CWT' }], who);
  if (send) { const s = await A.post(`/api/quotes/${q.id}/send`, {}, who); if (!ok2(s)) throw new Error(`send ${s.status}`); }
  return { rfq: r, quote: q };
}
const orderOf = (id) => prisma.order.findUnique({ where: { id }, include: { lines: { orderBy: { lineNumber: 'asc' } }, invoices: { include: { lines: true, payments: true } } } });
const audits = (resourceId, eventType) => prisma.auditLog.findMany({ where: { resourceId, ...(eventType && { eventType }) } });
async function shelf(product, pieces, location = L1) {
  const owner = (await prisma.coil.findFirst({ where: { locationId: location.id }, select: { ownerId: true } }))?.ownerId || users.admin.organizationId;
  const coil = await prisma.coil.create({ data: { coilNumber: tag('SHELF'), form: 'PLATE', heatId: heat.id, gradeId: heat.gradeId, ownerId: owner, productId: product.id, locationId: location.id, netWeightLb: 100, grossWeightLb: 100, createdById: users.admin.id } });
  await prisma.inventory.create({ data: { coilId: coil.id, locationId: location.id, qtyOnHand: pieces, qtyAvailable: pieces, unit: 'EA' } });
  return coil;
}
const onShelf = async (product, location = L1) => num((await prisma.inventory.aggregate({ where: { locationId: location.id, unit: { in: ['EA', 'EACH'] }, coil: { productId: product.id } }, _sum: { qtyOnHand: true } }))._sum.qtyOnHand);
const sale = (items, extra = {}) => ({ id: tag('QS'), items, ...extra });
const pay = (s, payment, who = 'csr') => A.post('/api/pos/quick-sale/process-payment', { sale: s, payment }, who);
const psql = (sql) => execFileSync('psql', ['-U', 'postgres', '-h', 'localhost', '-d', new URL(process.env.DATABASE_URL).pathname.slice(1), '-Atc', sql], { env: { ...process.env, PGPASSWORD: 'password' } }).toString();

// ══ 1. CRM, customers and requests for quote ════════════════════════════════════════════
const G1 = 'CRM, customers and requests for quote';
if (want(1)) {
  await scenario(G1, 'a new customer account is created once, with its fields, and found by search', async (ok) => {
    const code = tag('QA-P5N');
    const r = await A.post('/api/customers', { code, name: 'QA P5 New Account', type: 'FABRICATOR', city: 'Toledo', state: 'OH', paymentTerms: 'NET30', taxExempt: false, email: 'buyer@example.test' }, 'csr');
    ok('created: 201 with an id', r.status === 201 && r.body?.id, r.status);
    const row = await prisma.organization.findUnique({ where: { code } });
    ok('saved with every field given', row && row.name === 'QA P5 New Account' && row.type === 'FABRICATOR' && row.city === 'Toledo' && row.state === 'OH' && row.paymentTerms === 'NET30' && row.isActive, JSON.stringify(row).slice(0, 200));
    ok('the same code a second time is refused with 409', (await A.post('/api/customers', { code, name: 'Again' }, 'csr')).status === 409);
    ok('a name is required', (await A.post('/api/customers', { code: tag('QA-P5N') }, 'csr')).status === 400);
    ok('an account type that does not exist is refused, not a server error', (await A.post('/api/customers', { code: tag('QA-P5N'), name: 'x', type: 'NONSENSE' }, 'csr')).status === 400);
    ok('one account with that code exists', (await prisma.organization.count({ where: { code } })) === 1);
    const found = await A.get(`/api/customers?search=${encodeURIComponent(code)}&limit=5`, 'csr');
    const list = found.body?.data || found.body?.customers || found.body;
    ok('search by code finds it', Array.isArray(list) && list.some((c) => c.id === r.body.id), JSON.stringify(found.body).slice(0, 200));
    ok('a customer login cannot create accounts', [401, 403].includes((await A.post('/api/customers', { code: tag('QA-P5N'), name: 'x' }, 'custA')).status));
  });

  await scenario(G1, 'closing and reopening an account is on the record, like a tax status change (J-002)', async (ok) => {
    const c = await customer();
    const off = await A.patch(`/api/customers/${c.id}`, { isActive: false }, 'csr');
    ok('closed', off.status === 200 && off.body?.isActive === false, off.status);
    const on = await A.patch(`/api/customers/${c.id}`, { isActive: true }, 'csr');
    ok('reopened', on.status === 200 && on.body?.isActive === true);
    const rows = await audits(c.id);
    ok('one record for the close and one for the reopen, with who did it', rows.filter((a) => a.eventType === 'CUSTOMER_DEACTIVATED').length === 1 && rows.filter((a) => a.eventType === 'CUSTOMER_REACTIVATED').length === 1 && rows.every((a) => a.userId === users.csr.id), rows.map((a) => a.eventType).join());
    const tax = await A.patch(`/api/customers/${c.id}`, { taxExempt: true }, 'csr');
    ok('a tax status change is recorded as before', tax.status === 200 && (await audits(c.id, 'CUSTOMER_TAX_STATUS_CHANGED')).length === 1);
    ok('a save that changes neither writes no extra record', (await A.patch(`/api/customers/${c.id}`, { phone: '555-0100' }, 'csr')).status === 200 && (await audits(c.id)).length === 3);
  });

  await scenario(G1, 'a closed account takes no new business in any channel, and its history stays (J-002)', async (ok) => {
    const c = await customer();
    const login = await customerLogin(c);
    const { quote: q } = await quoted(c);
    const before = await B.order([B.line(500)], { customer: c, who: 'admin' });
    await A.patch(`/api/customers/${c.id}`, { isActive: false }, 'admin');
    const order = await A.post('/api/orders', B.orderBody([B.line(100)], { customer: c }), 'csr');
    ok('staff order entry: refused with 409', order.status === 409 && order.body?.code === 'CUSTOMER_INACTIVE', `${order.status} ${JSON.stringify(order.body)}`);
    ok('request for quote: refused with 409', (await A.post('/api/rfqs', { customerId: c.id, lines: [plateLine()] }, 'csr')).status === 409);
    const acc = await A.post(`/api/quotes/${q.id}/accept`, {}, 'csr');
    ok('accepting an open quote: refused with 409', acc.status === 409, acc.status);
    ok('the quote is still open after the refusal', (await prisma.quote.findUnique({ where: { id: q.id } })).status === 'SENT');
    ok('counter sale: refused', (await A.post('/api/pos/quick-sale/price', { sale: { customerId: c.id, items: [{ productId: each.id, quantity: 1 }] } }, 'csr')).status === 400);
    ok('order intake: refused', (await A.post('/api/orders/intake', { source: 'PHONE', customerId: c.id, lines: [{ description: 'x', qty: 1, unitPrice: 1 }] }, 'csr')).status === 400);
    const web = await login.call('POST', '/api/ecom/checkout/submit', { items: [{ productId: each.id, quantity: 1, sku: each.sku }], deliveryMethod: 'PICKUP' });
    ok('web checkout: refused with 409', web.status === 409, web.status);
    ok('no new order or web order was saved for it', (await prisma.order.count({ where: { buyerId: c.id, createdAt: { gt: before.createdAt } } })) === 0 && (await prisma.onlineOrder.count({ where: { customerId: c.id } })) === 0);
    ok('the earlier order is still there and readable', (await A.get(`/api/orders/${before.id}`, 'admin')).status === 200);
    await A.patch(`/api/customers/${c.id}`, { isActive: true }, 'admin');
    const again = await A.post(`/api/quotes/${q.id}/accept`, {}, 'csr');
    ok('reopened: the same quote is accepted', again.status === 201 && again.body?.order?.id, again.status);
  });

  await scenario(G1, 'an account cannot be placed under one of its own divisions (J-003)', async (ok) => {
    const top = await customer(); const div = await customer(); const sub = await customer();
    ok('a division is placed under the account', (await A.patch(`/api/customers/${div.id}`, { parentId: top.id }, 'csr')).status === 200);
    ok('a sub-division under the division', (await A.patch(`/api/customers/${sub.id}`, { parentId: div.id }, 'csr')).status === 200);
    const loop = await A.patch(`/api/customers/${top.id}`, { parentId: sub.id }, 'csr');
    ok('the account under its own sub-division: refused with 400', loop.status === 400, loop.status);
    ok('the account under itself: refused', (await A.patch(`/api/customers/${top.id}`, { parentId: top.id }, 'csr')).status === 400);
    ok('the account still has no parent', (await prisma.organization.findUnique({ where: { id: top.id } })).parentId === null);
    await setTier(top, 'A');
    const calc = await A.post('/api/pricing/calculate', { productId: each.id, customerId: sub.id, qty: 2 }, 'csr');
    ok('a sub-division buys at the top account\'s contract price', near(calc.body?.unitPrice, listEach * levels.CONTRACT_B, 0.0001), JSON.stringify(calc.body));
  });

  await scenario(G1, 'a request for quote keeps grade, size, tolerances, certificates and processing (J-001)', async (ok) => {
    const c = await customer();
    const r = await rfq(c, [plateLine(4000), { description: 'Plain text line', requestedQty: 10, unit: 'EA' }]);
    const row = await prisma.rFQ.findUnique({ where: { id: r.id }, include: { lines: { orderBy: { lineNumber: 'asc' } } } });
    const s1 = row.lines[0].specifications || {};
    ok('size kept', s1.thicknessIn === 0.5 && s1.widthIn === 48 && s1.lengthIn === 96, JSON.stringify(s1));
    ok('grade kept', s1.gradeId === heat.gradeId && s1.gradeOverride === heat.grade.code);
    ok('finish and tolerances kept', s1.surfaceFinish === 'Pickled and oiled' && s1.thkTolerancePlus === 0.01 && s1.thkToleranceMinus === 0);
    ok('certificates kept', JSON.stringify(s1.certRequirements) === '["MTR","COC"]');
    ok('processing and other requirements kept', s1.processing === 'Shear to size' && s1.specNotes === 'Flatness 1/8 in');
    ok('a plain line is not given requirements it did not have', row.lines[1].specifications === null);
    ok('the requested date is kept', row.requestedDate && Math.abs(new Date(row.requestedDate) - (Date.now() + 14 * 864e5)) < 864e5);
    const n = await prisma.rFQ.count();
    const bad = await A.post('/api/rfqs', { customerId: c.id, lines: [plateLine(100, { thicknessIn: 'thick' })] }, 'csr');
    ok('a requirement that is not a real value is refused with the line and field named', bad.status === 400 && /Line 1/.test(bad.body?.error) && /thicknessIn/.test(bad.body?.error), JSON.stringify(bad.body));
    ok('and nothing is saved', (await prisma.rFQ.count()) === n);
  });

  await scenario(G1, 'a request belongs to the branch that took it; another branch cannot see or quote it', async (ok) => {
    const c = await customer();
    const r = await rfq(c, [plateLine()], 'branchA');
    ok('it belongs to branch A', r.locationId === L1.id, r.locationId);
    ok('branch B cannot open it', (await A.get(`/api/rfqs/${r.id}`, 'branchB')).status === 404);
    ok('branch B cannot quote it', [403, 404].includes((await A.post(`/api/rfqs/${r.id}/quotes`, { lines: [{ rfqLineId: r.lines[0].id, unitPrice: 1, priceUnit: 'CWT' }] }, 'branchB')).status));
    const listB = await A.get('/api/rfqs?limit=200', 'branchB');
    ok('branch B\'s list does not hold it', listB.status === 200 && !listB.body.data.some((x) => x.id === r.id));
    ok('branch A and a manager see it', (await A.get(`/api/rfqs/${r.id}`, 'branchA')).status === 200 && (await A.get(`/api/rfqs/${r.id}`, 'admin')).status === 200);
    ok('no quote was made by the refused attempt', (await prisma.quote.count({ where: { rfqId: r.id } })) === 0);
  });

  await scenario(G1, 'an incomplete request is refused and saves nothing', async (ok) => {
    const c = await customer();
    const n = await prisma.rFQ.count();
    ok('no lines: 400', (await A.post('/api/rfqs', { customerId: c.id, lines: [] }, 'csr')).status === 400);
    ok('a line with no description and no product: 400', (await A.post('/api/rfqs', { customerId: c.id, lines: [{ requestedQty: 5 }] }, 'csr')).status === 400);
    ok('a quantity of zero: 400', (await A.post('/api/rfqs', { customerId: c.id, lines: [{ description: 'x', requestedQty: 0 }] }, 'csr')).status === 400);
    ok('a negative quantity: 400', (await A.post('/api/rfqs', { customerId: c.id, lines: [{ description: 'x', requestedQty: -3 }] }, 'csr')).status === 400);
    ok('no customer: 400', (await A.post('/api/rfqs', { lines: [plateLine()] }, 'csr')).status === 400);
    ok('a customer that does not exist: 400', (await A.post('/api/rfqs', { customerId: '00000000-0000-4000-8000-000000000000', lines: [plateLine()] }, 'csr')).status === 400);
    ok('a date that is not a date: 400', (await A.post('/api/rfqs', { customerId: c.id, requestedDate: 'soon', lines: [plateLine()] }, 'csr')).status === 400);
    ok('nothing was saved', (await prisma.rFQ.count()) === n);
  });

  await scenario(G1, 'withdrawing a request closes its open quotes and it cannot be quoted again', async (ok) => {
    const c = await customer();
    const { rfq: r, quote: q } = await quoted(c);
    const wd = await A.patch(`/api/rfqs/${r.id}`, { status: 'WITHDRAWN' }, 'csr');
    ok('withdrawn', wd.status === 200 && wd.body?.status === 'WITHDRAWN');
    ok('its open quote is closed as rejected', (await prisma.quote.findUnique({ where: { id: q.id } })).status === 'REJECTED');
    ok('a new quote on it: 409', (await A.post(`/api/rfqs/${r.id}/quotes`, { lines: [{ rfqLineId: r.lines[0].id, unitPrice: 1, priceUnit: 'CWT' }] }, 'csr')).status === 409);
    ok('it cannot be reopened by hand', (await A.patch(`/api/rfqs/${r.id}`, { status: 'IN_REVIEW' }, 'csr')).status === 409);
    ok('accepting the closed quote: 409 and no order', (await A.post(`/api/quotes/${q.id}/accept`, {}, 'csr')).status === 409 && !(await prisma.quote.findUnique({ where: { id: q.id } })).convertedOrderId);
    ok('the status the screen may set is limited', (await A.patch(`/api/rfqs/${r.id}`, { status: 'ACCEPTED' }, 'csr')).status === 400);
  });

  await scenario(G1, 'customer preferences: staff fields stay with staff; a customer reads only its own account', async (ok) => {
    const c = await customer();
    const put = await A.put(`/api/customers/${c.id}/preferences`, { defaultDivision: 'METALS', internalNotes: 'QA staff only', discountPct: 5 }, 'csr');
    ok('staff save preferences', ok2(put), put.status);
    const get = await A.get(`/api/customers/${c.id}/preferences`, 'csr');
    ok('staff read them back', ok2(get) && JSON.stringify(get.body).includes('QA staff only'), JSON.stringify(get.body).slice(0, 200));
    const asCustomer = await A.get(`/api/customers/${c.id}/preferences`, 'custA');
    ok('another customer\'s login cannot read them', [401, 403, 404].includes(asCustomer.status), asCustomer.status);
    ok('a customer login cannot list accounts', [401, 403].includes((await A.get('/api/customers', 'custA')).status));
  });

  await scenario(G1, 'merging two accounts is not offered, so no history can be merged away', async (ok) => {
    const a = await customer(); const b = await customer();
    for (const path of [`/api/customers/${a.id}/merge`, `/api/customers/merge`]) {
      const r = await A.post(path, { intoId: b.id, fromId: a.id }, 'admin');
      ok(`${path}: no such route (404)`, r.status === 404, r.status);
    }
    ok('both accounts are still there', (await prisma.organization.count({ where: { id: { in: [a.id, b.id] } } })) === 2);
  }, { status: 'NOT APPLICABLE: no merge function exists; duplicates are refused by code at creation' });
}

// ══ 2. Product configuration and pricing ═══════════════════════════════════════════════
const G2 = 'Product configuration and pricing';
if (want(2)) {
  await scenario(G2, 'a weight-priced item is priced per pound from its price per hundredweight', async (ok) => {
    const c = await customer();
    const r = await A.post('/api/pricing/calculate', { productId: cwt.id, customerId: c.id, weight: 2500, qty: 3 }, 'csr');
    ok('200', r.status === 200, r.status);
    ok('the unit price is the list price per pound', near(r.body.unitPrice, listCwt / 100, 0.0001) && r.body.priceUnit === 'LB', JSON.stringify(r.body));
    ok('the line is the weight times the price, not the piece count', near(r.body.materialTotal, money(2500 * listCwt / 100)), r.body.materialTotal);
    ok('with no tier the source says list price', /Retail|List/i.test(r.body.priceSource), r.body.priceSource);
  });

  await scenario(G2, 'a contract tier gives its price; a tier that has ended or not begun gives list', async (ok) => {
    const c = await customer();
    await setTier(c, 'A');
    const now = await A.post('/api/pricing/calculate', { productId: each.id, customerId: c.id, qty: 4 }, 'csr');
    ok('tier A in force: the contract level price', near(now.body.unitPrice, listEach * levels.CONTRACT_B, 0.0001) && near(now.body.materialTotal, money(4 * listEach * levels.CONTRACT_B)), JSON.stringify(now.body));
    const contracts = await A.get(`/api/pricing/contracts?customerId=${c.id}`, 'csr');
    ok('the contract lookup names the level', contracts.body?.priceLevel === 'CONTRACT_B');
    await setTier(c, 'A', { effectiveUntil: new Date(Date.now() - 3600e3) });
    ok('ended yesterday: list price', near((await A.post('/api/pricing/calculate', { productId: each.id, customerId: c.id, qty: 4 }, 'csr')).body.unitPrice, listEach, 0.0001));
    await setTier(c, 'A', { effectiveFrom: new Date(Date.now() + 864e5) });
    ok('starts tomorrow: list price', near((await A.post('/api/pricing/calculate', { productId: each.id, customerId: c.id, qty: 4 }, 'csr')).body.unitPrice, listEach, 0.0001));
    await setTier(c, 'A', { isActive: false });
    ok('switched off: list price', near((await A.post('/api/pricing/calculate', { productId: each.id, customerId: c.id, qty: 4 }, 'csr')).body.unitPrice, listEach, 0.0001));
    await setTier(c, 'C');
    ok('tier C: the volume level', near((await A.post('/api/pricing/calculate', { productId: each.id, customerId: c.id, qty: 4 }, 'csr')).body.unitPrice, listEach * levels.VOLUME, 0.0001));
  });

  await scenario(G2, 'a price level sent by the screen is ignored when the customer has its own', async (ok) => {
    const c = await customer();
    const r = await A.post('/api/pricing/calculate', { productId: each.id, customerId: c.id, priceLevel: 'CONTRACT_B', qty: 2 }, 'csr');
    ok('a customer with no tier pays list whatever level is sent', near(r.body.unitPrice, listEach, 0.0001), r.body.unitPrice);
    await setTier(c, 'C');
    const r2 = await A.post('/api/pricing/calculate', { productId: each.id, customerId: c.id, priceLevel: 'CONTRACT_B', qty: 2 }, 'csr');
    ok('a tier C customer pays volume, not the better level sent', near(r2.body.unitPrice, listEach * levels.VOLUME, 0.0001), r2.body.unitPrice);
    const walk = await A.post('/api/pricing/calculate', { productId: each.id, priceLevel: 'CONTRACT_B', qty: 2 }, 'csr');
    ok('with no customer the level sent is used (the counter\'s price check)', near(walk.body.unitPrice, listEach * levels.CONTRACT_B, 0.0001), walk.body.unitPrice);
  });

  await scenario(G2, 'remnant discount and processing charges are added up on the server', async (ok) => {
    const r = await A.post('/api/pricing/calculate', { productId: cwt.id, weight: 1000, isRemnant: true, remnantDiscount: 0.3, processes: [{ estimatedCost: 25 }, { estimatedCost: 12.5 }] }, 'csr');
    ok('the remnant price is the list less the discount', near(r.body.unitPrice, (listCwt / 100) * 0.7, 0.0001) && r.body.priceSource === 'REMNANT', JSON.stringify(r.body));
    ok('processing is added once', near(r.body.processingTotal, 37.5) && near(r.body.lineTotal, money(1000 * (listCwt / 100) * 0.7 + 37.5)));
    const none = await A.post('/api/pricing/calculate', { productId: cwt.id, weight: 1000, processes: 'shear' }, 'csr');
    ok('processing that is not a list adds nothing and does not fail', none.status === 200 && near(none.body.processingTotal, 0));
  });

  await scenario(G2, 'an item with no list price is not priced at zero', async (ok) => {
    const p = await prisma.product.create({ data: { sku: tag('QA-P5-NOPRICE'), name: 'QA unpriced', form: 'PLATE', productType: 'FLAT', isActive: true, priceUnit: 'CWT' } });
    const r = await A.post('/api/pricing/calculate', { productId: p.id, weight: 100 }, 'csr');
    ok('422 with a sentence', r.status === 422 && /list price/i.test(r.body?.error), JSON.stringify(r.body));
    ok('a product that does not exist: 404', (await A.post('/api/pricing/calculate', { productId: '00000000-0000-4000-8000-000000000000', weight: 1 }, 'csr')).status === 404);
    ok('no product: 400', (await A.post('/api/pricing/calculate', { weight: 1 }, 'csr')).status === 400);
    const web = await A.post('/api/ecom/pricing/config', { productId: p.id, quantity: 1 }, 'custA');
    ok('the web shop does not show it at zero either', !(web.status === 200 && Number(web.body?.extended) === 0 && web.body?.priceSource !== 'REVIEW_REQUIRED'), JSON.stringify(web.body).slice(0, 200));
  });

  await scenario(G2, 'tax: exempt pays none, others pay the selling branch\'s state, a state with no rate says so', async (ok) => {
    const c = await customer({ state: 'IN' });
    const ex = await customer({ taxExempt: true });
    const t = await A.post('/api/pricing/tax-estimate', { subtotal: 1000, customerId: c.id, location: L1.id }, 'csr');
    ok('selling branch in Ohio: Ohio rate, not the customer\'s state', near(t.body.taxRate, rates.OH, 1e-9) && near(t.body.taxAmount, money(1000 * rates.OH)) && t.body.taxState === 'OH', JSON.stringify(t.body));
    const t2 = await A.post('/api/pricing/tax-estimate', { subtotal: 1000, customerId: c.id, location: L2.id }, 'admin');
    ok('selling branch in Indiana: Indiana rate', near(t2.body.taxRate, rates.IN, 1e-9) && t2.body.taxState === 'IN', JSON.stringify(t2.body));
    ok('exempt: none', (await A.post('/api/pricing/tax-estimate', { subtotal: 1000, customerId: ex.id, location: L1.id }, 'csr')).body.taxAmount === 0);
    const tx = await prisma.location.findFirst({ where: { state: 'TX', code: { startsWith: 'QA-L' } } });
    const t3 = await A.post('/api/pricing/tax-estimate', { subtotal: 1000, customerId: c.id, location: tx.id }, 'admin');
    ok('a state with no rate on file charges none and says so', t3.body.taxAmount === 0 && t3.body.rateFound === false, JSON.stringify(t3.body));
  });

  await scenario(G2, 'order entry refuses totals that do not add up and works the line total from the price unit', async (ok) => {
    const c = await customer();
    const base = (lines, extra = {}) => ({ orderType: 'SO', buyerId: c.id, locationId: L1.id, status: 'DRAFT', lines, ...extra });
    const n = await prisma.order.count({ where: { buyerId: c.id } });
    ok('a line total that is not quantity × price: 400', (await A.post('/api/orders', base([{ description: 'x', qtyOrdered: 1000, unit: 'LB', unitPrice: 65, priceUnit: 'CWT', extendedPrice: 700 }]), 'csr')).status === 400);
    ok('a subtotal that is not the lines: 400', (await A.post('/api/orders', base([{ description: 'x', qtyOrdered: 1000, unit: 'LB', unitPrice: 65, priceUnit: 'CWT' }], { subtotal: 1 }), 'csr')).status === 400);
    ok('a total that is not subtotal + tax + freight: 400', (await A.post('/api/orders', base([{ description: 'x', qtyOrdered: 1000, unit: 'LB', unitPrice: 65, priceUnit: 'CWT' }], { subtotal: 650, taxAmount: 10, totalAmount: 600 }), 'csr')).status === 400);
    ok('a negative price: 400', (await A.post('/api/orders', base([{ description: 'x', qtyOrdered: 10, unit: 'LB', unitPrice: -1, priceUnit: 'LB' }]), 'csr')).status === 400);
    ok('nothing saved by the refusals', (await prisma.order.count({ where: { buyerId: c.id } })) === n);
    const good = await A.post('/api/orders', base([
      { description: 'cwt', qtyOrdered: 1000, unit: 'LB', unitPrice: 65, priceUnit: 'CWT' },
      { description: 'ton', qtyOrdered: 4000, unit: 'LB', unitPrice: 900, priceUnit: 'TON' },
      { description: 'each', qtyOrdered: 3, unit: 'EA', unitPrice: 12.5, priceUnit: 'EACH' },
    ]), 'csr');
    const o = good.body;
    ok('per hundredweight: 1000 lb at 65 is 650', near(o?.lines?.find((l) => l.description === 'cwt')?.extendedPrice, 650), JSON.stringify(o?.lines));
    ok('per ton: 4000 lb at 900 is 1800', near(o?.lines?.find((l) => l.description === 'ton')?.extendedPrice, 1800));
    ok('each: 3 at 12.50 is 37.50', near(o?.lines?.find((l) => l.description === 'each')?.extendedPrice, 37.5));
    ok('the subtotal is the lines', near(o?.subtotal, 2487.5) && near(o?.totalAmount, 2487.5));
  });

  await scenario(G2, 'quote lines are priced by their unit, and a weight price needs a weight', async (ok) => {
    const c = await customer();
    const r = await rfq(c, [plateLine(2000), { description: 'bar', requestedQty: 12, unit: 'EA' }, { description: 'tube', requestedQty: 40, unit: 'FT' }]);
    const bad = await A.post(`/api/rfqs/${r.id}/quotes`, { lines: [{ rfqLineId: r.lines[1].id, unitPrice: 50, priceUnit: 'CWT' }] }, 'csr');
    ok('pieces at a price per hundredweight: refused', bad.status === 400 && /LB/.test(bad.body?.error), JSON.stringify(bad.body));
    const q = await quote(r, [
      { rfqLineId: r.lines[0].id, unitPrice: 900, priceUnit: 'TON' }, { rfqLineId: r.lines[1].id, unitPrice: 8.25, priceUnit: 'EACH' }, { rfqLineId: r.lines[2].id, unitPrice: 3.1, priceUnit: 'LF' },
    ]);
    ok('per ton', near(q.lines[0].extendedPrice, 900));
    ok('each', near(q.lines[1].extendedPrice, 99));
    ok('per foot', near(q.lines[2].extendedPrice, 124));
    ok('the subtotal is the lines', near(q.subtotal, 1123));
    ok('a total sent by the screen is ignored', near((await quote(r, [{ rfqLineId: r.lines[1].id, unitPrice: 1, priceUnit: 'EACH', extendedPrice: 9999 }])).subtotal, 12));
  });

  await scenario(G2, 'the price book and the price list agree with what is charged', async (ok) => {
    const list = await A.get(`/api/pricing/price-list?search=${encodeURIComponent(each.sku)}`, 'csr');
    const row = list.body?.data?.find((p) => p.id === each.id);
    ok('the product is listed with its list price', row && near(row.listPrice, listEach, 0.0001), JSON.stringify(list.body).slice(0, 200));
    for (const code of ['CONTRACT_A', 'CONTRACT_B', 'VOLUME']) ok(`${code} column is list × ${levels[code]}`, near(row?.prices?.[code], listEach * levels[code], 0.0001), row?.prices?.[code]);
    const c = await customer(); await setTier(c, 'B');
    const calc = await A.post('/api/pricing/calculate', { productId: each.id, customerId: c.id, qty: 1 }, 'csr');
    ok('a tier B customer is charged the CONTRACT_A column', near(calc.body.unitPrice, row?.prices?.CONTRACT_A, 0.0001));
    const over = await A.get('/api/pricing/overview', 'csr');
    ok('the overview lists the account with its tier in force', over.body?.accounts?.some((a) => a.customerId === c.id && a.tier === 'B' && a.inForce), '');
  });

  await scenario(G2, 'only a manager changes a list price; the change is recorded and used at once', async (ok) => {
    const p = await prisma.product.create({ data: { sku: tag('QA-P5-LIST'), name: 'QA list change', form: 'PLATE', productType: 'FLAT', isActive: true, priceUnit: 'EACH', basePriceCwt: 20 } });
    const clerk = await A.put(`/api/pricing/list-price/${p.id}`, { listPrice: 1 }, 'csr');
    ok('a clerk: 403', clerk.status === 403);
    ok('a clerk\'s attempt changed nothing', Number((await prisma.product.findUnique({ where: { id: p.id } })).basePriceCwt) === 20);
    ok('zero or less: 400', (await A.put(`/api/pricing/list-price/${p.id}`, { listPrice: 0 }, 'admin')).status === 400);
    const m = await A.put(`/api/pricing/list-price/${p.id}`, { listPrice: 24.5 }, 'admin');
    ok('a manager: saved', m.status === 200 && near(m.body?.data?.listPrice, 24.5));
    const log = await audits(p.id, 'LIST_PRICE_CHANGED');
    ok('recorded with the old and new price and who', log.length === 1 && log[0].details.from === 20 && log[0].details.to === 24.5 && log[0].userId === users.admin.id, JSON.stringify(log[0]?.details));
    ok('the next price check uses it', near((await A.post('/api/pricing/calculate', { productId: p.id, qty: 2 }, 'csr')).body.materialTotal, 49));
    ok('the web shop uses it', near((await A.post('/api/ecom/pricing/config', { productId: p.id, quantity: 2 }, 'custB')).body?.extended, 49));
  });

  await scenario(G2, 'an agreed quote price is kept when the contract changes before the customer says yes', async (ok) => {
    const c = await customer(); await setTier(c, 'A');
    const agreed = money(listCwt * levels.CONTRACT_B);
    const r = await rfq(c, [{ description: 'QA contract item', requestedQty: 1000, unit: 'LB', productId: cwt.id }]);
    const q = await quote(r, [{ rfqLineId: r.lines[0].id, unitPrice: agreed, priceUnit: 'CWT' }]);
    await A.post(`/api/quotes/${q.id}/send`, {}, 'csr');
    await setTier(c, 'A', { effectiveUntil: new Date(Date.now() - 1000) });
    const acc = await A.post(`/api/quotes/${q.id}/accept`, {}, 'csr');
    const o = await orderOf(acc.body.order.id);
    ok('accepted', acc.status === 201);
    ok('the order line is at the quoted price, not today\'s list', near(o.lines[0].unitPrice, agreed, 0.0001) && near(o.lines[0].extendedPrice, money(10 * agreed)), `${o.lines[0].unitPrice} vs ${agreed}`);
    ok('the order subtotal is the quote subtotal', near(o.subtotal, q.subtotal));
    ok('the product is carried to the order line', o.lines[0].productId === cwt.id);
  });

  await scenario(G2, 'a product reads the same in the catalog, the price list and the web shop', async (ok) => {
    const prod = await A.get(`/api/products/${each.id}`, 'csr');
    const web = await A.get(`/api/ecom/catalog/${each.id}`, 'custA');
    const pl = (await A.get(`/api/pricing/price-list?search=${encodeURIComponent(each.sku)}`, 'csr')).body?.data?.find((p) => p.id === each.id);
    const p = prod.body?.data || prod.body; const s = web.body?.data || web.body;
    ok('the product screen has it', prod.status === 200 && p?.sku === each.sku, prod.status);
    ok('the web shop has it under the same code and name', web.status === 200 && (s?.sku === each.sku) && (s?.name === each.name), JSON.stringify(s).slice(0, 200));
    ok('the price list has the same name and unit', pl?.name === each.name && pl?.priceUnit === each.priceUnit);
    ok('the web shop\'s price for one equals the order-entry price for one', near((await A.post('/api/ecom/pricing/config', { productId: each.id, quantity: 1 }, 'custB')).body?.extended, (await A.post('/api/pricing/calculate', { productId: each.id, customerId: users.custB.customerId, qty: 1 }, 'csr')).body?.materialTotal));
  });

  await scenario(G2, 'a division buys at the top account\'s contract, as the pricing rule says', async (ok) => {
    // lib/customerPricing.js: the tier is set on the top-level account and covers all its divisions.
    // A tier row on a division is not used; no other precedence was invented (Phase 5 rule).
    const top = await customer(); const div = await customer({ parentId: top.id });
    await setTier(top, 'A');
    const price = async () => (await A.post('/api/pricing/calculate', { productId: each.id, customerId: div.id, qty: 1 }, 'csr')).body.unitPrice;
    ok('the division pays the top account\'s contract price', near(await price(), listEach * levels.CONTRACT_B, 0.0001));
    await setTier(div, 'C');
    ok('a tier stored on the division does not change it', near(await price(), listEach * levels.CONTRACT_B, 0.0001));
    await setTier(top, 'A', { effectiveUntil: new Date(Date.now() - 1000) });
    ok('when the top account\'s contract ends, the division pays list', near(await price(), listEach, 0.0001));
  });

  await scenario(G2, 'a price check with a negative or nonsense amount is refused, never priced below zero', async (ok) => {
    for (const body of [{ weight: -500 }, { qty: -2 }, { weight: 'heavy' }, { weight: 100, isRemnant: true, remnantDiscount: 1.5 }]) {
      const r = await A.post('/api/pricing/calculate', { productId: cwt.id, ...body }, 'csr');
      ok(`${JSON.stringify(body)}: refused with 400`, r.status === 400, `${r.status} ${JSON.stringify(r.body).slice(0, 160)}`);
    }
    const t = await A.post('/api/pricing/tax-estimate', { subtotal: -100, location: L1.id }, 'csr');
    ok('a negative subtotal is not taxed below zero', t.status === 400 || Number(t.body?.taxAmount) >= 0, `${t.status} ${JSON.stringify(t.body).slice(0, 120)}`);
  });

  await scenario(G2, 'a weight-priced item cannot be rung up as pieces at the counter', async (ok) => {
    const r = await A.post('/api/pos/quick-sale/price', { sale: { items: [{ productId: cwt.id, quantity: 2 }] } }, 'csr');
    ok('409 with where to sell it instead', r.status === 409 && /counter order/i.test(r.body?.error), JSON.stringify(r.body));
    const frac = await A.post('/api/pos/quick-sale/price', { sale: { items: [{ productId: each.id, quantity: 1.5 }] } }, 'csr');
    ok('half a piece: 400', frac.status === 400);
    const price = await A.post('/api/pos/quick-sale/price', { sale: { items: [{ productId: each.id, quantity: 2, unitPrice: 0.01 }] } }, 'csr');
    ok('a price sent by the screen is ignored', near(price.body?.subtotal, money(2 * listEach)), price.body?.subtotal);
  });
}

// ══ 3. Quoting, approvals and conversion ═════════════════════════════════════════════════
const G3 = 'Quoting, approvals and conversion';
if (want(3)) {
  await scenario(G3, 'request to quote to order: every requirement, the branch, the tax and the links arrive (J-001)', async (ok) => {
    const c = await customer({ state: 'IN' });
    const { rfq: r, quote: q } = await quoted(c, { who: 'branchA' });
    ok('the quote belongs to the request\'s branch', q.locationId === L1.id, q.locationId);
    ok('the quote carries tax by rule 27 (selling branch Ohio, not the customer\'s Indiana)', near(q.taxAmount, money(2600 * rates.OH)) && near(q.totalAmount, money(2600 * (1 + rates.OH))), `${q.taxAmount} ${q.totalAmount}`);
    const ql = q.lines[0];
    ok('the quote line has the size, grade, finish, tolerances and certificates', Number(ql.thicknessIn) === 0.5 && Number(ql.widthIn) === 48 && Number(ql.lengthIn) === 96 && ql.gradeOverride === heat.grade.code && ql.surfaceFinish === 'Pickled and oiled' && Number(ql.thkTolerancePlus) === 0.01 && JSON.stringify(ql.certRequirements) === '["MTR","COC"]', JSON.stringify(ql).slice(0, 300));
    ok('processing is kept in the spec notes', /Shear to size/.test(ql.specNotes) && /Flatness/.test(ql.specNotes), ql.specNotes);
    const acc = await A.post(`/api/quotes/${q.id}/accept`, { poReference: 'QA-PO-77', shipToState: 'IN' }, 'admin');
    ok('accepted by a manager of another home branch', acc.status === 201, acc.status);
    const o = await orderOf(acc.body.order.id);
    ok('the order belongs to the request\'s branch, not the person who pressed accept', o.locationId === L1.id, o.locationId);
    ok('the order carries the quote\'s tax and total', near(o.taxAmount, q.taxAmount) && near(o.totalAmount, q.totalAmount) && near(o.subtotal, q.subtotal), `${o.taxAmount} ${o.totalAmount}`);
    const ol = o.lines[0];
    ok('the order line has every requirement and the grade record', Number(ol.thicknessIn) === 0.5 && Number(ol.widthIn) === 48 && Number(ol.lengthIn) === 96 && ol.gradeId === heat.gradeId && ol.gradeOverride === heat.grade.code && ol.surfaceFinish === 'Pickled and oiled' && Number(ol.thkTolerancePlus) === 0.01 && JSON.stringify(ol.certRequirements) === '["MTR","COC"]' && /Shear to size/.test(ol.specNotes), JSON.stringify(ol).slice(0, 300));
    ok('PO, required date and quantity arrive', o.poReference === 'QA-PO-77' && o.requiredDate && Number(ol.qtyOrdered) === 4000 && near(ol.unitPrice, 65));
    const after = await prisma.quote.findUnique({ where: { id: q.id } });
    ok('the quote points at the order and the request is won', after.convertedOrderId === o.id && after.status === 'ACCEPTED' && (await prisma.rFQ.findUnique({ where: { id: r.id } })).status === 'ACCEPTED');
  });

  await scenario(G3, 'a tax-exempt customer\'s quote and order carry no tax', async (ok) => {
    const c = await customer({ taxExempt: true });
    const { quote: q } = await quoted(c);
    ok('quote tax is zero and the total is the subtotal', near(q.taxAmount, 0) && near(q.totalAmount, q.subtotal));
    const o = await orderOf((await A.post(`/api/quotes/${q.id}/accept`, {}, 'csr')).body.order.id);
    ok('order tax is zero', near(o.taxAmount, 0) && near(o.totalAmount, o.subtotal));
  });

  await scenario(G3, 'a quote written before quotes carried tax gets its tax when it is accepted', async (ok) => {
    const c = await customer();
    const { quote: q } = await quoted(c);
    await prisma.quote.update({ where: { id: q.id }, data: { taxAmount: null, totalAmount: q.subtotal } });
    const o = await orderOf((await A.post(`/api/quotes/${q.id}/accept`, {}, 'csr')).body.order.id);
    ok('the order is taxed at the branch\'s rate', near(o.taxAmount, money(Number(q.subtotal) * rates.OH)), o.taxAmount);
    ok('and its total adds up', near(o.totalAmount, money(Number(o.subtotal) + Number(o.taxAmount))));
  });

  await scenario(G3, 'an expired quote cannot be sent or accepted, and is listed as expired, not sent (J-004)', async (ok) => {
    const c = await customer();
    ok('a valid-until in the past is refused', (await A.post(`/api/rfqs/${(await rfq(c, [plateLine()])).id}/quotes`, { validUntil: new Date(Date.now() - 864e5).toISOString(), lines: [{ quantity: 1, unit: 'EA', unitPrice: 1, priceUnit: 'EACH', description: 'x' }] }, 'csr')).status === 400);
    const { quote: sent } = await quoted(c);
    const { quote: draft } = await quoted(c, { send: false });
    await prisma.quote.updateMany({ where: { id: { in: [sent.id, draft.id] } }, data: { validUntil: new Date(Date.now() - 3600e3) } });
    ok('sending the expired draft: 409', (await A.post(`/api/quotes/${draft.id}/send`, {}, 'csr')).status === 409);
    ok('accepting the expired quote: 409 and no order', (await A.post(`/api/quotes/${sent.id}/accept`, {}, 'csr')).status === 409 && !(await prisma.quote.findUnique({ where: { id: sent.id } })).convertedOrderId);
    ok('it reads as EXPIRED', (await A.get(`/api/quotes/${sent.id}`, 'csr')).body?.displayStatus === 'EXPIRED');
    const exp = await A.get(`/api/quotes?status=EXPIRED&customerId=${c.id}&limit=50`, 'csr');
    ok('the EXPIRED filter finds both', exp.status === 200 && [sent.id, draft.id].every((id) => exp.body.data.some((x) => x.id === id)), JSON.stringify(exp.body?.meta));
    const s = await A.get(`/api/quotes?status=SENT&customerId=${c.id}&limit=50`, 'csr');
    ok('the SENT filter does not list the expired one', !s.body.data.some((x) => x.id === sent.id));
    const d = await A.get(`/api/quotes?status=DRAFT&customerId=${c.id}&limit=50`, 'csr');
    ok('the DRAFT filter does not list the expired draft', !d.body.data.some((x) => x.id === draft.id));
  });

  await scenario(G3, 'the sales dashboard counts open business before tax and leaves expired quotes out (J-004)', async (ok) => {
    const before = (await A.get('/api/sales-dashboard?range=week', 'admin')).body;
    const c = await customer();
    const { quote: live } = await quoted(c);
    const { quote: lapsed } = await quoted(c);
    // Lapsed a second ago, not an hour ago: in the first hour of a week an hour ago is last week, and
    // the week's figures rightly leave it out (this check failed for that reason on 2026-11-16 at 00:30 UTC).
    await prisma.quote.update({ where: { id: lapsed.id }, data: { validUntil: new Date(Date.now() - 1000) } });
    const after = (await A.get('/api/sales-dashboard?range=week', 'admin')).body;
    const k = after.pipeline || {};
    const kb = before.pipeline || {};
    const delta = (f) => Number(k[f] ?? 0) - Number(kb[f] ?? 0);
    ok('awaiting the customer rose by one (the live quote only)', delta('awaitingCustomer') === 1 || delta('awaiting') === 1, JSON.stringify(k).slice(0, 300));
    ok('the open value rose by the live quote\'s subtotal, without tax', near(delta('openValue'), live.subtotal), `${delta('openValue')} vs ${live.subtotal}`);
    ok('the lapsed quote counts as lost', delta('lost') >= 1, delta('lost'));
  });

  await scenario(G3, 'two people accept the same quote at once: one order', async (ok) => {
    const c = await customer();
    const { quote: q } = await quoted(c);
    const res = await Promise.all([A.post(`/api/quotes/${q.id}/accept`, {}, 'csr'), A.post(`/api/quotes/${q.id}/accept`, {}, 'admin'), A.post(`/api/quotes/${q.id}/accept`, {}, 'branchA')]);
    ok('one 201, the rest 409', res.filter((r) => r.status === 201).length === 1 && res.filter((r) => r.status === 409).length === 2, res.map((r) => r.status).join());
    ok('one order for the customer', (await prisma.order.count({ where: { buyerId: c.id } })) === 1);
    ok('the quote points at that order', (await prisma.quote.findUnique({ where: { id: q.id } })).convertedOrderId === (await prisma.order.findFirst({ where: { buyerId: c.id } })).id);
  });

  await scenario(G3, 'a decided quote stays decided', async (ok) => {
    const c = await customer();
    const { quote: lost } = await quoted(c);
    ok('rejected', (await A.post(`/api/quotes/${lost.id}/reject`, { reason: 'price' }, 'csr')).status === 200);
    ok('accepting a rejected quote: 409', (await A.post(`/api/quotes/${lost.id}/accept`, {}, 'csr')).status === 409);
    ok('the reason is kept', /price/.test((await prisma.quote.findUnique({ where: { id: lost.id } })).internalNotes || ''));
    const { quote: won } = await quoted(c);
    await A.post(`/api/quotes/${won.id}/accept`, {}, 'csr');
    ok('rejecting an accepted quote: 409', (await A.post(`/api/quotes/${won.id}/reject`, {}, 'csr')).status === 409);
    ok('sending an accepted quote: 409', (await A.post(`/api/quotes/${won.id}/send`, {}, 'csr')).status === 409);
  });

  await scenario(G3, 'a second version of a quote: accepting it closes the first', async (ok) => {
    const c = await customer();
    const r = await rfq(c, [plateLine(1000)]);
    const v1 = await quote(r, [{ rfqLineId: r.lines[0].id, unitPrice: 70, priceUnit: 'CWT' }]);
    const v2 = await quote(r, [{ rfqLineId: r.lines[0].id, unitPrice: 66, priceUnit: 'CWT' }]);
    ok('numbered as versions 1 and 2', v1.version === 1 && v2.version === 2);
    const acc = await A.post(`/api/quotes/${v2.id}/accept`, {}, 'csr');
    ok('version 2 accepted at its price', acc.status === 201 && near((await orderOf(acc.body.order.id)).lines[0].unitPrice, 66));
    ok('version 1 is closed as rejected', (await prisma.quote.findUnique({ where: { id: v1.id } })).status === 'REJECTED');
    ok('version 1 cannot be accepted after', (await A.post(`/api/quotes/${v1.id}/accept`, {}, 'csr')).status === 409);
  });

  await scenario(G3, 'over the credit limit: the quote is accepted and the order waits for a manager', async (ok) => {
    const c = await customer();
    await setTier(c, 'D', { creditLimit: 1000 });
    const { quote: q } = await quoted(c);
    const acc = await A.post(`/api/quotes/${q.id}/accept`, {}, 'csr');
    ok('accepted with a warning', acc.status === 201 && acc.body?.creditHold && /credit/i.test(acc.body?.warning || ''), JSON.stringify(acc.body).slice(0, 200));
    const o = await orderOf(acc.body.order.id);
    ok('the order is on HOLD', o.status === 'HOLD');
    ok('the hold is on record', (await prisma.auditLog.count({ where: { resourceId: o.id, eventType: { contains: 'CREDIT' } } })) >= 1);
    const held = await A.get('/api/orders/credit-holds', 'admin');
    ok('it is on the credit holds list', held.body?.data?.some((h) => h.id === o.id));
    ok('a clerk cannot release it', (await A.post(`/api/orders/${o.id}/credit-release`, { note: 'x' }, 'csr')).status === 403);
    ok('a clerk cannot confirm it around the hold', (await A.put(`/api/orders/${o.id}`, { status: 'CONFIRMED' }, 'csr')).status === 409 && (await orderOf(o.id)).status === 'HOLD');
    const rel = await A.post(`/api/orders/${o.id}/credit-release`, { note: 'QA approved' }, 'admin');
    ok('a manager releases it', ok2(rel) && (await orderOf(o.id)).status !== 'HOLD', rel.status);
  });

  await scenario(G3, 'a quote of another branch cannot be accepted by id', async (ok) => {
    const c = await customer();
    const { quote: q } = await quoted(c, { who: 'branchA' });
    ok('branch B: 404', (await A.post(`/api/quotes/${q.id}/accept`, {}, 'branchB')).status === 404);
    ok('branch B cannot reject it either', (await A.post(`/api/quotes/${q.id}/reject`, {}, 'branchB')).status === 404);
    ok('it is still open', (await prisma.quote.findUnique({ where: { id: q.id } })).status === 'SENT');
    ok('a customer login cannot accept a staff quote', [401, 403].includes((await A.post(`/api/quotes/${q.id}/accept`, {}, 'custA')).status));
  });

  await scenario(G3, 'a quote line must come from its own request', async (ok) => {
    const c = await customer();
    const r1 = await rfq(c, [plateLine()]); const r2 = await rfq(c, [plateLine()]);
    const x = await A.post(`/api/rfqs/${r1.id}/quotes`, { lines: [{ rfqLineId: r2.lines[0].id, unitPrice: 1, priceUnit: 'CWT' }] }, 'csr');
    ok('a line of another request: 400', x.status === 400 && /not on this RFQ/i.test(x.body?.error));
    ok('a quote with no lines: 400', (await A.post(`/api/rfqs/${r1.id}/quotes`, { lines: [] }, 'csr')).status === 400);
    ok('a whole number of lead days only', (await A.post(`/api/rfqs/${r1.id}/quotes`, { lines: [{ rfqLineId: r1.lines[0].id, unitPrice: 1, priceUnit: 'CWT', leadTimeDays: 2.5 }] }, 'csr')).status === 400);
    ok('a bad tolerance on the quote line: 400', (await A.post(`/api/rfqs/${r1.id}/quotes`, { lines: [{ rfqLineId: r1.lines[0].id, unitPrice: 1, priceUnit: 'CWT', lenTolerancePlus: -2 }] }, 'csr')).status === 400);
    ok('no quote was saved by any of these', (await prisma.quote.count({ where: { rfqId: r1.id } })) === 0);
  });

  await scenario(G3, 'a quote line can change a requirement; the change, not the request, reaches the order', async (ok) => {
    const c = await customer();
    const r = await rfq(c, [plateLine()]);
    const q = await quote(r, [{ rfqLineId: r.lines[0].id, unitPrice: 65, priceUnit: 'CWT', thicknessIn: 0.625, certRequirements: ['MTR'] }]);
    ok('the quote has the new thickness and keeps the rest', Number(q.lines[0].thicknessIn) === 0.625 && Number(q.lines[0].widthIn) === 48 && JSON.stringify(q.lines[0].certRequirements) === '["MTR"]');
    const o = await orderOf((await A.post(`/api/quotes/${q.id}/accept`, {}, 'csr')).body.order.id);
    ok('the order has the quoted thickness and certificates', Number(o.lines[0].thicknessIn) === 0.625 && JSON.stringify(o.lines[0].certRequirements) === '["MTR"]', JSON.stringify(o.lines[0]).slice(0, 200));
    ok('and the request\'s width and length', Number(o.lines[0].widthIn) === 48 && Number(o.lines[0].lengthIn) === 96);
  });

  await scenario(G3, 'the accepted order goes to the shop floor with what the customer asked for (J-009)', async (ok) => {
    const c = await customer();
    const { quote: q } = await quoted(c);
    const o = await orderOf((await A.post(`/api/quotes/${q.id}/accept`, {}, 'csr')).body.order.id);
    const wo = await A.post(`/api/orders/intake/${o.id}/create-work-orders`, {}, 'csr');
    ok('work orders made', wo.status === 200 && wo.body?.data?.count === 1, JSON.stringify(wo.body).slice(0, 200));
    const job = await prisma.job.findFirst({ where: { orderId: o.id } });
    ok('the job is for the order line', job?.orderLineId === o.lines[0].id);
    ok('its instructions carry the size, grade, finish, tolerance and certificates', /Size 0\.5 x 48 x 96/.test(job.instructions) && new RegExp(`Grade ${heat.grade.code}`).test(job.instructions) && /Pickled/.test(job.instructions) && /thickness \+0\.01\/-0/.test(job.instructions) && /MTR, COC/.test(job.instructions), job.instructions);
    ok('and the processing and other requirements', /Shear to size/.test(job.instructions) && /Flatness/.test(job.instructions));
    const notes = JSON.parse(job.notes || '{}');
    ok('the requirements are also kept as data on the job', notes.requirements?.thicknessIn === 0.5 && notes.requirements?.certRequirements?.includes('COC'), job.notes);
    const again = await A.post(`/api/orders/intake/${o.id}/create-work-orders`, {}, 'csr');
    ok('asking twice makes no second job', again.status === 200 && (await prisma.job.count({ where: { orderId: o.id } })) === 1);
  });

  await scenario(G3, 'a lost answer on acceptance: the retry with the same key gives the same order', async (ok) => {
    const c = await customer();
    const { quote: q } = await quoted(c);
    const key = `qa-${run}-${tag('ACC')}`;
    const t = await (await import('./phase4-lib.mjs')).tokenOf('csr');
    await sendAndHangUp('POST', `/api/quotes/${q.id}/accept`, {}, { Authorization: `Bearer ${t}`, 'Idempotency-Key': key });
    await sleep(400);
    const retry = await raw('POST', `/api/quotes/${q.id}/accept`, {}, 'csr', { 'Idempotency-Key': key });
    ok('the retry is answered (201 replayed, or 409 already accepted)', retry.status === 201 || retry.status === 409, retry.status);
    ok('one order exists', (await prisma.order.count({ where: { buyerId: c.id } })) === 1);
    ok('when replayed, it names that order', retry.status !== 201 || retry.body?.order?.id === (await prisma.order.findFirst({ where: { buyerId: c.id } })).id);
  });

  await scenario(G3, 'there is no approval step on quotes to go around: the only approval is the credit hold', async (ok) => {
    const c = await customer();
    const { quote: q } = await quoted(c, { send: false });
    ok('a quote is never put in PENDING_APPROVAL by the system', (await prisma.quote.count({ where: { status: 'PENDING_APPROVAL', createdAt: { gt: T0 } } })) === 0);
    ok('a draft can be accepted directly (the customer said yes on the phone)', (await A.post(`/api/quotes/${q.id}/accept`, {}, 'csr')).status === 201);
  }, { status: 'NOT APPLICABLE beyond credit: no quote approval rule exists; none was invented' });
}

// ══ 4. Sales orders and the hand-off to fulfilment ═══════════════════════════════════════
const G4 = 'Sales orders and fulfilment hand-off';
if (want(4)) {
  await scenario(G4, 'an order with no lines may be kept as a draft but cannot go further (H-011)', async (ok) => {
    const c = await customer();
    const d = await A.post('/api/orders', { orderType: 'SO', buyerId: c.id, locationId: L1.id }, 'csr');
    ok('a draft with a customer and no lines is kept', d.status === 201 && d.body?.status === 'DRAFT');
    for (const to of ['CONFIRMED', 'PENDING']) {
      const r = await A.put(`/api/orders/${d.body.id}`, { status: to }, 'csr');
      ok(`moving it to ${to}: 409 with the reason`, r.status === 409 && r.body?.code === 'NO_LINES', `${r.status} ${JSON.stringify(r.body)}`);
    }
    ok('a new order straight to CONFIRMED with no lines: 400', (await A.post('/api/orders', { orderType: 'SO', buyerId: c.id, locationId: L1.id, status: 'CONFIRMED' }, 'csr')).status === 400);
    ok('it is still a draft', (await orderOf(d.body.id)).status === 'DRAFT');
    ok('it can be cancelled', (await A.put(`/api/orders/${d.body.id}`, { status: 'CANCELLED' }, 'csr')).status === 200);
  });

  await scenario(G4, 'a quoted order is reserved, shipped and invoiced with the quote\'s tax', async (ok) => {
    const c = await customer();
    const { quote: q } = await quoted(c, { qty: 1000 });
    const o = await orderOf((await A.post(`/api/quotes/${q.id}/accept`, {}, 'csr')).body.order.id);
    const coilId = await B.received({ weightLb: 1500 });
    ok('stock reserved against the order line', ok2(await B.reserve(o, o.lines[0], coilId, 1000)));
    const s = await B.shipment(o, [[o.lines[0], 1000]]);
    ok('a shipment is made', s.status === 201, s.status);
    const d = await B.dispatch(s.body);
    ok('dispatched', ok2(d), d.status);
    const inv = await B.invoicesOf(o.id);
    ok('one invoice', inv.length === 1, inv.length);
    ok('the invoice bills the quote\'s subtotal and tax', near(inv[0].subtotal, q.subtotal) && near(inv[0].taxAmount, q.taxAmount) && near(inv[0].totalAmount, q.totalAmount), `${inv[0]?.subtotal} ${inv[0]?.taxAmount}`);
    ok('the invoice line carries the order line', inv[0].lines[0].orderLineId === o.lines[0].id);
  });

  await scenario(G4, 'a partial shipment bills its part; the second bills the rest and the tax adds up', async (ok) => {
    const c = await customer();
    const { quote: q } = await quoted(c, { qty: 2000 });
    const o = await orderOf((await A.post(`/api/quotes/${q.id}/accept`, {}, 'csr')).body.order.id);
    const coilId = await B.received({ weightLb: 2500 });
    await B.reserve(o, o.lines[0], coilId, 2000);
    const s1 = await B.shipment(o, [[o.lines[0], 800]]); await B.dispatch(s1.body);
    const s2 = await B.shipment(o, [[o.lines[0], 1200]]); await B.dispatch(s2.body);
    const inv = (await B.invoicesOf(o.id)).filter((i) => i.kind === 'INVOICE');
    ok('two invoices', inv.length === 2, inv.length);
    ok('the first bills 800 of 2000', near(inv[0].subtotal, money(Number(q.subtotal) * 0.4)), inv[0]?.subtotal);
    ok('together they bill the order subtotal, tax and total exactly', near(inv.reduce((s, i) => s + Number(i.subtotal), 0), q.subtotal) && near(inv.reduce((s, i) => s + Number(i.taxAmount), 0), q.taxAmount) && near(inv.reduce((s, i) => s + Number(i.totalAmount), 0), q.totalAmount));
    const after = await orderOf(o.id);
    ok('the line has shipped 2000', Number(after.lines[0].qtyShipped) === 2000);
  });

  await scenario(G4, 'an edit made from an old copy is refused, not saved over the newer one (G-020)', async (ok) => {
    const o = await B.order([B.line(500)], { who: 'admin', status: 'DRAFT' });
    const first = await A.put(`/api/orders/${o.id}`, { notes: 'first', expectedUpdatedAt: o.updatedAt }, 'csr');
    ok('the first edit saves', first.status === 200);
    const second = await A.put(`/api/orders/${o.id}`, { notes: 'second', expectedUpdatedAt: o.updatedAt }, 'csr');
    ok('the second, from the old copy: 409 STALE_EDIT', second.status === 409 && second.body?.code === 'STALE_EDIT');
    ok('the first edit is what is saved', (await orderOf(o.id)).notes === 'first');
  });

  await scenario(G4, 'cancelling an order gives its reserved stock back', async (ok) => {
    const o = await B.order([B.line(700)], { who: 'admin' });
    const coilId = await B.received({ weightLb: 1000 });
    await B.reserve(o, o.lines[0], coilId, 700);
    const inv = () => prisma.inventory.findUnique({ where: { coilId } });
    ok('700 reserved', Number((await inv()).qtyAllocated) === 700);
    ok('cancelled', (await A.put(`/api/orders/${o.id}`, { status: 'CANCELLED' }, 'csr')).status === 200);
    const after = await inv();
    ok('the reservation is gone and the stock is available again', Number(after.qtyAllocated) === 0 && Number(after.qtyAvailable) === 1000, JSON.stringify(after));
    ok('no reservation row is left', (await prisma.orderLineAllocation.count({ where: { orderLine: { orderId: o.id } } })) === 0);
  });

  await scenario(G4, 'order entry sells from the person\'s own branch: taxed, filed and sold by that branch (S-008, C-012)', async (ok) => {
    const c = await customer({ state: 'IN' });
    const br = await A.get('/api/orders/intake/branches', 'csr');
    ok('the order desk\'s branch list is its branches, with its home branch named', br.status === 200 && br.body.homeLocationId === L1.id && br.body.data.some((b) => b.id === L1.id), JSON.stringify(br.body).slice(0, 200));
    const one = await A.get('/api/orders/intake/branches', 'branchA');
    ok('a one-branch login is offered only its branch', one.status === 200 && one.body.data.length === 1 && one.body.data[0].id === L1.id, JSON.stringify(one.body).slice(0, 200));
    ok('a manager\'s list holds every branch', (await A.get('/api/orders/intake/branches', 'admin')).body.data.length >= 8);
    const line = { productId: each.id, description: 'QA intake each', qty: 4, uom: 'EA', unitPrice: listEach };
    const r = await A.post('/api/orders/intake', { source: 'PHONE', division: 'METALS', location: L1.code, customerId: c.id, customerName: c.name, lines: [line], status: 'SUBMITTED' }, 'csr');
    ok('saved', r.status === 201, `${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
    const o = await orderOf(r.body.data.id);
    ok('filed under the branch named', o.locationId === L1.id);
    ok('taxed at that branch\'s state', near(o.taxAmount, money(4 * listEach * rates.OH)), o.taxAmount);
    ok('sold by the company that owns the branch', o.sellerId === L1.ownerId, `${o.sellerId} vs ${L1.ownerId}`);
    const other = await A.post('/api/orders/intake', { source: 'PHONE', location: L2.code, customerId: c.id, customerName: c.name, lines: [line], status: 'DRAFT' }, 'branchA');
    ok('naming a branch that is not theirs is refused (decision 2), not taxed there and filed here', other.status === 403, other.status);
    const legacy = await A.post('/api/orders/intake', { source: 'PHONE', location: 'NOWHERE', customerId: c.id, customerName: c.name, lines: [line], status: 'DRAFT' }, 'csr');
    ok('a name that is no branch falls back to the home branch for branch and tax alike', legacy.status === 201 && (await orderOf(legacy.body.data.id)).locationId === L1.id && near((await orderOf(legacy.body.data.id)).taxAmount, money(4 * listEach * rates.OH)));
  });

  await scenario(G4, 'requirements typed at order entry reach the order line and the work order (J-001, J-009)', async (ok) => {
    const c = await customer();
    const r = await A.post('/api/orders/intake', {
      source: 'PHONE', location: L1.code, customerId: c.id, customerName: c.name, status: 'DRAFT',
      lines: [{ description: 'QA intake plate', qty: 2000, uom: 'LB', unitPrice: 0.65, thicknessIn: 0.25, widthIn: 60, lengthIn: 120, certRequirements: ['MTR'], tolerancePreset: 'ASTM A6', specNotes: 'Mill edge OK', processes: [{ name: 'SHEAR' }] }],
    }, 'csr');
    ok('saved', r.status === 201, JSON.stringify(r.body).slice(0, 200));
    const o = await orderOf(r.body.data.id);
    ok('the line has the certificates, tolerance and notes', JSON.stringify(o.lines[0].certRequirements) === '["MTR"]' && o.lines[0].tolerancePreset === 'ASTM A6' && o.lines[0].specNotes === 'Mill edge OK');
    await A.post(`/api/orders/intake/${o.id}/submit`, {}, 'csr');
    const wo = await A.post(`/api/orders/intake/${o.id}/create-work-orders`, {}, 'csr');
    const job = await prisma.job.findFirst({ where: { orderId: o.id } });
    ok('the work order carries them', wo.status === 200 && /Size 0\.25 x 60 x 120/.test(job?.instructions || '') && /ASTM A6/.test(job.instructions) && /MTR/.test(job.instructions) && /Mill edge/.test(job.instructions), job?.instructions);
    ok('and the processing chosen', /SHEAR/.test(job.operationType));
  });

  await scenario(G4, 'a stock order ships without a work order', async (ok) => {
    const { order: o, shipment: s } = await B.readyToShip(600);
    ok('no job was needed', (await prisma.job.count({ where: { orderId: o.id } })) === 0);
    ok('dispatched', ok2(await B.dispatch(s)));
    ok('invoiced', (await B.invoicesOf(o.id)).length === 1);
  });

  await scenario(G4, 'more than is in stock: what is there is reserved, the rest waits on the open line', async (ok) => {
    const o = await B.order([B.line(3000)], { who: 'admin' });
    const coilId = await B.received({ weightLb: 1200 });
    const over = await B.reserve(o, o.lines[0], coilId, 3000);
    ok('reserving more than the stock item holds: refused', over.status >= 400 && over.status < 500, over.status);
    ok('reserving what is there: done', ok2(await B.reserve(o, o.lines[0], coilId, 1200)));
    const s = await B.shipment(o, [[o.lines[0], 1200]]); await B.dispatch(s.body);
    const after = await orderOf(o.id);
    ok('the line is part shipped and still open for the rest', Number(after.lines[0].qtyShipped) === 1200 && after.lines[0].lineStatus === 'PARTIAL' && after.status !== 'COMPLETE', `${after.lines[0].lineStatus} ${after.status}`);
    const more = await B.shipment(o, [[o.lines[0], 500]]);
    const out = more.status === 201 ? await B.dispatch(more.body) : more;
    ok('sending more than is reserved is refused (decision of 2026-11-13: no shipping without a reservation)', out.status === 409, `${out.status} ${JSON.stringify(out.body).slice(0, 200)}`);
    ok('the refused load shipped nothing', Number((await orderOf(o.id)).lines[0].qtyShipped) === 1200);
  });

  await scenario(G4, 'the order list answers a page in summary form (G-014)', async (ok) => {
    const full = await raw('GET', '/api/orders?limit=50', undefined, 'admin');
    const sum = await raw('GET', '/api/orders?limit=50&view=summary', undefined, 'admin');
    ok('both 200', full.status === 200 && sum.status === 200);
    ok('the summary is smaller', sum.raw.length < full.raw.length, `${sum.raw.length} vs ${full.raw.length}`);
    ok('the summary has a line count and the customer, not the lines', sum.body.every((o) => typeof o.lineCount === 'number' && !('lines' in o)));
    ok('a total count is given', Number(sum.headers.get('x-total-count')) >= sum.body.length || sum.body.length <= 50);
  });
}

// ══ 5. Counter (POS) ════════════════════════════════════════════════════════════════════
const G5 = 'Counter sales (POS)';
if (want(5)) {
  await scenario(G5, 'a cash sale: paid invoice, change, stock off the shelf, all at the cashier\'s branch', async (ok) => {
    await shelf(each, 30);
    const before = await onShelf(each);
    const s = sale([{ productId: each.id, quantity: 3 }]);
    const r = await pay(s, { method: 'CASH', amountTendered: 1000 });
    ok('201', r.status === 201, `${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
    const o = await orderOf(r.body.orderId);
    const total = money(3 * listEach * (1 + rates.OH));
    ok('the order is complete, at the cashier\'s branch, taxed there', o.status === 'COMPLETE' && o.locationId === L1.id && near(o.totalAmount, total), `${o.status} ${o.totalAmount} ${total}`);
    ok('change is what was tendered less the total', near(r.body.change, money(1000 - total)));
    ok('one paid invoice with one payment for the total', o.invoices.length === 1 && o.invoices[0].status === 'PAID' && o.invoices[0].payments.length === 1 && near(o.invoices[0].payments[0].amount, total));
    ok('3 pieces off the shelf', (await onShelf(each)) === before - 3, `${before} → ${await onShelf(each)}`);
    ok('the cashier is on record for the invoice and the money', (await prisma.auditLog.count({ where: { resourceId: o.invoices[0].id, userId: users.csr.id } })) >= 2);
  });

  await scenario(G5, 'several lines, the same item twice: one line, priced once', async (ok) => {
    const other = await prisma.product.findFirst({ where: { isActive: true, priceUnit: 'EACH', basePriceCwt: { gt: 0 }, id: { not: each.id } } });
    const s = sale([{ productId: each.id, quantity: 2 }, { productId: other.id, quantity: 1 }, { productId: each.id, quantity: 1 }]);
    const r = await pay(s, { method: 'CHECK', reference: '1042' });
    const o = await orderOf(r.body.orderId);
    ok('two lines', o.lines.length === 2, o.lines.length);
    ok('the repeated item is one line of 3', Number(o.lines.find((l) => l.productId === each.id).qtyOrdered) === 3);
    ok('the subtotal is the lines', near(o.subtotal, money(3 * listEach + Number(other.basePriceCwt))));
    ok('the check number is kept', o.invoices[0].payments[0].referenceNumber === '1042' && o.invoices[0].payments[0].paymentMethod === 'CHECK');
  });

  await scenario(G5, 'an account customer pays its contract price at the counter; an exempt one pays no tax', async (ok) => {
    const c = await customer(); await setTier(c, 'A');
    const r = await pay(sale([{ productId: each.id, quantity: 2 }], { customerId: c.id }), { method: 'CARD', reference: 'QA-AUTH-1' });
    const o = await orderOf(r.body.orderId);
    const unit = money(listEach * levels.CONTRACT_B);
    ok('contract price', near(o.lines[0].unitPrice, unit) && o.buyerId === c.id, `${o.lines[0].unitPrice} vs ${unit}`);
    const ex = await customer({ taxExempt: true });
    const r2 = await pay(sale([{ productId: each.id, quantity: 2 }], { customerId: ex.id }), { method: 'CASH', amountTendered: 9999 });
    const o2 = await orderOf(r2.body.orderId);
    ok('exempt: no tax', near(o2.taxAmount, 0) && near(o2.totalAmount, o2.subtotal));
    ok('the card approval code is kept', o.invoices[0].payments[0].referenceNumber === 'QA-AUTH-1');
  });

  await scenario(G5, 'a payment that does not go through leaves no sale, no invoice and no stock change', async (ok) => {
    await shelf(each, 10);
    const before = await onShelf(each);
    const nOrders = await prisma.order.count(); const nInv = await prisma.invoice.count();
    ok('a card with no approval code: 400', (await pay(sale([{ productId: each.id, quantity: 1 }]), { method: 'CARD' })).status === 400);
    ok('a check with no number: 400', (await pay(sale([{ productId: each.id, quantity: 1 }]), { method: 'CHECK' })).status === 400);
    ok('cash short of the total: 400', (await pay(sale([{ productId: each.id, quantity: 1 }]), { method: 'CASH', amountTendered: 0.01 })).status === 400);
    ok('a method that does not exist: 400', (await pay(sale([{ productId: each.id, quantity: 1 }]), { method: 'BITCOIN' })).status === 400);
    ok('no order and no invoice were written', (await prisma.order.count()) === nOrders && (await prisma.invoice.count()) === nInv);
    ok('the shelf is unchanged', (await onShelf(each)) === before);
  });

  await scenario(G5, 'the same sale sent three times at once is one sale', async (ok) => {
    const s = sale([{ productId: each.id, quantity: 1 }]);
    const res = await Promise.all([1, 2, 3].map(() => pay(s, { method: 'CASH', amountTendered: 500 })));
    ok('every answer is a success naming one order', res.every((r) => ok2(r)) && new Set(res.map((r) => r.body.orderId)).size === 1, res.map((r) => r.status).join());
    ok('one order', (await prisma.order.count({ where: { poReference: `QS:${s.id}` } })) === 1);
    ok('one invoice', (await prisma.invoice.count({ where: { order: { poReference: `QS:${s.id}` } } })) === 1);
  });

  await scenario(G5, 'a voided sale is cancelled, credited, refunded and put back on the shelf, once (G-009)', async (ok) => {
    await shelf(each, 12);
    const s = sale([{ productId: each.id, quantity: 2 }]);
    const r = await pay(s, { method: 'CASH', amountTendered: 500 });
    const mid = await onShelf(each);
    const statsBefore = (await A.get('/api/pos/quick-sale/daily-stats', 'csr')).body;
    ok('a sales login cannot void (a manager does, as before)', (await A.post(`/api/pos/quick-sale/${s.id}/void`, { reason: 'x' }, 'csr')).status === 403);
    ok('a reason is required', (await A.post(`/api/pos/quick-sale/${s.id}/void`, {}, 'admin')).status === 400);
    const v = await A.post(`/api/pos/quick-sale/${s.id}/void`, { reason: 'wrong item' }, 'admin');
    ok('voided', v.status === 200 && v.body?.creditMemo, v.status);
    const o = await orderOf(r.body.orderId);
    ok('the order is CANCELLED, so reports by status leave it out', o.status === 'CANCELLED', o.status);
    ok('the reason is kept', /VOIDED: wrong item/.test(o.notes));
    const memo = o.invoices.find((i) => i.kind === 'CREDIT');
    ok('a credit memo for the whole sale', memo && near(-Number(memo.totalAmount), o.totalAmount), memo?.totalAmount);
    ok('the money is refunded', memo?.payments?.some((p) => Number(p.amount) < 0) || (await prisma.payment.count({ where: { invoiceId: memo?.id } })) > 0);
    ok('the pieces are back on the shelf', (await onShelf(each)) === mid + 2);
    ok('a second void: 409, nothing more', (await A.post(`/api/pos/quick-sale/${s.id}/void`, { reason: 'again' }, 'admin')).status === 409 && (await onShelf(each)) === mid + 2);
    const statsAfter = (await A.get('/api/pos/quick-sale/daily-stats', 'csr')).body;
    ok('the day\'s figures count it as voided, not sold', statsAfter.voidedCount === statsBefore.voidedCount + 1 && statsAfter.saleCount === statsBefore.saleCount - 1, `${JSON.stringify(statsBefore)} ${JSON.stringify(statsAfter)}`);
  });

  await scenario(G5, 'the connection drops after the sale is sent: the retry finds the sale, it is not rung up twice', async (ok) => {
    const s = sale([{ productId: each.id, quantity: 1 }]);
    const t = await (await import('./phase4-lib.mjs')).tokenOf('csr');
    await sendAndHangUp('POST', '/api/pos/quick-sale/process-payment', { sale: s, payment: { method: 'CASH', amountTendered: 100 } }, { Authorization: `Bearer ${t}` });
    await sleep(500);
    const retry = await pay(s, { method: 'CASH', amountTendered: 100 });
    ok('the retry succeeds', ok2(retry), retry.status);
    ok('one order and one invoice', (await prisma.order.count({ where: { poReference: `QS:${s.id}` } })) === 1 && (await prisma.invoice.count({ where: { order: { poReference: `QS:${s.id}` } } })) === 1);
    ok('the receipt can be fetched again', (await A.get(`/api/pos/quick-sale/${s.id}/receipt`, 'csr')).status === 200);
  });

  await scenario(G5, 'more than is on the shelf is refused and nothing is taken', async (ok) => {
    const p = await prisma.product.create({ data: { sku: tag('QA-P5-SHELF'), name: 'QA shelf item', form: 'PLATE', productType: 'FLAT', isActive: true, priceUnit: 'EACH', basePriceCwt: 5 } });
    await shelf(p, 4);
    const n = await prisma.order.count();
    const r = await pay(sale([{ productId: p.id, quantity: 5 }]), { method: 'CASH', amountTendered: 100 });
    ok('refused with how many there are', r.status >= 400 && r.status < 500 && /4/.test(r.body?.error || ''), `${r.status} ${JSON.stringify(r.body)}`);
    ok('no order', (await prisma.order.count()) === n);
    ok('the shelf still has 4', (await onShelf(p)) === 4);
    ok('4 can be sold', ok2(await pay(sale([{ productId: p.id, quantity: 4 }]), { method: 'CASH', amountTendered: 100 })) && (await onShelf(p)) === 0);
  });

  await scenario(G5, 'the counter sells from the cashier\'s branch; another branch is refused, a manager can choose (J-006)', async (ok) => {
    const other = await pay(sale([{ productId: each.id, quantity: 1 }], { locationId: L2.id }), { method: 'CASH', amountTendered: 100 }, 'branchA');
    ok('a clerk naming another branch: 403', other.status === 403, other.status);
    const m = await pay(sale([{ productId: each.id, quantity: 1 }], { locationId: L2.id }), { method: 'CASH', amountTendered: 100 }, 'admin');
    const o = await orderOf(m.body.orderId);
    ok('a manager selling at branch 2: filed there and taxed at its state', o.locationId === L2.id && near(o.taxAmount, money(listEach * rates.IN)), `${o.locationId} ${o.taxAmount}`);
    const retail = (loc) => A.post('/api/orders/intake', { source: 'RETAIL', division: 'OUTLET', ...(loc && { location: loc }), customerName: 'Walk-In', lines: [{ productId: each.id, description: 'QA retail', qty: 2, uom: 'EA', unitPrice: listEach }], status: 'DRAFT' }, 'branchA');
    const fixed = await retail('JACKSON');
    ok('Retail POS sending the old fixed branch (Jackson, Michigan) for an Ohio clerk: refused, not taxed in Michigan', fixed.status === 403, fixed.status);
    const own = await retail(L1.code);
    const ro = await orderOf(own.body.data.id);
    ok('Retail POS with the clerk\'s own branch: Ohio tax, Ohio branch', own.status === 201 && ro.locationId === L1.id && near(ro.taxAmount, money(2 * listEach * rates.OH)), `${own.status} ${ro?.taxAmount}`);
  });

  await scenario(G5, 'the unused counter-session flow no longer creates customers or orders (S-022)', async (ok) => {
    const nOrg = await prisma.organization.count(); const nOrd = await prisma.order.count();
    const s = await A.post('/api/pos/sessions', { userId: users.csr.id, entryPoint: 'counter', terminalId: tag('QA-T') }, 'csr');
    const sid = s.body?.sessionId || 'none';
    const cust = await A.post(`/api/pos/sessions/${sid}/customers`, { name: 'QA should not exist' }, 'csr');
    ok('creating a customer from a session: 410 with where to do it', cust.status === 410 && /Customers/.test(cust.body?.error), `${cust.status} ${JSON.stringify(cust.body)}`);
    const sub = await A.post(`/api/pos/sessions/${sid}/submit`, {}, 'csr');
    ok('submitting a session order: 410 with where to do it', sub.status === 410 && /Retail POS/.test(sub.body?.error));
    ok('the other address too', (await A.post(`/api/pos/sessions/${sid}/order/submit`, {}, 'csr')).status === 410);
    ok('nothing was created', (await prisma.organization.count()) === nOrg && (await prisma.order.count()) === nOrd);
    ok('the session\'s reading steps still answer', (await A.get('/api/pos/workflow/definition', 'csr')).status === 200);
  });

  await scenario(G5, 'a partial return of a delivered order credits only that part, with its share of tax', async (ok) => {
    const c = await customer();
    const { quote: q } = await quoted(c, { qty: 1000 });
    const o = await orderOf((await A.post(`/api/quotes/${q.id}/accept`, {}, 'csr')).body.order.id);
    const coilId = await B.received({ weightLb: 1200 });
    await B.reserve(o, o.lines[0], coilId, 1000);
    const s = await B.shipment(o, [[o.lines[0], 1000]]); await B.dispatch(s.body); await B.deliver(s.body);
    const ret = await A.post('/api/returns', { orderId: o.id, reason: 'QA damaged', lines: [{ orderLineId: o.lines[0].id, quantity: 250, disposition: 'SCRAP' }] }, 'csr');
    ok('return opened', ret.status === 201, `${ret.status} ${JSON.stringify(ret.body).slice(0, 200)}`);
    const id = ret.body?.id || ret.body?.data?.id;
    const rec = await A.post(`/api/returns/${id}/receive`, {}, 'admin');
    ok('received', ok2(rec), rec.status);
    const all = await B.invoicesOf(o.id);
    const memo = all.find((i) => i.kind === 'CREDIT');
    ok('return received', true, `${JSON.stringify(rec.body).slice(0, 300)} invoices ${all.map((i) => `${i.kind}:${i.subtotal}`).join()}`);
    ok('a credit memo for a quarter of the subtotal', memo && near(-Number(memo.subtotal), money(Number(q.subtotal) / 4)), memo?.subtotal);
    ok('with a quarter of the tax', near(-Number(memo?.taxAmount), money(Number(q.taxAmount) / 4)));
    ok('more than shipped cannot be returned', (await A.post('/api/returns', { orderId: o.id, reason: 'x', lines: [{ orderLineId: o.lines[0].id, quantity: 900 }] }, 'csr')).status >= 400);
  });
}

// ══ 6. Web shop and customer portal ═════════════════════════════════════════════════════
const G6 = 'Web shop and customer portal';
if (want(6)) {
  const shopLine = (p, quantity, extended) => ({ productId: p.id, quantity, sku: p.sku, ...(extended !== undefined && { extended }) });

  await scenario(G6, 'a registered buyer\'s order uses the system price, and the buyer is told when it changed', async (ok) => {
    const c = await customer(); const me = await customerLogin(c);
    const r = await me.call('POST', '/api/ecom/checkout/submit', { items: [shopLine(each, 3, 1)], deliveryMethod: 'PICKUP' });
    ok('accepted into the inbox', ok2(r) && r.body?.data?.id, r.status);
    const row = await prisma.onlineOrder.findUnique({ where: { id: r.body.data.id } });
    ok('saved for this customer only', row.customerId === c.id && row.status === 'NEEDS_REVIEW');
    ok('at the system price, not the browser\'s', near(row.items[0].extended, money(3 * listEach)) && near(row.subtotal, money(3 * listEach)), JSON.stringify(row.items[0]));
    ok('the buyer is told the price was updated', Array.isArray(r.body.data.priceNotices) && /Price updated/.test(r.body.data.priceNotices[0]), JSON.stringify(r.body.data.priceNotices));
    ok('the CSR sees it in the notes', /PRICE CORRECTED/.test(row.notes || ''));
    const fair = await me.call('POST', '/api/ecom/checkout/submit', { items: [shopLine(each, 1, listEach)], deliveryMethod: 'PICKUP' });
    ok('no notice when the price was right', ok2(fair) && !fair.body.data.priceNotices);
  });

  await scenario(G6, 'a contract customer is charged its contract price on the web', async (ok) => {
    const c = await customer(); await setTier(c, 'A'); const me = await customerLogin(c);
    const p = await me.call('POST', '/api/ecom/pricing/config', { productId: each.id, quantity: 2, priceLevel: 'RETAIL' });
    ok('the shop shows the contract price', near(p.body?.unitPrice, listEach * levels.CONTRACT_B, 0.0001), JSON.stringify(p.body).slice(0, 200));
    const r = await me.call('POST', '/api/ecom/checkout/submit', { items: [shopLine(each, 2, p.body.extended)], deliveryMethod: 'PICKUP' });
    const row = await prisma.onlineOrder.findUnique({ where: { id: r.body.data.id } });
    ok('the web order is at the contract price', near(row.subtotal, money(2 * listEach * levels.CONTRACT_B), 0.02), row.subtotal);
  });

  await scenario(G6, 'the same checkout sent twice with one key is one web order', async (ok) => {
    const c = await customer(); const me = await customerLogin(c);
    const key = `qa-${run}-${tag('WEB')}`;
    const body = { items: [shopLine(each, 1, listEach)], deliveryMethod: 'PICKUP' };
    const [a, b] = await Promise.all([me.call('POST', '/api/ecom/checkout/submit', body, { 'Idempotency-Key': key }), me.call('POST', '/api/ecom/checkout/submit', body, { 'Idempotency-Key': key })]);
    const third = await me.call('POST', '/api/ecom/checkout/submit', body, { 'Idempotency-Key': key });
    ok('answered', [a, b, third].every((r) => r.status < 500), [a, b, third].map((r) => r.status).join());
    ok('one web order', (await prisma.onlineOrder.count({ where: { customerId: c.id } })) === 1);
    ok('the later answers name the same order', [a, b, third].filter((r) => ok2(r)).every((r) => r.body?.data?.id === (a.body?.data?.id || b.body?.data?.id)));
  });

  await scenario(G6, 'accepting a web order: taxed and filed at one branch, priced per piece (J-005)', async (ok) => {
    const c = await customer({ state: 'OH' }); const me = await customerLogin(c);
    const r = await me.call('POST', '/api/ecom/checkout/submit', { items: [shopLine(each, 4, money(4 * listEach))], deliveryMethod: 'PICKUP' });
    const acc = await A.post(`/api/orders/online/${r.body.data.id}/accept`, { locationId: L2.id }, 'admin');
    ok('accepted', acc.status === 200, `${acc.status} ${JSON.stringify(acc.body).slice(0, 200)}`);
    const o = await prisma.order.findFirst({ where: { poReference: r.body.data.orderNumber }, include: { lines: true } });
    ok('taxed at the branch named (Indiana)', near(o.taxAmount, money(4 * listEach * rates.IN)), o.taxAmount);
    ok('and filed under that branch', o.locationId === L2.id, o.locationId);
    ok('each line is priced each, not per hundredweight', o.lines.every((l) => l.priceUnit === 'EACH' && l.unit === 'EA'));
    ok('accepting it again: 409', (await A.post(`/api/orders/online/${r.body.data.id}/accept`, { locationId: L2.id }, 'admin')).status === 409);
    const r2 = await me.call('POST', '/api/ecom/checkout/submit', { items: [shopLine(each, 1, listEach)], deliveryMethod: 'PICKUP' });
    const into = await A.post(`/api/orders/online/${r2.body.data.id}/accept`, { locationId: L2.id }, 'branchA');
    ok('a one-branch clerk cannot accept it into another branch', into.status === 403, into.status);
    ok('the refused attempt left it waiting', (await prisma.onlineOrder.findUnique({ where: { id: r2.body.data.id } })).status === 'NEEDS_REVIEW');
  });

  await scenario(G6, 'the web shop will not take an order with nothing to sell or a hidden item', async (ok) => {
    const c = await customer(); const me = await customerLogin(c);
    ok('an empty cart: 400', (await me.call('POST', '/api/ecom/checkout/submit', { items: [] })).status === 400);
    const p = await prisma.product.create({ data: { sku: tag('QA-P5-OFF'), name: 'QA retired', form: 'PLATE', productType: 'FLAT', isActive: false, priceUnit: 'EACH', basePriceCwt: 9 } });
    const v = await me.call('POST', '/api/ecom/cart/validate', { items: [{ productId: p.id, quantity: 1 }] });
    ok('the cart check names the retired item', v.body?.valid === false && /no longer available/.test(JSON.stringify(v.body.errors)));
    ok('checkout with it: 422', (await me.call('POST', '/api/ecom/checkout/submit', { items: [shopLine(p, 1, 9)] })).status === 422);
    ok('a quantity of zero: refused', [400, 422].includes((await me.call('POST', '/api/ecom/checkout/submit', { items: [{ productId: each.id, quantity: 0 }] })).status));
    ok('nothing saved', (await prisma.onlineOrder.count({ where: { customerId: c.id } })) === 0);
  });

  await scenario(G6, 'a price raised after the cart was filled: the order is at the new price and the buyer is told', async (ok) => {
    const p = await prisma.product.create({ data: { sku: tag('QA-P5-RISE'), name: 'QA rising', form: 'PLATE', productType: 'FLAT', isActive: true, priceUnit: 'EACH', basePriceCwt: 10 } });
    const c = await customer(); const me = await customerLogin(c);
    const shown = await me.call('POST', '/api/ecom/pricing/config', { productId: p.id, quantity: 2 });
    await A.put(`/api/pricing/list-price/${p.id}`, { listPrice: 12 }, 'admin');
    const r = await me.call('POST', '/api/ecom/checkout/submit', { items: [shopLine(p, 2, shown.body.extended)], deliveryMethod: 'PICKUP' });
    const row = await prisma.onlineOrder.findUnique({ where: { id: r.body.data.id } });
    ok('the cart showed the old price', near(shown.body.extended, 20));
    ok('the order is at the new price', near(row.subtotal, 24), row.subtotal);
    ok('the buyer is told', /Price updated/.test((r.body.data.priceNotices || []).join()), JSON.stringify(r.body.data.priceNotices));
  });

  await scenario(G6, 'a customer\'s portal shows only its own orders, shipments and documents', async (ok) => {
    const mine = await A.get('/api/ecom/my-orders', 'custA');
    const theirs = await A.get('/api/ecom/my-orders', 'custB');
    const rows = (r) => r.body?.data || r.body?.orders || [];
    ok('both answer', mine.status === 200 && theirs.status === 200, `${mine.status} ${theirs.status}`);
    const aIds = new Set(rows(mine).map((o) => o.id));
    ok('no order appears in both', !rows(theirs).some((o) => aIds.has(o.id)));
    // The portal's "my orders" are the account's web orders.
    const bWeb = await prisma.onlineOrder.findFirst({ where: { customerId: users.custB.customerId }, orderBy: { receivedAt: 'desc' } });
    if (bWeb) {
      ok('customer A opening customer B\'s web order: 404', (await A.get(`/api/ecom/my-orders/${bWeb.id}`, 'custA')).status === 404);
      const docs = await A.get(`/api/ecom/my-orders/${bWeb.id}/documents`, 'custA');
      ok('nor its documents (refused, or an empty list)', [403, 404].includes(docs.status) || (docs.status === 200 && Array.isArray(docs.body?.data) && docs.body.data.length === 0), `${docs.status} ${JSON.stringify(docs.body).slice(0, 160)}`);
    }
    const ent = await A.get(`/api/enterprise/orders?accountId=${users.custB.customerId}`, 'custA');
    const entRows = ent.body?.data || ent.body?.orders || [];
    ok('naming another account in the account portal still gives only its own', ent.status !== 200 || !entRows.some((o) => o.buyerId === users.custB.customerId || o.customerId === users.custB.customerId), JSON.stringify(ent.body).slice(0, 200));
    const ship = await A.get('/api/enterprise/shipments', 'custA');
    ok('shipments answer for its own account', [200, 404].includes(ship.status));
  });

  await scenario(G6, 'a web order cannot be placed without signing in (guest checkout is off by setting)', async (ok) => {
    const r = await http1('POST', '/api/ecom/checkout/submit', { body: { items: [{ productId: each.id, quantity: 1 }] } });
    ok('401 without a sign-in', r.status === 401, r.status);
    const rules = await A.get('/api/online-settings/checkout-rules', 'admin');
    ok('the checkout setting says guests are not allowed', rules.status !== 200 || (rules.body?.data || rules.body)?.allowGuestCheckout === false, JSON.stringify(rules.body).slice(0, 120));
    const staff = await A.post('/api/ecom/checkout/submit', { items: [{ productId: each.id, quantity: 1 }] }, 'csr');
    ok('a staff test order with no customer goes to the inbox for review, not to the shop floor', ok2(staff) && (await prisma.onlineOrder.findUnique({ where: { id: staff.body.data.id } })).internalOrderId === null, staff.status);
    const blind = await A.post(`/api/orders/online/${staff.body.data.id}/accept`, { locationId: L1.id }, 'admin');
    ok('it cannot become a sales order until a customer is named', blind.status === 400 && (await prisma.onlineOrder.findUnique({ where: { id: staff.body.data.id } })).internalOrderId === null, `${blind.status} ${JSON.stringify(blind.body).slice(0, 160)}`);
  }, { status: 'Guest checkout NOT APPLICABLE: off by the setting allowGuestCheckout' });

  await scenario(G6, 'web checkout takes no payment and says so: every web order is on account, whatever the browser sends (H-013, owner decision 10)', async (ok) => {
    const c = await customer(); const me = await customerLogin(c);
    const r = await me.call('POST', '/api/ecom/checkout/submit', { items: [shopLine(each, 1, listEach)], deliveryMethod: 'PICKUP', paymentMethod: 'CARD', cardNumber: '4111111111111111' });
    const row = await prisma.onlineOrder.findUnique({ where: { id: r.body.data.id } });
    ok('the order is taken for review', ok2(r) && row.status === 'NEEDS_REVIEW');
    ok('no card number is stored anywhere on it', !JSON.stringify(row).includes('4111111111111111'));
    ok('no payment row exists for it', (await prisma.payment.count({ where: { referenceNumber: r.body.data.orderNumber } })) === 0);
    ok('the order says "on account" and does not repeat the method the browser sent', /Payment: on account/.test(row.notes || '') && !/CARD/.test(row.notes || ''), row.notes);
  });

  await scenario(G6, 'a quote request from the web shop reaches the inbox as a quote request', async (ok) => {
    const c = await customer(); const me = await customerLogin(c);
    const r = await me.call('POST', '/api/ecom/checkout/quote', { items: [shopLine(each, 50, money(50 * listEach))], deliveryMethod: 'DELIVERY', shipToAddress: '1 QA Way', shipToCity: 'Toledo', shipToState: 'OH', shipToZip: '43601', poNumber: 'QA-WEB-PO' });
    const row = await prisma.onlineOrder.findUnique({ where: { id: r.body.data.id } });
    ok('saved as a quote request', row.source === 'ONLINE_QUOTE' && /QUOTE REQUEST/.test(row.notes));
    ok('the ship-to and PO are kept', /1 QA Way/.test(row.notes) && /PO QA-WEB-PO/.test(row.notes));
    ok('the answer says a review is needed', r.body.data.status === 'NEEDS_REVIEW' && r.body.data.quoteRequested === true);
  });
}

// ══ 7. Exceptions, security and recovery ═════════════════════════════════════════════════
const G7 = 'Exceptions, security and recovery';
if (want(7)) {
  await scenario(G7, 'customer logins cannot reach staff sales actions', async (ok) => {
    const c = await customer();
    const tries = [
      ['POST', '/api/rfqs', { customerId: c.id, lines: [plateLine()] }], ['POST', '/api/quotes', {}], ['GET', '/api/quotes'],
      ['POST', '/api/orders', B.orderBody([B.line(1)])], ['PUT', `/api/pricing/list-price/${each.id}`, { listPrice: 0.01 }],
      ['POST', '/api/pos/quick-sale/process-payment', { sale: sale([{ productId: each.id, quantity: 1 }]), payment: { method: 'CASH', amountTendered: 99 } }],
      ['GET', '/api/orders/credit-holds'], ['PATCH', `/api/customers/${c.id}`, { isActive: false }], ['GET', '/api/orders/intake/branches'],
    ];
    for (const [m, url, body] of tries) ok(`${m} ${url}: refused`, [401, 403].includes((await A.call(m, url, body, 'custA')).status));
    ok('nothing changed', (await prisma.organization.findUnique({ where: { id: c.id } })).isActive === true && Number((await prisma.product.findUnique({ where: { id: each.id } })).basePriceCwt) === listEach);
  });

  await scenario(G7, 'a branch login cannot sell, quote or invoice for another branch', async (ok) => {
    const c = await customer();
    ok('an order at another branch: 403', (await A.post('/api/orders', B.orderBody([B.line(10)], { customer: c }), 'branchB')).status === 403);
    const { quote: q } = await quoted(c, { who: 'branchA' });
    ok('accepting another branch\'s quote: 404', (await A.post(`/api/quotes/${q.id}/accept`, {}, 'branchB')).status === 404);
    const o = await B.order([B.line(10)], { customer: c, who: 'admin' });
    ok('editing another branch\'s order: refused', [403, 404].includes((await A.put(`/api/orders/${o.id}`, { notes: 'x' }, 'branchB')).status));
    ok('moving an order to another branch: refused', [403, 404].includes((await A.put(`/api/orders/${o.id}`, { locationId: L2.id }, 'branchA')).status) && (await orderOf(o.id)).locationId === L1.id);
  });

  await scenario(G7, 'the database refuses the order mid-acceptance: no half order and the quote stays open', async (ok) => {
    const c = await customer({ name: 'QA P5 FAIL ACCEPT' });
    const { quote: q } = await quoted(c);
    const fn = `qa_p5_fail_${run.toLowerCase()}`;
    psql(`CREATE OR REPLACE FUNCTION ${fn}() RETURNS trigger AS $$ BEGIN IF NEW."buyerId" = '${c.id}' THEN RAISE EXCEPTION 'qa planted failure'; END IF; RETURN NEW; END $$ LANGUAGE plpgsql; CREATE TRIGGER ${fn} BEFORE INSERT ON "OrderLine" FOR EACH ROW EXECUTE FUNCTION ${fn}();`.replace('NEW."buyerId"', `(SELECT "buyerId" FROM "Order" WHERE id = NEW."orderId")`));
    let r;
    try { r = await A.post(`/api/quotes/${q.id}/accept`, {}, 'csr'); } finally { psql(`DROP TRIGGER IF EXISTS ${fn} ON "OrderLine"; DROP FUNCTION IF EXISTS ${fn}();`); }
    ok('the answer is an error, not a success', r.status >= 400, r.status);
    ok('no order exists for the customer', (await prisma.order.count({ where: { buyerId: c.id } })) === 0);
    const after = await prisma.quote.findUnique({ where: { id: q.id } });
    ok('the quote is still SENT with no order', after.status === 'SENT' && !after.convertedOrderId, after.status);
    ok('once the fault is gone, the same quote is accepted', (await A.post(`/api/quotes/${q.id}/accept`, {}, 'csr')).status === 201);
  });

  await scenario(G7, 'bad input to the sales routes is answered with a 4xx, never a server error', async (ok) => {
    const c = await customer();
    const cases = [
      ['POST', '/api/rfqs', { customerId: c.id, lines: 'many' }], ['POST', '/api/rfqs', { customerId: c.id, lines: [{ description: 'x', requestedQty: 1, certRequirements: [1, 2] }] }],
      ['POST', '/api/quotes', { rfqId: 'nope', lines: [] }], ['GET', '/api/quotes?status=WHATEVER'], ['POST', '/api/quotes/nope/accept', {}],
      ['POST', '/api/orders', { orderType: 'NOPE' }], ['PUT', '/api/orders/nope', { status: 'CONFIRMED' }], ['POST', '/api/pricing/calculate', { productId: 42 }],
      ['POST', '/api/orders/intake', { lines: 'x' }], ['POST', '/api/pos/quick-sale/process-payment', { sale: { id: 'x', items: 'y' } }],
      ['POST', '/api/orders/online/nope/accept', {}], ['PATCH', `/api/customers/${c.id}`, { parentId: 'nope' }],
    ];
    for (const [m, url, body] of cases) { const r = await A.call(m, url, body, 'admin'); ok(`${m} ${url} ${JSON.stringify(body || '').slice(0, 40)}: ${r.status}`, r.status >= 400 && r.status < 500, r.status); }
  });

  await scenario(G7, 'after all of the above the sales records reconcile', async (ok) => {
    const one = async (sql) => Number((await prisma.$queryRawUnsafe(sql))[0].n);
    const since = T0.toISOString();
    ok('every order from this run that left draft has a line', (await one(`SELECT count(*)::int n FROM "Order" o WHERE o."createdAt" >= '${since}' AND o.status NOT IN ('DRAFT','CANCELLED') AND NOT EXISTS (SELECT 1 FROM "OrderLine" l WHERE l."orderId"=o.id)`)) === 0);
    ok('every order from this run has a branch', (await one(`SELECT count(*)::int n FROM "Order" o WHERE o."createdAt" >= '${since}' AND o."locationId" IS NULL`)) === 0);
    ok('every order from a quote in this run is taxed like its quote', (await one(`SELECT count(*)::int n FROM "Quote" q JOIN "Order" o ON o.id=q."convertedOrderId" WHERE q."createdAt" >= '${since}' AND abs(coalesce(o."taxAmount",0) - coalesce(q."taxAmount",0)) > 0.005 AND q."taxAmount" IS NOT NULL`)) === 0);
    ok('every order subtotal equals its lines', (await one(`SELECT count(*)::int n FROM "Order" o WHERE o."createdAt" >= '${since}' AND o.status <> 'DRAFT' AND abs(o.subtotal - (SELECT coalesce(sum(l."extendedPrice"),0) FROM "OrderLine" l WHERE l."orderId"=o.id)) > 0.005 AND EXISTS (SELECT 1 FROM "OrderLine" l WHERE l."orderId"=o.id)`)) === 0);
    ok('no voided counter sale is left COMPLETE', (await one(`SELECT count(*)::int n FROM "Order" WHERE "poReference" LIKE 'QS:%' AND notes LIKE '%VOIDED:%' AND status <> 'CANCELLED'`)) === 0);
    ok('no invoice bills more tax than its order', (await one(`SELECT count(*)::int n FROM "Order" o WHERE o."createdAt" >= '${since}' AND (SELECT coalesce(sum(i."taxAmount"),0) FROM "Invoice" i WHERE i."orderId"=o.id AND i.kind::text='INVOICE') > coalesce(o."taxAmount",0) + 0.005`)) === 0);
    ok('no quote points at an order that does not exist', (await one(`SELECT count(*)::int n FROM "Quote" q WHERE q."convertedOrderId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Order" o WHERE o.id=q."convertedOrderId")`)) === 0);
    ok('no counter sale was rung up twice', (await one(`SELECT count(*)::int n FROM (SELECT "poReference" FROM "Order" WHERE "poReference" LIKE 'QS:%' GROUP BY 1 HAVING count(*) > 1) d`)) === 0);
    ok('no invoice number is repeated', (await one(`SELECT count(*)::int n FROM (SELECT "invoiceNumber" FROM "Invoice" GROUP BY 1 HAVING count(*) > 1) d`)) === 0);
    ok('no stock balance is negative', (await one(`SELECT count(*)::int n FROM "Inventory" WHERE "qtyOnHand" < 0 OR "qtyAvailable" < 0 OR "qtyAllocated" < 0`)) === 0);
  });
}

const failed = finish('Phase 5 sales scenarios', OUT, fs);
await prisma.$disconnect();
process.exit(failed ? 1 : 0);
