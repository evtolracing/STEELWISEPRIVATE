# Phase 3: schema audit

> **Updated after the owner's decisions of 2026-11-13.** Shipping without a reservation (G-019), stock movement in processing and remnants (M-016, G-006, G-008), stock corrections (I-016), invoice numbering (G-017) and retention (G-016) were decided and built after this file was first written. Rows below that name those findings are marked. The detail is in `phase-03-owner-decisions.md`.

What the database actually contains, read from PostgreSQL's own catalogues, and what was changed. Everything here was read or run in this session on 2026-11-13 against local databases. The live database was not connected to, read or changed: this environment holds no connection to it.

## 1. The test databases, and how isolation was verified

No mutating test was run until all of the following had been checked.

| Check | Result |
|---|---|
| `DATABASE_URL` in the environment at the start of the session | Not set. No `.env` file exists in the repository, only `.env.example` |
| Any connection string to a hosted database on this machine | None found. The Supabase and Vercel settings are the owner's and are not present here |
| Server the tests use | PostgreSQL 16.15 on 127.0.0.1:5432, data directory `/var/lib/postgresql/16/main`, on this container's own disk |
| Database for functional tests | `steelwise_qa`, dropped and rebuilt from the migrations and the QA seed at the start of every gate run (`qa/tools/rebuild-qa-db.sh`) |
| Database for volume tests | `steelwise_qa_scale3`, a copy of the Workstream 1 scale database brought to the current schema: 85 branches, 72,240 orders, 74,347 order lines, 100,233 stock items, 72,541 jobs, 50,869 shipments, 37,625 invoices, 42,441 stock movements, 325 MB |
| Guard in the tools | `qa/sim/lib.mjs`, `qa/tools/start-qa-server.sh`, `qa/tools/run-gates.sh`, `qa/tools/db-schema.mjs` and `qa/perf/phase3-plans.sh` each refuse a database that is not on localhost with `qa` in its name. The name alone is not trusted: the host must also be local |
| Identity recorded by the inventory tool | `qa/results/db-schema.json`: database `steelwise_qa`, user `postgres`, client address 127.0.0.1, isolation level read committed, 100 connections allowed |

The live database's configuration (version, extensions, roles, pooler, backups) is NOT VERIFIED. It can only be read by the owner.

## 2. Inventory of the schema

Tool: `qa/tools/db-schema.mjs`. Output: `qa/results/db-schema.json`. It now runs in the gates.

| Item | At the start of Phase 3 | At the end |
|---|---:|---:|
| Tables | 158 | 159 (RequestKey added) |
| Columns | 2,452 | 2,462 |
| Primary keys | 158 | 159: every table has one |
| Foreign keys | 171 | 188 |
| Foreign keys not validated | 0 | 0 |
| Delete rules: cascade, restrict, set null | 39, 71, 61 | 39, 78, 71 |
| Unique indexes | 81 | 82 |
| Value checks | 9 | 24 |
| Indexes | 578 | 581 (10 duplicates dropped, 13 added) |
| Exact duplicate indexes | 10 | 0 |
| Views, materialized views | 0, 0 | 0, 0 |
| Triggers, functions, stored procedures | 0, 0 | 0, 0 |
| Partitioned tables | 0 | 0 |
| Sequences | 1 | 1 |
| Enumerations | 96 | 96 |
| Schemas | 1 (`public`) | 1 |
| Migrations applied, failed | 23, 0 | 26, 0 |
| Tables holding no rows after a full test run | 113 | 93 after the Phase 3 scenarios |
| Columns named like a reference with no foreign key | 232 | 217 |

All business logic is in the server. The database holds no triggers, functions or views, so there is no hidden logic to audit there.

**Tenant model.** One database, one schema, shared tables. Customers are separated by organization columns, branches by `locationId` columns. Both are enforced in the server (`lib/branchScope.js`, `middleware/apiGate.js`), not by the database. No architectural change to this was made or is proposed.

**Row-level security.** The QA database has no policies. On the host, every SQL Editor file the owner applies turns row-level security on for every table and adds one policy per table that admits every database role except Supabase's two public API roles (`anon` and `authenticated`). Its purpose is to close Supabase's public REST interface. It does not separate branches or customers. Whether it is in force on the live database is NOT VERIFIED.

**Audit tables.** One, `AuditLog`. It is an ordinary table: see finding G-011.

## 3. Referential integrity

The tool lists every column whose name ends in `Id` and has no foreign key, guesses the target table from the name, and counts rows whose value matches nothing.

| Group | Columns | Action |
|---|---:|---|
| Tie money, stock or work to its source | 15 | Foreign keys added (G-002). List below |
| Branch of a quote or request | 2 | New columns with keys (G-012) |
| In tables that hold rows in the QA database, target evident | 9 | Left: all are in sample or JSON-backed modules (ExceptionEvent, IntakeJob, IntakeOrder, InventoryUnit, RfidScanEvent, PrintQueueJob). Ten columns hold values that match no row; those rows were written by the demo seed |
| `Job.operatorId` | 1 | Left: the code reads it as a user in one place and as an operator in another. Adding a key to either would break the other. Recorded in G-003 |
| In tables no code writes, or free-text ids of outside systems | about 190 | Left (G-003, deferred with the module that owns each table) |

**The 15 keys added**

| Column | Points at | On delete of the target | Why that rule |
|---|---|---|---|
| Invoice.shipmentId | Shipment | Refused | A shipment that has been billed is evidence |
| Invoice.creditOfInvoiceId | Invoice | Refused | A credited invoice cannot disappear from under its credit memo |
| InvoiceLine.orderLineId | OrderLine | Refused | Billed lines stay |
| Order.returnOfOrderId | Order | Refused | A return keeps its original order |
| OrderLine.returnOfLineId | OrderLine | Refused | Same |
| QuoteLine.productId | Product | Refused | A quoted product stays on file |
| DispatchJob.locationId | Location | Refused | A branch with planned work cannot be deleted. The default text "FWA" was removed (C-003) |
| Job.orderLineId, Job.workOrderId | OrderLine, WorkOrder | Set to empty | The job is kept as history |
| WorkOrder.salesOrderId, WorkOrder.lineId | Order, OrderLine | Set to empty | Same |
| DispatchJob.orderId | Order | Set to empty | Same |
| DispatchOperation.assignedWorkCenterId | WorkCenter | Set to empty | Same |
| Quote.createdById | User | Set to empty | The quote outlives the login |
| Shipment.carrierId | Organization | Set to empty | The carrier name is also kept as text |

Each is added `NOT VALID` (no long lock on the table) and then validated only if no existing row breaks it. If rows break it, the file prints a notice naming the count and leaves the key in force for new rows. On the QA database and on the 85-branch copy every key validated.

**Deletes that cascade into money or stock rows:** two, `InvoiceLine` with its invoice and `ShipmentItem` with its shipment. Both are parts of their parent and cannot exist without it. The parents themselves can no longer be deleted once billed.

## 4. Value checks

Nine existed (stock balances and reservations, from Workstream 5). Fifteen were added (E-004, verified fixed):

| Table | Rule |
|---|---|
| OrderLine | Unit price not negative; extended price not negative; discount between 0 and 100 |
| Order | Subtotal, tax and freight not negative; total equals subtotal + tax + freight |
| Invoice | Total equals subtotal + tax + freight (true for credit memos too, which are negative throughout) |
| Payment | Amount is not zero (a refund is negative) |
| QuoteLine | Quantity more than zero; unit price not negative |
| MaterialMovement | Quantity moved more than zero |
| OrderLineAllocation | Quantity reserved more than zero |
| ShipmentItem | Weight not negative |
| Coil, WorkOrder, Job | Weights not negative |

Each is skipped with a notice if existing rows break it, so applying the file cannot fail on old data. Proof that each kind is enforced: two scenarios in `qa/sim/phase3-db.mjs` write 13 bad values straight to the database and every one is refused.

Checks deliberately not added, and why:

- **Quantity on an order line more than zero.** Return lines and cancelled lines exist with other conventions; the server already refuses zero and negative quantities on entry (tested).
- **Paid amount not above the total.** Already present from Workstream 5.
- **Required branch on Order.** Existing rows have none (G-018).
- **Fixed scale on money columns.** The columns are `numeric(65,30)`. Changing the type rewrites every row of the largest tables under a full lock; exactness is now guaranteed on the way in instead (G-001).

## 5. Numbers, dates and types

| Finding | Evidence | Disposition |
|---|---|---|
| Money and weights stored with floating-point digits | 12 columns affected in the QA database before the fix, for example a tax amount of 9.380000000000001 | G-001, VERIFIED FIXED |
| Nine floating-point columns | ProcessingRecipe (5) and Remnant (4). Both tables hold no rows and no order-to-cash code writes them | Noted in G-003; to be changed when the module is built |
| Timestamps | `timestamp(3)` without time zone throughout; the server writes UTC | Consistent. No change |
| Business numbers | 28 columns hold a document or code number; the ones in use (order, invoice, shipment, job, work order, stock item, heat, grade, location, organization) each have a unique index. `Document.documentNumber` and `BomRecipe.code` do not; neither is used as an identifier by the code | No change |
| Statuses | 96 enumerations; status columns in the order-to-cash tables are all enumerations, not text | No change |

## 6. Indexes

- Ten exact duplicates dropped (G-005). Four indexes that are a prefix of a unique index were left: nothing measured says they cost anything that matters.
- Thirteen added: eight for the new foreign keys (the sweep's rule that every foreign key has an index failed without them, and deleting a parent would otherwise scan the child table), two for the branch of quotes and requests, three for RequestKey.
- No index was added for speed. The measurements in `phase-03-query-performance.md` do not justify one.

## 7. What the audit did not cover

- The live database: extensions, roles, grants, row-level security actually in force, size, bloat, long-running queries. NOT VERIFIED.
- The 93 tables with no rows were inventoried, not exercised.
- Storage of files (documents) is outside the database and was not audited in this phase.
