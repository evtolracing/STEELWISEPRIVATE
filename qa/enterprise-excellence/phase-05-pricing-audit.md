# Phase 5: pricing audit

Date: 2026-11-15. Local QA databases only. No pricing policy or formula was changed. Two corrections were made to input checking and to where tax is worked out; neither changes what a valid sale costs.

## 1. The rules as built (read from code, confirmed by test)

| Rule | Where | Checked |
|---|---|---|
| List price per product (`basePriceCwt`, per hundredweight for weight items, per piece for each items) | `Product` | Yes |
| A customer's tier (A to D) on the top account maps to a price level: A to CONTRACT_B (0.85), B to CONTRACT_A (0.92), C to VOLUME (0.88), D to RETAIL (1) | `lib/priceRules.js`, `lib/customerPricing.js` | Yes |
| A tier applies only while active and between its dates; otherwise list | same | Yes: ended, not begun and switched off all give list |
| Divisions buy at the top account's tier | `accountTier()` | Yes |
| With a customer, the level sent by the screen is ignored; with no customer (counter price check), it is used | `routes/intakePricing.js` | Yes |
| Remnant: list less the discount fraction; processing costs added once | same | Yes |
| No list price: 422, never priced at zero | same, web shop | Yes |
| Order line total worked from the price unit (CWT, TON, LB, EACH, LF) | `routes/orders.js` | Yes: per hundredweight, per ton, each |
| Totals that do not add up are refused | orders, database rules (Phase 3) | Yes |
| A list price changes only by a manager, recorded with old and new value, used at once in every channel | `PUT /api/pricing/list-price/:id` | Yes |
| An agreed quote price is kept when the contract changes before the customer says yes | `acceptQuote` | Yes |
| Counter: weight items cannot be sold as pieces; whole pieces only; the screen's price is ignored | `routes/quickSale.js` | Yes |
| Web shop: the system price is the price; the buyer is told when it differed (`priceNotices`), and the CSR sees "PRICE CORRECTED" | `services/ecomService.js` | Yes |
| Price list columns equal what is charged at each level | `/api/pricing/price-list` | Yes |

All in `qa/sim/phase5-sales.mjs` group 2 (15 scenarios) and the cross-channel sweep "One customer, one price in every sales channel" (47 checks, from Phase 2).

## 2. Tax (rule 27)

Tax is worked at the selling branch's state; an exempt customer pays none; with no branch, the ship-to state, then the customer's state. A state with no rate on file is charged nothing and the estimate says `rateFound: false`.

| Path | Before Phase 5 | After |
|---|---|---|
| Quote | No tax saved | Taxed at the request's branch; subtotal + tax = total |
| Quote to order | Untaxed order | Quote's tax carried; an old untaxed quote is taxed at acceptance |
| Web order acceptance | Taxed at the branch named, filed elsewhere | Same branch for both (J-005) |
| Retail POS | Always Jackson, Michigan | The clerk's home branch (J-006) |
| Order entry | Taxed at the branch named, filed by the person's home | Same branch for both; another branch refused (S-008) |

## 3. Corrections

| ID | What | Effect on a valid sale |
|---|---|---|
| J-011 | Price check and tax estimate refuse negative or nonsense amounts | None |
| J-001, J-005, J-006 | Tax worked at the right branch and carried to the order | Tax now charged where rule 27 says |

## 4. Open questions for the owner

- **S-020 / J-008**: how a customer's default discount combines with a contract tier (on top, instead, or only without a tier). Not applied anywhere until decided; the field says so.
- **S-027**: quote lines are priced by hand because request lines are free text; the price check can be used per product. Unchanged.
- **F-008**: the web shop shows a tax estimate by ship-to state; acceptance uses the branch. Consistent with rule 27's fallback; unchanged.

## 5. Not verified

- Prices on the live database, and whether live tiers and list prices are set as intended.
- Tax for states other than IL, IN, MI and OH: no rates exist in the QA data.
