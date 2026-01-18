# 72-AI-OPS-ASSISTANT

> Phase 20: Conversational AI assistant for operational queries, guidance, and task automation.

---

## 1. assistant_capabilities

```json
[
  {
    "capability_id": "natural_language_query",
    "name": "Natural Language Queries",
    "description": "Answer questions about orders, inventory, jobs, customers in plain English",
    "examples": [
      "What's the status of order 12345?",
      "How many jobs are running on the plasma cutter?",
      "Which orders are due this week?",
      "What's our current stock of 304 stainless 14ga?"
    ],
    "response_type": "text + data_card"
  },
  {
    "capability_id": "guided_actions",
    "name": "Guided Task Execution",
    "description": "Walk user through multi-step tasks with prompts and validation",
    "examples": [
      "Help me create a quote for ABC Company",
      "Guide me through receiving this shipment",
      "Walk me through a scrap report"
    ],
    "response_type": "step_wizard"
  },
  {
    "capability_id": "anomaly_explanation",
    "name": "Anomaly Explanation",
    "description": "Explain why metrics are unusual or alerts triggered",
    "examples": [
      "Why is lead time so high this week?",
      "What's causing the backlog on SAW-01?",
      "Why did we miss the delivery target yesterday?"
    ],
    "response_type": "text + contributing_factors"
  },
  {
    "capability_id": "recommendation_generation",
    "name": "Recommendations",
    "description": "Suggest actions based on current state and goals",
    "examples": [
      "What should I prioritize today?",
      "Which quotes should I follow up on?",
      "What materials should we reorder?"
    ],
    "response_type": "ranked_list + reasoning"
  },
  {
    "capability_id": "report_generation",
    "name": "On-Demand Reports",
    "description": "Generate custom reports from natural language",
    "examples": [
      "Give me a summary of this week's shipments",
      "Show me top 10 customers by revenue this month",
      "Create a scrap report for the last 30 days"
    ],
    "response_type": "table + chart + export"
  },
  {
    "capability_id": "process_explanation",
    "name": "Process Help",
    "description": "Explain how to do things in the system",
    "examples": [
      "How do I split a job?",
      "What's the approval process for credit holds?",
      "How do I add a new work center?"
    ],
    "response_type": "text + links + video"
  },
  {
    "capability_id": "quick_actions",
    "name": "Quick Actions",
    "description": "Execute simple actions via chat",
    "examples": [
      "Mark job J-1234 as complete",
      "Add a note to order 5678",
      "Send tracking to customer for shipment S-9012"
    ],
    "response_type": "confirmation + action_result"
  },
  {
    "capability_id": "data_lookup",
    "name": "Data Lookup",
    "description": "Find specific records quickly",
    "examples": [
      "Find customer Acme Industries",
      "Look up product 304-SHT-14GA-48X120",
      "Show me heat number H-2024-1234"
    ],
    "response_type": "record_card + deep_link"
  }
]
```

---

## 2. assistant_ui

```json
{
  "access_points": [
    {
      "location": "shell > floating_button",
      "icon": "SmartToy",
      "position": "bottom_right",
      "trigger": "click or keyboard shortcut (Ctrl+/)"
    },
    {
      "location": "shell > top_bar",
      "icon": "Search + AI badge",
      "trigger": "click opens command palette with AI mode"
    },
    {
      "location": "contextual",
      "trigger": "right-click menu > 'Ask AI about this'",
      "context_passed": "selected record or screen"
    }
  ],
  "chat_panel": {
    "type": "Drawer",
    "anchor": "right",
    "width": "400px",
    "components": [
      { "id": "message_list", "type": "scrollable thread" },
      { "id": "input_bar", "type": "text input + voice + attachments" },
      { "id": "suggestions", "type": "quick action chips" },
      { "id": "context_badge", "type": "shows current screen context" }
    ],
    "features": [
      "conversation_history",
      "pin_responses",
      "copy_to_clipboard",
      "share_thread",
      "clear_conversation"
    ]
  },
  "response_components": {
    "text": { "component": "Typography", "supports_markdown": true },
    "data_card": { "component": "Card", "fields": "dynamic based on entity" },
    "table": { "component": "DataTable", "sortable": true, "exportable": true },
    "chart": { "component": "Chart", "types": ["bar", "line", "pie"] },
    "action_button": { "component": "Button", "requires_confirmation": "for destructive actions" },
    "step_wizard": { "component": "Stepper", "progress_tracked": true },
    "link_list": { "component": "List", "items_clickable": true }
  }
}
```

---

## 3. intent_catalog

```json
[
  {
    "intent": "order_status",
    "patterns": ["status of order", "where is order", "order * status", "track order"],
    "required_entities": ["order_id"],
    "handler": "order_status_handler",
    "response_template": "Order {order_id} is {status}. {line_count} lines, due {due_date}."
  },
  {
    "intent": "job_status",
    "patterns": ["status of job", "job * progress", "where is job", "is job done"],
    "required_entities": ["job_id"],
    "handler": "job_status_handler",
    "response_template": "Job {job_id} is {status} on {work_center}. {percent_complete}% complete."
  },
  {
    "intent": "inventory_check",
    "patterns": ["stock of", "inventory of", "how much * do we have", "available quantity"],
    "required_entities": ["product_id OR product_description"],
    "handler": "inventory_check_handler",
    "response_template": "{product_name}: {available_qty} {unit} available across {location_count} locations."
  },
  {
    "intent": "customer_lookup",
    "patterns": ["find customer", "look up customer", "customer *", "who is customer"],
    "required_entities": ["customer_name OR customer_id"],
    "handler": "customer_lookup_handler",
    "response_template": "Customer: {customer_name}. {open_orders} open orders, {open_ar} AR balance."
  },
  {
    "intent": "due_this_week",
    "patterns": ["due this week", "orders due", "what's due", "upcoming deadlines"],
    "required_entities": [],
    "handler": "due_this_week_handler",
    "response_template": "{count} orders due this week. {at_risk_count} at risk."
  },
  {
    "intent": "work_center_status",
    "patterns": ["status of *", "what's running on", "* utilization", "jobs on *"],
    "required_entities": ["work_center_id OR work_center_name"],
    "handler": "work_center_status_handler",
    "response_template": "{work_center}: {status}. Current job: {current_job}. Queue: {queue_depth} jobs."
  },
  {
    "intent": "create_quote",
    "patterns": ["create quote", "new quote for", "quote for customer", "start a quote"],
    "required_entities": ["customer_id OR customer_name"],
    "handler": "create_quote_wizard",
    "response_template": "Starting quote for {customer_name}. What products do you need?"
  },
  {
    "intent": "prioritization",
    "patterns": ["what should I", "prioritize", "most important", "what's urgent"],
    "required_entities": [],
    "handler": "prioritization_handler",
    "response_template": "Top priorities for you: {priority_list}"
  },
  {
    "intent": "explain_metric",
    "patterns": ["why is * high", "why is * low", "explain *", "what's causing"],
    "required_entities": ["metric_name"],
    "handler": "explain_metric_handler",
    "response_template": "{metric_name} is {value} because: {factors}"
  },
  {
    "intent": "mark_complete",
    "patterns": ["mark * complete", "complete job", "finish job", "close job"],
    "required_entities": ["job_id"],
    "handler": "mark_complete_action",
    "confirmation_required": true,
    "response_template": "Job {job_id} marked complete. Output: {output_qty} {unit}."
  },
  {
    "intent": "add_note",
    "patterns": ["add note to", "note on", "comment on"],
    "required_entities": ["entity_type", "entity_id", "note_text"],
    "handler": "add_note_action",
    "response_template": "Note added to {entity_type} {entity_id}."
  },
  {
    "intent": "help",
    "patterns": ["how do I", "help with", "guide me", "show me how"],
    "required_entities": ["topic"],
    "handler": "help_handler",
    "response_template": "Here's how to {topic}: {steps}"
  },
  {
    "intent": "generate_report",
    "patterns": ["report on", "summary of", "show me * data", "give me numbers"],
    "required_entities": ["report_type", "date_range"],
    "handler": "report_generator",
    "response_template": "Here's your {report_type} report for {date_range}:"
  }
]
```

---

## 4. context_awareness

```json
{
  "context_sources": [
    {
      "source": "current_screen",
      "data": ["screen_id", "visible_entity_ids", "selected_items"],
      "usage": "Understand what user is looking at"
    },
    {
      "source": "user_role",
      "data": ["role", "permissions", "default_location"],
      "usage": "Tailor responses to user's scope"
    },
    {
      "source": "conversation_history",
      "data": ["recent_messages", "entities_mentioned"],
      "usage": "Maintain context across turns"
    },
    {
      "source": "user_activity",
      "data": ["recent_actions", "frequent_queries", "saved_reports"],
      "usage": "Personalize suggestions"
    },
    {
      "source": "time_context",
      "data": ["current_shift", "day_of_week", "time_of_day"],
      "usage": "Adjust urgency and relevance"
    }
  ],
  "context_injection": {
    "method": "Prepend to prompt",
    "format": "System context: User is {role} viewing {screen_id}. Selected: {selected_entity}."
  },
  "entity_resolution": {
    "ambiguity_handling": "Ask for clarification",
    "pronoun_resolution": "Use conversation history",
    "fuzzy_matching": "Use for product/customer names"
  }
}
```

---

## 5. action_permissions

| action_type | CSR | PLANNER | OPERATOR | SHIPPING | MANAGER | ADMIN |
|-------------|-----|---------|----------|----------|---------|-------|
| query_data | ✓ | ✓ | ✓ (own work center) | ✓ (shipping) | ✓ | ✓ |
| generate_report | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ |
| mark_job_complete | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ |
| add_note | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| create_quote | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ |
| update_order | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ |
| expedite_order | ✗ | ✓ | ✗ | ✗ | ✓ | ✓ |
| adjust_inventory | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| view_financials | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |

---

## 6. safety_guardrails

```json
{
  "confirmation_required": [
    "mark_complete",
    "cancel_order",
    "adjust_inventory",
    "change_priority",
    "send_notification"
  ],
  "prohibited_actions": [
    "delete_records",
    "change_permissions",
    "modify_pricing (without approval)",
    "access_other_tenant_data"
  ],
  "rate_limits": {
    "queries_per_minute": 30,
    "actions_per_minute": 10,
    "reports_per_hour": 20
  },
  "audit_logging": {
    "log_all_queries": true,
    "log_all_actions": true,
    "retention_days": 90
  },
  "fallback_responses": {
    "cant_understand": "I'm not sure what you mean. Could you rephrase that?",
    "no_permission": "You don't have permission to do that. Contact your manager.",
    "action_failed": "I couldn't complete that action. Error: {error}. Please try manually.",
    "data_not_found": "I couldn't find {entity}. Check the ID or try a different search."
  }
}
```

---

## 7. training_and_feedback

```json
{
  "feedback_mechanisms": [
    {
      "type": "thumbs_up_down",
      "location": "each response",
      "data_captured": ["response_id", "rating", "query"]
    },
    {
      "type": "report_issue",
      "location": "response overflow menu",
      "data_captured": ["response_id", "issue_type", "user_comment"]
    },
    {
      "type": "implicit_feedback",
      "signals": ["user_followed_suggestion", "user_ignored_suggestion", "user_asked_followup"]
    }
  ],
  "improvement_loop": {
    "review_frequency": "weekly",
    "low_rating_threshold": 3.0,
    "escalation": "flagged for human review",
    "model_update": "monthly fine-tuning"
  },
  "knowledge_sources": [
    { "source": "help_docs", "format": "markdown", "update": "on_publish" },
    { "source": "faq", "format": "json", "update": "manual" },
    { "source": "entity_schemas", "format": "prisma", "update": "on_migration" },
    { "source": "business_rules", "format": "json", "update": "on_config_change" }
  ]
}
```

---

## 8. integration_api

```json
{
  "endpoints": [
    {
      "method": "POST",
      "path": "/api/assistant/query",
      "body": { "message": "string", "context": "object", "conversation_id": "uuid" },
      "response": { "response": "string", "data": "object", "actions": "array", "suggestions": "array" }
    },
    {
      "method": "POST",
      "path": "/api/assistant/action",
      "body": { "action_id": "string", "params": "object", "confirmed": "boolean" },
      "response": { "success": "boolean", "result": "object", "message": "string" }
    },
    {
      "method": "POST",
      "path": "/api/assistant/feedback",
      "body": { "response_id": "uuid", "rating": "number", "comment": "string" },
      "response": { "acknowledged": "boolean" }
    },
    {
      "method": "GET",
      "path": "/api/assistant/suggestions",
      "query": "context={screen_id}",
      "response": { "suggestions": ["string"] }
    }
  ],
  "websocket": {
    "path": "/ws/assistant",
    "events": ["typing", "response_chunk", "action_result"]
  }
}
```
