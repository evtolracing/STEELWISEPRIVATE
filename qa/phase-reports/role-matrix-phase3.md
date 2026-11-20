# Editable role permission matrix, phase 3: the switchover

Written 2026-11-20. Follows `role-matrix-phase2.md`. The owner said "continue" after phase 2.

## Status: CONDITIONAL. The server and the menu now decide from each role's saved permissions.

What an administrator saves on Administration, Roles & Permissions now takes effect: on the server within a minute (at once on the server copy that saved it), and in a person's menu the next time they open or refresh the app. Nobody has to sign out. With nothing edited, every role does exactly what it did before, except the one difference the owner accepted (below).

CONDITIONAL because of the nine handler checks listed under "Still decided by role name": for those rights, taking the right away works, giving it to a new role does not yet.

## What was built

| Piece | Where |
|---|---|
| The saved roles, read once a minute, with the safe fallbacks | `src/backend/src/lib/roleStore.js` |
| Every request carries what it may do (`req.access`; the previewed role's while previewing) | `src/backend/src/middleware/auth.js` |
| The access gate decides by permission | `src/backend/src/middleware/apiGate.js` |
| Role checks inside routes decide by permission where the catalog names one | `requireRole` in `middleware/auth.js`; `only` in `routes/ledger.js` and `routes/integrations.js` |
| Stock cost, invoice detail, marking a load lost, the books' company view and start/stop | `lib/costView.js`, `lib/invoiceView.js`, `routes/shipments.js`, `routes/ledger.js`, and the six routes that hide cost |
| Branch reach follows the role's saved reach (every branch, assigned, home only) | `src/backend/src/lib/branchScope.js`, `lib/viewScope.js` |
| Previewing another role follows the "preview" permission | `lib/viewScope.js`, `routes/auth.js` |
| Each login is told its permissions; the menu and pages go by them | `GET /api/auth/me`; `src/frontend/src/config/roleAccess.js`, `hooks/useAuth.jsx` |
| The roles screens say when a change applies | `src/frontend/src/pages/Admin/RolesPage.jsx` |
| New safeguard: nobody takes the administration pages away from their own role | `src/backend/src/lib/roleEditRules.js` |

No database change in this phase. Database update 19 (applied) is all it needs.

## Safe in every direction

- The role table cannot be read, a role's row is missing or malformed: that role gets its built-in default, which is the rule set from before the switchover. The server neither opens up nor locks everyone out. One error line is logged (`role_matrix_unreadable`).
- Super admin and tenant owner always hold everything, whatever is saved.
- Whether a role is staff, customer or partner comes from the code, never from the database. A saved row cannot turn a customer login into a staff login.
- Off switch: setting `ROLE_MATRIX=off` on the host makes every role its built-in default again without a deploy. The roles screens then show a warning. Environment settings are the owner's; nothing was set.
- Other server copies see a change within 60 seconds.

## The accepted difference, now live with this phase

Logins with one of the five old role names (SALES, QUALITY, LOGISTICS, FINANCE, VIEWER) no longer read invoices through the API. The owner confirmed this on 2026-11-20. Any such login can be given it back by ticking Billing: View on its role.

## Still decided by role name (phase 5)

The gate checks the permission first, so taking any of these away from a role works today. Giving one to a role that did not have it does not open the action yet, because the route also checks a fixed list of role names:

- Adding or changing a product; setting a list price (products, intake pricing)
- Adding or changing a grade
- Releasing a credit hold; changing a customer's tier or credit limit
- Price overrides and the counter discount approval
- Correcting a stock balance and settling a shortage
- Releasing a quality hold on a work order
- Seeing operators' pay
- Who may change which login (user administration rules)
- Branch reports in the books for branch managers

Custom roles still cannot be given to people (phase 4), and the screen says so.

## Evidence (all run in this session, local QA database only)

| Check | Result |
|---|---|
| Backend unit tests | 323 of 323 pass (314 before; 9 new in `test/roleSwitchover.test.js`, 1 line added to `roleEditRules.test.js`) |
| Every built-in role on every route, through the object the server attaches to a request, against the rules before the switchover | Same answers, over 25,000 pairs; only the accepted difference |
| Roles API on the QA server (`qa/sim/roles.mjs`) | 43 of 43, run three times. Includes: a clerk is refused the ledger, the role is given it, the clerk reads it at once with the same sign-in; a right is taken away and refused at once; reset puts both back |
| Off switch (`qa/sim/roles.mjs --matrix-off` against a server started with `ROLE_MATRIX=off`) | 6 of 6: a saved change changes nothing. The same six run against the enforcing server: 3 fail, as they should |
| Roles screens in a browser (`qa/sim/ui-roles.cjs`) | 24 of 24. Includes: the clerk's menu and the executive page open after the role is given them, and close after reset |
| Tests fail when the change is removed | 5 of 5: saved roles ignored (3 tests fail), audience taken from the database (1), route checks by name only (1), saved branch reach ignored (1), own administration pages removable (1) |
| Full gate suite on a rebuilt QA database (`qa/tools/run-gates.sh`) | See below |
| Changing routes with no access rule | 0 of 366 |
| Frontend lint and build | Clean; build succeeds |

### Full gate suite

Pass: three simulation cycles (0 reconciliation problems), security sweep (20 sections; 622 routes with no token, 598 staff routes as a customer), branch boundary 39, phase 2 integrity 82, phase 3 74/74, phase 4 66/66, phase 5 76/76, phase 6 106/106, phase 7 141/141, phase 8 155/155, ten browser suites except one check, phase 9 UI 232/232, screen audit at three sizes, ledger sandbox and its UI, phase 9.5 UI 13/13, phase 9.5 load 16/16, phase 11 scenarios 320/320, phase 12 certification 68/68 with its UI, process and manual checks, baseline probe (630 write calls by read-only roles, 0 not refused).

Not passing, none caused by this phase:

| Item | Why |
|---|---|
| `ui-phase8`: "the invoices screen says who may read invoices" (1 of 56) | The invoices page became a billing page in the roles change of commit 2501e08 (before this work), so the shipping desk sees "No access" instead of the server's sentence. Shown by running the page rule at four commits. The check now accepts either wording; the fix to the check was not rerun in the full suite, NOT VERIFIED |
| Phase 9.5 ledger, 157 of 158 | `LEDGER_ACCOUNT_ADDED` has no audit row in the run. Failed the same way before phase 2 |
| Phase 10, backup and restore group (6 of 20); 257 of 277 overall | Needs a second PostgreSQL server on port 5433, not present in this session. Authentication and roles 36/36, isolation 31/31, API security 40/40, ledger security 41/41 |
| Phase 11 enterprise run: response times over the proposed limits | The committed result before this work has the same flag false. 545 of 545 jobs, 5,181 of 5,181 transactions, books agree, no server error, no deadlock |

NOT VERIFIED: anything on the hosted site. Behaviour with several server copies was run (phase 11, three copies) but the 60-second delay on the other copies was not measured. The menu was checked in one browser at 1440 wide.

## Directive gates

| Gate | Result | Evidence |
|---|---|---|
| A Architecture | PASS | One place holds a role's access (`roleStore`); gate, routes and browser ask it |
| B Functional completeness | CONDITIONAL | Nine handler checks still by name; custom roles not assignable (phase 4) |
| C Cross-layer integrity | PASS | Database, server and menu checked together in the API and browser runs |
| D Data integrity | PASS | No data change; simulation and database checks clean |
| E Security | PASS | Fallbacks never open up; locked roles; audience from code; sweep and probe pass |
| F Reliability | PASS | Unreadable role table falls back to defaults; off switch proven |
| G Performance | NOT ASSESSED | One cached query a minute per server copy; no measurement made |
| H User experience | CONDITIONAL | Notices say when changes apply; one browser, one width |
| I Regression | CONDITIONAL | Full suite run; four items not passing, none from this phase |
| J Documentation | PASS | This report; inventories regenerated |

Readiness: CONDITIONAL. Safe to merge with phase 2; the off switch returns the old behaviour if anything surprises.

## Next

Phase 4: the user screen (extra roles, branches, per-person exceptions, effective access, giving a custom role to a person), with a database update. Phase 5: the nine handler checks above, approve and export rights.
