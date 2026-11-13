# Module quality scorecard

Rubric and weights are in `enterprise-excellence-audit.md`. A module is scored only once its workstream has audited it; a score without an audit would be a guess.

## Platform infrastructure (Workstream 1)

User experience, operational efficiency and accessibility do not apply to the platform layer, so the remaining weights are rescaled to 100.

| Category | Before | After | Evidence |
|---|---:|---:|---|
| Functional correctness | 80 | 85 | 150 of 150 jobs before and after; job-list second path removed (E-002); invented analytics removed (E-006) |
| Data integrity | 60 | 75 | 0 to 8 value checks; reconciliation clean. Balance identity still code-only (E-020) |
| Reliability | 50 | 62 | Job list failed under 20 simultaneous requests, now passes. Clean exit and shutdown. No restore test, no staging (E-015) |
| Security | 72 | 80 | Sweep passes; vulnerable packages 19 to 3, none high. Rate limit still per instance (E-014) |
| Performance | 35 | 80 | 7 routes over target to 0; 104 MB reply to 1.2 MB. Operations cockpit still fails at volume (E-023) |
| Integration quality | 60 | 62 | 155 of 352 screen calls have no route (D-020), unchanged; reply shapes inconsistent (E-021) |
| Maintainability | 55 | 57 | 47 unit tests on every pull request; no lint (E-016); large files (E-018) |
| Observability | 25 | 60 | Request id and log line added; no alerting (E-017) |
| **Weighted** | **59** | **73** | |

Target is 95. The platform layer is not there. The largest gaps are a tested restore, a staging environment, alerting, the shared rate limit and E-023.

## Other modules

| Module group | Workstream | Score |
|---|---|---|
| Sales and customer operations | 2 | Not yet audited |
| Inventory and purchasing | 3 | Not yet audited |
| Manufacturing and processing | 4 | Not yet audited |
| Logistics and financial operations | 5 | Not yet audited |
| Enterprise administration, reporting, navigation | 6 | Not yet audited |
