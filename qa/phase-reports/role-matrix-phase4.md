# Editable role permission matrix, phase 4: one person's roles and exceptions

Written 2026-11-20. Follows `role-matrix-phase3.md` (merged as pull request 40). The owner said "phase 4".

## Status: CONDITIONAL. Custom roles can be given to people; a person can hold extra roles and personal exceptions.

On Administration, User Management, each person's menu has a new entry, **Roles & access**. It shows and changes:

- **Main role.** The built-in role as before, or a custom role made on Roles & Permissions.
- **Extra roles.** Roles on top of the main role, each with an optional end date. Their permissions are added, and the person sees the widest branch reach among their roles.
- **Exceptions.** One permission given to, or taken from, this one person, with a required reason and an optional end date. Taking away always wins.
- **What they can do.** The resulting grid, read-only. Each tick says which role or exception it comes from.
- **History.** Who changed this person's access, and what they gained or lost.

Changes apply on the server within a minute (at once on the server copy that saved them) and in the person's menu when they next open or refresh the app.

CONDITIONAL because of the three items under "Not in this phase".

## Database update 20 (the owner applies it)

One new table, `UserPrimaryRole`: which people have a custom role as their main role. Nothing is removed or changed.

- SQL Editor file: `src/backend/prisma/upgrades/sql-editor/20261121090000_user_primary_role.sql`
- Rollback: `src/backend/prisma/upgrades/rollback/20261121090000_user_primary_role.down.sql`

Tested on a copy of the QA database: the SQL Editor file run twice (same result, no error, 1,043 users before and after), the rollback run twice, the file applied again, and Prisma then reports the schema up to date.

**The code is safe to deploy before update 20 is applied.** Run in this session with the table removed: sign-in, `/auth/me`, the user list, the user form, the roles screens, extra roles and exceptions all work; only "custom role as main role" answers "Database update 20 has to be applied first" and the dialog says so (`qa/sim/user-access-before-update20.mjs`, 12 of 12).

## One thing that changes at the merge

Extra roles already saved on a login (`UserRoleAssignment`) did nothing until now. From this phase each one adds its role's permissions to that person. The user form has not offered extra roles, so there may be none, but that was not checked on the live database. A read-only query to list them is in the project files: `database-updates/check-extra-roles-before-phase-4.sql`.

## What was built

| Piece | Where |
|---|---|
| One person's access worked out from main role, extra roles and exceptions | `src/backend/src/lib/userAccess.js` (pure) |
| The facts per person, read once a minute, each part failing safe on its own | `userFacts`, `allRoles` in `src/backend/src/lib/roleStore.js` |
| Every request carries the person's own access | `src/backend/src/middleware/auth.js` |
| What may be changed and by whom | `src/backend/src/lib/userAccessRules.js` (pure) |
| Read, change and history of one person's access | `src/backend/src/routes/userAccess.js`: `GET` and `PUT /api/users/:id/access`, `GET /api/users/:id/access/history` |
| Who could still edit roles after a change, counted by whole access | `src/backend/src/lib/accessFacts.js`; the role editor now uses it too |
| A custom role stands on a built-in role (the one it was copied from, else Viewer) | `Role.baseRole`, set in `routes/roles.js` |
| The dialog | `src/frontend/src/pages/Admin/UserAccessDialog.jsx`, opened from `UserManagementPage.jsx` |
| Manual: two new how-to sections | `src/frontend/src/help/manualContent.js` |

How a custom main role works: the login's `role` column becomes the built-in role the custom role stands on, and the custom role's permissions replace that built-in role's. The built-in name still decides the home page and the nine handler checks listed in the phase 3 report. Picking a built-in role in the Role box under Edit User ends the custom main role.

## Safeguards, each with a test that fails without it

- Nobody changes their own roles or exceptions.
- Nobody gives a role that holds a permission they do not hold. The same rule now guards extra roles sent through the old user form API.
- The two locked roles are never given on top of another role. Customer and partner roles are never given to staff. A role that is switched off is not given.
- Super admin and tenant owner logins hold everything; nothing is set on them. Customer and partner logins have their one role.
- Exceptions need the right to edit roles, a reason, a real permission, and a future end date when one is given. A permission given must be one the giver holds.
- A change may not leave the company with no active login that can edit roles.
- An extra role or exception past its end date counts for nothing. A custom main role counts only while it is active and the login still stands on its built-in role.
- Branch managers stay under the existing rules (`lib/userAdminRules.js`): their own branches only, no extra roles.
- Every change is in the audit log with the person's access before and after; a sensitive permission gained or lost is logged as a warning.
- If any part of a person's facts cannot be read, that part counts as empty. Nothing opens up. `ROLE_MATRIX=off` also switches off custom main roles, extra roles and exceptions.

## Evidence (all run in this session, local QA database only)

| Check | Result |
|---|---|
| Backend unit tests | 334 of 334 (323 before; 11 new in `test/userAccess.test.js`) |
| One person's access API on the QA server (`qa/sim/user-access.mjs`) | 48 of 48, run four times. Each step is checked through the person's own sign-in: an extra role opens the ledger at once, a denial closes it again and closes customer edits, a grant opens the executive data, a custom main role takes order entry away, editing that custom role gives it back |
| The dialog in a browser (`qa/sim/ui-user-access.cjs`) | 17 of 17: extra role with end date, a denial with its reason, the result grid, a custom main role, history, the person's own screen, a super admin login |
| Roles API and roles screens (phases 2 and 3) | 43 of 43 and 24 of 24 |
| Before update 20 | 12 of 12 |
| Tests fail when a safeguard is removed | 9 of 10. The tenth (locked role given as an extra) is guarded twice, so removing one guard changes nothing |
| Full gate suite on a rebuilt QA database | See below |
| Changing routes with no access rule | 0 of 367 |
| Frontend lint and build | Clean; build succeeds |

### Full gate suite

Pass: three simulation cycles (0 reconciliation problems), security sweep (20 sections), branch boundary 39, phase 2 integrity 82, phases 3 to 8 (74, 66, 76, 106, 141, 155, all pass), ten browser suites (all pass, including the `ui-phase8` check corrected in phase 3), the four role matrix suites (now part of the gate script), phase 9 UI 232 of 232, screen audit at three sizes (156 screens), ledger sandbox and its UI, phase 9.5 UI and load, phase 11 scenarios 320 of 320, phase 12 certification 68 of 68 with its UI and process checks, baseline probe.

Not passing:

| Item | Why |
|---|---|
| Phase 12 manual check: no chapter for `admin/roles` (1 of 156) | Caused by this work: the roles screen had no manual section. Added two sections; the check rerun alone passes 156 of 156. Not rerun inside the full suite |
| Phase 9.5 ledger, 157 of 158 | `LEDGER_ACCOUNT_ADDED` has no audit row. Same before this work |
| Phase 10 backup and restore group, 6 of 20 | Needs a second PostgreSQL server on port 5433, not present here |
| Phase 11 enterprise run: response times over the proposed limits | Same flag in the committed baseline before this work. 545 of 545 jobs, 5,193 of 5,193 transactions, books agree |

NOT VERIFIED: anything on the hosted site. Whether live logins have extra roles saved. The dialog on a phone. A branch manager using the dialog in a browser (the rules are unit tested and the API refuses; no browser run as a branch manager).

## Not in this phase

- **Previewing a custom role with View as.** The top-bar preview still lists built-in roles only. The role editor's menu preview shows a custom role's menu.
- **A weekly report of who holds sensitive permissions.** Not built.
- **Switching a custom role off from the screen.** The API supports it; the screen offers Delete only.

## Directive gates

| Gate | Result | Evidence |
|---|---|---|
| A Architecture | PASS | Access worked out in one pure file; rules in another; routes load facts and ask |
| B Functional completeness | CONDITIONAL | The three items above |
| C Cross-layer integrity | PASS | Database, server and the person's own screen checked together |
| D Data integrity | PASS | Each change and its audit entry in one transaction; update 20 adds one table |
| E Security | PASS | Safeguards above with failing-without tests; sweep and probe pass |
| F Reliability | PASS | Safe before update 20; unreadable parts count as empty |
| G Performance | NOT ASSESSED | Up to three small cached queries per person per minute per server copy; not measured |
| H User experience | CONDITIONAL | One browser at 1440 wide |
| I Regression | CONDITIONAL | Full suite run; four items not passing, one from this work and fixed |
| J Documentation | PASS | This report, manual sections, inventories regenerated |

Readiness: CONDITIONAL.

## Next

Phase 5: the nine handler checks still decided by role name, approve and export rights, preview of custom roles, retiring the old lists.
