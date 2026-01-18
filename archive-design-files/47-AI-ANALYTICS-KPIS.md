# 47 — AI Analytics & KPIs

> **Purpose:** Comprehensive analytics architecture, KPI definitions, dashboard models, and alerting rules for AI-build.  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. KPIs — JSON Array

```json
{
  "kpis": [

    {
      "kpi_id": "KPI-SALES-001",
      "category": "SALES",
      "name": "Daily Sales Revenue",
      "description": "Total revenue from orders entered today",
      "formula": "SUM(order_line.extended_price) WHERE order.created_date = TODAY",
      "unit": "USD",
      "format": "currency",
      "aggregation": ["daily", "weekly", "monthly", "quarterly", "yearly"],
      "dimensions": ["location", "salesperson", "customer_type", "product_category"],
      "target_type": "ABSOLUTE",
      "default_target": 150000,
      "comparison_periods": ["prior_day", "same_day_prior_week", "same_day_prior_year"],
      "trend_direction": "UP_GOOD",
      "data_freshness": "real_time",
      "visibility": ["SALES_MANAGER", "BRANCH_MANAGER", "SUPER_ADMIN"]
    },
    {
      "kpi_id": "KPI-SALES-002",
      "category": "SALES",
      "name": "Orders Entered",
      "description": "Count of sales orders created",
      "formula": "COUNT(orders) WHERE order.created_date = PERIOD",
      "unit": "count",
      "format": "integer",
      "aggregation": ["daily", "weekly", "monthly"],
      "dimensions": ["location", "salesperson", "order_type", "channel"],
      "target_type": "ABSOLUTE",
      "default_target": 75,
      "trend_direction": "UP_GOOD",
      "data_freshness": "real_time",
      "visibility": ["INSIDE_SALES", "SALES_MANAGER", "BRANCH_MANAGER"]
    },
    {
      "kpi_id": "KPI-SALES-003",
      "category": "SALES",
      "name": "Average Order Value",
      "description": "Average dollar value per order",
      "formula": "SUM(order.total) / COUNT(orders)",
      "unit": "USD",
      "format": "currency",
      "aggregation": ["daily", "weekly", "monthly"],
      "dimensions": ["location", "salesperson", "customer_type", "channel"],
      "target_type": "ABSOLUTE",
      "default_target": 2500,
      "trend_direction": "UP_GOOD",
      "data_freshness": "hourly",
      "visibility": ["SALES_MANAGER", "BRANCH_MANAGER"]
    },
    {
      "kpi_id": "KPI-SALES-004",
      "category": "SALES",
      "name": "Quote Conversion Rate",
      "description": "Percentage of quotes converted to orders",
      "formula": "(COUNT(quotes WHERE status = 'CONVERTED') / COUNT(quotes WHERE status IN ('CONVERTED', 'EXPIRED', 'LOST'))) * 100",
      "unit": "percent",
      "format": "percentage",
      "aggregation": ["weekly", "monthly", "quarterly"],
      "dimensions": ["salesperson", "customer_type", "product_category", "quote_value_range"],
      "target_type": "PERCENTAGE",
      "default_target": 35,
      "trend_direction": "UP_GOOD",
      "data_freshness": "daily",
      "visibility": ["INSIDE_SALES", "SALES_MANAGER", "BRANCH_MANAGER"]
    },
    {
      "kpi_id": "KPI-SALES-005",
      "category": "SALES",
      "name": "Gross Margin Percentage",
      "description": "Order gross margin as percentage of revenue",
      "formula": "((SUM(revenue) - SUM(cost)) / SUM(revenue)) * 100",
      "unit": "percent",
      "format": "percentage_1dp",
      "aggregation": ["daily", "weekly", "monthly"],
      "dimensions": ["location", "salesperson", "product_category", "customer"],
      "target_type": "PERCENTAGE",
      "default_target": 22,
      "threshold_warning": 18,
      "threshold_critical": 15,
      "trend_direction": "UP_GOOD",
      "data_freshness": "hourly",
      "visibility": ["SALES_MANAGER", "BRANCH_MANAGER", "AR_CLERK"],
      "sensitive": true
    },
    {
      "kpi_id": "KPI-SALES-006",
      "category": "SALES",
      "name": "Lines Per Order",
      "description": "Average number of line items per order",
      "formula": "COUNT(order_lines) / COUNT(orders)",
      "unit": "count",
      "format": "decimal_1dp",
      "aggregation": ["daily", "weekly", "monthly"],
      "dimensions": ["order_type", "customer_type", "channel"],
      "target_type": "ABSOLUTE",
      "default_target": 4.5,
      "trend_direction": "UP_GOOD",
      "data_freshness": "hourly",
      "visibility": ["SALES_MANAGER", "BRANCH_MANAGER"]
    },
    {
      "kpi_id": "KPI-SALES-007",
      "category": "SALES",
      "name": "Processing Attachment Rate",
      "description": "Percentage of orders with processing services",
      "formula": "(COUNT(orders WHERE has_processing = true) / COUNT(orders)) * 100",
      "unit": "percent",
      "format": "percentage",
      "aggregation": ["weekly", "monthly"],
      "dimensions": ["location", "salesperson", "customer_type"],
      "target_type": "PERCENTAGE",
      "default_target": 40,
      "trend_direction": "UP_GOOD",
      "data_freshness": "daily",
      "visibility": ["SALES_MANAGER", "BRANCH_MANAGER", "SHOP_FLOOR_MGR"]
    },

    {
      "kpi_id": "KPI-INV-001",
      "category": "INVENTORY",
      "name": "Inventory Turns",
      "description": "Annual inventory turnover rate",
      "formula": "(COGS_12_months / AVG(inventory_value)) ",
      "unit": "turns",
      "format": "decimal_1dp",
      "aggregation": ["monthly", "quarterly", "yearly"],
      "dimensions": ["location", "product_category", "grade"],
      "target_type": "ABSOLUTE",
      "default_target": 6,
      "threshold_warning": 4,
      "threshold_critical": 3,
      "trend_direction": "UP_GOOD",
      "data_freshness": "daily",
      "visibility": ["INVENTORY_CTRL", "PURCHASING", "BRANCH_MANAGER"]
    },
    {
      "kpi_id": "KPI-INV-002",
      "category": "INVENTORY",
      "name": "Days Sales of Inventory",
      "description": "Average days to sell current inventory",
      "formula": "(AVG(inventory_value) / (COGS_12_months / 365))",
      "unit": "days",
      "format": "integer",
      "aggregation": ["monthly", "quarterly"],
      "dimensions": ["location", "product_category"],
      "target_type": "ABSOLUTE",
      "default_target": 60,
      "threshold_warning": 90,
      "threshold_critical": 120,
      "trend_direction": "DOWN_GOOD",
      "data_freshness": "daily",
      "visibility": ["INVENTORY_CTRL", "PURCHASING", "BRANCH_MANAGER"]
    },
    {
      "kpi_id": "KPI-INV-003",
      "category": "INVENTORY",
      "name": "Stock Availability Rate",
      "description": "Percentage of SKUs in stock vs. active catalog",
      "formula": "(COUNT(products WHERE qty_available > 0) / COUNT(products WHERE is_active = true)) * 100",
      "unit": "percent",
      "format": "percentage",
      "aggregation": ["daily", "weekly"],
      "dimensions": ["location", "product_category"],
      "target_type": "PERCENTAGE",
      "default_target": 95,
      "threshold_warning": 90,
      "threshold_critical": 85,
      "trend_direction": "UP_GOOD",
      "data_freshness": "real_time",
      "visibility": ["INVENTORY_CTRL", "SALES_MANAGER", "BRANCH_MANAGER"]
    },
    {
      "kpi_id": "KPI-INV-004",
      "category": "INVENTORY",
      "name": "Inventory Accuracy",
      "description": "Cycle count accuracy percentage",
      "formula": "(COUNT(cycle_counts WHERE variance_pct <= tolerance) / COUNT(cycle_counts)) * 100",
      "unit": "percent",
      "format": "percentage_1dp",
      "aggregation": ["weekly", "monthly"],
      "dimensions": ["location", "zone", "product_category"],
      "target_type": "PERCENTAGE",
      "default_target": 98,
      "threshold_warning": 95,
      "threshold_critical": 90,
      "trend_direction": "UP_GOOD",
      "data_freshness": "daily",
      "visibility": ["WAREHOUSE_MGR", "INVENTORY_CTRL", "BRANCH_MANAGER"]
    },
    {
      "kpi_id": "KPI-INV-005",
      "category": "INVENTORY",
      "name": "Slow Moving Inventory Value",
      "description": "Value of inventory with no movement > 90 days",
      "formula": "SUM(inventory_item.value) WHERE last_movement_date < TODAY - 90",
      "unit": "USD",
      "format": "currency",
      "aggregation": ["weekly", "monthly"],
      "dimensions": ["location", "product_category", "age_bucket"],
      "target_type": "ABSOLUTE",
      "default_target": 50000,
      "threshold_warning": 75000,
      "threshold_critical": 100000,
      "trend_direction": "DOWN_GOOD",
      "data_freshness": "daily",
      "visibility": ["INVENTORY_CTRL", "PURCHASING", "BRANCH_MANAGER"]
    },
    {
      "kpi_id": "KPI-INV-006",
      "category": "INVENTORY",
      "name": "Remnant Percentage",
      "description": "Percentage of inventory classified as remnants",
      "formula": "(SUM(remnant_value) / SUM(total_inventory_value)) * 100",
      "unit": "percent",
      "format": "percentage_1dp",
      "aggregation": ["weekly", "monthly"],
      "dimensions": ["location", "product_category"],
      "target_type": "PERCENTAGE",
      "default_target": 5,
      "threshold_warning": 8,
      "threshold_critical": 12,
      "trend_direction": "DOWN_GOOD",
      "data_freshness": "daily",
      "visibility": ["INVENTORY_CTRL", "SHOP_FLOOR_MGR", "BRANCH_MANAGER"]
    },

    {
      "kpi_id": "KPI-PROD-001",
      "category": "PRODUCTION",
      "name": "Work Orders Completed",
      "description": "Count of work orders completed in period",
      "formula": "COUNT(work_orders) WHERE completed_date IN PERIOD",
      "unit": "count",
      "format": "integer",
      "aggregation": ["daily", "weekly", "monthly"],
      "dimensions": ["location", "work_center", "processing_type"],
      "target_type": "ABSOLUTE",
      "default_target": 50,
      "trend_direction": "UP_GOOD",
      "data_freshness": "real_time",
      "visibility": ["SHOP_FLOOR_MGR", "SCHEDULER", "BRANCH_MANAGER"]
    },
    {
      "kpi_id": "KPI-PROD-002",
      "category": "PRODUCTION",
      "name": "On-Time Completion Rate",
      "description": "Percentage of work orders completed by due date",
      "formula": "(COUNT(work_orders WHERE completed_date <= due_date) / COUNT(completed_work_orders)) * 100",
      "unit": "percent",
      "format": "percentage",
      "aggregation": ["daily", "weekly", "monthly"],
      "dimensions": ["location", "work_center", "processing_type", "priority"],
      "target_type": "PERCENTAGE",
      "default_target": 92,
      "threshold_warning": 85,
      "threshold_critical": 75,
      "trend_direction": "UP_GOOD",
      "data_freshness": "real_time",
      "visibility": ["SHOP_FLOOR_MGR", "SCHEDULER", "BRANCH_MANAGER"]
    },
    {
      "kpi_id": "KPI-PROD-003",
      "category": "PRODUCTION",
      "name": "OEE - Overall Equipment Effectiveness",
      "description": "Combined availability, performance, and quality",
      "formula": "Availability% × Performance% × Quality%",
      "unit": "percent",
      "format": "percentage",
      "aggregation": ["shift", "daily", "weekly", "monthly"],
      "dimensions": ["location", "work_center", "machine"],
      "sub_metrics": {
        "availability": "(run_time / planned_production_time) * 100",
        "performance": "(actual_output / theoretical_output) * 100",
        "quality": "(good_pieces / total_pieces) * 100"
      },
      "target_type": "PERCENTAGE",
      "default_target": 75,
      "threshold_warning": 65,
      "threshold_critical": 55,
      "trend_direction": "UP_GOOD",
      "data_freshness": "shift",
      "visibility": ["SHOP_FLOOR_MGR", "MACHINE_OP", "BRANCH_MANAGER"]
    },
    {
      "kpi_id": "KPI-PROD-004",
      "category": "PRODUCTION",
      "name": "Scrap Rate",
      "description": "Percentage of material scrapped during processing",
      "formula": "(SUM(scrap_weight) / SUM(input_weight)) * 100",
      "unit": "percent",
      "format": "percentage_2dp",
      "aggregation": ["daily", "weekly", "monthly"],
      "dimensions": ["location", "work_center", "processing_type", "operator", "grade"],
      "target_type": "PERCENTAGE",
      "default_target": 2.5,
      "threshold_warning": 4,
      "threshold_critical": 6,
      "trend_direction": "DOWN_GOOD",
      "data_freshness": "real_time",
      "visibility": ["SHOP_FLOOR_MGR", "QA_MANAGER", "BRANCH_MANAGER"]
    },
    {
      "kpi_id": "KPI-PROD-005",
      "category": "PRODUCTION",
      "name": "Average Setup Time",
      "description": "Average time for machine setup/changeover",
      "formula": "AVG(setup_end_time - setup_start_time)",
      "unit": "minutes",
      "format": "integer",
      "aggregation": ["daily", "weekly", "monthly"],
      "dimensions": ["work_center", "processing_type", "operator"],
      "target_type": "ABSOLUTE",
      "default_target": 20,
      "threshold_warning": 30,
      "threshold_critical": 45,
      "trend_direction": "DOWN_GOOD",
      "data_freshness": "real_time",
      "visibility": ["SHOP_FLOOR_MGR", "MACHINE_OP"]
    },
    {
      "kpi_id": "KPI-PROD-006",
      "category": "PRODUCTION",
      "name": "Work Order Backlog Hours",
      "description": "Total estimated hours of pending work orders",
      "formula": "SUM(work_order.estimated_hours) WHERE status IN ('RELEASED', 'IN_PROGRESS')",
      "unit": "hours",
      "format": "decimal_1dp",
      "aggregation": ["daily"],
      "dimensions": ["location", "work_center"],
      "target_type": "RANGE",
      "target_min": 16,
      "target_max": 40,
      "trend_direction": "NEUTRAL",
      "data_freshness": "real_time",
      "visibility": ["SHOP_FLOOR_MGR", "SCHEDULER", "BRANCH_MANAGER"]
    },
    {
      "kpi_id": "KPI-PROD-007",
      "category": "PRODUCTION",
      "name": "Throughput (Tons/Day)",
      "description": "Daily production throughput in tons",
      "formula": "SUM(output_weight) / 2000",
      "unit": "tons",
      "format": "decimal_1dp",
      "aggregation": ["daily", "weekly", "monthly"],
      "dimensions": ["location", "work_center", "shift"],
      "target_type": "ABSOLUTE",
      "default_target": 100,
      "trend_direction": "UP_GOOD",
      "data_freshness": "real_time",
      "visibility": ["SHOP_FLOOR_MGR", "SCHEDULER", "BRANCH_MANAGER"]
    },

    {
      "kpi_id": "KPI-SHIP-001",
      "category": "SHIPPING",
      "name": "On-Time Delivery Rate",
      "description": "Percentage of shipments delivered by promised date",
      "formula": "(COUNT(shipments WHERE actual_delivery <= promised_date) / COUNT(delivered_shipments)) * 100",
      "unit": "percent",
      "format": "percentage",
      "aggregation": ["daily", "weekly", "monthly"],
      "dimensions": ["location", "carrier", "delivery_type", "customer"],
      "target_type": "PERCENTAGE",
      "default_target": 95,
      "threshold_warning": 90,
      "threshold_critical": 85,
      "trend_direction": "UP_GOOD",
      "data_freshness": "real_time",
      "visibility": ["SHIPPING_COORD", "SALES_MANAGER", "BRANCH_MANAGER"]
    },
    {
      "kpi_id": "KPI-SHIP-002",
      "category": "SHIPPING",
      "name": "Order Fill Rate",
      "description": "Percentage of order lines shipped complete",
      "formula": "(COUNT(order_lines WHERE shipped_qty >= ordered_qty) / COUNT(order_lines)) * 100",
      "unit": "percent",
      "format": "percentage",
      "aggregation": ["daily", "weekly", "monthly"],
      "dimensions": ["location", "product_category", "customer_type"],
      "target_type": "PERCENTAGE",
      "default_target": 97,
      "threshold_warning": 93,
      "threshold_critical": 88,
      "trend_direction": "UP_GOOD",
      "data_freshness": "real_time",
      "visibility": ["SHIPPING_COORD", "SALES_MANAGER", "BRANCH_MANAGER"]
    },
    {
      "kpi_id": "KPI-SHIP-003",
      "category": "SHIPPING",
      "name": "Average Order Cycle Time",
      "description": "Average days from order entry to shipment",
      "formula": "AVG(shipment.ship_date - order.created_date)",
      "unit": "days",
      "format": "decimal_1dp",
      "aggregation": ["weekly", "monthly"],
      "dimensions": ["location", "order_type", "has_processing"],
      "target_type": "ABSOLUTE",
      "default_target": 3,
      "threshold_warning": 5,
      "threshold_critical": 7,
      "trend_direction": "DOWN_GOOD",
      "data_freshness": "daily",
      "visibility": ["SHIPPING_COORD", "SALES_MANAGER", "BRANCH_MANAGER"]
    },
    {
      "kpi_id": "KPI-SHIP-004",
      "category": "SHIPPING",
      "name": "Shipments Per Day",
      "description": "Number of shipments dispatched",
      "formula": "COUNT(shipments) WHERE ship_date = PERIOD",
      "unit": "count",
      "format": "integer",
      "aggregation": ["daily", "weekly", "monthly"],
      "dimensions": ["location", "delivery_method", "carrier"],
      "target_type": "ABSOLUTE",
      "default_target": 40,
      "trend_direction": "UP_GOOD",
      "data_freshness": "real_time",
      "visibility": ["SHIPPING_COORD", "WAREHOUSE_MGR", "BRANCH_MANAGER"]
    },
    {
      "kpi_id": "KPI-SHIP-005",
      "category": "SHIPPING",
      "name": "Pick Accuracy Rate",
      "description": "Percentage of picks without errors",
      "formula": "(COUNT(picks WHERE errors = 0) / COUNT(picks)) * 100",
      "unit": "percent",
      "format": "percentage_1dp",
      "aggregation": ["daily", "weekly", "monthly"],
      "dimensions": ["location", "picker", "zone"],
      "target_type": "PERCENTAGE",
      "default_target": 99.5,
      "threshold_warning": 98,
      "threshold_critical": 96,
      "trend_direction": "UP_GOOD",
      "data_freshness": "real_time",
      "visibility": ["WAREHOUSE_MGR", "SHIPPING_COORD"]
    },
    {
      "kpi_id": "KPI-SHIP-006",
      "category": "SHIPPING",
      "name": "Will-Call Pending",
      "description": "Count of will-call orders awaiting pickup",
      "formula": "COUNT(orders) WHERE delivery_method = 'WILL_CALL' AND status = 'READY_FOR_PICKUP'",
      "unit": "count",
      "format": "integer",
      "aggregation": ["daily"],
      "dimensions": ["location", "age_bucket"],
      "target_type": "ABSOLUTE",
      "default_target": 15,
      "threshold_warning": 25,
      "threshold_critical": 40,
      "trend_direction": "DOWN_GOOD",
      "data_freshness": "real_time",
      "visibility": ["SHIPPING_COORD", "COUNTER_SALES", "BRANCH_MANAGER"]
    },

    {
      "kpi_id": "KPI-QUAL-001",
      "category": "QUALITY",
      "name": "First Pass Yield",
      "description": "Percentage of items passing inspection first time",
      "formula": "(COUNT(inspections WHERE result = 'PASS' AND attempt = 1) / COUNT(inspections)) * 100",
      "unit": "percent",
      "format": "percentage_1dp",
      "aggregation": ["daily", "weekly", "monthly"],
      "dimensions": ["location", "inspection_type", "product_category", "supplier"],
      "target_type": "PERCENTAGE",
      "default_target": 98,
      "threshold_warning": 95,
      "threshold_critical": 90,
      "trend_direction": "UP_GOOD",
      "data_freshness": "real_time",
      "visibility": ["QA_MANAGER", "QA_INSPECTOR", "BRANCH_MANAGER"]
    },
    {
      "kpi_id": "KPI-QUAL-002",
      "category": "QUALITY",
      "name": "NCR Count",
      "description": "Number of non-conformance reports opened",
      "formula": "COUNT(ncr) WHERE created_date IN PERIOD",
      "unit": "count",
      "format": "integer",
      "aggregation": ["daily", "weekly", "monthly"],
      "dimensions": ["location", "ncr_type", "source", "severity"],
      "target_type": "ABSOLUTE",
      "default_target": 5,
      "threshold_warning": 10,
      "threshold_critical": 20,
      "trend_direction": "DOWN_GOOD",
      "data_freshness": "real_time",
      "visibility": ["QA_MANAGER", "SHOP_FLOOR_MGR", "BRANCH_MANAGER"]
    },
    {
      "kpi_id": "KPI-QUAL-003",
      "category": "QUALITY",
      "name": "Customer Claims Rate",
      "description": "Claims per 1000 shipments",
      "formula": "(COUNT(claims) / COUNT(shipments)) * 1000",
      "unit": "per_1000",
      "format": "decimal_2dp",
      "aggregation": ["monthly", "quarterly"],
      "dimensions": ["location", "claim_type", "product_category", "customer"],
      "target_type": "ABSOLUTE",
      "default_target": 2,
      "threshold_warning": 4,
      "threshold_critical": 8,
      "trend_direction": "DOWN_GOOD",
      "data_freshness": "daily",
      "visibility": ["QA_MANAGER", "SALES_MANAGER", "BRANCH_MANAGER"]
    },
    {
      "kpi_id": "KPI-QUAL-004",
      "category": "QUALITY",
      "name": "Material on Hold Value",
      "description": "Total value of inventory on quality hold",
      "formula": "SUM(inventory_item.value) WHERE hold_status = 'QUALITY_HOLD'",
      "unit": "USD",
      "format": "currency",
      "aggregation": ["daily"],
      "dimensions": ["location", "hold_reason", "age_bucket"],
      "target_type": "ABSOLUTE",
      "default_target": 25000,
      "threshold_warning": 50000,
      "threshold_critical": 100000,
      "trend_direction": "DOWN_GOOD",
      "data_freshness": "real_time",
      "visibility": ["QA_MANAGER", "INVENTORY_CTRL", "BRANCH_MANAGER"]
    },
    {
      "kpi_id": "KPI-QUAL-005",
      "category": "QUALITY",
      "name": "MTR Compliance Rate",
      "description": "Percentage of shipments with complete MTR documentation",
      "formula": "(COUNT(shipments WHERE mtr_attached = true AND mtr_valid = true) / COUNT(shipments WHERE mtr_required = true)) * 100",
      "unit": "percent",
      "format": "percentage",
      "aggregation": ["weekly", "monthly"],
      "dimensions": ["location", "product_category", "customer"],
      "target_type": "PERCENTAGE",
      "default_target": 100,
      "threshold_warning": 98,
      "threshold_critical": 95,
      "trend_direction": "UP_GOOD",
      "data_freshness": "daily",
      "visibility": ["QA_MANAGER", "SHIPPING_COORD", "BRANCH_MANAGER"]
    },

    {
      "kpi_id": "KPI-FIN-001",
      "category": "FINANCIAL",
      "name": "Days Sales Outstanding",
      "description": "Average days to collect payment",
      "formula": "(AVG(ar_balance) / (revenue_12_months / 365))",
      "unit": "days",
      "format": "integer",
      "aggregation": ["monthly", "quarterly"],
      "dimensions": ["location", "customer_type", "payment_terms"],
      "target_type": "ABSOLUTE",
      "default_target": 35,
      "threshold_warning": 45,
      "threshold_critical": 60,
      "trend_direction": "DOWN_GOOD",
      "data_freshness": "daily",
      "visibility": ["AR_CLERK", "BRANCH_MANAGER", "SUPER_ADMIN"],
      "sensitive": true
    },
    {
      "kpi_id": "KPI-FIN-002",
      "category": "FINANCIAL",
      "name": "AR Aging > 60 Days",
      "description": "Value of receivables over 60 days past due",
      "formula": "SUM(ar_balance) WHERE days_past_due > 60",
      "unit": "USD",
      "format": "currency",
      "aggregation": ["weekly", "monthly"],
      "dimensions": ["location", "customer", "salesperson"],
      "target_type": "PERCENTAGE_OF",
      "target_base": "total_ar",
      "default_target": 5,
      "threshold_warning": 10,
      "threshold_critical": 15,
      "trend_direction": "DOWN_GOOD",
      "data_freshness": "daily",
      "visibility": ["AR_CLERK", "BRANCH_MANAGER", "SUPER_ADMIN"],
      "sensitive": true
    },
    {
      "kpi_id": "KPI-FIN-003",
      "category": "FINANCIAL",
      "name": "Gross Profit",
      "description": "Total gross profit for period",
      "formula": "SUM(revenue) - SUM(cogs)",
      "unit": "USD",
      "format": "currency",
      "aggregation": ["daily", "weekly", "monthly", "quarterly"],
      "dimensions": ["location", "product_category", "customer_type"],
      "target_type": "ABSOLUTE",
      "default_target": 100000,
      "trend_direction": "UP_GOOD",
      "data_freshness": "daily",
      "visibility": ["BRANCH_MANAGER", "SUPER_ADMIN"],
      "sensitive": true
    },
    {
      "kpi_id": "KPI-FIN-004",
      "category": "FINANCIAL",
      "name": "Revenue Per Employee",
      "description": "Revenue divided by FTE count",
      "formula": "SUM(revenue) / COUNT(employees WHERE status = 'ACTIVE')",
      "unit": "USD",
      "format": "currency",
      "aggregation": ["monthly", "quarterly", "yearly"],
      "dimensions": ["location", "department"],
      "target_type": "ABSOLUTE",
      "default_target": 45000,
      "trend_direction": "UP_GOOD",
      "data_freshness": "monthly",
      "visibility": ["BRANCH_MANAGER", "SUPER_ADMIN"],
      "sensitive": true
    },

    {
      "kpi_id": "KPI-RECV-001",
      "category": "RECEIVING",
      "name": "PO Receipts Today",
      "description": "Count of PO lines received today",
      "formula": "COUNT(po_receipt_lines) WHERE receipt_date = TODAY",
      "unit": "count",
      "format": "integer",
      "aggregation": ["daily", "weekly"],
      "dimensions": ["location", "vendor", "product_category"],
      "target_type": "INFORMATIONAL",
      "trend_direction": "NEUTRAL",
      "data_freshness": "real_time",
      "visibility": ["RECEIVING", "WAREHOUSE_MGR", "PURCHASING"]
    },
    {
      "kpi_id": "KPI-RECV-002",
      "category": "RECEIVING",
      "name": "Vendor On-Time Rate",
      "description": "Percentage of POs received by expected date",
      "formula": "(COUNT(po_receipts WHERE receipt_date <= expected_date) / COUNT(po_receipts)) * 100",
      "unit": "percent",
      "format": "percentage",
      "aggregation": ["monthly", "quarterly"],
      "dimensions": ["vendor", "product_category"],
      "target_type": "PERCENTAGE",
      "default_target": 90,
      "threshold_warning": 80,
      "threshold_critical": 70,
      "trend_direction": "UP_GOOD",
      "data_freshness": "daily",
      "visibility": ["PURCHASING", "INVENTORY_CTRL", "BRANCH_MANAGER"]
    },
    {
      "kpi_id": "KPI-RECV-003",
      "category": "RECEIVING",
      "name": "Receiving Dock-to-Stock Time",
      "description": "Average hours from receipt to put-away complete",
      "formula": "AVG(put_away_complete_time - receipt_time)",
      "unit": "hours",
      "format": "decimal_1dp",
      "aggregation": ["daily", "weekly"],
      "dimensions": ["location", "product_category"],
      "target_type": "ABSOLUTE",
      "default_target": 4,
      "threshold_warning": 8,
      "threshold_critical": 24,
      "trend_direction": "DOWN_GOOD",
      "data_freshness": "real_time",
      "visibility": ["WAREHOUSE_MGR", "RECEIVING", "INVENTORY_CTRL"]
    },

    {
      "kpi_id": "KPI-CUST-001",
      "category": "CUSTOMER",
      "name": "Active Customers",
      "description": "Customers with orders in last 12 months",
      "formula": "COUNT(DISTINCT customer_id) WHERE last_order_date >= TODAY - 365",
      "unit": "count",
      "format": "integer",
      "aggregation": ["monthly", "quarterly"],
      "dimensions": ["location", "customer_type", "salesperson"],
      "target_type": "ABSOLUTE",
      "default_target": 500,
      "trend_direction": "UP_GOOD",
      "data_freshness": "daily",
      "visibility": ["SALES_MANAGER", "BRANCH_MANAGER"]
    },
    {
      "kpi_id": "KPI-CUST-002",
      "category": "CUSTOMER",
      "name": "New Customer Acquisition",
      "description": "New customers with first order in period",
      "formula": "COUNT(customers) WHERE first_order_date IN PERIOD",
      "unit": "count",
      "format": "integer",
      "aggregation": ["monthly", "quarterly"],
      "dimensions": ["location", "salesperson", "source"],
      "target_type": "ABSOLUTE",
      "default_target": 10,
      "trend_direction": "UP_GOOD",
      "data_freshness": "daily",
      "visibility": ["SALES_MANAGER", "BRANCH_MANAGER"]
    },
    {
      "kpi_id": "KPI-CUST-003",
      "category": "CUSTOMER",
      "name": "Customer Churn Rate",
      "description": "Percentage of customers lost (no order in 12 months)",
      "formula": "(COUNT(customers WHERE last_order_date < TODAY - 365 AND was_active_prior_year) / COUNT(prior_year_active_customers)) * 100",
      "unit": "percent",
      "format": "percentage_1dp",
      "aggregation": ["quarterly", "yearly"],
      "dimensions": ["location", "customer_type", "salesperson"],
      "target_type": "PERCENTAGE",
      "default_target": 10,
      "threshold_warning": 15,
      "threshold_critical": 25,
      "trend_direction": "DOWN_GOOD",
      "data_freshness": "monthly",
      "visibility": ["SALES_MANAGER", "BRANCH_MANAGER"]
    },
    {
      "kpi_id": "KPI-CUST-004",
      "category": "CUSTOMER",
      "name": "Top 20 Customer Revenue Share",
      "description": "Percentage of revenue from top 20 customers",
      "formula": "(SUM(revenue WHERE customer IN top_20) / SUM(revenue)) * 100",
      "unit": "percent",
      "format": "percentage",
      "aggregation": ["monthly", "quarterly", "yearly"],
      "dimensions": ["location"],
      "target_type": "RANGE",
      "target_min": 40,
      "target_max": 60,
      "trend_direction": "NEUTRAL",
      "data_freshness": "daily",
      "visibility": ["SALES_MANAGER", "BRANCH_MANAGER"]
    }
  ]
}
```

---

## 2. Persona KPI Map — Table

### Primary KPIs by Role

| Role | Primary KPIs | Secondary KPIs | Dashboard Type |
|------|--------------|----------------|----------------|
| **SUPER_ADMIN** | KPI-FIN-003 (Gross Profit), KPI-SALES-001 (Daily Revenue), KPI-SALES-005 (Margin %), KPI-FIN-001 (DSO) | All KPIs accessible | Executive |
| **BRANCH_MANAGER** | KPI-SALES-001, KPI-SALES-005, KPI-SHIP-001 (OTD), KPI-PROD-002 (WO On-Time), KPI-FIN-001 | KPI-INV-001, KPI-QUAL-001, KPI-CUST-001 | Operations |
| **SALES_MANAGER** | KPI-SALES-001, KPI-SALES-002, KPI-SALES-004 (Quote Conv), KPI-SALES-005, KPI-CUST-001 | KPI-SALES-003, KPI-SALES-006, KPI-SHIP-001 | Sales |
| **INSIDE_SALES** | KPI-SALES-002 (own), KPI-SALES-004 (own), KPI-SALES-006 | KPI-INV-003 (Stock Avail), KPI-SHIP-003 | Sales (Personal) |
| **COUNTER_SALES** | KPI-SALES-002 (own), KPI-SHIP-006 (Will-Call), KPI-INV-003 | - | POS |
| **WAREHOUSE_MGR** | KPI-INV-004 (Accuracy), KPI-SHIP-005 (Pick Accuracy), KPI-RECV-003 (Dock-to-Stock) | KPI-SHIP-004, KPI-INV-001 | Warehouse |
| **WAREHOUSE_OP** | KPI-SHIP-005 (own), KPI-RECV-003 | - | Warehouse (Personal) |
| **SHOP_FLOOR_MGR** | KPI-PROD-001, KPI-PROD-002, KPI-PROD-003 (OEE), KPI-PROD-004 (Scrap) | KPI-PROD-005, KPI-PROD-006, KPI-PROD-007 | Production |
| **MACHINE_OP** | KPI-PROD-003 (own machine), KPI-PROD-004 (own), KPI-PROD-005 (own) | - | Production (Personal) |
| **SCHEDULER** | KPI-PROD-006 (Backlog), KPI-PROD-002, KPI-PROD-001 | KPI-SHIP-003, KPI-PROD-007 | Scheduling |
| **QA_MANAGER** | KPI-QUAL-001, KPI-QUAL-002, KPI-QUAL-003, KPI-QUAL-004 | KPI-QUAL-005, KPI-PROD-004 | Quality |
| **QA_INSPECTOR** | KPI-QUAL-001 (own), KPI-QUAL-005 | - | Quality (Personal) |
| **SHIPPING_COORD** | KPI-SHIP-001, KPI-SHIP-002, KPI-SHIP-004, KPI-SHIP-006 | KPI-SHIP-003, KPI-SHIP-005 | Shipping |
| **DRIVER** | KPI-SHIP-001 (own), deliveries_today, stops_remaining | - | Mobile |
| **RECEIVING** | KPI-RECV-001, KPI-RECV-003 | KPI-RECV-002 | Receiving |
| **INVENTORY_CTRL** | KPI-INV-001, KPI-INV-002, KPI-INV-003, KPI-INV-005, KPI-INV-006 | KPI-INV-004, KPI-RECV-002 | Inventory |
| **PURCHASING** | KPI-RECV-002 (Vendor OT), KPI-INV-002 (DSI), KPI-INV-005 (Slow Moving) | KPI-INV-001 | Purchasing |
| **AR_CLERK** | KPI-FIN-001 (DSO), KPI-FIN-002 (AR Aging) | KPI-SALES-001 | AR |
| **AP_CLERK** | pending_invoices, payment_due_today | - | AP |

### KPI Visibility Matrix

| KPI Category | Counter Sales | Inside Sales | Sales Mgr | Shop Floor | Warehouse | QA | Shipping | Finance | Branch Mgr | Admin |
|--------------|:-------------:|:------------:|:---------:|:----------:|:---------:|:--:|:--------:|:-------:|:----------:|:-----:|
| **SALES** | Vo | Vo | Va | - | - | - | Vl | Va | Va | Va |
| **INVENTORY** | Vl | Va | Va | Vl | Va | Vl | Vl | - | Va | Va |
| **PRODUCTION** | - | - | - | Va | - | Vl | Vl | - | Va | Va |
| **SHIPPING** | Vl | Vd | Vd | - | Vl | - | Va | - | Va | Va |
| **QUALITY** | - | - | - | Vl | Vl | Va | Vl | - | Va | Va |
| **FINANCIAL** | - | - | - | - | - | - | - | Va | Va | Va |
| **RECEIVING** | - | - | - | - | Va | Vl | - | - | Va | Va |
| **CUSTOMER** | - | Vd | Va | - | - | - | - | - | Va | Va |

*Legend: Va = All, Vl = Location, Vd = Division/Own, Vo = Own, - = None*

### KPI Drill-Down Permissions

| Role | Can Drill to Location | Can Drill to User | Can Drill to Customer | Can Drill to Product | Can Export |
|------|:---------------------:|:-----------------:|:---------------------:|:--------------------:|:----------:|
| SUPER_ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ |
| BRANCH_MANAGER | Own Location | Own Staff | ✅ | ✅ | ✅ |
| SALES_MANAGER | Assigned | Own Team | Own/Team | ✅ | ✅ |
| INSIDE_SALES | - | Own Only | Own | ✅ | Own |
| SHOP_FLOOR_MGR | Own Location | Own Staff | - | ✅ | ✅ |
| WAREHOUSE_MGR | Own Location | Own Staff | - | ✅ | ✅ |
| QA_MANAGER | Own Location | Own Staff | - | ✅ | ✅ |
| SHIPPING_COORD | Own Location | - | ✅ | - | ✅ |
| INVENTORY_CTRL | ✅ | - | - | ✅ | ✅ |
| AR_CLERK | ✅ | - | ✅ | - | ✅ |

---

## 3. Data Requirements — List

```yaml
data_requirements:

  real_time_sources:
    - source_id: RT-001
      name: "Order Entry Stream"
      type: event_stream
      events:
        - OrderCreated
        - OrderLineAdded
        - OrderPriced
        - OrderConfirmed
        - OrderCancelled
      kpis_fed:
        - KPI-SALES-001
        - KPI-SALES-002
        - KPI-SALES-003
        - KPI-SALES-005
        - KPI-SALES-006
      latency_requirement: "< 1 second"
      
    - source_id: RT-002
      name: "Work Order Execution Stream"
      type: event_stream
      events:
        - WorkOrderStarted
        - OperationStarted
        - OperationCompleted
        - WorkOrderCompleted
        - ScrapRecorded
      kpis_fed:
        - KPI-PROD-001
        - KPI-PROD-002
        - KPI-PROD-003
        - KPI-PROD-004
        - KPI-PROD-005
        - KPI-PROD-007
      latency_requirement: "< 2 seconds"
      
    - source_id: RT-003
      name: "Inventory Transaction Stream"
      type: event_stream
      events:
        - InventoryReceived
        - InventoryIssued
        - InventoryAdjusted
        - InventoryTransferred
        - AllocationCreated
        - AllocationReleased
      kpis_fed:
        - KPI-INV-003
        - KPI-INV-006
        - KPI-QUAL-004
      latency_requirement: "< 1 second"
      
    - source_id: RT-004
      name: "Shipment Execution Stream"
      type: event_stream
      events:
        - ShipmentCreated
        - PickCompleted
        - ShipmentStaged
        - ShipmentDispatched
        - DeliveryConfirmed
      kpis_fed:
        - KPI-SHIP-001
        - KPI-SHIP-002
        - KPI-SHIP-004
        - KPI-SHIP-005
        - KPI-SHIP-006
      latency_requirement: "< 1 second"

  batch_sources:
    - source_id: BATCH-001
      name: "Daily Inventory Snapshot"
      type: scheduled_batch
      schedule: "0 2 * * *"
      query_type: full_table_scan
      tables:
        - inventory_items
        - inventory_transactions
        - products
      kpis_fed:
        - KPI-INV-001
        - KPI-INV-002
        - KPI-INV-004
        - KPI-INV-005
      retention: "2 years daily, then monthly aggregates"
      
    - source_id: BATCH-002
      name: "Financial Period Close"
      type: scheduled_batch
      schedule: "0 4 1 * *"
      query_type: aggregation
      tables:
        - sales_orders
        - shipments
        - invoices
        - cost_layers
      kpis_fed:
        - KPI-FIN-001
        - KPI-FIN-002
        - KPI-FIN-003
        - KPI-FIN-004
      retention: "7 years"
      
    - source_id: BATCH-003
      name: "Customer Analysis"
      type: scheduled_batch
      schedule: "0 3 * * 0"
      query_type: aggregation
      tables:
        - customers
        - sales_orders
        - quotes
      kpis_fed:
        - KPI-CUST-001
        - KPI-CUST-002
        - KPI-CUST-003
        - KPI-CUST-004
        - KPI-SALES-004
      retention: "5 years"

  aggregation_tables:
    - table_id: AGG-001
      name: "daily_sales_summary"
      grain: [date, location_id, salesperson_id, customer_type, product_category_id]
      measures:
        - order_count
        - line_count
        - revenue
        - cost
        - margin
        - processing_revenue
      refresh: real_time (streaming aggregate)
      
    - table_id: AGG-002
      name: "daily_production_summary"
      grain: [date, location_id, work_center_id, shift, processing_type]
      measures:
        - work_order_count
        - completed_count
        - on_time_count
        - late_count
        - input_weight
        - output_weight
        - scrap_weight
        - setup_time_total
        - run_time_total
        - downtime_total
      refresh: real_time (streaming aggregate)
      
    - table_id: AGG-003
      name: "daily_shipping_summary"
      grain: [date, location_id, carrier_id, delivery_method]
      measures:
        - shipment_count
        - line_count
        - weight_shipped
        - on_time_count
        - late_count
        - pick_count
        - pick_errors
      refresh: real_time (streaming aggregate)
      
    - table_id: AGG-004
      name: "daily_inventory_snapshot"
      grain: [date, location_id, product_category_id, form_id]
      measures:
        - sku_count
        - in_stock_count
        - total_value
        - remnant_value
        - slow_moving_value
        - hold_value
      refresh: nightly batch
      
    - table_id: AGG-005
      name: "monthly_financial_summary"
      grain: [year_month, location_id, customer_type, product_category_id]
      measures:
        - revenue
        - cogs
        - gross_profit
        - margin_pct
        - order_count
        - customer_count
      refresh: daily batch

  dimension_tables:
    - table_id: DIM-001
      name: "dim_date"
      attributes:
        - date_key
        - calendar_date
        - day_of_week
        - week_of_year
        - month
        - quarter
        - year
        - fiscal_period
        - is_weekday
        - is_holiday
      refresh: static (yearly preload)
      
    - table_id: DIM-002
      name: "dim_location"
      attributes:
        - location_id
        - location_code
        - location_name
        - region
        - timezone
        - is_active
      refresh: triggered on change
      
    - table_id: DIM-003
      name: "dim_product"
      attributes:
        - product_id
        - sku
        - product_name
        - category_id
        - category_name
        - form_id
        - form_name
        - grade_id
        - grade_name
      refresh: triggered on change
      
    - table_id: DIM-004
      name: "dim_customer"
      attributes:
        - customer_id
        - customer_number
        - customer_name
        - customer_type
        - salesperson_id
        - territory
        - credit_rating
      refresh: triggered on change
      
    - table_id: DIM-005
      name: "dim_user"
      attributes:
        - user_id
        - username
        - full_name
        - role
        - department
        - location_id
        - manager_id
        - is_active
      refresh: triggered on change

  computed_metrics:
    - metric_id: COMP-001
      name: "rolling_12_month_revenue"
      formula: "SUM(revenue) OVER (ORDER BY date RANGE BETWEEN 365 PRECEDING AND CURRENT ROW)"
      depends_on: [daily_sales_summary]
      
    - metric_id: COMP-002
      name: "inventory_turn_rate"
      formula: "(rolling_12_month_cogs / AVG(inventory_value OVER 365 days)) "
      depends_on: [monthly_financial_summary, daily_inventory_snapshot]
      
    - metric_id: COMP-003
      name: "trend_vs_prior_period"
      formula: "((current_value - prior_value) / prior_value) * 100"
      depends_on: [any_kpi]
      
    - metric_id: COMP-004
      name: "target_attainment"
      formula: "(actual_value / target_value) * 100"
      depends_on: [any_kpi, targets]

  data_quality_rules:
    - rule_id: DQ-001
      name: "Revenue Non-Negative"
      check: "revenue >= 0"
      applies_to: [sales_orders, daily_sales_summary]
      action: reject_and_alert
      
    - rule_id: DQ-002
      name: "Margin Bounds Check"
      check: "margin_pct BETWEEN -50 AND 100"
      applies_to: [order_lines]
      action: flag_for_review
      
    - rule_id: DQ-003
      name: "Future Date Check"
      check: "date <= CURRENT_DATE + 1"
      applies_to: [all_fact_tables]
      action: reject
      
    - rule_id: DQ-004
      name: "Orphan Record Check"
      check: "foreign_keys resolve"
      applies_to: [all_tables]
      action: alert
```

---

## 4. Dashboard Model — Component Tree

```
DASHBOARD_SYSTEM
│
├── DashboardContainer
│   ├── props: { userId, userRole, locationScope, dashboardConfig }
│   ├── state: { 
│   │     currentDashboard, 
│   │     dateRange, 
│   │     filters,
│   │     refreshInterval,
│   │     isLoading 
│   │   }
│   │
│   ├── DashboardHeader
│   │   ├── DashboardTitle
│   │   │   ├── text: dashboardConfig.name
│   │   │   └── EditableTitle (if isOwner)
│   │   │
│   │   ├── DateRangeSelector
│   │   │   ├── QuickRangeButtons
│   │   │   │   ├── Button: "Today"
│   │   │   │   ├── Button: "This Week"
│   │   │   │   ├── Button: "This Month"
│   │   │   │   ├── Button: "This Quarter"
│   │   │   │   └── Button: "Custom"
│   │   │   ├── DateRangePicker (if custom)
│   │   │   └── ComparisonToggle: "vs Prior Period"
│   │   │
│   │   ├── GlobalFilters
│   │   │   ├── LocationFilter (if hasMultiLocation)
│   │   │   │   ├── type: multi-select
│   │   │   │   ├── options: userLocations
│   │   │   │   └── showAll: hasPermission.viewAllLocations
│   │   │   ├── CustomerTypeFilter
│   │   │   ├── ProductCategoryFilter
│   │   │   └── CustomFilterButton: "More Filters"
│   │   │
│   │   ├── DashboardActions
│   │   │   ├── RefreshButton
│   │   │   │   ├── icon: refresh
│   │   │   │   └── lastRefresh: timestamp
│   │   │   ├── RefreshIntervalSelector
│   │   │   │   └── options: [off, 30s, 1m, 5m, 15m]
│   │   │   ├── ShareButton
│   │   │   ├── ExportButton
│   │   │   │   ├── options: [PDF, Excel, Image]
│   │   │   │   └── scheduleOption: true
│   │   │   └── SettingsButton
│   │   │
│   │   └── ViewSwitcher
│   │       ├── LayoutToggle: [Grid, List, Full]
│   │       └── DashboardSelector
│   │           └── savedDashboards: dropdown
│   │
│   ├── DashboardGrid
│   │   ├── layout: { columns: 12, rowHeight: 80, draggable, resizable }
│   │   │
│   │   ├── KPICardWidget[]
│   │   │   ├── props: { kpiId, size: [small|medium|large] }
│   │   │   ├── KPICardHeader
│   │   │   │   ├── KPITitle: text
│   │   │   │   ├── InfoTooltip: description
│   │   │   │   └── ActionMenu: [drill, alert, remove]
│   │   │   │
│   │   │   ├── KPIValue
│   │   │   │   ├── MainValue: formatted number (large)
│   │   │   │   ├── UnitLabel: text
│   │   │   │   └── ValueColorCoding: 
│   │   │   │       ├── green: at/above target
│   │   │   │       ├── yellow: warning threshold
│   │   │   │       └── red: critical threshold
│   │   │   │
│   │   │   ├── KPITrend
│   │   │   │   ├── TrendArrow: up/down/flat
│   │   │   │   ├── TrendValue: "+5.2%"
│   │   │   │   ├── TrendPeriod: "vs prior week"
│   │   │   │   └── Sparkline (if size >= medium)
│   │   │   │
│   │   │   ├── KPITarget (if hasTarget)
│   │   │   │   ├── TargetValue: text
│   │   │   │   ├── ProgressBar: percent complete
│   │   │   │   └── GapToTarget: text
│   │   │   │
│   │   │   └── KPIActions
│   │   │       ├── DrillDownLink (if hasDrillPermission)
│   │   │       └── AlertBell (if hasAlert)
│   │   │
│   │   ├── ChartWidget[]
│   │   │   ├── props: { chartType, dataSource, dimensions, measures }
│   │   │   │
│   │   │   ├── ChartHeader
│   │   │   │   ├── ChartTitle
│   │   │   │   ├── ChartTypeToggle: [line, bar, area, pie]
│   │   │   │   └── ChartMenu: [expand, export, config]
│   │   │   │
│   │   │   ├── ChartBody
│   │   │   │   ├── LineChart
│   │   │   │   │   ├── xAxis: dimension (time, category)
│   │   │   │   │   ├── yAxis: measure(s)
│   │   │   │   │   ├── series: groupBy dimension
│   │   │   │   │   ├── tooltip: interactive
│   │   │   │   │   └── annotations: targets, events
│   │   │   │   │
│   │   │   │   ├── BarChart
│   │   │   │   │   ├── orientation: vertical | horizontal
│   │   │   │   │   ├── stacked: boolean
│   │   │   │   │   └── dataLabels: boolean
│   │   │   │   │
│   │   │   │   ├── PieChart
│   │   │   │   │   ├── type: pie | donut
│   │   │   │   │   ├── showLegend: boolean
│   │   │   │   │   └── showLabels: boolean
│   │   │   │   │
│   │   │   │   ├── AreaChart
│   │   │   │   │   └── stacked: boolean
│   │   │   │   │
│   │   │   │   ├── GaugeChart
│   │   │   │   │   ├── min: 0
│   │   │   │   │   ├── max: target * 1.2
│   │   │   │   │   └── zones: [red, yellow, green]
│   │   │   │   │
│   │   │   │   └── ComboChart
│   │   │   │       ├── primaryAxis: bar
│   │   │   │       └── secondaryAxis: line
│   │   │   │
│   │   │   └── ChartLegend
│   │   │       ├── items: series[]
│   │   │       └── toggleable: true
│   │   │
│   │   ├── TableWidget[]
│   │   │   ├── props: { dataSource, columns, pageSize, sortable, filterable }
│   │   │   │
│   │   │   ├── TableHeader
│   │   │   │   ├── Title
│   │   │   │   ├── RowCount: "Showing 1-25 of 142"
│   │   │   │   └── TableMenu: [export, columns, filter]
│   │   │   │
│   │   │   ├── DataTable
│   │   │   │   ├── HeaderRow
│   │   │   │   │   └── HeaderCell[]: sortable, resizable
│   │   │   │   ├── DataRow[]
│   │   │   │   │   ├── Cell[]: formatted by type
│   │   │   │   │   ├── ConditionalFormatting
│   │   │   │   │   └── RowActions: [view, drill]
│   │   │   │   └── SummaryRow (if configured)
│   │   │   │
│   │   │   └── TablePagination
│   │   │       ├── PageSizeSelector
│   │   │       └── PageNavigator
│   │   │
│   │   ├── MapWidget (if enabled)
│   │   │   ├── props: { dataSource, geoField, colorMetric, sizeMetric }
│   │   │   ├── MapContainer
│   │   │   │   ├── RegionMap (US states, zones)
│   │   │   │   └── MarkerMap (customer locations)
│   │   │   └── MapLegend
│   │   │
│   │   ├── AlertFeedWidget
│   │   │   ├── props: { maxItems, categories }
│   │   │   ├── AlertList
│   │   │   │   └── AlertItem[]
│   │   │   │       ├── AlertIcon: severity color
│   │   │   │       ├── AlertMessage: text
│   │   │   │       ├── AlertTime: relative
│   │   │   │       └── AlertAction: link/button
│   │   │   └── ViewAllLink
│   │   │
│   │   └── ActivityFeedWidget
│   │       ├── props: { maxItems, eventTypes }
│   │       └── ActivityList
│   │           └── ActivityItem[]
│   │               ├── UserAvatar
│   │               ├── ActivityText
│   │               ├── ActivityTime
│   │               └── EntityLink
│   │
│   └── DashboardCustomizer (if editing)
│       ├── WidgetPalette
│       │   ├── KPIWidgetOptions
│       │   │   └── AvailableKPI[] (filtered by permission)
│       │   ├── ChartWidgetOptions
│       │   │   └── ChartTypeSelector
│       │   ├── TableWidgetOptions
│       │   └── CustomWidgetOptions
│       │
│       ├── WidgetConfigurator
│       │   ├── DataSourceSelector
│       │   ├── DimensionPicker
│       │   ├── MeasurePicker
│       │   ├── FilterBuilder
│       │   └── StyleOptions
│       │
│       └── LayoutControls
│           ├── GridSnapToggle
│           ├── UndoRedo
│           └── SaveLayout
│
├── DrillDownView
│   ├── props: { sourceKpi, drillDimension, filters }
│   │
│   ├── DrillDownBreadcrumb
│   │   └── path: [Dashboard > KPI > Dimension1 > Dimension2]
│   │
│   ├── DrillDownHeader
│   │   ├── KPIContext: summary from parent
│   │   ├── CurrentDimension: badge
│   │   └── BackButton
│   │
│   ├── DrillDownContent
│   │   ├── SummaryCards: aggregates at current level
│   │   ├── DetailChart: breakdown by next dimension
│   │   └── DetailTable: sortable, filterable
│   │
│   └── FurtherDrillOptions
│       └── NextDimensionButtons: available drill paths
│
├── ReportBuilder
│   ├── props: { userId, savedReports }
│   │
│   ├── ReportDesigner
│   │   ├── DataSourcePanel
│   │   │   ├── AvailableTables
│   │   │   ├── AvailableKPIs
│   │   │   └── JoinBuilder (advanced)
│   │   │
│   │   ├── ColumnSelector
│   │   │   ├── DimensionList (drag to rows)
│   │   │   ├── MeasureList (drag to values)
│   │   │   └── CalculatedFieldBuilder
│   │   │
│   │   ├── FilterPanel
│   │   │   └── FilterRule[]
│   │   │       ├── FieldSelector
│   │   │       ├── OperatorSelector
│   │   │       └── ValueInput
│   │   │
│   │   ├── SortPanel
│   │   │   └── SortRule[]
│   │   │
│   │   └── FormatPanel
│   │       ├── ColumnFormats
│   │       ├── ConditionalFormats
│   │       └── Totals/Subtotals
│   │
│   ├── ReportPreview
│   │   ├── PreviewTable
│   │   └── RefreshPreview
│   │
│   └── ReportActions
│       ├── SaveReport
│       ├── ScheduleReport
│       │   ├── FrequencySelector
│       │   ├── RecipientList
│       │   └── FormatSelector
│       └── ExportReport
│
└── MobileDashboard
    ├── props: { userId, userRole }
    │
    ├── MobileHeader
    │   ├── DateSelector: simplified
    │   └── LocationSelector: single
    │
    ├── KPISummaryCards
    │   └── SwipeableKPICard[]
    │       ├── KPIValue: large
    │       ├── TrendIndicator
    │       └── TapToDrill
    │
    ├── QuickCharts
    │   └── HorizontalScrollChart[]
    │
    └── AlertsCompact
        └── AlertBadge with count
```

---

## 5. Alert Conditions — Rules

```yaml
alert_rules:

  sales_alerts:
    - alert_id: ALERT-SALES-001
      name: "Daily Revenue Below Target"
      kpi_id: KPI-SALES-001
      condition:
        type: threshold
        operator: "<"
        threshold_type: percentage_of_target
        threshold_value: 80
        evaluation_time: "16:00"
      severity: warning
      recipients:
        roles: [SALES_MANAGER, BRANCH_MANAGER]
        scope: location
      notification:
        channels: [in_app, email]
        message_template: "Daily revenue at {location} is {value} ({pct_of_target}% of target) as of 4 PM"
      cooldown_minutes: 480
      auto_resolve: true
      
    - alert_id: ALERT-SALES-002
      name: "Low Margin Order"
      kpi_id: KPI-SALES-005
      condition:
        type: threshold
        operator: "<"
        threshold_type: absolute
        threshold_value: 12
        scope: per_order
      severity: warning
      recipients:
        roles: [SALES_MANAGER]
        additional: [order.salesperson]
      notification:
        channels: [in_app]
        message_template: "Order {order_number} has margin of {margin_pct}% (min: 12%)"
      cooldown_minutes: 0
      auto_resolve: false
      requires_action: true
      
    - alert_id: ALERT-SALES-003
      name: "Quote Conversion Declining"
      kpi_id: KPI-SALES-004
      condition:
        type: trend
        operator: "<"
        comparison: rolling_4_week_avg
        threshold_pct: -15
      severity: warning
      recipients:
        roles: [SALES_MANAGER, BRANCH_MANAGER]
      notification:
        channels: [email]
        frequency: weekly
        message_template: "Quote conversion rate has dropped {trend_pct}% vs 4-week average"

  inventory_alerts:
    - alert_id: ALERT-INV-001
      name: "Stock Out Risk"
      kpi_id: KPI-INV-003
      condition:
        type: threshold
        operator: "<"
        threshold_type: absolute
        threshold_value: 85
      severity: critical
      recipients:
        roles: [INVENTORY_CTRL, PURCHASING, BRANCH_MANAGER]
        scope: location
      notification:
        channels: [in_app, email, sms]
        message_template: "Stock availability at {location} dropped to {value}% - {out_of_stock_count} SKUs out of stock"
      escalation:
        after_minutes: 60
        to_roles: [BRANCH_MANAGER]
      auto_resolve: true
      
    - alert_id: ALERT-INV-002
      name: "High Slow Moving Inventory"
      kpi_id: KPI-INV-005
      condition:
        type: threshold
        operator: ">"
        threshold_type: absolute
        threshold_value: 100000
      severity: warning
      recipients:
        roles: [INVENTORY_CTRL, PURCHASING]
        scope: location
      notification:
        channels: [in_app, email]
        frequency: weekly
        message_template: "Slow moving inventory at {location} exceeds $100K (current: {value})"
        
    - alert_id: ALERT-INV-003
      name: "Cycle Count Variance"
      kpi_id: KPI-INV-004
      condition:
        type: threshold
        operator: "<"
        threshold_type: absolute
        threshold_value: 95
      severity: warning
      recipients:
        roles: [WAREHOUSE_MGR, INVENTORY_CTRL]
        scope: location
      notification:
        channels: [in_app]
        message_template: "Cycle count accuracy at {location} is {value}% - investigate variances"

  production_alerts:
    - alert_id: ALERT-PROD-001
      name: "Work Order Overdue"
      condition:
        type: due_date
        threshold_hours: 0
        status_filter: ["IN_PROGRESS", "RELEASED"]
      severity: warning
      recipients:
        roles: [SHOP_FLOOR_MGR, SCHEDULER]
        additional: [work_order.assigned_operator]
        scope: work_center
      notification:
        channels: [in_app]
        message_template: "Work order {wo_number} is overdue (due: {due_date})"
      escalation:
        after_hours: 4
        to_roles: [BRANCH_MANAGER]
        
    - alert_id: ALERT-PROD-002
      name: "High Scrap Rate"
      kpi_id: KPI-PROD-004
      condition:
        type: threshold
        operator: ">"
        threshold_type: absolute
        threshold_value: 6
        evaluation_window: shift
      severity: critical
      recipients:
        roles: [SHOP_FLOOR_MGR, QA_MANAGER]
        additional: [current_operator]
        scope: work_center
      notification:
        channels: [in_app, email]
        message_template: "Scrap rate on {work_center} is {value}% this shift - investigate immediately"
      requires_action: true
      
    - alert_id: ALERT-PROD-003
      name: "OEE Below Threshold"
      kpi_id: KPI-PROD-003
      condition:
        type: threshold
        operator: "<"
        threshold_type: absolute
        threshold_value: 55
        evaluation_window: shift
      severity: warning
      recipients:
        roles: [SHOP_FLOOR_MGR]
        scope: work_center
      notification:
        channels: [in_app]
        message_template: "OEE on {work_center} is {value}% this shift (target: 75%)"
        
    - alert_id: ALERT-PROD-004
      name: "Backlog Exceeds Capacity"
      kpi_id: KPI-PROD-006
      condition:
        type: threshold
        operator: ">"
        threshold_type: absolute
        threshold_value: 80
      severity: warning
      recipients:
        roles: [SCHEDULER, SHOP_FLOOR_MGR]
        scope: work_center
      notification:
        channels: [in_app]
        message_template: "Work order backlog on {work_center} is {value} hours - exceeds 2-day capacity"

  shipping_alerts:
    - alert_id: ALERT-SHIP-001
      name: "On-Time Delivery At Risk"
      kpi_id: KPI-SHIP-001
      condition:
        type: threshold
        operator: "<"
        threshold_type: absolute
        threshold_value: 90
        evaluation_window: rolling_7_days
      severity: warning
      recipients:
        roles: [SHIPPING_COORD, SALES_MANAGER]
        scope: location
      notification:
        channels: [in_app, email]
        message_template: "7-day OTD rate is {value}% at {location} - below 90% target"
        
    - alert_id: ALERT-SHIP-002
      name: "Shipment Delayed"
      condition:
        type: schedule_variance
        threshold_hours: -4
        applies_to: promised_ship_date
      severity: warning
      recipients:
        roles: [SHIPPING_COORD]
        additional: [order.salesperson]
      notification:
        channels: [in_app]
        message_template: "Shipment {shipment_number} for {customer} may miss promised date - 4+ hours behind"
        
    - alert_id: ALERT-SHIP-003
      name: "Will-Call Aging"
      kpi_id: KPI-SHIP-006
      condition:
        type: age_threshold
        entity: will_call_orders
        age_days: 7
        count_threshold: 5
      severity: warning
      recipients:
        roles: [SHIPPING_COORD, COUNTER_SALES]
        scope: location
      notification:
        channels: [in_app]
        message_template: "{count} will-call orders at {location} have been waiting 7+ days"

  quality_alerts:
    - alert_id: ALERT-QUAL-001
      name: "Receiving Inspection Failure"
      condition:
        type: event
        event_type: InspectionFailed
        applies_to: receiving_inspection
      severity: warning
      recipients:
        roles: [QA_MANAGER, RECEIVING]
        additional: [purchasing.buyer_for_po]
      notification:
        channels: [in_app, email]
        message_template: "Receiving inspection failed for PO {po_number} - {failure_reason}"
      requires_action: true
      
    - alert_id: ALERT-QUAL-002
      name: "High NCR Volume"
      kpi_id: KPI-QUAL-002
      condition:
        type: threshold
        operator: ">"
        threshold_type: absolute
        threshold_value: 10
        evaluation_window: rolling_7_days
      severity: warning
      recipients:
        roles: [QA_MANAGER, BRANCH_MANAGER]
        scope: location
      notification:
        channels: [in_app, email]
        message_template: "{value} NCRs opened in past 7 days at {location} - investigate root causes"
        
    - alert_id: ALERT-QUAL-003
      name: "Material Hold Aging"
      kpi_id: KPI-QUAL-004
      condition:
        type: combined
        conditions:
          - type: threshold
            field: hold_value
            operator: ">"
            threshold_value: 50000
          - type: age_threshold
            field: oldest_hold_days
            operator: ">"
            threshold_value: 14
      severity: warning
      recipients:
        roles: [QA_MANAGER, INVENTORY_CTRL]
        scope: location
      notification:
        channels: [in_app]
        message_template: "Quality hold value at {location} is {hold_value} with items over 14 days old"

  financial_alerts:
    - alert_id: ALERT-FIN-001
      name: "AR Aging Threshold"
      kpi_id: KPI-FIN-002
      condition:
        type: threshold
        operator: ">"
        threshold_type: percentage_of
        threshold_base: total_ar
        threshold_value: 15
      severity: critical
      recipients:
        roles: [AR_CLERK, BRANCH_MANAGER]
      notification:
        channels: [in_app, email]
        message_template: "AR over 60 days is {pct}% of total AR ({value}) - escalate collections"
      requires_action: true
      
    - alert_id: ALERT-FIN-002
      name: "Customer Credit Limit Exceeded"
      condition:
        type: threshold
        operator: ">"
        threshold_type: percentage_of
        threshold_base: customer.credit_limit
        threshold_value: 100
        per_entity: customer
      severity: warning
      recipients:
        roles: [AR_CLERK, SALES_MANAGER]
        additional: [customer.salesperson]
      notification:
        channels: [in_app]
        message_template: "Customer {customer_name} has exceeded credit limit (balance: {balance}, limit: {limit})"
      auto_block_orders: true
      
    - alert_id: ALERT-FIN-003
      name: "DSO Trending Up"
      kpi_id: KPI-FIN-001
      condition:
        type: trend
        operator: ">"
        comparison: prior_month
        threshold_pct: 10
      severity: warning
      recipients:
        roles: [AR_CLERK, BRANCH_MANAGER]
      notification:
        channels: [email]
        frequency: monthly
        message_template: "DSO increased {trend_pct}% vs prior month (now: {value} days)"

  system_alerts:
    - alert_id: ALERT-SYS-001
      name: "Data Sync Failure"
      condition:
        type: system_health
        check: data_sync_status
        threshold_minutes: 30
      severity: critical
      recipients:
        roles: [SUPER_ADMIN]
        additional: [tech_support_email]
      notification:
        channels: [email, sms]
        message_template: "Data sync has not completed in 30 minutes - check integration status"
        
    - alert_id: ALERT-SYS-002
      name: "Report Generation Failed"
      condition:
        type: event
        event_type: ScheduledReportFailed
      severity: warning
      recipients:
        additional: [report.owner]
      notification:
        channels: [in_app, email]
        message_template: "Scheduled report '{report_name}' failed to generate: {error_message}"

  alert_configuration:
    notification_channels:
      in_app:
        delivery: real_time
        persistence: 30_days
        acknowledgment: required_for_warning_critical
      email:
        delivery: immediate | batched
        batch_interval: 15_minutes
        template: html_branded
      sms:
        delivery: immediate
        restricted_to: critical_only
        opt_in_required: true
      webhook:
        delivery: immediate
        retry_policy: 3_attempts_exponential
        
    escalation_defaults:
      warning:
        initial_wait: 60_minutes
        escalation_chain: [direct_manager, department_head]
      critical:
        initial_wait: 30_minutes
        escalation_chain: [direct_manager, department_head, branch_manager]
        sms_enabled: true
        
    quiet_hours:
      enabled: per_user_setting
      default_hours: "22:00-07:00"
      exceptions: [critical_alerts]
      
    acknowledgment_rules:
      warning:
        required: false
        auto_resolve_hours: 24
      critical:
        required: true
        reminder_interval_minutes: 30
        escalate_if_unacknowledged: true
```

---

*Document generated for AI-build Phase 12: Analytics & KPIs*
