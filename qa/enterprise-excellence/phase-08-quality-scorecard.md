# Phase 8: quality scorecard for shipping, invoicing and closeout

Scores are a judgement from the evidence named, not a measurement, on the scale of `quality-scorecard.md` (target 95). A subject with no evidence is NOT ASSESSED and gets no number. The whole-system scorecard is rebuilt by `qa/tools/excellence-docs.mjs`; the Phase 8 adjustments to the "Logistics and financial operations" group are recorded in `phase-state.json` with their evidence.

| Subject | Score | Evidence | Held back by |
|---|---:|---|---|
| Shipping eligibility | 92 | Twelve rules checked inside the dispatch save; N-001, N-002, N-005 corrected and each proven by removing it; group 1 and group 2 scenarios | Live reservations at other branches NOT VERIFIED; no credit check at dispatch (owner's rule) |
| Picking | 78 | Pick list from reserved stock with heat and bin, oldest first; pure function with unit tests; stock at another branch flagged | No pick confirmation, scan or task list |
| Packaging and drop tags | 86 | The chain now completes (N-008); inputs checked against the stock item (N-009); fixed tag states (N-010); steps safe when pressed twice (N-013); numbering (N-012); 20 scenarios, 7 mutations; a Packing screen with browser checks | No scale, scanner or printer used; a package is not tied to one shipment; live tags NOT VERIFIED |
| Shipping documents | 85 | One reader for pick list, packing list and bill of lading; nothing invented (N-014); escaped (N-019); never stale (N-023); browser reads both papers | Not printed on a printer; no legal wording on the bill of lading; branch addresses on live NOT VERIFIED |
| Shipment creation, partial shipments, back orders | 93 | 25 scenarios; exact once-only shipping across splits; cross-branch (N-002); cancel follows the order (N-006) | None found in built code |
| Dispatch | 93 | One save; five races; overlap retry corrected (N-022, N-029); a dropped connection is all or nothing | Local machine only |
| Carriers and tracking | NOT ASSESSED | No carrier is connected (N-026). The partner key path for a carrier is verified | |
| Freight calculation | NOT ASSESSED | Not built (N-026). Freight typed on the order is billed once: verified | |
| Delivery and proof of delivery | 88 | Name, image address or reason required (N-004); once only; carrier reports marked; papers carry it | No signature capture or photo upload; old deliveries without proof stay as they are |
| Shipment exceptions | 86 | A reason is required (N-003); back on the road without a second shipment or invoice; a lost load is ended by a manager with a credit (N-027, owner decision 10: 4 scenarios, 6 rule removals) | No carrier claim is tracked; a reshipment is a new order |
| Invoice generation | 94 | One invoice per shipment in the same step; numbering in sequence under load; tax and freight by part to the cent; 25 scenarios | Invoices are not sent (N-028) |
| Payments and receivables | 88 | Part payments, overpayment refused, future date refused (N-007), roles; receivables by age with unit-tested columns | No processing, statements, dunning or write-off; a payment is a typed record |
| Credits, refunds, adjustments | 91 | Never above the invoice, in total, by line and under races; exact to the cent (N-021); an invoice is never edited | Refunds move no money |
| Returns | 90 | 15 scenarios and 4 races; a missing credit is flagged and settled once (N-016) | No restocking fee, approval level or window rule |
| Financial reconciliation | 88 | Three reconciliation scenarios across every record of the run; 7 new database checks | No ledger to reconcile against; live data NOT VERIFIED |
| Accounting integration, ledger, cost of goods | NOT ASSESSED | Does not exist (N-025). Needs the owner's decisions | |
| Order costing and margin | 78 | Cost fixed on the movement at dispatch; order cost and margin with every gap named; 12 scenarios; cost hidden from other roles on every answer (N-017, N-020) | No overhead, freight cost or valuation; movements before file 14 have no cost; labor rates not yet entered |
| Order closeout | 88 | Thirteen open reasons from one pure rule with nine unit tests; list agrees with each order; 8 scenarios; 133 to 206 ms at 85 branches | Nothing locks or archives a closed order (owner's rule) |
| Customer communication | NOT ASSESSED | Not built (N-028, owner decision 5) | |
| Security and branch isolation | 93 | Group 7; the security sweep; branch boundary suite; custody records cannot be forged (N-011); print queue per branch (N-015); cost guard (N-020); invoices read by sales, accounting and managers only (F-009, owner decision 10) | Live roles NOT VERIFIED |
| Concurrency and recovery | 92 | 20 scenarios; every once-only rule raced; request keys; dropped connections | Local machine; no multi-server run |
| Screens | 80 | 45 browser checks on six screens including phone width | No real user timed; accessibility beyond labels deferred to Phase 9; seven freight screens are samples (U-035) |
| Performance at 85 branches | see `phase-08-ux-efficiency.md` | 18 calls timed, 6 to 206 ms | Local machine, not the host; no packages in the scale data |

## The Phase 8 prompt's gates

| Gate | Result | Basis |
|---|---|---|
| A. Fulfilment eligibility | PASS | Group 1 and group 2; N-001, N-002, N-005 corrected and proven |
| B. Picking and packaging | PASS for what exists, with stated limits | The packaging chain completes and is verified; picking is a list, not a confirmed task |
| C. Shipping and delivery | PARTIAL | Shipment, dispatch, delivery and proof pass. Carriers and freight rating do not exist (N-026, deferred by owner decision 10). A lost load is handled since decision 10 (N-027) |
| D. Financial integrity | PARTIAL | Invoices, payments, credits and refunds pass and reconcile to shipments. No ledger, no accounting connection (N-025) |
| E. Costing and profitability | PARTIAL | Order cost and margin pass for what owner decision 9 covers. No overhead, freight cost, valuation or cost of goods |
| F. Returns and credits | PASS | Group 6; N-016 corrected |
| G. Order closeout | PASS | Group 5; N-018 built |
| H. Security and concurrency | PASS | Group 7; sweep; branch boundary; N-011, N-013, N-015, N-020, N-022, N-029 |
| I. Operational efficiency | PASS with stated limits | Timings at 85 branches on the local machine; no real users |
| J. Regression | see `phase-08-regression-results.md` | Full run on a rebuilt database |

## The directive's gates A to J

| Gate | Result | Basis |
|---|---|---|
| A. Scope understood | PASS | `phase-08-fulfillment-inventory.md` |
| B. Requirements met | PARTIAL | Everything that exists is corrected and verified. Accounting, carriers, freight rating and notices are not built and wait on the owner |
| C. Defects reproduced before correction | PASS | Probe on the starting code (`qa/sim/p8-probe.mjs`); N-020 to N-023 found by the new scenarios |
| D. Corrections minimal and in place | PASS | No module replaced; three new library files, two new screens, one additive database file |
| E. Automated checks fail without the fix | PASS | 31 rules removed one at a time, each failed a scenario; two further lines were shown to be backed by a second check |
| F. Regression | see `phase-08-regression-results.md` | |
| G. Performance | PASS on the local machine | `phase-08-ux-efficiency.md`. The host is NOT VERIFIED |
| H. Security | PASS | Sweep, branch boundary, group 7 |
| I. Documentation | PASS | The 18 Phase 8 documents; registers updated |
| J. Readiness | CONDITIONAL | `phase-08-report.md`, "Production readiness" |
