# Phase 6: material master data audit

Date: 2026-11-15. Read from the schema, the code and the two local QA databases (`steelwise_qa`, and `steelwise_qa_scale3` with 85 branches and 100,233 stock items). **Live master data was NOT VERIFIED: there is no access to it from this environment.** The counts below describe the QA copies, which are built by the seed and the scale script, not the business's real catalog.

## 1. What a stock item is

One row in `Coil` (the name is historical: it holds coil, sheet, plate, bar, rod and, since this phase, shelf goods) with one row in `Inventory` for its balance. The owner's decision 1 makes this the one real stock list.

| Field | Where | Rule today | Enforced by |
|---|---|---|---|
| Item number | `Coil.coilNumber` | Unique, typed or scanned at receipt | Database unique index |
| Form | `Coil.form` | COIL, SHEET, PLATE, BAR, ROD, SUPPLY and others | Database enum |
| Heat | `Coil.heatId` | Required unless the form is SUPPLY; the heat must already be on file | Database check `Coil_heat_and_grade_unless_supply` (new, file 12) and the receiving rule |
| Grade | `Coil.gradeId` | Required unless SUPPLY; must match the heat's grade | Same check; receiving rule |
| Product | `Coil.productId` | Optional for metal; required for SUPPLY and must be in the catalog | Receiving rule |
| Owner | `Coil.ownerId` | The house, or a customer for customer-owned material | Foreign key; reservation rule (K-001) |
| Parent | `Coil.parentCoilId` | Set for a piece or remnant cut from another item | Foreign key; pieces inherit heat, grade and owner (database fact check) |
| Branch | `Coil.locationId` and `Inventory.locationId` | Always equal | Fact check "stock row and its item disagree about the branch": 0 |
| Bin | `Coil.binLocation` | Free text | Nothing (K-009) |
| Balance | `Inventory` | on hand = available + reserved + on hold + in transit; none below zero | Database checks (identity replaced in file 12 to include in transit) |
| Unit | `Inventory.unit` | LB for metal, EA for shelf goods | Receiving rule |
| Cost | `Inventory.unitCost`, `landedCost`, `avgCost` | Typed by a manager; `avgCost` never written | Nothing (K-007) |

## 2. Counts on the 85-branch QA copy

| Record | Count | Note |
|---|---|---|
| Locations | 85, all type WAREHOUSE, none with a parent | Branches are the only locations. There is no zone, aisle or bin record |
| Grades | 8, none unused, no two codes that differ only by letter case | |
| Products | 12, all active (10 priced per hundredweight, 2 each) | No two SKUs differ only by case |
| Heats | 15, none with a mill certificate document attached | A purchase order line that requires an MTR therefore holds every receipt on the QA data. Live: NOT VERIFIED |
| Stock items | 100,233, every one with a balance row | 97,223 have no product: metal is identified by grade, form and size, not SKU |
| Units | 100,233 balances in LB, 0 in EA | No piece stock existed before this phase (C-011) |
| Items with a bin | 0 | The bin field is unused in the QA data |
| Suppliers | 3 mills, 0 distributors | The purchase order screen offers mills and distributors |
| Steel Outlet remnants | 10 rows in `Remnant`, linked to no stock item | K-006 |

## 3. Findings

| Finding | Severity | Status |
|---|---|---|
| C-011 Shelf goods could not be stocked (heat and grade were required of everything) | P2 | VERIFIED FIXED |
| K-006 The Steel Outlet remnant list is a third stock list | P2 | REQUIRES BUSINESS DECISION (remnant pricing, S-009) |
| K-007 No cost at receipt; valuation cannot be reported | P1 | REQUIRES BUSINESS DECISION |
| K-009 Bins are free text; no bin master | P3 | REQUIRES BUSINESS DECISION |
| I-017 Heats are added one at a time before receiving | P2 | Deferred, unchanged; the rule is confirmed by a scenario |
| B-009, I-012 Second stock list (v1, RFID tables) | P1 | IN PROGRESS: its writes are retired; reads and empty tables remain |

## 4. What was not changed

No master record was deleted or rewritten. Heat and grade were made optional in the column and kept required by a database check for every form except SUPPLY, so no existing row is affected: on the 85-branch copy every one of 100,233 items passed the new check when file 12 was applied.
