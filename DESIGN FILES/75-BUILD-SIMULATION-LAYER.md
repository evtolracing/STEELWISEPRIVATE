# 75-BUILD-SIMULATION-LAYER

> Structured UI and data model for what-if simulation analysis.

---

## 1. simulation_scenarios

```json
[
  {
    "id": "demand_volatility",
    "label": "Demand Volatility",
    "description": "Model impact of demand increases/decreases",
    "category": "demand",
    "inputs": ["demand_multiplier", "product_filter", "customer_filter", "date_range"],
    "outputs": ["capacity_utilization", "lead_time_impact", "backlog_growth", "labor_delta", "sla_breach_prob"],
    "roles_allowed": ["PLANNER", "BRANCH_MANAGER", "DIVISION_MANAGER", "ADMIN"],
    "typical_use": "Seasonal planning, new customer onboarding"
  },
  {
    "id": "demand_spike",
    "label": "Demand Spike",
    "description": "Sudden large order or customer surge",
    "category": "demand",
    "inputs": ["spike_volume", "spike_product_mix", "spike_start_date", "spike_duration_days"],
    "outputs": ["capacity_gap", "overtime_required", "outsource_candidates", "delivery_delays", "cost_delta"],
    "roles_allowed": ["PLANNER", "BRANCH_MANAGER", "DIVISION_MANAGER", "ADMIN"],
    "typical_use": "Large RFQ evaluation, promotional planning"
  },
  {
    "id": "demand_decline",
    "label": "Demand Decline",
    "description": "Reduced demand scenario",
    "category": "demand",
    "inputs": ["decline_percent", "affected_products", "decline_start_date", "decline_duration"],
    "outputs": ["excess_capacity", "labor_reduction", "inventory_buildup", "cost_savings"],
    "roles_allowed": ["BRANCH_MANAGER", "DIVISION_MANAGER", "ADMIN"],
    "typical_use": "Economic downturn planning, customer loss"
  },
  {
    "id": "machine_downtime_planned",
    "label": "Planned Machine Downtime",
    "description": "Scheduled maintenance or upgrade",
    "category": "capacity",
    "inputs": ["work_center_id", "downtime_start", "downtime_end", "partial_capacity_percent"],
    "outputs": ["jobs_affected", "reschedule_options", "lead_time_impact", "transfer_requirements", "overtime_needed"],
    "roles_allowed": ["PLANNER", "BRANCH_MANAGER", "DIVISION_MANAGER", "ADMIN"],
    "typical_use": "Maintenance scheduling, equipment upgrades"
  },
  {
    "id": "machine_downtime_unplanned",
    "label": "Unplanned Machine Failure",
    "description": "Sudden equipment failure scenario",
    "category": "capacity",
    "inputs": ["work_center_id", "failure_date", "repair_duration_days", "probability_weights"],
    "outputs": ["immediate_impact", "cascade_delays", "expedite_costs", "customer_notifications", "sla_breaches"],
    "roles_allowed": ["PLANNER", "BRANCH_MANAGER", "DIVISION_MANAGER", "ADMIN"],
    "typical_use": "Contingency planning, risk assessment"
  },
  {
    "id": "lead_time_change",
    "label": "Supplier Lead Time Change",
    "description": "Vendor lead time increase/decrease",
    "category": "supply",
    "inputs": ["supplier_id", "product_category", "lead_time_delta_days", "effective_date"],
    "outputs": ["inventory_impact", "stockout_risk", "safety_stock_adjustment", "order_delays", "expedite_frequency"],
    "roles_allowed": ["PURCHASING", "PLANNER", "BRANCH_MANAGER", "DIVISION_MANAGER", "ADMIN"],
    "typical_use": "Supplier negotiations, supply chain disruption"
  },
  {
    "id": "material_shortage",
    "label": "Material Shortage",
    "description": "Limited material availability",
    "category": "supply",
    "inputs": ["product_ids", "shortage_start", "shortage_end", "available_percent"],
    "outputs": ["orders_affected", "substitution_options", "revenue_at_risk", "customer_priority_ranking"],
    "roles_allowed": ["PURCHASING", "PLANNER", "BRANCH_MANAGER", "DIVISION_MANAGER", "ADMIN"],
    "typical_use": "Supply disruption, allocation planning"
  },
  {
    "id": "transfer_scenario",
    "label": "Inter-Location Transfer",
    "description": "Move work between locations",
    "category": "capacity",
    "inputs": ["source_location", "dest_location", "work_center_type", "transfer_volume_percent", "transfer_start"],
    "outputs": ["source_utilization", "dest_utilization", "transport_cost", "lead_time_change", "skill_gaps"],
    "roles_allowed": ["DIVISION_MANAGER", "ADMIN"],
    "typical_use": "Load balancing, location optimization"
  },
  {
    "id": "additional_shift",
    "label": "Add Shift",
    "description": "Run additional shift(s)",
    "category": "capacity",
    "inputs": ["location_id", "work_centers", "shift_type", "days_of_week", "start_date", "end_date"],
    "outputs": ["capacity_gain_hours", "labor_cost_delta", "backlog_reduction", "lead_time_improvement", "break_even_volume"],
    "roles_allowed": ["BRANCH_MANAGER", "DIVISION_MANAGER", "ADMIN"],
    "typical_use": "Peak season, backlog recovery"
  },
  {
    "id": "reduce_shift",
    "label": "Reduce Shift",
    "description": "Eliminate or shorten shifts",
    "category": "capacity",
    "inputs": ["location_id", "work_centers", "shift_to_remove", "effective_date"],
    "outputs": ["capacity_loss_hours", "labor_savings", "backlog_growth", "lead_time_degradation", "overtime_to_compensate"],
    "roles_allowed": ["BRANCH_MANAGER", "DIVISION_MANAGER", "ADMIN"],
    "typical_use": "Cost reduction, low demand periods"
  },
  {
    "id": "overtime_scenario",
    "label": "Overtime Authorization",
    "description": "Authorize overtime hours",
    "category": "capacity",
    "inputs": ["location_id", "work_centers", "overtime_hours_per_week", "duration_weeks"],
    "outputs": ["capacity_gain", "labor_cost", "fatigue_risk", "backlog_reduction", "roi"],
    "roles_allowed": ["BRANCH_MANAGER", "DIVISION_MANAGER", "ADMIN"],
    "typical_use": "Short-term capacity boost"
  },
  {
    "id": "backlog_growth",
    "label": "Backlog Growth Analysis",
    "description": "Project backlog trajectory",
    "category": "demand",
    "inputs": ["current_backlog", "incoming_rate", "completion_rate", "projection_weeks"],
    "outputs": ["backlog_forecast", "weeks_to_critical", "capacity_needed", "intervention_options"],
    "roles_allowed": ["PLANNER", "BRANCH_MANAGER", "DIVISION_MANAGER", "ADMIN"],
    "typical_use": "Capacity planning, staffing decisions"
  },
  {
    "id": "pricing_change",
    "label": "Pricing Change Impact",
    "description": "Model price increase/decrease effects",
    "category": "commercial",
    "inputs": ["product_category", "price_change_percent", "effective_date", "demand_elasticity"],
    "outputs": ["volume_impact", "revenue_impact", "margin_impact", "competitive_risk", "customer_churn_prob"],
    "roles_allowed": ["BRANCH_MANAGER", "DIVISION_MANAGER", "FINANCE", "ADMIN"],
    "typical_use": "Annual pricing, cost pass-through"
  },
  {
    "id": "commodity_price_swing",
    "label": "Commodity Price Swing",
    "description": "Raw material cost change",
    "category": "commercial",
    "inputs": ["commodity", "price_change_percent", "pass_through_percent", "lag_days"],
    "outputs": ["margin_erosion", "pricing_adjustment_needed", "inventory_gain_loss", "customer_impact"],
    "roles_allowed": ["PURCHASING", "BRANCH_MANAGER", "DIVISION_MANAGER", "FINANCE", "ADMIN"],
    "typical_use": "Hedging decisions, contract negotiations"
  },
  {
    "id": "new_equipment",
    "label": "New Equipment Addition",
    "description": "Add new machine or work center",
    "category": "capacity",
    "inputs": ["equipment_type", "capacity_hours", "location_id", "installation_date", "ramp_up_weeks"],
    "outputs": ["capacity_gain", "bottleneck_relief", "payback_period", "utilization_projection", "staffing_needs"],
    "roles_allowed": ["DIVISION_MANAGER", "ADMIN"],
    "typical_use": "CAPEX planning, expansion"
  },
  {
    "id": "staffing_change",
    "label": "Staffing Change",
    "description": "Add or reduce operators",
    "category": "capacity",
    "inputs": ["location_id", "work_center_type", "headcount_delta", "skill_level", "effective_date"],
    "outputs": ["capacity_change", "training_time", "productivity_ramp", "labor_cost_delta", "flexibility_score"],
    "roles_allowed": ["BRANCH_MANAGER", "DIVISION_MANAGER", "ADMIN"],
    "typical_use": "Hiring decisions, layoff planning"
  }
]
```

---

## 2. simulation_inputs

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SimulationInputs",
  "type": "object",
  "properties": {
    "scenario_id": {
      "type": "string",
      "description": "Reference to simulation_scenarios.id"
    },
    "name": {
      "type": "string",
      "description": "User-provided scenario name"
    },
    "base_date": {
      "type": "string",
      "format": "date",
      "description": "Snapshot date for baseline state"
    },
    "horizon_weeks": {
      "type": "integer",
      "minimum": 1,
      "maximum": 52,
      "description": "Simulation time horizon"
    },
    "demand": {
      "type": "object",
      "properties": {
        "multiplier": { "type": "number", "minimum": 0, "maximum": 5, "default": 1.0 },
        "spike_volume": { "type": "number", "description": "Additional units or weight" },
        "spike_product_mix": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "product_id": { "type": "string" },
              "percent": { "type": "number" }
            }
          }
        },
        "spike_start_date": { "type": "string", "format": "date" },
        "spike_duration_days": { "type": "integer" },
        "decline_percent": { "type": "number", "minimum": 0, "maximum": 100 },
        "affected_products": { "type": "array", "items": { "type": "string" } },
        "affected_customers": { "type": "array", "items": { "type": "string" } },
        "elasticity": { "type": "number", "description": "Price elasticity coefficient" }
      }
    },
    "capacity": {
      "type": "object",
      "properties": {
        "work_center_adjustments": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "work_center_id": { "type": "string" },
              "adjustment_type": { "enum": ["downtime", "capacity_change", "add", "remove"] },
              "start_date": { "type": "string", "format": "date" },
              "end_date": { "type": "string", "format": "date" },
              "capacity_percent": { "type": "number" },
              "hours_delta": { "type": "number" }
            }
          }
        },
        "equipment_additions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "equipment_type": { "type": "string" },
              "location_id": { "type": "string" },
              "capacity_hours_per_week": { "type": "number" },
              "installation_date": { "type": "string", "format": "date" },
              "ramp_up_weeks": { "type": "integer" }
            }
          }
        }
      }
    },
    "shifts": {
      "type": "object",
      "properties": {
        "additions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "location_id": { "type": "string" },
              "work_centers": { "type": "array", "items": { "type": "string" } },
              "shift_type": { "enum": ["second", "third", "weekend", "extended"] },
              "hours_per_day": { "type": "number" },
              "days_per_week": { "type": "array", "items": { "enum": ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] } },
              "start_date": { "type": "string", "format": "date" },
              "end_date": { "type": "string", "format": "date" }
            }
          }
        },
        "reductions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "location_id": { "type": "string" },
              "shift_to_remove": { "type": "string" },
              "effective_date": { "type": "string", "format": "date" }
            }
          }
        },
        "overtime": {
          "type": "object",
          "properties": {
            "location_id": { "type": "string" },
            "work_centers": { "type": "array", "items": { "type": "string" } },
            "hours_per_week": { "type": "number" },
            "duration_weeks": { "type": "integer" },
            "cost_multiplier": { "type": "number", "default": 1.5 }
          }
        }
      }
    },
    "staffing": {
      "type": "object",
      "properties": {
        "changes": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "location_id": { "type": "string" },
              "work_center_type": { "type": "string" },
              "headcount_delta": { "type": "integer" },
              "skill_level": { "enum": ["entry", "skilled", "senior"] },
              "effective_date": { "type": "string", "format": "date" },
              "training_weeks": { "type": "integer", "default": 2 }
            }
          }
        }
      }
    },
    "lead_times": {
      "type": "object",
      "properties": {
        "supplier_adjustments": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "supplier_id": { "type": "string" },
              "product_category": { "type": "string" },
              "lead_time_delta_days": { "type": "integer" },
              "effective_date": { "type": "string", "format": "date" }
            }
          }
        },
        "processing_adjustments": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "work_center_type": { "type": "string" },
              "time_multiplier": { "type": "number" }
            }
          }
        }
      }
    },
    "transfers": {
      "type": "object",
      "properties": {
        "inter_location": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "source_location_id": { "type": "string" },
              "dest_location_id": { "type": "string" },
              "work_center_type": { "type": "string" },
              "volume_percent": { "type": "number", "minimum": 0, "maximum": 100 },
              "start_date": { "type": "string", "format": "date" },
              "transport_days": { "type": "integer" },
              "transport_cost_per_lb": { "type": "number" }
            }
          }
        }
      }
    },
    "pricing": {
      "type": "object",
      "properties": {
        "price_changes": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "product_category": { "type": "string" },
              "change_percent": { "type": "number" },
              "effective_date": { "type": "string", "format": "date" }
            }
          }
        },
        "commodity_changes": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "commodity": { "type": "string" },
              "price_change_percent": { "type": "number" },
              "pass_through_percent": { "type": "number", "default": 100 },
              "lag_days": { "type": "integer", "default": 0 }
            }
          }
        }
      }
    },
    "inventory": {
      "type": "object",
      "properties": {
        "shortages": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "product_ids": { "type": "array", "items": { "type": "string" } },
              "shortage_start": { "type": "string", "format": "date" },
              "shortage_end": { "type": "string", "format": "date" },
              "available_percent": { "type": "number" }
            }
          }
        }
      }
    },
    "monte_carlo": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean", "default": false },
        "iterations": { "type": "integer", "minimum": 10, "maximum": 1000, "default": 100 },
        "seed": { "type": "integer" }
      }
    }
  },
  "required": ["scenario_id", "name", "base_date", "horizon_weeks"]
}
```

---

## 3. simulation_outputs

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SimulationOutputs",
  "type": "object",
  "properties": {
    "simulation_id": { "type": "string", "format": "uuid" },
    "scenario_id": { "type": "string" },
    "name": { "type": "string" },
    "run_at": { "type": "string", "format": "date-time" },
    "run_by": { "type": "string", "format": "uuid" },
    "status": { "enum": ["queued", "running", "completed", "failed"] },
    "duration_ms": { "type": "integer" },
    "summary": {
      "type": "object",
      "properties": {
        "overall_impact": { "enum": ["positive", "neutral", "negative", "mixed"] },
        "confidence_level": { "type": "number", "minimum": 0, "maximum": 1 },
        "key_findings": { "type": "array", "items": { "type": "string" } },
        "recommended_actions": { "type": "array", "items": { "type": "string" } }
      }
    },
    "capacity_metrics": {
      "type": "object",
      "properties": {
        "utilization_baseline": { "type": "number", "description": "Percent" },
        "utilization_scenario": { "type": "number", "description": "Percent" },
        "utilization_delta": { "type": "number" },
        "bottleneck_work_centers": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "work_center_id": { "type": "string" },
              "utilization": { "type": "number" },
              "queue_hours": { "type": "number" }
            }
          }
        },
        "capacity_gap_hours": { "type": "number" },
        "capacity_surplus_hours": { "type": "number" }
      }
    },
    "lead_time_metrics": {
      "type": "object",
      "properties": {
        "avg_lead_time_baseline_days": { "type": "number" },
        "avg_lead_time_scenario_days": { "type": "number" },
        "lead_time_delta_days": { "type": "number" },
        "lead_time_by_product_category": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "category": { "type": "string" },
              "baseline_days": { "type": "number" },
              "scenario_days": { "type": "number" }
            }
          }
        }
      }
    },
    "backlog_metrics": {
      "type": "object",
      "properties": {
        "current_backlog_hours": { "type": "number" },
        "projected_backlog_hours": { "type": "number" },
        "backlog_trend": { "enum": ["growing", "stable", "shrinking"] },
        "weeks_to_clear": { "type": "number" },
        "backlog_by_week": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "week": { "type": "string", "format": "date" },
              "backlog_hours": { "type": "number" }
            }
          }
        }
      }
    },
    "sla_metrics": {
      "type": "object",
      "properties": {
        "on_time_baseline_percent": { "type": "number" },
        "on_time_scenario_percent": { "type": "number" },
        "sla_breach_count_baseline": { "type": "integer" },
        "sla_breach_count_scenario": { "type": "integer" },
        "sla_breach_probability": { "type": "number" },
        "orders_at_risk": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "order_id": { "type": "string" },
              "customer": { "type": "string" },
              "original_due": { "type": "string", "format": "date" },
              "projected_ship": { "type": "string", "format": "date" },
              "days_late": { "type": "integer" }
            }
          }
        }
      }
    },
    "financial_metrics": {
      "type": "object",
      "properties": {
        "revenue_baseline": { "type": "number" },
        "revenue_scenario": { "type": "number" },
        "revenue_delta": { "type": "number" },
        "cost_baseline": { "type": "number" },
        "cost_scenario": { "type": "number" },
        "cost_delta": { "type": "number" },
        "margin_baseline_percent": { "type": "number" },
        "margin_scenario_percent": { "type": "number" },
        "labor_cost_delta": { "type": "number" },
        "overtime_cost": { "type": "number" },
        "expedite_cost": { "type": "number" },
        "transfer_cost": { "type": "number" },
        "roi": { "type": "number", "description": "Return on investment for capacity changes" },
        "payback_weeks": { "type": "number" }
      }
    },
    "labor_metrics": {
      "type": "object",
      "properties": {
        "headcount_baseline": { "type": "integer" },
        "headcount_scenario": { "type": "integer" },
        "headcount_delta": { "type": "integer" },
        "regular_hours_baseline": { "type": "number" },
        "regular_hours_scenario": { "type": "number" },
        "overtime_hours": { "type": "number" },
        "training_hours_needed": { "type": "number" },
        "fatigue_risk_score": { "type": "number", "minimum": 0, "maximum": 100 }
      }
    },
    "transfer_metrics": {
      "type": "object",
      "properties": {
        "transfer_volume_lbs": { "type": "number" },
        "transfer_jobs_count": { "type": "integer" },
        "transfer_cost_total": { "type": "number" },
        "source_utilization_after": { "type": "number" },
        "dest_utilization_after": { "type": "number" },
        "lead_time_impact_days": { "type": "number" }
      }
    },
    "inventory_metrics": {
      "type": "object",
      "properties": {
        "stockout_events": { "type": "integer" },
        "stockout_days": { "type": "integer" },
        "orders_affected_by_shortage": { "type": "integer" },
        "substitution_opportunities": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "original_product": { "type": "string" },
              "substitute_product": { "type": "string" },
              "quantity": { "type": "number" }
            }
          }
        },
        "safety_stock_recommendation": { "type": "number" }
      }
    },
    "risk_metrics": {
      "type": "object",
      "properties": {
        "overall_risk_score": { "type": "number", "minimum": 0, "maximum": 100 },
        "risk_factors": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "factor": { "type": "string" },
              "severity": { "enum": ["low", "medium", "high", "critical"] },
              "probability": { "type": "number" },
              "mitigation": { "type": "string" }
            }
          }
        }
      }
    },
    "monte_carlo_results": {
      "type": "object",
      "properties": {
        "iterations_run": { "type": "integer" },
        "metrics_distributions": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "properties": {
              "p10": { "type": "number" },
              "p25": { "type": "number" },
              "p50": { "type": "number" },
              "p75": { "type": "number" },
              "p90": { "type": "number" },
              "mean": { "type": "number" },
              "std_dev": { "type": "number" }
            }
          }
        }
      }
    },
    "timeline": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "week": { "type": "string", "format": "date" },
          "utilization": { "type": "number" },
          "backlog_hours": { "type": "number" },
          "orders_shipped": { "type": "integer" },
          "on_time_percent": { "type": "number" }
        }
      }
    },
    "affected_entities": {
      "type": "object",
      "properties": {
        "orders": { "type": "array", "items": { "type": "string" } },
        "jobs": { "type": "array", "items": { "type": "string" } },
        "customers": { "type": "array", "items": { "type": "string" } },
        "work_centers": { "type": "array", "items": { "type": "string" } }
      }
    }
  }
}
```

---

## 4. simulation_UI

```json
{
  "app": "planning_app",
  "module": "simulation",
  "screens": {
    "simulation_hub": {
      "path": "/planning/simulations",
      "layout": "grid",
      "components": [
        {
          "id": "page_header",
          "type": "PageHeader",
          "props": {
            "title": "What-If Simulations",
            "actions": [
              { "label": "New Simulation", "icon": "Add", "action": "navigate:/planning/simulations/new" }
            ]
          }
        },
        {
          "id": "scenario_cards",
          "type": "CardGrid",
          "props": { "columns": 4 },
          "children": [
            {
              "id": "demand_card",
              "type": "ScenarioCard",
              "props": { "category": "demand", "icon": "TrendingUp", "color": "primary", "label": "Demand Scenarios" }
            },
            {
              "id": "capacity_card",
              "type": "ScenarioCard",
              "props": { "category": "capacity", "icon": "Engineering", "color": "secondary", "label": "Capacity Scenarios" }
            },
            {
              "id": "supply_card",
              "type": "ScenarioCard",
              "props": { "category": "supply", "icon": "LocalShipping", "color": "warning", "label": "Supply Chain Scenarios" }
            },
            {
              "id": "commercial_card",
              "type": "ScenarioCard",
              "props": { "category": "commercial", "icon": "AttachMoney", "color": "success", "label": "Commercial Scenarios" }
            }
          ]
        },
        {
          "id": "recent_simulations",
          "type": "DataTable",
          "props": {
            "title": "Recent Simulations",
            "columns": [
              { "field": "name", "header": "Name", "sortable": true },
              { "field": "scenario_id", "header": "Type", "sortable": true },
              { "field": "run_by_name", "header": "Run By", "sortable": true },
              { "field": "run_at", "header": "Run At", "sortable": true, "type": "datetime" },
              { "field": "status", "header": "Status", "type": "chip" },
              { "field": "overall_impact", "header": "Impact", "type": "impact_badge" },
              { "field": "actions", "header": "", "type": "actions" }
            ],
            "row_actions": ["view", "clone", "compare", "delete"]
          }
        },
        {
          "id": "saved_scenarios",
          "type": "Accordion",
          "props": { "title": "Saved Scenario Templates" },
          "children": [
            {
              "id": "template_list",
              "type": "List",
              "props": { "source": "scenario_templates", "actions": ["load", "edit", "delete"] }
            }
          ]
        }
      ]
    },
    "simulation_builder": {
      "path": "/planning/simulations/new",
      "layout": "two_column",
      "components": [
        {
          "id": "page_header",
          "type": "PageHeader",
          "props": {
            "title": "New Simulation",
            "breadcrumbs": ["Simulations", "New"]
          }
        },
        {
          "id": "left_panel",
          "type": "Panel",
          "props": { "width": "40%" },
          "children": [
            {
              "id": "scenario_selector",
              "type": "ScenarioTypeSelector",
              "props": { "source": "simulation_scenarios", "grouped_by": "category" }
            },
            {
              "id": "basic_info",
              "type": "FormSection",
              "props": { "title": "Basic Info" },
              "children": [
                { "id": "name_input", "type": "TextField", "props": { "label": "Scenario Name", "required": true } },
                { "id": "base_date", "type": "DatePicker", "props": { "label": "Baseline Date", "default": "today" } },
                { "id": "horizon", "type": "Slider", "props": { "label": "Horizon (weeks)", "min": 1, "max": 52, "default": 12 } }
              ]
            },
            {
              "id": "input_sections",
              "type": "DynamicFormSections",
              "props": { "sections_from": "selected_scenario.inputs" }
            },
            {
              "id": "monte_carlo_toggle",
              "type": "SwitchWithOptions",
              "props": {
                "label": "Monte Carlo Simulation",
                "options_when_on": [
                  { "id": "iterations", "type": "NumberInput", "props": { "label": "Iterations", "min": 10, "max": 1000, "default": 100 } }
                ]
              }
            }
          ]
        },
        {
          "id": "right_panel",
          "type": "Panel",
          "props": { "width": "60%" },
          "children": [
            {
              "id": "preview_tabs",
              "type": "Tabs",
              "children": [
                {
                  "id": "baseline_tab",
                  "type": "Tab",
                  "props": { "label": "Current State" },
                  "children": [
                    { "id": "baseline_metrics", "type": "MetricCards", "props": { "source": "current_baseline" } },
                    { "id": "baseline_chart", "type": "UtilizationChart", "props": { "source": "current_schedule" } }
                  ]
                },
                {
                  "id": "impact_preview_tab",
                  "type": "Tab",
                  "props": { "label": "Impact Preview" },
                  "children": [
                    { "id": "quick_estimate", "type": "QuickEstimatePanel", "props": { "source": "input_changes" } }
                  ]
                }
              ]
            },
            {
              "id": "action_bar",
              "type": "ActionBar",
              "props": { "position": "bottom" },
              "children": [
                { "id": "save_template", "type": "Button", "props": { "label": "Save as Template", "variant": "outlined" } },
                { "id": "run_button", "type": "Button", "props": { "label": "Run Simulation", "variant": "contained", "color": "primary" } }
              ]
            }
          ]
        }
      ]
    },
    "simulation_results": {
      "path": "/planning/simulations/{simulation_id}",
      "layout": "dashboard",
      "components": [
        {
          "id": "page_header",
          "type": "PageHeader",
          "props": {
            "title": "{simulation.name}",
            "subtitle": "{simulation.scenario_label}",
            "status_badge": "{simulation.overall_impact}",
            "actions": [
              { "label": "Compare", "icon": "CompareArrows", "action": "open_compare_modal" },
              { "label": "Export", "icon": "Download", "action": "export_menu" },
              { "label": "Clone", "icon": "ContentCopy", "action": "clone_simulation" }
            ]
          }
        },
        {
          "id": "summary_cards",
          "type": "MetricCardRow",
          "children": [
            { "id": "utilization_card", "type": "DeltaMetricCard", "props": { "label": "Utilization", "baseline": "capacity_metrics.utilization_baseline", "scenario": "capacity_metrics.utilization_scenario", "format": "percent" } },
            { "id": "lead_time_card", "type": "DeltaMetricCard", "props": { "label": "Avg Lead Time", "baseline": "lead_time_metrics.avg_lead_time_baseline_days", "scenario": "lead_time_metrics.avg_lead_time_scenario_days", "format": "days", "inverse": true } },
            { "id": "on_time_card", "type": "DeltaMetricCard", "props": { "label": "On-Time %", "baseline": "sla_metrics.on_time_baseline_percent", "scenario": "sla_metrics.on_time_scenario_percent", "format": "percent" } },
            { "id": "cost_card", "type": "DeltaMetricCard", "props": { "label": "Cost Impact", "value": "financial_metrics.cost_delta", "format": "currency", "inverse": true } },
            { "id": "risk_card", "type": "GaugeCard", "props": { "label": "Risk Score", "value": "risk_metrics.overall_risk_score", "thresholds": [30, 60, 80] } }
          ]
        },
        {
          "id": "main_tabs",
          "type": "Tabs",
          "children": [
            {
              "id": "timeline_tab",
              "type": "Tab",
              "props": { "label": "Timeline" },
              "children": [
                { "id": "timeline_chart", "type": "MultiLineChart", "props": { "source": "timeline", "metrics": ["utilization", "backlog_hours", "on_time_percent"] } },
                { "id": "gantt_preview", "type": "GanttChart", "props": { "source": "affected_jobs", "show_baseline": true } }
              ]
            },
            {
              "id": "capacity_tab",
              "type": "Tab",
              "props": { "label": "Capacity" },
              "children": [
                { "id": "utilization_heatmap", "type": "WorkCenterHeatmap", "props": { "source": "capacity_metrics.bottleneck_work_centers" } },
                { "id": "capacity_comparison", "type": "BarChart", "props": { "source": "capacity_by_work_center", "compare": true } }
              ]
            },
            {
              "id": "financial_tab",
              "type": "Tab",
              "props": { "label": "Financial" },
              "children": [
                { "id": "financial_table", "type": "ComparisonTable", "props": { "source": "financial_metrics" } },
                { "id": "roi_chart", "type": "PaybackChart", "props": { "source": "financial_metrics" } }
              ]
            },
            {
              "id": "orders_tab",
              "type": "Tab",
              "props": { "label": "Affected Orders" },
              "children": [
                { "id": "orders_at_risk", "type": "DataTable", "props": { "source": "sla_metrics.orders_at_risk", "columns": ["order_id", "customer", "original_due", "projected_ship", "days_late"], "row_link": "/orders/{order_id}" } }
              ]
            },
            {
              "id": "risk_tab",
              "type": "Tab",
              "props": { "label": "Risks" },
              "children": [
                { "id": "risk_factors", "type": "RiskFactorList", "props": { "source": "risk_metrics.risk_factors" } }
              ]
            },
            {
              "id": "monte_carlo_tab",
              "type": "Tab",
              "props": { "label": "Probability", "visible_if": "monte_carlo_results" },
              "children": [
                { "id": "distribution_charts", "type": "BoxPlotGrid", "props": { "source": "monte_carlo_results.metrics_distributions" } },
                { "id": "confidence_table", "type": "ConfidenceTable", "props": { "source": "monte_carlo_results" } }
              ]
            }
          ]
        },
        {
          "id": "recommendations_panel",
          "type": "Panel",
          "props": { "title": "Recommendations", "collapsible": true },
          "children": [
            { "id": "findings", "type": "FindingsList", "props": { "source": "summary.key_findings" } },
            { "id": "actions", "type": "ActionsList", "props": { "source": "summary.recommended_actions" } }
          ]
        }
      ]
    },
    "simulation_compare": {
      "path": "/planning/simulations/compare",
      "layout": "split",
      "components": [
        {
          "id": "page_header",
          "type": "PageHeader",
          "props": {
            "title": "Compare Scenarios",
            "actions": [
              { "label": "Export Comparison", "icon": "Download", "action": "export_comparison" }
            ]
          }
        },
        {
          "id": "scenario_selector",
          "type": "ScenarioCompareSelector",
          "props": { "max_scenarios": 4, "include_baseline": true }
        },
        {
          "id": "comparison_grid",
          "type": "ComparisonGrid",
          "props": {
            "metrics": [
              { "id": "utilization", "label": "Utilization %", "format": "percent" },
              { "id": "lead_time", "label": "Lead Time (days)", "format": "number", "inverse": true },
              { "id": "on_time", "label": "On-Time %", "format": "percent" },
              { "id": "cost_delta", "label": "Cost Impact", "format": "currency", "inverse": true },
              { "id": "labor_delta", "label": "Labor Cost", "format": "currency", "inverse": true },
              { "id": "risk_score", "label": "Risk Score", "format": "number", "inverse": true }
            ]
          }
        },
        {
          "id": "tradeoff_chart",
          "type": "ScatterPlot",
          "props": {
            "x_axis": { "metric": "cost_delta", "label": "Cost Impact" },
            "y_axis": { "metric": "on_time", "label": "On-Time %" },
            "bubble_size": "risk_score"
          }
        },
        {
          "id": "radar_chart",
          "type": "RadarChart",
          "props": {
            "dimensions": ["utilization", "on_time", "lead_time", "cost", "risk", "flexibility"]
          }
        },
        {
          "id": "recommendation_badge",
          "type": "AIRecommendationBadge",
          "props": {
            "source": "compare_recommendation",
            "content": "Best scenario based on your constraints"
          }
        },
        {
          "id": "detail_comparison_table",
          "type": "DetailedComparisonTable",
          "props": { "expandable_rows": true }
        }
      ]
    }
  },
  "inline_triggers": [
    {
      "location": "order_intake > large_order",
      "trigger": "order.value > 50000 OR order.weight > 10000",
      "component": "QuickSimPrompt",
      "props": { "scenario": "demand_spike", "prefill_from": "order" }
    },
    {
      "location": "schedule_board > drag_job",
      "trigger": "always",
      "component": "ImpactPreviewPopover",
      "props": { "show_affected_jobs": true }
    },
    {
      "location": "work_center > report_down",
      "trigger": "always",
      "component": "DowntimeSimPanel",
      "props": { "scenario": "machine_downtime_unplanned", "prefill_from": "work_center" }
    },
    {
      "location": "purchasing > supplier_delay",
      "trigger": "lead_time_change > 5 days",
      "component": "LeadTimeSimPrompt",
      "props": { "scenario": "lead_time_change" }
    }
  ]
}
```

---

## 5. compare_mode

```json
{
  "comparison_structure": {
    "base_case": {
      "type": "current_state | saved_simulation",
      "source_id": "uuid | 'current'",
      "label": "string",
      "snapshot_date": "date"
    },
    "scenarios": [
      {
        "simulation_id": "uuid",
        "label": "string",
        "color": "hex",
        "visible": "boolean"
      }
    ],
    "max_scenarios": 4
  },
  "comparison_metrics": [
    { "id": "utilization", "label": "Capacity Utilization", "path": "capacity_metrics.utilization_scenario", "baseline_path": "capacity_metrics.utilization_baseline", "format": "percent", "better": "higher within range", "optimal_range": [70, 90] },
    { "id": "lead_time", "label": "Average Lead Time", "path": "lead_time_metrics.avg_lead_time_scenario_days", "baseline_path": "lead_time_metrics.avg_lead_time_baseline_days", "format": "days", "better": "lower" },
    { "id": "on_time", "label": "On-Time Delivery", "path": "sla_metrics.on_time_scenario_percent", "baseline_path": "sla_metrics.on_time_baseline_percent", "format": "percent", "better": "higher" },
    { "id": "sla_breaches", "label": "SLA Breaches", "path": "sla_metrics.sla_breach_count_scenario", "baseline_path": "sla_metrics.sla_breach_count_baseline", "format": "count", "better": "lower" },
    { "id": "backlog", "label": "Backlog Hours", "path": "backlog_metrics.projected_backlog_hours", "baseline_path": "backlog_metrics.current_backlog_hours", "format": "hours", "better": "lower" },
    { "id": "cost_delta", "label": "Cost Impact", "path": "financial_metrics.cost_delta", "format": "currency", "better": "lower" },
    { "id": "labor_cost", "label": "Labor Cost Change", "path": "financial_metrics.labor_cost_delta", "format": "currency", "better": "lower" },
    { "id": "revenue", "label": "Revenue Impact", "path": "financial_metrics.revenue_delta", "format": "currency", "better": "higher" },
    { "id": "margin", "label": "Margin %", "path": "financial_metrics.margin_scenario_percent", "baseline_path": "financial_metrics.margin_baseline_percent", "format": "percent", "better": "higher" },
    { "id": "headcount", "label": "Headcount Change", "path": "labor_metrics.headcount_delta", "format": "count", "better": "context" },
    { "id": "overtime", "label": "Overtime Hours", "path": "labor_metrics.overtime_hours", "format": "hours", "better": "lower" },
    { "id": "risk_score", "label": "Risk Score", "path": "risk_metrics.overall_risk_score", "format": "score", "better": "lower" },
    { "id": "transfer_cost", "label": "Transfer Cost", "path": "transfer_metrics.transfer_cost_total", "format": "currency", "better": "lower" },
    { "id": "roi", "label": "ROI", "path": "financial_metrics.roi", "format": "percent", "better": "higher" },
    { "id": "payback", "label": "Payback Period", "path": "financial_metrics.payback_weeks", "format": "weeks", "better": "lower" }
  ],
  "visualization_modes": [
    {
      "mode": "table",
      "description": "Side-by-side metric comparison",
      "features": ["sort_by_delta", "highlight_best", "expand_details"]
    },
    {
      "mode": "bar_chart",
      "description": "Grouped bar chart per metric",
      "features": ["toggle_metrics", "show_baseline_line"]
    },
    {
      "mode": "radar",
      "description": "Multi-dimensional comparison",
      "features": ["normalize_scales", "overlay_scenarios"]
    },
    {
      "mode": "scatter",
      "description": "Trade-off analysis (cost vs benefit)",
      "features": ["select_axes", "bubble_size_by_metric"]
    },
    {
      "mode": "timeline",
      "description": "Week-by-week comparison",
      "features": ["select_metric", "show_all_scenarios"]
    }
  ],
  "recommendation_engine": {
    "inputs": [
      { "id": "priority_weights", "description": "User-defined importance weights", "fields": ["cost_weight", "on_time_weight", "risk_weight", "labor_weight"] },
      { "id": "constraints", "description": "Hard constraints", "fields": ["max_cost", "min_on_time", "max_risk", "max_overtime"] }
    ],
    "algorithm": "weighted_scoring_with_constraints",
    "output": {
      "recommended_scenario_id": "uuid",
      "score": "number",
      "reasoning": "array of strings",
      "trade_offs": "array of { metric, sacrifice, gain }"
    }
  },
  "export_formats": [
    { "format": "pdf", "includes": ["summary", "comparison_table", "charts", "recommendations"] },
    { "format": "xlsx", "includes": ["all_metrics", "timeline_data", "affected_entities"] },
    { "format": "pptx", "includes": ["summary_slide", "chart_slides", "recommendation_slide"] }
  ]
}
```

---

## 6. role_surfaces

| role | read | configure | run | compare | publish | delete |
|------|------|-----------|-----|---------|---------|--------|
| CSR | ✓ (own branch) | ✗ | ✗ | ✗ | ✗ | ✗ |
| PLANNER | ✓ (own branch) | ✓ (limited) | ✓ | ✓ | ✗ | ✓ (own) |
| OPERATOR | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| SHIPPING | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| PURCHASING | ✓ (supply scenarios) | ✓ (supply) | ✓ (supply) | ✓ | ✗ | ✓ (own) |
| BRANCH_MANAGER | ✓ (own branch) | ✓ (branch) | ✓ | ✓ | ✓ (branch) | ✓ (branch) |
| DIVISION_MANAGER | ✓ (division) | ✓ (all) | ✓ | ✓ | ✓ (division) | ✓ (division) |
| FINANCE | ✓ (financial) | ✓ (pricing) | ✓ (pricing) | ✓ | ✗ | ✗ |
| ADMIN | ✓ (all) | ✓ (all) | ✓ | ✓ | ✓ (all) | ✓ (all) |

### Permission Details

| permission | description |
|------------|-------------|
| read | View simulation results and saved scenarios |
| configure | Create new simulation scenarios and modify inputs |
| run | Execute simulations (consumes compute resources) |
| compare | Access compare mode to analyze multiple scenarios |
| publish | Share simulation results to dashboards or other users |
| delete | Remove saved simulations |

### Scenario Category Access

| role | demand | capacity | supply | commercial |
|------|--------|----------|--------|------------|
| CSR | ✗ | ✗ | ✗ | ✗ |
| PLANNER | ✓ | ✓ | ✗ | ✗ |
| OPERATOR | ✗ | ✗ | ✗ | ✗ |
| SHIPPING | ✗ | ✗ | ✗ | ✗ |
| PURCHASING | ✗ | ✗ | ✓ | ✗ |
| BRANCH_MANAGER | ✓ | ✓ | ✓ | ✓ |
| DIVISION_MANAGER | ✓ | ✓ | ✓ | ✓ |
| FINANCE | ✗ | ✗ | ✗ | ✓ |
| ADMIN | ✓ | ✓ | ✓ | ✓ |

---

## 7. data_model

```json
{
  "Simulation": {
    "id": "uuid",
    "scenario_id": "string (FK to simulation_scenarios)",
    "name": "string",
    "description": "text",
    "tenant_id": "uuid",
    "location_id": "uuid (nullable)",
    "inputs": "json (SimulationInputs)",
    "outputs": "json (SimulationOutputs)",
    "status": "enum (draft, queued, running, completed, failed)",
    "created_by": "uuid",
    "created_at": "datetime",
    "run_at": "datetime",
    "duration_ms": "integer",
    "is_template": "boolean",
    "is_published": "boolean",
    "parent_simulation_id": "uuid (nullable, for clones)"
  },
  "SimulationComparison": {
    "id": "uuid",
    "name": "string",
    "base_case_type": "enum (current, simulation)",
    "base_simulation_id": "uuid (nullable)",
    "scenario_ids": "json (array of uuids)",
    "priority_weights": "json",
    "constraints": "json",
    "recommendation": "json",
    "created_by": "uuid",
    "created_at": "datetime"
  },
  "SimulationTemplate": {
    "id": "uuid",
    "scenario_id": "string",
    "name": "string",
    "description": "text",
    "inputs_template": "json",
    "created_by": "uuid",
    "is_system": "boolean",
    "tenant_id": "uuid (nullable)"
  }
}
```

---

## 8. api_endpoints

```json
[
  {
    "method": "GET",
    "path": "/api/simulations",
    "query": "status, scenario_id, location_id, created_by, date_range",
    "response": { "simulations": "array", "total": "integer" }
  },
  {
    "method": "POST",
    "path": "/api/simulations",
    "body": "SimulationInputs",
    "response": { "simulation_id": "uuid", "status": "queued" }
  },
  {
    "method": "GET",
    "path": "/api/simulations/{id}",
    "response": "Simulation with inputs and outputs"
  },
  {
    "method": "POST",
    "path": "/api/simulations/{id}/run",
    "response": { "status": "running", "estimated_seconds": "integer" }
  },
  {
    "method": "POST",
    "path": "/api/simulations/{id}/clone",
    "response": { "simulation_id": "uuid" }
  },
  {
    "method": "DELETE",
    "path": "/api/simulations/{id}",
    "response": { "deleted": "boolean" }
  },
  {
    "method": "POST",
    "path": "/api/simulations/compare",
    "body": { "base_case": "object", "scenario_ids": "array", "weights": "object", "constraints": "object" },
    "response": "SimulationComparison"
  },
  {
    "method": "GET",
    "path": "/api/simulations/templates",
    "response": { "templates": "array" }
  },
  {
    "method": "POST",
    "path": "/api/simulations/templates",
    "body": "SimulationTemplate",
    "response": { "template_id": "uuid" }
  },
  {
    "method": "GET",
    "path": "/api/simulations/baseline",
    "query": "location_id, date",
    "response": { "baseline_metrics": "object" }
  }
]
```

---

## 9. computation_constraints

```json
{
  "limits": {
    "max_horizon_weeks": 52,
    "max_entities_per_sim": 10000,
    "max_monte_carlo_iterations": 1000,
    "timeout_seconds": 300,
    "max_concurrent_per_tenant": 3,
    "max_storage_per_sim_mb": 50
  },
  "quotas": {
    "simulations_per_day": {
      "PLANNER": 10,
      "BRANCH_MANAGER": 25,
      "DIVISION_MANAGER": 50,
      "ADMIN": "unlimited"
    },
    "monte_carlo_per_day": {
      "PLANNER": 3,
      "BRANCH_MANAGER": 10,
      "DIVISION_MANAGER": 25,
      "ADMIN": "unlimited"
    }
  },
  "retention": {
    "completed_simulations_days": 90,
    "failed_simulations_days": 7,
    "templates": "indefinite"
  }
}
```
