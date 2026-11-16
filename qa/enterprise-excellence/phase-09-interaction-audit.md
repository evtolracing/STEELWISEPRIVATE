# Phase 9: interaction audit

Written by `qa/tools/phase9-docs.cjs` from the result files named in each section. All measurements were taken on a local machine against a local database whose name contains `qa`.

## What was counted

The audit read every control on every screen at three sizes: 24,400 controls in all, 24,400 at desktop size on 154 screens. About 10 of those on each screen are the shell (menu, top bar, search), which is the same on every screen. By kind, all sizes: button 7,434, link 15,250, combobox 288, textbox 128, other 1,019, tab 170, radio 2, checkbox 108, slider 1. The count per screen and per kind is in `qa/results/ui-audit.json`; the totals per screen are in `phase-09-screen-inventory.md`.

## The limit of this audit, stated plainly

Not every one of the 24,400 controls was pressed and its effect read. What was done for every control, and what was done for a part, is below. A control is classed VERIFIED WORKING only where a scenario pressed it and compared the result with the record.

## Checked on every control, by tool

| Check | Tool | Before | Now |
|---|---|---:|---:|
| Has a name a screen reader can say | `qa/sim/ui-audit.cjs` | 613 on 130 screens | 0 on 154 screens |
| Field has a label | `qa/sim/ui-audit.cjs` | 280 | 0 |
| Button has an action, or says it is not built | `qa/tools/codemods/phase9-not-built.cjs` | 206 with neither | 0 |
| Row or card that opens on a click also opens from the keyboard | `qa/tools/codemods/phase9-clickable.cjs` | 87 mouse only | 0 |
| Uses the application's dialog, not the browser's box | `qa/tools/frontend-checks.mjs` | 26 browser boxes | 0 |
| Large enough to touch on a phone (24 by 24) | `qa/sim/ui-audit.cjs` | 458 too small | 3 |

Each of these is a ratchet in the gate run: the count may fall and may not rise.

## Classes of control

| Class | Which controls | How many | Evidence |
|---|---|---:|---|
| VERIFIED WORKING | Controls a scenario pressed and whose effect it compared with the record or the server's answer | Not counted one by one: see the run checks in  scenarios, plus the 286 checks of the ten earlier browser suites | `qa/results/phase9-ui.json`, `qa/results/ui-*.json` |
| VERIFIED WITH LIMITATIONS | Every other control on a screen that reads real records: named, reachable by keyboard, has an action; its effect was not read by a scenario | 15191 controls on 89 screens, less those above | The six checks above |
| PLACEHOLDER | Controls on the sample screens. 172 buttons with nothing behind them answer "is not built yet. Nothing was saved or sent." Ten that used to announce a save that never happened now say the same | 7999 controls on 58 screens, shell included | Scenarios "a button on a sample screen says it is not built and sends nothing", "a sample form that used to announce a save now says nothing was saved" |
| PERMISSION RESTRICTED | Menu entries, pages and actions a role may not use: not offered in the menu or the search, refused by address, refused by the server | 17 roles, one scenario each, and the role checks in each workflow group | Navigation group; "a scheduler may plan but may not change a price or read invoices"; "an auditor may read invoices and may not record a payment" and others |
| BROKEN | A control that fails when pressed | 14 found by the scenarios and fixed; 0 known now | `phase-09-report.md`, findings V-019 to V-023 and the others named there |
| DISCONNECTED | A control with no action at all | 206 found; 34 connected, 172 are PLACEHOLDER above; 2 "Duplicate" buttons removed and recorded (V-030) | `qa/tools/frontend-checks.mjs` reads 0 |
| NOT APPLICABLE | Controls on addresses that only lead elsewhere | 1210 on 7 addresses | Screen inventory |

## The scenarios

NOT VERIFIED: no full run result on file.

## Proof that the scenarios catch the fixes

Each fix was taken out of the source, the scenario run, and the source put back (`qa/tools/phase9-mutations.cjs`). 25 of 25 made a scenario fail.

| No. | Fix removed | Scenario | Result |
|---:|---|---|---|
| 1 | a double click on Dispatch now no longer cancels | Dispatch asks first | HOLDS: 1 of 1 fail (the screen says it is on the road: ) |
| 2 | the order page shows the money on file | an order page shows the number | HOLDS: 1 of 1 fail (the total: $268.80) |
| 3 | the order page names the customer | an order page shows the number | HOLDS: 1 of 1 fail (the customer: ) |
| 4 | the order list search narrows | search: nothing found says what to try | HOLDS: 1 of 1 fail (says nothing was found: ) |
| 5 | each role starts at its workspace | a sales representative signs in | HOLDS: 1 of 1 fail (starts at the role’s own workspace: /) |
| 6 | a wrong address says Page not found | an address that is not a page | HOLDS: 1 of 1 fail (locator.click: Timeout 12000ms exceeded.) |
| 7 | unsaved order entry asks before leaving | leaving with an order half typed | HOLDS: 1 of 1 fail (locator.click: Timeout 12000ms exceeded.) |
| 8 | the tab warns before reload | closing or reloading the tab | HOLDS: 1 of 1 fail (a typed form warns before reload: 0) |
| 9 | the phone menu is a menu landmark | on a phone the menu is a drawer | HOLDS: 1 of 1 fail (locator.click: Timeout 12000ms exceeded.) |
| 10 | every control shows a focus ring | the keyboard’s place is always visible | HOLDS: 1 of 1 fail (no stop is without a visible ring: Skip to the page \| Jackson • METALS — Cutoff 3:30 \| AI Assistant (Ctrl+J) \|) |
| 11 | rows open from the keyboard | a stock item opens from its row with the keyboard | HOLDS: 1 of 1 fail (Enter on the row opens the item: /units) |
| 12 | an unreadable customer answer is a failure, not a crash | /customers: when there is nothing to list | HOLDS: 1 of 1 fail (it says there is nothing: Oops! Something went wrong) on a rerun of this mutation alone. First attempt: DOES NOT HOLD: 1 of 1 still pass against scenario "an answer that is not what the screen expects" (an HTML answer fails to parse with or without the guard, so that scenario could not catch it) |
| 13 | search offers a role only its own pages | search shows a role only | HOLDS: 1 of 1 fail (the Customers page is not offered to an operator: Pages Customers Sales & Customers Demand Shaping Sales & Cus) |
| 14 | every page has its own title | every page has its own browser title | HOLDS: 1 of 1 fail (/orders: the title is "Orders · SteelWise": SteelWise ERP) |
| 15 | the shop floor starts at the person’s branch | the shop floor lists the work centres | HOLDS: 1 of 1 fail (the branch’s work centre is there: Shop Floor Control Select work center to view queue • 46 work center types ) |
| 16 | required fields say so | a form tells a screen reader | HOLDS: 1 of 1 fail (the required field says so: ) |
| 17 | the way back cannot leave the app | the way back after sign-in cannot be pointed | HOLDS: 1 of 1 fail ("//evil.example/x" is ignored: http://localhost:5199/evil.example/x) |
| 18 | an ended session keeps the way back | the session ends in the middle of work | HOLDS: 1 of 1 fail (told that the session ended: ) |
| 19 | a sample button says it is not built | a button on a sample screen says | HOLDS: 1 of 1 fail (a button answered with the notice: 11 buttons tried) |
| 20 | the menu is left off the paper | Print on an order | HOLDS: 1 of 1 fail (the menu is not printed: ) |
| 21 | less motion when asked | a person who asks for less motion | HOLDS: 1 of 1 fail (no transition lasts longer than a hundredth of a millisecond: 300) |
| 22 | a full board column draws thirty cards at a time | a full column on the order board | HOLDS: 1 of 1 fail (the button says how many are left and draws up to thirty more: Show 30 more of 80: 416 then 416), run alone after the fix was added |
| 23 | a question is asked in the application’s own box | deactivating a user asks | HOLDS: 1 of 1 fail (the application box never opens), run after the fix was added |
| 24 | a sample form does not announce a save | a sample form that used to announce | HOLDS: 1 of 1 fail (no browser box claims a schedule was created: 1 browser boxes), run after the fix was added |
| 25 | an item in transit says so on its row | on its way to another branch | HOLDS: 1 of 1 fail (the row says In Transit), run after the fix was added |

