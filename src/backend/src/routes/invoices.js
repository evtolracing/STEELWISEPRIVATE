/**
 * Invoices, payments and credit memos.
 *
 *   GET  /api/invoices                 list (orderId, customerId, status=OPEN|OVERDUE|PAID…, kind, search)
 *   GET  /api/invoices/:id             one invoice with lines and payments
 *   POST /api/invoices                 { orderId } or { shipmentId }: bill what has shipped and is not invoiced
 *   POST /api/invoices/:id/payments    { amount, paymentMethod, referenceNumber?, paymentDate?, notes? }
 *   POST /api/invoices/:id/credit      { reason, lines: [{ invoiceLineId, quantity }] } or { reason, amount }
 *   POST /api/invoices/:id/refund      on a credit memo: { amount, paymentMethod, referenceNumber? }
 *   POST /api/invoices/:id/cancel      { reason? } only while nothing has been paid or credited
 */
import { Router } from 'express';
import {
  BillingError, listInvoices, getInvoice, invoiceOrder, invoiceShipment, recordPayment, creditInvoice, recordRefund, cancelInvoice,
} from '../services/billing.js';

const router = Router();

const handle = (label, fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error instanceof BillingError) return res.status(error.status).json({ error: error.message });
    if (error?.code === 'P2003' || error?.name === 'PrismaClientValidationError') return res.status(400).json({ error: 'The request has a field that is not valid' });
    console.error(`Invoices: ${label} failed:`, error);
    res.status(500).json({ error: `Failed to ${label}` });
  }
};

router.get('/', handle('fetch invoices', async (req, res) => {
  res.json(await listInvoices(req.query));
}));

router.get('/:id', handle('fetch invoice', async (req, res) => {
  const invoice = await getInvoice(req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  res.json(invoice);
}));

router.post('/', handle('create invoice', async (req, res) => {
  const { orderId, shipmentId, notes } = req.body || {};
  if (shipmentId) return res.status(201).json(await invoiceShipment(String(shipmentId)));
  if (!orderId) return res.status(400).json({ error: 'orderId or shipmentId is required' });
  res.status(201).json(await invoiceOrder(String(orderId), { notes: notes ? String(notes) : undefined }));
}));

router.post('/:id/payments', handle('record payment', async (req, res) => {
  res.status(201).json(await recordPayment(req.params.id, req.body || {}));
}));

router.post('/:id/credit', handle('issue credit', async (req, res) => {
  res.status(201).json(await creditInvoice(req.params.id, req.body || {}));
}));

router.post('/:id/refund', handle('record refund', async (req, res) => {
  res.status(201).json(await recordRefund(req.params.id, req.body || {}));
}));

router.post('/:id/cancel', handle('cancel invoice', async (req, res) => {
  res.json(await cancelInvoice(req.params.id, req.body || {}));
}));

export default router;
