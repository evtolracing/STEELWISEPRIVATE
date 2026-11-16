# Phase 9: productivity results

Written by `qa/tools/phase9-docs.cjs` from the result files named in each section. All measurements were taken on a local machine against a local database whose name contains `qa`.

The work a task takes was counted by doing it in a browser (`qa/tools/productivity.cjs`, 2026-11-16T05:43:48.570Z). "Keys" are key presses other than typed text. The "before" column was not timed: the screens before Phase 9 are no longer running, so each entry says where its count comes from.

| Task | Before Phase 9 | Now: clicks | Keys | Characters typed | Time | Note |
|---|---|---:|---:|---:|---:|---|
| find an order by its number and open it, from any screen | 2 clicks to reach the list (menu section, Orders), then paging through the list by eye: the search box in the top bar did nothing and the list could not be searched by number on the server. An order off the first page could not be found by number (counted from the code before Phase 9; not re-run) | 0 | 2 | 8 | 2431 ms | 1239 ms after the page was up |
| a shipping coordinator signs in and reaches the shipping desk | Sign in, wait for the general dashboard, 2 clicks (menu section, Shipping), wait for the page (counted from the code before Phase 9; not re-run) | 0 | 1 | 32 | 1530 ms | lands on /shipping |
| reach the page content by keyboard, past the menu | One Tab press for each control in the top bar and the menu (the number of stops is measured now, on the same shell) | 0 | 2 | 0 | 1624 ms | 122 stops stand before the content without the skip link |
| open a stock item from the list without a mouse | Not possible: a row answered only to a mouse (static scan before: 87 such rows and cards) | 0 | 1 | 0 | 1799 ms | Enter on the focused row; before, a row answered only to a mouse |
| come back to the same page after the session ends | Sign in, land on the home page, find the page again (2 or more clicks), and re-enter anything typed (reproduced in a browser before the fix) | 0 | 1 | 29 | 1080 ms | back on Invoices with no further step |

## Other changes that save steps, verified by scenarios and not timed

| Change | Saves | Scenario |
|---|---|---|
| Each role starts at its own workspace | One navigation at every sign-in for sales, planning, shop, stock, receiving, dock and quality staff | One per role in the navigation group |
| A half-entered order asks before it is thrown away | Re-keying an order after a mistaken click, Back or reload | The three "order entry:" scenarios |
| Dispatch acts once on a double click | A cancelled shipment to put right | "Dispatch asks first, and a double click on Dispatch now ships once and raises one invoice" |
| The shop floor opens on the operator's branch | Choosing the branch at each visit | "the shop floor lists the work centres of the operator's branch and opens one" |
| The order page shows the stored total with freight and the customer's name | Opening the invoice to quote a total; a wrong total quoted | "an order page shows the number, customer, lines and money exactly as stored" |
| A stock item in transit says so in the list | Opening the item to learn why it cannot be sold | "an item on its way to another branch says In Transit on its row in the stock list (K-014)" |
| The customer list opens already narrowed from a search result | Typing the name a second time | "the address /customers?search= opens the list already narrowed" |

## Not measured

- No member of staff was timed. Every figure is a script in a browser on a local machine.
- Order entry itself (fields, steps and time for a typical order) was not shortened in this phase and was not measured before and after.
- Training time, error rates in real use and satisfaction: NOT VERIFIED.

