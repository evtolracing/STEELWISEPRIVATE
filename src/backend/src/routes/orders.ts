import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const { orderType, status, buyerId } = req.query;
    const orders = await prisma.order.findMany({
      where: {
        ...(orderType && { orderType: orderType as any }),
        ...(status && { status: status as any }),
        ...(buyerId && { buyerId: buyerId as string })
      },
      include: { buyer: true, seller: true, lines: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        buyer: true,
        seller: true,
        lines: { include: { product: true, grade: true, allocations: { include: { coil: true } } } },
        shipments: true,
        invoices: true
      }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { lines, ...orderData } = req.body;
    const count = await prisma.order.count();
    const orderNumber = `${orderData.orderType}-${String(count + 1).padStart(5, '0')}`;
    
    const order = await prisma.order.create({
      data: {
        ...orderData,
        orderNumber,
        lines: { create: lines?.map((line: any, idx: number) => ({ ...line, lineNumber: idx + 1 })) }
      },
      include: { lines: true, buyer: true }
    });
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: req.body,
      include: { lines: true }
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

router.post('/:id/allocate', async (req, res) => {
  try {
    const { lineId, coilId, qty } = req.body;
    const [allocation] = await prisma.$transaction([
      prisma.orderLineAllocation.create({
        data: { orderLineId: lineId, coilId, qtyAllocated: qty }
      }),
      prisma.inventory.update({
        where: { coilId },
        data: { qtyAllocated: { increment: qty }, qtyAvailable: { decrement: qty } }
      }),
      prisma.coil.update({
        where: { id: coilId },
        data: { status: 'ALLOCATED' }
      })
    ]);
    res.status(201).json(allocation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to allocate' });
  }
});

export default router;
