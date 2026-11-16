import test from 'node:test';
import assert from 'node:assert/strict';
import {
  totals, cents, valueOf, usableCost, invoiceIssued, creditIssued, paymentReceived, refundPaid, reliefValue, stockReceived, stockShipped,
  returnRestocked, stockScrapped, adjustmentKey, stockAdjusted, pieceCut, workOrderCompleted, transferShipped, transferReceived, costChanged,
  reversedLines, manualLines, periodOf, dayIn, isTimeZone, LedgerRuleError, PROPOSED_ACCOUNTS, PROPOSED_MAPPING, normalSideOf, inventoryKey, tablesMissing,
} from '../src/lib/ledgerRules.js';
import { movementKind } from '../src/services/ledger.js';

const net = (build) => { const out = {}; for (const l of build.lines) { const k = l.key || l.code; out[k] = +((out[k] || 0) + (l.side === 'D' ? 1 : -1) * Number(l.amount)).toFixed(2); } return out; };
const balanced = (build) => totals(build.lines).ok;
const held = (fn, pattern) => assert.throws(fn, (e) => e instanceof LedgerRuleError && e.hold === true && pattern.test(e.message));
const failed = (fn, pattern) => assert.throws(fn, (e) => e instanceof LedgerRuleError && e.hold === false && pattern.test(e.message));
const item = { coilId: 'c1', number: 'RC-1', productId: 'p1', division: 'METALS' };
const piece = { coilId: 'c2', number: 'RC-1-A', isWorkOrderOutput: true };

test('every proposed account has a type, a normal side and a unique code; every mapping points at a proposed account', () => {
  const codes = PROPOSED_ACCOUNTS.map((a) => a.code);
  assert.equal(new Set(codes).size, codes.length);
  for (const a of PROPOSED_ACCOUNTS) assert.ok(['DEBIT', 'CREDIT'].includes(normalSideOf(a.type)) && a.name.length > 3);
  for (const [key, [code]] of Object.entries(PROPOSED_MAPPING)) assert.ok(codes.includes(code), `${key} -> ${code}`);
  assert.equal(normalSideOf('CONTRA_REVENUE'), 'DEBIT');
  assert.equal(normalSideOf('REVENUE'), 'CREDIT');
});

test('totals: an entry is good only with two or more lines, equal sides and more than zero', () => {
  const l = (side, amount) => ({ side, amount: cents(amount) });
  assert.equal(totals([l('D', 10), l('C', 10)]).ok, true);
  assert.match(totals([l('D', 10), l('C', 9.99)]).why, /debits 10.00 do not equal credits 9.99/);
  assert.match(totals([l('D', 10)]).why, /fewer than two lines/);
  assert.match(totals([l('D', 0), l('C', 0)]).why, /nothing to post/);
  assert.match(totals([l('D', -1), l('C', -1)]).why, /negative/);
  assert.match(totals([l('X', 1), l('C', 1)]).why, /no side/);
});

test('money is rounded half up to the cent, and a cost of nothing is not a cost of zero', () => {
  assert.equal(cents('1.005').toFixed(2), '1.01');
  assert.equal(cents('2.675').toFixed(2), '2.68');
  assert.equal(valueOf('333.3333', '0.4175').toFixed(2), '139.17');
  assert.equal(usableCost(null), null);
  assert.equal(usableCost(''), null);
  assert.equal(usableCost('-1'), null);
  assert.equal(usableCost('abc'), null);
  assert.equal(usableCost(0).toFixed(2), '0.00');
});

test('an invoice debits receivables for the total and credits revenue by line, freight and tax by state', () => {
  const b = invoiceIssued({ invoice: { number: 'INV-1', subtotal: 600, tax: 36, freight: 50, total: 686, lines: [{ amount: 400, productId: 'p1', division: 'METALS' }, { amount: 200, productId: 'p2', division: 'PLASTICS' }] }, customerId: 'cu', locationId: 'L1', state: 'MI' });
  assert.deepEqual(net(b), { RECEIVABLES: 686, REVENUE_PRODUCT: -600, REVENUE_FREIGHT: -50, SALES_TAX_PAYABLE: -36 });
  assert.ok(balanced(b));
  assert.equal(b.lines.filter((l) => l.key === 'REVENUE_PRODUCT').length, 2);
  assert.equal(b.lines.find((l) => l.key === 'SALES_TAX_PAYABLE').jurisdiction, 'MI');
  assert.ok(b.lines.every((l) => l.locationId === 'L1' && l.customerId === 'cu'));
  assert.equal(b.lines.find((l) => l.productId === 'p2').division, 'PLASTICS');
});

test('an invoice with no tax and no freight has no zero lines; a zero invoice posts nothing; lines that do not add up are refused', () => {
  const b = invoiceIssued({ invoice: { number: 'INV-2', subtotal: 100, tax: 0, freight: 0, total: 100, lines: [{ amount: 100 }] }, customerId: 'cu', locationId: 'L1' });
  assert.equal(b.lines.length, 2);
  assert.match(invoiceIssued({ invoice: { number: 'INV-3', subtotal: 0, tax: 0, freight: 0, total: 0, lines: [] } }).nothing, /zero/);
  failed(() => invoiceIssued({ invoice: { number: 'INV-4', subtotal: 100, tax: 0, freight: 0, total: 100, lines: [{ amount: 99 }] } }), /lines add up to 99.00 and its subtotal is 100.00/);
  failed(() => invoiceIssued({ invoice: { number: 'INV-5', subtotal: -5, tax: 0, freight: 0, total: -5, lines: [{ amount: -5 }] } }), /negative total/);
});

test('a credit memo is the invoice the other way round, against returns and allowances, not revenue', () => {
  const b = creditIssued({ credit: { number: 'CM-1', ofInvoice: 'INV-1', subtotal: 100, tax: 6, freight: 10, total: 116, lines: [{ amount: 100, productId: 'p1' }] }, customerId: 'cu', locationId: 'L1', state: 'MI' });
  assert.deepEqual(net(b), { SALES_RETURNS: 100, REVENUE_FREIGHT: 10, SALES_TAX_PAYABLE: 6, RECEIVABLES: -116 });
  assert.ok(balanced(b));
  assert.match(b.memo, /CM-1 against INV-1/);
  assert.ok(!b.lines.some((l) => l.key === 'REVENUE_PRODUCT'));
});

test('a payment moves receivables to cash clearing; a credit applied is not a payment; a refund is the reverse', () => {
  assert.deepEqual(net(paymentReceived({ amount: 50, method: 'CHECK', invoiceNumber: 'INV-1' })), { CASH_CLEARING: 50, RECEIVABLES: -50 });
  assert.match(paymentReceived({ amount: 50, method: 'credit', invoiceNumber: 'INV-1' }).nothing, /credit memo's own entry/);
  failed(() => paymentReceived({ amount: 0, method: 'CASH', invoiceNumber: 'INV-1' }), /more than zero/);
  failed(() => paymentReceived({ amount: -5, method: 'CASH', invoiceNumber: 'INV-1' }), /more than zero/);
  assert.deepEqual(net(refundPaid({ amount: 20, method: 'CHECK', creditNumber: 'CM-1' })), { RECEIVABLES: 20, CASH_CLEARING: -20 });
  failed(() => refundPaid({ amount: 0, creditNumber: 'CM-1' }), /more than zero/);
});

test('a receipt against a purchase order values the item at its cost against payables clearing', () => {
  const b = stockReceived({ item, qty: 1000, unitCost: 0.42, locationId: 'L1', supplierId: 's1', purchaseOrder: 'PO-1' });
  assert.deepEqual(net(b), { INVENTORY_RAW: 420, PAYABLES_CLEARING: -420 });
  assert.equal(b.lines[1].supplierId, 's1');
  assert.equal(b.lines[0].coilId, 'c1');
});

test('a receipt with no purchase order is held; an accountant may name the other account; the rule never picks one', () => {
  held(() => stockReceived({ item, qty: 10, unitCost: 1, locationId: 'L1' }), /no purchase order/);
  const b = stockReceived({ item, qty: 10, unitCost: 1, locationId: 'L1', offsetCode: '2000' });
  assert.deepEqual(net(b), { INVENTORY_RAW: 10, 2000: -10 });
  assert.match(b.memo, /by an accountant's choice/);
});

test('stock with no cost is held and never valued at zero; a cost of exactly zero posts nothing', () => {
  for (const fn of [
    () => stockReceived({ item, qty: 10, unitCost: null, purchaseOrder: 'PO-1' }), () => stockShipped({ item, qty: 10, unitCost: null }), () => returnRestocked({ item, qty: 1, unitCost: undefined }),
    () => stockScrapped({ item, qty: 1, unitCost: '' }), () => stockAdjusted({ item, qty: 1, unitCost: null, up: true, reason: 'COUNT' }), () => transferShipped({ item, qty: 1, unitCost: null, sameOwner: true, number: 'T-1' }),
    () => transferReceived({ item, qty: 1, unitCost: null, sameOwner: true, number: 'T-1' }), () => pieceCut({ parent: item, child: piece, qty: 1, unitCost: null }), () => workOrderCompleted({ number: 'WO-1', source: item, pieces: [], scrapQty: 0, unitCost: null }),
  ]) held(fn, /No cost is on file/);
  assert.match(stockShipped({ item, qty: 10, unitCost: 0 }).nothing, /zero/);
  assert.match(stockReceived({ item, qty: 10, unitCost: 0, purchaseOrder: 'PO-1' }).nothing, /zero/);
});

test('shipping material expenses its cost; finished pieces come out of finished goods', () => {
  assert.deepEqual(net(stockShipped({ item, qty: 500, unitCost: 0.4, locationId: 'L1', customerId: 'cu' })), { COGS_MATERIAL: 200, INVENTORY_RAW: -200 });
  assert.deepEqual(net(stockShipped({ item: piece, qty: 500, unitCost: 0.4 })), { COGS_MATERIAL: 200, INVENTORY_FINISHED: -200 });
  assert.equal(inventoryKey(piece), 'INVENTORY_FINISHED');
  assert.deepEqual(net(returnRestocked({ item, qty: 100, unitCost: 0.4 })), { INVENTORY_RAW: 40, COGS_MATERIAL: -40 });
});

test('an item relieved in parts ends at zero: the last movement takes the cents left, and only cents', () => {
  // 1000.5 at 0.3333 is 333.47; three shipments of 333.5 are 111.16 each, 333.48 in all.
  assert.deepEqual(reliefValue({ qty: 333.5, unitCost: 0.3333, onHandAfter: 333.5, booked: 222.31 }), { value: cents(111.16), rounding: cents(0) });
  const last = reliefValue({ qty: 333.5, unitCost: 0.3333, onHandAfter: 0, booked: 111.15 });
  assert.equal(last.rounding.toFixed(2), '-0.01');
  const b = stockShipped({ item, qty: 333.5, unitCost: 0.3333, onHandAfter: 0, booked: 111.15 });
  assert.ok(balanced(b));
  assert.deepEqual(net(b), { COGS_MATERIAL: 111.16, INVENTORY_RAW: -111.15, ROUNDING: -0.01 });
  // A difference of more than five cents is not rounding and is left for the reconciliation to show.
  assert.equal(reliefValue({ qty: 10, unitCost: 1, onHandAfter: 0, booked: 12 }).rounding.toFixed(2), '0.00');
  assert.equal(reliefValue({ qty: 10, unitCost: 1, onHandAfter: 0, booked: null }).rounding.toFixed(2), '0.00');
});

test('a stock correction goes to count variance or to scrap by its reason; an unknown reason is held', () => {
  assert.equal(adjustmentKey('COUNT_UP'), 'COUNT_VARIANCE');
  assert.equal(adjustmentKey('damage'), 'SCRAP_WRITEOFF');
  assert.equal(adjustmentKey('TRANSFER_SHORT_DOWN'), 'SCRAP_WRITEOFF');
  assert.equal(adjustmentKey('BECAUSE'), null);
  assert.deepEqual(net(stockAdjusted({ item, qty: 10, unitCost: 2, up: true, reason: 'COUNT_UP' })), { INVENTORY_RAW: 20, COUNT_VARIANCE: -20 });
  assert.deepEqual(net(stockAdjusted({ item, qty: 10, unitCost: 2, up: false, reason: 'DAMAGE' })), { SCRAP_WRITEOFF: 20, INVENTORY_RAW: -20 });
  held(() => stockAdjusted({ item, qty: 10, unitCost: 2, up: false, reason: 'MISC' }), /no approved rule/);
  assert.deepEqual(net(stockScrapped({ item, qty: 5, unitCost: 2 })), { SCRAP_WRITEOFF: 10, INVENTORY_RAW: -10 });
});

test('a work order moves the source\'s cost to its pieces and expenses the scrap; no labor or machine cost is posted', () => {
  const b = workOrderCompleted({ number: 'WO-1', source: item, pieces: [{ ...piece, qty: 600 }, { coilId: 'c3', number: 'RC-1-B', qty: 300 }], scrapQty: 100, unitCost: 0.5, locationId: 'L1' });
  assert.deepEqual(net(b), { INVENTORY_FINISHED: 450, SCRAP_WRITEOFF: 50, INVENTORY_RAW: -500 });
  assert.ok(balanced(b));
  assert.deepEqual(Object.keys(net(b)).sort(), ['INVENTORY_FINISHED', 'INVENTORY_RAW', 'SCRAP_WRITEOFF']);
  assert.equal(b.lines.filter((l) => l.key === 'INVENTORY_FINISHED').length, 2);
});

test('through work in progress the same entry passes the material through that account and leaves nothing in it', () => {
  const b = workOrderCompleted({ number: 'WO-2', source: item, pieces: [{ ...piece, qty: 900 }], scrapQty: 100, unitCost: 0.5, throughWip: true });
  const n = net(b);
  assert.equal(n.WORK_IN_PROGRESS, 0);
  assert.equal(n.INVENTORY_FINISHED, 450); assert.equal(n.SCRAP_WRITEOFF, 50); assert.equal(n.INVENTORY_RAW, -500);
  assert.ok(balanced(b));
});

test('a work order balances whatever the rounding, and a piece whose own cost is missing or different is held', () => {
  const b = workOrderCompleted({ number: 'WO-3', source: item, pieces: [{ ...piece, qty: 333.33 }, { coilId: 'c3', number: 'B', qty: 333.33 }, { coilId: 'c4', number: 'C', qty: 333.34 }], scrapQty: 0.123, unitCost: 0.3337 });
  assert.ok(balanced(b));
  held(() => workOrderCompleted({ number: 'WO-4', source: item, pieces: [{ ...piece, qty: 10, unitCost: null }], scrapQty: 0, unitCost: 1 }), /has no cost on file/);
  held(() => workOrderCompleted({ number: 'WO-5', source: item, pieces: [{ ...piece, qty: 10, unitCost: 2 }], scrapQty: 0, unitCost: 1 }), /A person has to decide/);
  assert.match(workOrderCompleted({ number: 'WO-6', source: item, pieces: [], scrapQty: 0, unitCost: 1 }).nothing, /zero/);
});

test('a transfer between branches of one owner moves stock to in-transit and back; it is never a sale', () => {
  const out = transferShipped({ item, qty: 1000, unitCost: 0.4, fromLocationId: 'L1', sameOwner: true, number: 'T-1' });
  assert.deepEqual(net(out), { INVENTORY_IN_TRANSIT: 400, INVENTORY_RAW: -400 });
  const inn = transferReceived({ item, qty: 1000, unitCost: 0.4, fromLocationId: 'L1', toLocationId: 'L2', sameOwner: true, number: 'T-1' });
  assert.deepEqual(net(inn), { INVENTORY_RAW: 400, INVENTORY_IN_TRANSIT: -400 });
  assert.equal(inn.lines[0].locationId, 'L2'); assert.equal(inn.lines[1].locationId, 'L1');
  for (const b of [out, inn]) assert.ok(!b.lines.some((l) => /REVENUE|COGS|RECEIVABLES/.test(l.key)));
});

test('a transfer between different owners has no approved rule and is held, both ways', () => {
  held(() => transferShipped({ item, qty: 1, unitCost: 1, sameOwner: false, number: 'T-2' }), /no approved intercompany rule/);
  held(() => transferReceived({ item, qty: 1, unitCost: 1, sameOwner: false, number: 'T-2' }), /no approved intercompany rule/);
});

test('a cost change revalues what is on hand; a first cost on an opening item comes on against opening equity', () => {
  assert.deepEqual(net(costChanged({ item, qtyOnHand: 1000, oldCost: 0.4, newCost: 0.46 })), { INVENTORY_RAW: 60, COST_ADJUSTMENT: -60 });
  assert.deepEqual(net(costChanged({ item, qtyOnHand: 1000, oldCost: 0.4, newCost: 0.31 })), { COST_ADJUSTMENT: 90, INVENTORY_RAW: -90 });
  assert.deepEqual(net(costChanged({ item, qtyOnHand: 1500, oldCost: null, newCost: 0.3, neverValued: true })), { INVENTORY_RAW: 450, OPENING_EQUITY: -450 });
  assert.match(costChanged({ item, qtyOnHand: 1500, oldCost: null, newCost: 0.3 }).nothing, /own events carry its value/);
  assert.match(costChanged({ item, qtyOnHand: 0, oldCost: 1, newCost: 2 }).nothing, /did not change/);
  held(() => costChanged({ item, qtyOnHand: 10, oldCost: 1, newCost: null }), /cost of item RC-1 was removed/);
});

test('a reversal is the same lines with the sides swapped', () => {
  const b = invoiceIssued({ invoice: { number: 'INV-9', subtotal: 100, tax: 6, freight: 0, total: 106, lines: [{ amount: 100 }] }, state: 'OH' });
  const r = reversedLines(b.lines);
  assert.deepEqual(net({ lines: r }), { RECEIVABLES: -106, REVENUE_PRODUCT: 100, SALES_TAX_PAYABLE: 6 });
  assert.equal(r.find((l) => l.key === 'SALES_TAX_PAYABLE').jurisdiction, 'OH');
  assert.ok(totals(r).ok);
});

test('a manual entry is refused unless it has two lines, one side per line, whole cents, an account and equal sides', () => {
  const ok = manualLines([{ accountCode: ' 5100 ', debit: '12.34', jurisdiction: 'mi' }, { accountCode: '2200', credit: 12.34 }]);
  assert.equal(ok[0].accountCode, '5100'); assert.equal(ok[0].side, 'D'); assert.equal(ok[0].jurisdiction, 'MI'); assert.equal(ok[1].side, 'C');
  const bad = (lines, pattern) => failed(() => manualLines(lines), pattern);
  bad('abc', /at least two lines/);
  bad([{ accountCode: '5100', debit: 1 }], /at least two lines/);
  bad([{ accountCode: '5100', debit: 1 }, { accountCode: '2200', credit: 2 }], /does not balance/);
  bad([{ accountCode: '5100', debit: 1, credit: 1 }, { accountCode: '2200', credit: 1 }], /not both and not neither/);
  bad([{ accountCode: '5100' }, { accountCode: '2200', credit: 1 }], /not both and not neither/);
  bad([{ accountCode: '5100', debit: -1 }, { accountCode: '2200', credit: -1 }], /zero or more/);
  bad([{ accountCode: '5100', debit: 1.005 }, { accountCode: '2200', credit: 1.005 }], /fractions of a cent/);
  bad([{ accountCode: '', debit: 1 }, { accountCode: '2200', credit: 1 }], /an account is required/);
  bad([{ accountCode: '5100', debit: 'abc' }, { accountCode: '2200', credit: 1 }], /zero or more/);
  bad([{ accountCode: '5100', debit: '1e30' }, { accountCode: '2200', credit: '1e30' }], /too large/);
  bad([{ accountCode: '5100', debit: 'Infinity' }, { accountCode: '2200', credit: 'Infinity' }], /too large/);
  bad([null, null], /not both and not neither/);
  bad(Array.from({ length: 201 }, () => ({ accountCode: '5100', debit: 1 })), /at most 200 lines/);
});

test('a month is the calendar month; a day is counted in the time zone the books are kept in', () => {
  const p = periodOf('2026-02-14T10:00:00Z');
  assert.deepEqual([p.year, p.month, p.startsOn.toISOString().slice(0, 10), p.endsOn.toISOString().slice(0, 10)], [2026, 2, '2026-02-01', '2026-02-28']);
  assert.equal(periodOf('2028-02-29T00:00:00Z').endsOn.toISOString().slice(0, 10), '2028-02-29');
  failed(() => periodOf('nonsense'), /not valid/);
  // 02:30 UTC on the first of the month is still the last day of the month before in Detroit.
  assert.equal(dayIn('2026-11-01T02:30:00Z', 'America/Detroit').toISOString().slice(0, 10), '2026-10-31');
  assert.equal(dayIn('2026-11-01T02:30:00Z', 'UTC').toISOString().slice(0, 10), '2026-11-01');
  assert.equal(dayIn('2026-11-01T02:30:00Z').toISOString().slice(0, 10), '2026-11-01');
  assert.equal(isTimeZone('America/Detroit'), true);
  assert.equal(isTimeZone('Mars/Phobos'), false);
  assert.equal(isTimeZone(''), false);
});

test('each kind of stock movement falls under one rule; a work order\'s own movements are covered by its entry', () => {
  assert.equal(movementKind({ movementType: 'SHIP' }), 'STOCK_SHIPPED');
  assert.equal(movementKind({ movementType: 'RECEIVE', reasonCode: 'RECEIPT' }), 'STOCK_RECEIVED');
  assert.equal(movementKind({ movementType: 'RECEIVE', reasonCode: 'CUSTOMER_RETURN' }), 'RETURN_RESTOCKED');
  assert.equal(movementKind({ movementType: 'RECEIVE', reasonCode: 'counter_void' }), 'RETURN_RESTOCKED');
  assert.equal(movementKind({ movementType: 'RECEIVE', reasonCode: 'CUT_PIECE' }), 'PIECE_CUT');
  assert.equal(movementKind({ movementType: 'CONSUME', reasonCode: 'CUT_PIECE' }), null);
  assert.equal(movementKind({ movementType: 'SCRAP' }), 'STOCK_SCRAPPED');
  assert.equal(movementKind({ movementType: 'ADJUST', reasonCode: 'COUNT_UP' }), 'STOCK_ADJUSTED');
  assert.equal(movementKind({ movementType: 'TRANSFER', reasonCode: 'TRANSFER_RECEIVED' }), 'TRANSFER_RECEIVED');
  assert.equal(movementKind({ movementType: 'PROCESS', reasonCode: 'WORK_ORDER' }), null);
  assert.equal(movementKind({ movementType: 'SCRAP', reasonCode: 'WORK_ORDER' }), null);
  assert.equal(movementKind({ movementType: 'SOMETHING_NEW' }), 'STOCK_OTHER');
});

test('a missing ledger table is told apart from every other database error (the code can be deployed before database update 16)', () => {
  assert.equal(tablesMissing({ code: 'P2021', message: 'The table `public.LedgerAccount` does not exist in the current database.' }), true);
  assert.equal(tablesMissing({ code: 'P2010', meta: { code: '42P01', message: 'relation "JournalLine" does not exist' } }), true);
  assert.equal(tablesMissing(new Error('Raw query failed. Code: `42P01`. Message: `relation "JournalEntry" does not exist`')), true);
  assert.equal(tablesMissing({ code: 'P2002' }), false);
  assert.equal(tablesMissing(new Error('relation "Invoice" does not exist')), false);
  assert.equal(tablesMissing(null), false);
});
