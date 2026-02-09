/**
 * manualContent.js — Single source of truth for in-app help manual.
 *
 * Each module exports:
 *   moduleId, title, shortDescription, icon, roles, divisions, routes,
 *   sections: [{ id, title, blocks }]
 *
 * Block types:
 *   { type: 'text', value: '...' }
 *   { type: 'heading', value: '...' }
 *   { type: 'steps', items: ['Step text', ...] }
 *   { type: 'bullets', items: ['Bullet', ...] }
 *   { type: 'tip', value: '...' }
 *   { type: 'warning', value: '...' }
 *   { type: 'table', headers: [...], rows: [[...], ...] }
 *   { type: 'do-dont', dos: [...], donts: [...] }
 *   { type: 'troubleshoot', items: [{ problem, solution }, ...] }
 *   { type: 'fields', items: [{ name, required, description }, ...] }
 */

const manualModules = [
  // ─── 1. ORDER INTAKE / CSR ───────────────────────────────────────────
  {
    moduleId: 'order-intake',
    title: 'Order Intake / CSR',
    shortDescription: 'Take customer orders by phone or in person. Build quotes, apply pricing, and submit orders for processing.',
    icon: 'PhoneInTalk',
    roles: ['CSR', 'SALES_REP', 'BRANCH_MANAGER', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES', 'OUTLET'],
    routes: ['/orders/intake'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'Order Intake is where you enter new customer orders into the system. You can take orders from phone calls, walk-in customers, or emails. The system calculates pricing, checks inventory, and routes the order to the shop floor for processing.' },
        ],
      },
      {
        id: 'who-uses-it',
        title: 'Who Uses It',
        blocks: [
          { type: 'bullets', items: [
            'CSR (Customer Service Representative) — primary user, takes orders by phone or email',
            'Sales Rep — enters orders for their accounts',
            'Branch Manager — reviews and approves special pricing or rush orders',
          ]},
        ],
      },
      {
        id: 'before-you-start',
        title: 'Before You Start',
        blocks: [
          { type: 'bullets', items: [
            'Make sure you are logged in and your location is set correctly (check top-right corner)',
            'Have the customer name, account number, or phone number ready',
            'Know what products the customer wants (grade, thickness, width, length, quantity)',
            'Know if the customer needs any processing (cutting, shearing, bending, etc.)',
            'Check if the customer has a purchase order (PO) number',
          ]},
        ],
      },
      {
        id: 'create-new-order',
        title: 'How to Create a New Order',
        blocks: [
          { type: 'steps', items: [
            'Click "CSR Intake" in the sidebar under Order Intake.',
            'The intake form opens. Start by searching for the customer in the Customer field. Type the customer name or account number.',
            'Select the customer from the dropdown. Their account details (pricing level, credit status, ship-to address) will auto-fill.',
            'If the customer is new, click "Add New Customer" and fill in their details.',
            'In the Items section, click "Add Item" to add the first product.',
            'Search for the product by name, SKU, or description (e.g., "A36 plate" or "304 SS bar").',
            'Select the product. Enter the quantity, dimensions (thickness × width × length), and unit of measure.',
            'If the customer needs processing (cutting, drilling, bending), click "Add Processing" on that line item and select the operations.',
            'Repeat steps 5–8 for each item the customer wants.',
            'Review the order summary at the bottom: subtotal, processing charges, estimated weight, and shipping.',
            'Enter the customer PO number if they have one.',
            'Select the requested delivery date.',
            'Click "Submit Order" to send it for processing.',
          ]},
          { type: 'tip', value: 'If the customer is just asking for a price and not ready to order, use "Save as Quote" instead of "Submit Order". You can convert the quote to an order later.' },
        ],
      },
      {
        id: 'add-processing',
        title: 'How to Add Processing to an Item',
        blocks: [
          { type: 'steps', items: [
            'On the line item row, click the "Add Processing" button (gear icon).',
            'A processing panel opens. Select the type of processing: Cut to Length, Shear, Saw, Drill, Bend, etc.',
            'Enter the specifications for each operation (e.g., cut length = 48", quantity of pieces = 10).',
            'The system calculates estimated processing time and cost automatically.',
            'Click "Apply" to add the processing to the line item.',
            'The line item price will update to include processing charges.',
          ]},
          { type: 'warning', value: 'Double-check dimensions before submitting. Wrong dimensions mean rework and waste. Always read back dimensions to the customer.' },
        ],
      },
      {
        id: 'apply-special-pricing',
        title: 'How to Apply Special Pricing',
        blocks: [
          { type: 'steps', items: [
            'If the customer has contract pricing, it applies automatically when you select their account.',
            'To apply a manual discount, click the price field on any line item.',
            'Enter the override price or discount percentage.',
            'If the discount exceeds your authority level, the system will flag it for manager approval.',
            'Add a reason for the override in the "Override Reason" field (required).',
            'The override is logged in the Audit Trail for accountability.',
          ]},
          { type: 'do-dont', dos: [
            'Always enter a reason for price overrides',
            'Check the customer\'s contract pricing before manually discounting',
            'Verify the price with a manager if unsure',
          ], donts: [
            'Never override pricing without a documented reason',
            'Don\'t guess at contract pricing — look it up',
            'Don\'t approve your own overrides above your threshold',
          ]},
        ],
      },
      {
        id: 'rush-orders',
        title: 'How to Mark an Order as Rush',
        blocks: [
          { type: 'steps', items: [
            'On the order form, find the "Priority" dropdown near the top.',
            'Change it from "Standard" to "Rush" or "Critical".',
            'The system will check if the rush can be accommodated based on shop floor capacity.',
            'If capacity allows, the order is flagged with a red priority badge.',
            'If capacity is tight, you\'ll see a warning. Contact the shop floor supervisor before promising rush delivery.',
            'Rush orders may have additional charges — the system will add them automatically based on your location\'s rush pricing rules.',
          ]},
        ],
      },
      {
        id: 'common-mistakes',
        title: 'Common Mistakes to Avoid',
        blocks: [
          { type: 'do-dont', dos: [
            'Always confirm the ship-to address with the customer',
            'Double-check dimensions: thickness × width × length',
            'Read the order back to the customer before submitting',
            'Save the order as a draft if you need to step away',
            'Note any special instructions in the Notes field',
          ], donts: [
            'Don\'t submit without verifying inventory availability',
            'Don\'t forget to add processing if the customer needs it',
            'Don\'t skip the PO number for account customers — billing needs it',
            'Don\'t promise a delivery date without checking the schedule',
            'Don\'t leave the customer on hold — use "Save Draft" and call back',
          ]},
        ],
      },
      {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        blocks: [
          { type: 'troubleshoot', items: [
            { problem: 'Customer not found in search', solution: 'Try searching by phone number or partial name. If truly new, click "Add New Customer" to create them.' },
            { problem: 'Product not showing in catalog', solution: 'Check if you\'re searching in the right division (Metals vs. Plastics). Try a broader search term. If the product isn\'t in the catalog, contact your manager.' },
            { problem: 'Price seems wrong', solution: 'Check if contract pricing is applied. Verify the customer\'s price level. Check if weight-based pricing is calculating correctly for the dimensions entered.' },
            { problem: 'Can\'t submit order — validation error', solution: 'Look for red-highlighted fields. Common issues: missing customer, missing quantity, invalid dimensions, or missing PO number for account customers.' },
            { problem: 'Rush order rejected by system', solution: 'The shop floor may be at capacity. Contact the shop supervisor directly. You may need to adjust the delivery date or split the order.' },
          ]},
        ],
      },
      {
        id: 'done-criteria',
        title: 'How You Know It Worked',
        blocks: [
          { type: 'bullets', items: [
            'You see a green confirmation message with the Order Number (e.g., ORD-2026-0123)',
            'The order appears in the Order Board with status "SUBMITTED"',
            'The customer receives an order confirmation (if email is configured)',
            'The order shows up in the shop floor queue for scheduling',
          ]},
        ],
      },
    ],
  },

  // ─── 2. POS / RETAIL COUNTER ────────────────────────────────────────
  {
    moduleId: 'pos-retail',
    title: 'POS / Retail Counter',
    shortDescription: 'Process walk-in counter sales, cash-and-carry, and retail purchases at the service counter.',
    icon: 'Storefront',
    roles: ['CSR', 'COUNTER_SALES', 'BRANCH_MANAGER', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES', 'OUTLET'],
    routes: ['/pos', '/pos/retail'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'The POS (Point of Sale) is for walk-in customers at the counter. It works like a cash register — you add items, apply pricing, take payment, and print a receipt. It is designed for fast counter sales.' },
        ],
      },
      {
        id: 'who-uses-it',
        title: 'Who Uses It',
        blocks: [
          { type: 'bullets', items: [
            'Counter Sales Staff — primary user',
            'CSR — backup counter coverage',
            'Branch Manager — price approvals and overrides',
          ]},
        ],
      },
      {
        id: 'before-you-start',
        title: 'Before You Start',
        blocks: [
          { type: 'bullets', items: [
            'Make sure your cash drawer is ready and reconciled from the last shift',
            'Verify your location is correct in the system',
            'Have product quick-reference sheets nearby for common items',
          ]},
        ],
      },
      {
        id: 'ring-up-sale',
        title: 'How to Ring Up a Counter Sale',
        blocks: [
          { type: 'steps', items: [
            'Click "Retail POS" in the sidebar under Order Intake.',
            'The POS screen opens with a product search bar at the top.',
            'Type the product name or SKU in the search bar (e.g., "flat bar" or "A36").',
            'Click on the product from the dropdown results. It gets added to the order on the right side.',
            'Adjust the quantity by clicking the +/- buttons or typing the number.',
            'If the customer needs a specific length or cut, click the item to expand dimensions and enter them.',
            'Repeat for each product the customer wants.',
            'Review the subtotal at the bottom of the order panel.',
            'If the customer has an account, click "Select Customer" and search for their name. Contract pricing will apply automatically.',
            'For walk-in cash customers, leave it as "Walk-In" — retail pricing applies.',
            'Click "Place Order" to finalize.',
            'Select payment method: Cash, Credit Card, Check, or Account.',
            'Complete the payment process.',
            'Print or email the receipt.',
          ]},
        ],
      },
      {
        id: 'apply-discount',
        title: 'How to Apply a Counter Discount',
        blocks: [
          { type: 'steps', items: [
            'Click on the line item you want to discount.',
            'Click the "Discount" button or edit the unit price directly.',
            'Enter the discount percentage or new price.',
            'If the discount exceeds your authority (usually 10%), the system requires manager approval.',
            'A manager can approve by entering their PIN or scanning their badge.',
            'The discount is logged with your name and the manager who approved it.',
          ]},
          { type: 'tip', value: 'Remnant and drop items have pre-set discounts. Check the Remnant Outlet section for clearance pricing before manually discounting.' },
        ],
      },
      {
        id: 'process-return',
        title: 'How to Process a Return',
        blocks: [
          { type: 'steps', items: [
            'Click "Returns" or the return icon in the POS header.',
            'Search for the original order by order number or customer name.',
            'Select the items being returned.',
            'Enter the return reason (defective, wrong item, customer changed mind, etc.).',
            'Verify the physical condition of the item.',
            'Click "Process Return" — the system creates a credit.',
            'Refund to original payment method or issue store credit.',
            'Print the return receipt for the customer to sign.',
          ]},
          { type: 'warning', value: 'All returns require manager approval. The manager must verify the item condition before processing.' },
        ],
      },
      {
        id: 'common-mistakes',
        title: 'Common Mistakes to Avoid',
        blocks: [
          { type: 'do-dont', dos: [
            'Always verify the item before the customer leaves the counter',
            'Count the items in the customer\'s order and match to the receipt',
            'Ask if the customer has an account — they may get better pricing',
            'Process payment before releasing the material',
          ], donts: [
            'Don\'t let customers leave without a receipt',
            'Don\'t process discounts above your authority without manager approval',
            'Don\'t skip weighing items that are priced by weight',
            'Don\'t forget to ask about processing needs (cuts, holes, bends)',
          ]},
        ],
      },
      {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        blocks: [
          { type: 'troubleshoot', items: [
            { problem: 'Product search returns no results', solution: 'Try a different search term. Check if you\'re in the right division. Some specialty items may be under a different name.' },
            { problem: 'Payment won\'t process', solution: 'For credit cards: check the card reader connection. Try a different card. For account billing: verify the customer\'s credit status is active.' },
            { problem: 'Price doesn\'t look right', solution: 'Check if the right customer is selected. Walk-in gets retail pricing; account customers get contract pricing. Verify dimensions are correct.' },
            { problem: 'Can\'t find the original order for a return', solution: 'Ask the customer for their receipt or order number. Search by date range if needed. Contact a manager if the order is older than 30 days.' },
            { problem: 'Drawer won\'t open', solution: 'Check the USB connection to the cash drawer. Try the manual release under the drawer. Contact IT if it persists.' },
          ]},
        ],
      },
      {
        id: 'done-criteria',
        title: 'How You Know It Worked',
        blocks: [
          { type: 'bullets', items: [
            'The order shows a green "Completed" status',
            'The receipt prints or emails successfully',
            'The payment amount matches the order total',
            'Inventory is automatically deducted for the sold items',
          ]},
        ],
      },
    ],
  },

  // ─── 3. E-COMMERCE SHOP ─────────────────────────────────────────────
  {
    moduleId: 'ecommerce-shop',
    title: 'E-Commerce Shop (Customer Portal)',
    shortDescription: 'Online storefront where customers browse products, configure orders, and submit purchases 24/7.',
    icon: 'Storefront',
    roles: ['ADMIN', 'BRANCH_MANAGER', 'ECOMMERCE_ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES', 'OUTLET'],
    routes: ['/shop', '/shop/search', '/shop/cart', '/shop/checkout', '/shop/orders'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'The E-Commerce Shop is your online storefront. Customers can browse your product catalog, see real-time pricing and availability, configure cut-to-size orders, add processing, and submit orders online — 24 hours a day, 7 days a week. It handles both retail and account customers.' },
        ],
      },
      {
        id: 'who-uses-it',
        title: 'Who Uses It',
        blocks: [
          { type: 'bullets', items: [
            'Customers — browse, shop, and place orders online',
            'E-Commerce Admin — manages catalog visibility, featured products, and online settings',
            'Branch Manager — reviews online orders and approves special requests',
            'CSR — assists customers with online orders via phone support',
          ]},
        ],
      },
      {
        id: 'manage-catalog',
        title: 'How to Manage the Online Catalog',
        blocks: [
          { type: 'steps', items: [
            'Navigate to "Catalog Admin" in the E-Commerce sidebar section.',
            'You will see a list of all products with their online visibility status.',
            'To show/hide a product online, toggle the "Visible" switch on its row.',
            'To feature a product on the homepage, check the "Featured" box.',
            'To change the sort order, drag products up or down in the list.',
            'Click "Save Changes" when done.',
          ]},
          { type: 'tip', value: 'Products with zero inventory still show online but display "Out of Stock". To completely hide them, turn off visibility.' },
        ],
      },
      {
        id: 'review-online-orders',
        title: 'How to Review Online Orders',
        blocks: [
          { type: 'steps', items: [
            'Online orders appear in the "Online Inbox" under Order Intake.',
            'New orders have a blue "NEW" badge.',
            'Click on an order to review the details.',
            'Verify the customer information, items, pricing, and delivery date.',
            'If everything looks good, click "Confirm Order" to move it to production.',
            'If something needs attention (pricing review, availability issue), click "Flag for Review" and add a note.',
            'If the order was a quote request, prepare the quote and send it back to the customer.',
          ]},
        ],
      },
      {
        id: 'online-settings',
        title: 'How to Configure Online Settings',
        blocks: [
          { type: 'steps', items: [
            'Navigate to "Online Settings" in the E-Commerce sidebar section.',
            'Here you can configure: minimum order amounts, shipping options, payment methods, and customer registration settings.',
            'To change the minimum order amount, update the "Minimum Order $" field.',
            'To enable/disable a payment method, toggle the switch next to it.',
            'To update shipping zones and rates, click the "Shipping" tab.',
            'Click "Save Settings" when done.',
          ]},
        ],
      },
      {
        id: 'common-mistakes',
        title: 'Common Mistakes to Avoid',
        blocks: [
          { type: 'do-dont', dos: [
            'Review online orders promptly — customers expect fast confirmation',
            'Keep the catalog up to date with correct pricing',
            'Respond to quote requests within 2 hours during business hours',
            'Monitor the Online Inbox for new orders throughout the day',
          ], donts: [
            'Don\'t leave online orders unconfirmed for more than 4 hours',
            'Don\'t forget to update product availability when stock runs out',
            'Don\'t ignore quote requests — they are potential sales',
            'Don\'t change online pricing without coordinating with the sales team',
          ]},
        ],
      },
      {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        blocks: [
          { type: 'troubleshoot', items: [
            { problem: 'Customer says they can\'t see a product online', solution: 'Check if the product\'s "Visible" toggle is on in Catalog Admin. Check if it\'s assigned to the right division.' },
            { problem: 'Online pricing doesn\'t match phone pricing', solution: 'Online shows retail pricing by default. Account customers see their contract pricing after logging in. Verify the customer\'s price level is set correctly.' },
            { problem: 'Customer can\'t complete checkout', solution: 'Check if the order meets the minimum amount. Verify their shipping address is valid. Check if their payment method is enabled in settings.' },
            { problem: 'Order shows up in the wrong location', solution: 'Check the customer\'s default location setting. The order routes to the location assigned to the customer\'s account.' },
          ]},
        ],
      },
      {
        id: 'done-criteria',
        title: 'How You Know It Worked',
        blocks: [
          { type: 'bullets', items: [
            'The customer receives an order confirmation email',
            'The order appears in the Online Inbox with status "NEW"',
            'After confirmation, the order moves to the Order Board for scheduling',
            'The customer can track their order status in "My Orders"',
          ]},
        ],
      },
    ],
  },

  // ─── 4. ONLINE ORDER INBOX / TRIAGE ────────────────────────────────
  {
    moduleId: 'online-inbox',
    title: 'Online Order Inbox / Triage',
    shortDescription: 'Review, confirm, or flag incoming online orders before they hit the shop floor.',
    icon: 'Inbox',
    roles: ['CSR', 'SALES_REP', 'BRANCH_MANAGER', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES', 'OUTLET'],
    routes: ['/orders/online-inbox'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'The Online Inbox shows all orders that came in through the website, email, or customer portal. You review each order, verify the details, and either confirm it (send to production) or flag it for attention. Think of it as a quality check before orders hit the shop floor.' },
        ],
      },
      {
        id: 'who-uses-it',
        title: 'Who Uses It',
        blocks: [
          { type: 'bullets', items: [
            'CSR — primary reviewer, handles most online order triage',
            'Sales Rep — reviews orders from their assigned accounts',
            'Branch Manager — handles flagged orders and escalations',
          ]},
        ],
      },
      {
        id: 'triage-an-order',
        title: 'How to Triage an Incoming Order',
        blocks: [
          { type: 'steps', items: [
            'Open the "Online Inbox" from the Order Intake sidebar section.',
            'You will see a list of orders sorted by newest first. New orders have a blue badge.',
            'Click on an order to open its detail panel.',
            'Review these items carefully:',
            '  → Customer name and account status (is their credit good?)',
            '  → Ship-to address (is it valid and complete?)',
            '  → Items and quantities (do they make sense for this customer?)',
            '  → Pricing (is the correct price level applied?)',
            '  → Delivery date (can we meet this date?)',
            '  → Special instructions (any unusual requests?)',
            'If everything checks out, click "Confirm Order". The order moves to the Order Board.',
            'If something needs attention, click "Flag for Review" and select the reason.',
            'If the order is a duplicate or invalid, click "Reject" and enter a reason.',
          ]},
        ],
      },
      {
        id: 'flag-reasons',
        title: 'When to Flag an Order',
        blocks: [
          { type: 'bullets', items: [
            'Pricing needs review — unusual discount or price override request',
            'Credit hold — customer account has a credit issue',
            'Availability concern — requested item may be out of stock',
            'Rush request — customer wants delivery faster than standard lead time',
            'Unusual quantity — order is much larger or smaller than typical',
            'Special processing — customer requests processing we may not offer',
            'Incomplete information — missing PO number, ship-to address, or contact',
          ]},
          { type: 'tip', value: 'When in doubt, flag the order. It\'s better to take an extra minute to verify than to send a wrong order to the floor.' },
        ],
      },
      {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        blocks: [
          { type: 'troubleshoot', items: [
            { problem: 'Inbox is empty but customers say they placed orders', solution: 'Check the "All" tab instead of "New" — the order may have already been triaged. Check the spam/email filters if orders come via email integration.' },
            { problem: 'Can\'t confirm an order — button is grayed out', solution: 'The order may require manager approval first (e.g., credit hold, large discount). Check the flags and resolve them before confirming.' },
            { problem: 'Order shows wrong pricing', solution: 'Verify the customer\'s account has the correct price level. If needed, manually adjust the pricing before confirming.' },
          ]},
        ],
      },
      {
        id: 'done-criteria',
        title: 'How You Know It Worked',
        blocks: [
          { type: 'bullets', items: [
            'Confirmed orders disappear from the inbox and appear on the Order Board',
            'Flagged orders show an orange warning badge and stay in the inbox for review',
            'The customer receives a confirmation email when you confirm their order',
            'The inbox count badge decreases as you process orders',
          ]},
        ],
      },
    ],
  },

  // ─── 5. SCHEDULING & CAPACITY ──────────────────────────────────────
  {
    moduleId: 'scheduling-capacity',
    title: 'Scheduling & Capacity',
    shortDescription: 'Schedule jobs to work centers, manage daily capacity, and make next-day delivery promises.',
    icon: 'Schedule',
    roles: ['SCHEDULER', 'SHOP_SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS'],
    routes: ['/schedule', '/planning'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'Scheduling & Capacity lets you assign jobs to specific work centers (saws, brakes, lasers, etc.) on specific dates. It shows you how much capacity each work center has and warns you when you\'re overloading. It also powers the "next-day delivery promise" — the system can tell customers whether their order can ship tomorrow based on current shop floor load.' },
        ],
      },
      {
        id: 'who-uses-it',
        title: 'Who Uses It',
        blocks: [
          { type: 'bullets', items: [
            'Scheduler — primary user, plans the daily and weekly schedule',
            'Shop Supervisor — reviews the schedule, adjusts based on floor conditions',
            'Branch Manager — reviews capacity utilization and bottlenecks',
          ]},
        ],
      },
      {
        id: 'before-you-start',
        title: 'Before You Start',
        blocks: [
          { type: 'bullets', items: [
            'Check the Order Board for new unscheduled jobs',
            'Know which work centers are available today (check maintenance schedule)',
            'Know your operator availability (who is on shift)',
            'Review any rush orders that need priority scheduling',
          ]},
        ],
      },
      {
        id: 'schedule-a-job',
        title: 'How to Schedule a Job',
        blocks: [
          { type: 'steps', items: [
            'Go to "Schedule" in the sidebar under Service Center.',
            'You will see a timeline view with work centers on the left and time slots across the top.',
            'Unscheduled jobs appear in a panel on the right side.',
            'Find the job you want to schedule. You can search by job number or customer.',
            'Option A — Drag and drop: Drag the job card and drop it onto the timeline at the desired work center and time.',
            'Option B — Click to schedule: Click the job card, then click "Schedule". Select the work center, date, and time slot from the form.',
            'The system shows a capacity check: green = good, yellow = tight, red = overloaded.',
            'If capacity allows, click "Confirm" to lock in the schedule.',
            'If overloaded, the system suggests alternative dates or work centers.',
            'The job now appears on the timeline with a colored bar showing duration.',
          ]},
          { type: 'tip', value: 'Schedule rush orders first thing in the morning. Then fill remaining capacity with standard orders.' },
        ],
      },
      {
        id: 'check-capacity',
        title: 'How to Check Daily Capacity',
        blocks: [
          { type: 'steps', items: [
            'On the Schedule page, look at the capacity bars above each work center.',
            'Green = under 70% utilized (room for more jobs)',
            'Yellow = 70–90% utilized (getting full)',
            'Red = over 90% utilized (at or over capacity)',
            'Click on a work center name to see a detailed breakdown of scheduled jobs.',
            'To see the weekly view, click the "Week" tab at the top.',
            'To see just today, click "Today".',
          ]},
        ],
      },
      {
        id: 'reschedule-a-job',
        title: 'How to Reschedule or Move a Job',
        blocks: [
          { type: 'steps', items: [
            'Find the job on the timeline (search by job number if needed).',
            'Drag it to a new time slot or work center.',
            'Or click the job and select "Reschedule" from the menu.',
            'Choose the new date, time, and work center.',
            'Click "Confirm" to update the schedule.',
            'The shop floor display updates automatically.',
          ]},
          { type: 'warning', value: 'Rescheduling a job may affect other jobs that depend on it. Check for downstream impacts before moving.' },
        ],
      },
      {
        id: 'common-mistakes',
        title: 'Common Mistakes to Avoid',
        blocks: [
          { type: 'do-dont', dos: [
            'Schedule rush orders first, then fill with standard',
            'Leave 10–15% capacity buffer for emergencies and rework',
            'Check material availability before scheduling a job',
            'Review the schedule at the start and end of each day',
          ], donts: [
            'Don\'t overload a single work center — spread the load',
            'Don\'t schedule jobs without checking operator availability',
            'Don\'t ignore red capacity warnings — they cause delays',
            'Don\'t move rush orders to make room for standard orders',
          ]},
        ],
      },
      {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        blocks: [
          { type: 'troubleshoot', items: [
            { problem: 'Job doesn\'t appear in the unscheduled list', solution: 'The job may already be scheduled. Check the timeline. Or the job hasn\'t been created yet — check the Order Board.' },
            { problem: 'Can\'t schedule to a specific work center', solution: 'The work center may be marked as "Down" for maintenance. Check the maintenance schedule. Or it may not support the required operation.' },
            { problem: 'Capacity shows red but schedule looks empty', solution: 'There may be maintenance windows blocked out. Or another scheduler may have just added jobs. Refresh the page to see the latest.' },
            { problem: 'Customer asking if we can deliver tomorrow', solution: 'Check the capacity for today and tomorrow. If there\'s room, you can promise next-day. If not, use the "Promise Check" feature to find the earliest available date.' },
          ]},
        ],
      },
      {
        id: 'done-criteria',
        title: 'How You Know It Worked',
        blocks: [
          { type: 'bullets', items: [
            'The job appears on the timeline at the scheduled date, time, and work center',
            'The job status changes from "PENDING" to "SCHEDULED"',
            'The capacity bar updates to reflect the new load',
            'The shop floor display shows the job in the operator\'s queue',
          ]},
        ],
      },
    ],
  },

  // ─── 6. SHOP FLOOR EXECUTION ───────────────────────────────────────
  {
    moduleId: 'shop-floor',
    title: 'Shop Floor Execution',
    shortDescription: 'Operators clock in to jobs, track time per operation, record materials used, and report completion.',
    icon: 'PrecisionManufacturing',
    roles: ['OPERATOR', 'SHOP_SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS'],
    routes: ['/shopfloor', '/order-board'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'Shop Floor Execution is the operator\'s screen. It shows all the jobs scheduled for their work center, lets them clock in and out of each job, record what they did, and flag any issues. It\'s designed to be simple enough to use with gloves on or on a shop floor touchscreen.' },
        ],
      },
      {
        id: 'who-uses-it',
        title: 'Who Uses It',
        blocks: [
          { type: 'bullets', items: [
            'Operators — primary user, works on jobs and records progress',
            'Shop Supervisor — monitors progress, handles issues, reassigns work',
            'Branch Manager — reviews daily production output',
          ]},
        ],
      },
      {
        id: 'start-a-job',
        title: 'How to Start Working on a Job',
        blocks: [
          { type: 'steps', items: [
            'Go to "Shop Floor Queue" in the sidebar under Service Center.',
            'You will see a list of jobs assigned to your work center, sorted by priority.',
            'Find the next job to work on (highest priority or earliest due date).',
            'Click on the job card to open it.',
            'Review the job details: what to make, dimensions, material, and special instructions.',
            'Verify the material is staged at your work center.',
            'Click "Start Work" or "Clock In" to begin. The timer starts automatically.',
            'The job status changes to "IN PROGRESS" and shows on the board with a green "active" indicator.',
          ]},
        ],
      },
      {
        id: 'complete-operations',
        title: 'How to Complete Operations on a Job',
        blocks: [
          { type: 'steps', items: [
            'Each job has one or more operations listed (e.g., Saw, Shear, Bend, Drill).',
            'Start with the first operation. Click "Start" next to it.',
            'Perform the work following the specifications shown.',
            'When the operation is done, click "Complete" on that operation.',
            'The system asks you to confirm: pieces completed, scrap count, any notes.',
            'Move to the next operation and repeat.',
            'After the last operation is complete, click "Complete Job".',
            'The timer stops. Total time is recorded automatically.',
          ]},
          { type: 'tip', value: 'If you need to pause (lunch break, material wait), click "Pause". This stops the timer without closing the job.' },
        ],
      },
      {
        id: 'report-issue',
        title: 'How to Report an Issue',
        blocks: [
          { type: 'steps', items: [
            'While working on a job, click the "Report Issue" button (warning triangle icon).',
            'Select the issue type: Material Defect, Equipment Problem, Wrong Specs, Safety Concern, or Other.',
            'Add a description of what happened.',
            'Take a photo if possible (click camera icon or attach from phone).',
            'Click "Submit Issue". Your supervisor is notified immediately.',
            'The job may be paused or flagged depending on the severity.',
            'Wait for supervisor guidance before continuing.',
          ]},
          { type: 'warning', value: 'For safety concerns, STOP WORK IMMEDIATELY. Use the Stop Work Authority button (red stop sign) if there is a safety risk.' },
        ],
      },
      {
        id: 'record-scrap',
        title: 'How to Record Scrap',
        blocks: [
          { type: 'steps', items: [
            'When completing an operation, the system asks for piece counts.',
            'Enter "Good Pieces" — the number that passed quality check.',
            'Enter "Scrap Pieces" — the number that did not pass.',
            'Select the scrap reason: Setup Waste, Material Defect, Operator Error, Equipment Malfunction.',
            'The scrap is automatically deducted from yield calculations.',
          ]},
        ],
      },
      {
        id: 'common-mistakes',
        title: 'Common Mistakes to Avoid',
        blocks: [
          { type: 'do-dont', dos: [
            'Always clock in before starting work — it tracks your time',
            'Read the full job spec before cutting any material',
            'Report issues immediately — don\'t try to fix bad material',
            'Take your time on the first piece and verify dimensions',
            'Clock out of one job before clocking into another',
          ], donts: [
            'Don\'t start cutting without verifying the material matches the job',
            'Don\'t forget to record scrap — it affects inventory accuracy',
            'Don\'t skip the "Complete" step — the next department needs to know you\'re done',
            'Don\'t work on two jobs simultaneously without clocking properly',
            'Don\'t ignore "Rush" priority flags — those have customer delivery promises',
          ]},
        ],
      },
      {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        blocks: [
          { type: 'troubleshoot', items: [
            { problem: 'Job doesn\'t appear on my screen', solution: 'Check with your supervisor. The job may be assigned to a different work center. Or it may not be scheduled yet.' },
            { problem: 'Timer won\'t start', solution: 'Make sure you\'re not already clocked into another job. You can only be active on one job at a time. Complete or pause the other job first.' },
            { problem: 'Wrong material staged for the job', solution: 'Do NOT use the wrong material. Report the issue. Tag the material with "Do Not Use" and notify the material handler.' },
            { problem: 'Touchscreen not responding', solution: 'Clean the screen with a dry cloth. Remove gloves for the touchscreen. If it\'s frozen, press and hold the power button for 5 seconds to restart.' },
            { problem: 'Forgot to clock in before starting work', solution: 'Clock in now. Then go to "Edit Time" and adjust the start time. Your supervisor may need to approve the time edit.' },
          ]},
        ],
      },
      {
        id: 'done-criteria',
        title: 'How You Know It Worked',
        blocks: [
          { type: 'bullets', items: [
            'The job status changes to "COMPLETED" on the board',
            'All operations show green checkmarks',
            'Time tracking shows the total hours logged',
            'The job moves to the QC queue (or packaging if QC is not required)',
            'Your daily output count increases on the dashboard',
          ]},
        ],
      },
    ],
  },

  // ─── 7. PACKAGING & DROP TAGS ──────────────────────────────────────
  {
    moduleId: 'packaging-drop-tags',
    title: 'Packaging & Drop Tags',
    shortDescription: 'Build packages, print labels and drop tags, weigh and seal, then stage for shipping.',
    icon: 'Inventory2',
    roles: ['PACKAGING', 'WAREHOUSE', 'SHOP_SUPERVISOR', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES'],
    routes: ['/packaging', '/packaging/queue', '/packaging/qc-release', '/packaging/labels', '/packaging/staging', '/drop-tags/queue', '/drop-tags/print-center'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'Packaging takes completed jobs and prepares them for shipping. You build packages (pallets, bundles, crates), weigh them, attach labels and drop tags, run a final quality check, and stage the package at the dock for pickup. Drop tags are the identification labels attached to each piece or bundle so it can be traced from the shop floor to the customer.' },
        ],
      },
      {
        id: 'who-uses-it',
        title: 'Who Uses It',
        blocks: [
          { type: 'bullets', items: [
            'Packaging Operator — builds and labels packages',
            'QC Release — final quality check before shipping',
            'Warehouse Staff — moves packages to staging area',
            'Shipping Coordinator — verifies staged packages match shipments',
          ]},
        ],
      },
      {
        id: 'build-a-package',
        title: 'How to Build a Package',
        blocks: [
          { type: 'steps', items: [
            'Go to "Packaging Queue" in the sidebar (under Packaging & Custody or Drop Tag Engine).',
            'You will see a list of completed jobs ready for packaging.',
            'Click on a job to start packaging.',
            'Select the package type: Pallet, Bundle, Box, or Crate.',
            'Scan or manually enter each item going into the package.',
            'The system checks that each item belongs to this job.',
            'Place the package on the scale. Enter the actual weight.',
            'The system compares actual weight to estimated weight and flags if off by more than 2%.',
            'Add protective materials as needed (corner guards, wrapping, etc.).',
            'Click "Complete Package". The package gets a unique Package ID.',
          ]},
        ],
      },
      {
        id: 'print-drop-tags',
        title: 'How to Print Drop Tags',
        blocks: [
          { type: 'steps', items: [
            'Go to "Print Center" under Drop Tag Engine (or "Label Management" under Packaging).',
            'Search for the job or package by number.',
            'Select the tag type: Item Tag, Bundle Tag, Package Tag, or Shipping Label.',
            'Review the tag preview — verify all information is correct.',
            'Select the printer and number of copies.',
            'Click "Print". Tags print on the label printer.',
            'Attach each tag to the corresponding item or package.',
            'Scan the tag barcode to confirm it\'s applied (system records the attachment).',
          ]},
          { type: 'tip', value: 'Print extra tags as spares. Tags can get damaged during handling. Keep spares in the job folder.' },
        ],
      },
      {
        id: 'qc-release',
        title: 'How to Do QC Release',
        blocks: [
          { type: 'steps', items: [
            'Go to "QC Release Station" in the sidebar.',
            'Select the package from the queue.',
            'Run through the checklist: weight check, label check, item count, visual inspection.',
            'Each checkpoint has a pass/fail toggle. Mark each one.',
            'If all checks pass, click "Release for Shipping".',
            'If any check fails, click "Reject" and enter the reason. The package goes back for correction.',
            'Released packages move to the Staging Board.',
          ]},
        ],
      },
      {
        id: 'stage-for-shipping',
        title: 'How to Stage a Package',
        blocks: [
          { type: 'steps', items: [
            'Go to "Staging & Docks" in the sidebar.',
            'You will see a board showing dock lanes and parking spots.',
            'Physically move the package to the designated dock area.',
            'In the system, scan the package barcode or select it from the list.',
            'Assign it to a dock lane or staging spot.',
            'The shipping team can now see it\'s ready for pickup.',
          ]},
        ],
      },
      {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        blocks: [
          { type: 'troubleshoot', items: [
            { problem: 'Package weight is way off from estimate', solution: 'Recount the pieces in the package. Make sure no extra items were added by mistake. Check if the estimated weight in the system matches the product specs.' },
            { problem: 'Label printer not printing', solution: 'Check if the printer is powered on and connected. Verify label roll isn\'t empty. Try a test print from the printer menu. Restart the printer.' },
            { problem: 'Item scan doesn\'t match the job', solution: 'Verify you\'re packaging the correct job. The item may have been mixed up with another job. Set it aside and notify your supervisor.' },
            { problem: 'QC release rejected the package', solution: 'Read the rejection reason carefully. Fix the issue (recount items, replace damaged tag, re-weigh). Then re-submit for QC release.' },
          ]},
        ],
      },
      {
        id: 'done-criteria',
        title: 'How You Know It Worked',
        blocks: [
          { type: 'bullets', items: [
            'Package has a unique Package ID and barcode',
            'All items are scanned and linked to the package',
            'Weight is within tolerance',
            'All labels and drop tags are printed and attached',
            'QC Release shows green "PASSED"',
            'Package appears on the Staging Board at the assigned dock',
          ]},
        ],
      },
    ],
  },

  // ─── 8. SHIPPING / STAGING / DOCUMENTS ─────────────────────────────
  {
    moduleId: 'shipping',
    title: 'Shipping / Staging / Documents',
    shortDescription: 'Create shipments, generate BOLs and packing lists, assign carriers, and track deliveries.',
    icon: 'LocalShipping',
    roles: ['SHIPPING', 'WAREHOUSE', 'BRANCH_MANAGER', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES', 'OUTLET'],
    routes: ['/shipping', '/freight/planner', '/freight/tracking', '/freight/exceptions'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'Shipping handles everything from creating a shipment record to tracking delivery. You assign packages to shipments, pick the carrier (UPS, FedEx, LTL freight, company truck), generate the Bill of Lading (BOL) and packing list, print labels, and mark the shipment as shipped when the truck leaves.' },
        ],
      },
      {
        id: 'who-uses-it',
        title: 'Who Uses It',
        blocks: [
          { type: 'bullets', items: [
            'Shipping Coordinator — creates shipments, prints documents, loads trucks',
            'Warehouse Lead — verifies staged packages, coordinates dock activities',
            'Branch Manager — reviews shipping metrics and exceptions',
            'CSR — looks up tracking information for customer inquiries',
          ]},
        ],
      },
      {
        id: 'create-shipment',
        title: 'How to Create a Shipment',
        blocks: [
          { type: 'steps', items: [
            'Go to "Shipping" in the sidebar under Service Center.',
            'Click "Create Shipment" button.',
            'Select the packages to include by checking boxes next to staged packages.',
            'The system auto-fills the ship-to address from the order.',
            'Verify the address is correct. Edit if the customer requested a different ship-to.',
            'Select the carrier from the dropdown: UPS, FedEx, LTL Freight, Company Truck, or Customer Pickup.',
            'Select the service level: Ground, 2-Day, Next Day, or Freight Standard.',
            'The system shows estimated delivery date and shipping cost.',
            'Add any special instructions (liftgate required, call before delivery, etc.).',
            'Click "Create" to finalize the shipment. A Shipment ID is generated.',
          ]},
        ],
      },
      {
        id: 'print-shipping-docs',
        title: 'How to Print Shipping Documents',
        blocks: [
          { type: 'steps', items: [
            'Open the shipment detail page by clicking on the Shipment ID.',
            'Click "Documents" tab.',
            'Click "Generate BOL" — the Bill of Lading opens in a new tab.',
            'Review the BOL: shipper name, consignee, package count, weight, freight class.',
            'Print 3 copies: one for the driver, one for the customer, one for your files.',
            'Click "Generate Packing List" — print and include with the shipment.',
            'Click "Generate Shipping Label" — print and affix to the package(s).',
            'If material test reports (MTRs) are required, click "Attach Certs" and select them.',
          ]},
        ],
      },
      {
        id: 'mark-shipped',
        title: 'How to Mark a Shipment as Shipped',
        blocks: [
          { type: 'steps', items: [
            'When the truck is loaded and ready to leave:',
            'Open the shipment record.',
            'Click "Mark as Shipped".',
            'Enter the tracking number (from the carrier label or provided by the driver).',
            'Confirm the ship date and time.',
            'Enter the driver name or carrier reference number.',
            'Click "Confirm".',
            'The system automatically notifies the customer with tracking information.',
            'The order status updates to "SHIPPED".',
          ]},
        ],
      },
      {
        id: 'handle-customer-pickup',
        title: 'How to Handle a Customer Pickup (Will Call)',
        blocks: [
          { type: 'steps', items: [
            'When creating the shipment, select "Customer Pickup" as the carrier.',
            'The system stages the order in the Will Call area.',
            'When the customer arrives, ask for their name and order number.',
            'Go to the shipment record and click "Customer Pickup".',
            'Verify their ID matches the order contact.',
            'Have the customer sign on the screen or print a pickup receipt for signature.',
            'Click "Released to Customer" to complete the pickup.',
            'The order updates to "DELIVERED".',
          ]},
        ],
      },
      {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        blocks: [
          { type: 'troubleshoot', items: [
            { problem: 'Can\'t find a package for the shipment', solution: 'Check the Staging Board to verify the package is there. It may still be in QC Release. Contact packaging if needed.' },
            { problem: 'BOL won\'t generate', solution: 'Make sure all required fields are filled: shipper address, consignee address, package count, weight, and freight class. Check for red error highlights.' },
            { problem: 'Carrier tracking shows no data', solution: 'It can take 1-2 hours for carriers to scan packages into their system. Wait and check again. Verify the tracking number is entered correctly.' },
            { problem: 'Customer says they never received the shipment', solution: 'Check the tracking number in the carrier\'s website. Look for "Delivered" status and delivery proof. If carrier shows delivered, provide the POD. If not, file a claim with the carrier.' },
            { problem: 'Wrong items shipped to customer', solution: 'Immediately notify the customer and apologize. Create a return authorization. Ship the correct items as a rush. File an incident report to prevent recurrence.' },
          ]},
        ],
      },
      {
        id: 'done-criteria',
        title: 'How You Know It Worked',
        blocks: [
          { type: 'bullets', items: [
            'Shipment shows status "SHIPPED" with a tracking number',
            'All documents (BOL, packing list, labels) are printed and attached',
            'Customer receives a shipping notification email',
            'The order status updates to "SHIPPED"',
            'Tracking shows movement within 24 hours',
          ]},
        ],
      },
    ],
  },

  // ─── 9. INVENTORY & TRANSFERS ──────────────────────────────────────
  {
    moduleId: 'inventory',
    title: 'Inventory & Transfers',
    shortDescription: 'View stock levels, transfer material between locations, receive incoming shipments, and track coils/sheets/bars.',
    icon: 'Inventory2',
    roles: ['WAREHOUSE', 'INVENTORY_MANAGER', 'CSR', 'BRANCH_MANAGER', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES', 'OUTLET'],
    routes: ['/inventory', '/heats', '/units', '/receiving'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'Inventory shows you everything you have in stock: coils, sheets, bars, plates, tubes, and supplies. You can see quantities, locations (warehouse bay, rack, shelf), and history. You can also transfer material between locations and receive new stock from suppliers.' },
        ],
      },
      {
        id: 'who-uses-it',
        title: 'Who Uses It',
        blocks: [
          { type: 'bullets', items: [
            'Warehouse Staff — receives, moves, and picks material',
            'Inventory Manager — monitors stock levels, plans replenishment',
            'CSR — checks availability before promising to customers',
            'Purchasing — reviews low stock alerts for reorder',
          ]},
        ],
      },
      {
        id: 'check-stock',
        title: 'How to Check Stock Availability',
        blocks: [
          { type: 'steps', items: [
            'Go to "Inventory" in the sidebar under Materials.',
            'Use the search bar at the top to search by product, grade, or dimensions.',
            'Filter by division (Metals, Plastics, etc.) and location if needed.',
            'The results show: product name, grade, dimensions, quantity on hand, quantity available (not reserved), and location.',
            'Click on any item to see full details: lot number, heat number, weight, and reservation status.',
            '"Available" means it\'s in stock and not reserved for another order.',
            '"Reserved" means it\'s in stock but spoken for — don\'t promise it to someone else.',
          ]},
          { type: 'tip', value: 'When a customer asks "Do you have X in stock?", search inventory and check the "Available" column, not just "On Hand".' },
        ],
      },
      {
        id: 'receive-material',
        title: 'How to Receive Incoming Material',
        blocks: [
          { type: 'steps', items: [
            'When a truck arrives with material, go to "Receiving" in the sidebar.',
            'Click "New Receipt" to start a receiving session.',
            'Enter the supplier name and PO number (from the purchase order).',
            'Scan or enter each item received:',
            '  → Scan the heat/lot tag on the material',
            '  → Enter the grade, dimensions, and weight',
            '  → Enter the quantity of pieces or coils',
            'The system matches received items to the purchase order.',
            'If there are discrepancies (wrong quantity, wrong grade, damaged), flag them.',
            'Assign a storage location for each item (bay, rack, shelf).',
            'Click "Complete Receipt" when all items are entered.',
            'The inventory is updated immediately.',
          ]},
        ],
      },
      {
        id: 'transfer-material',
        title: 'How to Transfer Material Between Locations',
        blocks: [
          { type: 'steps', items: [
            'Go to the Inventory page.',
            'Find the item you want to transfer.',
            'Click "Transfer" on the item row (or select multiple items and click "Bulk Transfer").',
            'Select the destination location from the dropdown.',
            'Enter the quantity to transfer.',
            'Add a reason for the transfer (e.g., "Rebalancing stock", "Customer request").',
            'Click "Submit Transfer".',
            'The origin location shows decreased stock.',
            'The destination location shows increased stock after the transfer is confirmed on the receiving end.',
          ]},
        ],
      },
      {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        blocks: [
          { type: 'troubleshoot', items: [
            { problem: 'Inventory count doesn\'t match physical count', solution: 'Do a physical recount. If the discrepancy is confirmed, create an inventory adjustment with a reason code. Notify your manager for variances over $500.' },
            { problem: 'Can\'t find material that should be in stock', solution: 'Check if it was recently moved or transferred. Look at the item history for the last scan location. Check if it was reserved for another order.' },
            { problem: 'Received material doesn\'t match purchase order', solution: 'Do NOT put it into stock. Flag the discrepancy on the receiving screen. Contact purchasing to resolve with the supplier.' },
            { problem: 'System shows "Available: 0" but physical stock exists', solution: 'The stock may be reserved for pending orders. Check the "Reserved" quantity. If nothing is reserved, create an adjustment.' },
          ]},
        ],
      },
      {
        id: 'done-criteria',
        title: 'How You Know It Worked',
        blocks: [
          { type: 'bullets', items: [
            'Stock levels update in real-time after receiving, transfers, or sales',
            'New receipts show in the receiving log with all items accounted for',
            'Transfers show in both origin and destination location histories',
            'Low stock alerts trigger when quantities drop below reorder points',
          ]},
        ],
      },
    ],
  },

  // ─── 10. PRICING ──────────────────────────────────────────────────
  {
    moduleId: 'pricing',
    title: 'Pricing (Contract / Retail / Remnant)',
    shortDescription: 'Manage price lists, contract pricing, retail margins, and remnant/outlet discounts.',
    icon: 'AttachMoney',
    roles: ['PRICING_MANAGER', 'SALES_REP', 'BRANCH_MANAGER', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES', 'OUTLET'],
    routes: ['/pricing'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'Pricing controls how much every product costs in every scenario. There are three main price levels: Retail (walk-in customers), Contract (account customers with negotiated pricing), and Remnant/Outlet (discounted drops and overruns). The system automatically applies the right price based on who the customer is.' },
        ],
      },
      {
        id: 'who-uses-it',
        title: 'Who Uses It',
        blocks: [
          { type: 'bullets', items: [
            'Pricing Manager — sets and updates price lists, contract pricing, and margins',
            'Sales Rep — reviews pricing for their accounts, requests contract pricing',
            'Branch Manager — approves pricing changes and large discounts',
            'CSR — sees pricing applied to orders (read-only for most CSRs)',
          ]},
        ],
      },
      {
        id: 'understand-pricing',
        title: 'Understanding the Pricing Tiers',
        blocks: [
          { type: 'table', headers: ['Tier', 'Who Gets It', 'How It\'s Set'], rows: [
            ['Retail', 'Walk-in, cash-and-carry, new customers', 'Base price × retail margin — set by Pricing Manager'],
            ['Contract', 'Account customers with agreements', 'Negotiated per customer — set by Sales Rep + Manager approval'],
            ['Remnant/Outlet', 'Anyone buying remnants, drops, or offcuts', 'Marked down 30–65% from retail — set automatically or manually'],
          ]},
          { type: 'text', value: 'When a CSR selects a customer on an order, the system automatically applies the correct pricing tier. Contract pricing overrides retail. Remnant pricing applies to items tagged as remnants.' },
        ],
      },
      {
        id: 'update-retail-pricing',
        title: 'How to Update Retail Pricing',
        blocks: [
          { type: 'steps', items: [
            'Go to "Pricing" in the sidebar under Commercial.',
            'Click the "Retail Pricing" tab.',
            'Use the search bar to find the product or product family.',
            'Click on the product row to edit.',
            'Update the base price per unit ($/lb, $/ft, $/ea, etc.).',
            'Set the margin percentage.',
            'Click "Save". The new price takes effect immediately.',
            'All future orders will use the new pricing. Existing orders are not affected.',
          ]},
          { type: 'warning', value: 'Price changes take effect immediately for new orders. Always coordinate with the sales team before making large price changes.' },
        ],
      },
      {
        id: 'set-contract-pricing',
        title: 'How to Set Up Contract Pricing for a Customer',
        blocks: [
          { type: 'steps', items: [
            'Go to "Pricing" and click the "Contracts" tab.',
            'Click "New Contract" to create a new pricing agreement.',
            'Search for and select the customer.',
            'Set the contract period (start date and end date).',
            'Add product lines: select each product and enter the contract price.',
            'You can set prices as: fixed price, discount % off retail, or cost + margin %.',
            'Review all lines and verify pricing accuracy.',
            'Click "Submit for Approval". The branch manager receives a notification.',
            'Once approved, the contract pricing applies automatically to all orders for this customer.',
          ]},
        ],
      },
      {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        blocks: [
          { type: 'troubleshoot', items: [
            { problem: 'Customer says their price is wrong', solution: 'Check their account to see which price level is assigned. Verify their contract is active and covers the product. If the contract expired, notify the sales rep.' },
            { problem: 'Retail price seems too high or too low', solution: 'Check the base cost and margin settings. Compare to market pricing. Verify the unit of measure is correct ($/lb vs $/ft vs $/ea).' },
            { problem: 'Contract pricing not applying on order', solution: 'Make sure the customer is selected on the order (not "Walk-In"). Verify the contract is approved and the date range is current. Check if the product is included in the contract.' },
            { problem: 'Remnant pricing not applying', solution: 'The item must be tagged as "REMNANT" or "DROP" in inventory. Check the item\'s status. If it should be a remnant, update it in inventory first.' },
          ]},
        ],
      },
      {
        id: 'done-criteria',
        title: 'How You Know It Worked',
        blocks: [
          { type: 'bullets', items: [
            'New retail prices show immediately when adding products to orders',
            'Contract pricing applies automatically when the customer is selected',
            'The pricing dashboard shows your active contracts and their status',
            'Remnant items show discounted prices in the online store and POS',
          ]},
        ],
      },
    ],
  },

  // ─── 11. OVERRIDES & ACCOUNTABILITY ───────────────────────────────
  {
    moduleId: 'overrides',
    title: 'Overrides & Accountability',
    shortDescription: 'Track and audit every pricing override, capacity exception, and cutoff bypass for accountability.',
    icon: 'Gavel',
    roles: ['CSR', 'SALES_REP', 'SHOP_SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES', 'OUTLET'],
    routes: ['/admin/audit-log'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'Every time someone overrides a price, extends a cutoff time, bypasses a capacity limit, or makes an exception to standard rules, the system records it. The Override Audit Log shows who did what, when, why, and whether it was approved. This creates accountability and helps managers spot patterns.' },
        ],
      },
      {
        id: 'who-uses-it',
        title: 'Who Uses It',
        blocks: [
          { type: 'bullets', items: [
            'Branch Manager — reviews overrides daily, spots patterns, coaches staff',
            'Admin — configures override thresholds and approval rules',
            'CSR / Sales Rep — creates overrides (sees their own history)',
            'Compliance — audits overrides for policy adherence',
          ]},
        ],
      },
      {
        id: 'review-overrides',
        title: 'How to Review the Override Audit Log',
        blocks: [
          { type: 'steps', items: [
            'Go to "Override Audit Log" in the sidebar under Administration.',
            'You will see a table of all overrides sorted by most recent.',
            'Each row shows: date, who made the override, type (pricing, cutoff, capacity), the original value, the override value, the reason given, and approval status.',
            'Use the filters at the top to narrow by: date range, override type, user, or approval status.',
            'Click on any row to see the full details including the order it was applied to.',
            'If an override looks suspicious, click "Flag for Review" to escalate.',
          ]},
        ],
      },
      {
        id: 'create-override',
        title: 'How Overrides Work (For CSRs)',
        blocks: [
          { type: 'text', value: 'You don\'t go to this page to create overrides. Overrides happen naturally when you change a price, extend a cutoff, or bypass a rule during order entry or scheduling. The system automatically logs it.' },
          { type: 'steps', items: [
            'When you change a price on an order that exceeds your threshold, a popup appears asking for the reason.',
            'Enter a clear, specific reason (e.g., "Customer matching competitor quote from X supplier").',
            'If the override is within your authority level, it\'s auto-approved.',
            'If it exceeds your authority, it routes to your manager for approval.',
            'You can see all your past overrides by filtering the audit log by your name.',
          ]},
          { type: 'do-dont', dos: [
            'Always enter a specific, honest reason for the override',
            'Reference competitor quotes or customer agreements when applicable',
            'Get approval before promising the override price to the customer',
          ], donts: [
            'Don\'t use vague reasons like "customer request" or "match price"',
            'Don\'t override pricing just to close a sale without proper justification',
            'Don\'t approve your own overrides — it requires a different person',
          ]},
        ],
      },
      {
        id: 'configure-thresholds',
        title: 'How to Configure Override Thresholds (Admin)',
        blocks: [
          { type: 'steps', items: [
            'Go to Administration → Settings.',
            'Click "Override Rules" or "Pricing Authorities".',
            'For each role (CSR, Sales Rep, Manager), set:',
            '  → Maximum discount percentage they can approve (e.g., CSR = 5%, Manager = 15%)',
            '  → Maximum dollar amount per override',
            '  → Whether they can override cutoff times',
            '  → Whether they can override capacity limits',
            'Click "Save". Changes take effect immediately.',
          ]},
        ],
      },
      {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        blocks: [
          { type: 'troubleshoot', items: [
            { problem: 'Override request pending for too long', solution: 'Check who the approver is and contact them directly. If the approver is unavailable, escalate to the next manager up.' },
            { problem: 'Override was rejected but customer expects the price', solution: 'Contact the customer and explain. Offer an alternative (different product, smaller discount, or escalate to branch manager).' },
            { problem: 'Can\'t see override history', solution: 'You can only see your own overrides unless you have Manager or Admin role. Ask your manager to pull the report.' },
          ]},
        ],
      },
      {
        id: 'done-criteria',
        title: 'How You Know It Worked',
        blocks: [
          { type: 'bullets', items: [
            'Every override appears in the audit log with a reason and approval status',
            'Pending overrides show a badge count in the manager\'s dashboard',
            'Approved overrides apply immediately to the order',
            'Rejected overrides revert the price to the standard amount',
          ]},
        ],
      },
    ],
  },

  // ─── 12. ADMIN SETTINGS ───────────────────────────────────────────
  {
    moduleId: 'admin-settings',
    title: 'Admin Settings',
    shortDescription: 'Configure locations, cutoff times, user roles, module access, and system-wide settings.',
    icon: 'Settings',
    roles: ['ADMIN', 'BRANCH_MANAGER'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES', 'OUTLET'],
    routes: ['/admin/users', '/admin/partners', '/admin/audit-log', '/admin/processing-recipes'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'Admin Settings is where you configure the system itself. You manage user accounts and their roles, set up locations (branches/warehouses), configure cutoff times for next-day delivery, enable or disable modules per location, and set up integrations with external systems.' },
        ],
      },
      {
        id: 'who-uses-it',
        title: 'Who Uses It',
        blocks: [
          { type: 'bullets', items: [
            'System Admin — full access to all settings',
            'Branch Manager — manages users and settings for their location',
          ]},
        ],
      },
      {
        id: 'manage-users',
        title: 'How to Add or Edit a User',
        blocks: [
          { type: 'steps', items: [
            'Go to "User Management" under Administration in the sidebar.',
            'To add a new user, click "Add User".',
            'Fill in: name, email, phone, and temporary password.',
            'Assign a role: Operator, CSR, Sales Rep, Warehouse, Shipping, Supervisor, Manager, or Admin.',
            'Assign the user to one or more locations.',
            'Set module access — which modules this user can see and use.',
            'Click "Create User". They will receive a welcome email with login instructions.',
            'To edit an existing user, click their name in the user list. Make changes and click "Save".',
            'To deactivate a user (e.g., when they leave the company), toggle "Active" to off. Do not delete users — deactivate them to preserve audit history.',
          ]},
          { type: 'warning', value: 'Never share admin passwords. Each person should have their own account. This is critical for audit trails and accountability.' },
        ],
      },
      {
        id: 'configure-locations',
        title: 'How to Configure a Location',
        blocks: [
          { type: 'steps', items: [
            'Go to Administration → Locations (if available) or check Online Settings for location configuration.',
            'Each location has: name, address, time zone, divisions served, and operating hours.',
            'To update a location, click on it and edit the fields.',
            'Set the operating hours for each day of the week.',
            'Set the cutoff time for next-day delivery (e.g., 2:00 PM means orders placed after 2 PM ship the following business day).',
            'Enable or disable divisions for this location (some locations only handle Metals, not Plastics).',
            'Click "Save Changes".',
          ]},
        ],
      },
      {
        id: 'set-cutoff-times',
        title: 'How to Set Cutoff Times',
        blocks: [
          { type: 'text', value: 'Cutoff times determine the deadline for orders to qualify for next-day delivery. For example, if the cutoff is 2:00 PM, any order placed before 2:00 PM today can ship tomorrow. Orders placed after 2:00 PM ship the day after tomorrow.' },
          { type: 'steps', items: [
            'Go to Administration → Locations → select your location.',
            'Find the "Cutoff Times" section.',
            'Set the time for each division: Metals may have a different cutoff than Plastics.',
            'Set the cutoff for each day of the week (weekdays typically have later cutoffs than Friday).',
            'Click "Save".',
            'The cutoff clock appears in the top-right corner of the app for all users at this location.',
          ]},
          { type: 'tip', value: 'The cutoff clock in the header counts down to the next cutoff. It turns yellow at 30 minutes before cutoff and red at 10 minutes.' },
        ],
      },
      {
        id: 'manage-modules',
        title: 'How to Enable/Disable Modules',
        blocks: [
          { type: 'steps', items: [
            'Go to Administration → Module Settings (or Partner API → Module Config).',
            'You will see a list of all modules with toggle switches.',
            'Toggle a module on to make it visible to users with the appropriate role.',
            'Toggle a module off to hide it completely. Users will not see it in the sidebar.',
            'Module settings are per-location. Different locations can have different modules enabled.',
            'Click "Save" after making changes. Users may need to refresh their browser to see updates.',
          ]},
        ],
      },
      {
        id: 'processing-recipes',
        title: 'How to Manage Processing Recipes',
        blocks: [
          { type: 'steps', items: [
            'Go to "Processing Recipes" under Administration.',
            'Recipes define how long each processing operation takes, based on material type and thickness.',
            'To edit a recipe, click on the operation name (e.g., "Saw", "Shear", "Laser Cut").',
            'Adjust the time-per-unit for different thickness bands.',
            'Add setup time — the fixed time to prepare the equipment before processing.',
            'Click "Save". The new times will be used for scheduling and pricing estimates on future orders.',
          ]},
        ],
      },
      {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        blocks: [
          { type: 'troubleshoot', items: [
            { problem: 'User can\'t log in', solution: 'Check if their account is active. Reset their password. Make sure their email is entered correctly. Check if they\'re using the right URL.' },
            { problem: 'User can\'t see a module', solution: 'Check two things: 1) Is the module enabled for this location? 2) Does the user\'s role have access to this module? Fix whichever is missing.' },
            { problem: 'Cutoff time seems wrong', solution: 'Check the time zone setting for the location. The cutoff is based on the location\'s time zone, not the user\'s browser time zone.' },
            { problem: 'Changes aren\'t showing up for users', solution: 'Ask users to refresh their browser (Ctrl+Shift+R). Some settings require a full page reload to take effect.' },
          ]},
        ],
      },
      {
        id: 'done-criteria',
        title: 'How You Know It Worked',
        blocks: [
          { type: 'bullets', items: [
            'New users can log in with their credentials',
            'Users see only the modules assigned to their role',
            'Location settings (cutoff times, divisions) are reflected in the app header',
            'Processing recipe changes show in scheduling time estimates',
            'The audit log captures who made configuration changes',
          ]},
        ],
      },
    ],
  },
]

export default manualModules
