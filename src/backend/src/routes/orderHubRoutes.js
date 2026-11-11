import { Router } from 'express';
import prisma from '../lib/db.js';
import {
  findContactById,
  createContact,
  searchContacts,
  createRfq,
  listRfqs,
  findRfqById,
  updateRfqStatus,
  createQuote,
  findQuoteById,
  listQuotes,
  acceptQuote,
  createOrder,
  findOrderById,
  listOrders,
  updateOrder,
  planOrder,
  listJobs,
  findJobById,
  saveJob,
} from './orderHubStore.js';

const router = Router();

// Wraps an async handler so a thrown error becomes a JSON response.
const handle = (fn, status = 500) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    res.status(status).json({ error: error.message });
  }
};

// Attaches each item's contact with one query instead of one per item.
async function withContacts(items) {
  const ids = [...new Set(items.map(i => i.contactId).filter(Boolean))];
  const contacts = await Promise.all(ids.map(findContactById));
  const byId = new Map(contacts.filter(Boolean).map(c => [c.id, c]));
  return items.map(item => ({ ...item, contact: byId.get(item.contactId) || null }));
}

// ============================================================================
// CONTACT ENDPOINTS
// ============================================================================

// POST /v1/contacts - Create a new contact
router.post('/contacts', handle(async (req, res) => {
  res.status(201).json(await createContact(req.body || {}));
}));

// GET /v1/contacts - List/search contacts
router.get('/contacts', handle(async (req, res) => {
  const { email, companyName } = req.query;
  res.json(await searchContacts({ email, companyName }));
}));

// GET /v1/contacts/:id - Get contact by ID
router.get('/contacts/:id', handle(async (req, res) => {
  const contact = await findContactById(req.params.id);
  if (!contact) return res.status(404).json({ error: 'Contact not found' });
  res.json(contact);
}));

// ============================================================================
// RFQ ENDPOINTS
// ============================================================================

// POST /v1/rfq - Create a new RFQ
router.post('/rfq', handle(async (req, res) => {
  const rfq = await createRfq(req.body || {});
  res.status(201).json({ ...rfq, contact: await findContactById(rfq.contactId) });
}, 400));

// GET /v1/rfq - List all RFQs
router.get('/rfq', handle(async (req, res) => {
  const { status, channel } = req.query;
  res.json(await withContacts(await listRfqs({ status, channel })));
}));

// GET /v1/rfq/:id - Get single RFQ
router.get('/rfq/:id', handle(async (req, res) => {
  const rfq = await findRfqById(req.params.id);
  if (!rfq) return res.status(404).json({ error: 'RFQ not found' });
  res.json({ ...rfq, contact: await findContactById(rfq.contactId) });
}));

// PATCH /v1/rfq/:id/status - Update RFQ status
router.patch('/rfq/:id/status', handle(async (req, res) => {
  const rfq = await updateRfqStatus(req.params.id, req.body?.status);
  if (!rfq) return res.status(404).json({ error: 'RFQ not found' });
  res.json(rfq);
}, 400));

// ============================================================================
// QUOTE ENDPOINTS
// ============================================================================

// POST /v1/quotes - Create a new quote
router.post('/quotes', handle(async (req, res) => {
  const quote = await createQuote(req.body || {});
  // Update RFQ status if linked
  if (quote.rfqId) await updateRfqStatus(quote.rfqId, 'QUOTED');
  res.status(201).json(quote);
}, 400));

// GET /v1/quotes - List all quotes
router.get('/quotes', handle(async (req, res) => {
  const quotes = await withContacts(await listQuotes());
  const result = await Promise.all(
    quotes.map(async q => ({ ...q, rfq: q.rfqId ? await findRfqById(q.rfqId) : null }))
  );
  res.json(result);
}));

// GET /v1/quotes/:id - Get single quote
router.get('/quotes/:id', handle(async (req, res) => {
  const quote = await findQuoteById(req.params.id);
  if (!quote) return res.status(404).json({ error: 'Quote not found' });
  const [contact, rfq] = await Promise.all([
    findContactById(quote.contactId),
    quote.rfqId ? findRfqById(quote.rfqId) : null,
  ]);
  res.json({ ...quote, contact, rfq });
}));

// POST /v1/quotes/:id/accept - Accept quote and create order
router.post('/quotes/:id/accept', handle(async (req, res) => {
  const order = await acceptQuote(req.params.id);
  res.status(201).json({ order: { ...order, contact: await findContactById(order.contactId) } });
}, 400));

// ============================================================================
// ORDER ENDPOINTS
// ============================================================================

// POST /v1/orders - Create a direct order (web/CSR)
router.post('/orders', handle(async (req, res) => {
  const order = await createOrder(req.body || {});
  res.status(201).json({ ...order, contact: await findContactById(order.contactId) });
}, 400));

// GET /v1/orders - List all orders
router.get('/orders', handle(async (req, res) => {
  const { status } = req.query;
  res.json(await withContacts(await listOrders({ status })));
}));

// GET /v1/orders/:id - Get single order
router.get('/orders/:id', handle(async (req, res) => {
  const order = await findOrderById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const [contact, quote, jobs] = await Promise.all([
    findContactById(order.contactId),
    order.quoteId ? findQuoteById(order.quoteId) : null,
    listJobs({ orderId: order.id }),
  ]);
  res.json({ ...order, contact, quote, jobs });
}));

// POST /v1/orders/:id/plan - Plan jobs for order
router.post('/orders/:id/plan', handle(async (req, res) => {
  const result = await planOrder(req.params.id);
  const contact = await findContactById(result.order.contactId);
  res.json({ order: { ...result.order, contact }, jobs: result.jobs });
}, 400));

// POST /v1/orders/:id/mark-packaging - Mark order ready for packaging
router.post('/orders/:id/mark-packaging', handle(async (req, res) => {
  const order = await findOrderById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  // For the demo flow, finishing packaging also completes any open jobs.
  await prisma.intakeJob.updateMany({
    where: { orderId: order.id, status: { not: 'COMPLETE' } },
    data: { status: 'COMPLETE' },
  });

  const updated = await updateOrder(order.id, {
    status: 'PACKAGING',
    lines: order.lines.map(line => ({ ...line, status: 'COMPLETE' })),
  });
  const [contact, jobs] = await Promise.all([
    findContactById(order.contactId),
    listJobs({ orderId: order.id }),
  ]);
  res.json({ ...updated, contact, jobs });
}, 400));

// GET /v1/jobs - List all jobs
router.get('/jobs', handle(async (req, res) => {
  const { orderId, status } = req.query;
  res.json(await listJobs({ orderId, status }));
}));

// POST /v1/jobs/:id/complete - Mark job complete
router.post('/jobs/:id/complete', handle(async (req, res) => {
  const job = await findJobById(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  res.json(await saveJob({ ...job, status: 'COMPLETE', completedAt: new Date().toISOString() }));
}, 400));

export default router;
