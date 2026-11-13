# Phase gate report: Phase 2, Workstream 2 (sales and customer experience)

Written 2026-11-13 to the format in `qa/ENGINEERING-STANDARD.md`, Rule 11.

## Completion status: PARTIALLY COMPLETE

This is not a pass. Sixteen findings are fixed, each with an automated check that was seen to fail without the fix. Eleven are open: six wait on a decision from the owner (S-009, S-010, S-019, S-020, S-021, S-027), four are assigned to later workstreams (S-022, S-023, S-025, S-026), and one is deferred behind S-010 (S-008). Nothing here is live: pull request 30 is not merged and nothing was run on production.

## 1. Scope and discovery

In scope: customers and customer preferences, pricing, RFQs and quotes, the order entry screen, Retail POS and counter sale, the POS session service, Sales Rep Mobile, Sales Dashboard, overrides, Order Hub, and the online store's pricing.

How it was examined: every screen in those areas was read together with the server routes it calls; each price path was traced from the product's list price to the saved order line; the journeys were run by the simulation; three screen groups were operated in a real browser; a customer login and a clerk login were used to probe what each can read and change.

NOT VERIFIED (no access or not attempted): anything on the hosted site; behaviour on MySQL; response times of the new routes at 80-branch volume (no benchmark was run in this workstream); keyboard, screen-reader and contrast checks; card, email and text services (not connected); the credit application and new-account approval journey (no screen exists).

## 2. Findings

`qa/engineering-quality-findings.md`, S-001 to S-027, with a disposition for every open item.

## 3. Root causes

| Findings | Root cause |
|---|---|
| S-001, S-005, S-010, S-011, S-012, S-017 | Screens and services were built as prototypes on invented data and never connected to the database |
| S-002, S-013 | The price rule was written separately in each channel, against two different places a tier could be stored |
| S-003, S-006, S-016, S-025 | Routes trusted what the browser sent: the price level, the whole order, any field of a record |
| S-004, S-019 | Controls were sketched (a PIN, a credit guard) against fields that were never added to the data model |
| S-007 | The tax shown was calculated in the browser and the save path had no tax step |
| S-014 | The save was written against field names from an earlier version of the data model, and no test ever exercised it |
| S-015 | One route served both staff and the customer's own login with the same reply |
| S-024 | The manual was written from the design, not from the screens |

## 4. Changes implemented

One price rule and one tax rule used by every sales channel; the order entry API validated, attributed and transactional; tax saved on orders by rule 27; counter discounts bounded and approved by a signed-in manager; Sales Rep Mobile, Sales Dashboard, overrides and Pricing moved from invented data to the database; the customer screen's pricing tier made the real one, with manager-only changes and an audit entry; customer preferences save repaired; staff-only fields hidden from customer logins; customer create and edit limited to editable fields, with tax-exempt changes recorded; list prices changeable by a manager with an audit entry; Pricing added to the menu; four help-manual sections rewritten to match the screens.

## 5. Files modified

Backend: `lib/priceRules.js` (new), `lib/customerPricing.js` (new), `lib/orderTax.js` (new), `routes/overrides.js` (new), `routes/salesDashboard.js` (new), `routes/intakeOrders.js`, `routes/intakePricing.js`, `routes/customers.js`, `routes/ecom.js`, `routes/quickSale.js`, `routes/pos.js`, `routes/orders.js`, `routes/onlineOrders.js`, `services/portalService.js`, `workflows/pos/POSPricingService.js`, `workflows/pos/POSWorkflowService.js`, `app.js`, `test/priceRules.test.js` (new).

Frontend: `pages/Orders/CSRIntakePage.jsx`, `RetailPOSPage.jsx`, `OrderDetailPage.jsx`, `pages/MobileRep/` (five pages), `pages/Sales/SalesDashboard.jsx`, `pages/Pricing/PricingDashboardPage.jsx`, `pages/Customers/CustomerPreferencesPage.jsx`, `services/intakeOrdersApi.js`, `intakePricingApi.js`, `overrideApi.js`, `components/layout/Sidebar.jsx`, `help/manualContent.js`.

QA: `qa/sim/run.mjs`, `qa/sim/security.mjs`, `qa/sim/ui-sales.cjs` (new), `qa/tools/report.mjs`, and the registers in `qa/`.

## 6. Database changes

None. Overrides and the new audit entries use the existing audit table; tiers use the existing pricing-tier table. No SQL Editor file is needed for this workstream. The three files from earlier work are still waiting to be applied by the owner.

## 7. Tests added

- Unit: `test/priceRules.test.js`, 8 tests (tier to level, tier dates, price at a level, line totals, tax state). Total now 55.
- Sweep section 13, "One customer, one price in every sales channel": 47 checks.
- Sweep section 14, "Order entry screen follows the order rules": 43 checks.
- Simulation scenario "entry-screen": an order typed on the order entry screen, taken through edit, submit, reservation, work orders, production, shipping, invoice and payment, with tax checked. Two of every seven scenarios.
- Browser: `qa/sim/ui-sales.cjs`, 18 checks on Sales Rep Mobile, Sales Dashboard and Pricing, as a clerk and as a manager.

## 8. Tests actually executed (this session, local)

| Test | Result |
|---|---|
| Unit tests | 55 of 55 pass |
| Three 50-job cycles, seeds 8001 to 8003, rebuilt QA database | 150 of 150 pass; 2,134 API steps; 2,357 checks; reconciliation 0 problems |
| Security and safeguards sweep | 14 of 14 sections pass |
| Sweep sections 13 and 14 run against the previous commit | 23 of 47 and 14 of 43 fail there, as they should |
| Sweep sections 13 and 14 run against the code before this workstream (earlier in the session, fewer checks then) | 16 of 21 and 21 of 30 failed |
| Screen check | 123 of 123 screens open |
| Sales screens operated in a browser | 18 of 18 checks pass |
| Frontend production build | Passes |
| Benchmark of sales routes | NOT RUN |
| Lint | NOT RUN: none configured (E-016) |
| Accessibility | NOT RUN |

## 9. Regression results

No previously passing job, sweep check or screen regressed. Two simulation expectations were changed on purpose and are recorded here: an accepted web order is now attributed to the person who accepts it (it was the first administrator found), and entry-screen tax is expected at the selling branch's state rate (rule 27).

## 10. Connected-module verification

- Orders typed on the entry screen go on through reservation, work orders, production, shipping, invoice and payment in the simulation, with invoice tax equal to order tax.
- Counter sale, web checkout, quotes and returns were rerun unchanged and pass.
- Customer and division isolation (sweep section 5) still passes with the changed preferences route.
- NOT VERIFIED: Retail POS and the order entry screen were not operated in a browser, only through their API and by opening the screens. The hosted site was not touched.

## 11. Remaining findings and blockers

Decisions needed from the owner: what to do when an order would pass a credit limit (S-019); cutoff and capacity rules for delivery promises, and whether web checkout should show a date before those exist (S-010); the remnant discount rule (S-009); whether "Default Discount %" stacks with the tier or goes (S-020); retire or merge Order Hub (S-021); whether RFQ lines should pick products so quotes can be priced from the price book (S-027); confirmation of rules 28 to 31.

Carried to later workstreams: S-022, S-023, S-024 (rest of the manual), S-025, S-026.

## 12. Continuation point

Workstream 3, Inventory and Purchasing. Start with S-023 and S-025 (found here), then E-004 and E-020 (stock balance identity), D-024 (two stock systems), and journeys 2 and 3 in `operational-workflow-review.md`. Setup: `qa/README.md`; rebuild the QA database, run the three cycles, the sweep, `ui-smoke.cjs` and `ui-sales.cjs` before changing anything, so the starting point is known.
