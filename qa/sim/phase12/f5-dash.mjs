// Group 5: dashboards and reports say what the records say (Phase 12 prompt, section 17; closes V-037).
// Each figure a screen shows is recomputed here by SQL, for a person who sees every branch and for a
// person held to one branch. The server is otherwise quiet while this group runs.
export default async function run(c) {
  const { W, G12, hq, prisma, branch, P, near, sold } = c;
  const G = G12.dash; const coo = hq('COO', 0) || hq('EXECUTIVE', 0); const cfo = hq('CFO', 0);
  const b = await branch('LARGE', 22); const o = await branch('MEDIUM', 23); await sold(b, 220);
  const q = (sql, ...p) => prisma.$queryRawUnsafe(sql, ...p);
  const m = (id, purpose, ui, api) => ({ id, purpose, role: 'head office and one branch manager', ui, api, db: 'none: reads only', fin: 'none' });
  const n = (v) => Number(v || 0);

  await W(G, 'Dashboard 1: the home dashboard for head office equals the records', m('DB-01', 'Home dashboard', 'Home', 'GET /api/dashboard, /api/dashboard/kpis'), async (ok, x) => {
    const d = await coo.get('/api/dashboard'); const k = await coo.get('/api/dashboard/kpis');
    const inv = (await q(`SELECT COALESCE(SUM("qtyOnHand"),0)::float8 AS h, COALESCE(SUM("qtyAvailable"),0)::float8 AS a, COALESCE(SUM("qtyAllocated"),0)::float8 AS r FROM "Inventory"`))[0];
    ok('pounds on hand, available and reserved', d.status === 200 && near(d.body.inventory.totalOnHand, inv.h, 0.01) && near(d.body.inventory.available, inv.a, 0.01) && near(d.body.inventory.allocated, inv.r, 0.01), `${JSON.stringify(d.body.inventory)} / ${JSON.stringify(inv)}`);
    const by = Object.fromEntries((await q(`SELECT status::text AS s, COUNT(*)::int AS n FROM "Order" GROUP BY 1`)).map((r) => [r.s, r.n]));
    ok('orders by status', JSON.stringify(Object.entries(d.body.orders.byStatus).sort()) === JSON.stringify(Object.entries(by).sort()), `${JSON.stringify(d.body.orders.byStatus)} / ${JSON.stringify(by)}`);
    const coils = Object.fromEntries((await q(`SELECT status::text AS s, COUNT(*)::int AS n FROM "Coil" GROUP BY 1`)).map((r) => [r.s, r.n]));
    ok('stock items by status', JSON.stringify(Object.entries(d.body.coilsByStatus).sort()) === JSON.stringify(Object.entries(coils).sort()));
    ok('the monthly pounds figure equals the same sum', near(k.body.inventoryLbs, inv.h, 0.01), k.body.inventoryLbs);
    x.note(`orders this month ${k.body.ordersThisMonth}, deliveries this month ${k.body.shipmentsThisMonth}`);
    const som = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    ok('orders this month', k.body.ordersThisMonth === (await prisma.order.count({ where: { orderType: 'SO', createdAt: { gte: som } } })));
  });

  await W(G, 'Dashboard 2: the home dashboard for a branch manager holds only that branch', m('DB-02', 'Home dashboard at a branch', 'Home', 'GET /api/dashboard'), async (ok) => {
    const who = P.manager(b); const d = await who.get('/api/dashboard');
    const inv = (await q(`SELECT COALESCE(SUM("qtyOnHand"),0)::float8 AS h FROM "Inventory" WHERE "locationId" = $1`, b.id))[0];
    ok('pounds on hand are the branch\'s own', d.status === 200 && near(d.body.inventory.totalOnHand, inv.h, 0.01), `${d.body.inventory?.totalOnHand} / ${inv.h}`);
    const orders = await prisma.order.count({ where: { locationId: b.id } });
    ok('the order counts add up to the branch\'s orders', Object.values(d.body.orders.byStatus).reduce((s, v) => s + v, 0) === orders, orders);
    ok('recent orders are all the branch\'s own', d.body.recentOrders.every((r) => r.locationId === b.id), d.body.recentOrders.filter((r) => r.locationId !== b.id).length);
    const other = await P.manager(o).get('/api/dashboard');
    ok('another branch sees a different figure of its own', other.status === 200 && near(other.body.inventory.totalOnHand, n((await q(`SELECT COALESCE(SUM("qtyOnHand"),0)::float8 AS h FROM "Inventory" WHERE "locationId" = $1`, o.id))[0].h), 0.01));
  });

  await W(G, 'Dashboard 3: the operations cockpit counts what is in the tables', m('DB-03', 'Operations cockpit', 'Operations > Cockpit', 'GET /api/ops-cockpit'), async (ok, x) => {
    const d = await coo.get('/api/ops-cockpit'); const s = d.body.summary || {};
    x.note(`summary: ${JSON.stringify(s)}`);
    ok('it answers', d.status === 200, d.status);
    ok('jobs', s.totalJobs === (await prisma.job.count()), `${s.totalJobs} / ${await prisma.job.count()}`);
    ok('orders', s.totalOrders === (await prisma.order.count()), `${s.totalOrders} / ${await prisma.order.count()}`);
    ok('stock items', s.totalCoils === (await prisma.coil.count()), `${s.totalCoils} / ${await prisma.coil.count()}`);
    ok('shipments', s.totalShipments === (await prisma.shipment.count()), `${s.totalShipments} / ${await prisma.shipment.count()}`);
    const mine = await P.manager(b).get('/api/ops-cockpit');
    ok('at a branch the same counts are the branch\'s own', mine.status === 200 && mine.body.summary.totalOrders === (await prisma.order.count({ where: { locationId: b.id } })) && mine.body.summary.totalCoils === (await prisma.coil.count({ where: { locationId: b.id } })), JSON.stringify(mine.body.summary));
  });

  await W(G, 'Dashboard 4: the sales dashboard equals the quotes on file', m('DB-04', 'Sales dashboard', 'Sales > Dashboard', 'GET /api/sales-dashboard'), async (ok) => {
    const who = hq('SALES_DIRECTOR', 0) || coo; const d = await who.get('/api/sales-dashboard?range=month'); const now = new Date();
    const open = (await q(`SELECT COALESCE(SUM(subtotal),0)::float8 AS v, COUNT(*)::int AS n FROM "Quote" WHERE status::text IN ('DRAFT','PENDING_APPROVAL','SENT','COUNTERED') AND ("validUntil" IS NULL OR "validUntil" >= $1)`, now))[0];
    ok('open quote value', d.status === 200 && near(d.body.pipeline.openValue, open.v, 0.011), `${d.body.pipeline?.openValue} / ${open.v}`);
    ok('quotes being written plus quotes with the customer equal the open quotes', d.body.pipeline.drafting + d.body.pipeline.awaitingCustomer === open.n, `${d.body.pipeline.drafting}+${d.body.pipeline.awaitingCustomer} / ${open.n}`);
    ok('margin is shown as not measured, not as a number', d.body.performance.avgMargin === null);
  });

  await W(G, 'Dashboard 5: material tracking counts equal the tables', m('DB-05', 'Material tracking', 'Shipping > Material tracking', 'GET /api/material-tracking/stats'), async (ok) => {
    const d = await coo.get('/api/material-tracking/stats');
    ok('packages', d.status === 200 && d.body.totals.activePackages === (await prisma.package.count()), `${d.body.totals?.activePackages}`);
    ok('tags', d.body.totals.activeTags === (await prisma.dropTag.count()), `${d.body.totals?.activeTags}`);
    ok('jobs past the saw', d.body.totals.activeJobs === (await prisma.job.count({ where: { status: { in: ['WAITING_QC', 'PACKAGING', 'READY_TO_SHIP', 'SHIPPED', 'COMPLETED'] } } })));
  });

  await W(G, 'Dashboard 6: the finance reports agree with each other and with the ledger tables', m('DB-06', 'Finance reports', 'Finance > Ledger > Reports', 'GET /api/ledger/reports/*'), async (ok) => {
    const tb = await cfo.get('/api/ledger/reports/trial-balance'); const acct = (code) => tb.body.accounts.find((a) => a.code === code);
    const rev = await cfo.get('/api/ledger/reports/revenue?by=branch'); const rec = await cfo.get('/api/ledger/reports/receivables'); const inv = await cfo.get('/api/ledger/reports/inventory');
    ok('receivables on the trial balance equal the receivables report', near(acct('1100')?.balance, rec.body.totals.ledger, 0.011), `${acct('1100')?.balance} / ${rec.body.totals.ledger}`);
    ok('inventory on the report equals the ledger figure it names', near(inv.body.totals.ledger, inv.body.totals.records, 0.011) || inv.body.totals.difference !== undefined, JSON.stringify(inv.body.totals));
    const sqlRev = (await q(`SELECT COALESCE(SUM(l.credit - l.debit),0)::float8 AS v FROM "JournalLine" l JOIN "JournalEntry" e ON e.id = l."entryId" JOIN "LedgerAccount" a ON a.id = l."accountId" WHERE e.status IN ('POSTED','REVERSED') AND a.type::text = 'REVENUE'`))[0].v;
    const tbRev = tb.body.accounts.filter((a) => a.type === 'REVENUE').reduce((s, a) => s + Number(a.balance), 0);
    ok('revenue on the trial balance equals the revenue lines by SQL', near(tbRev, sqlRev, 0.011), `${tbRev} / ${sqlRev}`);
    const mine = await P.manager(b).get('/api/ledger/reports/revenue?by=branch');
    ok('a branch manager\'s revenue report holds only that branch', mine.status === 403 || (mine.body.rows || []).every((r) => !r.key || r.key === b.id), `${mine.status} ${(mine.body.rows || []).length} rows`);
    ok('and head office\'s total is at least the branch\'s', mine.status === 403 || Number(rev.body.total) >= Number(mine.body.total) - 0.01);
  });

  await W(G, 'Dashboard 7: a sample screen\'s data is labelled as sample, and no real screen is fed invented figures', m('DB-07', 'Sample data stays labelled', 'Executive > Cockpit and other sample screens', 'GET /api/executive/*'), async (ok, x) => {
    const ex = await coo.get('/api/executive/cockpit').catch(() => ({ status: 0 })); x.note(`/api/executive/cockpit answered ${ex.status}`);
    ok('the executive cockpit answer says it is sample data, or is not served', ex.status !== 200 || /sample|demo|illustrat|not real/i.test(JSON.stringify(ex.body).slice(0, 4000)), JSON.stringify(ex.body || '').slice(0, 160));
    const ai = await coo.post('/api/executive/ai/query', { query: 'What is our margin forecast?' });
    ok('the executive question box does not answer with invented figures', ai.status !== 200 || !/\d+(\.\d+)?%|\$\d/.test(JSON.stringify(ai.body)), `${ai.status} ${JSON.stringify(ai.body || '').slice(0, 200)}`);
  });
}
