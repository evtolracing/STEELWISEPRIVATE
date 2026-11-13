# Phase 4: idempotency, retry, time limit and concurrency review

## 1. The rule

A request that changes the business may be sent more than once: a double click, a retry after a lost connection, a partner's automatic retry, a carrier reporting the same thing twice. Each must take effect once. Two mechanisms carry this:

1. **Request keys** (`middleware/requestKeys.js`, table `RequestKey`): a caller sends `Idempotency-Key`. The first request claims the key, runs, and stores its answer. A repeat with the same body gets that answer back, marked `Idempotent-Replayed: true`. The same key with a different body is refused (422). A repeat while the first is still running is refused (409). A claim whose server died is taken over once after 60 seconds. Stored answers are cleared after 24 hours.
2. **State checks in the step itself**: a conditional update ("dispatch this shipment if it is still loading") or a row lock, so that a second attempt without a key is a refusal (409) or a no-op, never a second effect.

## 2. Defects found in the mechanism and corrected

| Finding | Defect | Evidence before | Now |
|---|---|---|---|
| H-003 | All partner calls shared one key scope, so partner B could be answered with partner A's stored reply | Scenario on the code before | Keys are scoped to the partner; the middleware runs after partner sign-in |
| H-004 | A dropped connection released the key while the handler was still running; the retry created a second order | Scenario on the code before: two orders | The key is held until the handler finishes; the retry gets the first answer |
| H-009 | Dispatch, delivery and work order completion are sent with PUT and carried no key from the screens | Code read | The screens send a key on those steps |

## 3. Every critical operation

| Operation | Route | Request key from the screen | Second attempt without a key | Tested by |
|---|---|:-:|---|---|
| Create an order | `POST /api/orders` | Yes | A second order (so the key matters) | "the answer is lost after the server saved…"; Phase 3 |
| Web checkout | `POST /api/ecom/checkout/:id` | Yes | The cart is already converted: refused | Phase 3; `ui-shop` |
| Counter sale | `POST /api/pos/quick-sale/process-payment` | Yes (added) | A second sale | "a counter sale … and a repeat is the same sale" |
| Accept a quote | `POST /api/quotes/:id/accept`, partner `…/respond` | Yes | 409: already accepted | "a quote accepted by the customer and the sales desk at the same moment makes one order" |
| Reserve stock | `POST /api/orders/:id/allocate` | Yes | Refused above the line quantity | Phase 3 (6 rounds) |
| Receive material | `POST /api/inventory/receipts` | Yes | 409: item number in use | "receiving, transfers, credits and work order completion are each done once when sent twice" |
| Transfer | `POST /api/coils/:id/transfer` | Yes | Refused: already at the branch | Same |
| Complete a work order | `PUT /api/work-orders/:id/complete` | Yes (added) | 409: already complete | Same |
| Create a shipment | `POST /api/shipments` | Yes | Refused above what is left to ship | `ui-integration` "double click", "answer lost after saving" |
| Dispatch | `PUT /api/shipments/:id/dispatch` | Yes (added) | 409: already dispatched | "a shipment dispatched from two screens at once leaves once" |
| Deliver | `PUT /api/shipments/:id/deliver` | Yes (added) | 409, or recognised as the same delivery | `ui-integration` "answer lost after saving (delivery)" |
| Carrier report | Partner `POST /carrier/shipments/:id/status`, `/pod` | Partner's choice | 200 `duplicate: true`; a late older status is 409 | "a carrier reports delivered twice, and again late…" |
| Create an invoice | `POST /api/invoices`, and at dispatch | Yes | One invoice per shipment (unique rule) | Phase 3 |
| Take a payment | `POST /api/invoices/:id/payments` | Yes | 409 above the balance | "ten copies of one payment at the same moment record one payment" |
| Credit or refund | `POST /api/invoices/:id/credit`, `/refund` | Yes | 409 above what was paid | Phase 3 |
| Receive a return | `POST /api/returns/:id/receive` | Yes | 409: already received | Phase 3 |
| Purchase order | `POST /api/orders` with type PO | Yes | A second order | "a purchase order and a sales order created with a key are each created once" |
| Acknowledge a purchase order | Partner `POST /supplier/purchase-orders/:id/acknowledge` | Partner's choice | 200, unchanged | "a supplier reads and acknowledges…" |
| Record an event for partners | Inside the business transaction | n/a | Unique rule on (subscription, event) | "the same business fact is recorded once per subscriber" |
| Deliver an event | `deliverDue` | n/a | Claimed by one caller | "five delivery runs at the same moment…" |
| Replay a failed event | `POST /api/admin/integrations/deliveries/:id/replay` | Yes | 409 once delivered | "an event that can never be delivered…" |
| Send an email, a text, a card charge, a label | Not connected | n/a | n/a | NOT APPLICABLE (H-015) |

## 4. Retries

| Who retries | What | Bound | Wait |
|---|---|---|---|
| The server, to an AI provider | Only no answer, 408, 429, 5xx | 2 tries | 0.25 to 0.5 s, with jitter |
| The server, to the speech provider | Never | 1 try | — |
| The server, to a partner address | Any failure | 5 tries | 1, 5, 30, 120 minutes |
| The outside-call guard, whatever the caller asks | — | Never more than 5 tries | Capped at 4 s between tries |
| The browser | Never on its own | — | The person presses again; the same key is sent |
| The database client | Never | — | — |

A 4xx from a provider is never retried: it is an answer. No retry is made on an operation that is not marked as safe to repeat. There is no retry loop without a bound: a search of `src/backend/src` for `while (true)` and `for (;;)` finds one loop, the delivery worker, which ends when the rows of its run are used up; the guard's own loop is bounded by its try count, and the drain by 40 passes.

## 5. Time limits

| Call | Limit | Setting |
|---|---|---|
| Browser to server | 60 s (uploads, streams and read-aloud excluded) | `REQUEST_TIMEOUT_MS` in `api/client.js` |
| Server to AI provider | 25 s (27 s at the guard) | `AI_TIMEOUT_MS` |
| Server to speech provider | 20 s | `SPEECH_TIMEOUT_MS` |
| Server to a partner address | 10 s | `WEBHOOK_TIMEOUT_MS` |
| One scheduled run | 20 s of deliveries | Fixed |
| Database statements | The client's default; the host's pooler | G-015, not verifiable from here |
| Interactive database transactions | 5 s (client default), longer where a route sets it | Code read |

No outside call is made while a database transaction is open (checked by reading every call site of `guarded` and `callOut`; the event send happens after commit).

## 6. Breaker

After five failures in a row a service is left alone for 30 seconds; the next call after that is a trial. A 4xx does not count as a failure. Partner addresses are excluded, because one partner's bad address must not stop delivery to another; a failing subscription is stopped individually instead. State is per server instance (H-012).

## 7. Concurrency results (group "Idempotency, retries and concurrency", 10 scenarios, all pass)

| Race | Result |
|---|---|
| The same order sent again after its answer was lost | One order; the retry is a replay |
| Same key, different body; same key, another person | 422; a separate request |
| Ten copies of one payment at once | One payment |
| One shipment dispatched from two screens | Leaves once; one invoice |
| A quote accepted by the customer's system and the sales desk at once | One order |
| A carrier reports "delivered" twice, then "in transit" late | One delivery; duplicate recognised; late status refused |
| Receipt, transfer, credit and work order completion each sent twice | Each done once |
| A purchase order and a sales order with keys, sent twice | Each created once |
| A request whose first attempt died | Taken over once |
| Five delivery runs at once (events group) | Each event sent once |

## 8. Open

| Subject | Finding |
|---|---|
| Partners are not required to send a key; without one, creating a request for quote twice creates two | Recorded here. Requiring it would refuse callers that do not send it; a decision for when the first partner is onboarded |
| Edits other than status are last write wins except on the orders API | G-020 |
| A key protects for 24 hours | By design; stated in the partner contract |
