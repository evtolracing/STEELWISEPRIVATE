# Phase 3: quality scorecard

Scores before and after Phase 3. The method, the weights and the full evidence for every category are in `quality-scorecard.md`, which a tool rebuilds from the findings register and the test results. This file states what moved, why, and what did not.

The target for every group is 95. No group meets it. A score is the engineer's judgement held against written criteria; where a number rests on a measurement, the measurement is named. A score was raised only where this phase produced new evidence.

## 1. Group scores

| Module group | Before Phase 3 | After Phase 3 | Open P0 or P1 before | Open P0 or P1 after | Meets 95 |
|---|---:|---:|---:|---:|:-:|
| Platform infrastructure | 73 | 78 | 2 | 2 | No |
| Sales and customer operations | 72 | 75 | 4 | 4 | No |
| Inventory and purchasing | 73 | 74 | 4 | 4 | No |
| Manufacturing and processing | 73 | 73 | 2 | 2 | No |
| Logistics and financial operations | 75 | 77 | 2 | 2 | No |
| Enterprise experience | 60 | 60 | 5 | 5 | No |

Before: `phase-02-quality-scorecard.md`. After: `progress.json` rebuilt at the end of this session.

The count of open P0 and P1 findings did not fall. Phase 3 closed five P1 findings (E-004, and G-001, G-002, G-004 and G-017, which it also found) and found one that stays open (G-019). The other open P0 and P1 findings are missing functions and owner decisions that this phase could not close.

## 2. What moved, and the evidence

| Category | Group | Before | After | Evidence | Why not higher |
|---|---|---:|---:|---|---|
| Data integrity | Platform | 75 | 86 | 188 foreign keys (15 added on money, stock and work), 24 value checks (15 added), every decimal written exactly; 13 direct bad writes refused; residue check 0 | 217 reference columns with no key (G-003); two JSON stores (B-009) |
| Reliability | Platform | 62 | 74 | Numbering survives 80 simultaneous saves and deleted rows; request keys; 0 deadlocks; forced failures leave nothing | No restore tested (E-015); host pool unverified (G-015); no background retry (B-019) |
| Performance | Platform | 80 | 82 | 85-branch copy: every branch list within 500 ms; 400 requests at once, 0 failures | Local machine only; G-013, G-014 |
| Data integrity | Sales | 84 | 88 | Order totals enforced by the database; duplicate requests answered once; void in one transaction; quote price and branch carried into the order | Ships and bills with nothing reserved (G-019); void marker is text (G-009) |
| Reliability | Sales | 65 | 76 | 80 orders at once all saved; reservation and cancellation races closed; one winner between confirm and cancel | Other edits are last write wins (G-020); thin success-path testing |
| Performance | Sales | NOT VERIFIED | 80 | Order, quote, request and customer lists: 5 to 57 ms at the 95th percentile | Local machine; 244 KB order list |
| Observability | Sales | 65 | 72 | Confirm, cancel and reserve leave a history line with the person | Other field edits not itemised (G-011) |
| Data integrity | Inventory | 85 | 87 | Races closed; exact weights; 14 reconciliation checks at 0; the database refuses a negative balance, a broken identity, a zero movement | G-019, I-016, G-007: the largest gaps in the product are here |
| Reliability | Inventory | 70 | 78 | Receipts, transfers, holds, reservations and returns each raced and safe | Transfer receipt and adjustment do not exist |
| Performance | Inventory | NOT VERIFIED | 78 | Branch stock list 1.5 ms; a heat's 31,605 items 23 ms | Stock search scans every item (G-013) |
| Performance | Manufacturing | NOT VERIFIED | 72 | Branch job list 158 ms at the 95th percentile with 72,541 jobs | Reads every job in the company; one measurement |
| Data integrity | Logistics and financial | 82 | 89 | Invoice identity, payment not zero and the links to shipment, credited invoice and order line enforced by the database; tax across part shipments exact; 11 financial checks at 0 | G-019 |
| Reliability | Logistics and financial | 75 | 80 | Dispatch, payment, return receipt and invoicing at once each happen once; a failing credit leaves nothing | Carrier routes broken (C-002); no retry |
| Performance | Logistics and financial | NOT VERIFIED | 80 | Shipment and invoice lists 18 and 101 ms for a branch login | Local machine; a branch's invoices found by scanning every invoice |

Every other category in every group is unchanged, because Phase 3 produced no new evidence for it. Enterprise experience did not move at all.

## 3. Measured changes

| Measure | Before | After |
|---|---:|---:|
| Findings in the register | 223 | 243 (20 new, the G-series) |
| VERIFIED FIXED | 142 | 152 |
| Open P0 | 2 | 2 |
| Open P1 | 17 | 17 (five closed, one of the new ones open, see section 1) |
| REQUIRES BUSINESS DECISION | 19 | 23 |
| Foreign keys | 171 | 188 |
| Value checks in the database | 9 | 24 |
| Duplicate indexes | 10 | 0 |
| Reference columns with no foreign key | 232 | 217 |
| Columns holding amounts with stray digits (QA database after a full run) | 12 | 0 |
| Read-only consistency checks in the gates | 16 | 37 |
| Database-backed scenarios that read the tables after each operation | 0 | 64, with 447 checks |
| Unit tests | 105 | 118 |
| Rounds in which a line was reserved beyond its need | 6 of 6 | 0 of 6 |
| Rounds in which a cancelled order kept a reservation | 6 of 6 | 0 of 6 |
| Orders saved of 80 entered at once | 72 | 80 |
| Routes that returned a success in a test | 284 of 611 | 285 of 611 |
| Changing routes that returned a success in a test | 87 of 319 | 88 of 319 |
| Branch screens measured at 80-branch scale | 0 | 18, all within 500 ms |
| Repository lint | 0 errors, 1,524 warnings | Same |

## 4. Not measured, and so not scored

- **Accessibility:** NOT VERIFIED in every group.
- **Performance of Enterprise experience** (dashboards, reports, cockpit): not measured in this phase.
- **Anything on the host:** timings, pool behaviour, cold starts.
- **Recovery:** no restore, so the reliability scores are capped where they are.
- **Coverage by line of code:** not measured.

## 5. Distance to the target

In order of what they hold back:

1. **Rules only the owner can give.** Twenty-three findings wait on a decision. Five of them bound the inventory and financial scores directly: shipping without a reservation, what processing consumes and produces, adjustment and count, purchasing, and gapless invoice numbers.
2. **Test reach.** 231 of 319 changing routes have never returned a success in a test.
3. **Sample modules.** 58 screens.
4. **Recovery.** One timed restore would lift the reliability of every group.
