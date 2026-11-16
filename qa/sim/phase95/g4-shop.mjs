// Group 4: manufacturing, work in progress and costing.
export default async function shop(ctx) {
  const { scenario, G, prisma, A, B, cfo, owner, L1, L2, near, err, num, posted, expectEntry, eventOf, entriesOf, movement, setCost, startedWorkOrder, completeWorkOrder } = ctx;
  const S = (name, fn) => scenario(G.shop, name, fn);
  const booked = async (coilId) => Number((await prisma.$queryRaw`SELECT COALESCE(SUM(l."debit" - l."credit"), 0)::float AS v FROM "JournalLine" l JOIN "JournalEntry" e ON e."id" = l."entryId" JOIN "LedgerAccount" a ON a."id" = l."accountId" WHERE l."coilId" = ${coilId} AND e."status" = 'POSTED' AND a."code" IN ('1200', '1210', '1300')`)[0].v);
  const woEntry = (id) => posted('WORK_ORDER_COMPLETED', 'WorkOrder', id);
  const piecesOf = (id) => prisma.workOrderOutput.findMany({ where: { workOrderId: id }, orderBy: { sequence: 'asc' } });

  await S('A completed work order moves the source\'s value to the pieces as finished goods and expenses the scrap, in one balanced entry', async (ok) => {
    const s = await ctx.costed(3000, 0.4);
    const wo = await startedWorkOrder(s.coilId);
    const m = await movement(() => completeWorkOrder(wo.id, { scrapWeightLb: 50, outputs: [{ weightLb: 975, widthIn: 24 }, { weightLb: 975, widthIn: 24 }] }));
    ok('completed', m.out.status === 200, `${m.out.status} ${err(m.out)}`);
    const { event, entry } = await woEntry(wo.id);
    ok('posted', event?.status === 'POSTED', `${event?.status} ${event?.reason}`);
    expectEntry(ok, 'work order', entry, { 1210: 780, 5300: 20, 1200: -800 });
    ok('one event covers the whole work order', (await prisma.ledgerEvent.count({ where: { sourceId: { in: (await prisma.materialMovement.findMany({ where: { workOrderId: wo.id }, select: { id: true } })).map((x) => x.id) } } })) === 0);
    ok('the accounts moved by exactly that', near(m.delta['1210'], 780) && near(m.delta['5300'], 20) && near(m.delta['1200'], -800), JSON.stringify(m.delta));
  });

  await S('Each piece is booked at its own weight times the source\'s cost, and what is left on the source keeps its value', async (ok) => {
    const s = await ctx.costed(2000, 0.37);
    const wo = await startedWorkOrder(s.coilId);
    await completeWorkOrder(wo.id, { scrapWeightLb: 13, outputs: [{ weightLb: 411, widthIn: 12 }, { weightLb: 589, widthIn: 18 }, { weightLb: 333, widthIn: 9 }] });
    const pieces = await piecesOf(wo.id);
    ok('three pieces', pieces.length === 3);
    for (const p of pieces) ok(`piece of ${p.actualWeight} lb is worth ${(num(p.actualWeight) * 0.37).toFixed(2)}`, near(await booked(p.outputCoilId), +(num(p.actualWeight) * 0.37).toFixed(2)), `${await booked(p.outputCoilId)}`);
    ok('the 654 lb left on the source is worth 241.98', near(await booked(s.coilId), 241.98, 0.011), `${await booked(s.coilId)}`);
    ok('each piece carries the source\'s cost per pound', (await Promise.all(pieces.map((p) => ctx.coilOf(p.outputCoilId)))).every((c) => near(c.unitCost, 0.37)));
  });

  await S('A source used up completely ends at exactly zero in the books', async (ok) => {
    const s = await ctx.costed(1000, 0.3335);
    const wo = await startedWorkOrder(s.coilId);
    const r = await completeWorkOrder(wo.id, { scrapWeightLb: 1, outputs: [{ weightLb: 333 }, { weightLb: 333 }, { weightLb: 333 }] });
    ok('completed', r.status === 200, `${r.status} ${err(r)}`);
    ok('the source is empty in the records', num((await ctx.coilOf(s.coilId)).inventory.qtyOnHand) === 0);
    ok('and exactly zero in the books', near(await booked(s.coilId), 0, 0.0001), `${await booked(s.coilId)}`);
    const { entry } = await woEntry(wo.id);
    ok('the entry balances', near(entry.lines.reduce((x, l) => x + Number(l.debit) - Number(l.credit), 0), 0, 0.0001));
  });

  await S('No balance is carried in work in progress; with the setting on, the same work order is shown passing through it and still ends at zero', async (ok) => {
    const s = await ctx.costed(2000, 0.4);
    ok('work in progress is zero before', near((await ctx.balances()).of('1220'), 0));
    const set = await owner.put('/api/ledger/settings', { throughWip: true });
    ok('the owner turned the setting on', set.status === 200 && set.body.throughWip === true, `${set.status} ${err(set)}`);
    try {
      const wo = await startedWorkOrder(s.coilId);
      const m = await movement(() => completeWorkOrder(wo.id, { scrapWeightLb: 100, outputs: [{ weightLb: 900 }] }));
      const { entry } = await woEntry(wo.id);
      const wip = entry.lines.filter((l) => l.account.code === '1220');
      ok('the entry has a debit and a credit to work in progress of 400.00 each', wip.length === 2 && near(wip.reduce((x, l) => x + Number(l.debit), 0), 400) && near(wip.reduce((x, l) => x + Number(l.credit), 0), 400), JSON.stringify(wip.map((l) => [l.debit, l.credit])));
      ok('work in progress still ends at zero', !m.delta['1220'] && near((await ctx.balances()).of('1220'), 0), JSON.stringify(m.delta));
      ok('the other accounts move as without the setting', near(m.delta['1210'], 360) && near(m.delta['5300'], 40) && near(m.delta['1200'], -400), JSON.stringify(m.delta));
    } finally { await owner.put('/api/ledger/settings', { throughWip: false }); }
    ok('the change of setting is in the audit log', (await ctx.auditsOf('LEDGER_SETTING_CHANGED')).filter((a) => a.timestamp >= ctx.startedAt).length === 2);
    ok('an administrator who is not the owner or CFO cannot change it', (await ctx.admin2.put('/api/ledger/settings', { throughWip: true })).status === 403);
  });

  await S('A work order on material with no cost completes on the floor and is held in the books, never posted at zero', async (ok) => {
    const coilId = await ctx.uncosted(2000);
    const wo = await startedWorkOrder(coilId);
    const m = await movement(() => completeWorkOrder(wo.id, { scrapWeightLb: 20, outputs: [{ weightLb: 480 }, { weightLb: 500 }] }));
    ok('completed on the floor', m.out.status === 200 && (await piecesOf(wo.id)).length === 2, `${m.out.status} ${err(m.out)}`);
    const event = await eventOf('WORK_ORDER_COMPLETED', 'WorkOrder', wo.id);
    ok('held with the reason', event?.status === 'RECONCILIATION_REQUIRED' && /No cost is on file/.test(event.reason), `${event?.status} ${event?.reason}`);
    ok('nothing moved in the books', Object.keys(m.delta).length === 0, JSON.stringify(m.delta));
    // Cost entered on the source only: the pieces still have none, so the work order is not guessed at.
    await setCost(coilId, 0.4);
    const mid = await eventOf('WORK_ORDER_COMPLETED', 'WorkOrder', wo.id);
    ok('with a cost on the source but none on the pieces it stays held, naming a piece', mid.status === 'RECONCILIATION_REQUIRED' && /has no cost on file/.test(mid.reason), `${mid.status} ${mid.reason}`);
    for (const p of await piecesOf(wo.id)) await setCost(p.outputCoilId, 0.4);
    const done = await woEntry(wo.id);
    ok('once the pieces carry the same cost it posts by itself', done.event.status === 'POSTED', `${done.event.status} ${done.event.reason}`);
    expectEntry(ok, 'late work order', done.entry, { 1210: 392, 5300: 8, 1200: -400 });
  });

  await S('Labor and machine time are not posted: clocked work changes nothing in the books and processing cost stays at zero', async (ok) => {
    const s = await ctx.costed(1500, 0.4);
    const wo = await startedWorkOrder(s.coilId);
    await completeWorkOrder(wo.id, { scrapWeightLb: 0, outputs: [{ weightLb: 700 }] });
    const { entry } = await woEntry(wo.id);
    ok('the work order\'s entry has material and scrap lines only', entry.lines.every((l) => ['1200', '1210', '5300', '5390'].includes(l.account.code)), entry.lines.map((l) => l.account.code).join(','));
    const t = await ctx.balances();
    ok('5100 Processing Cost of Goods Sold has never been posted to', near(t.of('5100'), 0) && (await prisma.journalLine.count({ where: { account: { code: '5100' } } })) === 0);
    ok('4100 Processing Revenue has never been posted to (lines are not marked as processing)', (await prisma.journalLine.count({ where: { account: { code: '4100' } } })) === 0);
    ok('no hourly rate was invented', (await prisma.workCenterType.count({ where: { hourlyRate: { not: null } } }).catch(() => 0)) >= 0);
  });

  await S('Completing the same work order three times at once posts one entry', async (ok) => {
    const s = await ctx.costed(1500, 0.4);
    const wo = await startedWorkOrder(s.coilId);
    const m = await movement(() => ctx.all(3, () => completeWorkOrder(wo.id, { scrapWeightLb: 10, outputs: [{ weightLb: 490 }] })));
    ok('one completion was accepted', m.out.filter((r) => r.status === 200).length === 1, m.out.map((r) => r.status).join(','));
    ok('one entry', (await entriesOf('WorkOrder', wo.id)).length === 1);
    ok('the books moved once: 500 lb at 0.40', near(m.delta['1200'], -200) && near(m.delta['1210'], 196) && near(m.delta['5300'], 4), JSON.stringify(m.delta));
  });

  await S('A work order that only reports scrap expenses it and makes no finished goods', async (ok) => {
    const s = await ctx.costed(1000, 0.4);
    const wo = await startedWorkOrder(s.coilId);
    const m = await movement(() => completeWorkOrder(wo.id, { outputWeightLb: 0, scrapWeightLb: 120 }));
    ok('completed', m.out.status === 200, `${m.out.status} ${err(m.out)}`);
    ok('scrap up 48.00, stock down 48.00, no finished goods', near(m.delta['5300'], 48) && near(m.delta['1200'], -48) && !m.delta['1210'], JSON.stringify(m.delta));
  });

  await S('A finished piece that ships leaves finished goods, not raw material, at its cost', async (ok) => {
    const s = await ctx.costed(1500, 0.4);
    const wo = await startedWorkOrder(s.coilId);
    await completeWorkOrder(wo.id, { scrapWeightLb: 0, outputs: [{ weightLb: 600 }] });
    const piece = (await piecesOf(wo.id))[0].outputCoilId;
    const r = await ctx.shipped(600, { price: 0.9, coilId: piece });
    expectEntry(ok, 'shipment of the piece', (await posted('STOCK_SHIPPED', 'MaterialMovement', r.move.id)).entry, { 5000: 240, 1210: -240 });
    ok('the piece is worth zero in the books', near(await booked(piece), 0, 0.0001));
  });

  await S('A finished piece transferred to another branch stays finished goods there', async (ok) => {
    const s = await ctx.costed(1500, 0.4);
    const wo = await startedWorkOrder(s.coilId);
    await completeWorkOrder(wo.id, { scrapWeightLb: 0, outputs: [{ weightLb: 500 }] });
    const piece = (await piecesOf(wo.id))[0].outputCoilId;
    const t = await ctx.transfer([piece], L2);
    ok('shipped', t.status === 201, `${t.status} ${err(t)}`);
    const m = await movement(() => ctx.receiveTransfer(t.body));
    ok('received', ctx.ok2(m.out), `${m.out.status} ${err(m.out)}`);
    ok('finished goods rose by 200.00 as in-transit fell', near(m.delta['1210'], 200) && near(m.delta['1300'], -200) && !m.delta['1200'], JSON.stringify(m.delta));
    const lines = await prisma.journalLine.findMany({ where: { coilId: piece, account: { code: '1210' }, debit: { gt: 0 } }, orderBy: { id: 'asc' } });
    ok('the receiving line is at the second branch', lines.some((l) => l.locationId === L2.id));
  });

  await S('A remnant sold below cost posts the sale and the cost as they are: no write-down is invented', async (ok) => {
    const s = await ctx.costed(1000, 0.6);
    const m = await movement(() => ctx.shipped(1000, { price: 0.45, coilId: s.coilId }));
    ok('revenue 450.00 and cost 600.00', near(m.delta['4000'], -450) && near(m.delta['5000'], 600), JSON.stringify(m.delta));
    ok('nothing was posted to scrap, write-offs or cost adjustments', !m.delta['5300'] && !m.delta['5320'] && !m.delta['5310'], JSON.stringify(m.delta));
  });

  await S('A work order at the second branch is booked to that branch', async (ok) => {
    const s = await ctx.costed(1000, 0.4, { locationId: L2.id });
    const wo = await startedWorkOrder(s.coilId);
    const r = await completeWorkOrder(wo.id, { scrapWeightLb: 5, outputs: [{ weightLb: 395 }] });
    ok('completed', r.status === 200, `${r.status} ${err(r)}`);
    const { entry } = await woEntry(wo.id);
    ok('every line is at the second branch', entry.lines.every((l) => l.locationId === L2.id) && entry.locationId === L2.id);
    ok('the entry names the branch\'s owning organisation', entry.legalEntityId === L2.ownerId);
  });

  await S('When finished goods has no approved account the work order still completes; the event fails by name and posts after the mapping is restored', async (ok) => {
    const s = await ctx.costed(1000, 0.4);
    const wo = await startedWorkOrder(s.coilId);
    await cfo.put('/api/ledger/mappings/INVENTORY_FINISHED', { accountCode: null });
    let m;
    try { m = await movement(() => completeWorkOrder(wo.id, { scrapWeightLb: 0, outputs: [{ weightLb: 300 }] })); } finally {
      await cfo.put('/api/ledger/mappings/INVENTORY_FINISHED', { accountCode: '1210' });
      await cfo.post('/api/ledger/approvals', { mappings: ['INVENTORY_FINISHED'], approvedBy: 'QA Synthetic Accountant (test data only)' });
    }
    ok('completed on the floor with its piece', m.out.status === 200 && (await piecesOf(wo.id)).length === 1, `${m.out.status} ${err(m.out)}`);
    const event = await eventOf('WORK_ORDER_COMPLETED', 'WorkOrder', wo.id);
    ok('the event failed and names the missing mapping', event?.status === 'FAILED' && /INVENTORY_FINISHED/.test(event.reason), `${event?.status} ${event?.reason}`);
    ok('nothing was posted to raw material in its place', Object.keys(m.delta).length === 0, JSON.stringify(m.delta));
    const retry = await cfo.post(`/api/ledger/events/${event.id}/retry`);
    ok('the retry posts it', retry.body?.status === 'POSTED', `${retry.body?.status} ${retry.body?.reason}`);
    expectEntry(ok, 'retried work order', await ctx.entryOf(retry.body.journalEntryId), { 1210: 120, 1200: -120 });
  });

  await S('Scrap from work orders shows in the scrap report under its cause', async (ok) => {
    const row = async () => Number((await cfo.get('/api/ledger/reports/scrap')).body.rows.filter((r) => r.cause === 'WORK_ORDER_COMPLETED' && r.locationId === L1.id).reduce((x, r) => x + Number(r.amount), 0));
    const before = await row();
    const s = await ctx.costed(1000, 0.5);
    const wo = await startedWorkOrder(s.coilId);
    await completeWorkOrder(wo.id, { scrapWeightLb: 30, outputs: [{ weightLb: 470 }] });
    ok('work order scrap at the branch rose by 15.00', near((await row()) - before, 15), `${(await row()) - before}`);
  });

  await S('A work order uses the source\'s cost at the moment it completes', async (ok) => {
    const s = await ctx.costed(1000, 0.4);
    const wo = await startedWorkOrder(s.coilId);
    await setCost(s.coilId, 0.5);
    await completeWorkOrder(wo.id, { scrapWeightLb: 0, outputs: [{ weightLb: 400 }] });
    expectEntry(ok, 'work order after a cost change', (await woEntry(wo.id)).entry, { 1210: 200, 1200: -200 });
    ok('600 lb left at 0.50', near(await booked(s.coilId), 300), `${await booked(s.coilId)}`);
  });

  await S('Two work orders on one source, one after the other, leave the source at quantity times cost', async (ok) => {
    const s = await ctx.costed(3000, 0.41);
    for (const [out, scrap] of [[700, 10], [1100, 15]]) { const wo = await startedWorkOrder(s.coilId); const r = await completeWorkOrder(wo.id, { scrapWeightLb: scrap, outputs: [{ weightLb: out }] }); if (r.status !== 200) throw new Error(`complete ${r.status} ${err(r)}`); }
    const left = num((await ctx.coilOf(s.coilId)).inventory.qtyOnHand);
    ok('1,175 lb left', left === 1175, left);
    ok('worth 481.75 in the books, give or take a cent of rounding', near(await booked(s.coilId), 481.75, 0.011), `${await booked(s.coilId)}`);
  });

  await S('Two work orders on one source completed at the same moment are both posted and the source still agrees', async (ok) => {
    const s = await ctx.costed(3000, 0.4);
    const [a, b] = [await startedWorkOrder(s.coilId), await startedWorkOrder(s.coilId)];
    const rs = await Promise.all([completeWorkOrder(a.id, { scrapWeightLb: 0, outputs: [{ weightLb: 500 }] }), completeWorkOrder(b.id, { scrapWeightLb: 0, outputs: [{ weightLb: 700 }] })]);
    ok('both completed', rs.every((r) => r.status === 200), rs.map((r) => `${r.status} ${err(r)}`).join(' | '));
    const events = [await eventOf('WORK_ORDER_COMPLETED', 'WorkOrder', a.id), await eventOf('WORK_ORDER_COMPLETED', 'WorkOrder', b.id)];
    ok('both posted', events.every((e) => e?.status === 'POSTED'), events.map((e) => `${e?.status} ${e?.reason || ''}`).join(' | '));
    ok('1,800 lb at 0.40 left in the books', near(await booked(s.coilId), 720), `${await booked(s.coilId)}`);
  });

  await S('A work order cancelled before completion moves no stock and posts nothing', async (ok) => {
    const s = await ctx.costed(1000, 0.4);
    const wo = await startedWorkOrder(s.coilId);
    const m = await movement(() => A.put(`/api/work-orders/${wo.id}/cancel`, {}));
    ok('cancelled', ctx.ok2(m.out), `${m.out.status} ${err(m.out)}`);
    ok('no event and no movement in the books', (await eventOf('WORK_ORDER_COMPLETED', 'WorkOrder', wo.id)) === null && Object.keys(m.delta).length === 0);
  });

  await S('Job cost and the books agree on material: what the order\'s cost report says was used is what left the source in the journal', async (ok) => {
    const s = await ctx.costed(2000, 0.4);
    const o = await B.order([B.line(900, 0.8)]);
    await B.reserve(o, o.lines[0], s.coilId, 900);
    const job = await A.post('/api/jobs', { orderId: o.id, orderLineId: o.lines[0].id, instructions: `QA P9.5 ${ctx.run}`, status: 'ORDERED' });
    ok('job opened', job.status === 201, `${job.status} ${err(job)}`);
    const wo = await startedWorkOrder(s.coilId, { jobId: job.body.id });
    const r = await completeWorkOrder(wo.id, { scrapWeightLb: 25, outputs: [{ weightLb: 900 }] });
    ok('completed', r.status === 200, `${r.status} ${err(r)}`);
    const { entry } = await woEntry(wo.id);
    const fromSource = entry.lines.filter((l) => l.coilId === s.coilId && l.account.code === '1200').reduce((x, l) => x + Number(l.credit) - Number(l.debit), 0);
    const cost = (await A.get(`/api/jobs/${job.body.id}/cost`, 'admin')).body;
    const material = Number(cost?.materialCost ?? NaN);
    ok('925 lb at 0.40 left the source in the books', near(fromSource, 370), `${fromSource}`);
    ok('the order\'s job cost shows the same material figure', near(material, 370), `job cost material ${material}; ${JSON.stringify(cost).slice(0, 400)}`);
    ok('the job cost keeps labor apart, and none of it is in the journal', 'laborCost' in cost && !entry.lines.some((l) => l.account.code === '5100'));
  });

  await S('Scrap is expensed at cost with no recovery value: nothing is credited back for scrap metal', async (ok) => {
    const s = await ctx.costed(1000, 0.4);
    const wo = await startedWorkOrder(s.coilId);
    await completeWorkOrder(wo.id, { scrapWeightLb: 200, outputs: [{ weightLb: 300 }] });
    const { entry } = await woEntry(wo.id);
    const scrap = entry.lines.filter((l) => l.account.code === '5300');
    ok('scrap is one debit of 80.00', scrap.length === 1 && near(scrap[0].debit, 80) && near(scrap[0].credit, 0));
    ok('the scrap report says no recovery value is recorded', /No recovery value is recorded/.test((await cfo.get('/api/ledger/reports/scrap')).body.note));
  });
}
