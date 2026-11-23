// Group 7: concurrency, authorization and failure recovery.
export default async function guard(ctx, state) {
  const { scenario, G, prisma, http1, cfo, cfo2, owner, auditor, exec, admin2, bm1, credit, sales, invMgr, operator, analyst, L1, near, err, tag, posted, eventOf, movement, pay, draft, D, C } = ctx;
  const S = (name, fn) => scenario(G.guard, name, fn);
  const sql = async (text, ...args) => { try { await prisma.$executeRawUnsafe(text, ...args); return null; } catch (e) { return String(e.message); } };
  const check = async (key) => (await cfo.post('/api/ledger/reconciliations')).body.checks.find((c) => c.key === key);
  const today = ctx.today();
  const snapshot = async () => JSON.stringify(await prisma.$queryRaw`SELECT (SELECT COUNT(*)::int FROM "JournalEntry") AS e, (SELECT COUNT(*)::int FROM "JournalLine") AS l, (SELECT COALESCE(SUM("debit"), 0)::text FROM "JournalLine") AS d, (SELECT COUNT(*)::int FROM "LedgerAccount") AS a, (SELECT COUNT(*)::int FROM "LedgerPeriod" WHERE "status" = 'CLOSED') AS p, (SELECT COUNT(*)::int FROM "LedgerExportBatch") AS x, (SELECT "value"->>'active' FROM "AppSetting" WHERE "key" = 'ledger.activation') AS on`);
  const aDraft = async (memo = 'QA guard draft') => (await draft([D('5100', 12.34), C('2200', 12.34)], { memo })).body;
  const aPosted = async (memo = 'QA guard posted entry') => { const d = await aDraft(memo); return (await cfo2.post(`/api/ledger/entries/${d.id}/post`)).body; };
  const READS = ['/status', '/chart', '/reports/trial-balance', '/reports/receivables', '/reports/exceptions', '/reports/revenue', '/entries', '/periods', '/reconciliations', '/exports', '/external-accounts/GENERIC'];
  const changes = (id) => [
    ['post', '/chart/load-proposed'], ['put', '/accounts/6999', { name: 'QA account', type: 'EXPENSE' }], ['put', '/mappings/RECEIVABLES', { accountCode: '2250' }], ['post', '/approvals', { accounts: 'ALL', mappings: 'ALL', approvedBy: 'Somebody Else' }],
    ['post', '/entries', { entryDate: today, memo: 'Not allowed to write this', lines: [D('5100', 1), C('2200', 1)] }], ['post', `/entries/${id}/post`], ['post', `/entries/${id}/reverse`, { reason: 'Not allowed' }], ['del', `/entries/${id}`], ['put', `/entries/${id}`, {}], ['patch', `/entries/${id}`, {}],
    ['post', '/periods/2026/1/close'], ['post', '/periods/2026/1/reopen', { reason: 'Not allowed to reopen' }], ['post', '/events/record-missing'], ['post', '/events/x/retry'], ['post', '/events/x/resolve', { note: 'Not allowed to settle' }],
    ['post', '/reconciliations'], ['post', '/cutover/dry-run'], ['post', '/activate', {}], ['put', '/settings', { throughWip: true }], ['post', '/deactivate', { reason: 'Not allowed to stop' }], ['post', '/resume', { reason: 'Not allowed to start' }],
    ['put', '/external-accounts/GENERIC/1100', { externalAccount: 'X' }], ['post', '/exports', { provider: 'GENERIC', from: today, to: today }], ['post', '/exports/x/settle', { status: 'VOID', error: 'Not allowed' }],
  ];
  const tryAll = async (who, list) => { const out = []; for (const [m, u, b] of list) out.push([`${m} ${u}`, (await who[m](`/api/ledger${u}`, b)).status]); return out; };

  await S('People with no business in the books get nothing: sales, credit, inventory, shop floor, analyst, a customer, a supplier, and no login at all', async (ok) => {
    const customer = await ctx.login('CUSTOMER_ADMIN', L1, 'customer'); const supplier = await ctx.login('SUPPLIER_USER', L1, 'supplier');
    const d = await aDraft();
    const before = await snapshot();
    for (const [name, who] of Object.entries({ sales, credit, invMgr, operator, analyst, customer, supplier })) {
      const reads = await tryAll(who, READS.map((u) => ['get', u]));
      ok(`${name} reads nothing`, reads.every(([, s]) => s === 403), reads.filter(([, s]) => s !== 403).map((x) => x.join(' ')).join('; '));
      const writes = await tryAll(who, changes(d.id));
      ok(`${name} changes nothing`, writes.every(([, s]) => s === 403), writes.filter(([, s]) => s !== 403).map((x) => x.join(' ')).join('; '));
    }
    const anon = []; for (const u of READS) anon.push((await http1('GET', `/api/ledger${u}`, {})).status);
    ok('with no login every address answers 401', anon.every((s) => s === 401), anon.join(','));
    ok('a made-up token is refused', (await http1('GET', '/api/ledger/status', { token: 'eyJhbGciOiJub25lIn0.eyJyb2xlIjoiQ0ZPIn0.' })).status === 401);
    ok('nothing changed', (await snapshot()) === before);
    await cfo.del(`/api/ledger/entries/${d.id}`);
  });

  await S('The auditor and the executive read every report and can change nothing', async (ok) => {
    const d = await aDraft();
    const before = await snapshot();
    for (const [name, who] of Object.entries({ auditor, exec })) {
      const reads = await tryAll(who, READS.map((u) => ['get', u]));
      ok(`${name} reads everything`, reads.every(([, s]) => s === 200), reads.filter(([, s]) => s !== 200).map((x) => x.join(' ')).join('; '));
      const writes = await tryAll(who, changes(d.id));
      ok(`${name} changes nothing`, writes.every(([, s]) => s === 403), writes.filter(([, s]) => s !== 403).map((x) => x.join(' ')).join('; '));
      ok(`${name} is told so by the status`, (await who.get('/api/ledger/status')).body.can.change === false);
    }
    ok('nothing changed', (await snapshot()) === before);
    await cfo.del(`/api/ledger/entries/${d.id}`);
  });

  await S('A branch manager is limited to the branch reports: no receivables, tax, exceptions, chart, periods, reconciliation or export, and no changes', async (ok) => {
    const d = await aDraft();
    const allowed = await tryAll(bm1, ['trial-balance', 'account?code=1200', 'revenue', 'gross-margin', 'inventory', 'scrap', `monthly?year=${today.slice(0, 4)}&month=${Number(today.slice(5, 7))}`].map((r) => ['get', `/reports/${r}`]));
    ok('the branch reports are readable', allowed.every(([, s]) => s === 200), allowed.map((x) => x.join(' ')).join('; '));
    const refused = await tryAll(bm1, ['/reports/receivables', '/reports/sales-tax', '/reports/exceptions', '/chart', '/periods', '/reconciliations', '/exports', '/external-accounts/GENERIC'].map((u) => ['get', u]));
    ok('company-wide reports are refused', refused.every(([, s]) => s === 403), refused.map((x) => x.join(' ')).join('; '));
    const writes = await tryAll(bm1, changes(d.id));
    ok('every change is refused', writes.every(([, s]) => s === 403), writes.filter(([, s]) => s !== 403).map((x) => x.join(' ')).join('; '));
    const st = (await bm1.get('/api/ledger/status')).body;
    ok('the status tells a branch manager only what they need', st.can.company === false && st.can.change === false && st.policiesApprovedBy === undefined && st.blockers === undefined, JSON.stringify(st));
    const inv = (await bm1.get('/api/ledger/reports/inventory')).body;
    ok('the stock report holds only the manager\'s branch and no item list of the company', inv.rows.every((r) => r.locationId === L1.id) && inv.itemsThatDisagree.length === 0, inv.rows.map((r) => r.branch).join(','));
    ok('a draft with no branch line is not visible to a branch manager', (await bm1.get(`/api/ledger/entries/${d.id}`)).status === 404);
    await cfo.del(`/api/ledger/entries/${d.id}`);
  });

  await S('An administrator keeps the books but cannot start, stop or reconfigure them; only the owner, a super administrator or the CFO can', async (ok) => {
    const no = await tryAll(admin2, [['post', '/activate', {}], ['put', '/settings', { throughWip: true }], ['post', '/deactivate', { reason: 'Stop for a test' }], ['post', '/resume', { reason: 'Start for a test' }]]);
    ok('activation, settings, stop and resume are refused', no.every(([, s]) => s === 403), no.map((x) => x.join(' ')).join('; '));
    const d = await draft([D('5100', 9), C('2200', 9)], { who: admin2, memo: 'Written by an administrator' });
    ok('an administrator can write a draft', d.status === 201, `${d.status} ${err(d)}`);
    ok('and cannot post their own', (await admin2.post(`/api/ledger/entries/${d.body.id}/post`)).body.code === 'SAME_PERSON');
    ok('the CFO posts it', (await cfo.post(`/api/ledger/entries/${d.body.id}/post`)).status === 200);
    ok('the status says who may do what', (await admin2.get('/api/ledger/status')).body.can.activate === false && (await owner.get('/api/ledger/status')).body.can.activate === true);
    ok('the books are still running', (await ctx.activationRow()).active === true);
  });

  await S('A posted entry cannot be edited or deleted through the server: there is no edit address, and delete is refused', async (ok) => {
    const e = await aPosted();
    const before = JSON.stringify((await cfo.get(`/api/ledger/entries/${e.id}`)).body);
    const put = await cfo.put(`/api/ledger/entries/${e.id}`, { memo: 'Changed', lines: [D('5100', 1), C('2200', 1)] });
    ok('PUT answers 405 and says to reverse instead', put.status === 405 && /never edited/.test(err(put)), `${put.status}`);
    ok('PATCH answers 405', (await cfo.patch(`/api/ledger/entries/${e.id}`, { memo: 'Changed' })).status === 405);
    const del = await owner.del(`/api/ledger/entries/${e.id}`);
    ok('DELETE is refused, even for the owner', del.status === 409 && del.body.code === 'IMMUTABLE', `${del.status} ${err(del)}`);
    ok('posting it a second time is refused', (await cfo2.post(`/api/ledger/entries/${e.id}/post`)).status === 409);
    ok('the entry is exactly as it was', JSON.stringify((await cfo.get(`/api/ledger/entries/${e.id}`)).body) === before);
    state.posted = e;
  });

  await S('A posted entry cannot be changed by direct SQL either: update, delete, added or moved lines and TRUNCATE are refused by the database', async (ok) => {
    const e = await prisma.journalEntry.findUnique({ where: { id: state.posted.id }, include: { lines: { orderBy: { lineNumber: 'asc' } } } });
    const before = JSON.stringify(e);
    const tries = {
      'memo changed': [`UPDATE "JournalEntry" SET "memo" = 'x' WHERE "id" = $1`, e.id],
      'put back to draft': [`UPDATE "JournalEntry" SET "status" = 'DRAFT' WHERE "id" = $1`, e.id],
      'total changed': [`UPDATE "JournalEntry" SET "totalDebit" = 1 WHERE "id" = $1`, e.id],
      'entry deleted': [`DELETE FROM "JournalEntry" WHERE "id" = $1`, e.id],
      'line amount changed': [`UPDATE "JournalLine" SET "debit" = "debit" + 1 WHERE "id" = $1`, e.lines[0].id],
      'line account changed': [`UPDATE "JournalLine" SET "accountId" = $2 WHERE "id" = $1`, e.lines[0].id, e.lines[1].accountId],
      'line deleted': [`DELETE FROM "JournalLine" WHERE "id" = $1`, e.lines[0].id],
      'line added': [`INSERT INTO "JournalLine" ("id","entryId","lineNumber","accountId","debit","credit") VALUES ($1,$2,99,$3,1,0)`, tag('qa-jl'), e.id, e.lines[0].accountId],
    };
    for (const [name, [text, ...args]] of Object.entries(tries)) { const r = await sql(text, ...args); ok(`${name}: refused`, /LEDGER_IMMUTABLE/.test(r || ''), r); }
    const d = await aDraft('Draft to try moving a line from');
    const dl = await prisma.journalLine.findFirst({ where: { entryId: d.id } });
    ok('a draft\'s line cannot be moved onto a posted entry', /LEDGER_IMMUTABLE/.test(await sql(`UPDATE "JournalLine" SET "entryId" = $2, "lineNumber" = 98 WHERE "id" = $1`, dl.id, e.id) || ''));
    await cfo.del(`/api/ledger/entries/${d.id}`);
    ok('TRUNCATE of the lines is refused', /LEDGER_IMMUTABLE/.test(await sql('TRUNCATE "JournalLine"') || ''));
    ok('TRUNCATE of the entries is refused', /LEDGER_IMMUTABLE/.test(await sql('TRUNCATE "JournalEntry" CASCADE') || ''));
    ok('an account with lines cannot be deleted', (await sql(`DELETE FROM "LedgerAccount" WHERE "id" = $1`, e.lines[0].accountId)) !== null);
    ok('a period with entries cannot be deleted', (await sql(`DELETE FROM "LedgerPeriod" WHERE "id" = $1`, e.periodId)) !== null);
    ok('the entry is exactly as it was', JSON.stringify(await prisma.journalEntry.findUnique({ where: { id: e.id }, include: { lines: { orderBy: { lineNumber: 'asc' } } } })) === before);
  });

  await S('The database itself refuses an entry that does not balance, has one line, is written as posted, or has a line on both sides', async (ok) => {
    const period = await prisma.ledgerPeriod.findFirst({ where: { status: 'OPEN' }, orderBy: [{ year: 'desc' }, { month: 'desc' }] });
    const [a, b] = await prisma.ledgerAccount.findMany({ where: { code: { in: ['5100', '2200'] } }, orderBy: { code: 'asc' } });
    const made = [];
    const entry = async (lines, over = {}) => {
      const id = tag('qa-je'); made.push(id);
      const e = await sql(`INSERT INTO "JournalEntry" ("id","entryNumber","entryDate","periodId","status","kind") VALUES ($1,$2,$3::date,$4,$5,$6)`, id, tag('JE-QA'), over.date || today, period.id, over.status || 'DRAFT', over.kind || 'MANUAL');
      if (e) return { id, error: e };
      for (const [i, [acc, d, c]] of lines.entries()) { const le = await sql(`INSERT INTO "JournalLine" ("id","entryId","lineNumber","accountId","debit","credit") VALUES ($1,$2,$3,$4,$5,$6)`, tag('qa-jl'), id, i + 1, acc.id, d, c); if (le) return { id, error: le }; }
      return { id, error: await sql(`UPDATE "JournalEntry" SET "status" = 'POSTED' WHERE "id" = $1`, id) };
    };
    ok('unbalanced: refused at posting', /LEDGER_UNBALANCED/.test((await entry([[b, 10, 0], [a, 0, 9.99]])).error || ''));
    ok('one line: refused', /LEDGER_TOO_FEW_LINES/.test((await entry([[b, 10, 0]])).error || ''));
    ok('no lines: refused', /LEDGER_TOO_FEW_LINES/.test((await entry([])).error || ''));
    ok('written as posted: refused', /LEDGER_DRAFT_FIRST/.test((await entry([], { status: 'POSTED' })).error || ''));
    ok('a line with a debit and a credit: refused', /JournalLine_one_side/.test((await entry([[b, 10, 10], [a, 0, 10]])).error || ''));
    ok('a negative amount: refused', /JournalLine_one_side/.test((await entry([[b, -10, 0], [a, 0, -10]])).error || ''));
    ok('a line of zero: refused', /JournalLine_one_side/.test((await entry([[b, 0, 0], [a, 0, 0]])).error || ''));
    ok('a kind that does not exist: refused', /JournalEntry_kind_known/.test((await entry([], { kind: 'PLUG' })).error || ''));
    ok('a date outside the period: refused at posting', /LEDGER_WRONG_PERIOD/.test((await entry([[b, 10, 0], [a, 0, 10]], { date: '2031-01-01' })).error || ''));
    const good = await entry([[b, 10, 0], [a, 0, 10]]);
    ok('a balanced two-line entry posts, and the database sets its total', good.error === null && Number((await prisma.journalEntry.findUnique({ where: { id: good.id } })).totalDebit) === 10, good.error);
    await prisma.journalEntry.deleteMany({ where: { id: { in: made }, status: 'DRAFT' } });
    // The one entry posted here by SQL stands, as any posted entry does; it is reversed so the scenario leaves nothing behind.
    ok('it is reversed through the server', (await cfo.post(`/api/ledger/entries/${good.id}/reverse`, { reason: 'QA entry posted by SQL to test the database guard' })).status === 201);
  });

  await S('Manual entries: the server refuses every malformed draft and saves none of them', async (ok) => {
    const n = await prisma.journalEntry.count();
    const bad = {
      'one line': [[D('5100', 5)]], 'does not balance': [[D('5100', 5), C('2200', 4.99)]], 'a negative amount': [[D('5100', -5), C('2200', -5)]], 'both sides on a line': [[{ accountCode: '5100', debit: 5, credit: 5 }, C('2200', 5)]],
      'a fraction of a cent': [[D('5100', 5.001), C('2200', 5.001)]], 'an account not in the chart': [[D('9999', 5), C('2200', 5)]], 'no memo': [[D('5100', 5), C('2200', 5)], { memo: 'x' }], 'no date': [[D('5100', 5), C('2200', 5)], { entryDate: '' }],
      'a date that is not a date': [[D('5100', 5), C('2200', 5)], { entryDate: '2026-02-31x' }], 'a date before the books began': [[D('5100', 5), C('2200', 5)], { entryDate: '2020-01-01' }],
      'an amount too large to hold': [[D('5100', '1e30'), C('2200', '1e30')]], 'an infinite amount': [[D('5100', 'Infinity'), C('2200', 'Infinity')]], 'not a number': [[D('5100', 'abc'), C('2200', 'abc')]], 'lines that are not a list': ['abc'],
      'more than 200 lines': [[...Array.from({ length: 200 }, () => D('5100', 1)), C('2200', 200)]], 'a control account without the named permission': [[D('1100', 5), C('4000', 5)]],
    };
    for (const [name, [lines, opts]] of Object.entries(bad)) { const r = await draft(lines, opts); ok(`${name}: refused`, [400, 409].includes(r.status) && err(r).length > 5, `${r.status} ${err(r)}`); }
    ok('none was saved', (await prisma.journalEntry.count()) === n);
    // 6195 is not in the chart of accounts, so this adds an account (6100, used here before, joined the chart in 2026-11).
    const acc = await cfo.put('/api/ledger/accounts/6195', { name: 'QA account not yet approved', type: 'EXPENSE' });
    ok('a new account can be added', acc.status === 200 && acc.body.approvedAt === null, `${acc.status} ${err(acc)}`);
    const un = await draft([D('6195', 5), C('2200', 5)]);
    ok('and cannot be used until the accountant approves it', un.status === 409 && un.body.code === 'NOT_APPROVED', `${un.status} ${err(un)}`);
    ok('approval is recorded with the accountant\'s name', (await cfo.post('/api/ledger/approvals', { accounts: ['6195'], approvedBy: 'QA Synthetic Accountant (test data only)' })).body.accountsApproved === 1);
    const now = await draft([D('6195', 5), C('2200', 5)]);
    ok('then it can', now.status === 201);
    await cfo.del(`/api/ledger/entries/${now.body.id}`);
    ok('changing an account removes its approval', (await cfo.put('/api/ledger/accounts/6195', { name: 'QA account renamed' })).body.approvedAt === null);
    ok('and it is approved again, so nothing is left waiting', (await cfo.post('/api/ledger/approvals', { accounts: ['6195'], approvedBy: 'QA Synthetic Accountant (test data only)' })).status === 200);
    ok('an account with entries cannot change type', (await cfo.put('/api/ledger/accounts/5100', { type: 'ASSET' })).status === 409);
    ok('an account a rule posts to cannot be switched off', (await cfo.put('/api/ledger/accounts/1100', { isActive: false })).status === 409);
  });

  await S('Reversal by hand: a reason is needed, an event\'s entry is reversed by undoing the event, and a reversal is never reversed', async (ok) => {
    const e = await aPosted('To be reversed by hand');
    ok('no reason: refused', (await cfo.post(`/api/ledger/entries/${e.id}/reverse`, { reason: 'no' })).status === 400);
    const sale = await ctx.shipped(100, { price: 0.5 });
    const sys = (await posted('INVOICE_ISSUED', 'Invoice', sale.invoice.id)).entry;
    const no = await cfo.post(`/api/ledger/entries/${sys.id}/reverse`, { reason: 'Trying to reverse an invoice entry by hand' });
    ok('an invoice\'s entry is not reversed by hand', no.status === 409 && no.body.code === 'SYSTEM_ENTRY' && /Undo the event/.test(err(no)), `${no.status} ${err(no)}`);
    const d = await aDraft('Draft, not reversible');
    ok('a draft is not reversed', (await cfo.post(`/api/ledger/entries/${d.id}/reverse`, { reason: 'It is only a draft' })).status === 409);
    await cfo.del(`/api/ledger/entries/${d.id}`);
    const m = await movement(() => cfo.post(`/api/ledger/entries/${e.id}/reverse`, { reason: 'Entered against the wrong account' }));
    ok('reversed: a new entry, the mirror image, linked to the first', m.out.status === 201 && m.out.body.kind === 'REVERSAL' && m.out.body.reverses.id === e.id && near(m.delta['5100'], -12.34) && near(m.delta['2200'], 12.34), `${m.out.status} ${JSON.stringify(m.delta)}`);
    ok('the first entry still stands, marked as reversed', (await cfo.get(`/api/ledger/entries/${e.id}`)).body.status === 'POSTED' && (await cfo.get(`/api/ledger/entries/${e.id}`)).body.reversedBy.id === m.out.body.id);
    const rr = await cfo.post(`/api/ledger/entries/${m.out.body.id}/reverse`, { reason: 'Reversing the reversal' });
    ok('a reversal is not reversed', rr.status === 409 && /new entry/.test(err(rr)), `${rr.status} ${err(rr)}`);
    ok('the reversal is in the audit log with its reason', (await ctx.auditsOf('LEDGER_ENTRY_REVERSED')).some((a) => a.resourceId === e.id && /wrong account/.test(a.details.reason)));
  });

  await S('Five payments on one invoice at the same moment: each accepted payment is in the books once', async (ok) => {
    const r = await ctx.shipped(400, { price: 0.5 });
    const m = await movement(() => ctx.all(5, () => pay(r.invoice.id, 30)));
    const accepted = m.out.filter((x) => x.status === 201 || x.status === 200).length;
    ok('payments were accepted', accepted >= 1, m.out.map((x) => x.status).join(','));
    ok('cash rose by exactly the accepted payments', near(m.delta['1000'], accepted * 30) && near(m.delta['1100'], -accepted * 30), `${accepted} ${JSON.stringify(m.delta)}`);
    const pays = await prisma.payment.findMany({ where: { invoiceId: r.invoice.id } });
    const events = await prisma.ledgerEvent.findMany({ where: { eventKind: 'PAYMENT_RECORDED', sourceId: { in: pays.map((p) => p.id) } } });
    ok('one posted event per payment', pays.length === accepted && events.length === accepted && events.every((e) => e.status === 'POSTED'), `${pays.length} ${events.length}`);
    ok('receivables agree', (await check('RECEIVABLES')).status === 'MATCH');
  });

  await S('One draft posted by four requests at once is posted once; one entry reversed by four at once is reversed once', async (ok) => {
    const d = await aDraft('Posted by four at once');
    const m = await movement(() => ctx.all(4, () => cfo2.post(`/api/ledger/entries/${d.id}/post`)));
    ok('one post succeeded, three were refused', m.out.filter((x) => x.status === 200).length === 1 && m.out.filter((x) => x.status === 409).length === 3, m.out.map((x) => x.status).join(','));
    ok('the books moved once', near(m.delta['5100'], 12.34), JSON.stringify(m.delta));
    ok('one posting is in the audit log', (await ctx.auditsOf('LEDGER_ENTRY_POSTED')).filter((a) => a.resourceId === d.id).length === 1);
    const r = await movement(() => ctx.all(4, () => cfo.post(`/api/ledger/entries/${d.id}/reverse`, { reason: 'Reversed by four at once' })));
    ok('one reversal was made', r.out.filter((x) => x.status === 201).length === 1 && r.out.every((x) => [201, 409].includes(x.status)), r.out.map((x) => x.status).join(','));
    ok('the books moved back once', near(r.delta['5100'], -12.34) && (await prisma.journalEntry.count({ where: { reversesEntryId: d.id } })) === 1, JSON.stringify(r.delta));
  });

  await S('A month closed while payments dated in it are being recorded: each lands before the close or is held, and none after', async (ok) => {
    const now = new Date();
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 0, 16)); // the last day of the month before last
    const [y, mo] = [end.getUTCFullYear(), end.getUTCMonth() + 1];
    const sales8 = []; for (let i = 0; i < 8; i += 1) sales8.push(await ctx.shipped(100, { price: 0.5 }));
    const out = await Promise.all([...sales8.map((s, i) => new Promise((res) => { setTimeout(() => res(pay(s.invoice.id, 10, { paymentDate: end.toISOString() })), i * 12); })), new Promise((res) => { setTimeout(() => res(cfo.post(`/api/ledger/periods/${y}/${mo}/close`)), 40); })]);
    const close = out.pop();
    ok('the month closed', close.status === 200, `${close.status} ${err(close)}`);
    ok('every payment was saved', out.every((r) => r.status === 201 || r.status === 200), out.map((r) => r.status).join(','));
    const period = await prisma.ledgerPeriod.findUnique({ where: { year_month: { year: y, month: mo } } });
    const events = []; for (const s of sales8) events.push(await eventOf('PAYMENT_RECORDED', 'Payment', (await ctx.lastPayment(s.invoice.id)).id));
    const [in1, held] = [events.filter((e) => e.status === 'POSTED'), events.filter((e) => e.status === 'RECONCILIATION_REQUIRED')];
    ok('each is posted or held, none lost or failed', in1.length + held.length === 8, events.map((e) => `${e.status} ${e.reason || ''}`).join(' | '));
    ok('held ones say the period is closed', held.every((e) => /closed/.test(e.reason)));
    const late = await prisma.journalEntry.count({ where: { periodId: period.id, status: 'POSTED', postedAt: { gt: period.closedAt } } });
    ok('no entry was posted into the month after it closed', late === 0, late);
    ok('the books balance', (await ctx.balances()).balanced);
    for (const e of held) await cfo.post(`/api/ledger/events/${e.id}/retry`, { postingDate: today });
    ok('the held ones post on a date the CFO chose, and payments agree', (await check('PAYMENTS')).status === 'MATCH');
    state.raceSplit = { posted: in1.length, held: held.length };
  });

  await S('A posting rule whose mapping loses its approval stops posting: the payment is saved, the event fails with the reason, and posts once approved', async (ok) => {
    const r = await ctx.shipped(200, { price: 0.5 });
    const ch = await cfo.put('/api/ledger/mappings/CASH_CLEARING', { accountCode: '2250' });
    ok('changing a mapping removes its approval', ch.status === 200 && ch.body.approvedAt === null, `${ch.status} ${err(ch)}`);
    const m = await movement(() => pay(r.invoice.id, 40));
    ok('the payment was saved', m.out.status === 201 || m.out.status === 200, `${m.out.status}`);
    ok('nothing was posted, to that account or any other', Object.keys(m.delta).length === 0, JSON.stringify(m.delta));
    const p = await ctx.lastPayment(r.invoice.id);
    const e = await eventOf('PAYMENT_RECORDED', 'Payment', p.id);
    ok('the event failed and says the mapping is not approved', e.status === 'FAILED' && /not approved/.test(e.reason) && /Nothing was posted/.test(e.reason), `${e.status} ${e.reason}`);
    ok('the reconciliation lists it', (await check('EVENTS')).detail.some((x) => x.id === e.id));
    ok('retrying while it is unapproved fails again', (await cfo.post(`/api/ledger/events/${e.id}/retry`)).body.status === 'FAILED');
    await cfo.put('/api/ledger/mappings/CASH_CLEARING', { accountCode: '1000' });
    ok('putting it back does not restore the approval', (await cfo.post(`/api/ledger/events/${e.id}/retry`)).body.status === 'FAILED');
    ok('the accountant\'s approval is recorded again', (await cfo.post('/api/ledger/approvals', { mappings: ['CASH_CLEARING'], approvedBy: 'QA Synthetic Accountant (test data only)' })).body.mappingsApproved === 1);
    const again = await movement(() => cfo.post(`/api/ledger/events/${e.id}/retry`));
    ok('now it posts, to the approved account', again.out.body.status === 'POSTED' && near(again.delta['1000'], 40) && near(again.delta['1100'], -40), `${again.out.body?.status} ${JSON.stringify(again.delta)}`);
    ok('the mapping change is in the audit log', (await ctx.auditsOf('LEDGER_MAPPING_CHANGED')).some((a) => a.details.to === '2250'));
  });

  await S('An account switched off underneath a rule: the invoice is still issued, its entry fails by name, and posts when the account is back', async (ok) => {
    await prisma.ledgerAccount.update({ where: { code: '4200' }, data: { isActive: false } });
    let r; let m;
    try { m = await movement(async () => { r = await ctx.shipped(200, { price: 0.5, freight: 25 }); return r; }); } finally { await prisma.ledgerAccount.update({ where: { code: '4200' }, data: { isActive: true } }); }
    ok('the invoice was issued', r.invoice && Number(r.invoice.totalAmount) === 125);
    const e = await eventOf('INVOICE_ISSUED', 'Invoice', r.invoice.id);
    ok('its event failed, naming the account', e.status === 'FAILED' && /4200/.test(e.reason) && /not active/.test(e.reason), `${e.status} ${e.reason}`);
    ok('no part of the invoice was posted, and freight did not go to another account', !m.delta['1100'] && !m.delta['4000'] && !m.delta['4200'], JSON.stringify(m.delta));
    const again = await movement(() => cfo.post(`/api/ledger/events/${e.id}/retry`));
    ok('with the account back it posts in full', again.out.body.status === 'POSTED' && near(again.delta['1100'], 125) && near(again.delta['4200'], -25) && near(again.delta['4000'], -100), JSON.stringify(again.delta));
    ok('posting it a third time is refused', (await cfo.post(`/api/ledger/events/${e.id}/retry`)).body.code === 'ALREADY_FINAL');
  });

  await S('Posting stopped and started again: business goes on while it is stopped, and what happened meanwhile is found and posted in order', async (ok) => {
    ok('stopping needs a reason', (await owner.post('/api/ledger/deactivate', {})).status === 400);
    const stop = await owner.post('/api/ledger/deactivate', { reason: 'Accountant asked for a pause (QA)' });
    ok('stopped', stop.status === 200 && stop.body.active === false, `${stop.status} ${err(stop)}`);
    let r; let m; let stoppedStatus; let draftWhileStopped;
    try {
      m = await movement(async () => { r = await ctx.shipped(300, { price: 0.5 }); await pay(r.invoice.id, 70); });
      stoppedStatus = (await cfo.get('/api/ledger/status')).body;
      draftWhileStopped = await draft([D('5100', 5), C('2200', 5)]);
      ok('starting again needs a reason', (await owner.post('/api/ledger/resume', {})).status === 400);
    } finally {
      const go = await owner.post('/api/ledger/resume', { reason: 'Pause over (QA)' });
      ok('started again', go.status === 200 && go.body.active === true, `${go.status} ${err(go)}`);
    }
    ok('the sale and the payment went through while stopped', r.invoice && (await ctx.lastPayment(r.invoice.id)));
    ok('nothing was posted while stopped, and no event was written', Object.keys(m.delta).length === 0 && (await eventOf('INVOICE_ISSUED', 'Invoice', r.invoice.id)) === null, JSON.stringify(m.delta));
    ok('the status said stopped, and what is posted stays', stoppedStatus.active === false && stoppedStatus.stopped === true && /stopped/.test(stoppedStatus.message));
    ok('no manual entry while stopped', draftWhileStopped.status === 409);
    ok('starting twice is refused', (await owner.post('/api/ledger/resume', { reason: 'Again by mistake' })).status === 409);
    const miss = await check('COMPLETENESS');
    ok('the completeness check lists what happened meanwhile', miss.status === 'EXCEPTIONS' && miss.detail.some((d) => d.sourceId === r.invoice.id), `${miss.status}`);
    const rec = await movement(() => cfo.post('/api/ledger/events/record-missing', {}));
    ok('it is posted from the records', rec.out.body.failed === 0 && near(rec.delta['1100'], 150 - 70) && near(rec.delta['1000'], 70) && near(rec.delta['5000'], 120), `${JSON.stringify(rec.out.body)} ${JSON.stringify(rec.delta)}`);
    const [inv, pmt] = [(await posted('INVOICE_ISSUED', 'Invoice', r.invoice.id)).entry, (await posted('PAYMENT_RECORDED', 'Payment', (await ctx.lastPayment(r.invoice.id)).id)).entry];
    ok('the invoice was posted before its payment', inv.entryNumber < pmt.entryNumber, `${inv.entryNumber} ${pmt.entryNumber}`);
    ok('stop and start are in the audit log with their reasons', (await ctx.auditsOf('LEDGER_DEACTIVATED')).some((a) => /pause/.test(a.details.reason)) && (await ctx.auditsOf('LEDGER_RESUMED')).some((a) => /Pause over/.test(a.details.reason)));
    ok('nothing is left unrecorded', (await check('COMPLETENESS')).status === 'MATCH');
  });

  await S('An event is recorded once whatever is tried: the database holds one event and one entry per business record', async (ok) => {
    const r = await ctx.shipped(100, { price: 0.5 });
    const e = await eventOf('INVOICE_ISSUED', 'Invoice', r.invoice.id);
    ok('a second event row for the same invoice is refused by the database', /23505|already exists|Unique/i.test(await sql(`INSERT INTO "LedgerEvent" ("id","eventKind","sourceType","sourceId","status","occurredAt","updatedAt") VALUES ($1,'INVOICE_ISSUED','Invoice',$2,'PENDING',now(),now())`, tag('qa-ev'), r.invoice.id) || ''));
    const period = await prisma.ledgerPeriod.findFirst({ where: { status: 'OPEN' }, orderBy: [{ year: 'desc' }, { month: 'desc' }] });
    const dup = await sql(`INSERT INTO "JournalEntry" ("id","entryNumber","entryDate","periodId","status","kind","eventKind","sourceType","sourceId") VALUES ($1,$2,$3::date,$4,'DRAFT','SYSTEM','INVOICE_ISSUED','Invoice',$5)`, tag('qa-je'), tag('JE-QA'), today, period.id, r.invoice.id);
    ok('a second system entry for the same invoice is refused by the database', /23505|already exists|Unique/i.test(dup || ''), dup);
    const m = await movement(() => ctx.all(4, () => cfo.post(`/api/ledger/events/${e.id}/retry`)));
    ok('retrying a posted event four times at once posts nothing', m.out.every((x) => x.status === 409) && Object.keys(m.delta).length === 0, m.out.map((x) => x.status).join(','));
    ok('record-missing finds nothing to add for it', (await cfo.post('/api/ledger/events/record-missing', {})).body.found === 0);
    ok('one entry exists for the invoice', (await prisma.journalEntry.count({ where: { sourceType: 'Invoice', sourceId: r.invoice.id } })) === 1);
    const numbers = await prisma.$queryRaw`SELECT COUNT(*)::int AS n, COUNT(DISTINCT "entryNumber")::int AS d FROM "JournalEntry"`;
    ok('every entry number is used once', numbers[0].n === numbers[0].d);
  });

  await S('Garbage in: malformed, hostile and oversized requests are refused with a reason, never a server error, and change nothing', async (ok) => {
    const before = await snapshot();
    const calls = [
      ['post', '/entries', { entryDate: today, memo: 'Garbage test', lines: [{ accountCode: { $ne: null }, debit: 1 }, C('2200', 1)] }], ['post', '/entries', { entryDate: { $gt: '' }, memo: 'Garbage test', lines: [D('5100', 1), C('2200', 1)] }],
      ['post', '/entries', { entryDate: today, memo: ['a', 'b'], lines: [D('5100', 1), C('2200', 1)] }], ['post', '/entries', null], ['post', '/entries', { entryDate: today, memo: 'Garbage test', lines: [null, null] }],
      ['get', '/reports/account?code=%27%20OR%201%3D1%20--'], ['get', '/reports/revenue?by=__proto__'], ['get', '/reports/revenue?by=constructor'], ['get', '/reports/gross-margin?by=customer'], ['get', '/reports/monthly?year=abc&month=def'], ['get', '/reports/trial-balance?from=%27%3B%20DROP%20TABLE%20%22JournalEntry%22%3B--'],
      ['get', '/reports/__proto__'], ['get', '/reports/constructor'], ['get', '/entries?from=garbage'], ['post', '/periods/abc/def/close'], ['post', '/periods/2026/99/reopen', { reason: 'A long enough reason' }], ['post', '/periods/1999/1/reopen', { reason: 'A long enough reason' }],
      ['post', '/events/%27%3B%20DROP%20TABLE/retry'], ['post', '/events/nope/resolve', { note: 'A long enough note' }], ['get', '/reconciliations/nope'], ['post', '/exports', { provider: { a: 1 }, from: today, to: today }], ['post', '/exports', { provider: 'GENERIC', from: 'x', to: 'y' }], ['post', '/exports', { provider: 'GENERIC', from: today, to: '2020-01-01' }],
      ['get', '/exports/nope/file'], ['post', '/exports/nope/settle', { status: 'VOID', error: 'A reason' }], ['put', '/external-accounts/GENERIC/1100', { externalAccount: 'x'.repeat(500) }], ['put', '/external-accounts/NOPE/1100', { externalAccount: 'x' }], ['put', '/external-accounts/GENERIC/9999', { externalAccount: 'x' }],
      ['put', '/accounts/12ab', { name: 'Bad code', type: 'EXPENSE' }], ['put', '/accounts/6200', { name: 'Bad type', type: 'ASSET; DROP TABLE' }], ['put', '/accounts/6200', { name: 'x', type: 'EXPENSE' }], ['put', '/mappings/NOPE', { accountCode: '1000' }], ['put', '/mappings/RECEIVABLES', { accountCode: '9999' }],
      ['post', '/approvals', { accounts: 'ALL', approvedBy: '' }], ['post', '/approvals', { accounts: { $ne: 1 }, approvedBy: 'Somebody Real' }], ['post', '/activate', { timeZone: 'Mars/Phobos', policiesApprovedBy: 'x' }], ['put', '/settings', { throughWip: 'yes' }], ['post', '/entries/nope/post'], ['post', '/entries/nope/reverse', { reason: 'A long enough reason' }], ['del', '/entries/nope'],
    ];
    const out = []; for (const [m, u, b] of calls) { const r = await cfo[m](`/api/ledger${u}`, b); out.push([`${m} ${u}`.slice(0, 70), r.status, err(r)]); }
    ok('every one is refused with a 4xx', out.every(([, s]) => s >= 400 && s < 500), out.filter(([, s]) => !(s >= 400 && s < 500)).map((x) => x.join(' ')).join(' ; '));
    ok('every refusal says why', out.every(([, , e]) => e.length > 3), out.filter(([, , e]) => !(e.length > 3)).map((x) => x.join(' ')).join(' ; '));
    ok('no refusal leaks a database or stack message', out.every(([, , e]) => !/prisma|SELECT |syntax error|at async|node_modules/i.test(e)), out.filter(([, , e]) => /prisma|SELECT |syntax error|at async|node_modules/i.test(e)).map((x) => x.join(' ')).join(' ; '));
    const lists = [await cfo.get('/api/ledger/entries?limit=-5&offset=abc'), await cfo.get('/api/ledger/entries?limit=999999'), await cfo.get('/api/ledger/reports/exceptions?limit=999999&status=nope'), await cfo.get('/api/ledger/entries?status=nope&kind=nope')];
    ok('odd paging is refused or tamed, never obeyed', lists.every((r) => [200, 400].includes(r.status)) && lists.filter((r) => r.status === 200 && r.body.entries).every((r) => r.body.entries.length <= 200), lists.map((r) => r.status).join(','));
    ok('nothing changed and the tables are there', (await snapshot()) === before);
  });

  await S('Every change to the books is in the audit log with the person, and every report read is logged with the reader\'s role', async (ok) => {
    const want = ['LEDGER_CUTOVER_DRY_RUN', 'LEDGER_ACTIVATED', 'LEDGER_APPROVAL_RECORDED', 'LEDGER_ENTRY_DRAFTED', 'LEDGER_ENTRY_POSTED', 'LEDGER_DRAFT_DELETED', 'LEDGER_ENTRY_REVERSED', 'LEDGER_EVENT_RETRIED', 'LEDGER_MISSING_RECORDED', 'LEDGER_MAPPING_CHANGED', 'LEDGER_ACCOUNT_ADDED', 'LEDGER_ACCOUNT_CHANGED', 'LEDGER_DEACTIVATED', 'LEDGER_RESUMED', 'LEDGER_PERIOD_CLOSED'];
    for (const t of want) { const rows = await ctx.auditsOf(t); ok(`${t}: logged with a person`, rows.length >= 1 && rows.every((a) => a.userId), `${rows.length}`); }
    const reads = await ctx.auditsOf('LEDGER_REPORT_READ');
    ok('report reads are logged with the role and the scope', reads.some((a) => a.details.role === 'AUDITOR' && a.details.scope === 'all') && reads.some((a) => a.details.role === 'BRANCH_MANAGER' && a.details.scope === 'own branches'));
    ok('refused reads are not logged as reads', !reads.some((a) => ['SALES_REP', 'OPERATOR_SAW', 'CUSTOMER_ADMIN'].includes(a.details.role)));
    const sys = await prisma.journalEntry.count({ where: { kind: { in: ['SYSTEM', 'REVERSAL', 'MANUAL'] }, createdById: null, createdByService: null, NOT: { entryNumber: { startsWith: 'JE-QA' } } } }); // JE-QA: the one entry this run posted by SQL to test the database guard
    ok('every entry names the person or the service that wrote it', sys === 0, sys);
    const manual = await prisma.journalEntry.count({ where: { kind: 'MANUAL', status: 'POSTED', createdById: { not: null }, postedById: { not: null } } });
    const same = (await prisma.$queryRaw`SELECT COUNT(*)::int AS n FROM "JournalEntry" WHERE "kind" = 'MANUAL' AND "status" = 'POSTED' AND "createdById" = "postedById"`)[0].n;
    ok('no posted manual entry was written and posted by the same person', manual > 0 && same === 0, `${manual} ${same}`);
  });

  await S('The assistant reads the ledger for the people who may, within their scope, and can change nothing; every read and refusal is logged', async (ok) => {
    const ask = (who, content) => who.post('/api/ai/assistant', { messages: [{ role: 'user', content }] });
    const told = () => { const h = ctx.hitsOf('ai').pop(); if (!h) return ''; try { return JSON.parse(h.body).messages.map((m) => m.content).join('\n'); } catch { return h.body; } };
    const before = await snapshot();
    let own = true;
    try { await ctx.startStub(); } catch { own = false; } // another run's stand-in is already listening
    try {
      ctx.setMode('ai', { status: 200 }); ctx.clearHits('ai');
      const a = await ask(cfo, 'What are our receivables and the trial balance?');
      ok('the CFO is answered', a.status === 200 && a.body.queryTypes.includes('ledger'), `${a.status} ${JSON.stringify(a.body).slice(0, 200)}`);
      if (own) {
        const t = told(); const ar = (await cfo.get('/api/ledger/reports/receivables')).body.totals;
        ok('the assistant was given company figures: the receivables in the books', t.includes('"access": "company"') && t.includes(`"inTheBooks": "${ar.ledger}"`), t.slice(0, 300));
        ok('and the rules: read only, not a P&L, not the full accounts', /cannot post, change, approve, reverse or export/.test(t) && /Never call \\?"gross margin on material/.test(t) && /not the company's full accounts/.test(t));
        ctx.clearHits('ai');
        await ask(bm1, 'What is the revenue of my branch in the ledger?');
        const b = told(); const mine = (await bm1.get('/api/ledger/reports/revenue')).body.total;
        ok('a branch manager\'s question is answered from their own branch only', b.includes('"access": "own branches"') && b.includes(`"netSales": "${mine}"`) && !b.includes('"receivables"') && !b.includes('salesTaxPayableByState'), b.slice(0, 300));
        ctx.clearHits('ai');
        await ask(sales, 'Tell me the trial balance and accounts receivable');
        const s = told();
        ok('a sales rep\'s question carries no ledger figure, only the instruction to refuse', s.includes('"access": "none"') && !s.includes('accountBalances') && !s.includes('netSales') && /Give no ledger figure/.test(s), s.slice(0, 300));
        ctx.clearHits('ai');
        await ask(cfo, 'Post a journal entry in the ledger moving 500 from receivables to cash');
        ok('asked to post, the assistant is given the same read-only figures and nothing else happens', told().includes('"access": "company"'));
      }
      const logs = await ctx.auditsOf('LEDGER_AI_READ');
      ok('the reads are in the audit log with role and scope', logs.some((l) => l.userId === cfo.user.id && l.details.outcome === 'READ' && l.details.scope === 'all') && (!own || logs.some((l) => l.userId === bm1.user.id && l.details.scope === 'own branches')));
      ok('the refusal is in the audit log', !own || logs.some((l) => l.userId === sales.user.id && l.details.outcome === 'REFUSED'));
      ok('nothing in the books changed', (await snapshot()) === before);
    } finally { if (own) await ctx.stopStub(); }
  });

  await S('At the end of every scenario the books still balance and agree with the records; what does not agree is a held event with its reason', async (ok) => {
    const r = await cfo.post('/api/ledger/reconciliations');
    const by = Object.fromEntries(r.body.checks.map((c) => [c.key, c]));
    for (const k of ['BOOKS_BALANCE', 'RECEIVABLES', 'IN_TRANSIT', 'REVENUE', 'SALES_TAX', 'PAYMENTS', 'COMPLETENESS']) ok(`${k} matches`, by[k].status === 'MATCH', `${by[k].status} ledger ${by[k].ledger} records ${by[k].records} ${JSON.stringify(by[k].detail || []).slice(0, 300)}`);
    const held = await prisma.ledgerEvent.findMany({ where: { status: { in: ['FAILED', 'RECONCILIATION_REQUIRED', 'PENDING'] } } });
    const heldItems = new Set();
    for (const e of held) { if (e.sourceType === 'MaterialMovement') heldItems.add((await prisma.materialMovement.findUnique({ where: { id: e.sourceId }, select: { coilId: true } }))?.coilId); else if (e.sourceType === 'StockTransferLine') heldItems.add((await prisma.stockTransferLine.findUnique({ where: { id: e.sourceId }, select: { coilId: true } }))?.coilId); else if (e.sourceType === 'WorkOrder') { const w = await prisma.workOrder.findUnique({ where: { id: e.sourceId }, select: { sourceCoilId: true, outputs: { select: { outputCoilId: true } } } }); heldItems.add(w?.sourceCoilId); for (const o of w?.outputs || []) heldItems.add(o.outputCoilId); } }
    const unexplained = (by.INVENTORY.detail || []).filter((d) => !heldItems.has(d.coilId));
    ok('stock agrees item by item, except items with a held event of their own', ['MATCH', 'ROUNDING'].includes(by.INVENTORY.status) || unexplained.length === 0, `${by.INVENTORY.status} ${JSON.stringify(unexplained).slice(0, 400)}`);
    ok('every open event has a reason', held.every((e) => e.reason && e.reason.length > 10));
    ok('the trial balance balances', (await ctx.balances()).balanced);
    state.final = { held: held.length, tookMs: r.body.tookMs, entries: await prisma.journalEntry.count(), lines: await prisma.journalLine.count() };
  });
}
