# Phase 5: sales user-experience efficiency

Date: 2026-11-15. Major visual redesign is Phase 9; this phase changed only what made the sales work slower, wrong or confusing.

## 1. Changes that save steps or prevent rework

| Screen | Before | After | Effect |
|---|---|---|---|
| RFQs & Quotes, new request | Description, quantity, unit only; requirements typed in notes or lost | "Details" per line: grade, thickness, width, length, finish, certificates, processing, other; "Needed by" date | Typed once, carried to quote, order and work order (no retyping at each step) |
| RFQs & Quotes, quote | Total only | "subtotal + tax = total"; line requirements shown | The customer's figure is the order's figure |
| Order entry | Four Michigan branches listed in code; tax at the chosen branch, order filed elsewhere | The person's branches from the server, home branch chosen | No wrong-branch choice; one less field to set for one-branch staff |
| Retail POS | Every sale taxed at Jackson, Michigan | The clerk's home branch | No tax correction after the sale |
| Mobile rep order entry | Fixed branch list | Branches from the server, home first | Same |
| Home page | Invented orders, alerts and figures | Real figures from the records | Staff act on real holds and orders |
| Old Order Hub address | A second console with its own data | Goes to RFQs & Quotes | One place to work requests |
| Customer preferences | Six settings looked active | Each says "Saved for reference. Not applied to any order or price yet." | No false belief that a discount or minimum applies |
| Web order inbox | "Action failed" | The server's reason (for example, choose the customer) | The CSR knows what to do |
| Web checkout | Price silently corrected | The buyer is told the price was updated | Fewer disputes |

## 2. Measured in the browser (`qa/sim/ui-phase5.cjs`, 14 checks, gate run)

Home figures equal the server's; no invented rows; the old Order Hub address goes to the request inbox; order entry starts at the home branch and offers only the login's branches; Retail POS asks tax for the home branch; the request dialog has every requirement field; a quoted request shows requirements and the tax line; no script errors on any of these screens.

## 3. Found and left for Phase 9

| ID | Subject |
|---|---|
| J-013 | Order entry header selects have no accessible name |
| G-020 | Order entry does not warn when someone else changed the order |
| U-041, U-008 | Promise dates from invented rules (also a business decision) |
| E-021 | Two list reply shapes |

## 4. Not measured

Time per task with real users, and tablet layout: NOT VERIFIED. No claim is made about minutes saved.
