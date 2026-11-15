# Phase 6 of 12: final execution report

**Inventory, purchasing, receiving, warehouse operations, reservations, material traceability, remnants, scrap, replenishment and interbranch transfer hardening**

Date: 2026-11-15. Branch `claude/project-thread-25z3jd`, on top of the Phase 5 work at `c43ee25`. Pull request 31 carries Phases 3 to 6; it is not merged.

All testing ran on local databases: `steelwise_qa` for function and `steelwise_qa_scale3` (85 branches, 100,233 stock items) for volume. Nothing touched the live database or the host. No live stock was changed, no real purchase order was placed, and no scanner or other hardware was used. A statement here that a test passed means it was run in this session.

## FINAL STATUS

**PARTIALLY COMPLETE**

Reasons, stated exactly:

1. **Inventory valuation has no documented rule to follow (K-007, P1).** Receiving writes no cost and no costing method has been chosen. The instruction forbids changing costing rules without authorisation, so nothing was built. Completion requirement 16 and the cost line of gate E cannot be met until the owner decides. This is the one open P1 from this phase.
2. **There is no cycle count program to verify (K-008).** Corrections after a count work and are tested; schedules, count sheets, blind counts and recount thresholds do not exist and no policy for them is on file. Completion requirement 15 is met only for corrections.
3. **Replenishment is a position report, not a calculation (K-010).** Stock, inbound and demand per branch and grade are shown and verified. Reorder points, lead times and safety stock have no values on file, so nothing is suggested or ordered.
4. **Owner rules still open**: purchase order approval and receiving tolerance (K-011), bins as a controlled list (K-009), the Steel Outlet remnant list and remnant pricing (K-006, S-009, J-012).
5. **Hardware is NOT VERIFIED (K-013).** No scanner, label printer or scale was available. No compatibility is claimed.
6. **Nothing was verified on the host or against live data**, including live master data.
7. **SQL Editor file 12** waits for the owner, with files 6 to 11.

Every confirmed defect in existing behaviour found in this phase is VERIFIED FIXED with an automated check that fails without the fix: K-001 (P1), K-002, K-003, K-004, K-005, K-015. Fifteen findings were recorded (K-001 to K-015); all are dispositioned. Four earlier findings were closed (G-007, I-007, C-011, and the write half of B-009).

---

## INVENTORY DISCOVERY

| Item | Result |
|---|---|
| Method | Code read of every stock, receiving, purchasing, transfer, return and work order route and screen; probes on the QA database; 105 scenarios; browser checks; timings on the 85-branch copy |
| Modules examined | Stock items and balances, holds, corrections, receiving and uploads, purchase orders, transfers, reservations, shipping's use of stock, returns, work order consumption, remnants and the Steel Outlet list, the second (v1) stock list, heats and certificates, products and grades |
| Material types | Coil, sheet, plate, bar and the other metal forms (counted in LB, traced by heat); pieces and remnants with a parent; customer-owned material; shelf goods (form SUPPLY, counted in pieces, new in this phase) |
| Workflows mapped | Buy to stock; receive without an order; reserve to ship; cut to pieces, remnant and scrap; branch to branch; customer return; count and correct. See `workflow-matrix.md` (Phase 6 update) |
| Locations | QA: 4 branches for function. Scale copy: 85 locations, all of type WAREHOUSE, no bins. Live locations NOT VERIFIED |
| Documents | `phase-06-material-master-audit.md`, `-purchasing-review.md`, `-replenishment-review.md`, `-receiving-review.md`, `-warehouse-operations.md`, `-reservations-allocation.md`, `-traceability-audit.md`, `-remnants-scrap.md`, `-transfer-reconciliation.md`, `-inventory-valuation.md`, `-ux-efficiency.md`, `-regression-results.md`, `-quality-scorecard.md` |

### Disposition of the Phase 5 handoff

| # | Subject | Disposition |
|---|---|---|
| 1 | Shelf items by the piece | Built and VERIFIED FIXED (C-011): received against a product, counted in EA, reserved only for lines counted in pieces |
| 2 | Remnants picked at the counter | REQUIRES BUSINESS DECISION (J-012 folded into K-006): the outlet list holds the remnant price, and no pricing rule is on file (S-009) |
| 3 | The second stock list | Its four write routes answer 410 RETIRED; reads remain so no screen breaks (B-009 IN PROGRESS). Its tables were not dropped: destructive changes are forbidden in this phase |
| 4 | Transfers with an in-transit stage and a receipt | Built and VERIFIED FIXED (G-007) |
| 5 | Purchasing | Purchase orders built and VERIFIED FIXED under owner decision 4 (I-007). Requisitions, approval and vendor scorecards have no rule on file and were not invented (K-011) |
| 6 | Stock search at scale | Measured: 116 ms for a search by part of a number over 100,233 items. No index added (G-013 requires evidence of need) |

---

## DATA INTEGRITY

Each figure is the number of rows that break the rule, read from the database after the full gate run (`qa/tools/db-facts.mjs`) and after every scenario group.

| Subject | Result |
|---|---|
| Inventory reconciliation: on hand = available + reserved + on hold + in transit, enforced by the database | 0 |
| Every item's history adds up to its balance | 0 in everything the suites created (two rows from the demo seed predate Phase 3 and are listed in the regression results) |
| Reservations: reserved quantity equals open reservations; nothing ships unreserved | 0 |
| Material traceability: pieces whose heat, grade or owner differs from the parent | 0 |
| Remnants: parent plus pieces weigh what the parent weighed | 0 |
| Scrap: every scrap is a SCRAP movement with a person; a scrapped return is recorded in and out (K-003) | 0 |
| Transfers: in transit equals open transfers; one open transfer per item; received transfers have movements; line quantities | 0 on all seven checks |
| Purchase orders: line received equals its receipts; receipts name only purchase order lines | 0 |

Company stock on hand is unchanged by sending, receiving or calling back a transfer. It changes only when a manager confirms a shortage.

---

## DEFECTS AND CORRECTIONS

| ID | Sev | Finding | Correction | Status |
|---|---|---|---|---|
| K-001 | P1 | Any stock could be reserved for any line: pounds for a line of pieces, another grade, a piece too small, another customer's material | `lib/reservationRules.js`: unit, grade, size, thickness tolerance, owner and in-transit refusals, each a plain sentence | VERIFIED FIXED |
| K-007 | P1 | Receiving writes no cost; stock value, scrap cost and margin cannot be reported | None. Costing rules are the owner's to authorise. Options and a recommendation in `phase-06-inventory-valuation.md` | REQUIRES BUSINESS DECISION |
| K-002 | P2 | Buyers had no way to write a purchase order; receipts were tied to nothing | `/api/purchase-orders`, the Purchase orders screen, receipts against a line | VERIFIED FIXED |
| K-003 | P2 | A scrapped return took weight off an item that never got it back in its history | RECEIVE then SCRAP in one transaction | VERIFIED FIXED |
| K-004 | P2 | A return used the wrong unit and the INSPECT outcome was mishandled | Unit from the stock item; inspected returns held | VERIFIED FIXED |
| K-006 | P2 | The Steel Outlet remnant list is not stock | Waits for the remnant pricing rule | REQUIRES BUSINESS DECISION |
| K-008 | P2 | No cycle count program | Policy needed | REQUIRES BUSINESS DECISION |
| K-010 | P2 | No replenishment policy | Supply position built; reorder rules needed | REQUIRES BUSINESS DECISION |
| K-011 | P2 | No receiving tolerance or purchase order approval rule | Any difference from the line is held for a manager | REQUIRES BUSINESS DECISION |
| K-012 | P2 | Supplier invoices are not matched to receipts | Finance phase | DEFERRED TO SPECIFIC PHASE |
| K-015 | P2 | A hold placed at the same instant as another change to the same item could deadlock and answer "Could not place the hold". Found by the second full gate run. No balance was wrong | Holds take the balance row first, like every other stock change | VERIFIED FIXED |
| K-005 | P3 | Hold rules were written in several places | One `lib/holds.js` | VERIFIED FIXED |
| K-009 | P3 | Bins are free text | Controlled list needs the owner's bin plan | REQUIRES BUSINESS DECISION |
| K-013 | P3 | Scanner flows cannot be tested | No hardware | BLOCKED |
| K-014 | P3 | The stock list row does not say in transit | Phase 9 | DEFERRED TO SPECIFIC PHASE |

No P0 was found.

- **Purchasing**: purchase orders with lines in LB, CWT, TON or pieces; place, part receipt, close, cancel; only buyers, the inventory manager and managers; branch scoped.
- **Receiving**: receive against an open line with grade, size and reference filled in; a mismatch, an over-receipt or a missing certificate is held with every reason; the same item number twice is refused; a heat must be on file.
- **Warehouse**: holds in one place; scrap only from free stock; the second stock list can no longer be written.
- **Reservations**: the fit rules of K-001.
- **Transfers**: send, in transit, receive, short or damaged held, settle, call back (`phase-06-transfer-reconciliation.md`).

Database change: one additive migration, `20261115200000_stock_transfers_po_receipts_piece_stock` (SQL Editor file 12): two transfer tables, an in-transit quantity, the purchase order line on a movement, the balance check replaced to include in transit, and heat and grade optional for shelf goods only. It was run twice on a copy with every earlier migration applied; a schema comparison afterwards was empty. No data is deleted or rewritten.

---

## OPERATIONAL EFFICIENCY

See `phase-06-ux-efficiency.md`.

- **Steps reduced**: receiving against an order is one press on the line and three fields; a transfer is received on one screen.
- **Duplicate entry removed**: grade, size, reference and line come from the purchase order.
- **Usability**: every new refusal says what to do next; stock in transit is shown on the item and on the Transfers screen.
- **Measured productivity**: none claimed. No timing with users was made.

---

## VERIFICATION

| Test | Result |
|---|---|
| Phase 6 inventory scenarios (`qa/sim/phase6-inventory.mjs`, new) | @@P6@@ |
| Proof the checks catch the defects | With the reservation rules, the receiving-branch check and the return's RECEIVE movement removed, 8 scenarios fail. With the hold's balance lock removed, the hold scenario answers 500. All restored afterwards |
| Phase 6 browser checks (`qa/sim/ui-phase6.cjs`, new) | 14 of 14 |
| Unit tests | 158 of 158 (9 new) |
| Stock, purchasing and transfer screens at 85 branches | First page of stock 48 ms, search 116 ms, supply position 271 ms, the rest under 40 ms (median of 7, all-branch login) |
| SQL Editor file 12 | Run twice on a fresh copy and on the 85-branch copy; schema comparison empty |
| Every earlier suite | See `phase-06-regression-results.md` |

Failed tests: none on the final code. Blocked: scanner, label and scale tests (K-013). Not executed: valuation, cycle count scheduling, reorder calculations (not built), the host, live data.

---

## PRODUCTION READINESS

Not ready for multi-branch production; see `production-risk-register.md` (Phase 6 update). Stock control is materially safer: material on a truck is no longer sold at the destination, the wrong material can no longer be reserved, and receipts tie to what was ordered. Before the owner merges pull request 31: apply SQL Editor files 6 to 12 in order.

Questions for the owner:

1. **Costing (K-007)**: actual cost per item, taken from the purchase order line at receipt, is recommended. Confirm or choose another method.
2. **Cycle counts (K-008)**: how often, by whom, and what difference needs a recount or a manager.
3. **Reorder rules (K-010)** and **receiving tolerance and purchase order approval (K-011)**.
4. **Bins (K-009)** and **remnant pricing and the Steel Outlet list (K-006, S-009)**.

Still open from earlier phases: J-008 and S-020, H-011, H-013, H-015.

---

## PHASE 7 HANDOFF

**Phase 7 of 12: manufacturing execution, work orders, routing, work centers, capacity planning, production scheduling, shop-floor operations, quality control and processing excellence.** Not started.

| # | Subject | Findings | Modules | Depends on | Tests required |
|---|---|---|---|---|---|
| 1 | Work order material issues | Phase 3 note: a completed work order cannot be reversed; Phase 6: output plus scrap above the input is refused with 409 | Work orders, stock | Stock ledger | Complete, attempt to reverse, part completion; balances and history after each |
| 2 | Operation status | B-011: a completed operation can be started again | Shop-floor operations | The owner's rule on reopening | Every status move, allowed and refused |
| 3 | Shop-floor jobs record no weights | Phase 3 scorecard note; M-017 | Jobs, work orders | Whether jobs and work orders are one thing | A job from start to shipped stock with weights |
| 4 | Consumption against stock in transit or on hold | Phase 6: cutting from an in-transit parent is refused | Work orders, transfers | Phase 6 transfer rules | Work order on held, reserved and in-transit stock |
| 5 | Scrap and remnant integration | K-006, K-007, S-009: no valuation, no minimum usable size | Work orders, remnants | Owner decisions | Yield, scrap and remnant from one job reconcile to the parent |
| 6 | Scheduling and capacity | C-013: the cockpit acts on the words of a title; E-023: no reply within 30 s at scale; G-013: the job list reads every job | Operations cockpit, jobs | Scale copy | Timings at 85 branches; a schedule change checked in the records |
| 7 | Quality control | M-011, U-029: production quality screens have no server; I-011, U-019: supplier quality not built; the certificate check reads attachment only | Production quality, supplier quality, heats | Purchase orders and receipts (now built), holds (`lib/holds.js`) | Inspection at receipt and in process placing and releasing holds |
| 8 | Manufacturing traceability | Pieces inherit heat, grade and owner (verified); operator and work center on each piece not verified | Work orders | | Shipped piece back to heat, parent, work order, operator |
| 9 | Screens with no server | X-002 (P0, deferred): maintenance and training screens | Maintenance, training | Owner decision 4 | Each screen reads and writes real records or is labelled |

What Phase 6 leaves ready: `lib/holds.js` (one place to hold and release with reasons), `lib/reservationRules.js`, `lib/transfers.js`, the purchase order and supply position routes, and the building blocks in `qa/sim/phase6-inventory.mjs` (`freshHeat`, receive against a line, send and receive a transfer).

**Phase 7 has not been started.**
