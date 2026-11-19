# Phase 12: staged rollout plan

Date: 2026-11-19. Release candidate RC-2 (RC-1 is commit `9e12319`, the merge of Phase 11; RC-2 is RC-1 plus the corrections of this phase, listed in `phase-12-release-baseline.md`). Everything here was run in this session on one local machine against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only. Nothing was run against the live system, and nothing here is a statement about it.

A recommendation. Nothing here is scheduled and nothing is activated by it. **No date is proposed**: each stage begins when its entry criteria are met and the named approver says so. **No location is named**: the pilot is chosen by the owner against the criteria below.

## Why staged

Every measurement in this program was taken on synthetic data on one machine. A staged rollout is how the things that could not be measured here (real volumes, real users, real printers and scanners, the live database, the host's backups) are learned at the scale of one branch before they can hurt eighty.

## Stages

| Stage | What happens | Entry criteria | Exit (acceptance) criteria | Who authorises |
|---|---|---|---|---|
| 0. Internal validation | The release candidate on an isolated copy of the live database (name contains `qa`), with internal test users. The ledger dry run on that copy. | Database updates 17 and 18 applied to the copy; the full gate green on the candidate (this phase). | Every item of `phase-12-deployment-checklist.md` section A done; the ten cross-module flows repeated by hand by a business user on the copy; the dry run figures signed by the accountant; a host backup restored once (E-015). | Owner |
| 1. Pilot location | One branch works live in the system for its real orders, stock, production and shipping. The ledger stays off unless the accountant has approved it. | Stage 0 accepted; pilot chosen against the criteria below; its people trained (`phase-12-training-plan.md`) and signed off; its stock counted and its costs entered; support cover named. | Ten consecutive working days with: no P0 or P1 incident open; stock count sample agrees with the system within the tolerance the owner sets; every shipment invoiced (Integrations screen shows none uninvoiced); the pilot manager's sign-off. | Owner, with the pilot branch manager |
| 2. Expanded pilot | Several branches of different kinds: at least one with processing, one warehouse-only, one sales office, and two that transfer stock to each other. | Stage 1 accepted; every Stage 1 defect of P0 to P2 closed or approved as deferred; measured live response times reviewed against approved thresholds. | Fifteen working days meeting the Stage 1 criteria at every branch; a transfer sent and received between pilot branches with a shortage decided; month-end reconciliation clean if the ledger is on. | Owner, operations and finance leads |
| 3. Regional rollout | Controlled groups of branches, one group at a time. | Stage 2 accepted; capacity reviewed against the Phase 11 projection with real figures; the Z-006 decision (dispatch wait at peak) made. | Each group meets the Stage 1 criteria for ten working days before the next group starts. | Owner |
| 4. Enterprise rollout | The remaining approved branches. | Stage 3 accepted for every group; support load per branch known from Stages 1 to 3. | All approved branches live; the program's open findings re-reviewed. | Owner, executive |

A stage is stopped, and the group returns to its previous way of working, when a P0 incident is open, when stock or money cannot be reconciled, or when the approver says so. Stopping a stage is not a failure of the program; continuing past one of those is.

## Pilot selection criteria

The pilot should be **representative with manageable risk**, not the quietest branch: a branch with the fewest transactions proves the least.

| Criterion | What to look for | Evidence the owner should have before choosing |
|---|---|---|
| Operational complexity | Does the branch sell from stock, process (cut, slit), ship by its own truck and by carrier, and take counter sales? A pilot that does most of these exercises most of the product. | The branch's own description of a normal week |
| Employee readiness | People willing to work in two systems for a short overlap, and a manager who will insist the system is used. | Training sign-offs for every role at the branch |
| Inventory accuracy | A recent count that agrees with the current records. A pilot that starts from wrong stock will blame the software for old errors. | A count dated shortly before cutover, with variances resolved |
| Manufacturing requirements | Processing that the product models: work orders with pieces and scrap, jobs through work centers with a QC gate. Requirements outside that (see the manufacturing certification) should not be in the pilot. | The list of processing the branch does |
| Financial readiness | Costs on file for its stock; its open invoices known; the accountant available for the dry run. | The dry run on a copy: items with no cost listed |
| Management support | A branch manager and a head-office sponsor who will decide quickly. | Named by the owner |
| Integration dependencies | Few. No carrier, card, email or accounting integration is connected in the product; a branch that depends on one today needs a manual step. | `phase-04-external-integrations.md` read against how the branch works |
| Ability to recover | The branch can fall back to its present way of working for a day without harm, and its data can be re-entered. | A written fallback for the branch |

## What a stage does not change

- The ledger is started once for the company, not per branch, and only after the accountant's approval (W-001). It can stay off through every stage.
- The sample screens stay labelled as samples. They are not part of any stage until built (owner decision 4).
- Database updates are applied by the owner, before the code that needs them.
