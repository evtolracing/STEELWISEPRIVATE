# 69-BUILD-MATERIAL-DIVISION-UI

> UI adaptations for metals vs plastics processing divisions.

---

## 1. diff_matrix

| aspect | metals | plastics | UI_implication |
|--------|--------|----------|----------------|
| **tolerances** | ±0.005" to ±0.125" typical; tighter for aerospace/medical | ±0.010" to ±0.250" typical; looser due to thermal expansion | Tolerance input field: different default ranges, validation rules, and warning thresholds per division |
| **thickness_units** | Gauge (10ga, 14ga) OR decimal inches | Decimal inches only; no gauge system | Conditional field: show gauge picker for metals, hide for plastics |
| **temperature_sensitivity** | Minimal at room temp; relevant for heat treatment | High; coefficient of thermal expansion critical | Plastics: show ambient temp field, expansion calculator; Metals: hide unless heat-treat order |
| **processes_primary** | Shearing, slitting, leveling, sawing, plasma/laser/waterjet, bending, punching | Sawing, routing, drilling, bending (heat), thermoforming, polishing, annealing | Process dropdown: filter available operations by division; different icons and labels |
| **processes_secondary** | Deburring, grinding, welding, galvanizing | Edge finishing, flame polishing, cementing, masking | Secondary ops checklist differs; plastics show adhesive/cementing options |
| **heat_treatment** | Common: annealing, tempering, stress relief | Rare: annealing for stress relief only | Metals: heat-treat dropdown with multiple options; Plastics: single checkbox if applicable |
| **certifications** | MTR (Mill Test Report) required; heat/lot traceability | COC (Certificate of Conformance); batch traceability | Document upload: MTR fields for metals, COC fields for plastics; different required attachments |
| **QA_tests** | Hardness, tensile, chemical analysis, ultrasonic | Impact resistance, UV stability, flammability, chemical resistance | QA checklist: division-specific test types; different pass/fail criteria |
| **surface_finish** | Mill finish, 2B, #4 brushed, mirror, painted, powder-coated | Clear, matte, textured, film-masked, polished | Finish dropdown: separate option lists per division |
| **scrap_handling** | Recyclable; value recovery; weigh and credit | Often non-recyclable; disposal cost; weigh and charge | Scrap entry: metals show credit calculation; plastics show disposal cost |
| **scrap_value** | Positive (commodity value) | Zero or negative (disposal fee) | Financial display: green credit for metals, red cost for plastics |
| **remnant_reuse** | Common; remnant inventory tracked | Less common; material degradation concerns | Remnant toggle: default ON for metals, OFF for plastics with warning |
| **packaging** | Banding, dunnage, skids, interleaving paper | Protective film, foam, crating, climate control | Packaging options checklist differs; plastics show film/climate options |
| **handling_notes** | Magnetic/non-magnetic; oxidation concerns | Static sensitivity; UV sensitivity; scratch-prone | Handling flags: different warning icons and auto-notes per division |
| **time_estimation** | Based on material hardness, thickness, cut length | Based on material type, thickness, thermal properties | Estimation algorithm: different multipliers and base times per division |
| **setup_time** | Blade changes, die setup, gauge adjustments | Blade changes, heat settings, feed rate adjustments | Setup fields: metals show die/gauge inputs; plastics show temp/feed inputs |
| **BOM_structure** | Single material + processing; simple hierarchy | May include adhesives, films, inserts; deeper hierarchy | BOM editor: plastics allow multi-material assemblies; metals typically single-source |
| **pricing_basis** | $/lb or $/cwt + processing | $/lb or $/sq ft + processing | Price input: unit selector differs; sq ft option for plastics sheet |
| **lead_time_factors** | Mill lead times, processing queue | Mill lead times, processing queue, cure times | Lead time calc: plastics add cure/conditioning buffer |
| **storage_requirements** | Indoor preferred; some outdoor OK | Climate-controlled; UV-protected | Warehouse assignment: plastics flag climate-controlled zones |

---

## 2. processing_templates

```json
{
  "metals": {
    "flat_sheet_cut_to_size": {
      "template_id": "M-FLAT-CTS",
      "name": "Flat Sheet Cut-to-Size",
      "operations": [
        { "seq": 1, "op": "shear", "work_center": "SHEAR", "time_factor": 1.0 },
        { "seq": 2, "op": "deburr", "work_center": "FINISH", "time_factor": 0.5, "optional": true }
      ],
      "default_tolerance": "±0.030\"",
      "applies_to": ["sheet", "plate"]
    },
    "slit_coil": {
      "template_id": "M-SLIT",
      "name": "Slit Coil to Width",
      "operations": [
        { "seq": 1, "op": "uncoil", "work_center": "SLITTER", "time_factor": 0.25 },
        { "seq": 2, "op": "slit", "work_center": "SLITTER", "time_factor": 1.0 },
        { "seq": 3, "op": "recoil", "work_center": "SLITTER", "time_factor": 0.25 }
      ],
      "default_tolerance": "±0.005\"",
      "applies_to": ["coil"]
    },
    "plasma_profile": {
      "template_id": "M-PLASMA",
      "name": "Plasma Cut Profile",
      "operations": [
        { "seq": 1, "op": "nest", "work_center": "CAD", "time_factor": 0.5 },
        { "seq": 2, "op": "plasma_cut", "work_center": "PLASMA", "time_factor": 1.0 },
        { "seq": 3, "op": "deburr", "work_center": "FINISH", "time_factor": 0.75 },
        { "seq": 4, "op": "inspect", "work_center": "QA", "time_factor": 0.25 }
      ],
      "default_tolerance": "±0.060\"",
      "applies_to": ["sheet", "plate"]
    },
    "laser_profile": {
      "template_id": "M-LASER",
      "name": "Laser Cut Profile",
      "operations": [
        { "seq": 1, "op": "nest", "work_center": "CAD", "time_factor": 0.5 },
        { "seq": 2, "op": "laser_cut", "work_center": "LASER", "time_factor": 1.0 },
        { "seq": 3, "op": "deburr", "work_center": "FINISH", "time_factor": 0.5, "optional": true },
        { "seq": 4, "op": "inspect", "work_center": "QA", "time_factor": 0.25 }
      ],
      "default_tolerance": "±0.010\"",
      "applies_to": ["sheet", "plate"]
    },
    "waterjet_profile": {
      "template_id": "M-WJET",
      "name": "Waterjet Cut Profile",
      "operations": [
        { "seq": 1, "op": "nest", "work_center": "CAD", "time_factor": 0.5 },
        { "seq": 2, "op": "waterjet_cut", "work_center": "WATERJET", "time_factor": 1.5 },
        { "seq": 3, "op": "dry", "work_center": "FINISH", "time_factor": 0.25 },
        { "seq": 4, "op": "inspect", "work_center": "QA", "time_factor": 0.25 }
      ],
      "default_tolerance": "±0.005\"",
      "applies_to": ["sheet", "plate", "bar"]
    },
    "saw_bar_stock": {
      "template_id": "M-SAW-BAR",
      "name": "Saw Bar/Tube to Length",
      "operations": [
        { "seq": 1, "op": "saw", "work_center": "SAW", "time_factor": 1.0 },
        { "seq": 2, "op": "deburr", "work_center": "FINISH", "time_factor": 0.5, "optional": true }
      ],
      "default_tolerance": "±0.030\"",
      "applies_to": ["bar", "tube", "angle", "channel", "beam"]
    },
    "bend_brake": {
      "template_id": "M-BEND",
      "name": "Brake Form",
      "operations": [
        { "seq": 1, "op": "shear", "work_center": "SHEAR", "time_factor": 1.0, "conditional": "if_not_precut" },
        { "seq": 2, "op": "bend", "work_center": "BRAKE", "time_factor": 1.5 },
        { "seq": 3, "op": "inspect", "work_center": "QA", "time_factor": 0.25 }
      ],
      "default_tolerance": "±0.030\" linear, ±1° angle",
      "applies_to": ["sheet", "plate"]
    },
    "punch_form": {
      "template_id": "M-PUNCH",
      "name": "Turret Punch",
      "operations": [
        { "seq": 1, "op": "program", "work_center": "CAD", "time_factor": 0.5 },
        { "seq": 2, "op": "punch", "work_center": "PUNCH", "time_factor": 1.0 },
        { "seq": 3, "op": "deburr", "work_center": "FINISH", "time_factor": 0.5 }
      ],
      "default_tolerance": "±0.010\"",
      "applies_to": ["sheet"]
    },
    "level_flatten": {
      "template_id": "M-LEVEL",
      "name": "Level/Flatten",
      "operations": [
        { "seq": 1, "op": "level", "work_center": "LEVELER", "time_factor": 1.0 }
      ],
      "default_tolerance": "flatness per ASTM A568",
      "applies_to": ["sheet", "plate", "coil"]
    },
    "heat_treat": {
      "template_id": "M-HT",
      "name": "Heat Treatment",
      "operations": [
        { "seq": 1, "op": "heat_treat", "work_center": "HEAT_TREAT", "time_factor": 4.0 },
        { "seq": 2, "op": "inspect", "work_center": "QA", "time_factor": 0.5 }
      ],
      "default_tolerance": "per spec",
      "applies_to": ["sheet", "plate", "bar"]
    }
  },
  "plastics": {
    "sheet_cut_to_size": {
      "template_id": "P-SHEET-CTS",
      "name": "Sheet Cut-to-Size",
      "operations": [
        { "seq": 1, "op": "saw", "work_center": "SAW", "time_factor": 1.2 },
        { "seq": 2, "op": "edge_finish", "work_center": "FINISH", "time_factor": 0.75, "optional": true }
      ],
      "default_tolerance": "±0.060\"",
      "applies_to": ["sheet"],
      "notes": "Allow thermal expansion buffer"
    },
    "rod_cut_to_length": {
      "template_id": "P-ROD-CTL",
      "name": "Rod/Tube Cut to Length",
      "operations": [
        { "seq": 1, "op": "saw", "work_center": "SAW", "time_factor": 1.0 },
        { "seq": 2, "op": "deburr", "work_center": "FINISH", "time_factor": 0.5, "optional": true }
      ],
      "default_tolerance": "±0.060\"",
      "applies_to": ["rod", "tube"]
    },
    "router_profile": {
      "template_id": "P-ROUTER",
      "name": "CNC Router Profile",
      "operations": [
        { "seq": 1, "op": "nest", "work_center": "CAD", "time_factor": 0.5 },
        { "seq": 2, "op": "route", "work_center": "ROUTER", "time_factor": 1.0 },
        { "seq": 3, "op": "edge_finish", "work_center": "FINISH", "time_factor": 0.75 },
        { "seq": 4, "op": "inspect", "work_center": "QA", "time_factor": 0.25 }
      ],
      "default_tolerance": "±0.015\"",
      "applies_to": ["sheet"]
    },
    "drill_tap": {
      "template_id": "P-DRILL",
      "name": "Drill and Tap",
      "operations": [
        { "seq": 1, "op": "drill", "work_center": "DRILL", "time_factor": 1.0 },
        { "seq": 2, "op": "tap", "work_center": "DRILL", "time_factor": 0.5, "optional": true },
        { "seq": 3, "op": "deburr", "work_center": "FINISH", "time_factor": 0.25 }
      ],
      "default_tolerance": "±0.010\" hole location",
      "applies_to": ["sheet", "rod", "tube"]
    },
    "heat_bend": {
      "template_id": "P-HBEND",
      "name": "Heat Bending",
      "operations": [
        { "seq": 1, "op": "heat_line", "work_center": "BEND", "time_factor": 0.5 },
        { "seq": 2, "op": "bend", "work_center": "BEND", "time_factor": 1.0 },
        { "seq": 3, "op": "cool", "work_center": "BEND", "time_factor": 0.5 },
        { "seq": 4, "op": "inspect", "work_center": "QA", "time_factor": 0.25 }
      ],
      "default_tolerance": "±2° angle, ±0.125\" linear",
      "applies_to": ["sheet"]
    },
    "thermoform": {
      "template_id": "P-THERMO",
      "name": "Thermoforming",
      "operations": [
        { "seq": 1, "op": "heat", "work_center": "THERMOFORM", "time_factor": 0.75 },
        { "seq": 2, "op": "form", "work_center": "THERMOFORM", "time_factor": 1.0 },
        { "seq": 3, "op": "cool", "work_center": "THERMOFORM", "time_factor": 0.5 },
        { "seq": 4, "op": "trim", "work_center": "SAW", "time_factor": 0.5 },
        { "seq": 5, "op": "inspect", "work_center": "QA", "time_factor": 0.25 }
      ],
      "default_tolerance": "±0.125\"",
      "applies_to": ["sheet"]
    },
    "flame_polish": {
      "template_id": "P-FLAME",
      "name": "Flame Polish Edges",
      "operations": [
        { "seq": 1, "op": "flame_polish", "work_center": "FINISH", "time_factor": 1.0 }
      ],
      "default_tolerance": "n/a",
      "applies_to": ["sheet"],
      "material_restriction": ["acrylic", "polycarbonate"]
    },
    "cement_bond": {
      "template_id": "P-CEMENT",
      "name": "Cement/Bond Assembly",
      "operations": [
        { "seq": 1, "op": "prep_surfaces", "work_center": "ASSEMBLY", "time_factor": 0.5 },
        { "seq": 2, "op": "apply_cement", "work_center": "ASSEMBLY", "time_factor": 0.5 },
        { "seq": 3, "op": "clamp_cure", "work_center": "ASSEMBLY", "time_factor": 2.0 },
        { "seq": 4, "op": "inspect", "work_center": "QA", "time_factor": 0.25 }
      ],
      "default_tolerance": "±0.030\" joint alignment",
      "applies_to": ["sheet", "rod", "tube"]
    },
    "anneal_stress_relief": {
      "template_id": "P-ANNEAL",
      "name": "Anneal / Stress Relief",
      "operations": [
        { "seq": 1, "op": "anneal", "work_center": "OVEN", "time_factor": 4.0 },
        { "seq": 2, "op": "slow_cool", "work_center": "OVEN", "time_factor": 2.0 }
      ],
      "default_tolerance": "n/a",
      "applies_to": ["sheet", "rod", "tube"],
      "notes": "Required before machining thick sections"
    },
    "polish_buff": {
      "template_id": "P-POLISH",
      "name": "Polish / Buff",
      "operations": [
        { "seq": 1, "op": "sand", "work_center": "FINISH", "time_factor": 1.0 },
        { "seq": 2, "op": "buff", "work_center": "FINISH", "time_factor": 1.0 },
        { "seq": 3, "op": "clean", "work_center": "FINISH", "time_factor": 0.25 }
      ],
      "default_tolerance": "n/a",
      "applies_to": ["sheet"]
    },
    "mask_apply": {
      "template_id": "P-MASK",
      "name": "Apply Protective Masking",
      "operations": [
        { "seq": 1, "op": "mask", "work_center": "PACK", "time_factor": 0.5 }
      ],
      "default_tolerance": "n/a",
      "applies_to": ["sheet"]
    }
  }
}
```

---

## 3. BOM_templates

```json
{
  "metals": {
    "simple_cut": {
      "template_id": "BOM-M-SIMPLE",
      "name": "Simple Cut (Single Material)",
      "structure": {
        "material": {
          "product_id": "required",
          "grade": "required",
          "form": "required (sheet|plate|coil|bar|tube|angle|channel|beam)",
          "thickness": "required",
          "thickness_unit": "gauge|inch|mm",
          "width": "required",
          "length": "optional (for bar stock)",
          "finish": "optional",
          "heat_number": "optional (for traceability)",
          "mtr_required": "boolean"
        },
        "processing": [
          {
            "operation": "required",
            "quantity": "required",
            "dimension_1": "optional",
            "dimension_2": "optional",
            "tolerance": "optional"
          }
        ],
        "yield": {
          "gross_weight": "calculated",
          "net_weight": "calculated",
          "scrap_weight": "calculated",
          "scrap_value": "calculated (positive)"
        }
      }
    },
    "fabricated_assembly": {
      "template_id": "BOM-M-FAB",
      "name": "Fabricated Assembly",
      "structure": {
        "components": [
          {
            "component_id": "generated",
            "material": {
              "product_id": "required",
              "grade": "required",
              "form": "required",
              "thickness": "required",
              "thickness_unit": "gauge|inch|mm",
              "width": "required",
              "length": "required",
              "heat_number": "optional"
            },
            "processing": [
              {
                "operation": "required",
                "specs": "object"
              }
            ],
            "quantity": "required"
          }
        ],
        "assembly_operations": [
          {
            "operation": "weld|bolt|rivet",
            "specs": "object"
          }
        ],
        "yield": {
          "total_weight": "calculated",
          "scrap_weight": "calculated",
          "scrap_value": "calculated"
        },
        "certifications": {
          "weld_certs_required": "boolean",
          "ndt_required": "boolean"
        }
      }
    },
    "coil_processing": {
      "template_id": "BOM-M-COIL",
      "name": "Coil Processing",
      "structure": {
        "source_coil": {
          "product_id": "required",
          "grade": "required",
          "thickness": "required",
          "thickness_unit": "gauge|inch",
          "width": "required",
          "weight": "required",
          "heat_number": "required",
          "coil_id": "required"
        },
        "output": {
          "type": "slit_coils|blanks|sheets",
          "specifications": [
            {
              "width": "required",
              "length": "optional",
              "quantity": "required"
            }
          ]
        },
        "yield": {
          "input_weight": "from source",
          "output_weight": "calculated",
          "edge_trim_weight": "calculated",
          "end_scrap_weight": "calculated",
          "total_scrap_value": "calculated"
        }
      }
    }
  },
  "plastics": {
    "simple_cut": {
      "template_id": "BOM-P-SIMPLE",
      "name": "Simple Cut (Single Material)",
      "structure": {
        "material": {
          "product_id": "required",
          "material_type": "required (acrylic|polycarbonate|HDPE|UHMW|nylon|delrin|PVC|ABS|etc)",
          "form": "required (sheet|rod|tube|film)",
          "thickness": "required",
          "thickness_unit": "inch|mm",
          "width": "required",
          "length": "optional",
          "color": "required",
          "finish": "optional (clear|matte|textured)",
          "uv_stabilized": "boolean",
          "lot_number": "optional",
          "coc_required": "boolean"
        },
        "processing": [
          {
            "operation": "required",
            "quantity": "required",
            "dimension_1": "optional",
            "dimension_2": "optional",
            "tolerance": "optional",
            "edge_finish": "optional"
          }
        ],
        "yield": {
          "gross_weight": "calculated",
          "net_weight": "calculated",
          "scrap_weight": "calculated",
          "scrap_disposal_cost": "calculated (negative or zero)"
        },
        "handling": {
          "mask_on": "boolean",
          "static_sensitive": "boolean"
        }
      }
    },
    "assembled_unit": {
      "template_id": "BOM-P-ASSY",
      "name": "Cemented/Assembled Unit",
      "structure": {
        "components": [
          {
            "component_id": "generated",
            "material": {
              "product_id": "required",
              "material_type": "required",
              "form": "required",
              "thickness": "required",
              "color": "required",
              "uv_stabilized": "boolean"
            },
            "processing": [
              {
                "operation": "required",
                "specs": "object"
              }
            ],
            "quantity": "required"
          }
        ],
        "consumables": [
          {
            "type": "cement|adhesive|tape|insert|fastener",
            "product_id": "required",
            "quantity": "required",
            "unit": "oz|each|ft"
          }
        ],
        "assembly_operations": [
          {
            "operation": "cement|tape|insert|mechanical",
            "cure_time_hours": "optional",
            "specs": "object"
          }
        ],
        "yield": {
          "total_weight": "calculated",
          "scrap_weight": "calculated",
          "scrap_disposal_cost": "calculated"
        }
      }
    },
    "thermoformed_part": {
      "template_id": "BOM-P-THERMO",
      "name": "Thermoformed Part",
      "structure": {
        "source_sheet": {
          "product_id": "required",
          "material_type": "required",
          "thickness": "required",
          "width": "required",
          "length": "required",
          "color": "required"
        },
        "tooling": {
          "mold_id": "required",
          "mold_type": "male|female|matched",
          "customer_owned": "boolean"
        },
        "output": {
          "part_number": "required",
          "quantity": "required",
          "trim_required": "boolean"
        },
        "yield": {
          "sheet_usage": "calculated",
          "trim_scrap": "calculated",
          "scrap_disposal_cost": "calculated"
        }
      }
    },
    "film_laminate": {
      "template_id": "BOM-P-FILM",
      "name": "Film/Laminate Application",
      "structure": {
        "base_material": {
          "product_id": "required",
          "material_type": "required",
          "form": "sheet",
          "thickness": "required",
          "width": "required",
          "length": "required"
        },
        "film": {
          "product_id": "required",
          "type": "protective|decorative|anti-static|uv-filter",
          "width": "required",
          "coverage": "one_side|both_sides"
        },
        "processing": [
          {
            "operation": "apply_film|cut|trim",
            "specs": "object"
          }
        ],
        "yield": {
          "base_usage": "calculated",
          "film_usage": "calculated",
          "scrap": "calculated"
        }
      }
    }
  }
}
```

---

## 4. data_model_overrides

```json
{
  "metals_only_fields": {
    "Product": [
      { "field": "gauge", "type": "string", "description": "Metal gauge (e.g., 10ga, 14ga, 20ga)" },
      { "field": "heat_treatment_state", "type": "enum", "values": ["annealed", "tempered", "normalized", "as_rolled", "quenched"], "description": "Current heat treatment condition" },
      { "field": "hardness_spec", "type": "string", "description": "Hardness specification (e.g., HRB 70-80)" },
      { "field": "magnetic", "type": "boolean", "description": "Is material magnetic" },
      { "field": "grain_direction", "type": "enum", "values": ["longitudinal", "transverse", "not_applicable"], "description": "Grain orientation for forming" }
    ],
    "InventoryItem": [
      { "field": "heat_number", "type": "string", "description": "Mill heat/lot number for traceability" },
      { "field": "mtr_document_id", "type": "uuid", "description": "Link to Mill Test Report document" },
      { "field": "coil_id", "type": "string", "description": "Source coil identifier" },
      { "field": "coil_position", "type": "enum", "values": ["head", "middle", "tail"], "description": "Position in original coil" }
    ],
    "Job": [
      { "field": "heat_treat_required", "type": "boolean", "description": "Requires heat treatment step" },
      { "field": "heat_treat_spec", "type": "string", "description": "Heat treatment specification" },
      { "field": "weld_procedure_id", "type": "string", "description": "Welding procedure specification" },
      { "field": "ndt_required", "type": "boolean", "description": "Non-destructive testing required" }
    ],
    "Scrap": [
      { "field": "commodity_type", "type": "string", "description": "Scrap commodity classification" },
      { "field": "recovery_value_per_lb", "type": "decimal", "description": "Current scrap value per pound" },
      { "field": "scrap_dealer_id", "type": "uuid", "description": "Designated scrap buyer" }
    ],
    "QATest": [
      { "field": "hardness_test_result", "type": "decimal", "description": "Measured hardness value" },
      { "field": "hardness_scale", "type": "enum", "values": ["HRA", "HRB", "HRC", "HV", "BHN"], "description": "Hardness scale used" },
      { "field": "tensile_strength_psi", "type": "integer", "description": "Tensile strength test result" },
      { "field": "yield_strength_psi", "type": "integer", "description": "Yield strength test result" },
      { "field": "elongation_percent", "type": "decimal", "description": "Elongation at break" },
      { "field": "chemical_analysis", "type": "json", "description": "Chemical composition results" }
    ],
    "Shipment": [
      { "field": "rust_inhibitor_applied", "type": "boolean", "description": "Rust preventative applied" },
      { "field": "interleaving_paper", "type": "boolean", "description": "Paper between sheets" }
    ]
  },
  "plastics_only_fields": {
    "Product": [
      { "field": "material_family", "type": "enum", "values": ["acrylic", "polycarbonate", "HDPE", "LDPE", "UHMW", "nylon", "delrin", "PVC", "ABS", "PETG", "polypropylene", "polystyrene", "PTFE", "PEEK", "other"], "description": "Plastic material family" },
      { "field": "color_code", "type": "string", "description": "Color identifier or Pantone" },
      { "field": "transparency", "type": "enum", "values": ["clear", "translucent", "opaque"], "description": "Light transmission" },
      { "field": "uv_stabilized", "type": "boolean", "description": "UV stabilizer added" },
      { "field": "food_grade", "type": "boolean", "description": "FDA food contact approved" },
      { "field": "flame_rating", "type": "string", "description": "UL flame rating (e.g., UL94 V-0)" },
      { "field": "coefficient_thermal_expansion", "type": "decimal", "description": "CTE in/in/°F" },
      { "field": "max_service_temp_f", "type": "integer", "description": "Maximum continuous service temperature" },
      { "field": "chemical_resistance_notes", "type": "text", "description": "Chemical compatibility notes" }
    ],
    "InventoryItem": [
      { "field": "lot_number", "type": "string", "description": "Manufacturer lot number" },
      { "field": "manufacture_date", "type": "date", "description": "Date of manufacture" },
      { "field": "expiration_date", "type": "date", "description": "Material expiration (if applicable)" },
      { "field": "coc_document_id", "type": "uuid", "description": "Link to Certificate of Conformance" },
      { "field": "masking_on", "type": "boolean", "description": "Protective masking present" },
      { "field": "masking_type", "type": "enum", "values": ["paper", "poly_film", "none"], "description": "Type of protective masking" },
      { "field": "storage_zone", "type": "enum", "values": ["climate_controlled", "uv_protected", "standard"], "description": "Required storage conditions" }
    ],
    "Job": [
      { "field": "ambient_temp_at_cut", "type": "decimal", "description": "Shop temperature during processing" },
      { "field": "expansion_allowance", "type": "decimal", "description": "Dimensional allowance for thermal expansion" },
      { "field": "anneal_required", "type": "boolean", "description": "Stress relief annealing required" },
      { "field": "cement_type", "type": "string", "description": "Adhesive/cement product used" },
      { "field": "cure_time_hours", "type": "decimal", "description": "Required cure time before shipping" },
      { "field": "static_precautions", "type": "boolean", "description": "Anti-static handling required" }
    ],
    "Scrap": [
      { "field": "recyclable", "type": "boolean", "description": "Material can be recycled" },
      { "field": "disposal_method", "type": "enum", "values": ["recycle", "landfill", "hazmat"], "description": "Disposal classification" },
      { "field": "disposal_cost_per_lb", "type": "decimal", "description": "Cost to dispose per pound" },
      { "field": "disposal_vendor_id", "type": "uuid", "description": "Waste disposal vendor" }
    ],
    "QATest": [
      { "field": "impact_strength", "type": "decimal", "description": "Impact test result (ft-lb/in)" },
      { "field": "flammability_rating", "type": "string", "description": "Flame test result" },
      { "field": "uv_transmission_percent", "type": "decimal", "description": "UV light transmission" },
      { "field": "haze_percent", "type": "decimal", "description": "Optical haze measurement" },
      { "field": "chemical_resistance_test", "type": "string", "description": "Chemical exposure test results" }
    ],
    "Shipment": [
      { "field": "protective_film_applied", "type": "boolean", "description": "Shipping film applied" },
      { "field": "foam_packaging", "type": "boolean", "description": "Foam separators used" },
      { "field": "climate_controlled_transport", "type": "boolean", "description": "Requires temp-controlled shipping" },
      { "field": "standing_orientation", "type": "boolean", "description": "Must ship standing (not flat)" }
    ]
  },
  "conditional_validation": {
    "metals": [
      { "rule": "if product.form == 'coil' then heat_number required" },
      { "rule": "if job.ndt_required == true then qa_tests must include ultrasonic or radiographic" },
      { "rule": "if grade contains 'aerospace' then mtr_document_id required" }
    ],
    "plastics": [
      { "rule": "if material_family == 'acrylic' then max flame_polish temperature < 400F" },
      { "rule": "if uv_stabilized == false and outdoor_use == true then show warning" },
      { "rule": "if thickness > 1.0 inch then anneal_required default true" },
      { "rule": "if expiration_date < today + 30 then show inventory warning" },
      { "rule": "if food_grade == true then lot_number and coc_document_id required" }
    ]
  },
  "ui_field_visibility": {
    "order_entry_form": {
      "metals": ["gauge", "heat_number", "mtr_required", "grain_direction"],
      "plastics": ["color_code", "uv_stabilized", "masking_on", "food_grade"],
      "both": ["product_id", "thickness", "width", "length", "quantity", "tolerance"]
    },
    "job_detail_panel": {
      "metals": ["heat_treat_required", "heat_treat_spec", "weld_procedure_id", "ndt_required"],
      "plastics": ["ambient_temp_at_cut", "anneal_required", "cement_type", "cure_time_hours"],
      "both": ["job_id", "status", "operations", "due_date", "assigned_operator"]
    },
    "inventory_card": {
      "metals": ["heat_number", "coil_id", "mtr_document_id", "magnetic"],
      "plastics": ["lot_number", "masking_on", "storage_zone", "expiration_date"],
      "both": ["product_id", "location", "quantity", "reserved", "available"]
    },
    "qa_form": {
      "metals": ["hardness_test_result", "tensile_strength_psi", "chemical_analysis"],
      "plastics": ["impact_strength", "flammability_rating", "haze_percent"],
      "both": ["inspector", "date", "pass_fail", "notes"]
    },
    "scrap_entry": {
      "metals": ["commodity_type", "recovery_value_per_lb", "scrap_dealer_id"],
      "plastics": ["recyclable", "disposal_method", "disposal_cost_per_lb"],
      "both": ["weight", "source_job", "material_type", "date"]
    }
  }
}
```

---

## 5. UI Component Conditional Rendering

```json
{
  "division_detection": {
    "source": "order.division_id OR product.division_id OR user.default_division",
    "fallback": "prompt user to select"
  },
  "component_rules": [
    {
      "component": "ThicknessInput",
      "metals": { "show_gauge_toggle": true, "default_unit": "gauge", "gauge_options": ["7ga", "10ga", "11ga", "12ga", "14ga", "16ga", "18ga", "20ga", "22ga", "24ga", "26ga"] },
      "plastics": { "show_gauge_toggle": false, "default_unit": "inch", "gauge_options": [] }
    },
    {
      "component": "ToleranceInput",
      "metals": { "presets": ["±0.005", "±0.010", "±0.030", "±0.060", "±0.125"], "default": "±0.030" },
      "plastics": { "presets": ["±0.015", "±0.030", "±0.060", "±0.125", "±0.250"], "default": "±0.060" }
    },
    {
      "component": "ProcessingOpsPicker",
      "metals": { "filter_by": "division=metals", "group_order": ["cutting", "forming", "finishing", "heat_treat", "inspection"] },
      "plastics": { "filter_by": "division=plastics", "group_order": ["cutting", "routing", "bending", "finishing", "assembly", "inspection"] }
    },
    {
      "component": "FinishDropdown",
      "metals": { "options": ["mill_finish", "2B", "2D", "BA", "no4_brushed", "no8_mirror", "painted", "powder_coated", "galvanized", "anodized"] },
      "plastics": { "options": ["clear", "matte", "textured", "polished", "flame_polished", "masked", "painted"] }
    },
    {
      "component": "DocumentUploader",
      "metals": { "required_types": ["mtr"], "optional_types": ["drawing", "po", "spec_sheet"] },
      "plastics": { "required_types": ["coc"], "optional_types": ["drawing", "po", "spec_sheet", "sds"] }
    },
    {
      "component": "ScrapValueDisplay",
      "metals": { "label": "Scrap Credit", "color": "success", "sign": "positive" },
      "plastics": { "label": "Disposal Cost", "color": "error", "sign": "negative" }
    },
    {
      "component": "StorageLocationPicker",
      "metals": { "zone_filter": null, "show_outdoor": true },
      "plastics": { "zone_filter": "climate_controlled", "show_outdoor": false }
    },
    {
      "component": "PackagingChecklist",
      "metals": { "options": ["banding", "dunnage", "skid", "interleaving_paper", "rust_inhibitor", "stretch_wrap"] },
      "plastics": { "options": ["foam_separator", "protective_film", "edge_protectors", "crate", "climate_pack", "standing_rack"] }
    },
    {
      "component": "WarningBanner",
      "metals": { "triggers": ["outdoor_storage_risk", "mtr_missing", "heat_lot_mismatch"] },
      "plastics": { "triggers": ["uv_exposure_risk", "expiration_near", "temp_out_of_range", "static_sensitive"] }
    }
  ]
}
```

---

## 6. Time Estimation Multipliers

| factor | metals_base | plastics_base | notes |
|--------|-------------|---------------|-------|
| saw_cut_per_inch | 0.10 min | 0.15 min | Plastics require slower feed |
| shear_cut_per_inch | 0.05 min | n/a | Shear not used for plastics |
| laser_cut_per_inch | 0.08 min | n/a | Laser not typical for plastics |
| router_cut_per_inch | n/a | 0.12 min | Router for plastics only |
| bend_per_hit | 0.25 min | 0.75 min | Plastics need heat + cool |
| deburr_per_edge_inch | 0.02 min | 0.03 min | Plastics more delicate |
| cement_bond_per_joint | n/a | 5.00 min | Includes cure wait |
| heat_treat_base | 120 min | n/a | Per batch |
| anneal_base | n/a | 180 min | Per batch |
| setup_time_saw | 5 min | 8 min | Plastics need speed/blade adj |
| setup_time_laser | 10 min | n/a | |
| setup_time_router | n/a | 12 min | |
| inspection_per_piece | 0.5 min | 0.75 min | Plastics visual more critical |
