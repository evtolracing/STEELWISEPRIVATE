# Phase 9: navigation review

Written by hand in Phase 9 (2026-11-16). Evidence: the navigation group of `qa/sim/phase9-ui.cjs` (results in `phase-09-interaction-audit.md`), `qa/sim/ui-audit.cjs`, and a read of `components/layout/` and `config/navigation.jsx`.

## The shell before Phase 9

| Part | State found |
|---|---|
| Search box in the top bar | Took typing and did nothing (V-001) |
| Help icon, settings icon in the menu | No action (V-002) |
| Notifications bell | A fixed count and three invented notices, the same for everyone (V-003) |
| Browser title | "SteelWise ERP" on 130 of 130 screens (V-004) |
| Main heading | Missing on 129 of 130 screens |
| An address that is not a page | Showed the dashboard (V-014) |
| A session that ends | Sign in again and land on the home page (V-005) |
| After sign-in | Everyone on the same dashboard (V-016) |
| The menu on a phone | Outside any landmark; Tab left it for the page behind (V-015) |
| Keyboard | No skip link; focus stayed where it was on a change of page; rows opened only on a click (V-012) |

## The shell now

| Part | Behaviour | Scenario |
|---|---|---|
| Search | Finds pages of the menu by name and orders, customers, stock, heats and shipments by number or name. Ctrl+K or Command+K from anywhere, arrow keys, Enter. It asks only the lists the role may read, which the server limits by branch | Eight "search" scenarios |
| Help | Opens the instruction manual | "the help button opens the instruction manual" |
| Notifications | Removed: there is no notification service to show (owner decision 5) | "the top bar shows no notification the server did not send" |
| Title and heading | Each page has one main heading and the browser title follows it; a record page is titled with its number | "every page has its own browser title, taken from its heading" |
| Unknown address | "Page not found", with the way back | "an address that is not a page says so and offers a way on" |
| Session end | Told why, and returned to the same page after signing in. The way back accepts only a path inside the application | "the session ends in the middle of work..."; "the way back after sign-in cannot be pointed at another site" |
| Start page | By role (see `phase-09-role-workspaces.md`) | One scenario per role |
| Menu | A navigation landmark named "Main menu" at every size. Sections open and close and say so. The entry for the current page, or for the list a record belongs to, is marked. On a phone it is a drawer that keeps focus and closes on Escape or a choice | "menu sections open and close and say so to a screen reader"; "on a record page the menu marks the list the record belongs to"; the phone and desktop menu scenarios |
| Keyboard | A skip link is the first stop. Focus moves to the content on a change of page and the page is announced | "the skip link is the first stop and jumps past the menu"; "moving between pages by the menu announces the page and moves focus to it" |
| Account menu | Names the person and the role; sign-out clears the session and Back brings nothing back | "the account menu names the signed-in person and their role"; "signing out clears the session and Back does not bring a page back" |
| Old addresses | The second stock list and the old operator screen lead to the real ones | "the addresses of two retired screens lead to the real ones (U-020, U-028)" |

## The menu itself

Eighteen sections for an administrator; a role sees only the sections and entries it may open. The sections follow the work: sales and customers, orders, production, inventory, quality, material tracking, shipping; then the sample modules (supplier quality, customer quality, maintenance, safety, training, contractors, executive).

Not changed, and why:

- **The 58 sample screens stay in the menu** beside the real ones, each with its standing notice (U-040). The Phase 9 instruction forbids hiding in place of fixing and owner decision 4 keeps them to be built later. The menu does not mark which entries are samples.
- **The order of sections and the names of entries** are as they were. Renaming or regrouping the menu changes where every user looks for their work; it is the owner's call and none was asked for.
- **No breadcrumbs were added** where a page had none. The menu marks the list a record belongs to, the browser title names the record, and Back works.
- **No "recent" or "favourites" list.** The search covers the need to reach a record quickly.

## Cross-branch and cross-role

- Two clerks at two branches each see only their own branch's orders in the list and in the search ("two branches: each clerk's order list holds only their own branch's orders").
- A record of another branch cannot be opened by typing its address: the server refuses and the screen says so (a job, a shipment; scenarios in the manufacturing and shipping groups).
- A page the role may not open is not in its menu, not in its search, and says "No access" by address; the server refuses the call behind it.
- Found and not fixed: the dispatch routes answer another branch's work centres if asked directly (V-028, Phase 10). No screen asks.

## Not verified

- No member of staff was watched finding their way. Whether the section names match the words each branch uses is NOT VERIFIED.
- Deep links from outside (an email, a printed code) were checked for orders and shipments only.
