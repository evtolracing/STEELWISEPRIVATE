# Phase 5: point of sale review

Date: 2026-11-15. Local QA databases only. No card was charged: card sales are recorded with an approval code typed from a separate terminal (D-033), and the tests used made-up codes.

## 1. Counter flows

| Flow | Screen | Route | State after Phase 5 |
|---|---|---|---|
| Counter sale of shelf items, paid on the spot | Counter Sale | `/api/pos/quick-sale/*` | The one counter payment flow. Verified in Phase 2 to 4; re-tested here |
| Counter order (material, cut to order, on account) | Retail POS | `/api/orders/intake` with source RETAIL | Now at the clerk's branch (J-006) |
| Counter session (state machine) | No screen | `/api/pos/sessions/*` | Its create-customer and submit steps now answer 410 and name the screen to use (S-022); reading steps still answer |

## 2. The twelve POS checks of the prompt

| # | Check | Result | Scenario (`qa/sim/phase5-sales.mjs` group 5 unless noted) |
|---|---|---|---|
| 1 | Cash sale: paid invoice, change, stock off the shelf | Pass | "a cash sale ..." |
| 2 | Several lines, same item twice | Pass: one line, priced once | "several lines ..." |
| 3 | Contract customer at the counter | Pass: contract price | "an account customer pays its contract price ..." |
| 4 | Tax-exempt customer | Pass: no tax | same |
| 5 | Card and check details kept | Pass: approval code and check number on the payment | same, "several lines" |
| 6 | Payment that does not go through | Pass: no order, no invoice, shelf unchanged | "a payment that does not go through ..." |
| 7 | Same sale sent three times at once | Pass: one sale | "the same sale sent three times ..." |
| 8 | Connection drops after sending | Pass: retry finds the sale; receipt reprinted | "the connection drops ..." |
| 9 | Not enough on the shelf | Pass: refused with the count; nothing taken | "more than is on the shelf ..." |
| 10 | Void: cancelled, credit memo, refund, stock back, once; day figures | Pass after G-009 (status now CANCELLED) | "a voided sale is cancelled ..." |
| 11 | Branch: cashier's branch; another refused for a one-branch clerk; a manager may choose | Pass | "the counter sells from the cashier's branch ..." |
| 12 | Partial return of a delivered order | Pass: credit memo for the part, with its share of tax | "a partial return ..." |

Also: a sales login cannot void (manager only, as before); weight items cannot be rung up as pieces; the screen's price is ignored.

## 3. Corrections

| ID | What |
|---|---|
| J-006 (P1) | Retail POS taxed and filed every sale at Jackson, Michigan; now the clerk's home branch from the server, and the server refuses a branch that is not the clerk's |
| G-009 (P3) | A voided sale is CANCELLED (in the same claim as the note); SQL Editor file 11 corrects earlier voids |
| S-022 (P2) | The unused session flow can no longer create customers or orders by its own rules |
| J-012 (P3) | Remnant quick-add no longer defaults to Jackson; picking a remnant from stock is deferred to Phase 6 |

## 4. Not done

- Receiving shelf items by the piece (C-011) and remnant traceability (J-012): Phase 6.
- Will-call pickup screens use sample orders (X-008): unchanged, labelled as samples.
- A card processor (D-033, H-013, H-015): the owner's decision.
- Cash drawer counts and shift close: none exist; NOT APPLICABLE.
