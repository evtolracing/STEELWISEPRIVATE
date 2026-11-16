// Owner decision 10 (2026-11-15): who reads invoices (F-009) and a load that never arrives (N-027).
import test from 'node:test';
import assert from 'node:assert/strict';
import { invoiceReadDenial, apiRoleDenial, staffWriteDenial, INVOICE_READERS } from '../src/lib/roleAccess.js';
import { withoutInvoiceDetail, cutsInvoices } from '../src/lib/invoiceView.js';
import { shipmentMoveError } from '../src/lib/workflowRules.js';

test('invoices are read by sales, managers, leadership and view-only roles', () => {
  for (const role of ['CSR', 'SALES_REP', 'CREDIT_MANAGER', 'BRANCH_MANAGER', 'CFO', 'AUDITOR', 'DATA_ANALYST']) {
    assert.equal(INVOICE_READERS.has(role), true, role);
    assert.equal(invoiceReadDenial(role, '/api/invoices', 'GET'), null, role);
    assert.equal(invoiceReadDenial(role, '/api/invoices/aging', 'GET'), null, role);
  }
});

test('shop, warehouse, quality and maintenance staff are refused every invoice read', () => {
  for (const role of ['SHIPPING_COORDINATOR', 'OPERATOR_SAW', 'PACKAGING_LEAD', 'QC_INSPECTOR', 'MAINTENANCE_MANAGER', 'INVENTORY_MANAGER', 'PRODUCTION_MANAGER']) {
    for (const path of ['/api/invoices', '/api/invoices/aging', '/api/invoices/abc']) {
      assert.match(invoiceReadDenial(role, path, 'GET'), /sales, accounting and managers/, `${role} ${path}`);
      assert.match(apiRoleDenial({ role }, path, 'GET'), /sales, accounting and managers/, `${role} ${path}`);
    }
  }
});

test('the invoice rule judges reads of invoices only, and staff only', () => {
  assert.equal(invoiceReadDenial('SHIPPING_COORDINATOR', '/api/shipments', 'GET'), null);
  assert.equal(invoiceReadDenial('SHIPPING_COORDINATOR', '/api/invoicesX', 'GET'), null);
  assert.equal(invoiceReadDenial('SHIPPING_COORDINATOR', '/api/invoices/abc/payments', 'POST'), null); // writes keep their own rule
  assert.ok(staffWriteDenial('SHIPPING_COORDINATOR', '/api/invoices/abc/payments', 'POST'));
  assert.equal(invoiceReadDenial('CUSTOMER_ADMIN', '/api/invoices', 'GET'), null); // customers are held to the store by another rule
});

test('an invoice carried inside another answer is cut down to number and status', () => {
  const inv = { id: 'i1', invoiceNumber: 'INV-1', kind: 'INVOICE', status: 'SENT', totalAmount: 120.5, paidAmount: 20, payments: [{ amount: 20 }] };
  const out = withoutInvoiceDetail({ shipmentNumber: 'SHP-1', totalWeightLb: 400, invoice: inv, invoices: [inv], order: { invoices: [inv], totalAmount: 999 } });
  assert.deepEqual(out.invoice, { id: 'i1', invoiceNumber: 'INV-1', kind: 'INVOICE', status: 'SENT' });
  assert.deepEqual(out.invoices, [{ id: 'i1', invoiceNumber: 'INV-1', kind: 'INVOICE', status: 'SENT' }]);
  assert.deepEqual(out.order.invoices, [{ id: 'i1', invoiceNumber: 'INV-1', kind: 'INVOICE', status: 'SENT' }]);
  assert.equal(out.totalWeightLb, 400);
  assert.equal(out.order.totalAmount, 999); // an order's own total is not an invoice
  assert.equal(inv.totalAmount, 120.5); // the original is not changed
});

test('things that are not invoices are left alone', () => {
  const body = { invoice: 'INV-1', invoices: 3, list: [{ invoices: [{ count: 2 }] }], when: new Date(0) };
  assert.deepEqual(withoutInvoiceDetail(body), body);
  assert.equal(withoutInvoiceDetail(null), null);
});

test('who is cut down: staff who do not read invoices, outside counter sales', () => {
  assert.equal(cutsInvoices('SHIPPING_COORDINATOR', '/api/shipments/1'), true);
  assert.equal(cutsInvoices('SHIPPING_COORDINATOR', '/api/pos/quick-sale/1'), false);
  assert.equal(cutsInvoices('CSR', '/api/shipments/1'), false);
  assert.equal(cutsInvoices('CUSTOMER_ADMIN', '/api/ecom/my-orders/1'), false);
  assert.equal(cutsInvoices(undefined, '/api/shipments/1'), false);
});

test('recording a lost load is a manager-only change', () => {
  assert.match(staffWriteDenial('SHIPPING_COORDINATOR', '/api/shipments/abc/lost', 'PUT'), /need a manager/);
  assert.match(staffWriteDenial('CSR', '/api/shipments/abc/lost', 'PUT'), /need a manager/);
  assert.equal(staffWriteDenial('CREDIT_MANAGER', '/api/shipments/abc/lost', 'PUT'), null);
  assert.equal(staffWriteDenial('BRANCH_MANAGER', '/api/shipments/abc/lost', 'PUT'), null);
});

test('a plain status change never reaches or leaves LOST', () => {
  for (const from of ['PENDING', 'LOADING', 'IN_TRANSIT', 'EXCEPTION', 'DELIVERED', 'CANCELLED']) assert.match(shipmentMoveError(from, 'LOST'), /recorded as lost by a manager/, from);
  for (const to of ['PENDING', 'LOADING', 'IN_TRANSIT', 'EXCEPTION', 'DELIVERED', 'CANCELLED']) assert.ok(shipmentMoveError('LOST', to), to);
});
