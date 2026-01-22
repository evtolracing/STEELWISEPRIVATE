# 65 — Build Analytics Dashboards

> **Purpose:** KPIs, dashboard structures, persona mappings, and alert conditions.  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. kpis

```json
[
  {
    "id": "kpi_revenue_total",
    "label": "Total Revenue",
    "description": "Sum of invoiced order totals for period",
    "category": "financial",
    "owner_roles": ["DIVISION_MANAGER", "FINANCE", "ADMIN"],
    "aggregation_level": ["day", "week", "month", "quarter", "year", "location", "division"],
    "inputs": ["invoice.total_amount", "invoice.invoice_date"],
    "formula": "SUM(invoice.total_amount) WHERE invoice.status = 'posted'",
    "format": "currency",
    "trend_comparison": "prior_period"
  },
  {
    "id": "kpi_gross_margin_pct",
    "label": "Gross Margin %",
    "description": "Gross profit as percentage of revenue",
    "category": "financial",
    "owner_roles": ["BRANCH_MANAGER", "DIVISION_MANAGER", "FINANCE", "ADMIN"],
    "aggregation_level": ["day", "week", "month", "location", "division", "customer", "product_category"],
    "inputs": ["order_line.net_price", "order_line.cost"],
    "formula": "((SUM(net_price) - SUM(cost)) / SUM(net_price)) * 100",
    "format": "percent",
    "target": 18,
    "warning_below": 15,
    "critical_below": 10
  },
  {
    "id": "kpi_gross_profit",
    "label": "Gross Profit",
    "description": "Revenue minus cost of goods sold",
    "category": "financial",
    "owner_roles": ["BRANCH_MANAGER", "DIVISION_MANAGER", "FINANCE", "ADMIN"],
    "aggregation_level": ["day", "week", "month", "location", "division"],
    "inputs": ["order_line.net_price", "order_line.cost"],
    "formula": "SUM(net_price) - SUM(cost)",
    "format": "currency",
    "trend_comparison": "prior_period"
  },
  {
    "id": "kpi_orders_count",
    "label": "Order Count",
    "description": "Number of orders placed in period",
    "category": "sales",
    "owner_roles": ["CSR", "BRANCH_MANAGER", "DIVISION_MANAGER"],
    "aggregation_level": ["day", "week", "month", "location", "division", "sales_rep"],
    "inputs": ["order.id", "order.order_date"],
    "formula": "COUNT(DISTINCT order.id)",
    "format": "number",
    "trend_comparison": "prior_period"
  },
  {
    "id": "kpi_order_value_avg",
    "label": "Avg Order Value",
    "description": "Average order total",
    "category": "sales",
    "owner_roles": ["CSR", "BRANCH_MANAGER", "DIVISION_MANAGER"],
    "aggregation_level": ["day", "week", "month", "location", "division", "customer"],
    "inputs": ["order.grand_total", "order.id"],
    "formula": "SUM(grand_total) / COUNT(DISTINCT id)",
    "format": "currency",
    "trend_comparison": "prior_period"
  },
  {
    "id": "kpi_lines_per_order",
    "label": "Lines per Order",
    "description": "Average number of line items per order",
    "category": "sales",
    "owner_roles": ["CSR", "PLANNER"],
    "aggregation_level": ["day", "week", "month", "location"],
    "inputs": ["order_line.id", "order.id"],
    "formula": "COUNT(order_line.id) / COUNT(DISTINCT order.id)",
    "format": "decimal_2",
    "trend_comparison": "prior_period"
  },
  {
    "id": "kpi_quote_conversion",
    "label": "Quote Conversion Rate",
    "description": "Percentage of quotes converted to orders",
    "category": "sales",
    "owner_roles": ["CSR", "BRANCH_MANAGER", "DIVISION_MANAGER"],
    "aggregation_level": ["week", "month", "location", "division", "sales_rep"],
    "inputs": ["quote.id", "quote.status", "order.quote_id"],
    "formula": "(COUNT(order WHERE quote_id IS NOT NULL) / COUNT(quote)) * 100",
    "format": "percent",
    "target": 35,
    "warning_below": 25
  },
  {
    "id": "kpi_on_time_delivery",
    "label": "On-Time Delivery %",
    "description": "Orders shipped by promised date",
    "category": "operations",
    "owner_roles": ["SHIPPING", "BRANCH_MANAGER", "DIVISION_MANAGER", "ADMIN"],
    "aggregation_level": ["day", "week", "month", "location", "division"],
    "inputs": ["order.promised_date", "shipment.ship_date"],
    "formula": "(COUNT(WHERE ship_date <= promised_date) / COUNT(total)) * 100",
    "format": "percent",
    "target": 95,
    "warning_below": 90,
    "critical_below": 85
  },
  {
    "id": "kpi_avg_lead_time",
    "label": "Avg Lead Time",
    "description": "Average days from order to ship",
    "category": "operations",
    "owner_roles": ["PLANNER", "BRANCH_MANAGER", "DIVISION_MANAGER"],
    "aggregation_level": ["week", "month", "location", "division", "processing_type"],
    "inputs": ["order.order_date", "shipment.ship_date"],
    "formula": "AVG(DATEDIFF(ship_date, order_date))",
    "format": "days",
    "target": 3,
    "warning_above": 5,
    "critical_above": 7
  },
  {
    "id": "kpi_jobs_open",
    "label": "Open Jobs",
    "description": "Jobs currently in progress",
    "category": "operations",
    "owner_roles": ["PLANNER", "OPERATOR", "BRANCH_MANAGER"],
    "aggregation_level": ["current", "location", "work_center"],
    "inputs": ["job.id", "job.status"],
    "formula": "COUNT(WHERE status IN ('queued', 'in_progress', 'staged'))",
    "format": "number",
    "realtime": true
  },
  {
    "id": "kpi_jobs_completed_today",
    "label": "Jobs Completed Today",
    "description": "Jobs finished today",
    "category": "operations",
    "owner_roles": ["PLANNER", "OPERATOR", "BRANCH_MANAGER"],
    "aggregation_level": ["day", "location", "work_center", "operator"],
    "inputs": ["job.id", "job.completed_at"],
    "formula": "COUNT(WHERE DATE(completed_at) = TODAY)",
    "format": "number",
    "realtime": true
  },
  {
    "id": "kpi_jobs_late",
    "label": "Late Jobs",
    "description": "Jobs past due date not completed",
    "category": "operations",
    "owner_roles": ["PLANNER", "BRANCH_MANAGER", "DIVISION_MANAGER"],
    "aggregation_level": ["current", "location", "work_center"],
    "inputs": ["job.id", "job.due_date", "job.status"],
    "formula": "COUNT(WHERE due_date < TODAY AND status NOT IN ('completed', 'cancelled'))",
    "format": "number",
    "realtime": true,
    "alert_if": "> 0"
  },
  {
    "id": "kpi_work_center_utilization",
    "label": "Work Center Utilization",
    "description": "Percentage of available capacity used",
    "category": "operations",
    "owner_roles": ["PLANNER", "BRANCH_MANAGER", "DIVISION_MANAGER"],
    "aggregation_level": ["day", "week", "month", "location", "work_center"],
    "inputs": ["job_event_log.duration", "work_center.available_hours"],
    "formula": "(SUM(productive_hours) / SUM(available_hours)) * 100",
    "format": "percent",
    "target": 80,
    "warning_below": 60,
    "warning_above": 95
  },
  {
    "id": "kpi_scrap_rate",
    "label": "Scrap Rate %",
    "description": "Weight scrapped vs processed",
    "category": "quality",
    "owner_roles": ["QA_MANAGER", "BRANCH_MANAGER", "DIVISION_MANAGER"],
    "aggregation_level": ["day", "week", "month", "location", "work_center", "operator"],
    "inputs": ["inventory_transaction.scrap_weight", "inventory_transaction.input_weight"],
    "formula": "(SUM(scrap_weight) / SUM(input_weight)) * 100",
    "format": "percent",
    "target": 2,
    "warning_above": 3,
    "critical_above": 5
  },
  {
    "id": "kpi_first_pass_yield",
    "label": "First Pass Yield %",
    "description": "Jobs completed without rework",
    "category": "quality",
    "owner_roles": ["QA_MANAGER", "BRANCH_MANAGER", "DIVISION_MANAGER"],
    "aggregation_level": ["week", "month", "location", "work_center", "operator"],
    "inputs": ["job.id", "job.rework_count"],
    "formula": "(COUNT(WHERE rework_count = 0) / COUNT(total)) * 100",
    "format": "percent",
    "target": 98,
    "warning_below": 95,
    "critical_below": 90
  },
  {
    "id": "kpi_ncr_count",
    "label": "NCR Count",
    "description": "Non-conformance reports opened",
    "category": "quality",
    "owner_roles": ["QA_MANAGER", "BRANCH_MANAGER", "DIVISION_MANAGER"],
    "aggregation_level": ["day", "week", "month", "location", "division"],
    "inputs": ["ncr.id", "ncr.created_at"],
    "formula": "COUNT(ncr.id)",
    "format": "number",
    "trend_comparison": "prior_period"
  },
  {
    "id": "kpi_inventory_turns",
    "label": "Inventory Turns",
    "description": "COGS / Average Inventory Value",
    "category": "inventory",
    "owner_roles": ["PURCHASING", "BRANCH_MANAGER", "DIVISION_MANAGER", "FINANCE"],
    "aggregation_level": ["month", "quarter", "year", "location", "division", "product_category"],
    "inputs": ["order_line.cost", "inventory_unit.value"],
    "formula": "SUM(cogs_12m) / AVG(inventory_value)",
    "format": "decimal_1",
    "target": 6,
    "warning_below": 4
  },
  {
    "id": "kpi_inventory_value",
    "label": "Inventory Value",
    "description": "Total value of on-hand inventory",
    "category": "inventory",
    "owner_roles": ["PURCHASING", "BRANCH_MANAGER", "DIVISION_MANAGER", "FINANCE"],
    "aggregation_level": ["current", "location", "division", "product_category"],
    "inputs": ["inventory_unit.quantity", "inventory_unit.cost"],
    "formula": "SUM(quantity * cost) WHERE status = 'available'",
    "format": "currency",
    "realtime": true
  },
  {
    "id": "kpi_slow_moving_pct",
    "label": "Slow Moving %",
    "description": "Inventory with no movement in 180+ days",
    "category": "inventory",
    "owner_roles": ["PURCHASING", "BRANCH_MANAGER", "DIVISION_MANAGER"],
    "aggregation_level": ["current", "location", "division", "product_category"],
    "inputs": ["inventory_unit.last_movement_date", "inventory_unit.value"],
    "formula": "(SUM(value WHERE days_since_movement > 180) / SUM(value)) * 100",
    "format": "percent",
    "target": 5,
    "warning_above": 10,
    "critical_above": 15
  },
  {
    "id": "kpi_stock_outs",
    "label": "Stock Out Events",
    "description": "Count of zero-inventory on ordered products",
    "category": "inventory",
    "owner_roles": ["PURCHASING", "CSR", "BRANCH_MANAGER"],
    "aggregation_level": ["day", "week", "month", "location"],
    "inputs": ["order_line.product_id", "inventory_unit.available_qty"],
    "formula": "COUNT(WHERE available_qty <= 0 AND order_line created)",
    "format": "number",
    "trend_comparison": "prior_period"
  },
  {
    "id": "kpi_shipments_today",
    "label": "Shipments Today",
    "description": "Number of shipments going out today",
    "category": "logistics",
    "owner_roles": ["SHIPPING", "BRANCH_MANAGER"],
    "aggregation_level": ["day", "location"],
    "inputs": ["shipment.id", "shipment.ship_date"],
    "formula": "COUNT(WHERE ship_date = TODAY)",
    "format": "number",
    "realtime": true
  },
  {
    "id": "kpi_receipts_today",
    "label": "Receipts Today",
    "description": "PO receipts expected today",
    "category": "logistics",
    "owner_roles": ["SHIPPING", "PURCHASING", "BRANCH_MANAGER"],
    "aggregation_level": ["day", "location"],
    "inputs": ["po_receipt.id", "po_receipt.expected_date"],
    "formula": "COUNT(WHERE expected_date = TODAY)",
    "format": "number",
    "realtime": true
  },
  {
    "id": "kpi_will_calls_pending",
    "label": "Will Calls Pending",
    "description": "Will-call orders awaiting pickup",
    "category": "logistics",
    "owner_roles": ["SHIPPING", "CSR", "BRANCH_MANAGER"],
    "aggregation_level": ["current", "location"],
    "inputs": ["order.id", "order.delivery_type", "order.status"],
    "formula": "COUNT(WHERE delivery_type = 'will_call' AND status = 'ready_for_pickup')",
    "format": "number",
    "realtime": true
  },
  {
    "id": "kpi_ar_outstanding",
    "label": "AR Outstanding",
    "description": "Total accounts receivable balance",
    "category": "financial",
    "owner_roles": ["FINANCE", "DIVISION_MANAGER", "ADMIN"],
    "aggregation_level": ["current", "location", "division", "customer"],
    "inputs": ["invoice.balance_due"],
    "formula": "SUM(balance_due) WHERE status = 'open'",
    "format": "currency",
    "realtime": true
  },
  {
    "id": "kpi_ar_aging_over_60",
    "label": "AR Over 60 Days",
    "description": "Receivables aged over 60 days",
    "category": "financial",
    "owner_roles": ["FINANCE", "DIVISION_MANAGER", "ADMIN"],
    "aggregation_level": ["current", "location", "division", "customer"],
    "inputs": ["invoice.balance_due", "invoice.due_date"],
    "formula": "SUM(balance_due) WHERE days_past_due > 60",
    "format": "currency",
    "warning_above": "10% of AR"
  },
  {
    "id": "kpi_dso",
    "label": "Days Sales Outstanding",
    "description": "Average days to collect receivables",
    "category": "financial",
    "owner_roles": ["FINANCE", "DIVISION_MANAGER", "ADMIN"],
    "aggregation_level": ["month", "quarter", "location", "division"],
    "inputs": ["invoice.invoice_date", "payment.payment_date"],
    "formula": "(AR_balance / Revenue_per_day)",
    "format": "days",
    "target": 35,
    "warning_above": 45,
    "critical_above": 60
  },
  {
    "id": "kpi_customer_count_active",
    "label": "Active Customers",
    "description": "Customers with orders in last 90 days",
    "category": "sales",
    "owner_roles": ["CSR", "BRANCH_MANAGER", "DIVISION_MANAGER"],
    "aggregation_level": ["month", "quarter", "location", "division"],
    "inputs": ["customer.id", "order.order_date"],
    "formula": "COUNT(DISTINCT customer WHERE order in last 90 days)",
    "format": "number",
    "trend_comparison": "prior_period"
  },
  {
    "id": "kpi_new_customers",
    "label": "New Customers",
    "description": "Customers with first order in period",
    "category": "sales",
    "owner_roles": ["CSR", "BRANCH_MANAGER", "DIVISION_MANAGER"],
    "aggregation_level": ["week", "month", "quarter", "location", "division"],
    "inputs": ["customer.id", "customer.first_order_date"],
    "formula": "COUNT(WHERE first_order_date in period)",
    "format": "number",
    "trend_comparison": "prior_period"
  },
  {
    "id": "kpi_customer_retention",
    "label": "Customer Retention %",
    "description": "Customers ordering this period who ordered last period",
    "category": "sales",
    "owner_roles": ["BRANCH_MANAGER", "DIVISION_MANAGER", "ADMIN"],
    "aggregation_level": ["month", "quarter", "year", "location", "division"],
    "inputs": ["customer.id", "order.order_date"],
    "formula": "(COUNT(repeat_customers) / COUNT(prior_period_customers)) * 100",
    "format": "percent",
    "target": 85,
    "warning_below": 75
  },
  {
    "id": "kpi_csr_orders_today",
    "label": "My Orders Today",
    "description": "Orders entered by current user today",
    "category": "personal",
    "owner_roles": ["CSR"],
    "aggregation_level": ["day", "user"],
    "inputs": ["order.id", "order.created_by", "order.order_date"],
    "formula": "COUNT(WHERE created_by = current_user AND order_date = TODAY)",
    "format": "number",
    "scope": "user"
  },
  {
    "id": "kpi_planner_jobs_scheduled",
    "label": "Jobs Scheduled Today",
    "description": "Jobs scheduled by current planner today",
    "category": "personal",
    "owner_roles": ["PLANNER"],
    "aggregation_level": ["day", "user"],
    "inputs": ["job.id", "job.scheduled_by", "job.scheduled_date"],
    "formula": "COUNT(WHERE scheduled_by = current_user AND DATE(scheduled_at) = TODAY)",
    "format": "number",
    "scope": "user"
  },
  {
    "id": "kpi_operator_pieces_today",
    "label": "Pieces Produced Today",
    "description": "Pieces completed by current operator today",
    "category": "personal",
    "owner_roles": ["OPERATOR"],
    "aggregation_level": ["day", "user"],
    "inputs": ["job_event_log.pieces_out", "job_event_log.operator_id"],
    "formula": "SUM(pieces_out WHERE operator = current_user AND DATE(completed_at) = TODAY)",
    "format": "number",
    "scope": "user"
  },
  {
    "id": "kpi_operator_weight_today",
    "label": "Weight Processed Today",
    "description": "Pounds processed by current operator today",
    "category": "personal",
    "owner_roles": ["OPERATOR"],
    "aggregation_level": ["day", "user"],
    "inputs": ["job_event_log.weight_out", "job_event_log.operator_id"],
    "formula": "SUM(weight_out WHERE operator = current_user AND DATE(completed_at) = TODAY)",
    "format": "weight_lbs",
    "scope": "user"
  },
  {
    "id": "kpi_avg_processing_time",
    "label": "Avg Processing Time",
    "description": "Average minutes per job by processing type",
    "category": "operations",
    "owner_roles": ["PLANNER", "BRANCH_MANAGER"],
    "aggregation_level": ["week", "month", "location", "work_center", "processing_type"],
    "inputs": ["job_event_log.duration_minutes", "job.processing_type_id"],
    "formula": "AVG(duration_minutes)",
    "format": "minutes",
    "trend_comparison": "prior_period"
  },
  {
    "id": "kpi_price_override_count",
    "label": "Price Overrides",
    "description": "Count of manual price overrides",
    "category": "sales",
    "owner_roles": ["BRANCH_MANAGER", "DIVISION_MANAGER", "FINANCE"],
    "aggregation_level": ["day", "week", "month", "location", "sales_rep"],
    "inputs": ["order_line.price_source", "order_line.id"],
    "formula": "COUNT(WHERE price_source = 'override')",
    "format": "number",
    "trend_comparison": "prior_period"
  },
  {
    "id": "kpi_mttr",
    "label": "MTTR (Mean Time to Repair)",
    "description": "Average downtime for work center repairs",
    "category": "operations",
    "owner_roles": ["BRANCH_MANAGER", "DIVISION_MANAGER"],
    "aggregation_level": ["month", "quarter", "location", "work_center"],
    "inputs": ["maintenance_log.downtime_minutes"],
    "formula": "AVG(downtime_minutes)",
    "format": "minutes",
    "warning_above": 120
  }
]
```

---

## 2. persona_kpi_map

| KPI ID | CSR | PLANNER | OPERATOR | SHIPPING | RETAIL_COUNTER | BRANCH_MANAGER | DIVISION_MANAGER | FINANCE | QA_MANAGER | PURCHASING | ADMIN |
|--------|-----|---------|----------|----------|----------------|----------------|------------------|---------|------------|------------|-------|
| kpi_revenue_total | - | - | - | - | - | secondary | primary | primary | - | - | primary |
| kpi_gross_margin_pct | - | - | - | - | - | primary | primary | primary | - | - | primary |
| kpi_gross_profit | - | - | - | - | - | primary | primary | primary | - | - | primary |
| kpi_orders_count | primary | secondary | - | - | secondary | primary | primary | secondary | - | - | secondary |
| kpi_order_value_avg | secondary | - | - | - | secondary | primary | primary | secondary | - | - | secondary |
| kpi_lines_per_order | secondary | primary | - | - | secondary | secondary | - | - | - | - | - |
| kpi_quote_conversion | primary | - | - | - | - | primary | primary | - | - | - | secondary |
| kpi_on_time_delivery | secondary | primary | - | primary | - | primary | primary | - | - | - | primary |
| kpi_avg_lead_time | secondary | primary | - | secondary | - | primary | primary | - | - | - | secondary |
| kpi_jobs_open | - | primary | secondary | - | - | primary | secondary | - | - | - | secondary |
| kpi_jobs_completed_today | - | primary | primary | - | - | primary | secondary | - | - | - | - |
| kpi_jobs_late | secondary | primary | - | - | - | primary | primary | - | secondary | - | primary |
| kpi_work_center_utilization | - | primary | - | - | - | primary | primary | - | - | - | secondary |
| kpi_scrap_rate | - | secondary | secondary | - | - | primary | primary | - | primary | - | secondary |
| kpi_first_pass_yield | - | secondary | secondary | - | - | secondary | primary | - | primary | - | secondary |
| kpi_ncr_count | - | - | - | - | - | secondary | primary | - | primary | - | secondary |
| kpi_inventory_turns | - | - | - | - | - | secondary | primary | primary | - | primary | primary |
| kpi_inventory_value | - | - | - | - | - | primary | primary | primary | - | primary | primary |
| kpi_slow_moving_pct | - | - | - | - | - | secondary | primary | secondary | - | primary | secondary |
| kpi_stock_outs | secondary | secondary | - | - | - | primary | primary | - | - | primary | secondary |
| kpi_shipments_today | - | secondary | - | primary | - | primary | secondary | - | - | - | - |
| kpi_receipts_today | - | - | - | primary | - | secondary | - | - | - | primary | - |
| kpi_will_calls_pending | secondary | - | - | primary | - | secondary | - | - | - | - | - |
| kpi_ar_outstanding | - | - | - | - | - | secondary | primary | primary | - | - | primary |
| kpi_ar_aging_over_60 | - | - | - | - | - | secondary | primary | primary | - | - | primary |
| kpi_dso | - | - | - | - | - | - | primary | primary | - | - | primary |
| kpi_customer_count_active | secondary | - | - | - | - | primary | primary | - | - | - | secondary |
| kpi_new_customers | secondary | - | - | - | - | primary | primary | - | - | - | secondary |
| kpi_customer_retention | - | - | - | - | - | secondary | primary | - | - | - | primary |
| kpi_csr_orders_today | primary | - | - | - | - | - | - | - | - | - | - |
| kpi_planner_jobs_scheduled | - | primary | - | - | - | - | - | - | - | - | - |
| kpi_operator_pieces_today | - | - | primary | - | - | - | - | - | - | - | - |
| kpi_operator_weight_today | - | - | primary | - | - | - | - | - | - | - | - |
| kpi_avg_processing_time | - | primary | - | - | - | primary | secondary | - | - | - | - |
| kpi_price_override_count | - | - | - | - | - | primary | primary | primary | - | - | secondary |
| kpi_mttr | - | secondary | - | - | - | primary | primary | - | - | - | secondary |

---

## 3. dashboard_model

### Branch Manager Dashboard

```json
{
  "id": "branch_manager_dashboard",
  "label": "Branch Dashboard",
  "app": "analytics_app",
  "roles": ["BRANCH_MANAGER"],
  "scope": "location",
  "refresh_interval_sec": 60,
  "layout": {
    "type": "grid",
    "columns": 12,
    "row_height": 80
  },
  "global_filters": [
    {
      "id": "date_range",
      "type": "date_range_picker",
      "default": "mtd",
      "options": ["today", "yesterday", "wtd", "mtd", "qtd", "ytd", "custom"]
    },
    {
      "id": "location",
      "type": "dropdown",
      "source": "user.locations",
      "default": "user.primary_location",
      "visible": false
    }
  ],
  "sections": [
    {
      "id": "kpi_cards",
      "type": "kpi_card_row",
      "position": { "col": 1, "row": 1, "width": 12, "height": 1 },
      "cards": [
        {
          "id": "revenue_card",
          "kpi_id": "kpi_revenue_total",
          "size": "standard",
          "show_trend": true,
          "trend_period": "prior_period",
          "action": { "type": "drill_down", "target": "revenue_detail" }
        },
        {
          "id": "margin_card",
          "kpi_id": "kpi_gross_margin_pct",
          "size": "standard",
          "show_trend": true,
          "color_coded": true,
          "action": { "type": "drill_down", "target": "margin_detail" }
        },
        {
          "id": "orders_card",
          "kpi_id": "kpi_orders_count",
          "size": "standard",
          "show_trend": true,
          "action": { "type": "navigate", "target": "/orders" }
        },
        {
          "id": "otd_card",
          "kpi_id": "kpi_on_time_delivery",
          "size": "standard",
          "show_trend": true,
          "color_coded": true,
          "action": { "type": "drill_down", "target": "late_orders" }
        },
        {
          "id": "late_jobs_card",
          "kpi_id": "kpi_jobs_late",
          "size": "alert",
          "color": "error_if_nonzero",
          "action": { "type": "navigate", "target": "/schedule?filter=late" }
        }
      ]
    },
    {
      "id": "operations_row",
      "type": "kpi_card_row",
      "position": { "col": 1, "row": 2, "width": 12, "height": 1 },
      "cards": [
        {
          "id": "jobs_open_card",
          "kpi_id": "kpi_jobs_open",
          "size": "compact",
          "realtime": true
        },
        {
          "id": "jobs_completed_card",
          "kpi_id": "kpi_jobs_completed_today",
          "size": "compact",
          "realtime": true
        },
        {
          "id": "shipments_card",
          "kpi_id": "kpi_shipments_today",
          "size": "compact",
          "realtime": true
        },
        {
          "id": "will_calls_card",
          "kpi_id": "kpi_will_calls_pending",
          "size": "compact",
          "realtime": true
        },
        {
          "id": "utilization_card",
          "kpi_id": "kpi_work_center_utilization",
          "size": "compact",
          "color_coded": true
        },
        {
          "id": "scrap_card",
          "kpi_id": "kpi_scrap_rate",
          "size": "compact",
          "color_coded": true
        }
      ]
    },
    {
      "id": "revenue_chart",
      "type": "chart",
      "chart_type": "bar",
      "position": { "col": 1, "row": 3, "width": 6, "height": 3 },
      "title": "Daily Revenue",
      "data_source": {
        "kpi_id": "kpi_revenue_total",
        "group_by": "day",
        "period": "mtd"
      },
      "x_axis": "date",
      "y_axis": "revenue",
      "comparison_series": {
        "enabled": true,
        "type": "prior_period",
        "style": "line_overlay"
      }
    },
    {
      "id": "margin_by_category",
      "type": "chart",
      "chart_type": "horizontal_bar",
      "position": { "col": 7, "row": 3, "width": 6, "height": 3 },
      "title": "Margin by Category",
      "data_source": {
        "kpi_id": "kpi_gross_margin_pct",
        "group_by": "product_category",
        "period": "mtd"
      },
      "x_axis": "margin_pct",
      "y_axis": "category",
      "color_coded": true,
      "target_line": 18
    },
    {
      "id": "work_center_status",
      "type": "table",
      "position": { "col": 1, "row": 6, "width": 6, "height": 3 },
      "title": "Work Center Status",
      "columns": [
        { "field": "work_center_name", "label": "Work Center", "width": 150 },
        { "field": "jobs_queued", "label": "Queued", "width": 70, "format": "number" },
        { "field": "jobs_in_progress", "label": "In Progress", "width": 80, "format": "number" },
        { "field": "utilization_pct", "label": "Util %", "width": 70, "format": "percent", "color_coded": true },
        { "field": "operator_name", "label": "Operator", "width": 120 }
      ],
      "data_source": "work_center_status",
      "realtime": true,
      "row_action": { "type": "navigate", "target": "/shop-floor?wc={work_center_id}" }
    },
    {
      "id": "top_customers",
      "type": "table",
      "position": { "col": 7, "row": 6, "width": 6, "height": 3 },
      "title": "Top Customers MTD",
      "columns": [
        { "field": "customer_name", "label": "Customer", "width": 180 },
        { "field": "revenue", "label": "Revenue", "width": 100, "format": "currency" },
        { "field": "margin_pct", "label": "Margin", "width": 80, "format": "percent", "color_coded": true },
        { "field": "orders", "label": "Orders", "width": 70, "format": "number" }
      ],
      "data_source": {
        "type": "aggregate",
        "group_by": "customer",
        "order_by": "revenue DESC",
        "limit": 10
      },
      "row_action": { "type": "navigate", "target": "/customers/{customer_id}" }
    },
    {
      "id": "alerts_panel",
      "type": "alert_list",
      "position": { "col": 1, "row": 9, "width": 12, "height": 2 },
      "title": "Active Alerts",
      "max_items": 5,
      "severity_filter": ["warning", "critical"],
      "actions": [
        { "id": "dismiss", "label": "Dismiss", "icon": "close" },
        { "id": "view", "label": "View", "icon": "open_in_new" }
      ]
    }
  ]
}
```

### Division Manager Dashboard

```json
{
  "id": "division_manager_dashboard",
  "label": "Division Dashboard",
  "app": "analytics_app",
  "roles": ["DIVISION_MANAGER"],
  "scope": "division",
  "refresh_interval_sec": 300,
  "layout": {
    "type": "grid",
    "columns": 12,
    "row_height": 80
  },
  "global_filters": [
    {
      "id": "date_range",
      "type": "date_range_picker",
      "default": "mtd",
      "options": ["today", "wtd", "mtd", "qtd", "ytd", "custom"]
    },
    {
      "id": "location",
      "type": "multi_select",
      "source": "division.locations",
      "default": "all",
      "label": "Locations"
    }
  ],
  "sections": [
    {
      "id": "kpi_cards",
      "type": "kpi_card_row",
      "position": { "col": 1, "row": 1, "width": 12, "height": 1 },
      "cards": [
        {
          "id": "revenue_card",
          "kpi_id": "kpi_revenue_total",
          "size": "large",
          "show_trend": true,
          "show_target": true,
          "target_source": "budget.revenue"
        },
        {
          "id": "profit_card",
          "kpi_id": "kpi_gross_profit",
          "size": "large",
          "show_trend": true,
          "show_target": true
        },
        {
          "id": "margin_card",
          "kpi_id": "kpi_gross_margin_pct",
          "size": "standard",
          "color_coded": true
        },
        {
          "id": "otd_card",
          "kpi_id": "kpi_on_time_delivery",
          "size": "standard",
          "color_coded": true
        },
        {
          "id": "dso_card",
          "kpi_id": "kpi_dso",
          "size": "standard",
          "color_coded": true
        }
      ]
    },
    {
      "id": "location_comparison",
      "type": "table",
      "position": { "col": 1, "row": 2, "width": 12, "height": 3 },
      "title": "Location Performance",
      "columns": [
        { "field": "location_name", "label": "Location", "width": 150, "frozen": true },
        { "field": "revenue", "label": "Revenue", "width": 120, "format": "currency", "sortable": true },
        { "field": "revenue_vs_budget", "label": "vs Budget", "width": 80, "format": "percent_delta", "color_coded": true },
        { "field": "gross_profit", "label": "Profit", "width": 100, "format": "currency", "sortable": true },
        { "field": "margin_pct", "label": "Margin %", "width": 80, "format": "percent", "color_coded": true },
        { "field": "orders", "label": "Orders", "width": 70, "format": "number", "sortable": true },
        { "field": "otd_pct", "label": "OTD %", "width": 70, "format": "percent", "color_coded": true },
        { "field": "late_jobs", "label": "Late", "width": 60, "format": "number", "color": "error_if_nonzero" },
        { "field": "utilization", "label": "Util %", "width": 70, "format": "percent", "color_coded": true }
      ],
      "data_source": "location_performance_summary",
      "row_action": { "type": "navigate", "target": "/analytics/location/{location_id}" },
      "totals_row": true,
      "export": true
    },
    {
      "id": "revenue_trend",
      "type": "chart",
      "chart_type": "line",
      "position": { "col": 1, "row": 5, "width": 8, "height": 3 },
      "title": "Revenue Trend",
      "data_source": {
        "kpi_id": "kpi_revenue_total",
        "group_by": "week",
        "period": "ytd"
      },
      "series": [
        { "field": "revenue", "label": "Actual", "color": "primary" },
        { "field": "budget", "label": "Budget", "color": "grey", "dashed": true },
        { "field": "prior_year", "label": "Prior Year", "color": "secondary", "dashed": true }
      ],
      "annotations": [
        { "type": "target_line", "value": "budget.revenue_mtd", "label": "Budget" }
      ]
    },
    {
      "id": "margin_distribution",
      "type": "chart",
      "chart_type": "pie",
      "position": { "col": 9, "row": 5, "width": 4, "height": 3 },
      "title": "Revenue by Category",
      "data_source": {
        "kpi_id": "kpi_revenue_total",
        "group_by": "product_category",
        "period": "mtd"
      },
      "show_legend": true,
      "show_percentages": true
    },
    {
      "id": "customer_analysis",
      "type": "chart",
      "chart_type": "scatter",
      "position": { "col": 1, "row": 8, "width": 6, "height": 3 },
      "title": "Customer Revenue vs Margin",
      "x_axis": { "field": "revenue", "label": "Revenue" },
      "y_axis": { "field": "margin_pct", "label": "Margin %" },
      "size_axis": { "field": "orders", "label": "Order Count" },
      "data_source": {
        "type": "aggregate",
        "group_by": "customer",
        "period": "mtd"
      },
      "quadrants": [
        { "id": "star", "x_min": "median", "y_min": "median", "color": "success", "label": "Stars" },
        { "id": "review", "x_max": "median", "y_min": "median", "color": "warning", "label": "Review Pricing" },
        { "id": "grow", "x_max": "median", "y_max": "median", "color": "info", "label": "Grow" },
        { "id": "watch", "x_min": "median", "y_max": "median", "color": "error", "label": "Watch" }
      ],
      "click_action": { "type": "drill_down", "target": "customer_detail" }
    },
    {
      "id": "inventory_health",
      "type": "chart",
      "chart_type": "stacked_bar",
      "position": { "col": 7, "row": 8, "width": 6, "height": 3 },
      "title": "Inventory Health by Location",
      "data_source": "inventory_aging_by_location",
      "x_axis": "location",
      "stacks": [
        { "field": "current", "label": "< 90 days", "color": "success" },
        { "field": "aging_90", "label": "90-180 days", "color": "warning" },
        { "field": "aging_180", "label": "180+ days", "color": "error" }
      ]
    },
    {
      "id": "operational_metrics",
      "type": "kpi_card_row",
      "position": { "col": 1, "row": 11, "width": 12, "height": 1 },
      "cards": [
        { "kpi_id": "kpi_inventory_value", "size": "compact" },
        { "kpi_id": "kpi_inventory_turns", "size": "compact", "color_coded": true },
        { "kpi_id": "kpi_slow_moving_pct", "size": "compact", "color_coded": true },
        { "kpi_id": "kpi_ar_outstanding", "size": "compact" },
        { "kpi_id": "kpi_ar_aging_over_60", "size": "compact", "color_coded": true },
        { "kpi_id": "kpi_customer_retention", "size": "compact", "color_coded": true }
      ]
    }
  ]
}
```

### Executive Dashboard

```json
{
  "id": "exec_dashboard",
  "label": "Executive Dashboard",
  "app": "analytics_app",
  "roles": ["ADMIN", "FINANCE"],
  "scope": "company",
  "refresh_interval_sec": 600,
  "layout": {
    "type": "grid",
    "columns": 12,
    "row_height": 80
  },
  "global_filters": [
    {
      "id": "date_range",
      "type": "date_range_picker",
      "default": "ytd",
      "options": ["mtd", "qtd", "ytd", "trailing_12m", "custom"]
    },
    {
      "id": "division",
      "type": "multi_select",
      "source": "divisions",
      "default": "all",
      "label": "Divisions"
    }
  ],
  "sections": [
    {
      "id": "headline_kpis",
      "type": "kpi_card_row",
      "position": { "col": 1, "row": 1, "width": 12, "height": 1 },
      "cards": [
        {
          "id": "revenue",
          "kpi_id": "kpi_revenue_total",
          "size": "hero",
          "show_trend": true,
          "show_target": true,
          "target_source": "budget.revenue_ytd",
          "sparkline": true
        },
        {
          "id": "profit",
          "kpi_id": "kpi_gross_profit",
          "size": "hero",
          "show_trend": true,
          "show_target": true
        },
        {
          "id": "margin",
          "kpi_id": "kpi_gross_margin_pct",
          "size": "large",
          "color_coded": true,
          "gauge": true
        },
        {
          "id": "otd",
          "kpi_id": "kpi_on_time_delivery",
          "size": "large",
          "color_coded": true,
          "gauge": true
        }
      ]
    },
    {
      "id": "division_performance",
      "type": "table",
      "position": { "col": 1, "row": 2, "width": 12, "height": 3 },
      "title": "Division Performance",
      "columns": [
        { "field": "division_name", "label": "Division", "width": 150, "frozen": true },
        { "field": "revenue", "label": "Revenue", "width": 120, "format": "currency" },
        { "field": "revenue_vs_budget", "label": "vs Budget", "width": 90, "format": "percent_delta", "color_coded": true },
        { "field": "revenue_vs_py", "label": "vs PY", "width": 90, "format": "percent_delta", "color_coded": true },
        { "field": "gross_profit", "label": "Profit", "width": 110, "format": "currency" },
        { "field": "margin_pct", "label": "Margin", "width": 80, "format": "percent", "color_coded": true },
        { "field": "inventory_value", "label": "Inventory", "width": 110, "format": "currency" },
        { "field": "inventory_turns", "label": "Turns", "width": 70, "format": "decimal_1" },
        { "field": "dso", "label": "DSO", "width": 60, "format": "days", "color_coded": true }
      ],
      "data_source": "division_performance_summary",
      "totals_row": true,
      "row_action": { "type": "navigate", "target": "/analytics/division/{division_id}" },
      "export": true
    },
    {
      "id": "revenue_by_month",
      "type": "chart",
      "chart_type": "bar",
      "position": { "col": 1, "row": 5, "width": 8, "height": 3 },
      "title": "Monthly Revenue",
      "data_source": {
        "kpi_id": "kpi_revenue_total",
        "group_by": "month",
        "period": "ytd"
      },
      "series": [
        { "field": "revenue", "label": "Actual", "color": "primary" },
        { "field": "budget", "label": "Budget", "color": "grey", "type": "line" }
      ],
      "show_data_labels": true
    },
    {
      "id": "margin_trend",
      "type": "chart",
      "chart_type": "line",
      "position": { "col": 9, "row": 5, "width": 4, "height": 3 },
      "title": "Margin Trend",
      "data_source": {
        "kpi_id": "kpi_gross_margin_pct",
        "group_by": "month",
        "period": "trailing_12m"
      },
      "y_axis_min": 0,
      "y_axis_max": 30,
      "target_line": 18
    },
    {
      "id": "financial_summary",
      "type": "kpi_card_row",
      "position": { "col": 1, "row": 8, "width": 12, "height": 1 },
      "cards": [
        { "kpi_id": "kpi_ar_outstanding", "size": "standard" },
        { "kpi_id": "kpi_ar_aging_over_60", "size": "standard", "color_coded": true },
        { "kpi_id": "kpi_dso", "size": "standard", "color_coded": true },
        { "kpi_id": "kpi_inventory_value", "size": "standard" },
        { "kpi_id": "kpi_inventory_turns", "size": "standard", "color_coded": true }
      ]
    },
    {
      "id": "customer_metrics",
      "type": "kpi_card_row",
      "position": { "col": 1, "row": 9, "width": 12, "height": 1 },
      "cards": [
        { "kpi_id": "kpi_customer_count_active", "size": "standard", "show_trend": true },
        { "kpi_id": "kpi_new_customers", "size": "standard", "show_trend": true },
        { "kpi_id": "kpi_customer_retention", "size": "standard", "color_coded": true },
        { "kpi_id": "kpi_order_value_avg", "size": "standard", "show_trend": true },
        { "kpi_id": "kpi_quote_conversion", "size": "standard", "color_coded": true }
      ]
    },
    {
      "id": "top_customers",
      "type": "table",
      "position": { "col": 1, "row": 10, "width": 6, "height": 3 },
      "title": "Top 10 Customers",
      "columns": [
        { "field": "rank", "label": "#", "width": 40 },
        { "field": "customer_name", "label": "Customer", "width": 180 },
        { "field": "revenue", "label": "Revenue", "width": 110, "format": "currency" },
        { "field": "margin_pct", "label": "Margin", "width": 80, "format": "percent", "color_coded": true }
      ],
      "data_source": {
        "type": "aggregate",
        "group_by": "customer",
        "order_by": "revenue DESC",
        "limit": 10
      }
    },
    {
      "id": "top_products",
      "type": "table",
      "position": { "col": 7, "row": 10, "width": 6, "height": 3 },
      "title": "Top 10 Products",
      "columns": [
        { "field": "rank", "label": "#", "width": 40 },
        { "field": "product_name", "label": "Product", "width": 180 },
        { "field": "revenue", "label": "Revenue", "width": 110, "format": "currency" },
        { "field": "units_sold", "label": "Units", "width": 80, "format": "number" }
      ],
      "data_source": {
        "type": "aggregate",
        "group_by": "product",
        "order_by": "revenue DESC",
        "limit": 10
      }
    }
  ]
}
```

### CSR/Planner Mini-Dashboard

```json
{
  "id": "csr_planner_mini_dashboard",
  "label": "My Dashboard",
  "app": "order_intake_app",
  "roles": ["CSR", "PLANNER"],
  "scope": "user",
  "refresh_interval_sec": 30,
  "layout": {
    "type": "compact",
    "location": "right_sidebar"
  },
  "sections": [
    {
      "id": "personal_stats",
      "type": "kpi_card_column",
      "cards": [
        {
          "id": "my_orders",
          "kpi_id": "kpi_csr_orders_today",
          "size": "compact",
          "label": "My Orders Today",
          "visible_to": ["CSR"],
          "action": { "type": "filter", "target": "orders", "filter": "created_by=me&date=today" }
        },
        {
          "id": "my_jobs",
          "kpi_id": "kpi_planner_jobs_scheduled",
          "size": "compact",
          "label": "Jobs Scheduled Today",
          "visible_to": ["PLANNER"],
          "action": { "type": "filter", "target": "schedule", "filter": "scheduled_by=me&date=today" }
        },
        {
          "id": "orders_count",
          "kpi_id": "kpi_orders_count",
          "size": "compact",
          "label": "Location Orders Today",
          "period": "today"
        },
        {
          "id": "late_jobs",
          "kpi_id": "kpi_jobs_late",
          "size": "alert",
          "label": "Late Jobs",
          "color": "error_if_nonzero",
          "action": { "type": "navigate", "target": "/schedule?filter=late" }
        }
      ]
    },
    {
      "id": "quick_stats",
      "type": "stat_list",
      "items": [
        {
          "id": "jobs_open",
          "kpi_id": "kpi_jobs_open",
          "label": "Open Jobs",
          "icon": "work"
        },
        {
          "id": "shipments",
          "kpi_id": "kpi_shipments_today",
          "label": "Shipping Today",
          "icon": "local_shipping"
        },
        {
          "id": "will_calls",
          "kpi_id": "kpi_will_calls_pending",
          "label": "Will Calls Ready",
          "icon": "store"
        },
        {
          "id": "stock_outs",
          "kpi_id": "kpi_stock_outs",
          "label": "Stock Outs (MTD)",
          "icon": "warning",
          "visible_to": ["CSR"]
        }
      ]
    },
    {
      "id": "alerts",
      "type": "alert_feed",
      "max_items": 3,
      "compact": true,
      "severity_filter": ["warning", "critical"],
      "scope": "user_relevant"
    }
  ]
}
```

### Operator Dashboard Widget

```json
{
  "id": "operator_dashboard_widget",
  "label": "My Stats",
  "app": "shop_floor_app",
  "roles": ["OPERATOR"],
  "scope": "user",
  "refresh_interval_sec": 30,
  "layout": {
    "type": "compact",
    "location": "top_bar"
  },
  "sections": [
    {
      "id": "personal_stats",
      "type": "inline_kpis",
      "cards": [
        {
          "id": "pieces_today",
          "kpi_id": "kpi_operator_pieces_today",
          "size": "mini",
          "label": "Pieces"
        },
        {
          "id": "weight_today",
          "kpi_id": "kpi_operator_weight_today",
          "size": "mini",
          "label": "Weight"
        },
        {
          "id": "jobs_completed",
          "kpi_id": "kpi_jobs_completed_today",
          "size": "mini",
          "label": "Jobs",
          "scope": "user"
        }
      ]
    }
  ]
}
```

### Shipping Dashboard Widget

```json
{
  "id": "shipping_dashboard_widget",
  "label": "Shipping Status",
  "app": "shipping_app",
  "roles": ["SHIPPING"],
  "scope": "location",
  "refresh_interval_sec": 30,
  "layout": {
    "type": "compact",
    "location": "top_bar"
  },
  "sections": [
    {
      "id": "shipping_stats",
      "type": "inline_kpis",
      "cards": [
        {
          "id": "shipments",
          "kpi_id": "kpi_shipments_today",
          "size": "mini",
          "label": "To Ship"
        },
        {
          "id": "receipts",
          "kpi_id": "kpi_receipts_today",
          "size": "mini",
          "label": "To Receive"
        },
        {
          "id": "will_calls",
          "kpi_id": "kpi_will_calls_pending",
          "size": "mini",
          "label": "Will Calls"
        }
      ]
    }
  ]
}
```

---

## 4. alert_conditions

```json
[
  {
    "id": "alert_late_jobs_any",
    "kpi_id": "kpi_jobs_late",
    "threshold": "0",
    "comparison": ">",
    "severity": "warning",
    "surface": ["banner", "toast"],
    "scope": "location",
    "message": "{value} job(s) are past due",
    "action_label": "View Late Jobs",
    "action_target": "/schedule?filter=late",
    "notify_roles": ["PLANNER", "BRANCH_MANAGER"]
  },
  {
    "id": "alert_late_jobs_critical",
    "kpi_id": "kpi_jobs_late",
    "threshold": "5",
    "comparison": ">=",
    "severity": "critical",
    "surface": ["banner", "toast", "email"],
    "scope": "location",
    "message": "CRITICAL: {value} jobs are past due at {location}",
    "action_label": "View Late Jobs",
    "action_target": "/schedule?filter=late",
    "notify_roles": ["BRANCH_MANAGER", "DIVISION_MANAGER"]
  },
  {
    "id": "alert_otd_warning",
    "kpi_id": "kpi_on_time_delivery",
    "threshold": "90",
    "comparison": "<",
    "severity": "warning",
    "surface": ["banner"],
    "scope": "location",
    "period": "mtd",
    "message": "On-time delivery at {value}%, below 90% target",
    "action_label": "View OTD Report",
    "action_target": "/analytics/otd",
    "notify_roles": ["BRANCH_MANAGER"]
  },
  {
    "id": "alert_otd_critical",
    "kpi_id": "kpi_on_time_delivery",
    "threshold": "85",
    "comparison": "<",
    "severity": "critical",
    "surface": ["banner", "email"],
    "scope": "location",
    "period": "mtd",
    "message": "CRITICAL: On-time delivery at {value}%, well below target",
    "action_label": "View OTD Report",
    "action_target": "/analytics/otd",
    "notify_roles": ["BRANCH_MANAGER", "DIVISION_MANAGER"]
  },
  {
    "id": "alert_margin_warning",
    "kpi_id": "kpi_gross_margin_pct",
    "threshold": "15",
    "comparison": "<",
    "severity": "warning",
    "surface": ["banner"],
    "scope": "location",
    "period": "mtd",
    "message": "Gross margin at {value}%, below 15% threshold",
    "action_label": "View Margin Analysis",
    "action_target": "/analytics/margin",
    "notify_roles": ["BRANCH_MANAGER", "FINANCE"]
  },
  {
    "id": "alert_margin_critical",
    "kpi_id": "kpi_gross_margin_pct",
    "threshold": "10",
    "comparison": "<",
    "severity": "critical",
    "surface": ["banner", "email"],
    "scope": "location",
    "period": "mtd",
    "message": "CRITICAL: Gross margin at {value}%, review pricing immediately",
    "action_label": "View Margin Analysis",
    "action_target": "/analytics/margin",
    "notify_roles": ["BRANCH_MANAGER", "DIVISION_MANAGER", "FINANCE"]
  },
  {
    "id": "alert_scrap_warning",
    "kpi_id": "kpi_scrap_rate",
    "threshold": "3",
    "comparison": ">",
    "severity": "warning",
    "surface": ["banner"],
    "scope": "location",
    "period": "wtd",
    "message": "Scrap rate at {value}%, above 3% threshold",
    "action_label": "View Scrap Report",
    "action_target": "/analytics/quality",
    "notify_roles": ["QA_MANAGER", "BRANCH_MANAGER"]
  },
  {
    "id": "alert_scrap_critical",
    "kpi_id": "kpi_scrap_rate",
    "threshold": "5",
    "comparison": ">",
    "severity": "critical",
    "surface": ["banner", "email"],
    "scope": "location",
    "period": "wtd",
    "message": "CRITICAL: Scrap rate at {value}%, immediate investigation required",
    "action_label": "View Scrap Report",
    "action_target": "/analytics/quality",
    "notify_roles": ["QA_MANAGER", "BRANCH_MANAGER", "DIVISION_MANAGER"]
  },
  {
    "id": "alert_utilization_low",
    "kpi_id": "kpi_work_center_utilization",
    "threshold": "60",
    "comparison": "<",
    "severity": "info",
    "surface": ["banner"],
    "scope": "work_center",
    "period": "wtd",
    "message": "{work_center} utilization at {value}%, capacity available",
    "action_label": "View Schedule",
    "action_target": "/schedule?wc={work_center_id}",
    "notify_roles": ["PLANNER"]
  },
  {
    "id": "alert_utilization_overloaded",
    "kpi_id": "kpi_work_center_utilization",
    "threshold": "95",
    "comparison": ">",
    "severity": "warning",
    "surface": ["banner", "toast"],
    "scope": "work_center",
    "period": "day",
    "message": "{work_center} at {value}% utilization, may cause delays",
    "action_label": "Review Load",
    "action_target": "/schedule?wc={work_center_id}",
    "notify_roles": ["PLANNER", "BRANCH_MANAGER"]
  },
  {
    "id": "alert_ar_aging_warning",
    "kpi_id": "kpi_ar_aging_over_60",
    "threshold": "10",
    "comparison": ">",
    "threshold_type": "percent_of_ar",
    "severity": "warning",
    "surface": ["banner"],
    "scope": "division",
    "message": "{value_currency} in AR over 60 days ({pct}% of total)",
    "action_label": "View Aging Report",
    "action_target": "/finance/ar-aging",
    "notify_roles": ["FINANCE", "DIVISION_MANAGER"]
  },
  {
    "id": "alert_dso_warning",
    "kpi_id": "kpi_dso",
    "threshold": "45",
    "comparison": ">",
    "severity": "warning",
    "surface": ["banner"],
    "scope": "division",
    "message": "DSO at {value} days, above 45-day target",
    "action_label": "View AR Report",
    "action_target": "/finance/ar-aging",
    "notify_roles": ["FINANCE", "DIVISION_MANAGER"]
  },
  {
    "id": "alert_dso_critical",
    "kpi_id": "kpi_dso",
    "threshold": "60",
    "comparison": ">",
    "severity": "critical",
    "surface": ["banner", "email"],
    "scope": "division",
    "message": "CRITICAL: DSO at {value} days, collection action required",
    "action_label": "View AR Report",
    "action_target": "/finance/ar-aging",
    "notify_roles": ["FINANCE", "DIVISION_MANAGER", "ADMIN"]
  },
  {
    "id": "alert_slow_moving_warning",
    "kpi_id": "kpi_slow_moving_pct",
    "threshold": "10",
    "comparison": ">",
    "severity": "warning",
    "surface": ["banner"],
    "scope": "location",
    "message": "{value}% of inventory is slow-moving (180+ days)",
    "action_label": "View Slow Movers",
    "action_target": "/inventory?filter=slow_moving",
    "notify_roles": ["PURCHASING", "BRANCH_MANAGER"]
  },
  {
    "id": "alert_slow_moving_critical",
    "kpi_id": "kpi_slow_moving_pct",
    "threshold": "15",
    "comparison": ">",
    "severity": "critical",
    "surface": ["banner", "email"],
    "scope": "location",
    "message": "CRITICAL: {value}% of inventory is slow-moving, action required",
    "action_label": "View Slow Movers",
    "action_target": "/inventory?filter=slow_moving",
    "notify_roles": ["PURCHASING", "BRANCH_MANAGER", "DIVISION_MANAGER"]
  },
  {
    "id": "alert_first_pass_yield_warning",
    "kpi_id": "kpi_first_pass_yield",
    "threshold": "95",
    "comparison": "<",
    "severity": "warning",
    "surface": ["banner"],
    "scope": "location",
    "period": "wtd",
    "message": "First pass yield at {value}%, below 95% target",
    "action_label": "View Quality Report",
    "action_target": "/analytics/quality",
    "notify_roles": ["QA_MANAGER", "BRANCH_MANAGER"]
  },
  {
    "id": "alert_first_pass_yield_critical",
    "kpi_id": "kpi_first_pass_yield",
    "threshold": "90",
    "comparison": "<",
    "severity": "critical",
    "surface": ["banner", "email"],
    "scope": "location",
    "period": "wtd",
    "message": "CRITICAL: First pass yield at {value}%, quality review needed",
    "action_label": "View Quality Report",
    "action_target": "/analytics/quality",
    "notify_roles": ["QA_MANAGER", "BRANCH_MANAGER", "DIVISION_MANAGER"]
  },
  {
    "id": "alert_quote_conversion_low",
    "kpi_id": "kpi_quote_conversion",
    "threshold": "25",
    "comparison": "<",
    "severity": "info",
    "surface": ["banner"],
    "scope": "location",
    "period": "mtd",
    "message": "Quote conversion at {value}%, below 25% threshold",
    "action_label": "View Quote Report",
    "action_target": "/analytics/quotes",
    "notify_roles": ["BRANCH_MANAGER"]
  },
  {
    "id": "alert_lead_time_warning",
    "kpi_id": "kpi_avg_lead_time",
    "threshold": "5",
    "comparison": ">",
    "severity": "warning",
    "surface": ["banner"],
    "scope": "location",
    "period": "wtd",
    "message": "Average lead time at {value} days, above 5-day target",
    "action_label": "View Operations Report",
    "action_target": "/analytics/operations",
    "notify_roles": ["PLANNER", "BRANCH_MANAGER"]
  },
  {
    "id": "alert_lead_time_critical",
    "kpi_id": "kpi_avg_lead_time",
    "threshold": "7",
    "comparison": ">",
    "severity": "critical",
    "surface": ["banner", "email"],
    "scope": "location",
    "period": "wtd",
    "message": "CRITICAL: Average lead time at {value} days, customer impact likely",
    "action_label": "View Operations Report",
    "action_target": "/analytics/operations",
    "notify_roles": ["PLANNER", "BRANCH_MANAGER", "DIVISION_MANAGER"]
  },
  {
    "id": "alert_price_override_high",
    "kpi_id": "kpi_price_override_count",
    "threshold": "20",
    "comparison": ">",
    "severity": "info",
    "surface": ["banner"],
    "scope": "location",
    "period": "day",
    "message": "{value} price overrides today, review for patterns",
    "action_label": "View Override Log",
    "action_target": "/analytics/pricing",
    "notify_roles": ["BRANCH_MANAGER", "FINANCE"]
  },
  {
    "id": "alert_inventory_turns_low",
    "kpi_id": "kpi_inventory_turns",
    "threshold": "4",
    "comparison": "<",
    "severity": "warning",
    "surface": ["banner"],
    "scope": "location",
    "period": "quarter",
    "message": "Inventory turns at {value}, below 4x target",
    "action_label": "View Inventory Analysis",
    "action_target": "/analytics/inventory",
    "notify_roles": ["PURCHASING", "BRANCH_MANAGER", "FINANCE"]
  },
  {
    "id": "alert_customer_retention_low",
    "kpi_id": "kpi_customer_retention",
    "threshold": "75",
    "comparison": "<",
    "severity": "warning",
    "surface": ["banner", "email"],
    "scope": "division",
    "period": "quarter",
    "message": "Customer retention at {value}%, below 75% threshold",
    "action_label": "View Customer Analysis",
    "action_target": "/analytics/customers",
    "notify_roles": ["BRANCH_MANAGER", "DIVISION_MANAGER"]
  }
]
```

---

## 5. Alert Severity Definitions

| Severity | Color | Icon | Banner Style | Toast Duration | Email |
|----------|-------|------|--------------|----------------|-------|
| info | blue | info | subtle | 5s | never |
| warning | orange | warning | standard | 8s | optional |
| critical | red | error | prominent | persistent | always |

---

## 6. Dashboard Refresh Behavior

| Dashboard Type | Refresh Interval | Realtime KPIs | Background Refresh |
|----------------|------------------|---------------|-------------------|
| exec_dashboard | 10 min | none | yes |
| division_manager_dashboard | 5 min | none | yes |
| branch_manager_dashboard | 1 min | jobs_open, jobs_completed, shipments | yes |
| csr_planner_mini_dashboard | 30 sec | late_jobs | yes |
| operator_dashboard_widget | 30 sec | all | yes |
| shipping_dashboard_widget | 30 sec | all | yes |

---

*Document generated for Build Phase: Analytics Dashboards*
