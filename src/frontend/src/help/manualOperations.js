/**
 * manualOperations.js: manual chapters for the real screens that had none until Phase 12
 * (finance, purchasing, transfers, work orders, invoices and returns, administration checks)
 * and one chapter on what to do when something goes wrong. Same block types as manualContent.js.
 * Every button, tab and column named here is on the screen under that name; qa/tools/phase12-manual.mjs
 * checks that every route named exists.
 */
const ALL = ['METALS', 'PLASTICS', 'SUPPLIES', 'OUTLET']
const FINANCE = ['CFO', 'TENANT_OWNER', 'SUPER_ADMIN', 'ADMIN', 'EXECUTIVE', 'AUDITOR', 'CREDIT_MANAGER', 'BRANCH_MANAGER', 'DIVISION_DIRECTOR']
const STOCK = ['INVENTORY_MANAGER', 'RECEIVING_CLERK', 'WAREHOUSE', 'SHIPPING_CLERK', 'BRANCH_MANAGER', 'OPS_MANAGER', 'ADMIN', 'SUPER_ADMIN']
const OFFICE = ['CSR', 'SALES_REP', 'BRANCH_MANAGER', 'CREDIT_MANAGER', 'CFO', 'ADMIN', 'SUPER_ADMIN']
const EVERYONE = []

const manualOperations = [
  {
    moduleId: 'finance-ledger',
    title: 'Finance (the Ledger)',
    shortDescription: 'The books kept from invoices, payments, stock and work orders: trial balance, reports, journal, months, accounts, starting and stopping, and the export for your accountant.',
    icon: 'AccountBalance',
    roles: FINANCE,
    divisions: ALL,
    routes: ['/finance'],
    sections: [
      { id: 'what-it-is', title: 'What the Ledger Is and Is Not', blocks: [
        { type: 'text', value: 'Finance shows the ledger the system keeps by itself from the work people do: an invoice, a payment, a credit, a refund, a receipt of stock, a shipment, a transfer, a stock correction and a work order each write a balanced journal entry. Nobody types those entries.' },
        { type: 'warning', value: 'Only sales, payments, stock and work orders post by themselves. Payroll, rent, supplier bills, bank activity, depreciation and income tax are in it only where a finance person posts them by journal entry. Do not use it as the company\'s books of record unless your accountant has said so.' },
        { type: 'text', value: 'Until the books are started the Overview says they are not running and lists what is still needed under "Before the books can start". Business carries on exactly as before while the books are off.' },
        { type: 'table', headers: ['Tab', 'What it shows', 'Who sees it'], rows: [
          ['Overview', 'Whether the books are running, and the last check of the books beside the business records', 'Everyone with Finance'],
          ['Trial balance', 'Every account with its debits, credits and balance', 'Everyone with Finance (a branch sees its own branch)'],
          ['Reports', 'Income statement and balance sheet (company finance roles), revenue, gross margin on material, what customers owe, sales tax, inventory value, scrap, monthly statement', 'Everyone with Finance'],
          ['Journal', 'Every entry, with the record it came from', 'Everyone with Finance'],
          ['Not posted', 'Business events that could not post, each with its reason', 'Company finance roles'],
          ['Months', 'Open and closed months', 'Company finance roles'],
          ['Accounts', 'The chart of accounts, which account each posting rule uses, and the accountant\'s approval', 'Company finance roles'],
          ['Start and stop', 'The dry run, starting the books, and stopping posting', 'Company finance roles'],
          ['Export', 'The file for your accounting system', 'Company finance roles'],
        ] },
      ] },
      { id: 'sandbox', title: 'Sandbox Books for a Demonstration', blocks: [
        { type: 'text', value: 'A demonstration system can run sandbox books: the full chart of accounts is loaded, every account and posting rule is recorded as approved by nobody, and the books open from the records as they are. Use it to show and to learn the ledger, never to keep a real company\'s accounts.' },
        { type: 'steps', items: [
          'Sign in as the owner, the chief financial officer or a super administrator. An administrator cannot start books.',
          'Open Finance, then the "Start and stop" tab.',
          'Under "Or: start sandbox books for a demonstration", press "Start sandbox books".',
          'Type START SANDBOX BOOKS, check the time zone, and confirm.',
        ] },
        { type: 'warning', value: 'Starting books cannot be undone, and books started as a sandbox stay marked SANDBOX for good. Every Finance tab and both financial statements carry the SANDBOX notice. Real books are started the ordinary way, after an accountant has approved the accounts.' },
        { type: 'text', value: 'The income statement and the balance sheet are under Reports. The balance sheet shows this year\'s net income and the earnings of earlier years as their own lines in equity, because the system does not write a year-end closing entry.' },
      ] },
      { id: 'daily', title: 'Checking the Books Against the Records', blocks: [
        { type: 'steps', items: [
          'Open Finance. The Overview is shown first.',
          'Under "The books beside the business records", press "Check now".',
          'Read the table: each check shows the figure in the books, the figure in the records and the difference.',
          'If the message is "Everything agrees." you are done.',
          'If a check did not agree, open the "Not posted" tab first: an event that has not posted is the usual cause.',
        ] },
        { type: 'warning', value: 'A check corrects nothing. A difference stays until its cause is dealt with. Never post a journal entry simply to make a difference disappear: find the record that caused it.' },
      ] },
      { id: 'not-posted', title: 'Events That Did Not Post', blocks: [
        { type: 'text', value: 'When a business event cannot be posted (for example stock received with no cost, or an account that is not approved) the business step still succeeds and the event waits on the "Not posted" tab with the reason in plain words.' },
        { type: 'steps', items: [
          'Open the "Not posted" tab.',
          'Read the reason on the line.',
          'Fix the cause where it lives: enter the missing cost on the stock item, approve the account, reopen the month.',
          'Press "Post again" on the line.',
          'Use "Settle without posting" only when your accountant has dealt with the event outside the system, and say how.',
          'Press "Find records with no entry and post them" after posting has been stopped for a while, so that nothing is missed.',
        ] },
      ] },
      { id: 'journal', title: 'Writing a Journal Entry by Hand', blocks: [
        { type: 'steps', items: [
          'Open the "Journal" tab and press "New journal entry".',
          'Enter the date, what the entry is for, and the lines. Debits must equal credits.',
          'Save. The entry is a draft: it is not in the books yet.',
          'A second finance person opens the draft and posts it. The person who wrote an entry cannot post it.',
        ] },
        { type: 'warning', value: 'A posted entry can never be changed or deleted, by anyone. To correct one, reverse it and write the right one. A control account (receivables, inventory) takes entries from business records only; an adjustment to one needs the owner or the CFO and a tick that says you mean it.' },
      ] },
      { id: 'months', title: 'Closing and Reopening a Month', blocks: [
        { type: 'text', value: 'On the "Months" tab a month can be closed once its work is finished. Nothing can be posted into a closed month: an event dated in it waits on "Not posted" and says so.' },
        { type: 'tip', value: 'The person who closed a month cannot reopen it while another finance user exists. Ask the other finance person.' },
      ] },
      { id: 'start', title: 'Starting the Books (Owner, Super Administrator or CFO)', blocks: [
        { type: 'warning', value: 'Do not start the books until your accountant has approved the accounting policies, the chart of accounts and which account each posting rule uses. The system refuses to start while any account or mapping is unapproved, and records the accountant\'s name.' },
        { type: 'steps', items: [
          'On "Accounts", review the chart with your accountant. Press "Record the approval" for each account and mapping the accountant approves.',
          'On "Start and stop", press "Run the dry run". It shows what the opening figures would be and changes nothing.',
          'Give your accountant the list under "Not opened, for your accountant to enter".',
          'Enter the accountant who approved the policies, the date, and the time zone the books are kept in. The time zone decides which day, and so which month, an event falls in, and cannot be changed afterwards.',
          'Tick the confirmation and press "Start the books".',
        ] },
        { type: 'text', value: 'Posting can be stopped on the same tab. Business goes on; what happens meanwhile is found and posted from the records when posting starts again.' },
      ] },
      { id: 'export', title: 'The Export for Your Accounting System', blocks: [
        { type: 'steps', items: [
          'On "Export", enter the account in your accounting system for each ledger account.',
          'Choose the dates and press "Make the export file".',
          'Download the file and give it to your accountant.',
        ] },
        { type: 'text', value: 'An export is refused while any account it uses has no entry in that table. No account is guessed. Nothing is sent to any outside system: the file is yours to import or not.' },
      ] },
      { id: 'trouble', title: 'Troubleshooting', blocks: [
        { type: 'troubleshoot', items: [
          { problem: 'The Overview says the books are not running', solution: 'That is the normal state until the owner or CFO starts them. Read "Before the books can start" for what is missing.' },
          { problem: 'A branch trial balance does not balance', solution: 'It need not: the other side of an entry can sit at another branch. The company trial balance always balances.' },
          { problem: 'I cannot post the entry I wrote', solution: 'By design. A second finance person posts it.' },
          { problem: 'An invoice is missing from the journal', solution: 'Look on "Not posted". If it is not there either, press "Find records with no entry and post them".' },
          { problem: 'Gross margin looks too high', solution: 'The report is gross margin on material only. Labor, machine time, freight cost and overhead are not in it.' },
        ] },
      ] },
    ],
  },
  {
    moduleId: 'purchasing',
    title: 'Purchasing',
    shortDescription: 'Purchase orders to suppliers, what has arrived against them, and the supply position by branch and grade.',
    icon: 'CallReceived',
    roles: ['PURCHASING', 'BUYER', ...STOCK],
    divisions: ALL,
    routes: ['/purchase-orders'],
    sections: [
      { id: 'what-it-does', title: 'What This Screen Does', blocks: [
        { type: 'text', value: 'Purchase orders shows what has been ordered from suppliers and how much of it has arrived. It has two tabs: "Purchase orders" and "Supply position".' },
        { type: 'text', value: 'Supplier invoices are not in the system. A purchase order records what was ordered, at what price, and what was received; paying the supplier is done in your accounting system.' },
      ] },
      { id: 'new-po', title: 'Writing a Purchase Order', blocks: [
        { type: 'steps', items: [
          'Press "New purchase order".',
          'Choose the supplier and the date the material is wanted by.',
          'Add a line for each material: grade, thickness, width, length, quantity, unit, and the price per unit.',
          'Tick MTR on a line if the supplier must send a mill certificate. Material received against that line without a certificate on file is held until it arrives.',
          'Save, then press "Place with supplier" when it has actually been placed.',
        ] },
        { type: 'tip', value: 'The price on the line becomes the cost of the stock received against it. A line with no price gives stock with no cost, which then cannot be valued.' },
      ] },
      { id: 'receive', title: 'Receiving Against a Purchase Order', blocks: [
        { type: 'text', value: 'Material is received on the Receiving screen by choosing the purchase order line. The "Received" column on the purchase order rises as it arrives. A line can be received in parts.' },
        { type: 'bullets', items: [
          'More than the quantity ordered is not turned away, because the material is already on your dock. It is received on hold with the reason shown: it is counted and on the books, but it cannot be reserved or sold until someone releases the hold.',
          'The heat must be on file before stock is received against it. Add it under Heats first.',
          'Press "Close (nothing more to come)" when the supplier will send no more, so the remainder stops counting as on order.',
        ] },
      ] },
      { id: 'supply', title: 'The Supply Position', blocks: [
        { type: 'table', headers: ['Column', 'Meaning'], rows: [
          ['On hand lb', 'Pounds in the building'],
          ['Reserved', 'Set aside for sales orders'],
          ['On hold', 'Held by quality or waiting for a certificate'],
          ['Free', 'On hand less reserved and held'],
          ['On order', 'On open purchase orders and not yet received'],
          ['Coming by transfer', 'On its way from another branch'],
          ['Sent, in transit', 'Sent to another branch and not yet received there'],
          ['Open sales not reserved', 'Ordered by customers with no stock set aside yet'],
          ['Projected free', 'Free plus what is coming, less open sales not reserved'],
        ] },
        { type: 'text', value: 'The system does not suggest what to buy and has no reorder points. The supply position gives you the figures; the decision is yours.' },
      ] },
    ],
  },
  {
    moduleId: 'transfers',
    title: 'Transfers Between Branches',
    shortDescription: 'Send stock to another branch and receive it there, with shortages and damage recorded at receipt.',
    icon: 'LocalShipping',
    roles: STOCK,
    divisions: ALL,
    routes: ['/transfers'],
    sections: [
      { id: 'how', title: 'How a Transfer Works', blocks: [
        { type: 'text', value: 'Stock moves from one branch to another only by a transfer. The sending branch sends it; the receiving branch receives it. Between the two it is in transit: it belongs to neither branch\'s free stock and can be sold by neither.' },
        { type: 'steps', items: [
          'Sending branch: open the stock item and send it to the other branch from its page.',
          'Receiving branch: open Transfers, choose "Coming in", open the transfer and press "Receive".',
          'For each item say what was found at receipt: all of it, less than was sent, or damaged.',
        ] },
        { type: 'text', value: 'Only the sending branch can send and only the receiving branch can receive. The tabs "Coming in", "Sent by my branch" and "All I can see" choose which transfers are listed.' },
      ] },
      { id: 'short', title: 'When Less Arrives Than Was Sent', blocks: [
        { type: 'text', value: 'A shortage found at receipt stays on the transfer as a difference until someone decides it.' },
        { type: 'bullets', items: [
          '"It turned up: keep the full quantity" when the material is found.',
          '"It is really missing: take it off the books" when it is lost. This reduces stock and is recorded under your name.',
        ] },
        { type: 'warning', value: 'Do not correct a transfer shortage with a stock adjustment. Decide it on the transfer, so that both branches and the books agree.' },
      ] },
    ],
  },
  {
    moduleId: 'work-orders',
    title: 'Work Orders (Processing a Stock Item)',
    shortDescription: 'Slitting, cut-to-length and other processing planned against a stock item, with the pieces made and the scrap recorded.',
    icon: 'PrecisionManufacturing',
    roles: ['PRODUCTION_MANAGER', 'SCHEDULER', 'OPERATOR', 'OPERATOR_SAW', 'OPERATOR_SLITTER', 'INVENTORY_MANAGER', 'BRANCH_MANAGER', 'OPS_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    divisions: ALL,
    routes: ['/work-orders'],
    sections: [
      { id: 'what', title: 'What a Work Order Is', blocks: [
        { type: 'text', value: 'A work order plans processing against one stock item (the source) and records what came out: the pieces made, each of which becomes a stock item of its own with the same heat, and the scrap.' },
        { type: 'text', value: 'The list shows each work order with its job, type, source item, grade, weight in, priority, the date it is scheduled and its status. Search and the Status and Type choices narrow the list.' },
      ] },
      { id: 'job', title: 'A Work Order and Its Job', blocks: [
        { type: 'text', value: 'Every work order has a job, because the job is what the shop plans and runs. A new work order made from the Work Orders page makes its own job. The job starts on the Order Board as a new job, is planned there like any other, and then shows on the Schedule and on the Shop Floor.' },
        { type: 'bullets', items: [
          'A work order with no order makes a stock job, numbered JS- and the next number.',
          'A work order for an order line joins the job that line already has. If the line has no open job, it makes one, numbered after the order and the line.',
          'A work order opened from a job ("Create work order" on the job) belongs to that job and makes no other.',
        ] },
        { type: 'text', value: 'The work order names its job at the top and in the list, and the job shows the work order under what it used, made and scrapped. The work order still has its own Release, Start and Complete, because completing it is what changes stock.' },
        { type: 'text', value: 'On the boards: the job\'s card on the Order Board and the Production Workflow board names its work order and the stock item it cuts, and both boards can be searched by the work order number. Stock work with no order is shown at the branch that holds the stock, so it stays on the board when a branch is picked.' },
        { type: 'tip', value: 'A work order opened before work orders had jobs has none, so it is on no board. The Work Orders page says how many there are and has a button, Put them on the boards, that gives each one its job. Finished and cancelled work orders are left as they are.' },
        { type: 'warning', value: 'Cancelling a work order also cancels the job it made, as long as nobody has started the job and no other work order is cutting for it. A job that came from an order is left alone.' },
      ] },
      { id: 'complete', title: 'Recording What Was Made', blocks: [
        { type: 'steps', items: [
          'Open the work order.',
          'Enter the good weight out, the number of pieces, and the scrap in pounds.',
          'Complete it. The pieces appear under "Pieces made by this work order" and in stock.',
        ] },
        { type: 'warning', value: 'Good weight plus scrap cannot be more than the weight that went in. The system refuses a figure that would create steel from nothing.' },
        { type: 'text', value: '"Work order history" at the bottom shows who did what and when.' },
      ] },
    ],
  },
  {
    moduleId: 'invoices-returns',
    title: 'Invoices, Payments, Returns and Closing Orders',
    shortDescription: 'What customers owe, recording payments, credits and refunds, taking material back, and the orders still waiting to close.',
    icon: 'AttachMoney',
    roles: OFFICE,
    divisions: ALL,
    routes: ['/orders/invoices', '/orders/returns', '/orders/closeout'],
    sections: [
      { id: 'invoices', title: 'Invoices and What Is Owed', blocks: [
        { type: 'text', value: 'An invoice is written by the system when a shipment is dispatched. Nobody types one. The Invoices screen lists them with the total, the balance and the due date, and shows what is owed by age and the credits owed back to customers.' },
        { type: 'steps', items: [
          'Find the invoice by its number or the order number and open it.',
          'Press "Record payment". Enter the amount, the method and the check or reference number.',
          'The balance falls by the payment. A payment larger than the balance is refused.',
        ] },
        { type: 'tip', value: 'Pressing "Record payment" twice by accident does not take the money twice: the second press is answered with the first payment.' },
      ] },
      { id: 'credits', title: 'Credits and Refunds', blocks: [
        { type: 'bullets', items: [
          '"Issue credit" reduces what the customer owes, with a reason that is required.',
          '"Record refund" records money given back against a credit.',
          '"Cancel invoice" is for an invoice raised in error and needs a reason.',
        ] },
        { type: 'warning', value: 'For returned material use Returns, not a credit typed here. A return puts the stock back and credits the right amount with tax.' },
      ] },
      { id: 'returns', title: 'Taking Material Back', blocks: [
        { type: 'steps', items: [
          'Open Returns and press "New return".',
          'Enter the sales order number and press "Find order".',
          'Choose the lines and quantities coming back. "Can return" shows the most that can still be returned on each line.',
          'Enter the reason, which is required, and press "Open return".',
          'When the material arrives press "Receive" and say what happens to it: "Put back in stock" or "Scrap (damaged)".',
          'Press "Issue credit". If it was settled another way, record how under "Settled another way".',
        ] },
      ] },
      { id: 'closeout', title: 'Orders Not Closed', blocks: [
        { type: 'text', value: '"Orders not closed" lists every open order with what it is waiting for: stock, production, a shipment, an invoice or a payment. An order closes by itself when everything on it has shipped, been invoiced and been paid.' },
      ] },
    ],
  },
  {
    moduleId: 'admin-checks',
    title: 'Integrations, Tax Rates and Staff',
    shortDescription: 'What the system is connected to and what has failed, the sales tax rate for each state, and the shop-floor staff list.',
    icon: 'AdminPanelSettings',
    roles: ['ADMIN', 'SUPER_ADMIN', 'TENANT_OWNER', 'INTEGRATION_ADMIN', 'CFO', 'OPS_MANAGER', 'BRANCH_MANAGER'],
    divisions: ALL,
    routes: ['/admin/integrations', '/admin/tax-rates', '/admin/locations', '/admin/staff'],
    sections: [
      { id: 'integrations', title: 'Integrations: What Needs Action', blocks: [
        { type: 'text', value: 'The Integrations screen answers three questions: what is this system connected to, what has failed, and what has shipped without an invoice.' },
        { type: 'table', headers: ['Part of the screen', 'What to do with it'], rows: [
          ['What this system is connected to', 'Each outside service with its state and what happens if it is not available. "Not connected" is the honest state of a service nobody has set up.'],
          ['Events that could not be delivered', 'A message to a partner that failed after its retries. Read the reason; it is sent again when the cause is fixed.'],
          ['Orders shipped but not invoiced', 'Should be empty. A line here means a shipment left and its invoice was not written: tell finance the same day.'],
          ['Calls to outside services', 'How many calls were made since this server started, how many failed or timed out, and the average time.'],
        ] },
        { type: 'text', value: 'When nothing is wrong the screen says "Nothing needs action."' },
      ] },
      { id: 'tax', title: 'Sales Tax Rates', blocks: [
        { type: 'steps', items: [
          'Open Sales tax rates.',
          'Enter the state and the rate in percent and press "Save rate".',
          'To change a rate, type the new figure on its line and press "Save". To take one away press "Remove".',
        ] },
        { type: 'warning', value: 'A sale in a state with no rate on file charges no tax, and the sale screen says so. Rates are by state only: counties and cities are not on record. Ask your accountant which rates apply before the first live sale.' },
      ] },
      { id: 'staff', title: 'Shop-Floor Staff', blocks: [
        { type: 'text', value: 'Staff lists operators with their home branch, home work center, skill level and certifications, and their shifts. It is the list the shop-floor screens choose an operator from. It is not the list of people who can sign in: logins are under Admin, Users.' },
      ] },
    ],
  },
  {
    moduleId: 'material-tracking',
    title: 'Material Tracking (Packages, Tags, Staging and Traceability)',
    shortDescription: 'Pack finished material into packages, tag them, stage and load them, and read the record of who handled what.',
    icon: 'Label',
    roles: ['PACKAGING', 'SHIPPING_CLERK', 'WAREHOUSE', 'QC_INSPECTOR', 'OPERATOR', 'BRANCH_MANAGER', 'OPS_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    divisions: ALL,
    routes: ['/material-tracking', '/material-tracking/packaging', '/material-tracking/packages', '/material-tracking/tags', '/material-tracking/staging', '/material-tracking/traceability'],
    sections: [
      { id: 'overview', title: 'The Material Tracking Screens', blocks: [
        { type: 'text', value: 'Material Tracking opens on a dashboard with four counts (Jobs in Pipeline, Active Packages, Active Tags, Events in the last 24 hours) and a card for each screen.' },
        { type: 'table', headers: ['Screen', 'What it is for'], rows: [
          ['Packaging Queue', 'Jobs that have finished processing and are waiting to be packed, by priority'],
          ['Packages', 'Open a package for an order line, add material to it, seal it and make its tag'],
          ['Tag Management', 'Every tag with its grade, heat number, pieces and weight; void a tag with a reason'],
          ['Staging & Loading', 'Jobs ready to ship and jobs recently shipped, with carrier and tracking number'],
          ['Traceability', 'The record of events for a job: state changes, custody handoffs, moves, damage reports and notes'],
        ] },
      ] },
      { id: 'pack', title: 'Packing an Order Line', blocks: [
        { type: 'steps', items: [
          'Open Packages, enter the order number and press "Find order".',
          'Choose the order line and the kind of package, and press "Open package".',
          'Press "Add material": choose the stock item, the pieces and the weight in pounds.',
          'Press "Seal" when the package is complete, then "Make tag".',
          'Press "Send to quality" if the package must be released by quality before it ships. "Hold" and "Release" stop and free a package.',
        ] },
        { type: 'warning', value: 'Material can be packed only from stock that is reserved for the order line. If the screen says "No stock is reserved for this order line", reserve the stock on the order first.' },
        { type: 'text', value: 'When a work order made for an order line is completed, its finished pieces are reserved for that line automatically, up to what the line still needs, so they are ready to pack and ship. Pieces from a work order with no order line stay free stock.' },
        { type: 'text', value: 'Completing a work order also moves its job out of production: to inspection when the job needs one, otherwise to ready to ship. The job stays where it is, and the screen says why, when another work order is still open for it, when a planned step is not finished on the Shop Floor, or when it is on hold.' },
        { type: 'text', value: 'Packaging, staging, the Shipment Planner and the Shipping screen are one flow. A job for a customer order is never marked shipped from the Packaging Queue, Staging & Loading or the shop-floor shipping screen. When the job is ready to ship, those screens say "No shipment planned yet" with a "Plan shipment" button, which opens the Shipping screen with the order found, and the Shipment Planner lists the order. Once the shipment is made they show its number and "Open shipment". The job is marked shipped by itself when that shipment is dispatched, which is also when the stock leaves and the invoice is written. Only a job with no customer order is marked shipped by hand.' },
      ] },
      { id: 'trace', title: 'Reading and Adding to the Record', blocks: [
        { type: 'steps', items: [
          'Open Traceability and choose the job under "Select Job", or read "All Events (Global Log)".',
          'Filter by event type or search the events.',
          'To record something that happened, press "Add Custody Log Entry", choose the event type (Custody Handoff, Location Transfer, Damage Report or General Note), say what happened and press "Add Entry".',
        ] },
        { type: 'text', value: 'An entry is recorded under your name with the time. Entries are not edited or removed afterwards.' },
      ] },
    ],
  },
  {
    moduleId: 'quality-station',
    title: 'Quality Station (QC Queue)',
    shortDescription: 'Jobs waiting for inspection, inspections in progress, and completed inspections with their result and disposition.',
    icon: 'FactCheck',
    roles: ['QC_INSPECTOR', 'QUALITY_MANAGER', 'PRODUCTION_MANAGER', 'BRANCH_MANAGER', 'OPS_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    divisions: ALL,
    routes: ['/qc'],
    sections: [
      { id: 'queue', title: 'Working the Queue', blocks: [
        { type: 'text', value: 'The QC Queue lists jobs that have finished their operations and are waiting for inspection, with the job number, order, operation, work center, priority and how long each has waited. A job that needs inspection cannot go on to packaging and shipping until it has passed.' },
        { type: 'steps', items: [
          'Open the Quality Station. The QC Queue is shown first.',
          'Press "Start QC Inspection" on a job. Assign the inspector and add notes if needed.',
          'The job moves to "In Progress". Record the result and the disposition when the inspection is done.',
          'A passed job moves on. A failed job is held for rework or scrap and does not ship.',
        ] },
        { type: 'text', value: '"Completed" and "All Inspections" show past inspections with the inspector, the result and the disposition. "View Details" opens one.' },
        { type: 'warning', value: 'The screens under Production Quality, Supplier Quality and Customer Quality are design samples and are not connected to this queue. Real inspections are recorded here.' },
      ] },
    ],
  },
  {
    moduleId: 'when-something-goes-wrong',
    title: 'When Something Goes Wrong',
    shortDescription: 'What the common messages mean, what to do, what is safe to press again, and who to tell.',
    icon: 'SupportAgent',
    roles: EVERYONE,
    divisions: ALL,
    routes: [],
    sections: [
      { id: 'messages', title: 'Messages You May See', blocks: [
        { type: 'troubleshoot', items: [
          { problem: '"Busy, try again" or "try again in a moment"', solution: 'The system was doing the same kind of work for someone else, or the database was briefly unavailable. Nothing was half saved. Press the button again.' },
          { problem: '"Still being processed"', solution: 'Your first press is still running. Wait a few seconds and look at the record before pressing again.' },
          { problem: '"That record belongs to another branch" or the record is "not found"', solution: 'You are signed in to a different branch from the record. Staff see and change only their own branch. Ask that branch or a manager who sees all branches.' },
          { problem: '"You do not have permission"', solution: 'Your role does not include that step. Ask your manager; do not borrow a login.' },
          { problem: '"This was changed by someone else"', solution: 'Another person saved the record after you opened it. Reload, check their change, and make yours again.' },
          { problem: 'You are sent back to the sign-in page', solution: 'Your session ended, or your login was switched off. Sign in again. If it is refused, ask an administrator.' },
          { problem: '"Too many attempts"', solution: 'Sign-in is paused for a few minutes after repeated wrong passwords. Wait, then try once with care.' },
          { problem: 'A screen carries a "Sample screen" notice', solution: 'That screen shows example data. Nothing on it is your records and nothing entered is saved. The notice names the real screen to use instead.' },
          { problem: 'A page shows "Something went wrong" with a reference', solution: 'Note the reference and the time, and what you pressed. Reload the page. If it happens again, report it with the reference.' },
        ] },
      ] },
      { id: 'safe', title: 'What Is Safe to Press Twice', blocks: [
        { type: 'text', value: 'These steps are protected against a double press or a lost connection: the second press is answered with the result of the first.' },
        { type: 'bullets', items: [
          'Dispatching a shipment: it leaves once and one invoice is written.',
          'Recording a payment, a counter sale, or a web order.',
          'Receiving a transfer, and receiving against a purchase order.',
        ] },
        { type: 'tip', value: 'If you are not sure whether something saved, open the record and look before doing it again.' },
      ] },
      { id: 'report', title: 'Reporting a Problem', blocks: [
        { type: 'text', value: 'Tell your branch manager or administrator. Give them enough to find it:' },
        { type: 'bullets', items: [
          'The screen you were on and what you pressed.',
          'The order, shipment, invoice or stock item number.',
          'The exact words of the message, and the reference if one was shown.',
          'The time, and your branch.',
        ] },
        { type: 'warning', value: 'Never work around a refusal by using another person\'s login, by changing a quantity to make a figure fit, or by entering the same thing a second time under a new number. A refusal is the system protecting stock or money: report it.' },
      ] },
    ],
  },
]

export default manualOperations
