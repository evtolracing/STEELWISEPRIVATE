import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roundedArgs, roundTo, exact } from '../src/lib/moneyColumns.js';

test('an amount with floating-point residue is saved to the cent, as an exact decimal', () => {
  const tax = 18.77 - 9.39; // 9.379999999999999 in JavaScript
  assert.notEqual(tax, 9.38);
  const out = roundedArgs('Invoice', 'create', { data: { subtotal: 113.75, taxAmount: tax, freightAmount: 0, totalAmount: 113.75 + tax } });
  assert.equal(out.data.taxAmount, '9.38');
  assert.equal(out.data.totalAmount, '123.13');
  assert.equal(out.data.subtotal, '113.75');
});

test('half a cent rounds up, including the values that binary arithmetic stores just below the half', () => {
  assert.equal(roundTo(1.005, 2), 1.01);
  assert.equal(roundTo(2.675, 2), 2.68);
  assert.equal(roundTo(-1.005, 2), -1.01);
  assert.equal(roundTo(0.1 + 0.2, 2), 0.3);
});

test('a number bound for any decimal column is sent as the decimal a person would write', () => {
  assert.equal(exact(9.38), '9.38');
  assert.equal(exact(81.4), '81.4');
  assert.equal(exact(0.0000001), '0.0000001');
  assert.equal(exact(1e21), '1000000000000000000000');
  const out = roundedArgs('OrderLine', 'update', { where: { id: 'x' }, data: { unitPrice: 0.8125, extendedPrice: 64.90000000000001, qtyOrdered: 2550 } });
  assert.equal(out.data.unitPrice, '0.8125'); // a price keeps its places
  assert.equal(out.data.extendedPrice, '64.9'); // an amount goes to the cent
  assert.equal(out.data.qtyOrdered, '2550');
  assert.equal(roundedArgs('Coil', 'create', { data: { netWeightLb: 1234.56, coilNumber: 'C-1' } }).data.netWeightLb, '1234.56');
});

test('lines written inside an order or an invoice are covered too', () => {
  const out = roundedArgs('Order', 'create', { data: { subtotal: 64.90000000000001, lines: { create: [{ extendedPrice: 64.90000000000001, unitPrice: 6.49 }] } } });
  assert.equal(out.data.subtotal, '64.9');
  assert.equal(out.data.lines.create[0].extendedPrice, '64.9');
  assert.equal(out.data.lines.create[0].unitPrice, '6.49');
  const inv = roundedArgs('Invoice', 'update', { where: { id: 'i' }, data: { payments: { create: { amount: 0.1 + 0.2 } }, lines: { createMany: { data: [{ extendedPrice: 1.0000000000001 }] } } } });
  assert.equal(inv.data.payments.create.amount, '0.3');
  assert.equal(inv.data.lines.createMany.data[0].extendedPrice, '1');
});

test('database-side arithmetic is made exact on the number sent; exact values are left alone', () => {
  const out = roundedArgs('Invoice', 'updateMany', { where: {}, data: { paidAmount: { increment: 0.1 + 0.2 } } });
  assert.deepEqual(out.data.paidAmount, { increment: '0.3' });
  const already = { data: { totalAmount: '9.380000000000001' } };
  assert.equal(roundedArgs('Invoice', 'create', already), already);
});

test('reads, and rows with nothing to change, pass through as the same object', () => {
  const read = { where: { totalAmount: 9.380000000000001 } };
  assert.equal(roundedArgs('Invoice', 'findMany', read), read);
  const noDecimals = { data: { notes: 'x', status: 'SENT' } };
  assert.equal(roundedArgs('Invoice', 'update', noDecimals), noDecimals);
  const other = { data: { name: 'Detroit' } };
  assert.equal(roundedArgs('Location', 'create', other), other);
});
