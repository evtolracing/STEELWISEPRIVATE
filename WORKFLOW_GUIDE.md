# SteelWise ERP - Complete Workflow Guide
## Customer Purchase to Shipping

---

## Table of Contents
1. [Create Customer Order](#1-create-customer-order)
2. [Convert Order to Job](#2-convert-order-to-job)
3. [Schedule the Job](#3-schedule-the-job)
4. [Start Work (Shop Floor Execution)](#4-start-work-shop-floor-execution)
5. [Complete Operations](#5-complete-operations)
6. [Quality Control](#6-quality-control)
7. [Packaging](#7-packaging)
8. [Shipping](#8-shipping)
9. [Customer Delivery & Completion](#9-customer-delivery--completion)
10. [Quick Reference](#quick-reference)

---

## 1. CREATE CUSTOMER ORDER

### Option A: E-Commerce (Customer Self-Service)

**Step 1:** Navigate to the Shop
- URL: http://localhost:5173/shop
- Or click **Shop** in the main navigation menu

**Step 2:** Browse or Search for Products
- **Browse by Division**: Click on METALS, PLASTICS, or SUPPLIES tiles
- **Search**: Use the search bar to find specific products (e.g., "A36 plate", "304 stainless bar")
- **Filter**: Apply filters for form, family, or in-stock items

**Step 3:** Select a Product
- Click on any product card to view details
- Review specifications, pricing, and availability

**Step 4:** Configure Product (if applicable)
- **Cut-to-Size**: Enter dimensions (thickness, width, length)
- **Quantity**: Specify how many pieces needed
- **Processing**: Add operations like cutting, drilling, bending
- **Tolerance**: Select standard or precision tolerances

**Step 5:** Add to Cart
- Click **Add to Cart** button
- System displays confirmation
- Continue shopping or proceed to cart

**Step 6:** Review Cart
- Click **Cart** icon or navigate to `/shop/cart`
- Review all items, quantities, and prices
- Adjust quantities using +/- buttons
- Remove items if needed
- View subtotal and estimated costs

**Step 7:** Proceed to Checkout
- Click **Proceed to Checkout** button
- System validates cart items

**Step 8:** Complete Checkout Form
- **Contact Information**:
  - Name
  - Email
  - Phone
- **Shipping Address**:
  - Street address
  - City, State, ZIP
- **Delivery Preferences**:
  - Requested delivery date
  - Special instructions
- **Purchase Order** (optional):
  - Enter PO number for reference

**Step 9:** Review and Submit
- Review order summary
- Check shipping promise evaluation
- Review pricing and terms
- Click **Submit Order** or **Request Quote** (if pricing review needed)

**Step 10:** Confirmation
- System generates **Order Number** (e.g., ORD-2026-0123)
- **SAVE THIS ORDER NUMBER** for tracking
- Confirmation email sent
- Order appears in "My Orders"

---

### Option B: POS (Internal Sales)

**Step 1:** Navigate to POS Page
- Click **POS** in the sidebar menu
- Or navigate to `/pos`

**Step 2:** Select Customer
- **Existing Customer**: Search by name or account number
- **Walk-in Customer**: Select "Walk-in" or "Cash Sale"
- **New Customer**: Click "Add Customer" if needed

**Step 3:** Add Products
- **Search**: Type product name, SKU, or description
- **Scan Barcode**: Use barcode scanner if available
- **Browse Catalog**: Navigate categories

**Step 4:** Configure Each Item
- Select product from search results
- Configure:
  - Dimensions (if cut-to-size)
  - Quantity
  - Processing requirements
  - Pricing level (retail, contract, custom)

**Step 5:** Add to Order
- Click **Add to Order**
- Item appears in order list on right side
- Subtotal updates automatically

**Step 6:** Apply Discounts (if applicable)
- Click "Apply Discount" button
- Enter discount percentage or amount
- Requires manager approval for high discounts

**Step 7:** Select Payment Method
- Cash
- Credit Card
- Check
- Account Billing (for account customers)
- Split payment (if needed)

**Step 8:** Review and Place Order
- Verify all items and quantities
- Check pricing
- Click **Place Order**
- System generates **Order Number**
- Print receipt if needed

---

## 2. CONVERT ORDER TO JOB

**Step 1:** Navigate to Orders Page
- Click **Orders** in the sidebar menu
- Or navigate to `/orders`

**Step 2:** Find Your Order
- **Search**: Use order number in search box
- **Filter**: Filter by date, status, or customer
- **Sort**: Sort by date, amount, or status

**Step 3:** Open Order Details
- Click on the order row or order number link
- Order detail page displays:
  - Customer information
  - Line items with specifications
  - Pricing and totals
  - Status and timeline

**Step 4:** Review Order for Job Creation
- Verify all items are correct
- Check if items require manufacturing/processing
- Note any special instructions

**Step 5:** Convert to Job
- Click **Convert to Job** button (top right)
- System displays conversion dialog:
  - Job priority (Standard, Rush, Critical)
  - Target completion date
  - Special instructions
  - Work center assignments (auto-suggested)

**Step 6:** Configure Job Settings (optional)
- **Priority**: Select urgency level
- **Due Date**: Confirm or adjust
- **Instructions**: Add shop floor notes
- **BOM**: Review bill of materials

**Step 7:** Confirm Conversion
- Click **Create Job**
- System creates job with:
  - Unique **Job Number** (e.g., J-2026-0001)
  - All order line items as job operations
  - Material requirements
  - Estimated time and costs

**Step 8:** Job Created Confirmation
- **SAVE THE JOB NUMBER** for tracking
- Job status: **PENDING** or **READY_TO_SCHEDULE**
- Job appears in job list and scheduling queue
- Original order linked to job

---

## 3. SCHEDULE THE JOB

**Step 1:** Navigate to Scheduling
- Click **Shop Floor** → **Scheduling** in sidebar
- Or navigate to `/shop-floor/scheduling`

**Step 2:** View Scheduling Interface
- **Timeline View**: Visual calendar showing work center capacity
- **List View**: Table of unscheduled and scheduled jobs
- **Capacity Bars**: Color-coded by work center utilization

**Step 3:** Find Your Job
- Look in **Unscheduled Jobs** section
- Use search or filter by job number
- Job card shows:
  - Job number
  - Customer name
  - Priority
  - Estimated time
  - Required work centers

**Step 4:** Select Work Center
- Review required operations (e.g., Saw, Brake, Laser, Drill)
- Check work center availability
- Look for capacity conflicts (red = overbooked)

**Step 5:** Schedule Job (Drag & Drop Method)
- **Drag** job card from unscheduled list
- **Drop** onto timeline at desired date/time
- System shows:
  - Capacity impact
  - Conflicts or warnings
  - Predecessor/successor jobs

**Step 6:** Schedule Job (Form Method)
- Click **Schedule** button on job card
- Form displays:
  - **Work Center**: Select from dropdown
  - **Start Date**: Pick date from calendar
  - **Start Time**: Select time slot
  - **Operator**: Assign if available
  - **Duration**: Estimated (auto-calculated)

**Step 7:** Review Schedule Impact
- System shows:
  - Work center utilization change
  - Any scheduling conflicts
  - Material availability status
  - Operator availability

**Step 8:** Confirm Schedule
- Click **Confirm Schedule** or **Save**
- Job status changes to **SCHEDULED**
- Job appears on shop floor schedule
- Operators notified (if notifications enabled)

**Step 9:** Print Work Orders (optional)
- Click **Print Work Order**
- Includes:
  - Job specifications
  - Operation instructions
  - Material requirements
  - Quality checkpoints

---

## 4. START WORK (Shop Floor Execution)

**Step 1:** Navigate to Shop Floor
- Click **Shop Floor** → **Active Jobs**
- Or navigate to `/shop-floor`

**Step 2:** View Available Jobs
- Jobs display by:
  - Priority (color-coded)
  - Due date
  - Work center
  - Scheduled start time

**Step 3:** Select Your Job
- Find job by number or customer
- Click on job card to open details
- Verify it's the correct job

**Step 4:** Review Job Details
- **Specifications**: Dimensions, material, grade
- **Operations**: List of required steps
- **Drawings**: Technical drawings (if available)
- **Materials**: BOM with location codes
- **Instructions**: Special notes from planning

**Step 5:** Verify Materials Available
- Check material availability status
- If materials needed:
  - Click **Request Materials**
  - Warehouse receives pull request
  - Wait for materials delivery to work center

**Step 6:** Clock In / Start Job
- Click **Start Work** or **Clock In** button
- System records:
  - Operator name (auto from login)
  - Start timestamp
  - Work center location
- Job status changes to **IN_PROGRESS**

**Step 7:** Work Center Display
- Operator sees:
  - Current operation details
  - Progress indicator
  - Time elapsed
  - Next operation preview
  - Safety warnings (if applicable)

**Step 8:** Perform First Operation
- Follow work instructions
- Use equipment as specified
- Follow safety protocols

**Step 9:** Record Progress
- **Time Tracking**: System auto-tracks time
- **Material Usage**: Scan or enter material used
- **Issues**: Report any problems or defects
- **Photos**: Attach photos for documentation

**Step 10:** Pause Work (if needed)
- Click **Pause** or **Break**
- Select reason (lunch, meeting, material wait, etc.)
- System pauses time tracking
- Resume with **Resume Work** button

---

## 5. COMPLETE OPERATIONS

### For Each Operation in the Job:

**Step 1:** View Operation List
- Job card shows all operations:
  - ✓ Completed (green checkmark)
  - → In Progress (blue arrow)
  - ○ Pending (gray circle)

**Step 2:** Start Specific Operation
- Click on operation (e.g., "Saw to Length")
- Click **Start Operation** button
- Timer begins for this operation

**Step 3:** View Operation Instructions
- Detailed specs display:
  - Equipment to use
  - Settings (speed, feed, etc.)
  - Dimensions and tolerances
  - Quality checkpoints
  - Safety requirements

**Step 4:** Perform the Work
- Follow instructions precisely
- Use correct tooling
- Verify measurements
- Follow quality standards

**Step 5:** Record Operation Details
- **Actual Time**: Auto-tracked, can be adjusted
- **Materials Used**: Scan barcodes or enter manually
  - Material type
  - Quantity consumed
  - Scrap generated
- **Equipment Used**: Record machine/tool ID
- **Settings**: Record actual settings used

**Step 6:** Quality Checks (In-Process)
- Measure critical dimensions
- Enter measurements in system
- System checks against tolerances
- Flag if out-of-spec

**Step 7:** Document Issues
- If problems occur:
  - Click **Report Issue**
  - Select issue type (material defect, equipment, etc.)
  - Add description and photos
  - System notifies supervisor

**Step 8:** Complete Operation
- Click **Complete Operation**
- System prompts:
  - Confirm all work done correctly
  - Any rework needed?
  - Ready for next operation?
- Operation status → **COMPLETED**

**Step 9:** Move to Next Operation
- System automatically advances to next operation
- Repeat steps 2-8 for each operation

**Step 10:** Complete Final Operation
- After last operation completed
- Click **Complete Job** button
- System prompts final confirmation:
  - All operations complete?
  - Quality requirements met?
  - Ready for QC inspection?

### Complete Job

**Step 11:** Final Job Completion
- Click **Complete Job** or **Ready for QC**
- System records:
  - Completion timestamp
  - Total time (all operations)
  - Materials consumed
  - Scrap generated
  - Operator notes
- Job status changes to **COMPLETED** or **READY_FOR_QC**

**Step 12:** Clock Out
- Click **Clock Out** button
- Review time summary
- Confirm hours
- Job moves to next stage (QC or packaging)

---

## 6. QUALITY CONTROL

**Step 1:** Navigate to QA/QC
- Click **QA/QC** → **Inspection Station**
- Or navigate to `/qa/inspection`

**Step 2:** View Pending Inspections
- List shows jobs **READY_FOR_QC**
- Sort by:
  - Priority
  - Due date
  - Customer
  - Work center

**Step 3:** Select Job for Inspection
- Click on job to inspect
- System displays:
  - Job specifications
  - Quality requirements
  - Inspection checklist
  - Previous inspection history (if rework)

**Step 4:** Review Quality Plan
- Inspection points defined:
  - Dimensional checks
  - Visual inspection criteria
  - Material verification
  - Surface finish requirements
  - Functional tests (if applicable)

**Step 5:** Perform Dimensional Inspections
- **Measure Critical Dimensions**:
  - Length, width, thickness
  - Hole locations and sizes
  - Angles and bends
  - Edge quality
- **Record Measurements**:
  - Enter actual measurements
  - System compares to specifications
  - Auto-flags out-of-tolerance

**Step 6:** Visual Inspection
- Check for:
  - Surface defects (scratches, dents)
  - Finish quality
  - Sharp edges or burrs
  - Cleanliness
  - Proper markings/labels
- **Document Findings**:
  - Take photos of any issues
  - Mark locations on drawings
  - Add inspection notes

**Step 7:** Material Verification
- Verify correct material used:
  - Grade/alloy
  - Heat number (if required)
  - Certifications (MTRs)
  - Traceability codes
- **Scan or Enter**:
  - Heat lot numbers
  - Material cert numbers

**Step 8:** Functional Tests (if required)
- Perform any required tests:
  - Fit checks
  - Load tests
  - Pressure tests
  - Coating thickness
- Record test results

**Step 9:** Complete Inspection Report
- System summarizes:
  - All measurements
  - Pass/fail status per checkpoint
  - Overall compliance percentage
  - Inspector signature/ID

**Step 10:** Make Decision

### If PASSED:
- Click **Approve** or **Pass**
- System:
  - Updates job status to **QC_APPROVED**
  - Moves job to packaging queue
  - Notifies packaging team
  - Generates Certificate of Compliance (if required)

### If FAILED:
- Click **Reject** or **Rework Required**
- Select rejection reason:
  - Out of tolerance
  - Surface defect
  - Wrong material
  - Incomplete work
- Add detailed notes for shop floor
- System:
  - Updates job status to **REWORK**
  - Returns job to shop floor
  - Notifies supervisor and operator
  - Flags for review before restart

### If NON-CONFORMING (but acceptable):
- Click **Approve with Deviation**
- Requires:
  - Manager approval
  - Customer acceptance (for critical items)
  - Detailed justification
  - Disposition instructions

**Step 11:** Print Inspection Report (optional)
- Click **Print Report**
- Includes:
  - All measurements and photos
  - Pass/fail status
  - Inspector signature
  - Date/time stamp
- Attach to job paperwork

---

## 7. PACKAGING

**Step 1:** Navigate to Packaging
- Click **Packaging** → **Package Builder**
- Or navigate to `/packaging`

**Step 2:** View Jobs Ready for Packaging
- List shows jobs with status **QC_APPROVED**
- Filter by:
  - Customer
  - Ship date
  - Destination
  - Priority

**Step 3:** Select Job to Package
- Click on job card
- System displays:
  - Items to be packaged
  - Dimensions and weights
  - Shipping requirements
  - Customer specifications

**Step 4:** Review Packaging Requirements
- **Customer Specifications**:
  - Pallet type (wood, plastic, metal)
  - Banding/strapping requirements
  - Wrapping (shrink, stretch, etc.)
  - Marking instructions
- **Shipping Mode**:
  - Parcel (UPS, FedEx)
  - LTL (Less-than-truckload)
  - FTL (Full truckload)
  - Customer pickup

**Step 5:** System Auto-Suggests Package
- Based on:
  - Item dimensions
  - Total weight
  - Shipping mode
  - Destination
- Suggests:
  - Package type and quantity
  - Materials needed (pallets, crates, boxes)
  - Estimated costs

**Step 6:** Create Package
- Click **Create Package** or **New Package**
- Package form displays

**Step 7:** Add Items to Package
- **Scan Method**:
  - Scan job barcode
  - Scan individual item barcodes
  - System adds to package
- **Manual Method**:
  - Select items from list
  - Enter quantities
  - Click **Add to Package**

**Step 8:** Select Packaging Materials
- Choose from inventory:
  - **Pallet**: 48x40 standard, 48x48, custom
  - **Crate**: Wood, metal, plastic
  - **Box**: Standard sizes or custom
  - **Wrapping**: Shrink, stretch, foam
  - **Protection**: Corner guards, edge protectors
  - **Dunnage**: Blocking, bracing materials

**Step 9:** Build Package Physically
- Arrange items on pallet/in crate:
  - Heaviest items on bottom
  - Stable configuration
  - Weight distributed evenly
- Add protection:
  - Corner protectors
  - Edge guards
  - Separator sheets
- Secure load:
  - Strapping/banding
  - Shrink wrap or stretch film
  - Blocking and bracing

**Step 10:** Record Package Details
- **Dimensions**:
  - Length, width, height
  - Measure carefully for freight quotes
- **Weight**:
  - Place on scale
  - Enter actual weight
  - System verifies against estimate
- **Photos**:
  - Take photos of packaged load
  - All four sides and top
  - Shows proper securing

**Step 11:** Add Handling Instructions
- Select applicable warnings:
  - ⚠ Heavy Load
  - 🔺 Top Heavy
  - ⬆ This Side Up
  - ☔ Keep Dry
  - ❄ Temperature Sensitive
  - 🚫 Do Not Stack
  - 🍴 Use Forklift Only

**Step 12:** Generate Package Labels
- Click **Generate Labels**
- System creates:
  - **Package ID Barcode**: For tracking
  - **Handling Labels**: Warning symbols
  - **Count Labels**: Package 1 of 3, etc.

**Step 13:** Quality Check Package
- System runs validation:
  - Weight within tolerance (±2%)
  - All items accounted for
  - Dimensions reasonable
  - Required certifications attached
- Fix any issues flagged

**Step 14:** Complete Package
- Click **Complete Package**
- Package status → **READY_FOR_SHIPPING**
- Print documents:
  - Packing slip
  - Material certs (if required)
  - Special instructions

**Step 15:** Generate Shipping Label (if ready)
- Or wait for shipping team to create
- Click **Create Shipping Label**
- Enter carrier and service
- Print label
- Attach to package

**Step 16:** Move to Shipping Dock
- Physically move package to dock
- Scan package into dock location
- System tracks location
- Ready for carrier pickup

---

## 8. SHIPPING

### Create Shipment

**Step 1:** Navigate to Shipping
- Click **Shipping & Logistics**
- Or navigate to `/shipping`

**Step 2:** View Ready to Ship
- List shows packages status **READY_FOR_SHIPPING**
- Filter by:
  - Customer
  - Ship date (today, tomorrow, this week)
  - Destination
  - Carrier

**Step 3:** Select Items to Ship
- **Single Job**: Click on one job/package
- **Multiple Jobs**: Check boxes for multiple packages
- **Batch Shipping**: Select all for same customer/route

**Step 4:** Create New Shipment
- Click **Create Shipment** button
- Shipment form opens

**Step 5:** Enter Shipment Details

**Customer/Destination**:
- Auto-populated from order
- Verify:
  - Ship-to name and address
  - Contact person and phone
  - Special delivery instructions

**Carrier Selection**:
- Choose carrier:
  - UPS
  - FedEx
  - LTL carrier (freight)
  - Customer arranged
  - Company fleet
- System suggests based on:
  - Weight and dimensions
  - Destination
  - Service requirements
  - Cost

**Service Level**:
- Select shipping speed:
  - Ground (3-5 days)
  - 2-Day
  - Next Day
  - Freight Standard
  - Freight Expedited
- System shows:
  - Estimated delivery date
  - Cost estimate

**Step 6:** Get Rate Quote (for freight)
- If LTL/FTL shipment:
  - Click **Get Quotes**
  - System requests rates from carriers
  - Compare quotes
  - Select best option
- Enter freight class (if required)

**Step 7:** Enter Shipping Dates
- **Ship Date**: Today or future date
- **Requested Delivery Date**: Customer requirement
- **Promised Delivery Date**: Carrier commitment
- System validates against customer expectations

**Step 8:** Add Special Instructions
- **Delivery Instructions**:
  - Liftgate required?
  - Inside delivery?
  - Appointment needed?
  - Delivery hours restrictions
- **Notifications**:
  - Email tracking to customer?
  - SMS delivery alerts?
  - Call before delivery?

**Step 9:** Review Package List
- Verify all packages included
- Check:
  - Package count
  - Total weight
  - Total declared value
  - Hazmat (if applicable)

**Step 10:** Generate Shipping Documents

**Bill of Lading (BOL)**:
- Click **Generate BOL**
- Reviews and completes:
  - Shipper information (your company)
  - Consignee (customer)
  - Package details
  - Freight class and charges
  - Special instructions
- Print 3 copies:
  - Driver copy
  - Customer copy
  - Office copy

**Packing List**:
- Click **Print Packing List**
- Shows:
  - Job number and customer PO
  - Item descriptions and quantities
  - Part numbers
  - Line item references
- Attach to shipment

**Commercial Invoice** (if required):
- For international or account billing
- Includes pricing and terms

**Certificates** (if required):
- Material Test Reports (MTRs)
- Certificates of Compliance
- MSDS sheets

**Step 11:** Create Carrier Label
- If using integrated carrier:
  - Click **Generate Label**
  - System connects to carrier API
  - Downloads shipping label with tracking number
  - Print label (thermal or regular printer)
  - Affix to package
- If manual:
  - Enter tracking number manually
  - Carrier provides pre-printed label

**Step 12:** Final Shipment Review
- Verify all information correct:
  - Addresses
  - Package count
  - Weight and dimensions
  - Service level
  - All documents printed
  - Labels attached

**Step 13:** Complete Shipment
- Click **Create Shipment** or **Finalize**
- System generates **Shipment ID** (e.g., SHIP-2026-0456)
- Shipment status: **READY_TO_LOAD**

### Ship the Order

**Step 14:** Physical Loading
- Bring packages to loading dock
- Verify packages match shipment:
  - Scan package barcodes
  - Count packages
  - Check for damage
- Load onto:
  - Carrier truck (UPS, FedEx, freight)
  - Company delivery vehicle
  - Customer pickup truck

**Step 15:** Carrier Pickup/Dispatch
- **Carrier Pickup**:
  - Driver arrives at scheduled time
  - Scan all packages
  - Hand over paperwork (BOL, packing list)
  - Get driver signature
  - Take photo of loaded truck (optional)
- **Company Vehicle**:
  - Assign driver
  - Record dispatch time
  - Provide route information

**Step 16:** Mark as Shipped
- In system, click **Mark as Shipped**
- Confirm:
  - **Ship Date/Time**: Actual (auto-filled with current)
  - **Carrier**: Verify correct carrier
  - **Tracking Number**: Enter or verify
  - **Driver/Reference**: Carrier driver name or pro number

**Step 17:** System Updates
- Shipment status → **SHIPPED**
- Order status → **SHIPPED**
- Job status → **COMPLETED**
- System triggers:
  - Customer notification email with tracking
  - Accounting notification for invoicing
  - Inventory deductions

### Track Shipment

**Step 18:** Monitor Shipment
- Navigate to **Shipment Tracking**
- Find your shipment
- View real-time status updates:
  - Picked up
  - In transit
  - Out for delivery
  - Delivered
  - Exceptions (delays, weather, etc.)

**Step 19:** Customer Portal Tracking
- Customer receives email with tracking link
- Customer can view:
  - Current shipment status
  - Estimated delivery
  - Tracking history
  - Proof of delivery (after delivery)

**Step 20:** Handle Exceptions (if needed)
- If shipment delayed or has issues:
  - System alerts appear in **Freight Exceptions**
  - Review exception details
  - Contact carrier if needed
  - Update customer with revised ETA
  - Log all communications

---

## 9. CUSTOMER DELIVERY & COMPLETION

**Step 1:** Carrier Delivers
- Carrier attempts delivery to customer
- Customer receives shipment
- Customer signs for delivery (POD - Proof of Delivery)

**Step 2:** Delivery Confirmation
- **Automatic Updates** (for integrated carriers):
  - Carrier system updates delivery status
  - SteelWise receives notification
  - Status auto-updates to **DELIVERED**
  - POD image uploaded
- **Manual Updates** (for other carriers):
  - Check carrier website for delivery
  - Update status manually in system
  - Upload POD document

**Step 3:** Update Shipment Status
- Navigate to shipment record
- Click **Mark as Delivered**
- Enter:
  - Delivery date/time
  - Received by (name)
  - Upload POD signature image
  - Any delivery notes

**Step 4:** System Auto-Completion
When shipment marked delivered, system automatically:

- **Order Status** → **COMPLETED**
- **Job Status** → **DELIVERED**
- **Shipment Status** → **DELIVERED**

**Step 5:** Financial Close-Out

**Invoice Generation**:
- System auto-generates invoice
- Based on:
  - Order line items and pricing
  - Actual shipping costs
  - Any adjustments made
  - Terms and conditions
- Invoice sent to:
  - Customer email
  - Accounting system
  - ERP integration

**Payment Processing**:
- For prepaid orders: Already collected
- For account customers:
  - Invoice sent with NET terms (NET 30, etc.)
  - Tracked in AR (Accounts Receivable)
  - Payment due date calculated

**Step 6:** Customer Notifications
System sends confirmation email to customer:
- Delivery confirmation
- POD attached
- Invoice attached (or link)
- Thank you message
- Link to rate experience
- Link to reorder

**Step 7:** Quality Follow-Up (optional)
- **Customer Satisfaction Survey**:
  - Sent 1-2 days after delivery
  - Rate product quality
  - Rate delivery experience
  - Comments/feedback
- **Quality Issue Reporting**:
  - If customer reports issue:
  - Navigate to **Customer Quality** → **Claims**
  - Create quality claim record
  - Investigate and resolve

**Step 8:** Inventory Reconciliation
- System finalizes:
  - Raw material consumption
  - Finished goods depletion
  - Scrap generated
  - Inventory levels updated
- Any variances flagged for review

**Step 9:** Job Costing Finalization
- System calculates actual costs:
  - **Materials**: Actual used vs. estimated
  - **Labor**: Actual hours vs. estimated
  - **Overhead**: Applied based on actual time
  - **Shipping**: Actual freight cost
- **Job Profitability**:
  - Revenue (invoice amount)
  - Minus total costs
  - = Gross profit and margin %
- Report available in **Job Costing** → **Job Analysis**

**Step 10:** Performance Metrics Updated
System updates KPIs:
- **On-Time Delivery**: Was delivery on/before promised date?
- **Quality**: First-pass yield, defect rate
- **Cycle Time**: Order-to-delivery duration
- **Customer Satisfaction**: Survey scores
- Metrics visible on **Dashboard** and **Analytics**

**Step 11:** Archive and Close
- All documents archived:
  - Order confirmation
  - Work orders
  - Inspection reports
  - Packing lists
  - BOL and shipping documents
  - POD
  - Invoice
- Job status → **CLOSED**
- Available for historical reference and analytics

---

## QUICK REFERENCE

### Complete Workflow Path
```
SHOP
  ↓
CART
  ↓
CHECKOUT
  ↓
ORDER CONFIRMATION (save order number)
  ↓
ORDERS PAGE → Find order → CONVERT TO JOB (save job number)
  ↓
SHOP FLOOR → SCHEDULING → Schedule job to work center
  ↓
SHOP FLOOR → ACTIVE JOBS → Start work → Complete operations
  ↓
QA/QC → INSPECTION → Inspect → Approve
  ↓
PACKAGING → PACKAGE BUILDER → Create package → Generate labels
  ↓
SHIPPING → Create shipment → Generate BOL & shipping label
  ↓
SHIPPING → Mark as shipped → Enter tracking number
  ↓
SHIPMENT TRACKING → Monitor delivery
  ↓
Mark as DELIVERED → Invoice generated → Job CLOSED
```

### Key Navigation Paths

| Step | Navigation Path | URL |
|------|----------------|-----|
| **Create Order (Customer)** | Shop | `/shop` |
| **Create Order (Internal)** | POS | `/pos` |
| **View Orders** | Orders | `/orders` |
| **Convert to Job** | Orders → Order Detail | `/orders/:id` |
| **Schedule Job** | Shop Floor → Scheduling | `/shop-floor/scheduling` |
| **Start Work** | Shop Floor → Active Jobs | `/shop-floor` |
| **Quality Inspection** | QA/QC → Inspection | `/qa/inspection` |
| **Package Items** | Packaging → Package Builder | `/packaging` |
| **Create Shipment** | Shipping & Logistics | `/shipping` |
| **Track Shipment** | Shipment Tracking | `/shipment-tracking` |

### Key Status Transitions

**ORDER STATUS FLOW:**
```
DRAFT → SUBMITTED → CONFIRMED → IN_PRODUCTION → SHIPPED → DELIVERED → COMPLETED
```

**JOB STATUS FLOW:**
```
PENDING → READY_TO_SCHEDULE → SCHEDULED → IN_PROGRESS → 
COMPLETED → READY_FOR_QC → QC_APPROVED → PACKAGED → 
READY_FOR_SHIPPING → SHIPPED → DELIVERED → CLOSED
```

**SHIPMENT STATUS FLOW:**
```
DRAFT → READY_TO_SHIP → SHIPPED → IN_TRANSIT → 
OUT_FOR_DELIVERY → DELIVERED → CLOSED
```

### Quick Actions

| Action | Where to Find | Button/Feature |
|--------|---------------|----------------|
| **Create Order** | Shop or POS | Add to Cart → Checkout |
| **Convert to Job** | Order Detail page | "Convert to Job" button |
| **Schedule Job** | Scheduling page | Drag-drop or "Schedule" button |
| **Start Work** | Active Jobs | "Start Work" or "Clock In" |
| **Complete Operation** | Job Detail | "Complete Operation" button |
| **Approve QC** | QA Inspection | "Approve" or "Pass" button |
| **Create Package** | Packaging | "Create Package" button |
| **Create Shipment** | Shipping | "Create Shipment" button |
| **Mark Shipped** | Shipment Detail | "Mark as Shipped" button |
| **Mark Delivered** | Shipment Detail | "Mark as Delivered" button |

### Search & Filter Tips

- **Global Search**: Press `Ctrl+K` or `Cmd+K` to search anything
- **Job Search**: Use job number (e.g., "J-2026-0001")
- **Order Search**: Use order number (e.g., "ORD-2026-0123")
- **Customer Search**: Type customer name in any search box
- **Date Filters**: Use "Today", "This Week", or custom date range
- **Status Filters**: Filter lists by status (Pending, In Progress, etc.)

### Common Shortcuts

- **Dashboard**: Home icon or logo click
- **Quick Add Order**: POS page
- **Active Jobs**: Shop Floor main view
- **Today's Schedule**: Shop Floor → Scheduling → "Today" button
- **Recent Orders**: Orders page, default sorted by date
- **Exceptions**: Red alert badges in navigation

### Demo Mode Features

When demo banner is visible:
- **Auto-complete**: Forms auto-fill with sample data
- **Time Travel**: Simulate different dates/times
- **Sample Data**: Pre-loaded customers, products, jobs
- **Reset**: Refresh page to reset demo data

### Reporting & Analytics

| Report Type | Location | Purpose |
|-------------|----------|---------|
| **Order Reports** | Orders → Reports | Sales analysis, order history |
| **Job Costing** | Jobs → Job Analysis | Profitability by job |
| **Shop Floor Metrics** | Shop Floor → Reports | Utilization, efficiency, OEE |
| **Quality Reports** | QA/QC → Reports | Defect rates, inspection results |
| **Shipping Reports** | Shipping → Reports | On-time delivery, freight costs |
| **Customer Reports** | Customers → Reports | Customer activity, satisfaction |
| **Dashboard** | Home | Real-time KPIs and metrics |

### Important Numbers to Track

1. **Order Number** (e.g., ORD-2026-0123): Created at checkout
2. **Job Number** (e.g., J-2026-0001): Created when order converted to job
3. **Package ID**: Generated when package created
4. **Shipment ID** (e.g., SHIP-2026-0456): Created when shipment finalized
5. **Tracking Number**: Provided by carrier
6. **Invoice Number**: Auto-generated at delivery

### Troubleshooting Common Issues

**Issue**: Can't find my order
- Solution: Use order number in global search, or check Orders page with date filter

**Issue**: Job won't schedule
- Solution: Check work center capacity, material availability, and prerequisites

**Issue**: Can't complete operation
- Solution: Verify all required fields filled, check for quality holds

**Issue**: QC failing items
- Solution: Review rejection reason, return to shop floor for rework

**Issue**: Shipment won't create
- Solution: Verify package completed, address valid, carrier selected

**Issue**: Tracking number not working
- Solution: Allow 1-2 hours for carrier system to update, verify number correct

### Getting Help

- **AI Assistant**: Click robot icon or press `Ctrl+Shift+A`
  - Ask: "What's the status of job J-2026-0001?"
  - Ask: "How do I schedule a job?"
  - Ask: "Show me today's shipments"

- **Tooltips**: Hover over ? icons for field help

- **Documentation**: Click Help icon in navigation

- **Support**: Contact system administrator or support team

---

## TESTING THE COMPLETE FLOW

### Quick Test Scenario

Follow these steps to test the entire workflow:

1. **Create Test Order** (5 min)
   - Go to Shop
   - Add 1-2 simple products
   - Checkout with test customer
   - Note order number

2. **Convert to Job** (2 min)
   - Go to Orders
   - Find your order
   - Click "Convert to Job"
   - Note job number

3. **Schedule** (3 min)
   - Go to Shop Floor → Scheduling
   - Find your job
   - Schedule to today, any work center
   - Confirm

4. **Start and Complete Work** (5 min)
   - Go to Shop Floor → Active Jobs
   - Find your job
   - Click "Start Work"
   - Complete each operation quickly
   - Click "Complete Job"

5. **QC Inspection** (3 min)
   - Go to QA/QC → Inspection
   - Find your job
   - Enter measurements (use default values)
   - Click "Approve"

6. **Package** (3 min)
   - Go to Packaging
   - Find your job
   - Click "Create Package"
   - Enter weight and dimensions
   - Complete package

7. **Ship** (4 min)
   - Go to Shipping
   - Find your package
   - Click "Create Shipment"
   - Select carrier and service
   - Generate documents
   - Mark as Shipped

8. **Deliver** (1 min)
   - In Shipment Tracking
   - Find your shipment
   - Click "Mark as Delivered"
   - Enter delivery date

**Total Time**: ~25-30 minutes for complete flow

### Validation Checks

After completing test flow, verify:

- ✓ Order status = COMPLETED
- ✓ Job status = CLOSED
- ✓ Invoice generated
- ✓ Inventory updated
- ✓ Dashboard metrics updated
- ✓ All documents available for download

---

## CONCLUSION

This guide covers the complete end-to-end workflow from customer purchase through delivery and completion. Each step builds on the previous one, creating a seamless flow of information and materials through your operation.

**Key Success Factors:**
- Accurate data entry at each stage
- Timely status updates
- Quality checks at key milestones
- Clear communication between departments
- Proper documentation throughout

**Benefits of Following This Workflow:**
- Complete traceability from order to delivery
- Real-time visibility for customers and internal teams
- Accurate job costing and profitability analysis
- Quality assurance at every step
- Efficient resource utilization
- Improved on-time delivery performance

For questions or additional training, contact your system administrator.

---

**Document Version**: 1.0  
**Last Updated**: February 8, 2026  
**SteelWise ERP Platform**
