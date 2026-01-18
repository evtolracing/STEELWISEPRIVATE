# 59 — Build Shop Floor App

> **Purpose:** Structured UI specifications for tablet/touch-friendly shop floor terminal.  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. screens

```json
{
  "root": {
    "id": "ShopFloorLayout",
    "type": "full_screen_layout",
    "orientation": "landscape_preferred",
    "min_touch_target_px": 48,
    "children": [
      {
        "id": "TopBar",
        "type": "app_bar",
        "height_px": 64,
        "position": "fixed_top",
        "children": [
          {
            "id": "LocationBadge",
            "type": "chip",
            "data_binding": "current_location.label",
            "position": "left"
          },
          {
            "id": "WorkCenterSelector",
            "type": "dropdown_button",
            "data_binding": "current_work_center",
            "options_source": "user.assigned_work_centers",
            "position": "left",
            "touch_size": "large"
          },
          {
            "id": "ShiftIndicator",
            "type": "chip",
            "data_binding": "current_shift.label",
            "position": "center"
          },
          {
            "id": "ClockDisplay",
            "type": "text",
            "format": "HH:mm:ss",
            "position": "center",
            "font_size": 24
          },
          {
            "id": "OperatorBadge",
            "type": "avatar_chip",
            "data_binding": "current_operator",
            "position": "right",
            "on_click": "show_operator_menu"
          },
          {
            "id": "AlertIndicator",
            "type": "icon_button",
            "icon": "notifications",
            "badge_count_binding": "unread_alerts.count",
            "position": "right",
            "on_click": "show_alerts_drawer"
          },
          {
            "id": "OfflineIndicator",
            "type": "chip",
            "visible_when": "!is_online",
            "label": "OFFLINE",
            "color": "warning",
            "position": "right"
          }
        ]
      },
      {
        "id": "MainContent",
        "type": "horizontal_split",
        "ratio": [35, 65],
        "children": [
          {
            "id": "LeftPanel",
            "type": "panel",
            "children": [
              {
                "id": "QueueHeader",
                "type": "section_header",
                "label": "Job Queue",
                "children": [
                  {
                    "id": "QueueCount",
                    "type": "badge",
                    "data_binding": "job_queue.length"
                  },
                  {
                    "id": "QueueFilter",
                    "type": "toggle_button_group",
                    "options": [
                      { "value": "all", "label": "All" },
                      { "value": "priority", "label": "Priority" },
                      { "value": "due_today", "label": "Today" }
                    ],
                    "default": "all"
                  }
                ]
              },
              {
                "id": "JobQueue",
                "type": "virtual_scroll_list",
                "item_height_px": 100,
                "data_binding": "job_queue",
                "empty_state": "NoJobsAssigned",
                "item_component": {
                  "id": "JobCard",
                  "type": "card",
                  "on_click": "select_job",
                  "on_long_press": "show_job_context_menu",
                  "children": [
                    {
                      "id": "JobCardHeader",
                      "type": "row",
                      "children": [
                        {
                          "id": "JobId",
                          "type": "text",
                          "data_binding": "item.job_id",
                          "font_weight": "bold",
                          "font_size": 18
                        },
                        {
                          "id": "PriorityBadge",
                          "type": "priority_indicator",
                          "data_binding": "item.priority",
                          "visible_when": "item.priority != 'standard'"
                        },
                        {
                          "id": "SLABadge",
                          "type": "sla_risk_badge",
                          "data_binding": "item.sla_risk",
                          "position": "right"
                        }
                      ]
                    },
                    {
                      "id": "JobCardBody",
                      "type": "column",
                      "children": [
                        {
                          "id": "CustomerName",
                          "type": "text",
                          "data_binding": "item.customer_name",
                          "font_size": 14,
                          "color": "text_secondary"
                        },
                        {
                          "id": "MaterialDescription",
                          "type": "text",
                          "data_binding": "item.material_short",
                          "font_size": 14,
                          "max_lines": 1,
                          "ellipsis": true
                        },
                        {
                          "id": "QuantityDisplay",
                          "type": "text",
                          "data_binding": "item.quantity_display",
                          "font_size": 16,
                          "font_weight": "medium"
                        }
                      ]
                    },
                    {
                      "id": "JobCardFooter",
                      "type": "row",
                      "children": [
                        {
                          "id": "DueTime",
                          "type": "text",
                          "data_binding": "item.due_display",
                          "icon": "schedule",
                          "font_size": 12
                        },
                        {
                          "id": "EstimatedTime",
                          "type": "text",
                          "data_binding": "item.estimated_duration_display",
                          "icon": "timer",
                          "font_size": 12
                        }
                      ]
                    }
                  ]
                }
              }
            ]
          },
          {
            "id": "RightPanel",
            "type": "panel",
            "children": [
              {
                "id": "ActiveJobPanel",
                "type": "conditional_container",
                "condition": "selected_job != null",
                "if_true": {
                  "id": "JobDetailView",
                  "type": "column",
                  "children": [
                    {
                      "id": "JobHeader",
                      "type": "card",
                      "elevation": 2,
                      "children": [
                        {
                          "id": "JobHeaderRow",
                          "type": "row",
                          "children": [
                            {
                              "id": "JobIdLarge",
                              "type": "text",
                              "data_binding": "selected_job.job_id",
                              "font_size": 28,
                              "font_weight": "bold"
                            },
                            {
                              "id": "StatusChip",
                              "type": "status_chip",
                              "data_binding": "selected_job.status",
                              "size": "large"
                            },
                            {
                              "id": "TimerDisplay",
                              "type": "elapsed_timer",
                              "data_binding": "selected_job.current_operation_start",
                              "visible_when": "selected_job.status == 'IN_PROCESS'",
                              "font_size": 32,
                              "color": "primary"
                            }
                          ]
                        },
                        {
                          "id": "CustomerRow",
                          "type": "row",
                          "children": [
                            {
                              "id": "CustomerNameLarge",
                              "type": "text",
                              "data_binding": "selected_job.customer_name",
                              "font_size": 18
                            },
                            {
                              "id": "OrderReference",
                              "type": "text",
                              "data_binding": "selected_job.order_id",
                              "font_size": 14,
                              "color": "text_secondary"
                            }
                          ]
                        }
                      ]
                    },
                    {
                      "id": "MaterialInfoCard",
                      "type": "card",
                      "children": [
                        {
                          "id": "MaterialHeader",
                          "type": "section_header",
                          "label": "Material",
                          "icon": "inventory_2"
                        },
                        {
                          "id": "MaterialGrid",
                          "type": "info_grid",
                          "columns": 2,
                          "items": [
                            { "label": "Grade", "binding": "selected_job.material.grade" },
                            { "label": "Size", "binding": "selected_job.material.size_display" },
                            { "label": "Heat #", "binding": "selected_job.material.heat_number" },
                            { "label": "Coil/Lot", "binding": "selected_job.material.lot_id" },
                            { "label": "Location", "binding": "selected_job.material.location" },
                            { "label": "Weight", "binding": "selected_job.material.weight_display" }
                          ]
                        }
                      ]
                    },
                    {
                      "id": "OperationCard",
                      "type": "card",
                      "children": [
                        {
                          "id": "OperationHeader",
                          "type": "section_header",
                          "label": "Current Operation",
                          "icon": "precision_manufacturing"
                        },
                        {
                          "id": "OperationDetails",
                          "type": "info_grid",
                          "columns": 2,
                          "items": [
                            { "label": "Operation", "binding": "selected_job.current_op.name" },
                            { "label": "Work Center", "binding": "selected_job.current_op.work_center" },
                            { "label": "Qty Required", "binding": "selected_job.current_op.qty_required" },
                            { "label": "Qty Complete", "binding": "selected_job.current_op.qty_complete" },
                            { "label": "Est. Time", "binding": "selected_job.current_op.estimated_time" },
                            { "label": "Standard", "binding": "selected_job.current_op.standard_time" }
                          ]
                        },
                        {
                          "id": "ProgressBar",
                          "type": "linear_progress",
                          "data_binding": "selected_job.current_op.progress_percent",
                          "show_label": true,
                          "height_px": 24
                        }
                      ]
                    },
                    {
                      "id": "WorkInstructionsButton",
                      "type": "button",
                      "variant": "outlined",
                      "label": "View Work Instructions",
                      "icon": "description",
                      "on_click": "open_work_instructions_modal",
                      "full_width": true
                    },
                    {
                      "id": "ActionButtonPanel",
                      "type": "action_button_panel",
                      "position": "bottom",
                      "sticky": true,
                      "children": [
                        {
                          "id": "StartButton",
                          "type": "action_button",
                          "action_id": "start_job",
                          "size": "extra_large",
                          "color": "success",
                          "icon": "play_arrow",
                          "label": "START",
                          "visible_when": "selected_job.status IN ['SCHEDULED']"
                        },
                        {
                          "id": "PauseButton",
                          "type": "action_button",
                          "action_id": "pause_job",
                          "size": "extra_large",
                          "color": "warning",
                          "icon": "pause",
                          "label": "PAUSE",
                          "visible_when": "selected_job.status == 'IN_PROCESS'"
                        },
                        {
                          "id": "ResumeButton",
                          "type": "action_button",
                          "action_id": "resume_job",
                          "size": "extra_large",
                          "color": "success",
                          "icon": "play_arrow",
                          "label": "RESUME",
                          "visible_when": "selected_job.status == 'PAUSED'"
                        },
                        {
                          "id": "CompleteButton",
                          "type": "action_button",
                          "action_id": "complete_job",
                          "size": "extra_large",
                          "color": "primary",
                          "icon": "check_circle",
                          "label": "COMPLETE",
                          "visible_when": "selected_job.status == 'IN_PROCESS'"
                        },
                        {
                          "id": "ScrapButton",
                          "type": "action_button",
                          "action_id": "report_scrap",
                          "size": "large",
                          "color": "error",
                          "icon": "delete_outline",
                          "label": "SCRAP",
                          "visible_when": "selected_job.status IN ['IN_PROCESS', 'PAUSED']"
                        },
                        {
                          "id": "NoteButton",
                          "type": "action_button",
                          "action_id": "add_note",
                          "size": "large",
                          "color": "secondary",
                          "icon": "note_add",
                          "label": "NOTE",
                          "visible_when": "selected_job != null"
                        },
                        {
                          "id": "IssueButton",
                          "type": "action_button",
                          "action_id": "report_issue",
                          "size": "large",
                          "color": "error",
                          "icon": "report_problem",
                          "label": "ISSUE",
                          "visible_when": "selected_job != null"
                        }
                      ]
                    }
                  ]
                },
                "if_false": {
                  "id": "NoJobSelected",
                  "type": "empty_state",
                  "icon": "touch_app",
                  "message": "Select a job from the queue",
                  "font_size": 24
                }
              }
            ]
          }
        ]
      },
      {
        "id": "BottomQuickActions",
        "type": "bottom_bar",
        "height_px": 72,
        "position": "fixed_bottom",
        "visible_when": "selected_job != null AND selected_job.status == 'IN_PROCESS'",
        "children": [
          {
            "id": "QuickOutputEntry",
            "type": "numeric_stepper",
            "label": "Output Qty",
            "data_binding": "current_output_qty",
            "min": 0,
            "step": 1,
            "size": "large"
          },
          {
            "id": "QuickWeightEntry",
            "type": "numeric_input",
            "label": "Weight (lb)",
            "data_binding": "current_output_weight",
            "keyboard": "numeric",
            "size": "large"
          },
          {
            "id": "RecordOutputButton",
            "type": "button",
            "label": "Record",
            "icon": "save",
            "color": "primary",
            "on_click": "record_output"
          }
        ]
      }
    ]
  },
  "modals": {
    "ScrapEntryModal": {
      "id": "ScrapEntryModal",
      "type": "bottom_sheet",
      "height": "60%",
      "children": [
        {
          "id": "ScrapHeader",
          "type": "modal_header",
          "title": "Report Scrap",
          "close_button": true
        },
        {
          "id": "ScrapForm",
          "type": "form",
          "schema_ref": "scrap_entry_schema",
          "children": [
            {
              "id": "ScrapQuantity",
              "type": "numeric_input",
              "field": "quantity",
              "label": "Scrap Quantity",
              "required": true,
              "keyboard": "numeric",
              "size": "large"
            },
            {
              "id": "ScrapWeight",
              "type": "numeric_input",
              "field": "weight_lb",
              "label": "Scrap Weight (lb)",
              "required": false,
              "keyboard": "decimal"
            },
            {
              "id": "ScrapReason",
              "type": "chip_select",
              "field": "reason_code",
              "label": "Reason",
              "required": true,
              "options": [
                { "value": "MATERIAL_DEFECT", "label": "Material Defect" },
                { "value": "MACHINE_ERROR", "label": "Machine Error" },
                { "value": "OPERATOR_ERROR", "label": "Operator Error" },
                { "value": "SETUP_WASTE", "label": "Setup Waste" },
                { "value": "EDGE_TRIM", "label": "Edge Trim" },
                { "value": "CUSTOMER_SPEC", "label": "Out of Spec" },
                { "value": "OTHER", "label": "Other" }
              ],
              "columns": 2
            },
            {
              "id": "ScrapNotes",
              "type": "text_area",
              "field": "notes",
              "label": "Notes (optional)",
              "max_length": 500,
              "rows": 3
            },
            {
              "id": "ScrapPhoto",
              "type": "photo_capture",
              "field": "photo_url",
              "label": "Photo (optional)",
              "camera_facing": "environment"
            }
          ]
        },
        {
          "id": "ScrapActions",
          "type": "modal_footer",
          "children": [
            {
              "id": "CancelScrap",
              "type": "button",
              "variant": "text",
              "label": "Cancel",
              "on_click": "close_modal"
            },
            {
              "id": "SubmitScrap",
              "type": "button",
              "color": "error",
              "label": "Report Scrap",
              "on_click": "submit_scrap_entry"
            }
          ]
        }
      ]
    },
    "MeasurementEntryModal": {
      "id": "MeasurementEntryModal",
      "type": "bottom_sheet",
      "height": "70%",
      "children": [
        {
          "id": "MeasurementHeader",
          "type": "modal_header",
          "title": "Record Measurements",
          "subtitle_binding": "selected_job.job_id"
        },
        {
          "id": "MeasurementForm",
          "type": "dynamic_form",
          "schema_binding": "selected_job.inspection_plan.measurements",
          "children": [
            {
              "id": "MeasurementList",
              "type": "measurement_entry_list",
              "items_binding": "selected_job.required_measurements",
              "item_template": {
                "id": "MeasurementRow",
                "type": "row",
                "children": [
                  {
                    "id": "MeasurementLabel",
                    "type": "text",
                    "data_binding": "item.label"
                  },
                  {
                    "id": "MeasurementInput",
                    "type": "numeric_input",
                    "field_binding": "item.field",
                    "keyboard": "decimal",
                    "unit_binding": "item.unit",
                    "min_binding": "item.min_value",
                    "max_binding": "item.max_value"
                  },
                  {
                    "id": "MeasurementStatus",
                    "type": "pass_fail_indicator",
                    "data_binding": "item.result_status"
                  }
                ]
              }
            }
          ]
        },
        {
          "id": "MeasurementActions",
          "type": "modal_footer",
          "children": [
            {
              "id": "CancelMeasurement",
              "type": "button",
              "variant": "text",
              "label": "Cancel"
            },
            {
              "id": "SaveMeasurements",
              "type": "button",
              "color": "primary",
              "label": "Save Measurements",
              "on_click": "submit_measurements"
            }
          ]
        }
      ]
    },
    "CompleteJobModal": {
      "id": "CompleteJobModal",
      "type": "dialog",
      "width": "600px",
      "children": [
        {
          "id": "CompleteHeader",
          "type": "modal_header",
          "title": "Complete Operation",
          "icon": "check_circle"
        },
        {
          "id": "CompleteSummary",
          "type": "summary_card",
          "items": [
            { "label": "Job", "binding": "selected_job.job_id" },
            { "label": "Operation", "binding": "selected_job.current_op.name" },
            { "label": "Time Elapsed", "binding": "selected_job.elapsed_time_display" },
            { "label": "Qty Requested", "binding": "selected_job.current_op.qty_required" }
          ]
        },
        {
          "id": "CompleteForm",
          "type": "form",
          "children": [
            {
              "id": "OutputQuantity",
              "type": "numeric_input",
              "field": "output_quantity",
              "label": "Output Quantity",
              "required": true,
              "default_binding": "selected_job.current_op.qty_required",
              "size": "large"
            },
            {
              "id": "OutputWeight",
              "type": "numeric_input",
              "field": "output_weight_lb",
              "label": "Output Weight (lb)",
              "required_when": "work_center.requires_weight",
              "size": "large"
            },
            {
              "id": "QCRequired",
              "type": "checkbox",
              "field": "qc_required",
              "label": "Send to QC Inspection",
              "default_binding": "selected_job.current_op.requires_qc"
            },
            {
              "id": "NextOperation",
              "type": "info_row",
              "label": "Next",
              "value_binding": "selected_job.next_op.name OR 'Packaging'",
              "visible_when": "selected_job.remaining_operations > 0"
            }
          ]
        },
        {
          "id": "CompleteActions",
          "type": "modal_footer",
          "children": [
            {
              "id": "CancelComplete",
              "type": "button",
              "variant": "text",
              "label": "Cancel"
            },
            {
              "id": "ConfirmComplete",
              "type": "button",
              "color": "success",
              "label": "Complete Operation",
              "icon": "check",
              "size": "large",
              "on_click": "submit_complete"
            }
          ]
        }
      ]
    },
    "WorkInstructionsModal": {
      "id": "WorkInstructionsModal",
      "type": "full_screen_modal",
      "children": [
        {
          "id": "InstructionsHeader",
          "type": "modal_header",
          "title": "Work Instructions",
          "subtitle_binding": "selected_job.current_op.name",
          "close_button": true
        },
        {
          "id": "InstructionsTabs",
          "type": "tabs",
          "children": [
            {
              "id": "StepsTab",
              "label": "Steps",
              "icon": "format_list_numbered",
              "content": {
                "id": "StepsList",
                "type": "numbered_list",
                "items_binding": "selected_job.work_instructions.steps",
                "item_template": {
                  "id": "StepItem",
                  "type": "step_card",
                  "fields": ["step_number", "instruction", "image_url", "caution_note"]
                }
              }
            },
            {
              "id": "SpecsTab",
              "label": "Specs",
              "icon": "straighten",
              "content": {
                "id": "SpecsTable",
                "type": "data_table",
                "data_binding": "selected_job.work_instructions.specs"
              }
            },
            {
              "id": "DrawingTab",
              "label": "Drawing",
              "icon": "architecture",
              "content": {
                "id": "DrawingViewer",
                "type": "document_viewer",
                "source_binding": "selected_job.work_instructions.drawing_url",
                "zoom_enabled": true,
                "pan_enabled": true
              }
            },
            {
              "id": "SafetyTab",
              "label": "Safety",
              "icon": "health_and_safety",
              "content": {
                "id": "SafetyList",
                "type": "alert_list",
                "items_binding": "selected_job.work_instructions.safety_notes",
                "severity": "warning"
              }
            }
          ]
        }
      ]
    },
    "IssueReportModal": {
      "id": "IssueReportModal",
      "type": "bottom_sheet",
      "height": "70%",
      "children": [
        {
          "id": "IssueHeader",
          "type": "modal_header",
          "title": "Report Issue",
          "icon": "report_problem",
          "icon_color": "error"
        },
        {
          "id": "IssueTypeSelector",
          "type": "chip_select",
          "field": "issue_type",
          "label": "Issue Type",
          "required": true,
          "options": [
            { "value": "EQUIPMENT_DOWN", "label": "Equipment Down", "icon": "build" },
            { "value": "MATERIAL_PROBLEM", "label": "Material Problem", "icon": "inventory" },
            { "value": "QUALITY_ISSUE", "label": "Quality Issue", "icon": "rule" },
            { "value": "SAFETY_CONCERN", "label": "Safety Concern", "icon": "warning" },
            { "value": "MISSING_INFO", "label": "Missing Info", "icon": "help" },
            { "value": "OTHER", "label": "Other", "icon": "more_horiz" }
          ],
          "columns": 2
        },
        {
          "id": "IssueSeverity",
          "type": "radio_group",
          "field": "severity",
          "label": "Severity",
          "options": [
            { "value": "LOW", "label": "Low - Can continue", "color": "success" },
            { "value": "MEDIUM", "label": "Medium - Needs attention", "color": "warning" },
            { "value": "HIGH", "label": "High - Blocking work", "color": "error" }
          ]
        },
        {
          "id": "IssueDescription",
          "type": "text_area",
          "field": "description",
          "label": "Description",
          "required": true,
          "placeholder": "Describe the issue...",
          "rows": 4
        },
        {
          "id": "IssuePhoto",
          "type": "photo_capture",
          "field": "photos",
          "label": "Photos (optional)",
          "multiple": true,
          "max_photos": 3
        },
        {
          "id": "IssueActions",
          "type": "modal_footer",
          "children": [
            {
              "id": "CancelIssue",
              "type": "button",
              "variant": "text",
              "label": "Cancel"
            },
            {
              "id": "SubmitIssue",
              "type": "button",
              "color": "error",
              "label": "Report Issue",
              "on_click": "submit_issue_report"
            }
          ]
        }
      ]
    },
    "OperatorLoginModal": {
      "id": "OperatorLoginModal",
      "type": "dialog",
      "dismissible": false,
      "width": "400px",
      "children": [
        {
          "id": "LoginHeader",
          "type": "modal_header",
          "title": "Operator Login",
          "icon": "person"
        },
        {
          "id": "LoginForm",
          "type": "form",
          "children": [
            {
              "id": "BadgeInput",
              "type": "text_input",
              "field": "badge_id",
              "label": "Badge ID",
              "placeholder": "Scan or enter badge",
              "autofocus": true,
              "size": "large"
            },
            {
              "id": "PinInput",
              "type": "pin_input",
              "field": "pin",
              "label": "PIN",
              "length": 4,
              "masked": true,
              "size": "large"
            }
          ]
        },
        {
          "id": "LoginActions",
          "type": "modal_footer",
          "children": [
            {
              "id": "LoginButton",
              "type": "button",
              "color": "primary",
              "label": "Login",
              "full_width": true,
              "size": "large",
              "on_click": "submit_login"
            }
          ]
        }
      ]
    }
  },
  "drawers": {
    "AlertsDrawer": {
      "id": "AlertsDrawer",
      "type": "right_drawer",
      "width": "400px",
      "children": [
        {
          "id": "AlertsHeader",
          "type": "drawer_header",
          "title": "Alerts",
          "action_button": {
            "label": "Clear All",
            "on_click": "clear_all_alerts"
          }
        },
        {
          "id": "AlertsList",
          "type": "list",
          "data_binding": "alerts",
          "empty_state": {
            "icon": "notifications_none",
            "message": "No alerts"
          },
          "item_template": {
            "id": "AlertItem",
            "type": "alert_card",
            "fields": ["severity", "title", "message", "timestamp", "action"]
          }
        }
      ]
    },
    "OperatorMenuDrawer": {
      "id": "OperatorMenuDrawer",
      "type": "right_drawer",
      "width": "300px",
      "children": [
        {
          "id": "OperatorInfo",
          "type": "profile_card",
          "data_binding": "current_operator"
        },
        {
          "id": "OperatorStats",
          "type": "stats_grid",
          "items": [
            { "label": "Jobs Today", "binding": "operator_stats.jobs_today" },
            { "label": "Efficiency", "binding": "operator_stats.efficiency_percent" },
            { "label": "Scrap Rate", "binding": "operator_stats.scrap_percent" }
          ]
        },
        {
          "id": "OperatorActions",
          "type": "menu_list",
          "items": [
            { "id": "view_history", "label": "My Job History", "icon": "history" },
            { "id": "change_work_center", "label": "Change Work Center", "icon": "swap_horiz" },
            { "id": "start_break", "label": "Start Break", "icon": "free_breakfast" },
            { "id": "end_shift", "label": "End Shift", "icon": "logout" },
            { "id": "logout", "label": "Logout", "icon": "exit_to_app", "color": "error" }
          ]
        }
      ]
    }
  }
}
```

---

## 2. actions

```json
[
  {
    "id": "start_job",
    "label": "Start",
    "icon": "play_arrow",
    "color": "success",
    "visible_when_status": ["SCHEDULED", "RECEIVED"],
    "allowed_roles": ["OPERATOR", "PLANNER", "QA_MANAGER"],
    "requires_confirmation": false,
    "preconditions": [
      { "check": "operator_logged_in", "message": "Login required" },
      { "check": "material_at_work_center", "message": "Material not at work center" },
      { "check": "no_active_job_on_work_center", "message": "Another job is active" },
      { "check": "work_center_available", "message": "Work center is down" }
    ],
    "side_effects": [
      "transition_job_to_IN_PROCESS",
      "start_labor_clock",
      "update_work_center_status_to_busy",
      "emit_event:operation.started",
      "log_event:JOB_STARTED",
      "notify_planner_job_started"
    ],
    "optimistic_ui": true,
    "offline_capable": true
  },
  {
    "id": "pause_job",
    "label": "Pause",
    "icon": "pause",
    "color": "warning",
    "visible_when_status": ["IN_PROCESS"],
    "allowed_roles": ["OPERATOR", "PLANNER"],
    "requires_confirmation": false,
    "requires_reason": true,
    "reason_options": [
      { "value": "BREAK", "label": "Break" },
      { "value": "LUNCH", "label": "Lunch" },
      { "value": "WAITING_MATERIAL", "label": "Waiting for Material" },
      { "value": "WAITING_QC", "label": "Waiting for QC" },
      { "value": "EQUIPMENT_ISSUE", "label": "Equipment Issue" },
      { "value": "OTHER", "label": "Other" }
    ],
    "side_effects": [
      "transition_job_to_PAUSED",
      "pause_labor_clock",
      "record_pause_reason",
      "update_work_center_status_to_idle",
      "emit_event:operation.paused",
      "log_event:JOB_PAUSED"
    ],
    "optimistic_ui": true,
    "offline_capable": true
  },
  {
    "id": "resume_job",
    "label": "Resume",
    "icon": "play_arrow",
    "color": "success",
    "visible_when_status": ["PAUSED"],
    "allowed_roles": ["OPERATOR", "PLANNER"],
    "requires_confirmation": false,
    "side_effects": [
      "transition_job_to_IN_PROCESS",
      "resume_labor_clock",
      "update_work_center_status_to_busy",
      "emit_event:operation.resumed",
      "log_event:JOB_RESUMED"
    ],
    "optimistic_ui": true,
    "offline_capable": true
  },
  {
    "id": "complete_job",
    "label": "Complete",
    "icon": "check_circle",
    "color": "primary",
    "visible_when_status": ["IN_PROCESS"],
    "allowed_roles": ["OPERATOR", "PLANNER", "QA_MANAGER"],
    "requires_confirmation": true,
    "confirmation_modal": "CompleteJobModal",
    "required_inputs": [
      { "field": "output_quantity", "type": "number", "required": true },
      { "field": "output_weight_lb", "type": "number", "required_if": "work_center.requires_weight" }
    ],
    "preconditions": [
      { "check": "measurements_recorded_if_required", "message": "Required measurements not recorded" },
      { "check": "output_quantity_valid", "message": "Output quantity must be greater than 0" }
    ],
    "side_effects": [
      "stop_labor_clock",
      "record_output",
      "calculate_efficiency",
      "transition_job_to_next_state",
      "update_work_center_status_to_idle",
      "emit_event:operation.completed",
      "log_event:JOB_COMPLETED",
      "notify_next_work_center_or_shipping"
    ],
    "optimistic_ui": false,
    "offline_capable": true
  },
  {
    "id": "report_scrap",
    "label": "Report Scrap",
    "icon": "delete_outline",
    "color": "error",
    "visible_when_status": ["IN_PROCESS", "PAUSED", "WAITING_QC"],
    "allowed_roles": ["OPERATOR", "QA_MANAGER"],
    "requires_confirmation": true,
    "confirmation_modal": "ScrapEntryModal",
    "required_inputs": [
      { "field": "quantity", "type": "number", "required": true },
      { "field": "reason_code", "type": "select", "required": true },
      { "field": "notes", "type": "text", "required": false },
      { "field": "photo_url", "type": "image", "required": false }
    ],
    "side_effects": [
      "create_scrap_record",
      "update_job_scrap_quantity",
      "update_inventory_scrap",
      "emit_event:scrap.recorded",
      "log_event:SCRAP_REPORTED",
      "notify_qa_if_threshold_exceeded"
    ],
    "optimistic_ui": false,
    "offline_capable": true
  },
  {
    "id": "record_output",
    "label": "Record Output",
    "icon": "add_circle",
    "color": "primary",
    "visible_when_status": ["IN_PROCESS"],
    "allowed_roles": ["OPERATOR"],
    "requires_confirmation": false,
    "required_inputs": [
      { "field": "quantity", "type": "number", "required": true },
      { "field": "weight_lb", "type": "number", "required_if": "work_center.requires_weight" }
    ],
    "side_effects": [
      "create_output_record",
      "update_job_output_quantity",
      "update_progress_percent",
      "emit_event:output.recorded",
      "log_event:OUTPUT_RECORDED"
    ],
    "optimistic_ui": true,
    "offline_capable": true
  },
  {
    "id": "record_measurement",
    "label": "Record Measurement",
    "icon": "straighten",
    "color": "secondary",
    "visible_when_status": ["IN_PROCESS", "WAITING_QC"],
    "allowed_roles": ["OPERATOR", "QA_MANAGER"],
    "requires_confirmation": true,
    "confirmation_modal": "MeasurementEntryModal",
    "required_inputs": [
      { "field": "measurements", "type": "object", "schema_ref": "measurement_entry_schema" }
    ],
    "side_effects": [
      "create_measurement_record",
      "evaluate_pass_fail",
      "emit_event:measurement.recorded",
      "log_event:MEASUREMENT_RECORDED",
      "create_ncr_if_failed"
    ],
    "optimistic_ui": false,
    "offline_capable": true
  },
  {
    "id": "add_note",
    "label": "Add Note",
    "icon": "note_add",
    "color": "secondary",
    "visible_when_status": ["SCHEDULED", "IN_PROCESS", "PAUSED", "WAITING_QC", "PACKAGING"],
    "allowed_roles": ["OPERATOR", "PLANNER", "QA_MANAGER", "SHIPPING"],
    "requires_confirmation": true,
    "confirmation_modal": "NoteEntryModal",
    "required_inputs": [
      { "field": "note_text", "type": "text", "required": true },
      { "field": "note_type", "type": "select", "required": false, "options": ["general", "quality", "safety", "equipment"] }
    ],
    "side_effects": [
      "create_note_record",
      "emit_event:note.added",
      "log_event:NOTE_ADDED"
    ],
    "optimistic_ui": true,
    "offline_capable": true
  },
  {
    "id": "report_issue",
    "label": "Report Issue",
    "icon": "report_problem",
    "color": "error",
    "visible_when_status": ["SCHEDULED", "IN_PROCESS", "PAUSED", "WAITING_QC"],
    "allowed_roles": ["OPERATOR", "PLANNER", "QA_MANAGER"],
    "requires_confirmation": true,
    "confirmation_modal": "IssueReportModal",
    "required_inputs": [
      { "field": "issue_type", "type": "select", "required": true },
      { "field": "severity", "type": "select", "required": true },
      { "field": "description", "type": "text", "required": true },
      { "field": "photos", "type": "image_array", "required": false }
    ],
    "side_effects": [
      "create_issue_record",
      "auto_pause_if_blocking",
      "notify_supervisor",
      "emit_event:issue.reported",
      "log_event:ISSUE_REPORTED"
    ],
    "optimistic_ui": false,
    "offline_capable": true
  },
  {
    "id": "request_material",
    "label": "Request Material",
    "icon": "inventory",
    "color": "info",
    "visible_when_status": ["SCHEDULED", "IN_PROCESS", "PAUSED"],
    "allowed_roles": ["OPERATOR", "PLANNER"],
    "requires_confirmation": true,
    "required_inputs": [
      { "field": "material_id", "type": "lookup", "required": true },
      { "field": "quantity", "type": "number", "required": false },
      { "field": "urgency", "type": "select", "options": ["normal", "urgent"] }
    ],
    "side_effects": [
      "create_material_request",
      "notify_material_handler",
      "emit_event:material.requested",
      "log_event:MATERIAL_REQUESTED"
    ],
    "optimistic_ui": true,
    "offline_capable": true
  },
  {
    "id": "operator_login",
    "label": "Login",
    "icon": "login",
    "color": "primary",
    "visible_when_status": ["*"],
    "allowed_roles": ["*"],
    "requires_confirmation": true,
    "confirmation_modal": "OperatorLoginModal",
    "required_inputs": [
      { "field": "badge_id", "type": "text", "required": true },
      { "field": "pin", "type": "pin", "required": true }
    ],
    "side_effects": [
      "authenticate_operator",
      "load_operator_context",
      "load_assigned_work_centers",
      "log_event:OPERATOR_LOGIN"
    ],
    "optimistic_ui": false,
    "offline_capable": false
  },
  {
    "id": "operator_logout",
    "label": "Logout",
    "icon": "logout",
    "color": "error",
    "visible_when_status": ["*"],
    "allowed_roles": ["OPERATOR", "PLANNER", "QA_MANAGER"],
    "requires_confirmation": true,
    "preconditions": [
      { "check": "no_active_job", "message": "Complete or pause active job before logout", "severity": "warning" }
    ],
    "side_effects": [
      "auto_pause_active_jobs",
      "clear_operator_context",
      "log_event:OPERATOR_LOGOUT",
      "return_to_login_screen"
    ],
    "optimistic_ui": false,
    "offline_capable": false
  }
]
```

---

## 3. io_data

### measurement_entry_schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "MeasurementEntry",
  "required": ["job_id", "operation_id", "measurements", "recorded_by", "recorded_at"],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "job_id": {
      "type": "string",
      "description": "Work order or job identifier"
    },
    "operation_id": {
      "type": "string",
      "description": "Operation sequence identifier"
    },
    "piece_number": {
      "type": "integer",
      "minimum": 1,
      "description": "Which piece in the batch (1, 2, 3...)"
    },
    "inspection_type": {
      "type": "string",
      "enum": ["first_piece", "in_process", "final", "audit"],
      "default": "in_process"
    },
    "measurements": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["spec_id", "actual_value"],
        "properties": {
          "spec_id": {
            "type": "string",
            "description": "Reference to spec definition"
          },
          "spec_name": {
            "type": "string",
            "description": "Human-readable spec name"
          },
          "nominal_value": {
            "type": "number",
            "description": "Target value"
          },
          "tolerance_plus": {
            "type": "number",
            "description": "Upper tolerance"
          },
          "tolerance_minus": {
            "type": "number",
            "description": "Lower tolerance (negative stored as positive)"
          },
          "actual_value": {
            "type": "number",
            "description": "Measured value"
          },
          "unit": {
            "type": "string",
            "enum": ["in", "mm", "lb", "kg", "deg", "psi", "HRC", "HRB"]
          },
          "result": {
            "type": "string",
            "enum": ["PASS", "FAIL", "MARGINAL"],
            "description": "Auto-calculated based on tolerances"
          },
          "deviation": {
            "type": "number",
            "description": "actual_value - nominal_value"
          },
          "instrument_id": {
            "type": "string",
            "description": "Calibrated instrument used"
          }
        }
      }
    },
    "overall_result": {
      "type": "string",
      "enum": ["PASS", "FAIL", "CONDITIONAL"],
      "description": "FAIL if any measurement fails"
    },
    "recorded_by": {
      "type": "string",
      "description": "Operator ID"
    },
    "recorded_at": {
      "type": "string",
      "format": "date-time"
    },
    "notes": {
      "type": "string",
      "maxLength": 1000
    },
    "photo_urls": {
      "type": "array",
      "items": { "type": "string", "format": "uri" }
    },
    "requires_disposition": {
      "type": "boolean",
      "default": false,
      "description": "True if any measurement failed"
    }
  }
}
```

### scrap_entry_schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "ScrapEntry",
  "required": ["job_id", "quantity", "reason_code", "recorded_by", "recorded_at"],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "job_id": {
      "type": "string"
    },
    "operation_id": {
      "type": "string"
    },
    "work_center_id": {
      "type": "string"
    },
    "material_id": {
      "type": "string",
      "description": "Inventory unit being scrapped"
    },
    "quantity": {
      "type": "number",
      "minimum": 0.001,
      "description": "Quantity scrapped in job UOM"
    },
    "unit_of_measure": {
      "type": "string",
      "enum": ["EA", "LB", "KG", "FT", "IN", "M", "SQFT", "SQM"]
    },
    "weight_lb": {
      "type": "number",
      "minimum": 0,
      "description": "Weight in pounds"
    },
    "reason_code": {
      "type": "string",
      "enum": [
        "MATERIAL_DEFECT",
        "MACHINE_ERROR",
        "OPERATOR_ERROR",
        "SETUP_WASTE",
        "EDGE_TRIM",
        "CUSTOMER_SPEC",
        "DIMENSION_OUT",
        "SURFACE_DEFECT",
        "CONTAMINATION",
        "OTHER"
      ]
    },
    "reason_detail": {
      "type": "string",
      "maxLength": 500,
      "description": "Additional detail for OTHER or clarification"
    },
    "is_reclaimable": {
      "type": "boolean",
      "default": false,
      "description": "Can material be reused?"
    },
    "reclaim_grade": {
      "type": "string",
      "description": "If reclaimable, what grade/use"
    },
    "cost_impact": {
      "type": "number",
      "description": "Calculated cost of scrap"
    },
    "recorded_by": {
      "type": "string"
    },
    "recorded_at": {
      "type": "string",
      "format": "date-time"
    },
    "notes": {
      "type": "string",
      "maxLength": 1000
    },
    "photo_url": {
      "type": "string",
      "format": "uri"
    },
    "reviewed_by": {
      "type": "string",
      "description": "Supervisor who reviewed (if required)"
    },
    "reviewed_at": {
      "type": "string",
      "format": "date-time"
    },
    "ncr_id": {
      "type": "string",
      "description": "Linked NCR if created"
    }
  }
}
```

### exception_note_schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "ExceptionNote",
  "required": ["job_id", "note_type", "description", "created_by", "created_at"],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "job_id": {
      "type": "string"
    },
    "operation_id": {
      "type": "string"
    },
    "work_center_id": {
      "type": "string"
    },
    "note_type": {
      "type": "string",
      "enum": [
        "GENERAL",
        "QUALITY",
        "SAFETY",
        "EQUIPMENT",
        "MATERIAL",
        "CUSTOMER_REQUEST",
        "PROCESS_DEVIATION",
        "HANDOFF"
      ]
    },
    "severity": {
      "type": "string",
      "enum": ["INFO", "WARNING", "CRITICAL"],
      "default": "INFO"
    },
    "title": {
      "type": "string",
      "maxLength": 100
    },
    "description": {
      "type": "string",
      "maxLength": 2000
    },
    "photo_urls": {
      "type": "array",
      "items": { "type": "string", "format": "uri" },
      "maxItems": 5
    },
    "is_blocking": {
      "type": "boolean",
      "default": false,
      "description": "Does this prevent job progress?"
    },
    "requires_acknowledgment": {
      "type": "boolean",
      "default": false
    },
    "acknowledged_by": {
      "type": "string"
    },
    "acknowledged_at": {
      "type": "string",
      "format": "date-time"
    },
    "linked_issue_id": {
      "type": "string",
      "description": "If escalated to issue tracker"
    },
    "created_by": {
      "type": "string"
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    },
    "visible_to_roles": {
      "type": "array",
      "items": { "type": "string" },
      "default": ["OPERATOR", "PLANNER", "QA_MANAGER"]
    },
    "visible_to_customer": {
      "type": "boolean",
      "default": false
    }
  }
}
```

---

## 4. event_log_schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "ShopFloorEventLog",
  "required": ["id", "event_type", "timestamp", "actor_id", "actor_type"],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique event identifier"
    },
    "event_type": {
      "type": "string",
      "enum": [
        "JOB_STARTED",
        "JOB_PAUSED",
        "JOB_RESUMED",
        "JOB_COMPLETED",
        "OUTPUT_RECORDED",
        "SCRAP_REPORTED",
        "MEASUREMENT_RECORDED",
        "NOTE_ADDED",
        "ISSUE_REPORTED",
        "MATERIAL_REQUESTED",
        "MATERIAL_RECEIVED",
        "OPERATOR_LOGIN",
        "OPERATOR_LOGOUT",
        "WORK_CENTER_CHANGED",
        "EQUIPMENT_STATUS_CHANGED",
        "QUALITY_CHECK_PASSED",
        "QUALITY_CHECK_FAILED",
        "NCR_CREATED",
        "BREAK_STARTED",
        "BREAK_ENDED",
        "SHIFT_STARTED",
        "SHIFT_ENDED"
      ]
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 timestamp"
    },
    "timestamp_local": {
      "type": "string",
      "description": "Local time display string"
    },
    "actor_id": {
      "type": "string",
      "description": "User or system ID that triggered event"
    },
    "actor_type": {
      "type": "string",
      "enum": ["OPERATOR", "PLANNER", "QA_MANAGER", "SYSTEM", "INTEGRATION"],
      "description": "Type of actor"
    },
    "actor_name": {
      "type": "string",
      "description": "Display name of actor"
    },
    "job_id": {
      "type": "string",
      "description": "Associated job/work order"
    },
    "operation_id": {
      "type": "string",
      "description": "Associated operation"
    },
    "work_center_id": {
      "type": "string",
      "description": "Work center where event occurred"
    },
    "location_id": {
      "type": "string",
      "description": "Facility location"
    },
    "payload": {
      "type": "object",
      "description": "Event-specific data",
      "properties": {
        "previous_state": { "type": "string" },
        "new_state": { "type": "string" },
        "quantity": { "type": "number" },
        "weight_lb": { "type": "number" },
        "reason_code": { "type": "string" },
        "notes": { "type": "string" },
        "duration_seconds": { "type": "integer" },
        "efficiency_percent": { "type": "number" },
        "measurements": { "type": "object" },
        "issue_type": { "type": "string" },
        "severity": { "type": "string" }
      },
      "additionalProperties": true
    },
    "client_timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "Timestamp from client device (for offline sync)"
    },
    "synced_at": {
      "type": "string",
      "format": "date-time",
      "description": "When event was synced to server (if offline)"
    },
    "is_offline_event": {
      "type": "boolean",
      "default": false,
      "description": "Was this recorded while offline?"
    },
    "device_id": {
      "type": "string",
      "description": "Device/terminal identifier"
    },
    "session_id": {
      "type": "string",
      "description": "Operator session identifier"
    },
    "correlation_id": {
      "type": "string",
      "description": "For linking related events"
    },
    "parent_event_id": {
      "type": "string",
      "description": "For event chains (e.g., pause -> resume)"
    }
  },
  "indexes": [
    { "fields": ["job_id", "timestamp"], "name": "idx_job_timeline" },
    { "fields": ["work_center_id", "timestamp"], "name": "idx_work_center_timeline" },
    { "fields": ["actor_id", "timestamp"], "name": "idx_operator_timeline" },
    { "fields": ["event_type", "timestamp"], "name": "idx_event_type" },
    { "fields": ["location_id", "timestamp"], "name": "idx_location_timeline" }
  ]
}
```

---

## 5. error_cases

| scenario | cause | user_message | remediation_action |
|----------|-------|--------------|-------------------|
| login_failed_invalid_badge | Badge ID not found in system | "Badge not recognized. Please try again or contact supervisor." | Show retry, offer manual ID entry, log failed attempt |
| login_failed_invalid_pin | PIN does not match badge | "Incorrect PIN. Please try again." | Clear PIN field, allow 3 attempts then lock 5 min |
| login_failed_account_locked | Too many failed attempts | "Account temporarily locked. Contact supervisor." | Display unlock time, show supervisor contact |
| start_job_material_missing | Material not at work center | "Material not at this work center. Request material or check location." | Show material location, offer "Request Material" button |
| start_job_another_active | Operator has active job on this work center | "Complete or pause Job {id} before starting a new job." | Highlight active job, offer quick-pause |
| start_job_work_center_down | Equipment is marked as down | "Work center is currently down. Contact maintenance." | Show maintenance contact, offer alternate work center |
| complete_job_no_output | Attempting complete with zero output | "Enter output quantity to complete this job." | Focus output field, prevent submit |
| complete_job_measurements_missing | Required measurements not recorded | "Record required measurements before completing." | Open measurement modal, highlight missing |
| scrap_exceeds_job_quantity | Scrap quantity > remaining job quantity | "Scrap quantity ({x}) exceeds remaining quantity ({y})." | Cap input at max, require override from supervisor |
| measurement_out_of_range | Value outside instrument range | "Value {x} is outside instrument range. Check measurement." | Highlight field, allow override with note |
| measurement_far_from_nominal | Value far outside expected (likely typo) | "Value {x} is significantly outside expected range. Please verify." | Require confirmation, auto-flag for review |
| offline_action_queued | Device is offline | "You are offline. This action will be saved and synced when connected." | Show pending sync count, allow continue |
| offline_sync_conflict | Server has newer data | "This job was updated while you were offline. Review changes." | Show diff, allow merge or override |
| offline_sync_failed | Sync failed after reconnect | "Some actions failed to sync. Tap to retry." | Show failed items, retry button, escalate if persistent |
| session_expired | Auth token expired | "Session expired. Please log in again." | Preserve draft data, redirect to login |
| work_center_capacity_exceeded | Scheduling more than capacity | "This work center is at capacity for selected time." | Show capacity view, suggest alternatives |
| equipment_issue_blocking | Reported issue marked as blocking | "Blocking issue reported. Job paused until resolved." | Show issue details, notify supervisor |
| qc_failed_requires_ncr | Quality check failed | "Measurement failed. NCR required for disposition." | Auto-create NCR, guide to disposition flow |
| photo_upload_failed | Camera/upload error | "Photo could not be saved. Tap to retry." | Offer retry, allow skip if optional |
| barcode_scan_failed | Scanner couldn't read | "Barcode not recognized. Enter manually or try again." | Show manual entry field, focus cursor |
| invalid_quantity_format | Non-numeric input | "Please enter a valid number." | Clear field, show numeric keyboard |
| weight_mismatch_warning | Recorded weight differs significantly from expected | "Recorded weight ({x} lb) differs from expected ({y} lb). Verify." | Allow override with reason, flag for audit |
| network_timeout | API call timeout | "Connection timed out. Retrying..." | Auto-retry 3x, then show manual retry |
| server_error | 500 error from API | "Something went wrong. Please try again." | Log error, offer retry, escalate after 3 failures |
| concurrent_edit_conflict | Another user editing same job | "This job is being edited by {user}. Your changes may conflict." | Show lock indicator, allow force-save with warning |

---

## 6. Offline Sync Model

```json
{
  "offline_strategy": {
    "storage": "IndexedDB",
    "max_offline_duration_hours": 72,
    "sync_on_reconnect": true,
    "background_sync": true,
    "conflict_resolution": "server_wins_with_merge"
  },
  "cacheable_data": [
    { "entity": "job_queue", "strategy": "stale_while_revalidate", "max_age_minutes": 5 },
    { "entity": "work_instructions", "strategy": "cache_first", "max_age_hours": 24 },
    { "entity": "inspection_plans", "strategy": "cache_first", "max_age_hours": 24 },
    { "entity": "material_specs", "strategy": "cache_first", "max_age_hours": 168 },
    { "entity": "reason_codes", "strategy": "cache_first", "max_age_hours": 168 },
    { "entity": "operator_assignments", "strategy": "stale_while_revalidate", "max_age_minutes": 15 }
  ],
  "offline_actions": [
    { "action": "start_job", "queue": true, "priority": "high" },
    { "action": "pause_job", "queue": true, "priority": "high" },
    { "action": "resume_job", "queue": true, "priority": "high" },
    { "action": "complete_job", "queue": true, "priority": "high" },
    { "action": "record_output", "queue": true, "priority": "medium" },
    { "action": "report_scrap", "queue": true, "priority": "medium" },
    { "action": "record_measurement", "queue": true, "priority": "medium" },
    { "action": "add_note", "queue": true, "priority": "low" },
    { "action": "report_issue", "queue": true, "priority": "high" }
  ],
  "sync_order": [
    "operator_login",
    "job_state_changes",
    "output_records",
    "scrap_records",
    "measurement_records",
    "notes",
    "issues"
  ],
  "conflict_handlers": {
    "job_already_completed": "discard_local_with_notification",
    "job_reassigned": "merge_events_with_notification",
    "quantity_mismatch": "sum_quantities_with_flag"
  }
}
```

---

## 7. Touch Interaction Specs

```json
{
  "touch_targets": {
    "minimum_size_px": 48,
    "recommended_size_px": 56,
    "spacing_between_px": 8
  },
  "gestures": {
    "tap": { "use": "primary_action", "feedback": "ripple" },
    "long_press": { "use": "context_menu", "delay_ms": 500, "feedback": "haptic" },
    "swipe_left": { "use": "reveal_actions", "context": "job_card", "actions": ["pause", "issue"] },
    "swipe_right": { "use": "reveal_actions", "context": "job_card", "actions": ["start", "complete"] },
    "pull_down": { "use": "refresh", "context": "job_queue" },
    "pinch": { "use": "zoom", "context": "drawing_viewer" },
    "pan": { "use": "scroll_or_pan", "context": "drawing_viewer" }
  },
  "button_sizes": {
    "extra_large": { "height_px": 72, "min_width_px": 160, "font_size": 20, "icon_size": 32 },
    "large": { "height_px": 56, "min_width_px": 120, "font_size": 18, "icon_size": 24 },
    "medium": { "height_px": 48, "min_width_px": 96, "font_size": 16, "icon_size": 20 },
    "small": { "height_px": 40, "min_width_px": 72, "font_size": 14, "icon_size": 18 }
  },
  "input_behaviors": {
    "numeric_input": { "keyboard": "numeric", "select_all_on_focus": true },
    "text_input": { "keyboard": "default", "auto_capitalize": "sentences" },
    "barcode_field": { "keyboard": "none", "listen_for_scan": true, "fallback_keyboard": "default" }
  },
  "feedback": {
    "haptic_enabled": true,
    "haptic_events": ["button_press", "action_complete", "error", "long_press"],
    "audio_enabled": false,
    "visual_feedback_duration_ms": 200
  }
}
```

---

*Document generated for Build Phase: Shop Floor App UI Specifications*
