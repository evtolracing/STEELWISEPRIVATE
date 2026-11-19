// The finance ledger sandbox: demonstration books started in one step with the full chart of accounts, marked
// SANDBOX everywhere, and the two financial statements. Through the real server; the database is read back.
//   node qa/sim/ledger-sandbox.mjs --base http://localhost:3011
// Local QA database only. It empties the QA ledger first (the product itself never can), then starts sandbox books.
import fs from 'node:fs';
import * as c from './phase95/ctx.mjs';
import { finish } from './phase4-lib.mjs';

const { prisma, cfo, cfo2, owner, admin2, auditor, sales, bm1, err, today } = c;
const G = 'Finance ledger sandbox';
const S = (name, fn) => c.scenario(G, name, fn);
const num = (v) => Number(v);
const PHRASE = 'START SANDBOX BOOKS';
const post = async (lines, memo) => { const d = await c.draft(lines, { memo }); if (d.status !== 201) throw new Error(`draft ${d.status} ${err(d)}`); const p = await cfo2.post(`/api/ledger/entries/${d.body.id}/post`); if (p.status !== 200) throw new Error(`post ${p.status} ${err(p)}`); return p.body; };

await c.resetLedger();
// Business done before the books begin: the sandbox opening balances must pick it up.
const before = await c.shipped(500, { cost: 0.4, price: 0.8 }); // 400.00 owed

await S('Before the start: nothing is posted, and the ordinary path refuses the sandbox name', async (ok) => {
  const st = await cfo.get('/api/ledger/status');
  ok('the ledger is not active and not a sandbox', st.body.active === false && st.body.sandbox === false, JSON.stringify(st.body).slice(0, 120));
  await cfo.post('/api/ledger/chart/load-proposed');
  const chart = await cfo.get('/api/ledger/chart');
  ok('the full chart is loaded: 100 accounts or more, none approved', chart.body.accounts.length >= 100 && chart.body.accounts.every((a) => !a.approvedAt), chart.body.accounts.length);
  const contra = chart.body.accounts.find((a) => a.code === '1590');
  ok('accumulated depreciation is an asset account that carries a credit balance', contra?.type === 'ASSET' && contra?.normalSide === 'CREDIT', `${contra?.type} ${contra?.normalSide}`);
  const r = await owner.post('/api/ledger/activate', { policiesApprovedBy: 'Sandbox Sam', policiesApprovedOn: today(), dryRunId: 'x', timeZone: 'America/Detroit' });
  ok('real books cannot be opened under a sandbox name', r.status === 400 && /demonstration/.test(err(r)), `${r.status} ${err(r)}`);
});

await S('Starting the sandbox: only the owner, a super administrator or the CFO, and only with the phrase', async (ok) => {
  for (const [who, name] of [[admin2, 'an administrator'], [auditor, 'the auditor'], [sales, 'a sales representative'], [bm1, 'a branch manager']]) { const r = await who.post('/api/ledger/sandbox/start', { confirm: PHRASE }); ok(`${name} is refused`, r.status === 403, r.status); }
  const no = await owner.post('/api/ledger/sandbox/start', {});
  ok('without the phrase it is refused and nothing starts', no.status === 400 && (await cfo.get('/api/ledger/status')).body.active === false, `${no.status} ${err(no)}`);
  const zone = await owner.post('/api/ledger/sandbox/start', { confirm: PHRASE, timeZone: 'Mars/Olympus' });
  ok('a time zone that does not exist is refused', zone.status === 400, zone.status);
  const r = await owner.post('/api/ledger/sandbox/start', { confirm: PHRASE, timeZone: 'America/Detroit' });
  ok('with the phrase the books start', r.status === 200 && r.body.active === true && r.body.sandbox === true, `${r.status} ${err(r)}`);
  ok('the answer says SANDBOX and names no accountant', /^SANDBOX/.test(r.body.notice || '') && /^SANDBOX/.test(r.body.policiesApprovedBy || ''), r.body.policiesApprovedBy);
  ok('the opening balances carry the invoice that was open', num(r.body.opening?.receivables ?? r.body.opening?.totals?.receivables ?? 0) >= 400 || JSON.stringify(r.body.opening).includes('400'), JSON.stringify(r.body.opening).slice(0, 200));
  const again = await owner.post('/api/ledger/sandbox/start', { confirm: PHRASE });
  ok('a second start is refused', again.status === 409, `${again.status} ${err(again)}`);
  const row = await c.activationRow();
  ok('the mark is saved with the books', row?.sandbox === true && row.active === true, JSON.stringify(row).slice(0, 120));
  ok('the start is in the audit trail under the person', (await prisma.auditLog.count({ where: { eventType: 'LEDGER_SANDBOX_STARTED', userId: owner.user.id } })) === 1);
  const accounts = await prisma.ledgerAccount.findMany();
  ok('every account is recorded as approved by the sandbox, not by a person', accounts.length >= 100 && accounts.every((a) => /^SANDBOX/.test(a.approvedBy || '')), accounts.find((a) => !/^SANDBOX/.test(a.approvedBy || ''))?.code);
});

await S('Every reader is told these are sandbox books', async (ok) => {
  for (const [who, name] of [[cfo, 'the CFO'], [auditor, 'the auditor'], [bm1, 'a branch manager']]) { const st = await who.get('/api/ledger/status'); ok(`${name} sees the mark on the status`, st.body.sandbox === true && /^SANDBOX/.test(st.body.sandboxNotice || ''), JSON.stringify(st.body).slice(0, 100)); }
  const bs = await cfo.get('/api/ledger/reports/balance-sheet'); const is = await cfo.get('/api/ledger/reports/income-statement');
  ok('the balance sheet carries the notice', bs.status === 200 && bs.body.sandbox === true && /^SANDBOX/.test(bs.body.sandboxNotice), bs.status);
  ok('the income statement carries the notice', is.status === 200 && is.body.sandbox === true && /^SANDBOX/.test(is.body.sandboxNotice), is.status);
  ok('a branch manager cannot read the company statements', (await bm1.get('/api/ledger/reports/balance-sheet')).status === 403 && (await bm1.get('/api/ledger/reports/income-statement')).status === 403);
  ok('a sales representative cannot read them', (await sales.get('/api/ledger/reports/balance-sheet')).status === 403);
});

await S('The balance sheet balances from the opening balances alone', async (ok) => {
  const bs = (await cfo.get('/api/ledger/reports/balance-sheet')).body;
  ok('assets equal liabilities and equity', bs.balanced === true && bs.difference === '0.00', `${bs.totals?.assets} / ${bs.totals?.liabilitiesAndEquity} / ${bs.difference}`);
  ok('receivables show what the open invoice is owed', (bs.sections.find((s) => s.key === 'CURRENT_ASSETS').accounts.find((a) => a.code === '1100')?.amount ?? '0') >= '400.00' || num(bs.sections.find((s) => s.key === 'CURRENT_ASSETS').accounts.find((a) => a.code === '1100')?.amount) >= 400, JSON.stringify(bs.sections[0].accounts).slice(0, 200));
  ok('it agrees with the trial balance, which balances', (await cfo.get('/api/ledger/reports/trial-balance')).body.balanced === true);
  ok(`the invoice opened before the start (${before.invoice.invoiceNumber}) made no revenue in the books`, (await cfo.get('/api/ledger/reports/income-statement')).body.summary.netSales === '0.00');
});

await S('A month of a small company, by journal entry and by business events, reads correctly on both statements', async (ok) => {
  await post([{ accountCode: '1010', debit: 250000 }, { accountCode: '3100', credit: 250000 }], 'Sandbox: owners pay in capital');
  await post([{ accountCode: '1520', debit: 120000 }, { accountCode: '1010', credit: 20000 }, { accountCode: '2600', credit: 100000 }], 'Sandbox: a saw bought, part on a loan');
  await post([{ accountCode: '6100', debit: 8000 }, { accountCode: '6000', debit: 30000 }, { accountCode: '6110', debit: 1500 }, { accountCode: '1010', credit: 39500 }], 'Sandbox: rent, salaries and utilities paid');
  await post([{ accountCode: '6700', debit: 2000 }, { accountCode: '1590', credit: 2000 }], 'Sandbox: depreciation for the month');
  await post([{ accountCode: '7100', debit: 600 }, { accountCode: '2340', credit: 600 }], 'Sandbox: interest accrued on the loan');
  await post([{ accountCode: '4310', debit: 50 }, { accountCode: '1150', credit: 50 }], 'Sandbox: a discount allowed against another receivable');
  await post([{ accountCode: '8000', debit: 1000 }, { accountCode: '2400', credit: 1000 }], 'Sandbox: income tax provided for');
  const sale = await c.shipped(1000, { cost: 0.4, price: 0.9 }); // 900.00 of sales, 400.00 of material cost
  const is = (await cfo.get(`/api/ledger/reports/income-statement?from=${today()}&to=${today()}`)).body;
  const s = is.summary;
  ok('net sales: the sale less the discount', s.netSales === '850.00', s.netSales);
  ok('cost of goods sold: the material shipped', s.costOfGoodsSold === '400.00', s.costOfGoodsSold);
  ok('gross profit', s.grossProfit === '450.00', s.grossProfit);
  ok('operating expenses: rent, salaries, utilities and depreciation', s.operatingExpenses === '41500.00', s.operatingExpenses);
  ok('operating income', s.operatingIncome === '-41050.00', s.operatingIncome);
  ok('other expense: interest', s.otherExpense === '600.00', s.otherExpense);
  ok('income before tax, tax and net income', s.incomeBeforeTax === '-41650.00' && s.incomeTax === '1000.00' && s.netIncome === '-42650.00', `${s.incomeBeforeTax} ${s.incomeTax} ${s.netIncome}`);
  ok('the sections add up to what the accounts themselves say', is.agreesWithAccounts === true);
  ok('the discount is listed under revenue as a reduction', is.sections.find((x) => x.key === 'REVENUE').accounts.find((a) => a.code === '4310')?.amount === '-50.00');
  ok('the lines end with net income', is.lines.at(-1).label === 'Net income' && is.lines.at(-1).amount === '-42650.00');

  const bs = (await cfo.get(`/api/ledger/reports/balance-sheet?asOf=${today()}`)).body;
  ok('the balance sheet still balances', bs.balanced === true, `${bs.totals.assets} / ${bs.totals.liabilitiesAndEquity} (${bs.difference})`);
  const sec = (k) => bs.sections.find((x) => x.key === k); const acc = (k, code) => sec(k).accounts.find((a) => a.code === code)?.amount;
  ok('the bank account: 250,000 less 20,000 less 39,500', acc('CURRENT_ASSETS', '1010') === '190500.00', acc('CURRENT_ASSETS', '1010'));
  ok('equipment at cost, and accumulated depreciation as a reduction', acc('FIXED_ASSETS', '1520') === '120000.00' && acc('FIXED_ASSETS', '1590') === '-2000.00' && sec('FIXED_ASSETS').total === '118000.00', `${acc('FIXED_ASSETS', '1520')} ${acc('FIXED_ASSETS', '1590')} ${sec('FIXED_ASSETS').total}`);
  ok('the loan is long-term; interest and tax owed are current', acc('LONG_TERM_LIABILITIES', '2600') === '100000.00' && acc('CURRENT_LIABILITIES', '2340') === '600.00' && acc('CURRENT_LIABILITIES', '2400') === '1000.00');
  ok('equity shows the capital and this year\'s result as its own line', acc('EQUITY', '3100') === '250000.00' && bs.totals.netIncomeThisYear === '-42650.00' && sec('EQUITY').accounts.some((a) => a.computed && a.amount === '-42650.00'));
  ok('the same net income stands on both statements', bs.totals.netIncomeThisYear === is.summary.netIncome);
  const tb = (await cfo.get('/api/ledger/reports/trial-balance')).body;
  const assetsFromTb = tb.accounts.filter((a) => a.type === 'ASSET').reduce((t, a) => t + (a.balanceSide === 'DEBIT' ? 1 : -1) * num(a.balance), 0);
  ok('total assets equal the asset accounts of the trial balance', Math.abs(assetsFromTb - num(bs.totals.assets)) < 0.005, `${assetsFromTb} / ${bs.totals.assets}`);
  ok('the sale posted like any other', Boolean(sale.invoice?.id) && (await c.posted('INVOICE_ISSUED', 'Invoice', sale.invoice.id)).entry != null);
  const rec = await cfo.post('/api/ledger/reconciliations');
  // Stock that was on a truck between branches with no cost on file when the books opened is held by name, as the
  // product intends (it is never valued at zero). Earlier suites leave such items in a shared QA database. They are
  // counted here and are the only thing allowed to keep the EVENTS check open; every money and stock check must match.
  const held = await prisma.ledgerEvent.findMany({ where: { status: { in: ['FAILED', 'RECONCILIATION_REQUIRED', 'PENDING'] } } });
  const onlyUncosted = held.every((e) => e.status === 'RECONCILIATION_REQUIRED' && /No cost is on file/.test(e.reason || ''));
  ok('the books reconcile with the records with no difference in money or stock', rec.status === 201 && (rec.body.passed === true || (JSON.stringify(rec.body.failing) === '["EVENTS"]' && held.length > 0 && onlyUncosted)), `${JSON.stringify(rec.body.failing)}; held: ${held.length}, all for stock with no cost: ${onlyUncosted}`);
  ok('every reconciliation check on money and stock matches', (rec.body.checks || []).filter((x) => x.key !== 'EVENTS').every((x) => ['MATCH', 'INFO'].includes(x.status)), (rec.body.checks || []).filter((x) => x.key !== 'EVENTS' && !['MATCH', 'INFO'].includes(x.status)).map((x) => `${x.key} ${x.status} ${x.difference}`).join('; '));
});

await S('Earnings of an earlier year stand on their own line; a date before the books is empty', async (ok) => {
  const y = Number(today().slice(0, 4));
  const next = (await cfo.get(`/api/ledger/reports/balance-sheet?asOf=${y + 1}-06-30`)).body;
  ok('next year, this year\'s loss is "earnings of earlier years" and the new year starts at zero', next.balanced === true && next.totals.earningsOfEarlierYears === '-42650.00' && next.totals.netIncomeThisYear === '0.00', `${next.totals.earningsOfEarlierYears} ${next.totals.netIncomeThisYear}`);
  const past = (await cfo.get(`/api/ledger/reports/balance-sheet?asOf=${y - 1}-12-31`)).body;
  ok('before the books began the balance sheet is empty and balances', past.balanced === true && past.totals.assets === '0.00');
  ok('a date that is not a date is refused', (await cfo.get('/api/ledger/reports/balance-sheet?asOf=yesterday-ish')).status === 400);
  ok('from after to is refused', (await cfo.get(`/api/ledger/reports/income-statement?from=${y}-12-31&to=${y}-01-01`)).status === 400);
  ok('reading a statement leaves a line in the audit trail', (await prisma.auditLog.count({ where: { eventType: 'LEDGER_REPORT_READ', resourceId: 'balance-sheet', userId: cfo.user.id } })) >= 1);
});

await S('Sandbox books keep every rule of real books', async (ok) => {
  const one = await c.draft([{ accountCode: '6900', debit: 10 }, { accountCode: '1010', credit: 9 }], { memo: 'Sandbox: does not balance' });
  ok('an entry that does not balance is refused', one.status === 400, `${one.status} ${err(one)}`);
  const ctl = await c.draft([{ accountCode: '1100', debit: 10 }, { accountCode: '1010', credit: 10 }], { memo: 'Sandbox: by hand to a control account' });
  ok('a control account takes no entry by hand', ctl.status === 409, `${ctl.status} ${err(ctl)}`);
  const d = await c.draft([{ accountCode: '6900', debit: 10 }, { accountCode: '1010', credit: 10 }], { memo: 'Sandbox: same person' });
  ok('the person who wrote an entry cannot post it', (await cfo.post(`/api/ledger/entries/${d.body.id}/post`)).status === 403 || (await cfo.post(`/api/ledger/entries/${d.body.id}/post`)).status === 409);
  const any = await prisma.journalEntry.findFirst({ where: { status: 'POSTED' } });
  ok('a posted entry is never changed through the server', (await cfo.put(`/api/ledger/entries/${any.id}`, { memo: 'changed' })).status === 405);
  const stop = await owner.post('/api/ledger/deactivate', { reason: 'Sandbox: stopping to see that the mark stays' });
  const st = (await cfo.get('/api/ledger/status')).body;
  ok('stopped books are still marked sandbox', stop.status === 200 && st.active === false && st.sandbox === true, JSON.stringify(st).slice(0, 120));
  const back = await owner.post('/api/ledger/resume', { reason: 'Sandbox: starting again' });
  ok('started again, still sandbox', back.status === 200 && (await cfo.get('/api/ledger/status')).body.sandbox === true, `${back.status} ${err(back)}`);
});

const failed = finish('Finance ledger sandbox', 'qa/results/ledger-sandbox.json', fs);
await prisma.$disconnect();
process.exit(failed ? 1 : 0);
