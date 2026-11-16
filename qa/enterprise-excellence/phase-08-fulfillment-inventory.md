# Phase 8: fulfilment and order-to-cash inventory

Date: 2026-11-16. Phase 8 of 12. Evidence is from this session, on a local database whose name contains `qa`. Nothing was run against the live database, no real shipment, invoice, payment or notice was made, and no printer, scanner or carrier system was used. Findings are in `findings-register.md` under N-001 to N-029.

## The flow as built

| Step | Record | Where | What changes |
|---|---|---|---|
| Material is ready | Stock reserved for an order line (`OrderLineAllocation`), or a job at READY_TO_SHIP with a passed inspection | `routes/orders.js`, `lib/jobGates.js` | Nothing moves |
| Packing (optional) | `Package`, `PackageItem`, `DropTag`, `DropTagListing` | `routes/dropTagRoutes.js`, `services/dropTagService.js` | No stock moves. A package is a wrapper with a tag |
| Shipment is built | `Shipment`, `ShipmentItem` (PENDING, LOADING) | `routes/shipments.js` | Nothing moves. Quantity is held against the line so two shipments cannot carry it twice |
| Dispatch | Shipment IN_TRANSIT | `routes/shipments.js` (dispatch) | In one save: reserved stock is taken (`MaterialMovement` SHIP, now with unit cost), the order line's shipped quantity rises, the order becomes PARTIAL or COMPLETE, an event is queued for partners. Then the invoice is raised (`services/billing.js`) |
| Delivery | Shipment DELIVERED, with the receiver's name or a reason | `routes/shipments.js` (deliver) | Proof of delivery is saved |
| Invoice | `Invoice`, `InvoiceLine` (one per shipment) | `services/billing.js` | Numbered from the document counter. Tax in proportion to what shipped. Freight on the first shipment only |
| Payment | `Payment` | `services/billing.js` | A record a person types. Invoice becomes PARTIAL or PAID |
| Credit, refund | Invoice of kind CREDIT, negative; refund recorded against it | `services/billing.js` | Never more than the invoice |
| Return | Order of type RETURN | `routes/returns.js` | On receipt: stock back (or scrapped, or held), credit memo raised |
| Closeout | Not stored. Read each time | `lib/orderCloseout.js` (new) | Nothing |

## Addresses

| File | Addresses | Notes |
|---|---|---|
| `routes/shipments.js` | 12 | List, look up what can ship, create, change, dispatch, deliver, status, cancel, documents (new) |
| `routes/invoices.js` | 8 | List, one, payments, credit, refund, cancel, raise for a shipment, aging (new) |
| `routes/returns.js` | 7 | List, lookup, create, receive, cancel, settle a missing credit (new) |
| `routes/dropTagRoutes.js` | 33 | Packages, tags, listings, templates, scans |
| `routes/printQueue.js` | 8 | Queue, render, printed, skipped, reprint |
| `routes/materialTrackingRoutes.js` | 9 | Staging, shipping a staged job, custody notes |
| `routes/partner/carrierRoutes.js` | 7 | A carrier with a partner key reads and reports on its own shipments |
| `routes/orders.js` | 3 new | `GET /api/orders/closeout`, `GET /api/orders/:id/closeout`, `GET /api/orders/:id/cost` |

## What was found on arrival

- Shipments, invoices, payments, credits and returns had been corrected in Phases 2 to 5 and were sound: one invoice per shipment, numbering, tax, payments and credits all passed their existing checks.
- Packing and drop tags had never succeeded in a test. The chain could not be completed (N-008), inputs were not checked (N-009), tag states contradicted each other (N-010), custody records could be forged (N-011), and labels and papers printed invented content (N-014).
- Stock could leave from the wrong branch (N-001), and the branch holding the stock could not ship another branch's order (N-002).
- Delivery needed no proof (N-004), a problem needed no reason (N-003), a closed account could still be shipped to (N-005).
- There was no cost of sale (N-017) and no answer to "is this order finished" (N-018).
- Seven freight screens are samples with invented data. They are marked as samples (Phase 2) and are not connected to anything (N-026, U-035).

## What does not exist

Recorded with evidence, not built and not invented: an accounting ledger and cost-of-goods posting (N-025); carrier rating, booking and tracking (N-026); a rule for lost loads (N-027); customer notices and invoice delivery (N-028); card or bank payment processing (a payment is a typed record).
