# Phase gate report: Phase 2, Workstream 3 (inventory and purchasing)

Written 2026-11-13 to the format in `qa/ENGINEERING-STANDARD.md`, Rule 11.

## Completion status: PARTIALLY COMPLETE

This is not a pass. Thirteen findings are fixed, each with an automated check, and the server-side checks were seen to fail without the fix. One is mitigated (I-011, the supplier quality screens are labelled as samples). One is fixed pending the owner's answer to a decision card (I-012, one stock list). Four are open: purchasing does not exist (I-007), stock cannot be adjusted or counted (I-016), heats cannot be loaded from a file (I-017), and accepted web orders carry no tax (I-018, Workstream 5). The credit hold the owner chose (S-019, rule 32) was built in this workstream and is verified. Nothing here is live: one more database update waits for the owner, and pull request 30 is not merged.

## 1. Scope and discovery

In scope: stock items (the Units screens), heats, grades, products, receiving, the stock upload, holds, transfers, stock balances, the Inventory app, the supplier quality screens, and purchasing. Also the credit hold decided at the end of Workstream 2.

How it was examined: every screen in those areas was read with the server routes it calls; every code path that writes a stock balance was listed and checked against the balance identity; the upload was traced row by row to the database; journeys 2 and 3 were walked through (`operational-workflow-review.md`); cost was traced through every reply that carries a stock item; the stock, heat and receiving screens were operated in a real browser as a clerk and as a manager.

Not examined: cycle counting, reorder points, stock valuation, consignment, whether customer-owned stock can be reserved for another customer, the remnant marketplace, RFID and etched-ID scanning, bin capacity. These are listed in the scorecard.

## 2. Findings

Eighteen, I-001 to I-018, in `engineering-quality-findings.md` under "Workstream 3", each with evidence, risk, status and proof. Six were critical: the stock screens and heat screens showed sample data, the order screen priced lines at our cost, the stock upload reported success and saved nothing, the Receiving screen could not receive, and a hold neither removed availability nor could be released.

## 3. Root causes

- Screens were written against a reply shape the server never sent (`data.units`, `data.heats`), with sample rows as the fallback, so the fallback was always what showed (I-001, I-002).
- The upload wrote a movement record without the two fields that record requires; each row's error was caught and counted as "skipped", and the screen printed the number of rows sent, not the number saved (I-005).
- Stock routes passed the request body straight to the database (I-004), and no rule said who may see cost (I-009) or change a product (I-010).
- The hold route changed a status and nothing else: the balance field for held stock was never written, and no release route existed (I-008).
- Purchasing, supplier quality and stock adjustment were drawn as screens before any server side existed (I-007, I-011, I-016).
- A second stock list was built beside the first and the menu pointed at it (I-012).

## 4. Changes implemented

Stock items: real list and item screens with server-side search, a capped and counted list, cost only to buying and managing roles, an allow-list on create and edit, holds that take quantity out of availability and can be released, held stock refused at shipping, and a Move action. Order entry's stock picker prices a line at list price.

Heats, products, grades: real heat screens; every write reads a list of allowed fields with type and range checks (`lib/fieldRules.js`); products and grades are kept by named roles; a list price set or changed through the product record needs a manager and is recorded.

Receiving: one rule for the Receive form and the upload file (`lib/receivingRules.js`, `lib/receiving.js`); a receipt creates the item, its balance and a RECEIVE movement in one transaction; the upload reports the count saved and each failed row with its reason; the Receiving screen lists real receipts.

Stock balances: the database enforces on hand = available + reserved + on hold.

Credit hold (rule 32): an order that would pass the account's credit limit is saved on hold with a warning, on every path that commits an order (order entry, the orders API, quote acceptance, accepted web orders); a manager releases it; holds and releases are in the audit log; a Credit Holds screen; warnings on order entry, the counter, Sales Rep Mobile and the order screen.

Honesty: the six supplier quality screens carry a fixed "sample screen" notice; the Receiving screen says expected deliveries need purchase orders; the Inventory menu opens the real stock list; the help manual pages for inventory, receiving, heats, supplier quality and credit holds were rewritten to match.

## 5. Files modified

Backend: `lib/fieldRules.js` (new), `lib/receivingRules.js` (new), `lib/receiving.js` (new), `lib/creditRules.js` (new), `lib/creditControl.js` (new), `lib/roleAccess.js`, `routes/coils.js`, `routes/heats.js`, `routes/products.js`, `routes/grades.js`, `routes/inventory.js`, `routes/shipments.js`, `routes/orders.js`, `routes/intakeOrders.js`, `routes/quotes.js`, `routes/onlineOrders.js`, `prisma/migrations/20261113150000_stock_balance_identity/`, `prisma/upgrades/sql-editor/20261113150000_stock_balance_identity.sql`, `test/creditRules.test.js`, `test/fieldRules.test.js`, `test/receivingRules.test.js`.

Frontend: `pages/Units/UnitListPage.jsx`, `UnitDetailPage.jsx`, `pages/Heats/HeatListPage.jsx`, `HeatDetailPage.jsx`, `pages/ReceivingPage.jsx`, `pages/Orders/CreditHoldsPage.jsx` (new), `OrderDetailPage.jsx`, `CSRIntakePage.jsx`, `RetailPOSPage.jsx`, `pages/MobileRep/MobileRepIntakePage.jsx`, `components/orders/MaterialPicker.jsx`, `components/inventory/InventoryUpload.jsx`, `components/common/SampleScreen.jsx` (new), `apps/inventory/InventoryApp.jsx`, `components/layout/Sidebar.jsx`, `router/AppRouter.jsx`, `api/units.js`, `api/heats.js`, `api/inventory.js`, `help/manualContent.js`.

QA: `qa/sim/security.mjs` (sections 15 to 18 and two database checks), `qa/sim/ui-inventory.cjs` (new), `qa/sim/ui-sales.cjs`, and the registers in `qa/`.

## 6. Database changes

One: `20261113150000_stock_balance_identity` adds the check `Inventory_balance_identity`. It is added only if every existing row already satisfies it; otherwise it is skipped with a notice. The SQL Editor file `src/backend/prisma/upgrades/sql-editor/20261113150000_stock_balance_identity.sql` was run twice on a copy of the QA database (second run: "already applied", no change), the check then refused a balance that did not add up, and on a second copy holding one bad row the file skipped the check and changed nothing else. The owner applies it. The credit hold, receiving and catalog changes need no database change.

Four files now wait for the owner, in this order: `20261113031734_document_links_any_record.sql`, `20261113052550_billing_returns_file_store.sql`, `20261113062621_fk_indexes_and_stock_checks.sql`, `20261113150000_stock_balance_identity.sql`.

## 7. Tests added

- Unit: `creditRules` 8, `fieldRules` 7, `receivingRules` 9. Total now 79.
- Sweep section 15, "Stock items: lists, cost, edits, holds": 29 checks.
- Sweep section 16, "Credit hold: over the limit waits for a manager": 22 checks.
- Sweep section 17, "Heats, products and grades: checked input, right people, prices recorded": 47 checks on a database with stock (37 when no heat has stock).
- Sweep section 18, "Receiving: a receipt is real stock, and an upload says what it saved": 32 checks.
- Sweep section 11: two checks that the balance rule exists and refuses a bad balance.
- Browser: `qa/sim/ui-inventory.cjs`, 22 checks on stock items, heats, receiving and Move; six credit hold checks added to `qa/sim/ui-sales.cjs` (now 24).

## 8. Tests actually executed (this session, local)

| Test | Result |
|---|---|
| Unit tests | 79 of 79 pass |
| Three 50-job cycles, seeds 8001 to 8003, rebuilt QA database with the new database rule on | 150 of 150 pass; 2,134 API steps; 2,357 checks; reconciliation 0 problems |
| Security and safeguards sweep | 18 of 18 sections pass |
| Section 15 against the code before the fix | 26 of 29 fail there |
| Section 16 against the code before the fix | 17 of 22 fail there |
| Section 17 against the code before the fix | 32 of 37 fail there |
| Section 18 against the previous commit | 27 of 32 fail there |
| Balance rule checks before the migration was applied | 2 of 2 fail |
| SQL Editor file | Run twice on a copy; enforced; skip path checked |
| Screen check | 124 of 124 screens open |
| Sales screens operated in a browser | 24 of 24 checks pass |
| Stock screens operated in a browser | 22 of 22 checks pass |
| Frontend production build | Passes |
| Browser checks against the code before the fixes | NOT RUN |
| Upload of 2,000 rows, timed | NOT RUN |
| Benchmark of stock routes | NOT RUN |
| Lint | NOT RUN: none configured (E-016) |
| Accessibility | NOT RUN |

One cycle run during the work reported a failure ("exactly one sales order came from the quote"). It was a rerun of seed 8001 on a database that already held that seed's orders, so the check found the earlier order too. A fresh seed on the same database passed, and all three seeds pass on a rebuilt database. No code was changed for it.

## 9. Regression results

No previously passing job, sweep check or screen regressed. No simulation expectation was changed in this workstream. Behaviour changed on purpose: stock cost is no longer in replies to roles outside rule 33; products and grades can no longer be changed by every staff login (rule 35); an upload that saves nothing now answers 400 instead of 201; `/inventory` redirects to the stock items list.

## 10. Connected-module verification

- Orders, reservation, production, shipping, invoices, payments, returns and the counter were rerun in the three cycles with the credit hold, the hold rule and the database balance rule in force, and pass.
- An item received through the form is on the stock list at once and can be moved (Browser). Reserving and shipping a received item is covered only by the cycles' own fixture stock, not by an item received in the same test: NOT VERIFIED end to end.
- A credit hold blocks work orders (sweep) and is released into the normal flow (sweep, Browser). Shipping an order that was held and released was not run end to end: NOT VERIFIED.
- Customer and division isolation (sweep section 5) still passes.
- The hosted site was not touched.

## 11. Remaining findings and blockers

Decisions needed from the owner:

1. One stock list (I-012): a card is open. The recommended answer is already in place and is one file to undo.
2. Purchasing (I-007): whether purchase orders are built into STEELWISE.
3. Stock adjustments and counts (I-016): who may adjust, and above what amount a second person approves.
4. Supplier quality (I-011): whether the module is built, or the six sample screens are removed from the menu.
5. Whether stock that is still "inspection pending" may be reserved and shipped. Today it may.
6. Rules 33 to 36 to confirm (cost visibility, holds, who keeps the catalog, receiving).

Carried: I-017 (heats from a file), I-018 (web order tax, Workstream 5), 16 dead calls in `api/boms.js` and `api/batches.js` (Workstream 4), and everything still open from Workstream 2.

## 12. Continuation point

Workstream 4, Manufacturing Execution. Start with the BOM and batch screens whose calls have no route (I-015), then jobs, work orders, processing recipes, shop floor, scheduling and time tracking: screens against routes first, as here. Setup: `qa/README.md`; rebuild the QA database, run one cycle before the sweep (section 8 needs an order), and start the QA server on 3001 with the frontend on 5199 for the three browser suites.
