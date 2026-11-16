# Phase 5: CRM review

Date: 2026-11-15. Local QA databases only.

## 1. What exists

STEELWISE has no separate CRM product and no connection to one. The relationship record is built from what the system already holds:

| Need | Where it lives | State |
|---|---|---|
| Account and divisions | Customers (`/customers`, `routes/customers.js`) | Real records. Create, edit, search, close and reopen (audited since J-002) |
| Contact for a request | Request for quote: contact name, email, phone | Real |
| Requests, quotes, orders, invoices for an account | RFQs & Quotes, Orders, Invoices; customer portal for the customer | Real |
| Sales pipeline figures | Sales Dashboard (`/api/sales-dashboard`) | Real; corrected in J-004 |
| Rep activity, visits, opportunities, follow-ups | No table | NOT APPLICABLE: not built, not invented (the Phase 5 prompt forbids inventing CRM features) |
| Messages to customers | Not connected | Email and text are the owner's "later" (decision 5, D-034) |

## 2. Pipeline correctness (J-004)

Measured around one live quote and one lapsed quote on the QA database:

| Figure | Before | After |
|---|---|---|
| A quote past its valid-until date | Listed under Sent or Draft; counted as awaiting the customer | Listed and counted as expired; counted as lost in the period it lapsed |
| Expired filter | Empty (no job marks quotes expired) | Finds every lapsed quote |
| Open value | Total with tax | Subtotal (before tax) |

Test: `qa/sim/phase5-sales.mjs`, "the sales dashboard counts open business before tax and leaves expired quotes out" and "an expired quote ... is listed as expired, not sent".

## 3. Request intake (§8 of the prompt)

| Channel | How a request arrives | Checked |
|---|---|---|
| Sales desk | RFQs & Quotes, New RFQ | Requirements per line (grade, size, finish, tolerances, certificates, processing, other), needed-by date; refused with the field named when a value is wrong (J-001) |
| Customer system | Partner API `POST /customer/rfqs` (Phase 4) | Unchanged; tested in Phase 4 |
| Web shop | "Request a quote" at checkout (`/api/ecom/checkout/quote`) | Reaches the inbox as a quote request with ship-to and PO kept |
| Email, phone, fax | Typed by the sales desk | No inbound email or fax processing exists |

A request belongs to the branch that took it; another branch cannot open or quote it (tested).

## 4. Findings

J-002, J-003, J-004 (VERIFIED FIXED); J-008 (REQUIRES BUSINESS DECISION); D-034 (email and text, deferred by the owner).

## 5. Not done

- No activity log, opportunity or follow-up feature was added: none is required by the current product and none was invented.
- The Mobile Rep screens: order entry and stock lookup read real records (Phase 2); the branch list now comes from the server (S-008). Other rep screens that are samples stay labelled as samples (X-009).
