# 54 — Build Domain Summary

> **Purpose:** Machine-friendly domain summary for UI and system implementation.  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. domain_glossary

```json
[
  { "term": "Coil", "category": "material", "definition": "Steel wound into cylindrical form; base unit for flat-rolled inventory measured in lbs with unique coil_id" },
  { "term": "Master Coil", "category": "material", "definition": "Full-width coil as received from mill; source for slitting into narrower mults" },
  { "term": "Mult", "category": "material", "definition": "Narrower coil produced by slitting a master coil; retains parent coil traceability" },
  { "term": "Sheet", "category": "material", "definition": "Flat rectangular piece cut from coil via cut-to-length (CTL) process" },
  { "term": "Blank", "category": "material", "definition": "Pre-cut shape from sheet or coil ready for forming or fabrication" },
  { "term": "Bar Stock", "category": "material", "definition": "Solid metal in round, square, hex, or flat bar form; measured by length and weight" },
  { "term": "Plate", "category": "material", "definition": "Thick flat steel (>3/16 inch); sold by weight or piece" },
  { "term": "Tubing", "category": "material", "definition": "Hollow structural or mechanical tube in round, square, or rectangular form" },
  { "term": "Resin", "category": "material", "definition": "Raw plastic pellets or granules; base material for plastics processing" },
  { "term": "Masterbatch", "category": "material", "definition": "Concentrated color or additive mixed with base resin during molding" },
  { "term": "Regrind", "category": "material", "definition": "Recycled plastic from runners or scrap; limited percentage allowed per spec" },
  { "term": "Heat Number", "category": "material", "definition": "Mill-assigned identifier tracing steel to specific melt batch; required for MTR linkage" },
  { "term": "Lot Number", "category": "material", "definition": "Batch identifier for plastics or processed materials; ties to COA" },
  { "term": "MTR", "category": "doc", "definition": "Mill Test Report; certified document showing chemistry and mechanical properties of steel heat" },
  { "term": "COA", "category": "doc", "definition": "Certificate of Analysis; certified document for plastics showing resin properties" },
  { "term": "BOL", "category": "doc", "definition": "Bill of Lading; shipping document serving as receipt and contract of carriage" },
  { "term": "Packing List", "category": "doc", "definition": "Document listing all items in a shipment with quantities and identifiers" },
  { "term": "Work Order", "category": "process", "definition": "Instruction set for processing material; contains routing, BOM, and specifications" },
  { "term": "Job", "category": "process", "definition": "Customer-facing grouping of one or more work orders for a single order line" },
  { "term": "Routing", "category": "process", "definition": "Sequence of operations required to complete a work order" },
  { "term": "Operation", "category": "process", "definition": "Single processing step within a routing performed at a work center" },
  { "term": "Work Center", "category": "process", "definition": "Production resource (machine, cell, or area) where operations are performed" },
  { "term": "Slitting", "category": "process", "definition": "Cutting master coil lengthwise into narrower widths using rotary knives" },
  { "term": "CTL", "category": "process", "definition": "Cut-to-Length; processing coil into flat sheets of specified length" },
  { "term": "Leveling", "category": "process", "definition": "Flattening coil or sheet to remove coil set, crossbow, and edge wave" },
  { "term": "Blanking", "category": "process", "definition": "Stamping or shearing shapes from sheet or coil using dies" },
  { "term": "Shearing", "category": "process", "definition": "Cutting sheet or plate to size using straight blade shear" },
  { "term": "Sawing", "category": "process", "definition": "Cutting bar, tube, or plate using band saw or cold saw" },
  { "term": "Plasma Cutting", "category": "process", "definition": "CNC thermal cutting using ionized gas for plate and sheet" },
  { "term": "Laser Cutting", "category": "process", "definition": "CNC precision cutting using focused laser beam" },
  { "term": "Forming", "category": "process", "definition": "Bending or shaping metal using press brakes or roll formers" },
  { "term": "Injection Molding", "category": "process", "definition": "Melting plastic resin and injecting into mold cavity under pressure" },
  { "term": "Extrusion", "category": "process", "definition": "Forcing melted plastic through die to create continuous profile" },
  { "term": "Thermoforming", "category": "process", "definition": "Heating plastic sheet and forming over mold using vacuum or pressure" },
  { "term": "Allocation", "category": "business", "definition": "Reserving specific inventory for a customer order; reduces ATP" },
  { "term": "ATP", "category": "business", "definition": "Available-to-Promise; inventory available for new orders after allocations" },
  { "term": "CTP", "category": "business", "definition": "Capable-to-Promise; considering production capacity in promise date" },
  { "term": "RFQ", "category": "business", "definition": "Request for Quote; customer inquiry requiring pricing response" },
  { "term": "Quote", "category": "business", "definition": "Formal pricing offer to customer with defined validity period" },
  { "term": "Sales Order", "category": "business", "definition": "Confirmed customer order with pricing, quantities, and delivery dates" },
  { "term": "PO", "category": "business", "definition": "Purchase Order; order placed with supplier for material replenishment" },
  { "term": "Release", "category": "business", "definition": "Scheduled shipment against blanket order or contract" },
  { "term": "Blanket Order", "category": "business", "definition": "Long-term agreement with total quantity; shipped via releases" },
  { "term": "Consignment", "category": "business", "definition": "Inventory held at customer site; owned by seller until consumed" },
  { "term": "VMI", "category": "business", "definition": "Vendor Managed Inventory; seller monitors and replenishes customer stock" },
  { "term": "Drop Ship", "category": "business", "definition": "Shipping directly from mill or supplier to customer location" },
  { "term": "Will Call", "category": "business", "definition": "Customer picks up order at service center location" },
  { "term": "Surcharge", "category": "business", "definition": "Additional charge applied to base price for market conditions or services" },
  { "term": "Yield", "category": "business", "definition": "Percentage of input material converted to saleable output" },
  { "term": "Kerf", "category": "business", "definition": "Material lost during cutting process; width of cut" },
  { "term": "Prime Material", "category": "business", "definition": "First-quality material meeting all specifications" },
  { "term": "Secondary", "category": "business", "definition": "Off-spec material sold at discount; minor defects or excess inventory" },
  { "term": "Excess", "category": "business", "definition": "Inventory beyond demand forecast; candidate for promotion or liquidation" },
  { "term": "Obsolete", "category": "business", "definition": "Material no longer in demand; marked for disposal or liquidation" },
  { "term": "Toll Processing", "category": "business", "definition": "Processing customer-owned material for a service fee only" },
  { "term": "OSP", "category": "business", "definition": "Outside Processing; sending material to subcontractor for operations" },
  { "term": "Inside Sales Rep", "category": "role", "definition": "Handles quotes, orders, and customer communication from office" },
  { "term": "Outside Sales Rep", "category": "role", "definition": "Field-based sales role managing customer relationships and prospecting" },
  { "term": "Floor Supervisor", "category": "role", "definition": "Manages shop floor personnel and daily production execution" },
  { "term": "Machine Operator", "category": "role", "definition": "Runs specific equipment and performs production operations" },
  { "term": "Material Handler", "category": "role", "definition": "Moves material between locations using forklift or crane" },
  { "term": "Shipping Clerk", "category": "role", "definition": "Prepares shipments, creates documents, coordinates carriers" },
  { "term": "Receiving Clerk", "category": "role", "definition": "Inspects and receives inbound material, updates inventory" },
  { "term": "Quality Inspector", "category": "role", "definition": "Performs inspections, manages NCRs, ensures compliance" },
  { "term": "Inventory Planner", "category": "role", "definition": "Manages stock levels, reorder points, and replenishment" },
  { "term": "Production Planner", "category": "role", "definition": "Schedules work orders and manages capacity allocation" }
]
```

---

## 2. domain_actors

```json
[
  {
    "id": "CUSTOMER",
    "label": "Customer",
    "description": "External entity purchasing material or services",
    "internal": false,
    "examples": ["OEM manufacturer", "Fabrication shop", "Construction contractor", "Distributor"]
  },
  {
    "id": "SUPPLIER",
    "label": "Supplier / Mill",
    "description": "External entity providing raw material or services",
    "internal": false,
    "examples": ["Steel mill", "Resin manufacturer", "Tube mill", "OSP vendor"]
  },
  {
    "id": "CARRIER",
    "label": "Freight Carrier",
    "description": "External entity providing transportation services",
    "internal": false,
    "examples": ["LTL carrier", "Truckload carrier", "Flatbed hauler", "Courier"]
  },
  {
    "id": "INSIDE_SALES",
    "label": "Inside Sales Representative",
    "description": "Processes quotes, enters orders, handles customer inquiries from office",
    "internal": true,
    "examples": ["Quote entry", "Order entry", "Pricing lookup", "Customer callback"]
  },
  {
    "id": "OUTSIDE_SALES",
    "label": "Outside Sales Representative",
    "description": "Field-based role managing accounts and developing new business",
    "internal": true,
    "examples": ["Customer visit", "Quote follow-up", "New prospect meeting", "Contract negotiation"]
  },
  {
    "id": "SALES_MANAGER",
    "label": "Sales Manager",
    "description": "Manages sales team, approves pricing exceptions, owns revenue targets",
    "internal": true,
    "examples": ["Pricing approval", "Territory assignment", "Commission review", "Customer escalation"]
  },
  {
    "id": "FLOOR_SUPERVISOR",
    "label": "Floor Supervisor",
    "description": "Manages shop floor execution, assigns work, resolves production issues",
    "internal": true,
    "examples": ["Shift handoff", "Work assignment", "Problem resolution", "Labor tracking"]
  },
  {
    "id": "MACHINE_OPERATOR",
    "label": "Machine Operator",
    "description": "Operates production equipment and executes work orders",
    "internal": true,
    "examples": ["Slitter operator", "Saw operator", "Press operator", "Laser operator"]
  },
  {
    "id": "MATERIAL_HANDLER",
    "label": "Material Handler",
    "description": "Moves material using forklift or crane between locations",
    "internal": true,
    "examples": ["Staging material", "Putaway", "Picking", "Loading trucks"]
  },
  {
    "id": "SHIPPING_CLERK",
    "label": "Shipping Clerk",
    "description": "Prepares shipments, generates documents, coordinates pickups",
    "internal": true,
    "examples": ["BOL creation", "Label printing", "Carrier scheduling", "Load verification"]
  },
  {
    "id": "RECEIVING_CLERK",
    "label": "Receiving Clerk",
    "description": "Receives inbound material, performs inspection, updates inventory",
    "internal": true,
    "examples": ["PO receipt", "Weight verification", "MTR collection", "Putaway direction"]
  },
  {
    "id": "QA_INSPECTOR",
    "label": "Quality Assurance Inspector",
    "description": "Performs quality checks, manages NCRs, ensures spec compliance",
    "internal": true,
    "examples": ["Dimensional check", "Visual inspection", "MTR review", "NCR creation"]
  },
  {
    "id": "INVENTORY_PLANNER",
    "label": "Inventory Planner",
    "description": "Manages stock levels, forecasts, and replenishment decisions",
    "internal": true,
    "examples": ["Reorder analysis", "Safety stock review", "Slow mover disposition", "ABC classification"]
  },
  {
    "id": "PRODUCTION_PLANNER",
    "label": "Production Planner",
    "description": "Schedules work orders, manages capacity, sequences jobs",
    "internal": true,
    "examples": ["Weekly scheduling", "Capacity analysis", "Priority override", "Rush order insertion"]
  },
  {
    "id": "PURCHASING_AGENT",
    "label": "Purchasing Agent",
    "description": "Sources material, places POs, manages supplier relationships",
    "internal": true,
    "examples": ["PO creation", "Price negotiation", "Supplier evaluation", "Lead time tracking"]
  },
  {
    "id": "AR_CLERK",
    "label": "Accounts Receivable Clerk",
    "description": "Manages customer invoicing and payment collection",
    "internal": true,
    "examples": ["Invoice generation", "Payment application", "Collection call", "Credit memo"]
  },
  {
    "id": "AP_CLERK",
    "label": "Accounts Payable Clerk",
    "description": "Processes supplier invoices and manages payments",
    "internal": true,
    "examples": ["Invoice matching", "Payment processing", "Vendor statement reconciliation"]
  },
  {
    "id": "CREDIT_MANAGER",
    "label": "Credit Manager",
    "description": "Sets credit limits, manages credit holds, approves exceptions",
    "internal": true,
    "examples": ["Credit application review", "Limit increase", "Hold release", "Risk assessment"]
  },
  {
    "id": "BRANCH_MANAGER",
    "label": "Branch/Location Manager",
    "description": "Oversees all operations at a single service center location",
    "internal": true,
    "examples": ["P&L ownership", "Staffing", "Customer escalation", "Capex requests"]
  },
  {
    "id": "SYSTEM_ADMIN",
    "label": "System Administrator",
    "description": "Manages system configuration, users, and integrations",
    "internal": true,
    "examples": ["User provisioning", "Role assignment", "Integration config", "System monitoring"]
  }
]
```

---

## 3. domain_processes

```json
[
  {
    "id": "PROC-001",
    "name": "Quote Creation",
    "description": "Generate pricing proposal for customer inquiry",
    "primary_actors": ["INSIDE_SALES", "OUTSIDE_SALES"],
    "trigger": "Customer RFQ received via phone, email, portal, or EDI",
    "outcome": "Quote document with pricing, validity, and terms sent to customer"
  },
  {
    "id": "PROC-002",
    "name": "Order Entry",
    "description": "Capture confirmed customer order into system",
    "primary_actors": ["INSIDE_SALES"],
    "trigger": "Customer PO received or quote accepted",
    "outcome": "Sales order created with allocations and scheduled dates"
  },
  {
    "id": "PROC-003",
    "name": "Credit Check",
    "description": "Validate customer creditworthiness before order confirmation",
    "primary_actors": ["CREDIT_MANAGER"],
    "trigger": "Order submission or order value exceeds threshold",
    "outcome": "Order approved, held for review, or rejected"
  },
  {
    "id": "PROC-004",
    "name": "Inventory Allocation",
    "description": "Reserve specific material for customer order",
    "primary_actors": ["INSIDE_SALES", "INVENTORY_PLANNER"],
    "trigger": "Order confirmed and credit approved",
    "outcome": "Inventory allocated with location and lot assignment"
  },
  {
    "id": "PROC-005",
    "name": "Work Order Generation",
    "description": "Create production instructions from order requirements",
    "primary_actors": ["PRODUCTION_PLANNER"],
    "trigger": "Order requires processing or order confirmed",
    "outcome": "Work orders created with routing, BOM, and due dates"
  },
  {
    "id": "PROC-006",
    "name": "Production Scheduling",
    "description": "Sequence work orders across work centers considering capacity",
    "primary_actors": ["PRODUCTION_PLANNER", "FLOOR_SUPERVISOR"],
    "trigger": "Work orders released or schedule refresh cycle",
    "outcome": "Scheduled work orders with planned start/end times"
  },
  {
    "id": "PROC-007",
    "name": "Work Order Execution",
    "description": "Perform physical processing operations on material",
    "primary_actors": ["MACHINE_OPERATOR", "FLOOR_SUPERVISOR"],
    "trigger": "Work order released to floor with material staged",
    "outcome": "Processed material with labor/time recorded"
  },
  {
    "id": "PROC-008",
    "name": "Quality Inspection",
    "description": "Verify material meets specifications",
    "primary_actors": ["QA_INSPECTOR", "MACHINE_OPERATOR"],
    "trigger": "Receiving complete, operation complete, or shipment staged",
    "outcome": "Material released, held, or NCR created"
  },
  {
    "id": "PROC-009",
    "name": "Material Receiving",
    "description": "Accept inbound material from supplier and update inventory",
    "primary_actors": ["RECEIVING_CLERK"],
    "trigger": "Truck arrival with material on open PO",
    "outcome": "Inventory updated, material put away, PO updated"
  },
  {
    "id": "PROC-010",
    "name": "Shipment Preparation",
    "description": "Stage material and create shipping documents",
    "primary_actors": ["SHIPPING_CLERK", "MATERIAL_HANDLER"],
    "trigger": "Order ready to ship and carrier scheduled",
    "outcome": "Material loaded, BOL generated, ASN sent"
  },
  {
    "id": "PROC-011",
    "name": "Invoicing",
    "description": "Generate customer invoice for shipped goods",
    "primary_actors": ["AR_CLERK"],
    "trigger": "Shipment confirmed or billing cycle",
    "outcome": "Invoice created and sent to customer"
  },
  {
    "id": "PROC-012",
    "name": "Purchase Order Creation",
    "description": "Order material from supplier for stock or customer order",
    "primary_actors": ["PURCHASING_AGENT", "INVENTORY_PLANNER"],
    "trigger": "Below reorder point, customer order requirement, or manual request",
    "outcome": "PO sent to supplier with confirmed delivery"
  },
  {
    "id": "PROC-013",
    "name": "Inventory Transfer",
    "description": "Move material between locations within company",
    "primary_actors": ["INVENTORY_PLANNER", "MATERIAL_HANDLER"],
    "trigger": "Rebalancing need or inter-branch order",
    "outcome": "Transfer order complete, inventory updated at both locations"
  },
  {
    "id": "PROC-014",
    "name": "NCR Processing",
    "description": "Document and resolve non-conforming material",
    "primary_actors": ["QA_INSPECTOR", "SALES_MANAGER"],
    "trigger": "Quality failure detected",
    "outcome": "Disposition decision with corrective action"
  },
  {
    "id": "PROC-015",
    "name": "Cycle Counting",
    "description": "Verify physical inventory matches system records",
    "primary_actors": ["MATERIAL_HANDLER", "INVENTORY_PLANNER"],
    "trigger": "Scheduled count or discrepancy investigation",
    "outcome": "Counts recorded, adjustments posted if needed"
  },
  {
    "id": "PROC-016",
    "name": "Customer Return",
    "description": "Process material returned by customer",
    "primary_actors": ["RECEIVING_CLERK", "SALES_MANAGER"],
    "trigger": "RMA request from customer",
    "outcome": "Material received, credit issued or replacement shipped"
  },
  {
    "id": "PROC-017",
    "name": "Price Update",
    "description": "Adjust pricing based on market or contract changes",
    "primary_actors": ["SALES_MANAGER", "PURCHASING_AGENT"],
    "trigger": "Mill price change, surcharge update, or contract renewal",
    "outcome": "Price lists updated, customer notifications sent"
  },
  {
    "id": "PROC-018",
    "name": "Toll Processing",
    "description": "Process customer-owned material for fee",
    "primary_actors": ["INSIDE_SALES", "FLOOR_SUPERVISOR"],
    "trigger": "Customer provides material for processing",
    "outcome": "Processed material returned, service invoiced"
  }
]
```

---

## 4. competitive_constraints

| constraint | cause | impact_on_UI | impact_on_system |
|------------|-------|--------------|------------------|
| Same-day shipping requirement | Customers expect immediate availability; competitors offer rapid fulfillment | Order entry must show real-time ATP and promise dates; shipping desk needs priority queue for same-day orders | Real-time inventory sync; cut-off time enforcement; carrier API integration for same-day pickups |
| Complex pricing models | Base price + surcharges + processing + freight + discounts creates pricing complexity | Pricing breakdown must be transparent; sales needs margin visibility before commit | Pricing engine must chain multiple rules; audit trail for price overrides; real-time commodity feeds |
| Material traceability requirements | Aerospace, automotive, nuclear customers require full heat/lot tracking | UI must display and search by heat number; cert lookup must be instant | Heat-to-piece chain in data model; MTR document linkage; traceability queries sub-second |
| Multi-location inventory visibility | Customers want stock from any branch; internal transfers common | Show inventory across all locations; allow cross-branch ordering in single cart | Federated inventory queries; transfer order automation; allocation across locations |
| Tight processing tolerances | Customer specs often tighter than standard; rejects are costly | Spec entry must capture all tolerance fields; operator alerts for critical dimensions | Spec validation at order entry; QC checkpoints with limit enforcement; SPC integration |
| Volatile material pricing | Commodity markets fluctuate weekly; surcharges change monthly | Pricing must show effective dates; quotes need validity enforcement | Price versioning; automatic surcharge updates; contract price freeze logic |
| EDI transaction volume | Large customers mandate EDI; hundreds of transactions daily | EDI errors need clear resolution UI; manual override for exceptions | EDI parser/generator; 997/855/856/810 handling; exception queue with workflow |
| Just-in-time delivery | Customers hold minimal stock; late delivery stops their production | Promise dates must be accurate; proactive delay alerts | CTP calculation with capacity; carrier tracking integration; automated exception notification |
| Custom processing combinations | Orders mix stock, processing, and outside services | Order entry must support mixed line types; routing builder needed | Flexible BOM/routing engine; OSP integration; consolidated invoicing |
| Credit risk exposure | Large orders from new or stressed customers create AR risk | Credit status visible at order entry; hold workflow for exceptions | Real-time credit check; automated hold logic; aging integration |
| Seasonal demand variation | Construction season, year-end buying create peaks | Capacity planning must show forward load; scheduling needs priority rules | Demand forecasting; capacity simulation; dynamic safety stock |
| Scrap and yield loss | Cutting and processing waste reduces margin if not controlled | Yield tracking per job visible; scrap reason codes required | Expected vs actual yield calculation; scrap cost allocation; operator accountability |

---

## 5. domain_invariants

```json
[
  {
    "id": "INV-001",
    "rule": "Every inventory item must belong to exactly one location",
    "enforcement": "Database constraint on inventory.location_id NOT NULL"
  },
  {
    "id": "INV-002",
    "rule": "Every inventory item must have an owner (company or customer for consignment)",
    "enforcement": "Database constraint on inventory.owner_id NOT NULL"
  },
  {
    "id": "INV-003",
    "rule": "Every sales order must have at least one order line",
    "enforcement": "Application validation before order save; database trigger"
  },
  {
    "id": "INV-004",
    "rule": "Order line quantity must be greater than zero",
    "enforcement": "Database CHECK constraint; UI validation"
  },
  {
    "id": "INV-005",
    "rule": "Steel material requiring traceability must have heat number assigned before shipment",
    "enforcement": "Ship workflow blocks if traceable flag true and heat_number null"
  },
  {
    "id": "INV-006",
    "rule": "Work order cannot be closed until all operations are complete or cancelled",
    "enforcement": "State machine transition rule; database trigger"
  },
  {
    "id": "INV-007",
    "rule": "Allocated quantity cannot exceed available quantity for an inventory item",
    "enforcement": "Transactional check with optimistic locking on allocation"
  },
  {
    "id": "INV-008",
    "rule": "Shipment weight must equal sum of line item weights within tolerance (±2%)",
    "enforcement": "Validation at ship confirm; warning if exceeded"
  },
  {
    "id": "INV-009",
    "rule": "Invoice total must equal sum of line totals plus taxes minus discounts",
    "enforcement": "Calculation at invoice creation; reconciliation check"
  },
  {
    "id": "INV-010",
    "rule": "Customer credit limit must not be exceeded without explicit override approval",
    "enforcement": "Credit check service; approval workflow for exceptions"
  },
  {
    "id": "INV-011",
    "rule": "Purchase order line must reference valid supplier item or material master",
    "enforcement": "Database foreign key; UI autocomplete validation"
  },
  {
    "id": "INV-012",
    "rule": "Material cannot be in two physical locations simultaneously",
    "enforcement": "Inventory movement creates debit/credit pair atomically"
  },
  {
    "id": "INV-013",
    "rule": "Regrind percentage in plastic molding cannot exceed specified maximum per product",
    "enforcement": "BOM validation; shop floor input cap"
  },
  {
    "id": "INV-014",
    "rule": "Quote validity date must be in the future at time of creation",
    "enforcement": "UI validation; API validation"
  },
  {
    "id": "INV-015",
    "rule": "Released work order cannot have routing changes without re-release",
    "enforcement": "State transition rule; change creates new version"
  },
  {
    "id": "INV-016",
    "rule": "Every coil produced from slitting must reference parent coil ID",
    "enforcement": "Slitting work order completion requires parent_coil_id"
  },
  {
    "id": "INV-017",
    "rule": "User can only access data for locations assigned to their role",
    "enforcement": "Row-level security in database; API middleware filter"
  },
  {
    "id": "INV-018",
    "rule": "Order cannot ship to customer on credit hold without manager override",
    "enforcement": "Shipping workflow checks customer status; approval queue"
  },
  {
    "id": "INV-019",
    "rule": "NCR disposition must be recorded before affected inventory can be used",
    "enforcement": "Inventory status flag; QC hold until NCR closed"
  },
  {
    "id": "INV-020",
    "rule": "Every tenant must have at least one admin user",
    "enforcement": "Tenant provisioning creates admin; prevent last admin deletion"
  }
]
```

---

## 6. optimization_objectives

```json
[
  {
    "id": "OPT-001",
    "objective": "Minimize order-to-ship cycle time for stock orders",
    "priority": "high",
    "owner_role": "FLOOR_SUPERVISOR"
  },
  {
    "id": "OPT-002",
    "objective": "Maximize inventory turns while maintaining 95%+ fill rate",
    "priority": "high",
    "owner_role": "INVENTORY_PLANNER"
  },
  {
    "id": "OPT-003",
    "objective": "Minimize setup time through intelligent job sequencing",
    "priority": "high",
    "owner_role": "PRODUCTION_PLANNER"
  },
  {
    "id": "OPT-004",
    "objective": "Maximize yield percentage on all cutting operations",
    "priority": "high",
    "owner_role": "MACHINE_OPERATOR"
  },
  {
    "id": "OPT-005",
    "objective": "Reduce quote-to-order conversion time below 24 hours average",
    "priority": "high",
    "owner_role": "INSIDE_SALES"
  },
  {
    "id": "OPT-006",
    "objective": "Minimize days sales outstanding (DSO) to under 35 days",
    "priority": "medium",
    "owner_role": "CREDIT_MANAGER"
  },
  {
    "id": "OPT-007",
    "objective": "Reduce scrap percentage to under 2% of processed weight",
    "priority": "medium",
    "owner_role": "FLOOR_SUPERVISOR"
  },
  {
    "id": "OPT-008",
    "objective": "Maintain work center utilization between 80-90%",
    "priority": "medium",
    "owner_role": "PRODUCTION_PLANNER"
  },
  {
    "id": "OPT-009",
    "objective": "Achieve 98%+ on-time delivery to customer request date",
    "priority": "high",
    "owner_role": "SHIPPING_CLERK"
  },
  {
    "id": "OPT-010",
    "objective": "Reduce receiving-to-putaway time to under 4 hours",
    "priority": "medium",
    "owner_role": "RECEIVING_CLERK"
  },
  {
    "id": "OPT-011",
    "objective": "Minimize slow-moving inventory value to under 5% of total",
    "priority": "medium",
    "owner_role": "INVENTORY_PLANNER"
  },
  {
    "id": "OPT-012",
    "objective": "Reduce NCR resolution time to under 3 business days average",
    "priority": "medium",
    "owner_role": "QA_INSPECTOR"
  },
  {
    "id": "OPT-013",
    "objective": "Maximize gross margin per order while staying competitive",
    "priority": "high",
    "owner_role": "SALES_MANAGER"
  },
  {
    "id": "OPT-014",
    "objective": "Reduce unplanned machine downtime to under 5% of scheduled hours",
    "priority": "medium",
    "owner_role": "FLOOR_SUPERVISOR"
  },
  {
    "id": "OPT-015",
    "objective": "Achieve 99%+ inventory accuracy through cycle counting",
    "priority": "high",
    "owner_role": "INVENTORY_PLANNER"
  },
  {
    "id": "OPT-016",
    "objective": "Minimize inter-branch transfer time to under 48 hours",
    "priority": "low",
    "owner_role": "INVENTORY_PLANNER"
  },
  {
    "id": "OPT-017",
    "objective": "Reduce customer wait time at will-call counter to under 15 minutes",
    "priority": "medium",
    "owner_role": "SHIPPING_CLERK"
  },
  {
    "id": "OPT-018",
    "objective": "Maximize processing capacity utilization during peak seasons",
    "priority": "high",
    "owner_role": "PRODUCTION_PLANNER"
  }
]
```

---

*Document generated for Build Phase: Domain Summary for UI and System Design*
