# Phase 10: alerting

Before this phase nothing raised an alert (E-017, Y-010). `src/backend/src/lib/alerts.js` now gives every alert three outcomes:

1. A log line at level `alert` with the kind, severity, key, request id and details. Always.
2. A history row (`AuditLog`, category SYSTEM, event ALERT), stored once per kind and key in 15 minutes however often it is raised.
3. When `ALERT_WEBHOOK_URL` is set, a POST of the same facts to that address (a chat or paging hook). A failure to send is logged and changes nothing else.

Raising an alert never fails or slows the work that raised it.

## Kinds

| Kind | Severity | Raised by |
|---|---|---|
| LEDGER_POSTING_FAILED | CRITICAL | At once, when a business event could not be posted (not one held for a person); again by the scheduled run while any stays failed |
| LEDGER_UNBALANCED_ATTEMPT | CRITICAL | At once, when an entry that does not balance is refused by the server or the database; the scheduled run if a posted entry ever does not balance |
| LEDGER_RECONCILIATION_DIFFERENCE | CRITICAL | The scheduled run, when the latest reconciliation found a difference |
| LEDGER_EVENTS_WAITING | WARNING | Ledger events waiting for a person more than a day (scheduled run) |
| INVENTORY_BALANCE_BROKEN | CRITICAL | A stock row whose quantities do not add up (scheduled run) |
| LOGIN_LOCKED | WARNING | At once, when a login is paused after ten wrong passwords; the scheduled run while any is paused |
| WEBHOOK_DEAD_LETTER | WARNING | Partner events that could not be delivered (scheduled run) |
| SCHEDULED_RUN_LATE | WARNING | Not sent (a late run cannot report itself); shown as a failing check on readiness and the checks page |
| SCHEDULED_RUN_FAILED | CRITICAL | At once, when the scheduled run fails |
| DATABASE_UNREACHABLE | CRITICAL | The scheduled run, when the database did not answer within 5 s (log and alert address only: it cannot be stored) |
| SHIPPED_NOT_INVOICED | WARNING | Goods shipped over 15 minutes ago with no invoice (Y-021, scheduled run) |

## Tested

An alert reaches the alert channel (the local stand-in) with its kind and severity and nothing secret; when the channel answers 500 the alert is still stored; a storm of the same failure is stored once; with no address set nothing is sent and alerts are still stored; administrators see the checks and recent alerts, others do not. Unit tests "Y-010" cover the once-per-15-minutes rule with a fake database and the alert of a failed scheduled run; proof by removal holds for both (Y-010, Y-010b).

## For the owner

- Set `ALERT_WEBHOOK_URL` on the host to a chat or paging hook when you choose one. Until then alerts are in the log and on the checks page only.
- Set up the scheduler (B-019): without it the scheduled checks do not run and only the alerts raised during a request (posting failures, unbalanced attempts, paused logins) appear.
- No simulated emergency was sent to any production channel.
