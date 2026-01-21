import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  contacts,
  rfqs,
  quotes,
  orders,
  jobs,
  findContactById,
  createContact,
  searchContacts,
  createRfq,
  listRfqs,
  findRfqById,
  updateRfqStatus,
  createQuote,
  findQuoteById,
  acceptQuote,
  createOrder,
  findOrderById,
  listOrders,
  planOrder,
  listJobs
} from './orderHubStore.js';

const router = Router();

// Helper for backward compatibility
function findOrCreateContact(contactData) {
  if (contactData.id) {
    const existing = findContactById(contactData.id);
    if (existing) return existing;
  }
  return createContact(contactData);
}

// ============================================================================
// CONTACT ENDPOINTS
// ============================================================================

// POST /v1/contacts - Create a new contact
router.post('/contacts', (req, res) => {
  try {
    const contact = createContact(req.body);
    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /v1/contacts - List/search contacts
router.get('/contacts', (req, res) => {
  try {
    const { email, companyName } = req.query;
    const result = searchContacts({ email, companyName });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /v1/contacts/:id - Get contact by ID
router.get('/contacts/:id', (req, res) => {
  try {
    const contact = findContactById(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// RFQ ENDPOINTS
// ============================================================================

// POST /v1/rfq - Create a new RFQ
router.post('/rfq', (req, res) => {
  try {
    const rfq = createRfq(req.body);
    const contact = findContactById(rfq.contactId);
    res.status(201).json({ ...rfq, contact });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /v1/rfq - List all RFQs
router.get('/rfq', (req, res) => {
  try {
    const { status, channel } = req.query;
    const result = listRfqs({ status, channel });
    const enriched = result.map(rfq => ({
      ...rfq,
      contact: findContactById(rfq.contactId)
    }));
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /v1/rfq/:id - Get single RFQ
router.get('/rfq/:id', (req, res) => {
  try {
    const rfq = findRfqById(req.params.id);
    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }
    const contact = findContactById(rfq.contactId);
    res.json({ ...rfq, contact });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /v1/rfq/:id/status - Update RFQ status
router.patch('/rfq/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const rfq = updateRfqStatus(req.params.id, status);
    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }
    res.json(rfq);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// QUOTE ENDPOINTS
// ============================================================================

// POST /v1/quotes - Create a new quote
router.post('/quotes', (req, res) => {
  try {
    const quote = createQuote(req.body);
    
    // Update RFQ status if linked
    if (quote.rfqId) {
      updateRfqStatus(quote.rfqId, 'QUOTED');
    }
    
    res.status(201).json(quote);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /v1/quotes - List all quotes
router.get('/quotes', (req, res) => {
  try {
    const result = quotes.map(q => {
      const contact = findContactById(q.contactId);
      const rfq = q.rfqId ? findRfqById(q.rfqId) : null;
      return { ...q, contact, rfq };
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /v1/quotes/:id - Get single quote
router.get('/quotes/:id', (req, res) => {
  try {
    const quote = findQuoteById(req.params.id);
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    const contact = findContactById(quote.contactId);
    const rfq = quote.rfqId ? findRfqById(quote.rfqId) : null;
    res.json({ ...quote, contact, rfq });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /v1/quotes/:id/accept - Accept quote and create order
router.post('/quotes/:id/accept', (req, res) => {
  try {
    const order = acceptQuote(req.params.id);
    const contact = findContactById(order.contactId);
    res.status(201).json({ order: { ...order, contact } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// ORDER ENDPOINTS
// ============================================================================

// POST /v1/orders - Create a direct order (web/CSR)
router.post('/orders', (req, res) => {
  try {
    const order = createOrder(req.body);
    const contact = findContactById(order.contactId);
    res.status(201).json({ ...order, contact });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /v1/orders - List all orders
router.get('/orders', (req, res) => {
  try {
    const { status, channel } = req.query;
    const result = listOrders({ status, channel });
    const enriched = result.map(order => ({
      ...order,
      contact: findContactById(order.contactId)
    }));
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /v1/orders/:id - Get single order
router.get('/orders/:id', (req, res) => {
  try {
    const order = findOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const contact = findContactById(order.contactId);
    const quote = order.quoteId ? findQuoteById(order.quoteId) : null;
    const orderJobs = listJobs({ orderId: order.id });
    res.json({ ...order, contact, quote, jobs: orderJobs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /v1/orders/:id/plan - Plan jobs for order
router.post('/orders/:id/plan', (req, res) => {
  try {
    const result = planOrder(req.params.id);
    const contact = findContactById(result.order.contactId);
    res.json({ order: { ...result.order, contact }, jobs: result.jobs });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /v1/orders/:id/mark-packaging - Mark order ready for packaging
router.post('/orders/:id/mark-packaging', (req, res) => {
  try {
    const order = findOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if all jobs are complete
    const orderJobs = listJobs({ orderId: order.id });
    const allComplete = orderJobs.length > 0 && orderJobs.every(j => j.status === 'COMPLETE');

    if (!allComplete && orderJobs.length > 0) {
      // For demo, mark all jobs as complete
      orderJobs.forEach(j => { j.status = 'COMPLETE'; });
    }

    order.status = 'PACKAGING';
    order.lines.forEach(line => { line.status = 'COMPLETE'; });

    const contact = findContactById(order.contactId);
    res.json({ ...order, contact, jobs: orderJobs });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /v1/jobs - List all jobs
router.get('/jobs', (req, res) => {
  try {
    const { orderId, status } = req.query;
    const result = listJobs({ orderId, status });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /v1/jobs/:id/complete - Mark job complete
router.post('/jobs/:id/complete', (req, res) => {
  try {
    const job = jobs.find(j => j.id === req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    job.status = 'COMPLETE';
    job.completedAt = new Date().toISOString();
    res.json(job);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

// Re-export stores for other modules
export { contacts, rfqs, quotes, orders, jobs };
