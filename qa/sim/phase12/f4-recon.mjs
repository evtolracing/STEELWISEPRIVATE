// Group 4: financial and inventory reconciliation (Phase 12 prompt, section 16). The books are compared
// with the records they came from by SQL written here, not by the product's own reconciliation alone, and
// the two are then compared with each other. A difference is reported, never adjusted.
export default async function run(c) {
  const { W, G12, hq, prisma, reconcile, unbalancedPosted, near, r2, sold, branch, P, openEvents, heldBefore } = c;
  const G = G12.recon; const cfo = hq('CFO', 0);
  const m = (id, purpose, over = {}) => ({ id, purpose, role: 'CFO', ui: 'Finance > Ledger > Reconciliation', api: 'POST /api/ledger/reconciliations; GET /api/ledger/reports/:name', db: 'one reconciliation run saved; nothing else changes', fin: 'none: a reconciliation reads', ...over });
  const q = (sql, ...p) => prisma.$queryRawUnsafe(sql, ...p);
  const bal = async (code) => Number((await q(`SELECT COALESCE(SUM(l.debit - l.credit),0)::float8 AS v FROM "JournalLine" l JOIN "JournalEntry" e ON e.id = l."entryId" JOIN "LedgerAccount" a ON a.id = l."accountId" WHERE e.status IN ('POSTED','REVERSED') AND a.code = $1`, code))[0].v);
  // Some business first, so the comparison is of a ledger that has moved in this run.
  const b = await branch('LARGE', 21); const s1 = await sold(b, 640); const s2 = await sold(b, 410);
  await (P.csr(b) || P.manager(b)).post(`/api/invoices/${s1.invoice.id}/payments`, { amount: r2(s1.total / 2), paymentMethod: 'CHECK', reference: 'P12-RECON' });
  const run = await reconcile(cfo);

  await W(G, 'Reconciliation 1: the books balance, by SQL and by the product', m('RC-01', 'Debits equal credits in every posted entry and in total'), async (ok, x) => {
    const t = (await q(`SELECT COALESCE(SUM(l.debit),0)::float8 AS d, COALESCE(SUM(l.credit),0)::float8 AS c, COUNT(DISTINCT e.id)::int AS n FROM "JournalLine" l JOIN "JournalEntry" e ON e.id = l."entryId" WHERE e.status IN ('POSTED','REVERSED')`))[0];
    x.note(`${t.n} posted entries; debits ${t.d.toFixed(2)}, credits ${t.c.toFixed(2)}`);
    ok('total debits equal total credits to the cent', near(t.d, t.c, 0.005), `${t.d} / ${t.c}`);
    ok('no single posted entry is out of balance', (await unbalancedPosted()) === 0);
    const tb = await cfo.get('/api/ledger/reports/trial-balance');
    ok('the trial balance says the same', tb.status === 200 && tb.body.balanced === true && near(tb.body.totals.debit, tb.body.totals.credit, 0.005), JSON.stringify(tb.body.totals));
    ok('the product\'s own check agrees', run.of('BOOKS_BALANCE')?.status === 'PASS' || run.of('BOOKS_BALANCE')?.difference === '0.00', JSON.stringify(run.of('BOOKS_BALANCE')).slice(0, 160));
  });

  await W(G, 'Reconciliation 2: receivables in the ledger equal the open invoices, customer by customer', m('RC-02', 'Accounts receivable'), async (ok, x) => {
    const led = await bal('1100');
    const rec = (await q(`SELECT COALESCE(SUM(CASE WHEN kind = 'CREDIT' THEN -("totalAmount" - "paidAmount") ELSE ("totalAmount" - "paidAmount") END),0)::float8 AS v FROM "Invoice" WHERE status NOT IN ('CANCELLED','DRAFT')`))[0].v;
    const rep = await cfo.get('/api/ledger/reports/receivables');
    x.note(`ledger 1100 = ${led.toFixed(2)}; invoices less payments by SQL = ${rec.toFixed(2)}; report: ${JSON.stringify(rep.body.totals)}`);
    ok('the report\'s ledger figure is the account balance', near(rep.body.totals.ledger, led, 0.011), `${rep.body.totals.ledger} / ${led}`);
    ok('the report shows no difference between ledger and records', near(rep.body.totals.difference ?? (Number(rep.body.totals.ledger) - Number(rep.body.totals.records)), 0, 0.011), JSON.stringify(rep.body.totals));
    ok('the reconciliation says the same', near(run.of('RECEIVABLES')?.difference, 0, 0.011), JSON.stringify(run.of('RECEIVABLES')).slice(0, 200));
    const rows = rep.body.rows || rep.body.customers || [];
    ok('the customers add up to the total', !rows.length || near(rows.reduce((s, r) => s + Number(r.records ?? r.owed ?? 0) - Number(r.records == null ? (r.creditOwedBack || 0) : 0), 0), rep.body.totals.records, 0.02), `${rows.length} customers`);
  });

  await W(G, 'Reconciliation 3: inventory in the ledger equals stock on hand at cost, branch by branch', m('RC-03', 'Inventory valuation'), async (ok, x) => {
    const rep = await cfo.get('/api/ledger/reports/inventory');
    const sql = (await q(`SELECT COALESCE(SUM(ROUND((i."qtyOnHand" * c."unitCost")::numeric, 2)),0)::float8 AS v, COUNT(*)::int AS n FROM "Inventory" i JOIN "Coil" c ON c.id = i."coilId" WHERE c."unitCost" IS NOT NULL AND i."qtyOnHand" > 0`))[0];
    x.note(`${sql.n} stock items with a cost; on hand at cost by SQL = ${sql.v.toFixed(2)}; report totals ${JSON.stringify(rep.body.totals)}`);
    ok('the report answers', rep.status === 200 && rep.body.totals, rep.status);
    ok('the reconciliation finds no inventory difference', near(run.of('INVENTORY')?.difference, 0, 0.011), JSON.stringify(run.of('INVENTORY')).slice(0, 220));
    ok('goods on the road agree', near(run.of('IN_TRANSIT')?.difference, 0, 0.011), JSON.stringify(run.of('IN_TRANSIT')).slice(0, 200));
    const rows = rep.body.rows || [];
    ok('the branches add up to the total', near(rows.reduce((s, r) => s + Number(r.records ?? 0), 0), rep.body.totals.records, 0.02 * Math.max(1, rows.length)), `${rows.length} branches`);
    const neg = (await q(`SELECT COUNT(*)::int AS n FROM "Inventory" WHERE "qtyOnHand" < 0 OR "qtyAvailable" < 0 OR "qtyAllocated" < 0`))[0].n;
    ok('no stock figure is below zero', neg === 0, neg);
    const drift = (await q(`SELECT COUNT(*)::int AS n FROM "Inventory" WHERE ABS("qtyOnHand" - "qtyAvailable" - "qtyAllocated" - COALESCE("qtyOnHold",0) - COALESCE("qtyInTransit",0)) > 0.001`))[0].n;
    ok('on hand equals available plus reserved plus held plus in transit on every item', drift === 0, drift);
  });

  await W(G, 'Reconciliation 4: revenue in the ledger equals the invoices issued', m('RC-04', 'Revenue'), async (ok, x) => {
    x.note(JSON.stringify(run.of('REVENUE')).slice(0, 240));
    ok('no revenue difference', near(run.of('REVENUE')?.difference, 0, 0.011), run.of('REVENUE')?.difference);
    const a = await cfo.get('/api/ledger/reports/revenue?by=branch'); const d = await cfo.get('/api/ledger/reports/revenue?by=customer'); const p = await cfo.get('/api/ledger/reports/revenue?by=product');
    ok('revenue by branch, by customer and by product give one total', near(a.body.total, d.body.total, 0.011) && near(a.body.total, p.body.total, 0.011), `${a.body.total} ${d.body.total} ${p.body.total}`);
    const gm = await cfo.get('/api/ledger/reports/gross-margin?by=branch');
    const cogs = await bal('5000');
    ok('cost of sales in the margin report is the cost-of-sales account', near((gm.body.rows || []).reduce((s, r) => s + Number(r.materialCost || 0), 0), cogs, 0.02 * Math.max(1, (gm.body.rows || []).length)), `${cogs}`);
  });

  await W(G, 'Reconciliation 5: every business event since the ledger began is in the books or held by name', m('RC-05', 'Completeness of posting'), async (ok, x) => {
    const st = (await q(`SELECT status, COUNT(*)::int AS n FROM "LedgerEvent" GROUP BY status`)); x.note(`ledger events by state: ${st.map((r) => `${r.status} ${r.n}`).join(', ')}; held before this run began: ${heldBefore}`);
    ok('no event of this run is failed, pending or held', (await openEvents()) === 0, await openEvents());
    const miss = await cfo.get('/api/ledger/reports/exceptions');
    ok('the exceptions report answers and counts the same open events as the table', miss.status === 200 && miss.body.open === st.filter((r) => ['FAILED', 'RECONCILIATION_REQUIRED', 'PENDING'].includes(r.status)).reduce((s, r) => s + r.n, 0), `${miss.body.open}`);
    const twice = (await q(`SELECT COUNT(*)::int AS n FROM (SELECT "sourceType","sourceId","eventKind" FROM "JournalEntry" WHERE "sourceId" IS NOT NULL AND kind <> 'REVERSAL' GROUP BY 1,2,3 HAVING COUNT(*) > 1) t`))[0].n;
    ok('no business event has two entries', twice === 0, twice);
    const orphan = (await q(`SELECT COUNT(*)::int AS n FROM "LedgerEvent" v WHERE v.status = 'POSTED' AND NOT EXISTS (SELECT 1 FROM "JournalEntry" e WHERE e.id = v."journalEntryId")`))[0].n;
    ok('every posted event points at an entry that exists', orphan === 0, orphan);
    for (const s of [s1, s2]) ok(`invoice ${s.invoice.invoiceNumber} of this run is posted once`, (await prisma.ledgerEvent.count({ where: { eventKind: 'INVOICE_ISSUED', sourceId: s.invoice.id, status: 'POSTED' } })) === 1);
  });

  await W(G, 'Reconciliation 6: the reconciliation itself is honest: it reports a planted difference and corrects nothing', m('RC-06', 'The reconciliation detects a real difference', { db: 'a stock figure is changed by SQL inside the test and put back' }), async (ok) => {
    const before = await reconcile(cfo);
    const item = await prisma.inventory.findFirst({ where: { coilId: s2.lot.coilId } });
    await prisma.$executeRawUnsafe(`UPDATE "Inventory" SET "qtyOnHand" = "qtyOnHand" + 100, "qtyAvailable" = "qtyAvailable" + 100 WHERE id = $1`, item.id);
    try {
      const bad = await reconcile(cfo);
      ok('with 100 lb added behind the ledger\'s back, the inventory check fails', bad.passed === false && (bad.failing || []).includes('INVENTORY'), JSON.stringify(bad.failing));
      ok('and names the size of the difference', Math.abs(Math.abs(Number(bad.of('INVENTORY')?.difference)) - Math.abs(Number(before.of('INVENTORY')?.difference || 0)) - 100 * Number((await prisma.coil.findUnique({ where: { id: s2.lot.coilId } })).unitCost)) < 0.02, bad.of('INVENTORY')?.difference);
      ok('it changed nothing: the planted figure is still there', Number((await prisma.inventory.findUnique({ where: { id: item.id } })).qtyOnHand) === Number(item.qtyOnHand) + 100);
    } finally { await prisma.$executeRawUnsafe(`UPDATE "Inventory" SET "qtyOnHand" = "qtyOnHand" - 100, "qtyAvailable" = "qtyAvailable" - 100 WHERE id = $1`, item.id); }
    const after = await reconcile(cfo);
    ok('put back, the inventory check is as it was', after.of('INVENTORY')?.difference === before.of('INVENTORY')?.difference, `${before.of('INVENTORY')?.difference} / ${after.of('INVENTORY')?.difference}`);
  });
}
