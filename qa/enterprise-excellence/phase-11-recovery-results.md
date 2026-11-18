# Phase 11: recovery and idempotency results

Date: 2026-11-18. Every figure here was measured in this session on one local machine (4 processors, 15.7 GB), against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only, the server copies connected as the least-privilege role `steelwise_runtime`, and a local stand-in for every outside service. Nothing was run against the live database, the host or any real partner, carrier, payment or accounting system. Anything not run is marked NOT VERIFIED.

## Recovery after each kind of failure

| After | What the system does | What a person has to do | Verified by |
|---|---|---|---|
| A server copy killed | The front door stops sending to it within its health check and sends reads to another copy; a change in flight is answered "instance lost" and nothing is half saved | Send the change again. With a request key the repeat cannot run twice | group 7 kill scenarios; cycle 4 |
| A copy killed between dispatch and billing | The shipment is listed as shipped without an invoice at once, fails a check after 15 minutes and raises an alert | Bill the shipment from the list (one request) | cycle 4 (`recoveredByBillingAgain`); Y-021; Z-012 |
| Every copy down | Requests are answered 503 "no instance"; when the copies start, work continues; nothing was half saved | Nothing | group 7 "Every server copy is down at once, then all are started" |
| A polite stop (deployment) | The copy finishes what it has and leaves in under 3 s | Nothing | group 7; Z-008 |
| Database connections cut or used up | Requests are answered 503 DATABASE_BUSY with a time to retry; the pool reconnects by itself | Send again | group 7; Z-009, Z-011 |
| A lock held too long | The request waits, and past its limit is answered "busy, try again" (409) | Send again | group 7; Z-002, Z-005 |
| A lost answer (network) | With a request key the repeat gets the first answer back; nothing runs twice | Send again | group 7 network scenarios; Z-013 |
| Outside services down | Events wait and are sent later, once; the assistant says it is unavailable; alerts are stored; nobody's work is slowed | Nothing | group 6 |
| A posting that cannot be made | The business record is kept, the event is held by name with its reason, and posts once when the cause is removed | Finance removes the cause and retries the event | group 4 |
| Code deployed before its database update | Request limits fall back to counting per copy and the server says so once in its log; nothing fails | Apply update 18 | group 7 "The code is running before database update 18 is applied" |

## Idempotency (prompt section 29)

| Operation repeated | How | Result |
|---|---|---|
| Payment | Five times at the same moment with one key; again after a lost answer; while its copy is killed | one payment |
| Web order | Four times at the same moment with one key; six orders resent after a network drop | one order each |
| Transfer | Four times at the same moment with one key; received while a copy is killed | one transfer, stock moved once |
| Dispatch | Sent again after a lost answer and after a late answer | the shipment leaves once with one invoice |
| Delivery confirmation | Three times at the same moment for each of six deliveries | confirmed once each |
| Journal post and reversal | Four requests at the same moment; an impatient second click on a late answer | posted once, reversed once |
| Period close | Four requests at the same moment | closed once |
| Scheduled run | Three and six at the same moment on different copies | each event sent once |
| Partner event | Sent again after its answer was lost | same id, so the partner can drop the copy |

All pass in the final run on a rebuilt database (`qa/results/phase11-scenarios.json`).

A request key that cannot be claimed now refuses the request (Z-013). A key claimed by a copy that died blocks the repeat for 60 seconds and then lets it run once (Z-014).

## The three runs of cycle 4

| Run | Jobs | Failed transactions | Answers of 500 | Shipments left without an invoice | What it showed |
|---|---:|---:|---:|---:|---|
| First | 544 of 545 | 1 | 1 | 0 | Z-011: a 500 on an order confirmation when the connections were cut |
| Second | 541 of 545 | 4 | 0 | 4 | The driver did not follow the recovery for a lost dispatch answer; corrected in the driver (Z-012 records the product side) |
| Final | 545 of 545 | 0 | 0 | 0 | Recovered and reconciled |
