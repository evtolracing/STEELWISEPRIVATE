# 51 — AI Inventory Optimization

> **Purpose:** AI-driven inventory optimization, replenishment algorithms, scenario planning, and execution integration for AI-build.  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. Optimization Objectives

```yaml
optimization_objectives:

  # ═══════════════════════════════════════════════════════════════════
  # PRIMARY OBJECTIVES
  # ═══════════════════════════════════════════════════════════════════
  primary_objectives:

    - objective_id: OBJ-INV-001
      name: service_level_optimization
      description: "Maintain target fill rates while minimizing inventory"
      metric: service_level_pct
      calculation: "(orders_filled_from_stock / total_orders) * 100"
      targets:
        - segment: PREMIUM_CUSTOMERS
          target: 98.0
          minimum: 95.0
        - segment: STANDARD_CUSTOMERS
          target: 95.0
          minimum: 90.0
        - segment: ECONOMY_CUSTOMERS
          target: 90.0
          minimum: 85.0
      constraints:
        - "Inventory investment <= budget"
        - "Storage capacity <= available_space"
      priority: 1

    - objective_id: OBJ-INV-002
      name: inventory_turnover_optimization
      description: "Maximize inventory turns while maintaining service levels"
      metric: inventory_turns
      calculation: "annual_cogs / average_inventory_value"
      targets:
        - product_class: A
          target: 12.0
          minimum: 8.0
        - product_class: B
          target: 8.0
          minimum: 5.0
        - product_class: C
          target: 4.0
          minimum: 2.0
      trade_offs:
        - "Higher turns may reduce service level"
        - "Lower turns increase carrying cost"
      priority: 2

    - objective_id: OBJ-INV-003
      name: working_capital_optimization
      description: "Minimize capital tied up in inventory"
      metric: days_inventory_outstanding
      calculation: "(average_inventory / daily_cogs)"
      targets:
        overall: 45_days
        by_category:
          - hot_rolled: 30_days
          - cold_rolled: 45_days
          - coated: 60_days
          - specialty: 90_days
      constraints:
        - "Service level targets must be met"
        - "Supplier lead times respected"
      priority: 3

    - objective_id: OBJ-INV-004
      name: obsolescence_minimization
      description: "Reduce slow-moving and dead stock"
      metric: slow_moving_pct
      calculation: "(slow_moving_value / total_inventory_value) * 100"
      definitions:
        slow_moving: "No movement in 90 days"
        dead_stock: "No movement in 180 days"
        excess: "Quantity > 12 months demand"
      targets:
        slow_moving_pct: "< 5%"
        dead_stock_pct: "< 1%"
        excess_pct: "< 3%"
      actions:
        - pricing_adjustment
        - substitution_promotion
        - liquidation
      priority: 4

  # ═══════════════════════════════════════════════════════════════════
  # SECONDARY OBJECTIVES
  # ═══════════════════════════════════════════════════════════════════
  secondary_objectives:

    - objective_id: OBJ-INV-005
      name: storage_utilization
      description: "Optimize warehouse space usage"
      metric: space_utilization_pct
      calculation: "(used_storage_locations / total_locations) * 100"
      targets:
        minimum: 70
        optimal: 85
        maximum: 95
      constraints:
        - "Maintain accessibility for picking"
        - "Reserve space for receiving"
        - "Safety stock locations preserved"

    - objective_id: OBJ-INV-006
      name: supplier_consolidation
      description: "Optimize order frequency and quantities"
      metric: orders_per_supplier_month
      targets:
        minimum_order_value: 50000
        target_orders_per_month: 2
      benefits:
        - "Volume discounts"
        - "Reduced freight cost"
        - "Lower admin overhead"

    - objective_id: OBJ-INV-007
      name: product_freshness
      description: "Minimize average age of inventory"
      metric: avg_inventory_age_days
      calculation: "weighted_avg(days_since_receipt)"
      targets:
        coil_steel: 60_days
        sheet_steel: 90_days
        bar_stock: 120_days
      rationale:
        - "Reduce rust/corrosion risk"
        - "Ensure coating integrity"
        - "Customer preference for fresh material"

    - objective_id: OBJ-INV-008
      name: demand_responsiveness
      description: "Ability to respond to demand changes"
      metric: demand_coverage_days
      calculation: "available_inventory / avg_daily_demand"
      targets:
        fast_movers: 14_days
        standard: 30_days
        slow_movers: 60_days

  # ═══════════════════════════════════════════════════════════════════
  # OBJECTIVE WEIGHTING
  # ═══════════════════════════════════════════════════════════════════
  objective_weighting:
    
    default_weights:
      service_level: 0.35
      inventory_turns: 0.25
      working_capital: 0.20
      obsolescence: 0.10
      storage_utilization: 0.05
      supplier_consolidation: 0.03
      product_freshness: 0.02

    scenario_weights:
      growth_mode:
        service_level: 0.45
        inventory_turns: 0.15
        working_capital: 0.15
        obsolescence: 0.10
        storage_utilization: 0.10
        note: "Prioritize availability during growth"

      cash_conservation:
        service_level: 0.25
        inventory_turns: 0.35
        working_capital: 0.30
        obsolescence: 0.05
        storage_utilization: 0.05
        note: "Minimize cash in inventory"

      capacity_constrained:
        service_level: 0.30
        inventory_turns: 0.20
        working_capital: 0.15
        obsolescence: 0.05
        storage_utilization: 0.25
        product_freshness: 0.05
        note: "Manage limited warehouse space"

  # ═══════════════════════════════════════════════════════════════════
  # MULTI-OBJECTIVE OPTIMIZATION
  # ═══════════════════════════════════════════════════════════════════
  multi_objective_framework:

    optimization_method: pareto_frontier
    
    pareto_analysis:
      primary_axes:
        - service_level
        - inventory_investment
      secondary_axes:
        - turns
        - obsolescence_risk
      output:
        - pareto_optimal_solutions
        - trade_off_curves
        - recommendation_with_rationale

    constraint_handling:
      hard_constraints:
        - "service_level >= minimum_by_segment"
        - "storage_used <= storage_capacity"
        - "reorder_qty >= supplier_minimum"
        - "budget_used <= budget_limit"
      soft_constraints:
        - "inventory_age <= target_freshness"
        - "supplier_orders >= consolidation_target"
        penalty_method: weighted_violation
```

---

## 2. Algorithms

```yaml
algorithms:

  # ═══════════════════════════════════════════════════════════════════
  # DEMAND FORECASTING
  # ═══════════════════════════════════════════════════════════════════
  demand_forecasting:

    - algorithm_id: ALG-DEM-001
      name: ensemble_demand_forecast
      description: "Multi-model ensemble for demand prediction"
      models:
        - model: exponential_smoothing
          type: ETS
          parameters:
            trend: additive
            seasonal: multiplicative
            seasonal_period: 12
          weight_calculation: inverse_mape
          
        - model: arima
          type: Auto-ARIMA
          parameters:
            max_p: 5
            max_q: 5
            seasonal: true
            m: 12
          weight_calculation: inverse_mape
          
        - model: prophet
          type: Facebook Prophet
          parameters:
            yearly_seasonality: true
            weekly_seasonality: true
            holidays: custom_steel_industry
          weight_calculation: inverse_mape
          
        - model: gradient_boosting
          type: XGBoost
          features:
            - lag_features (1, 7, 14, 28, 90)
            - rolling_mean (7, 14, 30)
            - rolling_std (7, 14, 30)
            - day_of_week
            - month
            - steel_price_index
            - pmi_index
          weight_calculation: inverse_mape
          
        - model: lstm
          type: LSTM Neural Network
          architecture:
            layers: [64, 32]
            dropout: 0.2
            sequence_length: 60
          weight_calculation: inverse_mape

      ensemble_method: weighted_average
      weight_update: monthly
      
      outputs:
        - point_forecast
        - prediction_intervals: [0.80, 0.95]
        - forecast_horizon: 90_days

    - algorithm_id: ALG-DEM-002
      name: intermittent_demand_forecast
      description: "Specialized for slow-moving items"
      applicable_when: "demand_frequency < 0.5 (less than 1 order per 2 weeks)"
      models:
        - model: croston
          type: Croston's Method
          variant: SBA (Syntetos-Boylan Approximation)
          
        - model: tsb
          type: Teunter-Syntetos-Babai
          parameters:
            alpha: 0.1
            beta: 0.1
            
      outputs:
        - demand_rate
        - demand_size
        - combined_forecast

  # ═══════════════════════════════════════════════════════════════════
  # SAFETY STOCK OPTIMIZATION
  # ═══════════════════════════════════════════════════════════════════
  safety_stock:

    - algorithm_id: ALG-SS-001
      name: dynamic_safety_stock
      description: "Adaptive safety stock based on service level"
      
      calculation:
        base_formula: "SS = z * σ_LT"
        where:
          z: "service_level_z_score (e.g., 1.65 for 95%)"
          σ_LT: "standard_deviation_of_demand_during_lead_time"
          
        σ_LT_calculation:
          method: "convolution"
          formula: "sqrt(LT * σ_d² + d² * σ_LT²)"
          components:
            LT: avg_lead_time_days
            σ_d: demand_std_dev_daily
            d: avg_daily_demand
            σ_LT: lead_time_std_dev_days
            
      adjustments:
        - factor: demand_trend
          adjustment: "increase SS if demand trending up"
          
        - factor: supply_reliability
          adjustment: "increase SS if supplier unreliable"
          multiplier: "1 + (1 - on_time_delivery_rate)"
          
        - factor: seasonality
          adjustment: "pre-position for peak seasons"
          
        - factor: customer_importance
          adjustment: "higher SS for premium customers"
          
      review_frequency: weekly

    - algorithm_id: ALG-SS-002
      name: multi_echelon_safety_stock
      description: "Optimize SS across warehouse network"
      applicable_when: "multi_location = true"
      
      method: guaranteed_service_model
      
      inputs:
        - location_network
        - inter_location_lead_times
        - demand_by_location
        - service_requirements_by_location
        
      optimization:
        objective: "minimize_total_ss"
        constraints:
          - "meet_service_levels_at_each_location"
          - "respect_capacity_limits"
        solver: gradient_descent
        
      outputs:
        - optimal_ss_by_location
        - optimal_ss_by_sku_location
        - network_service_level
        - total_ss_investment

  # ═══════════════════════════════════════════════════════════════════
  # REORDER POINT OPTIMIZATION
  # ═══════════════════════════════════════════════════════════════════
  reorder_point:

    - algorithm_id: ALG-ROP-001
      name: dynamic_reorder_point
      description: "Continuous review reorder point"
      
      formula: "ROP = d * LT + SS"
      where:
        d: forecasted_daily_demand
        LT: expected_lead_time_days
        SS: calculated_safety_stock
        
      dynamic_adjustments:
        - condition: "demand_spike_detected"
          action: "increase ROP by 20%"
          
        - condition: "supply_disruption_alert"
          action: "increase ROP by 30%"
          
        - condition: "excess_inventory"
          action: "reduce ROP until normalized"
          
      review_frequency: daily

    - algorithm_id: ALG-ROP-002
      name: periodic_review_s_S
      description: "(s, S) periodic review policy"
      applicable_when: "review_period_fixed = true"
      
      parameters:
        s: reorder_point
        S: order_up_to_level
        R: review_period_days
        
      calculations:
        s: "demand_during(LT + R) + SS"
        S: "s + EOQ"
        order_qty: "S - current_position"
        
      optimization:
        objective: "minimize_total_cost"
        method: power_approximation

  # ═══════════════════════════════════════════════════════════════════
  # ORDER QUANTITY OPTIMIZATION
  # ═══════════════════════════════════════════════════════════════════
  order_quantity:

    - algorithm_id: ALG-EOQ-001
      name: economic_order_quantity
      description: "Classic EOQ with adjustments"
      
      base_formula: "EOQ = sqrt((2 * D * S) / H)"
      where:
        D: annual_demand
        S: ordering_cost
        H: holding_cost_per_unit_year
        
      adjustments:
        - quantity_discounts:
            method: incremental_discount_eval
            compare: total_cost_at_each_break
            
        - supplier_minimums:
            constraint: "order_qty >= min_order_qty"
            
        - truck_optimization:
            constraint: "round_to_truck_load(order_qty)"
            truck_capacity_lbs: 48000
            
        - weight_based:
            convert: "pieces_to_lbs based on product"
            
      outputs:
        - recommended_order_qty
        - order_frequency
        - total_annual_cost

    - algorithm_id: ALG-EOQ-002
      name: multi_item_joint_replenishment
      description: "Coordinate orders for same supplier"
      
      method: can_order_algorithm
      
      inputs:
        - supplier_items: [sku_list]
        - min_order_value: 50000
        - truck_capacity: 48000
        - lead_time: shared_for_supplier
        
      optimization:
        objective: "minimize_total_logistics_cost"
        constraints:
          - "meet_individual_rop"
          - "truck_capacity_limit"
          - "min_order_value"
          
      outputs:
        - joint_order_schedule
        - items_per_order
        - order_value
        - freight_savings

  # ═══════════════════════════════════════════════════════════════════
  # ABC-XYZ CLASSIFICATION
  # ═══════════════════════════════════════════════════════════════════
  classification:

    - algorithm_id: ALG-CLS-001
      name: abc_xyz_classification
      description: "Multi-dimensional inventory classification"
      
      abc_analysis:
        metric: annual_revenue
        thresholds:
          A: top_80_pct_revenue
          B: next_15_pct_revenue
          C: bottom_5_pct_revenue
        recalculation: monthly
        
      xyz_analysis:
        metric: demand_coefficient_of_variation
        thresholds:
          X: cv < 0.5 (stable)
          Y: 0.5 <= cv < 1.0 (variable)
          Z: cv >= 1.0 (erratic)
        recalculation: monthly
        
      combined_matrix:
        AX: { priority: 1, method: JIT, ss_multiplier: 0.8 }
        AY: { priority: 2, method: FORECAST, ss_multiplier: 1.0 }
        AZ: { priority: 3, method: FORECAST_BUFFERED, ss_multiplier: 1.5 }
        BX: { priority: 4, method: REORDER_POINT, ss_multiplier: 0.9 }
        BY: { priority: 5, method: REORDER_POINT, ss_multiplier: 1.1 }
        BZ: { priority: 6, method: MIN_MAX, ss_multiplier: 1.3 }
        CX: { priority: 7, method: PERIODIC_REVIEW, ss_multiplier: 0.7 }
        CY: { priority: 8, method: PERIODIC_REVIEW, ss_multiplier: 1.0 }
        CZ: { priority: 9, method: ON_DEMAND, ss_multiplier: 0.5 }

  # ═══════════════════════════════════════════════════════════════════
  # NETWORK OPTIMIZATION
  # ═══════════════════════════════════════════════════════════════════
  network_optimization:

    - algorithm_id: ALG-NET-001
      name: inventory_positioning
      description: "Optimal inventory location across network"
      
      method: mixed_integer_programming
      
      decision_variables:
        - inventory_level_by_location_sku
        - transfer_quantities_between_locations
        - replenishment_quantities_from_supplier
        
      objective: "minimize total_cost"
      cost_components:
        - holding_cost
        - transportation_cost
        - stockout_penalty
        - handling_cost
        
      constraints:
        - demand_satisfaction
        - capacity_limits
        - lead_time_requirements
        - minimum_quantities
        
      solver: gurobi_or_cplex
      
      outputs:
        - optimal_stock_levels
        - rebalancing_recommendations
        - expected_service_levels

    - algorithm_id: ALG-NET-002
      name: lateral_transshipment
      description: "Inter-location inventory transfers"
      
      trigger_conditions:
        - stockout_imminent_location_A
        - excess_at_location_B
        - transfer_cost < stockout_cost
        
      optimization:
        objective: "minimize(transfer_cost + opportunity_cost)"
        constraints:
          - source_has_sufficient_stock
          - transfer_lead_time_acceptable
          - receiving_capacity_available
          
      automation:
        auto_approve_threshold: 5000_lbs
        requires_approval_above: 20000_lbs
```

---

## 3. Scenarios

```yaml
scenarios:

  # ═══════════════════════════════════════════════════════════════════
  # DEMAND SCENARIOS
  # ═══════════════════════════════════════════════════════════════════
  demand_scenarios:

    - scenario_id: SCN-DEM-001
      name: demand_spike
      description: "Sudden increase in demand"
      parameters:
        demand_multiplier: 1.5
        duration_weeks: 4
        affected_products: "category or specific SKUs"
        probability: 0.15
      triggers:
        - large_customer_project
        - competitor_stockout
        - seasonal_event
      impacts:
        - increased_stockout_risk
        - expedited_shipping_costs
        - overtime_processing
      mitigation_strategies:
        - pre_position_safety_stock
        - expedite_open_pos
        - inter_location_transfer
        - substitute_product_offering

    - scenario_id: SCN-DEM-002
      name: demand_collapse
      description: "Sudden decrease in demand"
      parameters:
        demand_multiplier: 0.5
        duration_weeks: 8
        affected_products: "all or category"
        probability: 0.10
      triggers:
        - economic_downturn
        - customer_loss
        - industry_slowdown
      impacts:
        - excess_inventory
        - increased_carrying_cost
        - potential_obsolescence
      mitigation_strategies:
        - reduce_open_po_quantities
        - extend_supplier_lead_times
        - promotional_pricing
        - halt_reorders

    - scenario_id: SCN-DEM-003
      name: demand_shift
      description: "Demand moves between products"
      parameters:
        source_products: [sku_list]
        destination_products: [sku_list]
        shift_pct: 30
        transition_weeks: 6
      triggers:
        - customer_specification_change
        - new_product_introduction
        - grade_substitution
      impacts:
        - source_product_excess
        - destination_product_shortage
      mitigation_strategies:
        - accelerate_destination_replenishment
        - slow_source_replenishment
        - customer_communication

    - scenario_id: SCN-DEM-004
      name: seasonality_shift
      description: "Seasonal pattern changes timing"
      parameters:
        shift_weeks: +2 or -2
        intensity_change: 1.2 or 0.8
      detection:
        method: pattern_comparison
        baseline: same_period_prior_year
      impacts:
        - inventory_timing_mismatch
        - service_level_risk
      mitigation_strategies:
        - adjust_replenishment_timing
        - revise_safety_stock

  # ═══════════════════════════════════════════════════════════════════
  # SUPPLY SCENARIOS
  # ═══════════════════════════════════════════════════════════════════
  supply_scenarios:

    - scenario_id: SCN-SUP-001
      name: supplier_disruption
      description: "Supplier unable to fulfill orders"
      parameters:
        affected_supplier: supplier_id
        disruption_duration_weeks: 4
        products_affected: [sku_list]
        probability: 0.08
      triggers:
        - mill_outage
        - quality_issue
        - force_majeure
        - logistics_failure
      impacts:
        - stockout_risk
        - customer_order_delays
        - expediting_costs
      mitigation_strategies:
        - activate_alternate_suppliers
        - expedite_from_other_mills
        - customer_communication
        - substitute_products
      contingency_data:
        alternate_suppliers: [supplier_ids]
        alternate_lead_times: [days]
        price_premium: 5-15%

    - scenario_id: SCN-SUP-002
      name: lead_time_extension
      description: "Supplier lead times increase"
      parameters:
        lead_time_multiplier: 1.5
        affected_suppliers: [supplier_ids]
        duration: ongoing
      triggers:
        - mill_capacity_constraints
        - logistics_congestion
        - raw_material_shortage
      impacts:
        - safety_stock_inadequate
        - reorder_point_too_low
        - service_level_degradation
      mitigation_strategies:
        - increase_safety_stock
        - adjust_reorder_points
        - increase_order_frequency
        - build_strategic_inventory

    - scenario_id: SCN-SUP-003
      name: price_volatility
      description: "Rapid price changes"
      parameters:
        price_change_pct: +20 or -20
        change_timeline: 2_weeks
      triggers:
        - commodity_market_movement
        - tariff_changes
        - currency_fluctuation
      impacts:
        - inventory_valuation_change
        - margin_pressure
        - customer_pricing_challenges
      strategies:
        price_increase:
          - accelerate_purchases
          - build_forward_inventory
          - customer_price_adjustment
        price_decrease:
          - delay_purchases
          - reduce_inventory_levels
          - competitive_pricing

    - scenario_id: SCN-SUP-004
      name: quality_issue
      description: "Batch quality problem"
      parameters:
        affected_heat_numbers: [heat_list]
        issue_type: "mechanical_properties|chemistry|surface"
        quantity_affected_lbs: 50000
      triggers:
        - mill_quality_escape
        - storage_damage
        - processing_defect
      impacts:
        - immediate_stock_reduction
        - customer_order_delays
        - claim_processing
      mitigation_strategies:
        - quarantine_affected_material
        - identify_alternate_stock
        - expedite_replacement
        - customer_notification

  # ═══════════════════════════════════════════════════════════════════
  # OPERATIONAL SCENARIOS
  # ═══════════════════════════════════════════════════════════════════
  operational_scenarios:

    - scenario_id: SCN-OPS-001
      name: warehouse_capacity_constraint
      description: "Storage space limitation"
      parameters:
        available_capacity_pct: 95
        duration: ongoing
      triggers:
        - high_receiving_volume
        - slow_shipment_velocity
        - seasonal_inventory_build
      impacts:
        - cannot_receive_shipments
        - demurrage_charges
        - delayed_replenishment
      mitigation_strategies:
        - prioritize_fast_movers
        - delay_slow_mover_receipts
        - expedite_outbound_shipments
        - temporary_overflow_storage

    - scenario_id: SCN-OPS-002
      name: processing_bottleneck
      description: "Production capacity constraint"
      parameters:
        work_center: work_center_id
        capacity_reduction_pct: 40
        duration_weeks: 2
      triggers:
        - equipment_breakdown
        - labor_shortage
        - maintenance_overrun
      impacts:
        - finished_goods_shortage
        - customer_order_delays
        - raw_material_backup
      mitigation_strategies:
        - prioritize_by_customer_value
        - outsource_processing
        - overtime_scheduling
        - raw_material_purchase_reduction

    - scenario_id: SCN-OPS-003
      name: logistics_disruption
      description: "Transportation constraint"
      parameters:
        affected_lanes: [origin_dest_pairs]
        capacity_reduction_pct: 50
        duration_weeks: 3
      triggers:
        - carrier_shortage
        - weather_event
        - port_congestion
        - driver_shortage
      impacts:
        - receiving_delays
        - shipping_delays
        - customer_service_impact
      mitigation_strategies:
        - alternate_carriers
        - alternate_routes
        - customer_expectation_setting
        - inventory_pre_positioning

  # ═══════════════════════════════════════════════════════════════════
  # SCENARIO SIMULATION ENGINE
  # ═══════════════════════════════════════════════════════════════════
  simulation_engine:

    monte_carlo:
      iterations: 10000
      random_seed: configurable
      distribution_types:
        demand: lognormal
        lead_time: normal
        price: geometric_brownian_motion
      outputs:
        - service_level_distribution
        - inventory_investment_distribution
        - stockout_probability
        - cost_distribution
        - var_95: value_at_risk
        - cvar_95: conditional_value_at_risk

    scenario_comparison:
      baseline: current_policy
      compare_scenarios:
        - scenario_1: proposed_policy
        - scenario_2: aggressive_policy
        - scenario_3: conservative_policy
      metrics:
        - expected_cost
        - expected_service_level
        - downside_risk
        - upside_potential
      visualization:
        - tornado_chart
        - probability_distribution
        - trade_off_curves

    stress_testing:
      combine_scenarios:
        - supply_disruption + demand_spike
        - price_increase + demand_collapse
        - quality_issue + capacity_constraint
      assess:
        - worst_case_impact
        - recovery_time
        - mitigation_effectiveness
```

---

## 4. Inventory Signals

```yaml
inventory_signals:

  # ═══════════════════════════════════════════════════════════════════
  # REAL-TIME SIGNALS
  # ═══════════════════════════════════════════════════════════════════
  real_time_signals:

    - signal_id: SIG-RT-001
      name: on_hand_quantity
      description: "Current physical inventory"
      source: inventory_table
      query: "SUM(quantity) WHERE status = 'AVAILABLE' GROUP BY product_id, location_id"
      refresh: real_time (event-driven)
      events:
        - inventory_received
        - inventory_shipped
        - inventory_adjusted
        - inventory_transferred
      schema:
        product_id: uuid
        location_id: uuid
        quantity_lbs: number
        quantity_pcs: number
        last_updated: timestamp

    - signal_id: SIG-RT-002
      name: allocated_quantity
      description: "Inventory reserved for orders"
      source: allocations_table
      query: "SUM(quantity) WHERE status = 'ALLOCATED' GROUP BY product_id, location_id"
      refresh: real_time
      events:
        - order_confirmed
        - order_cancelled
        - shipment_created
      schema:
        product_id: uuid
        location_id: uuid
        allocated_lbs: number
        allocated_pcs: number
        order_count: number

    - signal_id: SIG-RT-003
      name: available_to_promise
      description: "Quantity available for new orders"
      source: calculated
      formula: "on_hand - allocated - safety_stock"
      refresh: real_time
      schema:
        product_id: uuid
        location_id: uuid
        atp_lbs: number
        atp_pcs: number
        atp_days: number

    - signal_id: SIG-RT-004
      name: inventory_position
      description: "Total inventory including in-transit and on-order"
      source: calculated
      formula: "on_hand + in_transit + on_order - allocated - backorder"
      refresh: real_time
      schema:
        product_id: uuid
        location_id: uuid
        on_hand: number
        in_transit: number
        on_order: number
        allocated: number
        backorder: number
        position: number

    - signal_id: SIG-RT-005
      name: days_of_supply
      description: "Coverage days based on forecast"
      source: calculated
      formula: "available_inventory / forecasted_daily_demand"
      refresh: hourly
      schema:
        product_id: uuid
        location_id: uuid
        days_of_supply: number
        risk_level: "CRITICAL|LOW|ADEQUATE|EXCESS"
      thresholds:
        critical: "< safety_stock_days"
        low: "< reorder_point_days"
        adequate: "reorder_point_days to max_days"
        excess: "> max_days"

  # ═══════════════════════════════════════════════════════════════════
  # INBOUND SIGNALS
  # ═══════════════════════════════════════════════════════════════════
  inbound_signals:

    - signal_id: SIG-IN-001
      name: purchase_order_pipeline
      description: "Open purchase orders"
      source: purchase_orders_table
      query: "WHERE status IN ('ORDERED', 'CONFIRMED', 'IN_TRANSIT')"
      refresh: hourly
      schema:
        po_id: uuid
        supplier_id: uuid
        product_id: uuid
        ordered_quantity: number
        expected_receipt_date: date
        confidence_score: number
        status: string

    - signal_id: SIG-IN-002
      name: in_transit_inventory
      description: "Material being shipped to locations"
      source: shipments_inbound
      query: "WHERE status = 'IN_TRANSIT'"
      refresh: real_time
      schema:
        shipment_id: uuid
        origin: string
        destination_location_id: uuid
        product_id: uuid
        quantity: number
        eta: datetime
        tracking_status: string

    - signal_id: SIG-IN-003
      name: supplier_lead_time_actual
      description: "Actual lead times by supplier"
      source: receiving_history
      calculation: "AVG(receipt_date - po_date) by supplier, product"
      refresh: daily
      schema:
        supplier_id: uuid
        product_category: string
        avg_lead_time_days: number
        std_dev_days: number
        on_time_pct: number
        trend: "IMPROVING|STABLE|DEGRADING"

    - signal_id: SIG-IN-004
      name: supplier_reliability
      description: "Supplier performance metrics"
      source: receiving_history
      refresh: weekly
      schema:
        supplier_id: uuid
        on_time_delivery_rate: number
        quality_acceptance_rate: number
        quantity_accuracy_rate: number
        overall_score: number

  # ═══════════════════════════════════════════════════════════════════
  # OUTBOUND SIGNALS
  # ═══════════════════════════════════════════════════════════════════
  outbound_signals:

    - signal_id: SIG-OUT-001
      name: order_backlog
      description: "Open orders awaiting fulfillment"
      source: orders_table
      query: "WHERE status IN ('CONFIRMED', 'IN_PRODUCTION', 'READY_TO_SHIP')"
      refresh: real_time
      schema:
        order_id: uuid
        product_id: uuid
        quantity: number
        promised_ship_date: date
        priority: number
        customer_tier: string

    - signal_id: SIG-OUT-002
      name: demand_velocity
      description: "Current demand rate"
      source: orders_shipped
      calculation: "SUM(quantity) / days by product"
      windows: [7_days, 14_days, 30_days]
      refresh: daily
      schema:
        product_id: uuid
        location_id: uuid
        velocity_7d: number
        velocity_14d: number
        velocity_30d: number
        velocity_trend: "ACCELERATING|STABLE|DECELERATING"

    - signal_id: SIG-OUT-003
      name: stockout_events
      description: "Recent stockouts"
      source: order_fulfillment
      query: "WHERE backorder_flag = true"
      refresh: real_time
      schema:
        product_id: uuid
        location_id: uuid
        stockout_date: date
        quantity_short: number
        orders_affected: number
        resolution: string
        days_to_resolve: number

    - signal_id: SIG-OUT-004
      name: fill_rate_actual
      description: "Order fill rate metrics"
      source: order_fulfillment
      calculation: "lines_filled_from_stock / total_lines"
      windows: [7_days, 30_days, 90_days]
      refresh: daily
      schema:
        product_id: uuid
        location_id: uuid
        fill_rate_7d: number
        fill_rate_30d: number
        fill_rate_90d: number
        target: number

  # ═══════════════════════════════════════════════════════════════════
  # QUALITY & AGE SIGNALS
  # ═══════════════════════════════════════════════════════════════════
  quality_signals:

    - signal_id: SIG-QA-001
      name: inventory_age
      description: "Age distribution of inventory"
      source: inventory_table
      calculation: "DATEDIFF(TODAY, receipt_date)"
      refresh: daily
      schema:
        product_id: uuid
        location_id: uuid
        avg_age_days: number
        age_buckets:
          - bucket: "0-30"
            quantity: number
          - bucket: "31-60"
            quantity: number
          - bucket: "61-90"
            quantity: number
          - bucket: "91-180"
            quantity: number
          - bucket: "181+"
            quantity: number

    - signal_id: SIG-QA-002
      name: quality_status
      description: "Inventory quality classification"
      source: inventory_table
      refresh: real_time
      schema:
        product_id: uuid
        location_id: uuid
        prime_quantity: number
        secondary_quantity: number
        excess_quantity: number
        hold_quantity: number
        reject_quantity: number

    - signal_id: SIG-QA-003
      name: slow_moving_indicator
      description: "Items with low velocity"
      source: calculated
      definition:
        slow_moving: "no sales in 90 days"
        dead_stock: "no sales in 180 days"
        excess: "quantity > 12 months demand"
      refresh: weekly
      schema:
        product_id: uuid
        location_id: uuid
        classification: "ACTIVE|SLOW|DEAD|EXCESS"
        days_since_last_sale: number
        months_of_supply: number
        value_at_risk: number

  # ═══════════════════════════════════════════════════════════════════
  # EXTERNAL SIGNALS
  # ═══════════════════════════════════════════════════════════════════
  external_signals:

    - signal_id: SIG-EXT-001
      name: commodity_price
      description: "Steel price indices"
      source: commodity_api
      refresh: daily
      schema:
        index_name: string
        current_price: number
        change_1d: number
        change_7d: number
        change_30d: number
        volatility_30d: number
        forecast_30d: number

    - signal_id: SIG-EXT-002
      name: market_indicators
      description: "Economic indicators"
      source: economic_api
      refresh: weekly
      schema:
        indicator: string
        value: number
        previous_value: number
        trend: string

    - signal_id: SIG-EXT-003
      name: supplier_capacity
      description: "Supplier available capacity"
      source: supplier_portal_or_edi
      refresh: weekly
      schema:
        supplier_id: uuid
        product_category: string
        available_capacity_lbs: number
        lead_time_current: number
        allocation_status: string
```

---

## 5. Execution Hooks

```yaml
execution_hooks:

  # ═══════════════════════════════════════════════════════════════════
  # REPLENISHMENT EXECUTION
  # ═══════════════════════════════════════════════════════════════════
  replenishment_hooks:

    - hook_id: HOOK-REP-001
      name: auto_replenishment_order
      description: "Automatically generate purchase orders"
      trigger:
        condition: "inventory_position < reorder_point"
        and: "auto_replenishment_enabled = true"
        and: "supplier_active = true"
      action:
        type: create_purchase_order
        parameters:
          supplier_id: from_product_supplier_mapping
          quantity: calculated_order_quantity
          requested_date: calculated_need_date
        validation:
          - check_supplier_minimum
          - check_budget_availability
          - check_storage_capacity
      approval:
        auto_approve_threshold: 25000
        requires_approval_above: 25000
        approvers: ["PURCHASING_MANAGER"]
      notification:
        on_create: ["PURCHASING_TEAM"]
        on_approval_needed: ["PURCHASING_MANAGER"]
      audit:
        log: true
        fields: [product_id, quantity, supplier_id, trigger_reason]

    - hook_id: HOOK-REP-002
      name: expedite_existing_po
      description: "Request expedited delivery on open PO"
      trigger:
        condition: "days_of_supply < critical_threshold"
        and: "open_po_exists = true"
        and: "po_not_yet_shipped = true"
      action:
        type: update_purchase_order
        parameters:
          po_id: from_open_pos
          requested_date: asap
          expedite_flag: true
          expedite_reason: "Low stock alert"
        notification:
          - to: supplier_email
            template: expedite_request
          - to: purchasing_team
            template: expedite_notification
      cost_tracking:
        record_expedite_cost: true
        cost_field: expedite_premium
      approval:
        auto_if_cost_below: 500
        requires_approval_above: 500

    - hook_id: HOOK-REP-003
      name: supplier_switch
      description: "Switch to alternate supplier"
      trigger:
        condition: "primary_supplier_disrupted = true"
        or: "primary_supplier_lead_time > threshold"
      action:
        type: create_purchase_order
        parameters:
          supplier_id: from_alternate_supplier_list
          quantity: calculated_order_quantity
          requested_date: calculated_need_date
        validation:
          - alternate_supplier_approved
          - price_within_threshold
          - quality_requirements_met
      approval:
        always_required: true
        approvers: ["PURCHASING_MANAGER", "QUALITY_MANAGER"]
      notification:
        on_trigger: ["SUPPLY_CHAIN_MANAGER"]

  # ═══════════════════════════════════════════════════════════════════
  # TRANSFER EXECUTION
  # ═══════════════════════════════════════════════════════════════════
  transfer_hooks:

    - hook_id: HOOK-TRF-001
      name: inter_location_transfer
      description: "Transfer inventory between locations"
      trigger:
        condition: "location_A.days_of_supply < critical"
        and: "location_B.days_of_supply > excess"
        and: "transfer_economical = true"
      action:
        type: create_transfer_order
        parameters:
          from_location: location_B
          to_location: location_A
          product_id: product_id
          quantity: calculated_transfer_qty
          priority: based_on_urgency
        validation:
          - source_has_available_stock
          - destination_has_capacity
          - transfer_lead_time_acceptable
      approval:
        auto_approve_threshold: 10000_lbs
        requires_approval_above: 10000_lbs
        approvers: ["OPERATIONS_MANAGER"]
      execution:
        create_shipment: true
        update_inventory: on_ship
        update_destination: on_receive
      notification:
        on_create: ["SOURCE_LOCATION", "DEST_LOCATION"]

    - hook_id: HOOK-TRF-002
      name: rebalancing_transfer
      description: "Network inventory rebalancing"
      trigger:
        schedule: weekly_sunday_night
        condition: "network_imbalance_score > threshold"
      action:
        type: create_transfer_orders_batch
        parameters:
          transfers: from_optimization_algorithm
          consolidate_shipments: true
      optimization:
        objective: minimize_total_network_stockout_risk
        constraints:
          - transfer_cost_budget
          - vehicle_capacity
          - receiving_capacity
      approval:
        batch_approval: true
        approvers: ["SUPPLY_CHAIN_MANAGER"]

  # ═══════════════════════════════════════════════════════════════════
  # ALERT EXECUTION
  # ═══════════════════════════════════════════════════════════════════
  alert_hooks:

    - hook_id: HOOK-ALT-001
      name: stockout_alert
      description: "Alert on imminent stockout"
      trigger:
        condition: "available_to_promise < 0"
        or: "days_of_supply < critical_threshold"
      action:
        type: create_alert
        parameters:
          severity: CRITICAL
          category: INVENTORY
          title: "Stockout Risk - {product_name}"
          body: "Product {sku} at {location} has {days} days of supply"
          data:
            product_id: product_id
            location_id: location_id
            current_stock: quantity
            days_of_supply: calculated
            open_orders_affected: count
      notification:
        channels: ["EMAIL", "SMS", "IN_APP"]
        recipients:
          - role: INVENTORY_PLANNER
          - role: SALES_MANAGER
            if: affected_orders > 0
      escalation:
        after_hours: 4
        escalate_to: ["SUPPLY_CHAIN_MANAGER"]

    - hook_id: HOOK-ALT-002
      name: excess_inventory_alert
      description: "Alert on excess inventory"
      trigger:
        condition: "months_of_supply > 6"
        and: "value > 10000"
      action:
        type: create_alert
        parameters:
          severity: MEDIUM
          category: INVENTORY
          title: "Excess Inventory - {product_name}"
          body: "Product {sku} at {location} has {months} months of supply valued at ${value}"
          recommendations:
            - type: PRICING_ADJUSTMENT
              description: "Reduce price to accelerate sales"
            - type: TRANSFER
              description: "Transfer to location with higher demand"
            - type: LIQUIDATION
              description: "Consider liquidation if aging"
      notification:
        channels: ["EMAIL", "IN_APP"]
        recipients:
          - role: INVENTORY_PLANNER
          - role: SALES_MANAGER
      review_frequency: weekly

    - hook_id: HOOK-ALT-003
      name: supplier_performance_alert
      description: "Alert on supplier performance degradation"
      trigger:
        condition: "supplier_on_time_rate < 80%"
        or: "supplier_quality_rate < 95%"
      action:
        type: create_alert
        parameters:
          severity: HIGH
          category: SUPPLIER
          title: "Supplier Performance Issue - {supplier_name}"
          body: "Supplier {supplier} OTD: {otd}%, Quality: {quality}%"
      notification:
        recipients:
          - role: PURCHASING_MANAGER
          - role: QUALITY_MANAGER
      follow_up:
        create_task: "Review supplier performance"
        assign_to: PURCHASING_MANAGER

  # ═══════════════════════════════════════════════════════════════════
  # PRICING EXECUTION
  # ═══════════════════════════════════════════════════════════════════
  pricing_hooks:

    - hook_id: HOOK-PRC-001
      name: slow_moving_markdown
      description: "Automatic price reduction for slow movers"
      trigger:
        condition: "days_since_last_sale > 90"
        and: "auto_markdown_enabled = true"
      action:
        type: create_price_adjustment
        parameters:
          product_id: product_id
          location_id: location_id
          adjustment_type: PERCENTAGE
          adjustment_value: -10
          reason: "Slow moving markdown"
          valid_from: today
          valid_until: today + 30
      validation:
        - margin_still_positive
        - not_already_marked_down
      approval:
        auto_approve: true
        notify: ["SALES_MANAGER", "PRICING_MANAGER"]
      limits:
        max_markdown_pct: 30
        max_consecutive_markdowns: 3

    - hook_id: HOOK-PRC-002
      name: dead_stock_liquidation
      description: "Aggressive pricing for dead stock"
      trigger:
        condition: "days_since_last_sale > 180"
        and: "liquidation_enabled = true"
      action:
        type: create_liquidation_offer
        parameters:
          product_id: product_id
          quantity: available_quantity
          price_floor: cost * 0.8
          offer_to: ["LIQUIDATION_CHANNELS", "BROKERS"]
      approval:
        always_required: true
        approvers: ["SALES_DIRECTOR", "FINANCE_MANAGER"]
      notification:
        on_offer_created: ["SALES_TEAM"]
        on_offer_accepted: ["FINANCE"]

  # ═══════════════════════════════════════════════════════════════════
  # PLANNING EXECUTION
  # ═══════════════════════════════════════════════════════════════════
  planning_hooks:

    - hook_id: HOOK-PLN-001
      name: safety_stock_adjustment
      description: "Automatically adjust safety stock levels"
      trigger:
        schedule: monthly
        or: "service_level_deviation > 5%"
      action:
        type: recalculate_safety_stock
        parameters:
          products: all_or_category
          method: dynamic_safety_stock
          service_level_target: from_config
      validation:
        - new_ss_within_bounds
        - storage_capacity_available
      approval:
        auto_approve_if: "change < 20%"
        requires_approval_if: "change >= 20%"
        approvers: ["INVENTORY_PLANNER"]
      notification:
        on_adjustment: ["INVENTORY_TEAM"]
        include_summary: true

    - hook_id: HOOK-PLN-002
      name: reorder_point_adjustment
      description: "Adjust reorder points based on lead time changes"
      trigger:
        condition: "actual_lead_time differs from expected by > 20%"
      action:
        type: recalculate_reorder_point
        parameters:
          product_id: product_id
          supplier_id: supplier_id
          new_lead_time: observed_lead_time
      validation:
        - rop_within_bounds
      approval:
        auto_approve: true
        notify: ["PURCHASING_TEAM"]

    - hook_id: HOOK-PLN-003
      name: abc_reclassification
      description: "Update ABC classification"
      trigger:
        schedule: monthly_first_monday
      action:
        type: run_abc_classification
        parameters:
          lookback_months: 12
          thresholds: from_config
      output:
        - classification_changes
        - policy_recommendations
      notification:
        on_complete: ["INVENTORY_MANAGER"]
        highlight_changes: true

  # ═══════════════════════════════════════════════════════════════════
  # INTEGRATION HOOKS
  # ═══════════════════════════════════════════════════════════════════
  integration_hooks:

    - hook_id: HOOK-INT-001
      name: erp_inventory_sync
      description: "Sync inventory levels to ERP"
      trigger:
        event: inventory_changed
        debounce: 5_minutes
      action:
        type: api_call
        endpoint: erp_inventory_update
        payload:
          product_id: sku_mapping
          location_id: location_mapping
          quantity: current_quantity
          as_of: timestamp
      retry:
        attempts: 3
        backoff: exponential
      on_failure:
        alert: ["IT_SUPPORT"]
        queue_for_retry: true

    - hook_id: HOOK-INT-002
      name: demand_signal_export
      description: "Export demand signals to planning system"
      trigger:
        schedule: daily_6am
      action:
        type: file_export
        format: csv
        destination: sftp://planning-system/inbound/
        content:
          - product_id
          - location_id
          - forecast_quantity
          - forecast_date
          - confidence
      notification:
        on_complete: ["PLANNING_TEAM"]

    - hook_id: HOOK-INT-003
      name: supplier_forecast_share
      description: "Share forecast with suppliers"
      trigger:
        schedule: weekly_monday
      action:
        type: supplier_portal_update
        content:
          - 12_week_rolling_forecast
          - open_po_summary
          - expected_order_dates
      suppliers:
        criteria: "strategic_suppliers"
      notification:
        to_suppliers: true
        cc: ["PURCHASING_MANAGER"]
```

---

*Document generated for AI-build Phase 16: Inventory Optimization*
