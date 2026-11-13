# Production risk register

Written by hand in Phase 1 (2026-11-13). It answers one question: what stands between this code and running about 80 branches on it. Each risk points at the findings behind it (`findings-register.md`). Nothing here was measured on the live system; the live database and the host were not touched.

Likelihood and impact are a judgement from the evidence named in the row. "Blocks go-live" means the product should not carry real work for more than one branch until the risk is closed or the owner accepts it in writing.

## Overall position

**Not ready for production across branches.** The order-to-cash core (quote, order, reserve, job, ship, invoice, payment, return) is tested in depth and behaves correctly on the local test database. Around it: 58 of 143 screens are labelled samples, there is no server-side branch boundary, two modules keep their own copy of stock and orders, nothing runs on a schedule, and most changing routes outside the core have no test that makes them succeed.

## Risks

| # | Risk | Evidence | Likelihood | Impact | Blocks go-live | What closes it | Owner of the next step |
|---|---|---|---|---|:-:|---|---|
| R-01 | A user at one branch reads or changes another branch's orders, stock, jobs, shipments and invoices | B-003, E-019. Probe section 4: a login whose home branch is one branch read another branch's stock, listed the orders of every branch and opened one by id. A change at another branch was not proven by the probe (its one attempt was refused for its input, not for the branch); the code has no branch check on any staff write. `UserLocation` and `UserDivision` have no rows | Certain once more than one branch uses it | High: wrong stock moved, wrong order changed, customer and price data visible company-wide | Yes | The owner's rule for branch, division and region access; then enforcement in the access gate with a test per record type | Owner decision, then the security and multi-location phase |
| R-02 | Staff in the wrong department change records in 16 areas that have no department rule | B-004. `lib/roleAccess.js` rules cover the core records only | Likely | Medium to high, depending on the area (users and settings are manager-only already) | Yes | The owner names the department for each area; rules and probe checks are added | Owner decision |
| R-03 | Two stock lists and two order pipelines disagree | B-009, I-012, S-021. The second stock list and the order hub keep whole records as JSON with no database rule | Certain if both are used | High: stock that exists in one list and not the other; orders that never reach shipping or invoicing | Yes | The open decision "Choose which stock list is the real one", and the same for the order hub; then remove or connect the other | Owner decision, then Phase 2 |
| R-04 | Staff rely on a screen that is a sample | X-001, X-002, X-009, I-011, M-011. 58 screens, all labelled since Workstream 6 | Likely | High for safety, quality and supplier records: nothing is saved | Yes for each module the business needs | Per module: build it or take it off the menu | Owner decision |
| R-05 | Customers are shown promise dates, cut-off times and branch suggestions that are invented in the browser | X-007, S-010 | Certain on the web store and order entry | Medium to high: promises the business did not make | Yes for the web store | The owner's rules, moved to the server and saved | Owner decision |
| R-06 | Nothing happens without a person: no reminders, no overdue notices, no retries, no scheduled reports | B-019, B-018. No scheduler, queue or email provider in the code | Certain | Medium: late quotes, unpaid invoices and failed partner messages go unnoticed | No for a first branch; yes for 80 | A scheduled trigger on the host and an email or text provider | Owner (host settings are the owner's) |
| R-07 | A defect outside order-to-cash reaches users because no test would catch it | B-016. 72 of 319 changing routes return a success in any test; database-backed suites do not run on pull requests | Likely | Medium to high by module | No, but it raises every other risk | Success-path tests per module; the simulation in the pull-request workflow against a disposable database | Each phase for its area; testing phase |
| R-08 | Stock on the books drifts from the floor | I-016 (no count, adjustment or scrap on the real stock list), M-016 (completing a work order moves no stock), remnants are never created | Certain over time | High: selling stock that is not there | Yes | The owner's rules for adjustment and for what processing consumes and produces | Owner decision, inventory and manufacturing phases |
| R-09 | Material is bought with no record | I-007: no purchase order, vendor or expected receipt | Certain | Medium: receipts cannot be matched to what was ordered | Owner's call | Build purchasing or state that it stays outside the system | Owner decision |
| R-10 | A half-finished save leaves records that disagree | B-010: 16 handlers make several saves with no transaction, including starting and completing shop operations | Possible under failure or simultaneous use | Medium | No | Wrap each in one transaction, with a failure test | Phase 2 |
| R-11 | Data loss with no proven way back | E-015: no restore has been tested; no staging database | Unlikely in any week, serious when it happens | Very high | Yes | One restore of a backup into a copy, timed and written down | Owner (Supabase is the owner's) |
| R-12 | A known vulnerability in an installed package is used | E-011: backend 8 advisories (1 critical, 4 high), frontend 11 (4 high) at the last audit. Not re-run in Phase 1 | Possible | High | Yes for the critical and high ones | Upgrade with the gates rerun; the owner approves major-version changes | Phase 2 |
| R-13 | Request limits do not hold on the host | E-014: the limit is counted per function instance | Likely under attack | Medium | No | A shared counter or the host's firewall rule | Phase 2 or owner (host) |
| R-14 | Slow or failing screens at 80-branch volume | B-012 (58 lists with no limit), E-023, 96 of 158 tables empty in the test data so most lists were never seen full | Likely as data grows | Medium | No for a first branch | Paging on the 58 lists; a volume test with a stated environment | Performance phase |
| R-15 | Four database updates are waiting | The SQL Editor files from Workstreams 1 to 5 (`src/backend/prisma/upgrades/sql-editor/`) have not been applied to the live database. Phase 1 added none | Certain if the code is merged first | High: the merged code expects them | Yes, before merge | The owner applies them in order; each was run twice on a copy | Owner |
| R-16 | Card payments and receipts | D-033, D-034: no card processor, no email. An approval code is typed by hand | Certain at the counter | Medium | Owner's call | A processor and an email provider, or a written statement that they stay manual | Owner decision |
| R-17 | Uploaded files may be readable without signing in | B-021: `/uploads` is served before the sign-in gate in the local server. NOT VERIFIED on the host, where files are in the database | Unknown | Medium | No until verified | A probe check on both paths | Security phase |
| R-18 | Nobody is told when the system fails | E-017: one log line per request, no alerting, no error tracker | Certain | Medium | No for a pilot | Alerts on server errors and failed sign-ins on the host | Observability phase, owner (host) |
| R-19 | Staff with disabilities, tablets on the floor | B-015: 301 icon buttons, 32 with a label; no keyboard, screen-reader or tablet check has been run | Certain for some users | Medium | No | The user-experience phase (Phase 9) | Phase 9 |
| R-20 | Staff trained from a manual that describes sample screens as working | X-010, M-018 | Likely | Low to medium | No | The manual read against each screen after the build-or-remove decisions | After R-04 |

## What is not a risk today, with the evidence

- Sign-in is required on every one of 611 routes and a customer login reaches only its own account (sweep, 20 of 20 sections, this session).
- A view-only role cannot change anything, on either address of the API (baseline probe, 542 calls, this session). This was a defect at the start of Phase 1 and is fixed.
- Overselling, double shipping, double invoicing and paying more than the total are refused, including under simultaneous requests (simulation and race probes, this session).
- Stock can never go negative and its balance always adds up: the database refuses it.

## Conditions for a single-branch pilot

A pilot at one branch avoids R-01 by having no second branch, and is reasonable once: R-15 is done, R-11 has been tried once, the owner has decided R-03 (so only one stock list is in use), the sample modules the pilot branch does not need are off the menu (R-04), and the web store's promise dates are either real or hidden (R-05). That is a recommendation, not a decision made here.

## Rollback

Phase 1 changed no database structure and no data. Its code changes are five small server files and tests; reverting the Phase 1 commit restores the earlier behaviour (view-only roles able to change records, which is the defect). Pull request 30 is not merged, so nothing in it is live.
