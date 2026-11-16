/**
 * Invoice amounts and payments stay with the roles that read invoices (F-009, owner decision 10).
 *
 * `/api/invoices` itself is closed to other staff in `lib/roleAccess.js`. Other answers carry
 * invoices inside something else: a shipment with the invoice it raised, an order with its invoices.
 * For a staff reader who does not read invoices, each of those is cut down to what the dock needs to
 * know, that an invoice exists, its number and its status, and the amounts and payments are left out.
 * Customers and partners are not touched here (they see their own invoices under their own rules),
 * and neither are counter sales, where the clerk who takes the money sees the receipt.
 */
import { INVOICE_READERS, staffGroupOf } from './roleAccess.js';

const KEEP = ['id', 'invoiceNumber', 'kind', 'status'];
const plain = (v) => v && typeof v === 'object' && (Array.isArray(v) || Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);
const isInvoice = (o) => plain(o) && !Array.isArray(o) && 'invoiceNumber' in o;
const brief = (o) => Object.fromEntries(KEEP.filter((k) => k in o).map((k) => [k, o[k]]));

/** Pure: a copy of the answer with every invoice carried inside it cut down to number and status. */
export function withoutInvoiceDetail(value, depth = 0) {
  if (!plain(value) || depth > 12) return value;
  if (Array.isArray(value)) return value.map((v) => withoutInvoiceDetail(v, depth + 1));
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if ((k === 'invoice' || k === 'creditOfInvoice') && isInvoice(v)) out[k] = brief(v);
    else if ((k === 'invoices' || k === 'credits' || k === 'creditMemos') && Array.isArray(v) && v.every(isInvoice)) out[k] = v.map(brief);
    else out[k] = withoutInvoiceDetail(v, depth + 1);
  }
  return out;
}

/** Whether this reader's answers are cut down: staff who do not read invoices, outside counter sales. */
export const cutsInvoices = (role, path) => Boolean(staffGroupOf(role)) && !INVOICE_READERS.has(role) && !/^\/(api\/)?pos(\/|$)/.test(path || '');

/** Express guard, mounted on /api. */
export function invoiceDetailGuard(req, res, next) {
  const send = res.json.bind(res);
  res.json = (body) => send(cutsInvoices(req.user?.role, req.originalUrl.split('?')[0]) ? withoutInvoiceDetail(body) : body);
  next();
}
