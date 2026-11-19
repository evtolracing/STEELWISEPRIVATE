# Phase 12: workflow certification matrix

Date: 2026-11-19. Release candidate RC-2 (RC-1 is commit `9e12319`, the merge of Phase 11; RC-2 is RC-1 plus the corrections of this phase, listed in `phase-12-release-baseline.md`). Everything here was run in this session on one local machine against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only. Nothing was run against the live system, and nothing here is a statement about it.

68 workflows and controls were run through the real server on three copies, and the database read back after each: 68 pass, 0 fail, 600 checks (`qa/results/phase12-certification.json`, from **the full gate on RC-2 has not finished: figures marked "gate" below are NOT VERIFIED until it has**).

| Workflow ID | Purpose | Starting event | Responsible role | Required permissions | UI entry point | API or service path | Database changes | Events and integrations | Financial consequences | Expected final state | Evidence | Result |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| WF-01 | Sell stock material to a new account from request to cash | A new customer asks for a price | CSR, estimator, inventory manager, shipping coordinator | the role's department rule and its own branch | Customers; Sales and Quoting; Orders; Shipping; Invoices | POST /api/customers, /api/rfqs, /api/rfqs/:id/quotes, /api/quotes/:id/send, /api/quotes/:id/accept, /api/orders/:id/allocate, /api/shipments, PUT /api/shipments/:id/dispatch and /deliver, POST /api/invoices/:id/payments | Organization, RFQ, Quote, Order, OrderLine, Inventory, Shipment, MaterialMovement, Invoice, Payment, LedgerEvent, JournalEntry | INVOICE_ISSUED, STOCK_SHIPPED, PAYMENT_RECEIVED ledger events | receivables and revenue at dispatch; cost of goods at the item's cost; cash at payment | order shipped, shipment delivered, invoice paid, receivable zero, books reconciled | qa/sim/phase12-certification.mjs, Cross-module workflows end to end; 36 checks | PASS |
| WF-02 | Sell processed material: quote, production, quality release, shipment, invoice | A customer accepts a quote for cut-to-size material | Estimator, CSR, scheduler, operator, QC inspector, shipping coordinator, branch manager | the role's department rule and its own branch | Sales and Quoting; Scheduling; Shop Floor; QC Inspections; Shipping | POST /api/jobs, /api/jobs/:id/plan, /api/v1/operations/:id/start and /complete, /api/qc/inspections, /api/qc/inspections/:id/pass, POST /api/jobs/:id/status, shipments and invoices as flow 1, GET /api/orders/:id/cost | Job, DispatchJob, DispatchOperation, DispatchTimeLog, JobInspection and the flow 1 records | INVOICE_ISSUED, STOCK_SHIPPED | as flow 1; the job cost shows material at actual cost | job complete and inspected, shipment delivered, invoice paid | qa/sim/phase12-certification.mjs, Cross-module workflows end to end; 41 checks | PASS |
| WF-03 | Buy material and bring it into stock at its actual cost | A buyer raises a purchase order | Buyer, receiving clerk | the role's department rule and its own branch | Purchasing; Receiving | POST /api/purchase-orders, PUT /api/purchase-orders/:id, POST /api/inventory/receipts | Order (PO), OrderLine, Coil, Inventory, MaterialMovement, LedgerEvent, JournalEntry | STOCK_RECEIVED per receipt | raw inventory up and received-not-invoiced up by pounds times the line price, per receipt | purchase order fully received; two stock items at the branch at cost | qa/sim/phase12-certification.mjs, Cross-module workflows end to end; 30 checks | PASS |
| WF-04 | Move stock between two branches without losing it from the books | The sending branch ships a transfer | Inventory manager (sending), receiving clerk (receiving) | the role's department rule and its own branch | Inventory: Transfers | POST /api/inventory/transfers, POST /api/inventory/transfers/:id/receive | StockTransfer, StockTransferLine, Coil, Inventory, MaterialMovement | TRANSFER_SHIPPED and TRANSFER_RECEIVED ledger events | inventory moves to in transit at cost, then to the receiving branch; no revenue | the item is at the receiving branch at the same cost; nothing in transit | qa/sim/phase12-certification.mjs, Cross-module workflows end to end; 21 checks | PASS |
| WF-05 | Process material and keep weight, cost and traceability through the cut | A scheduler writes a work order against a stock item | Scheduler, operator | the role's department rule and its own branch | Work Orders | POST /api/work-orders, PUT /api/work-orders/:id/release, /start, /complete | WorkOrder, Coil (source and outputs), Inventory, MaterialMovement | material issued, production completed, scrap written off | the source leaves raw stock at cost; outputs enter at the same cost per pound; scrap is expensed at cost | source consumed; two outputs in stock tracing to the source heat; scrap recorded | qa/sim/phase12-certification.mjs, Cross-module workflows end to end; 20 checks | PASS |
| WF-06 | Take an order from the web store through to cash | A customer buyer checks out on the web store | Customer buyer; CSR; inventory manager; shipping coordinator | the role's department rule and its own branch | Shop (customer); Online Order Inbox; Shipping | POST /api/ecom/checkout/submit, POST /api/orders/online/:id/accept, GET /api/ecom/my-orders, then shipments and payments | OnlineOrder, Order, Inventory, Shipment, Invoice, Payment | INVOICE_ISSUED, STOCK_SHIPPED, PAYMENT_RECEIVED | as a sale; nothing is charged to a card by the product | one internal order for the web order; shipped, invoiced, paid; visible to its buyer only | qa/sim/phase12-certification.mjs, Cross-module workflows end to end; 21 checks | PASS |
| WF-07 | Sell shelf goods over the counter for immediate payment | A walk-in customer pays at the counter | CSR at the counter | the role's department rule and its own branch | Quick Sale (counter) | POST /api/pos/quick-sale/process-payment | Order, Invoice, Payment, Inventory, MaterialMovement | INVOICE_ISSUED, PAYMENT_RECEIVED, STOCK_SHIPPED | cash and revenue at once; sales tax where the branch state has a rate; cost of goods at the item's cost | one order, one paid invoice, shelf reduced once | qa/sim/phase12-certification.mjs, Cross-module workflows end to end; 13 checks | PASS |
| WF-08 | Take material back and return the customer's money | A customer returns part of a paid shipment | CSR, receiving clerk, branch manager | the role's department rule and its own branch | Returns | POST /api/returns, POST /api/returns/:id/receive, POST /api/invoices/:id/refund | Return, ReturnLine, Inventory, MaterialMovement, Invoice (CREDIT), Payment (refund) | CREDIT_MEMO_ISSUED, STOCK_RETURNED, REFUND_PAID | revenue and receivables reversed by the credit; stock back at cost when restocked; cash out at refund | return received; one credit memo; refund paid; the invoice history intact | qa/sim/phase12-certification.mjs, Cross-module workflows end to end; 21 checks | PASS |
| WF-09 | Ship what is ready and bill only that; keep the rest reserved | Part of an order is ready before the rest | Inventory manager, shipping coordinator, CSR | the role's department rule and its own branch | Orders; Shipping; Invoices | as flow 1, with two shipments | Order, Shipment (2), Invoice (2) | two INVOICE_ISSUED, two STOCK_SHIPPED | receivables rise by each part as it leaves; never by the whole order early | two shipments, two invoices adding up to the order, order closed | qa/sim/phase12-certification.mjs, Cross-module workflows end to end; 15 checks | PASS |
| WF-10 | Consolidate the branches into one set of books | Finance reads the reports after the day's work | CFO, auditor, branch manager | the role's department rule and its own branch | Finance: Reports | GET /api/ledger/reports/trial-balance, revenue, gross-margin, inventory, receivables | read only | each report read is recorded | total debits equal total credits; branch revenue adds to enterprise revenue | one total whichever way it is cut | qa/sim/phase12-certification.mjs, Cross-module workflows end to end; 16 checks | PASS |
| LC-01 | Chart of accounts | as the name states | CFO, second finance approver, auditor | the role's department rule and its own branch | Finance | GET /api/ledger/chart, GET /api/ledger/status | none outside the scenario | none | Test entries on the QA ledger only | as the checks state | qa/sim/phase12-certification.mjs, Financial ledger certification; 6 checks | PASS |
| LC-02 | Posting rules | as the name states | CFO, second finance approver, auditor | the role's department rule and its own branch | Finance | the business routes; GET /api/ledger/reports/exceptions | none outside the scenario | none | Test entries on the QA ledger only | as the checks state | qa/sim/phase12-certification.mjs, Financial ledger certification; 3 checks | PASS |
| LC-03 | Balanced journal entries | as the name states | CFO, second finance approver, auditor | the role's department rule and its own branch | Finance | POST /api/ledger/entries, /post; the database trigger | none outside the scenario | none | Test entries on the QA ledger only | as the checks state | qa/sim/phase12-certification.mjs, Financial ledger certification; 3 checks | PASS |
| LC-04 | Immutable posted history | as the name states | CFO, second finance approver, auditor | the role's department rule and its own branch | Finance | PUT, PATCH, DELETE /api/ledger/entries/:id; SQL as steelwise_runtime | none outside the scenario | none | Test entries on the QA ledger only | as the checks state | qa/sim/phase12-certification.mjs, Financial ledger certification; 9 checks | PASS |
| LC-05 | Authorized reversals | as the name states | CFO, second finance approver, auditor | the role's department rule and its own branch | Finance | POST /api/ledger/entries/:id/reverse | none outside the scenario | none | Test entries on the QA ledger only | as the checks state | qa/sim/phase12-certification.mjs, Financial ledger certification; 6 checks | PASS |
| LC-06 | Accounting periods | as the name states | CFO, second finance approver, auditor | the role's department rule and its own branch | Finance | GET /api/ledger/periods, POST /api/ledger/periods/:y/:m/close and /reopen | none outside the scenario | none | Test entries on the QA ledger only | as the checks state | qa/sim/phase12-certification.mjs, Financial ledger certification; 5 checks | PASS |
| LC-07 | Posting idempotency | as the name states | CFO, second finance approver, auditor | the role's department rule and its own branch | Finance | PUT /api/shipments/:id/dispatch, POST /api/ledger/events/record-missing | none outside the scenario | none | Test entries on the QA ledger only | as the checks state | qa/sim/phase12-certification.mjs, Financial ledger certification; 5 checks | PASS |
| LC-08 | Invoice, payment, credit and refund posting | as the name states | CFO, second finance approver, auditor | the role's department rule and its own branch | Finance | dispatch; POST /api/invoices/:id/payments, /credit, /refund | none outside the scenario | none | Test entries on the QA ledger only | as the checks state | qa/sim/phase12-certification.mjs, Financial ledger certification; 13 checks | PASS |
| LC-11 | Inventory valuation | as the name states | CFO, second finance approver, auditor | the role's department rule and its own branch | Finance | GET /api/ledger/reports/inventory; POST /api/ledger/reconciliations | none outside the scenario | none | Test entries on the QA ledger only | as the checks state | qa/sim/phase12-certification.mjs, Financial ledger certification; 6 checks | PASS |
| LC-12 | Manufacturing costing, scrap and write-offs | as the name states | CFO, second finance approver, auditor | the role's department rule and its own branch | Finance | work orders; GET /api/ledger/reports/scrap; GET /api/orders/:id/cost | none outside the scenario | none | Test entries on the QA ledger only | as the checks state | qa/sim/phase12-certification.mjs, Financial ledger certification; 4 checks | PASS |
| LC-14 | Freight income and expense | as the name states | CFO, second finance approver, auditor | the role's department rule and its own branch | Finance | orders with freightAmount; the invoice posting | none outside the scenario | none | Test entries on the QA ledger only | as the checks state | qa/sim/phase12-certification.mjs, Financial ledger certification; 3 checks | PASS |
| LC-15 | Branch and division attribution | as the name states | CFO, second finance approver, auditor | the role's department rule and its own branch | Finance | the journal; GET /api/ledger/reports/revenue?by=branch | none outside the scenario | none | Test entries on the QA ledger only | as the checks state | qa/sim/phase12-certification.mjs, Financial ledger certification; 3 checks | PASS |
| LC-17 | External accounting mappings | as the name states | CFO, second finance approver, auditor | the role's department rule and its own branch | Finance | GET /api/ledger/external-accounts/:provider, POST /api/ledger/exports | none outside the scenario | none | Test entries on the QA ledger only | as the checks state | qa/sim/phase12-certification.mjs, Financial ledger certification; 5 checks | PASS |
| LC-18 | Financial reporting | as the name states | CFO, second finance approver, auditor | the role's department rule and its own branch | Finance | GET /api/ledger/reports/* | none outside the scenario | none | Test entries on the QA ledger only | as the checks state | qa/sim/phase12-certification.mjs, Financial ledger certification; 12 checks | PASS |
| LC-19 | Audit trails | as the name states | CFO, second finance approver, auditor | the role's department rule and its own branch | Finance | AuditLog; SQL as the application | none outside the scenario | none | Test entries on the QA ledger only | as the checks state | qa/sim/phase12-certification.mjs, Financial ledger certification; 3 checks | PASS |
| LC-20 | Recovery from failed posting | as the name states | CFO, second finance approver, auditor | the role's department rule and its own branch | Finance | POST /api/ledger/events/:id/retry, /resolve; GET /api/ledger/reports/exceptions | none outside the scenario | none | Test entries on the QA ledger only | as the checks state | qa/sim/phase12-certification.mjs, Financial ledger certification; 11 checks | PASS |
| RC-01 | Debits equal credits in every posted entry and in total | as the name states | CFO | the role's department rule and its own branch | Finance > Ledger > Reconciliation | POST /api/ledger/reconciliations; GET /api/ledger/reports/:name | one reconciliation run saved; nothing else changes | none | none: a reconciliation reads | as the checks state | qa/sim/phase12-certification.mjs, Financial and inventory reconciliation; 4 checks | PASS |
| RC-02 | Accounts receivable | as the name states | CFO | the role's department rule and its own branch | Finance > Ledger > Reconciliation | POST /api/ledger/reconciliations; GET /api/ledger/reports/:name | one reconciliation run saved; nothing else changes | none | none: a reconciliation reads | as the checks state | qa/sim/phase12-certification.mjs, Financial and inventory reconciliation; 4 checks | PASS |
| RC-03 | Inventory valuation | as the name states | CFO | the role's department rule and its own branch | Finance > Ledger > Reconciliation | POST /api/ledger/reconciliations; GET /api/ledger/reports/:name | one reconciliation run saved; nothing else changes | none | none: a reconciliation reads | as the checks state | qa/sim/phase12-certification.mjs, Financial and inventory reconciliation; 6 checks | PASS |
| RC-04 | Revenue | as the name states | CFO | the role's department rule and its own branch | Finance > Ledger > Reconciliation | POST /api/ledger/reconciliations; GET /api/ledger/reports/:name | one reconciliation run saved; nothing else changes | none | none: a reconciliation reads | as the checks state | qa/sim/phase12-certification.mjs, Financial and inventory reconciliation; 3 checks | PASS |
| RC-05 | Completeness of posting | as the name states | CFO | the role's department rule and its own branch | Finance > Ledger > Reconciliation | POST /api/ledger/reconciliations; GET /api/ledger/reports/:name | one reconciliation run saved; nothing else changes | none | none: a reconciliation reads | as the checks state | qa/sim/phase12-certification.mjs, Financial and inventory reconciliation; 6 checks | PASS |
| RC-06 | The reconciliation detects a real difference | as the name states | CFO | the role's department rule and its own branch | Finance > Ledger > Reconciliation | POST /api/ledger/reconciliations; GET /api/ledger/reports/:name | a stock figure is changed by SQL inside the test and put back | none | none: a reconciliation reads | as the checks state | qa/sim/phase12-certification.mjs, Financial and inventory reconciliation; 4 checks | PASS |
| DB-01 | Home dashboard | as the name states | head office and one branch manager | the role's department rule and its own branch | Home | GET /api/dashboard, /api/dashboard/kpis | none: reads only | none | none | as the checks state | qa/sim/phase12-certification.mjs, Dashboards and reports agree with the records; 5 checks | PASS |
| DB-02 | Home dashboard at a branch | as the name states | head office and one branch manager | the role's department rule and its own branch | Home | GET /api/dashboard | none: reads only | none | none | as the checks state | qa/sim/phase12-certification.mjs, Dashboards and reports agree with the records; 4 checks | PASS |
| DB-03 | Operations cockpit | as the name states | head office and one branch manager | the role's department rule and its own branch | Operations > Cockpit | GET /api/ops-cockpit | none: reads only | none | none | as the checks state | qa/sim/phase12-certification.mjs, Dashboards and reports agree with the records; 6 checks | PASS |
| DB-04 | Sales dashboard | as the name states | head office and one branch manager | the role's department rule and its own branch | Sales > Dashboard | GET /api/sales-dashboard | none: reads only | none | none | as the checks state | qa/sim/phase12-certification.mjs, Dashboards and reports agree with the records; 3 checks | PASS |
| DB-05 | Material tracking | as the name states | head office and one branch manager | the role's department rule and its own branch | Shipping > Material tracking | GET /api/material-tracking/stats | none: reads only | none | none | as the checks state | qa/sim/phase12-certification.mjs, Dashboards and reports agree with the records; 3 checks | PASS |
| DB-06 | Finance reports | as the name states | head office and one branch manager | the role's department rule and its own branch | Finance > Ledger > Reports | GET /api/ledger/reports/* | none: reads only | none | none | as the checks state | qa/sim/phase12-certification.mjs, Dashboards and reports agree with the records; 5 checks | PASS |
| DB-07 | Sample data stays labelled | as the name states | head office and one branch manager | the role's department rule and its own branch | Executive > Cockpit and other sample screens | GET /api/executive/* | none: reads only | none | none | as the checks state | qa/sim/phase12-certification.mjs, Dashboards and reports agree with the records; 2 checks | PASS |
| AI-01 | Who may ask | as the name states | any signed-in employee | the role's department rule and its own branch | Assistant in the top bar | POST /api/ai/assistant, /api/ai/assistant/stream | none outside the scenario | none | read only | as the checks state | qa/sim/phase12-certification.mjs, AI assistants; 9 checks | PASS |
| AI-02 | Read-only financial access by role | as the name states | any signed-in employee | the role's department rule and its own branch | Assistant in the top bar | POST /api/ai/assistant, /api/ai/assistant/stream | none outside the scenario | none | the figures are the report's figures; nothing is posted | as the checks state | qa/sim/phase12-certification.mjs, AI assistants; 14 checks | PASS |
| AI-03 | Role-based and branch-limited data | as the name states | any signed-in employee | the same branch boundary and role rules as the API | Assistant in the top bar | POST /api/ai/assistant, /api/ai/assistant/stream | none outside the scenario | none | read only | as the checks state | qa/sim/phase12-certification.mjs, AI assistants; 6 checks | PASS |
| AI-04 | Prompt injection and permission bypass | as the name states | any signed-in employee | the role's department rule and its own branch | Assistant in the top bar | POST /api/ai/assistant, /api/ai/assistant/stream | JournalEntry, Payment, Order, Inventory, User and AppSetting unchanged | none | read only | as the checks state | qa/sim/phase12-certification.mjs, AI assistants; 6 checks | PASS |
| AI-05 | No fabricated figures | as the name states | any signed-in employee | the role's department rule and its own branch | Assistant in the top bar | POST /api/ai/assistant with the AI service failing; POST /api/executive/ai/query | none outside the scenario | none | read only | as the checks state | qa/sim/phase12-certification.mjs, AI assistants; 5 checks | PASS |
| AI-06 | Audit logging | as the name states | any signed-in employee | the role's department rule and its own branch | Assistant in the top bar | POST /api/ai/assistant, /api/ai/assistant/stream | AuditLog | none | read only | as the checks state | qa/sim/phase12-certification.mjs, AI assistants; 2 checks | PASS |
| AI-07 | Error handling | as the name states | any signed-in employee | the role's department rule and its own branch | Assistant in the top bar | POST /api/ai/assistant, /api/ai/assistant/stream | none outside the scenario | none | read only | as the checks state | qa/sim/phase12-certification.mjs, AI assistants; 6 checks | PASS |
| AI-08 | Streaming variant | as the name states | any signed-in employee | the role's department rule and its own branch | Assistant in the top bar | POST /api/ai/assistant, /api/ai/assistant/stream | none outside the scenario | none | read only | as the checks state | qa/sim/phase12-certification.mjs, AI assistants; 5 checks | PASS |
| AI-09 | Quote helper, product analysis and work order optimizer | as the name states | any signed-in employee | the role's department rule and its own branch | Assistant in the top bar | POST /api/ai/quote-assistant, /api/ai/analyze-product, /api/v1/ai/work-order-optimize | none outside the scenario | none | read only | as the checks state | qa/sim/phase12-certification.mjs, AI assistants; 4 checks | PASS |
| SC-01 | Authentication | as the name states | attacker or the wrong person | the role's department rule and its own branch | none: the API is called directly | as the checks state | none outside the scenario | none | none | as the checks state | qa/sim/phase12-certification.mjs, Security and access revalidation; 22 checks | PASS |
| SC-02 | Sessions | as the name states | attacker or the wrong person | the role's department rule and its own branch | none: the API is called directly | as the checks state | none outside the scenario | none | none | as the checks state | qa/sim/phase12-certification.mjs, Security and access revalidation; 4 checks | PASS |
| SC-03 | Role-based access | as the name states | attacker or the wrong person | the role's department rule and its own branch | none: the API is called directly | as the checks state | none outside the scenario | none | none | as the checks state | qa/sim/phase12-certification.mjs, Security and access revalidation; 11 checks | PASS |
| SC-04 | Tenant (customer account) and branch isolation | as the name states | attacker or the wrong person | the role's department rule and its own branch | none: the API is called directly | as the checks state | none outside the scenario | none | none | as the checks state | qa/sim/phase12-certification.mjs, Security and access revalidation; 27 checks | PASS |
| SC-06 | Branch boundary on the dispatch board | as the name states | attacker or the wrong person | the role's department rule and its own branch | none: the API is called directly | GET /api/v1/dispatch/work-centers, /queue, /stats, /operators | none outside the scenario | none | none | as the checks state | qa/sim/phase12-certification.mjs, Security and access revalidation; 6 checks | PASS |
| SC-07 | API security | as the name states | attacker or the wrong person | the role's department rule and its own branch | none: the API is called directly | as the checks state | none outside the scenario | none | none | as the checks state | qa/sim/phase12-certification.mjs, Security and access revalidation; 11 checks | PASS |
| SC-08 | Database security | as the name states | attacker or the wrong person | the role's department rule and its own branch | none: the API is called directly | SQL as steelwise_runtime | none outside the scenario | none | none | as the checks state | qa/sim/phase12-certification.mjs, Security and access revalidation; 10 checks | PASS |
| SC-09 | File security | as the name states | attacker or the wrong person | the role's department rule and its own branch | none: the API is called directly | POST /api/documents/upload, GET /api/documents/:id/download | none outside the scenario | none | none | as the checks state | qa/sim/phase12-certification.mjs, Security and access revalidation; 6 checks | PASS |
| SC-10 | Secrets | as the name states | attacker or the wrong person | the role's department rule and its own branch | none: the API is called directly | as the checks state | none outside the scenario | none | none | as the checks state | qa/sim/phase12-certification.mjs, Security and access revalidation; 4 checks | PASS |
| SC-11 | Webhooks and partner API | as the name states | attacker or the wrong person | the role's department rule and its own branch | none: the API is called directly | as the checks state | none outside the scenario | none | none | as the checks state | qa/sim/phase12-certification.mjs, Security and access revalidation; 6 checks | PASS |
| SC-12 | Financial permissions and audit | as the name states | attacker or the wrong person | the role's department rule and its own branch | none: the API is called directly | as the checks state | none outside the scenario | none | none | as the checks state | qa/sim/phase12-certification.mjs, Security and access revalidation; 5 checks | PASS |
| ML-01 | Branch set-up is complete | as the name states | head office and branch staff | the role's department rule and its own branch | the branch chooser and every list | as named in the checks | none outside the scenario | none | none | as the checks state | qa/sim/phase12-certification.mjs, Multi-location readiness; 4 checks | PASS |
| ML-02 | Location-specific permissions | as the name states | head office and branch staff | the role's department rule and its own branch | the branch chooser and every list | GET /api/orders, /api/coils, /api/shipments | none outside the scenario | none | none | as the checks state | qa/sim/phase12-certification.mjs, Multi-location readiness; 11 checks | PASS |
| ML-03 | Inter-location transfers and inventory visibility | as the name states | head office and branch staff | the role's department rule and its own branch | the branch chooser and every list | POST /api/inventory/transfers, /:id/receive | none outside the scenario | none | inventory leaves one branch and arrives at the other at the same cost; total unchanged | as the checks state | qa/sim/phase12-certification.mjs, Multi-location readiness; 5 checks | PASS |
| ML-04 | Document numbering across branches | as the name states | head office and branch staff | the role's department rule and its own branch | the branch chooser and every list | as named in the checks | none outside the scenario | none | none | as the checks state | qa/sim/phase12-certification.mjs, Multi-location readiness; 5 checks | PASS |
| ML-05 | Location-specific tax and reporting | as the name states | head office and branch staff | the role's department rule and its own branch | the branch chooser and every list | as named in the checks | none outside the scenario | none | revenue and tax are attributed to the selling branch | as the checks state | qa/sim/phase12-certification.mjs, Multi-location readiness; 3 checks | PASS |
| ML-06 | New location onboarding | as the name states | head office and branch staff | the role's department rule and its own branch | the branch chooser and every list | POST /api/admin/locations or the locations screen | one Location, one user | none | none | as the checks state | qa/sim/phase12-certification.mjs, Multi-location readiness; 5 checks | PASS |
| GP-01 | Executive decision create reads no identity from the request | as the name states | as named | the role's department rule and its own branch | none: API | POST /api/executive/decisions | none outside the scenario | none | none | as the checks state | qa/sim/phase12-certification.mjs, Evidence gaps closed; 5 checks | PASS |
| GP-02 | Operations cockpit at volume | as the name states | as named | the role's department rule and its own branch | Operations > Cockpit | GET /api/ops-cockpit | none outside the scenario | none | none | as the checks state | qa/sim/phase12-certification.mjs, Evidence gaps closed; 4 checks | PASS |
| GP-03 | Upload size limit | as the name states | as named | the role's department rule and its own branch | none: API | POST /api/documents/upload | none outside the scenario | none | none | as the checks state | qa/sim/phase12-certification.mjs, Evidence gaps closed; 3 checks | PASS |

## The ten cross-module flows, check by check

### WF-01: Flow 1: a new customer is quoted, orders, is shipped, invoiced and pays, and the books agree

- pass: the customer account is created (201 )
- pass: the request for quote is saved for the customer (201 )
- pass: the quote is priced from the request (201 2400 vs 2400 )
- pass: an operator cannot accept a quote (403 Orders, quotes, customers and invoices can only be changed by sales staff or a manager. Your role (OPERATO)
- pass: the quote is sent (200 Quote marked as sent. Nothing is emailed from here: send the customer the quote yourself.)
- pass: accepting the quote makes one order (201 Quote accepted and order created)
- pass: accepting it a second time makes no second order (409)
- pass: one order for the quote in the database
- pass: the order carries the quote's price and the branch (2400 vs 2400; branch true)
- pass: stock is reserved for the line (201 )
- pass: the reservation holds the pounds and leaves the stock on hand (allocated 0→1200, available 4000→2800)
- pass: the shipment is put together (201 )
- pass: the shipment is dispatched and names its invoice (200 )
- pass: the stock on hand fell by the pounds shipped and the reservation was used up (on hand 4000→2800, allocated 0)
- pass: one SHIP movement records it ({"q":"1200"})
- pass: the invoice is posted once and its entry balances (POSTED {"1100":2400,"4000":-2400})
- pass: receivables rise by the invoice total and revenue by its subtotal (1100 2400 vs 2400; 4000 -2400 vs 2400)
- pass: cost of goods at the item's cost: an entry was posted (POSTED)
- pass: cost of goods at the item's cost: debits equal credits (1140 vs 1140, header 1140)
- pass: cost of goods at the item's cost: account 1200 moves by -1140 (got -1140; entry {"1200":-1140,"5000":1140})
- pass: cost of goods at the item's cost: account 5000 moves by 1140 (got 1140; entry {"1200":-1140,"5000":1140})
- pass: cost of goods at the item's cost: no other account is touched (also )
- pass: the invoice is for the order and the customer, at the quoted price (2400 vs 2400)
- pass: the delivery is confirmed with a proof of delivery (200 DELIVERED)
- pass: a payment larger than the invoice is refused (409 Only 2400.00 is still owed on this invoice)
- pass: the payment is taken (201 )
- pass: the invoice shows it (PAID 2400/2400)
- pass: the payment is posted once: receivables down by the amount, the entry balances (POSTED {"1000":2400,"1100":-2400})
- pass: the order is complete (COMPLETE)
- pass: the customer owes nothing on the receivables report ("not listed")
- pass: the trail is in the audit log (6)
- pass: after the sale: the reconciliation ran (201)
- pass: after the sale: BOOKS_BALANCE agrees (MATCH 0.00 )
- pass: after the sale: INVENTORY agrees (MATCH 0.00 )
- pass: after the sale: RECEIVABLES agrees (MATCH 0.00 )
- pass: after the sale: IN_TRANSIT agrees (MATCH 0.00 )

### WF-02: Flow 2: a quoted job is made on the floor, inspected, shipped and invoiced; it cannot leave before it passes

- pass: the request for quote is saved for the customer (201 )
- pass: the quote is priced from the request (201 1162.5 vs 1162.5 )
- pass: an operator cannot accept a quote (403 Orders, quotes, customers and invoices can only be changed by sales staff or a manager. Your role (OPERATO)
- pass: the quote is sent (200 Quote marked as sent. Nothing is emailed from here: send the customer the quote yourself.)
- pass: accepting the quote makes one order (201 Quote accepted and order created)
- pass: accepting it a second time makes no second order (409)
- pass: one order for the quote in the database
- pass: the order carries the quote's price and the branch (1162.5 vs 1162.5; branch true)
- pass: the material is reserved for the order (201 )
- pass: the job is opened for the order line (201 )
- pass: the job is routed in two steps (200 )
- pass: step "Saw to length" is started and finished by the operator (200 200  )
- pass: step "Deburr and stack" is started and finished by the operator (200 200  )
- pass: time on each step is recorded against a person (2)
- pass: the dock cannot mark the job ready to ship before inspection (409 This job is waiting for inspection. Record the inspection result in Quality; a pass moves it to packaging.)
- pass: a shipment of the uninspected job cannot be dispatched (shipment 201, dispatch 409 This shipment cannot go out yet: JOB-00631 (waiting qc) is not finished. Finish or )
- pass: nothing left the building
- pass: the inspection is opened (201 )
- pass: a failed inspection is recorded (200 )
- pass: a job that failed inspection cannot be staged (409 Inspection INS-00353 failed. This job needs a passed inspection before it can move on: send it to inspecti)
- pass: the rework step "Rework (INS-00353)" is run (200 200  )
- pass: a new inspection is opened after the rework (201 )
- pass: the new inspection passes (200 )
- pass: both inspections are kept: the failure is not overwritten (2)
- pass: now the dock stages it (200 )
- pass: the shipment made earlier is still waiting on the dock (201)
- pass: the inspected job is dispatched and billed (200 )
- pass: the stock fell once by the pounds shipped (6000→4500)
- pass: the delivery is confirmed with a proof of delivery (200 DELIVERED)
- pass: a payment larger than the invoice is refused (409 Only 1162.50 is still owed on this invoice)
- pass: the payment is taken (201 )
- pass: the invoice shows it (PAID 1162.5/1162.5)
- pass: the payment is posted once: receivables down by the amount, the entry balances (POSTED {"1000":1162.5,"1100":-1162.5})
- pass: the manager reads the job cost: material at the item's actual cost, and nothing assumed (200 )
- pass: a sales representative is not shown cost (403)
- pass: the job is closed (SHIPPED)
- pass: after the processed sale: the reconciliation ran (201)
- pass: after the processed sale: BOOKS_BALANCE agrees (MATCH 0.00 )
- pass: after the processed sale: INVENTORY agrees (MATCH 0.00 )
- pass: after the processed sale: RECEIVABLES agrees (MATCH 0.00 )
- pass: after the processed sale: IN_TRANSIT agrees (MATCH 0.00 )

### WF-03: Flow 3: a purchase order is approved, received in two parts, costed from its line and posted

- pass: the purchase order is written (201 )
- pass: goods cannot be received against a purchase order that is not placed (409 Purchase order PO-02005 is still a draft: it has not been placed with the supplier)
- pass: the purchase order is placed (200 )
- pass: a sales representative cannot receive goods (403)
- pass: the first part is received (201 )
- pass: the rest is received (201 )
- pass: 500 lb more than was ordered is received on hold, not into free stock (201 hold 500 available 0 )
- pass: with a hold that says why ([["DISPUTE","Received against PO PO-02005 line 1, and more than ordered: 4500 LB received against 4000 ordered)
- pass: and it cannot be reserved for a customer while held (409 This stock is on hold and cannot be reserved)
- pass: the 2500 lb item is in stock at the branch at the line's price (true cost 0.38 on hand 2500)
- pass: the 2500 lb receipt: an entry was posted (POSTED)
- pass: the 2500 lb receipt: debits equal credits (950 vs 950, header 950)
- pass: the 2500 lb receipt: account 1200 moves by 950 (got 950; entry {"1200":950,"2000":-950})
- pass: the 2500 lb receipt: account 2000 moves by -950 (got -950; entry {"1200":950,"2000":-950})
- pass: the 2500 lb receipt: no other account is touched (also )
- pass: the 2500 lb item carries its heat (83f5e26f-41fa-403d-a088-c06de504c7ab)
- pass: the 1500 lb item is in stock at the branch at the line's price (true cost 0.38 on hand 1500)
- pass: the 1500 lb receipt: an entry was posted (POSTED)
- pass: the 1500 lb receipt: debits equal credits (570 vs 570, header 570)
- pass: the 1500 lb receipt: account 1200 moves by 570 (got 570; entry {"1200":570,"2000":-570})
- pass: the 1500 lb receipt: account 2000 moves by -570 (got -570; entry {"1200":570,"2000":-570})
- pass: the 1500 lb receipt: no other account is touched (also )
- pass: the 1500 lb item carries its heat (83f5e26f-41fa-403d-a088-c06de504c7ab)
- pass: the purchase order line shows what arrived, including the part on hold (4500)
- pass: the buyer closes it, and nothing more can be received against it (200 )
- pass: after receiving: the reconciliation ran (201)
- pass: after receiving: BOOKS_BALANCE agrees (MATCH 0.00 )
- pass: after receiving: INVENTORY agrees (MATCH 0.00 )
- pass: after receiving: RECEIVABLES agrees (MATCH 0.00 )
- pass: after receiving: IN_TRANSIT agrees (MATCH 0.00 )

### WF-04: Flow 4: stock is transferred, is in transit, is received at the other branch, and the books agree at each moment

- pass: another branch cannot send this branch's stock (404 Stock item not found)
- pass: the transfer is sent (201 )
- pass: in transit, none of it is available to either branch (available 0, in transit 2200, IN_TRANSIT)
- pass: stock in transit cannot be reserved for an order (409 Stock item P11-MWMU3MUB-35 is on its way to another branch. Reserve it after the receiving branch has rece)
- pass: while in transit: the reconciliation ran (201)
- pass: while in transit: BOOKS_BALANCE agrees (MATCH 0.00 )
- pass: while in transit: INVENTORY agrees (MATCH 0.00 )
- pass: while in transit: RECEIVABLES agrees (MATCH 0.00 )
- pass: while in transit: IN_TRANSIT agrees (MATCH 0.00 )
- pass: the in-transit figure carries the item's value (1536.00 vs 836)
- pass: the sending branch cannot receive its own transfer (403 Only the branch the material was sent to can receive it.)
- pass: the receiving branch receives it (200 )
- pass: receiving it twice changes nothing (409)
- pass: the item is at the receiving branch, whole and at the same cost (true 2200 0.38)
- pass: the transfer is closed (RECEIVED)
- pass: every movement of the item is posted once (TRANSFER_RECEIVED:POSTED, STOCK_RECEIVED:POSTED)
- pass: after receipt: the reconciliation ran (201)
- pass: after receipt: BOOKS_BALANCE agrees (MATCH 0.00 )
- pass: after receipt: INVENTORY agrees (MATCH 0.00 )
- pass: after receipt: RECEIVABLES agrees (MATCH 0.00 )
- pass: after receipt: IN_TRANSIT agrees (MATCH 0.00 )

### WF-05: Flow 5: a work order consumes an item, makes two pieces and scrap, and the stock value follows

- pass: the work order is written (201 )
- pass: the operator starts it (200 )
- pass: it cannot be started twice (409 This work order is already in progress)
- pass: 100 lb of the item are reserved for a customer (201 )
- pass: the work order cannot use the pounds promised to the customer (409 Stock item P11-MWMU3MUB-37 has 2,900 lb this work order can use, which is less than the 3,000 lb of output)
- pass: and the refusal changed nothing
- pass: completed with two pieces and 30 lb of scrap (200 )
- pass: the source keeps exactly the 100 lb promised to the customer (ALLOCATED: on hand 100, reserved 100)
- pass: two pieces came out, each 1,435 lb, at the source's cost per pound, on the source's heat ([["0.38",true],["0.38",true]])
- pass: the pieces are in stock (1435,1435)
- pass: weight is conserved: pieces plus scrap equal the source
- pass: the work order records the scrap and is complete (COMPLETE 30)
- pass: the work order's postings are all posted (WORK_ORDER_COMPLETED:POSTED, STOCK_RECEIVED:POSTED)
- pass: together they balance, and scrap is expensed at 30 lb times cost ({"1200":38,"1210":1090.6,"2000":-1140,"5300":11.4})
- pass: the scrap report answers (200)
- pass: after the work order: the reconciliation ran (201)
- pass: after the work order: BOOKS_BALANCE agrees (MATCH 0.00 )
- pass: after the work order: INVENTORY agrees (MATCH 0.00 )
- pass: after the work order: RECEIVABLES agrees (MATCH 0.00 )
- pass: after the work order: IN_TRANSIT agrees (MATCH 0.00 )

### WF-06: Flow 6: a web order is placed once, accepted, fulfilled, paid, and shown to the buyer

- pass: the checkout pressed twice makes one web order (200 409  The same request is still being processed. Wait a moment before trying again.)
- pass: the branch accepts it into an order (200 )
- pass: accepting it again makes no second order (409)
- pass: the order is the buyer's company's, at the branch, for three pieces (1 lines, qty 3)
- pass: the buyer sees the order in the portal (200)
- pass: a buyer of another company does not
- pass: three pieces are reserved (201 )
- pass: the pickup is put together (201 )
- pass: it is handed over and billed (200 )
- pass: the invoice total is the order total (19.47 vs 19.47)
- pass: the shelf fell by three (7)
- pass: the delivery is confirmed with a proof of delivery (200 DELIVERED)
- pass: a payment larger than the invoice is refused (409 Only 19.47 is still owed on this invoice)
- pass: the payment is taken (201 )
- pass: the invoice shows it (PAID 19.47/19.47)
- pass: the payment is posted once: receivables down by the amount, the entry balances (POSTED {"1000":19.47,"1100":-19.47})
- pass: after the web order: the reconciliation ran (201)
- pass: after the web order: BOOKS_BALANCE agrees (MATCH 0.00 )
- pass: after the web order: INVENTORY agrees (MATCH 0.00 )
- pass: after the web order: RECEIVABLES agrees (MATCH 0.00 )
- pass: after the web order: IN_TRANSIT agrees (MATCH 0.00 )

### WF-07: Flow 7: a counter sale takes stock, gives a receipt and posts once, however often the button is pressed

- pass: pressed three times at once, the sale is taken once (200  \| 201  \| 200 )
- pass: one order for the sale
- pass: one invoice, paid in full (1 PAID)
- pass: the receipt total is the invoice total (13.89 vs 13.89)
- pass: the shelf fell by two, once (390→388)
- pass: the sale is posted once and balances ({"1100":13.89,"2100":-0.91,"4000":-12.98})
- pass: one payment, posted once (1)
- pass: more than the shelf holds cannot be sold (400 Item 1: quantity must be a whole number more than zero)
- pass: after the counter sale: the reconciliation ran (201)
- pass: after the counter sale: BOOKS_BALANCE agrees (MATCH 0.00 )
- pass: after the counter sale: INVENTORY agrees (MATCH 0.00 )
- pass: after the counter sale: RECEIVABLES agrees (MATCH 0.00 )
- pass: after the counter sale: IN_TRANSIT agrees (MATCH 0.00 )

### WF-08: Flow 8: goods come back, are checked in with a decision, credited once, refunded, and the books reverse

- pass: more than was shipped cannot be returned (409 Line 1: only 800 can be returned (shipped 800, already on returns 0))
- pass: the return is opened (201 )
- pass: nothing is credited before the goods are checked in
- pass: checked in twice at once, it is received once (200,409)
- pass: 200 lb are back in stock, once (2200→2400)
- pass: one credit memo for a quarter of the invoice (1 -124 vs 124)
- pass: the credit is posted once: revenue and receivables reversed, the entry balances (CREDIT_ISSUED:POSTED {"1100":-124,"4300":124})
- pass: the stock comes back at cost: an entry was posted (POSTED)
- pass: the stock comes back at cost: debits equal credits (76 vs 76, header 76)
- pass: the stock comes back at cost: account 1200 moves by 76 (got 76; entry {"1200":76,"5000":-76})
- pass: the stock comes back at cost: account 5000 moves by -76 (got -76; entry {"1200":76,"5000":-76})
- pass: the stock comes back at cost: no other account is touched (also )
- pass: the original invoice is untouched (PAID 496)
- pass: a clerk cannot pay the refund (403)
- pass: the manager pays the refund (201 )
- pass: it cannot be refunded twice (409 Only 0.00 is still owed back on this credit memo)
- pass: after the return: the reconciliation ran (201)
- pass: after the return: BOOKS_BALANCE agrees (MATCH 0.00 )
- pass: after the return: INVENTORY agrees (MATCH 0.00 )
- pass: after the return: RECEIVABLES agrees (MATCH 0.00 )
- pass: after the return: IN_TRANSIT agrees (MATCH 0.00 )

### WF-09: Flow 9: an order ships in two parts, each billed for what left, and closes when the rest has gone

- pass: the whole line is reserved (201 )
- pass: the first 1,200 lb leave and are billed (201 200 )
- pass: the first invoice is for 1,200 lb only (744 vs 744)
- pass: the order stays open with 800 lb still reserved (PARTIAL; allocated 800; on hand 3800)
- pass: more than the 800 lb left cannot be shipped (409 Line 1: only 800 is left to ship (ordered 2000, shipped 1200, on other open shipments 0))
- pass: the remaining 800 lb leave and are billed (201 200 )
- pass: two invoices that add up to the order (2: 744,496)
- pass: their numbers differ
- pass: the order is closed as shipped and nothing is left reserved (COMPLETE shipped 2000)
- pass: each invoice is posted once
- pass: after both parts: the reconciliation ran (201)
- pass: after both parts: BOOKS_BALANCE agrees (MATCH 0.00 )
- pass: after both parts: INVENTORY agrees (MATCH 0.00 )
- pass: after both parts: RECEIVABLES agrees (MATCH 0.00 )
- pass: after both parts: IN_TRANSIT agrees (MATCH 0.00 )

### WF-10: Flow 10: every branch's figures add up to the enterprise's, and a branch manager reads only the branch

- pass: the trial balance answers (200 )
- pass: total debits equal total credits (15201317.98 vs 15201317.98)
- pass: and both equal the journal lines summed in the database (15201317.98 vs 15201317.98)
- pass: revenue by branch and by customer have one total (1172636.71 vs 1172636.71)
- pass: and it is revenue less returns in the journal (1172636.71 vs 1172636.71)
- pass: the branch rows add up to the total
- pass: the gross margin report's net sales are the same revenue (200 1172636.7099999997 vs 1172636.71)
- pass: and it says it is not a profit and loss statement
- pass: a branch manager's revenue report holds only the branch (200 1 rows)
- pass: and its total is that branch's row in the enterprise report (46040.00 vs 46040.00)
- pass: the report reads are in the audit log (8)
- pass: at the end of the flows: the reconciliation ran (201)
- pass: at the end of the flows: BOOKS_BALANCE agrees (MATCH 0.00 )
- pass: at the end of the flows: INVENTORY agrees (MATCH 0.00 )
- pass: at the end of the flows: RECEIVABLES agrees (MATCH 0.00 )
- pass: at the end of the flows: IN_TRANSIT agrees (MATCH 0.00 )

## What these flows do not prove

- They were run by a script through the API, with the screens covered separately by the browser suites. No employee ran them: that is user acceptance (`phase-12-user-acceptance.md`).
- Labels, packing slips and certificates were checked as data and files, not on a printer or scanner (K-013).
- Email and text notices do not exist in the product (D-034), so no flow sends one.
