# Phase 4: observability

## 1. What exists

| Signal | Where | Added in Phase 4 |
|---|---|:-:|
| One log line per request: time, level, request id, method, path, status, milliseconds, user and role | `middleware/requestLog.js` | No |
| The request id returned on every server error and every `RULE_REFUSED` | `middleware/safeErrors.js` | Extended |
| Audit log: who did what to which record | Table `AuditLog` | New entries: `INVOICE_NOT_RAISED`, `WEBHOOK_REPLAYED`, `CARRIER_REPORT`, `PO_ACKNOWLEDGED` |
| Structured failure lines: `invoice_not_raised`, `webhook_dead_letter`, `webhook_disabled`, `webhook_expired`, `webhook_settle_failed`, `webhook_kick_failed`, and a line when a route lets a database rule refuse a change | Server log | Yes |
| Every event delivery: status, attempts, HTTP status, time taken, reason | Table `WebhookDelivery` | Extended |
| Every partner call: partner, key, route, status, time, record touched | Table `PartnerApiLog` | No |
| Calls to outside services: calls, successes, failures, time-outs, repeats, refused by the breaker, average time, last success and failure | Memory of the instance; shown on the report | Yes |
| When scheduled work last ran and what it did | Setting `tasks.lastRun` | Yes |
| Integration report | `GET /api/admin/integrations`, screen `Admin > Integrations` | Yes |

## 2. The integration report

One screen for company administrators answers: what is connected and what is not; which outside service is failing; how many partner events are waiting, late or failed, and which; which subscriptions were stopped; which orders shipped and were not invoiced; how many requests were claimed and never answered; when scheduled work last ran. A "Needs action" list at the top says what to do about each. Tested by "the integration report is for company administrators and holds no secret", "shipping succeeds and billing fails…", and five checks in `qa/sim/ui-integration.cjs`.

## 3. Following one transaction

A request id ties the browser's request to the server's log lines and to the error shown to the user. An order, a shipment and an invoice are tied by their ids and numbers through the audit log and the stock movements. An event carries its own id from the business transaction to the partner's receiver and back into the delivery row. What does not exist is a single id that follows one business transaction across several requests; the document numbers serve that purpose.

## 4. Secrets and personal data in logs

"the server log holds request ids and reasons, and no key, token or signing secret" searches the whole server log of a run for the speech key, the AI key, the scheduler secret, a partner's client secret, a partner's token, a staff token and a webhook signing secret: none is present. Before Phase 4 the first characters of the speech key were logged (H-005). Request bodies are not logged. Whether customer names in audit details need masking is a privacy decision outside this phase.

## 5. What is missing

| Gap | Finding | State |
|---|---|---|
| No alert reaches anyone. The report must be opened to be seen | E-017 | REQUIRES BUSINESS DECISION: the owner's choice of error tracker or alert channel |
| Counters for outside calls are per server instance and reset on restart | H-012 | Deferred to Phase 10 |
| No measure of queue age over time, error rate or latency percentiles | E-017 | The same |
| No dashboard on the host | E-017 | The same |
| Slow database statements are not logged | Phase 3, G-015 | Host setting |

Until E-017 is decided, the working routine is: an administrator opens `Admin > Integrations` daily; "Needs action" should say "Nothing needs action".
