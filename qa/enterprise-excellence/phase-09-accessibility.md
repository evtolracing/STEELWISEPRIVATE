# Phase 9: accessibility

Written by `qa/tools/phase9-docs.cjs` from the result files named in each section. All measurements were taken on a local machine against a local database whose name contains `qa`.

**This is not a certificate of conformance to WCAG 2.2 AA.** Automated measures find a part of accessibility faults, never all. No screen reader user and no person using a switch or voice control has tested the product. What follows is what was measured, what was fixed and what is known to remain.

## Measured on every screen

Before: 130 screens (2026-11-16T03:29:34.619Z). Now: 154 screens (2026-11-16T07:25:05.016Z); the later run also opens record pages on real records, which is why it has more.

| Measure | WCAG 2.2 | Before | Now |
|---|---|---:|---:|
| Controls with no name | 4.1.2 | 613 | 0 |
| Fields with no label | 1.3.1, 3.3.2 | 280 | 0 |
| Texts below 4.5 to 1 against their background | 1.4.3 | 1,751 | 17 on 4 screens |
| Screens with no main heading | 1.3.1, 2.4.6 | 129 | 0 |
| Screens sharing a browser title with another | 2.4.2 | 130 | 32 |
| Screens wider than the window at any size | 1.4.10 | 0 | 0 |
| Touch targets under 24 by 24 on a phone | 2.5.8 | 458 | 3 |

Held in the gate run by `qa/tools/ui-audit-gate.cjs` against `qa/ui-audit-ceilings.json`: a count may fall and may not rise.

Screens that still share a title are addresses that show the same page (an old address and its new one, a list and the same list reached from another menu entry, record pages opened on the same record, and unknown record ids that all say "Page not found"). "Page not found · SteelWise" 3; "Shop Floor Control · SteelWise" 2; "Inventory · SteelWise" 2; "Shipping · SteelWise" 2; "SHP-00533 · SteelWise" 2; "RFQs and quotes · SteelWise" 9; "Quality Dashboard · SteelWise" 2; "Production Workflow · SteelWise" 2; "Traceability · SteelWise" 2; "Freight Comparison · SteelWise" 2; "Shipment Tracking · SteelWise" 2; "Orders · SteelWise" 2.

Every screen has a main heading.

### Hard-to-read texts that remain (V-011)

| Colours | Ratio | Texts | Screens | Example |
|---|---:|---:|---:|---|
| #c62828 on #c62828 | 1 | 8 | 1 | UCL |
| #2e7d32 on #2e7d32 | 1 | 4 | 1 | CL |
| #ffffff on #ffffff | 1 | 2 | 1 | 6.4h |
| #d32f2f on #fae5e5 | 4.12 | 1 | 1 | ACTIVE |
| #b45309 on #f6eae0 | 4.23 | 1 | 1 | MITIGATION IN PROGRESS |
| #b45309 on #ede3dc | 3.96 | 1 | 1 | MITIGATION IN PROGRESS |

## Fixed in this phase

| What | Finding | How it is held |
|---|---|---|
| Every control named, every field labelled | V-006, B-015, J-013 | Audit ceiling 0; static check fails on a new unnamed icon button |
| One main heading and its own title on each page; focus moves to the content on a change of page; a skip link | V-004, V-033 | Scenarios; static check fails on a page with no heading |
| 87 rows and cards that opened only on a mouse click open from the keyboard | V-012 | Scenarios; static check |
| A visible focus ring on every control | V-013 | Scenario tabs through twenty stops |
| Colours darkened in the theme to reach 4.5 to 1 | V-010 | Audit ceiling |
| The phone menu is a landmark and keeps focus | V-015 | Scenario |
| Required fields are marked as a property, not a typed asterisk | V-024 | Scenario |
| Browser confirm and alert boxes replaced by named dialogs | V-008, V-009 | Static check reads 0 |
| Less motion when the person asks for it | Theme | Scenario |
| Touch target sizes | V-034 | Audit ceiling |

## Scenarios that use the keyboard or check what a screen reader is told

| Group | Scenario | Result |
|---|---|---|
| NAV | every page has its own browser title, taken from its heading | PASS |
| NAV | moving between pages by the menu announces the page and moves focus to it | PASS |
| NAV | the skip link is the first stop and jumps past the menu | PASS |
| NAV | menu sections open and close and say so to a screen reader | PASS |
| NAV | search: a page is found by name and opened with the keyboard alone | PASS |
| NAV | search: nothing found says what to try, and Escape closes and clears | PASS |
| NAV | search: arrow keys move through results and the choice is announced | PASS |
| FORM | /customers "New Customer": opens from the keyboard, holds the keyboard, Escape closes, focus returns, nothing is saved | PASS |
| FORM | /heats "Add Heat": opens from the keyboard, holds the keyboard, Escape closes, focus returns, nothing is saved | PASS |
| FORM | /shipping "New shipment": opens from the keyboard, holds the keyboard, Escape closes, focus returns, nothing is saved | PASS |
| FORM | /receiving "Receive item": opens from the keyboard, holds the keyboard, Escape closes, focus returns, nothing is saved | PASS |
| FORM | /purchase-orders "New purchase order": opens from the keyboard, holds the keyboard, Escape closes, focus returns, nothing is saved | PASS |
| FORM | /orders/returns "New return": opens from the keyboard, holds the keyboard, Escape closes, focus returns, nothing is saved | PASS |
| FORM | /admin/users "Add User": opens from the keyboard, holds the keyboard, Escape closes, focus returns, nothing is saved | PASS |
| FORM | /admin/staff "Add Operator": opens from the keyboard, holds the keyboard, Escape closes, focus returns, nothing is saved | PASS |
| FORM | /sales/rfq-inbox "New RFQ": opens from the keyboard, holds the keyboard, Escape closes, focus returns, nothing is saved | PASS |
| FORM | /shopfloor "New Work Center": opens from the keyboard, holds the keyboard, Escape closes, focus returns, nothing is saved | PASS |
| FORM | /order-board "New Job": opens from the keyboard, holds the keyboard, Escape closes, focus returns, nothing is saved | PASS |
| FORM | /material-tracking/packages "Open a package": opens from the keyboard, holds the keyboard, Escape closes, focus returns, nothing is saved | PASS |
| FORM | a new heat: the save button comes on only when the required entries are in | PASS |
| FORM | a sample form that used to announce a save now says nothing was saved | PASS |
| SALES | choosing an order in the list shows its lines, and Enter on the keyboard does the same | PASS |
| SALES | an order page: the tabs work from the keyboard and the history names who did what | PASS |
| SALES | the More actions menu on a customer opens, closes on Escape and gives focus back | PASS |
| STOCK | a stock item opens from its row with the keyboard and shows what is on file | PASS |
| STOCK | a stock item: "Move" opens a named dialog, cannot be saved empty, and Cancel changes nothing | PASS |
| STOCK | a stock item: "Correct quantity" opens a named dialog, cannot be saved empty, and Cancel changes nothing | PASS |
| STOCK | a stock item: "Put on hold" opens a named dialog, cannot be saved empty, and Cancel changes nothing | PASS |
| STOCK | a stock item: "Edit" opens a named dialog, cannot be saved empty, and Cancel changes nothing | PASS |
| STOCK | a heat page shows its grade and its stock items, and the tabs can be worked by keyboard | PASS |
| STOCK | stock columns have headers a screen reader can use, and status is said in words | PASS |
| MAKE | a work order opens from its row by keyboard and shows the stored source item and weights | PASS |
| MAKE | the schedule: the Queue View tab lists jobs waiting, by keyboard | PASS |
| MAKE | a job card opens with Enter and shows the stored customer and operation, and Escape closes it | PASS |
| SHIP | a shipment opens from its row by keyboard and shows the stored order, customer and quantities | PASS |
| FIT | the keyboard’s place is always visible: every stop of the first twenty has a focus ring | PASS |
| FIT | each main screen has one heading, one main area, a named menu and a search landmark | PASS |
| FIT | a person who asks for less motion gets none: dialogs and the menu do not animate | PASS |
| FIT | a form tells a screen reader what is required and what is wrong | PASS |
| FIT | messages that appear by themselves are announced, and the page can be zoomed | PASS |

## Known to remain

- 17 hard-to-read texts on 4 screens (V-011, Phase 12).
- Dialogs open with focus on the dialog, not on the first field (V-029). This conforms; it costs one key press.
- Charts (schedule bars, control charts, dashboards) have no text alternative or data table. Not measured by the audit; NOT VERIFIED and likely to fail 1.1.1 on the sample screens that draw charts.
- Drag and drop on the order board and the schedule has a keyboard alternative only where a button or menu does the same move (the board's status menu). 2.5.7 is NOT VERIFIED screen by screen.
- Error messages on forms are announced where the scenarios checked (order entry, customer, user, payment, heat). Every other form is NOT VERIFIED for 3.3.1 and 4.1.3.
- Reading order, meaningful link text, language of parts, timing and re-authentication without data loss beyond the session scenario are NOT VERIFIED.
- No test with NVDA, JAWS, VoiceOver, TalkBack, a switch or voice control. No test by a person with a disability.

