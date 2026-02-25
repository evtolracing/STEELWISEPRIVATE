import { Router } from 'express';
import prisma from '../lib/db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    // Return mock data if database is not configured
    if (!prisma) {
      return res.json({
        inventory: {
          totalOnHand: 125000,
          available: 85000,
          allocated: 35000,
          onHold: 5000
        },
        orders: {
          byStatus: {
            PENDING: 5,
            CONFIRMED: 8,
            IN_PRODUCTION: 12,
            SHIPPED: 15,
            DELIVERED: 20
          }
        },
        recentOrders: [
          {
            id: '1',
            orderNumber: 'SO-1001',
            status: 'CONFIRMED',
            createdAt: new Date('2026-02-08T10:00:00Z'),
            buyer: { name: 'ABC Manufacturing' }
          },
          {
            id: '2',
            orderNumber: 'SO-1002',
            status: 'PENDING',
            createdAt: new Date('2026-02-07T14:30:00Z'),
            buyer: { name: 'XYZ Industries' }
          }
        ],
        qcHolds: [],
        coilsByStatus: {
          AVAILABLE: 45,
          ALLOCATED: 23,
          ON_HOLD: 3,
          SHIPPED: 12
        }
      });
    }

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
        byStatus: orderCounts.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {})
      },
      recentOrders,
      qcHolds,
      coilsByStatus: coilsByStatus.reduce((acc, item) => {
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
