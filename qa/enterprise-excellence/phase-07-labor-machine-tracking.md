# Phase 7: labor and machine tracking

## 1. Labor time

A time entry (`DispatchTimeLog`) belongs to one step and one operator, with a start, an end, a status (running or paused) and, when paused, a reason.

| Property | Evidence |
|---|---|
| Starting a step opens one entry with the operator, work center and time | Group 4, first scenario |
| Pausing closes it with the reason; resuming opens a new one; a step's time is the sum of its entries | Group 4 "pausing closes the clock..." (the sum is checked against the rows) |
| Two starts at the same moment leave one entry running | Group 4 |
| A finished step has no entry running; a closed job has none | Database checks, and group 7 "across everything this run did" |
| Cancelling a job closes its entries with "Job cancelled" | Group 7; finding L-018 |
| An operator with an entry running cannot be made inactive, deleted or moved to another branch | Group 4; finding L-014 |
| Entries are visible at their own branch only | Group 4; finding L-019 |
| Past entries keep the operator's and the work center's name after either is switched off | Group 7 |

No time entry was fabricated. Fixture rows that the scenarios write directly are marked "QA P7 fixture written to the database directly" and exist only in the QA database.

## 2. Labor rules not on file (finding L-022, the owner's question)

- Whether an operator needs a certification to run a kind of machine, or only must not hold a lapsed one. Today a lapsed certification refuses; none at all does not.
- Whether one operator may be clocked on to two steps. Today yes.
- A maximum length for one entry, breaks, overtime. None exists; an entry left open overnight keeps counting.
- Pay: `Operator.hourlyRate` exists and is shown to managers only. Nothing multiplies it by time (L-026).

No labor policy was invented.

## 3. Machine time and downtime

| Subject | State |
|---|---|
| Machine run time | Not recorded separately. Time is the operator's clock on the step |
| Downtime | `DowntimeRecord` exists; no address or screen writes it. A pause reason is the nearest record |
| Maintenance lockout | Tested as a software interlock (`phase-07-work-center-capabilities.md`) |
| Telemetry, counters, machine connection | None exists. Recorded NOT APPLICABLE in groups 4 and 7 with the evidence |
| Hardware certification | None claimed. No equipment was available or driven (L-030) |

## 4. Reporting from time entries

The shop-floor figures and the time-tracking screen read these rows directly. After this phase they count work on open jobs only (finding L-009). Utilisation is shown only where a work center has hours on file.
