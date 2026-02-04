/**
 * COMMERCIAL DOMAIN HANDLER
 * ==========================
 * Handles: Contact, RFQ, Quote, Negotiation
 */

import { v4 as uuidv4 } from 'uuid';
import { PIPELINE_STAGES, PRIORITY, INPUT_CHANNELS } from '../orchestrator.js';
import {
  createContact,
  createRfq,
  createQuote,
  findRfqById,
  updateRfqStatus,
  acceptQuote,
  findQuoteById,
} from '../../routes/orderHubStore.js';

// ============================================================================
// CONTACT / LEAD HANDLER
// ============================================================================

export async function handleLeadCapture(ctx, payload) {
  const { contact, source } = payload;
  
  if (!contact) {
    ctx.addError('No contact data provided');
    return;
  }
  
  // Create or find contact
  const created = createContact({
    companyName: contact.companyName,
    contactName: contact.contactName,
    email: contact.email,
    phone: contact.phone,
    billingAddress: contact.billingAddress,
    shippingAddress: contact.shippingAddress,
    notes: contact.notes,
  });
  
  ctx.contactId = created.id;
  ctx.contact = created;
  
  // AI Recommendation
  ctx.addAiRecommendation({
    type: 'CONTACT_VALIDATION',
    message: 'Contact captured successfully',
    confidence: 1.0,
    details: {
      isNewContact: true,
      source: source || ctx.channel,
    },
  });
}

// ============================================================================
// RFQ INGESTION HANDLER
// ============================================================================

export async function handleRfqReceived(ctx, payload) {
  const { rfqData, rawEmail, channel } = payload;
  
  if (!ctx.contactId && !rfqData?.contact) {
    ctx.addError('Contact required for RFQ');
    ctx.requireHumanApproval('No contact linked to RFQ');
    return;
  }
  
  const rfq = createRfq({
    contactId: ctx.contactId,
    contact: rfqData?.contact,
    channel: channel || ctx.channel,
    sourceRef: rawEmail?.messageId || null,
    requestedByName: rfqData?.requestedByName,
    requestedByEmail: rfqData?.requestedByEmail,
    requestedDueDate: rfqData?.requestedDueDate,
    lines: rfqData?.lines || [],
  });
  
  ctx.rfqId = rfq.id;
  ctx.rfq = rfq;
  
  // Track channel
  ctx.channel = channel || ctx.channel;
  
  // AI Recommendations based on RFQ content
  if (rfq.lines.length === 0) {
    ctx.addWarning('RFQ has no line items - needs parsing or manual entry');
    ctx.requireHumanApproval('RFQ requires manual line item entry');
  }
  
  // Check for VIP customer indicators
  if (ctx.contact?.companyName?.toLowerCase().includes('vip') || 
      rfqData?.priority === 'VIP') {
    ctx.priority = PRIORITY.VIP;
    ctx.addAiRecommendation({
      type: 'PRIORITY_UPGRADE',
      message: 'VIP customer detected - priority upgraded',
      confidence: 0.95,
    });
  }
}

// ============================================================================
// AI RFQ PARSING HANDLER
// ============================================================================

export async function handleRfqParsing(ctx, payload) {
  const { parsedData } = payload;
  
  if (!ctx.rfq) {
    ctx.addError('No RFQ to parse');
    return;
  }
  
  // If parsedData provided, update RFQ lines
  if (parsedData?.lines) {
    ctx.rfq.lines = parsedData.lines.map((line, idx) => ({
      id: uuidv4(),
      materialCode: line.materialCode || null,
      commodity: line.commodity || null,
      form: line.form || null,
      grade: line.grade || null,
      thickness: line.thickness || null,
      width: line.width || null,
      length: line.length || null,
      quantity: line.quantity || 1,
      notes: line.notes || null,
    }));
  }
  
  // AI parsing confidence
  const parsingConfidence = parsedData?.confidence || 0.8;
  
  if (parsingConfidence < 0.7) {
    ctx.addWarning(`AI parsing confidence low: ${(parsingConfidence * 100).toFixed(1)}%`);
    ctx.requireHumanApproval('AI parsing confidence below threshold');
  }
  
  ctx.addAiRecommendation({
    type: 'RFQ_PARSING',
    message: `Parsed ${ctx.rfq.lines.length} line items`,
    confidence: parsingConfidence,
    details: {
      linesExtracted: ctx.rfq.lines.length,
      commoditiesDetected: [...new Set(ctx.rfq.lines.map(l => l.commodity).filter(Boolean))],
    },
  });
}

// ============================================================================
// CSR REVIEW HANDLER
// ============================================================================

export async function handleCsrReview(ctx, payload) {
  const { approved, edits, csrNotes } = payload;
  
  if (!ctx.rfq) {
    ctx.addError('No RFQ for CSR review');
    return;
  }
  
  // Apply any edits from CSR
  if (edits) {
    if (edits.lines) ctx.rfq.lines = edits.lines;
    if (edits.requestedDueDate) ctx.rfq.requestedDueDate = edits.requestedDueDate;
  }
  
  // Update RFQ status
  updateRfqStatus(ctx.rfqId, 'REVIEWED');
  
  // Clear human approval flag if approved
  if (approved) {
    ctx.humanApprovalRequired = false;
    ctx.humanApprovalReason = null;
  }
  
  ctx.addAiRecommendation({
    type: 'CSR_REVIEW_COMPLETE',
    message: 'CSR review completed',
    confidence: 1.0,
    details: {
      editsApplied: !!edits,
      csrNotes,
    },
  });
}

// ============================================================================
// QUOTE BUILDING HANDLER
// ============================================================================

export async function handleQuoteBuilding(ctx, payload) {
  const { marginStrategy, overrides } = payload;
  
  if (!ctx.rfq) {
    ctx.addError('No RFQ to build quote from');
    return;
  }
  
  // Build quote lines from RFQ
  const quoteLines = ctx.rfq.lines.map(rfqLine => {
    // Base pricing logic (simplified)
    const basePrice = calculateBasePrice(rfqLine);
    const margin = marginStrategy?.percent || 0.25;
    const unitPrice = basePrice * (1 + margin);
    
    return {
      rfqLineId: rfqLine.id,
      materialCode: rfqLine.materialCode,
      description: formatLineDescription(rfqLine),
      quantity: rfqLine.quantity,
      unitPrice: Math.round(unitPrice * 100) / 100,
      notes: rfqLine.notes,
    };
  });
  
  // Apply overrides if provided
  if (overrides) {
    quoteLines.forEach((line, idx) => {
      if (overrides[idx]) {
        if (overrides[idx].unitPrice) line.unitPrice = overrides[idx].unitPrice;
        if (overrides[idx].notes) line.notes = overrides[idx].notes;
      }
    });
  }
  
  const quote = createQuote({
    rfqId: ctx.rfqId,
    contactId: ctx.contactId,
    lines: quoteLines,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    currency: 'USD',
  });
  
  ctx.quoteId = quote.id;
  ctx.quote = quote;
  ctx.metrics.totalValue = quote.totalPrice;
  ctx.metrics.marginPercent = (marginStrategy?.percent || 0.25) * 100;
  
  // Update RFQ status
  updateRfqStatus(ctx.rfqId, 'QUOTED');
  
  ctx.addAiRecommendation({
    type: 'QUOTE_BUILT',
    message: `Quote created with ${quoteLines.length} lines`,
    confidence: 0.9,
    details: {
      totalValue: quote.totalPrice,
      marginApplied: `${ctx.metrics.marginPercent}%`,
      validUntil: quote.validUntil,
    },
  });
}

// ============================================================================
// QUOTE PRICING HANDLER
// ============================================================================

export async function handleQuotePricing(ctx, payload) {
  const { pricingAdjustments, surcharges, freight } = payload;
  
  if (!ctx.quote) {
    ctx.addError('No quote for pricing');
    return;
  }
  
  let adjustedTotal = ctx.quote.totalPrice;
  
  // Apply surcharges
  if (surcharges) {
    surcharges.forEach(s => {
      adjustedTotal += s.amount;
      ctx.addAiRecommendation({
        type: 'SURCHARGE_APPLIED',
        message: `Surcharge: ${s.name} - $${s.amount}`,
        confidence: 1.0,
      });
    });
  }
  
  // Apply freight
  if (freight) {
    adjustedTotal += freight.amount;
    ctx.addAiRecommendation({
      type: 'FREIGHT_ADDED',
      message: `Freight: ${freight.carrier} - $${freight.amount}`,
      confidence: 1.0,
    });
  }
  
  ctx.quote.totalPrice = Math.round(adjustedTotal * 100) / 100;
  ctx.quote.status = 'PRICED';
  ctx.metrics.totalValue = ctx.quote.totalPrice;
}

// ============================================================================
// QUOTE ACCEPTANCE HANDLER
// ============================================================================

export async function handleQuoteAcceptance(ctx, payload) {
  if (!ctx.quote) {
    ctx.addError('No quote to accept');
    return;
  }
  
  // Accept quote and create order
  const order = acceptQuote(ctx.quoteId);
  
  ctx.orderId = order.id;
  ctx.order = order;
  
  ctx.addAiRecommendation({
    type: 'ORDER_CREATED',
    message: 'Quote accepted - Order created automatically',
    confidence: 1.0,
    details: {
      orderId: order.id,
      lineCount: order.lines.length,
    },
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateBasePrice(rfqLine) {
  // Simplified pricing logic
  const basePrices = {
    STEEL: 0.75,
    ALUMINUM: 2.50,
    STAINLESS: 3.50,
    PLASTICS: 1.25,
  };
  
  const commodity = rfqLine.commodity?.toUpperCase() || 'STEEL';
  const basePerUnit = basePrices[commodity] || 1.0;
  
  // Calculate by weight/size
  const thickness = parseFloat(rfqLine.thickness) || 0.25;
  const width = parseFloat(rfqLine.width) || 48;
  const length = parseFloat(rfqLine.length) || 96;
  const quantity = rfqLine.quantity || 1;
  
  // Simplified weight calculation (lbs)
  const area = (width * length) / 144; // sq ft
  const weight = area * thickness * 40; // ~40 lbs/cu ft for steel
  
  return weight * basePerUnit * quantity;
}

function formatLineDescription(rfqLine) {
  const parts = [];
  if (rfqLine.commodity) parts.push(rfqLine.commodity);
  if (rfqLine.form) parts.push(rfqLine.form);
  if (rfqLine.grade) parts.push(rfqLine.grade);
  if (rfqLine.thickness) parts.push(`${rfqLine.thickness}" THK`);
  if (rfqLine.width) parts.push(`${rfqLine.width}" W`);
  if (rfqLine.length) parts.push(`${rfqLine.length}" L`);
  
  return parts.join(' ') || rfqLine.materialCode || 'Custom Material';
}

export default {
  handleLeadCapture,
  handleRfqReceived,
  handleRfqParsing,
  handleCsrReview,
  handleQuoteBuilding,
  handleQuotePricing,
  handleQuoteAcceptance,
};
