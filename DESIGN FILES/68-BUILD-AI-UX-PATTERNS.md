# 68-BUILD-AI-UX-PATTERNS

> AI suggestion UI patterns for Planning/Scheduling and Order Intake apps.

---

## 1. ai_suggestion_points

```json
[
  {
    "app": "planning_scheduling_app",
    "screen_id": "schedule_board",
    "trigger": "job_unassigned_for_10min",
    "suggestion_type": "assignment",
    "required_inputs": ["job_id", "work_center_loads", "operator_skills", "job_priority"],
    "shown_as": "badge"
  },
  {
    "app": "planning_scheduling_app",
    "screen_id": "schedule_board",
    "trigger": "drag_job_to_slot",
    "suggestion_type": "risk_alert",
    "required_inputs": ["job_id", "target_slot", "downstream_jobs", "due_dates"],
    "shown_as": "popover"
  },
  {
    "app": "planning_scheduling_app",
    "screen_id": "schedule_board",
    "trigger": "capacity_exceeds_threshold",
    "suggestion_type": "risk_alert",
    "required_inputs": ["work_center_id", "date_range", "scheduled_hours", "capacity_hours"],
    "shown_as": "inline_text"
  },
  {
    "app": "planning_scheduling_app",
    "screen_id": "schedule_board",
    "trigger": "job_card_hover_2sec",
    "suggestion_type": "assignment",
    "required_inputs": ["job_id", "available_operators", "historical_performance"],
    "shown_as": "popover"
  },
  {
    "app": "planning_scheduling_app",
    "screen_id": "schedule_board",
    "trigger": "daily_plan_load",
    "suggestion_type": "assignment",
    "required_inputs": ["unassigned_jobs", "work_center_availability", "priority_weights"],
    "shown_as": "side_panel"
  },
  {
    "app": "planning_scheduling_app",
    "screen_id": "schedule_board",
    "trigger": "machine_breakdown_event",
    "suggestion_type": "risk_alert",
    "required_inputs": ["affected_jobs", "alternative_work_centers", "due_dates"],
    "shown_as": "side_panel"
  },
  {
    "app": "planning_scheduling_app",
    "screen_id": "capacity_heatmap",
    "trigger": "week_view_render",
    "suggestion_type": "risk_alert",
    "required_inputs": ["weekly_loads", "capacity_limits", "pending_quotes"],
    "shown_as": "inline_text"
  },
  {
    "app": "planning_scheduling_app",
    "screen_id": "job_detail_modal",
    "trigger": "manual_date_change",
    "suggestion_type": "risk_alert",
    "required_inputs": ["job_id", "new_date", "downstream_dependencies", "customer_priority"],
    "shown_as": "popover"
  },
  {
    "app": "order_intake_app",
    "screen_id": "order_entry_form",
    "trigger": "customer_requests_date",
    "suggestion_type": "due_date",
    "required_inputs": ["line_items", "processing_types", "work_center_loads", "customer_tier"],
    "shown_as": "inline_text"
  },
  {
    "app": "order_intake_app",
    "screen_id": "order_entry_form",
    "trigger": "line_item_added",
    "suggestion_type": "due_date",
    "required_inputs": ["product_id", "quantity", "processing_ops", "current_queue_depth"],
    "shown_as": "badge"
  },
  {
    "app": "order_intake_app",
    "screen_id": "order_entry_form",
    "trigger": "requested_date_before_suggested",
    "suggestion_type": "risk_alert",
    "required_inputs": ["requested_date", "suggested_date", "expedite_cost", "success_probability"],
    "shown_as": "popover"
  },
  {
    "app": "order_intake_app",
    "screen_id": "quote_builder",
    "trigger": "quote_line_complete",
    "suggestion_type": "due_date",
    "required_inputs": ["line_items", "historical_lead_times", "seasonal_factors"],
    "shown_as": "inline_text"
  },
  {
    "app": "order_intake_app",
    "screen_id": "quote_builder",
    "trigger": "total_value_exceeds_threshold",
    "suggestion_type": "risk_alert",
    "required_inputs": ["quote_value", "customer_credit", "payment_history"],
    "shown_as": "badge"
  },
  {
    "app": "order_intake_app",
    "screen_id": "order_review",
    "trigger": "submit_button_focus",
    "suggestion_type": "due_date",
    "required_inputs": ["all_line_items", "aggregate_processing_time", "shipping_distance"],
    "shown_as": "side_panel"
  },
  {
    "app": "order_intake_app",
    "screen_id": "customer_lookup",
    "trigger": "customer_selected",
    "suggestion_type": "risk_alert",
    "required_inputs": ["customer_id", "open_ar", "payment_terms", "credit_limit"],
    "shown_as": "badge"
  },
  {
    "app": "order_intake_app",
    "screen_id": "reorder_flow",
    "trigger": "previous_order_loaded",
    "suggestion_type": "due_date",
    "required_inputs": ["previous_lead_time", "current_capacity", "product_availability"],
    "shown_as": "inline_text"
  }
]
```

---

## 2. ai_feedback_loop_UI

```json
{
  "accept_patterns": {
    "one_click_accept": {
      "element": "IconButton",
      "icon": "CheckCircleOutline",
      "tooltip": "Accept suggestion",
      "action": "apply_suggestion",
      "feedback_captured": {
        "event": "ai_suggestion_accepted",
        "payload": ["suggestion_id", "suggestion_type", "user_id", "timestamp"]
      }
    },
    "accept_with_modification": {
      "element": "Button",
      "label": "Apply & Edit",
      "action": "apply_then_open_editor",
      "feedback_captured": {
        "event": "ai_suggestion_modified",
        "payload": ["suggestion_id", "original_value", "final_value", "user_id", "timestamp"]
      }
    }
  },
  "override_patterns": {
    "dismiss": {
      "element": "IconButton",
      "icon": "Close",
      "tooltip": "Dismiss",
      "action": "hide_suggestion",
      "feedback_captured": {
        "event": "ai_suggestion_dismissed",
        "payload": ["suggestion_id", "suggestion_type", "user_id", "timestamp"]
      }
    },
    "override_with_reason": {
      "element": "Menu",
      "trigger": "MoreVert icon click",
      "options": [
        { "label": "Customer requested specific date", "reason_code": "customer_override" },
        { "label": "Expedite approved", "reason_code": "expedite" },
        { "label": "Capacity not reflected", "reason_code": "data_stale" },
        { "label": "Other", "reason_code": "other", "requires_text": true }
      ],
      "feedback_captured": {
        "event": "ai_suggestion_overridden",
        "payload": ["suggestion_id", "reason_code", "reason_text", "user_chosen_value", "user_id", "timestamp"]
      }
    },
    "never_show_this": {
      "element": "MenuItem",
      "label": "Don't suggest this again",
      "action": "add_to_suppression_list",
      "scope": ["user", "customer", "product"],
      "feedback_captured": {
        "event": "ai_suggestion_suppressed",
        "payload": ["suggestion_id", "suppression_scope", "user_id", "timestamp"]
      }
    }
  },
  "passive_feedback": {
    "outcome_tracking": {
      "description": "Track if accepted suggestion led to on-time completion",
      "events_monitored": ["job_completed", "shipment_delivered"],
      "comparison": "suggested_date vs actual_date",
      "stored_as": "ai_suggestion_outcome"
    },
    "hover_without_action": {
      "description": "User saw suggestion but took no action",
      "timeout_ms": 5000,
      "event": "ai_suggestion_ignored",
      "payload": ["suggestion_id", "duration_visible_ms"]
    }
  },
  "feedback_storage": {
    "table": "ai_feedback_log",
    "retention_days": 365,
    "used_for": ["model_retraining", "suggestion_quality_metrics", "user_preference_learning"]
  },
  "ui_components": {
    "suggestion_card": {
      "structure": [
        { "region": "header", "contains": ["suggestion_type_icon", "confidence_badge"] },
        { "region": "body", "contains": ["suggestion_text", "explanation_link"] },
        { "region": "actions", "contains": ["accept_button", "dismiss_button", "more_menu"] }
      ],
      "variants": {
        "compact": "badge + popover on click",
        "inline": "single line with accept/dismiss icons",
        "expanded": "full card in side panel"
      }
    },
    "confidence_indicator": {
      "type": "chip",
      "levels": [
        { "range": [0.9, 1.0], "label": "High confidence", "color": "success" },
        { "range": [0.7, 0.9], "label": "Moderate", "color": "warning" },
        { "range": [0.0, 0.7], "label": "Low confidence", "color": "default" }
      ]
    },
    "batch_actions": {
      "select_all_suggestions": true,
      "bulk_accept": true,
      "bulk_dismiss": true
    }
  }
}
```

---

## 3. ai_explanations

### Explanation Templates by Suggestion Type

| suggestion_type | template_id | template_text |
|-----------------|-------------|---------------|
| due_date | due_date_capacity | "Based on current {work_center} queue ({queue_depth} jobs), estimated completion is {suggested_date}." |
| due_date | due_date_historical | "Similar orders for {customer} averaged {avg_lead_days} days. Suggested ship date: {suggested_date}." |
| due_date | due_date_processing | "Processing requires {total_hours}h across {num_ops} operations. Earliest available slot: {suggested_date}." |
| due_date | due_date_combined | "Factoring {num_line_items} items, current load, and shipping to {destination}: {suggested_date}." |
| assignment | assign_skill_match | "Operator {operator_name} has completed {similar_job_count} similar jobs with {success_rate}% on-time." |
| assignment | assign_availability | "{operator_name} has {available_hours}h open on {target_date} and is certified for {work_center}." |
| assignment | assign_load_balance | "Assigning to {work_center} balances load: currently at {current_util}% vs. {alt_util}% at alternatives." |
| assignment | assign_batch_group | "Grouping with {batch_count} similar jobs reduces setup time by ~{saved_minutes} min." |
| risk_alert | risk_late_cascade | "Moving this job may delay {downstream_count} dependent jobs, risking {at_risk_orders} orders." |
| risk_alert | risk_overload | "{work_center} is at {utilization}% for {date_range}. Adding this job exceeds safe capacity." |
| risk_alert | risk_promise_miss | "Requested date {requested_date} has {success_prob}% probability based on current load." |
| risk_alert | risk_credit | "Customer has {open_ar} in open AR against {credit_limit} limit. Review before confirming." |
| risk_alert | risk_expedite | "Expediting adds ~${expedite_cost} and requires bumping {bumped_job_count} lower-priority jobs." |
| risk_alert | risk_inventory | "Allocated material may not arrive until {material_eta}. Requested date at risk." |

### Explanation UI Patterns

```json
{
  "inline_explanation": {
    "shown_when": "suggestion rendered",
    "max_length_chars": 120,
    "truncation": "ellipsis with 'See more' link"
  },
  "expanded_explanation": {
    "trigger": "click 'Why?' link or info icon",
    "shown_in": "popover or side panel",
    "sections": [
      { "label": "Factors", "content": "list of inputs used" },
      { "label": "Calculation", "content": "simplified formula or logic" },
      { "label": "Confidence", "content": "percentage with historical accuracy" }
    ]
  },
  "explanation_footer": {
    "text": "AI suggestions are advisory. Final decisions are yours.",
    "link": { "label": "Learn how this works", "href": "/help/ai-suggestions" }
  }
}
```

### Variable Definitions

| variable | source |
|----------|--------|
| {work_center} | job.assigned_work_center or suggested_work_center |
| {queue_depth} | count of jobs ahead in work_center queue |
| {suggested_date} | ai_engine.calculate_due_date() |
| {avg_lead_days} | historical_orders.filter(customer, product).avg(lead_time_days) |
| {total_hours} | sum(job.operations.estimated_hours) |
| {num_ops} | job.operations.length |
| {operator_name} | operator.display_name |
| {similar_job_count} | operator_history.filter(similar_job_type).count |
| {success_rate} | operator_history.on_time_percentage |
| {available_hours} | operator_schedule.available_hours(date) |
| {current_util} | work_center.utilization_percent(date) |
| {alt_util} | alternative_work_centers.avg(utilization_percent) |
| {batch_count} | batch_optimizer.similar_jobs_count |
| {saved_minutes} | batch_optimizer.estimated_setup_savings |
| {downstream_count} | dependency_graph.count_affected_jobs(job_id) |
| {at_risk_orders} | dependency_graph.count_affected_orders(job_id) |
| {utilization} | work_center.utilization_percent(date_range) |
| {success_prob} | ai_engine.date_feasibility_score(requested_date) |
| {open_ar} | customer.open_ar_balance |
| {credit_limit} | customer.credit_limit |
| {expedite_cost} | expedite_calculator.estimate(job_id) |
| {bumped_job_count} | expedite_calculator.jobs_affected(job_id) |
| {material_eta} | inventory.expected_arrival(allocated_lot) |

---

## 4. shown_as UI Specifications

| shown_as | component | behavior |
|----------|-----------|----------|
| badge | `<Chip size="small">` | Appears on job card corner or field label; click opens popover |
| popover | `<Popover>` | Anchored to trigger element; auto-dismiss on outside click; contains suggestion_card |
| side_panel | `<Drawer anchor="right">` | 320px width; persists until closed; supports multiple suggestions list |
| inline_text | `<Typography variant="caption">` | Rendered below or beside input field; non-blocking; muted color |

---

## 5. Accessibility & Non-Intrusiveness

```json
{
  "non_intrusive_rules": [
    { "rule": "no_modal_dialogs", "description": "Suggestions never block user workflow" },
    { "rule": "no_auto_apply", "description": "All suggestions require explicit user action" },
    { "rule": "dismiss_persists", "description": "Dismissed suggestions don't reappear same session" },
    { "rule": "animation_subtle", "description": "Fade-in only, no bounce or shake" },
    { "rule": "sound_off", "description": "No audio alerts for suggestions" }
  ],
  "accessibility": [
    { "requirement": "aria_live_polite", "applies_to": "inline_text suggestions" },
    { "requirement": "keyboard_navigable", "applies_to": "all suggestion actions" },
    { "requirement": "focus_trap", "applies_to": "side_panel when open" },
    { "requirement": "screen_reader_announce", "applies_to": "new suggestion count badge" },
    { "requirement": "color_not_sole_indicator", "applies_to": "risk levels include icons" }
  ],
  "user_preferences": {
    "stored_in": "user_settings.ai_preferences",
    "options": [
      { "key": "ai_suggestions_enabled", "type": "boolean", "default": true },
      { "key": "suggestion_frequency", "type": "enum", "values": ["all", "high_confidence_only", "critical_only"], "default": "all" },
      { "key": "auto_expand_panel", "type": "boolean", "default": false },
      { "key": "show_explanations", "type": "boolean", "default": true }
    ]
  }
}
```

---

## 6. Integration Points

| system | integration |
|--------|-------------|
| ai_engine | POST /api/ai/suggestions with context payload; returns suggestion[] |
| feedback_service | POST /api/ai/feedback with feedback event |
| user_settings | GET/PUT /api/users/{id}/settings.ai_preferences |
| analytics | Events streamed to analytics_app for suggestion effectiveness dashboards |
| help_system | Deep links to /help/ai-suggestions for explanation pages |
