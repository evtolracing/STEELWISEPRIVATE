# 44 — AI Data Model (Phase 1)

> **Purpose:** Core data model entities, relationships, and governance rules for AI-build.  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. Entities — UML Class List (Text UML)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CORE DOMAIN ENTITIES                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│             Tenant                   │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + code: VARCHAR(20) <<UK>>           │
│ + name: VARCHAR(100)                 │
│ + legal_name: VARCHAR(200)           │
│ + tax_id: VARCHAR(20)                │
│ + status: ENUM(ACTIVE,SUSPENDED,     │
│           TERMINATED)                │
│ + subscription_tier: ENUM            │
│ + settings: JSONB                    │
│ + created_at: TIMESTAMPTZ            │
│ + updated_at: TIMESTAMPTZ            │
├──────────────────────────────────────┤
│ + getLocations(): Location[]         │
│ + getDivisions(): Division[]         │
│ + getUsers(): User[]                 │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│             Location                 │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + tenant_id: UUID <<FK>>             │
│ + code: VARCHAR(10) <<UK/tenant>>    │
│ + name: VARCHAR(100)                 │
│ + type: ENUM(WAREHOUSE,BRANCH,       │
│         SERVICE_CENTER,YARD,VIRTUAL) │
│ + address_id: UUID <<FK>>            │
│ + timezone: VARCHAR(50)              │
│ + is_primary: BOOLEAN                │
│ + can_ship: BOOLEAN                  │
│ + can_receive: BOOLEAN               │
│ + can_process: BOOLEAN               │
│ + operating_hours: JSONB             │
│ + status: ENUM(ACTIVE,INACTIVE)      │
│ + created_at: TIMESTAMPTZ            │
│ + updated_at: TIMESTAMPTZ            │
├──────────────────────────────────────┤
│ + getInventory(): InventoryItem[]    │
│ + getWorkCenters(): WorkCenter[]     │
│ + getZones(): Zone[]                 │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│              Zone                    │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + location_id: UUID <<FK>>           │
│ + code: VARCHAR(20) <<UK/location>>  │
│ + name: VARCHAR(100)                 │
│ + type: ENUM(STORAGE,STAGING,        │
│         RECEIVING,SHIPPING,          │
│         PRODUCTION,QUARANTINE)       │
│ + capacity_sqft: DECIMAL(10,2)       │
│ + max_weight_lbs: DECIMAL(12,2)      │
│ + is_outdoor: BOOLEAN                │
│ + climate_controlled: BOOLEAN        │
│ + status: ENUM(ACTIVE,INACTIVE)      │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│            BinLocation               │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + zone_id: UUID <<FK>>               │
│ + code: VARCHAR(30) <<UK/zone>>      │
│ + aisle: VARCHAR(5)                  │
│ + rack: VARCHAR(5)                   │
│ + level: VARCHAR(5)                  │
│ + position: VARCHAR(5)               │
│ + bin_type: ENUM(FLOOR,RACK,         │
│             CANTILEVER,BULK,YARD)    │
│ + max_weight_lbs: DECIMAL(10,2)      │
│ + max_pieces: INTEGER                │
│ + is_pickable: BOOLEAN               │
│ + is_receiving: BOOLEAN              │
│ + is_staging: BOOLEAN                │
│ + status: ENUM(ACTIVE,INACTIVE,FULL) │
│ + current_inventory_id: UUID <<FK>>  │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│            WorkCenter                │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + location_id: UUID <<FK>>           │
│ + code: VARCHAR(20) <<UK/location>>  │
│ + name: VARCHAR(100)                 │
│ + type: ENUM(SHEAR,SLITTER,LEVELER,  │
│         PLASMA,LASER,SAW,BRAKE,      │
│         ROLL,DRILL,PUNCH,WELD,       │
│         PACKAGING,QUICK_CUT,OTHER)   │
│ + capabilities: JSONB                │
│ + max_thickness_in: DECIMAL(6,4)     │
│ + max_width_in: DECIMAL(8,3)         │
│ + max_length_in: DECIMAL(10,3)       │
│ + min_length_in: DECIMAL(8,3)        │
│ + setup_time_min: INTEGER            │
│ + hourly_rate: DECIMAL(10,2)         │
│ + status: ENUM(ACTIVE,MAINTENANCE,   │
│           OFFLINE)                   │
│ + current_job_id: UUID <<FK>>        │
└──────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PRODUCT CATALOG                                        │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│             Product                  │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + tenant_id: UUID <<FK>>             │
│ + sku: VARCHAR(50) <<UK/tenant>>     │
│ + name: VARCHAR(200)                 │
│ + description: TEXT                  │
│ + product_type: ENUM(STOCK,          │
│                 PROCESSED,SERVICE)   │
│ + category_id: UUID <<FK>>           │
│ + material_type_id: UUID <<FK>>      │
│ + grade_id: UUID <<FK>>              │
│ + form_id: UUID <<FK>>               │
│ + uom_id: UUID <<FK>>                │
│ + pricing_uom_id: UUID <<FK>>        │
│ + weight_per_unit: DECIMAL(12,4)     │
│ + is_active: BOOLEAN                 │
│ + is_sellable: BOOLEAN               │
│ + is_purchasable: BOOLEAN            │
│ + requires_mtr: BOOLEAN              │
│ + requires_heat: BOOLEAN             │
│ + min_order_qty: DECIMAL(10,3)       │
│ + max_order_qty: DECIMAL(10,3)       │
│ + lead_time_days: INTEGER            │
│ + created_at: TIMESTAMPTZ            │
│ + updated_at: TIMESTAMPTZ            │
├──────────────────────────────────────┤
│ + getDimensions(): ProductDimension  │
│ + getPricing(): ProductPrice[]       │
│ + getInventory(): InventoryItem[]    │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│         ProductDimension             │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + product_id: UUID <<FK>> <<UK>>     │
│ + thickness: DECIMAL(8,4)            │
│ + thickness_uom: ENUM(IN,MM,GA)      │
│ + width: DECIMAL(10,4)               │
│ + width_uom: ENUM(IN,MM,FT)          │
│ + length: DECIMAL(12,4)              │
│ + length_uom: ENUM(IN,FT,MM,M)       │
│ + od: DECIMAL(10,4)                  │
│ + id_dim: DECIMAL(10,4)              │
│ + wall: DECIMAL(8,4)                 │
│ + weight_per_foot: DECIMAL(10,4)     │
│ + weight_per_sqft: DECIMAL(10,4)     │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│           MaterialType               │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + tenant_id: UUID <<FK>>             │
│ + code: VARCHAR(20) <<UK/tenant>>    │
│ + name: VARCHAR(100)                 │
│ + base_material: ENUM(CARBON,        │
│                  STAINLESS,ALUMINUM, │
│                  ALLOY,BRASS,COPPER) │
│ + density_lb_cuin: DECIMAL(10,6)     │
│ + is_active: BOOLEAN                 │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│              Grade                   │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + tenant_id: UUID <<FK>>             │
│ + code: VARCHAR(30) <<UK/tenant>>    │
│ + name: VARCHAR(100)                 │
│ + specification: VARCHAR(50)         │
│ + material_type_id: UUID <<FK>>      │
│ + yield_strength_ksi: DECIMAL(8,2)   │
│ + tensile_strength_ksi: DECIMAL(8,2) │
│ + elongation_pct: DECIMAL(5,2)       │
│ + hardness_brinell: INTEGER          │
│ + chemistry_spec: JSONB              │
│ + is_active: BOOLEAN                 │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│              Form                    │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + code: VARCHAR(20) <<PK>>           │
│ + name: VARCHAR(100)                 │
│ + category: ENUM(FLAT,LONG,TUBE,     │
│             PLATE,STRUCTURAL)        │
│ + dimension_type: ENUM(SHEET,COIL,   │
│                   BAR,TUBE,BEAM,     │
│                   ANGLE,CHANNEL)     │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│           ProductPrice               │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + product_id: UUID <<FK>>            │
│ + price_type: ENUM(LIST,COST,        │
│               CONTRACT,PROMO)        │
│ + price: DECIMAL(12,4)               │
│ + price_uom_id: UUID <<FK>>          │
│ + effective_date: DATE               │
│ + expiry_date: DATE                  │
│ + min_qty: DECIMAL(10,3)             │
│ + max_qty: DECIMAL(10,3)             │
│ + customer_id: UUID <<FK>>           │
│ + contract_id: UUID <<FK>>           │
│ + created_by: UUID <<FK>>            │
│ + created_at: TIMESTAMPTZ            │
└──────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                           INVENTORY MANAGEMENT                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│           InventoryItem              │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + tenant_id: UUID <<FK>>             │
│ + location_id: UUID <<FK>>           │
│ + product_id: UUID <<FK>>            │
│ + tag_number: VARCHAR(50)            │
│     <<UK/tenant>>                    │
│ + heat_id: UUID <<FK>>               │
│ + lot_number: VARCHAR(50)            │
│ + bin_location_id: UUID <<FK>>       │
│ + status: ENUM(AVAILABLE,ALLOCATED,  │
│           RESERVED,QUARANTINE,       │
│           IN_PROCESS,SHIPPED,SOLD)   │
│ + quantity: DECIMAL(12,4)            │
│ + quantity_uom_id: UUID <<FK>>       │
│ + pieces: INTEGER                    │
│ + weight_lbs: DECIMAL(12,4)          │
│ + length_in: DECIMAL(10,4)           │
│ + width_in: DECIMAL(10,4)            │
│ + received_date: DATE                │
│ + po_id: UUID <<FK>>                 │
│ + po_line_id: UUID <<FK>>            │
│ + cost_per_unit: DECIMAL(12,4)       │
│ + is_remnant: BOOLEAN                │
│ + parent_inventory_id: UUID <<FK>>   │
│ + created_at: TIMESTAMPTZ            │
│ + updated_at: TIMESTAMPTZ            │
├──────────────────────────────────────┤
│ + allocate(qty, order): Allocation   │
│ + transfer(location): InventoryItem  │
│ + split(qty): InventoryItem          │
│ + consume(qty): void                 │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│              Heat                    │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + tenant_id: UUID <<FK>>             │
│ + heat_number: VARCHAR(50)           │
│     <<UK/tenant>>                    │
│ + mill_id: UUID <<FK>>               │
│ + grade_id: UUID <<FK>>              │
│ + pour_date: DATE                    │
│ + chemistry: JSONB                   │
│ + mechanical_properties: JSONB       │
│ + mtr_document_id: UUID <<FK>>       │
│ + created_at: TIMESTAMPTZ            │
├──────────────────────────────────────┤
│ + getMTR(): Document                 │
│ + getInventory(): InventoryItem[]    │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│            Allocation                │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + inventory_item_id: UUID <<FK>>     │
│ + order_line_id: UUID <<FK>>         │
│ + work_order_id: UUID <<FK>>         │
│ + quantity: DECIMAL(12,4)            │
│ + quantity_uom_id: UUID <<FK>>       │
│ + weight_lbs: DECIMAL(12,4)          │
│ + status: ENUM(SOFT,HARD,PICKED,     │
│           CONSUMED,RELEASED)         │
│ + allocated_by: UUID <<FK>>          │
│ + allocated_at: TIMESTAMPTZ          │
│ + expires_at: TIMESTAMPTZ            │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│        InventoryTransaction          │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + tenant_id: UUID <<FK>>             │
│ + inventory_item_id: UUID <<FK>>     │
│ + transaction_type: ENUM(RECEIVE,    │
│                     SHIP,TRANSFER,   │
│                     ADJUST,CONSUME,  │
│                     PRODUCE,SCRAP,   │
│                     COUNT,SPLIT,     │
│                     MERGE)           │
│ + quantity_change: DECIMAL(12,4)     │
│ + weight_change: DECIMAL(12,4)       │
│ + from_location_id: UUID <<FK>>      │
│ + to_location_id: UUID <<FK>>        │
│ + from_bin_id: UUID <<FK>>           │
│ + to_bin_id: UUID <<FK>>             │
│ + reference_type: VARCHAR(50)        │
│ + reference_id: UUID                 │
│ + reason_code: VARCHAR(50)           │
│ + notes: TEXT                        │
│ + created_by: UUID <<FK>>            │
│ + created_at: TIMESTAMPTZ            │
└──────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CUSTOMER & SALES                                       │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│            Customer                  │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + tenant_id: UUID <<FK>>             │
│ + customer_number: VARCHAR(20)       │
│     <<UK/tenant>>                    │
│ + name: VARCHAR(200)                 │
│ + legal_name: VARCHAR(200)           │
│ + customer_type: ENUM(COMMERCIAL,    │
│                  CONTRACTOR,         │
│                  GOVERNMENT,RETAIL)  │
│ + status: ENUM(ACTIVE,INACTIVE,      │
│           SUSPENDED,PROSPECT)        │
│ + tax_exempt: BOOLEAN                │
│ + tax_exempt_number: VARCHAR(50)     │
│ + payment_terms_id: UUID <<FK>>      │
│ + credit_limit: DECIMAL(14,2)        │
│ + credit_hold: BOOLEAN               │
│ + salesperson_id: UUID <<FK>>        │
│ + price_level: VARCHAR(20)           │
│ + requires_po: BOOLEAN               │
│ + requires_mtr: BOOLEAN              │
│ + invoice_consolidation: BOOLEAN     │
│ + created_at: TIMESTAMPTZ            │
│ + updated_at: TIMESTAMPTZ            │
├──────────────────────────────────────┤
│ + getDivisions(): CustomerDivision[] │
│ + getContacts(): Contact[]           │
│ + getOrders(): SalesOrder[]          │
│ + getBalance(): Decimal              │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│         CustomerDivision             │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + customer_id: UUID <<FK>>           │
│ + code: VARCHAR(20) <<UK/customer>>  │
│ + name: VARCHAR(100)                 │
│ + billing_address_id: UUID <<FK>>    │
│ + default_ship_to_id: UUID <<FK>>    │
│ + payment_terms_id: UUID <<FK>>      │
│ + tax_exempt: BOOLEAN                │
│ + tax_exempt_number: VARCHAR(50)     │
│ + is_active: BOOLEAN                 │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│             ShipTo                   │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + customer_id: UUID <<FK>>           │
│ + division_id: UUID <<FK>>           │
│ + code: VARCHAR(20) <<UK/customer>>  │
│ + name: VARCHAR(100)                 │
│ + address_id: UUID <<FK>>            │
│ + contact_name: VARCHAR(100)         │
│ + contact_phone: VARCHAR(20)         │
│ + contact_email: VARCHAR(100)        │
│ + delivery_instructions: TEXT        │
│ + requires_appointment: BOOLEAN      │
│ + receiving_hours: JSONB             │
│ + is_active: BOOLEAN                 │
│ + is_job_site: BOOLEAN               │
│ + job_name: VARCHAR(100)             │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│            Contact                   │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + customer_id: UUID <<FK>>           │
│ + division_id: UUID <<FK>>           │
│ + first_name: VARCHAR(50)            │
│ + last_name: VARCHAR(50)             │
│ + title: VARCHAR(100)                │
│ + email: VARCHAR(100)                │
│ + phone: VARCHAR(20)                 │
│ + mobile: VARCHAR(20)                │
│ + is_primary: BOOLEAN                │
│ + is_billing: BOOLEAN                │
│ + is_purchasing: BOOLEAN             │
│ + can_pickup: BOOLEAN                │
│ + portal_user_id: UUID <<FK>>        │
│ + is_active: BOOLEAN                 │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│            SalesOrder                │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + tenant_id: UUID <<FK>>             │
│ + order_number: VARCHAR(20)          │
│     <<UK/tenant>>                    │
│ + order_type: ENUM(STANDARD,         │
│               BLANKET,QUOTE,         │
│               WILL_CALL,QUICK_SALE)  │
│ + customer_id: UUID <<FK>>           │
│ + division_id: UUID <<FK>>           │
│ + bill_to_address_id: UUID <<FK>>    │
│ + ship_to_id: UUID <<FK>>            │
│ + customer_po: VARCHAR(50)           │
│ + order_date: DATE                   │
│ + requested_date: DATE               │
│ + promise_date: DATE                 │
│ + ship_via: ENUM(OUR_TRUCK,CARRIER,  │
│             WILL_CALL,CUSTOMER_PU)   │
│ + carrier_id: UUID <<FK>>            │
│ + freight_terms: ENUM(PREPAID,       │
│                  COLLECT,FOB_ORIGIN) │
│ + payment_terms_id: UUID <<FK>>      │
│ + salesperson_id: UUID <<FK>>        │
│ + entered_by: UUID <<FK>>            │
│ + location_id: UUID <<FK>>           │
│ + priority: ENUM(STANDARD,RUSH,HOT)  │
│ + status: ENUM(DRAFT,PENDING,        │
│           CONFIRMED,PROCESSING,      │
│           COMPLETE,CANCELLED)        │
│ + subtotal: DECIMAL(14,2)            │
│ + discount_total: DECIMAL(14,2)      │
│ + freight_charge: DECIMAL(14,2)      │
│ + tax_amount: DECIMAL(14,2)          │
│ + total: DECIMAL(14,2)               │
│ + special_instructions: TEXT         │
│ + internal_notes: TEXT               │
│ + source_quote_id: UUID <<FK>>       │
│ + created_at: TIMESTAMPTZ            │
│ + updated_at: TIMESTAMPTZ            │
├──────────────────────────────────────┤
│ + getLines(): SalesOrderLine[]       │
│ + getShipments(): Shipment[]         │
│ + getWorkOrders(): WorkOrder[]       │
│ + calculateTotals(): void            │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│          SalesOrderLine              │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + order_id: UUID <<FK>>              │
│ + line_number: INTEGER               │
│ + product_id: UUID <<FK>>            │
│ + description: VARCHAR(200)          │
│ + quantity_ordered: DECIMAL(12,4)    │
│ + quantity_shipped: DECIMAL(12,4)    │
│ + quantity_backordered: DECIMAL(12,4)│
│ + quantity_uom_id: UUID <<FK>>       │
│ + pieces: INTEGER                    │
│ + weight_lbs: DECIMAL(12,4)          │
│ + unit_price: DECIMAL(12,4)          │
│ + price_uom_id: UUID <<FK>>          │
│ + discount_pct: DECIMAL(5,2)         │
│ + extended_price: DECIMAL(14,2)      │
│ + processing_charge: DECIMAL(12,2)   │
│ + line_total: DECIMAL(14,2)          │
│ + processing_type: ENUM(NONE,CUT,    │
│                    SLIT,SHEAR,SAW,   │
│                    PLASMA,LASER,     │
│                    BEND,DRILL)       │
│ + processing_specs: JSONB            │
│ + requested_date: DATE               │
│ + promise_date: DATE                 │
│ + status: ENUM(OPEN,ALLOCATED,       │
│           PROCESSING,SHIPPED,        │
│           COMPLETE,CANCELLED)        │
│ + source_quote_line_id: UUID <<FK>>  │
└──────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                           WORK ORDERS & PRODUCTION                               │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│            WorkOrder                 │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + tenant_id: UUID <<FK>>             │
│ + work_order_number: VARCHAR(20)     │
│     <<UK/tenant>>                    │
│ + order_id: UUID <<FK>>              │
│ + order_line_id: UUID <<FK>>         │
│ + location_id: UUID <<FK>>           │
│ + work_order_type: ENUM(PROCESSING,  │
│                    FABRICATION,      │
│                    ASSEMBLY,REWORK)  │
│ + priority: ENUM(STANDARD,RUSH,      │
│             HOT,EMERGENCY)           │
│ + status: ENUM(DRAFT,RELEASED,       │
│           QUEUED,IN_PROGRESS,        │
│           QA_HOLD,COMPLETE,          │
│           CANCELLED)                 │
│ + scheduled_start: TIMESTAMPTZ       │
│ + scheduled_end: TIMESTAMPTZ         │
│ + actual_start: TIMESTAMPTZ          │
│ + actual_end: TIMESTAMPTZ            │
│ + due_date: DATE                     │
│ + special_instructions: TEXT         │
│ + created_by: UUID <<FK>>            │
│ + created_at: TIMESTAMPTZ            │
│ + updated_at: TIMESTAMPTZ            │
├──────────────────────────────────────┤
│ + getOperations(): WorkOrderOp[]     │
│ + getMaterials(): WorkOrderMaterial[]│
│ + getOutput(): WorkOrderOutput[]     │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│          WorkOrderOperation          │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + work_order_id: UUID <<FK>>         │
│ + sequence: INTEGER                  │
│ + operation_type: ENUM(SHEAR,SLIT,   │
│                   LEVEL,SAW,PLASMA,  │
│                   LASER,BRAKE,ROLL,  │
│                   DRILL,PUNCH,WELD,  │
│                   PACKAGE,INSPECT)   │
│ + work_center_id: UUID <<FK>>        │
│ + description: VARCHAR(200)          │
│ + setup_time_min: INTEGER            │
│ + run_time_min: INTEGER              │
│ + pieces_per_hour: DECIMAL(10,2)     │
│ + status: ENUM(PENDING,QUEUED,       │
│           IN_PROGRESS,COMPLETE,      │
│           SKIPPED)                   │
│ + started_at: TIMESTAMPTZ            │
│ + completed_at: TIMESTAMPTZ          │
│ + operator_id: UUID <<FK>>           │
│ + actual_setup_min: INTEGER          │
│ + actual_run_min: INTEGER            │
│ + pieces_completed: INTEGER          │
│ + pieces_scrapped: INTEGER           │
│ + scrap_reason: VARCHAR(100)         │
│ + qa_required: BOOLEAN               │
│ + qa_passed: BOOLEAN                 │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│         WorkOrderMaterial            │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + work_order_id: UUID <<FK>>         │
│ + line_number: INTEGER               │
│ + inventory_item_id: UUID <<FK>>     │
│ + product_id: UUID <<FK>>            │
│ + quantity_required: DECIMAL(12,4)   │
│ + quantity_issued: DECIMAL(12,4)     │
│ + quantity_consumed: DECIMAL(12,4)   │
│ + quantity_uom_id: UUID <<FK>>       │
│ + weight_lbs: DECIMAL(12,4)          │
│ + allocation_id: UUID <<FK>>         │
│ + issued_by: UUID <<FK>>             │
│ + issued_at: TIMESTAMPTZ             │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│          WorkOrderOutput             │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + work_order_id: UUID <<FK>>         │
│ + operation_id: UUID <<FK>>          │
│ + output_type: ENUM(FINISHED,        │
│                REMNANT,SCRAP)        │
│ + product_id: UUID <<FK>>            │
│ + quantity: DECIMAL(12,4)            │
│ + quantity_uom_id: UUID <<FK>>       │
│ + pieces: INTEGER                    │
│ + weight_lbs: DECIMAL(12,4)          │
│ + length_in: DECIMAL(10,4)           │
│ + width_in: DECIMAL(10,4)            │
│ + inventory_item_id: UUID <<FK>>     │
│ + recorded_by: UUID <<FK>>           │
│ + recorded_at: TIMESTAMPTZ           │
└──────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SHIPPING & LOGISTICS                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│            Shipment                  │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + tenant_id: UUID <<FK>>             │
│ + shipment_number: VARCHAR(20)       │
│     <<UK/tenant>>                    │
│ + order_id: UUID <<FK>>              │
│ + location_id: UUID <<FK>>           │
│ + ship_to_id: UUID <<FK>>            │
│ + ship_date: DATE                    │
│ + ship_via: ENUM(OUR_TRUCK,CARRIER,  │
│             WILL_CALL,CUSTOMER_PU)   │
│ + carrier_id: UUID <<FK>>            │
│ + driver_id: UUID <<FK>>             │
│ + vehicle_id: UUID <<FK>>            │
│ + pro_number: VARCHAR(50)            │
│ + bol_number: VARCHAR(50)            │
│ + freight_terms: ENUM(PREPAID,       │
│                  COLLECT,FOB_ORIGIN) │
│ + freight_charge: DECIMAL(12,2)      │
│ + total_weight: DECIMAL(12,2)        │
│ + total_pieces: INTEGER              │
│ + status: ENUM(PLANNED,PICKING,      │
│           STAGING,LOADING,SHIPPED,   │
│           IN_TRANSIT,DELIVERED,      │
│           EXCEPTION)                 │
│ + shipped_at: TIMESTAMPTZ            │
│ + delivered_at: TIMESTAMPTZ          │
│ + pod_signature: TEXT                │
│ + pod_signer_name: VARCHAR(100)      │
│ + created_at: TIMESTAMPTZ            │
│ + updated_at: TIMESTAMPTZ            │
├──────────────────────────────────────┤
│ + getLines(): ShipmentLine[]         │
│ + getDocuments(): Document[]         │
│ + getTracking(): TrackingEvent[]     │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│          ShipmentLine                │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + shipment_id: UUID <<FK>>           │
│ + order_line_id: UUID <<FK>>         │
│ + inventory_item_id: UUID <<FK>>     │
│ + product_id: UUID <<FK>>            │
│ + quantity_shipped: DECIMAL(12,4)    │
│ + quantity_uom_id: UUID <<FK>>       │
│ + pieces: INTEGER                    │
│ + weight_lbs: DECIMAL(12,4)          │
│ + bundle_tag: VARCHAR(50)            │
│ + heat_number: VARCHAR(50)           │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│             Carrier                  │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + tenant_id: UUID <<FK>>             │
│ + code: VARCHAR(20) <<UK/tenant>>    │
│ + name: VARCHAR(100)                 │
│ + carrier_type: ENUM(LTL,TL,         │
│                 PARCEL,FLATBED,      │
│                 INTERNAL)            │
│ + scac_code: VARCHAR(4)              │
│ + dot_number: VARCHAR(20)            │
│ + mc_number: VARCHAR(20)             │
│ + contact_name: VARCHAR(100)         │
│ + contact_phone: VARCHAR(20)         │
│ + contact_email: VARCHAR(100)        │
│ + tracking_url_template: VARCHAR(500)│
│ + api_integration: JSONB             │
│ + is_active: BOOLEAN                 │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│            Vehicle                   │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + tenant_id: UUID <<FK>>             │
│ + location_id: UUID <<FK>>           │
│ + vehicle_number: VARCHAR(20)        │
│     <<UK/tenant>>                    │
│ + type: ENUM(FLATBED,BOX,STAKE,      │
│         TRAILER,FORKLIFT)            │
│ + license_plate: VARCHAR(20)         │
│ + max_weight_lbs: DECIMAL(10,2)      │
│ + max_length_ft: DECIMAL(6,2)        │
│ + is_active: BOOLEAN                 │
└──────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                           USER & ACCESS                                          │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│              User                    │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + tenant_id: UUID <<FK>>             │
│ + email: VARCHAR(100) <<UK>>         │
│ + password_hash: VARCHAR(255)        │
│ + first_name: VARCHAR(50)            │
│ + last_name: VARCHAR(50)             │
│ + employee_number: VARCHAR(20)       │
│ + role_id: UUID <<FK>>               │
│ + home_location_id: UUID <<FK>>      │
│ + department: VARCHAR(50)            │
│ + job_title: VARCHAR(100)            │
│ + phone: VARCHAR(20)                 │
│ + is_active: BOOLEAN                 │
│ + last_login: TIMESTAMPTZ            │
│ + preferences: JSONB                 │
│ + created_at: TIMESTAMPTZ            │
│ + updated_at: TIMESTAMPTZ            │
├──────────────────────────────────────┤
│ + hasPermission(perm): Boolean       │
│ + getLocations(): Location[]         │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│              Role                    │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + tenant_id: UUID <<FK>>             │
│ + code: VARCHAR(50) <<UK/tenant>>    │
│ + name: VARCHAR(100)                 │
│ + description: TEXT                  │
│ + permissions: JSONB                 │
│ + is_system: BOOLEAN                 │
│ + created_at: TIMESTAMPTZ            │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│          UserLocation                │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + user_id: UUID <<FK>>               │
│ + location_id: UUID <<FK>>           │
│ + access_level: ENUM(VIEW,OPERATE,   │
│                 MANAGE,ADMIN)        │
│ + is_primary: BOOLEAN                │
└──────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SUPPORTING ENTITIES                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│             Address                  │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + address_line_1: VARCHAR(100)       │
│ + address_line_2: VARCHAR(100)       │
│ + city: VARCHAR(100)                 │
│ + state: VARCHAR(2)                  │
│ + postal_code: VARCHAR(20)           │
│ + country: VARCHAR(2)                │
│ + latitude: DECIMAL(10,7)            │
│ + longitude: DECIMAL(10,7)           │
│ + validated: BOOLEAN                 │
│ + validation_source: VARCHAR(50)     │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│         UnitOfMeasure                │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + code: VARCHAR(10) <<UK>>           │
│ + name: VARCHAR(50)                  │
│ + category: ENUM(WEIGHT,LENGTH,      │
│             AREA,VOLUME,EACH)        │
│ + base_uom_id: UUID <<FK>>           │
│ + conversion_factor: DECIMAL(18,8)   │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│            Document                  │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + tenant_id: UUID <<FK>>             │
│ + document_type: ENUM(MTR,COC,BOL,   │
│                  PACKING_LIST,POD,   │
│                  INVOICE,QUOTE,PO,   │
│                  DRAWING,OTHER)      │
│ + document_number: VARCHAR(50)       │
│ + reference_type: VARCHAR(50)        │
│ + reference_id: UUID                 │
│ + file_name: VARCHAR(255)            │
│ + file_path: VARCHAR(500)            │
│ + file_size: INTEGER                 │
│ + mime_type: VARCHAR(100)            │
│ + created_by: UUID <<FK>>            │
│ + created_at: TIMESTAMPTZ            │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│          PaymentTerms                │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + tenant_id: UUID <<FK>>             │
│ + code: VARCHAR(20) <<UK/tenant>>    │
│ + name: VARCHAR(100)                 │
│ + net_days: INTEGER                  │
│ + discount_days: INTEGER             │
│ + discount_pct: DECIMAL(5,2)         │
│ + is_prepay: BOOLEAN                 │
│ + is_cod: BOOLEAN                    │
│ + is_active: BOOLEAN                 │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│            <<entity>>                │
│           AuditLog                   │
├──────────────────────────────────────┤
│ + id: UUID <<PK>>                    │
│ + tenant_id: UUID <<FK>>             │
│ + entity_type: VARCHAR(50)           │
│ + entity_id: UUID                    │
│ + action: ENUM(CREATE,UPDATE,        │
│           DELETE,VIEW,EXPORT)        │
│ + changed_fields: JSONB              │
│ + old_values: JSONB                  │
│ + new_values: JSONB                  │
│ + user_id: UUID <<FK>>               │
│ + ip_address: VARCHAR(45)            │
│ + user_agent: VARCHAR(255)           │
│ + created_at: TIMESTAMPTZ            │
└──────────────────────────────────────┘
```

---

## 2. Relationships — Pairing Matrix

```
ENTITY RELATIONSHIP MATRIX
==========================

Legend:
  1:1  = One-to-One
  1:N  = One-to-Many
  N:1  = Many-to-One (reverse of 1:N)
  M:N  = Many-to-Many
  ---  = No direct relationship
  (O)  = Optional
  (R)  = Required

                          Ten Loc Zon Bin WC  Prd PDm MT  Grd Frm PPr Inv Hea All ITx Cus CDv ShT Con SO  SOL WO  WOO WOM WOu Shp SLn Car Veh Usr Rol ULc Adr UoM Doc PTm

Tenant                     -  1:N 1:N 1:N 1:N 1:N --- 1:N 1:N --- --- 1:N 1:N --- 1:N 1:N --- --- --- 1:N --- 1:N --- --- --- 1:N --- 1:N 1:N 1:N 1:N --- --- --- --- 1:N
Location                  N:1  -  1:N 1:N 1:N --- --- --- --- --- --- 1:N --- --- 1:N --- --- --- --- 1:N --- 1:N --- --- --- 1:N --- --- 1:N 1:N --- 1:N 1:1 --- --- ---
Zone                      N:1 N:1  -  1:N --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
BinLocation               N:1 N:1 N:1  -  --- --- --- --- --- --- --- 1:1 --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
WorkCenter                N:1 N:1 --- ---  -  --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- 1:N 1:N --- --- --- --- --- --- --- --- --- --- --- --- ---
Product                   N:1 --- --- --- ---  -  1:1 N:1 N:1 N:1 1:N 1:N --- --- --- --- --- --- --- --- 1:N --- --- 1:N 1:N --- 1:N --- --- --- --- --- --- N:1 --- ---
ProductDimension          --- --- --- --- --- 1:1  -  --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
MaterialType              N:1 --- --- --- --- 1:N ---  -  1:N --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
Grade                     N:1 --- --- --- --- 1:N --- N:1  -  --- --- --- 1:N --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
Form                      --- --- --- --- --- 1:N --- --- ---  -  --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
ProductPrice              --- --- --- --- --- N:1 --- --- --- ---  -  --- --- --- --- N:1 --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- N:1 --- ---
InventoryItem             N:1 N:1 --- 1:1 --- N:1 --- --- --- --- --- -  N:1 1:N 1:N --- --- --- --- --- 1:N --- --- 1:N --- --- 1:N --- --- --- --- --- N:1 N:1 --- ---
Heat                      N:1 --- --- --- --- --- --- --- N:1 --- --- 1:N  -  --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- 1:1 ---
Allocation                --- --- --- --- --- --- --- --- --- --- --- N:1 ---  -  --- --- --- --- --- --- N:1 N:1 --- --- --- --- --- --- --- --- --- --- --- --- --- ---
InventoryTransaction      N:1 N:1 --- N:1 --- --- --- --- --- --- --- N:1 --- ---  -  --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
Customer                  N:1 --- --- --- --- --- --- --- --- --- 1:N --- --- --- ---  -  1:N 1:N 1:N 1:N --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
CustomerDivision          --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- N:1  -  1:N 1:N --- --- --- --- --- --- --- --- --- --- --- --- --- N:1 --- --- ---
ShipTo                    --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- N:1 N:1  -  --- --- --- --- --- --- --- 1:N --- --- --- --- --- --- N:1 --- --- ---
Contact                   --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- N:1 N:1 ---  -  --- --- --- --- --- --- --- --- --- --- N:1 --- --- --- --- --- ---
SalesOrder                N:1 N:1 --- --- --- --- --- --- --- --- --- --- --- --- --- N:1 N:1 N:1 ---  -  1:N 1:N --- --- --- 1:N --- N:1 --- N:1 --- --- N:1 N:1 --- ---
SalesOrderLine            --- --- --- --- --- N:1 --- --- --- --- --- 1:N --- N:1 --- --- --- --- --- N:1  -  1:N --- --- --- --- 1:N --- --- --- --- --- --- N:1 --- ---
WorkOrder                 N:1 N:1 --- --- 1:N --- --- --- --- --- --- --- --- N:1 --- --- --- --- --- N:1 N:1  -  1:N 1:N 1:N --- --- --- --- N:1 --- --- --- --- --- ---
WorkOrderOperation        --- --- --- --- N:1 --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- N:1  -  --- 1:N --- --- --- --- N:1 --- --- --- --- --- ---
WorkOrderMaterial         --- --- --- --- --- N:1 --- --- --- --- --- N:1 --- N:1 --- --- --- --- --- --- --- N:1 ---  -  --- --- --- --- --- N:1 --- --- --- N:1 --- ---
WorkOrderOutput           --- --- --- --- --- N:1 --- --- --- --- --- 1:1 --- --- --- --- --- --- --- --- --- N:1 N:1 ---  -  --- --- --- --- N:1 --- --- --- N:1 --- ---
Shipment                  N:1 N:1 --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- N:1 --- N:1 --- --- --- --- ---  -  1:N N:1 N:1 --- --- --- --- --- --- ---
ShipmentLine              --- --- --- --- --- N:1 --- --- --- --- --- N:1 --- --- --- --- --- --- --- --- N:1 --- --- --- --- N:1  -  --- --- --- --- --- --- N:1 --- ---
Carrier                   N:1 --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- 1:N --- --- --- --- --- 1:N ---  -  --- --- --- --- --- --- --- ---
Vehicle                   N:1 N:1 --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- 1:N --- ---  -  --- --- --- --- --- --- ---
User                      N:1 N:1 --- --- --- --- --- --- --- --- --- --- --- --- 1:N 1:N --- --- 1:N 1:N --- 1:N 1:N 1:N 1:N --- --- --- ---  -  N:1 1:N --- --- 1:N ---
Role                      N:1 --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- 1:N  -  --- --- --- --- ---
UserLocation              --- N:1 --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- N:1 ---  -  --- --- --- ---
Address                   --- 1:1 --- --- --- --- --- --- --- --- --- --- --- --- --- --- N:1 N:1 --- N:1 --- --- --- --- --- --- --- --- --- --- --- ---  -  --- --- ---
UnitOfMeasure             --- --- --- --- --- 1:N --- --- --- --- N:1 N:1 --- --- --- --- --- --- --- --- N:1 --- --- N:1 N:1 --- N:1 --- --- --- --- --- ---  -  --- ---
Document                  N:1 --- --- --- --- --- --- --- --- --- --- --- 1:1 --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---  -  ---
PaymentTerms              N:1 --- --- --- --- --- --- --- --- --- --- --- --- --- --- N:1 N:1 --- --- N:1 --- --- --- --- --- --- --- --- --- --- --- --- --- ---  -
```

### Key Relationships Detail

```json
{
  "relationships": [
    {
      "parent": "Tenant",
      "child": "Location",
      "type": "1:N",
      "required": true,
      "cascade_delete": false,
      "description": "Tenant has multiple physical locations"
    },
    {
      "parent": "Tenant",
      "child": "Customer",
      "type": "1:N",
      "required": true,
      "cascade_delete": false,
      "description": "Tenant has customer accounts"
    },
    {
      "parent": "Location",
      "child": "Zone",
      "type": "1:N",
      "required": true,
      "cascade_delete": true,
      "description": "Location subdivided into zones"
    },
    {
      "parent": "Zone",
      "child": "BinLocation",
      "type": "1:N",
      "required": true,
      "cascade_delete": true,
      "description": "Zone contains bin locations"
    },
    {
      "parent": "Location",
      "child": "WorkCenter",
      "type": "1:N",
      "required": true,
      "cascade_delete": false,
      "description": "Location has production work centers"
    },
    {
      "parent": "Location",
      "child": "InventoryItem",
      "type": "1:N",
      "required": true,
      "cascade_delete": false,
      "description": "Inventory stored at location"
    },
    {
      "parent": "Product",
      "child": "InventoryItem",
      "type": "1:N",
      "required": true,
      "cascade_delete": false,
      "description": "Product has inventory instances"
    },
    {
      "parent": "Product",
      "child": "ProductDimension",
      "type": "1:1",
      "required": false,
      "cascade_delete": true,
      "description": "Product has dimensional specs"
    },
    {
      "parent": "Heat",
      "child": "InventoryItem",
      "type": "1:N",
      "required": false,
      "cascade_delete": false,
      "description": "Heat/lot tracks multiple inventory items"
    },
    {
      "parent": "Customer",
      "child": "CustomerDivision",
      "type": "1:N",
      "required": false,
      "cascade_delete": true,
      "description": "Customer may have multiple divisions"
    },
    {
      "parent": "Customer",
      "child": "ShipTo",
      "type": "1:N",
      "required": true,
      "cascade_delete": false,
      "description": "Customer has shipping addresses"
    },
    {
      "parent": "Customer",
      "child": "SalesOrder",
      "type": "1:N",
      "required": true,
      "cascade_delete": false,
      "description": "Customer places orders"
    },
    {
      "parent": "SalesOrder",
      "child": "SalesOrderLine",
      "type": "1:N",
      "required": true,
      "cascade_delete": true,
      "description": "Order contains line items"
    },
    {
      "parent": "SalesOrderLine",
      "child": "WorkOrder",
      "type": "1:N",
      "required": false,
      "cascade_delete": false,
      "description": "Order line may generate work orders"
    },
    {
      "parent": "WorkOrder",
      "child": "WorkOrderOperation",
      "type": "1:N",
      "required": true,
      "cascade_delete": true,
      "description": "Work order has operation routing"
    },
    {
      "parent": "WorkOrder",
      "child": "WorkOrderMaterial",
      "type": "1:N",
      "required": true,
      "cascade_delete": true,
      "description": "Work order consumes materials"
    },
    {
      "parent": "WorkOrder",
      "child": "WorkOrderOutput",
      "type": "1:N",
      "required": false,
      "cascade_delete": true,
      "description": "Work order produces output"
    },
    {
      "parent": "SalesOrder",
      "child": "Shipment",
      "type": "1:N",
      "required": false,
      "cascade_delete": false,
      "description": "Order fulfilled by shipments"
    },
    {
      "parent": "Shipment",
      "child": "ShipmentLine",
      "type": "1:N",
      "required": true,
      "cascade_delete": true,
      "description": "Shipment contains line items"
    },
    {
      "parent": "InventoryItem",
      "child": "Allocation",
      "type": "1:N",
      "required": false,
      "cascade_delete": true,
      "description": "Inventory can be allocated"
    },
    {
      "parent": "InventoryItem",
      "child": "InventoryTransaction",
      "type": "1:N",
      "required": false,
      "cascade_delete": false,
      "description": "Inventory has transaction history"
    },
    {
      "parent": "User",
      "child": "Role",
      "type": "N:1",
      "required": true,
      "cascade_delete": false,
      "description": "User has assigned role"
    },
    {
      "parent": "User",
      "child": "UserLocation",
      "type": "1:N",
      "required": false,
      "cascade_delete": true,
      "description": "User can access multiple locations"
    }
  ]
}
```

---

## 3. Ownership Rules — List

```yaml
ownership_rules:
  tenant_isolation:
    - rule_id: OWN-001
      name: "Strict Tenant Isolation"
      description: "All tenant-scoped entities must include tenant_id and filter all queries by tenant"
      applies_to:
        - Location
        - Customer
        - Product
        - InventoryItem
        - SalesOrder
        - WorkOrder
        - Shipment
        - User
        - Heat
        - Carrier
        - Vehicle
        - Document
        - AuditLog
      enforcement: "Row-Level Security (RLS) on database"
      exception_handling: "Cross-tenant queries only via system admin with audit logging"

    - rule_id: OWN-002
      name: "Tenant-Scoped Unique Constraints"
      description: "Business keys unique within tenant, not globally"
      examples:
        - "customer_number unique per tenant"
        - "order_number unique per tenant"
        - "work_order_number unique per tenant"
        - "sku unique per tenant"
        - "tag_number unique per tenant"
      implementation: "Composite unique indexes on (tenant_id, business_key)"

  location_ownership:
    - rule_id: OWN-010
      name: "Inventory Location Binding"
      description: "Inventory items belong to exactly one location at any time"
      entity: InventoryItem
      owner_field: location_id
      rules:
        - "Cannot be null"
        - "Transfer requires explicit transaction"
        - "History maintained via InventoryTransaction"

    - rule_id: OWN-011
      name: "Work Center Location Binding"
      description: "Work centers fixed to a location"
      entity: WorkCenter
      owner_field: location_id
      rules:
        - "Cannot transfer work centers between locations"
        - "Work orders scheduled to work centers at their location"

    - rule_id: OWN-012
      name: "User Home Location"
      description: "Users have primary location with optional access to others"
      entity: User
      owner_field: home_location_id
      rules:
        - "Primary location required"
        - "Additional locations via UserLocation junction"
        - "Access level controlled per location"

    - rule_id: OWN-013
      name: "Shipment Origin Location"
      description: "Shipments originate from a specific location"
      entity: Shipment
      owner_field: location_id
      rules:
        - "Location determines available inventory"
        - "Location determines carrier options"
        - "Location determines document templates"

  customer_ownership:
    - rule_id: OWN-020
      name: "Division Hierarchy"
      description: "Customer divisions owned by parent customer"
      entity: CustomerDivision
      owner_field: customer_id
      rules:
        - "Divisions cannot exist without parent customer"
        - "Billing settings cascade from customer if not overridden"
        - "Credit limit shared or allocated per division"

    - rule_id: OWN-021
      name: "Ship-To Ownership"
      description: "Ship-to addresses owned by customer, optionally division"
      entity: ShipTo
      owner_fields: [customer_id, division_id]
      rules:
        - "customer_id required"
        - "division_id optional (shared across divisions if null)"
        - "Division-specific ship-tos only visible to that division"

    - rule_id: OWN-022
      name: "Contact Ownership"
      description: "Contacts belong to customer and optionally division"
      entity: Contact
      owner_fields: [customer_id, division_id]
      rules:
        - "customer_id required"
        - "division_id optional"
        - "Portal access links to specific contact"

    - rule_id: OWN-023
      name: "Order Ownership"
      description: "Orders owned by customer, placed for specific division"
      entity: SalesOrder
      owner_fields: [customer_id, division_id]
      rules:
        - "customer_id required"
        - "division_id optional but required for multi-division customers"
        - "Billing and shipping determined by division"

  order_ownership:
    - rule_id: OWN-030
      name: "Order Line Ownership"
      description: "Order lines owned by parent order"
      entity: SalesOrderLine
      owner_field: order_id
      rules:
        - "Lines cannot exist without order"
        - "Cascade delete with order cancellation"
        - "Line status rollup to order status"

    - rule_id: OWN-031
      name: "Work Order Ownership"
      description: "Work orders linked to order and order line"
      entity: WorkOrder
      owner_fields: [order_id, order_line_id]
      rules:
        - "Must reference source order"
        - "Can have multiple work orders per order line"
        - "Work order status affects order line status"

    - rule_id: OWN-032
      name: "Shipment Ownership"
      description: "Shipments owned by source order"
      entity: Shipment
      owner_field: order_id
      rules:
        - "Must reference source order"
        - "Multiple shipments per order allowed (partial ships)"
        - "Shipment completion updates order fulfillment"

  inventory_ownership:
    - rule_id: OWN-040
      name: "Allocation Ownership"
      description: "Allocations link inventory to demand"
      entity: Allocation
      owner_fields: [inventory_item_id, order_line_id, work_order_id]
      rules:
        - "Must reference inventory item"
        - "Must reference either order line or work order"
        - "Allocation quantity cannot exceed available quantity"
        - "Allocation expires if not consumed within timeout"

    - rule_id: OWN-041
      name: "Parent-Child Inventory"
      description: "Split inventory maintains parent reference"
      entity: InventoryItem
      owner_field: parent_inventory_id
      rules:
        - "Remnants reference parent coil/plate"
        - "Traceability maintained through parent chain"
        - "Original receiving record accessible via parent"

    - rule_id: OWN-042
      name: "Heat Ownership"
      description: "Heat records owned by tenant, linked to inventory"
      entity: Heat
      owner_field: tenant_id
      rules:
        - "Heat numbers unique per tenant"
        - "Multiple inventory items can share heat"
        - "MTR document linked to heat record"

  work_order_ownership:
    - rule_id: OWN-050
      name: "Operation Ownership"
      description: "Operations owned by parent work order"
      entity: WorkOrderOperation
      owner_field: work_order_id
      rules:
        - "Operations cannot exist without work order"
        - "Sequence determines execution order"
        - "Operation completion rolls up to work order"

    - rule_id: OWN-051
      name: "Material Ownership"
      description: "Materials linked to work order and inventory"
      entity: WorkOrderMaterial
      owner_fields: [work_order_id, inventory_item_id]
      rules:
        - "Must reference work order"
        - "Must reference allocated inventory"
        - "Consumption recorded against specific material line"

    - rule_id: OWN-052
      name: "Output Ownership"
      description: "Output produced by work order operations"
      entity: WorkOrderOutput
      owner_fields: [work_order_id, operation_id]
      rules:
        - "Must reference work order"
        - "Finished output creates new inventory item"
        - "Scrap output recorded but no inventory created"
        - "Remnant output creates new inventory with remnant flag"

  document_ownership:
    - rule_id: OWN-060
      name: "Document Reference"
      description: "Documents linked to source entities polymorphically"
      entity: Document
      owner_fields: [tenant_id, reference_type, reference_id]
      rules:
        - "reference_type identifies entity type"
        - "reference_id is the entity's primary key"
        - "Documents cascade with parent for some types"
        - "MTRs linked to heats, not deleted with shipments"

  access_ownership:
    - rule_id: OWN-070
      name: "Role Ownership"
      description: "Roles owned by tenant"
      entity: Role
      owner_field: tenant_id
      rules:
        - "System roles cannot be modified"
        - "Custom roles tenant-specific"
        - "Permissions encoded as JSON array"

    - rule_id: OWN-071
      name: "User-Location Access"
      description: "User access to locations explicitly granted"
      entity: UserLocation
      owner_fields: [user_id, location_id]
      rules:
        - "Users see only their permitted locations"
        - "Access level determines operations allowed"
        - "Primary location used for default assignments"
```

---

## 4. Division/Location Segmentation — Rules

```yaml
segmentation_rules:
  
  location_segmentation:
    inventory:
      - rule_id: SEG-LOC-001
        name: "Inventory Location Isolation"
        description: "Inventory queries filtered by user's permitted locations"
        implementation:
          - "Default filter: user.accessible_locations"
          - "Cross-location view requires explicit permission"
          - "Transfers create transactions in both locations"
        api_behavior:
          - "GET /inventory returns only accessible location inventory"
          - "Query param: ?location_id= filters single location"
          - "Query param: ?all_locations=true requires permission INVENTORY_VIEW_ALL"

      - rule_id: SEG-LOC-002
        name: "Available-to-Promise by Location"
        description: "ATP calculated per location"
        implementation:
          - "On-hand quantity at specific location"
          - "Less allocations for that location"
          - "Less in-transit out of location"
          - "Plus in-transit into location"

    orders:
      - rule_id: SEG-LOC-003
        name: "Order Location Assignment"
        description: "Orders fulfilled from assigned location"
        implementation:
          - "Order.location_id set at order entry"
          - "Based on customer default or explicit selection"
          - "Allocation sourced from order location"
          - "Transfer orders for cross-location fulfillment"

      - rule_id: SEG-LOC-004
        name: "Work Order Location Binding"
        description: "Work orders execute at single location"
        implementation:
          - "Work order inherits order location"
          - "Work center must be at same location"
          - "Cannot schedule across locations"

    shipping:
      - rule_id: SEG-LOC-005
        name: "Shipment Origin Location"
        description: "Shipments dispatched from single location"
        implementation:
          - "Shipment.location_id from order location"
          - "Inventory picked from that location"
          - "Shipping documents show origin location"

    users:
      - rule_id: SEG-LOC-006
        name: "User Location Access"
        description: "Users operate within permitted locations"
        implementation:
          - "Login defaults to home_location_id"
          - "Location switcher shows permitted locations"
          - "All operations scoped to current location context"
        access_levels:
          VIEW: "Read-only access to location data"
          OPERATE: "Perform transactions (pick, ship, receive)"
          MANAGE: "Modify configuration, approve transactions"
          ADMIN: "Full control including user assignment"

    reporting:
      - rule_id: SEG-LOC-007
        name: "Report Location Filtering"
        description: "Reports filter by user location access"
        implementation:
          - "Dashboard KPIs show current location by default"
          - "Consolidated view requires multi-location access"
          - "Export respects location filters"

  division_segmentation:
    orders:
      - rule_id: SEG-DIV-001
        name: "Order Division Assignment"
        description: "Orders placed for specific customer division"
        implementation:
          - "Division determines bill-to address"
          - "Division determines payment terms override"
          - "Division filters ship-to options"
          - "Multi-division customers must select division"

      - rule_id: SEG-DIV-002
        name: "Division Credit Tracking"
        description: "Credit tracked at customer or division level"
        implementation:
          - "customer.credit_allocation: SHARED or PER_DIVISION"
          - "SHARED: single credit limit for all divisions"
          - "PER_DIVISION: each division has allocated limit"
          - "Division AR balance contributes to customer balance"

    pricing:
      - rule_id: SEG-DIV-003
        name: "Division Pricing Rules"
        description: "Pricing can vary by division"
        implementation:
          - "Contract pricing can be customer-wide or division-specific"
          - "Division-level discount agreements"
          - "Price lookup checks division contracts first"

    portal_access:
      - rule_id: SEG-DIV-004
        name: "Customer Portal Division Scope"
        description: "Portal users see division-appropriate data"
        implementation:
          - "Portal user linked to specific divisions"
          - "Orders filtered by user's division access"
          - "ADMIN role sees all divisions"
          - "BUYER role sees assigned divisions"

    ship_to:
      - rule_id: SEG-DIV-005
        name: "Ship-To Division Filtering"
        description: "Ship-to addresses filtered by division"
        implementation:
          - "ship_to.division_id null = shared across all divisions"
          - "ship_to.division_id set = visible only to that division"
          - "Order entry filters ship-to by selected division"

    invoicing:
      - rule_id: SEG-DIV-006
        name: "Invoice Division Separation"
        description: "Invoices generated per division"
        implementation:
          - "Invoice bill-to from division billing address"
          - "Consolidation only within same division"
          - "AR aging tracked by division"

  cross_segmentation_rules:
    - rule_id: SEG-CROSS-001
      name: "Location-Division Independence"
      description: "Divisions and locations are orthogonal"
      implementation:
        - "Customer division does not restrict which location fulfills"
        - "Any location can ship to any division's ship-to"
        - "Allocation based on location inventory, not division"

    - rule_id: SEG-CROSS-002
      name: "Multi-Location Order"
      description: "Order can be fulfilled from multiple locations"
      implementation:
        - "Order has primary location"
        - "Lines can be sourced from other locations via transfer"
        - "Split shipments from different locations allowed"
        - "Freight calculated per origin location"

    - rule_id: SEG-CROSS-003
      name: "Report Aggregation"
      description: "Reports can aggregate across segments"
      implementation:
        - "Sales by division across all locations"
        - "Inventory by location for all customer divisions"
        - "Cross-segment reports require appropriate permissions"

  data_visibility_matrix:
    # Rows: User context, Columns: Data access
    visibility:
      single_location_user:
        own_location_inventory: FULL
        other_location_inventory: NONE
        own_location_orders: FULL
        other_location_orders: NONE
        all_customer_data: FULL

      multi_location_user:
        own_location_inventory: FULL
        other_permitted_inventory: FULL
        non_permitted_inventory: NONE
        own_location_orders: FULL
        other_permitted_orders: FULL
        non_permitted_orders: NONE

      regional_manager:
        regional_locations: FULL
        non_regional_locations: NONE
        regional_customers: FULL
        regional_reports: FULL

      corporate_user:
        all_locations: FULL
        all_customers: FULL
        consolidated_reports: FULL

      customer_portal_division:
        own_division_orders: FULL
        other_division_orders: NONE
        own_division_invoices: FULL
        own_division_ship_tos: FULL
        shared_ship_tos: FULL

      customer_portal_admin:
        all_division_orders: FULL
        all_division_invoices: FULL
        all_ship_tos: FULL
        user_management: FULL
```

---

## 5. Canonical IDs — Naming Convention

```yaml
canonical_ids:

  uuid_usage:
    description: "All primary keys use UUID v4"
    format: "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
    implementation: "Generated by database DEFAULT gen_random_uuid()"
    rationale:
      - "Globally unique across distributed systems"
      - "No sequential guessing for security"
      - "Safe for merge/replication scenarios"
      - "Partition-friendly"

  business_key_patterns:
    tenant_code:
      pattern: "[A-Z]{2,6}"
      examples: ["STEEL", "ABC", "METRO"]
      uniqueness: "Global"
      generation: "Manual at onboarding"
      description: "Short mnemonic for tenant identification"

    location_code:
      pattern: "{TENANT}-{CITY_ABBR}{SEQ}"
      examples: ["STEEL-CHI1", "STEEL-DAL2", "ABC-PHX1"]
      uniqueness: "Per tenant"
      generation: "Manual"
      description: "Human-readable location identifier"

    customer_number:
      pattern: "{PREFIX}{SEQ:6}"
      prefix_rules:
        "C": "Commercial customer"
        "G": "Government customer"
        "R": "Retail customer"
        "P": "Prospect (not yet customer)"
      examples: ["C001234", "G000056", "R012345"]
      uniqueness: "Per tenant"
      generation: "Auto-increment with prefix"
      legacy_support: "Import existing customer numbers"

    order_number:
      pattern: "SO-{YYYYMM}-{SEQ:5}"
      examples: ["SO-202601-00001", "SO-202601-12345"]
      uniqueness: "Per tenant"
      generation: "Auto per month, reset sequence optional"
      alternatives:
        simple: "SO-{SEQ:7}"
        location: "SO-{LOC}-{SEQ:5}"
      
    work_order_number:
      pattern: "WO-{YYYYMM}-{SEQ:5}"
      examples: ["WO-202601-00001"]
      uniqueness: "Per tenant"
      generation: "Auto per month"

    shipment_number:
      pattern: "SH-{YYYYMMDD}-{SEQ:4}"
      examples: ["SH-20260117-0001"]
      uniqueness: "Per tenant"
      generation: "Auto per day"

    quote_number:
      pattern: "QT-{YYYYMM}-{SEQ:5}"
      examples: ["QT-202601-00100"]
      uniqueness: "Per tenant"
      generation: "Auto per month"

    purchase_order_number:
      pattern: "PO-{YYYYMM}-{SEQ:5}"
      examples: ["PO-202601-00001"]
      uniqueness: "Per tenant"
      generation: "Auto per month"

    invoice_number:
      pattern: "INV-{YYYYMM}-{SEQ:6}"
      examples: ["INV-202601-000001"]
      uniqueness: "Per tenant"
      generation: "Auto per month"
      constraints: "Must be sequential for audit"

    tag_number:
      pattern: "{LOC}-{YYYYMMDD}-{SEQ:5}"
      examples: ["CHI1-20260117-00001"]
      uniqueness: "Per tenant"
      generation: "Auto per location per day"
      description: "Inventory item identifier for tracking"

    heat_number:
      pattern: "Mill-assigned, imported as-is"
      examples: ["A12345", "H98765-01", "123456789"]
      uniqueness: "Per tenant (may duplicate across tenants)"
      generation: "Imported from mill documentation"

    sku:
      pattern: "{MATERIAL}-{FORM}-{GRADE}-{DIMS}"
      examples: [
        "CS-SHT-A36-0.250x48x120",
        "SS-BAR-304-1.000RD",
        "AL-PLT-6061-0.500x48"
      ]
      uniqueness: "Per tenant"
      generation: "Manual or derived from product attributes"
      description: "Human-readable product identifier"

    bundle_tag:
      pattern: "B-{SHIPMENT}-{SEQ:3}"
      examples: ["B-SH-20260117-0001-001"]
      uniqueness: "Per shipment"
      generation: "Auto per shipment"

    rma_number:
      pattern: "RMA-{YYYYMM}-{SEQ:4}"
      examples: ["RMA-202601-0001"]
      uniqueness: "Per tenant"
      generation: "Auto per month"

  composite_identifiers:
    order_line:
      components: [order_id, line_number]
      display: "{order_number}-{line_number:03}"
      example: "SO-202601-00001-001"

    work_order_operation:
      components: [work_order_id, sequence]
      display: "{work_order_number}-OP{sequence:02}"
      example: "WO-202601-00001-OP01"

    bin_location:
      components: [zone_code, aisle, rack, level, position]
      display: "{zone}-{aisle}-{rack}-{level}-{position}"
      example: "RECV-A-01-1-01"

  external_identifiers:
    tracking_number:
      description: "Carrier-assigned tracking/PRO number"
      pattern: "Carrier-specific"
      stored_as: "VARCHAR(100)"

    mill_certificate_number:
      description: "Mill's certificate/MTR number"
      pattern: "Mill-specific"
      stored_as: "VARCHAR(50)"

    customer_po:
      description: "Customer's purchase order number"
      pattern: "Customer-specific"
      stored_as: "VARCHAR(50)"

    vendor_invoice:
      description: "Vendor's invoice number"
      pattern: "Vendor-specific"
      stored_as: "VARCHAR(50)"

  sequence_management:
    implementation: "PostgreSQL SEQUENCE objects"
    strategy:
      per_tenant: true
      per_period: "Optional (monthly reset)"
      gap_tolerance: "Gaps acceptable except invoices"
    
    sequences:
      - name: "customer_seq"
        tenant_scoped: true
        start: 1000
        increment: 1

      - name: "order_seq_monthly"
        tenant_scoped: true
        period: "month"
        start: 1
        increment: 1

      - name: "invoice_seq"
        tenant_scoped: true
        period: "none"
        start: 1
        increment: 1
        gapless: true

      - name: "tag_seq_daily"
        tenant_scoped: true
        location_scoped: true
        period: "day"
        start: 1
        increment: 1

  id_formatting_rules:
    padding:
      numeric_sequences: "Zero-pad to defined width"
      example: "00001 not 1"
    
    separators:
      primary: "-"
      secondary: "."
      never_use: ["_", " ", "/"]
    
    case:
      prefixes: "UPPERCASE"
      codes: "UPPERCASE"
      example: "SO-202601-00001"

    display_vs_storage:
      storage: "Raw sequence number"
      display: "Formatted with prefix/padding"
      api_response: "Formatted display value"

  barcode_formats:
    inventory_tag:
      format: "Code 128"
      content: "{tenant_code}:{tag_number}"
      example: "STEEL:CHI1-20260117-00001"

    bundle_tag:
      format: "Code 128"
      content: "{tenant_code}:{bundle_tag}"
      example: "STEEL:B-SH-20260117-0001-001"

    bin_location:
      format: "Code 128"
      content: "{location_code}:{bin_code}"
      example: "CHI1:RECV-A-01-1-01"

    work_order:
      format: "Code 128"
      content: "{tenant_code}:{work_order_number}"
      example: "STEEL:WO-202601-00001"

    product_sku:
      format: "Code 128"
      content: "{sku}"
      example: "CS-SHT-A36-0.250x48x120"

  qr_code_formats:
    inventory_full:
      content: |
        {
          "t": "{tenant_code}",
          "tag": "{tag_number}",
          "sku": "{sku}",
          "heat": "{heat_number}",
          "qty": {quantity},
          "loc": "{bin_location}"
        }
      use_case: "Full inventory lookup via mobile"

    shipment_tracking:
      content: "https://{domain}/track/{shipment_number}?token={access_token}"
      use_case: "Customer tracking link"
```

---

*Document generated for AI-build Phase 09: Data Model (Phase 1)*
