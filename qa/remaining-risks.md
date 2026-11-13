# Remaining risks

Ordered by how much they should worry you.

| Risk | Why it matters | What closes it |
|---|---|---|
| None of the Phase 1 or Phase 2 work is live | The hosted site still has the defects these fixes address | Run the three database updates, merge pull request 30, deploy |
| No tested restore | A database loss today has an unknown outcome | One restore test (E-015) |
| No staging environment | Every result here is from a local database, not production data | A staging copy, then rerun the cycles and the benchmark there |
| Rate limit is per server instance | The login throttle is weaker than configured on the hosted site | Shared store (E-014) |
| No alerting | Errors are found by users | Error tracking (E-017) |
| Screens were opened, not operated | A form or button could be broken without a test noticing | Click-through tests in Workstreams 2 to 6 |
| Outside services not connected | Card, email and text steps are manual | Provider choices |
| Sample data still shown on some secondary screens | People may read invented figures as real | D-020, D-024, D-036, Workstream 6 |
| Workstreams 2 to 6 not yet audited | Operational, UX, accessibility and traceability quality is unmeasured | Continue the phase |
