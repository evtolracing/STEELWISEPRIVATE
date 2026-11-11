/**
 * Online order inbox (web store orders waiting for a CSR).
 *
 *   GET  /api/orders/online?status=
 *   POST /api/orders/online/:id/accept   { customerId?, division?, locationId? }
 *   POST /api/orders/online/:id/hold     { reason }
 *   POST /api/orders/online/:id/reject   { reason }
 *
 * Accepting creates a PENDING sales order (Order + OrderLines) and links it.
 */
import { Router } from 'express';
import prisma from '../lib/db.js';
import { packNotes, getSystemUserId, nextOrderNumber } from './intakeOrders.js';

const router = Router();
const iso = (d) => (d ? d.toISOString() : null);

function toApi(o) {
  const out = {
    id: o.id,
    externalOrderId: o.externalOrderId,
    source: o.source,
    status: o.status,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    customerId: o.customerId,
    receivedAt: iso(o.receivedAt),
    items: Array.isArray(o.items) ? o.items : [],
    subtotal: Number(o.subtotal),
    shippingMethod: o.shippingMethod,
    notes: o.notes || '',
  };
  if (o.holdReason) out.holdReason = o.holdReason;
  if (o.rejectReason) out.rejectReason = o.rejectReason;
  if (o.internalOrderId) out.internalOrderId = o.internalOrderId;
  if (o.decidedAt) out.decidedAt = iso(o.decidedAt);
  return out;
}

const OPEN = ['NEEDS_REVIEW', 'HOLD'];

async function loadOpen(id, res) {
  const order = await prisma.onlineOrder.findUnique({ where: { id } });
  if (!order) { res.status(404).json({ error: 'Online order not found' }); return null; }
  if (!OPEN.includes(order.status)) {
    res.status(409).json({ error: `Online order is already ${order.status}` });
    return null;
  }
  return order;
}

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const [rows, needsReview] = await Promise.all([
      prisma.onlineOrder.findMany({
        where: status ? { status: String(status) } : {},
        orderBy: { receivedAt: 'desc' },
        take: 500,
      }),
      prisma.onlineOrder.count({ where: { status: 'NEEDS_REVIEW' } }),
    ]);
    res.json({ data: rows.map(toApi), meta: { total: rows.length, needsReview } });
  } catch (error) {
    console.error('Failed to list online orders:', error);
    res.status(500).json({ error: 'Failed to list online orders' });
  }
});

router.post('/:id/accept', async (req, res) => {
  try {
    const online = await loadOpen(req.params.id, res);
    if (!online) return;
    const { customerId, division = 'METALS', locationId } = req.body || {};

    const createdById = await getSystemUserId();
    if (!createdById) return res.status(500).json({ error: 'No CSR or admin user found to own the order' });

    const buyerId = customerId || online.customerId || null;
    if (buyerId && !(await prisma.organization.findUnique({ where: { id: buyerId }, select: { id: true } }))) {
      return res.status(400).json({ error: 'Customer not found' });
    }

    const items = Array.isArray(online.items) ? online.items : [];
    const products = await prisma.product.findMany({
      where: { sku: { in: items.map((i) => i.sku).filter(Boolean) } },
      select: { id: true, sku: true, gradeId: true },
    });
    const bySku = new Map(products.map((p) => [p.sku, p]));

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber: await nextOrderNumber(),
          orderType: 'SO',
          status: 'PENDING',
          buyerId,
          poReference: online.externalOrderId,
          subtotal: online.subtotal,
          notes: packNotes(online.notes, {
            source: 'ONLINE', division, location: locationId || null,
            customerName: online.customerName, shippingMethod: online.shippingMethod,
          }),
          createdById,
          lines: {
            create: items.map((item, idx) => {
              const product = bySku.get(item.sku);
              const qty = Number(item.qty) || 1;
              // Store checkouts carry the line's extended price (weight-priced items).
              const ext = item.extended != null ? Number(item.extended) : null;
              const price = ext != null ? ext / qty : Number(item.unitPrice) || 0;
              return {
                lineNumber: idx + 1,
                description: item.description || item.sku || 'Material',
                productId: product?.id || null,
                gradeId: product?.gradeId || null,
                qtyOrdered: qty,
                unit: 'EA',
                unitPrice: price,
                extendedPrice: ext != null ? Math.round(ext * 100) / 100 : Math.round(qty * price * 100) / 100,
              };
            }),
          },
        },
        select: { id: true, orderNumber: true },
      });
      await tx.onlineOrder.update({
        where: { id: online.id },
        data: { status: 'ACCEPTED', customerId: buyerId, internalOrderId: created.id, decidedAt: new Date() },
      });
      return created;
    });

    const updated = await prisma.onlineOrder.findUnique({ where: { id: online.id } });
    res.json({ ...toApi(updated), internalOrderNumber: order.orderNumber });
  } catch (error) {
    console.error('Failed to accept online order:', error);
    res.status(500).json({ error: 'Failed to accept online order' });
  }
});

router.post('/:id/hold', async (req, res) => {
  try {
    const online = await loadOpen(req.params.id, res);
    if (!online) return;
    const updated = await prisma.onlineOrder.update({
      where: { id: online.id },
      data: { status: 'HOLD', holdReason: req.body?.reason || 'On hold' },
    });
    res.json(toApi(updated));
  } catch (error) {
    res.status(500).json({ error: 'Failed to hold online order' });
  }
});

router.post('/:id/reject', async (req, res) => {
  try {
    const online = await loadOpen(req.params.id, res);
    if (!online) return;
    const updated = await prisma.onlineOrder.update({
      where: { id: online.id },
      data: { status: 'REJECTED', rejectReason: req.body?.reason || 'Rejected', decidedAt: new Date() },
    });
    res.json(toApi(updated));
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject online order' });
  }
});

export default router;
