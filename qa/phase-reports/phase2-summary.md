# Phase 2 summary: all six workstreams

Written 2026-11-13. Each workstream has its own gate report in this folder; this page is the state of the whole.

## Status: PARTIALLY COMPLETE, NOT PRODUCTION READY

No workstream reached VERIFIED COMPLETE, and no module group reached the target of 95. That is the honest result of a first pass through a product in which, at the start, the main screens for quoting at the counter, stock, receiving, jobs, scheduling, work orders and shipping showed sample data or saved nothing. Those now run on real records and are checked by automated tests. What remains is mostly work that needs the owner's decision or was not examined, and it is listed below.

Nothing is live. Pull request 30 holds all of it and is not merged.

## Scores

A judgement from the evidence in `module-quality-scorecard.md`, not a measurement.

| Module group | Before | Now | Target |
|---|---:|---:|---:|
| Sales and customer operations | 45 | 73 | 95 |
| Inventory and purchasing | 30 | 68 | 95 |
| Manufacturing and processing | 35 | 66 | 95 |
| Logistics and financial operations | 40 | 70 | 95 |
| Enterprise administration, reporting, navigation | 30 | 55 | 95 |

## What was fixed and is checked on every run

- One price rule for a customer in every sales channel; tax saved on every order by the owner's rule; credit limits enforced by the owner's rule.
- Stock, heats, receiving, holds, moves and uploads on real records, with cost kept to the roles that manage it.
- Jobs, the schedule, time tracking and coil work orders on real records, with every job move recorded against a person.
- Real screens to create, dispatch and deliver a shipment; the invoice raised on dispatch; every shipment step and money action recorded against a person.
- No screen presents made-up data as real: 58 sample screens say so, and dashboards show an error instead of an invented figure.
- Job list, cockpit and analytics routes that failed or took seconds at volume now answer in about a second or less; every foreign key indexed; nine database value checks.

## The tests

All local, on a QA database rebuilt for the run. Results of the final run are in `test-execution-results.md` and in section 8 of the Workstream 6 report.

| Gate | Size |
|---|---|
| Unit tests | 87 |
| Order-to-cash simulation | 3 cycles of 50 jobs: 2,134 API steps, 2,357 database checks, and a reconciliation of stock and orders |
| Security and safeguards sweep | 20 sections |
| Browser suites that operate screens | 5 suites, 125 checks |
| Screen check | every route opens without a crash |
| Screen audit | every screen classified; fails on made-up data with no notice |
| Lint, production build | whole frontend |

Each fix has a check that was seen to fail on the code before it, with two exceptions stated in the gate reports: browser checks for screens that did not exist before, and three inspection checks added after their fix.

## What the owner needs to decide

Grouped; the IDs are in `engineering-quality-findings.md`.

1. **Build or remove, per module** (X-009, I-011, M-011, F-007): safety, maintenance, training, contractors and visitors, customer quality, executive tools, production quality, supplier quality, freight planning, bills of material, provenance. 58 screens.
2. **Missing functions the business runs on**: purchase orders (I-007); stock adjustments and counts (I-016); whether coil work orders stay and move stock (M-016).
3. **Rules**: cut-off times, promise dates and branch suggestions, which are invented in the browser today and shown at checkout (X-007, S-010); the web store's tax estimate (F-008); who may read invoices (F-009); which backward moves a job may make (M-017); whether stock pending inspection may ship; whether a return must be inspected before credit; remnant discounts (S-009); rules 28 to 31, 33 to 36 and 39 to 44 to confirm.
4. **Before going live**: apply the four database files in order; decide on web orders accepted earlier that carry no tax; a staging environment, a tested backup restore, alerting, and a shared rate limit (E-014, E-015, E-017).

## What was not examined

Dispatch and planning engines, recipes, packaging, maintenance, capacity, labor costing; shipping documents and printing; freight cost; statements and ageing; the admin screens and reports one by one; the top bar assistant; accessibility; mobile layouts; most of the help manual; performance of anything outside Workstream 1's benchmark.

## Compliance

No claim of compliance with any standard or certification is made. None was assessed.
