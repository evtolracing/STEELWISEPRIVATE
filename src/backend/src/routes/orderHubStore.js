// ============================================================================
// OrderHub store
// Contacts, RFQs, quotes, orders and jobs for the intake pipeline, kept in the
// database (Intake* tables). Every function is async and returns plain
// objects in the shape the OrderHub API has always returned.
// ============================================================================

import prisma from '../lib/db.js';
import { ci } from '../lib/dbText.js';
import { randomUUID } from 'crypto';

function db() {
  if (!prisma) throw new Error('Database is not configured');
  return prisma;
}

const iso = value => (value instanceof Date ? value.toISOString() : value);
const asArray = value => (Array.isArray(value) ? value : []);
const newId = () => randomUUID();
const round2 = n => Math.round(n * 100) / 100;

// ============================================================================
// SHAPES
// ============================================================================

function contactOut(row) {
  if (!row) return null;
  const { updatedAt, ...rest } = row;
  return { ...rest, createdAt: iso(row.createdAt) };
}

function rfqOut(row) {
  if (!row) return null;
  const { updatedAt, contact, quotes, ...rest } = row;
  return { ...rest, createdAt: iso(row.createdAt), lines: asArray(row.lines) };
}

function quoteOut(row) {
  if (!row) return null;
  const { updatedAt, rfq, contact, orders, ...rest } = row;
  return {
    ...rest,
    createdAt: iso(row.createdAt),
    lines: asArray(row.lines),
    totalPrice: Number(row.totalPrice),
  };
}

function orderOut(row) {
  if (!row) return null;
  const { updatedAt, contact, quote, jobs, ...rest } = row;
  return { ...rest, createdAt: iso(row.createdAt), lines: asArray(row.lines) };
}

function jobOut(row) {
  if (!row) return null;
  const { details, updatedAt, order, ...rest } = row;
  return { ...(details || {}), ...rest, createdAt: iso(row.createdAt) };
}

// Spec overrides carried from quote line to order line to job.
function specFields(src = {}) {
  return {
    surfaceFinish: src.surfaceFinish || null,
    tolerancePreset: src.tolerancePreset || null,
    thkTolerancePlus: src.thkTolerancePlus ?? null,
    thkToleranceMinus: src.thkToleranceMinus ?? null,
    lenTolerancePlus: src.lenTolerancePlus ?? null,
    lenToleranceMinus: src.lenToleranceMinus ?? null,
    widTolerancePlus: src.widTolerancePlus ?? null,
    widToleranceMinus: src.widToleranceMinus ?? null,
    certRequirements: src.certRequirements || [],
    specNotes: src.specNotes || null,
  };
}

// ============================================================================
// CONTACT HELPERS
// ============================================================================

export async function findContactByEmail(email) {
  if (!email) return null;
  return contactOut(await db().intakeContact.findFirst({ where: { email: { equals: email, ...ci } } }));
}

export async function findContactById(id) {
  if (!id) return null;
  return contactOut(await db().intakeContact.findUnique({ where: { id } }));
}

export async function createContact(data) {
  // Reuse the contact when one with the same email exists
  if (data.email) {
    const existing = await findContactByEmail(data.email);
    if (existing) return existing;
  }

  const row = await db().intakeContact.create({
    data: {
      ...(data.id ? { id: data.id } : {}),
      companyName: data.companyName || null,
      contactName: data.contactName || null,
      email: data.email || null,
      phone: data.phone || null,
      billingAddress: data.billingAddress || null,
      shippingAddress: data.shippingAddress || null,
      notes: data.notes || null,
    },
  });
  return contactOut(row);
}

export async function searchContacts(params = {}) {
  const where = {};
  if (params.email) where.email = { contains: params.email, ...ci };
  if (params.companyName) where.companyName = { contains: params.companyName, ...ci };
  const rows = await db().intakeContact.findMany({ where, orderBy: { companyName: 'asc' }, take: 500 });
  return rows.map(contactOut);
}

export async function listContacts() {
  return searchContacts();
}

// ============================================================================
// RFQ HELPERS
// ============================================================================

export async function findRfqById(id) {
  if (!id) return null;
  return rfqOut(await db().intakeRfq.findUnique({ where: { id } }));
}

export async function createRfq(data) {
  // Handle contact - either find existing or create new
  let contactId = data.contactId;

  if (!contactId && data.contact) {
    const contact = await createContact(data.contact);
    contactId = contact.id;
  }

  if (!contactId) {
    throw new Error('Contact or contactId is required');
  }

  const row = await db().intakeRfq.create({
    data: {
      contactId,
      channel: data.channel || 'EMAIL',
      sourceRef: data.sourceRef || null,
      status: 'NEW',
      requestedByName: data.requestedByName || null,
      requestedByEmail: data.requestedByEmail || null,
      requestedDueDate: data.requestedDueDate || null,
      lines: asArray(data.lines).map(line => ({
        id: newId(),
        materialCode: line.materialCode || null,
        commodity: line.commodity || null,
        form: line.form || null,
        grade: line.grade || null,
        thickness: line.thickness || null,
        width: line.width || null,
        length: line.length || null,
        quantity: line.quantity || 1,
        notes: line.notes || null,
      })),
    },
  });
  return rfqOut(row);
}

export async function listRfqs(params = {}) {
  const where = {};
  if (params.status) where.status = params.status;
  if (params.channel) where.channel = params.channel;
  const rows = await db().intakeRfq.findMany({ where, orderBy: { createdAt: 'desc' }, take: 500 });
  return rows.map(rfqOut);
}

export async function updateRfqStatus(id, status) {
  const result = await db().intakeRfq.updateMany({ where: { id }, data: { status } });
  return result.count ? findRfqById(id) : null;
}

// ============================================================================
// QUOTE HELPERS
// ============================================================================

export async function findQuoteById(id) {
  if (!id) return null;
  return quoteOut(await db().intakeQuote.findUnique({ where: { id } }));
}

export async function createQuote(data) {
  const lines = asArray(data.lines).map(line => {
    const quantity = line.quantity || 1;
    const unitPrice = line.unitPrice || 0;
    return {
      id: newId(),
      rfqLineId: line.rfqLineId || null,
      materialCode: line.materialCode || null,
      description: line.description || null,
      quantity,
      unitPrice,
      extendedPrice: round2(quantity * unitPrice),
      notes: line.notes || null,
      ...specFields(line),
      gradeOverride: line.gradeOverride || null,
    };
  });

  const totalPrice = round2(lines.reduce((sum, l) => sum + l.extendedPrice, 0));

  const row = await db().intakeQuote.create({
    data: {
      rfqId: data.rfqId || null,
      contactId: data.contactId,
      status: 'DRAFT',
      validUntil: data.validUntil || null,
      currency: data.currency || 'USD',
      lines,
      totalPrice,
    },
  });
  return quoteOut(row);
}

export async function listQuotes(params = {}) {
  const where = {};
  if (params.status) where.status = params.status;
  if (params.rfqId) where.rfqId = params.rfqId;
  const rows = await db().intakeQuote.findMany({ where, orderBy: { createdAt: 'desc' }, take: 500 });
  return rows.map(quoteOut);
}

export async function updateQuote(id, data) {
  const result = await db().intakeQuote.updateMany({ where: { id }, data });
  return result.count ? findQuoteById(id) : null;
}

export async function acceptQuote(quoteId) {
  const quote = await findQuoteById(quoteId);
  if (!quote) {
    throw new Error('Quote not found');
  }

  return db().$transaction(async tx => {
    await tx.intakeQuote.update({ where: { id: quote.id }, data: { status: 'ACCEPTED' } });

    // Update linked RFQ if exists
    if (quote.rfqId) {
      await tx.intakeRfq.updateMany({ where: { id: quote.rfqId }, data: { status: 'ACCEPTED' } });
    }

    // Create Order from Quote
    const order = await tx.intakeOrder.create({
      data: {
        contactId: quote.contactId,
        quoteId: quote.id,
        channel: 'EMAIL',
        status: 'NEW',
        locationId: 'LOC-001',
        lines: quote.lines.map(ql => ({
          id: newId(),
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
          ...specFields(ql),
        })),
      },
    });
    return orderOut(order);
  });
}

// ============================================================================
// ORDER HELPERS
// ============================================================================

export async function findOrderById(id) {
  if (!id) return null;
  return orderOut(await db().intakeOrder.findUnique({ where: { id } }));
}

export async function createOrder(data) {
  // Handle contact
  let contactId = data.contactId;

  if (!contactId && data.contact) {
    const contact = await createContact(data.contact);
    contactId = contact.id;
  }

  const row = await db().intakeOrder.create({
    data: {
      contactId: contactId || null,
      quoteId: data.quoteId || null,
      channel: data.channel || 'PHONE',
      status: 'NEW',
      locationId: data.locationId || 'LOC-001',
      division: data.division || null,
      requestedShipDate: data.requestedShipDate || null,
      promiseDate: data.promiseDate || null,
      lines: asArray(data.lines).map(line => ({
        id: newId(),
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
        ...specFields(line),
      })),
    },
  });
  return orderOut(row);
}

export async function updateOrder(id, data) {
  const result = await db().intakeOrder.updateMany({ where: { id }, data });
  return result.count ? findOrderById(id) : null;
}

export async function planOrder(orderId) {
  const order = await findOrderById(orderId);
  if (!order) {
    throw new Error('Order not found');
  }

  return db().$transaction(async tx => {
    const createdJobs = [];
    const lines = [];

    for (const line of order.lines) {
      const details = {
        orderLineId: line.id,
        materialCode: line.materialCode || 'UNKNOWN',
        thickness: line.thickness,
        width: line.width,
        length: line.length,
        grade: line.grade,
        ...specFields(line),
        specsInherited: true,
      };
      const job = await tx.intakeJob.create({
        data: {
          orderId: order.id,
          orderLineId: line.id,
          locationId: order.locationId,
          division: line.division || order.division || 'METALS',
          status: 'PLANNING',
          details,
        },
      });
      createdJobs.push(jobOut(job));
      lines.push({ ...line, jobId: job.id, status: 'PLANNING' });
    }

    const updated = await tx.intakeOrder.update({
      where: { id: order.id },
      data: { status: 'PLANNING', lines },
    });
    return { order: orderOut(updated), jobs: createdJobs };
  });
}

export async function listOrders(params = {}) {
  const where = {};
  if (params.status) where.status = params.status;
  const rows = await db().intakeOrder.findMany({ where, orderBy: { createdAt: 'desc' }, take: 500 });
  return rows.map(orderOut);
}

// ============================================================================
// JOB HELPERS
// ============================================================================

export async function findJobById(id) {
  if (!id) return null;
  return jobOut(await db().intakeJob.findUnique({ where: { id } }));
}

export async function listJobs(params = {}) {
  const where = {};
  if (params.orderId) where.orderId = params.orderId;
  if (params.status) where.status = params.status;
  const rows = await db().intakeJob.findMany({ where, orderBy: { createdAt: 'desc' }, take: 1000 });
  return rows.map(jobOut);
}

// Saves a whole job as the API returns it: known columns go to their
// columns, everything else (recipe, schedule, QC result, ...) to details.
const JOB_COLUMNS = ['id', 'orderId', 'orderLineId', 'locationId', 'division', 'status', 'createdAt', 'updatedAt'];

export async function saveJob(job) {
  if (!job?.id) return null;
  const details = Object.fromEntries(Object.entries(job).filter(([key]) => !JOB_COLUMNS.includes(key)));
  const data = { details: JSON.parse(JSON.stringify(details)) };
  if (job.status) data.status = job.status;
  if (job.division) data.division = job.division;
  if (job.locationId) data.locationId = job.locationId;
  const result = await db().intakeJob.updateMany({ where: { id: job.id }, data });
  return result.count ? findJobById(job.id) : null;
}

export async function updateJobStatus(jobId, status) {
  const result = await db().intakeJob.updateMany({ where: { id: jobId }, data: { status } });
  return result.count ? findJobById(jobId) : null;
}
