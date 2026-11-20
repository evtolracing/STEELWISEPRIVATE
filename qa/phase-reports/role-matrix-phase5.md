# Editable role permission matrix, phase 5: clean-up

Written 2026-11-20. Follows `role-matrix-phase4.md` (merged as pull request 41). The owner said "phase 5".

## Status: CONDITIONAL. The rights that followed a role's name are boxes in the grid. No database update.

What a person may do is now decided by the grid for every check a role editor would expect to control.

- **Ten new boxes under "Other rights".** Each was decided inside the server by the name of the person's main role. Each role starts with the ones its name gave it.

| Box | Area | What it guards |
|---|---|---|
| Add and change products | Sales desk | `POST`, `PUT /api/products` |
| Add and change grades | Sales desk | `POST`, `PUT /api/grades` |
| Change a list price (sensitive) | Sales desk | list price on a product, `PUT /api/pricing/list-price/:id`, the Change button on the Pricing page |
| Approve a price override or discount (sensitive) | Sales desk | override review, counter discount approval |
| Change a customer's price tier or credit limit (sensitive) | Customers | `PUT /api/customers/:id/preferences` |
| Release an order from credit hold (sensitive) | Orders | `POST /api/orders/:id/credit-release`, the Release button |
| Correct a stock balance and settle a shortage (sensitive) | Inventory | `POST /api/inventory/adjust`, transfer settle |
| Release a quality hold | Jobs | `PUT /api/work-orders/:id/release-hold` |
| See what operators are paid (sensitive) | Staff | pay rate and emergency contact fields on operators |
| Print a tag again past the limit, void a tag after it left the dock | Drop tags | reprint and void |

- **The user list** shows a login's sign-in guards (wrong-password count, pause, cut-off) to whoever holds "Users: Edit", not to four named roles.
- **Switch off** and **Switch on** for a custom role, on the role's page. A role people hold cannot be switched off.
- **View as** lists custom roles under "Custom roles". The preview holds exactly the custom role's permissions, is view-only, and names the role in the banner.

CONDITIONAL because of the items under "Not done" and the one change at the merge.

## No database update

The plan expected a database update for this phase. None is needed and none ships.

The new boxes had to start ticked for the roles that held the right by name, on a database where every role's permissions are already saved. Instead of rewriting the saved roles, each saved role now carries the version of the grid it was last saved under (one extra entry, `@catalog:2`, in `Role.grants`; `toStore` and `storedRole` in `src/backend/src/lib/roleStore.js`). A role saved before the new boxes existed is read with the new rights its built-in default holds. A custom role uses the default of the built-in role it stands on. The first time someone saves the role, what they ticked is what counts.

So: before anyone touches a role, every person can do exactly what they could. Update 19's seed is unchanged (tested).

## One thing that changes at the merge

Until now the ten rights followed the person's **main** role only. An extra role given on top never carried them. From this phase an extra role gives what its grid shows, including these rights. Example: a clerk who was given Branch Manager as an extra role can now set credit limits.

A read-only query that lists everyone who holds an extra role is in the project files: `database-updates/check-extra-roles-before-phase-5.sql`. No rows means nobody gains anything. It was not run on the live database (NOT VERIFIED there).

## What was built

| Piece | Where |
|---|---|
| The ten permissions, catalog version 2, which version added each | `src/backend/src/lib/permissionCatalog.js` (`CATALOG_VERSION`, `ADDED_IN`, `addedSince`) |
| Which built-in role starts with which new right, from the old name lists | `src/backend/scripts/permission-defaults.js`; `builtinRoleDefaults.js` regenerated |
| Reading and saving a role with its catalog version | `storedRole`, `toStore` in `lib/roleStore.js`; used by `routes/roles.js`, `lib/accessFacts.js` |
| Handler checks by permission | `routes/products.js`, `grades.js`, `intakePricing.js`, `orders.js`, `intakeOrders.js`, `customers.js`, `overrides.js`, `pos.js`, `inventory.js`, `workOrders.js`, `staff.js`, `users.js`, `dropTagRoutes.js` with `services/dropTagService.js` |
| Custom roles in View as | `previewableCustom`, `customPreview`, `requestView` in `lib/viewScope.js`; `middleware/auth.js`; `/auth/me` sends `previewableCustomRoles` and `previewLabel` |
| Screens | `ViewControls.jsx`, `AppLayout.jsx`, `TopBar.jsx`, `Sidebar.jsx` (menu now follows permissions, not only the role name), `RolesPage.jsx` (Switch off), `PricingDashboardPage.jsx` (Change button by permission) |
| Manual | `src/frontend/src/help/manualContent.js`, "How to Change What a Role Can Do" |

## Safeguards, each with a test

- A role saved before the new boxes keeps what its name gave it; a role that never had the right does not get it; once saved, an unticked box stays unticked.
- The catalog mark never reaches the API, the grid, the audit record or the access check.
- The defaults give each money right to exactly the roles in the old `MONEY_MANAGERS` list, products to `COST_VIEWERS`, grades to those plus the quality manager.
- A custom role can be previewed only by a login that may preview and that holds every permission the role holds. A switched-off role, a customer role and a role that does not exist preview nothing.
- A preview of a custom role reads only what the role may read and changes nothing.
- A role people hold cannot be switched off; a switched-off role cannot be given or previewed.
- With the role table unreadable, or `ROLE_MATRIX=off`, the built-in defaults decide, and they hold the new rights for the same roles as before.

## Evidence (all run in this session, local QA database only)

| Check | Result |
|---|---|
| Backend unit tests | 348 of 348 (334 before; 14 new in `test/roleCatalogVersion.test.js`) |
| The rights on the QA server (`qa/sim/role-rights.mjs`) | 137 of 137. A clerk is refused at each door; a custom role with the box ticked opens it; unticking one box closes that door and no other; a personal exception opens one and a denial closes one for a manager; pay fields and credit limits follow the right; preview and switch-off rules |
| Fails without the change | With the stock-correction check put back to role names, 9 of 137 fail |
| The screens in a browser (`qa/sim/ui-role-rights.cjs`) | 19 of 19: boxes ticked per role, sensitive warning on save, reset, Switch off and on, View as a custom role with its banner and menu, the Change button on the price list |
| Roles API, one person's access API, their screens (phases 2 to 4) | 43 of 43, 48 of 48, 24 of 24, 17 of 17 |
| Full gate suite on a rebuilt QA database | GATE_RESULTS |
| Backend and frontend lint | 0 errors |

NOT VERIFIED: anything on the hosted site. Whether live logins hold extra roles. The screens on a phone. Drop tag reprint and void with a custom role (the defaults and the passing of the right are tested; no live reprint past the limit was run as a custom role). The transfer shortage settle door (same check as stock correction, not probed separately).

## Not done

- **Dropping the `User.role` column and the old `Role.permissions` column.** Not done on purpose. `User.role` is still the person's built-in main role: it picks the home page and dashboard and is the base a custom role stands on. Removing either column is a destructive database change with no gain for the owner today.
- **A weekly report of who holds sensitive permissions.** Not built.
- **Approve and Export as grid columns.** Approvals are single rights under "Other rights" instead. Exports follow the area's View box.
- **Still decided by role name, on purpose:** who may manage which logins (`lib/userAdminRules.js`, branch managers and the two top roles), loading demo data (super admin and tenant owner only), customer and partner logins, and which dashboard a role lands on.
- **Approval limits by amount.** Outside this plan, as agreed.

## Directive gates

| Gate | Result | Evidence |
|---|---|---|
| A Architecture | PASS | One catalog, one place that reads and saves a role, handlers ask `can(req, permission)` |
| B Functional completeness | CONDITIONAL | Items under "Not done" |
| C Cross-layer integrity | PASS | Grid, server check and the person's own sign-in tested together |
| D Data integrity | PASS | No schema change; saved roles are read, not rewritten; update 19 seed unchanged |
| E Security | CONDITIONAL | Safeguards tested; extra roles now carry the ten rights (stated above) |
| F Reliability | PASS | Defaults decide when the role table cannot be read |
| G Performance | NOT ASSESSED | No new queries per request; `/auth/me` reads the cached roles once more |
| H User experience | CONDITIONAL | One browser at 1440 wide |
| I Regression | GATE_I |
| J Documentation | PASS | This report, manual section, inventories regenerated |

Readiness: CONDITIONAL.

## Next

The plan's five phases are done. Open: the weekly sensitive-permission report, approval limits by amount, and checking the live site after the merge.
