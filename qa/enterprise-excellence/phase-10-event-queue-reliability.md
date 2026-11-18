# Phase 10: events, background work and outside services

Group 6 of the Phase 10 suite (`qa/sim/phase10/g6-integrations.mjs`, 26 scenarios), with partner webhooks pointed at a local stand-in. No real partner, accounting system or AI provider was called.

## Partner events

- An event carries a signature over its body and a timed signature, both matching the shared secret; a changed body does not match.
- The body carries no secret, token or password. Another partner never receives this partner's events. A private address is refused for a webhook in production.
- An event that cannot be delivered is retried, then kept as FAILED after five tries; the check "partner events delivered" fails and the scheduled run raises `WEBHOOK_DEAD_LETTER`. Only an administrator can replay a delivery.
- Two scheduled runs at the same moment do not send an event twice.
- A partner listing its webhooks never sees a secret again.

## The scheduled run

`/api/internal/tasks/run` needs its secret: none, a wrong one, or one in the address are refused. It records when it ran (`tasks.lastRun`) and the "scheduled run on time" check then passes. It now also runs the system checks and raises an alert for each one that fails (Y-010). It needs a scheduler on the host (B-019, owner).

## Ledger events

- A receipt held for a person (no purchase order) is posted once when two finance people post it at the same moment.
- "Record what is missing" run twice adds nothing the second time.
- A posting that fails is held with its reason, raises `LEDGER_POSTING_FAILED`, and does not slow or fail the sale that caused it (group 9).

## Outside services failing

- The AI service answering 503: the assistant answers a plain refusal, not a server error.
- The AI service hanging: the assistant gives up within its time limit (1.5 s in the scenario).
- The alert channel answering 500: the alert is still stored and the work that raised it is not affected.

## Accounting export

An export is a file. Making one for XERO with every account mapped sends nothing to any outside address (the stand-in saw no call), the list says no accounting system is connected, and the file carries no secret. Only finance makes or settles one; a sales login cannot even list them. No real accounting transaction was sent.

## Partner keys

A revoked key stops working at once; a token cannot be minted with a wrong client secret and the refusal does not say which part was wrong; a staff-signed token is refused by the partner API; the per-partner rate limit holds.
