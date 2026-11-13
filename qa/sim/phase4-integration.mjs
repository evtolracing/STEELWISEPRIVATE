// Phase 4 integration scenarios: API contracts, communication between modules, events and
// their delivery, outside services failing, repeats and races, and isolation and recovery.
// Every scenario drives the real server, makes something go wrong where that is the point, and
// then reads the database to check what was saved, what was not, and that nothing was doubled.
//   node qa/sim/phase4-integration.mjs [--base http://localhost:3011] [--only 3]
// Runs only against a local QA database (lib.mjs refuses anything else). Outside services are
// a stand-in started here; the QA server is started with every provider address pointing at it.
import fs from 'node:fs';
import {
  arg, BASE, STUB, prisma, A, run, num, ok2, sleep, tag, scenario, http1, raw, tokenOf, sendAndHangUp,
  startStub, stopStub, setMode, hitsOf, clearHits, hookUrl, partner, partnerCall, subscribe, deliveriesOf, runTasks, makeDue, until, hmac,
  world, blocks, finish, TASKS_SECRET, stub, tried, QA_PASSWORD,
} from './phase4-lib.mjs';

const OUT = arg('out', 'qa/results/phase4-integration.json');
const ONLY = arg('only', '').split(',').filter(Boolean);
const want = (n) => !ONLY.length || ONLY.includes(String(n));

await startStub();
const T0 = new Date(Date.now() - 2000).toISOString(); // records made by this run are newer than this
const w = await world();
const B = blocks(w);
const { custA, custB, custC, L1, L2, carrierOrg, carrierOrg2, supplierOrg, supplierOrg2 } = w;
// Partner accounts used across the groups.
const PA = await partner(custA, 'CUSTOMER');
const PB = await partner(custB, 'CUSTOMER');
const PCAR = await partner(carrierOrg, 'CARRIER');
const PCAR2 = await partner(carrierOrg2, 'CARRIER');
const PSUP = await partner(supplierOrg, 'SUPPLIER');
const PSUP2 = await partner(supplierOrg2, 'SUPPLIER');
const errShape = (r) => typeof r.body?.error?.code === 'string' && typeof r.body?.error?.message === 'string';
const plain = (text) => !/prisma|Invalid `|constraint|relation "|column "|node_modules|\n\s+at /i.test(String(text));

// ══ 1. Internal API contracts and validation ═════════════════════════════════════════════
const G1 = 'Internal API contracts and validation';
if (want(1)) {
  const adminTok = await tokenOf('admin');
  const get = (url, who = 'admin') => raw('GET', url, undefined, who);

  await scenario(G1, 'every critical list answers in its documented shape, with the fields the screens read', async (ok) => {
    // [address, body kind, fields each row must have]
    const LISTS = [
      ['/api/orders', 'array', ['id', 'orderNumber', 'status', 'orderType', 'totalAmount', 'lines', 'buyer']],
      ['/api/inventory', 'array', ['id', 'coilId', 'qtyOnHand', 'qtyAvailable', 'qtyAllocated', 'coil', 'location']],
      ['/api/shipments', 'array', ['id', 'shipmentNumber', 'status', 'orderId']],
      ['/api/coils', 'array', ['id', 'coilNumber', 'status']],
      ['/api/jobs', 'array', ['id', 'jobNumber', 'status']],
      ['/api/work-centers', 'array', ['id', 'code', 'name']],
      ['/api/invoices', 'data+meta', ['id', 'invoiceNumber', 'status', 'totalAmount', 'paidAmount']],
      ['/api/customers', 'data+meta', ['id', 'code', 'name']],
      ['/api/quotes', 'data+meta', ['id', 'quoteNumber', 'status']],
      ['/api/rfqs', 'data+meta', ['id', 'rfqNumber', 'status']],
      ['/api/returns', 'data+meta', []],
    ];
    for (const [url, kind, fields] of LISTS) {
      const r = await get(url);
      const rows = kind === 'array' ? r.body : r.body?.data;
      ok(`${url}: 200 and ${kind === 'array' ? 'a list' : '{ data, meta }'}`, r.status === 200 && Array.isArray(rows) && (kind === 'array' || typeof r.body.meta === 'object'), `${r.status} ${JSON.stringify(r.body).slice(0, 100)}`);
      if (rows?.length && fields.length) ok(`${url}: rows carry ${fields.join(', ')}`, fields.every((f) => f in rows[0]), fields.filter((f) => !(f in rows[0])).join());
      ok(`${url}: answers as JSON`, /application\/json/.test(r.headers.get('content-type') || ''));
    }
  });

  await scenario(G1, 'a bare-array list can be windowed without changing its body, and says how many there are', async (ok) => {
    const all = await get('/api/orders');
    ok('with no parameters the answer is what it always was: a list, no more than 100', Array.isArray(all.body) && all.body.length <= 100 && all.headers.get('x-limit') === '100');
    const five = await get('/api/orders?limit=5');
    const total = Number(five.headers.get('x-total-count'));
    ok('limit=5 returns five', five.body.length === 5, five.body.length);
    ok('the total is in a header and matches the database for this login', total === await prisma.order.count(), `${total} vs ${await prisma.order.count()}`);
    const next = await get('/api/orders?limit=5&offset=5');
    ok('offset moves the window with no overlap', next.body.length === 5 && !next.body.some((o) => five.body.some((f) => f.id === o.id)));
    ok('a limit over the maximum is cut to the maximum, not refused', (await get('/api/orders?limit=5000')).body.length <= 100);
    const sum = await get('/api/orders?limit=50&view=summary&orderType=SO');
    const full = await get('/api/orders?limit=50&orderType=SO');
    ok('view=summary carries the header, the customer and a line count, and no lines', sum.body.length === 50 && sum.body[0].lineCount >= 0 && sum.body[0].buyer?.name && !('lines' in sum.body[0]), JSON.stringify(sum.body[0]).slice(0, 200));
    ok('the summary is the same orders in the same order', sum.body.map((o) => o.id).join() === full.body.map((o) => o.id).join());
    ok(`and is less than half the size (${sum.raw.length} against ${full.raw.length} bytes)`, sum.raw.length < full.raw.length / 2);
    ok('an unknown view is refused', (await get('/api/orders?view=everything')).status === 400);
    const inv = await get('/api/inventory?limit=3&offset=1');
    ok('stock windows the same way', inv.body.length === 3 && Number(inv.headers.get('x-total-count')) >= 4 && inv.headers.get('x-offset') === '1');
    const branch = await get('/api/orders?limit=5', 'branchB');
    ok("a branch login's total counts only its own branch", Number(branch.headers.get('x-total-count')) === await prisma.order.count({ where: { locationId: L2.id } }), `${branch.headers.get('x-total-count')} vs ${await prisma.order.count({ where: { locationId: L2.id } })}`);
  });

  await scenario(G1, 'every kind of refusal has the same shape: a status and a plain sentence', async (ok) => {
    const noToken = await http1('GET', '/api/orders');
    ok('no token: 401 { error }', noToken.status === 401 && typeof noToken.body.error === 'string');
    const badToken = await http1('GET', '/api/orders', { token: 'not.a.token' });
    ok('a bad token: 401', badToken.status === 401 && typeof badToken.body.error === 'string');
    const forbidden = await get('/api/admin/integrations', 'operator');
    ok('not allowed: 403 { error }', forbidden.status === 403 && typeof forbidden.body.error === 'string');
    const missing = await get('/api/orders/00000000-0000-4000-8000-000000000000');
    ok('not found: 404 { error }', missing.status === 404 && typeof missing.body.error === 'string');
    const notId = await get('/api/orders/not-an-id');
    ok('an id that is not an id: 404 or 400, never 500', [400, 404].includes(notId.status), notId.status);
    const noRoute = await get('/api/this-route-does-not-exist');
    ok('an address that does not exist: 404', noRoute.status === 404, noRoute.status);
    const broken = await http1('POST', '/api/orders', { body: '{"orderType": "SO",', headers: { 'content-type': 'application/json' }, token: adminTok });
    ok('a body that is not JSON: 400 { error }', broken.status === 400 && /JSON/i.test(broken.body.error), `${broken.status} ${JSON.stringify(broken.body)}`);
    const huge = await http1('POST', '/api/orders', { body: JSON.stringify({ notes: 'x'.repeat(12 * 1024 * 1024) }), headers: { 'content-type': 'application/json' }, token: adminTok });
    ok('a body that is too large: 413', huge.status === 413, huge.status);
    const paging = await get('/api/orders?limit=abc');
    ok('a paging value that is not a number: 400', paging.status === 400 && typeof paging.body.error === 'string');
    const filter = await get('/api/orders?status=NOT_A_STATUS');
    ok('a filter value that does not exist: 400', filter.status === 400, filter.status);
    for (const r of [noToken, badToken, forbidden, missing, notId, broken, paging, filter]) ok(`${r.status}: nothing internal in the message`, plain(r.raw), r.raw.slice(0, 150));
  });

  await scenario(G1, 'a change the database itself refuses is answered 409 with a reason, not a server error', async (ok) => {
    // A route that does not check a reference before saving: a new login with a home branch that does not exist.
    const email = `qa-ghost-${run.toLowerCase()}@qa.test`;
    const r = await A.post('/api/users', { email, firstName: 'QA', lastName: 'Ghost', role: 'CSR', password: QA_PASSWORD, homeLocationId: '00000000-0000-4000-8000-000000000000' });
    ok('the answer is 409 with the code RULE_REFUSED', r.status === 409 && r.body?.code === 'RULE_REFUSED', `${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
    ok('the reason is a sentence and names no table, column or constraint', typeof r.body?.error === 'string' && r.body.error.length > 20 && !/constraint|prisma|relation|column|User_|fkey/i.test(r.body.error), r.body?.error);
    ok('it carries the request id so the detail can be found in the log', typeof r.body?.requestId === 'string' && r.body.requestId.length > 10);
    ok('nothing was saved', (await prisma.user.count({ where: { email } })) === 0);
  });

  await scenario(G1, 'an order with bad values is refused with a reason and nothing is saved', async (ok) => {
    const before = await prisma.order.count();
    const good = B.orderBody([B.line(100)]);
    const BAD = [
      ['a negative quantity', { ...good, lines: [{ ...good.lines[0], qtyOrdered: -5 }] }],
      ['a quantity that is text', { ...good, lines: [{ ...good.lines[0], qtyOrdered: 'many' }] }],
      ['a negative price', { ...good, lines: [{ ...good.lines[0], unitPrice: -1 }] }],
      ['a customer that does not exist', { ...good, buyerId: '00000000-0000-4000-8000-000000000000' }],
      ['an order type that does not exist', { ...good, orderType: 'GIFT' }],
      ['a total that is not a number', { ...good, totalAmount: 'lots' }],
      ['a date that is not a date', { ...good, requiredDate: 'next tuesday-ish' }],
      ['lines that are not a list', { ...good, lines: 'one' }],
      ['an empty body', {}],
    ];
    for (const [what, body] of BAD) {
      const r = await A.post('/api/orders', body, 'csr');
      ok(`${what}: refused with 4xx and a sentence`, r.status >= 400 && r.status < 500 && typeof r.body?.error === 'string' && plain(r.body.error), `${r.status} ${JSON.stringify(r.body).slice(0, 150)}`);
    }
    ok('none of them saved an order', (await prisma.order.count()) === before, (await prisma.order.count()) - before);
    const fine = await A.post('/api/orders', good, 'csr');
    ok('the same order with good values is accepted', fine.status === 201, fine.status);
  });

  await scenario(G1, 'shipments, payments, stock corrections and transfers refuse bad values without a server error', async (ok) => {
    const { order, shipment, coilId } = await B.readyToShip(400);
    await B.dispatch(shipment);
    const [invoice] = await B.invoicesOf(order.id);
    const counts = async () => [await prisma.shipment.count(), await prisma.payment.count(), await prisma.materialMovement.count()].join();
    const before = await counts();
    const CASES = [
      ['a shipment for an order that does not exist', 'POST', '/api/shipments', { orderId: '00000000-0000-4000-8000-000000000000', fromLocationId: L1.id, items: [] }],
      ['a shipment with a negative quantity', 'POST', '/api/shipments', { orderId: order.id, fromLocationId: L1.id, items: [{ orderLineId: order.lines[0].id, qtyShipped: -1 }] }],
      ['a shipment whose items are not a list', 'POST', '/api/shipments', { orderId: order.id, fromLocationId: L1.id, items: 'all of it' }],
      ['a payment of zero', 'POST', `/api/invoices/${invoice.id}/payments`, { amount: 0, paymentMethod: 'CHECK' }],
      ['a payment that is text', 'POST', `/api/invoices/${invoice.id}/payments`, { amount: 'ten', paymentMethod: 'CHECK' }],
      ['a negative payment', 'POST', `/api/invoices/${invoice.id}/payments`, { amount: -50, paymentMethod: 'CHECK' }],
      ['a payment of more than is owed', 'POST', `/api/invoices/${invoice.id}/payments`, { amount: 999999, paymentMethod: 'CHECK' }],
      ['a payment on an invoice that does not exist', 'POST', '/api/invoices/00000000-0000-4000-8000-000000000000/payments', { amount: 5, paymentMethod: 'CHECK' }],
      ['a stock correction with no reason', 'POST', '/api/inventory/adjust', { coilId, countedQty: 10 }],
      ['a stock correction below zero', 'POST', '/api/inventory/adjust', { coilId, countedQty: -3, reason: 'COUNT', notes: 'QA bad value' }],
      ['a transfer to nowhere', 'POST', '/api/inventory/transfer', { coilId }],
      ['a transfer of an item that does not exist', 'POST', '/api/inventory/transfer', { coilId: '00000000-0000-4000-8000-000000000000', toLocationId: L2.id }],
      ['a credit with no reason', 'POST', `/api/invoices/${invoice.id}/credit`, { amount: 5 }],
      ['a delivery signed with a number', 'PUT', `/api/shipments/${shipment.id}/deliver`, { podSignature: 12345 }],
    ];
    for (const [what, method, url, body] of CASES) {
      const r = await raw(method, url, body, 'admin');
      ok(`${what}: 4xx with a sentence`, r.status >= 400 && r.status < 500 && typeof r.body?.error === 'string' && plain(r.body.error), `${r.status} ${JSON.stringify(r.body).slice(0, 150)}`);
    }
    ok('nothing was saved by any of them', (await counts()) === before, `${before} → ${await counts()}`);
  });

  await scenario(G1, 'an edit made from an old copy of an order is refused instead of overwriting', async (ok) => {
    const o = await B.order([B.line(100)], { status: 'DRAFT' });
    const open = await get(`/api/orders/${o.id}`);
    const seenAt = open.body.updatedAt;
    ok('the order carries the time it was last saved', typeof seenAt === 'string');
    // Someone else saves a change.
    const other = await A.put(`/api/orders/${o.id}`, { notes: 'changed by the other person', expectedUpdatedAt: seenAt }, 'admin');
    ok('the first edit, made from the current copy, is saved', other.status === 200 && other.body.notes === 'changed by the other person', `${other.status} ${JSON.stringify(other.body).slice(0, 150)}`);
    const mine = await A.put(`/api/orders/${o.id}`, { notes: 'my change, made from the old copy', expectedUpdatedAt: seenAt }, 'csr');
    ok('the second edit, made from the old copy, is refused', mine.status === 409 && mine.body.code === 'STALE_EDIT', `${mine.status} ${JSON.stringify(mine.body)}`);
    ok('the refusal says when the order was last saved', Date.parse(mine.body.updatedAt) > Date.parse(seenAt));
    const now = await prisma.order.findUnique({ where: { id: o.id } });
    ok("the other person's change is still there", now.notes === 'changed by the other person');
    const retry = await A.put(`/api/orders/${o.id}`, { notes: 'my change, after reloading', expectedUpdatedAt: mine.body.updatedAt }, 'csr');
    ok('after reloading, the edit goes through', retry.status === 200 && retry.body.notes === 'my change, after reloading');
    ok('a date that is not a date is refused', (await A.put(`/api/orders/${o.id}`, { notes: 'x', expectedUpdatedAt: 'yesterday' })).status === 400);
    const legacy = await A.put(`/api/orders/${o.id}`, { notes: 'caller that sends no version' });
    ok('a caller that sends no version behaves as before', legacy.status === 200);
  });

  await scenario(G1, 'two edits of the same order at the same moment: one is saved, one is told to reload', async (ok) => {
    const o = await B.order([B.line(100)], { status: 'DRAFT' });
    const seenAt = o.updatedAt.toISOString();
    const both = await Promise.all(['first', 'second', 'third', 'fourth'].map((n) => A.put(`/api/orders/${o.id}`, { notes: `edit ${n}`, expectedUpdatedAt: seenAt }, 'csr')));
    ok('exactly one is saved', both.filter((r) => r.status === 200).length === 1, both.map((r) => r.status).join());
    ok('the others get 409 and the stale-edit code', both.filter((r) => r.status === 409 && r.body.code === 'STALE_EDIT').length === 3, both.map((r) => `${r.status}:${r.body?.code}`).join());
    const saved = both.find((r) => r.status === 200).body.notes;
    ok('what is on file is the one that was accepted', (await prisma.order.findUnique({ where: { id: o.id } })).notes === saved);
  });

  await scenario(G1, 'the two addresses for jobs and work centers give the same answer', async (ok) => {
    for (const name of ['jobs', 'work-centers']) {
      const a = await get(`/api/${name}`); const b = await get(`/api/v1/${name}`);
      ok(`${name}: same status`, a.status === 200 && b.status === 200);
      ok(`${name}: same rows`, a.body.map((r) => r.id).join() === b.body.map((r) => r.id).join(), `${a.body.length} vs ${b.body.length}`);
      ok(`${name}: same fields`, JSON.stringify(Object.keys(a.body[0] || {}).sort()) === JSON.stringify(Object.keys(b.body[0] || {}).sort()));
      const na = await http1('GET', `/api/${name}`); const nb = await http1('GET', `/api/v1/${name}`);
      ok(`${name}: both refuse a caller with no token`, na.status === 401 && nb.status === 401);
      const ca = await get(`/api/${name}`, 'custA'); const cb = await get(`/api/v1/${name}`, 'custA');
      ok(`${name}: both give a customer login the same answer`, ca.status === cb.status, `${ca.status} vs ${cb.status}`);
    }
  });

  await scenario(G1, 'the partner API keeps one shape for lists, one for errors', async (ok) => {
    const LISTS = [[PA, '/customer/rfqs'], [PA, '/customer/quotes'], [PA, '/customer/orders'], [PA, '/customer/shipments'], [PA, '/customer/invoices'], [PA, '/customer/documents'], [PCAR, '/carrier/shipments'], [PSUP, '/supplier/purchase-orders']];
    for (const [P, path] of LISTS) {
      const r = await P.call('GET', `${path}?limit=2`);
      const p = r.body?.pagination;
      ok(`${path}: { data, pagination }`, r.status === 200 && Array.isArray(r.body.data) && r.body.data.length <= 2 && p && [p.page, p.limit, p.total, p.totalPages].every(Number.isInteger) && p.limit === 2, `${r.status} ${JSON.stringify(r.body).slice(0, 150)}`);
      ok(`${path}: tells the caller its request allowance`, r.headers.get('x-ratelimit-limit') !== null);
    }
    const E = [
      ['no token', await http1('GET', '/api/v1/partner/customer/orders'), 401, 'MISSING_TOKEN'],
      ['a bad token', await partnerCall('junk', 'GET', '/customer/orders'), 401, 'INVALID_TOKEN'],
      ['the wrong kind of partner', await PCAR.call('GET', '/customer/orders'), 403, 'WRONG_PARTNER_TYPE'],
      ['a record that is not theirs', await PA.call('GET', '/customer/orders/00000000-0000-4000-8000-000000000000'), 404, 'NOT_FOUND'],
      ['a bad status filter', await PA.call('GET', '/customer/orders?status=NOPE'), 400, 'VALIDATION_ERROR'],
      ['a bad body', await PA.call('POST', '/customer/rfqs', { items: [] }), 400, 'VALIDATION_ERROR'],
      ['a part that is not built', await PSUP.call('GET', '/supplier/asn'), 501, 'NOT_AVAILABLE'],
      ['a wrong grant type', await http1('POST', '/api/v1/partner/auth/token', { body: { grant_type: 'password', client_id: 'x', client_secret: 'y' } }), 400, 'UNSUPPORTED_GRANT_TYPE'],
    ];
    for (const [what, r, status, code] of E) ok(`${what}: ${status} { error: { code: ${code}, message } }`, r.status === status && r.body?.error?.code === code && typeof r.body.error.message === 'string' && plain(r.body.error.message), `${r.status} ${JSON.stringify(r.body).slice(0, 150)}`);
    const big = await PA.call('GET', '/customer/orders?limit=100000');
    ok('a huge limit is cut to 100', big.body.pagination.limit === 100);
  });

  await scenario(G1, 'fields a caller must not set are ignored or refused, never applied', async (ok) => {
    const o = await B.order([B.line(100)], { status: 'DRAFT' });
    const r = await A.put(`/api/orders/${o.id}`, { notes: 'allowed', id: '00000000-0000-4000-8000-000000000001', orderNumber: 'HACKED-1', createdById: w.users.csr.id, createdAt: '2001-01-01T00:00:00Z', locationId: undefined, orderType: 'PO' }, 'csr');
    const now = await prisma.order.findUnique({ where: { id: o.id } });
    ok('the request did not fail the server', r.status < 500, r.status);
    ok('the order kept its id, number, creator, date and type', now && now.orderNumber === o.orderNumber && now.createdById === o.createdById && now.createdAt.getTime() === o.createdAt.getTime() && now.orderType === 'SO', JSON.stringify({ n: now?.orderNumber, t: now?.orderType }));
    const body = { ...B.orderBody([B.line(100)]), orderNumber: 'HACKED-2', createdById: w.users.admin.id, id: '00000000-0000-4000-8000-000000000002' };
    const c = await A.post('/api/orders', body, 'csr');
    const made = c.status === 201 ? await prisma.order.findUnique({ where: { id: c.body.id } }) : null;
    ok('a new order gets its own number and its real creator', made && made.orderNumber !== 'HACKED-2' && made.createdById === w.users.csr.id && made.id !== body.id, JSON.stringify({ s: c.status, n: made?.orderNumber }));
    const inv = (await prisma.invoice.findFirst({ where: { kind: 'INVOICE', status: { in: ['SENT', 'PARTIAL'] } } }));
    if (inv) {
      const p = await A.post(`/api/invoices/${inv.id}/payments`, { amount: 0.01, paymentMethod: 'CHECK', status: 'PAID', paidAmount: 999999, invoiceId: '00000000-0000-4000-8000-000000000003' }, 'csr');
      const after = await prisma.invoice.findUnique({ where: { id: inv.id } });
      ok('a payment cannot set the invoice status or the amount paid directly', Math.abs(num(after.paidAmount) - (num(inv.paidAmount) + (p.status === 201 ? 0.01 : 0))) < 0.001, `${inv.paidAmount} → ${after.paidAmount}`);
    }
  });
}

// ══ 2. Communication between modules ════════════════════════════════════════════════════
const G2 = 'Cross-module workflow communication';
if (want(2)) {
  await scenario(G2, 'request for quote to payment: every module holds the same facts at the end', async (ok) => {
    const rfq = await A.post('/api/rfqs', { customerId: custA.id, lines: [{ description: `QA plate ${run}`, requestedQty: 1000, unit: 'LB' }] }, 'csr');
    ok('RFQ created', rfq.status === 201, rfq.status);
    const q = await A.post('/api/quotes', { rfqId: rfq.body.id, lines: [{ rfqLineId: rfq.body.lines[0].id, description: `QA plate ${run}`, quantity: 1000, unit: 'LB', unitPrice: 0.8, priceUnit: 'LB' }] }, 'csr');
    ok('quote priced by the server', q.status === 201 && num(q.body.totalAmount) === 800, `${q.status} ${q.body?.totalAmount}`);
    await A.post(`/api/quotes/${q.body.id}/send`, {}, 'csr');
    const acc = await A.post(`/api/quotes/${q.body.id}/accept`, { poReference: tag('PO') }, 'csr');
    ok('accepting makes the order', acc.status === 201 && acc.body.order?.status === 'CONFIRMED', `${acc.status} ${JSON.stringify(acc.body).slice(0, 150)}`);
    const o = await prisma.order.findUnique({ where: { id: acc.body.order.id }, include: { lines: true } });
    ok('sales: the RFQ is closed, the quote points at the order, the order carries the quoted total', (await prisma.rFQ.findUnique({ where: { id: rfq.body.id } })).status === 'ACCEPTED' && (await prisma.quote.findUnique({ where: { id: q.body.id } })).convertedOrderId === o.id && num(o.totalAmount) === 800);
    const coilId = await B.received({ weightLb: 1500 });
    ok('stock reserved', ok2(await B.reserve(o, o.lines[0], coilId, 1000)));
    const s = await B.shipment(o, [[o.lines[0], 1000]]);
    const d = await B.dispatch(s.body);
    ok('dispatched', d.status === 200 && d.body.invoice?.invoiceNumber, `${d.status} ${JSON.stringify(d.body).slice(0, 150)}`);
    const inv = await prisma.inventory.findUnique({ where: { coilId } });
    ok('inventory: 1,000 lb left the item and nothing is reserved', num(inv.qtyOnHand) === 500 && num(inv.qtyAllocated) === 0, JSON.stringify(inv));
    const mv = await prisma.materialMovement.findMany({ where: { coilId, movementType: 'SHIP' } });
    ok('inventory: the movement names the shipment and the order', mv.length === 1 && mv[0].shipmentId === s.body.id && mv[0].orderId === o.id && num(mv[0].qtyMoved) === 1000);
    const line = await prisma.orderLine.findUnique({ where: { id: o.lines[0].id } });
    ok('orders: the line is shipped in full and the order is complete', num(line.qtyShipped) === 1000 && (await prisma.order.findUnique({ where: { id: o.id } })).status === 'COMPLETE');
    const [invoice] = await B.invoicesOf(o.id);
    ok('billing: one invoice for what shipped, at the quoted price', invoice && num(invoice.totalAmount) === 800 && invoice.shipmentId === s.body.id && num(invoice.lines[0].quantity) === 1000);
    const pay = await A.post(`/api/invoices/${invoice.id}/payments`, { amount: 800, paymentMethod: 'CHECK', referenceNumber: tag('CHK') }, 'csr');
    ok('payment recorded', pay.status === 201, `${pay.status} ${JSON.stringify(pay.body).slice(0, 120)}`);
    const paid = await prisma.invoice.findUnique({ where: { id: invoice.id }, include: { payments: true } });
    ok('billing: the invoice is paid and the payments add up to it', paid.status === 'PAID' && num(paid.paidAmount) === 800 && paid.payments.reduce((t, p) => t + num(p.amount), 0) === 800);
    await B.deliver(s.body);
    ok('shipping: delivered with a signature', (await prisma.shipment.findUnique({ where: { id: s.body.id } })).podCaptured === true);
    const history = await prisma.auditLog.findMany({ where: { resourceId: { in: [o.id, s.body.id, invoice.id] } }, select: { eventType: true } });
    const kinds = new Set(history.map((h) => h.eventType));
    ok('history: the shipment moves, the invoice and the payment are each on record', ['SHIPMENT_STATUS_CHANGED', 'INVOICE_ISSUED', 'PAYMENT_RECORDED'].every((k) => kinds.has(k)), [...kinds].join());
    const report = await A.get('/api/admin/integrations');
    ok('reconciliation: this order is not listed as shipped but not invoiced', !report.body.shippedNotInvoiced.orders.some((x) => x.orderId === o.id));
  });

  await scenario(G2, 'a dispatch and everything that follows from it are saved together or not at all', async (ok) => {
    const { order, shipment, coilId } = await B.readyToShip(600);
    // Short by one pound: refused.
    await prisma.orderLineAllocation.updateMany({ where: { orderLineId: order.lines[0].id }, data: { qtyAllocated: 599 } });
    await prisma.inventory.update({ where: { coilId }, data: { qtyAllocated: 599, qtyAvailable: { increment: 1 } } });
    const inv0 = await prisma.inventory.findUnique({ where: { coilId } });
    const d = await B.dispatch(shipment);
    ok('refused, with the line and the shortfall', d.status === 409 && /1 more/.test(d.body.error), `${d.status} ${d.body?.error}`);
    const line = await prisma.orderLine.findUnique({ where: { id: order.lines[0].id } });
    const inv1 = await prisma.inventory.findUnique({ where: { coilId } });
    ok('shipping: the shipment has not left', (await prisma.shipment.findUnique({ where: { id: shipment.id } })).status === 'PENDING');
    ok('orders: nothing counted as shipped', num(line.qtyShipped) === 0 && (await prisma.order.findUnique({ where: { id: order.id } })).status === 'CONFIRMED');
    ok('inventory: balance untouched, no movement', num(inv1.qtyOnHand) === num(inv0.qtyOnHand) && (await prisma.materialMovement.count({ where: { coilId, movementType: 'SHIP' } })) === 0);
    ok('billing: no invoice', (await B.invoicesOf(order.id)).length === 0);
    ok('history: no "left the dock" entry', (await prisma.auditLog.count({ where: { resourceId: shipment.id, eventType: 'SHIPMENT_STATUS_CHANGED', details: { path: ['to'], equals: 'IN_TRANSIT' } } })) === 0);
  });

  await scenario(G2, 'shipping succeeds and billing fails: the gap is said, recorded, reported and closed', async (ok) => {
    const { order, shipment } = await B.readyToShip(250);
    const fn = `qa_fail_${run.toLowerCase()}`;
    // Fault injection on the QA database: any invoice for this one order fails.
    await prisma.$executeRawUnsafe(`CREATE OR REPLACE FUNCTION ${fn}() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'QA injected billing failure'; END; $$ LANGUAGE plpgsql`);
    await prisma.$executeRawUnsafe(`CREATE TRIGGER ${fn}_t BEFORE INSERT ON "Invoice" FOR EACH ROW WHEN (NEW."orderId" = '${order.id}') EXECUTE FUNCTION ${fn}()`);
    try {
      const d = await B.dispatch(shipment);
      ok('the dispatch itself succeeds', d.status === 200 && d.body.status === 'IN_TRANSIT', `${d.status} ${JSON.stringify(d.body).slice(0, 150)}`);
      ok('the answer says plainly that the invoice was not raised', d.body.invoice === null && /invoice could not be raised/.test(d.body.invoiceWarning || ''), JSON.stringify({ i: d.body.invoice, w: d.body.invoiceWarning }));
      ok('the answer does not show the database error', plain(JSON.stringify(d.body)) && !/QA injected/.test(JSON.stringify(d.body)));
      ok('stock and the order moved (the truck has left)', (await prisma.order.findUnique({ where: { id: order.id } })).status === 'COMPLETE');
      const audit = await prisma.auditLog.findFirst({ where: { eventType: 'INVOICE_NOT_RAISED', resourceId: shipment.id } });
      ok('the missing invoice is on record with the reason', audit?.severity === 'ERROR' && audit.details.orderId === order.id);
      const report = await A.get('/api/admin/integrations');
      const listed = report.body.shippedNotInvoiced.orders.find((x) => x.orderId === order.id);
      ok('the integration report lists the order as shipped but not invoiced', listed && listed.quantityNotInvoiced === 250, JSON.stringify(report.body.shippedNotInvoiced).slice(0, 200));
      ok('and puts it under "needs action"', report.body.needsAction.some((n) => n.what === 'Shipped but not invoiced'));
      const still = await A.post('/api/invoices', { orderId: order.id }, 'csr');
      ok('while the cause remains, raising it by hand fails cleanly too', still.status >= 400 && plain(JSON.stringify(still.body)), `${still.status} ${JSON.stringify(still.body).slice(0, 120)}`);
    } finally {
      await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS ${fn}_t ON "Invoice"`);
      await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS ${fn}()`);
    }
    const fix = await A.post('/api/invoices', { orderId: order.id }, 'csr');
    ok('once the cause is gone, the invoice is raised from the invoices page', fix.status === 201, `${fix.status} ${JSON.stringify(fix.body).slice(0, 150)}`);
    const invoices = await B.invoicesOf(order.id);
    ok('exactly one invoice, for what shipped', invoices.length === 1 && num(invoices[0].lines[0].quantity) === 250);
    const report2 = await A.get('/api/admin/integrations');
    ok('the order leaves the report', !report2.body.shippedNotInvoiced.orders.some((x) => x.orderId === order.id));
    const again = await A.post('/api/invoices', { orderId: order.id }, 'csr');
    ok('asking again does not bill it twice', (await B.invoicesOf(order.id)).length === 1, `${again.status}`);
  });

  await scenario(G2, 'a carrier reports delivery through the partner API: shipping, history and the customer all see it', async (ok) => {
    const hook = await subscribe(PA, ['shipment.delivered']);
    setMode(hook.name, { status: 200 });
    const { shipment, order } = await B.readyToShip(300, { carrierId: carrierOrg.id });
    const early = await PCAR.call('POST', `/carrier/shipments/${shipment.id}/status`, { status: 'DELIVERED' });
    ok('before the service center dispatches, a carrier report is refused', early.status === 409 && early.body.error.code === 'NOT_DISPATCHED', `${early.status} ${JSON.stringify(early.body)}`);
    ok('and nothing moved: no invoice, order still open', (await B.invoicesOf(order.id)).length === 0 && (await prisma.shipment.findUnique({ where: { id: shipment.id } })).status === 'PENDING');
    await B.dispatch(shipment);
    const road = await PCAR.call('POST', `/carrier/shipments/${shipment.id}/status`, { status: 'OUT_FOR_DELIVERY', location: 'Tulsa, OK' });
    ok('an on-the-road report is recorded without changing the status', road.status === 200 && road.body.status === 'IN_TRANSIT');
    const pod = await PCAR.call('POST', `/carrier/shipments/${shipment.id}/pod`, { signedBy: 'R. Receiver' });
    ok('proof of delivery is accepted', pod.status === 200 && pod.body.status === 'DELIVERED', `${pod.status} ${JSON.stringify(pod.body)}`);
    const s = await prisma.shipment.findUnique({ where: { id: shipment.id } });
    ok('shipping: delivered, signed, with the time', s.status === 'DELIVERED' && s.podSignature === 'R. Receiver' && s.podCaptured && s.deliveredAt);
    const staff = await A.get(`/api/shipments/${shipment.id}`, 'shipping');
    ok('the shipping desk sees the same', staff.body.status === 'DELIVERED' && staff.body.podSignature === 'R. Receiver');
    const hist = await prisma.auditLog.findMany({ where: { resourceId: shipment.id }, orderBy: { timestamp: 'asc' } });
    ok('history: the move is recorded as coming from the carrier, with no staff user', hist.some((h) => h.eventType === 'SHIPMENT_STATUS_CHANGED' && h.details.to === 'DELIVERED' && h.userId === null && /Partner API \(carrier/.test(h.details.note || '')), JSON.stringify(hist.map((h) => [h.eventType, h.details.to, h.details.note])).slice(0, 300));
    ok('history: each carrier report is kept', hist.filter((h) => h.eventType === 'CARRIER_REPORT').length === 2);
    const cust = await PA.call('GET', `/customer/shipments/${shipment.id}`);
    ok("the customer's system reads it as delivered", cust.status === 200 && cust.body.status === 'DELIVERED' && cust.body.signedBy === 'R. Receiver');
    const ev = await until(async () => hitsOf(hook.name)[0]);
    ok('and was told by event', ev && JSON.parse(ev.body).data.shipmentId === shipment.id);
    ok('billing was not touched by the delivery: still the one invoice from dispatch', (await B.invoicesOf(order.id)).length === 1);
  });

  await scenario(G2, "a partner's request for quote becomes an order through the same steps staff use", async (ok) => {
    const hook = await subscribe(PA, ['rfq.received', 'order.confirmed', 'quote.available']);
    setMode(hook.name, { status: 200 });
    const sent = await PA.call('POST', '/customer/rfqs', { poNumber: tag('CPO'), requestedDeliveryDate: '2027-02-01', items: [{ productType: 'PLATE', gradeCode: 'A36', thickness: 0.5, width: 48, length: 96, quantity: 2000, unit: 'LB' }, { description: 'Flat bar 1/4 x 2', quantity: 40, unit: 'EA' }] });
    ok('the request is accepted and numbered', sent.status === 201 && /^RFQ-/.test(sent.body.rfqNumber) && sent.body.lineCount === 2, `${sent.status} ${JSON.stringify(sent.body)}`);
    const rfq = await prisma.rFQ.findUnique({ where: { id: sent.body.id }, include: { lines: { orderBy: { lineNumber: 'asc' } } } });
    ok("it belongs to the partner's own organisation and is submitted", rfq.customerId === custA.id && rfq.status === 'SUBMITTED');
    ok('the structured item became a description staff can price', rfq.lines[0].description === 'PLATE A36 0.5 x 48 x 96' && num(rfq.lines[0].requestedQty) === 2000, rfq.lines[0].description);
    const staff = await A.get(`/api/rfqs/${rfq.id}`, 'csr');
    ok('the sales desk sees it', staff.status === 200 && staff.body.rfqNumber === sent.body.rfqNumber);
    const q = await A.post('/api/quotes', { rfqId: rfq.id, paymentTerms: 'NET30', lines: [{ rfqLineId: rfq.lines[0].id, description: rfq.lines[0].description, quantity: 2000, unit: 'LB', unitPrice: 0.7, priceUnit: 'LB' }, { rfqLineId: rfq.lines[1].id, description: rfq.lines[1].description, quantity: 40, unit: 'EA', unitPrice: 12.5, priceUnit: 'EACH' }] }, 'csr');
    ok('a draft quote is not visible to the customer', q.status === 201 && (await PA.call('GET', `/customer/quotes/${q.body.id}`)).status === 404 && (await PA.call('POST', `/customer/quotes/${q.body.id}/respond`, { action: 'accept' })).status === 404);
    await A.post(`/api/quotes/${q.body.id}/send`, {}, 'csr');
    const seen = await PA.call('GET', `/customer/quotes/${q.body.id}`);
    ok('once sent, the customer reads it with its prices and no internal notes', seen.status === 200 && seen.body.totalAmount === 1900 && seen.body.lines.length === 2 && !('internalNotes' in seen.body), JSON.stringify(seen.body).slice(0, 200));
    const acc = await PA.call('POST', `/customer/quotes/${q.body.id}/respond`, { action: 'accept', poNumber: 'CUST-PO-77' });
    ok('the customer accepts', acc.status === 201 && acc.body.order?.orderNumber, `${acc.status} ${JSON.stringify(acc.body)}`);
    const o = await prisma.order.findUnique({ where: { id: acc.body.order.id }, include: { lines: true } });
    ok('the order has the quoted lines, prices, total, terms and the customer PO', o.buyerId === custA.id && num(o.totalAmount) === 1900 && o.lines.length === 2 && o.paymentTerms === 'NET30' && o.poReference === 'CUST-PO-77');
    ok('the order is credited to the person who wrote the quote', o.createdById === w.users.csr.id);
    ok('the quote and RFQ are closed', (await prisma.quote.findUnique({ where: { id: q.body.id } })).status === 'ACCEPTED' && (await prisma.rFQ.findUnique({ where: { id: rfq.id } })).status === 'ACCEPTED');
    const twice = await PA.call('POST', `/customer/quotes/${q.body.id}/respond`, { action: 'accept' });
    ok('accepting again is refused and makes no second order', twice.status === 409 && (await prisma.order.count({ where: { fromQuote: { id: q.body.id } } })) === 1, `${twice.status}`);
    const mine = await PA.call('GET', `/customer/orders/${o.id}`);
    ok('the customer reads the order back', mine.status === 200 && mine.body.totalAmount === 1900 && mine.body.lines.length === 2);
    const types = await until(async () => { const t = hitsOf(hook.name).map((h) => JSON.parse(h.body).type); return t.includes('rfq.received') && t.includes('order.confirmed') ? t : null; });
    ok('events: the request was acknowledged and the order confirmed', Boolean(types), hitsOf(hook.name).map((h) => JSON.parse(h.body).type).join());
  });

  await scenario(G2, 'cancelling an order gives its stock back, and shipping and billing can no longer use it', async (ok) => {
    const { order, shipment, coilId } = await B.readyToShip(700);
    const c = await A.put(`/api/orders/${order.id}`, { status: 'CANCELLED' }, 'csr');
    ok('cancel is accepted', c.status === 200 && c.body.status === 'CANCELLED', `${c.status} ${JSON.stringify(c.body).slice(0, 120)}`);
    const inv = await prisma.inventory.findUnique({ where: { coilId } });
    ok('inventory: the reservation is released', num(inv.qtyAllocated) === 0 && num(inv.qtyAvailable) === num(inv.qtyOnHand) && (await prisma.orderLineAllocation.count({ where: { orderLineId: order.lines[0].id } })) === 0, JSON.stringify(inv));
    const d = await B.dispatch(shipment);
    ok('shipping: the shipment for the cancelled order cannot leave', d.status === 409, `${d.status} ${d.body?.error}`);
    const bill = await A.post('/api/invoices', { orderId: order.id }, 'csr');
    ok('billing: nothing to invoice', bill.status >= 400 && bill.status < 500 && (await B.invoicesOf(order.id)).length === 0, bill.status);
    ok('stock can be reserved for another order straight away', ok2(await (async () => { const o2 = await B.order([B.line(700)]); return B.reserve(o2, o2.lines[0], coilId, 700); })()));
  });

  await scenario(G2, 'a work order feeds an order line, and the pieces ship under the same order', async (ok) => {
    const coilId = await B.received({ weightLb: 3000 });
    const o = await B.order([B.line(1000)]);
    ok('source reserved for the line', ok2(await B.reserve(o, o.lines[0], coilId, 1000)));
    const wo = await A.post('/api/work-orders', { woType: 'SLIT', sourceCoilId: coilId, lineId: o.lines[0].id, priority: 3, notes: `QA phase 4 ${run}` });
    ok('work order raised for the line', wo.status === 201, `${wo.status} ${JSON.stringify(wo.body).slice(0, 150)}`);
    for (const stepName of ['release', 'start']) await A.put(`/api/work-orders/${wo.body.id}/${stepName}`, {});
    const done = await A.put(`/api/work-orders/${wo.body.id}/complete`, { scrapWeightLb: 20, outputs: [{ weightLb: 490 }, { weightLb: 490 }] });
    ok('completed with two pieces and scrap', done.status === 200, `${done.status} ${JSON.stringify(done.body).slice(0, 200)}`);
    const pieces = await prisma.coil.findMany({ where: { parentCoilId: coilId } });
    const reserved = await prisma.orderLineAllocation.findMany({ where: { orderLineId: o.lines[0].id } });
    ok('manufacturing → inventory: the pieces exist with the source heat', pieces.length === 2 && pieces.every((p) => p.heatId === w.heat.id));
    ok('manufacturing → orders: the pieces are reserved for the same line', reserved.length === 2 && reserved.every((r) => pieces.some((p) => p.id === r.coilId)) && reserved.reduce((t, r) => t + num(r.qtyAllocated), 0) === 980, JSON.stringify(reserved.map((r) => num(r.qtyAllocated))));
    const s = await B.shipment(o, [[o.lines[0], 980]]);
    const d = await B.dispatch(s.body);
    ok('orders → shipping: the pieces ship', d.status === 200, `${d.status} ${d.body?.error}`);
    const mv = await prisma.materialMovement.findMany({ where: { shipmentId: s.body.id } });
    ok('shipping → inventory: one movement per piece, naming the piece', mv.length === 2 && mv.every((m) => pieces.some((p) => p.id === m.coilId)));
    const [invoice] = await B.invoicesOf(o.id);
    ok('shipping → billing: the invoice is for the 980 lb that left', invoice && num(invoice.lines[0].quantity) === 980);
    ok('orders: the line is part shipped, the order partial', (await prisma.order.findUnique({ where: { id: o.id } })).status === 'PARTIAL');
    const trace = await A.get(`/api/heats/${encodeURIComponent(w.heat.heatNumber)}/trace`);
    ok('quality: the heat trace answers', trace.status === 200);
    const went = (trace.body.shipments || []).filter((x) => x.shipmentId === s.body.id);
    ok('quality: the heat trace names the shipment once per piece that left, with the pounds', went.length === 2 && went.every((x) => pieces.some((p) => p.id === x.coilId)) && went.reduce((t, x) => t + x.quantity, 0) === 980, JSON.stringify(went).slice(0, 300));
    ok('quality: and the customer who received it, through the pieces cut on the work order', went.every((x) => x.orderNumber === o.orderNumber && x.customerId === o.buyerId) && (trace.body.customers || []).some((c) => c.id === o.buyerId), String(JSON.stringify(trace.body.customers)).slice(0, 200));
    ok('quality: the trace still carries what it did before (items, grade, tests)', Array.isArray(trace.body.coils) && trace.body.coils.length >= 3 && 'testResults' in trace.body && 'grade' in trace.body);
  });

  await scenario(G2, "what a partner reads equals what staff see: totals, balances and counts", async (ok) => {
    const mine = await PA.call('GET', '/customer/invoices?limit=100');
    const dbInv = await prisma.invoice.findMany({ where: { order: { buyerId: custA.id, orderType: 'SO' }, status: { not: 'DRAFT' } } });
    ok('the invoice count is the count on file', mine.body.pagination.total === dbInv.length, `${mine.body.pagination.total} vs ${dbInv.length}`);
    const byId = Object.fromEntries(dbInv.map((i) => [i.id, i]));
    ok('every invoice total, amount paid and balance matches the record', mine.body.data.every((i) => byId[i.id] && Math.abs(i.totalAmount - num(byId[i.id].totalAmount)) < 0.005 && Math.abs(i.balance - (num(byId[i.id].totalAmount) - num(byId[i.id].paidAmount))) < 0.005));
    const orders = await PA.call('GET', '/customer/orders?limit=100');
    ok('the order count is the count on file', orders.body.pagination.total === await prisma.order.count({ where: { buyerId: custA.id, orderType: 'SO' } }));
    const staffList = await A.get(`/api/orders?buyerId=${custA.id}&limit=100&view=summary`);
    ok('the newest orders are the same ones staff see, with the same totals', orders.body.data.slice(0, 20).every((o) => { const s = staffList.body.find((x) => x.id === o.id); return s && Math.abs(num(s.totalAmount) - o.totalAmount) < 0.005 && s.status === o.status; }));
    const one = orders.body.data.find((o) => ['COMPLETE', 'PARTIAL'].includes(o.status));
    if (one) {
      const ms = await PA.call('GET', `/customer/orders/${one.id}/milestones`);
      const ships = await prisma.shipment.count({ where: { orderId: one.id, shippedAt: { not: null }, status: { not: 'CANCELLED' } } });
      ok('milestones are built from the records: one "shipped" per shipment that left', ms.status === 200 && ms.body.milestones.filter((m) => m.type === 'SHIPPED').length === ships, JSON.stringify(ms.body).slice(0, 200));
      ok('in time order', ms.body.milestones.every((m, i, a) => i === 0 || Date.parse(a[i - 1].at) <= Date.parse(m.at)));
    }
  });

  await scenario(G2, 'a counter sale reaches stock, billing and payment in one step, and a repeat is the same sale', async (ok) => {
    const each = await prisma.product.findFirst({ where: { isActive: true, priceUnit: 'EACH', basePriceCwt: { gt: 0 } } });
    if (!each) return ok('an each-priced product exists', false, 'none in the catalogue');
    const owner = (await prisma.coil.findUnique({ where: { id: await B.received() } })).ownerId;
    const shelf = await prisma.coil.create({ data: { coilNumber: tag('SHELF'), form: 'PLATE', heatId: w.heat.id, gradeId: w.heat.gradeId, ownerId: owner, productId: each.id, locationId: L1.id, netWeightLb: 250, grossWeightLb: 250, createdById: w.users.admin.id } });
    await prisma.inventory.create({ data: { coilId: shelf.id, locationId: L1.id, qtyOnHand: 40, qtyAvailable: 40, unit: 'EA' } });
    const onShelf = async () => num((await prisma.inventory.aggregate({ where: { locationId: L1.id, unit: { in: ['EA', 'EACH'] }, coil: { productId: each.id } }, _sum: { qtyOnHand: true } }))._sum.qtyOnHand);
    const before = await onShelf();
    const sale = { id: tag('QS'), locationId: L1.id, items: [{ productId: each.id, quantity: 4 }] };
    const priced = await A.post('/api/pos/quick-sale/price', { sale }, 'csr');
    ok('the server prices the sale', priced.status === 200 && num(priced.body.total) > 0, `${priced.status} ${JSON.stringify(priced.body).slice(0, 200)}`);
    const body = { sale, payment: { method: 'CASH', amountTendered: Math.ceil(num(priced.body.total)) + 1 } };
    const paid = await A.post('/api/pos/quick-sale/process-payment', body, 'csr');
    if (!ok('payment taken', ok2(paid) && paid.body.orderId, `${paid.status} ${JSON.stringify(paid.body).slice(0, 300)}`)) return;
    const invs = await B.invoicesOf(paid.body.orderId);
    ok('billing: one invoice in the main number series, paid in full', invs.length === 1 && /^INV-\d+$/.test(invs[0].invoiceNumber) && invs[0].status === 'PAID' && Math.abs(num(invs[0].totalAmount) - num(priced.body.total)) < 0.005, JSON.stringify(invs.map((i) => [i.invoiceNumber, i.status, i.totalAmount])));
    ok('payments: one payment for the total', invs[0].payments.length === 1 && Math.abs(num(invs[0].payments[0].amount) - num(priced.body.total)) < 0.005);
    ok('inventory: four came off the shelf, with a movement naming the sale', (await onShelf()) === before - 4 && (await prisma.materialMovement.count({ where: { orderId: paid.body.orderId } })) >= 1, `${before} → ${await onShelf()}`);
    // The till sends the same sale again (the answer was lost).
    const again = await A.post('/api/pos/quick-sale/process-payment', body, 'csr');
    ok('the repeat answers with the first sale', ok2(again) && again.body.duplicate === true && again.body.orderId === paid.body.orderId, `${again.status} ${JSON.stringify(again.body).slice(0, 150)}`);
    ok('and nothing was doubled: one order, one invoice, one payment, four off the shelf', (await B.invoicesOf(paid.body.orderId)).length === 1 && (await onShelf()) === before - 4 && (await prisma.payment.count({ where: { invoiceId: invs[0].id } })) === 1);
  });

  await scenario(G2, 'a supplier reads and acknowledges only purchase orders placed with it', async (ok) => {
    const mk = (seller) => prisma.order.create({ data: { orderNumber: tag('PO'), orderType: 'PO', status: 'CONFIRMED', sellerId: seller.id, buyerId: null, createdById: w.users.admin.id, locationId: L1.id, totalAmount: 5000, subtotal: 5000, lines: { create: [{ lineNumber: 1, description: 'QA hot rolled coil', qtyOrdered: 40000, unit: 'LB', unitPrice: 0.125, priceUnit: 'LB', extendedPrice: 5000 }] } } });
    const po = await mk(supplierOrg); const other = await mk(supplierOrg2);
    const draft = await prisma.order.create({ data: { orderNumber: tag('PO'), orderType: 'PO', status: 'DRAFT', sellerId: supplierOrg.id, createdById: w.users.admin.id, locationId: L1.id } });
    const list = await PSUP.call('GET', '/supplier/purchase-orders?limit=100');
    ok('the list has its own purchase order', list.status === 200 && list.body.data.some((p) => p.id === po.id));
    ok("not another supplier's, and not a draft", !list.body.data.some((p) => p.id === other.id || p.id === draft.id));
    const one = await PSUP.call('GET', `/supplier/purchase-orders/${po.id}`);
    ok('with its lines and prices', one.status === 200 && one.body.poNumber === po.orderNumber && one.body.lines[0].quantityOrdered === 40000 && one.body.totalAmount === 5000);
    ok("another supplier's purchase order answers 404", (await PSUP.call('GET', `/supplier/purchase-orders/${other.id}`)).status === 404 && (await PSUP.call('POST', `/supplier/purchase-orders/${other.id}/acknowledge`, {})).status === 404);
    const ack = await PSUP.call('POST', `/supplier/purchase-orders/${po.id}/acknowledge`, { estimatedShipDate: '2027-01-15', notes: 'Rolling week 2' });
    ok('an acknowledgement is recorded', ack.status === 200 && ack.body.acknowledged === true, `${ack.status} ${JSON.stringify(ack.body)}`);
    const log = await prisma.auditLog.findFirst({ where: { eventType: 'PO_ACKNOWLEDGED', resourceId: po.id } });
    ok('with the ship date and who sent it, and the purchase order status is unchanged', log?.details.partnerId === PSUP.id && /2027-01-15/.test(log.details.estimatedShipDate) && (await prisma.order.findUnique({ where: { id: po.id } })).status === 'CONFIRMED');
    ok('a date that is not a date is refused', (await PSUP.call('POST', `/supplier/purchase-orders/${po.id}/acknowledge`, { estimatedShipDate: 'soon' })).status === 400);
    ok('a sales order is never shown as a purchase order', !list.body.data.some((p) => /^SO-/.test(p.poNumber)));
  });
}

// ══ 3. Event processing and background jobs ════════════════════════════════════════════
const G3 = 'Event processing and background jobs';
if (want(3)) {
  await scenario(G3, 'an event is delivered once, signed, with the same id in the body and the header', async (ok) => {
    const hook = await subscribe(PA, ['shipment.dispatched', 'invoice.issued']);
    setMode(hook.name, { status: 200 });
    const { shipment } = await B.readyToShip(800);
    const d = await B.dispatch(shipment);
    ok('dispatch accepted', d.status === 200, `${d.status} ${JSON.stringify(d.body).slice(0, 200)}`);
    const rows = await until(async () => { const r = await deliveriesOf(hook.id); return r.length >= 2 && r.every((x) => x.status === 'DELIVERED') ? r : null; });
    ok('two events on file, both delivered', rows?.length === 2, JSON.stringify((await deliveriesOf(hook.id)).map((x) => [x.eventType, x.status, x.errorMessage])));
    const hits = hitsOf(hook.name);
    ok('the partner address was called once per event', hits.length === 2, hits.length);
    for (const h of hits) {
      const body = JSON.parse(h.body);
      ok(`${body.type}: the plain signature matches the body`, h.headers['x-steelwise-signature'] === `sha256=${hmac(hook.secret, h.body)}`);
      const parts = Object.fromEntries(String(h.headers['x-steelwise-signature-timestamp']).split(',').map((p) => p.split('=')));
      ok(`${body.type}: the timed signature matches the send time and the body`, parts.v1 === hmac(hook.secret, `${parts.t}.${h.body}`) && Math.abs(Date.now() / 1000 - Number(parts.t)) < 60);
      ok(`${body.type}: the event id is the same in the body and the header`, body.id && body.id === h.headers['x-steelwise-event-id']);
      ok(`${body.type}: says which partner it is for and when it happened`, body.partner_id === PA.id && !Number.isNaN(Date.parse(body.created_at)));
    }
    const types = hits.map((h) => JSON.parse(h.body).type).sort();
    ok('the events are the dispatch and its invoice', types.join() === 'invoice.issued,shipment.dispatched', types.join());
    const inv = JSON.parse(hits.find((h) => JSON.parse(h.body).type === 'invoice.issued').body).data;
    const onFile = await prisma.invoice.findUnique({ where: { id: inv.invoiceId } });
    ok('the invoice event carries the number and total that are on file', onFile && onFile.invoiceNumber === inv.invoiceNumber && Math.abs(num(onFile.totalAmount) - inv.totalAmount) < 0.005);
  });

  await scenario(G3, 'a change that is refused leaves no event behind', async (ok) => {
    const hook = await subscribe(PA, ['shipment.dispatched', 'invoice.issued', 'order.confirmed', 'order.status_changed']);
    const before = (await deliveriesOf(hook.id)).length;
    // A shipment with nothing reserved: the dispatch is refused.
    const o = await B.order([B.line(500)], { customer: custA });
    const confirmEvents = await until(async () => ((await deliveriesOf(hook.id)).length - before >= 2 ? true : null));
    ok('confirming the order queued its events', confirmEvents === true);
    const afterConfirm = (await deliveriesOf(hook.id)).length;
    const s = await B.shipment(o, [[o.lines[0], 500]]);
    const d = await B.dispatch(s.body);
    ok('dispatch with nothing reserved is refused', d.status === 409, d.status);
    await sleep(300);
    ok('no event was recorded for the refused dispatch', (await deliveriesOf(hook.id)).length === afterConfirm, (await deliveriesOf(hook.id)).length - afterConfirm);
    ok('no invoice was raised', (await B.invoicesOf(o.id)).length === 0);
    // A stale edit is refused: no status event either.
    const stale = await A.put(`/api/orders/${o.id}`, { status: 'CANCELLED', expectedUpdatedAt: new Date(Date.now() - 86_400_000).toISOString() });
    ok('a stale cancel is refused', stale.status === 409 && stale.body.code === 'STALE_EDIT', `${stale.status} ${JSON.stringify(stale.body)}`);
    await sleep(200);
    ok('and queued nothing', (await deliveriesOf(hook.id)).length === afterConfirm);
  });

  await scenario(G3, 'a failed delivery waits its turn and is not sent again before it is due', async (ok) => {
    const hook = await subscribe(PB, ['shipment.dispatched']);
    setMode(hook.name, { status: 500 });
    const { shipment } = await B.readyToShip(300, { customer: custB });
    await B.dispatch(shipment);
    const row = await until(async () => { const [r] = await deliveriesOf(hook.id); return r?.status === 'RETRYING' && r.httpStatus === 500 ? r : null; });
    ok('the delivery is waiting to be tried again', row?.status === 'RETRYING', JSON.stringify(await deliveriesOf(hook.id)).slice(0, 300));
    ok('one attempt is counted', row?.attempts === 1, row?.attempts);
    const wait = row ? row.nextRetryAt - Date.now() : 0;
    ok('the next try is about a minute away', wait > 40_000 && wait < 70_000, wait);
    ok('the reason is on record', /HTTP 500/.test(row?.errorMessage || ''), row?.errorMessage);
    const t = await runTasks();
    ok('a run before it is due sends nothing', t.status === 200 && hitsOf(hook.name).length === 1, `${t.status} hits ${hitsOf(hook.name).length}`);
    // Now it is due, and the partner is back.
    setMode(hook.name, { status: 200 });
    await makeDue(hook.id);
    const t2 = await runTasks();
    const after = (await deliveriesOf(hook.id))[0];
    ok('once due, the run delivers it', t2.body?.webhooks?.delivered >= 1 && after.status === 'DELIVERED', `${JSON.stringify(t2.body?.webhooks)} ${after.status}`);
    const hits = hitsOf(hook.name);
    ok('the second attempt carries the same event id as the first', hits.length === 2 && hits[0].headers['x-steelwise-event-id'] === hits[1].headers['x-steelwise-event-id']);
    ok('and says it is attempt 2', hits[1]?.headers['x-steelwise-attempt'] === '2', hits[1]?.headers['x-steelwise-attempt']);
    ok('the body is byte for byte the same, so the receiver can recognise the repeat', hits[0].body === hits[1].body);
  });

  await scenario(G3, 'an event that can never be delivered stops after five tries and is kept as failed', async (ok) => {
    const hook = await subscribe(PB, ['shipment.dispatched']);
    setMode(hook.name, { status: 503 });
    const { shipment } = await B.readyToShip(200, { customer: custB });
    await B.dispatch(shipment);
    await until(async () => tried((await deliveriesOf(hook.id))[0]));
    for (let i = 0; i < 6; i += 1) { await makeDue(hook.id); await runTasks(); }
    const [row] = await deliveriesOf(hook.id);
    ok('it is marked failed', row.status === 'FAILED', row.status);
    ok('after exactly five attempts', row.attempts === 5 && hitsOf(hook.name).length === 5, `${row.attempts} attempts, ${hitsOf(hook.name).length} calls`);
    await runTasks();
    ok('a failed event is not sent again by itself', hitsOf(hook.name).length === 5);
    const report = await A.get('/api/admin/integrations');
    ok('the integration report counts it and says what to do', report.status === 200 && report.body.webhooks.failed >= 1 && report.body.needsAction.some((n) => /could not be delivered/.test(n.what)), JSON.stringify(report.body?.needsAction).slice(0, 300));
    ok('the report lists the failed event', report.body.webhooks.recentFailed.some((f) => f.id === row.id));
    // Recovery: the partner fixes their side; an administrator sends it again.
    setMode(hook.name, { status: 200 });
    const csr = await A.post(`/api/admin/integrations/deliveries/${row.id}/replay`, {}, 'csr');
    ok('a sales login cannot replay', csr.status === 403, csr.status);
    const again = await A.post(`/api/admin/integrations/deliveries/${row.id}/replay`, {});
    ok('an administrator sends it again and it is delivered', again.status === 200 && again.body.delivery.status === 'DELIVERED', `${again.status} ${JSON.stringify(again.body).slice(0, 200)}`);
    ok('with the same event id', hitsOf(hook.name)[5]?.headers['x-steelwise-event-id'] === row.eventId);
    const audit = await prisma.auditLog.findFirst({ where: { eventType: 'WEBHOOK_REPLAYED', resourceId: row.id } });
    ok('who replayed it is on record', audit?.userId === w.users.admin.id);
    const twice = await A.post(`/api/admin/integrations/deliveries/${row.id}/replay`, {});
    ok('a delivered event cannot be replayed', twice.status === 409, twice.status);
  });

  await scenario(G3, 'an event that waited for days is not sent on its own; a person can still send it', async (ok) => {
    const hook = await subscribe(PB, ['shipment.dispatched']);
    const old = new Date(Date.now() - 4 * 24 * 3_600_000);
    const row = await prisma.webhookDelivery.create({ data: { webhookId: hook.id, eventType: 'shipment.dispatched', eventId: `evt_old_${Date.now()}`, payload: { id: 'old', type: 'shipment.dispatched', data: { shipmentNumber: 'OLD' } }, status: 'PENDING', createdAt: old } });
    const fresh = await prisma.webhookDelivery.create({ data: { webhookId: hook.id, eventType: 'shipment.dispatched', eventId: `evt_new_${Date.now()}`, payload: { id: 'new', type: 'shipment.dispatched', data: { shipmentNumber: 'NEW' } }, status: 'PENDING' } });
    const run = await runTasks();
    const after = await prisma.webhookDelivery.findUnique({ where: { id: row.id } });
    ok('the four-day-old event is not sent', hitsOf(hook.name).every((h) => !h.body.includes('"OLD"')), `${hitsOf(hook.name).length} calls`);
    ok('it is kept as failed with the reason in words', after.status === 'FAILED' && /waited longer than 72 hours/.test(after.errorMessage || ''), `${after.status} ${after.errorMessage}`);
    ok('the run reports how many it set aside', run.body?.webhooks?.expired >= 1, JSON.stringify(run.body?.webhooks));
    ok('the fresh event beside it is delivered', (await prisma.webhookDelivery.findUnique({ where: { id: fresh.id } })).status === 'DELIVERED');
    const again = await A.post(`/api/admin/integrations/deliveries/${row.id}/replay`, {});
    ok('an administrator can still send it', again.status === 200 && again.body.delivery.status === 'DELIVERED' && hitsOf(hook.name).some((h) => h.body.includes('"OLD"')), `${again.status} ${JSON.stringify(again.body).slice(0, 200)}`);
  });

  await scenario(G3, 'forty orders confirmed in the same second: every event is sent, once, without waiting for the scheduled run', async (ok) => {
    const hook = await subscribe(PB, ['order.confirmed']);
    const orders = [];
    for (let i = 0; i < 40; i += 8) orders.push(...await Promise.all(Array.from({ length: 8 }, () => B.order([B.line(100)], { customer: custB, status: 'DRAFT' }))));
    const done = await Promise.all(orders.map((o) => A.put(`/api/orders/${o.id}`, { status: 'CONFIRMED' })));
    ok('all forty are confirmed', done.every((d) => d.status === 200), done.map((d) => d.status).join(','));
    const sent = await until(async () => (await deliveriesOf(hook.id, { status: 'DELIVERED' })).length === 40, { ms: 10000, every: 200 });
    const rows = await deliveriesOf(hook.id);
    ok('forty events were recorded', rows.length === 40, rows.length);
    ok('all forty were delivered within ten seconds, with no scheduled run', sent === true, `${rows.filter((r) => r.status === 'DELIVERED').length} delivered`);
    const got = hitsOf(hook.name);
    ok('the partner received forty calls for forty different events', got.length === 40 && new Set(got.map((h) => h.headers['x-steelwise-event-id'])).size === 40, `${got.length} calls`);
    ok('each on its first attempt', rows.every((r) => r.attempts === 1), rows.map((r) => r.attempts).join(''));
  });

  await scenario(G3, 'five delivery runs at the same moment send each event once', async (ok) => {
    const hook = await subscribe(PB, ['shipment.dispatched']);
    setMode(hook.name, { status: 500 });
    const made = [];
    for (let i = 0; i < 4; i += 1) { const { shipment } = await B.readyToShip(100, { customer: custB }); await B.dispatch(shipment); made.push(shipment.id); }
    await until(async () => (await deliveriesOf(hook.id)).filter((r) => tried(r)).length === 4);
    clearHits(hook.name);
    setMode(hook.name, { status: 200, delayMs: 150 });
    await makeDue(hook.id);
    const runs = await Promise.all([1, 2, 3, 4, 5].map(() => runTasks()));
    ok('every run answered', runs.every((r) => r.status === 200), runs.map((r) => r.status).join());
    const rows = await deliveriesOf(hook.id);
    ok('all four events are delivered', rows.length === 4 && rows.every((r) => r.status === 'DELIVERED'), rows.map((r) => r.status).join());
    const ids = hitsOf(hook.name).map((h) => h.headers['x-steelwise-event-id']);
    ok('the partner was called exactly four times, once per event', ids.length === 4 && new Set(ids).size === 4, `${ids.length} calls, ${new Set(ids).size} distinct`);
    ok('each was counted as attempt 2, not more', rows.every((r) => r.attempts === 2), rows.map((r) => r.attempts).join());
    ok('the runs together claimed four', runs.reduce((n, r) => n + r.body.webhooks.claimed, 0) === 4, runs.map((r) => r.body.webhooks.claimed).join());
  });

  await scenario(G3, 'a delivery claimed by a server that stopped is picked up when its claim runs out', async (ok) => {
    const hook = await subscribe(PB, ['shipment.dispatched']);
    setMode(hook.name, { status: 500 });
    const { shipment } = await B.readyToShip(100, { customer: custB });
    await B.dispatch(shipment);
    const row = await until(async () => { const [r] = await deliveriesOf(hook.id); return tried(r) ? r : null; });
    // What a stopped instance leaves: the row claimed (due time pushed two minutes out, attempt counted), no result written.
    await prisma.webhookDelivery.update({ where: { id: row.id }, data: { status: 'RETRYING', attempts: 2, nextRetryAt: new Date(Date.now() + 120_000) } });
    setMode(hook.name, { status: 200 });
    clearHits(hook.name);
    await runTasks();
    ok('while the claim is held, no other run sends it', hitsOf(hook.name).length === 0);
    await prisma.webhookDelivery.update({ where: { id: row.id }, data: { nextRetryAt: new Date(Date.now() - 1000) } });
    await runTasks();
    const after = (await deliveriesOf(hook.id))[0];
    ok('when the claim runs out it is sent and delivered', after.status === 'DELIVERED' && hitsOf(hook.name).length === 1, `${after.status} ${hitsOf(hook.name).length}`);
    ok('the abandoned attempt still counts toward the limit', after.attempts === 3, after.attempts);
  });

  await scenario(G3, 'the same business fact is recorded once per subscriber', async (ok) => {
    const hook = await subscribe(PA, ['shipment.delivered', 'shipment.dispatched']);
    setMode(hook.name, { status: 200 });
    const { shipment } = await B.readyToShip(100);
    await B.dispatch(shipment);
    // Two people press Deliver at the same moment.
    const both = await Promise.all([B.deliver(shipment), B.deliver(shipment)]);
    ok('one delivery wins, the other is refused', both.filter((r) => r.status === 200).length === 1 && both.filter((r) => r.status === 409).length === 1, both.map((r) => r.status).join());
    const rows = await until(async () => { const r = await deliveriesOf(hook.id, { eventType: 'shipment.delivered' }); return r.length ? r : null; });
    await sleep(300);
    ok('one delivered event is on file', (await deliveriesOf(hook.id, { eventType: 'shipment.delivered' })).length === 1);
    // The database itself refuses a second row for the same subscriber and event.
    let refused = false;
    try { await prisma.webhookDelivery.create({ data: { webhookId: hook.id, eventType: rows[0].eventType, eventId: rows[0].eventId, payload: {}, status: 'PENDING' } }); } catch (e) { refused = e.code === 'P2002'; }
    ok('the database refuses a second copy of the same event for the same subscriber', refused);
    ok('one dispatched event too', (await deliveriesOf(hook.id, { eventType: 'shipment.dispatched' })).length === 1);
  });

  await scenario(G3, 'a subscription that keeps failing is stopped, says why, and resumes when turned back on', async (ok) => {
    const P = await partner(custC, 'CUSTOMER');
    const hook = await subscribe(P, ['shipment.dispatched']);
    setMode(hook.name, { status: 500 });
    for (let i = 0; i < 5; i += 1) { const { shipment } = await B.readyToShip(50, { customer: custC }); await B.dispatch(shipment); }
    await until(async () => (await deliveriesOf(hook.id)).filter((r) => tried(r)).length === 5);
    for (let i = 0; i < 5; i += 1) { await makeDue(hook.id); await runTasks(); }
    const sub = await prisma.partnerWebhook.findUnique({ where: { id: hook.id } });
    ok('after five events in a row failed for good, the subscription is stopped', sub.status === 'DISABLED' && /could not be delivered/.test(sub.disableReason || ''), `${sub.status} ${sub.consecutiveFailures} ${sub.disableReason}`);
    const calls = hitsOf(hook.name).length;
    const { shipment, order } = await B.readyToShip(50, { customer: custC });
    const d = await B.dispatch(shipment);
    ok('business carries on: the next shipment still dispatches and invoices', d.status === 200 && (await B.invoicesOf(order.id)).length === 1);
    await sleep(300);
    ok('nothing is sent to a stopped subscription', hitsOf(hook.name).length === calls);
    const list = await P.call('GET', '/webhooks');
    ok('the partner can see that it was stopped', list.body.data.find((x) => x.id === hook.id)?.status === 'DISABLED');
    setMode(hook.name, { status: 200 });
    const on = await P.call('PUT', `/webhooks/${hook.id}`, { status: 'ACTIVE' });
    ok('the partner turns it back on', on.status === 200 && on.body.status === 'ACTIVE');
    const { shipment: s2 } = await B.readyToShip(50, { customer: custC });
    await B.dispatch(s2);
    const delivered = await until(async () => (await deliveriesOf(hook.id)).some((r) => r.status === 'DELIVERED'));
    ok('new events are delivered again', delivered === true);
  });

  await scenario(G3, 'the scheduled run needs its secret, does the periodic work and records that it ran', async (ok) => {
    const none = await http1('POST', '/api/internal/tasks/run');
    const wrong = await http1('POST', '/api/internal/tasks/run', { headers: { authorization: 'Bearer wrong-secret' } });
    const staff = await http1('POST', '/api/internal/tasks/run', { token: await tokenOf('admin') });
    ok('no secret: refused', none.status === 401, none.status);
    ok('wrong secret: refused', wrong.status === 401, wrong.status);
    ok('a staff token is not the secret', staff.status === 401, staff.status);
    // An old request key, to see the clean-up.
    const old = await prisma.requestKey.create({ data: { scope: `qa ${run}`, key: tag('OLDKEY'), bodyHash: 'x', status: 'DONE', createdAt: new Date(Date.now() - 2 * 86_400_000) } });
    const good = await http1('GET', '/api/internal/tasks/run', { headers: { authorization: `Bearer ${TASKS_SECRET}` } });
    ok('with the secret it runs (a scheduler calls with GET)', good.status === 200 && good.body.by === 'schedule' && typeof good.body.webhooks?.due === 'number', `${good.status} ${JSON.stringify(good.body).slice(0, 200)}`);
    ok('request keys older than a day are cleared', good.body.requestKeysCleared >= 1 && !(await prisma.requestKey.findUnique({ where: { id: old.id } })));
    const report = await A.get('/api/admin/integrations');
    ok('the report shows when it last ran', report.body.scheduledRun.setUp === true && report.body.scheduledRun.lastRun?.at === good.body.at, JSON.stringify(report.body.scheduledRun).slice(0, 200));
    const manual = await A.post('/api/admin/integrations/run', {});
    ok('an administrator can run it by hand', manual.status === 200 && /^user /.test(manual.body.by));
    ok('a branch login cannot', (await A.post('/api/admin/integrations/run', {}, 'branchA')).status === 403);
  });

  await scenario(G3, 'events that arrive out of order can be put back in order by the receiver', async (ok) => {
    const hook = await subscribe(PA, ['shipment.dispatched', 'shipment.delivered']);
    // The partner is down when the shipment leaves, and back when it is delivered.
    setMode(hook.name, { status: 500 });
    const { shipment } = await B.readyToShip(100);
    await B.dispatch(shipment);
    await until(async () => tried((await deliveriesOf(hook.id, { eventType: 'shipment.dispatched' }))[0]));
    setMode(hook.name, { status: 200 });
    await sleep(15);
    await B.deliver(shipment);
    await until(async () => (await deliveriesOf(hook.id, { eventType: 'shipment.delivered' }))[0]?.status === 'DELIVERED');
    await makeDue(hook.id); await runTasks();
    const good = hitsOf(hook.name).slice(1).map((h) => JSON.parse(h.body));
    ok('the delivered event reached the partner before the dispatched one', good.length === 2 && good[0].type === 'shipment.delivered' && good[1].type === 'shipment.dispatched', good.map((g) => g.type).join());
    ok('each carries when it happened, so the receiver can order them', Date.parse(good[1].created_at) < Date.parse(good[0].created_at), `${good[1].created_at} ${good[0].created_at}`);
    ok('the late one still says the shipment was dispatched, not a newer state', good[1].data.status === 'IN_TRANSIT');
  });

  await scenario(G3, 'a slow partner address is given up on at the time limit and tried again later', async (ok) => {
    const hook = await subscribe(PB, ['shipment.dispatched']);
    setMode(hook.name, { status: 200, delayMs: 4000 });
    const { shipment, order } = await B.readyToShip(100, { customer: custB });
    const t0 = Date.now();
    const d = await B.dispatch(shipment);
    const took = Date.now() - t0;
    ok('the dispatch does not wait for the partner', d.status === 200 && took < 1500, `${took} ms`);
    ok('the invoice is raised regardless', (await B.invoicesOf(order.id)).length === 1);
    const row = await until(async () => { const [r] = await deliveriesOf(hook.id); return r?.status === 'RETRYING' && r.errorMessage ? r : null; }, { ms: 5000 });
    ok('the attempt is abandoned at the time limit and queued again', /No answer within/.test(row?.errorMessage || ''), JSON.stringify(row)?.slice(0, 200));
    ok('the time limit was the configured 1.5 seconds, not the 4 the partner took', row && row.responseTimeMs >= 1400 && row.responseTimeMs < 3000, row?.responseTimeMs);
    setMode(hook.name, { status: 200 });
  });
}

// ══ 4. Webhooks and outside services failing ═══════════════════════════════════════════
const G4 = 'Webhooks and external service failures';
if (want(4)) {
  const speak = (who = 'csr') => raw('POST', '/api/ai/tts/speak', { text: 'Order ready for pickup' }, who);

  await scenario(G4, 'the speech provider answers: audio comes back, and no real provider is called', async (ok) => {
    setMode('speech', { status: 200 });
    clearHits('speech');
    const r = await http1('POST', '/api/ai/tts/speak', { body: { text: 'Order ready' }, token: await tokenOf('csr'), text: true });
    ok('audio is returned', r.status === 200 && r.raw.startsWith('ID3-QA-AUDIO'), `${r.status} ${r.raw.slice(0, 40)}`);
    const hit = hitsOf('speech')[0];
    ok('the call went to the local stand-in', hit?.path.startsWith('/speech/v1/text-to-speech/'));
    ok('with the key in its header, never in the address', hit?.headers['xi-api-key'] === 'qa-not-a-real-speech-key' && !hit.path.includes('qa-not-a-real'));
  });

  await scenario(G4, 'the speech provider hangs: the user gets a plain answer at the time limit and stays signed in', async (ok) => {
    setMode('speech', { status: 200, delayMs: 5000 });
    const t0 = Date.now();
    const r = await speak();
    const took = Date.now() - t0;
    ok('answered 504, not left waiting', r.status === 504, r.status);
    ok('within the 1.5 second limit, not the 5 seconds the provider took', took < 3000, `${took} ms`);
    ok('the message is plain and has a request id', /took too long/.test(r.body.error) && r.body.requestId && plain(r.body.error), JSON.stringify(r.body));
    ok('the same session still works afterwards', (await A.get('/api/orders?limit=1', 'csr')).status === 200);
    setMode('speech', { status: 200 });
    await sleep(3200); // let the breaker's rest pass before the next scenario
    await speak();
  });

  await scenario(G4, "the provider refuses our key: that is our 502, never the user's 401", async (ok) => {
    setMode('speech', { status: 401, body: JSON.stringify({ detail: { status: 'invalid_api_key', message: 'Invalid API key sk_live_SECRETSECRET' } }) });
    const r = await speak();
    ok('answered 502', r.status === 502, r.status);
    ok('not 401, which would sign the user out of the screen', r.status !== 401);
    ok("the provider's own message, which can quote a key, is not passed on", !/SECRET|invalid_api_key|sk_live/.test(JSON.stringify(r.body)), JSON.stringify(r.body));
    const test = await raw('GET', '/api/ai/tts/test', undefined, 'admin');
    ok('the set-up check says the key was refused, without showing any of it', test.status === 200 && test.body.configured === false && !/qa-not-a|apiKeyPrefix/.test(JSON.stringify(test.body)), JSON.stringify(test.body).slice(0, 200));
    setMode('speech', { status: 200 });
  });

  await scenario(G4, 'a provider that keeps failing is left alone for a while, then tried again', async (ok) => {
    setMode('speech', { status: 200 });
    await sleep(3200); await speak(); // closed and healthy
    setMode('speech', { status: 500 });
    clearHits('speech');
    const first = [];
    for (let i = 0; i < 5; i += 1) first.push((await speak()).status);
    ok('five failures in a row each answer 502', first.every((s) => s === 502), first.join());
    ok('each of those five reached the provider', hitsOf('speech').length === 5, hitsOf('speech').length);
    const t0 = Date.now();
    const open = [];
    for (let i = 0; i < 4; i += 1) open.push(await speak());
    ok('after that the answer is an immediate 503', open.every((r) => r.status === 503 && /not answering right now/.test(r.body.error)), open.map((r) => r.status).join());
    ok('without calling the provider at all', hitsOf('speech').length === 5, hitsOf('speech').length);
    ok('and without delay', Date.now() - t0 < 1500, Date.now() - t0);
    const report = await A.get('/api/admin/integrations');
    const s = report.body.outsideCalls.find((x) => x.service === 'speech');
    ok('the integration report shows the provider as not being called', s?.state === 'OPEN' && s.refusedByBreaker >= 4 && s.failed >= 5, JSON.stringify(s));
    ok('orders are not affected while the provider is down', (await A.post('/api/orders', B.orderBody([B.line(10)]), 'csr')).status === 201);
    setMode('speech', { status: 200 });
    await sleep(3200);
    const back = await speak();
    ok('after the rest it is tried again and works', back.status === 200, back.status);
    const s2 = (await A.get('/api/admin/integrations')).body.outsideCalls.find((x) => x.service === 'speech');
    ok('and the report shows it healthy', s2?.state === 'CLOSED', s2?.state);
  });

  await scenario(G4, 'the AI provider fails: one repeat at most, then a plain answer with nothing from the provider in it', async (ok) => {
    const ask = () => raw('POST', '/api/ai/assistant', { messages: [{ role: 'user', content: 'hello' }] }, 'csr');
    setMode('ai', { status: 200 });
    const good = await ask();
    ok('with the provider up the assistant answers', good.status === 200 && good.body.content === 'QA stand-in answer', `${good.status} ${JSON.stringify(good.body).slice(0, 200)}`);
    setMode('ai', { status: 500, body: JSON.stringify({ error: { message: 'internal provider detail sk-SECRETKEY' } }) });
    clearHits('ai');
    const bad = await ask();
    ok('a failing provider gives 502', bad.status === 502, `${bad.status} ${JSON.stringify(bad.body)}`);
    ok('it was tried twice, not more', hitsOf('ai').length === 2, hitsOf('ai').length);
    ok("the provider's own words are not passed on", !/SECRETKEY|provider detail/.test(JSON.stringify(bad.body)) && plain(bad.body.error));
    setMode('ai', { status: 400, body: JSON.stringify({ error: { message: 'bad request' } }) });
    clearHits('ai');
    const refused = await ask();
    ok('a request the provider refuses is not repeated', hitsOf('ai').length === 1 && refused.status === 502, `${hitsOf('ai').length} ${refused.status}`);
    setMode('ai', { status: 200, delayMs: 4000 });
    const t0 = Date.now();
    const slow = await ask();
    ok('a provider that hangs is given up on', [502, 503, 504].includes(slow.status) && Date.now() - t0 < 9000, `${slow.status} in ${Date.now() - t0} ms`);
    setMode('ai', { status: 200 });
    await sleep(3200);
  });

  await scenario(G4, 'a webhook address must be one this server may call', async (ok) => {
    const { targetProblem, privateAddress } = await import('../../src/backend/src/services/webhookService.js');
    const prod = { production: true };
    for (const url of ['http://example.com/hook', 'https://localhost/hook', 'https://127.0.0.1/hook', 'https://10.1.2.3/hook', 'https://192.168.1.5/h', 'https://169.254.169.254/latest/meta-data', 'https://[::1]/h', 'https://app.internal/h', 'https://user:pw@example.com/h', 'ftp://example.com/x', 'not a url']) {
      ok(`in production, ${url} is refused`, Boolean(targetProblem(url, prod)));
    }
    ok('in production, a public https address is accepted', targetProblem('https://hooks.example.com/steelwise', prod) === null);
    ok('private ranges are recognised', ['10.0.0.1', '172.16.0.1', '192.168.0.1', '127.0.0.1', '169.254.1.1', '::1', 'fd00::1'].every(privateAddress) && !privateAddress('8.8.8.8'));
    // Through the API: a production key may not register a plain-http or private address.
    await prisma.partner.update({ where: { id: PSUP.id }, data: { productionEnabled: true } });
    const k = await A.post(`/api/v1/admin/partners/${PSUP.id}/keys`, { keyName: tag('PROD'), environment: 'production' });
    const t = await http1('POST', '/api/v1/partner/auth/token', { body: { grant_type: 'client_credentials', client_id: k.body.clientId, client_secret: k.body.clientSecret } });
    const bad = await partnerCall(t.body.access_token, 'POST', '/webhooks', { url: hookUrl('prod'), events: ['po.issued'] });
    ok('a production key cannot subscribe a local address', bad.status === 400 && errShape(bad), `${bad.status} ${JSON.stringify(bad.body)}`);
    const badEvent = await PSUP.call('POST', '/webhooks', { url: hookUrl('x'), events: ['invoice.issued'] });
    ok('a supplier cannot subscribe to customer events', badEvent.status === 400 && /Invalid events/.test(badEvent.body.error.message));
    const short = await PSUP.call('POST', '/webhooks', { url: hookUrl('x'), events: ['po.issued'], secret: 'short' });
    ok('a signing secret that is too short is refused', short.status === 400, short.status);
  });

  await scenario(G4, 'a partner address that redirects is not followed', async (ok) => {
    const hook = await subscribe(PA, ['shipment.dispatched']);
    setMode(hook.name, { redirect: `${STUB}/hook/elsewhere` });
    const { shipment } = await B.readyToShip(100);
    await B.dispatch(shipment);
    const row = await until(async () => { const [r] = await deliveriesOf(hook.id); return r?.attempts === 1 && r.status === 'RETRYING' ? r : null; });
    ok('the redirect counts as a failed attempt', row?.httpStatus === 302, JSON.stringify(row)?.slice(0, 200));
    ok('the address it pointed to was never called', hitsOf('hook:elsewhere').length === 0);
    setMode(hook.name, { status: 200 });
  });

  await scenario(G4, 'a forged, altered or old event fails the signature check a receiver would make', async (ok) => {
    const { verifyTimedSignature, generateSignature } = await import('../../src/backend/src/services/webhookService.js');
    const hook = await subscribe(PA, ['shipment.dispatched']);
    setMode(hook.name, { status: 200 });
    const { shipment } = await B.readyToShip(100);
    await B.dispatch(shipment);
    const hit = await until(async () => hitsOf(hook.name)[0]);
    const header = hit.headers['x-steelwise-signature-timestamp'];
    ok('the real event verifies', verifyTimedSignature(hook.secret, hit.body, header));
    ok('an altered body does not', !verifyTimedSignature(hook.secret, hit.body.replace('IN_TRANSIT', 'DELIVERED'), header));
    ok('a different secret does not', !verifyTimedSignature('whsec_wrong_secret_wrong_secret', hit.body, header));
    ok('the same event presented ten minutes later does not', !verifyTimedSignature(hook.secret, hit.body, header, { now: Date.now() + 600_000 }));
    ok('a missing or malformed header does not', !verifyTimedSignature(hook.secret, hit.body, '') && !verifyTimedSignature(hook.secret, hit.body, 't=abc,v1=zz'));
    ok('the body-only signature is still sent for receivers that use it', hit.headers['x-steelwise-signature'] === generateSignature(hit.body, hook.secret));
    const list = await PA.call('GET', '/webhooks');
    ok('the signing secret is shown once and never again', !JSON.stringify(list.body).includes(hook.secret));
  });

  await scenario(G4, "a partner's test event goes to that one address and reports honestly", async (ok) => {
    const hook = await subscribe(PA, ['invoice.issued']);
    const other = await subscribe(PA, ['invoice.issued']);
    setMode(hook.name, { status: 200, body: 'x'.repeat(5000) });
    const good = await PA.call('POST', `/webhooks/${hook.id}/test`, {});
    ok('a test is delivered and says so', good.status === 200 && good.body.delivered === true, JSON.stringify(good.body).slice(0, 200));
    ok('only the tested address was called', hitsOf(hook.name).length === 1 && hitsOf(other.name).length === 0);
    const [row] = await deliveriesOf(hook.id);
    ok("the partner's reply is kept, cut to a safe length", row.responseBody.length === 1000);
    setMode(hook.name, { status: 500 });
    const bad = await PA.call('POST', `/webhooks/${hook.id}/test`, {});
    ok('a failed test says it was not delivered, with the reason', bad.status === 200 && bad.body.delivered === false && bad.body.delivery.httpStatus === 500, JSON.stringify(bad.body).slice(0, 200));
    const foreign = await PB.call('POST', `/webhooks/${hook.id}/test`, {});
    ok("another partner cannot test someone else's subscription", foreign.status === 404);
  });

  await scenario(G4, 'services that are not connected say so instead of pretending', async (ok) => {
    const report = await A.get('/api/admin/integrations');
    const by = Object.fromEntries(report.body.integrations.map((i) => [i.name, i]));
    for (const name of ['Email', 'Text messages', 'Card payments', 'Carrier rates and labels', 'Sales tax service', 'Accounting system']) {
      ok(`${name} is listed as not connected, with what that means`, by[name]?.state === 'NOT CONNECTED' && by[name].ifDown.length > 20, JSON.stringify(by[name]));
    }
    const receipt = await A.post('/api/pos/quick-sale/email-receipt', { saleId: 'x', email: 'someone@example.com' });
    ok('emailing a receipt answers "not available", not a false success', receipt.status === 501, `${receipt.status} ${JSON.stringify(receipt.body).slice(0, 120)}`);
    for (const [m, path, P] of [['GET', '/supplier/asn', PSUP], ['POST', '/supplier/asn', PSUP], ['GET', '/supplier/scorecard', PSUP], ['GET', '/supplier/scars', PSUP], ['POST', '/supplier/documents', PSUP]]) {
      const r = await P.call(m, path, m === 'POST' ? {} : undefined);
      ok(`${m} ${path} answers 501 with a reason`, r.status === 501 && r.body.error.code === 'NOT_AVAILABLE', `${r.status} ${JSON.stringify(r.body).slice(0, 120)}`);
    }
    ok('nothing left the server for any of these', stub.hits.filter((h) => !h.name.startsWith('hook:') && !['speech', 'ai'].includes(h.name)).length === 0);
  });

  await scenario(G4, 'with the database unreachable the server says so and gives nothing away', async (ok) => {
    const { spawn } = await import('node:child_process');
    const port = 3019;
    const child = spawn('node', ['src/server.js'], { cwd: 'src/backend', env: { ...process.env, PORT: String(port), DATABASE_URL: 'postgresql://postgres:password@127.0.0.1:1/steelwise_qa_down', DIRECT_URL: 'postgresql://postgres:password@127.0.0.1:1/steelwise_qa_down', LOG_REQUESTS: 'off' }, stdio: 'ignore' });
    try {
      const up = await until(async () => fetch(`http://localhost:${port}/api/health`).then((r) => r.status).catch(() => null), { ms: 15000, every: 300 });
      ok('health answers 503 "degraded"', up === 503, up);
      const h = await http1('GET', `http://localhost:${port}/api/health`);
      ok('and says the database is unreachable, without the address or the error', h.body.status === 'degraded' && h.body.database === 'unreachable' && !/127\.0\.0\.1|password|ECONN/.test(h.raw), h.raw);
      const login = await http1('POST', `http://localhost:${port}/api/auth/login`, { body: { email: 'qa-admin@qa.test', password: QA_PASSWORD } });
      ok('sign-in fails with a server error, not a wrong-password answer', login.status >= 500 && login.status < 600, login.status);
      ok('the reply names no table, address or stack', plain(login.raw) && !/127\.0\.0\.1|5432|ECONNREFUSED/.test(login.raw), login.raw.slice(0, 200));
    } finally { child.kill('SIGTERM'); }
  });
}

// ══ 5. Repeats, retries and races ═══════════════════════════════════════════════════════
const G5 = 'Idempotency, retries and concurrency';
if (want(5)) {
  const key = () => `qa-${run}-${tag('K')}`;

  await scenario(G5, 'the answer is lost after the server saved: the retry gets the same order back, not a second one', async (ok) => {
    const body = B.orderBody([B.line(123)]);
    const k = key();
    // The browser sends the request and the connection drops before any answer arrives.
    await sendAndHangUp('POST', '/api/orders', body, { Authorization: `Bearer ${await tokenOf('csr')}`, 'Idempotency-Key': k });
    const saved = await until(async () => prisma.order.findFirst({ where: { poReference: body.poReference } }), { ms: 8000 });
    ok('the server finished the work although nobody was listening', Boolean(saved));
    const keyRow = await until(async () => { const r = await prisma.requestKey.findFirst({ where: { key: k } }); return r?.status === 'DONE' ? r : null; });
    ok('and kept the answer under the request key', keyRow?.status === 'DONE' && keyRow.responseStatus === 201, JSON.stringify(keyRow)?.slice(0, 150));
    // The user presses Save again; the screen sends the same key.
    const retry = await raw('POST', '/api/orders', body, 'csr', { 'Idempotency-Key': k });
    ok('the retry is answered with the first result', retry.status === 201 && retry.replayed && retry.body.id === saved.id, `${retry.status} replayed=${retry.replayed} ${retry.body?.id} vs ${saved?.id}`);
    ok('there is one order, not two', (await prisma.order.count({ where: { poReference: body.poReference } })) === 1);
    ok('the answer names the order, so the screen can show the true outcome', retry.body.orderNumber === saved.orderNumber);
  });

  await scenario(G5, 'the same key with a different request is refused, and the same key from another person is their own request', async (ok) => {
    const { order, shipment } = await B.readyToShip(500);
    await B.dispatch(shipment);
    const [invoice] = await B.invoicesOf(order.id);
    const k = key();
    const first = await raw('POST', `/api/invoices/${invoice.id}/payments`, { amount: 100, paymentMethod: 'CHECK', referenceNumber: 'QA-A' }, 'csr', { 'Idempotency-Key': k });
    ok('the first payment is recorded', first.status === 201, `${first.status} ${JSON.stringify(first.body).slice(0, 120)}`);
    const changed = await raw('POST', `/api/invoices/${invoice.id}/payments`, { amount: 150, paymentMethod: 'CHECK', referenceNumber: 'QA-A' }, 'csr', { 'Idempotency-Key': k });
    ok('the same key with another amount is refused with 422', changed.status === 422 && /different request/.test(changed.body.error), `${changed.status} ${JSON.stringify(changed.body)}`);
    const same = await raw('POST', `/api/invoices/${invoice.id}/payments`, { amount: 100, paymentMethod: 'CHECK', referenceNumber: 'QA-A' }, 'csr', { 'Idempotency-Key': k });
    ok('the same key with the same request gets the first answer', same.status === 201 && same.replayed && same.body.id === first.body.id);
    const other = await raw('POST', `/api/invoices/${invoice.id}/payments`, { amount: 100, paymentMethod: 'CHECK', referenceNumber: 'QA-A' }, 'admin', { 'Idempotency-Key': k });
    ok('the same key from another person is a separate payment', other.status === 201 && !other.replayed);
    const paid = await prisma.invoice.findUnique({ where: { id: invoice.id }, include: { payments: true } });
    ok('two payments on file, 200 paid: nothing doubled, nothing lost', paid.payments.length === 2 && num(paid.paidAmount) === 200, `${paid.payments.length} ${paid.paidAmount}`);
    const bad = await raw('POST', `/api/invoices/${invoice.id}/payments`, { amount: 1, paymentMethod: 'CHECK' }, 'csr', { 'Idempotency-Key': 'short' });
    ok('a key that is too short is refused before anything runs', bad.status === 400 && (await prisma.payment.count({ where: { invoiceId: invoice.id } })) === 2);
  });

  await scenario(G5, 'ten copies of one payment at the same moment record one payment', async (ok) => {
    const { order, shipment } = await B.readyToShip(400);
    await B.dispatch(shipment);
    const [invoice] = await B.invoicesOf(order.id);
    const k = key();
    const all = await Promise.all(Array.from({ length: 10 }, () => raw('POST', `/api/invoices/${invoice.id}/payments`, { amount: 60, paymentMethod: 'CHECK', referenceNumber: 'QA-TEN' }, 'csr', { 'Idempotency-Key': k })));
    const made = all.filter((r) => r.status === 201 && !r.replayed).length;
    ok('exactly one ran', made === 1, all.map((r) => `${r.status}${r.replayed ? 'r' : ''}`).join());
    ok('the rest were told it is in progress (409) or got the first answer back', all.every((r) => r.status === 409 || r.status === 201), all.map((r) => r.status).join());
    const paid = await prisma.invoice.findUnique({ where: { id: invoice.id }, include: { payments: true } });
    ok('one payment of 60 is on file', paid.payments.length === 1 && num(paid.paidAmount) === 60, `${paid.payments.length} ${paid.paidAmount}`);
    const later = await raw('POST', `/api/invoices/${invoice.id}/payments`, { amount: 60, paymentMethod: 'CHECK', referenceNumber: 'QA-TEN' }, 'csr', { 'Idempotency-Key': k });
    ok('a late copy still does not pay twice', later.replayed && (await prisma.payment.count({ where: { invoiceId: invoice.id } })) === 1);
    // Without a key (an older caller): the balance rule is what stops an overpayment.
    const rest = num(paid.totalAmount) - 60;
    const race = await Promise.all([1, 2, 3, 4].map(() => A.post(`/api/invoices/${invoice.id}/payments`, { amount: rest, paymentMethod: 'CHECK' }, 'csr')));
    const end = await prisma.invoice.findUnique({ where: { id: invoice.id }, include: { payments: true } });
    ok('four keyless payments of the whole balance at once: one is taken, the invoice is never overpaid', race.filter((r) => r.status === 201).length === 1 && Math.abs(num(end.paidAmount) - num(end.totalAmount)) < 0.005 && end.status === 'PAID', `${race.map((r) => r.status).join()} paid ${end.paidAmount} of ${end.totalAmount}`);
  });

  await scenario(G5, 'a shipment dispatched from two screens at once leaves once', async (ok) => {
    const hook = await subscribe(PA, ['shipment.dispatched', 'invoice.issued']);
    setMode(hook.name, { status: 200 });
    const { order, shipment, coilId } = await B.readyToShip(350);
    const all = await Promise.all([1, 2, 3, 4, 5].map(() => B.dispatch(shipment)));
    ok('one dispatch succeeds, four are refused', all.filter((r) => r.status === 200).length === 1 && all.filter((r) => r.status === 409).length === 4, all.map((r) => r.status).join());
    ok('stock left once', (await prisma.materialMovement.count({ where: { shipmentId: shipment.id, movementType: 'SHIP' } })) === 1 && num((await prisma.inventory.findUnique({ where: { coilId } })).qtyOnHand) === 500);
    ok('the line shipped once', num((await prisma.orderLine.findUnique({ where: { id: order.lines[0].id } })).qtyShipped) === 350);
    ok('one invoice', (await B.invoicesOf(order.id)).length === 1);
    await until(async () => (await deliveriesOf(hook.id)).length >= 2);
    await sleep(300);
    const rows = await deliveriesOf(hook.id);
    ok('one dispatched event and one invoice event', rows.filter((r) => r.eventType === 'shipment.dispatched').length === 1 && rows.filter((r) => r.eventType === 'invoice.issued').length === 1, rows.map((r) => r.eventType).join());
  });

  await scenario(G5, "a partner's repeat is run once, and one partner's key never answers another", async (ok) => {
    const k = key();
    const body = { items: [{ description: `QA partner repeat ${run}`, quantity: 5, unit: 'EA' }], notes: 'same body from both partners' };
    const a1 = await PA.call('POST', '/customer/rfqs', body, { 'Idempotency-Key': k });
    const a2 = await PA.call('POST', '/customer/rfqs', body, { 'Idempotency-Key': k });
    ok('partner A: created once', a1.status === 201 && a2.status === 201 && a2.replayed && a2.body.id === a1.body.id, `${a1.status} ${a2.status} replayed=${a2.replayed}`);
    const b1 = await PB.call('POST', '/customer/rfqs', body, { 'Idempotency-Key': k });
    ok('partner B, same key and same body: its own request, not A\'s answer', b1.status === 201 && !b1.replayed && b1.body.id !== a1.body.id, `${b1.status} replayed=${b1.replayed}`);
    const [ra, rb] = await Promise.all([prisma.rFQ.findUnique({ where: { id: a1.body.id } }), prisma.rFQ.findUnique({ where: { id: b1.body.id } })]);
    ok('each request belongs to the partner that sent it', ra.customerId === custA.id && rb.customerId === custB.id);
    const diff = await PA.call('POST', '/customer/rfqs', { ...body, notes: 'changed' }, { 'Idempotency-Key': k });
    ok('partner A, same key, different body: 422', diff.status === 422, diff.status);
    const five = await Promise.all([1, 2, 3, 4, 5].map(() => PA.call('POST', '/customer/rfqs', { ...body, notes: `burst ${run}` }, { 'Idempotency-Key': `${k}-burst` })));
    ok('five at once with one key: one request for quote', (await prisma.rFQ.count({ where: { customerId: custA.id, notes: { contains: `burst ${run}` } } })) === 1, five.map((r) => r.status).join());
    const scopes = await prisma.requestKey.findMany({ where: { key: k } });
    ok('the keys are filed under each partner, not under "anonymous"', scopes.length === 2 && scopes.every((s) => s.scope.startsWith('partner:')) && new Set(scopes.map((s) => s.scope)).size === 2, scopes.map((s) => s.scope.slice(0, 20)).join());
  });

  await scenario(G5, 'a quote accepted by the customer and the sales desk at the same moment makes one order', async (ok) => {
    const rfq = await A.post('/api/rfqs', { customerId: custA.id, lines: [{ description: `QA race ${run}`, requestedQty: 100, unit: 'LB' }] }, 'csr');
    const q = await A.post('/api/quotes', { rfqId: rfq.body.id, lines: [{ rfqLineId: rfq.body.lines[0].id, description: 'QA race', quantity: 100, unit: 'LB', unitPrice: 1, priceUnit: 'LB' }] }, 'csr');
    await A.post(`/api/quotes/${q.body.id}/send`, {}, 'csr');
    const all = await Promise.all([
      PA.call('POST', `/customer/quotes/${q.body.id}/respond`, { action: 'accept' }),
      PA.call('POST', `/customer/quotes/${q.body.id}/respond`, { action: 'accept' }),
      A.post(`/api/quotes/${q.body.id}/accept`, {}, 'csr'),
      PA.call('POST', `/customer/quotes/${q.body.id}/respond`, { action: 'reject', reason: 'changed my mind' }),
    ]);
    ok('one answer wins', all.filter((r) => ok2(r)).length === 1, all.map((r) => r.status).join());
    ok('the others are refused, not failed', all.filter((r) => r.status === 409).length === 3, all.map((r) => r.status).join());
    const orders = await prisma.order.count({ where: { notes: { contains: q.body.quoteNumber } } });
    const quote = await prisma.quote.findUnique({ where: { id: q.body.id } });
    ok('the quote ends in one state, and an order exists only if it was accepted', (quote.status === 'ACCEPTED' && orders === 1 && quote.convertedOrderId) || (quote.status === 'REJECTED' && orders === 0), `${quote.status} orders=${orders}`);
  });

  await scenario(G5, 'a carrier reports "delivered" twice, and again late: one delivery, the rest recognised', async (ok) => {
    const { shipment } = await B.readyToShip(200, { carrierId: carrierOrg.id });
    await B.dispatch(shipment);
    const both = await Promise.all([1, 2, 3].map(() => PCAR.call('POST', `/carrier/shipments/${shipment.id}/status`, { status: 'DELIVERED', signedBy: 'Dock' })));
    ok('all three are answered without a server error', both.every((r) => r.status === 200 || r.status === 409), both.map((r) => r.status).join());
    ok('the shipment was delivered once', (await prisma.auditLog.count({ where: { resourceId: shipment.id, eventType: 'SHIPMENT_STATUS_CHANGED', details: { path: ['to'], equals: 'DELIVERED' } } })) === 1);
    const again = await PCAR.call('POST', `/carrier/shipments/${shipment.id}/status`, { status: 'DELIVERED' });
    ok('a later repeat answers 200 and says it is a duplicate', again.status === 200 && again.body.duplicate === true, JSON.stringify(again.body));
    const stale = await PCAR.call('POST', `/carrier/shipments/${shipment.id}/status`, { status: 'IN_TRANSIT', location: 'late report' });
    ok('an older status arriving after delivery is refused and changes nothing', stale.status === 409 && stale.body.error.code === 'ALREADY_DELIVERED' && (await prisma.shipment.findUnique({ where: { id: shipment.id } })).status === 'DELIVERED', `${stale.status} ${JSON.stringify(stale.body)}`);
    const ex = await PCAR.call('POST', '/carrier/exceptions', { shipmentId: shipment.id, type: 'DAMAGE', description: 'late' });
    ok('an exception after delivery is refused too', ex.status === 409, ex.status);
  });

  await scenario(G5, 'receiving, transfers, credits and work order completion are each done once when sent twice', async (ok) => {
    // Receiving with a key.
    const rb = B.receiptBody({ weightLb: 2222 }); const k1 = key();
    const r = await Promise.all([1, 2, 3].map(() => raw('POST', '/api/inventory/receipts', rb, 'admin', { 'Idempotency-Key': k1 })));
    ok('a receipt sent three times is one item', (await prisma.coil.count({ where: { coilNumber: rb.coilNumber } })) === 1 && r.some((x) => x.status === 201), r.map((x) => x.status).join());
    const coil = await prisma.coil.findUnique({ where: { coilNumber: rb.coilNumber } });
    ok('with one receipt movement', (await prisma.materialMovement.count({ where: { coilId: coil.id, movementType: 'RECEIVE' } })) === 1);
    // The same item number without a key: the unique number is the last line of defence.
    const dup = await A.post('/api/inventory/receipts', rb);
    ok('the same item number again, with no key, is refused', dup.status >= 400 && dup.status < 500 && (await prisma.coil.count({ where: { coilNumber: rb.coilNumber } })) === 1, dup.status);
    // Transfer with a key.
    const k2 = key(); const tb = { coilId: coil.id, fromLocationId: L1.id, toLocationId: L2.id };
    const t = await Promise.all([1, 2].map(() => raw('POST', '/api/inventory/transfer', tb, 'admin', { 'Idempotency-Key': k2 })));
    ok('a transfer sent twice moves the item once', (await prisma.materialMovement.count({ where: { coilId: coil.id, movementType: 'TRANSFER' } })) === 1 && (await prisma.coil.findUnique({ where: { id: coil.id } })).locationId === L2.id, t.map((x) => x.status).join());
    // Credit with a key.
    const { order, shipment } = await B.readyToShip(300);
    await B.dispatch(shipment);
    const [invoice] = await B.invoicesOf(order.id);
    const k3 = key(); const cb = { reason: 'QA short shipment', lines: [{ invoiceLineId: invoice.lines[0].id, quantity: 50 }] };
    const c = await Promise.all([1, 2, 3].map(() => raw('POST', `/api/invoices/${invoice.id}/credit`, cb, 'admin', { 'Idempotency-Key': k3 })));
    const memos = (await B.invoicesOf(order.id)).filter((i) => i.kind === 'CREDIT');
    ok('a credit sent three times is one credit memo', memos.length === 1, `${c.map((x) => x.status).join()} memos=${memos.length}`);
    // Work order completion: its own state is the guard.
    const src = await B.received({ weightLb: 1000 });
    const wo = await A.post('/api/work-orders', { woType: 'SLIT', sourceCoilId: src, priority: 3, notes: `QA phase 4 ${run}` });
    for (const stepName of ['release', 'start']) await A.put(`/api/work-orders/${wo.body.id}/${stepName}`, {});
    const done = await Promise.all([1, 2, 3].map(() => A.put(`/api/work-orders/${wo.body.id}/complete`, { outputWeightLb: 900, scrapWeightLb: 100 })));
    ok('a work order completed three times at once completes once', done.filter((x) => x.status === 200).length === 1, done.map((x) => x.status).join());
    ok('one piece, 900 lb, and the source at zero', (await prisma.coil.count({ where: { parentCoilId: src } })) === 1 && num((await prisma.inventory.findUnique({ where: { coilId: src } })).qtyOnHand) === 0);
  });

  await scenario(G5, 'a purchase order and a sales order created with a key are each created once', async (ok) => {
    for (const [type, extra] of [['PO', { sellerId: supplierOrg.id, buyerId: undefined }], ['SO', {}]]) {
      const body = { ...B.orderBody([B.line(50)]), orderType: type, ...extra };
      if (type === 'PO') delete body.buyerId;
      const k = key();
      const all = await Promise.all([1, 2, 3, 4].map(() => raw('POST', '/api/orders', body, 'admin', { 'Idempotency-Key': k })));
      const n = await prisma.order.count({ where: { poReference: body.poReference } });
      ok(`${type}: four copies, one order`, n === 1 && all.some((r) => r.status === 201), `${all.map((r) => r.status).join()} n=${n}`);
    }
  });

  await scenario(G5, 'a request whose first attempt died is taken over once, not twice', async (ok) => {
    const body = B.orderBody([B.line(77)]);
    const k = key();
    const csr = w.users.csr;
    const { bodyHashOf } = await import('../../src/backend/src/middleware/requestKeys.js');
    // What a server that stopped mid-request leaves behind: the key claimed, no answer, two minutes ago.
    await prisma.requestKey.create({ data: { scope: `${csr.id} POST /api/orders`, key: k, bodyHash: bodyHashOf(body), status: 'IN_PROGRESS', createdAt: new Date(Date.now() - 120_000) } });
    const all = await Promise.all([1, 2, 3].map(() => raw('POST', '/api/orders', body, 'csr', { 'Idempotency-Key': k })));
    ok('one of three retries takes the abandoned request over and runs it', all.filter((r) => r.status === 201 && !r.replayed).length === 1, all.map((r) => `${r.status}${r.replayed ? 'r' : ''}`).join());
    ok('one order exists', (await prisma.order.count({ where: { poReference: body.poReference } })) === 1);
    // A claim that is still fresh is not taken over.
    const k2 = key(); const body2 = B.orderBody([B.line(78)]);
    await prisma.requestKey.create({ data: { scope: `${csr.id} POST /api/orders`, key: k2, bodyHash: bodyHashOf(body2), status: 'IN_PROGRESS' } });
    const busy = await raw('POST', '/api/orders', body2, 'csr', { 'Idempotency-Key': k2 });
    ok('a request that is still running is not run a second time', busy.status === 409 && (await prisma.order.count({ where: { poReference: body2.poReference } })) === 0, busy.status);
    await prisma.requestKey.deleteMany({ where: { key: k2 } });
  });
}

// ══ 6. Security, isolation and recovery ══════════════════════════════════════════════════
const G6 = 'Security, isolation and recovery';
if (want(6)) {
  // Something of each kind for customer A, B, and each carrier.
  const a = await B.readyToShip(150, { customer: custA, carrierId: carrierOrg.id });
  const b = await B.readyToShip(150, { customer: custB, carrierId: carrierOrg2.id });
  await B.dispatch(a.shipment); await B.dispatch(b.shipment);
  const [invB] = await B.invoicesOf(b.order.id);

  await scenario(G6, "one customer's system cannot read another customer's records", async (ok) => {
    for (const [what, path] of [['order', `/customer/orders/${b.order.id}`], ['order milestones', `/customer/orders/${b.order.id}/milestones`], ['shipment', `/customer/shipments/${b.shipment.id}`]]) {
      const r = await PA.call('GET', path);
      ok(`another customer's ${what} answers 404, the same as one that does not exist`, r.status === 404 && r.body.error.code === 'NOT_FOUND', `${r.status}`);
    }
    for (const path of ['/customer/orders', '/customer/shipments', '/customer/invoices', '/customer/quotes', '/customer/rfqs']) {
      const mine = await PA.call('GET', `${path}?limit=100`);
      const text = JSON.stringify(mine.body);
      ok(`${path}: nothing of customer B in customer A's list`, mine.status === 200 && !text.includes(b.order.id) && !text.includes(b.order.orderNumber) && !text.includes(invB.invoiceNumber) && !text.includes(b.shipment.id));
    }
    const own = await PB.call('GET', `/customer/orders/${b.order.id}`);
    ok('customer B reads its own order', own.status === 200 && own.body.orderNumber === b.order.orderNumber);
    const doc = await prisma.document.create({ data: { documentType: 'MTR', fileName: 'qa-mtr.pdf', storagePath: 'database', ownerId: custB.id, title: `QA ${run}`, blob: { create: { data: Buffer.from('%PDF-QA') } } } });
    ok("customer A cannot list or download customer B's document", !(JSON.stringify((await PA.call('GET', '/customer/documents?limit=100')).body)).includes(doc.id) && (await PA.call('GET', `/customer/documents/${doc.id}/download`)).status === 404);
    const dl = await http1('GET', `/api/v1/partner/customer/documents/${doc.id}/download`, { token: PB.token, text: true });
    ok('customer B downloads its own', dl.status === 200 && dl.raw === '%PDF-QA');
    // A partner cannot pass another organisation's id in the body.
    const forged = await PA.call('POST', '/customer/rfqs', { customerId: custB.id, organizationId: custB.id, items: [{ description: 'forged owner', quantity: 1 }] });
    ok('a request for quote that names another customer is still filed under the sender', forged.status === 201 && (await prisma.rFQ.findUnique({ where: { id: forged.body.id } })).customerId === custA.id);
  });

  await scenario(G6, 'a carrier sees only its own loads, and no prices', async (ok) => {
    const mine = await PCAR.call('GET', '/carrier/shipments?limit=100');
    ok('its own shipment is listed', mine.body.data.some((s) => s.id === a.shipment.id));
    ok("another carrier's is not", !mine.body.data.some((s) => s.id === b.shipment.id));
    ok('a shipment with no carrier assigned is not', !mine.body.data.some((s) => !s.id) && mine.body.pagination.total === await prisma.shipment.count({ where: { carrierId: carrierOrg.id } }));
    for (const [m, path, body] of [['GET', `/carrier/shipments/${b.shipment.id}`], ['POST', `/carrier/shipments/${b.shipment.id}/status`, { status: 'DELIVERED' }], ['POST', `/carrier/shipments/${b.shipment.id}/pod`, { signedBy: 'x' }], ['POST', '/carrier/exceptions', { shipmentId: b.shipment.id, description: 'x' }]]) {
      const r = await PCAR.call(m, path, body);
      ok(`${m} ${path.replace(b.shipment.id, ':other')}: 404`, r.status === 404, r.status);
    }
    ok("the other carrier's shipment was not touched", (await prisma.shipment.findUnique({ where: { id: b.shipment.id } })).status === 'IN_TRANSIT');
    const one = await PCAR.call('GET', `/carrier/shipments/${a.shipment.id}`);
    const text = JSON.stringify(one.body);
    ok('the load shows where from, where to, what and how heavy', one.body.origin?.code === 'QA-L01' && one.body.destination?.name === custA.name && one.body.items[0].quantity === 150);
    ok('and no price, total, credit terms or customer id', !/unitPrice|extendedPrice|totalAmount|paymentTerms|creditLimit|buyerId/.test(text), text.slice(0, 200));
    const perf = await PCAR.call('GET', '/carrier/performance');
    ok('its performance counts only its own shipments', perf.status === 200 && perf.body.total === await prisma.shipment.count({ where: { carrierId: carrierOrg.id } }));
  });

  await scenario(G6, 'scopes and partner types are enforced on every kind of route', async (ok) => {
    const RO = await partner(custC, 'CUSTOMER', { scopes: ['orders:read'] });
    ok('a key with only orders:read reads orders', (await RO.call('GET', '/customer/orders')).status === 200);
    for (const [m, path, body] of [['GET', '/customer/invoices'], ['GET', '/customer/quotes'], ['GET', '/customer/shipments'], ['GET', '/customer/documents'], ['POST', '/customer/rfqs', { items: [{ description: 'x', quantity: 1 }] }], ['POST', '/customer/quotes/00000000-0000-4000-8000-000000000000/respond', { action: 'accept' }]]) {
      const r = await RO.call(m, path, body);
      ok(`${m} ${path.split('/').slice(0, 3).join('/')}: 403 INSUFFICIENT_SCOPE`, r.status === 403 && r.body.error.code === 'INSUFFICIENT_SCOPE', `${r.status} ${JSON.stringify(r.body).slice(0, 100)}`);
    }
    ok('nothing was created by the refused write', (await prisma.rFQ.count({ where: { customerId: custC.id, lines: { some: { description: 'x' } } } })) === 0);
    for (const [P, path] of [[PA, '/carrier/shipments'], [PA, '/supplier/purchase-orders'], [PCAR, '/customer/orders'], [PCAR, '/supplier/purchase-orders'], [PSUP, '/customer/invoices'], [PSUP, '/carrier/shipments']]) {
      const r = await P.call('GET', path);
      ok(`a ${P.type.toLowerCase()} on ${path}: 403 WRONG_PARTNER_TYPE`, r.status === 403 && r.body.error.code === 'WRONG_PARTNER_TYPE', r.status);
    }
    const bad = await A.post(`/api/v1/admin/partners/${PCAR.id}/keys`, { keyName: 'x', scopes: ['invoices:read'] });
    ok('a carrier key cannot be given a customer scope', bad.status === 400, bad.status);
    ok('only administrators create partners and keys', (await A.post('/api/v1/admin/partners', { organizationId: custC.id, partnerType: 'CARRIER' }, 'csr')).status === 403);
  });

  await scenario(G6, 'staff and partner credentials do not work on each other\'s API', async (ok) => {
    const staff = await tokenOf('admin');
    const viaStaff = await partnerCall(staff, 'GET', '/customer/orders');
    ok('a staff token is refused by the partner API', viaStaff.status === 401, viaStaff.status);
    for (const url of ['/api/orders', '/api/inventory', '/api/invoices', '/api/admin/integrations', '/api/users']) {
      const r = await http1('GET', url, { token: PA.token });
      ok(`a partner token is refused by ${url}`, r.status === 401, r.status);
    }
    const custLogin = await raw('GET', '/api/v1/admin/partners', undefined, 'custA');
    ok('a customer portal login cannot list partners', custLogin.status === 403, custLogin.status);
    const tampered = PA.token.split('.'); tampered[1] = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(tampered[1], 'base64url').toString()), partner_id: PB.id, org_id: custB.id })).toString('base64url');
    ok('a token whose contents were changed is refused', (await partnerCall(tampered.join('.'), 'GET', '/customer/orders')).status === 401);
    const none = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url') + '.' + PA.token.split('.')[1] + '.';
    ok('an unsigned token is refused', (await partnerCall(none, 'GET', '/customer/orders')).status === 401);
  });

  await scenario(G6, 'a revoked key, a suspended partner and a wrong secret all stop at once and say the same little', async (ok) => {
    const P = await partner(custC, 'CUSTOMER');
    ok('the key works', (await P.call('GET', '/customer/orders')).status === 200);
    const wrong = await http1('POST', '/api/v1/partner/auth/token', { body: { grant_type: 'client_credentials', client_id: P.keyId, client_secret: 'sk_test_wrong' } });
    const unknown = await http1('POST', '/api/v1/partner/auth/token', { body: { grant_type: 'client_credentials', client_id: '00000000-0000-4000-8000-000000000000', client_secret: 'sk_test_wrong' } });
    ok('a wrong secret and an unknown key get the same answer', wrong.status === 401 && unknown.status === 401 && JSON.stringify(wrong.body) === JSON.stringify(unknown.body), `${JSON.stringify(wrong.body)} / ${JSON.stringify(unknown.body)}`);
    const obj = await http1('POST', '/api/v1/partner/auth/token', { body: { grant_type: 'client_credentials', client_id: { not: null }, client_secret: { not: null } } });
    ok('an id that is not text is refused, not run as a query', obj.status === 401, obj.status);
    const revoke = await raw('DELETE', `/api/v1/admin/partners/${P.id}/keys/${P.keyId}`, { reason: 'QA' }, 'admin');
    ok('an administrator revokes the key', ok2(revoke), `${revoke.status} ${JSON.stringify(revoke.body).slice(0, 100)}`);
    const after = await P.call('GET', '/customer/orders');
    ok('the token it issued stops working at once, an hour before it would expire', after.status === 401 && after.body.error.code === 'KEY_REVOKED', `${after.status} ${JSON.stringify(after.body)}`);
    const reToken = await http1('POST', '/api/v1/partner/auth/token', { body: { grant_type: 'client_credentials', client_id: P.keyId, client_secret: P.secret } });
    ok('and no new token is issued for it', reToken.status === 401);
    const P2 = await partner(custC, 'CUSTOMER');
    await raw('PUT', `/api/v1/admin/partners/${P2.id}`, { status: 'SUSPENDED' }, 'admin');
    const susp = await P2.call('GET', '/customer/orders');
    ok('a suspended partner is refused on the next call', susp.status === 403 && susp.body.error.code === 'PARTNER_INACTIVE', `${susp.status} ${JSON.stringify(susp.body)}`);
    await prisma.partner.update({ where: { id: P2.id }, data: { status: 'ACTIVE' } });
    const log = await prisma.partnerApiLog.findFirst({ where: { partnerId: P.id, statusCode: 200 }, orderBy: { createdAt: 'desc' } });
    ok('partner calls are logged with the address, never the secret', log && log.endpoint.includes('/customer/orders') && !JSON.stringify(log).includes(P.secret));
  });

  await scenario(G6, 'a partner is slowed down at its limit and told when to come back', async (ok) => {
    // Its own organisation, so no earlier call in this minute counts against it.
    const org = await prisma.organization.create({ data: { code: tag('QA-RL'), name: `QA rate limit ${run}`, type: 'FABRICATOR' } });
    const P = await partner(org, 'CUSTOMER', { limits: false });
    await prisma.partner.update({ where: { id: P.id }, data: { burstLimit: 1000, rateLimitPerMin: 6, rateLimitPerHour: 1000 } });
    const out = [];
    for (let i = 0; i < 12; i += 1) out.push(await P.call('GET', '/customer/orders?limit=1'));
    const limited = out.filter((r) => r.status === 429);
    ok('the first six calls in the minute are served, the rest get 429', limited.length === 6 && out.slice(0, 6).every((r) => r.status === 200), out.map((r) => r.status).join());
    ok('with the error shape and when to retry', limited.every((r) => r.body.error.code === 'RATE_LIMIT_EXCEEDED' && Number(r.headers.get('retry-after')) > 0));
    ok('another partner is not slowed by it', (await PA.call('GET', '/customer/orders?limit=1')).status === 200);
  });

  await scenario(G6, "one partner cannot see, change, test or replay another partner's subscriptions and events", async (ok) => {
    const hook = await subscribe(PA, ['shipment.dispatched']);
    setMode(hook.name, { status: 500 });
    const { shipment } = await B.readyToShip(60);
    await B.dispatch(shipment);
    const row = await until(async () => { const [r] = await deliveriesOf(hook.id); return tried(r) ? r : null; });
    const list = await PB.call('GET', '/webhooks');
    ok("partner B's list does not show A's subscription", !list.body.data.some((x) => x.id === hook.id));
    for (const [m, path, body] of [['PUT', `/webhooks/${hook.id}`, { status: 'PAUSED' }], ['DELETE', `/webhooks/${hook.id}`], ['GET', `/webhooks/${hook.id}/deliveries`], ['POST', `/webhooks/${hook.id}/test`, {}], ['POST', `/webhooks/${hook.id}/deliveries/${row.id}/replay`, {}]]) {
      const r = await PB.call(m, path, body);
      ok(`${m} ${path.split('/').slice(2).map((p, i) => (i % 2 ? p : ':id')).join('/') || 'subscription'}: 404`, r.status === 404, r.status);
    }
    ok("A's subscription is untouched", (await prisma.partnerWebhook.findUnique({ where: { id: hook.id } })).status === 'ACTIVE');
    const own = await PA.call('GET', `/webhooks/${hook.id}/deliveries`);
    ok('partner A sees its own delivery with the reason it failed and when it will be tried again', own.status === 200 && own.body.data[0].id === row.id && own.body.data[0].status === 'RETRYING' && own.body.data[0].nextRetryAt, JSON.stringify(own.body.data[0]).slice(0, 200));
    ok('the delivery list never includes the payload of other partners or any secret', !JSON.stringify(own.body).includes(hook.secret));
    await makeDue(hook.id);
    for (let i = 0; i < 5; i += 1) { await makeDue(hook.id); await runTasks(); }
    setMode(hook.name, { status: 200 });
    const replay = await PA.call('POST', `/webhooks/${hook.id}/deliveries/${row.id}/replay`, {});
    ok('partner A can replay its own failed event', replay.status === 200 && replay.body.delivery.status === 'DELIVERED', `${replay.status} ${JSON.stringify(replay.body).slice(0, 150)}`);
    // The event for customer A's shipment never went to customer B's subscription.
    const hookB = await subscribe(PB, ['shipment.dispatched']);
    setMode(hookB.name, { status: 200 });
    const next = await B.readyToShip(60, { customer: custA });
    await B.dispatch(next.shipment);
    await sleep(500);
    ok("customer B's subscription receives nothing about customer A's shipment", hitsOf(hookB.name).length === 0 && (await deliveriesOf(hookB.id)).length === 0);
  });

  await scenario(G6, 'the integration report is for company administrators and holds no secret', async (ok) => {
    for (const who of ['csr', 'operator', 'shipping', 'branchA', 'branchWh', 'regional', 'custA']) {
      const r = await A.get('/api/admin/integrations', who);
      ok(`${who} cannot read it`, r.status === 403, r.status);
      ok(`${who} cannot list partner events`, (await A.get('/api/admin/integrations/deliveries', who)).status === 403);
    }
    const r = await http1('GET', '/api/admin/integrations', { token: await tokenOf('admin') });
    ok('an administrator reads it', r.status === 200 && r.body.integrations.length >= 13 && Array.isArray(r.body.needsAction));
    const secrets = ['qa-not-a-real-speech-key', 'qa-not-a-real-ai-key', TASKS_SECRET, PA.secret, 'postgresql://', 'password'];
    ok('no key, secret, database address or partner address in it', secrets.every((s) => !r.raw.includes(s)) && !r.raw.includes(STUB), secrets.filter((s) => r.raw.includes(s)).join());
    const list = await http1('GET', '/api/admin/integrations/deliveries?status=FAILED&limit=5', { token: await tokenOf('admin') });
    ok('the event list is { data, meta }, limited, and shows no signing secret or address', list.status === 200 && Array.isArray(list.body.data) && list.body.data.length <= 5 && typeof list.body.meta.total === 'number' && !/whsec_|"secret"|"url"/.test(list.raw), list.raw.slice(0, 200));
    ok('a bad status filter is refused', (await A.get('/api/admin/integrations/deliveries?status=LOST')).status === 400);
    const every = r.body.integrations.every((i) => i.id && i.name && i.state && i.ifDown);
    ok('every integration says what state it is in and what happens when it is down', every);
  });

  await scenario(G6, 'the server log holds request ids and reasons, and no key, token or signing secret', async (ok) => {
    const logFile = arg('server-log', '');
    if (!logFile || !fs.existsSync(logFile)) return ok('a server log was given to read (--server-log)', false, logFile || 'not given');
    const log = fs.readFileSync(logFile, 'utf8');
    ok('the log is being written', log.length > 500, log.length);
    for (const [what, value] of [['the speech key', 'qa-not-a-real-speech-key'], ['the AI key', 'qa-not-a-real-ai-key'], ['the scheduler secret', TASKS_SECRET], ["a partner's client secret", PA.secret], ["a partner's token", PA.token], ['a staff token', await tokenOf('admin')], ['the QA sign-in password', QA_PASSWORD]]) {
      ok(`${what} does not appear`, !log.includes(value));
    }
    ok('no webhook signing secret appears', !/whsec_[0-9a-f]{20,}/.test(log));
    ok('failures are written as one line with what failed and why', /"msg":"speech_failed"/.test(log) && /"msg":"webhook_dead_letter"/.test(log) && /"msg":"invoice_not_raised"/.test(log), ['speech_failed', 'webhook_dead_letter', 'invoice_not_raised'].filter((m) => !log.includes(`"msg":"${m}"`)).join());
    ok("the provider's own error text (which quoted a key) was not copied into the log", !/sk_live_SECRETSECRET|sk-SECRETKEY/.test(log));
  });

  await scenario(G6, 'a branch login cannot act on another branch through the integration paths', async (ok) => {
    // Shipment of branch QA-L01; branchB works at QA-L02.
    const { shipment, order } = await B.readyToShip(90);
    const d = await A.put(`/api/shipments/${shipment.id}/dispatch`, {}, 'branchB');
    ok('dispatching another branch\'s shipment is refused', [403, 404].includes(d.status), d.status);
    ok('and nothing left', (await prisma.shipment.findUnique({ where: { id: shipment.id } })).status === 'PENDING' && (await B.invoicesOf(order.id)).length === 0);
    const e = await A.put(`/api/orders/${order.id}`, { notes: 'from the wrong branch', expectedUpdatedAt: order.updatedAt.toISOString() }, 'branchB');
    ok('editing another branch\'s order is refused', [403, 404].includes(e.status), e.status);
    const k = `qa-${run}-${tag('K')}`;
    const mine = await raw('POST', '/api/orders', B.orderBody([B.line(5)]), 'branchA', { 'Idempotency-Key': k });
    const theirs = await raw('POST', '/api/orders', B.orderBody([B.line(5)]), 'branchB', { 'Idempotency-Key': k });
    ok('a request key used at one branch does not answer a request from another', ![mine, theirs].some((r) => r.replayed), `${mine.status} ${theirs.status}`);
    const list = await raw('GET', '/api/orders?limit=100&view=summary', undefined, 'branchB');
    ok("the windowed order list of branch B holds only branch B's orders", list.status === 200 && list.body.every((o) => o.locationId === L2.id), list.body?.filter?.((o) => o.locationId !== L2.id).length);
  });

  await scenario(G6, 'after everything above, the books still reconcile', async (ok) => {
    const one = async (sql) => Number((await prisma.$queryRawUnsafe(sql))[0].n);
    ok('no invoice number is repeated', (await one(`SELECT COUNT(*)::int n FROM (SELECT "invoiceNumber" FROM "Invoice" GROUP BY 1 HAVING COUNT(*) > 1) x`)) === 0);
    ok('no stock balance is negative', (await one(`SELECT COUNT(*)::int n FROM "Inventory" WHERE "qtyOnHand" < 0 OR "qtyAvailable" < 0 OR "qtyAllocated" < 0`)) === 0);
    ok('every balance is available plus reserved plus on hold', (await one(`SELECT COUNT(*)::int n FROM "Inventory" WHERE ABS("qtyOnHand" - ("qtyAvailable" + "qtyAllocated" + "qtyOnHold")) > 0.000001`)) === 0);
    ok('reserved stock equals the reservations on file', (await one(`SELECT COUNT(*)::int n FROM "Inventory" i LEFT JOIN (SELECT "coilId", SUM("qtyAllocated") q FROM "OrderLineAllocation" GROUP BY 1) a ON a."coilId" = i."coilId" WHERE ABS(i."qtyAllocated" - COALESCE(a.q, 0)) > 0.000001`)) === 0);
    ok('no invoice is paid for more than its total', (await one(`SELECT COUNT(*)::int n FROM "Invoice" WHERE "kind" = 'INVOICE' AND "paidAmount" > "totalAmount" + 0.005`)) === 0);
    ok('for every invoice raised in this run, the payments add up to the amount paid', (await one(`SELECT COUNT(*)::int n FROM "Invoice" i LEFT JOIN (SELECT "invoiceId", SUM("amount") a FROM "Payment" GROUP BY 1) p ON p."invoiceId" = i."id" WHERE i."kind" = 'INVOICE' AND i."createdAt" >= '${T0}' AND ABS(i."paidAmount" - COALESCE(p.a, 0)) > 0.005`)) === 0);
    ok('no line has shipped more than was ordered', (await one(`SELECT COUNT(*)::int n FROM "OrderLine" WHERE "qtyShipped" > "qtyOrdered" + 0.000001`)) === 0);
    ok('no event is on file twice for one subscriber', (await one(`SELECT COUNT(*)::int n FROM (SELECT "webhookId", "eventId" FROM "WebhookDelivery" GROUP BY 1, 2 HAVING COUNT(*) > 1) x`)) === 0);
    ok('no delivery has been tried more than its limit', (await one(`SELECT COUNT(*)::int n FROM "WebhookDelivery" WHERE "attempts" > "maxAttempts"`)) === 0);
    ok('no request key is left claimed and unanswered from this run', (await prisma.requestKey.count({ where: { status: 'IN_PROGRESS', key: { startsWith: `qa-${run}` }, createdAt: { lt: new Date(Date.now() - 5000) } } })) === 0);
    const dispatched = await one(`SELECT COUNT(*)::int n FROM "Shipment" s WHERE s."status" IN ('IN_TRANSIT','DELIVERED','EXCEPTION') AND s."createdAt" >= '${T0}' AND NOT EXISTS (SELECT 1 FROM "MaterialMovement" m WHERE m."shipmentId" = s."id")`);
    ok('every shipment that left in this run has its stock movement', dispatched === 0, dispatched);
  });
}

await stopStub();
const failed = finish('Phase 4 integration scenarios', OUT, fs);
await prisma.$disconnect();
process.exit(failed ? 1 : 0);
