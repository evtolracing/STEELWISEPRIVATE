// ============================================================================
// OrderHub In-Memory Store
// Centralized data store for all OrderHub entities
// ============================================================================

import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// DATA STORES
// ============================================================================

export const contacts = [];
export const rfqs = [];
export const quotes = [];
export const orders = [];
export const jobs = [];

// ============================================================================
// CONTACT HELPERS
// ============================================================================

export function findContactByEmail(email) {
  if (!email) return null;
  return contacts.find(c => c.email?.toLowerCase() === email.toLowerCase());
}

export function findContactById(id) {
  return contacts.find(c => c.id === id);
}

export function createContact(data) {
  // Check if contact with same email exists
  if (data.email) {
    const existing = findContactByEmail(data.email);
    if (existing) return existing;
  }

  const contact = {
    id: uuidv4(),
    companyName: data.companyName || null,
    contactName: data.contactName || null,
    email: data.email || null,
    phone: data.phone || null,
    billingAddress: data.billingAddress || null,
    shippingAddress: data.shippingAddress || null,
    notes: data.notes || null
  };
  contacts.push(contact);
  return contact;
}

export function searchContacts(params = {}) {
  let result = [...contacts];
  
  if (params.email) {
    result = result.filter(c => 
      c.email?.toLowerCase().includes(params.email.toLowerCase())
    );
  }
  
  if (params.companyName) {
    result = result.filter(c => 
      c.companyName?.toLowerCase().includes(params.companyName.toLowerCase())
    );
  }
  
  return result;
}

// ============================================================================
// RFQ HELPERS
// ============================================================================

export function findRfqById(id) {
  return rfqs.find(r => r.id === id);
}

export function createRfq(data) {
  // Handle contact - either find existing or create new
  let contactId = data.contactId;
  
  if (!contactId && data.contact) {
    const contact = createContact(data.contact);
    contactId = contact.id;
  }
  
  if (!contactId) {
    throw new Error('Contact or contactId is required');
  }

  const rfq = {
    id: uuidv4(),
    contactId,
    channel: data.channel || 'EMAIL',
    sourceRef: data.sourceRef || null,
    createdAt: new Date().toISOString(),
    status: 'NEW',
    requestedByName: data.requestedByName || null,
    requestedByEmail: data.requestedByEmail || null,
    requestedDueDate: data.requestedDueDate || null,
    lines: (data.lines || []).map((line, idx) => ({
      id: uuidv4(),
      materialCode: line.materialCode || null,
      commodity: line.commodity || null,
      form: line.form || null,
      grade: line.grade || null,
      thickness: line.thickness || null,
      width: line.width || null,
      length: line.length || null,
      quantity: line.quantity || 1,
      notes: line.notes || null
    }))
  };
  
  rfqs.push(rfq);
  return rfq;
}

export function listRfqs(params = {}) {
  let result = [...rfqs];
  
  if (params.status) {
    result = result.filter(r => r.status === params.status);
  }
  
  if (params.channel) {
    result = result.filter(r => r.channel === params.channel);
  }
  
  // Sort by createdAt descending
  result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return result;
}

export function updateRfqStatus(id, status) {
  const rfq = findRfqById(id);
  if (rfq) {
    rfq.status = status;
  }
  return rfq;
}

// ============================================================================
// QUOTE HELPERS
// ============================================================================

export function findQuoteById(id) {
  return quotes.find(q => q.id === id);
}

export function createQuote(data) {
  const lines = (data.lines || []).map(line => {
    const quantity = line.quantity || 1;
    const unitPrice = line.unitPrice || 0;
    return {
      id: uuidv4(),
      rfqLineId: line.rfqLineId || null,
      materialCode: line.materialCode || null,
      description: line.description || null,
      quantity,
      unitPrice,
      extendedPrice: Math.round(quantity * unitPrice * 100) / 100,
      notes: line.notes || null,
      // Spec overrides from quote pricing form
      surfaceFinish: line.surfaceFinish || null,
      tolerancePreset: line.tolerancePreset || null,
      thkTolerancePlus: line.thkTolerancePlus ?? null,
      thkToleranceMinus: line.thkToleranceMinus ?? null,
      lenTolerancePlus: line.lenTolerancePlus ?? null,
      lenToleranceMinus: line.lenToleranceMinus ?? null,
      widTolerancePlus: line.widTolerancePlus ?? null,
      widToleranceMinus: line.widToleranceMinus ?? null,
      certRequirements: line.certRequirements || [],
      specNotes: line.specNotes || null,
      gradeOverride: line.gradeOverride || null,
    };
  });

  const totalPrice = lines.reduce((sum, l) => sum + l.extendedPrice, 0);

  const quote = {
    id: uuidv4(),
    rfqId: data.rfqId || null,
    contactId: data.contactId,
    createdAt: new Date().toISOString(),
    status: 'DRAFT',
    validUntil: data.validUntil || null,
    currency: data.currency || 'USD',
    lines,
    totalPrice: Math.round(totalPrice * 100) / 100
  };

  quotes.push(quote);
  return quote;
}

export function acceptQuote(quoteId) {
  const quote = findQuoteById(quoteId);
  if (!quote) {
    throw new Error('Quote not found');
  }

  quote.status = 'ACCEPTED';

  // Update linked RFQ if exists
  if (quote.rfqId) {
    updateRfqStatus(quote.rfqId, 'ACCEPTED');
  }

  // Create Order from Quote
  const order = {
    id: uuidv4(),
    contactId: quote.contactId,
    quoteId: quote.id,
    channel: 'EMAIL', // Default, could be derived
    createdAt: new Date().toISOString(),
    status: 'NEW',
    locationId: 'LOC-001',
    division: null,
    requestedShipDate: null,
    promiseDate: null,
    lines: quote.lines.map(ql => ({
      id: uuidv4(),
      rfqLineId: ql.rfqLineId || null,
      quoteLineId: ql.id,
      materialCode: ql.materialCode || null,
      commodity: null,
      form: null,
      grade: ql.gradeOverride || null,
      thickness: null,
      width: null,
      length: null,
      quantity: ql.quantity,
      division: null,
      status: 'NEW',
      jobId: null,
      // Inherit spec overrides from quote line
      surfaceFinish: ql.surfaceFinish || null,
      tolerancePreset: ql.tolerancePreset || null,
      thkTolerancePlus: ql.thkTolerancePlus ?? null,
      thkToleranceMinus: ql.thkToleranceMinus ?? null,
      lenTolerancePlus: ql.lenTolerancePlus ?? null,
      lenToleranceMinus: ql.lenToleranceMinus ?? null,
      widTolerancePlus: ql.widTolerancePlus ?? null,
      widToleranceMinus: ql.widToleranceMinus ?? null,
      certRequirements: ql.certRequirements || [],
      specNotes: ql.specNotes || null,
    }))
  };

  orders.push(order);
  return order;
}

// ============================================================================
// ORDER HELPERS
// ============================================================================

export function findOrderById(id) {
  return orders.find(o => o.id === id);
}

export function createOrder(data) {
  // Handle contact
  let contactId = data.contactId;
  
  if (!contactId && data.contact) {
    const contact = createContact(data.contact);
    contactId = contact.id;
  }

  const order = {
    id: uuidv4(),
    contactId,
    quoteId: data.quoteId || null,
    channel: data.channel || 'PHONE',
    createdAt: new Date().toISOString(),
    status: 'NEW',
    locationId: data.locationId || 'LOC-001',
    division: data.division || null,
    requestedShipDate: data.requestedShipDate || null,
    promiseDate: data.promiseDate || null,
    lines: (data.lines || []).map(line => ({
      id: uuidv4(),
      rfqLineId: line.rfqLineId || null,
      quoteLineId: line.quoteLineId || null,
      materialCode: line.materialCode || null,
      commodity: line.commodity || null,
      form: line.form || null,
      grade: line.grade || null,
      thickness: line.thickness || null,
      width: line.width || null,
      length: line.length || null,
      quantity: line.quantity || 1,
      division: line.division || null,
      status: 'NEW',
      jobId: null,
      // Spec overrides
      surfaceFinish: line.surfaceFinish || null,
      tolerancePreset: line.tolerancePreset || null,
      thkTolerancePlus: line.thkTolerancePlus ?? null,
      thkToleranceMinus: line.thkToleranceMinus ?? null,
      lenTolerancePlus: line.lenTolerancePlus ?? null,
      lenToleranceMinus: line.lenToleranceMinus ?? null,
      widTolerancePlus: line.widTolerancePlus ?? null,
      widToleranceMinus: line.widToleranceMinus ?? null,
      certRequirements: line.certRequirements || [],
      specNotes: line.specNotes || null,
    }))
  };

  orders.push(order);
  return order;
}

export function planOrder(orderId) {
  const order = findOrderById(orderId);
  if (!order) {
    throw new Error('Order not found');
  }

  order.status = 'PLANNING';
  const createdJobs = [];

  for (const line of order.lines) {
    const job = {
      id: uuidv4(),
      orderId: order.id,
      orderLineId: line.id,
      locationId: order.locationId,
      division: line.division || order.division || 'METALS',
      materialCode: line.materialCode || 'UNKNOWN',
      thickness: line.thickness,
      width: line.width,
      length: line.length,
      grade: line.grade,
      status: 'PLANNING',
      // Inherit specs from order line
      surfaceFinish: line.surfaceFinish || null,
      tolerancePreset: line.tolerancePreset || null,
      thkTolerancePlus: line.thkTolerancePlus ?? null,
      thkToleranceMinus: line.thkToleranceMinus ?? null,
      lenTolerancePlus: line.lenTolerancePlus ?? null,
      lenToleranceMinus: line.lenToleranceMinus ?? null,
      widTolerancePlus: line.widTolerancePlus ?? null,
      widToleranceMinus: line.widToleranceMinus ?? null,
      certRequirements: line.certRequirements || [],
      specNotes: line.specNotes || null,
      specsInherited: true,
    };
    jobs.push(job);
    createdJobs.push(job);
    
    // Link job to order line
    line.jobId = job.id;
    line.status = 'PLANNING';
  }

  return { order, jobs: createdJobs };
}

export function listOrders(params = {}) {
  let result = [...orders];
  
  if (params.status) {
    result = result.filter(o => o.status === params.status);
  }
  
  result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return result;
}

// ============================================================================
// JOB HELPERS
// ============================================================================

export function findJobById(id) {
  return jobs.find(j => j.id === id);
}

export function listJobs(params = {}) {
  let result = [...jobs];
  
  if (params.orderId) {
    result = result.filter(j => j.orderId === params.orderId);
  }
  
  if (params.status) {
    result = result.filter(j => j.status === params.status);
  }
  
  return result;
}

export function updateJobStatus(jobId, status) {
  const job = findJobById(jobId);
  if (job) {
    job.status = status;
  }
  return job;
}
