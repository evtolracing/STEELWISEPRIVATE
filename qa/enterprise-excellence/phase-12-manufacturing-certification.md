# Phase 12: manufacturing, MES and quality control certification

Date: 2026-11-19. Release candidate RC-2 (RC-1 is commit `9e12319`, the merge of Phase 11; RC-2 is RC-1 plus the corrections of this phase, listed in `phase-12-release-baseline.md`). Everything here was run in this session on one local machine against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only. Nothing was run against the live system, and nothing here is a statement about it.

## Manufacturing and MES (section 11)

10 VERIFIED ON QA, 2 NOT BUILT, 4 PARTIAL.

| Capability | State | What the product has | Evidence in this run | Open findings |
|---|---|---|---|---|
| Work orders | VERIFIED ON QA | As above | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Routing | VERIFIED ON QA | Processing recipes: versioned steps a job follows in order | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks |  |
| BOMs | NOT BUILT | What is called a BOM recipe is a routing. No bill of materials | none | M-011 |
| Work centers | VERIFIED ON QA | Master data with validation and lockout | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: Phase 2 integrity: 82 checks, 0 problems |  |
| Scheduling | PARTIAL | As above | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks | L-025 |
| Dispatch | VERIFIED ON QA | Dispatch board per branch | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: Phase 12 "Security and access revalidation" 11 of 11 |  |
| Material consumption | VERIFIED ON QA | Through the work order: weight in, pieces and scrap out, nothing created from nothing | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Machine assignment | VERIFIED ON QA | A step runs on a work center of the right kind | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks |  |
| Labor tracking | PARTIAL | Time from start and complete. Labor rates must be entered before job cost means anything | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks | L-026 |
| Production completion | VERIFIED ON QA | Completion moves the job on, to QC where required | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Scrap | VERIFIED ON QA | As above | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: Phase 12 "Financial ledger certification" 16 of 16 |  |
| Remnants | PARTIAL | As above | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks | K-006 |
| Rework | VERIFIED ON QA | A rework step added to the plan and clocked | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Outside processing | NOT BUILT | None | none | L-027 |
| Job costing | PARTIAL | Material and labor per job. No overhead, no cost report across jobs, no work-in-progress valuation | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: Phase 9.5 ledger: 158 of 158 pass, 915 checks | L-026 |
| Traceability | VERIFIED ON QA | Shipped piece back to heat, parent item and work order | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |

## Quality control (section 12)

2 NOT BUILT, 2 PARTIAL, 6 VERIFIED ON QA.

| Capability | State | What the product has | Evidence in this run | Open findings |
|---|---|---|---|---|
| Incoming inspection | NOT BUILT | A certificate hold at receipt only. Supplier quality screens are samples | none | I-011 |
| In-process inspection | PARTIAL | An inspection can be required at a step | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks | L-028 |
| Final inspection | VERIFIED ON QA | The QC gate before packaging | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Quality holds | VERIFIED ON QA | Held stock cannot be reserved or shipped | pass: Phase 6 inventory scenarios: 106 of 106 pass, 494 checks; pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: Phase 8 fulfilment scenarios: 155 of 155 pass, 518 checks |  |
| Nonconformance | NOT BUILT | No nonconformance or corrective-action record | none | L-023 |
| Rework and reinspection | VERIFIED ON QA | Fail, rework, inspect again | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Material certification | PARTIAL | Attached and required; content not read | pass: Phase 6 inventory scenarios: 106 of 106 pass, 494 checks |  |
| Traceability | VERIFIED ON QA | As above | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks |  |
| Release authorization | VERIFIED ON QA | Release by the quality role or a manager, recorded | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks |  |
| Nonconforming material cannot bypass controls | VERIFIED ON QA | A failed or held job cannot be packed or dispatched; checked inside the dispatch save | pass: Phase 8 fulfilment scenarios: 155 of 155 pass, 518 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |

## End-to-end evidence from this phase

### WF-02: Flow 2: a quoted job is made on the floor, inspected, shipped and invoiced; it cannot leave before it passes

PASS, 41 checks.

- pass: the request for quote is saved for the customer (201 )
- pass: the quote is priced from the request (201 1162.5 vs 1162.5 )
- pass: an operator cannot accept a quote (403 Orders, quotes, customers and invoices can only be changed by sales staff or a manager. Your role (OPERATO)
- pass: the quote is sent (200 Quote marked as sent. Nothing is emailed from here: send the customer the quote yourself.)
- pass: accepting the quote makes one order (201 Quote accepted and order created)
- pass: accepting it a second time makes no second order (409)
- pass: one order for the quote in the database
- pass: the order carries the quote's price and the branch (1162.5 vs 1162.5; branch true)
- pass: the material is reserved for the order (201 )
- pass: the job is opened for the order line (201 )
- pass: the job is routed in two steps (200 )
- pass: step "Saw to length" is started and finished by the operator (200 200  )
- pass: step "Deburr and stack" is started and finished by the operator (200 200  )
- pass: time on each step is recorded against a person (2)
- pass: the dock cannot mark the job ready to ship before inspection (409 This job is waiting for inspection. Record the inspection result in Quality; a pass moves it to packaging.)
- pass: a shipment of the uninspected job cannot be dispatched (shipment 201, dispatch 409 This shipment cannot go out yet: JOB-00629 (waiting qc) is not finished. Finish or )
- pass: nothing left the building
- pass: the inspection is opened (201 )
- pass: a failed inspection is recorded (200 )
- pass: a job that failed inspection cannot be staged (409 Inspection INS-00349 failed. This job needs a passed inspection before it can move on: send it to inspecti)
- pass: the rework step "Rework (INS-00349)" is run (200 200  )
- pass: a new inspection is opened after the rework (201 )
- pass: the new inspection passes (200 )
- pass: both inspections are kept: the failure is not overwritten (2)
- pass: now the dock stages it (200 )
- pass: the shipment made earlier is still waiting on the dock (201)
- pass: the inspected job is dispatched and billed (200 )
- pass: the stock fell once by the pounds shipped (6000→4500)
- pass: the delivery is confirmed with a proof of delivery (200 DELIVERED)
- pass: a payment larger than the invoice is refused (409 Only 1162.50 is still owed on this invoice)
- pass: the payment is taken (201 )
- pass: the invoice shows it (PAID 1162.5/1162.5)
- pass: the payment is posted once: receivables down by the amount, the entry balances (POSTED {"1000":1162.5,"1100":-1162.5})
- pass: the manager reads the job cost: material at the item's actual cost, and nothing assumed (200 )
- pass: a sales representative is not shown cost (403)
- pass: the job is closed (SHIPPED)
- pass: after the processed sale: the reconciliation ran (201)
- pass: after the processed sale: BOOKS_BALANCE agrees (MATCH 0.00 )
- pass: after the processed sale: INVENTORY agrees (MATCH 0.00 )
- pass: after the processed sale: RECEIVABLES agrees (MATCH 0.00 )

### WF-05: Flow 5: a work order consumes an item, makes two pieces and scrap, and the stock value follows

PASS, 20 checks.

- pass: the work order is written (201 )
- pass: the operator starts it (200 )
- pass: it cannot be started twice (409 This work order is already in progress)
- pass: 100 lb of the item are reserved for a customer (201 )
- pass: the work order cannot use the pounds promised to the customer (409 Stock item P11-MWMXFR5R-37 has 2,900 lb this work order can use, which is less than the 3,000 lb of output)
- pass: and the refusal changed nothing
- pass: completed with two pieces and 30 lb of scrap (200 )
- pass: the source keeps exactly the 100 lb promised to the customer (ALLOCATED: on hand 100, reserved 100)
- pass: two pieces came out, each 1,435 lb, at the source's cost per pound, on the source's heat ([["0.38",true],["0.38",true]])
- pass: the pieces are in stock (1435,1435)
- pass: weight is conserved: pieces plus scrap equal the source
- pass: the work order records the scrap and is complete (COMPLETE 30)
- pass: the work order's postings are all posted (WORK_ORDER_COMPLETED:POSTED, STOCK_RECEIVED:POSTED)
- pass: together they balance, and scrap is expensed at 30 lb times cost ({"1200":38,"1210":1090.6,"2000":-1140,"5300":11.4})
- pass: the scrap report answers (200)
- pass: after the work order: the reconciliation ran (201)
- pass: after the work order: BOOKS_BALANCE agrees (MATCH 0.00 )
- pass: after the work order: INVENTORY agrees (MATCH 0.00 )
- pass: after the work order: RECEIVABLES agrees (MATCH 0.00 )
- pass: after the work order: IN_TRANSIT agrees (MATCH 0.00 )

## Earlier suites, rerun in the gate

- Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks
- Phase 11 "Manufacturing, scheduling and quality": 40 scenarios pass

## Not built, stated plainly

- No production cost: labor and machine time are recorded but not costed, and overhead has no rate (L-026; accounting policy 8).
- No bill of materials behind the BOM screen, no supplier quality, no gauge calibration, no sampling plans (samples: M-011, I-011, L-028).
- Schedule times are a queue order with estimates where they exist, not finite-capacity scheduling (L-025).

## Open findings in this area

| Finding | Severity | Status | Area | What is open |
|---|---|---|---|---|
| I-011 | P1 | REQUIRES BUSINESS DECISION | Supplier quality (six screens) | Inbound receiving, IQC inspections, nonconformances, SCARs, scorecards and suppliers show invented suppliers, inspections and scores. No server side exists |
| L-023 | P2 | REQUIRES BUSINESS DECISION | Quality control | Not built. |
| L-025 | P2 | REQUIRES BUSINESS DECISION | Scheduling | A queue order with times where estimates exist, clearly labelled. |
| L-026 | P1 | IN PROGRESS | Production costing | No production cost exists. |
| L-027 | P3 | REQUIRES BUSINESS DECISION | Manufacturing | Not built. |
| L-028 | P2 | IN PROGRESS | Quality control | A fixed list of unknown origin. |
| L-029 | P3 | REQUIRES BUSINESS DECISION | Jobs | 0 by convention. |
| L-030 | P3 | REQUIRES BUSINESS DECISION | Equipment | None is made. |
| M-011 | P1 | REQUIRES BUSINESS DECISION | Production quality (5 screens), Bills of material | Sample data presented as real; the BOM screen was hard-wired to samples |
| M-017 | P2 | REQUIRES BUSINESS DECISION | Jobs | The job rules allow some backward moves (for example in process back to ordered); `/start` and `/complete` keep their own checks; the print hook runs on some status route |
| U-019 | P3 | REQUIRES BUSINESS DECISION | Supplier quality, six screens | Invented data presented as real |
| U-029 | P3 | REQUIRES BUSINESS DECISION | Production quality, BOMs | Invented data presented as real |
| U-037 | P3 | REQUIRES BUSINESS DECISION | Safety, maintenance, training, contractors, customer quality, executive, provenance | Invented data presented as real |
| V-027 | P2 | REQUIRES BUSINESS DECISION | Order board, production board, schedule | Grows with the data. |
| X-002 | P0 | REQUIRES BUSINESS DECISION | Maintenance (3), training (4), contractors and visitors (4), customer quality (4), executive (5), quality dashboard, test entry, provenance lookup | 23 more screens, most on the menu, showed invented data with no notice. Provenance lookup returned the same invented chain of custody for any heat or item typed in |

## Certification

Engineering statement only: on the release candidate, on synthetic data, the capabilities marked VERIFIED ON QA above work as described. This is not business acceptance, and it is not a statement about the live system.
