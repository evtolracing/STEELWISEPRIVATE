# Phase 12: security and operational acceptance

Date: 2026-11-19. Release candidate RC-2 (RC-1 is commit `9e12319`, the merge of Phase 11; RC-2 is RC-1 plus the corrections of this phase, listed in `phase-12-release-baseline.md`). Everything here was run in this session on one local machine against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only. Nothing was run against the live system, and nothing here is a statement about it.

**No approval has been given by any stakeholder.**

| # | Item | Evidence prepared by engineering | Accepted by the business |
|---|---|---|---|
| 1 | Security readiness | `phase-12-security-certification.md`; live database role not yet switched (Y-008) | NOT GIVEN |
| 2 | Backup and recovery | `phase-12-disaster-recovery.md`; live restore never done (E-015) | NOT GIVEN |
| 3 | Incident response | Classes and first responses below; no person named | NOT GIVEN |
| 4 | Operational procedures | Support procedures below; the manual chapter "When something goes wrong" | NOT GIVEN |
| 5 | Support readiness | No support owner is named | NOT GIVEN |
| 6 | Rollout plan | `phase-12-rollout-plan.md`; no pilot chosen, no date | NOT GIVEN |
| 7 | Deployment authorization | `phase-12-deployment-checklist.md`; not authorized | NOT GIVEN |
| 8 | Permissions matrix, line by line | `permissions-matrix.md`; in particular that sales staff may dispatch a shipment and move a work order (AA-010) | NOT GIVEN |

## Sign-off

No sign-off has been given. Claude prepares this form and cannot fill the last three columns.

| Approver (role) | Name | Decision | Date | Evidence on file |
|---|---|---|---|---|
| Security | ________________ | NOT GIVEN | ________________ | none |
| IT | ________________ | NOT GIVEN | ________________ | none |
| Operations | ________________ | NOT GIVEN | ________________ | none |
| Business | ________________ | NOT GIVEN | ________________ | none |
| Executive | ________________ | NOT GIVEN | ________________ | none |

## Support procedures

First line is the branch manager or the administrator; second line is whoever the owner names for the system; third line is engineering. **No person is named here and no authority is assigned**: the owner fills the last column.

| Issue | First check | Usual cause and fix | Escalate when | Owner of the escalation (role, to be named) |
|---|---|---|---|---|
| Login issues | Is the login switched off? Is sign-in paused after wrong passwords? Does the answer say "database update required"? | Switched off: an administrator switches it on. Paused: wait, or an administrator resets. Update required: the owner applies the file named | Many people at once cannot sign in | System administrator, then engineering |
| Permission issues | Which role and home branch does the person have (Admin, Users)? | Wrong role or wrong branch. Change it; do not lend a login | The role is right and the step is still refused | System administrator |
| Incorrect pricing | Pricing: the product's list price and the customer's tier. Was there an override (audit log)? | A tier or list price set wrongly; an override. Correct the source; credit the difference on the invoice if billed | The price differs from Pricing with no override | Sales lead, then engineering |
| Inventory discrepancies | The item's movements; open transfers; reservations | Unreceived transfer, shipment not dispatched, receipt against the wrong line. Finish the step; correct with a reason only for a real count difference | The system figure cannot be explained from its movements | Inventory lead, then engineering (P1 if widespread) |
| Failed receiving | The message: heat not on file, over-receipt held, certificate missing | Add the heat; decide the over-receipt; upload the certificate | Receiving is refused with none of those | Purchasing lead |
| Production exceptions | The job page: its step, who holds it, QC state | Step out of order, another operator has it, waiting for inspection | A job cannot move and no reason is shown | Production lead |
| Shipping failures | Is the order on credit hold? Is the stock reserved? Was "busy, try again" shown? | Release the hold; reserve; press again | A shipment left and no invoice exists (Integrations screen lists it): tell finance the same day | Shipping lead, then finance; P1 |
| Invoice discrepancies | The invoice against its shipment and order lines; payments and credits on it | Price or tax at the time of shipment; a credit not issued. Credit or cancel with a reason; never edit | Totals do not follow from the lines | Finance lead; P1 |
| Financial reconciliation errors | Finance, "Not posted"; then which check differs | An event waiting for a cost, an account approval or an open month | A difference remains with nothing waiting: runbook 2 of `phase-10-incident-runbooks.md` | CFO; P0 if the books are in use |
| Integration outages | Admin, Integrations: the service's state and "If it is not available" | The outside service is down; the product degrades as written there. Events are sent again | Events fail after the service is back | Integration administrator |
| Performance issues | One person or everyone? One screen or all? `/api/health/ready` | A large list with no filter; a busy moment at dispatch | Everyone, for more than a few minutes: runbook 1 | System administrator, then engineering |

## Incident classes

| Class | Meaning | Examples in this product | First response | Who is told |
|---|---|---|---|---|
| P0 | Critical outage across the company, a security compromise, or material corruption of money or data | Nobody can sign in; one branch sees another's records; posted entries differ from the records with nothing waiting; a leaked secret | Immediately. Contain first: stop the affected step, promote the previous deployment or stop posting. Preserve evidence | Owner, executive, and finance or security as it applies |
| P1 | A major business-critical failure with no acceptable workaround | Shipments cannot be dispatched; invoices not written for goods that left; receiving refused everywhere | Within the hour. Workaround or rollback the same day | Owner and the affected leads |
| P2 | Significant degradation with a manageable workaround | A report wrong while its source records are right; one screen failing for one role; slow dispatch at peak | Next working day. Fix in the next release | System administrator and the affected lead |
| P3 | A minor defect or an improvement | Wording, layout, a missing convenience | Recorded and scheduled | Product owner |

## Handling

1. **Detect and record**: who saw what, where, when; the request reference if shown. One record per incident.
2. **Classify** by the table. When unsure between two classes, take the more severe.
3. **Contain**: stop the harm before finding the cause. The runbooks in `phase-10-incident-runbooks.md` cover the site not answering, the books disagreeing, a failed posting, goods shipped without an invoice, a suspected break-in, paused logins, undelivered partner events and a restore.
4. **Recover**: fix forward or roll back (`phase-12-rollback-plan.md`). Verify with the reconciliation and the stock checks, not by eye.
5. **Communicate**: one person speaks for the incident; branches are told what to stop and when to start again. Customers are told by the business, not by the system. The product sends no customer notifications (D-034).
6. **Review** within five working days for P0 and P1: what happened, why it was not caught, what test or alert now catches it. A fix is not finished until an automated check fails without it.

Where the company already has an incident procedure, that procedure governs and this table is mapped onto it. None was provided to this program.

## Monitoring: what exists and what does not

An alert that reaches nobody is not monitoring. In this product alerts are raised and can be sent to one address (`ALERT_WEBHOOK_URL`); **no live receiver is set and no recipient has been approved (E-017)**, and the scheduled run that raises time-based alerts is not configured on the host (B-019). No production notification was sent in this phase.

| What | How it is seen today | Tested | Alert reaches a person on live |
|---|---|---|---|
| Application health | `/api/health`, `/api/health/live`, `/api/health/ready` (names the commit and the database state) | Phase 10 and this phase | No: nothing polls it unless the host or an outside monitor is set up |
| Database health | `/api/health/ready` answers 503 when the database is unreachable; requests answer "try again" | Phase 11 failure injection | No |
| API errors | Structured log lines with a request reference; Admin, Integrations for outside calls | Phase 4 and 10 | No error-tracking service (E-017) |
| Queue failures (partner events) | Admin, Integrations: "Events that could not be delivered" | Phase 4 and 11 | Raised to the alert address if set |
| Integration failures | Admin, Integrations: calls, failures, time-outs, breaker state | Phase 4, 10, 11 | As above |
| Inventory reconciliation | Finance, "Check now" (inventory and in-transit checks); `qa/tools/db-facts.mjs` on QA | Phase 12: 6 of 6 scenarios pass | Only when someone presses the button, until the scheduled run is set |
| Financial reconciliation | Finance, Overview | Phase 12: 6 of 6 scenarios pass | As above |
| Failed ledger postings | Finance, "Not posted"; a warning on the Overview | Phase 9.5, 10, 11 and this phase | As above |
| Authentication abuse | Sign-in pauses after repeated failures; paused logins listed; audit rows | Phase 10 | Raised to the alert address if set |
| Backup failures | The host's dashboard | NOT VERIFIED: outside this environment | Owner must confirm with the host |
| Deployment health | `/api/health` names the commit; sign-in says which database update is missing | Phase 10 | No |

Before Stage 1: the owner chooses where alerts go and who reads them, sets the scheduled run, and an outside monitor polls `/api/health/ready`. Until then the Integrations screen and Finance Overview must be opened by a named person every working day.

## Release management (section 36)

| Item | What exists | Open |
|---|---|---|
| Release candidate identifier | RC-n over a commit id (`phase-12-release-baseline.md`) | No version number in the product |
| Change control | One pull request per phase; merged only on the owner's word; the candidate is frozen and any change is recorded and regated |  |
| Database changes | Every change ships as a migration and a SQL Editor file run twice on a copy; the owner applies it | Live state not known to engineering |
| Quality gate | `qa/tools/run-gates.sh`: rebuild, every suite of every phase, lint, build, documents | About an hour; runs locally, not in CI |
| Rollback | `phase-12-rollback-plan.md` | Not rehearsed on the host |
| Release notes | The phase report and the pull request description |  |
| Hotfix path | Same gate; a hotfix is a new candidate | No on-call person named |
| Post-release review | First-hour checks in the deployment checklist; the pilot exit criteria | Nobody named to run it |
