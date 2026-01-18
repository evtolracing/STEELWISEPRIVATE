# 57 — Build Job Lifecycle State Machine

> **Purpose:** State machine definition for processing job lifecycle driving UI states across apps.  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. state_machine

```yaml
states:
  - id: ORDERED
    label: Ordered
    description: Sales order line created, awaiting material receipt or allocation from existing inventory
    entry_actions:
      - create_job_record
      - reserve_inventory_if_available
      - notify_planning_queue
      - set_sla_clock_order_to_schedule
    exit_actions:
      - log_state_transition
      - update_order_line_status
    visible_in_apps:
      - order_intake_app
      - planning_scheduling_app
      - customer_status_portal_app
    badge_color: gray

  - id: RECEIVED
    label: Material Received
    description: Raw material received and available for processing; awaiting scheduling
    entry_actions:
      - link_material_to_job
      - attach_mtr_if_available
      - notify_planner
      - update_material_allocation
    exit_actions:
      - log_state_transition
      - confirm_material_reserved
    visible_in_apps:
      - order_intake_app
      - planning_scheduling_app
      - shipping_receiving_app
      - customer_status_portal_app
    badge_color: blue

  - id: SCHEDULED
    label: Scheduled
    description: Work order created and assigned to work center with target date
    entry_actions:
      - create_work_order
      - assign_work_center
      - calculate_promise_date
      - notify_shop_floor_queue
      - set_sla_clock_schedule_to_start
    exit_actions:
      - log_state_transition
      - update_capacity_commitment
    visible_in_apps:
      - order_intake_app
      - planning_scheduling_app
      - shop_floor_app
      - customer_status_portal_app
    badge_color: purple

  - id: IN_PROCESS
    label: In Process
    description: Active processing on shop floor; operator clocked in
    entry_actions:
      - start_labor_clock
      - update_work_center_status
      - notify_customer_in_progress
      - set_sla_clock_processing_time
    exit_actions:
      - stop_labor_clock
      - record_output_quantity
      - calculate_actual_vs_standard
    visible_in_apps:
      - planning_scheduling_app
      - shop_floor_app
      - customer_status_portal_app
    badge_color: orange

  - id: WAITING_QC
    label: Awaiting QC
    description: Processing complete; awaiting quality inspection or test results
    entry_actions:
      - queue_for_inspection
      - notify_qa_team
      - set_sla_clock_qc_wait
    exit_actions:
      - record_qc_result
      - attach_qc_documents
    visible_in_apps:
      - planning_scheduling_app
      - shop_floor_app
      - customer_status_portal_app
    badge_color: yellow

  - id: PACKAGING
    label: Packaging
    description: Material being packaged, labeled, and prepared for shipment
    entry_actions:
      - create_package_record
      - generate_labels
      - assign_to_staging_location
    exit_actions:
      - record_package_weight
      - attach_package_photos
      - update_inventory_location
    visible_in_apps:
      - shop_floor_app
      - shipping_receiving_app
      - customer_status_portal_app
    badge_color: teal

  - id: READY_TO_SHIP
    label: Ready to Ship
    description: Packaged and staged at dock; awaiting carrier pickup or will-call
    entry_actions:
      - move_to_staging_location
      - notify_shipping_team
      - notify_customer_ready
      - set_sla_clock_ship_window
    exit_actions:
      - log_state_transition
    visible_in_apps:
      - order_intake_app
      - shipping_receiving_app
      - customer_status_portal_app
    badge_color: cyan

  - id: SHIPPED
    label: Shipped
    description: Material loaded and departed; tracking available
    entry_actions:
      - generate_bol
      - capture_tracking_number
      - trigger_invoice
      - notify_customer_shipped
      - update_inventory_consumed
    exit_actions:
      - log_state_transition
    visible_in_apps:
      - order_intake_app
      - shipping_receiving_app
      - customer_status_portal_app
    badge_color: green

  - id: COMPLETED
    label: Completed
    description: Customer confirmed receipt; job closed
    entry_actions:
      - mark_job_complete
      - calculate_final_costs
      - update_customer_history
      - archive_job_documents
    exit_actions:
      - log_state_transition
    visible_in_apps:
      - order_intake_app
      - customer_status_portal_app
    badge_color: green

  - id: BILLED
    label: Billed
    description: Invoice generated and sent to customer
    entry_actions:
      - generate_invoice
      - send_invoice
      - update_ar
      - close_job_financials
    exit_actions:
      - log_state_transition
    visible_in_apps:
      - order_intake_app
      - customer_status_portal_app
    badge_color: green

  # --- Failure/Exception States ---

  - id: ON_HOLD
    label: On Hold
    description: Job paused due to customer request, credit issue, or material problem
    entry_actions:
      - pause_sla_clocks
      - notify_stakeholders
      - log_hold_reason
    exit_actions:
      - resume_sla_clocks
      - log_release_reason
    visible_in_apps:
      - order_intake_app
      - planning_scheduling_app
      - shop_floor_app
      - shipping_receiving_app
      - customer_status_portal_app
    badge_color: red

  - id: NCR_PENDING
    label: NCR Pending
    description: Non-conformance reported; awaiting disposition
    entry_actions:
      - create_ncr_record
      - notify_qa_manager
      - pause_job_progress
      - set_sla_clock_ncr_resolution
    exit_actions:
      - record_ncr_disposition
      - log_corrective_action
    visible_in_apps:
      - planning_scheduling_app
      - shop_floor_app
      - customer_status_portal_app
    badge_color: red

  - id: CANCELLED
    label: Cancelled
    description: Job cancelled; material returned to stock or scrapped
    entry_actions:
      - cancel_work_orders
      - release_material_reservation
      - notify_customer_cancelled
      - calculate_cancellation_charges
    exit_actions:
      - archive_job
    visible_in_apps:
      - order_intake_app
      - planning_scheduling_app
      - customer_status_portal_app
    badge_color: gray

  - id: RETURNED
    label: Returned
    description: Customer returned material after shipment
    entry_actions:
      - create_rma_record
      - receive_returned_material
      - inspect_returned_material
      - determine_credit_or_rework
    exit_actions:
      - close_rma
    visible_in_apps:
      - order_intake_app
      - shipping_receiving_app
      - customer_status_portal_app
    badge_color: red

transitions:
  # --- Happy Path ---
  
  - from: ORDERED
    to: RECEIVED
    event: material.received
    guard: material_matches_job_requirements
    allowed_roles:
      - SHIPPING
      - PURCHASING
    side_effects:
      - update_order_line_material_status
      - notify_planner_material_available

  - from: ORDERED
    to: SCHEDULED
    event: inventory.allocated
    guard: sufficient_inventory_available
    allowed_roles:
      - PLANNER
      - CSR
    side_effects:
      - reserve_inventory
      - skip_receiving_step

  - from: RECEIVED
    to: SCHEDULED
    event: work_order.scheduled
    guard: capacity_available
    allowed_roles:
      - PLANNER
    side_effects:
      - update_capacity_calendar
      - notify_shop_floor

  - from: SCHEDULED
    to: IN_PROCESS
    event: operation.started
    guard: operator_clocked_in AND material_at_work_center
    allowed_roles:
      - OPERATOR
    side_effects:
      - start_labor_tracking
      - update_work_center_status

  - from: IN_PROCESS
    to: WAITING_QC
    event: operation.completed_pending_qc
    guard: qc_required_for_product
    allowed_roles:
      - OPERATOR
      - QA_MANAGER
    side_effects:
      - queue_inspection
      - stop_processing_labor

  - from: IN_PROCESS
    to: PACKAGING
    event: operation.completed
    guard: no_qc_required OR inline_qc_passed
    allowed_roles:
      - OPERATOR
    side_effects:
      - record_output
      - release_work_center

  - from: WAITING_QC
    to: PACKAGING
    event: qc.passed
    guard: all_inspections_passed
    allowed_roles:
      - QA_MANAGER
      - OPERATOR
    side_effects:
      - attach_qc_certificate
      - release_for_packaging

  - from: WAITING_QC
    to: NCR_PENDING
    event: qc.failed
    guard: inspection_failed
    allowed_roles:
      - QA_MANAGER
    side_effects:
      - create_ncr
      - notify_planner

  - from: PACKAGING
    to: READY_TO_SHIP
    event: packaging.completed
    guard: package_weight_captured AND labels_applied
    allowed_roles:
      - OPERATOR
      - SHIPPING
    side_effects:
      - assign_staging_location
      - notify_shipping_queue

  - from: READY_TO_SHIP
    to: SHIPPED
    event: shipment.departed
    guard: bol_generated AND carrier_checked_out
    allowed_roles:
      - SHIPPING
    side_effects:
      - consume_inventory
      - trigger_billing
      - send_ship_notification

  - from: SHIPPED
    to: COMPLETED
    event: delivery.confirmed
    guard: pod_received OR customer_confirmed
    allowed_roles:
      - SHIPPING
      - CSR
    side_effects:
      - close_shipment
      - update_customer_history

  - from: SHIPPED
    to: BILLED
    event: invoice.generated
    guard: billing_triggered
    allowed_roles:
      - FINANCE
    side_effects:
      - create_ar_entry
      - send_invoice

  - from: COMPLETED
    to: BILLED
    event: invoice.generated
    guard: billing_triggered
    allowed_roles:
      - FINANCE
    side_effects:
      - create_ar_entry
      - send_invoice

  # --- Rescheduling / Replanning ---

  - from: SCHEDULED
    to: SCHEDULED
    event: work_order.rescheduled
    guard: new_date_valid
    allowed_roles:
      - PLANNER
      - BRANCH_MANAGER
    side_effects:
      - update_capacity
      - notify_customer_if_promise_changed
      - log_reschedule_reason

  - from: IN_PROCESS
    to: SCHEDULED
    event: operation.interrupted
    guard: incomplete_output
    allowed_roles:
      - PLANNER
      - OPERATOR
    side_effects:
      - log_interruption_reason
      - reschedule_remaining_work

  # --- Hold Transitions ---

  - from: ORDERED
    to: ON_HOLD
    event: job.hold_requested
    guard: valid_hold_reason
    allowed_roles:
      - CSR
      - BRANCH_MANAGER
      - FINANCE
    side_effects:
      - pause_sla
      - notify_stakeholders

  - from: RECEIVED
    to: ON_HOLD
    event: job.hold_requested
    guard: valid_hold_reason
    allowed_roles:
      - CSR
      - BRANCH_MANAGER
      - PLANNER
    side_effects:
      - pause_sla
      - notify_stakeholders

  - from: SCHEDULED
    to: ON_HOLD
    event: job.hold_requested
    guard: valid_hold_reason
    allowed_roles:
      - CSR
      - BRANCH_MANAGER
      - PLANNER
    side_effects:
      - pause_sla
      - remove_from_schedule
      - notify_shop_floor

  - from: READY_TO_SHIP
    to: ON_HOLD
    event: job.hold_requested
    guard: valid_hold_reason
    allowed_roles:
      - CSR
      - BRANCH_MANAGER
      - FINANCE
    side_effects:
      - pause_sla
      - hold_shipment

  - from: ON_HOLD
    to: ORDERED
    event: job.released
    guard: hold_reason_resolved AND state_before_hold == ORDERED
    allowed_roles:
      - CSR
      - BRANCH_MANAGER
    side_effects:
      - resume_sla
      - restore_original_state

  - from: ON_HOLD
    to: RECEIVED
    event: job.released
    guard: hold_reason_resolved AND state_before_hold == RECEIVED
    allowed_roles:
      - CSR
      - BRANCH_MANAGER
    side_effects:
      - resume_sla
      - restore_original_state

  - from: ON_HOLD
    to: SCHEDULED
    event: job.released
    guard: hold_reason_resolved AND state_before_hold == SCHEDULED
    allowed_roles:
      - PLANNER
      - BRANCH_MANAGER
    side_effects:
      - resume_sla
      - re_add_to_schedule

  - from: ON_HOLD
    to: READY_TO_SHIP
    event: job.released
    guard: hold_reason_resolved AND state_before_hold == READY_TO_SHIP
    allowed_roles:
      - CSR
      - BRANCH_MANAGER
    side_effects:
      - resume_sla
      - release_for_shipment

  # --- NCR Resolution ---

  - from: NCR_PENDING
    to: IN_PROCESS
    event: ncr.rework_ordered
    guard: rework_disposition
    allowed_roles:
      - QA_MANAGER
      - PLANNER
    side_effects:
      - create_rework_work_order
      - log_rework_cost

  - from: NCR_PENDING
    to: PACKAGING
    event: ncr.use_as_is
    guard: use_as_is_approved
    allowed_roles:
      - QA_MANAGER
      - BRANCH_MANAGER
    side_effects:
      - document_concession
      - notify_customer_if_required

  - from: NCR_PENDING
    to: CANCELLED
    event: ncr.scrap_ordered
    guard: scrap_disposition
    allowed_roles:
      - QA_MANAGER
      - BRANCH_MANAGER
    side_effects:
      - record_scrap
      - create_replacement_job_if_needed

  # --- Cancellation ---

  - from: ORDERED
    to: CANCELLED
    event: job.cancelled
    guard: cancellation_approved
    allowed_roles:
      - CSR
      - BRANCH_MANAGER
    side_effects:
      - release_reservations
      - calculate_cancellation_fee

  - from: RECEIVED
    to: CANCELLED
    event: job.cancelled
    guard: cancellation_approved
    allowed_roles:
      - CSR
      - BRANCH_MANAGER
    side_effects:
      - return_material_to_stock
      - calculate_cancellation_fee

  - from: SCHEDULED
    to: CANCELLED
    event: job.cancelled
    guard: cancellation_approved AND not_in_process
    allowed_roles:
      - CSR
      - BRANCH_MANAGER
      - PLANNER
    side_effects:
      - cancel_work_order
      - release_capacity
      - return_material_to_stock

  - from: ON_HOLD
    to: CANCELLED
    event: job.cancelled
    guard: cancellation_approved
    allowed_roles:
      - CSR
      - BRANCH_MANAGER
    side_effects:
      - cleanup_hold_state
      - release_all_reservations

  # --- Returns ---

  - from: SHIPPED
    to: RETURNED
    event: rma.received
    guard: rma_approved
    allowed_roles:
      - SHIPPING
      - CSR
    side_effects:
      - receive_returned_material
      - create_credit_memo_or_rework

  - from: COMPLETED
    to: RETURNED
    event: rma.received
    guard: rma_approved
    allowed_roles:
      - SHIPPING
      - CSR
    side_effects:
      - receive_returned_material
      - create_credit_memo_or_rework

  - from: RETURNED
    to: IN_PROCESS
    event: rework.ordered
    guard: rework_viable
    allowed_roles:
      - PLANNER
      - QA_MANAGER
    side_effects:
      - create_rework_work_order

  - from: RETURNED
    to: COMPLETED
    event: return.closed
    guard: credit_issued OR replacement_shipped
    allowed_roles:
      - CSR
      - FINANCE
    side_effects:
      - close_rma
      - update_customer_history

failure_paths:
  - name: quality_failure
    description: Material fails inspection after processing
    from_states:
      - IN_PROCESS
      - WAITING_QC
    to_state: NCR_PENDING
    trigger: qc.failed

  - name: customer_hold
    description: Customer requests hold due to project delay or payment issue
    from_states:
      - ORDERED
      - RECEIVED
      - SCHEDULED
      - READY_TO_SHIP
    to_state: ON_HOLD
    trigger: job.hold_requested

  - name: credit_hold
    description: Finance places hold due to credit limit or past due balance
    from_states:
      - ORDERED
      - READY_TO_SHIP
    to_state: ON_HOLD
    trigger: credit.hold_placed

  - name: material_defect
    description: Defect discovered in raw material during processing
    from_states:
      - IN_PROCESS
    to_state: NCR_PENDING
    trigger: material.defect_found

  - name: equipment_failure
    description: Machine breakdown interrupts processing
    from_states:
      - IN_PROCESS
    to_state: SCHEDULED
    trigger: equipment.down

  - name: customer_rejection
    description: Customer rejects delivered material
    from_states:
      - SHIPPED
      - COMPLETED
    to_state: RETURNED
    trigger: rma.received

  - name: cancellation
    description: Customer cancels order before shipment
    from_states:
      - ORDERED
      - RECEIVED
      - SCHEDULED
      - ON_HOLD
    to_state: CANCELLED
    trigger: job.cancelled

split_paths:
  - scenario: partial_processing
    description: Large coil/plate processed into multiple child items for different orders or stock
    from_state: IN_PROCESS
    results_in: multiple_child_jobs
    logic: |
      - Parent job marked COMPLETED
      - Child jobs created for each output piece
      - Each child job enters PACKAGING or READY_TO_SHIP independently
      - Traceability links parent to children

  - scenario: partial_shipment
    description: Customer requests split shipment; some items ship now, others later
    from_state: READY_TO_SHIP
    results_in: partial_shipments
    logic: |
      - Original job splits into shipped portion and remaining portion
      - Shipped portion transitions to SHIPPED
      - Remaining portion stays in READY_TO_SHIP or returns to SCHEDULED
      - Both link to original order line

  - scenario: multi_operation_job
    description: Job requires multiple sequential operations at different work centers
    from_state: SCHEDULED
    results_in: multiple_child_jobs
    logic: |
      - Work order has multiple operations
      - Each operation tracked independently
      - Job advances when all operations complete
      - Parent job state reflects bottleneck operation

  - scenario: rework_branch
    description: NCR disposition creates parallel rework job while original scrapped
    from_state: NCR_PENDING
    results_in: multiple_child_jobs
    logic: |
      - Original job marked with NCR resolution
      - New rework job created from replacement material
      - Both jobs linked for traceability
      - Customer sees combined status

merge_paths:
  - scenario: kit_assembly
    description: Multiple processed items combined into single kit/bundle for shipment
    merge_state: PACKAGING
    logic: |
      - Multiple child jobs from same order line
      - All must reach PACKAGING before merge
      - Combined package created
      - Single shipment for merged items

  - scenario: consolidated_shipment
    description: Multiple jobs for same customer combined into single shipment
    merge_state: READY_TO_SHIP
    logic: |
      - Jobs from different order lines, same customer
      - All staged at same location
      - Single BOL and shipment record
      - Individual invoices or combined based on customer preference

  - scenario: heat_consolidation
    description: Multiple pieces from same heat consolidated for certification
    merge_state: PACKAGING
    logic: |
      - Items share heat/lot number
      - Single MTR covers all pieces
      - May ship separately but share documentation
```

---

## 2. handoff_points

```json
[
  {
    "state": "ORDERED",
    "from_role": "CSR",
    "to_role": "PLANNER",
    "handoff_trigger": "order.created",
    "context_passed": ["order_id", "order_lines", "customer_requirements", "promise_date_requested"]
  },
  {
    "state": "ORDERED",
    "from_role": "CSR",
    "to_role": "PURCHASING",
    "handoff_trigger": "material.not_available",
    "context_passed": ["order_id", "material_requirements", "required_date"]
  },
  {
    "state": "RECEIVED",
    "from_role": "SHIPPING",
    "to_role": "PLANNER",
    "handoff_trigger": "material.received",
    "context_passed": ["receipt_id", "material_details", "mtr_attached", "quantity_received"]
  },
  {
    "state": "SCHEDULED",
    "from_role": "PLANNER",
    "to_role": "OPERATOR",
    "handoff_trigger": "work_order.released",
    "context_passed": ["work_order_id", "routing", "work_instructions", "target_date", "priority"]
  },
  {
    "state": "SCHEDULED",
    "from_role": "PLANNER",
    "to_role": "CSR",
    "handoff_trigger": "promise_date.confirmed",
    "context_passed": ["order_id", "promise_date", "work_order_id"]
  },
  {
    "state": "IN_PROCESS",
    "from_role": "OPERATOR",
    "to_role": "QA_MANAGER",
    "handoff_trigger": "operation.completed_pending_qc",
    "context_passed": ["work_order_id", "output_quantity", "inspection_required", "sample_location"]
  },
  {
    "state": "IN_PROCESS",
    "from_role": "OPERATOR",
    "to_role": "PLANNER",
    "handoff_trigger": "operation.delayed",
    "context_passed": ["work_order_id", "delay_reason", "new_estimate"]
  },
  {
    "state": "WAITING_QC",
    "from_role": "QA_MANAGER",
    "to_role": "OPERATOR",
    "handoff_trigger": "qc.passed",
    "context_passed": ["work_order_id", "qc_result", "certification_attached"]
  },
  {
    "state": "WAITING_QC",
    "from_role": "QA_MANAGER",
    "to_role": "PLANNER",
    "handoff_trigger": "qc.failed",
    "context_passed": ["work_order_id", "ncr_id", "failure_details", "recommended_disposition"]
  },
  {
    "state": "PACKAGING",
    "from_role": "OPERATOR",
    "to_role": "SHIPPING",
    "handoff_trigger": "packaging.completed",
    "context_passed": ["work_order_id", "package_id", "weight", "staging_location", "labels_applied"]
  },
  {
    "state": "READY_TO_SHIP",
    "from_role": "SHIPPING",
    "to_role": "CSR",
    "handoff_trigger": "shipment.ready_notification",
    "context_passed": ["order_id", "shipment_id", "ready_date", "will_call_or_carrier"]
  },
  {
    "state": "SHIPPED",
    "from_role": "SHIPPING",
    "to_role": "FINANCE",
    "handoff_trigger": "billing.triggered",
    "context_passed": ["shipment_id", "order_id", "shipped_quantities", "freight_charges", "bol_number"]
  },
  {
    "state": "SHIPPED",
    "from_role": "SHIPPING",
    "to_role": "CSR",
    "handoff_trigger": "shipment.departed",
    "context_passed": ["order_id", "tracking_number", "estimated_delivery"]
  },
  {
    "state": "NCR_PENDING",
    "from_role": "QA_MANAGER",
    "to_role": "PLANNER",
    "handoff_trigger": "ncr.disposition_required",
    "context_passed": ["ncr_id", "work_order_id", "options", "cost_impact"]
  },
  {
    "state": "NCR_PENDING",
    "from_role": "QA_MANAGER",
    "to_role": "CSR",
    "handoff_trigger": "ncr.customer_notification_required",
    "context_passed": ["ncr_id", "order_id", "impact_description", "proposed_resolution"]
  },
  {
    "state": "ON_HOLD",
    "from_role": "CSR",
    "to_role": "PLANNER",
    "handoff_trigger": "job.hold_placed",
    "context_passed": ["job_id", "hold_reason", "estimated_release_date"]
  },
  {
    "state": "ON_HOLD",
    "from_role": "FINANCE",
    "to_role": "CSR",
    "handoff_trigger": "credit.hold_placed",
    "context_passed": ["order_id", "customer_id", "hold_reason", "required_action"]
  },
  {
    "state": "RETURNED",
    "from_role": "SHIPPING",
    "to_role": "QA_MANAGER",
    "handoff_trigger": "rma.received",
    "context_passed": ["rma_id", "returned_material", "customer_complaint", "inspection_required"]
  },
  {
    "state": "RETURNED",
    "from_role": "QA_MANAGER",
    "to_role": "CSR",
    "handoff_trigger": "rma.inspected",
    "context_passed": ["rma_id", "inspection_result", "credit_recommendation", "rework_option"]
  }
]
```

---

## 3. SLA_rules

| state | SLA_clock_starts | SLA_clock_stops | late_thresholds | UI_indicator |
|-------|------------------|-----------------|-----------------|--------------|
| ORDERED | order.created | work_order.scheduled | warning: 4h, critical: 8h, escalate: 24h | Yellow clock icon at 4h, red at 8h, flashing red + manager alert at 24h |
| RECEIVED | receipt.completed | work_order.scheduled | warning: 2h, critical: 4h, escalate: 8h | Yellow badge at 2h, red badge at 4h, escalation banner at 8h |
| SCHEDULED | work_order.scheduled | operation.started | warning: schedule_date - 4h, critical: schedule_date, escalate: schedule_date + 4h | Yellow if approaching, red if past schedule, escalation if 4h late |
| IN_PROCESS | operation.started | operation.completed | warning: estimated_time * 1.2, critical: estimated_time * 1.5, escalate: estimated_time * 2.0 | Progress bar turns yellow > 120%, red > 150%, alert at 200% |
| WAITING_QC | qc.queued | qc.completed | warning: 2h, critical: 4h, escalate: 8h | Yellow timer at 2h, red timer at 4h, QA manager alert at 8h |
| PACKAGING | packaging.started | packaging.completed | warning: 1h, critical: 2h, escalate: 4h | Yellow badge at 1h, red at 2h, supervisor alert at 4h |
| READY_TO_SHIP | staging.completed | shipment.departed | warning: ship_date - 4h, critical: ship_date, escalate: ship_date + 2h | Yellow if same day, red if past ship date, shipping manager alert |
| ON_HOLD | hold.placed | hold.released | warning: 24h, critical: 72h, escalate: 168h (1 week) | Days on hold counter, yellow > 1 day, red > 3 days, manager review > 1 week |
| NCR_PENDING | ncr.created | ncr.dispositioned | warning: 4h, critical: 8h, escalate: 24h | NCR age badge, yellow > 4h, red > 8h, QA manager escalation > 24h |

---

## 4. State Visibility Matrix by App

| State | order_intake_app | planning_scheduling_app | shop_floor_app | shipping_receiving_app | customer_status_portal_app |
|-------|------------------|-------------------------|----------------|------------------------|---------------------------|
| ORDERED | Full detail | Queue item | Hidden | Hidden | "Order Received" |
| RECEIVED | Status badge | Queue item + material info | Hidden | Receipt detail | "Material Received" |
| SCHEDULED | Status badge + date | Full schedule view | Job queue | Hidden | "In Production Queue" |
| IN_PROCESS | Status badge | Progress view | Active job panel | Hidden | "Being Processed" |
| WAITING_QC | Status badge | Alert if delayed | QC queue | Hidden | "Quality Check" |
| PACKAGING | Status badge | Progress view | Packaging station | Staging queue | "Preparing for Shipment" |
| READY_TO_SHIP | Ready indicator | Complete indicator | Hidden | Full staging view | "Ready to Ship" |
| SHIPPED | Shipped badge + tracking | Archive | Hidden | Shipment history | "Shipped" + tracking link |
| COMPLETED | Complete badge | Archive | Hidden | Archive | "Delivered" |
| BILLED | Invoice link | Hidden | Hidden | Hidden | Invoice available |
| ON_HOLD | Hold banner + reason | Hold indicator | Hold indicator | Hold indicator | "On Hold" (no reason) |
| NCR_PENDING | Alert badge | NCR detail | NCR detail | Hidden | "Quality Review" |
| CANCELLED | Cancelled badge | Removed | Removed | Removed | "Cancelled" |
| RETURNED | RMA badge | Hidden | Hidden | RMA processing | "Return in Progress" |

---

## 5. Customer-Facing Status Mapping

```json
{
  "status_mapping": [
    { "internal_states": ["ORDERED"], "customer_status": "Order Received", "description": "We have received your order and are preparing it for production." },
    { "internal_states": ["RECEIVED"], "customer_status": "Material Ready", "description": "Material is available and your order will be scheduled shortly." },
    { "internal_states": ["SCHEDULED"], "customer_status": "Scheduled for Production", "description": "Your order is scheduled for processing.", "show_date": true },
    { "internal_states": ["IN_PROCESS"], "customer_status": "In Production", "description": "Your order is currently being processed." },
    { "internal_states": ["WAITING_QC"], "customer_status": "Quality Inspection", "description": "Your order is undergoing quality inspection." },
    { "internal_states": ["PACKAGING"], "customer_status": "Preparing for Shipment", "description": "Your order is being packaged and prepared for shipment." },
    { "internal_states": ["READY_TO_SHIP"], "customer_status": "Ready to Ship", "description": "Your order is ready and awaiting pickup or carrier.", "show_action": "will_call_or_track" },
    { "internal_states": ["SHIPPED"], "customer_status": "Shipped", "description": "Your order has shipped.", "show_tracking": true },
    { "internal_states": ["COMPLETED"], "customer_status": "Delivered", "description": "Your order has been delivered." },
    { "internal_states": ["BILLED"], "customer_status": "Delivered", "description": "Your order has been delivered. Invoice available.", "show_invoice": true },
    { "internal_states": ["ON_HOLD"], "customer_status": "On Hold", "description": "Your order is temporarily on hold. Please contact us for details." },
    { "internal_states": ["NCR_PENDING"], "customer_status": "Quality Review", "description": "Your order is undergoing additional quality review." },
    { "internal_states": ["CANCELLED"], "customer_status": "Cancelled", "description": "This order has been cancelled." },
    { "internal_states": ["RETURNED"], "customer_status": "Return Processing", "description": "We are processing your return." }
  ]
}
```

---

## 6. State Transition Audit Schema

```json
{
  "audit_record": {
    "id": "uuid",
    "job_id": "string",
    "work_order_id": "string (nullable)",
    "from_state": "state_id",
    "to_state": "state_id",
    "event": "string",
    "triggered_by_user_id": "string",
    "triggered_by_role": "role_id",
    "timestamp": "ISO8601",
    "context": {
      "reason": "string (nullable)",
      "notes": "string (nullable)",
      "related_entities": ["entity_type:entity_id"],
      "sla_status_at_transition": "on_time | warning | critical | escalated"
    },
    "system_generated": "boolean",
    "reversible": "boolean",
    "reversed_by": "audit_record_id (nullable)"
  }
}
```

---

*Document generated for Build Phase: Job Lifecycle State Machine*
