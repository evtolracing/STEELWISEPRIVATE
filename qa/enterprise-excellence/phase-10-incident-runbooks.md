# Phase 10: incident runbooks

Short steps for the owner or whoever is on call. Each names the signal that starts it. Nothing here was run against the live system; the QA equivalents are cited.

## 1. The site does not answer

Signal: `/api/health/live` fails, or users report the site is down.
1. Vercel dashboard: is the latest deployment "Ready"? If it failed or errors, promote the previous deployment.
2. `/api/health`: 503 means the database does not answer. Supabase status page and project dashboard; the alert `DATABASE_UNREACHABLE` says when it started.
3. Sign-in answering 503 `DATABASE_UPDATE_REQUIRED`: a deployment is ahead of the database. Apply the named SQL Editor file, or promote the previous deployment.
QA evidence: group 7 "With the database unreachable the server says so"; group 8 Y-022 scenario.

## 2. The books disagree with the records

Signal: `LEDGER_RECONCILIATION_DIFFERENCE`, or Finance, Reconciliation shows DIFFERENCE.
1. Open the reconciliation: it names the check (inventory, receivables, ...) and the items or customers that differ.
2. Do not post an entry to make it agree. Find the record that changed: `AuditLog` for that item or invoice.
3. A record changed outside the product (the database directly) is a security incident: go to 5.
4. A business event not yet posted: Finance, Not posted lists it with its reason; fix the reason (a cost, an account) and post it, or run "record what is missing".
QA evidence: group 5 "Stock changed outside the product ...", "An invoice changed outside the product ...".

## 3. A ledger posting failed or waits

Signal: `LEDGER_POSTING_FAILED`, `LEDGER_EVENTS_WAITING`.
1. Finance, Not posted: each event with its reason.
2. A missing cost: enter it on the item; the event posts. A receipt with no purchase order: a finance person posts it with the offset account.
3. The sale or receipt that caused it is not affected and needs nothing.
QA evidence: group 6 held receipt, group 9 posting failure.

## 4. Goods shipped without an invoice

Signal: `SHIPPED_NOT_INVOICED`, or the integrations report "Shipped but not invoiced".
1. Open each order listed; raise the invoice from the shipment (Invoices, or `POST /api/invoices` with the shipment).
2. If raising it is refused (a credit hold, a missing price), fix that first; the shipment has left either way.
QA evidence: group 7 kill -9 scenario, group 9 Y-021 scenario.

## 5. Suspected break-in or a leaked secret

Signal: a history line nobody recognises, a login paused many times, an unknown partner key in use, a secret seen where it should not be.
1. Sign the person out everywhere (Users, the login) or switch the login off; their tokens stop at once.
2. A partner key: revoke it (Partners, keys); it stops at once.
3. A leaked host secret: rotate it in its service (Supabase database password, the JWT secret, a partner or AI key), put the new value in the Vercel settings, redeploy. Rotating `JWT_SECRET` signs everyone out; rotating the partner secret invalidates partner tokens (they get new ones with their keys).
4. Keep the history: nothing deletes it, and with the application role nothing can.
5. If posted books may have been changed: the database guards refuse it; check that the role in `DATABASE_URL` is `steelwise_runtime` and run a reconciliation.
QA evidence: group 1 sessions, group 6 key revocation, group 3 and 4 database role scenarios.

## 6. Many paused logins

Signal: `LOGIN_LOCKED` repeatedly, "logins paused now" with a count.
1. One login many times: someone is guessing it. The pause holds whatever address they use; tell the person; an administrator can lift the pause once they have a new password.
2. Many logins at once: a password-spraying attempt. Consider blocking the source at the host's firewall (Vercel); the per-address limit counts per instance (E-014).
QA evidence: group 1 lockout scenarios.

## 7. Partner events not delivered

Signal: `WEBHOOK_DEAD_LETTER`.
1. Integrations: the failed deliveries and the partner's address. Ask the partner whether their address works.
2. An administrator replays the deliveries once it does; each is sent once.
QA evidence: group 6.

## 8. Restore after data damage

Follow `phase-10-disaster-recovery.md`, "Order of recovery for a data loss". Never restore over the live database.
