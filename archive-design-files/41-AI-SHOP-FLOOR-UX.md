# 41 — AI Shop Floor Execution UX

> **Purpose:** Shop floor HMI interface specifications for AI-build.  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. Screens — Component Tree

```
ShopFloorApp/
├── AuthenticationScreen/
│   ├── BadgeScanInput { mode: RFID|BARCODE|MANUAL }
│   ├── PINPadInput { digits: 4-6, masked: true }
│   ├── OperatorPhoto { size: 80x80, from: employee_record }
│   ├── LoginButton { enabled_when: badge_valid AND pin_valid }
│   ├── LanguageSelector { options: [EN, ES, ZH, VI] }
│   └── ErrorDisplay { message, retry_action }
│
├── WorkCenterSelectionScreen/
│   ├── WorkCenterGrid/
│   │   └── WorkCenterTile[]/
│   │       ├── WorkCenterIcon { type: SHEAR|SLITTER|SAW|etc }
│   │       ├── WorkCenterName { text, font_size: 24 }
│   │       ├── StatusIndicator { color: GREEN|YELLOW|RED|GRAY }
│   │       ├── CurrentOperator { name, photo }
│   │       └── QueueCount { count, badge_color }
│   ├── QuickAccessBar/
│   │   ├── LastUsedWorkCenter { work_center_id }
│   │   └── FavoritesButton
│   └── LogoutButton
│
├── MainDashboard/
│   ├── Header/
│   │   ├── WorkCenterInfo { id, name, status }
│   │   ├── OperatorInfo { name, photo, shift }
│   │   ├── ShiftInfo { shift_name, start, end, time_remaining }
│   │   ├── DateTimeDisplay { format: "HH:mm:ss | MMM DD, YYYY" }
│   │   └── AlertBell { unread_count, on_click: show_alerts }
│   │
│   ├── ActiveJobPanel/
│   │   ├── NoActiveJobState/
│   │   │   ├── IdleMessage { text: "No active job" }
│   │   │   ├── ScanJobButton { size: LARGE, icon: barcode }
│   │   │   └── SelectFromQueueButton
│   │   │
│   │   └── ActiveJobState/
│   │       ├── JobHeader/
│   │       │   ├── WorkOrderNumber { value, font_size: 32, copy_action }
│   │       │   ├── SalesOrderNumber { value, link_to_order }
│   │       │   ├── CustomerName { value, font_size: 20 }
│   │       │   ├── PriorityBadge { priority: STANDARD|RUSH|HOT, pulsing: if_hot }
│   │       │   └── DueDateCountdown { date, hours_remaining, color_coded }
│   │       │
│   │       ├── OperationInfo/
│   │       │   ├── OperationSequence { current: 2, total: 5 }
│   │       │   ├── OperationType { name: "Shear to Length", icon }
│   │       │   ├── OperationInstructions { text, expandable }
│   │       │   └── SpecialInstructions { text, highlighted: true }
│   │       │
│   │       ├── MaterialPanel/
│   │       │   ├── MaterialDescription { product_name, grade, dimensions }
│   │       │   ├── HeatNumber { value, mtr_link }
│   │       │   ├── SourceLocation { bay, row, position }
│   │       │   ├── CoilTag { value, barcode_scannable }
│   │       │   ├── InputWeight { value, unit: LBS }
│   │       │   └── MaterialPhoto { thumbnail, tap_to_enlarge }
│   │       │
│   │       ├── TargetPanel/
│   │       │   ├── TargetQuantity { pieces, font_size: 48, unit }
│   │       │   ├── TargetDimensions/
│   │       │   │   ├── DimensionRow { label: "Length", value, tolerance, unit }
│   │       │   │   ├── DimensionRow { label: "Width", value, tolerance, unit }
│   │       │   │   └── DimensionRow { label: "Thickness", value, tolerance, unit }
│   │       │   ├── TargetWeight { value, tolerance_pct, unit }
│   │       │   └── CutPattern { diagram, piece_count, remnant_size }
│   │       │
│   │       ├── ProgressPanel/
│   │       │   ├── ProgressBar { completed_pct, pieces_done, pieces_total }
│   │       │   ├── ElapsedTime { format: "HH:MM:SS" }
│   │       │   ├── EstimatedRemaining { format: "MM:SS" }
│   │       │   ├── PaceIndicator { status: AHEAD|ON_TRACK|BEHIND, delta }
│   │       │   └── OutputSummary/
│   │       │       ├── GoodPieces { count, weight }
│   │       │       ├── ScrapPieces { count, weight }
│   │       │       └── RemnantPieces { count, weight }
│   │       │
│   │       └── ActionButtonBar/
│   │           ├── StartButton { state: ENABLED|DISABLED|HIDDEN }
│   │           ├── PauseButton { state: ENABLED|DISABLED|HIDDEN }
│   │           ├── ResumeButton { state: ENABLED|DISABLED|HIDDEN }
│   │           ├── CompleteOpButton { state: ENABLED|DISABLED|HIDDEN }
│   │           ├── RecordOutputButton { state: ENABLED, primary: true }
│   │           ├── RecordScrapButton { state: ENABLED }
│   │           └── HelpButton { always_visible: true }
│   │
│   ├── QueuePanel/
│   │   ├── QueueHeader/
│   │   │   ├── QueueTitle { text: "Up Next" }
│   │   │   ├── QueueCount { count }
│   │   │   ├── SortDropdown { options: [priority, due_date, setup_opt] }
│   │   │   └── RefreshButton
│   │   │
│   │   └── QueueList/
│   │       └── QueuedJobCard[]/
│   │           ├── PositionBadge { position: 1, 2, 3... }
│   │           ├── WorkOrderNumber { value }
│   │           ├── CustomerName { value, truncated }
│   │           ├── ProductSummary { text, dimensions }
│   │           ├── PiecesRequired { count }
│   │           ├── EstimatedTime { minutes }
│   │           ├── PriorityIndicator { color, icon }
│   │           ├── DueDate { date, urgency_color }
│   │           ├── SetupMatchBadge { matches_current: boolean }
│   │           └── StartJobAction { on_tap: start_this_job }
│   │
│   ├── MachineStatusPanel/
│   │   ├── MachineState { status: IDLE|RUNNING|PAUSED|FAULT|MAINTENANCE }
│   │   ├── RunIndicator { animated: spinning_when_running }
│   │   ├── CycleCounter { today_count, shift_count }
│   │   ├── SpeedGauge { current_speed, max_speed, unit }
│   │   ├── TemperatureGauge { current, warning_threshold, critical_threshold }
│   │   ├── ConsumableStatus/
│   │   │   ├── ConsumableRow { name: "Blade Life", pct_remaining, replace_at }
│   │   │   ├── ConsumableRow { name: "Coolant Level", pct_remaining }
│   │   │   └── ConsumableRow { name: "Hydraulic Pressure", value, unit, status }
│   │   └── FaultIndicator { active_faults[], clear_action }
│   │
│   ├── ShiftMetricsPanel/
│   │   ├── MetricCard { label: "Jobs Completed", value: 12, target: 15 }
│   │   ├── MetricCard { label: "Pieces Produced", value: 847, target: 900 }
│   │   ├── MetricCard { label: "Scrap Rate", value: "1.2%", target: "<2%" }
│   │   ├── MetricCard { label: "Downtime", value: "18 min", target: "<30 min" }
│   │   └── MetricCard { label: "OEE", value: "84%", target: ">80%" }
│   │
│   └── QuickActionsPanel/
│       ├── ScanButton { label: "Scan Job", icon: barcode }
│       ├── DowntimeButton { label: "Report Downtime", icon: pause }
│       ├── QualityButton { label: "Quality Issue", icon: warning }
│       ├── MaintenanceButton { label: "Call Maintenance", icon: wrench }
│       ├── BreakButton { label: "Start Break", icon: coffee }
│       └── SupervisorButton { label: "Call Supervisor", icon: person }
│
├── OutputRecordingScreen/
│   ├── Header/
│   │   ├── ScreenTitle { text: "Record Output" }
│   │   ├── WorkOrderNumber { value }
│   │   └── CancelButton { returns_to_dashboard }
│   │
│   ├── OutputForm/
│   │   ├── QuantitySection/
│   │   │   ├── PieceCountInput { type: NUMBER, keypad: NUMERIC, required: true }
│   │   │   ├── IncrementButton { value: +1, +5, +10, +25 }
│   │   │   ├── DecrementButton { value: -1 }
│   │   │   └── TotalPiecesDisplay { running_total }
│   │   │
│   │   ├── WeightSection/
│   │   │   ├── WeightInput { type: DECIMAL, unit: LBS, required: true }
│   │   │   ├── ScaleReadButton { action: read_from_scale }
│   │   │   ├── CalculateWeightButton { action: estimate_from_pieces }
│   │   │   └── WeightVarianceWarning { shown_if: variance > 5% }
│   │   │
│   │   ├── DimensionSection/ (shown if: operation_requires_dims)
│   │   │   ├── LengthInput { value, tolerance_display, unit }
│   │   │   ├── WidthInput { value, tolerance_display, unit }
│   │   │   ├── ThicknessInput { value, tolerance_display, unit }
│   │   │   └── OutOfSpecWarning { shown_if: dimension_out_of_tolerance }
│   │   │
│   │   ├── LabelSection/
│   │   │   ├── GenerateLabelsToggle { default: true }
│   │   │   ├── LabelQuantity { value, auto_from_pieces }
│   │   │   ├── LabelPreview { thumbnail }
│   │   │   └── PrinterSelector { available_printers[] }
│   │   │
│   │   ├── LocationSection/
│   │   │   ├── OutputLocationInput { bay, row, position }
│   │   │   ├── ScanLocationButton { action: scan_location_barcode }
│   │   │   └── SuggestedLocation { from_ai_recommendation }
│   │   │
│   │   └── NotesSection/
│   │       ├── NotesInput { multiline: true, optional: true }
│   │       ├── VoiceNoteButton { action: record_voice }
│   │       └── PhotoButton { action: capture_photo }
│   │
│   └── SubmitSection/
│       ├── ValidationSummary { errors[], warnings[] }
│       ├── SubmitButton { label: "Record Output", primary: true }
│       └── CancelButton
│
├── ScrapRecordingScreen/
│   ├── Header/
│   │   ├── ScreenTitle { text: "Record Scrap" }
│   │   ├── WorkOrderNumber { value }
│   │   └── CloseButton
│   │
│   ├── ScrapForm/
│   │   ├── QuantitySection/
│   │   │   ├── PieceCountInput { type: NUMBER, keypad: NUMERIC }
│   │   │   └── WeightInput { type: DECIMAL, unit: LBS }
│   │   │
│   │   ├── ReasonSection/
│   │   │   ├── ReasonPicker { options: SCRAP_REASONS[], required: true }
│   │   │   ├── SubReasonPicker { options: dynamic_by_reason }
│   │   │   └── FreeTextReason { shown_if: reason == OTHER }
│   │   │
│   │   ├── AttributionSection/
│   │   │   ├── ResponsibilityPicker { options: [OPERATOR, MACHINE, MATERIAL, PREVIOUS_OP] }
│   │   │   ├── OperationSelector { if: PREVIOUS_OP selected }
│   │   │   └── SupplierNote { if: MATERIAL selected, links_to_ncr }
│   │   │
│   │   ├── EvidenceSection/
│   │   │   ├── PhotoCapture { required_if: weight > threshold }
│   │   │   ├── PhotoGallery { captured_photos[] }
│   │   │   └── NotesInput { multiline: true }
│   │   │
│   │   └── DispositionSection/
│   │       ├── DispositionPicker { options: [SCRAP_BIN, REWORK, DOWNGRADE, RETURN_TO_STOCK] }
│   │       └── DispositionLocation { shown_if: disposition_selected }
│   │
│   └── SubmitSection/
│       ├── SupervisorApprovalRequired { shown_if: weight > threshold }
│       ├── SubmitButton { label: "Record Scrap" }
│       └── CancelButton
│
├── DowntimeRecordingScreen/
│   ├── Header/
│   │   ├── ScreenTitle { text: "Record Downtime" }
│   │   └── ElapsedTimer { started_at, running: true }
│   │
│   ├── DowntimeForm/
│   │   ├── CategorySection/
│   │   │   ├── CategoryPicker { options: DOWNTIME_CATEGORIES[], large_buttons: true }
│   │   │   └── SubCategoryPicker { options: dynamic_by_category }
│   │   │
│   │   ├── DescriptionSection/
│   │   │   ├── DescriptionInput { multiline: true }
│   │   │   ├── VoiceDescriptionButton { action: voice_to_text }
│   │   │   └── PhotoCapture { optional: true }
│   │   │
│   │   └── EstimateSection/
│   │       ├── EstimatedDuration { picker: [5, 10, 15, 30, 60, 120, UNKNOWN] }
│   │       └── MaintenanceRequiredToggle { triggers_maintenance_request }
│   │
│   └── ActionSection/
│       ├── SubmitButton { label: "Log Downtime" }
│       ├── MaintenanceCallButton { label: "Call Maintenance Now" }
│       └── CancelButton
│
├── QualityCheckScreen/
│   ├── Header/
│   │   ├── ScreenTitle { text: "Quality Check" }
│   │   ├── InspectionPlanBadge { plan_id, step_number }
│   │   └── SamplingInfo { sample_size, frequency }
│   │
│   ├── InspectionForm/
│   │   ├── VisualInspectionSection/
│   │   │   ├── ChecklistItem { label: "Surface defects", input: PASS|FAIL }
│   │   │   ├── ChecklistItem { label: "Edge quality", input: PASS|FAIL }
│   │   │   ├── ChecklistItem { label: "Flatness", input: PASS|FAIL }
│   │   │   └── DefectSelector { if: any_fail, options: DEFECT_TYPES[] }
│   │   │
│   │   ├── DimensionalSection/
│   │   │   ├── MeasurementRow { label: "Length", nominal, tolerance, input, unit }
│   │   │   ├── MeasurementRow { label: "Width", nominal, tolerance, input, unit }
│   │   │   ├── MeasurementRow { label: "Thickness", nominal, tolerance, input, unit }
│   │   │   ├── MeasurementRow { label: "Squareness", nominal, tolerance, input, unit }
│   │   │   └── MeasurementDeviceSync { device: CALIPER|MICROMETER, bluetooth: true }
│   │   │
│   │   ├── WeightSection/
│   │   │   ├── WeightInput { type: DECIMAL, from_scale: true }
│   │   │   ├── TheoreticalWeight { calculated }
│   │   │   └── VarianceDisplay { percent, pass_fail }
│   │   │
│   │   └── ResultSection/
│   │       ├── OverallResult { calculated: PASS|FAIL|MARGINAL }
│   │       ├── ActionRequired { if: FAIL, options: [SCRAP, REWORK, HOLD, CONTINUE] }
│   │       └── SupervisorOverride { if: action == CONTINUE with FAIL }
│   │
│   └── SubmitSection/
│       ├── PhotoCapture { optional: true }
│       ├── NotesInput { multiline: true }
│       ├── SubmitButton { label: "Submit Inspection" }
│       └── HoldForQAButton { escalates_to_qa }
│
├── BreakScreen/
│   ├── BreakTimer/
│   │   ├── BreakTypeIndicator { type: BREAK|LUNCH|PERSONAL }
│   │   ├── ElapsedTime { format: "MM:SS" }
│   │   ├── AllowedTime { minutes }
│   │   └── OverBreakWarning { shown_if: elapsed > allowed }
│   │
│   ├── JobStatus/
│   │   ├── PausedJobInfo { work_order, operation }
│   │   └── AutoResumeReminder { message }
│   │
│   └── Actions/
│       ├── EndBreakButton { primary: true }
│       └── ExtendBreakButton { requires_reason }
│
├── ShiftHandoffScreen/
│   ├── Header/
│   │   ├── ScreenTitle { text: "Shift Handoff" }
│   │   ├── OutgoingOperator { name, photo }
│   │   └── IncomingOperator { badge_scan_prompt }
│   │
│   ├── HandoffSummary/
│   │   ├── ActiveJobSection/
│   │   │   ├── CurrentJobInfo { work_order, operation, progress }
│   │   │   ├── TimeRemaining { estimate }
│   │   │   └── SpecialNotes { text, highlighted }
│   │   │
│   │   ├── QueueSection/
│   │   │   ├── NextJobsList { top_3_jobs }
│   │   │   └── TotalQueueDepth { count, hours }
│   │   │
│   │   ├── IssuesSection/
│   │   │   ├── OpenIssuesList { quality_issues, machine_issues }
│   │   │   └── PendingMaintenance { requests[] }
│   │   │
│   │   └── NotesSection/
│   │       ├── OutgoingNotes { from_previous_operator }
│   │       └── AddNoteInput { multiline: true }
│   │
│   └── Actions/
│       ├── ConfirmHandoffButton { requires_both_scans }
│       └── PrintHandoffReport { optional: true }
│
├── SupervisorOverrideModal/
│   ├── Header/
│   │   ├── ModalTitle { text: "Supervisor Override Required" }
│   │   └── ReasonDisplay { action_requiring_override }
│   │
│   ├── AuthenticationSection/
│   │   ├── SupervisorBadgeScan
│   │   ├── SupervisorPIN
│   │   └── SupervisorName { displayed_after_auth }
│   │
│   ├── OverrideForm/
│   │   ├── JustificationInput { required: true }
│   │   └── AcknowledgmentCheckbox { text: "I authorize this action" }
│   │
│   └── Actions/
│       ├── ApproveButton
│       └── RejectButton
│
├── AlertsDrawer/
│   ├── DrawerHeader/
│   │   ├── Title { text: "Alerts" }
│   │   ├── UnreadCount { count }
│   │   └── MarkAllReadButton
│   │
│   └── AlertsList/
│       └── AlertItem[]/
│           ├── AlertIcon { type: INFO|WARNING|ERROR|CRITICAL }
│           ├── AlertTitle { text }
│           ├── AlertMessage { text, expandable }
│           ├── AlertTimestamp { relative_time }
│           ├── AlertSource { module, entity_id }
│           └── AlertActions { acknowledge, dismiss, view_details }
│
├── HelpOverlay/
│   ├── ContextualHelp/
│   │   ├── CurrentScreenHelp { tips_for_active_screen }
│   │   ├── OperationHelp { specific_to_operation_type }
│   │   └── VideoTutorialLink { if_available }
│   │
│   ├── QuickReference/
│   │   ├── ScrapCodesReference
│   │   ├── DowntimeCodesReference
│   │   └── QualityStandardsReference
│   │
│   └── ContactInfo/
│       ├── SupervisorContact { name, extension }
│       ├── MaintenanceContact { extension }
│       └── QualityContact { extension }
│
└── SettingsDrawer/
    ├── DisplaySettings/
    │   ├── FontSizeSlider { min: 14, max: 24, default: 18 }
    │   ├── ContrastToggle { high_contrast_mode }
    │   └── ThemeSelector { LIGHT|DARK|AUTO }
    │
    ├── AudioSettings/
    │   ├── AlertVolumeSlider
    │   ├── ScanBeepToggle
    │   └── VoiceFeedbackToggle
    │
    ├── LanguageSettings/
    │   └── LanguageSelector { options: [EN, ES, ZH, VI, KO] }
    │
    └── PrinterSettings/
        ├── DefaultPrinter { label_printer_id }
        └── TestPrintButton
```

---

## 2. Actions — JSON

```json
{
  "actions": {
    "start_job": {
      "id": "ACT-001",
      "name": "Start Job",
      "description": "Begin work on a scheduled job",
      "trigger": "button_press|barcode_scan",
      "preconditions": [
        { "condition": "operator_logged_in", "error": "ERR-001" },
        { "condition": "work_center_assigned", "error": "ERR-002" },
        { "condition": "no_active_job", "error": "ERR-003" },
        { "condition": "job_status == SCHEDULED|RELEASED", "error": "ERR-004" },
        { "condition": "material_staged", "error": "ERR-005", "override": "supervisor" },
        { "condition": "operator_qualified", "error": "ERR-006", "override": "supervisor" }
      ],
      "input_required": [
        { "field": "work_order_id", "type": "string", "source": "scan|select" },
        { "field": "operation_id", "type": "string", "source": "auto|select" }
      ],
      "effects": [
        { "entity": "work_order", "field": "status", "value": "IN_PROGRESS" },
        { "entity": "operation", "field": "status", "value": "IN_PROGRESS" },
        { "entity": "operation", "field": "actual_start", "value": "NOW()" },
        { "entity": "operation", "field": "operator_id", "value": "CURRENT_OPERATOR" },
        { "entity": "work_center", "field": "current_job", "value": "work_order_id" }
      ],
      "events_emitted": [
        { "event": "JOB_STARTED", "payload": ["work_order_id", "operation_id", "operator_id", "work_center_id", "timestamp"] }
      ],
      "ui_feedback": {
        "success": { "toast": "Job started", "sound": "start_chime", "vibrate": true },
        "error": { "modal": true, "sound": "error_beep" }
      },
      "undo_available": true,
      "undo_window_seconds": 60
    },

    "pause_job": {
      "id": "ACT-002",
      "name": "Pause Job",
      "description": "Temporarily pause active job",
      "trigger": "button_press",
      "preconditions": [
        { "condition": "active_job_exists", "error": "ERR-010" },
        { "condition": "job_status == IN_PROGRESS", "error": "ERR-011" }
      ],
      "input_required": [
        { "field": "pause_reason", "type": "enum", "options": ["BREAK", "MATERIAL_WAIT", "SETUP", "QUALITY_CHECK", "MAINTENANCE", "OTHER"], "required": true },
        { "field": "pause_notes", "type": "string", "required_if": "reason == OTHER" },
        { "field": "estimated_resume", "type": "duration", "options": [5, 10, 15, 30, 60, 120], "required": false }
      ],
      "effects": [
        { "entity": "operation", "field": "status", "value": "PAUSED" },
        { "entity": "operation", "field": "pause_start", "value": "NOW()" },
        { "entity": "work_center", "field": "status", "value": "PAUSED" },
        { "entity": "downtime_record", "action": "create", "fields": ["reason", "start_time", "work_order_id"] }
      ],
      "events_emitted": [
        { "event": "JOB_PAUSED", "payload": ["work_order_id", "operation_id", "reason", "operator_id", "timestamp"] }
      ],
      "ui_feedback": {
        "success": { "toast": "Job paused", "show_timer": true },
        "warning_after": { "duration_minutes": 15, "message": "Job paused for extended time" }
      },
      "auto_escalate_after_minutes": 30
    },

    "resume_job": {
      "id": "ACT-003",
      "name": "Resume Job",
      "description": "Resume a paused job",
      "trigger": "button_press",
      "preconditions": [
        { "condition": "paused_job_exists", "error": "ERR-020" },
        { "condition": "job_status == PAUSED", "error": "ERR-021" },
        { "condition": "same_operator_or_handoff", "error": "ERR-022", "override": "supervisor" }
      ],
      "input_required": [],
      "effects": [
        { "entity": "operation", "field": "status", "value": "IN_PROGRESS" },
        { "entity": "operation", "field": "pause_end", "value": "NOW()" },
        { "entity": "operation", "field": "total_pause_time", "value": "INCREMENT(pause_duration)" },
        { "entity": "work_center", "field": "status", "value": "RUNNING" },
        { "entity": "downtime_record", "action": "close", "fields": ["end_time", "duration"] }
      ],
      "events_emitted": [
        { "event": "JOB_RESUMED", "payload": ["work_order_id", "operation_id", "pause_duration", "operator_id", "timestamp"] }
      ],
      "ui_feedback": {
        "success": { "toast": "Job resumed", "sound": "resume_chime" }
      }
    },

    "record_output": {
      "id": "ACT-004",
      "name": "Record Output",
      "description": "Record good pieces produced",
      "trigger": "button_press",
      "preconditions": [
        { "condition": "active_job_exists", "error": "ERR-030" },
        { "condition": "job_status == IN_PROGRESS", "error": "ERR-031" }
      ],
      "input_required": [
        { "field": "piece_count", "type": "integer", "min": 1, "required": true },
        { "field": "weight_lbs", "type": "decimal", "min": 0.01, "required": true, "source": "manual|scale" },
        { "field": "length_in", "type": "decimal", "required_if": "operation_requires_dims" },
        { "field": "width_in", "type": "decimal", "required_if": "operation_requires_dims" },
        { "field": "thickness_in", "type": "decimal", "required_if": "operation_requires_dims" },
        { "field": "output_location", "type": "location", "required": true, "source": "manual|scan" },
        { "field": "generate_labels", "type": "boolean", "default": true },
        { "field": "label_quantity", "type": "integer", "default": "piece_count" },
        { "field": "notes", "type": "string", "required": false }
      ],
      "validations": [
        { "rule": "piece_count <= remaining_quantity", "warning": "Exceeds target quantity" },
        { "rule": "weight_variance <= 10%", "warning": "Weight differs from theoretical by >10%" },
        { "rule": "dimensions_in_tolerance", "error": "Dimensions out of spec", "override": "qa" }
      ],
      "effects": [
        { "entity": "operation", "field": "completed_quantity", "value": "INCREMENT(piece_count)" },
        { "entity": "operation", "field": "completed_weight", "value": "INCREMENT(weight_lbs)" },
        { "entity": "inventory_unit", "action": "create", "inherit_heat": true },
        { "entity": "traceability_event", "action": "create" },
        { "entity": "label", "action": "print_if_requested" }
      ],
      "events_emitted": [
        { "event": "OUTPUT_RECORDED", "payload": ["work_order_id", "operation_id", "piece_count", "weight", "unit_ids", "timestamp"] }
      ],
      "ui_feedback": {
        "success": { "toast": "Output recorded: {piece_count} pcs", "sound": "success_chime", "print_confirmation": true },
        "warning": { "modal": true, "allow_continue": true }
      }
    },

    "record_scrap": {
      "id": "ACT-005",
      "name": "Record Scrap",
      "description": "Record scrapped material",
      "trigger": "button_press",
      "preconditions": [
        { "condition": "active_job_exists", "error": "ERR-040" }
      ],
      "input_required": [
        { "field": "piece_count", "type": "integer", "min": 0, "required": false },
        { "field": "weight_lbs", "type": "decimal", "min": 0.01, "required": true },
        { "field": "scrap_reason", "type": "enum", "options": "SCRAP_REASONS", "required": true },
        { "field": "scrap_sub_reason", "type": "enum", "options": "dynamic", "required_if": "has_sub_reasons" },
        { "field": "responsibility", "type": "enum", "options": ["OPERATOR", "MACHINE", "MATERIAL", "PREVIOUS_OP", "CUSTOMER_SPEC", "UNKNOWN"], "required": true },
        { "field": "defect_source_op", "type": "operation_id", "required_if": "responsibility == PREVIOUS_OP" },
        { "field": "photo", "type": "image", "required_if": "weight > 100" },
        { "field": "disposition", "type": "enum", "options": ["SCRAP_BIN", "REWORK", "DOWNGRADE", "RETURN_TO_STOCK"], "required": true },
        { "field": "notes", "type": "string", "required_if": "reason == OTHER" }
      ],
      "validations": [
        { "rule": "weight <= max_scrap_threshold", "override": "supervisor" },
        { "rule": "photo_required_if_high_value", "error": "Photo required for scrap > $X" }
      ],
      "effects": [
        { "entity": "operation", "field": "scrap_quantity", "value": "INCREMENT(piece_count)" },
        { "entity": "operation", "field": "scrap_weight", "value": "INCREMENT(weight_lbs)" },
        { "entity": "scrap_record", "action": "create" },
        { "entity": "inventory_unit", "action": "create_if_rework_or_downgrade" },
        { "entity": "traceability_event", "action": "create" },
        { "entity": "ncr", "action": "create_if_material_defect" }
      ],
      "events_emitted": [
        { "event": "SCRAP_RECORDED", "payload": ["work_order_id", "operation_id", "weight", "reason", "responsibility", "timestamp"] }
      ],
      "ui_feedback": {
        "success": { "toast": "Scrap recorded", "sound": "neutral_beep" },
        "supervisor_required": { "modal": "supervisor_override", "reason": "High value scrap" }
      }
    },

    "complete_operation": {
      "id": "ACT-006",
      "name": "Complete Operation",
      "description": "Mark current operation as complete",
      "trigger": "button_press",
      "preconditions": [
        { "condition": "active_job_exists", "error": "ERR-050" },
        { "condition": "job_status == IN_PROGRESS", "error": "ERR-051" },
        { "condition": "output_recorded", "error": "ERR-052", "override": "supervisor" },
        { "condition": "quality_check_if_required", "error": "ERR-053" }
      ],
      "input_required": [
        { "field": "confirm_quantities", "type": "boolean", "display": "summary_modal" },
        { "field": "remnant_weight", "type": "decimal", "required": false },
        { "field": "remnant_disposition", "type": "enum", "options": ["RETURN_TO_STOCK", "SCRAP", "NEXT_JOB"], "required_if": "remnant_weight > 0" },
        { "field": "remnant_location", "type": "location", "required_if": "disposition == RETURN_TO_STOCK" }
      ],
      "validations": [
        { "rule": "completed_qty >= min_required_qty", "warning": "Quantity below target" },
        { "rule": "material_accounted_for", "warning": "Material variance detected" }
      ],
      "effects": [
        { "entity": "operation", "field": "status", "value": "COMPLETED" },
        { "entity": "operation", "field": "actual_end", "value": "NOW()" },
        { "entity": "work_center", "field": "current_job", "value": "null" },
        { "entity": "work_center", "field": "status", "value": "IDLE" },
        { "entity": "work_order", "field": "status", "value": "next_operation_or_complete" },
        { "entity": "remnant", "action": "create_if_exists" },
        { "entity": "traceability_event", "action": "create" }
      ],
      "events_emitted": [
        { "event": "OPERATION_COMPLETED", "payload": ["work_order_id", "operation_id", "final_quantity", "final_weight", "duration", "timestamp"] },
        { "event": "WORK_ORDER_COMPLETED", "condition": "last_operation", "payload": ["work_order_id", "total_duration", "timestamp"] }
      ],
      "post_actions": [
        { "action": "auto_start_next_job", "condition": "queue_not_empty AND auto_advance_enabled" },
        { "action": "trigger_quality_inspection", "condition": "inspection_plan_requires" },
        { "action": "notify_next_work_center", "condition": "has_subsequent_operation" }
      ],
      "ui_feedback": {
        "success": { "modal": "completion_summary", "sound": "completion_fanfare", "confetti": "if_shift_record" }
      }
    },

    "record_remnant": {
      "id": "ACT-007",
      "name": "Record Remnant",
      "description": "Record leftover material from job",
      "trigger": "button_press|auto_prompt",
      "preconditions": [
        { "condition": "active_job_exists_or_completing", "error": "ERR-060" }
      ],
      "input_required": [
        { "field": "remnant_type", "type": "enum", "options": ["SKELETON", "DROP", "OFFCUT", "PARTIAL_COIL"], "required": true },
        { "field": "weight_lbs", "type": "decimal", "required": true, "source": "manual|scale" },
        { "field": "dimensions", "type": "object", "fields": ["length", "width", "thickness"], "required_if": "type != SKELETON" },
        { "field": "usable", "type": "boolean", "required": true },
        { "field": "disposition", "type": "enum", "options": ["RETURN_TO_STOCK", "SCRAP", "HOLD_FOR_REVIEW"], "required": true },
        { "field": "location", "type": "location", "required_if": "disposition == RETURN_TO_STOCK" },
        { "field": "generate_label", "type": "boolean", "default": true }
      ],
      "effects": [
        { "entity": "remnant", "action": "create", "inherit_heat": true, "inherit_mtc": true },
        { "entity": "inventory_unit", "action": "create_if_usable" },
        { "entity": "traceability_event", "action": "create" }
      ],
      "events_emitted": [
        { "event": "REMNANT_RECORDED", "payload": ["work_order_id", "remnant_id", "weight", "disposition", "timestamp"] }
      ]
    },

    "flag_quality_issue": {
      "id": "ACT-008",
      "name": "Flag Quality Issue",
      "description": "Operator reports quality concern",
      "trigger": "button_press",
      "preconditions": [],
      "input_required": [
        { "field": "issue_type", "type": "enum", "options": ["MATERIAL_DEFECT", "DIMENSION_ISSUE", "SURFACE_DEFECT", "PROCESS_ISSUE", "EQUIPMENT_ISSUE", "OTHER"], "required": true },
        { "field": "severity", "type": "enum", "options": ["MINOR", "MAJOR", "CRITICAL"], "required": true },
        { "field": "description", "type": "string", "required": true },
        { "field": "photos", "type": "image[]", "min": 1, "required": true },
        { "field": "affected_pieces", "type": "integer", "required": false },
        { "field": "stop_production", "type": "boolean", "default": false }
      ],
      "effects": [
        { "entity": "quality_flag", "action": "create" },
        { "entity": "operation", "field": "status", "value": "HOLD", "condition": "stop_production == true" },
        { "entity": "notification", "action": "send_to_qa" }
      ],
      "events_emitted": [
        { "event": "QUALITY_ISSUE_FLAGGED", "payload": ["work_order_id", "issue_type", "severity", "operator_id", "timestamp"] }
      ],
      "escalation": {
        "MINOR": { "notify": ["qa_inspector"], "sla_minutes": 120 },
        "MAJOR": { "notify": ["qa_inspector", "supervisor"], "sla_minutes": 30 },
        "CRITICAL": { "notify": ["qa_inspector", "supervisor", "qa_manager"], "sla_minutes": 15, "auto_hold": true }
      }
    },

    "request_maintenance": {
      "id": "ACT-009",
      "name": "Request Maintenance",
      "description": "Submit maintenance request for work center",
      "trigger": "button_press",
      "preconditions": [
        { "condition": "work_center_assigned", "error": "ERR-070" }
      ],
      "input_required": [
        { "field": "urgency", "type": "enum", "options": ["ROUTINE", "SOON", "URGENT", "EMERGENCY"], "required": true },
        { "field": "issue_type", "type": "enum", "options": ["MECHANICAL", "ELECTRICAL", "HYDRAULIC", "PNEUMATIC", "CONTROL", "SAFETY", "OTHER"], "required": true },
        { "field": "description", "type": "string", "required": true },
        { "field": "photos", "type": "image[]", "required": false },
        { "field": "machine_running", "type": "boolean", "required": true },
        { "field": "can_continue", "type": "boolean", "required": true }
      ],
      "effects": [
        { "entity": "maintenance_request", "action": "create" },
        { "entity": "work_center", "field": "status", "value": "DEGRADED", "condition": "can_continue == true" },
        { "entity": "work_center", "field": "status", "value": "DOWN", "condition": "can_continue == false" },
        { "entity": "notification", "action": "send_to_maintenance" }
      ],
      "events_emitted": [
        { "event": "MAINTENANCE_REQUESTED", "payload": ["work_center_id", "urgency", "issue_type", "operator_id", "timestamp"] }
      ],
      "escalation": {
        "ROUTINE": { "notify": ["maintenance_tech"], "sla_hours": 24 },
        "SOON": { "notify": ["maintenance_tech"], "sla_hours": 4 },
        "URGENT": { "notify": ["maintenance_tech", "maintenance_lead"], "sla_minutes": 60 },
        "EMERGENCY": { "notify": ["maintenance_tech", "maintenance_lead", "plant_manager"], "sla_minutes": 15, "page": true }
      }
    },

    "start_break": {
      "id": "ACT-010",
      "name": "Start Break",
      "description": "Operator starts scheduled or personal break",
      "trigger": "button_press",
      "preconditions": [],
      "input_required": [
        { "field": "break_type", "type": "enum", "options": ["SCHEDULED_BREAK", "LUNCH", "PERSONAL", "RESTROOM"], "required": true }
      ],
      "effects": [
        { "entity": "operation", "action": "pause_if_active", "reason": "BREAK" },
        { "entity": "break_record", "action": "create" },
        { "entity": "operator_status", "field": "status", "value": "ON_BREAK" }
      ],
      "events_emitted": [
        { "event": "BREAK_STARTED", "payload": ["operator_id", "break_type", "work_center_id", "timestamp"] }
      ],
      "constraints": {
        "max_duration_by_type": {
          "SCHEDULED_BREAK": 15,
          "LUNCH": 30,
          "PERSONAL": 10,
          "RESTROOM": 10
        },
        "warning_at_pct": 80,
        "escalate_at_pct": 150
      }
    },

    "end_break": {
      "id": "ACT-011",
      "name": "End Break",
      "description": "Operator returns from break",
      "trigger": "button_press|badge_scan",
      "preconditions": [
        { "condition": "operator_on_break", "error": "ERR-080" }
      ],
      "effects": [
        { "entity": "break_record", "field": "end_time", "value": "NOW()" },
        { "entity": "operator_status", "field": "status", "value": "ACTIVE" },
        { "entity": "operation", "action": "auto_resume_if_was_active" }
      ],
      "events_emitted": [
        { "event": "BREAK_ENDED", "payload": ["operator_id", "break_duration", "timestamp"] }
      ]
    },

    "shift_handoff": {
      "id": "ACT-012",
      "name": "Shift Handoff",
      "description": "Transfer work center responsibility to next operator",
      "trigger": "button_press",
      "preconditions": [
        { "condition": "operator_logged_in", "error": "ERR-090" },
        { "condition": "incoming_operator_badged", "error": "ERR-091" }
      ],
      "input_required": [
        { "field": "incoming_operator_badge", "type": "badge_scan", "required": true },
        { "field": "incoming_operator_pin", "type": "pin", "required": true },
        { "field": "handoff_notes", "type": "string", "required": false },
        { "field": "open_issues_acknowledged", "type": "boolean", "required_if": "has_open_issues" }
      ],
      "effects": [
        { "entity": "shift_record", "action": "close_outgoing" },
        { "entity": "shift_record", "action": "open_incoming" },
        { "entity": "work_center", "field": "current_operator", "value": "incoming_operator_id" },
        { "entity": "handoff_record", "action": "create" }
      ],
      "events_emitted": [
        { "event": "SHIFT_HANDOFF", "payload": ["work_center_id", "outgoing_operator", "incoming_operator", "handoff_notes", "timestamp"] }
      ],
      "data_transferred": [
        "active_job_state",
        "queue_state",
        "open_issues",
        "machine_status",
        "shift_metrics"
      ]
    }
  },

  "scrap_reasons": [
    { "code": "SCR-001", "reason": "Dimension Out of Tolerance", "sub_reasons": ["Length", "Width", "Thickness", "Squareness", "Flatness"] },
    { "code": "SCR-002", "reason": "Surface Defect", "sub_reasons": ["Scratch", "Dent", "Rust", "Scale", "Pit", "Roll Mark"] },
    { "code": "SCR-003", "reason": "Edge Defect", "sub_reasons": ["Burr", "Wave", "Crack", "Camber"] },
    { "code": "SCR-004", "reason": "Material Defect", "sub_reasons": ["Inclusion", "Lamination", "Porosity", "Segregation"] },
    { "code": "SCR-005", "reason": "Setup Error", "sub_reasons": ["Wrong Program", "Wrong Tooling", "Wrong Material"] },
    { "code": "SCR-006", "reason": "Operator Error", "sub_reasons": ["Incorrect Measurement", "Incorrect Setting", "Handling Damage"] },
    { "code": "SCR-007", "reason": "Machine Malfunction", "sub_reasons": ["Blade Failure", "Hydraulic Issue", "Control Error"] },
    { "code": "SCR-008", "reason": "First Piece / Setup Scrap", "sub_reasons": [] },
    { "code": "SCR-009", "reason": "End of Coil / Material", "sub_reasons": [] },
    { "code": "SCR-010", "reason": "Customer Spec Change", "sub_reasons": [] },
    { "code": "SCR-099", "reason": "Other", "sub_reasons": [], "requires_notes": true }
  ],

  "downtime_categories": [
    { "code": "DT-001", "category": "Planned Downtime", "sub_categories": ["Scheduled Maintenance", "Tooling Change", "Material Change", "Shift Change"] },
    { "code": "DT-002", "category": "Unplanned Machine", "sub_categories": ["Mechanical Failure", "Electrical Failure", "Hydraulic Failure", "Control System", "Safety Interlock"] },
    { "code": "DT-003", "category": "Material Wait", "sub_categories": ["Waiting for Material", "Material Handling", "Crane Wait", "Forklift Wait"] },
    { "code": "DT-004", "category": "Quality Hold", "sub_categories": ["Inspection Wait", "Rework", "NCR Investigation"] },
    { "code": "DT-005", "category": "Labor", "sub_categories": ["No Operator", "Training", "Meeting", "Break Overrun"] },
    { "code": "DT-006", "category": "Changeover", "sub_categories": ["Gauge Change", "Width Change", "Product Change", "Tooling Setup"] },
    { "code": "DT-007", "category": "External", "sub_categories": ["Power Outage", "Utility Failure", "Weather", "Emergency Drill"] },
    { "code": "DT-099", "category": "Other", "sub_categories": [], "requires_notes": true }
  ]
}
```

---

## 3. I/O Data — JSON

```json
{
  "io_data": {
    "measurement_inputs": {
      "weight_measurement": {
        "id": "IO-001",
        "name": "Weight Measurement",
        "data_type": "decimal",
        "unit": "LBS",
        "precision": 2,
        "min_value": 0.01,
        "max_value": 100000,
        "input_sources": [
          { "source": "manual", "description": "Manual entry via keypad" },
          { "source": "scale", "protocol": "serial|tcp", "device_types": ["floor_scale", "crane_scale", "bench_scale"] },
          { "source": "calculated", "formula": "pieces * theoretical_piece_weight" }
        ],
        "validation": {
          "variance_warning_pct": 5,
          "variance_error_pct": 15,
          "reference": "theoretical_weight"
        },
        "recording": {
          "frequency": "per_output_event",
          "aggregation": "sum_per_operation"
        }
      },

      "length_measurement": {
        "id": "IO-002",
        "name": "Length Measurement",
        "data_type": "decimal",
        "unit": "IN",
        "precision": 3,
        "min_value": 0.125,
        "max_value": 2400,
        "input_sources": [
          { "source": "manual", "description": "Manual entry via keypad" },
          { "source": "tape_measure", "protocol": "bluetooth", "device_types": ["digital_tape"] },
          { "source": "encoder", "protocol": "plc", "description": "Machine encoder readout" }
        ],
        "validation": {
          "tolerance_check": true,
          "tolerance_source": "operation.target_length_tolerance",
          "out_of_spec_action": "warn_and_flag"
        },
        "recording": {
          "frequency": "per_quality_check|per_piece_if_critical",
          "sample_plan": "first_piece, every_nth, last_piece"
        }
      },

      "width_measurement": {
        "id": "IO-003",
        "name": "Width Measurement",
        "data_type": "decimal",
        "unit": "IN",
        "precision": 4,
        "min_value": 0.5,
        "max_value": 144,
        "input_sources": [
          { "source": "manual", "description": "Manual entry via keypad" },
          { "source": "caliper", "protocol": "bluetooth", "device_types": ["digital_caliper"] },
          { "source": "laser_gauge", "protocol": "tcp", "device_types": ["non_contact_gauge"] }
        ],
        "validation": {
          "tolerance_check": true,
          "tolerance_source": "operation.target_width_tolerance"
        }
      },

      "thickness_measurement": {
        "id": "IO-004",
        "name": "Thickness Measurement",
        "data_type": "decimal",
        "unit": "IN",
        "precision": 4,
        "min_value": 0.005,
        "max_value": 12,
        "input_sources": [
          { "source": "manual", "description": "Manual entry via keypad" },
          { "source": "micrometer", "protocol": "bluetooth", "device_types": ["digital_micrometer"] },
          { "source": "ultrasonic", "protocol": "serial", "device_types": ["ut_gauge"] }
        ],
        "validation": {
          "tolerance_check": true,
          "tolerance_source": "operation.target_thickness_tolerance"
        }
      },

      "piece_count": {
        "id": "IO-005",
        "name": "Piece Count",
        "data_type": "integer",
        "min_value": 0,
        "max_value": 100000,
        "input_sources": [
          { "source": "manual", "description": "Manual entry via keypad/increment buttons" },
          { "source": "counter", "protocol": "plc", "description": "Machine piece counter" },
          { "source": "barcode_count", "description": "Count of labels scanned" }
        ],
        "validation": {
          "max_per_entry": "remaining_quantity * 1.1",
          "warn_if_exceeds_target": true
        }
      },

      "bundle_count": {
        "id": "IO-006",
        "name": "Bundle/Package Count",
        "data_type": "integer",
        "min_value": 1,
        "max_value": 1000,
        "derived_from": "piece_count / pieces_per_bundle"
      },

      "coil_weight": {
        "id": "IO-007",
        "name": "Coil Weight",
        "data_type": "decimal",
        "unit": "LBS",
        "precision": 0,
        "min_value": 100,
        "max_value": 60000,
        "input_sources": [
          { "source": "scale", "protocol": "serial", "device_types": ["coil_scale", "crane_scale"] },
          { "source": "tag", "description": "From coil tag/label" }
        ]
      },

      "temperature": {
        "id": "IO-008",
        "name": "Temperature",
        "data_type": "decimal",
        "unit": "°F",
        "precision": 1,
        "min_value": -40,
        "max_value": 1000,
        "input_sources": [
          { "source": "manual", "description": "Manual entry" },
          { "source": "infrared", "protocol": "bluetooth", "device_types": ["ir_thermometer"] },
          { "source": "thermocouple", "protocol": "plc" }
        ],
        "context": ["material_temp", "ambient_temp", "machine_temp"]
      },

      "hardness": {
        "id": "IO-009",
        "name": "Hardness Reading",
        "data_type": "decimal",
        "scales": ["HRB", "HRC", "BHN"],
        "input_sources": [
          { "source": "manual", "description": "Manual entry from test" },
          { "source": "hardness_tester", "protocol": "serial" }
        ]
      }
    },

    "scrap_data": {
      "schema": {
        "id": "uuid",
        "work_order_id": "string",
        "operation_id": "string",
        "timestamp": "datetime",
        "operator_id": "string",
        "work_center_id": "string",
        "piece_count": "integer|null",
        "weight_lbs": "decimal",
        "theoretical_value_usd": "decimal",
        "reason_code": "string",
        "reason_description": "string",
        "sub_reason_code": "string|null",
        "sub_reason_description": "string|null",
        "responsibility": "enum:OPERATOR|MACHINE|MATERIAL|PREVIOUS_OP|CUSTOMER_SPEC|UNKNOWN",
        "responsible_operation_id": "string|null",
        "disposition": "enum:SCRAP_BIN|REWORK|DOWNGRADE|RETURN_TO_STOCK",
        "disposition_location": "string|null",
        "photo_urls": "string[]",
        "notes": "string|null",
        "supervisor_override": {
          "required": "boolean",
          "approved_by": "string|null",
          "approved_at": "datetime|null",
          "justification": "string|null"
        },
        "ncr_id": "string|null",
        "heat_number": "string",
        "material_grade": "string",
        "source_coil_tag": "string|null",
        "source_unit_id": "string|null"
      },
      
      "aggregations": {
        "by_shift": {
          "dimensions": ["shift_id", "work_center_id"],
          "metrics": ["total_weight", "total_pieces", "total_value", "scrap_rate_pct"]
        },
        "by_reason": {
          "dimensions": ["reason_code", "sub_reason_code"],
          "metrics": ["count", "total_weight", "total_value"],
          "period": "day|week|month"
        },
        "by_responsibility": {
          "dimensions": ["responsibility", "operator_id|work_center_id"],
          "metrics": ["count", "total_weight", "total_value"]
        },
        "pareto": {
          "ranking": "by_value_desc",
          "cumulative_pct": true,
          "threshold": 80
        }
      },

      "alerts": {
        "single_event_threshold": { "weight_lbs": 500, "value_usd": 1000 },
        "shift_rate_threshold": { "scrap_rate_pct": 3.0 },
        "consecutive_events": { "count": 3, "window_minutes": 60 }
      }
    },

    "output_data": {
      "schema": {
        "id": "uuid",
        "work_order_id": "string",
        "operation_id": "string",
        "timestamp": "datetime",
        "operator_id": "string",
        "work_center_id": "string",
        "piece_count": "integer",
        "weight_lbs": "decimal",
        "theoretical_weight_lbs": "decimal",
        "weight_variance_pct": "decimal",
        "dimensions": {
          "length_in": "decimal|null",
          "width_in": "decimal|null",
          "thickness_in": "decimal|null"
        },
        "dimension_in_tolerance": "boolean",
        "output_location": {
          "bay": "string",
          "row": "string",
          "position": "string"
        },
        "labels_generated": "integer",
        "label_ids": "string[]",
        "unit_ids": "string[]",
        "heat_number": "string",
        "source_coil_tag": "string|null",
        "source_unit_id": "string|null",
        "notes": "string|null",
        "photos": "string[]",
        "quality_status": "enum:PENDING|PASSED|FAILED|HOLD"
      }
    },

    "remnant_data": {
      "schema": {
        "id": "uuid",
        "work_order_id": "string",
        "operation_id": "string",
        "timestamp": "datetime",
        "operator_id": "string",
        "remnant_type": "enum:SKELETON|DROP|OFFCUT|PARTIAL_COIL",
        "weight_lbs": "decimal",
        "dimensions": {
          "length_in": "decimal|null",
          "width_in": "decimal|null",
          "thickness_in": "decimal|null",
          "od_in": "decimal|null",
          "id_in": "decimal|null"
        },
        "usable": "boolean",
        "usable_for": "string[]|null",
        "disposition": "enum:RETURN_TO_STOCK|SCRAP|HOLD_FOR_REVIEW",
        "location": "string|null",
        "heat_number": "string",
        "material_grade": "string",
        "mtc_reference": "string|null",
        "label_id": "string|null",
        "inventory_unit_id": "string|null"
      }
    },

    "machine_data": {
      "plc_inputs": [
        { "tag": "machine_running", "type": "boolean", "poll_ms": 1000 },
        { "tag": "cycle_count", "type": "integer", "poll_ms": 1000 },
        { "tag": "speed_fpm", "type": "decimal", "poll_ms": 1000 },
        { "tag": "tonnage", "type": "decimal", "poll_ms": 100 },
        { "tag": "hydraulic_pressure_psi", "type": "decimal", "poll_ms": 5000 },
        { "tag": "motor_amps", "type": "decimal", "poll_ms": 5000 },
        { "tag": "fault_code", "type": "integer", "poll_ms": 500 },
        { "tag": "fault_active", "type": "boolean", "poll_ms": 500 },
        { "tag": "blade_stroke_count", "type": "integer", "poll_ms": 1000 },
        { "tag": "encoder_position", "type": "decimal", "poll_ms": 100 }
      ],
      "derived_metrics": [
        { "name": "oee", "formula": "availability * performance * quality", "calc_interval": "shift" },
        { "name": "uptime_pct", "formula": "run_time / available_time * 100", "calc_interval": "shift" },
        { "name": "throughput_lph", "formula": "total_weight / run_hours", "calc_interval": "hour" }
      ]
    },

    "label_data": {
      "schema": {
        "label_id": "uuid",
        "label_type": "enum:PIECE|BUNDLE|COIL|REMNANT",
        "barcode_value": "string",
        "barcode_format": "enum:CODE128|QR|DATAMATRIX",
        "print_timestamp": "datetime",
        "printer_id": "string",
        "template_id": "string",
        "fields": {
          "customer_name": "string",
          "customer_po": "string",
          "sales_order": "string",
          "work_order": "string",
          "product_description": "string",
          "dimensions": "string",
          "weight": "string",
          "piece_number": "string",
          "heat_number": "string",
          "grade": "string",
          "mtr_statement": "string|null"
        }
      }
    }
  }
}
```

---

## 4. Event Log — Schema

```json
{
  "event_log_schema": {
    "table_name": "shop_floor_events",
    
    "columns": [
      { "name": "id", "type": "uuid", "primary_key": true, "default": "gen_random_uuid()" },
      { "name": "event_type", "type": "varchar(50)", "not_null": true, "indexed": true },
      { "name": "event_category", "type": "varchar(30)", "not_null": true, "indexed": true },
      { "name": "timestamp", "type": "timestamptz", "not_null": true, "default": "now()", "indexed": true },
      { "name": "sequence_number", "type": "bigserial", "not_null": true },
      
      { "name": "operator_id", "type": "uuid", "foreign_key": "employees.id", "indexed": true },
      { "name": "operator_name", "type": "varchar(100)", "denormalized": true },
      { "name": "work_center_id", "type": "uuid", "foreign_key": "work_centers.id", "indexed": true },
      { "name": "work_center_name", "type": "varchar(50)", "denormalized": true },
      
      { "name": "work_order_id", "type": "uuid", "foreign_key": "work_orders.id", "indexed": true },
      { "name": "work_order_number", "type": "varchar(20)", "denormalized": true },
      { "name": "operation_id", "type": "uuid", "foreign_key": "operations.id", "indexed": true },
      { "name": "operation_sequence", "type": "integer" },
      
      { "name": "sales_order_id", "type": "uuid", "foreign_key": "sales_orders.id", "indexed": true },
      { "name": "customer_id", "type": "uuid", "foreign_key": "customers.id", "indexed": true },
      
      { "name": "shift_id", "type": "uuid", "foreign_key": "shifts.id", "indexed": true },
      
      { "name": "event_data", "type": "jsonb", "not_null": true },
      { "name": "previous_state", "type": "jsonb" },
      { "name": "new_state", "type": "jsonb" },
      
      { "name": "duration_seconds", "type": "integer", "comment": "For events with duration" },
      { "name": "quantity", "type": "decimal(12,3)" },
      { "name": "weight_lbs", "type": "decimal(12,2)" },
      
      { "name": "device_id", "type": "varchar(50)", "comment": "Terminal/device generating event" },
      { "name": "ip_address", "type": "inet" },
      { "name": "user_agent", "type": "text" },
      
      { "name": "correlation_id", "type": "uuid", "indexed": true, "comment": "Links related events" },
      { "name": "causation_id", "type": "uuid", "indexed": true, "comment": "Event that caused this event" },
      
      { "name": "tenant_id", "type": "uuid", "not_null": true, "indexed": true }
    ],
    
    "indexes": [
      { "name": "idx_events_type_time", "columns": ["event_type", "timestamp DESC"] },
      { "name": "idx_events_work_order", "columns": ["work_order_id", "timestamp"] },
      { "name": "idx_events_operator_shift", "columns": ["operator_id", "shift_id"] },
      { "name": "idx_events_work_center_time", "columns": ["work_center_id", "timestamp DESC"] },
      { "name": "idx_events_correlation", "columns": ["correlation_id"] },
      { "name": "idx_events_data_gin", "columns": ["event_data"], "type": "gin" }
    ],
    
    "partitioning": {
      "type": "range",
      "column": "timestamp",
      "interval": "1 month",
      "retention": "24 months"
    },

    "event_types": {
      "operator_events": [
        "OPERATOR_LOGIN",
        "OPERATOR_LOGOUT",
        "OPERATOR_WORK_CENTER_ASSIGNED",
        "OPERATOR_WORK_CENTER_RELEASED"
      ],
      "job_events": [
        "JOB_STARTED",
        "JOB_PAUSED",
        "JOB_RESUMED",
        "JOB_COMPLETED",
        "JOB_CANCELLED",
        "JOB_HELD",
        "JOB_RELEASED_FROM_HOLD"
      ],
      "operation_events": [
        "OPERATION_STARTED",
        "OPERATION_PAUSED",
        "OPERATION_RESUMED",
        "OPERATION_COMPLETED"
      ],
      "output_events": [
        "OUTPUT_RECORDED",
        "OUTPUT_ADJUSTED",
        "SCRAP_RECORDED",
        "REMNANT_RECORDED"
      ],
      "quality_events": [
        "QUALITY_CHECK_STARTED",
        "QUALITY_CHECK_COMPLETED",
        "QUALITY_ISSUE_FLAGGED",
        "QUALITY_HOLD_APPLIED",
        "QUALITY_HOLD_RELEASED"
      ],
      "machine_events": [
        "MACHINE_STARTED",
        "MACHINE_STOPPED",
        "MACHINE_FAULT",
        "MACHINE_FAULT_CLEARED",
        "MACHINE_PARAMETER_CHANGED"
      ],
      "downtime_events": [
        "DOWNTIME_STARTED",
        "DOWNTIME_ENDED",
        "DOWNTIME_CATEGORY_UPDATED"
      ],
      "maintenance_events": [
        "MAINTENANCE_REQUESTED",
        "MAINTENANCE_ACKNOWLEDGED",
        "MAINTENANCE_STARTED",
        "MAINTENANCE_COMPLETED"
      ],
      "material_events": [
        "MATERIAL_STAGED",
        "MATERIAL_CONSUMED",
        "MATERIAL_RETURNED"
      ],
      "label_events": [
        "LABEL_PRINTED",
        "LABEL_REPRINTED",
        "LABEL_VOIDED"
      ],
      "shift_events": [
        "SHIFT_STARTED",
        "SHIFT_ENDED",
        "SHIFT_HANDOFF",
        "BREAK_STARTED",
        "BREAK_ENDED"
      ],
      "override_events": [
        "SUPERVISOR_OVERRIDE_REQUESTED",
        "SUPERVISOR_OVERRIDE_APPROVED",
        "SUPERVISOR_OVERRIDE_REJECTED"
      ]
    },

    "event_data_examples": {
      "JOB_STARTED": {
        "work_order_id": "uuid",
        "operation_id": "uuid",
        "operation_type": "SHEAR",
        "material_id": "uuid",
        "heat_number": "H12345",
        "target_quantity": 100,
        "target_weight_lbs": 5000,
        "priority": "RUSH",
        "customer_name": "ABC Steel"
      },
      "OUTPUT_RECORDED": {
        "piece_count": 25,
        "weight_lbs": 1250.5,
        "theoretical_weight_lbs": 1260.0,
        "variance_pct": -0.75,
        "dimensions": { "length": 48.0, "width": 24.0, "thickness": 0.125 },
        "in_tolerance": true,
        "output_location": "A-12-3",
        "labels_printed": 25,
        "label_ids": ["uuid1", "uuid2"],
        "unit_ids": ["uuid1", "uuid2"]
      },
      "SCRAP_RECORDED": {
        "piece_count": 2,
        "weight_lbs": 50.25,
        "value_usd": 125.50,
        "reason_code": "SCR-001",
        "reason": "Dimension Out of Tolerance",
        "sub_reason": "Length",
        "responsibility": "MACHINE",
        "disposition": "SCRAP_BIN",
        "photo_count": 1,
        "supervisor_override": false
      },
      "DOWNTIME_STARTED": {
        "category_code": "DT-002",
        "category": "Unplanned Machine",
        "sub_category": "Hydraulic Failure",
        "description": "Hydraulic line leak on left side",
        "estimated_duration_minutes": 60,
        "maintenance_requested": true,
        "can_continue": false
      },
      "SHIFT_HANDOFF": {
        "outgoing_operator_id": "uuid",
        "outgoing_operator_name": "John Smith",
        "incoming_operator_id": "uuid",
        "incoming_operator_name": "Jane Doe",
        "active_job": {
          "work_order_id": "uuid",
          "progress_pct": 65,
          "pieces_remaining": 35
        },
        "queue_depth": 5,
        "open_issues": 1,
        "handoff_notes": "Watch hydraulic pressure on job ABC"
      }
    }
  }
}
```

---

## 5. Error Cases — Table

| Error Code | Error Name | Trigger Condition | User Message | Severity | Recovery Action | Requires Override | Logging Level |
|------------|-----------|-------------------|--------------|----------|-----------------|-------------------|---------------|
| ERR-001 | Not Logged In | Operator not authenticated | "Please scan your badge and enter PIN" | BLOCKING | Show login screen | No | WARN |
| ERR-002 | No Work Center | Operator not assigned to work center | "Please select a work center" | BLOCKING | Show work center selection | No | WARN |
| ERR-003 | Job Already Active | Attempting to start job when one is running | "Complete or pause current job first" | BLOCKING | Show current job | No | INFO |
| ERR-004 | Invalid Job Status | Job not in startable state | "Job is not ready to start (Status: {status})" | BLOCKING | Contact supervisor | Supervisor | WARN |
| ERR-005 | Material Not Staged | Material not at work center | "Material not staged. Location: {location}" | WARNING | Allow override | Supervisor | WARN |
| ERR-006 | Operator Not Qualified | Operator lacks certification | "Certification required: {cert_name}" | BLOCKING | Assign qualified operator | Supervisor | WARN |
| ERR-010 | No Active Job | Pause requested with no active job | "No active job to pause" | INFO | Ignore | No | DEBUG |
| ERR-011 | Job Not In Progress | Pause on non-running job | "Job is not currently running" | INFO | Show current state | No | DEBUG |
| ERR-020 | No Paused Job | Resume requested with no paused job | "No paused job to resume" | INFO | Ignore | No | DEBUG |
| ERR-021 | Job Not Paused | Resume on non-paused job | "Job is not currently paused" | INFO | Show current state | No | DEBUG |
| ERR-022 | Different Operator | Different operator attempting resume | "Job was paused by {operator}. Handoff required." | WARNING | Initiate handoff | Supervisor | WARN |
| ERR-030 | No Active Job for Output | Recording output without active job | "Start a job before recording output" | BLOCKING | Show job selection | No | WARN |
| ERR-031 | Job Not Running for Output | Recording output on non-running job | "Resume job before recording output" | BLOCKING | Show resume prompt | No | WARN |
| ERR-032 | Invalid Piece Count | Piece count <= 0 or exceeds maximum | "Invalid piece count. Enter 1-{max}" | VALIDATION | Re-enter value | No | DEBUG |
| ERR-033 | Invalid Weight | Weight <= 0 or exceeds maximum | "Invalid weight. Enter 0.01-{max} lbs" | VALIDATION | Re-enter value | No | DEBUG |
| ERR-034 | Weight Variance High | Weight differs >15% from theoretical | "Weight variance {pct}% exceeds threshold" | WARNING | Confirm or re-weigh | Supervisor if >25% | WARN |
| ERR-035 | Dimension Out of Spec | Measurement outside tolerance | "{dimension} out of tolerance: {value} (spec: {spec})" | WARNING | Flag quality issue | QA | WARN |
| ERR-036 | Quantity Exceeds Target | Recorded qty exceeds order qty | "Quantity exceeds target by {delta}" | WARNING | Confirm | No | INFO |
| ERR-037 | Invalid Location | Output location not found | "Location {location} not found" | VALIDATION | Re-enter location | No | DEBUG |
| ERR-040 | Scrap Reason Required | No scrap reason selected | "Please select a scrap reason" | VALIDATION | Select reason | No | DEBUG |
| ERR-041 | High Value Scrap | Scrap value exceeds threshold | "Scrap value ${value} requires supervisor approval" | APPROVAL | Get supervisor approval | Supervisor | WARN |
| ERR-042 | Photo Required | Photo required but not provided | "Photo required for scrap > {threshold} lbs" | VALIDATION | Capture photo | No | DEBUG |
| ERR-050 | Cannot Complete - No Output | Completing operation with no output | "Record output before completing operation" | BLOCKING | Record output | Supervisor | WARN |
| ERR-051 | Cannot Complete - Below Target | Completed qty below minimum | "Only {pct}% of target completed. Continue?" | WARNING | Confirm or continue | Supervisor | WARN |
| ERR-052 | Cannot Complete - Quality Pending | Quality check required but not done | "Complete quality check before finishing" | BLOCKING | Complete inspection | QA | WARN |
| ERR-053 | Material Variance | Material in ≠ material out | "Material variance: {delta} lbs unaccounted" | WARNING | Record remnant/scrap | Supervisor | WARN |
| ERR-060 | Scale Communication Error | Cannot read from scale | "Scale not responding. Enter weight manually." | RECOVERABLE | Manual entry | No | ERROR |
| ERR-061 | Scale Out of Range | Weight exceeds scale capacity | "Weight exceeds scale capacity ({max} lbs)" | ERROR | Use different scale | No | WARN |
| ERR-062 | Measurement Device Error | Bluetooth device not connected | "{device} not connected. Pair device or enter manually." | RECOVERABLE | Manual entry | No | WARN |
| ERR-070 | Printer Error | Label printer not responding | "Printer {printer} not responding" | RECOVERABLE | Select different printer | No | ERROR |
| ERR-071 | Printer Out of Labels | Label stock empty | "Printer {printer} out of labels" | RECOVERABLE | Reload or select different | No | WARN |
| ERR-072 | Printer Out of Ribbon | Ribbon depleted | "Printer {printer} out of ribbon" | RECOVERABLE | Replace ribbon | No | WARN |
| ERR-080 | Barcode Scan Failed | Barcode not recognized | "Barcode not recognized. Try again or enter manually." | RECOVERABLE | Re-scan or manual | No | DEBUG |
| ERR-081 | Invalid Barcode | Barcode format invalid | "Invalid barcode format" | VALIDATION | Re-scan | No | DEBUG |
| ERR-082 | Barcode Not Found | Barcode not in system | "Item {barcode} not found in system" | ERROR | Contact supervisor | No | WARN |
| ERR-090 | Handoff Badge Required | Incoming operator not scanned | "Incoming operator must scan badge" | BLOCKING | Scan badge | No | DEBUG |
| ERR-091 | Handoff PIN Failed | Incoming operator PIN incorrect | "Incorrect PIN. Try again." | BLOCKING | Re-enter PIN | No | WARN |
| ERR-092 | Self Handoff | Same operator attempting handoff | "Cannot hand off to yourself" | ERROR | Different operator | No | WARN |
| ERR-100 | Session Timeout | No activity for extended period | "Session expired. Please log in again." | BLOCKING | Re-authenticate | No | INFO |
| ERR-101 | Concurrent Login | Operator logged in elsewhere | "Already logged in at {work_center}. Log out there first?" | WARNING | Force logout option | No | WARN |
| ERR-110 | Network Error | API call failed | "Connection error. Retrying..." | RECOVERABLE | Auto-retry | No | ERROR |
| ERR-111 | Offline Mode | Extended network outage | "Working offline. Data will sync when connected." | WARNING | Queue locally | No | ERROR |
| ERR-112 | Sync Conflict | Offline data conflicts with server | "Data conflict detected. Review required." | ERROR | Show conflict resolution | Supervisor | ERROR |
| ERR-120 | Machine Fault | PLC reports fault condition | "Machine fault: {fault_description}. Clear before continuing." | BLOCKING | Clear fault | Maintenance | ERROR |
| ERR-121 | Safety Interlock | Safety device triggered | "Safety interlock active. Do not override." | CRITICAL | Contact maintenance | Safety team only | CRITICAL |
| ERR-122 | Emergency Stop | E-stop activated | "Emergency stop activated" | CRITICAL | Physical reset required | Maintenance | CRITICAL |
| ERR-130 | Unauthorized Action | User lacks permission | "You do not have permission for this action" | BLOCKING | Contact supervisor | Higher role | WARN |
| ERR-131 | Override Denied | Supervisor rejected override | "Override request denied: {reason}" | BLOCKING | Contact management | No | WARN |
| ERR-132 | Override Expired | Override timeout | "Override approval expired. Request again." | BLOCKING | Re-request | No | INFO |
| ERR-140 | Duplicate Entry | Same data submitted twice | "This output was already recorded" | WARNING | Verify | No | WARN |
| ERR-141 | Stale Data | Screen data outdated | "Data has changed. Refreshing..." | INFO | Auto-refresh | No | DEBUG |

---

*Document generated for AI-build Phase 06: Shop Floor Execution UX*
