# Phase 4: regression results

One full gate run on the final code, on a freshly rebuilt `steelwise_qa` (`qa/tools/run-gates.sh`, exit 0), 2026-11-13. Every figure below is from that run unless a line says otherwise. Nothing here was run against the live system.

| Suite | Result | End of Phase 3 |
|---|---|---|
| Order-to-cash simulation, seeds 8001 to 8003 | 150 of 150 jobs pass; reconciliation after each seed 0 problems (plus 52 in demo seed data) | 150 of 150 |
| Database consistency checks after the simulation | 0 problems outside the demo seed rows | The same |
| Security and safeguards sweep | 20 of 20 sections pass (559 routes tried with no token, 0 let in; 60 partner calls with no partner token, 0 let in) | 20 of 20 |
| Branch boundary | 37 of 37 | 37 of 37 |
| Phase 2 integrity and concurrency | 80 of 80 | 80 of 80 |
| Phase 3 database scenarios | 74 of 74 scenarios, 607 checks | 74 of 74 |
| **Phase 4 integration scenarios (new)** | **66 of 66 scenarios, 554 checks**: contracts 11 of 11; cross-module 10 of 10; events and background 13 of 13; webhooks and outside failures 11 of 11; idempotency and concurrency 10 of 10; security, isolation and recovery 11 of 11 | Did not exist |
| Database consistency checks after the scenarios | 0 problems outside the demo seed rows; orders with no branch 63 (62 at the end of Phase 3; G-018, already recorded) | The same checks |
| Schema inventory | 160 tables; one unique index and one index added by file 10; 0 failed migrations | 160 tables |
| Unit tests | 144 of 144 | 126 of 126 |
| Browser: experience, shipping, shop, sales, inventory | 22, 29, 30, 24, 22 checks, 0 failed | The same |
| **Browser: integration (new)** | **33 checks, 0 failed** | Did not exist |
| Every screen opens | No crash, including Integrations | No crash |
| Baseline probe | All sections pass; 278 write routes sent an empty body, 0 server errors | The same |
| Department rule coverage | 323 changing routes, 0 with no rule | 0 with no rule |
| Screen audit | 0 screens show made-up data with no notice | 0 |
| Lint | Frontend clean; whole repository 0 errors (1,529 warnings, none new of a kind that was an error) | 0 errors |
| Screen ratchets | 38 of ceiling 38; 0 of ceiling 0 | The same |
| Production build | Succeeds | Succeeds |

## Scenario count against the requirement

| Group | Required | Run | Pass |
|---|---:|---:|---:|
| Internal API contracts and validation | 10 | 11 | 11 |
| Cross-module workflow communication | 10 | 10 | 10 |
| Event processing and background jobs | 10 | 13 | 13 |
| Webhooks and external service failures | 10 | 11 | 11 |
| Idempotency, retries and concurrency | 10 | 10 | 10 |
| Security, isolation and recovery | 10 | 11 | 11 |
| **Total** | **60** | **66** | **66** |

Each scenario records its inputs, the expected and actual result and each check in `qa/results/phase4-integration.json`.

## A check that fails without each fix

| Fix | Check | Seen failing |
|---|---|---|
| Partner API (H-001) | The partner scenarios | First run of the suite: 500 on nearly every partner route |
| Durable events (H-002), cross-partner keys (H-003), dropped connection (H-004), outside-call limits (H-005), silent missing invoice (H-006), sign-in disclosure and revocation (H-007) | Their scenarios | Each written against the code before and seen to fail, then fixed |
| Webhook address and signature rules (H-008), list window (H-010), outside-call guard | `test/webhookRules.test.js`, `test/listing.test.js`, `test/outbound.test.js` | The functions did not exist |
| Screens (H-009) | `qa/sim/ui-integration.cjs` | With the four changed files reverted: 7 of 33 fail |
| Stale events (H-016) | "an event that waited for days…" | The age limit did not exist |
| Database refusal (H-017) | `test/safeErrors.test.js`; "a change the database itself refuses…" | Probe before: `POST /api/users` with a missing branch answered 500 |
| Forward trace (H-018) | Three checks in "a work order feeds an order line…" | Gate run on the code before: 63 of 64, this scenario failing |
| Burst of events (H-019) | "forty orders confirmed in the same second…" | Load measurement before: 12 of 160 sent. The scenario itself was written after the fix and not re-run on the old code |
| Order summary speed | `qa/perf/phase4-load.mjs` | First run: slower than the full list |

## Server errors during the run

All deliberate: 502, 503 and 504 from the provider-failure scenarios; 501 from routes that state they are not built; one 500 on `POST /api/invoices` while billing was made to fail on purpose for one order. No other 5xx in 2,165 distinct calls.

## Not run

| Subject | Status |
|---|---|
| Anything on the host or the live database | NOT VERIFIED |
| Real AI and speech providers | NOT EXECUTED |
| Payment, carrier, email, text, tax, accounting | NOT EXECUTED: not connected |
| The GitHub workflow for the final commit | NOT VERIFIED at the time of writing; see pull request 31 |
| Test coverage by line | Not measured; reach is counted by route: 328 of 618 routes and 109 of 323 changing routes have a success in a test |
