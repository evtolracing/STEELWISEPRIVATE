# Phase 2: correction plan and what was done

The plan was drawn from the Phase 1 register (the findings assigned to Phase 2) and from what the Phase 2 code reading added (the C-series). Work was done in five batches. After each batch the tests that touch it were run before the next began, and each fix has an automated check that fails without it, as the engineering standard requires.

Priorities: P0 critical security, financial integrity, data corruption or outage. P1 essential workflow failure or significant operational risk. P2 functional, architectural or maintainability deficiency. P3 minor.

## The batches

| Batch | Commit | What | Findings | Checked by |
|---|---|---|---|---|
| 1 | `5886712` | Branch boundary in the database client; orders get a branch (`Order.locationId`, with a SQL Editor file); sign-in sets the scope | B-003 | `qa/sim/branch-boundary.mjs` 37 checks (25 fail with the boundary off); 9 unit tests; a simulation cycle and the sweep |
| 2 | `f6faf44` | Multi-step saves made all-or-nothing on shop-floor operations, job planning, staging, recipes and logins; who may change a login | B-010, C-001, C-003 | `qa/sim/phase2-integrity.mjs`; 5 unit tests |
| 3 | `f6faf44` | Field lists on work centers, equipment, maintenance orders; empty saves refused; shop-floor races closed; job moves made conditional | B-007, B-008, C-004, C-005 | `phase2-integrity`: 43 checks at that point, 32 failing on the code before |
| 4 | `bcba5a1` | Counter sale takes shelf stock and a void returns it; a department or role for every changing route | B-025, B-004 | `phase2-integrity` counter section; unit test on the rule table; `qa/tools/access-coverage.mjs` |
| 5 | `bcba5a1` and the final commit | Three routes that crashed now answer plainly; two screens stop inventing records; the override handler on order entry; creating a login saved with its audit line; dependency audit | B-006, C-007, C-008, B-010, E-011 | Baseline probe (0 server errors); `qa/tools/frontend-checks.mjs`; `phase2-integrity` |

## By priority

### P0

None open in Phase 2's scope. The two P0 findings still in the register (X-001, X-002: sample screens once shown as real) were neutralised in Workstream 6 by labelling every one; building the modules is decision 4 and belongs to the module phases.

### P1

| Finding | Correction | Status |
|---|---|---|
| B-003 Branch boundary | One filter under every query, set from the signed-in user | VERIFIED FIXED |
| B-004 Sixteen areas with no department | One rule table; a coverage check in the gates | VERIFIED FIXED |
| C-001 Branch manager could become super admin | `lib/userAdminRules.js` on all four login routes | VERIFIED FIXED |
| C-005 Shop-floor records wrong under simultaneous use | Row locks on completion; closed jobs refused; conditional status moves | VERIFIED FIXED |
| B-009 Two stock lists and two order pipelines | Decided (decision 1); fenced by rules | DEFERRED TO PHASE 3: it is a data migration |
| E-004 Database value checks | | DEFERRED TO PHASE 3 |
| E-011 Package advisories | Audited again: none critical | REQUIRES BUSINESS DECISION (major-version upgrades) |
| E-014 Request limit per instance | | DEFERRED TO PHASE 10 (host) |
| E-015 Restore never tested | | REQUIRES BUSINESS DECISION (the owner's database) |
| E-023 Cockpit loads everything | | DEFERRED TO PHASE 11 |

### P2

| Finding | Correction | Status |
|---|---|---|
| B-007 Request body passed to the database | Field lists | VERIFIED FIXED |
| B-008 Saves from nothing | Minimum content checks | VERIFIED FIXED |
| B-010 Saves in several steps | Transactions | VERIFIED FIXED for 10; the rest dispositioned |
| B-025 Counter sale and stock | Shelf stock taken and returned in the sale's own transaction | VERIFIED FIXED |
| C-003 Plans filed under "FWA" | Branch from the work center, order or planner | VERIFIED FIXED |
| C-004 Work centers could not be created | Field list without the two columns that do not exist | VERIFIED FIXED |
| C-007 Screens inventing records | Empty list and the reason | VERIFIED FIXED |
| C-002, C-006, C-009, C-010, C-011, C-013 | | DEFERRED TO SPECIFIC PHASE, each with reason, target, correction, dependencies, acceptance and verification in `findings-register.md` |
| B-014, E-018, E-019, E-021 | | DEFERRED TO SPECIFIC PHASE, same |
| E-012 Raw error text | Already removed by the reply layer | VERIFIED FIXED (sweep) |
| E-016 No lint | Lint exists and runs on pull requests | VERIFIED FIXED |

### P3

B-006 VERIFIED FIXED. C-008 VERIFIED FIXED. B-020 NOT APPLICABLE (the finding was wrong). B-013, B-024, C-012 DEFERRED TO SPECIFIC PHASE.

## Rules that guided each correction

- The smallest complete change. The branch boundary is one new file and four small edits, not a change to 300 handlers.
- No reply shape changed. A refusal that did not exist before answers with the status the rest of the API already uses (400 bad values, 403 not allowed, 404 not found or not yours, 409 not in a state that allows it).
- No business policy invented. Where a rule was needed and the owner had given one (decisions 2, 3 and 6), it was applied as given and written down. Where none exists, the finding waits.
- Nothing removed, no test disabled, no mock put in place of a real implementation.

## Decisions the corrections rest on

| Decision | Applied as | Where to change it |
|---|---|---|
| 2: staff are held to their own branch; super admin and high-level management see all | "High-level management" is these roles: super admin, tenant owner, admin, executive, CFO, COO, CIO, division director, operations manager, sales director, credit manager, data analyst, auditor, integration admin. Everyone else sees their home branch plus any branches assigned to them | `ALL_BRANCH_ROLES` in `lib/branchScope.js` |
| 3: best logic for the unruled areas | The table in `phase-02-service-boundaries.md` | `WRITE_RULES` in `lib/roleAccess.js` |
| 6: a counter sale reduces stock | Pieces come off the selling branch's shelf stock; selling more than is there is refused; a product with no shelf stock on file still sells, with a note | `takeShelfStock` in `routes/quickSale.js` |

Two points in that table are the engineer's reading and are open to the owner: the list of roles that see every branch, and whether an item with no shelf stock on file may be sold.

## What has to happen before this code is merged

1. The owner applies the SQL Editor files in order. Phase 2 adds a fifth: `src/backend/prisma/upgrades/sql-editor/20261113190000_order_branch.sql` (tested twice on a populated copy: 170 orders, 163 given a branch from their first shipment or their creator; the second run changed nothing).
2. Every staff login needs a home branch. A login with none, and no all-branch role, will see no orders, stock, jobs or shipments. The QA database check "users with no home branch" counts them; the same query should be run on the live database before merging.
3. Orders that the file could not give a branch (7 of 170 on the copy) are visible only to all-branch roles until someone sets their branch.
