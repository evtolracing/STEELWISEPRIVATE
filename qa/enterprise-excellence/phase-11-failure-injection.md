# Phase 11: failure injection

Date: 2026-11-18. Every figure here was measured in this session on one local machine (4 processors, 15.7 GB), against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only, the server copies connected as the least-privilege role `steelwise_runtime`, and a local stand-in for every outside service. Nothing was run against the live database, the host or any real partner, carrier, payment or accounting system. Anything not run is marked NOT VERIFIED.

Failures were injected two ways: one at a time in the scenarios of group 7 (and a few in groups 4 and 6), and six in a row during a whole enterprise day (cycle 4). Every failure is a real one on the local machine: processes are killed with kill -9, connections are terminated in the database, locks are really held by another session, the front door really cuts or delays connections.

## The twenty failures of prompt section 28

| # | Failure | How it was injected | Scenario | Result |
|---|---|---|---|---|
| 1 | Database timeout | The invoice counter held for 23 s, longer than a request may wait | The invoice numbers stay held for longer than a request may wait | pass (3 checks) |
| 2 | Connection exhaustion | All but six database connections taken by other sessions | Almost every database connection is taken by something else | pass (4 checks) |
| 3 | API restart | Every copy restarted in turn; every copy down at once | Every server copy is restarted in turn while forty-five sales go out | pass (3 checks) |
| 4 | Worker crash | kill -9 of a copy during dispatches, payments, postings, work orders, transfers | A server copy is killed in the middle of twenty dispatches | pass (8 checks) |
| 5 | Queue backlog | Thirty events waiting while the partner is down | A backlog of thirty waiting events is cleared once the partner is back, each sent once | pass (4 checks) |
| 6 | Provider outage | Partner address, AI service and alert channel all down | The partner address, the AI service and the alert channel are all down while twelve sales go out | pass (3 checks) |
| 7 | Network interruption | Connection cut 5 ms after each request leaves | The network drops after eight payments were sent, and the same payments are sent again | pass (4 checks) |
| 8 | Duplicate webhook | An event sent again with the same id | An event whose answer was lost is sent again with the same id, so the partner can drop the copy | pass (5 checks) |
| 9 | Out-of-order event | An older event after a newer one | An older event that arrives after a newer one can be put in order by the partner | pass (4 checks) |
| 10 | Concurrent reservation | Six orders for the same 1,000 lb, with a copy killed | Six orders reserve the same 1,000 lb at the same moment while a server copy is killed | pass (5 checks) |
| 11 | Concurrent shipment confirmation | Six deliveries each confirmed three times, with a copy killed | Six deliveries are each confirmed three times at the same moment while a server copy is killed | pass (4 checks) |
| 12 | Concurrent invoice generation | Twelve invoices numbered while a copy is killed | Twelve invoices are being numbered when a server copy is killed | pass (5 checks) |
| 13 | Concurrent ledger posting | Thirty entries posted by two people during a restart | Thirty entries are being posted by two people when a server copy is restarted | pass (4 checks) |
| 14 | Session expiration | A sign-in that has run out, alone and in the middle of a job | A sign-in runs out in the middle of a job and the job is finished after signing in again | pass (4 checks) |
| 15 | Failed deployment simulation | A copy with a wrong database address; code ahead of database update 18 | A deployment given a wrong database address reports that it is not ready | pass (5 checks) |
| 16 | Delayed response | Answers 2.5 s late; the client gives up after 1 s and sends again | Answers to dispatch arrive 2.5 seconds late; the dock gives up after one second and sends again | pass (3 checks) |
| 17 | Accounting export failure | Export made while a copy is killed; a rejected export | An accounting export is being made when a server copy is killed | pass (5 checks) |
| 18 | Posting failure | A posting rule loses its approval | A posting rule that loses its approval stops posting; the payment is kept, held by name, and posts once when approved | pass (12 checks) |
| 19 | Reconciliation discrepancy | A stock record changed outside the product | A stock record changed outside the product is named as a difference and is not adjusted away | pass (15 checks) |
| 20 | Recovery after restart | Every copy killed, then started; sixty sign-ins at once on cold copies | After every failure, every server copy is up, ready and serving | pass (4 checks) |

## During a whole day (cycle 4)

| Time | During | Fault | Came back |
|---|---:|---|---|
| 18:21:37 | 8 jobs in flight | copy 2 killed (kill -9) | yes |
| 18:21:44 | 8 jobs in flight | every database connection of the servers cut |  |
| 18:21:49 | 8 jobs in flight | copy 3 restarted politely | yes |
| 18:21:55 | 16 jobs in flight | invoice numbers held by another session for 2 s |  |
| 18:22:03 | 16 jobs in flight | every answer delayed 400 ms for 4 s |  |
| 18:22:12 | 32 jobs in flight | AI service and alert channel down for 8 s |  |

Result: 545 of 545 jobs completed and traced; 5,185 transactions completed, 0 failed, 20 resends, 9 completed after a resend; 2 shipments billed after their dispatch answer was lost. Answers: 200: 4,447, 201: 3,622, 409: 2, 502: 3, 503: 26. The books balance and reconcile clean. Every copy was up at the end (3 of 3).

## Every scenario of the failure group

From the final run on a rebuilt database (`qa/results/phase11-scenarios.json`); the same group also ran straight after the failure day of cycle 4: 36 of 36 (`qa/results/phase11-cycle-4-failure-scenarios.json`).

| Scenario | Result | Checks |
|---|---|---:|
| A server copy is killed in the middle of twenty dispatches | pass | 8 |
| People keep reading while a server copy is killed | pass | 2 |
| The front door takes a dead copy out and puts it back when it answers again | pass | 4 |
| A server copy is killed while twelve payments carrying request keys are being taken | pass | 3 |
| A server copy is killed while thirty journal entries are being posted | pass | 4 |
| A server copy is killed while six coil work orders are being completed | pass | 3 |
| A server copy is killed while eight transfers are being received | pass | 8 |
| A server copy is stopped politely (SIGTERM) while thirty payments arrive | pass | 4 |
| Every server copy is restarted in turn while forty-five sales go out | pass | 3 |
| Every server copy is down at once, then all are started | pass | 8 |
| The code is running before database update 18 is applied | pass | 3 |
| A deployment given a wrong database address reports that it is not ready | pass | 5 |
| Three requests pay one invoice in full while another session holds its row for two seconds | pass | 2 |
| Eight shipments are dispatched while the invoice numbers are held for three seconds | pass | 2 |
| The invoice numbers stay held for longer than a request may wait | pass | 3 |
| Almost every database connection is taken by something else | pass | 4 |
| Every database connection of the servers is cut while thirty requests are in flight | pass | 8 |
| The network drops after eight payments were sent, and the same payments are sent again | pass | 4 |
| The network drops after six dispatches were sent, and the dock sends them again | pass | 3 |
| The network drops after six orders were sent with request keys, and they are sent again | pass | 3 |
| Answers to dispatch arrive 2.5 seconds late; the dock gives up after one second and sends again | pass | 3 |
| Answers to posting arrive late and an impatient accountant clicks Post twice | pass | 2 |
| A sign-in that has run out is refused by every copy and changes nothing | pass | 5 |
| A sign-in runs out in the middle of a job and the job is finished after signing in again | pass | 4 |
| The partner address, the AI service and the alert channel are all down while twelve sales go out | pass | 3 |
| Six orders reserve the same 1,000 lb at the same moment while a server copy is killed | pass | 5 |
| Six deliveries are each confirmed three times at the same moment while a server copy is killed | pass | 4 |
| Twelve invoices are being numbered when a server copy is killed | pass | 5 |
| Thirty entries are being posted by two people when a server copy is restarted | pass | 4 |
| An accounting export is being made when a server copy is killed | pass | 5 |
| The books are being reconciled when a server copy is killed | pass | 8 |
| Every server copy is killed while the scheduled run is sending partner events | pass | 3 |
| After every failure, no business record was saved without its posting | pass | 3 |
| After every failure, the enterprise's records still hold their rules | pass | 13 |
| After every failure, every server copy is up, ready and serving | pass | 4 |
| Sixty people sign in at once right after every copy has restarted | pass | 3 |

## What the injections found

- Z-008: a politely stopped copy took about 6 s to leave. Fixed.
- Z-009: no database connection answered 500. Fixed (503 with a time to retry).
- Z-011: the same inside a transaction. Found by the first run of cycle 4. Fixed.
- Z-013: a keyed request ran without its key when the key could not be claimed, and one payment was taken twice. Found by the failure group after cycle 4. Fixed.
- Z-012: a repeated dispatch after a lost answer does not bill. Recorded, not changed.
- Z-014: a key claimed by a dead copy blocks its repeat for 60 s. Recorded, not changed.

## Not injected

A failure of the database server itself (the database stayed up; its connections were cut and exhausted), a failure of the host's network or region, disk full, and clock changes. NOT VERIFIED.
