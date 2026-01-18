# 64 — Build Pricing & Costing Structure

> **Purpose:** Pricing models, costing structures, formulae, and UI components.  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. pricing_models

```json
{
  "contract_pricing": {
    "id": "contract",
    "label": "Contract Pricing",
    "description": "Customer-specific negotiated pricing with validity periods",
    "priority": 1,
    "inputs": [
      { "field": "customer_id", "type": "uuid", "required": true },
      { "field": "product_id", "type": "uuid", "required": false },
      { "field": "product_category_id", "type": "uuid", "required": false },
      { "field": "grade_id", "type": "uuid", "required": false },
      { "field": "quantity", "type": "decimal", "required": true },
      { "field": "uom", "type": "string", "required": true },
      { "field": "order_date", "type": "date", "required": true }
    ],
    "outputs": [
      { "field": "contract_id", "type": "uuid" },
      { "field": "contract_number", "type": "string" },
      { "field": "unit_price", "type": "decimal" },
      { "field": "price_uom", "type": "string" },
      { "field": "discount_type", "type": "enum", "values": ["percent", "amount", "fixed"] },
      { "field": "discount_value", "type": "decimal" },
      { "field": "effective_date", "type": "date" },
      { "field": "expiration_date", "type": "date" },
      { "field": "min_quantity", "type": "decimal" },
      { "field": "max_quantity", "type": "decimal" }
    ],
    "scopes": [
      { "level": "product", "description": "Specific product SKU pricing" },
      { "level": "grade", "description": "All products of a grade" },
      { "level": "category", "description": "All products in category" },
      { "level": "division", "description": "All products in division" },
      { "level": "global", "description": "All products for customer" }
    ],
    "lookup_order": ["product", "grade", "category", "division", "global"],
    "validity_check": "effective_date <= order_date <= expiration_date",
    "quantity_check": "min_quantity <= quantity <= max_quantity OR max_quantity IS NULL",
    "fallback": "tier_pricing"
  },
  "tier_pricing": {
    "id": "tier",
    "label": "Tier Pricing",
    "description": "Customer tier-based pricing (tier1, tier2, tier3)",
    "priority": 2,
    "inputs": [
      { "field": "customer_id", "type": "uuid", "required": true },
      { "field": "product_id", "type": "uuid", "required": true },
      { "field": "quantity", "type": "decimal", "required": true },
      { "field": "uom", "type": "string", "required": true }
    ],
    "outputs": [
      { "field": "tier", "type": "enum", "values": ["tier1", "tier2", "tier3"] },
      { "field": "unit_price", "type": "decimal" },
      { "field": "price_uom", "type": "string" },
      { "field": "break_quantity", "type": "decimal" },
      { "field": "break_price", "type": "decimal" }
    ],
    "scopes": [
      { "level": "customer_tier", "source": "customer.pricing_tier" }
    ],
    "quantity_breaks": {
      "enabled": true,
      "lookup": "product_price WHERE price_type = customer.pricing_tier AND quantity >= break_quantity ORDER BY break_quantity DESC LIMIT 1"
    },
    "fallback": "list_pricing"
  },
  "list_pricing": {
    "id": "list",
    "label": "List Pricing",
    "description": "Standard published list prices",
    "priority": 3,
    "inputs": [
      { "field": "product_id", "type": "uuid", "required": true },
      { "field": "quantity", "type": "decimal", "required": true },
      { "field": "uom", "type": "string", "required": true },
      { "field": "price_date", "type": "date", "required": true }
    ],
    "outputs": [
      { "field": "list_price", "type": "decimal" },
      { "field": "price_uom", "type": "string" },
      { "field": "effective_date", "type": "date" },
      { "field": "break_quantity", "type": "decimal" },
      { "field": "break_price", "type": "decimal" }
    ],
    "scopes": [
      { "level": "product", "source": "product_price WHERE price_type = 'list'" }
    ],
    "quantity_breaks": {
      "enabled": true,
      "tiers": [
        { "min_qty": 0, "discount_pct": 0 },
        { "min_qty": 1000, "discount_pct": 2 },
        { "min_qty": 5000, "discount_pct": 5 },
        { "min_qty": 10000, "discount_pct": 8 },
        { "min_qty": 25000, "discount_pct": 10 }
      ]
    },
    "fallback": null
  },
  "commodity_pricing": {
    "id": "commodity",
    "label": "Commodity Index Pricing",
    "description": "Market-based pricing tied to commodity indices",
    "priority": 0,
    "inputs": [
      { "field": "grade_id", "type": "uuid", "required": true },
      { "field": "index_id", "type": "string", "required": true },
      { "field": "price_date", "type": "date", "required": true },
      { "field": "quantity", "type": "decimal", "required": true },
      { "field": "weight_lbs", "type": "decimal", "required": true }
    ],
    "outputs": [
      { "field": "index_price", "type": "decimal", "description": "$/CWT or $/LB from index" },
      { "field": "index_date", "type": "date" },
      { "field": "index_source", "type": "string" },
      { "field": "adder", "type": "decimal", "description": "Conversion/service adder" },
      { "field": "final_price", "type": "decimal" }
    ],
    "scopes": [
      { "level": "grade", "source": "grade.commodity_index_id" },
      { "level": "form", "source": "form-specific adders" }
    ],
    "indices": [
      { "id": "CRU_HRC", "name": "CRU Hot-Rolled Coil", "unit": "$/ton", "update_frequency": "weekly" },
      { "id": "CRU_CRC", "name": "CRU Cold-Rolled Coil", "unit": "$/ton", "update_frequency": "weekly" },
      { "id": "AMM_PLATE", "name": "AMM Plate", "unit": "$/CWT", "update_frequency": "daily" },
      { "id": "LME_ALUM", "name": "LME Aluminum", "unit": "$/lb", "update_frequency": "daily" },
      { "id": "COMEX_COPPER", "name": "COMEX Copper", "unit": "$/lb", "update_frequency": "daily" },
      { "id": "PLASTICS_HDPE", "name": "Plastics News HDPE", "unit": "$/lb", "update_frequency": "monthly" }
    ],
    "adders": {
      "by_form": {
        "coil": { "base": 0, "description": "Base index applies" },
        "sheet": { "base": 0.02, "per_lb": true, "description": "Leveling/cut adder" },
        "plate": { "base": 0.03, "per_lb": true, "description": "Heavy gauge adder" },
        "bar": { "base": 0.05, "per_lb": true, "description": "Long product adder" }
      },
      "by_grade": {
        "stainless": { "premium_pct": 15, "description": "Stainless premium" },
        "alloy": { "premium_pct": 10, "description": "Alloy premium" }
      }
    },
    "fallback": "list_pricing",
    "requires_approval_if_stale_days": 7
  },
  "processing_pricing": {
    "id": "processing",
    "label": "Processing Charges",
    "description": "Value-added processing service charges",
    "priority": null,
    "applies_to": "order_line_processing",
    "inputs": [
      { "field": "processing_type_id", "type": "uuid", "required": true },
      { "field": "input_weight", "type": "decimal", "required": false },
      { "field": "output_pieces", "type": "integer", "required": false },
      { "field": "linear_feet", "type": "decimal", "required": false },
      { "field": "setup_required", "type": "boolean", "required": true },
      { "field": "tolerance_class", "type": "enum", "required": true },
      { "field": "customer_id", "type": "uuid", "required": true }
    ],
    "outputs": [
      { "field": "base_charge", "type": "decimal" },
      { "field": "per_unit_charge", "type": "decimal" },
      { "field": "setup_charge", "type": "decimal" },
      { "field": "tolerance_adder", "type": "decimal" },
      { "field": "minimum_charge", "type": "decimal" },
      { "field": "total_processing_charge", "type": "decimal" }
    ],
    "scopes": [
      { "level": "processing_type", "source": "processing_type.base_charge" },
      { "level": "customer_contract", "source": "contract_processing_rates" },
      { "level": "work_center", "source": "work_center.hourly_rate" }
    ],
    "charge_types": [
      { "id": "per_lb", "unit": "LB", "applies_to": ["slitting", "leveling"] },
      { "id": "per_piece", "unit": "EA", "applies_to": ["blanking", "shearing"] },
      { "id": "per_cut", "unit": "CUT", "applies_to": ["sawing", "plasma", "laser"] },
      { "id": "per_ft", "unit": "FT", "applies_to": ["slitting"] },
      { "id": "per_hour", "unit": "HR", "applies_to": ["machining", "fabrication"] },
      { "id": "per_inch", "unit": "IN", "applies_to": ["laser", "waterjet"] }
    ],
    "tolerance_multipliers": {
      "standard": 1.0,
      "tight": 1.15,
      "precision": 1.30,
      "custom": "quote_required"
    }
  },
  "remnant_pricing": {
    "id": "remnant",
    "label": "Remnant Pricing",
    "description": "Discounted pricing for partial/remnant inventory",
    "priority": null,
    "inputs": [
      { "field": "inventory_unit_id", "type": "uuid", "required": true },
      { "field": "original_quantity", "type": "decimal", "required": true },
      { "field": "remaining_quantity", "type": "decimal", "required": true },
      { "field": "product_id", "type": "uuid", "required": true },
      { "field": "age_days", "type": "integer", "required": true }
    ],
    "outputs": [
      { "field": "base_price", "type": "decimal" },
      { "field": "remnant_discount_pct", "type": "decimal" },
      { "field": "age_discount_pct", "type": "decimal" },
      { "field": "final_price", "type": "decimal" },
      { "field": "floor_price", "type": "decimal" }
    ],
    "scopes": [
      { "level": "inventory_unit", "source": "specific unit cost + margin" }
    ],
    "discount_rules": [
      {
        "condition": "remaining_pct < 25",
        "discount_pct": 25,
        "label": "Small remnant"
      },
      {
        "condition": "remaining_pct >= 25 AND remaining_pct < 50",
        "discount_pct": 15,
        "label": "Medium remnant"
      },
      {
        "condition": "remaining_pct >= 50 AND remaining_pct < 75",
        "discount_pct": 10,
        "label": "Large remnant"
      },
      {
        "condition": "remaining_pct >= 75",
        "discount_pct": 5,
        "label": "Near-full piece"
      }
    ],
    "age_discounts": [
      { "age_days_min": 0, "age_days_max": 90, "additional_discount_pct": 0 },
      { "age_days_min": 91, "age_days_max": 180, "additional_discount_pct": 5 },
      { "age_days_min": 181, "age_days_max": 365, "additional_discount_pct": 10 },
      { "age_days_min": 366, "age_days_max": null, "additional_discount_pct": 15 }
    ],
    "floor_rule": "MAX(cost * 1.05, list_price * 0.50)"
  },
  "retail_pricing": {
    "id": "retail",
    "label": "Retail Counter Pricing",
    "description": "Walk-in retail customer pricing",
    "priority": null,
    "inputs": [
      { "field": "product_id", "type": "uuid", "required": true },
      { "field": "quantity", "type": "decimal", "required": true },
      { "field": "uom", "type": "string", "required": true },
      { "field": "customer_type", "type": "enum", "values": ["cash", "account"], "required": true }
    ],
    "outputs": [
      { "field": "retail_price", "type": "decimal" },
      { "field": "price_uom", "type": "string" },
      { "field": "cutting_charge", "type": "decimal" },
      { "field": "minimum_charge", "type": "decimal" },
      { "field": "total", "type": "decimal" }
    ],
    "scopes": [
      { "level": "product", "source": "product.retail_price OR list_price * 1.15" }
    ],
    "rules": [
      { "id": "markup", "description": "15% markup over list for cash customers", "cash_markup_pct": 15 },
      { "id": "account", "description": "Account customers get tier pricing", "use_tier": true },
      { "id": "min_sale", "description": "Minimum sale amount", "min_amount": 10.00 },
      { "id": "cutting", "description": "Minimum cutting charge", "min_cut_charge": 5.00 },
      { "id": "small_qty", "description": "Small quantity surcharge", "threshold_qty": 1, "surcharge_pct": 10 }
    ],
    "cutting_charges": [
      { "material_type": "bar", "per_cut": 2.50, "min_charge": 5.00 },
      { "material_type": "tube", "per_cut": 3.00, "min_charge": 5.00 },
      { "material_type": "sheet", "per_cut": 0.50, "per_linear_foot": true, "min_charge": 5.00 },
      { "material_type": "plastic_rod", "per_cut": 2.00, "min_charge": 5.00 },
      { "material_type": "plastic_sheet", "per_cut": 1.00, "per_linear_foot": true, "min_charge": 5.00 }
    ]
  },
  "cost_plus_pricing": {
    "id": "cost_plus",
    "label": "Cost Plus Pricing",
    "description": "Cost-based pricing with markup percentage",
    "priority": null,
    "inputs": [
      { "field": "inventory_unit_id", "type": "uuid", "required": true },
      { "field": "customer_id", "type": "uuid", "required": true },
      { "field": "markup_pct", "type": "decimal", "required": true }
    ],
    "outputs": [
      { "field": "unit_cost", "type": "decimal" },
      { "field": "markup_pct", "type": "decimal" },
      { "field": "markup_amount", "type": "decimal" },
      { "field": "unit_price", "type": "decimal" }
    ],
    "scopes": [
      { "level": "customer_contract", "source": "contract.markup_pct" }
    ],
    "cost_basis": "inventory_unit.cost OR product.standard_cost",
    "min_markup_pct": 5,
    "max_markup_pct": 50,
    "requires_permission": "order.cost_plus_pricing"
  },
  "quote_pricing": {
    "id": "quote",
    "label": "Quote-Based Pricing",
    "description": "Pricing from approved quote",
    "priority": 0,
    "inputs": [
      { "field": "quote_id", "type": "uuid", "required": true },
      { "field": "quote_line_id", "type": "uuid", "required": true }
    ],
    "outputs": [
      { "field": "quoted_price", "type": "decimal" },
      { "field": "quote_valid_until", "type": "date" },
      { "field": "quote_approved_by", "type": "uuid" }
    ],
    "scopes": [
      { "level": "quote_line", "source": "order_line linked to quote" }
    ],
    "validity_check": "quote.valid_until >= order_date AND quote.status = 'approved'",
    "fallback": "list_pricing"
  }
}
```

---

## 2. costing_models

```json
{
  "standard_cost": {
    "id": "standard",
    "label": "Standard Cost",
    "description": "Predetermined cost used for margin calculations and inventory valuation",
    "components": [
      {
        "id": "material",
        "label": "Material Cost",
        "description": "Raw material cost per unit",
        "sources": [
          { "priority": 1, "source": "inventory_unit.cost", "description": "Actual received cost" },
          { "priority": 2, "source": "product.standard_cost", "description": "Product standard cost" },
          { "priority": 3, "source": "grade.standard_cost", "description": "Grade average cost" }
        ],
        "uom_conversion": true,
        "includes": ["base_material", "freight_in", "duties"]
      },
      {
        "id": "processing",
        "label": "Processing Cost",
        "description": "Internal processing cost (not customer charge)",
        "sources": [
          { "priority": 1, "source": "work_center.hourly_rate * estimated_hours", "description": "Work center rate" },
          { "priority": 2, "source": "processing_type.standard_cost", "description": "Standard processing cost" }
        ],
        "includes": ["labor", "equipment", "consumables"]
      },
      {
        "id": "overhead",
        "label": "Overhead Allocation",
        "description": "Allocated overhead costs",
        "sources": [
          { "priority": 1, "source": "location.overhead_rate * material_cost", "description": "Location overhead rate" }
        ],
        "default_rate_pct": 8,
        "includes": ["facility", "utilities", "indirect_labor", "insurance"]
      }
    ],
    "formula": "material_cost + processing_cost + overhead_allocation",
    "refresh_frequency": "monthly",
    "variance_threshold_pct": 10
  },
  "actual_cost": {
    "id": "actual",
    "label": "Actual Cost",
    "description": "Real cost incurred for specific inventory or job",
    "components": [
      {
        "id": "material",
        "label": "Actual Material Cost",
        "description": "Actual cost from purchase or production",
        "sources": [
          { "priority": 1, "source": "inventory_unit.cost", "description": "PO receipt cost" },
          { "priority": 2, "source": "parent_unit.cost * split_ratio", "description": "Split from parent" }
        ],
        "includes": ["invoice_cost", "freight_in_actual", "duties_actual"]
      },
      {
        "id": "processing",
        "label": "Actual Processing Cost",
        "description": "Actual processing cost incurred",
        "sources": [
          { "priority": 1, "source": "job_event_log.labor_cost + job_event_log.machine_cost", "description": "Time-tracked cost" },
          { "priority": 2, "source": "operation_step.actual_duration * work_center.hourly_rate", "description": "Duration-based" }
        ],
        "includes": ["labor_actual", "scrap_cost", "rework_cost"]
      },
      {
        "id": "overhead",
        "label": "Absorbed Overhead",
        "description": "Overhead absorbed based on activity",
        "sources": [
          { "priority": 1, "source": "processing_hours * overhead_rate_per_hour", "description": "Activity-based" }
        ]
      }
    ],
    "formula": "actual_material + actual_processing + absorbed_overhead",
    "available_when": "job completed or inventory received"
  },
  "landed_cost": {
    "id": "landed",
    "label": "Landed Cost",
    "description": "Total cost including all inbound expenses",
    "components": [
      {
        "id": "invoice_cost",
        "label": "Invoice Cost",
        "description": "Vendor invoice amount",
        "source": "po_line.unit_cost * received_qty"
      },
      {
        "id": "freight_in",
        "label": "Inbound Freight",
        "description": "Freight cost allocated to material",
        "allocation_method": "weight_based",
        "source": "receipt.freight_cost * (line_weight / total_weight)"
      },
      {
        "id": "duties",
        "label": "Duties & Tariffs",
        "description": "Import duties if applicable",
        "source": "receipt.duty_cost * (line_value / total_value)"
      },
      {
        "id": "handling",
        "label": "Handling Cost",
        "description": "Receiving and putaway cost",
        "source": "location.handling_cost_per_unit"
      }
    ],
    "formula": "invoice_cost + freight_in + duties + handling"
  },
  "margin_calculation": {
    "id": "margin",
    "label": "Margin Analysis",
    "description": "Profit margin calculations",
    "metrics": [
      {
        "id": "gross_margin",
        "label": "Gross Margin",
        "formula": "(selling_price - cost_of_goods) / selling_price * 100",
        "display_format": "percentage"
      },
      {
        "id": "gross_profit",
        "label": "Gross Profit",
        "formula": "selling_price - cost_of_goods",
        "display_format": "currency"
      },
      {
        "id": "contribution_margin",
        "label": "Contribution Margin",
        "formula": "(selling_price - variable_cost) / selling_price * 100",
        "display_format": "percentage"
      },
      {
        "id": "markup",
        "label": "Markup",
        "formula": "(selling_price - cost) / cost * 100",
        "display_format": "percentage"
      }
    ],
    "thresholds": [
      { "metric": "gross_margin", "warning_below": 15, "error_below": 10, "floor": 5 },
      { "metric": "markup", "warning_below": 20, "error_below": 12, "floor": 8 }
    ],
    "visibility": {
      "always_visible": ["FINANCE", "DIVISION_MANAGER", "ADMIN"],
      "visible_if_permitted": ["BRANCH_MANAGER"],
      "never_visible": ["CSR", "OPERATOR", "SHIPPING", "CUSTOMER_PORTAL"]
    }
  }
}
```

---

## 3. pricing_formulae

### Base Price Calculations

```
# List Price Lookup
list_price = product_price.price 
             WHERE price_type = 'list' 
             AND effective_date <= order_date 
             AND (expiration_date IS NULL OR expiration_date >= order_date)
             AND quantity >= min_quantity
             ORDER BY min_quantity DESC
             LIMIT 1

# Tier Price
tier_price = product_price.price 
             WHERE price_type = customer.pricing_tier
             AND effective_date <= order_date
             ORDER BY break_quantity DESC
             LIMIT 1

# Contract Price (with fallback)
contract_price = COALESCE(
    contract_line.fixed_price,
    list_price * (1 - contract_line.discount_percent / 100),
    list_price - contract_line.discount_amount
)

# Commodity Index Price
commodity_price = (index_value / index_unit_factor) + grade_adder + form_adder
```

### Extended Price Calculation

```
# Unit Price Selection (priority order)
unit_price = COALESCE(
    quote_price,                    # If from approved quote
    contract_price,                 # If contract exists and valid
    tier_price,                     # If customer has tier pricing
    list_price                      # Default fallback
)

# Line Extended Price
extended_price = quantity * unit_price

# Line Discount
line_discount_amount = CASE discount_type
    WHEN 'percent' THEN extended_price * (discount_value / 100)
    WHEN 'amount'  THEN discount_value
    ELSE 0
END

# Net Line Price
net_line_price = extended_price - line_discount_amount
```

### Processing Charge Calculations

```
# Base Processing Charge
base_processing = processing_type.base_charge

# Per-Unit Processing
per_unit_processing = CASE processing_type.charge_unit
    WHEN 'LB'   THEN processing_type.charge_per_unit * weight_lbs
    WHEN 'EA'   THEN processing_type.charge_per_unit * pieces
    WHEN 'FT'   THEN processing_type.charge_per_unit * linear_feet
    WHEN 'CUT'  THEN processing_type.charge_per_unit * num_cuts
    WHEN 'IN'   THEN processing_type.charge_per_unit * cutting_inches
    WHEN 'HR'   THEN processing_type.charge_per_unit * estimated_hours
END

# Tolerance Adder
tolerance_multiplier = CASE tolerance_class
    WHEN 'standard'  THEN 1.00
    WHEN 'tight'     THEN 1.15
    WHEN 'precision' THEN 1.30
    WHEN 'custom'    THEN custom_multiplier
END

# Setup Charge (if applicable)
setup_charge = IF(requires_setup, processing_type.setup_charge, 0)

# Total Processing Charge
total_processing = MAX(
    (base_processing + per_unit_processing) * tolerance_multiplier + setup_charge,
    processing_type.min_charge
)

# Contract Processing Override
contract_processing = COALESCE(
    contract_processing_rate.charge,
    total_processing
)
```

### Remnant Pricing

```
# Remaining Percentage
remaining_pct = (remaining_quantity / original_quantity) * 100

# Size Discount
size_discount_pct = CASE
    WHEN remaining_pct < 25  THEN 25
    WHEN remaining_pct < 50  THEN 15
    WHEN remaining_pct < 75  THEN 10
    ELSE 5
END

# Age Discount
age_discount_pct = CASE
    WHEN age_days <= 90   THEN 0
    WHEN age_days <= 180  THEN 5
    WHEN age_days <= 365  THEN 10
    ELSE 15
END

# Total Discount
total_discount_pct = size_discount_pct + age_discount_pct

# Remnant Price
remnant_price = list_price * (1 - total_discount_pct / 100)

# Floor Price Check
floor_price = MAX(cost * 1.05, list_price * 0.50)
final_remnant_price = MAX(remnant_price, floor_price)
```

### Retail Pricing

```
# Base Retail Price
retail_base = COALESCE(product.retail_price, list_price * 1.15)

# Cash Customer Markup
cash_markup = IF(customer_type = 'cash', retail_base * 0.15, 0)

# Small Quantity Surcharge
small_qty_surcharge = IF(quantity < min_retail_qty, retail_base * 0.10, 0)

# Cutting Charges
cutting_charge = MAX(
    num_cuts * cut_rate_per_cut,
    min_cutting_charge
)

# Retail Total
retail_unit_price = retail_base + cash_markup + small_qty_surcharge
retail_total = (retail_unit_price * quantity) + cutting_charge
```

### Order Totals

```
# Subtotal
subtotal = SUM(net_line_price) for all lines

# Processing Total
processing_total = SUM(total_processing) for all lines

# Order Discount
order_discount_amount = CASE order_discount_type
    WHEN 'percent' THEN subtotal * (order_discount_value / 100)
    WHEN 'amount'  THEN order_discount_value
    ELSE 0
END

# Net Amount
net_amount = subtotal + processing_total - order_discount_amount

# Tax Calculation
taxable_amount = IF(customer.tax_exempt, 0, net_amount + freight_charge)
tax_amount = taxable_amount * tax_rate

# Grand Total
grand_total = net_amount + freight_charge + tax_amount
```

### Margin Calculations

```
# Line Cost
line_cost = COALESCE(
    inventory_unit.cost * quantity,
    product.standard_cost * quantity
)

# Processing Cost (internal)
internal_processing_cost = estimated_hours * work_center.hourly_rate

# Total Line Cost
total_line_cost = line_cost + internal_processing_cost

# Gross Margin Percent
gross_margin_pct = ((net_line_price - total_line_cost) / net_line_price) * 100

# Order Gross Margin
order_gross_margin_pct = ((grand_total - tax_amount - SUM(total_line_cost)) / (grand_total - tax_amount)) * 100

# Minimum Margin Check
margin_ok = gross_margin_pct >= location.min_margin_pct

# Floor Price
floor_price = total_line_cost / (1 - min_margin_pct / 100)
```

---

## 4. pricing_UI_components

### CSR Quote/Order Editor

```json
{
  "id": "csr_pricing_editor",
  "app": "order_intake_app",
  "screens": ["order_entry", "quote_entry"],
  "components": {
    "price_lookup_panel": {
      "id": "price_lookup",
      "type": "side_panel",
      "trigger": "on_product_select",
      "sections": [
        {
          "id": "price_source_indicator",
          "type": "chip",
          "values": [
            { "value": "contract", "label": "Contract", "color": "success", "icon": "verified" },
            { "value": "tier", "label": "Tier", "color": "info", "icon": "loyalty" },
            { "value": "list", "label": "List", "color": "default", "icon": "list" },
            { "value": "quote", "label": "Quote", "color": "primary", "icon": "request_quote" },
            { "value": "override", "label": "Override", "color": "warning", "icon": "edit" }
          ]
        },
        {
          "id": "price_breakdown",
          "type": "list",
          "items": [
            { "label": "List Price", "binding": "product.list_price", "format": "currency_per_uom" },
            { "label": "Your Price", "binding": "calculated.tier_price", "format": "currency_per_uom", "highlight": true },
            { "label": "Contract Price", "binding": "contract.price", "format": "currency_per_uom", "visible_if": "has_contract" },
            { "label": "Discount", "binding": "calculated.discount_pct", "format": "percent", "color": "success" }
          ]
        },
        {
          "id": "quantity_breaks",
          "type": "table",
          "label": "Quantity Breaks",
          "columns": ["min_qty", "price", "savings"],
          "data_source": "product.quantity_breaks",
          "highlight_current": true
        },
        {
          "id": "contract_info",
          "type": "info_card",
          "visible_if": "has_contract",
          "fields": [
            { "label": "Contract", "binding": "contract.number" },
            { "label": "Expires", "binding": "contract.expiration_date", "format": "date" },
            { "label": "Discount", "binding": "contract_line.discount_pct", "format": "percent" }
          ]
        }
      ]
    },
    "line_item_pricing": {
      "id": "line_pricing",
      "type": "inline_form",
      "location": "order_line_row",
      "fields": [
        {
          "id": "unit_price",
          "type": "currency_input",
          "label": "Unit Price",
          "editable": true,
          "editable_if": "user.can('order.override_price') OR price_source != 'contract'",
          "validation": "gte:floor_price",
          "warning_if": "lt:suggested_price * 0.9",
          "format": "currency",
          "size": "medium"
        },
        {
          "id": "price_uom",
          "type": "dropdown",
          "label": "Per",
          "options_source": "product.pricing_uoms",
          "default": "product.pricing_uom"
        },
        {
          "id": "line_discount",
          "type": "compound_input",
          "label": "Discount",
          "components": [
            { "id": "discount_type", "type": "toggle", "options": ["%", "$"] },
            { "id": "discount_value", "type": "numeric", "max_if_percent": 100 }
          ],
          "visible_if": "user.can('order.apply_discount')"
        },
        {
          "id": "extended_price",
          "type": "display",
          "label": "Extended",
          "binding": "calculated.extended_price",
          "format": "currency",
          "size": "large",
          "highlight": true
        }
      ],
      "actions": [
        {
          "id": "apply_contract",
          "label": "Apply Contract",
          "icon": "description",
          "visible_if": "has_contract AND price_source != 'contract'",
          "action": "apply_contract_price"
        },
        {
          "id": "reset_price",
          "label": "Reset",
          "icon": "refresh",
          "visible_if": "price_source == 'override'",
          "action": "reset_to_calculated"
        }
      ]
    },
    "processing_charges_editor": {
      "id": "processing_pricing",
      "type": "expandable_section",
      "location": "order_line_detail",
      "visible_if": "line.has_processing",
      "fields": [
        {
          "id": "processing_type",
          "type": "display",
          "label": "Process",
          "binding": "processing.type_name"
        },
        {
          "id": "charge_breakdown",
          "type": "list",
          "items": [
            { "label": "Base Charge", "binding": "processing.base_charge", "format": "currency" },
            { "label": "Per-Unit", "binding": "processing.per_unit_charge", "format": "currency" },
            { "label": "Setup", "binding": "processing.setup_charge", "format": "currency" },
            { "label": "Tolerance Adder", "binding": "processing.tolerance_adder", "format": "currency" }
          ]
        },
        {
          "id": "total_processing",
          "type": "display",
          "label": "Total Processing",
          "binding": "processing.total_charge",
          "format": "currency",
          "size": "large"
        }
      ],
      "actions": [
        {
          "id": "override_processing",
          "label": "Override",
          "icon": "edit",
          "requires_permission": "order.override_price",
          "action": "open_processing_override_modal"
        }
      ]
    },
    "order_totals_panel": {
      "id": "order_totals",
      "type": "sticky_panel",
      "location": "right_sidebar",
      "sections": [
        {
          "id": "summary",
          "type": "summary_list",
          "items": [
            { "label": "Subtotal", "binding": "order.subtotal", "format": "currency" },
            { "label": "Processing", "binding": "order.processing_total", "format": "currency" },
            { "label": "Discount", "binding": "order.discount_amount", "format": "currency", "color": "success", "prefix": "-" },
            { "label": "Freight Est.", "binding": "order.freight_estimate", "format": "currency" },
            { "label": "Tax", "binding": "order.tax_amount", "format": "currency" },
            { "label": "Total", "binding": "order.grand_total", "format": "currency", "bold": true, "size": "large" }
          ]
        },
        {
          "id": "order_discount",
          "type": "form_section",
          "label": "Order Discount",
          "visible_if": "user.can('order.apply_discount')",
          "fields": [
            { "id": "order_discount_type", "type": "toggle", "options": ["None", "%", "$"] },
            { "id": "order_discount_value", "type": "numeric", "visible_if": "order_discount_type != 'None'" },
            { "id": "order_discount_reason", "type": "dropdown", "visible_if": "order_discount_value > 0", "options_source": "discount_reasons", "required": true }
          ],
          "warnings": [
            { "condition": "order_discount_pct > 10", "message": "Manager approval required", "icon": "warning" },
            { "condition": "order_discount_pct > 20", "message": "Division approval required", "icon": "error" }
          ]
        }
      ]
    },
    "margin_visibility": {
      "id": "margin_panel",
      "type": "collapsible_panel",
      "location": "right_sidebar_bottom",
      "visible_to_roles": ["BRANCH_MANAGER", "DIVISION_MANAGER", "FINANCE", "ADMIN"],
      "collapsed_default": true,
      "sections": [
        {
          "id": "margin_summary",
          "type": "metrics_row",
          "items": [
            { 
              "label": "Order Margin", 
              "binding": "calculated.gross_margin_pct", 
              "format": "percent",
              "color_rules": [
                { "condition": "value >= 20", "color": "success" },
                { "condition": "value >= 10", "color": "warning" },
                { "condition": "value < 10", "color": "error" }
              ]
            },
            { 
              "label": "Gross Profit", 
              "binding": "calculated.gross_profit", 
              "format": "currency",
              "color": "inherit"
            }
          ]
        },
        {
          "id": "line_margins",
          "type": "table",
          "label": "Line Margins",
          "columns": [
            { "field": "line_number", "label": "#", "width": 40 },
            { "field": "description", "label": "Item", "width": 200 },
            { "field": "cost", "label": "Cost", "width": 80, "format": "currency" },
            { "field": "price", "label": "Price", "width": 80, "format": "currency" },
            { "field": "margin_pct", "label": "Margin", "width": 70, "format": "percent", "color_coded": true }
          ],
          "row_highlight": {
            "condition": "margin_pct < 10",
            "color": "error_light"
          }
        },
        {
          "id": "cost_breakdown",
          "type": "expandable",
          "label": "Cost Details",
          "per_line": true,
          "fields": [
            { "label": "Material Cost", "binding": "line.material_cost", "format": "currency" },
            { "label": "Processing Cost", "binding": "line.processing_cost", "format": "currency" },
            { "label": "Overhead", "binding": "line.overhead_cost", "format": "currency" },
            { "label": "Total Cost", "binding": "line.total_cost", "format": "currency", "bold": true }
          ]
        }
      ]
    },
    "price_override_modal": {
      "id": "price_override",
      "type": "modal",
      "title": "Override Price",
      "requires_permission": "order.override_price",
      "fields": [
        { "id": "original_price", "type": "display", "label": "Calculated Price", "format": "currency" },
        { "id": "new_price", "type": "currency_input", "label": "New Price", "required": true },
        { "id": "override_reason", "type": "dropdown", "label": "Reason", "required": true, "options_source": "price_override_reasons" },
        { "id": "override_notes", "type": "textarea", "label": "Notes", "rows": 2 }
      ],
      "validation": [
        { "rule": "new_price >= floor_price", "message": "Price cannot be below floor price of {floor_price}" },
        { "rule": "requires_approval_if", "condition": "margin_pct < 10", "approval_role": "BRANCH_MANAGER" }
      ],
      "actions": [
        { "id": "cancel", "label": "Cancel", "type": "secondary" },
        { "id": "apply", "label": "Apply Override", "type": "primary", "submit": true }
      ]
    }
  }
}
```

### Retail POS Pricing

```json
{
  "id": "retail_pos_pricing",
  "app": "retail_pos_app",
  "screens": ["pos_main"],
  "components": {
    "cart_line_pricing": {
      "id": "cart_line",
      "type": "list_item",
      "location": "cart_panel",
      "layout": "compact",
      "fields": [
        { "id": "product_name", "type": "text", "binding": "item.description", "truncate": 30 },
        { "id": "quantity", "type": "stepper", "binding": "item.quantity", "min": 1, "editable": true },
        { "id": "unit_price", "type": "display", "binding": "item.unit_price", "format": "currency", "size": "small" },
        { "id": "line_total", "type": "display", "binding": "item.line_total", "format": "currency", "bold": true }
      ],
      "swipe_actions": [
        { "direction": "left", "action": "remove", "icon": "delete", "color": "error" },
        { "direction": "right", "action": "edit_price", "icon": "edit", "color": "warning", "requires": "pos.discount" }
      ]
    },
    "cutting_charge_popup": {
      "id": "cutting_popup",
      "type": "bottom_sheet",
      "trigger": "cut_to_size_button",
      "fields": [
        { "id": "stock_length", "type": "display", "label": "Stock Length", "binding": "product.length" },
        { "id": "cut_length", "type": "dimension_input", "label": "Cut to", "unit": "in", "size": "large" },
        { "id": "quantity", "type": "stepper", "label": "Pieces", "default": 1 },
        { "id": "cutting_charge", "type": "display", "label": "Cutting Charge", "binding": "calculated.cutting_charge", "format": "currency" },
        { "id": "total_estimate", "type": "display", "label": "Est. Total", "binding": "calculated.cut_total", "format": "currency", "size": "large" }
      ],
      "actions": [
        { "id": "cancel", "label": "Cancel" },
        { "id": "add", "label": "Add to Cart", "color": "primary" }
      ]
    },
    "cart_totals": {
      "id": "cart_totals",
      "type": "summary_panel",
      "location": "cart_bottom",
      "items": [
        { "label": "Subtotal", "binding": "cart.subtotal", "format": "currency" },
        { "label": "Cutting", "binding": "cart.cutting_charges", "format": "currency", "visible_if": "value > 0" },
        { "label": "Discount", "binding": "cart.discount", "format": "currency", "color": "success", "prefix": "-", "visible_if": "value > 0" },
        { "label": "Tax", "binding": "cart.tax", "format": "currency" },
        { "label": "Total", "binding": "cart.total", "format": "currency", "size": "extra_large", "bold": true }
      ]
    },
    "discount_popup": {
      "id": "discount_popup",
      "type": "modal",
      "trigger": "discount_button",
      "fields": [
        { "id": "discount_type", "type": "chip_select", "options": [
          { "value": "percent", "label": "%" },
          { "value": "amount", "label": "$" },
          { "value": "price_override", "label": "New Price" }
        ]},
        { "id": "discount_value", "type": "numeric_keypad", "label": "Value", "size": "large" },
        { "id": "reason", "type": "chip_select", "label": "Reason", "options_source": "pos_discount_reasons", "required": true }
      ],
      "limits": {
        "max_percent": { "value": 10, "override_role": "BRANCH_MANAGER" },
        "requires_manager": { "condition": "discount_pct > 15" }
      },
      "actions": [
        { "id": "cancel", "label": "Cancel" },
        { "id": "apply", "label": "Apply", "color": "primary" }
      ]
    },
    "price_check": {
      "id": "price_check",
      "type": "modal",
      "trigger": "f5_key",
      "fields": [
        { "id": "scan_input", "type": "barcode_input", "label": "Scan or Enter SKU", "autofocus": true }
      ],
      "result_display": [
        { "field": "product_code", "label": "SKU" },
        { "field": "description", "label": "Description" },
        { "field": "retail_price", "label": "Price", "format": "currency", "size": "extra_large" },
        { "field": "stock_qty", "label": "In Stock", "format": "quantity" },
        { "field": "location", "label": "Location" }
      ]
    },
    "manager_approval": {
      "id": "manager_approval",
      "type": "modal",
      "trigger": "requires_approval",
      "fields": [
        { "id": "reason_display", "type": "display", "binding": "approval_reason" },
        { "id": "original_value", "type": "display", "label": "Original", "binding": "original_value" },
        { "id": "requested_value", "type": "display", "label": "Requested", "binding": "requested_value" },
        { "id": "manager_pin", "type": "pin_input", "label": "Manager PIN", "length": 4, "secure": true }
      ],
      "validation": {
        "method": "validate_manager_pin",
        "error_message": "Invalid PIN or insufficient authorization"
      },
      "actions": [
        { "id": "cancel", "label": "Cancel" },
        { "id": "approve", "label": "Approve", "color": "success" }
      ]
    }
  }
}
```

### Manager Margin View

```json
{
  "id": "manager_margin_view",
  "app": "analytics_app",
  "screens": ["margin_dashboard"],
  "visible_to_roles": ["BRANCH_MANAGER", "DIVISION_MANAGER", "FINANCE", "ADMIN"],
  "components": {
    "margin_kpi_cards": {
      "id": "kpi_row",
      "type": "kpi_card_row",
      "location": "top",
      "cards": [
        {
          "id": "avg_margin",
          "label": "Avg Gross Margin",
          "binding": "metrics.avg_gross_margin_pct",
          "format": "percent",
          "trend_binding": "metrics.avg_gross_margin_trend",
          "color_rules": [
            { "condition": "value >= 18", "color": "success" },
            { "condition": "value >= 12", "color": "warning" },
            { "condition": "value < 12", "color": "error" }
          ]
        },
        {
          "id": "total_profit",
          "label": "Gross Profit MTD",
          "binding": "metrics.gross_profit_mtd",
          "format": "currency",
          "trend_binding": "metrics.gross_profit_trend"
        },
        {
          "id": "low_margin_count",
          "label": "Low Margin Orders",
          "binding": "metrics.low_margin_order_count",
          "format": "number",
          "color": "warning",
          "action": "filter_low_margin"
        },
        {
          "id": "override_count",
          "label": "Price Overrides",
          "binding": "metrics.price_override_count",
          "format": "number",
          "action": "filter_overrides"
        }
      ]
    },
    "margin_by_category": {
      "id": "category_margins",
      "type": "bar_chart",
      "location": "main_left",
      "title": "Margin by Product Category",
      "data_binding": "charts.margin_by_category",
      "x_axis": "category_name",
      "y_axis": "avg_margin_pct",
      "color_axis": "margin_vs_target",
      "drill_down": true
    },
    "margin_by_customer": {
      "id": "customer_margins",
      "type": "table",
      "location": "main_right",
      "title": "Customer Margin Analysis",
      "columns": [
        { "field": "customer_name", "label": "Customer", "sortable": true, "filterable": true },
        { "field": "revenue_mtd", "label": "Revenue", "format": "currency", "sortable": true },
        { "field": "cost_mtd", "label": "Cost", "format": "currency", "visible_if": "role.can_view_cost" },
        { "field": "gross_profit", "label": "Profit", "format": "currency", "sortable": true },
        { "field": "margin_pct", "label": "Margin %", "format": "percent", "sortable": true, "color_coded": true }
      ],
      "row_actions": [
        { "id": "view_orders", "label": "View Orders", "icon": "receipt" },
        { "id": "view_contract", "label": "View Contract", "icon": "description" }
      ],
      "filters": ["date_range", "division", "location", "sales_rep"],
      "export": true
    },
    "low_margin_orders": {
      "id": "low_margin_list",
      "type": "table",
      "location": "bottom",
      "title": "Orders Below Margin Threshold",
      "columns": [
        { "field": "order_number", "label": "Order #", "link": "order_detail" },
        { "field": "order_date", "label": "Date", "format": "date" },
        { "field": "customer_name", "label": "Customer" },
        { "field": "sales_rep", "label": "Rep" },
        { "field": "order_total", "label": "Total", "format": "currency" },
        { "field": "margin_pct", "label": "Margin", "format": "percent", "color_coded": true },
        { "field": "override_reason", "label": "Override Reason" },
        { "field": "approved_by", "label": "Approved By" }
      ],
      "default_filter": "margin_pct < 15",
      "alert_row": "margin_pct < 10"
    },
    "margin_trend": {
      "id": "margin_trend",
      "type": "line_chart",
      "title": "Margin Trend",
      "data_binding": "charts.margin_trend",
      "x_axis": "date",
      "series": [
        { "field": "avg_margin", "label": "Avg Margin", "color": "primary" },
        { "field": "target_margin", "label": "Target", "color": "grey", "dashed": true }
      ],
      "time_range_options": ["7d", "30d", "90d", "12m"]
    },
    "price_override_log": {
      "id": "override_log",
      "type": "table",
      "title": "Price Override Log",
      "columns": [
        { "field": "timestamp", "label": "Date/Time", "format": "datetime" },
        { "field": "order_number", "label": "Order" },
        { "field": "user_name", "label": "User" },
        { "field": "product", "label": "Product" },
        { "field": "original_price", "label": "Original", "format": "currency" },
        { "field": "override_price", "label": "Override", "format": "currency" },
        { "field": "variance_pct", "label": "Variance", "format": "percent" },
        { "field": "reason", "label": "Reason" },
        { "field": "approved_by", "label": "Approved By" }
      ],
      "filters": ["date_range", "user", "reason"],
      "export": true
    }
  }
}
```

---

## 5. pricing_rules

### Decision Tree: Which Pricing Model to Use

```
START: Determine Pricing Model for Order Line
│
├─▶ Is there an approved Quote for this customer/product?
│   │
│   ├─ YES ──▶ Is the quote still valid (not expired)?
│   │          │
│   │          ├─ YES ──▶ USE QUOTE_PRICING
│   │          │          └─▶ Lock price from quote
│   │          │
│   │          └─ NO ───▶ Continue to Contract check
│   │
│   └─ NO ───▶ Continue to Contract check
│
├─▶ Does customer have an active Contract?
│   │
│   ├─ YES ──▶ Does contract cover this product/category/grade?
│   │          │
│   │          ├─ YES ──▶ Is quantity within contract limits?
│   │          │          │
│   │          │          ├─ YES ──▶ USE CONTRACT_PRICING
│   │          │          │          └─▶ Apply contract discount/price
│   │          │          │
│   │          │          └─ NO ───▶ Warn user, offer contract or tier
│   │          │
│   │          └─ NO ───▶ Continue to Tier check
│   │
│   └─ NO ───▶ Continue to Tier check
│
├─▶ Is this a Commodity-Indexed Product?
│   │
│   ├─ YES ──▶ Is index data current (<7 days old)?
│   │          │
│   │          ├─ YES ──▶ USE COMMODITY_PRICING
│   │          │          └─▶ Calculate from index + adders
│   │          │
│   │          └─ NO ───▶ Warn "stale index", require approval
│   │                     └─▶ Fallback to LIST_PRICING
│   │
│   └─ NO ───▶ Continue to Tier check
│
├─▶ Does customer have a Pricing Tier?
│   │
│   ├─ YES ──▶ USE TIER_PRICING
│   │          └─▶ Apply tier price with quantity breaks
│   │
│   └─ NO ───▶ Continue to List check
│
├─▶ Is this a Remnant/Partial Unit?
│   │
│   ├─ YES ──▶ USE REMNANT_PRICING
│   │          └─▶ Apply size + age discounts
│   │          └─▶ Enforce floor price
│   │
│   └─ NO ───▶ Continue to final check
│
└─▶ DEFAULT: USE LIST_PRICING
             └─▶ Apply quantity breaks if applicable


RETAIL POS FLOW (Separate Path)
================================
START: POS Transaction
│
├─▶ Is customer linked to an Account?
│   │
│   ├─ YES ──▶ Does account have a Pricing Tier?
│   │          │
│   │          ├─ YES ──▶ USE TIER_PRICING
│   │          │
│   │          └─ NO ───▶ USE RETAIL_PRICING (account rate)
│   │
│   └─ NO ───▶ Cash customer ──▶ USE RETAIL_PRICING (cash rate)
│
├─▶ Is cutting required?
│   │
│   ├─ YES ──▶ ADD cutting_charges
│   │          └─▶ Enforce min cutting charge
│   │
│   └─ NO ───▶ Continue
│
└─▶ Apply small quantity surcharge if applicable


COST-PLUS FLOW (Special Case)
==============================
START: Cost-Plus Order
│
├─▶ Does customer have Cost-Plus contract?
│   │
│   ├─ YES ──▶ Is user authorized for cost-plus?
│   │          │
│   │          ├─ YES ──▶ USE COST_PLUS_PRICING
│   │          │          └─▶ cost × (1 + markup_pct)
│   │          │
│   │          └─ NO ───▶ Reject, use standard pricing
│   │
│   └─ NO ───▶ Use standard pricing flow


OVERRIDE FLOW
==============
START: Price Override Requested
│
├─▶ Calculate new margin at override price
│   │
│   ├─▶ Is margin >= minimum (10%)?
│   │   │
│   │   ├─ YES ──▶ Is discount <= user's authority (10%)?
│   │   │          │
│   │   │          ├─ YES ──▶ ALLOW override, log reason
│   │   │          │
│   │   │          └─ NO ───▶ REQUIRE manager approval
│   │   │
│   │   └─ NO ───▶ Is margin >= floor (5%)?
│   │              │
│   │              ├─ YES ──▶ REQUIRE branch manager approval
│   │              │
│   │              └─ NO ───▶ Is margin >= absolute floor (0%)?
│   │                         │
│   │                         ├─ YES ──▶ REQUIRE division manager approval
│   │                         │
│   │                         └─ NO ───▶ REJECT (below cost)
│   │                                    └─▶ Warn "selling at loss"
```

### Approval Thresholds

| Action | Threshold | Required Approver |
|--------|-----------|-------------------|
| Line discount | ≤ 10% | Self (CSR) |
| Line discount | 10-20% | BRANCH_MANAGER |
| Line discount | 20-30% | DIVISION_MANAGER |
| Line discount | > 30% | ADMIN |
| Order discount | ≤ 10% | Self (CSR) |
| Order discount | 10-20% | BRANCH_MANAGER |
| Order discount | > 20% | DIVISION_MANAGER |
| Price override (margin ≥ 15%) | Any | Self |
| Price override (margin 10-15%) | Any | BRANCH_MANAGER |
| Price override (margin 5-10%) | Any | BRANCH_MANAGER |
| Price override (margin < 5%) | Any | DIVISION_MANAGER |
| Price override (margin < 0%) | Any | REJECTED |
| Retail discount | ≤ 10% | Self (RETAIL_COUNTER) |
| Retail discount | 10-15% | BRANCH_MANAGER (PIN) |
| Retail void | Any | BRANCH_MANAGER (PIN) |

---

## 6. Price Display Formats

```json
{
  "formats": {
    "currency": {
      "pattern": "$#,##0.00",
      "locale": "en-US",
      "examples": ["$1,234.56", "$0.50", "$12,345.00"]
    },
    "currency_per_uom": {
      "pattern": "$#,##0.0000/{uom}",
      "examples": ["$0.4500/LB", "$125.00/CWT", "$2.50/FT"]
    },
    "percent": {
      "pattern": "#0.0%",
      "examples": ["15.0%", "2.5%", "0.0%"]
    },
    "quantity": {
      "pattern": "#,##0.### {uom}",
      "examples": ["1,500 LB", "25.5 FT", "100 EA"]
    }
  },
  "color_coding": {
    "margin": {
      "success": { "min": 20, "color": "#4CAF50" },
      "warning": { "min": 10, "max": 20, "color": "#FF9800" },
      "error": { "max": 10, "color": "#F44336" }
    },
    "discount": {
      "low": { "max": 5, "color": "#4CAF50" },
      "medium": { "min": 5, "max": 15, "color": "#FF9800" },
      "high": { "min": 15, "color": "#F44336" }
    },
    "price_source": {
      "contract": "#4CAF50",
      "tier": "#2196F3",
      "list": "#9E9E9E",
      "quote": "#9C27B0",
      "override": "#FF9800",
      "commodity": "#00BCD4"
    }
  },
  "tooltips": {
    "unit_price": "Price per {uom} before discounts",
    "extended_price": "Quantity × Unit Price",
    "net_price": "Extended Price - Line Discount",
    "margin_pct": "(Net Price - Cost) ÷ Net Price × 100",
    "floor_price": "Minimum price to achieve {min_margin}% margin"
  }
}
```

---

*Document generated for Build Phase: Pricing & Costing Structure*
