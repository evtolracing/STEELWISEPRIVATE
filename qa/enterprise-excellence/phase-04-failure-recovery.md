# Phase 4: failure and recovery

For each critical integration: what fails, how it is detected, what happens on its own, what a person does, how the outcome is reconciled, and how duplicates are prevented. "Tested" names the scenario in `qa/sim/phase4-integration.mjs` or `qa/sim/ui-integration.cjs`.

| Integration | Failure | Detection | Automatic recovery | Manual recovery | Replay | Reconciliation | Duplicate prevention | Communication | Tested |
|---|---|---|---|---|---|---|---|---|---|
| Database (INT-01) | Unreachable | Health route answers 503; requests fail | None; requests succeed again when it returns | Host and provider | The caller retries with the same key | `qa/tools/db-facts.mjs` checks | Request keys; transactions | A plain sentence, no connection detail | "with the database unreachable the server says so and gives nothing away" |
| Database (INT-01) | A rule refuses a change | The error class | None needed: nothing was saved | Correct the value | Resend | — | — | 409 `RULE_REFUSED` with a sentence and a request id | "a change the database itself refuses…" |
| Screen to server (INT-20) | Slow answer | Loading indicator | Waits up to 60 s | — | — | — | — | The screen shows it is working | `ui-integration` "slow answer" |
| Screen to server | No answer in 60 s | Browser time limit | The screen stops waiting | Check the list, then press again | Same request key | The screen re-reads the record (Shipping) | Request key | "The server took too long to answer. Check the list before sending this again: it may have been saved." | "time limit" |
| Screen to server | Connection lost | Network error | None | Refresh when back | Same key | Refresh | Request key | "The connection was lost…"; the user stays signed in | "lost connection" |
| Screen to server | Session ended | 401 | Token removed; back to sign-in | Sign in | — | — | — | Sign-in page | "expired session" |
| Screen to server | Saved, but the answer was lost | No answer | The screen reads the record again | Press again if unsure | The server answers with the first result | The record itself | Request key; state check | The message says it may have been saved | "answer lost after saving" (5 checks) |
| Screen to server | The user leaves mid-step | — | The server finishes the step once | — | — | The list on return | State check | The list shows the true state | "left mid-step" |
| Dispatch to billing (INT-24) | The truck leaves; the invoice cannot be raised | The invoice step throws | None: billing is not retried on its own | Raise the invoice from the shipment | — | "Shipped but not invoiced" on the Integrations screen, with the count | One invoice per shipment (unique rule) | Warning on the shipment screen; audit entry `INVOICE_NOT_RAISED`; log line | "shipping succeeds and billing fails…"; `ui-integration` "part of a step failed" |
| Dispatch (INT-24) | Any part of the dispatch itself fails | Transaction error | Everything rolls back, including the events | Fix and dispatch again | — | Phase 3 checks | Conditional update | The refusal in words | "a dispatch and everything that follows from it are saved together or not at all" |
| Partner event (INT-06) | The partner's address is down or slow | Status or time limit | Tried again after 1, 5, 30, 120 minutes | "Run now"; the partner fixes its side | Administrator or partner | Delivery list per subscription | Event id; claim | Failed count and reason on the Integrations screen | Events group (13) |
| Partner event | Never deliverable | Five failures | Kept as failed; subscription stopped after five failed events in a row | Turn the subscription back on; replay | Yes, audited | Failed list | Event id | "Needs action" on the Integrations screen | "an event that can never be delivered…", "a subscription that keeps failing…" |
| Partner event | The server stops mid-send | The claim runs out after 2 minutes | The next run takes the row | — | — | — | The receiver recognises the event id | — | "a delivery claimed by a server that stopped…" |
| Partner event | The scheduler is not running | "Scheduled work last ran" on the Integrations screen; "waiting over 15 minutes" | Each new action drains what is due | "Run now" | — | — | — | "Needs action" | "the scheduled run needs its secret…" |
| Partner event | Waited more than 72 hours | Age check | Moved to failed, not sent | Replay if still wanted | Yes | Failed list | — | Reason in words | "an event that waited for days…" |
| Partner API in (INT-05) | The partner retries a call | Request key or state | The first answer is returned | — | — | — | Key per partner; idempotent reports | `Idempotent-Replayed: true` or `duplicate: true` | Idempotency group |
| Partner API in | A key leaks | — | — | Revoke the key: its tokens stop on the next call | — | Partner request log | — | 401 `KEY_REVOKED` | "a revoked key, a suspended partner and a wrong secret…" |
| AI provider (INT-03) | Error, hang or wrong key | Status or 25 s limit | One repeat on a passing failure; then the next provider if one is set up; breaker after five | Fix the key or wait | — | None needed: no record depends on it | — | "The assistant could not answer", 502, 503 or 504 | "the AI provider fails: one repeat at most…" |
| Speech (INT-04) | Error, hang or wrong key | Status or 20 s limit | Breaker after five; tried again after 30 s | Fix the key | — | — | — | Plain sentence; the user stays signed in | "the speech provider hangs…", "a provider that keeps failing…" |
| Scheduled run (INT-07) | Called twice at once, or by several instances | — | Each event is claimed once | — | — | — | Claim | — | "five delivery runs at the same moment…" |
| Request keys (INT-30) | The server dies holding a claim | The claim is older than 60 s | The next retry takes it over, once | — | — | "Requests never answered" on the Integrations screen | — | — | "a request whose first attempt died…" |
| Not connected (INT-08 to 13) | The function is asked for | — | — | Done by hand | — | — | — | 501 or a notice that it is not connected | "services that are not connected say so…" |

## What a person looks at

`Admin > Integrations` (company administrators): what is connected; calls to outside services with failures and time-outs; events waiting, waiting over 15 minutes, failed, and subscriptions stopped, with "Send again"; orders shipped but not invoiced; requests never answered; when scheduled work last ran; and one "Needs action" list at the top. "Run now" does the scheduled work on demand.

## Not recoverable by the system, stated

| Situation | Why | What covers it |
|---|---|---|
| Loss of the database | No backup has been confirmed or restored | E-015 (owner: later). Unchanged, and the largest production risk |
| An invoice that failed at dispatch | Not retried on its own, because the cause is usually data that a person must correct | The report and the warning |
| A partner that was down for more than 72 hours | Old events are not sent on their own | The failed list and replay |
| Anything on the host | Not reachable from here | NOT VERIFIED |
