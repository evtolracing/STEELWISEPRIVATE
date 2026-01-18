# 76-BUILD-AI-OPS-ASSISTANT

> Structured models for AI assistance across CSR, Planning, Inventory, and Portal personas.

---

## 1. assistant_modes

```json
[
  {
    "id": "csr_assist",
    "label": "Sales & Quoting Assistant",
    "persona": "CSR",
    "description": "Helps CSRs with quoting, due date promises, customer lookups, and order entry",
    "primary_intent": "quote_and_promise",
    "tone": "professional, helpful, customer-focused",
    "surfaces": ["order_intake_app", "quote_builder", "customer_lookup", "order_detail"],
    "capabilities": [
      "generate_quote_pricing",
      "calculate_lead_times",
      "suggest_due_dates",
      "lookup_customer_history",
      "check_inventory_availability",
      "recommend_substitutes",
      "draft_customer_communications"
    ],
    "context_sources": ["customer", "order", "product_catalog", "pricing_rules", "capacity_snapshot"],
    "default_active": true
  },
  {
    "id": "planning_assist",
    "label": "Planning & Scheduling Assistant",
    "persona": "PLANNER",
    "description": "Helps planners with routing, scheduling, capacity balancing, and bottleneck resolution",
    "primary_intent": "optimize_schedule",
    "tone": "analytical, concise, action-oriented",
    "surfaces": ["planning_app", "schedule_board", "capacity_heatmap", "job_detail"],
    "capabilities": [
      "suggest_job_routing",
      "recommend_operator_assignment",
      "identify_bottlenecks",
      "propose_reschedule_options",
      "calculate_capacity_impact",
      "suggest_batch_grouping",
      "alert_sla_risks"
    ],
    "context_sources": ["jobs", "work_centers", "operators", "capacity", "schedule", "sla_targets"],
    "default_active": true
  },
  {
    "id": "inventory_assist",
    "label": "Inventory & Logistics Assistant",
    "persona": "INVENTORY",
    "description": "Helps with transfers, stocking decisions, reorder points, and allocation",
    "primary_intent": "optimize_inventory",
    "tone": "precise, data-driven, efficient",
    "surfaces": ["inventory_app", "transfer_request", "receiving_desk", "stock_alerts"],
    "capabilities": [
      "recommend_transfers",
      "suggest_reorder_quantities",
      "identify_slow_movers",
      "allocate_scarce_inventory",
      "predict_stockouts",
      "optimize_put_away",
      "match_incoming_to_orders"
    ],
    "context_sources": ["inventory", "demand_forecast", "open_orders", "supplier_lead_times", "locations"],
    "default_active": true
  },
  {
    "id": "portal_assist",
    "label": "Customer Portal Assistant",
    "persona": "CUSTOMER_PORTAL",
    "description": "Answers customer questions about RFQs, orders, quotes, and delivery",
    "primary_intent": "customer_self_service",
    "tone": "friendly, clear, helpful, brand-aligned",
    "surfaces": ["portal_app", "rfq_builder", "order_status", "quote_review", "help_chat"],
    "capabilities": [
      "answer_rfq_questions",
      "explain_quote_details",
      "provide_order_status",
      "clarify_lead_times",
      "guide_rfq_submission",
      "explain_pricing_structure",
      "escalate_to_human"
    ],
    "context_sources": ["customer_orders", "customer_quotes", "customer_rfqs", "public_faq", "product_catalog"],
    "default_active": true,
    "requires_customer_auth": true
  },
  {
    "id": "manager_assist",
    "label": "Operations Manager Assistant",
    "persona": "MANAGER",
    "description": "Provides operational insights, exception summaries, and decision support",
    "primary_intent": "operational_visibility",
    "tone": "executive, summarized, actionable",
    "surfaces": ["dashboard", "analytics_app", "exception_queue", "reports"],
    "capabilities": [
      "summarize_daily_operations",
      "highlight_exceptions",
      "explain_metric_changes",
      "recommend_interventions",
      "generate_reports",
      "compare_periods"
    ],
    "context_sources": ["kpis", "orders", "jobs", "shipments", "alerts", "historical_data"],
    "default_active": true
  }
]
```

---

## 2. suggestion_points

```json
[
  {
    "app": "order_intake_app",
    "screen_id": "quote_builder",
    "trigger": "line_item_added",
    "suggestion_type": "pricing",
    "explanation_required": true,
    "actionable": true,
    "persona": "CSR",
    "suggestion_content": "Recommended price based on customer tier, volume, and current commodity",
    "shown_as": "inline",
    "confidence_threshold": 0.7
  },
  {
    "app": "order_intake_app",
    "screen_id": "quote_builder",
    "trigger": "customer_requests_date",
    "suggestion_type": "due_date",
    "explanation_required": true,
    "actionable": true,
    "persona": "CSR",
    "suggestion_content": "Suggested ship date based on capacity, inventory, and processing time",
    "shown_as": "popover",
    "confidence_threshold": 0.8
  },
  {
    "app": "order_intake_app",
    "screen_id": "quote_builder",
    "trigger": "requested_date_before_suggested",
    "suggestion_type": "risk_alert",
    "explanation_required": true,
    "actionable": true,
    "persona": "CSR",
    "suggestion_content": "Warning: requested date is aggressive; show probability of success",
    "shown_as": "popover",
    "confidence_threshold": 0.6
  },
  {
    "app": "order_intake_app",
    "screen_id": "quote_builder",
    "trigger": "product_unavailable",
    "suggestion_type": "substitute",
    "explanation_required": true,
    "actionable": true,
    "persona": "CSR",
    "suggestion_content": "Suggest equivalent products that are in stock",
    "shown_as": "side_panel",
    "confidence_threshold": 0.75
  },
  {
    "app": "order_intake_app",
    "screen_id": "customer_lookup",
    "trigger": "customer_selected",
    "suggestion_type": "customer_insight",
    "explanation_required": false,
    "actionable": false,
    "persona": "CSR",
    "suggestion_content": "Customer summary: recent orders, preferences, credit status",
    "shown_as": "inline",
    "confidence_threshold": 0.9
  },
  {
    "app": "order_intake_app",
    "screen_id": "order_entry_form",
    "trigger": "large_order_detected",
    "suggestion_type": "capacity_check",
    "explanation_required": true,
    "actionable": true,
    "persona": "CSR",
    "suggestion_content": "Large order alert: run capacity simulation before confirming",
    "shown_as": "popover",
    "confidence_threshold": 0.8
  },
  {
    "app": "planning_app",
    "screen_id": "schedule_board",
    "trigger": "job_unassigned_10min",
    "suggestion_type": "assignment",
    "explanation_required": true,
    "actionable": true,
    "persona": "PLANNER",
    "suggestion_content": "Suggest best work center and operator based on skills and load",
    "shown_as": "badge",
    "confidence_threshold": 0.75
  },
  {
    "app": "planning_app",
    "screen_id": "schedule_board",
    "trigger": "job_drag_to_slot",
    "suggestion_type": "impact_preview",
    "explanation_required": true,
    "actionable": false,
    "persona": "PLANNER",
    "suggestion_content": "Preview downstream impact on other jobs",
    "shown_as": "popover",
    "confidence_threshold": 0.7
  },
  {
    "app": "planning_app",
    "screen_id": "schedule_board",
    "trigger": "capacity_exceeds_threshold",
    "suggestion_type": "overload_alert",
    "explanation_required": true,
    "actionable": true,
    "persona": "PLANNER",
    "suggestion_content": "Work center overloaded; suggest transfers or overtime",
    "shown_as": "side_panel",
    "confidence_threshold": 0.8
  },
  {
    "app": "planning_app",
    "screen_id": "schedule_board",
    "trigger": "similar_jobs_detected",
    "suggestion_type": "batch_group",
    "explanation_required": true,
    "actionable": true,
    "persona": "PLANNER",
    "suggestion_content": "Group similar jobs to reduce setup time",
    "shown_as": "badge",
    "confidence_threshold": 0.7
  },
  {
    "app": "planning_app",
    "screen_id": "job_detail",
    "trigger": "job_opened",
    "suggestion_type": "routing",
    "explanation_required": true,
    "actionable": true,
    "persona": "PLANNER",
    "suggestion_content": "Optimal routing based on equipment availability",
    "shown_as": "inline",
    "confidence_threshold": 0.75
  },
  {
    "app": "planning_app",
    "screen_id": "capacity_heatmap",
    "trigger": "week_view_rendered",
    "suggestion_type": "bottleneck_alert",
    "explanation_required": true,
    "actionable": true,
    "persona": "PLANNER",
    "suggestion_content": "Identify upcoming bottlenecks with mitigation options",
    "shown_as": "inline",
    "confidence_threshold": 0.8
  },
  {
    "app": "inventory_app",
    "screen_id": "stock_alerts",
    "trigger": "stockout_risk_detected",
    "suggestion_type": "reorder",
    "explanation_required": true,
    "actionable": true,
    "persona": "INVENTORY",
    "suggestion_content": "Reorder recommendation with quantity and supplier",
    "shown_as": "badge",
    "confidence_threshold": 0.85
  },
  {
    "app": "inventory_app",
    "screen_id": "inventory_list",
    "trigger": "imbalance_detected",
    "suggestion_type": "transfer",
    "explanation_required": true,
    "actionable": true,
    "persona": "INVENTORY",
    "suggestion_content": "Suggest inter-location transfer to balance stock",
    "shown_as": "popover",
    "confidence_threshold": 0.75
  },
  {
    "app": "inventory_app",
    "screen_id": "receiving_desk",
    "trigger": "receipt_started",
    "suggestion_type": "put_away",
    "explanation_required": false,
    "actionable": true,
    "persona": "INVENTORY",
    "suggestion_content": "Optimal put-away location based on turnover and space",
    "shown_as": "inline",
    "confidence_threshold": 0.8
  },
  {
    "app": "inventory_app",
    "screen_id": "transfer_request",
    "trigger": "transfer_form_opened",
    "suggestion_type": "transfer_quantity",
    "explanation_required": true,
    "actionable": true,
    "persona": "INVENTORY",
    "suggestion_content": "Suggested transfer quantity based on demand forecast",
    "shown_as": "inline",
    "confidence_threshold": 0.75
  },
  {
    "app": "inventory_app",
    "screen_id": "allocation_screen",
    "trigger": "shortage_allocation",
    "suggestion_type": "priority_allocation",
    "explanation_required": true,
    "actionable": true,
    "persona": "INVENTORY",
    "suggestion_content": "Prioritized allocation based on customer tier and due dates",
    "shown_as": "side_panel",
    "confidence_threshold": 0.8
  },
  {
    "app": "portal_app",
    "screen_id": "rfq_builder",
    "trigger": "user_typing_question",
    "suggestion_type": "rfq_guidance",
    "explanation_required": false,
    "actionable": false,
    "persona": "CUSTOMER_PORTAL",
    "suggestion_content": "Contextual help for completing RFQ fields",
    "shown_as": "inline",
    "confidence_threshold": 0.7
  },
  {
    "app": "portal_app",
    "screen_id": "quote_review",
    "trigger": "quote_viewed",
    "suggestion_type": "quote_explanation",
    "explanation_required": false,
    "actionable": false,
    "persona": "CUSTOMER_PORTAL",
    "suggestion_content": "Explain pricing components and lead time factors",
    "shown_as": "popover",
    "confidence_threshold": 0.8
  },
  {
    "app": "portal_app",
    "screen_id": "order_status",
    "trigger": "customer_asks_question",
    "suggestion_type": "status_answer",
    "explanation_required": false,
    "actionable": false,
    "persona": "CUSTOMER_PORTAL",
    "suggestion_content": "Natural language answer about order/shipment status",
    "shown_as": "chat",
    "confidence_threshold": 0.85
  },
  {
    "app": "portal_app",
    "screen_id": "help_chat",
    "trigger": "chat_initiated",
    "suggestion_type": "faq_answer",
    "explanation_required": false,
    "actionable": true,
    "persona": "CUSTOMER_PORTAL",
    "suggestion_content": "Answer from FAQ or escalate to human",
    "shown_as": "chat",
    "confidence_threshold": 0.75
  },
  {
    "app": "portal_app",
    "screen_id": "rfq_builder",
    "trigger": "unusual_specs_entered",
    "suggestion_type": "spec_clarification",
    "explanation_required": false,
    "actionable": true,
    "persona": "CUSTOMER_PORTAL",
    "suggestion_content": "Ask clarifying questions about non-standard specs",
    "shown_as": "popover",
    "confidence_threshold": 0.7
  }
]
```

---

## 3. feedback_loop

```json
{
  "capture_mechanisms": {
    "explicit_feedback": {
      "accept": {
        "action": "user clicks accept/apply",
        "data_captured": ["suggestion_id", "suggestion_type", "user_id", "timestamp", "context_snapshot"],
        "outcome_tracking": true
      },
      "reject": {
        "action": "user clicks dismiss/reject",
        "data_captured": ["suggestion_id", "suggestion_type", "user_id", "timestamp", "context_snapshot"],
        "reason_prompt": {
          "enabled": true,
          "options": [
            { "code": "not_relevant", "label": "Not relevant to my situation" },
            { "code": "incorrect", "label": "Suggestion was incorrect" },
            { "code": "already_knew", "label": "I already knew this" },
            { "code": "customer_override", "label": "Customer requested something different" },
            { "code": "policy_conflict", "label": "Conflicts with policy" },
            { "code": "other", "label": "Other", "requires_text": true }
          ],
          "required": false
        }
      },
      "edit": {
        "action": "user accepts with modifications",
        "data_captured": ["suggestion_id", "original_value", "edited_value", "user_id", "timestamp", "context_snapshot"],
        "reason_prompt": {
          "enabled": true,
          "options": [
            { "code": "minor_adjustment", "label": "Minor adjustment needed" },
            { "code": "customer_specific", "label": "Customer-specific change" },
            { "code": "policy_adjustment", "label": "Policy-based adjustment" },
            { "code": "other", "label": "Other", "requires_text": true }
          ],
          "required": false
        }
      }
    },
    "implicit_feedback": {
      "view_without_action": {
        "timeout_ms": 5000,
        "event": "suggestion_ignored",
        "data_captured": ["suggestion_id", "duration_visible_ms"]
      },
      "hover_duration": {
        "threshold_ms": 2000,
        "event": "suggestion_considered",
        "data_captured": ["suggestion_id", "hover_duration_ms"]
      },
      "subsequent_action": {
        "event": "user_action_after_suggestion",
        "window_seconds": 60,
        "data_captured": ["suggestion_id", "user_action", "action_matches_suggestion"]
      }
    },
    "outcome_tracking": {
      "enabled_for": ["due_date", "pricing", "assignment", "transfer", "reorder"],
      "tracking_events": {
        "due_date": {
          "success_metric": "order_shipped_on_time",
          "comparison": "suggested_date vs actual_ship_date"
        },
        "pricing": {
          "success_metric": "quote_accepted",
          "comparison": "suggested_price vs final_price"
        },
        "assignment": {
          "success_metric": "job_completed_on_time",
          "comparison": "suggested_assignment vs actual_performance"
        },
        "transfer": {
          "success_metric": "no_stockout",
          "comparison": "transfer_executed vs stockout_prevented"
        },
        "reorder": {
          "success_metric": "no_stockout",
          "comparison": "reorder_quantity vs actual_demand"
        }
      }
    }
  },
  "storage": {
    "table": "ai_feedback_log",
    "fields": [
      "id",
      "suggestion_id",
      "suggestion_type",
      "persona",
      "feedback_type",
      "reason_code",
      "reason_text",
      "original_value",
      "final_value",
      "user_id",
      "session_id",
      "context_snapshot",
      "outcome_tracked",
      "outcome_success",
      "created_at"
    ],
    "retention_days": 365
  },
  "analytics": {
    "metrics": [
      { "id": "acceptance_rate", "formula": "accepted / (accepted + rejected + ignored)" },
      { "id": "edit_rate", "formula": "edited / accepted" },
      { "id": "outcome_accuracy", "formula": "successful_outcomes / tracked_outcomes" },
      { "id": "rejection_reasons", "formula": "count by reason_code" },
      { "id": "confidence_calibration", "formula": "actual_accuracy vs confidence_score" }
    ],
    "dashboards": ["admin > ai_performance", "per_persona_metrics"],
    "alerts": [
      { "condition": "acceptance_rate < 50%", "action": "flag_for_review" },
      { "condition": "outcome_accuracy < 70%", "action": "trigger_model_review" }
    ]
  },
  "improvement_loop": {
    "review_frequency": "weekly",
    "low_performing_threshold": 0.6,
    "escalation": "flagged for data science review",
    "retraining_trigger": "monthly or on significant accuracy drop"
  }
}
```

---

## 4. retrieval_surface

```json
{
  "data_sources": {
    "products": {
      "entities": ["Product", "ProductVariant", "ProductCategory"],
      "fields_accessible": ["id", "sku", "name", "description", "specs", "dimensions", "weight", "category", "pricing_tier", "lead_time_days", "min_order_qty"],
      "search_type": "semantic + keyword",
      "access_control": "tenant_scoped"
    },
    "inventory": {
      "entities": ["InventoryItem", "InventoryLocation", "InventoryMovement"],
      "fields_accessible": ["product_id", "location_id", "quantity", "reserved", "available", "lot_number", "expiration_date", "last_movement_date"],
      "search_type": "exact + range",
      "access_control": "tenant_scoped + location_scoped"
    },
    "pricing": {
      "entities": ["PriceList", "CustomerPricing", "ContractPrice", "CommodityPrice"],
      "fields_accessible": ["product_id", "customer_id", "tier", "base_price", "discount_percent", "effective_date", "expiration_date", "commodity_adder"],
      "search_type": "exact",
      "access_control": "tenant_scoped + role_restricted"
    },
    "customers": {
      "entities": ["Customer", "CustomerContact", "CustomerAddress", "CustomerHistory"],
      "fields_accessible": ["id", "name", "tier", "credit_limit", "payment_terms", "default_ship_to", "recent_orders", "preferences", "notes"],
      "search_type": "semantic + keyword",
      "access_control": "tenant_scoped"
    },
    "orders": {
      "entities": ["Order", "OrderLineItem", "Quote", "RFQ"],
      "fields_accessible": ["id", "order_number", "customer_id", "status", "line_items", "total", "due_date", "ship_date", "notes"],
      "search_type": "exact + date_range",
      "access_control": "tenant_scoped + customer_scoped (portal)"
    },
    "jobs": {
      "entities": ["Job", "JobOperation", "JobAssignment"],
      "fields_accessible": ["id", "job_number", "order_id", "status", "work_center", "operator", "estimated_hours", "actual_hours", "due_date", "priority"],
      "search_type": "exact + status_filter",
      "access_control": "tenant_scoped + location_scoped"
    },
    "capacity": {
      "entities": ["WorkCenter", "Shift", "CapacitySlot", "Operator"],
      "fields_accessible": ["work_center_id", "date", "available_hours", "scheduled_hours", "utilization", "operator_skills"],
      "search_type": "date_range + filter",
      "access_control": "tenant_scoped + location_scoped"
    },
    "documents": {
      "entities": ["MTR", "COC", "Drawing", "Specification", "BOL", "Invoice"],
      "fields_accessible": ["id", "type", "reference_id", "file_url", "extracted_data", "created_at"],
      "search_type": "semantic + metadata",
      "access_control": "tenant_scoped + entity_scoped"
    },
    "bom": {
      "entities": ["BOM", "BOMLineItem", "ProcessingTemplate"],
      "fields_accessible": ["id", "product_id", "components", "processing_steps", "yield_factor", "scrap_estimate"],
      "search_type": "exact",
      "access_control": "tenant_scoped"
    },
    "certifications": {
      "entities": ["MTR", "COC", "TestResult", "Certification"],
      "fields_accessible": ["id", "type", "heat_number", "lot_number", "test_results", "certification_body", "expiration_date"],
      "search_type": "exact + text",
      "access_control": "tenant_scoped"
    },
    "faq": {
      "entities": ["FAQEntry", "HelpArticle", "PolicyDocument"],
      "fields_accessible": ["id", "question", "answer", "category", "keywords", "last_updated"],
      "search_type": "semantic",
      "access_control": "public (portal) + tenant_scoped"
    },
    "historical": {
      "entities": ["OrderHistory", "QuoteHistory", "JobHistory", "PricingHistory"],
      "fields_accessible": ["entity_id", "customer_id", "product_id", "date", "value", "outcome"],
      "search_type": "aggregation + time_series",
      "access_control": "tenant_scoped"
    }
  },
  "retrieval_methods": {
    "semantic_search": {
      "engine": "vector_db",
      "embedding_model": "text-embedding-3-small",
      "top_k": 10,
      "similarity_threshold": 0.7
    },
    "keyword_search": {
      "engine": "elasticsearch",
      "fuzzy_matching": true,
      "boost_fields": ["name", "sku", "description"]
    },
    "structured_query": {
      "engine": "postgres",
      "supports": ["filters", "joins", "aggregations", "date_ranges"]
    },
    "hybrid": {
      "combine": ["semantic", "keyword"],
      "reranking": true,
      "rerank_model": "cross-encoder"
    }
  },
  "context_injection": {
    "max_tokens": 8000,
    "prioritization": [
      { "source": "current_entity", "weight": 1.0 },
      { "source": "related_entities", "weight": 0.8 },
      { "source": "customer_history", "weight": 0.6 },
      { "source": "similar_cases", "weight": 0.5 },
      { "source": "policies", "weight": 0.7 }
    ],
    "truncation_strategy": "relevance_scored"
  },
  "persona_access_matrix": {
    "CSR": ["products", "inventory", "pricing", "customers", "orders", "documents", "bom", "certifications", "faq", "historical"],
    "PLANNER": ["products", "inventory", "jobs", "capacity", "bom", "historical"],
    "INVENTORY": ["products", "inventory", "jobs", "capacity", "bom"],
    "CUSTOMER_PORTAL": ["products (public)", "orders (own)", "documents (own)", "faq", "certifications (own)"],
    "MANAGER": ["all"]
  }
}
```

---

## 5. red_line_rules

```json
[
  {
    "rule_id": "pricing_floor",
    "category": "pricing",
    "description": "Never suggest price below margin floor",
    "condition": "suggested_price < (cost * (1 + min_margin_percent / 100))",
    "action": "block_suggestion",
    "fallback": "Suggest floor price with explanation",
    "applies_to": ["CSR", "CUSTOMER_PORTAL"],
    "severity": "critical",
    "audit_log": true
  },
  {
    "rule_id": "sla_honesty",
    "category": "compliance",
    "description": "Never promise delivery date with <50% confidence without disclosure",
    "condition": "on_time_probability < 0.5 AND disclosure_not_shown",
    "action": "force_disclosure",
    "fallback": "Show risk warning with probability",
    "applies_to": ["CSR", "CUSTOMER_PORTAL"],
    "severity": "high",
    "audit_log": true
  },
  {
    "rule_id": "no_false_inventory",
    "category": "accuracy",
    "description": "Never claim inventory availability without real-time check",
    "condition": "inventory_data_age > 60 seconds",
    "action": "refresh_or_caveat",
    "fallback": "State 'availability subject to confirmation'",
    "applies_to": ["CSR", "CUSTOMER_PORTAL", "INVENTORY"],
    "severity": "high",
    "audit_log": true
  },
  {
    "rule_id": "certification_accuracy",
    "category": "compliance",
    "description": "Never misrepresent certification status",
    "condition": "cert_claim != actual_cert_status",
    "action": "block_response",
    "fallback": "Direct to actual certification documents",
    "applies_to": ["CSR", "CUSTOMER_PORTAL"],
    "severity": "critical",
    "audit_log": true
  },
  {
    "rule_id": "credit_disclosure",
    "category": "financial",
    "description": "Never hide customer credit issues from CSR",
    "condition": "customer.credit_hold = true OR customer.ar_past_due > threshold",
    "action": "force_disclosure",
    "fallback": "Show credit warning prominently",
    "applies_to": ["CSR"],
    "severity": "high",
    "audit_log": true
  },
  {
    "rule_id": "no_competitor_disparagement",
    "category": "ethics",
    "description": "Never make negative claims about competitors",
    "condition": "response_contains_competitor_criticism",
    "action": "block_response",
    "fallback": "Focus on our capabilities only",
    "applies_to": ["CUSTOMER_PORTAL"],
    "severity": "medium",
    "audit_log": true
  },
  {
    "rule_id": "data_scope_enforcement",
    "category": "security",
    "description": "Never expose data outside user's permitted scope",
    "condition": "data_tenant_id != user_tenant_id OR data_customer_id != user_customer_id",
    "action": "block_response",
    "fallback": "Return 'access denied' or empty result",
    "applies_to": ["all"],
    "severity": "critical",
    "audit_log": true
  },
  {
    "rule_id": "no_capacity_overcommit",
    "category": "operations",
    "description": "Never suggest assignments that exceed safe capacity",
    "condition": "work_center_utilization > 100%",
    "action": "warn_before_suggest",
    "fallback": "Show overload warning with alternatives",
    "applies_to": ["PLANNER"],
    "severity": "medium",
    "audit_log": false
  },
  {
    "rule_id": "no_unauthorized_discounts",
    "category": "pricing",
    "description": "Never suggest discounts beyond user's authority",
    "condition": "discount_percent > user.max_discount_authority",
    "action": "cap_at_authority",
    "fallback": "Suggest max authorized discount, note escalation option",
    "applies_to": ["CSR"],
    "severity": "high",
    "audit_log": true
  },
  {
    "rule_id": "material_substitution_disclosure",
    "category": "compliance",
    "description": "Always disclose when suggesting material substitutes",
    "condition": "suggested_product != requested_product",
    "action": "force_disclosure",
    "fallback": "Clearly label as 'alternative' with spec comparison",
    "applies_to": ["CSR", "CUSTOMER_PORTAL"],
    "severity": "high",
    "audit_log": true
  },
  {
    "rule_id": "no_spec_misrepresentation",
    "category": "compliance",
    "description": "Never claim product meets spec without verification",
    "condition": "spec_claim_not_verified",
    "action": "block_response",
    "fallback": "State 'verify against specification sheet'",
    "applies_to": ["CSR", "CUSTOMER_PORTAL"],
    "severity": "critical",
    "audit_log": true
  },
  {
    "rule_id": "escalation_threshold",
    "category": "service",
    "description": "Escalate to human when confidence is low",
    "condition": "confidence < 0.5 AND customer_facing",
    "action": "escalate_to_human",
    "fallback": "Offer to connect with representative",
    "applies_to": ["CUSTOMER_PORTAL"],
    "severity": "medium",
    "audit_log": true
  },
  {
    "rule_id": "no_pii_exposure",
    "category": "security",
    "description": "Never expose PII in responses",
    "condition": "response_contains_pii AND recipient_not_authorized",
    "action": "redact",
    "fallback": "Mask sensitive fields",
    "applies_to": ["all"],
    "severity": "critical",
    "audit_log": true
  },
  {
    "rule_id": "regulatory_compliance",
    "category": "compliance",
    "description": "Include required regulatory disclaimers",
    "condition": "product_category in regulated_categories AND disclaimer_missing",
    "action": "append_disclaimer",
    "fallback": "Add standard regulatory notice",
    "applies_to": ["CSR", "CUSTOMER_PORTAL"],
    "severity": "high",
    "audit_log": true
  }
]
```

---

## 6. ui_surfaces

```json
{
  "suggestion_display": {
    "badge": {
      "component": "Chip",
      "props": {
        "size": "small",
        "variant": "outlined",
        "icon": "AutoAwesome"
      },
      "placement": "inline with trigger element",
      "interaction": "click expands to popover",
      "use_cases": ["assignment", "batch_group", "reorder"],
      "max_visible": 3
    },
    "popover": {
      "component": "Popover",
      "props": {
        "anchorOrigin": { "vertical": "bottom", "horizontal": "left" },
        "transformOrigin": { "vertical": "top", "horizontal": "left" }
      },
      "children": [
        { "id": "header", "type": "Typography", "variant": "subtitle2" },
        { "id": "content", "type": "Typography", "variant": "body2" },
        { "id": "explanation", "type": "Collapse", "trigger": "Why?" },
        { "id": "confidence", "type": "Chip", "size": "small" },
        { "id": "actions", "type": "ButtonGroup", "buttons": ["Accept", "Dismiss"] }
      ],
      "interaction": "auto-show on trigger, dismiss on outside click",
      "use_cases": ["due_date", "risk_alert", "impact_preview", "quote_explanation"],
      "auto_dismiss_seconds": 30
    },
    "side_panel": {
      "component": "Drawer",
      "props": {
        "anchor": "right",
        "variant": "persistent",
        "width": 360
      },
      "children": [
        { "id": "header", "type": "PanelHeader", "title": "AI Suggestions" },
        { "id": "suggestion_list", "type": "List", "itemType": "SuggestionCard" },
        { "id": "bulk_actions", "type": "ButtonGroup", "buttons": ["Accept All", "Dismiss All"] }
      ],
      "interaction": "toggle via toolbar button, persists until closed",
      "use_cases": ["substitute", "overload_alert", "priority_allocation"],
      "supports_multiple": true
    },
    "chat": {
      "component": "ChatPanel",
      "props": {
        "position": "bottom-right",
        "width": 400,
        "height": 500
      },
      "children": [
        { "id": "message_list", "type": "MessageThread" },
        { "id": "typing_indicator", "type": "TypingIndicator" },
        { "id": "input", "type": "ChatInput", "placeholder": "Ask a question..." },
        { "id": "quick_actions", "type": "ChipGroup", "chips": ["Order Status", "Quote Help", "Talk to Human"] }
      ],
      "interaction": "FAB to open, persistent thread per session",
      "use_cases": ["faq_answer", "status_answer"],
      "supports_history": true
    },
    "inline": {
      "component": "InlineSuggestion",
      "props": {
        "variant": "subtle"
      },
      "children": [
        { "id": "icon", "type": "Icon", "icon": "TipsAndUpdates", "size": "small" },
        { "id": "text", "type": "Typography", "variant": "caption", "color": "text.secondary" },
        { "id": "action", "type": "Link", "label": "Apply" }
      ],
      "interaction": "always visible, click to apply",
      "use_cases": ["pricing", "customer_insight", "routing", "put_away", "rfq_guidance"],
      "non_intrusive": true
    }
  },
  "assistant_shell": {
    "id": "ai_assistant_shell",
    "type": "ShellIntegration",
    "components": [
      {
        "id": "floating_button",
        "type": "Fab",
        "props": {
          "icon": "SmartToy",
          "position": "bottom-right",
          "tooltip": "AI Assistant (Ctrl+/)"
        },
        "visibility": "all_screens",
        "action": "toggle_chat_panel"
      },
      {
        "id": "command_palette",
        "type": "CommandPalette",
        "props": {
          "trigger": "Ctrl+K",
          "ai_mode_trigger": "Ctrl+/"
        },
        "features": ["search", "commands", "ai_query"],
        "visibility": "all_screens"
      },
      {
        "id": "context_menu_integration",
        "type": "ContextMenuExtension",
        "props": {
          "menu_item": "Ask AI about this",
          "icon": "AutoAwesome"
        },
        "visibility": "on selectable entities"
      },
      {
        "id": "suggestion_indicator",
        "type": "ToolbarBadge",
        "props": {
          "icon": "Lightbulb",
          "badge_count": "pending_suggestions_count",
          "tooltip": "AI has suggestions"
        },
        "visibility": "when suggestions_pending > 0",
        "action": "open_side_panel"
      }
    ]
  },
  "screen_integrations": {
    "order_intake_app": {
      "quote_builder": {
        "suggestion_zones": [
          { "zone": "line_item_row", "display": "inline", "types": ["pricing"] },
          { "zone": "due_date_field", "display": "popover", "types": ["due_date", "risk_alert"] },
          { "zone": "product_search", "display": "inline", "types": ["substitute"] },
          { "zone": "header_bar", "display": "badge", "types": ["customer_insight"] }
        ],
        "side_panel_enabled": true,
        "chat_enabled": false
      },
      "customer_lookup": {
        "suggestion_zones": [
          { "zone": "customer_card", "display": "inline", "types": ["customer_insight"] },
          { "zone": "credit_status", "display": "badge", "types": ["credit_warning"] }
        ],
        "side_panel_enabled": false,
        "chat_enabled": false
      }
    },
    "planning_app": {
      "schedule_board": {
        "suggestion_zones": [
          { "zone": "job_card", "display": "badge", "types": ["assignment", "batch_group"] },
          { "zone": "work_center_column", "display": "inline", "types": ["overload_alert", "bottleneck_alert"] },
          { "zone": "drag_preview", "display": "popover", "types": ["impact_preview"] }
        ],
        "side_panel_enabled": true,
        "chat_enabled": false
      },
      "job_detail": {
        "suggestion_zones": [
          { "zone": "routing_section", "display": "inline", "types": ["routing"] },
          { "zone": "assignment_section", "display": "badge", "types": ["assignment"] }
        ],
        "side_panel_enabled": true,
        "chat_enabled": false
      }
    },
    "inventory_app": {
      "stock_alerts": {
        "suggestion_zones": [
          { "zone": "alert_row", "display": "badge", "types": ["reorder", "transfer"] }
        ],
        "side_panel_enabled": true,
        "chat_enabled": false
      },
      "receiving_desk": {
        "suggestion_zones": [
          { "zone": "put_away_field", "display": "inline", "types": ["put_away"] }
        ],
        "side_panel_enabled": false,
        "chat_enabled": false
      },
      "allocation_screen": {
        "suggestion_zones": [
          { "zone": "allocation_panel", "display": "side_panel", "types": ["priority_allocation"] }
        ],
        "side_panel_enabled": true,
        "chat_enabled": false
      }
    },
    "portal_app": {
      "rfq_builder": {
        "suggestion_zones": [
          { "zone": "form_fields", "display": "inline", "types": ["rfq_guidance"] },
          { "zone": "specs_section", "display": "popover", "types": ["spec_clarification"] }
        ],
        "side_panel_enabled": false,
        "chat_enabled": true
      },
      "quote_review": {
        "suggestion_zones": [
          { "zone": "pricing_section", "display": "popover", "types": ["quote_explanation"] }
        ],
        "side_panel_enabled": false,
        "chat_enabled": true
      },
      "order_status": {
        "suggestion_zones": [],
        "side_panel_enabled": false,
        "chat_enabled": true
      },
      "help_chat": {
        "suggestion_zones": [],
        "side_panel_enabled": false,
        "chat_enabled": true,
        "chat_primary": true
      }
    }
  },
  "theming": {
    "ai_accent_color": "#6366F1",
    "suggestion_highlight": "rgba(99, 102, 241, 0.1)",
    "confidence_colors": {
      "high": "success.main",
      "medium": "warning.main",
      "low": "text.secondary"
    },
    "icons": {
      "ai_general": "SmartToy",
      "suggestion": "AutoAwesome",
      "tip": "TipsAndUpdates",
      "warning": "WarningAmber",
      "help": "HelpOutline"
    }
  }
}
```

---

## 7. prompt_templates

```json
{
  "templates_by_persona": {
    "CSR": {
      "system_prompt": "You are a helpful sales and quoting assistant for a metals and plastics service center. Your role is to help Customer Service Representatives create accurate quotes, suggest realistic due dates, and provide customer insights. Always consider customer pricing tiers, inventory availability, and production capacity. Be professional and customer-focused.",
      "context_format": "Customer: {customer_name} (Tier: {tier})\nProducts: {product_list}\nInventory: {availability}\nCapacity: {capacity_snapshot}\nPricing Rules: {applicable_rules}"
    },
    "PLANNER": {
      "system_prompt": "You are an operations planning assistant for a metals and plastics service center. Your role is to help planners optimize schedules, assign jobs efficiently, and identify bottlenecks. Focus on capacity utilization, on-time delivery, and setup time minimization. Be analytical and action-oriented.",
      "context_format": "Work Centers: {work_center_status}\nJobs: {pending_jobs}\nCapacity: {capacity_by_date}\nSLA Targets: {sla_requirements}"
    },
    "INVENTORY": {
      "system_prompt": "You are an inventory management assistant for a metals and plastics service center. Your role is to help with stock optimization, transfer recommendations, and reorder decisions. Focus on balancing stock levels, minimizing stockouts, and optimizing inventory turns. Be data-driven and efficient.",
      "context_format": "Inventory Levels: {inventory_summary}\nDemand Forecast: {forecast_data}\nOpen Orders: {order_demand}\nLocations: {location_inventory}"
    },
    "CUSTOMER_PORTAL": {
      "system_prompt": "You are a helpful customer service assistant for a metals and plastics service center's online portal. Your role is to answer customer questions about their orders, quotes, and RFQs. Be friendly, clear, and helpful. If you're unsure about something, offer to connect the customer with a human representative. Never make claims you can't verify.",
      "context_format": "Customer Orders: {customer_orders}\nQuotes: {customer_quotes}\nRFQs: {customer_rfqs}\nFAQ: {relevant_faq}"
    },
    "MANAGER": {
      "system_prompt": "You are an operations intelligence assistant for a metals and plastics service center. Your role is to provide operational insights, highlight exceptions, and support decision-making. Summarize complex data clearly and recommend actionable interventions. Be executive-level and results-focused.",
      "context_format": "KPIs: {current_kpis}\nExceptions: {exception_list}\nTrends: {trend_data}\nAlerts: {active_alerts}"
    }
  },
  "suggestion_templates": {
    "pricing": "Based on {customer_tier} pricing and current {commodity} rates, the suggested price for {product} is ${price}/lb. This includes a {discount}% volume discount. {explanation}",
    "due_date": "Based on current capacity ({utilization}% utilized) and inventory ({availability}), the earliest reliable ship date is {date}. Confidence: {confidence}%. {explanation}",
    "assignment": "Suggest assigning to {work_center} with {operator}. {operator} has completed {similar_jobs} similar jobs with {on_time_rate}% on-time rate. {explanation}",
    "transfer": "Transfer {quantity} {unit} of {product} from {source} to {destination}. This balances inventory and prevents potential stockout at {destination}. {explanation}",
    "reorder": "Recommend ordering {quantity} {unit} of {product} from {supplier}. Current stock covers {days_of_supply} days. Lead time is {lead_time} days. {explanation}"
  }
}
```

---

## 8. api_endpoints

```json
[
  {
    "method": "POST",
    "path": "/api/ai/query",
    "description": "Send a natural language query to the assistant",
    "body": {
      "message": "string",
      "mode": "csr_assist | planning_assist | inventory_assist | portal_assist | manager_assist",
      "context": { "screen_id": "string", "entity_id": "string", "entity_type": "string" },
      "conversation_id": "uuid"
    },
    "response": {
      "response": "string",
      "suggestions": "array",
      "actions": "array",
      "confidence": "number",
      "sources": "array"
    }
  },
  {
    "method": "POST",
    "path": "/api/ai/suggest",
    "description": "Request suggestions for current context",
    "body": {
      "screen_id": "string",
      "trigger": "string",
      "context": "object"
    },
    "response": {
      "suggestions": [
        {
          "id": "uuid",
          "type": "string",
          "content": "string",
          "explanation": "string",
          "confidence": "number",
          "actions": "array"
        }
      ]
    }
  },
  {
    "method": "POST",
    "path": "/api/ai/action",
    "description": "Execute an AI-suggested action",
    "body": {
      "suggestion_id": "uuid",
      "action": "accept | reject | edit",
      "modified_value": "any",
      "reason_code": "string",
      "reason_text": "string"
    },
    "response": {
      "success": "boolean",
      "result": "object",
      "message": "string"
    }
  },
  {
    "method": "POST",
    "path": "/api/ai/feedback",
    "description": "Submit feedback on AI response",
    "body": {
      "suggestion_id": "uuid",
      "rating": "number (1-5)",
      "feedback_type": "helpful | not_helpful | incorrect | inappropriate",
      "comment": "string"
    },
    "response": { "acknowledged": "boolean" }
  },
  {
    "method": "GET",
    "path": "/api/ai/suggestions/{screen_id}",
    "description": "Get pending suggestions for a screen",
    "response": { "suggestions": "array", "count": "integer" }
  },
  {
    "method": "GET",
    "path": "/api/ai/modes",
    "description": "Get available assistant modes for current user",
    "response": { "modes": "array" }
  }
]
```

---

## 9. permissions_matrix

| capability | CSR | PLANNER | INVENTORY | CUSTOMER_PORTAL | MANAGER | ADMIN |
|------------|-----|---------|-----------|-----------------|---------|-------|
| use_csr_assist | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ |
| use_planning_assist | ✗ | ✓ | ✗ | ✗ | ✓ | ✓ |
| use_inventory_assist | ✗ | ✓ | ✓ | ✗ | ✓ | ✓ |
| use_portal_assist | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ |
| use_manager_assist | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| view_pricing_suggestions | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ |
| apply_pricing_suggestions | ✓ (within authority) | ✗ | ✗ | ✗ | ✓ | ✓ |
| view_assignment_suggestions | ✗ | ✓ | ✗ | ✗ | ✓ | ✓ |
| apply_assignment_suggestions | ✗ | ✓ | ✗ | ✗ | ✓ | ✓ |
| view_inventory_suggestions | ✗ | ✓ | ✓ | ✗ | ✓ | ✓ |
| apply_inventory_suggestions | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ |
| chat_with_ai | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| view_ai_analytics | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| configure_ai_settings | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
