# Phase 12: the whole program in one register

Date: 2026-11-19. Release candidate RC-2 (RC-1 is commit `9e12319`, the merge of Phase 11; RC-2 is RC-1 plus the corrections of this phase, listed in `phase-12-release-baseline.md`). Everything here was run in this session on one local machine against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only. Nothing was run against the live system, and nothing here is a statement about it.

Made by `qa/tools/phase12-consolidate.mjs` from the phase reports, the findings register and the test files on disk. It does not trust a report: a finding marked fixed is classed by whether the test it names exists.

## The twelve phases, by their own reports

| Phase | Name | Report on file | Status the report gives itself |
|---|---|---|---|
| 1 | Discovery and baseline | yes | PARTIALLY COMPLETE |
| 2 | Architecture and code quality | yes | PARTIALLY COMPLETE |
| 3 | Database and data integrity | yes | PARTIALLY COMPLETE |
| 4 | API, events and integrations | yes | PARTIALLY COMPLETE |
| 5 | Sales, CRM, POS and e-commerce | yes | PARTIALLY COMPLETE |
| 6 | Inventory, purchasing and warehouse | yes | PARTIALLY COMPLETE |
| 7 | Manufacturing and quality | yes | PARTIALLY COMPLETE |
| 8 | Shipping, logistics and invoicing | yes | PARTIALLY COMPLETE |
| 9 | User experience and productivity | yes | IMPLEMENTED — VERIFICATION INCOMPLETE |
| 9.5 | Financial ledger | yes | IMPLEMENTED — VERIFICATION INCOMPLETE |
| 10 | Security, reliability and recovery | yes | IMPLEMENTED — VERIFICATION INCOMPLETE |
| 11 | 80-location enterprise simulation | yes | IMPLEMENTED — VERIFICATION INCOMPLETE |

**0 of 12 phases call themselves VERIFIED COMPLETE.** Each stopped short for a stated reason: an owner decision, an approval, or something that can only be done on the live system. Those reasons are the blockers in `phase-12-release-blockers.md`; none was closed by rewording.

## Findings

462 findings in one register, ids and history kept, none deleted. 114 open (2 P0, 17 P1, 53 P2, 41 P3, 1 P4). By status: VERIFIED FIXED 346; IN PROGRESS 6; REQUIRES BUSINESS DECISION 92; BLOCKED 5; NOT APPLICABLE 2; FIXED — NOT VERIFIED 7; ACCEPTED RISK WITH APPROVAL 4.

Before this phase 63 findings carried the status "deferred to a specific phase". There is no later phase, so each was given a status this phase allows (`phase-12-dispositions.json`): fixed and verified now, blocked on a named thing, or "requires business decision" where the work is simply not done and nobody has approved leaving it. **None was marked "deferred with approval": no approval to defer is on file.**

## How good is the evidence behind "verified fixed"

| Class | Findings | Meaning |
|---|---|---|
| Names a test that exists on disk | 176 | Strong: the check can be rerun |
| Names a suite only | 64 | The suite exists and passes in the gate; the single check is not named |
| Words only | 106 | Mostly the first audit (series D, E, F, I, M, S, U, X): fixed and looked at in a browser at the time, with no automated check named. The later suites cover many of these screens, but the register does not tie them together |
| No evidence | 0 |  |

This is a weakness of the record, stated as it is: 106 findings are "verified" by a person's reading, not by a named automated check. They are listed in `qa/results/phase12-consolidation.json` (evidence.wordsOnly).

## Notes that contradicted their own status

15 findings were marked VERIFIED FIXED while an earlier note on them said part was not verified. Each was tested now or its limit written plainly:

| Finding | The earlier note said | Phase 12 |
|---|---|---|
| B-007 | The executive decision change has no automated check: FIXED, NOT VERIFIED for that one line. | Phase 12: the executive decision line is now tested: a decision is recorded under the signed-in person and role whatever the request claims, and a sales representative is refused. |
| B-021 | NOT VERIFIED by a probe Phase 10 (Y-005): the static /uploads route is removed; files are read through the signed-in download only. | Phase 12: tested again: an uploaded file is not served by its address; it is read only through the signed-in download; a customer login of another account is refused. |
| C-006 | Order creation only was exercised through the API; the web checkout and order intake use the same middleware and were not separately run (NOT VERIFIED | Phase 12: the web checkout was run with a request key (the same order sent twice saves one order). Order intake uses the same middleware and was not run separately: NOT VERIFIED for that one route. |
| E-009 | Fixed, awaiting verification | Phase 12: confirmed by reading the code: demo companies are loaded only with SEED_ON_START=true. The deployment checklist says to confirm the setting is absent on the host. No automated test starts a server against an empty non-local database, by rule. |
| E-010 | Code change; not exercised by a test qa/tools/phase12-process. | Phase 12: now exercised by a test: a server asked to stop finishes the requests it has begun, exits by itself with code 0 in under five seconds, closes its database connections and takes no new request. |
| H-005 | No real provider was called in any test; the real providers' behaviour is NOT VERIFIED. | Phase 12: unchanged and stated plainly: the fix is verified against stand-ins for the outside services. No real provider was called in any test; the first real call is a first-day check on the deployment checklist. |
| H-006 | How many live orders are in this state is NOT VERIFIED (no access); the report will show it once deployed. | Phase 12: the fix is verified on QA. How many live orders are in this state is unknown until the report is read on the live system: a first-day check on the deployment checklist. |
| H-018 | Their number is NOT VERIFIED. | Phase 12: verified on QA; the count on live data is a first-day check on the deployment checklist. |
| L-031 | Whether any exist is NOT VERIFIED. | Phase 12: verified on QA; whether any exist on live data is a first-day check on the deployment checklist. |
| M-009 | The error path itself was not triggered in a test: NOT VERIFIED qa/sim/phase12-ui. | Phase 12: the error path is now triggered in a browser: with the time records failing to load, the screen says so and shows no hours and no "demo data". |
| M-013 | No automated check (it needs a server with no database): NOT VERIFIED qa/tools/phase12-process. | Phase 12: now checked on a server started with no database: the jobs list answers 503 and no sample job. |
| N-004 | How many exist in the live database is NOT VERIFIED. | Phase 12: verified on QA; the count on live data is a first-day check on the deployment checklist. |
| N-014 | What a paper looks like on a real printer is NOT VERIFIED. | Phase 12: the documents are verified as files. What a paper looks like on a branch's own printer is not, and no claim is made (K-013): a pilot-branch check in the rollout plan. |
| W-020 | Live backups (the host's) are not exercised: E-015. | Phase 12: the words "NOT VERIFIED" at the start of this finding's verification were left from before Phase 10 and are removed: the restore was run in Phase 10 (qa/results/phase10-restore.json). Live backups remain E-015. |
| W-022 | NOT VERIFIED with more than one server process. | Phase 12: the words "NOT VERIFIED with more than one server process" are out of date: Phase 11 ran it on three and four server copies (Z-002). |

D-011b was moved from VERIFIED FIXED to FIXED — NOT VERIFIED for the same reason: its remaining part can only be checked on the hosted site.

## Documents outside `qa/` that claim more than is built

22 design, sales and set-up documents use words such as "complete" or "production ready". 22 now open with a status notice that says they are not evidence and points here. Their text was not rewritten.

| Document | Claims found | Notice added |
|---|---|---|
| `DESIGN FILES/21-ALRO-PHASE1-DESIGN.md` | 19 | yes |
| `DESIGN FILES/23-ALRO-BOARD-PITCH.md` | 9 | yes |
| `docs/INDEX.md` | 8 | yes |
| `docs/SETUP.md` | 8 | yes |
| `DESIGN FILES/22-PERSONA-CATALOG.md` | 5 | yes |
| `DESIGN FILES/70-OPS-COCKPIT-SPECIFICATION.md` | 5 | yes |
| `DESIGN FILES/70-RBAC-PERMISSIONS-SPEC.md` | 4 | yes |
| `README.md` | 3 | yes |
| `docs/AI_INTEGRATION.md` | 3 | yes |
| `DEPLOYMENT_SUMMARY.md` | 2 | yes |
| `DESIGN FILES/89-PRODUCTION-QUALITY-MODULE.md` | 2 | yes |
| `DESIGN FILES/90-MAINTENANCE-RELIABILITY-MODULE.md` | 2 | yes |
| `DESIGN FILES/93-SALES-PRICING-RFQ-TO-CASH.md` | 2 | yes |
| `archive-design-files/23-SHOP-FLOOR-EXECUTION-UX.md` | 2 | yes |
| `archive-design-files/36-AI-DOMAIN-CONTEXT.md` | 2 | yes |
| `docs/PRODUCTION_WORKFLOW.md` | 2 | yes |
| `DESIGN FILES/70-CUSTOMER-RMA-CAR-MODULE.md` | 1 | yes |
| `DESIGN FILES/80-SAFETY-MODULE-SPEC.md` | 1 | yes |
| `DOCUMENTATION_RESTRUCTURE.md` | 1 | yes |
| `MAPBOX_INTEGRATION.md` | 1 | yes |
| `archive-design-files/31-ECOMMERCE-INTEGRATION.md` | 1 | yes |
| `docs/IMPLEMENTATION_SUMMARY.md` | 1 | yes |

## Carried forward unfinished

- Phase 11 scale: one machine carried the database, three server copies and the load. Server copies on separate machines, the live database and its pooler are NOT VERIFIED
- Phase 11 volume: one simulated day built on assumptions, not on real volumes of the business. A year of data is NOT VERIFIED (W-023)
- Phase 11 thresholds: proposed, not approved. Dispatch is above the proposal with 32 or more customer jobs in flight (Z-006)
- Phase 11 AI: the AI service was a stand-in; what a real model answers is NOT VERIFIED
- Live database role: on QA the server runs as steelwise_runtime and cannot alter the books or history. The live server still connects as the owner until the owner applies file 17 and switches DATABASE_URL (Y-008, Y-009, W-014)
- Alerts: raised and delivered to a QA stub only. No live receiver is set (E-017); the scheduled run must be set on the host (B-019)
- Backups: an isolated restore was proven on QA (W-020). The host's own backups have never been restored (E-015); recovery objectives are proposals, not approved
- Deployment: database rollback tested on a copy; a Vercel promote or rollback NOT VERIFIED
- Outside services: every partner, carrier, AI and accounting service was a stub
- Accounting: no accountant has reviewed any policy, account, mapping or posting rule. The tests prove the software does what its documents say, not that the documents are the right accounting (W-001)
- Live data: the ledger has never run on the live database or a copy of it. Opening balances, the number of items with no cost and how long activation holds business saves are unknown (W-005)
- External accounting: nothing is connected. Import of the export file into QuickBooks or Xero is NOT VERIFIED (W-011)

- Owner: approve or change the proposed performance thresholds (phase-11-workload-profile.md); without approved thresholds Phase 11 cannot be VERIFIED COMPLETE
- Owner: decide Z-006, the wait at the dock at peak (phase-11-capacity-recommendations.md)
- Owner: apply SQL Editor file 17 before merging the Phase 10 pull request; deploying first stops every sign-in (Y-022 makes the answer say so)
- Owner: Y-008 and W-014 take effect on live only after DATABASE_URL points at steelwise_runtime
- Owner and accountant: W-001. The ledger is switched off and the software refuses to start it until every account and mapping is approved under the accountant's name. Production posting is blocked by design
- Owner and accountant, questions raised by the build: W-002 legal entities, W-003 time zone, W-004 gaps in journal numbers, W-006 and W-007 and W-012 receipts and counter stock with no cost, W-009 payables clearing, W-010 processing revenue, W-011 which accounting product
