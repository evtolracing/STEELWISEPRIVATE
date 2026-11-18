# Phase 11: inventory reconciliation

Date: 2026-11-18. Every figure here was measured in this session on one local machine (4 processors, 15.7 GB), against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only, the server copies connected as the least-privilege role `steelwise_runtime`, and a local stand-in for every outside service. Nothing was run against the live database, the host or any real partner, carrier, payment or accounting system. Anything not run is marked NOT VERIFIED.

## Stock records against themselves

After each day 75 database checks are run. Each must find nothing.

| Check | Cycle 1 | Cycle 2 | Cycle 3 | Cycle 4 | Cycle 5 |
|---|---:|---:|---:|---:|---:|
| stock balance: on hand = available + allocated + on hold + in transit | 0 | 0 | 0 | 0 | 0 |
| stock: any quantity below zero | 0 | 0 | 0 | 0 | 0 |
| stock reserved differs from the reservations on file for the item | 0 | 0 | 0 | 0 | 0 |
| reservations on stock items that have no stock row | 0 | 0 | 0 | 0 | 0 |
| order line reserved more than is left to ship | 0 | 0 | 0 | 0 | 0 |
| reservations left on cancelled or completed orders | 0 | 0 | 0 | 0 | 0 |
| items whose on-hand differs from what their movements add up to (receipts and pieces made in; shipments, cuts and scrap out; corrections either way) | 0 | 0 | 0 | 0 | 0 |
| completed work orders whose output and scrap are not matched by movements on the source item | 0 | 0 | 0 | 0 | 0 |
| completed work orders whose pieces do not weigh what the work order says came out | 0 | 0 | 0 | 0 | 0 |
| pieces whose heat, grade or owner differs from the item they were cut from | 0 | 0 | 0 | 0 | 0 |
| invoice series whose counter is not the highest number on file | 0 | 12 | 12 | 12 | 12 |
| package, tag or listing series whose counter is not the highest number on file | 0 | 0 | 0 | 0 | 0 |
| invoice numbers repeated | 0 | 0 | 0 | 0 | 0 |
| stock corrections with no note or no person | 0 | 0 | 0 | 0 | 0 |
| stock row and its item disagree about the branch | 0 | 0 | 0 | 0 | 0 |
| transfers whose two branches are the same, or missing | 0 | 0 | 0 | 0 | 0 |
| stock in transit that is not on an open transfer, or an open transfer whose stock is not in transit | 0 | 0 | 0 | 0 | 0 |
| stock on an open transfer that is not at the sending branch | 0 | 0 | 0 | 0 | 0 |
| an item on more than one open transfer | 0 | 0 | 0 | 0 | 0 |
| received transfers with no TRANSFER movement for an item on them | 0 | 0 | 0 | 0 | 0 |
| transfer lines received more than shipped, or a good line not received whole | 0 | 0 | 0 | 0 | 0 |
| purchase order lines (by weight) whose received quantity differs from the receipts booked against them | 0 | 0 | 0 | 0 | 0 |
| receipts booked against a line that is not on a purchase order | 0 | 0 | 0 | 0 | 0 |
| last transfer of an item did not end where the item now is | 0 | 0 | 0 | 0 | 0 |
| time entries that end before they start | 0 | 0 | 0 | 0 | 0 |
| time entries still running on a step that is finished | 0 | 0 | 0 | 0 | 0 |
| time entries still running on a job that is cancelled, shipped or completed | 0 | 0 | 0 | 0 | 0 |
| steps with more than one clock running | 0 | 0 | 0 | 0 | 0 |
| time entries with no operator or no work center | 0 | 0 | 0 | 0 | 0 |
| finished steps with no start or no end time | 0 | 0 | 0 | 0 | 0 |
| steps running on a work center of another kind, or at another branch, than the step calls for | 0 | 0 | 0 | 0 | 0 |
| jobs with more than one open inspection | 0 | 0 | 0 | 0 | 0 |
| inspections decided with no result or no completion time, or still open with a result | 0 | 0 | 0 | 0 | 0 |
| jobs past inspection (packaging, ready to ship, shipped, completed) whose latest decided inspection failed, outside rows written directly as fixtures | 0 | 0 | 0 | 0 | 0 |
| jobs past production with a planned step unfinished, outside rows written directly as fixtures | 0 | 0 | 0 | 0 | 0 |
| jobs whose plan is at a branch other than their work center | 0 | 0 | 0 | 0 | 0 |
| rework steps not tied to a rework inspection of the same job, or two rework steps for one inspection (owner decision 9) | 0 | 0 | 0 | 0 | 0 |
| coil work orders raised for a job but for a different order line than the job (owner decision 9) | 0 | 0 | 0 | 0 | 0 |
| stock items with a cost below zero | 0 | 0 | 0 | 0 | 0 |
| operators clocked on while recorded as inactive | 0 | 0 | 0 | 0 | 0 |
| work orders on quality hold or cancelled that moved stock | 0 | 0 | 0 | 0 | 0 |
| shipped stock movements with no shipment | 0 | 0 | 0 | 0 | 0 |
| dispatched shipment items whose quantity is not fully covered by stock movements: every shipment must come off reserved stock (G-019, refused since the owner decision of 2026-11-13) | 0 | 0 | 0 | 0 | 0 |
| stock items cut from a parent that lost the parent heat | 0 | 0 | 0 | 0 | 0 |
| amounts kept with digits beyond what was entered (floating-point residue) | 0 | 0 | 0 | 0 | 0 |
| invoice subtotal differs from its lines | 2 | 2 | 2 | 2 | 2 |
| order subtotal differs from its lines (orders that are not draft) | 0 | 0 | 0 | 0 | 0 |
| order lines invoiced more than shipped | 0 | 0 | 0 | 0 | 0 |
| tax invoiced on an order is more than the order tax | 0 | 0 | 0 | 0 | 0 |
| credit memos larger than the invoice they credit | 0 | 0 | 0 | 0 | 0 |
| two live invoices for the same shipment | 0 | 0 | 0 | 0 | 0 |
| quotes or requests whose branch does not exist | 0 | 0 | 0 | 0 | 0 |
| orders with no branch | 59 | 59 | 59 | 59 | 59 |
| order lines shipped more than ordered | 0 | 0 | 0 | 0 | 0 |
| order line shipped quantity differs from its dispatched shipment items | 47 | 47 | 47 | 47 | 47 |
| order line shipped quantity differs from its dispatched shipment items, outside the demo seed orders | 0 | 0 | 0 | 0 | 0 |
| counter quick sale lines with no stock movement, because the product has no shelf stock on file at the branch (B-025) | 0 | 0 | 0 | 0 | 0 |
| invoice paid amount differs from its payments, outside the demo seed invoices | 0 | 0 | 0 | 0 | 0 |
| invoices paid more than their total | 0 | 0 | 0 | 0 | 0 |
| invoice total differs from subtotal + tax + freight | 0 | 0 | 0 | 0 | 0 |
| invoice paid amount differs from its payments | 1 | 1 | 1 | 1 | 1 |
| orders with no lines (not draft or cancelled), outside seed and fixture orders | 0 | 0 | 0 | 0 | 0 |
| jobs with no order and no order line | 1 | 1 | 1 | 1 | 1 |
| stock items (coils) with no heat | 0 | 0 | 0 | 0 | 0 |
| stock items with no location | 0 | 0 | 0 | 0 | 0 |
| shipments delivered with no proof of delivery name | 47 | 47 | 47 | 47 | 47 |
| users with no home branch | 12 | 12 | 12 | 12 | 12 |
| invoices and credit memos with no record of who raised them, outside the demo seed | 0 | 0 | 0 | 0 | 0 |
| shipments delivered with neither a name nor a reason for none (allowed only for deliveries recorded before Phase 8) | 47 | 47 | 47 | 47 | 47 |
| dispatched shipments whose stock movements add up to more than the shipment carries | 0 | 0 | 0 | 0 | 0 |
| shipments still on the dock for a cancelled order | 0 | 0 | 0 | 0 | 0 |
| shipments on the road or delivered with no invoice (each is listed for billing in the integration report) | 4 | 4 | 4 | 4 | 4 |
| packages with more than one live tag | 0 | 0 | 0 | 0 | 0 |
| returns whose missing credit was settled more than once | 0 | 0 | 0 | 0 | 0 |
| stock movements for a shipment with a cost that is negative | 0 | 0 | 0 | 0 | 0 |

## Invariants read after each day

| Invariant | Cycle 1 | Cycle 2 | Cycle 3 | Cycle 4 | Cycle 5 |
|---|---:|---:|---:|---:|---:|
| stock items with a negative quantity on hand | 0 | 0 | 0 | 0 | 0 |
| stock items with a negative available quantity | 0 | 0 | 0 | 0 | 0 |
| stock items with a negative reserved quantity | 0 | 0 | 0 | 0 | 0 |
| stock items reserved beyond what is on hand | 0 | 0 | 0 | 0 | 0 |
| order lines shipped beyond what was ordered | 0 | 0 | 0 | 0 | 0 |
| invoice numbers used twice | 0 | 0 | 0 | 0 | 0 |
| order numbers used twice | 0 | 0 | 0 | 0 | 0 |
| journal entry numbers used twice | 0 | 0 | 0 | 0 | 0 |
| shipments billed twice | 0 | 0 | 0 | 0 | 0 |
| business records with two ledger events of one kind | 0 | 0 | 0 | 0 | 0 |
| posted entries that do not balance | 0 | 0 | 0 | 0 | 0 |
| invoices paid beyond their total | 0 | 0 | 0 | 0 | 0 |
| dispatched shipments of this run with no invoice | 0 | 0 | 0 | 0 | 0 |
| ledger events of this run failed or waiting | 0 | 0 | 0 | 0 | 0 |

Cycle 4's first two runs are kept as evidence: the second (`phase11-cycle-4-second-run.json`) ended with 4 dispatched shipments without an invoice, because the load driver did not then follow the product's recovery for a dispatch whose answer was lost. The records were consistent and the gap was listed by the product; the driver now bills such a shipment as the office would, and the final run of cycle 4 ends with 0.

## Stock records against the books

| Cycle | Stock value in the books | Stock value from the records | Difference | In transit: books | In transit: records |
|---|---:|---:|---:|---:|---:|
| 1 Baseline | 8579399.50 | 8579399.50 | 0.00 | 0.00 | 0.00 |
| 2 Correction | 8588674.15 | 8588674.15 | 0.00 | 0.00 | 0.00 |
| 3 Full Revalidation | 8586269.75 | 8586269.75 | 0.00 | 0.00 | 0.00 |
| 4 Failure and Recovery | 8601370.90 | 8601370.90 | 0.00 | 0.00 | 0.00 |
| 5 Final Certification | 8653337.35 | 8653337.35 | 0.00 | 0.00 | 0.00 |

## What moved in the day (cycle 5)

| Transaction | Completed |
|---|---:|
| purchase order placed | 417 |
| goods received | 417 |
| stock reserved | 420 |
| material issued to a work order | 40 |
| stock count adjusted | 40 |
| transfer sent | 50 |
| transfer received | 50 |
| return received and credited | 60 |
| job routed and scheduled | 115 |
| work order completed | 40 |
| step finished | 230 |
| inspection passed | 115 |
| job packed and staged for shipping | 115 |

## Scenarios that attack the stock records

"Six orders reserve the same 1,000 lb at the same moment" (with and without a server copy killed), transfers received twice, counts adjusted while stock ships, a stock record changed outside the product (named as a difference, not adjusted away): all in groups 1, 4 and 7, all pass in the final run on a rebuilt database (`qa/results/phase11-scenarios.json`).
