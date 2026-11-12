/**
 * Customer portal API.
 *
 * Enterprise account (mounted at /api/enterprise); `accountId` is an organization id or code:
 *   GET  /accounts/:accountId              profile, branches, stats
 *   GET  /accounts/:accountId/kpis
 *   GET  /orders?accountId=&branchId=&status=&search=&dateFrom=&dateTo=&sortBy=
 *   GET  /orders/export?accountId=...      CSV
 *   GET  /orders/:orderId?accountId=
 *   GET  /shipments?accountId=&branchId=&status=&search=
 *   GET  /documents?accountId=&branchId=&type=&orderId=&search=
 *   GET  /documents/:docId/download
 *   POST /documents/bulk-download          { documentIds } → ZIP
 *
 * My Orders (mounted at /api/ecom/my-orders):
 *   GET  /?customerId=&status=&search=
 *   GET  /:id
 *   GET  /:id/documents
 */
import { Router } from 'express';
import * as portal from '../services/portalService.js';
import { buildZip } from '../lib/zip.js';
import { isCustomerLogin, requireLinkedCustomer, scopedCustomerId } from '../lib/customerScope.js';

// Customer logins only ever see their own account: these replace whatever
// account the request named with the login's own (staff are unchanged).
const accountParam = (req) => scopedCustomerId(req, req.params.accountId);
const accountQuery = (req) => {
  if (!isCustomerLogin(req.user)) return req.query;
  const id = scopedCustomerId(req);
  return { ...req.query, accountId: id, customerId: id };
};
// For lookups by order or document id: a customer login must own it.
const ownerScope = (req) => (isCustomerLogin(req.user) ? scopedCustomerId(req) : undefined);

const wrap = (label, fn) => async (req, res) => {
  try {
    const out = await fn(req, res);
    if (out === undefined) return;
    if (out === null) return res.status(404).json({ error: 'Customer account not found' });
    if (out?.status) return res.status(out.status).json({ error: out.error });
    res.json(out);
  } catch (error) {
    console.error(`Portal: ${label} failed:`, error);
    res.status(500).json({ error: `Failed to ${label}` });
  }
};

const safeName = (s) => s.replace(/[^\w .()-]+/g, '_');

export const enterpriseRouter = Router();
enterpriseRouter.use(requireLinkedCustomer);
enterpriseRouter.get('/accounts/:accountId', wrap('load account', async (req) => {
  const data = await portal.accountProfile(accountParam(req));
  return data && { data };
}));
enterpriseRouter.get('/accounts/:accountId/kpis', wrap('load account KPIs', async (req) => {
  const data = await portal.accountKpis(accountParam(req));
  return data && { data };
}));
enterpriseRouter.get('/orders', wrap('list orders', (req) => portal.listAccountOrders(accountQuery(req))));
enterpriseRouter.get('/orders/export', wrap('export orders', async (req, res) => {
  const csv = await portal.exportOrdersCsv(accountQuery(req));
  if (csv === null) return null;
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', `attachment; filename="orders-export-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csv);
  return undefined;
}));
enterpriseRouter.get('/orders/:orderId', wrap('load order', async (req) => {
  const data = await portal.accountOrderDetail(req.params.orderId, isCustomerLogin(req.user) ? scopedCustomerId(req) : req.query.accountId);
  return data ? { data } : { status: 404, error: 'Order not found' };
}));
enterpriseRouter.get('/shipments', wrap('list shipments', (req) => portal.listAccountShipments(accountQuery(req))));
enterpriseRouter.get('/documents', wrap('list documents', (req) => portal.listAccountDocuments(accountQuery(req))));
enterpriseRouter.get('/documents/:docId/download', wrap('download document', async (req, res) => {
  const doc = await portal.renderDocument(req.params.docId, ownerScope(req));
  if (!doc) return { status: 404, error: 'Document not found' };
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.set('Content-Disposition', `attachment; filename="${safeName(doc.name)}"`);
  res.send(doc.content);
  return undefined;
}));
enterpriseRouter.post('/documents/bulk-download', wrap('download documents', async (req, res) => {
  const ids = Array.isArray(req.body?.documentIds) ? req.body.documentIds.slice(0, 200) : [];
  if (!ids.length) return { status: 400, error: 'documentIds is required' };
  const files = [];
  const used = new Set();
  for (const id of ids) {
    const doc = await portal.renderDocument(id, ownerScope(req));
    if (!doc) continue;
    let name = safeName(doc.name);
    for (let n = 2; used.has(name); n++) name = safeName(doc.name.replace(/(\.\w+)?$/, ` (${n})$1`));
    used.add(name);
    files.push({ name, content: doc.content });
  }
  if (!files.length) return { status: 404, error: 'No documents found' };
  res.set('Content-Type', 'application/zip');
  res.set('Content-Disposition', `attachment; filename="documents-${new Date().toISOString().slice(0, 10)}.zip"`);
  res.send(buildZip(files));
  return undefined;
}));

export const myOrdersRouter = Router();
myOrdersRouter.use(requireLinkedCustomer);
myOrdersRouter.get('/', wrap('list orders', (req) => portal.listMyOrders(accountQuery(req))));
myOrdersRouter.get('/:id', wrap('load order', async (req) => {
  const data = await portal.getMyOrder(req.params.id, ownerScope(req));
  return data ? { data } : { status: 404, error: 'Order not found' };
}));
myOrdersRouter.get('/:id/documents', wrap('load documents', async (req) => ({ data: await portal.myOrderDocuments(req.params.id, ownerScope(req)) })));
