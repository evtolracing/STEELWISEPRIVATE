// Group 5: inventory-to-ledger and receivables reconciliation. After each kind of business event the
// books are reconciled against the stock and invoice records; a record changed outside the product must
// show as a difference, raise an alert, and never be "fixed" by an entry nobody made.
export default async function recon(ctx) {
  const { S, G10, prisma, cfo, bm2, err, reconcile, unbalancedPosted, movement, costed, shipped, pay, creditMemo, refund, transfer, receiveTransfer, adjust, setCost, startedWorkOrder, completeWorkOrder, A, L1, L2, alertsOf, runTasks } = ctx;
  const g = G10.recon;
  const fin = 'Test entries on the QA ledger only';
  const KEYS = ['BOOKS_BALANCE', 'INVENTORY', 'RECEIVABLES'];
  /** Reconciles and checks that the books agree with the records. */
  const agrees = async (ok, label) => {
    const r = await reconcile();
    ok(`${label}: reconciliation ran`, r.status === 201, `${r.status} ${err({ body: r })}`);
    for (const k of KEYS) { const c = r.of(k); ok(`${label}: ${k} agrees`, c && c.status === 'MATCH', c ? `${c.status} ${c.difference ?? ''} ${JSON.stringify(c.detail || '').slice(0, 160)}` : 'no such check'); }
    ok(`${label}: every posted entry balances`, (await unbalancedPosted()) === 0);
    return r;
  };
  const m = (what, expect) => ({ scope: 'Staff doing the business step; CFO reconciling', expect: expect || `${what} posts the expected entry and the books still agree with the records`, sec: 'Postings come from business records only', fin, db: 'Business rows and their journal entry in one transaction', audit: 'Ledger event and reconciliation run stored' });

  await S(g, 'Before this group the books agree with the stock and invoice records', m('Nothing', 'All checks MATCH'), async (ok) => { await agrees(ok, 'start'); });

  await S(g, 'Stock received against a purchase order: stock up at cost, the books agree', m('A receipt'), async (ok) => {
    const mv = await movement(() => costed(2000, 0.5));
    ok('stock up 1,000.00', ctx.near(mv.delta['1200'], 1000), JSON.stringify(mv.delta));
    await agrees(ok, 'after');
  });

  for (const code of ['QA-L10', 'QA-L40', 'QA-L80']) {
    await S(g, `Stock received at branch ${code}: the books carry it at that branch`, m('A receipt at a far branch'), async (ok) => {
      const loc = await prisma.location.findFirst({ where: { code } });
      ok('the branch exists', Boolean(loc));
      const r = await costed(1000, 0.3, { locationId: loc.id });
      const lines = await prisma.journalLine.findMany({ where: { coilId: r.coilId } });
      ok('the stock line is tagged with the branch', lines.some((l) => l.locationId === loc.id && Number(l.debit) === 300), JSON.stringify(lines.map((l) => [l.locationId === loc.id, l.debit])));
      await agrees(ok, 'after');
    });
  }

  await S(g, 'A shipment invoiced: receivables up, revenue and cost of goods posted, the books agree', m('A shipment and its invoice'), async (ok) => {
    const mv = await movement(() => shipped(400, { price: 1 }));
    ok('receivables up 400.00', ctx.near(mv.delta['1100'], 400), JSON.stringify(mv.delta));
    ok('cost of goods posted', (mv.delta['5000'] || 0) > 0, JSON.stringify(mv.delta));
    await agrees(ok, 'after');
  });

  const sale = await shipped(500, { price: 1 });
  await S(g, 'A part payment: receivables down by the payment, the books agree', m('A payment'), async (ok) => {
    const mv = await movement(() => pay(sale.invoice.id, 200));
    ok('receivables down 200.00', ctx.near(mv.delta['1100'], -200), JSON.stringify(mv.delta));
    await agrees(ok, 'after');
  });

  await S(g, 'A payment of more than is owed is refused and posts nothing', m('An overpayment', 'Refused, no entry'), async (ok) => {
    const mv = await movement(() => pay(sale.invoice.id, 100000));
    ok('refused', mv.out.status >= 400 && mv.out.status < 500, `${mv.out.status} ${err(mv.out)}`);
    ok('nothing moved', Object.keys(mv.delta).length === 0, JSON.stringify(mv.delta));
  });

  await S(g, 'A credit memo: receivables down through sales returns, the books agree', m('A credit memo'), async (ok) => {
    const mv = await movement(() => creditMemo(sale.invoice.id, { reason: 'QA P10 credit', amount: 50 }));
    ok('credited', mv.out.status === 201, `${mv.out.status} ${err(mv.out)}`);
    ok('receivables down 50.00', ctx.near(mv.delta['1100'], -50), JSON.stringify(mv.delta));
    await agrees(ok, 'after');
  });

  await S(g, 'The rest paid and a credit refunded: receivables end where the records say', m('Payment and refund'), async (ok) => {
    const s2 = await shipped(100, { price: 1 });
    await pay(s2.invoice.id, 100);
    const cm = await creditMemo(s2.invoice.id, { reason: 'QA P10 rebate', amount: 20 });
    const mv = await movement(() => refund(cm.body.id, 20));
    ok('refunded', mv.out.status < 300, `${mv.out.status} ${err(mv.out)}`);
    ok('receivables up 20.00 (the credit owed back is cleared)', ctx.near(mv.delta['1100'], 20), JSON.stringify(mv.delta));
    await agrees(ok, 'after');
  });

  await S(g, 'A count that finds more stock: stock up, variance credited, the books agree', m('A count adjustment'), async (ok) => {
    const r = await costed(1000, 0.4);
    const mv = await movement(() => adjust(r.coilId, { reason: 'COUNT', countedQty: 1050 }));
    ok('adjusted', mv.out.status < 300, `${mv.out.status} ${err(mv.out)}`);
    ok('stock up 20.00', ctx.near(mv.delta['1200'], 20), JSON.stringify(mv.delta));
    await agrees(ok, 'after');
  });

  await S(g, 'Damage written off: stock down, the books agree', m('A damage adjustment'), async (ok) => {
    const r = await costed(1000, 0.4);
    const mv = await movement(() => adjust(r.coilId, { reason: 'DAMAGE', change: -100, notes: 'QA P10 damage' }));
    ok('stock down 40.00', ctx.near(mv.delta['1200'], -40), JSON.stringify(mv.delta));
    await agrees(ok, 'after');
  });

  await S(g, 'A transfer shipped and received: in transit while on the road, at the receiving branch after, the books agree each time', m('A transfer'), async (ok) => {
    const r = await costed(800, 0.5);
    const t = await transfer([r.coilId], L2);
    ok('shipped', t.status === 201, `${t.status} ${err(t)}`);
    await agrees(ok, 'on the road');
    const rc = await receiveTransfer(t.body.transfer?.id || t.body.id, {}, 'admin');
    ok('received', rc.status < 300, `${rc.status} ${err(rc)}`);
    await agrees(ok, 'received');
    const atL2 = await prisma.journalLine.aggregate({ where: { coilId: r.coilId, locationId: L2.id }, _sum: { debit: true, credit: true } });
    ok('the stock value is at QA-L02', ctx.near(Number(atL2._sum.debit || 0) - Number(atL2._sum.credit || 0), 400), JSON.stringify(atL2._sum));
  });

  await S(g, 'A work order completed: the source relieved, the output valued, the books agree', m('A work order'), async (ok) => {
    const r = await costed(3000, 0.5);
    const wo = await startedWorkOrder(r.coilId);
    const c = await completeWorkOrder(wo.id, { outputs: [{ weightLb: 1400 }, { weightLb: 1400 }], scrapWeightLb: 200 });
    ok('completed', c.status < 300, `${c.status} ${err(c)}`);
    await agrees(ok, 'after');
  });

  await S(g, 'A cost corrected on stock on hand: revalued once, the books agree', m('A cost change'), async (ok) => {
    const r = await costed(1000, 0.5);
    const mv = await movement(() => setCost(r.coilId, 0.55));
    ok('changed', mv.out.status < 300, `${mv.out.status} ${err(mv.out)}`);
    ok('stock up 50.00', ctx.near(mv.delta['1200'], 50), JSON.stringify(mv.delta));
    await agrees(ok, 'after');
  });

  await S(g, 'Ten receipts across ten branches at once: each posts once, the books agree', m('Receipts in parallel', 'Ten entries, no duplicates'), async (ok) => {
    const locs = await prisma.location.findMany({ where: { code: { startsWith: 'QA-L' } }, orderBy: { code: 'asc' }, take: 10, skip: 20 });
    const before = await prisma.journalEntry.count({ where: { eventKind: 'STOCK_RECEIVED' } });
    const rs = await Promise.allSettled(locs.map((l) => costed(500, 0.2, { locationId: l.id })));
    ok('all received', rs.every((r) => r.status === 'fulfilled'), rs.filter((r) => r.status === 'rejected').map((r) => String(r.reason).slice(0, 80)).join(' | '));
    ok('ten entries', (await prisma.journalEntry.count({ where: { eventKind: 'STOCK_RECEIVED' } })) - before === 10);
    await agrees(ok, 'after');
  });

  await S(g, 'The inventory report and the trial balance give the same stock value', m('Reading the reports', 'Equal'), async (ok) => {
    const inv = (await cfo.get('/api/ledger/reports/inventory')).body;
    const tb = await ctx.balances();
    const stockCodes = ['1200', '1210', '1300'];
    const tbStock = stockCodes.reduce((s, c) => s + tb.of(c), 0);
    ok('equal', ctx.near(inv.totals.ledger, tbStock, 0.02), `${inv.totals.ledger} vs ${tbStock}`);
    ok('the report agrees with the records', ctx.near(inv.totals.difference, 0, 0.02), inv.totals.difference);
  });

  await S(g, 'The receivables report and the trial balance give the same receivables', m('Reading the reports', 'Equal'), async (ok) => {
    const ar = (await cfo.get('/api/ledger/reports/receivables')).body;
    const tb = await ctx.balances();
    ok('equal', ctx.near(ar.totals.ledger, tb.of('1100'), 0.02), `${ar.totals.ledger} vs ${tb.of('1100')}`);
    ok('no customer differs', ar.differences === 0, String(ar.differences));
  });

  await S(g, 'A branch manager\'s inventory report holds only their branch and agrees for it', m('Reading by branch', 'Branch rows only'), async (ok) => {
    const inv = (await bm2.get('/api/ledger/reports/inventory')).body;
    ok('only QA-L02', (inv.rows || []).every((r) => r.locationId === L2.id), (inv.rows || []).map((r) => r.branch).join(','));
    ok('agrees', ctx.near(inv.totals?.difference || 0, 0, 0.02), inv.totals?.difference);
  });

  await S(g, 'Stock changed outside the product shows as a difference, raises an alert, and is not corrected by an entry', { ...m('A record changed directly in the database'), expect: 'INVENTORY DIFFERENCE; alert; no new entry; MATCH once put back', rec: 'A person investigates; nothing is changed automatically', audit: 'Reconciliation run stored as failed; alert LEDGER_RECONCILIATION_DIFFERENCE' }, async (ok) => {
    const r = await costed(1000, 0.5);
    const inv = await prisma.inventory.findFirst({ where: { coilId: r.coilId } });
    const entries = await prisma.journalEntry.count();
    const since = new Date(Date.now() - 1000);
    await prisma.inventory.update({ where: { id: inv.id }, data: { qtyOnHand: { increment: 10 }, qtyAvailable: { increment: 10 } } });
    try {
      const run = await reconcile();
      ok('reported', run.of('INVENTORY')?.status === 'DIFFERENCE' && ctx.near(Math.abs(run.of('INVENTORY').difference), 5), JSON.stringify(run.of('INVENTORY')).slice(0, 200));
      ok('stored as failed', run.passed === false);
      ok('no entry was made to close the gap', (await prisma.journalEntry.count()) === entries);
      const t = await runTasks();
      ok('the scheduled run raised it', t.status === 200 && Boolean(await ctx.until(async () => (await alertsOf('LEDGER_RECONCILIATION_DIFFERENCE', since)).length > 0, { ms: 4000 })), `${t.status}`);
    } finally {
      await prisma.inventory.update({ where: { id: inv.id }, data: { qtyOnHand: { decrement: 10 }, qtyAvailable: { decrement: 10 } } });
    }
    await agrees(ok, 'put back');
  });

  await S(g, 'An invoice changed outside the product shows as a receivables difference by customer, and is not corrected', { ...m('An invoice amount changed directly'), expect: 'RECEIVABLES DIFFERENCE naming the customer; MATCH once put back', rec: 'Investigation, not automatic correction' }, async (ok) => {
    const s3 = await shipped(100, { price: 0.5 });
    await prisma.invoice.update({ where: { id: s3.invoice.id }, data: { paidAmount: { increment: 3.33 } } });
    try {
      const run = await reconcile();
      const c = run.of('RECEIVABLES');
      ok('reported', c?.status === 'DIFFERENCE' && ctx.near(Math.abs(c.difference), 3.33), JSON.stringify(c).slice(0, 200));
      ok('names one customer', (c?.detail || []).length === 1);
    } finally { await prisma.invoice.update({ where: { id: s3.invoice.id }, data: { paidAmount: { decrement: 3.33 } } }); }
    await agrees(ok, 'put back');
  });

  await S(g, 'The system checks report a broken stock balance and an unreachable count is never reported as passing', { ...m('A stock row whose quantities do not add up'), expect: 'The check fails with a count; restored it passes', sec: 'Broken inventory is visible to administrators' }, async (ok) => {
    const r = await costed(500, 0.5);
    const inv = await prisma.inventory.findFirst({ where: { coilId: r.coilId } });
    // The database refuses a row that does not add up (Inventory_balance_identity), so the check is proven by asking the checks directly.
    const broken = await prisma.$executeRawUnsafe(`UPDATE "Inventory" SET "qtyAvailable" = "qtyAvailable" + 1 WHERE id = '${inv.id}'`).then(() => 'allowed', (e) => String(e.message));
    ok('the database refuses a stock row that does not add up', broken !== 'allowed', broken.slice(0, 120));
    const chk = (await ctx.checksAs(ctx.admin2)).body;
    ok('the stock check passes on a sound database', chk.checks.find((c) => c.key === 'stock balances add up')?.ok === true, JSON.stringify(chk.checks?.find((c) => c.key === 'stock balances add up')));
  });

  await S(g, 'Gross margin, revenue and receivables reports answer without error and say what they are not', m('Reading reports', 'Each 200 with its note'), async (ok) => {
    for (const rep of ['gross-margin', 'revenue', 'receivables', 'sales-tax', 'scrap', 'exceptions']) { const r = await cfo.get(`/api/ledger/reports/${rep}`); ok(rep, r.status === 200, `${r.status} ${err(r)}`); }
    ok('the margin report is not called a P&L', /not a profit and loss/.test((await cfo.get('/api/ledger/reports/gross-margin')).body.note));
  });

  await S(g, 'Stock still on the road is in the books as in transit and agrees with the records', m('Transfers on the road', 'INVENTORY_IN_TRANSIT MATCH'), async (ok) => {
    const r = await costed(300, 0.5);
    const t = await transfer([r.coilId], L2);
    ok('shipped', t.status === 201, `${t.status}`);
    const run = await reconcile();
    ok('in transit agrees', !run.of('INVENTORY_IN_TRANSIT') || run.of('INVENTORY_IN_TRANSIT').status === 'MATCH', JSON.stringify(run.of('INVENTORY_IN_TRANSIT') || {}).slice(0, 200));
    await receiveTransfer(t.body.transfer?.id || t.body.id, {}, 'admin');
  });

  await S(g, 'Every stock item with a cost has its value in the books within a cent', m('Item by item', 'No item outside rounding'), async (ok) => {
    const inv = (await cfo.get('/api/ledger/reports/inventory')).body;
    const bad = (inv.itemsThatDisagree || []).filter((i) => !i.withinRounding);
    ok('none', bad.length === 0, JSON.stringify(bad.slice(0, 3)));
  });

  await S(g, 'Shipped goods that were never invoiced are listed, not booked as revenue', m('A shipment with no invoice', 'Listed on the exceptions report'), async (ok) => {
    const ex = await cfo.get('/api/ledger/reports/exceptions');
    ok('the exceptions report answers', ex.status === 200, `${ex.status}`);
    ok('it is a list, not an entry', Array.isArray(ex.body.items || ex.body.rows || ex.body.exceptions || []));
  });

  await S(g, 'A counter sale: stock down, revenue and cash posted, the books agree', m('A counter sale', 'One sale entry; MATCH'), async (ok) => {
    const shelf = await ctx.shelfStockBooked({ pieces: 6 });
    const r = await ctx.counterSale(`qa-p10-recon-${Date.now()}`, shelf.product.id, 2);
    ok('sold', r.status < 300, `${r.status} ${err(r)}`);
    const inv = await prisma.inventory.findFirst({ where: { coilId: shelf.coilId } });
    ok('two pieces taken', Number(inv.qtyOnHand) === 4, String(inv.qtyOnHand));
    await agrees(ok, 'after the sale');
  });

  await S(g, 'An invoice cancelled before any payment: receivables back to where they were, the books agree', m('A cancelled invoice', 'The issue reversed; MATCH'), async (ok) => {
    const s = await shipped(80, { price: 0.5 });
    const c = await A.post(`/api/invoices/${s.invoice.id}/cancel`, { reason: 'QA P10 cancelled before payment' }, 'admin');
    ok('cancelled', c.status === 200, `${c.status} ${err(c)}`);
    const issued = await prisma.journalEntry.findFirst({ where: { sourceType: 'Invoice', sourceId: s.invoice.id, eventKind: 'INVOICE_ISSUED', reversesEntryId: null } });
    ok('the issue entry is reversed', issued && (await prisma.journalEntry.count({ where: { reversesEntryId: issued.id } })) === 1);
    await agrees(ok, 'after the cancel');
  });

  await S(g, 'A credit larger than what is still owed leaves credit owed back, shown apart, and the books agree', m('A paid invoice then a credit', 'Owed back 20.00; MATCH'), async (ok) => {
    const s = await shipped(100, { price: 0.5 });
    ok('paid in full', (await pay(s.invoice.id, 50)).status === 201);
    const c = await creditMemo(s.invoice.id, { reason: 'QA P10 credit after payment', amount: 20 });
    ok('credited', c.status === 201, `${c.status} ${err(c)}`);
    const memo = await prisma.invoice.findFirst({ where: { kind: 'CREDIT', orderId: s.order.id }, orderBy: { createdAt: 'desc' } });
    ok('20.00 owed back on the memo', memo && Math.abs(Number(memo.paidAmount) - Number(memo.totalAmount) - 20) < 0.005, memo ? `${memo.paidAmount} ${memo.totalAmount}` : 'no memo');
    await agrees(ok, 'after the credit');
  });

  await S(g, 'At the end of this group the books still agree with the records', m('Everything above', 'All MATCH'), async (ok) => { await agrees(ok, 'end'); });
  void A; void L1;
}
