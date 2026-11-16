// Group 5: freight, transfers and location accounting.
export default async function moves(ctx, state) {
  const { scenario, G, prisma, A, B, cfo, bm1, bm2, w, L1, L2, near, err, tag, num, posted, expectEntry, eventOf, entriesOf, movement, transfer, receiveTransfer, cancelTransfer, settleTransfer, transferLines } = ctx;
  const S = (name, fn) => scenario(G.moves, name, fn);
  const booked = async (coilId, codes = ['1200', '1210', '1300']) => Number((await prisma.$queryRawUnsafe(`SELECT COALESCE(SUM(l."debit" - l."credit"), 0)::float AS v FROM "JournalLine" l JOIN "JournalEntry" e ON e."id" = l."entryId" JOIN "LedgerAccount" a ON a."id" = l."accountId" WHERE l."coilId" = $1 AND e."status" = 'POSTED' AND a."code" = ANY($2)`, coilId, codes))[0].v);
  const revenueTypes = ['4000', '4100', '4200', '4300', '5000'];
  const check = async (key) => (await cfo.post('/api/ledger/reconciliations')).body.checks.find((c) => c.key === key);
  /** An order sold and shipped from the second branch. */
  async function shippedFromL2(qty, { cost = 0.4, price = 0.7, freight = 0 } = {}) {
    const s = await ctx.costed(qty + 200, cost, { locationId: L2.id });
    const o = await B.order([B.line(qty, price)], { freight, who: 'admin', extra: { locationId: L2.id } });
    const rz = await B.reserve(o, o.lines[0], s.coilId, qty);
    if (!ctx.ok2(rz)) throw new Error(`reserve ${rz.status} ${err(rz)}`);
    const sh = await A.post('/api/shipments', { orderId: o.id, fromLocationId: L2.id, carrierName: 'Own Truck', items: [{ orderLineId: o.lines[0].id, qtyShipped: qty, weightLb: qty }] }, 'admin');
    if (sh.status !== 201) throw new Error(`shipment ${sh.status} ${err(sh)}`);
    const d = await A.put(`/api/shipments/${sh.body.id}/dispatch`, {}, 'admin');
    if (d.status !== 200) throw new Error(`dispatch ${d.status} ${err(d)}`);
    return { coilId: s.coilId, order: o, shipment: sh.body, invoice: await ctx.invOf(d.body.invoice.id), move: await prisma.materialMovement.findFirst({ where: { shipmentId: sh.body.id, movementType: 'SHIP' } }) };
  }

  await S('A transfer that leaves a branch moves the item\'s value from that branch\'s stock to in-transit; no sale is recorded', async (ok) => {
    const s = await ctx.costed(1000, 0.4);
    const m = await movement(() => transfer([s.coilId], L2));
    ok('shipped', m.out.status === 201, `${m.out.status} ${err(m.out)}`);
    const [line] = await transferLines(m.out.body.id);
    const { event, entry } = await posted('TRANSFER_SHIPPED', 'StockTransferLine', line.id);
    ok('posted', event?.status === 'POSTED', `${event?.status} ${event?.reason}`);
    expectEntry(ok, 'transfer out', entry, { 1300: 400, 1200: -400 });
    ok('the stock line is at the sending branch', entry.lines.find((l) => l.account.code === '1200').locationId === L1.id);
    ok('no revenue, returns or cost of goods moved', revenueTypes.every((c) => !m.delta[c]), JSON.stringify(m.delta));
    state.transit = { coilId: s.coilId, transfer: m.out.body };
  });

  await S('Receiving the transfer moves the value from in-transit to the receiving branch\'s stock', async (ok) => {
    const m = await movement(() => receiveTransfer(state.transit.transfer));
    ok('received', ctx.ok2(m.out), `${m.out.status} ${err(m.out)}`);
    const move = await ctx.lastMove(state.transit.coilId, { movementType: 'TRANSFER' });
    const { entry } = await posted('TRANSFER_RECEIVED', 'MaterialMovement', move.id);
    expectEntry(ok, 'transfer in', entry, { 1200: 400, 1300: -400 });
    ok('the stock line is at the receiving branch', entry.lines.find((l) => l.account.code === '1200').locationId === L2.id);
    ok('in-transit for the item is back to zero', near(await booked(state.transit.coilId, ['1300']), 0));
    ok('the item is still worth 400.00', near(await booked(state.transit.coilId), 400));
    ok('no revenue or cost of goods moved', revenueTypes.every((c) => !m.delta[c]), JSON.stringify(m.delta));
  });

  await S('The branch valuation follows the transfer: the sender\'s books fall and the receiver\'s rise by the same amount', async (ok) => {
    const rows = async () => { const r = (await cfo.get('/api/ledger/reports/inventory')).body.rows; const of = (id) => r.find((x) => x.locationId === id) || { rawMaterial: 0, finishedGoods: 0, inTransit: 0 }; return { a: Number(of(L1.id).rawMaterial) + Number(of(L1.id).finishedGoods), aTransit: Number(of(L1.id).inTransit), b: Number(of(L2.id).rawMaterial) + Number(of(L2.id).finishedGoods) }; };
    const s = await ctx.costed(500, 0.6);
    const before = await rows();
    const t = await transfer([s.coilId], L2);
    const mid = await rows();
    await receiveTransfer(t.body);
    const after = await rows();
    ok('while on the truck it is in the sender\'s in-transit column', near(mid.a - before.a, -300) && near(mid.aTransit - before.aTransit, 300), JSON.stringify({ before, mid }));
    ok('after receipt the receiver holds it', near(after.b - before.b, 300) && near(after.aTransit - before.aTransit, 0), JSON.stringify({ before, after }));
  });

  await S('A transfer called back is reversed with a new entry and the item is back in the sender\'s stock', async (ok) => {
    const s = await ctx.costed(800, 0.5);
    const t = await transfer([s.coilId], L2);
    const [line] = await transferLines(t.body.id);
    const m = await movement(() => cancelTransfer(t.body));
    ok('cancelled', ctx.ok2(m.out), `${m.out.status} ${err(m.out)}`);
    const entries = await entriesOf('StockTransferLine', line.id);
    const reversal = entries.find((e) => e.kind === 'REVERSAL');
    ok('a reversal exists and points at the original', reversal && reversal.reversesEntryId === entries.find((e) => e.kind === 'SYSTEM').id);
    expectEntry(ok, 'reversal', reversal, { 1200: 400, 1300: -400 });
    ok('the event says reversed and the reason is kept', (await eventOf('TRANSFER_SHIPPED', 'StockTransferLine', line.id)).status === 'REVERSED' && /Truck broke down/.test(reversal.memo));
    ok('the item is at the sender at full value', near(await booked(s.coilId, ['1200']), 400) && near(await booked(s.coilId, ['1300']), 0));
  });

  await S('A transfer that arrives short: everything is received, then the confirmed shortage is written off at cost at the receiving branch', async (ok) => {
    const s = await ctx.costed(1000, 0.4);
    const t = await transfer([s.coilId], L2);
    const rc = await receiveTransfer(t.body, { lines: [{ coilId: s.coilId, qtyReceived: 900, condition: 'SHORT', notes: 'Scale ticket 900 lb' }] });
    ok('received short', ctx.ok2(rc), `${rc.status} ${err(rc)}`);
    ok('the whole quantity is in the receiver\'s books until it is settled', near(await booked(s.coilId), 400));
    const m = await movement(() => settleTransfer(t.body, s.coilId, 'CONFIRM_SHORT'));
    ok('settled', ctx.ok2(m.out), `${m.out.status} ${err(m.out)}`);
    ok('100 lb at 0.40 written off: scrap up 40.00, stock down 40.00', near(m.delta['5300'], 40) && near(m.delta['1200'], -40), JSON.stringify(m.delta));
    const move = await ctx.lastMove(s.coilId, { reasonCode: 'TRANSFER_SHORT_DOWN' });
    ok('the write-off line is at the receiving branch', (await posted('STOCK_ADJUSTED', 'MaterialMovement', move.id)).entry.lines.every((l) => l.locationId === L2.id));
    ok('the item is worth 900 lb at 0.40', near(await booked(s.coilId), 360));
  });

  await S('A shortage that turns out to be there posts nothing', async (ok) => {
    const s = await ctx.costed(1000, 0.4);
    const t = await transfer([s.coilId], L2);
    await receiveTransfer(t.body, { lines: [{ coilId: s.coilId, qtyReceived: 950, condition: 'SHORT', notes: 'Looks short' }] });
    const m = await movement(() => settleTransfer(t.body, s.coilId, 'FOUND'));
    ok('settled as found', ctx.ok2(m.out), `${m.out.status} ${err(m.out)}`);
    ok('nothing moved', Object.keys(m.delta).length === 0, JSON.stringify(m.delta));
    ok('still worth 400.00', near(await booked(s.coilId), 400));
  });

  await S('A transfer of material with no cost is held at both ends, then posts in order when the cost is entered', async (ok) => {
    const coilId = await ctx.uncosted(700);
    const t = await transfer([coilId], L2);
    const [line] = await transferLines(t.body.id);
    await receiveTransfer(t.body);
    const move = await ctx.lastMove(coilId, { movementType: 'TRANSFER' });
    const [out, inn] = [await eventOf('TRANSFER_SHIPPED', 'StockTransferLine', line.id), await eventOf('TRANSFER_RECEIVED', 'MaterialMovement', move.id)];
    ok('both ends are held, naming the missing cost', [out, inn].every((e) => e?.status === 'RECONCILIATION_REQUIRED' && /No cost is on file/.test(e.reason)), `${out?.status} ${inn?.status}`);
    const m = await movement(() => ctx.setCost(coilId, 0.3));
    const after = [await eventOf('TRANSFER_SHIPPED', 'StockTransferLine', line.id), await eventOf('TRANSFER_RECEIVED', 'MaterialMovement', move.id)];
    ok('both posted once the cost was entered', after.every((e) => e.status === 'POSTED'), after.map((e) => `${e.status} ${e.reason || ''}`).join(' | '));
    ok('in-transit nets to zero', !m.delta['1300'] && near(await booked(coilId, ['1300']), 0), JSON.stringify(m.delta));
    const [e1, e2] = [await ctx.entryOf(after[0].journalEntryId), await ctx.entryOf(after[1].journalEntryId)];
    ok('the shipment was posted before the receipt', e1.entryNumber < e2.entryNumber, `${e1.entryNumber} ${e2.entryNumber}`);
  });

  await S('A transfer between branches of different owning organisations is not posted: it is held as intercompany with no approved rule', async (ok) => {
    const other = await prisma.organization.upsert({ where: { code: 'QA-OTHER-CO' }, update: {}, create: { code: 'QA-OTHER-CO', name: 'QA Other Company', type: L1.ownerId ? (await prisma.organization.findUnique({ where: { id: L1.ownerId } })).type : 'SERVICE_CENTER' } });
    const { id, createdAt, updatedAt, ...like } = L2;
    const far = await prisma.location.create({ data: { ...like, code: tag('QA-X').slice(0, 20), name: 'QA branch of another owner', ownerId: other.id } });
    const s = await ctx.costed(600, 0.4);
    const m = await movement(() => transfer([s.coilId], far));
    ok('the transfer itself was saved', m.out.status === 201, `${m.out.status} ${err(m.out)}`);
    const [line] = await transferLines(m.out.body.id);
    const event = await eventOf('TRANSFER_SHIPPED', 'StockTransferLine', line.id);
    ok('held, saying why', event?.status === 'RECONCILIATION_REQUIRED' && /different owning organisations/.test(event.reason) && /intercompany/.test(event.reason), `${event?.status} ${event?.reason}`);
    ok('nothing moved: no revenue, no due-to or due-from was invented', Object.keys(m.delta).length === 0, JSON.stringify(m.delta));
    const back = await cancelTransfer(m.out.body);
    ok('called back; the held event is closed as never posted', ctx.ok2(back) && (await eventOf('TRANSFER_SHIPPED', 'StockTransferLine', line.id)).status === 'NOT_POSTED', `${back.status} ${(await eventOf('TRANSFER_SHIPPED', 'StockTransferLine', line.id)).status}`);
    await prisma.location.update({ where: { id: far.id }, data: { isActive: false } });
  });

  await S('A transfer of three items posts one entry per item', async (ok) => {
    const items = [await ctx.costed(300, 0.4), await ctx.costed(400, 0.5), await ctx.costed(500, 0.6)];
    const m = await movement(() => transfer(items.map((i) => i.coilId), L2));
    const lines = await transferLines(m.out.body.id);
    const events = await prisma.ledgerEvent.findMany({ where: { eventKind: 'TRANSFER_SHIPPED', sourceId: { in: lines.map((l) => l.id) } } });
    ok('three posted events', events.length === 3 && events.every((e) => e.status === 'POSTED'));
    ok('in-transit rose by 620.00', near(m.delta['1300'], 620) && near(m.delta['1200'], -620), JSON.stringify(m.delta));
    await receiveTransfer(m.out.body);
  });

  await S('The same item sent on two transfers at once goes on one, and is posted once', async (ok) => {
    const s = await ctx.costed(500, 0.4);
    const m = await movement(() => ctx.all(2, () => transfer([s.coilId], L2)));
    ok('one transfer was accepted', m.out.filter((r) => r.status === 201).length === 1, m.out.map((r) => r.status).join(','));
    ok('in-transit rose once', near(m.delta['1300'], 200), JSON.stringify(m.delta));
    await cancelTransfer(m.out.find((r) => r.status === 201).body);
  });

  await S('A transfer received three times at once is received once and posted once', async (ok) => {
    const s = await ctx.costed(500, 0.4);
    const t = await transfer([s.coilId], L2);
    const m = await movement(() => ctx.all(3, () => receiveTransfer(t.body)));
    ok('one receipt was accepted', m.out.filter((r) => ctx.ok2(r)).length === 1, m.out.map((r) => r.status).join(','));
    ok('in-transit fell once', near(m.delta['1300'], -200) && near(m.delta['1200'], 200), JSON.stringify(m.delta));
    ok('the item is worth 200.00 at the receiver and nothing in transit', near(await booked(s.coilId, ['1300']), 0) && near(await booked(s.coilId), 200));
  });

  await S('In-transit stock in the books equals the transfers still on the road', async (ok) => {
    const s = await ctx.costed(900, 0.4);
    const t = await transfer([s.coilId], L2);
    const on = await check('IN_TRANSIT');
    ok('with a transfer on the road the check matches', on.status === 'MATCH', `${on.status} ledger ${on.ledger} records ${on.records}`);
    await receiveTransfer(t.body);
    const off = await check('IN_TRANSIT');
    ok('and after it is received', off.status === 'MATCH' && near(Number(on.ledger) - Number(off.ledger), 360), `${off.status} ${on.ledger} -> ${off.ledger}`);
  });

  await S('A transfer that was on the road when the books began is received like any other and clears its opening in-transit value', async (ok) => {
    const m = await movement(() => receiveTransfer(state.pre.transfer.body));
    ok('received', ctx.ok2(m.out), `${m.out.status} ${err(m.out)}`);
    ok('in-transit down 700.00, stock up 700.00', near(m.delta['1300'], -700) && near(m.delta['1200'], 700), JSON.stringify(m.delta));
    ok('the item is at the second branch at full value', near(await booked(state.pre.moving.coilId, ['1200']), 700));
  });

  await S('Freight billed carries the selling branch; freight expense has never been posted to, because no carrier cost is recorded', async (ok) => {
    const r = await ctx.shipped(500, { price: 0.5, freight: 60 });
    const { entry } = await posted('INVOICE_ISSUED', 'Invoice', r.invoice.id);
    const freight = entry.lines.find((l) => l.account.code === '4200');
    ok('the freight line is 60.00 at the selling branch', freight && near(freight.credit, 60) && freight.locationId === L1.id);
    ok('5200 Freight Expense has no lines at all', (await prisma.journalLine.count({ where: { account: { code: '5200' } } })) === 0);
  });

  await S('A sale made and shipped at the second branch is booked to the second branch on every line', async (ok) => {
    const r = await shippedFromL2(600, { cost: 0.4, price: 0.7 });
    const inv = (await posted('INVOICE_ISSUED', 'Invoice', r.invoice.id)).entry;
    const cogs = (await posted('STOCK_SHIPPED', 'MaterialMovement', r.move.id)).entry;
    expectEntry(ok, 'invoice', inv, { 1100: 420, 4000: -420 });
    expectEntry(ok, 'cost', cogs, { 5000: 240, 1200: -240 });
    ok('every line of both entries is at the second branch', [...inv.lines, ...cogs.lines].every((l) => l.locationId === L2.id));
    state.l2Sale = r;
  });

  await S('A branch manager reads the books of their own branch only', async (ok) => {
    const a = await bm1.get('/api/ledger/reports/revenue?by=customer');
    const b = await bm2.get('/api/ledger/reports/revenue?by=customer');
    ok('both may read the revenue report', a.status === 200 && b.status === 200, `${a.status} ${b.status}`);
    const buyer = state.l2Sale.order.buyerId;
    const company = Number((await cfo.get('/api/ledger/reports/revenue?by=branch')).body.rows.find((x) => x.key === L2.id)?.net || 0);
    const own = Number(b.body.total);
    ok('the second branch\'s manager sees exactly that branch\'s sales', near(own, company), `${own} vs ${company}`);
    ok('the first branch\'s manager sees none of the second branch\'s sales', near(Number(a.body.total), Number((await cfo.get('/api/ledger/reports/revenue?by=branch')).body.rows.find((x) => x.key === L1.id)?.net || 0)));
    const entry = (await posted('INVOICE_ISSUED', 'Invoice', state.l2Sale.invoice.id)).entry;
    ok('the first branch\'s manager cannot open the second branch\'s entry', (await bm1.get(`/api/ledger/entries/${entry.id}`)).status === 404);
    ok('its own manager can', (await bm2.get(`/api/ledger/entries/${entry.id}`)).status === 200);
    ok('a branch trial balance says it is limited and need not balance', /Limited to lines of your branches/.test((await bm1.get('/api/ledger/reports/trial-balance')).body.note || ''));
    void buyer;
  });

  await S('The branches add up to the company: every posted line is in exactly one branch total or in "no branch"', async (ok) => {
    const company = (await cfo.get('/api/ledger/reports/trial-balance')).body;
    const rows = await prisma.$queryRaw`SELECT l."locationId" AS id, SUM(l."debit")::float AS d, SUM(l."credit")::float AS c FROM "JournalLine" l JOIN "JournalEntry" e ON e."id" = l."entryId" WHERE e."status" = 'POSTED' GROUP BY l."locationId"`;
    const d = rows.reduce((x, r) => x + r.d, 0); const c = rows.reduce((x, r) => x + r.c, 0);
    ok('debits by branch add up to the company\'s', near(d, company.totals.debit, 0.01), `${d} vs ${company.totals.debit}`);
    ok('credits by branch add up to the company\'s', near(c, company.totals.credit, 0.01), `${c} vs ${company.totals.credit}`);
    ok('the company balances', company.balanced);
  });

  await S('Every entry from a branch names the organisation that owns the branch', async (ok) => {
    const wrong = await prisma.$queryRaw`SELECT COUNT(*)::int AS n FROM "JournalEntry" e JOIN "Location" l ON l."id" = e."locationId" WHERE e."kind" IN ('SYSTEM', 'OPENING') AND e."legalEntityId" IS DISTINCT FROM l."ownerId"`;
    ok('no entry names a different owner than its branch\'s', wrong[0].n === 0, wrong[0].n);
    ok('entries with a branch exist', (await prisma.journalEntry.count({ where: { locationId: { not: null } } })) > 50);
  });

  await S('Material transferred to the second branch and sold there: the cost of the sale comes out of the second branch\'s stock', async (ok) => {
    const s = await ctx.costed(1000, 0.45);
    const t = await transfer([s.coilId], L2); await receiveTransfer(t.body);
    const o = await B.order([B.line(1000, 0.8)], { who: 'admin', extra: { locationId: L2.id } });
    await B.reserve(o, o.lines[0], s.coilId, 1000);
    const sh = await A.post('/api/shipments', { orderId: o.id, fromLocationId: L2.id, carrierName: 'Own Truck', items: [{ orderLineId: o.lines[0].id, qtyShipped: 1000, weightLb: 1000 }] }, 'admin');
    const d = await A.put(`/api/shipments/${sh.body.id}/dispatch`, {}, 'admin');
    ok('dispatched', d.status === 200, `${d.status} ${err(d)}`);
    const move = await prisma.materialMovement.findFirst({ where: { shipmentId: sh.body.id, movementType: 'SHIP' } });
    const { entry } = await posted('STOCK_SHIPPED', 'MaterialMovement', move.id);
    expectEntry(ok, 'cost of the sale', entry, { 5000: 450, 1200: -450 });
    ok('the stock line is at the second branch', entry.lines.find((l) => l.account.code === '1200').locationId === L2.id);
    ok('the item ends at zero across both branches', near(await booked(s.coilId), 0, 0.0001));
  });

  await S('A transfer already received cannot be called back, and no reversal is posted', async (ok) => {
    const s = await ctx.costed(400, 0.4);
    const t = await transfer([s.coilId], L2); await receiveTransfer(t.body);
    const [line] = await transferLines(t.body.id);
    const m = await movement(() => cancelTransfer(t.body));
    ok('refused', m.out.status === 409, `${m.out.status} ${err(m.out)}`);
    ok('nothing moved and no reversal exists', Object.keys(m.delta).length === 0 && (await entriesOf('StockTransferLine', line.id)).every((e) => e.kind === 'SYSTEM'));
  });

  await S('The gross margin report by branch separates the two branches\' sales and costs', async (ok) => {
    const rep = (await cfo.get('/api/ledger/reports/gross-margin?by=branch')).body;
    const [a, b] = [rep.rows.find((r) => r.key === L1.id), rep.rows.find((r) => r.key === L2.id)];
    ok('both branches have a row', a && b);
    ok('the second branch shows at least the sale made there', Number(b.netSales) >= 420 && Number(b.materialCost) >= 240, JSON.stringify(b));
    const own = (await bm2.get('/api/ledger/reports/gross-margin?by=branch')).body;
    ok('the second branch\'s manager gets only that row', own.rows.length >= 1 && own.rows.every((r) => r.key === L2.id || r.key === null), own.rows.map((r) => r.name).join(','));
  });
}
