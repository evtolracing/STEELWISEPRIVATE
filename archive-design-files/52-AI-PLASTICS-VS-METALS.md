# 52 — AI Plastics vs Metals BOM Differences

> **Purpose:** Manufacturing process differences, BOM structures, and estimation rules for plastics vs metals processing for AI-build.  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. Diff Matrix

```yaml
diff_matrix:

  # ═══════════════════════════════════════════════════════════════════
  # MATERIAL PROPERTIES COMPARISON
  # ═══════════════════════════════════════════════════════════════════
  material_properties:

    | Property              | Metals (Steel/Aluminum)        | Plastics (Thermoplastics)      | Plastics (Thermosets)          |
    |-----------------------|--------------------------------|--------------------------------|--------------------------------|
    | density_range         | 2.7-8.0 g/cm³                  | 0.9-1.5 g/cm³                  | 1.1-2.0 g/cm³                  |
    | melting_behavior      | Sharp melting point            | Gradual softening range        | No melting (decomposes)        |
    | recyclability         | Highly recyclable              | Recyclable (degrades)          | Not recyclable                 |
    | strength_profile      | High tensile/yield             | Lower, flexible                | Rigid, brittle                 |
    | corrosion             | Oxidation/rust prone           | Chemical resistant             | Chemical resistant             |
    | conductivity_thermal  | High (15-400 W/mK)             | Low (0.1-0.5 W/mK)             | Low (0.2-0.5 W/mK)             |
    | conductivity_electric | Conductive                     | Insulator                      | Insulator                      |
    | uv_resistance         | N/A                            | Degrades (needs additives)     | Variable                       |
    | shelf_life            | Unlimited (if protected)       | 1-5 years (material dependent) | 6-12 months (resin systems)    |
    | storage_requirements  | Dry, rust prevention           | Climate controlled, dark       | Refrigerated (some resins)     |

  # ═══════════════════════════════════════════════════════════════════
  # PROCESS COMPARISON
  # ═══════════════════════════════════════════════════════════════════
  process_comparison:

    | Aspect                  | Metals                          | Plastics                        |
    |-------------------------|--------------------------------|--------------------------------|
    | primary_shaping         | Rolling, casting, forging       | Injection, extrusion, molding   |
    | secondary_processing    | Cutting, forming, welding       | Trimming, assembly, bonding     |
    | joining_methods         | Welding, fasteners, rivets      | Adhesives, ultrasonic, snap-fit |
    | surface_finishing       | Coating, plating, painting      | Painting, texturing, in-mold    |
    | heat_treatment          | Common (anneal, temper, harden) | Rare (annealing some)           |
    | tooling_cost            | Medium-high                     | High (molds expensive)          |
    | tooling_lead_time       | 2-8 weeks                       | 8-20 weeks                      |
    | cycle_time              | Seconds to hours                | Seconds to minutes              |
    | scrap_handling          | Recyclable, high value          | Regrind (limited %), low value  |
    | dimensional_stability   | High                            | Lower (shrinkage, warpage)      |
    | tolerance_typical       | ±0.005" - ±0.030"               | ±0.002" - ±0.020"               |
    | batch_size_economics    | Low to high volume              | High volume preferred           |

  # ═══════════════════════════════════════════════════════════════════
  # BOM STRUCTURE COMPARISON
  # ═══════════════════════════════════════════════════════════════════
  bom_structure_comparison:

    | BOM Element             | Metals                          | Plastics                        |
    |-------------------------|--------------------------------|--------------------------------|
    | raw_material_unit       | Weight (lbs, kg)                | Weight (lbs, kg)                |
    | material_specification  | Grade, chemistry, properties    | Resin type, additives, color    |
    | material_certification  | MTR required                    | COA, lot traceability           |
    | color_management        | N/A (post-process)              | Masterbatch, compounded color   |
    | additive_tracking       | Alloy elements only             | UV, flame retardant, fillers    |
    | regrind_allowance       | N/A                             | 0-25% regrind ratio             |
    | mold_release            | N/A                             | Required, tracked               |
    | insert_components       | Purchased parts                 | Metal inserts, threaded inserts |
    | secondary_operations    | Machining, finishing            | Trimming, decorating, assembly  |
    | packaging_requirements  | Rust prevention, dunnage        | ESD protection, climate control |

  # ═══════════════════════════════════════════════════════════════════
  # QUALITY REQUIREMENTS COMPARISON
  # ═══════════════════════════════════════════════════════════════════
  quality_comparison:

    | Quality Aspect          | Metals                          | Plastics                        |
    |-------------------------|--------------------------------|--------------------------------|
    | incoming_inspection     | Chemistry, mechanical props     | Melt flow, moisture, color      |
    | in_process_checks       | Dimensions, visual, hardness    | Shot weight, dimensions, visual |
    | destructive_testing     | Tensile, impact, fatigue        | Tensile, impact, flexural       |
    | non_destructive_testing | UT, MT, PT, RT                  | Visual, dimensional, color      |
    | traceability_granularity| Heat/lot number                 | Lot/batch, cavity ID            |
    | critical_defects        | Cracks, inclusions, porosity    | Flash, sink, warp, voids        |
    | environmental_testing   | Corrosion, salt spray           | UV aging, thermal cycling       |
    | shelf_life_testing      | Rare                            | Required for some resins        |

  # ═══════════════════════════════════════════════════════════════════
  # COSTING MODEL COMPARISON
  # ═══════════════════════════════════════════════════════════════════
  costing_comparison:

    | Cost Element            | Metals                          | Plastics                        |
    |-------------------------|--------------------------------|--------------------------------|
    | material_pricing_basis  | $/lb + market index             | $/lb + commodity adjustment     |
    | material_yield          | 60-95% (geometry dependent)     | 95-99% (regrind usage)          |
    | scrap_value             | 30-80% of virgin cost           | 5-15% of virgin cost            |
    | tooling_amortization    | Per-piece or per-job            | Per-piece over tool life        |
    | energy_intensity        | High (melting, forming)         | Medium (heating, cooling)       |
    | labor_content           | Medium-high                     | Low (automated)                 |
    | secondary_ops_ratio     | 20-60% of part cost             | 5-20% of part cost              |
    | setup_time_factor       | High variability                | Lower (mold change time)        |
    | volume_break_points     | 10, 100, 1000, 10000            | 1000, 10000, 100000, 1000000    |

  # ═══════════════════════════════════════════════════════════════════
  # EQUIPMENT COMPARISON
  # ═══════════════════════════════════════════════════════════════════
  equipment_comparison:

    | Equipment Type          | Metals                          | Plastics                        |
    |-------------------------|--------------------------------|--------------------------------|
    | primary_equipment       | Mills, presses, lasers, saws    | Injection machines, extruders   |
    | capacity_metric         | Tonnage, kW, bed size           | Clamp tonnage, shot size        |
    | setup_time_typical      | 30 min - 4 hours                | 1-4 hours (mold change)         |
    | maintenance_frequency   | Daily/weekly                    | Per-cycle / shift               |
    | auxiliary_equipment     | Cranes, conveyors, coolant      | Dryers, chillers, loaders       |
    | automation_level        | Medium                          | High                            |
    | energy_consumption      | High                            | Medium                          |
    | floor_space_per_unit    | Large                           | Compact                         |
```

---

## 2. Processing Templates

```yaml
processing_templates:

  # ═══════════════════════════════════════════════════════════════════
  # METALS PROCESSING TEMPLATES
  # ═══════════════════════════════════════════════════════════════════
  metals:

    - template_id: TPL-MTL-001
      name: coil_slitting
      material_type: METALS
      process_category: PRIMARY_PROCESSING
      description: "Slit master coil to specified widths"
      
      inputs:
        - name: master_coil
          type: COIL
          attributes: [grade, gauge, width, coating]
          unit: LBS
        
      outputs:
        - name: slit_coils
          type: COIL
          quantity_calc: "input_weight * yield_factor"
          attributes_inherited: [grade, gauge, coating]
          attributes_derived: [slit_width]
          
        - name: side_trim_scrap
          type: SCRAP
          quantity_calc: "input_weight * (1 - yield_factor)"
          
      process_parameters:
        - arbor_size: { values: [16, 20, 24], unit: "inches" }
        - knife_clearance: { calc: "gauge * 0.05", unit: "inches" }
        - line_speed: { range: [100, 500], unit: "fpm" }
        - tension: { calc: "width * gauge * material_factor", unit: "lbs" }
        
      quality_checks:
        - width_tolerance: "±0.005 inches"
        - burr_height: "< 10% of gauge"
        - camber: "< 0.125 inches per 8 feet"
        
      time_calculation:
        setup_time: 45  # minutes
        run_time_formula: "coil_weight / (line_speed * width * gauge * density)"

    - template_id: TPL-MTL-002
      name: cut_to_length
      material_type: METALS
      process_category: PRIMARY_PROCESSING
      description: "Cut coil to flat sheets"
      
      inputs:
        - name: coil
          type: COIL
          attributes: [grade, gauge, width, coating]
          unit: LBS
          
      outputs:
        - name: sheets
          type: SHEET
          quantity_calc: "floor(coil_length / sheet_length)"
          attributes_inherited: [grade, gauge, width, coating]
          attributes_derived: [sheet_length]
          
        - name: end_scrap
          type: SCRAP
          quantity_calc: "coil_length MOD sheet_length * width * gauge * density"
          
      process_parameters:
        - leveling_rolls: { values: [5, 7, 9, 11], unit: "roll_count" }
        - sheet_length: { range: [48, 240], unit: "inches" }
        - cut_tolerance: { value: "±0.030", unit: "inches" }
        - flatness: { values: ["STANDARD", "PRECISION", "DEAD_FLAT"] }
        
      quality_checks:
        - length_tolerance: "±0.030 inches"
        - flatness_deviation: "< 0.25 inches per foot"
        - squareness: "< 0.0625 inches per foot"
        
      time_calculation:
        setup_time: 30  # minutes
        run_time_formula: "sheet_count * cycle_time_per_sheet"

    - template_id: TPL-MTL-003
      name: blanking
      material_type: METALS
      process_category: FORMING
      description: "Punch blanks from sheet or coil"
      
      inputs:
        - name: sheet_or_coil
          type: [SHEET, COIL]
          attributes: [grade, gauge, width]
          unit: LBS
          
      outputs:
        - name: blanks
          type: BLANK
          quantity_calc: "nesting_efficiency * input_area / blank_area"
          attributes_inherited: [grade, gauge]
          attributes_derived: [blank_dimensions]
          
        - name: skeleton_scrap
          type: SCRAP
          quantity_calc: "input_weight * (1 - nesting_efficiency)"
          
      process_parameters:
        - press_tonnage: { calc: "perimeter * gauge * shear_strength * 1.5" }
        - die_clearance: { calc: "gauge * 0.06", unit: "inches" }
        - strokes_per_minute: { range: [20, 100] }
        - nesting_pattern: { values: ["SINGLE", "DOUBLE", "PROGRESSIVE"] }
        
      quality_checks:
        - burr_height: "< 10% of gauge"
        - dimensional: "±0.005 to ±0.015 inches"
        - edge_quality: "No fracture, minimal rollover"

    - template_id: TPL-MTL-004
      name: laser_cutting
      material_type: METALS
      process_category: CUTTING
      description: "CNC laser cut profiles from sheet"
      
      inputs:
        - name: sheet
          type: SHEET
          attributes: [grade, gauge, width, length]
          unit: LBS
          
      outputs:
        - name: cut_parts
          type: PART
          quantity_calc: "nesting_count"
          
        - name: remnant
          type: REMNANT
          quantity_calc: "sheet_area - parts_area - kerf_loss"
          
        - name: kerf_scrap
          type: SCRAP
          quantity_calc: "cut_length * kerf_width * gauge * density"
          
      process_parameters:
        - laser_power: { range: [2000, 12000], unit: "watts" }
        - cutting_speed: { lookup: "material_gauge_speed_table" }
        - assist_gas: { values: ["OXYGEN", "NITROGEN", "AIR"] }
        - kerf_width: { calc: "0.008 + (gauge * 0.001)", unit: "inches" }
        - pierce_time: { lookup: "material_gauge_pierce_table" }
        
      quality_checks:
        - dimensional: "±0.005 inches"
        - edge_quality: "Dross-free, minimal HAZ"
        - perpendicularity: "< 0.003 inches"
        
      time_calculation:
        setup_time: 20  # minutes
        run_time_formula: "cut_length / cutting_speed + pierce_count * pierce_time"

    - template_id: TPL-MTL-005
      name: press_forming
      material_type: METALS
      process_category: FORMING
      description: "Form parts using press dies"
      
      inputs:
        - name: blank
          type: BLANK
          attributes: [grade, gauge, dimensions]
          unit: PCS
          
      outputs:
        - name: formed_part
          type: FORMED_PART
          quantity_calc: "input_qty - reject_qty"
          
      process_parameters:
        - press_tonnage: { calc: "blank_area * forming_pressure" }
        - stroke_depth: { value: "per_drawing", unit: "inches" }
        - die_cushion_pressure: { range: [10, 100], unit: "psi" }
        - lubricant: { values: ["DRY_FILM", "OIL", "SYNTHETIC"] }
        
      quality_checks:
        - dimensional_formed: "±0.015 to ±0.030 inches"
        - springback: "Within tolerance after compensation"
        - surface_quality: "No cracks, wrinkles, or galling"

    - template_id: TPL-MTL-006
      name: welding
      material_type: METALS
      process_category: JOINING
      description: "Weld components together"
      
      inputs:
        - name: components
          type: [PART, FORMED_PART]
          quantity: "2+"
          
        - name: filler_material
          type: CONSUMABLE
          optional: true
          
      outputs:
        - name: welded_assembly
          type: ASSEMBLY
          quantity_calc: "1 per weld set"
          
      process_parameters:
        - weld_type: { values: ["MIG", "TIG", "SPOT", "LASER", "SEAM"] }
        - wire_diameter: { values: [0.030, 0.035, 0.045], unit: "inches" }
        - amperage: { range: [50, 400], unit: "amps" }
        - shield_gas: { values: ["CO2", "ARGON", "AR_CO2_MIX"] }
        - weld_length: { from: "drawing", unit: "inches" }
        
      quality_checks:
        - visual_inspection: "Per AWS D1.1/D1.3"
        - penetration: "Full penetration for structural"
        - porosity: "< 1/4 inch aggregate per inch"

  # ═══════════════════════════════════════════════════════════════════
  # PLASTICS PROCESSING TEMPLATES
  # ═══════════════════════════════════════════════════════════════════
  plastics:

    - template_id: TPL-PLS-001
      name: injection_molding
      material_type: PLASTICS
      process_category: PRIMARY_MOLDING
      description: "Injection mold plastic parts"
      
      inputs:
        - name: resin
          type: RESIN
          attributes: [resin_type, grade, color, additives]
          unit: LBS
          
        - name: regrind
          type: REGRIND
          optional: true
          max_ratio: 0.25
          
        - name: masterbatch
          type: COLORANT
          optional: true
          typical_ratio: 0.02-0.04
          
        - name: inserts
          type: METAL_INSERT
          optional: true
          quantity: "per_part_design"
          
      outputs:
        - name: molded_parts
          type: MOLDED_PART
          quantity_calc: "cavities * shots"
          
        - name: runner_scrap
          type: REGRIND_CANDIDATE
          quantity_calc: "runner_weight * shots"
          recycle_disposition: "REGRIND or DISCARD"
          
      process_parameters:
        - machine_tonnage: { calc: "projected_area * cavity_pressure / 2000" }
        - shot_size: { calc: "part_weight * cavities * 1.1" }
        - barrel_temps:
            zone_1: { lookup: "resin_temp_profile", position: "rear" }
            zone_2: { lookup: "resin_temp_profile", position: "middle" }
            zone_3: { lookup: "resin_temp_profile", position: "front" }
            nozzle: { lookup: "resin_temp_profile", position: "nozzle" }
        - mold_temp: { lookup: "resin_mold_temp", unit: "°F" }
        - injection_pressure: { range: [5000, 20000], unit: "psi" }
        - injection_speed: { range: [1, 10], unit: "in/sec" }
        - pack_pressure: { calc: "injection_pressure * 0.5-0.8" }
        - pack_time: { range: [1, 30], unit: "seconds" }
        - cooling_time: { calc: "wall_thickness² * material_factor" }
        - cycle_time: { calc: "inject + pack + cool + open + close + eject" }
        
      quality_checks:
        - shot_weight: "±2% of nominal"
        - dimensions: "Per drawing tolerances"
        - visual_defects: "No flash, sink, warp, burns, flow lines"
        - color_match: "ΔE < 1.0 vs standard"
        
      time_calculation:
        setup_time: 120  # minutes (mold change)
        run_time_formula: "part_qty / cavities * cycle_time / 60"

    - template_id: TPL-PLS-002
      name: extrusion
      material_type: PLASTICS
      process_category: PRIMARY_EXTRUSION
      description: "Extrude continuous plastic profiles"
      
      inputs:
        - name: resin
          type: RESIN
          attributes: [resin_type, grade, color, additives]
          unit: LBS
          
        - name: regrind
          type: REGRIND
          optional: true
          max_ratio: 0.20
          
      outputs:
        - name: extruded_profile
          type: EXTRUSION
          quantity_calc: "run_length"
          unit: FT
          
        - name: startup_scrap
          type: SCRAP
          quantity_calc: "purge_weight + startup_length"
          
      process_parameters:
        - extruder_size: { values: [2.5, 3.5, 4.5, 6.0], unit: "inches" }
        - screw_speed: { range: [20, 100], unit: "rpm" }
        - barrel_temps: { zones: 5, lookup: "resin_temp_profile" }
        - die_temp: { lookup: "resin_die_temp" }
        - line_speed: { range: [10, 200], unit: "fpm" }
        - haul_off_speed: { sync: "line_speed" }
        - cooling: { values: ["WATER_BATH", "AIR", "VACUUM_SIZING"] }
        
      quality_checks:
        - profile_dimensions: "±0.005 to ±0.020 inches"
        - surface_quality: "No melt fracture, die lines"
        - straightness: "< 0.125 inches per 10 feet"
        
      time_calculation:
        setup_time: 90  # minutes (die change)
        run_time_formula: "run_length / line_speed"

    - template_id: TPL-PLS-003
      name: thermoforming
      material_type: PLASTICS
      process_category: FORMING
      description: "Thermoform sheet into parts"
      
      inputs:
        - name: plastic_sheet
          type: SHEET
          attributes: [resin_type, gauge, width, color]
          unit: LBS
          
      outputs:
        - name: formed_parts
          type: THERMOFORMED_PART
          quantity_calc: "sheet_count * parts_per_sheet"
          
        - name: skeleton_trim
          type: REGRIND_CANDIDATE
          quantity_calc: "sheet_weight - parts_weight"
          
      process_parameters:
        - heater_temp: { lookup: "resin_forming_temp" }
        - heat_time: { calc: "gauge * heating_factor" }
        - vacuum_pressure: { range: [20, 28], unit: "in_Hg" }
        - plug_assist: { values: [true, false] }
        - cooling_time: { calc: "gauge * cooling_factor" }
        - trim_method: { values: ["DIE_CUT", "ROUTER", "LASER"] }
        
      quality_checks:
        - wall_distribution: "Within specified min/max"
        - dimensions: "±0.030 to ±0.060 inches"
        - surface_quality: "No webbing, blisters, thin spots"

    - template_id: TPL-PLS-004
      name: blow_molding
      material_type: PLASTICS
      process_category: PRIMARY_MOLDING
      description: "Blow mold hollow parts"
      
      inputs:
        - name: resin
          type: RESIN
          attributes: [resin_type, grade, color]
          unit: LBS
          
      outputs:
        - name: blown_parts
          type: BLOW_MOLDED_PART
          quantity_calc: "shots * cavities"
          
        - name: flash_trim
          type: REGRIND_CANDIDATE
          quantity_calc: "flash_weight * shots"
          
      process_parameters:
        - machine_type: { values: ["EBM", "IBM", "ISBM"] }
        - parison_programming: "wall_thickness_profile"
        - blow_pressure: { range: [40, 120], unit: "psi" }
        - mold_temp: { lookup: "resin_mold_temp" }
        - cooling_time: { calc: "wall_thickness * volume_factor" }
        
      quality_checks:
        - wall_thickness: "Min thickness per spec"
        - burst_pressure: "Per design requirement"
        - drop_test: "Per spec"
        - dimensions: "±0.020 to ±0.050 inches"

    - template_id: TPL-PLS-005
      name: plastic_assembly
      material_type: PLASTICS
      process_category: ASSEMBLY
      description: "Assemble plastic components"
      
      inputs:
        - name: components
          type: [MOLDED_PART, PURCHASED_COMPONENT]
          quantity: "2+"
          
      outputs:
        - name: assembly
          type: PLASTIC_ASSEMBLY
          quantity_calc: "1 per assembly set"
          
      process_parameters:
        - join_method:
            - type: ULTRASONIC_WELDING
              parameters: [amplitude, force, weld_time, hold_time]
            - type: ADHESIVE_BONDING
              parameters: [adhesive_type, cure_time, fixture_time]
            - type: SNAP_FIT
              parameters: [insertion_force, retention_force]
            - type: HEAT_STAKING
              parameters: [temperature, dwell_time, cooling_time]
            - type: SOLVENT_BONDING
              parameters: [solvent_type, fixture_time]
              
      quality_checks:
        - joint_strength: "Pull test per spec"
        - visual: "No flash, gaps, misalignment"
        - functional: "Per assembly requirements"

    - template_id: TPL-PLS-006
      name: plastic_decoration
      material_type: PLASTICS
      process_category: FINISHING
      description: "Decorate/finish plastic parts"
      
      inputs:
        - name: molded_part
          type: MOLDED_PART
          
        - name: decoration_materials
          type: [INK, FOIL, LABEL, PAINT]
          
      outputs:
        - name: decorated_part
          type: DECORATED_PART
          
      process_parameters:
        - decoration_method:
            - type: PAD_PRINTING
              parameters: [ink_type, pad_hardness, stroke_speed]
            - type: HOT_STAMPING
              parameters: [foil_type, temperature, dwell_time, pressure]
            - type: IN_MOLD_LABELING
              parameters: [label_material, static_charge, mold_position]
            - type: PAINTING
              parameters: [paint_type, coat_count, cure_method]
            - type: LASER_MARKING
              parameters: [power, speed, frequency]
              
      quality_checks:
        - adhesion: "Cross-hatch tape test"
        - color_match: "ΔE < 1.5"
        - durability: "Rub test per spec"
        - registration: "±0.010 inches"
```

---

## 3. BOM Templates

```yaml
bom_templates:

  # ═══════════════════════════════════════════════════════════════════
  # METALS BOM STRUCTURE
  # ═══════════════════════════════════════════════════════════════════
  metals_bom:

    - template_id: BOM-MTL-001
      name: fabricated_metal_part
      structure_type: SINGLE_LEVEL
      
      header:
        part_number: string
        revision: string
        description: string
        uom: LBS | PCS
        make_buy: MAKE
        
      materials:
        - line_type: RAW_MATERIAL
          fields:
            material_id: "grade specification"
            form: "COIL | SHEET | BAR | TUBE | PLATE"
            grade: "ASTM/SAE designation"
            gauge_or_thickness: number
            width: number
            length: number (for sheet/plate)
            quantity_per: number
            quantity_uom: LBS
            scrap_factor: number (1.0 - yield)
            
      operations:
        - line_type: OPERATION
          fields:
            op_seq: number
            work_center_id: string
            operation_name: string
            setup_time_hrs: number
            run_time_per: number
            run_time_uom: "HRS_PER_100" | "HRS_PER_PC"
            
      example:
        ```
        PART: FBR-12345 Rev A
        DESC: Formed Bracket Assembly
        UOM: PCS
        
        MATERIALS:
        | Seq | Material       | Form  | Grade      | Gauge | Width | Qty/Pc | UOM | Scrap |
        |-----|----------------|-------|------------|-------|-------|--------|-----|-------|
        | 10  | CR-STEEL-1008  | COIL  | ASTM A1008 | 0.060 | 4.500 | 0.85   | LBS | 0.15  |
        
        OPERATIONS:
        | Seq | Work Center | Operation        | Setup Hrs | Run Time | UOM         |
        |-----|-------------|------------------|-----------|----------|-------------|
        | 10  | SLITTER-01  | Slit to width    | 0.75      | 0.50     | HRS_PER_100 |
        | 20  | BLANKER-01  | Blank part       | 0.50      | 0.25     | HRS_PER_100 |
        | 30  | PRESS-01    | Form bracket     | 1.00      | 0.30     | HRS_PER_100 |
        | 40  | WELD-01     | Spot weld        | 0.25      | 0.015    | HRS_PER_PC  |
        | 50  | FINISH-01   | Zinc plate       | 0.50      | 0.10     | HRS_PER_100 |
        ```

    - template_id: BOM-MTL-002
      name: welded_assembly
      structure_type: MULTI_LEVEL
      
      header:
        assembly_number: string
        revision: string
        description: string
        uom: PCS
        
      components:
        - line_type: COMPONENT
          fields:
            component_id: string
            description: string
            quantity_per: number
            uom: PCS | LBS
            make_buy: MAKE | BUY
            reference_designator: string (optional)
            
        - line_type: CONSUMABLE
          fields:
            consumable_id: string
            description: string
            quantity_per: number
            uom: LBS | FT | EA
            
      operations:
        - line_type: ASSEMBLY_OPERATION
          fields:
            op_seq: number
            work_center_id: string
            operation_name: string
            components_consumed: [component_ids]
            setup_time_hrs: number
            run_time_per_pc: number
            
      example:
        ```
        ASSY: WLD-67890 Rev B
        DESC: Welded Frame Assembly
        UOM: PCS
        
        COMPONENTS:
        | Seq | Component  | Description      | Qty/Assy | UOM | Make/Buy |
        |-----|------------|------------------|----------|-----|----------|
        | 10  | FBR-12345  | Formed Bracket   | 2        | PCS | MAKE     |
        | 20  | BAR-11111  | Cross Bar        | 1        | PCS | MAKE     |
        | 30  | HDW-99001  | Hex Bolt 3/8-16  | 4        | PCS | BUY      |
        | 40  | HDW-99002  | Hex Nut 3/8-16   | 4        | PCS | BUY      |
        
        CONSUMABLES:
        | Seq | Material      | Description       | Qty/Assy | UOM |
        |-----|---------------|-------------------|----------|-----|
        | 10  | WLD-ER70S-6   | MIG Wire 0.035    | 0.05     | LBS |
        | 20  | GAS-CO2-ARGON | Shield Gas 75/25  | 0.10     | CF  |
        
        OPERATIONS:
        | Seq | Work Center | Operation       | Components | Setup | Run/Pc |
        |-----|-------------|-----------------|------------|-------|--------|
        | 10  | WELD-01     | Tack weld frame | 10, 20     | 0.25  | 0.10   |
        | 20  | WELD-01     | Final weld      | -          | -     | 0.25   |
        | 30  | ASSY-01     | Install hardware| 30, 40     | 0.10  | 0.05   |
        ```

  # ═══════════════════════════════════════════════════════════════════
  # PLASTICS BOM STRUCTURE
  # ═══════════════════════════════════════════════════════════════════
  plastics_bom:

    - template_id: BOM-PLS-001
      name: injection_molded_part
      structure_type: SINGLE_LEVEL
      
      header:
        part_number: string
        revision: string
        description: string
        uom: PCS
        mold_id: string
        cavities: number
        
      materials:
        - line_type: PRIMARY_RESIN
          fields:
            resin_id: string
            resin_type: "ABS | PC | PP | PE | NYLON | POM | etc"
            grade: string
            color: string (if pre-colored)
            quantity_per: number
            quantity_uom: LBS
            includes_runner: boolean
            
        - line_type: REGRIND
          optional: true
          fields:
            source: "RUNNER | STARTUP | EXTERNAL"
            max_percentage: number
            quantity_per: number (if fixed amount)
            
        - line_type: MASTERBATCH
          optional: true
          fields:
            color_code: string
            let_down_ratio: number (e.g., 3% = 0.03)
            quantity_per: number
            
        - line_type: ADDITIVE
          optional: true
          fields:
            additive_type: "UV | FR | ANTISTATIC | LUBRICANT"
            percentage: number
            quantity_per: number
            
        - line_type: INSERT
          optional: true
          fields:
            insert_id: string
            description: string
            quantity_per: number
            placement: "MOLDED_IN | POST_MOLD"
            
      operations:
        - line_type: OPERATION
          fields:
            op_seq: number
            work_center_id: string
            operation_name: string
            cycle_time_sec: number
            cavities: number
            setup_time_hrs: number
            
      example:
        ```
        PART: PLM-54321 Rev C
        DESC: Electronic Enclosure Housing
        UOM: PCS
        MOLD: MLD-2001
        CAVITIES: 4
        
        MATERIALS:
        | Seq | Type         | Material        | Description            | Qty/Pc | UOM | %    |
        |-----|--------------|-----------------|------------------------|--------|-----|------|
        | 10  | RESIN        | ABS-CYCOLAC-G   | ABS Natural            | 0.125  | LBS | 97%  |
        | 20  | MASTERBATCH  | MB-BLK-2201     | Black Color Masterbatch| 0.004  | LBS | 3%   |
        | 30  | INSERT       | INS-BRS-0040    | Brass Threaded Insert  | 4      | PCS | -    |
        
        OPERATIONS:
        | Seq | Work Center  | Operation        | Cycle Sec | Cavities | Setup Hrs |
        |-----|--------------|------------------|-----------|----------|-----------|
        | 10  | IMM-500T-03  | Injection mold   | 45        | 4        | 2.0       |
        | 20  | ROBOT-01     | Insert placement | (in cycle)| -        | -         |
        | 30  | TRIM-01      | Gate removal     | 5         | 4        | 0.25      |
        ```

    - template_id: BOM-PLS-002
      name: plastic_assembly
      structure_type: MULTI_LEVEL
      
      header:
        assembly_number: string
        revision: string
        description: string
        uom: PCS
        
      components:
        - line_type: MOLDED_COMPONENT
          fields:
            component_id: string
            description: string
            quantity_per: number
            uom: PCS
            make_buy: MAKE | BUY
            
        - line_type: PURCHASED_COMPONENT
          fields:
            component_id: string
            description: string
            quantity_per: number
            uom: PCS
            
        - line_type: CONSUMABLE
          fields:
            consumable_id: string
            description: string
            quantity_per: number
            uom: EA | ML | GM
            
      operations:
        - line_type: ASSEMBLY_OPERATION
          fields:
            op_seq: number
            work_center_id: string
            operation_name: string
            join_method: string
            components_consumed: [component_ids]
            cycle_time_sec: number
            
      example:
        ```
        ASSY: PLA-77777 Rev A
        DESC: Complete Electronic Enclosure
        UOM: PCS
        
        COMPONENTS:
        | Seq | Component  | Description        | Qty/Assy | UOM | Make/Buy |
        |-----|------------|--------------------|----------|-----|----------|
        | 10  | PLM-54321  | Housing Base       | 1        | PCS | MAKE     |
        | 20  | PLM-54322  | Housing Cover      | 1        | PCS | MAKE     |
        | 30  | PLM-54323  | Button Set         | 1        | PCS | MAKE     |
        | 40  | LBL-90001  | Product Label      | 1        | PCS | BUY      |
        | 50  | PAD-90002  | Rubber Foot        | 4        | PCS | BUY      |
        
        CONSUMABLES:
        | Seq | Material    | Description        | Qty/Assy | UOM |
        |-----|-------------|--------------------|----------|-----|
        | 10  | ADH-CYA-01  | Cyanoacrylate Glue | 0.5      | ML  |
        
        OPERATIONS:
        | Seq | Work Center | Operation          | Method      | Cycle Sec |
        |-----|-------------|--------------------|-------------|-----------|
        | 10  | USSY-01     | Ultrasonic weld    | ULTRASONIC  | 8         |
        | 20  | USSY-01     | Install buttons    | SNAP_FIT    | 5         |
        | 30  | LABEL-01    | Apply label        | ADHESIVE    | 3         |
        | 40  | ASSY-01     | Install feet       | ADHESIVE    | 10        |
        | 50  | PACK-01     | Final packaging    | -           | 15        |
        ```

  # ═══════════════════════════════════════════════════════════════════
  # HYBRID BOM (METALS + PLASTICS)
  # ═══════════════════════════════════════════════════════════════════
  hybrid_bom:

    - template_id: BOM-HYB-001
      name: metal_plastic_assembly
      structure_type: MULTI_LEVEL
      
      header:
        assembly_number: string
        revision: string
        description: string
        uom: PCS
        primary_material_type: HYBRID
        
      components:
        metal_components:
          - component_id: string
            material_type: METAL
            description: string
            quantity_per: number
            process_template: reference
            
        plastic_components:
          - component_id: string
            material_type: PLASTIC
            description: string
            quantity_per: number
            process_template: reference
            
        purchased_components:
          - component_id: string
            description: string
            quantity_per: number
            
      special_considerations:
        - galvanic_isolation: "Required between dissimilar metals/plastics"
        - thermal_expansion: "Coefficient mismatch considerations"
        - assembly_sequence: "Often metal first, then plastic overmold or assembly"
        
      example:
        ```
        ASSY: HYB-88888 Rev A
        DESC: Overmolded Handle Assembly
        UOM: PCS
        
        COMPONENTS:
        | Seq | Component  | Mat Type | Description           | Qty | Process         |
        |-----|------------|----------|-----------------------|-----|-----------------|
        | 10  | MTL-10001  | METAL    | Steel Core Insert     | 1   | TPL-MTL-003     |
        | 20  | PLM-20001  | PLASTIC  | Overmold Grip (TPE)   | 1   | TPL-PLS-001     |
        | 30  | HDW-30001  | METAL    | End Cap (Aluminum)    | 2   | PURCHASED       |
        
        OPERATIONS:
        | Seq | Operation              | Notes                               |
        |-----|------------------------|-------------------------------------|
        | 10  | Insert prep            | Degrease, preheat metal insert      |
        | 20  | Overmold               | Insert molding, TPE over steel      |
        | 30  | Assemble end caps      | Press fit aluminum caps             |
        | 40  | Final inspection       | Pull test, visual, dimensional      |
        ```
```

---

## 4. Data Model Overrides

```yaml
data_model_overrides:

  # ═══════════════════════════════════════════════════════════════════
  # MATERIAL ENTITY EXTENSIONS
  # ═══════════════════════════════════════════════════════════════════
  material_extensions:

    base_material:
      common_fields:
        - material_id: uuid
        - material_number: string
        - description: string
        - material_type: "METAL | PLASTIC | HYBRID"
        - uom_stock: string
        - uom_usage: string
        - density: number
        - cost_per_uom: number
        
    metal_specific_fields:
      - grade: string                    # ASTM A36, A1008, etc.
      - chemistry:
          carbon: number
          manganese: number
          phosphorus: number
          sulfur: number
          silicon: number
          # ... alloy elements
      - mechanical_properties:
          yield_strength_ksi: number
          tensile_strength_ksi: number
          elongation_pct: number
          hardness: string
      - form: "COIL | SHEET | PLATE | BAR | TUBE | STRUCTURAL"
      - gauge_or_thickness: number
      - width: number
      - coating: "NONE | GALVANIZED | GALVANNEALED | ALUMINIZED | PAINTED"
      - coating_weight: string           # G60, G90, etc.
      - surface_finish: string           # 2B, #4, etc.
      - heat_number: string              # Mill traceability
      - mtr_required: boolean
      - mtr_document_id: uuid
      
    plastic_specific_fields:
      - resin_family: "ABS | PC | PP | PE | POM | NYLON | PET | etc"
      - resin_grade: string              # Manufacturer grade
      - manufacturer: string
      - melt_flow_index: number
      - melt_flow_conditions: string     # e.g., "230°C/2.16kg"
      - color_code: string
      - color_name: string
      - base_color: "NATURAL | PRE_COLORED"
      - additives:
          - additive_type: string
            percentage: number
            certification: string
      - regulatory_compliance:
          - ul94_rating: "HB | V2 | V1 | V0 | 5VA | 5VB"
          - rohs_compliant: boolean
          - reach_compliant: boolean
          - food_contact: boolean
          - fda_compliant: boolean
          - medical_grade: boolean
      - processing_temps:
          melt_temp_min: number
          melt_temp_max: number
          mold_temp_min: number
          mold_temp_max: number
          dry_temp: number
          dry_time_hrs: number
      - moisture_sensitivity: "LOW | MEDIUM | HIGH"
      - regrind_allowed: boolean
      - max_regrind_pct: number
      - shelf_life_months: number
      - storage_requirements: string
      - lot_number: string
      - coa_document_id: uuid

  # ═══════════════════════════════════════════════════════════════════
  # WORK CENTER OVERRIDES
  # ═══════════════════════════════════════════════════════════════════
  work_center_extensions:

    metal_work_center_fields:
      - equipment_type: "SLITTER | CTL | BLANKER | LASER | PRESS | WELDER | etc"
      - tonnage_capacity: number
      - bed_size_x: number
      - bed_size_y: number
      - max_thickness: number
      - max_width: number
      - power_kw: number
      - tooling_slots: number
      
    plastic_work_center_fields:
      - equipment_type: "INJECTION | EXTRUSION | THERMOFORM | BLOW_MOLD | etc"
      - clamp_tonnage: number
      - shot_size_oz: number
      - platen_size_x: number
      - platen_size_y: number
      - tie_bar_spacing_x: number
      - tie_bar_spacing_y: number
      - max_mold_height: number
      - min_mold_height: number
      - barrel_zones: number
      - screw_diameter: number
      - has_robot: boolean
      - robot_payload_kg: number
      - dryer_attached: boolean
      - dryer_capacity_lbs: number
      - hot_runner_compatible: boolean
      - max_injection_pressure: number
      - max_injection_speed: number

  # ═══════════════════════════════════════════════════════════════════
  # TOOLING ENTITY OVERRIDES
  # ═══════════════════════════════════════════════════════════════════
  tooling_extensions:

    metal_tooling:
      - tool_type: "DIE | PUNCH | FIXTURE | JIG | TEMPLATE"
      - die_type: "BLANK | FORM | PROGRESSIVE | TRANSFER | COMPOUND"
      - tonnage_requirement: number
      - die_size_x: number
      - die_size_y: number
      - shut_height: number
      - stroke_required: number
      - material_grade_compatibility: [string]
      - gauge_range_min: number
      - gauge_range_max: number
      - expected_life_hits: number
      - current_hits: number
      - last_sharpening_date: date
      - sharpening_interval_hits: number
      - storage_location: string
      
    plastic_tooling:
      - tool_type: "MOLD"
      - mold_type: "SINGLE_CAVITY | MULTI_CAVITY | FAMILY | STACK"
      - cavities: number
      - runner_type: "COLD | HOT | INSULATED"
      - hot_runner_zones: number
      - gate_type: "EDGE | SUB | PIN | VALVE | DIRECT"
      - mold_size_x: number
      - mold_size_y: number
      - mold_height: number
      - mold_weight_lbs: number
      - clamp_tonnage_required: number
      - shot_weight_max: number
      - cycle_time_target_sec: number
      - cooling_channels: number
      - ejector_pattern: string
      - mold_material: string
      - expected_life_shots: number
      - current_shots: number
      - last_pm_date: date
      - pm_interval_shots: number
      - compatible_machines: [work_center_id]
      - storage_location: string
      - mold_owner: "COMPANY | CUSTOMER"
      - mold_asset_value: number

  # ═══════════════════════════════════════════════════════════════════
  # QUALITY RECORD OVERRIDES
  # ═══════════════════════════════════════════════════════════════════
  quality_extensions:

    metal_quality_records:
      - inspection_type: "RECEIVING | IN_PROCESS | FINAL"
      - mtr_verification:
          chemistry_match: boolean
          mechanical_match: boolean
          deviations: [string]
      - dimensional_results:
          - characteristic: string
            nominal: number
            tolerance: string
            actual: number
            pass_fail: boolean
      - surface_inspection:
          defects_found: [string]
          disposition: string
      - hardness_test:
          method: "ROCKWELL | BRINELL | VICKERS"
          scale: string
          result: number
          spec_min: number
          spec_max: number
      - weld_inspection:
          visual_pass: boolean
          ndt_method: string
          ndt_result: string
          
    plastic_quality_records:
      - inspection_type: "RECEIVING | IN_PROCESS | FINAL"
      - incoming_material:
          lot_number: string
          mfi_actual: number
          mfi_spec: string
          moisture_pct: number
          moisture_spec: string
          color_delta_e: number
      - process_monitoring:
          shot_weight_actual: number
          shot_weight_target: number
          cycle_time_actual: number
          cushion: number
          peak_pressure: number
          barrel_temps: [number]
          mold_temp: number
      - dimensional_results:
          - characteristic: string
            nominal: number
            tolerance: string
            actual: number
            pass_fail: boolean
      - visual_inspection:
          defects_found:
            - defect_type: "FLASH | SINK | WARP | SHORT | BURN | FLOW_LINES | etc"
              location: string
              severity: "MINOR | MAJOR | CRITICAL"
          disposition: string
      - color_measurement:
          instrument: string
          illuminant: string
          delta_l: number
          delta_a: number
          delta_b: number
          delta_e: number
          pass_fail: boolean
      - functional_tests:
          - test_name: string
            method: string
            result: number | string
            spec: string
            pass_fail: boolean

  # ═══════════════════════════════════════════════════════════════════
  # INVENTORY ATTRIBUTE OVERRIDES
  # ═══════════════════════════════════════════════════════════════════
  inventory_extensions:

    metal_inventory:
      - heat_number: string
      - coil_id: string
      - mtr_id: uuid
      - surface_condition: string
      - edge_condition: string
      - oiled: boolean
      - rust_preventative: string
      - last_rust_check_date: date
      
    plastic_inventory:
      - lot_number: string
      - manufacture_date: date
      - expiration_date: date
      - moisture_content_pct: number
      - last_moisture_check: date
      - dried: boolean
      - dried_date: datetime
      - regrind_generation: number        # 0 = virgin, 1 = first regrind, etc.
      - color_code: string
      - storage_conditions:
          temperature_f: number
          humidity_pct: number
          sealed: boolean
```

---

## 5. Estimation Rules

```yaml
estimation_rules:

  # ═══════════════════════════════════════════════════════════════════
  # METALS ESTIMATION RULES
  # ═══════════════════════════════════════════════════════════════════
  metals:

    material_quantity:
      
      - rule_id: EST-MTL-001
        name: coil_weight_calculation
        formula: "weight_lbs = length_ft * width_in * thickness_in * density_factor / 12"
        density_factors:
          carbon_steel: 0.2833
          stainless_304: 0.2893
          stainless_316: 0.2893
          aluminum_6061: 0.0975
          aluminum_5052: 0.0968
          
      - rule_id: EST-MTL-002
        name: blank_nesting_yield
        formula: "yield_pct = (blank_area * blank_count) / sheet_area"
        typical_yields:
          rectangular_single: 0.70 - 0.85
          rectangular_nested: 0.80 - 0.92
          circular: 0.60 - 0.75
          irregular_optimized: 0.75 - 0.88
          
      - rule_id: EST-MTL-003
        name: slitting_yield
        formula: "yield_pct = sum(slit_widths) / master_width"
        factors:
          edge_trim_per_side: 0.125 - 0.250
          knife_kerf: 0.020 - 0.040
          
      - rule_id: EST-MTL-004
        name: formed_part_weight
        formula: "developed_length * width * thickness * density"
        developed_length_calc:
          bend_allowance: "((PI / 180) * bend_angle * (inside_radius + k_factor * thickness))"
          k_factor_lookup:
            soft_material: 0.33
            medium_material: 0.40
            hard_material: 0.50

    time_estimation:
    
      - rule_id: EST-MTL-010
        name: slitting_time
        formula: "setup_time + (coil_weight / (line_speed_fpm * width * gauge * density * 60))"
        setup_time_minutes:
          simple_job: 30
          complex_job: 60
          new_setup: 90
        line_speed_fpm:
          light_gauge: 300 - 500
          medium_gauge: 150 - 300
          heavy_gauge: 50 - 150
          
      - rule_id: EST-MTL-011
        name: laser_cutting_time
        formula: "setup_time + (cut_length / cut_speed) + (pierce_count * pierce_time)"
        cut_speed_ipm:
          carbon_steel:
            0.030: 800
            0.060: 500
            0.120: 250
            0.250: 100
            0.500: 40
          stainless:
            0.030: 600
            0.060: 350
            0.120: 150
            0.250: 60
          aluminum:
            0.030: 1000
            0.060: 600
            0.120: 300
            0.250: 120
        pierce_time_sec:
          thin: 0.5
          medium: 1.5
          thick: 4.0
          
      - rule_id: EST-MTL-012
        name: press_forming_time
        formula: "setup_time + (part_qty * cycle_time)"
        setup_factors:
          die_change: 30 - 60 minutes
          first_piece_approval: 15 - 30 minutes
          
      - rule_id: EST-MTL-013
        name: welding_time
        formula: "setup_time + (weld_length * weld_factor) + (tack_count * tack_time)"
        weld_factors_min_per_inch:
          mig_light: 0.02
          mig_medium: 0.04
          mig_heavy: 0.08
          tig: 0.10 - 0.20
          spot_per_weld: 0.05

    cost_estimation:
    
      - rule_id: EST-MTL-020
        name: material_cost
        formula: "gross_weight * cost_per_lb * (1 + scrap_recovery_factor)"
        scrap_recovery:
          carbon_steel: 0.30 - 0.40 (credit)
          stainless: 0.50 - 0.60 (credit)
          aluminum: 0.60 - 0.70 (credit)
          
      - rule_id: EST-MTL-021
        name: processing_cost
        formula: "setup_cost + (run_time * labor_rate) + (machine_time * machine_rate)"
        
      - rule_id: EST-MTL-022
        name: tooling_amortization
        formula: "tool_cost / estimated_tool_life_parts"
        tool_life_estimates:
          blanking_die: 100000 - 500000
          forming_die: 50000 - 200000
          progressive_die: 500000 - 2000000

  # ═══════════════════════════════════════════════════════════════════
  # PLASTICS ESTIMATION RULES
  # ═══════════════════════════════════════════════════════════════════
  plastics:

    material_quantity:
    
      - rule_id: EST-PLS-001
        name: shot_weight_calculation
        formula: "part_weight + (runner_weight / cavities)"
        runner_weight_factors:
          cold_runner_small: 0.10 - 0.20 of part weight
          cold_runner_large: 0.20 - 0.40 of part weight
          hot_runner: 0 (no runner scrap)
          
      - rule_id: EST-PLS-002
        name: part_weight_estimation
        formula: "volume_in³ * density_lb_in³"
        densities_lb_in3:
          ABS: 0.038
          PC: 0.043
          PP: 0.033
          PE_HD: 0.035
          PE_LD: 0.033
          NYLON_6: 0.041
          NYLON_66: 0.042
          POM: 0.051
          PET: 0.050
          PMMA: 0.043
          PS: 0.038
          PVC_RIGID: 0.051
          TPE: 0.035 - 0.045
          
      - rule_id: EST-PLS-003
        name: regrind_material_balance
        formula: "virgin_pct + regrind_pct = 100%"
        constraints:
          max_regrind_structural: 0.15
          max_regrind_cosmetic: 0.10
          max_regrind_general: 0.25
          regrind_generation_limit: 3
          
      - rule_id: EST-PLS-004
        name: masterbatch_letdown
        formula: "masterbatch_weight = part_weight * letdown_ratio"
        typical_letdowns:
          solid_colors: 0.02 - 0.04
          metallics: 0.03 - 0.05
          pearls: 0.02 - 0.03

    time_estimation:
    
      - rule_id: EST-PLS-010
        name: cycle_time_estimation
        formula: "inject_time + pack_time + cool_time + mold_open_close + eject_time"
        component_formulas:
          inject_time: "shot_weight / injection_rate"
          pack_time: "wall_thickness * 2.5 (seconds)"
          cool_time: "wall_thickness² * cooling_factor"
          mold_open_close: "3 - 5 seconds"
          eject_time: "1 - 3 seconds"
        cooling_factors:
          amorphous: 10 - 15
          semi_crystalline: 15 - 25
          
      - rule_id: EST-PLS-011
        name: mold_change_time
        formula: "crane_time + connection_time + heat_up + first_shots"
        components_minutes:
          crane_in_out: 30 - 60
          water_connections: 10 - 20
          electrical_connections: 5 - 15
          hot_runner_heat_up: 15 - 30
          mold_heat_up: 10 - 30
          first_shot_approval: 15 - 45
        total_range: 90 - 180 minutes
        
      - rule_id: EST-PLS-012
        name: secondary_operations_time
        formula: "sum(operation_cycle_times) + handling"
        typical_times_sec:
          gate_removal_manual: 5 - 15
          gate_removal_auto: 2 - 5
          deflashing: 10 - 30
          ultrasonic_weld: 5 - 15
          pad_print_single: 3 - 8
          pad_print_multi: 10 - 20
          hot_stamp: 5 - 10
          assembly_snap_fit: 3 - 10

    cost_estimation:
    
      - rule_id: EST-PLS-020
        name: material_cost
        formula: "(virgin_weight * virgin_cost) + (masterbatch_weight * mb_cost) + (additive_weight * additive_cost)"
        regrind_credit: "runner_weight * virgin_cost * 0.9 (if recycled)"
        
      - rule_id: EST-PLS-021
        name: machine_cost
        formula: "cycle_count * (machine_rate_per_hour / 3600 * cycle_time_sec)"
        machine_rates_per_hour:
          under_100_ton: 35 - 50
          100_300_ton: 50 - 80
          300_500_ton: 80 - 120
          500_1000_ton: 120 - 180
          over_1000_ton: 180 - 300
          
      - rule_id: EST-PLS-022
        name: mold_amortization
        formula: "mold_cost / guaranteed_life_shots"
        mold_life_estimates:
          prototype_aluminum: 1000 - 10000
          production_aluminum: 50000 - 100000
          p20_steel: 250000 - 500000
          h13_hardened: 500000 - 1000000
          s7_hardened: 1000000 +
          
      - rule_id: EST-PLS-023
        name: startup_scrap_allowance
        formula: "startup_shots * shot_weight"
        startup_shots:
          simple_part: 10 - 20
          complex_part: 20 - 50
          multi_cavity: 30 - 75

  # ═══════════════════════════════════════════════════════════════════
  # COMPARATIVE ESTIMATION RULES
  # ═══════════════════════════════════════════════════════════════════
  comparative:

    - rule_id: EST-CMP-001
      name: breakeven_volume_metal_vs_plastic
      description: "Volume at which plastic tooling investment is justified"
      formula: "(mold_cost - die_cost) / (metal_piece_cost - plastic_piece_cost)"
      factors:
        mold_cost_typically: 5x - 20x die cost
        plastic_piece_cost_typically: 0.3x - 0.7x metal piece cost
        typical_breakeven: 10000 - 100000 pieces
        
    - rule_id: EST-CMP-002
      name: weight_reduction_factor
      description: "Plastic vs metal weight comparison"
      formula: "plastic_weight / metal_weight"
      typical_ratios:
        structural_replacement: 0.4 - 0.6
        cosmetic_replacement: 0.2 - 0.4
        filled_plastic: 0.5 - 0.8
        
    - rule_id: EST-CMP-003
      name: assembly_consolidation
      description: "Parts reduction through plastic design"
      formula: "original_part_count / consolidated_part_count"
      typical_consolidation: 3:1 to 10:1
      cost_impact: "Assembly cost reduction often exceeds material cost increase"

  # ═══════════════════════════════════════════════════════════════════
  # ESTIMATION ACCURACY FACTORS
  # ═══════════════════════════════════════════════════════════════════
  accuracy_factors:

    confidence_levels:
      - level: ROUGH_ORDER_MAGNITUDE
        accuracy: "±30-50%"
        basis: "Concept only, similar parts reference"
        
      - level: BUDGETARY
        accuracy: "±15-25%"
        basis: "Preliminary design, estimated weights/times"
        
      - level: QUOTATION
        accuracy: "±5-10%"
        basis: "Detailed design, validated estimates"
        
      - level: FINAL
        accuracy: "±2-5%"
        basis: "Production proven, actual data"

    adjustment_factors:
      complexity:
        simple: 0.9
        moderate: 1.0
        complex: 1.2
        highly_complex: 1.5
      quantity:
        prototype: 2.0
        low_volume: 1.3
        production: 1.0
        high_volume: 0.9
      new_vs_repeat:
        new_part: 1.2
        repeat_order: 1.0
        running_production: 0.95
```

---

*Document generated for AI-build Phase 17: Plastics vs Metals BOM Differences*
