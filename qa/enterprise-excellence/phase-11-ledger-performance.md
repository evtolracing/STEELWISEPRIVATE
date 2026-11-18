# Phase 11: ledger performance

Date: 2026-11-18. Every figure here was measured in this session on one local machine (4 processors, 15.7 GB), against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only, the server copies connected as the least-privilege role `steelwise_runtime`, and a local stand-in for every outside service. Nothing was run against the live database, the host or any real partner, carrier, payment or accounting system. Anything not run is marked NOT VERIFIED.

The QA ledger is started with test accounts and a test approval. Every figure is test data; nothing was posted to any real books.

## Volume posted in one day (cycle 5)

- 2,687 posted journal entries, from 2,487 business events and 200 manual entries written by one finance person and posted by another.
- Ledger postings and reconciliation operations counted as transactions: 212 completed, 0 failed. Invoicing, payments and credits: 1,080 completed, 0 failed.
- Trial balance at the end of the day: debits 12074697.59, credits 12074697.59, balanced.

Every business event posts inside the same database save as the event itself, so posting has no latency of its own to measure: it is part of the time of the dispatch, the payment, the receipt. Those times:

| Operation | Requests | P50 | P95 | P99 | Max |
|---|---:|---:|---:|---:|---:|
| invoice opened | 480 | 20 ms | 41 ms | 58 ms | 90 ms |
| journal entry posted by a second person | 200 | 38 ms | 166 ms | 225 ms | 309 ms |
| journal entry written | 200 | 46 ms | 178 ms | 228 ms | 330 ms |
| payment taken | 480 | 64 ms | 161 ms | 251 ms | 361 ms |
| reconciliation run | 12 | 111 ms | 419 ms | 419 ms | 419 ms |
| refund paid | 60 | 60 ms | 136 ms | 368 ms | 368 ms |
| return received and credited | 60 | 390 ms | 816 ms | 897 ms | 897 ms |

## Posting throughput

- In the mixed day: 2,687 entries in 99.9 s of work, about 27 posted entries a second alongside everything else.
- Scenario "Forty manual entries are written and posted at the same moment", "Eighty branches each post an entry at the same moment", "One draft entry is posted by four requests at the same moment": pass (group 4), each entry posted once.
- Phase 9.5's 80-branch ledger load is rerun in the full gate after Phase 11's code: 16 of 16 checks; 1,120 entries from business events in 21.1 s, 2,000 manual entries in 12.9 s.

## Reconciliation and reports

- Reconciliation of the whole books during the day: 12 runs, P50 111 ms, P95 419 ms; at the end of the day 79 ms. Proposed limit 5,000 ms.
- Trial balance read by finance during the day: P95 61 ms; receivables P95 72 ms; revenue by branch P95 74 ms.

## Not measured

A year of entries. This is one day: 2,687 entries. Report and reconciliation times at hundreds of thousands of entries, and month-end at that size, are NOT VERIFIED (W-023, Phase 12).
