# Phase 8: picking and packaging

Date: 2026-11-16. Phase 8 of 12. Evidence is from this session, on a local database whose name contains `qa`. Nothing was run against the live database, no real shipment, invoice, payment or notice was made, and no printer, scanner or carrier system was used. Findings are in `findings-register.md` under N-001 to N-028.

## Picking

There is no separate pick record. The pick list is the stock reserved for each line on the shipment, in the order it will be taken (oldest reservation first), with tag, heat, grade, bin and quantity. It is read by `lib/shippingDocuments.js` (`pickPlan`, a pure function with unit tests) and shown on the shipment screen as "Stock to pick" and on the pick list paper.

- An item that stands at another branch is marked "At another branch" (N-001).
- A shipment that carries more than is reserved says how much is short.
- After dispatch the same table shows "Stock that left", read from the stock movements, so the paper and the books cannot differ.

Not built: pick confirmation by scan, wave or batch picking, a picker's task list. The bin on the paper is whatever bin the stock item has on file.

## Packaging

A package is optional. It records which pieces of which stock item, of which heat, went into which bundle for which order line, and carries a drop tag.

| Step | Who | Rule |
|---|---|---|
| Open a package | Production or warehouse | A real sales order line that is not cancelled or complete; a known kind of package (N-009) |
| Add material | Production or warehouse | Heat, grade and form are read from the stock item; a different typed value is refused; pieces and weight positive; no more than the item weighs across all packages; stock on hold refused (N-009) |
| Send to quality | Production or warehouse | Only a package with something in it; gross weight not below its contents (N-008) |
| Release or hold | Quality staff or the production manager | A hold needs a reason (N-008) |
| Make a tag | Production or warehouse | Released package, one grade and one form; one live tag per package (N-010) |
| Print, apply | Production or warehouse | In that order, each once (N-010, N-013) |
| Seal | Production or warehouse | Every tag applied; a seal number is required; a voided tag stays void (N-010) |
| Print again | Production or warehouse; a manager after three copies | One of the listed reasons |
| Void | Production or warehouse; a manager with a claim number after the material has left | A reason |

Package, tag and listing numbers now run in sequence from the document counter (N-012). Every step is recorded with the real person and role, and a fingerprint of the record (N-011).

New screen: **Packing** (Material Tracking menu). It lists open packages and offers only the next allowed step for each.

## Limits

- No scale, scanner or label printer was used. Weights are typed.
- A package does not move stock and is not required for a shipment to leave. Whether packing should be mandatory before dispatch is the owner's rule; none was imposed.
- A package is not yet tied to one shipment: the packing list shows the packages of the order lines on the shipment.
