// Group 1: sales, invoices and revenue.
export default async function sales(ctx) {
  const { scenario, G, prisma, A, B, cfo, w, L1, near, err, tag, num, posted, expectEntry, eventOf, entriesOf, movement } = ctx;
  const S = (name, fn) => scenario(G.sales, name, fn);
  const product = await prisma.product.findFirst({ where: { sku: 'CUT-DISC-9' } });

  await S('An invoice raised at dispatch debits receivables and credits product sales for the same amount', async (ok) => {
    const r = await ctx.shipped(1000, { price: 0.65 });
    const { event, entry } = await posted('INVOICE_ISSUED', 'Invoice', r.invoice.id);
    ok('the event is posted', event?.status === 'POSTED', `${event?.status} ${event?.reason}`);
    expectEntry(ok, 'invoice', entry, { 1100: 650, 4000: -650 });
    ok('the receivable line names the customer and the branch', entry.lines.some((l) => l.account.code === '1100' && l.customerId === r.order.buyerId && l.locationId === L1.id));
    ok('the entry names its source and the rule version', entry.sourceType === 'Invoice' && entry.sourceId === r.invoice.id && entry.ruleVersion === 1 && entry.kind === 'SYSTEM' && entry.currency === 'USD');
    ok('it is dated the invoice day and in an open period', entry.period.status === 'OPEN' && entry.entryDate <= new Date());
  });

  await S('Sales tax on an invoice is a liability tagged with the ship-to state, not revenue', async (ok) => {
    const r = await ctx.shipped(1000, { price: 0.5, taxRate: 0.06, state: 'MI' });
    const { entry } = await posted('INVOICE_ISSUED', 'Invoice', r.invoice.id);
    expectEntry(ok, 'invoice with tax', entry, { 1100: 530, 4000: -500, 2100: -30 });
    ok('the tax line carries MI', entry.lines.find((l) => l.account.code === '2100')?.jurisdiction === 'MI');
  });

  await S('Freight billed is freight revenue; nothing is posted to freight expense', async (ok) => {
    const r = await ctx.shipped(1000, { price: 0.5, freight: 85 });
    const { entry } = await posted('INVOICE_ISSUED', 'Invoice', r.invoice.id);
    expectEntry(ok, 'invoice with freight', entry, { 1100: 585, 4000: -500, 4200: -85 });
    ok('no line touches freight expense', !entry.lines.some((l) => l.account.code === '5200'));
  });

  await S('The cost of what shipped is recognised at shipment, in its own entry, at the cost on the movement', async (ok) => {
    const r = await ctx.shipped(1000, { cost: 0.4, price: 0.65 });
    const { event, entry } = await posted('STOCK_SHIPPED', 'MaterialMovement', r.move.id);
    ok('the shipment event is posted', event?.status === 'POSTED', `${event?.status} ${event?.reason}`);
    expectEntry(ok, 'shipment', entry, { 5000: 400, 1200: -400 });
    ok('it is a different entry from the invoice', entry.id !== (await posted('INVOICE_ISSUED', 'Invoice', r.invoice.id)).entry.id);
    ok('the cost line names the item', entry.lines.every((l) => l.coilId === r.coilId));
    ok('the movement carries the same unit cost', near(r.move.unitCost, 0.4));
  });

  await S('Two partial shipments each post their own cost and their own invoice; nothing is accrued for what has not shipped', async (ok) => {
    const stock = await ctx.costed(2000, 0.3);
    const o = await B.order([B.line(1000, 0.6)]);
    await B.reserve(o, o.lines[0], stock.coilId, 1000);
    const m = await movement(async () => {
      const s1 = await B.shipment(o, [[o.lines[0], 400]]); const d1 = await B.dispatch(s1.body);
      const mid = await ctx.balances();
      const s2 = await B.shipment(o, [[o.lines[0], 600]]); const d2 = await B.dispatch(s2.body);
      return { d1, d2, mid };
    });
    ok('both dispatched', m.out.d1.status === 200 && m.out.d2.status === 200, `${m.out.d1.status} ${m.out.d2.status} ${err(m.out.d2)}`);
    const invoices = await B.invoicesOf(o.id);
    ok('two invoices: 240.00 and 360.00', invoices.length === 2 && near(invoices[0].totalAmount, 240) && near(invoices[1].totalAmount, 360), invoices.map((i) => i.totalAmount).join(','));
    ok('revenue 600.00, receivables 600.00, cost 300.00 in all', near(m.delta['4000'], -600) && near(m.delta['1100'], 600) && near(m.delta['5000'], 300) && near(m.delta['1200'], -300), JSON.stringify(m.delta));
    for (const inv of invoices) ok(`invoice ${inv.invoiceNumber} has its own posted entry`, (await eventOf('INVOICE_ISSUED', 'Invoice', inv.id))?.status === 'POSTED');
  });

  await S('Tax shared across two invoices of one order adds up to the order\'s tax, to the cent, in the books', async (ok) => {
    const stock = await ctx.costed(1000, 0.3);
    const o = await B.order([B.line(333, 0.37)], { taxRate: 0.0725, extra: { shipToState: 'OH' } });
    await B.reserve(o, o.lines[0], stock.coilId, 333);
    const m = await movement(async () => { for (const q of [100, 233]) { const s = await B.shipment(o, [[o.lines[0], q]]); await B.dispatch(s.body); } });
    const invoices = await B.invoicesOf(o.id);
    const tax = invoices.reduce((s, i) => s + num(i.taxAmount), 0);
    ok('the invoices carry the order\'s tax exactly', near(tax, num(o.taxAmount)), `${tax} vs ${o.taxAmount}`);
    ok('tax payable rose by exactly that', near(m.delta['2100'], -num(o.taxAmount)), JSON.stringify(m.delta));
    ok('receivables rose by the order total', near(m.delta['1100'], num(o.totalAmount)), `${m.delta['1100']} vs ${o.totalAmount}`);
  });

  await S('Freight is posted once, on the order\'s first invoice', async (ok) => {
    const stock = await ctx.costed(1000, 0.3);
    const o = await B.order([B.line(600, 0.5)], { freight: 45 });
    await B.reserve(o, o.lines[0], stock.coilId, 600);
    for (const q of [200, 400]) { const s = await B.shipment(o, [[o.lines[0], q]]); await B.dispatch(s.body); }
    const [first, second] = await B.invoicesOf(o.id);
    const e1 = (await posted('INVOICE_ISSUED', 'Invoice', first.id)).entry; const e2 = (await posted('INVOICE_ISSUED', 'Invoice', second.id)).entry;
    expectEntry(ok, 'first invoice', e1, { 1100: 145, 4000: -100, 4200: -45 });
    expectEntry(ok, 'second invoice', e2, { 1100: 200, 4000: -200 });
  });

  await S('Asking for the same shipment\'s invoice again creates no second entry', async (ok) => {
    const r = await ctx.shipped(500, { price: 0.5 });
    const again = await A.post('/api/invoices', { shipmentId: r.shipment.id }, 'csr');
    const byOrder = await A.post('/api/invoices', { orderId: r.order.id }, 'csr');
    ok('the second requests create no invoice', (await B.invoicesOf(r.order.id)).length === 1, `${again.status} ${byOrder.status}`);
    ok('one entry for the invoice', (await entriesOf('Invoice', r.invoice.id)).length === 1);
    ok('one event for the invoice', (await prisma.ledgerEvent.count({ where: { sourceType: 'Invoice', sourceId: r.invoice.id } })) === 1);
  });

  await S('Cancelling an unpaid invoice reverses its entry with a new entry; the original is untouched', async (ok) => {
    const r = await ctx.shipped(500, { price: 0.5, taxRate: 0.06, state: 'MI' });
    const original = (await posted('INVOICE_ISSUED', 'Invoice', r.invoice.id)).entry;
    const m = await movement(() => A.post(`/api/invoices/${r.invoice.id}/cancel`, { reason: 'Billed to the wrong account' }, 'admin'));
    ok('cancelled', m.out.status === 200, `${m.out.status} ${err(m.out)}`);
    const all = await entriesOf('Invoice', r.invoice.id);
    const reversal = all.find((e) => e.kind === 'REVERSAL');
    ok('a reversal entry exists and points at the original', reversal && reversal.reversesEntryId === original.id && reversal.status === 'POSTED');
    expectEntry(ok, 'reversal', reversal, { 1100: -265, 4000: 250, 2100: 15 });
    ok('the accounts moved back exactly', near(m.delta['1100'], -265) && near(m.delta['4000'], 250) && near(m.delta['2100'], 15), JSON.stringify(m.delta));
    const now = await ctx.entryOf(original.id);
    ok('the original entry is unchanged', now.status === 'POSTED' && now.postedAt.getTime() === original.postedAt.getTime() && JSON.stringify(ctx.nets(now)) === JSON.stringify(ctx.nets(original)));
    ok('the event says reversed', (await eventOf('INVOICE_ISSUED', 'Invoice', r.invoice.id)).status === 'REVERSED');
    ok('the reason is on the reversal', /Billed to the wrong account/.test(reversal.memo));
  });

  await S('An invoice cannot be cancelled twice, and only one reversal ever exists', async (ok) => {
    const r = await ctx.shipped(300, { price: 0.5 });
    const rs = await ctx.all(3, () => A.post(`/api/invoices/${r.invoice.id}/cancel`, { reason: 'Duplicate bill' }, 'admin'));
    ok('one succeeds', rs.filter((x) => x.status === 200).length === 1, rs.map((x) => x.status).join(','));
    ok('exactly one reversal', (await entriesOf('Invoice', r.invoice.id)).filter((e) => e.kind === 'REVERSAL').length === 1);
    const t = await ctx.balances(); ok('the books balance', t.balanced);
  });

  await S('After a cancelled invoice, billing the shipment again posts a new entry for the new invoice', async (ok) => {
    const r = await ctx.shipped(300, { price: 0.5 });
    await A.post(`/api/invoices/${r.invoice.id}/cancel`, { reason: 'Wrong terms' }, 'admin');
    const m = await movement(() => A.post('/api/invoices', { orderId: r.order.id }, 'csr'));
    ok('a new invoice', m.out.status === 201 && m.out.body.id !== r.invoice.id, `${m.out.status} ${err(m.out)}`);
    expectEntry(ok, 'new invoice', (await posted('INVOICE_ISSUED', 'Invoice', m.out.body.id)).entry, { 1100: 150, 4000: -150 });
    ok('net effect of cancel and rebill is one invoice', near(m.delta['1100'], 150), JSON.stringify(m.delta));
  });

  await S('A counter sale posts the invoice, the payment and the cost of the pieces in one save', async (ok) => {
    const shelf = await ctx.shelfStockBooked({ pieces: 20, unitCost: 2.5 });
    const id = tag('QS');
    const m = await movement(() => ctx.counterSale(id, shelf.product.id, 4));
    ok('sold', m.out.status === 201, `${m.out.status} ${err(m.out)}`);
    const order = await prisma.order.findFirst({ where: { poReference: `QS:${id}` }, include: { invoices: { include: { payments: true } } } });
    const inv = order.invoices[0];
    const total = num(inv.totalAmount);
    ok('receivables end where they began', near(m.delta['1100'] || 0, 0), JSON.stringify(m.delta));
    ok('cash clearing rose by the total', near(m.delta['1000'], total), `${m.delta['1000']} vs ${total}`);
    ok('revenue and tax equal the invoice', near(-(m.delta['4000'] || 0), num(inv.subtotal)) && near(-(m.delta['2100'] || 0), num(inv.taxAmount)), JSON.stringify(m.delta));
    ok('cost of four pieces at 2.50 left stock', near(m.delta['5000'], 10) && near((m.delta['1200'] || 0) + (m.delta['1210'] || 0), -10), JSON.stringify(m.delta));
    ok('three events are posted', (await eventOf('INVOICE_ISSUED', 'Invoice', inv.id))?.status === 'POSTED' && (await eventOf('PAYMENT_RECORDED', 'Payment', inv.payments[0].id))?.status === 'POSTED' && (await prisma.ledgerEvent.count({ where: { eventKind: 'STOCK_SHIPPED', status: 'POSTED', sourceId: { in: (await prisma.materialMovement.findMany({ where: { orderId: order.id }, select: { id: true } })).map((x) => x.id) } } })) === 1);
    const tax = (await posted('INVOICE_ISSUED', 'Invoice', inv.id)).entry.lines.find((l) => l.account.code === '2100');
    ok('counter tax is tagged with the selling branch\'s state', !tax || tax.jurisdiction === (await prisma.location.findUnique({ where: { id: shelf.locationId } })).state, tax?.jurisdiction);
  });

  await S('The same counter sale sent three times at once is in the books once', async (ok) => {
    const shelf = await ctx.shelfStockBooked({ pieces: 20, unitCost: 1.25 });
    const id = tag('QS');
    const m = await movement(() => ctx.all(3, () => ctx.counterSale(id, shelf.product.id, 2)));
    const orders = await prisma.order.findMany({ where: { poReference: `QS:${id}` }, include: { invoices: true } });
    ok('one sale on file', orders.length === 1 && orders[0].invoices.length === 1, `${orders.length}`);
    ok('one invoice entry', (await entriesOf('Invoice', orders[0].invoices[0].id)).length === 1);
    ok('cost of two pieces left stock once', near(m.delta['5000'], 2.5), JSON.stringify(m.delta));
    ok('cash rose once', near(m.delta['1000'], num(orders[0].invoices[0].totalAmount)), JSON.stringify(m.delta));
  });

  await S('Voiding a counter sale posts the credit, the refund and the stock coming back; every account returns to where it was except sales and returns', async (ok) => {
    const shelf = await ctx.shelfStockBooked({ pieces: 10, unitCost: 3 });
    const id = tag('QS');
    await ctx.counterSale(id, shelf.product.id, 3);
    const order = await prisma.order.findFirst({ where: { poReference: `QS:${id}` }, include: { invoices: true } });
    const inv = order.invoices.find((i) => i.kind === 'INVOICE');
    const m = await movement(() => A.post(`/api/pos/quick-sale/${id}/void`, { reason: 'Customer changed their mind' }, 'admin'));
    ok('voided', m.out.status === 200 || m.out.status === 201, `${m.out.status} ${err(m.out)}`);
    ok('cash clearing fell by the total', near(m.delta['1000'], -num(inv.totalAmount)), JSON.stringify(m.delta));
    ok('receivables end where they began', near(m.delta['1100'] || 0, 0), JSON.stringify(m.delta));
    ok('sales returns took the subtotal; sales itself is not reduced', near(m.delta['4300'], num(inv.subtotal)) && !m.delta['4000'], JSON.stringify(m.delta));
    ok('tax payable fell by the tax', near(m.delta['2100'] || 0, num(inv.taxAmount)), JSON.stringify(m.delta));
    ok('the pieces are back in stock at cost', near((m.delta['1200'] || 0) + (m.delta['1210'] || 0), 9) && near(m.delta['5000'], -9), JSON.stringify(m.delta));
  });

  await S('The revenue report by customer rises by exactly what was invoiced to that customer', async (ok) => {
    const row = async () => Number((await cfo.get('/api/ledger/reports/revenue?by=customer')).body.rows.find((x) => x.key === w.custB.id)?.net || 0);
    const before = await row();
    await ctx.shipped(700, { price: 0.9, customer: w.custB, freight: 20 });
    ok('net sales for the customer rose by 650.00', near((await row()) - before, 650), `${(await row()) - before}`);
  });

  await S('Revenue is reported by product and by division when the order line names a product', async (ok) => {
    const stock = await ctx.costed(1000, 0.3);
    const o = await B.order([B.line(200, 1.1, { productId: product.id })]);
    await B.reserve(o, o.lines[0], stock.coilId, 200);
    const rowOf = async (by, key) => Number((await cfo.get(`/api/ledger/reports/revenue?by=${by}`)).body.rows.find((x) => x.key === key)?.net || 0);
    const [p0, d0] = [await rowOf('product', product.id), await rowOf('division', product.division)];
    const s = await B.shipment(o, [[o.lines[0], 200]]); const d = await B.dispatch(s.body);
    ok('dispatched', d.status === 200, `${d.status} ${err(d)}`);
    ok('the product\'s sales rose by 220.00', near((await rowOf('product', product.id)) - p0, 220));
    ok(`the ${product.division} division's sales rose by 220.00`, near((await rowOf('division', product.division)) - d0, 220));
  });

  await S('The gross margin report shows sales less material cost, and says it is not a profit and loss statement', async (ok) => {
    const row = async () => { const r = (await cfo.get('/api/ledger/reports/gross-margin?by=branch')).body; const x = r.rows.find((y) => y.key === L1.id) || { netSales: 0, materialCost: 0 }; return { r, sales: Number(x.netSales), cost: Number(x.materialCost) }; };
    const before = await row();
    await ctx.shipped(1000, { cost: 0.4, price: 0.65 });
    const after = await row();
    ok('branch sales rose by 650.00 and material cost by 400.00', near(after.sales - before.sales, 650) && near(after.cost - before.cost, 400), `${after.sales - before.sales} ${after.cost - before.cost}`);
    ok('the title is "Gross margin on material"', after.r.title === 'Gross margin on material');
    ok('it says it is not a profit and loss statement', /not a profit and loss statement/i.test(after.r.note) && /Labor/.test(after.r.note));
  });

  await S('The sales tax report by state rises by the tax invoiced to that state', async (ok) => {
    const row = async () => Number((await cfo.get('/api/ledger/reports/sales-tax')).body.rows.find((x) => x.state === 'KY')?.net || 0);
    const before = await row();
    await ctx.shipped(1000, { price: 0.5, taxRate: 0.06, state: 'KY' });
    ok('Kentucky rose by 30.00', near((await row()) - before, 30), `${(await row()) - before}`);
  });

  await S('Material shipped with no cost on file: revenue posts, the cost is held and named, never posted at zero; entering the cost posts it', async (ok) => {
    const coilId = await ctx.uncosted(1500);
    const r = await ctx.shipped(1000, { price: 0.65, coilId });
    const held = await eventOf('STOCK_SHIPPED', 'MaterialMovement', r.move.id);
    ok('the invoice posted', (await eventOf('INVOICE_ISSUED', 'Invoice', r.invoice.id))?.status === 'POSTED');
    ok('the cost event is held for reconciliation', held?.status === 'RECONCILIATION_REQUIRED' && /No cost is on file/.test(held.reason) && held.journalEntryId === null, `${held?.status} ${held?.reason}`);
    ok('no zero-value entry was written', (await entriesOf('MaterialMovement', r.move.id)).length === 0);
    const set = await ctx.setCost(coilId, 0.38);
    ok('the cost was saved', set.status === 200, `${set.status} ${err(set)}`);
    const after = await posted('STOCK_SHIPPED', 'MaterialMovement', r.move.id);
    // The cost of the sale is the item's cost on file when it is posted: the movement itself recorded none.
    ok('the held shipment is now posted', after.event.status === 'POSTED', `${after.event.status} ${after.event.reason}`);
    expectEntry(ok, 'late cost', after.entry, { 5000: 380, 1200: -380 });
  });

  await S('With no account mapped for product sales the invoice is saved, nothing is posted to another account, and the event fails with the reason', async (ok) => {
    await cfo.put('/api/ledger/mappings/REVENUE_PRODUCT', { accountCode: null });
    let r; let failed;
    try {
      const m = await movement(async () => { r = await ctx.shipped(400, { price: 0.5 }); });
      failed = await eventOf('INVOICE_ISSUED', 'Invoice', r.invoice.id);
      ok('the invoice exists', r.invoice && num(r.invoice.totalAmount) === 200);
      ok('the event failed and says why', failed?.status === 'FAILED' && /No account is mapped for REVENUE_PRODUCT/.test(failed.reason), `${failed?.status} ${failed?.reason}`);
      ok('receivables and revenue did not move at all', !m.delta['1100'] && !m.delta['4000'] && !m.delta['4100'] && !m.delta['4200'], JSON.stringify(m.delta));
      ok('the shipment\'s cost still posted (it needs no revenue account)', near(m.delta['5000'], 160), JSON.stringify(m.delta));
    } finally {
      await cfo.put('/api/ledger/mappings/REVENUE_PRODUCT', { accountCode: '4000' });
    }
    const early = await cfo.post(`/api/ledger/events/${failed.id}/retry`);
    ok('mapped again but not approved: the retry still fails', early.status === 200 && early.body.status === 'FAILED' && /not approved/.test(early.body.reason), `${early.status} ${early.body?.status} ${early.body?.reason}`);
    await cfo.post('/api/ledger/approvals', { mappings: ['REVENUE_PRODUCT'], approvedBy: 'QA Synthetic Accountant (test data only)' });
    const retry = await cfo.post(`/api/ledger/events/${failed.id}/retry`);
    ok('after approval the retry posts it', retry.status === 200 && retry.body.status === 'POSTED', `${retry.status} ${retry.body?.status} ${retry.body?.reason}`);
    expectEntry(ok, 'retried invoice', await ctx.entryOf(retry.body.journalEntryId), { 1100: 200, 4000: -200 });
    ok('a second retry is refused and posts nothing', (await cfo.post(`/api/ledger/events/${failed.id}/retry`)).status === 409 && (await entriesOf('Invoice', r.invoice.id)).length === 1);
  });

  await S('A lost load credited in full reduces receivables through sales returns; no stock comes back and the cost stays in cost of goods', async (ok) => {
    const r = await ctx.shipped(500, { cost: 0.4, price: 0.8 });
    await A.patch(`/api/shipments/${r.shipment.id}/status`, { status: 'EXCEPTION', reason: 'Trailer missing from the yard' }, 'shipping');
    const m = await movement(() => ctx.bm1.put(`/api/shipments/${r.shipment.id}/lost`, { kind: 'LOST', reason: 'Stolen with the trailer' }));
    ok('recorded as lost', m.out.status === 200, `${m.out.status} ${err(m.out)}`);
    ok('receivables fell and sales returns rose by 400.00', near(m.delta['1100'], -400) && near(m.delta['4300'], 400), JSON.stringify(m.delta));
    ok('stock and cost of goods did not move', !m.delta['1200'] && !m.delta['5000'], JSON.stringify(m.delta));
  });

  await S('An invoice with three awkward prices balances to the cent and equals the invoice total', async (ok) => {
    const stock = [await ctx.costed(500, 0.3333), await ctx.costed(500, 0.2857), await ctx.costed(500, 0.1429)];
    const o = await B.order([B.line(333, 0.3333), B.line(77, 1.0101), B.line(13, 7.7777)], { taxRate: 0.0625, extra: { shipToState: 'IL' } });
    for (const [i, l] of o.lines.entries()) await B.reserve(o, l, stock[i].coilId, num(l.qtyOrdered));
    const s = await B.shipment(o, o.lines.map((l) => [l, num(l.qtyOrdered)])); const d = await B.dispatch(s.body);
    ok('dispatched', d.status === 200, `${d.status} ${err(d)}`);
    const inv = await ctx.invOf(d.body.invoice.id);
    const { entry } = await posted('INVOICE_ISSUED', 'Invoice', inv.id);
    expectEntry(ok, 'awkward invoice', entry, { 1100: num(inv.totalAmount), 4000: -num(inv.subtotal), 2100: -num(inv.taxAmount) });
    ok('one revenue line per invoice line', entry.lines.filter((l) => l.account.code === '4000').length === 3);
    ok('every amount is in whole cents', entry.lines.every((l) => near(Number(l.debit) * 100, Math.round(Number(l.debit) * 100), 1e-6) && near(Number(l.credit) * 100, Math.round(Number(l.credit) * 100), 1e-6)));
  });

  await S('The receivables report shows, for one customer, the same balance as that customer\'s invoices', async (ok) => {
    const r = await ctx.shipped(600, { price: 0.5, customer: w.custC });
    await ctx.pay(r.invoice.id, 100);
    const rep = (await cfo.get('/api/ledger/reports/receivables')).body;
    const row = rep.customers.find((c) => c.customerId === w.custC.id);
    const [rec] = await prisma.$queryRaw`SELECT COALESCE(SUM(i."totalAmount" - i."paidAmount"), 0)::float AS v FROM "Invoice" i JOIN "Order" o ON o."id" = i."orderId" WHERE o."buyerId" = ${w.custC.id} AND i."status" <> 'CANCELLED'`;
    ok('the customer is listed', Boolean(row));
    ok('books and invoices agree for the customer', row && near(row.ledger, rec.v) && row.difference === '0.00', `${row?.ledger} vs ${rec.v}`);
  });

  await S('A shipment that leaves in one save and its invoice are two events: each can be found, and each is posted once', async (ok) => {
    const r = await ctx.shipped(250, { cost: 0.4, price: 0.6 });
    const events = await prisma.ledgerEvent.findMany({ where: { sourceId: { in: [r.invoice.id, r.move.id] } } });
    ok('two events, two kinds', events.length === 2 && new Set(events.map((e) => e.eventKind)).size === 2, events.map((e) => e.eventKind).join(','));
    ok('both posted to different entries', events.every((e) => e.status === 'POSTED') && events[0].journalEntryId !== events[1].journalEntryId);
    const list = await cfo.get(`/api/ledger/entries?sourceId=${r.invoice.id}`);
    ok('the entry can be found from the invoice', list.status === 200 && list.body.entries.length === 1 && list.body.entries[0].eventKind === 'INVOICE_ISSUED');
  });

  await S('A credit memo for part of an invoice, by quantity, posts sales returns and its share of tax', async (ok) => {
    const r = await ctx.shipped(1000, { price: 0.5, taxRate: 0.06, state: 'MI' });
    const m = await movement(() => ctx.creditMemo(r.invoice.id, { reason: 'Short on the scale', lines: [{ invoiceLineId: r.invoice.lines[0].id, quantity: 100 }] }));
    ok('credited', m.out.status === 201, `${m.out.status} ${err(m.out)}`);
    ok('returns 50.00, tax 3.00, receivables down 53.00', near(m.delta['4300'], 50) && near(m.delta['2100'], 3) && near(m.delta['1100'], -53), JSON.stringify(m.delta));
    ok('product sales itself is not reduced', !m.delta['4000']);
  });
}
