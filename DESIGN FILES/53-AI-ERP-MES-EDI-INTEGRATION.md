# 53 — AI ERP/MES/EDI Integration

> **Purpose:** Enterprise integration architecture for ERP, MES, and EDI systems including transaction sets, hooks, APIs, events, and mapping rules for AI-build.  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. EDI Documents

```yaml
edi_documents:

  # ═══════════════════════════════════════════════════════════════════
  # INBOUND EDI TRANSACTIONS (FROM TRADING PARTNERS)
  # ═══════════════════════════════════════════════════════════════════
  inbound_transactions:

    - transaction_set: "850"
      name: Purchase Order
      direction: INBOUND
      source: CUSTOMER
      description: "Customer purchase order"
      frequency: REAL_TIME
      
      segments:
        - segment: BEG
          elements:
            - BEG01: transaction_set_purpose (00=Original, 01=Cancel, 05=Replace)
            - BEG02: purchase_order_type (NE=New, RO=Rush, SA=Standalone)
            - BEG03: purchase_order_number
            - BEG05: purchase_order_date
            
        - segment: CUR
          elements:
            - CUR01: entity_identifier (BY=Buyer)
            - CUR02: currency_code (USD, CAD, EUR)
            
        - segment: REF
          loop: true
          elements:
            - REF01: reference_id_qualifier (CO=Customer Order, CT=Contract, PO=PO)
            - REF02: reference_identification
            
        - segment: DTM
          loop: true
          elements:
            - DTM01: date_qualifier (002=Delivery, 010=Requested Ship)
            - DTM02: date (YYYYMMDD)
            
        - segment: N1_LOOP
          elements:
            - N101: entity_identifier (ST=Ship To, BT=Bill To, BY=Buyer)
            - N102: name
            - N103: id_code_qualifier (91=Assigned by Seller, 92=Assigned by Buyer)
            - N104: identification_code
          sub_segments:
            - N3: address_lines
            - N4: city_state_zip
            
        - segment: PO1_LOOP
          loop: true
          elements:
            - PO101: line_item_number
            - PO102: quantity_ordered
            - PO103: unit_of_measure (LB=Pounds, EA=Each, CW=Hundred Weight)
            - PO104: unit_price
            - PO105: basis_of_unit_price (PE=Price per Each, PP=Price per Pound)
            - PO106: product_id_qualifier (BP=Buyer Part, VP=Vendor Part, UP=UPC)
            - PO107: product_id
          sub_segments:
            - PID: product_description
            - MEA: measurements (dimensions, weight)
            - DTM: line_item_dates
            - REF: line_item_references
            
        - segment: CTT
          elements:
            - CTT01: number_of_line_items
            - CTT02: hash_total
            
      mapping_to_steelwise:
        target_entity: Order
        field_mappings:
          - edi: BEG03 → order.customer_po_number
          - edi: BEG05 → order.order_date
          - edi: N1[ST].N102 → order.ship_to_name
          - edi: N1[ST].N4 → order.ship_to_address
          - edi: PO1.PO102 → order_line.quantity
          - edi: PO1.PO104 → order_line.unit_price
          - edi: PO1.PO107 → order_line.customer_part_number
          - edi: DTM[002] → order.requested_delivery_date

    - transaction_set: "830"
      name: Planning Schedule with Release Capability
      direction: INBOUND
      source: CUSTOMER
      description: "Forecast and firm releases"
      frequency: WEEKLY
      
      segments:
        - segment: BFR
          elements:
            - BFR01: transaction_set_purpose
            - BFR02: forecast_qualifier (A=Actual, F=Forecast)
            - BFR05: horizon_start_date
            - BFR06: horizon_end_date
            
        - segment: LIN_LOOP
          loop: true
          elements:
            - LIN02: product_id_qualifier
            - LIN03: product_id
          sub_segments:
            - FST_LOOP:
                - FST01: quantity
                - FST02: forecast_qualifier (C=Firm, D=Planning)
                - FST03: timing_qualifier (D=Week, M=Month)
                - FST05: date
                
      mapping_to_steelwise:
        target_entity: Forecast
        creates:
          - forecast_header
          - forecast_lines
        field_mappings:
          - edi: LIN03 → forecast_line.product_id (via crossref)
          - edi: FST01 → forecast_line.quantity
          - edi: FST02 → forecast_line.forecast_type
          - edi: FST05 → forecast_line.period_date

    - transaction_set: "862"
      name: Shipping Schedule
      direction: INBOUND
      source: CUSTOMER
      description: "Customer shipping requirements"
      frequency: DAILY
      
      segments:
        - segment: BSS
          elements:
            - BSS01: transaction_set_purpose
            - BSS02: reference_id
            - BSS03: date
            
        - segment: LIN_LOOP
          loop: true
          sub_segments:
            - SHP_LOOP:
                - SHP01: quantity_qualifier
                - SHP02: quantity
                - SHP03: date_qualifier
                - SHP04: date
                
      mapping_to_steelwise:
        target_entity: ShippingSchedule
        action: CREATE_OR_UPDATE_RELEASES

    - transaction_set: "860"
      name: Purchase Order Change Request
      direction: INBOUND
      source: CUSTOMER
      description: "Changes to existing PO"
      frequency: REAL_TIME
      
      change_types:
        - CA: Cancel
        - CT: Change
        - AI: Add Item
        - DI: Delete Item
        - QC: Quantity Change
        - PC: Price Change
        - RC: Reschedule
        
      mapping_to_steelwise:
        target_entity: Order
        action: UPDATE_EXISTING
        validation:
          - order_exists
          - order_not_shipped
          - changes_within_policy

  # ═══════════════════════════════════════════════════════════════════
  # OUTBOUND EDI TRANSACTIONS (TO TRADING PARTNERS)
  # ═══════════════════════════════════════════════════════════════════
  outbound_transactions:

    - transaction_set: "855"
      name: Purchase Order Acknowledgment
      direction: OUTBOUND
      destination: CUSTOMER
      description: "Confirm or reject customer PO"
      trigger: ORDER_RECEIVED
      
      segments:
        - segment: BAK
          elements:
            - BAK01: transaction_purpose (AC=Acknowledge, AD=Accept with Changes, RD=Reject)
            - BAK02: acknowledgment_type
            - BAK03: purchase_order_number
            - BAK04: date
            - BAK08: request_reference_number
            
        - segment: PO1_LOOP
          loop: true
          elements:
            - PO101: line_item_number
            - PO102: quantity_ordered
            - PO103: unit_of_measure
            - PO104: unit_price
          sub_segments:
            - ACK:
                - ACK01: line_item_status (AC=Accepted, BP=Backorder, DR=Date Rejected)
                - ACK02: quantity
                - ACK04: date
                
      mapping_from_steelwise:
        source_entity: Order
        field_mappings:
          - order.customer_po_number → BAK03
          - order.order_date → BAK04
          - order.status → BAK01 (via status_to_edi_code)
          - order_line.quantity → PO102
          - order_line.confirmed_date → ACK04

    - transaction_set: "856"
      name: Advance Ship Notice / Manifest
      direction: OUTBOUND
      destination: CUSTOMER
      description: "Shipment notification"
      trigger: SHIPMENT_SHIPPED
      
      segments:
        - segment: BSN
          elements:
            - BSN01: transaction_set_purpose (00=Original)
            - BSN02: shipment_identification
            - BSN03: date
            - BSN04: time
            - BSN05: hierarchical_structure (0001=Shipment/Order/Item)
            
        - segment: HL_LOOP
          hierarchical: true
          levels:
            - level: S (Shipment)
              segments:
                - TD1: carrier_details
                - TD5: routing
                - REF: references (BOL, PRO, SI)
                - DTM: dates
                - N1_LOOP: ship_from, ship_to
                
            - level: O (Order)
              segments:
                - PRF: purchase_order_reference
                - REF: order_references
                
            - level: I (Item)
              segments:
                - LIN: item_identification
                - SN1: item_detail (quantity, uom)
                - PO4: item_physical_details (weight)
                - MAN: marks_and_numbers (serial, heat, lot)
                - REF: item_references
                
      mapping_from_steelwise:
        source_entity: Shipment
        field_mappings:
          - shipment.shipment_number → BSN02
          - shipment.ship_date → BSN03
          - shipment.carrier → TD5
          - shipment.bol_number → REF[BM]
          - shipment.pro_number → REF[CN]
          - shipment_line.quantity → SN102
          - shipment_line.heat_number → MAN02
          - shipment_line.weight → PO402

    - transaction_set: "810"
      name: Invoice
      direction: OUTBOUND
      destination: CUSTOMER
      description: "Invoice for shipped goods"
      trigger: INVOICE_CREATED
      
      segments:
        - segment: BIG
          elements:
            - BIG01: invoice_date
            - BIG02: invoice_number
            - BIG03: purchase_order_date
            - BIG04: purchase_order_number
            
        - segment: NTE
          elements:
            - NTE02: payment_terms_description
            
        - segment: N1_LOOP
          elements:
            - N101: entity_id (ST, BT, RE=Remit To)
            - N102-N4: name_and_address
            
        - segment: IT1_LOOP
          loop: true
          elements:
            - IT101: line_item_number
            - IT102: quantity_invoiced
            - IT103: unit_of_measure
            - IT104: unit_price
            - IT106: product_id_qualifier
            - IT107: product_id
          sub_segments:
            - PID: description
            - REF: references
            - SAC: service_allowance_charge
            
        - segment: TDS
          elements:
            - TDS01: total_invoice_amount
            
        - segment: SAC
          loop: true
          elements:
            - SAC01: allowance_or_charge (A=Allowance, C=Charge)
            - SAC02: service_code
            - SAC05: amount
            
      mapping_from_steelwise:
        source_entity: Invoice
        field_mappings:
          - invoice.invoice_number → BIG02
          - invoice.invoice_date → BIG01
          - invoice.customer_po_number → BIG04
          - invoice_line.quantity → IT102
          - invoice_line.unit_price → IT104
          - invoice.total_amount → TDS01
          - invoice.freight_charges → SAC[C][420]
          - invoice.surcharges → SAC[C][XXX]

    - transaction_set: "997"
      name: Functional Acknowledgment
      direction: BOTH
      description: "Acknowledge receipt of EDI transaction"
      automatic: true
      
      segments:
        - segment: AK1
          elements:
            - AK101: functional_identifier_code
            - AK102: group_control_number
            
        - segment: AK2_LOOP
          loop: true
          elements:
            - AK201: transaction_set_identifier
            - AK202: transaction_set_control_number
          sub_segments:
            - AK5:
                - AK501: transaction_set_ack_code (A=Accepted, E=Accepted with Errors, R=Rejected)
                
        - segment: AK9
          elements:
            - AK901: functional_group_ack_code
            - AK902: transactions_included
            - AK903: transactions_received
            - AK904: transactions_accepted

  # ═══════════════════════════════════════════════════════════════════
  # SUPPLIER EDI TRANSACTIONS
  # ═══════════════════════════════════════════════════════════════════
  supplier_transactions:

    - transaction_set: "850"
      name: Purchase Order (Outbound to Supplier)
      direction: OUTBOUND
      destination: SUPPLIER
      trigger: PO_RELEASED
      
      mapping_from_steelwise:
        source_entity: PurchaseOrder
        includes:
          - po_header
          - po_lines
          - ship_to_address
          - special_instructions

    - transaction_set: "855"
      name: Purchase Order Acknowledgment (From Supplier)
      direction: INBOUND
      source: SUPPLIER
      
      mapping_to_steelwise:
        target_entity: PurchaseOrder
        updates:
          - supplier_confirmed
          - confirmed_ship_date
          - confirmed_quantities

    - transaction_set: "856"
      name: Advance Ship Notice (From Supplier)
      direction: INBOUND
      source: SUPPLIER
      
      mapping_to_steelwise:
        target_entity: InboundShipment
        creates:
          - receipt_expectation
          - pre_receiving_data
        includes:
          - heat_numbers
          - lot_numbers
          - certifications

    - transaction_set: "810"
      name: Invoice (From Supplier)
      direction: INBOUND
      source: SUPPLIER
      
      mapping_to_steelwise:
        target_entity: SupplierInvoice
        validation:
          - three_way_match (PO, Receipt, Invoice)
        workflow:
          - auto_approve_if_matched
          - queue_for_review_if_variance

  # ═══════════════════════════════════════════════════════════════════
  # EDI CONFIGURATION
  # ═══════════════════════════════════════════════════════════════════
  edi_configuration:

    trading_partner_setup:
      - partner_id: string
      - partner_name: string
      - isa_qualifier: "01 | 08 | 12 | 14 | ZZ"
      - isa_id: string
      - gs_id: string
      - transaction_sets_enabled: [string]
      - edi_version: "004010 | 005010"
      - communication:
          protocol: "AS2 | SFTP | VAN"
          as2_id: string
          sftp_host: string
          sftp_path: string
          van_provider: string
          van_mailbox: string
      - item_crossref_method: "BUYER_PART | UPC | VENDOR_PART"
      - unit_crossref_required: boolean
      - special_processing: [string]

    edi_processing_rules:
      inbound:
        - validate_envelope: true
        - validate_segments: true
        - generate_997: true
        - duplicate_check: true
        - duplicate_window_days: 30
        - auto_process_if_valid: true
        - error_queue: "EDI_ERRORS"
        
      outbound:
        - batch_window_minutes: 15
        - consolidate_per_partner: true
        - retry_on_failure: true
        - retry_attempts: 3
        - retry_interval_minutes: 30
        - archive_days: 2555 (7 years)
```

---

## 2. ERP Hooks

```yaml
erp_hooks:

  # ═══════════════════════════════════════════════════════════════════
  # MASTER DATA SYNC HOOKS
  # ═══════════════════════════════════════════════════════════════════
  master_data_hooks:

    - hook_id: ERP-MD-001
      name: customer_sync
      direction: BIDIRECTIONAL
      erp_entity: Customer Master
      steelwise_entity: Customer
      
      sync_triggers:
        from_erp:
          - customer_created
          - customer_updated
          - customer_status_changed
          - credit_limit_changed
        to_erp:
          - customer_created_in_steelwise
          - customer_contact_updated
          
      field_mappings:
        - erp: KUNNR → steelwise: erp_customer_id
        - erp: NAME1 → steelwise: customer_name
        - erp: STRAS → steelwise: address.street
        - erp: ORT01 → steelwise: address.city
        - erp: REGIO → steelwise: address.state
        - erp: PSTLZ → steelwise: address.postal_code
        - erp: LAND1 → steelwise: address.country
        - erp: KLIMK → steelwise: credit_limit
        - erp: CTLPC → steelwise: credit_status
        - erp: ZTERM → steelwise: payment_terms_id
        - erp: TAXKD → steelwise: tax_classification
        
      conflict_resolution:
        strategy: ERP_WINS_FOR_FINANCIAL
        financial_fields: [credit_limit, credit_status, payment_terms_id, tax_classification]
        operational_fields: STEELWISE_WINS
        
      validation:
        - customer_id_not_null
        - valid_country_code
        - valid_payment_terms

    - hook_id: ERP-MD-002
      name: product_sync
      direction: BIDIRECTIONAL
      erp_entity: Material Master
      steelwise_entity: Product
      
      sync_triggers:
        from_erp:
          - material_created
          - material_updated
          - pricing_changed
          - cost_updated
        to_erp:
          - product_created_in_steelwise
          - product_specification_updated
          
      field_mappings:
        - erp: MATNR → steelwise: erp_material_id
        - erp: MAKTX → steelwise: description
        - erp: MTART → steelwise: material_type
        - erp: MATKL → steelwise: material_group
        - erp: MEINS → steelwise: base_uom
        - erp: BRGEW → steelwise: gross_weight
        - erp: NTGEW → steelwise: net_weight
        - erp: GEWEI → steelwise: weight_uom
        - erp: STPRS → steelwise: standard_cost
        - erp: PEINH → steelwise: price_unit
        
      extensions:
        steelwise_only:
          - grade_specification
          - chemistry_requirements
          - mechanical_requirements
          - processing_capabilities
          - quality_requirements

    - hook_id: ERP-MD-003
      name: supplier_sync
      direction: BIDIRECTIONAL
      erp_entity: Vendor Master
      steelwise_entity: Supplier
      
      field_mappings:
        - erp: LIFNR → steelwise: erp_vendor_id
        - erp: NAME1 → steelwise: supplier_name
        - erp: ZTERM → steelwise: payment_terms_id
        - erp: EKORG → steelwise: purchasing_org
        - erp: WAERS → steelwise: currency

    - hook_id: ERP-MD-004
      name: gl_account_sync
      direction: FROM_ERP
      erp_entity: GL Account Master
      steelwise_entity: GLAccount
      
      field_mappings:
        - erp: SAKNR → steelwise: gl_account_id
        - erp: TXT50 → steelwise: description
        - erp: KTOKS → steelwise: account_group
        - erp: XBILK → steelwise: balance_sheet_account

  # ═══════════════════════════════════════════════════════════════════
  # TRANSACTIONAL HOOKS
  # ═══════════════════════════════════════════════════════════════════
  transactional_hooks:

    - hook_id: ERP-TX-001
      name: sales_order_sync
      direction: TO_ERP
      steelwise_entity: Order
      erp_entity: Sales Order
      
      trigger:
        event: ORDER_CONFIRMED
        conditions:
          - order.status = 'CONFIRMED'
          - order.erp_order_id IS NULL
          
      field_mappings:
        - steelwise: order.customer_id → erp: KUNNR (via crossref)
        - steelwise: order.customer_po_number → erp: BSTNK
        - steelwise: order.order_date → erp: AUDAT
        - steelwise: order.requested_delivery_date → erp: VDATU
        - steelwise: order_line.product_id → erp: MATNR (via crossref)
        - steelwise: order_line.quantity → erp: KWMENG
        - steelwise: order_line.uom → erp: VRKME
        - steelwise: order_line.unit_price → erp: NETPR
        - steelwise: order.ship_to_address → erp: SHIP_TO_PARTNER
        
      response_handling:
        success:
          - store erp_order_id
          - store erp_line_ids
          - update order.erp_sync_status = 'SYNCED'
        failure:
          - log error details
          - set order.erp_sync_status = 'ERROR'
          - notify integration team
          - queue for retry

    - hook_id: ERP-TX-002
      name: shipment_post
      direction: TO_ERP
      steelwise_entity: Shipment
      erp_entity: Delivery / Goods Issue
      
      trigger:
        event: SHIPMENT_SHIPPED
        conditions:
          - shipment.status = 'SHIPPED'
          - order.erp_order_id IS NOT NULL
          
      erp_transactions:
        - transaction: VL01N
          type: Create Delivery
          reference: erp_order_id
          
        - transaction: VL02N
          type: Post Goods Issue
          reference: delivery_id
          
      field_mappings:
        - steelwise: shipment.ship_date → erp: WADAT_IST
        - steelwise: shipment_line.quantity → erp: LFIMG
        - steelwise: shipment.bol_number → erp: BOLNR
        - steelwise: shipment.carrier → erp: ROUTE
        - steelwise: shipment_line.serial_numbers → erp: SERIAL_NUMBERS
        
      inventory_impact:
        - goods_issue_posting
        - inventory_reduction
        - cost_of_goods_sold

    - hook_id: ERP-TX-003
      name: invoice_post
      direction: TO_ERP
      steelwise_entity: Invoice
      erp_entity: Billing Document
      
      trigger:
        event: INVOICE_FINALIZED
        conditions:
          - invoice.status = 'FINALIZED'
          - shipment.erp_delivery_id IS NOT NULL
          
      erp_transactions:
        - transaction: VF01
          type: Create Billing Document
          reference: erp_delivery_id
          
      field_mappings:
        - steelwise: invoice.invoice_number → erp: VBELN (store)
        - steelwise: invoice.invoice_date → erp: FKDAT
        - steelwise: invoice_line.quantity → erp: FKIMG
        - steelwise: invoice_line.amount → erp: NETWR
        
      gl_postings:
        - debit: accounts_receivable
        - credit: revenue
        - credit: sales_tax_payable

    - hook_id: ERP-TX-004
      name: purchase_order_sync
      direction: TO_ERP
      steelwise_entity: PurchaseOrder
      erp_entity: Purchase Order
      
      trigger:
        event: PO_APPROVED
        
      erp_transactions:
        - transaction: ME21N
          type: Create Purchase Order
          
      field_mappings:
        - steelwise: po.supplier_id → erp: LIFNR
        - steelwise: po_line.product_id → erp: MATNR
        - steelwise: po_line.quantity → erp: MENGE
        - steelwise: po_line.unit_price → erp: NETPR
        - steelwise: po.delivery_date → erp: EINDT

    - hook_id: ERP-TX-005
      name: goods_receipt_post
      direction: TO_ERP
      steelwise_entity: Receipt
      erp_entity: Goods Receipt
      
      trigger:
        event: RECEIPT_CONFIRMED
        
      erp_transactions:
        - transaction: MIGO
          type: Goods Receipt for Purchase Order
          movement_type: "101"
          
      field_mappings:
        - steelwise: receipt.po_id → erp: EBELN
        - steelwise: receipt_line.quantity → erp: ERFMG
        - steelwise: receipt_line.heat_number → erp: CHARG
        
      inventory_impact:
        - inventory_increase
        - gr_ir_clearing

    - hook_id: ERP-TX-006
      name: supplier_invoice_post
      direction: TO_ERP
      steelwise_entity: SupplierInvoice
      erp_entity: Vendor Invoice
      
      trigger:
        event: INVOICE_APPROVED
        conditions:
          - three_way_match_passed
          
      erp_transactions:
        - transaction: MIRO
          type: Logistics Invoice Verification
          
      gl_postings:
        - debit: gr_ir_clearing
        - credit: accounts_payable

  # ═══════════════════════════════════════════════════════════════════
  # INVENTORY SYNC HOOKS
  # ═══════════════════════════════════════════════════════════════════
  inventory_hooks:

    - hook_id: ERP-INV-001
      name: inventory_snapshot_sync
      direction: BIDIRECTIONAL
      frequency: DAILY
      
      reconciliation:
        method: FULL_COMPARE
        scope: ALL_LOCATIONS
        by: MATERIAL_LOCATION_BATCH
        
      discrepancy_handling:
        threshold_pct: 1.0
        above_threshold: MANUAL_REVIEW
        below_threshold: AUTO_ADJUST_STEELWISE
        
    - hook_id: ERP-INV-002
      name: realtime_inventory_movement
      direction: TO_ERP
      
      movement_types:
        - steelwise: ADJUSTMENT_POSITIVE → erp: 561
        - steelwise: ADJUSTMENT_NEGATIVE → erp: 562
        - steelwise: TRANSFER_POSTING → erp: 311
        - steelwise: SCRAP → erp: 551
        - steelwise: CONSUMPTION → erp: 261

  # ═══════════════════════════════════════════════════════════════════
  # FINANCIAL HOOKS
  # ═══════════════════════════════════════════════════════════════════
  financial_hooks:

    - hook_id: ERP-FIN-001
      name: credit_check
      direction: FROM_ERP
      type: REAL_TIME_CALL
      
      trigger:
        event: ORDER_SUBMITTED
        
      request:
        customer_id: erp_customer_id
        order_value: order.total_amount
        
      response:
        credit_approved: boolean
        available_credit: number
        credit_limit: number
        blocked_reason: string
        
      action:
        approved: CONTINUE_ORDER_PROCESSING
        rejected: HOLD_ORDER_FOR_REVIEW

    - hook_id: ERP-FIN-002
      name: payment_receipt
      direction: FROM_ERP
      
      trigger:
        event: PAYMENT_POSTED_IN_ERP
        
      steelwise_action:
        - update_invoice_paid_amount
        - update_invoice_status
        - update_customer_balance

    - hook_id: ERP-FIN-003
      name: costing_sync
      direction: FROM_ERP
      frequency: MONTHLY
      
      data:
        - standard_costs
        - actual_costs
        - variances
        - overhead_rates
```

---

## 3. API Surface

```yaml
api_surface:

  # ═══════════════════════════════════════════════════════════════════
  # INBOUND APIs (ERP/MES TO STEELWISE)
  # ═══════════════════════════════════════════════════════════════════
  inbound_apis:

    - api_id: API-IN-001
      name: Master Data Import
      path: /api/v1/integration/master-data
      method: POST
      authentication: API_KEY + HMAC
      
      endpoints:
        - path: /customers
          method: POST | PUT
          payload:
            type: object
            properties:
              erp_customer_id: { type: string, required: true }
              customer_name: { type: string, required: true }
              address: { type: Address }
              credit_limit: { type: number }
              payment_terms_id: { type: string }
              contacts: { type: array, items: Contact }
          response:
            success: { steelwise_id: uuid, status: "created" | "updated" }
            
        - path: /products
          method: POST | PUT
          payload:
            type: object
            properties:
              erp_material_id: { type: string, required: true }
              description: { type: string }
              specifications: { type: ProductSpec }
              costs: { type: CostData }
              
        - path: /suppliers
          method: POST | PUT
          
        - path: /pricing
          method: POST
          payload:
            type: array
            items:
              customer_id: string
              product_id: string
              price: number
              effective_date: date
              expiration_date: date

    - api_id: API-IN-002
      name: Transaction Callbacks
      path: /api/v1/integration/callbacks
      method: POST
      
      endpoints:
        - path: /order-confirmation
          description: "ERP confirms order creation"
          payload:
            steelwise_order_id: uuid
            erp_order_id: string
            erp_line_ids: array
            status: "success" | "partial" | "error"
            errors: array
            
        - path: /shipment-confirmation
          description: "ERP confirms goods issue"
          payload:
            steelwise_shipment_id: uuid
            erp_delivery_id: string
            posting_date: date
            document_number: string
            
        - path: /invoice-confirmation
          description: "ERP confirms billing document"
          payload:
            steelwise_invoice_id: uuid
            erp_invoice_id: string
            posting_date: date
            
        - path: /payment-notification
          description: "ERP notifies of payment received"
          payload:
            customer_id: string
            payment_amount: number
            payment_date: date
            invoices_paid:
              - invoice_id: string
                amount_applied: number

    - api_id: API-IN-003
      name: Real-Time Lookups
      path: /api/v1/integration/lookup
      method: GET
      
      endpoints:
        - path: /credit-status/{customer_id}
          response:
            credit_limit: number
            credit_used: number
            credit_available: number
            status: "OK" | "WARNING" | "BLOCKED"
            
        - path: /inventory/{product_id}
          query_params:
            location_id: string
            include_allocated: boolean
          response:
            available_qty: number
            allocated_qty: number
            on_order_qty: number
            
        - path: /pricing/{product_id}
          query_params:
            customer_id: string
            quantity: number
          response:
            unit_price: number
            price_uom: string
            discount_pct: number
            effective_date: date

    - api_id: API-IN-004
      name: MES Shop Floor Data
      path: /api/v1/integration/mes
      method: POST
      
      endpoints:
        - path: /work-order-status
          description: "MES updates work order progress"
          payload:
            work_order_id: string
            operation_id: string
            status: "STARTED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD"
            quantity_completed: number
            quantity_scrapped: number
            labor_hours: number
            machine_hours: number
            timestamp: datetime
            
        - path: /production-complete
          description: "MES reports production completion"
          payload:
            work_order_id: string
            quantity_produced: number
            actual_weight: number
            heat_numbers: array
            quality_data: object
            
        - path: /equipment-status
          description: "MES reports equipment status"
          payload:
            equipment_id: string
            status: "RUNNING" | "IDLE" | "DOWN" | "MAINTENANCE"
            downtime_reason: string
            timestamp: datetime

  # ═══════════════════════════════════════════════════════════════════
  # OUTBOUND APIs (STEELWISE TO ERP/MES)
  # ═══════════════════════════════════════════════════════════════════
  outbound_apis:

    - api_id: API-OUT-001
      name: ERP Transaction APIs
      base_url: "{erp_host}/api/v1"
      authentication: OAUTH2 | SAP_JWT
      
      endpoints:
        - path: /sales-orders
          method: POST
          description: "Create sales order in ERP"
          request:
            order_type: string
            customer_id: string
            po_number: string
            lines:
              - material_id: string
                quantity: number
                uom: string
                price: number
                delivery_date: date
          response:
            erp_order_id: string
            erp_line_ids: array
            
        - path: /deliveries
          method: POST
          description: "Create delivery and post goods issue"
          request:
            erp_order_id: string
            ship_date: date
            lines:
              - erp_line_id: string
                quantity: number
                batch: string
                serial_numbers: array
                
        - path: /billing
          method: POST
          description: "Create billing document"
          request:
            erp_delivery_id: string
            billing_date: date
            
        - path: /purchase-orders
          method: POST
          description: "Create purchase order"
          
        - path: /goods-receipts
          method: POST
          description: "Post goods receipt"

    - api_id: API-OUT-002
      name: MES Work Order APIs
      base_url: "{mes_host}/api/v1"
      
      endpoints:
        - path: /work-orders
          method: POST
          description: "Release work order to MES"
          request:
            work_order_id: string
            product_id: string
            quantity: number
            due_date: datetime
            priority: number
            routing:
              - operation_seq: number
                work_center_id: string
                operation_code: string
                setup_time: number
                run_time: number
            materials:
              - material_id: string
                quantity: number
                
        - path: /work-orders/{id}/schedule
          method: PUT
          description: "Update work order schedule"
          
        - path: /work-orders/{id}/priority
          method: PUT
          description: "Change work order priority"
          
        - path: /work-orders/{id}/cancel
          method: POST
          description: "Cancel work order"

  # ═══════════════════════════════════════════════════════════════════
  # WEBHOOK CONFIGURATIONS
  # ═══════════════════════════════════════════════════════════════════
  webhooks:

    outbound_webhooks:
      - event: order.created
        url: "{erp_webhook_url}/orders"
        
      - event: shipment.shipped
        url: "{erp_webhook_url}/shipments"
        
      - event: work_order.released
        url: "{mes_webhook_url}/work-orders"
        
    webhook_config:
      retry_policy:
        max_retries: 5
        backoff: exponential
        initial_delay_ms: 1000
        max_delay_ms: 300000
      timeout_ms: 30000
      signature_header: X-SteelWise-Signature
      signature_algorithm: HMAC-SHA256

  # ═══════════════════════════════════════════════════════════════════
  # API SECURITY
  # ═══════════════════════════════════════════════════════════════════
  security:

    authentication_methods:
      - method: API_KEY
        header: X-API-Key
        
      - method: OAUTH2
        grant_type: client_credentials
        token_url: "/oauth/token"
        scopes:
          - read:orders
          - write:orders
          - read:inventory
          - write:inventory
          - read:products
          - write:products
          
      - method: HMAC_SIGNATURE
        algorithm: SHA256
        timestamp_header: X-Timestamp
        signature_header: X-Signature
        
    rate_limiting:
      default: 1000 requests/minute
      by_endpoint:
        /bulk-import: 10 requests/minute
        /lookup/*: 5000 requests/minute
        
    ip_whitelisting:
      enabled: true
      erp_ips: [configured_per_tenant]
      mes_ips: [configured_per_tenant]
```

---

## 4. Event Catalog

```yaml
event_catalog:

  # ═══════════════════════════════════════════════════════════════════
  # DOMAIN EVENTS - ORDER MANAGEMENT
  # ═══════════════════════════════════════════════════════════════════
  order_events:

    - event_id: EVT-ORD-001
      name: order.created
      domain: ORDER_MANAGEMENT
      description: "New order created in system"
      trigger: Order creation completed
      
      payload:
        order_id: uuid
        order_number: string
        customer_id: uuid
        customer_po_number: string
        order_date: date
        order_type: string
        total_amount: number
        currency: string
        lines:
          - line_id: uuid
            product_id: uuid
            quantity: number
            uom: string
            unit_price: number
            requested_date: date
        source: "EDI" | "PORTAL" | "MANUAL" | "API"
        
      subscribers:
        - ERP_INTEGRATION
        - INVENTORY_ALLOCATION
        - CREDIT_CHECK
        - NOTIFICATION_SERVICE
        
      erp_action: CREATE_SALES_ORDER

    - event_id: EVT-ORD-002
      name: order.confirmed
      domain: ORDER_MANAGEMENT
      description: "Order confirmed and ready for processing"
      
      payload:
        order_id: uuid
        confirmed_lines:
          - line_id: uuid
            confirmed_qty: number
            confirmed_date: date
            
      subscribers:
        - ERP_INTEGRATION
        - PRODUCTION_PLANNING
        - EDI_OUTBOUND (855)

    - event_id: EVT-ORD-003
      name: order.changed
      domain: ORDER_MANAGEMENT
      description: "Order modified"
      
      payload:
        order_id: uuid
        change_type: "QUANTITY" | "DATE" | "PRICE" | "CANCEL_LINE" | "ADD_LINE"
        changes:
          - field: string
            old_value: any
            new_value: any
            
      subscribers:
        - ERP_INTEGRATION
        - INVENTORY_ALLOCATION
        - EDI_OUTBOUND (855)

    - event_id: EVT-ORD-004
      name: order.cancelled
      domain: ORDER_MANAGEMENT
      
      payload:
        order_id: uuid
        cancellation_reason: string
        cancelled_by: uuid
        
      subscribers:
        - ERP_INTEGRATION
        - INVENTORY_DEALLOCATION
        - EDI_OUTBOUND (855)

  # ═══════════════════════════════════════════════════════════════════
  # DOMAIN EVENTS - PRODUCTION
  # ═══════════════════════════════════════════════════════════════════
  production_events:

    - event_id: EVT-PRD-001
      name: work_order.created
      domain: PRODUCTION
      
      payload:
        work_order_id: uuid
        work_order_number: string
        order_id: uuid
        product_id: uuid
        quantity: number
        due_date: datetime
        priority: number
        routing: array
        
      subscribers:
        - MES_INTEGRATION
        - MATERIAL_PLANNING
        - CAPACITY_PLANNING

    - event_id: EVT-PRD-002
      name: work_order.released
      domain: PRODUCTION
      
      payload:
        work_order_id: uuid
        release_date: datetime
        scheduled_start: datetime
        
      subscribers:
        - MES_INTEGRATION
        - SHOP_FLOOR_DISPLAY

    - event_id: EVT-PRD-003
      name: work_order.started
      domain: PRODUCTION
      source: MES
      
      payload:
        work_order_id: uuid
        operation_id: uuid
        work_center_id: uuid
        operator_id: uuid
        start_time: datetime
        
      subscribers:
        - ERP_INTEGRATION (labor_posting)
        - REAL_TIME_DASHBOARD

    - event_id: EVT-PRD-004
      name: work_order.completed
      domain: PRODUCTION
      source: MES
      
      payload:
        work_order_id: uuid
        completion_time: datetime
        quantity_produced: number
        quantity_scrapped: number
        actual_hours: number
        heat_numbers: array
        
      subscribers:
        - ERP_INTEGRATION (completion_confirmation)
        - INVENTORY_RECEIPT
        - QUALITY_INSPECTION
        - SHIPPING_PLANNING

    - event_id: EVT-PRD-005
      name: operation.completed
      domain: PRODUCTION
      source: MES
      
      payload:
        work_order_id: uuid
        operation_id: uuid
        quantity_completed: number
        labor_hours: number
        machine_hours: number
        scrap_qty: number
        scrap_reason: string
        
      subscribers:
        - ERP_INTEGRATION (operation_confirmation)
        - NEXT_OPERATION_TRIGGER

  # ═══════════════════════════════════════════════════════════════════
  # DOMAIN EVENTS - INVENTORY
  # ═══════════════════════════════════════════════════════════════════
  inventory_events:

    - event_id: EVT-INV-001
      name: inventory.received
      domain: INVENTORY
      
      payload:
        receipt_id: uuid
        po_id: uuid
        location_id: uuid
        lines:
          - product_id: uuid
            quantity: number
            lot_number: string
            heat_number: string
            
      subscribers:
        - ERP_INTEGRATION (goods_receipt)
        - QUALITY_INSPECTION
        - INVENTORY_VALUATION

    - event_id: EVT-INV-002
      name: inventory.allocated
      domain: INVENTORY
      
      payload:
        allocation_id: uuid
        order_id: uuid
        product_id: uuid
        location_id: uuid
        quantity: number
        lot_numbers: array
        
      subscribers:
        - ORDER_FULFILLMENT
        - ATP_UPDATE

    - event_id: EVT-INV-003
      name: inventory.adjusted
      domain: INVENTORY
      
      payload:
        adjustment_id: uuid
        product_id: uuid
        location_id: uuid
        adjustment_type: "POSITIVE" | "NEGATIVE" | "TRANSFER"
        quantity: number
        reason_code: string
        
      subscribers:
        - ERP_INTEGRATION (inventory_movement)
        - AUDIT_LOG

    - event_id: EVT-INV-004
      name: inventory.below_reorder_point
      domain: INVENTORY
      
      payload:
        product_id: uuid
        location_id: uuid
        current_qty: number
        reorder_point: number
        suggested_order_qty: number
        
      subscribers:
        - REPLENISHMENT_PLANNING
        - PURCHASING_ALERT

  # ═══════════════════════════════════════════════════════════════════
  # DOMAIN EVENTS - SHIPPING
  # ═══════════════════════════════════════════════════════════════════
  shipping_events:

    - event_id: EVT-SHP-001
      name: shipment.created
      domain: SHIPPING
      
      payload:
        shipment_id: uuid
        order_ids: array
        ship_to: Address
        requested_ship_date: date
        carrier: string
        
      subscribers:
        - CARRIER_INTEGRATION
        - DOCK_SCHEDULING

    - event_id: EVT-SHP-002
      name: shipment.shipped
      domain: SHIPPING
      
      payload:
        shipment_id: uuid
        ship_date: datetime
        carrier: string
        tracking_number: string
        bol_number: string
        weight: number
        lines:
          - order_line_id: uuid
            quantity_shipped: number
            lot_numbers: array
            
      subscribers:
        - ERP_INTEGRATION (goods_issue)
        - EDI_OUTBOUND (856)
        - CUSTOMER_NOTIFICATION
        - INVOICE_TRIGGER

    - event_id: EVT-SHP-003
      name: shipment.delivered
      domain: SHIPPING
      source: CARRIER_API
      
      payload:
        shipment_id: uuid
        delivery_date: datetime
        signed_by: string
        pod_document_id: uuid
        
      subscribers:
        - ORDER_COMPLETION
        - CUSTOMER_NOTIFICATION

  # ═══════════════════════════════════════════════════════════════════
  # DOMAIN EVENTS - BILLING
  # ═══════════════════════════════════════════════════════════════════
  billing_events:

    - event_id: EVT-BIL-001
      name: invoice.created
      domain: BILLING
      
      payload:
        invoice_id: uuid
        invoice_number: string
        customer_id: uuid
        shipment_ids: array
        total_amount: number
        due_date: date
        
      subscribers:
        - ERP_INTEGRATION (billing_document)
        - EDI_OUTBOUND (810)
        - AR_AGING

    - event_id: EVT-BIL-002
      name: payment.received
      domain: BILLING
      source: ERP
      
      payload:
        payment_id: string
        customer_id: uuid
        amount: number
        payment_date: date
        payment_method: string
        invoices_applied:
          - invoice_id: uuid
            amount: number
            
      subscribers:
        - AR_UPDATE
        - CREDIT_LIMIT_UPDATE
        - CUSTOMER_NOTIFICATION

  # ═══════════════════════════════════════════════════════════════════
  # DOMAIN EVENTS - QUALITY
  # ═══════════════════════════════════════════════════════════════════
  quality_events:

    - event_id: EVT-QA-001
      name: inspection.completed
      domain: QUALITY
      
      payload:
        inspection_id: uuid
        inspected_entity: "RECEIPT" | "WORK_ORDER" | "SHIPMENT"
        entity_id: uuid
        result: "PASS" | "FAIL" | "CONDITIONAL"
        measurements: array
        disposition: string
        
      subscribers:
        - INVENTORY_STATUS_UPDATE
        - NCR_CREATION (if fail)
        - NEXT_PROCESS_TRIGGER (if pass)

    - event_id: EVT-QA-002
      name: ncr.created
      domain: QUALITY
      
      payload:
        ncr_id: uuid
        source_type: string
        source_id: uuid
        defect_type: string
        quantity_affected: number
        severity: string
        
      subscribers:
        - QUALITY_ALERT
        - SUPPLIER_NOTIFICATION (if incoming)
        - COST_TRACKING

  # ═══════════════════════════════════════════════════════════════════
  # EVENT INFRASTRUCTURE
  # ═══════════════════════════════════════════════════════════════════
  event_infrastructure:

    message_broker:
      type: RABBITMQ | KAFKA | AZURE_SERVICE_BUS
      
    event_envelope:
      event_id: uuid
      event_type: string
      event_version: string
      timestamp: datetime
      source_system: string
      correlation_id: uuid
      causation_id: uuid
      tenant_id: uuid
      payload: object
      metadata:
        user_id: uuid
        ip_address: string
        trace_id: string
        
    delivery_guarantees:
      at_least_once: true
      idempotency_key: event_id
      deduplication_window: 24_hours
      
    dead_letter_handling:
      max_retries: 5
      backoff: exponential
      dlq_retention_days: 30
      alerting: true
```

---

## 5. Contract Surfaces

```yaml
contract_surfaces:

  # ═══════════════════════════════════════════════════════════════════
  # ERP CONTRACT INTERFACES
  # ═══════════════════════════════════════════════════════════════════
  erp_contracts:

    - contract_id: CON-ERP-001
      name: Sales Order Interface
      version: "1.0"
      direction: STEELWISE_TO_ERP
      
      request_schema:
        type: object
        required:
          - customer_id
          - order_type
          - lines
        properties:
          customer_id:
            type: string
            description: "ERP customer ID"
            format: "10-digit numeric"
            
          order_type:
            type: string
            enum: ["ZOR", "ZRO", "ZCR"]
            description: "ERP order type"
            
          sales_org:
            type: string
            default: "1000"
            
          distribution_channel:
            type: string
            default: "10"
            
          division:
            type: string
            default: "00"
            
          po_number:
            type: string
            maxLength: 35
            
          po_date:
            type: string
            format: date
            
          requested_delivery_date:
            type: string
            format: date
            
          ship_to_party:
            type: string
            description: "ERP ship-to customer ID"
            
          lines:
            type: array
            minItems: 1
            items:
              type: object
              required:
                - material_id
                - quantity
                - uom
              properties:
                material_id:
                  type: string
                  format: "18-char material"
                quantity:
                  type: number
                  minimum: 0.001
                uom:
                  type: string
                  enum: ["LB", "KG", "EA", "CW", "TON"]
                unit_price:
                  type: number
                price_unit:
                  type: integer
                  default: 1
                plant:
                  type: string
                  default: "1000"
                storage_location:
                  type: string
                  
      response_schema:
        type: object
        properties:
          success:
            type: boolean
          erp_order_id:
            type: string
          erp_order_lines:
            type: array
            items:
              steelwise_line_id: uuid
              erp_line_id: string
          errors:
            type: array
            items:
              code: string
              message: string
              field: string
              
      error_codes:
        - code: ERP-001
          message: "Customer not found in ERP"
          resolution: "Sync customer master"
          
        - code: ERP-002
          message: "Material not found in ERP"
          resolution: "Sync product master"
          
        - code: ERP-003
          message: "Credit block"
          resolution: "Contact credit department"
          
        - code: ERP-004
          message: "Invalid quantity/UOM"
          resolution: "Check conversion factors"

    - contract_id: CON-ERP-002
      name: Goods Issue Interface
      version: "1.0"
      direction: STEELWISE_TO_ERP
      
      request_schema:
        type: object
        required:
          - erp_delivery_id
          - posting_date
        properties:
          erp_delivery_id:
            type: string
          posting_date:
            type: string
            format: date
          document_date:
            type: string
            format: date
          lines:
            type: array
            items:
              erp_line_id: string
              quantity: number
              batch: string
              serial_numbers:
                type: array
                items: string
                
      response_schema:
        type: object
        properties:
          success: boolean
          material_document: string
          fiscal_year: string
          posting_date: date

    - contract_id: CON-ERP-003
      name: Customer Master Interface
      version: "1.0"
      direction: ERP_TO_STEELWISE
      
      schema:
        type: object
        properties:
          erp_customer_id:
            type: string
            required: true
          name:
            type: string
            required: true
          name2:
            type: string
          street:
            type: string
          city:
            type: string
          region:
            type: string
          postal_code:
            type: string
          country:
            type: string
          telephone:
            type: string
          email:
            type: string
          credit_limit:
            type: number
          credit_exposure:
            type: number
          payment_terms:
            type: string
          price_group:
            type: string
          incoterms:
            type: string
          shipping_conditions:
            type: string
          tax_classification:
            type: string
          currency:
            type: string

  # ═══════════════════════════════════════════════════════════════════
  # MES CONTRACT INTERFACES
  # ═══════════════════════════════════════════════════════════════════
  mes_contracts:

    - contract_id: CON-MES-001
      name: Work Order Release Interface
      version: "1.0"
      direction: STEELWISE_TO_MES
      
      request_schema:
        type: object
        required:
          - work_order_id
          - product_id
          - quantity
          - routing
        properties:
          work_order_id:
            type: string
            format: uuid
          work_order_number:
            type: string
          order_id:
            type: string
          product_id:
            type: string
          product_description:
            type: string
          quantity:
            type: number
          uom:
            type: string
          due_date:
            type: string
            format: datetime
          priority:
            type: integer
            minimum: 1
            maximum: 99
          customer_name:
            type: string
          customer_po:
            type: string
          special_instructions:
            type: string
          quality_requirements:
            type: array
            items: string
          routing:
            type: array
            items:
              operation_seq:
                type: integer
              operation_code:
                type: string
              operation_description:
                type: string
              work_center_id:
                type: string
              setup_time_mins:
                type: number
              run_time_per_pc_mins:
                type: number
              queue_time_mins:
                type: number
          materials:
            type: array
            items:
              material_id:
                type: string
              description:
                type: string
              quantity_per:
                type: number
              uom:
                type: string
              lot_numbers:
                type: array
                items: string
                
      response_schema:
        type: object
        properties:
          accepted: boolean
          mes_work_order_id: string
          scheduled_start: datetime
          estimated_completion: datetime
          warnings: array

    - contract_id: CON-MES-002
      name: Production Completion Interface
      version: "1.0"
      direction: MES_TO_STEELWISE
      
      schema:
        type: object
        required:
          - work_order_id
          - operation_id
          - status
          - timestamp
        properties:
          work_order_id:
            type: string
          operation_id:
            type: string
          status:
            type: string
            enum: ["STARTED", "IN_PROGRESS", "COMPLETED", "ON_HOLD", "CANCELLED"]
          quantity_completed:
            type: number
          quantity_scrapped:
            type: number
          scrap_reason_code:
            type: string
          operator_id:
            type: string
          machine_id:
            type: string
          start_time:
            type: string
            format: datetime
          end_time:
            type: string
            format: datetime
          labor_hours:
            type: number
          machine_hours:
            type: number
          setup_hours:
            type: number
          downtime_minutes:
            type: number
          downtime_reason:
            type: string
          heat_numbers:
            type: array
            items: string
          lot_numbers:
            type: array
            items: string
          quality_data:
            type: object
            properties:
              measurements:
                type: array
                items:
                  characteristic: string
                  nominal: number
                  actual: number
                  uom: string
                  pass_fail: boolean
              defects:
                type: array
                items:
                  defect_code: string
                  quantity: number
                  disposition: string
          timestamp:
            type: string
            format: datetime
          notes:
            type: string

  # ═══════════════════════════════════════════════════════════════════
  # EDI CONTRACT INTERFACES
  # ═══════════════════════════════════════════════════════════════════
  edi_contracts:

    - contract_id: CON-EDI-001
      name: EDI 850 Inbound Contract
      version: "004010"
      
      validation_rules:
        - rule: REQUIRED_SEGMENTS
          segments: [ISA, GS, ST, BEG, N1, PO1, CTT, SE, GE, IEA]
          
        - rule: BEG_VALIDATION
          BEG03: { required: true, max_length: 22 }
          BEG05: { required: true, format: "YYYYMMDD" }
          
        - rule: PO1_VALIDATION
          PO102: { required: true, type: numeric, min: 0.001 }
          PO103: { required: true, enum: [LB, EA, CW, KG] }
          PO107: { required: true, max_length: 48 }
          
        - rule: LINE_COUNT
          CTT01: { must_equal: count_of_PO1_segments }
          
      crossref_requirements:
        - field: PO107 (buyer_part)
          lookup: customer_item_crossref
          fallback: create_new_product_request
          
      acknowledgment:
        type: 997
        timing: IMMEDIATE
        
    - contract_id: CON-EDI-002
      name: EDI 856 Outbound Contract
      version: "004010"
      
      generation_rules:
        - hierarchy: SHIPMENT → ORDER → ITEM
        
        - segment: BSN
          BSN02: shipment.shipment_number
          BSN03: format(shipment.ship_date, "YYYYMMDD")
          BSN04: format(shipment.ship_time, "HHMM")
          
        - segment: HL_SHIPMENT
          TD5: carrier_scac_code
          REF_BM: shipment.bol_number
          DTM_011: shipment.ship_date
          
        - segment: HL_ORDER
          PRF01: order.customer_po_number
          
        - segment: HL_ITEM
          LIN: product.customer_part_number
          SN1: shipment_line.quantity
          MAN: heat_number (if applicable)

  # ═══════════════════════════════════════════════════════════════════
  # CONTRACT VERSIONING
  # ═══════════════════════════════════════════════════════════════════
  versioning:

    strategy: SEMANTIC_VERSIONING
    
    compatibility_rules:
      - MINOR_VERSION: backward_compatible_additions
      - MAJOR_VERSION: breaking_changes
      
    deprecation_policy:
      notice_period_days: 90
      sunset_period_days: 180
      
    version_negotiation:
      header: X-API-Version
      default: latest_stable
      supported: [1.0, 1.1, 2.0]
```

---

## 6. Mapping Rules

```yaml
mapping_rules:

  # ═══════════════════════════════════════════════════════════════════
  # ENTITY CROSSREFERENCE RULES
  # ═══════════════════════════════════════════════════════════════════
  entity_crossref:

    - crossref_id: XREF-001
      name: Customer Crossreference
      steelwise_entity: Customer
      external_systems:
        - system: ERP
          external_id_field: erp_customer_id
          format: "10-digit numeric"
          
        - system: EDI
          external_id_field: edi_partner_id
          format: "ISA qualifier + ID"
          
      lookup_priority:
        1: erp_customer_id
        2: edi_partner_id
        3: customer_name + address_match
        
      create_if_not_found: false
      alert_if_not_found: true

    - crossref_id: XREF-002
      name: Product Crossreference
      steelwise_entity: Product
      external_systems:
        - system: ERP
          external_id_field: erp_material_id
          format: "18-char alphanumeric"
          
        - system: CUSTOMER
          external_id_field: customer_part_number
          scoped_by: customer_id
          
        - system: SUPPLIER
          external_id_field: supplier_part_number
          scoped_by: supplier_id
          
      lookup_priority:
        inbound_from_customer:
          1: customer_part_number (for customer)
          2: erp_material_id
          3: description_match
          
        inbound_from_supplier:
          1: supplier_part_number (for supplier)
          2: erp_material_id
          
      create_if_not_found: false
      queue_for_review: true

    - crossref_id: XREF-003
      name: Location Crossreference
      steelwise_entity: Location
      external_systems:
        - system: ERP
          external_id_field: erp_plant
          secondary_field: erp_storage_location
          format: "4-digit plant + 4-digit sloc"
          
        - system: MES
          external_id_field: mes_location_id
          
      mappings:
        - steelwise: "WAREHOUSE-01" → erp: "1000/0001"
        - steelwise: "WAREHOUSE-02" → erp: "1000/0002"
        - steelwise: "PROD-FLOOR-01" → erp: "1000/0010"

  # ═══════════════════════════════════════════════════════════════════
  # UNIT OF MEASURE CONVERSION
  # ═══════════════════════════════════════════════════════════════════
  uom_conversions:

    - conversion_id: UOM-001
      name: Weight Conversions
      conversions:
        - from: LB → to: KG, factor: 0.453592
        - from: KG → to: LB, factor: 2.20462
        - from: LB → to: TON, factor: 0.0005
        - from: TON → to: LB, factor: 2000
        - from: LB → to: CW, factor: 0.01
        - from: CW → to: LB, factor: 100
        - from: MT → to: LB, factor: 2204.62
        - from: LB → to: MT, factor: 0.000453592

    - conversion_id: UOM-002
      name: Length Conversions
      conversions:
        - from: IN → to: FT, factor: 0.0833333
        - from: FT → to: IN, factor: 12
        - from: FT → to: M, factor: 0.3048
        - from: M → to: FT, factor: 3.28084
        - from: IN → to: MM, factor: 25.4
        - from: MM → to: IN, factor: 0.0393701

    - conversion_id: UOM-003
      name: Product-Specific Conversions
      description: "Convert between weight and pieces"
      
      conversion_method: LOOKUP
      lookup_table: product_uom_conversion
      
      schema:
        product_id: uuid
        from_uom: string
        to_uom: string
        conversion_factor: number
        effective_date: date
        
      example:
        product: "COIL-HR-0.060-48"
        conversions:
          - LB → SQ_FT: "1 / (0.060 * 0.2833 * 48 / 144) = 1.765"
          - SQ_FT → LB: "0.060 * 0.2833 * 48 / 144 = 0.567"

  # ═══════════════════════════════════════════════════════════════════
  # STATUS CODE MAPPINGS
  # ═══════════════════════════════════════════════════════════════════
  status_mappings:

    - mapping_id: STAT-001
      name: Order Status Mapping
      
      steelwise_to_erp:
        DRAFT: null (not synced)
        SUBMITTED: OPEN
        CONFIRMED: CONFIRMED
        IN_PRODUCTION: IN_PROCESS
        READY_TO_SHIP: READY
        PARTIALLY_SHIPPED: PARTIALLY_DELIVERED
        SHIPPED: DELIVERED
        INVOICED: BILLED
        COMPLETED: COMPLETED
        CANCELLED: CANCELLED
        
      erp_to_steelwise:
        OPEN: SUBMITTED
        CONFIRMED: CONFIRMED
        IN_PROCESS: IN_PRODUCTION
        PARTIALLY_DELIVERED: PARTIALLY_SHIPPED
        DELIVERED: SHIPPED
        BILLED: INVOICED
        COMPLETED: COMPLETED
        CANCELLED: CANCELLED

    - mapping_id: STAT-002
      name: EDI Acknowledgment Status Mapping
      
      steelwise_to_edi_855:
        CONFIRMED: AC (Accepted)
        CONFIRMED_WITH_CHANGES: AD (Accepted with Changes)
        REJECTED: RD (Rejected)
        PENDING: IA (Item Accepted, awaiting detail)
        BACKORDERED: BP (Accepted, backordered)
        
      line_status:
        ACCEPTED: IA
        DATE_CHANGED: DR
        QUANTITY_CHANGED: IQ
        PRICE_CHANGED: IP
        SUBSTITUTED: IS
        CANCELLED: IC

    - mapping_id: STAT-003
      name: Work Order Status Mapping
      
      steelwise_to_mes:
        CREATED: PLANNED
        RELEASED: RELEASED
        IN_PROGRESS: ACTIVE
        ON_HOLD: HOLD
        COMPLETED: COMPLETE
        CANCELLED: CANCELLED
        
      mes_to_steelwise:
        PLANNED: CREATED
        RELEASED: RELEASED
        SETUP: IN_PROGRESS
        RUNNING: IN_PROGRESS
        HOLD: ON_HOLD
        COMPLETE: COMPLETED
        CANCELLED: CANCELLED

  # ═══════════════════════════════════════════════════════════════════
  # DATA TRANSFORMATION RULES
  # ═══════════════════════════════════════════════════════════════════
  transformations:

    - transform_id: TRANS-001
      name: Date Format Transformations
      rules:
        - source: EDI (YYYYMMDD)
          target: ISO8601 (YYYY-MM-DD)
          function: "parse_edi_date(value)"
          
        - source: ERP (YYYYMMDD)
          target: ISO8601
          function: "format_date(value, 'YYYY-MM-DD')"
          
        - source: ISO8601
          target: EDI
          function: "format_date(value, 'YYYYMMDD')"

    - transform_id: TRANS-002
      name: Name/Address Transformations
      rules:
        - source: steelwise.address
          target: erp.address_block
          function: |
            {
              street: address.line1 + (address.line2 ? ', ' + address.line2 : ''),
              city: address.city,
              region: address.state,
              postal_code: address.zip,
              country: iso_country_code(address.country)
            }
            
        - source: edi.N1_loop
          target: steelwise.ship_to
          function: |
            {
              name: N102,
              address: {
                line1: N301,
                line2: N302,
                city: N401,
                state: N402,
                zip: N403,
                country: N404 || 'US'
              }
            }

    - transform_id: TRANS-003
      name: Quantity/Price Transformations
      rules:
        - name: price_per_pound_to_per_cwt
          condition: "source_uom = 'LB' AND target_uom = 'CW'"
          function: "price * 100"
          
        - name: price_per_cwt_to_per_pound
          condition: "source_uom = 'CW' AND target_uom = 'LB'"
          function: "price / 100"
          
        - name: decimal_quantity_to_integer
          condition: "target_system = 'ERP' AND qty_decimals = 0"
          function: "ROUND(quantity, 0)"

    - transform_id: TRANS-004
      name: Material ID Transformations
      rules:
        - name: pad_material_number
          target: ERP
          function: "LPAD(material_id, 18, '0')"
          
        - name: strip_leading_zeros
          source: ERP
          function: "LTRIM(material_id, '0')"

  # ═══════════════════════════════════════════════════════════════════
  # VALIDATION RULES
  # ═══════════════════════════════════════════════════════════════════
  validation_rules:

    - rule_id: VAL-001
      name: Inbound Order Validation
      applies_to: [EDI_850, API_ORDER]
      rules:
        - field: customer_id
          validation: EXISTS_IN_CUSTOMER_MASTER
          on_fail: REJECT
          error_code: VAL-001-01
          
        - field: product_id
          validation: EXISTS_IN_PRODUCT_MASTER OR HAS_CROSSREF
          on_fail: QUEUE_FOR_REVIEW
          error_code: VAL-001-02
          
        - field: quantity
          validation: GREATER_THAN_ZERO
          on_fail: REJECT
          error_code: VAL-001-03
          
        - field: requested_date
          validation: GREATER_THAN_OR_EQUAL_TODAY
          on_fail: WARN
          error_code: VAL-001-04
          
        - field: unit_price
          validation: WITHIN_TOLERANCE_OF_LIST_PRICE (±10%)
          on_fail: QUEUE_FOR_REVIEW
          error_code: VAL-001-05

    - rule_id: VAL-002
      name: Outbound Shipment Validation
      applies_to: [ERP_GOODS_ISSUE, EDI_856]
      rules:
        - field: quantity_shipped
          validation: LESS_THAN_OR_EQUAL_TO_ORDERED
          on_fail: REJECT
          
        - field: heat_numbers
          validation: VALID_HEAT_IN_INVENTORY
          on_fail: REJECT
          
        - field: weight
          validation: WITHIN_TOLERANCE_OF_CALCULATED (±2%)
          on_fail: WARN

  # ═══════════════════════════════════════════════════════════════════
  # ERROR HANDLING RULES
  # ═══════════════════════════════════════════════════════════════════
  error_handling:

    - error_type: CROSSREF_NOT_FOUND
      actions:
        1: LOG_ERROR
        2: QUEUE_FOR_MANUAL_RESOLUTION
        3: NOTIFY_INTEGRATION_TEAM
        4: HOLD_TRANSACTION
      resolution_workflow: MANUAL_CROSSREF_CREATION
      
    - error_type: VALIDATION_FAILED
      actions:
        1: LOG_ERROR
        2: GENERATE_997_WITH_ERRORS (for EDI)
        3: RETURN_ERROR_RESPONSE (for API)
        4: QUEUE_FOR_REVIEW
        
    - error_type: ERP_CONNECTION_FAILED
      actions:
        1: LOG_ERROR
        2: QUEUE_FOR_RETRY
        3: NOTIFY_IF_PERSISTENT
      retry_policy:
        max_retries: 5
        backoff: exponential
        alert_after: 3_failures
        
    - error_type: DUPLICATE_TRANSACTION
      actions:
        1: LOG_WARNING
        2: SKIP_PROCESSING
        3: RETURN_EXISTING_REFERENCE
      dedup_key: [source_system, transaction_type, external_reference]
      dedup_window: 24_hours
```

---

*Document generated for AI-build Phase 18: ERP/MES/EDI Integration*
