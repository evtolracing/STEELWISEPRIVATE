// Group 6: periods, cutover and reporting (the cutover itself is in g0-before.mjs).
export default async function books(ctx, state) {
  const { scenario, G, prisma, A, cfo, cfo2, owner, auditor, exec, admin2, sales, L1, near, err, tag, num, posted, eventOf, movement, pay, draft, D, C } = ctx;
  const S = (name, fn) => scenario(G.books, name, fn);
  const now = new Date();
  const lastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 15));
  const [Y, M] = [lastMonth.getUTCFullYear(), lastMonth.getUTCMonth() + 1];
  const lastDay = lastMonth.toISOString().slice(0, 10);
  const check = async (key, who = cfo) => { const r = await who.post('/api/ledger/reconciliations'); return { ...r.body.checks.find((c) => c.key === key), run: r.body }; };
  const sql = async (text, ...args) => { try { await prisma.$executeRawUnsafe(text, ...args); return null; } catch (e) { return String(e.message); } };
  const period = () => prisma.ledgerPeriod.findUnique({ where: { year_month: { year: Y, month: M } } });
  const sum = async (where) => Number((await prisma.$queryRawUnsafe(`SELECT COALESCE(SUM(l."debit" - l."credit"), 0)::float AS v FROM "JournalLine" l JOIN "JournalEntry" e ON e."id" = l."entryId" JOIN "LedgerAccount" a ON a."id" = l."accountId" WHERE e."status" = 'POSTED' AND ${where}`))[0].v);

  await S('An invoice from before the books began is cancelled: nothing is posted, the books show the difference, and the accountant settles it with a named adjustment', async (ok) => {
    const inv = state.pre.toCancel.invoice;
    const m = await movement(() => A.post(`/api/invoices/${inv.id}/cancel`, { reason: 'Billed in error before the books began' }, 'admin'));
    ok('cancelled', m.out.status === 200, `${m.out.status} ${err(m.out)}`);
    ok('nothing was posted', Object.keys(m.delta).length === 0, JSON.stringify(m.delta));
    const event = await eventOf('INVOICE_ISSUED_UNDONE', 'Invoice', inv.id);
    ok('an exception is held for the accountant, saying why', event?.status === 'RECONCILIATION_REQUIRED' && /before the books began/.test(event.reason) && /opening balances include it/.test(event.reason), `${event?.status} ${event?.reason}`);
    const ar = await check('RECEIVABLES');
    ok('the receivables check shows the 100.00 the books still carry', ar.status === 'DIFFERENCE' && near(ar.difference, 100), `${ar.status} ${ar.difference}`);
    const buyer = (await prisma.order.findUnique({ where: { id: inv.orderId }, select: { buyerId: true } })).buyerId;
    const lines = [D('3000', 100), C('1100', 100, { customerId: buyer, locationId: L1.id })];
    ok('an administrator cannot adjust a control account', (await admin2.post('/api/ledger/entries', { entryDate: ctx.today(), memo: 'Opening receivable cancelled', lines, adjustControlAccount: true })).status === 403);
    ok('without the named permission the CFO\'s draft is refused too', (await draft(lines)).body?.code === 'CONTROL_ACCOUNT');
    const d = await draft(lines, { memo: 'Opening receivable cancelled after cutover', extra: { adjustControlAccount: true } });
    ok('with it the draft is saved', d.status === 201, `${d.status} ${err(d)}`);
    const p = await cfo2.post(`/api/ledger/entries/${d.body.id}/post`);
    ok('and a second person posts it', p.status === 200 && p.body.status === 'POSTED', `${p.status} ${err(p)}`);
    ok('settling needs a note', (await cfo.post(`/api/ledger/events/${event.id}/resolve`, { note: 'ok' })).status === 400);
    ok('settling cannot name an entry that is not posted', (await cfo.post(`/api/ledger/events/${event.id}/resolve`, { note: 'Adjusted against opening equity', entryNumber: 'JE-99999999' })).status === 400);
    const r = await cfo.post(`/api/ledger/events/${event.id}/resolve`, { note: 'Adjusted against opening equity', entryNumber: p.body.entryNumber });
    ok('settled, naming the entry', r.status === 200 && r.body.status === 'NOT_POSTED' && r.body.reason.includes(p.body.entryNumber), `${r.status} ${err(r)}`);
    ok('receivables agree again', (await check('RECEIVABLES')).status === 'MATCH');
    ok('a settled event cannot be posted afterwards', (await cfo.post(`/api/ledger/events/${event.id}/retry`)).status === 409);
  });

  await S('Closing a month: the current month is refused, an open draft blocks it, then it closes and says who closed it', async (ok) => {
    const d1 = await draft([D('5100', 50), C('2200', 50)], { entryDate: lastDay, memo: 'Accrual for last month (QA)' });
    ok('a draft dated last month is saved', d1.status === 201 && d1.body.entryDate === lastDay, `${d1.status} ${err(d1)}`);
    ok('it is posted by a second person, dated last month', (await cfo2.post(`/api/ledger/entries/${d1.body.id}/post`)).body.period === `${Y}-${String(M).padStart(2, '0')}`);
    const d2 = await draft([D('5100', 5), C('2200', 5)], { entryDate: lastDay, memo: 'Left as a draft (QA)' });
    const cur = await cfo.post(`/api/ledger/periods/${now.getUTCFullYear()}/${now.getUTCMonth() + 1}/close`);
    ok('the month still running cannot be closed', cur.status === 409 && /last day has passed/.test(err(cur)), `${cur.status} ${err(cur)}`);
    const blocked = await cfo.post(`/api/ledger/periods/${Y}/${M}/close`);
    ok('an open draft blocks the close', blocked.status === 409 && blocked.body.code === 'DRAFTS_OPEN', `${blocked.status} ${err(blocked)}`);
    ok('the draft is deleted', (await cfo.del(`/api/ledger/entries/${d2.body.id}`)).status === 200);
    ok('an auditor and an executive cannot close', (await auditor.post(`/api/ledger/periods/${Y}/${M}/close`)).status === 403 && (await exec.post(`/api/ledger/periods/${Y}/${M}/close`)).status === 403);
    ok('a month that does not exist is refused', (await cfo.post(`/api/ledger/periods/${Y}/13/close`)).status === 400);
    const c = await cfo.post(`/api/ledger/periods/${Y}/${M}/close`);
    ok('closed', c.status === 200 && c.body.status === 'CLOSED' && c.body.closedById === cfo.user.id, `${c.status} ${err(c)}`);
    ok('closing twice is refused', (await cfo.post(`/api/ledger/periods/${Y}/${M}/close`)).status === 409);
    ok('the close is in the audit log', (await ctx.auditsOf('LEDGER_PERIOD_CLOSED')).some((a) => a.userId === cfo.user.id && a.details.month === M));
    const list = (await auditor.get('/api/ledger/periods')).body.periods.find((p) => p.year === Y && p.month === M);
    ok('the period list shows it closed with its posted entries', list?.status === 'CLOSED' && list.posted >= 1 && list.drafts === 0, JSON.stringify(list));
  });

  await S('A payment dated in the closed month is saved and held; it is never moved to another month without a person choosing the date', async (ok) => {
    const r = await ctx.shipped(300, { price: 0.5 });
    const m = await movement(() => pay(r.invoice.id, 60, { paymentDate: lastMonth.toISOString() }));
    ok('the payment itself was saved', m.out.status === 201 || m.out.status === 200, `${m.out.status} ${err(m.out)}`);
    ok('nothing was posted', Object.keys(m.delta).length === 0, JSON.stringify(m.delta));
    const p = await ctx.lastPayment(r.invoice.id);
    const event = await eventOf('PAYMENT_RECORDED', 'Payment', p.id);
    ok('held: the period is closed', event?.status === 'RECONCILIATION_REQUIRED' && /closed/.test(event.reason) && /not moved to another period/.test(event.reason), `${event?.status} ${event?.reason}`);
    const pmt = await check('PAYMENTS');
    ok('the reconciliation shows the 60.00 not yet in the books', pmt.status === 'DIFFERENCE' && near(pmt.difference, -60), `${pmt.status} ${pmt.difference}`);
    const again = await cfo.post(`/api/ledger/events/${event.id}/retry`);
    ok('posting it again without a date holds it again', again.status === 200 && again.body.status === 'RECONCILIATION_REQUIRED', `${again.status} ${again.body?.status}`);
    const dated = await movement(() => cfo.post(`/api/ledger/events/${event.id}/retry`, { postingDate: ctx.today() }));
    ok('with a date chosen by the CFO it posts in the open month', dated.out.status === 200 && dated.out.body.status === 'POSTED' && near(dated.delta['1000'], 60) && near(dated.delta['1100'], -60), `${dated.out.status} ${JSON.stringify(dated.delta)}`);
    const entry = (await posted('PAYMENT_RECORDED', 'Payment', p.id)).entry;
    ok('the entry is dated today and written by the retry service on the CFO\'s order', entry.entryDate.toISOString().slice(0, 10) === ctx.today() && entry.createdById === cfo.user.id);
    ok('the retry is in the audit log with the date chosen', (await ctx.auditsOf('LEDGER_EVENT_RETRIED')).some((a) => a.resourceId === event.id && a.details.postingDate === ctx.today()));
    ok('payments agree again', (await check('PAYMENTS')).status === 'MATCH');
    state.heldSale = r;
  });

  await S('Nothing can be written into a closed month: not by the screen, not by a second person, not by direct SQL', async (ok) => {
    const d = await draft([D('5100', 20), C('2200', 20)], { entryDate: lastDay, memo: 'Backdated into a closed month (QA)' });
    ok('a draft dated in the closed month is refused', d.status === 409 && d.body.code === 'PERIOD_CLOSED', `${d.status} ${err(d)}`);
    const p = await period();
    const posts = await prisma.journalEntry.findFirst({ where: { periodId: p.id, status: 'POSTED' } });
    const open = await prisma.journalEntry.findFirst({ where: { status: 'POSTED', period: { status: 'OPEN' } }, include: { lines: true } });
    // A draft placed in the closed month by direct SQL (the screen cannot make one) cannot be posted either.
    const id = tag('qa-je'); const number = tag('JE-QA');
    ok('SQL can only write a draft', /LEDGER_DRAFT_FIRST/.test(await sql(`INSERT INTO "JournalEntry" ("id","entryNumber","entryDate","periodId","status","kind") VALUES ($1,$2,$3::date,$4,'POSTED','MANUAL')`, id, number, lastDay, p.id) || ''));
    ok('the draft row goes in', (await sql(`INSERT INTO "JournalEntry" ("id","entryNumber","entryDate","periodId","status","kind") VALUES ($1,$2,$3::date,$4,'DRAFT','MANUAL')`, id, number, lastDay, p.id)) === null);
    for (const [i, l] of open.lines.slice(0, 2).entries()) await sql(`INSERT INTO "JournalLine" ("id","entryId","lineNumber","accountId","debit","credit") VALUES ($1,$2,$3,$4,$5,$6)`, tag('qa-jl'), id, i + 1, l.accountId, i === 0 ? 10 : 0, i === 0 ? 0 : 10);
    const refused = await sql(`UPDATE "JournalEntry" SET "status" = 'POSTED' WHERE "id" = $1`, id);
    ok('posting it by SQL is refused by the database', /LEDGER_PERIOD_CLOSED/.test(refused || ''), refused);
    ok('and through the screen', (await cfo2.post(`/api/ledger/entries/${id}/post`)).body?.code === 'PERIOD_CLOSED');
    await prisma.journalEntry.delete({ where: { id } });
    ok('an entry of the closed month cannot be re-dated or moved by SQL', /LEDGER_IMMUTABLE/.test(await sql(`UPDATE "JournalEntry" SET "entryDate" = now()::date WHERE "id" = $1`, posts.id) || ''));
    ok('an open-month entry cannot be moved into the closed month', /LEDGER_IMMUTABLE/.test(await sql(`UPDATE "JournalEntry" SET "periodId" = $2 WHERE "id" = $1`, open.id, p.id) || ''));
    const rev = await cfo.post(`/api/ledger/entries/${posts.id}/reverse`, { reason: 'Reversed in the month it was made', entryDate: lastDay });
    ok('a reversal dated in the closed month is refused', rev.status === 409, `${rev.status} ${err(rev)}`);
    state.closedEntry = posts;
  });

  await S('Reopening a closed month needs a reason and a different person; afterwards it takes entries again and is closed again', async (ok) => {
    ok('no reason: refused', (await cfo2.post(`/api/ledger/periods/${Y}/${M}/reopen`, { reason: 'oops' })).status === 400);
    const same = await cfo.post(`/api/ledger/periods/${Y}/${M}/reopen`, { reason: 'Need to add a late accrual' });
    ok('the person who closed it cannot reopen it', same.status === 403 && same.body.code === 'SAME_PERSON', `${same.status} ${err(same)}`);
    ok('an auditor cannot', (await auditor.post(`/api/ledger/periods/${Y}/${M}/reopen`, { reason: 'Need to add a late accrual' })).status === 403);
    ok('still closed', (await period()).status === 'CLOSED');
    const r = await cfo2.post(`/api/ledger/periods/${Y}/${M}/reopen`, { reason: 'Need to add a late accrual' });
    ok('a second person reopens it, with the reason kept', r.status === 200 && r.body.status === 'OPEN' && r.body.reopenReason === 'Need to add a late accrual' && r.body.reopenedById === cfo2.user.id, `${r.status} ${err(r)}`);
    ok('the reopening is in the audit log with the reason', (await ctx.auditsOf('LEDGER_PERIOD_REOPENED')).some((a) => a.userId === cfo2.user.id && /late accrual/.test(a.details.reason)));
    const rev = await cfo.post(`/api/ledger/entries/${state.closedEntry.id}/reverse`, { reason: 'Accrual entered twice', entryDate: lastDay });
    ok('the month takes a reversal again', rev.status === 201 && rev.body.entryDate === lastDay && rev.body.reverses.id === state.closedEntry.id, `${rev.status} ${err(rev)}`);
    ok('an entry is reversed once', (await cfo.post(`/api/ledger/entries/${state.closedEntry.id}/reverse`, { reason: 'Again by mistake' })).status === 409);
    ok('not reopened twice', (await cfo.post(`/api/ledger/periods/${Y}/${M}/reopen`, { reason: 'Need to add a late accrual' })).status === 409);
    ok('closed again', (await cfo2.post(`/api/ledger/periods/${Y}/${M}/close`)).status === 200);
  });

  await S('The trial balance is the sum of the posted lines, as of any day, and drafts are not in it', async (ok) => {
    const t = (await cfo.get('/api/ledger/reports/trial-balance')).body;
    ok('it balances', t.balanced && t.totals.debit === t.totals.credit, JSON.stringify(t.totals));
    for (const code of ['1100', '1200', '2100', '4000', '5000']) { const a = t.accounts.find((x) => x.code === code); ok(`${code} equals the posted lines`, near(Number(a.debit) - Number(a.credit), await sum(`a."code" = '${code}'`)), `${a.debit} ${a.credit}`); }
    const before = (await cfo.get(`/api/ledger/reports/trial-balance?asOf=${lastDay}`)).body;
    ok('as of a day last month it holds only what was dated by then', before.balanced && near(Number(before.totals.debit), Number((await prisma.$queryRawUnsafe(`SELECT COALESCE(SUM(l."debit"), 0)::float AS v FROM "JournalLine" l JOIN "JournalEntry" e ON e."id" = l."entryId" WHERE e."status" = 'POSTED' AND e."entryDate" <= $1::date`, lastDay))[0].v)) && Number(before.totals.debit) < Number(t.totals.debit), JSON.stringify(before.totals));
    const d = await draft([D('5100', 777.77), C('2200', 777.77)], { memo: 'Draft that must not show (QA)' });
    const with1 = (await cfo.get('/api/ledger/reports/trial-balance')).body;
    ok('a draft changes nothing', with1.totals.debit === t.totals.debit);
    await cfo.del(`/api/ledger/entries/${d.body.id}`);
    ok('a date that is not a date is refused', (await cfo.get('/api/ledger/reports/trial-balance?asOf=yesterday')).status === 400);
    ok('a report that does not exist is not found', (await cfo.get('/api/ledger/reports/profit-and-loss')).status === 404);
  });

  await S('General ledger activity for an account: brought forward plus the period equals the closing balance, line by line to its entry', async (ok) => {
    const r = await cfo.get(`/api/ledger/reports/account?code=1100&from=${ctx.today()}&to=${ctx.today()}`);
    ok('read', r.status === 200 && r.body.account.code === '1100', `${r.status} ${err(r)}`);
    ok('brought forward plus debits less credits is the closing balance', near(Number(r.body.broughtForward) + Number(r.body.debit) - Number(r.body.credit), r.body.closing), JSON.stringify({ bf: r.body.broughtForward, d: r.body.debit, c: r.body.credit, close: r.body.closing }));
    ok('the closing balance is the trial balance\'s', near(r.body.closing, (await ctx.balances()).of('1100')));
    ok('brought forward is what was posted before today', near(r.body.broughtForward, await sum(`a."code" = '1100' AND e."entryDate" < '${ctx.today()}'::date`)));
    const line = r.body.lines[0];
    ok('each line names its entry', line && /^JE-/.test(line.entryNumber), JSON.stringify(line));
    ok('an unknown account is not found', (await cfo.get('/api/ledger/reports/account?code=9999')).status === 404);
    ok('the read is in the audit log', (await ctx.auditsOf('LEDGER_REPORT_READ')).some((a) => a.userId === cfo.user.id && a.resourceId === 'account' && a.details.code === '1100'));
  });

  await S('Journal entry detail: an entry shows its lines, its source record, its rule version, who and when, and can be found from the source', async (ok) => {
    const { entry } = await posted('INVOICE_ISSUED', 'Invoice', state.heldSale.invoice.id);
    const r = await auditor.get(`/api/ledger/entries/${entry.id}`);
    ok('read by the auditor', r.status === 200 && r.body.entryNumber === entry.entryNumber, `${r.status}`);
    ok('it names the source invoice and the rule version', r.body.sourceType === 'Invoice' && r.body.sourceId === state.heldSale.invoice.id && r.body.eventKind === 'INVOICE_ISSUED' && Boolean(r.body.ruleVersion));
    ok('the lines balance and carry the customer and branch', r.body.lines.length >= 2 && near(r.body.lines.reduce((s, l) => s + Number(l.debit) - Number(l.credit), 0), 0) && r.body.lines.some((l) => l.customerId && l.locationId === L1.id));
    ok('it shows when it was posted, its period and currency', Boolean(r.body.postedAt) && /^\d{4}-\d{2}$/.test(r.body.period) && r.body.currency === 'USD', `${r.body.period} ${r.body.currency}`);
    const found = await auditor.get(`/api/ledger/entries?sourceId=${state.heldSale.invoice.id}`);
    ok('found from the invoice', found.body.entries.some((e) => e.id === entry.id));
    ok('found by its number', (await auditor.get(`/api/ledger/entries?q=${entry.entryNumber}`)).body.entries.length === 1);
    const rev = await prisma.journalEntry.findFirst({ where: { kind: 'REVERSAL' } });
    const both = (await auditor.get(`/api/ledger/entries/${rev.id}`)).body;
    ok('a reversal links to the entry it reverses, and that entry links back', both.reverses?.id === rev.reversesEntryId && (await auditor.get(`/api/ledger/entries/${rev.reversesEntryId}`)).body.reversedBy?.id === rev.id);
    ok('an entry that does not exist is not found', (await auditor.get('/api/ledger/entries/nope')).status === 404);
    ok('a sales rep cannot read entries', (await sales.get(`/api/ledger/entries/${entry.id}`)).status === 403 && (await sales.get('/api/ledger/entries')).status === 403);
  });

  await S('The monthly statement carries balance-sheet accounts forward, starts income and expense at zero, and does not call itself a P&L', async (ok) => {
    const m = (await cfo.get(`/api/ledger/reports/monthly?year=${now.getUTCFullYear()}&month=${now.getUTCMonth() + 1}`)).body;
    const t = await ctx.balances();
    const of = (code) => m.accounts.find((a) => a.code === code);
    ok('receivables close at the trial balance figure', near(of('1100').closing, t.of('1100')), `${of('1100').closing} vs ${t.of('1100')}`);
    ok('opening plus the month is the closing, for an asset', near(Number(of('1200').opening) + Number(of('1200').debit) - Number(of('1200').credit), of('1200').closing));
    ok('revenue opens the month at zero', Number(of('4000').opening) === 0 && Number(of('4000').closing) > 0);
    ok('it says what it is not', /not a profit and loss statement or a balance sheet/.test(m.note) && m.summary.salesLessExpensesInThisLedger !== undefined && m.summary.netIncome === undefined && m.summary.profit === undefined);
    const last = (await cfo.get(`/api/ledger/reports/monthly?year=${Y}&month=${M}`)).body;
    ok('last month shows as closed', last.period === 'CLOSED', last.period);
    ok('a month with nothing says so', (await cfo.get('/api/ledger/reports/monthly?year=2001&month=1')).body.period === 'NO ENTRIES');
    ok('a bad month is refused', (await cfo.get('/api/ledger/reports/monthly?year=2026&month=0')).status === 400);
  });

  await S('Receivables in the books against the invoices: a record changed outside the product shows as a difference by customer, and nothing is "fixed"', async (ok) => {
    const rep = (await cfo.get('/api/ledger/reports/receivables')).body;
    ok('they agree, customer by customer', rep.differences === 0 && near(rep.totals.difference, 0), JSON.stringify(rep.totals));
    // Its own credit owed back (Phase 10, Y-012): earlier groups may refund or apply every credit they make.
    const paidUp = await ctx.shipped(100, { price: 0.5 });
    await ctx.pay(paidUp.invoice.id, 50);
    const owedBack = await ctx.creditMemo(paidUp.invoice.id, { reason: 'QA credit owed back', amount: 25 });
    const rep2 = (await cfo.get('/api/ledger/reports/receivables')).body;
    ok('credit owed back is shown apart', owedBack.status === 201 && near(Number(rep2.totals.creditOwedBack) - Number(rep.totals.creditOwedBack), 25) && near(Number(rep2.totals.owed) - Number(rep2.totals.creditOwedBack), rep2.totals.records) && rep2.differences === 0, `${owedBack.status} ${JSON.stringify(rep.totals)} -> ${JSON.stringify(rep2.totals)}`);
    const inv = (await ctx.shipped(100, { price: 0.5 })).invoice; // 50.00, unpaid
    const entriesBefore = await prisma.journalEntry.count();
    await prisma.invoice.update({ where: { id: inv.id }, data: { paidAmount: { increment: 11.11 } } });
    try {
      const c = await check('RECEIVABLES');
      ok('the check reports the 11.11 and names the customer', c.status === 'DIFFERENCE' && near(c.difference, 11.11) && c.detail.length === 1 && near(c.detail[0].difference, 11.11), `${c.status} ${c.difference} ${JSON.stringify(c.detail).slice(0, 200)}`);
      ok('the run is stored as failed', c.run.passed === false && c.run.failing.includes('RECEIVABLES') && (await cfo.get(`/api/ledger/reconciliations/${c.run.id}`)).body.passed === false);
      ok('no entry was made to close the gap', (await prisma.journalEntry.count()) === entriesBefore && /Nothing was corrected/.test(c.run.note));
    } finally { await prisma.invoice.update({ where: { id: inv.id }, data: { paidAmount: { decrement: 11.11 } } }); }
    ok('with the record put back they agree', (await check('RECEIVABLES')).status === 'MATCH');
    ok('an auditor reads the stored runs and cannot start one', (await auditor.get('/api/ledger/reconciliations')).body.reconciliations.length >= 2 && (await auditor.post('/api/ledger/reconciliations')).status === 403);
  });

  await S('A payment written to the database without its ledger event is found by the completeness check and posted from its own record', async (ok) => {
    const r = await ctx.shipped(200, { price: 0.5 });
    await pay(r.invoice.id, 10);
    const { id, createdAt, updatedAt, ...like } = await ctx.lastPayment(r.invoice.id);
    const lost = await prisma.payment.create({ data: { ...like, amount: 15, referenceNumber: tag('LOST') } });
    await prisma.invoice.update({ where: { id: r.invoice.id }, data: { paidAmount: { increment: 15 } } });
    const c = await check('COMPLETENESS');
    ok('the check lists it', c.status === 'EXCEPTIONS' && c.detail.some((d) => d.sourceId === lost.id && d.eventKind === 'PAYMENT_RECORDED'), `${c.status} ${JSON.stringify(c.detail).slice(0, 200)}`);
    ok('an auditor cannot post it', (await auditor.post('/api/ledger/events/record-missing')).status === 403);
    const m = await movement(() => cfo.post('/api/ledger/events/record-missing', {}));
    ok('it is posted by the same rule as any payment', m.out.status === 200 && m.out.body.posted >= 1 && near(m.delta['1000'], 15) && near(m.delta['1100'], -15), `${JSON.stringify(m.out.body)} ${JSON.stringify(m.delta)}`);
    ok('running it again finds nothing', (await cfo.post('/api/ledger/events/record-missing', {})).body.found === 0);
    ok('the check is clear and the recovery is in the audit log', (await check('COMPLETENESS')).status === 'MATCH' && (await ctx.auditsOf('LEDGER_MISSING_RECORDED')).length >= 1);
  });

  await S('Every report is cut from the same posted lines: revenue, margin, tax, stock and scrap agree with the trial balance', async (ok) => {
    const t = await ctx.balances();
    const net = -(t.of('4000') + t.of('4100') + t.of('4200')) - t.of('4300');
    for (const by of ['branch', 'division', 'customer', 'product']) ok(`revenue by ${by} totals the trial balance's net sales`, near((await cfo.get(`/api/ledger/reports/revenue?by=${by}`)).body.total, net, 0.01), `${net}`);
    const gm = (await cfo.get('/api/ledger/reports/gross-margin?by=branch')).body;
    ok('the margin report\'s sales are the same net sales', near(gm.rows.reduce((s, r) => s + Number(r.netSales), 0), net, 0.01));
    ok('its material cost is account 5000', near(gm.rows.reduce((s, r) => s + Number(r.materialCost), 0), t.of('5000'), 0.01));
    ok('it is titled gross margin on material and says it is not a P&L', gm.title === 'Gross margin on material' && /not a profit and loss statement/.test(gm.note));
    ok('sales tax by state totals account 2100', near((await cfo.get('/api/ledger/reports/sales-tax')).body.total, -t.of('2100'), 0.01));
    const inv = (await cfo.get('/api/ledger/reports/inventory')).body;
    ok('stock by branch totals accounts 1200, 1210 and 1300', near(inv.totals.ledger, t.of('1200') + t.of('1210') + t.of('1300'), 0.01), `${inv.totals.ledger}`);
    ok('it names the valuation method as proposed, not approved', /Specific identification/.test(inv.method) && /not approved/.test(inv.method));
    ok('scrap totals account 5300', near((await cfo.get('/api/ledger/reports/scrap')).body.total, t.of('5300'), 0.01));
    ok('a grouping that does not exist is refused', (await cfo.get('/api/ledger/reports/revenue?by=salesperson')).status === 400);
  });

  await S('Export: nothing leaves without an approved account mapping, each entry is exported once, and the file defends against spreadsheet formulas', async (ok) => {
    const evil = await draft([D('5100', 1), C('2200', 1)], { memo: '=HYPERLINK("http://example.invalid","x")' });
    await cfo2.post(`/api/ledger/entries/${evil.body.id}/post`);
    const from = state.booksBegin; const to = ctx.today();
    const none = await cfo.post('/api/ledger/exports', { provider: 'GENERIC', from, to });
    ok('with no mapping nothing is exported and the missing accounts are named', none.status === 409 && none.body.code === 'MAPPING_MISSING' && /1100/.test(err(none)) && /no account was substituted/.test(err(none)), `${none.status} ${err(none)}`);
    ok('no batch was made', (await prisma.ledgerExportBatch.count()) === 0);
    ok('a provider that is not known is refused', (await cfo.post('/api/ledger/exports', { provider: 'SAGE', from, to })).status === 400);
    const accounts = (await cfo.get('/api/ledger/external-accounts/GENERIC')).body.accounts;
    ok('an auditor cannot set a mapping', (await auditor.put('/api/ledger/external-accounts/GENERIC/1100', { externalAccount: 'X' })).status === 403);
    for (const a of accounts) await cfo.put(`/api/ledger/external-accounts/GENERIC/${a.code}`, { externalAccount: `EXT-${a.code}` });
    const b = await cfo.post('/api/ledger/exports', { provider: 'GENERIC', from, to });
    const postedCount = await prisma.journalEntry.count({ where: { status: 'POSTED' } });
    ok('the batch holds every posted entry', b.status === 201 && b.body.entryCount === postedCount && b.body.status === 'GENERATED' && /^[0-9a-f]{64}$/.test(b.body.checksum), `${b.status} ${err(b)} ${b.body?.entryCount} vs ${postedCount}`);
    const file = (await auditor.get(`/api/ledger/exports/${b.body.id}/file`)).body;
    const rows = file.content.split('\n');
    ok('the file says it is not validated for any accounting product', /has not been validated for import into any accounting product/.test(rows[1]));
    ok('every line carries the mapped external account', rows.slice(3).every((r) => /,EXT-\d+,/.test(r)), rows.slice(3).find((r) => !/,EXT-\d+,/.test(r)));
    ok('debits equal credits in the file\'s total', near(file.totalDebit, (await prisma.journalEntry.aggregate({ where: { status: 'POSTED' }, _sum: { totalDebit: true } }))._sum.totalDebit));
    ok('a memo that starts like a formula is neutralised', file.content.includes('"\'=HYPERLINK(""http://example.invalid"",""x"")"') && !/,=HYPERLINK/.test(file.content));
    const again = await cfo.post('/api/ledger/exports', { provider: 'GENERIC', from, to });
    ok('the same dates again export nothing', again.status === 409 && again.body.code === 'NOTHING_TO_EXPORT', `${again.status} ${err(again)}`);
    ok('the database allows an entry in one batch per provider', /23505|already exists|Unique|duplicate/i.test(await sql(`INSERT INTO "LedgerExportItem" ("id","batchId","provider","entryId") SELECT $1::text, "batchId", "provider", "entryId" FROM "LedgerExportItem" LIMIT 1`, tag('qa-dup')) || ''));
    ok('another provider has its own mapping and is refused until it is set', (await cfo.post('/api/ledger/exports', { provider: 'QUICKBOOKS', from, to })).body.code === 'MAPPING_MISSING');
    ok('the download is in the audit log', (await ctx.auditsOf('LEDGER_EXPORT_DOWNLOADED')).some((a) => a.userId === auditor.user.id));
    const list = (await auditor.get('/api/ledger/exports')).body;
    ok('the list says no accounting system is connected and nothing is sent', list.connected.length === 0 && /nothing is sent anywhere/.test(list.note) && list.batches.length === 1);
    state.batch = b.body;
  });

  await S('An export batch that failed keeps its entries; a withdrawn batch releases them; an acknowledged batch is final', async (ok) => {
    const id = state.batch.id;
    ok('failing needs a reason', (await cfo.post(`/api/ledger/exports/${id}/settle`, { status: 'FAILED' })).status === 400);
    const f = await cfo.post(`/api/ledger/exports/${id}/settle`, { status: 'FAILED', error: 'The accountant\'s import rejected line 14' });
    ok('marked failed with the reason', f.status === 200 && f.body.status === 'FAILED' && /line 14/.test(f.body.error), `${f.status} ${err(f)}`);
    ok('its entries are still held by it', (await cfo.post('/api/ledger/exports', { provider: 'GENERIC', from: state.booksBegin, to: ctx.today() })).body.code === 'NOTHING_TO_EXPORT');
    const v = await cfo.post(`/api/ledger/exports/${id}/settle`, { status: 'VOID', error: 'Withdrawn to rebuild after the mapping was corrected' });
    ok('withdrawn', v.status === 200 && v.body.status === 'VOID');
    ok('a withdrawn batch cannot be acknowledged', (await cfo.post(`/api/ledger/exports/${id}/settle`, { status: 'ACKNOWLEDGED', externalReference: 'IMP-1' })).status === 409);
    const b2 = await cfo.post('/api/ledger/exports', { provider: 'GENERIC', from: state.booksBegin, to: ctx.today() });
    ok('a new batch takes the same entries, with a new number', b2.status === 201 && b2.body.entryCount >= state.batch.entryCount && b2.body.batchNumber !== state.batch.batchNumber, `${b2.status} ${err(b2)}`);
    ok('acknowledging needs the accounting system\'s reference', (await cfo.post(`/api/ledger/exports/${b2.body.id}/settle`, { status: 'ACKNOWLEDGED' })).status === 400);
    const a = await cfo.post(`/api/ledger/exports/${b2.body.id}/settle`, { status: 'ACKNOWLEDGED', externalReference: 'QA-IMPORT-0001' });
    ok('acknowledged with the reference', a.status === 200 && a.body.status === 'ACKNOWLEDGED' && a.body.externalReference === 'QA-IMPORT-0001');
    ok('an acknowledged batch cannot be withdrawn or failed', (await cfo.post(`/api/ledger/exports/${b2.body.id}/settle`, { status: 'VOID', error: 'Changed my mind' })).status === 409);
    const d = await draft([D('5100', 2), C('2200', 2)], { memo: 'Posted after the export (QA)' });
    await cfo2.post(`/api/ledger/entries/${d.body.id}/post`);
    const b3 = await cfo.post('/api/ledger/exports', { provider: 'GENERIC', from: state.booksBegin, to: ctx.today() });
    ok('the next batch holds only what was posted since', b3.status === 201 && b3.body.entryCount === 1, `${b3.status} ${b3.body?.entryCount}`);
    ok('two exports at once never share an entry', await (async () => { const e = await draft([D('5100', 3), C('2200', 3)], { memo: 'For two exports at once (QA)' }); await cfo2.post(`/api/ledger/entries/${e.body.id}/post`); const rs = await ctx.all(2, () => cfo.post('/api/ledger/exports', { provider: 'GENERIC', from: state.booksBegin, to: ctx.today() })); const dup = await prisma.$queryRaw`SELECT COUNT(*)::int AS n FROM (SELECT "entryId" FROM "LedgerExportItem" WHERE "provider" = 'GENERIC' GROUP BY "entryId" HAVING COUNT(*) > 1) d`; return rs.filter((r) => r.status === 201).length === 1 && dup[0].n === 0; })());
    ok('each step is in the audit log', (await ctx.auditsOf('LEDGER_EXPORT_FAILED')).length >= 1 && (await ctx.auditsOf('LEDGER_EXPORT_VOID')).length >= 1 && (await ctx.auditsOf('LEDGER_EXPORT_ACKNOWLEDGED')).length >= 1);
  });

  await S('Posting states mean one thing each: every event is in a known state, posted events have a posted entry, and held ones say why', async (ok) => {
    const known = ['PENDING', 'POSTED', 'FAILED', 'REVERSED', 'RECONCILIATION_REQUIRED', 'NOT_POSTED'];
    const by = await prisma.ledgerEvent.groupBy({ by: ['status'], _count: { _all: true } });
    ok('only the documented states exist', by.every((b) => known.includes(b.status)), by.map((b) => b.status).join(','));
    const bad = await prisma.$queryRaw`SELECT COUNT(*)::int AS n FROM "LedgerEvent" v LEFT JOIN "JournalEntry" e ON e."id" = v."journalEntryId" WHERE v."status" = 'POSTED' AND (e."id" IS NULL OR e."status" <> 'POSTED')`;
    ok('every posted event points at a posted entry', bad[0].n === 0, bad[0].n);
    const rev = await prisma.$queryRaw`SELECT COUNT(*)::int AS n FROM "LedgerEvent" v WHERE v."status" = 'REVERSED' AND NOT EXISTS (SELECT 1 FROM "JournalEntry" r WHERE r."reversesEntryId" = v."journalEntryId")`;
    ok('every reversed event\'s entry has its reversal', rev[0].n === 0, rev[0].n);
    ok('every event that did not post says why', (await prisma.ledgerEvent.count({ where: { status: { in: ['FAILED', 'RECONCILIATION_REQUIRED', 'NOT_POSTED'] }, OR: [{ reason: null }, { reason: '' }] } })) === 0);
    const ex = (await cfo.get('/api/ledger/reports/exceptions')).body;
    ok('the exceptions report counts the open ones', ex.open === (await prisma.ledgerEvent.count({ where: { status: { in: ['FAILED', 'RECONCILIATION_REQUIRED', 'PENDING'] } } })) && ex.events.every((e) => e.reason));
    const st = (await cfo.get('/api/ledger/status')).body;
    ok('the status says since when and in which time zone the books run', st.active === true && st.effectiveDate === state.booksBegin && st.timeZone === 'America/Detroit' && st.can.change === true, JSON.stringify(st).slice(0, 200));
    const openings = await prisma.journalEntry.count({ where: { kind: 'OPENING' } });
    const dry = await cfo.post('/api/ledger/cutover/dry-run');
    ok('a dry run after the books began says they are active and posts nothing', dry.status === 200 && dry.body.alreadyActive === true && (await prisma.journalEntry.count({ where: { kind: 'OPENING' } })) === openings, `${dry.status}`);
    void num; void owner;
  });
}
