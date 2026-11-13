import test from 'node:test';
import assert from 'node:assert/strict';
import {
  money, termDays, dueDateFor, lineAmount, chargesFor, invoiceStatusFor, balanceOf, paymentError,
} from '../src/lib/billingRules.js';

test('payment terms give the number of days until due', () => {
  assert.equal(termDays('NET 30'), 30);
  assert.equal(termDays('net15'), 15);
  assert.equal(termDays('2% 10 NET 45'), 45);
  assert.equal(termDays('COD'), 0);
  assert.equal(termDays('Due on receipt'), 0);
  assert.equal(termDays(null), 30);
  assert.equal(termDays('something odd'), 30);
  assert.equal(dueDateFor('NET 15', new Date('2026-01-01T12:00:00Z')).toISOString().slice(0, 10), '2026-01-16');
});

test('a part shipment is billed its share of the line', () => {
  const line = { qtyOrdered: 300, extendedPrice: 100 };
  assert.equal(lineAmount(line, 100), 33.33);
  assert.equal(lineAmount(line, 300), 100);
  assert.equal(lineAmount({ qtyOrdered: 0, extendedPrice: 5 }, 1), 0);
  assert.equal(lineAmount({ qtyOrdered: 10, extendedPrice: null }, 5), 0);
});

test('freight is billed once and tax adds up to the order tax', () => {
  const order = { subtotal: 100, taxAmount: 8.25, freightAmount: 50 };
  const first = chargesFor(order, { tax: 0, freight: 0 }, 33.33, false);
  assert.deepEqual(first, { tax: 2.75, freight: 50 });
  const second = chargesFor(order, { tax: 2.75, freight: 50 }, 33.33, false);
  assert.deepEqual(second, { tax: 2.75, freight: 0 });
  const last = chargesFor(order, { tax: 5.5, freight: 50 }, 33.34, true);
  assert.deepEqual(last, { tax: 2.75, freight: 0 });
  assert.equal(money(first.tax + second.tax + last.tax), 8.25);
});

test('tax never goes past what the order charged', () => {
  const order = { subtotal: 100, taxAmount: 1, freightAmount: 0 };
  assert.equal(chargesFor(order, { tax: 0.9, freight: 0 }, 50, false).tax, 0.1);
  assert.equal(chargesFor({ subtotal: 0, taxAmount: 0, freightAmount: 0 }, { tax: 0, freight: 0 }, 0, true).tax, 0);
});

test('invoice status follows the money', () => {
  assert.equal(invoiceStatusFor(100, 0), 'SENT');
  assert.equal(invoiceStatusFor(100, 40), 'PARTIAL');
  assert.equal(invoiceStatusFor(100, 100), 'PAID');
  assert.equal(invoiceStatusFor(-50, -50), 'PAID');
  assert.equal(invoiceStatusFor(-50, 0), 'SENT');
  assert.equal(invoiceStatusFor(0, 0), 'PAID');
  assert.equal(balanceOf({ totalAmount: '100.10', paidAmount: '40.05' }), 60.05);
});

test('payments are refused when they do not fit the invoice', () => {
  const inv = { kind: 'INVOICE', status: 'PARTIAL', totalAmount: 100, paidAmount: 40 };
  assert.equal(paymentError(inv, 60, 'CHECK'), null);
  assert.match(paymentError(inv, 60.01, 'CHECK'), /Only 60.00/);
  assert.match(paymentError(inv, 0, 'CHECK'), /more than zero/);
  assert.match(paymentError(inv, -5, 'CHECK'), /more than zero/);
  assert.match(paymentError(inv, NaN, 'CHECK'), /more than zero/);
  assert.match(paymentError(inv, 1.005, 'CHECK'), /fractions of a cent/);
  assert.match(paymentError(inv, 10, 'BITCOIN'), /paymentMethod/);
  assert.match(paymentError({ ...inv, status: 'CANCELLED' }, 10, 'CHECK'), /cancelled/);
  assert.match(paymentError({ ...inv, kind: 'CREDIT' }, 10, 'CHECK'), /credit memo/);
  assert.match(paymentError({ ...inv, status: 'PAID', paidAmount: 100 }, 1, 'CHECK'), /Only 0.00/);
});
