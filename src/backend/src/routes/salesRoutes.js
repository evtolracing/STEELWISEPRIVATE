/**
 * Sales & Pricing Intelligence API Routes
 * 
 * Comprehensive endpoints for RFQ-to-Cash optimization including:
 * - Pricing recommendations
 * - Quote management with margin protection
 * - RFQ intake and normalization
 * - Customer portal endpoints
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import pricingService from '../services/pricingIntelligenceService.js';

const router = Router();
const prisma = new PrismaClient();

// =============================================
// PRICING INTELLIGENCE ENDPOINTS
// =============================================

/**
 * POST /sales/pricing/recommend
 * Generate pricing recommendation for a line item
 */
router.post('/pricing/recommend', async (req, res) => {
  try {
    const {
      customerId,
      productCode,
      grade,
      form,
      materialType,
      dimensions,
      quantity,
      unit,
      operations,
      destinationZip,
      originLocationId,
      requestedDeliveryDate,
    } = req.body;

    if (!quantity) {
      return res.status(400).json({ error: 'Quantity is required' });
    }

    const recommendation = await pricingService.generatePricingRecommendation({
      customerId,
      productCode,
      grade,
      form,
      materialType,
      dimensions,
      quantity: parseFloat(quantity),
      unit: unit || 'LB',
      operations,
      destinationZip,
      originLocationId,
      requestedDeliveryDate,
    });

    res.json(recommendation);
  } catch (error) {
    console.error('Error generating pricing recommendation:', error);
    res.status(500).json({ error: 'Failed to generate pricing recommendation' });
  }
});

/**
 * GET /sales/pricing/customer/:customerId/tier
 * Get customer pricing tier and margin settings
 */
router.get('/pricing/customer/:customerId/tier', async (req, res) => {
  try {
    const { customerId } = req.params;
    const tier = await pricingService.getCustomerPricingTier(customerId);
    res.json(tier);
  } catch (error) {
    console.error('Error fetching customer tier:', error);
    res.status(500).json({ error: 'Failed to fetch customer pricing tier' });
  }
});

/**
 * POST /sales/pricing/override
 * Request a pricing override (requires approval)
 */
router.post('/pricing/override', async (req, res) => {
  try {
    const {
      quoteId,
      quoteLineId,
      originalPrice,
      overridePrice,
      originalMargin,
      overrideMargin,
      reason,
      justification,
      requestedById,
      customerTier,
    } = req.body;

    // Check if approval is required
    const approvalCheck = pricingService.checkOverrideApproval(
      overridePrice,
      originalPrice,
      originalPrice * 0.85, // Assume min price is 85% of original
      customerTier || 'C'
    );

    // Record the override request
    const override = await pricingService.recordPricingOverride({
      quoteId,
      quoteLineId,
      originalPrice,
      overridePrice,
      originalMargin,
      overrideMargin,
      reason,
      justification,
      requestedById,
    });

    res.json({
      override,
      approvalRequired: approvalCheck.requiresApproval,
      approvalLevel: approvalCheck.approvalLevel,
      approvalReason: approvalCheck.reason,
    });
  } catch (error) {
    console.error('Error creating pricing override:', error);
    res.status(500).json({ error: 'Failed to create pricing override' });
  }
});

/**
 * GET /sales/pricing/substitutions
 * Get product substitution suggestions
 */
router.get('/pricing/substitutions', async (req, res) => {
  try {
    const { productCode, grade, form, quantity } = req.query;
    
    const substitutions = await pricingService.suggestSubstitutions({
      productCode,
      grade,
      form,
      quantity: quantity ? parseFloat(quantity) : 1000,
    });

    res.json({ substitutions });
  } catch (error) {
    console.error('Error fetching substitutions:', error);
    res.status(500).json({ error: 'Failed to fetch substitutions' });
  }
});

// =============================================
// ENHANCED RFQ ENDPOINTS
// =============================================

/**
 * GET /sales/rfqs
 * List RFQs with enhanced filtering and statistics
 */
router.get('/rfqs', async (req, res) => {
  try {
    const { 
      status, 
      customerId, 
      priority,
      sourceType,
      limit = '50', 
      offset = '0',
      includeStats = 'true',
    } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    
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

    // Calculate statistics if requested
    let stats = null;
    if (includeStats === 'true') {
      const [newCount, reviewCount, quotedCount, totalValue] = await Promise.all([
        prisma.rFQ.count({ where: { status: 'DRAFT' } }),
        prisma.rFQ.count({ where: { status: 'SUBMITTED' } }),
        prisma.rFQ.count({ where: { status: 'QUOTED' } }),
        prisma.quote.aggregate({
          _sum: { totalAmount: true },
          where: { status: { in: ['DRAFT', 'SENT'] } },
        }),
      ]);

      stats = {
        new: newCount,
        needsReview: reviewCount,
        quoted: quotedCount,
        pipelineValue: totalValue._sum.totalAmount || 0,
      };
    }
    
    res.json({
      data: rfqs,
      stats,
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

/**
 * POST /sales/rfqs
 * Create RFQ with source tracking
 */
router.post('/rfqs', async (req, res) => {
  try {
    const { 
      customerId, 
      contactName,
      contactEmail,
      contactPhone,
      requestedDate, 
      expiresAt, 
      notes, 
      lines,
      sourceType = 'MANUAL',
      sourceChannel,
      rawContent,
    } = req.body;
    
    // Generate RFQ number
    const rfqCount = await prisma.rFQ.count();
    const year = new Date().getFullYear();
    const rfqNumber = `RFQ-${year}-${String(rfqCount + 1).padStart(6, '0')}`;
    
    // Create RFQ with source tracking
    const rfq = await prisma.rFQ.create({
      data: {
        rfqNumber,
        customerId,
        contactName,
        contactEmail,
        contactPhone,
        requestedDate: requestedDate ? new Date(requestedDate) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notes,
        status: 'DRAFT',
        lines: lines ? {
          create: lines.map((line, index) => ({
            lineNumber: index + 1,
            materialCode: line.materialCode,
            division: line.division,
            productId: line.productId,
            description: line.description,
            requestedQty: line.quantity || line.requestedQty,
            unit: line.unit || 'LB',
            specifications: line.specifications,
            notes: line.notes,
          })),
        } : undefined,
      },
      include: {
        customer: true,
        lines: true,
      },
    });

    // Create source tracking record
    if (sourceType) {
      await prisma.rFQSource.create({
        data: {
          rfqId: rfq.id,
          sourceType,
          sourceChannel,
          rawContent,
          receivedAt: new Date(),
          processedAt: new Date(),
        },
      });
    }
    
    res.status(201).json(rfq);
  } catch (error) {
    console.error('Error creating RFQ:', error);
    res.status(500).json({ error: 'Failed to create RFQ' });
  }
});

/**
 * POST /sales/rfqs/:id/parse
 * Parse RFQ content using AI (simulated)
 */
router.post('/rfqs/:id/parse', async (req, res) => {
  try {
    const { id } = req.params;
    const { rawContent } = req.body;

    // Simulated AI parsing - would integrate with LLM
    const parsedData = {
      materials: [],
      quantities: [],
      specifications: [],
      deliveryDate: null,
      confidence: 0.85,
    };

    // Simple regex-based parsing for demo
    const materialPatterns = [
      /(\d+\.?\d*)\s*(lbs?|pounds?)\s+of\s+(.+)/gi,
      /(\d+)\s*(pcs?|pieces?)\s+of\s+(.+)/gi,
      /(.+)\s+(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*x\s*(\d+\.?\d*)/gi,
    ];

    // Update RFQ source with parsed data
    await prisma.rFQSource.update({
      where: { rfqId: id },
      data: {
        parsedData,
        parsingConfidence: parsedData.confidence * 100,
        processedAt: new Date(),
      },
    });

    // Update RFQ status
    await prisma.rFQ.update({
      where: { id },
      data: { status: 'SUBMITTED' },
    });

    res.json({ 
      success: true, 
      parsedData,
      confidence: parsedData.confidence,
    });
  } catch (error) {
    console.error('Error parsing RFQ:', error);
    res.status(500).json({ error: 'Failed to parse RFQ' });
  }
});

// =============================================
// ENHANCED QUOTE ENDPOINTS
// =============================================

/**
 * GET /sales/quotes
 * List quotes with margin analysis
 */
router.get('/quotes', async (req, res) => {
  try {
    const { 
      status, 
      customerId,
      marginCategory, // RED, YELLOW, GREEN, BLUE
      limit = '50', 
      offset = '0',
    } = req.query;
    
    const where = {};
    if (status) where.status = status;
    
    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { createdAt: 'desc' },
        include: {
          rfq: {
            include: {
              customer: {
                select: { id: true, name: true, code: true },
              },
            },
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

/**
 * POST /sales/quotes
 * Create quote with pricing recommendations
 */
router.post('/quotes', async (req, res) => {
  try {
    const { 
      rfqId,
      customerId,
      lines,
      paymentTerms,
      freightTerms,
      validUntil,
      notes,
      internalNotes,
      createdById,
    } = req.body;
    
    if (!rfqId) {
      return res.status(400).json({ error: 'RFQ ID is required' });
    }

    // Generate quote number
    const quoteCount = await prisma.quote.count();
    const year = new Date().getFullYear();
    const quoteNumber = `QUO-${year}-${String(quoteCount + 1).padStart(6, '0')}`;

    // Calculate quote totals
    let subtotal = 0;
    const processedLines = [];

    for (let i = 0; i < (lines || []).length; i++) {
      const line = lines[i];
      
      // Get pricing recommendation for each line
      const pricing = await pricingService.generatePricingRecommendation({
        customerId,
        productCode: line.productCode,
        grade: line.grade,
        form: line.form,
        materialType: line.materialType,
        dimensions: line.dimensions,
        quantity: line.quantity,
        unit: line.unit,
        operations: line.operations,
        destinationZip: line.destinationZip,
      });

      const unitPrice = line.unitPrice || pricing.pricePerUnit;
      const extendedPrice = unitPrice * line.quantity;
      subtotal += extendedPrice;

      processedLines.push({
        lineNumber: i + 1,
        rfqLineId: line.rfqLineId,
        productId: line.productId,
        description: line.description,
        quantity: line.quantity,
        unit: line.unit || 'LB',
        unitPrice,
        priceUnit: 'CWT',
        extendedPrice,
        leadTimeDays: pricing.leadTimeDays,
        notes: line.notes,
      });
    }

    // Estimate freight
    const freightAmount = subtotal * 0.04; // 4% of subtotal as estimate
    const totalAmount = subtotal + freightAmount;

    // Create quote
    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        rfqId,
        status: 'DRAFT',
        subtotal,
        freightAmount,
        totalAmount,
        currency: 'USD',
        validFrom: new Date(),
        validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        paymentTerms: paymentTerms || 'Net 30',
        freightTerms: freightTerms || 'FOB Origin',
        notes,
        internalNotes,
        createdById,
        lines: {
          create: processedLines,
        },
      },
      include: {
        rfq: {
          include: { customer: true },
        },
        lines: true,
      },
    });

    // Update RFQ status
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

/**
 * POST /sales/quotes/:id/send
 * Send quote to customer
 */
router.post('/quotes/:id/send', async (req, res) => {
  try {
    const { id } = req.params;
    const { sendMethod, recipientEmail, message } = req.body;

    const quote = await prisma.quote.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
      include: {
        rfq: {
          include: { customer: true },
        },
        lines: true,
      },
    });

    // TODO: Send actual email/notification
    // await emailService.sendQuote(quote, recipientEmail, message);

    res.json({ 
      success: true, 
      quote,
      message: `Quote ${quote.quoteNumber} sent successfully`,
    });
  } catch (error) {
    console.error('Error sending quote:', error);
    res.status(500).json({ error: 'Failed to send quote' });
  }
});

/**
 * POST /sales/quotes/:id/accept
 * Accept quote (from customer portal)
 */
router.post('/quotes/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      acceptedBy, 
      acceptedByEmail, 
      customerPO, 
      termsAccepted,
      signatureData,
      ipAddress,
      notes,
    } = req.body;

    // Get quote
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        rfq: { include: { customer: true } },
        lines: true,
      },
    });

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    if (quote.status !== 'SENT' && quote.status !== 'DRAFT') {
      return res.status(400).json({ error: `Cannot accept quote in ${quote.status} status` });
    }

    // Create acceptance record
    await prisma.quoteAcceptance.create({
      data: {
        quoteId: id,
        acceptedBy,
        acceptedByEmail,
        customerPO,
        termsAccepted: termsAccepted || true,
        signatureData,
        ipAddress,
        notes,
      },
    });

    // Update quote status
    await prisma.quote.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });

    // Generate order number
    const orderCount = await prisma.order.count();
    const year = new Date().getFullYear();
    const orderNumber = `SO-${year}-${String(orderCount + 1).padStart(6, '0')}`;

    // Create order from quote
    const order = await prisma.order.create({
      data: {
        orderNumber,
        orderType: 'SO',
        buyerId: quote.rfq.customerId,
        subtotal: quote.subtotal,
        totalAmount: quote.totalAmount,
        poReference: customerPO,
        status: 'CONFIRMED',
        lines: {
          create: quote.lines.map((line, index) => ({
            lineNumber: index + 1,
            description: line.description,
            qtyOrdered: line.quantity,
            unit: line.unit,
            unitPrice: line.unitPrice,
            priceUnit: line.priceUnit,
            extendedPrice: line.extendedPrice,
          })),
        },
      },
      include: {
        buyer: true,
        lines: true,
      },
    });

    // Link quote to order
    await prisma.quote.update({
      where: { id },
      data: { 
        status: 'CONVERTED',
        convertedOrderId: order.id,
      },
    });

    res.json({
      success: true,
      quote: { id, quoteNumber: quote.quoteNumber, status: 'CONVERTED' },
      order,
      message: `Quote converted to Order ${order.orderNumber}`,
    });
  } catch (error) {
    console.error('Error accepting quote:', error);
    res.status(500).json({ error: 'Failed to accept quote' });
  }
});

// =============================================
// SALES DASHBOARD ENDPOINTS
// =============================================

/**
 * GET /sales/dashboard/stats
 * Get sales dashboard statistics
 */
router.get('/dashboard/stats', async (req, res) => {
  try {
    const { period = 'week' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'quarter':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 7));
    }

    // Get statistics
    const [
      newRfqs,
      quotesCreated,
      quotesSent,
      quotesAccepted,
      quotesLost,
      pipelineValue,
    ] = await Promise.all([
      prisma.rFQ.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.quote.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.quote.count({
        where: { 
          status: 'SENT',
          sentAt: { gte: startDate },
        },
      }),
      prisma.quote.count({
        where: { 
          status: { in: ['ACCEPTED', 'CONVERTED'] },
          acceptedAt: { gte: startDate },
        },
      }),
      prisma.quote.count({
        where: { 
          status: 'REJECTED',
          updatedAt: { gte: startDate },
        },
      }),
      prisma.quote.aggregate({
        _sum: { totalAmount: true },
        where: { 
          status: { in: ['DRAFT', 'SENT', 'NEGOTIATION'] },
        },
      }),
    ]);

    const winRate = quotesSent > 0 ? (quotesAccepted / quotesSent) * 100 : 0;

    res.json({
      period,
      pipeline: {
        newRfqs,
        inProgress: quotesCreated - quotesAccepted - quotesLost,
        awaitingResponse: quotesSent,
        wonThisWeek: quotesAccepted,
        lostThisWeek: quotesLost,
        totalValue: pipelineValue._sum.totalAmount || 0,
      },
      performance: {
        winRate: Math.round(winRate * 10) / 10,
        quotesCreated,
        quotesSent,
        quotesAccepted,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

/**
 * GET /sales/dashboard/leaderboard
 * Get sales team leaderboard
 */
router.get('/dashboard/leaderboard', async (req, res) => {
  try {
    const { period = 'month', limit = '10' } = req.query;

    // This would aggregate by sales rep - simplified for demo
    const leaderboard = [
      { 
        name: 'Sarah Wilson', 
        quotesWon: 12, 
        revenue: 145000, 
        margin: 23.5, 
        winRate: 45,
      },
      { 
        name: 'Mike Thompson', 
        quotesWon: 10, 
        revenue: 128000, 
        margin: 22.1, 
        winRate: 42,
      },
      { 
        name: 'John Davis', 
        quotesWon: 8, 
        revenue: 95000, 
        margin: 21.8, 
        winRate: 38,
      },
    ];

    res.json({ leaderboard, period });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// =============================================
// CUSTOMER PORTAL ENDPOINTS
// =============================================

/**
 * GET /sales/portal/quote/:token
 * Get quote for customer portal (by token)
 */
router.get('/portal/quote/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // In real implementation, token would be a secure hash
    // For now, we'll use quote ID or quote number
    const quote = await prisma.quote.findFirst({
      where: {
        OR: [
          { id: token },
          { quoteNumber: token },
        ],
      },
      include: {
        rfq: {
          include: { 
            customer: {
              select: { id: true, name: true, address: true, city: true, state: true },
            },
          },
        },
        lines: true,
      },
    });

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Format for customer portal
    const portalQuote = {
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      status: quote.status,
      createdDate: quote.createdAt,
      validUntil: quote.validUntil,
      
      customer: quote.rfq.customer,
      
      lineItems: quote.lines.map(line => ({
        lineNumber: line.lineNumber,
        product: line.description,
        quantity: line.quantity,
        unit: line.unit,
        unitPrice: line.unitPrice,
        totalPrice: line.extendedPrice,
        leadTime: line.leadTimeDays ? `${line.leadTimeDays} days` : 'TBD',
        notes: line.notes,
      })),
      
      subtotal: quote.subtotal,
      freight: quote.freightAmount,
      tax: quote.taxAmount || 0,
      total: quote.totalAmount,
      
      terms: {
        payment: quote.paymentTerms,
        freight: quote.freightTerms,
        validity: quote.validUntil,
      },
    };

    res.json(portalQuote);
  } catch (error) {
    console.error('Error fetching portal quote:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

export default router;
