/**
 * FULFILLMENT DOMAIN HANDLER
 * ===========================
 * Handles: Packaging, Labeling, Shipping, Invoicing
 */

import { v4 as uuidv4 } from 'uuid';
import { PIPELINE_STAGES } from '../orchestrator.js';

// ============================================================================
// CARRIERS
// ============================================================================

const CARRIERS = [
  { id: 'CAR-UPS', name: 'UPS Ground', type: 'GROUND', avgDays: 5, ratePerLb: 0.45 },
  { id: 'CAR-FEDEX', name: 'FedEx Freight', type: 'LTL', avgDays: 3, ratePerLb: 0.55 },
  { id: 'CAR-TRUCK', name: 'Local Truck', type: 'LOCAL', avgDays: 1, ratePerLb: 0.25 },
  { id: 'CAR-FLATBED', name: 'Flatbed Carrier', type: 'FLATBED', avgDays: 4, ratePerLb: 0.35 },
];

// ============================================================================
// PACKAGING HANDLER
// ============================================================================

export async function handlePackCreation(ctx, payload) {
  if (ctx.jobs.length === 0) {
    ctx.addError('No completed jobs for packaging');
    return;
  }
  
  const completedJobs = ctx.jobs.filter(j => j.status === 'COMPLETED');
  
  // Create packages for completed jobs
  const packages = [];
  
  for (const job of completedJobs) {
    const pkg = {
      id: uuidv4(),
      jobId: job.id,
      orderId: ctx.orderId,
      type: determinePackageType(job),
      status: 'CREATED',
      weight: estimateWeight(job),
      dimensions: estimateDimensions(job),
      createdAt: new Date().toISOString(),
      items: [{
        jobId: job.id,
        materialCode: job.materialCode,
        quantity: 1,
      }],
      handlingInstructions: [],
    };
    
    // Add handling instructions based on material
    if (job.division === 'PLASTICS') {
      pkg.handlingInstructions.push('PROTECT FROM UV');
      pkg.handlingInstructions.push('DO NOT STACK HEAVY');
    }
    if (job.materialCode?.includes('SS') || job.materialCode?.includes('304')) {
      pkg.handlingInstructions.push('KEEP DRY');
      pkg.handlingInstructions.push('USE BLUE FILM');
    }
    
    packages.push(pkg);
  }
  
  ctx.packages = packages;
  ctx.packageIds = packages.map(p => p.id);
  
  ctx.addAiRecommendation({
    type: 'PACKAGES_CREATED',
    message: `Created ${packages.length} package(s)`,
    confidence: 1.0,
    details: {
      totalWeight: packages.reduce((sum, p) => sum + p.weight, 0),
      packageTypes: [...new Set(packages.map(p => p.type))],
    },
  });
}

// ============================================================================
// LABELING HANDLER
// ============================================================================

export async function handlePackLabeling(ctx, payload) {
  if (ctx.packages.length === 0) {
    ctx.addError('No packages for labeling');
    return;
  }
  
  for (const pkg of ctx.packages) {
    pkg.labels = {
      shippingLabel: generateShippingLabel(ctx, pkg),
      contentLabel: generateContentLabel(ctx, pkg),
      hazmatLabel: null, // Not applicable for metals/plastics
      handlingLabel: pkg.handlingInstructions.length > 0 ? 'SPECIAL HANDLING' : null,
    };
    
    pkg.barcode = generateBarcode(pkg.id);
    pkg.qrCode = generateQRCode(pkg);
    pkg.status = 'LABELED';
    pkg.labeledAt = new Date().toISOString();
  }
  
  ctx.addAiRecommendation({
    type: 'PACKAGES_LABELED',
    message: `Labeled ${ctx.packages.length} package(s)`,
    confidence: 1.0,
    details: {
      specialHandling: ctx.packages.filter(p => p.labels.handlingLabel).length,
    },
  });
}

// ============================================================================
// SHIP READY HANDLER
// ============================================================================

export async function handleShipReady(ctx, payload) {
  if (ctx.packages.length === 0) {
    ctx.addError('No packages ready for shipping');
    return;
  }
  
  // Select optimal carrier
  const totalWeight = ctx.packages.reduce((sum, p) => sum + p.weight, 0);
  const carrier = selectOptimalCarrier(totalWeight, ctx.priority);
  
  // Create shipment
  ctx.shipment = {
    id: uuidv4(),
    orderId: ctx.orderId,
    status: 'READY',
    carrier: carrier,
    packageIds: ctx.packageIds,
    totalWeight,
    estimatedCost: totalWeight * carrier.ratePerLb,
    estimatedDelivery: new Date(Date.now() + carrier.avgDays * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    shipFromLocation: ctx.order?.locationId || 'LOC-001',
    shipToAddress: ctx.contact?.shippingAddress || ctx.contact?.billingAddress || 'ADDRESS_REQUIRED',
    asn: null,
    trackingNumber: null,
    proofOfDelivery: null,
  };
  
  ctx.shipmentId = ctx.shipment.id;
  
  // Update package statuses
  for (const pkg of ctx.packages) {
    pkg.shipmentId = ctx.shipment.id;
    pkg.status = 'READY_TO_SHIP';
  }
  
  ctx.addAiRecommendation({
    type: 'SHIPMENT_READY',
    message: `Shipment ready with ${carrier.name}`,
    confidence: 0.95,
    details: {
      carrier: carrier.name,
      estimatedCost: `$${ctx.shipment.estimatedCost.toFixed(2)}`,
      estimatedDelivery: ctx.shipment.estimatedDelivery,
      totalPackages: ctx.packages.length,
    },
  });
}

// ============================================================================
// SHIP DISPATCH HANDLER
// ============================================================================

export async function handleShipDispatch(ctx, payload) {
  if (!ctx.shipment) {
    ctx.addError('No shipment to dispatch');
    return;
  }
  
  // Generate tracking number
  ctx.shipment.trackingNumber = generateTrackingNumber(ctx.shipment.carrier);
  
  // Generate ASN (Advance Ship Notice)
  ctx.shipment.asn = {
    id: uuidv4(),
    shipmentId: ctx.shipment.id,
    generatedAt: new Date().toISOString(),
    packages: ctx.packages.map(p => ({
      packageId: p.id,
      weight: p.weight,
      dimensions: p.dimensions,
    })),
    expectedDelivery: ctx.shipment.estimatedDelivery,
    carrierRef: ctx.shipment.trackingNumber,
  };
  
  ctx.shipment.status = 'DISPATCHED';
  ctx.shipment.dispatchedAt = new Date().toISOString();
  
  // Update packages
  for (const pkg of ctx.packages) {
    pkg.status = 'SHIPPED';
    pkg.shippedAt = new Date().toISOString();
  }
  
  ctx.addAiRecommendation({
    type: 'SHIPMENT_DISPATCHED',
    message: `Shipment dispatched - Tracking: ${ctx.shipment.trackingNumber}`,
    confidence: 1.0,
    details: {
      trackingNumber: ctx.shipment.trackingNumber,
      asnGenerated: true,
    },
  });
}

// ============================================================================
// IN TRANSIT HANDLER
// ============================================================================

export async function handleShipInTransit(ctx, payload) {
  if (!ctx.shipment) {
    ctx.addError('No shipment in transit');
    return;
  }
  
  ctx.shipment.status = 'IN_TRANSIT';
  ctx.shipment.inTransitAt = new Date().toISOString();
  
  // Simulate tracking updates
  ctx.shipment.trackingEvents = [
    {
      timestamp: ctx.shipment.dispatchedAt,
      location: 'Origin Facility',
      status: 'PICKED_UP',
    },
    {
      timestamp: new Date().toISOString(),
      location: 'In Transit',
      status: 'EN_ROUTE',
    },
  ];
  
  ctx.addAiRecommendation({
    type: 'SHIPMENT_IN_TRANSIT',
    message: 'Shipment in transit to customer',
    confidence: 1.0,
    details: {
      lastLocation: 'In Transit',
    },
  });
}

// ============================================================================
// DELIVERED HANDLER
// ============================================================================

export async function handleShipDelivered(ctx, payload) {
  if (!ctx.shipment) {
    ctx.addError('No shipment for delivery');
    return;
  }
  
  const { signedBy, deliveryPhoto } = payload;
  
  ctx.shipment.status = 'DELIVERED';
  ctx.shipment.deliveredAt = new Date().toISOString();
  
  ctx.shipment.proofOfDelivery = {
    signedBy: signedBy || 'Customer',
    signedAt: new Date().toISOString(),
    photoUrl: deliveryPhoto || null,
  };
  
  ctx.shipment.trackingEvents.push({
    timestamp: ctx.shipment.deliveredAt,
    location: 'Destination',
    status: 'DELIVERED',
  });
  
  // Calculate actual lead time
  if (ctx.order?.createdAt) {
    const orderDate = new Date(ctx.order.createdAt);
    const deliveryDate = new Date(ctx.shipment.deliveredAt);
    ctx.metrics.actualLeadTime = Math.ceil((deliveryDate - orderDate) / (24 * 60 * 60 * 1000));
  }
  
  ctx.addAiRecommendation({
    type: 'SHIPMENT_DELIVERED',
    message: 'Shipment delivered successfully',
    confidence: 1.0,
    details: {
      signedBy: ctx.shipment.proofOfDelivery.signedBy,
      actualLeadTime: `${ctx.metrics.actualLeadTime} days`,
    },
  });
}

// ============================================================================
// INVOICE CREATION HANDLER
// ============================================================================

export async function handleInvoiceCreation(ctx, payload) {
  if (!ctx.order) {
    ctx.addError('No order for invoice');
    return;
  }
  
  const { surcharges, discounts, taxRate } = payload;
  
  // Calculate line totals from quote
  const subtotal = ctx.quote?.totalPrice || 0;
  
  // Apply surcharges
  let surchargeTotal = 0;
  const appliedSurcharges = [];
  
  if (surcharges) {
    surcharges.forEach(s => {
      surchargeTotal += s.amount;
      appliedSurcharges.push(s);
    });
  }
  
  // Add processing surcharges based on operations
  const processingFee = ctx.jobs.reduce((sum, job) => {
    return sum + (job.operations?.length || 0) * 5; // $5 per operation
  }, 0);
  if (processingFee > 0) {
    surchargeTotal += processingFee;
    appliedSurcharges.push({ name: 'Processing Fee', amount: processingFee });
  }
  
  // Freight
  const freight = ctx.shipment?.estimatedCost || 0;
  
  // Discounts
  let discountTotal = 0;
  if (discounts) {
    discounts.forEach(d => {
      discountTotal += d.amount;
    });
  }
  
  // Tax
  const taxableAmount = subtotal + surchargeTotal - discountTotal;
  const tax = taxableAmount * (taxRate || 0);
  
  // Total
  const total = taxableAmount + freight + tax;
  
  ctx.invoice = {
    id: uuidv4(),
    orderId: ctx.orderId,
    quoteId: ctx.quoteId,
    contactId: ctx.contactId,
    status: 'CREATED',
    createdAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Net 30
    subtotal: Math.round(subtotal * 100) / 100,
    surcharges: appliedSurcharges,
    surchargeTotal: Math.round(surchargeTotal * 100) / 100,
    discounts: discounts || [],
    discountTotal: Math.round(discountTotal * 100) / 100,
    freight: Math.round(freight * 100) / 100,
    taxRate: taxRate || 0,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
    paymentTerms: 'NET30',
    paymentMethod: null,
    paidAt: null,
  };
  
  ctx.invoiceId = ctx.invoice.id;
  ctx.metrics.totalValue = ctx.invoice.total;
  
  ctx.addAiRecommendation({
    type: 'INVOICE_CREATED',
    message: `Invoice created for $${ctx.invoice.total.toFixed(2)}`,
    confidence: 1.0,
    details: {
      subtotal: ctx.invoice.subtotal,
      surcharges: ctx.invoice.surchargeTotal,
      freight: ctx.invoice.freight,
      tax: ctx.invoice.tax,
      total: ctx.invoice.total,
      dueDate: ctx.invoice.dueDate,
    },
  });
}

// ============================================================================
// INVOICE SENT HANDLER
// ============================================================================

export async function handleInvoiceSent(ctx, payload) {
  if (!ctx.invoice) {
    ctx.addError('No invoice to send');
    return;
  }
  
  ctx.invoice.status = 'SENT';
  ctx.invoice.sentAt = new Date().toISOString();
  ctx.invoice.sentTo = ctx.contact?.email || 'CUSTOMER_EMAIL';
  
  ctx.addAiRecommendation({
    type: 'INVOICE_SENT',
    message: `Invoice sent to ${ctx.invoice.sentTo}`,
    confidence: 1.0,
  });
}

// ============================================================================
// INVOICE PAID HANDLER
// ============================================================================

export async function handleInvoicePaid(ctx, payload) {
  if (!ctx.invoice) {
    ctx.addError('No invoice for payment');
    return;
  }
  
  const { paymentMethod, paymentReference, amountPaid } = payload;
  
  ctx.invoice.status = 'PAID';
  ctx.invoice.paidAt = new Date().toISOString();
  ctx.invoice.paymentMethod = paymentMethod || 'CHECK';
  ctx.invoice.paymentReference = paymentReference || null;
  ctx.invoice.amountPaid = amountPaid || ctx.invoice.total;
  
  // Calculate margin
  const estimatedCost = ctx.invoice.subtotal * 0.75; // Assume 25% margin target
  ctx.metrics.marginPercent = ((ctx.invoice.subtotal - estimatedCost) / ctx.invoice.subtotal) * 100;
  
  ctx.addAiRecommendation({
    type: 'INVOICE_PAID',
    message: `Payment received: $${ctx.invoice.amountPaid.toFixed(2)}`,
    confidence: 1.0,
    details: {
      paymentMethod: ctx.invoice.paymentMethod,
      marginAchieved: `${ctx.metrics.marginPercent.toFixed(1)}%`,
    },
  });
}

// ============================================================================
// COMPLETION HANDLER
// ============================================================================

export async function handleCompletion(ctx, payload) {
  // Final analytics capture
  ctx.addAiRecommendation({
    type: 'PIPELINE_COMPLETE',
    message: 'Order lifecycle completed successfully',
    confidence: 1.0,
    details: {
      totalValue: ctx.metrics.totalValue,
      marginPercent: ctx.metrics.marginPercent,
      estimatedLeadTime: ctx.metrics.estimatedLeadTime,
      actualLeadTime: ctx.metrics.actualLeadTime,
      leadTimeVariance: ctx.metrics.actualLeadTime - ctx.metrics.estimatedLeadTime,
      stagesCompleted: ctx.stageHistory.length,
      errors: ctx.errors.length,
      warnings: ctx.warnings.length,
    },
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function determinePackageType(job) {
  const division = job.division?.toUpperCase();
  const form = job.form?.toUpperCase();
  
  if (division === 'PLASTICS') return 'CRATE';
  if (form === 'SHEET') return 'PALLET';
  if (form === 'BAR' || form === 'TUBE') return 'BUNDLE';
  if (form === 'PLATE') return 'SKID';
  return 'BOX';
}

function estimateWeight(job) {
  // Simplified weight estimation
  const baseWeight = {
    METALS: 150,
    PLASTICS: 50,
  };
  return baseWeight[job.division] || 100;
}

function estimateDimensions(job) {
  return {
    length: 96,
    width: 48,
    height: 12,
    unit: 'inches',
  };
}

function selectOptimalCarrier(totalWeight, priority) {
  // Select based on weight and priority
  if (priority.level <= 2) {
    // HOT or RUSH - use fastest
    return CARRIERS.find(c => c.type === 'LTL') || CARRIERS[0];
  }
  
  if (totalWeight > 500) {
    return CARRIERS.find(c => c.type === 'FLATBED') || CARRIERS[0];
  }
  
  if (totalWeight < 100) {
    return CARRIERS.find(c => c.type === 'GROUND') || CARRIERS[0];
  }
  
  return CARRIERS.find(c => c.type === 'LOCAL') || CARRIERS[0];
}

function generateShippingLabel(ctx, pkg) {
  return {
    from: {
      name: 'SteelWise Distribution',
      address: '1234 Industrial Blvd',
      city: 'Dallas',
      state: 'TX',
      zip: '75201',
    },
    to: {
      name: ctx.contact?.companyName || 'Customer',
      address: ctx.contact?.shippingAddress || 'Address Required',
    },
    weight: pkg.weight,
    packageId: pkg.id,
  };
}

function generateContentLabel(ctx, pkg) {
  return {
    contents: pkg.items.map(i => i.materialCode).join(', '),
    quantity: pkg.items.length,
    orderRef: ctx.orderId,
  };
}

function generateBarcode(id) {
  return `BC-${id.substring(0, 12).toUpperCase()}`;
}

function generateQRCode(pkg) {
  return {
    data: JSON.stringify({
      packageId: pkg.id,
      orderId: pkg.orderId,
      type: pkg.type,
    }),
    url: `https://steelwise.app/track/${pkg.id}`,
  };
}

function generateTrackingNumber(carrier) {
  const prefix = carrier.id.replace('CAR-', '');
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}${random}${Date.now().toString(36).toUpperCase()}`;
}

export default {
  handlePackCreation,
  handlePackLabeling,
  handleShipReady,
  handleShipDispatch,
  handleShipInTransit,
  handleShipDelivered,
  handleInvoiceCreation,
  handleInvoiceSent,
  handleInvoicePaid,
  handleCompletion,
};
