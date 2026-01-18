# 62 — Build Phase 1 Data Model

> **Purpose:** Conceptual data model for UI binding and entity relationships.  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. entities

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CUSTOMER DOMAIN                                │
└─────────────────────────────────────────────────────────────────────────────┘

Class Tenant {
  id: UUID [PK]
  code: string [unique, 3-10 chars]
  name: string
  status: enum [active, suspended, terminated]
  settings: JSON
  created_at: timestamp
  updated_at: timestamp
}

Class Customer {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  account_number: string [unique per tenant]
  company_name: string
  dba_name: string [nullable]
  customer_type: enum [commercial, retail, government, internal]
  status: enum [active, inactive, prospect, suspended]
  credit_status: enum [good, warning, hold, cod]
  credit_limit: decimal(12,2)
  current_balance: decimal(12,2)
  available_credit: decimal(12,2) [computed]
  payment_terms: string [FK → PaymentTerm.code]
  pricing_tier: enum [list, tier1, tier2, tier3, contract, cost_plus]
  tax_exempt: boolean [default: false]
  tax_exempt_number: string [nullable]
  default_ship_to_id: UUID [FK → Address, nullable]
  default_bill_to_id: UUID [FK → Address, nullable]
  sales_rep_id: UUID [FK → User, nullable]
  po_required: boolean [default: false]
  invoice_frequency: enum [per_shipment, daily, weekly, monthly]
  notes: text [nullable]
  created_at: timestamp
  updated_at: timestamp
  created_by: UUID [FK → User]
}

Class Contact {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  customer_id: UUID [FK → Customer]
  first_name: string
  last_name: string
  title: string [nullable]
  email: string [nullable]
  phone: string [nullable]
  mobile: string [nullable]
  is_primary: boolean [default: false]
  is_billing_contact: boolean [default: false]
  is_shipping_contact: boolean [default: false]
  portal_access: boolean [default: false]
  portal_user_id: UUID [FK → User, nullable]
  status: enum [active, inactive]
  created_at: timestamp
  updated_at: timestamp
}

Class Address {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  customer_id: UUID [FK → Customer]
  address_type: enum [bill_to, ship_to, both]
  name: string
  address1: string
  address2: string [nullable]
  city: string
  state: string [2-char code]
  postal_code: string
  country: string [default: 'US', ISO 3166-1 alpha-2]
  is_residential: boolean [default: false]
  is_default: boolean [default: false]
  delivery_instructions: text [nullable]
  latitude: decimal(10,7) [nullable]
  longitude: decimal(10,7) [nullable]
  tax_jurisdiction_id: UUID [FK → TaxJurisdiction, nullable]
  status: enum [active, inactive]
  created_at: timestamp
  updated_at: timestamp
}

Class ContractPricing {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  customer_id: UUID [FK → Customer]
  contract_number: string
  name: string
  effective_date: date
  expiration_date: date
  status: enum [draft, active, expired, cancelled]
  pricing_method: enum [fixed, discount_percent, discount_amount, cost_plus]
  default_discount_percent: decimal(5,2) [nullable]
  default_markup_percent: decimal(5,2) [nullable]
  notes: text [nullable]
  created_at: timestamp
  updated_at: timestamp
  created_by: UUID [FK → User]
  approved_by: UUID [FK → User, nullable]
  approved_at: timestamp [nullable]
}

Class ContractPricingLine {
  id: UUID [PK]
  contract_id: UUID [FK → ContractPricing]
  product_id: UUID [FK → Product, nullable]
  product_category_id: UUID [FK → ProductCategory, nullable]
  grade_id: UUID [FK → Grade, nullable]
  pricing_method: enum [fixed, discount_percent, discount_amount, cost_plus]
  fixed_price: decimal(12,4) [nullable]
  discount_percent: decimal(5,2) [nullable]
  discount_amount: decimal(12,4) [nullable]
  markup_percent: decimal(5,2) [nullable]
  min_quantity: decimal(12,3) [nullable]
  max_quantity: decimal(12,3) [nullable]
  uom: string [FK → UnitOfMeasure.code]
  effective_date: date [nullable]
  expiration_date: date [nullable]
}

┌─────────────────────────────────────────────────────────────────────────────┐
│                              PRODUCT DOMAIN                                 │
└─────────────────────────────────────────────────────────────────────────────┘

Class Division {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  code: string [unique per tenant, e.g., 'METALS', 'PLASTICS']
  name: string
  status: enum [active, inactive]
  settings: JSON
  created_at: timestamp
  updated_at: timestamp
}

Class ProductCategory {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  division_id: UUID [FK → Division]
  parent_id: UUID [FK → ProductCategory, nullable, self-reference]
  code: string
  name: string
  path: string [materialized path, e.g., 'metals/steel/carbon']
  level: integer
  sort_order: integer
  status: enum [active, inactive]
}

Class Grade {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  division_id: UUID [FK → Division]
  code: string [unique per division, e.g., 'A36', '304', 'HDPE']
  name: string
  specification: string [nullable, e.g., 'ASTM A36']
  density: decimal(10,6) [nullable, lb/in³]
  default_uom: string [FK → UnitOfMeasure.code]
  requires_mtr: boolean [default: false]
  requires_coa: boolean [default: false]
  hazmat_class: string [nullable]
  status: enum [active, inactive]
  properties: JSON [nullable, grade-specific properties]
}

Class Product {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  division_id: UUID [FK → Division]
  category_id: UUID [FK → ProductCategory]
  grade_id: UUID [FK → Grade]
  sku: string [unique per tenant]
  description: string
  short_description: string [nullable, for labels]
  form: enum [coil, sheet, plate, bar, tube, pipe, structural, rod, film, block, custom]
  thickness: decimal(10,6) [nullable, inches]
  width: decimal(10,4) [nullable, inches]
  length: decimal(10,4) [nullable, inches/feet]
  od: decimal(10,4) [nullable, outside diameter]
  id_dimension: decimal(10,4) [nullable, inside diameter]
  wall: decimal(10,6) [nullable, wall thickness]
  weight_per_unit: decimal(12,6) [nullable]
  weight_uom: string [FK → UnitOfMeasure.code, nullable]
  primary_uom: string [FK → UnitOfMeasure.code]
  pricing_uom: string [FK → UnitOfMeasure.code]
  min_order_qty: decimal(12,3) [default: 1]
  standard_pack_qty: decimal(12,3) [nullable]
  is_stocked: boolean [default: true]
  is_active: boolean [default: true]
  lead_time_days: integer [nullable]
  image_url: string [nullable]
  created_at: timestamp
  updated_at: timestamp
}

Class ProductPrice {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  product_id: UUID [FK → Product]
  price_type: enum [list, tier1, tier2, tier3, cost]
  effective_date: date
  expiration_date: date [nullable]
  price: decimal(12,4)
  uom: string [FK → UnitOfMeasure.code]
  min_quantity: decimal(12,3) [default: 0]
  break_quantity: decimal(12,3) [nullable]
  break_price: decimal(12,4) [nullable]
  status: enum [active, inactive]
  created_at: timestamp
  updated_at: timestamp
}

Class ProcessingType {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  division_id: UUID [FK → Division]
  code: string [unique per division]
  name: string
  description: string [nullable]
  requires_dimensions: boolean [default: true]
  dimension_schema: JSON [schema for required dimension inputs]
  default_tolerance_class: enum [standard, tight, precision]
  base_charge: decimal(12,4) [nullable]
  charge_per_unit: decimal(12,4) [nullable]
  charge_uom: string [FK → UnitOfMeasure.code, nullable]
  min_charge: decimal(12,4) [nullable]
  setup_charge: decimal(12,4) [nullable]
  estimated_time_minutes: integer [nullable]
  compatible_forms: JSON [array of form enums]
  status: enum [active, inactive]
}

┌─────────────────────────────────────────────────────────────────────────────┐
│                               ORDER DOMAIN                                  │
└─────────────────────────────────────────────────────────────────────────────┘

Class Order {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  order_number: string [unique per tenant, formatted]
  order_type: enum [sales_order, quote, pos_transaction, blanket, return]
  source: enum [order_intake_app, retail_pos_app, customer_portal, edi, api]
  status: enum [draft, pending, confirmed, processing, ready, shipped, completed, cancelled]
  customer_id: UUID [FK → Customer]
  bill_to_address_id: UUID [FK → Address]
  ship_to_address_id: UUID [FK → Address]
  contact_id: UUID [FK → Contact, nullable]
  customer_po: string [nullable]
  division_id: UUID [FK → Division]
  location_id: UUID [FK → Location]
  priority: enum [economy, standard, hot, rush]
  requested_date: date
  promised_date: date [nullable]
  order_date: date
  ship_via: string [nullable]
  freight_terms: enum [prepaid, collect, prepaid_add, will_call, our_truck]
  carrier_id: UUID [FK → Carrier, nullable]
  payment_terms: string [FK → PaymentTerm.code]
  sales_rep_id: UUID [FK → User, nullable]
  subtotal: decimal(12,2)
  processing_total: decimal(12,2)
  discount_type: enum [none, percent, amount] [nullable]
  discount_value: decimal(12,4) [nullable]
  discount_amount: decimal(12,2)
  freight_charge: decimal(12,2)
  tax_rate: decimal(6,4)
  tax_amount: decimal(12,2)
  grand_total: decimal(12,2)
  special_instructions: text [nullable]
  internal_notes: text [nullable]
  billing_status: enum [pending, ready, invoiced, paid]
  created_at: timestamp
  updated_at: timestamp
  created_by: UUID [FK → User]
  confirmed_at: timestamp [nullable]
  confirmed_by: UUID [FK → User, nullable]
}

Class OrderLine {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  order_id: UUID [FK → Order]
  line_number: integer
  product_id: UUID [FK → Product]
  description: string
  quantity: decimal(12,3)
  uom: string [FK → UnitOfMeasure.code]
  unit_price: decimal(12,4)
  price_source: enum [list, tier, contract, quote, override, cost_plus]
  extended_price: decimal(12,2) [computed: quantity × unit_price]
  line_discount_type: enum [none, percent, amount] [nullable]
  line_discount_value: decimal(12,4) [nullable]
  line_discount_amount: decimal(12,2)
  processing_charge: decimal(12,2)
  line_total: decimal(12,2) [computed]
  status: enum [open, allocated, processing, ready, shipped, completed, cancelled, backordered]
  requested_date: date [nullable]
  promised_date: date [nullable]
  source_type: enum [stock, purchase, transfer]
  allocated_inventory_id: UUID [FK → InventoryUnit, nullable]
  heat_number: string [nullable]
  certification_required: JSON [nullable, array of cert types]
  notes: text [nullable]
  created_at: timestamp
  updated_at: timestamp
}

Class OrderLineProcessing {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  order_line_id: UUID [FK → OrderLine]
  processing_type_id: UUID [FK → ProcessingType]
  sequence: integer
  target_width: decimal(10,4) [nullable]
  target_width_tolerance_plus: decimal(10,6) [nullable]
  target_width_tolerance_minus: decimal(10,6) [nullable]
  target_length: decimal(10,4) [nullable]
  target_length_tolerance_plus: decimal(10,6) [nullable]
  target_length_tolerance_minus: decimal(10,6) [nullable]
  pieces: integer [nullable]
  tolerance_class: enum [standard, tight, precision, custom]
  edge_condition: enum [mill, deburred, slit, sheared, ground, polished] [nullable]
  surface_finish: string [nullable]
  options: JSON [nullable, array of option codes]
  special_instructions: text [nullable]
  charge: decimal(12,2)
  estimated_time_minutes: integer [nullable]
}

┌─────────────────────────────────────────────────────────────────────────────┐
│                            PROCESSING DOMAIN                                │
└─────────────────────────────────────────────────────────────────────────────┘

Class ProcessingJob {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  job_number: string [unique per tenant, formatted]
  order_id: UUID [FK → Order]
  order_line_id: UUID [FK → OrderLine]
  division_id: UUID [FK → Division]
  location_id: UUID [FK → Location]
  status: enum [ORDERED, RECEIVED, SCHEDULED, IN_PROCESS, WAITING_QC, PACKAGING, READY_TO_SHIP, SHIPPED, COMPLETED, ON_HOLD, NCR_PENDING, CANCELLED]
  priority: enum [economy, standard, hot, rush]
  customer_id: UUID [FK → Customer]
  product_id: UUID [FK → Product]
  input_inventory_id: UUID [FK → InventoryUnit, nullable]
  input_quantity: decimal(12,3)
  input_uom: string [FK → UnitOfMeasure.code]
  output_quantity: decimal(12,3) [nullable]
  output_uom: string [FK → UnitOfMeasure.code, nullable]
  yield_percent: decimal(5,2) [nullable, computed]
  scrap_quantity: decimal(12,3) [nullable]
  scheduled_start: timestamp [nullable]
  scheduled_end: timestamp [nullable]
  actual_start: timestamp [nullable]
  actual_end: timestamp [nullable]
  current_work_center_id: UUID [FK → WorkCenter, nullable]
  current_operator_id: UUID [FK → User, nullable]
  current_operation_step_id: UUID [FK → OperationStep, nullable]
  qc_status: enum [pending, passed, failed, waived] [nullable]
  hold_reason: string [nullable]
  hold_by: UUID [FK → User, nullable]
  hold_at: timestamp [nullable]
  special_instructions: text [nullable]
  created_at: timestamp
  updated_at: timestamp
  created_by: UUID [FK → User]
}

Class OperationStep {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  job_id: UUID [FK → ProcessingJob]
  sequence: integer
  processing_type_id: UUID [FK → ProcessingType]
  work_center_id: UUID [FK → WorkCenter, nullable]
  status: enum [pending, queued, in_progress, paused, completed, skipped, failed]
  planned_duration_minutes: integer [nullable]
  actual_duration_minutes: integer [nullable]
  setup_time_minutes: integer [nullable]
  target_dimensions: JSON [nullable]
  actual_dimensions: JSON [nullable]
  operator_id: UUID [FK → User, nullable]
  started_at: timestamp [nullable]
  completed_at: timestamp [nullable]
  paused_at: timestamp [nullable]
  pause_reason: string [nullable]
  notes: text [nullable]
}

Class JobEventLog {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  job_id: UUID [FK → ProcessingJob]
  operation_step_id: UUID [FK → OperationStep, nullable]
  event_type: enum [status_change, start, pause, resume, complete, scrap, measurement, note, issue, material_request, qc_result, hold, release, assignment]
  event_timestamp: timestamp
  user_id: UUID [FK → User]
  work_center_id: UUID [FK → WorkCenter, nullable]
  previous_value: JSON [nullable]
  new_value: JSON [nullable]
  details: JSON [nullable]
  synced: boolean [default: true]
  client_timestamp: timestamp [nullable, for offline sync]
}

Class ScrapRecord {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  job_id: UUID [FK → ProcessingJob]
  operation_step_id: UUID [FK → OperationStep, nullable]
  quantity: decimal(12,3)
  uom: string [FK → UnitOfMeasure.code]
  reason_code: string [FK → ScrapReason.code]
  description: text [nullable]
  disposition: enum [recycle, dispose, rework, return_to_stock]
  value: decimal(12,2) [nullable]
  recorded_by: UUID [FK → User]
  recorded_at: timestamp
  approved_by: UUID [FK → User, nullable]
  approved_at: timestamp [nullable]
}

Class MeasurementRecord {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  job_id: UUID [FK → ProcessingJob]
  operation_step_id: UUID [FK → OperationStep, nullable]
  measurement_type: enum [width, length, thickness, diameter, weight, angle, hardness, surface, custom]
  target_value: decimal(12,6)
  actual_value: decimal(12,6)
  tolerance_plus: decimal(10,6)
  tolerance_minus: decimal(10,6)
  uom: string [FK → UnitOfMeasure.code]
  in_tolerance: boolean [computed]
  sample_number: integer [nullable]
  piece_number: integer [nullable]
  instrument_id: string [nullable]
  recorded_by: UUID [FK → User]
  recorded_at: timestamp
  notes: text [nullable]
}

┌─────────────────────────────────────────────────────────────────────────────┐
│                            INVENTORY DOMAIN                                 │
└─────────────────────────────────────────────────────────────────────────────┘

Class InventoryUnit {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  unit_number: string [unique per tenant, formatted]
  barcode: string [unique per tenant, nullable]
  product_id: UUID [FK → Product]
  division_id: UUID [FK → Division]
  location_id: UUID [FK → Location]
  storage_location_id: UUID [FK → StorageLocation, nullable]
  status: enum [available, allocated, in_process, qc_hold, damaged, shipped, consumed, scrapped]
  quantity: decimal(12,3)
  uom: string [FK → UnitOfMeasure.code]
  original_quantity: decimal(12,3)
  weight: decimal(12,3) [nullable]
  weight_uom: string [FK → UnitOfMeasure.code, nullable]
  dimensions: JSON [nullable, {width, length, thickness, etc.}]
  heat_number: string [nullable]
  lot_number: string [nullable]
  coil_number: string [nullable]
  vendor_id: UUID [FK → Vendor, nullable]
  po_id: UUID [FK → PurchaseOrder, nullable]
  po_line_id: UUID [FK → PurchaseOrderLine, nullable]
  received_date: date
  cost: decimal(12,4)
  cost_uom: string [FK → UnitOfMeasure.code]
  mtr_document_id: UUID [FK → Document, nullable]
  coa_document_id: UUID [FK → Document, nullable]
  country_of_origin: string [nullable, ISO 3166-1 alpha-2]
  domestic_melt: boolean [nullable]
  dfars_compliant: boolean [nullable]
  expiration_date: date [nullable]
  allocated_job_id: UUID [FK → ProcessingJob, nullable]
  allocated_order_line_id: UUID [FK → OrderLine, nullable]
  parent_unit_id: UUID [FK → InventoryUnit, nullable, for splits]
  notes: text [nullable]
  created_at: timestamp
  updated_at: timestamp
}

Class StorageLocation {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  location_id: UUID [FK → Location]
  code: string [unique per location]
  name: string
  zone: string [nullable]
  aisle: string [nullable]
  bay: string [nullable]
  level: string [nullable]
  position: string [nullable]
  location_type: enum [rack, floor, yard, staging, will_call, qc_hold, receiving, shipping]
  capacity_weight: decimal(12,2) [nullable]
  capacity_pieces: integer [nullable]
  current_weight: decimal(12,2) [nullable]
  current_pieces: integer [nullable]
  is_active: boolean [default: true]
  coordinates: JSON [nullable, for warehouse mapping]
}

Class InventoryTransaction {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  unit_id: UUID [FK → InventoryUnit]
  transaction_type: enum [receive, allocate, deallocate, consume, produce, transfer, adjust, scrap, ship, return, split, merge]
  quantity: decimal(12,3)
  uom: string [FK → UnitOfMeasure.code]
  from_location_id: UUID [FK → StorageLocation, nullable]
  to_location_id: UUID [FK → StorageLocation, nullable]
  from_status: enum [nullable]
  to_status: enum [nullable]
  reference_type: enum [job, order, receipt, transfer, adjustment, shipment]
  reference_id: UUID [nullable]
  reason_code: string [nullable]
  notes: text [nullable]
  transacted_by: UUID [FK → User]
  transacted_at: timestamp
}

┌─────────────────────────────────────────────────────────────────────────────┐
│                            LOCATION DOMAIN                                  │
└─────────────────────────────────────────────────────────────────────────────┘

Class Location {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  code: string [unique per tenant, e.g., 'CLV', 'DET', 'CHI']
  name: string
  location_type: enum [branch, warehouse, distribution_center, satellite]
  division_ids: JSON [array of division UUIDs this location supports]
  address_id: UUID [FK → Address]
  phone: string [nullable]
  fax: string [nullable]
  email: string [nullable]
  timezone: string [IANA timezone]
  business_hours: JSON [nullable]
  is_active: boolean [default: true]
  manager_id: UUID [FK → User, nullable]
  parent_location_id: UUID [FK → Location, nullable, for hierarchies]
  settings: JSON [nullable]
  created_at: timestamp
  updated_at: timestamp
}

Class WorkCenter {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  location_id: UUID [FK → Location]
  division_id: UUID [FK → Division]
  code: string [unique per location]
  name: string
  work_center_type: enum [slitter, shear, laser, plasma, waterjet, saw, brake, roll, router, thermoform, machine, packaging, qc]
  status: enum [available, busy, maintenance, offline]
  capacity_type: enum [weight, pieces, hours, linear_feet]
  daily_capacity: decimal(12,2)
  capacity_uom: string [FK → UnitOfMeasure.code]
  capabilities: JSON [array of processing_type codes]
  max_width: decimal(10,4) [nullable]
  max_length: decimal(10,4) [nullable]
  max_thickness: decimal(10,6) [nullable]
  max_weight: decimal(12,2) [nullable]
  hourly_rate: decimal(12,2) [nullable]
  setup_time_minutes: integer [nullable]
  current_job_id: UUID [FK → ProcessingJob, nullable]
  assigned_operators: JSON [nullable, array of user UUIDs]
  sort_order: integer
  is_active: boolean [default: true]
  last_maintenance_date: date [nullable]
  next_maintenance_date: date [nullable]
}

┌─────────────────────────────────────────────────────────────────────────────┐
│                            SHIPPING DOMAIN                                  │
└─────────────────────────────────────────────────────────────────────────────┘

Class Shipment {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  shipment_number: string [unique per tenant, formatted]
  status: enum [DRAFT, PACKAGED, CARRIER_ASSIGNED, DOCS_READY, DISPATCHED, IN_TRANSIT, DELIVERED, EXCEPTION, RETURNED, CLAIM_PENDING, CLOSED, CANCELLED]
  customer_id: UUID [FK → Customer]
  ship_to_address_id: UUID [FK → Address]
  location_id: UUID [FK → Location]
  carrier_id: UUID [FK → Carrier, nullable]
  service_level: string [nullable]
  tracking_number: string [nullable]
  freight_terms: enum [prepaid, collect, prepaid_add, will_call, our_truck]
  freight_cost: decimal(12,2) [nullable]
  freight_charge: decimal(12,2) [nullable]
  total_weight: decimal(12,2) [nullable]
  total_pieces: integer [nullable]
  package_count: integer [nullable]
  ship_date: date [nullable]
  pickup_scheduled: timestamp [nullable]
  dispatched_at: timestamp [nullable]
  delivered_at: timestamp [nullable]
  eta: timestamp [nullable]
  driver_id: UUID [FK → User, nullable]
  driver_signature: string [nullable, base64]
  trailer_number: string [nullable]
  seal_number: string [nullable]
  pod_document_id: UUID [FK → Document, nullable]
  bol_document_id: UUID [FK → Document, nullable]
  packing_list_document_id: UUID [FK → Document, nullable]
  special_instructions: text [nullable]
  internal_notes: text [nullable]
  created_at: timestamp
  updated_at: timestamp
  created_by: UUID [FK → User]
}

Class ShipmentItem {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  shipment_id: UUID [FK → Shipment]
  package_id: UUID [FK → Package]
  job_id: UUID [FK → ProcessingJob]
  order_line_id: UUID [FK → OrderLine]
  inventory_unit_id: UUID [FK → InventoryUnit, nullable]
  description: string
  quantity: decimal(12,3)
  uom: string [FK → UnitOfMeasure.code]
  weight: decimal(12,3) [nullable]
  heat_number: string [nullable]
  line_number: integer
}

Class Package {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  shipment_id: UUID [FK → Shipment]
  package_number: string [unique per shipment]
  barcode: string [unique per tenant]
  package_type: enum [skid, bundle, crate, box, tube, drum, loose]
  weight: decimal(12,2)
  weight_uom: string [FK → UnitOfMeasure.code, default: 'LB']
  length: decimal(10,2) [nullable]
  width: decimal(10,2) [nullable]
  height: decimal(10,2) [nullable]
  dimension_uom: string [FK → UnitOfMeasure.code, default: 'IN']
  piece_count: integer
  freight_class: string [nullable]
  nmfc_code: string [nullable]
  is_hazmat: boolean [default: false]
  hazmat_class: string [nullable]
  label_printed: boolean [default: false]
  carrier_label_id: string [nullable]
  notes: text [nullable]
}

Class Carrier {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  code: string [unique per tenant]
  name: string
  scac_code: string [nullable, 2-4 char]
  carrier_type: enum [ltl, ftl, parcel, our_truck, courier]
  account_number: string [nullable]
  api_enabled: boolean [default: false]
  api_config: JSON [nullable, encrypted credentials]
  tracking_url_template: string [nullable]
  status: enum [active, inactive]
  services: JSON [array of service level objects]
}

┌─────────────────────────────────────────────────────────────────────────────┐
│                            USER & AUTH DOMAIN                               │
└─────────────────────────────────────────────────────────────────────────────┘

Class User {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  email: string [unique globally]
  password_hash: string
  first_name: string
  last_name: string
  display_name: string [computed or override]
  phone: string [nullable]
  avatar_url: string [nullable]
  status: enum [active, inactive, locked, pending]
  user_type: enum [internal, customer_portal, system]
  primary_location_id: UUID [FK → Location, nullable]
  primary_division_id: UUID [FK → Division, nullable]
  employee_id: string [nullable]
  clock_pin: string [nullable, for shop floor login]
  last_login_at: timestamp [nullable]
  password_changed_at: timestamp [nullable]
  failed_login_count: integer [default: 0]
  locked_until: timestamp [nullable]
  mfa_enabled: boolean [default: false]
  mfa_secret: string [nullable, encrypted]
  preferences: JSON [nullable]
  created_at: timestamp
  updated_at: timestamp
}

Class Role {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant, nullable for system roles]
  code: string [unique per tenant or globally for system]
  name: string
  description: string [nullable]
  is_system_role: boolean [default: false]
  hierarchy_level: integer [for role inheritance]
  parent_role_id: UUID [FK → Role, nullable]
  status: enum [active, inactive]
}

Class Permission {
  id: UUID [PK]
  code: string [unique, e.g., 'order.create', 'job.start']
  name: string
  description: string [nullable]
  resource: string [e.g., 'order', 'job', 'inventory']
  action: string [e.g., 'create', 'read', 'update', 'delete', 'execute']
  is_system_permission: boolean [default: false]
}

Class RolePermission {
  id: UUID [PK]
  role_id: UUID [FK → Role]
  permission_id: UUID [FK → Permission]
  constraints: JSON [nullable, e.g., division_id, location_id restrictions]
}

Class UserRole {
  id: UUID [PK]
  user_id: UUID [FK → User]
  role_id: UUID [FK → Role]
  location_id: UUID [FK → Location, nullable, scope role to location]
  division_id: UUID [FK → Division, nullable, scope role to division]
  granted_at: timestamp
  granted_by: UUID [FK → User]
  expires_at: timestamp [nullable]
}

Class UserLocationAccess {
  id: UUID [PK]
  user_id: UUID [FK → User]
  location_id: UUID [FK → Location]
  access_type: enum [full, read_only]
  is_primary: boolean [default: false]
}

Class Session {
  id: UUID [PK]
  user_id: UUID [FK → User]
  token_hash: string
  refresh_token_hash: string [nullable]
  device_info: JSON [nullable]
  ip_address: string [nullable]
  location_id: UUID [FK → Location, nullable, session context]
  division_id: UUID [FK → Division, nullable, session context]
  created_at: timestamp
  expires_at: timestamp
  last_activity_at: timestamp
  revoked: boolean [default: false]
}

┌─────────────────────────────────────────────────────────────────────────────┐
│                          SUPPORTING ENTITIES                                │
└─────────────────────────────────────────────────────────────────────────────┘

Class UnitOfMeasure {
  code: string [PK, e.g., 'LB', 'KG', 'EA', 'FT']
  name: string
  category: enum [weight, length, area, volume, count]
  base_unit: string [FK → UnitOfMeasure.code, nullable]
  conversion_factor: decimal(18,10) [nullable, to convert to base]
  is_system: boolean [default: true]
}

Class PaymentTerm {
  code: string [PK, e.g., 'NET30', 'COD']
  name: string
  days_due: integer
  discount_percent: decimal(5,2) [nullable]
  discount_days: integer [nullable]
  is_active: boolean [default: true]
}

Class TaxJurisdiction {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  name: string
  state: string
  county: string [nullable]
  city: string [nullable]
  tax_rate: decimal(6,4)
  effective_date: date
  expiration_date: date [nullable]
}

Class Document {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  document_type: enum [mtr, coa, coc, bol, packing_list, pod, invoice, quote, drawing, photo, certificate, other]
  filename: string
  mime_type: string
  file_size: integer
  storage_path: string
  storage_provider: enum [s3, azure, local]
  checksum: string [nullable, SHA256]
  reference_type: enum [job, order, shipment, inventory, customer, vendor, heat] [nullable]
  reference_id: UUID [nullable]
  uploaded_by: UUID [FK → User]
  uploaded_at: timestamp
  expires_at: timestamp [nullable]
  is_public: boolean [default: false]
  metadata: JSON [nullable]
}

Class Vendor {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  code: string [unique per tenant]
  name: string
  status: enum [active, inactive, pending]
  payment_terms: string [FK → PaymentTerm.code]
  is_approved: boolean [default: false]
  approved_date: date [nullable]
  approved_by: UUID [FK → User, nullable]
  lead_time_days: integer [nullable]
  notes: text [nullable]
  created_at: timestamp
  updated_at: timestamp
}

Class ScrapReason {
  code: string [PK]
  tenant_id: UUID [FK → Tenant, nullable for system reasons]
  name: string
  category: enum [material_defect, operator_error, equipment_failure, customer_spec, setup_waste, end_loss]
  requires_approval: boolean [default: false]
  is_active: boolean [default: true]
}

Class Heat {
  id: UUID [PK]
  tenant_id: UUID [FK → Tenant]
  heat_number: string [unique per tenant]
  grade_id: UUID [FK → Grade]
  vendor_id: UUID [FK → Vendor, nullable]
  mill_name: string [nullable]
  pour_date: date [nullable]
  mtr_document_id: UUID [FK → Document, nullable]
  chemistry: JSON [nullable, element percentages]
  mechanical_properties: JSON [nullable, test results]
  country_of_origin: string [nullable]
  domestic_melt: boolean [nullable]
  dfars_compliant: boolean [nullable]
  notes: text [nullable]
  created_at: timestamp
  updated_at: timestamp
}
```

---

## 2. relationships

```json
[
  {
    "from": "Customer",
    "to": "Tenant",
    "type": "many-to-one",
    "field": "tenant_id",
    "description": "Each customer belongs to one tenant"
  },
  {
    "from": "Customer",
    "to": "Contact",
    "type": "one-to-many",
    "field": "customer_id",
    "description": "Customer has multiple contacts"
  },
  {
    "from": "Customer",
    "to": "Address",
    "type": "one-to-many",
    "field": "customer_id",
    "description": "Customer has multiple addresses (bill-to, ship-to)"
  },
  {
    "from": "Customer",
    "to": "ContractPricing",
    "type": "one-to-many",
    "field": "customer_id",
    "description": "Customer may have multiple pricing contracts"
  },
  {
    "from": "Customer",
    "to": "Order",
    "type": "one-to-many",
    "field": "customer_id",
    "description": "Customer has many orders"
  },
  {
    "from": "Customer",
    "to": "User",
    "type": "many-to-one",
    "field": "sales_rep_id",
    "description": "Customer assigned to sales rep"
  },
  {
    "from": "ContractPricing",
    "to": "ContractPricingLine",
    "type": "one-to-many",
    "field": "contract_id",
    "description": "Contract has multiple pricing lines"
  },
  {
    "from": "ContractPricingLine",
    "to": "Product",
    "type": "many-to-one",
    "field": "product_id",
    "description": "Pricing line applies to specific product"
  },
  {
    "from": "ContractPricingLine",
    "to": "Grade",
    "type": "many-to-one",
    "field": "grade_id",
    "description": "Pricing line applies to grade"
  },
  {
    "from": "Product",
    "to": "Division",
    "type": "many-to-one",
    "field": "division_id",
    "description": "Product belongs to division (metals/plastics)"
  },
  {
    "from": "Product",
    "to": "ProductCategory",
    "type": "many-to-one",
    "field": "category_id",
    "description": "Product belongs to category"
  },
  {
    "from": "Product",
    "to": "Grade",
    "type": "many-to-one",
    "field": "grade_id",
    "description": "Product has specific grade"
  },
  {
    "from": "ProductCategory",
    "to": "ProductCategory",
    "type": "many-to-one",
    "field": "parent_id",
    "description": "Category hierarchy (self-reference)"
  },
  {
    "from": "Product",
    "to": "ProductPrice",
    "type": "one-to-many",
    "field": "product_id",
    "description": "Product has multiple price tiers"
  },
  {
    "from": "Grade",
    "to": "Division",
    "type": "many-to-one",
    "field": "division_id",
    "description": "Grade belongs to division"
  },
  {
    "from": "Order",
    "to": "Customer",
    "type": "many-to-one",
    "field": "customer_id",
    "description": "Order belongs to customer"
  },
  {
    "from": "Order",
    "to": "Division",
    "type": "many-to-one",
    "field": "division_id",
    "description": "Order belongs to division"
  },
  {
    "from": "Order",
    "to": "Location",
    "type": "many-to-one",
    "field": "location_id",
    "description": "Order placed at location"
  },
  {
    "from": "Order",
    "to": "OrderLine",
    "type": "one-to-many",
    "field": "order_id",
    "description": "Order has multiple line items"
  },
  {
    "from": "OrderLine",
    "to": "Product",
    "type": "many-to-one",
    "field": "product_id",
    "description": "Order line for specific product"
  },
  {
    "from": "OrderLine",
    "to": "OrderLineProcessing",
    "type": "one-to-many",
    "field": "order_line_id",
    "description": "Order line may have multiple processing steps"
  },
  {
    "from": "OrderLine",
    "to": "InventoryUnit",
    "type": "many-to-one",
    "field": "allocated_inventory_id",
    "description": "Order line allocated to specific inventory"
  },
  {
    "from": "OrderLine",
    "to": "ProcessingJob",
    "type": "one-to-many",
    "field": "order_line_id",
    "description": "Order line generates one or more jobs"
  },
  {
    "from": "OrderLineProcessing",
    "to": "ProcessingType",
    "type": "many-to-one",
    "field": "processing_type_id",
    "description": "Processing step uses processing type"
  },
  {
    "from": "ProcessingJob",
    "to": "Order",
    "type": "many-to-one",
    "field": "order_id",
    "description": "Job belongs to order"
  },
  {
    "from": "ProcessingJob",
    "to": "OrderLine",
    "type": "many-to-one",
    "field": "order_line_id",
    "description": "Job fulfills order line"
  },
  {
    "from": "ProcessingJob",
    "to": "InventoryUnit",
    "type": "many-to-one",
    "field": "input_inventory_id",
    "description": "Job uses input inventory"
  },
  {
    "from": "ProcessingJob",
    "to": "WorkCenter",
    "type": "many-to-one",
    "field": "current_work_center_id",
    "description": "Job currently at work center"
  },
  {
    "from": "ProcessingJob",
    "to": "OperationStep",
    "type": "one-to-many",
    "field": "job_id",
    "description": "Job has multiple operation steps"
  },
  {
    "from": "ProcessingJob",
    "to": "JobEventLog",
    "type": "one-to-many",
    "field": "job_id",
    "description": "Job has event log history"
  },
  {
    "from": "ProcessingJob",
    "to": "ScrapRecord",
    "type": "one-to-many",
    "field": "job_id",
    "description": "Job may have scrap records"
  },
  {
    "from": "ProcessingJob",
    "to": "MeasurementRecord",
    "type": "one-to-many",
    "field": "job_id",
    "description": "Job has measurement records"
  },
  {
    "from": "OperationStep",
    "to": "ProcessingType",
    "type": "many-to-one",
    "field": "processing_type_id",
    "description": "Operation step uses processing type"
  },
  {
    "from": "OperationStep",
    "to": "WorkCenter",
    "type": "many-to-one",
    "field": "work_center_id",
    "description": "Operation step assigned to work center"
  },
  {
    "from": "OperationStep",
    "to": "User",
    "type": "many-to-one",
    "field": "operator_id",
    "description": "Operation step performed by operator"
  },
  {
    "from": "InventoryUnit",
    "to": "Product",
    "type": "many-to-one",
    "field": "product_id",
    "description": "Inventory unit is specific product"
  },
  {
    "from": "InventoryUnit",
    "to": "Location",
    "type": "many-to-one",
    "field": "location_id",
    "description": "Inventory at location"
  },
  {
    "from": "InventoryUnit",
    "to": "StorageLocation",
    "type": "many-to-one",
    "field": "storage_location_id",
    "description": "Inventory in specific storage location"
  },
  {
    "from": "InventoryUnit",
    "to": "Heat",
    "type": "many-to-one",
    "field": "heat_number",
    "description": "Inventory traced to heat"
  },
  {
    "from": "InventoryUnit",
    "to": "InventoryUnit",
    "type": "many-to-one",
    "field": "parent_unit_id",
    "description": "Split inventory traces to parent"
  },
  {
    "from": "InventoryUnit",
    "to": "InventoryTransaction",
    "type": "one-to-many",
    "field": "unit_id",
    "description": "Inventory has transaction history"
  },
  {
    "from": "StorageLocation",
    "to": "Location",
    "type": "many-to-one",
    "field": "location_id",
    "description": "Storage location within facility"
  },
  {
    "from": "WorkCenter",
    "to": "Location",
    "type": "many-to-one",
    "field": "location_id",
    "description": "Work center at location"
  },
  {
    "from": "WorkCenter",
    "to": "Division",
    "type": "many-to-one",
    "field": "division_id",
    "description": "Work center serves division"
  },
  {
    "from": "Shipment",
    "to": "Customer",
    "type": "many-to-one",
    "field": "customer_id",
    "description": "Shipment for customer"
  },
  {
    "from": "Shipment",
    "to": "Location",
    "type": "many-to-one",
    "field": "location_id",
    "description": "Shipment from location"
  },
  {
    "from": "Shipment",
    "to": "Carrier",
    "type": "many-to-one",
    "field": "carrier_id",
    "description": "Shipment uses carrier"
  },
  {
    "from": "Shipment",
    "to": "Package",
    "type": "one-to-many",
    "field": "shipment_id",
    "description": "Shipment contains packages"
  },
  {
    "from": "Shipment",
    "to": "ShipmentItem",
    "type": "one-to-many",
    "field": "shipment_id",
    "description": "Shipment contains items"
  },
  {
    "from": "ShipmentItem",
    "to": "Package",
    "type": "many-to-one",
    "field": "package_id",
    "description": "Item in package"
  },
  {
    "from": "ShipmentItem",
    "to": "ProcessingJob",
    "type": "many-to-one",
    "field": "job_id",
    "description": "Item from job"
  },
  {
    "from": "ShipmentItem",
    "to": "OrderLine",
    "type": "many-to-one",
    "field": "order_line_id",
    "description": "Item fulfills order line"
  },
  {
    "from": "Location",
    "to": "Tenant",
    "type": "many-to-one",
    "field": "tenant_id",
    "description": "Location belongs to tenant"
  },
  {
    "from": "Location",
    "to": "Location",
    "type": "many-to-one",
    "field": "parent_location_id",
    "description": "Location hierarchy"
  },
  {
    "from": "Division",
    "to": "Tenant",
    "type": "many-to-one",
    "field": "tenant_id",
    "description": "Division belongs to tenant"
  },
  {
    "from": "User",
    "to": "Tenant",
    "type": "many-to-one",
    "field": "tenant_id",
    "description": "User belongs to tenant"
  },
  {
    "from": "User",
    "to": "UserRole",
    "type": "one-to-many",
    "field": "user_id",
    "description": "User has role assignments"
  },
  {
    "from": "UserRole",
    "to": "Role",
    "type": "many-to-one",
    "field": "role_id",
    "description": "User role assignment"
  },
  {
    "from": "Role",
    "to": "RolePermission",
    "type": "one-to-many",
    "field": "role_id",
    "description": "Role has permissions"
  },
  {
    "from": "RolePermission",
    "to": "Permission",
    "type": "many-to-one",
    "field": "permission_id",
    "description": "Role permission assignment"
  },
  {
    "from": "Role",
    "to": "Role",
    "type": "many-to-one",
    "field": "parent_role_id",
    "description": "Role hierarchy"
  },
  {
    "from": "User",
    "to": "UserLocationAccess",
    "type": "one-to-many",
    "field": "user_id",
    "description": "User location access list"
  },
  {
    "from": "UserLocationAccess",
    "to": "Location",
    "type": "many-to-one",
    "field": "location_id",
    "description": "Location access grant"
  },
  {
    "from": "User",
    "to": "Session",
    "type": "one-to-many",
    "field": "user_id",
    "description": "User active sessions"
  },
  {
    "from": "Contact",
    "to": "User",
    "type": "one-to-one",
    "field": "portal_user_id",
    "description": "Contact linked to portal user"
  },
  {
    "from": "Heat",
    "to": "Grade",
    "type": "many-to-one",
    "field": "grade_id",
    "description": "Heat has grade specification"
  },
  {
    "from": "Heat",
    "to": "Vendor",
    "type": "many-to-one",
    "field": "vendor_id",
    "description": "Heat from vendor/mill"
  },
  {
    "from": "Heat",
    "to": "Document",
    "type": "one-to-one",
    "field": "mtr_document_id",
    "description": "Heat has MTR document"
  },
  {
    "from": "ProcessingType",
    "to": "Division",
    "type": "many-to-one",
    "field": "division_id",
    "description": "Processing type for division"
  }
]
```

---

## 3. ownership_rules

```json
[
  {
    "entity": "Tenant",
    "owner_entity": null,
    "owner_field": null,
    "description": "Top-level entity, no owner",
    "delete_cascade": ["Customer", "Location", "Division", "User", "Product", "Grade"]
  },
  {
    "entity": "Customer",
    "owner_entity": "Tenant",
    "owner_field": "tenant_id",
    "description": "Tenant owns customers",
    "delete_cascade": ["Contact", "Address", "ContractPricing", "Order"]
  },
  {
    "entity": "Order",
    "owner_entity": "Customer",
    "owner_field": "customer_id",
    "description": "Customer owns orders",
    "additional_owner": { "entity": "Location", "field": "location_id" },
    "delete_cascade": ["OrderLine"]
  },
  {
    "entity": "OrderLine",
    "owner_entity": "Order",
    "owner_field": "order_id",
    "description": "Order owns line items",
    "delete_cascade": ["OrderLineProcessing"]
  },
  {
    "entity": "ProcessingJob",
    "owner_entity": "Order",
    "owner_field": "order_id",
    "description": "Order owns jobs (via order_line)",
    "additional_owner": { "entity": "Location", "field": "location_id" },
    "delete_cascade": ["OperationStep", "JobEventLog", "ScrapRecord", "MeasurementRecord"]
  },
  {
    "entity": "OperationStep",
    "owner_entity": "ProcessingJob",
    "owner_field": "job_id",
    "description": "Job owns operation steps"
  },
  {
    "entity": "InventoryUnit",
    "owner_entity": "Tenant",
    "owner_field": "tenant_id",
    "description": "Tenant owns inventory",
    "location_scoped": true,
    "location_field": "location_id",
    "delete_cascade": ["InventoryTransaction"]
  },
  {
    "entity": "Shipment",
    "owner_entity": "Tenant",
    "owner_field": "tenant_id",
    "description": "Tenant owns shipments",
    "location_scoped": true,
    "location_field": "location_id",
    "delete_cascade": ["Package", "ShipmentItem"]
  },
  {
    "entity": "Package",
    "owner_entity": "Shipment",
    "owner_field": "shipment_id",
    "description": "Shipment owns packages"
  },
  {
    "entity": "ShipmentItem",
    "owner_entity": "Shipment",
    "owner_field": "shipment_id",
    "description": "Shipment owns items"
  },
  {
    "entity": "WorkCenter",
    "owner_entity": "Location",
    "owner_field": "location_id",
    "description": "Location owns work centers",
    "division_scoped": true,
    "division_field": "division_id"
  },
  {
    "entity": "StorageLocation",
    "owner_entity": "Location",
    "owner_field": "location_id",
    "description": "Location owns storage locations"
  },
  {
    "entity": "Product",
    "owner_entity": "Tenant",
    "owner_field": "tenant_id",
    "description": "Tenant owns product catalog",
    "division_scoped": true,
    "division_field": "division_id"
  },
  {
    "entity": "Grade",
    "owner_entity": "Tenant",
    "owner_field": "tenant_id",
    "description": "Tenant owns grades",
    "division_scoped": true,
    "division_field": "division_id"
  },
  {
    "entity": "User",
    "owner_entity": "Tenant",
    "owner_field": "tenant_id",
    "description": "Tenant owns users",
    "exception": "System users may have null tenant_id"
  },
  {
    "entity": "Role",
    "owner_entity": "Tenant",
    "owner_field": "tenant_id",
    "description": "Tenant owns custom roles",
    "exception": "System roles have null tenant_id"
  },
  {
    "entity": "Document",
    "owner_entity": "Tenant",
    "owner_field": "tenant_id",
    "description": "Tenant owns documents",
    "polymorphic_reference": { "type_field": "reference_type", "id_field": "reference_id" }
  },
  {
    "entity": "Heat",
    "owner_entity": "Tenant",
    "owner_field": "tenant_id",
    "description": "Tenant owns heat records"
  },
  {
    "entity": "Location",
    "owner_entity": "Tenant",
    "owner_field": "tenant_id",
    "description": "Tenant owns locations"
  },
  {
    "entity": "Division",
    "owner_entity": "Tenant",
    "owner_field": "tenant_id",
    "description": "Tenant owns divisions"
  }
]
```

---

## 4. segmentation_rules

```json
{
  "by_tenant": {
    "description": "All data is tenant-scoped; rows without matching tenant_id are invisible",
    "enforcement": "row_level_security",
    "implementation": [
      {
        "layer": "database",
        "method": "RLS policy on all tenant-scoped tables",
        "policy": "tenant_id = current_setting('app.current_tenant')::uuid"
      },
      {
        "layer": "api",
        "method": "Middleware injects tenant_id from authenticated session",
        "validation": "All queries include tenant_id filter"
      },
      {
        "layer": "ui",
        "method": "Tenant context from auth token, no cross-tenant navigation"
      }
    ],
    "scoped_entities": [
      "Customer", "Contact", "Address", "ContractPricing",
      "Product", "ProductCategory", "Grade", "ProductPrice",
      "Order", "OrderLine", "ProcessingJob", "OperationStep",
      "InventoryUnit", "InventoryTransaction", "StorageLocation",
      "Shipment", "Package", "ShipmentItem",
      "WorkCenter", "Location", "Division",
      "User", "Role", "UserRole", "Session",
      "Document", "Heat", "Vendor", "Carrier"
    ],
    "global_entities": [
      "Permission", "UnitOfMeasure", "PaymentTerm", "ScrapReason"
    ],
    "cross_tenant_forbidden": true
  },
  "by_division": {
    "description": "Division segments metals vs plastics within a tenant",
    "enforcement": "application_logic",
    "implementation": [
      {
        "layer": "api",
        "method": "Division filter applied when user has division restriction"
      },
      {
        "layer": "ui",
        "method": "Division picker in app header; persisted in session context"
      }
    ],
    "scoped_entities": [
      "Product", "Grade", "ProcessingType", "WorkCenter",
      "Order", "OrderLine", "ProcessingJob", "InventoryUnit"
    ],
    "rules": [
      {
        "rule_id": "product_division_match",
        "description": "Products only visible in their division",
        "filter": "product.division_id = session.division_id"
      },
      {
        "rule_id": "order_division_locked",
        "description": "Order lines must match order division",
        "validation": "order_line.product.division_id = order.division_id"
      },
      {
        "rule_id": "cross_division_transfer",
        "description": "Inventory transfer across divisions requires manager approval",
        "exception": true,
        "requires_role": "BRANCH_MANAGER"
      },
      {
        "rule_id": "user_division_access",
        "description": "User may have access to one or both divisions",
        "source": "user.primary_division_id OR user_role.division_id IS NULL (all)"
      }
    ],
    "ui_behavior": {
      "division_switcher": true,
      "remember_preference": true,
      "default": "user.primary_division_id"
    }
  },
  "by_location": {
    "description": "Location segments data by branch/warehouse",
    "enforcement": "application_logic",
    "implementation": [
      {
        "layer": "api",
        "method": "Location filter based on UserLocationAccess"
      },
      {
        "layer": "ui",
        "method": "Location picker; multi-location users can switch"
      }
    ],
    "scoped_entities": [
      "Order", "ProcessingJob", "InventoryUnit", "Shipment",
      "WorkCenter", "StorageLocation"
    ],
    "rules": [
      {
        "rule_id": "user_location_access",
        "description": "User sees only locations in UserLocationAccess",
        "filter": "entity.location_id IN (SELECT location_id FROM user_location_access WHERE user_id = current_user)"
      },
      {
        "rule_id": "inventory_location_visibility",
        "description": "Inventory visible at user's locations; cross-location viewable with permission",
        "permission": "inventory.view_all_locations"
      },
      {
        "rule_id": "job_location_locked",
        "description": "Job processed at assigned location unless transferred",
        "transfer_requires": "PLANNER role"
      },
      {
        "rule_id": "order_location_default",
        "description": "Order defaults to user's primary location",
        "source": "user.primary_location_id"
      },
      {
        "rule_id": "multi_location_orders",
        "description": "Order may source from multiple locations (split fulfillment)",
        "requires_role": "CSR"
      }
    ],
    "ui_behavior": {
      "location_switcher": true,
      "show_all_locations_option": "if user has permission",
      "default": "user.primary_location_id"
    }
  },
  "combined_rules": {
    "query_pattern": "WHERE tenant_id = :tenant AND (:division IS NULL OR division_id = :division) AND location_id IN (:user_locations)",
    "precedence": ["tenant", "location", "division"],
    "cache_key_pattern": "{tenant_id}:{location_id}:{division_id}:{entity}:{id}"
  }
}
```

---

## 5. canonical_ids

```json
{
  "id_formats": [
    {
      "entity": "Order",
      "field": "order_number",
      "format": "{LOC}-{YYMMDD}-{SEQ}",
      "example": "CLV-260117-0042",
      "components": {
        "LOC": "Location code (3 chars)",
        "YYMMDD": "Date (6 digits)",
        "SEQ": "Daily sequence (4 digits, zero-padded)"
      },
      "unique_scope": "tenant"
    },
    {
      "entity": "ProcessingJob",
      "field": "job_number",
      "format": "{LOC}-J-{YYMMDD}-{SEQ}",
      "example": "CLV-J-260117-0123",
      "components": {
        "LOC": "Location code (3 chars)",
        "J": "Job indicator",
        "YYMMDD": "Date (6 digits)",
        "SEQ": "Daily sequence (4 digits)"
      },
      "unique_scope": "tenant"
    },
    {
      "entity": "InventoryUnit",
      "field": "unit_number",
      "format": "{LOC}-{DIV}{FORM}-{YYMMDD}-{SEQ}",
      "example": "CLV-MC-260117-0001",
      "components": {
        "LOC": "Location code (3 chars)",
        "DIV": "Division code (1 char: M=metals, P=plastics)",
        "FORM": "Form code (1 char: C=coil, S=sheet, P=plate, B=bar, T=tube)",
        "YYMMDD": "Receipt date (6 digits)",
        "SEQ": "Daily sequence (4 digits)"
      },
      "unique_scope": "tenant"
    },
    {
      "entity": "Shipment",
      "field": "shipment_number",
      "format": "{LOC}-S-{YYMMDD}-{SEQ}",
      "example": "DET-S-260117-0015",
      "components": {
        "LOC": "Location code (3 chars)",
        "S": "Shipment indicator",
        "YYMMDD": "Date (6 digits)",
        "SEQ": "Daily sequence (4 digits)"
      },
      "unique_scope": "tenant"
    },
    {
      "entity": "Customer",
      "field": "account_number",
      "format": "{SEQ}",
      "example": "100425",
      "components": {
        "SEQ": "Sequential account number (6 digits)"
      },
      "unique_scope": "tenant",
      "notes": "Legacy systems may import existing account numbers"
    },
    {
      "entity": "Product",
      "field": "sku",
      "format": "{DIV}-{CAT}-{GRADE}-{SIZE}",
      "example": "M-CS-A36-0.250X48",
      "components": {
        "DIV": "Division (1 char)",
        "CAT": "Category code (2-4 chars)",
        "GRADE": "Grade code",
        "SIZE": "Size specification"
      },
      "unique_scope": "tenant"
    },
    {
      "entity": "Package",
      "field": "barcode",
      "format": "{SHIPMENT}-{PKG}",
      "example": "DET-S-260117-0015-001",
      "components": {
        "SHIPMENT": "Shipment number",
        "PKG": "Package sequence (3 digits)"
      },
      "unique_scope": "tenant"
    },
    {
      "entity": "Heat",
      "field": "heat_number",
      "format": "vendor-assigned",
      "example": "A12345-6789",
      "notes": "Heat numbers come from mill/vendor, stored as-is"
    },
    {
      "entity": "ContractPricing",
      "field": "contract_number",
      "format": "CTR-{CUST}-{YYMMDD}-{SEQ}",
      "example": "CTR-100425-260101-001",
      "components": {
        "CTR": "Contract prefix",
        "CUST": "Customer account number",
        "YYMMDD": "Effective date",
        "SEQ": "Sequence (3 digits)"
      },
      "unique_scope": "tenant"
    },
    {
      "entity": "Document",
      "field": "id",
      "format": "UUID v4",
      "example": "550e8400-e29b-41d4-a716-446655440000",
      "unique_scope": "global"
    }
  ],
  "uuid_entities": [
    "Tenant", "Customer", "Contact", "Address", "ContractPricing",
    "Product", "ProductCategory", "Grade", "ProductPrice",
    "Order", "OrderLine", "OrderLineProcessing",
    "ProcessingJob", "OperationStep", "JobEventLog",
    "InventoryUnit", "InventoryTransaction", "StorageLocation",
    "Shipment", "Package", "ShipmentItem",
    "WorkCenter", "Location", "Division",
    "User", "Role", "Permission", "UserRole", "Session",
    "Document", "Heat", "Vendor", "Carrier"
  ],
  "sequence_generators": {
    "daily_reset": ["order_number", "job_number", "shipment_number", "unit_number"],
    "continuous": ["account_number", "contract_number"],
    "per_parent": ["line_number (per order)", "package_number (per shipment)", "sequence (per job)"]
  },
  "barcode_formats": {
    "inventory_unit": "Code128",
    "package": "Code128",
    "product": "Code128",
    "storage_location": "Code39"
  },
  "api_id_conventions": {
    "path_parameter": "Use UUID for /api/orders/{id}",
    "query_filter": "Accept both UUID and display number for search",
    "response_format": "Always include both id (UUID) and display_number"
  }
}
```

---

## 6. Entity Summary Table

| Entity | Owner | Tenant-Scoped | Division-Scoped | Location-Scoped | Primary ID Format |
|--------|-------|---------------|-----------------|-----------------|-------------------|
| Tenant | — | — | — | — | UUID |
| Customer | Tenant | ✓ | — | — | account_number |
| Contact | Customer | ✓ | — | — | UUID |
| Address | Customer | ✓ | — | — | UUID |
| ContractPricing | Customer | ✓ | — | — | contract_number |
| Product | Tenant | ✓ | ✓ | — | sku |
| Grade | Tenant | ✓ | ✓ | — | UUID + code |
| Order | Customer | ✓ | ✓ | ✓ | order_number |
| OrderLine | Order | ✓ | ✓ | ✓ | UUID |
| ProcessingJob | Order | ✓ | ✓ | ✓ | job_number |
| OperationStep | Job | ✓ | ✓ | ✓ | UUID |
| InventoryUnit | Tenant | ✓ | ✓ | ✓ | unit_number |
| WorkCenter | Location | ✓ | ✓ | ✓ | UUID + code |
| StorageLocation | Location | ✓ | — | ✓ | UUID + code |
| Shipment | Tenant | ✓ | — | ✓ | shipment_number |
| Package | Shipment | ✓ | — | ✓ | barcode |
| Location | Tenant | ✓ | — | — | UUID + code |
| Division | Tenant | ✓ | — | — | UUID + code |
| User | Tenant | ✓ | — | — | UUID |
| Role | Tenant | ✓* | — | — | UUID + code |
| Heat | Tenant | ✓ | — | — | heat_number |
| Document | Tenant | ✓ | — | — | UUID |

*Roles may be system-level (null tenant_id) or tenant-specific

---

*Document generated for Build Phase: Phase 1 Data Model*
