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
          { type: 'tip', value: 'Remnant and drop items have pre-set discounts. Check the Steel Outlet section for clearance pricing before manually discounting.' },
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

  // ─── 13. COMMAND CENTER ──────────────────────────────────────────────
  {
    moduleId: 'command-center',
    title: 'Command Center',
    shortDescription: 'Your operational nerve center — real-time dashboards, KPIs, and the Ops Cockpit for monitoring the entire service center.',
    icon: 'Dashboard',
    roles: ['BRANCH_MANAGER', 'OPS_MANAGER', 'PLANT_MANAGER', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES', 'OUTLET'],
    routes: ['/ops-cockpit', '/role-dashboard'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'The Command Center is where managers and operators get a real-time view of everything happening across the service center. The Ops Cockpit shows live production status, order pipeline, shipment progress, and critical alerts in a single screen. My Dashboard gives each user a personalized view based on their role — CSRs see their open orders, shop supervisors see machine utilization, shipping staff see outbound loads.' },
        ],
      },
      {
        id: 'ops-cockpit',
        title: 'Ops Cockpit',
        blocks: [
          { type: 'text', value: 'The Ops Cockpit is the main operational overview. It displays live tiles for orders in progress, jobs on the shop floor, packages staged, shipments out for delivery, and any bottlenecks or alerts.' },
          { type: 'steps', items: [
            'Click "Ops Cockpit" in the sidebar under Command Center.',
            'The cockpit loads with real-time tiles. Each tile shows a count and status color (green = on track, yellow = warning, red = behind).',
            'Click any tile to drill down into the detail view (e.g., clicking "Jobs In Progress" opens the Shop Floor Queue filtered to active jobs).',
            'Use the time range selector at the top to switch between Today, This Week, or This Month.',
            'The alerts ribbon at the top shows critical items: overdue orders, stuck jobs, equipment alarms, or quality holds.',
            'Click an alert to jump directly to the affected item.',
          ]},
          { type: 'tip', value: 'The Ops Cockpit auto-refreshes every 30 seconds. You can also click the refresh icon in the top-right corner to force an immediate update.' },
        ],
      },
      {
        id: 'my-dashboard',
        title: 'My Dashboard',
        blocks: [
          { type: 'text', value: 'My Dashboard is personalized for each user based on their role. It shows the KPIs, tasks, and shortcuts most relevant to your daily work.' },
          { type: 'bullets', items: [
            'CSR Dashboard — open orders, pending quotes, recent customer activity, follow-up reminders',
            'Shop Supervisor Dashboard — machine utilization, job queue, operator attendance, quality alerts',
            'Shipping Dashboard — outbound loads, staged packages, carrier ETAs, delivery exceptions',
            'Manager Dashboard — revenue metrics, throughput, on-time delivery %, labor efficiency',
          ]},
          { type: 'steps', items: [
            'Click "My Dashboard" in the sidebar under Command Center.',
            'Your role-specific dashboard loads automatically.',
            'Use the widget gear icon to customize which tiles appear and their layout.',
            'Drag and drop tiles to rearrange them.',
            'Click "Add Widget" to include additional KPIs from the available library.',
          ]},
        ],
      },
      {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        blocks: [
          { type: 'troubleshoot', items: [
            { problem: 'Tiles show stale data', solution: 'Click the refresh icon. If still stale, check your internet connection. The cockpit requires a live connection to the server.' },
            { problem: 'Dashboard is blank or missing widgets', solution: 'Your role may not have a default dashboard configured. Ask an admin to assign dashboard widgets to your role under Admin > User Management.' },
            { problem: 'Alert count seems wrong', solution: 'Alerts are scoped to your assigned location. Make sure your location is set correctly in the top-right corner of the app.' },
          ]},
        ],
      },
    ],
  },

  // ─── 14. EXECUTIVE SUITE ─────────────────────────────────────────────
  {
    moduleId: 'executive',
    title: 'Executive Suite',
    shortDescription: 'Strategic analytics for leadership — simulations, forecasts, decision logs, digital twin, and speed metrics.',
    icon: 'Insights',
    roles: ['EXECUTIVE', 'VP_OPS', 'PLANT_MANAGER', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES', 'OUTLET'],
    routes: ['/executive/cockpit', '/executive/simulation', '/executive/forecast', '/executive/decisions', '/executive/digital-twin', '/executive/compression-metrics'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'The Executive Suite is designed for leadership to make data-driven strategic decisions. It includes six sub-modules: an executive cockpit with high-level KPIs, a simulation workspace for what-if scenarios, a forecast explorer for demand and revenue projections, a decision log for tracking strategic choices, a digital twin for virtual plant modeling, and compression metrics for measuring operational speed.' },
        ],
      },
      {
        id: 'executive-cockpit',
        title: 'Executive Cockpit',
        blocks: [
          { type: 'steps', items: [
            'Click "Executive Cockpit" under the Executive section in the sidebar.',
            'The cockpit displays high-level KPIs: revenue, margin, throughput, on-time delivery, and customer satisfaction.',
            'Use the date range picker to compare periods (this month vs. last month, this quarter vs. same quarter last year).',
            'Click any KPI card to drill down into the underlying data.',
            'Use the "Compare Locations" toggle to see side-by-side performance across service centers.',
          ]},
        ],
      },
      {
        id: 'simulation',
        title: 'Simulation Workspace',
        blocks: [
          { type: 'text', value: 'Run what-if scenarios to test the impact of pricing changes, capacity additions, or demand shifts before making real decisions.' },
          { type: 'steps', items: [
            'Click "Simulation" in the sidebar under Executive.',
            'Choose a scenario type: Pricing Change, Capacity Change, Demand Shift, or Custom.',
            'Set your variables (e.g., "Increase plate prices by 5%" or "Add one saw shift").',
            'Click "Run Simulation" — the system calculates projected revenue, margin, throughput, and delivery times.',
            'Review the results. Save the scenario for comparison or share it with other executives.',
            'Use "Compare Scenarios" to put two or more saved scenarios side by side.',
          ]},
          { type: 'tip', value: 'Simulations use the last 90 days of real data as their baseline. For more accurate results, make sure recent data (orders, production, costs) is up to date.' },
        ],
      },
      {
        id: 'forecast-explorer',
        title: 'Forecast Explorer',
        blocks: [
          { type: 'steps', items: [
            'Click "Forecasts" under Executive in the sidebar.',
            'The forecast dashboard shows projected demand, revenue, and capacity utilization for the next 30, 60, and 90 days.',
            'Use the product filter to focus on specific product lines (plate, bar, tube, sheet).',
            'Toggle between "Revenue Forecast," "Volume Forecast," and "Capacity Forecast" views.',
            'The confidence band (shaded area on the chart) shows the range of likely outcomes.',
            'Click "Export" to download forecast data as CSV for offline analysis.',
          ]},
        ],
      },
      {
        id: 'decision-log',
        title: 'Decision Log',
        blocks: [
          { type: 'text', value: 'A running record of strategic decisions made by leadership — pricing changes, investment approvals, policy updates — with context and outcomes tracked over time.' },
          { type: 'steps', items: [
            'Click "Decision Log" under Executive.',
            'The log shows all recorded decisions with date, author, category, and status.',
            'Click "New Decision" to record a new strategic decision.',
            'Fill in the title, category (Pricing, Capacity, Policy, Investment), description, and expected impact.',
            'Attach supporting documents or simulation results if applicable.',
            'Click "Save." The decision is timestamped and added to the log.',
            'After implementation, update the decision with actual outcomes using the "Record Outcome" button.',
          ]},
        ],
      },
      {
        id: 'digital-twin',
        title: 'Digital Twin',
        blocks: [
          { type: 'text', value: 'A virtual model of your service center — equipment layout, material flow, and process relationships — used for planning, optimization, and bottleneck analysis.' },
          { type: 'steps', items: [
            'Click "Digital Twin" under Executive.',
            'The twin view renders a visual model of your plant floor with equipment nodes and material flow arrows.',
            'Color-coded nodes show real-time status: green (running), yellow (idle), red (down), blue (maintenance).',
            'Click any equipment node to see its current job, utilization rate, and upcoming schedule.',
            'Use "Highlight Bottleneck" to identify the constraint in your current workflow.',
            'Toggle "Heat Map" to overlay throughput density across the plant.',
          ]},
        ],
      },
      {
        id: 'speed-metrics',
        title: 'Speed / Compression Metrics',
        blocks: [
          { type: 'text', value: 'Measures how fast orders move through the system — from intake to shipment — and identifies where time is being lost.' },
          { type: 'steps', items: [
            'Click "Speed Metrics" under Executive.',
            'The dashboard shows average cycle times for each stage: Order Entry → Scheduling → Production → Packaging → Shipping.',
            'Compare current cycle times against targets (set in Admin > Settings).',
            'Click any stage to see a breakdown by product type, shift, and operator.',
            'Use the "Trend" view to see if cycle times are improving or degrading over time.',
            'The "Compression Score" is a single number (0-100) rating your overall speed. Higher is better.',
          ]},
          { type: 'tip', value: 'Focus improvement efforts on the stage with the longest average cycle time — that is your biggest opportunity for time compression.' },
        ],
      },
    ],
  },

  // ─── 15. ORDER BOARD ─────────────────────────────────────────────────
  {
    moduleId: 'order-board',
    title: 'Order Board (Service Center)',
    shortDescription: 'Kanban-style board showing all orders across their lifecycle stages — from intake through shipping.',
    icon: 'ViewKanban',
    roles: ['CSR', 'SHOP_SUPERVISOR', 'BRANCH_MANAGER', 'OPS_MANAGER', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES', 'OUTLET'],
    routes: ['/order-board'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'The Order Board is a visual Kanban view of every order in the service center. Orders are displayed as cards moving through columns that represent lifecycle stages: New, Scheduled, In Production, Packaging, Staged, Shipped, and Delivered. It gives everyone a quick snapshot of where every order stands.' },
        ],
      },
      {
        id: 'using-the-board',
        title: 'How to Use the Order Board',
        blocks: [
          { type: 'steps', items: [
            'Click "Order Board" in the sidebar under Service Center.',
            'The board loads with columns for each order stage. Each card shows the order number, customer name, due date, and priority color.',
            'Red border = past due. Orange = due today. Green = on track.',
            'Click any card to open the order detail panel on the right side.',
            'Use the search bar at the top to find a specific order by number, customer, or PO.',
            'Use the filter dropdowns to narrow by priority, product type, or assigned CSR.',
            'Drag-and-drop cards between columns to manually advance an order stage (if you have permission).',
          ]},
          { type: 'tip', value: 'Most order transitions happen automatically as jobs progress on the shop floor. Manual drag-and-drop is for exceptions only.' },
        ],
      },
      {
        id: 'order-detail-panel',
        title: 'Order Detail Panel',
        blocks: [
          { type: 'text', value: 'When you click an order card, the detail panel shows:' },
          { type: 'bullets', items: [
            'Order header — order number, PO number, customer name, account number, order date, due date',
            'Line items — each product, quantity, dimensions, processing operations, and status',
            'Job links — click to jump to the job on the Shop Floor Queue',
            'Documents — BOL, packing list, MTR, certificates attached to this order',
            'Timeline — a chronological log of every event (created, scheduled, started, completed, shipped)',
            'Notes — internal notes from CSRs, shop floor, or shipping',
          ]},
        ],
      },
      {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        blocks: [
          { type: 'troubleshoot', items: [
            { problem: 'Order card stuck in a column', solution: 'Check the underlying job status in Shop Floor Queue. If the job is done but the order card didn\'t move, there may be a pending QC hold or packaging step that needs to complete first.' },
            { problem: 'Can\'t find an order on the board', solution: 'Check the filters — you may have a filter active that hides it. Also check the "Completed" and "Cancelled" archive tabs at the bottom.' },
          ]},
        ],
      },
    ],
  },

  // ─── 16. RECEIVING ───────────────────────────────────────────────────
  {
    moduleId: 'receiving',
    title: 'Receiving',
    shortDescription: 'Receive inbound material shipments, verify quantities, check mill certs, and add stock to inventory.',
    icon: 'CallReceived',
    roles: ['WAREHOUSE', 'RECEIVING', 'INVENTORY_MANAGER', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES'],
    routes: ['/receiving'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'Receiving is where inbound material arrives at your service center. When a truck shows up with steel, aluminum, plastic, or supplies, the receiving team uses this module to log the delivery, verify quantities against the purchase order (PO), inspect the material, scan or attach mill test reports (MTRs), and put the stock into the correct inventory location.' },
        ],
      },
      {
        id: 'receive-shipment',
        title: 'How to Receive a Shipment',
        blocks: [
          { type: 'steps', items: [
            'Click "Receiving" in the sidebar under Service Center.',
            'The Receiving dashboard shows a list of expected inbound deliveries (from open purchase orders).',
            'When a truck arrives, find the PO in the list and click "Start Receiving."',
            'Scan or enter the packing list / BOL number from the driver.',
            'For each line item on the PO, verify the quantity, grade, dimensions, and heat number.',
            'If there is a discrepancy (short ship, damage, wrong grade), click "Flag Discrepancy" on that line and enter details.',
            'Attach the MTR (mill test report) by scanning or uploading the PDF. The system links it to the heat number automatically.',
            'Enter the warehouse location (bay, rack, slot) where the material will be stored.',
            'Click "Complete Receiving." The stock is added to inventory and the PO is updated.',
          ]},
          { type: 'warning', value: 'Always verify heat numbers match the MTR before completing receiving. Mismatched heat numbers cause traceability failures and potential compliance issues.' },
        ],
      },
      {
        id: 'discrepancies',
        title: 'Handling Discrepancies',
        blocks: [
          { type: 'bullets', items: [
            'Short Ship — quantity received is less than PO quantity. The system keeps the PO open for the remaining quantity.',
            'Over Ship — quantity received exceeds PO quantity. You can accept the overage or refuse it.',
            'Damage — material is damaged. Flag it, take photos, and create a supplier claim.',
            'Wrong Grade — the grade doesn\'t match the PO. Quarantine the material and notify procurement.',
            'Missing MTR — log the receipt but mark it "Pending MTR." The material goes into a QC hold until the MTR is received.',
          ]},
        ],
      },
      {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        blocks: [
          { type: 'troubleshoot', items: [
            { problem: 'PO not showing in expected deliveries', solution: 'Check if the PO was created in the procurement system. Only approved POs with a future or recent delivery date appear in the receiving queue.' },
            { problem: 'Can\'t scan the MTR', solution: 'Make sure the scanner is connected and the MTR is a clear PDF. You can also manually upload the file using the "Upload" button.' },
            { problem: 'Material doesn\'t show in inventory after receiving', solution: 'Check if the receiving was fully completed (not just saved as draft). Also check the assigned warehouse location — it may have gone to a different bay than expected.' },
          ]},
        ],
      },
    ],
  },

  // ─── 17. TIME TRACKING ───────────────────────────────────────────────
  {
    moduleId: 'time-tracking',
    title: 'Time Tracking',
    shortDescription: 'Track operator hours, job labor time, clock-in/out, and labor cost allocation across production jobs.',
    icon: 'AccessTime',
    roles: ['OPERATOR', 'SHOP_SUPERVISOR', 'BRANCH_MANAGER', 'HR', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES'],
    routes: ['/time-tracking'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'Time Tracking records when operators clock in and out, which jobs they work on, and how long each operation takes. This data feeds labor cost calculations, efficiency metrics, and payroll reports. Supervisors can review and approve timesheets, and the system automatically allocates labor costs to specific jobs.' },
        ],
      },
      {
        id: 'clock-in-out',
        title: 'Clock In / Clock Out',
        blocks: [
          { type: 'steps', items: [
            'Click "Time Tracking" in the sidebar under Service Center.',
            'If you are an operator, the screen shows your current clock status (clocked in or out).',
            'Click "Clock In" to start your shift. Select your work center if you have multiple options.',
            'When starting a job, click "Start Job" and scan or enter the job number. The system begins tracking time against that job.',
            'When you finish a job or switch to another, click "Stop Job" or "Switch Job."',
            'At the end of your shift, click "Clock Out." Your total hours are recorded.',
          ]},
        ],
      },
      {
        id: 'supervisor-view',
        title: 'Supervisor Timesheet Review',
        blocks: [
          { type: 'steps', items: [
            'As a supervisor, navigate to Time Tracking and click the "Team View" tab.',
            'You see all operators on your shift with their clock-in time, current job, and hours worked today.',
            'Click an operator to see their detailed timesheet: jobs worked, breaks, idle time.',
            'Flag any discrepancies (e.g., forgot to clock out, missing job entries).',
            'At the end of the pay period, click "Approve Timesheets" to approve hours for payroll.',
            'Approved timesheets lock and cannot be edited without manager override.',
          ]},
          { type: 'tip', value: 'The "Idle Time" column shows time clocked in but not assigned to any job. High idle time may indicate scheduling gaps or operators waiting for material.' },
        ],
      },
      {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        blocks: [
          { type: 'troubleshoot', items: [
            { problem: 'Operator forgot to clock in', solution: 'A supervisor can add a manual clock-in entry with the correct time. Go to Team View, click the operator, then "Add Manual Entry."' },
            { problem: 'Job time seems too high', solution: 'Check if the operator forgot to stop the job before going on break or switching tasks. Edit the time entry to split or correct it.' },
            { problem: 'Timesheet already approved but needs correction', solution: 'A manager or admin can unlock an approved timesheet from the "Approved" tab by clicking "Unlock for Edit." This is logged in the audit trail.' },
          ]},
        ],
      },
    ],
  },

  // ─── 18. MATERIALS (HEATS & UNITS) ───────────────────────────────────
  {
    moduleId: 'materials',
    title: 'Materials (Heats & Units)',
    shortDescription: 'Manage material master data — heats with MTRs and chemistry, and individual units/coils with dimensions and location.',
    icon: 'Science',
    roles: ['INVENTORY_MANAGER', 'WAREHOUSE', 'QA', 'PURCHASING', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES'],
    routes: ['/heats', '/units'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'Materials is where you manage the foundational data for your stock: Heats and Units. A Heat is a batch of material from the mill identified by a heat number — it carries the MTR (mill test report) with chemistry, mechanical properties, and certifications. A Unit is an individual physical piece of material (a plate, coil, bar, bundle) that belongs to a heat. Together, heats and units give you full traceability from mill source to customer delivery.' },
        ],
      },
      {
        id: 'heats',
        title: 'Heats',
        blocks: [
          { type: 'steps', items: [
            'Click "Heats" in the sidebar under Materials.',
            'The heat list shows all heats in inventory with heat number, grade, mill, date received, and number of units.',
            'Use the search bar to find a specific heat by number, grade, or mill.',
            'Click a heat to open its detail view showing MTR data, chemistry, mechanical properties, and linked units.',
            'To add a new heat, click "Add Heat" and enter the heat number, grade, mill source, and upload the MTR.',
            'The system parses the MTR and auto-fills chemistry fields (C, Mn, P, S, Si, etc.) when possible.',
            'Review and confirm the parsed values. Click "Save Heat."',
          ]},
          { type: 'warning', value: 'Never create duplicate heat numbers. If a heat already exists, add new units to the existing heat instead of creating a new one.' },
        ],
      },
      {
        id: 'units',
        title: 'Units / Coils',
        blocks: [
          { type: 'steps', items: [
            'Click "Units" in the sidebar under Materials.',
            'The unit list shows all individual pieces/coils with unit ID, heat number, grade, dimensions, weight, location, and status.',
            'Use filters to narrow by grade, thickness range, width range, location, or status (Available, Reserved, In Process, Shipped).',
            'Click a unit to see its full detail: parent heat, MTR link, processing history, and current job assignment.',
            'To add a unit, click "Add Unit" — select the parent heat, enter dimensions (thickness, width, length), weight, and warehouse location.',
            'For coils, enter OD, ID, width, and weight. The system calculates estimated lineal footage.',
            'Scan or enter the unit tag/barcode to link the physical tag to the system record.',
          ]},
          { type: 'tip', value: 'Use the "Bulk Import" feature to load many units at once from a CSV file — useful when receiving a large shipment with dozens of pieces.' },
        ],
      },
      {
        id: 'traceability',
        title: 'Traceability',
        blocks: [
          { type: 'text', value: 'Every unit traces back to its heat, and every heat traces back to its MTR and mill. When a unit is processed (cut, bent, drilled), the child pieces inherit the parent heat and MTR. When a unit ships to a customer, the BOL and packing list reference the heat number so the customer can trace the material back to its source.' },
          { type: 'bullets', items: [
            'Heat → MTR → Chemistry & mechanical properties',
            'Unit → Heat → full mill traceability',
            'Processed piece → parent unit → parent heat → full chain',
            'Shipment → BOL → units → heats → MTRs',
          ]},
        ],
      },
      {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        blocks: [
          { type: 'troubleshoot', items: [
            { problem: 'MTR upload fails', solution: 'Check the file format — only PDF is supported. Maximum file size is 25 MB. If the file is a scan, make sure it\'s legible.' },
            { problem: 'Unit shows wrong location', solution: 'The location was likely not updated after a physical move. Edit the unit and update the location, or use the Inventory Transfer feature to move it properly.' },
            { problem: 'Can\'t find a heat', solution: 'Search by partial heat number. Also check if the heat was entered under a slightly different format (dashes vs. no dashes, leading zeros).' },
          ]},
        ],
      },
    ],
  },

  // ─── 19. LOGISTICS ───────────────────────────────────────────────────
  {
    moduleId: 'logistics',
    title: 'Logistics',
    shortDescription: 'Manage outbound shipments, live tracking, dispatch planning, and AI-powered route optimization.',
    icon: 'LocalShipping',
    roles: ['SHIPPING', 'LOGISTICS', 'DISPATCH', 'BRANCH_MANAGER', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES', 'OUTLET'],
    routes: ['/logistics/shipments', '/logistics/tracking', '/logistics/dispatch', '/logistics/route-optimization'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'Logistics is the transportation management hub. It covers four key areas: Shipments (creating and managing outbound loads), Tracking (real-time GPS and status updates), Dispatch Planning (assigning drivers and trucks to routes), and Route Optimization (AI-calculated optimal delivery routes to save fuel and time).' },
        ],
      },
      {
        id: 'shipments',
        title: 'Shipments',
        blocks: [
          { type: 'steps', items: [
            'Click "Shipments" under Logistics in the sidebar.',
            'The shipment list shows all outbound loads with shipment ID, carrier, status, pickup date, and destination.',
            'Click "Create Shipment" to build a new load.',
            'Select the orders/packages to include in the shipment.',
            'Choose the carrier (company truck, LTL, FTL, UPS, FedEx) and enter the trailer/truck number.',
            'Set the pickup date/time and expected delivery date.',
            'Generate the BOL (Bill of Lading) by clicking "Generate BOL." Review and print.',
            'When the truck departs, click "Mark as Shipped." The tracking timeline begins.',
          ]},
        ],
      },
      {
        id: 'tracking',
        title: 'Live Tracking',
        blocks: [
          { type: 'steps', items: [
            'Click "Tracking" under Logistics.',
            'The tracking map shows all active shipments with their current GPS position (for company trucks) or last carrier scan (for third-party carriers).',
            'Click a shipment pin on the map to see details: driver, ETA, stops remaining, and delivery status.',
            'The timeline view below the map shows chronological events: departed, in transit, at stop, delivered.',
            'Click "Notify Customer" to send the customer an email/SMS with a tracking link.',
          ]},
          { type: 'tip', value: 'For third-party carriers (UPS, FedEx, LTL), tracking updates come from the carrier API and may have a 15-30 minute delay.' },
        ],
      },
      {
        id: 'dispatch',
        title: 'Dispatch Planning',
        blocks: [
          { type: 'steps', items: [
            'Click "Dispatch Planning" under Logistics.',
            'The dispatch board shows available drivers, trucks, and pending loads.',
            'Drag loads onto drivers/trucks to build routes.',
            'The system calculates estimated drive time, distance, and delivery windows for each route.',
            'Review the route summary. Adjust stop order if needed by dragging stops up or down.',
            'Click "Confirm Dispatch" to assign the routes. Drivers receive their assignments on the mobile app.',
          ]},
        ],
      },
      {
        id: 'route-optimization',
        title: 'Route Optimization',
        blocks: [
          { type: 'text', value: 'AI-powered route optimization analyzes all pending deliveries and calculates the most efficient routes based on distance, traffic patterns, delivery windows, truck capacity, and driver hours.' },
          { type: 'steps', items: [
            'Click "Route Optimization" under Logistics.',
            'Select the date you want to optimize routes for.',
            'The system loads all pending deliveries for that date and available trucks/drivers.',
            'Click "Optimize Routes." The AI engine calculates optimal route assignments.',
            'Review the suggested routes on the map. Each route is color-coded.',
            'Accept the routes as-is, or manually adjust by moving stops between routes.',
            'Click "Apply & Dispatch" to finalize the optimized routes.',
          ]},
          { type: 'tip', value: 'Run route optimization the evening before to give drivers time to review their routes. Re-optimize in the morning if there are last-minute changes.' },
        ],
      },
    ],
  },

  // ─── 20. COMMERCIAL ──────────────────────────────────────────────────
  {
    moduleId: 'commercial',
    title: 'Commercial',
    shortDescription: 'OrderHub for managing the full order pipeline, and Demand Shaping for AI-driven demand analysis.',
    icon: 'BusinessCenter',
    roles: ['CSR', 'SALES_REP', 'BRANCH_MANAGER', 'SALES_MANAGER', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES', 'OUTLET'],
    routes: ['/orderhub', '/commercial/demand-shaping'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'The Commercial module is where sales and operations manage the order pipeline. OrderHub is the central command for all orders across channels (phone, online, POS, mobile rep). Demand Shaping uses AI to analyze ordering patterns and suggest pricing or promotion strategies to smooth demand peaks and fill capacity valleys.' },
        ],
      },
      {
        id: 'orderhub',
        title: 'OrderHub',
        blocks: [
          { type: 'steps', items: [
            'Click "OrderHub" under Commercial in the sidebar.',
            'The hub shows all orders from every channel in a unified table: order number, source (Phone, Online, POS, Mobile), customer, total, status, and due date.',
            'Use column filters to narrow by source, status, date range, CSR, or customer.',
            'Click any order to open its detail view with full line items, processing, documents, and timeline.',
            'Use the "Bulk Actions" dropdown to apply status changes, assign CSRs, or flag orders for review.',
            'The sidebar summary shows today\'s order count, revenue, and average order value by channel.',
          ]},
          { type: 'tip', value: 'OrderHub is the best place to get a cross-channel view. If you\'re looking for a specific order and don\'t know which channel it came from, start here.' },
        ],
      },
      {
        id: 'demand-shaping',
        title: 'Demand Shaping',
        blocks: [
          { type: 'text', value: 'Demand Shaping analyzes historical ordering patterns to identify trends, seasonality, and demand peaks. It suggests actions to smooth demand — like promotions during slow periods or surcharges during peak times — to optimize capacity utilization.' },
          { type: 'steps', items: [
            'Click "Demand Shaping" under Commercial.',
            'The dashboard shows a demand heat map by product category and week.',
            'Red zones are peak demand periods. Blue zones are low demand. Green is balanced.',
            'Click a zone to see which products and customers drive that demand.',
            'The "Suggestions" panel offers AI-recommended actions: promotional pricing, lead time adjustments, or capacity reallocation.',
            'Approve or dismiss each suggestion. Approved actions are routed to the responsible team (pricing, scheduling).',
          ]},
        ],
      },
    ],
  },

  // ─── 21. CUSTOMERS ───────────────────────────────────────────────────
  {
    moduleId: 'customers',
    title: 'Customer Management',
    shortDescription: 'Customer directory with full account details, contact info, pricing tiers, order history, and preference memory.',
    icon: 'People',
    roles: ['CSR', 'SALES_REP', 'SALES_MANAGER', 'BRANCH_MANAGER', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES', 'OUTLET'],
    routes: ['/customers', '/customers/preferences'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'Customer Management is the CRM (Customer Relationship Management) hub. The Customer Directory stores every customer account with contacts, addresses, pricing tier, credit terms, and order history. Preference Memory remembers each customer\'s specific preferences — favorite products, preferred processing specs, delivery instructions, packaging requirements — so you can serve them faster and more accurately.' },
        ],
      },
      {
        id: 'customer-directory',
        title: 'Customer Directory',
        blocks: [
          { type: 'steps', items: [
            'Click "Customer Directory" under Customers in the sidebar.',
            'The directory lists all customer accounts with name, account number, city, pricing tier, and last order date.',
            'Use the search bar to find a customer by name, account number, phone, or email.',
            'Click a customer to open their profile with tabs: Overview, Contacts, Addresses, Orders, Documents, Preferences.',
            'On the Overview tab, see account status, credit limit, balance, pricing tier, and assigned sales rep.',
            'On the Contacts tab, add or edit contact people (buyer, AP contact, shipping contact).',
            'On the Addresses tab, manage ship-to and bill-to addresses.',
            'On the Orders tab, see full order history with filters for date range, status, and product.',
          ]},
        ],
      },
      {
        id: 'add-customer',
        title: 'How to Add a New Customer',
        blocks: [
          { type: 'steps', items: [
            'From the Customer Directory, click "Add Customer."',
            'Enter the company name, account type (Commercial, Contractor, Walk-In, Government), and tax ID.',
            'Add the primary contact: name, phone, email, title.',
            'Enter the billing address and at least one ship-to address.',
            'Set the pricing tier (Standard, Contract, Preferred, Custom).',
            'Set credit terms (COD, Net 15, Net 30, Net 45) and credit limit.',
            'Assign a sales rep from the dropdown.',
            'Click "Save Customer." The account is active and ready for orders.',
          ]},
          { type: 'tip', value: 'For walk-in or cash customers, use the "Walk-In" account type. This sets terms to COD and skips the credit check on orders.' },
        ],
      },
      {
        id: 'preference-memory',
        title: 'Preference Memory',
        blocks: [
          { type: 'text', value: 'Preference Memory stores customer-specific preferences so your team can provide consistent, personalized service across every interaction.' },
          { type: 'steps', items: [
            'Click "Preference Memory" under Customers.',
            'Search for a customer or browse recent accounts.',
            'Click a customer to see their preference profile.',
            'Preferences include: favorite products, standard dimensions, preferred processing operations, packaging requirements, delivery instructions, and communication preferences.',
            'Add a new preference by clicking "Add Preference" — choose the category and enter the details.',
            'When a CSR takes an order for this customer, preferences auto-display as suggestions in the order intake form.',
          ]},
          { type: 'do-dont', dos: [
            'Update preferences after every order if the customer mentions something new',
            'Note delivery instructions like "call before delivery" or "use rear dock"',
            'Record preferred dimensions for repeat products',
          ], donts: [
            'Store sensitive personal information (SSN, personal financial data) in preferences',
            'Override customer preferences without confirming with the customer first',
          ]},
        ],
      },
    ],
  },

  // ─── 22. SALES & QUOTING ─────────────────────────────────────────────
  {
    moduleId: 'sales-quoting',
    title: 'Sales & Quoting',
    shortDescription: 'Manage RFQs, build quotes, track sales performance, and provide a customer-facing quote portal.',
    icon: 'RequestQuote',
    roles: ['SALES_REP', 'SALES_MANAGER', 'CSR', 'BRANCH_MANAGER', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES', 'OUTLET'],
    routes: ['/sales/rfq-inbox', '/sales/dashboard'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'Sales & Quoting covers the pre-order pipeline: receiving RFQs (Requests for Quote), building quotes with accurate pricing, tracking quote conversion rates, and monitoring overall sales performance. The RFQ Inbox collects incoming quote requests from email, web forms, and phone calls in one place. The Sales Dashboard shows KPIs like revenue, quote win rate, and pipeline value.' },
        ],
      },
      {
        id: 'rfq-inbox',
        title: 'RFQ Inbox',
        blocks: [
          { type: 'steps', items: [
            'Click "RFQ Inbox" under Sales & Pricing in the sidebar.',
            'The inbox shows all incoming quote requests with requester name, date, product summary, and status (New, In Progress, Quoted, Won, Lost).',
            'New RFQs appear at the top with a "New" badge. Click one to open it.',
            'Review the customer\'s request: products, quantities, specifications, and any special requirements.',
            'Click "Build Quote" to open the quote builder pre-filled with the RFQ details.',
            'In the quote builder, add products, set pricing (list, contract, or manual), add processing charges, and set validity period.',
            'Click "Preview" to see the customer-facing quote PDF. Review for accuracy.',
            'Click "Send Quote" to email the quote to the customer. The RFQ status changes to "Quoted."',
            'When the customer accepts, click "Convert to Order" to create an order from the quote.',
          ]},
          { type: 'tip', value: 'Set follow-up reminders on quotes. Click the calendar icon on a quoted RFQ to schedule a follow-up call with the customer.' },
        ],
      },
      {
        id: 'sales-dashboard',
        title: 'Sales Dashboard',
        blocks: [
          { type: 'steps', items: [
            'Click "Sales Dashboard" under Sales & Pricing.',
            'The dashboard shows KPIs: monthly revenue, revenue vs. target, quote win rate, average order value, top customers, and pipeline value.',
            'Use the date range picker to compare periods.',
            'Click any KPI card to drill down into the detail.',
            'The "Pipeline" section shows all open quotes organized by stage (Sent, Followed Up, Negotiating, Decision Pending).',
            'The "Leaderboard" shows sales rep performance ranked by revenue, quote count, and win rate.',
            'Export reports by clicking "Export" — available as PDF or CSV.',
          ]},
        ],
      },
      {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        blocks: [
          { type: 'troubleshoot', items: [
            { problem: 'RFQ not appearing in inbox', solution: 'Check if the RFQ email integration is active (Admin > Partner API > Email Integration). Also check spam filters on the RFQ email address.' },
            { problem: 'Quote pricing seems wrong', solution: 'Check the customer\'s pricing tier in their profile. Also verify the product base price and any active price overrides. The quote builder uses real-time pricing from the pricing engine.' },
            { problem: 'Can\'t convert quote to order', solution: 'The quote may have expired. Check the validity date. If expired, you\'ll need to re-quote. Also check customer credit status — orders won\'t create if the customer is on credit hold.' },
          ]},
        ],
      },
    ],
  },

  // ─── 23. MOBILE REP ──────────────────────────────────────────────────
  {
    moduleId: 'mobile-rep',
    title: 'Sales Rep Mobile',
    shortDescription: 'Mobile-optimized order entry and customer visit tool for outside sales representatives in the field.',
    icon: 'PhoneAndroid',
    roles: ['SALES_REP', 'SALES_MANAGER', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES', 'OUTLET'],
    routes: ['/mobile-rep'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'Sales Rep Mobile is a mobile-optimized interface for outside sales reps visiting customers in the field. Reps can look up customer accounts, check inventory availability, enter orders on the spot, capture signatures, and log visit notes — all from a phone or tablet. Orders entered through Mobile Rep flow into the same pipeline as phone and online orders.' },
        ],
      },
      {
        id: 'using-mobile-rep',
        title: 'How to Use Sales Rep Mobile',
        blocks: [
          { type: 'steps', items: [
            'Click "Sales Rep Mobile" under Order Intake in the sidebar (or bookmark the /mobile-rep URL on your phone).',
            'The mobile interface loads with a simplified layout optimized for touch.',
            'Search for the customer you\'re visiting using name, account number, or phone.',
            'The customer card shows their recent orders, pricing tier, and preferences.',
            'Tap "New Order" to start an order. Add items by searching products or scanning barcodes.',
            'Check real-time inventory availability for each item. If stock is low, the system suggests alternatives.',
            'Set delivery method (Will Call, Delivery, Ship) and date.',
            'Tap "Review Order" to see the summary with pricing.',
            'Have the customer review and tap "Capture Signature" for approval.',
            'Tap "Submit Order." The order enters the pipeline and the CSR team is notified.',
          ]},
          { type: 'tip', value: 'You can work offline if you lose cell signal. Orders will sync automatically when you reconnect.' },
        ],
      },
      {
        id: 'visit-log',
        title: 'Logging Customer Visits',
        blocks: [
          { type: 'steps', items: [
            'After submitting an order (or even without an order), tap "Log Visit."',
            'Enter visit notes: what you discussed, customer feedback, competitive intel, upcoming project mentions.',
            'Tap "Add Photo" to attach photos of the customer\'s facility or project.',
            'Tag the visit type: Sales Call, Follow-Up, Issue Resolution, New Account.',
            'The visit is logged to the customer\'s CRM record and visible to your sales manager on the Sales Dashboard.',
          ]},
        ],
      },
    ],
  },

  // ─── 24. QUALITY & COMPLIANCE ─────────────────────────────────────────
  {
    moduleId: 'quality-compliance',
    title: 'Quality & Compliance',
    shortDescription: 'QA/QC inspection management and material provenance tracking for regulatory compliance.',
    icon: 'VerifiedUser',
    roles: ['QA', 'QC_INSPECTOR', 'QA_MANAGER', 'COMPLIANCE', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES'],
    routes: ['/qaqc', '/provenance'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'Quality & Compliance is the umbrella module for all QA/QC activities and regulatory compliance. QA/QC handles inspection plans, hold/release decisions, and quality certifications. Provenance tracks the origin and chain of custody of materials to satisfy regulatory requirements (Buy America, DFARS, ITAR, EN 10204, etc.).' },
        ],
      },
      {
        id: 'qaqc',
        title: 'QA/QC',
        blocks: [
          { type: 'steps', items: [
            'Click "QA/QC" under Quality & Compliance in the sidebar.',
            'The QA dashboard shows items pending inspection, items on hold, and recent pass/fail rates.',
            'Click "Pending Inspections" to see the inspection queue.',
            'Select an item to inspect. The inspection form loads with the inspection plan (what to check, tolerances, pass/fail criteria).',
            'Enter measurements, observations, and pass/fail results for each checkpoint.',
            'If all checkpoints pass, click "Release" — the item moves forward to the next stage.',
            'If any checkpoint fails, click "Hold" and select the disposition: Rework, Scrap, Use As-Is (requires approval), or Return to Supplier.',
            'Attach photos, measurement data, or documents as evidence.',
          ]},
          { type: 'warning', value: 'Never release material that fails a critical checkpoint without documented engineering approval. "Use As-Is" dispositions require QA Manager sign-off.' },
        ],
      },
      {
        id: 'provenance',
        title: 'Provenance / Chain of Custody',
        blocks: [
          { type: 'text', value: 'Provenance tracks where materials came from and validates compliance with domestic sourcing requirements.' },
          { type: 'steps', items: [
            'Click "Provenance" under Quality & Compliance.',
            'The provenance dashboard shows all materials with their origin status: Verified, Pending, or Exception.',
            'Click a material to see its full provenance chain: country of melt, country of manufacture, mill, distributor, and your service center.',
            'For Buy America orders, the system automatically flags materials that don\'t meet domestic sourcing requirements.',
            'Upload supporting documents (mill certs, customs declarations, supplier attestations) to verify provenance.',
            'Generate a provenance report for a specific order or shipment by clicking "Generate Report."',
          ]},
        ],
      },
    ],
  },

  // ─── 25. SUPPLIER QUALITY MANAGEMENT ──────────────────────────────────
  {
    moduleId: 'supplier-quality',
    title: 'Supplier Quality Management',
    shortDescription: 'Full SQM suite — inbound receiving inspection, IQC, nonconformances, SCAR management, and supplier scorecards.',
    icon: 'Assessment',
    roles: ['QA', 'QC_INSPECTOR', 'QA_MANAGER', 'PURCHASING', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES'],
    routes: ['/sqm/receiving', '/sqm/inspections', '/sqm/snc', '/sqm/scar', '/sqm/scorecards', '/sqm/suppliers'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'Supplier Quality Management (SQM) tracks the quality of materials received from suppliers. It includes six sub-modules: Inbound Receiving inspection, IQC (Incoming Quality Control) inspections, SNC (Supplier Nonconformance) tracking, SCAR (Supplier Corrective Action Request) management, Scorecards for rating supplier performance, and a Supplier directory.' },
        ],
      },
      {
        id: 'inbound-receiving',
        title: 'Inbound Receiving Inspection',
        blocks: [
          { type: 'steps', items: [
            'Click "Inbound Receiving" under Supplier Quality in the sidebar.',
            'The queue shows recently received shipments pending quality inspection.',
            'Click a shipment to start the receiving inspection.',
            'Verify: correct material grade, dimensions within tolerance, surface condition acceptable, heat numbers match MTR.',
            'Record inspection results for each line item: Pass, Fail, or Conditional Accept.',
            'If Pass — material is released to inventory.',
            'If Fail — material is quarantined. A Supplier Nonconformance (SNC) is auto-created.',
            'If Conditional Accept — material is released with a note, and the supplier is notified of the deviation.',
          ]},
        ],
      },
      {
        id: 'iqc-inspections',
        title: 'IQC Inspections',
        blocks: [
          { type: 'text', value: 'IQC (Incoming Quality Control) inspections are detailed quality checks performed on incoming materials based on predefined inspection plans.' },
          { type: 'steps', items: [
            'Click "IQC Inspections" under Supplier Quality.',
            'The inspection queue shows materials awaiting IQC based on the inspection sampling plan (every lot, skip-lot, or random).',
            'Select a lot to inspect. The inspection form loads with checkpoints from the quality plan.',
            'Perform measurements (thickness, hardness, surface roughness, chemistry spot-check) and enter results.',
            'The system auto-compares results against specification tolerances and highlights any out-of-spec values.',
            'Submit the inspection. Pass results release the material; fail results create an SNC.',
          ]},
        ],
      },
      {
        id: 'snc',
        title: 'Supplier Nonconformances (SNC)',
        blocks: [
          { type: 'steps', items: [
            'Click "Nonconformances" under Supplier Quality.',
            'The SNC list shows all open and recent nonconformances with supplier, material, severity, and status.',
            'Click an SNC to see details: what failed, inspection data, photos, and affected material.',
            'Assign a disposition: Return to Supplier, Rework, Scrap, or Use As-Is (with approval).',
            'If the issue is significant or recurring, escalate to a SCAR by clicking "Escalate to SCAR."',
            'Track the SNC through resolution. Close it when the disposition is complete.',
          ]},
        ],
      },
      {
        id: 'scar',
        title: 'SCAR Management',
        blocks: [
          { type: 'text', value: 'A SCAR (Supplier Corrective Action Request) is a formal request to a supplier to investigate a quality problem, identify the root cause, and implement corrective actions to prevent recurrence.' },
          { type: 'steps', items: [
            'Click "SCAR Management" under Supplier Quality.',
            'Click "Create SCAR" or escalate from an existing SNC.',
            'Fill in the problem description, affected material/lots, impact, and required response date.',
            'Send the SCAR to the supplier. They receive a notification and can respond through the portal.',
            'Review the supplier\'s response: root cause analysis, containment actions, and permanent corrective actions.',
            'Approve or reject the response. If rejected, send it back with feedback.',
            'Verify corrective action effectiveness over the follow-up period (30, 60, 90 days).',
            'Close the SCAR when corrective actions are verified effective.',
          ]},
        ],
      },
      {
        id: 'scorecards',
        title: 'Supplier Scorecards',
        blocks: [
          { type: 'steps', items: [
            'Click "Scorecards" under Supplier Quality.',
            'Each supplier has a scorecard showing quality metrics: inspection pass rate, on-time delivery %, SNC count, SCAR count, and overall score.',
            'Scores are calculated automatically from receiving, IQC, and SNC data.',
            'Click a supplier scorecard to see trend charts over the last 12 months.',
            'Use the "Compare" feature to rank suppliers side by side.',
            'Export scorecards as PDF for supplier review meetings.',
          ]},
        ],
      },
      {
        id: 'suppliers',
        title: 'Supplier Directory',
        blocks: [
          { type: 'steps', items: [
            'Click "Suppliers" under Supplier Quality.',
            'The directory lists all approved suppliers with name, products supplied, quality score, and status (Active, Probation, Inactive).',
            'Click a supplier to see their profile: contact info, certifications, approved products, quality history, and open SCARs.',
            'To add a new supplier, click "Add Supplier" and complete the qualification form.',
            'Set the inspection level for the supplier: Level 1 (every lot), Level 2 (sampling), Level 3 (skip-lot).',
          ]},
        ],
      },
    ],
  },

  // ─── 26. CUSTOMER QUALITY ─────────────────────────────────────────────
  {
    moduleId: 'customer-quality',
    title: 'Customer Quality',
    shortDescription: 'Handle customer claims, RMAs, corrective actions, and credit/refund approvals.',
    icon: 'SupportAgent',
    roles: ['CSR', 'QA', 'QA_MANAGER', 'BRANCH_MANAGER', 'FINANCE', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES', 'OUTLET'],
    routes: ['/customer-quality/claims', '/customer-quality/rma', '/customer-quality/car', '/customer-quality/credits'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'Customer Quality manages quality issues reported by customers. It covers four workflows: Claims Inbox (receiving and triaging customer complaints), RMA (Return Material Authorization) for handling returns, CAR (Corrective Action Reports) for investigating root causes, and Credits & Approvals for issuing refunds or credits.' },
        ],
      },
      {
        id: 'claims-inbox',
        title: 'Claims Inbox',
        blocks: [
          { type: 'steps', items: [
            'Click "Claims Inbox" under Customer Quality in the sidebar.',
            'The inbox shows all open customer claims with claim number, customer, date, product, issue type, and status.',
            'To log a new claim, click "New Claim."',
            'Select the customer and the order/shipment the claim is against.',
            'Choose the issue type: Dimensional Error, Wrong Grade, Damage, Surface Defect, Processing Error, Shortage, or Other.',
            'Enter the claim description and attach photos or documents from the customer.',
            'Assign the claim to a QA investigator.',
            'The investigator reviews the claim, checks production records, and determines the disposition.',
          ]},
        ],
      },
      {
        id: 'rma',
        title: 'RMA Management',
        blocks: [
          { type: 'steps', items: [
            'Click "RMA Management" under Customer Quality.',
            'If a claim requires a return, click "Create RMA" from the claim detail page.',
            'The RMA form generates a return authorization number and return shipping instructions.',
            'Send the RMA to the customer with instructions on how to return the material.',
            'When the return arrives, the receiving team logs it against the RMA number.',
            'QA inspects the returned material and confirms the defect.',
            'The RMA is resolved with a replacement shipment, credit, or repair.',
          ]},
        ],
      },
      {
        id: 'car',
        title: 'CAR Management (Corrective Action)',
        blocks: [
          { type: 'text', value: 'A CAR (Corrective Action Report) documents the root cause investigation and corrective actions taken to prevent the quality issue from recurring.' },
          { type: 'steps', items: [
            'Click "CAR Management" under Customer Quality.',
            'CARs are created from claims that indicate a systemic issue (not a one-off).',
            'Click "Create CAR" and link it to one or more claims.',
            'Fill in the root cause analysis: what happened, why, and what process or control failed.',
            'Define corrective actions: what will change, who is responsible, and by when.',
            'Track implementation of each corrective action to completion.',
            'After the corrective actions are in place, monitor for recurrence over 30-90 days.',
            'Close the CAR when effectiveness is verified.',
          ]},
        ],
      },
      {
        id: 'credits',
        title: 'Credits & Approvals',
        blocks: [
          { type: 'steps', items: [
            'Click "Credits & Approvals" under Customer Quality.',
            'The credit queue shows all pending credit/refund requests arising from claims or RMAs.',
            'Each request shows the claim number, customer, amount, and reason.',
            'Review the request and supporting documentation.',
            'Approve, modify, or reject the credit. Credits above a threshold require manager or finance approval.',
            'Approved credits are posted to the customer\'s account and reflected on their next invoice.',
          ]},
          { type: 'tip', value: 'Use the "Credit History" tab to see all credits issued to a customer over time. High credit volumes for a customer may indicate a recurring quality issue that needs a CAR.' },
        ],
      },
    ],
  },

  // ─── 27. CONTRACTOR PORTAL ────────────────────────────────────────────
  {
    moduleId: 'contractor-portal',
    title: 'Contractor Portal',
    shortDescription: 'Visitor and contractor management — kiosk check-in, pre-registration, active visitor tracking, and contractor registry.',
    icon: 'Badge',
    roles: ['SECURITY', 'RECEPTION', 'EHS', 'BRANCH_MANAGER', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES'],
    routes: ['/contractors/active', '/contractors/registry', '/contractors/invitations', '/contractors/kiosk'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'The Contractor Portal manages all visitors and contractors who enter your facility. It ensures that every visitor is registered, has completed required safety briefings, holds valid certifications, and is accounted for while on-site. The module includes four sub-pages: Active Visitors (who\'s on-site now), Contractor Registry (approved contractor companies), Pre-Registration (invitations sent before arrival), and Check-In Kiosk (self-service arrival).' },
        ],
      },
      {
        id: 'check-in-kiosk',
        title: 'Check-In Kiosk',
        blocks: [
          { type: 'text', value: 'The kiosk is a tablet or terminal at the entrance where visitors check themselves in.' },
          { type: 'steps', items: [
            'Visitor taps "Check In" on the kiosk screen.',
            'If pre-registered, they enter their name or scan the QR code from their invitation email.',
            'If a walk-in, they enter their name, company, purpose of visit, and who they\'re visiting.',
            'The system checks if they need a safety briefing. If required, a short video or acknowledgment plays.',
            'The visitor confirms they agree to site rules and safety requirements.',
            'A visitor badge prints automatically with their name, photo (from webcam), company, host, and badge expiry time.',
            'The host is notified by email/SMS that their visitor has arrived.',
          ]},
          { type: 'warning', value: 'Contractors performing hot work, confined space entry, or working at heights MUST have valid permits before being allowed past the kiosk. The system checks this automatically.' },
        ],
      },
      {
        id: 'active-visitors',
        title: 'Active Visitors',
        blocks: [
          { type: 'steps', items: [
            'Click "Active Visitors" under Contractor Portal in the sidebar.',
            'The live board shows everyone currently checked in: name, company, host, check-in time, and area.',
            'In an emergency evacuation, use this screen as the accountability roster.',
            'Click a visitor to see their details, safety briefing status, and certifications.',
            'To manually check out a visitor, click "Check Out" on their row.',
            'Visitors who exceed their badge expiry time are highlighted in yellow for follow-up.',
          ]},
          { type: 'tip', value: 'Display the Active Visitors board on a monitor at the front desk and at the emergency muster point for real-time awareness.' },
        ],
      },
      {
        id: 'pre-registration',
        title: 'Pre-Registration / Invitations',
        blocks: [
          { type: 'steps', items: [
            'Click "Pre-Registration" under Contractor Portal.',
            'Click "Invite Visitor" to send a pre-registration invitation.',
            'Enter the visitor\'s name, email, company, purpose, and expected arrival date/time.',
            'Select the host (the employee they\'re visiting).',
            'The visitor receives an email with a QR code and any pre-arrival requirements (safety video, documents to bring).',
            'When they arrive at the kiosk, they scan the QR code for fast check-in.',
          ]},
        ],
      },
      {
        id: 'contractor-registry',
        title: 'Contractor Registry',
        blocks: [
          { type: 'steps', items: [
            'Click "Contractor Registry" under Contractor Portal.',
            'The registry lists all approved contractor companies with name, services, insurance expiry, and status.',
            'Click a contractor to see their profile: company details, insurance certificates, worker certifications, and visit history.',
            'To add a new contractor company, click "Add Contractor" and enter their details.',
            'Upload insurance certificates and set expiry alerts so you\'re notified before coverage lapses.',
            'Workers from this company can be pre-approved for site access once the contractor is in the registry.',
          ]},
        ],
      },
    ],
  },

  // ─── 28. TRAINING ENGINE ──────────────────────────────────────────────
  {
    moduleId: 'training-engine',
    title: 'Training Engine',
    shortDescription: 'Manage training programs, course catalog, employee certifications, and competency tracking.',
    icon: 'School',
    roles: ['HR', 'TRAINING_MANAGER', 'SHOP_SUPERVISOR', 'BRANCH_MANAGER', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES'],
    routes: ['/training/dashboard', '/training/courses', '/training/my-certs', '/training/matrix'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'The Training Engine manages your workforce training and certification programs. It includes a training dashboard with compliance status, a course catalog for available training programs, individual certification tracking, and a competency matrix showing which employees are qualified for which tasks.' },
        ],
      },
      {
        id: 'training-dashboard',
        title: 'Training Dashboard',
        blocks: [
          { type: 'steps', items: [
            'Click "Training Dashboard" under Training Engine in the sidebar.',
            'The dashboard shows compliance overview: percentage of employees with current certifications, expiring soon, and overdue.',
            'Red badges indicate overdue certifications that require immediate attention.',
            'Yellow badges indicate certifications expiring within 30 days.',
            'Click a category (Safety, Equipment Operation, Quality, Compliance) to drill down into specific training status.',
            'The "Upcoming Training" panel shows scheduled training sessions with date, trainer, and enrolled employees.',
          ]},
        ],
      },
      {
        id: 'course-catalog',
        title: 'Course Catalog',
        blocks: [
          { type: 'steps', items: [
            'Click "Course Catalog" under Training Engine.',
            'Browse available courses by category: Safety, Equipment Operation, Quality Procedures, Regulatory Compliance, Software Training.',
            'Click a course to see its details: description, duration, format (classroom, online, hands-on), prerequisites, and recertification interval.',
            'To enroll employees, click "Enroll" and select the employees from the dropdown.',
            'Set the training date and send enrollment notifications.',
            'To create a new course, click "Add Course" and fill in the course template.',
          ]},
        ],
      },
      {
        id: 'my-certs',
        title: 'My Certifications',
        blocks: [
          { type: 'text', value: 'Individual employees can view their own certification status here.' },
          { type: 'steps', items: [
            'Click "My Certifications" under Training Engine.',
            'See a list of all your certifications with status: Current, Expiring Soon, Expired.',
            'Click a certification to see details: completion date, expiry date, trainer, and certificate document.',
            'If a recertification is due, the "Schedule Recertification" button appears — click it to request a training slot.',
            'Download your certification documents by clicking "Download Certificate."',
          ]},
        ],
      },
      {
        id: 'competency-matrix',
        title: 'Competency Matrix',
        blocks: [
          { type: 'text', value: 'The competency matrix is a grid showing employees versus skills/certifications. It helps supervisors quickly see who is qualified for what.' },
          { type: 'steps', items: [
            'Click "Competency Matrix" under Training Engine.',
            'The matrix displays employees as rows and competencies/certifications as columns.',
            'Green = certified and current. Yellow = expiring soon. Red = expired or missing. Gray = not applicable.',
            'Use the department/shift filter to narrow the view to your team.',
            'Click any cell to see the certification detail for that employee-competency combination.',
            'Export the matrix as PDF or CSV for offline review.',
          ]},
          { type: 'tip', value: 'Use the competency matrix when planning shift assignments to ensure every shift has operators certified for all required equipment.' },
        ],
      },
    ],
  },

  // ─── 29. PRODUCTION QUALITY ───────────────────────────────────────────
  {
    moduleId: 'production-quality',
    title: 'Production Quality',
    shortDescription: 'In-process quality inspections, SPC charting, NCR management, and full production traceability.',
    icon: 'FactCheck',
    roles: ['QA', 'QC_INSPECTOR', 'QA_MANAGER', 'SHOP_SUPERVISOR', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES'],
    routes: ['/production-quality/dashboard', '/production-quality/inspections', '/production-quality/ncr', '/production-quality/spc', '/production-quality/trace'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'Production Quality monitors quality during the manufacturing process — not just at receiving (SQM) or at final shipment, but while work is happening on the shop floor. It includes a quality dashboard, in-process inspection execution, NCR (Non-Conformance Report) management, SPC (Statistical Process Control) charts for monitoring process capability, and traceability for linking inputs to outputs.' },
        ],
      },
      {
        id: 'quality-dashboard',
        title: 'Quality Dashboard',
        blocks: [
          { type: 'steps', items: [
            'Click "Quality Dashboard" under Production Quality in the sidebar.',
            'The dashboard displays: first-pass yield, scrap rate, NCR count, inspection pass rate, and SPC alarm count.',
            'Use the time range selector to view trends by day, week, month, or quarter.',
            'Click any KPI card to drill down into details (e.g., click scrap rate to see scrap by product, machine, or shift).',
            'The "Alerts" panel highlights SPC alarms, overdue inspections, and open NCRs requiring action.',
          ]},
        ],
      },
      {
        id: 'inspections',
        title: 'In-Process Inspections',
        blocks: [
          { type: 'steps', items: [
            'Click "Inspections" under Production Quality.',
            'The inspection queue shows jobs with pending in-process inspection points.',
            'Click a job to open its inspection form. The form is auto-generated from the inspection plan attached to the product/process.',
            'Enter measurements at each checkpoint (e.g., cut length, bend angle, surface finish, hardness).',
            'The system compares your measurements against the spec limits and shows pass/fail in real time.',
            'If all checkpoints pass, click "Accept" to release the job for the next operation.',
            'If any checkpoint fails, click "Hold" and create an NCR.',
            'Attach photos, gauge calibration records, or other evidence to the inspection record.',
          ]},
        ],
      },
      {
        id: 'ncr',
        title: 'NCR Management',
        blocks: [
          { type: 'text', value: 'An NCR (Non-Conformance Report) documents any product or process deviation from specification.' },
          { type: 'steps', items: [
            'Click "NCR Management" under Production Quality.',
            'The NCR list shows all open, pending, and recently closed NCRs.',
            'To create a new NCR, click "New NCR" and link it to the job, operation, and inspection that found the issue.',
            'Describe the non-conformance: what failed, how it was detected, and the severity (Minor, Major, Critical).',
            'Assign a disposition: Rework, Scrap, Use As-Is (with engineering approval), or Return to Previous Operation.',
            'If rework, create a rework job order and link it to the NCR.',
            'Track the NCR through resolution. Record the corrective action taken.',
            'Close the NCR when the disposition is complete and verified.',
          ]},
          { type: 'warning', value: 'Critical NCRs require immediate containment. All potentially affected material must be quarantined until the scope of the issue is determined.' },
        ],
      },
      {
        id: 'spc',
        title: 'SPC Charts',
        blocks: [
          { type: 'text', value: 'SPC (Statistical Process Control) charts monitor process stability by plotting measurement data over time against control limits.' },
          { type: 'steps', items: [
            'Click "SPC Charts" under Production Quality.',
            'Select the process, machine, or product to monitor from the dropdown.',
            'The chart displays data points over time with upper and lower control limits (UCL/LCL) and the center line.',
            'Green points are in control. Yellow points are warning zone (between 1σ and 2σ from center). Red points are out of control.',
            'The system automatically detects SPC rule violations (e.g., 7 consecutive points above/below center, 2 of 3 points beyond 2σ).',
            'When an alarm triggers, click it to see the rule violated and suggested investigation actions.',
            'Use the "Capability" tab to see Cp and Cpk values for the selected process.',
          ]},
          { type: 'tip', value: 'SPC is most valuable when data is collected consistently. Make sure operators record measurements at every required inspection point to keep charts meaningful.' },
        ],
      },
      {
        id: 'traceability',
        title: 'Production Traceability',
        blocks: [
          { type: 'steps', items: [
            'Click "Traceability" under Production Quality.',
            'Search by job number, unit ID, heat number, or order number.',
            'The traceability tree shows the complete genealogy: input materials → processing operations → output pieces → packaging → shipment.',
            'Click any node to see its detail: timestamps, operators, machines, inspection results.',
            'Use "Forward Trace" to find all output pieces and customers affected by a specific input material.',
            'Use "Backward Trace" to find all input materials and sources for a specific output piece.',
            'Export the traceability report as PDF for customer requests or regulatory audits.',
          ]},
        ],
      },
    ],
  },

  // ─── 30. MAINTENANCE ──────────────────────────────────────────────────
  {
    moduleId: 'maintenance',
    title: 'Maintenance',
    shortDescription: 'Equipment maintenance management — work orders, PM schedules, asset registry, and spare parts inventory.',
    icon: 'Build',
    roles: ['MAINTENANCE', 'MAINTENANCE_MANAGER', 'SHOP_SUPERVISOR', 'PLANT_MANAGER', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES'],
    routes: ['/maintenance/dashboard', '/maintenance/work-orders', '/maintenance/assets', '/maintenance/pm-schedules', '/maintenance/parts'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'Maintenance manages all equipment upkeep activities. It includes a maintenance dashboard for KPIs, a work order system for reactive and planned repairs, a PM (Preventive Maintenance) scheduler, an asset registry for tracking all equipment, and a spare parts inventory. The goal is to maximize equipment uptime and minimize unplanned breakdowns.' },
        ],
      },
      {
        id: 'maintenance-dashboard',
        title: 'Maintenance Dashboard',
        blocks: [
          { type: 'steps', items: [
            'Click "Maintenance Dashboard" under Maintenance in the sidebar.',
            'The dashboard shows KPIs: overall equipment availability, open work orders, overdue PMs, MTBF (mean time between failures), and MTTR (mean time to repair).',
            'Red indicators show critical issues: equipment down, overdue PMs past threshold, or safety-related work orders.',
            'Click any KPI to drill down into the underlying data.',
            'The "Today\'s Schedule" panel shows maintenance tasks scheduled for today with assigned technicians.',
          ]},
        ],
      },
      {
        id: 'work-orders',
        title: 'Maintenance Work Orders',
        blocks: [
          { type: 'steps', items: [
            'Click "Work Orders" under Maintenance.',
            'The list shows all work orders with WO number, asset, priority, status, and assigned technician.',
            'To create a new work order, click "New Work Order."',
            'Select the asset (machine/equipment) from the dropdown.',
            'Enter the problem description, priority (Emergency, High, Medium, Low), and requested completion date.',
            'Assign a technician or maintenance team.',
            'When work begins, the technician updates status to "In Progress" and logs labor hours.',
            'Record parts used from the spare parts inventory (auto-deducted from stock).',
            'When complete, the technician enters completion notes and changes status to "Complete."',
            'The supervisor reviews and closes the work order.',
          ]},
          { type: 'tip', value: 'Anyone can submit a work order request. Operators should submit a request immediately when they notice equipment problems, strange noises, or safety concerns.' },
        ],
      },
      {
        id: 'pm-schedules',
        title: 'PM Schedules',
        blocks: [
          { type: 'text', value: 'PM (Preventive Maintenance) schedules define recurring maintenance tasks based on time intervals or usage counts.' },
          { type: 'steps', items: [
            'Click "PM Schedules" under Maintenance.',
            'The PM list shows all scheduled preventive maintenance tasks with asset, frequency, next due date, and status.',
            'Click "Add PM Schedule" to create a new recurring task.',
            'Select the asset, define the task (lubrication, filter change, belt inspection, etc.), and set the frequency (daily, weekly, monthly, or by usage hours/cycles).',
            'Assign a default technician or team.',
            'When a PM comes due, the system auto-generates a work order.',
            'After completion, the next due date is automatically calculated based on the frequency.',
          ]},
          { type: 'warning', value: 'Skipping preventive maintenance increases the risk of unplanned breakdowns. If a PM must be deferred, document the reason and the new scheduled date.' },
        ],
      },
      {
        id: 'asset-registry',
        title: 'Asset Registry',
        blocks: [
          { type: 'steps', items: [
            'Click "Asset Registry" under Maintenance.',
            'The registry lists all equipment and assets with ID, name, type, location, status (Running, Down, Maintenance, Decommissioned), and install date.',
            'Click an asset to see its profile: specifications, maintenance history, PM schedules, parts list, and documents (manuals, drawings).',
            'To add a new asset, click "Add Asset" and enter the details: name, type, manufacturer, model, serial number, install date, location, and criticality rating.',
            'Attach manuals, warranty documents, and photos to the asset record.',
          ]},
        ],
      },
      {
        id: 'parts-inventory',
        title: 'Spare Parts Inventory',
        blocks: [
          { type: 'steps', items: [
            'Click "Parts Inventory" under Maintenance.',
            'The parts list shows all spare parts with part number, description, quantity on hand, reorder point, and associated assets.',
            'When a part is used on a work order, it\'s auto-deducted from inventory.',
            'When stock falls below the reorder point, the system generates a purchase request notification.',
            'Click "Add Part" to add a new spare part to the inventory.',
            'Link parts to specific assets so the system knows which parts go with which machines.',
          ]},
        ],
      },
    ],
  },

  // ─── 31. PACKAGING & CUSTODY ──────────────────────────────────────────
  {
    moduleId: 'packaging-custody',
    title: 'Packaging & Custody',
    shortDescription: 'Full packaging workflow — queue, QC release, labeling, staging, chain of custody tracking, and document management.',
    icon: 'Inventory2',
    roles: ['PACKAGING', 'WAREHOUSE', 'QA', 'SHIPPING', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES'],
    routes: ['/packaging/queue', '/packaging/qc-release', '/packaging/labels', '/packaging/staging', '/packaging/custody', '/packaging/docs'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'Packaging & Custody manages the complete packaging process from finished production through dock staging. It includes a packaging queue (jobs ready to pack), QC release station (final quality sign-off), label management (printing and applying labels/tags), staging & docks (organizing packages for pickup), chain of custody (tracking who handled what and when), and a documentation center (MTRs, certs, packing lists).' },
        ],
      },
      {
        id: 'packaging-queue',
        title: 'Packaging Queue',
        blocks: [
          { type: 'steps', items: [
            'Click "Packaging Queue" under Packaging & Custody in the sidebar.',
            'The queue shows all completed jobs ready for packaging, sorted by priority and due date.',
            'Click a job to see what needs to be packaged: pieces, dimensions, weight, and any special packaging instructions from the customer.',
            'Select the packaging method: banding, palletizing, boxing, or crating.',
            'Enter package details: piece count per package, package weight, package dimensions.',
            'Scan or enter each piece being added to the package for traceability.',
            'Click "Complete Package" when done. The package gets a unique package ID.',
          ]},
        ],
      },
      {
        id: 'qc-release',
        title: 'QC Release Station',
        blocks: [
          { type: 'steps', items: [
            'Click "QC Release Station" under Packaging & Custody.',
            'Packages pending QC release are listed here.',
            'Select a package and perform the final quality check: correct pieces, dimensions verified, no damage, labels correct.',
            'If everything checks out, click "Release." The package is cleared for shipping.',
            'If there\'s an issue, click "Hold" and enter the reason. The package is flagged and routed back for correction.',
          ]},
        ],
      },
      {
        id: 'label-management',
        title: 'Label Management',
        blocks: [
          { type: 'steps', items: [
            'Click "Label Management" under Packaging & Custody.',
            'Select a package or batch of packages to generate labels for.',
            'Choose label type: shipping label, product label, drop tag, customer-specific label.',
            'Preview the label. Verify barcode, heat number, grade, dimensions, and customer info.',
            'Click "Print" to send to the label printer.',
            'Scan the printed label onto the package to confirm application.',
          ]},
        ],
      },
      {
        id: 'staging-docks',
        title: 'Staging & Docks',
        blocks: [
          { type: 'steps', items: [
            'Click "Staging & Docks" under Packaging & Custody.',
            'The staging board shows dock assignments: which dock each shipment is staged at and its pickup time.',
            'Drag packages to dock positions to assign staging locations.',
            'The board uses color coding: Green = ready for pickup, Yellow = partially staged, Red = missing packages.',
            'When the carrier arrives, check off packages as they\'re loaded onto the truck.',
          ]},
        ],
      },
      {
        id: 'chain-of-custody',
        title: 'Chain of Custody',
        blocks: [
          { type: 'text', value: 'Chain of Custody tracks every handoff of material — from production completion through packaging, staging, loading, and delivery.' },
          { type: 'steps', items: [
            'Click "Chain of Custody" under Packaging & Custody.',
            'Search by package ID, order number, or heat number.',
            'The custody timeline shows every touchpoint: who handled the material, when, and where.',
            'Each handoff is recorded with a timestamp, operator ID, and location.',
            'Use this for compliance audits, customer inquiries, or loss investigations.',
          ]},
        ],
      },
      {
        id: 'documentation-center',
        title: 'Documentation Center',
        blocks: [
          { type: 'steps', items: [
            'Click "Documentation Center" under Packaging & Custody.',
            'The document center stores all shipping documents: MTRs, certificates of conformance, packing lists, BOLs, and customer-specific documentation.',
            'Search by order number, shipment number, or customer name.',
            'Click "Generate Document" to create a new document from templates.',
            'Attach documents to specific shipments or orders.',
            'Customers can access their documents through the customer portal or via emailed links.',
          ]},
        ],
      },
    ],
  },

  // ─── 32. DROP TAG ENGINE ──────────────────────────────────────────────
  {
    moduleId: 'drop-tag-engine',
    title: 'Drop Tag Engine',
    shortDescription: 'Dedicated tag lifecycle — queue, print center, apply station, listings, staging, loading, and traceability.',
    icon: 'Label',
    roles: ['PACKAGING', 'WAREHOUSE', 'SHIPPING', 'SHOP_SUPERVISOR', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES'],
    routes: ['/drop-tags/queue', '/drop-tags/print-center', '/drop-tags/apply', '/drop-tags/listings', '/drop-tags/staging', '/drop-tags/load', '/drop-tags/traceability'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'The Drop Tag Engine is a dedicated module for managing the lifecycle of drop tags (identification tags attached to individual pieces, bundles, or packages). It covers the full cycle: generating tags in the queue, printing at the print center, applying at the apply station, listing all active tags, staging tagged material, loading onto trucks, and tracing tags through the supply chain.' },
        ],
      },
      {
        id: 'tag-queue',
        title: 'Packaging Queue (Tag Generation)',
        blocks: [
          { type: 'steps', items: [
            'Click "Packaging Queue" under Drop Tag Engine in the sidebar.',
            'The queue shows all items needing drop tags: completed jobs, cut pieces, and packages awaiting tagging.',
            'Each item shows the order number, customer, product, quantity of tags needed, and priority.',
            'Click "Generate Tags" on an item to create the tag records with unique tag IDs.',
            'Tags are auto-populated with: tag ID, heat number, grade, dimensions, weight, customer, and order number.',
            'Review the tag data. Click "Send to Print" to move tags to the Print Center queue.',
          ]},
        ],
      },
      {
        id: 'print-center',
        title: 'Print Center',
        blocks: [
          { type: 'steps', items: [
            'Click "Print Center" under Drop Tag Engine.',
            'The print queue shows all tags ready to print with tag ID, tag type, and printer assignment.',
            'Select tags to print (individually or in batches).',
            'Choose the printer and tag format (metal tag, paper tag, barcode label, RFID tag).',
            'Click "Print." The system sends the job to the selected printer.',
            'Verify printed tags for readability and correct information.',
            'Mark tags as "Printed" to move them to the Apply Station queue.',
          ]},
        ],
      },
      {
        id: 'apply-station',
        title: 'Apply Station',
        blocks: [
          { type: 'steps', items: [
            'Click "Apply Station" under Drop Tag Engine.',
            'The apply queue shows printed tags ready to be attached to physical pieces.',
            'Scan the piece/package barcode, then scan the drop tag.',
            'The system confirms the match (correct tag for this piece) with a green checkmark.',
            'If it\'s a mismatch, the system shows a red alert. Do NOT apply the tag — find the correct one.',
            'After applying, the tag status changes to "Applied" and the piece is traceable by tag ID.',
          ]},
          { type: 'warning', value: 'Applying the wrong tag to a piece causes a traceability break. Always scan both the piece and the tag to verify the match before attaching.' },
        ],
      },
      {
        id: 'listings',
        title: 'Tag Listings',
        blocks: [
          { type: 'steps', items: [
            'Click "Listings" under Drop Tag Engine.',
            'The tag listing is a searchable table of all tags: generated, printed, applied, staged, shipped.',
            'Use filters for status, date range, customer, order, or heat number.',
            'Click any tag to see its full lifecycle: when generated, printed, applied, and to which piece/package.',
            'Export listings as CSV or PDF for inventory audits or customer documentation.',
          ]},
        ],
      },
      {
        id: 'staging-board',
        title: 'Staging Board',
        blocks: [
          { type: 'steps', items: [
            'Click "Staging Board" under Drop Tag Engine.',
            'The staging board shows tagged material organized by shipment and dock location.',
            'Scan tags as material is moved to the staging area. The board updates in real time.',
            'Verify all tags for a shipment are accounted for before the truck is loaded.',
            'The board shows: Green = all tags staged, Yellow = partially staged, Red = tags missing.',
          ]},
        ],
      },
      {
        id: 'loading',
        title: 'Loading Screen',
        blocks: [
          { type: 'steps', items: [
            'Click "Loading Screen" under Drop Tag Engine.',
            'Select the shipment being loaded.',
            'As each piece is loaded onto the truck, scan its drop tag.',
            'The system checks off each piece and updates the load manifest in real time.',
            'If a piece is scanned that doesn\'t belong to this shipment, the system alerts you immediately.',
            'When all pieces are loaded, click "Complete Loading." The shipment status changes to "Loaded."',
          ]},
        ],
      },
      {
        id: 'traceability',
        title: 'Tag Traceability',
        blocks: [
          { type: 'steps', items: [
            'Click "Traceability" under Drop Tag Engine.',
            'Enter a tag ID, heat number, or order number to trace.',
            'The traceability view shows the complete tag journey: generation → printing → application → staging → loading → shipping → delivery.',
            'Each step includes timestamp, operator, and location.',
            'Use "Forward Trace" from a heat number to find all tags and customers who received material from that heat.',
            'Use "Reverse Trace" from a customer complaint to trace back to the exact heat and mill source.',
          ]},
        ],
      },
    ],
  },

  // ─── 33. FREIGHT & DELIVERY ───────────────────────────────────────────
  {
    moduleId: 'freight-delivery',
    title: 'Freight & Delivery',
    shortDescription: 'Plan shipments, compare freight rates, track deliveries in real time, and manage delivery exceptions.',
    icon: 'LocalShipping',
    roles: ['SHIPPING', 'LOGISTICS', 'DISPATCH', 'CSR', 'BRANCH_MANAGER', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES', 'OUTLET'],
    routes: ['/freight/planner', '/freight/comparison', '/freight/tracking', '/freight/exceptions'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'Freight & Delivery focuses specifically on freight management: planning outbound shipments, comparing carrier rates to find the best option, tracking deliveries with real-time updates, and handling delivery exceptions (damages, delays, refused shipments). This module works alongside Logistics but focuses on the freight/carrier side of transportation.' },
        ],
      },
      {
        id: 'shipment-planner',
        title: 'Shipment Planner',
        blocks: [
          { type: 'steps', items: [
            'Click "Shipment Planner" under Freight & Delivery in the sidebar.',
            'The planner shows all packages staged and ready to ship, organized by destination region.',
            'Select packages to build into a shipment. The system calculates total weight, dimensions, and freight class.',
            'Choose delivery priority: Standard, Expedited, or Hot Rush.',
            'Click "Get Rates" to request carrier quotes (see Freight Comparison).',
            'Select the carrier and service level.',
            'Generate BOL and shipping documents.',
            'Schedule the pickup with the carrier.',
          ]},
        ],
      },
      {
        id: 'freight-comparison',
        title: 'Freight Comparison',
        blocks: [
          { type: 'text', value: 'Compare real-time freight rates from multiple carriers to find the best price and transit time for each shipment.' },
          { type: 'steps', items: [
            'Click "Freight Comparison" under Freight & Delivery.',
            'Enter shipment details: origin, destination, weight, dimensions, and freight class.',
            'Click "Compare Rates." The system queries connected carriers and displays quotes in a comparison table.',
            'The table shows: carrier name, service level, transit time, cost, and reliability score (based on historical performance).',
            'Sort by price, transit time, or reliability to find the best option.',
            'Click "Select" on your chosen carrier to apply the rate to the shipment.',
          ]},
          { type: 'tip', value: 'The reliability score is calculated from historical data — on-time delivery rate and damage claim rate for that carrier and lane. A cheaper rate isn\'t always better if the carrier has reliability issues.' },
        ],
      },
      {
        id: 'tracking-board',
        title: 'Tracking Board',
        blocks: [
          { type: 'steps', items: [
            'Click "Tracking Board" under Freight & Delivery.',
            'The board shows all in-transit shipments with carrier, status, ETA, and last update.',
            'Status colors: Green = on time, Yellow = minor delay, Red = significant delay or exception.',
            'Click a shipment to see the tracking timeline with all carrier scan events.',
            'Click "Send Update to Customer" to email the customer a delivery status update.',
            'The "Delivery Today" section highlights all shipments expected to deliver today.',
          ]},
        ],
      },
      {
        id: 'exception-inbox',
        title: 'Exception Inbox',
        blocks: [
          { type: 'steps', items: [
            'Click "Exception Inbox" under Freight & Delivery.',
            'The inbox shows all delivery exceptions: refused deliveries, damage reports, address issues, missed appointments, and carrier delays.',
            'Click an exception to see details and the affected shipment.',
            'Assign the exception to a handler (shipping coordinator or CSR).',
            'Take action: redeliver, reroute, file a carrier claim, or notify the customer.',
            'Document the resolution and close the exception.',
          ]},
          { type: 'warning', value: 'Delivery exceptions must be addressed within 24 hours. Unresolved exceptions can lead to customer dissatisfaction and carrier claim deadlines expiring.' },
        ],
      },
    ],
  },

  // ─── 34. SAFETY & EHS ────────────────────────────────────────────────
  {
    moduleId: 'safety-ehs',
    title: 'Safety & EHS',
    shortDescription: 'Safety management system covering incidents, inspections, permits, and training compliance.',
    icon: 'HealthAndSafety',
    roles: ['EHS', 'SAFETY_OFFICER', 'SHOP_SUPERVISOR', 'PLANT_MANAGER', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES'],
    routes: ['/safety', '/safety/stop-work', '/safety/assistant', '/safety/incidents', '/safety/inspections', '/safety/permits', '/safety/training', '/safety/observations', '/safety/capa'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'Safety & EHS (Environment, Health & Safety) is a comprehensive safety management system. It covers: Safety Dashboard (overall safety metrics and trends), Stop-Work Authority (empowering anyone to halt unsafe operations), Safety Assistant (AI-powered safety guidance), Incident Management (reporting and investigating incidents), Safety Inspections (scheduled workplace safety audits), Permits (hot work, confined space, LOTO permits), Safety Training (safety-specific training tracking), Behavioral Observations (safety observation cards), and CAPA (Corrective and Preventive Actions).' },
        ],
      },
      {
        id: 'safety-dashboard',
        title: 'Safety Dashboard',
        blocks: [
          { type: 'steps', items: [
            'Click "Safety Dashboard" under Safety & EHS in the sidebar.',
            'The dashboard displays key safety metrics: days since last recordable incident, total incident count (YTD), near-miss count, open investigations, inspection compliance rate, and training compliance.',
            'The trend chart shows incident rates over the past 12 months.',
            'Click any metric to drill down into the underlying data.',
            'The "Safety Alerts" panel shows active safety bulletins, recent stop-work events, and overdue inspections.',
          ]},
        ],
      },
      {
        id: 'stop-work',
        title: 'Stop-Work Authority',
        blocks: [
          { type: 'text', value: 'Anyone — from the newest operator to the plant manager — has the authority and responsibility to stop work if they see an unsafe condition. This module makes it easy to exercise that right.' },
          { type: 'steps', items: [
            'Click "Stop-Work Authority" under Safety & EHS.',
            'Click "Issue Stop-Work" to halt an unsafe operation.',
            'Select the area or machine involved.',
            'Describe the hazard: what is unsafe and why work must stop.',
            'The system immediately notifies the supervisor, EHS team, and affected operators.',
            'Work cannot resume until the hazard is resolved and a "Resume Work" authorization is entered by a supervisor or EHS officer.',
            'The stop-work event is logged with full details for follow-up investigation.',
          ]},
          { type: 'warning', value: 'There are NO negative consequences for issuing a stop-work. It is always better to stop and investigate than to risk an injury. The company fully supports stop-work authority at all levels.' },
        ],
      },
      {
        id: 'safety-assistant',
        title: 'Safety Assistant (AI)',
        blocks: [
          { type: 'text', value: 'The Safety Assistant is an AI-powered chatbot that answers safety-related questions, looks up procedures, and provides guidance for hazard assessment.' },
          { type: 'steps', items: [
            'Click "Safety Assistant" under Safety & EHS.',
            'Type your safety question in natural language (e.g., "What PPE do I need for plasma cutting?" or "What\'s the lockout procedure for the shear?").',
            'The assistant retrieves the relevant safety procedure, regulation, or SDS (Safety Data Sheet).',
            'For complex situations, the assistant suggests consulting the EHS team directly.',
          ]},
        ],
      },
      {
        id: 'incidents',
        title: 'Incident Reporting & Investigation',
        blocks: [
          { type: 'steps', items: [
            'Click "Incidents" under Safety & EHS.',
            'The incident log shows all reported incidents with date, type, severity, status, and investigator.',
            'To report a new incident, click "Report Incident."',
            'Select the incident type: Injury, Near Miss, Property Damage, Environmental Release, or Vehicle Accident.',
            'Enter details: date/time, location, people involved, description of what happened, and immediate actions taken.',
            'Attach photos, witness statements, or documents.',
            'Assign an investigator and target investigation completion date.',
            'The investigator completes a root cause analysis (5-Why, Fishbone, or Fault Tree).',
            'Record corrective actions and track them to completion.',
            'Close the incident when all actions are verified complete.',
          ]},
        ],
      },
      {
        id: 'inspections',
        title: 'Safety Inspections',
        blocks: [
          { type: 'steps', items: [
            'Click "Inspections" under Safety & EHS.',
            'The inspection schedule shows all upcoming and overdue safety audits.',
            'Click a scheduled inspection to start it. The checklist loads with items to verify.',
            'Walk through the area and check each item: fire extinguishers, machine guards, PPE compliance, housekeeping, etc.',
            'Mark each item as Pass, Fail, or N/A. Add photos and notes for any deficiencies.',
            'Submit the inspection. Failed items auto-generate corrective action tasks.',
            'Track corrective action completion from the Inspections dashboard.',
          ]},
        ],
      },
      {
        id: 'permits',
        title: 'Safety Permits',
        blocks: [
          { type: 'text', value: 'Certain high-risk activities require permits before work can begin: hot work (welding, cutting, grinding in non-designated areas), confined space entry, lockout/tagout (LOTO), and working at heights.' },
          { type: 'steps', items: [
            'Click "Permits" under Safety & EHS.',
            'Click "Request Permit" and select the permit type.',
            'Fill in the details: location, scope of work, duration, personnel involved, and hazard controls.',
            'The system routes the permit to the authorizing person (supervisor, EHS, or both) for approval.',
            'Once approved, the permit is active for the specified duration.',
            'The permit holder must verify all controls are in place before starting work.',
            'When work is complete, close the permit. For hot work, a fire watch period is required before closing.',
          ]},
          { type: 'warning', value: 'Working without a required permit is a serious safety violation. If you\'re unsure whether a permit is needed, ask EHS before starting the work.' },
        ],
      },
      {
        id: 'safety-training',
        title: 'Safety Training',
        blocks: [
          { type: 'steps', items: [
            'Click "Training" under Safety & EHS.',
            'This is the safety-specific training tracker (separate from the general Training Engine).',
            'View safety training requirements by role: which safety courses are required and their recertification intervals.',
            'See compliance status: who is current, who is expiring, and who is overdue.',
            'Schedule safety training sessions: toolbox talks, annual safety refreshers, equipment-specific safety training.',
            'Record attendance and completion for each session.',
          ]},
        ],
      },
      {
        id: 'observations',
        title: 'Behavioral Safety Observations',
        blocks: [
          { type: 'steps', items: [
            'Click "Observations" under Safety & EHS.',
            'Behavioral observations are informal safety checks where anyone notes safe or at-risk behaviors.',
            'Click "New Observation" to log an observation.',
            'Select: Safe Behavior (positive reinforcement) or At-Risk Behavior (coaching opportunity).',
            'Describe what you observed. No names required for at-risk observations — the goal is to improve processes, not blame individuals.',
            'Observations feed into the safety dashboard\'s trends to identify areas needing attention.',
          ]},
          { type: 'tip', value: 'Aim for a ratio of at least 5 safe observations for every 1 at-risk observation. Positive reinforcement is the strongest driver of safety culture.' },
        ],
      },
      {
        id: 'capa',
        title: 'CAPA (Corrective and Preventive Actions)',
        blocks: [
          { type: 'text', value: 'CAPA is the process for ensuring that safety issues are not just fixed, but that the root cause is addressed and controls are put in place to prevent recurrence.' },
          { type: 'steps', items: [
            'Click "CAPA" under Safety & EHS.',
            'The CAPA log shows all open and recently closed corrective/preventive actions.',
            'CAPAs are generated from incidents, inspections, observations, or manual entry.',
            'Each CAPA includes: source event, root cause, corrective action (fix the immediate problem), preventive action (prevent recurrence), responsible person, and due date.',
            'Track CAPA implementation through the status workflow: Open → In Progress → Verification → Closed.',
            'Verify effectiveness: after implementation, monitor for recurrence over 30-90 days.',
            'Close the CAPA when effectiveness is confirmed. If the issue recurs, re-open and strengthen the corrective action.',
          ]},
        ],
      },
    ],
  },

  // ─── 35. ENTERPRISE ACCOUNT PORTAL ────────────────────────────────────
  {
    moduleId: 'enterprise-account',
    title: 'Enterprise Account Portal',
    shortDescription: 'Customer-facing account dashboard — order history, invoices, documents, preferences, and self-service tools.',
    icon: 'AccountBalance',
    roles: ['CUSTOMER', 'ACCOUNT_MANAGER', 'CSR', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES', 'OUTLET'],
    routes: ['/account/dashboard'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'The Enterprise Account Portal is a customer-facing dashboard where your customers can log in and manage their account. They can view order history, track active orders, download invoices and MTRs, update their preferences, and place repeat orders. For your internal team, it reduces inbound calls by giving customers self-service access to common information.' },
        ],
      },
      {
        id: 'customer-features',
        title: 'Customer-Facing Features',
        blocks: [
          { type: 'bullets', items: [
            'Order History — search and filter past orders, view line-item detail, and re-order with one click',
            'Active Orders — real-time status tracking for open orders (In Production, Packaging, Shipped, Delivered)',
            'Documents — download MTRs, certificates of conformance, BOLs, and invoices',
            'Invoices & Payments — view invoice history and current balance, make online payments (if enabled)',
            'Preferences — update contact info, ship-to addresses, product favorites, and communication preferences',
            'Support — submit questions or issues directly to the assigned CSR',
          ]},
        ],
      },
      {
        id: 'setup',
        title: 'Setting Up Customer Access',
        blocks: [
          { type: 'steps', items: [
            'Go to Customer Directory and open the customer\'s profile.',
            'Click the "Portal Access" tab.',
            'Click "Invite User" and enter the customer contact\'s name and email.',
            'The contact receives an email invitation to create their portal login.',
            'Set permissions: which features the contact can access (orders, documents, invoices, payments).',
            'Multiple contacts per company can have portal access with different permission levels.',
          ]},
          { type: 'tip', value: 'Encourage your top customers to use the portal for document downloads and order tracking. It saves your CSR team significant time on routine inquiries.' },
        ],
      },
    ],
  },

  // ─── 36. E-COMMERCE ADMIN ─────────────────────────────────────────────
  {
    moduleId: 'ecommerce-admin',
    title: 'E-Commerce Administration',
    shortDescription: 'Manage the online store catalog, product listings, steel outlet, and online settings.',
    icon: 'AdminPanelSettings',
    roles: ['ECOMMERCE_ADMIN', 'BRANCH_MANAGER', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES', 'OUTLET'],
    routes: ['/admin/catalog', '/admin/online-settings', '/shop/remnants'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'E-Commerce Administration covers the backend management of your online store. Catalog Admin lets you control which products appear online, set descriptions, images, and pricing visibility. Online Settings configures store behavior (checkout rules, shipping options, payment methods, customer registration). The Steel Outlet is a special section for selling off-cuts and remnant pieces at discounted prices.' },
        ],
      },
      {
        id: 'catalog-admin',
        title: 'Catalog Admin',
        blocks: [
          { type: 'steps', items: [
            'Click "Catalog Admin" under E-Commerce in the sidebar.',
            'The catalog manager shows all products with their online status: Published, Draft, or Hidden.',
            'Click a product to edit its online listing: title, description, images, specifications, and pricing visibility.',
            'Use "Publish" to make a product visible in the online store. Use "Hide" to remove it without deleting.',
            'Organize products into categories and subcategories for easy customer navigation.',
            'Set inventory visibility rules: show exact stock count, "In Stock / Out of Stock" only, or "Call for Availability."',
            'Preview the product page by clicking "Preview" before publishing.',
          ]},
        ],
      },
      {
        id: 'online-settings',
        title: 'Online Settings',
        blocks: [
          { type: 'steps', items: [
            'Click "Online Settings" under E-Commerce.',
            'Configure store settings: business hours display, minimum order amounts, shipping methods available, payment methods accepted.',
            'Set checkout rules: require account to order, allow guest checkout, require PO number.',
            'Configure email templates for order confirmation, shipping notification, and delivery confirmation.',
            'Set up tax rules by state/region.',
            'Enable or disable customer self-registration.',
            'Configure the store banner, announcements, and promotional content.',
          ]},
        ],
      },
      {
        id: 'steel-outlet',
        title: 'Steel Outlet',
        blocks: [
          { type: 'text', value: 'The Steel Outlet is a special section of the online store for selling off-cuts, short pieces, and remnants at discounted prices. This helps recover value from material that would otherwise be scrap.' },
          { type: 'steps', items: [
            'Remnant pieces are automatically flagged during production when a cut creates an off-cut below a configurable threshold.',
            'Review flagged remnants and set a discount percentage (or fixed price) for each.',
            'Publish to the Steel Outlet. Customers can browse and purchase remnants online at discounted prices.',
            'Remnants are first-come-first-served. When purchased, they\'re removed from the outlet and enter the normal order pipeline.',
          ]},
          { type: 'tip', value: 'Popular remnant materials (4×8 drops of A36 plate, short bars) sell quickly. Price them competitively to move inventory fast and free up warehouse space.' },
        ],
      },
    ],
  },

  // ─── 37. PLANNING ─────────────────────────────────────────────────────
  {
    moduleId: 'planning',
    title: 'Planning',
    shortDescription: 'Production planning and capacity management — schedule jobs, allocate machine time, and balance workloads.',
    icon: 'EventNote',
    roles: ['PLANNER', 'SHOP_SUPERVISOR', 'OPS_MANAGER', 'ADMIN'],
    divisions: ['METALS', 'PLASTICS', 'SUPPLIES'],
    routes: ['/planning'],
    sections: [
      {
        id: 'what-it-does',
        title: 'What This Module Does',
        blocks: [
          { type: 'text', value: 'Planning is where production schedulers organize jobs across machines and shifts to meet delivery dates. It shows available capacity, pending jobs, and lets you drag-and-drop jobs onto machine timeslots. The planner automatically calculates load vs. capacity and warns about overloaded periods.' },
        ],
      },
      {
        id: 'using-planning',
        title: 'How to Schedule Jobs',
        blocks: [
          { type: 'steps', items: [
            'Click "Planning" in the sidebar under Service Center.',
            'The planning board shows a Gantt-style view with machines as rows and time as columns.',
            'Unscheduled jobs appear in the "Unscheduled" panel on the left.',
            'Drag a job from the Unscheduled panel onto a machine timeslot.',
            'The system checks the job\'s processing requirements against the machine capabilities.',
            'If the machine can handle the job, it snaps into place. If not, a warning appears.',
            'Adjust job duration by dragging the right edge of the job bar.',
            'Check the capacity bar at the bottom — it shows overall load vs. available hours.',
            'Click "Publish Schedule" to make the schedule visible to shop floor operators.',
          ]},
          { type: 'tip', value: 'Use "Auto-Schedule" to let the system automatically place all unscheduled jobs based on priority, due date, and machine availability. Review and adjust as needed.' },
        ],
      },
      {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        blocks: [
          { type: 'troubleshoot', items: [
            { problem: 'Job won\'t drop onto a machine', solution: 'The machine may not have the required capability for that processing operation. Check the job\'s operation type and the machine\'s configured capabilities in Admin > Processing Recipes.' },
            { problem: 'Capacity shows overloaded', solution: 'Too many jobs are scheduled for the available hours. Options: move jobs to another shift, extend the schedule to overtime, or re-negotiate delivery dates with customers.' },
            { problem: 'Schedule doesn\'t show on shop floor', solution: 'Make sure you clicked "Publish Schedule." Unpublished schedules are in draft mode and not visible to operators.' },
          ]},
        ],
      },
    ],
  },
]

export default manualModules
