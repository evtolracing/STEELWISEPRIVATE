// Phase 8 probe of the starting code. Records what happens; asserts nothing.
import { A, prisma, world, blocks, num, tag } from './phase4-lib.mjs';
const w = await world(); const b = blocks(w);
const out = []; const say = (id, what, got) => { out.push({ id, what, got }); console.log(id, '|', what, '|', typeof got === 'string' ? got : JSON.stringify(got).slice(0, 400)); };
const J = (r) => `${r.status} ${JSON.stringify(r.body).slice(0, 260)}`;
const users = w.users;
say('U', 'shipping user', { role: users.shipping.role, home: users.shipping.homeLocationId === w.L1.id ? 'L1' : users.shipping.homeLocationId });
say('U', 'branchWh', { role: users.branchWh.role }); say('U', 'operator', { role: users.operator.role });

// 1 stock at L2 reserved for an L1 order, shipment says from L1
try {
  const coil = await b.received({ weightLb: 3000, locationId: w.L2.id });
  const o = await b.order([b.line(1000)]);
  const rz = await b.reserve(o, o.lines[0], coil, 1000);
  say('P1', 'reserve L2 stock for L1 order', J(rz));
  const s = await b.shipment(o, [[o.lines[0], 1000]]);
  const d = await b.dispatch(s.body);
  const mv = await prisma.materialMovement.findFirst({ where: { shipmentId: s.body.id } });
  say('P1', 'dispatch from L1 of stock standing at L2', { status: d.status, err: d.body?.error, shipmentFrom: 'L1', movementFrom: mv ? (mv.fromLocationId === w.L2.id ? 'L2' : mv.fromLocationId === w.L1.id ? 'L1' : mv.fromLocationId) : null });
} catch (e) { say('P1', 'error', String(e.message)); }

// 2 branch warehouse creates a shipment from another branch
try {
  const r = await b.readyToShip(500);
  const s2 = await A.post('/api/shipments', { orderId: r.order.id, fromLocationId: w.L2.id, items: [] }, 'branchWh');
  say('P2', 'L1 warehouse user creates shipment from L2', J(s2));
} catch (e) { say('P2', 'error', String(e.message)); }

// 3 sold at L2, shipped from L1 by an L1-only warehouse user
try {
  const coil = await b.received({ weightLb: 2000 });
  const o = await b.order([b.line(800)], { extra: { locationId: w.L2.id } });
  say('P3', 'order branch', o.locationId === w.L2.id ? 'L2' : 'other');
  const rz = await b.reserve(o, o.lines[0], coil, 800);
  const s = await A.post('/api/shipments', { orderId: o.id, fromLocationId: w.L1.id, items: [{ orderLineId: o.lines[0].id, qtyShipped: 800 }] }, 'branchWh');
  say('P3', 'L1 warehouse creates shipment for L2 order', `${rz.status} / ${J(s)}`);
  if (s.status === 201) {
    const d = await A.put(`/api/shipments/${s.body.id}/dispatch`, {}, 'branchWh');
    say('P3', 'L1 warehouse dispatches it', { status: d.status, err: d.body?.error, invoice: d.body?.invoice, warning: d.body?.invoiceWarning });
    const line = await prisma.orderLine.findUnique({ where: { id: o.lines[0].id } });
    say('P3', 'after', { qtyShipped: num(line.qtyShipped), invoices: (await b.invoicesOf(o.id)).length, shipStatus: (await prisma.shipment.findUnique({ where: { id: s.body.id } })).status });
  }
} catch (e) { say('P3', 'error', String(e.message)); }

// 4-7 delivery, exception, cancel
try {
  const r = await b.readyToShip(400);
  await b.dispatch(r.shipment);
  const ex = await A.patch(`/api/shipments/${r.shipment.id}/status`, { status: 'EXCEPTION', note: 'truck broke down', reason: 'truck broke down' }, 'shipping');
  const full = await A.get(`/api/shipments/${r.shipment.id}`, 'shipping');
  say('P6', 'exception with a reason: is the reason kept', { status: ex.status, history: full.body?.history?.slice(-1) });
  const dl = await A.put(`/api/shipments/${r.shipment.id}/deliver`, {}, 'shipping');
  say('P4', 'deliver with no name and no image', { status: dl.status, podCaptured: dl.body?.podCaptured, podSignature: dl.body?.podSignature });
  const r2 = await b.readyToShip(400);
  const cx = await A.patch(`/api/shipments/${r2.shipment.id}/status`, { status: 'CANCELLED' }, 'shipping');
  say('P7', 'cancel a pending shipment with no reason', J(cx).slice(0, 80));
} catch (e) { say('P4', 'error', String(e.message)); }

// 8 customer closed after confirm
try {
  const c = await prisma.organization.create({ data: { code: tag('P8C'), name: 'P8 closing customer', type: 'OEM' } });
  const r = await b.readyToShip(300, { customer: c });
  await prisma.organization.update({ where: { id: c.id }, data: { isActive: false } });
  const d = await b.dispatch(r.shipment);
  say('P8', 'dispatch to a customer closed after the order was confirmed', { status: d.status, err: d.body?.error });
} catch (e) { say('P8', 'error', String(e.message)); }

// 10 order cancelled while a shipment is open
try {
  const r = await b.readyToShip(300);
  const cx = await A.put(`/api/orders/${r.order.id}`, { status: 'CANCELLED' }, 'csr');
  const sh = await prisma.shipment.findUnique({ where: { id: r.shipment.id } });
  say('P10', 'order cancelled with an open shipment', { cancel: cx.status, shipmentStatus: sh.status });
  const d = await b.dispatch(r.shipment);
  say('P10', 'dispatch the left-over shipment', { status: d.status, err: d.body?.error });
} catch (e) { say('P10', 'error', String(e.message)); }

// 15 payment dated in the future, payment on other branch invoice
try {
  const r = await b.readyToShip(300); const d = await b.dispatch(r.shipment);
  const inv = d.body.invoice;
  const p = await A.post(`/api/invoices/${inv.id}/payments`, { amount: 1, paymentMethod: 'CHECK', paymentDate: '2031-01-01' }, 'csr');
  say('P15', 'payment dated 2031', { status: p.status });
  const p2 = await A.post(`/api/invoices/${inv.id}/payments`, { amount: 1, paymentMethod: 'CHECK', paymentDate: '1990-01-01' }, 'csr');
  say('P15', 'payment dated 1990', { status: p2.status });
  const p3 = await A.post(`/api/invoices/${inv.id}/payments`, { amount: 1, paymentMethod: 'CHECK' }, 'branchB');
  say('P15', 'L2 sales user takes payment on an L1 invoice', J(p3).slice(0, 120));
  const p4 = await A.post(`/api/invoices/${inv.id}/payments`, { amount: 1, paymentMethod: 'CHECK' }, 'shipping');
  say('P15', 'shipping user takes a payment', J(p4).slice(0, 160));
  const cm = await A.post(`/api/invoices/${inv.id}/credit`, { reason: 'x', amount: 1 }, 'csr');
  say('P17', 'csr issues a credit', J(cm).slice(0, 160));
} catch (e) { say('P15', 'error', String(e.message)); }

// 23 packages and tags
try {
  const who = 'shipping';
  const bad = await A.post('/api/drop-tags/packages', { packageType: 'SPACESHIP' }, who);
  say('P23', 'package of an unknown type', J(bad).slice(0, 200));
  const r = await b.readyToShip(300);
  const p = await A.post('/api/drop-tags/packages', { packageType: 'BUNDLE', orderId: r.order.id, orderLineId: r.order.lines[0].id }, who);
  say('P23', 'package for an order', { status: p.status, id: p.body?.packageId, st: p.body?.status });
  const other = await b.readyToShip(100);
  const wrong = await A.post('/api/drop-tags/packages', { packageType: 'BUNDLE', orderId: r.order.id, orderLineId: other.order.lines[0].id }, who);
  say('P23', 'package naming a line of a different order', { status: wrong.status });
  const i1 = await A.post(`/api/drop-tags/packages/${p.body.id}/items`, { grade: 'A36', form: 'PLATE', pieces: -3, weightLbs: -500, heatNumber: 'NOT-A-HEAT' }, who);
  say('P23', 'item with minus pieces, minus weight and a heat that is not on file', J(i1).slice(0, 200));
  const i2 = await A.post(`/api/drop-tags/packages/${p.body.id}/items`, { grade: 'A36', form: 'PLATE', pieces: 2, weightLbs: 99999999, coilId: r.coilId }, who);
  say('P23', 'item weighing far more than the stock item', { status: i2.status });
  const pk = await prisma.package.findUnique({ where: { id: p.body.id } });
  say('P23', 'package net weight now', num(pk.netWeightLbs));
  const t1 = await A.post('/api/drop-tags', { packageId: p.body.id }, who);
  const t2 = await A.post('/api/drop-tags', { packageId: p.body.id }, who);
  say('P23', 'two tags for one package', { first: t1.status, second: t2.status, err: t1.body?.error });
  const qc = await A.post(`/api/drop-tags/packages/${p.body.id}/qc-release`, { notes: 'ok' }, who);
  say('P23', 'quality release by the shipping clerk', J(qc).slice(0, 200));
  const routes = ['ready', 'ready-for-qc', 'submit', 'pack', 'complete', 'close'];
  const tried = [];
  for (const x of routes) tried.push(`${x}:${(await A.post(`/api/drop-tags/packages/${p.body.id}/${x}`, {}, who)).status}`);
  say('P23', 'is there any route that sends a package to quality', tried.join(' '));
  if (t1.status === 201) {
    const id = t1.body.dropTag.id;
    const v = await A.post(`/api/drop-tags/${id}/validate`, {}, who);
    say('P23', 'validate tag before quality release', J(v).slice(0, 160));
    const rp = await A.post(`/api/drop-tags/${id}/reprint`, { reason: 'ADDITIONAL_COPY' }, who);
    say('P23', 'reprint a tag that was never printed', { status: rp.status, count: rp.body?.reprintCount });
    const v1 = await A.post(`/api/drop-tags/${id}/void`, { reason: 'test' }, who);
    const v2 = await A.post(`/api/drop-tags/${id}/void`, { reason: 'again' }, who);
    say('P23', 'void twice', { first: v1.status, second: v2.status });
    const ev = await prisma.traceEvent.findFirst({ where: { resourceId: id, eventType: 'DROP_TAG_VOIDED' } });
    say('P23', 'role written on the void record vs real role', { written: ev?.actorRole, real: users.shipping.role });
  }
  const p2 = await A.post('/api/drop-tags/packages', { packageType: 'SKID' }, who);
  await prisma.package.update({ where: { id: p2.body.id }, data: { qcStatus: 'RELEASED' } });
  const seal = await A.post(`/api/drop-tags/packages/${p2.body.id}/seal`, { sealId: 'S-1' }, who);
  say('P23', 'seal an empty package with no tag', { status: seal.status, st: seal.body?.package?.status });
  const tagNo = await A.post('/api/drop-tags', { packageId: p2.body.id }, who);
  say('P23', 'tag for a package with no order', J(tagNo).slice(0, 220));
} catch (e) { say('P23', 'error', String(e.message)); }

// 24 print queue
try {
  const r = await b.readyToShip(200);
  const ts = await A.post('/api/print-queue/trigger-shipment', { shipmentId: r.shipment.id }, 'shipping');
  say('P24', 'queue the bill of lading and packing list for a shipment', J(ts).slice(0, 260));
  const job = await prisma.job.findFirst({ where: { orderId: { not: null }, order: { locationId: w.L2.id } }, select: { id: true, jobNumber: true } });
  if (job) {
    const tr = await A.post('/api/print-queue/trigger', { jobId: job.id, type: 'SHIPPING_LABEL', force: true }, 'branchWh');
    say('P24', 'L1 warehouse queues a label for an L2 job', J(tr).slice(0, 160));
    const pj = tr.body?.printJobId && await prisma.printQueueJob.findUnique({ where: { id: tr.body.printJobId } });
    say('P24', 'ship-from printed on the label', { name: pj?.payload?.shipFromName, address: pj?.payload?.shipFromAddress, po: pj?.payload?.customerPO, pieces: pj?.payload?.pieces });
    if (pj) {
      const a1 = await A.post(`/api/print-queue/${pj.id}/printed`, {}, 'branchWh'); const a2 = await A.post(`/api/print-queue/${pj.id}/printed`, {}, 'branchWh');
      const sk = await A.post(`/api/print-queue/${pj.id}/skip`, { reason: 'x' }, 'branchWh');
      say('P24', 'printed twice, then skipped', { a1: a1.status, a2: a2.status, skip: sk.status, final: (await prisma.printQueueJob.findUnique({ where: { id: pj.id } })).status });
    }
  } else say('P24', 'no L2 job found', '');
  const q = await A.get('/api/print-queue', 'branchWh');
  say('P24', 'print queue seen by L1 warehouse', { pending: q.body?.pendingCount });
} catch (e) { say('P24', 'error', String(e.message)); }

// 25 custody forging
try {
  const job = await prisma.job.findFirst({ where: { status: 'SCHEDULED' }, select: { id: true, jobNumber: true } });
  const f = await A.post('/api/material-tracking/custody-log', { eventType: 'JOB_SHIPPED', resourceType: 'Job', resourceId: job.id, previousState: 'READY_TO_SHIP', newState: 'SHIPPED' }, 'operator');
  say('P25', 'operator writes a "job shipped" custody record for a job that is only scheduled', { status: f.status, actor: f.body?.actorUserId === users.operator.id ? 'self' : f.body?.actorUserId });
  const g = await A.post('/api/material-tracking/log-status-change', { jobId: job.id, previousStatus: 'X', newStatus: 'DELIVERED', actor: users.admin.id }, 'operator');
  say('P25', 'operator writes a status record naming the admin as the actor', { status: g.status, actor: g.body?.actorUserId === users.admin.id ? 'ADMIN (forged)' : g.body?.actorUserId });
} catch (e) { say('P25', 'error', String(e.message)); }

// 20 return whose credit cannot be issued
try {
  const r = await b.readyToShip(300); const d = await b.dispatch(r.shipment); const inv = d.body.invoice;
  await A.post(`/api/invoices/${inv.id}/credit`, { reason: 'goodwill', amount: Number(inv.totalAmount) }, 'admin');
  const ret = await A.post('/api/returns', { orderId: r.order.id, reason: 'wrong size', lines: [{ orderLineId: r.order.lines[0].id, quantity: 100 }] }, 'csr');
  const rc = await A.post(`/api/returns/${ret.body.id}/receive`, {}, 'shipping');
  say('P20', 'return received on an invoice already fully credited', { status: rc.status, warning: rc.body?.warning, credits: rc.body?.credits?.length });
  const rep = await A.get('/api/integrations/report', 'admin');
  say('P20', 'does the integration report mention it', { status: rep.status, keys: Object.keys(rep.body || {}) });
} catch (e) { say('P20', 'error', String(e.message)); }

// closeout / cost surfaces
for (const u of ['/api/orders/x/closeout', '/api/orders/closeout', '/api/orders/x/cost', '/api/orders/x/margin', '/api/shipments/x/packing-list', '/api/shipments/x/bol', '/api/freight', '/api/carriers', '/api/reports/ar-aging', '/api/invoices/aging']) {
  const r = await A.get(u, 'admin'); say('SURF', u, r.status);
}
await prisma.$disconnect();
