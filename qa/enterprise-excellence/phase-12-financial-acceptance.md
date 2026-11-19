# Phase 12: financial acceptance

Date: 2026-11-19. Release candidate RC-2 (RC-1 is commit `9e12319`, the merge of Phase 11; RC-2 is RC-1 plus the corrections of this phase, listed in `phase-12-release-baseline.md`). Everything here was run in this session on one local machine against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only. Nothing was run against the live system, and nothing here is a statement about it.

**No financial approval has been given. Engineering verification does not replace accountant acceptance.** The ledger is switched off on the live system. The software refuses to switch it on while any account or mapping is unapproved, and asks for the accountant's name, an approval date, a time zone and a dry run less than seven days old (tested: Ledger 1, Ledger 2 and Phase 9.5). That block stays.

| # | Item | Evidence prepared by engineering | Accepted by the business |
|---|---|---|---|
| 1 | Chart of accounts | Proposed chart; every account must be approved by name (`phase-09-5-chart-of-accounts.md`) | NOT GIVEN |
| 2 | Posting policies (sixteen decisions) | `phase-09-5-accounting-policy-decisions.md`; the defaults are listed in `phase-12-ledger-certification.md` | NOT GIVEN |
| 3 | Inventory costing | Actual cost per item; items with no cost are held by name, never valued at zero (Ledger 11) | NOT GIVEN |
| 4 | Revenue and COGS recognition | Revenue at invoice, cost at shipment; a shipment not yet billed is listed (Ledger 8 to 10, Reconciliation 5) | NOT GIVEN |
| 5 | Opening balances | **None taken for live. None invented.** The dry run on a copy of live has not been run (W-005) | NOT GIVEN |
| 6 | Accounts receivable | Ledger equals open invoices on QA (Reconciliation 2: pass) | NOT GIVEN |
| 7 | Ledger reconciliation | 6 of 6 scenarios pass on QA; nothing on live | NOT GIVEN |
| 8 | External accounting integration | An export file exists and is tested (Ledger 17). **No connection to an accounting system exists**; which system, and its account numbers, are the accountant's to give | NOT GIVEN |
| 9 | Financial reports | Trial balance, revenue by branch and customer, receivables, stock value, gross margin on material: agree with the journal on QA (7 of 7 scenarios pass) | NOT GIVEN |

## Sign-off

No sign-off has been given. Claude prepares this form and cannot fill the last three columns.

| Approver (role) | Name | Decision | Date | Evidence on file |
|---|---|---|---|---|
| Qualified accountant (external or internal) | ________________ | NOT GIVEN | ________________ | none |
| CFO or owner | ________________ | NOT GIVEN | ________________ | none |
