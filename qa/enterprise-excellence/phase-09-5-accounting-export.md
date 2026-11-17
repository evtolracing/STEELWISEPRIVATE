# Phase 9.5: export to an external accounting system

Date: 2026-11-16.

## What was found

- No connection to QuickBooks, Xero or any other accounting product exists in the code, and none is configured. No credential for one is on file. (Text search of `src/backend/src` and `src/frontend/src` before this phase; Phase 8 finding N-025.)
- Which accounting product the owner's accountant uses is not on record in any document read. It is one of the open questions of N-025.
- No account at QuickBooks or Xero was available in this session, so nothing could be tested against either. **Their import capability is NOT VERIFIED.** This document does not claim that any file made here can be imported into either product.

## What was built

A controlled export of posted journal entries to a file. Nothing is sent to any outside system. `src/backend/src/services/ledgerReports.js` (`createExport`, `exportFile`, `settleExport`), reached from Finance, Export.

| Control | How it works | Tested by |
|---|---|---|
| No account is guessed | Every ledger account used by the entries in the range must have an external account name for that provider. If one is missing, nothing is exported and the answer names the accounts | "Export: nothing leaves without an approved account mapping, each entry is exported once, and the file defends against spreadsheet formulas" |
| An entry is exported once | Each entry is recorded against the batch; a second export of the same dates finds nothing new. Two exports at the same moment: one wins, the other is told to run again | same |
| Only posted entries | Drafts are never exported | same |
| The file is fixed when made | Its content and SHA-256 checksum are stored with the batch; downloading it again gives the same bytes | same |
| Reversals are linked | A reversal's row carries the number of the entry it reverses | same |
| Spreadsheet formula protection | A cell that starts with `=`, `+`, `-`, `@` or a tab is quoted with a leading apostrophe | same |
| A batch has an outcome | The accountant marks it ACKNOWLEDGED with the outside system's reference, FAILED with what happened, or VOID to withdraw it. Acknowledged is final. A failed batch keeps its entries for a second try; a withdrawn batch releases them into the next one | "An export batch that failed keeps its entries; a withdrawn batch releases them; an acknowledged batch is final" |
| Open months are flagged | The batch says when it includes entries from a month that is not closed | same |
| Every step is logged | Create, download and settle each write an audit row with the person | "Every change to the books is in the audit log" |
| Who may | Create and settle: the finance roles. Read and download: finance, executive, auditor | Group "Concurrency, authorization and failure recovery" |

## The file

Comma-separated, one row per journal line, with two comment lines at the top. The first names the batch, the dates, the number of entries and the total. The second reads: "This file has not been validated for import into any accounting product. Have the accountant confirm the layout before it is loaded anywhere."

Columns: batch, entry number, entry date, entry kind, reverses entry, line, external account, ledger account, ledger account name, debit, credit, currency, branch, customer id, product id, tax state, source, memo.

The same layout is produced whichever provider is chosen (GENERIC, QUICKBOOKS or XERO). The provider only selects which set of external account names is used and keeps each provider's "already exported" record apart. **A layout specific to QuickBooks or to Xero has not been built**, because no document or test account was available to build it against, and the instruction is not to assume a generic file imports.

## What would be needed for a live connection (not built)

| Need | Status |
|---|---|
| The accountant's choice of product and edition | REQUIRES BUSINESS DECISION (N-025) |
| That product's journal import format or API, read from its current documentation | NOT DONE in this phase |
| A test company at that product to import into | Not available |
| Credentials, stored as host settings | The owner's |
| The external account name for each of the 22 ledger accounts | The accountant's; entered in Finance, Export |
| Approval to create entries in the outside system | Required by the instruction; not given |

Until those exist, the supported way is: the accountant downloads the file, confirms or adapts the layout for their product, loads it by hand, and records the reference back on the batch.

## Direction

One way only: out. Nothing is read from an outside accounting system, and no entry made outside comes back.

## Findings

- W-011: no provider-specific layout; QuickBooks and Xero import NOT VERIFIED.
- N-025 stays REQUIRES BUSINESS DECISION for the choice of accounting product; this phase built the ledger and the controlled file it asked about.
