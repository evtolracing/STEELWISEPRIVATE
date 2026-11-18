# Phase 10: role-based access audit

Three layers decide what a staff login may do. Each was read and tested; none was weakened.

1. **The access gate** (`src/backend/src/lib/roleAccess.js`, applied in `app.js` as `apiGate`): a department rule per address prefix. Changing calls need a role of that department. Reads under `/api/admin` and `/api/v1/admin` are open to any signed-in staff login. `qa/tools/access-coverage.mjs` fails if a changing route has no rule; it reports 0.
2. **Route guards**: `requireRole(...)`, which always admits the administrator roles `SUPER_ADMIN`, `TENANT_OWNER`, `ADMIN`, `BRANCH_MANAGER`, `OPS_MANAGER`, and narrower guards such as the ledger's `finance` and `reader`.
3. **Record scope**: the branch-scoped Prisma client (`lib/branchScope.js`) and the customer-account scope of the store routes (`phase-10-tenant-isolation.md`).

## Changes in this phase

| Finding | Before | After |
|---|---|---|
| Y-019 | Any staff login could read partners, partner keys, webhooks and deliveries under `/api/v1/admin/partners` | Administrator roles only, reads included |
| Y-013 | Register by a signed-in administrator skipped the role rules | Same rules as the Users screen |
| Y-015 | Login guard fields shown to every colleague | Shown to `SUPER_ADMIN`, `TENANT_OWNER`, `ADMIN`, `BRANCH_MANAGER` and the person |
| Y-017 | "Revoked by" taken from a header | The signed-in person |

## Tested by role (group 1 and group 4 of the Phase 10 suite)

| Who | Refused | Allowed |
|---|---|---|
| Sales rep | Administration, partner administration, the books, the system checks, adding a login | Own sales work |
| Customer login | Every staff route, the books, the checks, users, orders, invoices, inventory | The store and account portal of its own account |
| Branch manager | Making a super administrator or an administrator, changing their own role, exporting the books, running a reconciliation, writing or posting entries | Their branches' records and books |
| Administrator | Making an owner or a super administrator | Users below them |
| Auditor, executive, sales, branch manager, administrator | Writing, posting or reversing an entry, closing a month | Reading what their role may read |
| CFO | Posting their own draft (two people) | Finance work |

The full role-by-area table is `permissions-matrix.md` (generated from the routes, updated this phase).

## Not changed and why

- Reads under `/api/admin` stay open to signed-in staff for the screens that list settings. Partner administration was the only part that showed another party's data; it is now closed. The rest was reviewed: settings lists, integration status, mock-service flags. The system checks (`/api/admin/integrations/checks`) are company administrators only.
- `BRANCH_MANAGER` and `OPS_MANAGER` are administrator roles in `requireRole()`. That is the business's chosen model (Phase 2) and is held to branches by the record scope.
