# 73-AI-SUPPLY-CHAIN-FORECASTING

> Phase 21: Demand forecasting, inventory optimization, and supply chain planning powered by AI.

---

## 1. forecasting_models

```json
[
  {
    "model_id": "demand_forecast",
    "name": "Demand Forecasting",
    "description": "Predict future demand by product, customer, and region",
    "algorithm": "ensemble (ARIMA + XGBoost + Prophet)",
    "inputs": [
      "historical_orders (24+ months)",
      "seasonal_patterns",
      "economic_indicators",
      "customer_growth_rates",
      "promotional_calendar"
    ],
    "outputs": [
      "weekly_demand_by_product",
      "monthly_demand_by_customer",
      "quarterly_demand_by_region"
    ],
    "accuracy_target": "MAPE < 15%",
    "update_frequency": "weekly",
    "horizon": "1-12 months"
  },
  {
    "model_id": "lead_time_prediction",
    "name": "Supplier Lead Time Prediction",
    "description": "Predict actual lead times from suppliers",
    "algorithm": "gradient_boosting",
    "inputs": [
      "historical_po_lead_times",
      "supplier_performance",
      "order_size",
      "product_type",
      "season"
    ],
    "outputs": [
      "predicted_lead_time_days",
      "confidence_interval",
      "risk_score"
    ],
    "accuracy_target": "MAE < 3 days",
    "update_frequency": "on_po_receipt",
    "horizon": "per order"
  },
  {
    "model_id": "stockout_risk",
    "name": "Stockout Risk Prediction",
    "description": "Identify items at risk of stockout",
    "algorithm": "classification + regression",
    "inputs": [
      "current_inventory",
      "demand_forecast",
      "open_pos",
      "lead_times",
      "safety_stock_levels"
    ],
    "outputs": [
      "stockout_probability",
      "days_to_stockout",
      "impacted_orders"
    ],
    "accuracy_target": "recall > 90%",
    "update_frequency": "daily",
    "horizon": "1-8 weeks"
  },
  {
    "model_id": "reorder_optimization",
    "name": "Reorder Point Optimization",
    "description": "Calculate optimal reorder points and quantities",
    "algorithm": "stochastic_optimization",
    "inputs": [
      "demand_variability",
      "lead_time_variability",
      "service_level_target",
      "holding_cost",
      "ordering_cost"
    ],
    "outputs": [
      "reorder_point",
      "economic_order_quantity",
      "safety_stock"
    ],
    "accuracy_target": "service_level >= target",
    "update_frequency": "monthly",
    "horizon": "ongoing"
  },
  {
    "model_id": "price_forecast",
    "name": "Commodity Price Forecasting",
    "description": "Predict future commodity prices for metals/plastics",
    "algorithm": "LSTM + external_data",
    "inputs": [
      "historical_prices",
      "lme_data",
      "currency_rates",
      "energy_prices",
      "trade_policy_signals"
    ],
    "outputs": [
      "price_forecast_30d",
      "price_forecast_90d",
      "price_trend_signal"
    ],
    "accuracy_target": "MAPE < 8%",
    "update_frequency": "daily",
    "horizon": "1-6 months"
  },
  {
    "model_id": "supplier_risk",
    "name": "Supplier Risk Assessment",
    "description": "Assess risk of supplier disruption",
    "algorithm": "multi-factor_scoring",
    "inputs": [
      "delivery_performance",
      "quality_history",
      "financial_health",
      "geographic_risk",
      "concentration_risk"
    ],
    "outputs": [
      "risk_score (1-100)",
      "risk_factors",
      "mitigation_suggestions"
    ],
    "accuracy_target": "n/a (scoring model)",
    "update_frequency": "weekly",
    "horizon": "ongoing"
  }
]
```

---

## 2. forecast_ui_components

```json
{
  "screens": [
    {
      "screen_id": "forecast_dashboard",
      "location": "analytics_app > supply_chain > forecast",
      "components": [
        { "type": "DemandChart", "description": "Line chart: actual vs forecast by week" },
        { "type": "AccuracyMetrics", "description": "Cards: MAPE, bias, forecast vs actual" },
        { "type": "TopMovers", "description": "Products with biggest demand changes" },
        { "type": "SeasonalIndicators", "description": "Calendar heatmap of expected peaks" }
      ]
    },
    {
      "screen_id": "stockout_alerts",
      "location": "inventory_app > alerts",
      "components": [
        { "type": "RiskTable", "columns": ["product", "current_qty", "days_to_stockout", "risk_level", "action"] },
        { "type": "ImpactPanel", "description": "Orders affected if stockout occurs" },
        { "type": "ReorderButton", "action": "create_po_from_alert" }
      ]
    },
    {
      "screen_id": "reorder_recommendations",
      "location": "purchasing_app > recommendations",
      "components": [
        { "type": "ReorderList", "description": "Items to reorder with suggested qty" },
        { "type": "BulkPOBuilder", "description": "Select items and generate PO" },
        { "type": "CostProjection", "description": "Estimated cost based on price forecast" }
      ]
    },
    {
      "screen_id": "supplier_scorecard",
      "location": "purchasing_app > suppliers > {id}",
      "components": [
        { "type": "RiskScore", "description": "Overall risk gauge" },
        { "type": "PerformanceMetrics", "description": "On-time, quality, responsiveness" },
        { "type": "LeadTimeTrend", "description": "Chart of historical lead times" },
        { "type": "AlternativeSuppliers", "description": "Suggested alternatives if high risk" }
      ]
    },
    {
      "screen_id": "commodity_pricing",
      "location": "pricing_app > commodity",
      "components": [
        { "type": "PriceChart", "description": "Historical + forecast price curve" },
        { "type": "TrendIndicator", "description": "Up/down/stable with confidence" },
        { "type": "AlertConfig", "description": "Set price thresholds for notification" },
        { "type": "HedgingSuggestion", "description": "Buy now vs wait recommendation" }
      ]
    }
  ],
  "inline_components": [
    {
      "location": "order_entry > product_line",
      "component": "AvailabilityBadge",
      "data_source": "stockout_risk",
      "display": "green/yellow/red indicator + tooltip"
    },
    {
      "location": "quote_builder > pricing",
      "component": "PriceTrendChip",
      "data_source": "price_forecast",
      "display": "arrow up/down + % change forecast"
    },
    {
      "location": "po_entry > supplier",
      "component": "SupplierRiskBadge",
      "data_source": "supplier_risk",
      "display": "risk score chip"
    }
  ]
}
```

---

## 3. forecast_outputs

| output_type | granularity | storage | visualization | export |
|-------------|-------------|---------|---------------|--------|
| demand_forecast | product × week | forecast_demand table | line_chart | CSV, API |
| lead_time_prediction | po × supplier | po_predictions table | distribution_chart | CSV |
| stockout_alerts | product × location | alerts table | ranked_list | email, webhook |
| reorder_suggestions | product | suggestions table | action_list | CSV, PO draft |
| price_forecast | commodity × day | price_forecasts table | candlestick_chart | CSV, API |
| supplier_risk_score | supplier | supplier_scores table | gauge + factors | PDF |

---

## 4. alert_rules

```json
[
  {
    "alert_id": "stockout_imminent",
    "condition": "days_to_stockout < 7 AND stockout_probability > 0.8",
    "severity": "critical",
    "recipients": ["purchasing_manager", "branch_manager"],
    "channels": ["in_app", "email", "sms"],
    "action_prompt": "Create emergency PO"
  },
  {
    "alert_id": "stockout_risk",
    "condition": "days_to_stockout < 14 AND stockout_probability > 0.5",
    "severity": "warning",
    "recipients": ["purchasing"],
    "channels": ["in_app", "email"],
    "action_prompt": "Review reorder suggestion"
  },
  {
    "alert_id": "demand_spike",
    "condition": "forecast_demand > historical_avg * 1.5",
    "severity": "info",
    "recipients": ["planner", "purchasing"],
    "channels": ["in_app"],
    "action_prompt": "Verify capacity and inventory"
  },
  {
    "alert_id": "price_opportunity",
    "condition": "forecast_price_30d > current_price * 1.1",
    "severity": "info",
    "recipients": ["purchasing_manager"],
    "channels": ["in_app", "email"],
    "action_prompt": "Consider forward buying"
  },
  {
    "alert_id": "price_drop_expected",
    "condition": "forecast_price_30d < current_price * 0.9",
    "severity": "info",
    "recipients": ["purchasing"],
    "channels": ["in_app"],
    "action_prompt": "Consider delaying non-urgent orders"
  },
  {
    "alert_id": "supplier_risk_elevated",
    "condition": "supplier_risk_score > 70",
    "severity": "warning",
    "recipients": ["purchasing_manager"],
    "channels": ["in_app", "email"],
    "action_prompt": "Review supplier and identify alternatives"
  },
  {
    "alert_id": "lead_time_deterioration",
    "condition": "avg_lead_time_30d > historical_avg * 1.3",
    "severity": "warning",
    "recipients": ["purchasing"],
    "channels": ["in_app"],
    "action_prompt": "Increase safety stock or find alternate supplier"
  },
  {
    "alert_id": "forecast_accuracy_low",
    "condition": "mape > 25%",
    "severity": "warning",
    "recipients": ["admin"],
    "channels": ["in_app"],
    "action_prompt": "Review forecast model and data quality"
  }
]
```

---

## 5. data_requirements

```json
{
  "internal_data": [
    {
      "source": "orders",
      "fields": ["order_date", "product_id", "quantity", "customer_id", "location_id"],
      "history_required": "24+ months",
      "update": "real-time"
    },
    {
      "source": "inventory",
      "fields": ["product_id", "location_id", "quantity", "reserved", "incoming"],
      "history_required": "current snapshot",
      "update": "real-time"
    },
    {
      "source": "purchase_orders",
      "fields": ["po_date", "product_id", "supplier_id", "quantity", "expected_date", "received_date"],
      "history_required": "24+ months",
      "update": "on_event"
    },
    {
      "source": "shipments",
      "fields": ["ship_date", "product_id", "quantity", "destination"],
      "history_required": "24+ months",
      "update": "on_event"
    }
  ],
  "external_data": [
    {
      "source": "commodity_prices",
      "provider": "LME / Platts / internal feed",
      "fields": ["commodity", "date", "price", "currency"],
      "update": "daily"
    },
    {
      "source": "economic_indicators",
      "provider": "FRED / third-party",
      "fields": ["indicator", "date", "value"],
      "update": "monthly"
    },
    {
      "source": "supplier_financials",
      "provider": "D&B / manual",
      "fields": ["supplier_id", "credit_score", "financial_health"],
      "update": "quarterly"
    }
  ]
}
```

---

## 6. model_governance

```json
{
  "versioning": {
    "storage": "model_registry table",
    "fields": ["model_id", "version", "trained_date", "accuracy_metrics", "status"],
    "statuses": ["training", "validating", "active", "deprecated"]
  },
  "retraining": {
    "trigger": "scheduled OR accuracy_degradation",
    "frequency": "monthly for demand, weekly for lead_time",
    "approval_required": false,
    "rollback": "automatic if new model worse"
  },
  "monitoring": {
    "metrics_tracked": ["MAPE", "MAE", "bias", "coverage"],
    "dashboard": "analytics_app > admin > model_performance",
    "alerts": ["accuracy_below_threshold", "data_drift_detected"]
  },
  "explainability": {
    "feature_importance": "displayed on forecast detail",
    "confidence_intervals": "shown on all predictions",
    "methodology_docs": "linked from each forecast screen"
  }
}
```

---

## 7. api_endpoints

```json
[
  {
    "method": "GET",
    "path": "/api/forecast/demand",
    "query": "product_id, location_id, start_date, end_date",
    "response": { "forecasts": [{ "date": "string", "quantity": "number", "confidence_low": "number", "confidence_high": "number" }] }
  },
  {
    "method": "GET",
    "path": "/api/forecast/stockout-risk",
    "query": "location_id, threshold",
    "response": { "at_risk": [{ "product_id": "string", "days_to_stockout": "number", "probability": "number" }] }
  },
  {
    "method": "GET",
    "path": "/api/forecast/reorder-suggestions",
    "query": "location_id",
    "response": { "suggestions": [{ "product_id": "string", "reorder_qty": "number", "supplier_id": "string", "urgency": "string" }] }
  },
  {
    "method": "GET",
    "path": "/api/forecast/price/{commodity}",
    "query": "horizon_days",
    "response": { "current_price": "number", "forecast": [{ "date": "string", "price": "number" }], "trend": "up|down|stable" }
  },
  {
    "method": "GET",
    "path": "/api/forecast/supplier-risk/{supplier_id}",
    "response": { "risk_score": "number", "factors": "object", "alternatives": "array" }
  },
  {
    "method": "POST",
    "path": "/api/forecast/refresh",
    "body": { "model_id": "string" },
    "response": { "status": "queued|running|completed", "job_id": "uuid" }
  }
]
```

---

## 8. permissions

| role | view_forecasts | configure_models | override_suggestions | trigger_refresh |
|------|----------------|------------------|----------------------|-----------------|
| CSR | ✓ (inline hints) | ✗ | ✗ | ✗ |
| PLANNER | ✓ | ✗ | ✗ | ✗ |
| PURCHASING | ✓ | ✗ | ✓ | ✗ |
| BRANCH_MANAGER | ✓ | ✗ | ✓ | ✗ |
| DIVISION_MANAGER | ✓ | ✓ | ✓ | ✓ |
| ADMIN | ✓ | ✓ | ✓ | ✓ |
