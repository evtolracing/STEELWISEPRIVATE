# Database integrity report

Scope so far: structure-level audit (Workstream 1). Per-module data rules are audited in Workstreams 3 to 5.

| Check | Before | After | How measured |
|---|---|---|---|
| Tables | 158 | 158 | Catalog |
| Foreign keys | 170 | 170 | Catalog |
| Foreign keys with no index | 87 | 0 | Catalog query; `prisma migrate diff` reports no difference |
| Check constraints | 0 | 8 | Catalog |
| Money or quantity columns stored as floating point | 1 (`Remnant.estimatedWeight`, an estimate) | 1 | Catalog |
| Foreign keys that delete children automatically | 39 | 39 | Catalog. Not yet reviewed one by one (open) |
| JSON columns | 160 | 160 | Schema. Not yet reviewed (open) |
| Stock reconciliation after 150 simulated jobs | 0 problems in 323 stock items | 0 problems | `qa/results/final-800*.json` |
| Billing reconciliation (invoices, payments, credits, returns) | 0 problems | 0 problems | same |

## Checks added

Each is added only when every existing row already satisfies it; otherwise the update skips it and prints a notice, so nothing that works today starts failing.

- Stock on hand, available, reserved and on hold cannot be negative.
- An order line's quantity must be more than zero; its shipped quantity cannot be negative.
- A shipment line's quantity must be more than zero.
- An invoice cannot be paid beyond its total.

## Migration

`20261113062621_fk_indexes_and_stock_checks`. Additive only: 87 indexes and the checks. Applied to the test, QA and scaled databases. The SQL Editor version was run twice on a copy (second run is a no-op). On the scaled database (about 600,000 rows) it took under 3 seconds. Building an index briefly blocks writes to that table; on the current production size this is not noticeable.

Rollback: drop the indexes and constraints by name. No data is changed.

## Open

- The stock balance identity is not database-enforced (E-020).
- Automatic-delete links and JSON columns not yet reviewed.
- Tenant scoping not yet audited (E-019).
- Nothing in this report has been run against production data. The checks may be skipped there if existing rows fail them; the SQL Editor output will say so.
