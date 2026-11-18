# Phase 11: integrations, events and background jobs

Date: 2026-11-18. Every figure here was measured in this session on one local machine (4 processors, 15.7 GB), against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only, the server copies connected as the least-privilege role `steelwise_runtime`, and a local stand-in for every outside service. Nothing was run against the live database, the host or any real partner, carrier, payment or accounting system. Anything not run is marked NOT VERIFIED.

The product has no separate queue service or worker process. Outgoing partner events wait in a database table and are sent by the request that made them and by the scheduled run (`POST /api/integrations/scheduled`), which any server copy may receive. "Queue" below means that table; "worker" means the scheduled run.

## The scheduled run during the day

| Cycle | Runs | Failed | Last answer |
|---|---:|---:|---:|
| 1 Baseline | 13 | 0 | 200 |
| 2 Correction | 10 | 0 | 200 |
| 3 Full Revalidation | 11 | 0 | 200 |
| 4 Failure and Recovery | 12 | 0 | 200 |
| 5 Final Certification | 12 | 0 | 200 |

## Scenarios

From the final run on a rebuilt database (`qa/results/phase11-scenarios.json`).

| Scenario | Result | Checks |
|---|---|---:|
| Large processing branch QA-L50: a sale sends the customer's partner its shipment and invoice events once each, signed | pass | 6 |
| Large processing branch QA-L50: the partner's address is down, comes back, and three scheduled runs at the same moment send the event once | pass | 4 |
| Large processing branch QA-L50: one payment is sent five times at the same moment with one request key | pass | 7 |
| Large processing branch QA-L50: a web order is submitted four times at the same moment with one request key | pass | 3 |
| Large processing branch QA-L50: the customer's partner reads its orders thirty times at once and sees only its own | pass | 3 |
| Medium service center QA-L42: a sale sends the customer's partner its shipment and invoice events once each, signed | pass | 6 |
| Medium service center QA-L42: the partner's address is down, comes back, and three scheduled runs at the same moment send the event once | pass | 4 |
| Medium service center QA-L42: one payment is sent five times at the same moment with one request key | pass | 7 |
| Medium service center QA-L42: a web order is submitted four times at the same moment with one request key | pass | 3 |
| Medium service center QA-L42: the customer's partner reads its orders thirty times at once and sees only its own | pass | 3 |
| Small distribution branch QA-L45: a sale sends the customer's partner its shipment and invoice events once each, signed | pass | 6 |
| Small distribution branch QA-L45: the partner's address is down, comes back, and three scheduled runs at the same moment send the event once | pass | 4 |
| Small distribution branch QA-L45: one payment is sent five times at the same moment with one request key | pass | 7 |
| Small distribution branch QA-L45: a web order is submitted four times at the same moment with one request key | pass | 3 |
| Small distribution branch QA-L45: the customer's partner reads its orders thirty times at once and sees only its own | pass | 3 |
| Warehouse-heavy branch QA-L37: a sale sends the customer's partner its shipment and invoice events once each, signed | pass | 6 |
| Warehouse-heavy branch QA-L37: the partner's address is down, comes back, and three scheduled runs at the same moment send the event once | pass | 4 |
| Warehouse-heavy branch QA-L37: one payment is sent five times at the same moment with one request key | pass | 7 |
| Warehouse-heavy branch QA-L37: one transfer is sent four times at the same moment with one request key | pass | 4 |
| Warehouse-heavy branch QA-L37: the customer's partner reads its orders thirty times at once and sees only its own | pass | 3 |
| Sales-focused branch QA-L48: a sale sends the customer's partner its shipment and invoice events once each, signed | pass | 6 |
| Sales-focused branch QA-L48: the partner's address is down, comes back, and three scheduled runs at the same moment send the event once | pass | 4 |
| Sales-focused branch QA-L48: one payment is sent five times at the same moment with one request key | pass | 7 |
| Sales-focused branch QA-L48: a web order is submitted four times at the same moment with one request key | pass | 3 |
| Sales-focused branch QA-L48: the customer's partner reads its orders thirty times at once and sees only its own | pass | 3 |
| The scheduled run needs its secret on every server copy | pass | 2 |
| Six scheduled runs start at the same moment on different server copies | pass | 3 |
| An event that can never be delivered is kept as failed after five attempts, raises an alert, and is sent when an administrator replays it | pass | 6 |
| An older event that arrives after a newer one can be put in order by the partner | pass | 4 |
| An event whose answer was lost is sent again with the same id, so the partner can drop the copy | pass | 5 |
| A partner address that answers slowly does not slow the dock | pass | 3 |
| A backlog of thirty waiting events is cleared once the partner is back, each sent once | pass | 4 |
| With the alert channel down an alert is still stored and nobody's work is affected | pass | 2 |
| With the AI service down nine people ask the assistant at once and the rest of the system is not disturbed | pass | 4 |
| With the AI service hanging the assistant gives up within its time limit and the server stays quick | pass | 3 |
| An accounting export under load calls no outside address | pass | 2 |
| A partner key that is revoked stops on every server copy at once | pass | 3 |
| A partner's request limit is one limit across all server copies | pass | 6 |
| After all of this the integrations report answers and holds no secret | pass | 3 |

## What these show

- **Once only across copies**: three and six scheduled runs started at the same moment on different copies send each waiting event once.
- **Backlog**: thirty waiting events are cleared once the partner is back, each sent once.
- **Poison event**: an event that can never be delivered is kept as failed after five attempts, raises an alert, and is sent when an administrator replays it.
- **Order**: an older event arriving after a newer one carries what the partner needs to put them in order.
- **Lost answer**: an event whose answer was lost is sent again with the same id.
- **Slow or dead outside services** do not slow the dock: the partner address, the AI service and the alert channel were each made slow or unavailable.
- **Request keys**: one payment sent five times, one web order four times, one transfer four times at the same moment, on different copies: one result each.

## Not verified

Real partners, carriers, payment processors, tax services and accounting products. Every outside party is a local stand-in. The host's scheduler (the product needs one to call the scheduled run; B-019) is the owner's and was not exercised.
