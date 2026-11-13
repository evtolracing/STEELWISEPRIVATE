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
| Performance | 35 | 80 | 7 routes over target to 0; 104 MB reply to 1.2 MB. Operations cockpit answers in about 1 s at volume, was no reply (E-023) |
| Integration quality | 60 | 62 | 155 of 352 screen calls have no route (D-020), unchanged; reply shapes inconsistent (E-021) |
| Maintainability | 55 | 57 | 47 unit tests on every pull request; no lint (E-016); large files (E-018) |
| Observability | 25 | 60 | Request id and log line added; no alerting (E-017) |
| **Weighted** | **59** | **73** | |

Target is 95. The platform layer is not there. The largest gaps are a tested restore, a staging environment, alerting and the shared rate limit.

## Other modules

| Module group | Workstream | Score |
|---|---|---|
| Sales and customer operations | 2 | 73 (was 45), see below |
| Inventory and purchasing | 3 | Not yet audited |
| Manufacturing and processing | 4 | Not yet audited |
| Logistics and financial operations | 5 | Not yet audited |
| Enterprise administration, reporting, navigation | 6 | Not yet audited |

## Sales and customer operations (Workstream 2)

Covers customers, pricing, RFQs and quotes, order entry, Retail POS and counter sale, Sales Rep Mobile, Sales Dashboard, overrides and the online store's pricing.

| Category | Before | After | Evidence |
|---|---:|---:|---|
| Functional correctness | 40 | 80 | Placeholder counter price, tier prices, mobile orders, customer preferences save and the Pricing screen all repaired (S-001, S-002, S-005, S-014, S-017). Promise dates are still invented (S-010) |
| Data integrity | 40 | 82 | Order entry validated and transactional, tax saved, field allow-lists (S-006, S-007, S-016). 150 of 150 jobs, reconciliation 0 problems |
| Reliability | 50 | 65 | A failed edit no longer destroys order lines. No retry or offline behaviour on mobile; says so |
| Security | 55 | 82 | Server decides the price level; staff-only fields hidden from customer logins; tier, credit limit and list price need a manager and are audited (S-003, S-013, S-015, S-018). Cost still visible to sales roles (S-023) |
| Operational efficiency | 45 | 62 | One price everywhere removes re-keying. Quotes still priced by hand (S-027). Credit limits are now enforced with a manager release (rule 32) |
| User experience | 45 | 68 | Screens show the server's own error text; sample data removed from four screen groups. Branch list on entry screens still fixed (S-008) |
| Performance | Not measured | Not measured | New routes are counted or capped (200 rows). No benchmark of sales routes was run in this workstream |
| Integration quality | 40 | 60 | Overrides, dashboard, mobile and pricing now have routes. 18 sales calls still have none (S-026). No card, email or text service (D-033, D-034) |
| Maintainability | 45 | 70 | One pricing rule and one tax rule, pure and unit tested (55 tests). Two unused sales paths remain (S-021, S-022) |
| Observability | 40 | 65 | Audit entries for overrides, tier, credit limit, tax status and list price changes; request ids from Workstream 1 |
| Accessibility | Not measured | Not measured | New screens use labelled tables and controls. No keyboard or contrast audit was run |
| **Weighted** | **45** | **73** | Performance and accessibility left out and the other weights rescaled to 100 |

Target is 95. The module is not there. The largest gaps are the promise engine (S-010), quote pricing (S-027), outside services, and the fact that none of this is live.

