# Operational workflow review

Workstreams 2 to 5 fill this in, one journey at a time, against the fifteen questions in the Phase 2 brief.

## Journey 1: customer inquiry, quote, order (Workstream 2). Shipping and invoice follow in Workstream 5

How it was examined: every sales screen read with its server routes; the journey run by the simulation (seeds 8001 to 8003, 150 jobs, including orders typed on the order entry screen, counter sales, web orders, RFQ to quote to order); the screens operated in a browser for Sales Rep Mobile, Sales Dashboard and Pricing.

| Question | Finding |
|---|---|
| Can the journey be completed end to end? | Yes for phone or counter order, web order, and RFQ to quote to order, through production, shipping, invoice and payment in the simulation |
| Is data entered once? | Customer and price: yes, after S-002. Quote prices are typed by hand (S-027). An accepted quote becomes the order with no re-keying |
| Is the price right in every channel? | Yes: one rule, tested in five channels (Sweep 13, 47 checks) |
| Is tax right? | Saved on the order by rule 27 (selling branch state). A state with no rate charges none and says so (D-035) |
| Who did it? | Orders, overrides, tier, credit, tax status and list price changes carry the signed-in person |
| What stops a bad order? | Quantity, price and status checks on entry. Nothing stops an order over the credit limit (S-019) |
| Can the customer be given a date? | Not reliably. The promise date is not computed by the server (S-010) |
| Are exceptions handled? | Overrides are recorded and listed on the order (S-011). Approval of an override is a manager action; there is no approval queue |
| Is anything duplicated? | Order Hub duplicates RFQs & Quotes (S-021). The POS session API duplicates counter sale (S-022) |
| Are notifications sent? | No. Email and text are not connected; the buttons say so (D-034) |
| Mobile | Works online with real data. No offline mode; the screen says when a send fails |
| Reporting | Sales Dashboard counts RFQs, quotes and wins. Margin is not available because product cost is not recorded |

Not examined in this workstream: credit application and new-account approval (no screen exists), commission, sales targets, customer statements (Workstream 5).

## Journeys queued

2. Supplier purchase order, receiving, inspection, stock, availability (Workstream 3)
3. Shortage, alternate branch, transfer, receiving, processing, fulfilment (Workstream 3)
4. Customer return, inspection, credit, stock disposition (Workstream 5)

Known from Phase 1, to be re-examined there: a return has no inspection step before credit; there is no purchasing workflow in the simulation.
