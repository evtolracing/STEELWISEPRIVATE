# Phase 12: release blockers

Date: 2026-11-19. Release candidate RC-2 (RC-1 is commit `9e12319`, the merge of Phase 11; RC-2 is RC-1 plus the corrections of this phase, listed in `phase-12-release-baseline.md`). Everything here was run in this session on one local machine against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only. Nothing was run against the live system, and nothing here is a statement about it.

**28 blockers stand** under the policy of section 42: 23 open findings and 5 missing approvals or acceptances. None was relabelled as an improvement, and no finding was deleted or downgraded to shorten this list.

## Missing acceptance and authorization

| # | Policy clause | State |
|---|---|---|
| HB-1 | Missing required accounting acceptance | No accountant has reviewed the chart of accounts, the mappings, the posting rules or the sixteen policies (W-001). The ledger stays switched off on live and the software refuses to switch it on without the approvals. |
| HB-2 | Failed mandatory UAT: not run | No business user has run the acceptance scripts in phase-12-user-acceptance.md. Engineering ran the workflows; that is not user acceptance. |
| HB-3 | Missing deployment authorization | No approval from Business, Finance, Operations, Security, IT or the Executive is on file. None is claimed. |
| HB-4 | Performance thresholds were never approved | Phase 11 measured against proposed limits. Dispatch at peak is above the proposal (Z-006). Gate F cannot pass against limits nobody approved. |
| HB-5 | Database updates not confirmed on live | Updates 13 to 18 ship as SQL Editor files. Which are applied on live is not known to this session; the sign-in screen names a missing one. |

## Open findings that block

| Finding | Severity | Status | Why it blocks (policy clause) | What closes it | Who |
|---|---|---|---|---|---|
| B-009 | P1 | IN PROGRESS | Unresolved confirmed P1 | Expected: One stock ledger and one order record, with database rules on them. | Engineering, then owner |
| B-016 | P1 | REQUIRES BUSINESS DECISION | Unresolved confirmed P1 | not done, and no approval to defer it past go-live is on file. The owner either approves the deferral in writing (it then becomes DEFERRED WITH APPROVAL) or schedules the work. It does not stop the work the pilot covers. | Owner |
| B-019 | P1 | BLOCKED | Scheduled work and alerts reach nobody on the live host: failures would go unseen | Expected: To be decided per function. | Owner (access or host) |
| D-011b | P1 | FIXED — NOT VERIFIED | Unresolved confirmed P1 | on a self-hosted server a file over the limit is refused with 413 and a stored file downloads byte for byte (tested). On the hosted site, with its 4 MB limit and its own file store, neither was exercised: NOT VERIFIED there. On the deployme | Owner applies and confirms on live |
| E-011 | P1 | REQUIRES BUSINESS DECISION | Unresolved confirmed P1 | Expected: No known high or critical | Owner |
| E-015 | P1 | FIXED — NOT VERIFIED | Unverified backup recovery on the live host | Expected: A restore is tested | Owner applies and confirms on live |
| E-017 | P2 | REQUIRES BUSINESS DECISION | Scheduled work and alerts reach nobody on the live host: failures would go unseen | Expected: Someone is told when errors spike | Owner |
| G-011 | P2 | FIXED — NOT VERIFIED | Database protection of financial history is not in force on the live database until update 17 is applied and the server uses the limited role | on the QA database the application connects as a role that cannot change or delete history, switch off the guards, or change the schema (tested again). On the live database this holds only after the owner applies database update 17 and poin | Owner applies and confirms on live |
| I-011 | P1 | REQUIRES BUSINESS DECISION | Unresolved confirmed P1: sample screens on the menu. They are labelled and save nothing, which removes the risk of being taken for real; the owner must still decide in writing to go live with them, hide them, or wait | not built. Owner decision 4 (2026-11-13) says build it; no approval to defer it past go-live is on file. The screens are labelled as samples, save nothing, and the manual now says so (AA-006). For go-live the owner chooses: go live with the | Owner |
| I-012 (D-024) | P1 | REQUIRES BUSINESS DECISION | Unresolved confirmed P1 | not done, and no approval to defer it past go-live is on file. The owner either approves the deferral in writing (it then becomes DEFERRED WITH APPROVAL) or schedules the work. It does not stop the work the pilot covers. | Owner |
| K-007 | P1 | IN PROGRESS | Unresolved confirmed P1 | Expected: A costing method chosen by the owner (actual cost per item, average, or standard), applied at receipt and carried by every movement. | Engineering, then owner |
| L-026 | P1 | IN PROGRESS | Unresolved confirmed P1 | Expected: Per the owner's costing method (K-007): material cost carried to pieces by weight, labor and machine cost from recorded time and rates. | Engineering, then owner |
| M-011 | P1 | REQUIRES BUSINESS DECISION | Unresolved confirmed P1: sample screens on the menu. They are labelled and save nothing, which removes the risk of being taken for real; the owner must still decide in writing to go live with them, hide them, or wait | not built. Owner decision 4 (2026-11-13) says build it; no approval to defer it past go-live is on file. The screens are labelled as samples, save nothing, and the manual now says so (AA-006). For go-live the owner chooses: go live with the | Owner |
| S-010 | P1 | ACCEPTED RISK WITH APPROVAL | Unresolved confirmed P1 | Expected: A promise from real capacity and stock, or none | Owner |
| X-001 | P0 | REQUIRES BUSINESS DECISION | Unresolved confirmed P0: sample screens on the menu. They are labelled and save nothing, which removes the risk of being taken for real; the owner must still decide in writing to go live with them, hide them, or wait | not built. Owner decision 4 (2026-11-13) says build it; no approval to defer it past go-live is on file. The screens are labelled as samples, save nothing, and the manual now says so (AA-006). For go-live the owner chooses: go live with the | Owner |
| X-002 | P0 | REQUIRES BUSINESS DECISION | Unresolved confirmed P0: sample screens on the menu. They are labelled and save nothing, which removes the risk of being taken for real; the owner must still decide in writing to go live with them, hide them, or wait | not built. Owner decision 4 (2026-11-13) says build it; no approval to defer it past go-live is on file. The screens are labelled as samples, save nothing, and the manual now says so (AA-006). For go-live the owner chooses: go live with the | Owner |
| X-007 | P1 | REQUIRES BUSINESS DECISION | Unresolved confirmed P1 | Expected: Rules stored on the server and set by the business | Owner |
| X-009 | P1 | REQUIRES BUSINESS DECISION | Unresolved confirmed P1: sample screens on the menu. They are labelled and save nothing, which removes the risk of being taken for real; the owner must still decide in writing to go live with them, hide them, or wait | not built. Owner decision 4 (2026-11-13) says build it; no approval to defer it past go-live is on file. The screens are labelled as samples, save nothing, and the manual now says so (AA-006). For go-live the owner chooses: go live with the | Owner |
| W-001 | P1 | REQUIRES BUSINESS DECISION | Unapproved financial posting policies; missing required accounting acceptance | Expected: An accountant approves the policies, the chart and the mappings; the owner records the approval; a dry run on a copy of live data is signed; then the books are started. | Owner |
| W-005 | P2 | BLOCKED | The ledger cutover has never been rehearsed on a copy of the live data | still not run on a copy of the live database: no copy was provided, and this session has no access to live data by rule. Blocked on the owner making the copy. It is step 2 of phase-12-cutover-plan.md and a condition of financial acceptance. | Owner (access or host) |
| W-014 | P1 | FIXED — NOT VERIFIED | Database protection of financial history is not in force on the live database until update 17 is applied and the server uses the limited role | Expected: The application connects as a role that owns no ledger table and cannot disable triggers; superuser use is limited and logged. | Owner applies and confirms on live |
| Y-008 | P1 | FIXED — NOT VERIFIED | Database protection of financial history is not in force on the live database until update 17 is applied and the server uses the limited role | Expected: The application runs as a role that can read and write business rows only: no owner rights, no trigger control, history insert-only, the update record read-only. | Owner applies and confirms on live |
| Y-009 | P2 | FIXED — NOT VERIFIED | Database protection of financial history is not in force on the live database until update 17 is applied and the server uses the limited role | Expected: Schema changes come only from the owner applying a database update. | Owner applies and confirms on live |

## The clauses of section 42, one by one

| Clause | State | Evidence |
|---|---|---|
| Unresolved confirmed P0 defects | **2 open** | X-001, X-002 |
| Unresolved confirmed P1 defects affecting critical workflows | **17 P1 open**; those touching order to cash, stock, production, shipping or money are in the table above | B-009, B-016, B-019, D-011b, E-011, E-015, I-011, I-012 (D-024), K-007, L-026, M-011, S-010, X-007, X-009, W-001, W-014, Y-008 |
| Material unexplained financial discrepancies | None on QA. **Unknown on live** | 6 of 6 scenarios pass |
| Material unexplained inventory discrepancies | None on QA. **Unknown on live** | Reconciliation 3; Phases 3 and 6 |
| Critical authorization failures | None found | 11 of 11 scenarios pass; Phase 10 security: 277 of 277 pass, 889 checks |
| Unverified backup recovery | **Blocks** | E-015 |
| Failed critical transaction recovery | None failed | Phase 11 failure injection; process checks |
| Unapproved financial posting policies | **Blocks** | W-001 |
| Missing required accounting acceptance | **Blocks** | HB-1 |
| Failed mandatory UAT | **Blocks: not run** | HB-2 |
| Missing deployment authorization | **Blocks** | HB-3 |

## Every open finding (section 43: nothing silently unfinished)

114 open (2 P0, 17 P1, 53 P2, 41 P3, 1 P4).

| Finding | Severity | Status | Area | What is open | Blocks production |
|---|---|---|---|---|---|
| B-009 | P1 | IN PROGRESS | Second stock list, order hub, stop work | Two stock lists and two order pipelines. The second of each has no database rule on any value, and two requests at once can overwrite each other. | **yes** |
| B-012 | P2 | REQUIRES BUSINESS DECISION | Lists across the server | Some are small set-up lists where no limit is harmless; others grow with products, operators and partners. | no |
| B-013 | P3 | REQUIRES BUSINESS DECISION | Code base | It is kept, read by new engineers and scanned by every tool. | no |
| B-014 | P2 | REQUIRES BUSINESS DECISION | Code base | Business rules sit inside route handlers and large screens, where a unit test cannot reach them. | no |
| B-016 | P1 | REQUIRES BUSINESS DECISION | Testing | Order to cash is covered in depth. Outside it, most changing routes have no success-path test. | **yes** |
| B-017 | P2 | REQUIRES BUSINESS DECISION | Database | A third of the schema is design that was never built (see X-009). | no |
| B-019 | P1 | BLOCKED | Platform | Everything happens only when someone opens a screen or presses a button. | **yes** |
| B-022 | P3 | REQUIRES BUSINESS DECISION | Demo and QA data | The demo seed writes rows directly and skips the rules. | no |
| B-024 | P3 | REQUIRES BUSINESS DECISION | Code base | The 39 effect warnings are the ones that can be defects: an effect that reads a value it does not list can show stale data. They have not been read on | no |
| C-009 | P2 | REQUIRES BUSINESS DECISION | Access control | The core order-to-cash and shop records are held; the rest are not. | no |
| C-013 | P2 | REQUIRES BUSINESS DECISION | Operations cockpit | Any text shaped like a recommendation moves jobs. | no |
| D-011b | P1 | FIXED — NOT VERIFIED |  | On the hosted site uploaded files had nowhere to be stored. | **yes** |
| D-020 | P2 | REQUIRES BUSINESS DECISION |  | 155 of 352 distinct API calls written in the screens have no server route (`qa/api-contract.md`). Largest groups: work centers, jobs, QA/QC, pricing,  | no |
| D-023 | P3 | REQUIRES BUSINESS DECISION |  | The demo seed data contains 49 inconsistent orders (shipped quantities with no shipment, fully shipped orders still marked confirmed). | no |
| D-024 | P2 | REQUIRES BUSINESS DECISION |  | Stock is held in two unconnected sets of tables: the coil and inventory records used by orders and shipping, and a separate unit-tracking set under `/ | no |
| D-027 | P3 | REQUIRES BUSINESS DECISION |  | The request rate limit counts per server instance, so on the hosted site the real limit is higher than configured. | no |
| D-033 | P2 | REQUIRES BUSINESS DECISION |  | The app does not charge cards. A card sale is recorded with the approval code from a separate card terminal. | no |
| D-034 | P2 | REQUIRES BUSINESS DECISION |  | Receipts, quotes and invoices are not emailed or texted. The buttons say so. | no |
| D-035 | P3 | REQUIRES BUSINESS DECISION |  | Sales tax is charged only for states that have a rate set. A sale at a branch in a state with no rate charges no tax and says so on the screen. A logi | no |
| D-036 | P2 | REQUIRES BUSINESS DECISION |  | Sales Dashboard fixed in Phase 2 Workstream 2 (S-012): it now counts from the database. The Order Hub RFQ pages remain a separate console, not in the  | no |
| E-011 | P1 | REQUIRES BUSINESS DECISION | Platform | Known vulnerabilities in installed packages: backend 8 (1 critical, 4 high), frontend 11 (4 high) | **yes** |
| E-015 | P1 | FIXED — NOT VERIFIED | Platform | No evidence that a backup has ever been restored | **yes** |
| E-017 | P2 | REQUIRES BUSINESS DECISION | Platform | No error tracking or alerting service; logs only | **yes** |
| E-018 | P3 | REQUIRES BUSINESS DECISION | Code | Five server route files of 870 to 1,390 lines; five screen files over 1,000 lines | no |
| E-019 | P2 | REQUIRES BUSINESS DECISION | Database | Some tables carry a tenant id; whether every query honours it has not been audited | no |
| E-021 | P2 | REQUIRES BUSINESS DECISION | API | List routes answer in two shapes: a bare list, or `{ data, meta }` | no |
| F-008 | P2 | REQUIRES BUSINESS DECISION | Web store checkout | The store shows the buyer an estimate of tax by the ship-to state. On acceptance the order is taxed by the selling branch (rule 27). The two can diffe | no |
| G-003 | P2 | REQUIRES BUSINESS DECISION | Database | Most of the 217 are in the 93 tables that hold no rows and belong to modules that are designed but not built (X-009, B-017). | no |
| G-011 | P2 | FIXED — NOT VERIFIED | Platform | History can be rewritten by any code with database access. | **yes** |
| G-013 | P3 | REQUIRES BUSINESS DECISION | Stock items, stock search, heat trace | Both grow in step with the whole company's data. Both are far inside the half-second target today. | no |
| G-015 | P2 | BLOCKED | Platform | Unknown. | no |
| G-018 | P3 | REQUIRES BUSINESS DECISION | Database | The column is optional, so that existing rows and all-branch logins keep working. | no |
| G-020 | P3 | REQUIRES BUSINESS DECISION | Orders | Status is protected; other fields are last write wins. | no |
| H-012 | P2 | REQUIRES BUSINESS DECISION | Platform | With N instances a limit is up to N times its number, and the report shows the calls of the instance that answered. | no |
| H-014 | P2 | REQUIRES BUSINESS DECISION | Partner API | They answered 500. | no |
| H-015 | P2 | REQUIRES BUSINESS DECISION | Platform | Not connected. Since Phase 4 the integration report lists each one with its state and what happens without it. | no |
| I-011 | P1 | REQUIRES BUSINESS DECISION | Supplier quality (six screens) | Inbound receiving, IQC inspections, nonconformances, SCARs, scorecards and suppliers show invented suppliers, inspections and scores. No server side e | **yes** |
| I-012 (D-024) | P1 | REQUIRES BUSINESS DECISION | Inventory | Two stock lists: the one orders, receiving, shipping and invoices update, and a second in RFID unit tables that none of them update. The Inventory men | **yes** |
| I-017 | P2 | REQUIRES BUSINESS DECISION | Receiving | A heat must be on file before stock is received against it, and heats are added one at a time | no |
| J-008 | P2 | REQUIRES BUSINESS DECISION | Customers | Six settings look active and do nothing. | no |
| J-012 | P3 | REQUIRES BUSINESS DECISION | Retail POS | Free text, linked to no stock item (code read), so the sale has no stock record to reduce. | no |
| K-006 | P2 | REQUIRES BUSINESS DECISION | Steel Outlet remnants | A separate list. | no |
| K-007 | P1 | IN PROGRESS | Inventory valuation | No cost unless typed by hand. | **yes** |
| K-008 | P2 | REQUIRES BUSINESS DECISION | Cycle counts | Single-item correction only. | no |
| K-009 | P3 | REQUIRES BUSINESS DECISION | Warehouse locations | Free text. | no |
| K-010 | P2 | REQUIRES BUSINESS DECISION | Replenishment | Nothing. | no |
| K-011 | P2 | REQUIRES BUSINESS DECISION | Purchasing | Exact, held. | no |
| K-012 | P2 | REQUIRES BUSINESS DECISION | Purchasing | Not recorded. | no |
| K-013 | P3 | BLOCKED | Scanning | Lookup by typed or pasted number verified; hardware not tested. | no |
| L-023 | P2 | REQUIRES BUSINESS DECISION | Quality control | Not built. | no |
| L-025 | P2 | REQUIRES BUSINESS DECISION | Scheduling | A queue order with times where estimates exist, clearly labelled. | no |
| L-026 | P1 | IN PROGRESS | Production costing | No production cost exists. | **yes** |
| L-027 | P3 | REQUIRES BUSINESS DECISION | Manufacturing | Not built. | no |
| L-028 | P2 | IN PROGRESS | Quality control | A fixed list of unknown origin. | no |
| L-029 | P3 | REQUIRES BUSINESS DECISION | Jobs | 0 by convention. | no |
| L-030 | P3 | REQUIRES BUSINESS DECISION | Equipment | None is made. | no |
| M-011 | P1 | REQUIRES BUSINESS DECISION | Production quality (5 screens), Bills of material | Sample data presented as real; the BOM screen was hard-wired to samples | **yes** |
| M-017 | P2 | REQUIRES BUSINESS DECISION | Jobs | The job rules allow some backward moves (for example in process back to ordered); `/start` and `/complete` keep their own checks; the print hook runs  | no |
| M-018 | P2 | IN PROGRESS | Help manual | The pages for time tracking and the order board described features that do not exist (clock in and out, timesheet approval, an order panel) | no |
| N-024 | P4 | FIXED — NOT VERIFIED | Tests | Failed in the first hour of each week. | no |
| N-025 | P2 | REQUIRES BUSINESS DECISION | Accounting | Not built. | no |
| N-026 | P2 | REQUIRES BUSINESS DECISION | Freight and carriers | None is. | no |
| N-028 | P3 | REQUIRES BUSINESS DECISION | Customer communication | Not built. | no |
| S-009 | P2 | REQUIRES BUSINESS DECISION | Remnants | Remnant discount is fixed in code at 15% and 25% on two screens | no |
| S-010 | P1 | ACCEPTED RISK WITH APPROVAL | Delivery promise | Delivery promise, cutoff times, branch comparison and split shipments run on invented data in the browser, including the promise date at web checkout | **yes** |
| S-020 | P2 | REQUIRES BUSINESS DECISION | Customers | "Default Discount %" on the customer screen is applied nowhere | no |
| S-024 | P2 | IN PROGRESS | Help manual | Pricing, Sales Dashboard, Sales Rep Mobile and customer pages described tabs, contracts, signatures, visit logs and offline use that do not exist | no |
| S-027 | P2 | REQUIRES BUSINESS DECISION | Quotes | Quote lines are priced by hand; the screen offers no customer price because RFQ lines are free text, not products | no |
| U-004 | P3 | REQUIRES BUSINESS DECISION | Several secondary screens | Call server routes that do not exist (D-020) | no |
| U-008 | P3 | ACCEPTED RISK WITH APPROVAL | Sales Rep Mobile, delivery preview | A date nobody computed | no |
| U-012 | P3 | REQUIRES BUSINESS DECISION | Customers > Preferences | "Default Discount %" is offered and applied nowhere | no |
| U-019 | P3 | REQUIRES BUSINESS DECISION | Supplier quality, six screens | Invented data presented as real | no |
| U-022 | P3 | REQUIRES BUSINESS DECISION | Receiving | A heat must be added before its stock, one at a time | no |
| U-029 | P3 | REQUIRES BUSINESS DECISION | Production quality, BOMs | Invented data presented as real | no |
| U-035 | P3 | REQUIRES BUSINESS DECISION | Freight and logistics | Invented routes, rates and tracking presented as real | no |
| U-037 | P3 | REQUIRES BUSINESS DECISION | Safety, maintenance, training, contractors, customer quality, executive, provenance | Invented data presented as real | no |
| U-040 | P3 | REQUIRES BUSINESS DECISION | Menu | Lists 58 sample screens beside the real ones | no |
| U-041 | P3 | ACCEPTED RISK WITH APPROVAL | Checkout, order entry | Promise dates and branch suggestions from invented rules | no |
| V-011 | P3 | REQUIRES BUSINESS DECISION | Sample screens mostly | 17. | no |
| V-018 | P3 | REQUIRES BUSINESS DECISION | Other long forms | Order entry only. | no |
| V-027 | P2 | REQUIRES BUSINESS DECISION | Order board, production board, schedule | Grows with the data. | no |
| V-029 | P3 | REQUIRES BUSINESS DECISION | Dialogs | Focus on the dialog. | no |
| V-030 | P3 | REQUIRES BUSINESS DECISION | Orders | Dead buttons on real screens. | no |
| V-031 | P3 | ACCEPTED RISK WITH APPROVAL | Application shell | A fixed list. | no |
| V-035 | P3 | REQUIRES BUSINESS DECISION | Design system | A third of the files carry their own. | no |
| V-036 | P3 | REQUIRES BUSINESS DECISION | Tables and dialogs | Tables are built by hand per screen, so sorting, paging, an empty state and keyboard row opening exist on some and not on others. Phase 9 made the beh | no |
| X-001 | P0 | REQUIRES BUSINESS DECISION | Safety (13 screens, on the menu) | Incidents, inspections, permits, training, observations, corrective actions and stop work all showed invented records. The calls to the server are com | **yes** |
| X-002 | P0 | REQUIRES BUSINESS DECISION | Maintenance (3), training (4), contractors and visitors (4), customer quality (4), executive (5), quality dashboard, test entry, provenance lookup | 23 more screens, most on the menu, showed invented data with no notice. Provenance lookup returned the same invented chain of custody for any heat or  | **yes** |
| X-007 | P1 | REQUIRES BUSINESS DECISION | Order entry, web checkout, online settings | Order cut-off times, delivery promise dates, the "ship from another branch" comparison (with invented branch stock), the fulfilment override and split | **yes** |
| X-008 | P2 | REQUIRES BUSINESS DECISION | Counter (`/pos`), will-call screens | The will-call pickup queue and completion screens use sample orders. The screen is not on the menu | no |
| X-009 | P1 | REQUIRES BUSINESS DECISION | Scale of sample screens | 58 of 143 screens are samples. All now say so | **yes** |
| W-001 | P1 | REQUIRES BUSINESS DECISION | Financial ledger | The ledger is built and verified on test data and is switched off. The chart of accounts, the account mappings, the posting rules and sixteen accounti | **yes** |
| W-002 | P2 | REQUIRES BUSINESS DECISION | Financial ledger; stock transfers | Whether the branches are one legal entity or several is not on record. A transfer between branches of different owning organisations is held at both e | no |
| W-003 | P3 | REQUIRES BUSINESS DECISION | Financial ledger | The books keep days. Which day an event falls on depends on the time zone chosen at activation. It is recorded then and there is no way to change it a | no |
| W-004 | P3 | REQUIRES BUSINESS DECISION | Financial ledger | Journal entry numbers come from a database sequence. They are unique and increasing, and a number is skipped wherever a save was rolled back. | no |
| W-005 | P2 | BLOCKED | Financial ledger; cutover | The cutover dry run and the activation were run on the QA database only. They have not been run on a copy of the live database, so the size of the ope | **yes** |
| W-006 | P2 | REQUIRES BUSINESS DECISION | Receiving; financial ledger | Stock can be received with no purchase order (the plain receive address and the upload). Such a receipt has no cost and no supplier, so no approved ru | no |
| W-007 | P2 | REQUIRES BUSINESS DECISION | Counter stock; receiving | Stock sold by the piece at the counter has no receiving screen. Its receipt reaches the books only through the completeness check ("record what is mis | no |
| W-009 | P2 | REQUIRES BUSINESS DECISION | Financial ledger; purchasing | A receipt credits Accounts Payable Clearing (goods received, not invoiced). Supplier invoices are not in the product, so nothing ever debits that acco | no |
| W-010 | P2 | REQUIRES BUSINESS DECISION | Financial ledger; sales orders | An order line carries one price. Nothing marks processing (cutting) apart from material, so all line revenue posts to Product Sales Revenue and nothin | no |
| W-011 | P2 | REQUIRES BUSINESS DECISION | Financial ledger; export | The export produces one file layout whichever accounting product is chosen. No layout specific to QuickBooks or Xero was built, and no import into eit | no |
| W-012 | P2 | REQUIRES BUSINESS DECISION | Counter quick sale; financial ledger | A counter sale of an item that has no stock record posts its revenue and no cost of goods, because there is no stock movement to cost. | no |
| W-014 | P1 | FIXED — NOT VERIFIED | Financial ledger; database | Posted entries are protected by database triggers. A database superuser, or the owner of the tables, can switch triggers off for a session (session_re | **yes** |
| W-015 | P3 | REQUIRES BUSINESS DECISION | Financial ledger | The person who closed a month cannot reopen it while another finance user exists. Where a company has only one finance user, that rule yields so the b | no |
| W-023 | P2 | BLOCKED | Financial ledger | The load check ran on one container with one server process and one database: 80 branches, about 1,100 events and 2,000 manual entries. Report and rec | no |
| Y-008 | P1 | FIXED — NOT VERIFIED | Database | The application connects as the database owner (a superuser on QA, the table owner on the host). That role can switch off the journal guards for a ses | **yes** |
| Y-009 | P2 | FIXED — NOT VERIFIED | Database | The application's connection could create and drop tables and functions in the public schema. | **yes** |
| Z-006 | P2 | REQUIRES BUSINESS DECISION | Shipping and invoicing | Invoices are written one at a time for the whole company, because invoice numbers must never be skipped or repeated (owner decision of 2026-11-13). Me | no |
| Z-010 | P3 | REQUIRES BUSINESS DECISION | Platform | The general ceiling on requests per address still counts per server copy. Counting it in the database would add a write to every request of every user | no |
| Z-012 | P3 | REQUIRES BUSINESS DECISION | Shipping and invoicing | When the answer to a dispatch is lost because its server copy died after saving the dispatch and before billing, sending the dispatch again answers "a | no |
| Z-014 | P3 | REQUIRES BUSINESS DECISION | Platform | A request key claimed by a server copy that then died blocks the repeat of that request for 60 seconds ("still being processed"), after which the repe | no |
| AA-007 | P2 | REQUIRES BUSINESS DECISION | Branches | A branch record holds no time zone. The books keep one business day for the whole company (the zone given when the ledger is switched on). A sale made | no |
| AA-008 | P2 | REQUIRES BUSINESS DECISION | Branches | No screen or API adds or edits a branch. A branch is added by a database script. | no |
| AA-010 | P3 | REQUIRES BUSINESS DECISION | Access control | By the department rules sales staff may dispatch a shipment and may start or complete a work order (shipments: warehouse and sales; jobs and work orde | no |
