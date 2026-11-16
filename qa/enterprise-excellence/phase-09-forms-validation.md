# Phase 9: forms and validation

Written by hand in Phase 9 (2026-11-16). Evidence: the forms group of `qa/sim/phase9-ui.cjs` (results in `phase-09-interaction-audit.md`), which works each form in a browser and compares what was saved with the database, and `qa/sim/ui-audit.cjs` for labels.

## What a form must do, and how each rule was checked

| Rule | Checked on | How |
|---|---|---|
| Every field has a label a screen reader can say | Every field on every screen: 280 without one before, 0 now | Audit; held at 0 in the gate run |
| A dialog has a name, opens with the keyboard inside it, and closes on Escape or Cancel with nothing sent | Twelve dialogs (list below) | One scenario per dialog: opens, is named, Tab stays inside, Escape closes it, the server received no write |
| An empty form cannot be saved, and says what is missing | The same twelve | One scenario per dialog: press the save button on the empty form; nothing is created; a field is marked or a message shown |
| A double click saves once | New customer, new job, request for quote, dispatch | Typed once, save pressed twice quickly: one record in the database |
| A refusal from the server is shown as the reason, and what was typed is kept | Customer code already in use; user with a bad email or short password; a return or shipment for an order number not on file | The reason is on screen; the fields still hold the entries; nothing was created |
| A failure of the server is not shown as a success, and nothing typed is lost | New customer; a payment | The save is made to fail: the form says so, keeps every entry, and the list shows no new record; the payment is not shown as paid |
| Required is a property of the field | 22 fields on six screens were marked by a typed asterisk | Changed to required; "a form tells a screen reader what is required and what is wrong" |
| Typed work is not thrown away without asking | Order entry | Leaving by the menu, by Back or by reload asks first; Stay keeps every entry; an untouched form never asks |
| A destructive step asks first, in the application's own dialog | Cancel shipment, dispatch, deactivate user, and the fifteen other confirmations moved off the browser's box | Scenarios for the three named; a static check that no browser box remains |
| A control that cannot work says so | 172 buttons on sample screens; ten forms that announced a save that never happened | Scenarios; static check |

## The twelve dialogs

New customer, add heat, new shipment, receive item, new purchase order, new return, add user, add operator, new request for quote, new work centre, new job, open a package. For each: the three dialog scenarios above. Further scenarios work four of them through to a saved record (customer, purchase order lines, request for quote, heat).

## Faults found by working the forms, and fixed

| Fault | Finding |
|---|---|
| A double click on "Dispatch now" dispatched the shipment and then cancelled it | V-022 |
| The customers page crashed when the server's answer could not be read | V-023 |
| A half-entered order was lost without a word | V-017 |
| Ten forms announced "created", "saved", "booked" or "sent" with nothing saved | V-008 |
| Sixteen confirmations and error messages used the browser's own box | V-009 |
| Required fields marked by a typed asterisk | V-024 |

## Validation: where the rule lives

The server refuses what breaks a rule; that was established and tested in Phases 2 to 8 (prices, quantities, credit, stock, dates, roles) and is unchanged. Phase 9 did not move any rule into the browser and did not remove a server check. The screens add convenience only: a save button that stays off until required entries are in, and the server's reason shown beside the form. No validation was bypassed to make a scenario pass.

## Known to remain

- **Other long forms have no unsaved-work warning** (quote builder, receiving, purchase order entry, customer form): V-018, Phase 12. A typed dialog closed by Escape loses its text; Cancel is expected to.
- **Dialogs open with focus on the dialog, not the first field**: V-029, Phase 12.
- **Field-by-field messages.** Where the server refuses a save the reason is shown once for the form. Marking the exact field in error is done on order entry, customer, user and heat; on other forms it is NOT VERIFIED.
- **The forms not worked by a scenario.** The product has about 100 dialogs. Twelve were worked. The rest were measured for labels and names, and their save paths are covered by the server-side scenarios of Phases 5 to 8, not by a browser.
- **Order entry was not redesigned.** Its fields, steps and order are as before. It gained the unsaved-work guard and labels.
- **Input masks and formats** (phone, postal code, money as typed) were not standardised.
- **Wizards.** The only multi-step flows are order entry, the counter sale and the web checkout. Whether each keeps every entry when the person steps back was checked for order entry only (the unsaved-work scenarios); for the counter sale and the web checkout it is NOT VERIFIED. No new wizard was built.
