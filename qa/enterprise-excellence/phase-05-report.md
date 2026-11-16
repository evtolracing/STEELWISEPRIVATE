# Phase 5 of 12: final execution report

**Customer lifecycle, CRM, quoting, product configuration, order intake, POS, ecommerce, customer portal and revenue operations hardening**

Date: 2026-11-15. Branch `claude/project-thread-25z3jd`, on top of the Phase 4 work at `fce9593`. Pull request 31 carries Phases 3, 4 and 5; it is not merged.

All testing ran on local databases: `steelwise_qa` for function and `steelwise_qa_scale3` (85 branches) for volume. Nothing touched the live database or the host. No real payment, customer message or provider call was made. A statement here that a test passed means it was run in this session.

## FINAL STATUS

**PARTIALLY COMPLETE**

Reasons, stated exactly:

1. **Payment at web checkout is not built**, so its scenarios are NOT APPLICABLE until the owner answers H-013. Gate F is PARTIAL for this reason alone.
2. **Business rules that are the owner's are still open**: six customer preference fields (J-008, including the default discount S-020), pricing of quote lines from the catalog (S-027), promise dates and cut-offs (S-010, X-007), and the tax estimate shown in the web shop (F-008). Each is stated, labelled on screen where it could mislead, and not invented.
3. **Some handoff items were moved, with reasons**: the stale-edit warning on the order entry screen (G-020) and the order entry selects' accessible names (J-013) to Phase 9; shelf receiving by the piece (C-011) and remnant selection at the counter (J-012) to Phase 6.
4. **Nothing was verified on the host or against live data.**
5. **SQL Editor file 11** waits for the owner, with files 6 to 10.

Every confirmed P0 or P1 sales defect found in this phase is VERIFIED FIXED with an automated check that fails without the fix: J-001, J-006, J-007. Thirteen findings were recorded (J-001 to J-013); all are dispositioned. Seventeen earlier findings were dispositioned in this phase.

---

## SALES OPERATIONS DISCOVERY

| Item | Result |
|---|---|
| Method | Code read of every sales route and screen; probes on the QA database; 76 scenarios; browser checks |
| Sales channels | Order entry (phone, walk-in, mobile rep, Retail POS), quote acceptance, web shop acceptance, counter quick sale, partner API. The counter session flow no longer creates orders (S-022); the Order Hub is retired (S-021) |
| Customer-to-cash map | `phase-05-quote-order-traceability.md` §1, with alternative paths |
| Workflow matrix | Updated (`workflow-matrix.md`, Phase 5 update) |
| Documents | `phase-05-customer-data-audit.md`, `-crm-review.md`, `-product-configuration.md`, `-pricing-audit.md`, `-quote-order-traceability.md`, `-pos-review.md`, `-ecommerce-review.md`, `-customer-portal-review.md`, `-ux-efficiency.md`, `-regression-results.md`, `-quality-scorecard.md` |

### Disposition of the Phase 4 handoff

| # | Subject | Disposition |
|---|---|---|
| 1 | Customer data | Closed accounts refused everywhere and audited (J-002); loops refused (J-003); discount and five more fields labelled not applied (J-008, owner decision); new orders get a branch on every path (G-018 reduced) |
| 2 | CRM | No CRM exists and none was invented; pipeline figures corrected (J-004); rep screens read real branches |
| 3 | Quote to order | Requirements, tax and branch carried (J-001); one console (S-021 retired); S-027 still the owner's |
| 4 | Pricing contract | Screen calls to missing routes removed (S-026); 15 pricing scenarios; sweep green |
| 5 | POS | One counter payment flow; session submit closed (S-022); voids cancelled (G-009); Retail POS branch (J-006); C-011 to Phase 6; X-008 unchanged |
| 6 | Ecommerce | Acceptance fixed (J-005, J-010); buyer told of price changes; F-008, S-010, X-007 the owner's |
| 7 | Customer portal | Isolation proven in group 6 and the sweep |
| 8 | Payment | H-013, H-015, D-033: the owner's; nothing simulated as if a processor existed |
| 9 | Duplicate orders | Empty orders rule (H-011); races, retries and lost answers tested on every channel: one record each |
| 10 | Notifications | Decision 5 (later); unchanged |
| 11 | Sales efficiency | Branch lists from the server (S-008, U-011, C-012); G-014 closed (no screen lists /api/orders); G-020 to Phase 9 |

---

## DEFECTS AND CORRECTIONS

| ID | Sev | Defect | Correction | Status |
|---|---|---|---|---|
| J-001 | P1 | Requirements, tax and branch lost from request to order | `lib/lineSpecs.js`; quotes taxed by rule 27; acceptance carries tax and the request's branch | VERIFIED FIXED |
| J-006 | P1 | Retail POS taxed every sale in Jackson, Michigan | Branches from the server; the server refuses another branch | VERIFIED FIXED |
| J-007 | P1 | Home page showed invented orders, alerts and figures | Reads `/api/dashboard` | VERIFIED FIXED |
| J-002 | P2 | Closed accounts took new business | Refused in every channel; close and reopen audited | VERIFIED FIXED |
| J-004 | P2 | Expired quotes counted as open; Expired filter empty; values with tax | Expiry by date in lists and dashboard; values before tax | VERIFIED FIXED |
| J-005 | P2 | Web order taxed at one branch, filed at another; per-piece lines as CWT | One branch; EACH lines | VERIFIED FIXED |
| J-009 | P2 | Work orders got only a description | Requirements in instructions and notes | VERIFIED FIXED |
| J-010 | P2 | Web order with no customer became a sales order | Customer required at acceptance; inbox shows the reason | VERIFIED FIXED |
| J-008 | P2 | Six preference fields saved and applied nowhere | Labelled on screen | REQUIRES BUSINESS DECISION |
| J-003 | P3 | Account under its own division | Refused | VERIFIED FIXED |
| J-011 | P3 | Price check priced negative amounts | Refused | VERIFIED FIXED |
| J-012 | P3 | Counter remnant location free text | Default removed; selection from stock in Phase 6 | DEFERRED TO SPECIFIC PHASE |
| J-013 | P3 | Order entry selects have no accessible name | Phase 9 | DEFERRED TO SPECIFIC PHASE |

Earlier findings closed in this phase: S-008, U-011, C-012, S-021, U-002, S-026, S-022, G-009, H-011, G-014. Notes added to S-020, U-012, F-008, G-018, H-013, B-009. G-020 moved to Phase 9 with all seven deferral fields.

Database change: one data-only migration, `20261115090000_voided_counter_sales_cancelled` (SQL Editor file 11), tested twice on a copy of the 85-branch database (903 voided sales left COMPLETE before, 0 after; the second run skipped). No schema change.

---

## OPERATIONAL EFFICIENCY

See `phase-05-ux-efficiency.md`. In short: requirements typed once at the request reach the shop floor; branch lists come from the server and start at the home branch; Retail POS needs no tax correction; the home page shows real work; one request console; the web inbox and checkout say why. No minutes-saved figure is claimed: none was measured with users.

---

## VERIFICATION

| Test | Result |
|---|---|
| Phase 5 sales scenarios (`qa/sim/phase5-sales.mjs`, new) | 76 of 76, 386 checks, in seven groups at or above the prompt's minimums (10, 15, 15, 10, 11, 10, 5). In the second full gate run one check failed on a test-code error; corrected and re-run on the same database |
| Phase 5 browser checks (`qa/sim/ui-phase5.cjs`, new) | 14 of 14 |
| Unit tests | 149 of 149 (5 new) |
| Sales screens at 85 branches (`qa/perf/branch-bench.mjs --set sales`, with 18,000 more requests and quotes) | Every screen within 67 ms at the 95th percentile for an all-branch login, 48 ms for a branch login; 40 at once: 0 failed |
| Every earlier suite | See `phase-05-regression-results.md` |

Not executed: payment scenarios (H-013), host behaviour, live data.

---

## PRODUCTION READINESS

Not ready for multi-branch production; see `production-risk-register.md` (Phase 5 update). Sales operations are materially safer: tax and branch are now right on every sales path, requirements reach the floor, and no channel takes orders for closed accounts or with no customer. Before the owner merges pull request 31: apply SQL Editor files 6 to 11 in order.

Questions for the owner:

1. **Customer preferences (J-008, S-020)**: which of the six should take effect, and does a default discount apply on top of the contract tier, instead of it, or only with no tier?
2. **Empty orders (H-011)**: implemented as "a draft may be empty; it cannot go further without a line". Confirm or change.
3. **Card at web checkout (H-013)** and **which outside services first (H-015)**: still open from Phase 4.

---

## PHASE 6 HANDOFF

**Phase 6 of 12: inventory, purchasing, receiving, reservations, replenishment, material traceability, remnants, scrap and interbranch transfer excellence.** Not started.

| # | Subject | Findings | Tests required |
|---|---|---|---|
| 1 | Shelf items received and counted by the piece; stock shown and checked at web checkout | C-011 | A piece item received, sold at the counter and on the web, and voided, with balances checked |
| 2 | Remnants picked from stock at the counter | J-012 | A remnant sold and voided moves the stock item once |
| 3 | The second stock list and its JSON store | B-009 | Connect or retire, with the live contents read first |
| 4 | Transfers with an in-transit stage and a receipt | G-007 | Transfer out, in transit, received; balances at both branches |
| 5 | Purchasing: requisition, purchase order, vendor, approval | I-007 | Procure to stock end to end |
| 6 | Stock search and job counts that grow with the company | G-013 | Timings at 85 branches |

What Phase 5 leaves ready: `lib/lineSpecs.js` (requirements on a line, usable for purchase lines), `sellingBranch()` and `/api/orders/intake/branches`, `qa/sim/phase5-sales.mjs` building blocks (`shelf()`, `customer()`, `customerLogin()`).

**Phase 6 has not been started.**
