# Phase 3: migration review

> **Updated after the owner's decisions of 2026-11-13.** Shipping without a reservation (G-019), stock movement in processing and remnants (M-016, G-006, G-008), stock corrections (I-016), invoice numbering (G-017) and retention (G-016) were decided and built after this file was first written. Rows below that name those findings are marked. The detail is in `phase-03-owner-decisions.md`.

Every database change of this phase, how it was made safe, what it was tested on, and what the owner has to do. The owner applies database updates himself; nothing was applied to the live database.

## 1. The four changes

| Order to apply | File in `src/backend/prisma/upgrades/sql-editor/` | Copy for the owner in `/mnt/project-files/database-updates/` | What it does |
|---|---|---|---|
| 6 | `20261113210000_reference_integrity.sql` | `6-20261113210000_reference_integrity.sql` | 15 foreign keys, 8 indexes for them, 15 value checks, the "FWA" default removed from `DispatchJob.locationId`, 10 duplicate indexes dropped |
| 7 | `20261113211000_request_keys.sql` | `7-20261113211000_request_keys.sql` | New table `RequestKey` with its unique rule and index |
| 8 | `20261113212000_quote_branch.sql` | `8-20261113212000_quote_branch.sql` | Branch column on `Quote` and `RFQ` with indexes and foreign keys; existing quotes take their writer's home branch, existing requests take the branch of their first quote; the rest stay unassigned and are seen by every branch |
| 9 | `20261113220000_document_counters.sql` | `9-20261113220000_document_counters.sql` | New table `DocumentCounter`: the last number used for invoices and for credit memos, started from the highest number on file. Added after the owner's decision that invoice numbers are never skipped or repeated. Run twice on the 85-branch copy: 0.16 s, series started at INV 116 and CM 9; the second run changed nothing. **The code cannot number an invoice without this table**, so it must be applied before the code is deployed |

Files 1 to 5 are from earlier phases and the owner reports having applied them. Each file is made by `npm run db:sql-editor -- <migration>` from the migration of the same name, as the repository's rules require.

## 2. Safety properties

| Property | How |
|---|---|
| Safe to run twice | Each file checks the migration record first and skips itself with a notice if already applied. Inside, every statement is also guarded (`IF NOT EXISTS`, `DROP … IF EXISTS`, constraint existence checks) |
| No long lock on a busy table | Foreign keys and checks are added `NOT VALID` (a brief lock, no scan) and validated in a second step that does not block reads or writes |
| Cannot fail on old data | Before validating a key, the file counts rows that break it. If any exist it prints a notice with the count and leaves the key in force for new rows only. Each value check is added only if no existing row breaks it; otherwise a notice names the check and the count |
| No data removed | No table, column or row is dropped or deleted. The only values written are the new branch on quotes and requests |
| No amounts or quantities changed | None |
| Backward compatible with the code now live | Old code runs against the new schema: new columns are optional, the new table is unused by old code, and the checks only refuse values the old code does not send in normal operation |
| New code needs the new schema | The Phase 3 code reads `Quote.locationId`, `RFQ.locationId` and `RequestKey`. **Apply files 6, 7 and 8 before merging the pull request**, in that order |

## 3. Tests

| Test | Result |
|---|---|
| Fresh database from all 26 migrations | Applied with 0 failures at the start of every gate run |
| Each SQL Editor file run twice on a populated copy at volume (`steelwise_qa_scale3`: 85 branches, 72,240 orders, 37,625 invoices, 100,233 stock items) taken at the schema before Phase 3 | File 6: 0.62 s, every key and check validated, no notice of a broken rule; second run 0.08 s, skipped. File 7: 0.07 s; second run skipped. File 8: 0.10 s, 19 quotes given a branch; second run skipped. Catalogue after: 188 foreign keys, 26 checks on that copy, 0 not validated |
| The application on the migrated schema | The full gate run (`phase-03-regression-results.md`) |
| Each new rule refuses a bad write | 13 direct writes in two scenarios, each refused |
| Old code against the new schema | NOT EXECUTED as a separate run. Argued from the changes in section 2 |
| A dry run on a restored copy of the live database | NOT EXECUTED: no copy of the live database exists in this environment. This is the one test that would show whether live rows break a rule |

## 4. What the owner may see when applying file 6

If the live database holds rows that break a rule, the file finishes successfully and prints notices such as "foreign key … not validated: N rows" or "check … skipped: N rows". Each notice is a finding about live data, not a failure of the file. Likely candidates, from what the QA data and the code history show:

- `DispatchJob.locationId` holding "FWA" or other text (C-003).
- Invoice or order totals that differ from their parts by a fraction of a cent (G-001), which would cause the two total checks to be skipped.

Please send the notices back. A repair plan for those rows will be written and needs approval before any row is changed. Nothing in the files repairs data.

## 5. Rollback and recovery

| Change | To undo |
|---|---|
| Foreign keys and checks | `ALTER TABLE … DROP CONSTRAINT …` for each; no data is affected. The names are in the migration file |
| New indexes | `DROP INDEX` |
| Dropped duplicate indexes | Recreate from the migration history; the surviving twin serves the same queries meanwhile |
| "FWA" default | `ALTER TABLE "DispatchJob" ALTER COLUMN "locationId" SET DEFAULT 'FWA'`. Not recommended: the value is no branch |
| `RequestKey` | `DROP TABLE "RequestKey"` after the code that uses it is rolled back |
| Branch on quotes and requests | Drop the two columns after the code is rolled back. The backfilled values are lost; they can be recomputed |
| The code | Revert the pull request. The schema changes can stay in place under the old code |

A rollback script was not written as a file, because every step is a single statement and which ones to run depends on what went wrong. If the owner wants one prepared, it is ten minutes of work.

## 6. Order of deployment

1. Apply files 6, 7 and 8 in the provider's SQL editor. Keep any notices.
2. Merge the pull request (only on the owner's word).
3. Check the deployment and the runtime log.

If step 2 happens before step 1, quotes, requests and any request carrying a key will fail until the files are applied. Nothing is lost, and applying the files clears it.

## 7. Older migrations

All 23 earlier migrations were reviewed in Workstream 5 and Phase 2. None is edited by this phase. The migration history has no failed entry on a fresh build.
