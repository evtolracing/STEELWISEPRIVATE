# Phase 12: financial ledger certification

Date: 2026-11-19. Release candidate RC-2 (RC-1 is commit `9e12319`, the merge of Phase 11; RC-2 is RC-1 plus the corrections of this phase, listed in `phase-12-release-baseline.md`). Everything here was run in this session on one local machine against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only. Nothing was run against the live system, and nothing here is a statement about it.

**What this certifies and what it does not.** On the release candidate, on the QA database, with a QA chart of accounts approved by a test user and synthetic transactions, the ledger does what its rules say. It does **not** certify that the rules are the right accounting: no accountant has reviewed them (W-001), the ledger is switched off on the live system, and the software refuses to switch it on without the approvals. Engineering judgement is not a substitute for that review and is not offered as one.

## Result: 16 of 16 scenarios pass

| ID | Scenario | Result | Checks |
|---|---|---|---|
| LC-01 | Ledger 1: the chart of accounts is complete, typed and approved before anything posts to it | pass | 6 |
| LC-02 | Ledger 2: each business event posts by its rule, and an event with no approved rule is held by name | pass | 3 |
| LC-03 | Ledger 3: no entry posts unless its debits equal its credits | pass | 3 |
| LC-04 | Ledger 4: posted history cannot be changed or deleted, by the server or by SQL as the application | pass | 9 |
| LC-05 | Ledger 5: a reversal is a new entry by an authorized person, once, with its reason | pass | 6 |
| LC-06 | Ledger 6: a closed month takes no entry, and closing and reopening are controlled | pass | 5 |
| LC-07 | Ledger 7: the same event posts once however many times it is sent | pass | 5 |
| LC-08 | Ledger 8 to 10: an invoice, its payments, a credit and a refund each post once to the right accounts | pass | 13 |
| LC-11 | Ledger 11: stock value on the books equals pounds times actual cost, item by item | pass | 6 |
| LC-12 | Ledger 12 and 13: production keeps cost through the cut, and scrap is written off at cost | pass | 4 |
| LC-14 | Ledger 14: freight charged on an invoice is in the invoice total; no freight income or cost account is posted without a rule | pass | 3 |
| LC-15 | Ledger 15 and 16: every line carries its branch; the product has no division on the books | pass | 3 |
| LC-17 | Ledger 17: the export to an outside accounting system holds each entry once and sends nothing by itself | pass | 5 |
| LC-18 | Ledger 18: the financial reports answer for finance, add up, and are refused to people outside finance | pass | 12 |
| LC-19 | Ledger 19: every entry, reversal, close and report read leaves a line in the audit trail that cannot be changed | pass | 3 |
| LC-20 | Ledger 20: a posting that fails is kept, named, and posted later without losing or doubling it | pass | 11 |

## Section 14, item by item

| Requirement | Scenario | Result |
|---|---|---|
| Chart of accounts | LC-01 | pass (6 checks) |
| Posting rules | LC-02 | pass (3 checks) |
| Balanced journal entries | LC-03 | pass (3 checks) |
| Immutable posted history | LC-04 | pass (9 checks) |
| Authorized reversals | LC-05 | pass (6 checks) |
| Accounting periods | LC-06 | pass (5 checks) |
| Posting idempotency | LC-07 | pass (5 checks) |
| Invoice, payment, credit and refund posting | LC-08 | pass (13 checks) |
| Inventory valuation | LC-11 | pass (6 checks) |
| Manufacturing costing, scrap and write-offs | LC-12 | pass (4 checks) |
| Freight income and expense | LC-14 | pass (3 checks) |
| Branch and division attribution | LC-15 | pass (3 checks) |
| External accounting mappings | LC-17 | pass (5 checks) |
| Financial reporting | LC-18 | pass (12 checks) |
| Audit trails | LC-19 | pass (3 checks) |
| Recovery from failed posting | LC-20 | pass (11 checks) |

## Section 15: accounting policies. Status of each

The sixteen decisions and what the software does by default are in `phase-09-5-accounting-policy-decisions.md`. **Every one is PENDING: none has been reviewed or approved by a qualified accountant.**

| Policy | What the ledger does today (a default, not an approval) | Approval |
|---|---|---|
| Chart of accounts | A proposed chart ships unapproved; each account must be approved by name before activation | NOT GIVEN |
| Revenue recognition | At invoice, which is raised at dispatch | NOT GIVEN |
| COGS recognition | At shipment, at the item's actual cost | NOT GIVEN |
| Inventory costing method | Actual cost of each item (specific identification); an item with no cost is held, never valued at zero | NOT GIVEN |
| Work-in-progress valuation | None carried by default; a setting exists and only the owner or CFO can change it | NOT GIVEN |
| Scrap and remnant valuation | Scrap written off at cost; a remnant keeps cost by weight | NOT GIVEN |
| Customer deposits | Not in the product: a payment needs an invoice | NOT GIVEN |
| Partial shipments | Each shipment is billed for what left | NOT GIVEN |
| Partial invoicing | One invoice per shipment | NOT GIVEN |
| Sales tax treatment | A liability at invoice, by the state rate on file | NOT GIVEN |
| Freight accounting | Freight billed posts to freight revenue; no freight cost exists | NOT GIVEN |
| Accounting periods | Calendar months; closing and reopening controlled | NOT GIVEN |
| Opening balances | Taken inside activation from the business records; **none has been taken for the live system and none was invented** | NOT GIVEN |
| Cutover date | **Not set. No date is proposed here** | NOT GIVEN |

Missing approvals: all fourteen rows above, the account mappings, the posting rules, the time zone for the business day (W-003, AA-007), and whether branches are one legal entity or several (W-002).

## Earlier suites, rerun in the gate

- p95: not in the gate log
- not in the gate log
- Phase 11 "Ledger posting and reconciliation": 63 scenarios pass

## Open findings

| Finding | Severity | Status | Area | What is open |
|---|---|---|---|---|
| K-007 | P1 | IN PROGRESS | Inventory valuation | No cost unless typed by hand. |
| L-026 | P1 | IN PROGRESS | Production costing | No production cost exists. |
| N-025 | P2 | REQUIRES BUSINESS DECISION | Accounting | Not built. |
| W-001 | P1 | REQUIRES BUSINESS DECISION | Financial ledger | The ledger is built and verified on test data and is switched off. The chart of accounts, the account mappings, the posting rules and sixteen accounting policies are prop |
| W-002 | P2 | REQUIRES BUSINESS DECISION | Financial ledger; stock transfers | Whether the branches are one legal entity or several is not on record. A transfer between branches of different owning organisations is held at both ends and not posted. |
| W-003 | P3 | REQUIRES BUSINESS DECISION | Financial ledger | The books keep days. Which day an event falls on depends on the time zone chosen at activation. It is recorded then and there is no way to change it afterwards. |
| W-004 | P3 | REQUIRES BUSINESS DECISION | Financial ledger | Journal entry numbers come from a database sequence. They are unique and increasing, and a number is skipped wherever a save was rolled back. |
| W-005 | P2 | BLOCKED | Financial ledger; cutover | The cutover dry run and the activation were run on the QA database only. They have not been run on a copy of the live database, so the size of the opening balances, the n |
| W-006 | P2 | REQUIRES BUSINESS DECISION | Receiving; financial ledger | Stock can be received with no purchase order (the plain receive address and the upload). Such a receipt has no cost and no supplier, so no approved rule says what it is o |
| W-007 | P2 | REQUIRES BUSINESS DECISION | Counter stock; receiving | Stock sold by the piece at the counter has no receiving screen. Its receipt reaches the books only through the completeness check ("record what is missing"), posted by th |
| W-009 | P2 | REQUIRES BUSINESS DECISION | Financial ledger; purchasing | A receipt credits Accounts Payable Clearing (goods received, not invoiced). Supplier invoices are not in the product, so nothing ever debits that account. |
| W-010 | P2 | REQUIRES BUSINESS DECISION | Financial ledger; sales orders | An order line carries one price. Nothing marks processing (cutting) apart from material, so all line revenue posts to Product Sales Revenue and nothing posts to Processin |
| W-011 | P2 | REQUIRES BUSINESS DECISION | Financial ledger; export | The export produces one file layout whichever accounting product is chosen. No layout specific to QuickBooks or Xero was built, and no import into either was tested: no t |
| W-012 | P2 | REQUIRES BUSINESS DECISION | Counter quick sale; financial ledger | A counter sale of an item that has no stock record posts its revenue and no cost of goods, because there is no stock movement to cost. |
| W-014 | P1 | FIXED — NOT VERIFIED | Financial ledger; database | Posted entries are protected by database triggers. A database superuser, or the owner of the tables, can switch triggers off for a session (session_replication_role) or d |
| W-015 | P3 | REQUIRES BUSINESS DECISION | Financial ledger | The person who closed a month cannot reopen it while another finance user exists. Where a company has only one finance user, that rule yields so the books cannot be locke |
| W-023 | P2 | BLOCKED | Financial ledger | The load check ran on one container with one server process and one database: 80 branches, about 1,100 events and 2,000 manual entries. Report and reconciliation times at |
