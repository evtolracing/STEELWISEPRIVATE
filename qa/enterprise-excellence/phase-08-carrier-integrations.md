# Phase 8: carrier integrations and tracking

Date: 2026-11-16. Phase 8 of 12. Evidence is from this session, on a local database whose name contains `qa`. Nothing was run against the live database, no real shipment, invoice, payment or notice was made, and no printer, scanner or carrier system was used. Findings are in `findings-register.md` under N-001 to N-028.

## What exists

- A shipment carries a carrier name (typed) or a carrier on file, a truck number, a driver name and phone, and a bill of lading number. All are typed by staff. Bad values are refused; nothing is filled in.
- A carrier that has been given a partner key (Phase 4) can, for the shipments assigned to it and no others: read them, report status, and report delivery. A delivery reported by a carrier's system with no name is accepted and recorded as "Reported delivered by the carrier's system, with no name", so it is never mistaken for a signature.
- A customer's own system that has subscribed is told of shipment and invoice events by webhook (Phase 4), written in the same save as the event.

## What does not exist (N-026)

No carrier's system is called by this product. There is no rate request, label purchase, pickup request, tracking pull, or address validation, and no credentials for any carrier are configured. The Phase 8 instruction says not to invent carrier capabilities; none was.

Evidence: `qa/sim/phase8-fulfillment.mjs` "no carrier is connected: there is no label purchase, pickup request or tracking pull to test" (NOT APPLICABLE), "a carrier reaches only the shipments given to it", "a carrier's system reports delivery with no name: it is accepted and marked as such".

## For the owner

Which carriers, or which rating and tracking service, to connect. Until then tracking is what staff or the carrier's partner key record.
