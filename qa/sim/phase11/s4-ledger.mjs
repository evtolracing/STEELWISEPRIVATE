// Group 4: ledger posting and reconciliation across the 80 branches. Every business event must post once,
// for the right amount, to the right accounts and the right branch, whichever server copy handled it; the
// books must agree with the stock and invoice records; and a difference is named, never adjusted away.
// Test entries on the QA ledger only.
export default async function run(c) {
  const { S, G11, SELLING, TIERS, E, X, branch, P, hq, lot, onDock, sold, job, all, statuses, count, prisma, err, near, today, D, C, nets, posted, eventOf, expectEntry, reconcile, unbalancedPosted, asRuntimeRolledBack, moveOf, tag, sleep } = c;
  const G = G11.ledger;
  const cfo = hq('CFO', 0); const cfo2 = hq('CFO', 1); const auditor = hq('AUDITOR', 0);
  const fin = 'Test entries on the QA ledger only';
  const r2 = (v) => +Number(v).toFixed(2);
  const draftBy = (who, amount, memo, loc, extra = {}) => who.post('/api/ledger/entries', { entryDate: today(), memo, lines: [D('5200', amount, loc ? { locationId: loc.id } : {}), C('2200', amount, loc ? { locationId: loc.id } : {})], ...extra });
  const postedEntry = async (amount, memo, loc) => { const d = await draftBy(cfo, amount, memo, loc); const p = await cfo2.post(`/api/ledger/entries/${d.body.id}/post`); if (p.status !== 200) throw new Error(`post ${p.status} ${err(p)}`); return p.body; };
  const KEYS = ['BOOKS_BALANCE', 'INVENTORY', 'RECEIVABLES', 'IN_TRANSIT'];
  const agrees = async (ok, label) => {
    const r = await reconcile(cfo);
    ok(`${label}: the reconciliation ran`, r.status === 201, `${r.status}`);
    for (const k of KEYS) { const x = r.of(k); ok(`${label}: ${k} agrees`, x && x.status === 'MATCH', x ? `${x.status} ${x.difference} ${JSON.stringify(x.detail || '').slice(0, 160)}` : 'no such check'); }
    return r;
  };
  const payBy = (who, invoiceId, amount) => who.post(`/api/invoices/${invoiceId}/payments`, { amount, paymentMethod: 'CHECK', referenceNumber: tag('P11S4') });
  const payments = (invoiceId) => prisma.payment.findMany({ where: { invoiceId }, orderBy: { createdAt: 'asc' } });
  const eventsOf = (sourceType, ids) => prisma.ledgerEvent.findMany({ where: { sourceType, sourceId: { in: ids.map(String) } } });

  let k = 2; let exportBatch = null;
  for (const tier of SELLING) {
    const b = await branch(tier, k++); const at = `${TIERS[tier].label} ${b.code}`;
    const teller = () => P.csr(b) || P.manager(b);

    await S(G, `${at}: goods received post once, at cost, to the branch`, { expect: 'raw inventory up and accounts payable clearing up by pounds times cost, tagged with the branch', db: 'one STOCK_RECEIVED event, POSTED, one entry', fin: '1200 debit, 2000 credit', audit: 'LedgerEvent and JournalEntry of the receipt' }, async (ok) => {
      const l = await lot(b, 2400); const value = r2(2400 * l.cost);
      const mv = await moveOf({ coilId: l.coilId, movementType: 'RECEIVE' });
      const { entry, event } = await posted('STOCK_RECEIVED', 'MaterialMovement', mv.id);
      ok('the event is posted', event?.status === 'POSTED', event?.status);
      expectEntry(ok, 'receipt', entry, { 1200: value, 2000: -value });
      ok('the stock line carries the branch and the item', entry?.lines.some((x) => x.locationId === b.id && x.coilId === l.coilId && Number(x.debit) === value));
      ok('one entry for the receipt, not two', (await prisma.journalEntry.count({ where: { sourceType: 'MaterialMovement', sourceId: mv.id } })) === 1);
    });

    await S(G, `${at}: a sale posts its invoice and its cost of goods, each once and for the right amount`, { expect: 'receivables up by the invoice total; revenue and tax credited; cost of goods at the item\'s cost', db: 'INVOICE_ISSUED and STOCK_SHIPPED events POSTED', fin: '1100 debit = invoice total; 5000 debit = 1200 credit = pounds times cost' }, async (ok) => {
      const s = await sold(b, 700); const cost = r2(700 * s.lot.cost);
      const i = await posted('INVOICE_ISSUED', 'Invoice', s.invoice.id);
      ok('the invoice is posted', i.event?.status === 'POSTED' && i.entry?.status === 'POSTED', i.event?.status);
      const g = nets(i.entry);
      ok('receivables rise by the invoice total', near(g['1100'], s.total), `${g['1100']} vs ${s.total}`);
      ok('revenue is the invoice subtotal', near(-(g['4000'] || 0), Number(s.invoice.subtotal)), `${g['4000']} vs ${s.invoice.subtotal}`);
      ok('the entry balances', near(Object.values(g).reduce((a, x) => a + x, 0), 0), JSON.stringify(g));
      const buyer = (await prisma.order.findUnique({ where: { id: s.order.id } })).buyerId;
      ok('the receivable line names the customer and the branch', i.entry.lines.some((x) => x.account.code === '1100' && x.customerId === buyer && x.locationId === b.id), JSON.stringify(i.entry.lines.map((x) => [x.account.code, !!x.customerId, x.locationId === b.id])));
      const mv = await moveOf({ shipmentId: s.shipment.id, movementType: 'SHIP' });
      expectEntry(ok, 'cost of goods', (await posted('STOCK_SHIPPED', 'MaterialMovement', mv.id)).entry, { 5000: cost, 1200: -cost });
    });

    await S(G, `${at}: two tellers each take half of one invoice at the same moment`, { expect: 'both payments are recorded and posted; the invoice is paid, not overpaid', db: 'two Payment rows; Invoice PAID', fin: 'cash up and receivables down by the invoice total, in two entries' }, async (ok) => {
      const s = await sold(b, 300); const half = r2(s.total / 2); const rest = r2(s.total - half);
      const rs = await Promise.all([payBy(teller(), s.invoice.id, half), payBy(P.manager(b) || teller(), s.invoice.id, rest)]);
      ok('both were taken', rs.every((r) => r.status === 201), `${statuses(rs)} ${err(rs.find((r) => r.status !== 201) || {})}`);
      const ps = await payments(s.invoice.id); const ev = await eventsOf('Payment', ps.map((p) => p.id));
      ok('two payments, each posted once', ps.length === 2 && ev.length === 2 && ev.every((e) => e.status === 'POSTED'), `${ps.length} payments, ${ev.map((e) => e.status)}`);
      const i = await prisma.invoice.findUnique({ where: { id: s.invoice.id } });
      ok('the invoice is paid in full and owes nothing', i.status === 'PAID' && near(i.paidAmount, s.total) && near(i.totalAmount, s.total), `${i.status} ${i.paidAmount}/${i.totalAmount}`);
      let cash = 0; for (const p of ps) cash += nets((await posted('PAYMENT_RECORDED', 'Payment', p.id)).entry)['1000'] || 0;
      ok('cash rose by the invoice total', near(cash, s.total), `${cash} vs ${s.total}`);
    });

    await S(G, `${at}: the whole invoice is paid twice at the same moment`, { expect: 'one payment is taken; the second is refused', db: 'one Payment row', fin: 'cash and receivables move once', biz: 'a customer is never charged twice for one invoice' }, async (ok) => {
      const s = await sold(b, 250);
      const rs = await all(2, () => payBy(teller(), s.invoice.id, s.total));
      ok('one taken, one refused, no server error', count(rs, 201) === 1 && rs.every((r) => r.status < 500), `${statuses(rs)} ${err(rs.find((r) => r.status >= 400) || {})}`);
      const ps = await payments(s.invoice.id);
      ok('one payment row', ps.length === 1, ps.length);
      ok('posted once', (await eventsOf('Payment', ps.map((p) => p.id))).filter((e) => e.status === 'POSTED').length === 1);
      ok('paid is not above the total', near((await prisma.invoice.findUnique({ where: { id: s.invoice.id } })).paidAmount, s.total));
    });

    await S(G, `${at}: a return is received, credited and refunded, and each step posts once`, { expect: 'the credit lowers receivables through sales returns; the refund pays it back; the stock comes back at cost', db: 'credit memo, refund and return movement each with one POSTED event', fin: 'receivables net to zero for the returned part' }, async (ok) => {
      const j = job('F', b); const sale = await X.returnAndCredit(j, b, { customer: b.customers[1] || b.customers[0] });
      ok('a credit memo was issued', !!j.credit?.id, JSON.stringify(j.credit));
      const ev = await eventsOf('Invoice', [j.credit.id]);
      ok('the credit is posted once', ev.length === 1 && ev[0].status === 'POSTED', ev.map((e) => `${e.eventKind} ${e.status}`).join(','));
      const g = nets(await c.entryOf(ev[0].journalEntryId));
      ok('receivables fall by the credit', near(g['1100'], -Math.abs(j.credit.total)), `${g['1100']} vs ${j.credit.total}`);
      ok('the credit entry balances', near(Object.values(g).reduce((a, x) => a + x, 0), 0), JSON.stringify(g));
      const rf = await prisma.payment.findMany({ where: { invoiceId: j.credit.id } });
      const rev = await eventsOf('Payment', rf.map((p) => p.id));
      ok('the refund is posted once', rf.length === 1 && rev.length === 1 && rev[0].status === 'POSTED', `${rf.length} refunds, ${rev.map((e) => e.status)}`);
      const back = await prisma.materialMovement.findMany({ where: { coilId: sale.lot.coilId, movementType: { in: ['ADJUST', 'RECEIVE'] }, createdAt: { gte: new Date(Date.now() - 60000) } } });
      const bev = await eventsOf('MaterialMovement', back.map((m) => m.id));
      ok('no stock movement of the return is left unposted', bev.every((e) => ['POSTED', 'NOT_POSTED'].includes(e.status)), bev.map((e) => `${e.eventKind} ${e.status}`).join(','));
    });

    await S(G, `${at}: damaged stock is written off and posts at the item's cost`, { expect: 'raw inventory down by pounds times cost, to an expense account', db: 'one STOCK_ADJUSTED event POSTED', fin: '1200 credit = pounds times cost' }, async (ok) => {
      const l = await lot(b, 1800);
      const r = await (P.manager(b) || P.stock(b)).post('/api/inventory/adjust', { coilId: l.coilId, notes: 'P11 scenario: damaged in the yard', reason: 'DAMAGE', change: -120 });
      ok('adjusted', r.status < 300, `${r.status} ${err(r)}`);
      const mv = await moveOf({ coilId: l.coilId, movementType: 'ADJUST' });
      const { entry, event } = await posted('STOCK_ADJUSTED', 'MaterialMovement', mv.id);
      const g = nets(entry); const value = r2(120 * l.cost);
      ok('posted', event?.status === 'POSTED', event?.status);
      ok('raw inventory falls by 120 lb at cost', near(g['1200'], -value), `${g['1200']} vs ${-value}`);
      ok('one expense account takes it and the entry balances', Object.keys(g).filter((x) => !near(g[x], 0)).length === 2 && near(Object.values(g).reduce((a, x) => a + x, 0), 0), JSON.stringify(g));
    });

    await S(G, `${at}: a transfer to another branch posts in transit on the way and stock on arrival`, { expect: 'on the road: in transit up, sending branch down; received: receiving branch up, in transit down', db: 'TRANSFER_SHIPPED and TRANSFER_RECEIVED events POSTED', fin: '1300 nets to zero; 1200 moves from one branch to the other at cost' }, async (ok) => {
      const to = await branch('MEDIUM', k + 3); const l = await lot(b, 2000); l.gone = true; l.free = 0; const value = r2(2000 * l.cost);
      const t = await P.stock(b).post('/api/inventory/transfers', { toLocationId: to.id, coilIds: [l.coilId], carrier: 'Own truck' });
      ok('sent', t.status === 201, `${t.status} ${err(t)}`);
      const id = t.body.id || t.body.transfer?.id;
      const line = await prisma.stockTransferLine.findFirst({ where: { transferId: id } });
      expectEntry(ok, 'on the road', (await posted('TRANSFER_SHIPPED', 'StockTransferLine', line.id)).entry, { 1300: value, 1200: -value });
      const rc = await (P.receiver(to) || P.stock(to)).post(`/api/inventory/transfers/${id}/receive`, {});
      ok('received', rc.status < 300, `${rc.status} ${err(rc)}`);
      const arrive = (await prisma.ledgerEvent.findFirst({ where: { eventKind: 'TRANSFER_RECEIVED', status: 'POSTED', createdAt: { gte: new Date(Date.now() - 30000) }, journalEntryId: { not: null } }, orderBy: { createdAt: 'desc' } }));
      const entry = arrive ? await c.entryOf(arrive.journalEntryId) : null;
      expectEntry(ok, 'on arrival', entry, { 1200: value, 1300: -value });
      ok('the stock value is now at the receiving branch', entry?.lines.some((x) => x.account.code === '1200' && x.locationId === to.id && x.coilId === l.coilId));
    });

    await S(G, `${at}: six sales are dispatched at the same moment and every one posts once`, { expect: 'six invoices and six cost-of-goods entries, none missing, none twice, with six different entry numbers', db: 'one POSTED event per invoice and per shipment movement', fin: 'receivables rise by the sum of the six invoices' }, async (ok) => {
      const docks = []; for (let i = 0; i < 6; i++) docks.push(await onDock(b, 200 + 10 * i, { lotLb: 1500 }));
      const rs = await Promise.all(docks.map((d) => d.shipper.put(`/api/shipments/${d.shipment.id}/dispatch`, {})));
      ok('all six left', rs.every((r) => r.status === 200 && r.body.invoice?.id), `${statuses(rs)} ${err(rs.find((r) => r.status !== 200) || {})}`);
      const ids = rs.map((r) => r.body.invoice?.id).filter(Boolean);
      const ev = await eventsOf('Invoice', ids);
      ok('six invoice postings', ev.length === 6 && ev.every((e) => e.status === 'POSTED'), ev.map((e) => e.status).join(','));
      const entries = await prisma.journalEntry.findMany({ where: { id: { in: ev.map((e) => e.journalEntryId) } }, include: { lines: { include: { account: true } } } });
      ok('six different entry numbers', new Set(entries.map((e) => e.entryNumber)).size === 6);
      const total = (await prisma.invoice.findMany({ where: { id: { in: ids } } })).reduce((a, i) => a + Number(i.totalAmount), 0);
      ok('receivables rose by the six totals', near(entries.reduce((a, e) => a + (nets(e)['1100'] || 0), 0), total), `${total}`);
      const mvs = await prisma.materialMovement.findMany({ where: { shipmentId: { in: docks.map((d) => d.shipment.id) }, movementType: 'SHIP' } });
      ok('six cost-of-goods postings', (await eventsOf('MaterialMovement', mvs.map((m) => m.id))).filter((e) => e.status === 'POSTED').length === 6);
    });

    await S(G, `${at}: the receivables of one customer in the books equal that customer's open invoices`, { expect: 'the books and the invoice records give the same figure for the customer', fin: 'no difference for the customer', audit: 'receivables report read by the CFO' }, async (ok) => {
      const cust = b.customers[2] || b.customers[0];
      const s = await sold(b, 400, { customer: cust }); await payBy(teller(), s.invoice.id, r2(s.total / 4));
      const rep = await cfo.get('/api/ledger/reports/receivables');
      ok('the report was read', rep.status === 200, rep.status);
      const row = rep.body.customers.find((x) => x.customerId === cust.id);
      const open = await prisma.invoice.findMany({ where: { order: { buyerId: cust.id }, status: { notIn: ['CANCELLED', 'DRAFT'] } } });
      const owed = open.reduce((a, i) => a + (i.kind === 'CREDIT' ? -1 : 1) * Math.abs(Number(i.totalAmount) - Number(i.paidAmount)), 0);
      ok('the customer is on the report', !!row, 'not listed');
      ok('the report agrees with the invoices', row && near(Number(row.ledger), owed, 0.011) && near(Number(row.owed) - Number(row.creditOwedBack || 0), owed, 0.011), `${JSON.stringify(row).slice(0, 200)} vs ${owed}`);
      ok('the report shows no difference for anyone', Number(rep.body.differences) === 0 && near(rep.body.totals.difference, 0), JSON.stringify(rep.body.totals));
    });
  }

  // ── the books as a whole ───────────────────────────────────────────────────────────────────
  await S(G, 'One draft entry is posted by four requests at the same moment', { expect: 'posted once', db: 'JournalEntry POSTED, one entry number', fin }, async (ok) => {
    const d = await draftBy(cfo, 41.17, 'P11 scenario: four posts at once');
    const rs = await all(4, () => cfo2.post(`/api/ledger/entries/${d.body.id}/post`));
    ok('one post went through and none is a server error', count(rs, 200) === 1 && rs.every((r) => r.status < 500), statuses(rs));
    const e = await prisma.journalEntry.findUnique({ where: { id: d.body.id }, include: { lines: true } });
    ok('posted with two lines', e.status === 'POSTED' && e.lines.length === 2);
  });

  await S(G, 'The person who wrote an entry cannot post it, on any server copy', { expect: '403 SAME_PERSON every time', sec: 'two people for every manual entry', fin }, async (ok) => {
    const d = await draftBy(cfo, 12, 'P11 scenario: own post');
    const rs = await all(6, () => cfo.post(`/api/ledger/entries/${d.body.id}/post`));
    ok('refused every time', rs.every((r) => r.status === 403 && r.body.code === 'SAME_PERSON'), statuses(rs));
    ok('more than one server copy answered when several run', c.copies < 2 || new Set(rs.map((r) => r.headers?.get('x-qa-instance'))).size > 1);
    await cfo.call('DELETE', `/api/ledger/entries/${d.body.id}`);
  });

  await S(G, 'A posted entry is reversed by four requests at the same moment', { expect: 'one reversal', db: 'one entry that reverses it', fin: 'the books move back once' }, async (ok) => {
    const e = await postedEntry(77.31, 'P11 scenario: reversed by four');
    const rs = await all(4, (i) => (i % 2 ? cfo : cfo2).post(`/api/ledger/entries/${e.id}/reverse`, { reason: 'P11 scenario: reversed by four at once' }));
    ok('one reversal, the rest refused', count(rs, 201) === 1 && rs.every((r) => [201, 409].includes(r.status)), statuses(rs));
    ok('one reversing entry', (await prisma.journalEntry.count({ where: { reversesEntryId: e.id } })) === 1);
  });

  await S(G, 'Forty manual entries are written and posted at the same moment', { expect: 'forty posted entries with forty different numbers, every one balanced', db: 'JournalEntry numbers unique', fin }, async (ok) => {
    const ds = await all(40, (i) => draftBy(cfo, 10 + i, `P11 scenario: forty at once ${i}`, E.branches[i % E.branches.length]));
    ok('all forty drafts saved', ds.every((d) => d.status === 201), statuses(ds));
    const ps = await Promise.all(ds.map((d) => cfo2.post(`/api/ledger/entries/${d.body.id}/post`)));
    ok('all forty posted', ps.every((p) => p.status === 200), `${statuses(ps)} ${err(ps.find((p) => p.status !== 200) || {})}`);
    const es = await prisma.journalEntry.findMany({ where: { id: { in: ds.map((d) => d.body.id) } } });
    ok('forty different entry numbers', new Set(es.map((e) => e.entryNumber)).size === 40);
    ok('every entry balances', es.every((e) => e.status === 'POSTED') && (await unbalancedPosted()) === 0);
  });

  await S(G, 'Eighty branches each post an entry at the same moment', { expect: 'eighty entries, each tagged with its own branch', db: 'JournalLine.locationId of each entry is its branch', fin }, async (ok) => {
    const ds = await Promise.all(E.branches.map((b, i) => draftBy(i % 2 ? cfo : cfo2, 5 + i, `P11 scenario: branch accrual ${b.code}`, b)));
    const ps = await Promise.all(ds.map((d, i) => (i % 2 ? cfo2 : cfo).post(`/api/ledger/entries/${d.body?.id}/post`)));
    ok('eighty posted', ps.filter((p) => p.status === 200).length === E.branches.length, `${statuses(ps).slice(0, 80)} ${err(ps.find((p) => p.status !== 200) || {})}`);
    const lines = await prisma.journalLine.findMany({ where: { entryId: { in: ds.map((d) => d.body.id) } } });
    const byEntry = new Map(ds.map((d, i) => [d.body.id, E.branches[i].id]));
    ok('every line carries the branch of its entry', lines.length === 160 && lines.every((l) => l.locationId === byEntry.get(l.entryId)));
  });

  await S(G, 'The trial balance is read twelve times while thirty entries are being posted', { expect: 'every reading balances', fin: 'a reader never sees half an entry' }, async (ok) => {
    const ds = await all(30, (i) => draftBy(cfo, 3 + i, `P11 scenario: read while posting ${i}`));
    const [reads] = await Promise.all([all(12, async (i) => { await sleep(i * 15); return auditor.get('/api/ledger/reports/trial-balance'); }), Promise.all(ds.map((d) => cfo2.post(`/api/ledger/entries/${d.body.id}/post`)))]);
    ok('every reading answered', reads.every((r) => r.status === 200), statuses(reads));
    ok('every reading balances', reads.every((r) => r.body.balanced === true && near(r.body.totals?.debit, r.body.totals?.credit)), JSON.stringify(reads.find((r) => !r.body.balanced)?.body?.totals));
  });

  await S(G, 'The month still running is closed by four requests at the same moment', { expect: 'refused every time; the month stays open', db: 'LedgerPeriod OPEN' }, async (ok) => {
    const now = new Date(); const [y, m] = [now.getUTCFullYear(), now.getUTCMonth() + 1];
    const rs = await all(4, () => cfo.post(`/api/ledger/periods/${y}/${m}/close`));
    ok('refused every time', rs.every((r) => r.status === 409), statuses(rs));
    ok('still open', (await prisma.ledgerPeriod.findUnique({ where: { year_month: { year: y, month: m } } })).status === 'OPEN');
  });

  await S(G, 'Last month is closed by four requests at the same moment, and an entry dated in it is refused', { expect: 'closed once; nothing is written into it', db: 'LedgerPeriod CLOSED with one closer', audit: 'one LEDGER_PERIOD_CLOSED for this close' }, async (ok) => {
    const now = new Date(); const last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0)); const [y, m] = [last.getUTCFullYear(), last.getUTCMonth() + 1];
    const p0 = await prisma.ledgerPeriod.findUnique({ where: { year_month: { year: y, month: m } } });
    if (p0?.status === 'CLOSED') { const other = p0.closedById === cfo.user.id ? cfo2 : cfo; const ro = await other.post(`/api/ledger/periods/${y}/${m}/reopen`, { reason: 'P11 scenario: reopened to test the close under load' }); ok('reopened by a different person first', ro.status === 200, `${ro.status} ${err(ro)}`); }
    const since = new Date();
    const rs = await all(4, (i) => (i % 2 ? cfo : cfo2).post(`/api/ledger/periods/${y}/${m}/close`));
    ok('closed once, the rest refused', count(rs, 200) === 1 && rs.every((r) => [200, 409].includes(r.status)), `${statuses(rs)} ${err(rs.find((r) => r.status >= 400) || {})}`);
    ok('one close in the audit trail', (await prisma.auditLog.count({ where: { eventType: 'LEDGER_PERIOD_CLOSED', timestamp: { gte: since } } })) === 1);
    const before = await prisma.journalEntry.count();
    const d = await cfo.post('/api/ledger/entries', { entryDate: last.toISOString().slice(0, 10), memo: 'P11 scenario: into a closed month', lines: [D('5200', 1), C('2200', 1)] });
    ok('an entry dated in it is refused', d.status === 409, `${d.status} ${err(d)}`);
    ok('nothing was saved', (await prisma.journalEntry.count()) === before);
  });

  await S(G, 'Two exports for the accountant are made at the same moment', { expect: 'no entry is in two batches; the file\'s debits equal its credits; nothing is sent anywhere', db: 'LedgerExportItem unique per entry and provider', fin: 'the export is a file; no outside book is touched', sec: 'nothing leaves the QA machine' }, async (ok) => {
    const accounts = (await cfo.get('/api/ledger/external-accounts/GENERIC')).body.accounts;
    for (const a of accounts.filter((x) => !x.externalAccount)) await cfo.put(`/api/ledger/external-accounts/GENERIC/${a.code}`, { externalAccount: `EXT-${a.code}` });
    await postedEntry(9.99, 'P11 scenario: for two exports at once');
    const rs = await all(2, () => cfo.post('/api/ledger/exports', { provider: 'GENERIC', from: today(), to: today() }));
    ok('no server error', rs.every((r) => r.status < 500), `${statuses(rs)} ${err(rs.find((r) => r.status >= 500) || {})}`);
    ok('at least one batch was made', count(rs, 201) >= 1, `${statuses(rs)} ${err(rs[0])}`);
    const dup = await prisma.$queryRawUnsafe('SELECT count(*)::int AS n FROM (SELECT "entryId" FROM "LedgerExportItem" WHERE provider = \'GENERIC\' GROUP BY "entryId", provider HAVING count(*) > 1) x');
    ok('no entry is in two batches', dup[0].n === 0, dup[0].n);
    const made = rs.find((r) => r.status === 201).body;
    const file = (await auditor.get(`/api/ledger/exports/${made.id}/file`)).body;
    ok('the file totals balance', Number(file.totalDebit) > 0 && near(file.totalDebit, (await prisma.$queryRawUnsafe('SELECT coalesce(sum(e."totalDebit"), 0)::float8 AS n FROM "JournalEntry" e JOIN "LedgerExportItem" i ON i."entryId" = e.id WHERE i."batchId" = $1', made.id))[0].n), `${file.totalDebit}`);
    ok('the file says it is not validated for any accounting product', /has not been validated/.test(file.content || ''));
    exportBatch = made.id;
  });

  await S(G, 'An export the accountant\'s system rejected is marked failed, withdrawn, and made again', { expect: 'a failed batch keeps its entries; a withdrawn batch frees them; the next export carries them', db: 'LedgerExportBatch FAILED then VOID; a new batch GENERATED', rec: 'the same entries are exported again exactly once', fin: 'no entry is lost from the export or exported twice' }, async (ok) => {
    const id = exportBatch; ok('there is a batch from the scenario before', !!id);
    const f = await cfo.post(`/api/ledger/exports/${id}/settle`, { status: 'FAILED', error: 'P11 scenario: the import rejected line 14' });
    ok('marked failed with its reason', f.status === 200 && f.body.status === 'FAILED', `${f.status} ${err(f)}`);
    const held = await cfo.post('/api/ledger/exports', { provider: 'GENERIC', from: today(), to: today() });
    const fresh = held.status === 201 ? held.body.entryCount : 0;
    ok('its entries stay held while it is failed', held.status === 409 || fresh < f.body.entryCount, `${held.status} ${fresh}`);
    const v = await cfo.post(`/api/ledger/exports/${id}/settle`, { status: 'VOID', error: 'P11 scenario: withdrawn to rebuild' });
    ok('withdrawn', v.status === 200 && v.body.status === 'VOID', `${v.status} ${err(v)}`);
    const again = await cfo.post('/api/ledger/exports', { provider: 'GENERIC', from: today(), to: today() });
    ok('the next export carries the freed entries', again.status === 201 && again.body.entryCount >= f.body.entryCount, `${again.status} ${again.body?.entryCount} vs ${f.body.entryCount} ${err(again)}`);
  });

  await S(G, 'The reconciliation is run four times at the same moment', { expect: 'four runs, the same figures, every check agrees', db: 'four LedgerReconciliation rows', fin: 'no entry is made by reconciling' }, async (ok) => {
    const before = await prisma.journalEntry.count();
    const rs = await all(4, () => cfo.post('/api/ledger/reconciliations'));
    ok('all four ran', rs.every((r) => r.status === 201), statuses(rs));
    ok('all four passed', rs.every((r) => r.body.passed === true), JSON.stringify(rs.find((r) => !r.body.passed)?.body?.failing));
    ok('the same figures in each', new Set(rs.map((r) => r.body.checks.map((x) => `${x.key}:${x.ledger}:${x.records}`).join('|'))).size === 1);
    ok('no entry was made', (await prisma.journalEntry.count()) === before);
  });

  await S(G, 'The books are reconciled while twenty sales are being shipped and paid', { expect: 'debits equal credits in every run; once the work stops every figure agrees', fin: 'a run never reports a half-posted event as a balance error' }, async (ok) => {
    const b = await branch('LARGE', 5); const docks = []; for (let i = 0; i < 20; i++) docks.push(await onDock(b, 100 + i, { lotLb: 1300 }));
    const work = Promise.all(docks.map(async (d) => { const r = await d.shipper.put(`/api/shipments/${d.shipment.id}/dispatch`, {}); if (r.body?.invoice?.id) await payBy(P.csr(b), r.body.invoice.id, 10); return r; }));
    const runs = await all(5, async (i) => { await sleep(i * 120); return reconcile(cfo); });
    const rs = await work;
    ok('all twenty left', rs.every((r) => r.status === 200), `${statuses(rs)} ${err(rs.find((r) => r.status !== 200) || {})}`);
    ok('debits equal credits in every run', runs.every((r) => r.of('BOOKS_BALANCE')?.status === 'MATCH'), runs.map((r) => r.of('BOOKS_BALANCE')?.status).join(','));
    await agrees(ok, 'afterwards');
  });

  await S(G, 'A stock record changed outside the product is named as a difference and is not adjusted away', { init: 'One item\'s quantity on hand is raised by 100 lb directly in the QA database, as a fault would', expect: 'the reconciliation names the item and the amount, makes no entry, and agrees again once the record is put right', fin: 'the unexplained difference is reported as it is: 100 lb at the item\'s cost', rec: 'the record is corrected at its source; the books were never changed', audit: 'the failed reconciliation run is stored' }, async (ok) => {
    const b = await branch('MEDIUM', 9); const l = await lot(b, 1000); const value = r2(100 * l.cost);
    await agrees(ok, 'before');
    const entries = await prisma.journalEntry.count();
    await prisma.inventory.update({ where: { coilId: l.coilId }, data: { qtyOnHand: { increment: 100 }, qtyAvailable: { increment: 100 } } });
    try {
      const r = await reconcile(cfo); const x = r.of('INVENTORY');
      ok('the stock check no longer agrees', x?.status !== 'MATCH' && r.passed === false, x?.status);
      ok('the difference is 100 lb at cost', near(Math.abs(Number(x.difference)), value), `${x.difference} vs ${value}`);
      ok('the item is named', JSON.stringify(x.detail).includes(l.coilId) || JSON.stringify(x.detail).includes(String(l.coilNumber || '~')), JSON.stringify(x.detail).slice(0, 200));
      ok('no entry was made to hide it', (await prisma.journalEntry.count()) === entries);
      ok('the failed run is stored', (await prisma.ledgerReconciliation.findUnique({ where: { id: r.id } }))?.passed === false);
    } finally { await prisma.inventory.update({ where: { coilId: l.coilId }, data: { qtyOnHand: { decrement: 100 }, qtyAvailable: { decrement: 100 } } }); }
    await agrees(ok, 'after the record is put right');
  });

  await S(G, 'A posting rule that loses its approval stops posting; the payment is kept, held by name, and posts once when approved', { init: 'The cash mapping is changed by a CFO, which removes the accountant\'s approval', expect: 'the payment is saved; its event fails with the reason; nothing is posted until the approval is recorded; then it posts once', fin: 'cash and receivables move once, after approval', rec: 'retry posts the held event; a second retry posts nothing more', sec: 'an unapproved posting rule is never used' }, async (ok) => {
    const b = await branch('SMALL', 11); const s = await sold(b, 200);
    const ch = await cfo.put('/api/ledger/mappings/CASH_CLEARING', { accountCode: '2250' });
    let e;
    try {
      ok('changing the mapping removes its approval', ch.status === 200 && ch.body.approvedAt === null, `${ch.status} ${err(ch)}`);
      const p = await payBy(P.csr(b) || P.manager(b), s.invoice.id, 40);
      ok('the payment was saved', p.status === 201, `${p.status} ${err(p)}`);
      const pay = (await payments(s.invoice.id))[0];
      e = await eventOf('PAYMENT_RECORDED', 'Payment', pay.id);
      ok('the event failed and says why', e.status === 'FAILED' && /not approved/.test(e.reason), `${e.status} ${e.reason}`);
      ok('nothing was posted for it', !e.journalEntryId);
      ok('a retry while unapproved fails again', (await cfo.post(`/api/ledger/events/${e.id}/retry`)).body.status === 'FAILED');
    } finally {
      await cfo.put('/api/ledger/mappings/CASH_CLEARING', { accountCode: '1000' });
      await cfo.post('/api/ledger/approvals', { mappings: ['CASH_CLEARING'], approvedBy: 'QA Synthetic Accountant (test data only)' });
    }
    const rs = await all(3, () => cfo.post(`/api/ledger/events/${e.id}/retry`));
    ok('no retry is a server error', rs.every((r) => r.status < 500), statuses(rs));
    const after = await prisma.ledgerEvent.findUnique({ where: { id: e.id } });
    ok('posted once after approval', after.status === 'POSTED' && (await prisma.journalEntry.count({ where: { sourceType: 'Payment', sourceId: e.sourceId } })) === 1, after.status);
    expectEntry(ok, 'the payment', await c.entryOf(after.journalEntryId), { 1000: 40, 1100: -40 });
  });

  await S(G, 'The search for business records with no posting is run three times at the same moment', { expect: 'nothing is found and nothing is posted twice', db: 'one LedgerEvent per source and kind' }, async (ok) => {
    const before = await prisma.journalEntry.count();
    const rs = await all(3, () => cfo.post('/api/ledger/events/record-missing', {}));
    ok('all three answered', rs.every((r) => r.status === 200), `${statuses(rs)} ${err(rs.find((r) => r.status !== 200) || {})}`);
    ok('nothing was missing', rs.every((r) => Number(r.body.found) === 0), rs.map((r) => r.body.found).join(','));
    ok('no entry was added', (await prisma.journalEntry.count()) === before);
  });

  await S(G, 'The application\'s own database role cannot change or remove a posted entry, even under load', { expect: 'the database refuses the change', sec: 'posted entries are immutable for the application\'s role', db: 'JournalLine and JournalEntry unchanged' }, async (ok) => {
    const e = await postedEntry(15, 'P11 scenario: immutable');
    const work = all(10, (i) => draftBy(cfo, 2 + i, `P11 scenario: load beside the attempt ${i}`).then((d) => cfo2.post(`/api/ledger/entries/${d.body.id}/post`)));
    const up = await asRuntimeRolledBack('UPDATE "JournalLine" SET debit = debit + 1 WHERE "entryId" = $1 AND debit > 0', [e.id]);
    const del = await asRuntimeRolledBack('DELETE FROM "JournalEntry" WHERE id = $1', [e.id]);
    const add = await asRuntimeRolledBack('INSERT INTO "JournalLine" (id, "entryId", "lineNumber", "accountId", debit, credit) SELECT gen_random_uuid()::text, "entryId", 99, "accountId", 1, 0 FROM "JournalLine" WHERE "entryId" = $1 LIMIT 1', [e.id]);
    await work;
    ok('an update is refused', !up.ok, up.error || 'allowed');
    ok('a delete is refused', !del.ok, del.error || 'allowed');
    ok('a line cannot be added', !add.ok, add.error || 'allowed');
    const now = await prisma.journalEntry.findUnique({ where: { id: e.id }, include: { lines: true } });
    ok('the entry is as it was', now.status === 'POSTED' && now.lines.length === 2 && near(now.totalDebit, 15));
  });

  await S(G, 'After all of this, every posted entry in the books still holds the rules', { expect: 'no unbalanced entry, no repeated entry number, no posted event without its entry, no entry posted twice for one event', db: 'counts of zero across the whole journal', fin: 'the journal is whole' }, async (ok) => {
    const q = async (sql) => (await prisma.$queryRawUnsafe(sql))[0].n;
    ok('no posted entry is out of balance', (await unbalancedPosted()) === 0);
    ok('no entry number is used twice', (await q('SELECT count(*)::int AS n FROM (SELECT "entryNumber" FROM "JournalEntry" GROUP BY "entryNumber" HAVING count(*) > 1) x')) === 0);
    ok('every posted event has its entry', (await q('SELECT count(*)::int AS n FROM "LedgerEvent" e WHERE e.status = \'POSTED\' AND NOT EXISTS (SELECT 1 FROM "JournalEntry" j WHERE j.id = e."journalEntryId" AND j.status IN (\'POSTED\',\'REVERSED\'))')) === 0);
    ok('no entry is claimed by two events', (await q('SELECT count(*)::int AS n FROM (SELECT "journalEntryId" FROM "LedgerEvent" WHERE "journalEntryId" IS NOT NULL GROUP BY "journalEntryId" HAVING count(*) > 1) x')) === 0);
    ok('no event is left failed, pending or held', (await c.openEvents()) === 0, await c.openEvents());
    await agrees(ok, 'the whole books');
  });

  await S(G, 'The finance reports agree with the reconciliation', { expect: 'receivables and stock value on the reports equal the reconciliation\'s figures; the exceptions list is empty', fin: 'one set of figures, whichever screen reads them' }, async (ok) => {
    const r = await reconcile(cfo);
    const rec = await cfo.get('/api/ledger/reports/receivables'); const invr = await cfo.get('/api/ledger/reports/inventory'); const exc = await cfo.get('/api/ledger/reports/exceptions');
    const rev = await cfo.get('/api/ledger/reports/revenue?by=branch'); const mon = await cfo.get(`/api/ledger/reports/monthly?year=${new Date().getUTCFullYear()}&month=${new Date().getUTCMonth() + 1}`);
    ok('every report answered', [rec, invr, exc, rev, mon].every((x) => x.status === 200), [rec, invr, exc, rev, mon].map((x) => x.status).join(','));
    ok('receivables on the report equal the reconciliation', near(rec.body.totals.ledger, r.of('RECEIVABLES').ledger) && near(rec.body.totals.records, r.of('RECEIVABLES').records), `${JSON.stringify(rec.body.totals)} vs ${r.of('RECEIVABLES').ledger}`);
    ok('the exceptions list is empty', exc.body.open === 0, exc.body.open);
    const net = rev.body.rows.reduce((a, x) => a + Number(x.net), 0);
    ok('revenue is reported branch by branch and is positive', rev.body.rows.length >= 5 && net > 0, `${rev.body.rows.length} rows, ${net}`);
  });
}
