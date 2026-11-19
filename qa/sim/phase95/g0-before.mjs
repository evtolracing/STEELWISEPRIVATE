// Before the books begin, and the cutover itself. These always run: every other group needs an active ledger.
import { PROPOSED_ACCOUNTS } from '../../../src/backend/src/lib/ledgerRules.js';
export default async function before(ctx) {
  const { scenario, G, prisma, A, B, cfo, cfo2, owner, auditor, exec, bm1, sales, L1, L2, near, err, tag, num } = ctx;
  const S = (name, fn) => scenario(G.books, name, fn, { always: true });
  const state = {};
  await ctx.resetLedger();
  const entries = () => prisma.journalEntry.count();
  const events = () => prisma.ledgerEvent.count();

  // Business done before the books begin: this is what the opening balances must pick up.
  const pre = {};
  pre.open = await ctx.shipped(800, { cost: 0.4, price: 0.75, taxRate: 0.06, state: 'MI' }); // 600.00 + 36.00 tax, unpaid
  pre.part = await ctx.shipped(400, { cost: 0.4, price: 0.5 }); // 200.00, 50.00 paid
  await ctx.pay(pre.part.invoice.id, 50);
  pre.over = await ctx.shipped(300, { cost: 0.4, price: 1 }); // 300.00 paid in full, then 120.00 credited: 120.00 owed back
  await ctx.pay(pre.over.invoice.id, 300);
  pre.credit = await ctx.creditMemo(pre.over.invoice.id, { reason: 'Price agreed after the fact', amount: 120 });
  pre.toCancel = await ctx.shipped(200, { cost: 0.4, price: 0.5 }); // 100.00, to be cancelled after the books begin
  pre.stock = await ctx.costed(3000, 0.42);
  pre.noCost = await ctx.uncosted(1500);
  pre.moving = await ctx.costed(2000, 0.35);
  pre.transfer = await ctx.transfer([pre.moving.coilId], L2);
  state.pre = pre;

  await S('Before activation, a sale, a payment, a receipt and a shipment post nothing', async (ok) => {
    const status = await cfo.get('/api/ledger/status');
    ok('the status says not active', status.status === 200 && status.body.active === false && /Not active/.test(status.body.message), JSON.stringify(status.body).slice(0, 200));
    ok('the business records were saved', pre.open.invoice && num(pre.open.invoice.totalAmount) === 636 && pre.credit.status === 201, `${pre.open.invoice?.totalAmount} ${pre.credit.status}`);
    ok('no journal entry exists', (await entries()) === 0, await entries());
    ok('no ledger event exists', (await events()) === 0, await events());
    ok('no period exists', (await prisma.ledgerPeriod.count()) === 0);
  });

  await S('Activation is refused while nothing is approved, and says exactly what is missing', async (ok) => {
    const dry = await cfo.post('/api/ledger/cutover/dry-run');
    const r = await owner.post('/api/ledger/activate', { policiesApprovedBy: 'QA Synthetic Accountant', policiesApprovedOn: ctx.today(), dryRunId: dry.body.dryRunId, timeZone: 'America/Detroit' });
    ok('refused with 409', r.status === 409 && r.body.code === 'NOT_APPROVED', `${r.status} ${err(r)}`);
    ok('it names the chart', /chart of accounts has not been loaded/.test(err(r)), err(r));
    ok('the dry run lists the same blockers', dry.status === 200 && dry.body.blockers.length > 0);
    ok('still not active', (await ctx.activationRow()) === null);
  });

  await S('The proposed chart loads once, unapproved, and loading it again adds nothing', async (ok) => {
    const a = await cfo.post('/api/ledger/chart/load-proposed');
    const b = await cfo.post('/api/ledger/chart/load-proposed');
    const chart = await cfo.get('/api/ledger/chart');
    ok(`the whole proposed chart (${PROPOSED_ACCOUNTS.length} accounts) and 17 mappings were written`, a.status === 201 && a.body.accounts === PROPOSED_ACCOUNTS.length && PROPOSED_ACCOUNTS.length >= 100 && a.body.mappings === 17, JSON.stringify(a.body));
    ok('the second load adds nothing', b.body.accounts === 0 && b.body.mappings === 0, JSON.stringify(b.body));
    ok('none is approved', chart.body.accounts.every((x) => !x.approvedAt) && chart.body.mappings.every((m) => !m.approvedAt));
    ok('the proposed accounts are there', ['1000', '1100', '1200', '1210', '1220', '1300', '2000', '2100', '2200', '3000', '4000', '4100', '4200', '4300', '5000', '5100', '5200', '5300'].every((c) => chart.body.accounts.some((x) => x.code === c)));
    ok('the load is in the audit log', (await ctx.auditsOf('LEDGER_CHART_LOADED')).filter((x) => x.timestamp >= ctx.startedAt).length === 1);
  });

  await S('A loaded but unapproved chart still blocks activation, account by account', async (ok) => {
    const dry = await cfo.post('/api/ledger/cutover/dry-run');
    const r = await owner.post('/api/ledger/activate', { policiesApprovedBy: 'QA Synthetic Accountant', policiesApprovedOn: ctx.today(), dryRunId: dry.body.dryRunId, timeZone: 'America/Detroit' });
    ok('refused', r.status === 409 && /not approved/.test(err(r)), `${r.status} ${err(r)}`);
    const part = await cfo.post('/api/ledger/approvals', { accounts: ['1000', '1100'], mappings: ['RECEIVABLES'], approvedBy: 'QA Synthetic Accountant' });
    ok('two accounts and one mapping approved', part.status === 200 && part.body.accountsApproved === 2 && part.body.mappingsApproved === 1, JSON.stringify(part.body));
    const again = await owner.post('/api/ledger/activate', { policiesApprovedBy: 'QA Synthetic Accountant', policiesApprovedOn: ctx.today(), dryRunId: dry.body.dryRunId, timeZone: 'America/Detroit' });
    ok('a partly approved chart is still refused', again.status === 409 && new RegExp(`${PROPOSED_ACCOUNTS.length - 2} accounts are not approved`).test(err(again)), err(again));
    ok('an approval needs the accountant\'s name', (await cfo.post('/api/ledger/approvals', { accounts: 'ALL', mappings: 'ALL' })).status === 400);
  });

  await S('The accountant\'s approval is recorded with a name; a mapping that is changed loses its approval', async (ok) => {
    const all = await cfo.post('/api/ledger/approvals', { accounts: 'ALL', mappings: 'ALL', approvedBy: 'QA Synthetic Accountant (test data only)' });
    ok('the rest is approved', all.status === 200 && all.body.accountsApproved === PROPOSED_ACCOUNTS.length - 2 && all.body.mappingsApproved === 16, JSON.stringify(all.body));
    const chart = (await cfo.get('/api/ledger/chart')).body;
    ok('no blocker is left', chart.blockers.length === 0, chart.blockers.join(' '));
    const moved = await cfo.put('/api/ledger/mappings/ROUNDING', { accountCode: '5320' });
    const after = (await cfo.get('/api/ledger/chart')).body;
    ok('changing a mapping removes its approval', moved.status === 200 && after.mappings.find((m) => m.key === 'ROUNDING').approvedAt === null && after.blockers.some((b) => /ROUNDING is not approved/.test(b)), after.blockers.join(' '));
    await cfo.put('/api/ledger/mappings/ROUNDING', { accountCode: '5390' });
    await cfo.post('/api/ledger/approvals', { mappings: ['ROUNDING'], approvedBy: 'QA Synthetic Accountant (test data only)' });
    ok('a mapping to an account that does not exist is refused', (await cfo.put('/api/ledger/mappings/ROUNDING', { accountCode: '9999' })).status === 400);
    ok('an unknown posting purpose is refused', (await cfo.put('/api/ledger/mappings/ANYTHING', { accountCode: '1000' })).status === 400);
    ok('who recorded the approval is in the audit log', (await ctx.auditsOf('LEDGER_APPROVAL_RECORDED')).some((a) => a.userId === cfo.user.id && a.details.approvedBy.includes('QA Synthetic')));
    ok('still nothing posted', (await entries()) === 0);
  });

  await S('Only the owner, a super administrator or the CFO can start the books; activation needs a name, a date, a time zone and a dry run', async (ok) => {
    const dry = await cfo.post('/api/ledger/cutover/dry-run');
    const body = { policiesApprovedBy: 'QA Synthetic Accountant', policiesApprovedOn: ctx.today(), dryRunId: dry.body.dryRunId, timeZone: 'America/Detroit' };
    const tries = { administrator: await ctx.admin2.post('/api/ledger/activate', body), auditor: await auditor.post('/api/ledger/activate', body), executive: await exec.post('/api/ledger/activate', body), manager: await bm1.post('/api/ledger/activate', body), sales: await sales.post('/api/ledger/activate', body) };
    for (const [who, r] of Object.entries(tries)) ok(`${who} is refused`, r.status === 403, `${r.status} ${err(r)}`);
    ok('no accountant name: refused', (await owner.post('/api/ledger/activate', { ...body, policiesApprovedBy: '' })).status === 400);
    ok('no approval date: refused', (await owner.post('/api/ledger/activate', { ...body, policiesApprovedOn: null })).status === 400);
    ok('no time zone: refused', (await owner.post('/api/ledger/activate', { ...body, timeZone: 'Mars/Olympus' })).status === 400);
    ok('no dry run: refused', (await owner.post('/api/ledger/activate', { ...body, dryRunId: null })).status === 400);
    ok('a made-up dry run: refused', (await owner.post('/api/ledger/activate', { ...body, dryRunId: ctx.crypto.randomUUID() })).status === 400);
    ok('still not active', (await ctx.activationRow()) === null && (await entries()) === 0);
  });

  await S('The cutover dry run shows the opening balances from the records and writes nothing to the books', async (ok) => {
    const dry = await cfo.post('/api/ledger/cutover/dry-run');
    const [ar] = await prisma.$queryRaw`SELECT COALESCE(SUM("totalAmount" - "paidAmount"), 0)::float AS v, COALESCE(SUM("totalAmount" - "paidAmount") FILTER (WHERE "kind" <> 'CREDIT'), 0)::float AS owed FROM "Invoice" WHERE "status" <> 'CANCELLED'`;
    const [st] = await prisma.$queryRaw`SELECT COALESCE(SUM(ROUND(v."qtyOnHand" * c."unitCost", 2)), 0)::float AS v, COUNT(*) FILTER (WHERE c."unitCost" IS NULL)::int AS uncosted FROM "Inventory" v JOIN "Coil" c ON c."id" = v."coilId" WHERE v."qtyOnHand" > 0`;
    ok('answers', dry.status === 200 && dry.body.dryRunId, `${dry.status} ${err(dry)}`);
    ok('net receivables equal the open invoices less credit owed back', near(dry.body.totals.netReceivables, ar.v), `${dry.body.totals.netReceivables} vs ${ar.v}`);
    ok('what is owed is shown apart from what is owed back', near(dry.body.totals.receivables, ar.owed) && Number(dry.body.totals.creditOwedBack) >= 120, JSON.stringify(dry.body.totals));
    ok('stock value equals quantity times cost of the costed items', near(dry.body.totals.stockValue, st.v), `${dry.body.totals.stockValue} vs ${st.v}`);
    ok('items with no cost are listed, not valued at zero', dry.body.totals.uncostedItems === st.uncosted && st.uncosted > 0 && dry.body.uncosted.length > 0, `${dry.body.totals.uncostedItems} vs ${st.uncosted}`);
    ok('it says what it does not open', dry.body.notOpened.some((n) => /Sales tax/.test(n)) && dry.body.notOpened.some((n) => /Cash/.test(n)));
    ok('nothing was posted', (await entries()) === 0 && (await events()) === 0);
    ok('an auditor cannot run it', (await auditor.post('/api/ledger/cutover/dry-run')).status === 403);
    state.dry = dry.body;
  });

  await S('Activation posts the opening balances from the records at that moment, balanced against opening equity', async (ok) => {
    const r = await owner.post('/api/ledger/activate', { policiesApprovedBy: 'QA Synthetic Accountant (test data only)', policiesApprovedOn: ctx.today(), dryRunId: state.dry.dryRunId, timeZone: 'America/Detroit' });
    ok('activated', r.status === 200 && r.body.active === true && r.body.opening.entries > 0, `${r.status} ${err(r)}`);
    const t = await ctx.balances();
    ok('the books balance', t.balanced, JSON.stringify(t.totals));
    ok('receivables equal the dry run', near(t.of('1100'), state.dry.totals.netReceivables), `${t.of('1100')} vs ${state.dry.totals.netReceivables}`);
    ok('stock equals the dry run, with in-transit stock moved to its own account', near(t.of('1200') + t.of('1210') + t.of('1300'), state.dry.totals.stockValue) && t.of('1300') >= 700 - 0.005 && t.of('1300') <= Number(state.dry.totals.stockInTransit) + 0.005, `${t.of('1200')} + ${t.of('1210')} + ${t.of('1300')} vs ${state.dry.totals.stockValue}`);
    ok('the other side is opening equity', near(-t.of('3000'), t.of('1100') + t.of('1200') + t.of('1210') + t.of('1300')), `${t.of('3000')}`);
    ok('no revenue, tax, cash or payables were opened', ['1000', '2000', '2100', '4000', '4200', '5000'].every((c) => near(t.of(c), 0)), JSON.stringify(t.by));
    const opening = await prisma.journalEntry.findMany({ where: { kind: 'OPENING' }, select: { status: true, entryDate: true } });
    ok('every opening entry is posted and dated the cutover day', opening.length === r.body.opening.entries && opening.every((e) => e.status === 'POSTED' && e.entryDate.toISOString().slice(0, 10) === r.body.effectiveDate));
    ok('the uncosted item is on no line', (await prisma.journalLine.count({ where: { coilId: state.pre.noCost } })) === 0);
    ok('the activation is in the audit log with the accountant\'s name', (await ctx.auditsOf('LEDGER_ACTIVATED')).some((a) => a.userId === owner.user.id && /QA Synthetic/.test(a.details.policiesApprovedBy)));
    const again = await owner.post('/api/ledger/activate', { policiesApprovedBy: 'QA Synthetic Accountant', policiesApprovedOn: ctx.today(), dryRunId: state.dry.dryRunId, timeZone: 'America/Detroit' });
    ok('a second activation is refused and posts nothing more', again.status === 409 && (await prisma.journalEntry.count({ where: { kind: 'OPENING' } })) === opening.length, `${again.status}`);
    state.activation = r.body;
  });

  await S('Right after cutover the books agree with the records: the reconciliation finds no difference', async (ok) => {
    const r = await cfo.post('/api/ledger/reconciliations');
    ok('ran', r.status === 201, `${r.status} ${err(r)}`);
    const by = Object.fromEntries((r.body.checks || []).map((c) => [c.key, c]));
    for (const k of ['BOOKS_BALANCE', 'RECEIVABLES', 'IN_TRANSIT', 'REVENUE', 'SALES_TAX', 'PAYMENTS', 'COMPLETENESS']) ok(`${k} matches`, by[k]?.status === 'MATCH', `${by[k]?.status} ledger ${by[k]?.ledger} records ${by[k]?.records} ${by[k]?.note || ''} ${JSON.stringify(by[k]?.detail || []).slice(0, 300)}`);
    ok('stock matches item by item', ['MATCH', 'ROUNDING'].includes(by.INVENTORY?.status), `${by.INVENTORY?.status} ${by.INVENTORY?.note} ${JSON.stringify(by.INVENTORY?.detail || []).slice(0, 300)}`);
    // Stock that was on a truck at cutover with no cost on file cannot be valued: each such line is held, by name, until its cost is entered.
    const open = await prisma.ledgerEvent.findMany({ where: { status: { in: ['FAILED', 'RECONCILIATION_REQUIRED', 'PENDING'] } } });
    ok('the only open events are in-transit items with no cost, each held by name', open.every((e) => e.eventKind === 'TRANSFER_SHIPPED' && e.status === 'RECONCILIATION_REQUIRED' && /No cost is on file|different owning/.test(e.reason)), open.map((e) => `${e.eventKind} ${e.reason}`).join(' | ').slice(0, 400));
    ok('nothing else fails', r.body.failing.every((k) => k === 'EVENTS'), r.body.failing?.join(','));
    state.heldAtCutover = open.length;
    state.cutoverReconcileMs = r.body.tookMs;
  });

  // The scenarios need past months to close. On the QA database the cutover day is moved back 75 days;
  // the opening entries keep their own date. Nothing else is changed.
  const value = await ctx.activationRow();
  const back = new Date(Date.now() - 75 * 86_400_000).toISOString().slice(0, 10);
  await prisma.appSetting.update({ where: { key: 'ledger.activation' }, data: { value: { ...value, effectiveDate: back, qaMovedBackFrom: value.effectiveDate } } });
  state.cutoverDay = value.effectiveDate; state.booksBegin = back;
  return state;
}
