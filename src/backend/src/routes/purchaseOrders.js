/**
 * Purchase orders (Phase 6, finding K-002).
 *
 * A purchase order is an order of type PO: the supplier is the seller, and its lines say what was
 * ordered, in what unit and to what specification. It has always been saved through /api/orders,
 * whose department rule is sales, so a buyer could not place one. This address takes the same
 * routes for purchase orders only, under the warehouse department's buyer and inventory manager
 * (owner's decision 3: each area belongs to the department that does that work). Nothing about
 * approval is added: no approval rule for purchase orders exists, so none is assumed (I-007).
 *
 *   GET  /api/purchase-orders            purchase orders only (same filters and paging as /api/orders)
 *   GET  /api/purchase-orders/suppliers  mills and distributors to order from
 *   GET  /api/purchase-orders/supply-position  per branch and grade: on hand, free, reserved, held, in transit,
 *                                        coming on open purchase orders and transfers, and open sales demand
 *   GET  /api/purchase-orders/:id        one purchase order with its lines and what has been received
 *   POST /api/purchase-orders            create (the order type is always PO)
 *   PUT  /api/purchase-orders/:id        change or move status (place, cancel, close)
 *
 * Receiving against a line is done by the Receive form (POST /api/inventory/receipts with poLineId).
 */
import { Router } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../lib/db.js';
import orderRoutes from './orders.js';
import { currentScope } from '../lib/branchScope.js';

const router = Router();

// Who a purchase order can be placed with: mills and distributors on file.
router.get('/suppliers', async (_req, res) => {
  try {
    res.json(await prisma.organization.findMany({ where: { type: { in: ['MILL', 'DISTRIBUTOR'] }, isActive: true }, select: { id: true, code: true, name: true, type: true }, orderBy: { name: 'asc' }, take: 500 }));
  } catch (error) {
    console.error('Purchase orders: suppliers failed:', error);
    res.status(500).json({ error: 'Failed to load suppliers' });
  }
});

// Supply position (Phase 6, replenishment). What a buyer needs before ordering, by branch and grade,
// in pounds: stock on hand and how it is split, what is in transit out, what is coming in on open
// purchase orders and transfers, and open sales demand not yet reserved. It suggests nothing and
// orders nothing: no minimum, maximum or reorder point for material exists on file, and inventing one
// is a business decision (K-010). Counted-by-piece stock is left out, since pounds cannot be added to pieces.
const PO_LB = `CASE upper(ol."unit") WHEN 'CWT' THEN 100 WHEN 'TON' THEN 2000 ELSE 1 END`;
router.get('/supply-position', async (req, res) => {
  try {
    const branches = currentScope()?.branches ?? null;
    const wantBranch = typeof req.query.locationId === 'string' ? req.query.locationId : null;
    const wantGrade = typeof req.query.gradeId === 'string' ? req.query.gradeId : null;
    if (wantBranch && ((branches && !branches.includes(wantBranch)) || !(await prisma.location.findUnique({ where: { id: wantBranch }, select: { id: true } })))) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    const ids = wantBranch ? [wantBranch] : branches; // null = every branch
    const inBranch = (col) => (ids ? Prisma.sql`AND ${Prisma.raw(col)} = ANY(${ids})` : Prisma.empty);
    const ofGrade = (col) => (wantGrade ? Prisma.sql`AND ${Prisma.raw(col)} = ${wantGrade}` : Prisma.empty);
    const rows = await prisma.$queryRaw`
      WITH stock AS (
        SELECT i."locationId" AS loc, c."gradeId" AS grade, sum(i."qtyOnHand") AS on_hand, sum(i."qtyAvailable") AS free, sum(i."qtyAllocated") AS reserved,
               sum(i."qtyOnHold") AS held, sum(i."qtyInTransit") AS transit_out
        FROM "Inventory" i JOIN "Coil" c ON c."id" = i."coilId"
        WHERE upper(i."unit") IN ('LB','LBS') AND c."gradeId" IS NOT NULL ${inBranch('i."locationId"')} ${ofGrade('c."gradeId"')}
        GROUP BY 1, 2),
      po AS (
        SELECT o."locationId" AS loc, ol."gradeId" AS grade, sum(greatest(ol."qtyOrdered" - ol."qtyReceived", 0) * ${Prisma.raw(PO_LB)}) AS on_order
        FROM "OrderLine" ol JOIN "Order" o ON o."id" = ol."orderId"
        WHERE o."orderType" = 'PO' AND o."status" IN ('PENDING','CONFIRMED','PARTIAL') AND ol."lineStatus" IN ('OPEN','PARTIAL')
          AND upper(ol."unit") IN ('LB','LBS','CWT','TON') AND ol."gradeId" IS NOT NULL ${inBranch('o."locationId"')} ${ofGrade('ol."gradeId"')}
        GROUP BY 1, 2),
      inbound AS (
        SELECT t."toLocationId" AS loc, c."gradeId" AS grade, sum(l."qtyShipped") AS transit_in
        FROM "StockTransferLine" l JOIN "StockTransfer" t ON t."id" = l."transferId" JOIN "Coil" c ON c."id" = l."coilId"
        WHERE t."status" = 'SHIPPED' AND upper(l."unit") IN ('LB','LBS') AND c."gradeId" IS NOT NULL ${inBranch('t."toLocationId"')} ${ofGrade('c."gradeId"')}
        GROUP BY 1, 2),
      demand AS (
        SELECT o."locationId" AS loc, ol."gradeId" AS grade, sum(greatest(ol."qtyOrdered" - ol."qtyShipped", 0)) AS open_sales,
               sum(coalesce((SELECT sum(a."qtyAllocated") FROM "OrderLineAllocation" a WHERE a."orderLineId" = ol."id"), 0)) AS open_reserved
        FROM "OrderLine" ol JOIN "Order" o ON o."id" = ol."orderId"
        WHERE o."orderType" = 'SO' AND o."status" IN ('PENDING','CONFIRMED','PARTIAL','HOLD') AND ol."lineStatus" IN ('OPEN','PARTIAL')
          AND upper(ol."unit") IN ('LB','LBS') AND ol."gradeId" IS NOT NULL ${inBranch('o."locationId"')} ${ofGrade('ol."gradeId"')}
        GROUP BY 1, 2),
      keys AS (SELECT loc, grade FROM stock UNION SELECT loc, grade FROM po UNION SELECT loc, grade FROM inbound UNION SELECT loc, grade FROM demand)
      SELECT k.loc AS "locationId", l."code" AS "branchCode", k.grade AS "gradeId", g."code" AS "gradeCode",
             coalesce(s.on_hand, 0)::float8 AS "onHandLb", coalesce(s.free, 0)::float8 AS "availableLb", coalesce(s.reserved, 0)::float8 AS "reservedLb",
             coalesce(s.held, 0)::float8 AS "onHoldLb", coalesce(s.transit_out, 0)::float8 AS "inTransitOutLb",
             coalesce(p.on_order, 0)::float8 AS "onOrderLb", coalesce(n.transit_in, 0)::float8 AS "inboundTransferLb",
             greatest(coalesce(d.open_sales, 0) - coalesce(d.open_reserved, 0), 0)::float8 AS "unreservedDemandLb"
      FROM keys k JOIN "Location" l ON l."id" = k.loc JOIN "Grade" g ON g."id" = k.grade
      LEFT JOIN stock s ON s.loc = k.loc AND s.grade = k.grade LEFT JOIN po p ON p.loc = k.loc AND p.grade = k.grade
      LEFT JOIN inbound n ON n.loc = k.loc AND n.grade = k.grade LEFT JOIN demand d ON d.loc = k.loc AND d.grade = k.grade
      ORDER BY l."code", g."code" LIMIT 2000`;
    res.json({
      data: rows.map((r) => ({ ...r, projectedFreeLb: Math.round((r.availableLb + r.onOrderLb + r.inboundTransferLb - r.unreservedDemandLb) * 10000) / 10000 })),
      note: 'Projected free = available + on order + coming by transfer - open sales not yet reserved. No reorder point is set for material, so nothing is suggested.',
    });
  } catch (error) {
    console.error('Purchase orders: supply position failed:', error);
    res.status(500).json({ error: 'Failed to load the supply position' });
  }
});

router.get('/:id', async (req, res, next) => {
  if (req.params.id === 'credit-holds') return next();
  try {
    const po = await prisma.order.findFirst({
      where: { id: req.params.id, orderType: 'PO' },
      include: {
        seller: { select: { id: true, code: true, name: true } }, location: { select: { id: true, code: true, name: true } },
        lines: { orderBy: { lineNumber: 'asc' }, include: { grade: { select: { code: true } }, product: { select: { sku: true, name: true } }, receipts: { where: { movementType: 'RECEIVE' }, select: { id: true, qtyMoved: true, unit: true, createdAt: true, coil: { select: { id: true, coilNumber: true, status: true, qcStatus: true } } } } } },
      },
    });
    if (!po) return res.status(404).json({ error: 'Purchase order not found' });
    res.json(po);
  } catch (error) {
    console.error('Purchase orders: load failed:', error);
    res.status(500).json({ error: 'Failed to load the purchase order' });
  }
});

// Closing a purchase order: nothing more is coming. Sales orders complete when they ship; a purchase
// order completes when the buyer says the supplier is done, so this move is made here. Cancelling a
// purchase order that has already received material is refused: close it instead, so the receipts keep
// their purchase order.
router.put('/:id', async (req, res, next) => {
  const wanted = req.body?.status;
  if (wanted !== 'COMPLETE' && wanted !== 'CANCELLED') return next();
  try {
    const po = await prisma.order.findFirst({ where: { id: req.params.id, orderType: 'PO' }, select: { id: true, orderNumber: true, status: true, lines: { select: { qtyReceived: true } } } });
    if (!po) return res.status(404).json({ error: 'Purchase order not found' });
    const received = po.lines.some((l) => Number(l.qtyReceived) > 0);
    if (wanted === 'CANCELLED') {
      if (received) return res.status(409).json({ error: `Material has already been received against ${po.orderNumber}. Close it instead (nothing more to come), so the receipts keep their purchase order.` });
      return next();
    }
    if (!['PENDING', 'CONFIRMED', 'PARTIAL'].includes(po.status)) return res.status(409).json({ error: `A ${po.status.toLowerCase()} purchase order cannot be closed` });
    const done = await prisma.$transaction(async (tx) => {
      const claimed = await tx.order.updateMany({ where: { id: po.id, status: po.status }, data: { status: 'COMPLETE' } });
      if (!claimed.count) return null;
      await tx.orderLine.updateMany({ where: { orderId: po.id, lineStatus: { in: ['OPEN', 'PARTIAL'] } }, data: { lineStatus: 'COMPLETE' } });
      await tx.auditLog.create({ data: { category: 'WORKFLOW', eventType: 'ORDER_STATUS_CHANGED', action: 'UPDATE', userId: req.user?.id || null, resourceType: 'Order', resourceId: po.id, details: { orderNumber: po.orderNumber, from: po.status, to: 'COMPLETE', note: 'Purchase order closed: nothing more to come' } } });
      return tx.order.findUnique({ where: { id: po.id }, include: { lines: true } });
    });
    if (!done) return res.status(409).json({ error: 'This purchase order was just changed by someone else. Reload and try again.' });
    res.json(done);
  } catch (error) {
    console.error('Purchase orders: close failed:', error);
    res.status(500).json({ error: 'Failed to close the purchase order' });
  }
});

router.use(async (req, res, next) => {
  if (req.method === 'GET' && req.path === '/') { req.query = { ...req.query, orderType: 'PO' }; return next(); }
  if (req.method === 'POST' && req.path === '/') { req.body = { ...(req.body || {}), orderType: 'PO' }; return next(); }
  const id = req.path.split('/')[1];
  if (req.method === 'PUT' && id && req.path === `/${id}`) {
    const po = await prisma.order.findFirst({ where: { id, orderType: 'PO' }, select: { id: true } }).catch(() => null);
    if (!po) return res.status(404).json({ error: 'Purchase order not found' });
    return next();
  }
  return res.status(404).json({ error: 'Not found' });
});
router.use(orderRoutes);

export default router;
