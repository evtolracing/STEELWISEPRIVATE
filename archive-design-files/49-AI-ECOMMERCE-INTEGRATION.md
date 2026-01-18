# 49 — AI E-Commerce Integration

> **Purpose:** E-commerce and ERP integration architecture, customer portal APIs, RFQ workflows, and event catalog for AI-build.  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. Integration Surface — OpenAPI Fragments

```yaml
openapi: 3.1.0
info:
  title: SteelWise Customer Portal & E-Commerce API
  version: 2.0.0
  description: External API for customer self-service, RFQ, ordering, and integration

servers:
  - url: https://api.steelwise.app/v2
    description: Production
  - url: https://api.staging.steelwise.app/v2
    description: Staging

security:
  - BearerAuth: []
  - ApiKeyAuth: []

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key

  schemas:
    # ─────────────────────────────────────────────────────────────────
    # PRODUCT CATALOG
    # ─────────────────────────────────────────────────────────────────
    ProductCategory:
      type: object
      properties:
        category_id:
          type: string
          format: uuid
        name:
          type: string
        slug:
          type: string
        parent_id:
          type: string
          format: uuid
          nullable: true
        description:
          type: string
        image_url:
          type: string
        display_order:
          type: integer
        product_count:
          type: integer
        children:
          type: array
          items:
            $ref: '#/components/schemas/ProductCategory'

    ProductSummary:
      type: object
      properties:
        product_id:
          type: string
          format: uuid
        sku:
          type: string
        name:
          type: string
        description:
          type: string
        category_id:
          type: string
          format: uuid
        form:
          type: string
          enum: [COIL, SHEET, PLATE, BAR, TUBE, PIPE, BEAM, ANGLE, CHANNEL]
        grade:
          type: string
        thickness_range:
          type: object
          properties:
            min:
              type: number
            max:
              type: number
            unit:
              type: string
        width_range:
          type: object
          properties:
            min:
              type: number
            max:
              type: number
            unit:
              type: string
        availability:
          type: string
          enum: [IN_STOCK, LOW_STOCK, OUT_OF_STOCK, MADE_TO_ORDER]
        lead_time_days:
          type: integer
        thumbnail_url:
          type: string
        base_price:
          type: number
          description: "Visible if customer has price visibility permission"
        price_unit:
          type: string
          enum: [LB, CWT, TON, EA, FT, PC]

    ProductDetail:
      allOf:
        - $ref: '#/components/schemas/ProductSummary'
        - type: object
          properties:
            specifications:
              type: object
              properties:
                thickness:
                  type: object
                  properties:
                    nominal:
                      type: number
                    tolerance_plus:
                      type: number
                    tolerance_minus:
                      type: number
                width:
                  type: object
                  properties:
                    nominal:
                      type: number
                    tolerance_plus:
                      type: number
                    tolerance_minus:
                      type: number
                length:
                  type: object
                  nullable: true
                mechanical_properties:
                  type: object
                  properties:
                    yield_strength_min:
                      type: number
                    tensile_strength_min:
                      type: number
                    elongation_min:
                      type: number
                chemistry:
                  type: object
                  additionalProperties:
                    type: object
                    properties:
                      min:
                        type: number
                      max:
                        type: number
            processing_options:
              type: array
              items:
                type: object
                properties:
                  processing_type:
                    type: string
                    enum: [CTL, SLITTING, BLANKING, LEVELING, EDGE_CONDITIONING]
                  available:
                    type: boolean
                  lead_time_days:
                    type: integer
                  price_per_lb:
                    type: number
            certifications:
              type: array
              items:
                type: string
            documents:
              type: array
              items:
                type: object
                properties:
                  document_type:
                    type: string
                  name:
                    type: string
                  url:
                    type: string
            inventory_summary:
              type: object
              properties:
                total_available_lbs:
                  type: number
                locations:
                  type: array
                  items:
                    type: object
                    properties:
                      location_id:
                        type: string
                      location_name:
                        type: string
                      available_lbs:
                        type: number
            related_products:
              type: array
              items:
                $ref: '#/components/schemas/ProductSummary'

    # ─────────────────────────────────────────────────────────────────
    # INVENTORY AVAILABILITY
    # ─────────────────────────────────────────────────────────────────
    InventoryItem:
      type: object
      properties:
        inventory_id:
          type: string
          format: uuid
        product_id:
          type: string
          format: uuid
        heat_number:
          type: string
        coil_id:
          type: string
          nullable: true
        location:
          type: object
          properties:
            location_id:
              type: string
            location_name:
              type: string
            zone:
              type: string
        dimensions:
          type: object
          properties:
            thickness:
              type: number
            width:
              type: number
            length:
              type: number
              nullable: true
            outer_diameter:
              type: number
              nullable: true
            inner_diameter:
              type: number
              nullable: true
        weight:
          type: object
          properties:
            gross_lbs:
              type: number
            net_lbs:
              type: number
            available_lbs:
              type: number
        status:
          type: string
          enum: [AVAILABLE, RESERVED, HOLD, ALLOCATED]
        quality_status:
          type: string
          enum: [PRIME, SECONDARY, EXCESS, REJECT]
        mtr_available:
          type: boolean
        price_per_lb:
          type: number
          nullable: true
        estimated_ship_date:
          type: string
          format: date

    AvailabilityCheck:
      type: object
      properties:
        product_id:
          type: string
          format: uuid
        requested_quantity:
          type: number
        quantity_unit:
          type: string
          enum: [LB, PC, FT]
        requested_dimensions:
          type: object
          nullable: true
          properties:
            thickness:
              type: number
            width:
              type: number
            length:
              type: number
        processing_type:
          type: string
          nullable: true
        location_id:
          type: string
          nullable: true

    AvailabilityResult:
      type: object
      properties:
        product_id:
          type: string
        available:
          type: boolean
        available_quantity:
          type: number
        quantity_unit:
          type: string
        fulfillment_options:
          type: array
          items:
            type: object
            properties:
              option_type:
                type: string
                enum: [STOCK, PROCESSING, TRANSFER, MADE_TO_ORDER]
              quantity:
                type: number
              location:
                type: string
              estimated_ship_date:
                type: string
                format: date
              lead_time_days:
                type: integer
              price_per_unit:
                type: number
              inventory_items:
                type: array
                items:
                  type: string
                  description: "Inventory IDs that would fulfill"

    # ─────────────────────────────────────────────────────────────────
    # RFQ / QUOTE
    # ─────────────────────────────────────────────────────────────────
    RFQRequest:
      type: object
      required:
        - items
      properties:
        rfq_reference:
          type: string
          description: "Customer's internal reference"
        project_name:
          type: string
        required_by_date:
          type: string
          format: date
        ship_to_address:
          $ref: '#/components/schemas/Address'
        delivery_preference:
          type: string
          enum: [PICKUP, DELIVERY, WILL_CALL]
        notes:
          type: string
        items:
          type: array
          minItems: 1
          items:
            type: object
            required:
              - product_id
              - quantity
            properties:
              line_number:
                type: integer
              product_id:
                type: string
                format: uuid
              quantity:
                type: number
              quantity_unit:
                type: string
                enum: [LB, PC, FT, TON]
              dimensions:
                type: object
                properties:
                  thickness:
                    type: number
                  width:
                    type: number
                  length:
                    type: number
              processing:
                type: object
                properties:
                  type:
                    type: string
                    enum: [CTL, SLITTING, BLANKING, LEVELING]
                  specifications:
                    type: object
              special_requirements:
                type: string
              target_price:
                type: number
                description: "Customer's target price (optional)"

    RFQResponse:
      type: object
      properties:
        rfq_id:
          type: string
          format: uuid
        rfq_number:
          type: string
        status:
          type: string
          enum: [RECEIVED, UNDER_REVIEW, QUOTED, EXPIRED, DECLINED]
        created_at:
          type: string
          format: date-time
        estimated_response_date:
          type: string
          format: date
        message:
          type: string

    Quote:
      type: object
      properties:
        quote_id:
          type: string
          format: uuid
        quote_number:
          type: string
        rfq_id:
          type: string
          format: uuid
          nullable: true
        status:
          type: string
          enum: [DRAFT, SENT, VIEWED, ACCEPTED, DECLINED, EXPIRED, REVISED]
        version:
          type: integer
        customer_id:
          type: string
          format: uuid
        contact_id:
          type: string
          format: uuid
        created_at:
          type: string
          format: date-time
        valid_until:
          type: string
          format: date
        pricing:
          type: object
          properties:
            subtotal:
              type: number
            processing_total:
              type: number
            freight_estimate:
              type: number
            tax_estimate:
              type: number
            total:
              type: number
            currency:
              type: string
        terms:
          type: object
          properties:
            payment_terms:
              type: string
            delivery_terms:
              type: string
            special_conditions:
              type: string
        lines:
          type: array
          items:
            $ref: '#/components/schemas/QuoteLine'
        documents:
          type: array
          items:
            type: object
            properties:
              document_type:
                type: string
              name:
                type: string
              url:
                type: string

    QuoteLine:
      type: object
      properties:
        line_id:
          type: string
          format: uuid
        line_number:
          type: integer
        product:
          $ref: '#/components/schemas/ProductSummary'
        description:
          type: string
        quantity:
          type: number
        quantity_unit:
          type: string
        dimensions:
          type: object
          properties:
            thickness:
              type: number
            width:
              type: number
            length:
              type: number
        processing:
          type: object
          nullable: true
          properties:
            type:
              type: string
            specifications:
              type: object
            price:
              type: number
        unit_price:
          type: number
        price_unit:
          type: string
        extended_price:
          type: number
        estimated_weight_lbs:
          type: number
        lead_time_days:
          type: integer
        ship_from_location:
          type: string
        notes:
          type: string

    QuoteAcceptance:
      type: object
      required:
        - quote_id
        - accepted_lines
      properties:
        quote_id:
          type: string
          format: uuid
        po_number:
          type: string
          description: "Customer PO number"
        accepted_lines:
          type: array
          items:
            type: object
            properties:
              line_id:
                type: string
                format: uuid
              quantity:
                type: number
                description: "Can accept partial quantity"
        ship_to_address:
          $ref: '#/components/schemas/Address'
        requested_ship_date:
          type: string
          format: date
        special_instructions:
          type: string
        billing_address:
          $ref: '#/components/schemas/Address'

    # ─────────────────────────────────────────────────────────────────
    # ORDERS
    # ─────────────────────────────────────────────────────────────────
    OrderCreate:
      type: object
      required:
        - items
        - ship_to_address
      properties:
        po_number:
          type: string
        quote_id:
          type: string
          format: uuid
          nullable: true
        project_reference:
          type: string
        ship_to_address:
          $ref: '#/components/schemas/Address'
        billing_address:
          $ref: '#/components/schemas/Address'
        delivery_preference:
          type: string
          enum: [PICKUP, DELIVERY, WILL_CALL]
        requested_ship_date:
          type: string
          format: date
        special_instructions:
          type: string
        items:
          type: array
          minItems: 1
          items:
            type: object
            required:
              - product_id
              - quantity
            properties:
              product_id:
                type: string
                format: uuid
              quantity:
                type: number
              quantity_unit:
                type: string
              dimensions:
                type: object
              processing:
                type: object
              inventory_id:
                type: string
                format: uuid
                description: "Reserve specific inventory"
              line_notes:
                type: string

    Order:
      type: object
      properties:
        order_id:
          type: string
          format: uuid
        order_number:
          type: string
        po_number:
          type: string
        quote_id:
          type: string
          format: uuid
          nullable: true
        status:
          type: string
          enum: [PENDING_APPROVAL, APPROVED, IN_PRODUCTION, READY_TO_SHIP, PARTIALLY_SHIPPED, SHIPPED, DELIVERED, COMPLETED, CANCELLED]
        order_date:
          type: string
          format: date-time
        requested_ship_date:
          type: string
          format: date
        estimated_ship_date:
          type: string
          format: date
        ship_to_address:
          $ref: '#/components/schemas/Address'
        billing_address:
          $ref: '#/components/schemas/Address'
        totals:
          type: object
          properties:
            subtotal:
              type: number
            processing:
              type: number
            freight:
              type: number
            tax:
              type: number
            total:
              type: number
        lines:
          type: array
          items:
            $ref: '#/components/schemas/OrderLine'
        shipments:
          type: array
          items:
            $ref: '#/components/schemas/ShipmentSummary'
        invoices:
          type: array
          items:
            $ref: '#/components/schemas/InvoiceSummary'
        documents:
          type: array
          items:
            $ref: '#/components/schemas/DocumentLink'

    OrderLine:
      type: object
      properties:
        line_id:
          type: string
          format: uuid
        line_number:
          type: integer
        product:
          $ref: '#/components/schemas/ProductSummary'
        description:
          type: string
        quantity_ordered:
          type: number
        quantity_shipped:
          type: number
        quantity_remaining:
          type: number
        quantity_unit:
          type: string
        dimensions:
          type: object
        processing:
          type: object
        unit_price:
          type: number
        extended_price:
          type: number
        status:
          type: string
          enum: [PENDING, ALLOCATED, IN_PRODUCTION, READY, SHIPPED, CANCELLED]
        estimated_ship_date:
          type: string
          format: date
        work_order_id:
          type: string
          format: uuid
          nullable: true

    # ─────────────────────────────────────────────────────────────────
    # SHIPMENTS
    # ─────────────────────────────────────────────────────────────────
    ShipmentSummary:
      type: object
      properties:
        shipment_id:
          type: string
          format: uuid
        shipment_number:
          type: string
        status:
          type: string
          enum: [PENDING, PICKED, PACKED, LOADED, IN_TRANSIT, DELIVERED]
        ship_date:
          type: string
          format: date
        estimated_delivery_date:
          type: string
          format: date
        actual_delivery_date:
          type: string
          format: date
          nullable: true
        carrier:
          type: string
        tracking_number:
          type: string
        tracking_url:
          type: string
        total_weight_lbs:
          type: number
        total_pieces:
          type: integer

    Shipment:
      allOf:
        - $ref: '#/components/schemas/ShipmentSummary'
        - type: object
          properties:
            order_id:
              type: string
              format: uuid
            ship_from:
              $ref: '#/components/schemas/Address'
            ship_to:
              $ref: '#/components/schemas/Address'
            lines:
              type: array
              items:
                type: object
                properties:
                  order_line_id:
                    type: string
                    format: uuid
                  product:
                    $ref: '#/components/schemas/ProductSummary'
                  quantity:
                    type: number
                  weight_lbs:
                    type: number
                  pieces:
                    type: integer
                  heat_numbers:
                    type: array
                    items:
                      type: string
            packages:
              type: array
              items:
                type: object
                properties:
                  package_id:
                    type: string
                  package_type:
                    type: string
                  weight_lbs:
                    type: number
                  dimensions:
                    type: object
                  tracking_number:
                    type: string
            documents:
              type: array
              items:
                $ref: '#/components/schemas/DocumentLink'
            tracking_events:
              type: array
              items:
                type: object
                properties:
                  timestamp:
                    type: string
                    format: date-time
                  status:
                    type: string
                  location:
                    type: string
                  description:
                    type: string

    # ─────────────────────────────────────────────────────────────────
    # INVOICES & PAYMENTS
    # ─────────────────────────────────────────────────────────────────
    InvoiceSummary:
      type: object
      properties:
        invoice_id:
          type: string
          format: uuid
        invoice_number:
          type: string
        invoice_date:
          type: string
          format: date
        due_date:
          type: string
          format: date
        status:
          type: string
          enum: [DRAFT, SENT, VIEWED, PARTIALLY_PAID, PAID, OVERDUE, VOID]
        total:
          type: number
        amount_paid:
          type: number
        balance_due:
          type: number
        currency:
          type: string

    Invoice:
      allOf:
        - $ref: '#/components/schemas/InvoiceSummary'
        - type: object
          properties:
            order_id:
              type: string
              format: uuid
            shipment_id:
              type: string
              format: uuid
              nullable: true
            billing_address:
              $ref: '#/components/schemas/Address'
            ship_to_address:
              $ref: '#/components/schemas/Address'
            po_number:
              type: string
            terms:
              type: string
            lines:
              type: array
              items:
                type: object
                properties:
                  line_number:
                    type: integer
                  description:
                    type: string
                  quantity:
                    type: number
                  unit:
                    type: string
                  unit_price:
                    type: number
                  extended_price:
                    type: number
            subtotal:
              type: number
            processing_charges:
              type: number
            freight_charges:
              type: number
            tax:
              type: number
            payments:
              type: array
              items:
                type: object
                properties:
                  payment_date:
                    type: string
                    format: date
                  amount:
                    type: number
                  method:
                    type: string
                  reference:
                    type: string
            documents:
              type: array
              items:
                $ref: '#/components/schemas/DocumentLink'

    PaymentSubmit:
      type: object
      required:
        - invoice_ids
        - payment_method
        - amount
      properties:
        invoice_ids:
          type: array
          items:
            type: string
            format: uuid
        payment_method:
          type: string
          enum: [CREDIT_CARD, ACH, CHECK]
        amount:
          type: number
        payment_token:
          type: string
          description: "Tokenized payment info from payment processor"
        check_number:
          type: string
          nullable: true

    # ─────────────────────────────────────────────────────────────────
    # DOCUMENTS
    # ─────────────────────────────────────────────────────────────────
    DocumentLink:
      type: object
      properties:
        document_id:
          type: string
          format: uuid
        document_type:
          type: string
          enum: [INVOICE, PACKING_LIST, BOL, MTR, COC, POD, QUOTE, PO_ACKNOWLEDGMENT, WEIGHT_TICKET, PHOTO]
        name:
          type: string
        url:
          type: string
          description: "Signed URL, expires in 1 hour"
        created_at:
          type: string
          format: date-time
        size_bytes:
          type: integer

    # ─────────────────────────────────────────────────────────────────
    # COMMON
    # ─────────────────────────────────────────────────────────────────
    Address:
      type: object
      properties:
        name:
          type: string
        company:
          type: string
        line1:
          type: string
        line2:
          type: string
        city:
          type: string
        state:
          type: string
        postal_code:
          type: string
        country:
          type: string
          default: US
        phone:
          type: string
        email:
          type: string
        delivery_instructions:
          type: string

    Pagination:
      type: object
      properties:
        page:
          type: integer
        page_size:
          type: integer
        total_items:
          type: integer
        total_pages:
          type: integer

    Error:
      type: object
      properties:
        code:
          type: string
        message:
          type: string
        details:
          type: array
          items:
            type: object
            properties:
              field:
                type: string
              message:
                type: string

paths:
  # ─────────────────────────────────────────────────────────────────
  # CATALOG
  # ─────────────────────────────────────────────────────────────────
  /catalog/categories:
    get:
      tags: [Catalog]
      summary: List product categories
      operationId: listCategories
      parameters:
        - name: parent_id
          in: query
          schema:
            type: string
        - name: include_products
          in: query
          schema:
            type: boolean
            default: false
      responses:
        '200':
          description: Category tree
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/ProductCategory'

  /catalog/products:
    get:
      tags: [Catalog]
      summary: Search/list products
      operationId: listProducts
      parameters:
        - name: category_id
          in: query
          schema:
            type: string
        - name: form
          in: query
          schema:
            type: string
        - name: grade
          in: query
          schema:
            type: string
        - name: thickness_min
          in: query
          schema:
            type: number
        - name: thickness_max
          in: query
          schema:
            type: number
        - name: width_min
          in: query
          schema:
            type: number
        - name: width_max
          in: query
          schema:
            type: number
        - name: availability
          in: query
          schema:
            type: string
            enum: [IN_STOCK, ALL]
        - name: search
          in: query
          schema:
            type: string
        - name: sort
          in: query
          schema:
            type: string
            enum: [name, price, availability, lead_time]
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: page_size
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: Product list
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/ProductSummary'
                  pagination:
                    $ref: '#/components/schemas/Pagination'
                  facets:
                    type: object
                    properties:
                      forms:
                        type: array
                        items:
                          type: object
                          properties:
                            value:
                              type: string
                            count:
                              type: integer
                      grades:
                        type: array
                        items:
                          type: object
                      thickness_ranges:
                        type: array
                        items:
                          type: object

  /catalog/products/{product_id}:
    get:
      tags: [Catalog]
      summary: Get product details
      operationId: getProduct
      parameters:
        - name: product_id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Product detail
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProductDetail'

  # ─────────────────────────────────────────────────────────────────
  # INVENTORY
  # ─────────────────────────────────────────────────────────────────
  /inventory:
    get:
      tags: [Inventory]
      summary: Search available inventory
      operationId: searchInventory
      parameters:
        - name: product_id
          in: query
          schema:
            type: string
        - name: grade
          in: query
          schema:
            type: string
        - name: thickness
          in: query
          schema:
            type: number
        - name: width_min
          in: query
          schema:
            type: number
        - name: width_max
          in: query
          schema:
            type: number
        - name: location_id
          in: query
          schema:
            type: string
        - name: min_weight
          in: query
          schema:
            type: number
        - name: quality_status
          in: query
          schema:
            type: string
            enum: [PRIME, SECONDARY, EXCESS]
        - name: page
          in: query
          schema:
            type: integer
        - name: page_size
          in: query
          schema:
            type: integer
      responses:
        '200':
          description: Inventory list
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/InventoryItem'
                  pagination:
                    $ref: '#/components/schemas/Pagination'

  /inventory/check-availability:
    post:
      tags: [Inventory]
      summary: Check product availability
      operationId: checkAvailability
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/AvailabilityCheck'
      responses:
        '200':
          description: Availability results
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/AvailabilityResult'

  # ─────────────────────────────────────────────────────────────────
  # RFQ
  # ─────────────────────────────────────────────────────────────────
  /rfq:
    get:
      tags: [RFQ]
      summary: List customer's RFQs
      operationId: listRFQs
      parameters:
        - name: status
          in: query
          schema:
            type: string
        - name: page
          in: query
          schema:
            type: integer
        - name: page_size
          in: query
          schema:
            type: integer
      responses:
        '200':
          description: RFQ list
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/RFQResponse'
                  pagination:
                    $ref: '#/components/schemas/Pagination'
    post:
      tags: [RFQ]
      summary: Submit new RFQ
      operationId: submitRFQ
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RFQRequest'
      responses:
        '201':
          description: RFQ created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RFQResponse'

  /rfq/{rfq_id}:
    get:
      tags: [RFQ]
      summary: Get RFQ details
      operationId: getRFQ
      parameters:
        - name: rfq_id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: RFQ detail
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RFQRequest'

  # ─────────────────────────────────────────────────────────────────
  # QUOTES
  # ─────────────────────────────────────────────────────────────────
  /quotes:
    get:
      tags: [Quotes]
      summary: List quotes for customer
      operationId: listQuotes
      parameters:
        - name: status
          in: query
          schema:
            type: string
        - name: page
          in: query
          schema:
            type: integer
      responses:
        '200':
          description: Quote list
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Quote'
                  pagination:
                    $ref: '#/components/schemas/Pagination'

  /quotes/{quote_id}:
    get:
      tags: [Quotes]
      summary: Get quote details
      operationId: getQuote
      parameters:
        - name: quote_id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Quote detail
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Quote'

  /quotes/{quote_id}/accept:
    post:
      tags: [Quotes]
      summary: Accept quote and create order
      operationId: acceptQuote
      parameters:
        - name: quote_id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/QuoteAcceptance'
      responses:
        '201':
          description: Order created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Order'

  /quotes/{quote_id}/decline:
    post:
      tags: [Quotes]
      summary: Decline quote
      operationId: declineQuote
      parameters:
        - name: quote_id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                reason:
                  type: string
                feedback:
                  type: string
      responses:
        '200':
          description: Quote declined

  # ─────────────────────────────────────────────────────────────────
  # ORDERS
  # ─────────────────────────────────────────────────────────────────
  /orders:
    get:
      tags: [Orders]
      summary: List customer orders
      operationId: listOrders
      parameters:
        - name: status
          in: query
          schema:
            type: string
        - name: date_from
          in: query
          schema:
            type: string
            format: date
        - name: date_to
          in: query
          schema:
            type: string
            format: date
        - name: page
          in: query
          schema:
            type: integer
      responses:
        '200':
          description: Order list
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Order'
                  pagination:
                    $ref: '#/components/schemas/Pagination'
    post:
      tags: [Orders]
      summary: Create new order
      operationId: createOrder
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/OrderCreate'
      responses:
        '201':
          description: Order created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Order'
        '400':
          description: Validation error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /orders/{order_id}:
    get:
      tags: [Orders]
      summary: Get order details
      operationId: getOrder
      parameters:
        - name: order_id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Order detail
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Order'

  /orders/{order_id}/cancel:
    post:
      tags: [Orders]
      summary: Request order cancellation
      operationId: cancelOrder
      parameters:
        - name: order_id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                reason:
                  type: string
      responses:
        '200':
          description: Cancellation requested

  # ─────────────────────────────────────────────────────────────────
  # SHIPMENTS
  # ─────────────────────────────────────────────────────────────────
  /shipments:
    get:
      tags: [Shipments]
      summary: List shipments
      operationId: listShipments
      parameters:
        - name: order_id
          in: query
          schema:
            type: string
        - name: status
          in: query
          schema:
            type: string
        - name: page
          in: query
          schema:
            type: integer
      responses:
        '200':
          description: Shipment list

  /shipments/{shipment_id}:
    get:
      tags: [Shipments]
      summary: Get shipment details with tracking
      operationId: getShipment
      parameters:
        - name: shipment_id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Shipment detail
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Shipment'

  /shipments/{shipment_id}/pod:
    post:
      tags: [Shipments]
      summary: Submit proof of delivery
      operationId: submitPOD
      parameters:
        - name: shipment_id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                signature:
                  type: string
                  format: binary
                received_by:
                  type: string
                notes:
                  type: string
      responses:
        '200':
          description: POD submitted

  # ─────────────────────────────────────────────────────────────────
  # INVOICES
  # ─────────────────────────────────────────────────────────────────
  /invoices:
    get:
      tags: [Invoices]
      summary: List invoices
      operationId: listInvoices
      parameters:
        - name: status
          in: query
          schema:
            type: string
        - name: page
          in: query
          schema:
            type: integer
      responses:
        '200':
          description: Invoice list

  /invoices/{invoice_id}:
    get:
      tags: [Invoices]
      summary: Get invoice details
      operationId: getInvoice
      parameters:
        - name: invoice_id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Invoice detail
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Invoice'

  /invoices/{invoice_id}/pdf:
    get:
      tags: [Invoices]
      summary: Download invoice PDF
      operationId: downloadInvoice
      parameters:
        - name: invoice_id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: PDF file
          content:
            application/pdf:
              schema:
                type: string
                format: binary

  /payments:
    post:
      tags: [Payments]
      summary: Submit payment
      operationId: submitPayment
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PaymentSubmit'
      responses:
        '200':
          description: Payment processed

  # ─────────────────────────────────────────────────────────────────
  # DOCUMENTS
  # ─────────────────────────────────────────────────────────────────
  /documents:
    get:
      tags: [Documents]
      summary: List available documents
      operationId: listDocuments
      parameters:
        - name: entity_type
          in: query
          schema:
            type: string
            enum: [order, shipment, invoice, quote]
        - name: entity_id
          in: query
          schema:
            type: string
        - name: document_type
          in: query
          schema:
            type: string
        - name: page
          in: query
          schema:
            type: integer
      responses:
        '200':
          description: Document list

  /documents/{document_id}:
    get:
      tags: [Documents]
      summary: Get document download URL
      operationId: getDocument
      parameters:
        - name: document_id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Document with signed URL

  # ─────────────────────────────────────────────────────────────────
  # ACCOUNT
  # ─────────────────────────────────────────────────────────────────
  /account:
    get:
      tags: [Account]
      summary: Get account details
      operationId: getAccount
      responses:
        '200':
          description: Account info

  /account/addresses:
    get:
      tags: [Account]
      summary: List saved addresses
      operationId: listAddresses
      responses:
        '200':
          description: Address list
    post:
      tags: [Account]
      summary: Add new address
      operationId: addAddress
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Address'
      responses:
        '201':
          description: Address created

  /account/contacts:
    get:
      tags: [Account]
      summary: List authorized contacts
      operationId: listContacts
      responses:
        '200':
          description: Contact list

  /account/credit:
    get:
      tags: [Account]
      summary: Get credit status
      operationId: getCreditStatus
      responses:
        '200':
          description: Credit info
          content:
            application/json:
              schema:
                type: object
                properties:
                  credit_limit:
                    type: number
                  available_credit:
                    type: number
                  current_balance:
                    type: number
                  past_due_amount:
                    type: number
                  payment_terms:
                    type: string

  /account/statement:
    get:
      tags: [Account]
      summary: Get account statement
      operationId: getStatement
      parameters:
        - name: from_date
          in: query
          schema:
            type: string
            format: date
        - name: to_date
          in: query
          schema:
            type: string
            format: date
      responses:
        '200':
          description: Account statement

  # ─────────────────────────────────────────────────────────────────
  # NOTIFICATIONS
  # ─────────────────────────────────────────────────────────────────
  /notifications:
    get:
      tags: [Notifications]
      summary: List notifications
      operationId: listNotifications
      parameters:
        - name: unread_only
          in: query
          schema:
            type: boolean
        - name: page
          in: query
          schema:
            type: integer
      responses:
        '200':
          description: Notification list

  /notifications/{notification_id}/read:
    post:
      tags: [Notifications]
      summary: Mark notification as read
      operationId: markRead
      parameters:
        - name: notification_id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Marked as read

  /notifications/preferences:
    get:
      tags: [Notifications]
      summary: Get notification preferences
      operationId: getNotificationPrefs
      responses:
        '200':
          description: Preferences
    put:
      tags: [Notifications]
      summary: Update notification preferences
      operationId: updateNotificationPrefs
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                order_updates:
                  type: object
                  properties:
                    email:
                      type: boolean
                    sms:
                      type: boolean
                    push:
                      type: boolean
                shipment_updates:
                  type: object
                invoice_reminders:
                  type: object
                quote_notifications:
                  type: object
      responses:
        '200':
          description: Preferences updated
```

---

## 2. RFQ to Order Flow — State Machine

```yaml
rfq_to_order_state_machine:

  # ═══════════════════════════════════════════════════════════════════
  # RFQ STATE MACHINE
  # ═══════════════════════════════════════════════════════════════════
  rfq_states:
    DRAFT:
      description: "Customer building RFQ, not yet submitted"
      entry_actions:
        - create_rfq_record
        - assign_rfq_number
      allowed_transitions:
        - to: SUBMITTED
          trigger: customer_submits
          guard: has_at_least_one_item
          actions:
            - validate_all_items
            - notify_sales_team
            - send_customer_confirmation

    SUBMITTED:
      description: "RFQ received, pending assignment"
      entry_actions:
        - record_submission_time
        - start_sla_timer
        - auto_assign_sales_rep_if_account_has_one
      allowed_transitions:
        - to: UNDER_REVIEW
          trigger: sales_rep_claims
          actions:
            - assign_to_rep
            - notify_customer_of_assignment
        - to: UNDER_REVIEW
          trigger: auto_assignment_timeout
          actions:
            - assign_to_available_rep
        - to: DECLINED
          trigger: auto_decline
          guard: product_not_offered
          actions:
            - set_decline_reason
            - notify_customer

    UNDER_REVIEW:
      description: "Sales rep analyzing RFQ"
      entry_actions:
        - check_inventory_availability
        - pull_customer_pricing
        - check_credit_status
      allowed_transitions:
        - to: NEEDS_CLARIFICATION
          trigger: rep_requests_info
          actions:
            - create_clarification_request
            - notify_customer
            - pause_sla_timer
        - to: QUOTED
          trigger: rep_creates_quote
          actions:
            - create_quote_from_rfq
            - link_quote_to_rfq
        - to: DECLINED
          trigger: rep_declines
          actions:
            - set_decline_reason
            - notify_customer

    NEEDS_CLARIFICATION:
      description: "Waiting for customer response"
      entry_actions:
        - start_clarification_timer
      allowed_transitions:
        - to: UNDER_REVIEW
          trigger: customer_responds
          actions:
            - update_rfq_details
            - resume_sla_timer
            - notify_sales_rep
        - to: EXPIRED
          trigger: clarification_timeout
          guard: no_response_in_7_days
          actions:
            - notify_customer_of_expiration
            - notify_sales_rep

    QUOTED:
      description: "Quote generated and sent"
      entry_actions:
        - stop_rfq_sla_timer
        - record_rfq_completion_time
      final: true

    DECLINED:
      description: "RFQ declined by vendor"
      entry_actions:
        - record_decline_reason
        - notify_customer
      final: true

    EXPIRED:
      description: "RFQ expired without quote"
      entry_actions:
        - archive_rfq
      final: true

  # ═══════════════════════════════════════════════════════════════════
  # QUOTE STATE MACHINE
  # ═══════════════════════════════════════════════════════════════════
  quote_states:
    DRAFT:
      description: "Quote being prepared"
      entry_actions:
        - create_quote_record
        - assign_quote_number
        - copy_rfq_details_if_from_rfq
      allowed_transitions:
        - to: PENDING_APPROVAL
          trigger: rep_submits_for_approval
          guard: requires_approval
          actions:
            - route_to_approver
            - notify_approver
        - to: SENT
          trigger: rep_sends_quote
          guard: no_approval_required
          actions:
            - generate_quote_pdf
            - email_to_customer
            - record_sent_time
            - set_expiration_date

    PENDING_APPROVAL:
      description: "Quote awaiting internal approval"
      entry_actions:
        - determine_approval_level
        - notify_approvers
      allowed_transitions:
        - to: SENT
          trigger: approved
          actions:
            - record_approval
            - generate_quote_pdf
            - email_to_customer
            - set_expiration_date
        - to: DRAFT
          trigger: rejected
          actions:
            - record_rejection_reason
            - notify_sales_rep

    SENT:
      description: "Quote sent to customer"
      entry_actions:
        - start_quote_validity_timer
        - schedule_follow_up_reminders
      allowed_transitions:
        - to: VIEWED
          trigger: customer_opens_quote
          actions:
            - record_view_time
            - notify_sales_rep
        - to: ACCEPTED
          trigger: customer_accepts
          actions:
            - validate_still_valid
            - check_pricing_still_valid
            - create_order_from_quote
        - to: DECLINED
          trigger: customer_declines
          actions:
            - record_decline_reason
            - trigger_win_back_workflow
        - to: EXPIRED
          trigger: validity_period_ends
          actions:
            - notify_customer
            - notify_sales_rep
        - to: REVISED
          trigger: rep_revises
          actions:
            - create_new_version
            - link_to_previous

    VIEWED:
      description: "Customer has viewed quote"
      entry_actions:
        - record_first_view_time
        - notify_sales_rep_of_engagement
      allowed_transitions:
        - to: ACCEPTED
          trigger: customer_accepts
          actions:
            - validate_still_valid
            - create_order_from_quote
        - to: DECLINED
          trigger: customer_declines
          actions:
            - record_decline_reason
        - to: EXPIRED
          trigger: validity_period_ends
        - to: REVISED
          trigger: rep_revises

    ACCEPTED:
      description: "Quote accepted, order created"
      entry_actions:
        - create_order
        - notify_sales_rep
        - trigger_order_workflow
      final: true

    DECLINED:
      description: "Quote declined by customer"
      entry_actions:
        - record_decline_time
        - record_decline_reason
        - update_lost_opportunity
      final: true

    EXPIRED:
      description: "Quote validity period ended"
      entry_actions:
        - mark_as_expired
        - notify_sales_for_follow_up
      allowed_transitions:
        - to: REVISED
          trigger: rep_reissues
          actions:
            - create_new_version
            - recalculate_pricing

    REVISED:
      description: "Quote superseded by new version"
      entry_actions:
        - link_to_new_version
      final: true

  # ═══════════════════════════════════════════════════════════════════
  # ORDER STATE MACHINE (from quote/direct)
  # ═══════════════════════════════════════════════════════════════════
  order_states:
    PENDING_CREDIT:
      description: "Order pending credit approval"
      entry_actions:
        - check_credit_limit
        - check_past_due
      allowed_transitions:
        - to: PENDING_APPROVAL
          trigger: credit_approved
          actions:
            - release_credit_hold
        - to: CREDIT_HOLD
          trigger: credit_failed
          actions:
            - notify_customer
            - notify_credit_team

    CREDIT_HOLD:
      description: "Order on credit hold"
      entry_actions:
        - notify_ar_team
        - notify_sales_rep
      allowed_transitions:
        - to: PENDING_APPROVAL
          trigger: credit_cleared
          actions:
            - record_credit_override
        - to: CANCELLED
          trigger: customer_cancels
          actions:
            - release_reservations

    PENDING_APPROVAL:
      description: "Order pending internal approval"
      entry_actions:
        - route_for_approval
      allowed_transitions:
        - to: CONFIRMED
          trigger: approved
          actions:
            - send_order_confirmation
            - create_work_orders_if_processing
            - allocate_inventory
        - to: CANCELLED
          trigger: rejected
          actions:
            - notify_customer
            - record_rejection_reason

    CONFIRMED:
      description: "Order confirmed, in processing"
      entry_actions:
        - send_order_acknowledgment
        - schedule_production_if_needed
        - reserve_inventory
      allowed_transitions:
        - to: IN_PRODUCTION
          trigger: work_order_started
          guard: has_processing
        - to: READY_TO_SHIP
          trigger: all_items_ready
          guard: no_processing_required
        - to: PARTIALLY_SHIPPED
          trigger: partial_shipment_created
        - to: CANCELLED
          trigger: cancellation_approved
          actions:
            - release_inventory
            - cancel_work_orders

    IN_PRODUCTION:
      description: "Processing work orders in progress"
      entry_actions:
        - update_customer_with_eta
      allowed_transitions:
        - to: READY_TO_SHIP
          trigger: all_work_orders_complete
          actions:
            - notify_shipping
            - update_customer
        - to: PARTIALLY_SHIPPED
          trigger: partial_shipment

    READY_TO_SHIP:
      description: "All items ready, pending shipment"
      entry_actions:
        - notify_shipping_desk
        - generate_pick_list
      allowed_transitions:
        - to: PARTIALLY_SHIPPED
          trigger: partial_shipment_dispatched
        - to: SHIPPED
          trigger: full_shipment_dispatched

    PARTIALLY_SHIPPED:
      description: "Some items shipped"
      entry_actions:
        - update_quantities
        - send_shipment_notification
      allowed_transitions:
        - to: SHIPPED
          trigger: remaining_items_shipped
        - to: COMPLETED
          trigger: customer_accepts_partial
          actions:
            - close_order
            - create_credit_for_unshipped

    SHIPPED:
      description: "All items shipped"
      entry_actions:
        - send_final_shipment_notification
        - generate_invoice_if_ship_complete
      allowed_transitions:
        - to: DELIVERED
          trigger: delivery_confirmed
          actions:
            - record_pod
        - to: COMPLETED
          trigger: auto_complete
          guard: delivery_timeout_reached

    DELIVERED:
      description: "Shipment delivered"
      entry_actions:
        - record_delivery_time
        - trigger_invoice_if_not_done
      allowed_transitions:
        - to: COMPLETED
          trigger: invoice_paid_or_aging
        - to: RETURN_REQUESTED
          trigger: customer_initiates_return

    COMPLETED:
      description: "Order fully completed"
      entry_actions:
        - archive_order
        - update_customer_history
        - trigger_satisfaction_survey
      final: true

    CANCELLED:
      description: "Order cancelled"
      entry_actions:
        - release_all_allocations
        - notify_all_parties
        - create_credit_if_prepaid
      final: true

    RETURN_REQUESTED:
      description: "Customer requested return"
      entry_actions:
        - create_return_ticket
        - notify_customer_service
      allowed_transitions:
        - to: RETURN_APPROVED
          trigger: return_approved
          actions:
            - issue_rma
            - send_return_instructions
        - to: COMPLETED
          trigger: return_denied
          actions:
            - notify_customer

    RETURN_APPROVED:
      description: "Return approved, pending receipt"
      entry_actions:
        - generate_rma_number
        - send_return_label
      allowed_transitions:
        - to: COMPLETED
          trigger: return_received
          actions:
            - inspect_return
            - issue_credit_or_replacement

  # ═══════════════════════════════════════════════════════════════════
  # FLOW DIAGRAM (ASCII)
  # ═══════════════════════════════════════════════════════════════════
  flow_diagram: |
    
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                        RFQ TO ORDER FLOW                                 │
    └─────────────────────────────────────────────────────────────────────────┘
    
    CUSTOMER PORTAL                    INTERNAL SYSTEMS                FULFILLMENT
    ──────────────────                ─────────────────                ───────────
    
    ┌──────────────┐
    │ Browse       │
    │ Catalog      │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐     
    │ Check        │     
    │ Availability │     
    └──────┬───────┘     
           │
           ├─────────────────────────────────────┐
           ▼                                     │
    ┌──────────────┐                             │
    │ Create RFQ   │◄────────────────────────────┘
    │ (DRAFT)      │     Need custom quote
    └──────┬───────┘
           │ Submit
           ▼
    ┌──────────────┐     ┌──────────────┐
    │ SUBMITTED    │────►│ Auto-assign  │
    └──────────────┘     │ Sales Rep    │
                         └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │ UNDER_REVIEW │◄───────────┐
                         └──────┬───────┘            │
                                │                    │
                    ┌───────────┼───────────┐       │
                    ▼           ▼           ▼       │
             ┌───────────┐ ┌─────────┐ ┌─────────┐ │
             │ NEEDS     │ │ Create  │ │ DECLINE │ │
             │ CLARIFY   │ │ Quote   │ └─────────┘ │
             └─────┬─────┘ └────┬────┘             │
                   │            │                  │
                   │            ▼                  │
                   │     ┌──────────────┐          │
                   │     │ Quote DRAFT  │          │
                   │     └──────┬───────┘          │
                   │            │                  │
                   │            ▼                  │
                   │     ┌──────────────┐          │
                   │     │ PENDING      │──────────┘
                   │     │ APPROVAL     │  Rejected
                   │     └──────┬───────┘
                   │            │ Approved
                   │            ▼
                   │     ┌──────────────┐
                   └────►│ Quote SENT   │
    Customer              └──────┬───────┘
    responds                     │
                                 ▼
                         ┌──────────────┐
    ┌──────────────┐     │ Quote VIEWED │
    │ View Quote   │◄────┤              │
    └──────┬───────┘     └──────┬───────┘
           │                    │
           ├─────────┐          │
           ▼         ▼          ▼
    ┌──────────┐ ┌─────────┐ ┌─────────┐
    │ ACCEPT   │ │ DECLINE │ │ EXPIRED │
    └────┬─────┘ └─────────┘ └─────────┘
         │
         ▼
    ┌──────────────┐     ┌──────────────┐
    │ Submit Order │────►│ Credit Check │
    │ (+ PO #)     │     └──────┬───────┘
    └──────────────┘            │
                         ┌──────┴──────┐
                         ▼             ▼
                  ┌───────────┐  ┌───────────┐
                  │ CREDIT    │  │ PENDING   │
                  │ HOLD      │  │ APPROVAL  │
                  └─────┬─────┘  └─────┬─────┘
                        │              │
                        │              ▼
                        │       ┌───────────┐
                        └──────►│ CONFIRMED │
                                └─────┬─────┘
                                      │
                          ┌───────────┴───────────┐
                          ▼                       ▼
                   ┌─────────────┐         ┌───────────┐
                   │ IN_PROD     │         │ READY TO  │
                   │ (Work Ord)  │         │ SHIP      │
                   └──────┬──────┘         └─────┬─────┘
                          │                      │
                          └──────────┬───────────┘
                                     ▼
                              ┌─────────────┐
                              │ SHIPPED     │────────────────┐
                              └──────┬──────┘                │
                                     │                       ▼
                                     ▼              ┌──────────────┐
                              ┌─────────────┐       │ Tracking     │
                              │ DELIVERED   │◄──────│ Updates      │
                              └──────┬──────┘       └──────────────┘
                                     │
                                     ▼
    ┌──────────────┐          ┌─────────────┐
    │ View Invoice │◄─────────│ COMPLETED   │
    │ Pay Online   │          └─────────────┘
    └──────────────┘

  sla_rules:
    rfq_response:
      target: 4_hours_business
      warning: 2_hours
      escalation:
        - at: 4_hours
          action: escalate_to_sales_manager
        - at: 8_hours
          action: escalate_to_vp_sales

    quote_validity:
      default: 30_days
      custom_by_amount:
        - above: 100000
          validity: 60_days
        - above: 500000
          validity: 90_days

    order_confirmation:
      target: 2_hours_business
      auto_confirm:
        conditions:
          - credit_approved
          - no_processing
          - inventory_available
          - below_auto_approve_threshold
```

---

## 3. Portal Access — Permission Matrix

```yaml
portal_permission_matrix:

  # ═══════════════════════════════════════════════════════════════════
  # PORTAL ROLES
  # ═══════════════════════════════════════════════════════════════════
  portal_roles:
    - role_id: PORTAL_ADMIN
      name: "Customer Admin"
      description: "Full access to customer account, manages other users"
      
    - role_id: PORTAL_BUYER
      name: "Buyer"
      description: "Can create orders and RFQs, view account info"
      
    - role_id: PORTAL_VIEWER
      name: "Viewer"
      description: "Read-only access to orders and documents"
      
    - role_id: PORTAL_RECEIVER
      name: "Receiver"
      description: "Confirm deliveries, report issues"
      
    - role_id: PORTAL_FINANCE
      name: "Finance"
      description: "View/pay invoices, access financial reports"

  # ═══════════════════════════════════════════════════════════════════
  # PERMISSION MATRIX: ROLE × CAPABILITY
  # ═══════════════════════════════════════════════════════════════════
  # Legend: ✓ = allowed, ○ = read-only, — = denied, △ = conditional

  capabilities_by_role:
    catalog:
      browse_products:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: ✓
        PORTAL_VIEWER: ✓
        PORTAL_RECEIVER: ○
        PORTAL_FINANCE: ○
      view_pricing:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: ✓
        PORTAL_VIEWER: △  # If allowed by customer settings
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: ✓
      view_inventory:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: ✓
        PORTAL_VIEWER: △
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: —
      download_specs:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: ✓
        PORTAL_VIEWER: ✓
        PORTAL_RECEIVER: ✓
        PORTAL_FINANCE: ○

    rfq:
      create_rfq:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: ✓
        PORTAL_VIEWER: —
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: —
      view_own_rfq:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: ✓
        PORTAL_VIEWER: ✓
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: —
      view_all_rfq:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: △  # If division allows
        PORTAL_VIEWER: △
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: —
      cancel_rfq:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: ✓  # Own only
        PORTAL_VIEWER: —
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: —

    quotes:
      view_quotes:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: ✓
        PORTAL_VIEWER: ✓
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: ✓
      accept_quote:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: ✓
        PORTAL_VIEWER: —
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: —
      decline_quote:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: ✓
        PORTAL_VIEWER: —
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: —
      request_revision:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: ✓
        PORTAL_VIEWER: —
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: —

    orders:
      create_order:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: ✓
        PORTAL_VIEWER: —
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: —
      view_own_orders:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: ✓
        PORTAL_VIEWER: ✓
        PORTAL_RECEIVER: ✓
        PORTAL_FINANCE: ✓
      view_all_orders:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: △
        PORTAL_VIEWER: △
        PORTAL_RECEIVER: △
        PORTAL_FINANCE: ✓
      modify_order:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: △  # Before confirmed
        PORTAL_VIEWER: —
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: —
      cancel_order:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: △  # Before shipped
        PORTAL_VIEWER: —
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: —
      reorder:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: ✓
        PORTAL_VIEWER: —
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: —

    shipments:
      view_shipments:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: ✓
        PORTAL_VIEWER: ✓
        PORTAL_RECEIVER: ✓
        PORTAL_FINANCE: ✓
      track_shipment:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: ✓
        PORTAL_VIEWER: ✓
        PORTAL_RECEIVER: ✓
        PORTAL_FINANCE: ○
      confirm_delivery:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: ✓
        PORTAL_VIEWER: —
        PORTAL_RECEIVER: ✓
        PORTAL_FINANCE: —
      report_issue:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: ✓
        PORTAL_VIEWER: —
        PORTAL_RECEIVER: ✓
        PORTAL_FINANCE: —
      request_return:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: ✓
        PORTAL_VIEWER: —
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: —

    invoices:
      view_invoices:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: △  # If pricing visible
        PORTAL_VIEWER: —
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: ✓
      download_invoice:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: △
        PORTAL_VIEWER: —
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: ✓
      make_payment:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: —
        PORTAL_VIEWER: —
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: ✓
      view_statements:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: —
        PORTAL_VIEWER: —
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: ✓
      dispute_invoice:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: —
        PORTAL_VIEWER: —
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: ✓

    documents:
      view_documents:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: ✓
        PORTAL_VIEWER: ✓
        PORTAL_RECEIVER: ✓
        PORTAL_FINANCE: ✓
      download_mtr:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: ✓
        PORTAL_VIEWER: ✓
        PORTAL_RECEIVER: ✓
        PORTAL_FINANCE: ○
      download_bol:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: ✓
        PORTAL_VIEWER: ✓
        PORTAL_RECEIVER: ✓
        PORTAL_FINANCE: ○
      download_coc:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: ✓
        PORTAL_VIEWER: ✓
        PORTAL_RECEIVER: ✓
        PORTAL_FINANCE: ○
      request_document:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: ✓
        PORTAL_VIEWER: —
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: —

    account:
      view_account:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: ○
        PORTAL_VIEWER: ○
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: ○
      edit_account:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: —
        PORTAL_VIEWER: —
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: —
      manage_addresses:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: ✓
        PORTAL_VIEWER: —
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: —
      manage_users:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: —
        PORTAL_VIEWER: —
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: —
      view_credit:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: —
        PORTAL_VIEWER: —
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: ✓
      manage_notifications:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: ✓  # Own only
        PORTAL_VIEWER: ✓
        PORTAL_RECEIVER: ✓
        PORTAL_FINANCE: ✓
      view_api_keys:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: —
        PORTAL_VIEWER: —
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: —
      create_api_keys:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: —
        PORTAL_VIEWER: —
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: —

    reports:
      view_order_history:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: ✓
        PORTAL_VIEWER: ✓
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: ✓
      export_order_data:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: ✓
        PORTAL_VIEWER: —
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: ✓
      view_spend_analytics:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: —
        PORTAL_VIEWER: —
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: ✓
      schedule_reports:
        PORTAL_ADMIN: ✓
        PORTAL_BUYER: —
        PORTAL_VIEWER: —
        PORTAL_RECEIVER: —
        PORTAL_FINANCE: ✓

  # ═══════════════════════════════════════════════════════════════════
  # SCOPING RULES
  # ═══════════════════════════════════════════════════════════════════
  scoping:
    customer_scope:
      description: "Portal users only see their own customer's data"
      enforcement: "customer_id from JWT claim"
      
    division_scope:
      description: "Multi-division customers can restrict by division"
      enforcement: "division_ids from user profile"
      applicable_to:
        - orders
        - invoices
        - shipments
        - rfqs
        - quotes

    location_scope:
      description: "Users can be restricted to specific ship-to locations"
      enforcement: "location_ids from user profile"
      applicable_to:
        - shipments
        - delivery_confirmation

    created_by_scope:
      description: "Users see only entities they created"
      enforcement: "created_by_user_id match"
      configurable: true
      default: false

  # ═══════════════════════════════════════════════════════════════════
  # APPROVAL WORKFLOWS
  # ═══════════════════════════════════════════════════════════════════
  approval_workflows:
    order_approval:
      enabled: configurable_per_customer
      rules:
        - condition: "order_total > customer.order_approval_threshold"
          requires: "PORTAL_ADMIN approval"
        - condition: "new_ship_to_address"
          requires: "PORTAL_ADMIN approval"
        - condition: "expedited_shipping"
          requires: "PORTAL_ADMIN or PORTAL_BUYER with expedite permission"

    payment_approval:
      enabled: configurable_per_customer
      rules:
        - condition: "payment_amount > customer.payment_approval_threshold"
          requires: "PORTAL_ADMIN approval"
        - condition: "new_payment_method"
          requires: "PORTAL_ADMIN approval"

  # ═══════════════════════════════════════════════════════════════════
  # DATA VISIBILITY CONTROLS
  # ═══════════════════════════════════════════════════════════════════
  visibility_controls:
    pricing_visibility:
      setting: customer.portal_settings.show_pricing
      default: true
      affects:
        - product_prices
        - quote_pricing
        - order_totals
        - invoice_viewing
      override_by_role: PORTAL_FINANCE always sees pricing

    inventory_visibility:
      setting: customer.portal_settings.show_inventory
      default: true
      detail_levels:
        - NONE: no inventory shown
        - AVAILABILITY: IN_STOCK / OUT_OF_STOCK only
        - QUANTITY: approximate quantity ranges
        - EXACT: exact quantities and locations

    heat_number_visibility:
      setting: customer.portal_settings.show_heats
      default: true
      affects:
        - inventory search results
        - order line details
        - shipment contents

    competitive_info:
      setting: customer.portal_settings.hide_source
      default: false
      affects:
        - mill_source (hidden if true)
        - vendor_info (hidden if true)
```

---

## 4. Documents — Structured List

```json
{
  "portal_documents": {
    
    "document_categories": [
      {
        "category_id": "SALES",
        "name": "Sales Documents",
        "documents": [
          {
            "document_type": "QUOTE",
            "name": "Quote / Proposal",
            "description": "Formal pricing proposal with terms",
            "generated_by": "system",
            "trigger": "quote_sent",
            "format": "PDF",
            "retention_days": 365,
            "portal_visible": true,
            "downloadable": true,
            "email_attached": true,
            "content_sections": [
              "header_with_logo",
              "customer_info",
              "quote_summary",
              "line_items",
              "pricing_breakdown",
              "terms_and_conditions",
              "validity_statement",
              "acceptance_block"
            ]
          },
          {
            "document_type": "ORDER_ACKNOWLEDGMENT",
            "name": "Order Acknowledgment",
            "description": "Confirmation of order receipt with details",
            "generated_by": "system",
            "trigger": "order_confirmed",
            "format": "PDF",
            "retention_days": 2555,
            "portal_visible": true,
            "downloadable": true,
            "email_attached": true,
            "content_sections": [
              "header_with_logo",
              "order_number_and_date",
              "customer_po_reference",
              "ship_to_address",
              "line_items_with_eta",
              "pricing_summary",
              "payment_terms",
              "contact_info"
            ]
          },
          {
            "document_type": "PRO_FORMA_INVOICE",
            "name": "Pro Forma Invoice",
            "description": "Preliminary invoice for prepayment orders",
            "generated_by": "system",
            "trigger": "prepayment_required",
            "format": "PDF",
            "retention_days": 365,
            "portal_visible": true,
            "downloadable": true,
            "email_attached": true
          }
        ]
      },
      {
        "category_id": "SHIPPING",
        "name": "Shipping Documents",
        "documents": [
          {
            "document_type": "PACKING_LIST",
            "name": "Packing List",
            "description": "Itemized list of shipment contents",
            "generated_by": "system",
            "trigger": "shipment_created",
            "format": "PDF",
            "retention_days": 2555,
            "portal_visible": true,
            "downloadable": true,
            "email_attached": false,
            "content_sections": [
              "shipment_header",
              "ship_from_address",
              "ship_to_address",
              "order_references",
              "line_items",
              "package_details",
              "weight_summary",
              "handling_instructions"
            ]
          },
          {
            "document_type": "BOL",
            "name": "Bill of Lading",
            "description": "Carrier shipping document",
            "generated_by": "system",
            "trigger": "shipment_dispatched",
            "format": "PDF",
            "retention_days": 2555,
            "portal_visible": true,
            "downloadable": true,
            "email_attached": false,
            "content_sections": [
              "shipper_info",
              "consignee_info",
              "carrier_info",
              "freight_description",
              "weight_and_class",
              "special_instructions",
              "signature_blocks"
            ],
            "variants": [
              {
                "type": "STRAIGHT_BOL",
                "use": "Standard shipments"
              },
              {
                "type": "ORDER_BOL",
                "use": "Negotiable shipments"
              },
              {
                "type": "UNIFORM_BOL",
                "use": "VICS standard format"
              }
            ]
          },
          {
            "document_type": "WEIGHT_TICKET",
            "name": "Weight Ticket",
            "description": "Certified scale weight documentation",
            "generated_by": "scale_system",
            "trigger": "truck_weighed",
            "format": "PDF",
            "retention_days": 2555,
            "portal_visible": true,
            "downloadable": true,
            "email_attached": false
          },
          {
            "document_type": "DELIVERY_RECEIPT",
            "name": "Delivery Receipt",
            "description": "Proof of delivery confirmation",
            "generated_by": "driver_app_or_carrier",
            "trigger": "delivery_confirmed",
            "format": "PDF",
            "retention_days": 2555,
            "portal_visible": true,
            "downloadable": true,
            "email_attached": true,
            "content_sections": [
              "delivery_confirmation",
              "recipient_signature",
              "delivery_timestamp",
              "condition_notes",
              "photo_attachments"
            ]
          },
          {
            "document_type": "SHIPPING_LABEL",
            "name": "Shipping Label",
            "description": "Carrier-formatted shipping label",
            "generated_by": "carrier_api",
            "trigger": "shipment_created",
            "format": "PDF|ZPL",
            "retention_days": 90,
            "portal_visible": false,
            "downloadable": false
          }
        ]
      },
      {
        "category_id": "QUALITY",
        "name": "Quality Documents",
        "documents": [
          {
            "document_type": "MTR",
            "name": "Mill Test Report",
            "description": "Certified chemical and mechanical properties",
            "generated_by": "mill_or_system",
            "trigger": "heat_received",
            "format": "PDF",
            "retention_days": 3650,
            "portal_visible": true,
            "downloadable": true,
            "email_attached": false,
            "content_sections": [
              "mill_identification",
              "heat_number",
              "grade_specification",
              "chemical_analysis",
              "mechanical_properties",
              "test_results",
              "certification_statement",
              "authorized_signature"
            ],
            "compliance": ["ASTM", "ASME", "AWS"]
          },
          {
            "document_type": "COC",
            "name": "Certificate of Conformance",
            "description": "Statement of specification compliance",
            "generated_by": "system",
            "trigger": "shipment_created_or_requested",
            "format": "PDF",
            "retention_days": 3650,
            "portal_visible": true,
            "downloadable": true,
            "email_attached": false,
            "content_sections": [
              "company_header",
              "order_reference",
              "material_description",
              "specification_references",
              "conformance_statement",
              "authorized_signature",
              "date"
            ]
          },
          {
            "document_type": "INSPECTION_REPORT",
            "name": "Inspection Report",
            "description": "Dimensional and visual inspection results",
            "generated_by": "qa_system",
            "trigger": "inspection_completed",
            "format": "PDF",
            "retention_days": 3650,
            "portal_visible": true,
            "downloadable": true,
            "email_attached": false,
            "content_sections": [
              "inspection_header",
              "material_identification",
              "dimensional_measurements",
              "visual_inspection_results",
              "defect_log",
              "pass_fail_determination",
              "inspector_signature"
            ]
          },
          {
            "document_type": "COATING_CERT",
            "name": "Coating Certificate",
            "description": "Coating weight and type certification",
            "generated_by": "mill_or_system",
            "trigger": "coated_material_received",
            "format": "PDF",
            "retention_days": 3650,
            "portal_visible": true,
            "downloadable": true
          },
          {
            "document_type": "HARDNESS_REPORT",
            "name": "Hardness Test Report",
            "description": "Rockwell/Brinell hardness test results",
            "generated_by": "qa_system",
            "trigger": "hardness_test_completed",
            "format": "PDF",
            "retention_days": 3650,
            "portal_visible": true,
            "downloadable": true
          }
        ]
      },
      {
        "category_id": "BILLING",
        "name": "Billing Documents",
        "documents": [
          {
            "document_type": "INVOICE",
            "name": "Invoice",
            "description": "Commercial invoice for payment",
            "generated_by": "system",
            "trigger": "shipment_complete_or_manual",
            "format": "PDF",
            "retention_days": 2555,
            "portal_visible": true,
            "downloadable": true,
            "email_attached": true,
            "content_sections": [
              "header_with_logo",
              "invoice_number_and_date",
              "customer_billing_info",
              "ship_to_info",
              "po_references",
              "line_items",
              "subtotals",
              "taxes",
              "freight",
              "total_due",
              "payment_terms",
              "payment_instructions",
              "remittance_stub"
            ]
          },
          {
            "document_type": "CREDIT_MEMO",
            "name": "Credit Memo",
            "description": "Credit adjustment document",
            "generated_by": "system",
            "trigger": "credit_issued",
            "format": "PDF",
            "retention_days": 2555,
            "portal_visible": true,
            "downloadable": true,
            "email_attached": true
          },
          {
            "document_type": "DEBIT_MEMO",
            "name": "Debit Memo",
            "description": "Additional charge document",
            "generated_by": "system",
            "trigger": "debit_issued",
            "format": "PDF",
            "retention_days": 2555,
            "portal_visible": true,
            "downloadable": true,
            "email_attached": true
          },
          {
            "document_type": "STATEMENT",
            "name": "Account Statement",
            "description": "Monthly account summary",
            "generated_by": "system",
            "trigger": "monthly_schedule",
            "format": "PDF",
            "retention_days": 2555,
            "portal_visible": true,
            "downloadable": true,
            "email_attached": true,
            "content_sections": [
              "statement_header",
              "account_summary",
              "aging_buckets",
              "transaction_list",
              "credits_applied",
              "balance_forward",
              "payment_instructions"
            ]
          },
          {
            "document_type": "PAYMENT_RECEIPT",
            "name": "Payment Receipt",
            "description": "Confirmation of payment received",
            "generated_by": "system",
            "trigger": "payment_applied",
            "format": "PDF",
            "retention_days": 2555,
            "portal_visible": true,
            "downloadable": true,
            "email_attached": true
          }
        ]
      },
      {
        "category_id": "COMPLIANCE",
        "name": "Compliance Documents",
        "documents": [
          {
            "document_type": "COUNTRY_OF_ORIGIN",
            "name": "Certificate of Origin",
            "description": "Origin certification for trade compliance",
            "generated_by": "system",
            "trigger": "international_shipment",
            "format": "PDF",
            "retention_days": 2555,
            "portal_visible": true,
            "downloadable": true
          },
          {
            "document_type": "COMMERCIAL_INVOICE",
            "name": "Commercial Invoice (Export)",
            "description": "Customs documentation for export",
            "generated_by": "system",
            "trigger": "export_shipment",
            "format": "PDF",
            "retention_days": 2555,
            "portal_visible": true,
            "downloadable": true
          },
          {
            "document_type": "SDS",
            "name": "Safety Data Sheet",
            "description": "OSHA-compliant safety information",
            "generated_by": "manual_upload",
            "trigger": "material_type_requires",
            "format": "PDF",
            "retention_days": 3650,
            "portal_visible": true,
            "downloadable": true
          },
          {
            "document_type": "ROHS_CERT",
            "name": "RoHS Certificate",
            "description": "Hazardous substance compliance",
            "generated_by": "mill_or_manual",
            "trigger": "eu_shipment_or_request",
            "format": "PDF",
            "retention_days": 3650,
            "portal_visible": true,
            "downloadable": true
          },
          {
            "document_type": "CONFLICT_MINERALS",
            "name": "Conflict Minerals Declaration",
            "description": "Dodd-Frank conflict minerals statement",
            "generated_by": "manual",
            "trigger": "customer_request",
            "format": "PDF",
            "retention_days": 3650,
            "portal_visible": true,
            "downloadable": true
          }
        ]
      },
      {
        "category_id": "OPERATIONAL",
        "name": "Operational Documents",
        "documents": [
          {
            "document_type": "LOAD_PHOTO",
            "name": "Load Photo",
            "description": "Photo of loaded truck",
            "generated_by": "mobile_app",
            "trigger": "loading_complete",
            "format": "JPEG",
            "retention_days": 365,
            "portal_visible": true,
            "downloadable": true
          },
          {
            "document_type": "DAMAGE_PHOTO",
            "name": "Damage Photo",
            "description": "Photo documenting damage",
            "generated_by": "mobile_app",
            "trigger": "damage_reported",
            "format": "JPEG",
            "retention_days": 2555,
            "portal_visible": true,
            "downloadable": true
          },
          {
            "document_type": "RMA",
            "name": "Return Material Authorization",
            "description": "Authorization for material return",
            "generated_by": "system",
            "trigger": "return_approved",
            "format": "PDF",
            "retention_days": 2555,
            "portal_visible": true,
            "downloadable": true,
            "email_attached": true
          }
        ]
      }
    ],

    "document_delivery_matrix": {
      "channels": ["portal", "email", "edi", "api"],
      "by_document_type": {
        "QUOTE": {
          "portal": "always",
          "email": "on_send",
          "edi": "never",
          "api": "on_request"
        },
        "ORDER_ACKNOWLEDGMENT": {
          "portal": "always",
          "email": "on_confirm",
          "edi": "if_enabled_856",
          "api": "on_request"
        },
        "PACKING_LIST": {
          "portal": "always",
          "email": "if_subscribed",
          "edi": "if_enabled_856",
          "api": "on_request"
        },
        "BOL": {
          "portal": "always",
          "email": "if_subscribed",
          "edi": "if_enabled_856",
          "api": "on_request"
        },
        "MTR": {
          "portal": "always",
          "email": "if_subscribed",
          "edi": "never",
          "api": "on_request"
        },
        "INVOICE": {
          "portal": "always",
          "email": "always",
          "edi": "if_enabled_810",
          "api": "on_request"
        }
      }
    },

    "document_bundling": {
      "bundles": [
        {
          "bundle_name": "shipment_package",
          "description": "All documents for a shipment",
          "includes": ["PACKING_LIST", "BOL", "WEIGHT_TICKET", "MTR", "COC"],
          "format": "ZIP",
          "portal_action": "Download All Documents"
        },
        {
          "bundle_name": "order_package",
          "description": "All documents for an order",
          "includes": ["ORDER_ACKNOWLEDGMENT", "PACKING_LIST", "BOL", "MTR", "INVOICE"],
          "format": "ZIP"
        },
        {
          "bundle_name": "quality_package",
          "description": "All quality documents for a heat",
          "includes": ["MTR", "COC", "INSPECTION_REPORT", "COATING_CERT", "HARDNESS_REPORT"],
          "format": "ZIP"
        }
      ]
    }
  }
}
```

---

## 5. Webhooks / Events — Event Catalog

```yaml
event_catalog:

  # ═══════════════════════════════════════════════════════════════════
  # WEBHOOK CONFIGURATION
  # ═══════════════════════════════════════════════════════════════════
  webhook_config:
    base_url: "https://api.steelwise.app/v2/webhooks"
    signature_header: "X-SteelWise-Signature"
    signature_algorithm: "HMAC-SHA256"
    timestamp_header: "X-SteelWise-Timestamp"
    version_header: "X-SteelWise-Version"
    retry_policy:
      max_attempts: 5
      backoff: exponential
      initial_delay_seconds: 30
      max_delay_seconds: 3600
    timeout_seconds: 30
    expected_response_codes: [200, 201, 202, 204]

  webhook_registration:
    endpoint: "POST /webhooks"
    payload:
      url: "string (HTTPS required)"
      events: ["array of event types or * for all"]
      secret: "string (for signature verification)"
      active: "boolean"
      description: "string"
    management:
      - "GET /webhooks - list registered webhooks"
      - "GET /webhooks/{id} - get webhook details"
      - "PUT /webhooks/{id} - update webhook"
      - "DELETE /webhooks/{id} - delete webhook"
      - "GET /webhooks/{id}/deliveries - view delivery history"
      - "POST /webhooks/{id}/test - send test event"

  # ═══════════════════════════════════════════════════════════════════
  # EVENT TYPES
  # ═══════════════════════════════════════════════════════════════════
  events:

    # ─────────────────────────────────────────────────────────────────
    # RFQ EVENTS
    # ─────────────────────────────────────────────────────────────────
    rfq:
      - event_type: rfq.created
        description: "New RFQ submitted by customer"
        payload:
          rfq_id: uuid
          rfq_number: string
          customer_id: uuid
          submitted_by: uuid
          item_count: integer
          total_estimated_weight: number
          required_by_date: date
          created_at: timestamp
        use_cases:
          - "Notify sales team"
          - "Trigger CRM activity"
          - "Update customer dashboard"

      - event_type: rfq.assigned
        description: "RFQ assigned to sales rep"
        payload:
          rfq_id: uuid
          rfq_number: string
          assigned_to: uuid
          assigned_by: uuid
          assigned_at: timestamp

      - event_type: rfq.quoted
        description: "Quote generated from RFQ"
        payload:
          rfq_id: uuid
          quote_id: uuid
          quote_number: string
          total_amount: number

      - event_type: rfq.declined
        description: "RFQ declined by vendor"
        payload:
          rfq_id: uuid
          rfq_number: string
          decline_reason: string
          declined_by: uuid
          declined_at: timestamp

    # ─────────────────────────────────────────────────────────────────
    # QUOTE EVENTS
    # ─────────────────────────────────────────────────────────────────
    quote:
      - event_type: quote.created
        description: "New quote created"
        payload:
          quote_id: uuid
          quote_number: string
          customer_id: uuid
          rfq_id: uuid | null
          total_amount: number
          valid_until: date
          created_by: uuid

      - event_type: quote.sent
        description: "Quote sent to customer"
        payload:
          quote_id: uuid
          quote_number: string
          sent_to: string (email)
          sent_at: timestamp
          valid_until: date

      - event_type: quote.viewed
        description: "Customer opened quote"
        payload:
          quote_id: uuid
          quote_number: string
          viewed_by: uuid
          viewed_at: timestamp
          view_count: integer

      - event_type: quote.accepted
        description: "Customer accepted quote"
        payload:
          quote_id: uuid
          quote_number: string
          order_id: uuid
          order_number: string
          accepted_by: uuid
          accepted_at: timestamp
          po_number: string

      - event_type: quote.declined
        description: "Customer declined quote"
        payload:
          quote_id: uuid
          quote_number: string
          decline_reason: string
          declined_by: uuid
          declined_at: timestamp

      - event_type: quote.expired
        description: "Quote validity period ended"
        payload:
          quote_id: uuid
          quote_number: string
          expired_at: timestamp
          total_amount: number

      - event_type: quote.revised
        description: "Quote revised with new version"
        payload:
          quote_id: uuid
          quote_number: string
          previous_version: integer
          new_version: integer
          revised_by: uuid
          changes_summary: object

    # ─────────────────────────────────────────────────────────────────
    # ORDER EVENTS
    # ─────────────────────────────────────────────────────────────────
    order:
      - event_type: order.created
        description: "New order placed"
        payload:
          order_id: uuid
          order_number: string
          customer_id: uuid
          quote_id: uuid | null
          po_number: string
          total_amount: number
          line_count: integer
          requested_ship_date: date
          created_by: uuid
          created_at: timestamp
        use_cases:
          - "ERP order sync"
          - "CRM activity"
          - "Inventory reservation"

      - event_type: order.confirmed
        description: "Order confirmed and processing"
        payload:
          order_id: uuid
          order_number: string
          confirmed_at: timestamp
          estimated_ship_date: date
          work_orders_created: array

      - event_type: order.updated
        description: "Order details modified"
        payload:
          order_id: uuid
          order_number: string
          changes:
            field: string
            old_value: any
            new_value: any
          updated_by: uuid
          updated_at: timestamp

      - event_type: order.status_changed
        description: "Order status transition"
        payload:
          order_id: uuid
          order_number: string
          previous_status: string
          new_status: string
          changed_at: timestamp
          changed_by: uuid

      - event_type: order.on_credit_hold
        description: "Order placed on credit hold"
        payload:
          order_id: uuid
          order_number: string
          hold_reason: string
          credit_limit: number
          current_balance: number
          order_amount: number

      - event_type: order.ready_to_ship
        description: "All order items ready for shipment"
        payload:
          order_id: uuid
          order_number: string
          ready_at: timestamp
          total_weight: number
          ship_from_location: string

      - event_type: order.completed
        description: "Order fully fulfilled"
        payload:
          order_id: uuid
          order_number: string
          completed_at: timestamp
          total_invoiced: number
          shipment_count: integer

      - event_type: order.cancelled
        description: "Order cancelled"
        payload:
          order_id: uuid
          order_number: string
          cancelled_by: uuid
          cancellation_reason: string
          cancelled_at: timestamp

    # ─────────────────────────────────────────────────────────────────
    # SHIPMENT EVENTS
    # ─────────────────────────────────────────────────────────────────
    shipment:
      - event_type: shipment.created
        description: "Shipment record created"
        payload:
          shipment_id: uuid
          shipment_number: string
          order_id: uuid
          order_number: string
          ship_from: object
          ship_to: object
          estimated_ship_date: date
          carrier: string
          line_count: integer
          total_weight: number

      - event_type: shipment.picked
        description: "Items picked from inventory"
        payload:
          shipment_id: uuid
          shipment_number: string
          picked_by: uuid
          picked_at: timestamp
          items: array

      - event_type: shipment.packed
        description: "Shipment packaged and ready"
        payload:
          shipment_id: uuid
          shipment_number: string
          package_count: integer
          total_weight: number
          packed_at: timestamp

      - event_type: shipment.dispatched
        description: "Shipment left facility"
        payload:
          shipment_id: uuid
          shipment_number: string
          order_id: uuid
          carrier: string
          tracking_number: string
          tracking_url: string
          ship_date: date
          estimated_delivery: date
          total_weight: number
          package_count: integer
        use_cases:
          - "Send tracking notification to customer"
          - "Update order status"
          - "Trigger invoice generation"

      - event_type: shipment.in_transit
        description: "Carrier scan update received"
        payload:
          shipment_id: uuid
          shipment_number: string
          tracking_number: string
          current_location: string
          status: string
          estimated_delivery: date
          scan_time: timestamp

      - event_type: shipment.out_for_delivery
        description: "Shipment out for final delivery"
        payload:
          shipment_id: uuid
          shipment_number: string
          expected_delivery_time: string

      - event_type: shipment.delivered
        description: "Shipment delivered to customer"
        payload:
          shipment_id: uuid
          shipment_number: string
          order_id: uuid
          delivered_at: timestamp
          signed_by: string
          delivery_location: string
          pod_document_id: uuid | null

      - event_type: shipment.exception
        description: "Delivery exception occurred"
        payload:
          shipment_id: uuid
          shipment_number: string
          exception_type: string
          exception_description: string
          occurred_at: timestamp
          new_estimated_delivery: date | null

    # ─────────────────────────────────────────────────────────────────
    # INVOICE EVENTS
    # ─────────────────────────────────────────────────────────────────
    invoice:
      - event_type: invoice.created
        description: "Invoice generated"
        payload:
          invoice_id: uuid
          invoice_number: string
          order_id: uuid
          shipment_id: uuid | null
          customer_id: uuid
          total_amount: number
          tax_amount: number
          due_date: date
          created_at: timestamp

      - event_type: invoice.sent
        description: "Invoice delivered to customer"
        payload:
          invoice_id: uuid
          invoice_number: string
          sent_to: string
          sent_via: string (email|edi|portal)
          sent_at: timestamp

      - event_type: invoice.viewed
        description: "Customer viewed invoice"
        payload:
          invoice_id: uuid
          invoice_number: string
          viewed_by: uuid
          viewed_at: timestamp

      - event_type: invoice.payment_received
        description: "Payment applied to invoice"
        payload:
          invoice_id: uuid
          invoice_number: string
          payment_amount: number
          payment_method: string
          payment_reference: string
          balance_remaining: number
          paid_in_full: boolean
          payment_date: date

      - event_type: invoice.overdue
        description: "Invoice past due date"
        payload:
          invoice_id: uuid
          invoice_number: string
          customer_id: uuid
          amount_due: number
          due_date: date
          days_overdue: integer

      - event_type: invoice.disputed
        description: "Customer disputed invoice"
        payload:
          invoice_id: uuid
          invoice_number: string
          dispute_reason: string
          disputed_by: uuid
          disputed_at: timestamp

    # ─────────────────────────────────────────────────────────────────
    # INVENTORY EVENTS
    # ─────────────────────────────────────────────────────────────────
    inventory:
      - event_type: inventory.received
        description: "New inventory received"
        payload:
          receipt_id: uuid
          vendor: string
          po_number: string
          items:
            - inventory_id: uuid
              product_id: uuid
              heat_number: string
              weight_lbs: number
              location: string
          received_at: timestamp

      - event_type: inventory.reserved
        description: "Inventory reserved for order"
        payload:
          reservation_id: uuid
          order_id: uuid
          order_number: string
          items:
            - inventory_id: uuid
              product_id: uuid
              quantity: number
          reserved_at: timestamp

      - event_type: inventory.released
        description: "Inventory reservation released"
        payload:
          reservation_id: uuid
          order_id: uuid
          release_reason: string
          released_at: timestamp

      - event_type: inventory.low_stock
        description: "Product below reorder point"
        payload:
          product_id: uuid
          product_sku: string
          current_quantity: number
          reorder_point: number
          location: string

      - event_type: inventory.transferred
        description: "Inventory moved between locations"
        payload:
          transfer_id: uuid
          inventory_id: uuid
          from_location: string
          to_location: string
          quantity: number
          transferred_at: timestamp

    # ─────────────────────────────────────────────────────────────────
    # DOCUMENT EVENTS
    # ─────────────────────────────────────────────────────────────────
    document:
      - event_type: document.created
        description: "New document available"
        payload:
          document_id: uuid
          document_type: string
          entity_type: string
          entity_id: uuid
          name: string
          url: string
          created_at: timestamp

      - event_type: document.downloaded
        description: "Document downloaded by customer"
        payload:
          document_id: uuid
          document_type: string
          downloaded_by: uuid
          downloaded_at: timestamp

    # ─────────────────────────────────────────────────────────────────
    # CUSTOMER ACCOUNT EVENTS
    # ─────────────────────────────────────────────────────────────────
    customer:
      - event_type: customer.created
        description: "New customer account created"
        payload:
          customer_id: uuid
          customer_name: string
          customer_type: string
          created_at: timestamp

      - event_type: customer.updated
        description: "Customer information updated"
        payload:
          customer_id: uuid
          changes: object
          updated_at: timestamp

      - event_type: customer.credit_updated
        description: "Customer credit limit changed"
        payload:
          customer_id: uuid
          previous_limit: number
          new_limit: number
          reason: string
          updated_at: timestamp

      - event_type: customer.portal_user_added
        description: "New portal user added"
        payload:
          customer_id: uuid
          user_id: uuid
          email: string
          role: string
          added_by: uuid
          added_at: timestamp

    # ─────────────────────────────────────────────────────────────────
    # QUALITY EVENTS
    # ─────────────────────────────────────────────────────────────────
    quality:
      - event_type: quality.mtr_available
        description: "MTR document available for heat"
        payload:
          heat_number: string
          document_id: uuid
          product_ids: array
          available_at: timestamp

      - event_type: quality.inspection_complete
        description: "QA inspection completed"
        payload:
          inspection_id: uuid
          inventory_id: uuid
          result: string (PASS|FAIL|CONDITIONAL)
          inspector: uuid
          completed_at: timestamp

      - event_type: quality.ncr_created
        description: "Non-conformance report created"
        payload:
          ncr_id: uuid
          ncr_number: string
          inventory_id: uuid
          issue_type: string
          severity: string
          created_at: timestamp

    # ─────────────────────────────────────────────────────────────────
    # WORK ORDER EVENTS
    # ─────────────────────────────────────────────────────────────────
    work_order:
      - event_type: work_order.created
        description: "Processing work order created"
        payload:
          work_order_id: uuid
          work_order_number: string
          order_id: uuid
          processing_type: string
          scheduled_date: date
          created_at: timestamp

      - event_type: work_order.started
        description: "Work order processing started"
        payload:
          work_order_id: uuid
          work_order_number: string
          started_by: uuid
          work_center: string
          started_at: timestamp

      - event_type: work_order.completed
        description: "Work order processing complete"
        payload:
          work_order_id: uuid
          work_order_number: string
          output_items: array
          completed_by: uuid
          completed_at: timestamp
          yield_percentage: number

      - event_type: work_order.delayed
        description: "Work order schedule delayed"
        payload:
          work_order_id: uuid
          work_order_number: string
          original_date: date
          new_date: date
          delay_reason: string

  # ═══════════════════════════════════════════════════════════════════
  # EVENT ENVELOPE
  # ═══════════════════════════════════════════════════════════════════
  event_envelope:
    schema:
      id: "uuid - unique event ID"
      type: "string - event type (e.g., order.created)"
      version: "string - event schema version (e.g., 2.0)"
      timestamp: "ISO 8601 timestamp"
      tenant_id: "uuid - tenant context"
      customer_id: "uuid - customer context (if applicable)"
      source: "string - originating system"
      correlation_id: "uuid - for request tracing"
      data: "object - event-specific payload"
      metadata:
        user_id: "uuid - actor who triggered event"
        ip_address: "string - origin IP"
        user_agent: "string - client info"

    example:
      id: "evt_a1b2c3d4-e5f6-7890-abcd-ef1234567890"
      type: "order.created"
      version: "2.0"
      timestamp: "2026-01-17T14:30:00.000Z"
      tenant_id: "tnt_12345678-abcd-efgh-ijkl-mnopqrstuvwx"
      customer_id: "cst_87654321-wxyz-abcd-efgh-ijklmnopqrst"
      source: "portal-api"
      correlation_id: "req_11111111-2222-3333-4444-555555555555"
      data:
        order_id: "ord_aaaabbbb-cccc-dddd-eeee-ffffffffffff"
        order_number: "SO-2026-00123"
        po_number: "PO-CUST-789"
        total_amount: 15750.00
        line_count: 3
        requested_ship_date: "2026-01-24"
        created_by: "usr_99998888-7777-6666-5555-444433332222"
        created_at: "2026-01-17T14:30:00.000Z"
      metadata:
        user_id: "usr_99998888-7777-6666-5555-444433332222"
        ip_address: "192.168.1.100"
        user_agent: "SteelWise-Portal/2.0"

  # ═══════════════════════════════════════════════════════════════════
  # SUBSCRIPTION FILTERS
  # ═══════════════════════════════════════════════════════────────────
  subscription_filters:
    description: "Webhooks can filter events by criteria"
    filter_fields:
      - "customer_id - receive events for specific customers"
      - "order_id - receive events for specific orders"
      - "product_id - receive events for specific products"
      - "location_id - receive events for specific locations"
      - "event_type - subscribe to specific event types"
    example:
      url: "https://erp.customer.com/webhooks/steelwise"
      events: ["order.*", "shipment.*", "invoice.*"]
      filters:
        customer_id: ["cst_12345", "cst_67890"]
      secret: "whsec_..."

  # ═══════════════════════════════════════════════════════════════════
  # ERP INTEGRATION EVENTS
  # ═══════════════════════════════════════════════════════════════════
  erp_integration:
    sync_events:
      - event_type: erp.order_synced
        direction: outbound
        description: "Order pushed to ERP"
        
      - event_type: erp.invoice_imported
        direction: inbound
        description: "Invoice imported from ERP"
        
      - event_type: erp.inventory_synced
        direction: bidirectional
        description: "Inventory levels synchronized"
        
      - event_type: erp.customer_synced
        direction: bidirectional
        description: "Customer master data synchronized"

    error_events:
      - event_type: erp.sync_failed
        payload:
          entity_type: string
          entity_id: uuid
          error_code: string
          error_message: string
          retry_count: integer
          next_retry_at: timestamp

    mapping_events:
      - event_type: erp.mapping_updated
        payload:
          mapping_type: string
          steelwise_id: string
          erp_id: string
          updated_at: timestamp
```

---

*Document generated for AI-build Phase 14: E-Commerce Integration*
