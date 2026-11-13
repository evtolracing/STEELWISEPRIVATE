# Phase 4: event reliability and background work

## 1. What existed

There was no queue, no job runner and no scheduler (B-019). The only event code was the partner webhook service. Its state at the start of the phase:

- An event was raised only by a few partner routes. Nothing staff did raised one.
- The row was written after the business change, outside its transaction.
- A failed delivery was marked for retry; the retry was a timer in the memory of one server instance, lost on restart, and nothing resumed it (B-018).
- Nothing stopped the same event being recorded twice.

## 2. Was an outbox justified?

Yes, and it needed no new infrastructure. The requirement is that a business change and the fact that partners must be told are saved together, and that telling them survives a crash. The table `WebhookDelivery` already existed with a status, an attempt count and a next-try time. Writing the row inside the business transaction turns it into an outbox. A message broker would add a service to run and pay for, with nothing it could do here that the table cannot; it was not introduced.

## 3. How it works now

| Step | What happens | Where |
|---|---|---|
| Record | Inside the transaction that confirms an order, changes its status, dispatches, delivers or flags a shipment, or issues an invoice, one row per subscribed partner is written. If the transaction rolls back, so does the row | `recordBusinessEvent(tx, type, key, data, orgs)` |
| Identity | The event id is `evt_<type>:<key>`, where the key is the business fact (the shipment id for a dispatch). A unique rule on (subscription, event id) makes a second recording impossible | Migration `20261113230000_webhook_delivery_once` |
| First send | Right after the commit, without holding the request. One drain per server instance runs until nothing is due | `kick()` |
| Claim | A row is claimed by a conditional update that moves its due time two minutes ahead and counts the attempt. Only one caller's update matches | `deliverDue()` |
| Send | Eight at a time, each under the outside-call guard with a 10-second limit; redirects are not followed | `send()` |
| Success | Marked delivered with the status and time taken | `settle()` |
| Failure | Due again after 1, 5, 30 and 120 minutes. After five tries it is kept as FAILED (the dead-letter list) with the reason | `retryDelay()` |
| Poison | Five failed events in a row stop the subscription, with the reason; the partner or an administrator turns it back on | `settle()` |
| Stale | An event that has waited more than 72 hours is not sent on its own; it moves to the failed list (H-016) | `deliverDue()` |
| Replay | An administrator (Integrations screen) or the partner (its own API) sends a failed event again; recorded in the audit log | `replayDelivery()` |
| Schedule | `GET /api/internal/tasks/run` with the secret sends what is due, within a 20-second budget, and clears request keys older than 24 hours | `runTasks()` |

Guarantee: at least once. A receiver may see the same event twice (a send that succeeded but whose answer was lost is sent again) and recognises it by the event id, which is the same in the header and the body on every attempt. Order between events is not guaranteed; each carries `created_at` and the record's status, which is enough to put them in order (tested).

## 4. Events

| Event | Raised by | Told to | Key |
|---|---|---|---|
| `order.confirmed`, `order.status_changed` | Order confirmation or status change by staff | The customer's system | Order id and status |
| `shipment.dispatched` | Dispatch | The customer and the carrier | Shipment id |
| `shipment.delivered`, `shipment.exception` | Delivery or exception, by staff or by the carrier's report | The customer and the carrier | Shipment id |
| `order.delayed` | A carrier's delay report | The customer | Shipment id and report time |
| `invoice.issued` | Invoice creation | The customer | Invoice id |
| `rfq.received` | A request for quote from the customer's system | The customer | Request id |
| `webhook.test` | A partner's test ping | That subscription only | Random |

## 5. Tests (group "Event processing and background jobs", 13 scenarios, all pass)

| Scenario | Proves |
|---|---|
| an event is delivered once, signed, with the same id in the body and the header | The path end to end |
| a change that is refused leaves no event behind | Atomic with the business change |
| a failed delivery waits its turn and is not sent again before it is due | Backoff |
| an event that can never be delivered stops after five tries and is kept as failed | Bounded retries, dead letter, replay, who replayed |
| an event that waited for days is not sent on its own; a person can still send it | H-016 |
| forty orders confirmed in the same second: every event is sent, once, without waiting for the scheduled run | H-019 |
| five delivery runs at the same moment send each event once | Several instances or overlapping schedules |
| a delivery claimed by a server that stopped is picked up when its claim runs out | Crash recovery |
| the same business fact is recorded once per subscriber | The unique rule |
| a subscription that keeps failing is stopped, says why, and resumes when turned back on | Poison handling |
| the scheduled run needs its secret, does the periodic work and records that it ran | The scheduler address |
| events that arrive out of order can be put back in order by the receiver | Ordering |
| a slow partner address is given up on at the time limit and tried again later | Time limit |

## 6. Background work, in full

| Work | Exists | State |
|---|---|---|
| Sending and retrying partner events | Yes | Verified locally |
| Clearing old request keys | Yes, in the scheduled run | Verified locally |
| The schedule itself | No | B-019, BLOCKED: the owner sets `CRON_SECRET` and a cron entry on the host |
| Email, text, report generation, inventory sync, reminders, escalations | No such code | NOT APPLICABLE until built (H-015; owner decision 5) |

## 7. Limits, stated

- On a serverless host, work started after the response may be frozen when the response is sent. The row is already saved, so the event is not lost; it is sent by the next request's drain or by the scheduled run. This is why the schedule matters and is listed as a blocker.
- The first send is not delayed by a queue: a partner address that is slow costs nothing to the request that caused the event.
- A burst larger than the measurements in `phase-04-performance-results.md` was not tested.
