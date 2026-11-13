# UX improvement register

Filled in per workstream. Workstream 2 covered the sales and customer screens.

| ID | Screen | Issue | Status |
|---|---|---|---|
| U-001 | Sales Dashboard | Showed fixed sample figures (D-036) | Fixed (S-012): counted figures, "Not available" where nothing is measured |
| U-002 | Order Hub RFQ pages | A second RFQ console beside RFQs & Quotes | Open: decision S-021 |
| U-003 | Margin widget | Showed invented margin figures | Fixed (E-006) |
| U-004 | Several secondary screens | Call server routes that do not exist (D-020) | Open; 18 are sales calls (S-026) |
| U-005 | Order entry, Retail POS, order detail | A failed save said only "failed" | Fixed: the screen shows the server's reason |
| U-006 | Order entry | Showed a tax figure that was not saved | Fixed (S-007) |
| U-007 | Sales Rep Mobile | Sample customers, products and orders; "submitted" when nothing was saved | Fixed (S-005) |
| U-008 | Sales Rep Mobile, delivery preview | A date nobody computed | Caution notice added; engine open (S-010) |
| U-009 | Customers > Preferences | Save always failed; Pricing Tier did nothing | Fixed (S-013, S-014). Helper text says who can change the tier |
| U-010 | Pricing | Sample rows and dead buttons; not in the menu | Fixed (S-017, S-018): real price book, in the menu under Sales & Customers |
| U-011 | Order entry, Retail POS | Branch list fixed at four Michigan branches | Open (S-008) |
| U-012 | Customers > Preferences | "Default Discount %" is offered and applied nowhere | Open: decision S-020 |
| U-013 | Help manual, sales pages | Described features that do not exist | Fixed for pricing, dashboard, mobile and customers (S-024) |

Not reviewed yet: keyboard-only use, screen-reader labels and colour contrast on any screen (Workstream 6).
| U-014 | Inventory (stock items), Heats | Sample rows on every screen | Fixed (I-001, I-002): real records, server-side search, honest empty states |
| U-015 | Order entry, stock picker | Showed our cost and priced the line at it | Fixed (I-003): list price |
| U-016 | Stock upload | Said "Successfully uploaded N items" whatever happened | Fixed (I-005): the count saved, and each failed row with its reason |
| U-017 | Receiving | Sample deliveries; the form saved nothing | Fixed (I-006). Says plainly that expected deliveries need purchase orders (I-007) |
| U-018 | Stock item | A hold could not be released; no way to move an item | Fixed (I-008, I-014): Release hold and Move |
| U-019 | Supplier quality, six screens | Invented data presented as real | Labelled as samples (I-011); build is a decision |
| U-020 | Menu | "Inventory" and "Units" were two different stock lists | One entry, Inventory, on the real list (I-012, pending the owner's answer) |
| U-021 | Orders | No sign that an order was over the credit limit | Fixed (rule 32): warning on entry, a Credit Holds list, Release for managers |
| U-022 | Receiving | A heat must be added before its stock, one at a time | Open (I-017) |
| U-023 | Job screen | A sample job for every job; status dialog saved nothing | Fixed (M-001): real job, real history with names, a status change that saves and explains a refusal |
| U-024 | Order boards, Schedule | Clicking a job that was past planning did nothing | Fixed: opens the job screen |
| U-025 | Schedule | Random work centers and jobs; "AI-optimized" | Fixed (M-008, M-014): the real day; a notice for jobs with no work center |
| U-026 | Time tracking | Random hours shown when loading failed | Fixed (M-009) |
| U-027 | Work orders | Blank columns, a sample work order, buttons that did nothing | Fixed (M-007): list with server search, detail with Release, Start, Complete (weights) and Cancel, and history |
| U-028 | Old operator screen | Recorded output into nothing | Removed (M-010): opens the real shop floor |
| U-029 | Production quality, BOMs | Invented data presented as real | Labelled as samples (M-011); build is a decision |
| U-030 | QC Inspections | "Failed to create inspection" although it was created | Fixed (M-015) |
| U-031 | Shipping | Menu item showed invented shipments; no way to ship on screen | Fixed (F-002): real list, New shipment, Dispatch, Mark delivered |
| U-032 | Shipment | No one could see who dispatched or delivered | Fixed (F-004): history table with names |
| U-033 | Invoices | No one could see who took a payment or issued a credit | Fixed (F-006): history on the invoice |
| U-034 | All Orders | Tax shown as 0 and total as subtotal; sample orders on error | Fixed (F-007) |
| U-035 | Freight and logistics | Invented routes, rates and tracking presented as real | Labelled as samples (F-007); build is a decision |
| U-036 | Shipment | No button to print a bill of lading or packing list | Open (F-011) |
