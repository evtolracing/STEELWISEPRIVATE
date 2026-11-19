# Phase 12: role-based training plan

Date: 2026-11-19. Release candidate RC-2 (RC-1 is commit `9e12319`, the merge of Phase 11; RC-2 is RC-1 plus the corrections of this phase, listed in `phase-12-release-baseline.md`). Everything here was run in this session on one local machine against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only. Nothing was run against the live system, and nothing here is a statement about it.

Twelve roles. Every screen named is a real screen of the product (checked against the screen audit when this page was written: 68 screen references, all REAL or MIXED). No sample screen is taught. **No trainer, trainee or date is named: who trains whom and when is the owner's to fill in. Nobody has been trained.**

Each role also reads its chapters of the in-product manual (Help, Manual), which now says plainly which chapters describe design samples, and has chapters for finance, purchasing, transfers, work orders, invoices and returns, the administration checks, and "When something goes wrong".

## Sales representatives

Logins: SALES_REP. Screens: `/sales/rfq-inbox`, `/sales/dashboard`, `/orders/intake`, `/orders`, `/customers`, `/pricing`.

**Required workflows**

- Answer a request for a quote and send the quote
- Turn an accepted quote into an order
- Enter an order for a customer on the phone
- Look up an order and tell the customer where it stands
- Check a customer's price tier and credit status

**Step by step**

1. Open Sales, RFQ inbox. Open a request and write the quote lines; quote lines are priced by hand.
2. Send the quote. When the customer accepts, accept the quote: the order is made from it with the same lines and prices.
3. For a phone order open Orders, Order entry. Choose the customer, add lines, read the price shown, and submit.
4. Open Orders to find an order by number or customer. Its page shows reservations, jobs, shipments and invoices.
5. Read the Sales dashboard for open quote value, quotes awaiting the customer and quotes about to expire.

**Practice scenarios** (on a practice system, never on live)

- Quote three lines for a practice customer, accept it, and find the order it made.
- Enter a phone order for a customer on credit hold and read what the screen says.
- A customer asks where order X is: answer from the order page alone.

**Common mistakes**

- Promising a delivery date from the order screen: the dates there are a demonstration and are labelled so. Ask the branch.
- Typing an order a second time because the first seemed slow. Look in Orders first.
- Expecting the "Default Discount %" on a customer to apply. It is applied nowhere and the screen says so.

**Exceptions and what to do**

- Customer on credit hold: the order is held. Only credit or a manager releases it (Orders, Credit holds).
- Price below the floor: the order needs an override with a reason, and the override is recorded under your name.
- A quote past its valid-until date cannot be accepted. Write a new one.

**What this login can and cannot do**

- Sees and changes only the orders and quotes of the home branch.
- Cannot adjust stock, dispatch a shipment, take a payment, issue a credit or open Finance.

**Knowledge check**

1. What happens when a quote is accepted?
2. Why can you not see an order another branch entered?
3. Who can release a credit hold?
4. Is the delivery date on the order screen a promise?

**Complete when:** Completes the three practice scenarios without help on the practice system, and answers the knowledge check.

| Trainee | Trainer | Date | Practice scenarios done | Knowledge check | Signed |
|---|---|---|---|---|---|
| ________________ | ________________ | ________________ | [ ] | [ ] | NOT GIVEN |

## Customer service

Logins: CSR. Screens: `/orders/intake`, `/orders`, `/orders/online-inbox`, `/orders/invoices`, `/orders/returns`, `/orders/closeout`, `/customers`.

**Required workflows**

- Enter and change orders
- Accept or decline web orders from the online inbox
- Record a payment against an invoice
- Open a return and issue its credit
- Work the list of orders not closed

**Step by step**

1. Orders, Online inbox: open a web order, check it, and accept it. Accepting makes the sales order.
2. Orders, Invoices: find the invoice, press "Record payment", enter amount, method and reference.
3. Orders, Returns: "New return", find the order, choose lines and quantities, give the reason, "Open return".
4. When the material is back press "Receive" and choose "Put back in stock" or "Scrap (damaged)", then "Issue credit".
5. Orders, Orders not closed: read "Waiting for" on each line and chase the step named.

**Practice scenarios** (on a practice system, never on live)

- Accept a web order and follow it to its invoice.
- Record a part payment, then the rest, and see the invoice close.
- Return half of one line, put it back in stock, and issue the credit.

**Common mistakes**

- Issuing a credit on the invoice for returned material instead of using Returns: the stock is then never put back.
- Recording a payment larger than the balance. It is refused.
- Cancelling an order that already has a shipment on the dock.

**Exceptions and what to do**

- "Still being processed" after pressing twice: wait, then look at the invoice.
- Customer says they paid and the invoice shows open: check the reference on the payment list before recording again.
- Return of material that was never shipped is refused: "Can return" shows the limit.

**What this login can and cannot do**

- Home branch only.
- Cannot write journal entries, change prices, or dispatch.

**Knowledge check**

1. Which screen takes back material?
2. What does "Can return" mean?
3. What is safe to press twice?
4. Who writes an invoice?

**Complete when:** Completes the three practice scenarios and the knowledge check.

| Trainee | Trainer | Date | Practice scenarios done | Knowledge check | Signed |
|---|---|---|---|---|---|
| ________________ | ________________ | ________________ | [ ] | [ ] | NOT GIVEN |

## Estimators

Logins: ESTIMATOR or SALES_REP. Screens: `/sales/rfq-inbox`, `/pricing`, `/admin/processing-recipes`, `/customers`.

**Required workflows**

- Price a request for a quote
- Read list prices and customer tiers
- Read the processing recipes a job will follow

**Step by step**

1. Sales, RFQ inbox: open the request. Lines are free text, so read what the customer wrote.
2. Pricing: find the list price of the product and the customer's tier.
3. Write each quote line with its price. The screen offers no customer price for a free-text line.
4. Send for approval if the quote needs it; the quote shows "Pending approval".

**Practice scenarios** (on a practice system, never on live)

- Price a five-line request, two lines of which need cutting.
- Find the list price and tier price of one product for two customers.

**Common mistakes**

- Assuming the system priced the line. It did not: quote lines are priced by hand (S-027).
- Quoting material cost from memory. No cost is shown on the quote screen.

**Exceptions and what to do**

- A request with no customer on file: add the customer first.
- A quote that lapsed: it counts as lost on the dashboard; write a new one.

**What this login can and cannot do**

- Home branch quotes and requests, and requests with no branch (from the web store or a partner).
- Cannot change list prices unless the role allows it.

**Knowledge check**

1. Where does the price on a quote line come from?
2. What does the margin figure on the sales dashboard show?

**Complete when:** Prices the practice request and answers the knowledge check ("not measured" is the right answer to the second question).

| Trainee | Trainer | Date | Practice scenarios done | Knowledge check | Signed |
|---|---|---|---|---|---|
| ________________ | ________________ | ________________ | [ ] | [ ] | NOT GIVEN |

## Purchasing agents

Logins: BUYER or PURCHASING. Screens: `/purchase-orders`, `/receiving`, `/heats`, `/inventory`.

**Required workflows**

- Write and place a purchase order
- Follow what has arrived against it
- Close a purchase order with nothing more to come
- Read the supply position

**Step by step**

1. Purchase orders, "New purchase order": supplier, wanted-by date, lines with grade, size, quantity, unit and price.
2. Tick MTR where a mill certificate is required.
3. "Place with supplier" when it has been placed.
4. Watch "Received" rise as Receiving books material against the lines.
5. "Close (nothing more to come)" when the supplier will ship no more.
6. Tab "Supply position": read Free, On order, Coming by transfer and Projected free by branch and grade.

**Practice scenarios** (on a practice system, never on live)

- Write a two-line purchase order, place it, and have a colleague receive half of line one.
- Close the remainder and read the supply position before and after.

**Common mistakes**

- Leaving the price off a line: the stock received then has no cost and cannot be valued.
- Expecting the system to suggest what to buy. There are no reorder points (K-010).
- Expecting a supplier invoice screen. There is none (K-012).

**Exceptions and what to do**

- Over-receipt: more than ordered is held for a decision.
- Material arrives with no certificate against an MTR line: it is held until the certificate is on file.
- Heat not on file: add it under Heats first.

**What this login can and cannot do**

- Purchase orders of the home branch.
- Cannot adjust stock or post to the ledger.

**Knowledge check**

1. What becomes the cost of received stock?
2. What happens to material received without a required certificate?
3. Does the system match supplier invoices?

**Complete when:** Completes both practice scenarios and the knowledge check.

| Trainee | Trainer | Date | Practice scenarios done | Knowledge check | Signed |
|---|---|---|---|---|---|
| ________________ | ________________ | ________________ | [ ] | [ ] | NOT GIVEN |

## Warehouse employees

Logins: RECEIVING_CLERK, WAREHOUSE or INVENTORY_MANAGER. Screens: `/receiving`, `/inventory`, `/units`, `/transfers`, `/heats`, `/material-tracking/packages`.

**Required workflows**

- Receive material against a purchase order
- Find a stock item and read its heat and certificate
- Reserve stock for an order line
- Send and receive a transfer
- Correct a stock quantity with a reason

**Step by step**

1. Receiving: choose the purchase order line, enter heat, weight and dimensions, and receive.
2. Inventory: search by number, grade or heat. The item page shows on hand, reserved, held and free.
3. Reserve stock from the order: choose the line and the stock item.
4. Send a transfer from the stock item's page. The other branch receives it under Transfers, "Coming in".
5. A correction needs a reason and is recorded under your name; a manager sees it in the audit log.

**Practice scenarios** (on a practice system, never on live)

- Receive a line in two parts.
- Send an item to another branch and have it received one piece short; decide the shortage.
- Reserve stock for an order and then try to reserve more than is free.

**Common mistakes**

- Correcting a transfer shortage with a stock adjustment instead of deciding it on the transfer.
- Receiving against the wrong line.
- Moving steel physically to another branch without a transfer: the system then shows it in the wrong place.

**Exceptions and what to do**

- Stock on hold cannot be reserved or shipped until released.
- "Not enough free stock": someone else reserved it first. Reload and choose another item.
- A reserved item cannot be transferred.

**What this login can and cannot do**

- Stock of the home branch only; a transfer is the one way stock crosses branches.
- Cannot change prices, invoice or open Finance.

**Knowledge check**

1. What is "free" stock?
2. How does stock move to another branch?
3. What must be on file before stock is received against a heat?

**Complete when:** Completes the three practice scenarios and the knowledge check.

| Trainee | Trainer | Date | Practice scenarios done | Knowledge check | Signed |
|---|---|---|---|---|---|
| ________________ | ________________ | ________________ | [ ] | [ ] | NOT GIVEN |

## Production operators

Logins: OPERATOR and the machine roles. Screens: `/shopfloor`, `/order-board`, `/work-orders`, `/time-tracking`, `/schedule`.

**Required workflows**

- See the jobs at your work center
- Start, pause and complete a job step
- Record good weight, pieces and scrap on a work order
- Read the order board

**Step by step**

1. Shop floor: choose your work center. Your queue is shown in order.
2. Start the job. Pause it with a reason if you must stop. Complete it when done.
3. On a work order enter good weight out, number of pieces and scrap, and complete it.
4. Time tracking shows the hours recorded from starts and completes; there is no clock-in screen.

**Practice scenarios** (on a practice system, never on live)

- Start, pause and complete one job.
- Complete a work order with 40 lb of scrap and find the pieces it made in stock.

**Common mistakes**

- Completing a job that still needs inspection and expecting it to ship: it waits in the QC queue.
- Entering good weight plus scrap greater than the weight in. It is refused.
- Starting a job at the wrong work center.

**Exceptions and what to do**

- "Another operator has this step": it is already started. Ask before taking it over.
- Machine down: pause with the reason and tell the supervisor; maintenance screens are samples and record nothing.
- A step out of order is refused with the step that must come first.

**What this login can and cannot do**

- Jobs and work centers of the home branch.
- Cannot change the order, the price or the schedule.

**Knowledge check**

1. Where do the hours in Time tracking come from?
2. What happens after you complete a job that needs inspection?
3. Why is good weight plus scrap limited?

**Complete when:** Completes both practice scenarios and the knowledge check.

| Trainee | Trainer | Date | Practice scenarios done | Knowledge check | Signed |
|---|---|---|---|---|---|
| ________________ | ________________ | ________________ | [ ] | [ ] | NOT GIVEN |

## Quality inspectors

Logins: QC_INSPECTOR. Screens: `/qc`, `/heats`, `/material-tracking/packages`, `/material-tracking/traceability`.

**Required workflows**

- Work the QC queue
- Record an inspection result and disposition
- Hold and release material
- Read the record of a job

**Step by step**

1. Quality station: the QC Queue lists jobs waiting. Press "Start QC Inspection".
2. Record the result. A pass lets the job go on to packaging. A fail holds it for rework or scrap.
3. A package sent to quality is released or held on the Packages screen.
4. Traceability: choose the job to read every event.

**Practice scenarios** (on a practice system, never on live)

- Pass one job and fail another; follow the failed one through rework to a pass.
- Hold a package and release it.

**Common mistakes**

- Recording inspections on the Production Quality screens: those are samples and save nothing.
- Releasing material whose certificate is missing.

**Exceptions and what to do**

- A failed job cannot be packed or shipped until it passes or is dispositioned.
- A hold placed by quality is released only by quality or a manager.

**What this login can and cannot do**

- Home branch.
- Cannot dispatch, invoice or change stock quantities.

**Knowledge check**

1. Which screen records a real inspection?
2. What can a failed job not do?
3. Which quality screens are samples?

**Complete when:** Completes both practice scenarios and the knowledge check.

| Trainee | Trainer | Date | Practice scenarios done | Knowledge check | Signed |
|---|---|---|---|---|---|
| ________________ | ________________ | ________________ | [ ] | [ ] | NOT GIVEN |

## Shipping employees

Logins: SHIPPING_CLERK. Screens: `/shipping`, `/material-tracking/staging`, `/material-tracking/packages`, `/material-tracking/tags`, `/transfers`.

**Required workflows**

- Make a shipment for reserved order lines
- Dispatch it (the invoice is written at that moment)
- Confirm delivery
- Ship part of an order
- End a shipment that has a problem

**Step by step**

1. Shipping: make a shipment for the order, choosing lines and quantities that are reserved.
2. Print the papers. Press dispatch when the truck leaves.
3. Dispatch takes the stock out, writes the invoice and posts both. It may take a few seconds at a busy moment.
4. Confirm delivery with the receiver's name when it arrives.
5. A part shipment leaves the rest of the line open for a later shipment.

**Practice scenarios** (on a practice system, never on live)

- Ship an order in two shipments and find both invoices.
- Press dispatch twice quickly and check that one invoice exists.
- Try to deliver a shipment that has not left.

**Common mistakes**

- Dispatching before the truck is loaded: the invoice is already written.
- Making a second shipment for pounds already on a shipment. It is refused.
- Using the Freight and Logistics planning screens: they are samples.

**Exceptions and what to do**

- "Busy, try again" at dispatch: invoices are written one at a time company-wide. Press again.
- Dispatch refused for a hold: the order is on credit hold or the material is on quality hold.
- A lost or damaged shipment is ended by a manager as lost or returned.

**What this login can and cannot do**

- Shipments leaving the home branch.
- Cannot change the invoice, take payment or change prices.

**Knowledge check**

1. When is the invoice written?
2. What does a double press on dispatch do?
3. Who ends a lost shipment?

**Complete when:** Completes the three practice scenarios and the knowledge check.

| Trainee | Trainer | Date | Practice scenarios done | Knowledge check | Signed |
|---|---|---|---|---|---|
| ________________ | ________________ | ________________ | [ ] | [ ] | NOT GIVEN |

## Finance employees

Logins: CFO, CREDIT_MANAGER; AUDITOR reads. Screens: `/finance`, `/orders/invoices`, `/orders/credit-holds`, `/admin/tax-rates`, `/admin/audit-log`.

**Required workflows**

- Check the books against the records
- Clear events that did not post
- Write and post a manual entry with a second person
- Close and reopen a month
- Release a credit hold
- Make the export for the accountant

**Step by step**

1. Finance, Overview, "Check now". Read each check.
2. "Not posted": read the reason, fix the cause, "Post again".
3. Journal, "New journal entry": a draft. A second finance person posts it.
4. Months: close when the month is finished.
5. Export: map the accounts, choose dates, "Make the export file".

**Practice scenarios** (on a practice system, never on live)

- On the practice system, plant nothing: run a check, then clear one waiting event by entering the missing cost.
- Write an entry and have a colleague post it; then reverse it.
- Close a month and see a back-dated event wait.

**Common mistakes**

- Posting an entry to remove a reconciliation difference without finding its cause.
- Treating the ledger as the full accounts. Payroll, rent, supplier bills and the bank are not in it.
- Reading "gross margin on material" as profit.

**Exceptions and what to do**

- An event dated in a closed month waits until the month is reopened.
- A control account adjustment needs the owner or CFO.
- The books cannot start until the accountant's approval is recorded.

**What this login can and cannot do**

- Company figures for finance roles; a branch manager sees the branch only.
- Nobody, including finance and the application itself, can change or delete a posted entry.

**Knowledge check**

1. Can a posted entry be edited?
2. Who may post the entry you wrote?
3. What is not in this ledger?
4. What does a reconciliation correct?

**Complete when:** Completes the three practice scenarios and the knowledge check. Training on the live books waits for the accountant's approval.

| Trainee | Trainer | Date | Practice scenarios done | Knowledge check | Signed |
|---|---|---|---|---|---|
| ________________ | ________________ | ________________ | [ ] | [ ] | NOT GIVEN |

## Branch managers

Logins: BRANCH_MANAGER. Screens: `/ops-cockpit`, `/orders`, `/orders/credit-holds`, `/orders/closeout`, `/inventory`, `/shipping`, `/finance`, `/admin/audit-log`, `/admin/staff`.

**Required workflows**

- Read the branch through the operations cockpit
- Approve overrides and release holds
- End a problem shipment
- Decide a transfer shortage
- Read the branch's ledger reports
- Review the audit log

**Step by step**

1. Operations cockpit: jobs at risk, work center load, shipping and material for the branch.
2. Orders not closed: what each open order is waiting for.
3. Audit log: who overrode what, with the reason.
4. Finance: the branch's trial balance and reports. A branch trial balance need not balance.

**Practice scenarios** (on a practice system, never on live)

- Find the three oldest open orders and say what each waits for.
- Find an override in the audit log and read its reason.
- Decide a practice transfer shortage both ways.

**Common mistakes**

- Lending a manager login to clear a refusal.
- Accepting a cockpit recommendation without reading what it will move.
- Reading the delivery-promise chip as a commitment.

**Exceptions and what to do**

- Records of another branch are not visible; a regional manager is given several branches by an administrator.
- A month closed by finance cannot be posted into.

**What this login can and cannot do**

- The home branch and any branches assigned.
- Cannot start or stop the books, create administrators, or change another branch.

**Knowledge check**

1. Why might your branch trial balance not balance?
2. Where are overrides recorded?
3. How does a manager see a second branch?

**Complete when:** Completes the three practice scenarios and the knowledge check.

| Trainee | Trainer | Date | Practice scenarios done | Knowledge check | Signed |
|---|---|---|---|---|---|
| ________________ | ________________ | ________________ | [ ] | [ ] | NOT GIVEN |

## Corporate executives

Logins: EXECUTIVE, COO, CFO, TENANT_OWNER. Screens: `/ops-cockpit`, `/sales/dashboard`, `/executive/compression-metrics`, `/finance`, `/admin/integrations`.

**Required workflows**

- Read the company across branches
- Read order speed
- Read revenue and margin on material by branch
- See what needs action

**Step by step**

1. Operations cockpit shows all branches for head-office roles.
2. Order speed (compression metrics) shows time from order to ship against the service target.
3. Finance, Reports: revenue and gross margin on material by branch, customer or product.
4. Integrations: "Nothing needs action", or a list of what does.

**Practice scenarios** (on a practice system, never on live)

- Find the branch with the most revenue this month and its margin on material.
- Find whether anything shipped without an invoice.

**Common mistakes**

- Using the Executive cockpit, simulation, forecast, decisions or digital-twin screens for decisions: they are samples with invented figures and say so.
- Reading margin on material as profit.

**Exceptions and what to do**

- A figure shown as "not measured" has no data behind it; it is not zero.

**What this login can and cannot do**

- All branches, read. Changes go through the roles that own them.

**Knowledge check**

1. Which executive screens are samples?
2. What does "not measured" mean?

**Complete when:** Answers the knowledge check and both practice questions from the real screens.

| Trainee | Trainer | Date | Practice scenarios done | Knowledge check | Signed |
|---|---|---|---|---|---|
| ________________ | ________________ | ________________ | [ ] | [ ] | NOT GIVEN |

## System administrators

Logins: ADMIN, SUPER_ADMIN. Screens: `/admin/users`, `/admin/partners`, `/admin/integrations`, `/admin/tax-rates`, `/admin/audit-log`, `/admin/processing-recipes`, `/admin/staff`, `/admin/catalog`.

**Required workflows**

- Create a login with a role and a home branch
- Switch a login off
- Give a manager further branches
- Issue and revoke a partner key
- Maintain tax rates
- Read the integration report and the audit log

**Step by step**

1. Admin, Users: create the user with role and home branch. Nobody can create a login above their own level.
2. Switch a leaver off the same day: the login stops at the next request.
3. Admin, Partners: a key is shown once. Revoke it when the partner changes.
4. Admin, Integrations: check daily until alerts reach a person.

**Practice scenarios** (on a practice system, never on live)

- Create a CSR at one branch, sign in as them, and confirm they cannot see another branch.
- Switch them off and confirm the open session stops.
- Issue a partner key with one scope and confirm a second scope is refused.

**Common mistakes**

- Giving ADMIN where BRANCH_MANAGER is enough: an administrator sees every branch.
- Sharing one login between people: the audit log then names nobody.
- Leaving a leaver's login active.

**Exceptions and what to do**

- A sign-in answered "database update required": a database file has not been applied; the answer names it.
- Many paused logins: see the incident runbook.

**What this login can and cannot do**

- An administrator who is not the owner or CFO cannot start or stop the books.
- Database updates and host settings are the owner's.

**Knowledge check**

1. When does a switched-off login stop working?
2. Who applies a database update?
3. How often is a partner key shown?

**Complete when:** Completes the three practice scenarios and the knowledge check.

| Trainee | Trainer | Date | Practice scenarios done | Knowledge check | Signed |
|---|---|---|---|---|---|
| ________________ | ________________ | ________________ | [ ] | [ ] | NOT GIVEN |

## The manual and contextual help (sections 31 and 32)

The manual check: 48 chapters, 156 checks, 0 failed (`qa/results/phase12-manual.json`). Sample chapters flagged: quality-compliance, supplier-quality, customer-quality, contractor-portal, training-engine, production-quality, freight-delivery, safety-ehs. Chapters naming their sample screens: executive, logistics, maintenance.

- The Help button on a screen opens that screen's chapter in a drawer; the manual page lists every chapter the login may read.
- Field hints, required-field marks and plain error messages were reviewed screen by screen in Phase 9. Guided first-use tours and searchable in-product help beyond the manual are **not built**.
- The wording of the older chapters was not re-read line by line against every screen in this phase (M-018, S-024 stay in progress).
