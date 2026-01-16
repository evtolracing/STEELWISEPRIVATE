import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const [
      inventorySummary,
      orderCounts,
      recentOrders,
      qcHolds,
      coilsByStatus
    ] = await Promise.all([
      // Inventory summary
      prisma.inventory.aggregate({
        _sum: { qtyOnHand: true, qtyAvailable: true, qtyAllocated: true, qtyOnHold: true }
      }),
      // Order counts by status
      prisma.order.groupBy({
        by: ['status'],
        _count: true
      }),
      // Recent orders
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { buyer: true }
      }),
      // Active QC holds
      prisma.qCHold.findMany({
        where: { status: 'ACTIVE' },
        include: { coil: { include: { grade: true } } },
        take: 10
      }),
      // Coils by status
      prisma.coil.groupBy({
        by: ['status'],
        _count: true
      })
    ]);

    res.json({
      inventory: {
        totalOnHand: inventorySummary._sum.qtyOnHand || 0,
        available: inventorySummary._sum.qtyAvailable || 0,
        allocated: inventorySummary._sum.qtyAllocated || 0,
        onHold: inventorySummary._sum.qtyOnHold || 0
      },
      orders: {
        byStatus: orderCounts.reduce((acc: any, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {})
      },
      recentOrders,
      qcHolds,
      coilsByStatus: coilsByStatus.reduce((acc: any, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {})
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

router.get('/kpis', async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      ordersThisMonth,
      shipmentsThisMonth,
      totalInventoryValue
    ] = await Promise.all([
      prisma.order.count({
        where: { orderType: 'SO', createdAt: { gte: startOfMonth } }
      }),
      prisma.shipment.count({
        where: { status: 'DELIVERED', deliveredAt: { gte: startOfMonth } }
      }),
      prisma.inventory.aggregate({
        _sum: { qtyOnHand: true }
      })
    ]);

    res.json({
      ordersThisMonth,
      shipmentsThisMonth,
      inventoryLbs: totalInventoryValue._sum.qtyOnHand || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch KPIs' });
  }
});

export default router;
