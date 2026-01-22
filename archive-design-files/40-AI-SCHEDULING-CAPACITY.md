# 40 — AI Scheduling & Capacity Model

> **Purpose:** Work center definitions, capacity models, scheduling algorithms for AI-build.  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. Work Centers

```json
[
  {
    "id": "WC-SHEAR-01",
    "name": "Hydraulic Shear #1",
    "type": "SHEAR",
    "location": "MAIN_PLANT",
    "capabilities": [
      "cut_to_length",
      "sheet_shearing",
      "plate_shearing",
      "angle_shearing"
    ],
    "material_types": ["sheet", "plate", "flat_bar", "angle"],
    "constraints": {
      "max_thickness_in": 0.5,
      "max_width_in": 120,
      "min_length_in": 6,
      "max_length_in": 240,
      "max_weight_lb": 5000,
      "requires_overhead_crane": true,
      "requires_forklift": false,
      "min_operators": 1,
      "max_operators": 2,
      "certifications_required": ["shear_operator"]
    },
    "capacity_model": {
      "type": "time_based",
      "available_hours_per_shift": 7.5,
      "shifts_per_day": 2,
      "days_per_week": 5,
      "efficiency_factor": 0.85,
      "setup_time_minutes": 15,
      "changeover_time_minutes": 10,
      "pieces_per_hour_base": 60,
      "throughput_formula": "pieces_per_hour_base * efficiency_factor * (1 - thickness_factor)",
      "thickness_factor_formula": "(thickness / max_thickness) * 0.3"
    },
    "scheduling_rules": {
      "batch_similar_gauge": true,
      "batch_similar_width": true,
      "min_batch_size": 1,
      "max_batch_size": 500,
      "priority_boost_hot_jobs": 2.0,
      "allow_preemption": false
    },
    "maintenance_windows": {
      "daily_pm_minutes": 15,
      "weekly_pm_hours": 2,
      "blade_change_interval_cuts": 10000,
      "blade_change_time_hours": 1
    }
  },
  {
    "id": "WC-SHEAR-02",
    "name": "Hydraulic Shear #2",
    "type": "SHEAR",
    "location": "MAIN_PLANT",
    "capabilities": [
      "cut_to_length",
      "sheet_shearing",
      "plate_shearing",
      "heavy_plate"
    ],
    "material_types": ["sheet", "plate", "flat_bar"],
    "constraints": {
      "max_thickness_in": 1.0,
      "max_width_in": 144,
      "min_length_in": 12,
      "max_length_in": 480,
      "max_weight_lb": 15000,
      "requires_overhead_crane": true,
      "requires_forklift": true,
      "min_operators": 2,
      "max_operators": 3,
      "certifications_required": ["shear_operator", "heavy_plate"]
    },
    "capacity_model": {
      "type": "time_based",
      "available_hours_per_shift": 7.5,
      "shifts_per_day": 2,
      "days_per_week": 5,
      "efficiency_factor": 0.80,
      "setup_time_minutes": 20,
      "changeover_time_minutes": 15,
      "pieces_per_hour_base": 30,
      "throughput_formula": "pieces_per_hour_base * efficiency_factor * (1 - thickness_factor)",
      "thickness_factor_formula": "(thickness / max_thickness) * 0.4"
    },
    "scheduling_rules": {
      "batch_similar_gauge": true,
      "batch_similar_width": true,
      "min_batch_size": 1,
      "max_batch_size": 200,
      "priority_boost_hot_jobs": 2.0,
      "allow_preemption": false
    },
    "maintenance_windows": {
      "daily_pm_minutes": 20,
      "weekly_pm_hours": 4,
      "blade_change_interval_cuts": 5000,
      "blade_change_time_hours": 2
    }
  },
  {
    "id": "WC-SLITTER-01",
    "name": "Slitting Line #1",
    "type": "SLITTER",
    "location": "MAIN_PLANT",
    "capabilities": [
      "coil_slitting",
      "edge_trim",
      "mult_slitting",
      "recoil"
    ],
    "material_types": ["coil", "sheet"],
    "constraints": {
      "max_thickness_in": 0.25,
      "min_thickness_in": 0.010,
      "max_width_in": 72,
      "min_slit_width_in": 0.5,
      "max_coil_weight_lb": 40000,
      "max_coil_od_in": 72,
      "min_coil_id_in": 16,
      "max_arbor_knives": 32,
      "requires_overhead_crane": true,
      "requires_coil_car": true,
      "min_operators": 2,
      "max_operators": 3,
      "certifications_required": ["slitter_operator", "crane_operator"]
    },
    "capacity_model": {
      "type": "weight_based",
      "available_hours_per_shift": 7.5,
      "shifts_per_day": 2,
      "days_per_week": 5,
      "efficiency_factor": 0.75,
      "setup_time_minutes": 45,
      "changeover_time_minutes": 30,
      "lbs_per_hour_base": 15000,
      "throughput_formula": "lbs_per_hour_base * efficiency_factor * gauge_factor * width_factor",
      "gauge_factor_formula": "1 - ((0.25 - thickness) / 0.25) * 0.2",
      "width_factor_formula": "coil_width / max_width"
    },
    "scheduling_rules": {
      "batch_similar_gauge": true,
      "batch_similar_grade": true,
      "sequence_wide_to_narrow": true,
      "min_batch_size": 1,
      "max_batch_size": 20,
      "priority_boost_hot_jobs": 1.5,
      "allow_preemption": false,
      "knife_setup_optimization": true
    },
    "maintenance_windows": {
      "daily_pm_minutes": 30,
      "weekly_pm_hours": 4,
      "knife_change_interval_lbs": 500000,
      "knife_change_time_hours": 4
    }
  },
  {
    "id": "WC-SLITTER-02",
    "name": "Slitting Line #2 (Heavy Gauge)",
    "type": "SLITTER",
    "location": "MAIN_PLANT",
    "capabilities": [
      "coil_slitting",
      "heavy_gauge_slitting",
      "edge_trim",
      "recoil"
    ],
    "material_types": ["coil"],
    "constraints": {
      "max_thickness_in": 0.625,
      "min_thickness_in": 0.075,
      "max_width_in": 60,
      "min_slit_width_in": 1.0,
      "max_coil_weight_lb": 50000,
      "max_coil_od_in": 72,
      "min_coil_id_in": 20,
      "max_arbor_knives": 16,
      "requires_overhead_crane": true,
      "requires_coil_car": true,
      "min_operators": 2,
      "max_operators": 3,
      "certifications_required": ["slitter_operator", "heavy_gauge", "crane_operator"]
    },
    "capacity_model": {
      "type": "weight_based",
      "available_hours_per_shift": 7.5,
      "shifts_per_day": 2,
      "days_per_week": 5,
      "efficiency_factor": 0.70,
      "setup_time_minutes": 60,
      "changeover_time_minutes": 45,
      "lbs_per_hour_base": 20000,
      "throughput_formula": "lbs_per_hour_base * efficiency_factor * gauge_factor",
      "gauge_factor_formula": "1 - ((thickness - 0.075) / 0.55) * 0.3"
    },
    "scheduling_rules": {
      "batch_similar_gauge": true,
      "batch_similar_grade": true,
      "sequence_wide_to_narrow": true,
      "min_batch_size": 1,
      "max_batch_size": 10,
      "priority_boost_hot_jobs": 1.5,
      "allow_preemption": false
    },
    "maintenance_windows": {
      "daily_pm_minutes": 30,
      "weekly_pm_hours": 6,
      "knife_change_interval_lbs": 300000,
      "knife_change_time_hours": 6
    }
  },
  {
    "id": "WC-LEVELER-01",
    "name": "Leveling Line #1",
    "type": "LEVELER",
    "location": "MAIN_PLANT",
    "capabilities": [
      "coil_leveling",
      "sheet_leveling",
      "cut_to_length",
      "tension_leveling"
    ],
    "material_types": ["coil", "sheet"],
    "constraints": {
      "max_thickness_in": 0.25,
      "min_thickness_in": 0.015,
      "max_width_in": 72,
      "min_length_in": 24,
      "max_length_in": 240,
      "max_coil_weight_lb": 40000,
      "flatness_tolerance_in_per_ft": 0.010,
      "requires_overhead_crane": true,
      "min_operators": 2,
      "max_operators": 3,
      "certifications_required": ["leveler_operator", "crane_operator"]
    },
    "capacity_model": {
      "type": "hybrid",
      "available_hours_per_shift": 7.5,
      "shifts_per_day": 2,
      "days_per_week": 5,
      "efficiency_factor": 0.80,
      "setup_time_minutes": 30,
      "changeover_time_minutes": 20,
      "sheets_per_hour_base": 120,
      "lbs_per_hour_coil_base": 12000,
      "throughput_formula_sheet": "sheets_per_hour_base * efficiency_factor * (1 - gauge_penalty)",
      "throughput_formula_coil": "lbs_per_hour_coil_base * efficiency_factor",
      "gauge_penalty_formula": "(thickness / max_thickness) * 0.25"
    },
    "scheduling_rules": {
      "batch_similar_gauge": true,
      "batch_similar_length": true,
      "min_batch_size": 10,
      "max_batch_size": 1000,
      "priority_boost_hot_jobs": 1.5,
      "allow_preemption": false
    },
    "maintenance_windows": {
      "daily_pm_minutes": 20,
      "weekly_pm_hours": 3,
      "roll_change_interval_lbs": 1000000,
      "roll_change_time_hours": 8
    }
  },
  {
    "id": "WC-PLASMA-01",
    "name": "Plasma Cutting Table #1",
    "type": "PLASMA",
    "location": "MAIN_PLANT",
    "capabilities": [
      "plasma_cutting",
      "shape_cutting",
      "bevel_cutting",
      "hole_cutting",
      "nesting"
    ],
    "material_types": ["plate", "sheet"],
    "constraints": {
      "max_thickness_in": 2.0,
      "min_thickness_in": 0.060,
      "table_width_in": 120,
      "table_length_in": 480,
      "max_sheet_weight_lb": 20000,
      "min_hole_diameter_in": 0.375,
      "kerf_width_in": 0.125,
      "requires_overhead_crane": true,
      "requires_fume_extraction": true,
      "min_operators": 1,
      "max_operators": 2,
      "certifications_required": ["plasma_operator", "cnc_programmer"]
    },
    "capacity_model": {
      "type": "linear_inches",
      "available_hours_per_shift": 7.5,
      "shifts_per_day": 2,
      "days_per_week": 5,
      "efficiency_factor": 0.70,
      "setup_time_minutes": 20,
      "program_load_time_minutes": 5,
      "ipm_base": 200,
      "throughput_formula": "total_cut_length_in / (ipm_base * thickness_factor * efficiency_factor)",
      "thickness_factor_formula": "1 - (thickness / max_thickness) * 0.7",
      "pierce_time_seconds": 3,
      "rapid_traverse_ipm": 1000
    },
    "scheduling_rules": {
      "batch_similar_thickness": true,
      "nest_optimization": true,
      "min_batch_size": 1,
      "max_batch_size": 50,
      "priority_boost_hot_jobs": 2.0,
      "allow_preemption": true,
      "preemption_penalty_minutes": 15
    },
    "maintenance_windows": {
      "daily_pm_minutes": 30,
      "weekly_pm_hours": 4,
      "consumable_check_interval_hours": 8,
      "torch_rebuild_interval_hours": 500
    }
  },
  {
    "id": "WC-LASER-01",
    "name": "Fiber Laser #1",
    "type": "LASER",
    "location": "MAIN_PLANT",
    "capabilities": [
      "laser_cutting",
      "precision_cutting",
      "shape_cutting",
      "hole_cutting",
      "nesting"
    ],
    "material_types": ["sheet", "plate"],
    "constraints": {
      "max_thickness_in": 1.0,
      "min_thickness_in": 0.010,
      "table_width_in": 60,
      "table_length_in": 120,
      "max_sheet_weight_lb": 5000,
      "min_hole_diameter_in": 0.125,
      "kerf_width_in": 0.020,
      "requires_overhead_crane": false,
      "requires_nitrogen_supply": true,
      "requires_oxygen_supply": true,
      "min_operators": 1,
      "max_operators": 1,
      "certifications_required": ["laser_operator", "cnc_programmer"]
    },
    "capacity_model": {
      "type": "linear_inches",
      "available_hours_per_shift": 7.5,
      "shifts_per_day": 2,
      "days_per_week": 5,
      "efficiency_factor": 0.75,
      "setup_time_minutes": 10,
      "program_load_time_minutes": 2,
      "ipm_thin_gauge": 1200,
      "ipm_thick_gauge": 60,
      "throughput_formula": "total_cut_length_in / (ipm_for_gauge * efficiency_factor)",
      "ipm_formula": "ipm_thin_gauge - ((thickness - 0.010) / 0.990) * (ipm_thin_gauge - ipm_thick_gauge)",
      "pierce_time_seconds": 0.5,
      "rapid_traverse_ipm": 4000
    },
    "scheduling_rules": {
      "batch_similar_thickness": true,
      "batch_similar_material": true,
      "nest_optimization": true,
      "min_batch_size": 1,
      "max_batch_size": 100,
      "priority_boost_hot_jobs": 2.0,
      "allow_preemption": true,
      "preemption_penalty_minutes": 5
    },
    "maintenance_windows": {
      "daily_pm_minutes": 15,
      "weekly_pm_hours": 2,
      "lens_check_interval_hours": 24,
      "nozzle_change_interval_hours": 40
    }
  },
  {
    "id": "WC-SAW-01",
    "name": "Band Saw #1",
    "type": "SAW",
    "location": "MAIN_PLANT",
    "capabilities": [
      "bar_cutting",
      "tube_cutting",
      "structural_cutting",
      "bundle_cutting",
      "miter_cutting"
    ],
    "material_types": ["bar", "tube", "pipe", "structural", "beam"],
    "constraints": {
      "max_width_in": 24,
      "max_height_in": 20,
      "max_bundle_weight_lb": 10000,
      "max_length_in": 480,
      "min_cut_length_in": 0.5,
      "miter_angle_range_deg": [-60, 60],
      "requires_overhead_crane": true,
      "requires_roller_conveyor": true,
      "min_operators": 1,
      "max_operators": 2,
      "certifications_required": ["saw_operator"]
    },
    "capacity_model": {
      "type": "cuts_based",
      "available_hours_per_shift": 7.5,
      "shifts_per_day": 2,
      "days_per_week": 5,
      "efficiency_factor": 0.85,
      "setup_time_minutes": 10,
      "bundle_setup_time_minutes": 15,
      "sq_in_per_minute_base": 8,
      "throughput_formula": "cross_section_sq_in / sq_in_per_minute_base + handling_time",
      "handling_time_formula": "2 + (weight / 1000) * 0.5",
      "bundle_bonus": 0.7
    },
    "scheduling_rules": {
      "batch_similar_size": true,
      "batch_similar_material": true,
      "sequence_large_to_small": true,
      "bundle_when_possible": true,
      "min_batch_size": 1,
      "max_batch_size": 200,
      "priority_boost_hot_jobs": 1.5,
      "allow_preemption": false
    },
    "maintenance_windows": {
      "daily_pm_minutes": 15,
      "weekly_pm_hours": 2,
      "blade_change_interval_sq_in": 50000,
      "blade_change_time_minutes": 30
    }
  },
  {
    "id": "WC-SAW-02",
    "name": "Cold Saw #1",
    "type": "SAW",
    "location": "MAIN_PLANT",
    "capabilities": [
      "precision_cutting",
      "bar_cutting",
      "tube_cutting",
      "high_volume_cutting"
    ],
    "material_types": ["bar", "tube", "pipe"],
    "constraints": {
      "max_diameter_in": 6,
      "max_bundle_weight_lb": 2000,
      "max_length_in": 240,
      "min_cut_length_in": 0.25,
      "tolerance_in": 0.010,
      "requires_overhead_crane": false,
      "requires_bar_feeder": true,
      "min_operators": 1,
      "max_operators": 1,
      "certifications_required": ["saw_operator"]
    },
    "capacity_model": {
      "type": "cuts_based",
      "available_hours_per_shift": 7.5,
      "shifts_per_day": 2,
      "days_per_week": 5,
      "efficiency_factor": 0.90,
      "setup_time_minutes": 5,
      "cuts_per_minute_base": 4,
      "throughput_formula": "cuts_per_minute_base * efficiency_factor * (1 - diameter_factor)",
      "diameter_factor_formula": "(diameter / max_diameter) * 0.5"
    },
    "scheduling_rules": {
      "batch_similar_diameter": true,
      "batch_similar_material": true,
      "sequence_by_cut_length": true,
      "min_batch_size": 10,
      "max_batch_size": 1000,
      "priority_boost_hot_jobs": 1.5,
      "allow_preemption": false
    },
    "maintenance_windows": {
      "daily_pm_minutes": 10,
      "weekly_pm_hours": 1,
      "blade_change_interval_cuts": 5000,
      "blade_change_time_minutes": 15
    }
  },
  {
    "id": "WC-BRAKE-01",
    "name": "Press Brake #1",
    "type": "BRAKE",
    "location": "MAIN_PLANT",
    "capabilities": [
      "bending",
      "forming",
      "channel_forming",
      "angle_forming",
      "hemming"
    ],
    "material_types": ["sheet", "plate"],
    "constraints": {
      "max_thickness_in": 0.5,
      "max_width_in": 144,
      "tonnage": 250,
      "max_bend_length_in": 144,
      "min_flange_in": 0.5,
      "angle_range_deg": [0, 180],
      "requires_overhead_crane": true,
      "min_operators": 1,
      "max_operators": 2,
      "certifications_required": ["brake_operator"]
    },
    "capacity_model": {
      "type": "bends_based",
      "available_hours_per_shift": 7.5,
      "shifts_per_day": 2,
      "days_per_week": 5,
      "efficiency_factor": 0.80,
      "setup_time_minutes": 20,
      "tool_change_time_minutes": 15,
      "bends_per_hour_base": 60,
      "throughput_formula": "bends_per_hour_base * efficiency_factor * (1 - complexity_factor)",
      "complexity_factor_formula": "(num_bends - 1) * 0.05 + (thickness / max_thickness) * 0.2"
    },
    "scheduling_rules": {
      "batch_similar_thickness": true,
      "batch_similar_tooling": true,
      "sequence_by_die_setup": true,
      "min_batch_size": 1,
      "max_batch_size": 500,
      "priority_boost_hot_jobs": 1.5,
      "allow_preemption": false
    },
    "maintenance_windows": {
      "daily_pm_minutes": 15,
      "weekly_pm_hours": 2,
      "hydraulic_check_interval_hours": 500
    }
  },
  {
    "id": "WC-ROLL-01",
    "name": "Plate Roll #1",
    "type": "ROLL",
    "location": "MAIN_PLANT",
    "capabilities": [
      "plate_rolling",
      "cone_rolling",
      "cylinder_forming"
    ],
    "material_types": ["plate", "sheet"],
    "constraints": {
      "max_thickness_in": 1.0,
      "max_width_in": 120,
      "min_diameter_in": 12,
      "max_diameter_in": 120,
      "requires_overhead_crane": true,
      "min_operators": 2,
      "max_operators": 3,
      "certifications_required": ["roll_operator", "crane_operator"]
    },
    "capacity_model": {
      "type": "pieces_based",
      "available_hours_per_shift": 7.5,
      "shifts_per_day": 1,
      "days_per_week": 5,
      "efficiency_factor": 0.70,
      "setup_time_minutes": 30,
      "pieces_per_hour_base": 4,
      "throughput_formula": "pieces_per_hour_base * efficiency_factor * (1 - thickness_factor)",
      "thickness_factor_formula": "(thickness / max_thickness) * 0.5"
    },
    "scheduling_rules": {
      "batch_similar_thickness": true,
      "batch_similar_diameter": true,
      "min_batch_size": 1,
      "max_batch_size": 20,
      "priority_boost_hot_jobs": 2.0,
      "allow_preemption": false
    },
    "maintenance_windows": {
      "daily_pm_minutes": 20,
      "weekly_pm_hours": 4
    }
  },
  {
    "id": "WC-DRILL-01",
    "name": "CNC Drill Line #1",
    "type": "DRILL",
    "location": "MAIN_PLANT",
    "capabilities": [
      "drilling",
      "tapping",
      "countersinking",
      "structural_drilling"
    ],
    "material_types": ["plate", "structural", "beam", "angle"],
    "constraints": {
      "max_thickness_in": 2.0,
      "max_width_in": 48,
      "max_length_in": 480,
      "max_hole_diameter_in": 2.0,
      "min_hole_diameter_in": 0.125,
      "spindle_count": 3,
      "requires_overhead_crane": true,
      "min_operators": 1,
      "max_operators": 2,
      "certifications_required": ["cnc_operator"]
    },
    "capacity_model": {
      "type": "holes_based",
      "available_hours_per_shift": 7.5,
      "shifts_per_day": 2,
      "days_per_week": 5,
      "efficiency_factor": 0.85,
      "setup_time_minutes": 15,
      "holes_per_hour_base": 120,
      "throughput_formula": "holes_per_hour_base * efficiency_factor * spindle_count / (1 + thickness_factor)",
      "thickness_factor_formula": "(thickness / max_thickness) * 0.8"
    },
    "scheduling_rules": {
      "batch_similar_hole_pattern": true,
      "batch_similar_thickness": true,
      "min_batch_size": 1,
      "max_batch_size": 100,
      "priority_boost_hot_jobs": 1.5,
      "allow_preemption": false
    },
    "maintenance_windows": {
      "daily_pm_minutes": 15,
      "weekly_pm_hours": 2,
      "drill_bit_change_interval_holes": 500
    }
  },
  {
    "id": "WC-PUNCH-01",
    "name": "CNC Turret Punch #1",
    "type": "PUNCH",
    "location": "MAIN_PLANT",
    "capabilities": [
      "punching",
      "nibbling",
      "forming",
      "louvering",
      "embossing"
    ],
    "material_types": ["sheet"],
    "constraints": {
      "max_thickness_in": 0.25,
      "max_width_in": 60,
      "max_length_in": 120,
      "max_sheet_weight_lb": 500,
      "turret_stations": 48,
      "max_tonnage": 30,
      "min_operators": 1,
      "max_operators": 1,
      "certifications_required": ["punch_operator", "cnc_programmer"]
    },
    "capacity_model": {
      "type": "hits_based",
      "available_hours_per_shift": 7.5,
      "shifts_per_day": 2,
      "days_per_week": 5,
      "efficiency_factor": 0.80,
      "setup_time_minutes": 20,
      "hits_per_minute_base": 200,
      "throughput_formula": "total_hits / (hits_per_minute_base * efficiency_factor)",
      "nibble_factor": 0.5,
      "form_factor": 0.3
    },
    "scheduling_rules": {
      "batch_similar_thickness": true,
      "batch_similar_tooling": true,
      "nest_optimization": true,
      "min_batch_size": 1,
      "max_batch_size": 500,
      "priority_boost_hot_jobs": 1.5,
      "allow_preemption": true
    },
    "maintenance_windows": {
      "daily_pm_minutes": 15,
      "weekly_pm_hours": 2,
      "tool_sharpen_interval_hits": 10000
    }
  },
  {
    "id": "WC-WELD-01",
    "name": "Welding Station #1",
    "type": "WELD",
    "location": "MAIN_PLANT",
    "capabilities": [
      "mig_welding",
      "tig_welding",
      "spot_welding",
      "tack_welding",
      "assembly"
    ],
    "material_types": ["all"],
    "constraints": {
      "max_assembly_weight_lb": 5000,
      "table_size_in": [96, 48],
      "requires_overhead_crane": true,
      "requires_fume_extraction": true,
      "min_operators": 1,
      "max_operators": 2,
      "certifications_required": ["certified_welder", "aws_d1.1"]
    },
    "capacity_model": {
      "type": "time_based",
      "available_hours_per_shift": 7.5,
      "shifts_per_day": 1,
      "days_per_week": 5,
      "efficiency_factor": 0.65,
      "setup_time_minutes": 15,
      "inches_per_hour_base": 60,
      "throughput_formula": "total_weld_inches / inches_per_hour_base * complexity_factor",
      "complexity_factor_formula": "1 + (num_welds - 1) * 0.1 + position_factor",
      "position_factors": {
        "flat": 1.0,
        "horizontal": 1.2,
        "vertical": 1.5,
        "overhead": 2.0
      }
    },
    "scheduling_rules": {
      "batch_similar_weldment": true,
      "min_batch_size": 1,
      "max_batch_size": 50,
      "priority_boost_hot_jobs": 1.5,
      "allow_preemption": false
    },
    "maintenance_windows": {
      "daily_pm_minutes": 10,
      "weekly_pm_hours": 1
    }
  },
  {
    "id": "WC-PACK-01",
    "name": "Packaging Station #1",
    "type": "PACKAGING",
    "location": "SHIPPING",
    "capabilities": [
      "banding",
      "wrapping",
      "crating",
      "dunnage",
      "labeling"
    ],
    "material_types": ["all"],
    "constraints": {
      "max_package_weight_lb": 10000,
      "max_package_length_in": 480,
      "max_package_width_in": 96,
      "requires_forklift": true,
      "min_operators": 1,
      "max_operators": 2,
      "certifications_required": []
    },
    "capacity_model": {
      "type": "packages_based",
      "available_hours_per_shift": 7.5,
      "shifts_per_day": 2,
      "days_per_week": 5,
      "efficiency_factor": 0.85,
      "setup_time_minutes": 5,
      "packages_per_hour_base": 15,
      "throughput_formula": "packages_per_hour_base * efficiency_factor * (1 - size_factor)",
      "size_factor_formula": "(package_length / max_length) * 0.3"
    },
    "scheduling_rules": {
      "sequence_by_shipment": true,
      "batch_same_order": true,
      "min_batch_size": 1,
      "max_batch_size": 100,
      "priority_boost_hot_jobs": 2.0,
      "allow_preemption": true
    },
    "maintenance_windows": {
      "daily_pm_minutes": 10,
      "weekly_pm_hours": 1
    }
  },
  {
    "id": "WC-QUICK-01",
    "name": "Quick Cut Station",
    "type": "QUICK_CUT",
    "location": "COUNTER",
    "capabilities": [
      "quick_shear",
      "quick_saw",
      "counter_cut",
      "will_call_cut"
    ],
    "material_types": ["sheet", "bar", "tube", "angle"],
    "constraints": {
      "max_thickness_in": 0.25,
      "max_width_in": 48,
      "max_length_in": 144,
      "max_weight_lb": 500,
      "target_turnaround_minutes": 15,
      "requires_overhead_crane": false,
      "min_operators": 1,
      "max_operators": 1,
      "certifications_required": ["counter_operator"]
    },
    "capacity_model": {
      "type": "transactions_based",
      "available_hours_per_shift": 8.0,
      "shifts_per_day": 1,
      "days_per_week": 6,
      "efficiency_factor": 0.90,
      "setup_time_minutes": 2,
      "transactions_per_hour_base": 8,
      "throughput_formula": "transactions_per_hour_base * efficiency_factor"
    },
    "scheduling_rules": {
      "priority": "FIFO",
      "customer_waiting_boost": 3.0,
      "max_wait_time_minutes": 30,
      "allow_preemption": true
    },
    "maintenance_windows": {
      "daily_pm_minutes": 10,
      "weekly_pm_hours": 1
    }
  }
]
```

---

## 2. Capacity Model Formulas

```yaml
capacity_formulas:

  # ===== DAILY CAPACITY =====
  daily_available_hours:
    formula: "shifts_per_day * hours_per_shift * efficiency_factor"
    example: "2 * 7.5 * 0.85 = 12.75 hours"
    
  daily_available_minutes:
    formula: "daily_available_hours * 60 - daily_pm_minutes"
    example: "12.75 * 60 - 15 = 750 minutes"

  # ===== WEEKLY CAPACITY =====
  weekly_available_hours:
    formula: "(daily_available_hours * days_per_week) - weekly_pm_hours"
    example: "(12.75 * 5) - 2 = 61.75 hours"

  # ===== UTILIZATION =====
  utilization_rate:
    formula: "actual_production_hours / available_hours * 100"
    target: ">= 80%"
    warning: "< 70%"
    critical: "< 60%"

  capacity_utilization_forward:
    formula: "SUM(scheduled_hours[t:t+horizon]) / SUM(available_hours[t:t+horizon]) * 100"
    horizon: "5 days default"

  # ===== THROUGHPUT CALCULATIONS =====
  
  # Weight-based (Slitters, Levelers processing coils)
  weight_throughput_lbs_per_hour:
    formula: "base_rate * efficiency * gauge_factor * width_factor"
    gauge_factor: "1 - abs(thickness - optimal_thickness) / thickness_range * penalty"
    width_factor: "actual_width / max_width"
    
  # Piece-based (Shears, Brakes)
  piece_throughput_per_hour:
    formula: "base_rate * efficiency * (1 - complexity_factor)"
    complexity_factor: "varies by operation"

  # Linear-inch-based (Plasma, Laser)
  linear_inch_time_minutes:
    formula: "(cut_length / ipm) + (pierce_count * pierce_time) + (rapid_distance / rapid_ipm)"
    
  # Cuts-based (Saws)
  cut_time_minutes:
    formula: "(cross_section_area / sq_in_per_min) + handling_time + (index_distance / index_speed)"

  # ===== JOB TIME ESTIMATION =====
  job_processing_time:
    formula: "setup_time + SUM(operation_times) + teardown_time"
    
  operation_time:
    formula: "quantity * unit_time * (1 + scrap_factor)"
    scrap_factor: "historical_scrap_rate for operation"

  # ===== QUEUE TIME =====
  expected_queue_time:
    formula: "current_queue_hours + (jobs_ahead * avg_job_time)"
    
  queue_hours_by_priority:
    formula: |
      high_priority: current_queue * 0.2
      standard: current_queue * 0.8
      low_priority: current_queue * 1.5

  # ===== LEAD TIME =====
  manufacturing_lead_time:
    formula: "SUM(queue_time[op] + process_time[op] + move_time[op]) for each operation"
    
  total_lead_time:
    formula: "order_processing + credit_check + allocation + manufacturing_lead_time + shipping"

  # ===== LOAD BALANCING =====
  work_center_load:
    formula: "SUM(scheduled_job_hours) / available_hours"
    
  load_imbalance:
    formula: "MAX(wc_load) - MIN(wc_load)"
    target: "< 20%"

  # ===== EFFICIENCY FACTORS =====
  oee:
    formula: "availability * performance * quality"
    availability: "(run_time - downtime) / run_time"
    performance: "actual_output / theoretical_output"
    quality: "good_pieces / total_pieces"

  # ===== CHANGEOVER =====
  changeover_penalty:
    formula: |
      same_gauge: 0
      adjacent_gauge: changeover_time * 0.5
      different_gauge: changeover_time * 1.0
      different_material: changeover_time * 1.5

  # ===== BATCH SIZING =====
  optimal_batch_size:
    formula: "SQRT((2 * demand * setup_cost) / holding_cost)"
    constraint: "MIN(max_batch, MAX(min_batch, optimal))"

  # ===== MAINTENANCE IMPACT =====
  maintenance_capacity_reduction:
    formula: "(pm_time + unplanned_downtime_estimate) / available_time"
    unplanned_estimate: "historical_mtbf based"

  # ===== CAPACITY RESERVATION =====
  reservable_capacity:
    formula: "available_capacity * (1 - safety_buffer)"
    safety_buffer: "0.10 to 0.20"

  rush_capacity_reserve:
    formula: "daily_capacity * rush_reserve_percent"
    rush_reserve_percent: "0.15"
```

---

## 3. Due Date Algorithm

```pseudocode
ALGORITHM CalculateDueDate

INPUT:
  order: Order
  current_datetime: DateTime
  priority: Priority  // STANDARD, RUSH, HOT
  
OUTPUT:
  promise_date: DateTime
  confidence: Float  // 0.0 to 1.0
  risk_factors: List<RiskFactor>

CONSTANTS:
  BUSINESS_HOURS_START = 07:00
  BUSINESS_HOURS_END = 17:00
  WORK_DAYS = [MON, TUE, WED, THU, FRI]
  RUSH_MULTIPLIER = 0.6
  HOT_MULTIPLIER = 0.4
  CONFIDENCE_DECAY_PER_DAY = 0.02

BEGIN:
  
  // Step 1: Parse order lines and determine operations
  operations = []
  FOR EACH line IN order.lines:
    product = GetProduct(line.product_id)
    routing = GetRouting(product, line.specifications)
    FOR EACH op IN routing.operations:
      operations.APPEND({
        line_id: line.id,
        operation: op,
        quantity: line.quantity,
        weight: line.weight,
        work_center_options: GetCapableWorkCenters(op)
      })
  
  // Step 2: Check material availability
  material_status = CheckMaterialAvailability(order)
  IF material_status.all_available:
    material_delay = 0
  ELSE:
    material_delay = CalculateMaterialLeadTime(material_status.missing_items)
    risk_factors.APPEND(RiskFactor("MATERIAL_DELAY", material_delay))
  
  // Step 3: Calculate processing time for each operation
  total_processing_time = 0
  FOR EACH op IN operations:
    wc = SelectOptimalWorkCenter(op.work_center_options, op, current_datetime)
    op.assigned_work_center = wc
    op.setup_time = wc.capacity_model.setup_time_minutes
    op.run_time = CalculateRunTime(wc, op.operation, op.quantity, op.weight)
    op.total_time = op.setup_time + op.run_time
    total_processing_time += op.total_time
  
  // Step 4: Calculate queue time for each work center
  total_queue_time = 0
  work_centers_used = DISTINCT(op.assigned_work_center FOR op IN operations)
  FOR EACH wc IN work_centers_used:
    queue = GetCurrentQueue(wc)
    queue_hours = CalculateQueueHours(queue, priority)
    total_queue_time += queue_hours * 60  // Convert to minutes
    IF queue_hours > wc.sla_threshold:
      risk_factors.APPEND(RiskFactor("HIGH_QUEUE", wc.id, queue_hours))
  
  // Step 5: Apply priority multiplier
  SWITCH priority:
    CASE HOT:
      time_multiplier = HOT_MULTIPLIER
      queue_bypass = TRUE
    CASE RUSH:
      time_multiplier = RUSH_MULTIPLIER
      queue_bypass = PARTIAL
    DEFAULT:
      time_multiplier = 1.0
      queue_bypass = FALSE
  
  // Step 6: Calculate move/transit time between operations
  move_time = 0
  prev_wc = NULL
  FOR EACH op IN operations:
    IF prev_wc != NULL AND prev_wc != op.assigned_work_center:
      move_time += GetMoveTime(prev_wc, op.assigned_work_center)
    prev_wc = op.assigned_work_center
  
  // Step 7: Add quality inspection time
  inspection_time = 0
  IF order.customer.requires_inspection OR HasCriticalOperations(operations):
    inspection_time = GetInspectionTime(operations)
    IF GetQAQueueDepth() > THRESHOLD:
      risk_factors.APPEND(RiskFactor("QA_QUEUE_HIGH"))
  
  // Step 8: Add packaging and shipping prep time
  packaging_time = CalculatePackagingTime(order)
  shipping_prep_time = 60  // Default 1 hour
  
  // Step 9: Sum all times
  total_minutes = (
    material_delay * 24 * 60 +  // Days to minutes
    total_queue_time * time_multiplier +
    total_processing_time +
    move_time +
    inspection_time +
    packaging_time +
    shipping_prep_time
  )
  
  // Step 10: Convert to business hours
  business_hours_needed = total_minutes / 60
  
  // Step 11: Calculate promise date
  promise_date = AddBusinessHours(current_datetime, business_hours_needed)
  
  // Step 12: Round to appropriate increment
  IF priority == HOT:
    promise_date = RoundToNearestHour(promise_date)
  ELSE:
    promise_date = RoundToEndOfDay(promise_date)
  
  // Step 13: Calculate confidence score
  base_confidence = 0.95
  confidence = base_confidence
  
  // Decay for lead time
  days_out = BusinessDaysBetween(current_datetime, promise_date)
  confidence -= days_out * CONFIDENCE_DECAY_PER_DAY
  
  // Reduce for risk factors
  FOR EACH risk IN risk_factors:
    confidence -= risk.confidence_penalty
  
  // Reduce for capacity constraints
  FOR EACH wc IN work_centers_used:
    utilization = GetForwardUtilization(wc, promise_date)
    IF utilization > 0.90:
      confidence -= 0.05
      risk_factors.APPEND(RiskFactor("HIGH_UTILIZATION", wc.id))
    IF utilization > 0.95:
      confidence -= 0.10
  
  // Check historical on-time performance
  historical_otp = GetHistoricalOTP(work_centers_used, 30)  // Last 30 days
  IF historical_otp < 0.95:
    confidence -= (0.95 - historical_otp) * 0.5
    risk_factors.APPEND(RiskFactor("OTP_BELOW_TARGET", historical_otp))
  
  confidence = MAX(0.50, MIN(0.99, confidence))
  
  // Step 14: Return results
  RETURN {
    promise_date: promise_date,
    confidence: confidence,
    risk_factors: risk_factors,
    breakdown: {
      material_delay_days: material_delay,
      queue_hours: total_queue_time / 60,
      processing_hours: total_processing_time / 60,
      move_hours: move_time / 60,
      inspection_hours: inspection_time / 60,
      packaging_hours: packaging_time / 60,
      total_business_hours: business_hours_needed
    }
  }

END ALGORITHM


FUNCTION SelectOptimalWorkCenter(options, operation, datetime):
  scored_options = []
  FOR EACH wc IN options:
    IF NOT wc.IsAvailable(datetime):
      CONTINUE
    IF NOT wc.HasCapability(operation.type):
      CONTINUE
    IF NOT wc.MeetsConstraints(operation):
      CONTINUE
    
    score = 0
    
    // Queue time factor (lower is better)
    queue_hours = GetQueueHours(wc)
    score += (10 - MIN(10, queue_hours)) * 3
    
    // Efficiency factor
    efficiency = wc.GetEfficiencyForOperation(operation)
    score += efficiency * 10 * 2
    
    // Setup optimization (same gauge = bonus)
    IF wc.current_setup.matches(operation):
      score += 5
    
    // Utilization balance (prefer underutilized)
    utilization = GetUtilization(wc)
    score += (1 - utilization) * 10
    
    scored_options.APPEND({wc: wc, score: score})
  
  RETURN scored_options.SORT_BY(score, DESC).FIRST().wc


FUNCTION CalculateRunTime(work_center, operation, quantity, weight):
  model = work_center.capacity_model
  
  SWITCH model.type:
    CASE "time_based":
      unit_time = 60 / model.pieces_per_hour_base
      RETURN quantity * unit_time * (1 / model.efficiency_factor)
      
    CASE "weight_based":
      RETURN (weight / model.lbs_per_hour_base) * 60 / model.efficiency_factor
      
    CASE "linear_inches":
      cut_length = operation.total_cut_length
      ipm = CalculateIPM(work_center, operation.thickness)
      pierce_time = operation.pierce_count * model.pierce_time_seconds / 60
      RETURN (cut_length / ipm) + pierce_time
      
    CASE "cuts_based":
      cut_time = operation.cross_section / model.sq_in_per_minute_base
      handling = model.handling_time_formula(weight)
      RETURN quantity * (cut_time + handling)
      
    CASE "bends_based":
      bends_per_piece = operation.num_bends
      time_per_bend = 60 / model.bends_per_hour_base
      RETURN quantity * bends_per_piece * time_per_bend / model.efficiency_factor
      
    DEFAULT:
      RETURN quantity * DEFAULT_UNIT_TIME


FUNCTION AddBusinessHours(start_datetime, hours):
  result = start_datetime
  remaining = hours
  
  WHILE remaining > 0:
    IF NOT IsBusinessDay(result):
      result = NextBusinessDay(result) + BUSINESS_HOURS_START
      CONTINUE
    
    IF result.time < BUSINESS_HOURS_START:
      result = result.date + BUSINESS_HOURS_START
    
    IF result.time >= BUSINESS_HOURS_END:
      result = NextBusinessDay(result) + BUSINESS_HOURS_START
      CONTINUE
    
    hours_left_today = BUSINESS_HOURS_END - result.time
    IF remaining <= hours_left_today:
      result = result + remaining hours
      remaining = 0
    ELSE:
      remaining -= hours_left_today
      result = NextBusinessDay(result) + BUSINESS_HOURS_START
  
  RETURN result
```

---

## 4. SLA Risk Model

```pseudocode
ALGORITHM CalculateSLARisk

INPUT:
  order: Order
  work_orders: List<WorkOrder>
  current_datetime: DateTime

OUTPUT:
  risk_score: Float  // 0.0 (no risk) to 1.0 (certain miss)
  risk_level: Enum  // GREEN, YELLOW, ORANGE, RED
  risk_factors: List<RiskFactor>
  recommended_actions: List<Action>
  time_to_sla_breach: Duration

BEGIN:

  risk_factors = []
  risk_score = 0.0
  
  // ===== TIME-BASED RISK =====
  
  promise_date = order.promise_date
  time_remaining = promise_date - current_datetime
  time_remaining_hours = time_remaining.total_hours()
  
  // Calculate required work remaining
  work_remaining_hours = 0
  FOR EACH wo IN work_orders:
    IF wo.status NOT IN [COMPLETED, CANCELLED]:
      work_remaining_hours += wo.remaining_hours
  
  // Add shipping/packaging buffer
  shipping_buffer = 4  // hours
  total_required_hours = work_remaining_hours + shipping_buffer
  
  // Time slack calculation
  time_slack = time_remaining_hours - total_required_hours
  slack_ratio = time_slack / time_remaining_hours IF time_remaining_hours > 0 ELSE -1
  
  IF slack_ratio < 0:
    risk_score += 0.40
    risk_factors.APPEND({
      type: "NEGATIVE_SLACK",
      severity: "CRITICAL",
      detail: "Work remaining exceeds time available",
      hours_short: ABS(time_slack)
    })
  ELSE IF slack_ratio < 0.10:
    risk_score += 0.25
    risk_factors.APPEND({
      type: "LOW_SLACK",
      severity: "HIGH",
      detail: "Less than 10% buffer remaining"
    })
  ELSE IF slack_ratio < 0.25:
    risk_score += 0.10
    risk_factors.APPEND({
      type: "REDUCED_SLACK",
      severity: "MEDIUM",
      detail: "Less than 25% buffer remaining"
    })

  // ===== PRODUCTION STATUS RISK =====
  
  FOR EACH wo IN work_orders:
    wo_risk = EvaluateWorkOrderRisk(wo, current_datetime)
    
    IF wo.status == "HOLD":
      risk_score += 0.15
      risk_factors.APPEND({
        type: "WORK_ORDER_HOLD",
        severity: "HIGH",
        work_order_id: wo.id,
        hold_reason: wo.hold_reason,
        hold_duration: current_datetime - wo.hold_start
      })
    
    IF wo.status == "IN_PROGRESS":
      expected_complete = wo.scheduled_end
      IF expected_complete > promise_date:
        risk_score += 0.20
        risk_factors.APPEND({
          type: "SCHEDULE_OVERRUN",
          severity: "HIGH",
          work_order_id: wo.id,
          overrun_hours: (expected_complete - promise_date).hours()
        })
      
      // Check if behind schedule
      progress = wo.completed_operations / wo.total_operations
      expected_progress = (current_datetime - wo.start_time) / (wo.scheduled_end - wo.start_time)
      IF progress < expected_progress - 0.10:
        risk_score += 0.10
        risk_factors.APPEND({
          type: "BEHIND_SCHEDULE",
          severity: "MEDIUM",
          work_order_id: wo.id,
          progress_gap: expected_progress - progress
        })
    
    IF wo.status == "SCHEDULED" AND wo.scheduled_start > current_datetime:
      // Not started yet - check if start time is at risk
      time_to_start = wo.scheduled_start - current_datetime
      IF time_to_start.hours() < 2:
        wc = GetWorkCenter(wo.work_center_id)
        IF wc.current_status != "AVAILABLE":
          risk_score += 0.10
          risk_factors.APPEND({
            type: "START_DELAYED",
            severity: "MEDIUM",
            work_order_id: wo.id,
            work_center: wc.id,
            wc_status: wc.current_status
          })

  // ===== RESOURCE RISK =====
  
  FOR EACH wo IN work_orders WHERE wo.status IN ["SCHEDULED", "IN_PROGRESS"]:
    wc = GetWorkCenter(wo.work_center_id)
    
    // Machine availability
    IF wc.status == "DOWN":
      risk_score += 0.25
      risk_factors.APPEND({
        type: "MACHINE_DOWN",
        severity: "CRITICAL",
        work_center: wc.id,
        estimated_repair: wc.estimated_repair_time
      })
    
    IF wc.status == "DEGRADED":
      risk_score += 0.10
      risk_factors.APPEND({
        type: "MACHINE_DEGRADED",
        severity: "MEDIUM",
        work_center: wc.id,
        efficiency_loss: wc.degradation_factor
      })
    
    // Operator availability
    required_operators = wc.min_operators
    available_operators = GetAvailableOperators(wc, wo.scheduled_time_window)
    IF available_operators < required_operators:
      risk_score += 0.15
      risk_factors.APPEND({
        type: "OPERATOR_SHORTAGE",
        severity: "HIGH",
        work_center: wc.id,
        needed: required_operators,
        available: available_operators
      })
    
    // Queue depth
    queue_depth = GetQueueDepth(wc)
    avg_queue = GetAverageQueueDepth(wc, 7)  // 7 day average
    IF queue_depth > avg_queue * 1.5:
      risk_score += 0.05
      risk_factors.APPEND({
        type: "HIGH_QUEUE",
        severity: "LOW",
        work_center: wc.id,
        current: queue_depth,
        average: avg_queue
      })

  // ===== MATERIAL RISK =====
  
  FOR EACH wo IN work_orders:
    material_status = CheckMaterialStatus(wo)
    
    IF material_status == "NOT_ALLOCATED":
      risk_score += 0.20
      risk_factors.APPEND({
        type: "MATERIAL_NOT_ALLOCATED",
        severity: "HIGH",
        work_order_id: wo.id
      })
    
    IF material_status == "ALLOCATED_NOT_STAGED":
      time_to_start = wo.scheduled_start - current_datetime
      IF time_to_start.hours() < 4:
        risk_score += 0.10
        risk_factors.APPEND({
          type: "MATERIAL_NOT_STAGED",
          severity: "MEDIUM",
          work_order_id: wo.id,
          staging_deadline: wo.scheduled_start - 1 hour
        })
    
    IF material_status == "PARTIAL":
      risk_score += 0.15
      risk_factors.APPEND({
        type: "PARTIAL_MATERIAL",
        severity: "HIGH",
        work_order_id: wo.id,
        available_pct: material_status.available_percentage
      })

  // ===== QUALITY RISK =====
  
  historical_fpy = GetFirstPassYield(order.product_ids, 30)
  IF historical_fpy < 0.95:
    rework_probability = 1 - historical_fpy
    risk_score += rework_probability * 0.20
    risk_factors.APPEND({
      type: "QUALITY_HISTORY",
      severity: "MEDIUM",
      fpy: historical_fpy,
      rework_probability: rework_probability
    })
  
  // Check for quality holds on related work
  FOR EACH wo IN work_orders:
    IF HasQualityHold(wo):
      risk_score += 0.15
      risk_factors.APPEND({
        type: "QUALITY_HOLD",
        severity: "HIGH",
        work_order_id: wo.id,
        hold_reason: wo.quality_hold_reason
      })

  // ===== DEPENDENCY RISK =====
  
  FOR EACH wo IN work_orders:
    dependencies = GetDependencies(wo)
    FOR EACH dep IN dependencies:
      IF dep.status != "COMPLETED":
        dep_risk = CalculateDependencyRisk(dep, wo.scheduled_start)
        IF dep_risk > 0.5:
          risk_score += 0.10
          risk_factors.APPEND({
            type: "DEPENDENCY_AT_RISK",
            severity: "MEDIUM",
            work_order_id: wo.id,
            dependency_id: dep.id,
            dep_status: dep.status
          })

  // ===== EXTERNAL RISK =====
  
  IF order.ship_method == "CUSTOMER_PICKUP":
    // Will-call - less risk from shipping
    shipping_risk = 0
  ELSE:
    carrier_performance = GetCarrierPerformance(order.carrier)
    IF carrier_performance.on_time_pct < 0.95:
      risk_score += (0.95 - carrier_performance.on_time_pct) * 0.10
      risk_factors.APPEND({
        type: "CARRIER_RELIABILITY",
        severity: "LOW",
        carrier: order.carrier,
        on_time_pct: carrier_performance.on_time_pct
      })

  // ===== CALCULATE FINAL RISK =====
  
  risk_score = MIN(1.0, risk_score)
  
  // Determine risk level
  IF risk_score >= 0.70:
    risk_level = "RED"
  ELSE IF risk_score >= 0.40:
    risk_level = "ORANGE"
  ELSE IF risk_score >= 0.20:
    risk_level = "YELLOW"
  ELSE:
    risk_level = "GREEN"
  
  // Calculate time to SLA breach
  critical_path = CalculateCriticalPath(work_orders)
  earliest_completion = current_datetime + critical_path.duration
  time_to_breach = promise_date - earliest_completion
  
  // Generate recommended actions
  recommended_actions = GenerateActions(risk_factors, risk_level)
  
  RETURN {
    risk_score: risk_score,
    risk_level: risk_level,
    risk_factors: risk_factors.SORT_BY(severity, DESC),
    recommended_actions: recommended_actions,
    time_to_sla_breach: time_to_breach,
    earliest_completion: earliest_completion
  }

END ALGORITHM


FUNCTION GenerateActions(risk_factors, risk_level):
  actions = []
  
  FOR EACH rf IN risk_factors:
    SWITCH rf.type:
      CASE "NEGATIVE_SLACK":
        actions.APPEND({
          action: "EXPEDITE",
          priority: "CRITICAL",
          description: "Expedite all work orders, consider overtime",
          impact: "Add capacity to recover " + rf.hours_short + " hours"
        })
        actions.APPEND({
          action: "NOTIFY_CUSTOMER",
          priority: "HIGH",
          description: "Proactive customer communication about delay risk"
        })
        
      CASE "MACHINE_DOWN":
        actions.APPEND({
          action: "REROUTE",
          priority: "CRITICAL",
          description: "Reroute to alternate work center",
          work_center: rf.work_center
        })
        actions.APPEND({
          action: "ESCALATE_MAINTENANCE",
          priority: "HIGH",
          description: "Escalate repair priority"
        })
        
      CASE "OPERATOR_SHORTAGE":
        actions.APPEND({
          action: "REASSIGN_OPERATOR",
          priority: "HIGH",
          description: "Reassign qualified operator from lower priority work"
        })
        actions.APPEND({
          action: "CALL_IN",
          priority: "MEDIUM",
          description: "Consider calling in additional staff"
        })
        
      CASE "MATERIAL_NOT_ALLOCATED":
        actions.APPEND({
          action: "ALLOCATE_NOW",
          priority: "CRITICAL",
          description: "Immediately allocate required material"
        })
        
      CASE "WORK_ORDER_HOLD":
        actions.APPEND({
          action: "RESOLVE_HOLD",
          priority: "CRITICAL",
          description: "Investigate and resolve hold reason: " + rf.hold_reason
        })
        
      CASE "BEHIND_SCHEDULE":
        actions.APPEND({
          action: "REVIEW_SCHEDULE",
          priority: "MEDIUM",
          description: "Review and adjust work order schedule"
        })
        
      CASE "QUALITY_HOLD":
        actions.APPEND({
          action: "EXPEDITE_QA",
          priority: "HIGH",
          description: "Prioritize quality review"
        })
  
  // Sort by priority
  priority_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
  actions = actions.SORT_BY(priority_order[action.priority])
  
  RETURN actions


FUNCTION CalculateCriticalPath(work_orders):
  // Build dependency graph
  graph = BuildDependencyGraph(work_orders)
  
  // Calculate earliest start/finish for each node
  FOR EACH wo IN TopologicalSort(graph):
    wo.earliest_start = MAX(predecessor.earliest_finish FOR predecessor IN wo.predecessors) OR 0
    wo.earliest_finish = wo.earliest_start + wo.duration
  
  // Calculate latest start/finish (backward pass)
  project_end = MAX(wo.earliest_finish FOR wo IN work_orders)
  FOR EACH wo IN REVERSE(TopologicalSort(graph)):
    wo.latest_finish = MIN(successor.latest_start FOR successor IN wo.successors) OR project_end
    wo.latest_start = wo.latest_finish - wo.duration
  
  // Identify critical path (slack = 0)
  critical_path = []
  FOR EACH wo IN work_orders:
    wo.slack = wo.latest_start - wo.earliest_start
    IF wo.slack == 0:
      critical_path.APPEND(wo)
  
  RETURN {
    path: critical_path,
    duration: project_end,
    total_slack: SUM(wo.slack FOR wo IN work_orders)
  }
```

---

## 5. UI Model - Component Tree

```
SchedulingModule/
├── ScheduleDashboard/
│   ├── CapacityOverviewPanel/
│   │   ├── CapacitySummaryCards/
│   │   │   ├── TodayCapacityCard { available_hours, scheduled_hours, utilization_pct }
│   │   │   ├── WeekCapacityCard { available_hours, scheduled_hours, utilization_pct }
│   │   │   └── BottleneckAlertCard { work_center, utilization, queue_depth }
│   │   ├── CapacityTrendChart { period: 30d, metrics: [utilization, throughput] }
│   │   └── WorkCenterHeatMap { work_centers[], time_slots[], load_values[][] }
│   │
│   ├── ScheduleTimelinePanel/
│   │   ├── TimelineHeader/
│   │   │   ├── DateRangeSelector { start_date, end_date, presets[] }
│   │   │   ├── ViewToggle { options: [day, week, month] }
│   │   │   └── FilterBar { work_centers[], job_types[], priorities[] }
│   │   ├── GanttChart/
│   │   │   ├── TimelineRuler { scale, markers[] }
│   │   │   ├── WorkCenterLanes[]/
│   │   │   │   ├── LaneHeader { work_center_id, name, status }
│   │   │   │   ├── ScheduledBlocks[]/
│   │   │   │   │   ├── JobBlock { work_order_id, start, end, status, priority }
│   │   │   │   │   │   ├── BlockTooltip { order_id, customer, product, due_date }
│   │   │   │   │   │   └── ProgressIndicator { percent_complete }
│   │   │   │   │   └── MaintenanceBlock { type, start, end }
│   │   │   │   ├── AvailabilityZones { available, unavailable }
│   │   │   │   └── NowIndicator { current_time }
│   │   │   └── DependencyLines { from_block, to_block, type }
│   │   └── UnscheduledJobsPanel/
│   │       ├── JobList/
│   │       │   └── DraggableJobCard { work_order_id, due_date, priority, est_hours }
│   │       └── AutoScheduleButton { action: optimize }
│   │
│   ├── SLARiskPanel/
│   │   ├── RiskSummaryCards/
│   │   │   ├── AtRiskOrdersCount { count, trend }
│   │   │   ├── SLABreachForecast { count_next_24h, count_next_week }
│   │   │   └── OnTimeDeliveryRate { current_pct, target_pct }
│   │   ├── RiskOrdersList/
│   │   │   └── RiskOrderRow { order_id, customer, due_date, risk_score, risk_level }
│   │   │       ├── RiskIndicator { level: GREEN|YELLOW|ORANGE|RED }
│   │   │       ├── RiskFactorsBadges { factors[] }
│   │   │       └── ActionMenu { actions: [expedite, reroute, notify] }
│   │   └── RiskTrendChart { period: 7d, metrics: [at_risk_count, breaches] }
│   │
│   └── QuickActionsPanel/
│       ├── ScheduleJobButton
│       ├── OptimizeScheduleButton
│       ├── AddMaintenanceButton
│       └── RefreshButton
│
├── WorkCenterDetailView/
│   ├── WorkCenterHeader/
│   │   ├── WorkCenterInfo { id, name, type, location }
│   │   ├── StatusBadge { status: AVAILABLE|RUNNING|DOWN|MAINTENANCE }
│   │   └── CapacityMeter { current_load, max_capacity }
│   │
│   ├── WorkCenterTabs/
│   │   ├── ScheduleTab/
│   │   │   ├── DayScheduleTimeline { jobs[], maintenance[] }
│   │   │   ├── QueueList/
│   │   │   │   └── QueuedJobCard { work_order_id, priority, est_start, est_duration }
│   │   │   └── ScheduleStats { jobs_today, hours_scheduled, utilization }
│   │   │
│   │   ├── CapacityTab/
│   │   │   ├── CapacityMetrics/
│   │   │   │   ├── MetricCard { label: "Throughput", value, unit, trend }
│   │   │   │   ├── MetricCard { label: "Efficiency", value, unit, trend }
│   │   │   │   └── MetricCard { label: "OEE", value, unit, trend }
│   │   │   ├── CapacityChart { period: 30d, actual_vs_planned }
│   │   │   └── ConstraintsPanel { constraints[] }
│   │   │
│   │   ├── MaintenanceTab/
│   │   │   ├── UpcomingMaintenanceList/
│   │   │   │   └── MaintenanceCard { type, scheduled_date, duration, impact }
│   │   │   ├── MaintenanceHistory { events[] }
│   │   │   └── ConsumableStatus { blade_life, tool_wear, etc }
│   │   │
│   │   └── PerformanceTab/
│   │       ├── PerformanceCharts/
│   │       │   ├── ThroughputChart { actual, target }
│   │       │   ├── DowntimeChart { planned, unplanned }
│   │       │   └── QualityChart { fpy, scrap_rate }
│   │       └── OperatorPerformance { operators[], metrics[] }
│   │
│   └── WorkCenterActions/
│       ├── EditCapacityButton
│       ├── ScheduleMaintenanceButton
│       └── ViewHistoryButton
│
├── ScheduleOptimizerView/
│   ├── OptimizationControls/
│   │   ├── ObjectiveSelector { options: [minimize_makespan, maximize_throughput, balance_load] }
│   │   ├── ConstraintToggles/
│   │   │   ├── Toggle { label: "Respect due dates", enabled }
│   │   │   ├── Toggle { label: "Batch similar jobs", enabled }
│   │   │   ├── Toggle { label: "Minimize changeovers", enabled }
│   │   │   └── Toggle { label: "Reserve rush capacity", enabled }
│   │   ├── HorizonSelector { days: 1|5|10|30 }
│   │   └── RunOptimizationButton { status: idle|running|complete }
│   │
│   ├── OptimizationResultsPanel/
│   │   ├── BeforeAfterComparison/
│   │   │   ├── MetricRow { label: "Total makespan", before, after, change_pct }
│   │   │   ├── MetricRow { label: "On-time orders", before, after, change_pct }
│   │   │   ├── MetricRow { label: "Changeovers", before, after, change_pct }
│   │   │   └── MetricRow { label: "Load balance", before, after, change_pct }
│   │   ├── ScheduleChangesPreview/
│   │   │   └── ChangeRow { work_order_id, from_wc, to_wc, from_time, to_time }
│   │   └── ApplyChangesButton
│   │
│   └── WhatIfScenarioPanel/
│       ├── ScenarioList/
│       │   └── ScenarioCard { name, parameters, results_summary }
│       ├── CreateScenarioForm/
│       │   ├── CapacityAdjustment { work_center, change_pct }
│       │   ├── DemandAdjustment { change_pct }
│       │   └── RunScenarioButton
│       └── ScenarioComparisonChart { scenarios[], metrics[] }
│
├── DueDateCalculatorView/
│   ├── CalculatorInputs/
│   │   ├── ProductSelector { product_id, product_name }
│   │   ├── QuantityInput { value, unit }
│   │   ├── SpecificationsForm { thickness, width, length, operations[] }
│   │   ├── PrioritySelector { options: [STANDARD, RUSH, HOT] }
│   │   └── CalculateButton
│   │
│   ├── CalculatorResults/
│   │   ├── PromiseDateDisplay { date, confidence_pct }
│   │   ├── ConfidenceGauge { value: 0-100 }
│   │   ├── BreakdownAccordion/
│   │   │   ├── MaterialLeadTime { days }
│   │   │   ├── QueueTime { hours }
│   │   │   ├── ProcessingTime { hours, operations[] }
│   │   │   ├── InspectionTime { hours }
│   │   │   └── ShippingPrep { hours }
│   │   └── RiskFactorsList/
│   │       └── RiskFactorItem { type, severity, description }
│   │
│   └── HistoricalComparison/
│       ├── SimilarOrdersTable { orders[], actual_lead_time, quoted_lead_time }
│       └── LeadTimeDistributionChart { histogram }
│
├── SharedComponents/
│   ├── WorkOrderCard/
│   │   ├── OrderInfo { order_id, customer }
│   │   ├── DueDateBadge { date, days_remaining, status }
│   │   ├── PriorityBadge { priority: STANDARD|RUSH|HOT }
│   │   ├── ProgressBar { percent_complete }
│   │   └── QuickActions { view, edit, expedite }
│   │
│   ├── CapacityIndicator/
│   │   ├── UtilizationBar { current_pct, threshold_warning, threshold_critical }
│   │   └── TrendArrow { direction: up|down|flat }
│   │
│   ├── TimeSlotPicker/
│   │   ├── DatePicker { selected_date }
│   │   ├── TimeRangePicker { start_time, end_time }
│   │   └── AvailabilityIndicator { available: boolean }
│   │
│   ├── DragDropScheduler/
│   │   ├── DraggableJob { job_data, onDragStart, onDragEnd }
│   │   ├── DropZone { work_center, time_slot, onDrop }
│   │   └── ConflictIndicator { has_conflict, conflict_type }
│   │
│   └── AIRecommendationCard/
│       ├── RecommendationHeader { type, confidence }
│       ├── RecommendationBody { description, impact }
│       ├── AcceptButton
│       ├── RejectButton
│       └── ExplainButton { shows_reasoning }
│
└── Modals/
    ├── ScheduleJobModal/
    │   ├── WorkOrderSelector { unscheduled_jobs[] }
    │   ├── WorkCenterSelector { capable_work_centers[] }
    │   ├── TimeSlotSelector { available_slots[] }
    │   ├── ConflictWarning { conflicts[] }
    │   └── ScheduleButton
    │
    ├── RescheduleModal/
    │   ├── CurrentScheduleInfo { work_center, time_slot }
    │   ├── NewScheduleForm { work_center, time_slot }
    │   ├── ImpactAnalysis { affected_jobs[], cascade_effects[] }
    │   └── ConfirmRescheduleButton
    │
    ├── MaintenanceScheduleModal/
    │   ├── WorkCenterSelector
    │   ├── MaintenanceTypeSelector { types: [PM, REPAIR, UPGRADE] }
    │   ├── DurationInput { hours }
    │   ├── TimeSlotSelector
    │   ├── ImpactPreview { jobs_affected, reschedule_suggestions }
    │   └── ScheduleMaintenanceButton
    │
    └── ExpediteOrderModal/
        ├── OrderDetails { order_id, current_due_date, customer }
        ├── NewDueDateInput
        ├── PriorityUpgradeToggle
        ├── ImpactAnalysis/
        │   ├── AffectedOrdersList { orders_bumped[] }
        │   ├── ResourceRequirements { overtime, reassignments }
        │   └── CostEstimate { overtime_cost, expedite_fees }
        └── ConfirmExpediteButton
```

---

*Document generated for AI-build Phase 05: Scheduling & Capacity Model*
