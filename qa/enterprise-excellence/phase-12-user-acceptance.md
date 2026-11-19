# Phase 12: user acceptance testing

Date: 2026-11-19. Release candidate RC-2 (RC-1 is commit `9e12319`, the merge of Phase 11; RC-2 is RC-1 plus the corrections of this phase, listed in `phase-12-release-baseline.md`). Everything here was run in this session on one local machine against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only. Nothing was run against the live system, and nothing here is a statement about it.

**User acceptance has not been run. No business user has tested anything and no sign-off exists.** What follows is the prepared plan and the record sheet. The column "Engineering result" is what the scripted run of the same workflow did on QA; it is there to help the tester and is **not** an acceptance result.

## How to run it

1. On an isolated copy (Stage 0 of the rollout plan), never on live. Each tester uses a login of their own role and branch.
2. The tester follows the steps in their role's section of `phase-12-training-plan.md` and the manual, not instructions from engineering.
3. Every difference between expected and actual is written down as a defect, corrected at its cause, and retested by the same person.
4. A reviewer who is not the tester signs each case.

## Test cases

| # | Representative of | Test case | Expected result | Engineering result on QA (not acceptance) | Actual result | Defect | Correction | Retest | Reviewer | Approval status |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Sales | Quote a new customer, accept the quote, see the order | order shipped, shipment delivered, invoice paid, receivable zero, books reconciled | WF-01: pass, 36 checks | ________________ | ________________ | ________________ | ________________ | ________________ | NOT GIVEN |
| 2 | Sales | Enter an order that ships in two parts | two shipments, two invoices adding up to the order, order closed | WF-09: pass, 15 checks | ________________ | ________________ | ________________ | ________________ | ________________ | NOT GIVEN |
| 3 | Purchasing | Write, approve and receive a purchase order in two parts; receive more than ordered | purchase order fully received; two stock items at the branch at cost | WF-03: pass, 30 checks | ________________ | ________________ | ________________ | ________________ | ________________ | NOT GIVEN |
| 4 | Warehouse | Send a transfer and receive it at the other branch | the item is at the receiving branch at the same cost; nothing in transit | WF-04: pass, 21 checks | ________________ | ________________ | ________________ | ________________ | ________________ | NOT GIVEN |
| 5 | Warehouse | Receive material against a purchase order and find it in stock | purchase order fully received; two stock items at the branch at cost | WF-03: pass, 30 checks | ________________ | ________________ | ________________ | ________________ | ________________ | NOT GIVEN |
| 6 | Production | Run a work order to two pieces and scrap | source consumed; two outputs in stock tracing to the source heat; scrap recorded | WF-05: pass, 20 checks | ________________ | ________________ | ________________ | ________________ | ________________ | NOT GIVEN |
| 7 | Production | Run a job through its steps on the floor | job complete and inspected, shipment delivered, invoice paid | WF-02: pass, 41 checks | ________________ | ________________ | ________________ | ________________ | ________________ | NOT GIVEN |
| 8 | Quality | Fail an inspection, see the job held, pass it after rework | job complete and inspected, shipment delivered, invoice paid | WF-02: pass, 41 checks | ________________ | ________________ | ________________ | ________________ | ________________ | NOT GIVEN |
| 9 | Shipping | Put a shipment together, dispatch it, confirm delivery | order shipped, shipment delivered, invoice paid, receivable zero, books reconciled | WF-01: pass, 36 checks | ________________ | ________________ | ________________ | ________________ | ________________ | NOT GIVEN |
| 10 | Finance | Return goods, issue the credit, pay the refund | return received; one credit memo; refund paid; the invoice history intact | WF-08: pass, 21 checks | ________________ | ________________ | ________________ | ________________ | ________________ | NOT GIVEN |
| 11 | Finance | Read the financial reports and the reconciliation (QA ledger only) | as the checks state | LC-18: pass, 12 checks | ________________ | ________________ | ________________ | ________________ | ________________ | NOT GIVEN |
| 12 | Management | Read the branch's figures and confirm no other branch is visible | one total whichever way it is cut | WF-10: pass, 16 checks | ________________ | ________________ | ________________ | ________________ | ________________ | NOT GIVEN |
| 13 | IT administration | Add a user, switch a login off, read the audit log and the Integrations checks | as the checks state | SC-02: pass, 4 checks | ________________ | ________________ | ________________ | ________________ | ________________ | NOT GIVEN |
| 14 | Counter | Make a counter sale and give the receipt | one order, one paid invoice, shelf reduced once | WF-07: pass, 13 checks | ________________ | ________________ | ________________ | ________________ | ________________ | NOT GIVEN |
| 15 | Customer service | Accept a web order and follow it to payment | one internal order for the web order; shipped, invoiced, paid; visible to its buyer only | WF-06: pass, 21 checks | ________________ | ________________ | ________________ | ________________ | ________________ | NOT GIVEN |

## Representatives

| Approver (role) | Name | Decision | Date | Evidence on file |
|---|---|---|---|---|
| Sales | ________________ | NOT GIVEN | ________________ | none |
| Purchasing | ________________ | NOT GIVEN | ________________ | none |
| Warehouse | ________________ | NOT GIVEN | ________________ | none |
| Production | ________________ | NOT GIVEN | ________________ | none |
| Quality | ________________ | NOT GIVEN | ________________ | none |
| Shipping | ________________ | NOT GIVEN | ________________ | none |
| Finance | ________________ | NOT GIVEN | ________________ | none |
| Management | ________________ | NOT GIVEN | ________________ | none |
| IT administration | ________________ | NOT GIVEN | ________________ | none |

## Employee productivity (section 20)

Phase 9 counted clicks, keystrokes and screens for the daily workflows with a scripted browser and removed dead ends (`phase-09-*` documents). **No measurement with employees exists**: time per order, error rate and training time for real people can only come from the pilot. No productivity figure is claimed.
