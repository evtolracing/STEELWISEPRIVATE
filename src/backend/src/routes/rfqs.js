import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /rfqs - List RFQs with optional filters
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
    
    const [rfqs, total] = await Promise.all([
      prisma.rFQ.findMany({
        where,
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, code: true },
          },
          lines: true,
          quotes: {
            select: { id: true, quoteNumber: true, status: true, totalAmount: true },
          },
        },
      }),
      prisma.rFQ.count({ where }),
    ]);
    
    res.json({
      data: rfqs,
      meta: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Error fetching RFQs:', error);
    res.status(500).json({ error: 'Failed to fetch RFQs' });
  }
});

// GET /rfqs/:id - Get RFQ details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const rfq = await prisma.rFQ.findUnique({
      where: { id },
      include: {
        customer: true,
        lines: true,
        quotes: {
          include: {
            lines: true,
          },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    
    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }
    
    res.json(rfq);
  } catch (error) {
    console.error('Error fetching RFQ:', error);
    res.status(500).json({ error: 'Failed to fetch RFQ' });
  }
});

// POST /rfqs - Create a new RFQ
router.post('/', async (req, res) => {
  try {
    const { customerId, requiredDate, expiresAt, notes, lines, createdById } = req.body;
    
    // Generate RFQ number
    const rfqCount = await prisma.rFQ.count();
    const rfqNumber = `RFQ-${String(rfqCount + 1).padStart(6, '0')}`;
    
    const rfq = await prisma.rFQ.create({
      data: {
        rfqNumber,
        customerId,
        requiredDate: requiredDate ? new Date(requiredDate) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notes,
        createdById,
        lines: lines ? {
          create: lines.map((line, index) => ({
            lineNumber: index + 1,
            productDescription: line.productDescription,
            gradeSpec: line.gradeSpec,
            thickness: line.thickness,
            width: line.width,
            length: line.length,
            quantity: line.quantity,
            unit: line.unit || 'LB',
            notes: line.notes,
          })),
        } : undefined,
      },
      include: {
        customer: true,
        lines: true,
      },
    });
    
    res.status(201).json(rfq);
  } catch (error) {
    console.error('Error creating RFQ:', error);
    res.status(500).json({ error: 'Failed to create RFQ' });
  }
});

// PATCH /rfqs/:id - Update RFQ status or details
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, requiredDate, expiresAt } = req.body;
    
    const updateData = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (requiredDate) updateData.requiredDate = new Date(requiredDate);
    if (expiresAt) updateData.expiresAt = new Date(expiresAt);
    
    const rfq = await prisma.rFQ.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        lines: true,
        quotes: true,
      },
    });
    
    res.json(rfq);
  } catch (error) {
    console.error('Error updating RFQ:', error);
    res.status(500).json({ error: 'Failed to update RFQ' });
  }
});

// POST /rfqs/:id/quotes - Create a quote for an RFQ
router.post('/:id/quotes', async (req, res) => {
  try {
    const { id: rfqId } = req.params;
    const { validUntil, notes, lines, createdById } = req.body;
    
    // Get RFQ to validate and get customer info
    const rfq = await prisma.rFQ.findUnique({
      where: { id: rfqId },
      include: { lines: true },
    });
    
    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }
    
    // Generate quote number
    const quoteCount = await prisma.quote.count();
    const quoteNumber = `QT-${String(quoteCount + 1).padStart(6, '0')}`;
    
    // Calculate totals
    let subtotal = 0;
    const quoteLines = lines.map((line, index) => {
      const lineTotal = (line.quantity || 0) * (line.unitPrice || 0);
      subtotal += lineTotal;
      return {
        lineNumber: index + 1,
        rfqLineId: line.rfqLineId,
        productDescription: line.productDescription,
        gradeSpec: line.gradeSpec,
        thickness: line.thickness,
        width: line.width,
        length: line.length,
        quantity: line.quantity,
        unit: line.unit || 'LB',
        unitPrice: line.unitPrice,
        extendedPrice: lineTotal,
        leadTimeDays: line.leadTimeDays,
        notes: line.notes,
      };
    });
    
    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        rfqId,
        customerId: rfq.customerId,
        validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subtotal,
        totalAmount: subtotal,
        notes,
        createdById,
        lines: {
          create: quoteLines,
        },
      },
      include: {
        customer: true,
        rfq: true,
        lines: true,
      },
    });
    
    // Update RFQ status to QUOTED
    await prisma.rFQ.update({
      where: { id: rfqId },
      data: { status: 'QUOTED' },
    });
    
    res.status(201).json(quote);
  } catch (error) {
    console.error('Error creating quote:', error);
    res.status(500).json({ error: 'Failed to create quote' });
  }
});

export default router;
