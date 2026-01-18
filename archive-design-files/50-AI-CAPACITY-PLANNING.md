# 50 — AI Capacity Planning

> **Purpose:** AI-driven capacity planning, scheduling optimization, and demand forecasting architecture for AI-build.  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. Model Inputs

```yaml
model_inputs:

  # ═══════════════════════════════════════════════════════════════════
  # DEMAND SIGNALS
  # ═══════════════════════════════════════════════════════════════════
  demand_signals:
    
    order_pipeline:
      - input_id: INP-DEM-001
        name: confirmed_orders
        description: "Orders confirmed but not yet shipped"
        source: orders_table
        query: "status IN ('CONFIRMED', 'IN_PRODUCTION', 'READY_TO_SHIP')"
        refresh_frequency: real_time
        features:
          - order_id
          - customer_id
          - requested_ship_date
          - promised_ship_date
          - priority
          - total_weight_lbs
          - processing_required
          - lines[]:
              product_id: uuid
              quantity: number
              processing_type: string
              work_center_required: string
              estimated_hours: number

      - input_id: INP-DEM-002
        name: quote_pipeline
        description: "Active quotes with conversion probability"
        source: quotes_table
        query: "status IN ('SENT', 'VIEWED') AND valid_until >= TODAY"
        refresh_frequency: hourly
        features:
          - quote_id
          - customer_id
          - total_value
          - valid_until
          - days_since_sent
          - view_count
          - customer_conversion_history
          - lines[]:
              product_id: uuid
              quantity: number
              processing_type: string
        derived_features:
          - conversion_probability: "ML model score 0.0-1.0"
          - expected_order_date: "predicted date"
          - weighted_demand: "quantity * conversion_probability"

      - input_id: INP-DEM-003
        name: rfq_pipeline
        description: "RFQs in progress"
        source: rfqs_table
        query: "status IN ('SUBMITTED', 'UNDER_REVIEW')"
        refresh_frequency: hourly
        features:
          - rfq_id
          - customer_id
          - required_by_date
          - estimated_value
          - complexity_score
        derived_features:
          - quote_probability: 0.85
          - order_probability: "quote_prob * historical_conversion"

      - input_id: INP-DEM-004
        name: recurring_orders
        description: "Historical patterns of repeat customers"
        source: orders_history
        query: "customer patterns over 24 months"
        refresh_frequency: daily
        features:
          - customer_id
          - order_frequency_days
          - avg_order_value
          - avg_order_weight
          - seasonal_pattern
          - next_expected_order_date
          - confidence_score

      - input_id: INP-DEM-005
        name: contract_releases
        description: "Expected releases from blanket orders"
        source: contracts_table
        query: "active blanket orders with release schedules"
        refresh_frequency: daily
        features:
          - contract_id
          - customer_id
          - remaining_quantity
          - expected_release_dates
          - release_pattern
          - min_release_quantity
          - max_release_quantity

    external_demand:
      - input_id: INP-DEM-006
        name: market_indicators
        description: "External economic signals"
        source: external_api
        refresh_frequency: daily
        features:
          - steel_price_index: number
          - steel_price_trend: "UP|DOWN|STABLE"
          - construction_starts: number
          - manufacturing_pmi: number
          - auto_production_index: number
          - infrastructure_spending: number
        lag_days: 30

      - input_id: INP-DEM-007
        name: seasonal_factors
        description: "Historical seasonal patterns"
        source: analytics_warehouse
        refresh_frequency: weekly
        features:
          - month_of_year: 1-12
          - week_of_year: 1-52
          - day_of_week: 1-7
          - holiday_proximity: number
          - seasonal_multiplier: number
          - by_product_category: object
          - by_customer_segment: object

  # ═══════════════════════════════════════════════════════════════════
  # CAPACITY SIGNALS
  # ═══════════════════════════════════════════════════════════════════
  capacity_signals:

    work_centers:
      - input_id: INP-CAP-001
        name: work_center_capacity
        description: "Available processing capacity by work center"
        source: work_centers_table
        refresh_frequency: real_time
        features:
          - work_center_id
          - work_center_type: "CTL|SLITTER|BLANKER|LEVELER|SAW"
          - location_id
          - max_daily_hours: number
          - max_weekly_hours: number
          - current_utilization_pct: number
          - efficiency_factor: number
          - setup_time_matrix: object
          - capabilities:
              min_thickness: number
              max_thickness: number
              min_width: number
              max_width: number
              max_coil_weight: number
          - maintenance_schedule:
              next_pm_date: date
              pm_duration_hours: number
              historical_breakdown_rate: number

      - input_id: INP-CAP-002
        name: work_center_schedule
        description: "Committed work center time"
        source: work_orders_table
        query: "scheduled work orders by work center"
        refresh_frequency: real_time
        features:
          - work_center_id
          - date
          - scheduled_hours: number
          - available_hours: number
          - scheduled_jobs:
              work_order_id: uuid
              start_time: timestamp
              end_time: timestamp
              priority: number
              can_preempt: boolean

      - input_id: INP-CAP-003
        name: work_center_performance
        description: "Historical performance metrics"
        source: work_order_history
        refresh_frequency: daily
        features:
          - work_center_id
          - avg_setup_time: number
          - avg_run_rate: number (lbs/hour or pcs/hour)
          - yield_rate: number
          - quality_pass_rate: number
          - downtime_rate: number
          - performance_trend: "IMPROVING|STABLE|DECLINING"

    labor:
      - input_id: INP-CAP-004
        name: labor_availability
        description: "Workforce capacity"
        source: hr_system
        refresh_frequency: daily
        features:
          - location_id
          - date
          - shift
          - role: "OPERATOR|HELPER|CRANE|FORKLIFT"
          - scheduled_headcount: number
          - expected_attendance: number
          - overtime_available: boolean
          - skills_matrix:
              work_center_qualified: [uuid]
              certification_status: object

      - input_id: INP-CAP-005
        name: labor_schedule
        description: "Planned labor assignments"
        source: scheduling_system
        refresh_frequency: real_time
        features:
          - employee_id
          - date
          - shift
          - assigned_work_center
          - assigned_tasks
          - pto_planned: boolean
          - training_scheduled: boolean

    inventory:
      - input_id: INP-CAP-006
        name: inventory_availability
        description: "Material available for processing/shipping"
        source: inventory_table
        query: "status = 'AVAILABLE'"
        refresh_frequency: real_time
        features:
          - product_id
          - location_id
          - available_quantity: number
          - available_weight: number
          - age_days: number
          - quality_status
          - reserved_quantity: number
          - in_transit_quantity: number

      - input_id: INP-CAP-007
        name: incoming_inventory
        description: "Expected inventory receipts"
        source: purchase_orders_table
        query: "status IN ('ORDERED', 'IN_TRANSIT')"
        refresh_frequency: hourly
        features:
          - po_id
          - vendor_id
          - expected_receipt_date
          - quantity
          - product_id
          - confidence_score: "based on vendor reliability"

    logistics:
      - input_id: INP-CAP-008
        name: shipping_capacity
        description: "Outbound shipping capacity"
        source: logistics_system
        refresh_frequency: daily
        features:
          - location_id
          - date
          - dock_count: number
          - available_dock_hours: number
          - scheduled_pickups: number
          - max_daily_shipments: number
          - carrier_availability:
              carrier_id: uuid
              available_trucks: number
              rate: number

      - input_id: INP-CAP-009
        name: receiving_capacity
        description: "Inbound receiving capacity"
        source: logistics_system
        refresh_frequency: daily
        features:
          - location_id
          - date
          - receiving_dock_count: number
          - scheduled_receipts: number
          - available_hours: number

  # ═══════════════════════════════════════════════════════════════════
  # CONSTRAINT SIGNALS
  # ═══════════════════════════════════════════════════════════════════
  constraint_signals:

    - input_id: INP-CON-001
      name: customer_constraints
      description: "Customer-specific requirements"
      source: customers_table
      features:
        - customer_id
        - required_lead_time_days: number
        - delivery_windows: object
        - carrier_restrictions: [string]
        - packaging_requirements: object
        - documentation_requirements: [string]
        - priority_tier: "PREMIUM|STANDARD|ECONOMY"

    - input_id: INP-CON-002
      name: product_constraints
      description: "Product-specific processing rules"
      source: products_table
      features:
        - product_id
        - min_order_quantity: number
        - max_order_quantity: number
        - processing_sequence: [string]
        - required_certifications: [string]
        - special_handling: [string]
        - shelf_life_days: number

    - input_id: INP-CON-003
      name: operational_constraints
      description: "Business rules and policies"
      source: config
      features:
        - max_overtime_hours_per_week: number
        - min_lead_time_days: number
        - expedite_cutoff_hours: number
        - same_day_shipping_cutoff: time
        - weekend_operations: boolean
        - holiday_schedule: [date]

    - input_id: INP-CON-004
      name: quality_constraints
      description: "Quality requirements affecting capacity"
      source: qa_system
      features:
        - inspection_required: boolean
        - inspection_time_minutes: number
        - hold_for_mtr: boolean
        - certification_requirements: [string]
        - first_article_required: boolean
```

---

## 2. Model Outputs

```yaml
model_outputs:

  # ═══════════════════════════════════════════════════════════════════
  # DEMAND FORECASTS
  # ═══════════════════════════════════════════════════════════════════
  demand_forecasts:

    - output_id: OUT-DEM-001
      name: demand_forecast_daily
      description: "Daily demand forecast by product/location"
      granularity: daily
      horizon: 90_days
      schema:
        forecast_date: date
        location_id: uuid
        product_id: uuid
        forecasted_quantity_lbs: number
        forecasted_order_count: number
        forecasted_line_count: number
        confidence_interval_low: number
        confidence_interval_high: number
        confidence_level: 0.95
        contributing_factors:
          pipeline_orders: number
          pipeline_quotes: number
          recurring_expected: number
          seasonal_adjustment: number
          trend_adjustment: number
      update_frequency: daily
      consumers:
        - inventory_planning
        - procurement
        - capacity_planning

    - output_id: OUT-DEM-002
      name: demand_forecast_weekly
      description: "Weekly demand forecast aggregated"
      granularity: weekly
      horizon: 26_weeks
      schema:
        week_start_date: date
        location_id: uuid
        product_category: string
        forecasted_weight_lbs: number
        forecasted_revenue: number
        forecasted_processing_hours: number
        confidence_interval_low: number
        confidence_interval_high: number
        scenario_best: number
        scenario_worst: number
      update_frequency: weekly

    - output_id: OUT-DEM-003
      name: quote_conversion_predictions
      description: "Probability of quote converting to order"
      granularity: per_quote
      schema:
        quote_id: uuid
        conversion_probability: number (0.0-1.0)
        expected_order_date: date
        expected_order_value: number
        confidence: number
        key_factors:
          customer_history_score: number
          price_competitiveness: number
          engagement_score: number
          urgency_score: number
      update_frequency: real_time

  # ═══════════════════════════════════════════════════════════════════
  # CAPACITY FORECASTS
  # ═══════════════════════════════════════════════════════════════════
  capacity_forecasts:

    - output_id: OUT-CAP-001
      name: capacity_utilization_forecast
      description: "Predicted capacity utilization by work center"
      granularity: daily
      horizon: 30_days
      schema:
        date: date
        work_center_id: uuid
        available_hours: number
        forecasted_demand_hours: number
        utilization_pct: number
        overload_risk: "NONE|LOW|MEDIUM|HIGH|CRITICAL"
        underutilization_flag: boolean
        bottleneck_probability: number
      update_frequency: hourly

    - output_id: OUT-CAP-002
      name: labor_requirements_forecast
      description: "Predicted labor needs"
      granularity: daily_by_shift
      horizon: 14_days
      schema:
        date: date
        location_id: uuid
        shift: string
        role: string
        required_headcount: number
        scheduled_headcount: number
        gap: number
        overtime_recommended_hours: number
        temp_labor_recommended: number
      update_frequency: daily

    - output_id: OUT-CAP-003
      name: shipping_capacity_forecast
      description: "Predicted shipping demand vs capacity"
      granularity: daily
      horizon: 14_days
      schema:
        date: date
        location_id: uuid
        forecasted_shipments: number
        forecasted_weight: number
        available_capacity: number
        capacity_utilization_pct: number
        overflow_risk: boolean
        recommended_carrier_allocation: object
      update_frequency: daily

  # ═══════════════════════════════════════════════════════════════════
  # SCHEDULING OUTPUTS
  # ═══════════════════════════════════════════════════════════════════
  scheduling_outputs:

    - output_id: OUT-SCH-001
      name: optimized_schedule
      description: "AI-optimized production schedule"
      granularity: work_order
      horizon: 7_days
      schema:
        schedule_version: string
        generated_at: timestamp
        optimization_objective: string
        schedule_items:
          - work_order_id: uuid
            work_center_id: uuid
            scheduled_start: timestamp
            scheduled_end: timestamp
            operator_assigned: uuid
            sequence_number: number
            priority_score: number
            dependencies: [uuid]
            constraint_violations: [string]
        metrics:
          total_orders_scheduled: number
          on_time_delivery_pct: number
          capacity_utilization_pct: number
          setup_time_total_hours: number
          makespan_hours: number
      update_frequency: every_4_hours

    - output_id: OUT-SCH-002
      name: schedule_recommendations
      description: "Actionable scheduling recommendations"
      schema:
        recommendation_id: uuid
        recommendation_type: "RESCHEDULE|EXPEDITE|DELAY|REASSIGN|ADD_CAPACITY"
        priority: "CRITICAL|HIGH|MEDIUM|LOW"
        affected_orders: [uuid]
        current_state: object
        recommended_action: object
        expected_improvement: object
        confidence: number
        expires_at: timestamp
      update_frequency: real_time

    - output_id: OUT-SCH-003
      name: promised_dates
      description: "AI-calculated promise dates for new orders"
      granularity: per_order_line
      schema:
        order_id: uuid
        line_id: uuid
        product_id: uuid
        quantity: number
        processing_type: string
        calculated_promise_date: date
        earliest_possible_date: date
        confidence: number
        factors:
          material_availability_date: date
          processing_queue_days: number
          shipping_lead_time_days: number
          buffer_days: number
        alternative_scenarios:
          - scenario: "EXPEDITE"
            date: date
            additional_cost: number
          - scenario: "SPLIT_SHIP"
            dates: [date]
            quantities: [number]
      update_frequency: real_time

  # ═══════════════════════════════════════════════════════════════════
  # ALERTS & RECOMMENDATIONS
  # ═══════════════════════════════════════════════════════════════════
  alerts_recommendations:

    - output_id: OUT-ALT-001
      name: capacity_alerts
      description: "Proactive capacity issue alerts"
      schema:
        alert_id: uuid
        alert_type: "OVERLOAD|UNDERUTILIZATION|BOTTLENECK|LABOR_SHORTAGE|MATERIAL_SHORTAGE"
        severity: "CRITICAL|HIGH|MEDIUM|LOW"
        affected_entity: object
        affected_date_range: object
        description: string
        impact:
          orders_at_risk: [uuid]
          revenue_at_risk: number
          customer_impact: [uuid]
        recommended_actions: [object]
        auto_resolution_available: boolean
      update_frequency: real_time

    - output_id: OUT-ALT-002
      name: optimization_opportunities
      description: "Identified optimization opportunities"
      schema:
        opportunity_id: uuid
        opportunity_type: "BATCH_CONSOLIDATION|SEQUENCE_OPTIMIZATION|LOAD_BALANCING|EARLY_START"
        description: string
        current_state: object
        optimized_state: object
        savings:
          time_saved_hours: number
          cost_saved: number
          efficiency_improvement_pct: number
        implementation_difficulty: "EASY|MEDIUM|HARD"
        requires_approval: boolean
      update_frequency: hourly

  # ═══════════════════════════════════════════════════════════════════
  # WHAT-IF ANALYSIS
  # ═══════════════════════════════════════════════════════════════════
  what_if_analysis:

    - output_id: OUT-WIF-001
      name: scenario_simulation
      description: "Results of what-if scenario analysis"
      schema:
        scenario_id: uuid
        scenario_name: string
        parameters:
          demand_multiplier: number
          capacity_adjustment: object
          constraint_changes: object
        results:
          feasibility: boolean
          on_time_delivery_pct: number
          capacity_utilization: object
          bottlenecks: [object]
          recommendations: [string]
        comparison_to_baseline: object
      trigger: on_demand
```

---

## 3. Feature Space

```yaml
feature_space:

  # ═══════════════════════════════════════════════════════════════════
  # DEMAND PREDICTION FEATURES
  # ═══════════════════════════════════════════════════════════════════
  demand_prediction:

    customer_features:
      - feature_name: customer_order_frequency
        description: "Average days between orders"
        type: numeric
        calculation: "AVG(days_between_orders) over 12 months"
        
      - feature_name: customer_order_value_avg
        description: "Average order value"
        type: numeric
        calculation: "AVG(order_total) over 12 months"
        
      - feature_name: customer_order_value_trend
        description: "Trend in order values"
        type: numeric
        calculation: "Linear regression slope of order values"
        
      - feature_name: customer_seasonality_profile
        description: "Monthly ordering pattern"
        type: vector[12]
        calculation: "Normalized monthly order volume"
        
      - feature_name: customer_days_since_last_order
        description: "Recency signal"
        type: numeric
        calculation: "DATEDIFF(TODAY, last_order_date)"
        
      - feature_name: customer_product_affinity
        description: "Product category preferences"
        type: vector[n_categories]
        calculation: "Normalized spend by category"
        
      - feature_name: customer_payment_reliability
        description: "Payment behavior score"
        type: numeric
        calculation: "Weighted avg of on-time payment rate"
        
      - feature_name: customer_growth_stage
        description: "Customer lifecycle stage"
        type: categorical
        values: ["NEW", "GROWING", "MATURE", "DECLINING", "CHURNED"]

    product_features:
      - feature_name: product_velocity
        description: "Sales velocity (lbs/day)"
        type: numeric
        calculation: "AVG daily sales over 90 days"
        
      - feature_name: product_velocity_trend
        description: "Velocity trend"
        type: numeric
        calculation: "Linear regression slope"
        
      - feature_name: product_seasonality
        description: "Seasonal demand pattern"
        type: vector[12]
        calculation: "Normalized monthly demand"
        
      - feature_name: product_price_elasticity
        description: "Price sensitivity"
        type: numeric
        calculation: "% demand change / % price change"
        
      - feature_name: product_substitute_availability
        description: "Availability of substitutes"
        type: numeric
        calculation: "Count of similar products in stock"
        
      - feature_name: product_lead_time
        description: "Typical replenishment lead time"
        type: numeric
        calculation: "AVG PO to receipt days"

    temporal_features:
      - feature_name: day_of_week
        type: categorical
        encoding: one_hot[7]
        
      - feature_name: month_of_year
        type: categorical
        encoding: one_hot[12]
        
      - feature_name: week_of_year
        type: numeric
        range: [1, 52]
        
      - feature_name: is_month_end
        type: boolean
        
      - feature_name: is_quarter_end
        type: boolean
        
      - feature_name: days_to_holiday
        type: numeric
        calculation: "Days to nearest major holiday"
        
      - feature_name: is_holiday_week
        type: boolean
        
      - feature_name: business_days_remaining_month
        type: numeric

    market_features:
      - feature_name: steel_price_index
        type: numeric
        source: commodity_api
        
      - feature_name: steel_price_30d_change
        type: numeric
        calculation: "(current - 30d_ago) / 30d_ago"
        
      - feature_name: steel_price_volatility
        type: numeric
        calculation: "StdDev of daily prices over 30 days"
        
      - feature_name: manufacturing_pmi
        type: numeric
        source: economic_api
        
      - feature_name: construction_spending_index
        type: numeric
        source: economic_api

  # ═══════════════════════════════════════════════════════════════════
  # CAPACITY PLANNING FEATURES
  # ═══════════════════════════════════════════════════════════════════
  capacity_planning:

    work_center_features:
      - feature_name: wc_utilization_7d_avg
        description: "7-day rolling utilization"
        type: numeric
        
      - feature_name: wc_utilization_trend
        description: "Utilization trend"
        type: numeric
        
      - feature_name: wc_efficiency_factor
        description: "Actual vs standard rate"
        type: numeric
        calculation: "actual_output / expected_output"
        
      - feature_name: wc_downtime_rate
        description: "Unplanned downtime rate"
        type: numeric
        calculation: "downtime_hours / scheduled_hours"
        
      - feature_name: wc_setup_time_avg
        description: "Average setup time"
        type: numeric
        
      - feature_name: wc_queue_depth
        description: "Work orders in queue"
        type: numeric
        
      - feature_name: wc_queue_hours
        description: "Hours of work in queue"
        type: numeric
        
      - feature_name: wc_days_since_pm
        description: "Days since last PM"
        type: numeric
        
      - feature_name: wc_breakdown_probability
        description: "Predicted breakdown probability"
        type: numeric
        calculation: "ML model based on maintenance history"

    job_features:
      - feature_name: job_complexity_score
        description: "Processing complexity"
        type: numeric
        calculation: "Weighted sum of complexity factors"
        factors:
          - tight_tolerances: 2.0
          - multiple_operations: 1.5
          - special_handling: 1.5
          - first_article: 1.3
          - rush_order: 1.2
          
      - feature_name: job_estimated_hours
        description: "Estimated processing time"
        type: numeric
        
      - feature_name: job_setup_complexity
        description: "Setup difficulty"
        type: categorical
        values: ["SIMPLE", "STANDARD", "COMPLEX"]
        
      - feature_name: job_material_ready
        description: "Material availability"
        type: boolean
        
      - feature_name: job_days_to_due
        description: "Days until due date"
        type: numeric
        
      - feature_name: job_priority_score
        description: "Computed priority"
        type: numeric
        calculation: "f(customer_priority, days_to_due, order_value)"
        
      - feature_name: job_predecessor_complete
        description: "Dependencies satisfied"
        type: boolean

    resource_features:
      - feature_name: labor_availability_score
        description: "Labor availability index"
        type: numeric
        calculation: "available_hours / required_hours"
        
      - feature_name: skill_coverage
        description: "Skill match for scheduled work"
        type: numeric
        calculation: "% of jobs with qualified operators"
        
      - feature_name: crane_availability
        description: "Crane utilization forecast"
        type: numeric
        
      - feature_name: forklift_availability
        description: "Forklift availability"
        type: numeric

  # ═══════════════════════════════════════════════════════════════════
  # QUOTE CONVERSION FEATURES
  # ═══════════════════════════════════════════════════════════════════
  quote_conversion:

    quote_features:
      - feature_name: quote_value
        type: numeric
        
      - feature_name: quote_line_count
        type: numeric
        
      - feature_name: quote_age_days
        type: numeric
        
      - feature_name: quote_valid_days_remaining
        type: numeric
        
      - feature_name: quote_view_count
        type: numeric
        
      - feature_name: quote_time_to_first_view
        type: numeric
        
      - feature_name: quote_revision_count
        type: numeric
        
      - feature_name: quote_discount_pct
        type: numeric
        
      - feature_name: quote_from_rfq
        type: boolean
        
      - feature_name: quote_processing_required
        type: boolean
        
      - feature_name: quote_expedited
        type: boolean

    customer_quote_history:
      - feature_name: customer_quote_conversion_rate
        type: numeric
        calculation: "orders / quotes over 12 months"
        
      - feature_name: customer_avg_decision_days
        type: numeric
        calculation: "AVG days from quote to order"
        
      - feature_name: customer_quote_count_90d
        type: numeric
        
      - feature_name: customer_order_count_90d
        type: numeric

    competitive_features:
      - feature_name: price_vs_market
        type: numeric
        calculation: "quote_price / market_price_estimate"
        
      - feature_name: lead_time_vs_standard
        type: numeric
        calculation: "quoted_lead_time / standard_lead_time"

  # ═══════════════════════════════════════════════════════════════════
  # FEATURE ENGINEERING
  # ═══════════════════════════════════════════════════════════════════
  feature_engineering:

    transformations:
      - name: log_transform
        apply_to: ["order_value", "quantity", "weight"]
        reason: "Handle right-skewed distributions"
        
      - name: standardization
        apply_to: "all_numeric"
        method: "z-score"
        
      - name: cyclical_encoding
        apply_to: ["day_of_week", "month_of_year", "hour_of_day"]
        method: "sin_cos"
        
      - name: lag_features
        apply_to: ["demand", "utilization"]
        lags: [1, 7, 14, 28]
        
      - name: rolling_statistics
        apply_to: ["demand", "utilization", "lead_time"]
        windows: [7, 14, 30, 90]
        statistics: ["mean", "std", "min", "max"]

    interaction_features:
      - name: customer_product_affinity
        features: ["customer_id", "product_category"]
        method: "target_encoding"
        
      - name: work_center_product_efficiency
        features: ["work_center_id", "product_id"]
        method: "historical_avg_rate"
        
      - name: customer_seasonality_interaction
        features: ["customer_id", "month"]
        method: "historical_pattern"

    embedding_features:
      - name: customer_embedding
        dimension: 32
        trained_on: "order_history"
        
      - name: product_embedding
        dimension: 16
        trained_on: "co-purchase_patterns"
```

---

## 4. Feedback Loop

```yaml
feedback_loop:

  # ═══════════════════════════════════════════════════════════════════
  # PREDICTION MONITORING
  # ═══════════════════════════════════════════════════════════════════
  prediction_monitoring:

    demand_forecast_tracking:
      - metric: forecast_accuracy_mape
        description: "Mean Absolute Percentage Error"
        calculation: "AVG(|actual - forecast| / actual)"
        target: "< 15%"
        measurement_frequency: daily
        granularity: [product, location, customer_segment]
        
      - metric: forecast_bias
        description: "Systematic over/under prediction"
        calculation: "AVG((forecast - actual) / actual)"
        target: "between -5% and +5%"
        measurement_frequency: daily
        
      - metric: forecast_coverage
        description: "% of actuals within confidence interval"
        calculation: "COUNT(actual in CI) / COUNT(*)"
        target: ">= 95% for 95% CI"
        measurement_frequency: weekly

    schedule_tracking:
      - metric: schedule_adherence
        description: "% of jobs completed on schedule"
        calculation: "COUNT(on_time) / COUNT(scheduled)"
        target: ">= 90%"
        measurement_frequency: daily
        
      - metric: promise_date_accuracy
        description: "% of promise dates met"
        calculation: "COUNT(shipped <= promised) / COUNT(*)"
        target: ">= 95%"
        measurement_frequency: daily
        
      - metric: estimated_vs_actual_hours
        description: "Processing time accuracy"
        calculation: "AVG(|estimated - actual| / actual)"
        target: "< 10%"
        measurement_frequency: daily

    capacity_tracking:
      - metric: utilization_forecast_accuracy
        description: "Accuracy of utilization predictions"
        calculation: "AVG(|predicted_util - actual_util|)"
        target: "< 5 percentage points"
        measurement_frequency: daily
        
      - metric: bottleneck_prediction_accuracy
        description: "True positive rate for bottleneck alerts"
        calculation: "TP / (TP + FP)"
        target: ">= 80%"
        measurement_frequency: weekly

  # ═══════════════════════════════════════════════════════════════════
  # AUTOMATED FEEDBACK COLLECTION
  # ═══════════════════════════════════════════════════════════════════
  automated_feedback:

    order_completion:
      trigger: order.completed
      collect:
        - actual_ship_date
        - actual_processing_hours_by_operation
        - actual_yield
        - quality_issues_encountered
        - delays_and_reasons
      compare_to:
        - predicted_ship_date
        - estimated_processing_hours
        - expected_yield
      store_in: feedback_orders

    work_order_completion:
      trigger: work_order.completed
      collect:
        - actual_start_time
        - actual_end_time
        - actual_setup_time
        - actual_run_time
        - actual_yield_pct
        - scrap_pct
        - downtime_minutes
        - downtime_reason
        - operator_id
        - material_issues
      compare_to:
        - scheduled_start_time
        - scheduled_end_time
        - estimated_setup_time
        - estimated_run_time
        - expected_yield
      store_in: feedback_work_orders

    quote_outcome:
      trigger: quote.accepted OR quote.declined OR quote.expired
      collect:
        - outcome
        - days_to_decision
        - final_order_value
        - lines_accepted
        - lines_declined
        - decline_reason (if available)
        - competitive_loss_to (if known)
      compare_to:
        - predicted_conversion_probability
        - predicted_decision_date
      store_in: feedback_quotes

    capacity_actual:
      trigger: end_of_shift
      collect:
        - work_center_id
        - actual_hours_worked
        - actual_output
        - unplanned_downtime
        - headcount
      compare_to:
        - predicted_hours
        - predicted_output
        - predicted_availability
      store_in: feedback_capacity

  # ═══════════════════════════════════════════════════════════════════
  # MODEL RETRAINING
  # ═══════════════════════════════════════════════════════════════════
  model_retraining:

    demand_model:
      trigger_conditions:
        - schedule: "weekly on Sunday 02:00 UTC"
        - performance: "MAPE > 20% for 3 consecutive days"
        - data: "1000+ new orders since last training"
      training_data:
        source: feedback_orders + order_history
        window: 24_months
        validation_split: last_3_months
      retraining_pipeline:
        - data_extraction
        - feature_engineering
        - model_training (ensemble)
        - validation
        - shadow_deployment
        - A/B_test (if significant change)
        - production_deployment
      rollback_criteria:
        - validation_mape > current_production_mape * 1.1
        - production_mape > baseline * 1.2 for 24 hours

    scheduling_model:
      trigger_conditions:
        - schedule: "daily at 03:00 UTC"
        - performance: "schedule_adherence < 85%"
      training_data:
        source: feedback_work_orders
        window: 12_months
      retraining_pipeline:
        - data_extraction
        - feature_engineering
        - model_training
        - constraint_validation
        - shadow_deployment
        - production_deployment

    quote_conversion_model:
      trigger_conditions:
        - schedule: "weekly on Saturday"
        - performance: "AUC < 0.75"
      training_data:
        source: feedback_quotes
        window: 18_months
        balance: oversample_minority

  # ═══════════════════════════════════════════════════════════════════
  # FEEDBACK VISUALIZATION
  # ═══════════════════════════════════════════════════════════════════
  feedback_dashboards:

    model_performance_dashboard:
      metrics:
        - forecast_accuracy_trend
        - schedule_adherence_trend
        - model_drift_indicators
        - feature_importance_changes
        - error_distribution_by_segment
      refresh: hourly
      alerts:
        - accuracy_degradation
        - data_quality_issues
        - concept_drift_detected

    feedback_analysis_dashboard:
      views:
        - prediction_vs_actual_scatter
        - error_by_customer_segment
        - error_by_product_category
        - temporal_error_patterns
        - operator_performance_impact
      drill_down:
        - individual_prediction_explanation
        - error_root_cause_analysis
```

---

## 5. Human Override

```yaml
human_override:

  # ═══════════════════════════════════════════════════════════════════
  # OVERRIDE CAPABILITIES
  # ═══════════════════════════════════════════════════════════════════
  override_types:

    schedule_override:
      - override_id: OVR-SCH-001
        name: manual_job_priority
        description: "Override AI-calculated priority"
        ui_location: work_order_detail
        input:
          priority_score: number (1-100)
          reason: text (required)
          expiration: datetime (optional)
        effect:
          - "Job priority locked to manual value"
          - "AI respects priority in scheduling"
          - "Override visible in schedule view"
        audit:
          - user_id
          - timestamp
          - previous_value
          - new_value
          - reason
        permissions: ["SCHEDULER", "PRODUCTION_MANAGER", "PLANT_MANAGER"]

      - override_id: OVR-SCH-002
        name: manual_job_assignment
        description: "Assign job to specific work center/operator"
        ui_location: scheduling_board
        input:
          work_order_id: uuid
          work_center_id: uuid
          operator_id: uuid (optional)
          scheduled_start: datetime
          reason: text
        effect:
          - "AI treats assignment as fixed constraint"
          - "Surrounding schedule optimized around fixed job"
        validations:
          - work_center_capability_check
          - operator_qualification_check
          - capacity_availability_warning
        permissions: ["SCHEDULER", "PRODUCTION_MANAGER"]

      - override_id: OVR-SCH-003
        name: lock_schedule_window
        description: "Freeze schedule for time period"
        ui_location: schedule_toolbar
        input:
          work_center_id: uuid (or ALL)
          lock_start: datetime
          lock_end: datetime
          reason: text
        effect:
          - "AI will not reschedule jobs in locked window"
          - "New jobs scheduled around locked period"
        permissions: ["PRODUCTION_MANAGER", "PLANT_MANAGER"]

      - override_id: OVR-SCH-004
        name: expedite_order
        description: "Mark order for expedited processing"
        ui_location: order_detail
        input:
          order_id: uuid
          new_ship_date: date
          reason: text
          approved_by: uuid (if cost involved)
        effect:
          - "Order priority elevated"
          - "Schedule regenerated with constraint"
          - "Impact analysis shown to user"
        validations:
          - feasibility_check
          - impact_on_other_orders
          - cost_calculation
        permissions: ["SALES_MANAGER", "PRODUCTION_MANAGER"]

    capacity_override:
      - override_id: OVR-CAP-001
        name: adjust_work_center_capacity
        description: "Temporarily adjust available capacity"
        ui_location: capacity_dashboard
        input:
          work_center_id: uuid
          date_range: object
          capacity_multiplier: number (0.0-2.0)
          reason: text
        effect:
          - "AI uses adjusted capacity for scheduling"
          - "Alerts generated if overcommitted"
        use_cases:
          - "Planned maintenance"
          - "Overtime availability"
          - "Machine issue known but not logged"
        permissions: ["PRODUCTION_MANAGER", "PLANT_MANAGER"]

      - override_id: OVR-CAP-002
        name: block_time
        description: "Block capacity for non-production use"
        ui_location: capacity_calendar
        input:
          work_center_id: uuid
          start_time: datetime
          end_time: datetime
          reason: text
          block_type: "MAINTENANCE|TRAINING|SETUP|OTHER"
        effect:
          - "Capacity unavailable for scheduling"
          - "Existing jobs may be rescheduled"
        permissions: ["SCHEDULER", "PRODUCTION_MANAGER"]

      - override_id: OVR-CAP-003
        name: labor_override
        description: "Override labor availability"
        ui_location: labor_planning
        input:
          date: date
          shift: string
          role: string
          headcount: number
          reason: text
        effect:
          - "AI uses override for capacity planning"
          - "Scheduling constrained by labor"
        permissions: ["PRODUCTION_MANAGER", "HR_MANAGER"]

    forecast_override:
      - override_id: OVR-FOR-001
        name: demand_adjustment
        description: "Adjust AI demand forecast"
        ui_location: demand_planning
        input:
          product_id: uuid (or category)
          location_id: uuid
          date_range: object
          adjustment_type: "ABSOLUTE|PERCENTAGE|MULTIPLIER"
          adjustment_value: number
          reason: text
          source: "CUSTOMER_INTEL|MARKET_INFO|PROMOTION|OTHER"
        effect:
          - "Adjusted forecast used for planning"
          - "Original AI forecast preserved for comparison"
          - "Adjustment decays over time (optional)"
        permissions: ["SALES_MANAGER", "DEMAND_PLANNER"]

      - override_id: OVR-FOR-002
        name: quote_conversion_override
        description: "Override predicted quote conversion"
        ui_location: quote_detail
        input:
          quote_id: uuid
          override_probability: number (0.0-1.0)
          reason: text
        effect:
          - "Override used in demand calculations"
          - "Inventory reservations adjusted"
        permissions: ["SALES_REP", "SALES_MANAGER"]

    promise_date_override:
      - override_id: OVR-PRO-001
        name: promise_date_adjustment
        description: "Override AI-calculated promise date"
        ui_location: order_entry
        input:
          order_id: uuid
          line_id: uuid
          ai_suggested_date: date
          override_date: date
          reason: text
          risk_acknowledged: boolean
        effect:
          - "Override date shown to customer"
          - "Risk flag if date earlier than AI suggests"
          - "Scheduling prioritized to meet override"
        validations:
          - feasibility_warning (if impossible)
          - impact_analysis
        permissions: ["SALES_REP", "SALES_MANAGER", "CUSTOMER_SERVICE"]

  # ═══════════════════════════════════════════════════════════════════
  # OVERRIDE CONTROLS
  # ═══════════════════════════════════════════════════════════════════
  override_controls:

    approval_requirements:
      - condition: "promise_date_override < AI_date - 5_days"
        requires: SALES_MANAGER_APPROVAL
        
      - condition: "capacity_override creates overload"
        requires: PLANT_MANAGER_APPROVAL
        
      - condition: "expedite affects 5+ other orders"
        requires: PRODUCTION_MANAGER_APPROVAL
        
      - condition: "forecast_adjustment > 50%"
        requires: DEMAND_PLANNER_APPROVAL

    override_limits:
      - limit: "max_priority_overrides_per_day"
        value: 10
        scope: per_user
        
      - limit: "max_active_forecast_overrides"
        value: 50
        scope: per_location
        
      - limit: "override_duration_max_days"
        value: 90
        scope: per_override

    override_expiration:
      - type: time_based
        default: 30_days
        configurable: true
        
      - type: event_based
        triggers:
          - order_shipped
          - work_order_completed
          - model_retrained
          
      - type: manual_removal
        requires_reason: true

  # ═══════════════════════════════════════════════════════════════════
  # OVERRIDE FEEDBACK
  # ═══════════════════════════════════════════════════════════════════
  override_feedback:

    outcome_tracking:
      - track: "override_outcome"
        for_each: override
        collect:
          - actual_result
          - ai_would_have_been_better: boolean
          - override_was_necessary: boolean
        used_for:
          - user_feedback_display
          - model_improvement
          - override_policy_tuning

    override_effectiveness_report:
      metrics:
        - override_count_by_type
        - override_count_by_user
        - override_success_rate
        - ai_vs_override_accuracy
        - override_cost_impact
      frequency: weekly
      recipients: ["PLANT_MANAGER", "AI_TEAM"]

    learning_from_overrides:
      process:
        - "Cluster similar overrides"
        - "Identify patterns AI missed"
        - "Generate candidate features"
        - "Test feature effectiveness"
        - "Incorporate into model"
      goal: "Reduce need for common overrides"
```

---

## 6. Training Signals

```yaml
training_signals:

  # ═══════════════════════════════════════════════════════════════════
  # DEMAND FORECASTING SIGNALS
  # ═══════════════════════════════════════════════════════════════════
  demand_forecasting:

    primary_labels:
      - label: daily_demand_actual
        description: "Actual daily demand by product/location"
        source: orders_completed
        calculation: "SUM(quantity) GROUP BY product_id, location_id, date"
        granularity: daily
        history_required: 24_months

      - label: weekly_demand_actual
        description: "Actual weekly demand aggregated"
        source: orders_completed
        calculation: "SUM(quantity) GROUP BY product_id, location_id, week"
        granularity: weekly
        history_required: 36_months

    positive_signals:
      - signal: order_placed
        description: "Confirmed demand signal"
        weight: 1.0
        features:
          - customer_id
          - product_id
          - quantity
          - order_date
          - was_from_quote
          - was_repeat_order

      - signal: quote_accepted
        description: "Demand materialized from quote"
        weight: 1.0
        features:
          - quote_id
          - customer_id
          - days_to_accept
          - accepted_value

    negative_signals:
      - signal: quote_declined
        description: "Demand that didn't materialize"
        weight: 0.5
        features:
          - quote_id
          - decline_reason
          - competitive_loss
          - price_gap (if known)

      - signal: quote_expired
        description: "Quote that timed out"
        weight: 0.3
        features:
          - quote_id
          - days_open
          - engagement_level

    contextual_signals:
      - signal: price_change
        description: "Price changes affecting demand"
        features:
          - product_id
          - old_price
          - new_price
          - change_date
          - demand_before
          - demand_after

      - signal: competitor_event
        description: "Known competitor activity"
        features:
          - event_type
          - market_segment
          - date
          - estimated_impact

  # ═══════════════════════════════════════════════════════════════════
  # SCHEDULING OPTIMIZATION SIGNALS
  # ═══════════════════════════════════════════════════════════════════
  scheduling_optimization:

    primary_labels:
      - label: job_completion_time
        description: "Actual job processing time"
        source: work_orders_completed
        fields:
          - actual_setup_time
          - actual_run_time
          - actual_total_time
          - delay_minutes
          - delay_reason

      - label: schedule_adherence
        description: "On-time completion binary"
        source: work_orders_completed
        calculation: "actual_completion <= scheduled_completion"

      - label: optimal_sequence
        description: "Expert-validated optimal job sequences"
        source: scheduler_feedback
        capture: "When scheduler makes manual optimization"

    efficiency_signals:
      - signal: work_order_completed
        description: "Job completion data"
        features:
          - work_order_id
          - work_center_id
          - operator_id
          - product_id
          - processing_type
          - scheduled_start
          - actual_start
          - scheduled_end
          - actual_end
          - setup_time_actual
          - run_rate_actual (lbs/hr)
          - yield_pct
          - quality_result
          - machine_state_before
          - previous_job_id

      - signal: changeover_completed
        description: "Setup/changeover timing"
        features:
          - work_center_id
          - from_product
          - to_product
          - from_thickness
          - to_thickness
          - from_width
          - to_width
          - setup_time_actual
          - setup_time_standard
          - operator_id

    disruption_signals:
      - signal: machine_breakdown
        description: "Unplanned downtime event"
        features:
          - work_center_id
          - start_time
          - end_time
          - duration_minutes
          - failure_type
          - repair_action
          - parts_replaced
          - jobs_affected

      - signal: operator_absence
        description: "Unplanned labor shortage"
        features:
          - date
          - shift
          - role
          - expected_headcount
          - actual_headcount
          - impact_on_schedule

      - signal: material_shortage
        description: "Material not available for job"
        features:
          - work_order_id
          - product_id
          - expected_availability
          - actual_availability
          - delay_caused

    quality_signals:
      - signal: quality_hold
        description: "Job held for quality review"
        features:
          - work_order_id
          - hold_start
          - hold_end
          - hold_reason
          - resolution

      - signal: rework_required
        description: "Job requires reprocessing"
        features:
          - work_order_id
          - original_output
          - rework_output
          - rework_time
          - defect_type

  # ═══════════════════════════════════════════════════════════════════
  # QUOTE CONVERSION SIGNALS
  # ═══════════════════════════════════════════════════════════════════
  quote_conversion:

    primary_labels:
      - label: quote_outcome
        description: "Final quote disposition"
        source: quotes_table
        values:
          - ACCEPTED (positive class)
          - DECLINED (negative class)
          - EXPIRED (negative class)
          - REVISED (excluded or special handling)

      - label: time_to_decision
        description: "Days from quote sent to outcome"
        source: quotes_table
        calculation: "DATEDIFF(outcome_date, sent_date)"

    engagement_signals:
      - signal: quote_viewed
        description: "Customer viewed quote"
        features:
          - quote_id
          - view_timestamp
          - view_duration
          - pages_viewed
          - viewer_role

      - signal: quote_downloaded
        description: "Quote PDF downloaded"
        features:
          - quote_id
          - download_timestamp
          - downloader

      - signal: quote_shared
        description: "Quote forwarded to others"
        features:
          - quote_id
          - shared_with_count

      - signal: customer_question
        description: "Customer asked about quote"
        features:
          - quote_id
          - question_topic
          - response_time

    outcome_signals:
      - signal: partial_acceptance
        description: "Customer accepted subset of lines"
        features:
          - quote_id
          - lines_quoted
          - lines_accepted
          - acceptance_pct

      - signal: price_negotiation
        description: "Customer requested price adjustment"
        features:
          - quote_id
          - original_price
          - requested_price
          - final_price
          - negotiation_outcome

      - signal: competitive_loss
        description: "Lost to competitor"
        features:
          - quote_id
          - competitor_name (if known)
          - competitor_price (if known)
          - loss_reason

  # ═══════════════════════════════════════════════════════════════════
  # CAPACITY PREDICTION SIGNALS
  # ═══════════════════════════════════════════════════════════════════
  capacity_prediction:

    primary_labels:
      - label: actual_utilization
        description: "Actual work center utilization"
        source: production_log
        calculation: "productive_hours / available_hours"
        granularity: daily_by_shift

      - label: actual_throughput
        description: "Actual output achieved"
        source: production_log
        calculation: "SUM(output_lbs) GROUP BY work_center, date"

    availability_signals:
      - signal: shift_actual
        description: "Actual shift worked"
        features:
          - work_center_id
          - date
          - shift
          - scheduled_hours
          - actual_hours
          - productive_hours
          - downtime_hours
          - downtime_breakdown

      - signal: labor_actual
        description: "Actual labor attendance"
        features:
          - date
          - shift
          - location_id
          - role
          - scheduled
          - present
          - overtime_worked

    maintenance_signals:
      - signal: pm_completed
        description: "Preventive maintenance performed"
        features:
          - work_center_id
          - pm_date
          - pm_type
          - duration
          - findings
          - parts_replaced

      - signal: breakdown_occurred
        description: "Unplanned maintenance event"
        features:
          - work_center_id
          - failure_date
          - failure_mode
          - mttr (mean time to repair)
          - root_cause
          - corrective_action

  # ═══════════════════════════════════════════════════════════════════
  # TRAINING DATA QUALITY
  # ═══════════════════════════════════════════════════════════════════
  data_quality:

    validation_rules:
      - rule: completeness
        check: "no null values in required fields"
        action: "exclude or impute"
        
      - rule: temporal_consistency
        check: "start_time < end_time"
        action: "exclude"
        
      - rule: value_range
        check: "yield_pct between 0 and 100"
        action: "cap or exclude"
        
      - rule: referential_integrity
        check: "work_center_id exists"
        action: "exclude"

    outlier_handling:
      - method: isolation_forest
        apply_to: [processing_times, yields]
        action: flag_for_review
        
      - method: iqr
        apply_to: [order_values]
        action: cap_at_boundary

    class_balancing:
      - for_model: quote_conversion
        technique: SMOTE
        target_ratio: 0.4
        
      - for_model: bottleneck_prediction
        technique: class_weights
        weight_formula: "1 / class_frequency"

    data_versioning:
      - version_control: true
      - snapshot_frequency: weekly
      - retention: 12_months
      - reproducibility: hash_all_training_sets
```

---

*Document generated for AI-build Phase 15: Capacity Planning AI*
