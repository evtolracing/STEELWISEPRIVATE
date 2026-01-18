# 39 — AI Workflows & Lifecycle

> **Purpose:** Job lifecycle state machines, handoff points, and SLA rules for AI-build.  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. Order Lifecycle State Machine

```yaml
state_machine:
  name: OrderLifecycle
  version: "1.0"
  initial_state: DRAFT

  states:
    - id: DRAFT
      type: initial
      description: "Order being created, not yet submitted"
      allowed_actions: ["edit", "add_line", "remove_line", "submit", "cancel"]
      timeout: null
      
    - id: PENDING_CREDIT
      type: intermediate
      description: "Awaiting credit check approval"
      allowed_actions: ["approve_credit", "reject_credit", "override_credit"]
      timeout: 4h
      timeout_action: escalate_credit
      
    - id: CREDIT_HOLD
      type: hold
      description: "Order held due to credit issues"
      allowed_actions: ["release_hold", "cancel", "escalate"]
      timeout: 48h
      timeout_action: notify_sales
      
    - id: CONFIRMED
      type: intermediate
      description: "Order confirmed, ready for processing"
      allowed_actions: ["modify", "cancel", "release_to_production"]
      timeout: null
      
    - id: ALLOCATING
      type: processing
      description: "Inventory being allocated"
      allowed_actions: ["retry_allocation", "partial_allocate", "backorder"]
      timeout: 15m
      timeout_action: alert_inventory
      
    - id: ALLOCATED
      type: intermediate
      description: "Inventory allocated, ready for production"
      allowed_actions: ["release_to_production", "deallocate", "modify"]
      timeout: null
      
    - id: PARTIAL_ALLOCATED
      type: intermediate
      description: "Some lines allocated, others pending"
      allowed_actions: ["release_partial", "wait_for_full", "backorder_remaining"]
      timeout: 24h
      timeout_action: notify_customer
      
    - id: BACKORDERED
      type: hold
      description: "Material not available, awaiting replenishment"
      allowed_actions: ["allocate_when_available", "cancel", "substitute"]
      timeout: 72h
      timeout_action: escalate_purchasing
      
    - id: IN_PRODUCTION
      type: processing
      description: "Work orders active on shop floor"
      allowed_actions: ["track_progress", "expedite", "hold"]
      timeout: null
      
    - id: PRODUCTION_HOLD
      type: hold
      description: "Production paused due to issue"
      allowed_actions: ["resume", "cancel", "reroute"]
      timeout: 4h
      timeout_action: escalate_supervisor
      
    - id: QUALITY_HOLD
      type: hold
      description: "Awaiting quality inspection/approval"
      allowed_actions: ["approve_quality", "reject", "rework"]
      timeout: 8h
      timeout_action: escalate_qa
      
    - id: READY_TO_SHIP
      type: intermediate
      description: "Production complete, awaiting shipment"
      allowed_actions: ["create_shipment", "hold", "split_shipment"]
      timeout: 24h
      timeout_action: alert_shipping
      
    - id: PICKING
      type: processing
      description: "Material being picked for shipment"
      allowed_actions: ["complete_pick", "report_shortage"]
      timeout: 2h
      timeout_action: alert_warehouse
      
    - id: PACKING
      type: processing
      description: "Material being packaged"
      allowed_actions: ["complete_pack", "report_issue"]
      timeout: 2h
      timeout_action: alert_shipping
      
    - id: AWAITING_PICKUP
      type: intermediate
      description: "Ready for carrier pickup or will-call"
      allowed_actions: ["ship", "reschedule", "will_call_pickup"]
      timeout: 48h
      timeout_action: notify_customer
      
    - id: SHIPPED
      type: intermediate
      description: "In transit to customer"
      allowed_actions: ["track", "report_exception"]
      timeout: null
      
    - id: DELIVERED
      type: intermediate
      description: "Delivered to customer, awaiting POD"
      allowed_actions: ["capture_pod", "report_damage", "report_shortage"]
      timeout: 24h
      timeout_action: request_pod
      
    - id: COMPLETED
      type: final
      description: "Order fulfilled and closed"
      allowed_actions: ["view", "return", "claim"]
      timeout: null
      
    - id: CANCELLED
      type: final
      description: "Order cancelled"
      allowed_actions: ["view", "reinstate"]
      timeout: null
      
    - id: RETURNED
      type: final
      description: "Order returned by customer"
      allowed_actions: ["view", "process_credit"]
      timeout: null

  transitions:
    - id: TXN-001
      from: DRAFT
      to: PENDING_CREDIT
      event: submit_order
      guard: order_valid
      action: initiate_credit_check
      
    - id: TXN-002
      from: DRAFT
      to: CONFIRMED
      event: submit_order
      guard: [order_valid, credit_preapproved]
      action: confirm_order
      
    - id: TXN-003
      from: PENDING_CREDIT
      to: CONFIRMED
      event: credit_approved
      guard: null
      action: confirm_order
      
    - id: TXN-004
      from: PENDING_CREDIT
      to: CREDIT_HOLD
      event: credit_denied
      guard: null
      action: notify_sales
      
    - id: TXN-005
      from: CREDIT_HOLD
      to: CONFIRMED
      event: credit_released
      guard: credit_issue_resolved
      action: confirm_order
      
    - id: TXN-006
      from: CREDIT_HOLD
      to: CANCELLED
      event: cancel_order
      guard: null
      action: close_order
      
    - id: TXN-007
      from: CONFIRMED
      to: ALLOCATING
      event: start_allocation
      guard: null
      action: request_inventory
      
    - id: TXN-008
      from: ALLOCATING
      to: ALLOCATED
      event: allocation_complete
      guard: all_lines_allocated
      action: confirm_allocation
      
    - id: TXN-009
      from: ALLOCATING
      to: PARTIAL_ALLOCATED
      event: allocation_complete
      guard: some_lines_allocated
      action: notify_partial
      
    - id: TXN-010
      from: ALLOCATING
      to: BACKORDERED
      event: allocation_failed
      guard: no_inventory_available
      action: create_backorder
      
    - id: TXN-011
      from: PARTIAL_ALLOCATED
      to: ALLOCATED
      event: remaining_allocated
      guard: all_lines_allocated
      action: confirm_allocation
      
    - id: TXN-012
      from: PARTIAL_ALLOCATED
      to: IN_PRODUCTION
      event: release_partial
      guard: partial_release_approved
      action: create_work_orders
      
    - id: TXN-013
      from: BACKORDERED
      to: ALLOCATING
      event: inventory_available
      guard: material_received
      action: retry_allocation
      
    - id: TXN-014
      from: ALLOCATED
      to: IN_PRODUCTION
      event: release_to_production
      guard: null
      action: create_work_orders
      
    - id: TXN-015
      from: IN_PRODUCTION
      to: PRODUCTION_HOLD
      event: production_issue
      guard: null
      action: notify_supervisor
      
    - id: TXN-016
      from: PRODUCTION_HOLD
      to: IN_PRODUCTION
      event: resume_production
      guard: issue_resolved
      action: resume_work_orders
      
    - id: TXN-017
      from: IN_PRODUCTION
      to: QUALITY_HOLD
      event: quality_inspection_required
      guard: inspection_triggered
      action: create_inspection
      
    - id: TXN-018
      from: QUALITY_HOLD
      to: IN_PRODUCTION
      event: quality_passed
      guard: null
      action: continue_production
      
    - id: TXN-019
      from: QUALITY_HOLD
      to: IN_PRODUCTION
      event: rework_required
      guard: rework_feasible
      action: create_rework_order
      
    - id: TXN-020
      from: IN_PRODUCTION
      to: READY_TO_SHIP
      event: production_complete
      guard: all_work_orders_complete
      action: stage_for_shipping
      
    - id: TXN-021
      from: READY_TO_SHIP
      to: PICKING
      event: start_picking
      guard: null
      action: create_pick_list
      
    - id: TXN-022
      from: PICKING
      to: PACKING
      event: picking_complete
      guard: all_items_picked
      action: start_packing
      
    - id: TXN-023
      from: PACKING
      to: AWAITING_PICKUP
      event: packing_complete
      guard: null
      action: schedule_carrier
      
    - id: TXN-024
      from: AWAITING_PICKUP
      to: SHIPPED
      event: carrier_pickup
      guard: bol_generated
      action: update_shipment_status
      
    - id: TXN-025
      from: AWAITING_PICKUP
      to: COMPLETED
      event: will_call_pickup
      guard: customer_signed
      action: complete_order
      
    - id: TXN-026
      from: SHIPPED
      to: DELIVERED
      event: delivery_confirmed
      guard: null
      action: request_pod
      
    - id: TXN-027
      from: DELIVERED
      to: COMPLETED
      event: pod_received
      guard: null
      action: complete_order
      
    - id: TXN-028
      from: COMPLETED
      to: RETURNED
      event: return_initiated
      guard: return_authorized
      action: create_rma

  guards:
    - id: order_valid
      description: "All required fields present and valid"
      validation:
        - customer_id: required
        - lines: "count >= 1"
        - ship_to: required
        - payment_terms: required
        
    - id: credit_preapproved
      description: "Customer has sufficient credit limit"
      validation:
        - credit_status: active
        - available_credit: ">= order_value"
        - days_past_due: "<= 30"
        
    - id: credit_issue_resolved
      description: "Credit hold reason addressed"
      validation:
        - payment_received: true
        - or:
          - credit_limit_increased: true
          - credit_override_approved: true
          
    - id: all_lines_allocated
      description: "All order lines have inventory allocated"
      validation:
        - allocated_lines: "== total_lines"
        - allocation_status: complete
        
    - id: some_lines_allocated
      description: "At least one but not all lines allocated"
      validation:
        - allocated_lines: "> 0"
        - allocated_lines: "< total_lines"
        
    - id: no_inventory_available
      description: "No inventory available for any line"
      validation:
        - allocated_lines: "== 0"
        
    - id: partial_release_approved
      description: "Customer approved partial shipment"
      validation:
        - partial_ship_ok: true
        - or:
          - customer_confirmation: received
          - customer_blanket_approval: true
          
    - id: issue_resolved
      description: "Production issue has been addressed"
      validation:
        - hold_reason: resolved
        - resolution_notes: present
        
    - id: inspection_triggered
      description: "Inspection required per plan or exception"
      validation:
        - or:
          - inspection_plan_requires: true
          - operator_flagged: true
          - customer_requires: true
          
    - id: rework_feasible
      description: "Rework is possible and cost-effective"
      validation:
        - defect_type: reworkable
        - rework_cost: "<= scrap_cost + replacement_cost"
        
    - id: all_work_orders_complete
      description: "All work orders for order are complete"
      validation:
        - work_order_status: all_complete
        - quality_status: all_passed
        
    - id: all_items_picked
      description: "All items on pick list collected"
      validation:
        - picked_quantity: "== required_quantity"
        - pick_status: complete
        
    - id: bol_generated
      description: "Bill of lading has been generated"
      validation:
        - bol_number: present
        - bol_signed: true
        
    - id: customer_signed
      description: "Customer has signed for will-call pickup"
      validation:
        - signature_captured: true
        - id_verified: true
        
    - id: return_authorized
      description: "Return has been authorized"
      validation:
        - rma_number: present
        - return_reason: valid
        - within_return_period: true

  events:
    - id: EVT-001
      name: submit_order
      source: [user, api, edi, portal]
      payload: OrderDTO
      
    - id: EVT-002
      name: credit_approved
      source: [credit_system, user_override]
      payload: CreditDecisionDTO
      
    - id: EVT-003
      name: credit_denied
      source: credit_system
      payload: CreditDecisionDTO
      
    - id: EVT-004
      name: credit_released
      source: [user, payment_system]
      payload: CreditReleaseDTO
      
    - id: EVT-005
      name: cancel_order
      source: [user, customer, system]
      payload: CancellationDTO
      
    - id: EVT-006
      name: start_allocation
      source: system
      payload: AllocationRequestDTO
      
    - id: EVT-007
      name: allocation_complete
      source: inventory_system
      payload: AllocationResultDTO
      
    - id: EVT-008
      name: allocation_failed
      source: inventory_system
      payload: AllocationFailureDTO
      
    - id: EVT-009
      name: remaining_allocated
      source: inventory_system
      payload: AllocationResultDTO
      
    - id: EVT-010
      name: release_partial
      source: user
      payload: PartialReleaseDTO
      
    - id: EVT-011
      name: inventory_available
      source: inventory_system
      payload: AvailabilityDTO
      
    - id: EVT-012
      name: release_to_production
      source: [user, scheduler]
      payload: ReleaseDTO
      
    - id: EVT-013
      name: production_issue
      source: [operator, system]
      payload: ProductionIssueDTO
      
    - id: EVT-014
      name: resume_production
      source: supervisor
      payload: ResumeDTO
      
    - id: EVT-015
      name: quality_inspection_required
      source: [system, operator]
      payload: InspectionRequestDTO
      
    - id: EVT-016
      name: quality_passed
      source: qa_inspector
      payload: InspectionResultDTO
      
    - id: EVT-017
      name: rework_required
      source: qa_inspector
      payload: ReworkDTO
      
    - id: EVT-018
      name: production_complete
      source: shop_floor_system
      payload: ProductionCompleteDTO
      
    - id: EVT-019
      name: start_picking
      source: [user, scheduler]
      payload: PickRequestDTO
      
    - id: EVT-020
      name: picking_complete
      source: warehouse_system
      payload: PickCompleteDTO
      
    - id: EVT-021
      name: packing_complete
      source: shipping_system
      payload: PackCompleteDTO
      
    - id: EVT-022
      name: carrier_pickup
      source: [carrier, user]
      payload: ShipmentDTO
      
    - id: EVT-023
      name: will_call_pickup
      source: user
      payload: WillCallDTO
      
    - id: EVT-024
      name: delivery_confirmed
      source: [carrier, driver]
      payload: DeliveryDTO
      
    - id: EVT-025
      name: pod_received
      source: [carrier, driver, user]
      payload: PODDTO
      
    - id: EVT-026
      name: return_initiated
      source: [customer, user]
      payload: ReturnDTO

  failure_paths:
    - id: FAIL-001
      from: PENDING_CREDIT
      to: CANCELLED
      trigger: credit_timeout_exceeded
      action: auto_cancel_notify
      
    - id: FAIL-002
      from: CREDIT_HOLD
      to: CANCELLED
      trigger: hold_timeout_exceeded
      action: auto_cancel_notify
      
    - id: FAIL-003
      from: ALLOCATING
      to: BACKORDERED
      trigger: allocation_timeout
      action: escalate_to_purchasing
      
    - id: FAIL-004
      from: BACKORDERED
      to: CANCELLED
      trigger: backorder_timeout_exceeded
      action: notify_customer_cancel
      
    - id: FAIL-005
      from: PRODUCTION_HOLD
      to: CANCELLED
      trigger: production_unfeasible
      action: notify_all_parties
      
    - id: FAIL-006
      from: QUALITY_HOLD
      to: CANCELLED
      trigger: quality_unrepairable
      action: scrap_and_reorder
      
    - id: FAIL-007
      from: PICKING
      to: PARTIAL_ALLOCATED
      trigger: pick_shortage
      action: investigate_discrepancy
      
    - id: FAIL-008
      from: SHIPPED
      to: RETURNED
      trigger: delivery_refused
      action: create_return_shipment

  split_paths:
    - id: SPLIT-001
      name: partial_shipment
      from: READY_TO_SHIP
      split_condition: customer_allows_partial
      branches:
        - branch_id: ship_available
          to: PICKING
          filter: allocated_lines
        - branch_id: backorder_remaining
          to: BACKORDERED
          filter: unallocated_lines
      merge_at: COMPLETED
      
    - id: SPLIT-002
      name: multi_location_fulfillment
      from: ALLOCATED
      split_condition: inventory_at_multiple_locations
      branches:
        - branch_id: location_a
          to: IN_PRODUCTION
          filter: "location = 'A'"
        - branch_id: location_b
          to: IN_PRODUCTION
          filter: "location = 'B'"
      merge_at: READY_TO_SHIP
      
    - id: SPLIT-003
      name: mixed_stock_production
      from: ALLOCATED
      split_condition: mixed_fulfillment_type
      branches:
        - branch_id: stock_items
          to: PICKING
          filter: fulfillment_type = 'stock'
        - branch_id: production_items
          to: IN_PRODUCTION
          filter: fulfillment_type = 'make'
      merge_at: PACKING

  merge_paths:
    - id: MERGE-001
      name: partial_shipment_merge
      from_branches: [ship_available, backorder_remaining]
      to: COMPLETED
      merge_condition: all_branches_shipped
      action: consolidate_order
      
    - id: MERGE-002
      name: multi_location_merge
      from_branches: [location_a, location_b]
      to: READY_TO_SHIP
      merge_condition: all_production_complete
      action: consolidate_staging
      
    - id: MERGE-003
      name: mixed_fulfillment_merge
      from_branches: [stock_items, production_items]
      to: PACKING
      merge_condition: all_items_ready
      action: combine_pick_lists
```

---

## 2. Work Order Lifecycle State Machine

```yaml
state_machine:
  name: WorkOrderLifecycle
  version: "1.0"
  initial_state: CREATED

  states:
    - id: CREATED
      type: initial
      description: "Work order created from sales order"
      allowed_actions: ["edit", "schedule", "cancel"]
      
    - id: SCHEDULED
      type: intermediate
      description: "Assigned to work center and time slot"
      allowed_actions: ["reschedule", "release", "hold"]
      
    - id: RELEASED
      type: intermediate
      description: "Released to shop floor, awaiting material"
      allowed_actions: ["stage_material", "hold", "cancel"]
      
    - id: MATERIAL_STAGED
      type: intermediate
      description: "Material staged at work center"
      allowed_actions: ["start", "hold", "return_material"]
      
    - id: IN_PROGRESS
      type: processing
      description: "Active operation in progress"
      allowed_actions: ["pause", "complete_op", "record_scrap", "hold"]
      
    - id: PAUSED
      type: hold
      description: "Operation temporarily paused"
      allowed_actions: ["resume", "hold", "cancel"]
      
    - id: OP_COMPLETE
      type: intermediate
      description: "Current operation complete, next pending"
      allowed_actions: ["start_next_op", "hold", "inspect"]
      
    - id: INSPECTION
      type: processing
      description: "Quality inspection in progress"
      allowed_actions: ["pass", "fail", "hold"]
      
    - id: REWORK
      type: processing
      description: "Rework operation in progress"
      allowed_actions: ["complete_rework", "scrap"]
      
    - id: HOLD
      type: hold
      description: "Work order on hold"
      allowed_actions: ["release_hold", "cancel"]
      
    - id: COMPLETED
      type: final
      description: "All operations complete, output staged"
      allowed_actions: ["view"]
      
    - id: CANCELLED
      type: final
      description: "Work order cancelled"
      allowed_actions: ["view"]

  transitions:
    - from: CREATED
      to: SCHEDULED
      event: schedule_work_order
      guard: capacity_available
      
    - from: SCHEDULED
      to: RELEASED
      event: release_to_floor
      guard: within_release_window
      
    - from: RELEASED
      to: MATERIAL_STAGED
      event: material_staged
      guard: material_available
      
    - from: MATERIAL_STAGED
      to: IN_PROGRESS
      event: start_operation
      guard: operator_assigned
      
    - from: IN_PROGRESS
      to: PAUSED
      event: pause_operation
      guard: null
      
    - from: PAUSED
      to: IN_PROGRESS
      event: resume_operation
      guard: null
      
    - from: IN_PROGRESS
      to: OP_COMPLETE
      event: complete_operation
      guard: output_recorded
      
    - from: OP_COMPLETE
      to: IN_PROGRESS
      event: start_next_operation
      guard: has_more_operations
      
    - from: OP_COMPLETE
      to: INSPECTION
      event: inspection_required
      guard: inspection_plan_triggered
      
    - from: OP_COMPLETE
      to: COMPLETED
      event: all_operations_done
      guard: no_more_operations
      
    - from: INSPECTION
      to: OP_COMPLETE
      event: inspection_passed
      guard: null
      
    - from: INSPECTION
      to: REWORK
      event: inspection_failed
      guard: rework_feasible
      
    - from: INSPECTION
      to: CANCELLED
      event: inspection_failed
      guard: not_rework_feasible
      
    - from: REWORK
      to: INSPECTION
      event: rework_complete
      guard: null
      
    - from: [CREATED, SCHEDULED, RELEASED, MATERIAL_STAGED, IN_PROGRESS, PAUSED, OP_COMPLETE]
      to: HOLD
      event: place_on_hold
      guard: null
      
    - from: HOLD
      to: PREVIOUS_STATE
      event: release_hold
      guard: hold_reason_resolved
      
    - from: [CREATED, SCHEDULED, RELEASED, HOLD]
      to: CANCELLED
      event: cancel_work_order
      guard: cancel_authorized

  guards:
    - id: capacity_available
      validation:
        - work_center_capacity: ">= required_time"
        - scheduling_conflict: false
        
    - id: within_release_window
      validation:
        - days_to_due_date: "<= release_window"
        - material_available: true
        
    - id: material_available
      validation:
        - allocated_quantity: ">= required_quantity"
        - material_location: accessible
        
    - id: operator_assigned
      validation:
        - operator_id: present
        - operator_qualified: true
        
    - id: output_recorded
      validation:
        - output_quantity: "> 0"
        - output_weight: recorded
        
    - id: has_more_operations
      validation:
        - remaining_operations: "> 0"
        
    - id: no_more_operations
      validation:
        - remaining_operations: "== 0"
        
    - id: inspection_plan_triggered
      validation:
        - or:
          - operation_requires_inspection: true
          - customer_requires_inspection: true
          - operator_flagged: true
          
    - id: rework_feasible
      validation:
        - defect_type: reworkable
        - material_sufficient: true
        
    - id: hold_reason_resolved
      validation:
        - hold_reason: cleared
        - resolution_notes: present
        
    - id: cancel_authorized
      validation:
        - no_material_consumed: true
        - or:
          - no_work_started: true
          - cancel_approved: true

  failure_paths:
    - from: MATERIAL_STAGED
      to: HOLD
      trigger: material_defect_found
      action: notify_qa
      
    - from: IN_PROGRESS
      to: HOLD
      trigger: machine_breakdown
      action: notify_maintenance
      
    - from: IN_PROGRESS
      to: HOLD
      trigger: operator_unavailable
      action: reassign_operator
      
    - from: INSPECTION
      to: CANCELLED
      trigger: material_scrapped
      action: record_scrap_cost
```

---

## 3. Quote Lifecycle State Machine

```yaml
state_machine:
  name: QuoteLifecycle
  version: "1.0"
  initial_state: DRAFT

  states:
    - id: DRAFT
      type: initial
      description: "Quote being prepared"
      timeout: null
      
    - id: PENDING_APPROVAL
      type: intermediate
      description: "Awaiting internal approval (discount, terms)"
      timeout: 4h
      
    - id: APPROVED
      type: intermediate
      description: "Internally approved, ready to send"
      timeout: 24h
      
    - id: SENT
      type: intermediate
      description: "Sent to customer"
      timeout: null
      
    - id: CUSTOMER_REVIEW
      type: intermediate
      description: "Customer reviewing quote"
      timeout: null
      
    - id: REVISION_REQUESTED
      type: intermediate
      description: "Customer requested changes"
      timeout: 48h
      
    - id: ACCEPTED
      type: final
      description: "Customer accepted quote"
      
    - id: REJECTED
      type: final
      description: "Customer rejected quote"
      
    - id: EXPIRED
      type: final
      description: "Quote validity period ended"
      
    - id: CANCELLED
      type: final
      description: "Quote cancelled by seller"

  transitions:
    - from: DRAFT
      to: PENDING_APPROVAL
      event: submit_for_approval
      guard: approval_required
      
    - from: DRAFT
      to: APPROVED
      event: submit_for_approval
      guard: no_approval_required
      
    - from: PENDING_APPROVAL
      to: APPROVED
      event: approve_quote
      guard: approver_authorized
      
    - from: PENDING_APPROVAL
      to: DRAFT
      event: reject_quote
      guard: null
      
    - from: APPROVED
      to: SENT
      event: send_to_customer
      guard: null
      
    - from: SENT
      to: CUSTOMER_REVIEW
      event: customer_opened
      guard: null
      
    - from: [SENT, CUSTOMER_REVIEW]
      to: ACCEPTED
      event: customer_accept
      guard: within_validity
      
    - from: [SENT, CUSTOMER_REVIEW]
      to: REJECTED
      event: customer_reject
      guard: null
      
    - from: [SENT, CUSTOMER_REVIEW]
      to: REVISION_REQUESTED
      event: revision_request
      guard: null
      
    - from: REVISION_REQUESTED
      to: DRAFT
      event: start_revision
      guard: null
      
    - from: [SENT, CUSTOMER_REVIEW]
      to: EXPIRED
      event: validity_expired
      guard: past_expiry_date
      
    - from: [DRAFT, PENDING_APPROVAL, APPROVED, SENT]
      to: CANCELLED
      event: cancel_quote
      guard: null

  guards:
    - id: approval_required
      validation:
        - or:
          - discount_percentage: "> 5%"
          - non_standard_terms: true
          - quote_value: "> $50000"
          
    - id: no_approval_required
      validation:
        - discount_percentage: "<= 5%"
        - non_standard_terms: false
        - quote_value: "<= $50000"
        
    - id: approver_authorized
      validation:
        - approver_role: in_approval_chain
        - approval_limit: ">= quote_value"
        
    - id: within_validity
      validation:
        - current_date: "<= expiry_date"
        
    - id: past_expiry_date
      validation:
        - current_date: "> expiry_date"

  failure_paths:
    - from: PENDING_APPROVAL
      to: CANCELLED
      trigger: approval_timeout
      action: notify_creator
      
    - from: REVISION_REQUESTED
      to: EXPIRED
      trigger: revision_timeout
      action: notify_customer
```

---

## 4. Shipment Lifecycle State Machine

```yaml
state_machine:
  name: ShipmentLifecycle
  version: "1.0"
  initial_state: CREATED

  states:
    - id: CREATED
      type: initial
      description: "Shipment record created"
      
    - id: PICK_ASSIGNED
      type: intermediate
      description: "Pick list assigned to warehouse"
      
    - id: PICKING
      type: processing
      description: "Material being picked"
      
    - id: PICKED
      type: intermediate
      description: "All material picked"
      
    - id: PACKING
      type: processing
      description: "Material being packed"
      
    - id: PACKED
      type: intermediate
      description: "Ready for documents"
      
    - id: DOCUMENTS_READY
      type: intermediate
      description: "BOL, packing list, COC generated"
      
    - id: AWAITING_CARRIER
      type: intermediate
      description: "Waiting for carrier pickup"
      
    - id: LOADED
      type: intermediate
      description: "Loaded on carrier vehicle"
      
    - id: IN_TRANSIT
      type: processing
      description: "In transit to destination"
      
    - id: OUT_FOR_DELIVERY
      type: processing
      description: "On final delivery vehicle"
      
    - id: DELIVERED
      type: intermediate
      description: "Delivered, awaiting POD"
      
    - id: COMPLETED
      type: final
      description: "Delivered with POD captured"
      
    - id: EXCEPTION
      type: hold
      description: "Delivery exception occurred"
      
    - id: RETURNED
      type: final
      description: "Shipment returned"
      
    - id: CANCELLED
      type: final
      description: "Shipment cancelled"

  transitions:
    - from: CREATED
      to: PICK_ASSIGNED
      event: assign_picker
      
    - from: PICK_ASSIGNED
      to: PICKING
      event: start_pick
      
    - from: PICKING
      to: PICKED
      event: complete_pick
      guard: all_items_picked
      
    - from: PICKED
      to: PACKING
      event: start_pack
      
    - from: PACKING
      to: PACKED
      event: complete_pack
      
    - from: PACKED
      to: DOCUMENTS_READY
      event: generate_documents
      
    - from: DOCUMENTS_READY
      to: AWAITING_CARRIER
      event: schedule_pickup
      
    - from: AWAITING_CARRIER
      to: LOADED
      event: load_vehicle
      
    - from: LOADED
      to: IN_TRANSIT
      event: carrier_depart
      
    - from: IN_TRANSIT
      to: OUT_FOR_DELIVERY
      event: out_for_delivery
      
    - from: [IN_TRANSIT, OUT_FOR_DELIVERY]
      to: DELIVERED
      event: delivery_confirm
      
    - from: DELIVERED
      to: COMPLETED
      event: pod_captured
      
    - from: [IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED]
      to: EXCEPTION
      event: exception_reported
      
    - from: EXCEPTION
      to: IN_TRANSIT
      event: exception_resolved
      guard: continue_delivery
      
    - from: EXCEPTION
      to: RETURNED
      event: return_shipment
      guard: return_required

  failure_paths:
    - from: PICKING
      to: EXCEPTION
      trigger: material_not_found
      action: investigate_inventory
      
    - from: IN_TRANSIT
      to: EXCEPTION
      trigger: carrier_delay
      action: notify_customer
      
    - from: DELIVERED
      to: EXCEPTION
      trigger: damage_reported
      action: initiate_claim
```

---

## 5. Handoff Points

```json
[
  {
    "id": "HO-001",
    "name": "Order to Production",
    "from_module": "ORDER_MGMT",
    "to_module": "PRODUCTION",
    "trigger_state": "ALLOCATED",
    "trigger_event": "release_to_production",
    "data_transferred": [
      "order_id",
      "order_lines",
      "customer_info",
      "due_date",
      "special_instructions",
      "quality_requirements",
      "allocated_material"
    ],
    "validation_required": [
      "all_lines_allocated",
      "credit_approved",
      "customer_confirmed"
    ],
    "sla": "15 minutes",
    "escalation": "PRODUCTION_PLANNER",
    "ai_involvement": {
      "routing_recommendation": true,
      "time_estimation": true,
      "priority_scoring": true
    }
  },
  {
    "id": "HO-002",
    "name": "Production to Shop Floor",
    "from_module": "PRODUCTION",
    "to_module": "SHOP_FLOOR",
    "trigger_state": "SCHEDULED",
    "trigger_event": "release_work_order",
    "data_transferred": [
      "work_order_id",
      "routing",
      "cut_patterns",
      "bom",
      "work_center_assignment",
      "scheduled_start",
      "due_datetime",
      "operator_assignment"
    ],
    "validation_required": [
      "material_available",
      "work_center_available",
      "operator_qualified"
    ],
    "sla": "30 minutes before scheduled start",
    "escalation": "LEAD_OPERATOR",
    "ai_involvement": {
      "cut_pattern_optimization": true,
      "parameter_recommendation": true,
      "time_prediction": true
    }
  },
  {
    "id": "HO-003",
    "name": "Shop Floor to Quality",
    "from_module": "SHOP_FLOOR",
    "to_module": "QUALITY",
    "trigger_state": "OP_COMPLETE",
    "trigger_event": "inspection_required",
    "data_transferred": [
      "work_order_id",
      "operation_id",
      "output_pieces",
      "output_weight",
      "process_parameters",
      "operator_notes",
      "material_traceability"
    ],
    "validation_required": [
      "output_recorded",
      "pieces_labeled"
    ],
    "sla": "2 hours",
    "escalation": "QA_SUPERVISOR",
    "ai_involvement": {
      "defect_prediction": true,
      "sampling_recommendation": true
    }
  },
  {
    "id": "HO-004",
    "name": "Production Complete to Shipping",
    "from_module": "SHOP_FLOOR",
    "to_module": "SHIPPING",
    "trigger_state": "COMPLETED",
    "trigger_event": "production_complete",
    "data_transferred": [
      "work_order_id",
      "order_id",
      "finished_pieces",
      "actual_weight",
      "staging_location",
      "quality_status",
      "documents_ready"
    ],
    "validation_required": [
      "all_operations_complete",
      "quality_passed",
      "pieces_staged"
    ],
    "sla": "1 hour",
    "escalation": "SHIPPING_SUPERVISOR",
    "ai_involvement": {
      "carrier_recommendation": true,
      "consolidation_suggestion": true
    }
  },
  {
    "id": "HO-005",
    "name": "Shipment to Billing",
    "from_module": "SHIPPING",
    "to_module": "BILLING",
    "trigger_state": "SHIPPED",
    "trigger_event": "carrier_pickup",
    "data_transferred": [
      "shipment_id",
      "order_id",
      "shipped_lines",
      "actual_quantities",
      "actual_weights",
      "freight_charges",
      "carrier_info",
      "bol_number"
    ],
    "validation_required": [
      "bol_generated",
      "weights_verified",
      "documents_complete"
    ],
    "sla": "4 hours",
    "escalation": "BILLING_SUPERVISOR",
    "ai_involvement": {
      "invoice_automation": true,
      "price_verification": true
    }
  },
  {
    "id": "HO-006",
    "name": "Quote to Order",
    "from_module": "QUOTING",
    "to_module": "ORDER_MGMT",
    "trigger_state": "ACCEPTED",
    "trigger_event": "customer_accept",
    "data_transferred": [
      "quote_id",
      "quote_lines",
      "customer_id",
      "pricing_snapshot",
      "terms",
      "special_instructions",
      "ship_to_address",
      "requested_date"
    ],
    "validation_required": [
      "quote_not_expired",
      "pricing_valid",
      "customer_active"
    ],
    "sla": "15 minutes",
    "escalation": "INSIDE_SALES",
    "ai_involvement": {
      "availability_recheck": true,
      "promise_date_calculation": true
    }
  },
  {
    "id": "HO-007",
    "name": "Receiving to Inventory",
    "from_module": "WAREHOUSE",
    "to_module": "INVENTORY",
    "trigger_state": "RECEIVED",
    "trigger_event": "receipt_confirmed",
    "data_transferred": [
      "receipt_id",
      "po_number",
      "received_items",
      "quantities",
      "weights",
      "lot_numbers",
      "heat_numbers",
      "mtr_reference",
      "storage_location"
    ],
    "validation_required": [
      "po_match",
      "quantity_within_tolerance",
      "mtr_captured"
    ],
    "sla": "30 minutes",
    "escalation": "INVENTORY_MANAGER",
    "ai_involvement": {
      "mtr_extraction": true,
      "put_away_optimization": true
    }
  },
  {
    "id": "HO-008",
    "name": "Inventory to Purchasing (Reorder)",
    "from_module": "INVENTORY",
    "to_module": "PURCHASING",
    "trigger_state": "LOW_STOCK",
    "trigger_event": "reorder_point_reached",
    "data_transferred": [
      "product_id",
      "current_quantity",
      "reorder_point",
      "reorder_quantity",
      "demand_forecast",
      "preferred_suppliers",
      "lead_time_estimate"
    ],
    "validation_required": [
      "below_reorder_point",
      "no_pending_po"
    ],
    "sla": "4 hours",
    "escalation": "PURCHASING_MANAGER",
    "ai_involvement": {
      "demand_forecast": true,
      "quantity_optimization": true,
      "supplier_recommendation": true
    }
  },
  {
    "id": "HO-009",
    "name": "Quality NCR to Purchasing",
    "from_module": "QUALITY",
    "to_module": "PURCHASING",
    "trigger_state": "NCR_CREATED",
    "trigger_event": "supplier_ncr",
    "data_transferred": [
      "ncr_id",
      "supplier_id",
      "po_number",
      "material_id",
      "defect_type",
      "quantity_affected",
      "evidence",
      "recommended_disposition"
    ],
    "validation_required": [
      "ncr_documented",
      "evidence_attached"
    ],
    "sla": "24 hours",
    "escalation": "PURCHASING_MANAGER",
    "ai_involvement": {
      "root_cause_suggestion": true,
      "supplier_scoring_update": true
    }
  },
  {
    "id": "HO-010",
    "name": "Credit Decision to Order",
    "from_module": "CREDIT",
    "to_module": "ORDER_MGMT",
    "trigger_state": "CREDIT_DECISION_MADE",
    "trigger_event": "credit_approved",
    "data_transferred": [
      "customer_id",
      "order_id",
      "credit_decision",
      "credit_limit",
      "available_credit",
      "terms_approved",
      "conditions"
    ],
    "validation_required": [
      "decision_documented",
      "limit_updated"
    ],
    "sla": "15 minutes",
    "escalation": "CREDIT_MANAGER",
    "ai_involvement": {
      "risk_scoring": true
    }
  },
  {
    "id": "HO-011",
    "name": "Shift Handoff",
    "from_module": "SHOP_FLOOR",
    "to_module": "SHOP_FLOOR",
    "trigger_state": "SHIFT_END",
    "trigger_event": "shift_change",
    "data_transferred": [
      "active_work_orders",
      "work_order_status",
      "machine_status",
      "pending_issues",
      "hot_jobs",
      "quality_alerts",
      "material_availability",
      "notes_from_outgoing"
    ],
    "validation_required": [
      "all_wo_status_updated",
      "issues_documented"
    ],
    "sla": "15 minutes",
    "escalation": "LEAD_OPERATOR",
    "ai_involvement": {
      "priority_reranking": true,
      "anomaly_highlighting": true
    }
  },
  {
    "id": "HO-012",
    "name": "Counter Sale to Quick Cut",
    "from_module": "POS",
    "to_module": "SHOP_FLOOR",
    "trigger_state": "QUICK_CUT_REQUESTED",
    "trigger_event": "counter_cut_order",
    "data_transferred": [
      "pos_transaction_id",
      "material_id",
      "cut_spec",
      "quantity",
      "customer_waiting",
      "priority"
    ],
    "validation_required": [
      "material_available",
      "cut_feasible"
    ],
    "sla": "15 minutes",
    "escalation": "LEAD_OPERATOR",
    "ai_involvement": {
      "remnant_matching": true,
      "time_estimate": true
    }
  },
  {
    "id": "HO-013",
    "name": "Traceability Event Recording",
    "from_module": "ALL_MODULES",
    "to_module": "TRACEABILITY",
    "trigger_state": "ANY_MATERIAL_EVENT",
    "trigger_event": "material_transaction",
    "data_transferred": [
      "event_type",
      "timestamp",
      "material_id",
      "quantity",
      "from_state",
      "to_state",
      "actor",
      "related_documents",
      "parent_trace_id"
    ],
    "validation_required": [
      "trace_id_assigned",
      "parent_linked"
    ],
    "sla": "real-time",
    "escalation": null,
    "ai_involvement": {
      "anomaly_detection": true,
      "lineage_validation": true
    }
  }
]
```

---

## 6. SLA Rules

| SLA ID | Process | Metric | Target | Warning Threshold | Critical Threshold | Escalation Path | Penalty/Impact |
|--------|---------|--------|--------|-------------------|-------------------|-----------------|----------------|
| SLA-001 | Quote Turnaround | Time from RFQ to quote sent | ≤2 hours (standard) | 1.5 hours | 2 hours | Inside Sales → Sales Mgr | Lost opportunity |
| SLA-002 | Quote Turnaround (Complex) | Time from RFQ to quote sent | ≤4 hours | 3 hours | 4 hours | Inside Sales → Sales Mgr | Lost opportunity |
| SLA-003 | Credit Decision | Time from order submit to credit decision | ≤4 hours | 3 hours | 4 hours | Credit Analyst → Credit Mgr | Order delay |
| SLA-004 | Credit Hold Release | Time from payment to hold release | ≤4 hours | 3 hours | 4 hours | Credit Analyst → Credit Mgr | Customer frustration |
| SLA-005 | Order Confirmation | Time from order entry to confirmation sent | ≤15 minutes | 10 minutes | 15 minutes | System → Inside Sales | Customer uncertainty |
| SLA-006 | Allocation | Time from order confirm to allocation complete | ≤15 minutes | 10 minutes | 15 minutes | System → Inventory Mgr | Schedule delay |
| SLA-007 | Work Order Release | Time from allocation to production release | ≤30 minutes | 20 minutes | 30 minutes | Planner → Production Mgr | Schedule slip |
| SLA-008 | Material Staging | Time from release to material at work center | ≤1 hour | 45 minutes | 1 hour | Warehouse → Lead Operator | Operator idle time |
| SLA-009 | Operation Start | Time from scheduled start to actual start | ≤15 minutes | 10 minutes | 15 minutes | Operator → Lead Operator | Schedule adherence |
| SLA-010 | Inspection Turnaround | Time from inspection request to result | ≤2 hours | 1.5 hours | 2 hours | QA Inspector → QA Supervisor | Production delay |
| SLA-011 | NCR Resolution | Time from NCR creation to disposition | ≤5 days | 3 days | 5 days | QA → Quality Mgr | Material tied up |
| SLA-012 | Shipping Turnaround | Time from ready-to-ship to shipped | ≤4 hours | 3 hours | 4 hours | Shipping Clerk → Shipping Supervisor | Missed delivery |
| SLA-013 | BOL Generation | Time from pack complete to BOL ready | ≤30 minutes | 20 minutes | 30 minutes | Shipping → Shipping Supervisor | Carrier wait |
| SLA-014 | Invoice Generation | Time from shipment to invoice sent | ≤24 hours | 18 hours | 24 hours | Billing → AR Manager | Cash flow delay |
| SLA-015 | POD Capture | Time from delivery to POD in system | ≤24 hours | 18 hours | 24 hours | Driver → Shipping Supervisor | Invoice delay |
| SLA-016 | Receiving Turnaround | Time from dock arrival to inventory posted | ≤4 hours | 3 hours | 4 hours | Warehouse → Warehouse Mgr | Availability delay |
| SLA-017 | MTR Capture | Time from receipt to MTR in system | ≤30 minutes | 20 minutes | 30 minutes | Warehouse → QA | Traceability gap |
| SLA-018 | Put-Away | Time from receipt to put-away complete | ≤2 hours | 1.5 hours | 2 hours | Warehouse → Warehouse Mgr | Location accuracy |
| SLA-019 | Cycle Count Resolution | Time from variance to resolution | ≤4 hours | 3 hours | 4 hours | Warehouse → Inventory Mgr | Inventory accuracy |
| SLA-020 | PO Response | Time from reorder trigger to PO issued | ≤24 hours | 18 hours | 24 hours | Purchasing → Purchasing Mgr | Stock-out risk |
| SLA-021 | Supplier Response | Time from PO to supplier confirmation | ≤48 hours | 36 hours | 48 hours | Purchasing → Supplier | Lead time risk |
| SLA-022 | Backorder Resolution | Time from backorder to fulfilled | ≤72 hours | 48 hours | 72 hours | Purchasing → Ops Director | Customer delay |
| SLA-023 | Customer Inquiry Response | Time from inquiry to response | ≤2 hours | 1.5 hours | 2 hours | Sales → Sales Mgr | Customer satisfaction |
| SLA-024 | Dispute Resolution | Time from dispute to resolution | ≤5 days | 3 days | 5 days | AR → AR Manager | Cash collection |
| SLA-025 | Promise Date Accuracy | Orders delivered by promise date | ≥98% | 95% | 93% | Ops Director → VP Ops | Customer retention |
| SLA-026 | Quote Win Rate | Quotes converted to orders | ≥35% | 30% | 25% | Sales Mgr → VP Sales | Revenue target |
| SLA-027 | First-Pass Yield | Product passing first inspection | ≥99% | 98% | 97% | QA Mgr → Ops Director | Rework cost |
| SLA-028 | Machine Downtime | Unplanned downtime per shift | ≤30 min | 20 min | 30 min | Maintenance → Maintenance Mgr | Capacity loss |
| SLA-029 | Counter Transaction Time | Time per counter sale | ≤60 seconds | 45 seconds | 60 seconds | Counter Sales → Branch Mgr | Customer wait |
| SLA-030 | Portal Order Response | Time from portal order to confirmation | ≤5 minutes | 3 minutes | 5 minutes | System → IT | Customer experience |

---

## 7. SLA Escalation Matrix

| Level | Time Exceeded | Notification Method | Recipient | Action Required |
|-------|---------------|---------------------|-----------|-----------------|
| 0 - Warning | 75% of SLA | Dashboard indicator | Assignee | Prioritize task |
| 1 - At Risk | 90% of SLA | In-app notification | Assignee + Supervisor | Immediate attention |
| 2 - Breached | 100% of SLA | Email + notification | Supervisor + Manager | Escalation review |
| 3 - Critical | 150% of SLA | SMS + email | Manager + Director | Executive intervention |
| 4 - Severe | 200% of SLA | Phone call | Director + VP | Root cause + remediation |

---

## 8. Timeout Actions

```yaml
timeout_actions:
  - state: PENDING_CREDIT
    timeout: 4h
    action: escalate_to_credit_manager
    notification:
      - credit_analyst
      - inside_sales
    auto_action: null

  - state: CREDIT_HOLD
    timeout: 48h
    action: notify_customer_pending_cancel
    notification:
      - customer
      - outside_sales
      - credit_manager
    auto_action: cancel_if_no_response_72h

  - state: ALLOCATING
    timeout: 15m
    action: alert_inventory_manager
    notification:
      - inventory_manager
      - production_planner
    auto_action: retry_allocation

  - state: BACKORDERED
    timeout: 72h
    action: escalate_to_purchasing_manager
    notification:
      - purchasing_manager
      - inside_sales
      - customer
    auto_action: offer_substitutes

  - state: PRODUCTION_HOLD
    timeout: 4h
    action: escalate_to_supervisor
    notification:
      - lead_operator
      - production_planner
    auto_action: null

  - state: QUALITY_HOLD
    timeout: 8h
    action: escalate_to_qa_manager
    notification:
      - qa_manager
      - production_planner
    auto_action: null

  - state: READY_TO_SHIP
    timeout: 24h
    action: alert_shipping_supervisor
    notification:
      - shipping_supervisor
      - inside_sales
    auto_action: null

  - state: PICKING
    timeout: 2h
    action: alert_warehouse_supervisor
    notification:
      - warehouse_supervisor
    auto_action: reassign_picker

  - state: AWAITING_PICKUP
    timeout: 48h
    action: notify_customer
    notification:
      - customer
      - inside_sales
    auto_action: null

  - state: DELIVERED
    timeout: 24h
    action: request_pod_again
    notification:
      - driver
      - shipping_supervisor
    auto_action: auto_complete_if_tracking_confirmed
```

---

*Document generated for AI-build Phase 04: Workflows & Lifecycle*
