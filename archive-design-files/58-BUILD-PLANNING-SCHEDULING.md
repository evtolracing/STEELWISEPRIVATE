# 58 — Build Planning & Scheduling App

> **Purpose:** Structured models for scheduling UI, work center management, and capacity planning.  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. work_centers

```json
[
  {
    "id": "WC-SLITTER-01",
    "label": "Slitter Line 1",
    "location_id": "LOC-DETROIT-01",
    "division": "metals",
    "capabilities": [
      "slitting",
      "coil_to_coil",
      "edge_conditioning",
      "recoiling"
    ],
    "equipment_specs": {
      "max_width_in": 72,
      "min_width_in": 0.5,
      "max_gauge_in": 0.25,
      "min_gauge_in": 0.010,
      "max_coil_weight_lb": 60000
    },
    "default_shift_hours": [
      { "day": "monday", "start": "06:00", "end": "14:30" },
      { "day": "monday", "start": "14:30", "end": "23:00" },
      { "day": "tuesday", "start": "06:00", "end": "14:30" },
      { "day": "tuesday", "start": "14:30", "end": "23:00" },
      { "day": "wednesday", "start": "06:00", "end": "14:30" },
      { "day": "wednesday", "start": "14:30", "end": "23:00" },
      { "day": "thursday", "start": "06:00", "end": "14:30" },
      { "day": "thursday", "start": "14:30", "end": "23:00" },
      { "day": "friday", "start": "06:00", "end": "14:30" },
      { "day": "friday", "start": "14:30", "end": "23:00" }
    ],
    "capacity_model": {
      "unit": "minutes_per_day",
      "baseline": 960,
      "setup_time_avg_min": 45,
      "changeover_penalty": {
        "gauge_change": 15,
        "width_change": 10,
        "material_change": 30
      }
    }
  },
  {
    "id": "WC-SLITTER-02",
    "label": "Slitter Line 2 (Heavy Gauge)",
    "location_id": "LOC-DETROIT-01",
    "division": "metals",
    "capabilities": [
      "slitting",
      "heavy_gauge",
      "coil_to_coil",
      "edge_conditioning"
    ],
    "equipment_specs": {
      "max_width_in": 60,
      "min_width_in": 1.0,
      "max_gauge_in": 0.500,
      "min_gauge_in": 0.100,
      "max_coil_weight_lb": 80000
    },
    "default_shift_hours": [
      { "day": "monday", "start": "06:00", "end": "14:30" },
      { "day": "monday", "start": "14:30", "end": "23:00" },
      { "day": "tuesday", "start": "06:00", "end": "14:30" },
      { "day": "tuesday", "start": "14:30", "end": "23:00" },
      { "day": "wednesday", "start": "06:00", "end": "14:30" },
      { "day": "wednesday", "start": "14:30", "end": "23:00" },
      { "day": "thursday", "start": "06:00", "end": "14:30" },
      { "day": "thursday", "start": "14:30", "end": "23:00" },
      { "day": "friday", "start": "06:00", "end": "14:30" },
      { "day": "friday", "start": "14:30", "end": "23:00" }
    ],
    "capacity_model": {
      "unit": "minutes_per_day",
      "baseline": 900,
      "setup_time_avg_min": 60,
      "changeover_penalty": {
        "gauge_change": 25,
        "width_change": 15,
        "material_change": 45
      }
    }
  },
  {
    "id": "WC-SHEAR-01",
    "label": "Shear Line 1",
    "location_id": "LOC-DETROIT-01",
    "division": "metals",
    "capabilities": [
      "shearing",
      "cut_to_length",
      "blanking",
      "sheet_leveling"
    ],
    "equipment_specs": {
      "max_width_in": 72,
      "max_length_in": 240,
      "max_gauge_in": 0.250,
      "min_gauge_in": 0.020
    },
    "default_shift_hours": [
      { "day": "monday", "start": "06:00", "end": "14:30" },
      { "day": "tuesday", "start": "06:00", "end": "14:30" },
      { "day": "wednesday", "start": "06:00", "end": "14:30" },
      { "day": "thursday", "start": "06:00", "end": "14:30" },
      { "day": "friday", "start": "06:00", "end": "14:30" }
    ],
    "capacity_model": {
      "unit": "minutes_per_day",
      "baseline": 480,
      "setup_time_avg_min": 20,
      "changeover_penalty": {
        "gauge_change": 10,
        "material_change": 20
      }
    }
  },
  {
    "id": "WC-PLASMA-01",
    "label": "Plasma Table 1",
    "location_id": "LOC-DETROIT-01",
    "division": "metals",
    "capabilities": [
      "plasma_cutting",
      "shape_cutting",
      "plate_processing",
      "beveling"
    ],
    "equipment_specs": {
      "table_width_in": 120,
      "table_length_in": 480,
      "max_thickness_in": 2.0,
      "torch_count": 4
    },
    "default_shift_hours": [
      { "day": "monday", "start": "06:00", "end": "14:30" },
      { "day": "monday", "start": "14:30", "end": "23:00" },
      { "day": "tuesday", "start": "06:00", "end": "14:30" },
      { "day": "tuesday", "start": "14:30", "end": "23:00" },
      { "day": "wednesday", "start": "06:00", "end": "14:30" },
      { "day": "wednesday", "start": "14:30", "end": "23:00" },
      { "day": "thursday", "start": "06:00", "end": "14:30" },
      { "day": "thursday", "start": "14:30", "end": "23:00" },
      { "day": "friday", "start": "06:00", "end": "14:30" }
    ],
    "capacity_model": {
      "unit": "minutes_per_day",
      "baseline": 900,
      "setup_time_avg_min": 30,
      "changeover_penalty": {
        "thickness_change": 15,
        "nest_change": 10
      }
    }
  },
  {
    "id": "WC-SAW-01",
    "label": "Band Saw 1",
    "location_id": "LOC-DETROIT-01",
    "division": "metals",
    "capabilities": [
      "sawing",
      "bar_cutting",
      "structural_cutting",
      "bundle_cutting"
    ],
    "equipment_specs": {
      "max_round_dia_in": 18,
      "max_rect_in": "18x24",
      "blade_width_in": 1.5
    },
    "default_shift_hours": [
      { "day": "monday", "start": "06:00", "end": "14:30" },
      { "day": "tuesday", "start": "06:00", "end": "14:30" },
      { "day": "wednesday", "start": "06:00", "end": "14:30" },
      { "day": "thursday", "start": "06:00", "end": "14:30" },
      { "day": "friday", "start": "06:00", "end": "14:30" }
    ],
    "capacity_model": {
      "unit": "jobs_per_day",
      "baseline": 25,
      "setup_time_avg_min": 10,
      "changeover_penalty": {
        "blade_change": 20,
        "size_change": 5
      }
    }
  },
  {
    "id": "WC-LASER-01",
    "label": "Laser Cutter 1",
    "location_id": "LOC-CHICAGO-01",
    "division": "metals",
    "capabilities": [
      "laser_cutting",
      "precision_cutting",
      "thin_gauge",
      "intricate_shapes"
    ],
    "equipment_specs": {
      "table_width_in": 60,
      "table_length_in": 120,
      "max_thickness_steel_in": 1.0,
      "max_thickness_aluminum_in": 0.5,
      "laser_power_kw": 6
    },
    "default_shift_hours": [
      { "day": "monday", "start": "06:00", "end": "22:00" },
      { "day": "tuesday", "start": "06:00", "end": "22:00" },
      { "day": "wednesday", "start": "06:00", "end": "22:00" },
      { "day": "thursday", "start": "06:00", "end": "22:00" },
      { "day": "friday", "start": "06:00", "end": "22:00" }
    ],
    "capacity_model": {
      "unit": "minutes_per_day",
      "baseline": 900,
      "setup_time_avg_min": 15,
      "changeover_penalty": {
        "material_change": 20,
        "thickness_change": 10,
        "program_change": 5
      }
    }
  },
  {
    "id": "WC-PRESS-01",
    "label": "Press Brake 1",
    "location_id": "LOC-CHICAGO-01",
    "division": "metals",
    "capabilities": [
      "bending",
      "forming",
      "brake_forming",
      "angle_bending"
    ],
    "equipment_specs": {
      "tonnage": 250,
      "bed_length_in": 144,
      "max_gauge_in": 0.375
    },
    "default_shift_hours": [
      { "day": "monday", "start": "06:00", "end": "14:30" },
      { "day": "tuesday", "start": "06:00", "end": "14:30" },
      { "day": "wednesday", "start": "06:00", "end": "14:30" },
      { "day": "thursday", "start": "06:00", "end": "14:30" },
      { "day": "friday", "start": "06:00", "end": "14:30" }
    ],
    "capacity_model": {
      "unit": "jobs_per_day",
      "baseline": 15,
      "setup_time_avg_min": 25,
      "changeover_penalty": {
        "tooling_change": 30,
        "program_change": 10
      }
    }
  },
  {
    "id": "WC-ROUTER-01",
    "label": "CNC Router 1",
    "location_id": "LOC-DETROIT-01",
    "division": "plastics",
    "capabilities": [
      "routing",
      "sheet_cutting",
      "drilling",
      "edge_finishing",
      "engraving"
    ],
    "equipment_specs": {
      "table_width_in": 60,
      "table_length_in": 120,
      "max_thickness_in": 4.0,
      "spindle_speed_rpm": 24000
    },
    "default_shift_hours": [
      { "day": "monday", "start": "07:00", "end": "15:30" },
      { "day": "tuesday", "start": "07:00", "end": "15:30" },
      { "day": "wednesday", "start": "07:00", "end": "15:30" },
      { "day": "thursday", "start": "07:00", "end": "15:30" },
      { "day": "friday", "start": "07:00", "end": "15:30" }
    ],
    "capacity_model": {
      "unit": "minutes_per_day",
      "baseline": 480,
      "setup_time_avg_min": 20,
      "changeover_penalty": {
        "material_change": 15,
        "tooling_change": 25,
        "program_change": 10
      }
    }
  },
  {
    "id": "WC-THERMO-01",
    "label": "Thermoformer 1",
    "location_id": "LOC-DETROIT-01",
    "division": "plastics",
    "capabilities": [
      "thermoforming",
      "vacuum_forming",
      "pressure_forming",
      "drape_forming"
    ],
    "equipment_specs": {
      "forming_area_in": "48x72",
      "max_sheet_thickness_in": 0.5,
      "heater_zones": 12
    },
    "default_shift_hours": [
      { "day": "monday", "start": "07:00", "end": "15:30" },
      { "day": "tuesday", "start": "07:00", "end": "15:30" },
      { "day": "wednesday", "start": "07:00", "end": "15:30" },
      { "day": "thursday", "start": "07:00", "end": "15:30" },
      { "day": "friday", "start": "07:00", "end": "15:30" }
    ],
    "capacity_model": {
      "unit": "jobs_per_day",
      "baseline": 8,
      "setup_time_avg_min": 45,
      "changeover_penalty": {
        "mold_change": 60,
        "material_change": 30,
        "temperature_change": 20
      }
    }
  },
  {
    "id": "WC-LATHE-01",
    "label": "CNC Lathe 1",
    "location_id": "LOC-CHICAGO-01",
    "division": "plastics",
    "capabilities": [
      "turning",
      "facing",
      "boring",
      "threading",
      "rod_machining"
    ],
    "equipment_specs": {
      "max_diameter_in": 12,
      "max_length_in": 48,
      "spindle_speed_rpm": 4000
    },
    "default_shift_hours": [
      { "day": "monday", "start": "07:00", "end": "15:30" },
      { "day": "tuesday", "start": "07:00", "end": "15:30" },
      { "day": "wednesday", "start": "07:00", "end": "15:30" },
      { "day": "thursday", "start": "07:00", "end": "15:30" },
      { "day": "friday", "start": "07:00", "end": "15:30" }
    ],
    "capacity_model": {
      "unit": "minutes_per_day",
      "baseline": 480,
      "setup_time_avg_min": 30,
      "changeover_penalty": {
        "tooling_change": 25,
        "material_change": 15,
        "program_change": 10
      }
    }
  },
  {
    "id": "WC-WATERJET-01",
    "label": "Waterjet 1",
    "location_id": "LOC-CHICAGO-01",
    "division": "metals",
    "capabilities": [
      "waterjet_cutting",
      "precision_cutting",
      "thick_plate",
      "no_heat_affected_zone",
      "multi_material"
    ],
    "equipment_specs": {
      "table_width_in": 72,
      "table_length_in": 144,
      "max_thickness_in": 8.0,
      "pressure_psi": 60000,
      "heads": 2
    },
    "default_shift_hours": [
      { "day": "monday", "start": "06:00", "end": "14:30" },
      { "day": "monday", "start": "14:30", "end": "23:00" },
      { "day": "tuesday", "start": "06:00", "end": "14:30" },
      { "day": "tuesday", "start": "14:30", "end": "23:00" },
      { "day": "wednesday", "start": "06:00", "end": "14:30" },
      { "day": "wednesday", "start": "14:30", "end": "23:00" },
      { "day": "thursday", "start": "06:00", "end": "14:30" },
      { "day": "thursday", "start": "14:30", "end": "23:00" },
      { "day": "friday", "start": "06:00", "end": "14:30" }
    ],
    "capacity_model": {
      "unit": "minutes_per_day",
      "baseline": 900,
      "setup_time_avg_min": 20,
      "changeover_penalty": {
        "material_change": 15,
        "thickness_change": 10,
        "abrasive_change": 30
      }
    }
  },
  {
    "id": "WC-LEVELER-01",
    "label": "Precision Leveler 1",
    "location_id": "LOC-DETROIT-01",
    "division": "metals",
    "capabilities": [
      "leveling",
      "flattening",
      "stress_relieving",
      "coil_to_sheet"
    ],
    "equipment_specs": {
      "max_width_in": 72,
      "max_gauge_in": 0.250,
      "min_gauge_in": 0.020,
      "roller_count": 21
    },
    "default_shift_hours": [
      { "day": "monday", "start": "06:00", "end": "14:30" },
      { "day": "tuesday", "start": "06:00", "end": "14:30" },
      { "day": "wednesday", "start": "06:00", "end": "14:30" },
      { "day": "thursday", "start": "06:00", "end": "14:30" },
      { "day": "friday", "start": "06:00", "end": "14:30" }
    ],
    "capacity_model": {
      "unit": "tons_per_day",
      "baseline": 50,
      "setup_time_avg_min": 30,
      "changeover_penalty": {
        "gauge_change": 20,
        "width_change": 15
      }
    }
  }
]
```

---

## 2. scheduling_board_model

```json
{
  "views": [
    {
      "id": "timeline_by_work_center",
      "type": "timeline",
      "label": "Work Center Timeline",
      "description": "Gantt-style view grouped by work center showing job blocks on time axis",
      "group_by": "work_center_id",
      "secondary_group": "shift",
      "time_scale": {
        "default": "hours",
        "options": ["hours", "days", "weeks"],
        "snap_to": "15min"
      },
      "time_range": {
        "default_past_hours": 4,
        "default_future_hours": 72,
        "max_range_days": 30
      },
      "card_fields": [
        { "field": "job_id", "position": "header", "truncate": false },
        { "field": "customer_name", "position": "line1", "truncate": 20 },
        { "field": "material_description", "position": "line2", "truncate": 25 },
        { "field": "quantity_display", "position": "line3", "truncate": false },
        { "field": "sla_risk", "position": "badge_right", "type": "icon" },
        { "field": "status", "position": "badge_left", "type": "status_chip" },
        { "field": "estimated_duration", "position": "subtext", "format": "duration" }
      ],
      "card_sizing": {
        "width_source": "estimated_duration",
        "min_width_px": 80,
        "height_px": 60
      },
      "interactions": {
        "drag_drop": true,
        "resize": true,
        "click_to_detail": true,
        "right_click_menu": ["reschedule", "split", "hold", "cancel", "view_order"]
      },
      "filters": [
        { "field": "location_id", "type": "multi_select", "default": "current_location" },
        { "field": "division", "type": "toggle", "options": ["metals", "plastics", "all"] },
        { "field": "status", "type": "multi_select", "default": ["SCHEDULED", "IN_PROCESS"] },
        { "field": "sla_risk", "type": "multi_select", "default": "all" },
        { "field": "customer_id", "type": "search", "optional": true }
      ],
      "indicators": {
        "current_time_line": true,
        "shift_boundaries": true,
        "capacity_overlay": true,
        "maintenance_blocks": true
      }
    },
    {
      "id": "kanban_by_due_date",
      "type": "kanban",
      "label": "Due Date Board",
      "description": "Kanban columns based on due date urgency",
      "columns": [
        { "id": "overdue", "label": "Overdue", "filter": "due_date < today", "color": "#F44336", "sort": "due_date_asc" },
        { "id": "today", "label": "Due Today", "filter": "due_date == today", "color": "#FF9800", "sort": "due_time_asc" },
        { "id": "tomorrow", "label": "Tomorrow", "filter": "due_date == today + 1", "color": "#FFC107", "sort": "due_time_asc" },
        { "id": "this_week", "label": "This Week", "filter": "due_date > today + 1 AND due_date <= end_of_week", "color": "#4CAF50", "sort": "due_date_asc" },
        { "id": "next_week", "label": "Next Week", "filter": "due_date > end_of_week AND due_date <= end_of_next_week", "color": "#2196F3", "sort": "due_date_asc" },
        { "id": "later", "label": "Later", "filter": "due_date > end_of_next_week", "color": "#9E9E9E", "sort": "due_date_asc" }
      ],
      "card_fields": [
        { "field": "job_id", "position": "header" },
        { "field": "customer_name", "position": "line1" },
        { "field": "work_center_label", "position": "line2" },
        { "field": "estimated_duration", "position": "chip" },
        { "field": "status", "position": "status_badge" },
        { "field": "sla_risk", "position": "corner_icon" }
      ],
      "interactions": {
        "drag_between_columns": false,
        "click_to_detail": true,
        "quick_actions": ["assign_work_center", "change_priority", "view_order"]
      },
      "column_metrics": {
        "show_count": true,
        "show_total_hours": true,
        "show_capacity_warning": true
      }
    },
    {
      "id": "capacity_heatmap",
      "type": "heatmap",
      "label": "Capacity Overview",
      "description": "Color-coded grid showing utilization by work center and day",
      "x_axis": "date",
      "y_axis": "work_center_id",
      "cell_value": "utilization_percent",
      "color_scale": [
        { "range": [0, 50], "color": "#E8F5E9", "label": "Under-utilized" },
        { "range": [50, 80], "color": "#C8E6C9", "label": "Normal" },
        { "range": [80, 95], "color": "#FFF9C4", "label": "Near Capacity" },
        { "range": [95, 100], "color": "#FFCC80", "label": "At Capacity" },
        { "range": [100, 999], "color": "#EF9A9A", "label": "Over Capacity" }
      ],
      "cell_tooltip": [
        "scheduled_hours",
        "available_hours",
        "job_count",
        "largest_job"
      ],
      "interactions": {
        "click_to_timeline": true,
        "hover_detail": true
      },
      "time_range": {
        "default_days": 14,
        "max_days": 60
      }
    },
    {
      "id": "unscheduled_queue",
      "type": "list",
      "label": "Unscheduled Jobs",
      "description": "Jobs awaiting scheduling, sortable and filterable",
      "default_sort": [
        { "field": "requested_date", "direction": "asc" },
        { "field": "priority", "direction": "desc" }
      ],
      "columns": [
        { "field": "job_id", "label": "Job", "width": 100, "sortable": true },
        { "field": "customer_name", "label": "Customer", "width": 150, "sortable": true },
        { "field": "material_description", "label": "Material", "width": 200, "sortable": true },
        { "field": "quantity_display", "label": "Qty", "width": 80, "sortable": true },
        { "field": "requested_date", "label": "Requested", "width": 100, "sortable": true, "format": "date" },
        { "field": "estimated_duration", "label": "Est. Time", "width": 80, "sortable": true, "format": "duration" },
        { "field": "required_capabilities", "label": "Capabilities", "width": 150, "type": "chip_list" },
        { "field": "priority", "label": "Priority", "width": 80, "sortable": true, "type": "priority_badge" },
        { "field": "days_waiting", "label": "Waiting", "width": 80, "sortable": true, "format": "days" }
      ],
      "row_actions": [
        { "id": "schedule_now", "label": "Schedule", "icon": "calendar_add" },
        { "id": "auto_schedule", "label": "Auto-Schedule", "icon": "auto_fix" },
        { "id": "view_detail", "label": "Details", "icon": "info" }
      ],
      "bulk_actions": [
        { "id": "auto_schedule_selected", "label": "Auto-Schedule Selected" },
        { "id": "assign_work_center", "label": "Assign Work Center" },
        { "id": "set_priority", "label": "Set Priority" }
      ],
      "filters": [
        { "field": "location_id", "type": "multi_select" },
        { "field": "division", "type": "toggle" },
        { "field": "capability_required", "type": "multi_select" },
        { "field": "customer_id", "type": "search" },
        { "field": "priority", "type": "multi_select" }
      ]
    },
    {
      "id": "location_overview",
      "type": "multi_location_dashboard",
      "label": "All Locations",
      "description": "Summary cards for each location showing key metrics and alerts",
      "location_card_fields": [
        { "field": "location_name", "position": "header" },
        { "field": "jobs_in_process", "position": "metric", "label": "In Process" },
        { "field": "jobs_scheduled_today", "position": "metric", "label": "Today" },
        { "field": "overdue_count", "position": "alert_metric", "label": "Overdue" },
        { "field": "capacity_utilization", "position": "gauge", "label": "Capacity" },
        { "field": "sla_at_risk_count", "position": "warning_metric", "label": "At Risk" }
      ],
      "interactions": {
        "click_to_location_timeline": true,
        "expand_work_centers": true
      },
      "refresh_interval_seconds": 60
    }
  ],
  "global_actions": [
    { "id": "auto_optimize", "label": "Optimize Schedule", "icon": "auto_awesome", "confirm": true },
    { "id": "publish_schedule", "label": "Publish to Shop Floor", "icon": "publish", "confirm": true },
    { "id": "simulate_changes", "label": "Simulate", "icon": "science" },
    { "id": "export_schedule", "label": "Export", "icon": "download", "formats": ["pdf", "excel", "csv"] }
  ],
  "real_time_updates": {
    "enabled": true,
    "websocket_topics": [
      "schedule.updated",
      "operation.started",
      "operation.completed",
      "job.status_changed",
      "capacity.changed"
    ],
    "update_animation": "highlight_flash"
  }
}
```

---

## 3. due_date_algorithm

```pseudocode
FUNCTION calculate_earliest_due_date(job, location_constraints):
    INPUT:
        job: {
            required_capabilities: [string],
            estimated_duration_minutes: number,
            material_available_date: date,
            priority: "rush" | "standard" | "economy",
            customer_id: string,
            location_preference: string | null
        }
        location_constraints: {
            allowed_locations: [string] | "any",
            max_transfer_days: number
        }

    OUTPUT:
        {
            earliest_date: datetime,
            recommended_work_center: string,
            confidence: "high" | "medium" | "low",
            alternatives: [{ work_center, date, utilization }]
        }

    // Step 1: Find eligible work centers
    eligible_work_centers = []
    FOR each work_center IN all_work_centers:
        IF work_center.capabilities CONTAINS ALL job.required_capabilities:
            IF location_constraints.allowed_locations == "any" OR 
               work_center.location_id IN location_constraints.allowed_locations:
                eligible_work_centers.APPEND(work_center)

    IF eligible_work_centers IS EMPTY:
        RETURN { error: "no_capable_work_center", message: "No work center has required capabilities" }

    // Step 2: Calculate material availability considering transfers
    FOR each work_center IN eligible_work_centers:
        IF job.material_location != work_center.location_id:
            transfer_days = get_transfer_time(job.material_location, work_center.location_id)
            work_center.material_ready = MAX(job.material_available_date, today + transfer_days)
        ELSE:
            work_center.material_ready = job.material_available_date

    // Step 3: Find earliest available slot for each work center
    candidates = []
    FOR each work_center IN eligible_work_centers:
        search_start = MAX(work_center.material_ready, now)
        search_end = search_start + 30 days  // Look ahead window

        available_slots = get_available_capacity_slots(
            work_center.id,
            search_start,
            search_end,
            job.estimated_duration_minutes
        )

        FOR each slot IN available_slots:
            // Calculate setup time based on previous job
            previous_job = get_job_before(work_center.id, slot.start_time)
            setup_time = calculate_setup_time(previous_job, job, work_center)
            
            effective_start = slot.start_time + setup_time
            effective_end = effective_start + job.estimated_duration_minutes
            
            // Check if job fits within slot considering setup
            IF effective_end <= slot.end_time:
                utilization = get_utilization_for_day(work_center.id, slot.date)
                candidates.APPEND({
                    work_center_id: work_center.id,
                    work_center_label: work_center.label,
                    location_id: work_center.location_id,
                    start_time: effective_start,
                    end_time: effective_end,
                    completion_date: date_of(effective_end),
                    setup_time: setup_time,
                    utilization_after: utilization + (job.estimated_duration_minutes / work_center.capacity_model.baseline),
                    score: 0  // Will calculate below
                })
                BREAK  // Found first available slot for this work center

    IF candidates IS EMPTY:
        RETURN { error: "no_capacity", message: "No available capacity within 30 days" }

    // Step 4: Score and rank candidates
    FOR each candidate IN candidates:
        score = 0
        
        // Earlier is better (max 40 points)
        days_from_now = (candidate.completion_date - today).days
        score += MAX(0, 40 - (days_from_now * 2))
        
        // Lower utilization is better (max 20 points)
        score += (1 - candidate.utilization_after) * 20
        
        // Lower setup time is better (max 15 points)
        score += MAX(0, 15 - (candidate.setup_time / 10))
        
        // Location preference bonus (10 points)
        IF job.location_preference == candidate.location_id:
            score += 10
        
        // Same location as material avoids transfer (15 points)
        IF job.material_location == candidate.location_id:
            score += 15
        
        candidate.score = score

    // Step 5: Sort by score and return
    candidates.SORT_BY(score, descending)
    
    best = candidates[0]
    alternatives = candidates[1:5]  // Top 4 alternatives

    // Determine confidence based on how much better best option is
    IF candidates.LENGTH == 1:
        confidence = "low"  // No alternatives
    ELSE IF best.score - candidates[1].score > 15:
        confidence = "high"
    ELSE:
        confidence = "medium"

    RETURN {
        earliest_date: best.completion_date,
        earliest_start: best.start_time,
        recommended_work_center: best.work_center_id,
        recommended_location: best.location_id,
        estimated_setup_minutes: best.setup_time,
        utilization_impact: best.utilization_after,
        confidence: confidence,
        alternatives: alternatives.MAP(a => {
            work_center: a.work_center_id,
            location: a.location_id,
            date: a.completion_date,
            utilization: a.utilization_after
        })
    }


FUNCTION get_available_capacity_slots(work_center_id, start_date, end_date, required_minutes):
    slots = []
    
    FOR each day IN date_range(start_date, end_date):
        shift_schedule = get_shift_schedule(work_center_id, day)
        scheduled_jobs = get_scheduled_jobs(work_center_id, day)
        maintenance_blocks = get_maintenance_blocks(work_center_id, day)
        
        FOR each shift IN shift_schedule:
            available_minutes = shift.duration_minutes
            
            // Subtract scheduled jobs
            FOR each job IN scheduled_jobs:
                IF job.overlaps(shift):
                    available_minutes -= job.overlap_minutes(shift)
            
            // Subtract maintenance
            FOR each block IN maintenance_blocks:
                IF block.overlaps(shift):
                    available_minutes -= block.overlap_minutes(shift)
            
            IF available_minutes >= required_minutes:
                // Find contiguous free time within shift
                free_windows = find_free_windows(shift, scheduled_jobs, maintenance_blocks)
                FOR each window IN free_windows:
                    IF window.duration >= required_minutes:
                        slots.APPEND({
                            date: day,
                            start_time: window.start,
                            end_time: window.end,
                            available_minutes: window.duration
                        })
    
    RETURN slots


FUNCTION calculate_setup_time(previous_job, next_job, work_center):
    IF previous_job IS NULL:
        RETURN work_center.capacity_model.setup_time_avg_min
    
    total_setup = 0
    changeover_penalties = work_center.capacity_model.changeover_penalty
    
    IF previous_job.material_type != next_job.material_type:
        total_setup += changeover_penalties.material_change OR 0
    
    IF previous_job.gauge != next_job.gauge:
        total_setup += changeover_penalties.gauge_change OR 0
    
    IF previous_job.width != next_job.width:
        total_setup += changeover_penalties.width_change OR 0
    
    IF previous_job.thickness != next_job.thickness:
        total_setup += changeover_penalties.thickness_change OR 0
    
    IF previous_job.tooling_id != next_job.tooling_id:
        total_setup += changeover_penalties.tooling_change OR 0
    
    // Minimum setup time even if no changes
    RETURN MAX(total_setup, 5)
```

---

## 4. sla_risk_model

```pseudocode
FUNCTION calculate_sla_risk(job, current_time, schedule):
    INPUT:
        job: {
            id: string,
            status: string,
            promise_date: datetime,
            estimated_completion: datetime,
            scheduled_start: datetime,
            scheduled_end: datetime,
            estimated_duration_minutes: number,
            priority: string,
            work_center_id: string,
            remaining_operations: number
        }
        current_time: datetime
        schedule: {
            work_center_utilization: { [work_center_id]: number },
            jobs_ahead_in_queue: number,
            equipment_status: { [work_center_id]: "up" | "down" | "maintenance" }
        }

    OUTPUT:
        {
            risk_level: "green" | "yellow" | "red" | "black",
            risk_score: number,  // 0-100
            reasons: [string],
            recommended_actions: [string],
            time_buffer_minutes: number,
            probability_on_time: number  // 0-1
        }

    reasons = []
    actions = []
    risk_score = 0

    // Calculate time remaining until promise date
    time_to_promise = (job.promise_date - current_time).total_minutes
    
    // Calculate estimated time to complete
    IF job.status == "IN_PROCESS":
        // Job already started - use actual progress
        actual_elapsed = (current_time - job.actual_start).total_minutes
        progress_percent = get_job_progress(job.id)
        IF progress_percent > 0:
            projected_total = actual_elapsed / progress_percent
            remaining_time = projected_total - actual_elapsed
        ELSE:
            remaining_time = job.estimated_duration_minutes
    ELSE IF job.status == "SCHEDULED":
        // Not started yet
        time_until_start = (job.scheduled_start - current_time).total_minutes
        remaining_time = time_until_start + job.estimated_duration_minutes
    ELSE:
        // WAITING_QC, PACKAGING, etc.
        remaining_time = get_remaining_time_for_status(job.status)

    // Add buffer for additional operations
    IF job.remaining_operations > 1:
        operation_buffer = (job.remaining_operations - 1) * 60  // 1 hour per operation
        remaining_time += operation_buffer
        reasons.APPEND("Multiple operations remaining")

    // Add buffer for shipping/staging
    shipping_buffer = 120  // 2 hours for packaging + staging
    remaining_time += shipping_buffer

    // Calculate buffer (positive = ahead, negative = behind)
    time_buffer = time_to_promise - remaining_time

    // ----- RISK FACTOR 1: Time Buffer -----
    IF time_buffer < 0:
        // Already behind
        risk_score += 50
        reasons.APPEND(f"Behind schedule by {ABS(time_buffer)} minutes")
        actions.APPEND("Expedite immediately")
    ELSE IF time_buffer < 60:
        // Less than 1 hour buffer
        risk_score += 35
        reasons.APPEND("Less than 1 hour buffer")
        actions.APPEND("Monitor closely")
    ELSE IF time_buffer < 240:
        // Less than 4 hours buffer
        risk_score += 20
        reasons.APPEND("Limited time buffer")
    ELSE IF time_buffer < 480:
        // Less than 8 hours buffer
        risk_score += 10

    // ----- RISK FACTOR 2: Work Center Status -----
    IF job.work_center_id IN schedule.equipment_status:
        wc_status = schedule.equipment_status[job.work_center_id]
        IF wc_status == "down":
            risk_score += 30
            reasons.APPEND("Assigned work center is down")
            actions.APPEND("Reassign to alternate work center")
        ELSE IF wc_status == "maintenance":
            risk_score += 15
            reasons.APPEND("Work center has scheduled maintenance")
            actions.APPEND("Verify maintenance window doesn't conflict")

    // ----- RISK FACTOR 3: Utilization -----
    IF job.work_center_id IN schedule.work_center_utilization:
        utilization = schedule.work_center_utilization[job.work_center_id]
        IF utilization > 1.0:
            risk_score += 25
            reasons.APPEND("Work center is over capacity")
            actions.APPEND("Consider workload balancing")
        ELSE IF utilization > 0.95:
            risk_score += 15
            reasons.APPEND("Work center at near capacity")
        ELSE IF utilization > 0.85:
            risk_score += 5

    // ----- RISK FACTOR 4: Queue Position -----
    IF schedule.jobs_ahead_in_queue > 5:
        risk_score += 10
        reasons.APPEND(f"{schedule.jobs_ahead_in_queue} jobs ahead in queue")
    ELSE IF schedule.jobs_ahead_in_queue > 10:
        risk_score += 20
        reasons.APPEND("Large queue ahead")
        actions.APPEND("Consider priority escalation")

    // ----- RISK FACTOR 5: Historical Performance -----
    work_center_late_rate = get_late_rate(job.work_center_id, last_30_days)
    IF work_center_late_rate > 0.2:
        risk_score += 15
        reasons.APPEND(f"Work center has {work_center_late_rate*100}% late rate")

    // ----- RISK FACTOR 6: Material Status -----
    IF job.material_status == "not_received":
        risk_score += 25
        reasons.APPEND("Material not yet received")
        actions.APPEND("Expedite material receipt")
    ELSE IF job.material_status == "pending_inspection":
        risk_score += 10
        reasons.APPEND("Material awaiting inspection")

    // ----- RISK FACTOR 7: Priority Consideration -----
    IF job.priority == "rush":
        // Rush jobs get more aggressive risk thresholds
        risk_score = risk_score * 1.2
    ELSE IF job.priority == "economy":
        // Economy jobs have more tolerance
        risk_score = risk_score * 0.8

    // ----- Calculate Final Risk Level -----
    risk_score = MIN(100, risk_score)
    
    IF risk_score >= 70 OR time_buffer < -60:
        risk_level = "black"  // Critical - will miss SLA
        probability_on_time = MAX(0, 0.2 - (risk_score - 70) * 0.005)
    ELSE IF risk_score >= 50 OR time_buffer < 0:
        risk_level = "red"  // High risk
        probability_on_time = 0.2 + (70 - risk_score) * 0.01
    ELSE IF risk_score >= 25 OR time_buffer < 120:
        risk_level = "yellow"  // Medium risk - needs attention
        probability_on_time = 0.6 + (50 - risk_score) * 0.008
    ELSE:
        risk_level = "green"  // On track
        probability_on_time = 0.9 + (25 - risk_score) * 0.004

    probability_on_time = MIN(0.99, MAX(0.01, probability_on_time))

    // Add default action if none specified
    IF actions IS EMPTY:
        IF risk_level == "green":
            actions.APPEND("Continue as scheduled")
        ELSE IF risk_level == "yellow":
            actions.APPEND("Review schedule for optimization")

    RETURN {
        risk_level: risk_level,
        risk_score: ROUND(risk_score, 0),
        reasons: reasons,
        recommended_actions: actions,
        time_buffer_minutes: ROUND(time_buffer, 0),
        probability_on_time: ROUND(probability_on_time, 2),
        estimated_completion: current_time + remaining_time,
        promise_date: job.promise_date
    }


FUNCTION aggregate_risk_summary(jobs, current_time, schedule):
    // Aggregate risk for dashboard widgets
    summary = {
        total_jobs: jobs.LENGTH,
        green: 0,
        yellow: 0,
        red: 0,
        black: 0,
        high_risk_jobs: [],
        at_risk_revenue: 0,
        at_risk_customers: SET()
    }
    
    FOR each job IN jobs:
        risk = calculate_sla_risk(job, current_time, schedule)
        
        summary[risk.risk_level] += 1
        
        IF risk.risk_level IN ["red", "black"]:
            summary.high_risk_jobs.APPEND({
                job_id: job.id,
                customer: job.customer_name,
                promise_date: job.promise_date,
                risk_level: risk.risk_level,
                primary_reason: risk.reasons[0],
                recommended_action: risk.recommended_actions[0]
            })
            summary.at_risk_revenue += job.line_value
            summary.at_risk_customers.ADD(job.customer_id)
    
    RETURN summary
```

---

## 5. UI_elements

```json
{
  "risk_indicators": {
    "sla_risk_badge": {
      "green": {
        "icon": "check_circle",
        "color": "#4CAF50",
        "background": "#E8F5E9",
        "label": "On Track",
        "tooltip": "Job is on schedule with adequate buffer"
      },
      "yellow": {
        "icon": "warning",
        "color": "#FF9800",
        "background": "#FFF3E0",
        "label": "At Risk",
        "tooltip": "Job may miss SLA without intervention"
      },
      "red": {
        "icon": "error",
        "color": "#F44336",
        "background": "#FFEBEE",
        "label": "High Risk",
        "tooltip": "Job likely to miss SLA - action required"
      },
      "black": {
        "icon": "crisis_alert",
        "color": "#212121",
        "background": "#424242",
        "label": "Critical",
        "tooltip": "Job will miss SLA - immediate escalation required"
      }
    },
    "time_buffer_display": {
      "format": "signed_duration",
      "positive_color": "#4CAF50",
      "negative_color": "#F44336",
      "zero_color": "#FF9800"
    }
  },
  "status_chips": {
    "ORDERED": { "color": "#9E9E9E", "variant": "outlined", "label": "Ordered" },
    "RECEIVED": { "color": "#2196F3", "variant": "filled", "label": "Received" },
    "SCHEDULED": { "color": "#9C27B0", "variant": "filled", "label": "Scheduled" },
    "IN_PROCESS": { "color": "#FF9800", "variant": "filled", "label": "In Process" },
    "WAITING_QC": { "color": "#FFC107", "variant": "filled", "label": "QC Wait" },
    "PACKAGING": { "color": "#00BCD4", "variant": "filled", "label": "Packaging" },
    "READY_TO_SHIP": { "color": "#03A9F4", "variant": "filled", "label": "Ready" },
    "SHIPPED": { "color": "#4CAF50", "variant": "filled", "label": "Shipped" },
    "ON_HOLD": { "color": "#F44336", "variant": "outlined", "label": "On Hold" },
    "NCR_PENDING": { "color": "#E91E63", "variant": "outlined", "label": "NCR" }
  },
  "priority_badges": {
    "rush": { "icon": "bolt", "color": "#F44336", "label": "RUSH", "pulsing": true },
    "hot": { "icon": "local_fire_department", "color": "#FF5722", "label": "HOT", "pulsing": false },
    "standard": { "icon": null, "color": null, "label": null, "pulsing": false },
    "economy": { "icon": "schedule", "color": "#9E9E9E", "label": "ECO", "pulsing": false }
  },
  "capacity_indicators": {
    "utilization_gauge": {
      "type": "linear_progress",
      "thresholds": [
        { "max": 50, "color": "#E8F5E9", "label": "Low" },
        { "max": 80, "color": "#C8E6C9", "label": "Normal" },
        { "max": 95, "color": "#FFF9C4", "label": "High" },
        { "max": 100, "color": "#FFCC80", "label": "Full" },
        { "max": 999, "color": "#EF9A9A", "label": "Over" }
      ]
    },
    "overload_banner": {
      "icon": "warning_amber",
      "color": "#FF9800",
      "background": "#FFF3E0",
      "message_template": "{work_center} is {percent}% over capacity on {date}"
    },
    "underload_indicator": {
      "icon": "trending_down",
      "color": "#2196F3",
      "message_template": "{work_center} has {hours}h available on {date}"
    }
  },
  "timeline_elements": {
    "job_card": {
      "border_radius": 4,
      "default_height": 60,
      "min_width": 80,
      "colors_by_status": {
        "SCHEDULED": { "background": "#E1BEE7", "border": "#9C27B0" },
        "IN_PROCESS": { "background": "#FFE0B2", "border": "#FF9800" },
        "WAITING_QC": { "background": "#FFF9C4", "border": "#FFC107" },
        "PACKAGING": { "background": "#B2EBF2", "border": "#00BCD4" }
      },
      "hover_elevation": 4,
      "selected_border_width": 2,
      "drag_opacity": 0.7
    },
    "current_time_line": {
      "color": "#F44336",
      "width": 2,
      "style": "solid",
      "label": "NOW"
    },
    "shift_boundaries": {
      "color": "#BDBDBD",
      "width": 1,
      "style": "dashed",
      "label_position": "top"
    },
    "maintenance_block": {
      "background": "#FFCDD2",
      "pattern": "diagonal_stripes",
      "opacity": 0.6,
      "icon": "build"
    },
    "break_period": {
      "background": "#E0E0E0",
      "pattern": "dots",
      "opacity": 0.4
    }
  },
  "drag_drop_feedback": {
    "valid_drop": {
      "cursor": "grab",
      "highlight_color": "#C8E6C9",
      "border_color": "#4CAF50"
    },
    "invalid_drop": {
      "cursor": "not-allowed",
      "highlight_color": "#FFCDD2",
      "border_color": "#F44336"
    },
    "conflict_detected": {
      "icon": "error_outline",
      "tooltip": "Conflicts with existing job",
      "highlight_color": "#FFF9C4"
    },
    "capacity_warning": {
      "icon": "warning",
      "tooltip": "Will exceed capacity",
      "highlight_color": "#FFE0B2"
    }
  },
  "empty_states": {
    "no_jobs_scheduled": {
      "icon": "event_available",
      "message": "No jobs scheduled for this period",
      "action": "View unscheduled queue"
    },
    "work_center_offline": {
      "icon": "power_off",
      "message": "Work center is offline",
      "color": "#9E9E9E"
    },
    "all_caught_up": {
      "icon": "celebration",
      "message": "All jobs on schedule!",
      "color": "#4CAF50"
    }
  },
  "notification_toasts": {
    "job_rescheduled": {
      "icon": "update",
      "color": "#2196F3",
      "duration_ms": 4000
    },
    "conflict_resolved": {
      "icon": "check",
      "color": "#4CAF50",
      "duration_ms": 3000
    },
    "schedule_published": {
      "icon": "publish",
      "color": "#4CAF50",
      "duration_ms": 5000
    },
    "optimization_complete": {
      "icon": "auto_awesome",
      "color": "#9C27B0",
      "duration_ms": 5000
    }
  },
  "keyboard_shortcuts": [
    { "key": "Ctrl+S", "action": "save_schedule", "label": "Save Schedule" },
    { "key": "Ctrl+Z", "action": "undo", "label": "Undo" },
    { "key": "Ctrl+Shift+Z", "action": "redo", "label": "Redo" },
    { "key": "Delete", "action": "remove_from_schedule", "label": "Remove Job" },
    { "key": "Space", "action": "toggle_job_detail", "label": "Toggle Details" },
    { "key": "1-4", "action": "set_view", "label": "Switch View" },
    { "key": "T", "action": "go_to_today", "label": "Go to Today" },
    { "key": "F", "action": "toggle_filters", "label": "Toggle Filters" },
    { "key": "?", "action": "show_help", "label": "Keyboard Help" }
  ],
  "accessibility": {
    "aria_labels": {
      "timeline_region": "Scheduling timeline grouped by work center",
      "job_card": "Job {job_id} for {customer}, status {status}, risk level {risk_level}",
      "capacity_gauge": "Capacity utilization at {percent} percent"
    },
    "focus_indicators": {
      "outline_width": 2,
      "outline_color": "#1976D2",
      "outline_offset": 2
    },
    "reduced_motion": {
      "disable_animations": true,
      "instant_transitions": true
    }
  }
}
```

---

## 6. Location Hierarchy Model

```json
{
  "locations": [
    {
      "id": "LOC-DETROIT-01",
      "label": "Detroit Main",
      "division": "midwest",
      "address": {
        "city": "Detroit",
        "state": "MI"
      },
      "work_centers": ["WC-SLITTER-01", "WC-SLITTER-02", "WC-SHEAR-01", "WC-PLASMA-01", "WC-SAW-01", "WC-ROUTER-01", "WC-THERMO-01", "WC-LEVELER-01"],
      "default_ship_days_to": {
        "LOC-CHICAGO-01": 1,
        "LOC-CLEVELAND-01": 1,
        "LOC-INDIANAPOLIS-01": 1
      },
      "timezone": "America/Detroit"
    },
    {
      "id": "LOC-CHICAGO-01",
      "label": "Chicago South",
      "division": "midwest",
      "address": {
        "city": "Chicago",
        "state": "IL"
      },
      "work_centers": ["WC-LASER-01", "WC-PRESS-01", "WC-LATHE-01", "WC-WATERJET-01"],
      "default_ship_days_to": {
        "LOC-DETROIT-01": 1,
        "LOC-MILWAUKEE-01": 0.5,
        "LOC-INDIANAPOLIS-01": 0.5
      },
      "timezone": "America/Chicago"
    }
  ],
  "transfer_rules": {
    "max_transfer_days": 3,
    "transfer_cost_per_lb": 0.05,
    "min_transfer_weight_lb": 500,
    "preferred_carriers": ["internal_truck", "common_carrier"]
  },
  "cross_location_scheduling": {
    "enabled": true,
    "require_approval_for_transfer": false,
    "auto_suggest_alternate_location": true,
    "balance_utilization_threshold": 0.15
  }
}
```

---

*Document generated for Build Phase: Planning & Scheduling App Models*
