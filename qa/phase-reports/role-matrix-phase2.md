# Editable role permission matrix, phase 2: the role editor

Written 2026-11-20. Follows `role-matrix-phase1.md`. Database update 19 was applied by the owner on 2026-11-19 (his time). The owner confirmed that the five old role names lose invoice reading at the switchover.

## Status: PASS for this phase. What is saved is recorded but not enforced yet.

Administrators can now see every role, open it, and change what it may do in a grid. The server still decides from its code until phase 3 switches it over; both screens say so in a notice at the top.

## What was built

| Piece | Where |
|---|---|
| Roles API: grid, list, one role, history, create, save, reset, delete | `src/backend/src/routes/roles.js` (mounted at `/api/users/roles`; replaces the four old role routes in `routes/users.js`) |
| The rules for changing a role | `src/backend/src/lib/roleEditRules.js` |
| What a built-in role is reset to (generated from today's rules) | `src/backend/src/lib/builtinRoleDefaults.js` |
| Roles list and role editor: grid, tick-all per group, other rights, branch reach, compare, menu preview, confirm, history, reset | `src/frontend/src/pages/Admin/RolesPage.jsx`, menu entry "Roles & Permissions", page `/admin/roles` |
| Tests | `src/backend/test/roleEditRules.test.js` (10), `qa/sim/roles.mjs` (32 API checks), `qa/sim/ui-roles.cjs` (19 browser checks) |

No database change in this phase.

## Safeguards, each with a test that fails without it

- Only super admin, tenant owner and admin change roles. Everyone else is refused by the server.
- The super admin and tenant owner roles always hold everything and cannot be changed by anyone.
- Nobody gives a permission they do not hold. An administrator cannot tick "Start and stop the books".
- Nobody takes role editing away from their own role, and a change may not leave nobody who can edit roles.
- A built-in role is never deleted or switched off. A role people hold is not deleted until they are moved.
- A customer or partner role holds the web shop only.
- Every create, save, reset and delete is in the audit log with the role before and after; a change to a sensitive permission is logged as a warning.
- Nothing is changed while previewing another role (View as).

## Also fixed: screens that needed database update 19

Phase 1 changed the role table's definition. Until update 19 was applied, the role list on the user form and opening a login with extra roles would have failed. The owner applied update 19 within minutes and the production error log showed no failure. So that it cannot recur with a later update: the user routes now name the role columns they read, and the role list falls back to the old columns with a plain "database update 19 has to be applied first" message for everything else.

## Evidence (all run in this session, local QA database only)

| Check | Result |
|---|---|
| Backend unit tests | 314 of 314 pass (304 before, 10 new) |
| Every role on every route, today's rules against the permissions, with the new role routes included | Still only the one accepted difference |
| Roles API on the QA server | 32 of 32 pass, run twice; built-in roles identical to their defaults afterwards |
| Roles screens in a browser (administrator and clerk) | 19 of 19 pass |
| Tests fail when a safeguard is removed | 3 of 3: locked roles, giving what you do not hold, removing your own role editing |
| Changing routes with no access rule (`qa/tools/access-coverage.mjs`) | 0 |
| Frontend lint and build | Clean; build succeeds |

NOT VERIFIED: the simulation cycles, the security sweep and the other browser suites were not rerun. `routes/users.js` changed (the role routes moved out, role columns named); the user screens were not retested in a browser beyond the role list.

## Not in this phase

- A weekly report of who holds sensitive permissions (plan, Safeguards). Not built.
- Switching a custom role off from the screen. The API supports it; the screen offers Delete only.
- Giving a custom role to a person, per-person exceptions, effective access: phase 4.

## Directive gates

| Gate | Result | Evidence |
|---|---|---|
| A Architecture | PASS | Rules in one pure file; routes load facts and ask it; the screen draws the server's catalog |
| B Functional completeness | CONDITIONAL | Editor complete; the two items above are not built |
| C Cross-layer integrity | PASS | Screen, API and database checked together by the browser run |
| D Data integrity | PASS | Saves and their audit entry in one transaction; unknown permissions refused |
| E Security | PASS | Safeguards above; 0 routes without a rule |
| F Reliability | PASS | A missing database update gives a plain 503, not an error page |
| G Performance | NOT ASSESSED | |
| H User experience | CONDITIONAL | Checked at 1440 wide in one browser; not checked on a phone |
| I Regression | CONDITIONAL | Unit tests pass; other suites not rerun |
| J Documentation | PASS | This report |

Readiness: PASS to merge when the owner says so.

## Resume here

Phase 3: switch the server over. The gate, the menu and `/auth/me` read `Role.grants` through one `can()` check, with a cache that clears when a role changes. The old-against-new proof must still hold at the switch.
