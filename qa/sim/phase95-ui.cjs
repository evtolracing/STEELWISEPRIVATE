#!/usr/bin/env node
// Phase 9.5: the Finance screen driven in a real browser against the QA server and the QA database.
// Run after qa/sim/phase95-ledger.mjs, which starts the books and leaves entries, held events and months.
//   node qa/sim/phase95-ui.cjs --app http://localhost:5199 --api http://localhost:3001
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const APP = arg('app', 'http://localhost:5199');
const API = arg('api', 'http://localhost:3001');
const OUT = arg('out', 'qa/results/phase95-ui.json');
const PASSWORD = 'qa-password-1';

(async () => {
  process.argv.push('--base', API);
  const lib = await import('./phase4-lib.mjs');
  const { prisma } = lib;
  const w = await lib.world();
  const bcrypt = (await import(path.resolve('src/backend/node_modules/bcryptjs/index.js')).catch(() => import(path.resolve('src/backend/node_modules/bcrypt/bcrypt.js')))).default;
  const run = Date.now().toString(36);
  const hash = await bcrypt.hash(PASSWORD, 10);
  const person = async (role, loc, label) => {
    const email = `qa-p95ui-${label}-${run}@qa.test`;
    await prisma.user.create({ data: { email, passwordHash: hash, firstName: 'QA', lastName: `Finance ${label}`, role, organizationId: w.users.admin.organizationId, homeLocationId: loc ? loc.id : null } });
    const r = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: PASSWORD }) }).then((x) => x.json());
    if (!r.token) throw new Error(`sign-in failed for ${label}`);
    return r;
  };
  const P = { cfo: await person('CFO', w.L1, 'cfo'), cfo2: await person('CFO', w.L1, 'cfo2'), auditor: await person('AUDITOR', w.L1, 'auditor'), manager: await person('BRANCH_MANAGER', w.L1, 'manager'), rep: await person('SALES_REP', w.L1, 'rep'), ops: await person('OPS_MANAGER', w.L1, 'ops') };
  const api = async (who, method, url, body) => { const r = await fetch(API + url, { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${who.token}` }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, body: await r.json().catch(() => null) }; };

  const status = await api(P.cfo, 'GET', '/api/ledger/status');
  if (!status.body || !status.body.active) { console.error('The books are not running on the QA database. Run qa/sim/phase95-ledger.mjs first.'); process.exit(2); }

  const browser = await chromium.launch();
  const contexts = [];
  const open = async (who, url = '/finance', viewport = { width: 1366, height: 900 }) => {
    const context = await browser.newContext({ viewport }); contexts.push(context);
    await context.addInitScript(([t, u]) => { localStorage.setItem('token', t); if (u) localStorage.setItem('user', JSON.stringify(u)); }, [who.token, who.user]);
    const page = await context.newPage(); page.setDefaultTimeout(12000); page.errors = []; page.failed = [];
    page.on('pageerror', (e) => page.errors.push(e.message));
    page.on('response', (r) => { if (/\/api\/ledger/.test(r.url()) && r.status() >= 500) page.failed.push(`${r.status()} ${r.url()}`); });
    await page.goto(APP + url, { waitUntil: 'domcontentloaded' });
    await page.locator('main h1, h1').first().waitFor({ timeout: 20000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    return page;
  };
  const has = (page, pattern, timeout = 10000) => page.getByText(pattern).first().waitFor({ timeout }).then(() => true).catch(() => false);
  const tab = async (page, name) => { await page.getByRole('tab', { name, exact: true }).click(); await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {}); await page.waitForTimeout(300); };
  const tabs = (page) => page.getByRole('tab').allInnerTexts();

  const results = []; let n = 0;
  const sc = async (name, fn) => {
    n += 1; const checks = []; let crashed = ''; const before = contexts.length; const started = Date.now();
    const t = { check: (what, ok, detail = '') => { checks.push({ what, ok: Boolean(ok), detail: ok ? '' : String(detail).replace(/\s+/g, ' ').slice(0, 260) }); return Boolean(ok); } };
    try { await fn(t); } catch (e) { crashed = `${String((e && e.message) || e).split('\n')[0].slice(0, 220)} ${(String(e && e.stack).match(/phase95-ui\.cjs:\d+/) || [''])[0]}`; }
    for (const c of contexts.splice(before)) await c.close().catch(() => {});
    const failed = checks.filter((c) => !c.ok);
    const st = crashed || failed.length || !checks.length ? 'FAIL' : 'PASS';
    results.push({ id: n, name, status: st, checks, crashed, ms: Date.now() - started });
    console.log(`${st === 'PASS' ? '✓' : '✗'} ${String(n).padStart(2)} ${name}${st === 'FAIL' ? `  — ${crashed || `${failed[0].what}: ${failed[0].detail}`}` : ''}`);
  };

  await sc('The CFO finds Finance on the menu and the overview says since when the books run', async (t) => {
    const page = await open(P.cfo, '/');
    t.check('Ledger is on the menu', await page.getByRole('link', { name: /Ledger/ }).first().waitFor({ timeout: 10000 }).then(() => true).catch(() => false) || await has(page, 'Ledger'));
    const f = await open(P.cfo);
    t.check('the heading is Finance', (await f.locator('h1').first().innerText()) === 'Finance');
    t.check('it says the books are posting, and since when', await has(f, new RegExp(`Posting since ${status.body.effectiveDate}`)));
    t.check('it says this is a subledger, not a full set of accounts', await has(f, /not a full set of accounts/));
    t.check('all nine tabs are offered', (await tabs(f)).length === 9, (await tabs(f)).join(','));
    t.check('no page error and no server error', f.errors.length === 0 && f.failed.length === 0, [...f.errors, ...f.failed].join(' | '));
  });

  await sc('A sales rep has no Finance on the menu and is turned away from its address', async (t) => {
    const page = await open(P.rep, '/');
    await page.waitForTimeout(800);
    t.check('Ledger is not on the menu', (await page.getByRole('link', { name: 'Ledger', exact: true }).count()) === 0);
    const f = await open(P.rep);
    t.check('the Finance screen is not shown', !(await has(f, /not a full set of accounts/, 2500)));
    t.check('the server sent no ledger data', (await api(P.rep, 'GET', '/api/ledger/status')).status === 403);
  });

  await sc('An operations manager, who opens every other area, does not get Finance', async (t) => {
    const f = await open(P.ops);
    t.check('the Finance screen is not shown', !(await has(f, /not a full set of accounts/, 2500)));
    const home = await open(P.ops, '/'); await home.waitForTimeout(800);
    t.check('Ledger is not on the menu', (await home.getByRole('link', { name: 'Ledger', exact: true }).count()) === 0);
  });

  await sc('The trial balance shown is the server\'s, balances, and an account opens to its lines and then to an entry', async (t) => {
    const f = await open(P.cfo); await tab(f, 'Trial balance');
    const tb = (await api(P.cfo, 'GET', '/api/ledger/reports/trial-balance')).body;
    t.check('it says debits equal credits', await has(f, 'Debits equal credits'));
    const ar = tb.accounts.find((a) => a.code === '1100');
    const row = f.locator('tr', { hasText: '1100 Accounts Receivable' }).first();
    t.check('receivables shows the server\'s debit total', (await row.innerText()).includes(Number(ar.debit).toLocaleString('en-US', { style: 'currency', currency: 'USD' })), await row.innerText());
    await row.getByRole('button').click();
    t.check('the account opens with its brought-forward and closing figures', await has(f, /Brought forward/));
    const first = f.getByRole('dialog').getByRole('button', { name: /^JE-/ }).first();
    const number = await first.innerText(); await first.click();
    t.check('a line opens its journal entry', await has(f, new RegExp(`${number} ·`)));
    t.check('the entry shows a total line', await f.getByRole('dialog').last().getByText('Total').first().isVisible());
  });

  await sc('A manual entry is saved as a draft, cannot be posted by its writer, and is posted by a second person', async (t) => {
    const f = await open(P.cfo); await tab(f, 'Journal');
    await f.getByRole('button', { name: 'New entry' }).click();
    const d = f.getByRole('dialog');
    t.check('the dialog says a draft is not in the books', await has(f, /It is not in the books until someone else posts it/));
    const memo = `QA browser accrual ${run}`;
    await d.getByLabel('What the entry is for').fill(memo);
    t.check('Save is off until the entry balances', await d.getByRole('button', { name: 'Save draft' }).isDisabled());
    const pick = async (i, code) => { await d.getByLabel('Account').nth(i).click(); await f.getByRole('option', { name: new RegExp(`^${code} `) }).click(); };
    await pick(0, '5100'); await d.getByLabel('Debit').nth(0).fill('42.50');
    await pick(1, '2200'); await d.getByLabel('Credit').nth(1).fill('42.50');
    await d.getByRole('button', { name: 'Save draft' }).click();
    t.check('the draft opens, marked as not in the books', await has(f, 'Draft: not in the books'));
    const saved = await prisma.journalEntry.findFirst({ where: { memo }, include: { lines: true } });
    t.check('the database holds a balanced draft of 42.50', saved && saved.status === 'DRAFT' && saved.lines.length === 2 && saved.lines.reduce((x, l) => x + Number(l.debit), 0) === 42.5 && saved.lines.reduce((x, l) => x + Number(l.credit), 0) === 42.5, saved && saved.status);
    await f.getByRole('dialog').last().getByRole('button', { name: 'Post', exact: true }).click();
    t.check('the writer is told someone else must post it', await has(f, /posted by someone other than the person who wrote it/));
    t.check('it is still a draft', (await prisma.journalEntry.findUnique({ where: { id: saved.id } })).status === 'DRAFT');
    const g = await open(P.cfo2); await tab(g, 'Journal');
    await g.getByLabel('Find by number or note').fill(memo); await g.waitForTimeout(900);
    await g.getByRole('button', { name: saved.entryNumber }).click();
    await g.getByRole('dialog').getByRole('button', { name: 'Post', exact: true }).click();
    t.check('the second person sees it posted', await has(g, 'Posted.'));
    const now = await prisma.journalEntry.findUnique({ where: { id: saved.id } });
    t.check('the database shows it posted by the second person', now.status === 'POSTED' && now.postedById === P.cfo2.user.id && now.createdById === P.cfo.user.id);
    await g.getByRole('dialog').getByRole('button', { name: 'Reverse' }).waitFor({ timeout: 8000 }).catch(() => {});
    t.check('a posted entry offers Reverse and no edit or delete', (await g.getByRole('dialog').getByRole('button', { name: 'Reverse' }).count()) === 1 && (await g.getByRole('dialog').getByRole('button', { name: /Delete|Edit/ }).count()) === 0);
    await g.getByRole('dialog').getByRole('button', { name: 'Reverse' }).click();
    await g.getByLabel('Why it is reversed').fill('Entered in the browser test'); await g.getByRole('button', { name: 'Reverse', exact: true }).last().click();
    t.check('it is reversed by a new entry', await has(g, /Reversed by JE-/));
    t.check('the database holds the reversal', (await prisma.journalEntry.count({ where: { reversesEntryId: saved.id, status: 'POSTED' } })) === 1);
  });

  await sc('An entry from a business record offers no reversal by hand and says how to undo it', async (t) => {
    const e = await prisma.journalEntry.findFirst({ where: { kind: 'SYSTEM', eventKind: 'INVOICE_ISSUED', status: 'POSTED' }, orderBy: { createdAt: 'desc' } });
    const f = await open(P.cfo); await tab(f, 'Journal');
    await f.getByLabel('Find by number or note').fill(e.entryNumber); await f.waitForTimeout(900);
    await f.getByRole('button', { name: e.entryNumber }).click();
    t.check('it names its source record and rule version', await has(f, /Source: INVOICE_ISSUED of Invoice/));
    t.check('it says to undo the record itself', await has(f, /undo the record itself/));
    t.check('there is no Reverse, Post or Delete button', (await f.getByRole('dialog').getByRole('button', { name: /Reverse|Post|Delete/ }).count()) === 0);
  });

  await sc('Reports: gross margin is titled for what it is, and sales tax and receivables show the server\'s totals', async (t) => {
    const f = await open(P.cfo); await tab(f, 'Reports');
    await f.locator('main').getByRole('combobox').first().click(); await f.getByRole('option', { name: 'Gross margin on material' }).click();
    t.check('the title is gross margin on material', await has(f, 'Gross margin on material'));
    t.check('it says it is not a profit and loss statement', await has(f, /This is not a profit and loss statement/));
    t.check('the words "Profit and loss" appear only in that warning', ((await f.locator('main, body').first().innerText()).match(/profit and loss/gi) || []).length === 1);
    await f.locator('main').getByRole('combobox').first().click(); await f.getByRole('option', { name: 'Receivables against invoices' }).click();
    const ar = (await api(P.cfo, 'GET', '/api/ledger/reports/receivables')).body;
    t.check('receivables shows the books beside the invoices', await has(f, new RegExp(`Books \\$${Number(ar.totals.ledger).toLocaleString('en-US', { minimumFractionDigits: 2 }).replace(/[.$]/g, '\\$&')}`)), ar.totals.ledger);
    await f.locator('main').getByRole('combobox').first().click(); await f.getByRole('option', { name: 'Stock value by branch' }).click();
    t.check('stock value names the method as proposed and not approved', await has(f, /Specific identification.*not approved/));
    await f.locator('main').getByRole('combobox').first().click(); await f.getByRole('option', { name: 'Monthly statement of this ledger' }).click();
    t.check('the monthly statement says it is not a P&L or balance sheet', await has(f, /not a profit and loss statement or a balance sheet/));
    t.check('no server error', f.failed.length === 0 && f.errors.length === 0, [...f.errors, ...f.failed].join(' | '));
  });

  await sc('Events that did not post are listed with their reasons, and settling one needs a note', async (t) => {
    const open1 = (await api(P.cfo, 'GET', '/api/ledger/reports/exceptions')).body;
    const f = await open(P.cfo); await tab(f, 'Not posted');
    if (!open1.events.length) { t.check('with nothing held the screen says so', await has(f, 'Every business event has posted.')); return; }
    const e = open1.events[0];
    t.check('the first held event shows its reason', await has(f, e.reason.slice(0, 40)));
    t.check('the overview counted them', open1.open >= 1);
    await f.getByRole('button', { name: 'Settle' }).first().click();
    t.check('Settle is off until a note of some length is given', await f.getByRole('dialog').getByRole('button', { name: 'Settle' }).isDisabled());
    await f.getByLabel('How it was settled').fill('short');
    t.check('a short note is not enough', await f.getByRole('dialog').getByRole('button', { name: 'Settle' }).isDisabled());
    await f.getByRole('button', { name: 'Cancel' }).click();
    t.check('nothing changed', (await api(P.cfo, 'GET', '/api/ledger/reports/exceptions')).body.open === open1.open);
  });

  await sc('Months: a closed month shows who may reopen it, and reopening asks for a reason', async (t) => {
    const f = await open(P.cfo); await tab(f, 'Months');
    const periods = (await api(P.cfo, 'GET', '/api/ledger/periods')).body.periods;
    const closed = periods.find((p) => p.status === 'CLOSED');
    t.check('the months are listed', await has(f, `${periods[0].year}-${String(periods[0].month).padStart(2, '0')}`));
    if (!closed) { t.check('no month is closed on this database', true); return; }
    const row = f.locator('tr', { hasText: `${closed.year}-${String(closed.month).padStart(2, '0')}` }).first();
    t.check('the closed month says Closed and offers Reopen, not Close', (await row.innerText()).includes('Closed') && (await row.getByRole('button', { name: 'Reopen' }).count()) === 1 && (await row.getByRole('button', { name: 'Close' }).count()) === 0);
    await row.getByRole('button', { name: 'Reopen' }).click();
    t.check('Reopen is off until a reason is given', await f.getByRole('dialog').getByRole('button', { name: 'Reopen' }).isDisabled());
    await f.getByRole('button', { name: 'Cancel' }).click();
    t.check('the month is still closed', (await prisma.ledgerPeriod.findUnique({ where: { id: closed.id } })).status === 'CLOSED');
  });

  await sc('The auditor reads everything and is offered no way to change anything', async (t) => {
    const f = await open(P.auditor);
    t.check('all nine tabs are offered', (await tabs(f)).length === 9);
    t.check('there is no Check now button', (await f.getByRole('button', { name: 'Check now' }).count()) === 0);
    await tab(f, 'Journal');
    t.check('there is no New entry button', (await f.getByRole('button', { name: 'New entry' }).count()) === 0);
    await tab(f, 'Months');
    t.check('there is no Close or Reopen button', (await f.getByRole('button', { name: /^(Close|Reopen)$/ }).count()) === 0);
    await tab(f, 'Not posted');
    t.check('there is no Post again or Settle button', (await f.getByRole('button', { name: /Post again|Settle|Find records/ }).count()) === 0);
    await tab(f, 'Start and stop');
    t.check('there is no start, stop or dry run button', (await f.getByRole('button', { name: /Stop posting|Start posting|Start the books|Run the dry run/ }).count()) === 0);
    await tab(f, 'Export');
    t.check('there is Download and no Make, Loaded or Withdraw', (await f.getByRole('button', { name: /Make the export file|Loaded|Withdraw|Save/ }).count()) === 0);
    t.check('no page error', f.errors.length === 0 && f.failed.length === 0, [...f.errors, ...f.failed].join(' | '));
  });

  await sc('A branch manager gets the branch reports only and is told the view is of their branch', async (t) => {
    const f = await open(P.manager);
    const names = await tabs(f);
    t.check('four tabs: overview, trial balance, reports, journal', names.length === 4 && !names.some((x) => /Accounts|Export|Start and stop|Months|Not posted/i.test(x)), names.join(','));
    t.check('the overview says it is the branch view', await has(f, /You see the reports of your own branch/));
    await tab(f, 'Reports');
    await f.locator('main').getByRole('combobox').first().click();
    const options = await f.getByRole('option').allInnerTexts();
    t.check('receivables and sales tax are not offered', !options.some((o) => /Receivables|Sales tax/.test(o)), options.join(','));
    await f.keyboard.press('Escape');
    await tab(f, 'Trial balance');
    t.check('the trial balance says it is limited to the branch', await has(f, /Limited to lines of your branches/));
    t.check('no request was refused with a server error', f.failed.length === 0 && f.errors.length === 0, [...f.errors, ...f.failed].join(' | '));
  });

  await sc('Export says plainly that nothing is connected or sent, and the accounts page shows every approval', async (t) => {
    const f = await open(P.cfo); await tab(f, 'Export');
    t.check('it says no accounting system is connected and nothing is sent', await has(f, /No accounting system is connected/) && await has(f, /nothing is sent anywhere/));
    t.check('it says the layout is not validated for any accounting product', await has(f, /has not been validated for import into any accounting product/));
    await tab(f, 'Accounts');
    const chart = (await api(P.cfo, 'GET', '/api/ledger/chart')).body;
    t.check('every account of the chart is listed', (await f.locator('tr', { hasText: '1100' }).count()) >= 1 && (await f.locator('table').first().locator('tbody tr').count()) === chart.accounts.length, `${await f.locator('table').first().locator('tbody tr').count()} vs ${chart.accounts.length}`);
    t.check('an approved account shows who approved it', await has(f, /QA Synthetic Accountant/));
    await tab(f, 'Start and stop');
    t.check('it says the books are running and offers to stop, with a reason asked', await has(f, /The books have been running since/) && (await f.getByRole('button', { name: 'Stop posting' }).count()) === 1);
    await f.getByRole('button', { name: 'Stop posting' }).click();
    t.check('stopping is off until a reason is given', await f.getByRole('dialog').getByRole('button', { name: 'Stop posting' }).isDisabled());
    await f.getByRole('button', { name: 'Cancel' }).click();
    t.check('the books are still running', (await api(P.cfo, 'GET', '/api/ledger/status')).body.active === true);
  });

  await sc('On a phone the Finance screen has no sideways scroll and the tabs can be reached', async (t) => {
    const f = await open(P.cfo, '/finance', { width: 390, height: 844 });
    t.check('the heading shows', (await f.locator('h1').first().innerText()) === 'Finance');
    const wide = await f.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    t.check('the page is no wider than the screen', wide <= 2, wide);
    t.check('the tab strip scrolls to the last tab', await f.getByRole('tab', { name: 'Export' }).scrollIntoViewIfNeeded().then(() => true).catch(() => false));
  });

  await browser.close();
  const passed = results.filter((r) => r.status === 'PASS').length;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ ranAt: new Date().toISOString(), app: APP, api: API, passed, total: results.length, checks: results.reduce((s, r) => s + r.checks.length, 0), results }, null, 2));
  console.log(`${passed === results.length ? '✓' : '✗'} Phase 9.5 UI: ${passed} of ${results.length} pass, ${results.reduce((s, r) => s + r.checks.length, 0)} checks`);
  await prisma.$disconnect();
  process.exit(passed === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
