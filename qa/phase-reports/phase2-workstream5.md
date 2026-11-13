# Phase gate report: Phase 2, Workstream 5 (shipping and financial operations)

Written 2026-11-13 to the format in `qa/ENGINEERING-STANDARD.md`, Rule 11.

## Completion status: PARTIALLY COMPLETE

This is not a pass. Seven findings are fixed, each with an automated check (F-001 to F-006, F-010). One is mitigated (F-007: nine freight and logistics screens are labelled as samples). Four are open: two need the owner (F-008, the store's tax estimate; F-009, who may read invoices), one was not examined (F-011, shipping documents), and one is a tooling gap (F-012, no lint). Parts of this area were not examined and are listed in section 1. Nothing here is live: pull request 30 is not merged, and four database updates from earlier workstreams still wait for the owner. This workstream needs no database update.

## 1. Scope and discovery

In scope: the Shipping menu screen, the shipment routes, accepted web orders, invoices, payments, credit memos, refunds, invoice cancellation, the counter sale's invoice and payment, the All Orders list, and the freight and logistics screens.

How it was examined: each screen was read against the server routes it calls; `services/billing.js` and `routes/shipments.js` were read in full; the new screens were then operated in a real browser as shipping staff and as a manager.

Not examined: shipping documents and printing (F-011), freight cost on orders and invoices, carrier rates and tracking beyond labelling the screens, customer statements and ageing, the sales tax rate admin screen, the returns screen beyond attributing its credit, and how the store works out its tax estimate beyond confirming it uses a different state than acceptance does (F-008).

## 2. Findings

Twelve, F-001 to F-012, in `engineering-quality-findings.md` under "Workstream 5", each with evidence, risk, status and proof. Two were critical: an accepted web order carried no tax or total, so it was under-billed by its tax (F-001, carried from I-018); and the Shipping menu item listed sample shipments with no screen to create, dispatch or deliver a real one (F-002).

One was caused and caught in this workstream: a patch left a stray word in the route file, the production build passed, and every screen was broken at run time. The browser check caught it before it was committed (F-012).

## 3. Root causes

- The web order route was written before orders carried tax, and built the order from lines only (F-001).
- The shipment API was built and tested through the simulation; the screen on the menu was an earlier sample that was never replaced (F-002, F-007).
- Shipment and billing functions took the record id and the request body and never the user, so there was nothing to attribute (F-004, F-006).
- The list route included whole related records (F-003).
- Proof of delivery fields were spread from the request body (F-005).
- The manual was written from a design, not from the screens (F-010).
- The frontend has no lint step, so an undefined name is not an error until the browser runs it (F-012, E-016).

## 4. Changes implemented

Web orders: accepting one saves subtotal, tax by rule 27 (selling branch; nothing for an exempt customer) and total. The credit check uses the total. Orders accepted before this change were not altered.

Shipments: the list is searched and counted on the server and capped at 200. A new lookup answers what is left to ship on an order, line by line, and why it cannot ship when it cannot. Creating, dispatching, delivering and cancelling are each written to the audit log with the person. A proof of delivery signature is text of at most 200 characters, and its image must be an https address or a stored document. The shipping desk is sent the customer's name and city, not credit terms.

Money: issuing an invoice (from a dispatch, from the Invoices screen, or at the counter), recording a payment, issuing a credit, recording a refund and cancelling an invoice are each written to the audit log with the person, the amount and the reason, in the same transaction as the money. A credit is recorded on the invoice it reduces and on the credit memo. The invoice shows this history.

Screens: new Shipping (list, search, New shipment) and Shipment (details, Carrier and truck, Dispatch with a confirmation, Mark delivered, Cancel, invoice, history) screens. The two old sample shipment screens and an unused sample shipping desk are deleted; old addresses open the new screens. Nine freight and logistics screens carry the sample notice and point to Shipping. All Orders shows the saved tax and total and no longer falls back to sample orders. Three unused sample data files are deleted.

Help manual: the Shipping page is rewritten from the screens as built, with a short section on invoices and payments.

## 5. Files modified

Backend: `routes/onlineOrders.js`, `routes/shipments.js`, `routes/invoices.js`, `routes/returns.js`, `routes/quickSale.js`, `services/billing.js`.

Frontend: `pages/Shipping/ShippingPage.jsx` and `ShipmentPage.jsx` (new), `pages/Orders/InvoicesPage.jsx`, `apps/orders/OrdersPage.jsx`, `router/AppRouter.jsx`, `help/manualContent.js`, `apps/planning/PlanningBoardPage.jsx`, `ProductionWorkflowBoardPage.jsx`; deleted `apps/shipments/ShipmentsPage.jsx`, `pages/Logistics/*`, `pages/ShippingDeskPage.jsx`, `mocks/shipmentsData.js`, `mocks/ordersData.js`, `mocks/planningData.js`.

QA: `qa/sim/security.mjs` (section 20), `qa/sim/ui-shipping.cjs` (new), `qa/tools/report.mjs`, and the registers in `qa/`.

## 6. Database changes

None. Shipment and money history use the existing audit log table.

Four files from earlier workstreams still wait for the owner, in this order: `20261113031734_document_links_any_record.sql`, `20261113052550_billing_returns_file_store.sql`, `20261113062621_fk_indexes_and_stock_checks.sql`, `20261113150000_stock_balance_identity.sql`.

## 7. Tests added

- Sweep section 20, "Shipping and money records: web order tax, shipments and who did what": 37 checks.
- Browser: `qa/sim/ui-shipping.cjs`, 27 checks: create a shipment from an order, truck details, dispatch and its invoice, delivery, cancel, search, old addresses, a payment and its history, All Orders, and the freight sample notices.
- No unit tests were added. The new code is route and transaction code; it is covered by the sweep.

## 8. Tests actually executed (this session, local)

| Test | Result |
|---|---|
| Unit tests | 87 of 87 pass |
| Three 50-job cycles, seeds 8001 to 8003, rebuilt QA database, final code | 150 of 150 pass; 2,134 API steps; 2,357 checks; reconciliation 0 problems |
| Shipment steps recorded during the cycles, sweep and browser runs | 347, every one with a person |
| Invoices issued through the application in that run | 119, every one recorded with a person. The 2 others are demo seed rows written straight to the database |
| Payments, credits, refunds and cancellations recorded | 81, 20, 6 and 1, every one with a person |
| Security and safeguards sweep, final code | 20 of 20 sections pass |
| Section 20 (first 36 checks) against the commit before the fixes | 26 of 36 fail there |
| The counter sale check added later | Seen failing before its fix, passing after |
| Shipping and invoice screens operated in a browser, final code | 27 of 27 checks pass |
| Shop, sales and stock screens operated in a browser, final code | 30 of 30, 24 of 24, 22 of 22 |
| Screen check | 125 of 125 screens open (one more than before: the Shipment screen). Run before the last server-side change (counter sale attribution), which touched no frontend file; not rerun after it |
| Frontend production build | Passes. It also passed with the defect in F-012 present, so it is weak evidence |
| Browser checks against the code before the fixes | NOT RUN: the old screens had none of these controls |
| Dispatch refused for stock on hold or an unfinished job, from the new screen | NOT RUN in the browser. The server refusals are checked in sweep sections 14 and earlier cycles |
| A shipment in the Problem status, and "Back on the road" | NOT RUN |
| Performance of the shipment list or invoice routes | NOT RUN |
| Lint | NOT RUN: none configured (E-016, F-012) |
| Accessibility | NOT RUN |

## 9. Regression results

No previously passing job, sweep check or screen regressed. No simulation expectation was changed. Behaviour changed on purpose: an accepted web order now has tax and a total, so its invoices are larger by the tax and it counts in full against a credit limit; the shipment list returns at most 200 rows and trimmed customer fields; a proof of delivery that is too long or not a safe address is refused; `/logistics/shipments` redirects to `/shipping`.

One check was written and then withdrawn: "a shop login cannot read an invoice". It failed because all staff may read invoices by design. That is recorded as F-009 for the owner, not changed.

## 10. Connected-module verification

- Orders, reservation, production, inspection, packaging, shipping, invoices, payments, returns and the counter were rerun in the three cycles with the new records written on every shipment and money step, and pass. Reconciliation of stock and orders: 0 problems.
- Three payments at once on one invoice and one return received three times at once are still taken once. A counter sale sent a second time is still not charged twice.
- A dispatch still marks its jobs shipped and records each (Workstream 4 checks pass).
- Credit hold (sweep section 15) still passes with web orders now counted at their full total.
- Customer and division isolation (sweep section 5) still passes.
- The hosted site was not touched.

## 11. Remaining findings and blockers

Decisions needed from the owner:

1. Store tax estimate (F-008): should the web store show tax by the selling branch, to match what is invoiced?
2. Who may read invoices and payments (F-009). Today every staff login can.
3. Freight planning (F-007): build it, or take the nine sample screens off the menu.
4. Web orders accepted before this change have no tax or total. Nothing was altered; they need to be listed and decided on once this is live.
5. Rules 42 to 44 to confirm.

Carried: F-011 (shipping documents) and F-012 (lint) to Workstream 6, and everything still open from Workstreams 2 to 4, including the card on the stock list.

## 12. Continuation point

Workstream 6, Enterprise Experience: navigation and menu against real screens, the remaining sample screens across the product, administration, reporting, the rest of the help manual (M-018), shipping documents (F-011), and a lint step (E-016, F-012). Setup: `qa/README.md`; rebuild the QA database, run one cycle before the sweep, and start the QA server on 3001 with the frontend on 5199 for the five browser suites.
