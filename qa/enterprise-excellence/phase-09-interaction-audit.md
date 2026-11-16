# Phase 9: interaction audit

Written by `qa/tools/phase9-docs.cjs` from the result files named in each section. All measurements were taken on a local machine against a local database whose name contains `qa`.

## What was counted

The audit read every control on every screen: 24,795 controls at desktop size on 154 screens. The same screens were read again at tablet size (7,047 controls) and phone size (6,893); these are the same controls drawn again, not more controls. About 10 of those on each screen are the shell (menu, top bar, search), which is the same on every screen. By kind, at desktop size: button 7,553, link 15,402, combobox 290, textbox 131, other 1,134, tab 174, radio 2, checkbox 108, slider 1. The count per screen and per kind is in `qa/results/ui-audit.json`; the totals per screen are in `phase-09-screen-inventory.md`.

## The limit of this audit, stated plainly

Not every one of the 24,795 controls was pressed and its effect read. What was done for every control, and what was done for a part, is below. A control is classed VERIFIED WORKING only where a scenario pressed it and compared the result with the record.

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
| VERIFIED WORKING | Controls a scenario pressed and whose effect it compared with the record or the server's answer | Not counted one by one: 1093 checks in 232 scenarios, plus the 286 checks of the ten earlier browser suites | `qa/results/phase9-ui.json`, `qa/results/ui-*.json` |
| VERIFIED WITH LIMITATIONS | Every other control on a screen that reads real records: named, reachable by keyboard, has an action; its effect was not read by a scenario | 15484 controls on 89 screens, less those above | The six checks above |
| PLACEHOLDER | Controls on the sample screens. 172 buttons with nothing behind them answer "is not built yet. Nothing was saved or sent." Ten that used to announce a save that never happened now say the same | 8090 controls on 58 screens, shell included | Scenarios "a button on a sample screen says it is not built and sends nothing", "a sample form that used to announce a save now says nothing was saved" |
| PERMISSION RESTRICTED | Menu entries, pages and actions a role may not use: not offered in the menu or the search, refused by address, refused by the server | 17 roles, one scenario each, and the role checks in each workflow group | Navigation group; "a scheduler may plan but may not change a price or read invoices"; "an auditor may read invoices and may not record a payment" and others |
| BROKEN | A control that fails when pressed | 14 found by the scenarios and fixed; 0 known now | `phase-09-report.md`, findings V-019 to V-023 and the others named there |
| DISCONNECTED | A control with no action at all | 206 found; 34 connected, 172 are PLACEHOLDER above; 2 "Duplicate" buttons removed and recorded (V-030) | `qa/tools/frontend-checks.mjs` reads 0 |
| NOT APPLICABLE | Controls on addresses that only lead elsewhere | 1221 on 7 addresses | Screen inventory |

## The scenarios

232 scenarios, 1093 checks, run in one pass on 2026-11-16T07:13:56.766Z: 232 passed, 0 failed, 0 not applicable.

| Group | Required | Written | Passed | Failed | Not applicable |
|---|---:|---:|---:|---:|---:|
| Navigation, layout and role access | 25 | 43 | 43 | 0 | 0 |
| Forms, dialogs, validation and actions | 35 | 41 | 41 | 0 | 0 |
| CRM, sales, quoting and order intake | 25 | 26 | 26 | 0 | 0 |
| Purchasing, inventory and warehouse | 25 | 27 | 27 | 0 | 0 |
| Manufacturing, scheduling and quality | 25 | 26 | 26 | 0 | 0 |
| Shipping, billing and financial | 25 | 25 | 25 | 0 | 0 |
| Responsive and accessibility | 20 | 20 | 20 | 0 | 0 |
| Error handling, concurrency and recovery | 20 | 24 | 24 | 0 | 0 |
| All | 200 | 232 | 232 | 0 | 0 |

A scenario does not pass because a page draws. Each one acts (signs in at the form, types, presses, tabs) and compares what the screen then shows with the record in the database or the answer the server sent, or checks that nothing was sent when nothing should be.

### Every scenario

| No. | Group | Scenario | Checks | Result |
|---:|---|---|---:|---|
| 1 | NAV | a sales representative signs in at the form, starts at /orders, and the menu and the server refuse what the role may not open | 8 | PASS |
| 2 | NAV | a customer service clerk signs in at the form, starts at /orders, and the menu and the server refuse what the role may not open | 8 | PASS |
| 3 | NAV | a saw operator signs in at the form, starts at /shopfloor, and the menu and the server refuse what the role may not open | 10 | PASS |
| 4 | NAV | a production manager signs in at the form, starts at /schedule, and the menu and the server refuse what the role may not open | 9 | PASS |
| 5 | NAV | a scheduler signs in at the form, starts at /schedule, and the menu and the server refuse what the role may not open | 9 | PASS |
| 6 | NAV | a receiving clerk signs in at the form, starts at /receiving, and the menu and the server refuse what the role may not open | 10 | PASS |
| 7 | NAV | a shipping coordinator signs in at the form, starts at /shipping, and the menu and the server refuse what the role may not open | 9 | PASS |
| 8 | NAV | an inventory manager signs in at the form, starts at /units, and the menu and the server refuse what the role may not open | 9 | PASS |
| 9 | NAV | a buyer signs in at the form, starts at /units, and the menu and the server refuse what the role may not open | 9 | PASS |
| 10 | NAV | a quality inspector signs in at the form, starts at /qc, and the menu and the server refuse what the role may not open | 10 | PASS |
| 11 | NAV | an auditor signs in at the form, starts at /, and the menu and the server refuse what the role may not open | 8 | PASS |
| 12 | NAV | a credit manager signs in at the form, starts at /orders, and the menu and the server refuse what the role may not open | 8 | PASS |
| 13 | NAV | a maintenance manager signs in at the form, starts at /, and the menu and the server refuse what the role may not open | 9 | PASS |
| 14 | NAV | a data analyst signs in at the form, starts at /, and the menu and the server refuse what the role may not open | 7 | PASS |
| 15 | NAV | the chief financial officer signs in at the form, starts at /, and the menu and the server refuse what the role may not open | 7 | PASS |
| 16 | NAV | a web shop customer starts in the shop and cannot open a staff page | 5 | PASS |
| 17 | NAV | a deep link opened while signed out comes back after sign-in | 2 | PASS |
| 18 | NAV | the way back after sign-in cannot be pointed at another site | 3 | PASS |
| 19 | NAV | wrong password: a spoken error, the email kept, nobody signed in | 4 | PASS |
| 20 | NAV | signing out clears the session and Back does not bring a page back | 4 | PASS |
| 21 | NAV | every page has its own browser title, taken from its heading | 8 | PASS |
| 22 | NAV | moving between pages by the menu announces the page and moves focus to it | 4 | PASS |
| 23 | NAV | on a record page the menu marks the list the record belongs to | 2 | PASS |
| 24 | NAV | the skip link is the first stop and jumps past the menu | 3 | PASS |
| 25 | NAV | menu sections open and close and say so to a screen reader | 3 | PASS |
| 26 | NAV | search: a page is found by name and opened with the keyboard alone | 4 | PASS |
| 27 | NAV | search: an order is found by its number and opens the order | 3 | PASS |
| 28 | NAV | search: a customer is found by name and the customer list opens filtered to it | 2 | PASS |
| 29 | NAV | search: stock, a heat and a shipment are found by number | 6 | PASS |
| 30 | NAV | search shows a role only the pages and records it may open | 4 | PASS |
| 31 | NAV | search: nothing found says what to try, and Escape closes and clears | 4 | PASS |
| 32 | NAV | search: arrow keys move through results and the choice is announced | 5 | PASS |
| 33 | NAV | search survives the server failing: it says so and still finds pages | 3 | PASS |
| 34 | NAV | the help button opens the instruction manual | 2 | PASS |
| 35 | NAV | the account menu names the signed-in person and their role | 3 | PASS |
| 36 | NAV | an address that is not a page says so and offers a way on | 5 | PASS |
| 37 | NAV | on a phone the menu is a drawer: it opens, traps nothing behind it, and closes on a choice | 6 | PASS |
| 38 | NAV | on a desktop the menu stays put and a click does not open the phone drawer | 4 | PASS |
| 39 | NAV | two branches: each clerk’s order list holds only their own branch’s orders | 5 | PASS |
| 40 | NAV | the counter sale screen shows the initials of the person signed in | 2 | PASS |
| 41 | NAV | the top bar shows no notification the server did not send | 2 | PASS |
| 42 | NAV | the addresses of two retired screens lead to the real ones (U-020, U-028) | 3 | PASS |
| 43 | NAV | the work order list is in the menu and in the search for a planner (V-038) | 3 | PASS |
| 44 | FORM | /customers "New Customer": opens from the keyboard, holds the keyboard, Escape closes, focus returns, nothing is saved | 9 | PASS |
| 45 | FORM | /heats "Add Heat": opens from the keyboard, holds the keyboard, Escape closes, focus returns, nothing is saved | 9 | PASS |
| 46 | FORM | /shipping "New shipment": opens from the keyboard, holds the keyboard, Escape closes, focus returns, nothing is saved | 9 | PASS |
| 47 | FORM | /receiving "Receive item": opens from the keyboard, holds the keyboard, Escape closes, focus returns, nothing is saved | 9 | PASS |
| 48 | FORM | /purchase-orders "New purchase order": opens from the keyboard, holds the keyboard, Escape closes, focus returns, nothing is saved | 9 | PASS |
| 49 | FORM | /orders/returns "New return": opens from the keyboard, holds the keyboard, Escape closes, focus returns, nothing is saved | 9 | PASS |
| 50 | FORM | /admin/users "Add User": opens from the keyboard, holds the keyboard, Escape closes, focus returns, nothing is saved | 9 | PASS |
| 51 | FORM | /admin/staff "Add Operator": opens from the keyboard, holds the keyboard, Escape closes, focus returns, nothing is saved | 9 | PASS |
| 52 | FORM | /sales/rfq-inbox "New RFQ": opens from the keyboard, holds the keyboard, Escape closes, focus returns, nothing is saved | 9 | PASS |
| 53 | FORM | /shopfloor "New Work Center": opens from the keyboard, holds the keyboard, Escape closes, focus returns, nothing is saved | 9 | PASS |
| 54 | FORM | /order-board "New Job": opens from the keyboard, holds the keyboard, Escape closes, focus returns, nothing is saved | 9 | PASS |
| 55 | FORM | /material-tracking/packages "Open a package": opens from the keyboard, holds the keyboard, Escape closes, focus returns, nothing is saved | 9 | PASS |
| 56 | FORM | /customers "New Customer": an empty form cannot be saved and says what is missing | 4 | PASS |
| 57 | FORM | /heats "Add Heat": an empty form cannot be saved and says what is missing | 4 | PASS |
| 58 | FORM | /shipping "New shipment": an empty form cannot be saved and says what is missing | 4 | PASS |
| 59 | FORM | /receiving "Receive item": an empty form cannot be saved and says what is missing | 4 | PASS |
| 60 | FORM | /purchase-orders "New purchase order": an empty form cannot be saved and says what is missing | 4 | PASS |
| 61 | FORM | /orders/returns "New return": an empty form cannot be saved and says what is missing | 4 | PASS |
| 62 | FORM | /admin/users "Add User": an empty form cannot be saved and says what is missing | 4 | PASS |
| 63 | FORM | /admin/staff "Add Operator": an empty form cannot be saved and says what is missing | 4 | PASS |
| 64 | FORM | /sales/rfq-inbox "New RFQ": an empty form cannot be saved and says what is missing | 4 | PASS |
| 65 | FORM | /shopfloor "New Work Center": an empty form cannot be saved and says what is missing | 4 | PASS |
| 66 | FORM | /order-board "New Job": an empty form cannot be saved and says what is missing | 4 | PASS |
| 67 | FORM | /material-tracking/packages "Open a package": an empty form cannot be saved and says what is missing | 4 | PASS |
| 68 | FORM | a new customer typed once and saved with a double click is stored once | 4 | PASS |
| 69 | FORM | a customer code already in use is refused with the reason, and what was typed is kept | 4 | PASS |
| 70 | FORM | when the server fails on save, the form says so and keeps every entry | 5 | PASS |
| 71 | FORM | a new shipment for an order number that is not on file says so and creates nothing | 3 | PASS |
| 72 | FORM | a new return for an order number that is not on file says so and creates nothing | 3 | PASS |
| 73 | FORM | a new package for an order number that is not on file says so and creates nothing | 3 | PASS |
| 74 | FORM | a new heat: the save button comes on only when the required entries are in | 4 | PASS |
| 75 | FORM | a new purchase order: lines can be added and removed, and a line with no quantity cannot be saved | 4 | PASS |
| 76 | FORM | order entry: leaving with an order half typed asks first, and Stay keeps every entry | 4 | PASS |
| 77 | FORM | order entry: choosing to leave does leave, and an untouched form never asks | 3 | PASS |
| 78 | FORM | order entry: closing or reloading the tab with an order half typed brings the browser warning | 3 | PASS |
| 79 | FORM | a button on a sample screen says it is not built and sends nothing | 4 | PASS |
| 80 | FORM | Print on an order sends the order to the printer and the menu is left off the paper | 5 | PASS |
| 81 | FORM | a new user with a malformed email or a short password is refused and not created | 3 | PASS |
| 82 | FORM | a request for quote typed in the dialog is saved once and appears in the list | 4 | PASS |
| 83 | FORM | deactivating a user asks in the application's own box, and Cancel changes nothing | 4 | PASS |
| 84 | FORM | a sample form that used to announce a save now says nothing was saved | 3 | PASS |
| 85 | SALES | the order list shows the orders the server sent, newest first, with customer and total | 6 | PASS |
| 86 | SALES | choosing an order in the list shows its lines, and Enter on the keyboard does the same | 3 | PASS |
| 87 | SALES | an order page shows the number, customer, lines and money exactly as stored | 6 | PASS |
| 88 | SALES | an order page: the tabs work from the keyboard and the history names who did what | 4 | PASS |
| 89 | SALES | an order that does not exist says so, with no blank page and no error | 2 | PASS |
| 90 | SALES | New Order on the order list opens order entry | 2 | PASS |
| 91 | SALES | Refresh on the order list asks the server again and shows an order made meanwhile | 2 | PASS |
| 92 | SALES | the customer list shows the customers the server sent, and the count it reports | 6 | PASS |
| 93 | SALES | searching customers narrows the list to what the server finds for that text | 3 | PASS |
| 94 | SALES | the next page of customers is the server’s second page, and Previous goes back | 4 | PASS |
| 95 | SALES | a customer name holding markup is shown as text and runs nothing | 5 | PASS |
| 96 | SALES | the address /customers?search= opens the list already narrowed | 2 | PASS |
| 97 | SALES | the More actions menu on a customer opens, closes on Escape and gives focus back | 5 | PASS |
| 98 | SALES | the RFQ list shows the requests the server sent for the Open view | 5 | PASS |
| 99 | SALES | the RFQ list: "Won" asks the server for that view and shows only what it sent | 4 | PASS |
| 100 | SALES | the RFQ list: "Lost" asks the server for that view and shows only what it sent | 4 | PASS |
| 101 | SALES | the RFQ list: "All" asks the server for that view and shows only what it sent | 4 | PASS |
| 102 | SALES | opening an RFQ shows what the customer asked for, as stored | 3 | PASS |
| 103 | SALES | the price list search narrows the products shown and clearing it brings them back | 3 | PASS |
| 104 | SALES | the price list shows the list price stored for a product | 1 | PASS |
| 105 | SALES | order entry: the customer lookup finds a customer and puts them on the order | 4 | PASS |
| 106 | SALES | order entry: Submit with no customer and no lines is stopped, says why, and saves nothing | 3 | PASS |
| 107 | SALES | the dashboard’s recent orders are the server’s newest orders, not sample rows | 3 | PASS |
| 108 | SALES | the web shop lists products the server sent and searching narrows them | 4 | PASS |
| 109 | SALES | the web shop: a customer’s order list holds only that customer’s orders | 3 | PASS |
| 110 | SALES | the web checkout takes no card and says the order is on account | 2 | PASS |
| 111 | STOCK | the stock list shows the items the server sent, with heat, grade and location | 6 | PASS |
| 112 | STOCK | searching stock narrows the list to what the server finds, and an unknown number says so | 3 | PASS |
| 113 | STOCK | a stock item opens from its row with the keyboard and shows what is on file | 5 | PASS |
| 114 | STOCK | stock reserved for an order shows as reserved and not available, as the server holds it | 3 | PASS |
| 115 | STOCK | a stock item: "Move" opens a named dialog, cannot be saved empty, and Cancel changes nothing | 5 | PASS |
| 116 | STOCK | a stock item: "Correct quantity" opens a named dialog, cannot be saved empty, and Cancel changes nothing | 5 | PASS |
| 117 | STOCK | a stock item: "Put on hold" opens a named dialog, cannot be saved empty, and Cancel changes nothing | 5 | PASS |
| 118 | STOCK | a stock item: "Edit" opens a named dialog, cannot be saved empty, and Cancel changes nothing | 4 | PASS |
| 119 | STOCK | a quantity correction made on screen is stored once with its reason and shows in the history | 6 | PASS |
| 120 | STOCK | a branch’s stock list holds only that branch’s stock | 5 | PASS |
| 121 | STOCK | the heat list shows the heats the server sent and searching narrows it | 6 | PASS |
| 122 | STOCK | a heat page shows its grade and its stock items, and the tabs can be worked by keyboard | 5 | PASS |
| 123 | STOCK | receiving lists what is expected from open purchase orders and what was received, from the server | 4 | PASS |
| 124 | STOCK | receiving an item on screen: an unknown heat is said first, then a real item is stored once and listed | 6 | PASS |
| 125 | STOCK | the receipts search narrows the list and says when nothing matches | 2 | PASS |
| 126 | STOCK | the purchase order list shows the orders the server sent, with supplier and total | 6 | PASS |
| 127 | STOCK | a purchase order opens from its row and shows its lines and total as stored | 5 | PASS |
| 128 | STOCK | the Supply position tab shows figures from the server and the tabs keep their place | 4 | PASS |
| 129 | STOCK | a receiving clerk may receive but may not raise or change a purchase order | 3 | PASS |
| 130 | STOCK | the packing list of packages shows what the server sent | 5 | PASS |
| 131 | STOCK | the stock list pages: the second page is the server’s second page | 3 | PASS |
| 132 | STOCK | stock columns have headers a screen reader can use, and status is said in words | 3 | PASS |
| 133 | STOCK | the stock upload dialog explains its steps and cannot continue without a choice | 3 | PASS |
| 134 | STOCK | a buyer starts at stock and can reach purchase orders; a clerk in sales cannot receive | 3 | PASS |
| 135 | STOCK | Refresh on the stock list shows an item received meanwhile, without reloading the page | 3 | PASS |
| 136 | STOCK | a receiving clerk cannot correct a quantity: the server refuses, and the screen does not pretend it worked | 3 | PASS |
| 137 | STOCK | an item on its way to another branch says In Transit on its row in the stock list (K-014) | 2 | PASS |
| 138 | MAKE | the work order list shows the work orders the server sent | 4 | PASS |
| 139 | MAKE | the work order search narrows the list on screen and an unknown number says so | 2 | PASS |
| 140 | MAKE | a work order opens from its row by keyboard and shows the stored source item and weights | 4 | PASS |
| 141 | MAKE | a work order that does not exist says so | 2 | PASS |
| 142 | MAKE | a new work order cannot be created without a source item, and says so | 3 | PASS |
| 143 | MAKE | the schedule shows only the manager’s own branch’s work centres, and the jobs the server sent for the day | 4 | PASS |
| 144 | MAKE | the schedule: Next Day and Previous Day ask the server for that day, and Today comes back | 4 | PASS |
| 145 | MAKE | the schedule: the Queue View tab lists jobs waiting, by keyboard | 3 | PASS |
| 146 | MAKE | the order board shows real jobs in the column of their stored status | 4 | PASS |
| 147 | MAKE | a job card opens with Enter and shows the stored customer and operation, and Escape closes it | 5 | PASS |
| 148 | MAKE | the order board search narrows the cards to jobs matching the text | 2 | PASS |
| 149 | MAKE | a job page shows its history with who did each step, as stored | 4 | PASS |
| 150 | MAKE | Change status on a job offers only real next steps and Cancel changes nothing | 3 | PASS |
| 151 | MAKE | a job at another branch cannot be opened by address | 3 | PASS |
| 152 | MAKE | the quality station: the counts and the queue are the server’s | 4 | PASS |
| 153 | MAKE | the quality station tabs each show what the server sent for them | 4 | PASS |
| 154 | MAKE | a saw operator cannot record a quality result: the server refuses and the queue offers no way round | 2 | PASS |
| 155 | MAKE | the shop floor lists the work centres of the operator’s branch and opens one | 4 | PASS |
| 156 | MAKE | an operator sees no button to create a work centre that the server would refuse | 3 | PASS |
| 157 | MAKE | the production board lists real jobs under their stored stage | 3 | PASS |
| 158 | MAKE | the time report: tabs, filters and the totals come from the server, and the export holds the same rows | 5 | PASS |
| 159 | MAKE | the New Job dialog: a job typed once and saved with a double click is stored once | 3 | PASS |
| 160 | MAKE | the bills of material screen says plainly that it is a sample and saves nothing | 3 | PASS |
| 161 | MAKE | the manufacturing lists can be read on a tablet without the page scrolling sideways | 8 | PASS |
| 162 | MAKE | a scheduler may plan but may not change a price or read invoices | 3 | PASS |
| 163 | MAKE | a full column on the order board draws its first cards and offers the rest | 4 | PASS |
| 164 | SHIP | the shipment list shows the shipments the server sent | 4 | PASS |
| 165 | SHIP | searching shipments narrows the list to what the server finds, and nothing found says so | 3 | PASS |
| 166 | SHIP | a shipment opens from its row by keyboard and shows the stored order, customer and quantities | 4 | PASS |
| 167 | SHIP | Dispatch asks first, and a double click on Dispatch now ships once and raises one invoice | 7 | PASS |
| 168 | SHIP | two people on one shipment: the second Dispatch is told it already left and nothing is billed twice | 5 | PASS |
| 169 | SHIP | a shipment with no stock reserved cannot be dispatched and the screen says what to do | 4 | PASS |
| 170 | SHIP | delivery cannot be saved without who received it; with a name it is stored once | 4 | PASS |
| 171 | SHIP | Cancel shipment asks first; No keeps it, Yes cancels it once and leaves the stock reserved to the order | 5 | PASS |
| 172 | SHIP | the packing list and the bill of lading open as papers with the stored lines, and print without the app around them | 6 | PASS |
| 173 | SHIP | carrier and truck details typed on screen are stored and shown | 2 | PASS |
| 174 | SHIP | the dock sees that an invoice was raised and its number, and no amount; sales sees the amount | 4 | PASS |
| 175 | SHIP | the invoice list shows the invoices the server sent for the Open view | 5 | PASS |
| 176 | SHIP | the invoice list: "Paid" asks the server for that view and every row fits it | 3 | PASS |
| 177 | SHIP | the invoice list: "Overdue" asks the server for that view and every row fits it | 3 | PASS |
| 178 | SHIP | the invoice list: "All" asks the server for that view and every row fits it | 3 | PASS |
| 179 | SHIP | an invoice opens with every figure as stored: subtotal, tax, freight, total, paid and balance | 6 | PASS |
| 180 | SHIP | a payment larger than the balance is refused; a right one saved with a double click is recorded once | 5 | PASS |
| 181 | SHIP | an auditor may read invoices and may not record a payment | 4 | PASS |
| 182 | SHIP | the invoices page tells a shop role who may read invoices, and shows none | 2 | PASS |
| 183 | SHIP | “Owed by age” shows the server’s figures for what customers owe | 2 | PASS |
| 184 | SHIP | the returns list shows the returns the server sent, with their value | 2 | PASS |
| 185 | SHIP | orders not closed: a filter asks the server and the rows are what it sent | 3 | PASS |
| 186 | SHIP | a shipment of another branch cannot be opened by address | 3 | PASS |
| 187 | SHIP | on a phone a shipment can be read and dispatched: nothing runs off the screen and the buttons are big enough | 5 | PASS |
| 188 | SHIP | a lost load can be ended only by a manager: the dock is told so and nothing is credited | 3 | PASS |
| 189 | FIT | /orders fits five screen sizes, from a wide monitor to a small phone, with nothing out of reach | 15 | PASS |
| 190 | FIT | /customers fits five screen sizes, from a wide monitor to a small phone, with nothing out of reach | 15 | PASS |
| 191 | FIT | /units fits five screen sizes, from a wide monitor to a small phone, with nothing out of reach | 15 | PASS |
| 192 | FIT | /shipping fits five screen sizes, from a wide monitor to a small phone, with nothing out of reach | 15 | PASS |
| 193 | FIT | /orders/invoices fits five screen sizes, from a wide monitor to a small phone, with nothing out of reach | 15 | PASS |
| 194 | FIT | with text at twice the size the main screens still do not scroll sideways | 6 | PASS |
| 195 | FIT | on a phone a wide table scrolls inside its own frame and keeps its headers | 6 | PASS |
| 196 | FIT | on a phone every button and link in the main lists is big enough for a finger | 4 | PASS |
| 197 | FIT | on a tablet the menu is put away and the page uses the whole width | 3 | PASS |
| 198 | FIT | a phone turned sideways: a dialog fits the height and its buttons can be reached | 2 | PASS |
| 199 | FIT | signing in and opening a page needs no mouse | 2 | PASS |
| 200 | FIT | the keyboard’s place is always visible: every stop of the first twenty has a focus ring | 2 | PASS |
| 201 | FIT | each main screen has one heading, one main area, a named menu and a search landmark | 10 | PASS |
| 202 | FIT | on the main screens no control is without a name and no field without a label | 10 | PASS |
| 203 | FIT | text on the main screens is readable against its background (4.5 to 1, or 3 to 1 for large text) | 6 | PASS |
| 204 | FIT | a person who asks for less motion gets none: dialogs and the menu do not animate | 2 | PASS |
| 205 | FIT | a form tells a screen reader what is required and what is wrong | 4 | PASS |
| 206 | FIT | messages that appear by themselves are announced, and the page can be zoomed | 2 | PASS |
| 207 | FIT | tables say which column is which: header cells are real headers on every main list | 6 | PASS |
| 208 | FIT | pictures and icons: none is read out as noise, none is missing its description | 4 | PASS |
| 209 | FAIL | /orders: when the server fails, the screen says so in words, invents no records, and loads again once the server is back | 5 | PASS |
| 210 | FAIL | /customers: when the server fails, the screen says so in words, invents no records, and loads again once the server is back | 5 | PASS |
| 211 | FAIL | /units: when the server fails, the screen says so in words, invents no records, and loads again once the server is back | 5 | PASS |
| 212 | FAIL | /shipping: when the server fails, the screen says so in words, invents no records, and loads again once the server is back | 5 | PASS |
| 213 | FAIL | /work-orders: when the server fails, the screen says so in words, invents no records, and loads again once the server is back | 5 | PASS |
| 214 | FAIL | /orders/invoices: when the server fails, the screen says so in words, invents no records, and loads again once the server is back | 5 | PASS |
| 215 | FAIL | /customers: when there is nothing to list, the screen says there is nothing, not that something failed | 4 | PASS |
| 216 | FAIL | /units: when there is nothing to list, the screen says there is nothing, not that something failed | 4 | PASS |
| 217 | FAIL | /shipping: when there is nothing to list, the screen says there is nothing, not that something failed | 4 | PASS |
| 218 | FAIL | /work-orders: when there is nothing to list, the screen says there is nothing, not that something failed | 4 | PASS |
| 219 | FAIL | a slow server: the list says it is loading, then shows the records | 3 | PASS |
| 220 | FAIL | the connection drops: the screen says so, does not crash, and works again when it is back | 3 | PASS |
| 221 | FAIL | the session ends in the middle of work: the person is told, signs in, and is back on the same page | 5 | PASS |
| 222 | FAIL | signed out in another tab: the next page asked for leads to sign-in, and shows nothing | 2 | PASS |
| 223 | FAIL | a role loses a permission mid-session: the screen says it is not allowed, and shows no stale records as if current | 3 | PASS |
| 224 | FAIL | an answer that is not what the screen expects does not blank the page | 3 | PASS |
| 225 | FAIL | a record that is not on file says so on its own page: stock, heat, shipment, job | 8 | PASS |
| 226 | FAIL | the order save helper sends the version it read, and the server refuses a save made from an older one | 3 | PASS |
| 227 | FAIL | two people cancel and dispatch the same shipment at once: one wins, the other is told, the books agree | 3 | PASS |
| 228 | FAIL | a payment the server fails to save is not shown as paid, and the amount typed is kept | 4 | PASS |
| 229 | FAIL | Back and Forward move between a list and a record without errors or a second save | 4 | PASS |
| 230 | FAIL | too many requests: the screen says to wait, and does not show an empty list as if there were no records | 2 | PASS |
| 231 | FAIL | a long round of 24 screens in one tab: no page error, no failed call, no screen left blank | 4 | PASS |
| 232 | FAIL | dashboards show no figure the server did not send: with the server failing, no tile shows a number | 7 | PASS |

## Proof that the scenarios catch the fixes

Each fix was taken out of the source, the scenario run, and the source put back (`qa/tools/phase9-mutations.cjs`). 27 of 27 made a scenario fail.

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
| 26 | Work Orders is in the menu | the work order list is in the menu | HOLDS: 1 of 1 fail (Work Orders is in the menu), run after the fix was added |
| 27 | web shop preferences are not asked on staff screens | a long round of 24 screens | HOLDS: 1 of 1 fail (no staff screen asks for a web shop customer's preferences: 48 calls), run after the check was added to the scenario |

