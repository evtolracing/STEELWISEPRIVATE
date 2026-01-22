# ALROWARE PERSONA CATALOG
## Service Center Actors & Workflow Mapping

---

# 1. PERSONA CATALOG

## 1.1 CSR / Inside Sales Representative

### Identity
| Attribute | Value |
|-----------|-------|
| **Role Title** | Customer Service Representative / Inside Sales |
| **Division Access** | All (Metals, Plastics, Supplies) |
| **Location Scope** | Assigned branch + visibility to network for sourcing |
| **Shift Pattern** | 7:00 AM - 4:30 PM (phones), staggered coverage |
| **Reports To** | Branch Manager or Sales Manager |

### Responsibilities
- Answer inbound customer calls (primary channel)
- Process phone, fax, and email orders
- Quote pricing for standard and custom requests
- Check inventory availability across network
- Coordinate with scheduling on delivery promises
- Handle customer complaints and expedite requests
- Maintain customer account information
- Process returns and credits
- Follow up on open quotes

### Objectives
| Priority | Objective |
|----------|-----------|
| **1** | Convert inquiries to orders (hit rate) |
| **2** | Promise and deliver on schedule (OTIF) |
| **3** | Maximize order value (cross-sell, up-sell) |
| **4** | Retain customers and grow accounts |
| **5** | Minimize errors and rework |

### Constraints
- **Time Pressure**: Average 4-6 minutes per call; customers expect immediate answers
- **Pricing Authority**: Limited discount authority (e.g., max 5% without manager approval)
- **Credit Limits**: Cannot process orders exceeding customer's credit limit
- **Inventory Visibility**: Can only promise what's ATP (Available-to-Promise)
- **Processing Capacity**: Must check scheduler before promising tight delivery dates
- **Knowledge Gap**: May not know all technical specifications across divisions

### Current Tools (Today)
| Type | Tool | Pain Level |
|------|------|------------|
| **Digital** | Legacy ERP (green screen terminal) | 🔴 High |
| **Digital** | Separate quoting spreadsheet | 🔴 High |
| **Digital** | Email (Outlook) for confirmations | 🟡 Medium |
| **Digital** | Phone system with basic caller ID | 🟢 Low |
| **Analog** | Paper spec sheets and price books | 🔴 High |
| **Analog** | Handwritten notes during calls | 🟡 Medium |
| **Analog** | Physical catalog for plastics specs | 🟡 Medium |

### Pain Points
1. **Multiple Systems**: Must toggle between 3-4 applications to complete one order
2. **Stale Pricing**: Price sheets are often outdated; must call for quotes on non-standard
3. **Inventory Uncertainty**: Can't see real-time floor inventory vs. allocated
4. **Customer History Buried**: Takes too long to pull up past orders and preferences
5. **Processing Lead Times Unknown**: Must call shop floor to estimate processing time
6. **No Mobile Access**: Can't help customers when away from desk
7. **Quote Follow-Up Manual**: No automated tracking of open quotes
8. **Credit Hold Surprises**: Find out customer is on credit hold mid-order

### Metrics / KPIs They Care About
| Metric | Target | Visibility |
|--------|--------|------------|
| Calls Handled per Day | 40-60 | Daily |
| Quote-to-Order Conversion | >35% | Weekly |
| Order Entry Accuracy | >99% | Weekly |
| Average Handle Time | <6 min | Real-time |
| Customer Complaints | <2/week | Weekly |
| Revenue Booked | vs. Quota | Daily |
| Repeat Customer Orders | 70%+ | Monthly |

### Common Workflow Handoffs
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CSR WORKFLOW HANDOFFS                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INBOUND                           CSR                          OUTBOUND   │
│  ────────                         ─────                         ────────   │
│                                                                             │
│  Customer Call ──────────────────▶ │                                       │
│  Customer Email ─────────────────▶ │                                       │
│  Website Quote Request ──────────▶ │                                       │
│                                    │                                       │
│                                    ├────────────▶ Scheduler (capacity?)    │
│                                    ├────────────▶ Purchasing (out of stock)│
│                                    ├────────────▶ Credit (limit issues)    │
│                                    ├────────────▶ Branch Mgr (pricing auth)│
│                                    │                                       │
│                                    ├────────────▶ ORDER CREATED            │
│                                    │              └──▶ Receiving (toll)    │
│                                    │              └──▶ Scheduler (house)   │
│                                    │              └──▶ Shipping (stock)    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1.2 Retail Counter Sales Associate

### Identity
| Attribute | Value |
|-----------|-------|
| **Role Title** | Counter Sales / Metals Outlet Associate |
| **Division Access** | Primarily Metals Outlet, may cross into Industrial Supplies |
| **Location Scope** | Single location (retail storefront or will-call window) |
| **Shift Pattern** | Store hours: 7:00 AM - 5:00 PM weekdays, Sat 8-12 |
| **Reports To** | Branch Manager or Outlet Supervisor |

### Responsibilities
- Serve walk-in customers at retail counter
- Ring up cash/credit sales via POS
- Assist customers finding products (rack/bin locations)
- Process will-call pickups for phone orders
- Handle small cutting/processing requests on the spot
- Maintain retail floor inventory appearance
- Tag remnants for resale
- Process returns and exchanges
- Answer basic product questions

### Objectives
| Priority | Objective |
|----------|-----------|
| **1** | Fast customer throughput (no long waits) |
| **2** | Accurate transactions (drawer balanced) |
| **3** | Sell remnants and slow movers (margin) |
| **4** | Convert walk-ins to account customers |
| **5** | Provide excellent customer experience |

### Constraints
- **No Scheduling Authority**: Cannot promise processing beyond same-day simple cuts
- **Limited Tech Access**: Often just a POS terminal and basic lookup
- **Pricing Rules**: Must follow list price for walk-ins; limited discount authority
- **Cash Handling**: Responsible for accurate drawer; mistakes come out of pocket
- **Safety Requirements**: Cannot operate heavy equipment; must route to shop
- **Space Limitations**: Retail area may be separate from main warehouse

### Current Tools (Today)
| Type | Tool | Pain Level |
|------|------|------------|
| **Digital** | POS terminal (often outdated) | 🟡 Medium |
| **Digital** | Basic inventory lookup (read-only) | 🟡 Medium |
| **Digital** | Credit card terminal | 🟢 Low |
| **Analog** | Paper will-call slips | 🔴 High |
| **Analog** | Handwritten remnant tags | 🔴 High |
| **Analog** | Physical price lists | 🟡 Medium |
| **Analog** | Calculator for pricing | 🟡 Medium |

### Pain Points
1. **Remnant Pricing Guesswork**: No standard system for valuing remnants
2. **Will-Call Chaos**: Paper slips get lost; can't find customer's order
3. **Inventory Location Unknown**: "It says we have it, but where?"
4. **Slow POS System**: Customer waiting while system loads
5. **Can't See Stock in Back**: Must physically walk to check
6. **No Customer History**: Can't recognize repeat customers or preferences
7. **Cutting Queue Blind**: Don't know if shop can do a quick cut
8. **Payment Issues**: Card declines, no real-time credit check

### Metrics / KPIs They Care About
| Metric | Target | Visibility |
|--------|--------|------------|
| Transactions per Day | 25-40 | Daily |
| Average Transaction Value | $150-300 | Daily |
| Drawer Accuracy | 100% | Daily |
| Remnant Sales | Track trends | Weekly |
| Customer Wait Time | <5 min | Real-time |
| Will-Call Pickup Accuracy | 100% | Daily |

### Common Workflow Handoffs
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COUNTER SALES WORKFLOW HANDOFFS                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INBOUND                         COUNTER                        OUTBOUND   │
│  ────────                        ───────                        ────────   │
│                                                                             │
│  Walk-in Customer ───────────────▶ │                                       │
│  Will-Call Pickup ───────────────▶ │                                       │
│  Return/Exchange ────────────────▶ │                                       │
│                                    │                                       │
│                                    ├────────────▶ Shop (quick cut request) │
│                                    ├────────────▶ Warehouse (pull stock)   │
│                                    ├────────────▶ CSR (larger order)       │
│                                    │                                       │
│                                    ├────────────▶ SALE COMPLETED           │
│                                    │              └──▶ Customer leaves     │
│                                    │              └──▶ Inventory updated   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1.3 Planner / Scheduler

### Identity
| Attribute | Value |
|-----------|-------|
| **Role Title** | Production Planner / Scheduler |
| **Division Access** | Typically single division (Metals OR Plastics) |
| **Location Scope** | Single location or regional cluster |
| **Shift Pattern** | Day shift, starts early (6:00 AM - 3:00 PM) |
| **Reports To** | Operations Manager or Branch Manager |

### Responsibilities
- Sequence jobs across work centers to meet SLAs
- Balance capacity utilization vs. delivery promises
- Handle hot orders and schedule disruptions
- Communicate schedule changes to shop floor
- Coordinate with CSRs on delivery date feasibility
- Manage work center downtime and maintenance windows
- Escalate capacity issues to management
- Track and report on schedule adherence
- Optimize job groupings to minimize setups

### Objectives
| Priority | Objective |
|----------|-----------|
| **1** | Meet all SLA delivery promises (OTIF) |
| **2** | Maximize work center utilization |
| **3** | Minimize setup/changeover time |
| **4** | Balance workload across equipment |
| **5** | Provide accurate lead time estimates |

### Constraints
- **Fixed Capacity**: Work centers have hard limits; can't create more hours
- **Equipment Capabilities**: Not all machines can handle all specs
- **Operator Availability**: Skilled operators are limited; some machines need certified operators
- **Material Dependencies**: Can't schedule job until material is received
- **Customer Priority Hierarchy**: HOT/RUSH orders bump normal orders
- **Shift Limitations**: Most locations run single shift; overtime is exception
- **Maintenance Windows**: Scheduled downtime must be respected

### Current Tools (Today)
| Type | Tool | Pain Level |
|------|------|------------|
| **Digital** | Spreadsheet schedule (Excel) | 🔴 High |
| **Digital** | ERP work order screen | 🟡 Medium |
| **Digital** | Email for schedule changes | 🔴 High |
| **Analog** | Whiteboard in shop | 🔴 High |
| **Analog** | Paper job tickets | 🔴 High |
| **Analog** | Phone calls to operators | 🟡 Medium |
| **Analog** | Walking the floor | 🟡 Medium |

### Pain Points
1. **No Real-Time Visibility**: Don't know actual job status until walking floor
2. **Excel Doesn't Scale**: Manual updates, no collision detection
3. **HOT Orders Chaos**: Constant re-sequencing disrupts everything
4. **Material Delays Invisible**: Find out coil didn't arrive at 6 AM
5. **Setup Time Not Tracked**: Can't optimize groupings without data
6. **Capacity Planning Guesswork**: Historical estimates only
7. **Communication Lag**: Schedule changes don't reach operators in time
8. **No What-If Scenarios**: Can't easily model schedule alternatives

### Metrics / KPIs They Care About
| Metric | Target | Visibility |
|--------|--------|------------|
| On-Time-In-Full (OTIF) | >95% | Daily |
| Work Center Utilization | 70-85% | Daily |
| Schedule Adherence | >90% | Daily |
| Jobs Completed per Day | vs. Plan | Daily |
| Average Job Cycle Time | Trending down | Weekly |
| SLA Breaches | 0 | Real-time |
| Setup Time Ratio | <15% | Weekly |

### Common Workflow Handoffs
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SCHEDULER WORKFLOW HANDOFFS                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INBOUND                        SCHEDULER                       OUTBOUND   │
│  ────────                       ─────────                       ────────   │
│                                                                             │
│  New Order (from CSR) ───────────▶ │                                       │
│  Material Received ──────────────▶ │                                       │
│  HOT Order Expedite ─────────────▶ │                                       │
│  Machine Down Alert ─────────────▶ │                                       │
│  Operator Absence ───────────────▶ │                                       │
│                                    │                                       │
│                                    ├────────────▶ Operators (job queue)    │
│                                    ├────────────▶ CSR (delivery update)    │
│                                    ├────────────▶ Branch Mgr (capacity)    │
│                                    ├────────────▶ Shipping (staging times) │
│                                    │                                       │
│                                    ├────────────▶ SCHEDULE PUBLISHED       │
│                                    │              └──▶ Shop Floor Display  │
│                                    │              └──▶ Customer Portal     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1.4 Shop Floor Operator

### Identity
| Attribute | Value |
|-----------|-------|
| **Role Title** | Machine Operator / Production Operator |
| **Division Access** | Assigned work center(s) only |
| **Location Scope** | Single location, single department |
| **Shift Pattern** | Typically 6:00 AM - 2:30 PM (1st shift) |
| **Reports To** | Production Supervisor or Scheduler |

### Responsibilities
- Set up machines for each job (tooling, settings)
- Run production jobs according to work orders
- Record output quantities and scrap
- Perform quality checks (first piece, in-process)
- Report equipment issues and downtime
- Maintain clean and safe work area
- Tag and stage completed output
- Communicate job completion to packaging/QC
- Follow safety protocols

### Objectives
| Priority | Objective |
|----------|-----------|
| **1** | Complete jobs safely |
| **2** | Meet quality standards (no rejects) |
| **3** | Maximize output (pieces per hour) |
| **4** | Minimize scrap and waste |
| **5** | Stay on schedule (SLA compliance) |

### Constraints
- **Physical Demands**: Heavy lifting, standing, noise, temperature
- **Equipment Limitations**: Machine speeds, gauge ranges, width capacity
- **Material Variability**: Coil quality affects run speed
- **Tooling Wear**: Must monitor blade condition, arbor wear
- **Safety Requirements**: Lockout/tagout, PPE, crane certifications
- **Skill Certifications**: May only operate machines they're certified on
- **Limited System Access**: No email, minimal computer interaction

### Current Tools (Today)
| Type | Tool | Pain Level |
|------|------|------------|
| **Digital** | Clock-in terminal | 🟢 Low |
| **Digital** | Occasionally a shared PC | 🟡 Medium |
| **Analog** | Paper work orders (job tickets) | 🔴 High |
| **Analog** | Tally marks for counting | 🔴 High |
| **Analog** | Clipboard for scrap tracking | 🔴 High |
| **Analog** | Verbal handoff to next shift | 🔴 High |
| **Analog** | Physical tag labels | 🟡 Medium |
| **Equipment** | Machine controls (PLCs) | 🟢 Low |

### Pain Points
1. **Paper Job Tickets Lost**: Critical info gets wet, torn, lost
2. **No Visibility to Schedule**: "What's next?" requires walking to board
3. **Manual Counting Errors**: Tally marks lead to inaccurate counts
4. **Scrap Tracking Burden**: Hate paperwork, often skipped
5. **Can't Report Issues Easily**: Must find supervisor or call
6. **No Feedback on Performance**: Don't know how they're doing
7. **Material Problems Not Logged**: Coil issues go unreported
8. **Waiting for Material**: Job scheduled but coil not staged

### Metrics / KPIs They Care About
| Metric | Target | Visibility |
|--------|--------|------------|
| Jobs Completed per Shift | vs. Plan | End of shift |
| Pieces per Hour (Run Rate) | vs. Standard | Would like real-time |
| Scrap % | <2% | Unknown to them |
| Quality Rejects | 0 | When QC finds it |
| Safety Incidents | 0 | Immediate |
| Setup Time | <15 min | Not tracked |
| Machine Uptime | >90% | Not tracked |

### Common Workflow Handoffs
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     OPERATOR WORKFLOW HANDOFFS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INBOUND                        OPERATOR                        OUTBOUND   │
│  ────────                       ────────                        ────────   │
│                                                                             │
│  Scheduled Job ──────────────────▶ │                                       │
│  Staged Material ────────────────▶ │                                       │
│  Job Ticket (paper/digital) ─────▶ │                                       │
│                                    │                                       │
│                                    ├────────────▶ QC (inspection request)  │
│                                    ├────────────▶ Packaging (output staged)│
│                                    ├────────────▶ Scheduler (job complete) │
│                                    ├────────────▶ Maintenance (breakdown)  │
│                                    ├────────────▶ Supervisor (issues)      │
│                                    │                                       │
│                                    ├────────────▶ JOB OUTPUT READY         │
│                                    │              └──▶ Tagged bundles      │
│                                    │              └──▶ Scrap recorded      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1.5 Shipping & Receiving Clerk

### Identity
| Attribute | Value |
|-----------|-------|
| **Role Title** | Shipping/Receiving Clerk (often combined role) |
| **Division Access** | All divisions at location |
| **Location Scope** | Single location |
| **Shift Pattern** | 6:00 AM - 3:00 PM (receiving); 10:00 AM - 6:00 PM (shipping) |
| **Reports To** | Warehouse Manager or Operations Manager |

### Responsibilities

**Receiving:**
- Unload inbound trucks and verify packing lists
- Inspect material for damage and quality
- Check weights and piece counts
- Match receipts to purchase orders
- Tag and put away material to designated locations
- Process toll material receipt
- Report discrepancies to purchasing

**Shipping:**
- Build loads based on route and delivery sequence
- Pull and stage outbound orders
- Generate Bills of Lading (BOL)
- Verify order completeness before loading
- Coordinate with carriers for pickups
- Handle special shipping requirements (crating, dunnage)
- Process UPS/FedEx small package shipments

### Objectives
| Priority | Objective |
|----------|-----------|
| **1** | Accurate receiving (count, quality) |
| **2** | On-time shipping (meet cut-off) |
| **3** | Zero damage (proper handling/loading) |
| **4** | Accurate documentation (BOL, POD) |
| **5** | Efficient truck loading (maximize capacity) |

### Constraints
- **Dock Door Availability**: Limited doors for concurrent trucks
- **Truck Schedules**: Carrier pickup windows are fixed
- **Equipment Capacity**: Crane, forklift availability
- **Weather**: Outdoor loading affects schedule
- **Hazmat Regulations**: Special handling for certain materials
- **Weight Limits**: Can't overload trucks
- **Customer Delivery Windows**: Some require specific timing

### Current Tools (Today)
| Type | Tool | Pain Level |
|------|------|------------|
| **Digital** | ERP receiving screen | 🟡 Medium |
| **Digital** | Carrier websites (tracking) | 🟡 Medium |
| **Digital** | UPS/FedEx shipping software | 🟢 Low |
| **Analog** | Paper BOL (multi-part forms) | 🔴 High |
| **Analog** | Packing slips / pick tickets | 🔴 High |
| **Analog** | Physical signature capture | 🔴 High |
| **Analog** | Whiteboard for truck schedule | 🟡 Medium |
| **Equipment** | Scales (certified) | 🟢 Low |
| **Equipment** | Forklift, crane | 🟢 Low |

### Pain Points
1. **Paper BOLs**: Carbonless forms are unreliable; copies illegible
2. **Can't Find Staged Material**: "Where is order 12345?"
3. **No Real-Time Truck Status**: "Is the carrier running late?"
4. **PO Mismatches on Receiving**: Have to chase down purchasing
5. **Last-Minute Order Changes**: "Add one more item to that truck!"
6. **Weight Discrepancies**: Actual vs. stated weight issues
7. **Proof of Delivery Delays**: Days before signed POD returns
8. **Damage Claims Difficult**: No photos at time of shipping

### Metrics / KPIs They Care About
| Metric | Target | Visibility |
|--------|--------|------------|
| Receiving Accuracy | 99%+ | Daily |
| Put-Away Time | <4 hours | Daily |
| Shipping Cut-Off Met | 100% | Daily |
| BOL Accuracy | 100% | Per shipment |
| Trucks Loaded per Day | vs. Plan | Daily |
| Damage Claims | <0.1% | Monthly |
| POD Capture Rate | 100% | Weekly |

### Common Workflow Handoffs
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  SHIPPING/RECEIVING WORKFLOW HANDOFFS                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INBOUND (RECEIVING)              CLERK                OUTBOUND (SHIPPING) │
│  ───────────────────              ─────                ─────────────────── │
│                                                                             │
│  Inbound Truck ──────────────────▶ │                                       │
│  PO from Purchasing ─────────────▶ │                                       │
│  Toll Material (customer) ───────▶ │                                       │
│                                    │                                       │
│           RECEIVING:               ├────────────▶ Inventory (put away)     │
│                                    ├────────────▶ Scheduler (toll ready)   │
│                                    ├────────────▶ Purchasing (discrepancy) │
│                                    ├────────────▶ QC (inspection needed)   │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  Ready Orders ───────────────────▶ │                                       │
│  Carrier Arrival ────────────────▶ │                                       │
│  Special Instructions ───────────▶ │                                       │
│                                    │                                       │
│           SHIPPING:                ├────────────▶ Driver (BOL, load)       │
│                                    ├────────────▶ CSR (tracking info)      │
│                                    ├────────────▶ Billing (POD trigger)    │
│                                    ├────────────▶ Customer (notification)  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1.6 QC Inspector (Optional Role)

### Identity
| Attribute | Value |
|-----------|-------|
| **Role Title** | Quality Control Inspector / QA Technician |
| **Division Access** | All divisions at location |
| **Location Scope** | Single location |
| **Shift Pattern** | Day shift, flexible to cover production peaks |
| **Reports To** | Quality Manager or Operations Manager |

### Responsibilities
- Perform incoming material inspection
- Conduct first-piece approval for new jobs
- Execute in-process inspections per quality plan
- Final inspection before packaging/shipping
- Maintain calibration of measuring equipment
- Document non-conformances (NCRs)
- Coordinate with suppliers on quality issues
- Manage MTR (Mill Test Report) documentation
- Support customer quality requirements

### Objectives
| Priority | Objective |
|----------|-----------|
| **1** | Prevent defective material from shipping |
| **2** | Catch quality issues early (reduce scrap) |
| **3** | Maintain certification compliance |
| **4** | Document traceability (heat numbers, MTRs) |
| **5** | Reduce customer complaints |

### Constraints
- **Inspection Time**: Can't hold up production too long
- **Equipment Limitations**: Measurement precision, calibration
- **Subjective Standards**: Some quality calls are judgment
- **Customer Spec Variability**: Different customers, different tolerances
- **Certification Requirements**: ISO, IATF, AS9100 compliance
- **Material Knowledge**: Must know specs across products

### Current Tools (Today)
| Type | Tool | Pain Level |
|------|------|------------|
| **Digital** | Quality management spreadsheets | 🔴 High |
| **Digital** | Document management (MTRs) | 🟡 Medium |
| **Digital** | Customer portal (spec lookup) | 🟡 Medium |
| **Analog** | Paper inspection forms | 🔴 High |
| **Analog** | Calibrated measuring tools | 🟢 Low |
| **Analog** | Physical MTR binders | 🔴 High |
| **Analog** | Sticky notes for holds | 🔴 High |

### Pain Points
1. **MTR Retrieval Slow**: Searching through physical binders
2. **No Digital Inspection Records**: Paper forms filed and forgotten
3. **Hold/Release Not Visible**: Production doesn't know QC status
4. **Calibration Tracking Manual**: Spreadsheet-based, easy to miss
5. **Customer Specs Scattered**: Different sources for different customers
6. **NCR Follow-Up Difficult**: No workflow for corrective actions
7. **Traceability Gaps**: Heat numbers not consistently recorded
8. **Cert Requests Last Minute**: Scramble to produce documentation

### Metrics / KPIs They Care About
| Metric | Target | Visibility |
|--------|--------|------------|
| Inspection Throughput | No bottleneck | Real-time |
| First-Pass Yield | >98% | Daily |
| Customer Complaints (Quality) | <1/month | Monthly |
| NCRs Created | Track trends | Weekly |
| Calibration Compliance | 100% | Monthly |
| MTR Match Rate | 100% | Per shipment |

### Common Workflow Handoffs
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       QC INSPECTOR WORKFLOW HANDOFFS                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INBOUND                           QC                           OUTBOUND   │
│  ────────                         ────                          ────────   │
│                                                                             │
│  Receiving (incoming inspect) ───▶ │                                       │
│  Operator (first piece) ─────────▶ │                                       │
│  Operator (job complete) ────────▶ │                                       │
│  Customer spec request ──────────▶ │                                       │
│                                    │                                       │
│                                    ├────────────▶ Receiving (release/hold) │
│                                    ├────────────▶ Operator (rework needed) │
│                                    ├────────────▶ Packaging (approved)     │
│                                    ├────────────▶ CSR (quality issue)      │
│                                    ├────────────▶ Shipping (certs ready)   │
│                                    │                                       │
│                                    ├────────────▶ RELEASE TO NEXT STEP     │
│                                    │              └──▶ Or NCR created      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1.7 Customer Portal User

### Identity
| Attribute | Value |
|-----------|-------|
| **Role Title** | Customer Buyer / Purchasing Agent |
| **Company Type** | OEM, Fabricator, Job Shop, MRO |
| **Access Level** | Own company data only |
| **Usage Pattern** | Periodic (daily for large buyers, weekly for smaller) |
| **Reports To** | Operations Manager, Production Manager (at their company) |

### Responsibilities (at their own company)
- Source and purchase raw materials
- Track open orders and deliveries
- Request quotes for new projects
- Manage supplier relationships
- Review invoices and resolve discrepancies
- Maintain material certifications for audits
- Forecast material needs

### Objectives (when using AlroWare Portal)
| Priority | Objective |
|----------|-----------|
| **1** | Find availability and pricing quickly |
| **2** | Track order status without calling |
| **3** | Access documentation (MTRs, invoices) |
| **4** | Reorder frequently purchased items easily |
| **5** | Resolve issues without phone tag |

### Constraints
- **Time Pressure**: Buyers manage many suppliers; limited time per each
- **Technical Knowledge**: May not know exact material specs
- **Budget Limits**: Purchase authority thresholds
- **Quality Requirements**: Must ensure supplier meets their specs
- **Audit Trail**: Need documentation for their QMS

### Current Tools (Today)
| Type | Tool | Pain Level |
|------|------|------------|
| **Digital** | Supplier websites (varied quality) | 🟡 Medium |
| **Digital** | Email for quotes and orders | 🔴 High |
| **Digital** | Own ERP for PO management | 🟢 Low |
| **Digital** | Spreadsheets for tracking | 🔴 High |
| **Analog** | Phone calls to sales reps | 🟡 Medium |
| **Analog** | Physical filing of certs | 🔴 High |

### Pain Points
1. **Can't See Order Status Online**: Must call or email to check
2. **Pricing Opaque**: Different quotes every time, unclear discounts
3. **MTRs Hard to Get**: Must request and wait for email
4. **Reordering Tedious**: Can't just click "reorder" on past purchases
5. **No Processing Visibility**: "When will my slit coil actually ship?"
6. **Invoice Discrepancies**: Price doesn't match quote
7. **Multiple Contacts**: Don't know who to call for what
8. **No Self-Service**: Can't update PO details online

### Metrics / KPIs They Care About (as buyer)
| Metric | Target | Visibility |
|--------|--------|------------|
| Supplier Lead Time | Predictable | Per order |
| On-Time Delivery | >95% | Monthly |
| Price Competitiveness | vs. Alternatives | Quarterly |
| Quality (Defects) | <1% | Per shipment |
| Invoice Accuracy | 100% | Per invoice |
| Documentation Availability | Immediate | Per order |

### Common Workflow Handoffs
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   CUSTOMER PORTAL USER WORKFLOW                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                          CUSTOMER (PORTAL)                                  │
│                          ─────────────────                                  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │   Search ──▶ Quote Request ──▶ Order ──▶ Track ──▶ Docs ──▶ Reorder  │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  TRIGGERS INTO ALROWARE:                                                   │
│                                                                             │
│  Quote Request ──────────────────▶ CSR (review and respond)                │
│  Online Order ───────────────────▶ Order Engine (auto-process)             │
│  Message/Question ───────────────▶ CSR (ticket created)                    │
│  Cert Request ───────────────────▶ QC (MTR lookup)                         │
│                                                                             │
│  RECEIVES FROM ALROWARE:                                                   │
│                                                                             │
│  ◀─────────────────────────────── Order Confirmation                       │
│  ◀─────────────────────────────── Status Updates                           │
│  ◀─────────────────────────────── Shipping Notification + Tracking         │
│  ◀─────────────────────────────── Invoices and Certs (PDF download)        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1.8 Branch Manager

### Identity
| Attribute | Value |
|-----------|-------|
| **Role Title** | Branch Manager / General Manager |
| **Division Access** | All divisions at their location |
| **Location Scope** | Single location (full P&L responsibility) |
| **Shift Pattern** | Primarily days, on-call for emergencies |
| **Reports To** | Regional Director or VP Operations |

### Responsibilities
- Overall P&L responsibility for location
- Staff hiring, training, and performance management
- Customer relationship management (key accounts)
- Capacity and capability investment decisions
- Safety program oversight
- Facility and equipment maintenance
- Resolve escalated customer issues
- Coordinate with corporate initiatives
- Set and monitor branch goals

### Objectives
| Priority | Objective |
|----------|-----------|
| **1** | Meet revenue and margin targets |
| **2** | Achieve operational KPIs (OTIF, quality) |
| **3** | Develop and retain talent |
| **4** | Grow market share in territory |
| **5** | Maintain safety record |

### Constraints
- **Budget Limits**: CapEx approval thresholds
- **Headcount Restrictions**: FTE limits set by corporate
- **Pricing Authority**: Limits on discounts and exceptions
- **Policy Compliance**: Must follow corporate procedures
- **Regional Competition**: Local competitors for same customers
- **Talent Pool**: Skilled labor availability

### Current Tools (Today)
| Type | Tool | Pain Level |
|------|------|------------|
| **Digital** | ERP management reports | 🟡 Medium |
| **Digital** | Email (primary communication) | 🟡 Medium |
| **Digital** | Spreadsheets (custom reports) | 🔴 High |
| **Digital** | BI tool (limited, corporate) | 🟡 Medium |
| **Analog** | Whiteboard for key metrics | 🟡 Medium |
| **Analog** | Walking the floor | 🟢 Low |
| **Analog** | Customer visits | 🟢 Low |

### Pain Points
1. **Delayed Reports**: Data is days old by the time it's available
2. **Multiple Data Sources**: Must manually combine for full picture
3. **No Real-Time Visibility**: "How are we doing TODAY?"
4. **Customer Data Fragmented**: CRM is separate from ERP
5. **Cannot Drill Down**: Summary reports don't show detail
6. **Benchmarking Difficult**: Can't easily compare to other branches
7. **Exception Visibility**: Don't find out about problems until too late
8. **Forecasting is Guesswork**: No predictive analytics

### Metrics / KPIs They Care About
| Metric | Target | Visibility |
|--------|--------|------------|
| Revenue | vs. Budget | Daily/Weekly |
| Gross Margin % | Company target | Weekly |
| OTIF | >95% | Daily |
| Inventory Turns | >6x/year | Monthly |
| AR Days | <45 days | Weekly |
| Safety (OSHA) | 0 recordables | Real-time |
| Employee Turnover | <15%/year | Monthly |
| Customer Retention | >90% | Quarterly |
| Productivity ($/employee) | vs. Benchmark | Monthly |

### Common Workflow Handoffs
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BRANCH MANAGER WORKFLOW HANDOFFS                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INBOUND                       BRANCH MGR                       OUTBOUND   │
│  ────────                      ──────────                       ────────   │
│                                                                             │
│  Corporate Directives ───────────▶ │                                       │
│  Customer Escalations ───────────▶ │                                       │
│  Staff Issues ───────────────────▶ │                                       │
│  Performance Reports ────────────▶ │                                       │
│  Safety Incidents ───────────────▶ │                                       │
│                                    │                                       │
│                                    ├────────────▶ Regional (results)       │
│                                    ├────────────▶ Staff (direction)        │
│                                    ├────────────▶ Customers (relationship) │
│                                    ├────────────▶ Corporate (requests)     │
│                                    ├────────────▶ HR (staffing)            │
│                                    │                                       │
│                                    ├────────────▶ BRANCH PERFORMANCE       │
│                                    │              └──▶ Reported up         │
│                                    │              └──▶ Actions down        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1.9 Division Manager

### Identity
| Attribute | Value |
|-----------|-------|
| **Role Title** | Division Manager (Metals / Plastics / Supplies) |
| **Division Access** | Single division, all locations |
| **Location Scope** | All locations within division |
| **Work Pattern** | Office-based + travel to branches |
| **Reports To** | VP/SVP of Division or COO |

### Responsibilities
- Division-wide P&L responsibility
- Product line strategy and assortment
- Supplier relationship management
- Pricing strategy and margin management
- Capability investment across locations
- Division-wide quality and process standards
- New product introduction
- Competitive analysis and positioning
- Division goal setting and cascade

### Objectives
| Priority | Objective |
|----------|-----------|
| **1** | Grow division revenue and margin |
| **2** | Optimize product mix and pricing |
| **3** | Ensure consistent quality across locations |
| **4** | Develop supplier partnerships |
| **5** | Drive operational best practices |

### Constraints
- **Cross-Functional Dependencies**: Relies on IT, HR, Finance
- **Branch Autonomy**: Can influence but not directly control branches
- **Capital Allocation**: Competes with other divisions for CapEx
- **Market Dynamics**: Commodity prices, demand fluctuations
- **Supplier Limitations**: Lead times, allocation during shortages

### Current Tools (Today)
| Type | Tool | Pain Level |
|------|------|------------|
| **Digital** | ERP (division-level reports) | 🟡 Medium |
| **Digital** | BI tool (limited customization) | 🟡 Medium |
| **Digital** | Spreadsheets (extensive) | 🔴 High |
| **Digital** | Supplier portals | 🟡 Medium |
| **Digital** | Market data services | 🟢 Low |
| **Analog** | Phone/travel to branches | 🟡 Medium |

### Pain Points
1. **No Unified View**: Each branch reports differently
2. **Pricing Inconsistency**: Same product, different prices across locations
3. **Inventory Imbalance**: Overstocked one place, out elsewhere
4. **Best Practice Silos**: Innovations don't spread
5. **Slow Market Response**: Can't adjust pricing quickly
6. **Customer 360 Missing**: Can't see customer across all branches
7. **Profitability Blind Spots**: Don't know true product profitability
8. **Forecast Accuracy Poor**: Demand planning is manual

### Metrics / KPIs They Care About
| Metric | Target | Visibility |
|--------|--------|------------|
| Division Revenue | vs. Budget | Weekly |
| Division Gross Margin | Target % | Weekly |
| Revenue by Product Line | Trends | Monthly |
| Inventory Value | vs. Sales | Weekly |
| Inventory Turns | >6x | Monthly |
| GMROI | >2.5 | Monthly |
| Customer Concentration | Top 20 = X% | Quarterly |
| New Customer Acquisition | # per month | Monthly |
| Pricing Realization | vs. List | Weekly |

### Common Workflow Handoffs
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   DIVISION MANAGER WORKFLOW HANDOFFS                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INBOUND                       DIV MANAGER                      OUTBOUND   │
│  ────────                      ───────────                      ────────   │
│                                                                             │
│  Executive Strategy ─────────────▶ │                                       │
│  Branch Performance ─────────────▶ │                                       │
│  Market Intelligence ────────────▶ │                                       │
│  Supplier Updates ───────────────▶ │                                       │
│  Customer Trends ────────────────▶ │                                       │
│                                    │                                       │
│                                    ├────────────▶ Branches (standards)     │
│                                    ├────────────▶ Purchasing (vendor)      │
│                                    ├────────────▶ Pricing (guidelines)     │
│                                    ├────────────▶ Executive (results)      │
│                                    ├────────────▶ Marketing (campaigns)    │
│                                    │                                       │
│                                    ├────────────▶ DIVISION STRATEGY        │
│                                    │              └──▶ Product assortment  │
│                                    │              └──▶ Capability invest   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1.10 Corporate / Finance

### Identity
| Attribute | Value |
|-----------|-------|
| **Role Title** | Finance Analyst / Controller / CFO Staff |
| **Division Access** | All (read-only for most) |
| **Location Scope** | All locations (consolidated view) |
| **Work Pattern** | Corporate office, month-end peaks |
| **Reports To** | Controller, VP Finance, CFO |

### Responsibilities
- Financial reporting (monthly, quarterly, annual)
- Budgeting and forecasting
- Cost accounting and variance analysis
- Accounts receivable management
- Credit policy and collections
- Audit support and compliance
- Tax reporting
- Cash management
- Capital investment analysis

### Objectives
| Priority | Objective |
|----------|-----------|
| **1** | Accurate and timely financial statements |
| **2** | Strong cash flow and collections |
| **3** | Maintain healthy margins |
| **4** | Control costs and identify savings |
| **5** | Support growth with financial analysis |

### Constraints
- **Audit Requirements**: SOX, GAAP, external auditors
- **System Limitations**: Legacy ERP, manual journal entries
- **Data Quality**: Depends on operational data accuracy
- **Timing**: Period close deadlines are fixed
- **Cross-System Reconciliation**: Multiple systems don't tie

### Current Tools (Today)
| Type | Tool | Pain Level |
|------|------|------------|
| **Digital** | ERP (GL, AR, AP) | 🟡 Medium |
| **Digital** | Spreadsheets (heavy use) | 🔴 High |
| **Digital** | BI/Reporting tools | 🟡 Medium |
| **Digital** | Consolidation tools | 🟡 Medium |
| **Analog** | Paper reconciliations | 🔴 High |
| **Analog** | Physical invoice archive | 🔴 High |

### Pain Points
1. **Month-End Crunch**: Too much manual work at close
2. **AR Aging Visibility**: Hard to see who owes what
3. **Revenue Recognition Complexity**: Processing complicates timing
4. **Intercompany Reconciliation**: Branch-to-branch transfers messy
5. **Cost Allocation**: Processing costs hard to assign
6. **Inventory Valuation**: Moving average vs. actual
7. **Audit Trail Gaps**: Can't always trace transactions
8. **Forecasting Manual**: No automated trend analysis

### Metrics / KPIs They Care About
| Metric | Target | Visibility |
|--------|--------|------------|
| Revenue (consolidated) | vs. Budget | Weekly |
| Gross Margin % | Target | Weekly |
| DSO (Days Sales Outstanding) | <45 days | Weekly |
| DPO (Days Payable) | Optimize | Monthly |
| Inventory Turns | >6x | Monthly |
| Bad Debt % | <0.5% | Monthly |
| EBITDA Margin | Target | Monthly |
| Cash Flow | Positive | Weekly |
| Period Close Timing | Day 5 | Monthly |

### Common Workflow Handoffs
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   CORPORATE/FINANCE WORKFLOW HANDOFFS                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INBOUND                        FINANCE                         OUTBOUND   │
│  ────────                       ───────                         ────────   │
│                                                                             │
│  Operational Data ───────────────▶ │                                       │
│  (orders, shipments, receipts)     │                                       │
│  Bank Transactions ──────────────▶ │                                       │
│  AP Invoices ────────────────────▶ │                                       │
│  Customer Payments ──────────────▶ │                                       │
│                                    │                                       │
│                                    ├────────────▶ Branches (budgets)       │
│                                    ├────────────▶ CSR (credit decisions)   │
│                                    ├────────────▶ Executives (reports)     │
│                                    ├────────────▶ Auditors (compliance)    │
│                                    ├────────────▶ Collections (AR aging)   │
│                                    │                                       │
│                                    ├────────────▶ FINANCIAL STATEMENTS     │
│                                    │              └──▶ P&L, Balance Sheet  │
│                                    │              └──▶ Cash Flow           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 2. WORKFLOW HANDOFF GRAPH

## 2.1 Complete Handoff Matrix

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         COMPLETE WORKFLOW HANDOFF MATRIX                                           │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                     │
│  FROM ↓ / TO →      │ CSR │ CTR │ SCH │ OPR │ S/R │ QC  │ CUS │ BRN │ DIV │ FIN │                                  │
│  ───────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤                                  │
│                     │     │     │     │     │     │     │     │     │     │     │                                  │
│  CSR (Sales)        │  ·  │  ◐  │  ●  │  ○  │  ●  │  ○  │  ●  │  ◐  │  ○  │  ◐  │                                  │
│                     │     │     │     │     │     │     │     │     │     │     │                                  │
│  CTR (Counter)      │  ◐  │  ·  │  ○  │  ◐  │  ○  │  ○  │  ●  │  ○  │  ○  │  ◐  │                                  │
│                     │     │     │     │     │     │     │     │     │     │     │                                  │
│  SCH (Scheduler)    │  ●  │  ○  │  ·  │  ●  │  ●  │  ○  │  ○  │  ●  │  ◐  │  ○  │                                  │
│                     │     │     │     │     │     │     │     │     │     │     │                                  │
│  OPR (Operator)     │  ○  │  ○  │  ●  │  ·  │  ○  │  ●  │  ○  │  ◐  │  ○  │  ○  │                                  │
│                     │     │     │     │     │     │     │     │     │     │     │                                  │
│  S/R (Ship/Recv)    │  ●  │  ○  │  ●  │  ○  │  ·  │  ◐  │  ●  │  ◐  │  ○  │  ●  │                                  │
│                     │     │     │     │     │     │     │     │     │     │     │                                  │
│  QC (Quality)       │  ◐  │  ○  │  ◐  │  ●  │  ●  │  ·  │  ○  │  ◐  │  ◐  │  ○  │                                  │
│                     │     │     │     │     │     │     │     │     │     │     │                                  │
│  CUS (Customer)     │  ●  │  ●  │  ○  │  ○  │  ○  │  ○  │  ·  │  ○  │  ○  │  ◐  │                                  │
│                     │     │     │     │     │     │     │     │     │     │     │                                  │
│  BRN (Branch Mgr)   │  ●  │  ●  │  ●  │  ◐  │  ◐  │  ◐  │  ●  │  ·  │  ●  │  ●  │                                  │
│                     │     │     │     │     │     │     │     │     │     │     │                                  │
│  DIV (Division)     │  ◐  │  ○  │  ◐  │  ○  │  ○  │  ◐  │  ○  │  ●  │  ·  │  ●  │                                  │
│                     │     │     │     │     │     │     │     │     │     │     │                                  │
│  FIN (Finance)      │  ◐  │  ○  │  ○  │  ○  │  ◐  │  ○  │  ◐  │  ●  │  ●  │  ·  │                                  │
│                     │     │     │     │     │     │     │     │     │     │     │                                  │
│  ───────────────────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘                                  │
│                                                                                                                     │
│  Legend: ● Frequent (daily)  ◐ Regular (weekly)  ○ Occasional (as-needed)  · Self                                  │
│                                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 2.2 Critical Handoff Flows

### 2.2.1 Order-to-Cash Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                              ORDER-TO-CASH HANDOFF FLOW                                            │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                     │
│                                                                                                                     │
│   ┌───────────┐      ┌───────────┐      ┌───────────┐      ┌───────────┐      ┌───────────┐      ┌───────────┐     │
│   │ CUSTOMER  │      │    CSR    │      │ SCHEDULER │      │ OPERATOR  │      │  SHIP/QC  │      │  FINANCE  │     │
│   │           │      │           │      │           │      │           │      │           │      │           │     │
│   └─────┬─────┘      └─────┬─────┘      └─────┬─────┘      └─────┬─────┘      └─────┬─────┘      └─────┬─────┘     │
│         │                  │                  │                  │                  │                  │           │
│         │  Order Request   │                  │                  │                  │                  │           │
│         │─────────────────▶│                  │                  │                  │                  │           │
│         │                  │                  │                  │                  │                  │           │
│         │                  │  Schedule Job    │                  │                  │                  │           │
│         │                  │─────────────────▶│                  │                  │                  │           │
│         │                  │                  │                  │                  │                  │           │
│         │                  │                  │  Dispatch Job    │                  │                  │           │
│         │                  │                  │─────────────────▶│                  │                  │           │
│         │                  │                  │                  │                  │                  │           │
│         │                  │                  │                  │  Job Complete    │                  │           │
│         │                  │                  │                  │─────────────────▶│                  │           │
│         │                  │                  │                  │                  │                  │           │
│         │                  │                  │                  │                  │  Ship + Bill     │           │
│         │                  │                  │                  │                  │─────────────────▶│           │
│         │                  │                  │                  │                  │                  │           │
│         │  Delivery + Invoice                                                                         │           │
│         │◀────────────────────────────────────────────────────────────────────────────────────────────│           │
│         │                                                                                              │           │
│         │  Payment                                                                                     │           │
│         │─────────────────────────────────────────────────────────────────────────────────────────────▶│           │
│         │                                                                                              │           │
│                                                                                                                     │
│   HANDOFF DATA AT EACH TRANSITION:                                                                                 │
│   ─────────────────────────────────────────────────────────────────────────────────────────────────────            │
│   • Order Request → CSR: Customer ID, items, quantities, delivery need, processing specs                          │
│   • CSR → Scheduler: Order details, SLA deadline, material allocated, processing type                             │
│   • Scheduler → Operator: Job ticket, material location, instructions, target time                                │
│   • Operator → Ship/QC: Completed bundles, scrap record, QC results, pack list                                    │
│   • Ship/QC → Finance: Shipment confirmation, weights, BOL, POD trigger                                           │
│   • Finance → Customer: Invoice, payment terms, MTR if requested                                                  │
│                                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2.2 Toll Processing Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                            TOLL PROCESSING HANDOFF FLOW                                            │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                     │
│   ┌───────────┐      ┌───────────┐      ┌───────────┐      ┌───────────┐      ┌───────────┐      ┌───────────┐     │
│   │ CUSTOMER  │      │    CSR    │      │ RECEIVING │      │ SCHEDULER │      │ OPERATOR  │      │ SHIPPING  │     │
│   │           │      │           │      │           │      │           │      │           │      │           │     │
│   └─────┬─────┘      └─────┬─────┘      └─────┬─────┘      └─────┬─────┘      └─────┬─────┘      └─────┬─────┘     │
│         │                  │                  │                  │                  │                  │           │
│         │  Toll Order      │                  │                  │                  │                  │           │
│         │  + Ship Material │                  │                  │                  │                  │           │
│         │─────────────────▶│                  │                  │                  │                  │           │
│         │                  │                  │                  │                  │                  │           │
│         │                  │  Expect Receipt  │                  │                  │                  │           │
│         │                  │─────────────────▶│                  │                  │                  │           │
│         │                  │                  │                  │                  │                  │           │
│         │         Customer Material Arrives   │                  │                  │                  │           │
│         │─────────────────────────────────────▶│                  │                  │                  │           │
│         │                  │                  │                  │                  │                  │           │
│         │                  │                  │  Material Ready  │                  │                  │           │
│         │                  │                  │─────────────────▶│                  │                  │           │
│         │                  │                  │                  │                  │                  │           │
│         │                  │                  │  Schedule Job    │                  │                  │           │
│         │                  │                  │─────────────────▶│                  │                  │           │
│         │                  │                  │                  │                  │                  │           │
│         │                  │                  │                  │  Process         │                  │           │
│         │                  │                  │                  │─────────────────▶│                  │           │
│         │                  │                  │                  │                  │                  │           │
│         │                  │                  │                  │                  │  Ship Back       │           │
│         │                  │                  │                  │                  │─────────────────▶│           │
│         │                  │                  │                  │                  │                  │           │
│         │  Processed Material + Processing Invoice Only                                               │           │
│         │◀────────────────────────────────────────────────────────────────────────────────────────────│           │
│                                                                                                                     │
│   CRITICAL DATA FOR TOLL:                                                                                          │
│   ─────────────────────────────────────────────────────────────────────────────────────────────────────            │
│   • Ownership = CUSTOMER_OWNED throughout                                                                          │
│   • Traceability: Customer's heat numbers preserved                                                                │
│   • Billing: Processing charges only, no material cost                                                             │
│   • Scrap: Must account for customer's scrap (return or credit?)                                                  │
│                                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2.3 Exception Escalation Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           EXCEPTION ESCALATION PATHS                                               │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                     │
│   EXCEPTION TYPE              DETECTED BY          ESCALATES TO           RESOLUTION OWNER                         │
│   ─────────────────────────────────────────────────────────────────────────────────────────────────                │
│                                                                                                                     │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────┐                  │
│   │ SLA AT RISK (🟡)          Scheduler ──────────▶ Branch Manager ──────▶ Scheduler (reseq)    │                  │
│   │                                                                                              │                  │
│   │ SLA BREACH (🔴)           System Alert ───────▶ Branch Manager ──────▶ CSR (notify cust)    │                  │
│   │                           Scheduler                 + CSR                                    │                  │
│   └─────────────────────────────────────────────────────────────────────────────────────────────┘                  │
│                                                                                                                     │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────┐                  │
│   │ QUALITY HOLD              QC Inspector ───────▶ Scheduler ───────────▶ QC (resolution)      │                  │
│   │                                                    + Operator                                │                  │
│   │                                                                                              │                  │
│   │ QUALITY COMPLAINT         CSR ────────────────▶ QC ─────────────────▶ Branch Manager        │                  │
│   │ (Customer)                                         + Branch Mgr                              │                  │
│   └─────────────────────────────────────────────────────────────────────────────────────────────┘                  │
│                                                                                                                     │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────┐                  │
│   │ CREDIT HOLD               System ─────────────▶ CSR ─────────────────▶ Finance              │                  │
│   │                                                    + Finance                                 │                  │
│   │                                                                                              │                  │
│   │ PRICING EXCEPTION         CSR ────────────────▶ Branch Manager ──────▶ Branch Mgr (approve) │                  │
│   │ (Discount request)                                                     or Division          │                  │
│   └─────────────────────────────────────────────────────────────────────────────────────────────┘                  │
│                                                                                                                     │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────┐                  │
│   │ EQUIPMENT DOWN            Operator ───────────▶ Scheduler ───────────▶ Maintenance          │                  │
│   │                                                    + Supervisor           + Scheduler       │                  │
│   │                                                                                              │                  │
│   │ SAFETY INCIDENT           Anyone ─────────────▶ Supervisor ──────────▶ Branch Manager       │                  │
│   │                                                    + Branch Mgr           + Safety          │                  │
│   └─────────────────────────────────────────────────────────────────────────────────────────────┘                  │
│                                                                                                                     │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────┐                  │
│   │ INVENTORY DISCREPANCY     Receiving ──────────▶ Purchasing ──────────▶ Receiving (resolve) │                  │
│   │                           Shipping                 + Inventory           + Finance          │                  │
│   │                                                                                              │                  │
│   │ OUT OF STOCK              CSR ────────────────▶ Purchasing ──────────▶ Purchasing (source) │                  │
│   │ (Customer needs it)                                + Scheduler            or Transfer       │                  │
│   └─────────────────────────────────────────────────────────────────────────────────────────────┘                  │
│                                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 3. PERSONA-TO-MODULE EXPECTATION MAPPING

## 3.1 Module Access Matrix

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         MODULE ACCESS BY PERSONA                                                   │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                     │
│                          │ ORDER │ POS │ SCHED │ SHOP │ RECV │ SHIP │ QC  │ INV │ PRICE│ DASH │ ADMIN│             │
│  ─────────────────────────┼───────┼─────┼───────┼──────┼──────┼──────┼─────┼─────┼──────┼──────┼──────┤             │
│                          │       │     │       │      │      │      │     │     │      │      │      │             │
│  CSR / Inside Sales      │  ★★★  │  ★  │  ★★   │  ★   │  ★   │  ★★  │  ★  │ ★★  │  ★★  │  ★★  │  ○   │             │
│                          │       │     │       │      │      │      │     │     │      │      │      │             │
│  Counter Sales           │  ★★   │ ★★★ │  ○    │  ★   │  ★   │  ★   │  ○  │  ★  │  ★   │  ★   │  ○   │             │
│                          │       │     │       │      │      │      │     │     │      │      │      │             │
│  Scheduler               │  ★★   │  ○  │ ★★★   │  ★★  │  ★★  │  ★★  │  ★  │ ★★  │  ★   │  ★★  │  ○   │             │
│                          │       │     │       │      │      │      │     │     │      │      │      │             │
│  Operator                │  ○    │  ○  │  ★    │ ★★★  │  ○   │  ○   │  ★  │  ★  │  ○   │  ○   │  ○   │             │
│                          │       │     │       │      │      │      │     │     │      │      │      │             │
│  Receiving Clerk         │  ★    │  ○  │  ★    │  ○   │ ★★★  │  ★   │  ★  │ ★★★ │  ○   │  ★   │  ○   │             │
│                          │       │     │       │      │      │      │     │     │      │      │      │             │
│  Shipping Clerk          │  ★    │  ○  │  ★★   │  ○   │  ★   │ ★★★  │  ★  │ ★★  │  ○   │  ★   │  ○   │             │
│                          │       │     │       │      │      │      │     │     │      │      │      │             │
│  QC Inspector            │  ★    │  ○  │  ★    │  ★★  │  ★★  │  ★★  │ ★★★ │ ★★  │  ○   │  ★   │  ○   │             │
│                          │       │     │       │      │      │      │     │     │      │      │      │             │
│  Customer Portal         │  ★★   │  ○  │  ○    │  ○   │  ○   │  ★   │  ○  │  ★  │  ★   │  ★   │  ○   │             │
│                          │       │     │       │      │      │      │     │     │      │      │      │             │
│  Branch Manager          │  ★★   │  ★  │  ★★   │  ★   │  ★★  │  ★★  │  ★★ │ ★★  │ ★★★  │ ★★★  │  ★★  │             │
│                          │       │     │       │      │      │      │     │     │      │      │      │             │
│  Division Manager        │  ★    │  ○  │  ★    │  ○   │  ★   │  ★   │  ★  │ ★★  │ ★★★  │ ★★★  │  ★   │             │
│                          │       │     │       │      │      │      │     │     │      │      │      │             │
│  Finance                 │  ★    │  ○  │  ○    │  ○   │  ★   │  ★★  │  ○  │ ★★  │  ★★  │ ★★★  │  ★★  │             │
│                          │       │     │       │      │      │      │     │     │      │      │      │             │
│  ─────────────────────────┴───────┴─────┴───────┴──────┴──────┴──────┴─────┴─────┴──────┴──────┴──────┘             │
│                                                                                                                     │
│  Legend: ★★★ Primary Use  ★★ Regular Use  ★ Occasional Use  ○ No Access / Not Applicable                          │
│                                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 3.2 Module Expectations by Persona

### 3.2.1 Order Management Module

| Persona | Primary Use Case | Key Expectations |
|---------|------------------|------------------|
| **CSR** | Create/edit orders, quotes | Fast customer lookup, inventory ATP, one-click reorder, processing config, real-time pricing |
| **Counter** | Quick POS orders | Barcode scan, remnant lookup, simple checkout flow |
| **Scheduler** | View order details | See due dates, processing specs, customer priority |
| **Customer** | Place orders online | Product search, cart, checkout, order tracking |
| **Branch Mgr** | Order oversight | Order volume, value, pipeline visibility |

### 3.2.2 POS / Counter Module

| Persona | Primary Use Case | Key Expectations |
|---------|------------------|------------------|
| **Counter** | Ring sales, will-call | Fast scan, cash drawer, credit card, receipts |
| **CSR** | Occasional will-call | Process pickups when counter is busy |
| **Branch Mgr** | Cash reconciliation | Drawer reports, transaction history |

### 3.2.3 Scheduling Module

| Persona | Primary Use Case | Key Expectations |
|---------|------------------|------------------|
| **Scheduler** | Sequence all jobs | Drag-drop scheduling, capacity view, SLA indicators, what-if modeling |
| **CSR** | Check feasibility | See capacity before promising dates |
| **Operator** | View my queue | See what's next, when, priority |
| **Shipping** | Plan truck loading | Know when jobs will be ready |
| **Branch Mgr** | Capacity monitoring | Utilization, bottlenecks, backlog |

### 3.2.4 Shop Floor Module

| Persona | Primary Use Case | Key Expectations |
|---------|------------------|------------------|
| **Operator** | Execute jobs | Big buttons, job instructions, output recording, issue reporting |
| **Scheduler** | Monitor progress | Real-time job status, completion signals |
| **QC** | First-piece approval | Quick approve/reject workflow |
| **Branch Mgr** | Production visibility | Real-time throughput, downtime alerts |

### 3.2.5 Receiving Module

| Persona | Primary Use Case | Key Expectations |
|---------|------------------|------------------|
| **Receiving** | Check in material | PO matching, weight verification, location assignment, tag printing |
| **Scheduler** | Material availability | Know when toll material arrives |
| **QC** | Incoming inspection | Hold/release workflow |
| **Purchasing** | Receipt confirmation | PO closeout visibility |

### 3.2.6 Shipping Module

| Persona | Primary Use Case | Key Expectations |
|---------|------------------|------------------|
| **Shipping** | Load trucks, BOL | Staging queue, BOL generation, carrier integration, POD capture |
| **CSR** | Track shipments | Know when orders shipped, tracking numbers |
| **Scheduler** | Coordinate staging | Ensure jobs ready for ship time |
| **Customer** | Delivery visibility | Tracking, ETA, notifications |
| **Finance** | Billing trigger | Ship confirmation triggers invoice |

### 3.2.7 Quality Module

| Persona | Primary Use Case | Key Expectations |
|---------|------------------|------------------|
| **QC** | All inspections | Checklists, measurements, hold/release, NCR creation, cert management |
| **Operator** | First-piece checks | Simple pass/fail, escalate to QC |
| **Receiving** | Incoming quality | Damage notes, inspection requests |
| **Shipping** | Cert inclusion | Attach MTRs to shipments |

### 3.2.8 Inventory Module

| Persona | Primary Use Case | Key Expectations |
|---------|------------------|------------------|
| **CSR** | Check availability | Real-time ATP, location visibility |
| **Receiving** | Put-away | Location assignment, tag printing |
| **Shipping** | Pick/stage | Find material, confirm picks |
| **Scheduler** | Material status | Is material available for scheduled job? |
| **Branch Mgr** | Inventory health | Value, turns, aging, accuracy |
| **Division Mgr** | Network inventory | Cross-location visibility, rebalancing |

### 3.2.9 Pricing Module

| Persona | Primary Use Case | Key Expectations |
|---------|------------------|------------------|
| **CSR** | Quote pricing | Customer-specific pricing, processing charges |
| **Branch Mgr** | Pricing authority | Discount approval, margin visibility |
| **Division Mgr** | Price strategy | Price management, margin analysis |
| **Finance** | Margin reporting | Actual vs. standard, trends |

### 3.2.10 Dashboard / Analytics Module

| Persona | Primary Use Case | Key Expectations |
|---------|------------------|------------------|
| **Branch Mgr** | Branch performance | Revenue, margin, OTIF, safety, utilization |
| **Division Mgr** | Division performance | Cross-branch comparison, trends, product performance |
| **Finance** | Financial metrics | AR, margin, cash flow, close progress |
| **Scheduler** | Operational metrics | SLA health, capacity, throughput |
| **CSR** | Sales metrics | My orders, hit rate, revenue |

---

## 3.3 Feature Priority by Persona

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         TOP 5 FEATURE PRIORITIES BY PERSONA                                        │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                     │
│  CSR / INSIDE SALES                                                                                                │
│  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────    │
│  1. ⭐ One-click customer lookup with recent orders and pricing                                                    │
│  2. ⭐ Real-time inventory ATP across all locations                                                                │
│  3. ⭐ Integrated processing configuration in order entry                                                          │
│  4. ⭐ Delivery date promise with SLA confidence indicator                                                         │
│  5. ⭐ Quote-to-order conversion tracking                                                                          │
│                                                                                                                     │
│  COUNTER SALES                                                                                                     │
│  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────    │
│  1. ⭐ Fast barcode scan for products and remnants                                                                 │
│  2. ⭐ Simple POS with multiple payment types                                                                      │
│  3. ⭐ Will-call order lookup and processing                                                                       │
│  4. ⭐ Quick quote for walk-in customers                                                                           │
│  5. ⭐ Inventory location finder ("where is it?")                                                                  │
│                                                                                                                     │
│  SCHEDULER / PLANNER                                                                                               │
│  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────    │
│  1. ⭐ Visual drag-and-drop schedule board                                                                         │
│  2. ⭐ Real-time SLA health indicators on every job                                                                │
│  3. ⭐ Capacity utilization view by work center                                                                    │
│  4. ⭐ Material availability check before scheduling                                                               │
│  5. ⭐ Automatic schedule suggestions for new orders                                                               │
│                                                                                                                     │
│  SHOP FLOOR OPERATOR                                                                                               │
│  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────    │
│  1. ⭐ Big-button touch interface (works with gloves)                                                              │
│  2. ⭐ Clear job instructions with material location                                                               │
│  3. ⭐ One-tap output and scrap recording                                                                          │
│  4. ⭐ Easy issue reporting (machine, material, quality)                                                           │
│  5. ⭐ Visible queue showing "what's next"                                                                         │
│                                                                                                                     │
│  SHIPPING / RECEIVING                                                                                              │
│  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────    │
│  1. ⭐ PO matching on receipt with discrepancy handling                                                            │
│  2. ⭐ Digital BOL generation with e-signature capture                                                             │
│  3. ⭐ Staging queue showing what's ready to ship                                                                  │
│  4. ⭐ Carrier integration for tracking and labels                                                                 │
│  5. ⭐ Photo capture for damage documentation                                                                      │
│                                                                                                                     │
│  QC INSPECTOR                                                                                                      │
│  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────    │
│  1. ⭐ Digital inspection checklists with measurement recording                                                    │
│  2. ⭐ Hold/release workflow with visibility to scheduling                                                         │
│  3. ⭐ MTR search and attachment to shipments                                                                      │
│  4. ⭐ NCR creation and tracking workflow                                                                          │
│  5. ⭐ Calibration schedule and compliance tracking                                                                │
│                                                                                                                     │
│  CUSTOMER PORTAL                                                                                                   │
│  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────    │
│  1. ⭐ Real-time order status with processing progress                                                             │
│  2. ⭐ Self-service reordering from order history                                                                  │
│  3. ⭐ Document access (invoices, MTRs, BOLs)                                                                      │
│  4. ⭐ Online quote requests with response tracking                                                                │
│  5. ⭐ Delivery tracking with ETA and notifications                                                                │
│                                                                                                                     │
│  BRANCH MANAGER                                                                                                    │
│  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────    │
│  1. ⭐ Real-time branch dashboard (revenue, OTIF, backlog)                                                         │
│  2. ⭐ Exception alerts for SLA risk, quality holds, safety                                                        │
│  3. ⭐ Drill-down from summary to detail                                                                           │
│  4. ⭐ Staff performance visibility                                                                                │
│  5. ⭐ Customer health indicators (at-risk accounts)                                                               │
│                                                                                                                     │
│  DIVISION MANAGER                                                                                                  │
│  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────    │
│  1. ⭐ Cross-location performance comparison                                                                       │
│  2. ⭐ Product line profitability analysis                                                                         │
│  3. ⭐ Network inventory visibility and rebalancing                                                                │
│  4. ⭐ Pricing realization vs. list                                                                                │
│  5. ⭐ Customer analytics across all branches                                                                      │
│                                                                                                                     │
│  FINANCE / CORPORATE                                                                                               │
│  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────    │
│  1. ⭐ Automated billing trigger on shipment confirmation                                                          │
│  2. ⭐ AR aging with collection workflow                                                                           │
│  3. ⭐ Margin reporting by product, customer, branch                                                               │
│  4. ⭐ Inventory valuation reporting                                                                               │
│  5. ⭐ Audit trail for all transactions                                                                            │
│                                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 4. SUMMARY TABLES

## 4.1 Persona Quick Reference

| Persona | Division | Location | Primary Tool | #1 Pain Point | #1 KPI |
|---------|----------|----------|--------------|---------------|--------|
| CSR | All | Branch | Phone + ERP | Multiple systems to toggle | Quote conversion |
| Counter | Outlet | Single | POS | Remnant pricing | Transactions/day |
| Scheduler | Metals/Plastics | Branch/Region | Board + ERP | No real-time visibility | OTIF |
| Operator | Assigned WC | Single | Machine + Paper | Paper job tickets lost | Jobs/shift |
| Ship/Recv | All | Single | Forklift + Paper | Paper BOLs | Accuracy |
| QC | All | Single | Tools + Paper | MTR retrieval | First-pass yield |
| Customer | N/A | External | Email + Phone | Can't see order status | On-time delivery |
| Branch Mgr | All | Single | Reports | Delayed reports | Revenue/Margin |
| Division Mgr | Single Div | All Locations | BI + Travel | No unified view | Division revenue |
| Finance | All | Corporate | ERP + Excel | Month-end crunch | DSO |

## 4.2 Handoff Criticality

| Handoff | From | To | Frequency | Failure Impact | Priority |
|---------|------|-----|-----------|----------------|----------|
| Order → Schedule | CSR | Scheduler | Per order | Missed SLA | 🔴 Critical |
| Schedule → Execute | Scheduler | Operator | Per job | Production delay | 🔴 Critical |
| Complete → Ship | Operator | Shipping | Per job | Late delivery | 🔴 Critical |
| Ship → Bill | Shipping | Finance | Per shipment | Revenue delay | 🟡 High |
| Receive → Schedule | Receiving | Scheduler | Per toll order | Job blocked | 🟡 High |
| QC Hold → Release | QC | Scheduler | As needed | Shipment delayed | 🟡 High |
| Status → Customer | System | Customer | Real-time | Customer calls | 🟢 Medium |

---

*Document Version: 1.0*
*Created: January 2026*
*AlroWare Platform - Service Center Persona Catalog*
