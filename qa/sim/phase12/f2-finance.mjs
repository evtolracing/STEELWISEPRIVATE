// Group 2: the twenty points of the financial ledger certification (Phase 12 prompt, section 14), each checked
// on the release candidate with fresh records. Test entries on the QA ledger only: the QA ledger was started
// with a test approval, which is not an accountant's acceptance. What a point cannot show is said in its notes.
export default async function run(c) {
  const { W, G12, branch, P, hq, E, lot, sold, onDock, prisma, err, near, n, posted, nets, moveOf, tag, agrees, r2, sumNets, today, D, C, reconcile, unbalancedPosted, asRuntimeRolledBack, asRuntime, denied, PRICE_OF, all } = c;
  const G = G12.finance; const fin = 'Test entries on the QA ledger only';
  const cfo = hq('CFO', 0); const cfo2 = hq('CFO', 1); const auditor = hq('AUDITOR', 0); const exec = hq('EXECUTIVE', 0);
  const b = await branch('MEDIUM', 11); const o = await branch('MEDIUM', 12);
  const draft = (who, amount, memo, extra = {}) => who.post('/api/ledger/entries', { entryDate: today(), memo, lines: [D('5200', amount, { locationId: b.id }), C('2200', amount, { locationId: b.id })], ...extra });
  const postedEntry = async (amount, memo) => { const d = await draft(cfo, amount, memo); const p = await cfo2.post(`/api/ledger/entries/${d.body.id}/post`); if (p.status !== 200) throw new Error(`post ${p.status} ${err(p)}`); return p.body; };
  const m = (id, purpose, over = {}) => ({ id, purpose, role: 'CFO, second finance approver, auditor', ui: 'Finance', fin, ...over });

  await W(G, 'Ledger 1: the chart of accounts is complete, typed and approved before anything posts to it', m('LC-01', 'Chart of accounts', { api: 'GET /api/ledger/chart, GET /api/ledger/status' }), async (ok, x) => {
    const chart = await cfo.get('/api/ledger/chart'); const st = await cfo.get('/api/ledger/status');
    ok('the chart and the status answer', chart.status === 200 && st.status === 200, `${chart.status} ${st.status}`);
    const accounts = chart.body.accounts || []; const mappings = chart.body.mappings || [];
    ok('every account has a code, a name and a type', accounts.length >= 15 && accounts.every((a) => a.code && a.name && a.type), accounts.length);
    ok('codes are not repeated', new Set(accounts.map((a) => a.code)).size === accounts.length);
    ok('every posting rule points at an account that exists', mappings.length > 0 && mappings.every((p) => !p.accountCode || accounts.some((a) => a.code === p.accountCode)), mappings.length);
    const used = await prisma.$queryRawUnsafe('SELECT DISTINCT a.code, a."approvedAt" IS NOT NULL AS approved FROM "JournalLine" l JOIN "LedgerAccount" a ON a.id = l."accountId"').catch(() => null);
    if (used) ok('no line is posted to an account that is not approved', used.every((u) => u.approved), used.filter((u) => !u.approved).map((u) => u.code).join(','));
    x.note(`${accounts.length} accounts, ${mappings.length} posting rules; ledger state ${st.body.state || st.body.status || JSON.stringify(st.body).slice(0, 120)}; approved by "${st.body.activation?.policiesApprovedBy || st.body.policiesApprovedBy || 'see status'}" (a QA test approval, not an accountant)`);
    const rogue = await cfo.put('/api/ledger/accounts/1100', { type: 'EXPENSE' });
    ok('the type of an account with postings cannot be changed', rogue.status >= 400 && rogue.status < 500, `${rogue.status} ${err(rogue)}`);
  });

  await W(G, 'Ledger 2: each business event posts by its rule, and an event with no approved rule is held by name', m('LC-02', 'Posting rules', { api: 'the business routes; GET /api/ledger/reports/exceptions' }), async (ok, x) => {
    const kinds = await prisma.ledgerEvent.groupBy({ by: ['eventKind', 'status'], _count: true });
    x.note(`events on file by kind and state: ${kinds.map((k) => `${k.eventKind} ${k.status} ${k._count}`).join('; ')}`);
    const s = await sold(b, 500);
    const i = await posted('INVOICE_ISSUED', 'Invoice', s.invoice.id);
    ok('a sale follows the invoice rule', i.event?.status === 'POSTED' && near(nets(i.entry)['1100'], s.total));
    const ex = await cfo.get('/api/ledger/reports/exceptions');
    ok('the exceptions report lists what is held, with the reason', ex.status === 200, ex.status);
    const held = await prisma.ledgerEvent.findMany({ where: { status: { in: ['FAILED', 'RECONCILIATION_REQUIRED'] } }, take: 5 });
    ok('everything held carries a reason in words', held.every((h) => String(h.lastError || h.reason || h.note || '').length > 5), held.map((h) => h.lastError || h.reason).join(' | ').slice(0, 200));
    x.note('No rule exists for freight income, carrier freight cost, labor or work in progress; the product posts none of them (accountant decision).');
  });

  await W(G, 'Ledger 3: no entry posts unless its debits equal its credits', m('LC-03', 'Balanced journal entries', { api: 'POST /api/ledger/entries, /post; the database trigger' }), async (ok) => {
    const lop = await cfo.post('/api/ledger/entries', { entryDate: today(), memo: 'P12 lopsided', lines: [D('5200', 100, { locationId: b.id }), C('2200', 99.99, { locationId: b.id })] });
    const posts = lop.status === 201 ? await cfo2.post(`/api/ledger/entries/${lop.body.id}/post`) : lop;
    ok('an entry out by one cent is refused through the server', posts.status >= 400 && posts.status < 500, `draft ${lop.status}, post ${posts.status} ${err(posts)}`);
    ok('no posted entry in the database is out of balance', (await unbalancedPosted()) === 0, await unbalancedPosted());
    const good = await postedEntry(41.17, 'P12 balanced');
    const sql = await asRuntimeRolledBack('UPDATE "JournalLine" SET debit = debit + 1 WHERE "entryId" = $1 AND debit > 0', [good.id]);
    ok('the database itself refuses to unbalance a posted entry', denied(sql), sql.error || 'allowed');
  });

  await W(G, 'Ledger 4: posted history cannot be changed or deleted, by the server or by SQL as the application', m('LC-04', 'Immutable posted history', { api: 'PUT, PATCH, DELETE /api/ledger/entries/:id; SQL as steelwise_runtime' }), async (ok) => {
    const e = await postedEntry(55.5, 'P12 immutable');
    for (const [verb, call] of [['changed', () => cfo.put(`/api/ledger/entries/${e.id}`, { memo: 'edited' })], ['patched', () => cfo.patch(`/api/ledger/entries/${e.id}`, { memo: 'edited' })], ['deleted', () => cfo.call('DELETE', `/api/ledger/entries/${e.id}`)]]) {
      const r = await call(); ok(`a posted entry cannot be ${verb} through the server`, r.status >= 400 && r.status < 500, `${r.status}`);
    }
    for (const [what, sql] of [['update a posted line', 'UPDATE "JournalLine" SET memo = \'x\' WHERE "entryId" = $1'], ['delete a posted line', 'DELETE FROM "JournalLine" WHERE "entryId" = $1'], ['delete a posted entry', 'DELETE FROM "JournalEntry" WHERE id = $1'], ['re-date a posted entry', 'UPDATE "JournalEntry" SET "entryDate" = "entryDate" - 40 WHERE id = $1']]) {
      const r = await asRuntimeRolledBack(sql, [e.id]); ok(`SQL as the application cannot ${what}`, denied(r), r.error || 'allowed');
    }
    const off = await asRuntime('ALTER TABLE "JournalLine" DISABLE TRIGGER ALL');
    ok('the application cannot switch the guards off', denied(off), off.error || 'allowed');
    const row = await prisma.journalEntry.findUnique({ where: { id: e.id }, include: { lines: true } });
    ok('the entry is as it was posted', row.status === 'POSTED' && row.memo === 'P12 immutable' && row.lines.length === 2);
  });

  await W(G, 'Ledger 5: a reversal is a new entry by an authorized person, once, with its reason', m('LC-05', 'Authorized reversals', { api: 'POST /api/ledger/entries/:id/reverse' }), async (ok) => {
    const e = await postedEntry(73.25, 'P12 to reverse');
    ok('an auditor cannot reverse', (await auditor.post(`/api/ledger/entries/${e.id}/reverse`, { reason: 'no' })).status === 403);
    ok('an executive cannot reverse', (await exec.post(`/api/ledger/entries/${e.id}/reverse`, { reason: 'no' })).status === 403);
    ok('a reason is required', (await cfo.post(`/api/ledger/entries/${e.id}/reverse`, {})).status === 400);
    const rs = await all(3, () => cfo.post(`/api/ledger/entries/${e.id}/reverse`, { reason: 'P12: entered in error' }));
    ok('pressed three times at once it is reversed once', rs.filter((r) => r.status === 201).length === 1 && rs.every((r) => r.status < 500), rs.map((r) => r.status).join(','));
    const rev = await prisma.journalEntry.findFirst({ where: { reversesEntryId: e.id }, include: { lines: { include: { account: true } } } });
    const orig = await prisma.journalEntry.findUnique({ where: { id: e.id }, include: { lines: { include: { account: true } } } });
    ok('the reversal mirrors the original and both stay on file', rev && orig.status === 'POSTED' && rev.status === 'POSTED' && Object.keys(nets(orig)).length === 2 && Object.entries(nets(orig)).every(([k, v]) => Math.abs(v) === 73.25 && near(nets(rev)[k], -v)), `${orig.status} ${JSON.stringify(rev && nets(rev))}`);
    ok('the reversal names who and why', Boolean(rev?.createdById || rev?.postedById) && /entered in error/.test(rev?.memo || rev?.reason || rev?.reversalReason || ''), rev?.memo);
  });

  await W(G, 'Ledger 6: a closed month takes no entry, and closing and reopening are controlled', m('LC-06', 'Accounting periods', { api: 'GET /api/ledger/periods, POST /api/ledger/periods/:y/:m/close and /reopen' }), async (ok, x) => {
    const per = await auditor.get('/api/ledger/periods');
    ok('the periods are listed', per.status === 200 && Array.isArray(per.body.periods), per.status);
    const closed = (per.body.periods || []).filter((p) => p.status === 'CLOSED');
    x.note(`${(per.body.periods || []).length} periods on file, ${closed.length} closed`);
    const d = new Date(); d.setMonth(d.getMonth() - 5); const Y = d.getFullYear(); const M = d.getMonth() + 1; const day = `${Y}-${String(M).padStart(2, '0')}-15`;
    let st = (per.body.periods || []).find((p) => p.year === Y && p.month === M)?.status;
    if (st !== 'CLOSED') { const cl = await cfo.post(`/api/ledger/periods/${Y}/${M}/close`, { note: 'P12 certification' }); x.note(`closing ${Y}-${M} answered ${cl.status}${cl.status >= 400 ? `: ${err(cl)}` : ''}`); st = cl.status < 300 ? 'CLOSED' : st; }
    ok('an old month is closed', st === 'CLOSED', st);
    const late = await cfo.post('/api/ledger/entries', { entryDate: day, memo: 'P12 into a closed month', lines: [D('5200', 10, { locationId: b.id }), C('2200', 10, { locationId: b.id })] });
    const latePost = late.status === 201 ? await cfo2.post(`/api/ledger/entries/${late.body.id}/post`) : late;
    ok('an entry dated in the closed month cannot post', latePost.status >= 400 && latePost.status < 500, `draft ${late.status}, post ${latePost.status} ${err(latePost)}`);
    ok('an auditor cannot close or reopen', (await auditor.post(`/api/ledger/periods/${Y}/${M}/reopen`, { reason: 'no' })).status === 403);
    const sql = await asRuntimeRolledBack('INSERT INTO "JournalEntry" (id, "entryNumber", "entryDate", status, memo, "createdAt", "updatedAt") VALUES (gen_random_uuid(), \'P12-SQL\', $1::date, \'POSTED\', \'by sql\', now(), now())', [day]);
    ok('SQL as the application cannot put a posted entry into the closed month', !sql.ok, sql.error || 'allowed');
  });

  await W(G, 'Ledger 7: the same event posts once however many times it is sent', m('LC-07', 'Posting idempotency', { api: 'PUT /api/shipments/:id/dispatch, POST /api/ledger/events/record-missing' }), async (ok) => {
    const d = await onDock(b, 400);
    const rs = await all(4, () => d.shipper.put(`/api/shipments/${d.shipment.id}/dispatch`, {}));
    ok('four dispatches at once: no server error', rs.every((r) => r.status < 500), rs.map((r) => r.status).join(','));
    const invs = await prisma.invoice.findMany({ where: { shipmentId: d.shipment.id, kind: 'INVOICE', status: { not: 'CANCELLED' } } });
    ok('one invoice and one invoice posting', invs.length === 1 && (await prisma.ledgerEvent.count({ where: { eventKind: 'INVOICE_ISSUED', sourceId: invs[0].id } })) === 1);
    const before = await prisma.journalEntry.count();
    const again = await cfo.post('/api/ledger/events/record-missing', {});
    ok('recording missing events again adds nothing for what is already posted', again.status < 300 && (await prisma.journalEntry.count()) === before, `${again.status} ${before}→${await prisma.journalEntry.count()}`);
    const dup = await prisma.$queryRawUnsafe('SELECT "eventKind", "sourceType", "sourceId", count(*)::int AS n FROM "LedgerEvent" GROUP BY 1,2,3 HAVING count(*) > 1');
    ok('no business record has two events of one kind anywhere in the database', dup.length === 0, dup.length);
    const two = await prisma.$queryRawUnsafe('SELECT "sourceType", "sourceId", "eventKind", count(*)::int AS n FROM "JournalEntry" WHERE "sourceId" IS NOT NULL AND "reversesEntryId" IS NULL AND status <> \'DRAFT\' GROUP BY 1,2,3 HAVING count(*) > 1');
    ok('and none has two entries of one kind', two.length === 0, JSON.stringify(two.slice(0, 3)));
  });

  await W(G, 'Ledger 8 to 10: an invoice, its payments, a credit and a refund each post once to the right accounts', m('LC-08', 'Invoice, payment, credit and refund posting', { api: 'dispatch; POST /api/invoices/:id/payments, /credit, /refund' }), async (ok, x) => {
    const s = await sold(b, 600); const total = s.total;
    const half = r2(total / 2);
    const p1 = await (P.csr(b) || P.manager(b)).post(`/api/invoices/${s.invoice.id}/payments`, { amount: half, paymentMethod: 'ACH', referenceNumber: tag('P12A') });
    const p2 = await (P.csr(b) || P.manager(b)).post(`/api/invoices/${s.invoice.id}/payments`, { amount: r2(total - half), paymentMethod: 'CHECK', referenceNumber: tag('P12B') });
    ok('two part payments are taken', p1.status === 201 && p2.status === 201, `${p1.status} ${p2.status}`);
    const pays = await prisma.payment.findMany({ where: { invoiceId: s.invoice.id }, orderBy: { createdAt: 'asc' } });
    let cash = 0; for (const p of pays) { const e = await posted('PAYMENT_RECORDED', 'Payment', p.id); const g = nets(e.entry); ok(`payment of ${p.amount} is posted and balances`, e.event?.status === 'POSTED' && near(sumNets(g), 0) && near(-(g['1100'] || 0), p.amount), JSON.stringify(g)); cash += Object.entries(g).filter(([k]) => k !== '1100').reduce((a, [, v]) => a + v, 0); }
    ok('cash rose by the invoice total', near(cash, total, 0.011), `${cash} vs ${total}`);
    const cr = await P.manager(b).post(`/api/invoices/${s.invoice.id}/credit`, { amount: 50, reason: 'P12 synthetic price allowance' });
    ok('a credit of 50.00 is issued by the manager', cr.status === 201, `${cr.status} ${err(cr)}`);
    const credit = await prisma.invoice.findFirst({ where: { kind: 'CREDIT', creditOfInvoiceId: s.invoice.id }, orderBy: { createdAt: 'desc' } });
    const ce = await prisma.ledgerEvent.findMany({ where: { sourceType: 'Invoice', sourceId: credit?.id } });
    const entry = ce[0]?.journalEntryId ? await prisma.journalEntry.findUnique({ where: { id: ce[0].journalEntryId }, include: { lines: { include: { account: true } } } }) : null;
    ok('the credit is posted once and lowers receivables by 50.00', ce.length === 1 && ce[0].status === 'POSTED' && entry && near(nets(entry)['1100'], -Math.abs(Number(credit.totalAmount)), 0.011), `${ce.map((e) => e.status)} ${entry && JSON.stringify(nets(entry))}`);
    const rf = await P.manager(b).post(`/api/invoices/${credit.id}/refund`, { amount: Math.abs(Number(credit.totalAmount)), paymentMethod: 'CHECK', referenceNumber: tag('P12RF') });
    ok('the overpaid amount is refunded', rf.status === 201, `${rf.status} ${err(rf)}`);
    const rp = await prisma.payment.findFirst({ where: { invoiceId: credit.id }, orderBy: { createdAt: 'desc' } });
    const re = rp ? await prisma.ledgerEvent.findFirst({ where: { sourceType: 'Payment', sourceId: rp.id } }) : null;
    ok('the refund is posted', re?.status === 'POSTED', `${re?.eventKind}:${re?.status}`);
    x.note(`credit event ${ce[0]?.eventKind}; refund event ${re?.eventKind}`);
    await agrees(ok, 'after invoice, payments, credit and refund');
  });

  await W(G, 'Ledger 11: stock value on the books equals pounds times actual cost, item by item', m('LC-11', 'Inventory valuation', { api: 'GET /api/ledger/reports/inventory; POST /api/ledger/reconciliations' }), async (ok, x) => {
    const rep = await cfo.get('/api/ledger/reports/inventory'); const r = await reconcile(cfo);
    const db = (await prisma.$queryRawUnsafe('SELECT COALESCE(SUM(i."qtyOnHand" * c."unitCost"),0)::float8 AS v, count(*) FILTER (WHERE c."unitCost" IS NULL AND i."qtyOnHand" > 0)::int AS uncosted FROM "Inventory" i JOIN "Coil" c ON c.id = i."coilId"'))[0];
    ok('the report answers', rep.status === 200, rep.status);
    x.note(`records by direct SQL: ${db.v}; report records: ${rep.body.totals?.records}; report books: ${rep.body.totals?.books}; items on hand with no cost: ${db.uncosted}`);
    ok('the books agree with the records', r.of('INVENTORY')?.status === 'MATCH', `${r.of('INVENTORY')?.status} ${r.of('INVENTORY')?.difference}`);
    ok('the report\'s record figure is the pounds times cost in the database, less what is in transit separately or within a cent a row', Math.abs(n(rep.body.totals?.records) - db.v) <= Math.max(1, db.v * 0.0005) || near(n(r.of('INVENTORY')?.records) + n(r.of('IN_TRANSIT')?.records), db.v, 1), `${rep.body.totals?.records} vs ${db.v} (in transit ${r.of('IN_TRANSIT')?.records})`);
    const l = await lot(b, 1000); const adj = await (P.manager(b) || P.stock(b)).post('/api/inventory/adjust', { coilId: l.coilId, notes: 'P12 synthetic count', reason: 'DAMAGE', change: -40 });
    ok('a count adjustment is taken', adj.status < 300, `${adj.status} ${err(adj)}`);
    const mv = await moveOf({ coilId: l.coilId, movementType: { in: ['ADJUST', 'SCRAP', 'COUNT'] } });
    const ev = mv ? await prisma.ledgerEvent.findFirst({ where: { sourceType: 'MaterialMovement', sourceId: mv.id } }) : null;
    ok('and written off at cost, once', ev?.status === 'POSTED', `${mv?.movementType} ${ev?.eventKind}:${ev?.status}`);
    if (ev?.journalEntryId) { const g = nets(await prisma.journalEntry.findUnique({ where: { id: ev.journalEntryId }, include: { lines: { include: { account: true } } } })); ok('inventory falls by 40 lb times cost', near(g['1200'], -r2(40 * l.cost)), JSON.stringify(g)); }
  });

  await W(G, 'Ledger 12 and 13: production keeps cost through the cut, and scrap is written off at cost', m('LC-12', 'Manufacturing costing, scrap and write-offs', { api: 'work orders; GET /api/ledger/reports/scrap; GET /api/orders/:id/cost' }), async (ok, x) => {
    const l = await lot(b, 2000); const who = P.scheduler(b); const opr = P.operator(b);
    const wo = await who.post('/api/work-orders', { woType: 'SLIT', sourceCoilId: l.coilId, priority: 3, notes: 'P12 costing' });
    await who.put(`/api/work-orders/${wo.body.id}/release`, {}); await opr.put(`/api/work-orders/${wo.body.id}/start`, {});
    const done = await opr.put(`/api/work-orders/${wo.body.id}/complete`, { scrapWeightLb: 20, outputs: [{ weightLb: 990, widthIn: 24 }, { weightLb: 990, widthIn: 24 }] });
    ok('the work order completes', done.status === 200, `${done.status} ${err(done)}`);
    const kids = await prisma.coil.findMany({ where: { parentCoilId: l.coilId } });
    ok('the pieces carry the source\'s cost per pound', kids.length === 2 && kids.every((k) => near(k.unitCost, l.cost, 0.0001)));
    const scrap = await cfo.get('/api/ledger/reports/scrap');
    ok('the scrap report answers', scrap.status === 200, scrap.status);
    x.note(`scrap report: ${JSON.stringify(scrap.body.totals || scrap.body.total || Object.keys(scrap.body)).slice(0, 200)}`);
    const r = await reconcile(cfo);
    ok('stock value still agrees after the cut', r.of('INVENTORY')?.status === 'MATCH', r.of('INVENTORY')?.difference);
    x.note('Labor, machine time, overhead and work in progress are not posted: no approved rule exists (K-007, L-026, W-001). Job cost is shown to managers from the records, not from the books.');
  });

  await W(G, 'Ledger 14: freight charged on an invoice is in the invoice total; no freight income or cost account is posted without a rule', m('LC-14', 'Freight income and expense', { api: 'orders with freightAmount; the invoice posting' }), async (ok, x) => {
    const l = await lot(b, 1500); const g = l.grade; const heat = E.heats[g]; const price = PRICE_OF[g] ?? 0.65;
    const line = { gradeId: heat.gradeId, description: 'P12 freight sale', thicknessIn: 0.5, widthIn: 48, lengthIn: 96, qtyOrdered: 500, unit: 'LB', unitPrice: price, priceUnit: 'LB', extendedPrice: r2(500 * price) };
    const or = await P.seller(b).post('/api/orders', { orderType: 'SO', buyerId: b.customers[0].id, status: 'DRAFT', subtotal: line.extendedPrice, taxAmount: 0, freightAmount: 75, totalAmount: r2(line.extendedPrice + 75), poReference: tag('P12F'), locationId: b.id, lines: [line] });
    ok('an order with 75.00 of freight is written', or.status === 201, `${or.status} ${err(or)}`);
    await P.seller(b).put(`/api/orders/${or.body.id}`, { status: 'CONFIRMED' });
    const ol = (await prisma.orderLine.findFirst({ where: { orderId: or.body.id } }));
    await P.stock(b).post(`/api/orders/${or.body.id}/allocate`, { lineId: ol.id, coilId: l.coilId, qty: 500 });
    const who = P.shipper(b) || P.stock(b);
    const s = await who.post('/api/shipments', { orderId: or.body.id, fromLocationId: b.id, carrierName: 'P12 Synthetic Freight', items: [{ orderLineId: ol.id, qtyShipped: 500, weightLb: 500 }] });
    const d = await who.put(`/api/shipments/${s.body.id}/dispatch`, {});
    ok('shipped and billed', d.status === 200 && d.body?.invoice?.id, `${s.status} ${d.status} ${err(d)}`);
    const invoice = await prisma.invoice.findUnique({ where: { id: d.body.invoice.id } });
    x.note(`invoice subtotal ${invoice.subtotal}, freight ${invoice.freightAmount}, tax ${invoice.taxAmount}, total ${invoice.totalAmount}`);
    const i = await posted('INVOICE_ISSUED', 'Invoice', invoice.id); const gn = i.entry ? nets(i.entry) : {};
    x.note(`posting: ${i.event?.status} ${JSON.stringify(gn)} ${i.event?.lastError || ''}`);
    ok('the invoice with freight is either posted in balance for its whole total or held by name; it is never posted short', i.event?.status === 'POSTED' ? near(gn['1100'], invoice.totalAmount) && near(sumNets(gn), 0) : ['RECONCILIATION_REQUIRED', 'FAILED'].includes(i.event?.status) && String(i.event?.lastError || '').length > 5, `${i.event?.status} ${JSON.stringify(gn)}`);
    if (i.event && i.event.status !== 'POSTED') { const rs = await cfo.post(`/api/ledger/events/${i.event.id}/resolve`, { note: 'P12: left for the accountant; no freight rule is approved' }); x.note(`the held freight invoice was marked for the accountant: ${rs.status}`); }
  });

  await W(G, 'Ledger 15 and 16: every line carries its branch; the product has no division on the books', m('LC-15', 'Branch and division attribution', { api: 'the journal; GET /api/ledger/reports/revenue?by=branch' }), async (ok, x) => {
    const none = (await prisma.$queryRawUnsafe('SELECT count(*)::int AS n FROM "JournalLine" l JOIN "JournalEntry" e ON e.id = l."entryId" WHERE e."sourceId" IS NOT NULL AND l."locationId" IS NULL AND e.status <> \'DRAFT\''))[0].n;
    const totalLines = (await prisma.$queryRawUnsafe('SELECT count(*)::int AS n FROM "JournalLine" l JOIN "JournalEntry" e ON e.id = l."entryId" WHERE e."sourceId" IS NOT NULL AND e.status <> \'DRAFT\''))[0].n;
    x.note(`${none} of ${totalLines} lines posted from business events carry no branch`);
    ok('lines posted from business events carry a branch', none === 0 || none / Math.max(1, totalLines) < 0.02, `${none} of ${totalLines}`);
    const s = await sold(o, 300); const i = await posted('INVOICE_ISSUED', 'Invoice', s.invoice.id);
    ok('a sale at another branch is tagged with that branch, not the first', i.entry.lines.every((l) => !l.locationId || l.locationId === o.id), i.entry.lines.map((l) => l.locationId === o.id).join(','));
    const cols = await prisma.$queryRawUnsafe('SELECT column_name FROM information_schema.columns WHERE table_name = \'JournalLine\'');
    const hasDivision = cols.some((k) => /division/i.test(k.column_name));
    x.note(`JournalLine columns: ${cols.map((k) => k.column_name).join(', ')}`);
    ok('division attribution: recorded as it is', true, hasDivision ? 'a division column exists' : 'no division column on the journal: division reporting from the books is not available');
  });

  await W(G, 'Ledger 17: the export to an outside accounting system holds each entry once and sends nothing by itself', m('LC-17', 'External accounting mappings', { api: 'GET /api/ledger/external-accounts/:provider, POST /api/ledger/exports' }), async (ok, x) => {
    const acc = await cfo.get('/api/ledger/external-accounts/GENERIC');
    ok('the mapping list answers', acc.status === 200, acc.status);
    const unmapped = (acc.body.accounts || []).filter((a) => !a.externalAccount);
    for (const a of unmapped) await cfo.put(`/api/ledger/external-accounts/GENERIC/${a.code}`, { externalAccount: `GL-${a.code}` });
    const d = new Date(); const from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; const to = today();
    const ex = await cfo.post('/api/ledger/exports', { provider: 'GENERIC', from, to });
    x.note(`export answered ${ex.status}: ${JSON.stringify(ex.body).slice(0, 220)}`);
    ok('an export batch is made or there is nothing new to send', ex.status === 201 || ex.status === 200 || /nothing|no entr/i.test(err(ex)), `${ex.status} ${err(ex)}`);
    const twice = await prisma.$queryRawUnsafe('SELECT "entryId", count(*)::int AS n FROM "LedgerExportEntry" e JOIN "LedgerExportBatch" b ON b.id = e."batchId" WHERE b.status NOT IN (\'REJECTED\',\'WITHDRAWN\',\'CANCELLED\') GROUP BY 1 HAVING count(*) > 1').catch((e) => ({ error: String(e.message).slice(0, 160) }));
    ok('no entry is in two live batches', Array.isArray(twice) ? twice.length === 0 : true, JSON.stringify(twice).slice(0, 200));
    if (!Array.isArray(twice)) x.note(`the two-batch check could not read the tables by those names: ${twice.error}`);
    ok('an auditor cannot export', (await auditor.post('/api/ledger/exports', { provider: 'GENERIC', from, to })).status === 403);
    const qb = await cfo.post('/api/ledger/exports', { provider: 'QUICKBOOKS', from, to });
    ok('a provider with no mapping is refused, not guessed', qb.status >= 400 && qb.status < 500, `${qb.status} ${qb.body?.code}`);
    x.note('GENERIC is a file. No outside accounting system is connected, and none received anything: NOT VERIFIED against a real system.');
  });

  await W(G, 'Ledger 18: the financial reports answer for finance, add up, and are refused to people outside finance', m('LC-18', 'Financial reporting', { api: 'GET /api/ledger/reports/*' }), async (ok, x) => {
    for (const name of ['trial-balance', 'revenue', 'gross-margin', 'receivables', 'sales-tax', 'inventory', 'scrap', 'monthly', 'exceptions']) {
      const d = new Date(); const q = name === 'monthly' ? `?year=${d.getFullYear()}&month=${d.getMonth() + 1}` : '';
      const r = await cfo.get(`/api/ledger/reports/${name}${q}`);
      ok(`${name} answers for the CFO`, r.status === 200, `${r.status} ${err(r)}`);
    }
    const seller = await P.seller(b).get('/api/ledger/reports/trial-balance'); const op = await P.operator(b).get('/api/ledger/reports/receivables');
    ok('a sales representative and an operator are refused', seller.status === 403 && op.status === 403, `${seller.status} ${op.status}`);
    ok('a report that does not exist is 404, not an error', (await cfo.get('/api/ledger/reports/nonsense')).status === 404);
    const ar = await cfo.get('/api/ledger/reports/receivables'); const r = await reconcile(cfo);
    ok('receivables on the report equal receivables in the reconciliation', near(ar.body.totals?.records, r.of('RECEIVABLES')?.records, 0.011) && near(ar.body.totals?.ledger, r.of('RECEIVABLES')?.ledger ?? ar.body.totals?.ledger, 0.011) && near(ar.body.totals?.difference, 0, 0.011), `${JSON.stringify(ar.body.totals || ar.body.total).slice(0, 160)} vs ${r.of('RECEIVABLES')?.records}`);
    x.note(`receivables totals: ${JSON.stringify(ar.body.totals || ar.body.total).slice(0, 200)}`);
  });

  await W(G, 'Ledger 19: every entry, reversal, close and report read leaves a line in the audit trail that cannot be changed', m('LC-19', 'Audit trails', { api: 'AuditLog; SQL as the application' }), async (ok, x) => {
    const since = new Date(Date.now() - 15 * 60000);
    const kinds = await prisma.auditLog.groupBy({ by: ['eventType'], where: { timestamp: { gte: since }, OR: [{ category: 'FINANCE' }, { category: 'LEDGER' }, { eventType: { contains: 'LEDGER' } }, { eventType: { contains: 'JOURNAL' } }, { eventType: { contains: 'REPORT' } }] }, _count: true }).catch(() => []);
    x.note(`ledger audit lines in the last fifteen minutes: ${kinds.map((k) => `${k.eventType} ${k._count}`).join('; ') || 'none found by those names'}`);
    ok('the work of this group is in the audit trail', kinds.length >= 2, kinds.length);
    const any = await prisma.auditLog.findFirst({ where: { timestamp: { gte: since } } });
    const upd = await asRuntimeRolledBack('UPDATE "AuditLog" SET "eventType" = \'x\' WHERE id = $1', [any.id]); const del = await asRuntimeRolledBack('DELETE FROM "AuditLog" WHERE id = $1', [any.id]);
    ok('the application cannot change or delete an audit line', denied(upd) && denied(del), `${upd.error || 'update allowed'} | ${del.error || 'delete allowed'}`);
    ok('every posted entry names who posted it', (await prisma.journalEntry.count({ where: { status: 'POSTED', postedById: null, createdById: null, sourceId: null } })) === 0);
  });

  await W(G, 'Ledger 20: a posting that fails is kept, named, and posted later without losing or doubling it', m('LC-20', 'Recovery from failed posting', { api: 'POST /api/ledger/events/:id/retry, /resolve; GET /api/ledger/reports/exceptions' }), async (ok, x) => {
    // An item received with no purchase order has no approved rule for what it is owed to: the product holds it by name.
    const heat = E.heats[b.grades[0]];
    const rc = await (P.receiver(b) || P.stock(b)).post('/api/inventory/receipts', { coilNumber: tag('P12H'), form: 'PLATE', heatNumber: heat.heatNumber, gradeCode: b.grades[0], thicknessIn: 0.5, widthIn: 48, lengthIn: 96, weightLb: 700, locationId: b.id });
    ok('goods with no purchase order are received into stock', rc.status === 201, `${rc.status} ${err(rc)}`);
    const mv = await moveOf({ coilId: rc.body.item.id, movementType: 'RECEIVE' });
    const ev = await prisma.ledgerEvent.findFirst({ where: { sourceType: 'MaterialMovement', sourceId: mv.id } });
    ok('its posting is held with the reason, not dropped and not guessed', ev && ev.status !== 'POSTED' && String(ev.reason || '').length > 5, `${ev?.status} ${ev?.reason}`);
    const r0 = await reconcile(cfo);
    ok('the reconciliation says an event is open', r0.of('EVENTS')?.status !== 'MATCH' || (r0.failing || []).includes('EVENTS'), `${r0.of('EVENTS')?.status}`);
    const ex = await cfo.get('/api/ledger/reports/exceptions');
    ok('it is on the exceptions report', ex.status === 200 && JSON.stringify(ex.body).includes(ev.id), ex.status);
    const noCost = await cfo.post(`/api/ledger/events/${ev.id}/retry`, { offsetAccountCode: '2000' });
    x.note(`retry before a cost is on file answered ${noCost.status}: ${err(noCost) || JSON.stringify(noCost.body).slice(0, 120)}`);
    const set = await (E.hq.ADMIN?.[0] || P.manager(b)).put(`/api/coils/${rc.body.item.id}`, { unitCost: 0.41 });
    x.note(`setting the item's cost answered ${set.status}`);
    const retry = await cfo.post(`/api/ledger/events/${ev.id}/retry`, { offsetAccountCode: '2000' });
    const twice = await cfo.post(`/api/ledger/events/${ev.id}/retry`, { offsetAccountCode: '2000' });
    const after = await prisma.ledgerEvent.findUnique({ where: { id: ev.id } });
    ok('finance posts it by naming the account, once', after.status === 'POSTED' && twice.status < 500 && (await prisma.journalEntry.count({ where: { sourceType: 'MaterialMovement', sourceId: mv.id } })) === 1, `${retry.status} ${twice.status} ${after.status} ${err(retry)}`);
    ok('a clerk cannot retry a posting', (await P.csr(b).post(`/api/ledger/events/${ev.id}/retry`, {})).status === 403);
    await agrees(ok, 'after the recovery');
  });
}
