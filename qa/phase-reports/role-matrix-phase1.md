# Editable role permission matrix, phase 1: catalog and built-in roles

Written 2026-11-20. Plan: "SteelWise: editable role permission matrix (plan)". Owner's decisions of 2026-11-20: super admin, tenant owner and admin edit roles; the grid is area by action; built-in roles can be edited; per-person exceptions; more than one role per person; approval limits by amount are a later follow-up.

## Status: PASS for this phase. Nothing changes for any user.

The running server does not read any of this yet. It still decides from its code. Phase 1 adds the list of permissions, the place to keep them in the database, the built-in roles, and the proof that those roles are today's rules.

## What was built

| Piece | Where |
|---|---|
| Permission catalog: 41 areas, 144 permissions, and the permission each request needs | `src/backend/src/lib/permissionCatalog.js` |
| Deciding from permissions: a request, a page, a person's roles plus exceptions, branch reach | `src/backend/src/lib/permissions.js` |
| The built-in roles, worked out from today's rules (48 roles) | `src/backend/scripts/permission-defaults.js` |
| Database update 19 | `src/backend/prisma/migrations/20261120090000_role_permission_matrix/` |
| SQL Editor file for the owner | `src/backend/prisma/upgrades/sql-editor/20261120090000_role_permission_matrix.sql` |
| Tests (10) | `src/backend/test/permissionMatrix.test.js` |

Database update 19 adds five columns to `Role` (`grants`, `audience`, `branchScope`, `baseRole`, `updatedById`), the table `UserPermissionOverride`, and fills one built-in role per role name. It removes and changes nothing else. Existing `Role` rows keep their name, display name and old `permissions` column.

## Evidence (all run in this session, local QA database only)

| Check | Result |
|---|---|
| Every role on every route: today's rules against the permissions | 31,056 comparisons (48 roles x 647 routes). 15 differ, all the one accepted difference below |
| Every role on every menu page | Over 4,000 comparisons, 0 differ |
| Every role's branch reach | 48 roles, 0 differ |
| Permissions today's rules answer two ways | 0 |
| Database update's roles against today's rules | Identical (test 10) |
| QA database after the update | 49 role rows, 48 built-in, 0 differ from the rules |
| SQL Editor file run twice on a copy of the QA database | Both runs succeeded; the second skipped the update; role rows identical after each; 100 users before and after |
| Schema file against the migrated database (`prisma migrate diff`) | No difference for these tables |
| Backend unit tests | 304 of 304 pass (294 before, 10 new) |
| Tests fail when the thing they guard is broken | 3 of 3: a route sent to the wrong area, a rule changed without refilling the roles, a check that ignores a permission |

NOT VERIFIED: the simulation cycles, the security sweep and the browser suites were not rerun. No file they exercise was changed (two new library files that nothing imports, a script, a test, a database update that adds only).

## The one accepted difference (owner to confirm before phase 3)

Five old role names in the database (SALES, QUALITY, LOGISTICS, FINANCE, VIEWER) belong to no department. The gate judges invoice reading by department, so today it lets these five read invoices through the API, although they have no invoice page. Their built-in roles do not include invoice reading. No login in the QA database holds one of these names. This takes effect only when the server is switched over in phase 3.

## Changes to the plan found while checking it against the code

1. Approve and Export are not grid columns yet. Today nothing at the door of a route decides them; the few approvals (price overrides) are checked inside single handlers. A box that does nothing is not offered. They join the grid when those checks are moved.
2. The catalog lives in the code, not in a database table. A permission is tied to the routes it guards, so a table would only be a second copy to keep in step. The database keeps who holds what.
3. A role's permissions are a new `grants` column on `Role`, not a join table. The old `permissions` column holds dotted strings nothing reads; it is left alone until clean-up.
4. `User.primaryRoleId` is not added yet. Until custom roles can be given to people (phase 4) the built-in role is found by the login's role name, and a column nobody keeps up to date would go stale. It ships with phase 4, so the count of database updates is three: this one, phase 4, clean-up.
5. API reading stays as open as it is today. Any staff login can read most records through the API; only invoices, executive data, the ledger and four admin reports are limited. The View box opens an area's pages. Tightening API reading area by area is a separate decision.
6. Still decided inside handlers, and so not in the grid yet: grades, products and list prices, price override approval, which logins a branch manager may change, and which ledger reports a branch manager reads. Phase 5.

## Directive gates

| Gate | Result | Evidence |
|---|---|---|
| A Architecture | PASS | One catalog, one check; no second copy of the rules is created (the roles are generated from the rules and held to them by a test) |
| B Functional completeness | PASS for the phase | Catalog, storage, built-in roles and proof delivered; the screens are phase 2 |
| C Cross-layer integrity | PASS | Schema, migration and SQL Editor file agree; menu areas and catalog areas agree (test 1) |
| D Data integrity | PASS | Adds only; checks on audience, branch scope, effect and reason; run twice safely |
| E Security | PASS | No access changes; a customer login stays held to the store whatever it is given (test 8) |
| F Reliability | NOT ASSESSED | Nothing runs in the server yet |
| G Performance | NOT ASSESSED | Nothing runs in the server yet |
| H User experience | NOT ASSESSED | No screen in this phase |
| I Regression | CONDITIONAL | 304 unit tests pass; simulations and browser suites not rerun (see above) |
| J Documentation | PASS | This report; comments in each file |

Readiness: PASS to merge when the owner says so. The database update can be applied before or after the merge; nothing depends on it until phase 2.

## Resume here

Phase 2: the Roles list and the role editor (the permission grid), reading and saving `Role.grants`, with the safeguards (no lockout, nobody gives more than they hold, super admin fixed, every change in the audit log). Needs database update 19 applied.
