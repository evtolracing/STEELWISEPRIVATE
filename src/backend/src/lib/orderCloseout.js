/**
 * Closing out a customer order, and what the order cost (Phase 8; findings N-017, N-018).
 *
 * Closeout is a reading, never a switch: an order is closed when nothing is left to do on it.
 * `closeoutOf` adds up what the records say and names each thing still open, so nobody has to
 * decide by hand that an order is finished and nothing outstanding can be hidden by a status.
 *
 * Closed means all of:
 *   every line shipped in full (or cancelled), nothing waiting on the dock or on the road,
 *   no shipment with an unresolved problem, everything shipped is on an invoice,
 *   every invoice paid or credited to zero, no credit still owed back to the customer,
 *   no return waiting to be received, no job still open, no stock still reserved.
 *
 * Cost is the owner's method of 2026-11-15 (lib/costing.js) carried to the sale: the material that
 * left, at the cost fixed on each stock movement when it shipped; less material that came back to
 * stock; plus the scrap and the labor of the jobs that made it. No overhead, no freight cost, no
 * rate that is not on file. Where a figure is missing the answer says which, and no margin is given
 * as complete.
 */
import { Prisma } from '@prisma/client';
import prisma from './db.js';
import { jobCost, jobMaterial } from './costing.js';
import { acrossBranches, currentScope } from './branchScope.js';

const num = (v) => Number(v || 0);
const money = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;
const qty4 = (v) => Math.round((Number(v) + Number.EPSILON) * 10000) / 10000;
const QTY = 1e-6;
const CENT = 0.005;
const DONE_JOBS = ['SHIPPED', 'COMPLETED', 'CANCELLED'];

/**
 * Pure: what is still open on an order, from facts already read.
 * facts: { status, lines[{ordered, shipped, invoiced, cancelled}], shipments[{status, podCaptured, noPodReason}],
 *          invoices[{kind, status, total, paid}], returnsOpen, jobsOpen, reserved, creditsNotIssued }
 */
export function closeoutPosition(f) {
  const open = [];
  const add = (code, what, count) => open.push({ code, what, ...(count !== undefined && { count }) });
  const live = (f.lines || []).filter((l) => !l.cancelled);
  const toShip = qty4(live.reduce((a, l) => a + Math.max(0, num(l.ordered) - num(l.shipped)), 0));
  const notInvoiced = qty4((f.lines || []).reduce((a, l) => a + Math.max(0, num(l.shipped) - num(l.invoiced)), 0));
  const sh = f.shipments || [];
  const onDock = sh.filter((s) => ['PENDING', 'LOADING'].includes(s.status)).length;
  const onRoad = sh.filter((s) => s.status === 'IN_TRANSIT').length;
  const problems = sh.filter((s) => s.status === 'EXCEPTION').length;
  const noProof = sh.filter((s) => s.status === 'DELIVERED' && !s.podCaptured && !s.noPodReason).length;
  const inv = (f.invoices || []).filter((i) => i.status !== 'CANCELLED');
  const balance = money(inv.filter((i) => i.kind !== 'CREDIT').reduce((a, i) => a + (num(i.total) - num(i.paid)), 0));
  // A credit memo's amounts are negative; what is left on it is owed back to the customer.
  const owedBack = money(inv.filter((i) => i.kind === 'CREDIT').reduce((a, i) => a + (num(i.paid) - num(i.total)), 0));
  const cancelled = f.status === 'CANCELLED';
  const shippedAnything = (f.lines || []).some((l) => num(l.shipped) > QTY);

  if (['DRAFT', 'PENDING'].includes(f.status)) add('NOT_CONFIRMED', 'The order is not confirmed yet.');
  if (f.status === 'HOLD') add('ON_HOLD', 'The order is on hold.');
  if (!cancelled && toShip > QTY) add('TO_SHIP', `${toShip.toLocaleString()} still to ship (back order).`, toShip);
  if (onDock) add('ON_DOCK', `${onDock} shipment${onDock === 1 ? '' : 's'} on the dock, not yet dispatched.`, onDock);
  if (onRoad) add('ON_ROAD', `${onRoad} shipment${onRoad === 1 ? '' : 's'} on the road, not yet delivered.`, onRoad);
  if (problems) add('SHIPMENT_PROBLEM', `${problems} shipment${problems === 1 ? ' has' : 's have'} a problem that is not resolved.`, problems);
  if (notInvoiced > QTY) add('NOT_INVOICED', `${notInvoiced.toLocaleString()} shipped and not on an invoice.`, notInvoiced);
  if (balance > CENT) add('UNPAID', `${balance.toFixed(2)} is still owed on its invoices.`, balance);
  if (owedBack > CENT) add('CREDIT_OWED', `${owedBack.toFixed(2)} of credit is still owed back to the customer.`, owedBack);
  if (num(f.returnsOpen) > 0) add('RETURN_OPEN', `${f.returnsOpen} return${f.returnsOpen === 1 ? ' is' : 's are'} waiting to be received.`, num(f.returnsOpen));
  if (num(f.creditsNotIssued) > 0) add('CREDIT_NOT_ISSUED', `${f.creditsNotIssued} return${f.creditsNotIssued === 1 ? ' was' : 's were'} received and the credit was not issued.`, num(f.creditsNotIssued));
  if (num(f.jobsOpen) > 0) add('JOB_OPEN', `${f.jobsOpen} job${f.jobsOpen === 1 ? ' is' : 's are'} still open.`, num(f.jobsOpen));
  if (num(f.reserved) > QTY) add('STOCK_RESERVED', `${qty4(f.reserved).toLocaleString()} of stock is still reserved for it.`, qty4(f.reserved));
  // Proof of delivery missing with no reason is listed and does not hold an old order open: nothing more can be done to it here.
  const notes = [];
  if (noProof) notes.push(`${noProof} delivered shipment${noProof === 1 ? ' has' : 's have'} no name and no reason on file (recorded before these were required).`);
  const finished = f.status === 'COMPLETE' || (cancelled && !open.length);
  return {
    closed: finished && !open.length,
    state: open.length ? 'OPEN' : finished ? 'CLOSED' : 'OPEN',
    open, notes,
    figures: { toShip, notInvoiced, shipmentsOnDock: onDock, shipmentsOnRoad: onRoad, shipmentProblems: problems, deliveredWithoutProof: noProof, balance, creditOwedBack: owedBack, shippedAnything },
  };
}

/** One order's closeout position, read from the records. null when the order is not found (or not this person's). */
export async function closeoutOf(orderId) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, orderType: 'SO' },
    select: {
      id: true, orderNumber: true, status: true, totalAmount: true, createdAt: true, updatedAt: true, locationId: true,
      buyer: { select: { id: true, name: true, code: true } }, location: { select: { name: true, code: true } },
      lines: { orderBy: { lineNumber: 'asc' }, select: { id: true, lineNumber: true, description: true, unit: true, qtyOrdered: true, qtyShipped: true, lineStatus: true } },
    },
  });
  if (!order) return null;
  // Everything on the order counts, whichever branch shipped or made it.
  return acrossBranches(async () => {
    const lineIds = order.lines.map((l) => l.id);
    const [shipments, invoices, invoiced, returnsOpen, returned, jobsOpen, reserved, onDock, creditsNotIssued] = await Promise.all([
      prisma.shipment.findMany({ where: { orderId: order.id }, orderBy: { createdAt: 'asc' }, select: { id: true, shipmentNumber: true, status: true, podCaptured: true, noPodReason: true, podSignature: true, shippedAt: true, deliveredAt: true, fromLocation: { select: { code: true } } } }),
      prisma.invoice.findMany({ where: { orderId: order.id }, orderBy: { createdAt: 'asc' }, select: { id: true, invoiceNumber: true, kind: true, status: true, totalAmount: true, paidAmount: true, dueDate: true } }),
      prisma.invoiceLine.groupBy({ by: ['orderLineId'], where: { orderLineId: { in: lineIds }, invoice: { kind: 'INVOICE', status: { not: 'CANCELLED' } } }, _sum: { quantity: true } }),
      prisma.order.count({ where: { orderType: 'RETURN', returnOfOrderId: order.id, status: 'PENDING' } }),
      prisma.orderLine.groupBy({ by: ['returnOfLineId'], where: { returnOfLineId: { in: lineIds }, lineStatus: 'COMPLETE', order: { orderType: 'RETURN', status: 'COMPLETE' } }, _sum: { qtyReceived: true } }),
      prisma.job.count({ where: { orderId: order.id, status: { notIn: DONE_JOBS } } }),
      prisma.orderLineAllocation.groupBy({ by: ['orderLineId'], where: { orderLineId: { in: lineIds } }, _sum: { qtyAllocated: true } }),
      prisma.shipmentItem.groupBy({ by: ['orderLineId'], where: { orderLineId: { in: lineIds }, shipment: { status: { in: ['PENDING', 'LOADING'] } } }, _sum: { qtyShipped: true } }),
      creditsNotIssuedFor(order.id),
    ]);
    const by = (rows, key, f) => new Map(rows.map((r) => [r[key], num(r._sum[f])]));
    const inv = by(invoiced, 'orderLineId', 'quantity'); const ret = by(returned, 'returnOfLineId', 'qtyReceived');
    const res = by(reserved, 'orderLineId', 'qtyAllocated'); const dock = by(onDock, 'orderLineId', 'qtyShipped');
    const lines = order.lines.map((l) => {
      const ordered = num(l.qtyOrdered); const shipped = num(l.qtyShipped); const cancelled = l.lineStatus === 'CANCELLED';
      return {
        lineNumber: l.lineNumber, description: l.description, unit: l.unit, status: l.lineStatus, ordered, shipped,
        toShip: cancelled ? 0 : qty4(Math.max(0, ordered - shipped)), onOpenShipments: dock.get(l.id) || 0, reserved: res.get(l.id) || 0,
        invoiced: inv.get(l.id) || 0, notInvoiced: qty4(Math.max(0, shipped - (inv.get(l.id) || 0))), returned: ret.get(l.id) || 0, cancelled,
      };
    });
    const position = closeoutPosition({
      status: order.status, lines,
      shipments, invoices: invoices.map((i) => ({ kind: i.kind, status: i.status, total: i.totalAmount, paid: i.paidAmount })),
      returnsOpen, jobsOpen, reserved: [...res.values()].reduce((a, b) => a + b, 0), creditsNotIssued,
    });
    return {
      orderId: order.id, orderNumber: order.orderNumber, status: order.status, customer: order.buyer, branch: order.location,
      ...position,
      lines: lines.map(({ cancelled, ...l }) => l),
      shipments: shipments.map((s) => ({ id: s.id, shipmentNumber: s.shipmentNumber, status: s.status, from: s.fromLocation?.code || null, shippedAt: s.shippedAt, deliveredAt: s.deliveredAt, receivedBy: s.podSignature || null, noSignatureReason: s.noPodReason || null })),
      invoices: invoices.map((i) => ({ id: i.id, invoiceNumber: i.invoiceNumber, kind: i.kind, status: i.status, total: num(i.totalAmount), paid: num(i.paidAmount), balance: money(num(i.totalAmount) - num(i.paidAmount)), dueDate: i.dueDate })),
    };
  });
}

export const CREDIT_NOT_ISSUED = 'CREDIT_NOT_ISSUED';
export const CREDIT_ISSUED_LATER = 'CREDIT_NOT_ISSUED_SETTLED';
/** Returns received for the order whose credit could not be issued and has not been settled since (N-016). */
async function creditsNotIssuedFor(orderId) {
  const rows = await prisma.auditLog.findMany({ where: { eventType: { in: [CREDIT_NOT_ISSUED, CREDIT_ISSUED_LATER] }, resourceType: 'Order', details: { path: ['originalOrderId'], equals: orderId } }, select: { eventType: true, resourceId: true } });
  const settled = new Set(rows.filter((r) => r.eventType === CREDIT_ISSUED_LATER).map((r) => r.resourceId));
  return new Set(rows.filter((r) => r.eventType === CREDIT_NOT_ISSUED && !settled.has(r.resourceId)).map((r) => r.resourceId)).size;
}

/**
 * Orders that are not closed, oldest first, with the count of each thing still open. One statement,
 * paged, held to the reader's branches. `reason` narrows to one kind of open item.
 */
export async function openOrders({ limit = 50, offset = 0, reason = null, locationId = null, customerId = null, search = '' } = {}) {
  const take = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
  const skip = Math.max(parseInt(offset, 10) || 0, 0);
  const scope = currentScope();
  const branches = scope && scope.branches !== null && !(scope.bypass > 0) ? scope.branches : null;
  const conds = [Prisma.sql`o."orderType" = 'SO'`, Prisma.sql`o."status" IN ('CONFIRMED', 'PARTIAL', 'COMPLETE', 'HOLD')`];
  if (branches) conds.push(branches.length ? Prisma.sql`o."locationId" IN (${Prisma.join(branches)})` : Prisma.sql`FALSE`);
  if (locationId) conds.push(Prisma.sql`o."locationId" = ${String(locationId)}`);
  if (customerId) conds.push(Prisma.sql`o."buyerId" = ${String(customerId)}`);
  if (search) conds.push(Prisma.sql`o."orderNumber" ILIKE ${`%${String(search).slice(0, 40).replace(/[%_\\]/g, '\\$&')}%`}`);
  const REASONS = {
    TO_SHIP: Prisma.sql`x."toShip" > 0.000001`, ON_DOCK: Prisma.sql`x."onDock" > 0`, ON_ROAD: Prisma.sql`x."onRoad" > 0`, SHIPMENT_PROBLEM: Prisma.sql`x."problems" > 0`,
    NOT_INVOICED: Prisma.sql`x."notInvoiced" > 0.000001`, UNPAID: Prisma.sql`x."balance" > 0.005`, CREDIT_OWED: Prisma.sql`x."owedBack" > 0.005`,
    RETURN_OPEN: Prisma.sql`x."returnsOpen" > 0`, JOB_OPEN: Prisma.sql`x."jobsOpen" > 0`, STOCK_RESERVED: Prisma.sql`x."reserved" > 0.000001`, ON_HOLD: Prisma.sql`x."status" = 'HOLD'`,
  };
  const anyOpen = Prisma.sql`(x."status" <> 'COMPLETE' OR x."toShip" > 0.000001 OR x."onDock" > 0 OR x."onRoad" > 0 OR x."problems" > 0 OR x."notInvoiced" > 0.000001
    OR x."balance" > 0.005 OR x."owedBack" > 0.005 OR x."returnsOpen" > 0 OR x."jobsOpen" > 0 OR x."reserved" > 0.000001)`;
  const filter = reason && REASONS[reason] ? REASONS[reason] : anyOpen;
  const body = Prisma.sql`
    FROM (
      SELECT o."id", o."orderNumber", o."status"::text AS "status", o."locationId", o."buyerId", o."createdAt", o."totalAmount"::float AS "totalAmount",
        COALESCE((SELECT SUM(GREATEST(l."qtyOrdered" - l."qtyShipped", 0)) FROM "OrderLine" l WHERE l."orderId" = o."id" AND l."lineStatus" <> 'CANCELLED'), 0)::float AS "toShip",
        COALESCE((SELECT SUM(GREATEST(l."qtyShipped" - COALESCE((SELECT SUM(il."quantity") FROM "InvoiceLine" il JOIN "Invoice" i ON i."id" = il."invoiceId"
                    WHERE il."orderLineId" = l."id" AND i."kind" = 'INVOICE' AND i."status" <> 'CANCELLED'), 0), 0)) FROM "OrderLine" l WHERE l."orderId" = o."id"), 0)::float AS "notInvoiced",
        (SELECT COUNT(*) FROM "Shipment" s WHERE s."orderId" = o."id" AND s."status" IN ('PENDING', 'LOADING'))::int AS "onDock",
        (SELECT COUNT(*) FROM "Shipment" s WHERE s."orderId" = o."id" AND s."status" = 'IN_TRANSIT')::int AS "onRoad",
        (SELECT COUNT(*) FROM "Shipment" s WHERE s."orderId" = o."id" AND s."status" = 'EXCEPTION')::int AS "problems",
        COALESCE((SELECT SUM(i."totalAmount" - i."paidAmount") FROM "Invoice" i WHERE i."orderId" = o."id" AND i."kind" <> 'CREDIT' AND i."status" <> 'CANCELLED'), 0)::float AS "balance",
        COALESCE((SELECT SUM(i."paidAmount" - i."totalAmount") FROM "Invoice" i WHERE i."orderId" = o."id" AND i."kind" = 'CREDIT' AND i."status" <> 'CANCELLED'), 0)::float AS "owedBack",
        (SELECT COUNT(*) FROM "Order" r WHERE r."returnOfOrderId" = o."id" AND r."orderType" = 'RETURN' AND r."status" = 'PENDING')::int AS "returnsOpen",
        (SELECT COUNT(*) FROM "Job" j WHERE j."orderId" = o."id" AND j."status" NOT IN ('SHIPPED', 'COMPLETED', 'CANCELLED'))::int AS "jobsOpen",
        COALESCE((SELECT SUM(a."qtyAllocated") FROM "OrderLineAllocation" a JOIN "OrderLine" l ON l."id" = a."orderLineId" WHERE l."orderId" = o."id"), 0)::float AS "reserved"
      FROM "Order" o
      WHERE ${Prisma.join(conds, ' AND ')}
    ) x
    WHERE ${filter}`;
  const [rows, [{ n }]] = await Promise.all([
    prisma.$queryRaw(Prisma.sql`
      SELECT y.*, b."name" AS "customerName", loc."code" AS "branchCode"
        FROM (SELECT x.* ${body} ORDER BY x."createdAt" ASC, x."id" ASC LIMIT ${take} OFFSET ${skip}) y
        LEFT JOIN "Organization" b ON b."id" = y."buyerId"
        LEFT JOIN "Location" loc ON loc."id" = y."locationId"
       ORDER BY y."createdAt" ASC, y."id" ASC`),
    prisma.$queryRaw(Prisma.sql`SELECT COUNT(*)::int AS n ${body}`),
  ]);
  return { data: rows, meta: { total: n, limit: take, offset: skip } };
}

/**
 * What an order brought in and what it cost. Reads only. Figures are sent to people who may see cost.
 */
export async function orderCost(orderId) {
  const order = await prisma.order.findFirst({ where: { id: orderId, orderType: 'SO' }, select: { id: true, orderNumber: true, status: true, lines: { orderBy: { lineNumber: 'asc' }, select: { id: true, lineNumber: true, description: true, unit: true, qtyShipped: true } } } });
  if (!order) return null;
  return acrossBranches(async () => {
    const [invoices, shipped, returns, jobs] = await Promise.all([
      prisma.invoice.findMany({ where: { orderId: order.id, status: { not: 'CANCELLED' } }, select: { kind: true, subtotal: true, taxAmount: true, freightAmount: true } }),
      prisma.materialMovement.findMany({ where: { orderId: order.id, movementType: 'SHIP' }, select: { orderLineId: true, qtyMoved: true, unitCost: true, unit: true } }),
      prisma.materialMovement.findMany({ where: { movementType: { in: ['RECEIVE', 'SCRAP'] }, reasonCode: 'CUSTOMER_RETURN', order: { orderType: 'RETURN', returnOfOrderId: order.id } }, select: { movementType: true, qtyMoved: true, unitCost: true } }),
      prisma.job.findMany({ where: { orderId: order.id, status: { not: 'CANCELLED' } }, select: { id: true, jobNumber: true, status: true, workOrderId: true } }),
    ]);
    const missing = [];
    const goods = (kind) => money(invoices.filter((i) => (kind === 'CREDIT') === (i.kind === 'CREDIT')).reduce((a, i) => a + num(i.subtotal), 0));
    const invoiced = goods('INVOICE'); const credited = money(-goods('CREDIT'));
    // Material that left.
    let cost = 0; let costedQty = 0; let uncostedQty = 0;
    const perLine = new Map();
    for (const m of shipped) {
      const q = num(m.qtyMoved); const row = perLine.get(m.orderLineId) || { cost: 0, costed: 0, uncosted: 0 };
      if (m.unitCost == null) { uncostedQty += q; row.uncosted += q; } else { cost += q * num(m.unitCost); costedQty += q; row.cost += q * num(m.unitCost); row.costed += q; }
      perLine.set(m.orderLineId, row);
    }
    if (uncostedQty > QTY) missing.push(`${qty4(uncostedQty).toLocaleString()} shipped has no cost on file (the stock item had none when it left, or it shipped before costs were kept).`);
    // Material that came back to stock (received and not scrapped) takes its cost back with it.
    let backCost = 0; let backNoCost = 0;
    for (const m of returns) {
      const sign = m.movementType === 'RECEIVE' ? 1 : -1; const q = num(m.qtyMoved);
      if (m.unitCost == null) backNoCost += sign * q; else backCost += sign * q * num(m.unitCost);
    }
    if (backNoCost > QTY) missing.push(`${qty4(backNoCost).toLocaleString()} came back to stock with no cost on file.`);
    // The jobs that made it: labor, and the material that became scrap.
    const jobRows = [];
    let labor = 0; let scrap = 0;
    for (const job of jobs) {
      const material = await jobMaterial(prisma, job);
      const c = await jobCost(prisma, job, material);
      let scrapCost = 0; let scrapKnown = true;
      for (const w of material.workOrders) {
        if (w.status !== 'COMPLETE' || !(num(w.scrapLb) > 0)) continue;
        if (w._unitCost == null) { scrapKnown = false; continue; }
        scrapCost += num(w.scrapLb) * w._unitCost;
      }
      for (const m of c.missing) if (!/material used/.test(m) || !scrapKnown) missing.push(`${job.jobNumber}: ${m}`);
      labor += c.laborCost; scrap += scrapCost;
      jobRows.push({ jobNumber: job.jobNumber, status: job.status, laborCost: c.laborCost, laborComplete: c.laborComplete, scrapLb: material.totals.scrapLb, scrapCost: money(scrapCost), scrapComplete: scrapKnown, labor: c.labor });
    }
    const materialCost = money(cost - backCost);
    const total = money(materialCost + labor + scrap);
    const revenue = money(invoiced - credited);
    const complete = !missing.length && (shipped.length > 0 || jobs.length > 0);
    return {
      orderId: order.id, orderNumber: order.orderNumber, status: order.status,
      revenue: { invoiced, credited, net: revenue, note: 'Goods only: tax and freight billed are not revenue here.' },
      material: { shippedCost: money(cost), returnedToStockCost: money(backCost), cost: materialCost, quantityCosted: qty4(costedQty), quantityWithNoCost: qty4(uncostedQty) },
      lines: order.lines.map((l) => { const r = perLine.get(l.id); return { lineNumber: l.lineNumber, description: l.description, unit: l.unit, shipped: num(l.qtyShipped), materialCost: r ? money(r.cost) : 0, quantityWithNoCost: r ? qty4(r.uncosted) : 0 }; }),
      jobs: { laborCost: money(labor), scrapCost: money(scrap), rows: jobRows },
      totalCost: total,
      margin: complete ? money(revenue - total) : null,
      marginPct: complete && revenue > CENT ? Math.round(((revenue - total) / revenue) * 10000) / 100 : null,
      complete, missing: [...new Set(missing)],
      basis: 'Material at the cost fixed on each stock movement when it shipped (actual cost per item from the purchase order at receipt), less material returned to stock, plus the scrap and the labor of the jobs that made it. No overhead and no freight cost are included. Nothing is posted to an accounting system.',
    };
  });
}
