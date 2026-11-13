# Remaining risks

Ordered by how much they should worry you.

| Risk | Why it matters | What closes it |
|---|---|---|
| None of the Phase 1 or Phase 2 work is live | The hosted site still has the defects these fixes address | Run the four database updates, merge pull request 30, deploy |
| No tested restore | A database loss today has an unknown outcome | One restore test (E-015) |
| No staging environment | Every result here is from a local database, not production data | A staging copy, then rerun the cycles and the benchmark there |
| Rate limit is per server instance | The login throttle is weaker than configured on the hosted site | Shared store (E-014) |
| No alerting | Errors are found by users | Error tracking (E-017) |
| Most screens were opened, not operated | A form or button could be broken without a test noticing | Click-through tests exist for the sales screens (24 checks), the stock screens (22) and the shop screens (30); Workstreams 5 and 6 add the rest |
| Outside services not connected | Card, email and text steps are manual | Provider choices |
| Delivery promise dates are not computed | A customer can be shown a date at web checkout that no rule produced | Cutoff and capacity rules from the owner, then the promise engine (S-010) |
| Sample data still shown on some secondary screens | People may read invented figures as real | D-020, D-024, S-010, S-026, Workstreams 3 to 6 |
| Tax depends on rates being entered | A branch state with no rate charges no tax (the screen says so) | Enter every branch state's rate under Admin > Sales Tax Rates (D-035) |
| Workstreams 5 and 6 not yet audited | Operational, UX, accessibility and traceability quality is unmeasured | Continue the phase |
| No purchasing | Nothing records what was ordered from a supplier, so receipts and supplier invoices cannot be matched | Decision and build (I-007) |
| No stock adjustment or count | A wrong weight or a lost item cannot be corrected in the system | Decision on who may adjust, then build (I-016) |
| Supplier quality screens are samples | They are labelled, but the work they describe is not being recorded anywhere | Decision and build (I-011) |
| Stock pending inspection can be sold and shipped | Uninspected material could reach a customer | A rule from the owner (gate report, Workstream 3) |
| Accepted web orders carry no tax or total | Web orders understate what is owed and count low against a credit limit | Workstream 5 (I-018) |
| Production quality and BOM screens are samples | They are labelled, but in-process inspection, NCRs and SPC are not being recorded anywhere | Decision and build (M-011) |
| Completing a coil work order does not move stock | Stock is wrong after a work order unless corrected, and it cannot be corrected (I-016) | Decision on whether work orders stay beside jobs (M-016) |
| Much of the shop floor was not examined | Dispatch, planning, recipes, packaging, maintenance and capacity may hold defects like those found here | Listed in the scorecard; to be scheduled |
| Job history starts now | Moves made before this change show times only, with no name | None: the past was not recorded |
