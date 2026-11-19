# Phase 12: final quality scorecard

Date: 2026-11-19. Release candidate RC-2 (RC-1 is commit `9e12319`, the merge of Phase 11; RC-2 is RC-1 plus the corrections of this phase, listed in `phase-12-release-baseline.md`). Everything here was run in this session on one local machine against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only. Nothing was run against the live system, and nothing here is a statement about it.

Scores are judgements from the evidence named beside each one; they are not measurements. A category with no evidence in this run is NOT ASSESSED and gets no number. **A score does not open a gate: a high number cannot override a financial, security or data blocker, and here the blockers stand whatever the number is.**

| Category | Weight | Score | Weighted | Evidence and what holds it down |
|---|---|---|---|---|
| Functional correctness | 15% | 74 | 11.10 | Order to cash, purchasing, transfers, work orders, returns, counter and web sales pass end to end (10 of 10 scenarios pass; Phases 5 to 8 pass in the gate). Held down by 58 of 146 screens being labelled samples with nothing behind them, and by capabilities the prompt lists that are not built (system certification). |
| Data integrity | 15% | 90 | 13.50 | Books balance by SQL; receivables, inventory, in transit, revenue, tax and payments reconcile with no difference after every flow; a planted 100 lb difference is found by item; history cannot be changed by the application's database role on QA. Held down by the second stock list still present (B-009) and the live database role not yet switched (Y-008). |
| Reliability | 12% | 80 | 9.60 | Phase 11 failure injection 36 of 36; a polite stop finishes requests in flight (23 of 23 process checks); every double press tested makes one record. Held down by: no scheduler on the host (B-019), a crash between dispatch and billing needs a person to bill (Z-012), live backups never restored (E-015). |
| Security | 12% | 86 | 10.32 | Phase 10 security 277 of 277 pass, 889 checks; this phase's revalidation 11 of 11 scenarios pass; the assistant's input is now checked and audited (AA-003, AA-004). Held down by the live database role (Y-008), no table-by-table tenant audit (E-019), and no outside penetration test: none was run and none is claimed. |
| Operational efficiency | 10% | 70 | 7.00 | Phase 9 measured clicks and keystrokes on the daily workflows and removed dead ends. No measurement with real employees exists: every figure is a scripted browser, not a person. |
| User experience | 10% | 72 | 7.20 | Every screen opens; in the gate Phase 9 UI scenarios: 231 of 232 passed, 1 failed, 0 not applicable, 1093 checks; one scenario failed on timing in the test (AA-012); whole suite run again on the same build: Phase 9 UI scenarios: 231 of 232 passed, 1 failed, 0 not applicable, 1093 checks (the gate's failure passed; a different scenario failed because the rerun followed Phase 11's data, and passes in gate order); no screen wider than a phone. Held down by sample screens beside real ones on the menu (U-040) and hand-built tables that differ screen to screen (V-036). |
| Performance | 8% | 68 | 5.44 | Measured on one 4-processor machine carrying database, three server copies and the load: 5191 transactions, 0 failed, 0 deadlocks. Dispatch at peak is above the proposed limit (Z-006). Thresholds are proposed, not approved; nothing was measured on the live host. |
| Integrations | 6% | 70 | 4.20 | Outside calls have time limits, retries, a breaker and a failure report; partner events are delivered once. Every outside service was a stand-in: no real provider was called in any test (H-005). No email, text, carrier or accounting-system connection exists. |
| Maintainability | 5% | 62 | 3.10 | Lint 0 errors; unit tests on the rule modules; one gate script reproduces everything. Held down by business rules inside large route files and screens (B-014, E-018), 1,572 lint warnings held at a ceiling, and unbuilt design in a third of the schema (B-017). |
| Observability | 4% | 50 | 2.00 | Health checks, request references, structured logs, an Integrations report and audit rows exist and are tested. Nothing reaches a person on live: no alert receiver, no error tracking, no scheduled run (E-017, B-019). |
| Accessibility | 3% | 70 | 2.10 | 155 screens measured; 0 counts over the ceiling: controls named, fields labelled, one main heading per screen, at three sizes. 17 hard-to-read texts and 3 small phone targets are held at a ceiling, not removed. No test with assistive technology or disabled users was made. |
| **Total** | 100% assessed | **75.6** |  | Weighted mean of the assessed categories |

## Reading it

- 75.6 of 100 describes a system whose built core is sound on test data and whose surroundings are not ready: approvals, live verification, alerting and unbuilt modules.
- Phase 11 scored the same categories for the stress phase only; this card is for the whole product at the end of the program and is lower where the whole product is weaker than the part that phase tested.
- The largest single drag is not a defect in code: it is that nothing has been confirmed on the live system or by the people who will use it.

## The directive's gates A to J (Universal Engineering Directive)

| Gate | Result | Evidence |
|---|---|---|
| A Requirements traced | PASS | Every section of the prompt maps to a document here; `ticket-traceability.md` |
| B Root cause | PASS | AA-001 to AA-006 and AA-011 fixed at the cause (the sign-in check, the input function, the route), not at the symptom |
| C Tests fail without the fix | PASS | 13 of 13 |
| D Regression | PASS | Full gate on RC-2. in the gate Phase 9 UI scenarios: 231 of 232 passed, 1 failed, 0 not applicable, 1093 checks; one scenario failed on timing in the test (AA-012); whole suite run again on the same build: Phase 9 UI scenarios: 231 of 232 passed, 1 failed, 0 not applicable, 1093 checks (the gate's failure passed; a different scenario failed because the rerun followed Phase 11's data, and passes in gate order). in the gate Phase 11 scenarios: 319 of 320 pass, 1383 checks; one scenario failed on timing in the test (AA-012); whole suite run again on the same build: Phase 11 scenarios: 320 of 320 pass, 1384 checks |
| E Security | PASS on QA | 11 of 11 scenarios pass |
| F Data integrity | PASS on QA | 6 of 6 scenarios pass |
| G Performance | NOT VERIFIED | No approved thresholds |
| H Observability | CONDITIONAL | Exists; reaches nobody on live |
| I Documentation | PASS | 24 documents; manual check |
| J Release readiness | FAIL | Blockers stand |

Readiness decision under the directive: **FAIL** for production, for the reasons in `phase-12-release-blockers.md`.
