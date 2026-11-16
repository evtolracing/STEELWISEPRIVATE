// Group 3: inventory valuation and adjustments.
export default async function stock(ctx, state) {
  const { scenario, G, prisma, A, B, cfo, w, L1, L2, near, err, tag, num, posted, expectEntry, eventOf, entriesOf, movement, adjust, lastMove, setCost } = ctx;
  const S = (name, fn) => scenario(G.stock, name, fn);
  /** What the books hold for one item across the stock accounts. */
  const booked = async (coilId) => Number((await prisma.$queryRaw`SELECT COALESCE(SUM(l."debit" - l."credit"), 0)::float AS v FROM "JournalLine" l JOIN "JournalEntry" e ON e."id" = l."entryId" JOIN "LedgerAccount" a ON a."id" = l."accountId" WHERE l."coilId" = ${coilId} AND e."status" = 'POSTED' AND a."code" IN ('1200', '1210', '1300')`)[0].v);
  const recordValue = async (coilId) => { const c = await ctx.coilOf(coilId); return +(num(c.inventory.qtyOnHand) * num(c.unitCost)).toFixed(2); };

  await S('Stock received against a purchase order comes onto the books at the order\'s cost, against goods received not invoiced', async (ok) => {
    const m = await movement(() => ctx.costed(5000, 0.42));
    const { event, entry } = await posted('STOCK_RECEIVED', 'MaterialMovement', m.out.movement.id);
    ok('posted', event?.status === 'POSTED', `${event?.status} ${event?.reason}`);
    expectEntry(ok, 'receipt', entry, { 1200: 2100, 2000: -2100 });
    ok('the lines name the item, the branch and the supplier', entry.lines.every((l) => l.coilId === m.out.coilId && l.locationId === L1.id) && entry.lines.some((l) => l.supplierId === w.supplierOrg.id));
    ok('the item is worth quantity times cost in the books', near(await booked(m.out.coilId), 2100));
    ok('the memo names the purchase order', entry.memo.includes(m.out.po.orderNumber), entry.memo);
  });

  await S('Two receipts against one purchase order line each post their own entry', async (ok) => {
    const po = await ctx.purchaseOrder(6000, 0.5);
    const m = await movement(async () => { const a = await A.post('/api/inventory/receipts', B.receiptBody({ weightLb: 2500, poLineId: po.lines[0].id })); const b = await A.post('/api/inventory/receipts', B.receiptBody({ weightLb: 3500, poLineId: po.lines[0].id })); return [a, b]; });
    ok('both received', m.out.every((r) => r.status === 201), m.out.map((r) => `${r.status} ${err(r)}`).join(' | '));
    ok('stock up 3,000.00 and payables clearing up 3,000.00', near(m.delta['1200'], 3000) && near(m.delta['2000'], -3000), JSON.stringify(m.delta));
    for (const r of m.out) ok(`item ${r.body.item.coilNumber} is booked at its own weight`, near(await booked(r.body.item.id), await recordValue(r.body.item.id)));
  });

  await S('Stock received with no purchase order is held for the accountant: no entry, no zero value, the reason is named', async (ok) => {
    const m = await movement(() => ctx.uncosted(1200));
    const move = await lastMove(m.out, { movementType: 'RECEIVE' });
    const event = await eventOf('STOCK_RECEIVED', 'MaterialMovement', move.id);
    ok('held for reconciliation', event?.status === 'RECONCILIATION_REQUIRED' && /no purchase order/.test(event.reason), `${event?.status} ${event?.reason}`);
    ok('nothing moved in the books', Object.keys(m.delta).length === 0, JSON.stringify(m.delta));
    ok('no entry exists for it', (await entriesOf('MaterialMovement', move.id)).length === 0);
    ok('it shows in the exceptions report', (await cfo.get('/api/ledger/reports/exceptions?limit=500')).body.events.some((e) => e.id === event.id));
    state.noPo = { coilId: m.out, eventId: event.id };
  });

  await S('The accountant can post a receipt with no purchase order by naming the account for the other side, once it has a cost', async (ok) => {
    const early = await cfo.post(`/api/ledger/events/${state.noPo.eventId}/retry`, { offsetAccountCode: '2000' });
    ok('with no cost it stays held, not posted at zero', early.status === 200 && early.body.status === 'RECONCILIATION_REQUIRED' && /No cost is on file/.test(early.body.reason), `${early.body?.status} ${early.body?.reason}`);
    const m = await movement(async () => { const c = await setCost(state.noPo.coilId, 0.5); const r = await cfo.post(`/api/ledger/events/${state.noPo.eventId}/retry`, { offsetAccountCode: '2000' }); return { c, r }; });
    ok('entering the cost alone posts nothing (the receipt has no rule for its other side)', m.out.c.status === 200);
    ok('the named retry posts it', m.out.r.body?.status === 'POSTED', `${m.out.r.status} ${m.out.r.body?.status} ${m.out.r.body?.reason}`);
    ok('stock up 600.00 against the account the accountant named', near(m.delta['1200'], 600) && near(m.delta['2000'], -600), JSON.stringify(m.delta));
    const entry = await ctx.entryOf(m.out.r.body.journalEntryId);
    ok('the entry says it was an accountant\'s choice', /accountant's choice/.test(entry.memo) && entry.createdById === cfo.user.id, entry.memo);
    ok('the retry is in the audit log with the account named', (await ctx.auditsOf('LEDGER_EVENT_RETRIED', state.noPo.eventId)).some((a) => a.details.offsetAccountCode === '2000' && a.details.after === 'POSTED'));
  });

  await S('Naming an account that is not in the chart posts nothing and substitutes nothing', async (ok) => {
    const coilId = await ctx.uncosted(400);
    await setCost(coilId, 0.25);
    const move = await lastMove(coilId, { movementType: 'RECEIVE' });
    const event = await eventOf('STOCK_RECEIVED', 'MaterialMovement', move.id);
    const m = await movement(() => cfo.post(`/api/ledger/events/${event.id}/retry`, { offsetAccountCode: '9876' }));
    ok('it failed and says the account is not in the chart', m.out.body?.status === 'FAILED' && /9876 is not in the chart/.test(m.out.body.reason), `${m.out.body?.status} ${m.out.body?.reason}`);
    ok('nothing moved', Object.keys(m.delta).length === 0, JSON.stringify(m.delta));
    const settled = await cfo.post(`/api/ledger/events/${event.id}/retry`, { offsetAccountCode: '3000' });
    ok('with a real account it posts', settled.body?.status === 'POSTED', `${settled.body?.status} ${settled.body?.reason}`);
  });

  await S('A count that finds more adds the value to stock against count variance', async (ok) => {
    const s = await ctx.costed(1000, 0.4);
    const m = await movement(() => adjust(s.coilId, { reason: 'COUNT', countedQty: 1025 }));
    ok('saved', m.out.status === 201, `${m.out.status} ${err(m.out)}`);
    expectEntry(ok, 'count up', (await posted('STOCK_ADJUSTED', 'MaterialMovement', m.out.body.movement.id)).entry, { 1200: 10, 5310: -10 });
    ok('books equal quantity times cost for the item', near(await booked(s.coilId), 410));
  });

  await S('A count that finds less takes the value out of stock into count variance', async (ok) => {
    const s = await ctx.costed(1000, 0.4);
    const m = await movement(() => adjust(s.coilId, { reason: 'COUNT', countedQty: 940 }));
    expectEntry(ok, 'count down', (await posted('STOCK_ADJUSTED', 'MaterialMovement', m.out.body.movement.id)).entry, { 5310: 24, 1200: -24 });
    ok('books equal quantity times cost for the item', near(await booked(s.coilId), 376));
  });

  await S('Damage written off goes to scrap and write-offs, not to count variance', async (ok) => {
    const s = await ctx.costed(1000, 0.4);
    const m = await movement(() => adjust(s.coilId, { reason: 'DAMAGE', change: -150, notes: 'Forklift damage on one corner' }));
    ok('saved', m.out.status === 201, `${m.out.status} ${err(m.out)}`);
    ok('scrap up 60.00, stock down 60.00, variance untouched', near(m.delta['5300'], 60) && near(m.delta['1200'], -60) && !m.delta['5310'], JSON.stringify(m.delta));
  });

  await S('Scrap taken off a balance posts at the item\'s cost to scrap and write-offs', async (ok) => {
    const s = await ctx.costed(800, 0.55);
    const m = await movement(() => adjust(s.coilId, { reason: 'SCRAP', change: -80, notes: 'Rusted end cut off' }));
    const { event, entry } = await posted('STOCK_SCRAPPED', 'MaterialMovement', m.out.body.movement.id);
    ok('posted as scrap', event?.status === 'POSTED', `${event?.status} ${event?.reason}`);
    expectEntry(ok, 'scrap', entry, { 5300: 44, 1200: -44 });
  });

  await S('Found stock and a typing correction both go through count variance, in the right direction', async (ok) => {
    const s = await ctx.costed(500, 0.4);
    const m = await movement(async () => { const a = await adjust(s.coilId, { reason: 'FOUND', change: 50, notes: 'Found behind rack 7' }); const b = await adjust(s.coilId, { reason: 'CORRECTION', change: -20, notes: 'Typed 520, meant 500' }); return [a, b]; });
    ok('both saved', m.out.every((r) => r.status === 201), m.out.map((r) => r.status).join(','));
    ok('net 30 lb at 0.40: stock up 12.00, variance down 12.00', near(m.delta['1200'], 12) && near(m.delta['5310'], -12), JSON.stringify(m.delta));
  });

  await S('A count on an item with no cost is held by name; the count itself is saved and nothing is valued at zero', async (ok) => {
    const coilId = await ctx.uncosted(900);
    const m = await movement(() => adjust(coilId, { reason: 'COUNT', countedQty: 880 }));
    ok('the count was saved', m.out.status === 201 && num((await ctx.coilOf(coilId)).inventory.qtyOnHand) === 880);
    const event = await eventOf('STOCK_ADJUSTED', 'MaterialMovement', m.out.body.movement.id);
    ok('held, with the reason', event?.status === 'RECONCILIATION_REQUIRED' && /No cost is on file/.test(event.reason), `${event?.status} ${event?.reason}`);
    ok('nothing moved in the books', Object.keys(m.delta).length === 0);
  });

  await S('A count that confirms the balance writes no stock movement and no ledger event', async (ok) => {
    const s = await ctx.costed(700, 0.4);
    const before = await prisma.ledgerEvent.count();
    const m = await movement(() => adjust(s.coilId, { reason: 'COUNT', countedQty: 700 }));
    ok('confirmed', m.out.status === 200 && m.out.body.movement === null, `${m.out.status}`);
    ok('no new event and no movement in the books', (await prisma.ledgerEvent.count()) === before && Object.keys(m.delta).length === 0);
  });

  await S('Raising the cost of stock on hand revalues it against inventory cost adjustments', async (ok) => {
    const s = await ctx.costed(1000, 0.4);
    const m = await movement(() => setCost(s.coilId, 0.46));
    ok('saved', m.out.status === 200, `${m.out.status} ${err(m.out)}`);
    ok('stock up 60.00 against cost adjustments', near(m.delta['1200'], 60) && near(m.delta['5320'], -60), JSON.stringify(m.delta));
    ok('books equal quantity times the new cost', near(await booked(s.coilId), 460));
    const change = (await ctx.auditsOf('STOCK_COST_CHANGED', s.coilId)).pop();
    ok('the change is on record with both costs and who made it', change && Number(change.details.from) === 0.4 && Number(change.details.to) === 0.46 && change.userId === ctx.users.admin.id, JSON.stringify(change?.details));
  });

  await S('Lowering the cost takes the difference out of stock; saving the same cost again posts nothing', async (ok) => {
    const s = await ctx.costed(1000, 0.4);
    const m = await movement(() => setCost(s.coilId, 0.31));
    ok('stock down 90.00 against cost adjustments', near(m.delta['1200'], -90) && near(m.delta['5320'], 90), JSON.stringify(m.delta));
    const again = await movement(() => setCost(s.coilId, 0.31));
    ok('the same cost again moves nothing', Object.keys(again.delta).length === 0, JSON.stringify(again.delta));
  });

  await S('An item that had no cost at the opening balance comes onto the books against opening equity when its cost is entered', async (ok) => {
    const coilId = state.pre.noCost;
    ok('it was on no line before', (await prisma.journalLine.count({ where: { coilId } })) === 0);
    const m = await movement(() => setCost(coilId, 0.36));
    ok('saved', m.out.status === 200, `${m.out.status} ${err(m.out)}`);
    ok('1,500 lb at 0.36: stock up 540.00 against opening equity', near(m.delta['1200'], 540) && near(m.delta['3000'], -540) && !m.delta['5320'], JSON.stringify(m.delta));
    ok('the entry says it had no cost at the opening balance', /had none at the opening balance/.test((await entriesOf('AuditLog', (await ctx.auditsOf('STOCK_COST_CHANGED', coilId)).pop().id))[0].memo));
  });

  await S('A sales rep cannot change a cost, and nothing is posted', async (ok) => {
    const s = await ctx.costed(300, 0.4);
    const m = await movement(() => ctx.sales.put(`/api/coils/${s.coilId}`, { unitCost: 9.99 }));
    ok('refused', m.out.status === 403, `${m.out.status} ${err(m.out)}`);
    ok('the cost is unchanged and nothing moved', near((await ctx.coilOf(s.coilId)).unitCost, 0.4) && Object.keys(m.delta).length === 0);
  });

  await S('A piece cut from an item moves value from the parent to the piece: stock in total does not change', async (ok) => {
    const s = await ctx.costed(2000, 0.4);
    const parent = await ctx.coilOf(s.coilId);
    const m = await movement(() => A.post('/api/inventory/receipts', { coilNumber: tag('CUT'), form: 'PLATE', parentTag: parent.coilNumber, thicknessIn: 0.5, widthIn: 20, lengthIn: 40, weightLb: 400, locationId: L1.id }));
    ok('recorded', m.out.status === 201, `${m.out.status} ${err(m.out)}`);
    const child = m.out.body.item.id;
    ok('no account balance changed', Object.keys(m.delta).length === 0, JSON.stringify(m.delta));
    ok('the piece is worth 160.00 and the parent 640.00', near(await booked(child), 160) && near(await booked(s.coilId), 640), `${await booked(child)} ${await booked(s.coilId)}`);
    const move = await lastMove(child, { movementType: 'RECEIVE' });
    ok('one entry, for the piece; the parent\'s own movement has none', (await eventOf('PIECE_CUT', 'MaterialMovement', move.id))?.status === 'POSTED' && (await prisma.ledgerEvent.count({ where: { sourceId: (await lastMove(s.coilId, { movementType: 'CONSUME' })).id } })) === 0);
  });

  await S('An item relieved in three parts ends at exactly zero in the books: the odd cent goes to Rounding', async (ok) => {
    const s = await ctx.costed(1000, 0.3335); // 333.50 on receipt
    const m = await movement(async () => { for (const q of [-333, -333, -334]) { const r = await adjust(s.coilId, { reason: 'DAMAGE', change: q, notes: 'Written off in three parts' }); if (r.status !== 201) throw new Error(`adjust ${r.status} ${err(r)}`); } });
    ok('the item is empty in the records', num((await ctx.coilOf(s.coilId)).inventory.qtyOnHand) === 0);
    ok('and worth exactly zero in the books', near(await booked(s.coilId), 0, 0.0001), `${await booked(s.coilId)}`);
    ok('stock fell by exactly what was received', near(m.delta['1200'], -333.5), JSON.stringify(m.delta));
    ok('one cent was cleared to Rounding, in the open', near(Math.abs(m.delta['5390'] || 0), 0.01) && near((m.delta['5300'] || 0) + (m.delta['5390'] || 0), 333.5), JSON.stringify(m.delta));
  });

  await S('The plain "receive" address, which names no purchase order, is held the same way', async (ok) => {
    const s = await ctx.costed(500, 0.4);
    const m = await movement(() => A.post('/api/inventory/receive', { coilId: s.coilId, locationId: L1.id, qty: 100 }));
    ok('saved', m.out.status === 201, `${m.out.status} ${err(m.out)}`);
    const event = await eventOf('STOCK_RECEIVED', 'MaterialMovement', m.out.body.movement.id);
    ok('held: no purchase order', event?.status === 'RECONCILIATION_REQUIRED' && /no purchase order/.test(event.reason), `${event?.status} ${event?.reason}`);
    ok('nothing moved in the books', Object.keys(m.delta).length === 0);
    const rec = (await cfo.post('/api/ledger/reconciliations')).body.checks.find((c) => c.key === 'INVENTORY');
    ok('the reconciliation names the item as out of step until it is settled', rec.status === 'DIFFERENCE' && rec.detail.some((d) => d.coilId === s.coilId), `${rec.status} ${JSON.stringify(rec.detail).slice(0, 200)}`);
    const settled = await cfo.post(`/api/ledger/events/${event.id}/retry`, { offsetAccountCode: '2000' });
    ok('posted by the accountant\'s choice', settled.body?.status === 'POSTED', `${settled.body?.status} ${settled.body?.reason}`);
    ok('the item agrees again', near(await booked(s.coilId), await recordValue(s.coilId)));
  });

  await S('An upload of stock with no purchase orders is held row by row; nothing is valued', async (ok) => {
    const rows = [1, 2, 3].map(() => ({ tag_number: tag('UP'), heat_number: ctx.heat.heatNumber, grade: ctx.heat.grade.code, thickness: 0.5, width: 48, length: 96, weight_lbs: 1000, location_code: L1.code }));
    const m = await movement(() => A.post('/api/inventory/bulk-upload', { templateType: 'plates', items: rows }));
    ok('uploaded', m.out.status === 200 || m.out.status === 201, `${m.out.status} ${JSON.stringify(m.out.body).slice(0, 300)}`);
    const coils = await prisma.coil.findMany({ where: { coilNumber: { in: rows.map((r) => r.tag_number) } }, select: { id: true } });
    const moves = await prisma.materialMovement.findMany({ where: { coilId: { in: coils.map((c) => c.id) } } });
    const events = await prisma.ledgerEvent.findMany({ where: { sourceId: { in: moves.map((x) => x.id) } } });
    ok('every imported row has a held event', coils.length === m.out.body.imported && events.length === coils.length && events.every((e) => e.status === 'RECONCILIATION_REQUIRED'), `${coils.length} rows, ${events.length} events, imported ${m.out.body?.imported}`);
    ok('nothing moved in the books', Object.keys(m.delta).length === 0);
  });

  await S('Stock received at another branch is booked to that branch', async (ok) => {
    const s = await ctx.costed(1000, 0.4, { locationId: L2.id });
    const { entry } = await posted('STOCK_RECEIVED', 'MaterialMovement', s.movement.id);
    ok('every line carries the second branch', entry.lines.every((l) => l.locationId === L2.id) && entry.locationId === L2.id);
    const rep = (await cfo.get('/api/ledger/reports/inventory')).body;
    ok('the valuation report has a row for that branch', rep.rows.some((r) => r.locationId === L2.id && Number(r.ledger) >= 400));
  });

  await S('An item whose cost is zero has no value: its movements are settled as "nothing to post", not as exceptions', async (ok) => {
    const coilId = await ctx.uncosted(300);
    await setCost(coilId, 0);
    const m = await movement(() => adjust(coilId, { reason: 'COUNT', countedQty: 290 }));
    const event = await eventOf('STOCK_ADJUSTED', 'MaterialMovement', m.out.body.movement.id);
    ok('settled with nothing to post', event?.status === 'NOT_POSTED' && /zero/.test(event.reason), `${event?.status} ${event?.reason}`);
    ok('nothing moved', Object.keys(m.delta).length === 0);
  });

  await S('The scrap report, read from the books, rises by exactly what was written off', async (ok) => {
    const total = async () => Number((await cfo.get('/api/ledger/reports/scrap')).body.total);
    const before = await total();
    const s = await ctx.costed(600, 0.5);
    await adjust(s.coilId, { reason: 'SCRAP', change: -40, notes: 'Edge damage trimmed' });
    ok('up by 20.00', near((await total()) - before, 20), `${(await total()) - before}`);
  });

  await S('Material shipped after its cost was changed leaves at the new cost, and the item ends at zero', async (ok) => {
    const s = await ctx.costed(1000, 0.4);
    await setCost(s.coilId, 0.5);
    const r = await ctx.shipped(1000, { price: 0.9, coilId: s.coilId });
    expectEntry(ok, 'shipment', (await posted('STOCK_SHIPPED', 'MaterialMovement', r.move.id)).entry, { 5000: 500, 1200: -500 });
    ok('the item is worth zero in the books', near(await booked(s.coilId), 0, 0.0001));
  });

  await S('Three corrections of the same item at once are all posted, and the books equal quantity times cost', async (ok) => {
    const s = await ctx.costed(1000, 0.4);
    const rs = await ctx.all(3, (i) => adjust(s.coilId, { reason: 'CORRECTION', change: -(10 + i), notes: `Simultaneous correction ${i}` }));
    ok('all three saved', rs.every((r) => r.status === 201), rs.map((r) => `${r.status} ${err(r)}`).join(' | '));
    const events = await prisma.ledgerEvent.findMany({ where: { sourceId: { in: rs.map((r) => r.body.movement.id) } } });
    ok('all three posted', events.length === 3 && events.every((e) => e.status === 'POSTED'), events.map((e) => `${e.status} ${e.reason || ''}`).join(' | '));
    ok('967 lb at 0.40 in the books', near(await booked(s.coilId), 386.8), `${await booked(s.coilId)}`);
  });

  await S('A stock balance changed behind the product\'s back shows as a named difference; the reconciliation corrects nothing', async (ok) => {
    const s = await ctx.costed(1000, 0.4);
    await prisma.inventory.update({ where: { coilId: s.coilId }, data: { qtyOnHand: 900, qtyAvailable: 900 } }); // 40.00 gone with no movement
    const entriesBefore = await prisma.journalEntry.count();
    const rec = (await cfo.post('/api/ledger/reconciliations')).body;
    const inv = rec.checks.find((c) => c.key === 'INVENTORY');
    const row = inv.detail.find((d) => d.coilId === s.coilId);
    ok('the stock check reports a difference', inv.status === 'DIFFERENCE' && rec.passed === false, inv.status);
    ok('it names the item and the 40.00', row && near(row.difference, 40), JSON.stringify(row));
    ok('it posted nothing to make the difference go away', (await prisma.journalEntry.count()) === entriesBefore && near(await booked(s.coilId), 400));
    await prisma.inventory.update({ where: { coilId: s.coilId }, data: { qtyOnHand: 1000, qtyAvailable: 1000 } }); // the change is undone the way it was made
    const again = (await cfo.post('/api/ledger/reconciliations')).body.checks.find((c) => c.key === 'INVENTORY');
    ok('with the records put right the item is no longer listed', !again.detail.some((d) => d.coilId === s.coilId));
  });

  await S('The inventory valuation report: every branch\'s books equal its stock records, to within the stated rounding', async (ok) => {
    const rep = (await cfo.get('/api/ledger/reports/inventory')).body;
    ok('answers with a method that is named as proposed', /Specific identification/.test(rep.method) && /not approved/.test(rep.method));
    const off = rep.itemsThatDisagree.filter((i) => !i.withinRounding);
    // Items held as exceptions earlier in this group (received with no purchase order and never settled) are expected here, by name.
    const open = new Set((await prisma.materialMovement.findMany({ where: { id: { in: (await prisma.ledgerEvent.findMany({ where: { status: { in: ['FAILED', 'RECONCILIATION_REQUIRED'] }, sourceType: 'MaterialMovement' }, select: { sourceId: true } })).map((e) => e.sourceId) } }, select: { coilId: true } })).map((x) => x.coilId));
    const unexplained = off.filter((i) => !open.has(i.coilId));
    ok('every item that disagrees has an open exception that explains it', unexplained.length === 0, JSON.stringify(unexplained.slice(0, 5)));
    ok('items with no cost are counted and left out', typeof rep.totals.uncostedItems === 'number' && /not valued at zero/.test(rep.note));
  });
}
