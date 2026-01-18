# 71-AI-SIMULATION-LAYER

> Phase 19: Digital twin and what-if simulation capabilities for planning, capacity, and scenario analysis.

---

## 1. simulation_types

```json
[
  {
    "sim_id": "capacity_what_if",
    "name": "Capacity What-If",
    "description": "Model impact of adding/removing work centers, shifts, or machines",
    "inputs": ["current_capacity", "proposed_changes", "demand_forecast"],
    "outputs": ["utilization_projection", "bottleneck_analysis", "lead_time_impact"],
    "time_horizon": "1-12 months",
    "granularity": "daily"
  },
  {
    "sim_id": "order_impact",
    "name": "Order Impact Simulation",
    "description": "Preview effect of accepting a large order on existing commitments",
    "inputs": ["order_details", "current_schedule", "material_availability"],
    "outputs": ["affected_orders", "new_lead_times", "resource_conflicts"],
    "time_horizon": "1-8 weeks",
    "granularity": "hourly"
  },
  {
    "sim_id": "demand_scenario",
    "name": "Demand Scenario Planning",
    "description": "Model high/medium/low demand scenarios for resource planning",
    "inputs": ["historical_demand", "growth_assumptions", "seasonal_factors"],
    "outputs": ["staffing_needs", "equipment_needs", "inventory_levels"],
    "time_horizon": "3-24 months",
    "granularity": "weekly"
  },
  {
    "sim_id": "machine_downtime",
    "name": "Downtime Impact",
    "description": "Simulate planned or unplanned machine downtime",
    "inputs": ["affected_machine", "downtime_duration", "current_schedule"],
    "outputs": ["jobs_affected", "reschedule_options", "cost_impact"],
    "time_horizon": "1-4 weeks",
    "granularity": "hourly"
  },
  {
    "sim_id": "material_shortage",
    "name": "Material Shortage Scenario",
    "description": "Model impact of delayed or unavailable material",
    "inputs": ["affected_material", "shortage_duration", "affected_orders"],
    "outputs": ["order_delays", "substitution_options", "customer_notifications"],
    "time_horizon": "1-8 weeks",
    "granularity": "daily"
  },
  {
    "sim_id": "pricing_sensitivity",
    "name": "Pricing Sensitivity",
    "description": "Model demand response to price changes",
    "inputs": ["product_group", "price_change_percent", "demand_elasticity"],
    "outputs": ["volume_impact", "revenue_impact", "margin_impact"],
    "time_horizon": "1-6 months",
    "granularity": "monthly"
  },
  {
    "sim_id": "new_product_intro",
    "name": "New Product Introduction",
    "description": "Simulate adding new product line on operations",
    "inputs": ["product_specs", "volume_forecast", "required_equipment"],
    "outputs": ["capacity_fit", "training_needs", "timeline_to_production"],
    "time_horizon": "3-12 months",
    "granularity": "weekly"
  },
  {
    "sim_id": "shift_optimization",
    "name": "Shift Pattern Optimization",
    "description": "Model alternative shift patterns",
    "inputs": ["current_shifts", "demand_patterns", "labor_constraints"],
    "outputs": ["optimal_shifts", "cost_comparison", "coverage_gaps"],
    "time_horizon": "1-3 months",
    "granularity": "daily"
  }
]
```

---

## 2. digital_twin_model

```json
{
  "twin_components": [
    {
      "component": "work_center_twin",
      "real_entity": "WorkCenter",
      "state_variables": ["status", "current_job", "queue_depth", "cycle_time", "utilization"],
      "update_frequency": "real-time from MES",
      "simulation_capabilities": ["process_job", "break_down", "change_capacity"]
    },
    {
      "component": "inventory_twin",
      "real_entity": "InventoryItem",
      "state_variables": ["quantity", "location", "reserved", "incoming"],
      "update_frequency": "on transaction",
      "simulation_capabilities": ["consume", "receive", "transfer", "adjust"]
    },
    {
      "component": "order_twin",
      "real_entity": "Order",
      "state_variables": ["status", "jobs", "due_date", "priority"],
      "update_frequency": "on state change",
      "simulation_capabilities": ["expedite", "delay", "cancel", "split"]
    },
    {
      "component": "job_twin",
      "real_entity": "Job",
      "state_variables": ["status", "work_center", "operator", "progress", "estimated_completion"],
      "update_frequency": "real-time",
      "simulation_capabilities": ["start", "complete", "pause", "reassign", "scrap"]
    },
    {
      "component": "operator_twin",
      "real_entity": "Operator",
      "state_variables": ["availability", "skills", "current_assignment", "efficiency"],
      "update_frequency": "shift-based",
      "simulation_capabilities": ["assign", "train", "overtime", "absent"]
    }
  ],
  "synchronization": {
    "mode": "snapshot_on_demand",
    "description": "Twin state copied from production at simulation start",
    "isolation": "simulation runs in isolated sandbox",
    "rollback": "automatic on simulation end"
  }
}
```

---

## 3. simulation_engine

```json
{
  "engine_type": "discrete_event_simulation",
  "time_advancement": "event-driven",
  "random_seed": "configurable for reproducibility",
  "monte_carlo": {
    "enabled": true,
    "iterations": 100,
    "output": "probability_distribution"
  },
  "constraints": {
    "max_time_horizon_days": 365,
    "max_entities": 10000,
    "max_iterations": 1000,
    "timeout_seconds": 300
  },
  "algorithms": [
    { "name": "priority_dispatch", "use_case": "job sequencing" },
    { "name": "constraint_propagation", "use_case": "scheduling" },
    { "name": "genetic_optimization", "use_case": "shift patterns" },
    { "name": "linear_regression", "use_case": "demand forecast" }
  ]
}
```

---

## 4. simulation_ui_components

```json
{
  "screens": [
    {
      "screen_id": "simulation_hub",
      "location": "planning_app > simulations",
      "components": [
        { "type": "SimTypeSelector", "description": "Card grid of simulation types" },
        { "type": "RecentSimulations", "description": "List of saved/recent simulations" },
        { "type": "QuickStartWizard", "description": "Guided simulation setup" }
      ]
    },
    {
      "screen_id": "simulation_builder",
      "location": "simulation_hub > new",
      "components": [
        { "type": "ScenarioNameInput", "description": "Name and description" },
        { "type": "BaselineSelector", "description": "Choose current state or saved snapshot" },
        { "type": "VariableEditor", "description": "Adjust simulation inputs" },
        { "type": "ConstraintPanel", "description": "Set constraints and bounds" },
        { "type": "RunButton", "description": "Start simulation" }
      ]
    },
    {
      "screen_id": "simulation_results",
      "location": "simulation_hub > {sim_id}",
      "components": [
        { "type": "SummaryCards", "metrics": ["utilization_delta", "lead_time_delta", "cost_delta"] },
        { "type": "TimelineChart", "description": "Gantt view of simulated schedule" },
        { "type": "ComparisonTable", "description": "Before vs after key metrics" },
        { "type": "RiskIndicators", "description": "Bottlenecks, conflicts, warnings" },
        { "type": "ExportButton", "formats": ["PDF", "CSV", "share_link"] },
        { "type": "ApplyButton", "description": "Convert simulation to real plan (with approval)" }
      ]
    },
    {
      "screen_id": "scenario_comparison",
      "location": "simulation_hub > compare",
      "components": [
        { "type": "ScenarioSelector", "max_scenarios": 4 },
        { "type": "ComparisonGrid", "description": "Side-by-side metrics" },
        { "type": "TradeoffChart", "description": "Scatter plot of cost vs lead time" },
        { "type": "RecommendationBadge", "description": "AI-suggested best scenario" }
      ]
    }
  ],
  "inline_simulations": [
    {
      "trigger": "order_entry > large_order",
      "threshold": "order_value > $50,000 OR qty > 1000",
      "action": "prompt 'Run impact simulation?'",
      "result_display": "inline_panel"
    },
    {
      "trigger": "schedule_board > drag_job",
      "action": "auto-preview downstream impact",
      "result_display": "popover"
    },
    {
      "trigger": "machine_down_report",
      "action": "auto-run downtime impact",
      "result_display": "side_panel"
    }
  ]
}
```

---

## 5. simulation_outputs

| output_type | format | visualization | export |
|-------------|--------|---------------|--------|
| utilization_projection | time_series | area_chart | CSV, PNG |
| lead_time_distribution | histogram | bar_chart | CSV, PNG |
| bottleneck_list | ranked_list | table | CSV |
| affected_orders | list | table + gantt | CSV, PDF |
| cost_impact | summary | metric_card | PDF |
| resource_conflicts | list | calendar_heatmap | CSV |
| probability_distribution | monte_carlo | box_plot | CSV, PNG |
| recommendation | text + metrics | card | PDF |

---

## 6. simulation_api

```json
{
  "endpoints": [
    {
      "method": "POST",
      "path": "/api/simulations",
      "description": "Create and run new simulation",
      "body": { "sim_type": "string", "inputs": "object", "options": "object" },
      "response": { "sim_id": "uuid", "status": "queued|running|completed|failed" }
    },
    {
      "method": "GET",
      "path": "/api/simulations/{sim_id}",
      "description": "Get simulation status and results",
      "response": { "status": "string", "progress": "percent", "results": "object" }
    },
    {
      "method": "GET",
      "path": "/api/simulations/{sim_id}/results",
      "description": "Get detailed results",
      "response": { "summary": "object", "timeline": "array", "metrics": "object" }
    },
    {
      "method": "POST",
      "path": "/api/simulations/{sim_id}/apply",
      "description": "Apply simulation results to production",
      "requires": "manager approval",
      "response": { "applied": "boolean", "changes": "array" }
    },
    {
      "method": "GET",
      "path": "/api/simulations/compare",
      "query": "ids=uuid,uuid,uuid",
      "description": "Compare multiple simulations",
      "response": { "comparison": "object", "recommendation": "object" }
    }
  ],
  "webhooks": [
    { "event": "simulation_completed", "payload": { "sim_id": "uuid", "status": "string", "summary": "object" } },
    { "event": "simulation_failed", "payload": { "sim_id": "uuid", "error": "string" } }
  ]
}
```

---

## 7. permissions

| role | create_sim | run_sim | view_results | apply_results | delete_sim |
|------|------------|---------|--------------|---------------|------------|
| CSR | ✓ | ✓ | ✓ | ✗ | ✗ |
| PLANNER | ✓ | ✓ | ✓ | ✗ | ✓ |
| BRANCH_MANAGER | ✓ | ✓ | ✓ | ✓ | ✓ |
| DIVISION_MANAGER | ✓ | ✓ | ✓ | ✓ | ✓ |
| ADMIN | ✓ | ✓ | ✓ | ✓ | ✓ |
| OPERATOR | ✗ | ✗ | ✗ | ✗ | ✗ |
| SHIPPING | ✗ | ✗ | ✗ | ✗ | ✗ |
