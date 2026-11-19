# Phase 12: data migration and cutover plan

Date: 2026-11-19. Release candidate RC-2 (RC-1 is commit `9e12319`, the merge of Phase 11; RC-2 is RC-1 plus the corrections of this phase, listed in `phase-12-release-baseline.md`). Everything here was run in this session on one local machine against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only. Nothing was run against the live system, and nothing here is a statement about it.

A plan for the owner to execute. **Nothing was migrated in this phase**: there is no access to the existing system's data, so no mapping has been run on real records and none is claimed. The ledger part of the cutover is `phase-09-5-cutover-plan.md`, which this plan uses and does not repeat.

## What has to exist before a branch works live

| Data | Where it lands | How it gets there today | Check after loading | Known gap |
|---|---|---|---|---|
| Customers | `Organization` (type customer), contacts, price tier, credit settings | Entered on Customers, or loaded by a script written against the export of the present system | Count equals the source; no two customers share a code; every open order's customer exists | No import tool is built. A load script must be written and tested on a copy |
| Suppliers | `Organization` (type supplier) | As customers | Every open purchase order's supplier exists | As customers |
| Products and grades | `Product`, `Grade`, price book | Admin, Catalog; Pricing | Every product on an open order exists with a list price | Customer-specific discounts are stored and applied nowhere (J-008, S-020) |
| Heats and certificates | `Heat`, documents | Heats screen, one at a time; certificate upload | Every stock item's heat is on file | Heats are added one at a time (I-017) |
| Inventory | `Coil` and `Inventory`, each with heat, dimensions, weight, branch and **unit cost** | Receiving, or a load script | Pounds by branch and grade equal the count; no negative figure; **items with no cost are listed** by the ledger dry run | An item with no cost cannot be valued and is left out of the opening books, by name |
| Open sales orders | `Order`, `OrderLine` | Re-entered through Order entry at their agreed prices | Count and value equal the source list | No bulk order import |
| Open purchase orders | `PurchaseOrder` and lines | Purchase orders screen | Quantity still to come equals the source | None |
| Work orders and jobs in progress | `WorkOrder`, `Job` | Finish in the present system before cutover where possible; otherwise re-enter | No job is in both systems | Work in progress at cutover has no opening value in the books |
| Shipments on the road | `Shipment` | Complete in the present system; do not migrate | None open in the present system for the branch | None |
| Open invoices and receivables | `Invoice`, `Payment` | A load script that writes invoices as already issued, with what has been paid | Total owed per customer equals the receivables ledger of the present system on the cutover date | No import tool is built; this is the most sensitive load and must be reconciled to the cent |
| Financial opening balances | The ledger's opening entries | Computed by the product from the records above at activation (`phase-09-5-cutover-plan.md`); everything else is entered by the accountant | The dry run, signed by the accountant; reconciliation immediately after activation | **No opening balance is invented.** Sales tax owed, bank, supplier bills and any balance of the present accounting system are the accountant's manual entries |

## Order of work for one branch

1. Freeze: agree the cutover moment with the branch. After it, nothing is entered in the present system for that branch.
2. Count stock, or accept the last count, and resolve variances.
3. Load reference data (customers, suppliers, products, heats) on a copy first; check; then live.
4. Load stock with costs. Run the supply position and compare pounds by grade with the count.
5. Enter open orders and purchase orders. Compare counts and values with the source lists.
6. Load open invoices. Compare what each customer owes with the present receivables ledger.
7. If the ledger is to start: follow `phase-09-5-cutover-plan.md` steps 2 to 11. Otherwise leave it off.
8. First day: the branch manager checks the order board, stock and shipping against the floor before the first shipment.

## What stops a cutover

- A count that does not agree with the load and cannot be explained.
- Receivables that differ from the present ledger by any amount.
- Stock with no cost that the owner has not accepted leaving out.
- The accountant's approval missing, if the ledger was to start.

## Not verified

- No load script exists or was run. Mapping from the present system is unknown here.
- W-005: the ledger dry run has not been run on a copy of the live database.
- The size and quality of the real data.
