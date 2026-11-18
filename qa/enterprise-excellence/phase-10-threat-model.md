# Phase 10: threat model

STRIDE over the assets that matter to a steel service centre running on STEELWISE. Each threat names the control that answers it and the scenario that tests it (in `qa/sim/phase10/`, run by `qa/sim/phase10-security.mjs`).

## Assets

1. **The books**: posted journal entries, periods, reconciliations (Phase 9.5). Permanent once the owner starts them.
2. **Money records**: invoices, payments, credits, refunds, the receivables they make.
3. **Stock records**: quantities and costs at 80 branches; they value the books.
4. **Identities**: staff logins, customer logins, partner keys and webhook secrets.
5. **Customer data and documents**: orders, prices, certificates, drawings.
6. **History**: the audit trail that says who did what.
7. **Availability**: the counter, the dock and the store must keep working.

## Actors

| Actor | Reach | Typical goal |
|---|---|---|
| Outsider on the internet | Public addresses: sign-in, store, partner token, readiness | Guess passwords, enumerate logins, load the database |
| Customer login | Store and account portal of one account (or one division) | See another account's orders, prices, documents |
| Partner key | Partner API with its scopes | Read another partner's data, forge events |
| Staff login, wrong role | Staff routes | Do finance or admin work without the role |
| Staff login, wrong branch | Staff routes | Read or change another branch's records |
| Administrator | Users, settings, partners | Make a login above their own role or in another company |
| Compromised server process | Whatever its database role allows | Change posted books, erase history |
| The AI assistant, steered by a prompt | Its read-only tools | Write to the books, read beyond the asker's role |
| Operator mistake | Deployments, database updates, restores | Restore over live, apply an update twice, roll back badly |

## Threats and controls

| STRIDE | Threat | Control | Tested by |
|---|---|---|---|
| Spoofing | Forged or altered token | HS256 pinned (Y-007); signature, expiry, live login and session mark checked; token without a user id refused (Y-018) | group 1, 9 forged-token scenarios |
| Spoofing | Stolen token kept after the owner reacts | Session mark moved by password change, reset, switch-off, sign-out everywhere (Y-001) | group 1 session scenarios |
| Spoofing | Password guessing | Pause after 10 wrong in a row, per login, across addresses (Y-002); same time and words for every refusal (Y-003) | group 1 lockout and timing |
| Spoofing | Partner token minted or reused | Client secret checked, issuer checked, revocation immediate | group 6 |
| Tampering | Posted entry changed | Database triggers; application role cannot disable them (Y-008) | groups 3 and 4 |
| Tampering | History rewritten | No route updates or deletes history (Y-011); `AuditLog` insert-only for the application role | groups 3 and 9 |
| Tampering | Uploaded file escapes its folder or is disguised | Folder name rule (Y-004), extension from type (Y-005), byte signature (Y-006) | group 3 |
| Tampering | Double payment, double post, lost stock update under concurrency | Serializable money transactions taking turns per invoice (Y-020), unique posting keys, idempotency keys | group 7 |
| Repudiation | "I did not post that" | Two-person posting, every post, reversal, journal read and sign-in event in history | groups 4 and 9 |
| Information disclosure | Another account's or branch's data | Branch-scoped client; documents follow their record (Y-016); customer routes by account; partner by organization | group 2 (31 scenarios) |
| Information disclosure | Secrets in answers, logs, the repository | Secret scan in CI; webhook secret shown once; no password or token in logs | groups 3, 6, 8, 9 |
| Information disclosure | Login guard fields | Only managers and the person see them (Y-015) | group 1 |
| Denial of service | Readiness flood | Answer kept 30 s (Y-014) | group 9 |
| Denial of service | Request floods | Per-address limit (per instance, E-014), per-partner limit, body size limit | groups 3 and 6 |
| Denial of service | Busy invoice answers errors | Turns per invoice; 409 BUSY instead of 500 (Y-020) | group 7 |
| Elevation | Administrator registers a higher role or another company | Register follows the Users rules (Y-013) | group 1 |
| Elevation | Staff reads partner administration | Administrator role required (Y-019) | group 1 |
| Elevation | Assistant writes to the books | Fixed read-only queries; no write tool; prompt attacks refused | group 4 |
| Elevation | Compromised server runs DDL | No CREATE, no ownership for the application role (Y-009) | group 3 |

## Out of reach of this phase (stated, not assumed)

- The host's own controls: network, TLS, the database's backups, Vercel and Supabase account security. Recorded in `phase-10-disaster-recovery.md` for the owner.
- Several server processes at once (E-014, Phase 11).
- Physical and social attacks.
