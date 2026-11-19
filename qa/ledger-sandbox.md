# Finance ledger sandbox

Date: 2026-11-19. Scope: a sandbox mode for the finance ledger of the demonstration system, a full chart of accounts, an income statement and a balance sheet.

Readiness: **CONDITIONAL**. The code is tested on the QA database. It is fit for a demonstration. It is **not** fit to keep a real company's accounts, and no accountant has reviewed the chart or the posting rules.

## What was built

| Part | Where | What it does |
| --- | --- | --- |
| Full chart of accounts | `src/backend/src/lib/ledgerRules.js` | 103 accounts in place of 22: bank and cash, receivables and allowance, inventory and reserve, prepaids, property and equipment with accumulated depreciation, payables, accruals, payroll and tax liabilities, debt, equity, revenue with returns and discounts, cost of sales, operating expenses, other income and expense, income tax. Contra accounts carry their own normal side. |
| Statement sections | same file, `SECTIONS`, `sectionOf` | Each account falls in one section by type and code range, so a statement never needs a hand-kept list. |
| Income statement | `ledgerReports.incomeStatement` | Revenue, cost of goods sold, gross profit, operating expenses, operating income, other income and expense, income before tax, income tax, net income, for any date range. |
| Balance sheet | `ledgerReports.balanceSheet` | Current and long-term assets and liabilities and equity as of any date. Earnings of earlier years and net income of the current year are computed lines in equity. Reports whether it balances and the difference. |
| Sandbox start | `ledgerCutover.startSandbox`, `POST /api/ledger/sandbox/start` | One step for the owner, chief financial officer or super administrator: loads the chart, records every account and posting rule as approved by "SANDBOX: demonstration books, not approved by an accountant", runs the dry run, and opens the books. It needs the typed phrase `START SANDBOX BOOKS`. |
| Sandbox label | `routes/ledger.js` status, `FinancePage.jsx`, `FinanceBooks.jsx` | Books started this way are marked `sandbox: true` for good. A filled warning shows above every Finance tab, and each statement carries the notice. |
| Screens | `FinanceControl.jsx`, `FinanceBooks.jsx` | The sandbox start panel on "Start and stop", and the two statements under Reports. |
| Manual | `src/frontend/src/help/manualOperations.js` | A chapter section on sandbox books; the "what it is not" warning restated. |

No database change. No SQL Editor file is needed. The ordinary way of starting real books is unchanged, and it now refuses an approver name that begins with "sandbox".

## What it meets

| Practice | State | Evidence |
| --- | --- | --- |
| Double entry: every entry balances | Met | Phase 9.5 ledger suite, database CHECK constraints |
| Posted entries cannot be edited or deleted; corrections are reversing entries | Met | Phase 9.5 ledger suite |
| Accounting periods that open and close; no posting to a closed month | Met | Phase 9.5 ledger suite |
| Separation of duties on manual journal entries | Met | Phase 9.5 ledger suite; sandbox suite scenario on a journal entry |
| Audit trail of who did what | Met | `LEDGER_SANDBOX_STARTED` and the existing ledger audit events |
| Subledgers tie to control accounts (receivables, inventory, sales tax) | Met | Reconciliation checks in the sandbox suite |
| Chart of accounts in the usual five-part order with contra accounts | Met | `src/backend/test/ledgerChart.test.js` |
| Income statement in multiple-step form | Met | sandbox suite, browser suite |
| Balance sheet classified current and long-term, and in balance | Met | sandbox suite, browser suite |
| Statement of cash flows | **Not built** | |
| Statement of changes in equity | **Not built** | |
| Notes and disclosures | **Not built** | |

"Met" means the behaviour is tested here. It does not mean the books comply with US GAAP or any other framework. That judgement belongs to a licensed accountant.

## What is not in it

1. Supplier invoices and an accounts payable subledger. Account 2010 exists, and nothing posts to it by itself.
2. Bank feeds and bank reconciliation.
3. Depreciation runs, accruals and prepaid amortisation. They are journal entries a person posts.
4. Payroll.
5. Income tax calculation.
6. More than one currency.
7. A year-end closing entry. The balance sheet computes retained earnings instead.
8. Consolidation of more than one company.
9. Cash flow statement, statement of changes in equity, notes.
10. Review of the chart and of the 17 posting rules by an accountant. The chart is a common template for a steel service centre and nothing more.

## Tests run in this session, on the local QA database

| Check | Result |
| --- | --- |
| Backend unit tests (`npm test` in `src/backend`) | 283 of 283 pass |
| Phase 9.5 ledger scenarios (`qa/sim/phase95-ledger.mjs`) | 158 of 158 pass |
| Finance ledger sandbox (`qa/sim/ledger-sandbox.mjs`) | 7 of 7 pass, 59 checks |
| Finance ledger sandbox in a browser (`qa/sim/ledger-sandbox-ui.cjs`) | 5 of 5 pass, 27 checks |
| Phase 9.5 Finance screens (`qa/sim/phase95-ui.cjs`) | 13 of 13 pass, 67 checks |
| Lint, whole repository (ceiling 1,572 warnings, 0 errors) | 1,572 warnings, 0 errors |
| Frontend build | Builds |
| Whole gate script `qa/tools/run-gates.sh` | NOT VERIFIED in this session. The two new suites are added to it. |
| The hosted database and Vercel | NOT VERIFIED. Nothing was run against them. |

The browser check found one defect before it was committed: the sandbox warning showed on the Overview tab only. It now sits above the tabs, and the check fails without that.

## Gates A to J

| Gate | State |
| --- | --- |
| A Requirements | PASS for the request as scoped above; the items under "What is not in it" are outside it |
| B Code quality | PASS, lint within the ceiling |
| C Tests | PASS for the suites listed; whole gate script NOT VERIFIED |
| D Security | PASS: the start is limited to three roles, needs a typed phrase, and is audited. No full security review was made, so anything wider is NOT ASSESSED |
| E Data integrity | PASS on QA: statements agree with the trial balance and the balance sheet balances |
| F Performance | NOT ASSESSED |
| G Usability | PASS for the two statements and the banner at desktop and phone width |
| H Documentation | PASS: this file and the manual section |
| I Deployment | NOT VERIFIED until merged and deployed |
| J Owner acceptance | Open: the owner merges, and the owner starts the sandbox books himself |

## What the owner does

1. Say when to merge.
2. Make sure database updates 16 to 18 (the ledger tables) are applied on the hosted database. Without them the Finance screen cannot start any books.
3. After Vercel deploys, sign in as owner, chief financial officer or super administrator. An administrator login cannot start books.
4. Finance, "Start and stop", "Start sandbox books", type the phrase. This cannot be undone on that database.
