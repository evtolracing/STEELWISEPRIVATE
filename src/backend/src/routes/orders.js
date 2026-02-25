import { Router } from 'express';
import prisma from '../lib/db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    // Return mock data if database is not configured
    if (!prisma) {
      const mockOrders = [
        {
          id: '1',
          orderNumber: 'SO-1001',
          orderType: 'SALES_ORDER',
          status: 'CONFIRMED',
          buyerId: 'CUST-001',
          buyer: { id: 'CUST-001', name: 'ABC Manufacturing' },
          totalAmount: 15000,
          createdAt: new Date('2026-02-01T10:00:00Z'),
          lines: []
        },
        {
          id: '2',
          orderNumber: 'SO-1002',
          orderType: 'SALES_ORDER',
          status: 'PENDING',
          buyerId: 'CUST-002',
          buyer: { id: 'CUST-002', name: 'XYZ Industries' },
          totalAmount: 25000,
          createdAt: new Date('2026-02-05T14:30:00Z'),
          lines: []
        }
      ];
      return res.json(mockOrders);
    }

    const { orderType, status, buyerId } = req.query;
    const orders = await prisma.order.findMany({
      where: {
        ...(orderType && { orderType }),
        ...(status && { status }),
        ...(buyerId && { buyerId })
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
        lines: { create: lines?.map((line, idx) => ({ ...line, lineNumber: idx + 1 })) }
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
