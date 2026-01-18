# Phase 1: Module Definition & Job Lifecycle

**Document Version:** 1.0  
**Date:** January 17, 2026  
**Status:** Architecture Specification

---

## 1. MODULE BLUEPRINT TABLE

### 1.1 Order Intake / POS

**Goals:**
- Capture customer orders with complete specifications
- Quick quote generation for standard items
- Contract pricing lookup and enforcement
- Real-time inventory availability check
- Generate job tickets automatically

**Inputs:**
- Customer ID, contact information
- Material specifications (grade, dimensions, tolerances)
- Processing requirements (cutting, slitting, grinding, etc.)
- Quantity and required delivery date
- Special instructions/drawings

**Outputs:**
- Job Order (unique ID)
- Quote/Order confirmation
- Material requirements for procurement
- Expected delivery date
- Job routing instructions

**Primary User Personas:**
- Sales Representative
- Customer Service Rep
- Inside Sales Manager

**Integration Points:**
- Customer Master Data
- Product Catalog
- Inventory Module (availability check)
- Pricing Engine
- Scheduling Module (capacity check)
- Billing Module (create invoice shell)

**Failure Modes:**
- Unavailable material/capacity → redirect to quote workflow
- Invalid specifications → validation failure, require correction
- Pricing error → escalate to pricing manager
- Duplicate order detection → merge or override decision

**KPIs:**
- Order entry time (target: <5 min for standard orders)
- Quote-to-order conversion rate
- Order accuracy rate (>99%)
- Same-day order acknowledgment rate (>95%)

---

### 1.2 Receiving

**Goals:**
- Verify incoming material matches PO/supplier documentation
- Capture heat numbers, dimensions, certifications
- Assign storage location
- Update inventory in real-time
- Trigger quality inspection if required

**Inputs:**
- Purchase Order or supplier advance ship notice
- Material delivery (coils, plates, bars, etc.)
- Mill test reports (MTRs)
- Physical measurements

**Outputs:**
- Receipt confirmation
- Inventory records (location, quantity, heat/lot)
- Discrepancy reports (if any)
- Quality inspection work order (if needed)
- Material available-to-promise update

**Primary User Personas:**
- Receiving Clerk
- Warehouse Supervisor
- QC Inspector

**Integration Points:**
- Purchase Order system
- Inventory Module (add to stock)
- QAQC Module (inspection requests)
- Traceability Module (heat tracking)
- Supplier data

**Failure Modes:**
- Quantity/quality mismatch → reject or partial receive
- Missing MTR → quarantine until documentation received
- Damaged material → reject and return
- Wrong material delivered → supplier coordination

**KPIs:**
- Receipt accuracy (>99.5%)
- Average receiving time per line item (<15 min)
- Documentation compliance (100% MTR capture)
- Same-day inventory update rate (>98%)

---

### 1.3 Processing Workflows

**Goals:**
- Execute cutting, slitting, grinding, edge conditioning
- Track material transformation (parent to child)
- Record actual vs planned yields
- Capture scrap and offal
- Maintain full traceability

**Inputs:**
- Job work order with routing
- Material location and ID
- Processing parameters (cut list, tolerances)
- Equipment assignment

**Outputs:**
- Processed material (finished goods)
- Actual processing time and yield
- Scrap records
- Quality measurements
- Updated job status

**Primary User Personas:**
- Machine Operator
- Shop Floor Supervisor
- Setup Technician

**Integration Points:**
- Work Order Module
- Inventory Module (consume raw, produce finished)
- QAQC Module (in-process checks)
- Equipment/maintenance system
- Traceability Module

**Failure Modes:**
- Equipment breakdown → reschedule to alternate machine
- Quality failure → rework or scrap decision
- Wrong setup → restart with correct parameters
- Yield shortage → material substitution or partial ship

**KPIs:**
- First-pass yield (target: >92%)
- Setup time vs run time ratio
- On-time processing completion (>95%)
- Scrap rate by operation (<5%)
- Equipment utilization (>75%)

---

### 1.4 Scheduling & Capacity

**Goals:**
- Sequence jobs to maximize throughput
- Balance load across work centers
- Respect due dates and priorities
- Minimize setup changes
- Provide realistic delivery commitments

**Inputs:**
- Active job orders with requirements
- Work center capacities and availability
- Current WIP status
- Material availability
- Priority/rush flags

**Outputs:**
- Daily/weekly production schedule
- Work center load report
- Expected completion dates per job
- Capacity alerts (overload/underutilization)

**Primary User Personas:**
- Production Scheduler
- Operations Manager
- Shop Floor Supervisor

**Integration Points:**
- Order Intake (promise dates)
- Inventory Module (material availability)
- Shop Floor Execution (actual progress)
- Equipment calendar (maintenance windows)

**Failure Modes:**
- Capacity overload → defer non-critical jobs or expedite material
- Rush order disruption → dynamic rescheduling
- Material shortage → defer until available
- Equipment unavailable → reallocate to alternate resource

**KPIs:**
- Schedule adherence (>90%)
- Due date performance (>95% on-time)
- Average lead time (target: 2-3 days)
- Schedule changes per day (<5)
- Capacity utilization variance (<10%)

---

### 1.5 Shop Floor Execution

**Goals:**
- Real-time job tracking and status updates
- Labor and machine time capture
- Quantity completion reporting
- Issue/exception logging
- Digital work instructions display

**Inputs:**
- Work order/routing
- Material barcode/RFID
- Operator ID
- Equipment assignment

**Outputs:**
- Labor hours by job/operation
- Quantity completed
- Status updates (started, paused, completed)
- Exception events
- Equipment run-time data

**Primary User Personas:**
- Machine Operator
- Shop Floor Supervisor
- Production Manager

**Integration Points:**
- Scheduling Module (pull next job)
- Processing Workflows (execution data)
- Inventory Module (transaction posting)
- Payroll/time tracking
- Equipment monitoring

**Failure Modes:**
- Incorrect job clocked → supervisor correction
- Missed clock-in/out → reconstruct from production logs
- System downtime → paper backup, later reconciliation
- Quality hold → pause job, route to QAQC

**KPIs:**
- Real-time data capture rate (>95%)
- Average delay between event and system update (<5 min)
- Exception resolution time
- Operator efficiency (actual vs standard hours)

---

### 1.6 Packaging

**Goals:**
- Protect material for shipment
- Label with traceability info and customer markings
- Bundle to optimize shipping
- Generate packing list and shipping docs
- Final quality/count verification

**Inputs:**
- Completed job material
- Customer packaging requirements
- Shipping method
- Labels/markings specifications

**Outputs:**
- Packaged units (skids, bundles, boxes)
- Packing list
- Shipping labels
- Weight and dimensions
- Final inventory transaction

**Primary User Personas:**
- Packaging/Shipping Clerk
- Warehouse Worker
- Shipping Supervisor

**Integration Points:**
- Shop Floor Execution (completion trigger)
- Shipping Module (readiness notification)
- Inventory Module (move to finished goods)
- Label/document printing
- Billing Module (pack confirmation)

**Failure Modes:**
- Incorrect count → recount and adjust
- Packaging damage → repackage
- Missing documentation → delay until resolved
- Wrong labeling → relabel before ship

**KPIs:**
- Packaging accuracy (>99.5%)
- Average packaging time per job (<30 min)
- Packaging damage rate (<0.5%)
- Same-day packaging for completed jobs (>90%)

---

### 1.7 Shipping & Delivery

**Goals:**
- Coordinate carrier pickup/delivery
- Load verification
- Generate shipping documents (BOL, etc.)
- Track shipment status
- Customer notification

**Inputs:**
- Packaged material ready to ship
- Customer delivery requirements
- Carrier information
- Shipping address

**Outputs:**
- Bill of Lading (BOL)
- Shipment tracking number
- Proof of delivery (later)
- Customer shipment notification
- Freight cost data

**Primary User Personas:**
- Shipping Coordinator
- Dock Worker
- Logistics Manager

**Integration Points:**
- Packaging Module (shipment readiness)
- Carrier systems (scheduling, tracking)
- Customer portal (shipment notification)
- Billing Module (trigger invoicing)
- Inventory Module (final depletion)

**Failure Modes:**
- Carrier no-show → reschedule or find backup
- Load rejection (overweight, improper loading) → repackage
- Wrong shipment → recall and correct
- Delivery failure → customer coordination, redelivery

**KPIs:**
- On-time pickup rate (>95%)
- Shipping accuracy (>99.5%)
- Average dock-to-ship time (<4 hours)
- Customer notification within 1 hour of ship
- Freight claims rate (<0.5%)

---

### 1.8 Inventory Movement

**Goals:**
- Real-time inventory accuracy
- Material location tracking
- Cycle counting and reconciliation
- Min/max replenishment triggers
- FIFO/FEFO enforcement

**Inputs:**
- Physical counts
- Transaction records (receipt, issue, adjustment)
- Material movements (location changes)
- Scrap/return transactions

**Outputs:**
- Current inventory positions by location
- Inventory valuation
- Discrepancy reports
- Replenishment orders
- Inventory age analysis

**Primary User Personas:**
- Warehouse Clerk
- Inventory Controller
- Warehouse Supervisor

**Integration Points:**
- Receiving Module (add inventory)
- Processing Workflows (consume/produce)
- Shipping Module (deplete inventory)
- Purchasing (replenishment triggers)
- Financial system (valuation)

**Failure Modes:**
- Inventory mismatch → cycle count and adjust
- Lost material → physical search, write-off if not found
- Location error → relocate and correct records
- Negative inventory → investigate and correct root cause

**KPIs:**
- Inventory accuracy (>98%)
- Cycle count completion rate (100%)
- Average inventory turns (target: 6-8x/year)
- Stock-out incidents (<2% of orders)
- Inventory adjustment rate (<2% of transactions)

---

### 1.9 Billing Trigger + Completion

**Goals:**
- Automatic invoice generation upon shipment
- Contract pricing enforcement
- Accurate quantity and service billing
- Freight and surcharge calculation
- Payment tracking

**Inputs:**
- Shipment confirmation
- Job completion data (quantities, services)
- Customer contract terms
- Pricing data
- Freight costs

**Outputs:**
- Customer invoice
- Revenue recognition entry
- Accounts receivable record
- Payment tracking
- Billing exception reports

**Primary User Personas:**
- Billing Clerk
- Accounts Receivable Specialist
- Finance Manager

**Integration Points:**
- Shipping Module (invoice trigger)
- Order Intake (original pricing)
- Financial system (GL posting)
- Payment processing
- Customer portal (invoice delivery)

**Failure Modes:**
- Pricing error → hold invoice, correct and reissue
- Missing data → delay until complete
- Customer dispute → credit memo or adjustment
- System integration failure → manual invoice creation

**KPIs:**
- Invoice accuracy (>99%)
- Same-day invoicing after shipment (>95%)
- Days sales outstanding (DSO) (target: <45 days)
- Billing error rate (<1%)
- Automated invoice rate (>90%)

---

### 1.10 Customer Status Visibility (Basic)

**Goals:**
- Self-service order status lookup
- Shipment tracking
- Document access (invoices, MTRs, BOLs)
- Delivery confirmation
- Basic communication channel

**Inputs:**
- Order number or customer credentials
- System job status data
- Shipment tracking data
- Document repository

**Outputs:**
- Order status display (web/mobile)
- Tracking information
- Downloadable documents
- Email notifications
- Status change alerts

**Primary User Personas:**
- Customer (external)
- Customer Service Rep (internal support)

**Integration Points:**
- Order Intake (order details)
- Shop Floor Execution (progress updates)
- Shipping Module (tracking info)
- Billing Module (invoice access)
- Document management system

**Failure Modes:**
- Stale data → delay in update visibility
- Login issues → password reset workflow
- Missing documents → manual upload by CSR
- Wrong customer sees data → security breach, immediate fix

**KPIs:**
- Portal uptime (>99%)
- Data freshness (<15 min delay)
- Customer portal adoption rate (target: >60%)
- Support ticket reduction (target: -30%)
- Document availability (>98%)

---

## 2. INTER-MODULE DEPENDENCY DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CORE DATA LAYER                                │
│  • Customer Master  • Product Catalog  • Material Inventory             │
│  • Pricing Rules    • Equipment/Resources  • Traceability Records       │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │
┌───────────────────────────────────┴─────────────────────────────────────┐
│
├─► ORDER INTAKE / POS
│   │
│   ├─► Check Inventory ────────────────────► INVENTORY MOVEMENT
│   ├─► Check Capacity ─────────────────────► SCHEDULING & CAPACITY
│   ├─► Price Lookup ───────────────────────► BILLING TRIGGER
│   └─► Create Job ─────────────────────────► SHOP FLOOR EXECUTION
│
├─► RECEIVING
│   │
│   ├─► Add to Inventory ───────────────────► INVENTORY MOVEMENT
│   ├─► Request QC ─────────────────────────► QAQC MODULE (external)
│   └─► Update Availability ────────────────► SCHEDULING & CAPACITY
│
├─► SCHEDULING & CAPACITY
│   │
│   ├─► Promise Dates ──────────────────────► ORDER INTAKE
│   ├─► Material Requirements ──────────────► INVENTORY MOVEMENT
│   ├─► Release Work Orders ────────────────► SHOP FLOOR EXECUTION
│   └─► Load Balancing ─────────────────────► PROCESSING WORKFLOWS
│
├─► SHOP FLOOR EXECUTION
│   │
│   ├─► Status Updates ─────────────────────► CUSTOMER STATUS VISIBILITY
│   ├─► Completion Signal ──────────────────► PACKAGING
│   ├─► Consume Materials ──────────────────► INVENTORY MOVEMENT
│   ├─► Quality Checks ─────────────────────► QAQC MODULE (external)
│   └─► Actual Times/Yields ────────────────► SCHEDULING & CAPACITY
│
├─► PROCESSING WORKFLOWS
│   │
│   ├─► Material Transformations ───────────► INVENTORY MOVEMENT
│   ├─► Scrap Reporting ────────────────────► INVENTORY MOVEMENT
│   ├─► Traceability Links ─────────────────► TRACEABILITY MODULE
│   └─► Job Progress ───────────────────────► SHOP FLOOR EXECUTION
│
├─► PACKAGING
│   │
│   ├─► Pack Confirmation ──────────────────► SHIPPING & DELIVERY
│   ├─► Move to FG Inventory ───────────────► INVENTORY MOVEMENT
│   └─► Ready to Bill Signal ───────────────► BILLING TRIGGER
│
├─► SHIPPING & DELIVERY
│   │
│   ├─► Trigger Invoice ────────────────────► BILLING TRIGGER + COMPLETION
│   ├─► Deplete Inventory ──────────────────► INVENTORY MOVEMENT
│   ├─► Tracking Info ──────────────────────► CUSTOMER STATUS VISIBILITY
│   └─► Delivery Confirmation ──────────────► BILLING TRIGGER
│
├─► INVENTORY MOVEMENT
│   │
│   ├─► Availability Data ──────────────────► ORDER INTAKE
│   ├─► Material Locations ─────────────────► SCHEDULING & CAPACITY
│   ├─► Stock Levels ───────────────────────► PURCHASING (external)
│   └─► Valuation Data ─────────────────────► BILLING / FINANCE
│
├─► BILLING TRIGGER + COMPLETION
│   │
│   ├─► Invoice Generated ──────────────────► CUSTOMER STATUS VISIBILITY
│   ├─► Payment Status ─────────────────────► FINANCE SYSTEM (external)
│   └─► Revenue Recognition ────────────────► ERP INTEGRATION
│
└─► CUSTOMER STATUS VISIBILITY
    │
    ├─► Status Queries ─────────────────────► All Modules (read-only)
    └─── Document Requests ─────────────────► Document Repository

```

### 2.1 Critical Path Dependencies

**Must Have Before:**
- **Order Intake** requires: Customer Master, Product Catalog, Pricing
- **Scheduling** requires: Orders, Inventory, Equipment availability
- **Shop Floor Execution** requires: Schedule, Material available
- **Shipping** requires: Packaging complete
- **Billing** requires: Ship confirmation

**Real-Time Sync Required:**
- Inventory Movement ↔ All modules consuming/producing material
- Shop Floor Execution → Scheduling (actual progress)
- Shipping → Billing (invoice trigger)

---

## 3. JOB LIFECYCLE STATE MACHINE

### 3.1 Core States

```
┌──────────┐
│ ORDERED  │ ← Initial state upon order entry
└────┬─────┘
     │ Material arrives + allocated
     ▼
┌──────────┐
│ RECEIVED │ ← Material physically available
└────┬─────┘
     │ Scheduled + released to floor
     ▼
┌───────────┐
│ SCHEDULED │ ← On production schedule
└────┬──────┘
     │ Work started by operator
     ▼
┌─────────────┐
│ IN_PROCESS  │ ← Active processing
└────┬────────┘
     │ Processing complete
     ▼
┌─────────────┐     ┌──────────────┐
│ WAITING_QC  │────►│   (QC Pass)  │
└────┬────────┘     └──────────────┘
     │ QC approved OR no QC required
     ▼
┌───────────┐
│ PACKAGING │ ← Material being prepared for ship
└────┬──────┘
     │ Packaging complete
     ▼
┌────────────────┐
│ READY_TO_SHIP  │ ← Staged for pickup
└────┬───────────┘
     │ Loaded on truck
     ▼
┌──────────┐
│ SHIPPED  │ ← In transit to customer
└────┬─────┘
     │ Delivery confirmed
     ▼
┌───────────┐
│ COMPLETED │ ← Job fulfilled
└────┬──────┘
     │ Invoice generated + paid
     ▼
┌──────────┐
│  BILLED  │ ← Final financial state
└──────────┘
```

### 3.2 Transition Rules

| From State      | To State         | Trigger                              | Required Conditions                           | Actor              | Automatic? |
|-----------------|------------------|--------------------------------------|-----------------------------------------------|--------------------|------------|
| ORDERED         | RECEIVED         | Receipt confirmation                 | Material received, heat #s captured, PO match| Receiving Clerk    | No         |
| RECEIVED        | SCHEDULED        | Scheduler assigns to work center     | Material available, capacity exists           | Scheduler          | No         |
| SCHEDULED       | IN_PROCESS       | Operator starts job                  | Material at machine, setup complete           | Operator           | No         |
| IN_PROCESS      | WAITING_QC       | QC hold flag OR first article check  | Processing complete, QC required per routing  | Operator/System    | Conditional|
| IN_PROCESS      | PACKAGING        | Job complete, no QC required         | All operations done, yield acceptable         | Operator           | No         |
| WAITING_QC      | PACKAGING        | QC approval                          | Inspection pass, release to ship              | QC Inspector       | No         |
| WAITING_QC      | IN_PROCESS       | QC rejection → rework                | Failure identified, rework instructions issued| QC Inspector       | No         |
| PACKAGING       | READY_TO_SHIP    | Packaging complete                   | Labeled, staged, packing list generated       | Packaging Clerk    | No         |
| READY_TO_SHIP   | SHIPPED          | BOL signed, truck departs            | Carrier confirmed, load verified              | Shipping Clerk     | No         |
| SHIPPED         | COMPLETED        | Delivery confirmed                   | POD received OR tracking shows delivered      | System/Carrier API | Yes        |
| COMPLETED       | BILLED           | Invoice sent                         | Invoice generated and transmitted to customer | Billing System     | Yes        |

### 3.3 Exception Paths

#### 3.3.1 REWORK Path
```
IN_PROCESS ──[Quality Fail]──► WAITING_QC ──[Rework Decision]──► IN_PROCESS
                                     │
                                     └──[Scrap Decision]──► CANCELLED/SCRAPPED
```
**Rules:**
- Rework requires supervisor approval
- New routing operations appended to job
- Original material ID retained, child IDs for split scenarios
- Yield adjustment recorded

#### 3.3.2 SPLIT Job Path
```
IN_PROCESS ──[Partial Complete]──► Create Child Jobs
     │                                     │
     │                                     ├─► Job A (Partial) → continues
     │                                     └─► Job B (Remainder) → SCHEDULED or RECEIVED
     └──────────────────────────────────────────► Both track to parent order
```
**Rules:**
- Original job ID becomes parent
- Child jobs inherit specs but have unique IDs
- Each child follows full lifecycle independently
- Parent order status = "Partially Complete" until all children BILLED

#### 3.3.3 PARTIAL Shipment Path
```
PACKAGING ──[Split Ship]──► Child Job 1 → READY_TO_SHIP → SHIPPED → BILLED
     │                            └─► Child Job 2 → READY_TO_SHIP (later date)
     │
     └──► Parent Order Status = "Partially Shipped"
```
**Rules:**
- Each shipment generates separate BOL and invoice
- Customer notified of partial shipment
- Remaining quantity stays in PACKAGING or returns to SCHEDULED

#### 3.3.4 Material Shortage
```
ORDERED ──[No Material]──► HELD_MATERIAL_SHORT ──[Material Arrives]──► RECEIVED
```
**Rules:**
- Auto-escalation to purchasing if shortage detected
- Customer notified of delay
- Priority flag to expedite once material available

#### 3.3.5 Rush/Hot Order Override
```
ORDERED ──[RUSH Flag Set]──► Priority Queue ──► SCHEDULED (jump to front)
```
**Rules:**
- Requires manager approval (or auto-approve for premium customers)
- May displace existing schedule (with notification)
- Rush surcharge applied in billing

#### 3.3.6 Customer Hold/Cancellation
```
Any State ──[Customer Hold]──► ON_HOLD ──[Customer Release]──► Resume Previous State
     │
     └──[Customer Cancel]──► CANCELLED ──► Restocking/Cancel Fee Billing
```
**Rules:**
- Cannot cancel once SHIPPED
- Cancel before IN_PROCESS = no fee
- Cancel during/after IN_PROCESS = partial billing + restocking

---

## 4. TRANSITION MATRIX (Allowed Moves)

```
FROM ↓ / TO →     | ORD | RCV | SCH | INP | QC  | PKG | RTS | SHP | CMP | BIL | HOLD | CAN
------------------+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+------+-----
ORDERED           |  -  | ✓   |  -  |  -  |  -  |  -  |  -  |  -  |  -  |  -  |  ✓   | ✓
RECEIVED          |  -  |  -  | ✓   |  -  |  -  |  -  |  -  |  -  |  -  |  -  |  ✓   | ✓
SCHEDULED         |  -  |  -  |  -  | ✓   |  -  |  -  |  -  |  -  |  -  |  -  |  ✓   | ✓
IN_PROCESS        |  -  |  -  |  -  |  -  | ✓   | ✓   |  -  |  -  |  -  |  -  |  ✓   | ✓*
WAITING_QC        |  -  |  -  |  -  | ✓   |  -  | ✓   |  -  |  -  |  -  |  -  |  ✓   | ✓
PACKAGING         |  -  |  -  |  -  |  -  |  -  |  -  | ✓   |  -  |  -  |  -  |  ✓   | ✓*
READY_TO_SHIP     |  -  |  -  |  -  |  -  |  -  |  -  |  -  | ✓   |  -  |  -  |  ✓   | ✓*
SHIPPED           |  -  |  -  |  -  |  -  |  -  |  -  |  -  |  -  | ✓   |  -  |  -   | -
COMPLETED         |  -  |  -  |  -  |  -  |  -  |  -  |  -  |  -  |  -  | ✓   |  -   | -
BILLED            |  -  |  -  |  -  |  -  |  -  |  -  |  -  |  -  |  -  |  -  |  -   | -
ON_HOLD           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |  -  |  -  |  -  |  -   | ✓
CANCELLED         |  -  |  -  |  -  |  -  |  -  |  -  |  -  |  -  |  -  |  -  |  -   | -

* = Requires supervisor approval
✓ = Allowed transition
- = Not allowed / invalid
```

---

## 5. SLA & PRIORITY LOGIC

### 5.1 Priority Levels

| Priority | Label      | Target Lead Time | % Capacity Reserved | Scheduling Rule                          |
|----------|------------|------------------|---------------------|------------------------------------------|
| 1        | CRITICAL   | Same day         | 10%                 | Interrupt current work if >4hr to due    |
| 2        | HOT        | Next day         | 20%                 | Front of queue, next available slot      |
| 3        | STANDARD   | 2-3 days         | 60%                 | FIFO with some optimization              |
| 4        | ECONOMY    | 5-7 days         | 10%                 | Fill-in work, lowest priority            |

### 5.2 SLA Triggers by State

| State         | Max Dwell Time | Alert Threshold | Escalation Action                             |
|---------------|----------------|-----------------|-----------------------------------------------|
| ORDERED       | 4 hours        | 2 hours         | Auto-escalate to scheduler if no material     |
| RECEIVED      | 24 hours       | 16 hours        | Manager review for scheduling priority        |
| SCHEDULED     | 48 hours       | 36 hours        | Capacity planning review                      |
| IN_PROCESS    | Job-dependent  | 120% of std time| Supervisor check for delays                   |
| WAITING_QC    | 4 hours        | 2 hours         | QC manager intervention                       |
| PACKAGING     | 8 hours        | 6 hours         | Expedite packaging crew                       |
| READY_TO_SHIP | 24 hours       | 18 hours        | Arrange expedited carrier                     |
| SHIPPED       | Carrier SLA    | Carrier SLA-1d  | Proactive customer notification               |

### 5.3 Due Date Calculation Logic

```
Due Date = Order Date + Lead Time Offset + Priority Adjustment

Where:
  Lead Time Offset = Base Processing Time + Queue Time + Buffer

Base Processing Time:
  - Lookup from work center standards
  - Adjusted by material type and complexity
  - Historical average if no standard

Queue Time:
  - Current work center backlog / daily capacity
  - Real-time calculation at order entry

Buffer:
  - Standard: +1 day
  - Hot: +0.5 day
  - Critical: 0
  - Economy: +2 days

Priority Adjustment:
  - Critical: Force into today's schedule
  - Hot: Force into tomorrow's schedule
```

---

## 6. HANDOFF POINTS BETWEEN PERSONAS

### 6.1 Sales → Receiving
**Handoff:** Purchase Order for material procurement  
**Artifact:** PO document with expected material specs  
**Failure Mode:** If material arrives before PO in system → receiving delayed until PO created

### 6.2 Receiving → Scheduler
**Handoff:** Material received and available notification  
**Artifact:** Inventory record with location and heat #  
**Failure Mode:** If QC hold, scheduler cannot release until cleared

### 6.3 Scheduler → Shop Floor
**Handoff:** Released work order with routing  
**Artifact:** Job packet (digital or paper) with specifications  
**Failure Mode:** If material location wrong → operator delay finding material

### 6.4 Shop Floor → QC Inspector
**Handoff:** Request for inspection with sample/measurements  
**Artifact:** QC request ticket, first article, or dimensional data  
**Failure Mode:** If QC not available → job waits in WAITING_QC

### 6.5 Shop Floor → Packaging
**Handoff:** Job completion signal with location of finished goods  
**Artifact:** Completion record with final quantities  
**Failure Mode:** If count discrepancy → hold until reconciled

### 6.6 Packaging → Shipping
**Handoff:** Ready-to-ship notification with staged location  
**Artifact:** Packing list and labels  
**Failure Mode:** If carrier appointment missed → reschedule delay

### 6.7 Shipping → Billing
**Handoff:** Shipment confirmation with BOL  
**Artifact:** Signed BOL, tracking number  
**Failure Mode:** If BOL incomplete → billing delayed until corrected

### 6.8 Billing → Customer (via Portal)
**Handoff:** Invoice and delivery confirmation  
**Artifact:** Invoice PDF, tracking info  
**Failure Mode:** If email bounce → CSR manual follow-up

---

## 7. DATA ARTIFACTS PRODUCED AT EACH STAGE

| State         | Primary Artifact(s)                                      | Storage/System         | Retention |
|---------------|----------------------------------------------------------|------------------------|-----------|
| ORDERED       | Job Order, Quote, Routing, Material Req                  | ERP/Job Management     | 7 years   |
| RECEIVED      | Receipt Record, MTR, Dimensions, Location Assignment     | Inventory DB           | Permanent |
| SCHEDULED     | Production Schedule, Work Center Assignments             | Scheduling System      | 2 years   |
| IN_PROCESS    | Labor Transactions, Machine Time, Yield Data, Scrap Log  | MES/Shop Floor System  | 5 years   |
| WAITING_QC    | QC Request, Inspection Results, Certifications           | QC Database            | Permanent |
| PACKAGING     | Packing List, Labels, Package Weight/Dims, Photos        | Shipping System        | 5 years   |
| READY_TO_SHIP | Staged Location, Load Plan                               | Shipping System        | 1 year    |
| SHIPPED       | BOL, Tracking #, Proof of Delivery, Freight Cost         | Shipping System        | 7 years   |
| COMPLETED     | Delivery Confirmation, Customer Signature                | CRM/Portal             | 7 years   |
| BILLED        | Invoice, Payment Record, GL Posting                      | Financial System       | 10 years  |

### 7.1 Critical Traceability Chain

Every job MUST link:
- **Customer Order** → **Material Receipt (Heat #)** → **Processing Records** → **Final Product ID** → **Shipment** → **Invoice**

This ensures full genealogy for regulatory compliance (DFARS, ISO 9001, etc.) and customer audits.

---

## 8. ATOMIC vs USER-DRIVEN TRANSITIONS

### 8.1 Atomic (System-Enforced) Transitions

**Cannot be overridden without admin privileges:**

- **SHIPPED → COMPLETED**  
  Trigger: Delivery confirmation received from carrier  
  Rationale: Financial/contractual implications

- **COMPLETED → BILLED**  
  Trigger: Invoice generation complete  
  Rationale: Revenue recognition compliance

- **WAITING_QC → PACKAGING** (if QC required)  
  Trigger: QC inspector approval recorded  
  Rationale: Quality gate enforcement

- **Inventory Allocation** (upon RECEIVED)  
  Trigger: Material tied to job, cannot be used elsewhere  
  Rationale: Prevent double-allocation

### 8.2 User-Driven (Require Human Action)

**User must explicitly confirm:**

- **ORDERED → RECEIVED**  
  User: Receiving clerk scans material and confirms receipt  
  Rationale: Physical verification required

- **SCHEDULED → IN_PROCESS**  
  User: Operator clocks in to job  
  Rationale: Actual start time capture

- **IN_PROCESS → WAITING_QC or PACKAGING**  
  User: Operator declares job complete  
  Rationale: Operator judgment on completion

- **PACKAGING → READY_TO_SHIP**  
  User: Packaging clerk confirms staged  
  Rationale: Physical verification

- **READY_TO_SHIP → SHIPPED**  
  User: Shipping clerk confirms truck loaded  
  Rationale: BOL signature moment

### 8.3 Semi-Automatic (System Proposes, User Confirms)

- **RECEIVED → SCHEDULED**  
  System: Auto-adds to scheduling queue based on due date  
  User: Scheduler can override sequence or timing

- **Partial Shipment Split**  
  System: Detects quantity mismatch, proposes split  
  User: Confirms split and assigns new due dates

- **Rework Decision**  
  System: Flags QC failure, calculates rework cost  
  User: Approves rework vs scrap decision

---

## 9. EXCEPTION RULES SUMMARY

### 9.1 Material Shortage
- **Detection Point:** Order entry or scheduling
- **Action:** Auto-create purchase requisition, notify customer of delay
- **Override:** Manager can allocate from another job (with customer approval)

### 9.2 Quality Failure
- **Detection Point:** WAITING_QC state
- **Action:** Hold job, notify supervisor and customer
- **Options:**
  - Rework (return to IN_PROCESS with new routing)
  - Accept with deviation (requires customer written approval)
  - Scrap (financial write-off, customer notified)

### 9.3 Yield Shortage
- **Detection Point:** IN_PROCESS completion
- **Action:** 
  - If <5% short → accept and adjust invoice
  - If >5% short → notify customer, offer options (partial ship, wait for more material, cancel)
- **Override:** Customer can accept short shipment

### 9.4 Late Job (Past Due Date)
- **Detection Point:** Continuous monitoring
- **Action:** 
  - Auto-escalate to operations manager
  - Offer expedited shipping at no charge
  - Proactive customer notification with new ETA
- **Logging:** Track late reasons for root cause analysis

### 9.5 Equipment Breakdown
- **Detection Point:** During IN_PROCESS
- **Action:**
  - Reschedule to alternate equipment
  - If no alternate available → delay all affected jobs, notify customers
- **Compensation:** Rush handling once equipment restored

### 9.6 Customer Change Order
- **Allowed Until:** PACKAGING state
- **After PACKAGING:** Requires full return and new order
- **Rules:**
  - Changes to quantity → adjust invoice
  - Changes to specs → new QC approval, may require rework
  - Changes to delivery → reschedule shipping

### 9.7 Split Job Rules
- **Trigger Points:**
  - Customer requests partial shipment
  - Yield shortage forces partial completion
  - Multi-stage processing (some pieces ready early)
- **System Behavior:**
  - Create child jobs (Job-001A, Job-001B)
  - Inherit parent specs
  - Separate status tracking
  - Parent remains "Active" until all children BILLED

### 9.8 Duplicate Order Detection
- **Detection Logic:** Same customer + same material + same specs + within 48 hours
- **Action:** 
  - Alert sales rep before creating job
  - Option to merge or proceed as separate
- **Override:** Sales manager approval to proceed

---

## 10. IMPLEMENTATION NOTES FOR DEVELOPMENT

### 10.1 Database Schema Implications

**Job Status Table:**
```sql
job_id (PK)
status (ENUM: states above)
status_timestamp
previous_status
status_changed_by (user_id)
status_change_reason (text, nullable)
parent_job_id (FK, nullable) -- for splits
priority (1-4)
due_date
```

**State Transition Log Table:**
```sql
transition_id (PK)
job_id (FK)
from_status
to_status
timestamp
user_id
notes
system_triggered (boolean)
```

### 10.2 Validation Rules in Code

- **Cannot skip states** (except via approved exception paths)
- **Cannot go backwards** (except rework paths)
- **Require role-based permissions** for each transition
- **Log all transitions** for audit trail
- **Alert on SLA breach** (define thresholds per state)

### 10.3 API Endpoints Needed

```
POST /api/jobs/{id}/transition
  Body: { to_state: "IN_PROCESS", notes: "...", user_id: "..." }
  Response: { success: true, new_state: "IN_PROCESS", timestamp: "..." }

GET /api/jobs/{id}/status
  Response: { current_state: "PACKAGING", history: [...], sla_status: "on_time" }

GET /api/jobs?status=WAITING_QC
  Response: [list of jobs in that state]

POST /api/jobs/{id}/split
  Body: { quantities: [50, 30], reasons: "partial ship" }
  Response: { parent_id: "...", child_jobs: ["...", "..."] }
```

### 10.4 UI Requirements

- **Status Dashboard:** Visual board showing jobs by state (Kanban-style)
- **SLA Alerts:** Red/yellow highlighting for at-risk jobs
- **Exception Queue:** Dedicated view for jobs in hold/rework states
- **Audit Trail:** Expandable timeline for each job showing all transitions

---

## 11. SUCCESS METRICS (Phase 1 Goals)

| Metric                           | Target        | Measurement Frequency |
|----------------------------------|---------------|-----------------------|
| Average Lead Time (order to ship)| ≤ 3 days      | Daily                 |
| On-Time Delivery Rate            | ≥ 95%         | Weekly                |
| Job Status Data Accuracy         | ≥ 99%         | Continuous            |
| Customer Portal Adoption         | ≥ 60%         | Monthly               |
| Manual Status Inquiries          | ≤ 5 per day   | Daily                 |
| Schedule Adherence               | ≥ 90%         | Daily                 |
| First-Pass Yield                 | ≥ 92%         | Weekly                |
| Invoice Accuracy                 | ≥ 99%         | Weekly                |
| Same-Day Invoicing After Ship    | ≥ 95%         | Daily                 |
| State Transition Compliance      | 100%          | Continuous (enforced) |

---

## 12. NEXT STEPS

1. **Review with stakeholders** (sales, operations, warehouse, finance)
2. **Refine exception paths** based on actual business scenarios
3. **Define detailed API specifications** for each module
4. **Design database schema** with state machine enforcement
5. **Create UI mockups** for status dashboards and exception handling
6. **Develop state transition logic** with unit tests for all paths
7. **Build integration tests** for multi-module workflows
8. **Pilot with 10-20 jobs** before full rollout

---

**End of Phase 1 Module Definition & Job Lifecycle Document**
