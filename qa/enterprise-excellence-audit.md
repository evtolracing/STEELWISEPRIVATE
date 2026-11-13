# Enterprise excellence audit (Phase 2)

Started 2026-11-13. This phase follows the functional audit in `operational-certification.md`. It looks for things that work but are below a professional standard, fixes the ones that are safe and well defined, and records the rest.

Everything here was measured on local test databases. Production was not touched. No formal compliance with any standard is claimed; the standards below are used as yardsticks only.

## Quality rubric

Each module is scored 0 to 100 in each category, then weighted.

| Score | Meaning |
|---|---|
| 0 to 39 | Fails a basic expectation in this category |
| 40 to 59 | Works, with major gaps |
| 60 to 79 | Sound, with known gaps that are written down |
| 80 to 94 | Strong, with evidence from tests or measurements |
| 95 to 100 | Strong and verified under production-like conditions |

| Category | Weight | What is looked at | Yardstick |
|---|---:|---|---|
| Functional correctness | 15% | Workflows complete and give the right result | ISO/IEC 25010 functional suitability |
| Data integrity | 15% | Constraints, transactions, reconciliation | ERP transaction practice, PostgreSQL constraints |
| Reliability | 12% | Behaviour under failure, retries, recovery | ISO/IEC 25010 reliability |
| Security | 12% | Sign-in, permissions, isolation, dependencies | OWASP ASVS, OWASP Top 10 |
| Operational efficiency | 10% | Steps, duplicate entry, automation | ISO 9001 process approach |
| User experience | 10% | Clarity, consistency, feedback | Enterprise UX practice |
| Performance | 8% | Response time and size at 80-branch volume | Target: list screens under 500 ms median |
| Integration quality | 6% | Screen-to-server contract, outside services | REST practice |
| Maintainability | 5% | Size, duplication, tests | ISO/IEC 25010 maintainability |
| Observability | 4% | Logs, tracing, health, alerts | SRE practice |
| Accessibility | 3% | Keyboard, contrast, labels | WCAG 2.2 AA |

A score never overrides a failed gate. Scores are a judgement backed by the evidence listed beside them, not a measurement.

## Workstreams and status

| # | Workstream | Status |
|---|---|---|
| 1 | Architecture and infrastructure | First batch done (this document). Open items in `engineering-quality-findings.md` |
| 2 | Sales and customer experience | Partially complete: 19 findings fixed (the credit hold, cost visibility and product writes were closed in Workstream 3), 8 open. `phase-reports/phase2-workstream2.md` |
| 3 | Inventory and purchasing | Partially complete: 13 findings fixed, 1 mitigated, 1 awaiting the owner's answer, 4 open. `phase-reports/phase2-workstream3.md` |
| 4 | Manufacturing execution | Not started |
| 5 | Shipping and financial operations | Not started |
| 6 | Enterprise experience | Not started |

## Workstream 1: what was done

Method: measure first, on a copy of the QA database scaled to 100,000 stock items, 72,000 orders, 72,000 jobs and 50,000 shipments (`qa/perf/scale-up.sql`), then fix, then measure again.

| Area | Found | Done |
|---|---|---|
| Unbounded lists | The job list returned every job ever made: 104 MB, 9.6 seconds. Twenty people opening it at once all failed. The staging list returned 18 MB | Capped. Job list is now 1.2 MB in 0.12 seconds; twenty at once finish in 1.4 seconds |
| Two code paths | The job list had a second path through another database client that ignored every filter and returned 100 bare rows | Removed. One path |
| Analytics | Two analytics routes loaded every order into memory (7.7 and 2.5 seconds). The margin route returned invented figures: a 70% cost assumption, a fixed customer name, fixed division margins | Counted in the database (23 ms each). Margin is reported as not available until cost is recorded |
| Indexes | 87 of 170 links between tables had no index | Added |
| Value checks | The database had no value checks at all | Eight added: stock quantities cannot go negative, order and shipment quantities must be positive, an invoice cannot be paid beyond its total |
| Tracing | No request id, no request log | Every request has an id (returned in a header and in every server-error reply) and one JSON log line with time taken. Slow requests are flagged |
| Startup and shutdown | The server loaded demo data into any empty non-local database at start. After an unexpected error it kept running. Shutdown did not close the database pool | Demo data only when asked for. Unexpected error exits cleanly. Pool closed on shutdown |
| Operations cockpit | Loaded every job, order, stock item and shipment on each call; no reply in 30 seconds at volume. Tested for statuses that do not exist | Loads open jobs and today only, counts the rest in the database; about 1 second with 13,000 open jobs. Reply proven identical on QA data apart from two corrected counts |
| Dependencies | 19 known vulnerabilities in installed packages (1 critical, 8 high) | 3 remain, all moderate, each needing a major version change |

Verification after the changes: 47 unit tests pass; three 50-job cycles (seeds 8001 to 8003) pass 150 of 150 with 2,107 API steps, 2,331 checks, 24 of 24 simultaneous-request probes and 0 reconciliation problems; security sweep passes all 11 sections; 123 screens open; frontend build passes.

## Checkpoint for the next session

- Branch `claude/project-thread-25z3jd`, pull request 30.
- Rebuild the QA database with `qa/tools/rebuild-qa-db.sh`. Build the scaled copy with `createdb -T steelwise_qa steelwise_qa_perf` then `PGOPTIONS="-c perf.copies=300" psql steelwise_qa_perf -f qa/perf/scale-up.sql`, start a server on it with `QA_DATABASE_URL=... PORT=3013 qa/tools/start-qa-server.sh`, and run `node qa/perf/bench.mjs`.
- Left in Workstream 1, all needing the owner: E-014 (shared rate limit), E-015 (restore test), E-016 (lint), E-017 (alerting). Workstreams 2 and 3 are reported in `phase-reports/`. Next: Workstream 4, Manufacturing Execution (continuation point in `phase-reports/phase2-workstream3.md`).
