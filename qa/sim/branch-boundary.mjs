// The branch boundary (finding B-003, owner's decision 2): staff see and change only their
// own branches' records; super admin and high-level management see every branch.
// Runs against a QA server and checks every answer against the database.
//   node qa/sim/branch-boundary.mjs [--base http://localhost:3011]
import fs from 'node:fs';
import { prismaClient, api, QA_USERS } from './lib.mjs';

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('base', 'http://localhost:3011');
const OUT = arg('out', 'qa/results/branch-boundary.json');
const prisma = prismaClient();
const A = api(BASE);
const findings = []; let checks = 0;
const check = (name, ok, detail) => { checks++; if (!ok) findings.push(`${name}${detail ? ` — ${detail}` : ''}`); };
const rows = (b) => (Array.isArray(b) ? b : b?.data || b?.items || b?.orders || b?.coils || b?.inventory || b?.shipments || b?.jobs || b?.invoices || []);

for (const who of ['admin', 'csr', 'branchA', 'branchB', 'branchWh', 'regional', 'custA']) await A.login(who);
const loc = Object.fromEntries((await prisma.location.findMany({ where: { code: { in: ['QA-L01', 'QA-L02', 'QA-L03', 'QA-L04'] } } })).map((l) => [l.code, l.id]));
const L1 = loc['QA-L01'], L2 = loc['QA-L02'], L3 = loc['QA-L03'], L4 = loc['QA-L04'];
const customer = await prisma.organization.findUnique({ where: { code: 'QA-C05' } });
const line = { description: 'QA branch test', qtyOrdered: 10, unit: 'LB', unitPrice: 1, priceUnit: 'LB', extendedPrice: 10 };
const order = (who, extra = {}) => A.post('/api/orders', { orderType: 'SO', buyerId: customer.id, status: 'CONFIRMED', lines: [line], ...extra }, who);

// ── Orders ──
const oA = await order('branchA'); const oB = await order('branchB');
check('an order belongs to the branch of the person who enters it', oA.status === 201 && oA.body.locationId === L1 && oB.body.locationId === L2, `${oA.status} ${oA.body?.locationId}`);
const wrong = await order('branchA', { locationId: L2 });
check('entering an order for a branch you are not in is refused', wrong.status === 403, `${wrong.status}`);
const named = await order('admin', { locationId: L4 });
check('head office can enter an order for any branch', named.status === 201 && named.body.locationId === L4, `${named.status}`);
const branchOfOrders = async (list) => new Set((await prisma.order.findMany({ where: { id: { in: list.map((o) => o.id) } }, select: { locationId: true } })).map((o) => o.locationId));
for (const [who, allowed] of [['branchA', [L1]], ['branchB', [L2]], ['regional', [L1, L2, L3]]]) {
  const list = rows((await A.get('/api/orders?limit=500', who)).body);
  const seen = await branchOfOrders(list);
  check(`${who} lists only orders of their own branches`, list.length > 0 && [...seen].every((b) => allowed.includes(b)), `${list.length} orders, branches ${[...seen].length}`);
}
const adminList = rows((await A.get('/api/orders?limit=500', 'admin')).body);
check('head office lists orders of more than one branch', (await branchOfOrders(adminList)).size > 1);
check('opening another branch\'s order by id is refused as not found', (await A.get(`/api/orders/${oB.body.id}`, 'branchA')).status === 404);
check('opening your own branch\'s order works', (await A.get(`/api/orders/${oA.body.id}`, 'branchA')).status === 200);
const edit = await A.put(`/api/orders/${oB.body.id}`, { notes: 'changed from another branch' }, 'branchA');
const after = await prisma.order.findUnique({ where: { id: oB.body.id } });
check('changing another branch\'s order is refused and nothing changes', edit.status >= 400 && edit.status < 500 && after.notes !== 'changed from another branch', `${edit.status}`);
const give = await A.put(`/api/orders/${oA.body.id}`, { locationId: L2 }, 'branchA');
check('handing your order to a branch you are not in is refused', give.status === 403 && (await prisma.order.findUnique({ where: { id: oA.body.id } })).locationId === L1, `${give.status}`);
check('a regional manager opens orders of each assigned branch', (await A.get(`/api/orders/${oA.body.id}`, 'regional')).status === 200 && (await A.get(`/api/orders/${oB.body.id}`, 'regional')).status === 200);
check('a regional manager cannot open an order of a branch outside the group', (await A.get(`/api/orders/${named.body.id}`, 'regional')).status === 404);

// ── Stock ──
const stockAt = (id) => prisma.coil.findFirst({ where: { locationId: id, status: 'AVAILABLE', inventory: { is: { qtyAllocated: 0, qtyOnHold: 0 } } }, include: { inventory: true } });
const c1 = await stockAt(L1), c2 = await stockAt(L2), c4 = await stockAt(L4);
for (const url of ['/api/coils?limit=500', '/api/inventory?limit=500']) {
  const list = rows((await A.get(url, 'branchWh')).body);
  const ids = list.map((r) => r.coilId || r.coil?.id || r.id);
  const at = new Set((await prisma.coil.findMany({ where: { id: { in: ids } }, select: { locationId: true } })).map((c) => c.locationId));
  check(`${url.split('?')[0]}: a branch warehouse login lists only its own stock`, list.length > 0 && [...at].every((b) => b === L1), `${list.length} rows, ${at.size} branches`);
}
check('opening another branch\'s stock item is refused as not found', (await A.get(`/api/coils/${c2.id}`, 'branchWh')).status === 404);
const hold = await A.post(`/api/coils/${c2.id}/hold`, { holdType: 'OTHER', holdReason: 'QA: from another branch' }, 'branchWh');
check('placing a hold on another branch\'s stock is refused and nothing changes', hold.status === 404 && Number((await prisma.inventory.findFirst({ where: { coilId: c2.id } })).qtyOnHold) === 0, `${hold.status}`);
const alloc = await A.post(`/api/orders/${oA.body.id}/allocate`, { lineId: oA.body.lines[0].id, coilId: c2.id, qty: 10 }, 'branchA');
check('reserving another branch\'s stock for your order is refused', alloc.status >= 400 && alloc.status < 500 && Number((await prisma.inventory.findFirst({ where: { coilId: c2.id } })).qtyAllocated) === 0, `${alloc.status}`);
const allocOwn = await A.post(`/api/orders/${oA.body.id}/allocate`, { lineId: oA.body.lines[0].id, coilId: c1.id, qty: 10 }, 'branchA');
check('reserving your own branch\'s stock works', allocOwn.status === 201, `${allocOwn.status} ${JSON.stringify(allocOwn.body).slice(0, 120)}`);

// ── Transfers ──
const pull = await A.post('/api/inventory/transfer', { coilId: c4.id, toLocationId: L1 }, 'branchWh');
check('pulling stock out of another branch is refused', pull.status === 404 && (await prisma.coil.findUnique({ where: { id: c4.id } })).locationId === L4, `${pull.status}`);
const spare = await prisma.coil.findFirst({ where: { locationId: L1, id: { not: c1.id }, inventory: { is: { qtyAllocated: 0, qtyOnHold: 0, qtyOnHand: { gt: 0 } } } } });
const sent = await A.post('/api/inventory/transfer', { coilId: spare.id, toLocationId: L2 }, 'branchWh');
const moved = await prisma.coil.findUnique({ where: { id: spare.id } });
const mv = await prisma.materialMovement.findFirst({ where: { coilId: spare.id, movementType: 'TRANSFER' }, orderBy: { createdAt: 'desc' } });
check('sending your own stock to another branch works and is recorded', sent.status === 200 && moved.locationId === L2 && mv?.fromLocationId === L1 && mv?.toLocationId === L2, `${sent.status}`);
check('after the transfer the sender no longer sees the item', (await A.get(`/api/coils/${spare.id}`, 'branchWh')).status === 404);
await A.post('/api/inventory/transfer', { coilId: spare.id, toLocationId: L1 }, 'admin'); // put it back

// ── Shipments, jobs, invoices ──
const shipOther = await A.post('/api/shipments', { orderId: oB.body.id, fromLocationId: L2, items: [{ orderLineId: oB.body.lines[0].id, qtyShipped: 1 }] }, 'branchA');
check('shipping another branch\'s order is refused', shipOther.status === 404, `${shipOther.status}`);
const shipFromOther = await A.post('/api/shipments', { orderId: oA.body.id, fromLocationId: L2, items: [{ orderLineId: oA.body.lines[0].id, qtyShipped: 1 }] }, 'branchA');
check('shipping your order from a branch you are not in is refused', shipFromOther.status === 403 && !(await prisma.shipment.findFirst({ where: { orderId: oA.body.id } })), `${shipFromOther.status}`);
const ship = await A.post('/api/shipments', { orderId: oA.body.id, fromLocationId: L1, items: [{ orderLineId: oA.body.lines[0].id, qtyShipped: 10 }] }, 'branchA');
const out = ship.body?.id ? await A.put(`/api/shipments/${ship.body.id}/dispatch`, {}, 'branchA') : { status: 0 };
check('shipping your own order from your own branch works and raises the invoice', ship.status === 201 && out.status === 200 && !!out.body?.invoice?.id, `${ship.status} ${out.status}`);
check('another branch cannot open that shipment', ship.body?.id && (await A.get(`/api/shipments/${ship.body.id}`, 'branchB')).status === 404);
const invId = out.body?.invoice?.id;
check('another branch cannot open that invoice', invId && (await A.get(`/api/invoices/${invId}`, 'branchB')).status === 404);
const pay = invId ? await A.post(`/api/invoices/${invId}/payments`, { amount: 1, paymentMethod: 'CHECK' }, 'branchB') : { status: 0 };
check('another branch cannot take a payment on that invoice', pay.status === 404 && Number((await prisma.invoice.findUnique({ where: { id: invId } })).paidAmount) === 0, `${pay.status}`);
const invList = rows((await A.get('/api/invoices?limit=500', 'branchB')).body);
const invBranches = new Set((await prisma.invoice.findMany({ where: { id: { in: invList.map((i) => i.id) } }, select: { order: { select: { locationId: true } } } })).map((i) => i.order.locationId));
check('a branch lists only invoices of its own orders', [...invBranches].every((b) => b === L2), `${invList.length} invoices, ${invBranches.size} branches`);
const wc2 = await prisma.workCenter.findFirst({ where: { locationId: L2 } });
const jB = await A.post('/api/jobs', { orderId: oB.body.id, orderLineId: oB.body.lines[0].id, workCenterId: wc2.id, operationType: wc2.type }, 'branchB');
check('another branch cannot open or move that job', jB.status === 201 && (await A.get(`/api/jobs/${jB.body.id}`, 'branchA')).status === 404 && (await A.post(`/api/jobs/${jB.body.id}/status`, { status: 'SCHEDULED' }, 'branchA')).status === 404, `${jB.status}`);
const jobList = rows((await A.get('/api/jobs?limit=500', 'branchA')).body);
check('a branch does not list another branch\'s job', !jobList.some((j) => j.id === jB.body?.id));
const wcList = rows((await A.get('/api/work-centers', 'branchA')).body);
check('a branch lists only its own work centers', wcList.length > 0 && wcList.every((w) => w.locationId === L1), `${wcList.length}`);

// ── What stays shared, and who is not limited ──
check('customers are shared across branches', rows((await A.get('/api/customers?limit=5', 'branchA')).body).length > 0);
check('products are shared across branches', rows((await A.get('/api/products?limit=5', 'branchA')).body).length > 0);
check('head office opens any branch\'s order, stock and invoice', (await A.get(`/api/orders/${oB.body.id}`, 'admin')).status === 200 && (await A.get(`/api/coils/${c4.id}`, 'admin')).status === 200 && (!invId || (await A.get(`/api/invoices/${invId}`, 'admin')).status === 200));
const mine = await A.get('/api/ecom/my-orders', 'custA');
check('a customer login still reaches the store and its own orders', mine.status === 200, `${mine.status}`);
const numbers = [oA, oB, named].map((o) => o.body.orderNumber);
check('order numbers stay unique across branches', new Set(numbers).size === 3, numbers.join(','));

const pass = findings.length === 0;
fs.writeFileSync(OUT, JSON.stringify({ base: BASE, at: new Date().toISOString(), pass, checks, findings }, null, 1));
console.log(`${pass ? '✓' : '✗'} Branch boundary: ${checks} checks, ${findings.length} problems`);
for (const f of findings) console.log(`     ${f}`);
await prisma.$disconnect();
process.exit(pass ? 0 : 1);
