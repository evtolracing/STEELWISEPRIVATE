# Phase 9: role workspaces

Written by hand in Phase 9 (2026-11-16). Evidence: `src/frontend/src/config/roleAccess.js` (`ROLE_START`, `workspaceFor`), and one scenario per role in the navigation group of `qa/sim/phase9-ui.cjs`, each of which signs in at the form as a user of that role created for the run.

## What a workspace is here

The product has one set of screens. A role's workspace is: the screen it starts on, the menu it is shown, the pages it may open by address, the records the server lets it read (its branch), and the actions the server lets it take. Phase 9 added the first and verified the others for fifteen staff roles and a web shop customer. No screen was built for one role only.

Before Phase 9 every role landed on the general dashboard after sign-in.

## Where each role starts

| Roles | Starts at | Why |
|---|---|---|
| Sales director, sales representative, customer service, estimator, credit manager, support agent | Orders | The order list is where their day's work is |
| Production manager, scheduler | Schedule | |
| Work centre lead, saw, router, shear, plasma and general operators, mill operator | Shop floor | Opens on the person's own branch (V-021) |
| Inventory manager, buyer | Inventory | |
| Receiving clerk | Receiving | |
| Shipping coordinator | Shipping | |
| Quality manager, quality inspector | Quality station | |
| Administrators, branch and operations managers, leadership, auditor, data analyst, maintenance and safety roles | Dashboard | They work across areas |
| Web shop customer | The shop | Cannot open a staff page |

A page asked for by address, or the page a person was on when their session ended, wins over the start page. A start page the role cannot open is never used: the rule falls back to the dashboard.

The mapping is the engineer's choice from what each role is allowed to do. It is one table in `config/roleAccess.js` and the owner can change any line.

## What was verified for each role

Each scenario signs in at the sign-in form and checks five things: the person lands on the start page; a page the role should reach opens; pages the role may not open are refused by address with "No access"; those pages are not in the menu; and, for shop, stock, dock and quality roles, the server refuses the invoice list.

| Role tested | Starts at | Also opens | Refused by address | Not in the menu | Server refuses |
|---|---|---|---|---|---|
| Sales representative | Orders | Customers | Users, Schedule | Admin, Schedule, Executive | |
| Customer service clerk | Orders | Shipping | Users, Work orders | Admin, Work orders | |
| Saw operator | Shop floor | Schedule | Customers, Shipping, Users | Customers, Shipping, Admin | Invoices |
| Production manager | Schedule | Shipping | Customers, Users | Customers, Admin | Invoices |
| Scheduler | Schedule | Work orders | Customers, Shipping | Customers, Shipping | Invoices |
| Receiving clerk | Receiving | Inventory | Customers, Schedule, Users | Customers, Schedule, Admin | Invoices |
| Shipping coordinator | Shipping | Receiving | Customers, Quality | Customers, Quality | Invoices |
| Inventory manager | Inventory | Receiving | Customers, Executive | Customers, Executive | Invoices |
| Buyer | Inventory | Purchase orders | Customers, Schedule | Customers, Schedule | Invoices |
| Quality inspector | Quality station | Inventory | Customers, Shipping, Users | Customers, Shipping, Admin | Invoices |
| Auditor | Dashboard | Quality station | Customers, Users | Customers, Admin | |
| Credit manager | Orders | Invoices | Users, Schedule | Admin, Schedule | |
| Maintenance manager | Dashboard | Schedule | Customers, Shipping | Customers, Shipping | Invoices |
| Data analyst | Dashboard | Customers | Users | Admin | |
| Chief financial officer | Dashboard | Invoices | Users | Users | |
| Web shop customer | Shop | Own orders only | Any staff page | | Staff routes |

Results are in `phase-09-interaction-audit.md` (navigation group). The search offers a role only the pages and records it may open ("search shows a role only the pages and records it may open").

Further role checks inside the workflow groups: a scheduler may plan and may not change a price or read invoices; an auditor reads invoices and cannot record a payment; a buyer reaches purchase orders and a sales clerk cannot receive; the dock sees that an invoice exists and no amount; a role that loses a permission in the middle of a session is told and shown no stale records.

## What was not changed

- No permission was removed, added or loosened. The server's rules are the ones that count and are unchanged; the screen list (`config/roleAccess.js`) follows them.
- Roles not in the table above (the remaining operator kinds, branch manager, operations manager, safety roles, the administrator kinds) were not signed in one by one. Their start page comes from the same table and their access from the same rules; their scenario is NOT RUN.
- The dashboard a manager starts on was not redesigned (see `phase-09-dashboard-review.md`).

## Decisions the owner may want to make

1. Whether any role should start somewhere else.
2. Whether branch and operations managers should start on the order board or the operations cockpit instead of the general dashboard.
