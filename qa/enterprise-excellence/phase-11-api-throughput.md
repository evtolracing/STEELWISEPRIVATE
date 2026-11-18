# Phase 11: API and service throughput

Date: 2026-11-18. Every figure here was measured in this session on one local machine (4 processors, 15.7 GB), against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only, the server copies connected as the least-privilege role `steelwise_runtime`, and a local stand-in for every outside service. Nothing was run against the live database, the host or any real partner, carrier, payment or accounting system. Anything not run is marked NOT VERIFIED.

## The day, by cycle

| Cycle | Requests | Seconds of work | Requests per second overall | Peak in flight | By answer | Answered by each copy |
|---|---:|---:|---:|---:|---:|---:|
| 1 Baseline | 7,980 | 103.6 | 77 | 50 | 200: 4,320, 201: 3,620, 404: 40 | 2,657 / 2,660 / 2,663 |
| 2 Correction | 7,999 | 88.8 | 90 | 51 | 200: 4,377, 201: 3,622 | 2,665 / 2,667 / 2,667 |
| 3 Full Revalidation | 8,024 | 93 | 86.3 | 51 | 200: 4,404, 201: 3,620 | 2,677 / 2,675 / 2,672 |
| 4 Failure and Recovery | 8,100 | 99.8 | 81.2 | 50 | 200: 4,447, 201: 3,622, 409: 2, 502: 3, 503: 26 | 2,740 / 2,670 / 2,687 |
| 5 Final Certification | 8,063 | 99.9 | 80.7 | 50 | 200: 4,437, 201: 3,626 | 2,689 / 2,687 / 2,687 |

Cycle 1's 404 answers were the driver asking for a dashboard address that does not exist; the address was corrected in the driver before cycle 2. The 502 and 503 answers of cycle 4 are the injected failures (a killed copy, cut connections), each resent and completed.

## Throughput by level (cycle 5)

| Jobs in flight | Requests per second | Peak requests in flight | P50 | P95 | P99 |
|---|---:|---:|---:|---:|---:|
| 8 | 117.2 | 11 | 39 ms | 262 ms | 525 ms |
| 16 | 123.8 | 19 | 48 ms | 706 ms | 1,621 ms |
| 32 | 132.2 | 35 | 58 ms | 1,457 ms | 3,888 ms |
| 48 | 128.2 | 50 | 52 ms | 3,299 ms | 4,714 ms |

Proposed minimum: 40 requests a second. Measured at every level: above it.

## The same day on one, three and four server copies

| Server copies | Jobs completed | Failed transactions | Requests per second overall | All requests P95 at 48 in flight | Dispatch P50 | Dispatch P95 | Dispatch P99 | Rolled back |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 545 of 545 | 0 | 56 | 3,205 ms | 1,255 ms | 4,442 ms | 4,849 ms | 249 |
| 3 | 545 of 545 | 0 | 86.3 | 2,958 ms | 1,409 ms | 4,479 ms | 5,039 ms | 220 |
| 4 | 545 of 545 | 0 | 85.1 | 3,079 ms | 1,274 ms | 4,817 ms | 5,591 ms | 212 |

Reading: on this machine the number of server copies makes no difference to throughput or to the dispatch time. All copies share the same four processors with the database and the load generator, and the slowest step waits on the database, not on a server copy. What the several copies prove is correctness: the same results whichever copy answers. They do not prove that more copies give more capacity; that needs separate machines. NOT VERIFIED.

## Invoice writing alone

Dispatches only, nothing else running, 3 copies (`qa/results/phase11-invoice-capacity-3.json`):

| Dispatches in flight | Dispatches | Failed | Per second | P50 | P95 | P99 |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 60 | 0 | 10.8 | 90 ms | 110 ms | 146 ms |
| 4 | 60 | 0 | 28 | 135 ms | 173 ms | 206 ms |
| 16 | 60 | 0 | 24.5 | 499 ms | 1,258 ms | 1,491 ms |
| 48 | 60 | 0 | 21 | 1,722 ms | 2,622 ms | 2,861 ms |

Alone, an invoice takes about 90 ms and the ceiling is 21 to 28 a second. In the mixed day the same step shares the processors with everything else and is slower.

## Error rate

| Cycle | Requests | Answers of 500 | Answers of 502 or 503 | Failed business transactions |
|---|---:|---:|---:|---:|
| 1 Baseline | 7,980 | 0 | 0 | 0 |
| 2 Correction | 7,999 | 0 | 0 | 0 |
| 3 Full Revalidation | 8,024 | 0 | 0 | 0 |
| 4 Failure and Recovery | 8,100 | 0 | 29 | 0 |
| 5 Final Certification | 8,063 | 0 | 0 | 0 |
