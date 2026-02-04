# 86 - Safety KPI Cockpit Design

> **Document Version**: 1.0  
> **Date**: February 4, 2026  
> **Author**: Principal EHS Analytics Architect  
> **Status**: APPROVED FOR IMPLEMENTATION

---

## Executive Summary

This document defines the Safety KPI Cockpit—a real-time, role-aware dashboard that shifts safety management from **reactive investigation** to **proactive prevention**. The cockpit emphasizes **leading indicators** that predict incidents before they occur, integrates directly with dispatch/job execution to enforce safety blocks, and provides audit-ready evidence trails for regulatory compliance.

**Key Design Principles:**
1. Every metric must answer: *"What should I do next?"*
2. Leading indicators drive 80% of dashboard real estate
3. 1-click drill-down to evidence (photos, forms, signatures)
4. Role-based visibility—executives see trends, supervisors see actions
5. Real-time integration with dispatch engine (safety blocks production)

---

## A) Safety Philosophy: Leading vs Lagging

### Why Lagging Indicators Alone Fail

| Lagging Indicator Problem | Consequence |
|---------------------------|-------------|
| Measured after harm occurs | Learning comes too late |
| Low frequency events | Statistically unstable for small sites |
| Creates "zero incident complacency" | Near-misses ignored until injury |
| Reactive posture | Investigation-heavy, prevention-light |
| Gaming risk | Underreporting to maintain "clean" record |

**A site with "zero recordables" may have deteriorating inspections, expired training, and accumulating near-misses—all invisible until a catastrophic event.**

### How Leading Indicators Predict Incidents

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INCIDENT PREDICTION CHAIN                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  LEADING INDICATORS          →          LAGGING OUTCOMES            │
│                                                                     │
│  ┌──────────────────┐                                               │
│  │ Inspection Miss  │───┐                                           │
│  └──────────────────┘   │                                           │
│  ┌──────────────────┐   │    ┌───────────────┐    ┌─────────────┐  │
│  │ Training Expired │───┼───▶│   NEAR-MISS   │───▶│  INCIDENT   │  │
│  └──────────────────┘   │    └───────────────┘    └─────────────┘  │
│  ┌──────────────────┐   │                                           │
│  │ Permit Violation │───┘                                           │
│  └──────────────────┘                                               │
│                                                                     │
│  ◄──── INTERVENE HERE ────►  ◄── LEARN HERE ──►  ◄── TOO LATE ──►  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Behavioral Shift: Reaction → Prevention

| Traditional (Lagging-First) | KPI Cockpit (Leading-First) |
|-----------------------------|------------------------------|
| "We had 0 injuries this month" | "95% of inspections on-time, 3 assets overdue" |
| Investigate after injury | Intervene at near-miss pattern |
| Monthly safety meeting | Real-time supervisor alerts |
| Training tracked in spreadsheet | Dispatch blocks untrained operators |
| Permits filed in cabinet | Permit expiry blocks equipment |

### Indicator Classification

#### Leading Indicators (Predictive)
Measure **behaviors, exposures, and compliance states** that precede incidents:

| Category | Examples |
|----------|----------|
| **Compliance** | Inspection completion rate, permit validity, training currency |
| **Behavior** | Near-miss reporting rate, safety observations, stop-work usage |
| **Exposure** | Hours worked on high-risk operations, overtime on safety-critical assets |
| **Readiness** | Equipment inspection status, CAPA closure velocity, corrective action aging |

#### Lagging Indicators (Outcome)
Measure **results** after events occur:

| Category | Examples |
|----------|----------|
| **Injury** | Recordable count, lost-time events, severity rate |
| **Streaks** | Days since last recordable, days since lost-time |
| **Cost** | Workers' comp claims, property damage |

**Cockpit Rule**: Lagging indicators occupy ≤20% of dashboard space and are always paired with the leading indicators that could have predicted them.

---

## B) KPI Taxonomy

### Category Structure

```
SAFETY KPI TAXONOMY
├── 1. EXPOSURE & RISK
│   ├── High-Risk Hours Worked
│   ├── Overtime on Safety-Critical Operations
│   ├── Concurrent High-Risk Jobs
│   └── Equipment Risk Heat Score
│
├── 2. COMPLIANCE & READINESS
│   ├── Inspection Completion Rate
│   ├── Equipment Inspection Currency
│   ├── Permit Compliance Rate
│   ├── Policy Acknowledgment Rate
│   └── Audit Finding Closure Rate
│
├── 3. BEHAVIOR & CULTURE
│   ├── Near-Miss Reporting Rate
│   ├── Safety Observations per 100 Employees
│   ├── Positive Safety Observations %
│   ├── Stop-Work Initiation Rate
│   └── Safety Suggestion Implementation Rate
│
├── 4. EQUIPMENT & ASSET SAFETY
│   ├── Assets with Valid Inspection
│   ├── Time Since Last Inspection (by asset)
│   ├── Critical Asset Availability
│   ├── Maintenance Safety Compliance
│   └── Guard/Interlock Bypass Events
│
├── 5. INCIDENT SIGNALS (LAGGING)
│   ├── Recordable Incident Count
│   ├── Lost-Time Events
│   ├── Severity Proxy Score
│   ├── Days Since Last Recordable
│   └── Incident Recurrence Rate
│
├── 6. STOP-WORK EFFECTIVENESS
│   ├── Active Stop-Work Events
│   ├── Jobs Blocked by Safety
│   ├── Work Centers Blocked
│   ├── Stop-Work Resolution Time
│   ├── Override Attempt Count (should be 0)
│   └── SWA Root Cause Distribution
│
├── 7. TRAINING & COMPETENCY
│   ├── Operators with Current Training
│   ├── Training Expiry Forecast (30/60/90)
│   ├── Critical Qualification Coverage
│   ├── New Hire Safety Orientation Rate
│   └── Recertification Completion Rate
│
├── 8. OPERATIONAL INTEGRATION
│   ├── Dispatch Blocks Due to Safety
│   ├── Production Delay from Safety Holds
│   ├── Pre-Task Safety Verification Rate
│   └── Job Hazard Analysis Coverage
│
└── 9. TREND & FORECAST
    ├── Incident Risk Index (composite)
    ├── CAPA Closure Velocity
    ├── Leading Indicator Trend (7/30/90 day)
    ├── Seasonal Risk Adjustment
    └── Predictive Risk Score by Location
```

---

## C) KPI Definitions (Exhaustive)

### 1. EXPOSURE & RISK

---

#### KPI: High-Risk Hours Worked

| Attribute | Value |
|-----------|-------|
| **Name** | High-Risk Hours Worked |
| **Description** | Total labor hours logged on operations classified as high-risk (cutting, welding, crane, confined space) in the period |
| **Formula** | `SUM(hours) WHERE operation.riskLevel = 'HIGH'` |
| **Unit** | Hours |
| **Target** | Minimize; track trend |
| **Thresholds** | 🟢 ≤ baseline | 🟡 baseline + 10% | 🔴 baseline + 25% |
| **Role Responsible** | Ops Manager, EHS Manager |
| **Action When Red** | Review scheduling to distribute risk, add supervision, consider automation |

---

#### KPI: Equipment Risk Heat Score

| Attribute | Value |
|-----------|-------|
| **Name** | Equipment Risk Heat Score |
| **Description** | Composite score per asset: age + maintenance overdue + incident history + inspection gaps |
| **Formula** | `(ageFactor × 0.2) + (maintenanceOverdueDays × 0.3) + (incidentCount × 0.3) + (inspectionGapDays × 0.2)` |
| **Unit** | Score 0–100 |
| **Target** | All assets < 40 |
| **Thresholds** | 🟢 < 40 | 🟡 40–70 | 🔴 > 70 |
| **Role Responsible** | Maintenance Lead, EHS Manager |
| **Action When Red** | Immediate inspection, consider asset replacement, restrict usage |

---

### 2. COMPLIANCE & READINESS

---

#### KPI: Inspection Completion Rate (On-Time)

| Attribute | Value |
|-----------|-------|
| **Name** | % Inspections Completed On Time |
| **Description** | Percentage of scheduled inspections completed by their due date |
| **Formula** | `(inspectionsCompletedOnTime / inspectionsDue) × 100` |
| **Unit** | Percentage |
| **Target** | ≥ 98% |
| **Thresholds** | 🟢 ≥ 98% | 🟡 90–97% | 🔴 < 90% |
| **Role Responsible** | EHS Manager, Branch Manager |
| **Action When Red** | Reassign inspectors, escalate overdue list, block affected assets |

---

#### KPI: Equipment Inspection Currency

| Attribute | Value |
|-----------|-------|
| **Name** | % Equipment with Valid Inspection |
| **Description** | Percentage of assets with inspection completed within required interval |
| **Formula** | `(assetsWithCurrentInspection / totalInspectableAssets) × 100` |
| **Unit** | Percentage |
| **Target** | 100% |
| **Thresholds** | 🟢 100% | 🟡 95–99% | 🔴 < 95% |
| **Role Responsible** | Maintenance Lead, EHS Manager |
| **Action When Red** | Block overdue assets from dispatch, emergency inspection schedule |

---

#### KPI: Permit Compliance Rate

| Attribute | Value |
|-----------|-------|
| **Name** | Permit Compliance Rate (LOTO / Hot Work / Confined Space) |
| **Description** | Percentage of permit-required jobs that had valid permit before work started |
| **Formula** | `(jobsWithValidPermit / permitRequiredJobs) × 100` |
| **Unit** | Percentage |
| **Target** | 100% |
| **Thresholds** | 🟢 100% | 🟡 98–99% | 🔴 < 98% |
| **Role Responsible** | Supervisor, EHS Manager |
| **Action When Red** | Investigate gaps, retrain supervisors, system enforcement check |

---

#### KPI: Open CAPA Aging

| Attribute | Value |
|-----------|-------|
| **Name** | Open CAPA Aging (Average Days) |
| **Description** | Average age of open corrective/preventive actions |
| **Formula** | `AVG(today - capaOpenDate) WHERE capa.status = 'OPEN'` |
| **Unit** | Days |
| **Target** | < 30 days |
| **Thresholds** | 🟢 < 30 | 🟡 30–45 | 🔴 > 45 |
| **Role Responsible** | EHS Manager, CAPA Owner |
| **Action When Red** | Escalate to Branch Manager, resource reallocation, root cause review |

---

#### KPI: CAPA Overdue Count

| Attribute | Value |
|-----------|-------|
| **Name** | Overdue CAPA Count |
| **Description** | Number of CAPAs past their due date |
| **Formula** | `COUNT(capa) WHERE capa.dueDate < today AND capa.status != 'CLOSED'` |
| **Unit** | Count |
| **Target** | 0 |
| **Thresholds** | 🟢 0 | 🟡 1–3 | 🔴 > 3 |
| **Role Responsible** | EHS Manager |
| **Action When Red** | Daily stand-up until resolved, executive escalation at 7+ |

---

### 3. BEHAVIOR & CULTURE

---

#### KPI: Near-Miss Reporting Rate

| Attribute | Value |
|-----------|-------|
| **Name** | Near-Miss Reporting Rate |
| **Description** | Near-misses reported per 100 employees per month. Higher is better (indicates healthy reporting culture) |
| **Formula** | `(nearMissCount / employeeCount) × 100` |
| **Unit** | Per 100 employees |
| **Target** | ≥ 5.0 |
| **Thresholds** | 🟢 ≥ 5.0 | 🟡 2.0–4.9 | 🔴 < 2.0 |
| **Role Responsible** | EHS Manager, Supervisors |
| **Action When Red** | Reporting culture initiative, anonymous channels, recognition program |

---

#### KPI: Safety Observations per 100 Employees

| Attribute | Value |
|-----------|-------|
| **Name** | Safety Observations per 100 Employees |
| **Description** | Formal safety observations (positive + corrective) logged per 100 employees |
| **Formula** | `(observationCount / employeeCount) × 100` |
| **Unit** | Per 100 employees |
| **Target** | ≥ 10.0/month |
| **Thresholds** | 🟢 ≥ 10 | 🟡 5–9 | 🔴 < 5 |
| **Role Responsible** | Supervisors, EHS Manager |
| **Action When Red** | Supervisor observation quotas, gemba walks, leadership visibility |

---

#### KPI: Positive Observation Ratio

| Attribute | Value |
|-----------|-------|
| **Name** | % Positive Safety Observations |
| **Description** | Percentage of observations that are positive (safe behavior recognized) |
| **Formula** | `(positiveObservations / totalObservations) × 100` |
| **Unit** | Percentage |
| **Target** | ≥ 70% |
| **Thresholds** | 🟢 ≥ 70% | 🟡 50–69% | 🔴 < 50% |
| **Role Responsible** | Supervisors |
| **Action When Red** | Coaching on positive recognition, balanced observation training |

---

### 4. EQUIPMENT & ASSET SAFETY

---

#### KPI: Time Since Last Inspection (by Asset)

| Attribute | Value |
|-----------|-------|
| **Name** | Time Since Last Inspection (Asset-Level) |
| **Description** | Days since each asset was inspected, compared to required interval |
| **Formula** | `today - asset.lastInspectionDate` |
| **Unit** | Days |
| **Target** | ≤ required interval |
| **Thresholds** | 🟢 ≤ 80% interval | 🟡 80–100% | 🔴 > 100% (overdue) |
| **Role Responsible** | Maintenance Lead |
| **Action When Red** | Immediate inspection, block from dispatch if critical |

---

#### KPI: Guard/Interlock Bypass Events

| Attribute | Value |
|-----------|-------|
| **Name** | Guard/Interlock Bypass Events |
| **Description** | Count of logged guard bypass or interlock defeat events |
| **Formula** | `COUNT(bypassEvents)` |
| **Unit** | Count |
| **Target** | 0 |
| **Thresholds** | 🟢 0 | 🟡 1 | 🔴 ≥ 2 |
| **Role Responsible** | EHS Manager, Ops Manager |
| **Action When Red** | Immediate investigation, equipment lockout, disciplinary review |

---

### 5. INCIDENT SIGNALS (LAGGING)

---

#### KPI: Recordable Incident Count

| Attribute | Value |
|-----------|-------|
| **Name** | Recordable Incident Count |
| **Description** | Count of incidents meeting recordable criteria (internal classification, not OSHA-reported) |
| **Formula** | `COUNT(incidents) WHERE incident.classification = 'RECORDABLE'` |
| **Unit** | Count |
| **Target** | 0 |
| **Thresholds** | 🟢 0 | 🟡 1 | 🔴 ≥ 2 |
| **Role Responsible** | EHS Manager |
| **Action When Red** | Root cause analysis, executive notification, CAPA creation |

---

#### KPI: Days Since Last Recordable

| Attribute | Value |
|-----------|-------|
| **Name** | Days Since Last Recordable |
| **Description** | Running count of days since last recordable incident |
| **Formula** | `today - lastRecordableIncidentDate` |
| **Unit** | Days |
| **Target** | Maximize (trend) |
| **Thresholds** | Context-dependent (milestone recognition at 30/60/90/180/365) |
| **Role Responsible** | All |
| **Action When Red** | N/A (resets on incident) |

---

#### KPI: Severity Proxy Score

| Attribute | Value |
|-----------|-------|
| **Name** | Severity Proxy Score |
| **Description** | Weighted incident severity (first-aid=1, medical=5, restricted=10, lost-time=25) |
| **Formula** | `SUM(incident.weight)` by period |
| **Unit** | Score |
| **Target** | ≤ 10/quarter |
| **Thresholds** | 🟢 ≤ 10 | 🟡 11–25 | 🔴 > 25 |
| **Role Responsible** | EHS Manager |
| **Action When Red** | Pattern analysis, targeted intervention |

---

### 6. STOP-WORK EFFECTIVENESS

---

#### KPI: Active Stop-Work Events

| Attribute | Value |
|-----------|-------|
| **Name** | Active Stop-Work Events |
| **Description** | Count of currently active SWA events blocking work |
| **Formula** | `COUNT(swa) WHERE swa.status IN ('ACTIVE', 'UNDER_INVESTIGATION', 'MITIGATION_IN_PROGRESS')` |
| **Unit** | Count |
| **Target** | Minimize, but non-zero indicates system working |
| **Thresholds** | 🟢 0–2 | 🟡 3–5 | 🔴 > 5 |
| **Role Responsible** | EHS Manager, Ops Manager |
| **Action When Red** | Resource surge for clearance, pattern analysis |

---

#### KPI: Jobs Blocked by Safety

| Attribute | Value |
|-----------|-------|
| **Name** | Jobs Blocked by Safety (Count + Duration) |
| **Description** | Number of jobs currently blocked by safety holds and total block duration |
| **Formula** | `COUNT(jobs WHERE safetyHold = true), SUM(blockDuration)` |
| **Unit** | Count, Hours |
| **Target** | Minimize duration while maintaining safety |
| **Thresholds** | 🟢 < 4 hrs avg | 🟡 4–8 hrs | 🔴 > 8 hrs avg |
| **Role Responsible** | Ops Manager, EHS Manager |
| **Action When Red** | Expedite clearance, root cause of blocks |

---

#### KPI: Work Centers Blocked by Safety

| Attribute | Value |
|-----------|-------|
| **Name** | Work Centers Blocked by Safety |
| **Description** | Count of work centers currently blocked from dispatch |
| **Formula** | `COUNT(workCenters WHERE safetyBlock = true)` |
| **Unit** | Count |
| **Target** | 0 |
| **Thresholds** | 🟢 0 | 🟡 1 | 🔴 ≥ 2 |
| **Role Responsible** | Ops Manager |
| **Action When Red** | Prioritize clearance, reroute production |

---

#### KPI: Stop-Work Resolution Time

| Attribute | Value |
|-----------|-------|
| **Name** | Stop-Work Resolution Time (Average) |
| **Description** | Average time from SWA initiation to clearance |
| **Formula** | `AVG(swa.clearedAt - swa.initiatedAt)` |
| **Unit** | Hours |
| **Target** | < 4 hours |
| **Thresholds** | 🟢 < 4 hrs | 🟡 4–8 hrs | 🔴 > 8 hrs |
| **Role Responsible** | EHS Manager |
| **Action When Red** | Process improvement, resource allocation |

---

#### KPI: Override Attempt Count

| Attribute | Value |
|-----------|-------|
| **Name** | SWA Override Attempt Count |
| **Description** | Count of attempted overrides of stop-work authority (all should be rejected) |
| **Formula** | `COUNT(auditEntries) WHERE action = 'OVERRIDE_ATTEMPTED'` |
| **Unit** | Count |
| **Target** | 0 |
| **Thresholds** | 🟢 0 | 🟡 N/A | 🔴 ≥ 1 |
| **Role Responsible** | EHS Manager, Executive |
| **Action When Red** | Immediate investigation, disciplinary review, culture assessment |

---

### 7. TRAINING & COMPETENCY

---

#### KPI: Operators with Current Training

| Attribute | Value |
|-----------|-------|
| **Name** | % Operators with Current Training |
| **Description** | Percentage of operators with all required training certifications valid |
| **Formula** | `(operatorsFullyTrained / totalOperators) × 100` |
| **Unit** | Percentage |
| **Target** | 100% |
| **Thresholds** | 🟢 100% | 🟡 95–99% | 🔴 < 95% |
| **Role Responsible** | Training Admin, Supervisors |
| **Action When Red** | Block untrained operators from dispatch, schedule training |

---

#### KPI: Training Expiry Forecast

| Attribute | Value |
|-----------|-------|
| **Name** | Training Expiry Forecast (30/60/90 Days) |
| **Description** | Count of certifications expiring in next 30/60/90 days |
| **Formula** | `COUNT(certs) WHERE expiryDate BETWEEN today AND today + 30/60/90` |
| **Unit** | Count |
| **Target** | Manage proactively |
| **Thresholds** | 🟢 < 5 (30-day) | 🟡 5–10 | 🔴 > 10 |
| **Role Responsible** | Training Admin |
| **Action When Red** | Schedule training sessions, notify supervisors |

---

#### KPI: Critical Qualification Coverage

| Attribute | Value |
|-----------|-------|
| **Name** | Critical Qualification Coverage |
| **Description** | For each critical skill (crane, forklift, LOTO), percentage of required operators qualified |
| **Formula** | `(qualifiedOperators / requiredCoverage) × 100` by skill |
| **Unit** | Percentage |
| **Target** | ≥ 150% (redundancy) |
| **Thresholds** | 🟢 ≥ 150% | 🟡 100–149% | 🔴 < 100% |
| **Role Responsible** | Ops Manager, Training Admin |
| **Action When Red** | Cross-training initiative, hiring |

---

### 8. OPERATIONAL INTEGRATION

---

#### KPI: Dispatch Blocks Due to Safety

| Attribute | Value |
|-----------|-------|
| **Name** | Dispatch Blocks Due to Safety |
| **Description** | Count of dispatch attempts blocked by safety system |
| **Formula** | `COUNT(dispatchAttempts) WHERE blocked = true AND blockReason = 'SAFETY'` |
| **Unit** | Count |
| **Target** | Track trend (system working correctly) |
| **Thresholds** | Context-dependent |
| **Role Responsible** | Ops Manager |
| **Action When Red** | Address root causes of blocks |

---

#### KPI: Pre-Task Safety Verification Rate

| Attribute | Value |
|-----------|-------|
| **Name** | Pre-Task Safety Verification Rate |
| **Description** | Percentage of jobs with completed pre-task safety check before start |
| **Formula** | `(jobsWithPreTaskCheck / totalJobsStarted) × 100` |
| **Unit** | Percentage |
| **Target** | 100% |
| **Thresholds** | 🟢 ≥ 98% | 🟡 90–97% | 🔴 < 90% |
| **Role Responsible** | Supervisors |
| **Action When Red** | Enforce pre-task requirement, system check |

---

### 9. TREND & FORECAST

---

#### KPI: Incident Risk Index (Composite)

| Attribute | Value |
|-----------|-------|
| **Name** | Incident Risk Index |
| **Description** | Composite score predicting incident likelihood based on leading indicators |
| **Formula** | See formula below |
| **Unit** | Score 0–100 |
| **Target** | < 30 |
| **Thresholds** | 🟢 < 30 | 🟡 30–60 | 🔴 > 60 |
| **Role Responsible** | EHS Manager, Executive |
| **Action When Red** | Targeted intervention on worst-performing indicators |

**Incident Risk Index Formula:**
```
IRI = (
  (100 - InspectionCompletionRate) × 0.20 +
  (100 - TrainingComplianceRate) × 0.20 +
  (100 - PermitComplianceRate) × 0.15 +
  (OverdueCAPA_Count × 5) × 0.15 +
  (100 - NearMissReportingRate × 10) × 0.15 +
  (ActiveStopWorkEvents × 10) × 0.15
)
```

---

#### KPI: CAPA Closure Velocity

| Attribute | Value |
|-----------|-------|
| **Name** | CAPA Closure Velocity |
| **Description** | Rate of CAPA closures vs new CAPAs opened (rolling 30 days) |
| **Formula** | `capasClosed30Days / capasOpened30Days` |
| **Unit** | Ratio |
| **Target** | ≥ 1.2 (closing faster than opening) |
| **Thresholds** | 🟢 ≥ 1.2 | 🟡 0.8–1.19 | 🔴 < 0.8 |
| **Role Responsible** | EHS Manager |
| **Action When Red** | CAPA backlog reduction sprint |

---

#### KPI: Leading Indicator Trend

| Attribute | Value |
|-----------|-------|
| **Name** | Leading Indicator Trend (7/30/90 Day) |
| **Description** | Directional trend of composite leading indicators |
| **Formula** | Linear regression slope of IRI over period |
| **Unit** | Trend direction |
| **Target** | Improving (negative slope) |
| **Thresholds** | 🟢 Improving | 🟡 Flat | 🔴 Deteriorating |
| **Role Responsible** | EHS Manager, Executive |
| **Action When Red** | Root cause of deterioration, resource allocation |

---

## D) Role-Based Dashboards

### D.1 Executive Dashboard (CEO / COO / Board)

**Design Goal**: Confidence in safety posture in < 60 seconds. No operational noise.

| Widget | Type | Content |
|--------|------|---------|
| **Safety Confidence Score** | Large Gauge | Incident Risk Index (0–100, color-coded) |
| **Days Since Last Recordable** | Big Number | Prominent counter with milestone markers |
| **Leading vs Lagging Trend** | Dual Sparkline | 90-day trend of IRI vs incident count |
| **Active Stop-Work Events** | Badge | Count with severity breakdown |
| **Training Compliance** | Donut | % trained with expiry forecast ring |
| **Inspection Compliance** | Donut | % on-time with overdue count |
| **Location Risk Heatmap** | Map/Grid | Sites colored by risk index |
| **CAPA Health** | Bar | Open vs Overdue vs Closed (30 days) |
| **Near-Miss Rate Trend** | Sparkline | 12-month trend (higher = healthier) |
| **Top 3 Risks** | List | Highest-risk items requiring attention |

**Filters**: Date range, All Locations / Single Location  
**Default View**: Rolling 30 days, all locations  
**Drill-Down**: Click any widget → EHS Manager detail view

---

### D.2 EHS Manager Dashboard

**Design Goal**: Full compliance visibility with actionable queues.

| Widget | Type | Content |
|--------|------|---------|
| **Incident Risk Index** | Gauge | With component breakdown |
| **Active Incidents** | Table | Open incidents with status, assignee, age |
| **CAPA Queue** | Table | Open CAPAs sorted by due date, owner |
| **Overdue Inspections** | Table | By asset, days overdue, responsible |
| **Expiring Training** | Table | By employee, certification, days until expiry |
| **Permit Status** | Cards | Active permits with expiry countdown |
| **Stop-Work Events** | Table | Active SWAs with status, duration |
| **Observation Trends** | Chart | Weekly observation count + type breakdown |
| **Near-Miss Analysis** | Chart | By category, location, trend |
| **Audit Readiness Score** | Gauge | Composite compliance posture |

**Filters**: Location, Date range, Incident type, CAPA status  
**Default View**: Current open items  
**Export**: PDF compliance report, Excel data export

---

### D.3 Branch Manager Dashboard

**Design Goal**: Local site risk with actionable overdue items.

| Widget | Type | Content |
|--------|------|---------|
| **Site Risk Score** | Gauge | Branch-specific IRI |
| **Days Since Last Incident** | Big Number | Site-specific |
| **Overdue Actions** | Priority List | Inspections, CAPAs, training for this branch |
| **Equipment Readiness** | Progress Bar | % assets inspection-current |
| **Training Compliance** | Progress Bar | % operators fully trained |
| **Active Stop-Works** | Badge | Count affecting this branch |
| **Recent Incidents** | Timeline | Last 5 incidents at branch |
| **Supervisor Scorecard** | Table | Observation counts, training status by supervisor |

**Filters**: Date range  
**Default View**: Current status

---

### D.4 Ops Manager Dashboard

**Design Goal**: Safety impacts on production.

| Widget | Type | Content |
|--------|------|---------|
| **Production Blocked by Safety** | Big Number | Jobs currently held |
| **Block Duration** | Chart | Hours blocked by category |
| **Work Centers Blocked** | List | With reason and estimated clearance |
| **Operator Availability** | Table | Operators blocked by training/permit |
| **Equipment Out of Service** | Table | Assets blocked by inspection/safety |
| **Stop-Work Impact** | Chart | Production hours lost to SWA (trend) |
| **Pre-Task Compliance** | Gauge | % jobs with safety verification |
| **Upcoming Training Gaps** | Alert | Operators expiring in 30 days |

**Filters**: Work center, Date range  
**Default View**: Real-time status

---

### D.5 Supervisor Dashboard

**Design Goal**: Team-level actions and immediate interventions.

| Widget | Type | Content |
|--------|------|---------|
| **My Team Training** | Table | Each operator, certifications, expiry |
| **Today's Inspections** | Checklist | Assigned inspections for today |
| **Open Observations** | Queue | Observations needing follow-up |
| **Recent Near-Misses** | List | Near-misses in my area (7 days) |
| **Stop-Work Alerts** | Banner | Any active SWA affecting my area |
| **Pre-Task Checklist** | Button | Launch pre-task verification |
| **Quick Report** | Buttons | Log observation, near-miss, hazard |

**Filters**: Shift, Area  
**Default View**: Current shift

---

### D.6 Insurance / Audit View (Read-Only)

**Design Goal**: Compliance evidence for external stakeholders.

| Widget | Type | Content |
|--------|------|---------|
| **Compliance Scorecard** | Summary | Overall compliance percentages |
| **Incident History** | Table | Incidents with classification, status (12 months) |
| **Training Records** | Table | All training with completion dates |
| **Inspection Records** | Table | All inspections with results |
| **CAPA History** | Table | All CAPAs with closure status |
| **Permit Archive** | Table | Permit history with documentation |
| **Audit Trail** | Log | Immutable action log |
| **Export** | Button | Generate audit package (PDF) |

**Filters**: Date range, Location, Record type  
**Access**: Read-only, no edit capability

---

## E) Alerts & Escalations

### E.1 Alert Categories

#### Threshold-Based Alerts

| Condition | Alert | Notify | Channel |
|-----------|-------|--------|---------|
| Inspection completion < 90% | INSPECTION_COMPLIANCE_LOW | EHS Manager | UI Badge, Email |
| Training compliance < 95% | TRAINING_COMPLIANCE_LOW | Training Admin, Supervisors | UI Badge, Email |
| Equipment inspection overdue | INSPECTION_OVERDUE | Maintenance Lead | UI Badge |
| CAPA overdue | CAPA_OVERDUE | CAPA Owner, EHS Manager | UI Badge, Email |
| Override attempt detected | OVERRIDE_ATTEMPTED | EHS Manager, Executive | UI Alert, Email, Slack |

#### Time-Based Alerts (Aging)

| Condition | Alert | Escalation |
|-----------|-------|------------|
| CAPA open > 30 days | CAPA_AGING_WARNING | Email to owner |
| CAPA open > 45 days | CAPA_AGING_ESCALATE | Email to EHS Manager |
| CAPA open > 60 days | CAPA_AGING_CRITICAL | Email to Branch Manager |
| Stop-Work active > 8 hours | SWA_EXTENDED | EHS Manager, Ops Manager |
| Stop-Work active > 24 hours | SWA_CRITICAL | Executive notification |

#### Trend-Based Alerts (Deterioration)

| Condition | Alert | Notify |
|-----------|-------|--------|
| IRI increasing 3 consecutive weeks | RISK_TREND_DETERIORATING | EHS Manager |
| Near-miss rate declining > 30% | REPORTING_CULTURE_CONCERN | EHS Manager |
| Inspection completion declining | COMPLIANCE_TREND_DOWN | Branch Manager |

### E.2 Escalation Ladder

```
┌─────────────────────────────────────────────────────────────────┐
│                    ESCALATION LADDER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LEVEL 1 (Immediate)     → Responsible Individual               │
│  ────────────────────       - UI Badge                          │
│                             - Dashboard highlight               │
│                                                                  │
│  LEVEL 2 (24 hours)      → Direct Supervisor                    │
│  ────────────────────       - Email notification                │
│                             - Dashboard escalation flag         │
│                                                                  │
│  LEVEL 3 (48 hours)      → EHS Manager                          │
│  ────────────────────       - Email + Slack                     │
│                             - Daily report inclusion            │
│                                                                  │
│  LEVEL 4 (72 hours)      → Branch Manager                       │
│  ────────────────────       - Email + call escalation           │
│                             - Executive dashboard flag          │
│                                                                  │
│  LEVEL 5 (1 week)        → Executive / VP Operations            │
│  ────────────────────       - Direct notification               │
│                             - Board-level visibility            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### E.3 Notification Channels

| Channel | Use Case | Latency |
|---------|----------|---------|
| **UI Badge** | All alerts | Real-time |
| **Dashboard Highlight** | Active issues | Real-time |
| **Email** | Escalations, daily summaries | Minutes |
| **Slack/Teams** | Critical alerts, stop-work | Real-time |
| **SMS** | Critical stop-work, serious incidents | Real-time |
| **Push Notification** | Mobile app alerts | Real-time |

---

## F) Drill-Down & Evidence Model

### F.1 Drill-Down Paths

Every KPI supports 1-click drill-down following this pattern:

```
KPI Tile → Summary List → Individual Record → Evidence Package
```

#### Examples

**Inspection Completion Rate (95%)**
```
KPI: 95% Inspections Complete
  └─▶ List: 12 overdue inspections
        └─▶ Inspection: Crane Monthly - Bay 3
              └─▶ Evidence:
                    - Previous inspection form (PDF)
                    - Photos from last inspection
                    - Deficiency log
                    - Assigned inspector signature
                    - Due date calculation
```

**Training Compliance (97%)**
```
KPI: 97% Training Compliance
  └─▶ List: 5 operators with expired certifications
        └─▶ Operator: John Smith
              └─▶ Certifications:
                    - LOTO (Expired 2026-01-15)
                        └─▶ Original cert document
                        └─▶ Training record
                        └─▶ Test score
                        └─▶ Instructor signature
```

**Stop-Work Resolution Time (6.5 hrs)**
```
KPI: 6.5 hr avg resolution
  └─▶ List: Stop-work events (last 30 days)
        └─▶ SWA-2026-001: Missing LOTO Permit
              └─▶ Audit Trail:
                    - Initiation timestamp + initiator
                    - Status changes
                    - Clearance steps completed
                    - Evidence uploaded
                    - Final clearance signature
                    - Hash chain verification
```

### F.2 Evidence Types

| Evidence Type | Format | Storage | Retention |
|---------------|--------|---------|-----------|
| Inspection Forms | PDF, JSON | Supabase Storage | 7 years |
| Photos | JPEG, PNG | Supabase Storage | 7 years |
| Signatures | Digital signature | Database | 7 years |
| Permits | PDF | Supabase Storage | 7 years |
| Training Certificates | PDF | Supabase Storage | 7 years |
| Incident Reports | PDF, JSON | Database | 30 years |
| Audit Logs | JSON | Immutable table | Permanent |
| Video | MP4 | Supabase Storage | 1 year |

### F.3 Evidence Integrity

All evidence records include:
- **Timestamp**: When uploaded/created
- **Uploader**: Who added the evidence
- **Hash**: SHA-256 of content
- **Chain Reference**: Previous record hash (audit entries)
- **Geolocation**: Where captured (if mobile)

**Export for Audit:**
```
/api/safety/audit-package?startDate=2025-01-01&endDate=2025-12-31&location=BRANCH-001
```
Returns ZIP containing:
- Incident records (PDF)
- Inspection records (PDF)
- Training records (PDF)
- CAPA records (PDF)
- Permit records (PDF)
- Audit trail (CSV)
- Evidence files
- Integrity verification report

---

## G) UI Layout (Material UI)

### G.1 Grid System

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER BAR                                                              │
│  [Logo] Safety KPI Cockpit    [Location ▼] [Date Range ▼] [Refresh] [⚙] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │              │ │              │ │              │ │              │    │
│  │  KPI TILE 1  │ │  KPI TILE 2  │ │  KPI TILE 3  │ │  KPI TILE 4  │    │
│  │  (3 cols)    │ │  (3 cols)    │ │  (3 cols)    │ │  (3 cols)    │    │
│  │              │ │              │ │              │ │              │    │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘    │
│                                                                          │
│  ┌────────────────────────────────────┐ ┌────────────────────────────┐  │
│  │                                    │ │                            │  │
│  │  MAIN CHART / HEATMAP              │ │  ACTION QUEUE              │  │
│  │  (8 cols)                          │ │  (4 cols)                  │  │
│  │                                    │ │                            │  │
│  │                                    │ │                            │  │
│  └────────────────────────────────────┘ └────────────────────────────┘  │
│                                                                          │
│  ┌────────────────────────┐ ┌────────────────────┐ ┌────────────────┐   │
│  │                        │ │                    │ │                │   │
│  │  TABLE 1               │ │  TABLE 2           │ │  TREND CHART   │   │
│  │  (4 cols)              │ │  (4 cols)          │ │  (4 cols)      │   │
│  │                        │ │                    │ │                │   │
│  └────────────────────────┘ └────────────────────┘ └────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

Grid: 12 columns, 16px gutters
Breakpoints: xs=0, sm=600, md=900, lg=1200, xl=1536
```

### G.2 Component Specifications

#### KPI Tile (Card)

```jsx
<Card sx={{ height: '100%', cursor: 'pointer' }}>
  <CardContent>
    <Stack direction="row" justifyContent="space-between">
      <Box>
        <Typography variant="overline" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h3" color={statusColor}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
        <Stack direction="row" spacing={0.5}>
          {trend === 'up' ? <TrendingUp color="success" /> : <TrendingDown color="error" />}
          <Typography variant="caption">{trendValue}</Typography>
        </Stack>
      </Box>
      <Avatar sx={{ bgcolor: alpha(statusColor, 0.1) }}>
        <Icon />
      </Avatar>
    </Stack>
  </CardContent>
</Card>
```

#### Status Colors

| Status | Color | Hex | Usage |
|--------|-------|-----|-------|
| **Green** (Good) | success.main | #2e7d32 | Target met, healthy |
| **Yellow** (Warning) | warning.main | #ed6c02 | Approaching threshold |
| **Red** (Critical) | error.main | #d32f2f | Threshold breached |
| **Blue** (Info) | info.main | #0288d1 | Neutral, informational |
| **Grey** (Inactive) | grey.500 | #9e9e9e | No data, disabled |

#### Gauge Component

```jsx
<Box sx={{ position: 'relative', display: 'inline-flex' }}>
  <CircularProgress
    variant="determinate"
    value={normalizedValue}
    size={120}
    thickness={8}
    sx={{ color: statusColor }}
  />
  <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Typography variant="h4" fontWeight={700}>
      {value}
    </Typography>
  </Box>
</Box>
```

#### Sparkline Trend

```jsx
// Using recharts or lightweight sparkline library
<ResponsiveContainer width="100%" height={40}>
  <LineChart data={trendData}>
    <Line type="monotone" dataKey="value" stroke={trendColor} strokeWidth={2} dot={false} />
  </LineChart>
</ResponsiveContainer>
```

#### Action Queue Table

```jsx
<TableContainer component={Paper}>
  <Table size="small">
    <TableHead>
      <TableRow>
        <TableCell>Item</TableCell>
        <TableCell>Due</TableCell>
        <TableCell>Owner</TableCell>
        <TableCell>Status</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {items.map((item) => (
        <TableRow key={item.id} hover onClick={() => drillDown(item)}>
          <TableCell>{item.title}</TableCell>
          <TableCell>
            <Chip 
              size="small" 
              label={item.dueIn} 
              color={item.overdue ? 'error' : 'default'} 
            />
          </TableCell>
          <TableCell>{item.owner}</TableCell>
          <TableCell>
            <Chip size="small" label={item.status} color={statusColors[item.status]} />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
```

#### Location Heatmap

```jsx
<Grid container spacing={1}>
  {locations.map((loc) => (
    <Grid item xs={4} key={loc.id}>
      <Card 
        sx={{ 
          bgcolor: riskColor(loc.riskScore),
          cursor: 'pointer',
          '&:hover': { transform: 'scale(1.02)' }
        }}
        onClick={() => drillDown(loc)}
      >
        <CardContent sx={{ textAlign: 'center', py: 1 }}>
          <Typography variant="subtitle2" color="white">
            {loc.name}
          </Typography>
          <Typography variant="h5" color="white" fontWeight={700}>
            {loc.riskScore}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  ))}
</Grid>
```

### G.3 Interaction Patterns

| Interaction | Behavior |
|-------------|----------|
| **Hover on KPI** | Show tooltip with formula and last update |
| **Click on KPI** | Navigate to drill-down view |
| **Hover on table row** | Highlight row |
| **Click on table row** | Open detail drawer/modal |
| **Click on sparkline** | Expand to full chart view |
| **Click on heatmap cell** | Filter dashboard to that location |
| **Click on alert** | Navigate to source record |

### G.4 Responsive Behavior

| Breakpoint | KPI Tiles | Tables | Charts |
|------------|-----------|--------|--------|
| **xl (1536+)** | 4 per row | Full width | Full width |
| **lg (1200+)** | 4 per row | Full width | Full width |
| **md (900+)** | 2 per row | Scrollable | 50% width |
| **sm (600+)** | 2 per row | Scrollable | Full width |
| **xs (0+)** | 1 per row | Card view | Full width |

---

## H) Data Sources & Refresh Rules

### H.1 KPI-to-Data Source Mapping

| KPI | Primary Table(s) | Joins |
|-----|------------------|-------|
| Inspection Completion Rate | `inspections` | `assets`, `users` |
| Equipment Inspection Currency | `assets`, `inspections` | - |
| Permit Compliance Rate | `permits`, `jobs` | `operations` |
| Open CAPA Aging | `capas` | `incidents`, `users` |
| Near-Miss Reporting Rate | `incidents` | `users` |
| Safety Observations | `observations` | `users`, `locations` |
| Operators with Current Training | `training_records`, `users` | `certifications` |
| Training Expiry Forecast | `training_records` | `users`, `certifications` |
| Active Stop-Work Events | `stop_work_events` | `jobs`, `work_centers` |
| Jobs Blocked by Safety | `jobs`, `stop_work_events` | - |
| Work Centers Blocked | `work_centers`, `stop_work_events` | - |
| Stop-Work Resolution Time | `stop_work_events` | - |
| Recordable Incident Count | `incidents` | - |
| Days Since Last Recordable | `incidents` | - |
| Incident Risk Index | *Computed* | Multiple |

### H.2 Refresh Frequencies

| Data Category | Refresh | Reason |
|---------------|---------|--------|
| **Stop-Work Events** | Real-time | Blocks production immediately |
| **Active Incidents** | Real-time | Requires immediate response |
| **Permit Status** | Real-time | Affects work authorization |
| **Dispatch Blocks** | Real-time | Production impact |
| **Inspection Completion** | 15 minutes | Near real-time compliance |
| **Training Compliance** | Hourly | Certification changes infrequent |
| **CAPA Aging** | Hourly | Status changes throughout day |
| **KPI Aggregates** | Hourly | Dashboard performance |
| **Trend Calculations** | Daily (overnight) | Historical analysis |
| **Risk Index** | Hourly | Composite requires all inputs |

### H.3 Aggregation Rules

| Metric | Aggregation | Timeframes |
|--------|-------------|------------|
| Inspection Completion | Rolling 30 days | 7d, 30d, 90d, YTD |
| Near-Miss Rate | Monthly average | Month, Quarter, Year |
| Incident Count | Sum by period | MTD, QTD, YTD |
| CAPA Aging | Point-in-time + trend | Current, 30d trend |
| Training Compliance | Point-in-time | Current |
| Risk Index | Point-in-time | Current, 7d avg, 30d avg |

### H.4 Historical Retention

| Data Type | Hot Storage | Warm Storage | Cold/Archive |
|-----------|-------------|--------------|--------------|
| KPI Snapshots | 90 days | 2 years | 7 years |
| Incidents | 2 years | 7 years | 30 years |
| Inspections | 1 year | 7 years | 7 years |
| Training Records | 2 years | 7 years | 30 years |
| Permits | 1 year | 7 years | 7 years |
| Audit Logs | 1 year | 7 years | Permanent |

---

## I) Testing & Validation

### I.1 KPI Accuracy Tests

| Test | Method | Frequency |
|------|--------|-----------|
| **Formula Verification** | Compare dashboard value to manual SQL calculation | Weekly |
| **Threshold Consistency** | Verify color matches threshold rules | On deploy |
| **Data Freshness** | Verify "Last Updated" timestamp accuracy | Daily |
| **Boundary Conditions** | Test 0%, 100%, null data scenarios | On deploy |
| **Historical Consistency** | Compare current aggregates to historical snapshots | Weekly |

### I.2 Threshold Validation

```javascript
// Unit test example
describe('Inspection Completion Rate', () => {
  it('should show GREEN when >= 98%', () => {
    expect(getStatusColor(98)).toBe('success');
    expect(getStatusColor(100)).toBe('success');
  });
  
  it('should show YELLOW when 90-97%', () => {
    expect(getStatusColor(90)).toBe('warning');
    expect(getStatusColor(97)).toBe('warning');
  });
  
  it('should show RED when < 90%', () => {
    expect(getStatusColor(89)).toBe('error');
    expect(getStatusColor(0)).toBe('error');
  });
});
```

### I.3 Role Visibility Tests

| Role | Test | Expected |
|------|------|----------|
| Executive | Can view all locations aggregate | ✓ |
| Executive | Cannot view individual employee names | ✓ |
| EHS Manager | Can view all detail tables | ✓ |
| EHS Manager | Can export audit package | ✓ |
| Branch Manager | Can only view assigned location | ✓ |
| Branch Manager | Cannot view other locations | ✓ |
| Supervisor | Can only view assigned team | ✓ |
| Audit (External) | Read-only, no edit buttons visible | ✓ |

### I.4 Drill-Down Integrity Tests

| Test | Verification |
|------|--------------|
| KPI sum matches detail count | `SUM(detail.count) === kpi.value` |
| All records have evidence | `COUNT(records_without_evidence) === 0` |
| Timestamps are chronological | `createdAt <= updatedAt` for all records |
| Hash chain is intact | Verify SHA-256 chain for audit entries |
| No orphaned records | All FK references resolve |

### I.5 Performance Tests

| Metric | Target | Test Method |
|--------|--------|-------------|
| Dashboard initial load | < 2 seconds | Lighthouse, k6 |
| KPI tile render | < 500ms each | React DevTools |
| Drill-down navigation | < 1 second | End-to-end test |
| Large table scroll (1000 rows) | 60fps | Chrome DevTools |
| Concurrent users (50) | No degradation | Load test |

---

## J) Adoption & Governance

### J.1 Review Cadences

| Stakeholder | Review | Frequency | Focus |
|-------------|--------|-----------|-------|
| **Executive Team** | Safety Scorecard Review | Monthly | Risk trends, confidence, incidents |
| **EHS Manager** | Compliance Review | Weekly | Overdue items, CAPA status |
| **Branch Managers** | Site Safety Huddle | Weekly | Local actions, upcoming expirations |
| **Supervisors** | Shift Start Safety | Daily | Today's inspections, active SWAs |
| **Full Leadership** | Quarterly Safety Summit | Quarterly | Strategic safety initiatives |

### J.2 KPI Ownership Matrix

| KPI Category | Owner | Accountable | Consulted | Informed |
|--------------|-------|-------------|-----------|----------|
| Incident Metrics | EHS Manager | COO | Branch Managers | Board |
| Inspection Metrics | EHS Manager | Branch Managers | Maintenance | Ops |
| Training Metrics | Training Admin | HR Director | Supervisors | EHS |
| Stop-Work Metrics | EHS Manager | Ops Manager | Supervisors | Executive |
| CAPA Metrics | EHS Manager | CAPA Owners | Quality | Executive |
| Risk Index | EHS Manager | COO | All | Board |

### J.3 Change Management for Metrics

#### Adding a New KPI

1. **Proposal**: Submit KPI definition document (name, formula, thresholds, owner)
2. **Review**: EHS Manager + Ops Manager review for actionability
3. **Approval**: COO approval for executive-visible KPIs
4. **Implementation**: Development sprint
5. **Validation**: 30-day parallel run vs manual calculation
6. **Rollout**: Training + documentation
7. **Baseline**: Establish 90-day baseline before threshold enforcement

#### Modifying a Threshold

1. **Justification**: Document why threshold change is needed
2. **Impact Analysis**: How many records currently in each zone
3. **Approval**: EHS Manager (operational KPIs), COO (executive KPIs)
4. **Communication**: 30-day notice before change
5. **Implementation**: Update + document effective date
6. **Audit Trail**: Log threshold change in system

#### Retiring a KPI

1. **Justification**: Why KPI is no longer actionable
2. **Replacement**: What replaces it (if anything)
3. **Approval**: EHS Manager + COO
4. **Archival**: Retain historical data per retention policy
5. **Documentation**: Update governance docs

### J.4 Dashboard Access Control

| Role | Dashboard Access | Export | Edit Thresholds |
|------|------------------|--------|-----------------|
| Executive | Executive, Audit | PDF | No |
| EHS Manager | All | All formats | Yes (with approval) |
| Branch Manager | Branch, Audit | PDF, Excel | No |
| Ops Manager | Ops, Branch | PDF | No |
| Supervisor | Supervisor | No | No |
| Audit (External) | Audit only | PDF (watermarked) | No |

### J.5 Training Requirements

| Role | Training | Duration | Frequency |
|------|----------|----------|-----------|
| Executive | Dashboard Overview | 30 min | Annual |
| EHS Manager | Full System Training | 4 hours | On hire + annual |
| Branch Manager | Dashboard + Drill-Down | 2 hours | On hire + annual |
| Supervisor | Daily Dashboard | 1 hour | On hire |
| New Employee | Safety Reporting | 30 min | On hire |

---

## Appendix A: KPI Quick Reference

| KPI | Formula | 🟢 | 🟡 | 🔴 | Owner |
|-----|---------|-----|-----|-----|-------|
| Inspection Completion | completed/due × 100 | ≥98% | 90-97% | <90% | EHS Mgr |
| Equipment Inspection Currency | current/total × 100 | 100% | 95-99% | <95% | Maint Lead |
| Permit Compliance | valid/required × 100 | 100% | 98-99% | <98% | Supervisor |
| Open CAPA Aging | avg days open | <30 | 30-45 | >45 | EHS Mgr |
| CAPA Overdue Count | count past due | 0 | 1-3 | >3 | EHS Mgr |
| Near-Miss Rate | per 100 employees | ≥5.0 | 2-4.9 | <2.0 | EHS Mgr |
| Observations per 100 | count/100 employees | ≥10 | 5-9 | <5 | Supervisors |
| Training Compliance | % fully trained | 100% | 95-99% | <95% | Training |
| Active Stop-Works | count | 0-2 | 3-5 | >5 | EHS Mgr |
| SWA Resolution Time | avg hours | <4 | 4-8 | >8 | EHS Mgr |
| Override Attempts | count | 0 | N/A | ≥1 | Executive |
| Incident Risk Index | composite | <30 | 30-60 | >60 | EHS Mgr |
| CAPA Closure Velocity | closed/opened ratio | ≥1.2 | 0.8-1.2 | <0.8 | EHS Mgr |

---

## Appendix B: Alert Configuration

```yaml
alerts:
  inspection_overdue:
    condition: "inspection.dueDate < NOW() AND inspection.status != 'COMPLETED'"
    severity: warning
    escalation:
      - level: 1
        delay: 0
        notify: [inspection.assignee]
        channel: [ui_badge]
      - level: 2
        delay: 24h
        notify: [supervisor]
        channel: [ui_badge, email]
      - level: 3
        delay: 72h
        notify: [ehs_manager]
        channel: [email, slack]
        action: block_asset_from_dispatch
  
  training_expired:
    condition: "training.expiryDate < NOW()"
    severity: error
    escalation:
      - level: 1
        delay: 0
        notify: [employee, supervisor]
        channel: [ui_badge, email]
        action: block_operator_from_dispatch
  
  capa_overdue:
    condition: "capa.dueDate < NOW() AND capa.status != 'CLOSED'"
    severity: warning
    escalation:
      - level: 1
        delay: 0
        notify: [capa.owner]
        channel: [ui_badge]
      - level: 2
        delay: 7d
        notify: [ehs_manager]
        channel: [email]
      - level: 3
        delay: 14d
        notify: [branch_manager]
        channel: [email, slack]
  
  override_attempted:
    condition: "audit.action = 'OVERRIDE_ATTEMPTED'"
    severity: critical
    escalation:
      - level: 1
        delay: 0
        notify: [ehs_manager, coo]
        channel: [ui_alert, email, slack, sms]
```

---

## Appendix C: Data Model Extensions

```prisma
// Additional models for KPI Cockpit

model KpiSnapshot {
  id          String   @id @default(uuid())
  kpiName     String
  value       Float
  status      String   // GREEN, YELLOW, RED
  locationId  String?
  capturedAt  DateTime @default(now())
  metadata    Json?
  
  @@index([kpiName, capturedAt])
  @@index([locationId, capturedAt])
}

model AlertInstance {
  id            String    @id @default(uuid())
  alertType     String
  severity      String    // WARNING, ERROR, CRITICAL
  status        String    // ACTIVE, ACKNOWLEDGED, RESOLVED
  sourceType    String    // INSPECTION, TRAINING, CAPA, SWA
  sourceId      String
  message       String
  escalationLevel Int     @default(1)
  createdAt     DateTime  @default(now())
  acknowledgedAt DateTime?
  acknowledgedBy String?
  resolvedAt    DateTime?
  resolvedBy    String?
  
  @@index([status, createdAt])
  @@index([sourceType, sourceId])
}

model DashboardPreference {
  id          String   @id @default(uuid())
  userId      String
  dashboardId String
  layout      Json     // Widget positions, visibility
  filters     Json     // Default filters
  updatedAt   DateTime @updatedAt
  
  @@unique([userId, dashboardId])
}
```

---

## Document Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| EHS Director | _________________ | _______ | _________ |
| VP Operations | _________________ | _______ | _________ |
| CTO | _________________ | _______ | _________ |
| COO | _________________ | _______ | _________ |

---

*This document defines the complete Safety KPI Cockpit specification. Implementation should follow the phased approach: Core KPIs (Phase 1), Role Dashboards (Phase 2), Alerts & Escalations (Phase 3), Advanced Analytics (Phase 4).*
