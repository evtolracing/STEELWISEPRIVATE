# 46 — AI Pricing & Costing Models

> **Purpose:** Comprehensive pricing engine architecture, costing models, calculation formulae, and override controls for AI-build.  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. Pricing Models — JSON

```json
{
  "pricing_models": {

    "contract_pricing": {
      "model_id": "PRICE-CONTRACT",
      "name": "Contract Pricing",
      "description": "Customer-specific negotiated pricing with term commitments",
      "priority": 1,
      "applies_when": [
        "customer.has_active_contract = true",
        "product in contract.product_scope",
        "order_date within contract.effective_period",
        "quantity >= contract.min_order_qty (if set)"
      ],
      "structure": {
        "contract": {
          "contract_id": "uuid",
          "customer_id": "uuid",
          "division_id": "uuid | null",
          "name": "string",
          "contract_number": "string",
          "effective_date": "date",
          "expiration_date": "date",
          "status": "enum(DRAFT, PENDING_APPROVAL, ACTIVE, EXPIRED, TERMINATED)",
          "auto_renew": "boolean",
          "renewal_terms_days": "integer",
          "min_annual_volume": "decimal | null",
          "min_annual_value": "decimal | null",
          "pricing_method": "enum(FIXED, DISCOUNT_PCT, DISCOUNT_AMT, COST_PLUS, MARKET_MINUS, FORMULA)",
          "price_adjustment_clause": "enum(NONE, QUARTERLY, SEMI_ANNUAL, ANNUAL, COMMODITY_LINKED)",
          "commodity_index": "string | null",
          "escalation_cap_pct": "decimal | null",
          "terms_and_conditions": "text",
          "approved_by": "uuid",
          "approved_at": "timestamp"
        },
        "contract_line": {
          "line_id": "uuid",
          "contract_id": "uuid",
          "product_id": "uuid | null",
          "product_category_id": "uuid | null",
          "grade_id": "uuid | null",
          "form_id": "uuid | null",
          "dimension_range": {
            "thickness_min": "decimal | null",
            "thickness_max": "decimal | null",
            "width_min": "decimal | null",
            "width_max": "decimal | null"
          },
          "pricing_method": "enum(FIXED, DISCOUNT_PCT, DISCOUNT_AMT, COST_PLUS, MARKET_MINUS)",
          "fixed_price": "decimal | null",
          "discount_percent": "decimal | null",
          "discount_amount": "decimal | null",
          "cost_plus_pct": "decimal | null",
          "market_minus_amt": "decimal | null",
          "price_uom": "string",
          "min_qty": "decimal | null",
          "max_qty": "decimal | null",
          "effective_date": "date | null",
          "expiration_date": "date | null"
        },
        "contract_processing": {
          "processing_line_id": "uuid",
          "contract_id": "uuid",
          "processing_type": "enum(CUT_TO_LENGTH, SLITTING, BLANKING, LEVELING, SHEARING, SAWING)",
          "pricing_method": "enum(FIXED_PER_PIECE, FIXED_PER_CWT, FIXED_PER_LB, DISCOUNT_PCT)",
          "fixed_rate": "decimal | null",
          "discount_percent": "decimal | null",
          "min_charge": "decimal | null"
        }
      },
      "resolution_order": [
        "exact_product_match",
        "product_category + grade + form + dimension_range",
        "product_category + grade + form",
        "product_category + grade",
        "product_category",
        "catch_all_line (product_id = null)"
      ],
      "examples": [
        {
          "scenario": "Fixed price contract for A36 HR Sheet",
          "input": {"customer": "CUST-001", "product": "HR-SHEET-A36-0.25x48x120", "qty": 5000, "uom": "LB"},
          "contract_match": {"contract": "CNT-2026-0045", "line": "Fixed $0.42/lb for A36 HR Sheet"},
          "output": {"unit_price": 0.42, "uom": "LB", "source": "CONTRACT"}
        },
        {
          "scenario": "Cost-plus contract for custom grades",
          "input": {"customer": "CUST-002", "product": "CR-COIL-1008-0.060x36", "qty": 20000, "uom": "LB"},
          "contract_match": {"contract": "CNT-2026-0088", "line": "Cost + 15% for all CR products"},
          "output": {"unit_price": 0.506, "uom": "LB", "source": "CONTRACT", "calculation": "0.44 * 1.15"}
        }
      ]
    },

    "market_pricing": {
      "model_id": "PRICE-MARKET",
      "name": "Market/Commodity Pricing",
      "description": "Pricing tied to commodity indices with adjustments",
      "priority": 2,
      "applies_when": [
        "product.pricing_method = 'MARKET'",
        "OR contract.price_adjustment_clause = 'COMMODITY_LINKED'",
        "commodity_index available for product.grade"
      ],
      "structure": {
        "commodity_index": {
          "index_id": "uuid",
          "name": "string",
          "code": "string",
          "source": "enum(CRU, AMM, PLATTS, FASTMARKETS, INTERNAL)",
          "product_type": "enum(HRC, CRC, HDG, PLATE, REBAR, STRUCTURAL)",
          "region": "enum(US_MIDWEST, US_SOUTH, US_WEST, IMPORT)",
          "currency": "string",
          "uom": "string",
          "update_frequency": "enum(DAILY, WEEKLY, MONTHLY)",
          "is_active": "boolean"
        },
        "commodity_price": {
          "price_id": "uuid",
          "index_id": "uuid",
          "effective_date": "date",
          "price_low": "decimal",
          "price_high": "decimal",
          "price_mid": "decimal",
          "price_settlement": "decimal | null",
          "source_reference": "string",
          "captured_at": "timestamp",
          "captured_by": "uuid"
        },
        "market_price_rule": {
          "rule_id": "uuid",
          "product_category_id": "uuid",
          "grade_id": "uuid | null",
          "index_id": "uuid",
          "price_basis": "enum(LOW, MID, HIGH, SETTLEMENT)",
          "base_adder": "decimal",
          "gauge_adders": [
            {"thickness_min": 0.0, "thickness_max": 0.074, "adder": 0.08},
            {"thickness_min": 0.075, "thickness_max": 0.134, "adder": 0.04},
            {"thickness_min": 0.135, "thickness_max": 0.500, "adder": 0.00}
          ],
          "width_adders": [
            {"width_min": 0, "width_max": 36, "adder": 0.02},
            {"width_min": 36.01, "width_max": 60, "adder": 0.00},
            {"width_min": 60.01, "width_max": 999, "adder": 0.01}
          ],
          "grade_adders": {
            "A36": 0.00,
            "A572-50": 0.03,
            "A588": 0.06,
            "AR400": 0.12
          },
          "effective_date": "date",
          "expiration_date": "date | null"
        }
      },
      "price_lag_options": {
        "CURRENT": "Use today's posted price",
        "PRIOR_WEEK": "Use prior week's average",
        "PRIOR_MONTH": "Use prior month's average",
        "ORDER_DATE": "Lock price at order entry",
        "SHIP_DATE": "Price at shipment date"
      },
      "examples": [
        {
          "scenario": "HRC market price with gauge adder",
          "input": {"product": "HR-COIL-A36-0.060x48", "date": "2026-01-15"},
          "market_lookup": {"index": "CRU_HRC_MIDWEST", "mid_price": 0.38},
          "adders": {"base": 0.02, "gauge_0.060": 0.04, "grade_A36": 0.00},
          "output": {"unit_price": 0.44, "uom": "LB", "source": "MARKET"}
        }
      ]
    },

    "processing_pricing": {
      "model_id": "PRICE-PROCESSING",
      "name": "Processing/Conversion Pricing",
      "description": "Charges for value-added processing services",
      "priority": 3,
      "applies_when": [
        "order_line.processing_type is not null",
        "OR work_order.operations.length > 0"
      ],
      "structure": {
        "processing_rate": {
          "rate_id": "uuid",
          "location_id": "uuid | null",
          "work_center_id": "uuid | null",
          "processing_type": "enum(CUT_TO_LENGTH, SLITTING, BLANKING, LEVELING, SHEARING, SAWING, PLASMA, LASER, DRILLING, PAINTING, GALVANIZING)",
          "material_type": "enum(HOT_ROLLED, COLD_ROLLED, GALVANIZED, STAINLESS, ALUMINUM, PLATE)",
          "rate_type": "enum(PER_CUT, PER_PIECE, PER_CWT, PER_LB, PER_LINEAR_FT, PER_SQ_FT, PER_HOUR, FLAT)",
          "base_rate": "decimal",
          "min_charge": "decimal",
          "setup_charge": "decimal | null",
          "thickness_multipliers": [
            {"min": 0.0, "max": 0.134, "multiplier": 1.0},
            {"min": 0.135, "max": 0.250, "multiplier": 1.2},
            {"min": 0.251, "max": 0.500, "multiplier": 1.5},
            {"min": 0.501, "max": 1.000, "multiplier": 2.0},
            {"min": 1.001, "max": 999, "multiplier": 2.5}
          ],
          "width_multipliers": [
            {"min": 0, "max": 48, "multiplier": 1.0},
            {"min": 48.01, "max": 72, "multiplier": 1.1},
            {"min": 72.01, "max": 999, "multiplier": 1.25}
          ],
          "grade_multipliers": {
            "CARBON": 1.0,
            "ALLOY": 1.3,
            "STAINLESS": 1.8,
            "AR": 1.5
          },
          "quantity_breaks": [
            {"min_qty": 0, "discount_pct": 0},
            {"min_qty": 1000, "discount_pct": 5},
            {"min_qty": 5000, "discount_pct": 10},
            {"min_qty": 20000, "discount_pct": 15}
          ],
          "effective_date": "date",
          "expiration_date": "date | null"
        },
        "processing_extra": {
          "extra_id": "uuid",
          "processing_rate_id": "uuid",
          "extra_type": "enum(TOLERANCE, EDGE_CONDITION, SURFACE_FINISH, CERTIFICATION, PACKAGING, RUSH)",
          "description": "string",
          "charge_type": "enum(FLAT, PER_PIECE, PER_CWT, PERCENT)",
          "charge_amount": "decimal"
        }
      },
      "calculation_methods": {
        "CUT_TO_LENGTH": {
          "formula": "(num_cuts * per_cut_rate * thickness_mult * grade_mult) + setup_charge",
          "min_check": "MAX(calculated, min_charge)",
          "variables": {
            "num_cuts": "ceil(coil_length / piece_length)",
            "per_cut_rate": "processing_rate.base_rate",
            "thickness_mult": "lookup(thickness_multipliers, thickness)",
            "grade_mult": "lookup(grade_multipliers, grade_category)"
          }
        },
        "SLITTING": {
          "formula": "(coil_weight * per_lb_rate * width_mult * grade_mult) + setup_charge",
          "min_check": "MAX(calculated, min_charge)",
          "variables": {
            "coil_weight": "input_weight_lbs",
            "per_lb_rate": "processing_rate.base_rate",
            "width_mult": "lookup by num_slits or mults",
            "grade_mult": "lookup(grade_multipliers, grade_category)"
          }
        },
        "BLANKING": {
          "formula": "(num_pieces * per_piece_rate * thickness_mult) + (num_dies * die_setup_charge)",
          "min_check": "MAX(calculated, min_charge)"
        },
        "SAWING": {
          "formula": "(num_cuts * per_cut_rate * area_multiplier)",
          "variables": {
            "area_multiplier": "cut_area_sq_in / 10"
          }
        }
      },
      "examples": [
        {
          "scenario": "Cut-to-length 0.25\" HR coil into 120\" sheets",
          "input": {"coil_length_ft": 500, "piece_length_in": 120, "thickness": 0.25, "grade": "A36"},
          "calculation": {
            "num_cuts": 50,
            "per_cut_rate": 1.50,
            "thickness_mult": 1.2,
            "grade_mult": 1.0,
            "setup_charge": 25.00
          },
          "output": {"processing_charge": 115.00, "per_piece": 2.30}
        }
      ]
    },

    "remnant_pricing": {
      "model_id": "PRICE-REMNANT",
      "name": "Remnant/Odd-Lot Pricing",
      "description": "Discounted pricing for remnant pieces and odd lots",
      "priority": 4,
      "applies_when": [
        "inventory_item.is_remnant = true",
        "OR inventory_item.quantity < min_order_qty",
        "OR inventory_item.days_in_inventory > remnant_age_threshold"
      ],
      "structure": {
        "remnant_rule": {
          "rule_id": "uuid",
          "location_id": "uuid | null",
          "product_category_id": "uuid | null",
          "remnant_type": "enum(SIZE_REMNANT, QUANTITY_REMNANT, AGE_REMNANT, QUALITY_DOWNGRADE)",
          "discount_method": "enum(PERCENT_OFF_LIST, PERCENT_OFF_MARKET, FIXED_PER_LB, COST_PLUS)",
          "discount_value": "decimal",
          "min_price_floor_pct": "decimal",
          "auto_discount_schedule": [
            {"days_in_inventory": 0, "discount_pct": 0},
            {"days_in_inventory": 30, "discount_pct": 10},
            {"days_in_inventory": 60, "discount_pct": 20},
            {"days_in_inventory": 90, "discount_pct": 30},
            {"days_in_inventory": 180, "discount_pct": 40}
          ],
          "requires_approval_over_pct": "decimal",
          "effective_date": "date"
        },
        "remnant_threshold": {
          "threshold_id": "uuid",
          "product_category_id": "uuid",
          "form_id": "uuid",
          "dimension_type": "enum(LENGTH, WIDTH, AREA, WEIGHT)",
          "threshold_value": "decimal",
          "threshold_uom": "string",
          "is_remnant_below": "boolean"
        }
      },
      "classification_rules": {
        "COIL_REMNANT": {
          "condition": "remaining_length < 100 ft OR remaining_weight < 2000 lb",
          "auto_flag": true
        },
        "SHEET_REMNANT": {
          "condition": "area < 8 sq_ft OR any_dimension < 24 in",
          "auto_flag": true
        },
        "PLATE_REMNANT": {
          "condition": "area < 6 sq_ft OR any_dimension < 18 in",
          "auto_flag": true
        },
        "BAR_REMNANT": {
          "condition": "length < 36 in",
          "auto_flag": true
        }
      },
      "examples": [
        {
          "scenario": "Coil tail end after slitting",
          "input": {"item": "INV-2026-00456", "remaining_weight": 1500, "days_old": 45, "list_price": 0.45},
          "classification": "COIL_REMNANT + AGE_REMNANT",
          "calculation": {"base_discount": 15, "age_discount": 15, "total_discount": 30},
          "output": {"unit_price": 0.315, "source": "REMNANT"}
        }
      ]
    },

    "retail_pricing": {
      "model_id": "PRICE-RETAIL",
      "name": "Retail/List Pricing",
      "description": "Standard list pricing with quantity breaks",
      "priority": 5,
      "applies_when": [
        "no contract match",
        "product.pricing_method = 'LIST'",
        "default fallback"
      ],
      "structure": {
        "product_price": {
          "price_id": "uuid",
          "product_id": "uuid",
          "location_id": "uuid | null",
          "price_list_id": "uuid",
          "base_price": "decimal",
          "price_uom": "string",
          "min_order_qty": "decimal",
          "min_order_uom": "string",
          "effective_date": "date",
          "expiration_date": "date | null"
        },
        "price_list": {
          "list_id": "uuid",
          "name": "string",
          "code": "string",
          "currency": "string",
          "is_default": "boolean",
          "customer_types": ["RETAIL", "CONTRACTOR", "FABRICATOR", "OEM", "DISTRIBUTOR"],
          "effective_date": "date"
        },
        "quantity_break": {
          "break_id": "uuid",
          "product_price_id": "uuid",
          "min_qty": "decimal",
          "max_qty": "decimal | null",
          "discount_type": "enum(PERCENT, AMOUNT, NEW_PRICE)",
          "discount_value": "decimal"
        },
        "customer_discount": {
          "discount_id": "uuid",
          "customer_id": "uuid",
          "product_category_id": "uuid | null",
          "discount_type": "enum(PERCENT, AMOUNT)",
          "discount_value": "decimal",
          "effective_date": "date",
          "expiration_date": "date | null"
        }
      },
      "price_list_hierarchy": [
        "customer_specific_price",
        "customer_type_price_list",
        "location_price_list",
        "default_price_list"
      ],
      "examples": [
        {
          "scenario": "Walk-in retail customer",
          "input": {"customer": "CASH_SALE", "product": "HR-SHEET-A36-0.25x48x96", "qty": 10, "uom": "EA"},
          "price_lookup": {"list": "RETAIL", "base_price": 125.00},
          "qty_break": null,
          "output": {"unit_price": 125.00, "source": "LIST"}
        },
        {
          "scenario": "Contractor with volume discount",
          "input": {"customer": "CUST-0123", "product": "HR-SHEET-A36-0.25x48x96", "qty": 100, "uom": "EA"},
          "price_lookup": {"list": "CONTRACTOR", "base_price": 115.00},
          "qty_break": {"min": 50, "discount": 5},
          "output": {"unit_price": 109.25, "source": "LIST+QTY_BREAK"}
        }
      ]
    },

    "special_pricing": {
      "model_id": "PRICE-SPECIAL",
      "name": "Special/Override Pricing",
      "description": "Manual pricing adjustments requiring approval",
      "priority": 0,
      "applies_when": [
        "user applies manual override",
        "quote_special_pricing = true",
        "competitive_match scenario"
      ],
      "structure": {
        "price_override": {
          "override_id": "uuid",
          "order_line_id": "uuid | null",
          "quote_line_id": "uuid | null",
          "original_price": "decimal",
          "override_price": "decimal",
          "override_type": "enum(COMPETITIVE_MATCH, VOLUME_DEAL, RELATIONSHIP, ERROR_CORRECTION, MANAGER_DISCRETION)",
          "reason_code": "string",
          "justification": "text",
          "competitor_name": "string | null",
          "competitor_price": "decimal | null",
          "requested_by": "uuid",
          "approved_by": "uuid | null",
          "approved_at": "timestamp | null",
          "status": "enum(PENDING, APPROVED, REJECTED, EXPIRED)"
        }
      },
      "approval_thresholds": [
        {"discount_pct_max": 5, "approver_role": "INSIDE_SALES"},
        {"discount_pct_max": 10, "approver_role": "SALES_MANAGER"},
        {"discount_pct_max": 20, "approver_role": "BRANCH_MANAGER"},
        {"discount_pct_max": 100, "approver_role": "SUPER_ADMIN"}
      ],
      "margin_protection": {
        "min_margin_pct": 8,
        "below_margin_requires": "BRANCH_MANAGER",
        "below_cost_requires": "SUPER_ADMIN",
        "below_cost_allowed": false
      }
    }
  }
}
```

---

## 2. Costing Models — JSON

```json
{
  "costing_models": {

    "standard_costing": {
      "model_id": "COST-STANDARD",
      "name": "Standard Costing",
      "description": "Predetermined costs for budgeting and variance analysis",
      "update_frequency": "MONTHLY",
      "structure": {
        "standard_cost": {
          "cost_id": "uuid",
          "product_id": "uuid",
          "location_id": "uuid",
          "cost_type": "enum(MATERIAL, LABOR, OVERHEAD, FREIGHT_IN, TOTAL)",
          "cost_per_unit": "decimal",
          "cost_uom": "string",
          "effective_date": "date",
          "expiration_date": "date | null",
          "source": "enum(CALCULATED, MANUAL, IMPORT)",
          "last_review_date": "date",
          "reviewed_by": "uuid"
        },
        "cost_component": {
          "component_id": "uuid",
          "standard_cost_id": "uuid",
          "component_type": "enum(RAW_MATERIAL, DIRECT_LABOR, MACHINE_TIME, VARIABLE_OH, FIXED_OH, FREIGHT, OTHER)",
          "component_name": "string",
          "cost_amount": "decimal",
          "cost_pct": "decimal"
        }
      },
      "calculation_method": {
        "material_cost": "weighted_avg_purchase_price_ytd",
        "labor_cost": "standard_hours * labor_rate_by_work_center",
        "overhead_cost": "labor_cost * overhead_rate_pct",
        "freight_in": "avg_freight_per_lb_by_region"
      },
      "variance_tracking": {
        "purchase_price_variance": "actual_price - standard_price",
        "material_usage_variance": "(actual_qty - standard_qty) * standard_price",
        "labor_efficiency_variance": "(actual_hours - standard_hours) * standard_rate",
        "labor_rate_variance": "(actual_rate - standard_rate) * actual_hours"
      }
    },

    "actual_costing": {
      "model_id": "COST-ACTUAL",
      "name": "Actual/FIFO Costing",
      "description": "Real-time cost tracking based on actual transactions",
      "update_frequency": "REAL_TIME",
      "structure": {
        "inventory_cost_layer": {
          "layer_id": "uuid",
          "inventory_item_id": "uuid",
          "receipt_date": "timestamp",
          "receipt_document": "string",
          "original_qty": "decimal",
          "remaining_qty": "decimal",
          "unit_cost": "decimal",
          "cost_uom": "string",
          "cost_components": {
            "material": "decimal",
            "freight": "decimal",
            "duty": "decimal",
            "other": "decimal"
          },
          "lot_number": "string | null",
          "heat_number": "string | null"
        },
        "cost_transaction": {
          "transaction_id": "uuid",
          "transaction_type": "enum(RECEIPT, ISSUE, TRANSFER, ADJUSTMENT, REVALUATION)",
          "inventory_item_id": "uuid",
          "quantity": "decimal",
          "unit_cost": "decimal",
          "total_cost": "decimal",
          "layer_id": "uuid | null",
          "reference_type": "enum(PO_RECEIPT, WORK_ORDER_ISSUE, SALES_SHIPMENT, INV_ADJUST, TRANSFER)",
          "reference_id": "uuid",
          "transaction_date": "timestamp",
          "created_by": "uuid"
        }
      },
      "layer_consumption": {
        "method": "FIFO",
        "algorithm": "consume oldest layers first by receipt_date",
        "partial_layer": "allowed - update remaining_qty",
        "layer_exhausted": "mark layer closed, move to next"
      },
      "cost_flow": {
        "receipt": {
          "action": "create new cost layer",
          "cost_capture": ["po_unit_price", "freight_allocation", "duty_allocation", "receiving_labor"]
        },
        "issue_to_production": {
          "action": "consume from oldest layer",
          "cost_relief": "FIFO layers to WIP",
          "costing_method": "layer_unit_cost"
        },
        "shipment": {
          "action": "consume from oldest layer",
          "cost_relief": "FIFO layers to COGS",
          "margin_calc": "revenue - COGS"
        },
        "transfer": {
          "action": "consume and recreate layer",
          "cost_carry": "maintain original layer cost"
        },
        "adjustment": {
          "action": "adjust layer quantity or value",
          "variance_capture": "post to inventory adjustment account"
        }
      }
    },

    "job_costing": {
      "model_id": "COST-JOB",
      "name": "Job/Work Order Costing",
      "description": "Cost accumulation for processing operations",
      "structure": {
        "work_order_cost": {
          "wo_cost_id": "uuid",
          "work_order_id": "uuid",
          "cost_category": "enum(MATERIAL, LABOR, MACHINE, OVERHEAD, SCRAP, OUTSIDE_SERVICE)",
          "planned_cost": "decimal",
          "actual_cost": "decimal",
          "variance": "decimal",
          "variance_pct": "decimal"
        },
        "operation_cost": {
          "op_cost_id": "uuid",
          "work_order_operation_id": "uuid",
          "labor_hours": "decimal",
          "labor_cost": "decimal",
          "machine_hours": "decimal",
          "machine_cost": "decimal",
          "setup_hours": "decimal",
          "setup_cost": "decimal",
          "overhead_cost": "decimal"
        },
        "material_cost": {
          "mat_cost_id": "uuid",
          "work_order_material_id": "uuid",
          "planned_qty": "decimal",
          "actual_qty": "decimal",
          "unit_cost": "decimal",
          "total_cost": "decimal",
          "scrap_qty": "decimal",
          "scrap_cost": "decimal"
        }
      },
      "overhead_application": {
        "method": "MACHINE_HOUR_RATE",
        "rates": {
          "CTL_LINE": 85.00,
          "SLITTER": 120.00,
          "PLASMA": 150.00,
          "LASER": 200.00,
          "SAW": 65.00,
          "SHEAR": 75.00
        },
        "includes": ["depreciation", "maintenance", "utilities", "indirect_labor"]
      },
      "scrap_costing": {
        "capture": "actual_scrap_qty from work_order",
        "valuation": "material_cost_per_unit",
        "recovery": "scrap_value if sold",
        "net_scrap_cost": "scrap_cost - scrap_recovery"
      }
    },

    "landed_cost": {
      "model_id": "COST-LANDED",
      "name": "Landed Cost Calculation",
      "description": "Total cost including freight, duty, and handling",
      "structure": {
        "landed_cost_calc": {
          "calc_id": "uuid",
          "po_receipt_id": "uuid",
          "base_material_cost": "decimal",
          "freight_cost": "decimal",
          "duty_cost": "decimal",
          "insurance_cost": "decimal",
          "handling_cost": "decimal",
          "inspection_cost": "decimal",
          "other_cost": "decimal",
          "total_landed_cost": "decimal",
          "cost_per_unit": "decimal",
          "cost_uom": "string"
        }
      },
      "allocation_methods": {
        "freight": {
          "method": "WEIGHT_PRORATION",
          "formula": "(line_weight / total_shipment_weight) * total_freight"
        },
        "duty": {
          "method": "VALUE_PRORATION",
          "formula": "(line_value / total_shipment_value) * total_duty"
        },
        "handling": {
          "method": "PER_UNIT",
          "formula": "handling_rate_per_lb * line_weight"
        }
      },
      "sources": {
        "domestic": ["base_price", "freight", "handling"],
        "import": ["base_price", "ocean_freight", "duty", "customs_fees", "inland_freight", "handling", "insurance"]
      }
    },

    "replacement_cost": {
      "model_id": "COST-REPLACEMENT",
      "name": "Replacement Cost",
      "description": "Current market cost to replace inventory",
      "usage": ["margin_analysis", "pricing_floor", "inventory_valuation_review"],
      "structure": {
        "replacement_cost": {
          "repl_cost_id": "uuid",
          "product_id": "uuid",
          "location_id": "uuid",
          "replacement_cost": "decimal",
          "cost_uom": "string",
          "source": "enum(LAST_PO, AVG_VENDOR_QUOTE, COMMODITY_INDEX, MANUAL)",
          "effective_date": "date",
          "valid_days": "integer"
        }
      },
      "calculation_priority": [
        "latest_po_price + current_freight_estimate",
        "vendor_quote_avg (last 30 days)",
        "commodity_index + standard_adders",
        "manual_override"
      ]
    }
  }
}
```

---

## 3. Pricing Formulae — Symbolic Math

### Base Price Calculations

$$
P_{contract} = \begin{cases}
P_{fixed} & \text{if method = FIXED} \\
P_{list} \times (1 - d_{pct}) & \text{if method = DISCOUNT\_PCT} \\
P_{list} - d_{amt} & \text{if method = DISCOUNT\_AMT} \\
C_{unit} \times (1 + m_{pct}) & \text{if method = COST\_PLUS} \\
P_{market} - a_{amt} & \text{if method = MARKET\_MINUS}
\end{cases}
$$

$$
P_{market} = P_{index} + A_{base} + A_{gauge}(t) + A_{width}(w) + A_{grade}(g)
$$

Where:
- $P_{index}$ = commodity index price (low/mid/high/settlement)
- $A_{base}$ = base adder for product category
- $A_{gauge}(t)$ = thickness-based adder, $t$ = thickness in inches
- $A_{width}(w)$ = width-based adder, $w$ = width in inches
- $A_{grade}(g)$ = grade-specific adder

$$
A_{gauge}(t) = \begin{cases}
0.08 & \text{if } t < 0.075 \\
0.04 & \text{if } 0.075 \leq t < 0.135 \\
0.00 & \text{if } 0.135 \leq t < 0.500 \\
-0.02 & \text{if } t \geq 0.500
\end{cases}
$$

### Processing Charge Calculations

$$
C_{CTL} = \max\left( (n_{cuts} \times R_{cut} \times M_t \times M_g) + S_{setup}, C_{min} \right)
$$

Where:
- $n_{cuts} = \lceil L_{coil} / L_{piece} \rceil$
- $R_{cut}$ = rate per cut
- $M_t$ = thickness multiplier
- $M_g$ = grade multiplier
- $S_{setup}$ = setup charge
- $C_{min}$ = minimum charge

$$
C_{slit} = \max\left( (W_{coil} \times R_{lb} \times M_w \times M_g) + S_{setup}, C_{min} \right)
$$

Where:
- $W_{coil}$ = coil weight in lbs
- $R_{lb}$ = rate per lb
- $M_w$ = width/slit count multiplier

$$
M_t(t) = \begin{cases}
1.0 & \text{if } t \leq 0.134 \\
1.2 & \text{if } 0.135 \leq t \leq 0.250 \\
1.5 & \text{if } 0.251 \leq t \leq 0.500 \\
2.0 & \text{if } 0.501 \leq t \leq 1.000 \\
2.5 & \text{if } t > 1.000
\end{cases}
$$

### Quantity Break Calculation

$$
P_{qty} = P_{base} \times (1 - d_{qty})
$$

Where:
$$
d_{qty} = \max_{i}\{d_i : Q \geq Q_{min,i}\}
$$

### Remnant Pricing

$$
P_{remnant} = P_{base} \times (1 - d_{type}) \times (1 - d_{age})
$$

$$
d_{age}(t) = \min\left(\frac{t}{180} \times 0.40, d_{max}\right)
$$

Where:
- $t$ = days in inventory
- $d_{max}$ = maximum age discount (typically 0.40)

$$
P_{remnant} \geq P_{floor} = C_{unit} \times (1 + m_{min})
$$

### Total Line Price

$$
P_{line} = (P_{material} \times Q) + C_{processing} + C_{extras} + C_{freight}
$$

$$
P_{material} = \text{resolve}(P_{contract}, P_{market}, P_{list}, P_{remnant})
$$

### Margin Calculations

$$
M_{gross} = \frac{P_{line} - C_{line}}{P_{line}} \times 100\%
$$

$$
C_{line} = C_{material} + C_{processing\_actual} + C_{freight\_out}
$$

$$
M_{contribution} = P_{line} - C_{variable}
$$

### Tax Calculation

$$
T_{sales} = (P_{subtotal} - D_{order}) \times R_{tax}(jurisdiction)
$$

Where:
- $D_{order}$ = order-level discounts
- $R_{tax}$ = tax rate based on ship-to jurisdiction

### Weight Calculations (for pricing UoM conversion)

$$
W_{sheet} = L \times W \times t \times \rho
$$

Where:
- $L$ = length (in)
- $W$ = width (in)  
- $t$ = thickness (in)
- $\rho$ = density (lb/in³), steel ≈ 0.2836

$$
W_{coil} = L_{ft} \times W_{in} \times t_{in} \times 0.2836 \times 12
$$

$$
W_{cwt} = \frac{W_{lb}}{100}
$$

### Price Per Conversions

$$
P_{per\_lb} = \frac{P_{per\_piece}}{W_{piece}}
$$

$$
P_{per\_cwt} = P_{per\_lb} \times 100
$$

$$
P_{per\_ton} = P_{per\_lb} \times 2000
$$

$$
P_{per\_sqft} = P_{per\_lb} \times \frac{W_{piece}}{A_{sqft}}
$$

---

## 4. Pricing Rules — Decision Trees

### Master Price Resolution Tree

```
PRICE_RESOLUTION_TREE
│
├─► [1] CHECK_SPECIAL_OVERRIDE
│   ├─ IF order_line.has_approved_override = true
│   │   └─► RETURN override_price
│   └─ ELSE → continue
│
├─► [2] CHECK_CONTRACT_PRICING
│   ├─ IF customer.has_active_contract = true
│   │   ├─ [2.1] MATCH_CONTRACT_LINE
│   │   │   ├─ TRY exact_product_match
│   │   │   │   └─ IF found → APPLY_CONTRACT_PRICING
│   │   │   ├─ TRY category + grade + form + dimension_range
│   │   │   │   └─ IF found → APPLY_CONTRACT_PRICING
│   │   │   ├─ TRY category + grade + form
│   │   │   │   └─ IF found → APPLY_CONTRACT_PRICING
│   │   │   ├─ TRY category + grade
│   │   │   │   └─ IF found → APPLY_CONTRACT_PRICING
│   │   │   ├─ TRY catch_all_line
│   │   │   │   └─ IF found → APPLY_CONTRACT_PRICING
│   │   │   └─ ELSE → continue to market/list
│   │   │
│   │   └─ [2.2] APPLY_CONTRACT_PRICING
│   │       ├─ IF method = FIXED → RETURN fixed_price
│   │       ├─ IF method = DISCOUNT_PCT → RETURN base_price × (1 - discount)
│   │       ├─ IF method = DISCOUNT_AMT → RETURN base_price - discount
│   │       ├─ IF method = COST_PLUS → RETURN cost × (1 + markup)
│   │       └─ IF method = MARKET_MINUS → GOTO MARKET_PRICING, subtract amount
│   │
│   └─ ELSE → continue
│
├─► [3] CHECK_REMNANT_PRICING
│   ├─ IF inventory_item.is_remnant = true
│   │   ├─ [3.1] CALCULATE_REMNANT_DISCOUNT
│   │   │   ├─ GET base_discount for remnant_type
│   │   │   ├─ GET age_discount from schedule(days_in_inventory)
│   │   │   ├─ CALCULATE total_discount = base + age (capped)
│   │   │   └─ RETURN base_price × (1 - total_discount)
│   │   │
│   │   └─ [3.2] CHECK_PRICE_FLOOR
│   │       ├─ IF remnant_price < cost × (1 + min_margin)
│   │       │   └─ RETURN floor_price, FLAG for_approval
│   │       └─ ELSE → RETURN remnant_price
│   │
│   └─ ELSE → continue
│
├─► [4] CHECK_MARKET_PRICING
│   ├─ IF product.pricing_method = 'MARKET'
│   │   ├─ [4.1] GET_COMMODITY_PRICE
│   │   │   ├─ LOOKUP commodity_index for product.grade
│   │   │   ├─ GET latest_price based on price_lag_rule
│   │   │   └─ SELECT price_basis (low/mid/high)
│   │   │
│   │   ├─ [4.2] APPLY_ADDERS
│   │   │   ├─ ADD base_adder for product_category
│   │   │   ├─ ADD gauge_adder(product.thickness)
│   │   │   ├─ ADD width_adder(product.width)
│   │   │   ├─ ADD grade_adder(product.grade)
│   │   │   └─ SUM → market_price
│   │   │
│   │   └─ [4.3] APPLY_CUSTOMER_ADJUSTMENT
│   │       ├─ IF customer.market_discount exists → APPLY
│   │       └─ RETURN adjusted_market_price
│   │
│   └─ ELSE → continue
│
├─► [5] LIST_PRICING (Default)
│   ├─ [5.1] GET_BASE_PRICE
│   │   ├─ TRY customer_specific_price
│   │   ├─ TRY customer_type_price_list
│   │   ├─ TRY location_price_list
│   │   └─ USE default_price_list
│   │
│   ├─ [5.2] APPLY_QUANTITY_BREAKS
│   │   ├─ IF qty >= break_threshold
│   │   │   ├─ FIND highest_applicable_break
│   │   │   └─ APPLY discount_pct or discount_amt
│   │   └─ ELSE → use base_price
│   │
│   └─ [5.3] APPLY_CUSTOMER_DISCOUNT
│       ├─ IF customer.category_discount exists → APPLY
│       └─ RETURN final_list_price
│
└─► [6] RETURN resolved_price with source_metadata
```

### Processing Charge Decision Tree

```
PROCESSING_CHARGE_TREE
│
├─► [1] CHECK_CONTRACT_PROCESSING
│   ├─ IF customer.contract.has_processing_rates = true
│   │   ├─ MATCH processing_type
│   │   ├─ IF method = FIXED → RETURN contract_rate
│   │   └─ IF method = DISCOUNT_PCT → APPLY to standard_rate
│   └─ ELSE → continue
│
├─► [2] GET_STANDARD_PROCESSING_RATE
│   ├─ [2.1] MATCH by:
│   │   ├─ location_id (if set)
│   │   ├─ work_center_id (if set)
│   │   ├─ processing_type
│   │   └─ material_type
│   │
│   ├─ [2.2] GET base_rate and rate_type
│   │   ├─ PER_CUT → base for cut operations
│   │   ├─ PER_LB → base for weight operations
│   │   ├─ PER_PIECE → base for unit operations
│   │   └─ PER_HOUR → base for time operations
│   │
│   └─ [2.3] APPLY multipliers
│       ├─ thickness_multiplier(material.thickness)
│       ├─ width_multiplier(material.width)
│       └─ grade_multiplier(material.grade_category)
│
├─► [3] CALCULATE_BASE_CHARGE
│   ├─ IF rate_type = PER_CUT
│   │   └─ charge = num_cuts × rate × multipliers
│   ├─ IF rate_type = PER_LB
│   │   └─ charge = weight_lbs × rate × multipliers
│   ├─ IF rate_type = PER_PIECE
│   │   └─ charge = num_pieces × rate × multipliers
│   └─ IF rate_type = PER_HOUR
│       └─ charge = est_hours × rate × multipliers
│
├─► [4] ADD_SETUP_CHARGE
│   ├─ IF operation.requires_setup = true
│   │   └─ charge += setup_charge
│   └─ ELSE → continue
│
├─► [5] ADD_EXTRAS
│   ├─ FOR EACH extra in (tolerance, edge_condition, surface, cert, packaging, rush)
│   │   ├─ IF extra.selected = true
│   │   │   ├─ IF charge_type = FLAT → ADD flat_amount
│   │   │   ├─ IF charge_type = PER_PIECE → ADD amount × num_pieces
│   │   │   ├─ IF charge_type = PER_CWT → ADD amount × weight_cwt
│   │   │   └─ IF charge_type = PERCENT → ADD base_charge × pct
│   │   └─ CONTINUE
│
├─► [6] APPLY_QUANTITY_DISCOUNT
│   ├─ IF total_qty >= qty_break_threshold
│   │   ├─ FIND applicable_discount_pct
│   │   └─ charge = charge × (1 - discount_pct)
│   └─ ELSE → continue
│
├─► [7] APPLY_MINIMUM_CHARGE
│   ├─ IF charge < min_charge
│   │   └─ charge = min_charge
│   └─ ELSE → continue
│
└─► [8] RETURN processing_charge with breakdown
```

### Approval Routing Decision Tree

```
PRICE_APPROVAL_TREE
│
├─► [1] CALCULATE_DISCOUNT_LEVEL
│   ├─ base_price = resolve_standard_price()
│   ├─ proposed_price = order_line.unit_price
│   ├─ discount_pct = (base_price - proposed_price) / base_price × 100
│   └─ discount_amt = base_price - proposed_price
│
├─► [2] CHECK_MARGIN
│   ├─ unit_cost = get_cost(product, location)
│   ├─ margin_pct = (proposed_price - unit_cost) / proposed_price × 100
│   └─ IF margin_pct < min_margin_threshold → FLAG margin_warning
│
├─► [3] DETERMINE_APPROVAL_REQUIREMENT
│   │
│   ├─ IF discount_pct <= 0
│   │   └─► NO_APPROVAL_NEEDED
│   │
│   ├─ IF discount_pct <= 5 AND margin_pct >= min_margin
│   │   └─► APPROVE_AUTO (or INSIDE_SALES if configured)
│   │
│   ├─ IF discount_pct <= 10 AND margin_pct >= min_margin
│   │   └─► REQUIRE_APPROVAL (SALES_MANAGER)
│   │
│   ├─ IF discount_pct <= 20 AND margin_pct >= min_margin
│   │   └─► REQUIRE_APPROVAL (BRANCH_MANAGER)
│   │
│   ├─ IF discount_pct > 20 OR margin_pct < min_margin
│   │   └─► REQUIRE_APPROVAL (SUPER_ADMIN)
│   │
│   └─ IF proposed_price < unit_cost
│       ├─ FLAG below_cost_sale
│       └─► REQUIRE_APPROVAL (SUPER_ADMIN) + BLOCK if not allowed
│
├─► [4] CHECK_CONTRACT_OVERRIDE
│   ├─ IF order uses contract_pricing
│   │   └─ IF proposed_price < contract_price
│   │       └─► ADD_APPROVER (contract_owner)
│   └─ ELSE → continue
│
├─► [5] CHECK_CREDIT_IMPLICATIONS
│   ├─ IF extended_credit required
│   │   └─► ADD_APPROVER (AR_CLERK or CREDIT_MANAGER)
│   └─ ELSE → continue
│
└─► [6] RETURN approval_requirements
    ├─ requires_approval: boolean
    ├─ approvers: [roles]
    ├─ flags: [warnings]
    └─ auto_approve_eligible: boolean
```

### Tax Determination Decision Tree

```
TAX_DETERMINATION_TREE
│
├─► [1] CHECK_EXEMPTION
│   ├─ IF customer.tax_exempt = true
│   │   ├─ VALIDATE exemption_certificate
│   │   │   ├─ IF valid AND covers jurisdiction
│   │   │   │   └─► RETURN tax = 0, exempt_reason
│   │   │   └─ IF expired OR invalid
│   │   │       └─► FLAG, continue to tax calc
│   │   └─ ELSE → continue
│   │
│   ├─ IF order.exempt_certificate provided
│   │   └─ VALIDATE and store, RETURN tax = 0
│   │
│   └─ ELSE → continue
│
├─► [2] DETERMINE_JURISDICTION
│   ├─ GET ship_to_address
│   ├─ IF ship_from and ship_to same state
│   │   └─ jurisdiction = state + county + city + district
│   ├─ IF different states
│   │   └─ CHECK nexus(ship_from_state, ship_to_state)
│   │       ├─ IF nexus exists → use destination rules
│   │       └─ IF no nexus → origin rules or exempt
│   └─ RESOLVE final jurisdiction_code
│
├─► [3] GET_TAX_RATE
│   ├─ IF using_tax_engine (Avalara, Vertex, etc.)
│   │   └─► CALL tax_engine.calculate(line_items, addresses)
│   │
│   └─ IF using_internal_rates
│       ├─ LOOKUP tax_rate(jurisdiction_code, product_tax_class)
│       ├─ SUM state_rate + county_rate + city_rate + district_rate
│       └─ RETURN combined_rate
│
├─► [4] CHECK_PRODUCT_TAXABILITY
│   ├─ IF product.tax_class = EXEMPT
│   │   └─► RETURN tax = 0 for this line
│   ├─ IF product.tax_class = REDUCED
│   │   └─► APPLY reduced_rate
│   └─ ELSE → APPLY standard_rate
│
├─► [5] CALCULATE_TAX
│   ├─ taxable_amount = line_subtotal - line_discounts
│   ├─ tax_amount = taxable_amount × tax_rate
│   └─ RETURN tax_breakdown by jurisdiction
│
└─► [6] RETURN tax_result
    ├─ total_tax: decimal
    ├─ jurisdiction_breakdown: []
    ├─ exemption_applied: boolean
    └─ tax_engine_transaction_id: string | null
```

### Freight Pricing Decision Tree

```
FREIGHT_PRICING_TREE
│
├─► [1] CHECK_SHIPPING_TERMS
│   ├─ IF order.freight_terms = 'PREPAID_ADD'
│   │   └─ continue to calculate freight
│   ├─ IF order.freight_terms = 'PREPAID_ALLOW'
│   │   └─ continue, but may net to zero
│   ├─ IF order.freight_terms = 'COLLECT'
│   │   └─► RETURN freight = 0 (customer pays carrier direct)
│   ├─ IF order.freight_terms = 'FOB_ORIGIN'
│   │   └─► RETURN freight = 0 (customer responsibility)
│   └─ DEFAULT → continue
│
├─► [2] CHECK_CONTRACT_FREIGHT
│   ├─ IF customer.contract.freight_included = true
│   │   └─► RETURN freight = 0
│   ├─ IF customer.contract.freight_rate exists
│   │   └─► USE contract_freight_rate
│   └─ ELSE → continue
│
├─► [3] CHECK_FREE_FREIGHT_THRESHOLD
│   ├─ IF order.subtotal >= free_freight_threshold
│   │   └─► RETURN freight = 0
│   ├─ IF order.weight >= free_freight_weight
│   │   └─► RETURN freight = 0
│   └─ ELSE → continue
│
├─► [4] DETERMINE_DELIVERY_METHOD
│   ├─ IF order.delivery_method = 'WILL_CALL'
│   │   └─► RETURN freight = 0
│   ├─ IF order.delivery_method = 'OUR_TRUCK'
│   │   └─► USE internal_delivery_rates
│   ├─ IF order.delivery_method = 'COMMON_CARRIER'
│   │   └─► QUOTE from carrier_rates or API
│   └─ IF order.delivery_method = 'LTL' or 'FLATBED'
│       └─► QUOTE based on class/weight/distance
│
├─► [5] CALCULATE_FREIGHT
│   │
│   ├─ [5.1] INTERNAL_DELIVERY
│   │   ├─ LOOKUP zone from ship_to.zip
│   │   ├─ GET rate_per_cwt for zone
│   │   ├─ freight = weight_cwt × rate
│   │   ├─ APPLY min_charge if freight < min
│   │   └─ RETURN freight
│   │
│   ├─ [5.2] CARRIER_QUOTE
│   │   ├─ CALL carrier_api.get_rates(origin, dest, weight, dims, class)
│   │   ├─ SELECT lowest_rate or preferred_carrier
│   │   ├─ ADD fuel_surcharge if applicable
│   │   ├─ ADD handling_fees
│   │   └─ RETURN freight + carrier_id
│   │
│   └─ [5.3] ZONE_TABLE_LOOKUP
│       ├─ GET freight_zone(origin_zip, dest_zip)
│       ├─ GET rate from weight_break_table(zone, weight)
│       ├─ ADD accessorials (liftgate, residential, notify)
│       └─ RETURN freight
│
├─► [6] APPLY_FREIGHT_MARKUP
│   ├─ IF freight_markup_pct configured
│   │   └─ freight = freight × (1 + markup_pct)
│   └─ ELSE → continue
│
└─► [7] RETURN freight_result
    ├─ freight_amount: decimal
    ├─ calculation_method: string
    ├─ carrier_id: uuid | null
    ├─ estimated_transit_days: integer
    └─ accessorials_included: []
```

---

## 5. UI Overrides — Component Tree

```
PRICING_OVERRIDE_UI
│
├── PriceOverridePanel
│   ├── props: { orderLine, permissions, onPriceChange, onApprovalRequest }
│   ├── state: { 
│   │     isEditing, 
│   │     proposedPrice, 
│   │     overrideReason, 
│   │     approvalStatus,
│   │     validationErrors 
│   │   }
│   │
│   ├── PriceDisplaySection
│   │   ├── SystemPriceCard
│   │   │   ├── PriceLabel: "System Price"
│   │   │   ├── PriceValue: formatCurrency(systemPrice)
│   │   │   ├── PriceUom: "per {uom}"
│   │   │   ├── PriceSource: Badge(contract|market|list|remnant)
│   │   │   └── PriceBreakdown: Collapsible
│   │   │       ├── BasePrice: row
│   │   │       ├── Adders: row[]
│   │   │       ├── Discounts: row[]
│   │   │       └── FinalPrice: row (bold)
│   │   │
│   │   ├── CostInfoCard (if hasPermission.viewCost)
│   │   │   ├── UnitCost: formatCurrency(cost)
│   │   │   ├── MarginAtSystemPrice: formatPct(systemMargin)
│   │   │   ├── MarginAtProposed: formatPct(proposedMargin)
│   │   │   └── MarginIndicator: ColorBar(red|yellow|green)
│   │   │
│   │   └── ContractInfoCard (if hasContract)
│   │       ├── ContractName: link
│   │       ├── ContractNumber: text
│   │       ├── ExpirationDate: date
│   │       └── ContractPrice: formatCurrency
│   │
│   ├── PriceEditSection
│   │   ├── OverrideToggle
│   │   │   ├── Switch: "Override System Price"
│   │   │   ├── enabled: hasPermission.priceOverride
│   │   │   └── disabled_reason: "Requires Sales Manager approval"
│   │   │
│   │   ├── PriceInput (if isEditing)
│   │   │   ├── NumericInput
│   │   │   │   ├── value: proposedPrice
│   │   │   │   ├── min: 0
│   │   │   │   ├── step: 0.01
│   │   │   │   ├── prefix: "$"
│   │   │   │   └── suffix: "/ {uom}"
│   │   │   ├── QuickAdjustButtons
│   │   │   │   ├── Button: "-5%"
│   │   │   │   ├── Button: "-2%"
│   │   │   │   ├── Button: "+2%"
│   │   │   │   └── Button: "+5%"
│   │   │   └── ResetButton: "Reset to System Price"
│   │   │
│   │   ├── DiscountDisplay
│   │   │   ├── DiscountPct: formatPct(discountFromSystem)
│   │   │   ├── DiscountAmt: formatCurrency(discountAmount)
│   │   │   └── DiscountWarning: Alert (if > threshold)
│   │   │
│   │   └── ReasonSelector
│   │       ├── ReasonDropdown
│   │       │   ├── options: [
│   │       │   │     "COMPETITIVE_MATCH",
│   │       │   │     "VOLUME_DEAL", 
│   │       │   │     "RELATIONSHIP",
│   │       │   │     "ERROR_CORRECTION",
│   │       │   │     "MANAGER_DISCRETION"
│   │       │   │   ]
│   │       │   └── required: true
│   │       │
│   │       ├── CompetitorFields (if reason = COMPETITIVE_MATCH)
│   │       │   ├── CompetitorName: TextInput
│   │       │   └── CompetitorPrice: NumericInput
│   │       │
│   │       └── JustificationText
│   │           ├── TextArea: max 500 chars
│   │           └── required: (discountPct > 10)
│   │
│   ├── ApprovalSection
│   │   ├── ApprovalRequiredAlert (if requiresApproval)
│   │   │   ├── Icon: warning
│   │   │   ├── Message: "This discount requires {role} approval"
│   │   │   └── ApproverList: Avatar[]
│   │   │
│   │   ├── MarginWarningAlert (if marginBelowThreshold)
│   │   │   ├── Icon: error
│   │   │   ├── Message: "Margin {x}% is below minimum {min}%"
│   │   │   └── RequiredApprover: "Branch Manager or above"
│   │   │
│   │   ├── BelowCostAlert (if priceBelowCost)
│   │   │   ├── Icon: error
│   │   │   ├── Message: "Price is below cost - sale not permitted"
│   │   │   └── BlockSave: true
│   │   │
│   │   ├── ApprovalStatusBadge
│   │   │   ├── status: PENDING | APPROVED | REJECTED
│   │   │   ├── approvedBy: UserAvatar + name
│   │   │   ├── approvedAt: timestamp
│   │   │   └── rejectionReason: text (if rejected)
│   │   │
│   │   └── ApprovalActions (if isPendingApproval && isApprover)
│   │       ├── ApproveButton: "Approve Override"
│   │       ├── RejectButton: "Reject"
│   │       └── RejectReasonModal
│   │           └── TextInput: reason
│   │
│   └── ActionButtons
│       ├── SaveButton
│       │   ├── text: requiresApproval ? "Submit for Approval" : "Apply Override"
│       │   ├── disabled: !isValid || blockedBelowCost
│       │   └── onClick: handleSave
│       ├── CancelButton: "Cancel"
│       └── HistoryButton: "View Price History"
│
├── ProcessingChargeOverridePanel
│   ├── props: { orderLine, processingDetails, permissions }
│   │
│   ├── ProcessingBreakdown
│   │   ├── OperationRow[] for each operation
│   │   │   ├── OperationType: badge
│   │   │   ├── BaseRate: currency
│   │   │   ├── Quantity: number
│   │   │   ├── Multipliers: chips[]
│   │   │   ├── Subtotal: currency
│   │   │   └── OverrideIcon (if overridden)
│   │   │
│   │   ├── ExtrasRow[] for each extra
│   │   │   ├── ExtraName: text
│   │   │   ├── ChargeType: text
│   │   │   └── Amount: currency
│   │   │
│   │   ├── SetupCharge: row
│   │   ├── QuantityDiscount: row (negative)
│   │   ├── MinChargeApplied: row (if applicable)
│   │   └── TotalProcessingCharge: row (bold)
│   │
│   ├── ProcessingOverrideInput
│   │   ├── OverrideToggle: Switch
│   │   ├── TotalOverrideInput: NumericInput
│   │   ├── PerUnitDisplay: calculated
│   │   └── ReasonSelector: dropdown
│   │
│   └── ContractRateIndicator (if using contract rates)
│       ├── ContractName: link
│       ├── ContractRate: currency
│       └── StandardRate: strikethrough
│
├── FreightOverridePanel
│   ├── props: { order, shippingDetails, permissions }
│   │
│   ├── FreightCalculation
│   │   ├── MethodDisplay: badge (OUR_TRUCK | CARRIER | WILL_CALL)
│   │   ├── ZoneDisplay: text
│   │   ├── WeightDisplay: formatted
│   │   ├── BaseFreight: currency
│   │   ├── Accessorials: row[]
│   │   ├── FuelSurcharge: row
│   │   └── TotalFreight: row (bold)
│   │
│   ├── FreightTermsSelector
│   │   ├── RadioGroup
│   │   │   ├── PREPAID_ADD: "Prepaid & Add"
│   │   │   ├── PREPAID_ALLOW: "Prepaid & Allow"
│   │   │   ├── COLLECT: "Collect"
│   │   │   └── FOB_ORIGIN: "FOB Origin"
│   │   └── ContractTermsIndicator (if locked by contract)
│   │
│   ├── FreightOverrideInput
│   │   ├── OverrideToggle: Switch
│   │   ├── FreightAmountInput: NumericInput
│   │   ├── WaiveFreightCheckbox: "Waive Freight"
│   │   └── ReasonSelector: dropdown
│   │
│   └── FreeFreightIndicator (if threshold met)
│       ├── Message: "Free freight - order over {threshold}"
│       └── ThresholdProgress: ProgressBar
│
├── BulkPriceAdjustmentModal
│   ├── props: { selectedLines, onApply }
│   │
│   ├── AdjustmentTypeSelector
│   │   ├── RadioGroup
│   │   │   ├── DISCOUNT_PCT: "Discount Percentage"
│   │   │   ├── DISCOUNT_AMT: "Discount Amount"
│   │   │   ├── SET_MARGIN: "Set Target Margin"
│   │   │   └── MARKUP_PCT: "Markup Percentage"
│   │   └── ValueInput: NumericInput
│   │
│   ├── PreviewTable
│   │   ├── Header: [Product, Current, New, Change, Margin]
│   │   ├── Row[] for each selected line
│   │   │   ├── ProductName: text
│   │   │   ├── CurrentPrice: currency
│   │   │   ├── NewPrice: currency (calculated)
│   │   │   ├── ChangeAmount: currency (+ or -)
│   │   │   └── NewMargin: percent with indicator
│   │   └── SummaryRow: totals
│   │
│   ├── BulkReasonSelector
│   │   ├── ReasonDropdown: required
│   │   └── JustificationText: optional
│   │
│   └── ApplyButton
│       ├── text: "Apply to {n} Lines"
│       ├── approvalNote: (if any require approval)
│       └── disabled: !valid
│
├── PriceHistoryModal
│   ├── props: { product, customer }
│   │
│   ├── HistoryFilters
│   │   ├── DateRangePicker
│   │   ├── CustomerFilter: (if viewing product)
│   │   └── ProductFilter: (if viewing customer)
│   │
│   ├── PriceHistoryChart
│   │   ├── LineChart
│   │   │   ├── xAxis: date
│   │   │   ├── yAxis: price
│   │   │   ├── series: [list_price, contract_price, actual_price]
│   │   │   └── markers: price_changes
│   │   └── ChartTooltip: details on hover
│   │
│   └── PriceHistoryTable
│       ├── Header: [Date, Order#, Price, Source, Discount, User]
│       ├── Row[] sorted by date desc
│       │   ├── TransactionDate: datetime
│       │   ├── OrderNumber: link
│       │   ├── UnitPrice: currency
│       │   ├── PriceSource: badge
│       │   ├── DiscountPct: percent
│       │   └── EnteredBy: user
│       └── Pagination
│
├── MarginAnalysisPanel
│   ├── props: { order | orderLine, costPermission }
│   │
│   ├── MarginSummary
│   │   ├── GrossMarginPct: large number
│   │   ├── GrossMarginAmt: currency
│   │   ├── MarginTrend: sparkline (vs history)
│   │   └── MarginComparison: vs target
│   │
│   ├── MarginBreakdown (if hasPermission)
│   │   ├── Revenue: row
│   │   ├── MaterialCost: row
│   │   ├── ProcessingCost: row
│   │   ├── FreightCost: row
│   │   ├── OtherCosts: row
│   │   ├── Divider
│   │   └── GrossProfit: row (bold)
│   │
│   ├── MarginByLine (for order view)
│   │   ├── StackedBarChart
│   │   │   ├── x: line items
│   │   │   ├── y: dollar contribution
│   │   │   └── colors: profit vs cost
│   │   └── LineMarginTable
│   │
│   └── MarginWarnings
│       ├── LowMarginAlert: (if any line < threshold)
│       ├── NegativeMarginAlert: (if any line negative)
│       └── OverallMarginAlert: (if order margin low)
│
└── ContractPricingLookup
    ├── props: { customer, product }
    │
    ├── ContractSearch
    │   ├── CustomerSelector: autocomplete
    │   ├── ProductSelector: autocomplete
    │   └── SearchButton: "Find Pricing"
    │
    ├── ContractResults
    │   ├── NoContractMessage: (if none found)
    │   │
    │   └── ContractCard[] (if found)
    │       ├── ContractHeader
    │       │   ├── ContractNumber: text
    │       │   ├── ContractName: text
    │       │   ├── StatusBadge: ACTIVE | EXPIRING
    │       │   └── ExpirationDate: date
    │       │
    │       ├── MatchingLineDetails
    │       │   ├── MatchType: "Exact Product" | "Category" | etc
    │       │   ├── PricingMethod: badge
    │       │   ├── ContractPrice: currency (large)
    │       │   ├── VsListPrice: percent (savings)
    │       │   └── Restrictions: chips (min qty, etc)
    │       │
    │       └── ApplyButton: "Use Contract Price"
    │
    └── ProcessingRatesSection (if applicable)
        ├── ProcessingRateCard[]
        │   ├── ProcessingType: badge
        │   ├── ContractRate: currency
        │   ├── StandardRate: strikethrough
        │   └── Discount: percent
        └── ApplyProcessingButton
```

---

*Document generated for AI-build Phase 11: Pricing & Costing Models*
