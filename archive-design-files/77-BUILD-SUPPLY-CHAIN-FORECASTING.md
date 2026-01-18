# 77-BUILD-SUPPLY-CHAIN-FORECASTING

> UI + data model for demand, stocking, transfer, pricing, and supplier lead time forecasting.

---

## 1. forecast_targets

```json
[
  {
    "target_id": "material_demand",
    "entity": "Material",
    "granularity": ["material_type", "grade", "form"],
    "dimensions": ["time", "location", "customer_segment"],
    "horizons": ["7d", "30d", "90d", "365d"],
    "refresh_frequency": "daily",
    "primary_metric": "quantity_lbs",
    "secondary_metrics": ["order_count", "revenue"],
    "data_sources": ["order_history", "quote_history", "rfq_history", "commodity_trends"],
    "seasonality": true,
    "trend_detection": true
  },
  {
    "target_id": "sku_demand",
    "entity": "SKU",
    "granularity": ["product_id", "variant_id"],
    "dimensions": ["time", "location", "customer", "channel"],
    "horizons": ["7d", "30d", "90d"],
    "refresh_frequency": "daily",
    "primary_metric": "quantity_units",
    "secondary_metrics": ["quantity_lbs", "revenue", "margin"],
    "data_sources": ["order_history", "quote_conversion", "inventory_velocity", "substitute_patterns"],
    "seasonality": true,
    "trend_detection": true
  },
  {
    "target_id": "customer_demand",
    "entity": "Customer",
    "granularity": ["customer_id", "customer_tier", "industry"],
    "dimensions": ["time", "product_category", "location"],
    "horizons": ["30d", "90d", "365d"],
    "refresh_frequency": "weekly",
    "primary_metric": "revenue",
    "secondary_metrics": ["quantity_lbs", "order_count", "margin"],
    "data_sources": ["order_history", "quote_history", "contract_schedule", "customer_signals"],
    "seasonality": true,
    "trend_detection": true,
    "churn_risk": true
  },
  {
    "target_id": "division_demand",
    "entity": "Division",
    "granularity": ["division_id", "product_category"],
    "dimensions": ["time", "location", "customer_segment"],
    "horizons": ["30d", "90d", "365d"],
    "refresh_frequency": "weekly",
    "primary_metric": "revenue",
    "secondary_metrics": ["quantity_lbs", "margin_percent", "capacity_utilization"],
    "data_sources": ["order_history", "market_data", "commodity_indices", "competitor_intel"],
    "seasonality": true,
    "trend_detection": true
  },
  {
    "target_id": "location_demand",
    "entity": "Location",
    "granularity": ["location_id", "region"],
    "dimensions": ["time", "product_category", "customer_segment"],
    "horizons": ["7d", "30d", "90d"],
    "refresh_frequency": "daily",
    "primary_metric": "throughput_lbs",
    "secondary_metrics": ["order_count", "capacity_utilization", "inventory_turns"],
    "data_sources": ["order_history", "shipment_history", "capacity_schedule", "regional_trends"],
    "seasonality": true,
    "trend_detection": true
  },
  {
    "target_id": "supplier_lead_time",
    "entity": "Supplier",
    "granularity": ["supplier_id", "product_category", "order_size_bucket"],
    "dimensions": ["time", "season"],
    "horizons": ["current", "30d", "90d"],
    "refresh_frequency": "weekly",
    "primary_metric": "lead_time_days",
    "secondary_metrics": ["on_time_rate", "quality_rate", "price_trend"],
    "data_sources": ["po_history", "receipt_history", "supplier_capacity", "market_conditions"],
    "seasonality": true,
    "trend_detection": true
  },
  {
    "target_id": "commodity_price",
    "entity": "Commodity",
    "granularity": ["commodity_type", "grade"],
    "dimensions": ["time"],
    "horizons": ["7d", "30d", "90d"],
    "refresh_frequency": "daily",
    "primary_metric": "price_per_unit",
    "secondary_metrics": ["volatility", "trend_direction", "confidence_band"],
    "data_sources": ["market_feeds", "historical_prices", "economic_indicators", "supplier_quotes"],
    "seasonality": true,
    "trend_detection": true
  }
]
```

---

## 2. forecasting_models

```json
{
  "demand_model": {
    "model_id": "demand_forecast_v1",
    "description": "Predicts demand at material, SKU, customer, division, location levels",
    "algorithms": [
      {
        "name": "time_series_ensemble",
        "components": ["prophet", "xgboost", "lstm"],
        "weighting": "dynamic_blend",
        "use_case": "base_demand"
      },
      {
        "name": "regression_features",
        "components": ["linear", "gradient_boost"],
        "features": ["seasonality", "trend", "promotions", "economic_indicators"],
        "use_case": "feature_adjustment"
      },
      {
        "name": "clustering",
        "components": ["kmeans", "dbscan"],
        "use_case": "demand_pattern_grouping"
      }
    ],
    "inputs": {
      "historical_orders": { "window": "3y", "granularity": "daily" },
      "historical_quotes": { "window": "2y", "conversion_rate": true },
      "seasonality_calendar": { "holidays": true, "industry_events": true },
      "economic_indicators": { "sources": ["manufacturing_pmi", "construction_starts", "steel_production_index"] },
      "customer_signals": { "types": ["forecast_shares", "contract_schedules", "blanket_orders"] }
    },
    "outputs": {
      "point_forecast": { "granularity": "daily", "horizons": ["7d", "30d", "90d", "365d"] },
      "confidence_intervals": { "levels": [0.5, 0.8, 0.95] },
      "trend_component": { "direction": "up|down|flat", "strength": "number" },
      "seasonality_component": { "weekly": true, "monthly": true, "annual": true },
      "anomaly_flags": { "threshold": 2.5, "type": "z_score" }
    },
    "accuracy_metrics": {
      "mape": { "target": "<15%", "window": "30d" },
      "bias": { "target": "<5%", "window": "30d" },
      "tracking_signal": { "threshold": 4 }
    },
    "retraining": {
      "frequency": "weekly",
      "trigger": "accuracy_degradation OR data_drift",
      "validation_holdout": "14d"
    }
  },
  "supply_model": {
    "model_id": "supply_forecast_v1",
    "description": "Predicts supplier lead times, availability, and pricing trends",
    "algorithms": [
      {
        "name": "lead_time_regression",
        "components": ["quantile_regression", "random_forest"],
        "outputs": ["p10", "p50", "p90"],
        "use_case": "lead_time_prediction"
      },
      {
        "name": "availability_classifier",
        "components": ["logistic_regression", "gradient_boost"],
        "outputs": ["available", "constrained", "unavailable"],
        "use_case": "supply_risk"
      },
      {
        "name": "price_trend",
        "components": ["arima", "prophet"],
        "outputs": ["forecast_price", "direction", "volatility"],
        "use_case": "pricing_intelligence"
      }
    ],
    "inputs": {
      "po_history": { "window": "2y", "fields": ["supplier", "product", "quantity", "requested_date", "received_date", "price"] },
      "supplier_performance": { "metrics": ["otd_rate", "quality_rate", "fill_rate"] },
      "market_conditions": { "sources": ["commodity_indices", "capacity_utilization", "economic_indicators"] },
      "supplier_capacity": { "sources": ["supplier_portals", "relationship_data"] }
    },
    "outputs": {
      "lead_time_forecast": { "granularity": "supplier+product", "quantiles": [0.1, 0.5, 0.9] },
      "availability_score": { "range": [0, 1], "thresholds": { "green": ">0.8", "yellow": "0.5-0.8", "red": "<0.5" } },
      "price_forecast": { "horizons": ["30d", "90d"], "confidence": true },
      "risk_alerts": { "types": ["lead_time_increase", "capacity_constraint", "price_spike"] }
    },
    "accuracy_metrics": {
      "lead_time_mae": { "target": "<3 days" },
      "availability_accuracy": { "target": ">85%" }
    }
  },
  "transfer_model": {
    "model_id": "transfer_optimizer_v1",
    "description": "Recommends inter-location inventory transfers",
    "algorithms": [
      {
        "name": "imbalance_detector",
        "components": ["threshold_rules", "anomaly_detection"],
        "use_case": "identify_transfer_opportunities"
      },
      {
        "name": "transfer_optimizer",
        "components": ["milp_solver", "greedy_heuristic"],
        "use_case": "optimize_transfer_plan"
      },
      {
        "name": "demand_netting",
        "components": ["demand_forecast", "inventory_projection"],
        "use_case": "net_requirements"
      }
    ],
    "inputs": {
      "inventory_levels": { "real_time": true, "by_location": true },
      "demand_forecast": { "source": "demand_model", "horizon": "30d" },
      "in_transit": { "po_receipts": true, "transfers": true },
      "transfer_costs": { "freight_matrix": true, "handling_costs": true },
      "location_capacity": { "storage": true, "processing": true }
    },
    "outputs": {
      "transfer_recommendations": {
        "fields": ["from_location", "to_location", "product", "quantity", "urgency", "reason", "cost_benefit"]
      },
      "network_balance_score": { "range": [0, 1] },
      "projected_stockouts_prevented": { "by_location": true },
      "cost_impact": { "transfer_cost": true, "stockout_cost_avoided": true }
    },
    "constraints": {
      "min_transfer_qty": "configurable",
      "max_transfers_per_day": "by_location",
      "lead_time_buffer": "3d"
    },
    "optimization_objective": "minimize(stockout_risk + transfer_cost) subject_to(service_level >= target)"
  },
  "risk_model": {
    "model_id": "supply_chain_risk_v1",
    "description": "Identifies and quantifies supply chain risks",
    "algorithms": [
      {
        "name": "stockout_risk",
        "components": ["monte_carlo", "demand_distribution"],
        "use_case": "stockout_probability"
      },
      {
        "name": "supplier_risk",
        "components": ["weighted_scorecard", "trend_detection"],
        "use_case": "supplier_reliability"
      },
      {
        "name": "capacity_risk",
        "components": ["simulation", "bottleneck_detection"],
        "use_case": "processing_capacity"
      }
    ],
    "inputs": {
      "demand_forecast": { "with_uncertainty": true },
      "inventory_levels": { "real_time": true },
      "supplier_performance": { "historical": true },
      "capacity_schedule": { "by_work_center": true },
      "external_factors": { "weather": true, "economic": true, "geopolitical": true }
    },
    "outputs": {
      "stockout_probability": { "by_sku_location": true, "horizon": ["7d", "30d"] },
      "supplier_risk_score": { "by_supplier": true, "components": ["financial", "operational", "quality"] },
      "capacity_risk": { "by_location": true, "by_work_center": true },
      "aggregate_risk_index": { "range": [0, 100], "thresholds": { "low": "<30", "medium": "30-60", "high": ">60" } }
    },
    "alerts": {
      "stockout_imminent": { "threshold": "probability > 50% within 7d" },
      "supplier_degradation": { "threshold": "score drop > 20%" },
      "capacity_overload": { "threshold": "utilization > 95% for > 3d" }
    }
  },
  "pricing_window_model": {
    "model_id": "pricing_window_v1",
    "description": "Identifies optimal pricing windows based on cost/demand forecasts",
    "algorithms": [
      {
        "name": "cost_trend",
        "components": ["commodity_forecast", "supplier_price_trend"],
        "use_case": "input_cost_projection"
      },
      {
        "name": "demand_elasticity",
        "components": ["price_response_model", "historical_analysis"],
        "use_case": "price_sensitivity"
      },
      {
        "name": "margin_optimizer",
        "components": ["constrained_optimization"],
        "use_case": "margin_maximization"
      }
    ],
    "inputs": {
      "commodity_prices": { "current": true, "forecast": true },
      "supplier_pricing": { "contracts": true, "spot": true },
      "demand_elasticity": { "by_customer_tier": true, "by_product": true },
      "competitor_intel": { "price_surveys": true, "market_share": true },
      "inventory_position": { "cost_basis": true, "age": true }
    },
    "outputs": {
      "price_recommendations": {
        "fields": ["product", "customer_tier", "recommended_price", "floor_price", "ceiling_price", "confidence", "valid_until"]
      },
      "cost_trend_forecast": { "horizon": "90d", "direction": "up|down|stable" },
      "margin_impact": { "current_vs_recommended": true },
      "pricing_windows": {
        "fields": ["start_date", "end_date", "action", "reason", "expected_impact"]
      }
    },
    "constraints": {
      "floor_margin_percent": "configurable",
      "max_increase_percent": "per_period",
      "contract_respect": true
    }
  }
}
```

---

## 3. forecasting_UI

```json
{
  "forecasting_dashboard": {
    "id": "forecast_hub",
    "route": "/forecasting",
    "title": "Supply Chain Forecasting",
    "layout": "dashboard_grid",
    "children": [
      {
        "id": "header_bar",
        "type": "PageHeader",
        "children": [
          { "id": "title", "type": "Typography", "variant": "h4", "text": "Forecasting Hub" },
          { "id": "refresh_indicator", "type": "RefreshIndicator", "lastUpdated": "timestamp" },
          { "id": "horizon_selector", "type": "ToggleButtonGroup", "options": ["7d", "30d", "90d", "365d"] },
          { "id": "entity_filter", "type": "MultiSelect", "options": ["Material", "SKU", "Customer", "Division", "Location"] }
        ]
      },
      {
        "id": "kpi_row",
        "type": "Grid",
        "columns": 5,
        "children": [
          {
            "id": "forecast_accuracy",
            "type": "KPICard",
            "props": { "title": "Forecast Accuracy", "metric": "mape_percent", "target": 15, "inverse": true, "trend": true }
          },
          {
            "id": "stockout_risk",
            "type": "KPICard",
            "props": { "title": "Stockout Risk", "metric": "high_risk_skus", "threshold": 10, "inverse": true, "link": "/forecasting/risks" }
          },
          {
            "id": "transfer_opportunities",
            "type": "KPICard",
            "props": { "title": "Transfer Opportunities", "metric": "pending_transfers", "actionable": true, "link": "/forecasting/transfers" }
          },
          {
            "id": "price_alerts",
            "type": "KPICard",
            "props": { "title": "Pricing Alerts", "metric": "price_action_count", "link": "/forecasting/pricing" }
          },
          {
            "id": "supplier_risk",
            "type": "KPICard",
            "props": { "title": "Supplier Risk", "metric": "at_risk_suppliers", "threshold": 5, "inverse": true, "link": "/forecasting/suppliers" }
          }
        ]
      },
      {
        "id": "main_content",
        "type": "Grid",
        "columns": 12,
        "children": [
          {
            "id": "demand_chart_panel",
            "type": "Paper",
            "gridSpan": 8,
            "children": [
              { "id": "panel_header", "type": "PanelHeader", "title": "Demand Forecast", "actions": ["Export", "Drill Down"] },
              {
                "id": "demand_chart",
                "type": "ForecastChart",
                "props": {
                  "chartType": "area",
                  "series": [
                    { "name": "Actual", "type": "line", "color": "primary" },
                    { "name": "Forecast", "type": "area", "color": "secondary", "opacity": 0.3 },
                    { "name": "Upper Bound", "type": "line", "dashed": true, "color": "grey" },
                    { "name": "Lower Bound", "type": "line", "dashed": true, "color": "grey" }
                  ],
                  "xAxis": "date",
                  "yAxis": "quantity_lbs",
                  "confidenceBand": true,
                  "annotations": ["anomalies", "events"]
                }
              },
              {
                "id": "forecast_controls",
                "type": "Stack",
                "direction": "row",
                "children": [
                  { "id": "granularity", "type": "Select", "options": ["Daily", "Weekly", "Monthly"] },
                  { "id": "dimension", "type": "Select", "options": ["Total", "By Location", "By Division", "By Product Category"] },
                  { "id": "confidence", "type": "Select", "options": ["50%", "80%", "95%"] }
                ]
              }
            ]
          },
          {
            "id": "confidence_panel",
            "type": "Paper",
            "gridSpan": 4,
            "children": [
              { "id": "panel_header", "type": "PanelHeader", "title": "Forecast Confidence" },
              {
                "id": "confidence_gauge",
                "type": "GaugeChart",
                "props": {
                  "value": "overall_confidence",
                  "ranges": [
                    { "label": "Low", "min": 0, "max": 60, "color": "error" },
                    { "label": "Medium", "min": 60, "max": 80, "color": "warning" },
                    { "label": "High", "min": 80, "max": 100, "color": "success" }
                  ]
                }
              },
              {
                "id": "confidence_breakdown",
                "type": "List",
                "items": [
                  { "label": "Demand Model", "value": "demand_confidence" },
                  { "label": "Supply Model", "value": "supply_confidence" },
                  { "label": "Data Quality", "value": "data_quality_score" }
                ]
              }
            ]
          }
        ]
      },
      {
        "id": "actions_section",
        "type": "Grid",
        "columns": 12,
        "children": [
          {
            "id": "recommended_actions",
            "type": "Paper",
            "gridSpan": 6,
            "children": [
              { "id": "panel_header", "type": "PanelHeader", "title": "Recommended Actions", "badge": "action_count" },
              {
                "id": "action_list",
                "type": "ActionList",
                "props": {
                  "groupBy": "action_type",
                  "sortBy": "priority",
                  "itemTemplate": {
                    "icon": "action_type_icon",
                    "primary": "action_summary",
                    "secondary": "impact_description",
                    "chip": { "label": "priority", "color": "priority_color" },
                    "actions": ["Accept", "Dismiss", "Details"]
                  }
                }
              },
              {
                "id": "bulk_actions",
                "type": "ButtonGroup",
                "buttons": [
                  { "label": "Accept All High Priority", "variant": "contained" },
                  { "label": "Review in Detail", "variant": "outlined" }
                ]
              }
            ]
          },
          {
            "id": "risk_heatmap",
            "type": "Paper",
            "gridSpan": 6,
            "children": [
              { "id": "panel_header", "type": "PanelHeader", "title": "Risk Heatmap" },
              {
                "id": "heatmap_chart",
                "type": "Heatmap",
                "props": {
                  "xAxis": "location",
                  "yAxis": "product_category",
                  "value": "risk_score",
                  "colorScale": ["#4CAF50", "#FFEB3B", "#FF5722"],
                  "tooltip": ["stockout_risk", "days_of_supply", "demand_trend"],
                  "onClick": "drill_to_detail"
                }
              }
            ]
          }
        ]
      }
    ]
  },
  "demand_detail_view": {
    "id": "demand_detail",
    "route": "/forecasting/demand/:entity_type/:entity_id",
    "title": "Demand Detail",
    "layout": "master_detail",
    "children": [
      {
        "id": "breadcrumb",
        "type": "Breadcrumbs",
        "items": ["Forecasting", "Demand", "{entity_type}", "{entity_id}"]
      },
      {
        "id": "entity_header",
        "type": "EntityHeader",
        "fields": ["name", "category", "location", "last_forecast_date"]
      },
      {
        "id": "tabs",
        "type": "Tabs",
        "tabs": [
          {
            "id": "forecast_tab",
            "label": "Forecast",
            "children": [
              { "id": "forecast_chart", "type": "ForecastChart", "detailed": true },
              { "id": "decomposition", "type": "DecompositionChart", "components": ["trend", "seasonality", "residual"] },
              { "id": "forecast_table", "type": "DataTable", "columns": ["date", "forecast", "lower", "upper", "actual", "error"] }
            ]
          },
          {
            "id": "drivers_tab",
            "label": "Drivers",
            "children": [
              { "id": "feature_importance", "type": "BarChart", "horizontal": true },
              { "id": "correlation_matrix", "type": "Heatmap" },
              { "id": "external_factors", "type": "TimeSeriesComparison" }
            ]
          },
          {
            "id": "accuracy_tab",
            "label": "Accuracy",
            "children": [
              { "id": "accuracy_over_time", "type": "LineChart", "metrics": ["mape", "bias"] },
              { "id": "forecast_vs_actual", "type": "ScatterPlot" },
              { "id": "error_distribution", "type": "Histogram" }
            ]
          },
          {
            "id": "actions_tab",
            "label": "Actions",
            "children": [
              { "id": "related_actions", "type": "ActionList", "filtered": true },
              { "id": "action_history", "type": "Timeline" }
            ]
          }
        ]
      }
    ]
  },
  "transfer_recommendation_view": {
    "id": "transfer_recommendations",
    "route": "/forecasting/transfers",
    "title": "Transfer Recommendations",
    "layout": "list_detail",
    "children": [
      {
        "id": "header",
        "type": "PageHeader",
        "title": "Inventory Transfer Recommendations",
        "actions": ["Refresh", "Export", "Bulk Accept"]
      },
      {
        "id": "filters",
        "type": "FilterBar",
        "filters": [
          { "id": "urgency", "type": "chips", "options": ["Critical", "High", "Medium", "Low"] },
          { "id": "from_location", "type": "multiselect" },
          { "id": "to_location", "type": "multiselect" },
          { "id": "product_category", "type": "multiselect" }
        ]
      },
      {
        "id": "network_map",
        "type": "NetworkFlowMap",
        "props": {
          "nodes": "locations",
          "edges": "recommended_transfers",
          "nodeSize": "inventory_level",
          "edgeWidth": "transfer_quantity",
          "edgeColor": "urgency"
        }
      },
      {
        "id": "transfer_table",
        "type": "DataTable",
        "columns": [
          { "field": "product", "header": "Product", "sortable": true },
          { "field": "from_location", "header": "From", "sortable": true },
          { "field": "to_location", "header": "To", "sortable": true },
          { "field": "quantity", "header": "Qty", "type": "number" },
          { "field": "urgency", "header": "Urgency", "type": "chip" },
          { "field": "reason", "header": "Reason" },
          { "field": "cost_benefit", "header": "Cost/Benefit", "type": "currency" },
          { "field": "actions", "header": "Actions", "type": "actions", "buttons": ["Accept", "Modify", "Reject"] }
        ],
        "rowExpand": {
          "details": ["demand_at_destination", "supply_at_source", "stockout_risk_change"]
        }
      }
    ]
  },
  "pricing_window_view": {
    "id": "pricing_windows",
    "route": "/forecasting/pricing",
    "title": "Pricing Windows",
    "layout": "dashboard",
    "children": [
      {
        "id": "header",
        "type": "PageHeader",
        "title": "Pricing Intelligence",
        "actions": ["Export", "Configure Alerts"]
      },
      {
        "id": "commodity_trends",
        "type": "Paper",
        "children": [
          { "id": "panel_header", "type": "PanelHeader", "title": "Commodity Price Trends" },
          {
            "id": "commodity_chart",
            "type": "MultiLineChart",
            "props": {
              "series": "commodities",
              "xAxis": "date",
              "yAxis": "price_index",
              "forecast": true,
              "annotations": ["price_events"]
            }
          }
        ]
      },
      {
        "id": "pricing_actions",
        "type": "Paper",
        "children": [
          { "id": "panel_header", "type": "PanelHeader", "title": "Recommended Pricing Actions" },
          {
            "id": "pricing_table",
            "type": "DataTable",
            "columns": [
              { "field": "product_category", "header": "Category" },
              { "field": "action", "header": "Action", "type": "chip" },
              { "field": "current_price", "header": "Current", "type": "currency" },
              { "field": "recommended_price", "header": "Recommended", "type": "currency" },
              { "field": "change_percent", "header": "Change", "type": "percent" },
              { "field": "window_end", "header": "Act By" },
              { "field": "reason", "header": "Reason" },
              { "field": "confidence", "header": "Confidence", "type": "progress" }
            ]
          }
        ]
      },
      {
        "id": "margin_simulator",
        "type": "Paper",
        "children": [
          { "id": "panel_header", "type": "PanelHeader", "title": "Margin Simulator" },
          {
            "id": "simulator_form",
            "type": "Form",
            "fields": [
              { "id": "price_adjustment", "type": "slider", "range": [-20, 20], "unit": "%" },
              { "id": "volume_impact", "type": "display", "computed": true },
              { "id": "margin_impact", "type": "display", "computed": true }
            ]
          }
        ]
      }
    ]
  },
  "supplier_risk_view": {
    "id": "supplier_risk",
    "route": "/forecasting/suppliers",
    "title": "Supplier Risk Analysis",
    "layout": "master_detail",
    "children": [
      {
        "id": "risk_summary",
        "type": "Paper",
        "children": [
          { "id": "panel_header", "type": "PanelHeader", "title": "Supplier Risk Overview" },
          {
            "id": "risk_matrix",
            "type": "ScatterPlot",
            "props": {
              "xAxis": { "field": "impact", "label": "Business Impact" },
              "yAxis": { "field": "probability", "label": "Risk Probability" },
              "size": "spend_volume",
              "color": "risk_category",
              "label": "supplier_name",
              "quadrants": ["Watch", "Monitor", "Action Required", "Critical"]
            }
          }
        ]
      },
      {
        "id": "supplier_table",
        "type": "DataTable",
        "columns": [
          { "field": "supplier_name", "header": "Supplier" },
          { "field": "risk_score", "header": "Risk Score", "type": "progress" },
          { "field": "lead_time_trend", "header": "Lead Time Trend", "type": "trend" },
          { "field": "quality_trend", "header": "Quality Trend", "type": "trend" },
          { "field": "spend_30d", "header": "30d Spend", "type": "currency" },
          { "field": "alternatives", "header": "Alternatives", "type": "number" }
        ],
        "rowClick": "open_detail_panel"
      }
    ]
  }
}
```

---

## 4. action_hooks

```json
{
  "inventory_hooks": {
    "reorder_trigger": {
      "trigger_id": "forecast_reorder",
      "source": "demand_model + risk_model",
      "condition": "projected_stockout_days < safety_stock_days",
      "action": "create_reorder_suggestion",
      "target_entity": "PurchaseRequisition",
      "payload": {
        "product_id": "from_forecast",
        "supplier_id": "preferred_supplier",
        "quantity": "economic_order_qty",
        "required_date": "calculated_from_lead_time",
        "urgency": "calculated_from_stockout_risk",
        "forecast_reference": "forecast_id"
      },
      "approval_required": true,
      "roles_notified": ["PURCHASING", "INVENTORY"]
    },
    "transfer_trigger": {
      "trigger_id": "forecast_transfer",
      "source": "transfer_model",
      "condition": "network_imbalance_score > threshold",
      "action": "create_transfer_suggestion",
      "target_entity": "TransferOrder",
      "payload": {
        "from_location_id": "from_model",
        "to_location_id": "from_model",
        "product_id": "from_model",
        "quantity": "optimized_qty",
        "reason_code": "demand_balancing|stockout_prevention|excess_redistribution",
        "cost_estimate": "calculated"
      },
      "approval_required": true,
      "roles_notified": ["INVENTORY", "BRANCH_MANAGER"]
    },
    "safety_stock_update": {
      "trigger_id": "safety_stock_recalc",
      "source": "demand_model + supply_model",
      "condition": "demand_volatility_change > 20% OR lead_time_change > 15%",
      "action": "update_safety_stock",
      "target_entity": "InventoryPolicy",
      "payload": {
        "product_id": "affected_product",
        "location_id": "affected_location",
        "new_safety_stock": "recalculated",
        "new_reorder_point": "recalculated",
        "rationale": "model_explanation"
      },
      "approval_required": true,
      "roles_notified": ["INVENTORY", "DIVISION_MANAGER"]
    }
  },
  "pricing_hooks": {
    "price_adjustment": {
      "trigger_id": "forecast_price_adjust",
      "source": "pricing_window_model",
      "condition": "cost_trend_significant OR margin_below_target",
      "action": "create_pricing_suggestion",
      "target_entity": "PriceListDraft",
      "payload": {
        "product_category": "affected_category",
        "recommended_changes": "array_of_price_updates",
        "effective_date": "suggested_date",
        "expiration_date": "window_end",
        "rationale": "model_explanation",
        "margin_impact": "calculated"
      },
      "approval_required": true,
      "roles_notified": ["PRICING", "DIVISION_MANAGER"]
    },
    "quote_guidance": {
      "trigger_id": "forecast_quote_guide",
      "source": "pricing_window_model + supply_model",
      "condition": "quote_being_created",
      "action": "inject_pricing_guidance",
      "target_screen": "quote_builder",
      "payload": {
        "recommended_price": "model_price",
        "floor_price": "margin_floor",
        "ceiling_price": "market_ceiling",
        "cost_trend": "up|down|stable",
        "lead_time_adjustment": "if_supply_constrained",
        "confidence": "model_confidence"
      },
      "approval_required": false,
      "inline_display": true
    },
    "commodity_alert": {
      "trigger_id": "commodity_price_alert",
      "source": "pricing_window_model",
      "condition": "commodity_price_change > threshold OR volatility_spike",
      "action": "send_alert",
      "target_entity": "Alert",
      "payload": {
        "commodity": "affected_commodity",
        "change_percent": "calculated",
        "direction": "up|down",
        "forecast_next_30d": "predicted_direction",
        "recommended_action": "buy_now|wait|hedge"
      },
      "approval_required": false,
      "roles_notified": ["PURCHASING", "PRICING", "DIVISION_MANAGER"]
    }
  },
  "planning_hooks": {
    "capacity_alert": {
      "trigger_id": "forecast_capacity_alert",
      "source": "demand_model",
      "condition": "forecasted_demand > available_capacity",
      "action": "create_capacity_alert",
      "target_entity": "CapacityAlert",
      "payload": {
        "location_id": "affected_location",
        "work_center_id": "affected_work_center",
        "period": "overloaded_period",
        "demand_hours": "forecasted",
        "capacity_hours": "available",
        "gap_hours": "calculated",
        "recommendations": ["overtime", "shift_add", "outsource", "reschedule"]
      },
      "approval_required": false,
      "roles_notified": ["PLANNER", "BRANCH_MANAGER"]
    },
    "demand_shift_alert": {
      "trigger_id": "demand_shift_detected",
      "source": "demand_model",
      "condition": "forecast_revision_significant",
      "action": "create_planning_alert",
      "target_entity": "PlanningAlert",
      "payload": {
        "entity_type": "customer|product|division",
        "entity_id": "affected_entity",
        "previous_forecast": "last_forecast",
        "new_forecast": "current_forecast",
        "change_percent": "calculated",
        "planning_impact": "calculated"
      },
      "approval_required": false,
      "roles_notified": ["PLANNER", "CSR"]
    },
    "schedule_recommendation": {
      "trigger_id": "forecast_schedule_recommend",
      "source": "demand_model + risk_model",
      "condition": "high_priority_demand_forecasted",
      "action": "suggest_schedule_adjustment",
      "target_screen": "schedule_board",
      "payload": {
        "affected_jobs": "array_of_jobs",
        "recommended_changes": "array_of_adjustments",
        "rationale": "demand_or_risk_explanation",
        "service_level_impact": "calculated"
      },
      "approval_required": true,
      "inline_display": true
    }
  },
  "customer_hooks": {
    "customer_demand_alert": {
      "trigger_id": "customer_demand_shift",
      "source": "demand_model",
      "condition": "customer_forecast_change > 30%",
      "action": "create_customer_alert",
      "target_entity": "CustomerAlert",
      "payload": {
        "customer_id": "affected_customer",
        "direction": "increase|decrease",
        "change_percent": "calculated",
        "period": "affected_period",
        "recommended_action": "proactive_contact|prepare_capacity|review_pricing"
      },
      "approval_required": false,
      "roles_notified": ["CSR", "BRANCH_MANAGER"]
    },
    "churn_risk_alert": {
      "trigger_id": "customer_churn_risk",
      "source": "demand_model",
      "condition": "customer_demand_declining AND engagement_dropping",
      "action": "create_churn_alert",
      "target_entity": "CustomerAlert",
      "payload": {
        "customer_id": "at_risk_customer",
        "churn_probability": "calculated",
        "risk_factors": ["order_decline", "quote_rejection_increase", "competitor_intel"],
        "recommended_actions": ["executive_outreach", "pricing_review", "service_improvement"]
      },
      "approval_required": false,
      "roles_notified": ["CSR", "DIVISION_MANAGER"]
    }
  }
}
```

---

## 5. customer_safe_outputs

```json
{
  "portal_disclosures": {
    "lead_time_range": {
      "disclosure_id": "lead_time_display",
      "enabled": true,
      "format": "range",
      "display_template": "{min_days} - {max_days} business days",
      "confidence_shown": false,
      "source": "supply_model",
      "computation": {
        "min_days": "lead_time_p10 + processing_time_min",
        "max_days": "lead_time_p90 + processing_time_max",
        "buffer_days": 2
      },
      "restrictions": {
        "never_show_internal_probability": true,
        "round_to_nearest": 1,
        "min_range_width_days": 2,
        "disclaimer_required": true,
        "disclaimer_text": "Lead times are estimates and subject to confirmation."
      },
      "personalization": {
        "by_customer_tier": {
          "PLATINUM": { "priority_adjustment_days": -2 },
          "GOLD": { "priority_adjustment_days": -1 },
          "STANDARD": { "priority_adjustment_days": 0 }
        }
      }
    },
    "availability_window": {
      "disclosure_id": "availability_display",
      "enabled": true,
      "format": "status_with_timeframe",
      "display_options": [
        { "condition": "in_stock >= requested", "display": "In Stock", "icon": "check_circle", "color": "success" },
        { "condition": "in_stock < requested AND incoming_soon", "display": "Available in {days} days", "icon": "schedule", "color": "info" },
        { "condition": "special_order", "display": "Special Order - {lead_time_range}", "icon": "info", "color": "warning" },
        { "condition": "unavailable", "display": "Contact for Availability", "icon": "help", "color": "neutral" }
      ],
      "restrictions": {
        "never_show_exact_quantities": true,
        "never_show_location_specifics": true,
        "never_show_other_customer_allocations": true,
        "aggregation_required": true
      },
      "refresh_interval_seconds": 300
    },
    "reorder_suggestions": {
      "disclosure_id": "reorder_reminder",
      "enabled": true,
      "format": "suggestion_card",
      "display_template": "Based on your order history, you may need to reorder {product} soon.",
      "trigger_conditions": {
        "last_order_age_vs_avg_interval": "> 0.8",
        "quantity_purchased_threshold": "> 3 orders"
      },
      "shown_elements": [
        { "field": "product_name", "shown": true },
        { "field": "typical_quantity", "shown": true, "label": "Your typical order" },
        { "field": "last_order_date", "shown": true },
        { "field": "estimated_next_need", "shown": true, "label": "Estimated need by" }
      ],
      "restrictions": {
        "never_show_margin_or_pricing_intelligence": true,
        "never_show_inventory_levels": true,
        "opt_out_available": true
      },
      "call_to_action": {
        "button_text": "Reorder Now",
        "action": "open_rfq_with_prefill"
      }
    },
    "price_trend_indicator": {
      "disclosure_id": "price_trend",
      "enabled": false,
      "admin_configurable": true,
      "format": "directional_indicator",
      "display_options": [
        { "trend": "up", "display": "Prices may increase soon", "icon": "trending_up" },
        { "trend": "stable", "display": "Prices stable", "icon": "trending_flat" },
        { "trend": "down", "display": null, "hidden": true }
      ],
      "restrictions": {
        "never_show_exact_forecast": true,
        "never_show_commodity_prices": true,
        "never_show_margin_data": true,
        "vague_language_required": true,
        "requires_admin_approval": true
      }
    },
    "order_forecast_summary": {
      "disclosure_id": "order_projection",
      "enabled": true,
      "format": "chart",
      "display_template": "Your order history and projected needs",
      "shown_elements": [
        { "field": "historical_orders_12m", "shown": true, "type": "bar_chart" },
        { "field": "projected_needs_3m", "shown": true, "type": "dashed_line", "label": "Projected" }
      ],
      "restrictions": {
        "based_only_on_customer_own_data": true,
        "no_cross_customer_comparison": true,
        "no_internal_forecast_details": true
      },
      "visibility": {
        "customer_tiers": ["PLATINUM", "GOLD"],
        "min_order_history": "6 months"
      }
    }
  },
  "disclosure_controls": {
    "global_settings": {
      "default_enabled": false,
      "admin_override_required": true,
      "audit_log_all_disclosures": true,
      "customer_consent_required": false
    },
    "refresh_policies": {
      "lead_time_range": { "cache_seconds": 300, "stale_after_seconds": 600 },
      "availability_window": { "cache_seconds": 300, "stale_after_seconds": 600 },
      "reorder_suggestions": { "cache_seconds": 3600, "stale_after_seconds": 7200 }
    },
    "error_handling": {
      "on_forecast_unavailable": "hide_element",
      "on_data_stale": "show_with_warning",
      "on_low_confidence": "hide_element"
    },
    "personalization_rules": {
      "respect_customer_preferences": true,
      "opt_out_granularity": "per_disclosure_type",
      "preference_storage": "customer_portal_settings"
    }
  },
  "internal_only_outputs": {
    "description": "These forecast outputs are NEVER exposed to customers",
    "restricted_fields": [
      "exact_stockout_probability",
      "margin_projections",
      "competitor_pricing_intel",
      "supplier_cost_trends",
      "other_customer_demand",
      "internal_capacity_constraints",
      "forecast_confidence_scores",
      "model_feature_weights",
      "customer_churn_risk",
      "customer_lifetime_value"
    ]
  }
}
```

---

## 6. data_model

```json
{
  "entities": {
    "Forecast": {
      "fields": {
        "id": "uuid",
        "target_type": "enum(material, sku, customer, division, location, supplier, commodity)",
        "target_id": "string",
        "horizon": "enum(7d, 30d, 90d, 365d)",
        "granularity": "enum(daily, weekly, monthly)",
        "created_at": "timestamp",
        "valid_until": "timestamp",
        "model_version": "string",
        "tenant_id": "uuid"
      },
      "indexes": ["target_type+target_id", "created_at", "tenant_id"]
    },
    "ForecastValue": {
      "fields": {
        "id": "uuid",
        "forecast_id": "uuid FK Forecast",
        "period_start": "date",
        "period_end": "date",
        "point_estimate": "decimal",
        "lower_50": "decimal",
        "upper_50": "decimal",
        "lower_80": "decimal",
        "upper_80": "decimal",
        "lower_95": "decimal",
        "upper_95": "decimal",
        "actual_value": "decimal nullable",
        "error": "decimal nullable"
      },
      "indexes": ["forecast_id", "period_start"]
    },
    "ForecastAccuracy": {
      "fields": {
        "id": "uuid",
        "forecast_id": "uuid FK Forecast",
        "evaluation_date": "date",
        "mape": "decimal",
        "bias": "decimal",
        "rmse": "decimal",
        "tracking_signal": "decimal",
        "sample_size": "integer"
      },
      "indexes": ["forecast_id", "evaluation_date"]
    },
    "ForecastAction": {
      "fields": {
        "id": "uuid",
        "forecast_id": "uuid FK Forecast",
        "action_type": "enum(reorder, transfer, price_adjust, capacity_alert, customer_alert)",
        "status": "enum(pending, accepted, rejected, executed, expired)",
        "priority": "enum(critical, high, medium, low)",
        "payload": "jsonb",
        "suggested_at": "timestamp",
        "decided_at": "timestamp nullable",
        "decided_by": "uuid FK User nullable",
        "decision_reason": "string nullable",
        "executed_at": "timestamp nullable",
        "outcome_tracked": "boolean",
        "outcome_success": "boolean nullable",
        "tenant_id": "uuid"
      },
      "indexes": ["status", "action_type", "priority", "tenant_id"]
    },
    "TransferRecommendation": {
      "fields": {
        "id": "uuid",
        "from_location_id": "uuid FK Location",
        "to_location_id": "uuid FK Location",
        "product_id": "uuid FK Product",
        "quantity": "decimal",
        "urgency": "enum(critical, high, medium, low)",
        "reason": "enum(demand_balancing, stockout_prevention, excess_redistribution)",
        "cost_estimate": "decimal",
        "benefit_estimate": "decimal",
        "status": "enum(pending, accepted, rejected, executed)",
        "forecast_action_id": "uuid FK ForecastAction",
        "created_at": "timestamp",
        "tenant_id": "uuid"
      },
      "indexes": ["status", "urgency", "from_location_id", "to_location_id"]
    },
    "PricingWindow": {
      "fields": {
        "id": "uuid",
        "product_category": "string",
        "action": "enum(increase, decrease, hold)",
        "current_price": "decimal",
        "recommended_price": "decimal",
        "floor_price": "decimal",
        "ceiling_price": "decimal",
        "window_start": "date",
        "window_end": "date",
        "confidence": "decimal",
        "rationale": "string",
        "status": "enum(pending, accepted, rejected, expired)",
        "forecast_action_id": "uuid FK ForecastAction",
        "tenant_id": "uuid"
      },
      "indexes": ["status", "window_end", "product_category"]
    },
    "SupplierRiskScore": {
      "fields": {
        "id": "uuid",
        "supplier_id": "uuid FK Supplier",
        "score_date": "date",
        "overall_score": "decimal",
        "financial_score": "decimal",
        "operational_score": "decimal",
        "quality_score": "decimal",
        "lead_time_trend": "enum(improving, stable, degrading)",
        "risk_factors": "jsonb",
        "tenant_id": "uuid"
      },
      "indexes": ["supplier_id", "score_date"]
    },
    "CommodityForecast": {
      "fields": {
        "id": "uuid",
        "commodity_type": "string",
        "grade": "string nullable",
        "forecast_date": "date",
        "horizon_days": "integer",
        "predicted_price": "decimal",
        "lower_bound": "decimal",
        "upper_bound": "decimal",
        "trend_direction": "enum(up, down, stable)",
        "volatility": "decimal",
        "created_at": "timestamp"
      },
      "indexes": ["commodity_type", "forecast_date"]
    }
  },
  "aggregations": {
    "demand_summary_daily": {
      "source": "ForecastValue",
      "group_by": ["target_type", "period_start"],
      "metrics": ["sum(point_estimate)", "avg(error)", "count(*)"]
    },
    "accuracy_trend": {
      "source": "ForecastAccuracy",
      "group_by": ["forecast.target_type", "evaluation_date"],
      "metrics": ["avg(mape)", "avg(bias)"],
      "window": "30d rolling"
    },
    "action_summary": {
      "source": "ForecastAction",
      "group_by": ["action_type", "status"],
      "metrics": ["count(*)", "avg(outcome_success)"]
    }
  }
}
```

---

## 7. api_endpoints

```json
[
  {
    "method": "GET",
    "path": "/api/forecasts",
    "description": "List forecasts with filters",
    "query_params": ["target_type", "target_id", "horizon", "from_date", "to_date"],
    "response": { "forecasts": "array", "pagination": "object" }
  },
  {
    "method": "GET",
    "path": "/api/forecasts/:id",
    "description": "Get forecast detail with values",
    "response": { "forecast": "object", "values": "array", "accuracy": "object" }
  },
  {
    "method": "GET",
    "path": "/api/forecasts/:id/values",
    "description": "Get forecast values for charting",
    "query_params": ["granularity", "from_date", "to_date"],
    "response": { "values": "array" }
  },
  {
    "method": "POST",
    "path": "/api/forecasts/refresh",
    "description": "Trigger forecast refresh for target",
    "body": { "target_type": "string", "target_id": "string" },
    "response": { "job_id": "uuid", "status": "queued" }
  },
  {
    "method": "GET",
    "path": "/api/forecasts/actions",
    "description": "List recommended actions",
    "query_params": ["action_type", "status", "priority"],
    "response": { "actions": "array", "pagination": "object" }
  },
  {
    "method": "POST",
    "path": "/api/forecasts/actions/:id/decide",
    "description": "Accept or reject an action",
    "body": { "decision": "accept|reject", "reason": "string" },
    "response": { "action": "object", "execution_status": "string" }
  },
  {
    "method": "GET",
    "path": "/api/forecasts/transfers",
    "description": "List transfer recommendations",
    "query_params": ["status", "urgency", "from_location", "to_location"],
    "response": { "transfers": "array" }
  },
  {
    "method": "GET",
    "path": "/api/forecasts/pricing-windows",
    "description": "List pricing window recommendations",
    "query_params": ["status", "product_category"],
    "response": { "windows": "array" }
  },
  {
    "method": "GET",
    "path": "/api/forecasts/supplier-risk",
    "description": "Get supplier risk scores",
    "query_params": ["supplier_id", "min_score", "max_score"],
    "response": { "suppliers": "array" }
  },
  {
    "method": "GET",
    "path": "/api/forecasts/commodities",
    "description": "Get commodity price forecasts",
    "query_params": ["commodity_type", "horizon_days"],
    "response": { "commodities": "array" }
  },
  {
    "method": "GET",
    "path": "/api/forecasts/accuracy",
    "description": "Get forecast accuracy metrics",
    "query_params": ["target_type", "from_date", "to_date"],
    "response": { "accuracy": "object", "trend": "array" }
  },
  {
    "method": "GET",
    "path": "/api/portal/availability/:product_id",
    "description": "Customer-safe availability window",
    "response": { "status": "string", "lead_time_range": "object", "disclaimer": "string" }
  },
  {
    "method": "GET",
    "path": "/api/portal/reorder-suggestions",
    "description": "Customer-safe reorder suggestions",
    "response": { "suggestions": "array" }
  }
]
```

---

## 8. permissions_matrix

| capability | CSR | PLANNER | INVENTORY | PURCHASING | PRICING | MANAGER | ADMIN |
|------------|-----|---------|-----------|------------|---------|---------|-------|
| view_demand_forecasts | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| view_supply_forecasts | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| view_transfer_recommendations | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ |
| accept_transfer_recommendations | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ | ✓ |
| view_pricing_windows | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| accept_pricing_actions | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |
| view_supplier_risk | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ |
| view_commodity_forecasts | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| view_forecast_accuracy | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| trigger_forecast_refresh | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| configure_models | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| configure_customer_disclosures | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
