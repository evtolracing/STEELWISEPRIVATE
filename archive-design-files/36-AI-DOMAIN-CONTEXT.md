# 36 — AI Domain Context & Industry Fit

> **Purpose:** Structured domain summary for AI build targeting multi-location metals + plastics service centers (Alro-style operations).  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. Domain Glossary

```json
[
  {
    "term": "Heat",
    "definition": "A batch of metal produced in a single furnace pour, sharing identical chemistry and mechanical properties.",
    "aliases": ["Melt", "Cast"],
    "ai_relevance": "Traceability root for quality prediction and defect propagation modeling."
  },
  {
    "term": "Coil",
    "definition": "Rolled metal wound into a cylindrical form, typically 10,000–60,000 lbs.",
    "aliases": ["Master Coil", "Mother Coil"],
    "ai_relevance": "Primary inventory unit for yield optimization and slitting pattern ML."
  },
  {
    "term": "Slit Coil",
    "definition": "Narrow-width coil produced by slitting a master coil into multiple strips.",
    "aliases": ["Mults", "Strips"],
    "ai_relevance": "Output of slitting optimization; input to cut-to-length or further processing."
  },
  {
    "term": "Sheet",
    "definition": "Flat metal piece cut from coil or plate, defined by length × width × thickness.",
    "aliases": ["Blank", "Panel"],
    "ai_relevance": "Target of nesting/cutting optimization algorithms."
  },
  {
    "term": "Plate",
    "definition": "Thick flat metal (typically ≥3/16\") sold as discrete pieces or flame/plasma cut.",
    "aliases": ["Slab"],
    "ai_relevance": "Subject to 2D nesting optimization and remnant valuation."
  },
  {
    "term": "Bar",
    "definition": "Long solid metal product (round, square, hex, flat) sold by length or weight.",
    "aliases": ["Rod", "Billet"],
    "ai_relevance": "Linear cutting optimization (1D bin packing)."
  },
  {
    "term": "Tube / Pipe",
    "definition": "Hollow cylindrical product, measured by OD × Wall × Length.",
    "aliases": ["Hollow Section", "HSS"],
    "ai_relevance": "1D cutting with kerf and end-loss considerations."
  },
  {
    "term": "Structural",
    "definition": "Shaped profiles (angle, channel, beam, tee) for construction/fabrication.",
    "aliases": ["Shape", "Section"],
    "ai_relevance": "Complex cutting patterns with orientation constraints."
  },
  {
    "term": "Extrusion",
    "definition": "Aluminum or plastic profile pushed through a die, producing custom cross-sections.",
    "aliases": ["Profile", "Section"],
    "ai_relevance": "Die-specific run optimization and order batching."
  },
  {
    "term": "Polymer Sheet",
    "definition": "Plastic material in flat form (HDPE, UHMW, acetal, nylon, polycarbonate, acrylic).",
    "aliases": ["Plastic Sheet", "Engineering Plastic"],
    "ai_relevance": "Material-specific machining parameters and thermal constraints."
  },
  {
    "term": "Polymer Rod/Bar",
    "definition": "Solid plastic in round or rectangular cross-section for machining.",
    "aliases": ["Plastic Rod"],
    "ai_relevance": "Turning/milling optimization with thermal limits."
  },
  {
    "term": "Work Order",
    "definition": "Internal instruction to process material through one or more operations.",
    "aliases": ["Shop Order", "Production Order", "Job"],
    "ai_relevance": "Core scheduling entity; subject to sequencing optimization."
  },
  {
    "term": "Operation",
    "definition": "Single processing step (cut, slit, bend, drill, etc.) within a work order.",
    "aliases": ["Op", "Step", "Task"],
    "ai_relevance": "Atomic unit for capacity planning and ML time estimation."
  },
  {
    "term": "Work Center",
    "definition": "A machine or station capable of performing one or more operation types.",
    "aliases": ["Machine", "Station", "Cell"],
    "ai_relevance": "Capacity constraint node in scheduling optimization."
  },
  {
    "term": "Routing",
    "definition": "Ordered sequence of operations required to fulfill a work order.",
    "aliases": ["Process Plan", "Op Sequence"],
    "ai_relevance": "Subject to AI-generated routing recommendations."
  },
  {
    "term": "BOM",
    "definition": "Bill of Materials listing input materials and quantities for a finished product.",
    "aliases": ["Recipe", "Material List"],
    "ai_relevance": "Constraint for inventory allocation and substitution logic."
  },
  {
    "term": "Yield",
    "definition": "Percentage of input material converted to saleable output.",
    "aliases": ["Material Utilization", "Recovery"],
    "ai_relevance": "Primary optimization target for cutting/nesting ML."
  },
  {
    "term": "Kerf",
    "definition": "Material lost to the cutting blade/beam width.",
    "aliases": ["Cut Loss", "Blade Width"],
    "ai_relevance": "Critical parameter in cutting optimization models."
  },
  {
    "term": "Remnant",
    "definition": "Usable leftover material after processing, retained for future orders.",
    "aliases": ["Drop", "Offcut", "Skeleton"],
    "ai_relevance": "Inventory optimization and remnant-first allocation logic."
  },
  {
    "term": "Scrap",
    "definition": "Unusable leftover material sent for recycling/disposal.",
    "aliases": ["Waste", "Skeleton"],
    "ai_relevance": "Scrap prediction for margin protection."
  },
  {
    "term": "MTR",
    "definition": "Mill Test Report certifying material chemistry and mechanical properties.",
    "aliases": ["Cert", "Mill Cert", "Test Certificate"],
    "ai_relevance": "Document extraction target for AI-OCR and property matching."
  },
  {
    "term": "Grade",
    "definition": "Material specification defining chemistry, strength, and other properties.",
    "aliases": ["Alloy", "Spec", "Specification"],
    "ai_relevance": "Substitution logic and compliance matching."
  },
  {
    "term": "Tolerance",
    "definition": "Allowable deviation from nominal dimension.",
    "aliases": ["Spec Limit", "Deviation"],
    "ai_relevance": "Quality prediction and machine capability matching."
  },
  {
    "term": "Lead Time",
    "definition": "Time from order placement to delivery/pickup.",
    "aliases": ["Delivery Time", "Turnaround"],
    "ai_relevance": "Due date prediction and promise date optimization."
  },
  {
    "term": "Quote",
    "definition": "Priced proposal for customer order, valid for specified period.",
    "aliases": ["Quotation", "Estimate", "Bid"],
    "ai_relevance": "Pricing optimization and win probability prediction."
  },
  {
    "term": "RFQ",
    "definition": "Request for Quotation from customer, often via portal or EDI.",
    "aliases": ["Inquiry", "Bid Request"],
    "ai_relevance": "NLP extraction and automated quote generation."
  },
  {
    "term": "PO",
    "definition": "Purchase Order from customer authorizing production/shipment.",
    "aliases": ["Customer Order", "Sales Order"],
    "ai_relevance": "Demand signal for forecasting and scheduling."
  },
  {
    "term": "BOL",
    "definition": "Bill of Lading documenting shipment for carrier and receiver.",
    "aliases": ["Shipping Document"],
    "ai_relevance": "Document generation and compliance validation."
  },
  {
    "term": "COC",
    "definition": "Certificate of Conformance attesting material meets specifications.",
    "aliases": ["Conformance Cert"],
    "ai_relevance": "Automated generation from test data."
  },
  {
    "term": "Will-Call",
    "definition": "Customer pickup at service center location.",
    "aliases": ["Counter Sale", "Walk-In"],
    "ai_relevance": "Demand pattern for inventory positioning."
  },
  {
    "term": "Hot Order",
    "definition": "Urgent order requiring expedited processing.",
    "aliases": ["Rush", "Priority", "Expedite"],
    "ai_relevance": "Scheduling disruption factor and priority weighting."
  },
  {
    "term": "Promise Date",
    "definition": "Committed delivery/ready date communicated to customer.",
    "aliases": ["Due Date", "Ship Date"],
    "ai_relevance": "SLA prediction and schedule feasibility checking."
  },
  {
    "term": "Capacity",
    "definition": "Available processing time or throughput at a work center.",
    "aliases": ["Bandwidth", "Availability"],
    "ai_relevance": "Constraint in scheduling optimization."
  },
  {
    "term": "Utilization",
    "definition": "Percentage of available capacity actually consumed by production.",
    "aliases": ["Load Factor"],
    "ai_relevance": "KPI for capacity planning ML."
  },
  {
    "term": "Cycle Time",
    "definition": "Time to complete one unit/piece through an operation.",
    "aliases": ["Process Time", "Run Time"],
    "ai_relevance": "Target of time estimation ML models."
  },
  {
    "term": "Setup Time",
    "definition": "Time to prepare a work center for a new job (tooling, calibration).",
    "aliases": ["Changeover", "Make-Ready"],
    "ai_relevance": "Sequence-dependent setup optimization."
  },
  {
    "term": "Throughput",
    "definition": "Volume of material processed per unit time.",
    "aliases": ["Production Rate", "Output Rate"],
    "ai_relevance": "Capacity model parameter."
  },
  {
    "term": "OEE",
    "definition": "Overall Equipment Effectiveness (Availability × Performance × Quality).",
    "aliases": ["Equipment Efficiency"],
    "ai_relevance": "Machine learning target for predictive maintenance."
  },
  {
    "term": "Downtime",
    "definition": "Period when work center is unavailable (maintenance, breakdown, changeover).",
    "aliases": ["Outage"],
    "ai_relevance": "Predictive maintenance and schedule robustness."
  },
  {
    "term": "Inventory Turn",
    "definition": "Ratio of annual sales to average inventory value.",
    "aliases": ["Stock Turn", "Turnover"],
    "ai_relevance": "Inventory optimization KPI."
  },
  {
    "term": "Safety Stock",
    "definition": "Buffer inventory to absorb demand variability.",
    "aliases": ["Buffer Stock", "Reserve"],
    "ai_relevance": "Dynamic calculation by demand forecasting ML."
  },
  {
    "term": "Reorder Point",
    "definition": "Inventory level triggering replenishment order.",
    "aliases": ["ROP", "Min Level"],
    "ai_relevance": "AI-optimized based on lead time and demand."
  },
  {
    "term": "ABC Classification",
    "definition": "Inventory segmentation by value/velocity (A=high, C=low).",
    "aliases": ["Pareto Class"],
    "ai_relevance": "Stocking strategy differentiation."
  },
  {
    "term": "Substitution",
    "definition": "Using alternate material when primary is unavailable.",
    "aliases": ["Alt Material", "Equivalent"],
    "ai_relevance": "AI-driven substitution recommendations."
  },
  {
    "term": "Allocation",
    "definition": "Reserving specific inventory for a customer order.",
    "aliases": ["Reserve", "Commitment"],
    "ai_relevance": "Inventory optimization and order promising."
  },
  {
    "term": "Provenance",
    "definition": "Complete traceability chain from source through processing to delivery.",
    "aliases": ["Traceability", "Chain of Custody"],
    "ai_relevance": "Graph-based lineage for compliance and quality."
  },
  {
    "term": "Tenant",
    "definition": "A customer organization in the multi-tenant SaaS platform.",
    "aliases": ["Customer", "Account"],
    "ai_relevance": "Data isolation boundary; tenant-specific ML models."
  },
  {
    "term": "Division",
    "definition": "Business segment within a tenant (Steel, Aluminum, Plastics, etc.).",
    "aliases": ["Business Unit", "Product Line"],
    "ai_relevance": "Model segmentation for division-specific optimization."
  },
  {
    "term": "Location",
    "definition": "Physical facility (warehouse, service center, branch).",
    "aliases": ["Site", "Branch", "Facility"],
    "ai_relevance": "Inventory positioning and transfer optimization."
  }
]
```

---

## 2. Domain Actors

```json
[
  {
    "actor": "Customer",
    "subtypes": [
      "OEM Manufacturer",
      "Job Shop / Fabricator",
      "Contractor",
      "Distributor / Reseller",
      "Walk-In / Will-Call",
      "E-Commerce Buyer"
    ],
    "primary_interactions": [
      "Submit RFQ",
      "Place Order",
      "Request Quote",
      "Track Order Status",
      "Download Documents (MTR, COC, BOL)",
      "Pay Invoice"
    ],
    "ai_touchpoints": [
      "Pricing recommendations",
      "Lead time predictions",
      "Product substitution suggestions",
      "Reorder reminders"
    ]
  },
  {
    "actor": "Inside Sales Rep",
    "responsibilities": [
      "Process quotes and orders",
      "Answer customer inquiries",
      "Manage customer accounts",
      "Coordinate with shop floor"
    ],
    "ai_touchpoints": [
      "AI-assisted quoting",
      "Win probability scoring",
      "Cross-sell / upsell recommendations",
      "Automated order entry from RFQ"
    ]
  },
  {
    "actor": "Outside Sales Rep",
    "responsibilities": [
      "Develop new accounts",
      "Manage key accounts",
      "Negotiate contracts",
      "Field customer visits"
    ],
    "ai_touchpoints": [
      "Customer churn prediction",
      "Opportunity scoring",
      "Territory optimization",
      "Pricing elasticity guidance"
    ]
  },
  {
    "actor": "Counter Sales / POS Operator",
    "responsibilities": [
      "Handle walk-in customers",
      "Process will-call pickups",
      "Quick quotes and sales",
      "Cash/card transactions"
    ],
    "ai_touchpoints": [
      "Instant pricing lookup",
      "Inventory availability",
      "Remnant matching for small orders"
    ]
  },
  {
    "actor": "Production Planner / Scheduler",
    "responsibilities": [
      "Schedule work orders",
      "Balance work center loads",
      "Prioritize orders",
      "Coordinate material availability"
    ],
    "ai_touchpoints": [
      "AI-generated schedules",
      "Capacity forecasting",
      "What-if simulation",
      "Bottleneck prediction"
    ]
  },
  {
    "actor": "Shop Floor Operator",
    "responsibilities": [
      "Execute work orders",
      "Operate machinery",
      "Record production data",
      "Inspect output quality"
    ],
    "ai_touchpoints": [
      "Optimized cut patterns",
      "Time estimates",
      "Quality alerts",
      "Machine parameter recommendations"
    ]
  },
  {
    "actor": "Lead Operator / Supervisor",
    "responsibilities": [
      "Oversee shop floor operations",
      "Assign operators to machines",
      "Handle exceptions",
      "Approve quality holds"
    ],
    "ai_touchpoints": [
      "Real-time production dashboards",
      "Exception alerts",
      "Labor allocation suggestions"
    ]
  },
  {
    "actor": "Warehouse / Receiving Clerk",
    "responsibilities": [
      "Receive inbound material",
      "Put-away inventory",
      "Manage storage locations",
      "Conduct cycle counts"
    ],
    "ai_touchpoints": [
      "Put-away location recommendations",
      "OCR for MTR/packing list",
      "Discrepancy detection"
    ]
  },
  {
    "actor": "Shipping Clerk",
    "responsibilities": [
      "Pick and pack orders",
      "Generate shipping documents",
      "Coordinate with carriers",
      "Load trucks"
    ],
    "ai_touchpoints": [
      "Pick path optimization",
      "Load sequencing",
      "Carrier selection",
      "Document generation"
    ]
  },
  {
    "actor": "Quality / QA Inspector",
    "responsibilities": [
      "Inspect material and finished goods",
      "Record test results",
      "Issue NCRs",
      "Approve releases"
    ],
    "ai_touchpoints": [
      "Defect prediction",
      "Inspection sampling optimization",
      "Trend analysis",
      "Automated NCR classification"
    ]
  },
  {
    "actor": "Metallurgist / Material Engineer",
    "responsibilities": [
      "Interpret MTRs",
      "Approve material substitutions",
      "Investigate quality issues",
      "Advise on processing parameters"
    ],
    "ai_touchpoints": [
      "Chemistry analysis",
      "Substitution validation",
      "Property prediction from chemistry"
    ]
  },
  {
    "actor": "Purchasing / Procurement",
    "responsibilities": [
      "Source raw materials",
      "Manage supplier relationships",
      "Negotiate pricing",
      "Place purchase orders"
    ],
    "ai_touchpoints": [
      "Demand forecasting",
      "Reorder recommendations",
      "Supplier performance scoring",
      "Price trend prediction"
    ]
  },
  {
    "actor": "Inventory Manager",
    "responsibilities": [
      "Optimize stock levels",
      "Manage slow movers",
      "Coordinate inter-location transfers",
      "Oversee cycle counts"
    ],
    "ai_touchpoints": [
      "ABC reclassification",
      "Safety stock optimization",
      "Slow-mover disposition",
      "Transfer recommendations"
    ]
  },
  {
    "actor": "Finance / Billing Clerk",
    "responsibilities": [
      "Generate invoices",
      "Process payments",
      "Manage AR/AP",
      "Handle credits and disputes"
    ],
    "ai_touchpoints": [
      "Invoice automation",
      "Payment prediction",
      "Credit risk scoring"
    ]
  },
  {
    "actor": "Branch Manager",
    "responsibilities": [
      "Oversee location operations",
      "Manage P&L",
      "Staff management",
      "Customer relationships"
    ],
    "ai_touchpoints": [
      "Location KPI dashboards",
      "Performance anomaly alerts",
      "Benchmarking vs. other locations"
    ]
  },
  {
    "actor": "Operations Director",
    "responsibilities": [
      "Multi-location oversight",
      "Capacity planning",
      "Process improvement",
      "Capital investment"
    ],
    "ai_touchpoints": [
      "Network-wide analytics",
      "Capacity investment modeling",
      "Operational excellence metrics"
    ]
  },
  {
    "actor": "Executive / Owner",
    "responsibilities": [
      "Strategic direction",
      "Financial oversight",
      "Major account relationships",
      "Investment decisions"
    ],
    "ai_touchpoints": [
      "Executive dashboards",
      "Predictive financials",
      "Market trend analysis"
    ]
  },
  {
    "actor": "IT Administrator",
    "responsibilities": [
      "System configuration",
      "User management",
      "Integration maintenance",
      "Security oversight"
    ],
    "ai_touchpoints": [
      "Anomaly detection (security)",
      "Integration health monitoring",
      "Usage analytics"
    ]
  },
  {
    "actor": "Carrier / Freight Company",
    "responsibilities": [
      "Transport shipments",
      "Provide tracking",
      "Deliver POD"
    ],
    "ai_touchpoints": [
      "Rate optimization",
      "Performance scoring",
      "ETA prediction"
    ]
  },
  {
    "actor": "Supplier / Mill",
    "responsibilities": [
      "Provide raw materials",
      "Furnish MTRs",
      "Honor lead times"
    ],
    "ai_touchpoints": [
      "Supplier lead time prediction",
      "Quality scoring",
      "Price forecasting"
    ]
  }
]
```

---

## 3. Domain Processes

```json
[
  {
    "process": "Quote-to-Order",
    "trigger": "Customer RFQ or inquiry",
    "steps": [
      "Receive RFQ (phone, email, portal, EDI)",
      "Parse requirements (material, dimensions, quantity, processing)",
      "Check inventory availability",
      "Calculate pricing (material + processing + freight)",
      "Estimate lead time",
      "Generate quote document",
      "Send to customer",
      "Follow up",
      "Convert to order on acceptance"
    ],
    "ai_opportunities": [
      "NLP extraction from RFQ emails/documents",
      "Automated pricing calculation",
      "Lead time prediction",
      "Win probability scoring",
      "Cross-sell recommendations"
    ],
    "kpis": ["Quote conversion rate", "Quote turnaround time", "Quote accuracy"]
  },
  {
    "process": "Order Entry",
    "trigger": "Customer PO or quote acceptance",
    "steps": [
      "Validate PO against quote",
      "Check credit status",
      "Allocate inventory",
      "Create work order(s)",
      "Generate routing",
      "Set promise date",
      "Send order acknowledgment"
    ],
    "ai_opportunities": [
      "Automated PO parsing",
      "Intelligent inventory allocation",
      "AI-generated routing",
      "Promise date optimization"
    ],
    "kpis": ["Order entry time", "Order accuracy", "Promise date reliability"]
  },
  {
    "process": "Production Planning",
    "trigger": "New work orders in queue",
    "steps": [
      "Review open work orders",
      "Assess capacity by work center",
      "Prioritize by due date/customer/value",
      "Sequence jobs to minimize setup",
      "Release to shop floor",
      "Monitor progress",
      "Replan on disruptions"
    ],
    "ai_opportunities": [
      "AI scheduling optimization",
      "Setup time minimization",
      "Load balancing",
      "What-if simulation",
      "Disruption recovery"
    ],
    "kpis": ["On-time delivery", "Work center utilization", "Setup ratio"]
  },
  {
    "process": "Material Cutting",
    "trigger": "Work order released to cutting center",
    "steps": [
      "Retrieve cut plan",
      "Stage raw material",
      "Configure machine (blade, speed, program)",
      "Execute cuts",
      "Inspect output",
      "Label pieces",
      "Disposition remnants",
      "Record actuals"
    ],
    "ai_opportunities": [
      "1D/2D cutting optimization",
      "Remnant-first allocation",
      "Machine parameter recommendation",
      "Time estimation"
    ],
    "kpis": ["Yield %", "Pieces per hour", "Scrap %", "Remnant utilization"]
  },
  {
    "process": "Slitting",
    "trigger": "Slit coil work order",
    "steps": [
      "Load master coil on uncoiler",
      "Set slitter knives to widths",
      "Run coil through slitter",
      "Recoil slit mults",
      "Weigh and label outputs",
      "Record yields and scrap"
    ],
    "ai_opportunities": [
      "Multi-width optimization",
      "Edge trim minimization",
      "Coil-to-order matching"
    ],
    "kpis": ["Yield %", "Edge trim %", "Throughput tons/hr"]
  },
  {
    "process": "Fabrication",
    "trigger": "Work order with fabrication ops (bend, punch, weld, drill)",
    "steps": [
      "Stage cut material",
      "Set up fabrication equipment",
      "Execute operations per routing",
      "Inspect dimensions/quality",
      "Move to next op or staging"
    ],
    "ai_opportunities": [
      "Operation time prediction",
      "Setup optimization",
      "Quality prediction"
    ],
    "kpis": ["Cycle time", "First-pass yield", "Setup time"]
  },
  {
    "process": "Quality Inspection",
    "trigger": "Incoming material or completed production",
    "steps": [
      "Sample per inspection plan",
      "Measure dimensions",
      "Verify visual quality",
      "Compare to MTR specs",
      "Record results",
      "Pass, hold, or reject",
      "Issue NCR if needed"
    ],
    "ai_opportunities": [
      "Adaptive sampling rates",
      "Defect pattern detection",
      "Predictive quality from process data"
    ],
    "kpis": ["Inspection time", "Defect rate", "Customer claims"]
  },
  {
    "process": "Receiving",
    "trigger": "Inbound truck arrival",
    "steps": [
      "Check delivery against PO",
      "Unload material",
      "Inspect for damage",
      "Scan/enter into inventory",
      "Capture MTR",
      "Put away to storage location"
    ],
    "ai_opportunities": [
      "MTR OCR extraction",
      "Put-away location optimization",
      "Discrepancy detection"
    ],
    "kpis": ["Receiving time", "Put-away accuracy", "Dock-to-stock time"]
  },
  {
    "process": "Inventory Management",
    "trigger": "Continuous / event-driven",
    "steps": [
      "Monitor stock levels",
      "Classify ABC",
      "Calculate safety stock",
      "Generate reorder recommendations",
      "Manage slow movers",
      "Coordinate inter-location transfers",
      "Execute cycle counts"
    ],
    "ai_opportunities": [
      "Demand forecasting",
      "Dynamic safety stock",
      "Slow-mover disposition",
      "Transfer optimization",
      "Cycle count scheduling"
    ],
    "kpis": ["Inventory turns", "Stock-out rate", "Dead stock %"]
  },
  {
    "process": "Shipping",
    "trigger": "Work order complete and ready to ship",
    "steps": [
      "Generate pick list",
      "Pick material from staging/stock",
      "Package per customer specs",
      "Generate shipping documents (BOL, packing list, COC, MTR)",
      "Schedule carrier",
      "Load truck",
      "Ship and update status"
    ],
    "ai_opportunities": [
      "Pick path optimization",
      "Carrier selection",
      "Load planning",
      "Document automation"
    ],
    "kpis": ["Ship-on-time %", "Shipping accuracy", "Freight cost per lb"]
  },
  {
    "process": "Delivery & POD",
    "trigger": "Shipment departed",
    "steps": [
      "Track shipment",
      "Customer receives delivery",
      "Capture proof of delivery",
      "Handle exceptions (damage, shortage)",
      "Close shipment"
    ],
    "ai_opportunities": [
      "ETA prediction",
      "Exception prediction",
      "POD capture automation"
    ],
    "kpis": ["Delivery on-time %", "Damage rate", "Claims rate"]
  },
  {
    "process": "Billing & Collections",
    "trigger": "Shipment complete / order fulfilled",
    "steps": [
      "Generate invoice",
      "Send to customer (email, EDI, portal)",
      "Apply payments",
      "Manage AR aging",
      "Handle disputes",
      "Process credits/rebates"
    ],
    "ai_opportunities": [
      "Invoice automation",
      "Payment prediction",
      "Dispute classification",
      "Credit risk scoring"
    ],
    "kpis": ["DSO", "Collection rate", "Dispute resolution time"]
  },
  {
    "process": "Purchasing / Replenishment",
    "trigger": "Reorder point reached or forecast demand",
    "steps": [
      "Review replenishment recommendations",
      "Select supplier",
      "Negotiate/confirm pricing",
      "Issue purchase order",
      "Track inbound shipment",
      "Receive and inspect"
    ],
    "ai_opportunities": [
      "Demand forecasting",
      "Supplier selection optimization",
      "Price trend prediction",
      "Lead time prediction"
    ],
    "kpis": ["PO accuracy", "Supplier OTD", "Material cost variance"]
  },
  {
    "process": "Customer Service",
    "trigger": "Customer inquiry / issue",
    "steps": [
      "Receive inquiry (phone, email, portal)",
      "Identify order/shipment",
      "Research issue",
      "Provide resolution",
      "Log interaction",
      "Escalate if needed"
    ],
    "ai_opportunities": [
      "Chatbot for common inquiries",
      "Automated status lookup",
      "Sentiment analysis",
      "Resolution recommendation"
    ],
    "kpis": ["First-call resolution", "Response time", "NPS"]
  },
  {
    "process": "Returns & Claims",
    "trigger": "Customer reports issue with delivered material",
    "steps": [
      "Log claim",
      "Investigate root cause",
      "Determine disposition (credit, replace, return)",
      "Process return if applicable",
      "Issue credit",
      "Update quality records"
    ],
    "ai_opportunities": [
      "Root cause classification",
      "Trend detection",
      "Resolution recommendation"
    ],
    "kpis": ["Claims rate", "Resolution time", "Repeat claims"]
  },
  {
    "process": "Pricing Management",
    "trigger": "Market changes, cost updates, contract renewals",
    "steps": [
      "Update base material costs",
      "Adjust processing charges",
      "Maintain customer-specific pricing",
      "Manage volume rebates",
      "Update price lists"
    ],
    "ai_opportunities": [
      "Margin optimization",
      "Competitive pricing analysis",
      "Price elasticity modeling"
    ],
    "kpis": ["Gross margin", "Price realization", "Quote win rate"]
  }
]
```

---

## 4. Competitive Constraints

| Constraint Category | Description | Impact on AI |
|---------------------|-------------|--------------|
| **Same-Day / Next-Day Delivery** | Customers expect rapid turnaround; many orders ship within 24 hours | Scheduling must optimize for speed; promise date accuracy critical |
| **Price Transparency** | Commodity pricing known; margins thin (8-20%) | AI pricing must balance competitiveness with margin protection |
| **Wide SKU Breadth** | 50,000+ unique items across metals and plastics | Inventory optimization must handle long tail; demand forecasting challenging |
| **Custom Processing** | Most orders require some processing (cut, slit, fabricate) | Production scheduling and time estimation essential |
| **Material Traceability** | Regulatory and customer requirements for full provenance | AI must maintain and query traceability graphs |
| **Just-in-Time Customers** | OEMs and fabricators don't hold inventory; rely on distributor | High fill rates and reliability required |
| **Geographic Coverage** | Multi-location network competes on proximity | Inventory positioning and transfer optimization |
| **Technical Expertise** | Customers expect material knowledge and problem-solving | AI must augment (not replace) human expertise |
| **Supplier Concentration** | Limited mills; long lead times (4-16 weeks) for raw material | Demand forecasting accuracy directly impacts availability |
| **Commodity Price Volatility** | Steel, aluminum, plastics prices fluctuate significantly | Dynamic pricing and hedging recommendations |
| **Labor Constraints** | Skilled operators scarce; training expensive | AI must simplify tasks; reduce skill requirements |
| **Equipment Downtime** | Unplanned downtime disrupts schedules | Predictive maintenance to reduce surprises |
| **Customer Stickiness** | Relationships and service trump pure price | AI must enhance (not impede) customer relationships |
| **E-Commerce Disruption** | Amazon Business, Alibaba entering space | Self-service and digital experience required |
| **Consolidation Pressure** | Large players (Ryerson, Reliance, Alro) acquiring smaller distributors | Efficiency gains required to compete |

---

## 5. Domain Invariants

```json
[
  {
    "invariant": "INV-001",
    "rule": "Every piece of material must trace to exactly one Heat or Mill Source.",
    "rationale": "Traceability is non-negotiable for quality and compliance.",
    "ai_implication": "Provenance graph must be complete; no orphan inventory."
  },
  {
    "invariant": "INV-002",
    "rule": "Material output quantity cannot exceed input quantity minus kerf and scrap.",
    "rationale": "Conservation of mass; yield cannot exceed 100%.",
    "ai_implication": "Cutting optimization bounded by physical constraints."
  },
  {
    "invariant": "INV-003",
    "rule": "Allocated inventory cannot be double-allocated to another order.",
    "rationale": "Prevents overselling and delivery failures.",
    "ai_implication": "Allocation engine must be atomic and consistent."
  },
  {
    "invariant": "INV-004",
    "rule": "Work order cannot complete until all predecessor operations are done.",
    "rationale": "Routing sequence is mandatory.",
    "ai_implication": "Scheduling must respect precedence constraints."
  },
  {
    "invariant": "INV-005",
    "rule": "Order cannot ship until all required documents (BOL, MTR, COC) are generated.",
    "rationale": "Compliance and customer requirements.",
    "ai_implication": "Document generation must be automated and reliable."
  },
  {
    "invariant": "INV-006",
    "rule": "Customer cannot place order if credit hold is active.",
    "rationale": "Credit management policy.",
    "ai_implication": "Order intake must check credit status in real-time."
  },
  {
    "invariant": "INV-007",
    "rule": "Material substitution requires chemistry and property equivalence or better.",
    "rationale": "Customer specs must be met or exceeded.",
    "ai_implication": "Substitution logic must validate against spec hierarchy."
  },
  {
    "invariant": "INV-008",
    "rule": "Pricing must include all components: base material, processing, freight, surcharges.",
    "rationale": "Margin protection; no hidden costs.",
    "ai_implication": "Pricing engine must be comprehensive."
  },
  {
    "invariant": "INV-009",
    "rule": "Invoice quantity and weight must match shipped quantity and weight.",
    "rationale": "Billing accuracy; avoid disputes.",
    "ai_implication": "Shipping data feeds directly to billing."
  },
  {
    "invariant": "INV-010",
    "rule": "Inventory balance = Opening + Receipts - Issues - Adjustments.",
    "rationale": "Inventory accounting identity.",
    "ai_implication": "All transactions must be recorded; no inventory leakage."
  },
  {
    "invariant": "INV-011",
    "rule": "A work center can only process one job at a time (except parallel machines).",
    "rationale": "Physical constraint of equipment.",
    "ai_implication": "Scheduling must respect machine capacity."
  },
  {
    "invariant": "INV-012",
    "rule": "Remnant valuation cannot exceed original material cost per unit.",
    "rationale": "Remnants depreciate, not appreciate.",
    "ai_implication": "Remnant pricing applies write-down factors."
  },
  {
    "invariant": "INV-013",
    "rule": "Quality hold prevents material from being issued to production or shipped.",
    "rationale": "Nonconforming material must be dispositioned first.",
    "ai_implication": "Inventory availability excludes held material."
  },
  {
    "invariant": "INV-014",
    "rule": "Inter-location transfer requires source availability and destination capacity.",
    "rationale": "Can't transfer what you don't have or can't store.",
    "ai_implication": "Transfer optimization bounded by both ends."
  },
  {
    "invariant": "INV-015",
    "rule": "All monetary transactions must balance (debits = credits).",
    "rationale": "Accounting integrity.",
    "ai_implication": "Financial postings must be atomic and auditable."
  },
  {
    "invariant": "INV-016",
    "rule": "Promise date cannot be earlier than calculated earliest completion.",
    "rationale": "Realistic commitments only.",
    "ai_implication": "Due date prediction provides floor for promise."
  },
  {
    "invariant": "INV-017",
    "rule": "Tenant data is strictly isolated; no cross-tenant access.",
    "rationale": "Multi-tenant security.",
    "ai_implication": "ML models trained per-tenant or with strict data isolation."
  },
  {
    "invariant": "INV-018",
    "rule": "All weights must use consistent UoM (lbs or kgs) within a transaction.",
    "rationale": "Calculation accuracy.",
    "ai_implication": "UoM conversion happens at boundaries, not mid-process."
  },
  {
    "invariant": "INV-019",
    "rule": "Scrap is final; once marked scrap, material cannot be reclassified as sellable.",
    "rationale": "Prevents gaming yield numbers.",
    "ai_implication": "Scrap classification is irreversible; remnant-vs-scrap decision is critical."
  },
  {
    "invariant": "INV-020",
    "rule": "Order lines reference valid, active products in the catalog.",
    "rationale": "No phantom or discontinued items on orders.",
    "ai_implication": "Product lifecycle state must be checked at order entry."
  }
]
```

---

## 6. Domain Optimization Objectives

```yaml
optimization_objectives:

  # === CUSTOMER EXPERIENCE ===
  - id: OBJ-001
    name: Maximize On-Time Delivery
    metric: "% orders delivered by promise date"
    target: ">= 98%"
    ai_lever: "Accurate promise date prediction; proactive rescheduling"

  - id: OBJ-002
    name: Minimize Quote Turnaround
    metric: "Average time from RFQ receipt to quote sent"
    target: "<= 2 hours for standard, <= 4 hours for complex"
    ai_lever: "Automated quote generation; NLP extraction from RFQs"

  - id: OBJ-003
    name: Maximize Quote Win Rate
    metric: "% quotes converted to orders"
    target: ">= 35%"
    ai_lever: "Competitive pricing; win probability scoring"

  - id: OBJ-004
    name: Maximize Fill Rate
    metric: "% order lines filled from stock"
    target: ">= 95%"
    ai_lever: "Inventory optimization; demand forecasting"

  - id: OBJ-005
    name: Minimize Lead Time
    metric: "Average order-to-ship time"
    target: "<= 24 hours for stock, <= 48 hours for light processing"
    ai_lever: "Scheduling optimization; capacity balancing"

  # === OPERATIONAL EFFICIENCY ===
  - id: OBJ-006
    name: Maximize Material Yield
    metric: "% input material converted to saleable output"
    target: ">= 92% for plate, >= 97% for bar/tube"
    ai_lever: "Cutting/nesting optimization; remnant-first allocation"

  - id: OBJ-007
    name: Minimize Scrap
    metric: "Scrap as % of material processed"
    target: "<= 3%"
    ai_lever: "Cutting optimization; scrap prediction for margin adjustment"

  - id: OBJ-008
    name: Maximize Work Center Utilization
    metric: "% available capacity consumed by productive work"
    target: ">= 75%"
    ai_lever: "Load balancing; batching; reduced changeovers"

  - id: OBJ-009
    name: Minimize Setup Time
    metric: "Setup time as % of total work center time"
    target: "<= 15%"
    ai_lever: "Sequence optimization; job batching by setup similarity"

  - id: OBJ-010
    name: Maximize Throughput
    metric: "Tons processed per shift"
    target: "Continuous improvement quarter-over-quarter"
    ai_lever: "Bottleneck identification; process parameter optimization"

  - id: OBJ-011
    name: Minimize Cycle Time Variance
    metric: "Std deviation of actual vs. estimated time"
    target: "Coefficient of variation <= 0.20"
    ai_lever: "Time estimation ML; process control"

  - id: OBJ-012
    name: Maximize OEE
    metric: "Overall Equipment Effectiveness (Availability × Performance × Quality)"
    target: ">= 70%"
    ai_lever: "Predictive maintenance; quality prediction; scheduling"

  # === INVENTORY ===
  - id: OBJ-013
    name: Maximize Inventory Turns
    metric: "COGS / Average Inventory"
    target: ">= 6.0 turns/year"
    ai_lever: "Demand forecasting; dynamic safety stock; slow-mover disposition"

  - id: OBJ-014
    name: Minimize Stock-Outs
    metric: "Lost sales due to inventory unavailability"
    target: "<= 1% of potential orders"
    ai_lever: "Reorder point optimization; demand sensing"

  - id: OBJ-015
    name: Minimize Dead Stock
    metric: "Inventory with no movement > 12 months"
    target: "<= 3% of inventory value"
    ai_lever: "Slow-mover identification; disposition recommendations"

  - id: OBJ-016
    name: Maximize Remnant Utilization
    metric: "% remnants sold vs. scrapped"
    target: ">= 60%"
    ai_lever: "Remnant matching; remnant-first allocation"

  - id: OBJ-017
    name: Optimize Inventory Positioning
    metric: "Service level by location vs. inventory investment"
    target: "Meet SLA with minimal inventory"
    ai_lever: "Multi-location optimization; transfer recommendations"

  # === FINANCIAL ===
  - id: OBJ-018
    name: Maximize Gross Margin
    metric: "Gross profit / Revenue"
    target: ">= 18% average"
    ai_lever: "Pricing optimization; scrap prediction; yield improvement"

  - id: OBJ-019
    name: Minimize DSO
    metric: "Days Sales Outstanding"
    target: "<= 40 days"
    ai_lever: "Payment prediction; collection prioritization"

  - id: OBJ-020
    name: Minimize Freight Cost
    metric: "Freight as % of revenue"
    target: "<= 6%"
    ai_lever: "Carrier selection; route optimization; consolidation"

  # === QUALITY ===
  - id: OBJ-021
    name: Minimize Customer Claims
    metric: "Claims / 1000 shipments"
    target: "<= 5"
    ai_lever: "Quality prediction; defect prevention"

  - id: OBJ-022
    name: Maximize First-Pass Yield
    metric: "% units passing QC on first inspection"
    target: ">= 99%"
    ai_lever: "Process parameter optimization; predictive quality"

  - id: OBJ-023
    name: Minimize Inspection Time
    metric: "Inspection time per order"
    target: "Reduce 25% via adaptive sampling"
    ai_lever: "Risk-based sampling; automated inspection"

  # === LABOR ===
  - id: OBJ-024
    name: Maximize Labor Productivity
    metric: "Revenue per labor hour"
    target: "Continuous improvement"
    ai_lever: "Scheduling; task simplification; training recommendations"

  - id: OBJ-025
    name: Minimize Skill Dependency
    metric: "Operations that require expert operators"
    target: "AI-guided operations executable by entry-level staff"
    ai_lever: "Intelligent work instructions; parameter recommendations"

  # === NETWORK ===
  - id: OBJ-026
    name: Optimize Multi-Location Network
    metric: "Aggregate service level vs. total network inventory"
    target: "Maximize service, minimize investment"
    ai_lever: "Inventory positioning; demand allocation; transfer optimization"

  - id: OBJ-027
    name: Minimize Inter-Location Transfers
    metric: "Transfer cost as % of COGS"
    target: "<= 1%"
    ai_lever: "Local fulfillment prioritization; better inventory positioning"
```

---

## Summary Matrix: AI Optimization Levers

| Objective Category | Count | Primary AI Techniques |
|--------------------|-------|----------------------|
| Customer Experience | 5 | NLP, Time-Series Prediction, Classification |
| Operational Efficiency | 7 | Scheduling Optimization, 1D/2D Cutting, Regression |
| Inventory | 5 | Demand Forecasting, Network Optimization, Classification |
| Financial | 3 | Pricing Optimization, Payment Prediction |
| Quality | 3 | Predictive Quality, Adaptive Sampling |
| Labor | 2 | Task Simplification, Recommendation Systems |
| Network | 2 | Multi-Echelon Optimization, Transfer RL |

---

*Document generated for AI-build Phase 01: Context & Industry Fit*
