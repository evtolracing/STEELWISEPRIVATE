import { Router } from 'express';
import prisma from '../lib/db.js';

const router = Router();

// GET /quotes - List quotes with optional filters
router.get('/', async (req, res) => {
  try {
    const { status, customerId, limit = '50', offset = '0' } = req.query;
    
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (customerId) {
      where.customerId = customerId;
    }
    
    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, code: true },
          },
          rfq: {
            select: { id: true, rfqNumber: true },
          },
          lines: true,
        },
      }),
      prisma.quote.count({ where }),
    ]);
    
    res.json({
      data: quotes,
      meta: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

// GET /quotes/:id - Get quote details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        customer: true,
        rfq: {
          include: { lines: true },
        },
        lines: true,
        order: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    
    res.json(quote);
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

// POST /quotes/:id/accept - Accept quote and create order
router.post('/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    const { poReference, shipToAddress, shipToCity, shipToState, shipToZip, createdById } = req.body;
    
    // Get quote with lines
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        customer: true,
        lines: true,
      },
    });
    
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    
    if (quote.status !== 'SENT' && quote.status !== 'DRAFT') {
      return res.status(400).json({ error: `Cannot accept quote in ${quote.status} status` });
    }
    
    // Generate order number
    const orderCount = await prisma.order.count();
    const orderNumber = `SO-${String(orderCount + 1).padStart(6, '0')}`;
    
    // Create order from quote
    const order = await prisma.order.create({
      data: {
        orderNumber,
        orderType: 'SO',
        buyerId: quote.customerId,
        shipToAddress,
        shipToCity,
        shipToState,
        shipToZip,
        subtotal: quote.subtotal,
        totalAmount: quote.totalAmount,
        poReference,
        createdById: createdById || quote.createdById,
        lines: {
          create: quote.lines.map((line, index) => ({
            lineNumber: index + 1,
            description: line.productDescription,
            thicknessIn: line.thickness,
            widthIn: line.width,
            lengthIn: line.length,
            qtyOrdered: line.quantity,
            unit: line.unit,
            unitPrice: line.unitPrice,
            priceUnit: 'CWT',
            extendedPrice: line.extendedPrice,
          })),
        },
      },
      include: {
        buyer: true,
        lines: true,
      },
    });
    
    // Update quote status and link to order
    await prisma.quote.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        orderId: order.id,
      },
    });
    
    // Update RFQ status if exists
    if (quote.rfqId) {
      await prisma.rFQ.update({
        where: { id: quote.rfqId },
        data: { status: 'ACCEPTED' },
      });
    }
    
    res.status(201).json({
      message: 'Quote accepted and order created',
      order,
    });
  } catch (error) {
    console.error('Error accepting quote:', error);
    res.status(500).json({ error: 'Failed to accept quote' });
  }
});

// POST /quotes/:id/reject - Reject a quote
router.post('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const quote = await prisma.quote.update({
      where: { id },
      data: {
        status: 'REJECTED',
        notes: reason ? `Rejected: ${reason}` : undefined,
      },
    });
    
    res.json(quote);
  } catch (error) {
    console.error('Error rejecting quote:', error);
    res.status(500).json({ error: 'Failed to reject quote' });
  }
});

// POST /quotes/:id/send - Send quote to customer
router.post('/:id/send', async (req, res) => {
  try {
    const { id } = req.params;
    
    const quote = await prisma.quote.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });
    
    res.json({
      message: 'Quote sent to customer',
      quote,
    });
  } catch (error) {
    console.error('Error sending quote:', error);
    res.status(500).json({ error: 'Failed to send quote' });
  }
});

export default router;
