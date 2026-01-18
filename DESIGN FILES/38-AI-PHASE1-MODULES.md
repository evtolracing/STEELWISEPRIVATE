# 38 — AI Phase 1 Module Definition

> **Purpose:** Structured module definitions for Phase 1 MVP with inputs, outputs, events, KPIs, dependencies, interactions, and failure modes.  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. Modules

```json
[
  {
    "id": "MOD-001",
    "name": "Product Catalog",
    "code": "PRODUCT_CATALOG",
    "domain": "Master Data",
    "inputs": [
      {"name": "product_definition", "type": "ProductDTO", "source": "user_input|import"},
      {"name": "grade_specification", "type": "GradeDTO", "source": "user_input|import"},
      {"name": "pricing_rules", "type": "PricingRuleDTO", "source": "PRICING"},
      {"name": "supplier_catalog", "type": "SupplierProductDTO", "source": "PURCHASING"},
      {"name": "inventory_levels", "type": "InventorySummaryDTO", "source": "INVENTORY"}
    ],
    "outputs": [
      {"name": "product_list", "type": "Product[]", "consumers": ["QUOTING", "ORDER_MGMT", "INVENTORY", "ECOMMERCE"]},
      {"name": "grade_list", "type": "Grade[]", "consumers": ["QUOTING", "QUALITY", "TRACEABILITY"]},
      {"name": "product_availability", "type": "AvailabilityDTO", "consumers": ["QUOTING", "ECOMMERCE"]},
      {"name": "product_substitutes", "type": "SubstituteDTO[]", "consumers": ["QUOTING", "ORDER_MGMT"]}
    ],
    "events": [
      {"name": "product.created", "payload": "ProductDTO", "subscribers": ["INVENTORY", "PRICING", "ECOMMERCE"]},
      {"name": "product.updated", "payload": "ProductDTO", "subscribers": ["INVENTORY", "PRICING", "ECOMMERCE"]},
      {"name": "product.discontinued", "payload": "ProductIdDTO", "subscribers": ["INVENTORY", "QUOTING", "ECOMMERCE"]},
      {"name": "grade.created", "payload": "GradeDTO", "subscribers": ["QUALITY", "TRACEABILITY"]},
      {"name": "substitution.defined", "payload": "SubstitutionDTO", "subscribers": ["QUOTING", "ORDER_MGMT"]}
    ],
    "kpis": [
      {"metric": "catalog_completeness", "formula": "products_with_full_specs / total_products", "target": ">=95%"},
      {"metric": "grade_coverage", "formula": "grades_defined / grades_in_inventory", "target": "100%"},
      {"metric": "substitution_coverage", "formula": "products_with_substitutes / total_products", "target": ">=80%"},
      {"metric": "catalog_sync_latency", "formula": "time_to_propagate_change", "target": "<=5s"}
    ],
    "dependencies": [
      {"module": "PRICING", "type": "soft", "reason": "Pricing rules for product display"},
      {"module": "INVENTORY", "type": "soft", "reason": "Availability status"}
    ],
    "ai_capabilities": [
      {"feature": "auto_categorization", "model": "classification", "input": "product_description", "output": "category_id"},
      {"feature": "substitution_matching", "model": "similarity", "input": "product_specs", "output": "substitute_products"},
      {"feature": "spec_extraction", "model": "nlp", "input": "supplier_pdf", "output": "product_attributes"}
    ],
    "api_surface": [
      {"endpoint": "GET /products", "auth": "read:products"},
      {"endpoint": "GET /products/{id}", "auth": "read:products"},
      {"endpoint": "POST /products", "auth": "write:products"},
      {"endpoint": "PUT /products/{id}", "auth": "write:products"},
      {"endpoint": "GET /grades", "auth": "read:grades"},
      {"endpoint": "GET /products/{id}/substitutes", "auth": "read:products"}
    ]
  },
  {
    "id": "MOD-002",
    "name": "Inventory Management",
    "code": "INVENTORY",
    "domain": "Operations",
    "inputs": [
      {"name": "receipt", "type": "ReceiptDTO", "source": "WAREHOUSE"},
      {"name": "issue", "type": "IssueDTO", "source": "SHOP_FLOOR|SHIPPING"},
      {"name": "adjustment", "type": "AdjustmentDTO", "source": "user_input"},
      {"name": "transfer", "type": "TransferDTO", "source": "user_input|INVENTORY"},
      {"name": "allocation_request", "type": "AllocationRequestDTO", "source": "ORDER_MGMT"},
      {"name": "production_output", "type": "ProductionOutputDTO", "source": "SHOP_FLOOR"},
      {"name": "quality_hold", "type": "QualityHoldDTO", "source": "QUALITY"}
    ],
    "outputs": [
      {"name": "inventory_balance", "type": "InventoryBalanceDTO[]", "consumers": ["QUOTING", "ORDER_MGMT", "PRODUCTION", "ANALYTICS"]},
      {"name": "available_to_promise", "type": "ATPDTO[]", "consumers": ["QUOTING", "ORDER_MGMT"]},
      {"name": "allocation_confirmation", "type": "AllocationDTO", "consumers": ["ORDER_MGMT"]},
      {"name": "reorder_recommendations", "type": "ReorderDTO[]", "consumers": ["PURCHASING"]},
      {"name": "inventory_valuation", "type": "ValuationDTO", "consumers": ["BILLING", "ANALYTICS"]}
    ],
    "events": [
      {"name": "inventory.received", "payload": "ReceiptDTO", "subscribers": ["TRACEABILITY", "QUALITY", "ANALYTICS"]},
      {"name": "inventory.issued", "payload": "IssueDTO", "subscribers": ["TRACEABILITY", "BILLING", "ANALYTICS"]},
      {"name": "inventory.adjusted", "payload": "AdjustmentDTO", "subscribers": ["TRACEABILITY", "ANALYTICS"]},
      {"name": "inventory.transferred", "payload": "TransferDTO", "subscribers": ["TRACEABILITY", "ANALYTICS"]},
      {"name": "inventory.allocated", "payload": "AllocationDTO", "subscribers": ["ORDER_MGMT", "PRODUCTION"]},
      {"name": "inventory.deallocated", "payload": "DeallocationDTO", "subscribers": ["ORDER_MGMT"]},
      {"name": "inventory.low_stock", "payload": "LowStockDTO", "subscribers": ["PURCHASING", "ANALYTICS"]},
      {"name": "inventory.held", "payload": "HoldDTO", "subscribers": ["ORDER_MGMT", "PRODUCTION"]},
      {"name": "inventory.released", "payload": "ReleaseDTO", "subscribers": ["ORDER_MGMT", "PRODUCTION"]}
    ],
    "kpis": [
      {"metric": "inventory_accuracy", "formula": "matching_locations / total_locations", "target": ">=99%"},
      {"metric": "inventory_turns", "formula": "cogs / avg_inventory", "target": ">=6"},
      {"metric": "stock_out_rate", "formula": "stock_outs / total_requests", "target": "<=1%"},
      {"metric": "dead_stock_ratio", "formula": "no_movement_12mo / total_inventory", "target": "<=3%"},
      {"metric": "allocation_accuracy", "formula": "fulfilled_allocations / total_allocations", "target": ">=99%"}
    ],
    "dependencies": [
      {"module": "PRODUCT_CATALOG", "type": "hard", "reason": "Product definitions"},
      {"module": "WAREHOUSE", "type": "hard", "reason": "Physical operations"},
      {"module": "TRACEABILITY", "type": "hard", "reason": "Provenance tracking"}
    ],
    "ai_capabilities": [
      {"feature": "demand_forecasting", "model": "time_series", "input": "historical_demand", "output": "forecast_demand"},
      {"feature": "safety_stock_optimization", "model": "optimization", "input": "demand_variability,lead_time", "output": "safety_stock_level"},
      {"feature": "abc_classification", "model": "clustering", "input": "velocity,value,criticality", "output": "abc_class"},
      {"feature": "slow_mover_identification", "model": "anomaly_detection", "input": "movement_history", "output": "slow_mover_flag"},
      {"feature": "transfer_recommendation", "model": "network_optimization", "input": "network_inventory,demand", "output": "transfer_plan"}
    ],
    "api_surface": [
      {"endpoint": "GET /inventory", "auth": "read:inventory"},
      {"endpoint": "GET /inventory/{id}", "auth": "read:inventory"},
      {"endpoint": "POST /inventory/receipts", "auth": "write:inventory"},
      {"endpoint": "POST /inventory/issues", "auth": "write:inventory"},
      {"endpoint": "POST /inventory/adjustments", "auth": "write:inventory"},
      {"endpoint": "POST /inventory/transfers", "auth": "write:inventory"},
      {"endpoint": "POST /inventory/allocate", "auth": "write:inventory"},
      {"endpoint": "GET /inventory/atp", "auth": "read:inventory"}
    ]
  },
  {
    "id": "MOD-003",
    "name": "Warehouse Operations",
    "code": "WAREHOUSE",
    "domain": "Operations",
    "inputs": [
      {"name": "inbound_shipment", "type": "InboundShipmentDTO", "source": "PURCHASING"},
      {"name": "put_away_instruction", "type": "PutAwayDTO", "source": "INVENTORY"},
      {"name": "pick_request", "type": "PickRequestDTO", "source": "SHIPPING|PRODUCTION"},
      {"name": "cycle_count_schedule", "type": "CycleCountDTO", "source": "INVENTORY"},
      {"name": "mtr_document", "type": "MTRDocumentDTO", "source": "external"}
    ],
    "outputs": [
      {"name": "receipt_confirmation", "type": "ReceiptDTO", "consumers": ["INVENTORY", "PURCHASING"]},
      {"name": "put_away_confirmation", "type": "PutAwayConfirmDTO", "consumers": ["INVENTORY"]},
      {"name": "pick_confirmation", "type": "PickConfirmDTO", "consumers": ["SHIPPING", "PRODUCTION"]},
      {"name": "cycle_count_result", "type": "CountResultDTO", "consumers": ["INVENTORY"]},
      {"name": "mtr_extracted_data", "type": "MTRDataDTO", "consumers": ["QUALITY", "TRACEABILITY"]}
    ],
    "events": [
      {"name": "warehouse.received", "payload": "ReceiptDTO", "subscribers": ["INVENTORY", "QUALITY", "TRACEABILITY"]},
      {"name": "warehouse.putaway_complete", "payload": "PutAwayConfirmDTO", "subscribers": ["INVENTORY"]},
      {"name": "warehouse.picked", "payload": "PickConfirmDTO", "subscribers": ["SHIPPING", "PRODUCTION"]},
      {"name": "warehouse.count_complete", "payload": "CountResultDTO", "subscribers": ["INVENTORY"]},
      {"name": "warehouse.mtr_captured", "payload": "MTRDataDTO", "subscribers": ["QUALITY", "TRACEABILITY"]},
      {"name": "warehouse.discrepancy", "payload": "DiscrepancyDTO", "subscribers": ["PURCHASING", "INVENTORY"]}
    ],
    "kpis": [
      {"metric": "receiving_accuracy", "formula": "accurate_receipts / total_receipts", "target": ">=99.5%"},
      {"metric": "dock_to_stock_hours", "formula": "avg_time_to_putaway", "target": "<=4"},
      {"metric": "put_away_accuracy", "formula": "correct_locations / total_putaways", "target": ">=99%"},
      {"metric": "pick_accuracy", "formula": "correct_picks / total_picks", "target": ">=99.5%"},
      {"metric": "mtr_capture_rate", "formula": "mtrs_captured / receipts_requiring_mtr", "target": "100%"}
    ],
    "dependencies": [
      {"module": "INVENTORY", "type": "hard", "reason": "Inventory transactions"},
      {"module": "PURCHASING", "type": "soft", "reason": "PO information for receiving"},
      {"module": "QUALITY", "type": "soft", "reason": "Inspection triggers"}
    ],
    "ai_capabilities": [
      {"feature": "put_away_optimization", "model": "optimization", "input": "material_properties,location_constraints", "output": "optimal_location"},
      {"feature": "mtr_ocr_extraction", "model": "document_ai", "input": "mtr_image", "output": "mtr_structured_data"},
      {"feature": "discrepancy_detection", "model": "anomaly_detection", "input": "expected_vs_actual", "output": "discrepancy_flag"},
      {"feature": "pick_path_optimization", "model": "routing", "input": "pick_list,warehouse_layout", "output": "optimized_path"}
    ],
    "api_surface": [
      {"endpoint": "POST /warehouse/receive", "auth": "write:warehouse"},
      {"endpoint": "POST /warehouse/putaway", "auth": "write:warehouse"},
      {"endpoint": "POST /warehouse/pick", "auth": "write:warehouse"},
      {"endpoint": "POST /warehouse/cycle-count", "auth": "write:warehouse"},
      {"endpoint": "POST /warehouse/mtr/upload", "auth": "write:warehouse"},
      {"endpoint": "GET /warehouse/locations", "auth": "read:warehouse"}
    ]
  },
  {
    "id": "MOD-004",
    "name": "Quoting",
    "code": "QUOTING",
    "domain": "Sales",
    "inputs": [
      {"name": "rfq", "type": "RFQDTO", "source": "user_input|email|portal|edi"},
      {"name": "customer_info", "type": "CustomerDTO", "source": "CUSTOMER_MGMT"},
      {"name": "product_catalog", "type": "Product[]", "source": "PRODUCT_CATALOG"},
      {"name": "inventory_availability", "type": "ATPDTO[]", "source": "INVENTORY"},
      {"name": "pricing_data", "type": "PriceDTO", "source": "PRICING"},
      {"name": "capacity_info", "type": "CapacityDTO", "source": "PRODUCTION"}
    ],
    "outputs": [
      {"name": "quote", "type": "QuoteDTO", "consumers": ["ORDER_MGMT", "CUSTOMER", "ANALYTICS"]},
      {"name": "quote_document", "type": "QuotePDFDTO", "consumers": ["CUSTOMER"]},
      {"name": "quote_analytics", "type": "QuoteMetricsDTO", "consumers": ["ANALYTICS"]}
    ],
    "events": [
      {"name": "quote.created", "payload": "QuoteDTO", "subscribers": ["ANALYTICS", "CRM"]},
      {"name": "quote.sent", "payload": "QuoteSentDTO", "subscribers": ["ANALYTICS", "CRM"]},
      {"name": "quote.accepted", "payload": "QuoteAcceptedDTO", "subscribers": ["ORDER_MGMT", "ANALYTICS"]},
      {"name": "quote.rejected", "payload": "QuoteRejectedDTO", "subscribers": ["ANALYTICS", "CRM"]},
      {"name": "quote.expired", "payload": "QuoteExpiredDTO", "subscribers": ["ANALYTICS", "CRM"]},
      {"name": "quote.revised", "payload": "QuoteDTO", "subscribers": ["ANALYTICS"]}
    ],
    "kpis": [
      {"metric": "quote_conversion_rate", "formula": "accepted_quotes / total_quotes", "target": ">=35%"},
      {"metric": "quote_turnaround_hours", "formula": "avg_time_rfq_to_quote_sent", "target": "<=2"},
      {"metric": "quote_accuracy", "formula": "quotes_without_revision / total_quotes", "target": ">=95%"},
      {"metric": "ai_quote_acceptance", "formula": "ai_quotes_used / ai_quotes_generated", "target": ">=80%"},
      {"metric": "average_quote_value", "formula": "total_quote_value / quote_count", "target": "tracking"}
    ],
    "dependencies": [
      {"module": "PRODUCT_CATALOG", "type": "hard", "reason": "Product information"},
      {"module": "INVENTORY", "type": "hard", "reason": "Availability check"},
      {"module": "PRICING", "type": "hard", "reason": "Price calculation"},
      {"module": "CUSTOMER_MGMT", "type": "hard", "reason": "Customer data and terms"},
      {"module": "PRODUCTION", "type": "soft", "reason": "Lead time estimation"}
    ],
    "ai_capabilities": [
      {"feature": "rfq_parsing", "model": "nlp", "input": "rfq_email_text", "output": "structured_rfq"},
      {"feature": "win_probability", "model": "classification", "input": "quote_features,customer_history", "output": "win_probability_score"},
      {"feature": "price_optimization", "model": "optimization", "input": "cost,competition,elasticity", "output": "optimal_price"},
      {"feature": "lead_time_prediction", "model": "regression", "input": "order_specs,capacity", "output": "estimated_lead_time"},
      {"feature": "cross_sell_recommendation", "model": "recommendation", "input": "quote_items,customer_history", "output": "recommended_products"}
    ],
    "api_surface": [
      {"endpoint": "GET /quotes", "auth": "read:quotes"},
      {"endpoint": "GET /quotes/{id}", "auth": "read:quotes"},
      {"endpoint": "POST /quotes", "auth": "write:quotes"},
      {"endpoint": "PUT /quotes/{id}", "auth": "write:quotes"},
      {"endpoint": "POST /quotes/{id}/send", "auth": "write:quotes"},
      {"endpoint": "POST /quotes/{id}/convert", "auth": "write:quotes"},
      {"endpoint": "POST /quotes/ai-generate", "auth": "write:quotes"}
    ]
  },
  {
    "id": "MOD-005",
    "name": "Order Management",
    "code": "ORDER_MGMT",
    "domain": "Sales",
    "inputs": [
      {"name": "order", "type": "OrderDTO", "source": "QUOTING|user_input|edi|portal"},
      {"name": "customer_info", "type": "CustomerDTO", "source": "CUSTOMER_MGMT"},
      {"name": "credit_status", "type": "CreditStatusDTO", "source": "CREDIT"},
      {"name": "inventory_availability", "type": "ATPDTO[]", "source": "INVENTORY"},
      {"name": "production_schedule", "type": "ScheduleDTO", "source": "PRODUCTION"}
    ],
    "outputs": [
      {"name": "order_confirmation", "type": "OrderConfirmDTO", "consumers": ["CUSTOMER", "PRODUCTION", "SHIPPING"]},
      {"name": "work_order_request", "type": "WorkOrderRequestDTO", "consumers": ["PRODUCTION"]},
      {"name": "allocation_request", "type": "AllocationRequestDTO", "consumers": ["INVENTORY"]},
      {"name": "order_status", "type": "OrderStatusDTO", "consumers": ["CUSTOMER", "SALES"]}
    ],
    "events": [
      {"name": "order.created", "payload": "OrderDTO", "subscribers": ["PRODUCTION", "INVENTORY", "BILLING", "ANALYTICS"]},
      {"name": "order.confirmed", "payload": "OrderConfirmDTO", "subscribers": ["CUSTOMER", "PRODUCTION"]},
      {"name": "order.modified", "payload": "OrderModifiedDTO", "subscribers": ["PRODUCTION", "INVENTORY", "BILLING"]},
      {"name": "order.cancelled", "payload": "OrderCancelledDTO", "subscribers": ["PRODUCTION", "INVENTORY", "BILLING"]},
      {"name": "order.completed", "payload": "OrderCompletedDTO", "subscribers": ["BILLING", "ANALYTICS"]},
      {"name": "order.credit_hold", "payload": "CreditHoldDTO", "subscribers": ["SALES", "CREDIT"]},
      {"name": "order.released", "payload": "OrderReleasedDTO", "subscribers": ["PRODUCTION", "SHIPPING"]}
    ],
    "kpis": [
      {"metric": "order_entry_time", "formula": "avg_time_to_enter_order", "target": "<=5min"},
      {"metric": "order_accuracy", "formula": "orders_without_error / total_orders", "target": ">=99%"},
      {"metric": "promise_date_accuracy", "formula": "orders_on_time / total_orders", "target": ">=98%"},
      {"metric": "order_modification_rate", "formula": "modified_orders / total_orders", "target": "<=5%"},
      {"metric": "order_fill_rate", "formula": "lines_filled_from_stock / total_lines", "target": ">=95%"}
    ],
    "dependencies": [
      {"module": "QUOTING", "type": "soft", "reason": "Quote conversion"},
      {"module": "CUSTOMER_MGMT", "type": "hard", "reason": "Customer validation"},
      {"module": "CREDIT", "type": "hard", "reason": "Credit check"},
      {"module": "INVENTORY", "type": "hard", "reason": "Allocation"},
      {"module": "PRODUCTION", "type": "hard", "reason": "Work order creation"},
      {"module": "PRICING", "type": "hard", "reason": "Order pricing"}
    ],
    "ai_capabilities": [
      {"feature": "po_parsing", "model": "document_ai", "input": "po_document", "output": "structured_order"},
      {"feature": "promise_date_prediction", "model": "regression", "input": "order_specs,capacity,inventory", "output": "predicted_ship_date"},
      {"feature": "order_priority_scoring", "model": "ranking", "input": "order_attributes,customer_value", "output": "priority_score"},
      {"feature": "intelligent_allocation", "model": "optimization", "input": "order_requirements,inventory", "output": "allocation_plan"}
    ],
    "api_surface": [
      {"endpoint": "GET /orders", "auth": "read:orders"},
      {"endpoint": "GET /orders/{id}", "auth": "read:orders"},
      {"endpoint": "POST /orders", "auth": "write:orders"},
      {"endpoint": "PUT /orders/{id}", "auth": "write:orders"},
      {"endpoint": "POST /orders/{id}/confirm", "auth": "write:orders"},
      {"endpoint": "POST /orders/{id}/cancel", "auth": "write:orders"},
      {"endpoint": "GET /orders/{id}/status", "auth": "read:orders"}
    ]
  },
  {
    "id": "MOD-006",
    "name": "Production Scheduling",
    "code": "PRODUCTION",
    "domain": "Operations",
    "inputs": [
      {"name": "work_order_request", "type": "WorkOrderRequestDTO", "source": "ORDER_MGMT"},
      {"name": "work_center_status", "type": "WorkCenterStatusDTO", "source": "SHOP_FLOOR"},
      {"name": "work_center_capacity", "type": "CapacityDTO", "source": "SHOP_FLOOR"},
      {"name": "material_availability", "type": "MaterialAvailDTO", "source": "INVENTORY"},
      {"name": "operator_availability", "type": "OperatorAvailDTO", "source": "LABOR"}
    ],
    "outputs": [
      {"name": "work_order", "type": "WorkOrderDTO", "consumers": ["SHOP_FLOOR"]},
      {"name": "schedule", "type": "ScheduleDTO", "consumers": ["SHOP_FLOOR", "ORDER_MGMT", "SHIPPING"]},
      {"name": "capacity_forecast", "type": "CapacityForecastDTO", "consumers": ["QUOTING", "ORDER_MGMT"]},
      {"name": "routing", "type": "RoutingDTO", "consumers": ["SHOP_FLOOR"]}
    ],
    "events": [
      {"name": "workorder.created", "payload": "WorkOrderDTO", "subscribers": ["SHOP_FLOOR", "INVENTORY", "ANALYTICS"]},
      {"name": "workorder.scheduled", "payload": "ScheduledDTO", "subscribers": ["SHOP_FLOOR", "ORDER_MGMT"]},
      {"name": "workorder.released", "payload": "ReleasedDTO", "subscribers": ["SHOP_FLOOR", "INVENTORY"]},
      {"name": "workorder.rescheduled", "payload": "RescheduledDTO", "subscribers": ["SHOP_FLOOR", "ORDER_MGMT"]},
      {"name": "schedule.updated", "payload": "ScheduleDTO", "subscribers": ["SHOP_FLOOR", "ORDER_MGMT", "SHIPPING"]},
      {"name": "capacity.exceeded", "payload": "CapacityAlertDTO", "subscribers": ["ORDER_MGMT", "ANALYTICS"]}
    ],
    "kpis": [
      {"metric": "schedule_adherence", "formula": "jobs_on_schedule / total_scheduled_jobs", "target": ">=95%"},
      {"metric": "work_center_utilization", "formula": "productive_hours / available_hours", "target": ">=75%"},
      {"metric": "setup_time_ratio", "formula": "setup_hours / total_hours", "target": "<=15%"},
      {"metric": "on_time_release", "formula": "jobs_released_on_time / total_jobs", "target": ">=98%"},
      {"metric": "capacity_forecast_accuracy", "formula": "1 - abs(forecast - actual) / actual", "target": ">=90%"}
    ],
    "dependencies": [
      {"module": "ORDER_MGMT", "type": "hard", "reason": "Work order source"},
      {"module": "SHOP_FLOOR", "type": "hard", "reason": "Execution feedback"},
      {"module": "INVENTORY", "type": "hard", "reason": "Material availability"}
    ],
    "ai_capabilities": [
      {"feature": "ai_scheduling", "model": "constraint_optimization", "input": "jobs,resources,constraints", "output": "optimized_schedule"},
      {"feature": "routing_recommendation", "model": "classification", "input": "job_specs,machine_capabilities", "output": "optimal_routing"},
      {"feature": "setup_optimization", "model": "sequencing", "input": "job_queue,setup_matrix", "output": "optimized_sequence"},
      {"feature": "bottleneck_prediction", "model": "simulation", "input": "schedule,capacity", "output": "bottleneck_forecast"},
      {"feature": "disruption_recovery", "model": "replanning", "input": "disruption_event,current_schedule", "output": "recovery_plan"}
    ],
    "api_surface": [
      {"endpoint": "GET /workorders", "auth": "read:workorders"},
      {"endpoint": "GET /workorders/{id}", "auth": "read:workorders"},
      {"endpoint": "POST /workorders", "auth": "write:workorders"},
      {"endpoint": "PUT /workorders/{id}", "auth": "write:workorders"},
      {"endpoint": "POST /workorders/{id}/release", "auth": "write:workorders"},
      {"endpoint": "GET /schedule", "auth": "read:schedule"},
      {"endpoint": "POST /schedule/optimize", "auth": "write:schedule"},
      {"endpoint": "POST /schedule/simulate", "auth": "read:schedule"}
    ]
  },
  {
    "id": "MOD-007",
    "name": "Shop Floor Execution",
    "code": "SHOP_FLOOR",
    "domain": "Operations",
    "inputs": [
      {"name": "work_order", "type": "WorkOrderDTO", "source": "PRODUCTION"},
      {"name": "routing", "type": "RoutingDTO", "source": "PRODUCTION"},
      {"name": "cut_pattern", "type": "CutPatternDTO", "source": "CUTTING_OPTIMIZER"},
      {"name": "material", "type": "MaterialDTO", "source": "INVENTORY"},
      {"name": "operator_assignment", "type": "AssignmentDTO", "source": "LABOR"}
    ],
    "outputs": [
      {"name": "production_actuals", "type": "ActualsDTO", "consumers": ["PRODUCTION", "ANALYTICS"]},
      {"name": "work_center_status", "type": "WorkCenterStatusDTO", "consumers": ["PRODUCTION"]},
      {"name": "production_output", "type": "ProductionOutputDTO", "consumers": ["INVENTORY", "QUALITY"]},
      {"name": "remnant", "type": "RemnantDTO", "consumers": ["INVENTORY"]},
      {"name": "scrap", "type": "ScrapDTO", "consumers": ["INVENTORY", "ANALYTICS"]}
    ],
    "events": [
      {"name": "operation.started", "payload": "OpStartDTO", "subscribers": ["PRODUCTION", "ANALYTICS"]},
      {"name": "operation.completed", "payload": "OpCompleteDTO", "subscribers": ["PRODUCTION", "INVENTORY", "QUALITY"]},
      {"name": "operation.paused", "payload": "OpPausedDTO", "subscribers": ["PRODUCTION"]},
      {"name": "workorder.completed", "payload": "WOCompleteDTO", "subscribers": ["ORDER_MGMT", "SHIPPING", "BILLING"]},
      {"name": "downtime.started", "payload": "DowntimeDTO", "subscribers": ["PRODUCTION", "MAINTENANCE"]},
      {"name": "downtime.ended", "payload": "DowntimeEndDTO", "subscribers": ["PRODUCTION"]},
      {"name": "scrap.recorded", "payload": "ScrapDTO", "subscribers": ["INVENTORY", "ANALYTICS", "QUALITY"]},
      {"name": "remnant.created", "payload": "RemnantDTO", "subscribers": ["INVENTORY"]}
    ],
    "kpis": [
      {"metric": "yield_percentage", "formula": "output_weight / input_weight", "target": ">=92%"},
      {"metric": "pieces_per_hour", "formula": "pieces_completed / labor_hours", "target": ">=standard"},
      {"metric": "first_pass_yield", "formula": "pieces_passing_first_inspection / total_pieces", "target": ">=99%"},
      {"metric": "time_variance", "formula": "(actual_time - estimated_time) / estimated_time", "target": "<=10%"},
      {"metric": "oee", "formula": "availability * performance * quality", "target": ">=70%"}
    ],
    "dependencies": [
      {"module": "PRODUCTION", "type": "hard", "reason": "Work orders and schedule"},
      {"module": "INVENTORY", "type": "hard", "reason": "Material issue and output"},
      {"module": "QUALITY", "type": "soft", "reason": "Inspection triggers"}
    ],
    "ai_capabilities": [
      {"feature": "cutting_optimization", "model": "1d_2d_optimization", "input": "order_specs,material_dims", "output": "cut_pattern"},
      {"feature": "time_estimation", "model": "regression", "input": "job_specs,machine,operator", "output": "estimated_time"},
      {"feature": "parameter_recommendation", "model": "regression", "input": "material,operation,machine", "output": "optimal_parameters"},
      {"feature": "quality_prediction", "model": "classification", "input": "process_data,material", "output": "quality_risk_score"},
      {"feature": "scrap_prediction", "model": "regression", "input": "job_specs,material", "output": "expected_scrap"}
    ],
    "api_surface": [
      {"endpoint": "GET /shopfloor/queue", "auth": "read:shopfloor"},
      {"endpoint": "GET /shopfloor/workorder/{id}", "auth": "read:shopfloor"},
      {"endpoint": "POST /shopfloor/operation/start", "auth": "write:shopfloor"},
      {"endpoint": "POST /shopfloor/operation/complete", "auth": "write:shopfloor"},
      {"endpoint": "POST /shopfloor/downtime", "auth": "write:shopfloor"},
      {"endpoint": "GET /shopfloor/workcenters", "auth": "read:shopfloor"},
      {"endpoint": "POST /shopfloor/output", "auth": "write:shopfloor"}
    ]
  },
  {
    "id": "MOD-008",
    "name": "Quality Management",
    "code": "QUALITY",
    "domain": "Operations",
    "inputs": [
      {"name": "inspection_request", "type": "InspectionRequestDTO", "source": "WAREHOUSE|SHOP_FLOOR"},
      {"name": "material_data", "type": "MaterialDTO", "source": "INVENTORY"},
      {"name": "mtr_data", "type": "MTRDataDTO", "source": "WAREHOUSE"},
      {"name": "production_output", "type": "ProductionOutputDTO", "source": "SHOP_FLOOR"},
      {"name": "grade_spec", "type": "GradeDTO", "source": "PRODUCT_CATALOG"}
    ],
    "outputs": [
      {"name": "inspection_result", "type": "InspectionResultDTO", "consumers": ["INVENTORY", "SHOP_FLOOR", "SHIPPING"]},
      {"name": "ncr", "type": "NCRDTO", "consumers": ["INVENTORY", "PURCHASING", "ANALYTICS"]},
      {"name": "coc", "type": "COCDTO", "consumers": ["SHIPPING"]},
      {"name": "quality_hold", "type": "QualityHoldDTO", "consumers": ["INVENTORY"]},
      {"name": "quality_release", "type": "QualityReleaseDTO", "consumers": ["INVENTORY", "SHIPPING"]}
    ],
    "events": [
      {"name": "inspection.completed", "payload": "InspectionResultDTO", "subscribers": ["INVENTORY", "TRACEABILITY"]},
      {"name": "quality.passed", "payload": "QualityPassDTO", "subscribers": ["INVENTORY", "SHIPPING"]},
      {"name": "quality.failed", "payload": "QualityFailDTO", "subscribers": ["INVENTORY", "SHOP_FLOOR"]},
      {"name": "quality.held", "payload": "QualityHoldDTO", "subscribers": ["INVENTORY", "ORDER_MGMT"]},
      {"name": "quality.released", "payload": "QualityReleaseDTO", "subscribers": ["INVENTORY", "SHIPPING"]},
      {"name": "ncr.created", "payload": "NCRDTO", "subscribers": ["PURCHASING", "ANALYTICS"]},
      {"name": "ncr.closed", "payload": "NCRClosedDTO", "subscribers": ["ANALYTICS"]},
      {"name": "coc.generated", "payload": "COCDTO", "subscribers": ["SHIPPING", "TRACEABILITY"]}
    ],
    "kpis": [
      {"metric": "defect_rate", "formula": "defects_found / items_inspected", "target": "<=1%"},
      {"metric": "inspection_throughput", "formula": "inspections_completed / inspector_hours", "target": ">=standard"},
      {"metric": "ncr_resolution_days", "formula": "avg_days_to_close_ncr", "target": "<=5"},
      {"metric": "customer_claim_rate", "formula": "claims / shipments", "target": "<=0.5%"},
      {"metric": "defect_escape_rate", "formula": "customer_found_defects / total_defects", "target": "<=0.1%"}
    ],
    "dependencies": [
      {"module": "INVENTORY", "type": "hard", "reason": "Hold/release inventory"},
      {"module": "PRODUCT_CATALOG", "type": "hard", "reason": "Grade specifications"},
      {"module": "TRACEABILITY", "type": "hard", "reason": "Quality history"}
    ],
    "ai_capabilities": [
      {"feature": "defect_prediction", "model": "classification", "input": "material,process,supplier", "output": "defect_probability"},
      {"feature": "adaptive_sampling", "model": "reinforcement_learning", "input": "historical_quality,supplier_performance", "output": "sample_rate"},
      {"feature": "ncr_classification", "model": "nlp_classification", "input": "ncr_description", "output": "defect_category"},
      {"feature": "root_cause_analysis", "model": "causal_inference", "input": "defect_data,process_data", "output": "likely_causes"},
      {"feature": "mtr_validation", "model": "rules_ml_hybrid", "input": "mtr_data,grade_spec", "output": "compliance_flag"}
    ],
    "api_surface": [
      {"endpoint": "GET /quality/inspections", "auth": "read:quality"},
      {"endpoint": "POST /quality/inspections", "auth": "write:quality"},
      {"endpoint": "PUT /quality/inspections/{id}", "auth": "write:quality"},
      {"endpoint": "POST /quality/hold", "auth": "write:quality"},
      {"endpoint": "POST /quality/release", "auth": "write:quality"},
      {"endpoint": "GET /quality/ncrs", "auth": "read:quality"},
      {"endpoint": "POST /quality/ncrs", "auth": "write:quality"},
      {"endpoint": "POST /quality/coc/generate", "auth": "write:quality"}
    ]
  },
  {
    "id": "MOD-009",
    "name": "Shipping & Logistics",
    "code": "SHIPPING",
    "domain": "Logistics",
    "inputs": [
      {"name": "shipment_request", "type": "ShipmentRequestDTO", "source": "ORDER_MGMT"},
      {"name": "pick_list", "type": "PickListDTO", "source": "ORDER_MGMT"},
      {"name": "production_complete", "type": "WOCompleteDTO", "source": "SHOP_FLOOR"},
      {"name": "quality_release", "type": "QualityReleaseDTO", "source": "QUALITY"},
      {"name": "carrier_rates", "type": "CarrierRateDTO", "source": "external"}
    ],
    "outputs": [
      {"name": "shipment", "type": "ShipmentDTO", "consumers": ["BILLING", "CUSTOMER", "ANALYTICS"]},
      {"name": "bol", "type": "BOLDTO", "consumers": ["CARRIER", "CUSTOMER"]},
      {"name": "packing_list", "type": "PackingListDTO", "consumers": ["CUSTOMER", "WAREHOUSE"]},
      {"name": "tracking_info", "type": "TrackingDTO", "consumers": ["CUSTOMER", "ORDER_MGMT"]},
      {"name": "pod", "type": "PODDTO", "consumers": ["BILLING", "CUSTOMER"]}
    ],
    "events": [
      {"name": "shipment.created", "payload": "ShipmentDTO", "subscribers": ["BILLING", "ANALYTICS"]},
      {"name": "shipment.picked", "payload": "PickedDTO", "subscribers": ["INVENTORY"]},
      {"name": "shipment.packed", "payload": "PackedDTO", "subscribers": ["SHIPPING"]},
      {"name": "shipment.shipped", "payload": "ShippedDTO", "subscribers": ["ORDER_MGMT", "BILLING", "CUSTOMER", "INVENTORY"]},
      {"name": "shipment.delivered", "payload": "DeliveredDTO", "subscribers": ["BILLING", "ANALYTICS"]},
      {"name": "shipment.exception", "payload": "ExceptionDTO", "subscribers": ["ORDER_MGMT", "CUSTOMER"]},
      {"name": "pod.captured", "payload": "PODDTO", "subscribers": ["BILLING", "ANALYTICS"]}
    ],
    "kpis": [
      {"metric": "ship_on_time", "formula": "shipments_on_time / total_shipments", "target": ">=99%"},
      {"metric": "shipping_accuracy", "formula": "accurate_shipments / total_shipments", "target": ">=99.5%"},
      {"metric": "picks_per_hour", "formula": "picks_completed / picker_hours", "target": ">=standard"},
      {"metric": "freight_cost_per_lb", "formula": "total_freight_cost / total_weight_shipped", "target": "<=target"},
      {"metric": "pod_capture_rate", "formula": "pods_captured / deliveries", "target": "100%"}
    ],
    "dependencies": [
      {"module": "ORDER_MGMT", "type": "hard", "reason": "Shipment source"},
      {"module": "INVENTORY", "type": "hard", "reason": "Pick and issue"},
      {"module": "QUALITY", "type": "soft", "reason": "Quality release"},
      {"module": "BILLING", "type": "soft", "reason": "Invoice trigger"}
    ],
    "ai_capabilities": [
      {"feature": "carrier_selection", "model": "optimization", "input": "shipment_specs,carrier_rates,performance", "output": "recommended_carrier"},
      {"feature": "load_optimization", "model": "bin_packing", "input": "shipments,truck_capacity", "output": "load_plan"},
      {"feature": "eta_prediction", "model": "regression", "input": "route,carrier,conditions", "output": "predicted_eta"},
      {"feature": "route_optimization", "model": "vrp", "input": "deliveries,constraints", "output": "optimized_route"},
      {"feature": "exception_prediction", "model": "classification", "input": "shipment_data,carrier_history", "output": "exception_risk"}
    ],
    "api_surface": [
      {"endpoint": "GET /shipments", "auth": "read:shipments"},
      {"endpoint": "GET /shipments/{id}", "auth": "read:shipments"},
      {"endpoint": "POST /shipments", "auth": "write:shipments"},
      {"endpoint": "POST /shipments/{id}/pick", "auth": "write:shipments"},
      {"endpoint": "POST /shipments/{id}/pack", "auth": "write:shipments"},
      {"endpoint": "POST /shipments/{id}/ship", "auth": "write:shipments"},
      {"endpoint": "POST /shipments/{id}/pod", "auth": "write:shipments"},
      {"endpoint": "GET /shipments/{id}/track", "auth": "read:shipments"}
    ]
  },
  {
    "id": "MOD-010",
    "name": "Pricing Engine",
    "code": "PRICING",
    "domain": "Finance",
    "inputs": [
      {"name": "base_cost", "type": "BaseCostDTO", "source": "PURCHASING"},
      {"name": "commodity_price", "type": "CommodityPriceDTO", "source": "external"},
      {"name": "customer_contract", "type": "ContractDTO", "source": "CUSTOMER_MGMT"},
      {"name": "product_info", "type": "ProductDTO", "source": "PRODUCT_CATALOG"},
      {"name": "processing_cost", "type": "ProcessingCostDTO", "source": "PRODUCTION"},
      {"name": "margin_rules", "type": "MarginRuleDTO", "source": "config"}
    ],
    "outputs": [
      {"name": "calculated_price", "type": "PriceDTO", "consumers": ["QUOTING", "ORDER_MGMT", "POS"]},
      {"name": "price_breakdown", "type": "PriceBreakdownDTO", "consumers": ["QUOTING", "BILLING"]},
      {"name": "margin_analysis", "type": "MarginDTO", "consumers": ["ANALYTICS"]},
      {"name": "pricing_exception", "type": "PricingExceptionDTO", "consumers": ["APPROVAL_WORKFLOW"]}
    ],
    "events": [
      {"name": "price.calculated", "payload": "PriceDTO", "subscribers": ["ANALYTICS"]},
      {"name": "price.overridden", "payload": "OverrideDTO", "subscribers": ["ANALYTICS", "APPROVAL"]},
      {"name": "commodity.updated", "payload": "CommodityPriceDTO", "subscribers": ["PRICING"]},
      {"name": "margin.violated", "payload": "MarginViolationDTO", "subscribers": ["APPROVAL", "ANALYTICS"]},
      {"name": "contract.pricing_applied", "payload": "ContractPricingDTO", "subscribers": ["ANALYTICS"]}
    ],
    "kpis": [
      {"metric": "gross_margin", "formula": "(revenue - cogs) / revenue", "target": ">=18%"},
      {"metric": "price_override_rate", "formula": "overrides / total_prices", "target": "<=10%"},
      {"metric": "pricing_accuracy", "formula": "correct_prices / total_prices", "target": ">=99.5%"},
      {"metric": "price_calculation_latency", "formula": "avg_time_to_calculate", "target": "<=200ms"},
      {"metric": "contract_compliance", "formula": "contract_prices_applied / contract_orders", "target": "100%"}
    ],
    "dependencies": [
      {"module": "PRODUCT_CATALOG", "type": "hard", "reason": "Product cost basis"},
      {"module": "CUSTOMER_MGMT", "type": "hard", "reason": "Contract pricing"},
      {"module": "PURCHASING", "type": "soft", "reason": "Cost updates"}
    ],
    "ai_capabilities": [
      {"feature": "optimal_pricing", "model": "optimization", "input": "cost,competition,elasticity,win_rate", "output": "optimal_price"},
      {"feature": "margin_prediction", "model": "regression", "input": "order_specs,pricing", "output": "predicted_margin"},
      {"feature": "price_elasticity", "model": "regression", "input": "historical_prices,win_rates", "output": "elasticity_curve"},
      {"feature": "competitive_positioning", "model": "classification", "input": "product,market_data", "output": "price_position"}
    ],
    "api_surface": [
      {"endpoint": "POST /pricing/calculate", "auth": "read:pricing"},
      {"endpoint": "GET /pricing/breakdown/{quoteLineId}", "auth": "read:pricing"},
      {"endpoint": "GET /pricing/commodity-rates", "auth": "read:pricing"},
      {"endpoint": "PUT /pricing/commodity-rates", "auth": "write:pricing"},
      {"endpoint": "POST /pricing/override", "auth": "write:pricing"},
      {"endpoint": "GET /pricing/contracts/{customerId}", "auth": "read:pricing"}
    ]
  },
  {
    "id": "MOD-011",
    "name": "Billing & Invoicing",
    "code": "BILLING",
    "domain": "Finance",
    "inputs": [
      {"name": "shipment", "type": "ShipmentDTO", "source": "SHIPPING"},
      {"name": "order", "type": "OrderDTO", "source": "ORDER_MGMT"},
      {"name": "pricing", "type": "PriceDTO", "source": "PRICING"},
      {"name": "customer", "type": "CustomerDTO", "source": "CUSTOMER_MGMT"},
      {"name": "tax_rules", "type": "TaxRuleDTO", "source": "config"}
    ],
    "outputs": [
      {"name": "invoice", "type": "InvoiceDTO", "consumers": ["CUSTOMER", "AR", "ANALYTICS"]},
      {"name": "credit_memo", "type": "CreditMemoDTO", "consumers": ["CUSTOMER", "AR"]},
      {"name": "ar_transaction", "type": "ARTransactionDTO", "consumers": ["AR", "ANALYTICS"]},
      {"name": "revenue_recognition", "type": "RevenueDTO", "consumers": ["ANALYTICS", "ERP"]}
    ],
    "events": [
      {"name": "invoice.created", "payload": "InvoiceDTO", "subscribers": ["AR", "CUSTOMER", "ANALYTICS"]},
      {"name": "invoice.sent", "payload": "InvoiceSentDTO", "subscribers": ["AR", "ANALYTICS"]},
      {"name": "invoice.paid", "payload": "PaymentDTO", "subscribers": ["AR", "ANALYTICS"]},
      {"name": "invoice.partial_paid", "payload": "PartialPaymentDTO", "subscribers": ["AR"]},
      {"name": "invoice.disputed", "payload": "DisputeDTO", "subscribers": ["AR", "SALES"]},
      {"name": "credit.issued", "payload": "CreditMemoDTO", "subscribers": ["AR", "ANALYTICS"]},
      {"name": "invoice.overdue", "payload": "OverdueDTO", "subscribers": ["CREDIT", "COLLECTIONS"]}
    ],
    "kpis": [
      {"metric": "invoice_accuracy", "formula": "accurate_invoices / total_invoices", "target": ">=99.5%"},
      {"metric": "invoice_turnaround", "formula": "avg_time_ship_to_invoice", "target": "<=24h"},
      {"metric": "dso", "formula": "avg_days_to_collect", "target": "<=40"},
      {"metric": "dispute_rate", "formula": "disputed_invoices / total_invoices", "target": "<=2%"},
      {"metric": "collection_rate", "formula": "collected / invoiced", "target": ">=98%"}
    ],
    "dependencies": [
      {"module": "SHIPPING", "type": "hard", "reason": "Shipment triggers invoice"},
      {"module": "ORDER_MGMT", "type": "hard", "reason": "Order details"},
      {"module": "PRICING", "type": "hard", "reason": "Price validation"},
      {"module": "CUSTOMER_MGMT", "type": "hard", "reason": "Customer billing info"}
    ],
    "ai_capabilities": [
      {"feature": "invoice_automation", "model": "rules_automation", "input": "shipment,order,pricing", "output": "invoice"},
      {"feature": "payment_prediction", "model": "regression", "input": "customer_history,invoice", "output": "predicted_payment_date"},
      {"feature": "dispute_classification", "model": "nlp_classification", "input": "dispute_text", "output": "dispute_category"},
      {"feature": "collection_prioritization", "model": "ranking", "input": "ar_aging,customer_risk", "output": "collection_priority"}
    ],
    "api_surface": [
      {"endpoint": "GET /invoices", "auth": "read:invoices"},
      {"endpoint": "GET /invoices/{id}", "auth": "read:invoices"},
      {"endpoint": "POST /invoices", "auth": "write:invoices"},
      {"endpoint": "POST /invoices/{id}/send", "auth": "write:invoices"},
      {"endpoint": "POST /invoices/{id}/payment", "auth": "write:invoices"},
      {"endpoint": "POST /credits", "auth": "write:invoices"},
      {"endpoint": "GET /ar/aging", "auth": "read:ar"}
    ]
  },
  {
    "id": "MOD-012",
    "name": "Customer Management",
    "code": "CUSTOMER_MGMT",
    "domain": "Sales",
    "inputs": [
      {"name": "customer_data", "type": "CustomerDTO", "source": "user_input|crm|edi"},
      {"name": "credit_application", "type": "CreditAppDTO", "source": "user_input"},
      {"name": "contract", "type": "ContractDTO", "source": "user_input"},
      {"name": "order_history", "type": "OrderHistoryDTO", "source": "ORDER_MGMT"},
      {"name": "payment_history", "type": "PaymentHistoryDTO", "source": "BILLING"}
    ],
    "outputs": [
      {"name": "customer_profile", "type": "CustomerProfileDTO", "consumers": ["QUOTING", "ORDER_MGMT", "BILLING", "SHIPPING"]},
      {"name": "credit_status", "type": "CreditStatusDTO", "consumers": ["ORDER_MGMT", "QUOTING"]},
      {"name": "contract_terms", "type": "ContractTermsDTO", "consumers": ["PRICING", "QUOTING"]},
      {"name": "customer_analytics", "type": "CustomerAnalyticsDTO", "consumers": ["ANALYTICS", "SALES"]}
    ],
    "events": [
      {"name": "customer.created", "payload": "CustomerDTO", "subscribers": ["CRM", "ANALYTICS"]},
      {"name": "customer.updated", "payload": "CustomerDTO", "subscribers": ["CRM", "BILLING"]},
      {"name": "customer.credit_approved", "payload": "CreditApprovedDTO", "subscribers": ["ORDER_MGMT", "SALES"]},
      {"name": "customer.credit_hold", "payload": "CreditHoldDTO", "subscribers": ["ORDER_MGMT", "SALES"]},
      {"name": "contract.created", "payload": "ContractDTO", "subscribers": ["PRICING", "ANALYTICS"]},
      {"name": "contract.expired", "payload": "ContractExpiredDTO", "subscribers": ["SALES", "PRICING"]}
    ],
    "kpis": [
      {"metric": "customer_data_completeness", "formula": "complete_profiles / total_customers", "target": ">=95%"},
      {"metric": "credit_decision_time", "formula": "avg_time_to_credit_decision", "target": "<=24h"},
      {"metric": "customer_retention", "formula": "active_customers_eoy / active_customers_boy", "target": ">=90%"},
      {"metric": "contract_renewal_rate", "formula": "renewed_contracts / expiring_contracts", "target": ">=85%"}
    ],
    "dependencies": [
      {"module": "ORDER_MGMT", "type": "soft", "reason": "Order history"},
      {"module": "BILLING", "type": "soft", "reason": "Payment history"},
      {"module": "CREDIT", "type": "hard", "reason": "Credit management"}
    ],
    "ai_capabilities": [
      {"feature": "churn_prediction", "model": "classification", "input": "customer_behavior,order_patterns", "output": "churn_probability"},
      {"feature": "customer_segmentation", "model": "clustering", "input": "customer_attributes,behavior", "output": "segment"},
      {"feature": "ltv_prediction", "model": "regression", "input": "customer_history", "output": "lifetime_value"},
      {"feature": "credit_scoring", "model": "classification", "input": "credit_app,external_data", "output": "credit_score"}
    ],
    "api_surface": [
      {"endpoint": "GET /customers", "auth": "read:customers"},
      {"endpoint": "GET /customers/{id}", "auth": "read:customers"},
      {"endpoint": "POST /customers", "auth": "write:customers"},
      {"endpoint": "PUT /customers/{id}", "auth": "write:customers"},
      {"endpoint": "GET /customers/{id}/credit", "auth": "read:credit"},
      {"endpoint": "GET /customers/{id}/contracts", "auth": "read:contracts"},
      {"endpoint": "POST /customers/{id}/contracts", "auth": "write:contracts"}
    ]
  },
  {
    "id": "MOD-013",
    "name": "Credit Management",
    "code": "CREDIT",
    "domain": "Finance",
    "inputs": [
      {"name": "credit_application", "type": "CreditAppDTO", "source": "CUSTOMER_MGMT"},
      {"name": "ar_aging", "type": "ARAgingDTO", "source": "BILLING"},
      {"name": "order_value", "type": "OrderValueDTO", "source": "ORDER_MGMT"},
      {"name": "external_credit", "type": "ExternalCreditDTO", "source": "external"}
    ],
    "outputs": [
      {"name": "credit_decision", "type": "CreditDecisionDTO", "consumers": ["CUSTOMER_MGMT", "ORDER_MGMT"]},
      {"name": "credit_limit", "type": "CreditLimitDTO", "consumers": ["ORDER_MGMT"]},
      {"name": "credit_hold", "type": "CreditHoldDTO", "consumers": ["ORDER_MGMT", "SALES"]},
      {"name": "collection_action", "type": "CollectionActionDTO", "consumers": ["BILLING"]}
    ],
    "events": [
      {"name": "credit.approved", "payload": "CreditApprovedDTO", "subscribers": ["CUSTOMER_MGMT", "ORDER_MGMT"]},
      {"name": "credit.denied", "payload": "CreditDeniedDTO", "subscribers": ["CUSTOMER_MGMT", "SALES"]},
      {"name": "credit.limit_changed", "payload": "CreditLimitDTO", "subscribers": ["ORDER_MGMT"]},
      {"name": "credit.hold_set", "payload": "CreditHoldDTO", "subscribers": ["ORDER_MGMT", "SALES"]},
      {"name": "credit.hold_released", "payload": "HoldReleasedDTO", "subscribers": ["ORDER_MGMT"]},
      {"name": "credit.exposure_exceeded", "payload": "ExposureAlertDTO", "subscribers": ["SALES", "FINANCE"]}
    ],
    "kpis": [
      {"metric": "bad_debt_rate", "formula": "bad_debt / total_ar", "target": "<=0.5%"},
      {"metric": "credit_decision_time", "formula": "avg_time_to_decision", "target": "<=24h"},
      {"metric": "hold_release_time", "formula": "avg_time_to_release_hold", "target": "<=4h"},
      {"metric": "credit_utilization", "formula": "ar_balance / total_credit_limits", "target": "optimal"},
      {"metric": "collection_effectiveness", "formula": "collected_past_due / total_past_due", "target": ">=90%"}
    ],
    "dependencies": [
      {"module": "CUSTOMER_MGMT", "type": "hard", "reason": "Customer data"},
      {"module": "BILLING", "type": "hard", "reason": "AR data"},
      {"module": "ORDER_MGMT", "type": "soft", "reason": "Order exposure"}
    ],
    "ai_capabilities": [
      {"feature": "credit_risk_scoring", "model": "classification", "input": "customer_data,external_data,payment_history", "output": "risk_score"},
      {"feature": "payment_prediction", "model": "regression", "input": "customer_history,invoice", "output": "payment_probability"},
      {"feature": "early_warning", "model": "anomaly_detection", "input": "payment_patterns", "output": "risk_flag"},
      {"feature": "collection_optimization", "model": "ranking", "input": "ar_aging,customer_risk", "output": "collection_priority"}
    ],
    "api_surface": [
      {"endpoint": "GET /credit/customers/{id}", "auth": "read:credit"},
      {"endpoint": "POST /credit/applications", "auth": "write:credit"},
      {"endpoint": "PUT /credit/limits/{customerId}", "auth": "write:credit"},
      {"endpoint": "POST /credit/hold/{customerId}", "auth": "write:credit"},
      {"endpoint": "POST /credit/release/{customerId}", "auth": "write:credit"},
      {"endpoint": "GET /credit/exposure", "auth": "read:credit"}
    ]
  },
  {
    "id": "MOD-014",
    "name": "Purchasing & Procurement",
    "code": "PURCHASING",
    "domain": "Operations",
    "inputs": [
      {"name": "reorder_recommendation", "type": "ReorderDTO", "source": "INVENTORY"},
      {"name": "demand_forecast", "type": "ForecastDTO", "source": "ANALYTICS"},
      {"name": "supplier_catalog", "type": "SupplierCatalogDTO", "source": "external"},
      {"name": "supplier_performance", "type": "SupplierPerformanceDTO", "source": "QUALITY|WAREHOUSE"}
    ],
    "outputs": [
      {"name": "purchase_order", "type": "PurchaseOrderDTO", "consumers": ["SUPPLIER", "WAREHOUSE", "INVENTORY"]},
      {"name": "supplier_profile", "type": "SupplierDTO", "consumers": ["QUALITY", "ANALYTICS"]},
      {"name": "inbound_forecast", "type": "InboundForecastDTO", "consumers": ["WAREHOUSE", "PRODUCTION"]},
      {"name": "cost_update", "type": "CostUpdateDTO", "consumers": ["PRICING"]}
    ],
    "events": [
      {"name": "po.created", "payload": "PurchaseOrderDTO", "subscribers": ["WAREHOUSE", "ANALYTICS"]},
      {"name": "po.confirmed", "payload": "POConfirmedDTO", "subscribers": ["WAREHOUSE", "INVENTORY"]},
      {"name": "po.shipped", "payload": "POShippedDTO", "subscribers": ["WAREHOUSE"]},
      {"name": "po.received", "payload": "POReceivedDTO", "subscribers": ["INVENTORY", "BILLING"]},
      {"name": "po.closed", "payload": "POClosedDTO", "subscribers": ["ANALYTICS"]},
      {"name": "supplier.created", "payload": "SupplierDTO", "subscribers": ["QUALITY"]},
      {"name": "cost.updated", "payload": "CostUpdateDTO", "subscribers": ["PRICING", "ANALYTICS"]}
    ],
    "kpis": [
      {"metric": "cost_variance", "formula": "(actual_cost - budget_cost) / budget_cost", "target": "<=2%"},
      {"metric": "supplier_otd", "formula": "on_time_deliveries / total_deliveries", "target": ">=95%"},
      {"metric": "supplier_quality", "formula": "acceptable_receipts / total_receipts", "target": ">=99%"},
      {"metric": "po_cycle_time", "formula": "avg_time_requisition_to_po", "target": "<=24h"},
      {"metric": "stock_out_due_to_supply", "formula": "supply_stock_outs / total_stock_outs", "target": "0"}
    ],
    "dependencies": [
      {"module": "INVENTORY", "type": "hard", "reason": "Reorder triggers"},
      {"module": "WAREHOUSE", "type": "hard", "reason": "Receipt confirmation"},
      {"module": "PRICING", "type": "soft", "reason": "Cost updates"}
    ],
    "ai_capabilities": [
      {"feature": "demand_forecasting", "model": "time_series", "input": "historical_demand,seasonality", "output": "forecast"},
      {"feature": "supplier_selection", "model": "optimization", "input": "requirements,supplier_capabilities,performance", "output": "recommended_supplier"},
      {"feature": "lead_time_prediction", "model": "regression", "input": "supplier,material,quantity", "output": "predicted_lead_time"},
      {"feature": "price_forecasting", "model": "time_series", "input": "commodity_prices,trends", "output": "price_forecast"},
      {"feature": "order_quantity_optimization", "model": "optimization", "input": "demand,costs,constraints", "output": "optimal_quantity"}
    ],
    "api_surface": [
      {"endpoint": "GET /purchase-orders", "auth": "read:purchasing"},
      {"endpoint": "GET /purchase-orders/{id}", "auth": "read:purchasing"},
      {"endpoint": "POST /purchase-orders", "auth": "write:purchasing"},
      {"endpoint": "PUT /purchase-orders/{id}", "auth": "write:purchasing"},
      {"endpoint": "GET /suppliers", "auth": "read:suppliers"},
      {"endpoint": "POST /suppliers", "auth": "write:suppliers"},
      {"endpoint": "GET /suppliers/{id}/performance", "auth": "read:suppliers"}
    ]
  },
  {
    "id": "MOD-015",
    "name": "Traceability",
    "code": "TRACEABILITY",
    "domain": "Compliance",
    "inputs": [
      {"name": "receipt_event", "type": "ReceiptDTO", "source": "INVENTORY"},
      {"name": "production_event", "type": "ProductionOutputDTO", "source": "SHOP_FLOOR"},
      {"name": "shipment_event", "type": "ShipmentDTO", "source": "SHIPPING"},
      {"name": "quality_event", "type": "InspectionResultDTO", "source": "QUALITY"},
      {"name": "mtr_data", "type": "MTRDataDTO", "source": "WAREHOUSE"}
    ],
    "outputs": [
      {"name": "provenance_graph", "type": "ProvenanceGraphDTO", "consumers": ["QUALITY", "CUSTOMER", "COMPLIANCE"]},
      {"name": "genealogy_report", "type": "GenealogyDTO", "consumers": ["QUALITY", "CUSTOMER"]},
      {"name": "recall_scope", "type": "RecallScopeDTO", "consumers": ["QUALITY", "SHIPPING"]},
      {"name": "coc_data", "type": "COCDataDTO", "consumers": ["QUALITY", "SHIPPING"]}
    ],
    "events": [
      {"name": "trace.node_created", "payload": "TraceNodeDTO", "subscribers": ["ANALYTICS"]},
      {"name": "trace.link_created", "payload": "TraceLinkDTO", "subscribers": ["ANALYTICS"]},
      {"name": "trace.query_executed", "payload": "TraceQueryDTO", "subscribers": ["ANALYTICS"]},
      {"name": "recall.initiated", "payload": "RecallDTO", "subscribers": ["QUALITY", "SHIPPING", "CUSTOMER"]}
    ],
    "kpis": [
      {"metric": "traceability_completeness", "formula": "items_with_full_trace / total_items", "target": "100%"},
      {"metric": "trace_query_latency", "formula": "avg_time_to_query", "target": "<=2s"},
      {"metric": "recall_identification_time", "formula": "time_to_identify_affected", "target": "<=1h"},
      {"metric": "genealogy_depth", "formula": "avg_trace_hops", "target": "complete"}
    ],
    "dependencies": [
      {"module": "INVENTORY", "type": "hard", "reason": "Inventory events"},
      {"module": "SHOP_FLOOR", "type": "hard", "reason": "Production events"},
      {"module": "QUALITY", "type": "hard", "reason": "Quality events"},
      {"module": "WAREHOUSE", "type": "hard", "reason": "MTR linkage"}
    ],
    "ai_capabilities": [
      {"feature": "defect_propagation", "model": "graph_analysis", "input": "defect_node,provenance_graph", "output": "affected_items"},
      {"feature": "anomaly_detection", "model": "graph_anomaly", "input": "provenance_graph", "output": "anomalous_nodes"},
      {"feature": "similarity_matching", "model": "graph_embedding", "input": "item_trace", "output": "similar_items"}
    ],
    "api_surface": [
      {"endpoint": "GET /traceability/{itemId}", "auth": "read:traceability"},
      {"endpoint": "GET /traceability/{itemId}/ancestors", "auth": "read:traceability"},
      {"endpoint": "GET /traceability/{itemId}/descendants", "auth": "read:traceability"},
      {"endpoint": "GET /traceability/heat/{heatNumber}", "auth": "read:traceability"},
      {"endpoint": "POST /traceability/recall-scope", "auth": "write:traceability"}
    ]
  },
  {
    "id": "MOD-016",
    "name": "Analytics & Reporting",
    "code": "ANALYTICS",
    "domain": "Intelligence",
    "inputs": [
      {"name": "all_events", "type": "EventDTO[]", "source": "ALL_MODULES"},
      {"name": "external_data", "type": "ExternalDataDTO", "source": "external"}
    ],
    "outputs": [
      {"name": "dashboards", "type": "DashboardDTO[]", "consumers": ["ALL_USERS"]},
      {"name": "reports", "type": "ReportDTO[]", "consumers": ["ALL_USERS"]},
      {"name": "alerts", "type": "AlertDTO[]", "consumers": ["ALL_USERS"]},
      {"name": "kpi_values", "type": "KPIValueDTO[]", "consumers": ["ALL_USERS"]},
      {"name": "predictions", "type": "PredictionDTO[]", "consumers": ["ALL_MODULES"]}
    ],
    "events": [
      {"name": "alert.triggered", "payload": "AlertDTO", "subscribers": ["USER_NOTIFICATION"]},
      {"name": "kpi.threshold_breached", "payload": "KPIBreachDTO", "subscribers": ["USER_NOTIFICATION"]},
      {"name": "report.generated", "payload": "ReportDTO", "subscribers": ["USER_NOTIFICATION"]},
      {"name": "anomaly.detected", "payload": "AnomalyDTO", "subscribers": ["USER_NOTIFICATION"]}
    ],
    "kpis": [
      {"metric": "data_freshness", "formula": "max_data_age", "target": "<=5min"},
      {"metric": "dashboard_load_time", "formula": "avg_dashboard_render", "target": "<=3s"},
      {"metric": "alert_accuracy", "formula": "true_positive_alerts / total_alerts", "target": ">=90%"},
      {"metric": "prediction_accuracy", "formula": "accurate_predictions / total_predictions", "target": ">=85%"}
    ],
    "dependencies": [
      {"module": "ALL_MODULES", "type": "soft", "reason": "Event consumption"}
    ],
    "ai_capabilities": [
      {"feature": "anomaly_detection", "model": "unsupervised", "input": "metrics_stream", "output": "anomalies"},
      {"feature": "forecasting", "model": "time_series", "input": "historical_metrics", "output": "forecasts"},
      {"feature": "root_cause_analysis", "model": "causal_inference", "input": "anomaly,related_metrics", "output": "probable_causes"},
      {"feature": "natural_language_query", "model": "nlp", "input": "user_question", "output": "data_query"},
      {"feature": "insight_generation", "model": "nlg", "input": "data_patterns", "output": "narrative_insights"}
    ],
    "api_surface": [
      {"endpoint": "GET /analytics/dashboards", "auth": "read:analytics"},
      {"endpoint": "GET /analytics/dashboards/{id}", "auth": "read:analytics"},
      {"endpoint": "GET /analytics/kpis", "auth": "read:analytics"},
      {"endpoint": "GET /analytics/reports", "auth": "read:analytics"},
      {"endpoint": "POST /analytics/reports/generate", "auth": "write:analytics"},
      {"endpoint": "GET /analytics/alerts", "auth": "read:analytics"},
      {"endpoint": "POST /analytics/query", "auth": "read:analytics"}
    ]
  },
  {
    "id": "MOD-017",
    "name": "Point of Sale",
    "code": "POS",
    "domain": "Sales",
    "inputs": [
      {"name": "product_scan", "type": "ProductScanDTO", "source": "barcode_scanner"},
      {"name": "customer_lookup", "type": "CustomerLookupDTO", "source": "user_input"},
      {"name": "inventory_availability", "type": "ATPDTO", "source": "INVENTORY"},
      {"name": "pricing", "type": "PriceDTO", "source": "PRICING"},
      {"name": "payment", "type": "PaymentDTO", "source": "payment_terminal"}
    ],
    "outputs": [
      {"name": "pos_transaction", "type": "POSTransactionDTO", "consumers": ["BILLING", "INVENTORY", "ANALYTICS"]},
      {"name": "receipt", "type": "ReceiptDTO", "consumers": ["CUSTOMER"]},
      {"name": "will_call", "type": "WillCallDTO", "consumers": ["WAREHOUSE", "ORDER_MGMT"]}
    ],
    "events": [
      {"name": "pos.transaction_complete", "payload": "POSTransactionDTO", "subscribers": ["INVENTORY", "BILLING", "ANALYTICS"]},
      {"name": "pos.will_call_created", "payload": "WillCallDTO", "subscribers": ["WAREHOUSE", "ORDER_MGMT"]},
      {"name": "pos.payment_received", "payload": "PaymentDTO", "subscribers": ["BILLING"]},
      {"name": "pos.quick_cut_requested", "payload": "QuickCutDTO", "subscribers": ["SHOP_FLOOR"]}
    ],
    "kpis": [
      {"metric": "transaction_time", "formula": "avg_time_per_transaction", "target": "<=60s"},
      {"metric": "transactions_per_hour", "formula": "transactions / clerk_hours", "target": ">=12"},
      {"metric": "upsell_rate", "formula": "transactions_with_addon / total_transactions", "target": ">=15%"},
      {"metric": "cash_accuracy", "formula": "cash_variance / cash_handled", "target": "100%"}
    ],
    "dependencies": [
      {"module": "INVENTORY", "type": "hard", "reason": "Availability and issue"},
      {"module": "PRICING", "type": "hard", "reason": "Price lookup"},
      {"module": "BILLING", "type": "soft", "reason": "Payment processing"}
    ],
    "ai_capabilities": [
      {"feature": "remnant_matching", "model": "optimization", "input": "customer_needs,available_remnants", "output": "matching_remnants"},
      {"feature": "upsell_recommendation", "model": "recommendation", "input": "cart_items,customer_history", "output": "recommended_addons"},
      {"feature": "quick_substitute", "model": "similarity", "input": "requested_product", "output": "available_substitutes"}
    ],
    "api_surface": [
      {"endpoint": "POST /pos/transaction", "auth": "write:pos"},
      {"endpoint": "POST /pos/lookup", "auth": "read:pos"},
      {"endpoint": "POST /pos/payment", "auth": "write:pos"},
      {"endpoint": "POST /pos/will-call", "auth": "write:pos"},
      {"endpoint": "GET /pos/will-call", "auth": "read:pos"}
    ]
  },
  {
    "id": "MOD-018",
    "name": "E-Commerce Portal",
    "code": "ECOMMERCE",
    "domain": "Sales",
    "inputs": [
      {"name": "product_catalog", "type": "Product[]", "source": "PRODUCT_CATALOG"},
      {"name": "inventory_availability", "type": "ATPDTO[]", "source": "INVENTORY"},
      {"name": "pricing", "type": "PriceDTO[]", "source": "PRICING"},
      {"name": "customer_session", "type": "SessionDTO", "source": "auth"}
    ],
    "outputs": [
      {"name": "cart", "type": "CartDTO", "consumers": ["ORDER_MGMT"]},
      {"name": "rfq", "type": "RFQDTO", "consumers": ["QUOTING"]},
      {"name": "portal_order", "type": "OrderDTO", "consumers": ["ORDER_MGMT"]},
      {"name": "document_download", "type": "DocumentDTO", "consumers": ["CUSTOMER"]}
    ],
    "events": [
      {"name": "ecommerce.rfq_submitted", "payload": "RFQDTO", "subscribers": ["QUOTING"]},
      {"name": "ecommerce.order_placed", "payload": "OrderDTO", "subscribers": ["ORDER_MGMT"]},
      {"name": "ecommerce.cart_abandoned", "payload": "CartDTO", "subscribers": ["ANALYTICS", "MARKETING"]},
      {"name": "ecommerce.document_downloaded", "payload": "DocumentDTO", "subscribers": ["ANALYTICS"]}
    ],
    "kpis": [
      {"metric": "conversion_rate", "formula": "orders / sessions", "target": ">=5%"},
      {"metric": "cart_abandonment", "formula": "abandoned_carts / total_carts", "target": "<=30%"},
      {"metric": "avg_order_value", "formula": "total_revenue / orders", "target": ">=target"},
      {"metric": "portal_adoption", "formula": "portal_orders / total_orders", "target": ">=25%"}
    ],
    "dependencies": [
      {"module": "PRODUCT_CATALOG", "type": "hard", "reason": "Product display"},
      {"module": "INVENTORY", "type": "hard", "reason": "Availability"},
      {"module": "PRICING", "type": "hard", "reason": "Price display"},
      {"module": "ORDER_MGMT", "type": "hard", "reason": "Order submission"},
      {"module": "QUOTING", "type": "soft", "reason": "RFQ submission"}
    ],
    "ai_capabilities": [
      {"feature": "product_recommendation", "model": "collaborative_filtering", "input": "user_behavior,similar_users", "output": "recommended_products"},
      {"feature": "search_optimization", "model": "semantic_search", "input": "search_query", "output": "ranked_results"},
      {"feature": "price_personalization", "model": "personalization", "input": "customer_segment,behavior", "output": "personalized_pricing"},
      {"feature": "reorder_prediction", "model": "time_series", "input": "order_history", "output": "reorder_reminder"}
    ],
    "api_surface": [
      {"endpoint": "GET /portal/products", "auth": "read:portal"},
      {"endpoint": "GET /portal/products/{id}", "auth": "read:portal"},
      {"endpoint": "GET /portal/cart", "auth": "read:portal"},
      {"endpoint": "POST /portal/cart", "auth": "write:portal"},
      {"endpoint": "POST /portal/rfq", "auth": "write:portal"},
      {"endpoint": "POST /portal/order", "auth": "write:portal"},
      {"endpoint": "GET /portal/orders", "auth": "read:portal"},
      {"endpoint": "GET /portal/documents", "auth": "read:portal"}
    ]
  }
]
```

---

## 2. Module Interactions (Directed Graph)

```json
{
  "nodes": [
    {"id": "PRODUCT_CATALOG", "domain": "Master Data"},
    {"id": "INVENTORY", "domain": "Operations"},
    {"id": "WAREHOUSE", "domain": "Operations"},
    {"id": "QUOTING", "domain": "Sales"},
    {"id": "ORDER_MGMT", "domain": "Sales"},
    {"id": "PRODUCTION", "domain": "Operations"},
    {"id": "SHOP_FLOOR", "domain": "Operations"},
    {"id": "QUALITY", "domain": "Operations"},
    {"id": "SHIPPING", "domain": "Logistics"},
    {"id": "PRICING", "domain": "Finance"},
    {"id": "BILLING", "domain": "Finance"},
    {"id": "CUSTOMER_MGMT", "domain": "Sales"},
    {"id": "CREDIT", "domain": "Finance"},
    {"id": "PURCHASING", "domain": "Operations"},
    {"id": "TRACEABILITY", "domain": "Compliance"},
    {"id": "ANALYTICS", "domain": "Intelligence"},
    {"id": "POS", "domain": "Sales"},
    {"id": "ECOMMERCE", "domain": "Sales"}
  ],
  "edges": [
    {"from": "PRODUCT_CATALOG", "to": "QUOTING", "type": "data", "data_flow": ["products", "grades", "substitutes"]},
    {"from": "PRODUCT_CATALOG", "to": "ORDER_MGMT", "type": "data", "data_flow": ["products", "substitutes"]},
    {"from": "PRODUCT_CATALOG", "to": "INVENTORY", "type": "data", "data_flow": ["product_definitions"]},
    {"from": "PRODUCT_CATALOG", "to": "ECOMMERCE", "type": "data", "data_flow": ["catalog"]},
    {"from": "PRODUCT_CATALOG", "to": "POS", "type": "data", "data_flow": ["products"]},
    
    {"from": "INVENTORY", "to": "QUOTING", "type": "data", "data_flow": ["availability", "atp"]},
    {"from": "INVENTORY", "to": "ORDER_MGMT", "type": "data", "data_flow": ["availability", "allocation_confirmation"]},
    {"from": "INVENTORY", "to": "PRODUCTION", "type": "data", "data_flow": ["material_availability"]},
    {"from": "INVENTORY", "to": "SHIPPING", "type": "data", "data_flow": ["pick_confirmation"]},
    {"from": "INVENTORY", "to": "PURCHASING", "type": "data", "data_flow": ["reorder_recommendations"]},
    {"from": "INVENTORY", "to": "TRACEABILITY", "type": "event", "data_flow": ["inventory_events"]},
    {"from": "INVENTORY", "to": "ANALYTICS", "type": "event", "data_flow": ["inventory_events"]},
    {"from": "INVENTORY", "to": "POS", "type": "data", "data_flow": ["availability"]},
    {"from": "INVENTORY", "to": "ECOMMERCE", "type": "data", "data_flow": ["availability"]},
    
    {"from": "WAREHOUSE", "to": "INVENTORY", "type": "event", "data_flow": ["receipts", "put_away", "picks"]},
    {"from": "WAREHOUSE", "to": "QUALITY", "type": "event", "data_flow": ["inspection_requests", "mtr_data"]},
    {"from": "WAREHOUSE", "to": "TRACEABILITY", "type": "event", "data_flow": ["mtr_data"]},
    {"from": "WAREHOUSE", "to": "PURCHASING", "type": "event", "data_flow": ["receipt_confirmation", "discrepancies"]},
    
    {"from": "QUOTING", "to": "ORDER_MGMT", "type": "command", "data_flow": ["quote_conversion"]},
    {"from": "QUOTING", "to": "ANALYTICS", "type": "event", "data_flow": ["quote_events"]},
    
    {"from": "ORDER_MGMT", "to": "PRODUCTION", "type": "command", "data_flow": ["work_order_requests"]},
    {"from": "ORDER_MGMT", "to": "INVENTORY", "type": "command", "data_flow": ["allocation_requests"]},
    {"from": "ORDER_MGMT", "to": "SHIPPING", "type": "command", "data_flow": ["shipment_requests"]},
    {"from": "ORDER_MGMT", "to": "BILLING", "type": "event", "data_flow": ["order_events"]},
    {"from": "ORDER_MGMT", "to": "ANALYTICS", "type": "event", "data_flow": ["order_events"]},
    
    {"from": "PRODUCTION", "to": "SHOP_FLOOR", "type": "command", "data_flow": ["work_orders", "schedule", "routing"]},
    {"from": "PRODUCTION", "to": "INVENTORY", "type": "command", "data_flow": ["material_reservations"]},
    {"from": "PRODUCTION", "to": "ORDER_MGMT", "type": "data", "data_flow": ["schedule", "capacity"]},
    {"from": "PRODUCTION", "to": "QUOTING", "type": "data", "data_flow": ["capacity", "lead_times"]},
    {"from": "PRODUCTION", "to": "ANALYTICS", "type": "event", "data_flow": ["schedule_events"]},
    
    {"from": "SHOP_FLOOR", "to": "PRODUCTION", "type": "event", "data_flow": ["actuals", "status"]},
    {"from": "SHOP_FLOOR", "to": "INVENTORY", "type": "event", "data_flow": ["material_issues", "outputs", "remnants", "scrap"]},
    {"from": "SHOP_FLOOR", "to": "QUALITY", "type": "event", "data_flow": ["inspection_requests"]},
    {"from": "SHOP_FLOOR", "to": "SHIPPING", "type": "event", "data_flow": ["wo_complete"]},
    {"from": "SHOP_FLOOR", "to": "TRACEABILITY", "type": "event", "data_flow": ["production_events"]},
    {"from": "SHOP_FLOOR", "to": "ANALYTICS", "type": "event", "data_flow": ["production_events"]},
    
    {"from": "QUALITY", "to": "INVENTORY", "type": "command", "data_flow": ["holds", "releases"]},
    {"from": "QUALITY", "to": "SHIPPING", "type": "data", "data_flow": ["coc", "releases"]},
    {"from": "QUALITY", "to": "PURCHASING", "type": "event", "data_flow": ["supplier_ncrs"]},
    {"from": "QUALITY", "to": "TRACEABILITY", "type": "event", "data_flow": ["quality_events"]},
    {"from": "QUALITY", "to": "ANALYTICS", "type": "event", "data_flow": ["quality_events"]},
    
    {"from": "SHIPPING", "to": "INVENTORY", "type": "event", "data_flow": ["picks", "issues"]},
    {"from": "SHIPPING", "to": "BILLING", "type": "event", "data_flow": ["shipments"]},
    {"from": "SHIPPING", "to": "ORDER_MGMT", "type": "event", "data_flow": ["shipment_status"]},
    {"from": "SHIPPING", "to": "TRACEABILITY", "type": "event", "data_flow": ["shipment_events"]},
    {"from": "SHIPPING", "to": "ANALYTICS", "type": "event", "data_flow": ["shipment_events"]},
    
    {"from": "PRICING", "to": "QUOTING", "type": "data", "data_flow": ["prices", "rules"]},
    {"from": "PRICING", "to": "ORDER_MGMT", "type": "data", "data_flow": ["prices"]},
    {"from": "PRICING", "to": "POS", "type": "data", "data_flow": ["prices"]},
    {"from": "PRICING", "to": "ECOMMERCE", "type": "data", "data_flow": ["prices"]},
    {"from": "PRICING", "to": "BILLING", "type": "data", "data_flow": ["prices"]},
    {"from": "PRICING", "to": "ANALYTICS", "type": "event", "data_flow": ["pricing_events"]},
    
    {"from": "BILLING", "to": "CREDIT", "type": "data", "data_flow": ["ar_aging", "payments"]},
    {"from": "BILLING", "to": "ANALYTICS", "type": "event", "data_flow": ["billing_events"]},
    
    {"from": "CUSTOMER_MGMT", "to": "QUOTING", "type": "data", "data_flow": ["customer_info", "contracts"]},
    {"from": "CUSTOMER_MGMT", "to": "ORDER_MGMT", "type": "data", "data_flow": ["customer_info"]},
    {"from": "CUSTOMER_MGMT", "to": "PRICING", "type": "data", "data_flow": ["contracts"]},
    {"from": "CUSTOMER_MGMT", "to": "BILLING", "type": "data", "data_flow": ["customer_info"]},
    {"from": "CUSTOMER_MGMT", "to": "SHIPPING", "type": "data", "data_flow": ["shipping_info"]},
    {"from": "CUSTOMER_MGMT", "to": "CREDIT", "type": "data", "data_flow": ["customer_info"]},
    {"from": "CUSTOMER_MGMT", "to": "ANALYTICS", "type": "event", "data_flow": ["customer_events"]},
    
    {"from": "CREDIT", "to": "ORDER_MGMT", "type": "data", "data_flow": ["credit_status", "holds"]},
    {"from": "CREDIT", "to": "CUSTOMER_MGMT", "type": "event", "data_flow": ["credit_decisions"]},
    {"from": "CREDIT", "to": "ANALYTICS", "type": "event", "data_flow": ["credit_events"]},
    
    {"from": "PURCHASING", "to": "WAREHOUSE", "type": "data", "data_flow": ["inbound_shipments"]},
    {"from": "PURCHASING", "to": "INVENTORY", "type": "event", "data_flow": ["po_receipts"]},
    {"from": "PURCHASING", "to": "PRICING", "type": "data", "data_flow": ["cost_updates"]},
    {"from": "PURCHASING", "to": "ANALYTICS", "type": "event", "data_flow": ["purchasing_events"]},
    
    {"from": "TRACEABILITY", "to": "QUALITY", "type": "data", "data_flow": ["provenance"]},
    {"from": "TRACEABILITY", "to": "SHIPPING", "type": "data", "data_flow": ["coc_data"]},
    {"from": "TRACEABILITY", "to": "ANALYTICS", "type": "event", "data_flow": ["trace_events"]},
    
    {"from": "POS", "to": "INVENTORY", "type": "event", "data_flow": ["issues"]},
    {"from": "POS", "to": "BILLING", "type": "event", "data_flow": ["transactions"]},
    {"from": "POS", "to": "ORDER_MGMT", "type": "command", "data_flow": ["will_call"]},
    {"from": "POS", "to": "SHOP_FLOOR", "type": "command", "data_flow": ["quick_cuts"]},
    {"from": "POS", "to": "ANALYTICS", "type": "event", "data_flow": ["pos_events"]},
    
    {"from": "ECOMMERCE", "to": "QUOTING", "type": "command", "data_flow": ["rfqs"]},
    {"from": "ECOMMERCE", "to": "ORDER_MGMT", "type": "command", "data_flow": ["orders"]},
    {"from": "ECOMMERCE", "to": "ANALYTICS", "type": "event", "data_flow": ["portal_events"]},
    
    {"from": "ANALYTICS", "to": "ALL_MODULES", "type": "query", "data_flow": ["insights", "predictions", "alerts"]}
  ]
}
```

---

## 3. Failure Modes

| Module | Failure Mode | Cause | Impact | Severity | Detection | Mitigation | Recovery |
|--------|--------------|-------|--------|----------|-----------|------------|----------|
| **PRODUCT_CATALOG** | Catalog unavailable | Service crash, DB failure | Cannot create quotes/orders | Critical | Health check, error rates | Caching, circuit breaker | Auto-restart, failover |
| **PRODUCT_CATALOG** | Stale product data | Sync failure, replication lag | Wrong prices/specs displayed | High | Data freshness monitoring | Dual-write, event replay | Force sync, invalidate cache |
| **PRODUCT_CATALOG** | Invalid substitution | Bad data, logic error | Wrong material shipped | High | Substitution audit, QC | Metallurgist approval | Recall, credit |
| **INVENTORY** | Inventory discrepancy | Missed transaction, double-count | Oversell, stock-out | Critical | Cycle counts, variance alerts | Real-time validation | Adjustment, investigation |
| **INVENTORY** | Allocation deadlock | Concurrent requests | Orders stuck | High | Lock monitoring, timeout | Optimistic locking | Retry, manual resolution |
| **INVENTORY** | ATP calculation wrong | Stale data, logic error | False promise dates | High | ATP audit, order tracking | Real-time recalculation | Recompute, notify customers |
| **WAREHOUSE** | MTR capture failure | OCR error, missing document | Incomplete traceability | High | MTR completeness check | Manual entry fallback | Manual data entry |
| **WAREHOUSE** | Put-away to wrong location | Scanner error, operator mistake | Inventory not found | Medium | Location audit, pick failure | Barcode validation | Cycle count, relocation |
| **WAREHOUSE** | Receiving discrepancy | Supplier error, damage | Inventory mismatch | Medium | Receipt vs PO comparison | Discrepancy workflow | Claim, adjustment |
| **QUOTING** | Quote calculation error | Pricing bug, data issue | Wrong price quoted | High | Quote audit, margin check | Price validation rules | Requote, honor if committed |
| **QUOTING** | RFQ parsing failure | Unusual format, NLP error | Manual intervention needed | Low | Parse success rate | Fallback to manual | Manual quote entry |
| **QUOTING** | Quote not sent | Email failure, integration issue | Lost opportunity | Medium | Delivery tracking | Retry, multi-channel | Resend, call customer |
| **ORDER_MGMT** | Order stuck in credit hold | Customer dispute, system issue | Delayed fulfillment | Medium | Aging hold report | Escalation workflow | Credit override, resolution |
| **ORDER_MGMT** | Duplicate order | Integration retry, user error | Double fulfillment | High | Duplicate detection | Idempotency keys | Cancel duplicate, credit |
| **ORDER_MGMT** | Promise date missed | Capacity issue, material delay | Customer dissatisfaction | High | SLA tracking, alerts | Early warning system | Customer notification, expedite |
| **PRODUCTION** | Schedule optimization failure | Solver timeout, infeasible | No schedule generated | Critical | Solver monitoring | Fallback heuristics | Simple scheduling, manual |
| **PRODUCTION** | Routing error | Wrong machine, wrong sequence | Rework, delays | High | Routing validation | Pre-flight checks | Re-route, expedite |
| **PRODUCTION** | Capacity overload | Unexpected demand, downtime | Missed dates | High | Capacity utilization alerts | Dynamic rebalancing | Overtime, outsource |
| **SHOP_FLOOR** | Machine breakdown | Mechanical failure, wear | Delayed production | Critical | IoT monitoring, operator report | Predictive maintenance | Repair, re-route jobs |
| **SHOP_FLOOR** | Cut pattern error | Optimization bug, input error | Wasted material, wrong pieces | High | Pattern validation | Operator confirmation | Recut, scrap accounting |
| **SHOP_FLOOR** | Operator no-show | Illness, no-call | Understaffed shift | Medium | Attendance tracking | Cross-training, on-call | Reassign, overtime |
| **SHOP_FLOOR** | Data entry lag | Busy operator, tablet issue | Stale status | Medium | Update latency monitoring | Offline capability | Batch update, reconciliation |
| **QUALITY** | Defect escape | Missed inspection, sampling | Customer complaint | Critical | Claim tracking, feedback | Adaptive sampling | Investigation, corrective action |
| **QUALITY** | False positive hold | Overly strict criteria | Delayed shipment | Medium | Hold review | Quick release workflow | Release, process review |
| **QUALITY** | NCR backlog | Volume, resource constraint | Delayed resolution | Medium | NCR aging report | Prioritization | Escalation, additional resources |
| **SHIPPING** | Shipment left behind | Picking error, staging issue | Incomplete delivery | High | Shipment completeness check | Weight verification | Same-day chase shipment |
| **SHIPPING** | Wrong carrier selected | Rate error, logic bug | Higher cost, slower delivery | Medium | Carrier audit | Rate validation | Carrier change, claim |
| **SHIPPING** | BOL generation failure | Integration issue, data missing | Shipment held | High | Document generation monitoring | Template fallback | Manual BOL |
| **SHIPPING** | POD not captured | Driver oversight, app failure | Billing delay | Medium | POD capture rate | Driver reminders | Follow-up call, manual capture |
| **PRICING** | Wrong price calculated | Rule error, stale costs | Margin loss or lost sale | High | Price audit, margin monitoring | Dual calculation | Requote, honor commitment |
| **PRICING** | Commodity price lag | Feed delay, provider issue | Stale base prices | Medium | Price freshness monitoring | Fallback to last known | Manual update |
| **PRICING** | Contract pricing not applied | Lookup failure, data issue | Customer charged list price | High | Contract compliance audit | Contract validation | Credit, correct invoice |
| **BILLING** | Invoice error | Data mismatch, calculation bug | Dispute, delayed payment | High | Invoice reconciliation | Pre-invoice validation | Credit, corrected invoice |
| **BILLING** | Payment not applied | Matching failure, bank delay | AR aging incorrect | Medium | Unapplied cash report | Cash matching rules | Manual application |
| **BILLING** | Invoice not sent | Email failure, integration issue | Delayed payment | Medium | Delivery tracking | Multi-channel delivery | Resend |
| **CUSTOMER_MGMT** | Customer data incorrect | Entry error, stale data | Wrong pricing, shipping | Medium | Data quality monitoring | Validation rules | Data correction |
| **CUSTOMER_MGMT** | Contract expired | No renewal, oversight | List pricing applied | Medium | Expiration alerts | Auto-renewal workflow | Emergency renewal |
| **CREDIT** | Credit check timeout | External service slow | Order entry delayed | Medium | Response time monitoring | Cached decisions | Retry, manual approval |
| **CREDIT** | Wrong credit decision | Model error, stale data | Bad debt or lost sale | High | Decision audit | Human review threshold | Override, limit adjustment |
| **PURCHASING** | PO not received by supplier | Email failure, integration issue | Material not ordered | Critical | PO confirmation tracking | Multi-channel delivery | Resend, call supplier |
| **PURCHASING** | Supplier missed delivery | Supplier issue | Production delayed | High | Inbound tracking | Buffer stock, alt suppliers | Expedite, source elsewhere |
| **PURCHASING** | Wrong material ordered | Spec error, entry mistake | Wrong inventory received | High | PO validation | Confirmation workflow | Return, reorder |
| **TRACEABILITY** | Broken trace link | Missed event, data error | Incomplete genealogy | High | Completeness audit | Event replay | Manual linking |
| **TRACEABILITY** | Query timeout | Large graph, complex query | Slow response | Medium | Query performance monitoring | Query optimization | Async query, pagination |
| **ANALYTICS** | Dashboard stale | ETL failure, data lag | Wrong decisions | Medium | Data freshness alerts | Real-time fallback | ETL restart |
| **ANALYTICS** | Prediction inaccuracy | Model drift, data shift | Wrong recommendations | Medium | Model monitoring | Retrain triggers | Model rollback, retrain |
| **POS** | Payment terminal down | Hardware, network issue | Cannot process payment | Critical | Device monitoring | Backup terminal, manual | Failover, field service |
| **POS** | Inventory sync lag | Network, high volume | Sell out-of-stock item | Medium | Sync monitoring | Local cache with reservation | Reconciliation |
| **ECOMMERCE** | Portal down | Server crash, DDos | Lost sales | Critical | Uptime monitoring | Redundancy, CDN | Auto-recovery, failover |
| **ECOMMERCE** | Cart abandonment spike | UX issue, pricing problem | Lost revenue | Medium | Abandonment rate alert | A/B testing | UX fix, follow-up email |

---

## 4. Module Criticality Matrix

| Module | Business Criticality | Technical Complexity | AI Dependency | Failure Impact | SLA Target |
|--------|---------------------|---------------------|---------------|----------------|------------|
| PRODUCT_CATALOG | High | Low | Medium | High | 99.9% |
| INVENTORY | Critical | High | High | Critical | 99.95% |
| WAREHOUSE | High | Medium | Medium | High | 99.9% |
| QUOTING | High | Medium | High | High | 99.9% |
| ORDER_MGMT | Critical | High | Medium | Critical | 99.95% |
| PRODUCTION | Critical | High | High | Critical | 99.9% |
| SHOP_FLOOR | Critical | High | High | Critical | 99.9% |
| QUALITY | High | Medium | High | High | 99.9% |
| SHIPPING | Critical | Medium | Medium | Critical | 99.95% |
| PRICING | High | Medium | Medium | High | 99.9% |
| BILLING | High | Medium | Low | High | 99.9% |
| CUSTOMER_MGMT | High | Low | Medium | Medium | 99.9% |
| CREDIT | Medium | Medium | Medium | Medium | 99.5% |
| PURCHASING | High | Medium | High | High | 99.9% |
| TRACEABILITY | High | High | Medium | Medium | 99.9% |
| ANALYTICS | Medium | High | High | Low | 99.5% |
| POS | High | Low | Low | High | 99.9% |
| ECOMMERCE | Medium | Medium | Medium | Medium | 99.9% |

---

## 5. Event Catalog Summary

| Event Category | Count | Primary Publishers | Primary Subscribers |
|----------------|-------|--------------------|--------------------|
| Order Events | 7 | ORDER_MGMT | PRODUCTION, INVENTORY, BILLING, ANALYTICS |
| Inventory Events | 9 | INVENTORY | TRACEABILITY, ANALYTICS, ORDER_MGMT |
| Production Events | 8 | SHOP_FLOOR, PRODUCTION | ORDER_MGMT, INVENTORY, ANALYTICS |
| Quality Events | 8 | QUALITY | INVENTORY, SHIPPING, TRACEABILITY |
| Shipping Events | 7 | SHIPPING | BILLING, ORDER_MGMT, CUSTOMER |
| Billing Events | 7 | BILLING | AR, CREDIT, ANALYTICS |
| Pricing Events | 5 | PRICING | ANALYTICS |
| Customer Events | 6 | CUSTOMER_MGMT | CREDIT, ORDER_MGMT, ANALYTICS |
| Warehouse Events | 6 | WAREHOUSE | INVENTORY, QUALITY, TRACEABILITY |
| Quote Events | 6 | QUOTING | ORDER_MGMT, ANALYTICS |
| **Total** | **69** | — | — |

---

*Document generated for AI-build Phase 03: Phase 1 Module Definition*
