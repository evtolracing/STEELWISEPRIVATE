# 37 — AI User Roles & Personas

> **Purpose:** Machine-readable role definitions, handoff graphs, and persona-module requirements matrix for AI-build.  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. Roles

```json
[
  {
    "id": "ROLE-001",
    "name": "Inside Sales Representative",
    "code": "INSIDE_SALES",
    "responsibilities": [
      "Process customer RFQs and inquiries",
      "Generate quotes and proposals",
      "Convert quotes to orders",
      "Manage customer accounts",
      "Coordinate with production planning",
      "Handle order modifications",
      "Resolve customer issues"
    ],
    "permissions": [
      "quote:create",
      "quote:read",
      "quote:update",
      "quote:send",
      "order:create",
      "order:read",
      "order:update",
      "customer:read",
      "customer:update",
      "inventory:read",
      "pricing:read",
      "pricing:override:limited",
      "workorder:read",
      "shipment:read",
      "document:read"
    ],
    "kpis": [
      {"metric": "quote_conversion_rate", "target": ">=35%", "weight": 0.25},
      {"metric": "quote_turnaround_hours", "target": "<=2", "weight": 0.20},
      {"metric": "order_accuracy_rate", "target": ">=99%", "weight": 0.20},
      {"metric": "revenue_booked", "target": "monthly_target", "weight": 0.20},
      {"metric": "customer_satisfaction_score", "target": ">=4.5", "weight": 0.15}
    ],
    "constraints": [
      "Max discount without approval: 5%",
      "Cannot override credit hold",
      "Cannot modify shipped orders",
      "Cannot access competitor pricing data"
    ],
    "handoffs": [
      {"to": "PRODUCTION_PLANNER", "trigger": "order_confirmed", "data": ["work_order", "due_date", "special_instructions"]},
      {"to": "SHIPPING_CLERK", "trigger": "ready_to_ship", "data": ["shipping_instructions", "carrier_preference"]},
      {"to": "CREDIT_ANALYST", "trigger": "credit_review_needed", "data": ["customer_id", "order_value"]},
      {"to": "OUTSIDE_SALES", "trigger": "escalation", "data": ["customer_id", "issue_summary"]}
    ],
    "tools": [
      "quote_builder",
      "order_entry",
      "customer_lookup",
      "inventory_search",
      "price_calculator",
      "document_viewer",
      "ai_quote_assistant",
      "ai_cross_sell_recommender"
    ],
    "ai_augmentation": [
      "Auto-populate quote from RFQ email",
      "Win probability scoring",
      "Cross-sell/upsell recommendations",
      "Lead time prediction",
      "Customer churn risk indicator"
    ]
  },
  {
    "id": "ROLE-002",
    "name": "Outside Sales Representative",
    "code": "OUTSIDE_SALES",
    "responsibilities": [
      "Develop new customer accounts",
      "Manage key account relationships",
      "Negotiate contracts and pricing",
      "Conduct customer visits",
      "Identify growth opportunities",
      "Resolve escalated issues"
    ],
    "permissions": [
      "quote:create",
      "quote:read",
      "quote:update",
      "quote:send",
      "order:create",
      "order:read",
      "customer:create",
      "customer:read",
      "customer:update",
      "contract:create",
      "contract:read",
      "contract:update",
      "pricing:read",
      "pricing:override:extended",
      "analytics:sales",
      "territory:manage"
    ],
    "kpis": [
      {"metric": "new_accounts_opened", "target": ">=3/month", "weight": 0.20},
      {"metric": "revenue_growth_yoy", "target": ">=10%", "weight": 0.25},
      {"metric": "contract_renewal_rate", "target": ">=90%", "weight": 0.20},
      {"metric": "customer_visits_per_week", "target": ">=8", "weight": 0.15},
      {"metric": "margin_achievement", "target": ">=target_margin", "weight": 0.20}
    ],
    "constraints": [
      "Max discount without approval: 15%",
      "Contract terms require legal review if non-standard",
      "Territory restrictions apply",
      "Cannot approve own credit limit increases"
    ],
    "handoffs": [
      {"to": "INSIDE_SALES", "trigger": "order_processing", "data": ["quote_id", "customer_id", "special_terms"]},
      {"to": "CREDIT_ANALYST", "trigger": "new_account_credit", "data": ["customer_application", "requested_limit"]},
      {"to": "BRANCH_MANAGER", "trigger": "pricing_exception", "data": ["quote_id", "requested_discount", "justification"]}
    ],
    "tools": [
      "crm_dashboard",
      "quote_builder",
      "contract_manager",
      "territory_map",
      "customer_analytics",
      "mobile_app",
      "ai_opportunity_scorer",
      "ai_churn_predictor"
    ],
    "ai_augmentation": [
      "Opportunity scoring",
      "Churn prediction",
      "Pricing elasticity guidance",
      "Competitive intelligence",
      "Visit route optimization"
    ]
  },
  {
    "id": "ROLE-003",
    "name": "Counter Sales / POS Operator",
    "code": "COUNTER_SALES",
    "responsibilities": [
      "Process walk-in customer transactions",
      "Handle will-call pickups",
      "Provide quick quotes",
      "Process payments (cash, card, account)",
      "Assist with product selection",
      "Manage counter inventory"
    ],
    "permissions": [
      "quote:create",
      "quote:read",
      "order:create",
      "order:read",
      "customer:read",
      "customer:create:quick",
      "inventory:read",
      "inventory:issue:counter",
      "pricing:read",
      "payment:process",
      "willcall:manage"
    ],
    "kpis": [
      {"metric": "transaction_time_seconds", "target": "<=60", "weight": 0.25},
      {"metric": "transactions_per_hour", "target": ">=12", "weight": 0.20},
      {"metric": "upsell_rate", "target": ">=15%", "weight": 0.20},
      {"metric": "customer_wait_time", "target": "<=3min", "weight": 0.20},
      {"metric": "cash_accuracy", "target": "100%", "weight": 0.15}
    ],
    "constraints": [
      "No discounts without supervisor approval",
      "Cash drawer limits apply",
      "Cannot process credit-hold customers",
      "Will-call expiration: 7 days"
    ],
    "handoffs": [
      {"to": "SHOP_OPERATOR", "trigger": "quick_cut_needed", "data": ["cut_spec", "material_id", "priority"]},
      {"to": "INSIDE_SALES", "trigger": "complex_quote", "data": ["customer_id", "requirements"]},
      {"to": "WAREHOUSE_CLERK", "trigger": "pull_from_stock", "data": ["pick_list", "customer_name"]}
    ],
    "tools": [
      "pos_terminal",
      "quick_quote",
      "inventory_lookup",
      "willcall_board",
      "payment_processor",
      "barcode_scanner",
      "ai_remnant_matcher"
    ],
    "ai_augmentation": [
      "Instant remnant matching",
      "Quick substitute suggestions",
      "Add-on recommendations",
      "Price lookup with margin protection"
    ]
  },
  {
    "id": "ROLE-004",
    "name": "Production Planner / Scheduler",
    "code": "PRODUCTION_PLANNER",
    "responsibilities": [
      "Schedule work orders across work centers",
      "Balance capacity and demand",
      "Prioritize orders by urgency and value",
      "Coordinate material availability",
      "Release jobs to shop floor",
      "Manage schedule disruptions",
      "Forecast capacity needs"
    ],
    "permissions": [
      "workorder:read",
      "workorder:update",
      "workorder:schedule",
      "workorder:release",
      "workcenter:read",
      "workcenter:update:schedule",
      "inventory:read",
      "inventory:reserve",
      "order:read",
      "capacity:read",
      "capacity:simulate",
      "analytics:production"
    ],
    "kpis": [
      {"metric": "on_time_release_rate", "target": ">=98%", "weight": 0.25},
      {"metric": "work_center_utilization", "target": ">=75%", "weight": 0.20},
      {"metric": "setup_time_ratio", "target": "<=15%", "weight": 0.20},
      {"metric": "schedule_adherence", "target": ">=95%", "weight": 0.20},
      {"metric": "capacity_forecast_accuracy", "target": ">=90%", "weight": 0.15}
    ],
    "constraints": [
      "Cannot exceed capacity limits without approval",
      "Must respect material availability",
      "Hot orders require manager approval",
      "Overtime scheduling requires HR notification"
    ],
    "handoffs": [
      {"to": "SHOP_OPERATOR", "trigger": "job_released", "data": ["work_order", "routing", "cut_patterns", "priority"]},
      {"to": "LEAD_OPERATOR", "trigger": "schedule_change", "data": ["affected_jobs", "new_sequence", "reason"]},
      {"to": "WAREHOUSE_CLERK", "trigger": "material_staging", "data": ["material_list", "work_order", "staging_location"]},
      {"to": "INSIDE_SALES", "trigger": "promise_date_risk", "data": ["order_id", "new_eta", "reason"]}
    ],
    "tools": [
      "scheduling_board",
      "capacity_planner",
      "gantt_view",
      "what_if_simulator",
      "material_availability",
      "workcenter_status",
      "ai_scheduler",
      "ai_bottleneck_predictor"
    ],
    "ai_augmentation": [
      "AI-generated schedules",
      "Bottleneck prediction",
      "Setup optimization",
      "What-if simulation",
      "Disruption recovery suggestions"
    ]
  },
  {
    "id": "ROLE-005",
    "name": "Shop Floor Operator",
    "code": "SHOP_OPERATOR",
    "responsibilities": [
      "Execute assigned work orders",
      "Operate machinery (saw, laser, shear, brake, etc.)",
      "Record production data",
      "Inspect output quality",
      "Label and stage finished pieces",
      "Report issues and downtime",
      "Maintain work area"
    ],
    "permissions": [
      "workorder:read:assigned",
      "workorder:update:status",
      "workorder:update:actuals",
      "workcenter:read",
      "workcenter:update:status",
      "inventory:read",
      "inventory:issue",
      "inventory:receive:production",
      "quality:read",
      "quality:record",
      "document:read:routing"
    ],
    "kpis": [
      {"metric": "pieces_per_hour", "target": ">=standard", "weight": 0.25},
      {"metric": "yield_percentage", "target": ">=target", "weight": 0.25},
      {"metric": "first_pass_quality", "target": ">=99%", "weight": 0.20},
      {"metric": "time_variance", "target": "<=10%", "weight": 0.15},
      {"metric": "safety_incidents", "target": "0", "weight": 0.15}
    ],
    "constraints": [
      "Cannot modify job routing",
      "Cannot override quality holds",
      "Must follow cut patterns exactly",
      "Cannot process unallocated material"
    ],
    "handoffs": [
      {"to": "LEAD_OPERATOR", "trigger": "issue_escalation", "data": ["work_order", "issue_type", "description"]},
      {"to": "QA_INSPECTOR", "trigger": "inspection_required", "data": ["work_order", "pieces", "inspection_type"]},
      {"to": "SHOP_OPERATOR", "trigger": "next_operation", "data": ["work_order", "completed_op", "pieces"]},
      {"to": "SHIPPING_CLERK", "trigger": "ready_for_ship", "data": ["work_order", "pieces", "staging_location"]}
    ],
    "tools": [
      "operator_tablet",
      "job_queue",
      "cut_pattern_viewer",
      "barcode_scanner",
      "scale_integration",
      "downtime_logger",
      "ai_time_estimator",
      "ai_parameter_advisor"
    ],
    "ai_augmentation": [
      "Optimized cut patterns displayed",
      "Time estimates for job",
      "Machine parameter recommendations",
      "Quality alerts from similar jobs",
      "Next-job preview"
    ]
  },
  {
    "id": "ROLE-006",
    "name": "Lead Operator / Supervisor",
    "code": "LEAD_OPERATOR",
    "responsibilities": [
      "Oversee shop floor operations",
      "Assign operators to machines",
      "Handle exceptions and escalations",
      "Approve quality holds",
      "Coordinate with planning",
      "Train new operators",
      "Manage shift transitions"
    ],
    "permissions": [
      "workorder:read",
      "workorder:update",
      "workorder:reassign",
      "workcenter:read",
      "workcenter:update",
      "operator:assign",
      "quality:read",
      "quality:update",
      "quality:hold:approve",
      "inventory:read",
      "inventory:adjust:limited",
      "downtime:approve"
    ],
    "kpis": [
      {"metric": "shift_output_vs_plan", "target": ">=100%", "weight": 0.25},
      {"metric": "team_utilization", "target": ">=80%", "weight": 0.20},
      {"metric": "escalation_resolution_time", "target": "<=30min", "weight": 0.20},
      {"metric": "quality_hold_rate", "target": "<=1%", "weight": 0.20},
      {"metric": "operator_training_completion", "target": "100%", "weight": 0.15}
    ],
    "constraints": [
      "Cannot change promised delivery dates",
      "Overtime approval requires branch manager",
      "Cannot approve own time entries",
      "Quality rejects require QA sign-off"
    ],
    "handoffs": [
      {"to": "PRODUCTION_PLANNER", "trigger": "capacity_issue", "data": ["work_center", "issue", "impact"]},
      {"to": "MAINTENANCE_TECH", "trigger": "equipment_issue", "data": ["work_center", "symptoms", "urgency"]},
      {"to": "QA_INSPECTOR", "trigger": "quality_concern", "data": ["work_order", "issue_description", "affected_pieces"]},
      {"to": "BRANCH_MANAGER", "trigger": "major_escalation", "data": ["issue_summary", "impact", "recommended_action"]}
    ],
    "tools": [
      "supervisor_dashboard",
      "operator_assignment",
      "exception_queue",
      "shift_handoff",
      "performance_monitor",
      "quality_review",
      "ai_labor_optimizer"
    ],
    "ai_augmentation": [
      "Real-time production dashboards",
      "Exception prioritization",
      "Labor allocation suggestions",
      "Predictive alerts for bottlenecks"
    ]
  },
  {
    "id": "ROLE-007",
    "name": "Warehouse / Receiving Clerk",
    "code": "WAREHOUSE_CLERK",
    "responsibilities": [
      "Receive inbound material shipments",
      "Inspect for damage and accuracy",
      "Enter receipts into inventory",
      "Capture MTR documents",
      "Put away to storage locations",
      "Conduct cycle counts",
      "Stage material for production"
    ],
    "permissions": [
      "inventory:read",
      "inventory:receive",
      "inventory:putaway",
      "inventory:transfer:internal",
      "inventory:adjust:limited",
      "inventory:count",
      "purchase_order:read",
      "document:upload",
      "document:read",
      "location:read",
      "location:update"
    ],
    "kpis": [
      {"metric": "receipt_accuracy", "target": ">=99.5%", "weight": 0.25},
      {"metric": "dock_to_stock_hours", "target": "<=4", "weight": 0.25},
      {"metric": "putaway_accuracy", "target": ">=99%", "weight": 0.20},
      {"metric": "cycle_count_accuracy", "target": ">=98%", "weight": 0.15},
      {"metric": "mtr_capture_rate", "target": "100%", "weight": 0.15}
    ],
    "constraints": [
      "Cannot receive against closed PO",
      "Must capture MTR for all metal receipts",
      "Cannot adjust inventory > $500 without approval",
      "Quality-held material cannot be put away to sellable locations"
    ],
    "handoffs": [
      {"to": "QA_INSPECTOR", "trigger": "inspection_required", "data": ["receipt_id", "material", "inspection_type"]},
      {"to": "PURCHASING", "trigger": "discrepancy", "data": ["po_number", "discrepancy_type", "details"]},
      {"to": "SHOP_OPERATOR", "trigger": "material_staged", "data": ["work_order", "material", "staging_location"]},
      {"to": "INVENTORY_MANAGER", "trigger": "count_variance", "data": ["location", "expected", "actual", "variance_value"]}
    ],
    "tools": [
      "receiving_app",
      "barcode_scanner",
      "forklift_terminal",
      "mtr_capture",
      "cycle_count_app",
      "location_lookup",
      "ai_putaway_advisor",
      "ai_mtr_ocr"
    ],
    "ai_augmentation": [
      "MTR OCR extraction",
      "Put-away location optimization",
      "Discrepancy detection",
      "Cycle count prioritization"
    ]
  },
  {
    "id": "ROLE-008",
    "name": "Shipping Clerk",
    "code": "SHIPPING_CLERK",
    "responsibilities": [
      "Pick material for orders",
      "Package per customer specifications",
      "Generate shipping documents (BOL, packing list)",
      "Schedule carriers",
      "Load trucks",
      "Update shipment status",
      "Handle will-call pickups"
    ],
    "permissions": [
      "shipment:create",
      "shipment:read",
      "shipment:update",
      "inventory:read",
      "inventory:issue",
      "order:read",
      "carrier:schedule",
      "document:create:shipping",
      "document:read",
      "willcall:read",
      "willcall:release"
    ],
    "kpis": [
      {"metric": "ship_on_time_rate", "target": ">=99%", "weight": 0.30},
      {"metric": "shipping_accuracy", "target": ">=99.5%", "weight": 0.25},
      {"metric": "picks_per_hour", "target": ">=standard", "weight": 0.20},
      {"metric": "freight_cost_per_lb", "target": "<=target", "weight": 0.15},
      {"metric": "damage_claim_rate", "target": "<=0.5%", "weight": 0.10}
    ],
    "constraints": [
      "Cannot ship without all documents",
      "Cannot ship quality-held material",
      "Must verify weight before BOL generation",
      "Hazmat requires special handling certification"
    ],
    "handoffs": [
      {"to": "CARRIER", "trigger": "shipment_ready", "data": ["bol", "pickup_time", "pieces", "weight"]},
      {"to": "BILLING_CLERK", "trigger": "shipped", "data": ["shipment_id", "order_id", "actual_weight", "freight_charges"]},
      {"to": "INSIDE_SALES", "trigger": "shipment_exception", "data": ["order_id", "exception_type", "details"]},
      {"to": "CUSTOMER", "trigger": "shipped_notification", "data": ["tracking_number", "eta", "documents"]}
    ],
    "tools": [
      "shipping_workstation",
      "pick_list_app",
      "bol_generator",
      "carrier_portal",
      "scale_integration",
      "label_printer",
      "ai_carrier_selector",
      "ai_load_optimizer"
    ],
    "ai_augmentation": [
      "Pick path optimization",
      "Carrier selection recommendations",
      "Load sequencing",
      "Document auto-generation"
    ]
  },
  {
    "id": "ROLE-009",
    "name": "Quality / QA Inspector",
    "code": "QA_INSPECTOR",
    "responsibilities": [
      "Inspect incoming material",
      "Inspect production output",
      "Record test results",
      "Issue NCRs for non-conformances",
      "Approve or reject material",
      "Maintain inspection equipment",
      "Generate COC documents"
    ],
    "permissions": [
      "quality:read",
      "quality:create",
      "quality:update",
      "quality:hold",
      "quality:release",
      "ncr:create",
      "ncr:read",
      "inventory:read",
      "inventory:hold",
      "document:create:quality",
      "document:read",
      "workorder:read"
    ],
    "kpis": [
      {"metric": "inspection_throughput", "target": ">=standard", "weight": 0.20},
      {"metric": "defect_escape_rate", "target": "<=0.1%", "weight": 0.30},
      {"metric": "ncr_accuracy", "target": ">=98%", "weight": 0.20},
      {"metric": "inspection_turnaround_hours", "target": "<=2", "weight": 0.20},
      {"metric": "calibration_compliance", "target": "100%", "weight": 0.10}
    ],
    "constraints": [
      "Cannot release own inspections for critical items",
      "Must follow inspection plan sampling rates",
      "Cannot modify MTR data",
      "NCR disposition requires manager approval for scrap > $1000"
    ],
    "handoffs": [
      {"to": "METALLURGIST", "trigger": "chemistry_question", "data": ["mtr_id", "question", "material"]},
      {"to": "LEAD_OPERATOR", "trigger": "production_hold", "data": ["work_order", "issue", "affected_pieces"]},
      {"to": "PURCHASING", "trigger": "supplier_ncr", "data": ["supplier", "po_number", "ncr_details"]},
      {"to": "SHIPPING_CLERK", "trigger": "coc_ready", "data": ["order_id", "coc_document"]}
    ],
    "tools": [
      "inspection_app",
      "measurement_tools",
      "ncr_manager",
      "coc_generator",
      "mtr_viewer",
      "calibration_tracker",
      "ai_defect_predictor",
      "ai_sampling_optimizer"
    ],
    "ai_augmentation": [
      "Defect pattern detection",
      "Adaptive sampling recommendations",
      "Predictive quality from process data",
      "Automated NCR classification"
    ]
  },
  {
    "id": "ROLE-010",
    "name": "Metallurgist / Material Engineer",
    "code": "METALLURGIST",
    "responsibilities": [
      "Interpret MTR data",
      "Approve material substitutions",
      "Investigate quality issues",
      "Advise on processing parameters",
      "Maintain grade equivalency tables",
      "Support customer technical inquiries"
    ],
    "permissions": [
      "grade:read",
      "grade:create",
      "grade:update",
      "substitution:approve",
      "mtr:read",
      "mtr:interpret",
      "quality:read",
      "quality:update:technical",
      "product:read",
      "product:update:specs",
      "document:create:technical"
    ],
    "kpis": [
      {"metric": "substitution_approval_time_hours", "target": "<=4", "weight": 0.25},
      {"metric": "substitution_success_rate", "target": ">=99%", "weight": 0.30},
      {"metric": "technical_inquiry_resolution_hours", "target": "<=8", "weight": 0.25},
      {"metric": "grade_database_accuracy", "target": ">=99%", "weight": 0.20}
    ],
    "constraints": [
      "Cannot approve substitution that degrades spec",
      "Must document basis for all substitutions",
      "Cannot override customer-specified grades without approval"
    ],
    "handoffs": [
      {"to": "INSIDE_SALES", "trigger": "substitution_approved", "data": ["order_id", "original_grade", "substitute_grade", "justification"]},
      {"to": "QA_INSPECTOR", "trigger": "testing_required", "data": ["material_id", "tests_needed", "acceptance_criteria"]},
      {"to": "PURCHASING", "trigger": "supplier_quality_issue", "data": ["supplier", "issue", "recommendation"]}
    ],
    "tools": [
      "grade_database",
      "mtr_analyzer",
      "substitution_engine",
      "chemistry_calculator",
      "spec_library",
      "ai_property_predictor",
      "ai_substitution_matcher"
    ],
    "ai_augmentation": [
      "Chemistry analysis from MTR",
      "Automatic substitution matching",
      "Property prediction from chemistry",
      "Defect root cause analysis"
    ]
  },
  {
    "id": "ROLE-011",
    "name": "Purchasing / Procurement",
    "code": "PURCHASING",
    "responsibilities": [
      "Source raw materials",
      "Manage supplier relationships",
      "Negotiate pricing and terms",
      "Place purchase orders",
      "Track inbound shipments",
      "Resolve supplier issues",
      "Manage supplier performance"
    ],
    "permissions": [
      "purchase_order:create",
      "purchase_order:read",
      "purchase_order:update",
      "supplier:read",
      "supplier:create",
      "supplier:update",
      "inventory:read",
      "contract:read",
      "contract:create:purchase",
      "pricing:read:cost",
      "analytics:purchasing"
    ],
    "kpis": [
      {"metric": "cost_savings_vs_budget", "target": ">=2%", "weight": 0.25},
      {"metric": "supplier_otd_rate", "target": ">=95%", "weight": 0.25},
      {"metric": "po_accuracy", "target": ">=99%", "weight": 0.20},
      {"metric": "supplier_quality_rate", "target": ">=99%", "weight": 0.20},
      {"metric": "stock_out_due_to_supply", "target": "0", "weight": 0.10}
    ],
    "constraints": [
      "PO > $50K requires manager approval",
      "New supplier requires qualification",
      "Cannot commit beyond contract terms",
      "Must maintain supplier diversity targets"
    ],
    "handoffs": [
      {"to": "WAREHOUSE_CLERK", "trigger": "shipment_arriving", "data": ["po_number", "eta", "carrier", "expected_weight"]},
      {"to": "INVENTORY_MANAGER", "trigger": "reorder_recommendation", "data": ["material", "quantity", "lead_time", "suppliers"]},
      {"to": "FINANCE", "trigger": "invoice_received", "data": ["po_number", "invoice", "variance"]}
    ],
    "tools": [
      "procurement_portal",
      "supplier_database",
      "po_manager",
      "shipment_tracker",
      "contract_manager",
      "spend_analytics",
      "ai_demand_forecaster",
      "ai_supplier_scorer"
    ],
    "ai_augmentation": [
      "Demand forecasting",
      "Reorder recommendations",
      "Supplier performance scoring",
      "Price trend prediction",
      "Lead time prediction"
    ]
  },
  {
    "id": "ROLE-012",
    "name": "Inventory Manager",
    "code": "INVENTORY_MANAGER",
    "responsibilities": [
      "Optimize stock levels across locations",
      "Manage ABC classification",
      "Coordinate inter-location transfers",
      "Disposition slow-moving inventory",
      "Oversee cycle count program",
      "Analyze inventory performance",
      "Set safety stock and reorder points"
    ],
    "permissions": [
      "inventory:read",
      "inventory:update",
      "inventory:adjust",
      "inventory:transfer",
      "inventory:write_off",
      "location:read",
      "location:create",
      "location:update",
      "analytics:inventory",
      "reporting:inventory"
    ],
    "kpis": [
      {"metric": "inventory_turns", "target": ">=6", "weight": 0.25},
      {"metric": "stock_out_rate", "target": "<=1%", "weight": 0.25},
      {"metric": "dead_stock_percentage", "target": "<=3%", "weight": 0.20},
      {"metric": "inventory_accuracy", "target": ">=99%", "weight": 0.20},
      {"metric": "transfer_cost_ratio", "target": "<=1%", "weight": 0.10}
    ],
    "constraints": [
      "Write-offs > $5K require director approval",
      "Inter-location transfers must have business justification",
      "Cannot adjust inventory during physical count",
      "ABC reclassification requires quarterly review"
    ],
    "handoffs": [
      {"to": "PURCHASING", "trigger": "reorder_needed", "data": ["material", "quantity", "urgency", "suggested_supplier"]},
      {"to": "BRANCH_MANAGER", "trigger": "slow_mover_action", "data": ["material_list", "recommendation", "financial_impact"]},
      {"to": "WAREHOUSE_CLERK", "trigger": "transfer_order", "data": ["source", "destination", "material", "quantity"]}
    ],
    "tools": [
      "inventory_dashboard",
      "abc_analyzer",
      "transfer_optimizer",
      "slow_mover_report",
      "cycle_count_scheduler",
      "safety_stock_calculator",
      "ai_demand_forecaster",
      "ai_position_optimizer"
    ],
    "ai_augmentation": [
      "ABC reclassification recommendations",
      "Dynamic safety stock calculation",
      "Slow-mover disposition suggestions",
      "Transfer recommendations",
      "Demand sensing"
    ]
  },
  {
    "id": "ROLE-013",
    "name": "Finance / Billing Clerk",
    "code": "BILLING_CLERK",
    "responsibilities": [
      "Generate customer invoices",
      "Process incoming payments",
      "Manage accounts receivable",
      "Handle billing disputes",
      "Process credits and rebates",
      "Reconcile accounts"
    ],
    "permissions": [
      "invoice:create",
      "invoice:read",
      "invoice:update",
      "payment:read",
      "payment:apply",
      "credit:create",
      "credit:read",
      "customer:read:financial",
      "order:read",
      "shipment:read",
      "reporting:financial"
    ],
    "kpis": [
      {"metric": "invoice_accuracy", "target": ">=99.5%", "weight": 0.25},
      {"metric": "invoice_turnaround_hours", "target": "<=24", "weight": 0.20},
      {"metric": "dso_days", "target": "<=40", "weight": 0.25},
      {"metric": "dispute_resolution_days", "target": "<=5", "weight": 0.20},
      {"metric": "unapplied_cash", "target": "<=1%", "weight": 0.10}
    ],
    "constraints": [
      "Cannot create credit > invoice value",
      "Write-offs require manager approval",
      "Cannot modify posted invoices",
      "Rebates require contract validation"
    ],
    "handoffs": [
      {"to": "CREDIT_ANALYST", "trigger": "collection_escalation", "data": ["customer_id", "overdue_amount", "aging"]},
      {"to": "INSIDE_SALES", "trigger": "billing_dispute", "data": ["invoice_id", "dispute_type", "customer_claim"]},
      {"to": "CONTROLLER", "trigger": "month_end_reconciliation", "data": ["ar_balance", "unapplied_cash", "disputes_open"]}
    ],
    "tools": [
      "billing_workstation",
      "invoice_generator",
      "payment_processor",
      "ar_aging",
      "dispute_tracker",
      "credit_manager",
      "ai_payment_predictor"
    ],
    "ai_augmentation": [
      "Invoice automation from shipment data",
      "Payment prediction",
      "Dispute classification",
      "Collection prioritization"
    ]
  },
  {
    "id": "ROLE-014",
    "name": "Credit Analyst",
    "code": "CREDIT_ANALYST",
    "responsibilities": [
      "Evaluate customer credit applications",
      "Set and manage credit limits",
      "Monitor credit exposure",
      "Manage credit holds",
      "Coordinate collections",
      "Assess credit risk"
    ],
    "permissions": [
      "credit:read",
      "credit:create",
      "credit:update",
      "credit:hold:set",
      "credit:hold:release",
      "customer:read:financial",
      "customer:update:credit",
      "order:read",
      "invoice:read",
      "payment:read",
      "reporting:credit"
    ],
    "kpis": [
      {"metric": "bad_debt_percentage", "target": "<=0.5%", "weight": 0.30},
      {"metric": "credit_decision_hours", "target": "<=24", "weight": 0.20},
      {"metric": "collection_rate", "target": ">=98%", "weight": 0.25},
      {"metric": "credit_limit_utilization", "target": "optimal", "weight": 0.15},
      {"metric": "hold_release_hours", "target": "<=4", "weight": 0.10}
    ],
    "constraints": [
      "Credit limit > $100K requires manager approval",
      "Cannot release hold for own accounts",
      "Must document basis for all credit decisions",
      "Personal guarantees require legal review"
    ],
    "handoffs": [
      {"to": "INSIDE_SALES", "trigger": "credit_approved", "data": ["customer_id", "credit_limit", "terms"]},
      {"to": "INSIDE_SALES", "trigger": "credit_hold_set", "data": ["customer_id", "reason", "resolution_steps"]},
      {"to": "CONTROLLER", "trigger": "bad_debt_reserve", "data": ["customer_id", "amount", "justification"]}
    ],
    "tools": [
      "credit_dashboard",
      "credit_application",
      "exposure_monitor",
      "collection_queue",
      "credit_scoring",
      "ai_risk_predictor"
    ],
    "ai_augmentation": [
      "Credit risk scoring",
      "Payment prediction",
      "Early warning indicators",
      "Collection prioritization"
    ]
  },
  {
    "id": "ROLE-015",
    "name": "Branch Manager",
    "code": "BRANCH_MANAGER",
    "responsibilities": [
      "Oversee all location operations",
      "Manage P&L for branch",
      "Staff management and development",
      "Customer relationship management",
      "Approve exceptions and escalations",
      "Drive operational excellence"
    ],
    "permissions": [
      "branch:read",
      "branch:update",
      "order:read",
      "order:approve:exception",
      "pricing:override:branch",
      "inventory:read",
      "inventory:adjust:approve",
      "workorder:read",
      "shipment:read",
      "employee:read",
      "employee:update",
      "analytics:branch",
      "reporting:branch"
    ],
    "kpis": [
      {"metric": "branch_revenue", "target": ">=budget", "weight": 0.25},
      {"metric": "branch_margin", "target": ">=target", "weight": 0.25},
      {"metric": "on_time_delivery", "target": ">=98%", "weight": 0.20},
      {"metric": "customer_satisfaction", "target": ">=4.5", "weight": 0.15},
      {"metric": "employee_retention", "target": ">=90%", "weight": 0.15}
    ],
    "constraints": [
      "Cannot exceed capital expenditure budget without regional approval",
      "Pricing exceptions > 15% require VP approval",
      "Headcount changes require HR approval",
      "Cannot approve own expense reports"
    ],
    "handoffs": [
      {"to": "OPERATIONS_DIRECTOR", "trigger": "major_escalation", "data": ["issue_summary", "impact", "proposed_resolution"]},
      {"to": "HR", "trigger": "staffing_request", "data": ["position", "justification", "timing"]},
      {"to": "REGIONAL_MANAGER", "trigger": "capex_request", "data": ["project", "cost", "roi", "justification"]}
    ],
    "tools": [
      "branch_dashboard",
      "p&l_viewer",
      "exception_approvals",
      "staff_scheduler",
      "customer_review",
      "performance_monitor",
      "ai_anomaly_detector"
    ],
    "ai_augmentation": [
      "Location KPI dashboards",
      "Performance anomaly alerts",
      "Benchmarking vs. other locations",
      "Demand forecasting for staffing"
    ]
  },
  {
    "id": "ROLE-016",
    "name": "Operations Director",
    "code": "OPERATIONS_DIRECTOR",
    "responsibilities": [
      "Multi-location operational oversight",
      "Strategic capacity planning",
      "Process improvement initiatives",
      "Capital investment decisions",
      "Network optimization",
      "Vendor relationship management"
    ],
    "permissions": [
      "branch:read:all",
      "branch:update:all",
      "capacity:read",
      "capacity:update",
      "capex:approve",
      "vendor:read",
      "vendor:approve",
      "analytics:network",
      "reporting:network",
      "pricing:read",
      "inventory:read:all"
    ],
    "kpis": [
      {"metric": "network_on_time_delivery", "target": ">=98%", "weight": 0.25},
      {"metric": "network_utilization", "target": ">=75%", "weight": 0.20},
      {"metric": "operational_cost_ratio", "target": "<=target", "weight": 0.25},
      {"metric": "capex_roi", "target": ">=15%", "weight": 0.15},
      {"metric": "safety_record", "target": "0 LTI", "weight": 0.15}
    ],
    "constraints": [
      "CapEx > $250K requires executive approval",
      "Facility changes require legal/compliance review",
      "Cannot make unilateral pricing decisions",
      "Union matters require HR involvement"
    ],
    "handoffs": [
      {"to": "EXECUTIVE", "trigger": "strategic_decision", "data": ["proposal", "financials", "recommendation"]},
      {"to": "BRANCH_MANAGER", "trigger": "initiative_rollout", "data": ["initiative", "timeline", "resources"]},
      {"to": "IT_ADMIN", "trigger": "system_requirements", "data": ["capability_needed", "business_case", "priority"]}
    ],
    "tools": [
      "network_dashboard",
      "capacity_planner",
      "benchmarking_tool",
      "capex_modeler",
      "vendor_scorecard",
      "ai_network_optimizer"
    ],
    "ai_augmentation": [
      "Network-wide analytics",
      "Capacity investment modeling",
      "Operational excellence benchmarks",
      "What-if simulation for network changes"
    ]
  },
  {
    "id": "ROLE-017",
    "name": "Executive / Owner",
    "code": "EXECUTIVE",
    "responsibilities": [
      "Strategic direction setting",
      "Financial oversight",
      "Major account relationships",
      "Investment decisions",
      "Board/stakeholder communication",
      "M&A evaluation"
    ],
    "permissions": [
      "all:read",
      "strategic:update",
      "financial:read",
      "financial:approve",
      "contract:approve:major",
      "pricing:approve:strategic",
      "capex:approve:major",
      "analytics:executive",
      "reporting:executive"
    ],
    "kpis": [
      {"metric": "revenue_growth", "target": ">=10% YoY", "weight": 0.25},
      {"metric": "ebitda_margin", "target": ">=12%", "weight": 0.25},
      {"metric": "roic", "target": ">=15%", "weight": 0.20},
      {"metric": "market_share", "target": "growing", "weight": 0.15},
      {"metric": "employee_engagement", "target": ">=80%", "weight": 0.15}
    ],
    "constraints": [
      "Fiduciary duties to stakeholders",
      "Compliance with regulations",
      "Board approval for major transactions"
    ],
    "handoffs": [
      {"to": "OPERATIONS_DIRECTOR", "trigger": "strategic_initiative", "data": ["initiative", "objectives", "resources"]},
      {"to": "CFO", "trigger": "financial_decision", "data": ["decision_type", "parameters", "timeline"]},
      {"to": "LEGAL", "trigger": "transaction_review", "data": ["transaction", "parties", "terms"]}
    ],
    "tools": [
      "executive_dashboard",
      "financial_summary",
      "market_intelligence",
      "strategic_planner",
      "board_portal",
      "ai_predictive_financials"
    ],
    "ai_augmentation": [
      "Executive dashboards",
      "Predictive financials",
      "Market trend analysis",
      "Scenario modeling"
    ]
  },
  {
    "id": "ROLE-018",
    "name": "IT Administrator",
    "code": "IT_ADMIN",
    "responsibilities": [
      "System configuration and maintenance",
      "User account management",
      "Integration monitoring",
      "Security oversight",
      "Troubleshooting and support",
      "System upgrades and patches"
    ],
    "permissions": [
      "system:read",
      "system:update",
      "user:read",
      "user:create",
      "user:update",
      "user:deactivate",
      "role:read",
      "role:assign",
      "integration:read",
      "integration:update",
      "audit:read",
      "security:read",
      "security:update"
    ],
    "kpis": [
      {"metric": "system_uptime", "target": ">=99.9%", "weight": 0.30},
      {"metric": "support_ticket_resolution_hours", "target": "<=4", "weight": 0.25},
      {"metric": "security_incidents", "target": "0 breaches", "weight": 0.25},
      {"metric": "user_satisfaction", "target": ">=4.0", "weight": 0.10},
      {"metric": "integration_success_rate", "target": ">=99%", "weight": 0.10}
    ],
    "constraints": [
      "Cannot access production data except for troubleshooting",
      "Changes require change management approval",
      "Cannot create admin accounts without two-party approval",
      "Must maintain audit trail"
    ],
    "handoffs": [
      {"to": "VENDOR_SUPPORT", "trigger": "escalation", "data": ["ticket", "symptoms", "troubleshooting_done"]},
      {"to": "SECURITY_TEAM", "trigger": "security_incident", "data": ["incident", "severity", "initial_response"]},
      {"to": "BRANCH_MANAGER", "trigger": "user_access_review", "data": ["users", "access_levels", "review_needed"]}
    ],
    "tools": [
      "admin_console",
      "user_manager",
      "integration_monitor",
      "audit_viewer",
      "security_dashboard",
      "support_ticketing",
      "ai_anomaly_detector"
    ],
    "ai_augmentation": [
      "Anomaly detection (security)",
      "Integration health monitoring",
      "Usage analytics",
      "Predictive issue detection"
    ]
  },
  {
    "id": "ROLE-019",
    "name": "Maintenance Technician",
    "code": "MAINTENANCE_TECH",
    "responsibilities": [
      "Perform preventive maintenance",
      "Repair equipment breakdowns",
      "Maintain maintenance schedules",
      "Order spare parts",
      "Document maintenance activities",
      "Support equipment installations"
    ],
    "permissions": [
      "workcenter:read",
      "workcenter:update:maintenance",
      "maintenance:create",
      "maintenance:read",
      "maintenance:update",
      "spare_parts:read",
      "spare_parts:order",
      "downtime:record",
      "document:read:equipment"
    ],
    "kpis": [
      {"metric": "pm_completion_rate", "target": ">=95%", "weight": 0.25},
      {"metric": "mttr_hours", "target": "<=2", "weight": 0.25},
      {"metric": "mtbf_days", "target": "increasing", "weight": 0.25},
      {"metric": "unplanned_downtime_hours", "target": "<=target", "weight": 0.25}
    ],
    "constraints": [
      "Cannot perform electrical work without certification",
      "Lockout/tagout required for all repairs",
      "Parts > $1K require manager approval",
      "Must complete work order for all activities"
    ],
    "handoffs": [
      {"to": "LEAD_OPERATOR", "trigger": "repair_complete", "data": ["work_center", "repair_done", "limitations"]},
      {"to": "PRODUCTION_PLANNER", "trigger": "extended_downtime", "data": ["work_center", "estimated_duration", "impact"]},
      {"to": "VENDOR_SUPPORT", "trigger": "specialized_repair", "data": ["equipment", "issue", "urgency"]}
    ],
    "tools": [
      "maintenance_app",
      "work_order_system",
      "parts_catalog",
      "equipment_history",
      "pm_scheduler",
      "ai_predictive_maintenance"
    ],
    "ai_augmentation": [
      "Predictive maintenance alerts",
      "Failure pattern recognition",
      "Parts recommendation",
      "Repair time estimation"
    ]
  },
  {
    "id": "ROLE-020",
    "name": "Driver / Delivery",
    "code": "DRIVER",
    "responsibilities": [
      "Transport shipments to customers",
      "Obtain proof of delivery",
      "Handle customer interactions",
      "Maintain vehicle",
      "Report delivery issues"
    ],
    "permissions": [
      "shipment:read:assigned",
      "shipment:update:status",
      "pod:capture",
      "route:read",
      "customer:read:delivery"
    ],
    "kpis": [
      {"metric": "on_time_delivery_rate", "target": ">=98%", "weight": 0.30},
      {"metric": "deliveries_per_day", "target": ">=target", "weight": 0.25},
      {"metric": "pod_capture_rate", "target": "100%", "weight": 0.20},
      {"metric": "damage_rate", "target": "<=0.5%", "weight": 0.15},
      {"metric": "fuel_efficiency", "target": ">=target", "weight": 0.10}
    ],
    "constraints": [
      "Must have valid CDL for heavy loads",
      "Hours of service limits apply",
      "Cannot modify delivery sequence without dispatch approval",
      "Must capture POD for all deliveries"
    ],
    "handoffs": [
      {"to": "SHIPPING_CLERK", "trigger": "delivery_complete", "data": ["shipment_id", "pod", "exceptions"]},
      {"to": "SHIPPING_CLERK", "trigger": "delivery_exception", "data": ["shipment_id", "exception_type", "details"]},
      {"to": "CUSTOMER", "trigger": "arrival", "data": ["eta", "shipment_details"]}
    ],
    "tools": [
      "driver_app",
      "route_navigator",
      "pod_capture",
      "vehicle_inspection",
      "communication"
    ],
    "ai_augmentation": [
      "Route optimization",
      "ETA prediction",
      "Traffic-aware scheduling"
    ]
  }
]
```

---

## 2. Handoff Graph (Adjacency List)

```json
{
  "INSIDE_SALES": [
    {"to": "PRODUCTION_PLANNER", "triggers": ["order_confirmed"]},
    {"to": "SHIPPING_CLERK", "triggers": ["ready_to_ship", "shipping_instructions"]},
    {"to": "CREDIT_ANALYST", "triggers": ["credit_review_needed"]},
    {"to": "OUTSIDE_SALES", "triggers": ["escalation", "key_account_issue"]},
    {"to": "METALLURGIST", "triggers": ["technical_question", "substitution_request"]},
    {"to": "BILLING_CLERK", "triggers": ["invoice_query"]}
  ],
  "OUTSIDE_SALES": [
    {"to": "INSIDE_SALES", "triggers": ["order_processing", "quote_follow_up"]},
    {"to": "CREDIT_ANALYST", "triggers": ["new_account_credit", "credit_increase"]},
    {"to": "BRANCH_MANAGER", "triggers": ["pricing_exception", "major_account_issue"]}
  ],
  "COUNTER_SALES": [
    {"to": "SHOP_OPERATOR", "triggers": ["quick_cut_needed"]},
    {"to": "INSIDE_SALES", "triggers": ["complex_quote", "account_issue"]},
    {"to": "WAREHOUSE_CLERK", "triggers": ["pull_from_stock"]}
  ],
  "PRODUCTION_PLANNER": [
    {"to": "SHOP_OPERATOR", "triggers": ["job_released"]},
    {"to": "LEAD_OPERATOR", "triggers": ["schedule_change", "priority_change"]},
    {"to": "WAREHOUSE_CLERK", "triggers": ["material_staging"]},
    {"to": "INSIDE_SALES", "triggers": ["promise_date_risk", "delay_notification"]},
    {"to": "MAINTENANCE_TECH", "triggers": ["pm_scheduling"]}
  ],
  "SHOP_OPERATOR": [
    {"to": "LEAD_OPERATOR", "triggers": ["issue_escalation", "help_needed"]},
    {"to": "QA_INSPECTOR", "triggers": ["inspection_required", "quality_question"]},
    {"to": "SHOP_OPERATOR", "triggers": ["next_operation"]},
    {"to": "SHIPPING_CLERK", "triggers": ["ready_for_ship"]},
    {"to": "WAREHOUSE_CLERK", "triggers": ["material_needed"]}
  ],
  "LEAD_OPERATOR": [
    {"to": "PRODUCTION_PLANNER", "triggers": ["capacity_issue", "schedule_conflict"]},
    {"to": "MAINTENANCE_TECH", "triggers": ["equipment_issue", "breakdown"]},
    {"to": "QA_INSPECTOR", "triggers": ["quality_concern", "inspection_needed"]},
    {"to": "BRANCH_MANAGER", "triggers": ["major_escalation", "safety_issue"]},
    {"to": "SHOP_OPERATOR", "triggers": ["job_assignment", "priority_change"]}
  ],
  "WAREHOUSE_CLERK": [
    {"to": "QA_INSPECTOR", "triggers": ["inspection_required", "damage_found"]},
    {"to": "PURCHASING", "triggers": ["discrepancy", "po_issue"]},
    {"to": "SHOP_OPERATOR", "triggers": ["material_staged"]},
    {"to": "INVENTORY_MANAGER", "triggers": ["count_variance", "location_issue"]},
    {"to": "SHIPPING_CLERK", "triggers": ["material_available"]}
  ],
  "SHIPPING_CLERK": [
    {"to": "CARRIER", "triggers": ["shipment_ready", "pickup_scheduled"]},
    {"to": "BILLING_CLERK", "triggers": ["shipped"]},
    {"to": "INSIDE_SALES", "triggers": ["shipment_exception", "delay"]},
    {"to": "CUSTOMER", "triggers": ["shipped_notification", "tracking"]},
    {"to": "DRIVER", "triggers": ["delivery_assignment"]}
  ],
  "QA_INSPECTOR": [
    {"to": "METALLURGIST", "triggers": ["chemistry_question", "spec_interpretation"]},
    {"to": "LEAD_OPERATOR", "triggers": ["production_hold", "quality_issue"]},
    {"to": "PURCHASING", "triggers": ["supplier_ncr", "receipt_rejection"]},
    {"to": "SHIPPING_CLERK", "triggers": ["coc_ready", "release_to_ship"]},
    {"to": "SHOP_OPERATOR", "triggers": ["rework_needed"]}
  ],
  "METALLURGIST": [
    {"to": "INSIDE_SALES", "triggers": ["substitution_approved", "technical_response"]},
    {"to": "QA_INSPECTOR", "triggers": ["testing_required", "inspection_criteria"]},
    {"to": "PURCHASING", "triggers": ["supplier_quality_issue", "specification_change"]}
  ],
  "PURCHASING": [
    {"to": "WAREHOUSE_CLERK", "triggers": ["shipment_arriving"]},
    {"to": "INVENTORY_MANAGER", "triggers": ["reorder_recommendation", "lead_time_change"]},
    {"to": "BILLING_CLERK", "triggers": ["invoice_received", "payment_approval"]},
    {"to": "QA_INSPECTOR", "triggers": ["inspection_needed"]}
  ],
  "INVENTORY_MANAGER": [
    {"to": "PURCHASING", "triggers": ["reorder_needed", "supplier_change"]},
    {"to": "BRANCH_MANAGER", "triggers": ["slow_mover_action", "write_off_request"]},
    {"to": "WAREHOUSE_CLERK", "triggers": ["transfer_order", "count_schedule"]},
    {"to": "PRODUCTION_PLANNER", "triggers": ["allocation_issue", "availability_change"]}
  ],
  "BILLING_CLERK": [
    {"to": "CREDIT_ANALYST", "triggers": ["collection_escalation", "payment_issue"]},
    {"to": "INSIDE_SALES", "triggers": ["billing_dispute", "customer_inquiry"]},
    {"to": "CONTROLLER", "triggers": ["month_end_reconciliation", "exception"]}
  ],
  "CREDIT_ANALYST": [
    {"to": "INSIDE_SALES", "triggers": ["credit_approved", "credit_hold_set", "credit_released"]},
    {"to": "CONTROLLER", "triggers": ["bad_debt_reserve", "major_exposure"]}
  ],
  "BRANCH_MANAGER": [
    {"to": "OPERATIONS_DIRECTOR", "triggers": ["major_escalation", "capex_request"]},
    {"to": "HR", "triggers": ["staffing_request", "hr_issue"]},
    {"to": "LEAD_OPERATOR", "triggers": ["directive", "priority_override"]},
    {"to": "INSIDE_SALES", "triggers": ["customer_directive"]}
  ],
  "OPERATIONS_DIRECTOR": [
    {"to": "EXECUTIVE", "triggers": ["strategic_decision", "major_investment"]},
    {"to": "BRANCH_MANAGER", "triggers": ["initiative_rollout", "directive"]},
    {"to": "IT_ADMIN", "triggers": ["system_requirements", "capability_request"]}
  ],
  "EXECUTIVE": [
    {"to": "OPERATIONS_DIRECTOR", "triggers": ["strategic_initiative"]},
    {"to": "CFO", "triggers": ["financial_decision"]},
    {"to": "LEGAL", "triggers": ["transaction_review"]}
  ],
  "IT_ADMIN": [
    {"to": "VENDOR_SUPPORT", "triggers": ["escalation", "bug_report"]},
    {"to": "SECURITY_TEAM", "triggers": ["security_incident"]},
    {"to": "BRANCH_MANAGER", "triggers": ["user_access_review"]}
  ],
  "MAINTENANCE_TECH": [
    {"to": "LEAD_OPERATOR", "triggers": ["repair_complete", "status_update"]},
    {"to": "PRODUCTION_PLANNER", "triggers": ["extended_downtime", "pm_schedule"]},
    {"to": "VENDOR_SUPPORT", "triggers": ["specialized_repair"]}
  ],
  "DRIVER": [
    {"to": "SHIPPING_CLERK", "triggers": ["delivery_complete", "delivery_exception"]},
    {"to": "CUSTOMER", "triggers": ["arrival", "delivery_attempt"]}
  ]
}
```

---

## 3. Persona Requirements Matrix

### Legend

| Level | Code | Description |
|-------|------|-------------|
| **Core** | C | Primary daily tool; deep feature access required |
| **Regular** | R | Frequent use; standard feature set |
| **Occasional** | O | Periodic access; read-heavy or specific actions |
| **View Only** | V | Read-only access for visibility |
| **None** | — | No access required |

### Matrix

| Persona | Order Mgmt | Quote Builder | Production Scheduling | Shop Floor Execution | Inventory Mgmt | Warehouse Ops | Shipping | Quality/QC | Pricing | Analytics | Customer Portal | Purchasing | Billing/AR | Credit Mgmt | Admin Console | Traceability |
|---------|------------|---------------|----------------------|---------------------|----------------|---------------|----------|------------|---------|-----------|-----------------|------------|------------|-------------|---------------|--------------|
| **Inside Sales** | C | C | V | V | R | V | R | V | R | R | R | V | V | V | — | R |
| **Outside Sales** | R | C | V | — | V | — | V | — | C | C | R | — | V | R | — | V |
| **Counter Sales** | C | R | — | V | R | V | V | — | R | O | — | — | R | V | — | O |
| **Production Planner** | R | V | C | R | C | R | V | V | — | C | — | V | — | — | — | R |
| **Shop Operator** | V | — | V | C | R | R | — | R | — | O | — | — | — | — | — | R |
| **Lead Operator** | V | — | R | C | R | R | V | R | — | R | — | — | — | — | — | R |
| **Warehouse Clerk** | V | — | V | — | C | C | R | R | — | O | — | R | — | — | — | R |
| **Shipping Clerk** | R | — | V | — | R | R | C | V | — | O | — | — | V | — | — | R |
| **QA Inspector** | V | — | V | V | R | R | V | C | — | R | — | V | — | — | — | C |
| **Metallurgist** | V | — | — | — | R | — | — | C | — | R | — | V | — | — | — | C |
| **Purchasing** | V | — | V | — | C | R | — | R | R | R | — | C | V | — | — | R |
| **Inventory Manager** | V | — | R | — | C | R | V | V | — | C | — | R | — | — | — | R |
| **Billing Clerk** | R | — | — | — | V | — | R | — | V | R | — | V | C | V | — | V |
| **Credit Analyst** | R | — | — | — | — | — | V | — | — | R | — | — | R | C | — | — |
| **Branch Manager** | R | R | R | V | R | V | R | V | R | C | V | V | R | R | O | R |
| **Operations Director** | V | — | R | V | R | V | V | V | R | C | — | R | V | V | V | R |
| **Executive** | V | — | V | — | V | — | V | — | V | C | V | V | V | V | V | V |
| **IT Admin** | V | — | V | V | V | V | V | V | V | R | V | V | V | V | C | V |
| **Maintenance Tech** | — | — | V | R | O | — | — | — | — | O | — | O | — | — | — | — |
| **Driver** | V | — | — | — | — | — | R | — | — | — | — | — | — | — | — | — |

---

## 4. Module Access Detail by Persona

```json
{
  "INSIDE_SALES": {
    "order_management": {"level": "core", "capabilities": ["create", "read", "update", "cancel"]},
    "quote_builder": {"level": "core", "capabilities": ["create", "read", "update", "send", "convert"]},
    "production_scheduling": {"level": "view", "capabilities": ["read"]},
    "shop_floor": {"level": "view", "capabilities": ["read_status"]},
    "inventory": {"level": "regular", "capabilities": ["read", "check_availability", "reserve"]},
    "warehouse": {"level": "view", "capabilities": ["read"]},
    "shipping": {"level": "regular", "capabilities": ["read", "update_instructions"]},
    "quality": {"level": "view", "capabilities": ["read"]},
    "pricing": {"level": "regular", "capabilities": ["read", "calculate", "override_limited"]},
    "analytics": {"level": "regular", "capabilities": ["read_sales", "read_customer"]},
    "customer_portal": {"level": "regular", "capabilities": ["read", "respond"]},
    "purchasing": {"level": "view", "capabilities": ["read"]},
    "billing": {"level": "view", "capabilities": ["read"]},
    "credit": {"level": "view", "capabilities": ["read_status"]},
    "traceability": {"level": "regular", "capabilities": ["read", "query"]}
  },
  "PRODUCTION_PLANNER": {
    "order_management": {"level": "regular", "capabilities": ["read", "view_queue"]},
    "quote_builder": {"level": "view", "capabilities": ["read"]},
    "production_scheduling": {"level": "core", "capabilities": ["create", "read", "update", "release", "simulate"]},
    "shop_floor": {"level": "regular", "capabilities": ["read", "monitor", "reassign"]},
    "inventory": {"level": "core", "capabilities": ["read", "reserve", "allocate"]},
    "warehouse": {"level": "regular", "capabilities": ["read", "request_staging"]},
    "shipping": {"level": "view", "capabilities": ["read"]},
    "quality": {"level": "view", "capabilities": ["read_holds"]},
    "analytics": {"level": "core", "capabilities": ["read_production", "read_capacity", "read_performance"]},
    "traceability": {"level": "regular", "capabilities": ["read", "query"]}
  },
  "SHOP_OPERATOR": {
    "order_management": {"level": "view", "capabilities": ["read_assigned"]},
    "production_scheduling": {"level": "view", "capabilities": ["read_queue"]},
    "shop_floor": {"level": "core", "capabilities": ["read", "update_status", "record_actuals", "record_downtime"]},
    "inventory": {"level": "regular", "capabilities": ["read", "issue", "receive_production"]},
    "warehouse": {"level": "regular", "capabilities": ["read", "request_material"]},
    "quality": {"level": "regular", "capabilities": ["read", "record_inspection", "flag_issue"]},
    "analytics": {"level": "occasional", "capabilities": ["read_own_performance"]},
    "traceability": {"level": "regular", "capabilities": ["read", "scan", "record"]}
  },
  "QA_INSPECTOR": {
    "order_management": {"level": "view", "capabilities": ["read"]},
    "production_scheduling": {"level": "view", "capabilities": ["read"]},
    "shop_floor": {"level": "view", "capabilities": ["read"]},
    "inventory": {"level": "regular", "capabilities": ["read", "hold", "release"]},
    "warehouse": {"level": "regular", "capabilities": ["read"]},
    "shipping": {"level": "view", "capabilities": ["read"]},
    "quality": {"level": "core", "capabilities": ["create", "read", "update", "hold", "release", "ncr_create"]},
    "analytics": {"level": "regular", "capabilities": ["read_quality"]},
    "traceability": {"level": "core", "capabilities": ["read", "query", "certify"]}
  },
  "INVENTORY_MANAGER": {
    "order_management": {"level": "view", "capabilities": ["read"]},
    "production_scheduling": {"level": "regular", "capabilities": ["read"]},
    "inventory": {"level": "core", "capabilities": ["read", "update", "adjust", "transfer", "classify", "write_off"]},
    "warehouse": {"level": "regular", "capabilities": ["read", "manage_locations"]},
    "shipping": {"level": "view", "capabilities": ["read"]},
    "quality": {"level": "view", "capabilities": ["read_holds"]},
    "analytics": {"level": "core", "capabilities": ["read_inventory", "read_demand", "read_performance"]},
    "purchasing": {"level": "regular", "capabilities": ["read", "recommend"]},
    "traceability": {"level": "regular", "capabilities": ["read", "query"]}
  },
  "BRANCH_MANAGER": {
    "order_management": {"level": "regular", "capabilities": ["read", "approve_exception"]},
    "quote_builder": {"level": "regular", "capabilities": ["read", "approve_discount"]},
    "production_scheduling": {"level": "regular", "capabilities": ["read", "override_priority"]},
    "shop_floor": {"level": "view", "capabilities": ["read", "monitor"]},
    "inventory": {"level": "regular", "capabilities": ["read", "approve_adjustment"]},
    "warehouse": {"level": "view", "capabilities": ["read"]},
    "shipping": {"level": "regular", "capabilities": ["read"]},
    "quality": {"level": "view", "capabilities": ["read"]},
    "pricing": {"level": "regular", "capabilities": ["read", "override_extended"]},
    "analytics": {"level": "core", "capabilities": ["read_all_branch", "compare", "export"]},
    "customer_portal": {"level": "view", "capabilities": ["read"]},
    "purchasing": {"level": "view", "capabilities": ["read"]},
    "billing": {"level": "regular", "capabilities": ["read", "approve_credit"]},
    "credit": {"level": "regular", "capabilities": ["read", "override"]},
    "admin_console": {"level": "occasional", "capabilities": ["read", "user_review"]},
    "traceability": {"level": "regular", "capabilities": ["read", "query"]}
  }
}
```

---

## 5. Handoff Frequency Matrix

| From \ To | INSIDE_SALES | OUTSIDE_SALES | COUNTER_SALES | PROD_PLANNER | SHOP_OP | LEAD_OP | WAREHOUSE | SHIPPING | QA | METALLURGIST | PURCHASING | INV_MGR | BILLING | CREDIT | BRANCH_MGR | OPS_DIR | MAINT | DRIVER |
|-----------|--------------|---------------|---------------|--------------|---------|---------|-----------|----------|-----|--------------|------------|---------|---------|--------|------------|---------|-------|--------|
| **INSIDE_SALES** | — | M | — | H | — | — | — | H | — | L | — | — | L | M | L | — | — | — |
| **OUTSIDE_SALES** | H | — | — | — | — | — | — | — | — | — | — | — | — | M | M | — | — | — |
| **COUNTER_SALES** | M | — | — | — | H | — | M | — | — | — | — | — | — | — | — | — | — | — |
| **PROD_PLANNER** | M | — | — | — | H | H | M | — | — | — | — | L | — | — | — | — | L | — |
| **SHOP_OP** | — | — | — | — | M | H | M | M | M | — | — | — | — | — | — | — | — | — |
| **LEAD_OP** | — | — | — | M | H | — | — | — | M | — | — | — | — | — | L | — | M | — |
| **WAREHOUSE** | — | — | — | — | M | — | — | M | M | — | M | M | — | — | — | — | — | — |
| **SHIPPING** | L | — | — | — | — | — | — | — | — | — | — | — | H | — | — | — | — | H |
| **QA** | — | — | — | — | M | M | — | M | — | M | M | — | — | — | — | — | — | — |
| **METALLURGIST** | M | — | — | — | — | — | — | — | M | — | L | — | — | — | — | — | — | — |
| **PURCHASING** | — | — | — | — | — | — | M | — | L | — | — | M | L | — | — | — | — | — |
| **INV_MGR** | — | — | — | L | — | — | M | — | — | — | M | — | — | — | L | — | — | — |
| **BILLING** | L | — | — | — | — | — | — | — | — | — | — | — | — | M | — | — | — | — |
| **CREDIT** | M | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| **BRANCH_MGR** | L | — | — | — | — | M | — | — | — | — | — | — | — | — | — | L | — | — |
| **OPS_DIR** | — | — | — | — | — | — | — | — | — | — | — | — | — | — | M | — | — | — |
| **MAINT** | — | — | — | L | — | M | — | — | — | — | — | — | — | — | — | — | — | — |
| **DRIVER** | — | — | — | — | — | — | — | M | — | — | — | — | — | — | — | — | — | — |

**Frequency Legend:** H = High (multiple/day), M = Medium (daily), L = Low (weekly or less)

---

*Document generated for AI-build Phase 02: User Roles & Personas*
