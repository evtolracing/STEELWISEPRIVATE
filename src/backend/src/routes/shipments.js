import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const shipments = await prisma.shipment.findMany({
      where: { ...(status && { status }) },
      include: { order: { include: { buyer: true } }, fromLocation: true, items: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(shipments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shipments' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id },
      include: {
        order: { include: { buyer: true, lines: true } },
        fromLocation: true,
        items: { include: { orderLine: true } },
        stops: { orderBy: { stopNumber: 'asc' } }
      }
    });
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
    res.json(shipment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shipment' });
  }
});

router.post('/', async (req, res) => {
  try {
    const count = await prisma.shipment.count();
    const shipmentNumber = `SHP-${String(count + 1).padStart(5, '0')}`;
    const shipment = await prisma.shipment.create({
      data: { ...req.body, shipmentNumber },
      include: { order: true, fromLocation: true }
    });
    res.status(201).json(shipment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create shipment' });
  }
});

router.put('/:id/dispatch', async (req, res) => {
  try {
    const shipment = await prisma.shipment.update({
      where: { id: req.params.id },
      data: { status: 'IN_TRANSIT', shippedAt: new Date(), ...req.body }
    });
    res.json(shipment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to dispatch' });
  }
});

router.put('/:id/deliver', async (req, res) => {
  try {
    const { podSignature, podImageUrl } = req.body;
    const shipment = await prisma.shipment.update({
      where: { id: req.params.id },
      data: { status: 'DELIVERED', deliveredAt: new Date(), podCaptured: true, podSignature, podImageUrl }
    });
    res.json(shipment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark delivered' });
  }
});

export default router;
