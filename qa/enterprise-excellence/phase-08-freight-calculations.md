# Phase 8: freight

Date: 2026-11-16. Phase 8 of 12. Evidence is from this session, on a local database whose name contains `qa`. Nothing was run against the live database, no real shipment, invoice, payment or notice was made, and no printer, scanner or carrier system was used. Findings are in `findings-register.md` under N-001 to N-028.

## What the product does

Freight is one amount on the order, typed by staff. It is billed once, on the invoice of the first shipment of that order, and never again on a later shipment. It is not counted as revenue in the order's margin.

Verified: `qa/sim/phase8-fulfillment.mjs` "freight typed on the order is billed once, on the first shipment, and never again on a later one", "tax and freight billed are not counted as revenue".

## What it does not do (N-026)

It calculates no freight. There is no rate table, zone, weight break, minimum, fuel surcharge, accessorial or carrier quote behind the figure. The freight screens that show rates and lanes are samples with invented data, marked as such, and connected to nothing.

Evidence: `qa/sim/phase8-fulfillment.mjs` "freight rates are not calculated by this product: the amount is whatever staff type on the order" and "the six freight planning screens are marked as sample screens, not connected to records" (both NOT APPLICABLE as tests of a calculation).

Freight cost (what the company pays a carrier) is recorded nowhere, so margin does not include it (N-025).

## For the owner

The freight rules: who pays (the order has a freight terms field, typed and printed, not acted on), rate tables or a rating service, minimums and accessorials. Nothing was assumed.
